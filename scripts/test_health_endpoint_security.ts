/**
 * C-1: Health Endpoint Security & Minimal Payload Test Suite
 */

import { GET } from '../app/api/health/route';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function runHealthEndpointSecurityTests() {
  console.log('====================================================');
  console.log(' C-1: HEALTH ENDPOINT SECURITY & MINIMAL PAYLOAD TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, label: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${label}`);
      passed++;
    } else {
      console.error(`[FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  const routeSrc = fs.readFileSync(path.join(process.cwd(), 'app/api/health/route.ts'), 'utf8');

  // -------------------------------------------------------------------------
  // TEST 1: Source code does NOT contain sensitive/internal keywords
  // -------------------------------------------------------------------------
  assert(!routeSrc.includes('uptimeSeconds'), 'Test 1a: Source code does NOT contain uptimeSeconds');
  assert(!routeSrc.includes('environment:'), 'Test 1b: Source code does NOT contain environment field');
  assert(!routeSrc.includes('version:'), 'Test 1c: Source code does NOT contain version field');
  assert(!routeSrc.includes('process.env.'), 'Test 1d: Source code does NOT leak process.env variables');
  assert(!routeSrc.includes('error:'), 'Test 1e: Source code does NOT contain error detail field');

  // -------------------------------------------------------------------------
  // TEST 2: Healthy Database Behavior (HTTP 200, status OK, HEALTHY)
  // -------------------------------------------------------------------------
  const healthyRes = await GET();
  const healthyBody = await healthyRes.json();

  assert(healthyRes.status === 200, 'Test 2a: Healthy database returns HTTP status 200', `Got HTTP ${healthyRes.status}`);
  assert(healthyBody.status === 'OK', 'Test 2b: Healthy database body.status === "OK"', `Got "${healthyBody.status}"`);
  assert(
    healthyBody.services?.database?.status === 'HEALTHY',
    'Test 2c: Healthy database body.services.database.status === "HEALTHY"',
    `Got "${healthyBody.services?.database?.status}"`
  );
  assert(
    healthyBody.services?.database?.provider === 'PostgreSQL',
    'Test 2d: body.services.database.provider === "PostgreSQL"',
    `Got "${healthyBody.services?.database?.provider}"`
  );
  assert(
    typeof healthyBody.responseTimeMs === 'string' && /^\d+ms$/.test(healthyBody.responseTimeMs),
    'Test 2e: body.responseTimeMs matches format `${number}ms`',
    `Got "${healthyBody.responseTimeMs}"`
  );

  // -------------------------------------------------------------------------
  // TEST 3: Strict minimal payload schema — NO extra/leaked fields
  // -------------------------------------------------------------------------
  const topLevelKeys = Object.keys(healthyBody).sort();
  const expectedTopKeys = ['responseTimeMs', 'services', 'status', 'timestamp'].sort();
  assert(
    JSON.stringify(topLevelKeys) === JSON.stringify(expectedTopKeys),
    'Test 3a: Response body contains ONLY intended top-level keys [responseTimeMs, services, status, timestamp]',
    `Keys: ${JSON.stringify(topLevelKeys)}`
  );

  const serviceKeys = Object.keys(healthyBody.services).sort();
  assert(
    JSON.stringify(serviceKeys) === JSON.stringify(['database']),
    'Test 3b: body.services contains ONLY "database" key',
    `Keys: ${JSON.stringify(serviceKeys)}`
  );

  const dbKeys = Object.keys(healthyBody.services.database).sort();
  assert(
    JSON.stringify(dbKeys) === JSON.stringify(['provider', 'status']),
    'Test 3c: body.services.database contains ONLY ["provider", "status"] keys',
    `Keys: ${JSON.stringify(dbKeys)}`
  );

  // -------------------------------------------------------------------------
  // TEST 4: Unhealthy Database Behavior (HTTP 503, status DEGRADED, UNHEALTHY)
  // -------------------------------------------------------------------------
  const origQueryRaw = prisma.$queryRaw;
  try {
    (prisma as any).$queryRaw = async () => {
      throw new Error('FATAL: Database connection timeout');
    };

    const unhealthyRes = await GET();
    const unhealthyBody = await unhealthyRes.json();

    assert(unhealthyRes.status === 503, 'Test 4a: Unhealthy database returns HTTP status 503', `Got HTTP ${unhealthyRes.status}`);
    assert(unhealthyBody.status === 'DEGRADED', 'Test 4b: Unhealthy database body.status === "DEGRADED"', `Got "${unhealthyBody.status}"`);
    assert(
      unhealthyBody.services?.database?.status === 'UNHEALTHY',
      'Test 4c: Unhealthy database body.services.database.status === "UNHEALTHY"',
      `Got "${unhealthyBody.services?.database?.status}"`
    );
    assert(
      !JSON.stringify(unhealthyBody).includes('FATAL') && !JSON.stringify(unhealthyBody).includes('timeout'),
      'Test 4d: SQL/Prisma error details and stack traces are NOT exposed in unhealthy response body',
      `Body: ${JSON.stringify(unhealthyBody)}`
    );
  } finally {
    (prisma as any).$queryRaw = origQueryRaw;
  }

  // -------------------------------------------------------------------------
  // TEST 5: No secrets or infrastructure leak check across response
  // -------------------------------------------------------------------------
  const fullBodyStr = JSON.stringify(healthyBody);
  assert(!fullBodyStr.includes('postgres'), 'Test 5a: Response does NOT leak database username or connection strings');
  assert(!fullBodyStr.includes('5432'), 'Test 5b: Response does NOT leak database port or host info');
  assert(!fullBodyStr.includes('development') && !fullBodyStr.includes('production'), 'Test 5c: Response does NOT leak environment');

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passed}/${passed + failed} TESTS PASSED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runHealthEndpointSecurityTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
