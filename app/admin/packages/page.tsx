import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/actions/admin';
import { getPackagesAction } from '@/actions/package';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminPackagesClient } from '@/components/admin/AdminPackagesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Packages (CRUD) | Admin Control',
  description: 'Create, update, and delete package offerings.',
};

export default async function AdminPackagesPage() {
  const adminSession = await getAdminSession();
  if (!adminSession) redirect('/admin/login');

  const packagesRes = await getPackagesAction();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 space-y-8 pb-16">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="font-heading font-extrabold text-3xl text-slate-100">Package Offerings (CRUD)</h1>
          <p className="text-xs text-slate-400 mt-1">Manage driving lesson packages, session counts, and prices.</p>
        </div>

        <AdminPackagesClient initialPackages={packagesRes.data || []} />
      </div>
    </div>
  );
}
