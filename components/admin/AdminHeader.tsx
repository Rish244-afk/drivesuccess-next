'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, Calendar, Package, Car, UserCheck, LogOut, FileText } from 'lucide-react';
import { adminLogoutAction } from '@/actions/admin';

export function AdminHeader() {
  const pathname = usePathname();

  const links = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Bookings & Assignments', href: '/admin/bookings', icon: Calendar },
    { name: 'Student Documents', href: '/admin/documents', icon: FileText },
    { name: 'Packages (CRUD)', href: '/admin/packages', icon: Package },
    { name: 'Vehicles (CRUD)', href: '/admin/vehicles', icon: Car },
    { name: 'Instructors (CRUD)', href: '/admin/instructors', icon: UserCheck },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-extrabold shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-base tracking-tight text-slate-100 block">
              DriveSuccess Admin
            </span>
            <span className="text-[9px] font-extrabold tracking-[0.2em] text-amber-400 uppercase block -mt-1">
              Control Center
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 text-xs font-heading font-bold transition-all py-1.5 px-3 rounded-xl ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <link.icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <form action={adminLogoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 rounded-xl hover:bg-rose-500/20 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Admin Logout</span>
          </button>
        </form>

      </div>
    </header>
  );
}
