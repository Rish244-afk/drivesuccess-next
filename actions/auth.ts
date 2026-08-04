'use server';

import { prisma } from '@/lib/prisma';
import { generateOtp, sendSmsOtp } from '@/lib/sms';
import { signSessionToken, setAuthCookie, removeAuthCookie, getServerSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

const phoneSchema = z.string().regex(/^\+?\d{10,15}$/, 'Please enter a valid 10-digit mobile number');
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
      student,
    };
  } catch (error) {
    console.error('loginWithVerifiedPhoneAction Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Phone login failed' };
  }
}

/**
 * 2. Send SMS OTP Action with 60s Resend Cooldown
 */
export async function sendOtpAction(phoneInput: string) {
  try {
    const phone = phoneInput.trim().replace(/[^\d+]/g, '');
    phoneSchema.parse(phone);

    // 1. Cooldown Enforcement: Check if an unexpired OTP was sent in the last 60 seconds
    const existingOtp = await prisma.otpVerification.findUnique({
      where: { phone },
    });

    if (existingOtp) {
      const now = new Date();
      const secondsSinceSent = Math.floor((now.getTime() - existingOtp.createdAt.getTime()) / 1000);
      if (secondsSinceSent < 60) {
        const remainingCooldown = 60 - secondsSinceSent;
        return {
          success: false,
          error: `Please wait ${remainingCooldown} second${remainingCooldown === 1 ? '' : 's'} before requesting a new code.`,
        };
      }
    }

    // 2. Generate Cryptographically Secure 6-Digit OTP
    const otp = generateOtp();

    // 3. Hash OTP using bcrypt (Salt Rounds = 10) before Database Storage
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 Minutes Expiry

    // 4. Upsert OTP record in Database with 0 initial failed attempts
    await prisma.otpVerification.upsert({
      where: { phone },
      update: {
        otpHash,
        expiresAt,
        attempts: 0,
        createdAt: new Date(),
      },
      create: {
        phone,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    // 5. Dispatch SMS via Provider (Masked Phone for Logging)
    const smsResult = await sendSmsOtp(phone, otp);

    const maskedPhone = phone.replace(/(\+\d{2}\d{4})\d{4}(\d{2})/, '$1****$2');
    console.log(`🔒 Secure OTP generated for ${maskedPhone}. Expiration: 5m.`);

    return {
      success: true,
      message: `Verification code sent to ${maskedPhone}. Valid for 5 minutes.`,
      smsDelivered: smsResult,
    };
  } catch (error) {
    console.error('sendOtpAction Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to send OTP code. Please try again.' };
  }
}

/**
 * 3. Verify SMS OTP Action with 5-Attempt Lockout & Anti-Replay Deletion
 */
export async function verifyOtpAction(phoneInput: string, otpInput: string) {
  try {
    const phone = phoneInput.trim().replace(/[^\d+]/g, '');
    const otp = otpInput.trim();

    phoneSchema.parse(phone);
    otpSchema.parse(otp);

    // 1. Fetch OTP record from Database
    const otpRecord = await prisma.otpVerification.findUnique({
      where: { phone },
    });

    if (!otpRecord) {
      return { success: false, error: 'Verification code expired or not requested. Please request a new code.' };
    }

    // Check Expiry (5 Minutes)
    if (new Date() > otpRecord.expiresAt) {
      await prisma.otpVerification.delete({ where: { phone } });
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }

    // 2. Lockout Check: Max 5 Failed Attempts
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
 * 5. Get Current User Session (Database Validated)
 */
export async function getCurrentUserAction() {
  const session = await getServerSession();
  if (!session || !session.sub) {
    return { success: false, user: null };
  }

  // Verify student record actually exists in Prisma DB
  const student = await prisma.student.findUnique({
    where: { id: session.sub },
    select: { id: true, role: true, phone: true, email: true, name: true },
  });

  if (!student) {
    await removeAuthCookie();
    return { success: false, user: null };
  }

  return { success: true, user: { ...session, ...student } };
}
