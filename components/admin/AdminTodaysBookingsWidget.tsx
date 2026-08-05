'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Car,
  CreditCard,
  Calendar,
  ArrowRight,
  RefreshCw,
  MinusCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  updateBookingAssignmentAction,
  markSessionCompleteAction,
  markBookingNoShowAction,
  cancelBookingWithReasonAction,
} from '@/actions/admin';

interface AdminTodaysBookingsWidgetProps {
  initialBookings: any[];
  allInstructors: any[];
  allVehicles: any[];
  todaysBookingsCount: number;
}

export function AdminTodaysBookingsWidget({
  initialBookings,
  allInstructors,
  allVehicles,
  todaysBookingsCount,
}: AdminTodaysBookingsWidgetProps) {
  const [bookings, setBookings] = useState<any[]>(initialBookings);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
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
      alert(res.error || 'Failed to update booking.');
    }
  };

  const handleMarkComplete = async (bookingId: string) => {
    setLoadingId(bookingId);
    setMessage(null);
    const res = await markSessionCompleteAction(bookingId);
    setLoadingId(null);
    if (res.success) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: 'COMPLETED', sessions: [...(b.sessions || []), { id: Date.now(), status: 'COMPLETED' }] }
            : b
        )
      );
      setMessage(res.message || 'Session marked completed!');
      setTimeout(() => setMessage(null), 3000);
    } else {
      alert(res.error || 'Failed to complete session.');
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
      setMessage('Booking cancelled.');
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
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-serif text-2xl text-slate-900 font-normal">Today&apos;s Scheduled Bookings</h2>
          <p className="text-xs text-slate-400 font-light mt-0.5">{todaysBookingsCount} bookings active today</p>
        </div>

        <Link
          href="/admin/bookings"
          className="text-xs font-semibold uppercase tracking-widest text-blue-600 hover:underline flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>View Full Ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-400 font-light">
          No new bookings recorded today.
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60 bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
          {bookings.map((b) => {
            const isExpanded = expandedId === b.id;
            const phoneClean = cleanPhoneForWa(b.student?.phone);
            const firstSessionSlot = b.sessions && b.sessions.length > 0 ? b.sessions[0].scheduledAt : null;

            return (
              <div key={b.id} className="transition-colors hover:bg-white/40">
                {/* Summary Row */}
                <div
                  onClick={() => toggleExpand(b.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs cursor-pointer select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-lg text-slate-900 font-normal">{b.student?.name}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">({b.student?.phone || 'No Phone'})</span>
                    </div>
                    <p className="text-slate-400 font-light">
                      Package: <strong className="text-slate-700 font-medium">{b.package?.name}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <span className="font-serif text-lg text-blue-600 font-normal">
                      ₹{b.totalAmount.toLocaleString()}
                    </span>

                    {/* Distinct Booking Status Badge */}
                    <span
                      className={`text-[9.5px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full border ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-400 border-emerald-300'
                          : b.status === 'COMPLETED'
                          ? 'bg-sky-50 text-sky-400 border-sky-200'
                          : b.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-400 border-rose-300'
                          : 'bg-blue-50 text-blue-600 border-blue-300'
                      }`}
                    >
                      Booking: {b.status}
                    </span>

                    {/* Distinct Payment Status Badge */}
                    <span
                      className={`text-[9.5px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full border ${
                        b.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-300 border-emerald-300'
                          : b.paymentStatus === 'REFUNDED'
                          ? 'bg-purple-50 text-purple-300 border-purple-300'
                          : b.paymentStatus === 'FAILED'
                          ? 'bg-rose-100 text-rose-300 border-rose-300'
                          : 'bg-blue-100 text-blue-500 border-blue-400'
                      }`}
                    >
                      Payment: {b.paymentStatus}
                    </span>

                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100/80 transition"
                      aria-label="Toggle Details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Operational Detail Accordion */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-5 pb-6 pt-2 border-t border-slate-200/40 bg-white/10 space-y-5"
                    >
                      {/* Grid of Operational Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs border-b border-slate-200/80 pb-5">
                        
                        {/* 1. Timestamps */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Operational Timestamps</span>
                          </h4>
                          <ul className="space-y-1.5 text-slate-600">
                            <li>
                              <span className="text-slate-400">Booked At:</span> {formatDate(b.createdAt)}
                            </li>
                            <li>
                              <span className="text-slate-400">Payment Confirmed:</span>{' '}
                              {b.paidAt ? (
                                <strong className="text-emerald-400 font-medium">{formatDate(b.paidAt)}</strong>
                              ) : (
                                <span className="text-blue-600 font-medium">Pending Payment</span>
                              )}
                            </li>
                            <li>
                              <span className="text-slate-400">Scheduled Slot:</span>{' '}
                              {firstSessionSlot ? (
                                <strong className="text-slate-700">{formatDate(firstSessionSlot)}</strong>
                              ) : (
                                <span className="text-slate-400 italic">Not Scheduled Yet</span>
                              )}
                            </li>
                          </ul>
                        </div>

                        {/* 2. Assignment Info */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>Resource Assignment</span>
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">Instructor</label>
                              <select
                                value={b.instructorId || ''}
                                onChange={(e) => handleUpdateAssignment(b.id, { instructorId: e.target.value })}
                                className="w-full bg-white border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg outline-none text-xs"
                              >
                                <option value="">-- Unassigned --</option>
                                {allInstructors.map((inst) => (
                                  <option key={inst.id} value={inst.id}>
                                    {inst.name} (★{inst.rating})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">Vehicle</label>
                              <select
                                value={b.vehicleId || ''}
                                onChange={(e) => handleUpdateAssignment(b.id, { vehicleId: e.target.value })}
                                className="w-full bg-white border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg outline-none text-xs"
                              >
                                <option value="">-- Unassigned --</option>
                                {allVehicles.map((veh) => (
                                  <option key={veh.id} value={veh.id}>
                                    {veh.name} ({veh.plateNumber})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* 3. Payment ID & Contact Shortcuts */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Razorpay Reference</span>
                            </h4>
                            <p className="text-[11px] font-mono text-slate-400 break-all bg-white/90 p-2 rounded-lg border border-slate-200">
                              Payment ID: {b.razorpayPaymentId || b.razorpayOrderId || 'N/A (Pending)'}
                            </p>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                              Student Contact Shortcuts
                            </h4>
                            <div className="flex gap-2">
                              {b.student?.phone ? (
                                <>
                                  <a
                                    href={`tel:${b.student.phone}`}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-300 rounded-lg text-[11px] font-semibold hover:bg-blue-100 transition flex items-center gap-1.5"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>Call</span>
                                  </a>
                                  <a
                                    href={`https://wa.me/${phoneClean}?text=Hello%20${encodeURIComponent(
                                      b.student.name
                                    )},%20this%20is%20Vahathi%20Motor%20Driving%20School%20regarding%20your%20${encodeURIComponent(
                                      b.package?.name || 'booking'
                                    )}.`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-400 border border-emerald-300 rounded-lg text-[11px] font-semibold hover:bg-emerald-100 transition flex items-center gap-1.5"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    <span>WhatsApp</span>
                                  </a>
                                </>
                              ) : (
                                <span className="text-slate-400 italic">No phone number on record</span>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Quick Actions Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick Actions:</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {b.status !== 'CONFIRMED' && (
                            <button
                              type="button"
                              disabled={loadingId === b.id}
                              onClick={() => handleUpdateAssignment(b.id, { status: 'CONFIRMED' })}
                              className="px-3 py-1.5 bg-emerald-100 text-emerald-300 border border-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Booking</span>
                            </button>
                          )}

                          {b.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              disabled={loadingId === b.id}
                              onClick={() => handleMarkComplete(b.id)}
                              className="px-3 py-1.5 bg-sky-100 text-sky-300 border border-sky-300 rounded-lg text-xs font-semibold hover:bg-sky-100 transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Completed</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={loadingId === b.id}
                            onClick={() => handleMarkNoShow(b.id)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-500 border border-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Mark No-Show</span>
                          </button>

                          {b.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              disabled={loadingId === b.id}
                              onClick={() => setCancelModalBooking(b)}
                              className="px-3 py-1.5 bg-rose-100 text-rose-300 border border-rose-300 rounded-lg text-xs font-semibold hover:bg-rose-100 transition flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel Booking</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-white/10 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-hover"
          >
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
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
                className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl text-xs outline-none focus:border-blue-500 h-24"
                required
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
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
