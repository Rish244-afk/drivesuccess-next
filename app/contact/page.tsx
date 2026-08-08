'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, CheckCircle2, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { submitContactInquiryAction } from '@/actions/contact';
import { Magnetic } from '@/components/ui/Magnetic';

const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Vahathi+Motor+Driving+School+Kasavanahalli+Main+Rd+near+max+Kasavanahalli+Owners+Court+Layout+Eastwood+Twp+Bengaluru+Karnataka+560035';

const PHONE_URL =
  'https://www.google.com/search?q=Vahathi+Motor+Driving+School&ie=UTF-8';

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
    <div className="bg-[#F4F0E8] text-[#384633] font-sans min-h-screen relative py-20 lg:py-28 overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10 font-sans">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#384633]/20 text-[#384633] text-xs font-semibold tracking-widest uppercase bg-white/80 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#384633]" />
            <span>Get In Touch</span>
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl font-normal text-[#384633] tracking-tight leading-tight">
            Contact Our Driving Advisors
          </h1>
          <p className="text-sm sm:text-base text-[#7E8466] leading-relaxed font-light">
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
              className="block bg-[#E7E1D6] border border-[#384633]/15 p-6 rounded-[2rem] space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-white text-[#384633] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-[#384633]/10">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-[#384633] group-hover:text-[#2B3B2B] font-medium">Vahathi Motor Driving School</h3>
                <p className="text-xs text-[#7E8466] mt-2 leading-relaxed font-light">
                  <span className="text-[#384633] font-semibold group-hover:underline">Address</span>: Kasavanahalli Main Rd, near max, Kasavanahalli, Owners Court Layout, Eastwood Twp, Bengaluru, Karnataka 560035
                </p>
                <p className="text-[11px] text-[#384633] font-semibold mt-2">
                  📍 Open in Google Maps →
                </p>
              </div>
            </a>

            <div className="bg-[#E7E1D6] border border-[#384633]/15 p-6 rounded-[2rem] space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-white text-[#384633] rounded-2xl flex items-center justify-center shrink-0 border border-[#384633]/10">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-[#384633] font-medium">Direct Phone Line</h3>
                <p className="text-xs text-[#7E8466] mt-1 font-light">Available Mon – Sat (6 AM – 8 PM IST)</p>
                <a
                  href={PHONE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-base font-bold text-[#384633] hover:underline block mt-2"
                >
                  078297 80778
                </a>
              </div>
            </div>
          </div>

          {/* Right 2 Cols: Interactive Inquiry Form */}
          <div className="lg:col-span-2 bg-[#E7E1D6] border border-[#384633]/15 p-8 sm:p-10 rounded-[2.5rem] shadow-xl">
            {submitted ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-white text-[#384633] rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-3xl text-[#384633] font-normal">Inquiry Received</h3>
                <p className="text-xs text-[#7E8466] font-light max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to Vahathi Motor Driving School. A senior advisor will review your message and contact you shortly via phone/WhatsApp.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="bg-[#384633] text-white font-medium text-xs uppercase tracking-widest px-8 py-3 rounded-full hover:bg-[#2B3B2B] transition cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="font-serif text-2xl text-[#384633] font-normal">Send a Message</h3>
                  <p className="text-xs text-[#7E8466] font-light mt-1">Fill out the quick form below to request callback assistance.</p>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Honeypot Field */}
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#384633]">Student Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-[#384633]/20 rounded-full px-5 py-3 text-xs text-[#384633] outline-none focus:border-[#384633] focus:ring-1 focus:ring-[#384633]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#384633]">Contact Mobile</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-[#384633]/20 rounded-full px-5 py-3 text-xs text-[#384633] outline-none focus:border-[#384633] focus:ring-1 focus:ring-[#384633]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#384633]">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#384633]/20 rounded-full px-5 py-3 text-xs text-[#384633] outline-none focus:border-[#384633] focus:ring-1 focus:ring-[#384633]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#384633]">How Can We Help?</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us your preferred timing slot or license query..."
                    value={inquiry}
                    onChange={(e) => setInquiry(e.target.value)}
                    className="w-full bg-white border border-[#384633]/20 rounded-2xl p-4 text-xs text-[#384633] outline-none focus:border-[#384633] focus:ring-1 focus:ring-[#384633]"
                  />
                </div>

                <Magnetic range={30} strength={0.3}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#384633] hover:bg-[#2B3B2B] text-white font-medium text-xs uppercase tracking-widest py-4 rounded-full transition shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{loading ? 'Submitting Message...' : 'Submit Callback Request'}</span>
                  </button>
                </Magnetic>
              </form>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
