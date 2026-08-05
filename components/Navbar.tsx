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
      className={`sticky top-0 z-50 text-slate-900 font-sans transition-all duration-300`}
      style={{
        background: 'rgba(248,250,252,0.82)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderBottom: '1px solid rgba(226,232,240,0.55)',
        boxShadow: scrolled
          ? '0 2px 8px rgba(15,23,42,0.05), 0 8px 32px rgba(37,99,235,0.05)'
          : '0 1px 0 rgba(226,232,240,0.5)',
      }}
    >
      <div className={`max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between transition-all duration-300 ${
        scrolled ? 'h-16' : 'h-20'
      }`}>
        
        {/* Brand Logo */}
        <Magnetic range={25} strength={0.2}>
          <Link href="/" className="flex items-center group cursor-pointer py-1">
            <Image
              src="/images/logo.png"
              alt="Vahathi Motor Driving School"
              width={140}
              height={80}
              className="h-14 w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
              priority
            />
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

          <Magnetic range={30} strength={0.35}>
            <Link
              href="/book"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-blue-600/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Reserve Session</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Magnetic>
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
