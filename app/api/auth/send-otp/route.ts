import { NextRequest, NextResponse } from 'next/server';
import { sendOtpAction } from '@/actions/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. IP & Endpoint Rate Limiting (Phase 7)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`send_otp_${ip}`, { limit: 3, windowMs: 10 * 60 * 1000 });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please wait a few minutes before requesting a new code.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const { phone } = body || {};

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Mobile phone number is required' }, { status: 400 });
    }

    const result = await sendOtpAction(phone);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('API /api/auth/send-otp Error:', error);
    return NextResponse.json({ success: false, error: 'Internal authentication server error' }, { status: 500 });
  }
}
