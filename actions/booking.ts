'use server';

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const bookingSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  packageId: z.string().min(1, 'Package ID is required'),
  vehicleId: z.string().optional(),
  instructorId: z.string().optional(),
  scheduledAt: z.string().datetime(),
  totalAmount: z.number().positive(),
  notes: z.string().optional(),
});

export async function createBookingAction(formData: unknown) {
  try {
    const validatedData = bookingSchema.parse(formData);

    const booking = await prisma.booking.create({
      data: {
        studentId: validatedData.studentId,
        packageId: validatedData.packageId,
        vehicleId: validatedData.vehicleId,
        instructorId: validatedData.instructorId,
        totalAmount: validatedData.totalAmount,
        notes: validatedData.notes,
        status: 'PENDING',
      },
    });

    revalidatePath('/dashboard');
    return { success: true, data: booking };
  } catch (error) {
    console.error('Server Action Error (createBookingAction):', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to create booking' };
  }
}

export async function getStudentBookingsAction(studentId: string) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { studentId },
      include: {
        package: true,
        vehicle: true,
        instructor: true,
        sessions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error('Server Action Error (getStudentBookingsAction):', error);
    return { success: false, error: 'Failed to fetch bookings' };
  }
}
