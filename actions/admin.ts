'use server';

import { prisma } from '@/lib/prisma';
import { signSessionToken, setAuthCookie, removeAuthCookie, getServerSession } from '@/lib/auth';
import { Role, BookingStatus, PaymentStatus, VehicleTier, Transmission, VehicleStatus, PackageType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { adminLoginRateLimiter } from '@/lib/rateLimit';
import {
  createPackageSchema,
  createVehicleSchema,
  createInstructorSchema,
  bookingAssignmentSchema,
  cancelBookingSchema,
  updateDocumentStatusSchema,
  entityIdSchema,
} from '@/lib/security';
import { ZodError } from 'zod';

const ADMIN_COOKIE_NAME = 'admin_auth_token';

function getAdminClientIp(): string {
  try {
    const headerList = headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    const realIp = headerList.get('x-real-ip');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();
    if (realIp) return realIp.trim();
  } catch {}
  return '127.0.0.1';
}

/**
 * 1. Admin Separate Login Action
 * Hardcoded default credentials: admin@drivesuccess.edu / REDACTED_ADMIN_PASSWORD
 */
export async function adminLoginAction(formData: FormData) {
  try {
    // 1. Rate limiting check (5 attempts / 15 mins) before credential evaluation
    const clientIp = getAdminClientIp();
    const rateCheck = await adminLoginRateLimiter.check(`admin_login_${clientIp}`);
    if (!rateCheck.success) {
      return {
        success: false,
        error: 'Too many login attempts. Please wait 15 minutes before trying again.',
      };
    }

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return { success: false, error: 'Admin credentials not configured on the server.' };
    }

    if (email.toLowerCase().trim() !== adminEmail || password !== adminPassword) {
      return { success: false, error: 'Invalid admin credentials.' };
    }

    // Check credentials or find admin student record
    let adminUser = await prisma.student.findFirst({
      where: { email: adminEmail, role: Role.ADMIN },
    });

    if (!adminUser) {
      // Upsert default admin user
      adminUser = await prisma.student.upsert({
        where: { email: adminEmail },
        update: { role: Role.ADMIN },
        create: {
          email: adminEmail,
          name: 'Chief Academy Director',
          phone: '+91 7829780778',
          role: Role.ADMIN,
        },
      });
    }

    // Issue Admin JWT Token
    const jwtPayload = {
      sub: adminUser.id,
      email: adminUser.email,
      phone: adminUser.phone || '+91 7829780778',
      name: adminUser.name,
      role: Role.ADMIN,
    };

    const token = await signSessionToken(jwtPayload);

    // Set Admin HTTP-Only Cookie
    cookies().set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { success: true, message: 'Admin authenticated successfully.' };
  } catch (error) {
    console.error('adminLoginAction Error:', error);
    return { success: false, error: 'Admin authentication failed.' };
  }
}

/**
 * Get Admin Session helper
 */
