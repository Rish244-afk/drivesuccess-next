'use client';

import React from 'react';
import {
  CheckCircle2,
  CalendarClock,
  Clock,
  CreditCard,
  Target,
  Package,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface QuickStatsProps {
  completedSessions: number;
  totalSessions: number;
  upcomingCount: number;
  pendingPaymentAmount: number;
  packageName?: string;
  readinessPercentage?: number;
}

export function QuickStats({
  completedSessions,
  totalSessions,
  upcomingCount,
  pendingPaymentAmount,
  packageName = 'Gold 4W Driving Package',
  readinessPercentage = 82,
}: QuickStatsProps) {
  // Calculate total hours (assuming 1 hr per session + 0.5 bonus setup)
  const hoursDriven = (completedSessions * 1.0).toFixed(1);

  const stats = [
    {
      id: 'sessions',
      title: 'Sessions Completed',
      value: `${completedSessions} / ${totalSessions}`,
      subtitle: `${Math.round((completedSessions / totalSessions) * 100)}% Completed`,
      icon: CheckCircle2,
      color: 'blue',
      badge: completedSessions > 0 ? 'Active Progress' : 'Just Started',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'upcoming',
      title: 'Upcoming Lessons',
      value: upcomingCount.toString(),
      subtitle: upcomingCount > 0 ? 'Next session scheduled' : 'No upcoming lessons',
      icon: CalendarClock,
      color: 'indigo',
      badge: upcomingCount > 0 ? 'Scheduled' : 'Book Session',
      badgeColor: upcomingCount > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200',
    },
    {
      id: 'hours',
      title: 'Hours Driven',
      value: `${hoursDriven} hrs`,
      subtitle: 'Track time behind wheel',
      icon: Clock,
      color: 'teal',
      badge: 'Practical Time',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      id: 'payments',
      title: 'Pending Payments',
      value: `₹${pendingPaymentAmount.toLocaleString()}`,
      subtitle: pendingPaymentAmount > 0 ? 'Requires attention' : 'All invoices settled',
      icon: CreditCard,
      color: pendingPaymentAmount > 0 ? 'rose' : 'emerald',
      badge: pendingPaymentAmount > 0 ? 'Action Needed' : 'Paid in Full',
      badgeColor: pendingPaymentAmount > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'readiness',
      title: 'RTO Test Readiness',
      value: `${readinessPercentage}%`,
      subtitle: readinessPercentage >= 75 ? 'On track for license test' : 'More practice recommended',
      icon: Target,
      color: 'amber',
      badge: readinessPercentage >= 75 ? 'High Readiness' : 'In Training',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'package',
      title: 'Current Package',
      value: packageName,
      subtitle: `${totalSessions} Practical Sessions Included`,
      icon: Package,
      color: 'purple',
      badge: 'Active Tier',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.id}
            className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              {/* Header Row: Icon + Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${stat.badgeColor}`}>
                  {stat.badge}
                </span>
              </div>

              {/* Title & Main Value */}
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block mb-1">
                {stat.title}
              </span>
              <h3 className={`font-serif tracking-tight text-slate-900 font-semibold ${stat.isText ? 'text-sm line-clamp-2' : 'text-2xl sm:text-3xl'}`}>
                {stat.value}
              </h3>
            </div>

            {/* Subtitle / Footer */}
            <p className="text-[11px] text-slate-400 font-light mt-3 border-t border-slate-100 pt-2 line-clamp-1">
              {stat.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
