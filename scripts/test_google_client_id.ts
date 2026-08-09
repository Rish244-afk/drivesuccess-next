/**
 * B-9: Remove Hardcoded Google Client ID Security Tests
 */

import fs from 'fs';
import path from 'path';

async function runB9Tests() {
  console.log('====================================================');
  console.log(' B-9: REMOVE HARDCODED GOOGLE CLIENT ID TESTS');
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

  const btnFile = fs.readFileSync(path.join(process.cwd(), 'components/auth/GoogleSignInButton.tsx'), 'utf8');
  const routeFile = fs.readFileSync(path.join(process.cwd(), 'app/api/auth/google/route.ts'), 'utf8');

  // TEST 1: Hardcoded Client ID string 171317905309 is absent from GoogleSignInButton.tsx
  assert(
    !btnFile.includes('171317905309'),
    'Test 1: 171317905309 is completely absent from components/auth/GoogleSignInButton.tsx'
  );

  // TEST 2: Hardcoded Client ID string 171317905309 is absent from app/api/auth/google/route.ts
  assert(
    !routeFile.includes('171317905309'),
    'Test 2: 171317905309 is completely absent from app/api/auth/google/route.ts'
  );

  // TEST 3: GoogleSignInButton.tsx has explicit clientId check throwing Error
  assert(
    btnFile.includes("throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not configured.');"),
    'Test 3: GoogleSignInButton.tsx contains required throw new Error for missing NEXT_PUBLIC_GOOGLE_CLIENT_ID'
  );

  // TEST 4: route.ts has explicit clientId check throwing Error
  assert(
    routeFile.includes("throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not configured.');"),
    'Test 4: app/api/auth/google/route.ts contains required throw new Error for missing NEXT_PUBLIC_GOOGLE_CLIENT_ID'
  );

  // TEST 5: Global Codebase Search for 171317905309 (excluding .env backup/env files if any, testing source code)
  const allFiles = [
    'components/auth/GoogleSignInButton.tsx',
    'app/api/auth/google/route.ts',
    'actions/aiAssistant.ts',
    'actions/admin.ts',
    'actions/auth.ts',
    'actions/razorpay.ts',
    'lib/auth.ts',
  ];

  let foundInSource = false;
  for (const f of allFiles) {
    const content = fs.readFileSync(path.join(process.cwd(), f), 'utf8');
    if (content.includes('171317905309')) {
      foundInSource = true;
      console.error(`Found 171317905309 in ${f}`);
    }
  }

  assert(!foundInSource, 'Test 5: Source files contain 0 occurrences of 171317905309');

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passed}/${passed + failed} TESTS PASSED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runB9Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
