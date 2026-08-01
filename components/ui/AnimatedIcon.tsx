'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedIconProps {
  children: React.ReactNode;
  animation?: 'bounce' | 'spin' | 'pulse' | 'scale' | 'shake';
  className?: string;
}

export function AnimatedIcon({ children, animation = 'scale', className = '' }: AnimatedIconProps) {
  const getAnimation = () => {
    switch (animation) {
      case 'bounce':
        return { hover: { y: -4 }, transition: { type: 'spring' as const, stiffness: 400, damping: 10 } };
      case 'spin':
        return { hover: { rotate: 180 }, transition: { duration: 0.5, ease: 'easeInOut' } };
      case 'pulse':
        return { hover: { scale: 1.2 }, transition: { repeat: Infinity, repeatType: 'reverse' as const, duration: 0.6 } };
      case 'shake':
        return { hover: { rotate: [0, -10, 10, -10, 0] }, transition: { duration: 0.4 } };
      case 'scale':
      default:
        return { hover: { scale: 1.15, rotate: 3 }, transition: { type: 'spring' as const, stiffness: 350, damping: 15 } };
    }
  };

  const anim = getAnimation();

  return (
    <motion.span
      whileHover={anim.hover}
      transition={anim.transition}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {children}
    </motion.span>
  );
}
