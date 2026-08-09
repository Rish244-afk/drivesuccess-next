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
  LogOut,
  X,
  AlertCircle,
  CheckCircle2,
  FileText,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import {
  cancelStudentBookingAction,
  rescheduleStudentSessionAction,
  getAvailableSlotsAction,
} from '@/actions/bookingSystem';
import { getFutureISTDateString, formatISTDateTime } from '@/lib/dateUtils';
import { AvatarGenerator } from './AvatarGenerator';
import { ProfileSettingsView } from './ProfileSettingsView';
import { InvoiceModal } from './InvoiceModal';
import { NotificationBell } from '@/components/NotificationBell';

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
  bookings = [],
  sessions = [],
  metrics = { completedSessions: 0, totalSessions: 10, progressPercentage: 0 },
}: StudentDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'command_center' | 'schedule' | 'curriculum' | 'profile'>('command_center');

  // Modal States
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<any | null>(null);

  // Cancellation Modal State
  const [cancellingBooking, setCancellingBooking] = useState<any | null>(null);
  const [cancellingLoading, setCancellingLoading] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Rescheduling Modal State
  const [reschedulingSession, setReschedulingSession] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(
    getFutureISTDateString(2)
  );
  const [rescheduleSlots, setRescheduleSlots] = useState<{ time: string; available: boolean; reason: string }[]>([]);
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState<string | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState<boolean>(false);
  const [rescheduleFetchingSlots, setRescheduleFetchingSlots] = useState<boolean>(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Fetch available slots dynamically when rescheduling date changes
  useEffect(() => {
    if (!reschedulingSession || !rescheduleDate) return;
    let isMounted = true;

    const fetchSlots = async () => {
      setRescheduleFetchingSlots(true);
      const res = await getAvailableSlotsAction({
        instructorId: reschedulingSession.instructorId,
        vehicleId: reschedulingSession.vehicleId,
        dateStr: rescheduleDate,
      });

      if (isMounted) {
        if (res.success && res.data) {
          setRescheduleSlots(res.data);
        } else {
          setRescheduleSlots([]);
        }
        setRescheduleFetchingSlots(false);
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [reschedulingSession, rescheduleDate]);

  // Logout Handler
  const handleLogout = async () => {
    await logoutAction();
    router.push('/auth/login');
    router.refresh();
  };

  // Confirm Cancellation Handler
  const handleConfirmCancellation = async () => {
    if (!cancellingBooking) return;
    setCancellingLoading(true);
    setCancelError(null);

    const res = await cancelStudentBookingAction(cancellingBooking.id);
    setCancellingLoading(false);

    if (res.success) {
      setCancellingBooking(null);
      router.refresh();
    } else {
      setCancelError(res.error || 'Failed to cancel booking.');
    }
  };

  // Confirm Reschedule Handler
  const handleConfirmReschedule = async () => {
    if (!reschedulingSession || !rescheduleDate || !rescheduleTimeSlot) return;
    setRescheduleLoading(true);
    setRescheduleError(null);

    const res = await rescheduleStudentSessionAction({
      sessionId: reschedulingSession.id,
      newDateStr: rescheduleDate,
      newTimeSlot: rescheduleTimeSlot,
    });
    setRescheduleLoading(false);

    if (res.success) {
      setReschedulingSession(null);
      router.refresh();
    } else {
      setRescheduleError(res.error || 'Failed to reschedule session.');
    }
  };

  const upcomingSession = sessions.find(
    (s) => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS'
  ) || sessions[0] || null;

  const currentPackageName = bookings[0]?.package?.name || 'Urban Mastery Package';

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#384633] font-sans flex flex-col md:flex-row">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-[#F4F0E8] border-r border-[#384633]/15 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/" className="block py-2">
            <span className="font-serif text-lg font-normal text-[#384633] tracking-tight leading-tight block">
              Vahathi Motor Driving School
            </span>
          </Link>

          {/* Navigation Links with Active State & Event Handlers */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('command_center')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs transition cursor-pointer ${
                activeTab === 'command_center'
                  ? 'bg-[#E7E1D6] text-[#384633] font-bold shadow-xs border border-[#384633]/10'
                  : 'text-[#7E8466] hover:text-[#384633] hover:bg-[#E7E1D6]/50 font-medium'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Command Center</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs transition cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-[#E7E1D6] text-[#384633] font-bold shadow-xs border border-[#384633]/10'
                  : 'text-[#7E8466] hover:text-[#384633] hover:bg-[#E7E1D6]/50 font-medium'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </button>

            <button
              onClick={() => setActiveTab('curriculum')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs transition cursor-pointer ${
                activeTab === 'curriculum'
                  ? 'bg-[#E7E1D6] text-[#384633] font-bold shadow-xs border border-[#384633]/10'
                  : 'text-[#7E8466] hover:text-[#384633] hover:bg-[#E7E1D6]/50 font-medium'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Curriculum</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs transition cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#E7E1D6] text-[#384633] font-bold shadow-xs border border-[#384633]/10'
                  : 'text-[#7E8466] hover:text-[#384633] hover:bg-[#E7E1D6]/50 font-medium'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Bottom Settings & Logout Controls */}
        <div className="pt-6 border-t border-[#384633]/15 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[#7E8466] hover:text-[#384633] font-medium text-xs transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-700 hover:text-rose-900 font-semibold text-xs transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEW CONTAINER */}
      <main className="flex-1 p-6 sm:p-10 space-y-8 max-w-6xl">
        {/* Top Header Bar with Notifications */}
        <div className="flex items-center justify-between gap-4 border-b border-[#384633]/10 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#7E8466]">
              STUDENT DASHBOARD
            </span>
            <h1 className="font-serif text-3xl font-normal text-[#384633]">
              {activeTab === 'command_center' && 'Command Center'}
              {activeTab === 'schedule' && 'Training Schedule'}
              {activeTab === 'curriculum' && 'Curriculum & Skill Matrix'}
              {activeTab === 'profile' && 'Profile & Settings'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />

            <div className="flex items-center gap-3 bg-white/80 px-3.5 py-1.5 rounded-full border border-[#384633]/15 shadow-xs">
              <AvatarGenerator
                name={student.name}
                avatarUrl={student.avatarUrl}
                size={32}
              />
              <span className="text-xs font-semibold text-[#384633] hidden sm:inline">
                {student.name}
              </span>
            </div>
          </div>
        </div>

        {/* TAB 1: COMMAND CENTER VIEW */}
        {activeTab === 'command_center' && (
          <div className="space-y-8">
            <p className="text-xs sm:text-sm text-[#7E8466] font-light max-w-2xl leading-relaxed">
              Welcome back, {student.name}. Your journey to mastery is progressing smoothly. Here is your current status and upcoming milestones.
            </p>

            {/* Urban Mastery Package Progress Card */}
            <div className="rounded-3xl p-6 sm:p-8 bg-[#E7E1D6] border border-[#384633]/15 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-serif text-lg text-[#384633] font-medium">
                  {currentPackageName}
                </h3>
                <p className="text-xs text-[#7E8466] font-light mt-1">
                  Session {metrics.completedSessions} of {metrics.totalSessions} completed
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/80 px-6 py-3 rounded-full border border-[#384633]/15 shadow-xs w-full sm:w-auto">
                <span className="font-serif text-lg font-bold text-[#384633]">
                  {metrics.progressPercentage}%
                </span>
                <div className="w-32 h-2.5 bg-[#D6D0C6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#384633] rounded-full transition-all duration-500"
                    style={{ width: `${metrics.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 3-Column Focus Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: NEXT UP Session */}
              <div className="rounded-3xl p-6 bg-white border border-[#384633]/15 space-y-6 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-full bg-[#384633]/10 text-[#384633]">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-[#E7E1D6] text-[#384633]">
                      NEXT UP
                    </span>
                  </div>

                  <div>
                    <h4 className="font-serif text-xl text-[#384633] font-medium">
                      {upcomingSession ? upcomingSession.topic || 'Highway Dynamics' : 'Highway Dynamics'}
                    </h4>
                    <p className="text-xs text-[#7E8466] font-light leading-relaxed mt-2">
                      Focusing on merging, high-speed spatial awareness, and calm decision making under pressure.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#384633]/10 flex items-center justify-between text-xs font-semibold text-[#384633]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#7E8466]" />
                    <span>
                      {upcomingSession?.scheduledAt
                        ? formatISTDateTime(upcomingSession.scheduledAt, {
                            weekday: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Tomorrow, 10:00 AM'}
                    </span>
                  </div>
                  {upcomingSession && (
                    <button
                      onClick={() => setReschedulingSession(upcomingSession)}
                      className="text-[11px] text-[#384633] hover:underline font-bold cursor-pointer"
                    >
                      Reschedule
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: Your Instructor */}
              <div className="relative rounded-3xl overflow-hidden h-[320px] border border-[#384633]/15 shadow-xs group">
                <Image
                  src="/images/cabin_interior.jpg"
                  alt="Instructor Cabin Interior"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#384633]/90 via-[#384633]/30 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-[#384633]/15 flex items-center gap-3">
                  <AvatarGenerator
                    name={upcomingSession?.instructor?.name || 'Rajesh Kumar'}
                    avatarUrl={upcomingSession?.instructor?.avatarUrl}
                    size={40}
                    className="shrink-0 ring-2 ring-[#384633]"
                  />
                  <div>
                    <span className="text-[10px] text-[#7E8466] font-semibold uppercase tracking-wider block">Your Instructor</span>
                    <span className="font-serif text-sm font-medium text-[#384633]">
                      {upcomingSession?.instructor?.name || 'Rajesh Kumar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Skill Matrix Summary */}
              <div className="rounded-3xl p-6 bg-[#E7E1D6] border border-[#384633]/15 space-y-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-lg font-medium text-[#384633]">Skill Matrix</h4>
                  <Sparkles className="w-4 h-4 text-[#384633]" />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-[#384633]">Vehicle Control</span>
                      <span className="text-[#7E8466] font-light">Proficient</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-2">
                      <div className="bg-[#384633] rounded-full" />
                      <div className="bg-[#384633] rounded-full" />
                      <div className="bg-[#384633] rounded-full" />
                      <div className="bg-[#D6D0C6] rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-[#384633]">Spatial Awareness</span>
                      <span className="text-[#7E8466] font-light">Developing</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-2">
                      <div className="bg-[#384633] rounded-full" />
                      <div className="bg-[#384633] rounded-full" />
                      <div className="bg-[#D6D0C6] rounded-full" />
                      <div className="bg-[#D6D0C6] rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-[#384633]">Parallel Parking</span>
                      <span className="text-[#7E8466] font-light">Novice</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-2">
                      <div className="bg-[#384633] rounded-full" />
                      <div className="bg-[#D6D0C6] rounded-full" />
                      <div className="bg-[#D6D0C6] rounded-full" />
                      <div className="bg-[#D6D0C6] rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('curriculum')}
                    className="w-full bg-[#384633] hover:bg-[#2B3B2B] text-white font-medium text-xs py-3 rounded-full inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Review Evaluation Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bookings & Receipts Section */}
            {bookings.length > 0 && (
              <div className="bg-white border border-[#384633]/15 rounded-3xl p-6 space-y-4 shadow-xs">
                <h3 className="font-serif text-lg text-[#384633] font-medium">
                  Your Course Bookings & Payment Receipts
                </h3>
                <div className="divide-y divide-[#384633]/10">
                  {bookings.map((b) => (
                    <div key={b.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-bold text-[#384633] text-sm">{b.package?.name || 'Driving Package'}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            b.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {b.paymentStatus}
                          </span>
                        </div>
                        <p className="text-xs text-[#7E8466] mt-1 font-light">
                          Booked on {new Date(b.createdAt).toLocaleDateString()} • Total: ₹{b.totalAmount.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setSelectedInvoiceBooking(b)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-full border border-[#384633]/20 text-[#384633] hover:bg-[#F4F0E8] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </button>

                        <button
                          onClick={() => setCancellingBooking(b)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCHEDULE VIEW */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#384633]/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-xl font-normal text-[#384633]">Upcoming Practical Sessions</h3>
                  <p className="text-xs text-[#7E8466] font-light mt-1">Manage and reschedule your practical driving sessions</p>
                </div>
                <button
                  onClick={() => router.push('/book')}
                  className="bg-[#384633] hover:bg-[#2B3B2B] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs"
                >
                  + Book New Session
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-12 text-[#7E8466] space-y-3">
                  <Calendar className="w-8 h-8 mx-auto text-[#384633]/40" />
                  <p className="text-xs font-light">No sessions scheduled currently.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-5 rounded-2xl bg-[#F4F0E8] border border-[#384633]/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-base text-[#384633]">
                            {sess.topic || 'Practical Driving Session'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E7E1D6] text-[#384633]">
                            {sess.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#7E8466] font-light">
                          Date: <strong>{formatISTDateTime(sess.scheduledAt)}</strong>
                        </p>
                        <p className="text-xs text-[#7E8466] font-light">
                          Instructor: <strong>{sess.instructor?.name || 'Assigned Instructor'}</strong> • Vehicle: <strong>{sess.vehicle?.name || 'Dual-Control Fleet'}</strong>
                        </p>
                      </div>

                      {sess.status === 'SCHEDULED' && (
                        <button
                          onClick={() => setReschedulingSession(sess)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#384633] hover:bg-[#2B3B2B] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs"
                        >
                          Reschedule
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CURRICULUM & SKILLS VIEW */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#384633]/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h3 className="font-serif text-xl font-normal text-[#384633]">Comprehensive Driving Curriculum</h3>
                <p className="text-xs text-[#7E8466] font-light mt-1">Pedagogical breakdown of practical skills & assessment criteria</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Vehicle Controls & Cockpit Drill', level: 'Proficient', score: '92%' },
                  { title: 'Clutch & Gear Synchronization', level: 'Proficient', score: '88%' },
                  { title: 'Spatial Awareness & Mirror Checks', level: 'Developing', score: '75%' },
                  { title: 'Reverse & Parallel Parking', level: 'Novice', score: '60%' },
                  { title: 'Highway Merging & Overtaking', level: 'Pending', score: '0%' },
                  { title: 'Night Driving & Adverse Weather', level: 'Pending', score: '0%' },
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#F4F0E8] border border-[#384633]/15 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-serif font-semibold text-sm text-[#384633]">{item.title}</h4>
                      <span className="text-xs font-mono font-bold text-[#384633]">{item.score}</span>
                    </div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-[#E7E1D6] text-[#384633] px-2.5 py-0.5 rounded-full">
                      Status: {item.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE & SETTINGS VIEW */}
        {activeTab === 'profile' && (
          <ProfileSettingsView student={student} />
        )}
      </main>

      {/* CANCELLATION MODAL */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#384633]/20 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-[#384633]">
            <div className="flex justify-between items-start border-b border-[#384633]/10 pb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-rose-600" />
                <h3 className="font-serif text-xl font-normal text-[#384633]">Cancel Course Booking</h3>
              </div>
              <button onClick={() => setCancellingBooking(null)} className="text-[#7E8466] hover:text-[#384633]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#7E8466] space-y-2 font-light leading-relaxed">
              <p>Are you sure you want to cancel your booking for <strong>{cancellingBooking.package?.name || 'Driving Course'}</strong>?</p>
              <p className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px]">
                Notice: Cancellation releases reserved instructor slots. Paid bookings cancelled 24 hours prior to first session qualify for full refund.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {cancelError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCancellingBooking(null)}
                className="px-5 py-2.5 rounded-full border border-[#384633]/20 text-[#384633] text-xs font-bold cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                disabled={cancellingLoading}
                onClick={handleConfirmCancellation}
                className="px-6 py-2.5 rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
              >
                {cancellingLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULING MODAL */}
      {reschedulingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#384633]/20 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 text-[#384633]">
            <div className="flex justify-between items-start border-b border-[#384633]/10 pb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-[#384633]" />
                <h3 className="font-serif text-xl font-normal text-[#384633]">Reschedule Session</h3>
              </div>
              <button onClick={() => setReschedulingSession(null)} className="text-[#7E8466] hover:text-[#384633]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#384633] block">
                  Select New Training Date
                </label>
                <input
                  type="date"
                  min={getFutureISTDateString(1)}
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value);
                    setRescheduleTimeSlot(null);
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-[#384633]/20 text-xs font-medium text-[#384633] outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#384633] block">
                  Available Time Slots
                </label>
                {rescheduleFetchingSlots ? (
                  <div className="p-8 text-center text-[#7E8466] text-xs font-light">
                    Fetching open slot availability...
                  </div>
                ) : rescheduleSlots.length === 0 ? (
                  <div className="p-6 text-center text-[#7E8466] text-xs">
                    No open slots found for selected date. Please pick another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {rescheduleSlots.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setRescheduleTimeSlot(slot.time)}
                        className={`p-3 rounded-2xl text-xs font-bold transition text-center cursor-pointer ${
                          !slot.available
                            ? 'bg-[#F4F0E8] text-[#7E8466] border border-[#384633]/10 opacity-60 cursor-not-allowed line-through'
                            : rescheduleTimeSlot === slot.time
                            ? 'bg-[#384633] text-white shadow-md'
                            : 'bg-white text-[#384633] border border-[#384633]/20 hover:border-[#384633]'
                        }`}
                      >
                        <div>{slot.time}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {rescheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {rescheduleError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setReschedulingSession(null)}
                className="px-5 py-2.5 rounded-full border border-[#384633]/20 text-[#384633] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!rescheduleTimeSlot || rescheduleLoading}
                onClick={handleConfirmReschedule}
                className="px-6 py-2.5 rounded-full bg-[#384633] hover:bg-[#2B3B2B] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
              >
                {rescheduleLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      <InvoiceModal
        isOpen={!!selectedInvoiceBooking}
        onClose={() => setSelectedInvoiceBooking(null)}
        booking={selectedInvoiceBooking}
      />
    </div>
  );
}
