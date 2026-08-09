import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Returns the JWT signing secret as a Uint8Array.
 *
 * SECURITY: JWT_SECRET MUST be set in all environments. There is no default
 * fallback. If the variable is missing at runtime the function throws, causing
 * all auth operations to fail closed rather than silently accepting tokens
 * signed with a publicly-known default key.
 *
 * We use a runtime getter (not a module-level constant) so Next.js static
 * build steps—which may run before environment variables are injected—do not
 * throw at compile time.
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      '[auth] JWT_SECRET environment variable is not set. ' +
        'All authentication operations are disabled until this is configured.'
    );
  }
  return new TextEncoder().encode(secret);
}

const COOKIE_NAME = 'auth_token';
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds


export interface JWTPayload {
  sub: string;
  phone: string;
  role: string;
  name?: string;
  ver?: number;
  // email may be null for phone-only students who have not yet linked a Google account.
  email?: string | null;
}


/**
 * Sign 30-day rolling JWT token using Jose
 */
export async function signSessionToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtSecret());
}

/**
 * Verify JWT token cryptographically (signature and expiration)
 */
export async function verifySessionToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Authoritatively validates a session token against JWT signature/expiration AND PostgreSQL Student.authVersion.
 * Fails closed (returns null) on missing claims, missing student, version mismatch, or database errors.
 */
export async function validateSessionToken(token: string): Promise<JWTPayload | null> {
  try {
    const payload = await verifySessionToken(token);
    if (!payload || !payload.sub || payload.ver === undefined) {
      return null;
    }

    // Authoritative PostgreSQL Student.authVersion lookup
    const student = await prisma.student.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        authVersion: true,
      },
    });

    if (!student) {
      return null;
    }

    if (payload.ver !== student.authVersion) {
      return null;
    }

    return payload;
  } catch (error) {
    // Fail closed on database or execution errors
    console.error('[auth] validateSessionToken error:', error);
    return null;
  }
}

/**
 * Set HTTP-Only Cookie with 30-day rolling expiration
 */
export async function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: THIRTY_DAYS_SECONDS,
  });
}

/**
 * Remove Auth Cookie
 */
export async function removeAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get Current Authenticated Session Payload from Server Context
 * Validates JWT cryptographic integrity AND performs authoritative PostgreSQL Student.authVersion check.
 * Safe for Server Components (does NOT mutate cookies during render).
 */
export async function getServerSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await validateSessionToken(token);
  } catch (error) {
    console.error('[auth] getServerSession error:', error);
    return null;
  }
}

/**
 * Refresh 30-day rolling cookie session on response
 */
export function refreshSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: THIRTY_DAYS_SECONDS,
  });
  return response;
}
