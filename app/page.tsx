'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Award, ShieldCheck, ArrowRight, Sparkles, Compass, ChevronDown } from 'lucide-react';
import { Magnetic } from '@/components/ui/Magnetic';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden bg-[#F4F0E8] text-[#2B3B2B] font-sans min-h-screen"
    >
      {/* 1. HERO SECTION (Screenshot 1) */}
      <section className="relative min-h-[90vh] flex flex-col justify-between py-16 px-6 sm:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Background Image / Ambient Overlay */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[3rem] overflow-hidden my-4">
          <Image
            src="/images/creta.jpg"
            alt="DriveSuccess Hero Environment"
            fill
            priority
            className="object-cover opacity-25 filter blur-[1px] brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F4F0E8]/70 via-[#F4F0E8]/40 to-[#F4F0E8]" />
        </div>

        <div className="relative z-10 max-w-3xl pt-12 sm:pt-20 space-y-6">
          {/* Top Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2B3B2B]/20 text-[#2B3B2B] text-xs font-semibold tracking-widest uppercase bg-white/60 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#2B3B2B]" />
            <span>THE DRIVESUCCESS METHOD</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal text-[#2B3B2B] tracking-tight leading-[1.05]">
            Master the Road <br />
            <em className="italic font-normal text-[#3D4E3D]">with Serenity.</em>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#5C6B5C] font-light max-w-xl leading-relaxed">
            Precision education shaped by nature, advanced technology, and a commitment to mindful driving. Experience learning redefined.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Magnetic range={35} strength={0.4}>
              <Link
                href="/book"
                className="bg-[#2B3B2B] hover:bg-[#1E2B1E] text-white font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full inline-flex items-center gap-3 transition-all duration-300 shadow-md hover:scale-105"
              >
                <span>Book Your First Lesson</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Magnetic>

            <Link
              href="/courses"
              className="bg-white/80 hover:bg-white text-[#2B3B2B] border border-[#2B3B2B]/20 font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full inline-flex items-center gap-2 transition-all duration-300 shadow-xs"
            >
              <span>Explore Curriculum</span>
              <Compass className="w-4 h-4 text-[#5C6B5C]" />
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="relative z-10 text-center py-8">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#5C6B5C] font-semibold block mb-2">
            SCROLL TO DISCOVER
          </span>
          <ChevronDown className="w-4 h-4 mx-auto text-[#5C6B5C] animate-bounce" />
        </div>
      </section>

      {/* 2. THREE-CARD HORIZONTAL STRIP (Screenshot 1) */}
      <section className="py-8 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-[2rem] bg-[#EFECE6] border border-[#2B3B2B]/10 shadow-xs">
          
          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/60">
            <div className="p-3 rounded-full bg-[#2B3B2B]/10 text-[#2B3B2B]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#2B3B2B]">Expert Guidance</h3>
              <p className="text-xs text-[#5C6B5C] font-light">Calm, structured instruction.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/60">
            <div className="p-3 rounded-full bg-[#2B3B2B]/10 text-[#2B3B2B]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#2B3B2B]">Sustainable Fleet</h3>
              <p className="text-xs text-[#5C6B5C] font-light">100% electric, premium vehicles.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/60">
            <div className="p-3 rounded-full bg-[#2B3B2B]/10 text-[#2B3B2B]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#2B3B2B]">Premium Comfort</h3>
              <p className="text-xs text-[#5C6B5C] font-light">Stress-free learning environments.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CENTERED HEADLINE & STATEMENT (Screenshot 1) */}
      <section className="py-24 px-6 sm:px-8 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="font-serif text-4xl sm:text-6xl font-normal text-[#2B3B2B] tracking-tight leading-tight">
          The Future of Driving Education
        </h2>
        <p className="text-base sm:text-lg text-[#5C6B5C] font-light leading-relaxed max-w-2xl mx-auto">
          We believe learning to drive should be a journey of confidence, not anxiety. Our spaces and methods are designed to calm the mind and focus the senses.
        </p>
      </section>

      {/* 4. FOUR TALL PILL CARDS GRID (Screenshot 1) */}
      <section className="py-12 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Curriculum */}
          <div className="group relative h-[450px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#2B3B2B]/10 bg-[#EFECE6] transition-all duration-500 hover:shadow-xl">
            <Image
              src="/images/creta.jpg"
              alt="Curriculum"
              fill
              className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E2B1E]/90 via-[#1E2B1E]/30 to-transparent" />
            
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#2B3B2B]">
                <Compass className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Curriculum</h3>
              <p className="text-xs text-white/80 font-light leading-relaxed">
                Structured by nature. Refined by intention.
              </p>
              <div className="pt-2">
                <Link href="/courses" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white hover:text-[#2B3B2B] text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Performance */}
          <div className="group relative h-[450px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#2B3B2B]/10 bg-[#EFECE6] transition-all duration-500 hover:shadow-xl">
            <Image
              src="/images/hondacity.jpg"
              alt="Performance"
              fill
              className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E2B1E]/90 via-[#1E2B1E]/30 to-transparent" />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#2B3B2B]">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Performance</h3>
              <p className="text-xs text-white/80 font-light leading-relaxed">
                Electric power. Natural responsiveness.
              </p>
              <div className="pt-2">
                <Link href="/fleet" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white hover:text-[#2B3B2B] text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Interior */}
          <div className="group relative h-[450px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#2B3B2B]/10 bg-[#EFECE6] transition-all duration-500 hover:shadow-xl">
            <Image
              src="/images/swift.jpg"
              alt="Interior"
              fill
              className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E2B1E]/90 via-[#1E2B1E]/30 to-transparent" />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#2B3B2B]">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Interior</h3>
              <p className="text-xs text-white/80 font-light leading-relaxed">
                Calm, connected, consciously crafted.
              </p>
              <div className="pt-2">
                <Link href="/fleet" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white hover:text-[#2B3B2B] text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 4: Sustainability */}
          <div className="group relative h-[450px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#2B3B2B]/10 bg-[#EFECE6] transition-all duration-500 hover:shadow-xl">
            <Image
              src="/images/wagonr.jpg"
              alt="Sustainability"
              fill
              className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E2B1E]/90 via-[#1E2B1E]/30 to-transparent" />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#2B3B2B]">
                <Award className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Sustainability</h3>
              <p className="text-xs text-white/80 font-light leading-relaxed">
                Grown with purpose. Driven by responsibility.
              </p>
              <div className="pt-2">
                <Link href="/engineering" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white hover:text-[#2B3B2B] text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. WARM ORGANIC FOOTER (Screenshot 1 & 2) */}
      <footer className="mt-24 rounded-t-[3rem] bg-[#EFECE6] border-t border-[#2B3B2B]/10 py-16 px-8 lg:px-16 text-[#2B3B2B]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-normal text-[#2B3B2B]">DriveSuccess</h3>
            <p className="text-xs text-[#5C6B5C] font-light leading-relaxed max-w-sm">
              Sculpting mindful drivers for a sustainable future. Experience the serenity of motion.
            </p>
            <p className="text-[11px] text-[#5C6B5C]/80 font-mono pt-4">
              © 2024 DriveSuccess. Sculpted for the future of motion.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2B3B2B]">Journey</h4>
            <ul className="space-y-2 text-xs text-[#5C6B5C]">
              <li><Link href="/" className="hover:text-[#2B3B2B] transition-colors">The Method</Link></li>
              <li><Link href="/fleet" className="hover:text-[#2B3B2B] transition-colors">Sustainable Fleet</Link></li>
              <li><Link href="/courses" className="hover:text-[#2B3B2B] transition-colors">Safety Standards</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2B3B2B]">Legal & Support</h4>
            <ul className="space-y-2 text-xs text-[#5C6B5C]">
              <li><Link href="/terms" className="hover:text-[#2B3B2B] transition-colors">Terms of Serenity</Link></li>
              <li><Link href="/privacy" className="hover:text-[#2B3B2B] transition-colors">Privacy Sanctuary</Link></li>
              <li><Link href="/contact" className="hover:text-[#2B3B2B] transition-colors">Contact Studio</Link></li>
            </ul>
          </div>

        </div>
      </footer>
    </div>
  );
}
