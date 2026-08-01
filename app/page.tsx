'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, Users, CheckCircle2, ArrowRight, Star, Clock, Car, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Tilt3DCard } from '@/components/ui/Tilt3DCard';

export default function HomePage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="space-y-0 overflow-hidden">
      
      {/* 1. 3D HERO & SWIFT VIDEO SHOWCASE STAGE */}
      <section className="relative bg-[#0A1128] py-24 lg:py-32 border-b border-slate-800/60 overflow-hidden">
        
        {/* Background Ambient 3D Glow Orbs */}
        <div aria-hidden="true" className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div aria-hidden="true" className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Content Column */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-6 space-y-8"
            >
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-amber-400/30 text-amber-400 text-xs font-medium tracking-widest uppercase bg-amber-400/5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>3D Interactive Learning Experience</span>
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-100 leading-[1.08] tracking-tight">
                Master Driving in <em className="italic text-amber-400 font-normal">3D Depth</em>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed max-w-xl">
                Experience dual-control training with real-time video telemetry, sensor guidance, and high-precision hatchback & sedan maneuverability.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 pt-4">
                <Link
                  href="/book"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-full flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/20 hover:scale-[1.03] transition-all"
                >
                  <span>Reserve Session Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/fleet"
                  className="border border-slate-700/80 hover:border-slate-500 text-slate-200 font-medium text-xs uppercase tracking-wider px-7 py-4 rounded-full flex items-center justify-center transition"
                >
                  Explore Fleet
                </Link>
              </div>

              <div className="pt-8 border-t border-slate-800/80 flex items-center gap-8 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-serif text-base italic">✓</span>
                  <span>Dual Control Pedals</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-serif text-base italic">✓</span>
                  <span>ISO 9001 Certified Fleet</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: 3D Perspective Swift Video Stage */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-6 relative"
            >
              <Tilt3DCard intensity={12}>
                <div className="relative rounded-3xl overflow-hidden border border-slate-700/60 bg-[#070B19] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] group">
                  
                  {/* HTML5 Swift Video Showcase Player */}
                  <div className="relative h-[380px] sm:h-[460px] w-full overflow-hidden bg-slate-950">
                    <video
                      ref={videoRef}
                      src="/videos/swift.mp4"
                      poster="/images/swift.jpg"
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Gradient Depth Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070B19] via-transparent to-transparent opacity-80" />

                    {/* Floating 3D Video Controls Bar */}
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                      <button
                        onClick={togglePlay}
                        className="w-9 h-9 rounded-full bg-[#070B19]/80 backdrop-blur-md border border-slate-700/80 text-slate-200 flex items-center justify-center hover:text-amber-400 transition"
                        title={isPlaying ? 'Pause Video' : 'Play Video'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="w-9 h-9 rounded-full bg-[#070B19]/80 backdrop-blur-md border border-slate-700/80 text-slate-200 flex items-center justify-center hover:text-amber-400 transition"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 3D Floating Badge Card Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 p-6 bg-[#070B19]/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl flex items-center justify-between shadow-2xl">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-amber-400">Featured Dual-Control Vehicle</span>
                      <h3 className="font-serif text-2xl text-slate-100 font-normal">
                        Maruti Suzuki <em className="italic text-amber-400 font-normal">Swift Pro</em>
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="font-serif text-xl text-slate-200 block font-normal">₹620</span>
                      <span className="text-[10px] uppercase text-slate-400 tracking-wider">/ Session</span>
                    </div>
                  </div>

                </div>
              </Tilt3DCard>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. 3D METRIC STAT BAND */}
      <section className="bg-[#070B19] py-20 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800/60">
            
            <Tilt3DCard intensity={8}>
              <div className="space-y-2 py-4 md:py-0 p-6 rounded-2xl hover:bg-slate-900/40 transition">
                <p className="font-serif text-5xl sm:text-6xl text-slate-100 font-normal tracking-tight">
                  2,400<em className="italic text-amber-400 font-normal">+</em>
                </p>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                  Students Certified
                </p>
              </div>
            </Tilt3DCard>

            <Tilt3DCard intensity={8}>
              <div className="space-y-2 py-4 md:py-0 p-6 rounded-2xl hover:bg-slate-900/40 transition">
                <p className="font-serif text-5xl sm:text-6xl text-slate-100 font-normal tracking-tight">
                  12<em className="italic text-amber-400 font-normal">Years</em>
                </p>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                  Pedagogical Experience
                </p>
              </div>
            </Tilt3DCard>

            <Tilt3DCard intensity={8}>
              <div className="space-y-2 py-4 md:py-0 p-6 rounded-2xl hover:bg-slate-900/40 transition">
                <p className="font-serif text-5xl sm:text-6xl text-slate-100 font-normal tracking-tight">
                  98.4<em className="italic text-amber-400 font-normal">%</em>
                </p>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                  First Attempt Pass Rate
                </p>
              </div>
            </Tilt3DCard>

          </div>
        </div>
      </section>

      {/* 3. ALTERNATING LIGHT SECTION: PEDAGOGY STANDARDS (#FAF8F3) */}
      <section className="bg-[#FAF8F3] text-slate-900 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">
              Pedagogical Excellence
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-normal text-slate-900 tracking-tight leading-tight">
              Designed for Stress-Free <em className="italic text-amber-600 font-normal">Mastery</em>
            </h2>
            <p className="text-base text-slate-600 font-light leading-relaxed">
              We replace anxiety with structured practice. Every training module is engineered to build muscle memory, spatial awareness, and calm decision-making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            
            <Tilt3DCard intensity={10}>
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all space-y-4 h-full">
                <ShieldCheck className="w-8 h-8 text-amber-600 stroke-[1.25]" />
                <h3 className="font-serif text-2xl text-slate-900 font-normal">
                  Dual-Control Safety
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-light">
                  Every vehicle features instructor dual-pedal overrides, ensuring instant safety intervention during real traffic sessions.
                </p>
              </div>
            </Tilt3DCard>

            <Tilt3DCard intensity={10}>
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all space-y-4 h-full">
                <Car className="w-8 h-8 text-amber-600 stroke-[1.25]" />
                <h3 className="font-serif text-2xl text-slate-900 font-normal">
                  Tailored Progression
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-light">
                  Progress from private track maneuvering to main-road navigation at a pace tailored specifically to your comfort level.
                </p>
              </div>
            </Tilt3DCard>

            <Tilt3DCard intensity={10}>
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all space-y-4 h-full">
                <Award className="w-8 h-8 text-amber-600 stroke-[1.25]" />
                <h3 className="font-serif text-2xl text-slate-900 font-normal">
                  RTO Exam Fast-Track
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-light">
                  Full documentation assistance and mock driver tests covering track parallel parking, H-tracks, and gradient starts.
                </p>
              </div>
            </Tilt3DCard>

          </div>

        </div>
      </section>

      {/* 4. CTA BAND */}
      <section className="bg-[#070B19] py-28 text-center border-t border-slate-800/60 relative overflow-hidden">
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8 relative z-10">
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-slate-100 tracking-tight leading-tight">
            Your Journey to <em className="italic text-amber-400 font-normal">Freedom</em> Starts Today
          </h2>
          <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Reserve your preferred training vehicle, instructor, and schedule online in under 2 minutes.
          </p>
          <div className="pt-2">
            <Link
              href="/book"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-9 py-4 rounded-full inline-flex items-center gap-2 shadow-xl shadow-amber-500/10 hover:scale-[1.02] transition-all"
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
