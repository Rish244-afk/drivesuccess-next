import React from 'react';
import { StatCardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 space-y-12 bg-white min-h-screen">
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-12 space-y-4">
        <div className="w-48 h-6 bg-slate-100 rounded-full animate-pulse" />
        <div className="w-1/2 h-10 bg-slate-100 rounded-xl animate-pulse" />
      </div>

      <StatCardSkeleton count={3} />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
