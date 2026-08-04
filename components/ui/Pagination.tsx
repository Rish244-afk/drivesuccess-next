'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  variant?: 'dark' | 'light';
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  variant = 'dark',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const isDark = variant === 'dark';

  return (
    <nav className="flex items-center justify-center gap-2 pt-8 select-none" aria-label="Page Navigation">
      {/* Previous Button */}
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`p-3 rounded-full border text-xs font-semibold transition-all flex items-center justify-center ${
          currentPage === 1
            ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600'
            : isDark
            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:text-amber-400 active:scale-95 cursor-pointer shadow-md'
            : 'bg-white border-slate-300 text-slate-700 hover:border-amber-500 hover:text-amber-600 active:scale-95 cursor-pointer shadow-sm'
        }`}
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Numbered Page Buttons */}
      {pages.map((p) => {
        const isActive = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-10 h-10 rounded-full border text-xs font-bold transition-all flex items-center justify-center ${
              isActive
                ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105 cursor-default font-extrabold'
                : isDark
                ? 'bg-slate-900 border-slate-800/90 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 active:scale-95 cursor-pointer'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-amber-500 active:scale-95 cursor-pointer'
            }`}
          >
            {p}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`p-3 rounded-full border text-xs font-semibold transition-all flex items-center justify-center ${
          currentPage === totalPages
            ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600'
            : isDark
            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:text-amber-400 active:scale-95 cursor-pointer shadow-md'
            : 'bg-white border-slate-300 text-slate-700 hover:border-amber-500 hover:text-amber-600 active:scale-95 cursor-pointer shadow-sm'
        }`}
        aria-label="Next Page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
