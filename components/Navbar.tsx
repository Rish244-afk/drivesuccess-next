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
    { name: 'Our Method', href: '/' },
    { name: 'Fleet', href: '/fleet' },
    { name: 'Instructors', href: '/courses' },
    { name: 'Sustainability', href: '/engineering' },
    { name: 'Experience', href: '/contact' },
  ];

  return (
    <header
      ref={headerRef}
      className={`sticky top-3 z-50 text-[#4A5A44] font-sans transition-all duration-300 ${isDashboardRoute ? 'hidden md:block' : ''}`}
    >
      <div
        className="max-w-7xl mx-auto px-6 sm:px-8 py-3 rounded-full flex items-center justify-between transition-all duration-300 border border-[#4A5A44]/15 shadow-xs"
        style={{
          background: 'rgba(244, 240, 232, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        
        {/* Brand Logo */}
        <Magnetic range={25} strength={0.2}>
          <Link href="/" className="flex items-center gap-3 group cursor-pointer py-1">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#4A5A44]/20 shadow-xs shrink-0 bg-white">
              <Image
                src="/images/circle_logo.png"
                alt="Vahathi Motor Driving School"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-serif text-xl sm:text-2xl font-normal text-[#4A5A44] tracking-tight group-hover:text-[#384633] transition-colors">
              Vahathi Motor Driving School
            </span>
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
                className={`text-xs font-medium transition-colors relative py-1 ${
                  isActive ? 'text-[#4A5A44] font-semibold border-b-2 border-[#4A5A44]' : 'text-[#7E8466] hover:text-[#4A5A44]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Auth & Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <NotificationBell />

          <button
            onClick={handleStudentPortalClick}
            className="text-xs font-medium text-[#7E8466] hover:text-[#4A5A44] px-3 py-2 transition-colors focus:outline-none cursor-pointer"
          >
            <span>Student Portal</span>
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
              className="bg-[#4A5A44] hover:bg-[#384633] text-white font-medium text-xs px-6 py-2.5 rounded-full flex items-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xs"
            >
              <span>Book Session</span>
            </button>
          </Magnetic>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#4A5A44] hover:text-[#384633] p-2 rounded-full border border-[#4A5A44]/20 bg-white/50 focus:outline-none transition"
          aria-label="Toggle Navigation Menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            className="md:hidden mt-2 max-w-7xl mx-auto bg-[#F4F0E8]/95 backdrop-blur-2xl border border-[#4A5A44]/15 rounded-3xl px-8 py-8 space-y-6 shadow-xl"
          >
            <div className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block font-serif text-2xl py-2 transition-colors ${
                    pathname === link.href ? 'text-[#4A5A44] italic font-medium' : 'text-[#7E8466] hover:text-[#4A5A44]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="pt-6 border-t border-[#4A5A44]/10 flex flex-col gap-3">
              <button
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleStudentPortalClick(e);
                }}
                className="w-full text-center py-3.5 border border-[#4A5A44]/20 text-[#4A5A44] font-medium text-xs uppercase tracking-wider rounded-full bg-white/60 cursor-pointer"
              >
                Student Portal
              </button>

              <button
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleAdminClick(e);
                }}
                className="w-full text-center py-3.5 border border-[#4A5A44]/20 text-[#4A5A44] font-medium text-xs uppercase tracking-wider rounded-full bg-[#E7E1D6] cursor-pointer"
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
                className="w-full text-center py-3.5 bg-[#4A5A44] text-white font-medium text-xs uppercase tracking-wider rounded-full shadow-md cursor-pointer"
              >
                Book Session
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
