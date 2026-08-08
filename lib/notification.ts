import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationParams {
  studentId: string;
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: Record<string, any>;
}

/**
 * Private Server-Side Notification Helper.
 * NOT exported as a Next.js Server Action to prevent unauthenticated client RPC invocation.
 * Callable strictly by internal server logic (payment handlers, admin flows, contact forms).
 */
export async function createNotificationHelper({
  studentId,
  title,
  message,
  type = NotificationType.BOOKING_CONFIRMED,
  metadata,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        studentId,
        title,
        message,
        type,
        metadata: metadata || {},
      },
    });
    return { success: true, notification };
  } catch (error) {
    console.error('createNotificationHelper Error:', error);
    return { success: false, error: 'Failed to create notification.' };
  }
}

export type NotificationEventType =
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'BOOKING_CANCELLED'
  | 'SESSION_RESCHEDULED'
  | 'REFUND_PROCESSED'
  | 'BOOKING_EXPIRED'
  | 'SESSION_REMINDER';

export interface DispatchEventParams {
  studentId: string;
  eventType: NotificationEventType;
  title: string;
  message: string;
  notificationType?: NotificationType;
  emailData?: {
    to: string;
    subject: string;
    html: string;
  };
  whatsAppData?: {
    phone: string;
    message: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Unified Server-Only Event Notification Dispatcher.
 * Dispatches In-App Notification, Resend Email, and WhatsApp concurrently using Promise.allSettled.
 * Communication failures are non-blocking and NEVER fail the parent database transaction.
 */
export async function dispatchNotificationEvent({
  studentId,
  eventType,
  title,
  message,
  notificationType = NotificationType.SYSTEM_ALERT,
  emailData,
  whatsAppData,
  metadata,
}: DispatchEventParams) {
  try {
    const promises: Promise<any>[] = [];

    // 1. Create In-App Notification Record
    promises.push(
      createNotificationHelper({
        studentId,
        title,
        message,
        type: notificationType,
        metadata: {
          ...(metadata || {}),
          eventType,
        },
      })
    );

    // 2. Dispatch Email (if address provided)
    if (emailData?.to && emailData.to.includes('@')) {
      const { sendEmail } = await import('@/lib/email');
      promises.push(
        sendEmail({
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
        })
      );
    }

    // 3. Dispatch WhatsApp (if phone provided)
    if (whatsAppData?.phone) {
      const { sendWhatsAppNotificationRaw } = await import('@/lib/whatsapp');
      promises.push(
        sendWhatsAppNotificationRaw({
          phone: whatsAppData.phone,
          message: whatsAppData.message,
        })
      );
    }

    // Execute concurrently without throwing errors to caller
    await Promise.allSettled(promises);
    return { success: true };
  } catch (error) {
    console.warn(`[NotificationDispatcher] Non-blocking error for event ${eventType}:`, error);
    return { success: false };
  }
}
