import { NextResponse } from 'next/server';
import { logoutAction } from '@/actions/auth';

export async function POST() {
  await logoutAction();
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
