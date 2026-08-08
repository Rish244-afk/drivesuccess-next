import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus, PaymentStatus, SessionStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Background Cron Job: Auto-expire PENDING bookings older than 15 minutes.
 * Can be invoked by Vercel Cron or external monitoring tool.
 * Header check: Authorization: Bearer <CRON_SECRET> (optional guard).
 */
export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      logger.error('CRON_SECRET environment variable is not configured.');
      return NextResponse.json(
        { success: false, error: 'Cron secret is not configured on server.' },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron request.' }, { status: 401 });
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Find all PENDING bookings older than 15 minutes
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: { lt: fifteenMinutesAgo },
      },
      select: { id: true, studentId: true },
    });

    if (expiredBookings.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No expired bookings to clean up.' });
    }

    const expiredBookingIds = expiredBookings.map((b) => b.id);

    // Atomic transaction: Mark bookings as CANCELLED and sessions as CANCELLED
    await prisma.$transaction([
      prisma.booking.updateMany({
        where: { id: { in: expiredBookingIds } },
        data: {
          status: BookingStatus.CANCELLED,
          notes: 'Auto-expired: 15-minute checkout window elapsed without payment.',
        },
      }),
      prisma.session.updateMany({
        where: { bookingId: { in: expiredBookingIds } },
        data: {
          status: SessionStatus.CANCELLED,
          notes: 'Session released due to expired pending booking.',
        },
      }),
    ]);

    logger.payment({
      event: 'PAYMENT_EXPIRED_CLEANUP',
      outcome: 'SUCCESS',
      details: {
        expiredCount: expiredBookings.length,
        bookingIds: expiredBookingIds,
      },
    });

    // Multi-channel notification dispatch for expired bookings
    try {
      const { dispatchNotificationEvent } = await import('@/lib/notification');
      const { sendBookingExpiredEmail } = await import('@/lib/email');

      for (const booking of expiredBookings) {
        const student = await prisma.student.findUnique({
          where: { id: booking.studentId },
          select: { email: true, phone: true, name: true },
        });

        if (student) {
          let emailHtml = '';
          if (student.email) {
            const emailRes = await sendBookingExpiredEmail({
              studentEmail: student.email,
              studentName: student.name,
              packageName: 'Driving Package',
            });
            emailHtml = (emailRes as any)?.html || '';
          }

          await dispatchNotificationEvent({
            studentId: booking.studentId,
            eventType: 'BOOKING_EXPIRED',
            title: 'Reservation Expired',
            message: 'Your 15-minute checkout window elapsed without payment. The reserved slot has been released.',
            notificationType: BookingStatus.CANCELLED as any,
            emailData: student.email
              ? {
                  to: student.email,
                  subject: `⌛ Pending Reservation Expired - Vahathi Motor Driving School`,
                  html: emailHtml,
                }
              : undefined,
            whatsAppData: student.phone
              ? {
                  phone: student.phone,
                  message: `⌛ *Vahathi Driving Alert*\nHello ${student.name}, your 15-minute reservation window elapsed without payment. The reserved slot has been released.`,
                }
              : undefined,
            metadata: { bookingId: booking.id },
          });
        }
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch expired booking notifications:', notifErr);
    }

    return NextResponse.json({
      success: true,
      count: expiredBookings.length,
      message: `Successfully cleaned up ${expiredBookings.length} expired pending bookings.`,
    });
  } catch (error) {
    logger.error('Error in cleanup-pending-bookings cron job', error);
    return NextResponse.json({ success: false, error: 'Internal cleanup error.' }, { status: 500 });
  }
}
