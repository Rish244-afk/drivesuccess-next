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

const ITEMS_PER_PAGE = 6; // 6 cards per page (2 rows of 3 on desktop)

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

  // Filter packages by active category
  const filteredPackages = packages.filter((pkg) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'LICENSE') return pkg.type.includes('LICENSE') || pkg.type.includes('COMBO');
    if (activeFilter === 'TRANSFER') return pkg.type.includes('IDL') || pkg.type.includes('RENEWAL');
    if (activeFilter === 'SUPPORT') return pkg.type.includes('REGISTRATION');
    return true;
  });

  // Calculate Total Pages & Current Page Slice
  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / ITEMS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedPackages = filteredPackages.slice((validPage - 1) * ITEMS_PER_PAGE, validPage * ITEMS_PER_PAGE);

  // Handle Category Filter Change (Resets to Page 1)
  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
    setCurrentPage(1);
    router.push(`/courses?filter=${filterId}&page=1`, { scroll: false });
  };

  // Handle Page Change with Smooth Scroll
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/courses?filter=${activeFilter}&page=${page}`, { scroll: false });

    // Smooth scroll back to top of course grid section
    gridContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-0 overflow-hidden bg-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative py-24 lg:py-32 border-b border-slate-200/80 text-center overflow-hidden">
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-50 rounded-full blur-[160px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6 relative z-10 font-sans">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-300 text-blue-600 text-xs font-medium tracking-widest uppercase bg-blue-50 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Accredited Curriculum</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-900 tracking-tight leading-tight">
            Curated Driver <em className="italic text-blue-600 font-normal">Programs</em>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-light max-w-2xl mx-auto leading-relaxed">
            Explore our sensor-assisted training programs tailored for first-time drivers, 2-wheeler balance, RTO exam fast-tracks, and license renewals.
          </p>
        </div>
      </section>

      {/* 2. CREATIVE PACKAGES GRID SECTION (Dark Glassmorphic Luxury Theme) */}
      <section ref={gridContainerRef} className="py-24 lg:py-32 relative font-sans scroll-mt-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
          
          {/* Category Filter Tabs */}
          <div className="flex justify-center">
            <div className="flex flex-wrap gap-2 bg-slate-100 border border-slate-200 p-2 rounded-full shadow-hover">
              {[
                { id: 'ALL', label: 'All Curriculum Programs' },
                { id: 'LICENSE', label: 'Driving Licenses (2W & 4W)' },
                { id: 'TRANSFER', label: 'Transfers & Renewals' },
                { id: 'SUPPORT', label: 'RTO Support Services' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleFilterChange(tab.id)}
                  className={`px-6 py-3 rounded-full text-xs font-sans uppercase tracking-widest transition-all cursor-pointer ${
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
                                ? 'bg-blue-500 text-slate-950 border-blue-500 font-extrabold shadow-md'
                                : 'bg-white text-blue-600 border-blue-300'
                            }`}
                          >
                            {pkg.badge || 'Accredited'}
                          </span>
                          <div className="text-right">
                            <span className="font-serif text-3xl font-normal text-blue-600 block font-mono">
                              ₹{pkg.price.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">All-Inclusive Fee</span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-2.5">
                          <h3 className="font-serif text-3xl text-slate-900 font-normal tracking-tight">
                            {pkg.name}
                          </h3>
                          <p className="text-xs text-slate-600 font-light leading-relaxed">
                            {pkg.description}
                          </p>
                        </div>

                        {/* Feature Bullet List with Animated Icons */}
                        <div className="space-y-2.5 pt-4 border-t border-slate-200 text-xs text-slate-600 font-light">
                          <div className="flex items-center gap-2.5">
                            <AnimatedIcon animation="scale">
                              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                            </AnimatedIcon>
                            <span>{pkg.sessionsCount} Practical 1-on-1 Sessions</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <AnimatedIcon animation="scale">
                              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                            </AnimatedIcon>
                            <span>Dual-Control Fleet Vehicle Included</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <AnimatedIcon animation="scale">
                              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
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
                              ? 'bg-blue-600 hover:bg-blue-500 text-slate-950 shadow-lg shadow-blue-600/15 hover:scale-[1.02]'
                              : 'bg-white hover:bg-slate-100 border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-600'
                          }`}
                        >
                          Reserve Package Now
                        </Link>
                      </div>

                    </InspiraCard>
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

      {/* 3. CTA BAND */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-28 text-center border-t border-slate-200/80 relative overflow-hidden font-sans">
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8 relative z-10">
          <h2 className="font-serif text-4xl sm:text-5xl font-normal text-white tracking-tight">
            Ready to Begin Your <em className="italic text-white/90 font-normal">Journey</em>?
          </h2>
          <p className="text-base text-white/80 font-light max-w-xl mx-auto">
            Book your session online with instant instructor and vehicle selection.
          </p>
          <Link
            href="/book"
            className="bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-widest px-9 py-4 rounded-full inline-flex items-center gap-2 shadow-xl shadow-black/10 hover:scale-[1.02] transition-all"
          >
            <span>Proceed to Reservation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
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
