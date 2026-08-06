'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { retryPaymentAction } from '@/actions/razorpay';
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
  const [activeTab, setActiveTab] = useState<'bookings' | 'sessions' | 'payments' | 'documents' | 'skills'>('bookings');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<any | null>(null);
  const router = useRouter();

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
    <div className="min-h-screen bg-slate-50/50 pb-24 font-sans text-slate-900">
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

            <button
              onClick={handleBookNewSession}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <span>+ New Booking</span>
            </button>
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
                                : 'border-amber-300 text-amber-800 bg-amber-50'
                            }`}
                          >
                            {b.paymentStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {b.paymentStatus !== 'PAID' && (
                            <button
                              disabled={retryingId === b.id}
                              onClick={() => handleRetryPayment(b.id)}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-full text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-sm cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{retryingId === b.id ? 'Initializing...' : 'Retry Payment'}</span>
                            </button>
                          )}

                          {b.paymentStatus === 'PAID' && (
                            <button
                              onClick={() => setSelectedInvoiceBooking({ ...b, student })}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold px-5 py-2.5 rounded-full text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>View Invoice</span>
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
                    <span className={`text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${
                      s.status === 'COMPLETED'
                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                        : 'border-blue-300 text-blue-700 bg-blue-50'
                    }`}>
                      {s.status}
                    </span>
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

          {/* TAB 4: RTO DOCUMENTS */}
          {activeTab === 'documents' && (
            <DocumentVault documents={student.documents || []} />
          )}

          {/* TAB 5: SKILL MATRIX */}
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

      </div>
    </div>
  );
}
