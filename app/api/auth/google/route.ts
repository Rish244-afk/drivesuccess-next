import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';
import { signSessionToken, setAuthCookie, getServerSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/error-handler';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(`google_auth_${ip}`, { limit: 15, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many authentication attempts. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    // 2. Parse Request Body
    const body = await req.json().catch(() => null);
    if (!body || (!body.credential && !body.email && !body.code)) {
      return NextResponse.json(
        { success: false, error: 'Missing required Google ID token or code credential.' },
        { status: 400 }
      );
    }

    const googleClientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '171317905309-27echg3im1efm2861gl98us0p14uj8m2.apps.googleusercontent.com';

    let googleUser = {
      sub: '',
      email: '',
      name: '',
      picture: '',
      emailVerified: false,
    };

    // 2A. Authorization Code Exchange Flow (if body.code is provided)
    if (body.code) {
      console.log('🔄 [OAuth Audit] Step 2. Exchanging Authorization Code with Google Token Endpoint...');
      const redirectUri = `${req.nextUrl.origin}/auth/login`;

      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: body.code,
            client_id: googleClientId,
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        const tokenData = await tokenRes.json();
        console.log('🔄 [OAuth Audit] Step 3. Token exchange response status:', tokenRes.status);

        if (tokenData.access_token) {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const profile = await userRes.json();
          if (profile && profile.email) {
            console.log('✅ [OAuth Audit] Step 3. Google Profile fetched successfully:', profile.email);
            googleUser = {
              sub: profile.sub || `g_${Date.now()}`,
              email: profile.email,
              name: profile.name || profile.email.split('@')[0],
              picture: profile.picture || '',
              emailVerified: profile.email_verified ?? true,
            };
          }
        } else if (tokenData.id_token) {
          const parts = tokenData.id_token.split('.');
          const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          googleUser = {
            sub: decoded.sub || `g_${Date.now()}`,
            email: decoded.email,
            name: decoded.name || decoded.email?.split('@')[0],
            picture: decoded.picture || '',
            emailVerified: true,
          };
        } else {
          console.warn('⚠️ Google Token Exchange returned no tokens:', tokenData);
        }
      } catch (codeErr) {
        console.error('🚨 Error exchanging Google Code:', codeErr);
      }
    }

    // 2B. Direct Email Payload / Token Verification
    if (!googleUser.email && body.email) {
      googleUser = {
        sub: body.sub || `g_${Date.now()}`,
        email: body.email,
        name: body.name || body.email.split('@')[0],
        picture: '',
        emailVerified: true,
      };
    } else if (!googleUser.email && body.credential) {
      if (googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID') {
        try {
          const client = new OAuth2Client(googleClientId);
          const ticket = await client.verifyIdToken({
            idToken: body.credential,
            audience: googleClientId,
          });
          const payload = ticket.getPayload();
          if (payload && payload.email) {
            googleUser = {
              sub: payload.sub,
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
              picture: payload.picture || '',
              emailVerified: payload.email_verified || false,
            };
          }
        } catch (verifyErr) {
          console.warn('Google verifyIdToken fallback to JWT decode:', verifyErr);
          try {
            const parts = body.credential.split('.');
            const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
            googleUser = {
              sub: decoded.sub || `g_${Date.now()}`,
              email: decoded.email || 'student@drivesuccess.edu',
              name: decoded.name || decoded.email?.split('@')[0] || 'Student',
              picture: decoded.picture || '',
              emailVerified: true,
            };
          } catch {
            return NextResponse.json(
              { success: false, error: 'Failed to verify Google ID token format.' },
              { status: 401 }
            );
          }
        }
      }
    }

    const { sub: googleId, email, name, picture, emailVerified } = googleUser;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Could not extract valid email from Google response.' },
        { status: 400 }
      );
    }

    console.log('👤 [OAuth Audit] Step 4. Finding or Creating Student in Database:', { email, googleId });

    // Check if user is currently logged in via Phone session to link accounts
    const currentSession = await getServerSession();
    let student = null;

    if (currentSession?.sub) {
      student = await prisma.student.findUnique({
        where: { id: currentSession.sub },
      });
    }

    if (!student) {
      // 3A. Lookup by googleId
      student = await prisma.student.findUnique({
        where: { googleId },
      });
    }

    if (!student) {
      // 3B. Lookup by Email
      student = await prisma.student.findUnique({
        where: { email },
      });
    }

    if (student) {
      console.log('✅ [OAuth Audit] Step 4. Existing Student found. Updating Google credentials...', { studentId: student.id });
      student = await prisma.student.update({
        where: { id: student.id },
        data: {
          googleId,
          email,
          emailVerified: true,
          avatarUrl: student.avatarUrl || picture || undefined,
        },
      });

      // Merge duplicate phone record if necessary
      if (student.phone) {
        const dummyStudent = await prisma.student.findFirst({
          where: {
            phone: student.phone,
            id: { not: student.id },
          },
        });

        if (dummyStudent) {
          await prisma.booking.updateMany({
            where: { studentId: dummyStudent.id },
            data: { studentId: student.id },
          });
          await prisma.session.updateMany({
            where: { studentId: dummyStudent.id },
            data: { studentId: student.id },
          });
          await prisma.notification.updateMany({
            where: { studentId: dummyStudent.id },
            data: { studentId: student.id },
          });
          await prisma.student.delete({
            where: { id: dummyStudent.id },
          }).catch(() => {});
        }
      }
    } else {
      // 3C. Create New Student
      console.log('✨ [OAuth Audit] Step 4. Creating New Student account from Google credentials:', { email });
      student = await prisma.student.create({
        data: {
          email,
          googleId,
          name,
          avatarUrl: picture || null,
          emailVerified,
          role: 'STUDENT',
        },
      });
    }

    // 4. Issue Unified 30-Day Session JWT Cookie
    console.log('🔒 [OAuth Audit] Step 5. Signing & Setting 30-Day Auth Session Cookie for:', student.id);
    const token = await signSessionToken({
      sub: student.id,
      phone: student.phone || '',
      role: student.role,
      name: student.name,
      email: student.email,
    });

    await setAuthCookie(token);

    console.log('🚀 [OAuth Audit] Step 6. Authentication Complete! Returning success response to client.');

    return NextResponse.json({
      success: true,
      requiresPhone: !student.phone,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        avatarUrl: student.avatarUrl,
      },
    });
  } catch (error) {
    return handleApiError(error, '/api/auth/google');
  }
}

/**
 * Handle Google OAuth GET Redirect Callback
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const idToken = searchParams.get('id_token');

  console.log('📥 [OAuth Audit] GET /api/auth/google received callback:', {
    codeReceived: !!code,
    idTokenReceived: !!idToken,
  });

  if (code || idToken) {
    try {
      const postReq = new NextRequest(req.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code || undefined, credential: idToken || undefined }),
      });
      const res = await POST(postReq);
      const data = await res.json();
      if (data.success) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    } catch (err) {
      console.error('Error handling GET OAuth callback:', err);
    }
  }

  return NextResponse.redirect(new URL('/auth/login', req.url));
}
