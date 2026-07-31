'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Menu, X, User, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '@/components/NotificationBell';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'Vehicle Fleet', href: '/fleet' },
    { name: 'Book Session', href: '/book' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-slate-100 block">
              DriveSuccess
            </span>
            <span className="font-heading text-[10px] font-bold tracking-[0.2em] text-amber-400 uppercase -mt-1 block">
              Academy
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`font-heading text-sm font-semibold transition-colors relative py-1 ${
                  isActive ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Auth & Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <NotificationBell />

          <Link
            href="/auth/login"
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-amber-400 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-amber-400/40 transition"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span>Student Portal</span>
          </Link>

          <Link
            href="/book"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-300 hover:text-amber-400 p-2"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900 border-b border-slate-800 px-6 py-6 space-y-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block font-heading text-base font-semibold py-2 ${
                  pathname === link.href ? 'text-amber-400' : 'text-slate-300'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl"
              >
                Student Portal Login
              </Link>
              <Link
                href="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-amber-500 text-slate-950 font-bold text-sm rounded-xl"
              >
                Book Session Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
