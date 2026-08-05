'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ShieldCheck, Award, Users, ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Magnetic } from '@/components/ui/Magnetic';

const MeshGradient = dynamic(() => import('@/components/ui/MeshGradient'), { ssr: false });
const FloatingParticles = dynamic(() => import('@/components/ui/FloatingParticles'), { ssr: false });
const Hero3DScene = dynamic(() => import('@/components/ui/Hero3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-white to-purple-50/20 animate-pulse -z-10" />
});

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const initGsap = async () => {
      const { default: gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      const { default: SplitType } = await import('split-type');

      gsap.registerPlugin(ScrollTrigger);

      // 1. Text Splitting for Mask Reveal
      const titleText = new SplitType('.hero-title', { types: 'words' });
      titleText.words?.forEach((word) => {
        const wrapper = document.createElement('span');
        wrapper.className = 'inline-block overflow-hidden mr-3 pb-2 last:mr-0 align-bottom';
        word.parentNode?.insertBefore(wrapper, word);
        wrapper.appendChild(word);
        word.className = 'inline-block translate-y-[110%] hero-title-word';
      });

      // 2. Cinematic Hero Timeline
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      // Ambient background fade
      tl.fromTo('.hero-bg-img', 
        { opacity: 0, scale: 1.05 },
        { opacity: 0.55, scale: 1, duration: 1.6 }
      )
      // Mesh gradient overlay appears
      .fromTo('.mesh-gradient-container',
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 1.4 },
        '-=1.2'
      )
      // Floating particles fade-in
      .fromTo('.floating-particles-container',
        { opacity: 0 },
        { opacity: 1, duration: 1.2 },
        '-=1.0'
      )
      // Badge slide reveal
      .fromTo('.hero-badge',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.8 },
        '-=0.8'
      )
      // Mask Heading reveal
      .to('.hero-title-word',
        { y: '0%', stagger: 0.05, duration: 0.95, ease: 'power3.out' },
        '-=0.7'
      )
      // Subtitle reveal
      .fromTo('.hero-subtitle',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.8 },
        '-=0.6'
      )
      // CTA buttons reveal
      .fromTo('.hero-ctas',
        { opacity: 0, scale: 0.95, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8 },
        '-=0.6'
      )
      // Proof bar reveal
      .fromTo('.hero-proof',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.8 },
        '-=0.5'
      );

      // 3. Stats Rolling Counters
      gsap.utils.toArray<HTMLElement>('.stat-count').forEach((el) => {
        const target = parseFloat(el.getAttribute('data-target') || '0');
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        const obj = { val: 0 };

        gsap.to(obj, {
          val: target,
          duration: 2.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          onUpdate: () => {
            el.innerText = obj.val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          }
        });
      });

      // 4. Section Reveals (Stat Band Reveal)
      gsap.fromTo(
        '.stat-item',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.stat-section',
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      // 5. Pedagogy Section Reveal
      gsap.fromTo(
        '.pedagogy-header',
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.pedagogy-section',
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      gsap.fromTo(
        '.pedagogy-card-container',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.85,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.pedagogy-cards-grid',
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      // 6. Parallax Storytelling Background Layers
      gsap.to('.hero-bg-layer', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // 7. Slow Ambient Float Loop for Floating Blobs/Mesh
      gsap.to('.ambient-float-item', {
        y: 'random(-10, 10)',
        x: 'random(-6, 6)',
        rotation: 'random(-5, 5)',
        duration: 'random(4, 7)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.2
      });
    };

    initGsap();

    return () => {
      // Safely kill and clean up all ScrollTriggers on unmount
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      });
    };
  }, []);

  return (
    <div ref={containerRef} className="space-y-0 overflow-hidden bg-white">
      
      {/* 1. NEXT-GENERATION SPATIAL UI HERO SECTION */}
      <section className="hero-section relative pt-24 pb-28 lg:pt-36 lg:pb-40 border-b border-slate-200/60 overflow-hidden bg-white flex items-center min-h-[85vh]">
        
        {/* Full-Bleed Atmospheric Background Photography Layer */}
        <div aria-hidden="true" className="hero-bg-layer absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <Image
            src="/images/hero_spatial_bg.jpg"
            alt="Scenic Mountain Road"
            fill
            priority
            className="hero-bg-img object-cover opacity-0 scale-[1.05] select-none pointer-events-none"
            style={{ willChange: 'opacity, transform' }}
          />
          {/* Light Glassmorphism Radial Gradient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/40 to-white/75" />
        </div>

        {/* Spatial Depth Layers */}
        <div className="mesh-gradient-container opacity-0 absolute inset-0 z-0 pointer-events-none" style={{ willChange: 'opacity, transform' }}>
          <MeshGradient />
        </div>
        <div className="floating-particles-container opacity-0 absolute inset-0 z-0 pointer-events-none" style={{ willChange: 'opacity' }}>
          <FloatingParticles count={30} />
        </div>
        <Hero3DScene className="ambient-float-item absolute inset-0 w-full h-full" />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10 w-full">
          
          {/* Spatial Editorial Content */}
          <div className="text-center max-w-5xl mx-auto space-y-10">
            {/* Animated Glass Badge */}
            <div className="hero-badge opacity-0 inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-blue-200/80 text-blue-600 text-xs font-semibold tracking-widest uppercase bg-white/70 backdrop-blur-xl shadow-hover transition-all duration-300 hover:border-blue-300 select-none">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-600" />
              <span>Certified Automotive Pedagogy</span>
            </div>
 
            {/* Giant Spatial Heading */}
            <h1 className="hero-title font-serif text-6xl sm:text-7xl lg:text-8xl font-normal text-slate-900 leading-[1.05] tracking-tight drop-shadow-[0_2px_15px_rgba(255,255,255,0.6)]">
              Learn to Drive with Confidence
            </h1>
 
            <p className="hero-subtitle opacity-0 text-lg sm:text-xl text-slate-600 font-light leading-relaxed max-w-3xl mx-auto drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]">
              Safe, structured instruction for first-time drivers. Our patient pedagogical methodology builds long-term competence, road safety, and stress-free license certification.
            </p>
 
            {/* Interactive Physical Buttons */}
            <div className="hero-ctas opacity-0 flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              
              <Magnetic range={25} strength={0.2}>
                <Link
                  href="/courses"
                  className="border border-slate-200 hover:border-blue-400 bg-white/70 hover:bg-white text-slate-700 font-medium text-xs uppercase tracking-wider px-9 py-5 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-300 shadow-card hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Explore Curriculum
                </Link>
              </Magnetic>

            </div>
 
            {/* Floating Student Proof Bar */}
            <div className="hero-proof opacity-0 pt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12 select-none">
              
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-slate-200/60 shadow-card hover:scale-105 transition-all duration-300">
                <div className="flex -space-x-2">
                  <Image src="/images/rajesh.jpg" alt="Student" width={28} height={28} className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                  <Image src="/images/priya.jpg" alt="Student" width={28} height={28} className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    +2.4k
                  </div>
                </div>
                <span className="text-xs text-slate-600 font-medium">Certified Student Drivers</span>
              </div>
 
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-slate-200/60 shadow-card hover:scale-105 transition-all duration-300">
                <span className="text-blue-500 font-serif text-base italic">★ 5.0</span>
                <span>98.4% First-Attempt Pass Rate</span>
              </div>
 
            </div>
          </div>
 
        </div>
      </section>

      {/* 2. STAT BAND */}
      <section className="stat-section bg-slate-50 py-24 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200">
            
            <div className="stat-item opacity-0 space-y-2 py-4 md:py-0 cursor-default">
              <p className="font-serif text-5xl sm:text-6xl text-slate-900 font-normal tracking-tight">
                <span className="stat-count" data-target="2400">0</span>
                <em className="italic text-blue-600 font-normal">+</em>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                Students Certified
              </p>
            </div>

            <div className="stat-item opacity-0 space-y-2 py-4 md:py-0 cursor-default">
              <p className="font-serif text-5xl sm:text-6xl text-slate-900 font-normal tracking-tight">
                <span className="stat-count" data-target="12">0</span>
                <em className="italic text-blue-600 font-normal"> Years</em>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                Pedagogical Experience
              </p>
            </div>

            <div className="stat-item opacity-0 space-y-2 py-4 md:py-0 cursor-default">
              <p className="font-serif text-5xl sm:text-6xl text-slate-900 font-normal tracking-tight">
                <span className="stat-count" data-target="98.4" data-decimals="1">0</span>
                <em className="italic text-blue-600 font-normal">%</em>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                First Attempt Pass Rate
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. ALTERNATING LIGHT SECTION: PEDAGOGY STANDARDS */}
      <section className="pedagogy-section bg-white text-slate-900 py-28 lg:py-36 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-20">
          
          <div className="pedagogy-header opacity-0 max-w-3xl space-y-4">
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

          <div className="pedagogy-cards-grid grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="pedagogy-card-container opacity-0">
              <div className="space-y-4 border border-l-4 border-l-blue-500 border-slate-200 bg-white shadow-card p-6 rounded-r-2xl h-full">
                <ShieldCheck className="w-8 h-8 text-blue-600 stroke-[1.25]" />
                <h3 className="font-serif text-2xl text-slate-900 font-normal">
                  Dual-Control Safety
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-light">
                  Every vehicle features instructor dual-pedal overrides, ensuring instant safety intervention during real traffic sessions.
                </p>
              </div>
            </div>

            <div className="pedagogy-card-container opacity-0">
              <div className="space-y-4 border border-l-4 border-l-blue-500 border-slate-200 bg-white shadow-card p-6 rounded-r-2xl h-full">
                <SlidersHorizontal className="w-8 h-8 text-blue-600 stroke-[1.25]" />
                <h3 className="font-serif text-2xl text-slate-900 font-normal">
                  Tailored Progression
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-light">
                  Progress from private track maneuvering to main-road navigation at a pace tailored specifically to your comfort level.
                </p>
              </div>
            </div>

            <div className="pedagogy-card-container opacity-0">
              <div className="space-y-4 border border-l-4 border-l-blue-500 border-slate-200 bg-white shadow-card p-6 rounded-r-2xl h-full">
                <Award className="w-8 h-8 text-blue-600 stroke-[1.25]" />
                <h3 className="font-serif text-2xl text-slate-900 font-normal">
                  RTO Exam Fast-Track
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-light">
                  Full documentation assistance and mock driver tests covering track parallel parking, H-tracks, and gradient starts.
                </p>
              </div>
            </div>

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
            <Magnetic range={30} strength={0.35}>
              <Link
                href="/book"
                className="bg-white hover:bg-blue-55 text-blue-600 font-bold text-xs uppercase tracking-widest px-10 py-5 rounded-full inline-flex items-center gap-3 shadow-2xl shadow-white/20 hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <span>Reserve Your Session Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>

    </div>
  );
}
