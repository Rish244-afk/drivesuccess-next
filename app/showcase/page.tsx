'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AppleScrollCanvasSequence } from '@/components/ui/AppleScrollCanvasSequence';

export default function ShowcasePage() {
  return (
    <div className="space-y-0 bg-white text-slate-900 overflow-hidden">
      
      {/* Hero Intro Header */}
      <section className="h-[75vh] flex flex-col items-center justify-center text-center px-6 border-b border-slate-200/80 relative">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-300 text-blue-600 text-xs font-medium tracking-widest uppercase bg-blue-50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apple AirPods-Style Canvas Engine</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-900 tracking-tight leading-tight">
            Precision in <em className="italic text-blue-600 font-normal">Motion</em>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-light max-w-xl mx-auto leading-relaxed">
            Scroll down to scrub through the 60fps sequential canvas animation frame-by-frame, perfectly pinned and synchronized with scroll position.
          </p>

          <div className="pt-4 text-xs font-mono uppercase tracking-widest text-blue-600 animate-bounce">
            ↓ Scroll Down to Scrub Sequence
          </div>
        </div>
      </section>

      {/* Main Apple-Style Canvas Scroll Sequence Section */}
      <AppleScrollCanvasSequence
        totalFrames={60}
        framePathPattern={(i) => `/frames/frame_${String(i + 1).padStart(4, '0')}.jpg`}
        fallbackPoster="/images/swift.jpg"
      />

      <section className="h-[75vh] flex flex-col items-center justify-center text-center px-6 border-t border-slate-200/80 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden font-sans">
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="max-w-3xl space-y-8 relative z-10">
          <h2 className="font-serif text-4xl sm:text-5xl font-normal text-white tracking-tight">
            Ready to Experience <em className="italic text-white/90 font-normal">DriveSuccess</em>?
          </h2>
          <p className="text-base text-white/80 font-light max-w-xl mx-auto">
            Book your session online with instant instructor and dual-control vehicle selection.
          </p>
          <Link
            href="/book"
            className="bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-widest px-9 py-4 rounded-full inline-flex items-center gap-2 shadow-xl shadow-black/10 hover:scale-[1.02] transition-all"
          >
            <span>Reserve Your Session</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
