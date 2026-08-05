'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getVehiclesAction } from '@/actions/vehicle';
import { BoneyardWrapper, VehicleCardSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { Magnetic } from '@/components/ui/Magnetic';

interface DbVehicle {
  id: string;
  name: string;
  modelYear: number;
  plateNumber: string;
  tier: string;
  transmission: string;
  ratePerSession: number;
  description: string;
  imageUrl?: string | null;
  hasDualControl: boolean;
  hasAirConditioning: boolean;
  hasSmartAssist: boolean;
  status: string;
}

const ITEMS_PER_PAGE = 6;

function FleetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTier = searchParams.get('tier') || 'all';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [vehicles, setVehicles] = useState<DbVehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>(initialTier);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  const fleetContainerRef = useRef<HTMLDivElement>(null);

  const fetchDatabaseVehicles = useCallback(async () => {
    setLoading(true);
    const res = await getVehiclesAction({ tier: selectedTierFilter });
    if (res.success && res.data) {
      setVehicles(res.data as DbVehicle[]);
    } else {
      setVehicles([]);
    }
    setLoading(false);
  }, [selectedTierFilter]);

  useEffect(() => {
    fetchDatabaseVehicles();
  }, [fetchDatabaseVehicles]);

  const totalPages = Math.max(1, Math.ceil(vehicles.length / ITEMS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedVehicles = vehicles.slice((validPage - 1) * ITEMS_PER_PAGE, validPage * ITEMS_PER_PAGE);

  const handleTierFilterChange = (tierId: string) => {
    setSelectedTierFilter(tierId);
    setCurrentPage(1);
    router.push(`/fleet?tier=${tierId}&page=1`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/fleet?tier=${selectedTierFilter}&page=${page}`, { scroll: false });
    fleetContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatTierLabel = (tier: string) => {
    switch (tier) {
      case 'TIER_A_COMPACT':
        return 'Compact Hatchback';
      case 'TIER_B_PREMIUM':
        return 'Premium Sedan';
      case 'SUV':
        return 'Crossover SUV';
      default:
        return tier;
    }
  };

  return (
    <div className="space-y-0 font-sans overflow-hidden mesh-gradient-slow min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative py-28 lg:py-36 text-center overflow-hidden">
        {/* Ambient lighting blobs */}
        <div aria-hidden="true" className="absolute top-0 right-1/4 translate-x-1/2 w-[700px] h-[350px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div aria-hidden="true" className="absolute bottom-0 left-1/4 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', filter: 'blur(55px)' }} />
        
        {/* Floating rings */}
        <div aria-hidden="true" className="hidden lg:block absolute top-[20%] left-[8%] w-16 h-16 rounded-full border border-blue-200/25 float-ring" />
        <div aria-hidden="true" className="hidden lg:block absolute bottom-[20%] right-[8%] w-12 h-12 rounded-full border border-purple-200/20 float-ring-slow" />

        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-300/80 text-blue-600 text-xs font-semibold tracking-widest uppercase bg-white/70 backdrop-blur-md shadow-premium-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Dual-Control Safety Fleet</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-900 tracking-tight leading-tight">
            Our Learning <em className="italic text-blue-600 font-normal">Vehicles</em>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 font-light max-w-2xl mx-auto leading-relaxed">
            Every car in our academy features instructor dual-pedals, climate control, and ISO 9001:2026 certified maintenance standards.
          </p>
        </div>
      </section>

      {/* 2. FLEET GRID SECTION */}
      <section ref={fleetContainerRef} className="py-24 lg:py-32 scroll-mt-12 relative" style={{ background: 'linear-gradient(180deg, transparent 0%, #FFFFFF 40%, transparent 100%)' }}>
        {/* Background ambient blobs */}
        <div aria-hidden="true" className="absolute top-[25%] left-0 w-[550px] h-[550px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)', filter: 'blur(70px)' }} />
        <div aria-hidden="true" className="absolute bottom-[25%] right-0 w-[600px] h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.03) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16 relative z-10">
          
          {/* Frosted Filter Tabs */}
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
                { id: 'all', label: 'All Fleet Vehicles' },
                { id: 'TIER_A_COMPACT', label: 'Compacts' },
                { id: 'TIER_B_PREMIUM', label: 'Sedans' },
                { id: 'SUV', label: 'SUVs & Crossovers' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTierFilterChange(tab.id)}
                  className={`px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition-all cursor-pointer ${
                    selectedTierFilter === tab.id
                      ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/15'
                      : 'text-slate-500 hover:text-slate-950 font-medium'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <BoneyardWrapper loading={loading} skeleton={<VehicleCardSkeleton count={4} />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedTierFilter}-${validPage}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {paginatedVehicles.map((car) => (
                  <div
                    key={car.id}
                    className="card-premium overflow-hidden flex flex-col justify-between h-full bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-premium-sm hover:shadow-premium-md transition-all duration-300"
                  >
                    <div className="h-64 relative overflow-hidden bg-slate-50">
                      <Image
                        src={car.imageUrl || `/images/${car.name.toLowerCase()}.jpg`}
                        alt={car.name}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] uppercase tracking-widest font-bold px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-premium-sm">
                          {formatTierLabel(car.tier)}
                        </span>
                      </div>
                    </div>

                    <div className="p-8 space-y-6 flex-1 flex flex-col justify-between relative">
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline gap-2">
                          <div>
                            <h3 className="font-serif text-3xl font-normal text-slate-900 leading-snug">{car.name}</h3>
                            <span className="text-xs text-slate-400 font-semibold">Model Year: {car.modelYear}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-serif text-2xl text-blue-600 font-normal font-mono block">
                              ₹{car.ratePerSession.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mt-0.5">/ session</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 font-light leading-relaxed">
                          {car.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-200/60 flex flex-wrap gap-2">
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200/40">
                          {car.transmission} Transmission
                        </span>
                        {car.hasDualControl && (
                          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-3.5 py-1.5 rounded-full border border-blue-100/40">
                            Dual Control Pedals
                          </span>
                        )}
                        {car.hasAirConditioning && (
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200/40">
                            Climate Control
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
          <path d="M0,0 C480,90 960,90 1440,0 L1440,90 L0,90 Z" fill="url(#fleetCtaFill)" />
          <defs>
            <linearGradient id="fleetCtaFill" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
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
              Reserve Your Training <em className="italic font-normal" style={{ color: 'rgba(167,243,208,0.95)' }}>Vehicle</em>
            </h2>
            <p className="text-lg text-white/80 font-light max-w-xl mx-auto leading-relaxed mb-10">
              Pick your preferred car model and instructor for your next driving lesson.
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
                <span className="relative">Book Driving Session</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative" />
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>

    </div>
  );
}

export default function FleetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white text-slate-400 p-12 text-center text-sm">Loading Fleet Vehicles...</div>}>
      <FleetContent />
    </Suspense>
  );
}
