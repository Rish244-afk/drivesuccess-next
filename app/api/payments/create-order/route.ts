import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrderAction } from '@/actions/razorpay';

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'bookingId is required' }, { status: 400 });
    }

    const result = await createRazorpayOrderAction(bookingId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('API /api/payments/create-order Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}
