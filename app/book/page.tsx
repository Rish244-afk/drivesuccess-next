import React from 'react';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Driving Session | DriveSuccess Academy',
  description: 'Select your package, instructor, vehicle, and time slot. Live database booking with double-booking safety checks.',
};

export default function BookPage() {
  return (
    <div className="space-y-0 overflow-hidden mesh-gradient-slow min-h-screen relative py-20 lg:py-28 font-sans">
      {/* Ambient lighting blobs */}
      <div aria-hidden="true" className="absolute top-0 left-1/4 -translate-x-1/2 w-[700px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div aria-hidden="true" className="absolute bottom-0 right-1/4 translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)', filter: 'blur(55px)' }} />

      {/* Floating rings */}
      <div aria-hidden="true" className="hidden lg:block absolute top-[15%] right-[6%] w-16 h-16 rounded-full border border-blue-200/25 float-ring" />
      <div aria-hidden="true" className="hidden lg:block absolute bottom-[15%] left-[6%] w-12 h-12 rounded-full border border-purple-200/20 float-ring-slow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-300/80 text-blue-600 text-xs font-semibold tracking-widest uppercase bg-white/70 backdrop-blur-md shadow-premium-sm">
            <span>Seamless Online Registration</span>
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl font-normal text-slate-900 tracking-tight leading-tight">
            Book Your Driving Session
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-light leading-relaxed">
            Follow our 6-step interactive booking wizard. All packages, instructors, vehicles, and schedules are synchronized live with our database.
          </p>
        </div>

        <BookingWizard />
      </div>
    </div>
  );
}
