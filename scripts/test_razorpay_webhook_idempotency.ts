import { POST } from '../app/api/webhooks/razorpay/route';
import { NextRequest } from 'next/server';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { BookingStatus, PaymentStatus, PackageType, Role } from '@prisma/client';

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret_key_123';
process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

function generateSignature(payloadStr: string): string {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(payloadStr).digest('hex');
}

function createWebhookRequest(bodyObj: any, customSignature?: string | null): NextRequest {
  const bodyStr = typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj);
  const signature = customSignature !== undefined ? customSignature : generateSignature(bodyStr);

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (signature !== null) {
    headers['x-razorpay-signature'] = signature;
  }

  return new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers,
    body: bodyStr,
  });
}

async function runRazorpayWebhookIdempotencyTests() {
  console.log('====================================================');
  console.log('  RAZORPAY WEBHOOK ATOMIC IDEMPOTENCY TEST SUITE');
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
    // Setup Test Student & Package & Bookings
    // -------------------------------------------------------------------------
    const testStudent = await prisma.student.upsert({
      where: { email: 'webhook_test_student@example.com' },
      update: {},
      create: {
        email: 'webhook_test_student@example.com',
        name: 'Webhook Test Student',
        phone: '+919988776655',
        role: Role.STUDENT,
      },
    });

    const testPackage = await prisma.package.upsert({
      where: { slug: 'webhook-test-package' },
      update: {},
      create: {
        name: 'Webhook Test Package',
        slug: 'webhook-test-package',
        type: PackageType.LICENSE_4W,
        price: 5000,
        sessionsCount: 10,
        description: 'Test package description',
      },
    });

    // Create Booking 1 for Refund Tests
    const booking1 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        totalAmount: 5000,
        razorpayPaymentId: `pay_test_${Date.now()}`,
        razorpayOrderId: `order_test_${Date.now()}`,
      },
    });

    // -------------------------------------------------------------------------
    // TEST 1: First Valid Refund Webhook -> PROCESSED
    // -------------------------------------------------------------------------
    const refundEventId1 = `evt_refund_${Date.now()}_1`;
    const refundPayload1 = {
      event_id: refundEventId1,
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: `rfnd_test_${Date.now()}_1`,
            amount: 500000, // 5000 INR in paise
            notes: {
              bookingId: booking1.id,
            },
          },
        },
      },
    };

    const req1 = createWebhookRequest(refundPayload1);
    const res1 = await POST(req1);
    const body1 = await res1.json();

    const updatedBooking1 = await prisma.booking.findUnique({ where: { id: booking1.id } });
    const savedEvent1 = await prisma.webhookEvent.findUnique({ where: { eventId: refundEventId1 } });

    assert(
      res1.status === 200 &&
        body1.status === 'processed' &&
        updatedBooking1?.paymentStatus === PaymentStatus.REFUNDED &&
        updatedBooking1?.status === BookingStatus.CANCELLED &&
        updatedBooking1?.refundAmount === 5000 &&
        savedEvent1 !== null,
      'Test 1: First valid refund.processed webhook processed atomically and converted paise to rupees',
      `res status: ${res1.status}, body: ${JSON.stringify(body1)}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Sequential Duplicate Refund Webhook -> ALREADY_PROCESSED
    // -------------------------------------------------------------------------
    const req2 = createWebhookRequest(refundPayload1);
    const res2 = await POST(req2);
    const body2 = await res2.json();

    assert(
      res2.status === 200 && body2.status === 'already_processed',
      'Test 2: Sequential duplicate webhook returns HTTP 200 already_processed without duplicate mutation',
      `res status: ${res2.status}, body: ${JSON.stringify(body2)}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Concurrent Duplicate Webhooks -> Exactly 1 Winner (TOCTOU Proof)
    // -------------------------------------------------------------------------
    // Create fresh Booking 2
    const booking2 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        totalAmount: 5000,
        razorpayPaymentId: `pay_test_${Date.now()}_2`,
        razorpayOrderId: `order_test_${Date.now()}_2`,
      },
    });

    const refundEventIdConcurrent = `evt_concurrent_${Date.now()}`;
    const concurrentPayload = {
      event_id: refundEventIdConcurrent,
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: `rfnd_concurrent_${Date.now()}`,
            amount: 500000,
            notes: {
              bookingId: booking2.id,
            },
          },
        },
      },
    };

    const concurrentReqA = createWebhookRequest(concurrentPayload);
    const concurrentReqB = createWebhookRequest(concurrentPayload);

    const [concurrentResA, concurrentResB] = await Promise.all([
      POST(concurrentReqA),
      POST(concurrentReqB),
    ]);

    const concurrentBodyA = await concurrentResA.json();
    const concurrentBodyB = await concurrentResB.json();

    const statuses = [concurrentBodyA.status, concurrentBodyB.status].sort();
    const eventCount = await prisma.webhookEvent.count({ where: { eventId: refundEventIdConcurrent } });

    assert(
      concurrentResA.status === 200 &&
        concurrentResB.status === 200 &&
        statuses[0] === 'already_processed' &&
        statuses[1] === 'processed' &&
        eventCount === 1,
      'Test 3: Concurrent duplicate webhooks resolved atomically (1 processed, 1 already_processed, 1 DB event record)',
      `statuses: ${JSON.stringify(statuses)}, eventCount: ${eventCount}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Invalid HMAC Signature -> REJECTED HTTP 400
    // -------------------------------------------------------------------------
    const invalidSigEventId = `evt_invalid_sig_${Date.now()}`;
    const invalidSigReq = createWebhookRequest(
      { event_id: invalidSigEventId, event: 'refund.processed' },
      'invalid_fake_signature_hash'
    );
    const res4 = await POST(invalidSigReq);
    const body4 = await res4.json();
    const invalidSigEvent = await prisma.webhookEvent.findUnique({ where: { eventId: invalidSigEventId } });

    assert(
      res4.status === 400 && body4.error === 'Invalid webhook signature' && invalidSigEvent === null,
      'Test 4: Invalid webhook signature returns HTTP 400 and creates no DB records',
      `res status: ${res4.status}, body: ${JSON.stringify(body4)}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Missing Signature Header -> REJECTED HTTP 400
    // -------------------------------------------------------------------------
    const missingSigReq = createWebhookRequest({ event_id: `evt_${Date.now()}`, event: 'refund.processed' }, null);
    const res5 = await POST(missingSigReq);
    const body5 = await res5.json();

    assert(
      res5.status === 400 && body5.error === 'Missing webhook signature',
      'Test 5: Missing signature header returns HTTP 400',
      `res status: ${res5.status}, body: ${JSON.stringify(body5)}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Missing Event ID -> REJECTED HTTP 400
    // -------------------------------------------------------------------------
    const missingEventIdReq = createWebhookRequest({ event: 'refund.processed', payload: {} });
    const res6 = await POST(missingEventIdReq);
    const body6 = await res6.json();

    assert(
      res6.status === 400 && body6.error === 'Missing webhook event ID',
      'Test 6: Missing webhook event ID returns HTTP 400',
      `res status: ${res6.status}, body: ${JSON.stringify(body6)}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Unsupported / Unknown Event -> IGNORED HTTP 200
    // -------------------------------------------------------------------------
    const unknownEventId = `evt_unknown_${Date.now()}`;
    const unknownEventReq = createWebhookRequest({
      event_id: unknownEventId,
      event: 'subscription.authenticated',
      payload: {},
    });
    const res7 = await POST(unknownEventReq);
    const body7 = await res7.json();
    const unknownSavedEvent = await prisma.webhookEvent.findUnique({ where: { eventId: unknownEventId } });

    assert(
      res7.status === 200 && body7.status === 'ignored' && unknownSavedEvent === null,
      'Test 7: Unsupported event returns HTTP 200 ignored without creating WebhookEvent',
      `res status: ${res7.status}, body: ${JSON.stringify(body7)}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Already Refunded Booking (Different Event ID) -> ALREADY_REFUNDED HTTP 200
    // -------------------------------------------------------------------------
    // booking1 is already refunded from Test 1. Send new refund event for same booking:
    const refundEventIdDiff = `evt_diff_${Date.now()}`;
    const diffRefundPayload = {
      event_id: refundEventIdDiff,
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: `rfnd_diff_${Date.now()}`,
            amount: 500000,
            notes: {
              bookingId: booking1.id,
            },
          },
        },
      },
    };
    const req8 = createWebhookRequest(diffRefundPayload);
    const res8 = await POST(req8);
    const body8 = await res8.json();

    assert(
      res8.status === 200 && body8.status === 'already_refunded',
      'Test 8: New refund webhook on already REFUNDED booking returns HTTP 200 already_refunded',
      `res status: ${res8.status}, body: ${JSON.stringify(body8)}`
    );

    // -------------------------------------------------------------------------
    // TEST 9: Transaction Rollback on Failure (Invalid Refund Amount)
    // -------------------------------------------------------------------------
    const rollbackEventId = `evt_rollback_${Date.now()}`;
    const invalidAmountPayload = {
      event_id: rollbackEventId,
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: `rfnd_bad_${Date.now()}`,
            amount: -100, // Negative amount causes error inside transaction
            notes: {
              bookingId: booking1.id,
            },
          },
        },
      },
    };
    const req9 = createWebhookRequest(invalidAmountPayload);
    const res9 = await POST(req9);
    const body9 = await res9.json();
    const rollbackSavedEvent = await prisma.webhookEvent.findUnique({ where: { eventId: rollbackEventId } });

    assert(
      res9.status === 400 &&
        body9.error === 'Invalid refund amount' &&
        rollbackSavedEvent === null,
      'Test 9: Transaction rollback cleans up WebhookEvent row on validation/mutation failure',
      `res status: ${res9.status}, body: ${JSON.stringify(body9)}`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Existing payment.captured Webhook & Idempotency
    // -------------------------------------------------------------------------
    const booking3 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
      },
    });

    const paymentEventId = `evt_pay_cap_${Date.now()}`;
    const paymentCapturedPayload = {
      event_id: paymentEventId,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_captured_${Date.now()}`,
            order_id: `order_captured_${Date.now()}`,
            notes: {
              bookingId: booking3.id,
            },
          },
        },
      },
    };

    const req10 = createWebhookRequest(paymentCapturedPayload);
    const res10 = await POST(req10);
    const body10 = await res10.json();

    const updatedBooking3 = await prisma.booking.findUnique({ where: { id: booking3.id } });

    // Duplicate delivery of payment.captured:
    const req10Dup = createWebhookRequest(paymentCapturedPayload);
    const res10Dup = await POST(req10Dup);
    const body10Dup = await res10Dup.json();

    assert(
      res10.status === 200 &&
        body10.status === 'processed' &&
        updatedBooking3?.paymentStatus === PaymentStatus.PAID &&
        updatedBooking3?.status === BookingStatus.CONFIRMED &&
        res10Dup.status === 200 &&
        body10Dup.status === 'already_processed',
      'Test 10: payment.captured marks booking PAID and duplicate delivery returns already_processed',
      `res status: ${res10.status}, dup status: ${res10Dup.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 11: Existing order.paid Webhook & Idempotency
    // -------------------------------------------------------------------------
    const booking4 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
      },
    });

    const orderPaidEventId = `evt_order_paid_${Date.now()}`;
    const orderPaidPayload = {
      event_id: orderPaidEventId,
      event: 'order.paid',
      payload: {
        payment: {
          entity: {
            id: `pay_order_${Date.now()}`,
            order_id: `order_paid_${Date.now()}`,
            notes: {
              bookingId: booking4.id,
            },
          },
        },
      },
    };

    const req11 = createWebhookRequest(orderPaidPayload);
    const res11 = await POST(req11);
    const body11 = await res11.json();

    const req11Dup = createWebhookRequest(orderPaidPayload);
    const res11Dup = await POST(req11Dup);
    const body11Dup = await res11Dup.json();

    assert(
      res11.status === 200 &&
        body11.status === 'processed' &&
        res11Dup.status === 200 &&
        body11Dup.status === 'already_processed',
      'Test 11: order.paid processes successfully and duplicate returns already_processed',
      `res status: ${res11.status}, dup status: ${res11Dup.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 12: Existing payment.failed Webhook
    // -------------------------------------------------------------------------
    const booking5 = await prisma.booking.create({
      data: {
        studentId: testStudent.id,
        packageId: testPackage.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 5000,
      },
    });

    const paymentFailedEventId = `evt_pay_fail_${Date.now()}`;
    const paymentFailedPayload = {
      event_id: paymentFailedEventId,
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: `pay_fail_${Date.now()}`,
            error_description: 'Card expired',
            notes: {
              bookingId: booking5.id,
            },
          },
        },
      },
    };

    const req12 = createWebhookRequest(paymentFailedPayload);
    const res12 = await POST(req12);
    const body12 = await res12.json();

    const updatedBooking5 = await prisma.booking.findUnique({ where: { id: booking5.id } });

    assert(
      res12.status === 200 &&
        body12.status === 'processed' &&
        updatedBooking5?.paymentStatus === PaymentStatus.FAILED,
      'Test 12: payment.failed webhook marks paymentStatus FAILED',
      `res status: ${res12.status}, booking paymentStatus: ${updatedBooking5?.paymentStatus}`
    );

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

runRazorpayWebhookIdempotencyTests();