export async function getAdminSession() {
  try {
    // TEST_ADMIN_SESSION is a local-development / CI testing aid ONLY.
    // It is unconditionally blocked in production to prevent authentication bypass.
    // SECURITY: Never set this variable in a Vercel production environment.
    if (process.env.NODE_ENV !== 'production' && process.env.TEST_ADMIN_SESSION) {
      try {
        return JSON.parse(process.env.TEST_ADMIN_SESSION);
      } catch {}
    }
    const cookieStore = cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      // Fallback to standard session if role === ADMIN
      const stdSession = await getServerSession();
      if (stdSession && stdSession.role === Role.ADMIN) return stdSession;
      return null;
    }
    const { verifySessionToken } = await import('@/lib/auth');
    const session = await verifySessionToken(token);
    if (!session || session.role !== Role.ADMIN) return null;
    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Admin Logout Action
 */
export async function adminLogoutAction() {
  cookies().delete(ADMIN_COOKIE_NAME);
  revalidatePath('/admin');
}

/**
 * 2. Get Admin Overview Dashboard Data (Revenue Cards, Today's Bookings, Stats, Instructors, Vehicles)
 */
export async function getAdminOverviewAction() {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalBookingsCount,
      paidBookings,
      todaysBookings,
      activeInstructorsCount,
      totalVehiclesCount,
      allInstructors,
      allVehicles,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.findMany({
        where: { paymentStatus: PaymentStatus.PAID },
        select: { totalAmount: true },
      }),
      prisma.booking.findMany({
        where: {
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
        include: {
          student: true,
          package: true,
          instructor: true,
          vehicle: true,
          sessions: {
            orderBy: { scheduledAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.instructor.count(),
      prisma.vehicle.count(),
      prisma.instructor.findMany({ orderBy: { name: 'asc' } }),
      prisma.vehicle.findMany({ orderBy: { name: 'asc' } }),
    ]);

    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      success: true,
      stats: {
        totalRevenue,
        totalBookingsCount,
        todaysBookingsCount: todaysBookings.length,
        activeInstructorsCount,
        totalVehiclesCount,
      },
      todaysBookings,
      allInstructors,
      allVehicles,
    };
  } catch (error) {
    console.error('getAdminOverviewAction Error:', error);
    return { success: false, error: 'Failed to load admin overview.' };
  }
}

/**
 * 3. Bookings Management: Search, Filters, Status & Assignment
 */
export async function getAdminBookingsAction(search?: string, status?: string) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.', data: [] };

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as BookingStatus;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { student: { name: { contains: q, mode: 'insensitive' } } },
        { student: { phone: { contains: q, mode: 'insensitive' } } },
        { package: { name: { contains: q, mode: 'insensitive' } } },
        { razorpayPaymentId: { contains: q, mode: 'insensitive' } },
        { razorpayOrderId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        student: true,
        package: true,
        instructor: true,
        vehicle: true,
        sessions: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error('getAdminBookingsAction Error:', error);
    return { success: false, error: 'Failed to load bookings.', data: [] };
  }
}

/**
 * Update Booking Assignment (Instructor, Vehicle) & Status Management
 * CRITICAL: paymentStatus is strictly disallowed to prevent unauthorized payment state tampering.
 */
export async function updateBookingAssignmentAction(rawData: unknown) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const data = bookingAssignmentSchema.parse(rawData);

    const updateData: { instructorId?: string | null; vehicleId?: string | null; status?: BookingStatus } = {};
    if (data.instructorId !== undefined) updateData.instructorId = data.instructorId || null;
    if (data.vehicleId !== undefined) updateData.vehicleId = data.vehicleId || null;
    if (data.status !== undefined) updateData.status = data.status;

    const updatedBooking = await prisma.booking.update({
      where: { id: data.bookingId },
      data: updateData,
      include: {
        student: true,
        package: true,
        instructor: true,
        vehicle: true,
        sessions: true,
      },
    });

    // Also update assigned instructor/vehicle on related scheduled sessions
    if (data.instructorId !== undefined || data.vehicleId !== undefined) {
      await prisma.session.updateMany({
        where: { bookingId: data.bookingId },
        data: {
          ...(data.instructorId !== undefined ? { instructorId: data.instructorId || (await prisma.instructor.findFirst())?.id || '' } : {}),
          ...(data.vehicleId !== undefined ? { vehicleId: data.vehicleId || (await prisma.vehicle.findFirst())?.id || '' } : {}),
        },
      });
    }

    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
    revalidatePath('/dashboard');

    return { success: true, message: 'Booking updated successfully!', booking: updatedBooking };
  } catch (error) {
    console.error('updateBookingAssignmentAction Error:', error);
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid booking assignment input.' };
    }
    return { success: false, error: 'Failed to update booking assignment.' };
  }
}

/**
 * Cancel Booking with Reason Action
 */
export async function cancelBookingWithReasonAction(rawData: unknown) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const data = cancelBookingSchema.parse(rawData);

    const updatedBooking = await prisma.booking.update({
      where: { id: data.bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: data.cancelReason,
      },
      include: {
        student: true,
        package: true,
        instructor: true,
        vehicle: true,
        sessions: true,
      },
    });

    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
    revalidatePath('/dashboard');

    return { success: true, message: 'Booking cancelled with reason.', booking: updatedBooking };
  } catch (error) {
    console.error('cancelBookingWithReasonAction Error:', error);
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid cancellation parameters.' };
    }
    return { success: false, error: 'Failed to cancel booking.' };
  }
}

/**
 * Mark Session No-Show Action
 */
