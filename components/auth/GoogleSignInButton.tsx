'use client';

import React, { useState } from 'react';
import { GoogleLogin, useGoogleOneTapLogin, useGoogleLogin } from '@react-oauth/google';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GoogleSignInButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCredentialResponse = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 600);
      } else {
        setError(data.error || 'Google Authentication failed. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Network error connecting to authentication server.');
      setLoading(false);
    }
  };

  // Custom Google OAuth popup trigger via useGoogleLogin
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!tokenResponse?.access_token) return;
      setLoading(true);
      setError(null);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoRes.json();

        // Send Google User Info to auth server
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential: 'custom_access_token',
            email: googleUser.email,
            name: googleUser.name,
            sub: googleUser.sub,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setSuccess(true);
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 600);
        } else {
          setError(data.error || 'Google Login failed.');
          setLoading(false);
        }
      } catch (e) {
        setError('Failed to retrieve Google profile identity.');
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google Sign-In prompt was dismissed.');
    },
  });

  // Google One Tap automatic prompt on page load
  useGoogleOneTapLogin({
    onSuccess: handleCredentialResponse,
    onError: () => console.log('One Tap Prompt dismissed or unavailable'),
    disabled: loading || success,
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
        <div className="w-full space-y-2">
          {/* 1. Primary Custom Branded Google Sign-In Button (100% Reliable Rendering) */}
          <button
            type="button"
            onClick={() => triggerGoogleLogin()}
            className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 text-xs tracking-wider transition shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* 2. Standard Google GSI Button Embed */}
          <div className="hidden">
            <GoogleLogin
              onSuccess={handleCredentialResponse}
              onError={() => console.log('GSI fallback')}
            />
          </div>
        </div>
      )}
    </div>
  );
}
