'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Award, CheckCircle2, Car, RefreshCw, AlertCircle, Clock, SlidersHorizontal } from 'lucide-react';
import { getVehiclesAction } from '@/actions/vehicle';

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

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<DbVehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');

  // Fetch vehicles directly from Database via Server Action
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

  // Format Vehicle Tier for UI
  const formatTierLabel = (tier: string) => {
    switch (tier) {
      case 'TIER_A_COMPACT':
        return 'Tier A: Compact Essentials';
      case 'TIER_B_PREMIUM':
        return 'Tier B: Premium Sedan';
      case 'SUV':
        return 'Tier B: SUV / Crossover';
      default:
        return tier;
    }
  };

  // Format Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Available Now
          </span>
        );
      case 'IN_SERVICE':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
            In Training Session
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Scheduled Maintenance
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
          Live Database Fleet
        </span>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-100">
          Our Learning Fleet
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Explore training vehicles loaded live from our database. Each car is equipped with certified dual controls, safety sensors, and climate control.
        </p>
      </div>

      {/* ISO 9001 Quality Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl h-56 flex items-end p-8">
        <Image
          src="/images/fleet_verna_1785513736403.jpg"
          alt="ISO Fleet Maintenance"
          fill
          className="object-cover opacity-25"
        />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider rounded-full">
            <Award className="w-3.5 h-3.5" />
            <span>ISO 9001:2026 Certified Fleet</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-100">
            Premium Quality & Safety Inspection Standards
          </h2>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex justify-center overflow-x-auto pb-2">
        <div className="flex gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-full">
          {[
            { id: 'all', label: 'All Fleet Vehicles' },
            { id: 'TIER_A_COMPACT', label: 'Tier A: Compacts' },
            { id: 'TIER_B_PREMIUM', label: 'Tier B: Sedans' },
            { id: 'SUV', label: 'Tier B: SUVs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTierFilter(tab.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-heading font-bold transition-all whitespace-nowrap ${
                selectedTierFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-semibold">Loading vehicles live from database...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
          <Car className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-slate-200">No vehicles found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No database vehicles match the selected filter. Try resetting your filter.
          </p>
          <button
            onClick={() => setSelectedTierFilter('all')}
            className="text-xs font-bold text-amber-400 hover:underline pt-2 inline-block"
          >
            Reset Tier Filter
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence>
            {vehicles.map((car) => (
              <motion.div
                key={car.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all group"
              >
                {/* Vehicle Image Placeholder with Fallback */}
                <div className="h-60 relative overflow-hidden bg-slate-950">
                  <Image
                    src={car.imageUrl || '/images/fleet_wagonr_1785513709373.jpg'}
                    alt={car.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                    <span className="bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-200 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
                      {formatTierLabel(car.tier)}
                    </span>
                    {getStatusBadge(car.status)}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  
                  <div className="space-y-3">
                    {/* Header: Model & Price */}
                    <div className="flex justify-between items-baseline">
                      <div>
                        <h3 className="font-heading font-extrabold text-2xl text-slate-100">{car.name}</h3>
                        <span className="text-xs font-semibold text-slate-400">Model Year: {car.modelYear}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-heading font-extrabold text-2xl text-amber-400">
                          ₹{car.ratePerSession.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-400 block">/ session</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {car.description}
                    </p>
                  </div>

                  {/* Vehicle Spec Badges: Transmission, Dual Control, AC */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      
                      {/* Transmission Badge */}
                      <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>{car.transmission} Transmission</span>
                      </span>

                      {/* Dual Control Badge */}
                      {car.hasDualControl && (
                        <span className="text-[11px] font-semibold text-slate-300 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Dual Pedals</span>
                        </span>
                      )}

                      {/* Climate Control Badge */}
                      {car.hasAirConditioning && (
                        <span className="text-[11px] font-semibold text-slate-300 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Climate Control</span>
                        </span>
                      )}

                      {/* Smart Assist Sensors */}
                      {car.hasSmartAssist && (
                        <span className="text-[11px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Smart Assist Sensors</span>
                        </span>
                      )}

                    </div>

                    <div className="text-[11px] text-slate-500 flex justify-between items-center pt-1 font-mono">
                      <span>Plate: {car.plateNumber}</span>
                      <span>DB Record ID: {car.id.slice(-6)}</span>
                    </div>
                  </div>

                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Safety Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl shrink-0 mt-1">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-2xl text-slate-100">Dual-Control Safety Standard</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Your safety is non-negotiable. Every vehicle in our academy is equipped with certified <strong className="text-amber-400">dual-control pedals</strong>. This allows our instructors to intervene instantly, ensuring a 100% stress-free learning environment.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
