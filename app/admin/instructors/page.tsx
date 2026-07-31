import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/actions/admin';
import { getBookingInstructorsAction } from '@/actions/bookingSystem';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminInstructorsClient } from '@/components/admin/AdminInstructorsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Instructors (CRUD) | Admin Control',
  description: 'Manage academy instructors, ratings, and specialties.',
};

export default async function AdminInstructorsPage() {
  const adminSession = await getAdminSession();
  if (!adminSession) redirect('/admin/login');

  const instructorsRes = await getBookingInstructorsAction();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 space-y-8 pb-16">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="font-heading font-extrabold text-3xl text-slate-100">Academy Instructors (CRUD)</h1>
          <p className="text-xs text-slate-400 mt-1">Manage certified driving instructors, specialties, and contact info.</p>
        </div>

        <AdminInstructorsClient initialInstructors={instructorsRes.data || []} />
      </div>
    </div>
  );
}
