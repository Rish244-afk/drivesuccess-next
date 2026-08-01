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
    const dayOfWeek = dayOfWeekMap[selectedDate.getDay()];

    // 1. Check if instructor has explicit off-day marked in database
    const explicitOffDay = await prisma.availability.findFirst({
      where: {
        instructorId,
        dayOfWeek,
        isAvailable: false,
      },
    });

    if (explicitOffDay) {
      return {
        success: true,
        data: TIME_SLOTS.map((slot) => ({
          time: slot,
          available: false,
          reason: 'Instructor off-day',
        })),
      };
    }

    // 2. Fetch existing sessions for this date (start of day to end of day)
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

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
    });

    // 3. Map slots and check for conflicts
    const slotsResult = TIME_SLOTS.map((slotTime) => {
      // Check if existing session overlaps with this slot time
      const isBooked = existingSessions.some((session) => {
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
  notes: z.string().optional(),
});

/**
 * Create Booking (Status: PENDING) with Atomic Double Booking Prevention
 */
export async function createBookingTransactionAction(inputData: unknown) {
  try {
    const session = await getServerSession();
    let studentId = session?.sub;

    if (!studentId) {
      let defaultStudent = await prisma.student.findFirst();
      if (!defaultStudent) {
        defaultStudent = await prisma.student.create({
          data: {
            name: 'Academy Student',
            email: `student_${Date.now()}@drivesuccess.edu`,
            phone: '+919876543210',
          },
        });
      }
      studentId = defaultStudent.id;
    }

    const data = createBookingSchema.parse(inputData);

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
    console.error('createBookingTransactionAction Error:', error);

    if (error.message === 'DOUBLE_BOOKING_CONFLICT') {
      return {
        success: false,
        error: 'Slot conflict: The selected instructor or vehicle was just booked by another student. Please select another slot.',
      };
    }

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    return { success: false, error: 'Failed to process booking. Please try again.' };
  }
}
