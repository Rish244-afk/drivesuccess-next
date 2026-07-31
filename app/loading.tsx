import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 px-4">
      {/* Animated Brand Badge */}
      <div className="relative">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-3xl flex items-center justify-center animate-pulse">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="absolute inset-0 rounded-3xl bg-amber-500/20 blur-xl animate-ping opacity-30" />
      </div>

      {/* Loading Skeletons */}
      <div className="w-full max-w-md space-y-3 text-center">
        <div className="h-4 bg-slate-800 rounded-full w-3/4 mx-auto animate-pulse" />
        <div className="h-3 bg-slate-900 rounded-full w-1/2 mx-auto animate-pulse" />
      </div>

      {/* Cards Skeleton Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 space-y-3">
            <div className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />
            <div className="h-4 bg-slate-800/80 rounded w-2/3 animate-pulse" />
            <div className="h-3 bg-slate-900 rounded w-1/2 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
