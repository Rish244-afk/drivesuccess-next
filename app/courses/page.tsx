'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { getPackagesAction } from '@/actions/package';
import { BoneyardWrapper, CourseCardSkeleton } from '@/components/ui/Skeleton';
import { InspiraCard } from '@/components/ui/InspiraCard';
import { AnimatedIcon } from '@/components/ui/AnimatedIcon';
import { Pagination } from '@/components/ui/Pagination';
import { Magnetic } from '@/components/ui/Magnetic';

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

const ITEMS_PER_PAGE = 6;

function CoursesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialFilter = searchParams.get('filter') || 'ALL';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [packages, setPackages] = useState<DbPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  const gridContainerRef = useRef<HTMLDivElement>(null);

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

  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / ITEMS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedPackages = filteredPackages.slice((validPage - 1) * ITEMS_PER_PAGE, validPage * ITEMS_PER_PAGE);

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
    setCurrentPage(1);
    router.push(`/courses?filter=${filterId}&page=1`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/courses?filter=${activeFilter}&page=${page}`, { scroll: false });
    gridContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-0 overflow-hidden bg-[#090A0F] text-slate-100 min-h-screen font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative py-28 lg:py-36 text-center overflow-hidden">
        <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none opacity-40"
          style={{ background: 'radial-gradient(ellipse, rgba(56,189,248,0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />

        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6 relative z-10 font-sans">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-[0.2em] uppercase bg-cyan-950/40 backdrop-blur-md shadow-[0_0_20px_rgba(56,189,248,0.1)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Accredited Curriculum</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-white tracking-tight leading-tight">
            Curated Driver <em className="italic text-cyan-400 font-normal">Packages</em>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Explore our structured 2W and 4W training programs tailored for first-time drivers, license endorsements, RTO exam preparation, and refresher practice.
          </p>
        </div>
      </section>

      {/* 2. PACKAGES GRID SECTION */}
      <section ref={gridContainerRef} className="py-20 lg:py-28 relative font-sans scroll-mt-12 bg-[#0D0E15] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16 relative z-10">
          
          {/* Frosted Category Filter Tabs */}
          <div className="flex justify-center">
            <div className="flex flex-wrap justify-center gap-2 p-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-2xl">
              {[
                { id: 'ALL', label: 'All Curriculum Programs' },
                { id: 'LICENSE', label: 'Driving Licenses (2W & 4W)' },
                { id: 'TRANSFER', label: 'Transfers & Renewals' },
                { id: 'SUPPORT', label: 'RTO Support Services' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleFilterChange(tab.id)}
                  className={`px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                      : 'text-slate-400 hover:text-white font-medium'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <BoneyardWrapper loading={loading} skeleton={<CourseCardSkeleton count={6} />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeFilter}-${validPage}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {paginatedPackages.map((pkg) => {
                  const isPopular = pkg.isPopular || pkg.badge === 'MOST POPULAR';
                  const bulletPoints = pkg.description.split(';');
                  const isTrainingOnly = pkg.badge === 'Training Only';

                  return (
                    <div key={pkg.id} className="relative group/card h-full">
                      <InspiraCard
                        isHighlight={false}
                        spotlightColor={isPopular ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.15)'}
                        className={`p-8 flex flex-col justify-between h-full relative rounded-3xl transition-all duration-300 ${
                          isPopular
                            ? 'pt-14 border-2 border-cyan-400/80 bg-[#141828] shadow-[0_0_30px_rgba(56,189,248,0.2)]'
                            : 'pt-10 bg-[#12141F] border border-white/10 shadow-lg'
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-cyan-300/30">
                            Most Popular
                          </div>
                        )}

                        <div className="space-y-6">
                          {/* Title */}
                          <div className="space-y-1">
                            <h3 className="font-serif text-xl tracking-tight text-white font-medium">
                              {pkg.name}
                            </h3>
                            <span className="text-[11px] text-cyan-400 font-semibold block uppercase tracking-wider">
                              {pkg.sessionsCount} Practical Sessions
                            </span>
                          </div>

                          {/* Price Area */}
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-1">
                              <span className="font-serif text-5xl font-normal text-white tracking-tight">
                                ₹{pkg.price.toLocaleString()}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {isTrainingOnly ? '(Training Only)' : '(incl. RTO Documentation)'}
                            </span>
                          </div>

                          {/* Feature Bullet List */}
                          <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-slate-300 font-light">
                            {bulletPoints.map((bullet, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <AnimatedIcon animation="scale">
                                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                                </AnimatedIcon>
                                <span>{bullet}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bottom CTA Button */}
                        <div className="pt-8">
                          <Link
                            href="/book"
                            className={`block text-center w-full font-bold text-xs uppercase tracking-widest rounded-full transition-all duration-300 border border-cyan-400/40 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:scale-[1.02] ${
                              isPopular ? 'py-4.5' : 'py-4'
                            }`}
                          >
                            Select Package
                          </Link>
                        </div>
                      </InspiraCard>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </BoneyardWrapper>

          {/* Numbered Pagination Controls */}
          <Pagination
            currentPage={validPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            variant="dark"
          />

        </div>
      </section>

      {/* 3. PREMIUM CTA BAND */}
      <section className="relative py-28 text-center overflow-hidden bg-[#090A0F]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8 relative z-10 font-sans">
          <div className="mx-auto max-w-3xl rounded-3xl p-10 sm:p-14 border border-white/15 bg-white/[0.03] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <h2 className="font-serif text-[clamp(2.4rem,5.5vw,3.8rem)] font-normal text-white tracking-tight leading-[1.05] mb-6">
              Ready to Begin Your <em className="italic font-normal text-cyan-400">Driving Journey</em>?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-light max-w-xl mx-auto leading-relaxed mb-8">
              Book your session online with instant instructor and vehicle selection.
            </p>

            <Magnetic range={35} strength={0.4}>
              <Link
                href="/book"
                className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-widest px-12 py-5 rounded-full inline-flex items-center gap-3 transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(56,189,248,0.35)] border border-cyan-300/30"
              >
                <span>Proceed to Reservation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative" />
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>

    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090A0F] text-slate-400 p-12 text-center text-sm">Loading Curriculum Packages...</div>}>
      <CoursesContent />
    </Suspense>
  );
}
