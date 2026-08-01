'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AppleScrollCanvasSequenceProps {
  totalFrames?: number;
  framePathPattern?: (index: number) => string;
  fallbackPoster?: string;
  className?: string;
}

export function AppleScrollCanvasSequence({
  totalFrames = 60,
  framePathPattern = (i) => `/frames/frame_${String(i + 1).padStart(4, '0')}.jpg`,
  fallbackPoster = '/images/swift.jpg',
  className = '',
}: AppleScrollCanvasSequenceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let scrollTriggerInstance: any = null;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;
    const state = { frame: 0 };

    const handleResize = () => {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      renderFrame(Math.round(state.frame));
    };

    const drawCoverImage = (img: HTMLImageElement) => {
      if (!canvas || !ctx) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const imgW = img.naturalWidth || 1280;
      const imgH = img.naturalHeight || 720;
      const imgRatio = imgW / imgH;
      const canvasRatio = w / h;

      let drawW: number, drawH: number, drawX: number, drawY: number;

      if (canvasRatio > imgRatio) {
        drawW = w;
        drawH = w / imgRatio;
        drawX = 0;
        drawY = (h - drawH) / 2;
      } else {
        drawH = h;
        drawW = h * imgRatio;
        drawX = (w - drawW) / 2;
        drawY = 0;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    };

    const renderFrame = (index: number) => {
      const idx = Math.min(totalFrames - 1, Math.max(0, index));
      const img = loadedImages[idx];
      if (img && img.complete && img.naturalWidth > 0) {
        requestAnimationFrame(() => drawCoverImage(img));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Preload Frames
    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      img.src = framePathPattern(i);

      img.onload = () => {
        if (!isMounted) return;
        loadedCount++;
        const pct = Math.round((loadedCount / totalFrames) * 100);
        setLoadingProgress(pct);

        if (i === 0) renderFrame(0);

        if (loadedCount === totalFrames) {
          setIsLoaded(true);
          initGSAP();
        }
      };

      img.onerror = () => {
        if (!isMounted) return;
        loadedCount++;
        img.src = fallbackPoster;
        if (loadedCount === totalFrames) {
          setIsLoaded(true);
          initGSAP();
        }
      };

      loadedImages.push(img);
    }

    async function initGSAP() {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        if (!containerRef.current || !isMounted) return;

        scrollTriggerInstance = gsap.to(state, {
          frame: totalFrames - 1,
          snap: 'frame',
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5,
            onUpdate: () => {
              renderFrame(Math.round(state.frame));
            },
          },
        });
      } catch (err) {
        console.error('Failed to load GSAP dynamically:', err);
      }
    }

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (scrollTriggerInstance && scrollTriggerInstance.scrollTrigger) {
        scrollTriggerInstance.scrollTrigger.kill();
      }
    };
  }, [totalFrames, framePathPattern, fallbackPoster]);

  return (
    <section ref={containerRef} className={`relative w-full h-[300vh] ${className}`}>
      <div className="sticky top-0 w-full h-screen overflow-hidden bg-[#070B19] flex items-center justify-center">
        
        {!isLoaded && (
          <div className="absolute inset-0 z-50 bg-[#070B19] flex flex-col items-center justify-center space-y-4">
            <span className="text-xs uppercase tracking-widest text-slate-300 font-medium">
              Preloading Precision Sequence ({loadingProgress}%)
            </span>
            <div className="w-60 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-150"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="w-full h-full object-cover block" />
      </div>
    </section>
  );
}
