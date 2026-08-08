import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';
import { signSessionToken, setAuthCookie, getServerSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger, generateTraceId } from '@/lib/logger';
import { handleApiError } from '@/lib/error-handler';

export async function POST(req: NextRequest) {
  // Generate a unique trace ID at request entry. Every logger.auth() call
  // within this request handler shares this ID so a single login attempt
  // can be reconstructed end-to-end:  grep '"traceId":"tr_XXXXXXXX"' logs
  const traceId = generateTraceId();

  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    logger.auth({
      event: 'OAUTH_REQUEST_RECEIVED',
      outcome: 'SUCCESS',
      traceId,
      ip,
      userAgent,
      details: {
        method: 'POST',
        hasCode: !!req.headers.get('content-length'),
      },
    });

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
      logger.auth({
        event: 'OAUTH_REQUEST_RECEIVED',
        outcome: 'FAILURE',
        traceId,
        ip,
        reason: 'Missing required Google credential or authorization code in request body.',
        details: {
          hasBody: !!body,
          hasCode: !!body?.code,
          hasCredential: !!body?.credential,
          hasEmail: !!body?.email,
        },
      });
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
      logger.auth({
        event: 'OAUTH_CODE_EXCHANGE_STARTED',
        outcome: 'SUCCESS',
        traceId,
        ip,
        userAgent,
        details: {
          // Log only the first 12 chars of the code — enough to correlate with
          // Google's token endpoint logs without exposing a usable secret.
          codePrefix: String(body.code).substring(0, 12) + '...',
        },
      });

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

        // Log the structural shape of the token response without emitting
        // raw token values. This captures exactly what fields Google returned
        // so we can determine whether Brave's Shields alter the response.
        logger.auth({
          event: 'OAUTH_TOKEN_RESPONSE',
          outcome: tokenData.error ? 'FAILURE' : 'SUCCESS',
          traceId,
          ip,
          userAgent,
          reason: tokenData.error ? (tokenData.error_description || tokenData.error) : undefined,
          details: {
            httpStatus: tokenRes.status,
            hasError: !!tokenData.error,
            errorCode: tokenData.error ?? null,
            errorDescription: tokenData.error_description ?? null,
            hasAccessToken: !!tokenData.access_token,
            hasIdToken: !!tokenData.id_token,
            hasRefreshToken: !!tokenData.refresh_token,
            tokenType: tokenData.token_type ?? null,
            expiresIn: tokenData.expires_in ?? null,
            redirectUri,
          },
        });

        if (tokenData.error) {
          logger.auth({
            event: 'OAUTH_CODE_EXCHANGE_FAILED',
            outcome: 'FAILURE',
            traceId,
            ip,
            userAgent,
            reason: tokenData.error_description || tokenData.error,
            details: { error: tokenData.error, error_description: tokenData.error_description, redirectUri },
          });
          return NextResponse.json(
            {
              success: false,
              error: `Google authorization failed: ${tokenData.error_description || tokenData.error}`,
            },
            { status: 400 }
          );
        }

        // Priority A: Decode the id_token if available (contains reliable, cryptographically-signed identity)
        if (tokenData.id_token) {
          try {
            const parts = tokenData.id_token.split('.');
            if (parts.length === 3) {
              const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
              if (decoded.email) {
                googleUser = {
                  sub: decoded.sub || `g_${Date.now()}`,
                  email: decoded.email,
                  name: decoded.name || decoded.email?.split('@')[0],
                  picture: decoded.picture || '',
                  emailVerified: decoded.email_verified ?? true,
                };
                logger.auth({
                  event: 'OAUTH_EMAIL_EXTRACTED',
                  outcome: 'SUCCESS',
                  traceId,
                  ip,
                  userAgent,
                  email: decoded.email,
                  details: { source: 'ID_TOKEN_JWT_DECODE', sub: decoded.sub, emailVerified: decoded.email_verified },
                });
              }
            }
          } catch (e) {
            logger.warn('Failed to parse Google ID Token JWT', { traceId, error: String(e) });
          }
        }

        // Priority B: Fallback to UserInfo API if id_token was missing or failed to decode
        if (!googleUser.email && tokenData.access_token) {
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const profile = await userRes.json();
            if (profile && profile.email) {
              googleUser = {
                sub: profile.sub || `g_${Date.now()}`,
                email: profile.email,
                name: profile.name || profile.email.split('@')[0],
                picture: profile.picture || '',
                emailVerified: profile.email_verified ?? true,
              };
              logger.auth({
                event: 'OAUTH_EMAIL_EXTRACTED',
                outcome: 'SUCCESS',
                traceId,
                ip,
                userAgent,
                email: profile.email,
                details: { source: 'USERINFO_API', sub: profile.sub, emailVerified: profile.email_verified },
              });
            }
          } catch (apiErr) {
            logger.warn('Failed to fetch from Google UserInfo API', { traceId, error: String(apiErr) });
          }
        }

        if (!googleUser.email) {
          logger.auth({
            event: 'OAUTH_EMAIL_MISSING',
            outcome: 'FAILURE',
            traceId,
            ip,
            userAgent,
            reason: 'No email found in id_token or UserInfo API response.',
            details: {
              hadIdToken: !!tokenData.id_token,
              hadAccessToken: !!tokenData.access_token,
            },
          });
        }
      } catch (codeErr) {
        logger.error('Error exchanging Google authorization code', codeErr, { traceId });
      }
    }

    // 2B. Google Credential Verification (ID Token or Access Token)
    if (!googleUser.email && body.credential) {
      // Priority A: Try google-auth-library verifyIdToken (Cryptographic verification)
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
          logger.warn('Google verifyIdToken check failed or credential is not an ID Token', { traceId, error: String(verifyErr) });
        }
      }

      // Priority B: Try Google UserInfo API (Verifies Access Tokens directly with Google)
      if (!googleUser.email) {
        try {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${body.credential}` },
          });
          if (userRes.ok) {
            const profile = await userRes.json();
            if (profile && profile.email) {
              console.log('✅ [OAuth Audit] Verified Google user from UserInfo API:', profile.email);
              googleUser = {
                sub: profile.sub || `g_${Date.now()}`,
                email: profile.email,
                name: profile.name || profile.email.split('@')[0],
                picture: profile.picture || '',
                emailVerified: profile.email_verified ?? true,
              };
            }
          }
        } catch (apiErr) {
          logger.warn('Google UserInfo API verification failed', { traceId, error: String(apiErr) });
        }
      }
    }

    const { sub: googleId, email, name, picture, emailVerified } = googleUser;

    if (!email) {
      logger.auth({
        event: 'OAUTH_EMAIL_MISSING',
        outcome: 'FAILURE',
        traceId,
        ip,
        userAgent,
        reason: 'All extraction paths exhausted: no email in id_token, UserInfo API, or body payload.',
        details: {
          hadCode: !!body.code,
          hadCredential: !!body.credential,
          hadBodyEmail: !!body.email,
        },
      });
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
    console.log('5. [AUTH RUNTIME LOG] Session (Custom JWT equivalent to Supabase session):', currentSession);
    let student = null;

    // Case 7 Collision Check: Active session exists, but Google email is registered to a DIFFERENT student
    if (currentSession?.sub && email) {
      const emailOwner = await prisma.student.findUnique({ where: { email } });
      if (emailOwner && emailOwner.id !== currentSession.sub) {
        logger.auth({
          event: 'AUTH_REJECTED',
          outcome: 'REJECTED',
          traceId,
          actorId: currentSession.sub,
          email,
          reason: 'Google email is already registered to a different account.',
        });
        return NextResponse.json(
          {
            success: false,
            error: 'This Google account is already connected to another DriveSuccess account. You are currently signed in to a different account. Please sign out first, then continue with Google.',
          },
          { status: 400 }
        );
      }
    }

    // Step 1: Existing JWT session (e.g., Phone OTP session still active)
    if (currentSession?.sub) {
      student = await prisma.student.findUnique({
        where: { id: currentSession.sub },
      });
      if (student) {
        logger.auth({
          event: 'IDENTITY_LINKED',
          outcome: 'SUCCESS',
          traceId,
          actorId: student.id,
          email,
          phone: student.phone || undefined,
          details: { googleId, linkType: 'ACTIVE_SESSION' },
        });
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
      logger.auth({
        event: 'IDENTITY_LINKED',
        outcome: 'SUCCESS',
        traceId,
        actorId: student.id,
        email,
        details: { resolution: 'EXISTING_STUDENT_FOUND', hadGoogleId: !!student.googleId, hadPhone: !!student.phone },
      });
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
      logger.auth({
        event: 'ACCOUNT_CREATED',
        outcome: 'SUCCESS',
        traceId,
        actorId: student.id,
        email,
        details: { method: 'GOOGLE_OAUTH', googleId },
      });
    }

    // 4. Issue Unified 30-Day Session JWT Cookie
    const token = await signSessionToken({
      sub: student.id,
      phone: student.phone || '',
      role: student.role,
      name: student.name,
      email: student.email,
      ver: student.authVersion,
    });

    logger.auth({
      event: 'SESSION_ISSUED',
      outcome: 'SUCCESS',
      traceId,
      actorId: student.id,
      email: student.email || undefined,
      phone: student.phone || undefined,
      details: { method: 'GOOGLE_OAUTH', authVersion: student.authVersion },
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      traceId,
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
    logger.error('Unhandled exception in POST /api/auth/google', error, { traceId });
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
  const state = searchParams.get('state');
  const storedStateCookie = req.cookies.get('oauth_state')?.value;

  console.log('\n\n======================================================');
  console.log('1. [AUTH RUNTIME LOG] Request received (GET)');
  console.log('2. [AUTH RUNTIME LOG] Query parameters:', Array.from(searchParams.entries()));
  console.log('3. [AUTH RUNTIME LOG] OAuth code:', code);

  console.log('📥 [OAuth Audit] GET /api/auth/google received callback:', {
    codeReceived: !!code,
    idTokenReceived: !!idToken,
    stateReceived: !!state,
  });

  // CSRF Protection: Validate state parameter
  if (state && storedStateCookie && state !== storedStateCookie) {
    console.error('🚨 [OAuth Audit] CSRF State mismatch detected!');
    return NextResponse.redirect(new URL('/auth/login?error=csrf', req.url));
  }

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
        let returnTarget = '/dashboard';
        if (state) {
          try {
            const decodedState = decodeURIComponent(state);
            const parsedState = JSON.parse(decodedState);
            if (parsedState?.returnTo && typeof parsedState.returnTo === 'string') {
              returnTarget = parsedState.returnTo;
            }
          } catch (e) {
            try {
              const parsedState = JSON.parse(state);
              if (parsedState?.returnTo && typeof parsedState.returnTo === 'string') {
                returnTarget = parsedState.returnTo;
              }
            } catch (e2) {}
          }
        }

        // Security: Enforce safe relative internal route starting with '/' and not '//' (open redirect defense)
        const targetPath = (returnTarget.startsWith('/') && !returnTarget.startsWith('//'))
          ? returnTarget
          : '/dashboard';

        console.log(`12. [AUTH RUNTIME LOG] Redirecting to ${targetPath}`);
        const redirectRes = NextResponse.redirect(new URL(targetPath, req.url));
        // Clear the state cookie after successful use
        redirectRes.cookies.delete('oauth_state');
        return redirectRes;
      }
    } catch (err) {
      console.error('Error handling GET OAuth callback:', err);
    }
  }

  console.log('12. [AUTH RUNTIME LOG] Redirecting to /auth/login (Fallback)');
  const errRes = NextResponse.redirect(new URL('/auth/login', req.url));
  errRes.cookies.delete('oauth_state');
  return errRes;
}
