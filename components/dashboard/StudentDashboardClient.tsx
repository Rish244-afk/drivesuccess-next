'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  Download,
  Upload,
  Sparkles,
  PackageCheck,
} from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { retryPaymentAction } from '@/actions/razorpay';

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

  // Handle Retry Payment
  const handleRetryPayment = async (bookingId: string) => {
    setRetryingId(bookingId);
    const res = await retryPaymentAction(bookingId);
    setRetryingId(null);
    if (res.success) {
      window.location.href = `/book`;
    } else {
      alert(res.error || 'Failed to initialize payment retry.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* 1. STUDENT PROFILE HEADER CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 z-10">
          <div className="relative">
            <Image
              src={student.avatarUrl || '/images/student_alex_1785513764126.jpg'}
              alt={student.name}
              width={72}
              height={72}
              className="rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-extrabold text-2xl text-slate-100">{student.name}</h1>
              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                {student.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">Phone: {student.phone || 'N/A'} • Email: {student.email}</p>
            <p className="text-[11px] text-slate-500 font-mono">Location: {student.city}, {student.state} • Student ID: {student.id}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 z-10">
          <Link
            href="/book"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Book New Session</span>
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-4 py-3 rounded-xl text-xs font-semibold transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Logout</span>
            </button>
          </form>
        </div>
      </div>

      {/* 2. OVERALL SESSION PROGRESS & METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Progress Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 md:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Curriculum Progress</span>
              <h2 className="font-heading font-extrabold text-2xl text-slate-100 mt-1">Practical Driving Progress</h2>
            </div>
            <span className="font-heading font-extrabold text-3xl text-amber-400">{metrics.progressPercentage}%</span>
          </div>

          <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${metrics.progressPercentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
            <span>{metrics.completedSessions} of {metrics.totalSessions} Practical Sessions Completed</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              On Track for License Exam
            </span>
          </div>
        </div>

        {/* Quick Stats Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Bookings</span>
            <h3 className="font-heading font-extrabold text-3xl text-slate-100">{bookings.length} Packages</h3>
          </div>
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>RTO Compliance Status</span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md">VERIFIED</span>
          </div>
        </div>

      </div>

      {/* 3. TABBED DASHBOARD NAVIGATION */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-800 overflow-x-auto gap-2">
          {[
            { id: 'bookings', label: 'Upcoming Bookings & Status', count: bookings.length },
            { id: 'sessions', label: 'Completed & Scheduled Sessions', count: sessions.length },
            { id: 'payments', label: 'Payment History', count: bookings.length },
            { id: 'documents', label: 'Documents & RTO Forms' },
            { id: 'skills', label: 'Skill Matrix' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 text-xs font-heading font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: UPCOMING BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <Calendar className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="font-heading font-bold text-lg text-slate-200">No active bookings found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a driving package and book your preferred instructor and vehicle schedule.
                </p>
                <Link
                  href="/book"
                  className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider"
                >
                  Book Session Now
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {bookings.map((b) => (
                  <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center font-bold">
                          <PackageCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-heading font-extrabold text-lg text-slate-100">{b.package?.name}</h3>
                          <span className="text-xs text-slate-400">Total Price: ₹{b.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : b.status === 'PENDING'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}>
                          Booking: {b.status}
                        </span>

                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${
                          b.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}>
                          Payment: {b.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Instructor</span>
                        <strong className="text-slate-200">{b.instructor?.name || 'Assigned Senior Advisor'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Vehicle</span>
                        <strong className="text-slate-200">{b.vehicle?.name || 'Dual-Control Fleet'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Razorpay Order ID</span>
                        <code className="text-amber-400 font-mono text-[11px]">{b.razorpayOrderId || 'N/A'}</code>
                      </div>
                    </div>

                    {/* Retry Payment Button if Pending or Failed */}
                    {b.paymentStatus !== 'PAID' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          disabled={retryingId === b.id}
                          onClick={() => handleRetryPayment(b.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{retryingId === b.id ? 'Initializing...' : 'Retry Payment'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPLETED & SCHEDULED SESSIONS */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {sessions.map((s) => (
                <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <h4 className="font-heading font-extrabold text-base text-slate-100">
                        {new Date(s.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 pl-8">
                      Instructor: <strong className="text-slate-200">{s.instructor?.name}</strong> • Vehicle: <strong className="text-slate-200">{s.vehicle?.name}</strong> ({s.durationMins} mins)
                    </p>
                    <p className="text-[11px] text-slate-500 pl-8">Location: {s.location}</p>
                  </div>

                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${
                    s.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENT HISTORY */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Package</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Razorpay Payment ID</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-slate-100">{b.package?.name}</td>
                      <td className="p-4 font-extrabold text-amber-400">₹{b.totalAmount.toLocaleString()}</td>
                      <td className="p-4 font-mono text-[11px] text-slate-400">{b.razorpayPaymentId || 'Pending Callback'}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          b.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DOCUMENTS & RTO FORMS */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'Government Driver ID / Passport', status: 'VERIFIED', icon: ShieldCheck, color: 'text-emerald-400' },
              { name: 'RTO Form 20 (Vehicle Registration)', status: 'APPROVED', icon: FileText, color: 'text-emerald-400' },
              { name: 'Learner License Permit', status: 'ACTIVE', icon: Award, color: 'text-amber-400' },
              { name: 'Medical Certificate (Form 1A)', status: 'SUBMITTED', icon: FileText, color: 'text-blue-400' },
            ].map((doc) => (
              <div key={doc.name} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center">
                    <doc.icon className={`w-5 h-5 ${doc.color}`} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-100">{doc.name}</h4>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">RTO Document</span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: SKILL MATRIX */}
        {activeTab === 'skills' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="font-heading font-extrabold text-xl text-slate-100">Pedagogical Driving Skill Matrix</h3>
            
            <div className="space-y-4">
              {[
                { skill: 'Parallel Parking & Reversing', score: 90 },
                { skill: 'Clutch & Hill Start Assist Control', score: 85 },
                { skill: 'Highway Merging & High-Speed Safety', score: 80 },
                { skill: 'Traffic Rules & Signage Compliance', score: 95 },
                { skill: 'Night Vision Practical Navigation', score: 75 },
              ].map((item) => (
                <div key={item.skill} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">{item.skill}</span>
                    <span className="text-amber-400 font-bold">{item.score}%</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
