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
      className="overflow-hidden mesh-gradient-slow"
      style={{ backgroundColor: '#F8FAFC' }}
    >

      {/* ═══════════════════════════════════════════
          1. CINEMATIC SPATIAL HERO
          ═══════════════════════════════════════════ */}
      <section className="hero-section relative pt-24 pb-32 lg:pt-40 lg:pb-48 overflow-hidden flex items-center min-h-[92vh]">

        {/* ── Multi-layer atmospheric background video ── */}
        <div aria-hidden="true" className="hero-bg-layer absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/images/hero_spatial_bg.jpg"
            className="hero-bg-img w-full h-full object-cover opacity-0 scale-[1.05] pointer-events-none"
            style={{ willChange: 'opacity, transform' }}
          >
            <source src="/videos/swift.mp4" type="video/mp4" />
          </video>
          {/* Layered vignette overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/30 via-[#F8FAFC]/55 to-[#F8FAFC]/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFC]/20 via-transparent to-[#F8FAFC]/20" />
        </div>

        {/* ── Mesh Gradient overlay ── */}
        <div className="mesh-gradient-container opacity-0 absolute inset-0 z-0 pointer-events-none" style={{ willChange: 'opacity, transform' }}>
          <MeshGradient />
        </div>

        {/* ── Floating particles ── */}
        <div className="floating-particles-container opacity-0 absolute inset-0 z-0 pointer-events-none">
          <FloatingParticles count={25} />
        </div>

        {/* ── 3D decorative scene ── */}
        <Hero3DScene className="ambient-float-item absolute inset-0 w-full h-full" />

        {/* ── Ambient lighting sources ── */}
        {/* Top-left: Blue */}
        <div
          aria-hidden="true"
          className="hero-ambient-tl ambient-parallax-fast absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full pointer-events-none opacity-0"
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Top-right: Purple */}
        <div
          aria-hidden="true"
          className="hero-ambient-tr ambient-parallax-slow absolute -top-24 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none opacity-0"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
        {/* Bottom center: Cyan whisper */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(6,182,212,0.05) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />

        {/* ── Floating decorative rings (desktop only) ── */}
        <div aria-hidden="true" className="hidden lg:block absolute top-[18%] right-[8%] w-24 h-24 rounded-full border border-blue-200/30 float-ring" style={{ animationDelay: '0s' }} />
        <div aria-hidden="true" className="hidden lg:block absolute top-[45%] right-[4%] w-14 h-14 rounded-full border border-purple-200/25 float-ring-slow" style={{ animationDelay: '2s' }} />
        <div aria-hidden="true" className="hidden lg:block absolute bottom-[20%] left-[6%] w-20 h-20 rounded-full border border-cyan-200/20 float-ring" style={{ animationDelay: '1s' }} />
        <div aria-hidden="true" className="hidden lg:block absolute top-[30%] left-[5%] w-8 h-8 rounded-full bg-blue-400/8 blur-sm drift-blob" />

        {/* ── Hero Content ── */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10 w-full">
          <div className="text-center max-w-5xl mx-auto space-y-10">

            {/* Badge */}
            <div className="hero-badge opacity-0 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-blue-600 text-xs font-semibold tracking-widest uppercase select-none"
              style={{
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(37,99,235,0.15)',
                boxShadow: '0 2px 12px rgba(37,99,235,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Certified Automotive Pedagogy</span>
            </div>

            {/* Headline */}
            <h1 className="hero-title font-serif text-[clamp(3.2rem,8vw,6.5rem)] font-normal text-slate-900 leading-[1.02] tracking-tight">
              Learn to Drive with Confidence
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle opacity-0 text-lg sm:text-xl text-slate-500 font-light leading-relaxed max-w-2xl mx-auto">
              Safe, structured instruction for first-time drivers. Our pedagogical methodology builds lasting competence, road safety, and stress-free license certification.
            </p>

            {/* CTA */}
            <div className="hero-ctas opacity-0 flex flex-col sm:flex-row items-center justify-center gap-5 pt-2">
              <Magnetic range={25} strength={0.2}>
                <Link
                  href="/courses"
                  className="group relative overflow-hidden border text-slate-700 font-semibold text-xs uppercase tracking-widest px-9 py-4 rounded-full flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderColor: 'rgba(37,99,235,0.15)',
                    boxShadow: '0 2px 12px rgba(15,23,42,0.06), 0 8px 32px rgba(37,99,235,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
                  }}
                >
                  <span>Explore Curriculum</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Magnetic>
            </div>

            {/* Social proof bar */}
            <div className="hero-proof opacity-0 pt-4 flex flex-wrap items-center justify-center gap-5 sm:gap-8 select-none">
              <div
                className="flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(226,232,240,0.7)',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
                }}
              >
                <div className="flex -space-x-2">
                  <Image src="/images/rajesh.jpg" alt="Student" width={28} height={28} className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                  <Image src="/images/priya.jpg" alt="Student" width={28} height={28} className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    +2.4k
                  </div>
                </div>
                <span className="text-xs text-slate-600 font-medium">Certified Student Drivers</span>
              </div>

              <div
                className="flex items-center gap-2 text-xs text-slate-600 font-medium px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(226,232,240,0.7)',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
                }}
              >
                <span className="text-yellow-500 text-sm">★★★★★</span>
                <span>98.4% First-Attempt Pass Rate</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── Curved SVG bottom fade to stat band ── */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-16 sm:h-20" preserveAspectRatio="none">
            <path d="M0,80 C360,20 1080,20 1440,80 L1440,80 L0,80 Z" fill="rgba(238,244,255,0.55)" />
          </svg>
        </div>

      </section>

      {/* ═══════════════════════════════════════════
          2. FROSTED GLASS STAT BAND
          ═══════════════════════════════════════════ */}
      <section
        className="stat-section relative py-20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #EEF4FF 0%, #F8F5FF 50%, #F5F9FF 100%)' }}
      >
        {/* Ambient blob behind stats */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 rounded-full drift-blob"
            style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-56 h-56 rounded-full drift-blob-alt"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        </div>

        <div className="max-w-6xl mx-auto px-6 sm:px-8 relative z-10">
          {/* Frosted glass container */}
          <div
            className="rounded-3xl p-10 sm:p-14"
            style={{
              background: 'rgba(255,255,255,0.62)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.55)',
              boxShadow: '0 4px 16px rgba(15,23,42,0.04), 0 16px 56px rgba(37,99,235,0.07), 0 40px 100px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200/60">

              <div className="stat-item opacity-0 space-y-3 py-6 md:py-0 cursor-default">
                <p className="font-serif text-5xl sm:text-6xl font-normal tracking-tight" style={{ color: '#0F172A' }}>
                  <span className="stat-count" data-target="2400">0</span>
                  <em className="italic font-normal" style={{ color: '#2563EB' }}>+</em>
                </p>
                <p className="text-xs uppercase tracking-[0.15em] font-semibold" style={{ color: '#64748B' }}>
                  Students Certified
                </p>
              </div>

              <div className="stat-item opacity-0 space-y-3 py-6 md:py-0 cursor-default">
                <p className="font-serif text-5xl sm:text-6xl font-normal tracking-tight" style={{ color: '#0F172A' }}>
                  <span className="stat-count" data-target="12">0</span>
                  <em className="italic font-normal" style={{ color: '#2563EB' }}> Yrs</em>
                </p>
                <p className="text-xs uppercase tracking-[0.15em] font-semibold" style={{ color: '#64748B' }}>
                  Pedagogical Experience
                </p>
              </div>

              <div className="stat-item opacity-0 space-y-3 py-6 md:py-0 cursor-default">
                <p className="font-serif text-5xl sm:text-6xl font-normal tracking-tight" style={{ color: '#0F172A' }}>
                  <span className="stat-count" data-target="98.4" data-decimals="1">0</span>
                  <em className="italic font-normal" style={{ color: '#2563EB' }}>%</em>
                </p>
                <p className="text-xs uppercase tracking-[0.15em] font-semibold" style={{ color: '#64748B' }}>
                  First-Attempt Pass Rate
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. PEDAGOGY STANDARDS — GRADIENT BORDER CARDS
          ═══════════════════════════════════════════ */}
      <section
        className="pedagogy-section relative py-32 lg:py-40 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F8FAFC 100%)' }}
      >
        {/* Ambient lighting */}
        <div aria-hidden="true" className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div aria-hidden="true" className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 65%)', filter: 'blur(80px)' }} />

        {/* Decorative floating rings */}
        <div aria-hidden="true" className="hidden lg:block absolute top-[15%] left-[3%] w-32 h-32 rounded-full border border-blue-100/60 float-ring-slow" />
        <div aria-hidden="true" className="hidden lg:block absolute bottom-[12%] right-[4%] w-20 h-20 rounded-full border border-purple-100/50 float-ring" />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-20 relative z-10">

          {/* Section header */}
          <div className="pedagogy-header opacity-0 max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] px-4 py-1.5 rounded-full"
              style={{
                color: '#2563EB',
                background: 'rgba(37,99,235,0.07)',
                border: '1px solid rgba(37,99,235,0.12)',
              }}
            >
              Pedagogical Standards
            </span>
            <h2 className="font-serif text-[clamp(2.4rem,5vw,4rem)] font-normal text-slate-900 tracking-tight leading-[1.08]">
              Designed for Stress-Free{' '}
              <em className="italic not-italic" style={{ color: '#2563EB' }}>Mastery</em>
            </h2>
            <p className="text-lg text-slate-500 font-light leading-relaxed max-w-2xl">
              We replace anxiety with structured practice. Every training module builds muscle memory, spatial awareness, and calm decision-making.
            </p>
          </div>

          {/* Gradient-border cards grid */}
          <div className="pedagogy-cards-grid grid grid-cols-1 md:grid-cols-3 gap-8">

            {[
              {
                icon: <ShieldCheck className="w-7 h-7 stroke-[1.5]" style={{ color: '#2563EB' }} />,
                title: 'Dual-Control Safety',
                desc: 'Every vehicle features instructor dual-pedal overrides, ensuring instant safety intervention during real traffic sessions.',
              },
              {
                icon: <SlidersHorizontal className="w-7 h-7 stroke-[1.5]" style={{ color: '#7C3AED' }} />,
                title: 'Tailored Progression',
                desc: 'Progress from private track maneuvering to main-road navigation at a pace calibrated to your unique comfort level.',
              },
              {
                icon: <Award className="w-7 h-7 stroke-[1.5]" style={{ color: '#06B6D4' }} />,
                title: 'RTO Exam Fast-Track',
                desc: 'Full documentation assistance and mock driver tests covering parallel parking, H-tracks, and gradient starts.',
              },
            ].map((card, i) => (
              <div key={i} className="pedagogy-card-container opacity-0 group/card">
                {/* Gradient border wrapper — p-[1.5px] technique */}
                <div
                  className="gradient-border-card p-[1.5px] rounded-3xl h-full"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {/* Inner frosted card */}
                  <div
                    className="rounded-[22px] h-full p-8 flex flex-col gap-5 relative overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.92)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                    }}
                  >
                    {/* Subtle top-corner highlight */}
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)' }} />
                    {/* Ambient inner glow on hover */}
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', filter: 'blur(20px)' }} />

                    {/* Icon container */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.10)' }}>
                      {card.icon}
                    </div>

                    <div className="space-y-2.5">
                      <h3 className="font-serif text-[1.4rem] text-slate-900 font-normal leading-snug">
                        {card.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-light">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ─── Curved SVG transition into CTA ─── */}
      <div aria-hidden="true" className="pointer-events-none -mt-1 overflow-hidden leading-none">
        <svg viewBox="0 0 1440 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none" style={{ height: '60px' }}>
          <path d="M0,0 C480,90 960,90 1440,0 L1440,90 L0,90 Z" fill="url(#ctaFill)" />
          <defs>
            <linearGradient id="ctaFill" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ═══════════════════════════════════════════
          4. PREMIUM CTA BAND
          ═══════════════════════════════════════════ */}
      <section className="relative py-32 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 45%, #7C3AED 100%)' }}
      >
        {/* Noise texture overlay on dark section */}
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Ambient glows inside CTA */}
        <div aria-hidden="true" className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div aria-hidden="true" className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.30) 0%, transparent 70%)', filter: 'blur(80px)' }} />

        {/* Floating decorative rings */}
        <div aria-hidden="true" className="hidden lg:block absolute top-8 left-[10%] w-32 h-32 rounded-full border border-white/10 float-ring" />
        <div aria-hidden="true" className="hidden lg:block absolute bottom-8 right-[10%] w-20 h-20 rounded-full border border-white/10 float-ring-slow" />
        <div aria-hidden="true" className="hidden lg:block absolute top-[30%] right-[6%] w-10 h-10 rounded-full border border-white/15 float-ring" style={{ animationDelay: '1s' }} />

        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8 relative z-10">

          {/* Glass floating content panel */}
          <div className="mx-auto max-w-3xl rounded-3xl p-10 sm:p-14 relative"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <h2 className="font-serif text-[clamp(2.4rem,6vw,4.2rem)] font-normal text-white tracking-tight leading-[1.05] mb-6">
              Your Journey to{' '}
              <em className="italic font-normal" style={{ color: 'rgba(167,243,208,0.95)' }}>Freedom</em>{' '}
              Starts Today
            </h2>
            <p className="text-lg text-white/80 font-light max-w-xl mx-auto leading-relaxed mb-10">
              Reserve your preferred training vehicle, instructor, and schedule online in under 2 minutes.
            </p>

            <Magnetic range={35} strength={0.4}>
              <Link
                href="/book"
                className="group relative overflow-hidden bg-white text-blue-700 font-bold text-xs uppercase tracking-widest px-12 py-5 rounded-full inline-flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  boxShadow: '0 8px 32px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,1)',
                }}
              >
                {/* Shimmer sweep */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/60 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative">Reserve Your Session Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative" />
              </Link>
            </Magnetic>
          </div>

        </div>
      </section>

    </div>
  );
}
