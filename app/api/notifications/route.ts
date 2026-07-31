import { NextResponse } from 'next/server';
import { getStudentNotificationsAction } from '@/actions/notification';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getStudentNotificationsAction();
  return NextResponse.json(result);
}
