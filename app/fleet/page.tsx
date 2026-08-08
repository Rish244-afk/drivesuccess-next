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
    <div className="space-y-0 font-sans overflow-hidden bg-[#090A0F] text-slate-100 min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative py-28 lg:py-36 text-center overflow-hidden">
        <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none opacity-40"
          style={{ background: 'radial-gradient(ellipse, rgba(56,189,248,0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />

        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-[0.2em] uppercase bg-cyan-950/40 backdrop-blur-md shadow-[0_0_20px_rgba(56,189,248,0.1)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dual-Control Safety Fleet</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-white tracking-tight leading-tight">
            Our Learning <em className="italic text-cyan-400 font-normal">Vehicles</em>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Every vehicle in our academy features instructor dual-pedal overrides, climate control, and ISO-certified safety standards.
          </p>
        </div>
      </section>

      {/* 2. FLEET GRID SECTION */}
      <section ref={fleetContainerRef} className="py-20 lg:py-28 scroll-mt-12 relative bg-[#0D0E15] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16 relative z-10">
          
          {/* Frosted Filter Tabs */}
          <div className="flex justify-center">
            <div className="flex flex-wrap justify-center gap-2 p-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-2xl">
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
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                      : 'text-slate-400 hover:text-white font-medium'
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
                    className="overflow-hidden flex flex-col justify-between h-full rounded-3xl border border-white/10 bg-[#12141F] hover:border-cyan-500/40 transition-all duration-300 shadow-xl group"
                  >
                    <div className="h-64 relative overflow-hidden bg-slate-950">
                      <Image
                        src={car.imageUrl || `/images/${car.name.toLowerCase()}.jpg`}
                        alt={car.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-90 contrast-110"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-[#090A0F]/80 backdrop-blur-md text-cyan-400 text-[10px] uppercase tracking-widest font-bold px-3.5 py-1.5 rounded-full border border-cyan-500/30">
                          {formatTierLabel(car.tier)}
                        </span>
                      </div>
                    </div>

                    <div className="p-8 space-y-6 flex-1 flex flex-col justify-between relative">
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline gap-2">
                          <div>
                            <h3 className="font-serif text-2xl font-normal text-white leading-snug">{car.name}</h3>
                            <span className="text-xs text-slate-400 font-semibold">Model Year: {car.modelYear}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-serif text-2xl text-cyan-400 font-normal block">
                              ₹{car.ratePerSession.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mt-0.5">/ session</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 font-light leading-relaxed">
                          {car.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2">
                        <span className="text-[11px] font-semibold text-slate-300 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10">
                          {car.transmission} Transmission
                        </span>
                        {car.hasDualControl && (
                          <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/40 px-3.5 py-1.5 rounded-full border border-cyan-500/30">
                            Dual Control Pedals
                          </span>
                        )}
                        {car.hasAirConditioning && (
                          <span className="text-[11px] font-semibold text-slate-300 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10">
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
            variant="dark"
          />

        </div>
      </section>

      {/* 3. PREMIUM CTA BAND */}
      <section className="relative py-28 text-center overflow-hidden bg-[#090A0F]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8 relative z-10 font-sans">
          <div className="mx-auto max-w-3xl rounded-3xl p-10 sm:p-14 border border-white/15 bg-white/[0.03] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <h2 className="font-serif text-[clamp(2.4rem,5.5vw,3.8rem)] font-normal text-white tracking-tight leading-[1.05] mb-6">
              Reserve Your Training <em className="italic font-normal text-cyan-400">Vehicle</em>
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-light max-w-xl mx-auto leading-relaxed mb-8">
              Pick your preferred car model and instructor for your next driving lesson.
            </p>

            <Magnetic range={35} strength={0.4}>
              <Link
                href="/book"
                className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-widest px-12 py-5 rounded-full inline-flex items-center gap-3 transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(56,189,248,0.35)] border border-cyan-300/30"
              >
                <span>Book Driving Session</span>
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
    <Suspense fallback={<div className="min-h-screen bg-[#090A0F] text-slate-400 p-12 text-center text-sm">Loading Fleet Vehicles...</div>}>
      <FleetContent />
    </Suspense>
  );
}
