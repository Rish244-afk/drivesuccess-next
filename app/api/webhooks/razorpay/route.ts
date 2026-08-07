import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ success: false, error: 'Missing webhook signature' }, { status: 400 });
    }

    // 1. Verify Webhook HMAC SHA256 Signature
    const isValid = verifyWebhookSignature({ rawBody, signature });
    if (!isValid) {
      logger.payment({
        event: 'PAYMENT_WEBHOOK_RECEIVED',
        outcome: 'FAILURE',
        reason: 'Webhook HMAC SHA256 Signature verification failed',
      });
      return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    // Extract Booking ID from notes or order receipt
    const bookingId =
      paymentEntity?.notes?.bookingId ||
      orderEntity?.notes?.bookingId ||
      paymentEntity?.receipt?.replace('receipt_', '');

    logger.payment({
      event: 'PAYMENT_WEBHOOK_RECEIVED',
      outcome: 'SUCCESS',
      bookingId: bookingId || undefined,
      razorpayOrderId: paymentEntity?.order_id || orderEntity?.id,
      razorpayPaymentId: paymentEntity?.id,
      details: { webhookEvent: event },
    });

    if (bookingId) {
      // Fetch existing booking record to check for duplicate webhook delivery
      const existingBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      // 2. Handle Payment Captured / Order Paid Event
      if (event === 'payment.captured' || event === 'order.paid') {
        if (existingBooking?.paymentStatus === PaymentStatus.PAID) {
          return NextResponse.json({ success: true, status: 'already_processed' }, { status: 200 });
        }

        const paymentId = paymentEntity?.id;
        const orderId = paymentEntity?.order_id || orderEntity?.id;

        if (!paymentId || !orderId) {
          logger.payment({
            event: 'PAYMENT_WEBHOOK_RECEIVED',
            outcome: 'FAILURE',
            bookingId,
            reason: 'Missing paymentId or orderId in captured payment webhook payload',
          });
          return NextResponse.json(
            { success: false, error: 'Missing required Razorpay payment or order ID in webhook payload.' },
            { status: 400 }
          );
        }

        // Atomic Single-Winner Commit Pattern
        const updateResult = await prisma.booking.updateMany({
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

        if (updateResult.count === 0) {
          return NextResponse.json({ success: true, status: 'already_processed' }, { status: 200 });
        }

        logger.payment({
          event: 'PAYMENT_VERIFY_SUCCESS',
          outcome: 'SUCCESS',
          bookingId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          reason: 'Confirmed via Razorpay Webhook',
        });
      }

      // 3. Handle Payment Failed Event
      else if (event === 'payment.failed') {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: PaymentStatus.FAILED,
            notes: `Payment Failed via Webhook: ${paymentEntity?.error_description || 'Transaction declined'}`,
          },
        });
      }

      // 4. Handle Refund Processed Event
      else if (event === 'refund.processed') {
        const refundEntity = payload.payload?.refund?.entity;
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.CANCELLED,
            paymentStatus: PaymentStatus.REFUNDED,
            refundId: refundEntity?.id,
            refundAmount: refundEntity?.amount ? refundEntity.amount / 100 : undefined,
            refundedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true, status: 'processed' }, { status: 200 });
  } catch (error) {
    logger.error('Razorpay Webhook Handler Exception', error);
    return NextResponse.json({ success: false, error: 'Internal webhook error' }, { status: 500 });
  }
}