export async function markBookingNoShowAction(bookingId: string) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { sessions: { orderBy: { scheduledAt: 'asc' } } },
    });

    if (!booking) return { success: false, error: 'Booking not found.' };

    const pendingSession = booking.sessions.find((s) => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS');

    if (pendingSession) {
      await prisma.session.update({
        where: { id: pendingSession.id },
        data: { status: 'NO_SHOW', notes: 'Student marked NO-SHOW by Admin' },
      });
    } else {
      await prisma.session.create({
        data: {
          bookingId: booking.id,
          studentId: booking.studentId,
          instructorId: booking.instructorId || (await prisma.instructor.findFirst())?.id || '',
          vehicleId: booking.vehicleId || (await prisma.vehicle.findFirst())?.id || '',
          scheduledAt: new Date(),
          durationMins: 60,
          status: 'NO_SHOW',
          location: 'Main Training Track',
          notes: 'Session marked NO-SHOW by Admin',
        },
      });
    }

    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
    revalidatePath('/dashboard');

    return { success: true, message: 'Session marked as NO-SHOW successfully!' };
  } catch (error) {
    console.error('markBookingNoShowAction Error:', error);
    return { success: false, error: 'Failed to mark session as no-show.' };
  }
}

/**
 * 1-Click Action for Admin/Instructor to mark next session as COMPLETED for a student booking
 */
export async function markSessionCompleteAction(bookingId: string) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        sessions: { orderBy: { scheduledAt: 'asc' } },
        package: true,
      },
    });

    if (!booking) {
      return { success: false, error: 'Booking not found.' };
    }

    // Find first SCHEDULED or IN_PROGRESS session, or create next completed session
    const pendingSession = booking.sessions.find((s) => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS');

    if (pendingSession) {
      await prisma.session.update({
        where: { id: pendingSession.id },
        data: { status: 'COMPLETED' },
      });
    } else {
      // Create next completed session record
      const sessionCount = booking.sessions.length + 1;
      await prisma.session.create({
        data: {
          bookingId: booking.id,
          studentId: booking.studentId,
          instructorId: booking.instructorId || (await prisma.instructor.findFirst())?.id || '',
          vehicleId: booking.vehicleId || (await prisma.vehicle.findFirst())?.id || '',
          scheduledAt: new Date(),
          durationMins: 60,
          status: 'COMPLETED',
          location: 'City Driving Circuit',
          notes: `Practical Driving Session #${sessionCount} Completed`,
        },
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin/bookings');
    revalidatePath('/admin');

    return {
      success: true,
      message: `Practical Driving Session marked COMPLETED! Client dashboard updated live.`,
    };
  } catch (error) {
    console.error('markSessionCompleteAction Error:', error);
    return { success: false, error: 'Failed to complete session.' };
  }
}

/**
 * 1-Click Action for Admin to remove/undo last COMPLETED session in case of accidental clicks
 */
export async function removeCompletedSessionAction(bookingId: string) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        sessions: { orderBy: { scheduledAt: 'desc' } },
      },
    });

    if (!booking) {
      return { success: false, error: 'Booking not found.' };
    }

    const lastCompletedSession = booking.sessions.find((s) => s.status === 'COMPLETED');

    if (!lastCompletedSession) {
      return { success: false, error: 'No completed sessions to remove.' };
    }

    await prisma.session.delete({
      where: { id: lastCompletedSession.id },
    });

    revalidatePath('/dashboard');
    revalidatePath('/admin/bookings');
    revalidatePath('/admin');

    return {
      success: true,
      message: 'Completed session removed / undone successfully.',
    };
  } catch (error) {
    console.error('removeCompletedSessionAction Error:', error);
    return { success: false, error: 'Failed to remove completed session.' };
  }
}

/**
 * 4. PACKAGES CRUD
 */
export async function createPackageAction(formData: unknown) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const data = createPackageSchema.parse(formData);
    const pkg = await prisma.package.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/[^\w]+/g, '-'),
        type: data.type,
        description: data.description,
        price: data.price,
        sessionsCount: data.sessionsCount,
        badge: data.badge || null,
        isPopular: false, // Server controlled: client cannot set isPopular
      },
    });

    revalidatePath('/admin/packages');
    revalidatePath('/courses');

    return { success: true, message: 'Package created successfully!', package: pkg };
  } catch (error) {
    console.error('createPackageAction Error:', error);
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid package input parameters.' };
    }
    return { success: false, error: 'Failed to create package.' };
  }
}

