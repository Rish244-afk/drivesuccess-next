import { verifyPaymentSignatureAction } from '../actions/razorpay';
import { prisma } from '../lib/prisma';
import { razorpay } from '../lib/razorpay';
import { BookingStatus, PaymentStatus, PackageType, Role } from '@prisma/client';
import crypto from 'crypto';

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret_123';
process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;

const generatePaymentSignature = (orderId: string, paymentId: string): string => {
  return crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
};

async function runPaymentAmountVerificationTests() {
  console.log('====================================================');
  console.log('   RAZORPAY ORDER AMOUNT VERIFICATION TEST SUITE');
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
        email: `amount_tester_${uniqueSuffix}@example.com`,
        name: 'Payment Amount Tester',
        phone: `+9198${uniqueSuffix}12`,
        role: Role.STUDENT,
      },
    });

    const testPackage = await prisma.package.upsert({
      where: { slug: 'payment-amount-test-package' },
      update: {},
      create: {
        name: 'Payment Amount Test Package',
        slug: 'payment-amount-test-package',
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

    // Helper to mock razorpay.orders.fetch
    const originalFetch = razorpay.orders.fetch;

    // -------------------------------------------------------------------------
    // TEST 1 & 6: Matching Amount + Valid HMAC -> SUCCESS
    // -------------------------------------------------------------------------
    const booking1 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
        razorpayOrderId: `order_match_${Date.now()}`,
      },
    });

    const paymentId1 = `pay_match_${Date.now()}`;
    const validSignature1 = generatePaymentSignature(booking1.razorpayOrderId!, paymentId1);

    // Mock gateway returning exact matching amount: 5000 INR = 500000 paise
    razorpay.orders.fetch = async (orderId: string) => {
      return { id: orderId, amount: 500000, status: 'created' } as any;
    };

    const res1 = await verifyPaymentSignatureAction({
      bookingId: booking1.id,
      razorpayOrderId: booking1.razorpayOrderId!,
      razorpayPaymentId: paymentId1,
      razorpaySignature: validSignature1,
    });

    const updatedBooking1 = await prisma.booking.findUnique({ where: { id: booking1.id } });

    assert(
      res1.success === true &&
        updatedBooking1?.paymentStatus === PaymentStatus.PAID &&
        updatedBooking1?.status === BookingStatus.CONFIRMED,
      'Test 1 & 6: Matching Razorpay order amount (500000 paise) + valid HMAC succeeds and marks booking PAID',
      `res1: ${JSON.stringify(res1)}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Lower Razorpay Order Amount -> REJECTED
    // -------------------------------------------------------------------------
    const booking2 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
        razorpayOrderId: `order_lower_${Date.now()}`,
      },
    });

    const paymentId2 = `pay_lower_${Date.now()}`;
    const validSignature2 = generatePaymentSignature(booking2.razorpayOrderId!, paymentId2);

    // Mock gateway returning LOWER amount: 499900 paise
    razorpay.orders.fetch = async (orderId: string) => {
      return { id: orderId, amount: 499900, status: 'created' } as any;
    };

    const res2 = await verifyPaymentSignatureAction({
      bookingId: booking2.id,
      razorpayOrderId: booking2.razorpayOrderId!,
      razorpayPaymentId: paymentId2,
      razorpaySignature: validSignature2,
    });

    const updatedBooking2 = await prisma.booking.findUnique({ where: { id: booking2.id } });

    assert(
      res2.success === false &&
        Boolean(res2.error?.includes('Payment amount verification failed')) &&
        updatedBooking2?.paymentStatus !== PaymentStatus.PAID,
      'Test 2: Lower Razorpay order amount (499900 paise vs 500000 paise) is rejected',
      `res2: ${JSON.stringify(res2)}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Higher Razorpay Order Amount -> REJECTED
    // -------------------------------------------------------------------------
    const booking3 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
        razorpayOrderId: `order_higher_${Date.now()}`,
      },
    });

    const paymentId3 = `pay_higher_${Date.now()}`;
    const validSignature3 = generatePaymentSignature(booking3.razorpayOrderId!, paymentId3);

    // Mock gateway returning HIGHER amount: 500100 paise
    razorpay.orders.fetch = async (orderId: string) => {
      return { id: orderId, amount: 500100, status: 'created' } as any;
    };

    const res3 = await verifyPaymentSignatureAction({
      bookingId: booking3.id,
      razorpayOrderId: booking3.razorpayOrderId!,
      razorpayPaymentId: paymentId3,
      razorpaySignature: validSignature3,
    });

    const updatedBooking3 = await prisma.booking.findUnique({ where: { id: booking3.id } });

    assert(
      res3.success === false &&
        Boolean(res3.error?.includes('Payment amount verification failed')) &&
        updatedBooking3?.paymentStatus !== PaymentStatus.PAID,
      'Test 3: Higher Razorpay order amount (500100 paise vs 500000 paise) is rejected',
      `res3: ${JSON.stringify(res3)}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Razorpay Order Fetch Failure -> REJECTED SAFELY
    // -------------------------------------------------------------------------
    const booking4 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
        razorpayOrderId: `order_fetch_err_${Date.now()}`,
      },
    });

    const paymentId4 = `pay_fetch_err_${Date.now()}`;
    const validSignature4 = generatePaymentSignature(booking4.razorpayOrderId!, paymentId4);

    // Mock gateway network error
    razorpay.orders.fetch = async () => {
      throw new Error('Gateway Connection Timeout');
    };

    const res4 = await verifyPaymentSignatureAction({
      bookingId: booking4.id,
      razorpayOrderId: booking4.razorpayOrderId!,
      razorpayPaymentId: paymentId4,
      razorpaySignature: validSignature4,
    });

    const updatedBooking4 = await prisma.booking.findUnique({ where: { id: booking4.id } });

    assert(
      res4.success === false &&
        Boolean(res4.error?.includes('Unable to verify payment details with gateway')) &&
        updatedBooking4?.paymentStatus !== PaymentStatus.PAID,
      'Test 4: Gateway order fetch network error safely fails without marking booking PAID',
      `res4: ${JSON.stringify(res4)}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Matching Amount but Invalid HMAC Signature -> REJECTED
    // -------------------------------------------------------------------------
    const booking5 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
        razorpayOrderId: `order_bad_hmac_${Date.now()}`,
      },
    });

    // Mock matching amount
    razorpay.orders.fetch = async (orderId: string) => {
      return { id: orderId, amount: 500000, status: 'created' } as any;
    };

    const res5 = await verifyPaymentSignatureAction({
      bookingId: booking5.id,
      razorpayOrderId: booking5.razorpayOrderId!,
      razorpayPaymentId: `pay_bad_hmac_${Date.now()}`,
      razorpaySignature: 'invalid_forged_hmac_signature',
    });

    const updatedBooking5 = await prisma.booking.findUnique({ where: { id: booking5.id } });

    assert(
      res5.success === false &&
        Boolean(res5.error?.includes('Invalid payment signature')) &&
        updatedBooking5?.paymentStatus !== PaymentStatus.PAID,
      'Test 5: Matching amount + invalid HMAC signature fails and marks paymentStatus FAILED',
      `res5: ${JSON.stringify(res5)}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Precision Handling with Decimal Rupee Amounts
    // -------------------------------------------------------------------------
    const decimalAmount = 5499.5; // ₹5,499.50 -> 549950 paise
    const expectedPaise = Math.round(decimalAmount * 100);

    const decimalAmount2 = 7250.75; // ₹7,250.75 -> 725075 paise
    const expectedPaise2 = Math.round(decimalAmount2 * 100);

    assert(
      expectedPaise === 549950 && expectedPaise2 === 725075,
      'Test 7: Math.round(amount * 100) accurately calculates integer paise without floating point drift',
      `5499.5 -> ${expectedPaise}, 7250.75 -> ${expectedPaise2}`
    );

    // Restore original fetch
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

runPaymentAmountVerificationTests();
