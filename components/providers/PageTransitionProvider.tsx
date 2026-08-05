'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const transitionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!transitionRef.current) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Elegant slide-fade entry animation whenever pathname changes
    gsap.fromTo(
      transitionRef.current,
      { opacity: 0, y: 15 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.5, 
        ease: 'power2.out',
        clearProps: 'all' // Clear styles after completion so layout is not affected
      }
    );
  }, [pathname]);

  return <div ref={transitionRef}>{children}</div>;
}
