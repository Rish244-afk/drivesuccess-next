'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Menu, X, User, ArrowUpRight } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-[#0A1128]/95 backdrop-blur-md border-b border-slate-800/60 text-slate-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-22 flex items-center justify-between py-5">
        
        {/* Editorial Brand Mark */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 border border-amber-400/40 text-amber-400 rounded-full flex items-center justify-center font-serif text-xl italic transition-transform group-hover:scale-105 bg-amber-400/5">
            V
          </div>
          <div>
            <span className="font-serif text-lg tracking-tight text-slate-100 block font-normal leading-tight">
              Vahathi <span className="italic text-amber-400">Motor</span> Driving School
            </span>
            <span className="text-[9px] font-sans font-medium tracking-[0.2em] text-slate-400 uppercase block">
              DriveSuccess Academy
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-9">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-xs tracking-wider uppercase font-medium transition-colors relative py-1 ${
                  isActive ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-amber-400"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Auth & Action Buttons */}
        <div className="hidden md:flex items-center gap-5">
          <a
            href="tel:7829780778"
            className="text-xs font-semibold tracking-wider text-amber-400 hover:text-amber-300 border border-amber-400/30 px-3.5 py-1.5 rounded-full bg-amber-400/5 transition flex items-center gap-1.5"
          >
            <span>📞 7829780778</span>
          </a>

          <NotificationBell />

          <Link
            href="/auth/login"
            className="text-xs tracking-wider uppercase font-medium text-slate-300 hover:text-amber-400 transition"
          >
            <span>Student Portal</span>
          </Link>

          <Link
            href="/book"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
          >
            <span>Reserve Session</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
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
            className="md:hidden bg-[#070B19] border-b border-slate-800/80 px-8 py-8 space-y-5"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block font-serif text-xl py-2 ${
                  pathname === link.href ? 'text-amber-400 italic' : 'text-slate-300'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-6 border-t border-slate-800/80 flex flex-col gap-3">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3.5 border border-slate-800 text-slate-200 font-medium text-xs tracking-wider uppercase rounded-full"
              >
                Student Portal Login
              </Link>
              <Link
                href="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3.5 bg-amber-500 text-slate-950 font-bold text-xs tracking-wider uppercase rounded-full"
              >
                Reserve Training Session
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
