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

    // Make content page visible
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
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', // premium slide-wipe
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
      className="fixed inset-0 bg-[#0A1128] z-[99999] flex flex-col items-center justify-center pointer-events-auto select-none"
      style={{
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        willChange: 'clip-path, opacity',
      }}
    >
      <div className="flex flex-col items-center gap-6 max-w-xs w-full px-4">
        {/* Brand Logo */}
        <div ref={logoRef} className="w-48 h-20 relative flex items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="Vahathi Motor Driving School"
            width={160}
            height={90}
            className="h-16 w-auto object-contain invert brightness-200"
            priority
          />
        </div>

        {/* Dynamic loading track */}
        <div className="w-40 h-[1.5px] bg-white/10 rounded-full overflow-hidden relative">
          <div
            ref={barRef}
            className="absolute top-0 bottom-0 left-0 bg-blue-500 rounded-full"
            style={{ width: '0%', willChange: 'width' }}
          />
        </div>
      </div>
    </div>
  );
}
