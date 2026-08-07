import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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
 * Verify JWT token
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
 */
export async function getServerSession(): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
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
