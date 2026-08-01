'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, Users, CheckCircle2, ArrowRight, Star, Clock, Car, SlidersHorizontal } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-0">
      
      {/* 1. HERO SECTION (Deep Navy) */}
      <section className="relative overflow-hidden bg-[#0A1128] py-24 lg:py-32 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-7 space-y-8"
            >
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-amber-400/30 text-amber-400 text-xs font-medium tracking-widest uppercase bg-amber-400/5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Certified Driving Pedagogy</span>
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-100 leading-[1.1] tracking-tight">
                Learn to Drive with <em className="italic text-amber-400 font-normal">Confidence</em>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed max-w-xl">
                Structured sensor-assisted instruction for new drivers. Our patient pedagogical methodology builds long-term competence, road safety, and stress-free license certification.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 pt-4">
                <Link
                  href="/book"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 hover:scale-[1.02] transition-all"
                >
                  <span>Reserve Training Session</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/courses"
                  className="border border-slate-700/80 hover:border-slate-500 text-slate-200 font-medium text-xs uppercase tracking-wider px-7 py-4 rounded-full flex items-center justify-center transition"
                >
                  Explore Curriculum
                </Link>
              </div>

              <div className="pt-8 border-t border-slate-800/80 flex items-center gap-8 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-serif text-base italic">✓</span>
                  <span>Dual Control Pedals</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-serif text-base italic">✓</span>
                  <span>RTO Approved Tracks</span>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Image Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl group">
                <Image
                  src="/images/hero.jpg"
                  alt="Professional Driving Lesson"
                  width={700}
                  height={500}
                  className="w-full h-[440px] lg:h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128] via-transparent to-transparent opacity-80" />
                
                <div className="absolute bottom-6 left-6 right-6 p-6 bg-[#070B19]/90 backdrop-blur-md border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">RTO First Attempt Rate</span>
                    <p className="font-serif text-2xl text-slate-100 font-normal mt-0.5">98.4% <em className="italic text-amber-400 font-normal">Success</em></p>
                  </div>
                  <div className="text-right font-serif text-xl italic text-amber-400">
                    ★ 5.0 Rated
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. STAT BAND (3-Column Minimal Numbers, No Icons, No Borders) */}
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

      {/* 3. ALTERNATING LIGHT SECTION: WHY DRIVESUCCESS (Warm Off-White #FAF8F3) */}
      <section className="bg-[#FAF8F3] text-slate-900 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">
              Pedagogical Standards
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-normal text-slate-900 tracking-tight leading-tight">
              Designed for Stress-Free <em className="italic text-amber-500 font-normal">Mastery</em>
            </h2>
            <p className="text-base text-slate-600 font-light leading-relaxed">
              We replace anxiety with structured practice. Every training module is engineered to build muscle memory, spatial awareness, and calm decision-making.
            </p>
          </div>

          {/* Feature Cards: Thin stroke Lucide icons + bold short headline + 1-sentence description, minimal borders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="space-y-4 border-l border-slate-300/80 pl-6 py-2">
              <ShieldCheck className="w-7 h-7 text-amber-500 stroke-[1.25]" />
              <h3 className="font-serif text-2xl text-slate-900 font-normal">
                Dual-Control Safety
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-light">
                Every vehicle features instructor dual-pedal overrides, ensuring instant safety intervention during real traffic sessions.
              </p>
            </div>

            <div className="space-y-4 border-l border-slate-300/80 pl-6 py-2">
              <SlidersHorizontal className="w-7 h-7 text-amber-500 stroke-[1.25]" />
              <h3 className="font-serif text-2xl text-slate-900 font-normal">
                Tailored Progression
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-light">
                Progress from private track maneuvering to main-road navigation at a pace tailored specifically to your comfort level.
              </p>
            </div>

            <div className="space-y-4 border-l border-slate-300/80 pl-6 py-2">
              <Award className="w-7 h-7 text-amber-500 stroke-[1.25]" />
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

      {/* 4. CURRICULUM HIGHLIGHTS (Deep Navy) */}
      <section className="bg-[#0A1128] py-24 lg:py-32 border-t border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="max-w-2xl space-y-4">
              <span className="text-xs font-medium uppercase tracking-widest text-amber-400">
                Curriculum Programs
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl font-normal text-slate-100 tracking-tight">
                Curated Training <em className="italic text-amber-400 font-normal">Packages</em>
              </h2>
            </div>
            <Link
              href="/courses"
              className="text-xs font-semibold uppercase tracking-widest text-amber-400 hover:underline flex items-center gap-2"
            >
              <span>View All 7 Programs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Package 1 */}
            <div className="bg-[#070B19] border border-slate-800/80 hover:border-amber-400/40 p-8 rounded-2xl space-y-6 transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold border border-amber-400/30 px-3 py-1 rounded-full">
                  Most Popular
                </span>
                <span className="font-serif text-2xl text-amber-400">₹5,000</span>
              </div>
              <div>
                <h3 className="font-serif text-2xl text-slate-100 font-normal group-hover:text-amber-400 transition-colors">
                  4 Wheeler License
                </h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed mt-2">
                  10 comprehensive 1-on-1 practical driving sessions + mock RTO exam track prep.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <li>• 10 Practical Road Sessions</li>
                <li>• Clutch & Hill-Start Mastery</li>
                <li>• RTO Track Mock Exam</li>
              </ul>
              <Link
                href="/book"
                className="block text-center w-full py-3 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-400 text-xs uppercase tracking-widest font-semibold rounded-full transition"
              >
                Select Program
              </Link>
            </div>

            {/* Package 2 */}
            <div className="bg-[#070B19] border border-slate-800/80 hover:border-amber-400/40 p-8 rounded-2xl space-y-6 transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold border border-slate-800 px-3 py-1 rounded-full">
                  Dual Vehicle
                </span>
                <span className="font-serif text-2xl text-amber-400">₹7,500</span>
              </div>
              <div>
                <h3 className="font-serif text-2xl text-slate-100 font-normal group-hover:text-amber-400 transition-colors">
                  Combo (2W + 4W)
                </h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed mt-2">
                  16 practical sessions covering both gear motorcycle balance and 4-wheeler driving.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <li>• 16 Dual Vehicle Sessions</li>
                <li>• Motorcycle Balance & Braking</li>
                <li>• Complete RTO Processing</li>
              </ul>
              <Link
                href="/book"
                className="block text-center w-full py-3 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-400 text-xs uppercase tracking-widest font-semibold rounded-full transition"
              >
                Select Program
              </Link>
            </div>

            {/* Package 3 */}
            <div className="bg-[#070B19] border border-slate-800/80 hover:border-amber-400/40 p-8 rounded-2xl space-y-6 transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold border border-slate-800 px-3 py-1 rounded-full">
                  Refresher
                </span>
                <span className="font-serif text-2xl text-amber-400">₹4,200</span>
              </div>
              <div>
                <h3 className="font-serif text-2xl text-slate-100 font-normal group-hover:text-amber-400 transition-colors">
                  License Renewal
                </h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed mt-2">
                  8 targeted sessions to rebuild confidence for drivers returning to traffic after a gap.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <li>• 8 Heavy-Traffic Sessions</li>
                <li>• Highway Merging Practice</li>
                <li>• Paperwork Renewal Support</li>
              </ul>
              <Link
                href="/book"
                className="block text-center w-full py-3 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-400 text-xs uppercase tracking-widest font-semibold rounded-full transition"
              >
                Select Program
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 5. CTA BAND (Full-width Navy section, Centered Serif heading with italic accent word, Single Amber Button) */}
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
