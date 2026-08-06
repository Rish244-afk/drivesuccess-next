/**
 * Structured Production Logger
 * Sanitizes sensitive credentials, tokens, and passwords before logging.
 *
 * Each OAuth round-trip receives a unique traceId generated at the entry point
 * of POST /api/auth/google. Passing this ID through every logger.auth() call
 * within the same request allows a single login attempt to be correlated
 * end-to-end across all log lines with a simple grep:
 *
 *   grep '"traceId":"tr_abc123"' server.log
 */

type LogLevel = 'info' | 'warn' | 'error';

/**
 * Generate a short, URL-safe trace ID for correlating all log lines
 * emitted by a single OAuth round-trip.
 *
 * Format: tr_<8 random hex chars>  e.g. tr_3f9a1b2c
 * Collision probability is negligible for the volume of a single application.
 */
export function generateTraceId(): string {
  return 'tr_' + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
}

function sanitize(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  const sensitiveKeys = ['password', 'token', 'otp', 'secret', 'jwt', 'authorization', 'apiKey'];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }

  return sanitized;
}

export interface AuthAuditLog {
  timestamp?: string;
  /**
   * Short trace ID shared by all log lines emitted for a single OAuth
   * round-trip. Generated once at the entry of POST /api/auth/google
   * and threaded through every subsequent logger.auth() call.
   * Allows `grep '"traceId":"tr_XXXX"'` to reconstruct a full login.
   */
  traceId?: string;
  event:
    | 'OAUTH_REQUEST_RECEIVED'
    | 'OAUTH_CODE_EXCHANGE_STARTED'
    | 'OAUTH_TOKEN_RESPONSE'
    | 'OAUTH_CODE_EXCHANGE_SUCCESS'
    | 'OAUTH_CODE_EXCHANGE_FAILED'
    | 'OAUTH_EMAIL_EXTRACTED'
    | 'OAUTH_EMAIL_MISSING'
    | 'OTP_DISPATCHED'
    | 'OTP_VERIFICATION_SUCCESS'
    | 'OTP_VERIFICATION_FAILED'
    | 'IDENTITY_LINKED'
    | 'ACCOUNT_CREATED'
    | 'SESSION_ISSUED'
    | 'SESSION_REVOKED'
    | 'AUTH_REJECTED';
  actorId?: string;
  email?: string;
  phone?: string;
  ip?: string;
  userAgent?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'REJECTED';
  reason?: string;
  details?: Record<string, unknown>;
}

export interface PaymentAuditLog {
  timestamp?: string;
  traceId?: string;
  event:
    | 'PAYMENT_ORDER_CREATED'
    | 'PAYMENT_VERIFY_STARTED'
    | 'PAYMENT_VERIFY_SUCCESS'
    | 'PAYMENT_VERIFY_FAILED'
    | 'PAYMENT_WEBHOOK_RECEIVED'
    | 'PAYMENT_EXPIRED_CLEANUP'
    | 'PAYMENT_RECONCILED';
  bookingId?: string;
  studentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount?: number;
  outcome: 'SUCCESS' | 'FAILURE' | 'SKIPPED';
  reason?: string;
  details?: Record<string, unknown>;
}

export const logger = {
  info: (message: string, context?: Record<string, any>) => {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, context: sanitize(context) }));
  },
  warn: (message: string, context?: Record<string, any>) => {
    console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, context: sanitize(context) }));
  },
  error: (message: string, error?: any, context?: Record<string, any>) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        errorMessage: error?.message || String(error),
        context: sanitize(context),
      })
    );
  },
  auth: (auditLog: AuthAuditLog) => {
    const payload = {
      timestamp: new Date().toISOString(),
      type: 'AUTH_AUDIT',
      ...auditLog,
      details: sanitize(auditLog.details),
    };
    if (auditLog.outcome === 'FAILURE') {
      console.error(JSON.stringify(payload));
    } else if (auditLog.outcome === 'REJECTED') {
      console.warn(JSON.stringify(payload));
    } else {
      console.log(JSON.stringify(payload));
    }
  },
  payment: (auditLog: PaymentAuditLog) => {
    const payload = {
      timestamp: new Date().toISOString(),
      type: 'PAYMENT_AUDIT',
      ...auditLog,
      details: sanitize(auditLog.details),
    };
    if (auditLog.outcome === 'FAILURE') {
      console.error(JSON.stringify(payload));
    } else {
      console.log(JSON.stringify(payload));
    }
  },
};

