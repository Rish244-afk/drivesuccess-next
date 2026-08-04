'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          type="button"
          aria-label="Scroll back to top"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[#070b19]/95 hover:bg-slate-900 border-l border-y border-amber-500/40 hover:border-amber-400 text-amber-400 py-4 px-2.5 rounded-l-2xl shadow-2xl flex flex-col items-center justify-center gap-2.5 group transition-all duration-300 backdrop-blur-md cursor-pointer select-none"
        >
          <ArrowUp className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-y-1 transition-transform" />
          <span className="[writing-mode:vertical-rl] rotate-180 font-heading font-extrabold text-[10px] tracking-[0.28em] uppercase text-amber-400 group-hover:text-amber-300">
            BACK TOP
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
