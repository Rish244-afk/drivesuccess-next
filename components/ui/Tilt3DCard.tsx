'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function Tilt3DCard({ children, className = '', intensity = 10 }: Tilt3DCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glareRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const card = cardRef.current;
    const container = containerRef.current;
    const glare = glareRef.current;
    if (!card || !container) return;

    // Set initial 3D transforms
    gsap.set(card, { transformPerspective: 1200, transformStyle: 'preserve-3d' });

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const rotX = ((mouseY - height / 2) / (height / 2)) * -intensity;
      const rotY = ((mouseX - width / 2) / (width / 2)) * intensity;

      const glareX = (mouseX / width) * 100;
      const glareY = (mouseY / height) * 100;

      // Smoothly rotate the card based on mouse offset
      gsap.to(card, {
        rotateX: rotX,
        rotateY: rotY,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      if (glare) {
        gsap.to(glare, {
          opacity: 0.22,
          background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(37, 99, 235, 0.25), transparent 70%)`,
          duration: 0.25,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    };

    const onMouseLeave = () => {
      // Revert rotation to center
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: 'power3.out',
        overwrite: 'auto',
      });

      if (glare) {
        gsap.to(glare, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [intensity]);

  return (
    <div ref={containerRef} className="w-full">
      <div
        ref={cardRef}
        className={`relative rounded-3xl overflow-visible transition-shadow duration-300 select-none ${className}`}
      >
        {/* Glare container */}
        <div
          ref={glareRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 z-30 mix-blend-screen"
        />

        {/* 3D Translate container */}
        <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }} className="h-full relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
