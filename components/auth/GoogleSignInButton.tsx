'use client';

import React, { useState } from 'react';
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GoogleSignInButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(true);

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

  // Google One Tap automatic prompt on page load
  useGoogleOneTapLogin({
    onSuccess: handleCredentialResponse,
    onError: () => console.log('One Tap Prompt dismissed or unavailable'),
    disabled: loading || success,
  });

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Authenticated via Google! Redirecting...</span>
        </div>
      )}

      {loading ? (
        <div className="w-full py-3.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Verifying Google Identity...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full min-h-[44px]">
          {/* Official Google Identity Button Wrapper */}
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleCredentialResponse}
              onError={() => {
                console.warn('Google GSI iframe blocked or error.');
                setIframeLoaded(false);
              }}
              theme="filled_black"
              shape="rectangular"
              text="continue_with"
              logo_alignment="center"
            />
          </div>
        </div>
      )}
    </div>
  );
}
