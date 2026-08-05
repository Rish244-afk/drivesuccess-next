'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AppleScrollCanvasSequence } from '@/components/ui/AppleScrollCanvasSequence';
import { Magnetic } from '@/components/ui/Magnetic';

export default function ShowcasePage() {
  return (
    <div className="space-y-0 mesh-gradient-slow text-slate-900 overflow-hidden min-h-screen">
      
      {/* Hero Intro Header */}
      <section className="h-[75vh] flex flex-col items-center justify-center text-center px-6 relative">
        {/* Ambient lighting blobs */}
        <div aria-hidden="true" className="absolute top-0 left-1/4 -translate-x-1/2 w-[700px] h-[350px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div aria-hidden="true" className="absolute bottom-0 right-1/4 translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)', filter: 'blur(55px)' }} />

        {/* Floating rings */}
        <div aria-hidden="true" className="hidden lg:block absolute top-[15%] right-[8%] w-16 h-16 rounded-full border border-blue-200/25 float-ring" />
        <div aria-hidden="true" className="hidden lg:block absolute bottom-[15%] left-[8%] w-12 h-12 rounded-full border border-purple-200/20 float-ring-slow" />

        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-300/80 text-blue-600 text-xs font-semibold tracking-widest uppercase bg-white/70 backdrop-blur-md shadow-premium-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Apple AirPods-Style Canvas Engine</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-900 tracking-tight leading-tight">
            Precision in <em className="italic text-blue-600 font-normal">Motion</em>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 font-light max-w-xl mx-auto leading-relaxed">
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

      {/* Premium CTA Outro Band */}
      <section className="relative py-32 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 45%, #7C3AED 100%)' }}
      >
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
        />

        <div aria-hidden="true" className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.30) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div aria-hidden="true" className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', filter: 'blur(80px)' }} />

        <div aria-hidden="true" className="hidden lg:block absolute top-8 left-[10%] w-32 h-32 rounded-full border border-white/10 float-ring" />
        <div aria-hidden="true" className="hidden lg:block absolute bottom-8 right-[10%] w-20 h-20 rounded-full border border-white/10 float-ring-slow" />

        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8 relative z-10 font-sans">
          <div className="mx-auto max-w-3xl rounded-3xl p-10 sm:p-14 relative"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <h2 className="font-serif text-[clamp(2.4rem,6vw,4rem)] font-normal text-white tracking-tight leading-[1.05] mb-6">
              Ready to Experience <em className="italic font-normal" style={{ color: 'rgba(167,243,208,0.95)' }}>DriveSuccess</em>?
            </h2>
            <p className="text-lg text-white/80 font-light max-w-xl mx-auto leading-relaxed mb-10">
              Book your session online with instant instructor and dual-control vehicle selection.
            </p>

            <Magnetic range={35} strength={0.4}>
              <Link
                href="/book"
                className="group relative overflow-hidden bg-white text-blue-700 font-bold text-xs uppercase tracking-widest px-12 py-5 rounded-full inline-flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  boxShadow: '0 8px 32px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,1)',
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/60 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative">Reserve Your Session</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative" />
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>

    </div>
  );
}
