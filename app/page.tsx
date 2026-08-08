'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Award, ShieldCheck, ArrowRight, Sparkles, Compass, Zap, Car, Leaf, RefreshCw } from 'lucide-react';
import { Magnetic } from '@/components/ui/Magnetic';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden bg-[#F4F0E8] text-[#4A5A44] font-sans min-h-screen"
    >
      {/* 1. ULTRA-BRIGHT 4K HERO SECTION (VERDA Reference Screenshot) */}
      <section className="relative min-h-[92vh] flex flex-col justify-between py-12 px-6 sm:px-8 max-w-7xl mx-auto overflow-hidden">
        
        {/* Crisp 4K Sanctuary Arch Hero Image (100% Brightness & Opacity) */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[3rem] overflow-hidden my-2 shadow-sm">
          <Image
            src="/images/sanctuary_arch.jpg"
            alt="DriveWhat Grows With You - Sanctuary Arch"
            fill
            priority
            className="object-cover object-center opacity-100 brightness-105 contrast-105 scale-100"
          />
          {/* Subtle top/left light fade to ensure title text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F4F0E8]/90 via-[#F4F0E8]/45 to-transparent max-w-2xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F4F0E8]/40 via-transparent to-[#F4F0E8]" />
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 max-w-2xl pt-16 sm:pt-24 space-y-6">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#4A5A44]/20 text-[#4A5A44] text-xs font-semibold tracking-widest uppercase bg-white/80 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#4A5A44]" />
            <span>THE DRIVESUCCESS METHOD</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal text-[#384633] tracking-tight leading-[1.05]">
            Drive What <br />
            <em className="italic font-normal text-[#7E8466]">Grows With You.</em>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#384633]/90 font-medium max-w-xl leading-relaxed">
            Precision education shaped by nature, advanced technology, and a commitment to mindful driving. Experience learning redefined.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Magnetic range={35} strength={0.4}>
              <Link
                href="/book"
                className="bg-[#384633] hover:bg-[#2B3B2B] text-white font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full inline-flex items-center gap-3 transition-all duration-300 shadow-md hover:scale-105"
              >
                <span>Book Your First Lesson</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Magnetic>

            <Link
              href="/courses"
              className="bg-white/90 hover:bg-white text-[#384633] border border-[#384633]/20 font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full inline-flex items-center gap-2 transition-all duration-300 shadow-xs"
            >
              <span>Explore Curriculum</span>
              <Compass className="w-4 h-4 text-[#7E8466]" />
            </Link>
          </div>
        </div>

        {/* Floating Bottom Metric Glass Bar (VERDA Reference Screenshot) */}
        <div className="relative z-10 my-4">
          <div className="bg-[#384633]/90 backdrop-blur-xl text-white rounded-full p-4 px-8 max-w-5xl mx-auto shadow-2xl flex flex-wrap items-center justify-between gap-6 border border-white/20">
            <div className="flex items-center gap-3">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-medium tracking-wide">Nature-Inspired Curriculum</span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-serif text-sm font-bold">100% Dual-Control</span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider">Safety Fleet</span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-serif text-sm font-bold">12+ Years</span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider">Instruction Exp</span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <Link href="/courses" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors">
              <span>Learn More</span>
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
              <h3 className="font-serif text-base font-medium text-[#384633]">Expert Guidance</h3>
              <p className="text-xs text-[#7E8466] font-light">Calm, structured instruction.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/80">
            <div className="p-3 rounded-full bg-[#384633]/10 text-[#384633]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#384633]">Sustainable Fleet</h3>
              <p className="text-xs text-[#7E8466] font-light">100% electric, premium vehicles.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/80">
            <div className="p-3 rounded-full bg-[#384633]/10 text-[#384633]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#384633]">Premium Comfort</h3>
              <p className="text-xs text-[#7E8466] font-light">Stress-free learning environments.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CENTERED HEADLINE & STATEMENT */}
      <section className="py-20 px-6 sm:px-8 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="font-serif text-4xl sm:text-6xl font-normal text-[#384633] tracking-tight leading-tight">
          The Future of Driving Education
        </h2>
        <p className="text-base sm:text-lg text-[#7E8466] font-light leading-relaxed max-w-2xl mx-auto">
          We believe learning to drive should be a journey of confidence, not anxiety. Our spaces and methods are designed to calm the mind and focus the senses.
        </p>
      </section>

      {/* 4. FOUR BRIGHT 4K TALL PILL CARDS GRID (VERDA Reference Screenshot) */}
      <section className="py-12 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Curriculum / Design */}
          <div className="group relative h-[480px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#4A5A44]/15 bg-[#E7E1D6] transition-all duration-500 hover:shadow-2xl">
            <Image
              src="/images/sanctuary_arch.jpg"
              alt="Curriculum Design - Sanctuary Arch"
              fill
              className="object-cover opacity-100 brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2B3B2B]/90 via-[#2B3B2B]/20 to-transparent" />
            
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#384633] shadow-md">
                <Leaf className="w-5 h-5 text-[#384633]" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Design</h3>
              <p className="text-xs text-white/90 font-light leading-relaxed">
                Sculpted by nature. Refined by intention.
              </p>
              <div className="pt-2">
                <Link href="/courses" className="w-10 h-10 rounded-full bg-white/25 hover:bg-white hover:text-[#384633] text-white flex items-center justify-center transition-all shadow-sm">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Performance */}
          <div className="group relative h-[480px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#4A5A44]/15 bg-[#E7E1D6] transition-all duration-500 hover:shadow-2xl">
            <Image
              src="/images/coastal_arches.jpg"
              alt="Performance - Coastal Arches"
              fill
              className="object-cover opacity-100 brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2B3B2B]/90 via-[#2B3B2B]/20 to-transparent" />

            <div className="relative z-10">
              <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#384633] shadow-md">
                <Zap className="w-5 h-5 text-[#384633]" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Performance</h3>
              <p className="text-xs text-white/90 font-light leading-relaxed">
                Electric power. Natural responsiveness.
              </p>
              <div className="pt-2">
                <Link href="/fleet" className="w-10 h-10 rounded-full bg-white/25 hover:bg-white hover:text-[#384633] text-white flex items-center justify-center transition-all shadow-sm">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Interior */}
          <div className="group relative h-[480px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#4A5A44]/15 bg-[#E7E1D6] transition-all duration-500 hover:shadow-2xl">
            <Image
              src="/images/cabin_interior.jpg"
              alt="Interior - Panoramic Cabin Dashboard"
              fill
              className="object-cover opacity-100 brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2B3B2B]/90 via-[#2B3B2B]/20 to-transparent" />

            <div className="relative z-10">
              <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#384633] shadow-md">
                <Car className="w-5 h-5 text-[#384633]" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Interior</h3>
              <p className="text-xs text-white/90 font-light leading-relaxed">
                Calm, connected, consciously crafted.
              </p>
              <div className="pt-2">
                <Link href="/fleet" className="w-10 h-10 rounded-full bg-white/25 hover:bg-white hover:text-[#384633] text-white flex items-center justify-center transition-all shadow-sm">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 4: Sustainability */}
          <div className="group relative h-[480px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#4A5A44]/15 bg-[#E7E1D6] transition-all duration-500 hover:shadow-2xl">
            <Image
              src="/images/dewdrop_leaf.jpg"
              alt="Sustainability - Green Dewdrop Leaf"
              fill
              className="object-cover opacity-100 brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2B3B2B]/90 via-[#2B3B2B]/20 to-transparent" />

            <div className="relative z-10">
              <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#384633] shadow-md">
                <RefreshCw className="w-5 h-5 text-[#384633]" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Sustainability</h3>
              <p className="text-xs text-white/90 font-light leading-relaxed">
                Grown with purpose. Driven by responsibility.
              </p>
              <div className="pt-2">
                <Link href="/engineering" className="w-10 h-10 rounded-full bg-white/25 hover:bg-white hover:text-[#384633] text-white flex items-center justify-center transition-all shadow-sm">
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
            <h3 className="font-serif text-2xl font-normal text-[#384633]">DriveSuccess</h3>
            <p className="text-xs text-[#7E8466] font-light leading-relaxed max-w-sm">
              Sculpting mindful drivers for a sustainable future. Experience the serenity of motion.
            </p>
            <p className="text-[11px] text-[#7E8466]/80 font-mono pt-4">
              © 2024 DriveSuccess. Sculpted for the future of motion.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#384633]">Journey</h4>
            <ul className="space-y-2 text-xs text-[#7E8466]">
              <li><Link href="/" className="hover:text-[#384633] transition-colors">The Method</Link></li>
              <li><Link href="/fleet" className="hover:text-[#384633] transition-colors">Sustainable Fleet</Link></li>
              <li><Link href="/courses" className="hover:text-[#384633] transition-colors">Safety Standards</Link></li>
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
