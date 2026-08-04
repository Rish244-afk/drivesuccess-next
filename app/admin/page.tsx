import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminOverviewAction, getAdminSession } from '@/actions/admin';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTodaysBookingsWidget } from '@/components/admin/AdminTodaysBookingsWidget';
import { ArrowUpRight } from 'lucide-react';
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
  const allInstructors = overview.allInstructors || [];
  const allVehicles = overview.allVehicles || [];

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 space-y-12 pb-20 font-sans">
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

        {/* 2. TODAY'S BOOKINGS SECTION WIDGET */}
        <AdminTodaysBookingsWidget
          initialBookings={todaysBookings}
          allInstructors={allInstructors}
          allVehicles={allVehicles}
          todaysBookingsCount={stats.todaysBookingsCount}
        />

      </div>
    </div>
  );
}
