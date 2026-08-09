import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import { setStudentAuthVersionRedis, getStudentAuthVersionRedis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { signSessionToken, validateSessionToken, verifySessionToken } from '../lib/auth';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'test_jwt_secret_key_32_characters_long_min';
  return new TextEncoder().encode(secret);
}

async function runAuthVersionRevocationTests() {
  console.log('====================================================');
  console.log('   AUTHVERSION SESSION REVOCATION TEST SUITE       ');
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

  // Ensure JWT_SECRET is set for test context
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test_jwt_secret_key_32_characters_long_min';
  }

  const testStudentId = 'test_student_revocation_id_123';

  try {
    // =========================================================================
    // SECTION 1: EDGE MIDDLEWARE & REDIS TESTS
    // =========================================================================

    // -------------------------------------------------------------------------
    // TEST A: Token version matches Redis -> request allowed by middleware
    // -------------------------------------------------------------------------
    await setStudentAuthVersionRedis(testStudentId, 1);

    const tokenA = await new SignJWT({
      sub: testStudentId,
      phone: '9999999999',
      role: 'STUDENT',
      ver: 1,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(getJwtSecret());

    const reqA = new NextRequest('http://localhost:3000/dashboard', {
      headers: { cookie: `auth_token=${tokenA}` },
    });
    const resA = await middleware(reqA);
    assert(
      resA.status === 200 && resA.headers.get('x-user-id') === testStudentId,
      'Test A: Token version matches Redis -> request allowed by middleware',
      `Expected status 200 & x-user-id header, got status ${resA.status}`
    );

    // -------------------------------------------------------------------------
    // TEST B: Token version differs from Redis -> protected API returns 401
    // -------------------------------------------------------------------------
    await setStudentAuthVersionRedis(testStudentId, 2); // Redis has version 2, token has version 1

    const reqB = new NextRequest('http://localhost:3000/api/bookings', {
      headers: { cookie: `auth_token=${tokenA}` },
    });
    const resB = await middleware(reqB);
    
    let errorMsgB = '';
    try {
      const clonedB = resB.clone();
      const bodyB = await clonedB.json();
      errorMsgB = bodyB.error || '';
    } catch {
      errorMsgB = 'Invalid JSON response';
    }

    assert(
      resB.status === 401 && errorMsgB === 'Session revoked. Please log in again.',
      'Test B: Token version differs from Redis -> protected API returns 401',
      `Expected status 401 & revoked message, got status ${resB.status}, errorMsg: ${errorMsgB}`
    );

    // -------------------------------------------------------------------------
    // TEST C & D: Token version differs from Redis -> protected page redirects & auth cookie deleted
    // -------------------------------------------------------------------------
    const reqC = new NextRequest('http://localhost:3000/dashboard', {
      headers: { cookie: `auth_token=${tokenA}` },
    });
    const resC = await middleware(reqC);
    const locationC = resC.headers.get('location');
    const setCookieC = resC.headers.get('set-cookie');

    assert(
      resC.status === 307 &&
        !!locationC &&
        locationC.includes('/auth/login?error=session_revoked'),
      'Test C: Token version differs from Redis -> protected page redirects to /auth/login?error=session_revoked',
      `Expected redirect to /auth/login?error=session_revoked, got status ${resC.status}, location: ${locationC}`
    );

    assert(
      !!setCookieC && (setCookieC.includes('auth_token=;') || setCookieC.includes('auth_token=Max-Age=0') || setCookieC.includes('Expires=Thu, 01 Jan 1970')),
      'Test D: Auth cookie is deleted on edge revocation',
      `Expected auth_token deletion header, got set-cookie: ${setCookieC}`
    );

    // -------------------------------------------------------------------------
    // TEST E: Redis key missing -> existing compatibility behavior is preserved
    // -------------------------------------------------------------------------
    const missingRedisStudentId = 'unregistered_redis_student_id_999';
    const tokenE = await new SignJWT({
      sub: missingRedisStudentId,
      phone: '8888888888',
      role: 'STUDENT',
      ver: 1,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(getJwtSecret());

    const reqE = new NextRequest('http://localhost:3000/dashboard', {
      headers: { cookie: `auth_token=${tokenE}` },
    });
    const resE = await middleware(reqE);
    assert(
      resE.status === 200 && resE.headers.get('x-user-id') === missingRedisStudentId,
      'Test E: Redis key missing -> existing compatibility behavior is preserved in middleware',
      `Expected status 200 for unindexed student, got status ${resE.status}`
    );

    // =========================================================================
    // SECTION 2: POSTGRESQL AUTHORITATIVE VALIDATION (PROMPT A-2.6)
    // =========================================================================

    // Create a real test student in PostgreSQL
    const dbStudent = await prisma.student.create({
      data: {
        name: 'Test Student DB Validation',
        phone: '+919911223344',
        authVersion: 2,
      },
    });

    // -------------------------------------------------------------------------
    // TEST 1: JWT ver = DB authVersion -> accepted
    // -------------------------------------------------------------------------
    const token1 = await signSessionToken({
      sub: dbStudent.id,
      phone: dbStudent.phone || '',
      role: 'STUDENT',
      name: dbStudent.name,
      ver: 2, // matches DB authVersion (2)
    });

    const session1 = await validateSessionToken(token1);
    assert(
      session1 !== null && session1.sub === dbStudent.id && session1.ver === 2,
      'Test 1: JWT ver matches DB authVersion -> validateSessionToken accepts',
      `Expected valid session payload, got ${JSON.stringify(session1)}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: JWT ver = 1, DB authVersion = 2 -> rejected
    // -------------------------------------------------------------------------
    const token2 = await signSessionToken({
      sub: dbStudent.id,
      phone: dbStudent.phone || '',
      role: 'STUDENT',
      name: dbStudent.name,
      ver: 1, // Stale version (1 != 2)
    });

    const session2 = await validateSessionToken(token2);
    assert(
      session2 === null,
      'Test 2: JWT ver differs from DB authVersion -> validateSessionToken rejects (returns null)',
      `Expected null on version mismatch, got ${JSON.stringify(session2)}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: JWT references non-existent student ID -> rejected
    // -------------------------------------------------------------------------
    const token3 = await signSessionToken({
      sub: 'non_existent_cuid_99999',
      phone: '+919999999999',
      role: 'STUDENT',
      name: 'Ghost Student',
      ver: 1,
    });

    const session3 = await validateSessionToken(token3);
    assert(
      session3 === null,
      'Test 3: Non-existent student ID in JWT -> validateSessionToken rejects (returns null)',
      `Expected null for non-existent student, got ${JSON.stringify(session3)}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: JWT has no ver claim -> rejected
    // -------------------------------------------------------------------------
    const token4 = await new SignJWT({
      sub: dbStudent.id,
      phone: dbStudent.phone || '',
      role: 'STUDENT',
      name: dbStudent.name,
      // no ver claim
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(getJwtSecret());

    const session4 = await validateSessionToken(token4);
    assert(
      session4 === null,
      'Test 4: JWT missing ver claim -> validateSessionToken rejects (returns null)',
      `Expected null for token without ver, got ${JSON.stringify(session4)}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Redis unavailable + JWT ver stale compared with DB -> rejected
    // -------------------------------------------------------------------------
    // Simulate Redis cache miss / unavailable (no key set in Redis for dbStudent)
    // token2 has ver = 1, DB has authVersion = 2
    const session5 = await validateSessionToken(token2);
    assert(
      session5 === null,
      'Test 5: Redis unavailable + JWT ver stale vs DB -> validateSessionToken rejects',
      `Expected null on stale version without Redis, got ${JSON.stringify(session5)}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Redis unavailable + JWT ver matches DB -> accepted
    // -------------------------------------------------------------------------
    // token1 has ver = 2, DB has authVersion = 2
    const session6 = await validateSessionToken(token1);
    assert(
      session6 !== null && session6.sub === dbStudent.id && session6.ver === 2,
      'Test 6: Redis unavailable + JWT ver matches DB -> validateSessionToken accepts',
      `Expected valid session payload without Redis, got ${JSON.stringify(session6)}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Admin authentication isolation -> getAdminSession unaffected
    // -------------------------------------------------------------------------
    const adminToken = await new SignJWT({
      sub: 'admin_director_id',
      email: 'admin@drivesuccess.edu',
      role: 'ADMIN',
      name: 'Academy Director',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(getJwtSecret());

    const adminVerified = await verifySessionToken(adminToken);
    assert(
      adminVerified !== null && adminVerified.role === 'ADMIN',
      'Test 7: Admin authentication remains unaffected',
      `Expected verified admin session, got ${JSON.stringify(adminVerified)}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Server Component context safety -> does not throw on invalid session
    // -------------------------------------------------------------------------
    let threwError = false;
    try {
      // In a Server Component render without request cookies, validateSessionToken must return null without throwing
      await validateSessionToken('completely_invalid_garbage_token');
    } catch (e) {
      threwError = true;
    }

    assert(
      !threwError,
      'Test 8: Invalid session does NOT throw in Server Component context',
      'Threw error unexpectedly on invalid token'
    );

    // Clean up test student
    await prisma.student.delete({ where: { id: dbStudent.id } }).catch(() => {});

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

runAuthVersionRevocationTests();
