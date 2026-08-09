import { NextRequest, NextResponse } from 'next/server';
import { createBookingTransactionAction } from '@/actions/bookingSystem';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await checkRateLimit(`booking_create_${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Too many booking attempts. Please wait a few minutes.' }, { status: 429 });
    }

    const body = await req.json();
    const result = await createBookingTransactionAction(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('API /api/bookings/create Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
