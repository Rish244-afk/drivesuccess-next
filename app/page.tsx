'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ShieldCheck, Award, ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Magnetic } from '@/components/ui/Magnetic';

const MeshGradient = dynamic(() => import('@/components/ui/MeshGradient'), { ssr: false });
const FloatingParticles = dynamic(() => import('@/components/ui/FloatingParticles'), { ssr: false });
const Hero3DScene = dynamic(() => import('@/components/ui/Hero3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 -z-10" />,
});

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  /* ─── Mouse-responsive ambient lighting ─── */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  /* ─── GSAP Animations ─── */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
      tl.fromTo('.hero-bg-img',
        { opacity: 0, scale: 1.05 },
        { opacity: 0.45, scale: 1, duration: 1.8 }
      )
      .fromTo('.mesh-gradient-container',
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 1.4 },
        '-=1.4'
      )
      .fromTo('.floating-particles-container',
        { opacity: 0 },
        { opacity: 1, duration: 1.2 },
        '-=1.1'
      )
      .fromTo('.hero-ambient-tl, .hero-ambient-tr',
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, stagger: 0.1, duration: 2 },
        '-=1.0'
      )
      .fromTo('.hero-badge',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9 },
        '-=1.2'
      )
      .to('.hero-title-word',
        { y: '0%', stagger: 0.055, duration: 1.0, ease: 'power3.out' },
        '-=0.7'
      )
      .fromTo('.hero-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.9 },
        '-=0.65'
      )
      .fromTo('.hero-ctas',
        { opacity: 0, scale: 0.94, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8 },
        '-=0.6'
      )
      .fromTo('.hero-proof',
        { opacity: 0, y: 18 },
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
          duration: 2.4,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
          onUpdate: () => {
            el.innerText = obj.val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          },
        });
      });

      // 4. Stat items stagger
      gsap.fromTo('.stat-item',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, stagger: 0.14, duration: 0.85, ease: 'power2.out',
          scrollTrigger: { trigger: '.stat-section', start: 'top 80%', toggleActions: 'play none none none' },
        }
      );

      // 5. Pedagogy header
      gsap.fromTo('.pedagogy-header',
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 1.0, ease: 'power2.out',
          scrollTrigger: { trigger: '.pedagogy-section', start: 'top 80%', toggleActions: 'play none none none' },
        }
      );

      // 6. Pedagogy cards with stagger
      gsap.fromTo('.pedagogy-card-container',
        { opacity: 0, y: 50, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, stagger: 0.18, duration: 0.9, ease: 'power2.out',
          scrollTrigger: { trigger: '.pedagogy-cards-grid', start: 'top 80%', toggleActions: 'play none none none' },
        }
      );

      // 7. Soft parallax on hero background
      gsap.to('.hero-bg-layer', {
        yPercent: 14,
        ease: 'none',
        scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: true },
      });

      // 8. Ambient blobs parallax drift
      gsap.to('.ambient-parallax-fast', {
        yPercent: -20,
        ease: 'none',
        scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1.5 },
      });
      gsap.to('.ambient-parallax-slow', {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 3 },
      });

      // 9. Ambient float loops
      gsap.to('.ambient-float-item', {
        y: 'random(-12, 12)',
        x: 'random(-8, 8)',
        rotation: 'random(-6, 6)',
        duration: 'random(4, 8)',
        repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.25,
      });
    };

    initGsap();

    return () => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden bg-[#090A0F] text-slate-100 font-sans"
    >

      {/* ═══════════════════════════════════════════
          1. CINEMATIC SPATIAL HERO
          ═══════════════════════════════════════════ */}
      <section className="hero-section relative pt-20 pb-24 lg:pt-36 lg:pb-44 overflow-hidden flex items-center min-h-[90vh]">

        {/* ── Multi-layer atmospheric background ── */}
        <div aria-hidden="true" className="hero-bg-layer absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/images/hero_spatial_bg.jpg"
            className="hero-bg-img w-full h-full object-cover opacity-20 scale-[1.05] pointer-events-none filter brightness-75 contrast-125"
            style={{ willChange: 'opacity, transform' }}
          >
            <source src="/videos/swift.mp4" type="video/mp4" />
          </video>
          {/* Layered dark vignette overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#090A0F] via-[#090A0F]/80 to-[#090A0F]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090A0F] via-transparent to-[#090A0F]" />
        </div>

        {/* ── Mesh Gradient overlay ── */}
        <div className="mesh-gradient-container opacity-40 absolute inset-0 z-0 pointer-events-none" style={{ willChange: 'opacity, transform' }}>
          <MeshGradient />
        </div>

        {/* ── Floating particles ── */}
        <div className="floating-particles-container opacity-60 absolute inset-0 z-0 pointer-events-none">
          <FloatingParticles count={25} />
        </div>

        {/* ── 3D decorative scene ── */}
        <Hero3DScene className="ambient-float-item absolute inset-0 w-full h-full opacity-40" />

        {/* ── Ambient glowing lights ── */}
        <div
          aria-hidden="true"
          className="hero-ambient-tl ambient-parallax-fast absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          aria-hidden="true"
          className="hero-ambient-tr ambient-parallax-slow absolute -top-24 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
            filter: 'blur(90px)',
          }}
        />

        {/* ── Hero Content ── */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10 w-full">
          <div className="text-center max-w-5xl mx-auto space-y-10">

            {/* Badge */}
            <div className="hero-badge opacity-0 inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-cyan-400 text-xs font-semibold tracking-[0.2em] uppercase select-none"
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.1)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vahathi Motor Driving School • BTM Stage 2</span>
            </div>

            {/* Oversized Headline */}
            <h1 className="hero-title font-serif text-[clamp(3rem,7.5vw,6rem)] font-normal text-white leading-[1.03] tracking-tight">
              Master the Road with <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Serenity & Precision.</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle opacity-0 text-base sm:text-xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto px-2">
              Safe, structured driving instruction for first-time drivers. Dual-control Hyundai Creta SUV & Honda City fleet, certified master instructors, and end-to-end RTO licensing support in Bengaluru.
            </p>

            {/* CTA Buttons */}
            <div className="hero-ctas opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-3">
              <Magnetic range={25} strength={0.2}>
                <Link
                  href="/book"
                  className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-widest w-full sm:w-auto px-10 py-4.5 rounded-full flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(56,189,248,0.35)] border border-cyan-300/30"
                >
                  <span>Book Training Session</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Magnetic>

              <Magnetic range={25} strength={0.2}>
                <Link
                  href="/courses"
                  className="group relative overflow-hidden bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 font-semibold text-xs uppercase tracking-widest w-full sm:w-auto px-9 py-4.5 rounded-full flex items-center justify-center gap-3 transition-all duration-300 hover:border-cyan-400/50"
                  style={{ backdropFilter: 'blur(20px)' }}
                >
                  <span>Explore Packages</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-cyan-400" />
                </Link>
              </Magnetic>
            </div>

            {/* Verified highlights bar */}
            <div className="hero-proof opacity-0 pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 select-none">
              <div
                className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-slate-300 text-xs font-medium"
              >
                <div className="flex -space-x-2">
                  <Image src="/images/rajesh.jpg" alt="Rajesh Kumar" width={28} height={28} className="w-7 h-7 rounded-full border-2 border-slate-900 object-cover" />
                  <Image src="/images/priya.jpg" alt="Priya Sharma" width={28} height={28} className="w-7 h-7 rounded-full border-2 border-slate-900 object-cover" />
                </div>
                <span>Certified Master Instructors (12+ Yrs Exp)</span>
              </div>

              <div
                className="flex items-center gap-2 text-xs text-slate-300 font-medium px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>100% Dual-Control Pedal Vehicles</span>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ═══════════════════════════════════════════
          2. HORIZONTAL METRIC & INFORMATION STRIP
          ═══════════════════════════════════════════ */}
      <section className="stat-section relative py-12 border-y border-white/10 bg-[#0D0E15]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div
            className="rounded-3xl p-8 sm:p-12 border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">

              <div className="stat-item space-y-2 py-4 md:py-0">
                <p className="font-serif text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                  100<span className="text-cyan-400">%</span>
                </p>
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-400">
                  Dual-Control Fleet Safety
                </p>
              </div>

              <div className="stat-item space-y-2 py-4 md:py-0">
                <p className="font-serif text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                  12<span className="text-cyan-400">+ Yrs</span>
                </p>
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-400">
                  Pedagogical Instruction
                </p>
              </div>

              <div className="stat-item space-y-2 py-4 md:py-0">
                <p className="font-serif text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                  2W &amp; 4W
                </p>
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-400">
                  RTO License Support
                </p>
              </div>

              <div className="stat-item space-y-2 py-4 md:py-0">
                <p className="font-serif text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                  6 AM – 8 PM
                </p>
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-400">
                  Flexible Daily Slots
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. FEATURE CARD SYSTEM (4 VISUAL CARDS)
          ═══════════════════════════════════════════ */}
      <section className="pedagogy-section relative py-28 lg:py-36 bg-[#090A0F]">
        {/* Ambient lighting */}
        <div aria-hidden="true" className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 65%)', filter: 'blur(100px)' }} />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16 relative z-10">

          {/* Section header */}
          <div className="pedagogy-header opacity-0 max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full text-cyan-400 bg-cyan-950/40 border border-cyan-500/20">
              DriveSuccess Standards
            </span>
            <h2 className="font-serif text-[clamp(2.2rem,4.5vw,3.6rem)] font-normal text-white tracking-tight leading-[1.1]">
              Architected for Absolute <span className="italic text-cyan-400">Road Confidence</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 font-light leading-relaxed">
              We eliminate driving anxiety with structured module progression, dual-control instructor intervention, and complete RTO license assistance.
            </p>
          </div>

          {/* 4 Feature Cards Grid */}
          <div className="pedagogy-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {[
              {
                num: '01',
                title: 'Structured Curriculum',
                desc: 'Module-by-module learning from clutch-gear coordination and parking geometry to high-speed spatial dynamics.',
                badge: '10 & 15 Days',
              },
              {
                num: '02',
                title: 'Dual-Control Smart Fleet',
                desc: 'Hyundai Creta SUV, Honda City sedan, and Swift hatchbacks equipped with dual pedals and instructor safety overrides.',
                badge: 'SUV & Sedan',
              },
              {
                num: '03',
                title: '1-on-1 Master Mentorship',
                desc: 'Dedicated RTO-certified instructors (Rajesh Kumar & Priya Sharma) assigned to match your personal learning pace.',
                badge: 'Certified Mentors',
              },
              {
                num: '04',
                title: 'RTO Vault & Support',
                desc: 'Complete documentation filing for Form 20, Learner’s License, and official RTO driving track exam support.',
                badge: 'RTO Support',
              },
            ].map((card, i) => (
              <div key={i} className="pedagogy-card-container opacity-0 group/card">
                <div className="h-full rounded-3xl p-7 border border-white/10 bg-[#12141F] hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden group-hover/card:shadow-[0_0_30px_rgba(56,189,248,0.15)]">
                  
                  {/* Glowing corner glow */}
                  <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-cyan-500/10 blur-xl group-hover/card:bg-cyan-500/20 transition-all duration-500 pointer-events-none" />

                  <div className="space-y-4 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-2xl font-bold text-cyan-400/80 group-hover/card:text-cyan-400 transition-colors">
                        {card.num}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl text-white font-medium leading-snug group-hover/card:text-cyan-300 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-light">
                      {card.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-cyan-400 gap-2 group-hover/card:translate-x-1 transition-transform">
                    <span>Learn Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. EDITORIAL STORYTELLING SECTION
          ═══════════════════════════════════════════ */}
      <section className="relative py-24 bg-[#0D0E15] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Story Visual Card */}
            <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] group">
              <Image
                src="/images/creta.jpg"
                alt="DriveSuccess Learning Vehicle Fleet"
                width={700}
                height={460}
                className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700 brightness-90 contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-transparent to-transparent opacity-90" />
              
              <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-[#090A0F]/80 backdrop-blur-xl border border-white/10 space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                  Dual-Control Telemetry &amp; Override
                </span>
                <h4 className="font-serif text-lg text-white font-medium">
                  Hyundai Creta SUV Practical Training Unit
                </h4>
                <p className="text-xs text-slate-400">
                  Elevated driving posture, electronic brake override, and real-time clutch monitoring.
                </p>
              </div>
            </div>

            {/* Story Text Content */}
            <div className="space-y-8">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/20">
                The DriveSuccess Method
              </span>

              <h2 className="font-serif text-[clamp(2.2rem,4vw,3.4rem)] font-normal text-white leading-[1.1] tracking-tight">
                Pedagogy Built Around <span className="italic text-cyan-400">Calm Control</span>
              </h2>

              <p className="text-base text-slate-300 font-light leading-relaxed">
                Traditional driving lessons often cause unnecessary stress. At DriveSuccess Academy, our certified instructors use step-by-step spatial telemetry and dual-control vehicles to ensure safety before introducing complex traffic maneuvers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <h4 className="font-serif text-base text-white font-semibold mb-1">
                    Track &amp; Road Practice
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Dedicated practice on RTO track geometries (H-track, slope start, reverse parking) followed by main road navigation.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <h4 className="font-serif text-base text-white font-semibold mb-1">
                    Doorstep Pickup Available
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Convenient session pickups in BTM Layout, Kasavanahalli, HSR, and surrounding Eastwood Township locations.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/fleet"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span>Explore Our Dual-Control Fleet</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5. HIGH-IMPACT CALL TO ACTION
          ═══════════════════════════════════════════ */}
      <section className="relative py-28 text-center overflow-hidden bg-[#090A0F]">
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(56,189,248,0.12) 0%, transparent 70%)', filter: 'blur(100px)' }} />

        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8 relative z-10">
          <div className="rounded-3xl p-10 sm:p-16 border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] space-y-8">
            
            <h2 className="font-serif text-[clamp(2.4rem,5.5vw,4rem)] font-normal text-white tracking-tight leading-[1.08]">
              Start Your Driving Journey <span className="italic text-cyan-400">Today</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
              Reserve your vehicle, instructor, and preferred morning or evening session online in under 2 minutes.
            </p>

            <div className="pt-2">
              <Magnetic range={35} strength={0.4}>
                <Link
                  href="/book"
                  className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-widest px-12 py-5 rounded-full inline-flex items-center gap-3 transition-all duration-300 hover:scale-105 shadow-[0_0_35px_rgba(56,189,248,0.4)] border border-cyan-300/30"
                >
                  <span>Reserve Your Training Session</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Magnetic>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
