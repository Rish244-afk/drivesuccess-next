'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';

export function LoadingScreen() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Skip loader if already played during session
    const hasLoaded = sessionStorage.getItem('drivesuccess_loader_played');
    if (hasLoaded) {
      return;
    }

    setShouldRender(true);

    const tl = gsap.timeline({
      defaults: { ease: 'power4.out' },
      onComplete: () => {
        sessionStorage.setItem('drivesuccess_loader_played', 'true');
        setShouldRender(false);
      },
    });

    // Prevent scrolling while loading
    document.body.style.overflow = 'hidden';

    tl.fromTo(logoRef.current, 
      { opacity: 0, scale: 0.8 }, 
      { opacity: 1, scale: 1, duration: 0.8 }
    )
    .fromTo(barRef.current,
      { width: '0%' },
      { width: '100%', duration: 1.2, ease: 'power2.inOut' },
      '-=0.4'
    )
    .to(logoRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.4,
      ease: 'power2.in',
    })
    .to(containerRef.current, {
      opacity: 0,
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
      duration: 0.7,
      ease: 'power3.inOut',
    })
    .add(() => {
      document.body.style.overflow = '';
    });
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
      <div className="flex flex-col items-center gap-8 max-w-xs w-full px-4 text-center">
        {/* Vahathi Metallic Circle Logo */}
        <div ref={logoRef} className="w-36 h-36 relative rounded-full overflow-hidden shadow-2xl border-4 border-[#384633]/20 bg-black flex items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="Vahathi Motor Driving School"
            fill
            unoptimized
            className="object-cover scale-105"
            priority
          />
        </div>

        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#384633]">
            Vahathi Motor Driving School
          </span>
          {/* Dynamic loading track */}
          <div className="w-48 h-1 bg-[#D6D0C6] rounded-full overflow-hidden relative mx-auto">
            <div
              ref={barRef}
              className="absolute top-0 bottom-0 left-0 bg-[#384633] rounded-full"
              style={{ width: '0%', willChange: 'width' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
