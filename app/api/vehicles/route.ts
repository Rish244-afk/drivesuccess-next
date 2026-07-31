import { NextRequest, NextResponse } from 'next/server';
import { getVehiclesAction } from '@/actions/vehicle';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get('tier') || undefined;
  const status = searchParams.get('status') || undefined;

  const result = await getVehiclesAction({ tier, status });
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
