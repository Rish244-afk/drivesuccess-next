'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { auth, googleAuthProvider, signInWithPopup } from '@/lib/firebase';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleSignInButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const gsiButtonRef = useRef<HTMLDivElement>(null);

  // 1. Process Google credential after user finishes account selection in One Tap or Popup
  const processGoogleCredential = async (payload: {
    credential?: string;
    email?: string | null;
    name?: string | null;
    sub?: string | null;
  }) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Sending Google ID token to backend for verification...');
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
        console.log('✅ Google Identity verified! Session issued.');
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 600);
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
  };

  // 2. Initialize Google Identity Services (GSI) One Tap + Official Rendered Button
  useEffect(() => {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '171317905309-27echg3im1efm2861gl98us0p14uj8m2.apps.googleusercontent.com';

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        console.log('⚡ Initializing Google Identity Services (GSI)...');

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            console.log('🔑 Google GSI Credential received:', response);
            if (response.credential) {
              processGoogleCredential({ credential: response.credential });
            }
          },
          use_fedcm_for_prompt: true,
          auto_select: false,
          cancel_on_tap_outside: false,
        });

        // Trigger Google One Tap UI prompt (top-right corner prompt)
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log('ℹ️ One Tap not displayed reason:', notification.getNotDisplayedReason());
          } else if (notification.isSkippedMoment()) {
            console.log('ℹ️ One Tap skipped reason:', notification.getSkippedReason());
          } else if (notification.isDismissedMoment()) {
            console.log('ℹ️ One Tap dismissed reason:', notification.getDismissedReason());
          }
        });

        // Render official GSI button in container if present
        if (gsiButtonRef.current) {
          gsiButtonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(gsiButtonRef.current, {
            theme: 'filled_black',
            size: 'large',
            shape: 'rectangular',
            text: 'continue_with',
            width: '100%',
          });
        }
      }
    };

    // Load GSI script if not present
    if (typeof window !== 'undefined' && !window.google?.accounts?.id) {
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
  }, []);

  // 3. Fallback OAuth Popup trigger via useGoogleLogin
  const triggerGoogleOAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!tokenResponse?.access_token) return;
      console.log('🔑 Google OAuth access token received.');
      setLoading(true);
      setError(null);

      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoRes.json();

        await processGoogleCredential({
          credential: 'custom_access_token',
          email: googleUser.email,
          name: googleUser.name,
          sub: googleUser.sub,
        });
      } catch (e: any) {
        console.error('🚨 Failed to fetch user profile:', e);
        setError('Failed to retrieve Google profile identity.');
        setLoading(false);
      }
    },
    onError: (errResp: any) => {
      console.error('🚨 Google OAuth Error:', errResp);
      if (errResp?.error === 'origin_mismatch') {
        setError(`Google OAuth Error 400: origin_mismatch. Please add ${typeof window !== 'undefined' ? window.location.origin : 'this domain'} to Google Cloud Console Authorized JavaScript origins.`);
      } else {
        setError(`Google Sign-In Error: ${errResp?.error_description || errResp?.error || 'Popup closed'}`);
      }
      setLoading(false);
    },
  });

  return (
    <div className="w-full space-y-3">
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Authenticated via Google! Redirecting...</span>
        </div>
      )}

      {loading ? (
        <div className="w-full py-3 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Verifying Google Identity...</span>
        </div>
      ) : (
        <div className="w-full flex justify-center">
          {/* Official Google Identity Services (GSI) Button Container */}
          <div ref={gsiButtonRef} className="w-full flex justify-center overflow-hidden rounded-xl min-h-[44px]" />
        </div>
      )}
    </div>
  );
}
