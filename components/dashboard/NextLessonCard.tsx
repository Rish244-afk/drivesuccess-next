'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  Car,
  MapPin,
  Sparkles,
  ArrowRight,
  Navigation,
  RefreshCw,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { AvatarGenerator } from './AvatarGenerator';

interface NextLessonCardProps {
  session?: {
    id: string;
    scheduledAt: string | Date;
    durationMins?: number;
    location?: string;
    status: string;
    instructor?: {
      name: string;
      avatarUrl?: string | null;
      rating?: number;
      phone?: string;
    } | null;
    vehicle?: {
      name: string;
      plateNumber?: string;
      transmission?: string;
      imageUrl?: string | null;
    } | null;
  } | null;
}

export function NextLessonCard({ session }: NextLessonCardProps) {
  const router = useRouter();

  const handleBookNewSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('wizard_state');
    }
    router.push('/book?reset=1');
  };

  if (!session) {
    return (
      <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white border border-blue-100 rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center space-y-5">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100/50 rounded-full blur-2xl pointer-events-none" />
        
        <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 text-3xl">
          🚗
        </div>

        <div className="max-w-md space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Next Session Spotlight
          </span>
          <h3 className="font-serif text-2xl text-slate-900 font-medium">
            You don&apos;t have an upcoming lesson
          </h3>
          <p className="text-xs text-slate-500 font-light leading-relaxed">
            Ready to continue your driving journey? Choose your preferred date, instructor, and training vehicle to lock in your next slot.
          </p>
        </div>

        <button
          onClick={handleBookNewSession}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest px-7 py-3.5 rounded-full flex items-center gap-2 shadow-lg shadow-blue-600/15 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <span>Reserve Session</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const sessionDate = new Date(session.scheduledAt);
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/60 rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden space-y-6">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            <Sparkles className="w-3 h-3" />
            Upcoming Session Spotlight
          </span>
          <h3 className="font-serif text-2xl font-normal text-white mt-2">
            {formattedDate}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {session.status}
          </span>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Time & Location */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Time & Slot</span>
          </div>
          <div>
            <p className="text-xl font-medium text-white">{formattedTime}</p>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Duration: {session.durationMins || 60} Minutes
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/40 flex items-center gap-2 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="truncate">{session.location || 'Main Training Track, Gate A'}</span>
          </div>
        </div>

        {/* Instructor Info */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Instructor</span>
            </span>
            {session.instructor?.rating && (
              <span className="flex items-center gap-1 text-amber-300 text-xs font-normal">
                <Star className="w-3 h-3 fill-amber-300" />
                {session.instructor.rating}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <AvatarGenerator
              name={session.instructor?.name || 'Senior Instructor'}
              avatarUrl={session.instructor?.avatarUrl}
              size={48}
              showOnlineStatus={false}
            />
            <div>
              <p className="text-sm font-semibold text-white">
                {session.instructor?.name || 'Senior Academy Instructor'}
              </p>
              <p className="text-xs text-slate-400 font-light">Certified RTO Instructor</p>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Car className="w-4 h-4" />
            <span>Training Vehicle</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {session.vehicle?.name || 'Dual-Control Hatchback'}
            </p>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Plate: {session.vehicle?.plateNumber || 'KA-01-DS-2024'} • {session.vehicle?.transmission || 'MANUAL'}
            </p>
          </div>
          <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Dual-Control Safety Equipped
          </span>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-700/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => alert(`Session details:\nDate: ${formattedDate}\nTime: ${formattedTime}\nInstructor: ${session.instructor?.name || 'Assigned Instructor'}`)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition cursor-pointer"
          >
            View Details
          </button>
          <button
            onClick={handleBookNewSession}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reschedule</span>
          </button>
        </div>

        <span
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-700/40 opacity-70 cursor-not-allowed"
          title="Track navigation coming soon"
        >
          <Navigation className="w-3.5 h-3.5 text-slate-500" />
          <span>Get Directions (Soon)</span>
        </span>
      </div>
    </div>
  );
}
