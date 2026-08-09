'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { DayOfWeek, BookingStatus, SessionStatus, PaymentStatus, NotificationType } from '@prisma/client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  parseSlotToUTC,
  getISTDayRangeUTC,
  formatISTTime,
  formatISTDate,
  formatISTDateTime,
} from '@/lib/dateUtils';

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
    // 2. Fetch existing sessions for this date (start of day to end of day in Asia/Kolkata)
    const { startOfDay, endOfDay } = getISTDayRangeUTC(dateStr);

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

        const sessionTime = formatISTTime(session.scheduledAt);
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

        await prisma.student.update({
          where: { id: studentId },
          data: { phone: normalizedPhone },
        });
      } catch (phoneErr: any) {
        console.error('createBookingTransactionAction — phone update error:', phoneErr?.message);
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
        console.warn('Phone update failed with unexpected error, continuing with booking creation:', phoneErr?.message);
      }
    }

    // Parse scheduled datetime explicitly as Asia/Kolkata (IST)
    const scheduledAt = parseSlotToUTC(data.dateStr, data.timeSlot);

    // Fetch package price
    const pkg = await prisma.package.findUnique({
      where: { id: data.packageId },
    });

    if (!pkg) {
      return { success: false, error: 'Selected package does not exist.' };
    }

    // ATOMIC PRISMA TRANSACTION: Prevent Double Booking
    const result = await prisma.$transaction(async (tx) => {
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

      const booking = await tx.booking.create({
        data: {
          studentId,
          packageId: data.packageId,
          instructorId: data.instructorId,
          vehicleId: data.vehicleId,
          totalAmount: pkg.price,
          notes: data.notes || null,
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      await tx.session.create({
        data: {
          bookingId: booking.id,
          studentId,
          instructorId: data.instructorId,
          vehicleId: data.vehicleId,
          scheduledAt,
          status: SessionStatus.SCHEDULED,
          notes: `Initial session for ${pkg.name}`,
        },
      });

      return booking;
    });

    revalidatePath('/dashboard');

    return {
      success: true,
      bookingId: result.id,
      amount: result.totalAmount,
      packageName: pkg.name,
    };
  } catch (error: any) {
    console.error('createBookingTransactionAction Error:', error);

    if (error?.message === 'DOUBLE_BOOKING_CONFLICT') {
      return {
        success: false,
        error: 'Slot conflict: The selected instructor or vehicle is no longer available at this time. Please select another slot.',
      };
    }

    if (error?.code === 'P2002') {
      return {
        success: false,
        error: 'Slot conflict: The selected instructor or vehicle is no longer available at this time. Please select another slot.',
      };
    }

    if (error?.code === 'P2003') {
      return { success: false, error: 'One of the selected items (package, instructor, or vehicle) no longer exists. Please refresh and try again.' };
    }

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

/**
 * Student Self-Service Booking Cancellation Action.
 * Strict Server-Side Authentication & Row-Level Authorization.
 * Handles PENDING (unpaid) and CONFIRMED (paid > 24h notice) cancellations.
 * Preserves admin-only control for actual Razorpay refunds.
 */
export async function cancelStudentBookingAction(bookingId: string) {
  try {
    if (!bookingId || typeof bookingId !== 'string') {
      return { success: false, error: 'Invalid booking ID.' };
    }

    const session = await getServerSession();
    if (!session || !session.sub) {
      return { success: false, error: 'Unauthorized request. Please log in.' };
    }

    // 1. Fetch booking with sessions and package information
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        package: true,
        sessions: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });

    if (!booking) {
      return { success: false, error: 'Booking record not found.' };
    }

    // 2. IDOR Protection: Verify booking belongs strictly to authenticated student
    if (booking.studentId !== session.sub) {
      return { success: false, error: 'Unauthorized. You do not have permission to cancel this booking.' };
    }

    // 3. Status Checks
    if (booking.status === BookingStatus.COMPLETED) {
      return { success: false, error: 'Completed bookings cannot be cancelled.' };
    }

    if (booking.status === BookingStatus.CANCELLED) {
      // Idempotent return
      return { success: true, message: 'Booking is already cancelled.', booking };
    }

    // 4. Multi-Session & Policy Evaluation: Find earliest scheduled session
    const earliestSession = booking.sessions.find(
      (s) => s.status !== SessionStatus.CANCELLED
    ) || booking.sessions[0];

    const now = new Date();

    if (booking.paymentStatus === PaymentStatus.PAID) {
      // 24-Hour Notice Rule Evaluation
      const earliestScheduledAt = earliestSession
        ? new Date(earliestSession.scheduledAt)
        : new Date(booking.createdAt.getTime() + 48 * 60 * 60 * 1000);

      const hoursUntilSession = (earliestScheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilSession < 24) {
        return {
          success: false,
          error:
            'Self-service cancellation is unavailable within 24 hours of your scheduled driving session. Please contact support at +91 98765 43210 for emergency assistance.',
        };
      }

      // Paid Booking > 24 Hours: Transactional Cancel + Admin Refund Review Flag
      const updatedBooking = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.CANCELLED,
            cancelReason: 'Cancelled by student (>24h notice). Pending admin refund review.',
            notes: 'Student self-service cancellation with >24h notice. Refund pending admin review.',
          },
        });

        await tx.session.updateMany({
          where: { bookingId },
          data: {
            status: SessionStatus.CANCELLED,
            notes: 'Session cancelled due to student booking cancellation.',
          },
        });

        return b;
      });

      // Multi-channel notification dispatch
      try {
        const { dispatchNotificationEvent } = await import('@/lib/notification');

        const student = await prisma.student.findUnique({
          where: { id: session.sub },
          select: { email: true, phone: true, name: true },
        });

        await dispatchNotificationEvent({
          studentId: session.sub,
          eventType: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          message: `Your booking for ${booking.package.name} has been cancelled. Your refund request is pending admin review.`,
          notificationType: NotificationType.SYSTEM_ALERT,
          emailData: student?.email
            ? {
                to: student.email,
                subject: `⚠️ Booking Cancelled - Vahathi Motor Driving School #${booking.id.slice(-8)}`,
                html: `Cancelled paid booking for ${booking.package.name}. Refund request pending admin review.`,
              }
            : undefined,
          whatsAppData: student?.phone
            ? {
                phone: student.phone,
                message: `⚠️ *Vahathi Driving Cancellation*\nHello ${student.name}, your booking #${booking.id.slice(-8)} for ${booking.package.name} has been cancelled. Refund request submitted for admin review.`,
              }
            : undefined,
          metadata: { bookingId: booking.id, packageName: booking.package.name, isPaid: true },
        });
      } catch (notifErr) {
        console.warn('Failed to dispatch cancellation notification:', notifErr);
      }

      revalidatePath('/dashboard');
      return {
        success: true,
        message: 'Booking cancelled successfully. Your refund request has been submitted to admin for review.',
        booking: updatedBooking,
      };
    }

    // Unpaid / Pending Booking Cancellation: Immediate Release
    const updatedBooking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelReason: 'Cancelled by student before payment completion.',
          notes: 'Unpaid booking cancelled by student.',
        },
      });

      await tx.session.updateMany({
        where: { bookingId },
        data: {
          status: SessionStatus.CANCELLED,
          notes: 'Session released due to unpaid booking cancellation.',
        },
      });

      return b;
    });

    try {
      const { dispatchNotificationEvent } = await import('@/lib/notification');

      const student = await prisma.student.findUnique({
        where: { id: session.sub },
        select: { email: true, phone: true, name: true },
      });

      await dispatchNotificationEvent({
        studentId: session.sub,
        eventType: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        message: `Your unpaid reservation for ${booking.package.name} has been cancelled.`,
        notificationType: NotificationType.SYSTEM_ALERT,
        emailData: student?.email
          ? {
              to: student.email,
              subject: `⚠️ Booking Cancelled - DriveSuccess Academy #${booking.id.slice(-8)}`,
              html: `Unpaid reservation for ${booking.package.name} has been cancelled and the slot released.`,
            }
          : undefined,
        whatsAppData: student?.phone
          ? {
              phone: student.phone,
              message: `⚠️ *DriveSuccess Cancellation*\nHello ${student.name}, your unpaid reservation #${booking.id.slice(-8)} for ${booking.package.name} has been cancelled.`,
            }
          : undefined,
        metadata: { bookingId: booking.id, packageName: booking.package.name, isPaid: false },
      });
    } catch (notifErr) {
      console.warn('Failed to dispatch cancellation notification:', notifErr);
    }

    revalidatePath('/dashboard');
    return {
      success: true,
      message: 'Unpaid booking cancelled and reserved slot released.',
      booking: updatedBooking,
    };
  } catch (error) {
    console.error('cancelStudentBookingAction Error:', error);
    return { success: false, error: 'Failed to cancel booking. Please try again.' };
  }
}

