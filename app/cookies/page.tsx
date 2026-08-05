import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Vahathi Motor Driving School',
  description: 'Cookie policy and session storage disclosure for Vahathi Motor Driving School platform.',
};

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-slate-700 space-y-8">
      <div className="space-y-3 border-b border-slate-200 pb-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">Legal Compliance</span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal text-slate-900">Cookie Policy</h1>
        <p className="text-xs text-slate-500">Last updated: August 1, 2026</p>
      </div>

      <div className="space-y-6 text-sm font-light text-slate-600 leading-relaxed">
        <h2 className="font-serif text-2xl text-slate-900 font-normal">1. Essential Cookies & Sessions</h2>
        <p>
          We use HTTP-only, secure session cookies to keep student driver portal logins secure and remember booking wizard progress.
        </p>

        <h2 className="font-serif text-2xl text-slate-900 font-normal">2. Third-Party Integrations</h2>
        <p>
          Secure payment transactions processed through Razorpay and SMS OTP verifications processed via Firebase Auth may set technical cookies required for fraud prevention and transaction verification.
        </p>
      </div>
    </div>
  );
}
