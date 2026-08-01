import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MapPin, Phone, Mail, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#070B19] text-slate-400 border-t border-slate-800/60 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
        
        {/* Top Editorial Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/60 pb-12 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-amber-400/40 text-amber-400 rounded-full flex items-center justify-center font-serif text-xl italic bg-amber-400/5">
              V
            </div>
            <div>
              <span className="font-serif text-2xl text-slate-100 block font-normal">
                Vahathi <span className="italic text-amber-400">Motor</span> Driving School
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium">
                Certified Driving Institution • Call: 7829780778
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="tel:7829780778"
              className="border border-amber-400/40 text-amber-400 hover:bg-amber-400/10 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full transition"
            >
              📞 7829780778
            </a>
            <Link
              href="/book"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-7 py-3 rounded-full transition"
            >
              Reserve Session
            </Link>
          </div>
        </div>

        {/* Minimal 3-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-xs">
          
          {/* Column 1: Navigate */}
          <div className="space-y-4">
            <h4 className="font-serif text-base text-slate-200 font-normal italic">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-slate-400 font-medium">
              <li>
                <Link href="/" className="hover:text-amber-400 transition">Home Overview</Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-amber-400 transition">Curriculum & Packages</Link>
              </li>
              <li>
                <Link href="/fleet" className="hover:text-amber-400 transition">Vehicle Fleet Standards</Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-amber-400 transition">Schedule Driving Session</Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-amber-400 transition">Student Member Portal</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Hours & Operations */}
          <div className="space-y-4">
            <h4 className="font-serif text-base text-slate-200 font-normal italic">
              Academy Hours & Contact
            </h4>
            <div className="space-y-3 leading-relaxed text-slate-400">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-semibold">Practical Driving Hours</p>
                  <p>Monday – Saturday: 6:00 AM – 8:00 PM IST</p>
                  <p>Sunday: 7:00 AM – 2:00 PM IST</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-semibold">Direct Call Helpline</p>
                  <a href="tel:7829780778" className="hover:text-amber-400 text-amber-400 font-bold text-sm block">
                    +91 7829780778 / 7829780778
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Locate Us */}
          <div className="space-y-4">
            <h4 className="font-serif text-base text-slate-200 font-normal italic">
              Locate Us
            </h4>
            <div className="space-y-3 text-slate-400 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-semibold">Vahathi Motor Driving School</p>
                  <p>29th Main Road, BTM 2nd Stage</p>
                  <p>Bengaluru, Karnataka 560076</p>
                  <p className="text-[11px] text-amber-400/80 pt-1 font-mono">
                    Creta SUV & Honda City Certified Training
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Minimal Copyright Line */}
        <div className="border-t border-slate-800/60 pt-8 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 font-medium gap-4">
          <p>© {new Date().getFullYear()} Vahathi Motor Driving School (DriveSuccess Academy). All rights reserved.</p>
          <div className="flex gap-6">
            <span>Call: 7829780778</span>
            <span>Dual-Control Certified Fleet</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
