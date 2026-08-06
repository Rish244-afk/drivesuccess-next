'use client';

import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    razorpayOrderId?: string | null;
    totalAmount: number;
    paymentStatus: string;
    paidAt?: string | Date | null;
    createdAt?: string | Date;
    package?: {
      name: string;
      sessionsCount?: number;
    } | null;
    student?: {
      name: string;
      email?: string | null;
      phone?: string | null;
    } | null;
  } | null;
}

export function InvoiceModal({ isOpen, onClose, booking }: InvoiceModalProps) {
  if (!isOpen || !booking) return null;

  const invoiceDate = booking.paidAt || booking.createdAt || new Date();
  const formattedDate = new Date(invoiceDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="font-serif text-xl font-normal">Official Payment Invoice</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Printable Content */}
        <div className="p-8 space-y-6 overflow-y-auto print:p-0">
          {/* Academy Branding Header */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-6">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-slate-900">
                DriveSuccess Academy
              </h2>
              <p className="text-xs text-slate-500 font-light mt-0.5">
                Licensed Motor Driving Institute & RTO Training Portal
              </p>
              <p className="text-xs text-slate-400 mt-1">GSTIN: 29AAAAA0000A1Z5</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Invoice No
              </span>
              <span className="font-mono text-sm font-bold text-slate-900">
                INV-{booking.id.slice(-8).toUpperCase()}
              </span>
              <span className="text-xs text-slate-500 block mt-1">{formattedDate}</span>
            </div>
          </div>

          {/* Student & Payment Info */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Billed To
              </span>
              <p className="font-medium text-slate-900 text-sm">{booking.student?.name || 'Student'}</p>
              {booking.student?.email && <p className="text-slate-600">{booking.student.email}</p>}
              {booking.student?.phone && <p className="text-slate-600">{booking.student.phone}</p>}
            </div>

            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Payment Reference
              </span>
              <p className="text-slate-600 font-mono">
                Order ID: {booking.razorpayOrderId || 'N/A'}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mt-2">
                <CheckCircle2 className="w-3 h-3" />
                {booking.paymentStatus}
              </span>
            </div>
          </div>

          {/* Line Item Table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider text-left">
                <th className="py-2.5">Description</th>
                <th className="py-2.5 text-center">Sessions</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              <tr>
                <td className="py-3 font-medium text-slate-800">
                  {booking.package?.name || 'Driving Package'}
                </td>
                <td className="py-3 text-center text-slate-600">
                  {booking.package?.sessionsCount || 10} Sessions
                </td>
                <td className="py-3 text-right font-serif text-base text-slate-900">
                  ₹{booking.totalAmount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Summary Total */}
          <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
            <span className="text-xs text-slate-500">Includes all applicable RTO taxes & fees</span>
            <div className="text-right">
              <span className="text-xs text-slate-500 block font-medium">Total Paid</span>
              <span className="font-serif text-2xl font-bold text-blue-600">
                ₹{booking.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold px-5 py-2.5 rounded-full text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-full text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
