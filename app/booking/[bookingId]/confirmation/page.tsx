import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { CheckCircle2, Download, Calendar, User, Car, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { ConfirmationCleanup } from '@/components/booking/ConfirmationCleanup';

export default async function BookingConfirmationPage({ params }: { params: { bookingId: string } }) {
  const session = await getServerSession();
  
  if (!session || !session.sub) {
    redirect('/auth/login');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      package: true,
      instructor: true,
      vehicle: true,
      student: true,
      sessions: {
        orderBy: { scheduledAt: 'asc' },
        take: 1,
      }
    }
  });

  if (!booking) {
    notFound();
  }

  // Row-level access check: only the owner or an ADMIN can view this confirmation page
  if (booking.studentId !== session.sub && session.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const firstSession = booking.sessions[0];
  const scheduledDate = firstSession ? firstSession.scheduledAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Pending Schedule';
  const scheduledTime = firstSession ? firstSession.scheduledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="min-h-screen bg-[#02040A] py-20 px-4 flex items-center justify-center">
      {/*
        ConfirmationCleanup: client component that wipes wizard_state from
        sessionStorage on mount. Belt-and-suspenders safety net alongside the
        synchronous wipe in BookingWizard's onSuccess callback (Bug 3 fix).
      */}
      <ConfirmationCleanup />
      <div className="max-w-3xl w-full bg-[#070B19] border border-slate-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8">
        
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-slate-100">Booking Confirmed!</h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Your payment was successful and your driving sessions are officially reserved. We are excited to have you onboard!
          </p>
        </div>

        {/* Booking Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Booking Reference</span>
            <span className="font-mono text-sm text-amber-400 font-bold">{booking.id}</span>
          </div>
          
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-slate-800">
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-100">{booking.package.name}</h3>
                <p className="text-sm text-slate-400">{booking.package.sessionsCount} Practical Sessions Included</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-500 block">Total Amount Paid</span>
                <span className="font-heading font-extrabold text-2xl text-emerald-400">₹{booking.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Student</span>
                <p className="font-medium text-slate-200">{booking.student.name}</p>
                <p className="text-sm text-slate-400">{booking.student.phone}</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> First Session</span>
                <p className="font-medium text-slate-200">{scheduledDate}</p>
                <p className="text-sm text-slate-400">{scheduledTime}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Instructor</span>
                <p className="font-medium text-slate-200">{booking.instructor?.name || 'Pending Assignment'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> Vehicle</span>
                <p className="font-medium text-slate-200">{booking.vehicle?.name || 'Standard Training Vehicle'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200/90 text-sm flex gap-4 items-start">
          <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
          <p>
            <strong className="text-amber-400 block mb-1">What&apos;s next?</strong>
            Your instructor will contact you a few hours prior to your first session. Please ensure you arrive 10 minutes early at the training location with your Learner&apos;s License (if applicable).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <a
            href={`/api/booking/${booking.id}/receipt`}
            target="_blank"
            className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Download className="w-5 h-5" />
            <span>Download Receipt (PDF)</span>
          </a>
          
          <Link
            href="/dashboard"
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <span>Go to My Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
