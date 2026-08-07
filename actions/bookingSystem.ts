'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { DayOfWeek, BookingStatus, SessionStatus, PaymentStatus } from '@prisma/client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const TIME_SLOTS = [
  '09:00 AM',
  '10:30 AM',
  '12:00 PM',
  '02:00 PM',
  '03:30 PM',
  '05:00 PM',
];

const dayOfWeekMap: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

/**
 * Fetch all available instructors for booking
 */
export async function getBookingInstructorsAction() {
  try {
    const instructors = await prisma.instructor.findMany({
      orderBy: { rating: 'desc' },
    });
    return { success: true, data: instructors };
  } catch (error) {
    console.error('getBookingInstructorsAction Error:', error);
    return { success: false, error: 'Failed to load instructors', data: [] };
  }
}

/**
 * Fetch all available vehicles for booking
 */
export async function getBookingVehiclesAction() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: 'AVAILABLE' },
      orderBy: { tier: 'asc' },
    });
    return { success: true, data: vehicles };
  } catch (error) {
    console.error('getBookingVehiclesAction Error:', error);
    return { success: false, error: 'Failed to load vehicles', data: [] };
  }
}

/**
 * Calculate Available Time Slots for selected Instructor, Vehicle, and Date
 * Formula: Available Slots = Instructor Work Hours - (Instructor Existing Bookings + Vehicle Existing Bookings)
 * Prevents Double Booking
 */
