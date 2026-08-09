import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient } from '@/lib/redis';

/**
 * Sliding Window In-Memory Rate Limiter Record
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * In-Memory Fallback Store (for local development, CI tests, and generic endpoint graceful degradation)
 */
class InMemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
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

  public reset(identifier?: string) {
    if (identifier) {
      this.store.delete(identifier);
    } else {
      this.store.clear();
    }
  }
}

/**
 * Distributed Redis-backed RateLimiter with Fallback Policies
 */
export class RateLimiter {
  private prefix: string;
  private maxRequests: number;
  private windowMs: number;
  private isSensitive: boolean;
  private inMemoryFallback: InMemoryRateLimiter;
  private ratelimitInstance: Ratelimit | null = null;

  constructor(prefix: string, maxRequests: number, windowMs: number, isSensitive = false) {
    this.prefix = prefix;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.isSensitive = isSensitive;
    this.inMemoryFallback = new InMemoryRateLimiter(maxRequests, windowMs);
  }

  private getRatelimit(): Ratelimit | null {
    if (this.ratelimitInstance) {
      return this.ratelimitInstance;
    }

    const redis = getRedisClient();
    if (!redis) {
      return null;
    }

    const seconds = Math.max(1, Math.round(this.windowMs / 1000));
    this.ratelimitInstance = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(this.maxRequests, `${seconds} s` as any),
      prefix: `rl:${this.prefix}`,
    });

    return this.ratelimitInstance;
  }

  public async check(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

    if (isRedisConfigured) {
      try {
        const ratelimit = this.getRatelimit();
        if (ratelimit) {
          const result = await ratelimit.limit(identifier);
          return {
            success: result.success,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
          };
        }
      } catch (error) {
        console.warn(`[RateLimiter Warning] Redis error for ${this.prefix}:${identifier}:`, error);

        // Security Endpoints FAIL CLOSED on runtime Redis exceptions
        if (this.isSensitive) {
          return {
            success: false,
            limit: this.maxRequests,
            remaining: 0,
            reset: Date.now() + this.windowMs,
          };
        }

        // Generic endpoints gracefully degrade to local in-memory store
        return this.inMemoryFallback.check(identifier);
      }
    }

    // Local development / unconfigured environments fallback
    return this.inMemoryFallback.check(identifier);
  }

  public resetLocal(identifier?: string) {
    this.inMemoryFallback.reset(identifier);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRE-CONFIGURED SINGLETON RATE LIMITERS
// ─────────────────────────────────────────────────────────────────────────────

// 1. General API Requests (60 req / 1 min) - Non-sensitive (fail open with local fallback)
export const apiRateLimiter = new RateLimiter('api', 60, 60 * 1000, false);

// 2. Student Booking Actions (10 req / 1 min)
export const bookingRateLimiter = new RateLimiter('booking', 10, 60 * 1000, false);

// 3. Auth Actions / Google OAuth (5 req / 1 min) - Sensitive
export const authRateLimiter = new RateLimiter('auth', 5, 60 * 1000, true);

// 4. OTP SMS Dispatch (3 req / 10 min) - Sensitive (Strict Fail-Closed)
export const otpSendRateLimiter = new RateLimiter('otp_send', 3, 10 * 60 * 1000, true);

// 5. OTP Verification (10 req / 1 min) - Sensitive (Strict Fail-Closed)
export const otpVerifyRateLimiter = new RateLimiter('otp_verify', 10, 60 * 1000, true);

// 6. Admin Portal Login (5 req / 15 min) - Sensitive (Strict Fail-Closed)
export const adminLoginRateLimiter = new RateLimiter('admin_login', 5, 15 * 60 * 1000, true);


// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC REGISTRY HELPER (checkRateLimit)
// ─────────────────────────────────────────────────────────────────────────────

const _limiterRegistry = new Map<string, RateLimiter>();

/**
 * Universal Rate Check Helper (Async)
 *
 * @param identifier - Unique per-caller key (e.g., `send_otp_${phone}`, `verify_otp_${ip}`)
 * @param options.limit - Max requests allowed per window (default: 5)
 * @param options.windowMs - Window duration in ms (default: 60000)
 * @param options.sensitive - Whether this endpoint should fail closed on Redis outage
 */
export async function checkRateLimit(
  identifier: string,
  options?: { limit?: number; windowMs?: number; sensitive?: boolean },
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const limit = options?.limit ?? 5;
  const windowMs = options?.windowMs ?? 60_000;
  
  // Auto-detect sensitivity from prefix if not explicitly specified
  const isSensitive = options?.sensitive ?? (
    identifier.startsWith('send_otp_') ||
    identifier.startsWith('verify_otp_') ||
    identifier.startsWith('admin_') ||
    identifier.startsWith('auth_')
  );

  const prefix = identifier.split('_')[0] || 'custom';
  const registryKey = `${prefix}:${limit}:${windowMs}:${isSensitive}`;

  if (!_limiterRegistry.has(registryKey)) {
    _limiterRegistry.set(registryKey, new RateLimiter(prefix, limit, windowMs, isSensitive));
  }

  const limiter = _limiterRegistry.get(registryKey)!;
  const result = await limiter.check(identifier);

  return {
    allowed: result.success,
    remaining: result.remaining,
    resetMs: Math.max(0, result.reset - Date.now()),
  };
}
