'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, X, Send, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processAIChatAction, AIMessage, AIOption, AIPackageCard } from '@/actions/aiAssistant';

// ─── ARCHITECTURAL BOUNDARY ────────────────────────────────────────────────────
// AIChatWidget is a CONCIERGE / DISCOVERY layer only.
//
// It must NEVER:
//   • Import or call useRazorpayCheckout
//   • Import or call createBookingTransactionAction / createRazorpayOrderAction
//   • Render payment form UI (card number, UPI, OTP fields)
//   • Directly lock a slot or create a booking record
//   • Render a "Pay Now" button that processes money
//
// When the user is ready to book:
//   DriveAI returns a BOOKING_HANDOFF cardData → widget navigates to /book?package=<id>
//   The existing BookingWizard handles everything from there.
// ───────────────────────────────────────────────────────────────────────────────

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Duplicate-click protection for the booking navigation handoff (spec §26)
  const [navigatingToBook, setNavigatingToBook] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isBookingPage = pathname?.startsWith('/book');

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your DriveAI Assistant. How can I help you today?',
      options: [
        { label: '📦 Browse Packages', value: 'Show packages' },
        { label: '📅 Check Open Slots', value: 'Check available slots' },
        { label: '📜 RTO License Docs', value: 'What documents do I need' },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Escape key close listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-scroll to bottom ONLY when a new message is appended or loading begins
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current || loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, loading]);

  // ─── BOOKING HANDOFF AUTO-NAVIGATION ──────────────────────────────────────
  // When the server returns a BOOKING_HANDOFF card, the user has confirmed
  // their package choice. We allow the user to click "Continue to Booking"
  // immediately, OR auto-navigate after a 2-second delay so they can read
  // the message.
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant' && lastMsg?.cardData?.type === 'BOOKING_HANDOFF') {
      const pkgId = lastMsg.cardData.packageId as string | undefined;
      if (pkgId && !navigatingToBook) {
        const timer = setTimeout(() => {
          handleNavigateToBooking(pkgId);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: AIMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    const res = await processAIChatAction(text, messages);
    setLoading(false);

    if (res.success) {
      const botMsg: AIMessage = {
        role: 'assistant',
        content: res.message || '',
        options: res.options,
        packageCards: res.packageCards,
        cardData: res.cardData,
      };
      setMessages((prev) => [...prev, botMsg]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm not fully sure on that request — let me connect you with our team! You can reach us directly at +91 7829780778 or support@drivesuccess.edu.",
        },
      ]);
    }
  };

  // Navigate to /book with the AI-selected package context.
  // Idempotent: duplicate taps are blocked by navigatingToBook state (spec §26).
  const handleNavigateToBooking = (packageId: string) => {
    if (navigatingToBook) return;

    if (!packageId || packageId === 'undefined' || packageId === 'null' || !packageId.trim()) {
      console.error('[DriveAI] Missing/invalid package ID:', packageId);
      return;
    }

    setNavigatingToBook(true);

    const destination = `/book?package=${encodeURIComponent(packageId)}`;

    console.log('[DriveAI] booking handoff packageId:', packageId);
    console.log('[DriveAI] navigating to:', destination);

    // Close the chat widget drawer so it doesn't block the screen
    setIsOpen(false);

    try {
      router.push(destination);
    } catch (err) {
      console.error('[DriveAI] Navigation error:', err);
    }

    // Safety timeout: reset navigatingToBook state after 4s so UI is never stuck
    setTimeout(() => {
      setNavigatingToBook(false);
    }, 4000);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${isBookingPage ? 'bottom-28 sm:bottom-6' : 'bottom-6'} right-4 sm:right-6 z-50 bg-[#384633] text-white p-4 rounded-full shadow-2xl hover:bg-[#2B3B2B] hover:scale-105 transition-all flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#384633]/30 cursor-pointer border border-white/20`}
        aria-label="Toggle DriveAI Assistant chat"
      >
        <Sparkles className="w-5 h-5 text-white animate-pulse" />
        <span className="font-sans font-bold text-xs uppercase tracking-wider hidden sm:inline pr-1">
          DriveAI Assistant
        </span>
      </button>

      {/* Chat Window Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed ${isBookingPage ? 'bottom-[120px] sm:bottom-24' : 'bottom-24'} right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[560px] max-h-[80vh] bg-[#F4F0E8] border border-[#384633]/20 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden overscroll-contain`}
          >
            {/* Header */}
            <div className="bg-[#E7E1D6] border-b border-[#384633]/15 p-4 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white border border-[#384633]/20 text-[#384633] rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#384633]">
                    DriveAI Assistant
                  </h3>
                  <p className="text-[11px] text-[#7E8466] font-light">
                    Here to help with bookings, pricing, and questions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#7E8466] hover:text-[#384633] p-2 rounded-full hover:bg-white/60 transition cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Continuous Touch & Wheel Scrollable Messages Container (with Lenis Exception) */}
            <div
              data-lenis-prevent
              className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 touch-pan-y overscroll-contain"
              style={{
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch',
              }}
              onWheel={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-2.5`}
                >
                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white font-semibold rounded-br-none shadow-md'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>
                  </div>

                  {/* Interactive Tappable Option Chips (WhatsApp/Instagram Style) */}
                  {m.options && m.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 max-w-[95%]">
                      {m.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={idx < messages.length - 1 || loading}
                          onClick={() => handleSendMessage(opt.value)}
                          className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all shadow-md flex items-center gap-1.5 border ${
                            idx < messages.length - 1
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                              : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95 cursor-pointer'
                          }`}
                        >
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Mini Product Package Cards */}
                  {m.packageCards && m.packageCards.length > 0 && (
                    <div className="w-full space-y-2.5 pt-1">
                      {m.packageCards.map((pkg, pIdx) => (
                        <div
                          key={pIdx}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-card hover:border-blue-300 transition"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-heading font-bold text-xs text-slate-900">{pkg.name}</h4>
                              <p className="text-[11px] text-slate-500 font-light mt-0.5">
                                {pkg.description || `${pkg.sessionsCount} Practical Driving Sessions`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm font-extrabold text-blue-600 font-mono">₹{pkg.price.toLocaleString()}</span>
                              {pkg.badge && (
                                <span className="block text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-300 text-center mt-1 font-semibold">
                                  {pkg.badge}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={idx < messages.length - 1 || loading}
                            onClick={() => handleSendMessage(`Select ${pkg.name}`)}
                            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
                              idx < messages.length - 1
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/15 active:scale-98 cursor-pointer'
                            }`}
                          >
                            <span>Select This Package</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Slots Reference Card ────────────────────────────────────────────
                      IMPORTANT (spec §9 / §17): This card is for DISCOVERY ONLY.
                      Individual slots are displayed as non-clickable reference labels.
                      Clicking a slot does NOT create a booking inside the chat.
                      The "View Live Availability" button navigates to /book where the
                      authoritative slot availability check is performed.
                  ─────────────────────────────────────────────────────────────────── */}
                  {m.cardData && m.cardData.type === 'SLOTS_AVAILABLE' && (
                    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-card">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-blue-600">{m.cardData.packageName}</span>
                        <span className="text-slate-500">{m.cardData.date}</span>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Instructor: <strong className="text-slate-700">{m.cardData.instructorName}</strong> • Vehicle: <strong className="text-slate-700">{m.cardData.vehicleName}</strong>
                      </p>

                      {/* Reference-only slot display — not clickable booking buttons */}
                      {m.cardData.availableSlots && m.cardData.availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {m.cardData.availableSlots.map((slot: string, sIdx: number) => (
                            <div
                              key={sIdx}
                              className="bg-slate-50 border border-slate-200 text-slate-600 text-xs py-2 px-3 rounded-xl font-semibold flex items-center justify-center select-none"
                              aria-label={`Reference slot time: ${slot}`}
                            >
                              {slot}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">No open slots found for this date. Try another date in the booking wizard.</p>
                      )}

                      {/* Disclaimer — spec §9: must not claim slot availability without live check */}
                      <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 leading-relaxed">
                        ⚠️ Slot times shown for planning reference only. Live availability is confirmed in the booking wizard.
                      </p>

                      {/* Navigate to /book for authoritative slot selection */}
                      <button
                        type="button"
                        disabled={idx < messages.length - 1 || loading}
                        onClick={() => router.push('/book')}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
                          idx < messages.length - 1
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/15 cursor-pointer'
                        }`}
                        aria-label="Open booking page to see live slot availability"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Live Availability →</span>
                      </button>
                    </div>
                  )}

                  {/* ── Booking Handoff Card ────────────────────────────────────────────
                      Shown when the user confirms a package selection.
                      This card does NOT create a booking or payment.
                      Clicking "Continue to Booking" navigates to /book?package=<id>.
                      The existing BookingWizard handles all booking/payment from there.
                  ─────────────────────────────────────────────────────────────────── */}
                  {m.cardData && m.cardData.type === 'BOOKING_HANDOFF' && (
                    <div className="w-full bg-gradient-to-br from-blue-50 to-white border border-blue-300 rounded-2xl p-4 space-y-3 shadow-card">
                      {/* Package summary */}
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">Selected Package</p>
                        <h4 className="font-heading font-bold text-sm text-slate-900">{m.cardData.packageName}</h4>
                        {m.cardData.price && (
                          <p className="text-xs text-slate-600 font-mono font-bold">₹{(m.cardData.price as number).toLocaleString()}</p>
                        )}
                      </div>

                      {/* Loading/redirect indicator */}
                      {navigatingToBook && (
                        <div className="flex items-center gap-2 text-[11px] text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                          <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>Opening your booking options…</span>
                        </div>
                      )}

                      {/* Primary CTA — navigate to booking wizard */}
                      <button
                        type="button"
                        id={`booking-handoff-btn-${idx}`}
                        disabled={navigatingToBook}
                        onClick={() => handleNavigateToBooking(m.cardData.packageId as string)}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                          navigatingToBook
                            ? 'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-98 cursor-pointer'
                        }`}
                        aria-label="Continue to booking wizard"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{navigatingToBook ? 'Redirecting…' : '✓ Continue to Booking'}</span>
                      </button>

                      {/* Secondary CTA — go back to package list */}
                      <button
                        type="button"
                        disabled={navigatingToBook || idx < messages.length - 1 || loading}
                        onClick={() => handleSendMessage('Show packages')}
                        className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition border border-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Choose a different package"
                      >
                        × Choose Another Package
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl rounded-bl-none w-fit text-slate-500 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 font-sans">Fetching options...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message or tap an option above..."
                className="flex-1 bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-4 py-2.5 rounded-xl text-xs outline-none transition font-sans"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl disabled:opacity-50 transition focus:outline-none cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
