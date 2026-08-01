import React from 'react';
import { StatCardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 space-y-12 pb-20">
      <div className="h-16 bg-[#070B19] border-b border-slate-800/80" />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
        <div className="space-y-3 border-b border-slate-800/60 pb-8">
          <div className="w-48 h-5 bg-slate-800/80 rounded-full animate-pulse" />
          <div className="w-72 h-10 bg-slate-800/80 rounded-xl animate-pulse" />
        </div>
        <StatCardSkeleton count={4} />
        <TableSkeleton rows={8} cols={4} />
      </div>
    </div>
  );
}
