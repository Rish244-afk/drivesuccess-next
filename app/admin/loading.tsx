import React from 'react';
import { StatCardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-white text-slate-900 space-y-12 pb-20">
      <div className="h-16 bg-slate-50 border-b border-slate-200" />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
        <div className="space-y-3 border-b border-slate-200/80 pb-8">
          <div className="w-48 h-5 bg-slate-100 rounded-full animate-pulse" />
          <div className="w-72 h-10 bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <StatCardSkeleton count={4} />
        <TableSkeleton rows={8} cols={4} />
      </div>
    </div>
  );
}
