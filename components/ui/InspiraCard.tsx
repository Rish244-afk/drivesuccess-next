'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface InspiraCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  isHighlight?: boolean;
}

export function InspiraCard({
  children,
  className = '',
  spotlightColor = 'rgba(37, 99, 235, 0.12)',
  isHighlight = false,
}: InspiraCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    const spotlight = spotlightRef.current;
    if (!card || !spotlight) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.to(spotlight, {
        opacity: 1,
        background: `radial-gradient(600px circle at ${x}px ${y}px, ${spotlightColor}, transparent 40%)`,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const onMouseEnter = () => {
      gsap.to(card, {
        y: -6,
        scale: 1.01,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const onMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      gsap.to(spotlight, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    card.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseenter', onMouseEnter);
    card.addEventListener('mouseleave', onMouseLeave);

    return () => {
      card.removeEventListener('mousemove', onMouseMove);
      card.removeEventListener('mouseenter', onMouseEnter);
      card.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [spotlightColor]);

  return (
    <div
      ref={cardRef}
      className={`relative rounded-3xl overflow-hidden transition-all duration-300 ${
        isHighlight
          ? 'bg-gradient-to-b from-white to-slate-50 border-2 border-blue-400 shadow-[0_20px_50px_rgba(37,99,235,0.18)]'
          : 'bg-white border border-slate-200 hover:border-slate-300 shadow-card'
      } ${className}`}
    >
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 z-10"
      />
      {isHighlight && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 z-20" />
      )}
      <div className="relative z-20">{children}</div>
    </div>
  );
}
