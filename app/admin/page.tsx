import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminOverviewAction, getAdminSession } from '@/actions/admin';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DollarSign, Calendar, Users, Car, ArrowRight, Clock, ArrowUpRight } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Overview | DriveSuccess Academy',
  description: 'Administrative dashboard for academy revenue, bookings, instructors, and vehicle fleet.',
};

export default async function AdminDashboardPage() {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    redirect('/admin/login');
  }

  const overview = await getAdminOverviewAction();
  const stats = overview.stats || {
    totalRevenue: 0,
    totalBookingsCount: 0,
    todaysBookingsCount: 0,
    activeInstructorsCount: 0,
    totalVehiclesCount: 0,
  };
  const todaysBookings = overview.todaysBookings || [];

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 space-y-12 pb-20">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
        
        {/* Editorial Page Title */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 border-b border-slate-800/60 pb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Administrative Control Center
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-slate-100 font-normal mt-1">
              Academy <em className="italic text-amber-400 font-normal">Overview</em>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/bookings"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-full text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-lg shadow-amber-500/10"
            >
              <span>Manage All Bookings</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 1. REVENUE & STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#070B19] border border-slate-800/60 p-6 rounded-2xl space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-widest text-slate-400 font-medium">Total Revenue</span>
            <h2 className="font-serif text-3xl text-amber-400 font-normal">
              ₹{stats.totalRevenue.toLocaleString()}
            </h2>
          </div>

          <div className="bg-[#070B19] border border-slate-800/60 p-6 rounded-2xl space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-widest text-slate-400 font-medium">Total Bookings</span>
            <h2 className="font-serif text-3xl text-slate-100 font-normal">
              {stats.totalBookingsCount}
            </h2>
          </div>

          <div className="bg-[#070B19] border border-slate-800/60 p-6 rounded-2xl space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-widest text-slate-400 font-medium">Active Instructors</span>
            <h2 className="font-serif text-3xl text-slate-100 font-normal">
              {stats.activeInstructorsCount}
            </h2>
          </div>

          <div className="bg-[#070B19] border border-slate-800/60 p-6 rounded-2xl space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-widest text-slate-400 font-medium">Learning Fleet</span>
            <h2 className="font-serif text-3xl text-slate-100 font-normal">
              {stats.totalVehiclesCount}
            </h2>
          </div>

        </div>

        {/* 2. TODAY'S BOOKINGS SECTION */}
        <div className="bg-[#070B19] border border-slate-800/60 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl text-slate-100 font-normal">Today&apos;s Scheduled Bookings</h2>
              <p className="text-xs text-slate-400 font-light mt-0.5">{stats.todaysBookingsCount} bookings active today</p>
            </div>

            <Link href="/admin/bookings" className="text-xs font-semibold uppercase tracking-widest text-amber-400 hover:underline flex items-center gap-1">
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todaysBookings.length === 0 ? (
            <div className="text-center py-12 bg-[#0A1128] border border-slate-800/60 rounded-2xl text-xs text-slate-400 font-light">
              No new bookings recorded today.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 bg-[#0A1128] border border-slate-800/60 rounded-2xl overflow-hidden">
              {todaysBookings.map((b: any) => (
                <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <h3 className="font-serif text-lg text-slate-100 font-normal">{b.student?.name}</h3>
                    <p className="text-slate-400 font-light">Package: {b.package?.name} • Phone: {b.student?.phone || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-serif text-lg text-amber-400">₹{b.totalAmount.toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-widest font-medium px-3 py-1 rounded-full border border-slate-700 text-slate-300">
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
