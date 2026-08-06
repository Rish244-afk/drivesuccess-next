import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { razorpay } from '@/lib/razorpay';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Background Payment Reconciliation Endpoint.
 * Fetches recent pending bookings with Razorpay order IDs and checks
 * Razorpay API for captured payments that missed client/webhook verification.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron request.' }, { status: 401 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find pending bookings created in the last 24h that have a razorpayOrderId
    const pendingBookings = await prisma.booking.findMany({
      where: {
        paymentStatus: PaymentStatus.PENDING,
        razorpayOrderId: { not: null },
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: { id: true, razorpayOrderId: true, studentId: true },
    });

    let reconciledCount = 0;

    for (const booking of pendingBookings) {
      if (!booking.razorpayOrderId) continue;

      try {
        // Query Razorpay API for payments associated with this order ID
        const paymentsRes: any = await razorpay.orders.fetchPayments(booking.razorpayOrderId);
        const payments = paymentsRes?.items || [];

        // Check if any payment for this order was captured
        const capturedPayment = payments.find((p: any) => p.status === 'captured');

        if (capturedPayment) {
          // Atomic single-winner commit update
          const updateResult = await prisma.booking.updateMany({
            where: {
              id: booking.id,
              paymentStatus: { not: PaymentStatus.PAID },
            },
            data: {
              status: BookingStatus.CONFIRMED,
              paymentStatus: PaymentStatus.PAID,
              razorpayPaymentId: capturedPayment.id,
              paidAt: new Date(capturedPayment.created_at * 1000),
            },
          });

          if (updateResult.count > 0) {
            reconciledCount++;
            logger.payment({
              event: 'PAYMENT_RECONCILED',
              outcome: 'SUCCESS',
              bookingId: booking.id,
              studentId: booking.studentId,
              razorpayOrderId: booking.razorpayOrderId,
              razorpayPaymentId: capturedPayment.id,
              reason: 'Reconciled captured payment via background Razorpay API query',
            });
          }
        }
      } catch (orderErr) {
        logger.warn('Failed to fetch payments for order during reconciliation', {
          bookingId: booking.id,
          orderId: booking.razorpayOrderId,
          error: String(orderErr),
        });
      }
    }

    return NextResponse.json({
      success: true,
      pendingChecked: pendingBookings.length,
      reconciledCount,
      message: `Reconciliation complete. Checked ${pendingBookings.length} pending orders, reconciled ${reconciledCount}.`,
    });
  } catch (error) {
    logger.error('Error in payment reconciliation cron job', error);
    return NextResponse.json({ success: false, error: 'Internal reconciliation error.' }, { status: 500 });
  }
}