export async function deletePackageAction(packageId: string) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const validId = entityIdSchema.parse(packageId);

    await prisma.package.delete({ where: { id: validId } });
    revalidatePath('/admin/packages');
    revalidatePath('/courses');
    return { success: true, message: 'Package deleted successfully.' };
  } catch (error) {
    console.error('deletePackageAction Error:', error);
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid package ID.' };
    }
    return { success: false, error: 'Cannot delete package with active bookings.' };
  }
}

/**
 * 5. VEHICLES CRUD
 */
export async function createVehicleAction(formData: unknown) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const data = createVehicleSchema.parse(formData);
    const vehicle = await prisma.vehicle.create({
      data: {
        name: data.name,
        modelYear: data.modelYear,
        plateNumber: data.plateNumber,
        tier: data.tier,
        transmission: data.transmission,
        ratePerSession: data.ratePerSession,
        description: data.description,
        imageUrl: data.imageUrl || '/images/fleet_wagonr_1785513709373.jpg',
        status: data.status || VehicleStatus.AVAILABLE,
      },
    });

    revalidatePath('/admin/vehicles');
    revalidatePath('/fleet');

    return { success: true, message: 'Vehicle created successfully!', vehicle };
  } catch (error) {
    console.error('createVehicleAction Error:', error);
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid vehicle input parameters.' };
    }
    return { success: false, error: 'Failed to create vehicle.' };
  }
}

export async function deleteVehicleAction(vehicleId: string) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const validId = entityIdSchema.parse(vehicleId);

    await prisma.vehicle.delete({ where: { id: validId } });
    revalidatePath('/admin/vehicles');
    revalidatePath('/fleet');
    return { success: true, message: 'Vehicle deleted successfully.' };
  } catch (error) {
    console.error('deleteVehicleAction Error:', error);
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid vehicle ID.' };
    }
    return { success: false, error: 'Cannot delete vehicle assigned to bookings.' };
  }
}

/**
 * 6. INSTRUCTORS CRUD
 */
export async function createInstructorAction(formData: unknown) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const data = createInstructorSchema.parse(formData);

    let normalizedSpecialties: string[] = [];
    if (typeof data.specialties === 'string') {
      normalizedSpecialties = data.specialties.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(data.specialties)) {
      normalizedSpecialties = data.specialties.map((s) => String(s).trim()).filter(Boolean);
    }

    const instructor = await prisma.instructor.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        bio: data.bio || '',
        experienceYears: data.experienceYears,
        rating: data.rating,
        specialties: normalizedSpecialties,
        role: Role.INSTRUCTOR,
      },
    });

    revalidatePath('/admin/instructors');
    return { success: true, message: 'Instructor created successfully!', instructor };
  } catch (error) {
    console.error('createInstructorAction Error:', error);
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid instructor input parameters.' };
    }
    return { success: false, error: 'Failed to create instructor.' };
  }
}

export async function deleteInstructorAction(instructorId: string) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const validId = entityIdSchema.parse(instructorId);

    await prisma.instructor.delete({ where: { id: validId } });
    revalidatePath('/admin/instructors');
    return { success: true, message: 'Instructor deleted successfully.' };
  } catch (error) {
    console.error('deleteInstructorAction Error:', error);
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid instructor ID.' };
    }
    return { success: false, error: 'Cannot delete instructor with assigned bookings.' };
  }
}

/**
 * 7. DOCUMENTS MANAGEMENT
 */
export async function getAdminDocumentsAction() {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.', data: [] };

    const documents = await prisma.studentDocument.findMany({
      include: {
        student: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return { success: true, data: documents };
  } catch (error) {
    console.error('getAdminDocumentsAction Error:', error);
    return { success: false, error: 'Failed to load documents.', data: [] };
  }
}

export async function updateDocumentStatusAction(documentId: string, status: string) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const data = updateDocumentStatusSchema.parse({ documentId, status });

    await prisma.studentDocument.update({
      where: { id: data.documentId },
      data: {
        status: data.status,
        reviewedAt: new Date(),
        reviewedBy: admin.sub,
      },
    });

    revalidatePath('/admin/documents');
    return { success: true, message: `Document status updated to ${data.status}.` };
  } catch (error) {
    console.error('updateDocumentStatusAction Error:', error);
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid document status parameters.' };
    }
    return { success: false, error: 'Failed to update document status.' };
  }
}

