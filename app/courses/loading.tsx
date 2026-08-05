import React from 'react';
import { CourseCardSkeleton } from '@/components/ui/Skeleton';

export default function CoursesLoading() {
  return (
    <div className="space-y-0 overflow-hidden bg-white">
      <section className="py-24 lg:py-32 border-b border-slate-200/80 text-center">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6">
          <div className="w-48 h-6 bg-slate-100 rounded-full mx-auto animate-pulse" />
          <div className="w-3/4 h-16 bg-slate-100 rounded-2xl mx-auto animate-pulse" />
          <div className="w-1/2 h-6 bg-slate-100 rounded-xl mx-auto animate-pulse" />
        </div>
      </section>

      <section className="py-24 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <CourseCardSkeleton count={6} />
        </div>
      </section>
    </div>
  );
}
