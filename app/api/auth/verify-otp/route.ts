import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpAction } from '@/actions/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone and OTP are required' }, { status: 400 });
    }

    const result = await verifyOtpAction(phone, otp);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('API /api/auth/verify-otp Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