/**
 * Student Self-Service Session Rescheduling Action.
 * Enforces 24h notice rule, authoritative slot availability re-check, and atomic single-session update.
 */
export async function rescheduleStudentSessionAction({
  sessionId,
  newDateStr,
  newTimeSlot,
}: {
  sessionId: string;
  newDateStr: string;
  newTimeSlot: string;
}) {
  try {
    if (!sessionId || !newDateStr || !newTimeSlot) {
      return { success: false, error: 'Session ID, new date, and time slot are required.' };
    }

    const session = await getServerSession();
    if (!session || !session.sub) {
      return { success: false, error: 'Unauthorized request. Please log in.' };
    }

    // 1. Fetch Session with Booking details
    const sessionRecord = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        booking: {
          include: { package: true },
        },
        instructor: true,
        vehicle: true,
        student: true,
      },
    });

    if (!sessionRecord) {
      return { success: false, error: 'Session record not found.' };
    }

    // 2. IDOR Check: Ensure session belongs to a booking owned by authenticated student
    if (sessionRecord.studentId !== session.sub) {
      return { success: false, error: 'Unauthorized. You do not have permission to reschedule this session.' };
    }

    // 3. Status Checks
    if (
      sessionRecord.status === SessionStatus.COMPLETED ||
      sessionRecord.status === SessionStatus.CANCELLED ||
      sessionRecord.status === SessionStatus.NO_SHOW
    ) {
      return { success: false, error: 'Only upcoming scheduled sessions can be rescheduled.' };
    }

    if (sessionRecord.booking.status === BookingStatus.CANCELLED) {
      return { success: false, error: 'Cannot reschedule a session for a cancelled booking.' };
    }

    // 4. 24-Hour Notice Rule Check
    const now = new Date();
    const currentScheduledAt = new Date(sessionRecord.scheduledAt);
    const hoursUntilCurrentSession = (currentScheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilCurrentSession < 24) {
      return {
        success: false,
        error: 'Rescheduling is unavailable within 24 hours of your scheduled session. Please contact support.',
      };
    }

    // 5. Parse target datetime explicitly as Asia/Kolkata (IST)
    const newScheduledAt = parseSlotToUTC(newDateStr, newTimeSlot);

    if (newScheduledAt.getTime() <= now.getTime()) {
      return { success: false, error: 'Rescheduled time slot must be in the future.' };
    }

    // 6. Atomic Transaction: Concurrency Conflict Check & Slot Mutation
    await prisma.$transaction(async (tx) => {
      const startWindow = new Date(newScheduledAt.getTime() - 30 * 60 * 1000);
      const endWindow = new Date(newScheduledAt.getTime() + 30 * 60 * 1000);

      const conflictSession = await tx.session.findFirst({
        where: {
          id: { not: sessionId },
          scheduledAt: {
            gte: startWindow,
            lte: endWindow,
          },
          status: { not: SessionStatus.CANCELLED },
          OR: [
            { instructorId: sessionRecord.instructorId },
            { vehicleId: sessionRecord.vehicleId },
          ],
        },
      });

      if (conflictSession) {
        throw new Error('DOUBLE_BOOKING_CONFLICT');
      }

      await tx.session.update({
        where: { id: sessionId },
        data: {
          scheduledAt: newScheduledAt,
          notes: `Rescheduled from ${formatISTDateTime(currentScheduledAt)} to ${formatISTDateTime(newScheduledAt)}.`,
        },
      });
    });

    // Multi-channel Event Notification Dispatch
    try {
      const { dispatchNotificationEvent } = await import('@/lib/notification');
      const { sendSessionRescheduledEmail } = await import('@/lib/email');
      const formattedDate = formatISTDate(newScheduledAt, { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' + newTimeSlot;

      let emailHtml = '';
      if (sessionRecord.student?.email) {
        const emailRes = await sendSessionRescheduledEmail({
          studentEmail: sessionRecord.student.email,
          studentName: sessionRecord.student.name,
          bookingId: sessionRecord.bookingId,
          packageName: sessionRecord.booking.package.name,
          newScheduledAt: formattedDate,
          instructorName: sessionRecord.instructor.name,
        });
        emailHtml = (emailRes as any)?.html || '';
      }

      await dispatchNotificationEvent({
        studentId: session.sub,
        eventType: 'SESSION_RESCHEDULED',
        title: 'Session Rescheduled',
        message: `Your training session with ${sessionRecord.instructor.name} was moved to ${formattedDate}.`,
        notificationType: NotificationType.SESSION_SCHEDULED,
        emailData: sessionRecord.student?.email
          ? {
              to: sessionRecord.student.email,
              subject: `📅 Session Rescheduled - Vahathi Motor Driving School`,
              html: emailHtml,
            }
          : undefined,
        whatsAppData: sessionRecord.student?.phone
          ? {
              phone: sessionRecord.student.phone,
              message: `📅 *Vahathi Driving Rescheduled*\nHello ${sessionRecord.student.name}, your training session for ${sessionRecord.booking.package.name} with ${sessionRecord.instructor.name} is now scheduled for ${formattedDate}.`,
            }
          : undefined,
        metadata: {
          sessionId,
          bookingId: sessionRecord.bookingId,
          newScheduledAt: newScheduledAt.toISOString(),
        },
      });
    } catch (notifErr) {
      console.warn('Failed to dispatch reschedule notification:', notifErr);
    }

    revalidatePath('/dashboard');
    return {
      success: true,
      message: `Session rescheduled successfully to ${formatISTDate(newScheduledAt, { weekday: 'short', month: 'short', day: 'numeric' })} at ${newTimeSlot}.`,
    };
  } catch (error: any) {
    console.error('rescheduleStudentSessionAction Error:', error);

    if (error?.message === 'DOUBLE_BOOKING_CONFLICT') {
      return {
        success: false,
        error: 'Slot conflict: The requested time slot was just taken by another student. Please select another slot.',
      };
    }

    if (error?.code === 'P2002') {
      return {
        success: false,
        error: 'Slot conflict: The selected time slot is no longer available.',
      };
    }

    return { success: false, error: 'Failed to reschedule session. Please try again.' };
  }
}
