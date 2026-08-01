'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Base Shimmering Boneyard Skeleton Element
 */
export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-slate-800/60 rounded-xl before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-slate-700/40 before:to-transparent ${className}`}
    />
  );
}

/**
 * Smooth Fade Wrapper between Skeleton and Rendered Content
 */
interface BoneyardWrapperProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function BoneyardWrapper({ loading, skeleton, children, className = '' }: BoneyardWrapperProps) {
  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Skeleton Placeholder for Course / Package Cards
 */
export function CourseCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#070B19] border border-slate-800/80 p-8 rounded-3xl space-y-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-12 w-full rounded-full pt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Placeholder for Vehicle Fleet Cards
 */
export function VehicleCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <Skeleton className="h-64 w-full rounded-none bg-slate-900" />
          <div className="p-8 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Placeholder for Admin / Dashboard Tables
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#070B19]">
      <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="divide-y divide-slate-800/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton Placeholder for Stat Summary Cards
 */
export function StatCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#070B19] border border-slate-800/80 p-6 rounded-2xl space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      ))}
    </div>
  );
}
