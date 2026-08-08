'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Compass } from 'lucide-react';
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
  const heroRef = useRef<HTMLDivElement | null>(null);

  // Smooth 3D Parallax Mouse Trackers
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Background Car Image 3D Rotation & Translation
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);
  const imgTranslateX = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const imgTranslateY = useTransform(smoothY, [-0.5, 0.5], [-20, 20]);

  // Foreground Content Micro-Movement (Opposite Direction for Deep 3D Depth Illusion)
  const textTranslateX = useTransform(smoothX, [-0.5, 0.5], [10, -10]);
  const textTranslateY = useTransform(smoothY, [-0.5, 0.5], [10, -10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5;
    const yRatio = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xRatio);
    mouseY.set(yRatio);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

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
    <div className="space-y-0 overflow-hidden bg-[#F4F0E8] text-[#384633] min-h-screen font-sans">
      
      {/* 1. FULL-BLEED 4K CINEMATIC HERO SECTION WITH 3D PARALLAX */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full min-h-[90vh] flex flex-col justify-between overflow-hidden bg-[#F4F0E8] pt-2 [perspective:1000px]"
      >
        {/* Crisp Architectural Silver Car Background Image with Interactive 3D Motion */}
        <motion.div
          aria-hidden="true"
          style={{
            rotateX,
            rotateY,
            x: imgTranslateX,
            y: imgTranslateY,
            scale: 1.08,
            transformStyle: 'preserve-3d',
          }}
          className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] pointer-events-none z-0"
        >
          <Image
            src="/images/curriculum_hero.jpg"
            alt="Vahathi Curated Driver Curriculum & Vehicle Training"
            fill
            priority
            unoptimized
            className="object-cover object-center w-full h-full opacity-100 brightness-105 contrast-105"
          />
          {/* Light gradient backdrop for maximum text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F4F0E8]/95 via-[#F4F0E8]/60 to-transparent max-w-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F4F0E8]/30 via-transparent to-[#F4F0E8]" />
        </motion.div>

        {/* Hero Content Overlay (Floats Layered in 3D Space) */}
        <motion.div
          style={{
            x: textTranslateX,
            y: textTranslateY,
          }}
          className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-8 pt-16 sm:pt-24 space-y-6"
        >
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#384633]/20 text-[#384633] text-xs font-semibold tracking-widest uppercase bg-white/80 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#384633]" />
            <span>ACCREDITED CURRICULUM</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal text-[#384633] tracking-tight leading-[1.05] max-w-3xl">
            Curated Driver <br />
            <em className="italic font-normal text-[#7E8466]">Packages.</em>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#384633]/90 font-medium max-w-xl leading-relaxed">
            Explore our structured 2W and 4W training programs tailored for first-time drivers, license endorsements, RTO exam preparation, and refresher practice.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Magnetic range={35} strength={0.4}>
              <Link
                href="/book"
                className="bg-[#384633] hover:bg-[#2B3B2B] text-white font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full inline-flex items-center gap-3 transition-all duration-300 shadow-md hover:scale-105"
              >
                <span>Book a Package</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Magnetic>

            <button
              type="button"
              onClick={() => gridContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="bg-white/90 hover:bg-white text-[#384633] border border-[#384633]/20 font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full inline-flex items-center gap-2 transition-all duration-300 shadow-xs cursor-pointer"
            >
              <span>Explore Programs</span>
              <Compass className="w-4 h-4 text-[#7E8466]" />
            </button>
          </div>
        </motion.div>

        {/* Floating Bottom Metric Glass Bar */}
        <div className="relative z-10 w-full px-6 sm:px-8 pb-6 my-4">
          <div className="bg-[#384633]/90 backdrop-blur-xl text-white rounded-full p-4 px-8 max-w-5xl mx-auto shadow-2xl flex flex-wrap items-center justify-between gap-6 border border-white/20">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-medium tracking-wide">Government RTO Approved</span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-serif text-sm font-bold">10 & 15-Day Modules</span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider">Zero-to-License Track</span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-serif text-sm font-bold">1-on-1 Dedicated Coach</span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider">Dual-Control Fleet</span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <Link href="/fleet" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors">
              <span>View Fleet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. PACKAGES GRID SECTION */}
      <section ref={gridContainerRef} className="py-16 lg:py-24 relative font-sans scroll-mt-12 border-t border-[#384633]/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16 relative z-10">
          
          {/* Frosted Category Filter Tabs */}
          <div className="flex justify-center">
            <div className="flex flex-wrap justify-center gap-2 p-2 rounded-full border border-[#384633]/15 bg-[#E7E1D6]/90 backdrop-blur-md">
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
                      ? 'bg-[#384633] text-white font-bold shadow-md'
                      : 'text-[#7E8466] hover:text-[#384633] font-medium'
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
                        spotlightColor="rgba(56, 70, 51, 0.15)"
                        className={`p-8 flex flex-col justify-between h-full relative rounded-[2.5rem] transition-all duration-300 ${
                          isPopular
                            ? 'pt-14 border-2 border-[#384633] bg-[#E7E1D6] shadow-xl'
                            : 'pt-10 bg-[#E7E1D6] border border-[#384633]/10 shadow-md hover:shadow-xl'
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute top-4 right-4 bg-[#384633] text-white text-[10px] uppercase font-bold tracking-widest px-3.5 py-1 rounded-full border border-white/20">
                            Most Popular
                          </div>
                        )}

                        <div className="space-y-6">
                          {/* Title */}
                          <div className="space-y-1">
                            <h3 className="font-serif text-2xl tracking-tight text-[#384633] font-normal">
                              {pkg.name}
                            </h3>
                            <span className="text-[11px] text-[#7E8466] font-semibold block uppercase tracking-wider">
                              {pkg.sessionsCount} Practical Sessions
                            </span>
                          </div>

                          {/* Price Area */}
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-1">
                              <span className="font-serif text-5xl font-normal text-[#384633] tracking-tight">
                                ₹{pkg.price.toLocaleString()}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#7E8466] font-medium block">
                              {isTrainingOnly ? '(Training Only)' : '(incl. RTO Documentation)'}
                            </span>
                          </div>

                          {/* Feature Bullet List */}
                          <div className="space-y-3 pt-4 border-t border-[#384633]/10 text-xs text-[#7E8466] font-light">
                            {bulletPoints.map((bullet, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <AnimatedIcon animation="scale">
                                  <CheckCircle2 className="w-4 h-4 text-[#384633] shrink-0" />
                                </AnimatedIcon>
                                <span>{bullet}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bottom CTA Button */}
                        <div className="pt-8">
                          <Link
                            href={`/book?packageId=${pkg.id}`}
                            className="w-full bg-[#384633] hover:bg-[#2B3B2B] text-white font-medium text-xs py-3.5 rounded-full inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                          >
                            <span>Enroll in Package</span>
                            <ArrowRight className="w-4 h-4" />
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

      {/* 3. FOOTER */}
      <footer className="rounded-t-[3rem] bg-[#E7E1D6] border-t border-[#384633]/10 py-16 px-8 lg:px-16 text-[#384633]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-normal text-[#384633]">DriveSuccess</h3>
            <p className="text-xs text-[#7E8466] font-light leading-relaxed max-w-sm">
              Sculpting mindful drivers for a sustainable future. Experience the serenity of motion.
            </p>
            <p className="text-[11px] text-[#7E8466]/80 font-mono pt-4">
              © 2026 DriveSuccess. Sculpted for the future of motion.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#384633]">Journey</h4>
            <ul className="space-y-2 text-xs text-[#7E8466]">
              <li><Link href="/" className="hover:text-[#384633] transition-colors">The Method</Link></li>
              <li><Link href="/fleet" className="hover:text-[#384633] transition-colors">Sustainable Fleet</Link></li>
              <li><Link href="/courses" className="hover:text-[#384633] transition-colors">Safety Standards</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#384633]">Legal & Support</h4>
            <ul className="space-y-2 text-xs text-[#7E8466]">
              <li><Link href="/terms" className="hover:text-[#384633] transition-colors">Terms of Serenity</Link></li>
              <li><Link href="/privacy" className="hover:text-[#384633] transition-colors">Privacy Sanctuary</Link></li>
              <li><Link href="/contact" className="hover:text-[#384633] transition-colors">Contact Studio</Link></li>
            </ul>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F0E8] text-[#7E8466] p-12 text-center text-sm">Loading Curriculum Packages...</div>}>
      <CoursesContent />
    </Suspense>
  );
}
