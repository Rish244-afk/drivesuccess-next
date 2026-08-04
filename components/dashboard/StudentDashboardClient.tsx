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
  PackageCheck,
  ArrowUpRight,
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
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(type);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        window.location.reload();
      } else {
        setUploadingType(null);
        alert('Failed to upload document');
      }
    } catch (error) {
      setUploadingType(null);
      console.error(error);
      alert('Error uploading document');
    }
  };

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
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 space-y-12">
      
      {/* 1. EDITORIAL MEMBER PORTAL HEADER */}
      <div className="bg-[#070B19] border border-slate-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Image
              src={student.avatarUrl || '/images/priya.jpg'}
              alt={student.name}
              width={80}
              height={80}
              className="rounded-full object-cover border border-amber-400/40 shadow-xl"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#070B19] rounded-full" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Student Member Portal
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-slate-100 tracking-tight">
              Welcome back, <em className="italic text-amber-400 font-normal">{student.name}</em>
            </h1>
            <p className="text-xs text-slate-400 font-light pt-0.5">
              Phone: {student.phone || 'N/A'} • Email: {student.email} • Student ID: {student.id.slice(-6)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/book"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-amber-500/10 transition hover:scale-[1.02]"
          >
            <span>Reserve Session</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-5 py-3 rounded-full text-xs font-medium uppercase tracking-wider transition"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* 2. OVERALL SESSION PROGRESS (Thin Elegant Bar with Serif Numerals) */}
      <div className="bg-[#070B19] border border-slate-800/80 rounded-3xl p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Curriculum Progress</span>
            <h2 className="font-serif text-2xl text-slate-100 font-normal mt-1">Practical Driving Hours</h2>
          </div>
          <span className="font-serif text-3xl text-slate-100 font-normal">
            <em className="italic text-amber-400 font-normal">{metrics.completedSessions}</em> of {metrics.totalSessions} sessions completed ({metrics.progressPercentage}%)
          </span>
        </div>

        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-700"
            style={{ width: `${metrics.progressPercentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-slate-400 font-light">
          <span>RTO Practical Exam Readiness Level</span>
          <span className="text-emerald-400 font-medium">On Track for Licensing Test</span>
        </div>
      </div>

      {/* 3. MINIMAL LIST ROWS TAB NAVIGATION */}
      <div className="space-y-8">
        <div className="flex border-b border-slate-800/60 overflow-x-auto gap-8">
          {[
            { id: 'bookings', label: 'Bookings & Status', count: bookings.length },
            { id: 'sessions', label: 'Sessions Schedule', count: sessions.length },
            { id: 'payments', label: 'Payment Logs', count: bookings.length },
            { id: 'documents', label: 'RTO Documents' },
            { id: 'skills', label: 'Skill Matrix' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-xs font-sans uppercase tracking-widest font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] text-slate-500 font-serif italic">
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: UPCOMING BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-16 bg-[#070B19] border border-slate-800/60 rounded-3xl space-y-4">
                <p className="font-serif text-xl text-slate-200">No active bookings found</p>
                <p className="text-xs text-slate-400 font-light max-w-sm mx-auto">
                  Select a driving package and reserve your preferred instructor.
                </p>
                <Link
                  href="/book"
                  className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-full text-xs uppercase tracking-widest"
                >
                  Reserve Package
                </Link>
              </div>
            ) : (
              <div className="bg-[#070B19] border border-slate-800/60 rounded-2xl divide-y divide-slate-800/60 overflow-hidden">
                {bookings.map((b) => (
                  <div key={b.id} className="p-6 space-y-4 hover:bg-slate-900/40 transition">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <h3 className="font-serif text-2xl text-slate-100 font-normal">{b.package?.name}</h3>
                        <p className="text-xs text-slate-400 font-light">
                          Instructor: {b.instructor?.name || 'Senior Advisor'} • Vehicle: {b.vehicle?.name || 'Dual-Control Fleet'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-serif text-xl text-amber-400">₹{b.totalAmount.toLocaleString()}</span>
                        <span className={`text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${
                          b.status === 'CONFIRMED'
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                            : 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    </div>

                    {b.paymentStatus !== 'PAID' && (
                      <div className="flex justify-end pt-2">
                        <button
                          disabled={retryingId === b.id}
                          onClick={() => handleRetryPayment(b.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-full text-xs uppercase tracking-wider flex items-center gap-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{retryingId === b.id ? 'Initializing...' : 'Retry Payment'}</span>
                        </button>
                      </div>
                    )}
                    {b.paymentStatus === 'PAID' && (
                      <div className="flex justify-end pt-2">
                        <Link
                          href={`/booking/${b.id}/confirmation`}
                          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold px-5 py-2.5 rounded-full text-xs uppercase tracking-wider flex items-center gap-2 transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Confirmation</span>
                        </Link>
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
          <div className="bg-[#070B19] border border-slate-800/60 rounded-2xl divide-y divide-slate-800/60 overflow-hidden">
            {sessions.map((s) => (
              <div key={s.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-serif text-xl text-slate-100 font-normal">
                    {new Date(s.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </h4>
                  <p className="text-xs text-slate-400 font-light">
                    Instructor: {s.instructor?.name} • Vehicle: {s.vehicle?.name} ({s.durationMins} mins)
                  </p>
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${
                  s.status === 'COMPLETED'
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                    : 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                }`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: PAYMENT LOGS */}
        {activeTab === 'payments' && (
          <div className="bg-[#070B19] border border-slate-800/60 rounded-2xl divide-y divide-slate-800/60 overflow-hidden">
            {bookings.map((b) => (
              <div key={b.id} className="p-6 flex justify-between items-center text-xs">
                <div>
                  <p className="font-serif text-lg text-slate-100 font-normal">{b.package?.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Order: {b.razorpayOrderId || 'Pending'}</p>
                </div>
                <div className="text-right">
                  <span className="font-serif text-xl text-amber-400 block">₹{b.totalAmount.toLocaleString()}</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">{b.paymentStatus}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: RTO DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { type: 'government_id', name: 'Government Driver ID / Passport' },
              { type: 'rto_form_20', name: 'RTO Form 20 (Registration)' },
              { type: 'learner_license', name: 'Learner License Permit' },
              { type: 'medical_certificate', name: 'Medical Certificate (Form 1A)' },
            ].map((docType) => {
              const userDoc = student.documents?.find((d: any) => d.type === docType.type);
              const status = userDoc?.status || 'not_uploaded';
              const isUploading = uploadingType === docType.type;

              return (
                <div key={docType.type} className="bg-[#070B19] border border-slate-800/60 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif text-lg text-slate-100 font-normal">{docType.name}</h4>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">RTO Document</span>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${
                      status === 'verified' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' :
                      status === 'rejected' ? 'border-red-500/30 text-red-400 bg-red-500/5' :
                      status === 'submitted' ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' :
                      'border-slate-500/30 text-slate-400 bg-slate-500/5'
                    }`}>
                      {status === 'not_uploaded' ? 'Pending Upload' : status}
                    </span>
                  </div>
                  
                  {status === 'not_uploaded' || status === 'rejected' ? (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, docType.type)}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <button disabled={isUploading} className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold px-4 py-2.5 rounded-full text-xs uppercase tracking-wider flex items-center justify-center transition-all disabled:opacity-50">
                        {isUploading ? 'Uploading...' : 'Upload Document'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      {userDoc?.fileUrl && (
                        <a href={userDoc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-amber-400 hover:underline">
                          View File
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 5: SKILL MATRIX */}
        {activeTab === 'skills' && (
          <div className="bg-[#070B19] border border-slate-800/60 rounded-3xl p-8 space-y-6">
            <h3 className="font-serif text-2xl text-slate-100 font-normal">Pedagogical Driving Skill Matrix</h3>
            
            <div className="text-center py-8">
              <p className="text-slate-400 font-light text-sm">Your instructor will update your skill matrix after your practical sessions begin.</p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
