'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Get In Touch</span>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-100">
          Contact Our Driving Advisors
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Have questions about program eligibility, license transfers, or vehicle fleet availability? Reach out to our team today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        
        {/* Left 2 Cols: Contact Info & Details */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-slate-100">Vahathi Motor Driving School</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                29th Main Road, BTM 2nd Stage<br />
                Bengaluru, Karnataka 560076
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-slate-100">Call Us (Direct Line)</h3>
              <a href="tel:7829780778" className="text-amber-400 font-bold text-sm hover:underline block mt-1">
                +91 7829780778
              </a>
              <p className="text-[11px] text-slate-500 mt-0.5">Mon - Sat: 6:00 AM - 8:00 PM IST</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-slate-100">Email & Enquiries</h3>
              <p className="text-xs text-slate-400 mt-1">contact@vahathidriving.com</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Instant WhatsApp / Phone support</p>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Contact Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-6 h-6 text-amber-400" />
            <h2 className="font-heading font-extrabold text-2xl text-slate-100">Send Us a Message</h2>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-4"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="font-heading font-extrabold text-xl text-slate-100">Message Received!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Thank you for reaching out. A Senior Driving Advisor will contact you at your phone number or email within 2 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs font-bold text-amber-400 hover:underline pt-2 inline-block"
              >
                Send another message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sarah Jenkins"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 px-4 py-3 rounded-xl outline-none text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 px-4 py-3 rounded-xl outline-none text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="sarah@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 px-4 py-3 rounded-xl outline-none text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Program Interest / Inquiry
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="I am looking for information on 4-wheeler driver licensing packages and weekend slot availability..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 px-4 py-3 rounded-xl outline-none text-sm transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xl shadow-amber-500/20 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Sending Message...' : 'Submit Inquiry'}</span>
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
