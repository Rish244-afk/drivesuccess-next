'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Phone, KeyRound, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendOtpAction, verifyOtpAction, loginWithVerifiedPhoneAction } from '@/actions/auth';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase';
import { GoogleAuthProvider } from '@/components/auth/GoogleAuthProvider';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get('from') || '/dashboard';

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Auto-redirect & OAuth Callback Handler
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    const hash = window.location.hash;

    let tokenToVerify: string | null = null;
    if (hash && (hash.includes('access_token=') || hash.includes('id_token='))) {
      const hashParams = new URLSearchParams(hash.substring(1));
      tokenToVerify = hashParams.get('id_token') || hashParams.get('access_token');
    }

    console.log('🔍 [OAuth Audit] Page Load Check:', {
      hasCode: !!codeParam,
      hasToken: !!tokenToVerify,
      search: window.location.search,
      hash: window.location.hash,
      fromPath,
    });

    // Handle Google Authorization Code or Implicit Token Callback
    if (codeParam || tokenToVerify) {
      console.log('🔑 [OAuth Audit] Google credentials detected. Forwarding to backend for verification...');
      setMessage('Verifying Google credentials & issuing session...');
      setLoading(true);

      fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeParam || undefined,
          credential: tokenToVerify || undefined,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          console.log('🔄 [OAuth Audit] Response from /api/auth/google:', data);
          if (data.success) {
            console.log('✅ [OAuth Audit] Session created! Checking window type...');
            setMessage('Authenticated via Google! Redirecting...');
            
            const stateParam = urlParams.get('state');
            let stateData: any = null;
            try {
              if (stateParam) stateData = JSON.parse(stateParam);
            } catch (e) {}

            const isPopup = stateData?.mode === 'popup' || window.opener;
            const targetPath = stateData?.returnTo || fromPath;

            if (isPopup && window.opener) {
              window.opener.postMessage({ type: 'OAUTH_COMPLETE', success: true }, window.location.origin);
              window.close();
            } else {
              window.location.href = targetPath;
            }
          } else {
            console.error('❌ [OAuth Audit] Verification error:', data.error);
            setError(data.error || 'Google Sign-In failed. Please try again.');
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('🚨 [OAuth Audit] Network error sending credential to API:', err);
          setError('Network error completing Google authentication.');
          setLoading(false);
        });
      return;
    }

    // Normal session check if student is already authenticated
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          window.location.href = fromPath;
        }
      })
      .catch(() => {});
  }, [fromPath]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Setup Invisible Firebase reCAPTCHA Verifier
  const setupRecaptcha = () => {
    if (typeof window === 'undefined') return null;
    if ((window as any).recaptchaVerifier) {
      return (window as any).recaptchaVerifier;
    }
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  // Handle Send Real SMS OTP via Firebase Auth (or fallback)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number with at least 10 digits.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/[^\d]/g, '')}`;

    try {
      // Try Firebase Real SMS Phone Auth
      const appVerifier = setupRecaptcha();
      if (appVerifier) {
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setMessage(`OTP sent successfully to ${formattedPhone}. Valid for 5 minutes.`);
        setStep('OTP');
        setCooldown(44);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('🚨 Firebase Phone Auth Failure - Code:', err?.code, 'Message:', err?.message, err);
      // Reset reCAPTCHA verifier for retry
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {}
      }
      if (err?.code === 'auth/unauthorized-domain') {
        setError('Firebase Error: Unauthorized Domain. Please add drivesuccess-next.vercel.app to Firebase Authorized Domains.');
      } else if (err?.code === 'auth/quota-exceeded') {
        setError('Firebase Error: Daily SMS quota exceeded. Add test number in Firebase or upgrade to Blaze plan.');
      } else if (err?.code === 'auth/invalid-phone-number') {
        setError('Firebase Error: Invalid phone number format.');
      }
    }

    // Fallback Server Action Send OTP
    const res = await sendOtpAction(phone);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to send OTP.');
      return;
    }

    setMessage(res.message || 'OTP sent successfully to your mobile number.');
    setStep('OTP');
    setCooldown(44);
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP code sent to your phone.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/[^\d]/g, '')}`;

    // 1. Try Firebase Client Verification (Strict - NO bypass)
    if (confirmationResult) {
      try {
        await confirmationResult.confirm(otp);
        const res = await loginWithVerifiedPhoneAction(formattedPhone);
        setLoading(false);

        if (res.success) {
          setMessage('Phone Authentication successful! Redirecting...');
          setTimeout(() => {
            window.location.href = fromPath;
          }, 800);
          return;
        } else {
          setError(res.error || 'Authentication failed.');
          return;
        }
      } catch (firebaseErr: any) {
        setLoading(false);
        console.error('Firebase OTP Verification Error:', firebaseErr);
        setError('Invalid OTP code. Please check the 6-digit code sent to your phone and try again.');
        return;
      }
    }

    // 2. Server Action OTP verification
    const res = await verifyOtpAction(formattedPhone, otp);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Verification failed. Invalid OTP code.');
      return;
    }

    setMessage('Verification successful! Redirecting to student portal...');
    setTimeout(() => {
      window.location.href = fromPath;
    }, 800);
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 font-heading">DriveSuccess Academy</h1>
        <p className="text-xs text-slate-400 mt-1">Vahathi Motor Driving School Student Portal</p>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Step 1: Phone Number Form */}
      {step === 'PHONE' ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Mobile Phone Number
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 pl-11 pr-4 py-3.5 rounded-xl outline-none text-sm font-medium transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Send Verification Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* Step 2: OTP Verification Form */
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Enter 6-Digit OTP
              </label>
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Change Number
              </button>
            </div>

            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 text-center tracking-[0.5em] font-mono text-xl font-extrabold py-3.5 pl-10 pr-4 rounded-xl outline-none transition placeholder:tracking-widest placeholder:text-slate-600"
                required
              />
            </div>

            <div className="flex justify-between items-center mt-3 text-xs text-slate-400">
              <span>Expires in 5 minutes</span>
              {cooldown > 0 ? (
                <span className="text-slate-500">Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-amber-400 font-semibold hover:underline"
                >
                  Resend SMS
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Verify & Access Student Portal</span>
                <ShieldCheck className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-[1px] bg-slate-800 flex-1" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          OR
        </span>
        <div className="h-[1px] bg-slate-800 flex-1" />
      </div>

      {/* Google Identity Sign-In & One Tap */}
      <GoogleSignInButton />
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleAuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <Suspense fallback={<div className="text-slate-400 text-sm">Loading authentication...</div>}>
          <LoginFormContent />
        </Suspense>
      </div>
    </GoogleAuthProvider>
  );
}
