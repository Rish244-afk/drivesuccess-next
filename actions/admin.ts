'use server';

import { prisma } from '@/lib/prisma';
import { signSessionToken, setAuthCookie, removeAuthCookie, getServerSession } from '@/lib/auth';
import { Role, BookingStatus, PaymentStatus, VehicleTier, Transmission, VehicleStatus, PackageType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const ADMIN_COOKIE_NAME = 'admin_auth_token';

/**
 * 1. Admin Separate Login Action
 * Hardcoded default credentials: admin@drivesuccess.edu / REDACTED_ADMIN_PASSWORD
 */
export async function adminLoginAction(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@drivesuccess.edu').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'REDACTED_ADMIN_PASSWORD';

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
 */
export async function updateBookingAssignmentAction({
  bookingId,
  instructorId,
  vehicleId,
  status,
  paymentStatus,
}: {
  bookingId: string;
  instructorId?: string;
  vehicleId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
}) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const updateData: any = {};
    if (instructorId !== undefined) updateData.instructorId = instructorId || null;
    if (vehicleId !== undefined) updateData.vehicleId = vehicleId || null;
    if (status) updateData.status = status;
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === PaymentStatus.PAID) {
        updateData.paidAt = new Date();
        updateData.status = BookingStatus.CONFIRMED;
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
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
    if (instructorId || vehicleId) {
      await prisma.session.updateMany({
        where: { bookingId },
        data: {
          ...(instructorId !== undefined ? { instructorId: instructorId || (await prisma.instructor.findFirst())?.id || '' } : {}),
          ...(vehicleId !== undefined ? { vehicleId: vehicleId || (await prisma.vehicle.findFirst())?.id || '' } : {}),
        },
      });
    }

    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
    revalidatePath('/dashboard');

    return { success: true, message: 'Booking updated successfully!', booking: updatedBooking };
  } catch (error) {
    console.error('updateBookingAssignmentAction Error:', error);
    return { success: false, error: 'Failed to update booking assignment.' };
  }
}

/**
 * Cancel Booking with Reason Action
 */
export async function cancelBookingWithReasonAction({
  bookingId,
  cancelReason,
}: {
  bookingId: string;
  cancelReason: string;
}) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: cancelReason || 'Cancelled by Admin',
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

    const data = formData as any;
    const pkg = await prisma.package.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/[^\w]+/g, '-'),
        type: data.type as PackageType,
        description: data.description,
        price: parseFloat(data.price),
        sessionsCount: parseInt(data.sessionsCount),
        badge: data.badge || null,
        isPopular: data.isPopular || false,
      },
    });

    revalidatePath('/admin/packages');
    revalidatePath('/courses');

    return { success: true, message: 'Package created successfully!', package: pkg };
  } catch (error) {
    console.error('createPackageAction Error:', error);
    return { success: false, error: 'Failed to create package.' };
  }
}

export async function deletePackageAction(packageId: string) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    await prisma.package.delete({ where: { id: packageId } });
    revalidatePath('/admin/packages');
    revalidatePath('/courses');
    return { success: true, message: 'Package deleted successfully.' };
  } catch (error) {
    console.error('deletePackageAction Error:', error);
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

    const data = formData as any;
    const vehicle = await prisma.vehicle.create({
      data: {
        name: data.name,
        modelYear: parseInt(data.modelYear || '2024'),
        plateNumber: data.plateNumber,
        tier: data.tier as VehicleTier,
        transmission: data.transmission as Transmission,
        ratePerSession: parseFloat(data.ratePerSession),
        description: data.description,
        imageUrl: data.imageUrl || '/images/fleet_wagonr_1785513709373.jpg',
        status: (data.status as VehicleStatus) || VehicleStatus.AVAILABLE,
      },
    });

    revalidatePath('/admin/vehicles');
    revalidatePath('/fleet');

    return { success: true, message: 'Vehicle created successfully!', vehicle };
  } catch (error) {
    console.error('createVehicleAction Error:', error);
    return { success: false, error: 'Failed to create vehicle.' };
  }
}

export async function deleteVehicleAction(vehicleId: string) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    await prisma.vehicle.delete({ where: { id: vehicleId } });
    revalidatePath('/admin/vehicles');
    revalidatePath('/fleet');
    return { success: true, message: 'Vehicle deleted successfully.' };
  } catch (error) {
    console.error('deleteVehicleAction Error:', error);
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

    const data = formData as any;
    const instructor = await prisma.instructor.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        experienceYears: parseInt(data.experienceYears || '5'),
        rating: parseFloat(data.rating || '5.0'),
        specialties: typeof data.specialties === 'string' ? data.specialties.split(',').map((s: string) => s.trim()) : data.specialties,
        role: Role.INSTRUCTOR,
      },
    });

    revalidatePath('/admin/instructors');
    return { success: true, message: 'Instructor created successfully!', instructor };
  } catch (error) {
    console.error('createInstructorAction Error:', error);
    return { success: false, error: 'Failed to create instructor.' };
  }
}

export async function deleteInstructorAction(instructorId: string) {
  try {
    const admin = await getAdminSession();
    if (!admin) return { success: false, error: 'Admin access denied.' };

    await prisma.instructor.delete({ where: { id: instructorId } });
    revalidatePath('/admin/instructors');
    return { success: true, message: 'Instructor deleted successfully.' };
  } catch (error) {
    console.error('deleteInstructorAction Error:', error);
    return { success: false, error: 'Cannot delete instructor with assigned bookings.' };
  }
}
