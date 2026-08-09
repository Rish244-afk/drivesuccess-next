import { verifyPaymentSignatureAction } from '../actions/razorpay';
import { prisma } from '../lib/prisma';
import { razorpay } from '../lib/razorpay';
import { BookingStatus, PaymentStatus, PackageType, Role } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret_123';
process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;

const generatePaymentSignature = (orderId: string, paymentId: string): string => {
  return crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
};

async function runMockPaymentRemovalTests() {
  console.log('====================================================');
  console.log('  B-5: MOCK PAYMENT BYPASS REMOVAL SECURITY TESTS');
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
    // Setup Test Student & Package
    // -------------------------------------------------------------------------
    const uniqueSuffix = Date.now().toString().slice(-6);
    const testStudent = await prisma.student.create({
      data: {
        email: `mock_bypass_tester_${uniqueSuffix}@example.com`,
        name: 'Mock Bypass Tester',
        phone: `+9197${uniqueSuffix}34`,
        role: Role.STUDENT,
      },
    });

    const testPackage = await prisma.package.upsert({
      where: { slug: 'mock-bypass-test-package' },
      update: {},
      create: {
        name: 'Mock Bypass Test Package',
        slug: 'mock-bypass-test-package',
        type: PackageType.LICENSE_4W,
        price: 5000,
        sessionsCount: 10,
        description: 'Test Package Description',
      },
    });

    // Provide test session context
    process.env.TEST_SESSION_PAYLOAD = JSON.stringify({
      sub: testStudent.id,
      email: testStudent.email,
      phone: testStudent.phone || '',
      name: testStudent.name,
      role: Role.STUDENT,
      ver: testStudent.authVersion,
    });

    // Helper to mock razorpay.orders.fetch for gateway amount check
    const originalFetch = razorpay.orders.fetch;
    razorpay.orders.fetch = async (orderId: string) => {
      return { id: orderId, amount: 500000, status: 'created' } as any;
    };

    // -------------------------------------------------------------------------
    // TEST 1: Invalid HMAC with test-style IDs (pay_test_xxx, test_order_xxx)
    // -------------------------------------------------------------------------
    const booking1 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
        razorpayOrderId: `test_order_${Date.now()}`,
      },
    });

    const testPaymentId1 = `pay_test_${Date.now()}`;
    const invalidSignature1 = 'fake_invalid_hmac_signature_123456';

    const res1 = await verifyPaymentSignatureAction({
      bookingId: booking1.id,
      razorpayOrderId: booking1.razorpayOrderId!,
      razorpayPaymentId: testPaymentId1,
      razorpaySignature: invalidSignature1,
    });

    const updatedBooking1 = await prisma.booking.findUnique({ where: { id: booking1.id } });

    assert(
      res1.success === false &&
        res1.error === 'Invalid payment signature. Verification failed.' &&
        updatedBooking1?.paymentStatus === PaymentStatus.FAILED &&
        updatedBooking1?.status !== BookingStatus.CONFIRMED,
      'Test 1: Test-style IDs (pay_test_*, test_order_*) with invalid HMAC are REJECTED and marked FAILED',
      `res1: ${JSON.stringify(res1)}, paymentStatus: ${updatedBooking1?.paymentStatus}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Invalid HMAC with ALLOW_MOCK_PAYMENTS=true attempt in non-prod
    // -------------------------------------------------------------------------
    process.env.ALLOW_MOCK_PAYMENTS = 'true';

    const booking2 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
        razorpayOrderId: `test_order_bypass_${Date.now()}`,
      },
    });

    const testPaymentId2 = `pay_test_bypass_${Date.now()}`;
    const invalidSignature2 = 'forged_fake_signature_with_env_flag';

    const res2 = await verifyPaymentSignatureAction({
      bookingId: booking2.id,
      razorpayOrderId: booking2.razorpayOrderId!,
      razorpayPaymentId: testPaymentId2,
      razorpaySignature: invalidSignature2,
    });

    const updatedBooking2 = await prisma.booking.findUnique({ where: { id: booking2.id } });

    assert(
      res2.success === false &&
        res2.error === 'Invalid payment signature. Verification failed.' &&
        updatedBooking2?.paymentStatus === PaymentStatus.FAILED,
      'Test 2: ALLOW_MOCK_PAYMENTS=true has no effect: invalid signature is rejected and marked FAILED',
      `res2: ${JSON.stringify(res2)}`
    );

    delete process.env.ALLOW_MOCK_PAYMENTS;

    // -------------------------------------------------------------------------
    // TEST 3: Genuine Valid HMAC SHA256 Signature -> SUCCEEDS
    // -------------------------------------------------------------------------
    const booking3 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
        razorpayOrderId: `order_valid_${Date.now()}`,
      },
    });

    const validPaymentId3 = `pay_valid_${Date.now()}`;
    const validSignature3 = generatePaymentSignature(booking3.razorpayOrderId!, validPaymentId3);

    const res3 = await verifyPaymentSignatureAction({
      bookingId: booking3.id,
      razorpayOrderId: booking3.razorpayOrderId!,
      razorpayPaymentId: validPaymentId3,
      razorpaySignature: validSignature3,
    });

    const updatedBooking3 = await prisma.booking.findUnique({ where: { id: booking3.id } });

    assert(
      res3.success === true &&
        updatedBooking3?.paymentStatus === PaymentStatus.PAID &&
        updatedBooking3?.status === BookingStatus.CONFIRMED,
      'Test 3: Genuine Razorpay HMAC SHA256 signature succeeds and confirms booking as PAID',
      `res3: ${JSON.stringify(res3)}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: B-4 Amount Mismatch + Invalid Signature -> FAILS at Amount Check
    // -------------------------------------------------------------------------
    const booking4 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
        razorpayOrderId: `order_mismatch_${Date.now()}`,
      },
    });

    // Mock gateway returning 499900 paise instead of 500000 paise
    razorpay.orders.fetch = async (orderId: string) => {
      return { id: orderId, amount: 499900, status: 'created' } as any;
    };

    const res4 = await verifyPaymentSignatureAction({
      bookingId: booking4.id,
      razorpayOrderId: booking4.razorpayOrderId!,
      razorpayPaymentId: `pay_mismatch_${Date.now()}`,
      razorpaySignature: 'invalid_sig',
    });

    const updatedBooking4 = await prisma.booking.findUnique({ where: { id: booking4.id } });

    assert(
      res4.success === false &&
        Boolean(res4.error?.includes('Payment amount verification failed')) &&
        updatedBooking4?.paymentStatus !== PaymentStatus.PAID,
      'Test 4: B-4 amount mismatch fails before signature check and booking is NOT marked PAID',
      `res4: ${JSON.stringify(res4)}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: B-4 Amount Match + Invalid HMAC -> FAILS at HMAC Check (Marked FAILED)
    // -------------------------------------------------------------------------
    // Reset fetch mock to return correct amount (500000 paise)
    razorpay.orders.fetch = async (orderId: string) => {
      return { id: orderId, amount: 500000, status: 'created' } as any;
    };

    const booking5 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
        razorpayOrderId: `order_amt_pass_hmac_fail_${Date.now()}`,
      },
    });

    const res5 = await verifyPaymentSignatureAction({
      bookingId: booking5.id,
      razorpayOrderId: booking5.razorpayOrderId!,
      razorpayPaymentId: `pay_amt_pass_hmac_fail_${Date.now()}`,
      razorpaySignature: 'invalid_signature_hash',
    });

    const updatedBooking5 = await prisma.booking.findUnique({ where: { id: booking5.id } });

    assert(
      res5.success === false &&
        res5.error === 'Invalid payment signature. Verification failed.' &&
        updatedBooking5?.paymentStatus === PaymentStatus.FAILED,
      'Test 5: B-4 amount match + invalid HMAC passes amount check, fails HMAC, and marks paymentStatus FAILED',
      `res5: ${JSON.stringify(res5)}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Codebase Search: 0 references to ALLOW_MOCK_PAYMENTS
    // -------------------------------------------------------------------------
    const actionsRazorpayCode = fs.readFileSync(path.join(process.cwd(), 'actions/razorpay.ts'), 'utf8');
    const envExampleCode = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');

    const hasBypassInActions = actionsRazorpayCode.includes('ALLOW_MOCK_PAYMENTS');
    const hasBypassInEnv = envExampleCode.includes('ALLOW_MOCK_PAYMENTS');

    assert(
      !hasBypassInActions && !hasBypassInEnv,
      'Test 6: ALLOW_MOCK_PAYMENTS is 100% removed from actions/razorpay.ts and .env.example',
      `actions: ${hasBypassInActions}, env.example: ${hasBypassInEnv}`
    );

    // Restore fetch
    razorpay.orders.fetch = originalFetch;

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

runMockPaymentRemovalTests();
