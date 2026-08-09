import { z } from 'zod';
import { PackageType, VehicleTier, Transmission, VehicleStatus, BookingStatus, PaymentStatus } from '@prisma/client';

/**
 * 1. Input Sanitization helper (XSS Prevention & HTML Entity Encoding)
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * 2. Zod Security Schemas for Authentication & Booking
 */

export const phoneAuthSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Invalid phone number length')
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid E.164 phone format'),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address').transform(sanitizeInput),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const bookingSecuritySchema = z.object({
  packageId: z.string().min(1, 'Package selection required'),
  instructorId: z.string().min(1, 'Instructor selection required'),
  vehicleId: z.string().min(1, 'Vehicle selection required'),
  dateStr: z
    .string()
    .min(1, 'Booking date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timeSlot: z.string().min(1, 'Time slot is required'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().transform((val) => (val ? sanitizeInput(val) : '')),
});

/**
 * 3. Strict Admin CRUD Validation Schemas (P1 Mass Assignment & Input Hardening)
 */

// A. Package Creation Schema (Client must NEVER control isPopular or role)
export const createPackageSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().trim().min(2).max(100).optional(),
  type: z.nativeEnum(PackageType, { errorMap: () => ({ message: 'Invalid package type' }) }),
  description: z.string().trim().min(5, 'Description must be at least 5 characters').max(1000),
  price: z.coerce.number().positive('Price must be greater than 0').max(1000000),
  sessionsCount: z.coerce.number().int().positive('Sessions count must be at least 1').max(100),
  badge: z.string().trim().max(50).nullable().optional(),
}).strict();

// B. Vehicle Creation Schema
export const createVehicleSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  modelYear: z.coerce.number().int().min(1990, 'Model year must be 1990 or newer').max(new Date().getFullYear() + 2),
  plateNumber: z.string().trim().min(4, 'Plate number is required').max(20),
  tier: z.nativeEnum(VehicleTier, { errorMap: () => ({ message: 'Invalid vehicle tier' }) }),
  transmission: z.nativeEnum(Transmission, { errorMap: () => ({ message: 'Invalid transmission type' }) }),
  ratePerSession: z.coerce.number().positive('Rate per session must be greater than 0').max(100000),
  description: z.string().trim().min(5, 'Description must be at least 5 characters').max(1000),
  imageUrl: z.string().trim().min(1).max(500).optional(),
  status: z.nativeEnum(VehicleStatus, { errorMap: () => ({ message: 'Invalid vehicle status' }) }).optional(),
}).strict();

// C. Instructor Creation Schema
export const createInstructorSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address format').max(100),
  phone: z.string().trim().min(8, 'Phone number must be at least 8 digits').max(20),
  bio: z.string().trim().max(1000).optional(),
  experienceYears: z.coerce.number().int().min(0, 'Experience years cannot be negative').max(60),
  rating: z.coerce.number().min(0, 'Rating cannot be negative').max(5, 'Rating cannot exceed 5.0'),
  specialties: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
}).strict();

// D. Booking Assignment Schema (CRITICAL: paymentStatus is strictly disallowed)
export const bookingAssignmentSchema = z.object({
  bookingId: z.string().trim().min(1, 'Booking ID is required'),
  instructorId: z.string().trim().optional(),
  vehicleId: z.string().trim().optional(),
  status: z.nativeEnum(BookingStatus, { errorMap: () => ({ message: 'Invalid booking status' }) }).optional(),
}).strict();

// E. Booking Cancellation Schema
export const cancelBookingSchema = z.object({
  bookingId: z.string().trim().min(1, 'Booking ID is required'),
  cancelReason: z.string().trim().min(1, 'Cancel reason is required').max(500),
}).strict();

// F. Document Status Schema
export const updateDocumentStatusSchema = z.object({
  documentId: z.string().trim().min(1, 'Document ID is required'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status must be PENDING, APPROVED, or REJECTED' }),
  }),
}).strict();

// G. Generic Entity ID Schema
export const entityIdSchema = z.string().trim().min(1, 'Valid ID is required');
