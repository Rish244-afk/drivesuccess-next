'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ShieldCheck, Award, Users, CheckCircle2, ArrowRight, Star, Clock, Car, SlidersHorizontal, Sparkles, ChevronDown } from 'lucide-react';

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement | null>(null);

  // Framer Motion Scroll Progress Hooks
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Scroll Transforms for Awwwards-tier Parallax & Zoom Effects
  const videoScale = useTransform(smoothProgress, [0, 0.8], [1, 1.05]);
  const videoY = useTransform(smoothProgress, [0, 1], [0, 60]);
  const textY = useTransform(smoothProgress, [0, 0.8], [0, -50]);
  const opacity = useTransform(smoothProgress, [0, 0.7], [1, 0.2]);

  // Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 40, rotateX: -30 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { type: 'spring' as const, stiffness: 200, damping: 20 },
    },
  };

  return (
    <div className="space-y-0 overflow-hidden bg-[#0A1128]">
      
      {/* 1. AWWWARDS-TIER ANIMATED HERO & PARALLAX VIDEO SECTION */}
      <section ref={heroRef} className="relative pt-20 pb-24 lg:pt-28 lg:pb-36 border-b border-slate-800/60 overflow-hidden">
        
        {/* Dynamic Ambient Light Rays */}
        <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16 relative z-10">
          
          {/* Top Kinetic Editorial Content */}
          <motion.div
            style={{ y: textY, opacity }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-5xl mx-auto space-y-8"
          >
            {/* Animated Badge */}
            <motion.div variants={wordVariants} className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-amber-400/30 text-amber-400 text-xs font-medium tracking-widest uppercase bg-amber-400/5 backdrop-blur-md shadow-inner">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Certified Automotive Pedagogy</span>
            </motion.div>

            {/* Giant Kinetic Heading with Staggered Word Motion */}
            <motion.h1
              variants={wordVariants}
              className="font-serif text-6xl sm:text-7xl lg:text-8xl font-normal text-slate-100 leading-[1.05] tracking-tight"
            >
              Learn to Drive with{' '}
              <span className="relative inline-block">
                <em className="italic text-amber-400 font-normal">Confidence</em>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="absolute bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={wordVariants}
              className="text-lg sm:text-xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto"
            >
              Safe, structured instruction for first-time drivers. Our patient pedagogical methodology builds long-term competence, road safety, and stress-free license certification.
            </motion.p>

            {/* Interactive Magnetic CTA Buttons */}
            <motion.div variants={wordVariants} className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
              <Link
                href="/book"
                className="group relative bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-10 py-4.5 rounded-full flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(245,158,11,0.25)] hover:scale-105 transition-all duration-300"
              >
                <span>Reserve Training Session</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/courses"
                className="border border-slate-700/80 hover:border-slate-400 bg-slate-900/40 hover:bg-slate-900 text-slate-200 font-medium text-xs uppercase tracking-wider px-9 py-4.5 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300"
              >
                Explore Curriculum
              </Link>
            </motion.div>

            {/* Feature Check Badges */}
            <motion.div
              variants={wordVariants}
              className="pt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-xs text-slate-400 font-medium"
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
          </motion.div>

          {/* Full-Width Parallax Video Showcase with Edge Watermark Crop Scale */}
          <motion.div
            style={{ scale: videoScale, y: videoY }}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative rounded-3xl overflow-hidden border border-slate-700/60 shadow-[0_35px_90px_-20px_rgba(0,0,0,0.95)] bg-[#070B19] group"
          >
            <video
              src="/videos/swift.mp4"
              poster="/images/swift.jpg"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-[480px] sm:h-[620px] lg:h-[720px] object-cover scale-[1.12] origin-center transition-transform duration-1000"
            />
            
            {/* Top & Bottom Vignette Overlays to Crop & Seamlessly Blend Edge Watermarks */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0A1128] to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0A1128] via-[#0A1128]/60 to-transparent pointer-events-none z-10" />
          </motion.div>

        </div>
      </section>

      {/* 2. STAT BAND (3-Column Minimal Numbers with Animated Counter Reveal) */}
      <section className="bg-[#070B19] py-24 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800/60">
            
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-2 py-4 md:py-0 transition-transform cursor-default"
            >
              <p className="font-serif text-5xl sm:text-6xl text-slate-100 font-normal tracking-tight">
                2,400<em className="italic text-amber-400 font-normal">+</em>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                Students Certified
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-2 py-4 md:py-0 transition-transform cursor-default"
            >
              <p className="font-serif text-5xl sm:text-6xl text-slate-100 font-normal tracking-tight">
                12<em className="italic text-amber-400 font-normal">Years</em>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                Pedagogical Experience
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-2 py-4 md:py-0 transition-transform cursor-default"
            >
              <p className="font-serif text-5xl sm:text-6xl text-slate-100 font-normal tracking-tight">
                98.4<em className="italic text-amber-400 font-normal">%</em>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                First Attempt Pass Rate
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. ALTERNATING LIGHT SECTION: PEDAGOGY STANDARDS (#FAF8F3) */}
      <section className="bg-[#FAF8F3] text-slate-900 py-28 lg:py-36 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-20">
          
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">
              Pedagogical Standards
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-slate-900 tracking-tight leading-tight">
              Designed for Stress-Free <em className="italic text-amber-600 font-normal">Mastery</em>
            </h2>
            <p className="text-base text-slate-600 font-light leading-relaxed">
              We replace anxiety with structured practice. Every training module is engineered to build muscle memory, spatial awareness, and calm decision-making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-4 border-l-2 border-amber-500 pl-6 py-2"
            >
              <ShieldCheck className="w-8 h-8 text-amber-600 stroke-[1.25]" />
              <h3 className="font-serif text-2xl text-slate-900 font-normal">
                Dual-Control Safety
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-light">
                Every vehicle features instructor dual-pedal overrides, ensuring instant safety intervention during real traffic sessions.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-4 border-l-2 border-amber-500 pl-6 py-2"
            >
              <SlidersHorizontal className="w-8 h-8 text-amber-600 stroke-[1.25]" />
              <h3 className="font-serif text-2xl text-slate-900 font-normal">
                Tailored Progression
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-light">
                Progress from private track maneuvering to main-road navigation at a pace tailored specifically to your comfort level.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-4 border-l-2 border-amber-500 pl-6 py-2"
            >
              <Award className="w-8 h-8 text-amber-600 stroke-[1.25]" />
              <h3 className="font-serif text-2xl text-slate-900 font-normal">
                RTO Exam Fast-Track
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-light">
                Full documentation assistance and mock driver tests covering track parallel parking, H-tracks, and gradient starts.
              </p>
            </motion.div>

          </div>

        </div>
      </section>

      {/* 4. CTA BAND */}
      <section className="bg-[#070B19] py-32 text-center border-t border-slate-800/60 relative overflow-hidden">
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8 relative z-10">
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-100 tracking-tight leading-tight">
            Your Journey to <em className="italic text-amber-400 font-normal">Freedom</em> Starts Today
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Reserve your preferred training vehicle, instructor, and schedule online in under 2 minutes.
          </p>
          <div className="pt-4">
            <Link
              href="/book"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-10 py-5 rounded-full inline-flex items-center gap-3 shadow-2xl shadow-amber-500/20 hover:scale-105 transition-all duration-300"
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
