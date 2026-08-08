'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  User,
  ShieldCheck,
  RotateCcw,
  LogOut,
  Car,
  Award,
  PackageCheck,
  ArrowUpRight,
  Printer,
  Sparkles,
  ChevronRight,
  Filter,
  Bell,
  Settings,
  Check,
  CheckCheck,
  X,
  AlertTriangle,
} from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { retryPaymentAction } from '@/actions/razorpay';
import {
  getStudentNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/actions/notification';
import {
  cancelStudentBookingAction,
  rescheduleStudentSessionAction,
  getAvailableSlotsAction,
} from '@/actions/bookingSystem';
import { HeroHeader } from './HeroHeader';
import { QuickStats } from './QuickStats';
import { NextLessonCard } from './NextLessonCard';
import { ProgressOverview } from './ProgressOverview';
import { DocumentVault } from './DocumentVault';
import { SkillMatrix } from './SkillMatrix';
import { InvoiceModal } from './InvoiceModal';

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
  const [activeTab, setActiveTab] = useState<'bookings' | 'sessions' | 'payments' | 'notifications' | 'documents' | 'skills'>('bookings');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);

  // Cancellation Modal State
  const [cancellingBooking, setCancellingBooking] = useState<any | null>(null);
  const [cancellingLoading, setCancellingLoading] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Rescheduling Modal State
  const [reschedulingSession, setReschedulingSession] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [rescheduleSlots, setRescheduleSlots] = useState<{ time: string; available: boolean; reason: string }[]>([]);
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState<string | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState<boolean>(false);
  const [rescheduleFetchingSlots, setRescheduleFetchingSlots] = useState<boolean>(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      const res = await getStudentNotificationsAction();
      if (res.success && isMounted) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
      if (isMounted) setLoadingNotifications(false);
    };

    fetchNotifications();
  }, []);

  // Dynamically fetch available slots when rescheduling date changes
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

  const handleMarkNotificationRead = async (id: string) => {
    await markNotificationAsReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllNotificationsRead = async () => {
    await markAllNotificationsAsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
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

  // Navigation with SessionStorage Clearing for Booking Wizard
  const handleBookNewSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('wizard_state');
    }
    router.push('/book?reset=1');
  };

  const handleRetryPayment = async (bookingId: string) => {
    setRetryingId(bookingId);
    const res = await retryPaymentAction(bookingId);
    setRetryingId(null);
    if (res.success) {
      handleBookNewSession();
    } else {
      alert(res.error || 'Failed to initialize payment retry.');
    }
  };

  // Find next upcoming scheduled session
  const upcomingSession = sessions.find(
    (s) => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS'
  ) || sessions[0] || null;

  // Calculate totals
  const pendingBooking = bookings.find((b) => b.paymentStatus !== 'PAID');
  const pendingAmount = pendingBooking ? pendingBooking.totalAmount : 0;
  const currentPackageName = bookings[0]?.package?.name || 'Standard 4-Wheeler Driving Package';

  return (
    <div className="min-h-screen bg-[#090A0F] pb-24 font-sans text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        
        {/* 1. HERO HEADER SECTION */}
        <HeroHeader
          student={student}
          currentPackageName={currentPackageName}
          progressPercentage={metrics.progressPercentage}
        />

        {/* 2. QUICK STATS KPI GRID */}
        <QuickStats
          completedSessions={metrics.completedSessions}
          totalSessions={metrics.totalSessions}
          upcomingCount={sessions.filter((s) => s.status === 'SCHEDULED').length}
          pendingPaymentAmount={pendingAmount}
          packageName={currentPackageName}
          readinessPercentage={Math.min(100, Math.max(20, Math.round(metrics.progressPercentage * 0.85 + 15)))}
        />

        {/* 3. PRIMARY FOCUS ROW (SPLIT LAYOUT ON DESKTOP) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT / MAIN COLUMN (7 COLUMNS ON DESKTOP) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Spotlight: Next Upcoming Lesson */}
            <NextLessonCard session={upcomingSession} />

            {/* Practical Progress & RTO Readiness */}
            <ProgressOverview
              completedSessions={metrics.completedSessions}
              totalSessions={metrics.totalSessions}
              progressPercentage={metrics.progressPercentage}
              instructor={sessions[0]?.instructor}
              vehicle={sessions[0]?.vehicle}
            />

            {/* Driving Skill Matrix */}
            <SkillMatrix />
          </div>

          {/* RIGHT / SECONDARY COLUMN (5 COLUMNS ON DESKTOP) */}
          <div className="lg:col-span-5 space-y-8">
            {/* RTO Document Verification Vault */}
            <DocumentVault documents={student.documents || []} />

            {/* Quick Support & Helpline Box */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-7 shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-white inline-block">
                Academy Helpline
              </span>
              <h4 className="font-serif text-xl font-medium">Need Assistance or Custom Slot?</h4>
              <p className="text-xs text-blue-100 font-light leading-relaxed">
                Contact your personal driving advisor or RTO representative for licensing queries.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs font-semibold">
                <span>📞 Hotline: +91 98765 43210</span>
                <Link
                  href="/contact"
                  className="bg-white text-blue-900 px-4 py-2 rounded-xl hover:bg-blue-50 transition cursor-pointer"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* 4. DETAILED MANAGEMENT TABS */}
        <div className="space-y-6 pt-4">
          <div className="sticky top-16 z-20 bg-slate-50/90 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full sm:w-auto bg-slate-200/50 p-1.5 rounded-2xl">
              {[
                { id: 'bookings', label: 'Bookings & Packages', count: bookings.length },
                { id: 'sessions', label: 'Sessions Schedule', count: sessions.length },
                { id: 'payments', label: 'Payment Logs', count: bookings.length },
                { id: 'notifications', label: 'Notifications', count: unreadCount > 0 ? unreadCount : undefined },
                { id: 'documents', label: 'RTO Documents' },
                { id: 'skills', label: 'Skill Matrix' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-xs font-sans uppercase tracking-widest font-semibold transition-all whitespace-nowrap flex items-center gap-2 rounded-xl cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/settings"
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-sm"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Profile & Settings</span>
              </Link>
              <button
                onClick={handleBookNewSession}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <span>+ New Booking</span>
              </button>
            </div>
          </div>

          {/* TAB 1: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200/80 rounded-3xl space-y-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl">
                    📦
                  </div>
                  <h4 className="font-serif text-xl text-slate-800 font-normal">No Active Bookings Found</h4>
                  <p className="text-xs text-slate-400 font-light max-w-sm mx-auto">
                    Select a driving package and reserve your preferred instructor slot to get started.
                  </p>
                  <button
                    onClick={handleBookNewSession}
                    className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-full text-xs uppercase tracking-widest shadow-md transition hover:scale-105 cursor-pointer"
                  >
                    Reserve Driving Package
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-sm">
                  {bookings.map((b) => (
                    <div key={b.id} className="p-6 sm:p-8 space-y-4 hover:bg-slate-50/50 transition">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                            Booking ID: #{b.id.slice(-8).toUpperCase()}
                          </span>
                          <h3 className="font-serif text-2xl text-slate-900 font-normal">
                            {b.package?.name || 'Standard Package'}
                          </h3>
                          <p className="text-xs text-slate-500 font-light">
                            Instructor: <strong className="text-slate-800">{b.instructor?.name || 'Senior Advisor'}</strong> • Vehicle: <strong className="text-slate-800">{b.vehicle?.name || 'Dual-Control Fleet'}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-serif text-2xl font-semibold text-blue-600">
                            ₹{b.totalAmount.toLocaleString()}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${
                              b.status === 'CONFIRMED'
                                ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                                : b.status === 'CANCELLED'
                                ? 'border-red-300 text-red-700 bg-red-50'
                                : 'border-blue-300 text-blue-700 bg-blue-50'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-light">Payment Status:</span>
                          <span
                            className={`font-semibold uppercase text-[10px] px-2.5 py-0.5 rounded-full border ${
                              b.paymentStatus === 'PAID'
                                ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                                : b.paymentStatus === 'REFUNDED'
                                ? 'border-purple-300 text-purple-700 bg-purple-50'
                                : 'border-amber-300 text-amber-800 bg-amber-50'
                            }`}
                          >
                            {b.paymentStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {b.paymentStatus !== 'PAID' && b.status !== 'CANCELLED' && (
                            <button
                              disabled={retryingId === b.id}
                              onClick={() => handleRetryPayment(b.id)}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-full text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-sm cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{retryingId === b.id ? 'Initializing...' : 'Retry Payment'}</span>
                            </button>
                          )}

                          {b.paymentStatus === 'PAID' && (
                            <button
                              onClick={() => setSelectedInvoiceBooking({ ...b, student })}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold px-4 py-2 rounded-full text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>View Invoice</span>
                            </button>
                          )}

                          {/* CANCEL BOOKING BUTTON */}
                          {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                            <button
                              onClick={() => {
                                setCancellingBooking(b);
                                setCancelError(null);
                              }}
                              className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold px-4 py-2 rounded-full text-xs uppercase tracking-wider transition cursor-pointer"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SESSIONS SCHEDULE */}
          {activeTab === 'sessions' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-sm">
              {sessions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-light text-sm">
                  No driving sessions scheduled yet. Reserve your session to get started.
                </div>
              ) : (
                sessions.map((s) => (
                  <div key={s.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="space-y-1">
                      <h4 className="font-serif text-xl text-slate-900 font-normal">
                        {new Date(s.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </h4>
                      <p className="text-xs text-slate-500 font-light">
                        Instructor: <strong className="text-slate-800">{s.instructor?.name}</strong> • Vehicle: <strong className="text-slate-800">{s.vehicle?.name}</strong> ({s.durationMins || 60} mins)
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${
                        s.status === 'COMPLETED'
                          ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                          : s.status === 'CANCELLED'
                          ? 'border-red-300 text-red-700 bg-red-50'
                          : 'border-blue-300 text-blue-700 bg-blue-50'
                      }`}>
                        {s.status}
                      </span>

                      {/* RESCHEDULE SESSION BUTTON */}
                      {s.status === 'SCHEDULED' && s.booking?.status !== 'CANCELLED' && (
                        <button
                          onClick={() => {
                            setReschedulingSession(s);
                            setRescheduleDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
                            setRescheduleTimeSlot(null);
                            setRescheduleError(null);
                          }}
                          className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider transition cursor-pointer"
                        >
                          Reschedule
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: PAYMENT LOGS */}
          {activeTab === 'payments' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-sm">
              {bookings.map((b) => (
                <div key={b.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-serif text-lg text-slate-900 font-normal">{b.package?.name}</h4>
                    <p className="text-slate-400 font-mono">Order Ref: {b.razorpayOrderId || 'PENDING'}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-serif text-xl font-bold text-slate-900 block">₹{b.totalAmount.toLocaleString()}</span>
                      <span className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded ${
                        b.paymentStatus === 'PAID' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                      }`}>
                        {b.paymentStatus}
                      </span>
                    </div>

                    {b.paymentStatus === 'PAID' && (
                      <button
                        onClick={() => setSelectedInvoiceBooking({ ...b, student })}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                        title="Download Invoice"
                      >
                        <Printer className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-serif text-2xl text-slate-900 font-normal">Account Notifications</h3>
                  <p className="text-xs text-slate-500 font-light mt-0.5">
                    Real-time updates regarding your bookings, payments, and training sessions.
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Mark all as read</span>
                  </button>
                )}
              </div>

              {loadingNotifications ? (
                <div className="p-12 text-center text-slate-400 font-light text-sm">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl">
                    🔔
                  </div>
                  <h4 className="font-serif text-xl text-slate-800 font-normal">No Notifications Found</h4>
                  <p className="text-xs text-slate-400 font-light max-w-sm mx-auto">
                    You currently have no unread or historical alerts in your student account log.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                        !n.isRead ? 'bg-blue-50/30 px-4 rounded-2xl border border-blue-100 my-1' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-lg text-slate-900 font-normal">{n.title}</h4>
                          {!n.isRead && (
                            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-light leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-400 font-mono block pt-1">
                          {new Date(n.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-white border border-blue-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Read</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RTO DOCUMENTS */}
          {activeTab === 'documents' && (
            <DocumentVault documents={student.documents || []} />
          )}

          {/* TAB 6: SKILL MATRIX */}
          {activeTab === 'skills' && (
            <SkillMatrix />
          )}

        </div>

        {/* 5. INVOICE MODAL */}
        <InvoiceModal
          isOpen={!!selectedInvoiceBooking}
          onClose={() => setSelectedInvoiceBooking(null)}
          booking={selectedInvoiceBooking}
        />

        {/* 6. CANCELLATION CONFIRMATION MODAL */}
        {cancellingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-slate-900 font-normal">Cancel Booking?</h3>
                    <p className="text-xs text-slate-500">
                      ID: #{cancellingBooking.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCancellingBooking(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Package:</span>
                  <span className="font-medium text-slate-900">{cancellingBooking.package?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Instructor:</span>
                  <span className="font-medium text-slate-900">{cancellingBooking.instructor?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-slate-900">₹{cancellingBooking.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="font-semibold uppercase text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {cancellingBooking.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-light leading-relaxed space-y-1">
                <p className="font-semibold text-amber-950">Cancellation Policy Notice:</p>
                <p>
                  • Unpaid reservations release held slots immediately.
                  <br />
                  • Paid bookings cancelled with <strong>&gt;24 hours notice</strong> submit a refund request for admin processing.
                  <br />
                  • Self-service cancellation is disabled within 24 hours of your scheduled session.
                </p>
              </div>

              {cancelError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                  {cancelError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  onClick={() => setCancellingBooking(null)}
                  className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition cursor-pointer"
                >
                  Keep Booking
                </button>
                <button
                  disabled={cancellingLoading}
                  onClick={handleConfirmCancellation}
                  className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {cancellingLoading ? 'Cancelling...' : 'Yes, Cancel Booking'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. RESCHEDULING PICKER MODAL */}
        {reschedulingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-slate-900 font-normal">Reschedule Training Session</h3>
                    <p className="text-xs text-slate-500">Select a new date and open time slot</p>
                  </div>
                </div>
                <button
                  onClick={() => setReschedulingSession(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Session Snapshot */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px] block">
                  Current Session
                </span>
                <p className="text-slate-900 font-medium">
                  {new Date(reschedulingSession.scheduledAt).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-slate-500 font-light">
                  Instructor: <strong>{reschedulingSession.instructor?.name}</strong> • Vehicle: <strong>{reschedulingSession.vehicle?.name}</strong>
                </p>
              </div>

              {/* New Date Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                  Select New Training Date
                </label>
                <input
                  type="date"
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value);
                    setRescheduleTimeSlot(null);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Time Slots Grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                  Available Time Slots
                </label>
                {rescheduleFetchingSlots ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-light">
                    Calculating instructor & vehicle slot availability...
                  </div>
                ) : rescheduleSlots.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No open slots found for selected date. Please select another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {rescheduleSlots.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setRescheduleTimeSlot(slot.time)}
                        className={`p-3 rounded-2xl text-xs font-semibold transition text-center cursor-pointer ${
                          !slot.available
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed'
                            : rescheduleTimeSlot === slot.time
                            ? 'bg-blue-600 text-white shadow-md font-bold border border-blue-600'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        <div>{slot.time}</div>
                        <div className="text-[9px] font-normal opacity-80 mt-0.5">
                          {slot.available ? 'Available' : 'Booked'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {rescheduleError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                  {rescheduleError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  onClick={() => setReschedulingSession(null)}
                  className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!rescheduleTimeSlot || rescheduleLoading}
                  onClick={handleConfirmReschedule}
                  className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {rescheduleLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