export async function getAvailableSlotsAction({
  instructorId,
  vehicleId,
  dateStr,
}: {
  instructorId: string;
  vehicleId?: string;
  dateStr: string;
}) {
  try {
    const selectedDate = new Date(dateStr);

    // 2. Fetch existing sessions for this date (start of day to end of day)
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Find any session where instructor OR vehicle is already booked
    const existingSessions = await prisma.session.findMany({
      where: {
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: SessionStatus.CANCELLED },
        OR: [
          { instructorId },
          ...(vehicleId ? [{ vehicleId }] : []),
        ],
      },
      include: {
        booking: {
          select: {
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
    });

    // 3. Map slots and check for conflicts
    const slotsResult = TIME_SLOTS.map((slotTime) => {
      // Check if existing session overlaps with this slot time and is still active
      const isBooked = existingSessions.some((session) => {
        // Exclude expired PENDING bookings (created > 15m ago without payment)
        if (
          session.booking &&
          session.booking.status === BookingStatus.PENDING &&
          session.booking.paymentStatus === PaymentStatus.PENDING &&
          session.booking.createdAt < fifteenMinsAgo
        ) {
          return false; // Reservation expired — slot available!
        }

        const sessionTime = session.scheduledAt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        return sessionTime === slotTime;
      });

      return {
        time: slotTime,
        available: !isBooked,
        reason: isBooked ? 'Slot already booked (Double Booking Prevention)' : 'Available',
      };
    });

    return { success: true, data: slotsResult };
  } catch (error) {
    console.error('getAvailableSlotsAction Error:', error);
    return { success: false, error: 'Failed to calculate available slots', data: [] };
  }
}

  const createBookingSchema = z.object({
  packageId: z.string().min(1, 'Package is required'),
  instructorId: z.string().min(1, 'Instructor is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  dateStr: z.string().min(1, 'Date is required'),
  timeSlot: z.string().min(1, 'Time slot is required'),
  studentName: z.string().optional(),
  // Phone is optional at the schema level — the frontend guard handles the
  // required case. When provided, it must be a valid international/local number.
  // This prevents ZodError when Google-auth users have no phone stored yet.
  studentPhone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\+?\d{10,15}$/.test(v.replace(/[\s\-()]/g, '')),
      'A valid 10–15 digit mobile number is required'
    ),
  studentEmail: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Create Booking (Status: PENDING) with Atomic Double Booking Prevention & Guest Auto-Auth
 */
export async function createBookingTransactionAction(inputData: unknown) {
  try {
    const data = createBookingSchema.parse(inputData);
    const session = await getServerSession();

    if (!session || !session.sub) {
      return {
        success: false,
        error: 'Authentication required. Please log in with your mobile phone OTP or Google account before completing booking.',
      };
    }

    const studentId = session.sub;

    // ─────────────────────────────────────────────────────────────────────────
    // PRE-FLIGHT: Update student phone number OUTSIDE the booking transaction.
    //
    // Why outside? Student.phone is @unique in the schema. If the phone number
    // already exists on a DIFFERENT student record, the update throws Prisma
    // error P2002 (unique constraint violation). Keeping it inside the $transaction
    // would roll back the entire booking (no booking created, no slot held) and
    // return only the generic error message.
    //
    // By running it first, we can catch the constraint violation specifically,
    // return a clear message, and never touch the booking transaction.
    // ─────────────────────────────────────────────────────────────────────────
    if (data.studentPhone) {
      const normalizedPhone = data.studentPhone.replace(/[\s\-()]/g, '');
      try {
        // Check if this phone belongs to a DIFFERENT student first.
        const existing = await prisma.student.findUnique({
          where: { phone: normalizedPhone },
          select: { id: true },
        });

        if (existing && existing.id !== studentId) {
          return {
            success: false,
            error: 'This phone number is already registered to another account. Please use a different number or log in with the account linked to this phone.',
          };
        }

        // Safe to update — phone is either not taken or already belongs to this student.
        await prisma.student.update({
          where: { id: studentId },
          data: { phone: normalizedPhone },
        });
      } catch (phoneErr: any) {
        console.error('createBookingTransactionAction — phone update error:', {
          code: phoneErr?.code,
          meta: phoneErr?.meta,
          message: phoneErr?.message,
        });
        if (phoneErr?.code === 'P2002') {
          return {
            success: false,
            error: 'This phone number is already registered to another account. Please use a different number.',
          };
        }
        if (phoneErr?.code === 'P2025') {
          return {
            success: false,
            error: 'Student account not found. Please log out and log back in.',
          };
        }
        // Non-blocking: phone update failed for an unexpected reason but we
        // should still allow the booking to proceed (phone is optional data).
        console.warn('Phone update failed with unexpected error, continuing with booking creation:', phoneErr?.message);
      }
    }

    // Parse scheduled datetime
    const [timeStr, period] = data.timeSlot.split(' ');
    let [hours, minutes] = timeStr.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const scheduledAt = new Date(data.dateStr);
    scheduledAt.setHours(hours, minutes, 0, 0);

    // Fetch package price
    const pkg = await prisma.package.findUnique({
      where: { id: data.packageId },
    });

    if (!pkg) {
      return { success: false, error: 'Selected package does not exist.' };
    }

    // ATOMIC PRISMA TRANSACTION: Prevent Double Booking
    const result = await prisma.$transaction(async (tx) => {
      // 1. Double Booking Check: Re-verify if instructor or vehicle was booked during form submission
      const startWindow = new Date(scheduledAt.getTime() - 30 * 60 * 1000);
      const endWindow = new Date(scheduledAt.getTime() + 30 * 60 * 1000);

      const conflictSession = await tx.session.findFirst({
        where: {
          scheduledAt: {
            gte: startWindow,
            lte: endWindow,
          },
          status: { not: SessionStatus.CANCELLED },
          OR: [
            { instructorId: data.instructorId },
            { vehicleId: data.vehicleId },
          ],
        },
      });

      if (conflictSession) {
        throw new Error('DOUBLE_BOOKING_CONFLICT');
      }

      // 2. Create Booking (Status: PENDING)
      const newBooking = await tx.booking.create({
        data: {
          studentId: studentId,
          packageId: data.packageId,
          vehicleId: data.vehicleId,
          instructorId: data.instructorId,
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          totalAmount: pkg.price,
          notes: data.notes || `Booking for ${pkg.name}`,
        },
      });

      // 3. Create initial Session record
      const newSession = await tx.session.create({
        data: {
          bookingId: newBooking.id,
          studentId: studentId,
          instructorId: data.instructorId,
          vehicleId: data.vehicleId,
          scheduledAt: scheduledAt,
          durationMins: 60,
          status: SessionStatus.SCHEDULED,
          location: 'Main Training Track',
          notes: `First session for ${pkg.name}`,
        },
      });

      return { booking: newBooking, session: newSession };
    });

    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Booking created successfully! Status: PENDING',
      booking: result.booking,
      session: result.session,
    };
  } catch (error: any) {
    // Log the full error server-side so it appears in Vercel/server logs.
    console.error('createBookingTransactionAction Error:', {
      name: error?.name,
      code: error?.code,        // Prisma error code e.g. P2002, P2003
      meta: error?.meta,        // Prisma metadata (target field, model)
      message: error?.message,
      stack: error?.stack,
    });

    if (error?.message === 'DOUBLE_BOOKING_CONFLICT') {
      return {
        success: false,
        error: 'Slot conflict: The selected instructor or vehicle was just booked by another student. Please select another time slot.',
      };
    }

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    // Prisma unique constraint (P2002): field-level conflict inside the transaction.
    if (error?.code === 'P2002') {
      const field = error?.meta?.target as string[] | string | undefined;
      const targets = Array.isArray(field) ? field : typeof field === 'string' ? [field] : [];

      // ── Slot exclusivity constraints (P-10 defence layer 2) ────────────────
      // Fires when a concurrent INSERT violates the partial unique indexes:
      //   unique_active_instructor_slot  ON sessions (instructorId, scheduledAt)
      //                                  WHERE status IN ('SCHEDULED', 'IN_PROGRESS')
      //   unique_active_vehicle_slot     ON sessions (vehicleId, scheduledAt)
      //                                  WHERE status IN ('SCHEDULED', 'IN_PROGRESS')
      // i.e., a race condition bypassed the findFirst soft-check above.
      if (
        targets.includes('unique_active_instructor_slot') ||
        targets.includes('unique_active_vehicle_slot') ||
        targets.some((t) => t.includes('instructor') || t.includes('vehicle'))
      ) {
        return {
          success: false,
          error: 'Slot conflict: The selected slot was just reserved by another student. Please choose a different time.',
        };
      }

      if (targets.includes('razorpayOrderId')) {
        return { success: false, error: 'A payment order already exists for this booking. Please refresh and try again.' };
      }
      return { success: false, error: `A record with this information already exists (${targets.join(', ') || 'unknown field'}). Please contact support if this persists.` };
    }


    // Prisma foreign key violation (P2003): referenced record does not exist.
    if (error?.code === 'P2003') {
      return { success: false, error: 'One of the selected items (package, instructor, or vehicle) no longer exists. Please refresh and try again.' };
    }

    // Prisma record not found (P2025): update target missing.
    if (error?.code === 'P2025') {
      return { success: false, error: 'Your student account was not found. Please log out and log back in.' };
    }

    return { success: false, error: 'Failed to process booking. Please try again or contact support.' };
  }
}

/**
 * Read the current status of a booking owned by the authenticated caller.
 *
 * Used EXCLUSIVELY for client-side payment state recovery after a page refresh
 * on Step 6 of the booking wizard. This action is intentionally read-only and
 * NEVER re-runs payment verification or modifies any booking record.
 *
 * Row-level security: only the booking owner (or ADMIN) can query their own booking.
 */
export async function getBookingStatusAction(bookingId: string): Promise<{
  success: boolean;
  bookingStatus?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  error?: string;
}> {
  try {
    if (!bookingId || typeof bookingId !== 'string') {
      return { success: false, error: 'INVALID_ID' };
    }

    const session = await getServerSession();
    if (!session?.sub) {
      return { success: false, error: 'UNAUTHENTICATED' };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        studentId: true,
        status: true,
        paymentStatus: true,
      },
    });

    if (!booking) {
      return { success: false, error: 'NOT_FOUND' };
    }

    // Row-level access check — only owner or ADMIN may read this booking.
    if (booking.studentId !== session.sub && session.role !== 'ADMIN') {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    return {
      success: true,
      bookingStatus: booking.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
      paymentStatus: booking.paymentStatus as 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED',
    };
  } catch (error: any) {
    console.error('getBookingStatusAction error:', error);
    return { success: false, error: 'SERVER_ERROR' };
  }
}
