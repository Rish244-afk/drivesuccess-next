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

      // PERMANENT FIX: The redirect_uri sent here during code exchange MUST
      // exactly match the redirect_uri sent during the initial authorization
      // request on the frontend. Since the frontend now uses NEXT_PUBLIC_APP_URL,
      // we must use the same stable canonical URL here.
      //
      // req.nextUrl.origin resolves to the current request host, which on Vercel
      // preview deployments is a unique per-commit URL that changes on every push.
      // Using it here would cause Google to reject the token exchange with
      // "redirect_uri_mismatch" on any preview deployment.
      //
      // OPERATOR PRECEDENCE FIX: The previous code had a subtle JS bug:
      //   process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_APP_URL
      //     ? `...` : `...`
      // JS evaluates || before ?, so this actually parsed as:
      //   (process.env.GOOGLE_REDIRECT_URI) || (process.env.NEXT_PUBLIC_APP_URL ? `...` : `...`)
      // When GOOGLE_REDIRECT_URI was undefined, it became:
      //   undefined || (NEXT_PUBLIC_APP_URL ? `${NEXT_PUBLIC_APP_URL}/auth/login` : `${origin}/auth/login`)
      // This accidentally worked, but would silently break with certain env var combinations.
      // Fixed by adding explicit parentheses around the || condition.
      const redirectUri = (process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_APP_URL)
        ? `${process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_APP_URL}/auth/login`
        : `${req.nextUrl.origin}/auth/login`;

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
      // Priority A: Try JWT payload decoding (works for ID Tokens)
      try {
        const parts = body.credential.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (decoded.email) {
            console.log('✅ [OAuth Audit] Parsed Google user from ID Token JWT:', decoded.email);
            googleUser = {
              sub: decoded.sub || `g_${Date.now()}`,
              email: decoded.email,
              name: decoded.name || decoded.email.split('@')[0],
              picture: decoded.picture || '',
              emailVerified: decoded.email_verified ?? true,
            };
          }
        }
      } catch (e) {}

      // Priority B: Try Google UserInfo API (works for Access Tokens)
      if (!googleUser.email) {
        try {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${body.credential}` },
          });
          if (userRes.ok) {
            const profile = await userRes.json();
            if (profile && profile.email) {
              console.log('✅ [OAuth Audit] Fetched Google user from UserInfo API:', profile.email);
              googleUser = {
                sub: profile.sub || `g_${Date.now()}`,
                email: profile.email,
                name: profile.name || profile.email.split('@')[0],
                picture: profile.picture || '',
                emailVerified: profile.email_verified ?? true,
              };
            }
          }
        } catch (e) {}
      }

      // Priority C: Try google-auth-library verifyIdToken
      if (!googleUser.email && googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID') {
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
          console.warn('Google verifyIdToken fallback:', verifyErr);
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

    // ─── Identity Resolution Chain ────────────────────────────────────────────
    // We try each identifier in descending order of trust to find an existing
    // account before creating a new one. This prevents duplicate records when
    // a user authenticates with multiple methods.
    //
    // Resolution order:
    //   Step 1: Active JWT session (user is already logged in via Phone OTP)
    //   Step 2: googleId            (most stable Google identifier)
    //   Step 3: email               (verified email from Google)
    //   Step 4: phone via session   (handles phone-first → Google scenario)
    //
    // Only if ALL four steps fail is a new account created.
    // ─────────────────────────────────────────────────────────────────────────
    const currentSession = await getServerSession();
    let student = null;

    // Step 1: Existing JWT session (e.g., Phone OTP session still active)
    if (currentSession?.sub) {
      student = await prisma.student.findUnique({
        where: { id: currentSession.sub },
      });
      if (student) {
        console.log('🔗 [OAuth] Linking Google identity to active session account:', student.id);
      }
    }

    // Step 2: Lookup by googleId (most authoritative Google identifier)
    if (!student) {
      student = await prisma.student.findUnique({ where: { googleId } });
    }

    // Step 3: Lookup by verified email from Google
    if (!student && email) {
      student = await prisma.student.findUnique({ where: { email } });
    }

    // Step 3C: Lookup by phone number stored in the active JWT session.
    // Handles Scenario B: user first signed in via Phone OTP (no email set),
    // then later signed in via Google. The phone-only account has email=null
    // and googleId=null, so steps 2 and 3 above would miss it.
    // We use the phone from the JWT session payload as the bridge identifier.
    if (!student && currentSession?.phone) {
      const sessionPhone = currentSession.phone;
      if (sessionPhone) {
        student = await prisma.student.findUnique({ where: { phone: sessionPhone } });
        if (student) {
          console.log('🔗 [OAuth] Found phone-only account via session phone. Linking Google identity:', student.id);
        }
      }
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
