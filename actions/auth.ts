'use server';

import { prisma } from '@/lib/prisma';
import { generateOtp, getSmsProvider } from '@/lib/sms';
import { normalizePhoneNumber } from '@/lib/phone';
import { signSessionToken, setAuthCookie, removeAuthCookie, getServerSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwks/securetoken@system.gserviceaccount.com')
);

/**
 * 1. Internal Private Session Creation Helper for Verified Phone Numbers
 * NOT exported as a public Server Action to prevent direct unauthenticated invocation.
 */
async function createVerifiedPhoneSession(phoneInput: string) {
  try {
    const phone = normalizePhoneNumber(phoneInput);
    if (!phone) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    // ─── STEP 1: Check if user is already logged in via another method ───────
    const currentSession = await getServerSession();
    let student = null;

    if (currentSession?.sub) {
      const existing = await prisma.student.findUnique({
        where: { id: currentSession.sub },
      });

      if (existing) {
        const phoneOwner = phone
          ? await prisma.student.findUnique({
              where: { phone },
              select: { id: true },
            })
          : null;

        if (phoneOwner && phoneOwner.id !== existing.id) {
          student = await prisma.student.findUnique({ where: { phone } });
        } else {
          student = await prisma.student.update({
            where: { id: existing.id },
            data: { phone, phoneVerified: true },
          });
          console.log(`🔗 Phone ${phone} linked to existing session account: ${existing.id}`);
        }
      }
    }

    // ─── STEP 2: Look up by phone number ─────────────────────────────────────
    if (!student) {
      student = await prisma.student.findUnique({
        where: { phone },
      });
    }

    // ─── STEP 3: Create new phone-only account ────────────────────────────────
    if (!student) {
      const cleanPhoneDigits = phone.replace(/[^\d]/g, '');
      const phoneSuffix = cleanPhoneDigits.slice(-4) || '0000';
      student = await prisma.student.create({
        data: {
          phone,
          name: `Student-${phoneSuffix}`,
          phoneVerified: true,
          role: Role.STUDENT,
        },
      });
      console.log(`👤 New phone-only Student created: ${student.name} (${student.phone})`);
    } else if (!student.phoneVerified) {
      student = await prisma.student.update({
        where: { id: student.id },
        data: { phoneVerified: true },
      });
    }

    // Issue 30-Day Rolling JWT Cookie
    const jwtPayload = {
      sub: student.id,
      phone: student.phone || '',
      role: student.role,
      name: student.name,
      email: student.email || '',
      ver: student.authVersion,
    };

    const token = await signSessionToken(jwtPayload);
    await setAuthCookie(token);

    logger.auth({
      event: 'SESSION_ISSUED',
      outcome: 'SUCCESS',
      actorId: student.id,
      phone: student.phone || undefined,
      email: student.email || undefined,
    });

    revalidatePath('/dashboard');

    return { success: true, student };
  } catch (error) {
    console.error('createVerifiedPhoneSession Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Phone session creation failed' };
  }
}

/**
 * Public Server Action: Verify Firebase ID Token Cryptographically
 * Validates RS256 signature, issuer, audience, expiration, and extracts phone_number claim.
 * Never trusts client-supplied phone parameters.
 */
export async function verifyFirebaseIdTokenAction(idToken: string) {
  try {
    if (!idToken || typeof idToken !== 'string') {
      return { success: false, error: 'Firebase ID Token is required.' };
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'drivesuccess-academy';
    const expectedIssuer = `https://securetoken.google.com/${projectId}`;

    // Cryptographic RS256 Verification against Google JWKS
    const { payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
      issuer: expectedIssuer,
      audience: projectId,
    });

    const verifiedPhone = payload.phone_number as string | undefined;

    if (!verifiedPhone) {
      return {
        success: false,
        error: 'Firebase authentication token does not contain a verified phone number.',
      };
    }

    return await createVerifiedPhoneSession(verifiedPhone);
  } catch (error: any) {
    console.error('verifyFirebaseIdTokenAction Error:', error?.message || error);
    return {
      success: false,
      error: 'Cryptographic verification of Firebase token failed. Please try again.',
    };
  }
}

/**
 * 2. Send SMS OTP Action with 60s Resend Cooldown
 */
export async function sendOtpAction(phoneInput: string) {
  try {
    const phone = normalizePhoneNumber(phoneInput);
    if (!phone) {
      return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
    }

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

    // 3. Dispatch SMS via Provider FIRST (Masked Phone for Logging)
    const provider = getSmsProvider();
    const smsResult = await provider.sendOtp(phone, otp);

    if (!smsResult.success) {
      logger.auth({
        event: 'OTP_DISPATCHED',
        outcome: 'FAILURE',
        phone,
        reason: smsResult.error || 'SMS provider delivery failed',
      });
      return {
        success: false,
        error: 'Failed to send verification code. Please check your mobile number or try again.',
      };
    }

    // 4. Hash OTP using bcrypt (Salt Rounds = 10) before Database Storage
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 Minutes Expiry

    // 5. Commit/Upsert OTP record in Database ONLY after successful SMS dispatch
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

    const maskedPhone = phone.replace(/(\+\d{2}\d{4})\d{4}(\d{2})/, '$1****$2');

    logger.auth({
      event: 'OTP_DISPATCHED',
      outcome: 'SUCCESS',
      phone,
      details: { smsDelivered: true },
    });

    return {
      success: true,
      message: `Verification code sent to ${maskedPhone}. Valid for 5 minutes.`,
      smsDelivered: true,
    };
  } catch (error) {
    console.error('sendOtpAction Error:', error);
    return { success: false, error: 'Failed to send OTP code. Please try again.' };
  }
}

