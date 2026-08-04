'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { getVehiclesAction } from '@/actions/vehicle';
import { BoneyardWrapper, VehicleCardSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';

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
    <div className="space-y-0 font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="bg-[#0A1128] py-24 lg:py-32 border-b border-slate-800/60 text-center">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Dual-Control Safety Fleet
          </span>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-100 tracking-tight leading-tight">
            Our Learning <em className="italic text-amber-400 font-normal">Vehicles</em>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Every car in our academy features instructor dual-pedals, climate control, and ISO 9001:2026 certified maintenance standards.
          </p>
        </div>
      </section>

      {/* 2. FLEET GRID SECTION (Warm Off-White Background) */}
      <section ref={fleetContainerRef} className="bg-[#FAF8F3] text-slate-900 py-24 lg:py-32 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
          
          {/* Minimal Filter Tabs */}
          <div className="flex justify-center">
            <div className="flex flex-wrap gap-2 border-b border-slate-300/80 pb-3">
              {[
                { id: 'all', label: 'All Fleet Vehicles' },
                { id: 'TIER_A_COMPACT', label: 'Compacts' },
                { id: 'TIER_B_PREMIUM', label: 'Sedans' },
                { id: 'SUV', label: 'SUVs & Crossovers' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTierFilterChange(tab.id)}
                  className={`px-5 py-2 text-xs font-sans uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                    selectedTierFilter === tab.id
                      ? 'text-slate-900 border-b-2 border-amber-500 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
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
                    className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="h-64 relative overflow-hidden bg-slate-950">
                      <Image
                        src={car.imageUrl || `/images/${car.name.toLowerCase()}.jpg`}
                        alt={car.name}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-slate-950/80 backdrop-blur-md text-slate-100 text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full border border-slate-800">
                          {formatTierLabel(car.tier)}
                        </span>
                      </div>
                    </div>

                    <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <div>
                            <h3 className="font-serif text-3xl font-normal text-slate-900">{car.name}</h3>
                            <span className="text-xs text-slate-500 font-medium">Model Year: {car.modelYear}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-serif text-2xl text-slate-900 font-normal font-mono">
                              ₹{car.ratePerSession.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-500 block">/ session</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 font-light leading-relaxed">
                          {car.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                          {car.transmission} Transmission
                        </span>
                        {car.hasDualControl && (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-500/10 px-3 py-1 rounded-full">
                            Dual Control Pedals
                          </span>
                        )}
                        {car.hasAirConditioning && (
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
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

          {/* Numbered Pagination Controls (Light Theme) */}
          <Pagination
            currentPage={validPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            variant="light"
          />

        </div>
      </section>

      {/* 3. CTA BAND */}
      <section className="bg-[#0A1128] py-28 text-center border-t border-slate-800/60">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8">
          <h2 className="font-serif text-4xl sm:text-5xl font-normal text-slate-100 tracking-tight">
            Reserve Your Training <em className="italic text-amber-400 font-normal">Vehicle</em>
          </h2>
          <p className="text-base text-slate-300 font-light max-w-xl mx-auto">
            Pick your preferred car model and instructor for your next driving lesson.
          </p>
          <a
            href="/book"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-9 py-4 rounded-full inline-flex items-center gap-2 shadow-xl shadow-amber-500/10 hover:scale-[1.02] transition-all"
          >
            <span>Book Driving Session</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

    </div>
  );
}

export default function FleetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A1128] text-slate-400 p-12 text-center text-sm">Loading Fleet Vehicles...</div>}>
      <FleetContent />
    </Suspense>
  );
}
