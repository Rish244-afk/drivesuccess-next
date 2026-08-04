'use client';

import React from 'react';

interface CssLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'full';
  label?: string;
  className?: string;
}

export function CssLoader({ size = 'md', label = 'Loading...', className = '' }: CssLoaderProps) {
  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 css-loader-ring shrink-0" />
        {label && <span className="text-xs text-slate-300 font-medium">{label}</span>}
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 p-4 ${className}`}>
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 css-loader-ring" />
          <div className="absolute inset-1 css-loader-ring-inner" />
          <div className="w-2.5 h-2.5 bg-amber-400 rounded-full css-loader-glow shadow-md shadow-amber-500/50" />
        </div>
        {label && <span className="text-xs text-amber-400 font-semibold tracking-wider uppercase">{label}</span>}
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 p-8 ${className}`}>
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 css-loader-ring border-4" />
          <div className="absolute inset-2 css-loader-ring-inner border-3" />
          <div className="w-4 h-4 bg-amber-400 rounded-full css-loader-glow shadow-lg shadow-amber-500/60" />
        </div>
        {label && (
          <div className="space-y-1.5 text-center">
            <p className="text-xs font-bold text-slate-200 uppercase tracking-widest">{label}</p>
            <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 css-loader-bar rounded-full" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full Screen / Section Overlay Loader
  return (
    <div className={`min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-6 select-none ${className}`}>
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Outer Glowing Ring */}
        <div className="absolute inset-0 css-loader-ring border-4 shadow-2xl shadow-amber-500/20" />
        {/* Inner Counter-Rotating Ring */}
        <div className="absolute inset-2.5 css-loader-ring-inner border-3" />
        {/* Center Pulsing Speedometer Emblem */}
        <div className="w-6 h-6 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full css-loader-glow flex items-center justify-center shadow-lg shadow-amber-500/50">
          <span className="font-serif text-[10px] text-slate-950 font-bold italic">V</span>
        </div>
      </div>

      <div className="space-y-2 text-center max-w-xs">
        <span className="text-[10px] uppercase tracking-[0.25em] text-amber-400 font-extrabold block">
          Vahathi Driving Platform
        </span>
        <h3 className="font-serif text-lg text-slate-100 font-normal italic">
          {label}
        </h3>
        <div className="w-44 h-1 bg-slate-900 border border-slate-800 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 css-loader-bar rounded-full" />
        </div>
      </div>
    </div>
  );
}
