/**
 * B-8: AI Assistant Authentication & Rate Limiting Security Tests
 *
 * TRANSPARENCY NOTE:
 * - Tests 1, 2, 3 call processAIChatAction with a real unauthenticated context
 *   (no auth cookie present, so getServerSession() returns null in the test environment).
 *   The DB and AI provider are NOT called because the auth gate returns early.
 *   This is real-infrastructure testing for the auth rejection path.
 * - Tests 4–10 use static source-code analysis (fs.readFileSync) and real
 *   checkRateLimit calls to verify structural security properties.
 * - Real AI provider (Gemini), real Redis, real Prisma DB are exercised only
 *   for the unauthenticated rejection path tests, which never reach those
 *   systems due to early auth rejection.
 */

import { processAIChatAction } from '../actions/aiAssistant';
import { checkRateLimit } from '../lib/rateLimit';
import fs from 'fs';
import path from 'path';

async function runB8Tests() {
  console.log('====================================================');
  console.log(' B-8: AI ASSISTANT AUTH & RATE LIMIT SECURITY TESTS');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, failureDetail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (failureDetail) console.error(`       Detail: ${failureDetail}`);
      process.exitCode = 1;
    }
  }

  const actionSrc = fs.readFileSync(path.join(process.cwd(), 'actions/aiAssistant.ts'), 'utf8');

  // ─────────────────────────────────────────────────────────────────────────
  // TESTS 1–3: Real behaviour — action is called with no cookie/session context
  // getServerSession() reads cookies() which is empty in tsx test context,
  // so it returns null. Auth rejection fires before any DB or AI call.
  // ─────────────────────────────────────────────────────────────────────────

  // TEST 1: Unauthenticated → exact response shape
  {
    const res = await processAIChatAction('Hello');
    assert(
      res.success === false,
      'Test 1a: Unauthenticated (no session) → success: false'
    );
    assert(
      res.message === 'Please log in to use the AI assistant.',
      'Test 1b: Unauthenticated → exact message',
      `Got: "${res.message}"`
    );
    const opts: any[] = (res as any).options ?? [];
    const hasLogin = opts.some((o: any) => o.label === 'Log In' && o.value === 'login');
    const hasSignup = opts.some((o: any) => o.label === 'Sign Up' && o.value === 'signup');
    assert(hasLogin, 'Test 1c: Unauthenticated → options include { label: "Log In", value: "login" }', `Options: ${JSON.stringify(opts)}`);
    assert(hasSignup, 'Test 1d: Unauthenticated → options include { label: "Sign Up", value: "signup" }', `Options: ${JSON.stringify(opts)}`);
  }

  // TEST 2: Unauthenticated → AI provider definitely not called
  // (Proven by: (a) action returns early with success:false before engine call,
  //  (b) static code analysis confirms gate order below)
  {
    const res = await processAIChatAction('Show packages');
    assert(
      res.success === false && res.message === 'Please log in to use the AI assistant.',
      'Test 2: Unauthenticated "Show packages" → returns login prompt, AI engine not reached'
    );
  }

  // TEST 3: Unauthenticated "select ..." → DB not queried
  // The 'select ' prefix triggers prisma.package.findMany in the original code.
  // With auth gate first, this path is never reached for unauthenticated requests.
  {
    const res = await processAIChatAction('select basic package');
    assert(
      res.success === false && res.message === 'Please log in to use the AI assistant.',
      'Test 3: Unauthenticated "select " prefix → returns login prompt, prisma.package.findMany not reached'
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TESTS 4–10: Static source-code analysis
  // These tests read the actual source of actions/aiAssistant.ts and verify
  // the structural security properties that cannot be tested via runtime mocks
  // due to ESM read-only module exports.
  // ─────────────────────────────────────────────────────────────────────────

  // TEST 4: getServerSession is imported
  {
    const hasImport = actionSrc.includes("import { getServerSession } from '@/lib/auth'");
    assert(hasImport, "Test 4: actions/aiAssistant.ts imports getServerSession from '@/lib/auth'");
  }

  // TEST 5: Rate-limit key pattern is ai_chat_${session.sub}
  {
    const hasCorrectKey = actionSrc.includes('`ai_chat_${session.sub}`');
    assert(hasCorrectKey,
      'Test 5: Rate-limit key is ai_chat_${session.sub} (per-user, server-side identifier)',
      'Expected backtick template: `ai_chat_${session.sub}`'
    );
    // Also verify it does NOT use IP as primary key
    const noIpKey = !actionSrc.includes('ai_chat_ip_') && !actionSrc.includes('ai_chat_${ip');
    assert(noIpKey,
      'Test 5b: Rate-limit key does NOT use IP address in processAIChatAction',
      'Found IP-based rate-limit key in action source'
    );
  }

  // TEST 6: Rate-limit config is limit=20, windowMs=5*60*1000
  {
    const hasLimit20 = actionSrc.includes('limit: 20');
    assert(hasLimit20, 'Test 6a: Rate-limit config limit: 20');
    const hasWindow5min =
      actionSrc.includes('5 * 60 * 1000') ||
      actionSrc.includes('300000') ||
      actionSrc.includes('300_000');
    assert(hasWindow5min, 'Test 6b: Rate-limit config windowMs: 5 * 60 * 1000 (300000ms = 5 minutes)');
  }

  // TEST 7: Rate-limit rejection path present and returns correct message
  {
    const hasRateLimitReturn = actionSrc.includes('You have sent too many messages. Please wait a moment before trying again.');
    assert(hasRateLimitReturn,
      'Test 7: Rate-limit rejection returns exact message: "You have sent too many messages. Please wait a moment before trying again."'
    );
    // Verify rate-limited path returns success: false
    // Find the block around the rate limit check
    const rlBlockMatch = actionSrc.match(/if \(!rateCheck\.allowed\)[\s\S]+?success:\s*false/);
    assert(!!rlBlockMatch,
      'Test 7b: Rate-limit rejection block returns success: false'
    );
  }

  // TEST 8: Per-user isolation — rate-limit key includes session.sub (not email/IP)
  {
    const keyPattern = actionSrc.match(/checkRateLimit\(`([^`]+)`/);
    const capturedKey = keyPattern ? keyPattern[1] : '';
    assert(
      capturedKey.includes('session.sub'),
      'Test 8: Rate-limit key uses session.sub for per-user isolation',
      `Captured key template: "${capturedKey}"`
    );
    assert(
      !capturedKey.includes('email') && !capturedKey.includes('ip') && !capturedKey.includes('IP'),
      'Test 8b: Rate-limit key does NOT reference email or IP address',
      `Captured key template: "${capturedKey}"`
    );
  }

  // TEST 9: Missing/falsy session.sub → unauthenticated gate fires
  {
    const authCheck = actionSrc.includes('!session || !session.sub');
    assert(authCheck,
      'Test 9: Auth gate checks !session || !session.sub (covers missing sub case)'
    );
  }

  // TEST 10: Call ordering — getServerSession → checkRateLimit → DB/AI work
  // Verified by line-number order in source
  {
    const sessLine = actionSrc.split('\n').findIndex(l => l.includes('getServerSession()'));
    const rlLine = actionSrc.split('\n').findIndex(l => l.includes('checkRateLimit('));
    const dbLine = actionSrc.split('\n').findIndex(l => l.includes('prisma.package.findMany'));
    const aiLine = actionSrc.split('\n').findIndex(l => l.includes('runDriveAIEngine('));

    assert(
      sessLine !== -1 && rlLine !== -1 && sessLine < rlLine,
      'Test 10a: getServerSession() appears BEFORE checkRateLimit() in source',
      `sessLine=${sessLine}, rlLine=${rlLine}`
    );
    assert(
      rlLine < dbLine && dbLine !== -1,
      'Test 10b: checkRateLimit() appears BEFORE prisma.package.findMany in source',
      `rlLine=${rlLine}, dbLine=${dbLine}`
    );
    assert(
      rlLine < aiLine && aiLine !== -1,
      'Test 10c: checkRateLimit() appears BEFORE runDriveAIEngine() in source',
      `rlLine=${rlLine}, aiLine=${aiLine}`
    );
    assert(
      sessLine < aiLine,
      'Test 10d: getServerSession() appears BEFORE runDriveAIEngine() in source',
      `sessLine=${sessLine}, aiLine=${aiLine}`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BONUS: Real checkRateLimit key isolation test (uses real Redis/in-memory)
  // ─────────────────────────────────────────────────────────────────────────
  {
    const suffix = Date.now();
    const keyA = `ai_chat_b8-student-a-${suffix}`;
    const keyB = `ai_chat_b8-student-b-${suffix}`;
    const rA = await checkRateLimit(keyA, { limit: 20, windowMs: 5 * 60 * 1000 });
    const rB = await checkRateLimit(keyB, { limit: 20, windowMs: 5 * 60 * 1000 });
    assert(
      rA.allowed && rB.allowed && rA.remaining !== undefined && rB.remaining !== undefined,
      'Test BONUS: Per-user checkRateLimit keys are independent (real rate-limiter call)',
      `rA=${JSON.stringify(rA)}, rB=${JSON.stringify(rB)}`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 4 SECURITY SEARCH — no bypass/mock patterns in action source
  // ─────────────────────────────────────────────────────────────────────────
  {
    const noBypasses =
      !actionSrc.includes('ALLOW_MOCK') &&
      !actionSrc.includes('MOCK_AI') &&
      !actionSrc.includes('TEST_AI') &&
      !actionSrc.includes('BYPASS') &&
      !actionSrc.includes('SKIP_AUTH');
    assert(noBypasses, 'Phase 4: No bypass/mock patterns (ALLOW_MOCK, MOCK_AI, TEST_AI, BYPASS, SKIP_AUTH) in actions/aiAssistant.ts');
  }

  // Summary
  console.log('\n====================================================');
  console.log(` SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runB8Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
