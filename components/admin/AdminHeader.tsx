'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="Vahathi Motor Driving School"
            width={84}
            height={48}
            className="h-10 w-auto object-contain mix-blend-multiply"
            priority
          />
          <div>
            <span className="font-heading font-extrabold text-[10px] tracking-[0.1em] text-slate-500 uppercase block">
              Admin Portal
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
                    ? 'bg-blue-50 text-blue-600 border border-blue-300'
                    : 'text-slate-400 hover:text-slate-700'
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
            className="flex items-center gap-2 text-xs font-semibold text-rose-400 bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl hover:bg-rose-100 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Admin Logout</span>
          </button>
        </form>

      </div>
    </header>
  );
}
