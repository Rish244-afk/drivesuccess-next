import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Vahathi Motor Driving School',
  description: 'Privacy policy and data protection compliance for Vahathi Motor Driving School students.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-slate-700 space-y-8">
      <div className="space-y-3 border-b border-slate-200 pb-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">Legal Compliance</span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal text-slate-900">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Last updated: August 1, 2026</p>
      </div>

      <div className="space-y-6 text-sm font-light text-slate-600 leading-relaxed">
        <h2 className="font-serif text-2xl text-slate-900 font-normal">1. Information We Collect</h2>
        <p>
          Vahathi Motor Driving School (DriveSuccess Platform) collects essential student information including full name, phone number, email address, training schedule preferences, and RTO driver license documentation necessary to conduct practical driving sessions.
        </p>

        <h2 className="font-serif text-2xl text-slate-900 font-normal">2. How We Use Your Information</h2>
        <p>
          Your data is strictly utilized for:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Scheduling 1-on-1 practical driving sessions with certified instructors.</li>
          <li>Processing driver training payments via Razorpay secure gateway.</li>
          <li>Sending session reminders and SMS OTP authentication via Firebase.</li>
          <li>Assisting with RTO (Regional Transport Office) driver license application processing.</li>
        </ul>

        <h2 className="font-serif text-2xl text-slate-900 font-normal">3. Data Security & Storage</h2>
        <p>
          We employ industry-standard SSL encryption, Supabase PostgreSQL data isolation, and HTTP-only cookie authentication to safeguard student personal data against unauthorized access.
        </p>

        <h2 className="font-serif text-2xl text-slate-900 font-normal">4. Contact Us</h2>
        <p>
          For privacy inquiries or data requests, contact us at: <strong>contact@vahathidriving.com</strong> or call <strong>+91 7829780778</strong>.
        </p>
      </div>
    </div>
  );
}
