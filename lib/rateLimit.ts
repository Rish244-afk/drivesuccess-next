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
 */
export function checkRateLimit(identifier: string, options?: { limit?: number; windowMs?: number }) {
  const result = authRateLimiter.check(identifier);
  return {
    allowed: result.success,
    remaining: result.remaining,
    resetMs: result.reset - Date.now(),
  };
}
