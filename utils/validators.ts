import { z } from 'zod';

export const bookingFormSchema = z.object({
  courseId: z.string({ required_error: 'Please select a course' }).min(1),
  vehicleId: z.string({ required_error: 'Please select a vehicle' }).min(1),
  date: z.string({ required_error: 'Please select a date' }),
  timeSlot: z.string({ required_error: 'Please select a time slot' }),
  instructorId: z.string().optional(),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const userProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  location: z.string().optional(),
});

export type UserProfileValues = z.infer<typeof userProfileSchema>;
