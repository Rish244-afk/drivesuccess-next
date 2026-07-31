import { NextResponse } from 'next/server';
import { getCurrentUserAction } from '@/actions/auth';

export async function GET() {
  const result = await getCurrentUserAction();
  if (!result.success || !result.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(result, { status: 200 });
}
