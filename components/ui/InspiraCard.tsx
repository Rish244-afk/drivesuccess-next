'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

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
  const divRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`relative rounded-3xl overflow-hidden transition-all duration-300 ${
        isHighlight
          ? 'bg-gradient-to-b from-white to-slate-50 border-2 border-blue-400 shadow-[0_20px_50px_rgba(37,99,235,0.18)]'
          : 'bg-white border border-slate-200 hover:border-slate-300 shadow-card'
      } ${className}`}
    >
      {/* Inspira UI Spotlight Radial Glow Layer */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-500 z-10"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />

      {/* Top Ambient Highlight */}
      {isHighlight && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 z-20" />
      )}

      <div className="relative z-20">{children}</div>
    </motion.div>
  );
}
