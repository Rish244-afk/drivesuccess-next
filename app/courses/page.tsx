'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, CheckCircle2, ArrowRight, Star, Sparkles, SlidersHorizontal, BookOpen, Clock } from 'lucide-react';
import { getPackagesAction } from '@/actions/package';
import { BoneyardWrapper, CourseCardSkeleton } from '@/components/ui/Skeleton';
import { InspiraCard } from '@/components/ui/InspiraCard';
import { AnimatedIcon } from '@/components/ui/AnimatedIcon';

interface DbPackage {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  price: number;
  sessionsCount: number;
  badge?: string | null;
  isPopular: boolean;
}

export default function CoursesPage() {
  const [packages, setPackages] = useState<DbPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  useEffect(() => {
    async function loadPackages() {
      setLoading(true);
      const res = await getPackagesAction();
      if (res.success && res.data) {
        setPackages(res.data as DbPackage[]);
      }
      setLoading(false);
    }
    loadPackages();
  }, []);

  const filteredPackages = packages.filter((pkg) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'LICENSE') return pkg.type.includes('LICENSE') || pkg.type.includes('COMBO');
    if (activeFilter === 'TRANSFER') return pkg.type.includes('IDL') || pkg.type.includes('RENEWAL');
    if (activeFilter === 'SUPPORT') return pkg.type.includes('REGISTRATION');
    return true;
  });

  return (
    <div className="space-y-0 overflow-hidden bg-[#0A1128]">
      
      {/* 1. HERO SECTION */}
      <section className="relative py-24 lg:py-32 border-b border-slate-800/60 text-center overflow-hidden">
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 text-amber-400 text-xs font-medium tracking-widest uppercase bg-amber-400/5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Accredited Curriculum</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-100 tracking-tight leading-tight">
            Curated Driver <em className="italic text-amber-400 font-normal">Programs</em>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Explore our sensor-assisted training programs tailored for first-time drivers, 2-wheeler balance, RTO exam fast-tracks, and license renewals.
          </p>
        </div>
      </section>

      {/* 2. CREATIVE PACKAGES GRID SECTION (Dark Glassmorphic Luxury Theme) */}
      <section className="py-24 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          
          {/* Category Filter Tabs */}
          <div className="flex justify-center">
            <div className="flex flex-wrap gap-2 bg-[#070B19] border border-slate-800/80 p-2 rounded-full shadow-2xl">
              {[
                { id: 'ALL', label: 'All Curriculum Programs' },
                { id: 'LICENSE', label: 'Driving Licenses (2W & 4W)' },
                { id: 'TRANSFER', label: 'Transfers & Renewals' },
                { id: 'SUPPORT', label: 'RTO Support Services' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-6 py-3 rounded-full text-xs font-sans uppercase tracking-widest transition-all ${
                    activeFilter === tab.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-100 font-medium'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <BoneyardWrapper loading={loading} skeleton={<CourseCardSkeleton count={6} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {filteredPackages.map((pkg) => {
                const isHighlight = pkg.isPopular || pkg.badge === 'Best Seller' || pkg.badge === 'Best Value';
                
                return (
                  <InspiraCard
                    key={pkg.id}
                    isHighlight={isHighlight}
                    className="p-8 space-y-8 flex flex-col justify-between"
                  >
                    <div className="space-y-6">
                      
                      {/* Top Row: Badge & Price */}
                      <div className="flex justify-between items-start gap-4">
                        <span
                          className={`text-[10px] uppercase tracking-widest font-bold px-3.5 py-1 rounded-full border ${
                            isHighlight
                              ? 'bg-amber-400 text-slate-950 border-amber-400 font-extrabold shadow-md'
                              : 'bg-slate-900 text-amber-400 border-amber-400/30'
                          }`}
                        >
                          {pkg.badge || 'Accredited'}
                        </span>
                        <div className="text-right">
                          <span className="font-serif text-3xl font-normal text-amber-400 block">
                            ₹{pkg.price.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">All-Inclusive Fee</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-2.5">
                        <h3 className="font-serif text-3xl text-slate-100 font-normal tracking-tight">
                          {pkg.name}
                        </h3>
                        <p className="text-xs text-slate-300 font-light leading-relaxed">
                          {pkg.description}
                        </p>
                      </div>

                      {/* Feature Bullet List with Animated Icons */}
                      <div className="space-y-2.5 pt-4 border-t border-slate-800/80 text-xs text-slate-300 font-light">
                        <div className="flex items-center gap-2.5">
                          <AnimatedIcon animation="scale">
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          </AnimatedIcon>
                          <span>{pkg.sessionsCount} Practical 1-on-1 Sessions</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <AnimatedIcon animation="scale">
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          </AnimatedIcon>
                          <span>Dual-Control Fleet Vehicle Included</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <AnimatedIcon animation="scale">
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          </AnimatedIcon>
                          <span>Mock RTO Exam Track Prep</span>
                        </div>
                      </div>

                    </div>

                    {/* Bottom CTA Button */}
                    <div className="pt-6">
                      <Link
                        href="/book"
                        className={`block text-center w-full py-4 font-bold text-xs uppercase tracking-widest rounded-full transition-all duration-300 ${
                          isHighlight
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:scale-[1.02]'
                            : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-400'
                        }`}
                      >
                        Reserve Package Now
                      </Link>
                    </div>

                  </InspiraCard>
                );
              })}
            </div>
          </BoneyardWrapper>

        </div>
      </section>

      {/* 3. CTA BAND */}
      <section className="bg-[#070B19] py-28 text-center border-t border-slate-800/60 relative overflow-hidden">
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8 relative z-10">
          <h2 className="font-serif text-4xl sm:text-5xl font-normal text-slate-100 tracking-tight">
            Ready to Begin Your <em className="italic text-amber-400 font-normal">Journey</em>?
          </h2>
          <p className="text-base text-slate-300 font-light max-w-xl mx-auto">
            Book your session online with instant instructor and vehicle selection.
          </p>
          <Link
            href="/book"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-9 py-4 rounded-full inline-flex items-center gap-2 shadow-xl shadow-amber-500/10 hover:scale-[1.02] transition-all"
          >
            <span>Proceed to Reservation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
