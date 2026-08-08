'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, X, Lock } from 'lucide-react';
import Link from 'next/link';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    const savedConsent = localStorage.getItem('drivesuccess_cookie_consent');
    if (!savedConsent) {
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
      <div className="bg-[#E7E1D6] backdrop-blur-xl border border-[#384633]/20 text-[#384633] p-5 rounded-[2rem] shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-white border border-[#384633]/15 rounded-2xl text-[#384633] shrink-0 mt-0.5 shadow-xs">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs leading-relaxed text-[#7E8466]">
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-bold text-[#384633] text-sm flex items-center gap-1.5">
                Privacy & Cookie Consent
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#384633] bg-white px-2.5 py-0.5 rounded-full border border-[#384633]/20">
                  DPDP & GDPR Compliant
                </span>
              </h4>
              <button
                onClick={() => saveConsentChoice(true, false, false)}
                aria-label="Close cookie consent banner"
                className="text-[#7E8466] hover:text-[#384633] p-1 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mb-2 text-[#7E8466]">
              We use essential cookies to maintain secure student sessions and optional cookies for analytics. Read our{' '}
              <Link href="/privacy" className="text-[#384633] font-semibold underline hover:text-[#2B3B2B]">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/cookies" className="text-[#384633] font-semibold underline hover:text-[#2B3B2B]">
                Cookie Policy
              </Link>.
            </p>

            {showDetails && (
              <div className="my-3 space-y-2 pt-2 border-t border-[#384633]/10 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-[#384633]">
                    <Lock className="w-3.5 h-3.5 text-[#384633]" />
                    Essential Session Cookies
                  </span>
                  <span className="text-[#384633] font-semibold uppercase text-[10px]">Required</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#7E8466]">Performance & Analytics</span>
                  <input
                    type="checkbox"
                    checked={analyticsConsent}
                    onChange={(e) => setAnalyticsConsent(e.target.checked)}
                    className="accent-[#384633] rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#7E8466]">Marketing & Updates</span>
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="accent-[#384633] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => saveConsentChoice(true, true, true)}
                className="bg-[#384633] hover:bg-[#2B3B2B] text-white font-bold text-[11px] px-4 py-2 rounded-full transition cursor-pointer shadow-sm"
              >
                Accept All
              </button>
              <button
                onClick={() => saveConsentChoice(true, false, false)}
                className="bg-white/80 hover:bg-white text-[#384633] border border-[#384633]/20 font-bold text-[11px] px-4 py-2 rounded-full transition cursor-pointer"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[#7E8466] hover:text-[#384633] underline text-[11px] px-1 transition cursor-pointer"
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
