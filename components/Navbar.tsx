'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ArrowUpRight, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '@/components/NotificationBell';
import { AuthModal } from '@/components/auth/AuthModal';
import { AdminAuthModal } from '@/components/auth/AdminAuthModal';
import { Magnetic } from '@/components/ui/Magnetic';
import gsap from 'gsap';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);

  const dashboardRoutes = ['/dashboard', '/profile', '/settings'];
  const isDashboardRoute = dashboardRoutes.some(route => pathname?.startsWith(route));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    // Elegant slide-down animation on mount
    gsap.fromTo(headerRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.6 }
    );
  }, []);

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
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 text-slate-100 font-sans transition-all duration-300 ${isDashboardRoute ? 'hidden md:block' : ''}`}
      style={{
        background: 'rgba(9, 10, 15, 0.85)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: scrolled
          ? '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.05)'
          : '0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className={`max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between transition-all duration-300 ${
        scrolled ? 'h-16' : 'h-20'
      }`}>
        
        {/* Brand Logo */}
        <Magnetic range={25} strength={0.2}>
          <Link href="/" className="flex items-center gap-3 group cursor-pointer py-1">
            <Image
              src="/images/logo.png"
              alt="Vahathi Motor Driving School"
              width={140}
              height={80}
              className="h-12 w-auto object-contain brightness-125 contrast-125 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.3)] transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <div className="hidden sm:flex flex-col">
              <span className="font-serif text-base font-bold text-white tracking-wide leading-tight group-hover:text-cyan-400 transition-colors">
                DriveSuccess
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400">
                Academy • Bengaluru
              </span>
            </div>
          </Link>
        </Magnetic>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-xs tracking-widest uppercase font-medium transition-colors relative py-1 ${
                  isActive ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-cyan-400'
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]"
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
            className="text-xs tracking-widest uppercase font-medium text-slate-300 hover:text-cyan-400 px-3 py-2 transition-colors focus:outline-none cursor-pointer"
          >
            <span>Student Portal</span>
          </button>

          <button
            onClick={handleAdminClick}
            className="text-xs tracking-widest uppercase font-semibold text-cyan-400 hover:text-cyan-300 px-2 py-2 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Admin</span>
          </button>

          <Magnetic range={30} strength={0.35}>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('wizard_state');
                }
                router.push('/book?reset=1');
                setMobileMenuOpen(false);
              }}
              className="relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-full flex items-center gap-1.5 shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-cyan-300/30"
            >
              <span>Reserve Session</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </Magnetic>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-300 hover:text-cyan-400 p-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none transition"
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
            className="md:hidden bg-[#0D0E15]/95 backdrop-blur-2xl border-b border-white/10 px-8 py-8 space-y-6"
          >
            <div className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block font-serif text-2xl py-2 transition-colors ${
                    pathname === link.href ? 'text-cyan-400 italic font-medium' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
              <button
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleStudentPortalClick(e);
                }}
                className="w-full text-center py-3.5 border border-white/10 text-slate-200 font-medium text-xs tracking-wider uppercase rounded-full bg-white/5 cursor-pointer hover:bg-white/10"
              >
                Student Portal
              </button>

              <button
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleAdminClick(e);
                }}
                className="w-full text-center py-3.5 border border-cyan-500/30 text-cyan-400 font-semibold text-xs tracking-wider uppercase rounded-full bg-cyan-950/40 cursor-pointer"
              >
                Admin Control Portal 🔑
              </button>
              
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('wizard_state');
                  }
                  setMobileMenuOpen(false);
                  router.push('/book?reset=1');
                }}
                className="w-full text-center py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs tracking-wider uppercase rounded-full shadow-[0_0_20px_rgba(56,189,248,0.3)] cursor-pointer"
              >
                Reserve Training Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Auth Overlay Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectToDashboard={true}
        returnTo="/dashboard"
      />

      {/* Admin Auth Overlay Modal */}
      <AdminAuthModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
    </header>
  );
}
