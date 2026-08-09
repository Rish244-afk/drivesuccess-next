'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * The key used in sessionStorage to persist the post-OAuth return destination
 * across the full-page redirect to Google and back. sessionStorage survives
 * redirects within the same tab on the same origin, making it the most
 * reliable mechanism to carry the returnTo path through the OAuth round-trip.
 */
export const OAUTH_RETURN_KEY = 'ds_oauth_return_to';

export function GoogleSignInButton({ 
  onSuccess,
  returnTo 
}: { 
  onSuccess?: () => void;
  returnTo?: string;
} = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const promptAttempted = useRef(false);
  /**
   * Ref for the 3.5s GSI fallback timeout.
   * Hoisted here so the useEffect cleanup function can clear it when the
   * component unmounts during the redirect to Google — preventing the timer
   * from firing on the OAuth callback page and injecting a stale error.
   */
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Process Google credential after user finishes account selection (One Tap / FedCM)
  const processGoogleCredential = React.useCallback(async (payload: {
    credential?: string;
    email?: string | null;
    name?: string | null;
    sub?: string | null;
  }) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Verifying Google Identity Token with backend...');
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: payload.credential || 'custom_access_token',
          email: payload.email,
          name: payload.name,
          sub: payload.sub,
        }),
      });

      const data = await res.json();

      if (data.success) {
        console.log('✅ Google Identity verified! Unified 30-day session issued.');
        setSuccess(true);
        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => {
            router.push(returnTo || '/dashboard');
            router.refresh();
          }, 500);
        }
      } else {
        console.error('❌ Server verification rejected token:', data.error);
        setError(data.error || 'Google Authentication failed. Please try again.');
      }
    } catch (err: any) {
      console.error('🚨 Network error verifying Google token:', err);
      setError('Network error connecting to authentication server.');
    } finally {
      setLoading(false);
    }
  }, [onSuccess, returnTo, router]);

  // 2. Initialize Google Identity Services (GSI) and One Tap
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (promptAttempted.current) return;

    // ── Callback Page Guard ────────────────────────────────────────────────
    // If the URL contains ?code= or ?id_token=, this component is mounted
    // inside an active OAuth authorization code callback.  Initializing
    // One Tap here would arm the 3.5s fallback timer for no reason: the
    // user is already mid-flow.  The timer would fire 3.5s later and inject
    // a "Having trouble?" error banner on top of the valid loading state.
    // Skip One Tap initialization entirely on callback pages.
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code') || urlParams.has('id_token')) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not configured.');
    }

    const initGsi = () => {
      if (window.google?.accounts?.id && !promptAttempted.current) {
        promptAttempted.current = true;
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              if (response.credential) {
                processGoogleCredential({ credential: response.credential });
              }
            },
            auto_select: false,
            use_fedcm_for_prompt: true,
            cancel_on_tap_outside: false,
          });

          // Fallback timeout: If no callback from Google within 3.5s, assume
          // One Tap was blocked (common in Brave/Firefox strict mode).
          // Stored in a ref so the useEffect cleanup can cancel it when the
          // component unmounts during the full-page redirect to Google.
          fallbackTimeoutRef.current = setTimeout(() => {
            setError(
              "Having trouble with Google Sign-In? This can happen with privacy browsers like Brave or strict cookie settings. Please use Mobile OTP instead, or try clicking the button below."
            );
          }, 3500);

          // Prompt One Tap
          window.google.accounts.id.prompt((notification: any) => {
            // Notification received — cancel the fallback timeout.
            if (fallbackTimeoutRef.current !== null) {
              clearTimeout(fallbackTimeoutRef.current);
              fallbackTimeoutRef.current = null;
            }

            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.warn('Google One Tap blocked or skipped:', notification.getNotDisplayedReason() || notification.getSkippedReason());
              setError(
                "Having trouble with Google Sign-In? This can happen with privacy browsers like Brave or strict cookie settings. Please use Mobile OTP instead, or try clicking the button below."
              );
            }
          });

        } catch (err) {
          console.warn('GSI prompt notice:', err);
        }
      }
    };

    if (!window.google?.accounts?.id) {
      const existingScript = document.getElementById('google-gsi-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGsi;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', initGsi);
      }
    } else {
      initGsi();
    }

    // Cleanup: cancel the fallback timeout when the component unmounts.
    // This happens during the full-page redirect to Google — without this,
    // the timer would persist in the JS heap and fire 3.5s later on the
    // callback page, injecting a stale error into the freshly mounted
    // component.
    return () => {
      if (fallbackTimeoutRef.current !== null) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    };
  }, [processGoogleCredential]);

  // 3. OAuth Authorization Code Flow on button click
  //
  // KEY CHANGES from the previous implementation:
  //
  // A. response_type=code (Authorization Code Flow) — NOT response_type=id_token.
  //    The implicit id_token flow returns the token in the URL FRAGMENT (#id_token=...).
  //    Fragments are browser-only and can be lost if Next.js performs a server-side
  //    redirect before the client reads them. The authorization code flow returns
  //    the code in the URL QUERY STRING (?code=...) which survives all redirects.
  //
  // B. returnTo stored in sessionStorage BEFORE the redirect.
  //    ROOT CAUSE OF BUG: returnTo was captured as window.location.pathname in the
  //    OAuth state param. When the modal opens on the home page, pathname is "/".
  //    After Google redirected back, stateData.returnTo was "/" — sending the user
  //    back to the home page every time.
  //    FIX: Store the resolved destination in sessionStorage before navigating away.
  //    The login page callback reads and clears this key after a successful auth.
  //    sessionStorage persists within the same browser tab across same-origin redirects.
  const handleGoogleClick = async () => {
    setLoading(true);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not configured.');
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    // Resolve the post-auth destination:
    //  1. Explicit returnTo prop (set by AuthModal, BookingWizard, etc.) — most specific
    //  2. Current page path if it is not the login page itself — contextual fallback
    //  3. /dashboard — safe universal fallback
    const destination =
      returnTo ||
      (typeof window !== 'undefined' && window.location.pathname !== '/auth/login'
        ? window.location.pathname
        : '/dashboard');

    // Store in sessionStorage BEFORE navigating away. This is the key fix.
    // The round-trip through Google's servers will clear all React state, but
    // sessionStorage persists within the same browser tab on the same origin.
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(OAUTH_RETURN_KEY, destination);
      console.log('🔐 [OAuth] Stored post-auth destination:', destination);
    }

    const nonce = Math.random().toString(36).substring(2, 15);
    const stateObj = { nonce, returnTo: destination };
    const stateStr = encodeURIComponent(JSON.stringify(stateObj));
    const redirectUri = encodeURIComponent(`${appUrl}/auth/login`);

    // Set HttpOnly state cookie to prevent CSRF
    try {
      await fetch('/api/auth/oauth-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: stateStr }),
      });
    } catch (err) {
      console.warn('Failed to set oauth state cookie', err);
    }

    // Use authorization code flow — code arrives in the query string, not fragment.
    const googleAuthUrl = [
      'https://accounts.google.com/o/oauth2/v2/auth',
      `?client_id=${clientId}`,
      `&redirect_uri=${redirectUri}`,
      `&response_type=code`,
      `&scope=openid%20email%20profile`,
      `&state=${stateStr}`,
      `&access_type=offline`,
      `&prompt=select_account`,
    ].join('');

    console.log('🚀 [OAuth] Initiating Authorization Code Flow...');
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="w-full space-y-3 font-sans">
      {error && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-900 text-xs space-y-2 text-left shadow-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
          {(error.includes('signed in') || error.includes('connected') || error.includes('linked')) && (
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.reload();
              }}
              className="w-full bg-[#384633] hover:bg-[#2B3B2B] text-white py-2 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-xs"
            >
              Sign Out & Try Again
            </button>
          )}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 text-xs flex items-center justify-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>Authenticated via Google! Redirecting...</span>
        </div>
      )}

      {loading ? (
        <div className="w-full py-3.5 bg-white border border-[#384633]/20 text-[#384633] rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Loader2 className="w-4 h-4 animate-spin text-[#384633]" />
          <span>Verifying Google Account...</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleGoogleClick}
          className="w-full bg-white hover:bg-[#F4F0E8] border border-[#384633]/20 text-[#384633] font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 text-xs tracking-wider transition shadow-xs focus:outline-none cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>
      )}
    </div>
  );
}
