'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { GoogleAuthProvider } from '@/components/auth/GoogleAuthProvider';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { sendOtpAction, verifyOtpAction, loginWithVerifiedPhoneAction } from '@/actions/auth';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase';
import { ShieldCheck, Phone, KeyRound, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectToDashboard?: boolean;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  redirectToDashboard = true,
}: AuthModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const setupRecaptcha = () => {
    if (typeof window === 'undefined') return null;
    if ((window as any).authModalRecaptchaVerifier) {
      return (window as any).authModalRecaptchaVerifier;
    }
    const verifier = new RecaptchaVerifier(auth, 'auth-modal-recaptcha-container', {
      size: 'invisible',
      callback: () => {},
    });
    (window as any).authModalRecaptchaVerifier = verifier;
    return verifier;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const cleanDigits = phone.replace(/[^\d]/g, '');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${cleanDigits}`;
    const maskedPhone = cleanDigits.length >= 10
      ? `+91 ******${cleanDigits.slice(-4)}`
      : formattedPhone;

    try {
      // CAPTCHA-protected Firebase Phone SMS Auth
      const appVerifier = setupRecaptcha();
      if (appVerifier) {
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setMessage(`We've sent a 6-digit verification code to ${maskedPhone}.`);
        setStep('OTP');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('Firebase SMS Auth fallback triggered:', err);
    }

    // Fallback Server OTP Action
    const res = await sendOtpAction(phone);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to send verification code.');
      return;
    }

    setMessage(res.message || `We've sent a 6-digit verification code to ${maskedPhone}.`);
    setStep('OTP');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/[^\d]/g, '')}`;

    if (confirmationResult) {
      try {
        await confirmationResult.confirm(otp);
        const loginRes = await loginWithVerifiedPhoneAction(formattedPhone);
        if (loginRes.success) {
          setMessage('Phone authenticated successfully!');
          setLoading(false);
          if (onSuccess) onSuccess();
          onClose();
          if (redirectToDashboard) {
            router.push('/dashboard');
            router.refresh();
          }
          return;
        }
      } catch (err) {
        console.warn('Firebase verification failed, trying server verification...');
      }
    }

    const res = await verifyOtpAction(formattedPhone, otp);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Verification code failed.');
      return;
    }

    setMessage('Phone authenticated successfully!');
    if (onSuccess) onSuccess();
    onClose();
    if (redirectToDashboard) {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-blue-600">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span className="font-heading font-extrabold uppercase tracking-wider text-xs">
            Student Portal Sign In
          </span>
        </div>
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-5 font-sans">
        <div className="text-center space-y-1">
          <h3 className="font-heading font-extrabold text-xl text-slate-900">
            Access Your Student Portal
          </h3>
          <p className="text-xs text-slate-500 font-light">
            Log in securely using Mobile Phone OTP or Google Account.
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {/* Invisible reCAPTCHA container */}
        <div id="auth-modal-recaptcha-container"></div>

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mobile Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 pl-10 pr-4 py-3 rounded-xl outline-none text-xs font-medium transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-blue-600/15 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Enter 6-Digit Verification Code *
                </label>
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  Change Phone
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 tracking-widest text-center text-base font-bold pl-10 pr-4 py-3 rounded-xl outline-none transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-blue-600/15 transition disabled:opacity-50 cursor-pointer"
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
        <div className="flex items-center gap-4 my-2">
          <div className="h-[1px] bg-slate-200 flex-1" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            OR
          </span>
          <div className="h-[1px] bg-slate-200 flex-1" />
        </div>

        {/* Google OAuth Button */}
        <GoogleAuthProvider>
          <GoogleSignInButton />
        </GoogleAuthProvider>
      </div>
    </Modal>
  );
}
