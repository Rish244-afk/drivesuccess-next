import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { apiRateLimiter } from '@/lib/rateLimit';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'drivesuccess_super_secret_jwt_key_2026_production'
);

const COOKIE_NAME = 'auth_token';
const ADMIN_COOKIE_NAME = 'admin_auth_token';
const PROTECTED_PAGES = ['/dashboard', '/profile'];
const PROTECTED_API_ROUTES = ['/api/protected', '/api/bookings'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const clientIp = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';

  // 1. CSRF PROTECTION: Validate Origin & Referer on mutating HTTP methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const host = req.headers.get('host');

    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ success: false, error: 'CSRF Forbidden: Origin mismatch' }, { status: 403 });
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

  // 3. ADMIN ROUTE AUTHORIZATION
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value || req.cookies.get(COOKIE_NAME)?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    try {
      const { payload } = await jwtVerify(adminToken, JWT_SECRET);
      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // 4. STUDENT PROTECTED ROUTES
  const token = req.cookies.get(COOKIE_NAME)?.value;
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
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const response = NextResponse.next();
    response.cookies.set(COOKIE_NAME, token, {
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
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
};
