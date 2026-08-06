'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Phone, KeyRound, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendOtpAction, verifyOtpAction, loginWithVerifiedPhoneAction } from '@/actions/auth';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase';
import { GoogleAuthProvider } from '@/components/auth/GoogleAuthProvider';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

/**
 * Deterministic authentication phase state machine for the login page.
 *
 * Every UI banner (loading spinner, error panel, success message) derives
 * from a single `phase` value.  Multiple independent booleans (loading,
 * error, message) can diverge and produce contradictory UI — for example,
 * showing an error banner AND a loading spinner at the same time.
 * A discriminated union makes this structurally impossible.
 */
type AuthPhase =
  | { kind: 'IDLE' }
  | { kind: 'GOOGLE_REDIRECT' }                          // button clicked, navigating to Google
  | { kind: 'CALLBACK_RECEIVED' }                        // ?code= detected, POST in flight
  | { kind: 'TOKEN_EXCHANGE'; traceId?: string }         // backend processing the code
  | { kind: 'IDENTITY_RESOLUTION'; traceId?: string }    // student lookup / account linking
  | { kind: 'SESSION_CREATED'; traceId?: string }        // cookie written, redirecting
  | { kind: 'AUTHENTICATED' }                            // redirect issued
  | { kind: 'ERROR'; message: string; traceId?: string } // terminal error — no loading state
  | { kind: 'OTP_SENDING' }                              // OTP in-flight
  | { kind: 'OTP_SENT'; message: string }                // OTP delivered, waiting for entry
  | { kind: 'OTP_VERIFYING' }                            // OTP verify in-flight
  | { kind: 'OTP_SUCCESS'; message: string };            // OTP verified, redirecting

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get('from') || '/dashboard';

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phase, setPhase] = useState<AuthPhase>({ kind: 'IDLE' });
  const [cooldown, setCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Derived convenience flags — single source of truth
  const isLoading = phase.kind === 'GOOGLE_REDIRECT'
    || phase.kind === 'CALLBACK_RECEIVED'
    || phase.kind === 'TOKEN_EXCHANGE'
    || phase.kind === 'IDENTITY_RESOLUTION'
    || phase.kind === 'SESSION_CREATED'
    || phase.kind === 'OTP_SENDING'
    || phase.kind === 'OTP_VERIFYING';

  const errorMessage = phase.kind === 'ERROR' ? phase.message : null;
  const successMessage =
    phase.kind === 'OTP_SENT' ? phase.message
    : phase.kind === 'OTP_SUCCESS' ? phase.message
    : phase.kind === 'SESSION_CREATED' ? 'Authenticated via Google! Redirecting...'
    : null;
  const loadingLabel =
    phase.kind === 'CALLBACK_RECEIVED' || phase.kind === 'TOKEN_EXCHANGE' ? 'Verifying Google credentials & issuing session...'
    : phase.kind === 'IDENTITY_RESOLUTION' ? 'Resolving your account...'
    : phase.kind === 'OTP_SENDING' ? 'Sending verification code...'
    : phase.kind === 'OTP_VERIFYING' ? 'Verifying code...'
    : null;

  // ─── OAuth Callback Handler & Auto-redirect ─────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    const hash = window.location.hash;

    // Legacy implicit flow: token arrives in the URL fragment (#id_token=...)
    let tokenToVerify: string | null = null;
    let stateFromHash: string | null = null;
    if (hash && (hash.includes('access_token=') || hash.includes('id_token='))) {
      const hashParams = new URLSearchParams(hash.substring(1));
      tokenToVerify = hashParams.get('id_token') || hashParams.get('access_token');
      stateFromHash = hashParams.get('state');
    }

    // Handle Google Authorization Code or Implicit Token Callback
    if (codeParam || tokenToVerify) {
      // Transition: IDLE → CALLBACK_RECEIVED → TOKEN_EXCHANGE
      setPhase({ kind: 'CALLBACK_RECEIVED' });

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
          if (data.success) {
            // Transition: TOKEN_EXCHANGE → SESSION_CREATED → AUTHENTICATED
            setPhase({ kind: 'SESSION_CREATED', traceId: data.traceId });

            const storedReturn = sessionStorage.getItem('ds_oauth_return_to');
            if (storedReturn) sessionStorage.removeItem('ds_oauth_return_to');

            const stateParam = urlParams.get('state') || stateFromHash;
            let stateData: any = null;
            try {
              if (stateParam) stateData = JSON.parse(stateParam);
            } catch (e) {}

            const isPopup = window.opener != null;
            const targetPath = storedReturn || stateData?.returnTo || fromPath || '/dashboard';

            if (isPopup) {
              window.opener.postMessage({ type: 'OAUTH_COMPLETE', success: true }, window.location.origin);
              window.close();
            } else {
              // Brief delay so the SESSION_CREATED banner is visible before redirect
              setTimeout(() => {
                setPhase({ kind: 'AUTHENTICATED' });
                window.location.href = targetPath;
              }, 400);
            }
          } else {
            // Transition: TOKEN_EXCHANGE → ERROR (terminal — no loading indicator)
            setPhase({
              kind: 'ERROR',
              message: data.error || 'Google Sign-In failed. Please try again.',
              traceId: data.traceId,
            });
          }
        })
        .catch((err) => {
          setPhase({
            kind: 'ERROR',
            message: 'Network error completing Google authentication.',
          });
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
      setPhase({ kind: 'ERROR', message: 'Please enter a valid phone number with at least 10 digits.' });
      return;
    }

    setPhase({ kind: 'OTP_SENDING' });

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/[^\d]/g, '')}`;

    try {
      // Try Firebase Real SMS Phone Auth
      const appVerifier = setupRecaptcha();
      if (appVerifier) {
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setPhase({ kind: 'OTP_SENT', message: `OTP sent successfully to ${formattedPhone}. Valid for 5 minutes.` });
        setStep('OTP');
        setCooldown(44);
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
        setPhase({ kind: 'ERROR', message: 'Firebase Error: Unauthorized Domain. Please add the domain to Firebase Authorized Domains.' });
        return;
      } else if (err?.code === 'auth/quota-exceeded') {
        setPhase({ kind: 'ERROR', message: 'Firebase Error: Daily SMS quota exceeded.' });
        return;
      } else if (err?.code === 'auth/invalid-phone-number') {
        setPhase({ kind: 'ERROR', message: 'Firebase Error: Invalid phone number format.' });
        return;
      }
    }

    // Fallback Server Action Send OTP
    const res = await sendOtpAction(phone);

    if (!res.success) {
      setPhase({ kind: 'ERROR', message: res.error || 'Failed to send OTP.' });
      return;
    }

    setPhase({ kind: 'OTP_SENT', message: res.message || 'OTP sent successfully to your mobile number.' });
    setStep('OTP');
    setCooldown(44);
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setPhase({ kind: 'ERROR', message: 'Please enter the 6-digit OTP code sent to your phone.' });
      return;
    }

    setPhase({ kind: 'OTP_VERIFYING' });

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/[^\d]/g, '')}`;

    // 1. Try Firebase Client Verification (Strict - NO bypass)
    if (confirmationResult) {
      try {
        await confirmationResult.confirm(otp);
        const res = await loginWithVerifiedPhoneAction(formattedPhone);

        if (res.success) {
          setPhase({ kind: 'OTP_SUCCESS', message: 'Phone Authentication successful! Redirecting...' });
          setTimeout(() => {
            window.location.href = fromPath;
          }, 800);
          return;
        } else {
          setPhase({ kind: 'ERROR', message: res.error || 'Authentication failed.' });
          return;
        }
      } catch (firebaseErr: any) {
        console.error('Firebase OTP Verification Error:', firebaseErr);
        setPhase({ kind: 'ERROR', message: 'Invalid OTP code. Please check the 6-digit code sent to your phone and try again.' });
        return;
      }
    }

    // 2. Server Action OTP verification
    const res = await verifyOtpAction(formattedPhone, otp);

    if (!res.success) {
      setPhase({ kind: 'ERROR', message: res.error || 'Verification failed. Invalid OTP code.' });
      return;
    }

    setPhase({ kind: 'OTP_SUCCESS', message: 'Verification successful! Redirecting to student portal...' });
    setTimeout(() => {
      window.location.href = fromPath;
    }, 800);
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-hover relative">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-blue-50 border border-blue-300 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/10">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 font-heading">DriveSuccess Academy</h1>
        <p className="text-xs text-slate-400 mt-1">Vahathi Motor Driving School Student Portal</p>
      </div>

      {/* Single-source-of-truth feedback panel.
          Exactly ONE of: error, success message, or loading indicator
          can be visible at any time — enforced by the AuthPhase state machine. */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-300 text-rose-400 rounded-2xl text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && !isLoading && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-400 rounded-2xl text-xs flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-600 rounded-2xl text-xs flex items-center gap-3">
          <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
          <span>{loadingLabel || 'Processing...'}</span>
        </div>
      )}

      {/* Step 1: Phone Number Form */}
      {step === 'PHONE' ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Mobile Phone Number
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 pl-11 pr-4 py-3.5 rounded-xl outline-none text-sm font-medium transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-slate-950 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-blue-600/15 transition disabled:opacity-50"
          >
            {isLoading ? (
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
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Enter 6-Digit OTP
              </label>
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-[11px] text-blue-600 hover:underline"
              >
                Change Number
              </button>
            </div>

            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 text-center tracking-[0.5em] font-mono text-xl font-extrabold py-3.5 pl-10 pr-4 rounded-xl outline-none transition placeholder:tracking-widest placeholder:text-slate-600"
                required
              />
            </div>

            <div className="flex justify-between items-center mt-3 text-xs text-slate-400">
              <span>Expires in 5 minutes</span>
              {cooldown > 0 ? (
                <span className="text-slate-400">Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Resend SMS
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-slate-950 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-blue-600/15 transition disabled:opacity-50"
          >
            {isLoading ? (
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
        <div className="h-[1px] bg-slate-100 flex-1" />
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          OR
        </span>
        <div className="h-[1px] bg-slate-100 flex-1" />
      </div>

      {/* Google Identity Sign-In & One Tap */}
      <GoogleSignInButton />
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleAuthProvider>
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center p-4">
        <Suspense fallback={<div className="text-slate-400 text-sm">Loading authentication...</div>}>
          <LoginFormContent />
        </Suspense>
      </div>
    </GoogleAuthProvider>
  );
}
