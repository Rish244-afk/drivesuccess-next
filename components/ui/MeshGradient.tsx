'use client';

import React, { useState, useEffect } from 'react';

interface MeshGradientProps {
  className?: string;
}

export function MeshGradient({ className = '' }: MeshGradientProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldRender(!motionQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setShouldRender(!e.matches);
    motionQuery.addEventListener('change', handler);
    
    return () => motionQuery.removeEventListener('change', handler);
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none -z-20 bg-slate-50 ${className}`} aria-hidden="true">
      {shouldRender && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes mesh-shift-1 {
              0% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(5%, 5%) scale(1.1); }
              66% { transform: translate(-5%, 2%) scale(0.9); }
              100% { transform: translate(0, 0) scale(1); }
            }
            @keyframes mesh-shift-2 {
              0% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(-5%, -5%) scale(0.9); }
              66% { transform: translate(5%, -2%) scale(1.1); }
              100% { transform: translate(0, 0) scale(1); }
            }
            @keyframes mesh-shift-3 {
              0% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(2%, -8%) scale(1.05); }
              66% { transform: translate(-2%, 8%) scale(0.95); }
              100% { transform: translate(0, 0) scale(1); }
            }
          `
        }} />
      )}

      {/* Base gradients without animation for prefers-reduced-motion, animated otherwise */}
      <div 
        className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full opacity-[0.08] mix-blend-multiply filter blur-3xl bg-blue-600"
        style={shouldRender ? { animation: 'mesh-shift-1 15s infinite ease-in-out' } : undefined}
      />
      
      <div 
        className="absolute top-[10%] -right-[10%] w-[60%] h-[80%] rounded-full opacity-[0.08] mix-blend-multiply filter blur-3xl bg-purple-600"
        style={shouldRender ? { animation: 'mesh-shift-2 18s infinite ease-in-out reverse' } : undefined}
      />
      
      <div 
        className="absolute -bottom-[20%] left-[20%] w-[80%] h-[60%] rounded-full opacity-[0.08] mix-blend-multiply filter blur-3xl bg-cyan-500"
        style={shouldRender ? { animation: 'mesh-shift-3 12s infinite ease-in-out' } : undefined}
      />
    </div>
  );
}

export default MeshGradient;
