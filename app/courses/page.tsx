'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, CheckCircle2, ArrowRight, RefreshCw, Star } from 'lucide-react';
import { getPackagesAction } from '@/actions/package';

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

  return (
    <div className="space-y-0">
      
      {/* 1. HERO SECTION */}
      <section className="bg-[#0A1128] py-24 lg:py-32 border-b border-slate-800/60 text-center">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Curriculum & Programs
          </span>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-100 tracking-tight leading-tight">
            Tailored Driver <em className="italic text-amber-400 font-normal">Training</em>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Explore our accredited training programs designed for first-time drivers, 2-wheeler balance, and RTO licensing compliance.
          </p>
        </div>
      </section>

      {/* 2. PACKAGES GRID SECTION (Warm Off-White Background) */}
      <section className="bg-[#FAF8F3] text-slate-900 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm font-medium">Loading programs from database...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white border border-slate-200/80 p-8 rounded-2xl space-y-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase tracking-widest text-amber-600 font-bold border border-amber-500/30 px-3 py-1 rounded-full bg-amber-500/5">
                        {pkg.badge || 'Accredited'}
                      </span>
                      <span className="font-serif text-3xl font-normal text-slate-900">
                        ₹{pkg.price.toLocaleString()}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl text-slate-900 font-normal">
                      {pkg.name}
                    </h3>

                    <p className="text-xs text-slate-600 font-light leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-700 flex justify-between">
                      <span>Practical Sessions:</span>
                      <span className="font-serif text-sm font-normal text-amber-600">{pkg.sessionsCount} Sessions</span>
                    </div>

                    <Link
                      href="/book"
                      className="block text-center w-full py-3.5 bg-[#0A1128] hover:bg-[#131C38] text-slate-100 font-bold text-xs uppercase tracking-widest rounded-full transition"
                    >
                      Reserve Package
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 3. CTA BAND */}
      <section className="bg-[#0A1128] py-28 text-center border-t border-slate-800/60">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8">
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
