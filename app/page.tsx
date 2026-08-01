'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, Users, CheckCircle2, ArrowRight, Star, Clock, Car, SlidersHorizontal } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-0">
      
      {/* 1. ELEGANT CINEMATIC HERO SECTION (Content Above, Full-Width Video Below) */}
      <section className="bg-[#0A1128] pt-24 pb-24 lg:pt-32 lg:pb-32 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          
          {/* Top Centered Editorial Content */}
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-amber-400/30 text-amber-400 text-xs font-medium tracking-widest uppercase bg-amber-400/5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Certified Driving Pedagogy</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-100 leading-[1.1] tracking-tight"
            >
              Learn to Drive with <em className="italic text-amber-400 font-normal">Confidence</em>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto"
            >
              Safe, structured instruction for first-time drivers. Our patient pedagogical methodology builds long-term competence, road safety, and stress-free license certification.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-2"
            >
              <Link
                href="/book"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-9 py-4 rounded-full flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/10 hover:scale-[1.02] transition-all"
              >
                <span>Reserve Training Session</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/courses"
                className="border border-slate-700/80 hover:border-slate-500 text-slate-200 font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full flex items-center justify-center transition"
              >
                Explore Curriculum
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-4 flex items-center justify-center gap-10 text-xs text-slate-400 font-medium"
            >
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-serif text-base italic">✓</span>
                <span>Dual Control Pedals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-serif text-base italic">✓</span>
                <span>ISO 9001 Certified Fleet</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-serif text-base italic">✓</span>
                <span>98.4% Pass Rate</span>
              </div>
            </motion.div>
          </div>

          {/* Full-Width Seamless Cinematic Video Showcase (Zero Controls, Pure Luxury) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative rounded-3xl overflow-hidden border border-slate-800/80 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] bg-[#070B19]"
          >
            <video
              src="/videos/swift.mp4"
              poster="/images/swift.jpg"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-[450px] sm:h-[600px] lg:h-[680px] object-cover"
            />
            
            {/* Subtle Gradient Shadow Base */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128]/80 via-transparent to-transparent pointer-events-none" />
          </motion.div>

        </div>
      </section>

      {/* 2. STAT BAND */}
      <section className="bg-[#070B19] py-20 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800/60">
            
            <div className="space-y-2 py-4 md:py-0">
              <p className="font-serif text-5xl sm:text-6xl text-slate-100 font-normal tracking-tight">
                2,400<em className="italic text-amber-400 font-normal">+</em>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                Students Certified
              </p>
            </div>

            <div className="space-y-2 py-4 md:py-0">
              <p className="font-serif text-5xl sm:text-6xl text-slate-100 font-normal tracking-tight">
                12<em className="italic text-amber-400 font-normal">Years</em>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                Pedagogical Experience
              </p>
            </div>

            <div className="space-y-2 py-4 md:py-0">
              <p className="font-serif text-5xl sm:text-6xl text-slate-100 font-normal tracking-tight">
                98.4<em className="italic text-amber-400 font-normal">%</em>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                First Attempt Pass Rate
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. ALTERNATING LIGHT SECTION: PEDAGOGY STANDARDS (#FAF8F3) */}
      <section className="bg-[#FAF8F3] text-slate-900 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">
              Pedagogical Standards
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-normal text-slate-900 tracking-tight leading-tight">
              Designed for Stress-Free <em className="italic text-amber-600 font-normal">Mastery</em>
            </h2>
            <p className="text-base text-slate-600 font-light leading-relaxed">
              We replace anxiety with structured practice. Every training module is engineered to build muscle memory, spatial awareness, and calm decision-making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="space-y-4 border-l border-slate-300/80 pl-6 py-2">
              <ShieldCheck className="w-7 h-7 text-amber-600 stroke-[1.25]" />
              <h3 className="font-serif text-2xl text-slate-900 font-normal">
                Dual-Control Safety
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-light">
                Every vehicle features instructor dual-pedal overrides, ensuring instant safety intervention during real traffic sessions.
              </p>
            </div>

            <div className="space-y-4 border-l border-slate-300/80 pl-6 py-2">
              <SlidersHorizontal className="w-7 h-7 text-amber-600 stroke-[1.25]" />
              <h3 className="font-serif text-2xl text-slate-900 font-normal">
                Tailored Progression
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-light">
                Progress from private track maneuvering to main-road navigation at a pace tailored specifically to your comfort level.
              </p>
            </div>

            <div className="space-y-4 border-l border-slate-300/80 pl-6 py-2">
              <Award className="w-7 h-7 text-amber-600 stroke-[1.25]" />
              <h3 className="font-serif text-2xl text-slate-900 font-normal">
                RTO Exam Fast-Track
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-light">
                Full documentation assistance and mock driver tests covering track parallel parking, H-tracks, and gradient starts.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. CTA BAND */}
      <section className="bg-[#070B19] py-28 text-center border-t border-slate-800/60">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8">
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-slate-100 tracking-tight leading-tight">
            Your Journey to <em className="italic text-amber-400 font-normal">Freedom</em> Starts Today
          </h2>
          <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Reserve your preferred training vehicle, instructor, and schedule online in under 2 minutes.
          </p>
          <div className="pt-2">
            <Link
              href="/book"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-9 py-4 rounded-full inline-flex items-center gap-2 shadow-xl shadow-amber-500/10 hover:scale-[1.02] transition-all"
            >
              <span>Reserve Your Session Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
