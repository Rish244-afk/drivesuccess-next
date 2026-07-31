import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { BookingStatus, PaymentStatus } from '@prisma/client';

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
      console.error('🚨 Razorpay Webhook Signature Verification Failed!');
      return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    console.log(`🔔 Razorpay Webhook Event Received: ${event}`);

    // Extract Booking ID from notes or order receipt
    const bookingId =
      paymentEntity?.notes?.bookingId ||
      orderEntity?.notes?.bookingId ||
      paymentEntity?.receipt?.replace('receipt_', '');

    if (bookingId) {
      // 2. Handle Payment Captured / Order Paid Event
      if (event === 'payment.captured' || event === 'order.paid') {
        const paymentId = paymentEntity?.id || 'pay_wh_' + Date.now();
        const orderId = paymentEntity?.order_id || orderEntity?.id || 'order_wh_' + Date.now();

        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
          },
        });
        console.log(`✅ Webhook updated Booking ${bookingId} to PAID & CONFIRMED.`);
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
        console.log(`❌ Webhook updated Booking ${bookingId} to FAILED.`);
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
        console.log(`↩️ Webhook updated Booking ${bookingId} to REFUNDED.`);
      }
    }

    return NextResponse.json({ success: true, status: 'processed' }, { status: 200 });
  } catch (error) {
    console.error('Razorpay Webhook Handler Error:', error);
    return NextResponse.json({ success: false, error: 'Internal webhook error' }, { status: 500 });
  }
}
