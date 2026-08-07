'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, CheckCircle2, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { submitContactInquiryAction } from '@/actions/contact';
import { Magnetic } from '@/components/ui/Magnetic';

const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Vahathi+Motor+Driving+School+Kasavanahalli+Main+Rd+near+max+Kasavanahalli+Owners+Court+Layout+Eastwood+Twp+Bengaluru+Karnataka+560035';

const PHONE_URL =
  'https://www.google.com/search?q=Vahathi+Motor+Driving+School&oq=vaha&gs_lcrp=EgZjaHJvbWUqCAgAEEUYJxg7MggIABBFGCcYOzIGCAEQRRg7MgYIAhBFGDkyDQgDEAAYgwEYsQMYgAQyDQgEEAAYgwEYsQMYgAQyBggFEEUYPTIGCAYQRRg9MgYIBxBFGD3SAQgxMzc4ajBqN6gCALACAA&sourceid=chrome&source=chrome.ob&ie=UTF-8#';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [inquiry, setInquiry] = useState('');
  const [website, setWebsite] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await submitContactInquiryAction({
      name,
      phone,
      email,
      inquiry,
      website,
    });

    setLoading(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.error || 'Failed to submit inquiry. Please try again.');
    }
  };

  return (
    <div className="overflow-hidden mesh-gradient-slow min-h-screen relative py-20 lg:py-28">
      {/* Ambient lighting blobs */}
      <div aria-hidden="true" className="absolute top-0 right-1/4 translate-x-1/2 w-[700px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div aria-hidden="true" className="absolute bottom-0 left-1/4 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)', filter: 'blur(55px)' }} />
      
      {/* Floating rings */}
      <div aria-hidden="true" className="hidden lg:block absolute top-[15%] left-[6%] w-16 h-16 rounded-full border border-blue-200/25 float-ring" />
      <div aria-hidden="true" className="hidden lg:block absolute bottom-[15%] right-[6%] w-12 h-12 rounded-full border border-purple-200/20 float-ring-slow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10 font-sans">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-300/80 text-blue-600 text-xs font-semibold tracking-widest uppercase bg-white/70 backdrop-blur-md shadow-premium-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Get In Touch</span>
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl font-normal text-slate-900 tracking-tight leading-tight">
            Contact Our Driving Advisors
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-light">
            Have questions about program eligibility, license transfers, or vehicle fleet availability? Reach out to our team today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Left 1 Col: Contact Info & Details */}
          <div className="space-y-6">
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/75 backdrop-blur-md border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-premium-sm hover:shadow-premium-md hover:border-blue-400/80 hover:-translate-y-1 transition duration-300 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-blue-100/40">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-slate-900 group-hover:text-blue-600 transition-colors">Vahathi Motor Driving School</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-light">
                  <span className="text-blue-600 font-semibold group-hover:underline">Address</span>: Kasavanahalli Main Rd, near max, Kasavanahalli, Owners Court Layout, Eastwood Twp, Bengaluru, Karnataka 560035
                </p>
                <p className="text-[11px] text-blue-600 font-semibold mt-2">
                  📍 Open in Google Maps →
                </p>
              </div>
            </a>

            <div className="bg-white/75 backdrop-blur-md border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-premium-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100/40">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-slate-900">Phone</h3>
                <p className="mt-1">
                  <a
                    href={PHONE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-bold text-base hover:underline"
                  >
                    078297 80778
                  </a>
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-semibold">Mon - Sat: 6:00 AM - 8:00 PM IST</p>
              </div>
            </div>

            <div className="bg-white/75 backdrop-blur-md border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-premium-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100/40">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-slate-900">Email Inquiry</h3>
                <p className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer mt-1">
                  support@drivesuccess.academy
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-semibold">Typical response within 24 hours</p>
              </div>
            </div>
          </div>

          {/* Right 2 Cols: Form Container */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-md border border-slate-200/80 p-8 sm:p-10 rounded-3xl shadow-premium-md space-y-6">
            
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-premium-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="font-serif text-3xl text-slate-900 font-normal">Inquiry Submitted!</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto font-light leading-relaxed">
                  Thank you for reaching out. One of our certified driving coordinators will contact you via phone or email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-slate-200/60 pb-4">
                  <h3 className="font-serif text-2xl text-slate-900 font-normal">Send a Message</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Fill out the quick form below to request callback assistance.</p>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Student Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:scale-[1.005] text-slate-900 px-4 py-3 rounded-xl outline-none text-xs transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Contact Mobile
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:scale-[1.005] text-slate-900 px-4 py-3 rounded-xl outline-none text-xs transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:scale-[1.005] text-slate-900 px-4 py-3 rounded-xl outline-none text-xs transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Your Inquiry / Questions
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Please specify package preferences, time constraints, or license requirements..."
                    value={inquiry}
                    onChange={(e) => setInquiry(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:scale-[1.005] text-slate-900 px-4 py-3 rounded-xl outline-none text-xs transition-all duration-200 resize-none"
                  />
                </div>

                {/* Invisible Honeypot Field (Bot Trap) */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <Magnetic range={25} strength={0.35}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest py-4.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15 disabled:opacity-50 transition-all duration-300"
                    >
                      {loading ? (
                        <span>Sending Request...</span>
                      ) : (
                        <>
                          <span>Submit Inquiry</span>
                          <MessageSquare className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </Magnetic>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
