import { NextRequest, NextResponse } from 'next/server';
import { sendOtpAction } from '@/actions/auth';
import { normalizePhoneNumber } from '@/lib/phone';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. IP & Endpoint Rate Limiting (3 requests / 10 min)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(`send_otp_${ip}`, { limit: 3, windowMs: 10 * 60 * 1000 });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please wait a few minutes before requesting a new code.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const { phone } = body || {};

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Mobile phone number is required.' },
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

    const result = await sendOtpAction(normalizedPhone);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Return safe, sanitized JSON response with no internal credentials or OTP
    return NextResponse.json(
      { success: true, message: result.message },
      { status: 200 }
    );
  } catch (error) {
    console.error('API /api/auth/send-otp Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process verification request.' },
      { status: 500 }
    );
  }
}
