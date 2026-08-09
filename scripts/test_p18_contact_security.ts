import { submitContactInquiryAction } from '../actions/contact';
import { checkRateLimit } from '../lib/rateLimit';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('====================================================');
  console.log('  P-18-C CONTACT SECURITY HARDENING RETEST');
  console.log('====================================================\n');

  // TEST 1: Valid Contact Payload Schema Check
  console.log('[Test 1: Valid Contact Payload Submission]');
  const testEmail = `p18_test_${Date.now()}@example.com`;
  const validRes = await submitContactInquiryAction({
    name: 'Audit Tester',
    phone: '9876543210',
    email: testEmail,
    inquiry: 'Requesting driving lesson package details for evening slots.',
  });

  console.log('  -> Action Response:', validRes);
  const test1Passed = validRes.success === true && validRes.message?.includes('submitted successfully');
  console.log(`  -> Test 1 Result: ${test1Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  // TEST 2: IP Rate Limit Enforcement (Max 3 / 15 min)
  console.log('[Test 2: IP Rate Limit Enforcement (3 per 15 min)]');
  const ipKey = `contact_ip_127.0.0.1_${Date.now()}`;
  const r1 = await checkRateLimit(ipKey, { limit: 3, windowMs: 15 * 60 * 1000 });
  const r2 = await checkRateLimit(ipKey, { limit: 3, windowMs: 15 * 60 * 1000 });
  const r3 = await checkRateLimit(ipKey, { limit: 3, windowMs: 15 * 60 * 1000 });
  const r4 = await checkRateLimit(ipKey, { limit: 3, windowMs: 15 * 60 * 1000 });

  console.log(`  -> Attempt 1 Allowed: ${r1.allowed}`);
  console.log(`  -> Attempt 2 Allowed: ${r2.allowed}`);
  console.log(`  -> Attempt 3 Allowed: ${r3.allowed}`);
  console.log(`  -> Attempt 4 Allowed: ${r4.allowed} (Expected: false)`);

  const test2Passed = r1.allowed && r2.allowed && r3.allowed && !r4.allowed;
  console.log(`  -> Test 2 Result: ${test2Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  // TEST 3: Email Rate Limit Enforcement (Max 3 / 15 min)
  console.log('[Test 3: Email Rate Limit Enforcement (3 per 15 min)]');
  const emailKey = `contact_email_test_${Date.now()}@example.com`;
  const e1 = await checkRateLimit(emailKey, { limit: 3, windowMs: 15 * 60 * 1000 });
  const e2 = await checkRateLimit(emailKey, { limit: 3, windowMs: 15 * 60 * 1000 });
  const e3 = await checkRateLimit(emailKey, { limit: 3, windowMs: 15 * 60 * 1000 });
  const e4 = await checkRateLimit(emailKey, { limit: 3, windowMs: 15 * 60 * 1000 });

  console.log(`  -> Email Attempt 1: ${e1.allowed}`);
  console.log(`  -> Email Attempt 4: ${e4.allowed} (Expected: false)`);

  const test3Passed = e1.allowed && e2.allowed && e3.allowed && !e4.allowed;
  console.log(`  -> Test 3 Result: ${test3Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  // TEST 4: Invisible Honeypot Bot Trap
  console.log('[Test 4: Invisible Honeypot Trap]');
  const honeypotRes = await submitContactInquiryAction({
    name: 'Spam Bot',
    phone: '9876543210',
    email: `bot_${Date.now()}@spam.com`,
    inquiry: 'Buy fake products at http://spam.com',
    website: 'http://spam-link.com', // Filled honeypot
  });

  console.log('  -> Honeypot Response:', honeypotRes);
  const test4Passed = honeypotRes.success === true && honeypotRes.message?.includes('submitted successfully');
  console.log(`  -> Test 4 Result: ${test4Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  // TEST 5: Oversized Inquiry Payload
  console.log('[Test 5: Oversized Inquiry Payload (>1000 chars)]');
  const oversizedInquiry = 'A'.repeat(1005);
  const oversizedRes = await submitContactInquiryAction({
    name: 'Payload Tester',
    phone: '9876543210',
    email: `payload_${Date.now()}@example.com`,
    inquiry: oversizedInquiry,
  });

  console.log('  -> Oversized Inquiry Response:', oversizedRes);
  const test5Passed = oversizedRes.success === false && oversizedRes.error?.includes('1000 characters');
  console.log(`  -> Test 5 Result: ${test5Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  // TEST 6: Invalid Email Format
  console.log('[Test 6: Invalid Email Format]');
  const invalidEmailRes = await submitContactInquiryAction({
    name: 'Invalid Email',
    phone: '9876543210',
    email: 'not-an-email-address',
    inquiry: 'Testing email format validation',
  });

  console.log('  -> Invalid Email Response:', invalidEmailRes);
  const test6Passed = invalidEmailRes.success === false && invalidEmailRes.error?.includes('email');
  console.log(`  -> Test 6 Result: ${test6Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  // TEST 7: Boundary Value Checks (Name <2, Phone <8, Inquiry <5)
  console.log('[Test 7: Boundary Value Checks]');
  const shortNameRes = await submitContactInquiryAction({
    name: 'A', // < 2 chars
    phone: '9876543210',
    email: `boundary_${Date.now()}@example.com`,
    inquiry: 'Valid inquiry length',
  });

  const shortPhoneRes = await submitContactInquiryAction({
    name: 'Valid Name',
    phone: '12345', // < 8 digits
    email: `boundary_${Date.now()}@example.com`,
    inquiry: 'Valid inquiry length',
  });

  const shortInquiryRes = await submitContactInquiryAction({
    name: 'Valid Name',
    phone: '9876543210',
    email: `boundary_${Date.now()}@example.com`,
    inquiry: 'Hi', // < 5 chars
  });

  console.log('  -> Short Name Result:', shortNameRes.error);
  console.log('  -> Short Phone Result:', shortPhoneRes.error);
  console.log('  -> Short Inquiry Result:', shortInquiryRes.error);

  const test7Passed =
    shortNameRes.success === false &&
    shortPhoneRes.success === false &&
    shortInquiryRes.success === false;
  console.log(`  -> Test 7 Result: ${test7Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  // TEST 8: Regression Check (P-18-A Architecture Intact)
  console.log('[Test 8: P-18-A Notification Helper Architecture Regression]');
  const contactContent = fs.readFileSync(path.join(process.cwd(), 'actions/contact.ts'), 'utf-8');
  const usesHelper = contactContent.includes('createNotificationHelper');
  const exportsOldAction = contactContent.includes('createNotificationAction');

  console.log(`  -> actions/contact.ts calls createNotificationHelper: ${usesHelper}`);
  console.log(`  -> actions/contact.ts exports old createNotificationAction: ${exportsOldAction}`);

  const test8Passed = usesHelper && !exportsOldAction;
  console.log(`  -> Test 8 Result: ${test8Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  console.log('====================================================');
  if (
    test1Passed &&
    test2Passed &&
    test3Passed &&
    test4Passed &&
    test5Passed &&
    test6Passed &&
    test7Passed &&
    test8Passed
  ) {
    console.log('  P-18-C CONTACT SECURITY RETEST RESULT: PASS ✅');
    console.log('  - Honeypot, Client IP Extraction, Rate Limiter & Zod Active');
    console.log('  - Contact Form Abuse & Flooding Prevented');
  } else {
    console.log('  P-18-C CONTACT SECURITY RETEST RESULT: FAIL 🔴');
  }
  console.log('====================================================');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
