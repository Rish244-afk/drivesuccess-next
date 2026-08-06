'use client';

import React from 'react';
import {
  Award,
  CheckCircle2,
  Calendar,
  UserCheck,
  Car,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AvatarGenerator } from './AvatarGenerator';

interface ProgressOverviewProps {
  completedSessions: number;
  totalSessions: number;
  progressPercentage: number;
  instructor?: {
    name: string;
    avatarUrl?: string | null;
    rating?: number;
    experienceYears?: number;
  } | null;
  vehicle?: {
    name: string;
    plateNumber?: string;
    transmission?: string;
  } | null;
}

export function ProgressOverview({
  completedSessions,
  totalSessions,
  progressPercentage,
  instructor,
  vehicle,
}: ProgressOverviewProps) {
  const remainingSessions = Math.max(0, totalSessions - completedSessions);

  // Estimate completion date (assuming ~2 sessions per week)
  const weeksRemaining = Math.ceil(remainingSessions / 2);
  const estDate = new Date();
  estDate.setDate(estDate.getDate() + weeksRemaining * 7);
  const formattedEstDate = remainingSessions > 0
    ? estDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Curriculum Completed!';

  // Dynamic confidence score calculation based on progress
  const confidenceLevel = Math.min(100, Math.max(15, Math.round(progressPercentage * 0.9 + 10)));
  const rtoReadiness = Math.min(100, Math.max(20, Math.round(progressPercentage * 0.85 + 15)));

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm space-y-8">
      {/* Header & Main Progress Count */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 flex items-center gap-1.5 mb-1">
            <Award className="w-4 h-4 text-blue-600" />
            Curriculum Progress & RTO Readiness
          </span>
          <h2 className="font-serif text-3xl text-slate-900 font-normal">
            Practical Driving Hours
          </h2>
        </div>

        <div className="text-left md:text-right">
          <span className="font-serif text-4xl text-slate-900 font-normal">
            <em className="italic text-blue-600 font-normal">{completedSessions}</em>
            <span className="text-slate-400 font-light text-2xl"> / {totalSessions}</span>
          </span>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            Sessions Completed ({progressPercentage}%)
          </p>
        </div>
      </div>

      {/* Main Animated Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-medium text-slate-700">
          <span>Practical Driving Mastery</span>
          <span className="font-mono font-bold text-blue-600">{progressPercentage}%</span>
        </div>
        <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Key Metric Highlights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {/* Remaining Lessons */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Remaining Lessons
          </span>
          <p className="font-serif text-2xl text-slate-900 font-medium">
            {remainingSessions} <span className="text-xs font-sans text-slate-400 font-normal">sessions</span>
          </p>
        </div>

        {/* Estimated Completion */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Est. Completion
          </span>
          <p className="font-serif text-lg text-slate-900 font-medium truncate">
            {formattedEstDate}
          </p>
        </div>

        {/* Driving Confidence Bar */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-1.5">
          <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <span>Confidence</span>
            <span className="text-blue-600">{confidenceLevel}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${confidenceLevel}%` }}
            />
          </div>
        </div>

        {/* RTO Exam Readiness */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-1.5">
          <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <span>RTO Readiness</span>
            <span className="text-emerald-600">{rtoReadiness}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${rtoReadiness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Instructor & Vehicle Footer Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-3">
          <AvatarGenerator
            name={instructor?.name || 'Senior Instructor'}
            avatarUrl={instructor?.avatarUrl}
            size={36}
            showOnlineStatus={false}
          />
          <div>
            <span className="text-slate-400 font-light block">Primary Instructor</span>
            <span className="font-medium text-slate-800">
              {instructor?.name || 'Academy Senior Instructor'} {instructor?.experienceYears ? `(${instructor.experienceYears} yrs exp)` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/60 text-slate-600">
          <Car className="w-4 h-4 text-blue-600" />
          <span>Vehicle: <strong>{vehicle?.name || 'Fleet Compact'}</strong> ({vehicle?.transmission || 'MANUAL'})</span>
        </div>
      </div>
    </div>
  );
}
