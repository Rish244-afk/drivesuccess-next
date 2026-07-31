import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminOverviewAction, getAdminSession } from '@/actions/admin';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DollarSign, Calendar, Users, Car, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 space-y-8 pb-16">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="font-heading font-extrabold text-3xl text-slate-100">Academy Overview</h1>
            <p className="text-xs text-slate-400 mt-1">Real-time revenue metrics, today&apos;s bookings, and fleet status.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/bookings"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Manage All Bookings</span>
            </Link>
          </div>
        </div>

        {/* 1. REVENUE & STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Revenue */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue Collected</span>
              <h2 className="font-heading font-extrabold text-3xl text-amber-400 mt-1">
                ₹{stats.totalRevenue.toLocaleString()}
              </h2>
            </div>
          </div>

          {/* Card 2: Total Bookings */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
              <h2 className="font-heading font-extrabold text-3xl text-slate-100 mt-1">
                {stats.totalBookingsCount}
              </h2>
            </div>
          </div>

          {/* Card 3: Active Instructors */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Instructors</span>
              <h2 className="font-heading font-extrabold text-3xl text-slate-100 mt-1">
                {stats.activeInstructorsCount}
              </h2>
            </div>
          </div>

          {/* Card 4: Fleet Vehicles */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Learning Fleet</span>
              <h2 className="font-heading font-extrabold text-3xl text-slate-100 mt-1">
                {stats.totalVehiclesCount}
              </h2>
            </div>
          </div>

        </div>

        {/* 2. TODAY'S BOOKINGS SECTION */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-400" />
              <div>
                <h2 className="font-heading font-extrabold text-xl text-slate-100">Today&apos;s Bookings</h2>
                <p className="text-xs text-slate-400">Bookings scheduled or created today ({stats.todaysBookingsCount} bookings)</p>
              </div>
            </div>

            <Link href="/admin/bookings" className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todaysBookings.length === 0 ? (
            <div className="text-center py-10 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400">
              No new bookings created today.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
              {todaysBookings.map((b: any) => (
                <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <h3 className="font-heading font-bold text-slate-100 text-sm">{b.student?.name}</h3>
                    <p className="text-slate-400">Package: <strong className="text-slate-200">{b.package?.name}</strong> • Phone: {b.student?.phone || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-extrabold text-amber-400 text-base">₹{b.totalAmount.toLocaleString()}</span>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
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
