import React from 'react';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Driving Session | DriveSuccess Academy',
  description: 'Select your package, instructor, vehicle, and time slot. Live database booking with double-booking safety checks.',
};

export default function BookPage() {
  return (
    <div className="space-y-0 overflow-hidden bg-[#F4F0E8] text-[#384633] min-h-screen relative py-20 lg:py-28 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#384633]/20 text-[#384633] text-xs font-semibold tracking-widest uppercase bg-white/80 backdrop-blur-md shadow-xs">
            <span>Seamless Online Registration</span>
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl font-normal text-[#384633] tracking-tight leading-tight">
            Book Your Driving Session
          </h1>
          <p className="text-sm sm:text-base text-[#7E8466] font-light leading-relaxed">
            Follow our step-by-step interactive booking wizard. Packages, instructors, vehicles, and schedules are synchronized live with our studio database.
          </p>
        </div>

        <BookingWizard />
      </div>
    </div>
  );
}
