'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Zap, Compass, Car } from 'lucide-react';
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
    <div className="space-y-0 font-sans overflow-hidden bg-[#F4F0E8] text-[#384633] min-h-screen">
      
      {/* 1. FULL-BLEED 4K HERO SECTION */}
      <section className="relative w-full min-h-[90vh] flex flex-col justify-between overflow-hidden bg-[#F4F0E8] pt-2">
        {/* Full-Bleed Edge-to-Edge Coastal Arches Background (100% Crisp Resolution) */}
        <div aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <Image
            src="/images/coastal_arches.jpg"
            alt="Vahathi Certified Training Fleet"
            fill
            priority
            unoptimized
            className="object-cover object-center w-full h-full opacity-100 brightness-105 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F4F0E8]/90 via-[#F4F0E8]/40 to-transparent max-w-2xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F4F0E8]/20 via-transparent to-[#F4F0E8]" />
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-8 pt-16 sm:pt-24 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#384633]/20 text-[#384633] text-xs font-semibold tracking-widest uppercase bg-white/80 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#384633]" />
            <span>CERTIFIED DRIVING FLEET</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal text-[#384633] tracking-tight leading-[1.05] max-w-3xl">
            Dual-Control Safety, <br />
            <em className="italic font-normal text-[#7E8466]">Refined Motion.</em>
          </h1>

          <p className="text-base sm:text-lg text-[#384633]/90 font-medium max-w-xl leading-relaxed">
            Our training fleet features 100% dual-control pedals, air conditioning, and senior instructor override telemetry — engineered for calm, confident learning.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Magnetic range={35} strength={0.4}>
              <button
                onClick={() => handleTierFilterChange('TIER_A_COMPACT')}
                className="bg-[#384633] hover:bg-[#2B3B2B] text-white font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full inline-flex items-center gap-3 transition-all duration-300 shadow-md hover:scale-105 cursor-pointer"
              >
                <span>Explore Compact Hatchbacks</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Magnetic>

            <button
              onClick={() => handleTierFilterChange('all')}
              className="bg-[#E7E1D6] hover:bg-white text-[#384633] border border-[#384633]/20 font-medium text-xs uppercase tracking-wider px-8 py-4 rounded-full inline-flex items-center gap-2 transition-all duration-300 shadow-xs cursor-pointer"
            >
              <span>View All Vehicles</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. FOUR METRIC CARDS STRIP */}
      <section className="py-8 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-[2rem] bg-[#E7E1D6] border border-[#384633]/10 shadow-xs">
          
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/80 space-y-2">
            <div className="p-3 rounded-full bg-[#384633]/10 text-[#384633]">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-normal text-[#384633]">100% Dual Control</h3>
            <p className="text-[10px] text-[#7E8466] font-semibold uppercase tracking-wider">Instructor Clutch & Brake Override</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/80 space-y-2">
            <div className="p-3 rounded-full bg-[#384633]/10 text-[#384633]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-normal text-[#384633]">Power Steering</h3>
            <p className="text-[10px] text-[#7E8466] font-semibold uppercase tracking-wider">Effortless Maneuvering</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/80 space-y-2">
            <div className="p-3 rounded-full bg-[#384633]/10 text-[#384633]">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-normal text-[#384633]">Air-Conditioned</h3>
            <p className="text-[10px] text-[#7E8466] font-semibold uppercase tracking-wider">All Weather Comfort</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/80 space-y-2">
            <div className="p-3 rounded-full bg-[#384633]/10 text-[#384633]">
              <Car className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-normal text-[#384633]">2W & 4W Vehicles</h3>
            <p className="text-[10px] text-[#7E8466] font-semibold uppercase tracking-wider">Multi-Category Practice</p>
          </div>

        </div>
      </section>

      {/* 3. FLEET GRID SECTION */}
      <section ref={fleetContainerRef} className="py-20 lg:py-28 scroll-mt-12 relative max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
        
        {/* Frosted Filter Tabs */}
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center gap-2 p-2 rounded-full border border-[#384633]/10 bg-[#E7E1D6]/90 backdrop-blur-md">
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
                    ? 'bg-[#384633] text-white font-bold shadow-md'
                    : 'text-[#7E8466] hover:text-[#384633] font-medium'
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
                  className="overflow-hidden flex flex-col justify-between h-full rounded-[2.5rem] border border-[#384633]/10 bg-[#E7E1D6] hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className="h-64 relative overflow-hidden bg-white/60">
                    <Image
                      src={car.imageUrl || `/images/${car.name.toLowerCase()}.jpg`}
                      alt={car.name}
                      fill
                      unoptimized
                      className="object-cover opacity-100 brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md text-[#384633] text-[10px] uppercase tracking-widest font-bold px-3.5 py-1.5 rounded-full border border-[#384633]/10 shadow-xs">
                        {formatTierLabel(car.tier)}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 space-y-6 flex-1 flex flex-col justify-between relative">
                    <div className="space-y-3">
                      <div className="flex justify-between items-baseline gap-2">
                        <div>
                          <h3 className="font-serif text-2xl font-normal text-[#384633] leading-snug">{car.name}</h3>
                          <span className="text-xs text-[#7E8466] font-semibold">Model Year: {car.modelYear}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-serif text-2xl text-[#384633] font-normal block">
                            ₹{car.ratePerSession.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#7E8466] uppercase tracking-widest font-semibold block mt-0.5">/ session</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#7E8466] font-light leading-relaxed">
                        {car.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#384633]/10 flex flex-wrap gap-2">
                      <span className="text-[11px] font-semibold text-[#384633] bg-white/80 px-3.5 py-1.5 rounded-full border border-[#384633]/10">
                        {car.transmission} Transmission
                      </span>
                      {car.hasDualControl && (
                        <span className="text-[11px] font-semibold text-[#384633] bg-white px-3.5 py-1.5 rounded-full border border-[#384633]/20">
                          Dual Control Pedals
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

      </section>

      {/* 4. FOOTER */}
      <footer className="mt-24 rounded-t-[3rem] bg-[#E7E1D6] border-t border-[#384633]/10 py-16 px-8 lg:px-16 text-[#384633]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-normal text-[#384633]">DriveSuccess</h3>
            <p className="text-xs text-[#7E8466] font-light leading-relaxed max-w-sm">
              Vahathi Motor Driving School. Certified 2W & 4W driving instruction in Kasavanahalli, Bengaluru.
            </p>
            <p className="text-[11px] text-[#7E8466]/80 font-mono pt-4">
              © 2026 Vahathi Motor Driving School. All rights reserved.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#384633]">Journey</h4>
            <ul className="space-y-2 text-xs text-[#7E8466]">
              <li><Link href="/" className="hover:text-[#384633] transition-colors">The Method</Link></li>
              <li><Link href="/fleet" className="hover:text-[#384633] transition-colors">Dual-Control Fleet</Link></li>
              <li><Link href="/courses" className="hover:text-[#384633] transition-colors">Curriculum & Packages</Link></li>
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

export default function FleetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F0E8] text-[#7E8466] p-12 text-center text-sm">Loading Fleet Vehicles...</div>}>
      <FleetContent />
    </Suspense>
  );
}
