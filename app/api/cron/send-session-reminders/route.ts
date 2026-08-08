import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionStatus, NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { dispatchNotificationEvent } from '@/lib/notification';
import { sendSessionReminderEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Background Cron Job: Send 24-Hour Upcoming Session Reminders.
 * Executed daily/hourly via Vercel Cron.
 * Header check: Authorization: Bearer <CRON_SECRET>.
 * Idempotent: Checks Notification metadata to guarantee only one reminder per session.
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

    const now = new Date();
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find all scheduled sessions starting in 23-25 hours
    const upcomingSessions = await prisma.session.findMany({
      where: {
        status: SessionStatus.SCHEDULED,
        scheduledAt: {
          gte: twentyThreeHoursFromNow,
          lte: twentyFiveHoursFromNow,
        },
        booking: {
          status: { not: 'CANCELLED' },
        },
      },
      include: {
        student: true,
        instructor: true,
        vehicle: true,
      },
    });

    if (upcomingSessions.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No upcoming sessions for 24h reminder.' });
    }

    let dispatchedCount = 0;

    for (const sessionRecord of upcomingSessions) {
      // Idempotency check: Ensure reminder was not already dispatched for this session
      const existingNotifs = await prisma.notification.findMany({
        where: {
          studentId: sessionRecord.studentId,
          type: NotificationType.SESSION_SCHEDULED,
        },
        select: { metadata: true },
      });

      const alreadySent = existingNotifs.some(
        (n: any) =>
          n.metadata?.sessionId === sessionRecord.id &&
          n.metadata?.eventType === 'SESSION_REMINDER'
      );

      if (alreadySent) {
        continue;
      }

      const formattedTime = new Date(sessionRecord.scheduledAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const formattedDate = new Date(sessionRecord.scheduledAt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }) + ' at ' + formattedTime;

      let emailHtml = '';
      if (sessionRecord.student?.email) {
        const emailRes = await sendSessionReminderEmail({
          studentEmail: sessionRecord.student.email,
          studentName: sessionRecord.student.name,
          scheduledAt: formattedDate,
          instructorName: sessionRecord.instructor.name,
          vehicleName: sessionRecord.vehicle.name,
        });
        emailHtml = (emailRes as any)?.html || '';
      }

      await dispatchNotificationEvent({
        studentId: sessionRecord.studentId,
        eventType: 'SESSION_REMINDER',
        title: 'Session Reminder: Tomorrow',
        message: `Your driving lesson with ${sessionRecord.instructor.name} is scheduled for tomorrow at ${formattedTime}.`,
        notificationType: NotificationType.SESSION_SCHEDULED,
        emailData: sessionRecord.student?.email
          ? {
              to: sessionRecord.student.email,
              subject: `🚗 Upcoming Session Reminder - Tomorrow at ${formattedTime}`,
              html: emailHtml,
            }
          : undefined,
        whatsAppData: sessionRecord.student?.phone
          ? {
              phone: sessionRecord.student.phone,
              message: `🚗 *DriveSuccess Reminder*\nHello ${sessionRecord.student.name}, your driving session with ${sessionRecord.instructor.name} is scheduled for tomorrow at ${formattedTime}.`,
            }
          : undefined,
        metadata: {
          sessionId: sessionRecord.id,
          bookingId: sessionRecord.bookingId,
          scheduledAt: sessionRecord.scheduledAt.toISOString(),
        },
      });

      dispatchedCount++;
    }

    return NextResponse.json({
      success: true,
      count: dispatchedCount,
      message: `Successfully dispatched ${dispatchedCount} session reminder notifications.`,
    });
  } catch (error) {
    logger.error('Error in send-session-reminders cron job', error);
    return NextResponse.json({ success: false, error: 'Internal reminder cron error.' }, { status: 500 });
  }
}
