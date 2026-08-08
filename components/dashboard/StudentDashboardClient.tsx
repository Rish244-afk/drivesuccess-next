'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  Settings,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  GraduationCap,
} from 'lucide-react';
import { AvatarGenerator } from './AvatarGenerator';

interface StudentDashboardClientProps {
  student: any;
  bookings: any[];
  sessions: any[];
  metrics: {
    completedSessions: number;
    totalSessions: number;
    progressPercentage: number;
  };
}

export function StudentDashboardClient({
  student,
  bookings,
  sessions,
  metrics,
}: StudentDashboardClientProps) {
  const upcomingSession = sessions.find(
    (s) => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS'
  ) || sessions[0] || null;

  const currentPackageName = bookings[0]?.package?.name || 'Urban Mastery Package';

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#2B3B2B] font-sans flex flex-col md:flex-row">
      
      {/* LEFT SIDEBAR (Screenshot 3) */}
      <aside className="w-full md:w-64 bg-[#F4F0E8] border-r border-[#2B3B2B]/10 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/" className="block py-2">
            <span className="font-serif text-2xl font-normal text-[#2B3B2B] tracking-tight">
              DriveSuccess
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-full bg-[#EAE5DB] text-[#2B3B2B] font-semibold text-xs transition">
              <LayoutDashboard className="w-4 h-4 text-[#2B3B2B]" />
              <span>Command Center</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-[#5C6B5C] hover:text-[#2B3B2B] hover:bg-[#EAE5DB]/50 font-medium text-xs transition">
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-[#5C6B5C] hover:text-[#2B3B2B] hover:bg-[#EAE5DB]/50 font-medium text-xs transition">
              <GraduationCap className="w-4 h-4" />
              <span>Curriculum</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-[#5C6B5C] hover:text-[#2B3B2B] hover:bg-[#EAE5DB]/50 font-medium text-xs transition">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Bottom Settings Link */}
        <div className="pt-6 border-t border-[#2B3B2B]/10">
          <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-[#5C6B5C] hover:text-[#2B3B2B] font-medium text-xs transition">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* MAIN COMMAND CENTER VIEW (Screenshot 3) */}
      <main className="flex-1 p-6 sm:p-10 space-y-8 max-w-6xl">
        
        {/* Header */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#5C6B5C]">
            STUDENT DASHBOARD
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#2B3B2B]">
            Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B5C] font-light max-w-2xl leading-relaxed">
            Welcome back, {student.name}. Your journey to mastery is progressing smoothly. Here is your current status and upcoming milestones.
          </p>
        </div>

        {/* Top Urban Mastery Package Progress Card */}
        <div className="rounded-3xl p-6 sm:p-8 bg-[#EFECE6] border border-[#2B3B2B]/10 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-serif text-lg text-[#2B3B2B] font-medium">
              {currentPackageName}
            </h3>
            <p className="text-xs text-[#5C6B5C] font-light mt-1">
              Session {metrics.completedSessions} of {metrics.totalSessions} completed
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/80 px-6 py-3 rounded-full border border-[#2B3B2B]/10 shadow-xs w-full sm:w-auto">
            <span className="font-serif text-lg font-bold text-[#2B3B2B]">
              {metrics.progressPercentage}%
            </span>
            <div className="w-32 h-2.5 bg-[#EAE5DB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2B3B2B] rounded-full"
                style={{ width: `${metrics.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3-Column Focus Grid (Screenshot 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: NEXT UP Session */}
          <div className="rounded-3xl p-6 bg-white border border-[#2B3B2B]/10 space-y-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-full bg-[#2B3B2B]/10 text-[#2B3B2B]">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-[#D8E2D8] text-[#2B3B2B]">
                  NEXT UP
                </span>
              </div>

              <div>
                <h4 className="font-serif text-xl text-[#2B3B2B] font-medium">
                  {upcomingSession ? upcomingSession.topic || 'Highway Dynamics' : 'Highway Dynamics'}
                </h4>
                <p className="text-xs text-[#5C6B5C] font-light leading-relaxed mt-2">
                  Focusing on merging, high-speed spatial awareness, and calm decision making under pressure.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#2B3B2B]/10 flex items-center gap-2 text-xs font-semibold text-[#2B3B2B]">
              <Clock className="w-4 h-4 text-[#5C6B5C]" />
              <span>Tomorrow, 10:00 AM</span>
            </div>
          </div>

          {/* Card 2: Your Instructor */}
          <div className="relative rounded-3xl overflow-hidden h-[320px] border border-[#2B3B2B]/10 shadow-xs group">
            <Image
              src="/images/creta.jpg"
              alt="Instructor Cabin"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E2B1E]/90 via-[#1E2B1E]/30 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-[#2B3B2B]/10 flex items-center gap-3">
              <AvatarGenerator
                name={upcomingSession?.instructor?.name || 'Rajesh Kumar'}
                avatarUrl={upcomingSession?.instructor?.avatarUrl}
                size={40}
                className="shrink-0 ring-2 ring-[#2B3B2B]"
              />
              <div>
                <span className="text-[10px] text-[#5C6B5C] font-semibold uppercase tracking-wider block">Your Instructor</span>
                <span className="font-serif text-sm font-medium text-[#2B3B2B]">
                  {upcomingSession?.instructor?.name || 'Rajesh Kumar'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Skill Matrix */}
          <div className="rounded-3xl p-6 bg-[#EFECE6] border border-[#2B3B2B]/10 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-lg font-medium text-[#2B3B2B]">Skill Matrix</h4>
              <Sparkles className="w-4 h-4 text-[#2B3B2B]" />
            </div>

            <div className="space-y-4">
              {/* Item 1 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#2B3B2B]">Vehicle Control</span>
                  <span className="text-[#5C6B5C] font-light">Proficient</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-2">
                  <div className="bg-[#2B3B2B] rounded-full" />
                  <div className="bg-[#2B3B2B] rounded-full" />
                  <div className="bg-[#2B3B2B] rounded-full" />
                  <div className="bg-[#DCD7CE] rounded-full" />
                </div>
              </div>

              {/* Item 2 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#2B3B2B]">Spatial Awareness</span>
                  <span className="text-[#5C6B5C] font-light">Developing</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-2">
                  <div className="bg-[#2B3B2B] rounded-full" />
                  <div className="bg-[#2B3B2B] rounded-full" />
                  <div className="bg-[#DCD7CE] rounded-full" />
                  <div className="bg-[#DCD7CE] rounded-full" />
                </div>
              </div>

              {/* Item 3 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#2B3B2B]">Parallel Parking</span>
                  <span className="text-[#5C6B5C] font-light">Novice</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-2">
                  <div className="bg-[#2B3B2B] rounded-full" />
                  <div className="bg-[#DCD7CE] rounded-full" />
                  <div className="bg-[#DCD7CE] rounded-full" />
                  <div className="bg-[#DCD7CE] rounded-full" />
                </div>
              </div>

              {/* Item 4 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#2B3B2B]">Night Driving</span>
                  <span className="text-[#5C6B5C] font-light">Pending</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-2">
                  <div className="bg-[#DCD7CE] rounded-full" />
                  <div className="bg-[#DCD7CE] rounded-full" />
                  <div className="bg-[#DCD7CE] rounded-full" />
                  <div className="bg-[#DCD7CE] rounded-full" />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button className="w-full bg-[#2B3B2B] hover:bg-[#1E2B1E] text-white font-medium text-xs py-3 rounded-full inline-flex items-center justify-center gap-2 transition-all cursor-pointer">
                <span>Review Evaluation Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
