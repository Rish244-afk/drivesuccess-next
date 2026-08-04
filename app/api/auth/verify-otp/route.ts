import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpAction } from '@/actions/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. IP & Brute-Force Rate Limiting (Phase 7)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`verify_otp_${ip}`, { limit: 10, windowMs: 60 * 1000 });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const { phone, otp } = body || {};

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone and 6-digit verification code are required' }, { status: 400 });
    }

    const result = await verifyOtpAction(phone, otp);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('API /api/auth/verify-otp Error:', error);
    return NextResponse.json({ success: false, error: 'Internal verification server error' }, { status: 500 });
  }
}
