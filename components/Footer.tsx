import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MapPin, Phone, Clock, ArrowUpRight } from 'lucide-react';

const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Vahathi+Motor+Driving+School+Kasavanahalli+Main+Rd+near+max+Kasavanahalli+Owners+Court+Layout+Eastwood+Twp+Bengaluru+Karnataka+560035';

const PHONE_URL =
  'https://www.google.com/search?q=Vahathi+Motor+Driving+School&oq=vaha&gs_lcrp=EgZjaHJvbWUqCAgAEEUYJxg7MggIABBFGCcYOzIGCAEQRRg7MgYIAhBFGDkyDQgDEAAYgwEYsQMYgAQyDQgEEAAYgwEYsQMYgAQyBggFEEUYPTIGCAYQRRg9MgYIBxBFGD3SAQgxMzc4ajBqN6gCALACAA&sourceid=chrome&source=chrome.ob&ie=UTF-8#';

export function Footer() {
  return (
    <footer className="text-slate-500 border-t pt-20 pb-12 font-sans" style={{ background: '#F1F5F9', borderColor: 'rgba(226,232,240,0.7)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
        
        {/* Top Editorial Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-12 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-blue-600 text-white bg-blue-600 rounded-full flex items-center justify-center font-serif text-2xl italic shadow-inner shrink-0">
              V
            </div>
            <div>
              <span className="font-serif text-2xl text-slate-900 block font-normal leading-tight">
                Vahathi <span className="italic text-blue-500">Motor</span> Driving School
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium block mt-0.5">
                Certified Driving Institution • Call:{' '}
                <a
                  href={PHONE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline font-bold"
                >
                  078297 80778
                </a>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <a
              href={PHONE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-blue-400/40 text-blue-500 hover:bg-blue-600/10 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full transition-all duration-200 flex items-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>078297 80778</span>
            </a>
            
            <Link
              href="/book"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest px-7 py-3 rounded-full flex items-center gap-1.5 transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-600/10"
            >
              <span>Reserve Session</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Minimal 3-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-xs">
          
          {/* Column 1: Navigation */}
          <div className="space-y-4">
            <h4 className="font-serif text-base text-slate-700 font-normal italic tracking-wide">
              Navigation
            </h4>
            <ul className="space-y-3 text-slate-500 font-medium">
              <li>
                <Link href="/" className="hover:text-blue-500 transition-colors">Home Overview</Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-blue-500 transition-colors">Curriculum & Packages</Link>
              </li>
              <li>
                <Link href="/fleet" className="hover:text-blue-500 transition-colors">Vehicle Fleet Standards</Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-blue-500 transition-colors">Schedule Driving Session</Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-blue-500 transition-colors">Student Member Portal</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Hours & Helpline */}
          <div className="space-y-4">
            <h4 className="font-serif text-base text-slate-700 font-normal italic tracking-wide">
              Academy Hours & Phone
            </h4>
            <div className="space-y-3.5 leading-relaxed text-slate-500">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-700 font-semibold">Practical Driving Track Hours</p>
                  <p>Monday – Saturday: 6:00 AM – 8:00 PM IST</p>
                  <p>Sunday: 7:00 AM – 2:00 PM IST</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-1">
                <Phone className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-700 font-semibold">Phone</p>
                  <p>
                    <a
                      href={PHONE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 font-bold hover:underline"
                    >
                      078297 80778
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Locate Us */}
          <div className="space-y-4">
            <h4 className="font-serif text-base text-slate-700 font-normal italic tracking-wide">
              Locate Us
            </h4>
            <div className="space-y-3.5 text-slate-500 leading-relaxed">
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 group p-2 -m-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-slate-700 font-semibold group-hover:text-blue-500 transition-colors">
                    Vahathi Motor Driving School
                  </p>
                  <p className="mt-0.5">
                    <span className="text-blue-500 font-bold group-hover:underline">Address</span>:
                    Kasavanahalli Main Rd, near max, Kasavanahalli, Owners Court Layout, Eastwood Twp, Bengaluru, Karnataka 560035
                  </p>
                  <p className="text-[11px] text-blue-500 pt-1.5 font-mono">
                    📍 Open in Google Maps →
                  </p>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Minimal Copyright Line */}
        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 font-medium gap-4">
          <p>© {new Date().getFullYear()} Vahathi Motor Driving School (DriveSuccess Platform). All rights reserved.</p>
          <div className="flex items-center gap-5 flex-wrap">
            <Link href="/privacy" className="hover:text-blue-500 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-500 transition">Terms & Conditions</Link>
            <Link href="/cookies" className="hover:text-blue-500 transition">Cookie Policy</Link>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Dual-Control Certified</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
