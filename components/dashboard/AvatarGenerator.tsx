'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AvatarGeneratorProps {
  name: string;
  avatarUrl?: string | null;
  size?: number; // Size in px (default 80)
  className?: string;
  showOnlineStatus?: boolean;
}

const GRADIENT_PALETTES = [
  'from-blue-600 to-indigo-700 text-white',
  'from-indigo-600 to-purple-700 text-white',
  'from-emerald-600 to-teal-700 text-white',
  'from-blue-700 to-cyan-600 text-white',
  'from-violet-600 to-pink-600 text-white',
];

export function AvatarGenerator({
  name,
  avatarUrl,
  size = 80,
  className = '',
  showOnlineStatus = true,
}: AvatarGeneratorProps) {
  const [imageError, setImageError] = useState(false);

  // Generate initials (e.g., "Rishh Sharma" -> "RS", "Priya" -> "PR")
  const getInitials = (str: string) => {
    if (!str) return 'DS';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  // Select deterministic gradient based on name hash
  const getGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % GRADIENT_PALETTES.length;
    return GRADIENT_PALETTES[index];
  };

  const initials = getInitials(name);
  const gradientClass = getGradient(name);
  const fontSizeClass = size >= 80 ? 'text-2xl' : size >= 48 ? 'text-lg' : 'text-xs';

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      {avatarUrl && !imageError ? (
        <Image
          src={avatarUrl}
          alt={name}
          width={size}
          height={size}
          onError={() => setImageError(true)}
          className="rounded-full object-cover border-2 border-white/80 shadow-md transition-transform duration-300 hover:scale-105"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      ) : (
        <div
          className={`w-full h-full rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center font-bold font-sans ${fontSizeClass} shadow-lg border-2 border-white/80 transition-transform duration-300 hover:scale-105 tracking-wider`}
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          {initials}
        </div>
      )}

      {showOnlineStatus && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-emerald-500 border-2 border-white shadow-sm animate-pulse"
          style={{
            width: Math.max(10, Math.floor(size * 0.18)),
            height: Math.max(10, Math.floor(size * 0.18)),
          }}
          title="Active Student Account"
        />
      )}
    </div>
  );
}
