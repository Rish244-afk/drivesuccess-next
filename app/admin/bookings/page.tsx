import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession, getAdminBookingsAction } from '@/actions/admin';
import { getBookingInstructorsAction, getBookingVehiclesAction } from '@/actions/bookingSystem';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminBookingsClient } from '@/components/admin/AdminBookingsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bookings & Instructor Assignment | Admin Control',
  description: 'Manage bookings, assign instructors and vehicles, update status.',
};

export default async function AdminBookingsPage() {
  const adminSession = await getAdminSession();
  if (!adminSession) redirect('/admin/login');

  const [bookingsRes, instRes, vehRes] = await Promise.all([
    getAdminBookingsAction(),
    getBookingInstructorsAction(),
    getBookingVehiclesAction(),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 space-y-8 pb-16">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="font-heading font-extrabold text-3xl text-slate-100">Bookings & Assignment Control</h1>
          <p className="text-xs text-slate-400 mt-1">Assign instructors, vehicles, and manage payment & booking statuses.</p>
        </div>

        <AdminBookingsClient
          initialBookings={bookingsRes.data || []}
          allInstructors={instRes.data || []}
          allVehicles={vehRes.data || []}
        />
      </div>
    </div>
  );
}
