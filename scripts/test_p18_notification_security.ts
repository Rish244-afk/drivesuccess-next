import { PrismaClient, NotificationType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*"(.*)"\s*$/) || line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    });
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('  P-18 NOTIFICATION SECURITY RETEST (P-18-A)');
  console.log('====================================================\n');

  // TEST 1: Public RPC Removal Verification
  console.log('[Test 1: Public createNotificationAction RPC Removal]');
  const notificationActions = await import('../actions/notification');
  const hasPublicCreateAction = 'createNotificationAction' in notificationActions;

  console.log(`  -> createNotificationAction exported in actions/notification.ts: ${hasPublicCreateAction}`);
  const test1Passed = !hasPublicCreateAction;
  console.log(`  -> Test 1 Result: ${test1Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  // TEST 2: Repository Security Audit
  console.log('[Test 2: Repository Security Audit for Notification Creation Exports]');
  const notificationFileContent = fs.readFileSync(path.join(process.cwd(), 'actions/notification.ts'), 'utf-8');
  const hasUseServer = notificationFileContent.includes("'use server'");
  const exportsCreateAction = notificationFileContent.includes('export async function createNotificationAction');

  console.log(`  -> actions/notification.ts has 'use server': ${hasUseServer}`);
  console.log(`  -> actions/notification.ts exports createNotificationAction: ${exportsCreateAction}`);
  const test2Passed = !exportsCreateAction;
  console.log(`  -> Test 2 Result: ${test2Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  // TEST 3: Legitimate Internal Helper Execution
  console.log('[Test 3: Legitimate Internal createNotificationHelper Execution]');
  const { createNotificationHelper } = await import('../lib/notification');

  const testStudent = await prisma.student.findFirst();
  if (!testStudent) throw new Error('No student found in DB for test');

  const notifBefore = await prisma.notification.count({ where: { studentId: testStudent.id } });

  const helperResult = await createNotificationHelper({
    studentId: testStudent.id,
    title: 'P-18 Security Audit Notification Test',
    message: 'Internal notification helper verification run.',
    type: NotificationType.SYSTEM_ALERT,
    metadata: { test: 'P-18' },
  });

  const notifAfter = await prisma.notification.count({ where: { studentId: testStudent.id } });
  console.log(`  -> Helper Result:`, helperResult.success ? 'SUCCESS' : helperResult.error);
  console.log(`  -> Notifications Delta: ${notifAfter - notifBefore}`);

  const test3Passed = helperResult.success && notifAfter === notifBefore + 1;
  console.log(`  -> Test 3 Result: ${test3Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  // TEST 4: Razorpay Notification Regression Audit
  console.log('[Test 4: Razorpay Notification Integration Audit]');
  const razorpayContent = fs.readFileSync(path.join(process.cwd(), 'actions/razorpay.ts'), 'utf-8');
  const usesHelperInRazorpay = razorpayContent.includes('@/lib/notification') && razorpayContent.includes('createNotificationHelper');
  const usesOldActionInRazorpay = razorpayContent.includes('createNotificationAction');

  console.log(`  -> actions/razorpay.ts imports createNotificationHelper: ${usesHelperInRazorpay}`);
  console.log(`  -> actions/razorpay.ts uses old createNotificationAction: ${usesOldActionInRazorpay}`);
  const test4Passed = usesHelperInRazorpay && !usesOldActionInRazorpay;
  console.log(`  -> Test 4 Result: ${test4Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  // TEST 5: Contact Notification Regression Audit
  console.log('[Test 5: Contact Inquiry Notification Integration Audit]');
  const contactContent = fs.readFileSync(path.join(process.cwd(), 'actions/contact.ts'), 'utf-8');
  const usesHelperInContact = contactContent.includes('@/lib/notification') && contactContent.includes('createNotificationHelper');

  console.log(`  -> actions/contact.ts imports createNotificationHelper: ${usesHelperInContact}`);
  const test5Passed = usesHelperInContact;
  console.log(`  -> Test 5 Result: ${test5Passed ? 'PASS ✅' : 'FAIL 🔴'}\n`);

  // Post-Test Cleanup
  console.log('[Post-Test Cleanup] Cleaning up P-18 test notification...');
  if (helperResult.notification) {
    await prisma.notification.delete({ where: { id: helperResult.notification.id } });
  }
  console.log('[Post-Test Cleanup] Done.');

  console.log('\n====================================================');
  if (test1Passed && test2Passed && test3Passed && test4Passed && test5Passed) {
    console.log('  P-18 NOTIFICATION SECURITY RETEST RESULT: PASS ✅');
    console.log('  - Public Server Action RPC endpoint eliminated.');
    console.log('  - Private server-side helper lib/notification.ts active.');
    console.log('  - Legitimate payment & contact inquiry workflows preserved.');
  } else {
    console.log('  P-18 NOTIFICATION SECURITY RETEST RESULT: FAIL 🔴');
  }
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
