'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, Users, CheckCircle2, ArrowRight, Star, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-24 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Certified Excellence</span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 leading-[1.15]">
                Learn to Drive with <span className="text-amber-400">Professional</span> Confidence
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Safe, proven-line training for first-time drivers. Our pedagogical approach ensures not just a pass, but a lifetime of road safety and competence.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  href="/courses"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-8 py-4 rounded-xl flex items-center justify-center gap-3 text-sm shadow-xl shadow-amber-500/20 hover:-translate-y-0.5 transition-all"
                >
                  <span>Explore All Programs</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/fleet"
                  className="border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-200 font-bold px-7 py-4 rounded-xl flex items-center justify-center text-sm transition"
                >
                  View Vehicle Fleet
                </Link>
              </div>

              <div className="pt-6 border-t border-slate-800/80 flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Dual Control Pedals</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Certified Instructors</span>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Image Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
                <Image
                  src="/images/hero.jpg"
                  alt="Professional Driving Lesson"
                  width={700}
                  height={450}
                  className="w-full h-[400px] sm:h-[460px] object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                <div className="absolute bottom-6 left-6 right-6 p-5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Student Success Rate</span>
                    <p className="font-heading font-extrabold text-2xl text-slate-100">98% First Attempt Pass</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-bold">
                    ★ 5.0
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. TRUST BADGES / STATS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Clock, value: '15+ Years', label: 'Instruction Experience', desc: 'Proven safety pedagogy since 2011' },
            { icon: Award, value: '98% Pass Rate', label: 'Success Ratio', desc: 'First-time licensing exam pass rate' },
            { icon: Users, value: '5000+ Students', label: 'Trained & Licensed', desc: 'Graduates driving safely across NY' },
            { icon: ShieldCheck, value: 'ISO 9001:2026', label: 'Quality Standards', desc: 'Certified safety & maintenance' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-6 rounded-2xl transition-all group"
            >
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <stat.icon className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-2xl text-slate-100">{stat.value}</h3>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mt-1">{stat.label}</p>
              <p className="text-xs text-slate-400 mt-2">{stat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. PATHWAY TO PROFESSIONALISM / SERVICES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Structured Learning Modules</span>
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-100 mt-2">
                The Pathway to Professionalism
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                Modules designed to build skill progressively, from basic vehicle orientation to complex night driving and highway merging.
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:underline shrink-0"
            >
              <span>Explore all services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1 */}
            <motion.div
              whileHover={{ y: -6 }}
              className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden group flex flex-col"
            >
              <div className="h-56 relative overflow-hidden">
                <Image
                  src="/images/hero_driving_lesson_1785513694392.jpg"
                  alt="License Courses"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">
                    Comprehensive
                  </span>
                  <h3 className="font-heading font-extrabold text-xl text-slate-100 mt-3">License Courses</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Packages from beginner to advanced maneuvers. Includes mock RTO exams, parallel parking mastery, and defensive driving.
                  </p>
                </div>
                <Link href="/courses" className="inline-flex items-center gap-2 text-xs font-bold text-slate-200 group-hover:text-amber-400 transition">
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ y: -6 }}
              className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden group flex flex-col"
            >
              <div className="h-56 relative overflow-hidden">
                <Image
                  src="/images/fleet_verna_1785513736403.jpg"
                  alt="Vehicle Fleet"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">
                    Safety Fleet
                  </span>
                  <h3 className="font-heading font-extrabold text-xl text-slate-100 mt-3">Vehicle Fleet</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Modern, dual-control vehicles equipped with certified instructor pedals, blind-spot sensors, and rear cameras.
                  </p>
                </div>
                <Link href="/fleet" className="inline-flex items-center gap-2 text-xs font-bold text-slate-200 group-hover:text-amber-400 transition">
                  <span>View Fleet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 4. TESTIMONIALS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Verified Student Alumni</span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-100 mt-2">
            Success Stories
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Hear from our recently licensed alumni about their journey to confident driving.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-slate-900 border border-slate-800 p-8 sm:p-12 rounded-3xl max-w-3xl mx-auto text-left relative"
        >
          <div className="flex gap-1 text-amber-400 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>

          <p className="text-base sm:text-lg text-slate-200 italic leading-relaxed">
            “The instructors at DriveSuccess Academy are incredibly patient. I was a very nervous driver, but they broke down every parallel park and highway merge into manageable steps. Passed my license test on my first attempt!”
          </p>

          <div className="mt-8 flex items-center gap-4 pt-6 border-t border-slate-800">
            <Image
              src="/images/student_alex_1785513764126.jpg"
              alt="Sarah Jenkins"
              width={52}
              height={52}
              className="rounded-full object-cover border-2 border-amber-400"
            />
            <div>
              <h4 className="font-heading font-bold text-slate-100 text-base">Sarah Jenkins</h4>
              <p className="text-xs text-slate-400">First-Time Licensee • Essential Program Graduate</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 5. CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-10 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="space-y-3 text-center md:text-left z-10 max-w-xl">
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-100">
              Start Your Driving Journey Today
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Flexible scheduling across 12 academy locations. Morning, afternoon, and weekend slots available with certified senior instructors.
            </p>
          </div>

          <Link
            href="/courses"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-8 py-4 rounded-xl flex items-center gap-3 text-sm shadow-xl shadow-amber-500/20 shrink-0 hover:scale-105 transition-all z-10"
          >
            <span>Explore Programs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
