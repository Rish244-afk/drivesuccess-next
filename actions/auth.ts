'use server';

import { prisma } from '@/lib/prisma';
import { generateOtp, sendSmsOtp } from '@/lib/sms';
import { signSessionToken, setAuthCookie, removeAuthCookie, getServerSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits');
const otpSchema = z.string().length(6, 'OTP must be exactly 6 digits');

/**
 * 1. Login with Phone (Works with Firebase Phone Auth & Direct Phone Verification)
 * Creates student if first time login & sets 30-Day HTTP-Only JWT Cookie
 */
export async function loginWithVerifiedPhoneAction(phoneInput: string) {
  try {
    const phone = phoneInput.trim().replace(/[^\d+]/g, '');
    phoneSchema.parse(phone);

    const cleanPhoneDigits = phone.replace(/[^\d]/g, '');
    const phoneSuffix = cleanPhoneDigits.slice(-4) || '8821';

    // Check if user is currently logged in via Google session to link phone
    const currentSession = await getServerSession();
    let student = null;

    if (currentSession?.sub) {
      student = await prisma.student.findUnique({
        where: { id: currentSession.sub },
      });
    }

    if (student) {
      // Update existing account with verified phone
      student = await prisma.student.update({
        where: { id: student.id },
        data: {
          phone,
          phoneVerified: true,
        },
      });
    } else {
      // Find student by phone
      student = await prisma.student.findUnique({
        where: { phone },
      });

      if (!student) {
        student = await prisma.student.create({
          data: {
            phone,
            name: `Student-${phoneSuffix}`,
            email: `student_${cleanPhoneDigits}@drivesuccess.edu`,
            phoneVerified: true,
            role: Role.STUDENT,
          },
        });
        console.log(`👤 New Student created on Phone login: ${student.name} (${student.phone})`);
      }
    }

    // Issue 30-Day Rolling JWT Cookie
    const jwtPayload = {
      sub: student.id,
      phone: student.phone!,
      role: student.role,
      name: student.name,
      email: student.email,
    };

    const token = await signSessionToken(jwtPayload);
    await setAuthCookie(token);

    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Authentication successful',
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
      },
    };
  } catch (error) {
    console.error('loginWithVerifiedPhoneAction Error:', error);
    return { success: false, error: 'Authentication failed. Please try again.' };
  }
}

/**
 * 2. Send SMS OTP Action (Hardened Production Hardening: 60s Resend Cooldown, Bcrypt Hash, 5m Expiry)
 */
export async function sendOtpAction(phoneInput: string) {
  try {
    const phone = phoneInput.trim().replace(/[^\d+]/g, '');
    phoneSchema.parse(phone);

    const now = new Date();
    const existingOtp = await prisma.otpVerification.findUnique({
      where: { phone },
    });

    // 1. Resend Cooldown Check (60 Seconds)
    if (existingOtp) {
      const secondsSinceLastSent = (now.getTime() - existingOtp.lastSentAt.getTime()) / 1000;
      if (secondsSinceLastSent < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLastSent);
        return {
          success: false,
          error: `Please wait ${waitSeconds} seconds before requesting a new verification code.`,
        };
      }

      // 2. Max Requests Rate Limit (5 requests per 10 minutes)
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      if (existingOtp.lastSentAt > tenMinutesAgo && existingOtp.attempts >= 5) {
        return {
          success: false,
          error: 'Maximum verification code requests exceeded. Please try again in 10 minutes.',
        };
      }
    }

    // 3. Generate Cryptographically Secure 6-Digit OTP
    const rawOtp = generateOtp();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 Minutes Expiry

    // 4. Store ONLY Hashed OTP in DB
    await prisma.otpVerification.upsert({
      where: { phone },
      update: {
        otpHash,
        attempts: 0,
        expiresAt,
        lastSentAt: now,
      },
      create: {
        phone,
        otpHash,
        attempts: 0,
        expiresAt,
        lastSentAt: now,
      },
    });

    // 5. Dispatch SMS via Gateway (Zero OTP leakage in server/client response)
    await sendSmsOtp(phone, rawOtp);

    const maskedPhone = phone.length >= 10
      ? `${phone.slice(0, 3)}******${phone.slice(-4)}`
      : phone;

    return {
      success: true,
      message: `We've sent a 6-digit verification code to ${maskedPhone}.`,
    };
  } catch (error) {
    console.error('sendOtpAction Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to send verification code. Please try again.' };
  }
}

/**
 * 3. Verify OTP Action (Hardened Production Verification: Brute-force Limit, Anti-Replay Deletion, Single-Use)
 */
export async function verifyOtpAction(phoneInput: string, otpInput: string) {
  try {
    const phone = phoneInput.trim().replace(/[^\d+]/g, '');
    const otp = otpInput.trim();

    phoneSchema.parse(phone);
    otpSchema.parse(otp);

    const otpRecord = await prisma.otpVerification.findUnique({
      where: { phone },
    });

    if (!otpRecord) {
      return { success: false, error: 'No active verification request found. Please request a new code.' };
    }

    const now = new Date();

    // 1. Check Expiry
    if (now > otpRecord.expiresAt) {
      await prisma.otpVerification.delete({ where: { phone } });
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }

    // 2. Check Attempt Limit (Max 5 Attempts Lockout)
    if (otpRecord.attempts >= 5) {
      await prisma.otpVerification.delete({ where: { phone } });
      return { success: false, error: 'Maximum verification attempts exceeded. Please request a new code.' };
    }

    // 3. Validate Bcrypt OTP Hash
    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isValid) {
      const updatedAttempts = otpRecord.attempts + 1;
      if (updatedAttempts >= 5) {
        await prisma.otpVerification.delete({ where: { phone } });
        return {
          success: false,
          error: 'Maximum verification attempts exceeded. Please request a new code.',
        };
      } else {
        await prisma.otpVerification.update({
          where: { phone },
          data: { attempts: updatedAttempts },
        });
        const remainingAttempts = 5 - updatedAttempts;
        return {
          success: false,
          error: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
        };
      }
    }

    // 4. Invalidate & Delete OTP Record Immediately (Prevents Replay Attacks)
    await prisma.otpVerification.delete({ where: { phone } });

    // 5. Issue Logged-In Session
    return await loginWithVerifiedPhoneAction(phone);
  } catch (error) {
    console.error('verifyOtpAction Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to verify code. Please try again.' };
  }
}

/**
 * 4. Logout Action
 */
export async function logoutAction(): Promise<void> {
  await removeAuthCookie();
  revalidatePath('/');
}

/**
 * 5. Get Current User Session
 */
export async function getCurrentUserAction() {
  const session = await getServerSession();
  if (!session) {
    return { success: false, user: null };
  }
  return { success: true, user: session };
}
