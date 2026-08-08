import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock, ArrowUpRight } from 'lucide-react';

const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Vahathi+Motor+Driving+School+Kasavanahalli+Main+Rd+near+max+Kasavanahalli+Owners+Court+Layout+Eastwood+Twp+Bengaluru+Karnataka+560035';

const PHONE_URL =
  'https://www.google.com/search?q=Vahathi+Motor+Driving+School&ie=UTF-8';

export function Footer() {
  return (
    <footer className="text-[#384633] border-t border-[#384633]/10 pt-20 pb-12 font-sans rounded-t-[3rem] bg-[#E7E1D6]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
        
        {/* Top Editorial Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#384633]/10 pb-12 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-[#384633]/30 text-[#384633] bg-white/70 rounded-full flex items-center justify-center font-serif text-2xl italic shadow-xs shrink-0">
              V
            </div>
            <div>
              <span className="font-serif text-2xl text-[#384633] block font-normal leading-tight">
                Vahathi <span className="italic text-[#7E8466]">Motor</span> Driving School
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#7E8466] font-medium block mt-0.5">
                Certified Driving Institution • Call:{' '}
                <a
                  href={PHONE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#384633] hover:underline font-bold"
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
              className="border border-[#384633]/30 text-[#384633] hover:bg-white/80 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full transition-all duration-200 flex items-center gap-2 bg-white/60"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>078297 80778</span>
            </a>
            
            <Link
              href="/book"
              className="bg-[#384633] hover:bg-[#2B3B2B] text-white font-bold text-xs uppercase tracking-widest px-7 py-3 rounded-full flex items-center gap-1.5 transition-all duration-200 hover:scale-[1.02] shadow-md border border-[#384633]"
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
            <h4 className="font-serif text-base text-[#384633] font-normal italic tracking-wide">
              Navigation
            </h4>
            <ul className="space-y-3 text-[#7E8466] font-medium">
              <li>
                <Link href="/" className="hover:text-[#384633] transition-colors">Home Overview</Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-[#384633] transition-colors">Curriculum & Packages</Link>
              </li>
              <li>
                <Link href="/fleet" className="hover:text-[#384633] transition-colors">Vehicle Fleet Standards</Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-[#384633] transition-colors">Schedule Driving Session</Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-[#384633] transition-colors">Student Member Portal</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Hours & Helpline */}
          <div className="space-y-4">
            <h4 className="font-serif text-base text-[#384633] font-normal italic tracking-wide">
              Academy Hours & Phone
            </h4>
            <div className="space-y-3.5 leading-relaxed text-[#7E8466]">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#384633] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#384633] font-semibold">Practical Driving Track Hours</p>
                  <p>Monday – Saturday: 6:00 AM – 8:00 PM IST</p>
                  <p>Sunday: 7:00 AM – 2:00 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-1">
                <Phone className="w-4 h-4 text-[#384633] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#384633] font-semibold">Phone Helpline</p>
                  <a
                    href={PHONE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#384633] font-bold hover:underline"
                  >
                    078297 80778
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Location */}
          <div className="space-y-4">
            <h4 className="font-serif text-base text-[#384633] font-normal italic tracking-wide">
              Locate Us
            </h4>
            <div className="space-y-3 text-[#7E8466]">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#384633] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#384633] font-semibold">Vahathi Motor Driving School</p>
                  <p className="leading-relaxed">
                    Address: Kasavanahalli Main Rd, near max, Kasavanahalli, Owners Court Layout, Eastwood Twp, Bengaluru, Karnataka 560035
                  </p>
                  <a
                    href={GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#384633] font-bold mt-2 hover:underline"
                  >
                    <span>📍 Open in Google Maps</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Rights & Links */}
        <div className="pt-8 border-t border-[#384633]/10 flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#7E8466] gap-4">
          <p>© 2026 Vahathi Motor Driving School (DriveSuccess Platform). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#384633] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#384633] transition-colors">Terms & Conditions</Link>
            <Link href="/cookies" className="hover:text-[#384633] transition-colors">Cookie Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
