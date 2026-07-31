'use client';

import React, { useState } from 'react';
import { Search, Calendar, UserCheck, Car, CheckCircle2, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { updateBookingAssignmentAction } from '@/actions/admin';

interface AdminBookingsClientProps {
  initialBookings: any[];
  allInstructors: any[];
  allVehicles: any[];
}

export function AdminBookingsClient({
  initialBookings,
  allInstructors,
  allVehicles,
}: AdminBookingsClientProps) {
  const [bookings, setBookings] = useState<any[]>(initialBookings);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Filter bookings client side or refresh
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const studentName = b.student?.name?.toLowerCase() || '';
      const studentPhone = b.student?.phone?.toLowerCase() || '';
      const pkgName = b.package?.name?.toLowerCase() || '';
      const bookingId = b.id.toLowerCase();
      return studentName.includes(q) || studentPhone.includes(q) || pkgName.includes(q) || bookingId.includes(q);
    }
    return true;
  });

  // Handle Instructor / Vehicle Assignment & Status Updates
  const handleUpdateAssignment = async (
    bookingId: string,
    updates: { instructorId?: string; vehicleId?: string; status?: any; paymentStatus?: any }
  ) => {
    setLoadingId(bookingId);
    setMessage(null);

    const res = await updateBookingAssignmentAction({
      bookingId,
      ...updates,
    });

    setLoadingId(null);

    if (res.success && res.booking) {
      setMessage('Booking updated successfully!');
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, ...updates } : b))
      );
      setTimeout(() => setMessage(null), 3000);
    } else {
      alert(res.error || 'Failed to update assignment.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Alert Notice */}
      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Controls Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search student, phone, package..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs">
            No bookings found matching filters.
          </div>
        ) : (
          filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-extrabold text-base text-slate-100">{b.student?.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">({b.student?.phone})</span>
                  </div>
                  <p className="text-xs text-amber-400 font-semibold">{b.package?.name} • ₹{b.totalAmount.toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">ID: {b.id.slice(-8)}</span>
                </div>
              </div>

              {/* Assignments & Status Control Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                
                {/* 1. Assign Instructor */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Assigned Instructor
                  </label>
                  <select
                    value={b.instructorId || ''}
                    onChange={(e) => handleUpdateAssignment(b.id, { instructorId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg outline-none text-xs font-semibold"
                  >
                    <option value="">-- Assign Instructor --</option>
                    {allInstructors.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} (★{inst.rating})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Assign Vehicle */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Assigned Vehicle
                  </label>
                  <select
                    value={b.vehicleId || ''}
                    onChange={(e) => handleUpdateAssignment(b.id, { vehicleId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg outline-none text-xs font-semibold"
                  >
                    <option value="">-- Assign Vehicle --</option>
                    {allVehicles.map((veh) => (
                      <option key={veh.id} value={veh.id}>
                        {veh.name} ({veh.transmission})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Booking Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Booking Status
                  </label>
                  <select
                    value={b.status}
                    onChange={(e) => handleUpdateAssignment(b.id, { status: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 text-amber-400 p-2 rounded-lg outline-none text-xs font-extrabold uppercase"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                {/* 4. Payment Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Payment Status
                  </label>
                  <select
                    value={b.paymentStatus}
                    onChange={(e) => handleUpdateAssignment(b.id, { paymentStatus: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 text-emerald-400 p-2 rounded-lg outline-none text-xs font-extrabold uppercase"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="REFUNDED">REFUNDED</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>

              </div>

              {loadingId === b.id && (
                <div className="text-[11px] text-amber-400 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating database record...</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
