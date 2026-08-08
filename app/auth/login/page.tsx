'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Phone, KeyRound, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendOtpAction, verifyOtpAction, verifyFirebaseIdTokenAction } from '@/actions/auth';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase';
import { GoogleAuthProvider } from '@/components/auth/GoogleAuthProvider';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

type AuthPhase =
  | { kind: 'IDLE' }
  | { kind: 'GOOGLE_REDIRECT' }
  | { kind: 'CALLBACK_RECEIVED' }
  | { kind: 'TOKEN_EXCHANGE'; traceId?: string }
  | { kind: 'IDENTITY_RESOLUTION'; traceId?: string }
  | { kind: 'SESSION_CREATED'; traceId?: string }
  | { kind: 'AUTHENTICATED' }
  | { kind: 'ERROR'; message: string; traceId?: string }
  | { kind: 'OTP_SENDING' }
  | { kind: 'OTP_SENT'; message: string }
  | { kind: 'OTP_VERIFYING' }
  | { kind: 'OTP_SUCCESS'; message: string };

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

    if (codeParam || tokenToVerify) {
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
            setPhase({ kind: 'SESSION_CREATED' });
            setTimeout(() => {
              window.location.href = fromPath;
            }, 500);
          } else {
            setPhase({
              kind: 'ERROR',
              message: data.error || 'Google login failed.',
            });
          }
        })
        .catch(() => {
          setPhase({
            kind: 'ERROR',
            message: 'Network error during Google authentication. Please try again.',
          });
        });
    }
  }, [fromPath]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const setupRecaptcha = () => {
    if (typeof window === 'undefined') return null;
    if ((window as any).recaptchaVerifier) {
      return (window as any).recaptchaVerifier;
    }
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setPhase({ kind: 'ERROR', message: 'Please enter a valid 10-digit mobile phone number.' });
      return;
    }

    setPhase({ kind: 'OTP_SENDING' });

    const cleanPhone = phone.replace(/[^\d]/g, '');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${cleanPhone}`;

    try {
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
      console.error('Firebase Phone Auth Error:', err);
    }

    const res = await sendOtpAction(phone);

    if (!res.success) {
      setPhase({ kind: 'ERROR', message: res.error || 'Failed to send OTP.' });
      return;
    }

    setPhase({ kind: 'OTP_SENT', message: res.message || 'OTP sent successfully to your mobile number.' });
    setStep('OTP');
    setCooldown(44);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setPhase({ kind: 'ERROR', message: 'Please enter the 6-digit OTP code sent to your phone.' });
      return;
    }

    setPhase({ kind: 'OTP_VERIFYING' });

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/[^\d]/g, '')}`;

    if (confirmationResult) {
      try {
        const userCredential = await confirmationResult.confirm(otp);
        const firebaseIdToken = await userCredential.user.getIdToken();
        const res = await verifyFirebaseIdTokenAction(firebaseIdToken);

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
        setPhase({ kind: 'ERROR', message: 'Invalid OTP code. Please check the 6-digit code sent to your phone.' });
        return;
      }
    }

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
    <div className="w-full max-w-md bg-[#E7E1D6] border border-[#384633]/20 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative font-sans text-[#384633]">
      <div id="recaptcha-container"></div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-white border border-[#384633]/20 text-[#384633] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-[#384633]" />
        </div>
        <h1 className="text-2xl font-serif font-normal text-[#384633]">DriveSuccess Academy</h1>
        <p className="text-xs text-[#7E8466] mt-1 font-light">Vahathi Motor Driving School Student Portal</p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && !isLoading && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {isLoading && (
        <div className="mb-6 p-4 bg-white/80 border border-[#384633]/20 text-[#384633] rounded-2xl text-xs flex items-center gap-3">
          <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-[#384633]" />
          <span>{loadingLabel || 'Processing...'}</span>
        </div>
      )}

      {step === 'PHONE' ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#384633] uppercase tracking-wider mb-2">
              Mobile Phone Number
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-3.5 top-3.5 text-[#7E8466]" />
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-[#384633]/20 focus:border-[#384633] text-[#384633] pl-11 pr-4 py-3.5 rounded-2xl outline-none text-sm font-medium transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#384633] hover:bg-[#2B3B2B] text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md transition disabled:opacity-50 cursor-pointer"
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
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-[#384633] uppercase tracking-wider">
                Enter 6-Digit OTP
              </label>
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-[11px] text-[#384633] font-semibold underline hover:text-[#2B3B2B]"
              >
                Change Number
              </button>
            </div>

            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-3.5 top-3.5 text-[#7E8466]" />
              <input
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
                className="w-full bg-white border border-[#384633]/20 focus:border-[#384633] text-[#384633] text-center tracking-[0.5em] font-mono text-xl font-extrabold py-3.5 pl-10 pr-4 rounded-2xl outline-none transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#384633] hover:bg-[#2B3B2B] text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Verify & Access Student Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="flex items-center gap-4 my-6">
        <div className="h-[1px] bg-[#384633]/15 flex-1" />
        <span className="text-[10px] font-bold text-[#7E8466] uppercase tracking-widest">
          OR
        </span>
        <div className="h-[1px] bg-[#384633]/15 flex-1" />
      </div>

      <GoogleAuthProvider>
        <GoogleSignInButton returnTo={fromPath} />
      </GoogleAuthProvider>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F4F0E8] flex items-center justify-center p-4 py-16">
      <Suspense fallback={<div className="text-xs text-[#7E8466]">Loading portal...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
