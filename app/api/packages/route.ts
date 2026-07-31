import { NextRequest, NextResponse } from 'next/server';
import { getPackagesAction } from '@/actions/package';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;

  const result = await getPackagesAction({ category, search });
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
