import React from 'react';
import { VehicleCardSkeleton } from '@/components/ui/Skeleton';

export default function FleetLoading() {
  return (
    <div className="space-y-0 overflow-hidden bg-[#FAF8F3]">
      <section className="bg-[#0A1128] py-24 lg:py-32 border-b border-slate-800/60 text-center">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6">
          <div className="w-48 h-6 bg-slate-800/80 rounded-full mx-auto animate-pulse" />
          <div className="w-3/4 h-16 bg-slate-800/80 rounded-2xl mx-auto animate-pulse" />
        </div>
      </section>

      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <VehicleCardSkeleton count={4} />
        </div>
      </section>
    </div>
  );
}
