import { z } from 'zod';

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
 * 2. Zod Security Schemas
 */

// Phone Authentication Schemas
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

// Admin Authentication Schema
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address').transform(sanitizeInput),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Booking System Schema
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

// Package Management Schema
export const packageCrudSchema = z.object({
  name: z.string().min(2).max(100).transform(sanitizeInput),
  type: z.enum(['LICENSE_2W', 'LICENSE_4W', 'COMBO', 'IDL_TRANSFER', 'RENEWAL', 'REGISTRATION']),
  price: z.number().positive('Price must be greater than zero'),
  sessionsCount: z.number().int().positive(),
  description: z.string().min(10).max(1000).transform(sanitizeInput),
  badge: z.string().max(30).optional().transform((val) => (val ? sanitizeInput(val) : undefined)),
});

// Vehicle Management Schema
export const vehicleCrudSchema = z.object({
  name: z.string().min(2).max(100).transform(sanitizeInput),
  plateNumber: z.string().min(4).max(20).transform(sanitizeInput),
  tier: z.enum(['TIER_A_COMPACT', 'TIER_B_PREMIUM', 'SUV']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']),
  ratePerSession: z.number().positive(),
  description: z.string().min(5).max(500).transform(sanitizeInput),
});
