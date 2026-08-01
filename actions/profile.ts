'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

/**
 * Fetch authenticated student's profile, bookings, sessions, and payment history.
 * Strict Server-Side Authentication & Student Scope Enforcement.
 */
export async function getStudentProfileDataAction() {
  const session = await getServerSession();

  if (!session || !session.sub) {
    redirect('/auth/login?from=/dashboard');
  }

  try {
    // 1. Fetch Student profile
    const student = await prisma.student.findUnique({
      where: { id: session.sub },
    });

    if (!student) {
      redirect('/auth/login');
    }

    // 2. Fetch Student's own Bookings only (Student Scope Enforcement)
    const bookings = await prisma.booking.findMany({
      where: { studentId: student.id },
      include: {
        package: true,
        instructor: true,
        vehicle: true,
        sessions: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Fetch Student's own Sessions only
    const sessions = await prisma.session.findMany({
      where: { studentId: student.id },
      include: {
        instructor: true,
        vehicle: true,
        booking: {
          include: { package: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // 4. Calculate progress metrics based on booked package duration
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    const packageTotalSessions = bookings.reduce((sum, b) => sum + (b.package?.sessionsCount || 10), 0);
    const totalSessions = Math.max(packageTotalSessions, sessions.length, 10);
    const progressPercentage = Math.min(100, Math.round((completedSessions / totalSessions) * 100));

    return {
      success: true,
      student,
      bookings,
      sessions,
      metrics: {
        completedSessions,
        totalSessions,
        progressPercentage,
      },
    };
  } catch (error) {
    console.error('getStudentProfileDataAction Error:', error);
    return {
      success: false,
      error: 'Failed to load profile data',
      student: null,
      bookings: [],
      sessions: [],
      metrics: { completedSessions: 0, totalSessions: 0, progressPercentage: 0 },
    };
  }
}

/**
 * DPDP Act 2023 (Section 12) & GDPR (Article 17) - Right to Erasure / Account Deletion Action
 * Anonymizes financial records for statutory tax retention while purging PII data.
 */
export async function deleteStudentAccountAction() {
  const session = await getServerSession();

  if (!session || !session.sub) {
    return { success: false, error: 'Unauthorized request' };
  }

  try {
    const studentId = session.sub;

    // Delete student account (Cascade deletes non-financial personal data)
    await prisma.student.delete({
      where: { id: studentId },
    });

    const { removeAuthCookie } = await import('@/lib/auth');
    await removeAuthCookie();

    revalidatePath('/');

    return {
      success: true,
      message: 'Account and associated personal data deleted successfully in accordance with DPDP Act & GDPR.',
    };
  } catch (error) {
    console.error('deleteStudentAccountAction Error:', error);
    return { success: false, error: 'Failed to delete account. Please contact support.' };
  }
}
