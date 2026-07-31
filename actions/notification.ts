'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { NotificationType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Create a new notification for a student
 */
export async function createNotificationAction({
  studentId,
  title,
  message,
  type = NotificationType.BOOKING_CONFIRMED,
  metadata,
}: {
  studentId: string;
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: any;
}) {
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
    console.error('createNotificationAction Error:', error);
    return { success: false, error: 'Failed to create notification.' };
  }
}

/**
 * Fetch notifications & unread count for authenticated student
 */
export async function getStudentNotificationsAction() {
  try {
    const session = await getServerSession();
    if (!session || !session.sub) {
      return { success: false, unreadCount: 0, notifications: [] };
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { studentId: session.sub },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.notification.count({
        where: { studentId: session.sub, isRead: false },
      }),
    ]);

    return {
      success: true,
      unreadCount,
      notifications,
    };
  } catch (error) {
    console.error('getStudentNotificationsAction Error:', error);
    return { success: false, unreadCount: 0, notifications: [] };
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const session = await getServerSession();
    if (!session || !session.sub) return { success: false };

    await prisma.notification.updateMany({
      where: { id: notificationId, studentId: session.sub },
      data: { isRead: true },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsReadAction() {
  try {
    const session = await getServerSession();
    if (!session || !session.sub) return { success: false };

    await prisma.notification.updateMany({
      where: { studentId: session.sub, isRead: false },
      data: { isRead: true },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
