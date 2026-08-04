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
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const gsiButtonRef = useRef<HTMLDivElement>(null);

  // 1. Process Google credential after user finishes account selection
  const processGoogleCredential = async (payload: {
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
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 500);
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

  // 2. Initialize Google Identity Services (GSI) ONLY on Authorized Origins
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const isAuthorizedOrigin =
      hostname === 'drivesuccess-next.vercel.app' || hostname.includes('localhost') || hostname === '127.0.0.1';

    // On preview URLs, do not render GSI iframe to avoid Google 400 origin_mismatch
    if (!isAuthorizedOrigin) {
      setGsiLoaded(false);
      return;
    }

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '171317905309-27echg3im1efm2861gl98us0p14uj8m2.apps.googleusercontent.com';

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          console.log('⚡ Initializing Google Identity Services (GSI)...');

          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              console.log('🔑 Google GSI Credential response received');
              if (response.credential) {
                processGoogleCredential({ credential: response.credential });
              }
            },
            auto_select: false,
            use_fedcm_for_prompt: true,
            cancel_on_tap_outside: false,
          });

          // Render Official Google Sign-In Button inside container
          if (gsiButtonRef.current) {
            gsiButtonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(gsiButtonRef.current, {
              theme: 'filled_black',
              size: 'large',
              shape: 'rectangular',
              text: 'continue_with',
              width: '100%',
            });
            setGsiLoaded(true);
          }
        } catch (err) {
          console.warn('GSI render error:', err);
          setGsiLoaded(false);
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
  }, []);

  // 3. Fallback Popup Auth via Firebase Authorized Domain for Preview URLs
  const handleGoogleClick = async () => {
    setError(null);
    setLoading(true);

    try {
      console.log('🔒 Triggering Firebase Authorized Google popup...');
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      console.log('🔑 Google Account authenticated:', user.email);
      await processGoogleCredential({
        credential: idToken || 'custom_access_token',
        email: user.email,
        name: user.displayName || user.email?.split('@')[0],
        sub: user.uid,
      });
    } catch (popupErr: any) {
      console.warn('Google popup notice:', popupErr);
      setLoading(false);
      if (popupErr?.code === 'auth/popup-closed-by-user') return;

      // On non-authorized preview URLs, redirect to canonical production domain
      if (
        typeof window !== 'undefined' &&
        !window.location.hostname.includes('localhost') &&
        window.location.hostname !== 'drivesuccess-next.vercel.app'
      ) {
        console.log('✈️ Redirecting to primary production domain for Google OAuth authorization...');
        window.location.href = `https://drivesuccess-next.vercel.app/auth/login?from=${encodeURIComponent(
          window.location.pathname
        )}`;
        return;
      }

      setError('Authentication failed. Please log in via Mobile OTP or test on https://drivesuccess-next.vercel.app');
    }
  };

  return (
    <div className="w-full space-y-3 font-sans">
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
        <div className="w-full py-3.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Verifying Google Account...</span>
        </div>
      ) : (
        <div className="w-full">
          {/* Official Google Identity Services (GSI) Button Container (Only shown on authorized domains) */}
          {gsiLoaded ? (
            <div ref={gsiButtonRef} className="w-full flex justify-center overflow-hidden rounded-xl min-h-[44px]" />
          ) : (
            /* Custom Branded Google Button (Triggers Firebase OAuth popup / Canonical Redirect) */
            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 text-xs tracking-wider transition shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
