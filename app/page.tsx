'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Award, ShieldCheck, ArrowRight, Sparkles, Compass, Car, Leaf, RefreshCw, Clock } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Magnetic } from '@/components/ui/Magnetic';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);

  // Smooth 3D Parallax Mouse Trackers
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Background Car Image 3D Rotation & Translation
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);
  const imgTranslateX = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const imgTranslateY = useTransform(smoothY, [-0.5, 0.5], [-20, 20]);

  // Foreground Content Micro-Movement (Opposite Direction for Deep 3D Depth Illusion)
  const textTranslateX = useTransform(smoothX, [-0.5, 0.5], [10, -10]);
  const textTranslateY = useTransform(smoothY, [-0.5, 0.5], [10, -10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5;
    const yRatio = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xRatio);
    mouseY.set(yRatio);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      className="overflow-hidden bg-[#F4F0E8] text-[#384633] font-sans min-h-screen"
    >
      {/* 1. FULL-BLEED 4K CINEMATIC HERO SECTION WITH 3D PARALLAX */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full min-h-[95vh] flex flex-col justify-between overflow-hidden bg-[#F4F0E8] pt-2 [perspective:1000px]"
      >
        {/* Crisp 4K Sanctuary Arch Hero Image with Interactive 3D Motion */}
        <motion.div
          aria-hidden="true"
          style={{
            rotateX,
            rotateY,
            x: imgTranslateX,
            y: imgTranslateY,
            scale: 1.08,
            transformStyle: 'preserve-3d',
          }}
          className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] pointer-events-none z-0"
        >
          <Image
            src="/images/sanctuary_arch.jpg"
            alt="Vahathi Motor Driving School Sanctuary Stage"
            fill
            priority
            unoptimized
            className="object-cover object-center w-full h-full opacity-100 brightness-105 contrast-105"
          />
          {/* Light gradient backdrop for maximum text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F4F0E8]/90 via-[#F4F0E8]/40 to-transparent max-w-2xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F4F0E8]/20 via-transparent to-[#F4F0E8]" />
        </motion.div>

        {/* Hero Content Overlay (Floats Layered in 3D Space) */}
        <motion.div
          style={{
            x: textTranslateX,
            y: textTranslateY,
          }}
          className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-8 pt-16 sm:pt-24 space-y-6"
        >
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#384633]/20 text-[#384633] text-xs font-semibold tracking-widest uppercase bg-white/80 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#384633]" />
            <span>VAHATHI CERTIFIED DRIVING INSTITUTION</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal text-[#384633] tracking-tight leading-[1.05] max-w-3xl">
            Master the Road <br />
            <em className="italic font-normal text-[#7E8466]">with Serenity.</em>
          </h1>

          {/* Subtitle with Actual DriveSuccess Driving School Copy */}
          <p className="text-base sm:text-lg text-[#384633]/90 font-medium max-w-xl leading-relaxed">
            Structured 2W and 4W practical driving instruction, 100% dual-control safety vehicles, and complete RTO license assistance in Kasavanahalli, Bengaluru.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Magnetic range={35} strength={0.4}>
              <Link
                href="/book"
                className="bg-[#384633] hover:bg-[#2B3B2B] text-white font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full inline-flex items-center gap-3 transition-all duration-300 shadow-md hover:scale-105"
              >
                <span>Reserve Training Session</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Magnetic>

            <Link
              href="/courses"
              className="bg-white/90 hover:bg-white text-[#384633] border border-[#384633]/20 font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full inline-flex items-center gap-2 transition-all duration-300 shadow-xs"
            >
              <span>View Driver Packages</span>
              <Compass className="w-4 h-4 text-[#7E8466]" />
            </Link>
          </div>
        </motion.div>

        {/* Floating Bottom Metric Glass Bar */}
        <div className="relative z-10 w-full px-6 sm:px-8 pb-6 my-4">
          <div className="bg-[#384633]/90 backdrop-blur-xl text-white rounded-full p-4 px-8 max-w-5xl mx-auto shadow-2xl flex flex-wrap items-center justify-between gap-6 border border-white/20">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-medium tracking-wide">100% Dual-Control Pedals</span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-serif text-sm font-bold">2W & 4W Programs</span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider">RTO Approved</span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-serif text-sm font-bold">6 AM – 8 PM IST</span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider">Flexible Daily Track Slots</span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <Link href="/courses" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors">
              <span>Explore Packages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THREE-CARD HORIZONTAL STRIP */}
      <section className="py-8 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-[2rem] bg-[#E7E1D6] border border-[#4A5A44]/10 shadow-xs">
          
          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/80">
            <div className="p-3 rounded-full bg-[#384633]/10 text-[#384633]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#384633]">Senior Instructors</h3>
              <p className="text-xs text-[#7E8466] font-light">Calm, structured 1-on-1 guidance.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/80">
            <div className="p-3 rounded-full bg-[#384633]/10 text-[#384633]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#384633]">Certified Fleet</h3>
              <p className="text-xs text-[#7E8466] font-light">Air-conditioned dual-control vehicles.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/80">
            <div className="p-3 rounded-full bg-[#384633]/10 text-[#384633]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#384633]">Flexible Timing</h3>
              <p className="text-xs text-[#7E8466] font-light">Custom morning & evening track slots.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CENTERED HEADLINE & STATEMENT */}
      <section className="py-20 px-6 sm:px-8 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="font-serif text-4xl sm:text-6xl font-normal text-[#384633] tracking-tight leading-tight">
          Vahathi Driving Excellence
        </h2>
        <p className="text-base sm:text-lg text-[#7E8466] font-light leading-relaxed max-w-2xl mx-auto">
          We combine structured pedagogical training with calm, stress-free vehicle practice so every student gains lifetime road confidence.
        </p>
      </section>

      {/* 4. FOUR BRIGHT 4K TALL PILL CARDS GRID */}
      <section className="py-12 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Curriculum */}
          <div className="group relative h-[480px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#4A5A44]/15 bg-[#E7E1D6] transition-all duration-500 hover:shadow-2xl">
            <Image
              src="/images/sanctuary_arch.jpg"
              alt="Curriculum - Sanctuary Arch"
              fill
              unoptimized
              className="object-cover opacity-100 brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2B3B2B]/90 via-[#2B3B2B]/20 to-transparent" />
            
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#384633] shadow-md">
                <Leaf className="w-5 h-5 text-[#384633]" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Curriculum</h3>
              <p className="text-xs text-white/90 font-light leading-relaxed">
                10 & 15-day structured practical programs.
              </p>
              <div className="pt-2">
                <Link href="/courses" className="w-10 h-10 rounded-full bg-white/25 hover:bg-white hover:text-[#384633] text-white flex items-center justify-center transition-all shadow-sm">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Dual-Control Fleet */}
          <div className="group relative h-[480px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#4A5A44]/15 bg-[#E7E1D6] transition-all duration-500 hover:shadow-2xl">
            <Image
              src="/images/coastal_arches.jpg"
              alt="Dual-Control Fleet"
              fill
              unoptimized
              className="object-cover opacity-100 brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2B3B2B]/90 via-[#2B3B2B]/20 to-transparent" />

            <div className="relative z-10">
              <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#384633] shadow-md">
                <Car className="w-5 h-5 text-[#384633]" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Dual-Control Fleet</h3>
              <p className="text-xs text-white/90 font-light leading-relaxed">
                Air-conditioned sedans & compact hatchbacks.
              </p>
              <div className="pt-2">
                <Link href="/fleet" className="w-10 h-10 rounded-full bg-white/25 hover:bg-white hover:text-[#384633] text-white flex items-center justify-center transition-all shadow-sm">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Cabin Safety */}
          <div className="group relative h-[480px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#4A5A44]/15 bg-[#E7E1D6] transition-all duration-500 hover:shadow-2xl">
            <Image
              src="/images/cabin_interior.jpg"
              alt="Cabin Safety & Comfort"
              fill
              unoptimized
              className="object-cover opacity-100 brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2B3B2B]/90 via-[#2B3B2B]/20 to-transparent" />

            <div className="relative z-10">
              <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#384633] shadow-md">
                <ShieldCheck className="w-5 h-5 text-[#384633]" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Cabin Safety</h3>
              <p className="text-xs text-white/90 font-light leading-relaxed">
                Dual pedal override & instructor telemetry.
              </p>
              <div className="pt-2">
                <Link href="/fleet" className="w-10 h-10 rounded-full bg-white/25 hover:bg-white hover:text-[#384633] text-white flex items-center justify-center transition-all shadow-sm">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 4: RTO License Support */}
          <div className="group relative h-[480px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#4A5A44]/15 bg-[#E7E1D6] transition-all duration-500 hover:shadow-2xl">
            <Image
              src="/images/dewdrop_leaf.jpg"
              alt="RTO License Support"
              fill
              unoptimized
              className="object-cover opacity-100 brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2B3B2B]/90 via-[#2B3B2B]/20 to-transparent" />

            <div className="relative z-10">
              <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#384633] shadow-md">
                <RefreshCw className="w-5 h-5 text-[#384633]" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">RTO Licensing</h3>
              <p className="text-xs text-white/90 font-light leading-relaxed">
                Learner permit & permanent DL endorsement.
              </p>
              <div className="pt-2">
                <Link href="/courses" className="w-10 h-10 rounded-full bg-white/25 hover:bg-white hover:text-[#384633] text-white flex items-center justify-center transition-all shadow-sm">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. WARM ORGANIC FOOTER */}
      <footer className="mt-24 rounded-t-[3rem] bg-[#E7E1D6] border-t border-[#4A5A44]/10 py-16 px-8 lg:px-16 text-[#384633]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-normal text-[#384633]">Vahathi Motor Driving School</h3>
            <p className="text-xs text-[#7E8466] font-light leading-relaxed max-w-sm">
              Vahathi Motor Driving School. Certified 2W & 4W driving instruction in Kasavanahalli, Bengaluru.
            </p>
            <p className="text-[11px] text-[#7E8466]/80 font-mono pt-4">
              © 2026 Vahathi Motor Driving School. All rights reserved.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#384633]">Journey</h4>
            <ul className="space-y-2 text-xs text-[#7E8466]">
              <li><Link href="/" className="hover:text-[#384633] transition-colors">The Method</Link></li>
              <li><Link href="/fleet" className="hover:text-[#384633] transition-colors">Dual-Control Fleet</Link></li>
              <li><Link href="/courses" className="hover:text-[#384633] transition-colors">Curriculum & Packages</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#384633]">Legal & Support</h4>
            <ul className="space-y-2 text-xs text-[#7E8466]">
              <li><Link href="/terms" className="hover:text-[#384633] transition-colors">Terms of Serenity</Link></li>
              <li><Link href="/privacy" className="hover:text-[#384633] transition-colors">Privacy Sanctuary</Link></li>
              <li><Link href="/contact" className="hover:text-[#384633] transition-colors">Contact Studio</Link></li>
            </ul>
          </div>

        </div>
      </footer>
    </div>
  );
}
