'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  UserCheck,
  Car,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Filter,
  MinusCircle,
  Phone,
  MessageSquare,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  CreditCard,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  updateBookingAssignmentAction,
  markSessionCompleteAction,
  removeCompletedSessionAction,
  markBookingNoShowAction,
  cancelBookingWithReasonAction,
} from '@/actions/admin';

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
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [instructorFilter, setInstructorFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'createdAt' | 'student' | 'price'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // Filter & Sort Bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        // Status Filter
        if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

        // Payment Status Filter
        if (paymentFilter !== 'ALL' && b.paymentStatus !== paymentFilter) return false;

        // Instructor Filter
        if (instructorFilter !== 'ALL' && b.instructorId !== instructorFilter) return false;

        // Date Filter
        if (dateFilter !== 'ALL') {
          const now = new Date();
          const created = new Date(b.createdAt);
          if (dateFilter === 'TODAY') {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            if (created < startOfToday) return false;
          } else if (dateFilter === '7DAYS') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (created < sevenDaysAgo) return false;
          } else if (dateFilter === '30DAYS') {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (created < thirtyDaysAgo) return false;
          }
        }

        // Search Query
        if (search.trim() !== '') {
          const q = search.toLowerCase().trim();
          const studentName = b.student?.name?.toLowerCase() || '';
          const studentPhone = b.student?.phone?.toLowerCase() || '';
          const pkgName = b.package?.name?.toLowerCase() || '';
          const bookingId = b.id.toLowerCase();
          const payId = b.razorpayPaymentId?.toLowerCase() || '';
          return (
            studentName.includes(q) ||
            studentPhone.includes(q) ||
            pkgName.includes(q) ||
            bookingId.includes(q) ||
            payId.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'createdAt') {
          const tA = new Date(a.createdAt).getTime();
          const tB = new Date(b.createdAt).getTime();
          return sortOrder === 'desc' ? tB - tA : tA - tB;
        } else if (sortField === 'student') {
          const nA = a.student?.name || '';
          const nB = b.student?.name || '';
          return sortOrder === 'desc' ? nB.localeCompare(nA) : nA.localeCompare(nB);
        } else if (sortField === 'price') {
          return sortOrder === 'desc' ? b.totalAmount - a.totalAmount : a.totalAmount - b.totalAmount;
        }
        return 0;
      });
  }, [bookings, search, statusFilter, paymentFilter, instructorFilter, dateFilter, sortField, sortOrder]);

  const toggleSort = (field: 'createdAt' | 'student' | 'price') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleUpdateAssignment = async (bookingId: string, updates: any) => {
    setLoadingId(bookingId);
    setMessage(null);
    const res = await updateBookingAssignmentAction({ bookingId, ...updates });
    setLoadingId(null);
    if (res.success && res.booking) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, ...res.booking } : b))
      );
      setMessage('Booking updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } else {
      alert(res.error || 'Failed to update assignment.');
    }
  };

  const handleMarkSessionComplete = async (bookingId: string) => {
    setLoadingId(bookingId);
    setMessage(null);
    const res = await markSessionCompleteAction(bookingId);
    setLoadingId(null);
    if (res.success) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === bookingId) {
            const updatedSessions = [...(b.sessions || []), { id: `s_${Date.now()}`, status: 'COMPLETED' }];
            return { ...b, sessions: updatedSessions };
          }
          return b;
        })
      );
      setMessage(res.message || 'Session marked completed!');
      setTimeout(() => setMessage(null), 3000);
    } else {
      alert(res.error || 'Failed to complete session.');
    }
  };

  const handleRemoveSession = async (bookingId: string) => {
    setLoadingId(bookingId);
    setMessage(null);
    const res = await removeCompletedSessionAction(bookingId);
    setLoadingId(null);
    if (res.success) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === bookingId) {
            const sessionsCopy = [...(b.sessions || [])];
            const compIdx = sessionsCopy.findLastIndex((s: any) => s.status === 'COMPLETED');
            if (compIdx !== -1) sessionsCopy.splice(compIdx, 1);
            return { ...b, sessions: sessionsCopy };
          }
          return b;
        })
      );
      setMessage(res.message || 'Completed session undone!');
      setTimeout(() => setMessage(null), 3000);
    } else {
      alert(res.error || 'Failed to remove session.');
    }
  };

  const handleMarkNoShow = async (bookingId: string) => {
    setLoadingId(bookingId);
    setMessage(null);
    const res = await markBookingNoShowAction(bookingId);
    setLoadingId(null);
    if (res.success) {
      setMessage('Session marked as NO-SHOW!');
      setTimeout(() => setMessage(null), 3000);
    } else {
      alert(res.error || 'Failed to mark no-show.');
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalBooking) return;
    if (!cancelReason.trim()) {
      alert('Please enter a reason for cancellation.');
      return;
    }
    setLoadingId(cancelModalBooking.id);
    const res = await cancelBookingWithReasonAction({
      bookingId: cancelModalBooking.id,
      cancelReason: cancelReason.trim(),
    });
    setLoadingId(null);
    if (res.success && res.booking) {
      setBookings((prev) =>
        prev.map((b) => (b.id === cancelModalBooking.id ? { ...b, ...res.booking } : b))
      );
      setMessage('Booking cancelled with logged reason.');
      setCancelModalBooking(null);
      setCancelReason('');
      setTimeout(() => setMessage(null), 3000);
    } else {
      alert(res.error || 'Failed to cancel booking.');
    }
  };

  const formatDate = (dateInput?: any) => {
    if (!dateInput) return 'N/A';
    try {
      const d = new Date(dateInput);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const cleanPhoneForWa = (phoneStr?: string) => {
    if (!phoneStr) return '';
    return phoneStr.replace(/[^\d]/g, '');
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Alert Notice */}
      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Comprehensive Filter Controls */}
      <div className="bg-[#070B19] border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search student, phone, package, payment ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition"
            />
          </div>

          {/* 2. Payment Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-xs outline-none font-medium"
            >
              <option value="ALL">Payment: All Statuses</option>
              <option value="PAID">Payment: PAID</option>
              <option value="PENDING">Payment: PENDING</option>
              <option value="REFUNDED">Payment: REFUNDED</option>
              <option value="FAILED">Payment: FAILED</option>
            </select>
          </div>

          {/* 3. Instructor Filter */}
          <div>
            <select
              value={instructorFilter}
              onChange={(e) => setInstructorFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-xs outline-none font-medium"
            >
              <option value="ALL">Instructor: All Instructors</option>
              {allInstructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  Instructor: {inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Date Range Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-xs outline-none font-medium"
            >
              <option value="ALL">Date Range: All Time</option>
              <option value="TODAY">Date Range: Booked Today</option>
              <option value="7DAYS">Date Range: Last 7 Days</option>
              <option value="30DAYS">Date Range: Last 30 Days</option>
            </select>
          </div>

        </div>

        {/* Booking Status Tabs & Sort Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-800/60">
          
          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest self-center mr-2 hidden md:inline">
              Booking State:
            </span>
            {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold tracking-wider transition-all ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-400">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sort:</span>
            <button
              onClick={() => toggleSort('createdAt')}
              className={`px-3 py-1 rounded-lg border text-[11px] flex items-center gap-1 font-semibold ${
                sortField === 'createdAt' ? 'border-amber-400 text-amber-400 bg-amber-400/10' : 'border-slate-800 text-slate-400'
              }`}
            >
              <span>Date</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>

            <button
              onClick={() => toggleSort('student')}
              className={`px-3 py-1 rounded-lg border text-[11px] flex items-center gap-1 font-semibold ${
                sortField === 'student' ? 'border-amber-400 text-amber-400 bg-amber-400/10' : 'border-slate-800 text-slate-400'
              }`}
            >
              <span>Student</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>

      {/* Full Operational Table */}
      <div className="bg-[#070B19] border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs font-light">
            No bookings matching the active filters or search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 uppercase tracking-widest text-[10px] font-bold border-b border-slate-800">
                  <th className="py-4 px-6">Student & Contact</th>
                  <th className="py-4 px-4">Package & Price</th>
                  <th className="py-4 px-4">Slot Date / Timestamps</th>
                  <th className="py-4 px-4">Assigned Instructor</th>
                  <th className="py-4 px-4">Assigned Vehicle</th>
                  <th className="py-4 px-4 text-center">Status Badges</th>
                  <th className="py-4 px-6 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBookings.map((b) => {
                  const phoneClean = cleanPhoneForWa(b.student?.phone);
                  const firstSessionSlot = b.sessions && b.sessions.length > 0 ? b.sessions[0].scheduledAt : null;
                  const completedSessions = (b.sessions || []).filter((s: any) => s.status === 'COMPLETED').length;

                  return (
                    <tr key={b.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* 1. Student & Contact */}
                      <td className="py-4 px-6 align-top">
                        <div className="space-y-1">
                          <h4 className="font-serif text-base text-slate-100 font-normal">{b.student?.name}</h4>
                          <div className="flex items-center gap-2">
                            {b.student?.phone ? (
                              <>
                                <a
                                  href={`tel:${b.student.phone}`}
                                  className="text-[11px] font-mono text-amber-400 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{b.student.phone}</span>
                                </a>
                                <a
                                  href={`https://wa.me/${phoneClean}?text=Hello%20${encodeURIComponent(
                                    b.student.name
                                  )},%20this%20is%20Vahathi%20Motor%20Driving%20School%20regarding%20your%20${encodeURIComponent(
                                    b.package?.name || 'booking'
                                  )}.`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 transition"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">No phone</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">ID: {b.id.slice(-8)}</p>
                        </div>
                      </td>

                      {/* 2. Package & Price */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-200">{b.package?.name}</p>
                          <p className="font-serif text-sm text-amber-400">₹{b.totalAmount.toLocaleString()}</p>
                          <p className="text-[10px] text-emerald-400 font-medium">
                            {completedSessions} / {b.package?.sessionsCount || 10} Sessions Done
                          </p>
                        </div>
                      </td>

                      {/* 3. Slot Date / Timestamps */}
                      <td className="py-4 px-4 align-top text-[11px] space-y-1">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Slot Time:</span>
                          {firstSessionSlot ? (
                            <span className="text-slate-200 font-medium">{formatDate(firstSessionSlot)}</span>
                          ) : (
                            <span className="text-slate-400 italic">Not Scheduled</span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Booked:</span>
                          <span className="text-slate-400">{formatDate(b.createdAt)}</span>
                        </div>
                        {b.paidAt && (
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Paid At:</span>
                            <span className="text-emerald-400">{formatDate(b.paidAt)}</span>
                          </div>
                        )}
                        {b.razorpayPaymentId && (
                          <p className="text-[9.5px] font-mono text-slate-500 pt-1">
                            PayID: {b.razorpayPaymentId}
                          </p>
                        )}
                      </td>

                      {/* 4. Assigned Instructor */}
                      <td className="py-4 px-4 align-top">
                        <select
                          value={b.instructorId || ''}
                          onChange={(e) => handleUpdateAssignment(b.id, { instructorId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-xl outline-none text-xs font-medium"
                        >
                          <option value="">-- Unassigned --</option>
                          {allInstructors.map((inst) => (
                            <option key={inst.id} value={inst.id}>
                              {inst.name} (★{inst.rating})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 5. Assigned Vehicle */}
                      <td className="py-4 px-4 align-top">
                        <select
                          value={b.vehicleId || ''}
                          onChange={(e) => handleUpdateAssignment(b.id, { vehicleId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-xl outline-none text-xs font-medium"
                        >
                          <option value="">-- Unassigned --</option>
                          {allVehicles.map((veh) => (
                            <option key={veh.id} value={veh.id}>
                              {veh.name} ({veh.plateNumber})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 6. Status Badges */}
                      <td className="py-4 px-4 align-top text-center space-y-2">
                        <div>
                          <select
                            value={b.status}
                            onChange={(e) => handleUpdateAssignment(b.id, { status: e.target.value as any })}
                            className={`w-full bg-slate-950 border text-center p-1.5 rounded-xl outline-none text-[10px] font-extrabold uppercase ${
                              b.status === 'CONFIRMED'
                                ? 'border-emerald-500/40 text-emerald-400'
                                : b.status === 'COMPLETED'
                                ? 'border-sky-500/40 text-sky-400'
                                : b.status === 'CANCELLED'
                                ? 'border-rose-500/40 text-rose-400'
                                : 'border-amber-500/40 text-amber-400'
                            }`}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </div>

                        <div>
                          <select
                            value={b.paymentStatus}
                            onChange={(e) => handleUpdateAssignment(b.id, { paymentStatus: e.target.value as any })}
                            className={`w-full bg-slate-950 border text-center p-1.5 rounded-xl outline-none text-[10px] font-extrabold uppercase ${
                              b.paymentStatus === 'PAID'
                                ? 'border-emerald-500/40 text-emerald-300'
                                : b.paymentStatus === 'REFUNDED'
                                ? 'border-purple-500/40 text-purple-300'
                                : b.paymentStatus === 'FAILED'
                                ? 'border-rose-500/40 text-rose-300'
                                : 'border-amber-500/40 text-amber-300'
                            }`}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="PAID">PAID</option>
                            <option value="REFUNDED">REFUNDED</option>
                            <option value="FAILED">FAILED</option>
                          </select>
                        </div>
                      </td>

                      {/* 7. Operational Quick Actions */}
                      <td className="py-4 px-6 align-top text-right space-y-2">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            disabled={loadingId === b.id}
                            onClick={() => handleMarkSessionComplete(b.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 shadow-md shadow-emerald-500/10 transition"
                            title="Mark Next Practical Driving Session Completed"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>+1 Session</span>
                          </button>

                          <button
                            type="button"
                            disabled={loadingId === b.id || completedSessions === 0}
                            onClick={() => handleRemoveSession(b.id)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold px-2 py-1.5 rounded-lg text-[11px] flex items-center gap-1 transition disabled:opacity-30"
                            title="Undo Last Completed Session"
                          >
                            <MinusCircle className="w-3 h-3" />
                            <span>-1 Undo</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            disabled={loadingId === b.id}
                            onClick={() => handleMarkNoShow(b.id)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg text-[10px] font-semibold transition"
                          >
                            No-Show
                          </button>

                          {b.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              disabled={loadingId === b.id}
                              onClick={() => setCancelModalBooking(b)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-1 rounded-lg text-[10px] font-semibold transition"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation Reason Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Cancel Booking for {cancelModalBooking.student?.name}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Please enter an official reason for cancelling this booking (required for audit logging).
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Student requested reschedule, medical emergency, vehicle unavailable..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl text-xs outline-none focus:border-amber-400 h-24"
                required
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loadingId === cancelModalBooking.id}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {loadingId === cancelModalBooking.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Confirm Cancellation</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
