'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { submitContactInquiryAction } from '@/actions/contact';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await submitContactInquiryAction({
      name,
      phone,
      email,
      inquiry,
    });

    setLoading(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.error || 'Failed to submit inquiry. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Get In Touch</span>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-100">
          Contact Our Driving Advisors
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-light">
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
            className="block bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl hover:border-amber-500/50 transition cursor-pointer group"
          >
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-slate-100 group-hover:text-amber-400 transition-colors">Vahathi Motor Driving School</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                <span className="text-amber-400 font-bold group-hover:underline">Address</span>:
                Kasavanahalli Main Rd, near max, Kasavanahalli, Owners Court Layout, Eastwood Twp, Bengaluru, Karnataka 560035
              </p>
              <p className="text-[11px] text-amber-400 font-semibold mt-2">
                📍 Open in Google Maps →
              </p>
            </div>
          </a>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-slate-100">Phone</h3>
              <p className="mt-1">
                <a
                  href={PHONE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 font-bold text-base hover:underline"
                >
                  078297 80778
                </a>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Mon - Sat: 6:00 AM - 8:00 PM IST</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-slate-100">Email & Enquiries</h3>
              <p className="text-xs text-slate-300 mt-1 font-mono">support@drivesuccess.edu</p>
              <p className="text-[11px] text-slate-500 mt-1">Instant Phone & WhatsApp support</p>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Contact Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-6 h-6 text-amber-400" />
            <h2 className="font-heading font-extrabold text-2xl text-slate-100">Send Us a Message</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

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
                onClick={() => {
                  setSubmitted(false);
                  setName('');
                  setPhone('');
                  setEmail('');
                  setInquiry('');
                }}
                className="text-xs font-bold text-amber-400 hover:underline pt-2 inline-block cursor-pointer"
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 078297 80778"
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={inquiry}
                  onChange={(e) => setInquiry(e.target.value)}
                  placeholder="I am looking for information on 4-wheeler driver licensing packages and weekend slot availability..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 px-4 py-3 rounded-xl outline-none text-sm transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xl shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{loading ? 'Sending Message...' : 'Submit Inquiry'}</span>
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
