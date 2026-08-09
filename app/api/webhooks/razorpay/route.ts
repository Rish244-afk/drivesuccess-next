import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { BookingStatus, PaymentStatus, SessionStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ success: false, error: 'Missing webhook signature' }, { status: 400 });
    }

    // 1. Verify Webhook HMAC SHA256 Signature BEFORE parsing JSON
    const isValid = verifyWebhookSignature({ rawBody, signature });
    if (!isValid) {
      logger.payment({
        event: 'PAYMENT_WEBHOOK_RECEIVED',
        outcome: 'FAILURE',
        reason: 'Webhook HMAC SHA256 Signature verification failed',
      });
      return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 400 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    // 2. Read and Validate Event ID & Event Type
    const eventId = payload.event_id || payload.id;
    if (!eventId || typeof eventId !== 'string' || !eventId.trim()) {
      return NextResponse.json({ success: false, error: 'Missing webhook event ID' }, { status: 400 });
    }

    const event = payload.event;
    if (!event || typeof event !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing webhook event type' }, { status: 400 });
    }

    // 3. Supported Events Filter (Ignore unsupported events with HTTP 200 without creating WebhookEvent)
    const supportedEvents = ['payment.captured', 'order.paid', 'payment.failed', 'refund.processed'];
    if (!supportedEvents.includes(event)) {
      return NextResponse.json({ success: true, status: 'ignored' }, { status: 200 });
    }

    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const refundEntity = payload.payload?.refund?.entity;

    // 4. Extract Booking ID from entities/notes/receipt
    const bookingId: string | null =
      paymentEntity?.notes?.bookingId ||
      orderEntity?.notes?.bookingId ||
      refundEntity?.notes?.bookingId ||
      paymentEntity?.receipt?.replace('receipt_', '') ||
      null;

    logger.payment({
      event: 'PAYMENT_WEBHOOK_RECEIVED',
      outcome: 'SUCCESS',
      bookingId: bookingId || undefined,
      razorpayOrderId: paymentEntity?.order_id || orderEntity?.id,
      razorpayPaymentId: paymentEntity?.id,
      details: { webhookEvent: event, eventId: eventId.trim() },
    });

    // 5. Atomic Single-Winner Idempotent Transaction
    try {
      const transactionResult = await prisma.$transaction(async (tx) => {
        // Step A: Atomically claim the webhook event (Enforces unique eventId)
        await tx.webhookEvent.create({
          data: {
            eventId: eventId.trim(),
            eventType: event,
            bookingId: bookingId || null,
            payload: payload,
          },
        });

        // Step B: Handle Refund Processed Event
        if (event === 'refund.processed') {
          if (!refundEntity) {
            throw new Error('MISSING_REFUND_ENTITY');
          }

          const refundAmountPaise = refundEntity.amount;
          if (
            typeof refundAmountPaise !== 'number' ||
            isNaN(refundAmountPaise) ||
            refundAmountPaise <= 0
          ) {
            throw new Error('INVALID_REFUND_AMOUNT');
          }

          const refundAmountRupees = refundAmountPaise / 100;
          const refundId = refundEntity.id;

          if (bookingId) {
            const existingBooking = await tx.booking.findUnique({
              where: { id: bookingId },
              select: { id: true, paymentStatus: true },
            });

            if (existingBooking) {
              if (existingBooking.paymentStatus === PaymentStatus.REFUNDED) {
                return { status: 'already_refunded' as const };
              }

              await tx.booking.update({
                where: { id: bookingId },
                data: {
                  status: BookingStatus.CANCELLED,
                  paymentStatus: PaymentStatus.REFUNDED,
                  refundId: refundId || undefined,
                  refundAmount: refundAmountRupees,
                  refundedAt: new Date(),
                },
              });

              await tx.session.updateMany({
                where: { bookingId },
                data: {
                  status: SessionStatus.CANCELLED,
                  notes: 'Session cancelled due to webhook refund confirmation.',
                },
              });
            }
          }

          return { status: 'processed' as const };
        }

        // Step C: Handle Payment Captured / Order Paid Event
        if (event === 'payment.captured' || event === 'order.paid') {
          const paymentId = paymentEntity?.id;
          const orderId = paymentEntity?.order_id || orderEntity?.id;

          if (!paymentId || !orderId) {
            throw new Error('MISSING_PAYMENT_OR_ORDER_ID');
          }

          if (bookingId) {
            await tx.booking.updateMany({
              where: {
                id: bookingId,
                paymentStatus: { not: PaymentStatus.PAID },
              },
              data: {
                status: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                paidAt: new Date(),
              },
            });
          }

          return { status: 'processed' as const };
        }

        // Step D: Handle Payment Failed Event
        if (event === 'payment.failed') {
          if (bookingId) {
            await tx.booking.updateMany({
              where: {
                id: bookingId,
                paymentStatus: { not: PaymentStatus.PAID },
              },
              data: {
                paymentStatus: PaymentStatus.FAILED,
                notes: `Payment Failed via Webhook: ${paymentEntity?.error_description || 'Transaction declined'}`,
              },
            });
          }

          return { status: 'processed' as const };
        }

        return { status: 'processed' as const };
      });

      return NextResponse.json({ success: true, status: transactionResult.status }, { status: 200 });
    } catch (txError: any) {
      // P2002: Unique constraint violation on eventId -> Event already processed
      if (txError?.code === 'P2002') {
        return NextResponse.json({ success: true, status: 'already_processed' }, { status: 200 });
      }

      if (txError?.message === 'INVALID_REFUND_AMOUNT') {
        return NextResponse.json({ success: false, error: 'Invalid refund amount' }, { status: 400 });
      }

      if (txError?.message === 'MISSING_PAYMENT_OR_ORDER_ID' || txError?.message === 'MISSING_REFUND_ENTITY') {
        return NextResponse.json({ success: false, error: 'Missing required entity data' }, { status: 400 });
      }

      // Re-throw unexpected database errors to outer catch block for rollback + 500 response
      throw txError;
    }
  } catch (error) {
    logger.error('Razorpay Webhook Handler Exception', error);
    return NextResponse.json({ success: false, error: 'Internal webhook error' }, { status: 500 });
  }
}
