/**
 * C-2: Content Security Policy (CSP) Hardening Security Test Suite
 */

import fs from 'fs';
import path from 'path';

async function runCspHeaderSecurityTests() {
  console.log('====================================================');
  console.log(' C-2: CONTENT SECURITY POLICY (CSP) SECURITY TESTS');
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

  const configPath = path.join(process.cwd(), 'next.config.mjs');
  const configSrc = fs.readFileSync(configPath, 'utf8');

  // TEST 1: Content-Security-Policy header configuration exists
  assert(configSrc.includes("key: 'Content-Security-Policy'"), 'Test 1: Content-Security-Policy header configuration exists');

  // Extract CSP block string or array
  const cspMatch = configSrc.match(/key:\s*'Content-Security-Policy'[\s\S]*?value:\s*(\[[[\s\S]*?\]|"[\s\S]*?")/);
  const rawCspValue = cspMatch ? cspMatch[1] : '';

  assert(rawCspValue.length > 0, 'Test 2: Extracted CSP value from next.config.mjs');

  // Parse directives from source
  const getDirective = (dirName: string): string => {
    const regex = new RegExp(`"${dirName}\\s+([^"]+)"`);
    const match = rawCspValue.match(regex);
    return match ? match[1] : '';
  };

  const scriptSrc = getDirective('script-src');
  const styleSrc = getDirective('style-src');
  const fontSrc = getDirective('font-src');
  const connectSrc = getDirective('connect-src');
  const frameSrc = getDirective('frame-src');

  // TEST 2: Core security directives
  assert(rawCspValue.includes("default-src 'self'"), "Test 2a: CSP contains default-src 'self'");
  assert(rawCspValue.includes("object-src 'none'"), "Test 2b: CSP contains object-src 'none'");
  assert(rawCspValue.includes("base-uri 'self'"), "Test 2c: CSP contains base-uri 'self'");
  assert(rawCspValue.includes("form-action 'self'"), "Test 2d: CSP contains form-action 'self'");

  // TEST 3: script-src explicit allowlist
  assert(scriptSrc.includes("'self'"), "Test 3a: script-src contains 'self'");
  assert(scriptSrc.includes('https://checkout.razorpay.com'), 'Test 3b: script-src contains https://checkout.razorpay.com');
  assert(scriptSrc.includes('https://accounts.google.com'), 'Test 3c: script-src contains https://accounts.google.com');
  assert(scriptSrc.includes('https://apis.google.com'), 'Test 3d: script-src contains https://apis.google.com');
  assert(scriptSrc.includes('https://www.googletagmanager.com'), 'Test 3e: script-src contains https://www.googletagmanager.com');

  // TEST 4: script-src forbidden insecure directives / broad wildcards
  assert(!scriptSrc.includes("'unsafe-inline'"), "Test 4a: script-src does NOT contain 'unsafe-inline'");
  assert(!scriptSrc.includes("'unsafe-eval'"), "Test 4b: script-src does NOT contain 'unsafe-eval'");
  const scriptTokens = scriptSrc.split(/\s+/);
  assert(!scriptTokens.includes('https:'), 'Test 4c: script-src does NOT contain broad wildcard "https:"');
  assert(!scriptTokens.includes('*'), 'Test 4d: script-src does NOT contain broad wildcard "*"');
  assert(!scriptSrc.includes('https://*.google.com'), 'Test 4e: script-src does NOT contain broad wildcard "https://*.google.com"');

  // TEST 5: style-src configuration
  assert(styleSrc.includes("'self'"), "Test 5a: style-src contains 'self'");
  assert(styleSrc.includes("'unsafe-inline'"), "Test 5b: style-src contains 'unsafe-inline' (required for framework/styled components)");
  assert(styleSrc.includes('https://fonts.googleapis.com'), 'Test 5c: style-src contains https://fonts.googleapis.com');

  // TEST 6: font-src configuration
  assert(fontSrc.includes("'self'"), "Test 6a: font-src contains 'self'");
  assert(fontSrc.includes('https://fonts.gstatic.com'), 'Test 6b: font-src contains https://fonts.gstatic.com');
  assert(fontSrc.includes('data:'), 'Test 6c: font-src contains data:');

  // TEST 7: connect-src required services
  assert(connectSrc.includes("'self'"), "Test 7a: connect-src contains 'self'");
  assert(connectSrc.includes('https://api.razorpay.com'), 'Test 7b: connect-src contains https://api.razorpay.com');
  assert(connectSrc.includes('https://*.firebaseio.com'), 'Test 7c: connect-src contains https://*.firebaseio.com');
  assert(connectSrc.includes('https://identitytoolkit.googleapis.com'), 'Test 7d: connect-src contains https://identitytoolkit.googleapis.com');
  assert(connectSrc.includes('https://securetoken.googleapis.com'), 'Test 7e: connect-src contains https://securetoken.googleapis.com');
  assert(connectSrc.includes('https://accounts.google.com'), 'Test 7f: connect-src contains https://accounts.google.com');
  assert(connectSrc.includes('https://*.googleapis.com'), 'Test 7g: connect-src contains https://*.googleapis.com');

  // TEST 8: frame-src allowed domains
  assert(frameSrc.includes("'self'"), "Test 8a: frame-src contains 'self'");
  assert(frameSrc.includes('https://api.razorpay.com'), 'Test 8b: frame-src contains https://api.razorpay.com');
  assert(frameSrc.includes('https://checkout.razorpay.com'), 'Test 8c: frame-src contains https://checkout.razorpay.com');
  assert(frameSrc.includes('https://accounts.google.com'), 'Test 8d: frame-src contains https://accounts.google.com');

  // TEST 9: Global unsafe-eval check
  assert(!rawCspValue.includes('unsafe-eval'), 'Test 9: unsafe-eval is completely absent from entire CSP header');

  // TEST 10: Check unsafe-inline restricted strictly to style-src
  const unsafeInlineMatches = rawCspValue.match(/unsafe-inline/g) || [];
  assert(
    unsafeInlineMatches.length === 1 && styleSrc.includes("'unsafe-inline'"),
    "Test 10: 'unsafe-inline' appears ONLY in style-src"
  );

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passed}/${passed + failed} TESTS PASSED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCspHeaderSecurityTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
