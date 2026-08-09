import { getAdminSession } from '../actions/admin';
import { signSessionToken, verifySessionToken } from '../lib/auth';
import { Role } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const ADMIN_COOKIE_NAME = 'admin_auth_token';

async function runAdminSessionBypassRemovalTests() {
  console.log('====================================================');
  console.log(' B-6: TEST_ADMIN_SESSION BYPASS REMOVAL TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, failureDetail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName}`);
      if (failureDetail) console.error(`       Detail: ${failureDetail}`);
      process.exitCode = 1;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: TEST_ADMIN_SESSION is absent from actions/admin.ts
    // -------------------------------------------------------------------------
    const adminActionFile = fs.readFileSync(path.join(process.cwd(), 'actions/admin.ts'), 'utf8');
    const hasBypassInAdminAction = adminActionFile.includes('TEST_ADMIN_SESSION');

    assert(
      !hasBypassInAdminAction,
      'Test 1: TEST_ADMIN_SESSION bypass block is completely removed from actions/admin.ts',
      `Found TEST_ADMIN_SESSION in actions/admin.ts: ${hasBypassInAdminAction}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: TEST_ADMIN_SESSION is absent from .env.example
    // -------------------------------------------------------------------------
    const envExampleFile = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
    const hasBypassInEnv = envExampleFile.includes('TEST_ADMIN_SESSION');

    assert(
      !hasBypassInEnv,
      'Test 2: TEST_ADMIN_SESSION is completely absent from .env.example',
      `Found TEST_ADMIN_SESSION in .env.example: ${hasBypassInEnv}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: TEST_ADMIN_SESSION environment variable cannot bypass authentication
    // -------------------------------------------------------------------------
    (process.env as any).TEST_ADMIN_SESSION = JSON.stringify({
      sub: 'attacker_fake_admin_id',
      email: 'attacker@evil.com',
      name: 'Attacker Admin',
      role: Role.ADMIN,
    });

    const bypassAttemptResult = await getAdminSession();

    assert(
      bypassAttemptResult === null,
      'Test 3: Injected TEST_ADMIN_SESSION env var returns null and does NOT grant admin session',
      `Expected null, got: ${JSON.stringify(bypassAttemptResult)}`
    );

    delete (process.env as any).TEST_ADMIN_SESSION;

    // -------------------------------------------------------------------------
    // TEST 4: Valid Cryptographic Admin Session Token Verification
    // -------------------------------------------------------------------------
    const validAdminPayload = {
      sub: 'admin_test_director_id',
      email: 'admin@drivesuccess.edu',
      phone: '+919999999999',
      name: 'Academy Director',
      role: Role.ADMIN,
    };

    const validAdminToken = await signSessionToken(validAdminPayload);
    const verifiedAdminSession = await verifySessionToken(validAdminToken);

    assert(
      verifiedAdminSession !== null &&
        verifiedAdminSession.sub === validAdminPayload.sub &&
        verifiedAdminSession.role === Role.ADMIN,
      'Test 4: Valid cryptographic Admin session token verifies with Role.ADMIN',
      `Session result: ${JSON.stringify(verifiedAdminSession)}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Non-Admin (STUDENT) Session Token is Strictly REJECTED for Admin Role
    // -------------------------------------------------------------------------
    const studentPayload = {
      sub: 'student_normal_user_id',
      email: 'student@example.com',
      phone: '+918888888888',
      name: 'Normal Student',
      role: Role.STUDENT,
    };

    const studentToken = await signSessionToken(studentPayload);
    const verifiedStudentSession = await verifySessionToken(studentToken);

    const wouldPassAdminRoleCheck = verifiedStudentSession?.role === Role.ADMIN;

    assert(
      verifiedStudentSession !== null && !wouldPassAdminRoleCheck,
      'Test 5: Student session token has role !== ADMIN and is strictly rejected by getAdminSession() logic',
      `verifiedStudentSession role: ${verifiedStudentSession?.role}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Tampered / Invalid Session Token is Strictly REJECTED
    // -------------------------------------------------------------------------
    const tamperedTokenResult = await verifySessionToken('forged.invalid.signature.payload');

    assert(
      tamperedTokenResult === null,
      'Test 6: Tampered / unverified session token fails cryptographic verification (returns null)',
      `Expected null, got: ${JSON.stringify(tamperedTokenResult)}`
    );

  } catch (error) {
    console.error('Test Suite Error:', error);
    process.exitCode = 1;
  }

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAdminSessionBypassRemovalTests();
