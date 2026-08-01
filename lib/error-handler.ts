import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Centralized API Error Response Handler
 * Strips internal SQL tracebacks, stack traces, and Prisma details in production.
 */
export function handleApiError(error: any, endpointName: string): NextResponse {
  logger.error(`API Exception in ${endpointName}`, error);

  const isProduction = process.env.NODE_ENV === 'production';
  
  // Safe user-friendly message
  const userMessage = 'An unexpected error occurred processing your request. Please try again or contact support.';

  return NextResponse.json(
    {
      success: false,
      error: isProduction ? userMessage : error?.message || userMessage,
    },
    { status: 500 }
  );
}
