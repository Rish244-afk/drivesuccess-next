'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function Tilt3DCard({ children, className = '', intensity = 15 }: Tilt3DCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rotX = ((mouseY - height / 2) / (height / 2)) * -intensity;
    const rotY = ((mouseX - width / 2) / (width / 2)) * intensity;

    const glareX = (mouseX / width) * 100;
    const glareY = (mouseY / height) * 100;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePosition({ x: glareX, y: glareY });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div style={{ perspective: '1000px' }} className="w-full">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX,
          rotateY,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`relative transition-shadow duration-300 ${className}`}
      >
        {/* 3D Content Container */}
        <div style={{ transform: 'translateZ(20px)' }} className="h-full">
          {children}
        </div>

        {/* Dynamic 3D Glare Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 hover:opacity-20 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(245, 158, 11, 0.4), transparent 70%)`,
          }}
        />
      </motion.div>
    </div>
  );
}
