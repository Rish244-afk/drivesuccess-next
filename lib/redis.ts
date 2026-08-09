import { Redis } from '@upstash/redis';

/**
 * Server-side & Edge-compatible Upstash Redis Client.
 * Configured using UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */
export function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    return new Redis({
      url,
      token,
    });
  } catch (err) {
    console.warn('[Redis] Client initialization warning:', err);
    return null;
  }
}

export const redis = getRedisClient();

// In-memory fallback map for local tests & environments without Upstash credentials
const memoryStore = new Map<string, number>();

/**
 * Get student authVersion from Redis (or memory fallback if Redis unconfigured).
 * Key format: auth_version:${studentId}
 */
export async function getStudentAuthVersionRedis(studentId: string): Promise<number | null> {
  try {
    const client = getRedisClient();
    if (client) {
      const val = await client.get<number | string>(`auth_version:${studentId}`);
      if (val !== null && val !== undefined) {
        const num = typeof val === 'number' ? val : parseInt(String(val), 10);
        return isNaN(num) ? null : num;
      }
    }

    const memVal = memoryStore.get(`auth_version:${studentId}`);
    if (memVal !== undefined && memVal !== null) {
      return memVal;
    }

    return null;
  } catch (err) {
    console.warn(`[Redis Warning] Failed to fetch authVersion for student ${studentId}:`, err);
    const memVal = memoryStore.get(`auth_version:${studentId}`);
    return memVal !== undefined ? memVal : null;
  }
}

/**
 * Set student authVersion in Redis (and memory fallback).
 * Key format: auth_version:${studentId}
 */
export async function setStudentAuthVersionRedis(studentId: string, authVersion: number): Promise<boolean> {
  memoryStore.set(`auth_version:${studentId}`, authVersion);
  try {
    const client = getRedisClient();
    if (!client) {
      return true;
    }
    await client.set(`auth_version:${studentId}`, authVersion);
    return true;
  } catch (err) {
    console.warn(`[Redis Warning] Failed to update authVersion for student ${studentId}:`, err);
    return true;
  }
}
