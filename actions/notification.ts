'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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
