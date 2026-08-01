import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Vahathi Motor Driving School',
  description: 'Terms of service and student driver training agreement for Vahathi Motor Driving School.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-slate-200 space-y-8">
      <div className="space-y-3 border-b border-slate-800 pb-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Legal Compliance</span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal text-slate-100">Terms & Conditions</h1>
        <p className="text-xs text-slate-400">Last updated: August 1, 2026</p>
      </div>

      <div className="space-y-6 text-sm font-light text-slate-300 leading-relaxed">
        <h2 className="font-serif text-2xl text-slate-100 font-normal">1. Driver Training Agreement</h2>
        <p>
          By booking a course with Vahathi Motor Driving School, students agree to adhere to instructor safety guidelines, road safety rules, and scheduled session times.
        </p>

        <h2 className="font-serif text-2xl text-slate-100 font-normal">2. Dual-Control Fleet Safety</h2>
        <p>
          All training sessions are conducted using dual-control equipped vehicles under certified instructor supervision. Students must follow instructor commands for safety interventions.
        </p>

        <h2 className="font-serif text-2xl text-slate-100 font-normal">3. Cancellations & Rescheduling</h2>
        <p>
          Practical session cancellations or slot rescheduling must be requested at least 24 hours prior to the scheduled session time via the Student Portal or helpline (+91 7829780778).
        </p>
      </div>
    </div>
  );
}
