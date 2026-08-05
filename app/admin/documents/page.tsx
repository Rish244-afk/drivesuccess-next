import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession, getAdminDocumentsAction } from '@/actions/admin';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminDocumentsClient } from '@/components/admin/AdminDocumentsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Documents | Admin Control Center',
  description: 'Review and verify uploaded RTO and legal documents from students.',
};

export default async function AdminDocumentsPage() {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    redirect('/admin/login');
  }

  const { success, data } = await getAdminDocumentsAction();
  const documents = data || [];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-20">
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 space-y-8">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-slate-900">
            Student <em className="italic text-blue-600 font-normal">Documents Review</em>
          </h1>
          <p className="text-slate-500 font-light mt-2 max-w-2xl text-sm">
            Review uploaded Government IDs, RTO Form 20, Learner Licenses, and Medical Certificates. Ensure legitimacy before verifying.
          </p>
        </div>

        <AdminDocumentsClient documents={documents} />
      </div>
    </div>
  );
}
