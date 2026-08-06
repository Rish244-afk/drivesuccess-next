'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, CalendarDays, User, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  // We only want the bottom nav to appear on specific dashboard-related routes
  const dashboardRoutes = ['/dashboard', '/profile', '/settings'];
  
  useEffect(() => {
    // Only show on mobile when matching dashboard routes
    const isDashboardRoute = dashboardRoutes.some(route => pathname?.startsWith(route));
    setIsVisible(isDashboardRoute);
  }, [pathname]);

  if (!isVisible) return null;

  const handleBookSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('wizard_state');
    }
    router.push('/book?reset=1');
  };

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Schedule', href: '/dashboard?tab=sessions', icon: CalendarDays },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard' && !pathname.includes('?'));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                  {item.name}
                </span>
                
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 w-8 h-0.5 bg-blue-600 rounded-b-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Floating Action Button - Reserve Session */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <button
            onClick={handleBookSession}
            className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-[0_8px_20px_-6px_rgba(37,99,235,0.6)] hover:bg-blue-500 hover:scale-105 transition-all active:scale-95 border-4 border-white cursor-pointer"
            aria-label="Book Session"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
