'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface MagneticProps {
  children: React.ReactElement;
  range?: number;
  strength?: number;
}

export function Magnetic({ children, range = 35, strength = 0.35 }: MagneticProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const distanceX = e.clientX - x;
      const distanceY = e.clientY - y;
      const distance = Math.hypot(distanceX, distanceY);

      if (distance < range) {
        // Move element slightly toward mouse
        gsap.to(el, {
          x: distanceX * strength,
          y: distanceY * strength,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      } else {
        // Return to center
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.3)',
          overwrite: 'auto',
        });
      }
    };

    const onMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1.1, 0.3)',
        overwrite: 'auto',
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [range, strength]);

  return React.cloneElement(children, { ref });
}
