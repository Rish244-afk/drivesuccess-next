import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpAction } from '@/actions/auth';
import { normalizePhoneNumber } from '@/lib/phone';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. IP & Brute-Force Rate Limiting (10 requests / 1 min)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateCheck = await checkRateLimit(`verify_otp_${ip}`, { limit: 10, windowMs: 60 * 1000, sensitive: true });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const { phone, otp } = body || {};

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Mobile phone number is required.' },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Verification code is required.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { success: false, error: 'Verification code must be exactly 6 numeric digits.' },
        { status: 400 }
      );
    }

    const result = await verifyOtpAction(normalizedPhone, cleanOtp);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid or expired verification code.' },
        { status: 400 }
      );
    }

    // Return safe, sanitized JSON response (auth cookie is already issued via httpOnly header)
    return NextResponse.json(
      { success: true, message: 'Phone verification successful.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('API /api/auth/verify-otp Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify code.' },
      { status: 500 }
    );
  }
}
