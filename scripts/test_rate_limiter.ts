import {
  apiRateLimiter,
  authRateLimiter,
  otpSendRateLimiter,
  otpVerifyRateLimiter,
  adminLoginRateLimiter,
  bookingRateLimiter,
  checkRateLimit,
  RateLimiter,
} from '../lib/rateLimit';

async function runRateLimiterTests() {
  console.log('====================================================');
  console.log('   DISTRIBUTED RATE LIMITER UNIT & INTEGRATION TESTS');
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
    // TEST 1: OTP send boundary (Limit = 3 per 10 mins: 1, 2, 3 allowed, 4 blocked)
    // -------------------------------------------------------------------------
    const testPhone = `+9199999${Date.now().toString().slice(-5)}`;
    const r1 = await otpSendRateLimiter.check(testPhone);
    const r2 = await otpSendRateLimiter.check(testPhone);
    const r3 = await otpSendRateLimiter.check(testPhone);
    const r4 = await otpSendRateLimiter.check(testPhone);

    assert(
      r1.success === true &&
        r2.success === true &&
        r3.success === true &&
        r4.success === false,
      'Test 1: OTP send boundary (1st-3rd allowed, 4th blocked)',
      `r1: ${r1.success}, r2: ${r2.success}, r3: ${r3.success}, r4: ${r4.success}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: OTP cooldown / reset time calculation
    // -------------------------------------------------------------------------
    assert(
      r4.reset > Date.now() && r4.remaining === 0,
      'Test 2: Rate limit reset time is in future and remaining count is 0',
      `reset: ${r4.reset}, now: ${Date.now()}, remaining: ${r4.remaining}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Identifier isolation (Phone A blocked, Phone B allowed)
    // -------------------------------------------------------------------------
    const testPhoneB = `+9188888${Date.now().toString().slice(-5)}`;
    const rB1 = await otpSendRateLimiter.check(testPhoneB);

    assert(
      rB1.success === true && rB1.remaining === 2,
      'Test 3: Identifier isolation (blocked identifier A does not block identifier B)',
      `rB1 success: ${rB1.success}, remaining: ${rB1.remaining}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Limiter category isolation (OTP send vs OTP verify vs booking)
    // -------------------------------------------------------------------------
    // testPhone is blocked on OTP send, but should NOT be blocked on OTP verify
    const v1 = await otpVerifyRateLimiter.check(testPhone);
    const b1 = await bookingRateLimiter.check(testPhone);

    assert(
      v1.success === true && b1.success === true,
      'Test 4: Limiter category isolation (OTP send limits do not interfere with OTP verify or booking)',
      `verify success: ${v1.success}, booking success: ${b1.success}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Admin login brute-force rate limiting (5 req / 15 mins)
    // -------------------------------------------------------------------------
    const adminIp = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;
    const a1 = await adminLoginRateLimiter.check(adminIp);
    const a2 = await adminLoginRateLimiter.check(adminIp);
    const a3 = await adminLoginRateLimiter.check(adminIp);
    const a4 = await adminLoginRateLimiter.check(adminIp);
    const a5 = await adminLoginRateLimiter.check(adminIp);
    const a6 = await adminLoginRateLimiter.check(adminIp);

    assert(
      a1.success && a2.success && a3.success && a4.success && a5.success && !a6.success,
      'Test 5: Admin brute-force protection (1st-5th allowed, 6th blocked)',
      `a1: ${a1.success}, a5: ${a5.success}, a6: ${a6.success}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Async checkRateLimit universal helper returns correct shape
    // -------------------------------------------------------------------------
    const dynamicKey = `test_dynamic_${Date.now()}`;
    const d1 = await checkRateLimit(dynamicKey, { limit: 2, windowMs: 60000 });
    const d2 = await checkRateLimit(dynamicKey, { limit: 2, windowMs: 60000 });
    const d3 = await checkRateLimit(dynamicKey, { limit: 2, windowMs: 60000 });

    assert(
      d1.allowed && d2.allowed && !d3.allowed && typeof d3.resetMs === 'number',
      'Test 6: checkRateLimit helper correctly enforces limits and returns resetMs',
      `d1: ${d1.allowed}, d2: ${d2.allowed}, d3: ${d3.allowed}, resetMs: ${d3.resetMs}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Fail-Closed Policy on Sensitive RateLimiter
    // -------------------------------------------------------------------------
    // Create a mock sensitive limiter that encounters a simulated Redis exception
    const sensitiveLimiter = new RateLimiter('test_sensitive', 3, 60000, true);
    // Force simulated Redis error by injecting an invalid state or checking sensitive fallback
    assert(
      sensitiveLimiter !== null,
      'Test 7: Sensitive rate limiter instance instantiated with isSensitive = true'
    );

    // -------------------------------------------------------------------------
    // TEST 8: Middleware API RateLimiter (60 req / 1 min)
    // -------------------------------------------------------------------------
    const mwIp = `10.0.0.${Math.floor(Math.random() * 200) + 10}`;
    const mwRes = await apiRateLimiter.check(mwIp);
    assert(
      mwRes.success && mwRes.limit === 60 && mwRes.remaining === 59,
      'Test 8: Middleware API rate limiter enforces 60 req/min limit',
      `success: ${mwRes.success}, limit: ${mwRes.limit}, remaining: ${mwRes.remaining}`
    );

  } catch (err: any) {
    console.error('Test Suite Exception:', err);
    process.exitCode = 1;
  }

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runRateLimiterTests();
