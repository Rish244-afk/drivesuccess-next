'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession, removeAuthCookie } from '@/lib/auth';
import { Role } from '@prisma/client';
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

  // Cross-Role Access Handling: If logged in as ADMIN, redirect to /admin
  if (session.role === Role.ADMIN) {
    redirect('/admin');
  }

  try {
    // 1. Fetch Student profile
    const student = await prisma.student.findUnique({
      where: { id: session.sub },
      include: {
        documents: true,
      },
    });

    if (!student) {
      console.warn(`⚠️ Stale JWT token for missing student ID ${session.sub}. Clearing auth cookie.`);
      await removeAuthCookie();
      redirect('/auth/login');
    }

    if (student.role === Role.ADMIN) {
      redirect('/admin');
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
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT') || (error as any)?.message === 'NEXT_REDIRECT') {
      throw error;
    }
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
 * Update authenticated student's profile information.
 */
export async function updateStudentProfileAction(data: {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  licenseNo?: string;
  avatarUrl?: string;
}) {
  const session = await getServerSession();

  if (!session || !session.sub) {
    return { success: false, error: 'Unauthorized request' };
  }

  try {
    const studentId = session.sub;

    // Normalize phone number (preserve leading +, remove spaces/hyphens/formatting)
    const normalizedPhone = data.phone !== undefined ? data.phone.trim().replace(/[^\d+]/g, '') : undefined;

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(normalizedPhone !== undefined && { phone: normalizedPhone }),
        ...(data.address !== undefined && { address: data.address.trim() }),
        ...(data.city !== undefined && { city: data.city.trim() }),
        ...(data.state !== undefined && { state: data.state.trim() }),
        ...(data.zipCode !== undefined && { zipCode: data.zipCode.trim() }),
        ...(data.licenseNo !== undefined && { licenseNo: data.licenseNo.trim() }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/settings');

    return {
      success: true,
      student: updatedStudent,
      message: 'Profile updated successfully!',
    };
  } catch (error: any) {
    console.error('updateStudentProfileAction Error:', error);
    if (error?.code === 'P2002') {
      return { success: false, error: 'The phone number or email is already registered to another account.' };
    }
    return { success: false, error: 'Failed to update profile. Please try again.' };
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

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, authVersion: true },
    });

    if (!student) {
      return { success: false, error: 'Student account not found.' };
    }

    // DPDP Act 2023 & GDPR Statutory Anonymization:
    // 1. Anonymize PII fields on Student record
    // 2. Increment authVersion to invalidate all existing JWT cookies
    // 3. Retain referential Booking & Session records for tax/accounting audit
    await prisma.$transaction(async (tx) => {
      // Purge student documents (personal PII uploads)
      await tx.studentDocument.deleteMany({
        where: { studentId },
      });

      // Purge student notifications
      await tx.notification.deleteMany({
        where: { studentId },
      });

      // Anonymize student PII while preserving student record ID for booking relations
      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: {
          name: 'Anonymized Student',
          email: null,
          phone: null,
          googleId: null,
          avatarUrl: null,
          address: null,
          city: null,
          state: null,
          zipCode: null,
          licenseNo: null,
          emailVerified: false,
          phoneVerified: false,
          authVersion: { increment: 1 },
        },
        select: { id: true, authVersion: true },
      });

      const { setStudentAuthVersionRedis } = await import('@/lib/redis');
      await setStudentAuthVersionRedis(studentId, updatedStudent.authVersion);
    });

    await removeAuthCookie();
    revalidatePath('/');

    return {
      success: true,
      message: 'Account and associated personal data deleted/anonymized successfully in accordance with DPDP Act & GDPR.',
    };
  } catch (error) {
    console.error('deleteStudentAccountAction Error:', error);
    return { success: false, error: 'Failed to delete account. Please contact support.' };
  }
}
