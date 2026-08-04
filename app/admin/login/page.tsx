'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminAuthModal } from '@/components/auth/AdminAuthModal';

export default function AdminLoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background patterns similar to main app */}
      <AdminAuthModal 
        isOpen={true} 
        onClose={() => {
          // If they cancel, send them to home or back
          router.push('/');
        }} 
      />
    </div>
  );
}
