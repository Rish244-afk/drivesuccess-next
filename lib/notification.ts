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
