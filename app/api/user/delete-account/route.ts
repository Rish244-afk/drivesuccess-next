import { NextResponse } from 'next/server';
import { deleteStudentAccountAction } from '@/actions/profile';

export async function DELETE() {
  const result = await deleteStudentAccountAction();
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json(result, { status: 200 });
}
