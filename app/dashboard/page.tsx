import React from 'react';
import { getStudentProfileDataAction } from '@/actions/profile';
import { StudentDashboardClient } from '@/components/dashboard/StudentDashboardClient';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Student Dashboard | Vahathi Motor Driving School',
  description: 'Manage upcoming driving bookings, completed sessions, payment history, RTO documents, and skill matrix.',
};

export default async function DashboardPage() {
  // Server-side authentication and scope restriction: student can ONLY access own data
  const data = await getStudentProfileDataAction();

  if (!data.success || !data.student) {
    redirect('/auth/login?from=/dashboard');
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
