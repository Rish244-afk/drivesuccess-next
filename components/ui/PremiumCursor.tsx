'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function PremiumCursor() {
  const cursorRingRef = useRef<HTMLDivElement | null>(null);
  const cursorDotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Hide on touch devices (mobile, tablet)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      return;
    }

    const ring = cursorRingRef.current;
    const dot = cursorDotRef.current;
    if (!ring || !dot) return;

    // Set initial custom mouse opacity and layout coordinates
    gsap.set([ring, dot], { opacity: 0 });

    const moveCursor = (e: MouseEvent) => {
      // Show cursor elements once active
      gsap.to([ring, dot], { opacity: 1, duration: 0.3, overwrite: 'auto' });

      // Outer ring follows mouse with delay for inertia
      gsap.to(ring, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      // Inner dot follows mouse coordinates instantly
      gsap.to(dot, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Expand on interactive items
      const isLink = target.closest('a, button, [role="button"], input, select, textarea');
      const isCard = target.closest('.tilt-card, .inspira-card, .gsap-card');

      if (isLink) {
        gsap.to(ring, {
          scale: 1.8,
          borderColor: 'rgba(37, 99, 235, 0.6)',
          backgroundColor: 'rgba(37, 99, 235, 0.06)',
          duration: 0.3,
          overwrite: 'auto',
        });
        gsap.to(dot, {
          scale: 0.5,
          backgroundColor: 'rgb(37, 99, 235)',
          duration: 0.3,
          overwrite: 'auto',
        });
      } else if (isCard) {
        gsap.to(ring, {
          scale: 2.2,
          borderColor: 'rgba(124, 58, 237, 0.5)',
          backgroundColor: 'rgba(124, 58, 237, 0.04)',
          duration: 0.3,
          overwrite: 'auto',
        });
        gsap.to(dot, {
          scale: 0, // hide dot on cards
          duration: 0.2,
          overwrite: 'auto',
        });
      } else {
        // Default cursor layout values
        gsap.to(ring, {
          scale: 1,
          borderColor: 'rgba(15, 23, 42, 0.3)',
          backgroundColor: 'transparent',
          duration: 0.3,
          overwrite: 'auto',
        });
        gsap.to(dot, {
          scale: 1,
          backgroundColor: 'rgb(15, 23, 42)',
          duration: 0.3,
          overwrite: 'auto',
        });
      }
    };

    const handleMouseLeaveWindow = () => {
      gsap.to([ring, dot], { opacity: 0, duration: 0.3, overwrite: 'auto' });
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeaveWindow);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
    };
  }, []);

  return (
    <>
      {/* Outer Floating Ring */}
      <div
        ref={cursorRingRef}
        className="pointer-events-none fixed top-0 left-0 w-8 h-8 -mt-4 -ml-4 border border-slate-900/30 rounded-full z-[9999] mix-blend-normal pointer-events-none select-none hidden md:block"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      />
      {/* Inner Pinpoint Dot */}
      <div
        ref={cursorDotRef}
        className="pointer-events-none fixed top-0 left-0 w-1.5 h-1.5 -mt-0.75 -ml-0.75 bg-slate-900 rounded-full z-[9999] pointer-events-none select-none hidden md:block"
        style={{ willChange: 'transform' }}
      />
    </>
  );
}
