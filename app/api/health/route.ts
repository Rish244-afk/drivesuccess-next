import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'HEALTHY';
  let errorDetail = null;

  try {
    // Perform raw SQL ping check on PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbStatus = 'UNHEALTHY';
    errorDetail = err.message || 'Database connection error';
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === 'HEALTHY';

  return NextResponse.json(
    {
      status: isHealthy ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      responseTimeMs: `${responseTimeMs}ms`,
      services: {
        database: {
          status: dbStatus,
          provider: 'PostgreSQL',
          error: errorDetail,
        },
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
