import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { apiRateLimiter } from '@/lib/rateLimit';

/**
 * Returns the JWT signing secret for middleware use.
 *
 * SECURITY: JWT_SECRET MUST be configured. There is no hardcoded fallback.
 * If the variable is missing at runtime this function throws, causing the
 * middleware to return 500 rather than silently accepting tokens signed with
 * a publicly-known default key. (Build-time execution is safe because the
 * middleware is only invoked at request time, not at compile time.)
 */
function getMiddlewareJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      '[middleware] JWT_SECRET environment variable is not set. '
      + 'All protected route authentication is disabled.'
    );
  }
  return new TextEncoder().encode(secret);
}

const COOKIE_NAME = 'auth_token';
const ADMIN_COOKIE_NAME = 'admin_auth_token';
const PROTECTED_PAGES = ['/dashboard', '/profile'];
const PROTECTED_API_ROUTES = ['/api/protected', '/api/bookings'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const clientIp = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';

  // 1. CSRF PROTECTION: Validate Origin on mutating HTTP methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.get('origin');

    if (origin) {
      const isAuthPath = pathname.startsWith('/api/auth');

      // Build the exact trusted-origin set from configuration.
      // SECURITY: NEVER use substring matching (includes, startsWith, endsWith) for origin decisions.
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://drivesuccess-next.vercel.app').replace(/\/$/, '');

      const trustedOrigins = new Set([
        appUrl,                               // canonical production URL
        'http://localhost:3000',               // local Next.js dev server
        'http://localhost:3001',               // alternative local port
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ]);

      // If request has a Host header, validate exact same-origin match via URL parsing
      const host = req.headers.get('host');
      if (host) {
        try {
          const parsedOrigin = new URL(origin);
          // Same-origin check: exact match of origin's host (hostname:port) with Host header
          // AND scheme match (https: in production, or http: for local development)
          if (parsedOrigin.host === host) {
            const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
            const expectedProtocol = isLocal ? 'http:' : 'https:';
            if (parsedOrigin.protocol === expectedProtocol) {
              trustedOrigins.add(origin);
            }
          }
        } catch {
          // Malformed Origin header
        }
      }

      if (!isAuthPath && !trustedOrigins.has(origin)) {
        return NextResponse.json({ success: false, error: 'CSRF Forbidden: Origin mismatch' }, { status: 403 });
      }
    }
  }

  // 2. RATE LIMITING: Global API Rate Limiter (60 req/min)
  if (pathname.startsWith('/api/')) {
    const rateCheck = apiRateLimiter.check(clientIp);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: 'Too Many Requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  // 3. RETURNING USER AUTO-REDIRECT: Instant server redirect if already authenticated visiting /auth/login
  // EXCEPTION: Do not redirect if this is an OAuth authorization code callback (?code=... or ?state=...)
  if (pathname === '/auth/login' && token) {
    const isOauthCallback = req.nextUrl.searchParams.has('code') || req.nextUrl.searchParams.has('state');
    if (!isOauthCallback) {
      try {
        await jwtVerify(token, getMiddlewareJwtSecret());
        const fromUrl = req.nextUrl.searchParams.get('from') || '/dashboard';
        return NextResponse.redirect(new URL(fromUrl, req.url));
      } catch {
        // Invalid token, allow access to login page
      }
    }
  }

  // 4. ADMIN ROUTE AUTHORIZATION
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value || token;
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    try {
      const { payload } = await jwtVerify(adminToken, getMiddlewareJwtSecret());
      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // 5. STUDENT PROTECTED ROUTES
  const isProtectedPage = PROTECTED_PAGES.some((path) => pathname.startsWith(path));
  const isProtectedApi = PROTECTED_API_ROUTES.some((path) => pathname.startsWith(path));

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getMiddlewareJwtSecret());

    // 4b. AUTHVERSION REDIS REVOCATION CHECK
    const sub = payload.sub as string | undefined;
    const tokenVer = payload.ver as number | undefined;

    if (sub && tokenVer !== undefined) {
      const { getStudentAuthVersionRedis } = await import('@/lib/redis');
      const redisVer = await getStudentAuthVersionRedis(sub);

      if (redisVer !== null && redisVer !== tokenVer) {
        if (isProtectedApi) {
          const response = NextResponse.json(
            { success: false, error: 'Session revoked. Please log in again.' },
            { status: 401 }
          );
          response.cookies.delete(COOKIE_NAME);
          return response;
        }

        const loginUrl = new URL('/auth/login', req.url);
        loginUrl.searchParams.set('error', 'session_revoked');
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete(COOKIE_NAME);
        return response;
      }
    }

    let activeToken = token;
    
    // Rolling session: If token was issued more than 7 days ago, issue a fresh 30-day token
    const iat = payload.iat as number;
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    
    if (iat && (nowInSeconds - iat > sevenDaysInSeconds)) {
      const newPayload = { ...payload };
      delete newPayload.exp;
      delete newPayload.iat;
      delete newPayload.nbf;
      
      activeToken = await new SignJWT(newPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(getMiddlewareJwtSecret());
    }

    const response = NextResponse.next();
    response.cookies.set(COOKIE_NAME, activeToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    response.headers.set('x-user-id', payload.sub as string);
    response.headers.set('x-user-role', payload.role as string);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (err) {
    console.error('Middleware JWT Verification Failed:', err);

    if (isProtectedApi) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid or expired session' }, { status: 401 });
    }

    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    '/auth/login',
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
};
