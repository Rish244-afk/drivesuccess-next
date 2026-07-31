import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignatureAction } from '@/actions/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await verifyPaymentSignatureAction(body);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('API /api/payments/verify Error:', error);
    return NextResponse.json({ success: false, error: 'Verification error' }, { status: 500 });
  }
}
