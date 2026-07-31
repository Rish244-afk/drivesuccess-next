'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

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

    // 4. Calculate progress metrics
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    const totalSessions = sessions.length > 0 ? sessions.length : 10;
    const progressPercentage = Math.round((completedSessions / totalSessions) * 100);

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
