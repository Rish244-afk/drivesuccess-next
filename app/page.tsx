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
      className="overflow-hidden bg-[#F4F0E8] text-[#4A5A44] font-sans min-h-screen"
    >
      {/* 1. HERO SECTION (Screenshot 1 & Image 4) */}
      <section className="relative min-h-[90vh] flex flex-col justify-between py-16 px-6 sm:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Background Image / Ambient Overlay */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[3rem] overflow-hidden my-4">
          <Image
            src="/images/coastal_arches.jpg"
            alt="DriveSuccess Hero Environment"
            fill
            priority
            className="object-cover opacity-35 filter brightness-105 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F4F0E8]/70 via-[#F4F0E8]/40 to-[#F4F0E8]" />
        </div>

        <div className="relative z-10 max-w-3xl pt-12 sm:pt-20 space-y-6">
          {/* Top Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#4A5A44]/20 text-[#4A5A44] text-xs font-semibold tracking-widest uppercase bg-white/70 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#4A5A44]" />
            <span>THE DRIVESUCCESS METHOD</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal text-[#4A5A44] tracking-tight leading-[1.05]">
            Master the Road <br />
            <em className="italic font-normal text-[#7E8466]">with Serenity.</em>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#4A5A44]/80 font-light max-w-xl leading-relaxed">
            Precision education shaped by nature, advanced technology, and a commitment to mindful driving. Experience learning redefined.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Magnetic range={35} strength={0.4}>
              <Link
                href="/book"
                className="bg-[#4A5A44] hover:bg-[#384633] text-white font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full inline-flex items-center gap-3 transition-all duration-300 shadow-md hover:scale-105"
              >
                <span>Book Your First Lesson</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Magnetic>

            <Link
              href="/courses"
              className="bg-[#E7E1D6] hover:bg-white text-[#4A5A44] border border-[#4A5A44]/20 font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full inline-flex items-center gap-2 transition-all duration-300 shadow-xs"
            >
              <span>Explore Curriculum</span>
              <Compass className="w-4 h-4 text-[#7E8466]" />
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="relative z-10 text-center py-8">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#7E8466] font-semibold block mb-2">
            SCROLL TO DISCOVER
          </span>
          <ChevronDown className="w-4 h-4 mx-auto text-[#7E8466] animate-bounce" />
        </div>
      </section>

      {/* 2. THREE-CARD HORIZONTAL STRIP (Screenshot 1) */}
      <section className="py-8 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-[2rem] bg-[#E7E1D6] border border-[#4A5A44]/10 shadow-xs">
          
          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/70">
            <div className="p-3 rounded-full bg-[#4A5A44]/10 text-[#4A5A44]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#4A5A44]">Expert Guidance</h3>
              <p className="text-xs text-[#7E8466] font-light">Calm, structured instruction.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/70">
            <div className="p-3 rounded-full bg-[#4A5A44]/10 text-[#4A5A44]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#4A5A44]">Sustainable Fleet</h3>
              <p className="text-xs text-[#7E8466] font-light">100% electric, premium vehicles.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/70">
            <div className="p-3 rounded-full bg-[#4A5A44]/10 text-[#4A5A44]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#4A5A44]">Premium Comfort</h3>
              <p className="text-xs text-[#7E8466] font-light">Stress-free learning environments.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CENTERED HEADLINE & STATEMENT (Screenshot 1) */}
      <section className="py-24 px-6 sm:px-8 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="font-serif text-4xl sm:text-6xl font-normal text-[#4A5A44] tracking-tight leading-tight">
          The Future of Driving Education
        </h2>
        <p className="text-base sm:text-lg text-[#7E8466] font-light leading-relaxed max-w-2xl mx-auto">
          We believe learning to drive should be a journey of confidence, not anxiety. Our spaces and methods are designed to calm the mind and focus the senses.
        </p>
      </section>

      {/* 4. FOUR TALL PILL CARDS GRID (Screenshot 1 & Images 1-4) */}
      <section className="py-12 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Curriculum (Image 1: Sanctuary arch) */}
          <div className="group relative h-[450px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#4A5A44]/10 bg-[#E7E1D6] transition-all duration-500 hover:shadow-xl">
            <Image
              src="/images/sanctuary_arch.jpg"
              alt="Curriculum - Sanctuary Arch Stage"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#384633]/90 via-[#384633]/30 to-transparent" />
            
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#4A5A44]">
                <Compass className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Curriculum</h3>
              <p className="text-xs text-white/90 font-light leading-relaxed">
                Structured by nature. Refined by intention.
              </p>
              <div className="pt-2">
                <Link href="/courses" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white hover:text-[#4A5A44] text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Performance (Image 4: Coastal arches road) */}
          <div className="group relative h-[450px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#4A5A44]/10 bg-[#E7E1D6] transition-all duration-500 hover:shadow-xl">
            <Image
              src="/images/coastal_arches.jpg"
              alt="Performance - Coastal Arches Drive"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#384633]/90 via-[#384633]/30 to-transparent" />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#4A5A44]">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Performance</h3>
              <p className="text-xs text-white/90 font-light leading-relaxed">
                Electric power. Natural responsiveness.
              </p>
              <div className="pt-2">
                <Link href="/fleet" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white hover:text-[#4A5A44] text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Interior (Image 2: Panoramic cabin interior) */}
          <div className="group relative h-[450px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#4A5A44]/10 bg-[#E7E1D6] transition-all duration-500 hover:shadow-xl">
            <Image
              src="/images/cabin_interior.jpg"
              alt="Interior - Panoramic Cabin Dashboard"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#384633]/90 via-[#384633]/30 to-transparent" />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#4A5A44]">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Interior</h3>
              <p className="text-xs text-white/90 font-light leading-relaxed">
                Calm, connected, consciously crafted.
              </p>
              <div className="pt-2">
                <Link href="/fleet" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white hover:text-[#4A5A44] text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 4: Sustainability (Image 3: Dewdrop leaf) */}
          <div className="group relative h-[450px] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between border border-[#4A5A44]/10 bg-[#E7E1D6] transition-all duration-500 hover:shadow-xl">
            <Image
              src="/images/dewdrop_leaf.jpg"
              alt="Sustainability - Green Dewdrop Leaf"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#384633]/90 via-[#384633]/30 to-transparent" />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#4A5A44]">
                <Award className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 text-white">
              <h3 className="font-serif text-3xl font-normal">Sustainability</h3>
              <p className="text-xs text-white/90 font-light leading-relaxed">
                Grown with purpose. Driven by responsibility.
              </p>
              <div className="pt-2">
                <Link href="/engineering" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white hover:text-[#4A5A44] text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. WARM ORGANIC FOOTER */}
      <footer className="mt-24 rounded-t-[3rem] bg-[#E7E1D6] border-t border-[#4A5A44]/10 py-16 px-8 lg:px-16 text-[#4A5A44]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-normal text-[#4A5A44]">DriveSuccess</h3>
            <p className="text-xs text-[#7E8466] font-light leading-relaxed max-w-sm">
              Sculpting mindful drivers for a sustainable future. Experience the serenity of motion.
            </p>
            <p className="text-[11px] text-[#7E8466]/80 font-mono pt-4">
              © 2024 DriveSuccess. Sculpted for the future of motion.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A5A44]">Journey</h4>
            <ul className="space-y-2 text-xs text-[#7E8466]">
              <li><Link href="/" className="hover:text-[#4A5A44] transition-colors">The Method</Link></li>
              <li><Link href="/fleet" className="hover:text-[#4A5A44] transition-colors">Sustainable Fleet</Link></li>
              <li><Link href="/courses" className="hover:text-[#4A5A44] transition-colors">Safety Standards</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A5A44]">Legal & Support</h4>
            <ul className="space-y-2 text-xs text-[#7E8466]">
              <li><Link href="/terms" className="hover:text-[#4A5A44] transition-colors">Terms of Serenity</Link></li>
              <li><Link href="/privacy" className="hover:text-[#4A5A44] transition-colors">Privacy Sanctuary</Link></li>
              <li><Link href="/contact" className="hover:text-[#4A5A44] transition-colors">Contact Studio</Link></li>
            </ul>
          </div>

        </div>
      </footer>
    </div>
  );
}