/**
 * 3. Verify SMS OTP Action with 5-Attempt Lockout & Anti-Replay Deletion
 */
export async function verifyOtpAction(phoneInput: string, otpInput: string) {
  try {
    const phone = normalizePhoneNumber(phoneInput);
    if (!phone) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    const otp = (otpInput || '').trim();
    if (!/^\d{6}$/.test(otp)) {
      return { success: false, error: 'Verification code must be exactly 6 numeric digits.' };
    }

    // 1. Fetch OTP record from Database
    const otpRecord = await prisma.otpVerification.findUnique({
      where: { phone },
    });

    if (!otpRecord) {
      logger.auth({
        event: 'OTP_VERIFICATION_FAILED',
        outcome: 'FAILURE',
        phone,
        reason: 'OTP record missing or expired',
      });
      return { success: false, error: 'Verification code expired or not requested. Please request a new code.' };
    }

    // Check Expiry (5 Minutes)
    if (new Date() > otpRecord.expiresAt) {
      await prisma.otpVerification.delete({ where: { phone } });
      logger.auth({
        event: 'OTP_VERIFICATION_FAILED',
        outcome: 'FAILURE',
        phone,
        reason: 'OTP expired',
      });
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }

    // 2. Lockout Check: Max 5 Failed Attempts
    if (otpRecord.attempts >= 5) {
      await prisma.otpVerification.delete({ where: { phone } });
      logger.auth({
        event: 'OTP_VERIFICATION_FAILED',
        outcome: 'FAILURE',
        phone,
        reason: 'Max attempts exceeded',
      });
      return { success: false, error: 'Maximum verification attempts exceeded. Please request a new code.' };
    }

    // 3. Validate Bcrypt OTP Hash
    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isValid) {
      const updatedAttempts = otpRecord.attempts + 1;
      if (updatedAttempts >= 5) {
        await prisma.otpVerification.delete({ where: { phone } });
      } else {
        await prisma.otpVerification.update({
          where: { phone },
          data: { attempts: updatedAttempts },
        });
      }
      logger.auth({
        event: 'OTP_VERIFICATION_FAILED',
        outcome: 'FAILURE',
        phone,
        reason: 'Invalid OTP code',
      });
      const remainingAttempts = Math.max(0, 5 - updatedAttempts);
      return {
        success: false,
        error: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
      };
    }

    // 4. Invalidate & Delete OTP Record Immediately (Prevents Replay Attacks)
    await prisma.otpVerification.delete({ where: { phone } });

    logger.auth({
      event: 'OTP_VERIFICATION_SUCCESS',
      outcome: 'SUCCESS',
      phone,
    });

    // 5. Issue Logged-In Session
    return await createVerifiedPhoneSession(phone);
  } catch (error) {
    console.error('verifyOtpAction Error:', error);
    return { success: false, error: 'Failed to verify code. Please try again.' };
  }
}

/**
 * 4. Logout Action
 */
export async function logoutAction(): Promise<void> {
  const session = await getServerSession();
  if (session?.sub) {
    logger.auth({
      event: 'SESSION_REVOKED',
      outcome: 'SUCCESS',
      actorId: session.sub,
      reason: 'User explicit logout',
    });
  }
  await removeAuthCookie();
  revalidatePath('/');
}

/**
 * 5. Get Current User Session (Database Validated & Token Version Enforced)
 */
export async function getCurrentUserAction() {
  const session = await getServerSession();
  if (!session || !session.sub) {
    return { success: false, user: null };
  }

  // Verify student record actually exists in Prisma DB
  const student = await prisma.student.findUnique({
    where: { id: session.sub },
    select: { id: true, role: true, phone: true, email: true, name: true, authVersion: true },
  });

  if (!student) {
    logger.auth({
      event: 'SESSION_REVOKED',
      outcome: 'FAILURE',
      actorId: session.sub,
      reason: 'Student account missing or deleted in database',
    });
    await removeAuthCookie();
    return { success: false, user: null };
  }

  // Token Versioning Revocation Check
  if (session.ver !== undefined && session.ver !== student.authVersion) {
    logger.auth({
      event: 'SESSION_REVOKED',
      outcome: 'FAILURE',
      actorId: student.id,
      reason: `Token version mismatch: session ver (${session.ver}) != DB authVersion (${student.authVersion})`,
    });
    await removeAuthCookie();
    return { success: false, user: null };
  }

  return { success: true, user: { ...session, ...student } };
}
