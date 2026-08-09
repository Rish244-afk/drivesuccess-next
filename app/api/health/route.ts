import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  let dbStatus = 'HEALTHY';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbStatus = 'UNHEALTHY';
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === 'HEALTHY';

  return NextResponse.json(
    {
      status: isHealthy ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      responseTimeMs: `${responseTimeMs}ms`,
      services: {
        database: {
          status: dbStatus,
          provider: 'PostgreSQL',
        },
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
