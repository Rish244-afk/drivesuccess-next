'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ShieldCheck, Award, Users, CheckCircle2, ArrowRight, Star, Clock, Car, SlidersHorizontal, Sparkles, Compass } from 'lucide-react';

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const videoScale = useTransform(smoothProgress, [0, 0.8], [1, 1.05]);
  const videoY = useTransform(smoothProgress, [0, 1], [0, 50]);
  const textY = useTransform(smoothProgress, [0, 0.8], [0, -40]);
  const opacity = useTransform(smoothProgress, [0, 0.7], [1, 0.2]);

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
    hidden: { opacity: 0, y: 35, rotateX: -20 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { type: 'spring' as const, stiffness: 200, damping: 20 },
    },
  };

  return (
    <div className="space-y-0 overflow-hidden bg-white">
      
      {/* 1. WINZY-STYLE ATMOSPHERIC CINEMATIC HERO SECTION */}
      <section ref={heroRef} className="relative pt-20 pb-24 lg:pt-28 lg:pb-36 border-b border-slate-200 overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 mesh-gradient">
        
        {/* Full-Bleed Atmospheric Background Photography Layer */}
        <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/hero_bg.jpg"
            alt="Atmospheric Driving Road"
            fill
            priority
            className="object-cover opacity-10 scale-105"
          />
          {/* Light Glassmorphism Radial Gradient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/75 to-white backdrop-blur-[2px]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16 relative z-10">
          
          {/* Top Kinetic Editorial Content */}
          <motion.div
            style={{ y: textY, opacity }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-5xl mx-auto space-y-8"
          >
            {/* Animated Glass Badge */}
            <motion.div variants={wordVariants} className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-blue-300 text-blue-600 text-xs font-medium tracking-widest uppercase bg-blue-50 backdrop-blur-xl shadow-hover">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Certified Automotive Pedagogy</span>
            </motion.div>

            {/* Giant Kinetic Heading with Staggered Word Motion */}
            <motion.h1
              variants={wordVariants}
              className="font-serif text-6xl sm:text-7xl lg:text-8xl font-normal text-slate-900 leading-[1.05] tracking-tight"
            >
              Learn to Drive with{' '}
              <span className="relative inline-block">
                <em className="italic text-blue-600 font-normal">Confidence</em>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="absolute bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-600 to-transparent origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={wordVariants}
              className="text-lg sm:text-xl text-slate-600 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-sm"
            >
              Safe, structured instruction for first-time drivers. Our patient pedagogical methodology builds long-term competence, road safety, and stress-free license certification.
            </motion.p>

            {/* Interactive Buttons + Floating Student Avatars Bar */}
            <motion.div variants={wordVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              
              <Link
                href="/book"
                className="group relative bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest px-10 py-4.5 rounded-full flex items-center justify-center gap-3 shadow-glow hover:scale-105 transition-all duration-300"
              >
                <span>Reserve Training Session</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/courses"
                className="border border-slate-300 hover:border-blue-400 bg-white/70 hover:bg-white text-slate-700 font-medium text-xs uppercase tracking-wider px-9 py-4.5 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-300 shadow-card"
              >
                Explore Curriculum
              </Link>

            </motion.div>

            {/* Winzy-Style Floating Student Proof Bar */}
            <motion.div variants={wordVariants} className="pt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl px-5 py-2 rounded-full border border-slate-200 shadow-hover">
                <div className="flex -space-x-2">
                  <Image src="/images/rajesh.jpg" alt="Student" width={28} height={28} className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                  <Image src="/images/priya.jpg" alt="Student" width={28} height={28} className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    +2.4k
                  </div>
                </div>
                <span className="text-xs text-slate-600 font-medium">Certified Student Drivers</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-white/80 backdrop-blur-xl px-5 py-2 rounded-full border border-slate-200 shadow-hover">
                <span className="text-blue-500 font-serif text-base italic">★ 5.0</span>
                <span>98.4% First-Attempt Pass Rate</span>
              </div>

            </motion.div>
          </motion.div>

          {/* Full-Width Parallax Video Showcase with Edge Watermark Crop */}
          <motion.div
            style={{ scale: videoScale, y: videoY }}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-hover bg-slate-50 group"
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
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/40 via-white/20 to-transparent pointer-events-none z-10" />
          </motion.div>

        </div>
      </section>

      {/* 2. STAT BAND */}
      <section className="bg-slate-50 py-24 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200">
            
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-2 py-4 md:py-0 transition-transform cursor-default"
            >
              <p className="font-serif text-5xl sm:text-6xl text-slate-900 font-normal tracking-tight">
                2,400<em className="italic text-blue-600 font-normal">+</em>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                Students Certified
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-2 py-4 md:py-0 transition-transform cursor-default"
            >
              <p className="font-serif text-5xl sm:text-6xl text-slate-900 font-normal tracking-tight">
                12<em className="italic text-blue-600 font-normal">Years</em>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                Pedagogical Experience
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-2 py-4 md:py-0 transition-transform cursor-default"
            >
              <p className="font-serif text-5xl sm:text-6xl text-slate-900 font-normal tracking-tight">
                98.4<em className="italic text-blue-600 font-normal">%</em>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                First Attempt Pass Rate
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. ALTERNATING LIGHT SECTION: PEDAGOGY STANDARDS */}
      <section className="bg-white text-slate-900 py-28 lg:py-36 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-20">
          
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Pedagogical Standards
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-slate-900 tracking-tight leading-tight">
              Designed for Stress-Free <em className="italic text-blue-600 font-normal">Mastery</em>
            </h2>
            <p className="text-base text-slate-600 font-light leading-relaxed">
              We replace anxiety with structured practice. Every training module is engineered to build muscle memory, spatial awareness, and calm decision-making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-4 border border-l-4 border-l-blue-500 border-slate-200 bg-white shadow-card p-6 rounded-r-2xl"
            >
              <ShieldCheck className="w-8 h-8 text-blue-600 stroke-[1.25]" />
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
              className="space-y-4 border border-l-4 border-l-blue-500 border-slate-200 bg-white shadow-card p-6 rounded-r-2xl"
            >
              <SlidersHorizontal className="w-8 h-8 text-blue-600 stroke-[1.25]" />
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
              className="space-y-4 border border-l-4 border-l-blue-500 border-slate-200 bg-white shadow-card p-6 rounded-r-2xl"
            >
              <Award className="w-8 h-8 text-blue-600 stroke-[1.25]" />
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
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-32 text-center relative overflow-hidden">
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[160px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8 relative z-10">
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-white tracking-tight leading-tight">
            Your Journey to <em className="italic text-white font-normal">Freedom</em> Starts Today
          </h2>
          <p className="text-lg sm:text-xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed">
            Reserve your preferred training vehicle, instructor, and schedule online in under 2 minutes.
          </p>
          <div className="pt-4">
            <Link
              href="/book"
              className="bg-white hover:bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-widest px-10 py-5 rounded-full inline-flex items-center gap-3 shadow-2xl shadow-white/20 hover:scale-105 transition-all duration-300"
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
