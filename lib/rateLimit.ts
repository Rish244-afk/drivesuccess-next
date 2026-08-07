/**
 * Sliding Window Token Bucket Rate Limiter
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Periodically clean expired store entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  public check(identifier: string): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || now > record.resetTime) {
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.store.set(identifier, newRecord);
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: newRecord.resetTime,
      };
    }

    if (record.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: record.resetTime,
      };
    }

    record.count += 1;
    this.store.set(identifier, record);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.count,
      reset: record.resetTime,
    };
  }

  private cleanup() {
    const now = Date.now();
    this.store.forEach((value, key) => {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    });
  }
}

// Global Pre-Configured Rate Limiters
export const authRateLimiter = new RateLimiter(5, 60 * 1000);     // 5 OTP requests / min
export const bookingRateLimiter = new RateLimiter(10, 60 * 1000);  // 10 bookings / min
export const apiRateLimiter = new RateLimiter(60, 60 * 1000);      // 60 requests / min

/**
 * Universal Rate Check Helper
 *
 * Accepts { limit, windowMs } and applies them to an isolated RateLimiter instance
 * unique to that configuration. Endpoints with different limits/windows get genuinely
 * separate, independently-bounded buckets and cannot interfere with each other.
 *
 * ARCHITECTURAL CAVEAT — in-process / serverless state:
 * All counters live in Node.js process memory. On serverless platforms (Vercel etc.)
 * each function instance is an isolated process; a cold-start silently resets all
 * counters. For distributed/production-grade rate limiting, replace with a Redis-
 * backed limiter (e.g. @upstash/ratelimit). This fix is the safest in-architecture
 * improvement without adding new dependencies.
 *
 * @param identifier  - Unique per-caller key, e.g. `send_otp_<ip>`
 * @param options.limit    - Max requests allowed per window (required)
 * @param options.windowMs - Window duration in ms (required)
 */
const _limiterRegistry = new Map<string, RateLimiter>();

export function checkRateLimit(
  identifier: string,
  options?: { limit?: number; windowMs?: number },
) {
  const limit = options?.limit ?? 5;
  const windowMs = options?.windowMs ?? 60_000;
  const registryKey = `${limit}:${windowMs}`;

  if (!_limiterRegistry.has(registryKey)) {
    _limiterRegistry.set(registryKey, new RateLimiter(limit, windowMs));
  }

  const result = _limiterRegistry.get(registryKey)!.check(identifier);

  return {
    allowed: result.success,
    remaining: result.remaining,
    resetMs: Math.max(0, result.reset - Date.now()),
  };
}
