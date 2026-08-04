'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { adminLoginAction } from '@/actions/admin';
import { useRouter } from 'next/navigation';

export interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminAuthModal({ isOpen, onClose }: AdminAuthModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const res = await adminLoginAction(formData);

    if (!res.success) {
      setLoading(false);
      setError(res.error || 'Authentication failed.');
      return;
    }

    onClose();
    router.push('/admin');
    router.refresh();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-amber-400">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span className="font-heading font-extrabold uppercase tracking-wider text-xs">
            Admin Control Center
          </span>
        </div>
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-6 font-sans">
        <div className="text-center space-y-2">
          <h3 className="font-heading font-extrabold text-xl text-slate-100">
            Secure Admin Access
          </h3>
          <p className="text-xs text-slate-400">
            Administrative Credential Portal
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@drivesuccess.edu"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 pl-10 pr-4 py-3 rounded-xl outline-none text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 pl-10 pr-4 py-3 rounded-xl outline-none text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xl shadow-amber-500/20 transition disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Authenticate Admin Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
}
