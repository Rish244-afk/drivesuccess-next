'use client';

import React, { memo } from 'react';

interface Hero3DSceneProps {
  className?: string;
}

/**
 * Pure-CSS animated hero background — replaces the WebGL scene
 * to avoid heavy three.js / @react-three/drei dependencies.
 */
function Hero3DSceneInner({ className = '' }: Hero3DSceneProps) {
  return (
    <div className={`absolute inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}>
      {/* Animated gradient orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl animate-pulse"
        style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)', animationDuration: '4s' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-25 blur-3xl animate-pulse"
        style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)', animationDuration: '6s', animationDelay: '1s' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl animate-pulse"
        style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)', animationDuration: '5s', animationDelay: '2s' }}
      />
    </div>
  );
}

export const Hero3DScene = memo(Hero3DSceneInner);
export default Hero3DScene;
