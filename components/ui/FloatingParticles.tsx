'use client';

import React, { useMemo, useEffect, useState } from 'react';

interface FloatingParticlesProps {
  className?: string;
  count?: number;
}

export function FloatingParticles({ className = '', count = 20 }: FloatingParticlesProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldRender(!motionQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setShouldRender(!e.matches);
    motionQuery.addEventListener('change', handler);
    
    return () => motionQuery.removeEventListener('change', handler);
  }, []);

  const particles = useMemo(() => {
    const colors = ['bg-blue-300', 'bg-purple-300', 'bg-cyan-300', 'bg-indigo-300'];
    
    return Array.from({ length: count }).map((_, i) => {
      const size = Math.random() * 4 + 2; // 2px to 6px
      const left = Math.random() * 100; // 0% to 100%
      const top = Math.random() * 100;
      const animationDuration = Math.random() * 15 + 15; // 15s to 30s
      const animationDelay = Math.random() * -30; // Negative delay to start immediately at different points
      const opacity = Math.random() * 0.15 + 0.15; // 0.15 to 0.3
      const colorClass = colors[Math.floor(Math.random() * colors.length)];

      return {
        id: i,
        size,
        left,
        top,
        animationDuration,
        animationDelay,
        opacity,
        colorClass,
      };
    });
  }, [count]);

  if (!shouldRender) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none -z-10 ${className}`} aria-hidden="true">
      {/* Add keyframes globally or in a local style block */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float-particle {
            0% { transform: translateY(0) translateX(0); }
            33% { transform: translateY(-30px) translateX(15px); }
            66% { transform: translateY(-60px) translateX(-15px); }
            100% { transform: translateY(-90px) translateX(0); }
          }
        `
      }} />
      
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${p.colorClass}`}
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: p.opacity,
            animation: `float-particle ${p.animationDuration}s infinite ease-in-out alternate`,
            animationDelay: `${p.animationDelay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default FloatingParticles;
