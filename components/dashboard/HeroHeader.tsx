'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  Settings,
  LogOut,
  ShieldCheck,
  Award,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { AvatarGenerator } from './AvatarGenerator';

interface HeroHeaderProps {
  student: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    createdAt?: Date | string;
  };
  currentPackageName?: string;
  progressPercentage: number;
}

export function HeroHeader({
  student,
  currentPackageName = '4-Wheeler License Package',
  progressPercentage,
}: HeroHeaderProps) {
  const router = useRouter();

  const handleBookNewSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('wizard_state');
    }
    router.push('/book?reset=1');
  };

  const formattedDate = student.createdAt
    ? new Date(student.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Active Member';

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-700/50">
      {/* Subtle Background Radial Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left: Profile Info & Identity */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <AvatarGenerator
            name={student.name}
            avatarUrl={student.avatarUrl}
            size={90}
            showOnlineStatus={true}
            className="flex-shrink-0 shadow-2xl ring-4 ring-white/10"
          />

          <div className="space-y-3">
            {/* Top Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Student Learning Portal
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Verified Learner
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Award className="w-3 h-3" />
                {progressPercentage}% Completed
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-white">
                Welcome back, <span className="italic font-normal text-blue-400">{student.name}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-light mt-1 max-w-xl">
                Track your practical driving milestones, review instructor feedback, and prepare for your RTO licensing exam.
              </p>
            </div>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400 pt-1 font-mono">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                ID: <span className="text-slate-200">#{student.id.slice(-6).toUpperCase()}</span>
              </span>
              {student.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-300">{student.email}</span>
                </span>
              )}
              {student.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-300">{student.phone}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Enrolled: <span className="text-slate-300">{formattedDate}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Primary CTAs & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:flex-col lg:items-end">
          <button
            onClick={handleBookNewSession}
            className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-widest px-7 py-3.5 rounded-2xl shadow-xl shadow-blue-600/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Reserve Session</span>
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition hover:text-white cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings</span>
            </Link>

            <form action={logoutAction} className="flex-1 sm:flex-initial">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-slate-800/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700/50 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
