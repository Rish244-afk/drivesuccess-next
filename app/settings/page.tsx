import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getStudentProfileDataAction } from '@/actions/profile';
import { ProfileSettingsView } from '@/components/dashboard/ProfileSettingsView';

export const metadata: Metadata = {
  title: 'Account Settings | DriveSuccess Academy',
  description: 'Manage personal profile details, contact preferences, and privacy settings.',
};

export default async function SettingsPage() {
  const data = await getStudentProfileDataAction();

  if (!data.success || !data.student) {
    redirect('/auth/login?from=/settings');
  }

  return <ProfileSettingsView student={data.student} />;
}
