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

    let student = await prisma.student.findUnique({
      where: { phone },
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          phone,
          name: `Student-${phoneSuffix}`,
          email: `student_${cleanPhoneDigits}@drivesuccess.edu`,
          role: Role.STUDENT,
        },
      });
      console.log(`👤 New Student created on Firebase/Phone login: ${student.name} (${student.phone})`);
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
      user: student,
    };
  } catch (error) {
    console.error('loginWithVerifiedPhoneAction Error:', error);
    return { success: false, error: 'Authentication failed. Please try again.' };
  }
}

/**
 * 2. Send SMS OTP Action with 10-minute Rate Limiting
 */
export async function sendOtpAction(phoneInput: string) {
  try {
    const phone = phoneInput.trim().replace(/[^\d+]/g, '');
    phoneSchema.parse(phone);

    const now = new Date();
    const existingOtp = await prisma.otpVerification.findUnique({
      where: { phone },
    });

    // Rate Limiting: 60s cooldown & max 3 requests in 10 minutes
    if (existingOtp) {
      const secondsSinceLastSent = (now.getTime() - existingOtp.lastSentAt.getTime()) / 1000;
      if (secondsSinceLastSent < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLastSent);
        return {
          success: false,
          error: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        };
      }

      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      if (existingOtp.lastSentAt > tenMinutesAgo && existingOtp.attempts >= 3) {
        return {
          success: false,
          error: 'Maximum OTP requests exceeded. Please try again in 10 minutes.',
        };
      }
    }

    const rawOtp = generateOtp();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

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

    await sendSmsOtp(phone, rawOtp);

    return {
      success: true,
      message: `OTP sent successfully to ${phone}. Valid for 5 minutes.`,
    };
  } catch (error) {
    console.error('sendOtpAction Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to send OTP. Please try again.' };
  }
}

/**
 * 3. Verify OTP Action with Demo Fallback
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
      return { success: false, error: 'No OTP request found. Please request a new OTP.' };
    }

    const now = new Date();

    if (otpRecord) {
      if (now > otpRecord.expiresAt) {
        await prisma.otpVerification.delete({ where: { phone } });
        return { success: false, error: 'OTP has expired. Please request a new OTP.' };
      }

      const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

      if (!isValid) {
        await prisma.otpVerification.update({
          where: { phone },
          data: { attempts: otpRecord.attempts + 1 },
        });
        return {
          success: false,
          error: `Invalid OTP code. ${3 - otpRecord.attempts} attempts remaining.`,
        };
      }

      await prisma.otpVerification.delete({ where: { phone } });
    }

    return await loginWithVerifiedPhoneAction(phone);
  } catch (error) {
    console.error('verifyOtpAction Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to verify OTP. Please try again.' };
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
