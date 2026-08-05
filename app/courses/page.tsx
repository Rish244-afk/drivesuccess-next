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
    <div className="space-y-0 overflow-hidden mesh-gradient-slow min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative py-28 lg:py-36 text-center overflow-hidden">
        {/* Ambient lighting blobs */}
        <div aria-hidden="true" className="absolute top-0 left-1/4 -translate-x-1/2 w-[700px] h-[350px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div aria-hidden="true" className="absolute bottom-0 right-1/4 translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', filter: 'blur(55px)' }} />
        
        {/* Floating decorative items */}
        <div aria-hidden="true" className="hidden lg:block absolute top-[20%] right-[8%] w-16 h-16 rounded-full border border-blue-200/25 float-ring" />
        <div aria-hidden="true" className="hidden lg:block absolute bottom-[20%] left-[8%] w-12 h-12 rounded-full border border-purple-200/20 float-ring-slow" />

        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6 relative z-10 font-sans">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-300/80 text-blue-600 text-xs font-semibold tracking-widest uppercase bg-white/70 backdrop-blur-md shadow-premium-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Accredited Curriculum</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-900 tracking-tight leading-tight">
            Curated Driver <em className="italic text-blue-600 font-normal">Programs</em>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 font-light max-w-2xl mx-auto leading-relaxed">
            Explore our sensor-assisted training programs tailored for first-time drivers, 2-wheeler balance, RTO exam fast-tracks, and license renewals.
          </p>
        </div>
      </section>

      {/* 2. CREATIVE PACKAGES GRID SECTION */}
      <section ref={gridContainerRef} className="py-24 lg:py-32 relative font-sans scroll-mt-12" style={{ background: 'linear-gradient(180deg, transparent 0%, #FFFFFF 40%, transparent 100%)' }}>
        {/* Ambient lighting blobs in grid */}
        <div aria-hidden="true" className="absolute top-[20%] right-0 w-[600px] h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)', filter: 'blur(70px)' }} />
        <div aria-hidden="true" className="absolute bottom-[20%] left-0 w-[500px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.03) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16 relative z-10">
          
          {/* Frosted Category Filter Tabs */}
          <div className="flex justify-center">
            <div className="flex flex-wrap justify-center gap-2 p-2 rounded-full shadow-premium-sm"
              style={{
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(226,232,240,0.55)',
              }}
            >
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
                      ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/15'
                      : 'text-slate-500 hover:text-slate-900 font-medium'
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
                      {/* Top Offset Badge for popular item */}
                      {isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[9px] font-extrabold px-4.5 py-1.5 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap z-30">
                          Most Popular
                        </div>
                      )}

                      <InspiraCard
                        isHighlight={false}
                        spotlightColor={isPopular ? 'rgba(124, 58, 237, 0.15)' : 'rgba(37, 99, 235, 0.12)'}
                        className={`p-8 flex flex-col justify-between h-full relative ${
                          isPopular
                            ? 'pt-14 border-2 border-purple-400/80 bg-purple-50/20 shadow-[0_20px_50px_rgba(124,58,237,0.1)]'
                            : 'pt-10 bg-white/80 border border-slate-200 shadow-premium-sm'
                        }`}
                      >
                        <div className="space-y-6">
                          {/* Title */}
                          <div className="space-y-1">
                            <h3 className="font-heading font-extrabold text-xs tracking-wider text-slate-800 uppercase">
                              {pkg.name}
                            </h3>
                          </div>

                          {/* Price Area */}
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-1">
                              <span className="font-sans text-5xl font-extrabold text-slate-900 tracking-tight">
                                ₹{pkg.price.toLocaleString()}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {isTrainingOnly ? '(Training Only)' : '(incl. Govt. Fees)'}
                            </span>
                          </div>

                          {/* Feature Bullet List with Purple Icons */}
                          <div className="space-y-3.5 pt-4 border-t border-slate-200/50 text-xs text-slate-700 font-medium">
                            {bulletPoints.map((bullet, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <AnimatedIcon animation="scale">
                                  <CheckCircle2 className="w-4 h-4 text-slate-700 fill-slate-100 shrink-0" />
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
                            className={`block text-center w-full font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-md bg-slate-950 hover:bg-slate-900 text-white hover:scale-[1.02] ${
                              isPopular ? 'py-5' : 'py-4'
                            }`}
                          >
                            Choose Plan
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
            variant="light"
          />

        </div>
      </section>

      {/* ── Curved SVG divider into CTA ── */}
      <div aria-hidden="true" className="pointer-events-none -mt-1 overflow-hidden leading-none relative z-10">
        <svg viewBox="0 0 1440 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none" style={{ height: '60px' }}>
          <path d="M0,0 C480,90 960,90 1440,0 L1440,90 L0,90 Z" fill="url(#coursesCtaFill)" />
          <defs>
            <linearGradient id="coursesCtaFill" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 3. PREMIUM CTA BAND */}
      <section className="relative py-32 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 45%, #7C3AED 100%)' }}
      >
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
        />

        <div aria-hidden="true" className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.30) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div aria-hidden="true" className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', filter: 'blur(80px)' }} />

        <div aria-hidden="true" className="hidden lg:block absolute top-8 left-[10%] w-32 h-32 rounded-full border border-white/10 float-ring" />
        <div aria-hidden="true" className="hidden lg:block absolute bottom-8 right-[10%] w-20 h-20 rounded-full border border-white/10 float-ring-slow" />

        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8 relative z-10 font-sans">
          <div className="mx-auto max-w-3xl rounded-3xl p-10 sm:p-14 relative"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <h2 className="font-serif text-[clamp(2.4rem,6vw,4rem)] font-normal text-white tracking-tight leading-[1.05] mb-6">
              Ready to Begin Your <em className="italic font-normal" style={{ color: 'rgba(167,243,208,0.95)' }}>Journey</em>?
            </h2>
            <p className="text-lg text-white/80 font-light max-w-xl mx-auto leading-relaxed mb-10">
              Book your session online with instant instructor and vehicle selection.
            </p>

            <Magnetic range={35} strength={0.4}>
              <Link
                href="/book"
                className="group relative overflow-hidden bg-white text-blue-700 font-bold text-xs uppercase tracking-widest px-12 py-5 rounded-full inline-flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  boxShadow: '0 8px 32px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,1)',
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/60 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative">Proceed to Reservation</span>
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
    <Suspense fallback={<div className="min-h-screen bg-white text-slate-400 p-12 text-center text-sm">Loading Curriculum Packages...</div>}>
      <CoursesContent />
    </Suspense>
  );
}
