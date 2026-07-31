'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, CheckCircle2, Award, Info, X, Shield, RefreshCw } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPackageDetails, setSelectedPackageDetails] = useState<DbPackage | null>(null);

  // Fetch packages directly from Database via Server Action
  const fetchDatabasePackages = useCallback(async () => {
    setLoading(true);
    const res = await getPackagesAction({
      category: selectedCategory,
      search: searchQuery,
    });
    if (res.success && res.data) {
      setPackages(res.data as DbPackage[]);
    } else {
      setPackages([]);
    }
    setLoading(false);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchDatabasePackages();
  }, [fetchDatabasePackages]);

  // Format PackageType Enum for UI
  const formatTypeLabel = (type: string) => {
    switch (type) {
      case 'LICENSE_2W':
        return '2 Wheeler';
      case 'LICENSE_4W':
        return '4 Wheeler';
      case 'COMBO':
        return 'Combo 2W+4W';
      case 'IDL_TRANSFER':
        return 'IDL / Transfer';
      case 'RENEWAL':
        return 'Renewal';
      case 'REGISTRATION':
        return 'Registration';
      default:
        return type;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
          Live Database Catalog
        </span>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-100">
          Driving School Packages
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Explore packages loaded live from our database. Select your preferred program or filter by license category and search keywords.
        </p>
      </div>

      {/* Controls: Search Bar & Category Filters */}
      <div className="space-y-6">
        
        {/* Search Input */}
        <div className="max-w-xl mx-auto relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search packages by title, keyword, or features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-400 text-slate-100 pl-12 pr-10 py-3.5 rounded-2xl text-sm outline-none transition shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 text-xs font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex justify-center overflow-x-auto pb-2">
          <div className="flex gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-full">
            {[
              { id: 'all', label: 'All Packages' },
              { id: 'LICENSE_4W', label: '4 Wheeler' },
              { id: 'LICENSE_2W', label: '2 Wheeler' },
              { id: 'COMBO', label: 'Combo' },
              { id: 'IDL_TRANSFER', label: 'IDL / Transfer' },
              { id: 'RENEWAL', label: 'Renewal' },
              { id: 'REGISTRATION', label: 'Registration' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-heading font-bold transition-all whitespace-nowrap ${
                  selectedCategory === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Package Grid (Loaded from Database) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-semibold">Loading packages live from database...</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
          <Info className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-slate-200">No packages found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No database packages match your selected filter &quot;{searchQuery || selectedCategory}&quot;. Try resetting your search filter.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-amber-400 hover:underline pt-2 inline-block"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {packages.map((pkg) => (
              <motion.div
                key={pkg.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between p-6 transition-all group"
              >
                <div className="space-y-4">
                  
                  {/* Top Badge & Category Header */}
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                      {formatTypeLabel(pkg.type)}
                    </span>
                    {pkg.badge && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        {pkg.badge}
                      </span>
                    )}
                  </div>

                  {/* Title & Price Card */}
                  <div className="pt-1">
                    <h3 className="font-heading font-extrabold text-xl text-slate-100 group-hover:text-amber-400 transition-colors">
                      {pkg.name}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-heading font-extrabold text-3xl text-amber-400">
                        ₹{pkg.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400">/ package</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {pkg.description}
                  </p>
                </div>

                {/* Footer Details Action */}
                <div className="pt-6 mt-6 border-t border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>{pkg.sessionsCount} Practical Sessions</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ISO Certified</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPackageDetails(pkg)}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                  >
                    <span>View Package Details</span>
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Package Details Modal */}
      <AnimatePresence>
        {selectedPackageDetails && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setSelectedPackageDetails(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-100 p-2"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md inline-block">
                  {formatTypeLabel(selectedPackageDetails.type)}
                </span>
                <h3 className="font-heading font-extrabold text-2xl text-slate-100">
                  {selectedPackageDetails.name}
                </h3>
                <p className="font-heading font-extrabold text-3xl text-amber-400">
                  ₹{selectedPackageDetails.price.toLocaleString()}
                </p>
              </div>

              <div className="space-y-3 pt-2 text-xs text-slate-300">
                <p className="leading-relaxed">{selectedPackageDetails.description}</p>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Practical Sessions:</span>
                    <strong className="text-slate-100">{selectedPackageDetails.sessionsCount} Sessions</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle Support:</span>
                    <strong className="text-slate-100">Dual-Control Certified Fleet</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Instructor Assignment:</span>
                    <strong className="text-slate-100">Senior Pedagogical Advisor</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Database ID:</span>
                    <code className="text-amber-400 font-mono">{selectedPackageDetails.id}</code>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedPackageDetails(null)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
                >
                  Close Details
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
