const PROD_URL = 'https://drivesuccess-next.vercel.app';

async function runSmokeTest() {
  console.log('====================================================');
  console.log('  P-20 POST-DEPLOYMENT PRODUCTION SMOKE TEST');
  console.log(`  Target: ${PROD_URL}`);
  console.log('====================================================\n');

  // TEST 1: Core Public Pages
  console.log('[TEST 1: Core Public Pages]');
  const publicRoutes = [
    { path: '/', expected: [200] },
    { path: '/auth/login', expected: [200] },
    { path: '/admin/login', expected: [200] },
    { path: '/courses', expected: [200] },
    { path: '/book', expected: [200] },
    { path: '/contact', expected: [200] },
    { path: '/robots.txt', expected: [200] },
    { path: '/sitemap.xml', expected: [200] },
  ];

  const pageResults: Record<string, { status: number; ok: boolean }> = {};

  for (const r of publicRoutes) {
    const res = await fetch(`${PROD_URL}${r.path}`, { redirect: 'manual' });
    const isOk = r.expected.includes(res.status);
    pageResults[r.path] = { status: res.status, ok: isOk };
    console.log(`  -> GET ${r.path.padEnd(20)} Status: ${res.status} (${isOk ? 'PASS ✅' : 'FAIL 🔴'})`);
  }
  console.log();

  // TEST 2: Authorization Boundaries
  console.log('[TEST 2: Authorization Boundaries]');
  const dashRes = await fetch(`${PROD_URL}/dashboard`, { redirect: 'manual' });
  const notifRes = await fetch(`${PROD_URL}/api/notifications`, { redirect: 'manual' });
  const meRes = await fetch(`${PROD_URL}/api/auth/me`, { redirect: 'manual' });

  console.log(`  -> Unauthenticated GET /dashboard: Status ${dashRes.status} (Expected 307 Redirect: ${dashRes.status === 307 ? 'PASS ✅' : 'FAIL 🔴'})`);
  console.log(`  -> Unauthenticated GET /api/notifications: Status ${notifRes.status} (Expected 401: ${notifRes.status === 401 ? 'PASS ✅' : 'FAIL 🔴'})`);
  console.log(`  -> Unauthenticated GET /api/auth/me: Status ${meRes.status} (Expected 401: ${meRes.status === 401 ? 'PASS ✅' : 'FAIL 🔴'})`);
  console.log();

  // TEST 3: Cron Security
  console.log('[TEST 3: Cron Security Guards]');
  const cron1Res = await fetch(`${PROD_URL}/api/cron/cleanup-pending-bookings`, { redirect: 'manual' });
  const cron2Res = await fetch(`${PROD_URL}/api/cron/reconcile-payments`, { redirect: 'manual' });

  console.log(`  -> Unauthenticated GET /api/cron/cleanup-pending-bookings: Status ${cron1Res.status} (Expected 401: ${cron1Res.status === 401 ? 'PASS ✅' : 'FAIL 🔴'})`);
  console.log(`  -> Unauthenticated GET /api/cron/reconcile-payments: Status ${cron2Res.status} (Expected 401: ${cron2Res.status === 401 ? 'PASS ✅' : 'FAIL 🔴'})`);
  console.log();

  // TEST 4: Security Headers
  console.log('[TEST 4: Security Headers]');
  const headRes = await fetch(`${PROD_URL}/`, { method: 'HEAD' });
  const headers = headRes.headers;

  const headerChecks = [
    'strict-transport-security',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy',
    'content-security-policy',
    'cross-origin-opener-policy',
  ];

  for (const h of headerChecks) {
    const val = headers.get(h);
    console.log(`  -> ${h.padEnd(30)}: ${val ? 'PRESENT ✅ (' + val.substring(0, 45) + '...)' : 'MISSING 🔴'}`);
  }
  console.log();

  console.log('====================================================');
  console.log('  HTTP SMOKE TEST COMPLETE');
  console.log('====================================================');
}

runSmokeTest().catch(console.error);
