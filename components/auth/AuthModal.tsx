'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { GoogleAuthProvider } from '@/components/auth/GoogleAuthProvider';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { ShieldCheck, Phone, KeyRound, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectToDashboard?: boolean;
  returnTo?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  redirectToDashboard = true,
  returnTo = '/dashboard',
}: AuthModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json().catch(() => null);
      setLoading(false);

      if (!res.ok || !data?.success) {
        setError(data?.error || 'Failed to send verification code. Please try again.');
        return;
      }

      setMessage(data.message || 'Verification code sent successfully. Valid for 5 minutes.');
      setStep('OTP');
    } catch (err) {
      setLoading(false);
      setError('Network error connecting to verification service. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otp.trim() }),
      });

      const data = await res.json().catch(() => null);
      setLoading(false);

      if (!res.ok || !data?.success) {
        setError(data?.error || 'Invalid or expired verification code. Please try again.');
        return;
      }

      if (onSuccess) onSuccess();
      if (redirectToDashboard) {
        router.push(returnTo);
      }
      onClose();
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError('Network error during verification. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="STUDENT PORTAL SIGN IN" maxWidth="max-w-md">
      <div className="space-y-6 pt-2 font-sans text-[#384633]">
        <div className="text-center space-y-1.5">
          <h3 className="font-serif text-2xl font-normal text-[#384633]">
            Access Your Student Portal
          </h3>
          <p className="text-xs text-[#7E8466] font-light">
            Log in securely using Mobile Phone OTP or Google Account.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#384633] uppercase tracking-wider mb-1.5">
                Mobile Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E8466]" />
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-[#384633]/20 focus:border-[#384633] text-[#384633] pl-10 pr-4 py-3 rounded-2xl outline-none text-xs font-medium transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#384633] hover:bg-[#2B3B2B] text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold text-[#384633] uppercase tracking-wider">
                  Enter 6-Digit Verification Code *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-[11px] text-[#384633] font-semibold underline hover:text-[#2B3B2B]"
                  >
                    Resend Code
                  </button>
                  <span className="text-[#7E8466]">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('PHONE');
                      setOtp('');
                    }}
                    className="text-[11px] text-[#384633] font-semibold underline hover:text-[#2B3B2B]"
                  >
                    Change Phone
                  </button>
                </div>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E8466]" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full bg-white border border-[#384633]/20 focus:border-[#384633] text-[#384633] tracking-widest text-center text-base font-bold pl-10 pr-4 py-3 rounded-2xl outline-none transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#384633] hover:bg-[#2B3B2B] text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Verify & Access Student Portal</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 my-2">
          <div className="h-[1px] bg-[#384633]/15 flex-1" />
          <span className="text-[10px] font-semibold text-[#7E8466] uppercase tracking-widest">
            OR
          </span>
          <div className="h-[1px] bg-[#384633]/15 flex-1" />
        </div>

        {/* Google OAuth Button */}
        <GoogleAuthProvider>
          <GoogleSignInButton
            returnTo={returnTo}
            onSuccess={() => {
              if (onSuccess) onSuccess();
              if (redirectToDashboard) {
                router.push(returnTo);
              }
              onClose();
              router.refresh();
            }}
          />
        </GoogleAuthProvider>
      </div>
    </Modal>
  );
}
