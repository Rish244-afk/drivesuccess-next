import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MapPin, Phone, Clock, ArrowUpRight } from 'lucide-react';

const ADDRESS_URL =
  'https://www.google.com/search?sca_esv=cc5c7de7f204be12&sxsrf=APpeQnvSblA8BBZPvtpmkX5lAdEmE4GQjg:1785817012598&q=vahathi+motor+driving+school+address&ludocid=17252816017518154739&sa=X&ved=2ahUKEwjcwK3ljoaWAxVnSmwGHZ8UJW8Q6BN6BAgfEAI';

const PHONE_URL =
  'https://www.google.com/search?q=Vahathi+Motor+Driving+School&oq=vaha&gs_lcrp=EgZjaHJvbWUqCAgAEEUYJxg7MggIABBFGCcYOzIGCAEQRRg7MgYIAhBFGDkyDQgDEAAYgwEYsQMYgAQyDQgEEAAYgwEYsQMYgAQyBggFEEUYPTIGCAYQRRg9MgYIBxBFGD3SAQgxMzc4ajBqN6gCALACAA&sourceid=chrome&source=chrome.ob&ie=UTF-8#';

export function Footer() {
  return (
    <footer className="bg-[#070b19] text-slate-400 border-t border-slate-800/80 pt-20 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
        
        {/* Top Editorial Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-12 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-amber-400/40 text-amber-400 rounded-full flex items-center justify-center font-serif text-2xl italic bg-amber-400/5 shadow-inner shrink-0">
              V
            </div>
            <div>
              <span className="font-serif text-2xl text-slate-100 block font-normal leading-tight">
                Vahathi <span className="italic text-amber-400">Motor</span> Driving School
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-medium block mt-0.5">
                Certified Driving Institution • Call:{' '}
                <a
                  href={PHONE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline font-bold"
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
              className="border border-amber-400/40 text-amber-400 hover:bg-amber-400/10 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full transition-all duration-200 flex items-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>078297 80778</span>
            </a>
            
            <Link
              href="/book"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-7 py-3 rounded-full flex items-center gap-1.5 transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-amber-500/10"
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
            <h4 className="font-serif text-base text-slate-200 font-normal italic tracking-wide">
              Navigation
            </h4>
            <ul className="space-y-3 text-slate-400 font-medium">
              <li>
                <Link href="/" className="hover:text-amber-400 transition-colors">Home Overview</Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-amber-400 transition-colors">Curriculum & Packages</Link>
              </li>
              <li>
                <Link href="/fleet" className="hover:text-amber-400 transition-colors">Vehicle Fleet Standards</Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-amber-400 transition-colors">Schedule Driving Session</Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-amber-400 transition-colors">Student Member Portal</Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-amber-400 text-amber-400/90 transition-colors font-semibold">Admin Control Center 🔑</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Hours & Helpline */}
          <div className="space-y-4">
            <h4 className="font-serif text-base text-slate-200 font-normal italic tracking-wide">
              Academy Hours & Phone
            </h4>
            <div className="space-y-3.5 leading-relaxed text-slate-400">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-semibold">Practical Driving Track Hours</p>
                  <p>Monday – Saturday: 6:00 AM – 8:00 PM IST</p>
                  <p>Sunday: 7:00 AM – 2:00 PM IST</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-1">
                <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-semibold">Phone</p>
                  <p>
                    <a
                      href={PHONE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 font-bold hover:underline"
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
            <h4 className="font-serif text-base text-slate-200 font-normal italic tracking-wide">
              Locate Us
            </h4>
            <div className="space-y-3.5 text-slate-400 leading-relaxed">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-semibold">Vahathi Motor Driving School</p>
                  <p>
                    <a
                      href={ADDRESS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 font-bold hover:underline"
                    >
                      Address
                    </a>
                    : Kasavanahalli Main Rd, near max, Kasavanahalli, Owners Court Layout, Eastwood Twp, Bengaluru, Karnataka 560035
                  </p>
                  <p className="text-[11px] text-amber-400/90 pt-1.5 font-mono">
                    Creta SUV & Honda City Certified Track
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Minimal Copyright Line */}
        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 font-medium gap-4">
          <p>© {new Date().getFullYear()} Vahathi Motor Driving School (DriveSuccess Platform). All rights reserved.</p>
          <div className="flex items-center gap-5 flex-wrap">
            <Link href="/privacy" className="hover:text-amber-400 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-amber-400 transition">Terms & Conditions</Link>
            <Link href="/cookies" className="hover:text-amber-400 transition">Cookie Policy</Link>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Dual-Control Certified</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
