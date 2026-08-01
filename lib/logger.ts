/**
 * Structured Production Logger
 * Sanitizes sensitive credentials, tokens, and passwords before logging.
 */

type LogLevel = 'info' | 'warn' | 'error';

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
};
