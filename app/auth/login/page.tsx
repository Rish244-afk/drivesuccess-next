'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Phone, KeyRound, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { sendOtpAction, verifyOtpAction, loginWithVerifiedPhoneAction } from '@/actions/auth';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase';

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
        setMessage(`Real SMS OTP dispatched to ${formattedPhone}! (Demo fallback OTP: 123456)`);
        setStep('OTP');
        setCooldown(44);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('Firebase SMS Dispatch notice, using backend server OTP:', err);
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

    // 1. Try Firebase Client Verification
    if (confirmationResult && otp !== '123456') {
      try {
        await confirmationResult.confirm(otp);
        const res = await loginWithVerifiedPhoneAction(phone);
        setLoading(false);

        if (res.success) {
          setMessage('Firebase Phone Authentication successful! Redirecting...');
          setTimeout(() => router.push(fromPath), 800);
          return;
        }
      } catch (firebaseErr) {
        console.warn('Firebase verification notice, checking server action fallback...');
      }
    }

    // 2. Fallback Server Action OTP verification (including 123456 test OTP)
    const res = await verifyOtpAction(phone, otp);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Verification failed. Try demo OTP 123456.');
      return;
    }

    setMessage('Verification successful! Redirecting to student portal...');
    setTimeout(() => {
      router.push(fromPath);
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
        <p className="text-xs text-slate-400 mt-1">Real SMS Phone Authentication & Student Portal</p>
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
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      {/* Demo Test Notice */}
      <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-400 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <span>For instant test login without waiting for SMS, use Demo OTP: <strong className="font-mono text-xs">123456</strong></span>
      </div>

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
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 pl-11 pr-4 py-3.5 rounded-xl outline-none text-sm font-medium transition"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Supports real SMS OTP delivery via Firebase Auth + instant test login.
            </p>
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
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 text-center tracking-[0.5em] font-mono text-lg font-bold py-3.5 rounded-xl outline-none transition"
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
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading authentication...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
