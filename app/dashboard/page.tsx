import React from 'react';
import { getStudentProfileDataAction } from '@/actions/profile';
import { StudentDashboardClient } from '@/components/dashboard/StudentDashboardClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Dashboard | DriveSuccess Academy',
  description: 'Manage upcoming driving bookings, completed sessions, payment history, RTO documents, and skill matrix.',
};

export default async function DashboardPage() {
  // Server-side authentication and scope restriction: student can ONLY access own data
  const data = await getStudentProfileDataAction();

  if (!data.success || !data.student) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center text-slate-400">
        <p>Failed to load profile. Please login again.</p>
      </div>
    );
  }

  return (
    <StudentDashboardClient
      student={data.student}
      bookings={data.bookings}
      sessions={data.sessions}
      metrics={data.metrics}
    />
  );
}
