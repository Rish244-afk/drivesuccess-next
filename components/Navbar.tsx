'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ArrowUpRight, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '@/components/NotificationBell';
import { AuthModal } from '@/components/auth/AuthModal';
import { AdminAuthModal } from '@/components/auth/AdminAuthModal';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const handleStudentPortalClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        if (data.user.role === 'ADMIN') {
          // Logged in as Admin -> Redirect cleanly to Admin Portal
          router.push('/admin');
        } else {
          // Logged in as Student -> Redirect to Student Dashboard
          router.push('/dashboard');
        }
      } else {
        // Unauthenticated -> Prompt Student Sign In modal
        setAuthModalOpen(true);
      }
    } catch {
      setAuthModalOpen(true);
    }
  };

  const handleAdminClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user && data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        setAdminModalOpen(true);
      }
    } catch {
      setAdminModalOpen(true);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'Vehicle Fleet', href: '/fleet' },
    { name: 'Book Session', href: '/book' },
    { name: 'Engineering', href: '/engineering' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
        
        {/* Editorial Brand Mark */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 border border-blue-600 text-white rounded-full flex items-center justify-center font-serif text-xl italic transition-transform duration-300 group-hover:scale-105 bg-blue-600 shadow-inner">
            V
          </div>
          <div>
            <span className="font-serif text-lg tracking-tight text-slate-900 block font-normal leading-tight">
              Vahathi <span className="italic text-blue-600">Motor</span> Driving School
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
                className={`text-xs tracking-wider uppercase font-medium transition-colors relative py-1 ${
                  isActive ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600"
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

          <button
            onClick={handleStudentPortalClick}
            className="text-xs tracking-wider uppercase font-medium text-slate-600 hover:text-blue-600 px-3 py-2 transition-colors focus:outline-none cursor-pointer"
          >
            <span>Student Portal</span>
          </button>

          <button
            onClick={handleAdminClick}
            className="text-xs tracking-wider uppercase font-semibold text-blue-600 hover:text-blue-500 px-2 py-2 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Admin</span>
          </button>

          <Link
            href="/book"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-blue-600/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Reserve Session</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-600 hover:text-blue-600 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
          aria-label="Toggle Navigation Menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation-drawer"
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
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden bg-white/95 backdrop-blur border-b border-slate-200 px-8 py-8 space-y-6"
          >
            <div className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block font-serif text-2xl py-2 transition-colors ${
                    pathname === link.href ? 'text-blue-600 italic' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-200 flex flex-col gap-3">
              <button
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleStudentPortalClick(e);
                }}
                className="w-full text-center py-3.5 border border-slate-200 text-slate-700 font-medium text-xs tracking-wider uppercase rounded-full bg-slate-50 cursor-pointer"
              >
                Student Portal
              </button>

              <button
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleAdminClick(e);
                }}
                className="w-full text-center py-3.5 border border-blue-300 text-blue-600 font-semibold text-xs tracking-wider uppercase rounded-full bg-blue-50 cursor-pointer"
              >
                Admin Control Portal 🔑
              </button>
              
              <Link
                href="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3.5 bg-blue-600 text-white font-bold text-xs tracking-wider uppercase rounded-full shadow-lg"
              >
                Reserve Training Session
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Auth Overlay Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectToDashboard={true}
      />

      {/* Admin Auth Overlay Modal */}
      <AdminAuthModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
    </header>
  );
}
