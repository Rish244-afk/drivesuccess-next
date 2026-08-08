'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';

export function LoadingScreen() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Skip loader if already played during session
    const hasLoaded = sessionStorage.getItem('drivesuccess_loader_played');
    if (hasLoaded) {
      return;
    }

    setShouldRender(true);

    // Prevent scrolling while loading
    document.body.style.overflow = 'hidden';

    // Logo reveal animation
    if (logoRef.current) {
      gsap.fromTo(
        logoRef.current,
        { opacity: 0, scale: 0.85, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }

    // Animate percentage counter and progress bar width using the same source of truth
    const progressObj = { value: 0 };
    gsap.to(progressObj, {
      value: 100,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        setProgress(Math.round(progressObj.value));
      },
      onComplete: () => {
        // Exit animation after 100% complete
        const exitTl = gsap.timeline({
          onComplete: () => {
            sessionStorage.setItem('drivesuccess_loader_played', 'true');
            document.body.style.overflow = '';
            setShouldRender(false);
          },
        });

        exitTl
          .to(logoRef.current, {
            opacity: 0,
            y: -20,
            duration: 0.4,
            ease: 'power2.in',
          })
          .to(
            containerRef.current,
            {
              opacity: 0,
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
              duration: 0.7,
              ease: 'power3.inOut',
            },
            '-=0.2'
          );
      },
    });

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#F4F0E8] z-[99999] flex flex-col items-center justify-center pointer-events-auto select-none font-sans"
      style={{
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        willChange: 'clip-path, opacity',
      }}
    >
      <div className="flex flex-col items-center gap-8 max-w-sm w-full px-6 text-center">
        {/* Vahathi Metallic Circle Logo with subtle glowing ring */}
        <div
          ref={logoRef}
          className="w-36 h-36 relative rounded-full overflow-hidden shadow-2xl border-4 border-[#384633]/20 bg-black flex items-center justify-center ring-8 ring-[#384633]/5"
        >
          <Image
            src="/images/logo.png"
            alt="Vahathi Motor Driving School"
            fill
            unoptimized
            className="object-cover scale-105"
            priority
          />
        </div>

        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#384633]">
              Vahathi Motor Driving School
            </span>
            <span className="text-xs font-mono font-bold text-[#384633]">
              {progress}%
            </span>
          </div>

          {/* Active Animated Loading Track - Bounded to progress state */}
          <div className="w-full h-2.5 bg-[#D6D0C6] rounded-full overflow-hidden relative shadow-inner p-0.5 border border-[#384633]/10">
            <div
              className="h-full bg-gradient-to-r from-[#384633] via-[#4A5A44] to-[#384633] rounded-full relative transition-[width] duration-75 ease-out shadow-md"
              style={{ width: `${progress}%` }}
            >
              {/* Animated Light Sweep Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
              {/* Glowing Leading Edge Dot */}
              {progress > 0 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
              )}
            </div>
          </div>

          <p className="text-[10px] text-[#7E8466] uppercase tracking-widest font-semibold animate-pulse pt-1">
            Loading Mindful Driving Experience...
          </p>
        </div>
      </div>
    </div>
  );
}
