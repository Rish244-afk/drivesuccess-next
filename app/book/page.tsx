import React from 'react';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Driving Session | DriveSuccess Academy',
  description: 'Select your package, instructor, vehicle, and time slot. Live database booking with double-booking safety checks.',
};

export default function BookPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
          Seamless Online Registration
        </span>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900">
          Book Your Driving Session
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Follow our 6-step interactive booking wizard. All packages, instructors, vehicles, and schedules are synchronized live with our database.
        </p>
      </div>

      <BookingWizard />
    </div>
  );
}
