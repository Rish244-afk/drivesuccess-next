'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, X, Check, Lock } from 'lucide-react';
import Link from 'next/link';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    const savedConsent = localStorage.getItem('drivesuccess_cookie_consent');
    if (!savedConsent) {
      // Delay presentation slightly for UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsentChoice = (essential: boolean, analytics: boolean, marketing: boolean) => {
    const consentPayload = {
      essential,
      analytics,
      marketing,
      version: 'v1.0-dpdp-gdpr',
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('drivesuccess_cookie_consent', JSON.stringify(consentPayload));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 text-slate-100 p-5 rounded-2xl shadow-2xl shadow-slate-950/80">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs leading-relaxed text-slate-300">
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                Privacy & Cookie Consent
                <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  DPDP & GDPR Compliant
                </span>
              </h4>
              <button
                onClick={() => saveConsentChoice(true, false, false)}
                aria-label="Close cookie consent banner"
                className="text-slate-500 hover:text-slate-300 p-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mb-2 text-slate-400">
              We use essential cookies to maintain secure student sessions and optional cookies for analytics. Read our{' '}
              <Link href="/privacy" className="text-amber-400 underline hover:text-amber-300">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/cookies" className="text-amber-400 underline hover:text-amber-300">
                Cookie Policy
              </Link>.
            </p>

            {showDetails && (
              <div className="my-3 space-y-2 pt-2 border-t border-slate-800 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    Essential Session Cookies
                  </span>
                  <span className="text-emerald-400 font-semibold uppercase text-[10px]">Required</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-300">Performance & Analytics</span>
                  <input
                    type="checkbox"
                    checked={analyticsConsent}
                    onChange={(e) => setAnalyticsConsent(e.target.checked)}
                    className="accent-amber-400 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-300">Marketing & Updates</span>
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="accent-amber-400 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => saveConsentChoice(true, true, true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-[11px] uppercase tracking-wider transition shadow-sm"
              >
                Accept All
              </button>
              <button
                onClick={() => saveConsentChoice(true, false, false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-2 rounded-xl text-[11px] uppercase tracking-wider transition"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-slate-400 hover:text-slate-200 text-[11px] underline ml-auto py-1"
              >
                {showDetails ? 'Hide Options' : 'Customize'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
