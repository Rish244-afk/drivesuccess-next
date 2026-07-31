import { NextRequest, NextResponse } from 'next/server';
import { createBookingTransactionAction } from '@/actions/bookingSystem';

export async function POST(req: NextRequest) {
  try {
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
