import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/actions/admin';
import { getVehiclesAction } from '@/actions/vehicle';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminVehiclesClient } from '@/components/admin/AdminVehiclesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Vehicles (CRUD) | Admin Control',
  description: 'Manage vehicle fleet, transmission types, rates, and availability.',
};

export default async function AdminVehiclesPage() {
  const adminSession = await getAdminSession();
  if (!adminSession) redirect('/admin/login');

  const vehiclesRes = await getVehiclesAction();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 space-y-8 pb-16">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="font-heading font-extrabold text-3xl text-slate-100">Learning Fleet (CRUD)</h1>
          <p className="text-xs text-slate-400 mt-1">Manage vehicles, transmission options, plate numbers, and rates.</p>
        </div>

        <AdminVehiclesClient initialVehicles={vehiclesRes.data || []} />
      </div>
    </div>
  );
}
