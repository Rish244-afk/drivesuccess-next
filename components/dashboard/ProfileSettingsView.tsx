'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Bell,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Camera,
} from 'lucide-react';
import { updateStudentProfileAction, deleteStudentAccountAction } from '@/actions/profile';
import { logoutAction } from '@/actions/auth';
import { AvatarGenerator } from './AvatarGenerator';

interface ProfileSettingsViewProps {
  student: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    licenseNo?: string | null;
    avatarUrl?: string | null;
  };
}

export function ProfileSettingsView({ student }: ProfileSettingsViewProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: student.name || '',
    phone: student.phone || '',
    address: student.address || '',
    city: student.city || 'New York',
    state: student.state || 'NY',
    zipCode: student.zipCode || '',
    licenseNo: student.licenseNo || '',
    avatarUrl: student.avatarUrl || '',
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const res = await updateStudentProfileAction(formData);
    setSaving(false);

    if (res.success) {
      setSuccessMessage('Profile information saved successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(res.error || 'Failed to save profile changes.');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const res = await deleteStudentAccountAction();
    if (res.success) {
      router.push('/');
    } else {
      setDeleting(false);
      alert(res.error || 'Failed to delete account.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-10 pb-24 sm:pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Account Management
            </span>
            <h1 className="font-serif text-3xl text-slate-900 font-normal">
              Profile & Preferences
            </h1>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Identity & Avatar */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="font-serif text-xl text-slate-900 font-normal border-b border-slate-100 pb-4">
            Personal Identity & Avatar
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <AvatarGenerator
              name={formData.name}
              avatarUrl={formData.avatarUrl}
              size={90}
              showOnlineStatus={true}
            />

            <div className="space-y-2 flex-1 w-full">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 font-light">
                Leave empty to automatically generate dynamic initials badge with gradients.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Address & RTO License Data */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="font-serif text-xl text-slate-900 font-normal border-b border-slate-100 pb-4">
            Address & Learner Permit
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Residential Street Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street, Suite 4B"
                className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  ZIP / Postal Code
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Learner License Number (RTO)
              </label>
              <input
                type="text"
                value={formData.licenseNo}
                onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                placeholder="LLR-2024-XXXXXX"
                className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 sm:py-3.5 rounded-full flex items-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>

      {/* Section 3: Danger Zone & Privacy Erasure */}
      <div className="bg-red-50/50 border border-red-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-red-800 font-serif text-lg">
          <Trash2 className="w-5 h-5 text-red-600" />
          <h4>Privacy & Account Erasure (DPDP Act & GDPR)</h4>
        </div>
        <p className="text-xs text-slate-600 font-light leading-relaxed">
          In accordance with the Digital Personal Data Protection Act 2023 & GDPR Article 17, you may request permanent deletion of your account and personal data.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full sm:w-auto justify-center bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-4 sm:py-2.5 rounded-xl transition cursor-pointer"
          >
            Request Account Deletion
          </button>
        ) : (
          <div className="bg-white border border-red-300 p-5 rounded-2xl space-y-3">
            <p className="text-xs font-semibold text-red-900">
              Are you absolute sure? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="w-full sm:w-auto justify-center bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-4 sm:py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full sm:w-auto justify-center bg-slate-200 text-slate-700 font-medium text-xs uppercase tracking-wider px-4 py-4 sm:py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
