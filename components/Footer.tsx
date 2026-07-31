import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MapPin, Phone, Mail, Award, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="font-heading font-extrabold text-xl text-slate-100">
                DriveSuccess <span className="text-amber-400">Academy</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              Empowering the next generation of safe drivers through structured, sensor-led pedagogy and safety-first fleet management.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
              <Award className="w-4 h-4" />
              <span>ISO 9001:2026 Certified Institution</span>
            </div>
          </div>

          {/* Col 2: Programs */}
          <div>
            <h4 className="font-heading font-bold text-slate-100 text-xs tracking-wider uppercase mb-4">
              Training Programs
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/courses" className="hover:text-amber-400 transition">Essential License Program</Link></li>
              <li><Link href="/courses" className="hover:text-amber-400 transition">License Transfer Bridge</Link></li>
              <li><Link href="/courses" className="hover:text-amber-400 transition">Professional Masterclass</Link></li>
              <li><Link href="/courses" className="hover:text-amber-400 transition">Weekend Warrior Program</Link></li>
              <li><Link href="/courses" className="hover:text-amber-400 transition">License Renewal Support</Link></li>
            </ul>
          </div>

          {/* Col 3: Vehicle Fleet */}
          <div>
            <h4 className="font-heading font-bold text-slate-100 text-xs tracking-wider uppercase mb-4">
              Learning Fleet
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/fleet" className="hover:text-amber-400 transition">Tier A: WagonR & Swift</Link></li>
              <li><Link href="/fleet" className="hover:text-amber-400 transition">Tier A: Polo & Dzire</Link></li>
              <li><Link href="/fleet" className="hover:text-amber-400 transition">Tier B: Verna Sedan</Link></li>
              <li><Link href="/fleet" className="hover:text-amber-400 transition">Tier B: Venue & Fronx Crossover</Link></li>
              <li><Link href="/fleet" className="hover:text-amber-400 transition">Dual-Control Safety Standard</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact Details */}
          <div>
            <h4 className="font-heading font-bold text-slate-100 text-xs tracking-wider uppercase mb-4">
              Academy Contact
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>100 Academy Way, Suite 500, New York, NY 10027</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+1 (555) 019-8827</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>contact@drivesuccess.edu</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mon - Sat: 8:00 AM - 8:00 PM</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 DriveSuccess Academy. All rights reserved. Licensed Pedagogical Institution.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-300">RTO Accreditation</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
