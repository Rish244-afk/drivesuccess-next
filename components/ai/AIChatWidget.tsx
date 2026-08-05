'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, X, Send, Sparkles, CheckCircle2, CreditCard, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processAIChatAction, AIMessage, AIOption, AIPackageCard } from '@/actions/aiAssistant';
import { AuthModal } from '@/components/auth/AuthModal';
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout';

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingPaymentUrl, setPendingPaymentUrl] = useState<string | null>(null);
  const [checkoutBookingId, setCheckoutBookingId] = useState<string | null>(null);
  const { launchRazorpayCheckout } = useRazorpayCheckout();

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
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
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

  // Intercept Proceed to Checkout to check authentication first
  const handleProceedToCheckout = async (e: React.MouseEvent, paymentUrl: string, bookingId: string) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        // Already authenticated! Launch Razorpay directly over chat widget
        await launchRazorpayCheckout(bookingId, {
          onLoading: setLoading,
          onSuccess: (msg) => {
            setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
          },
          onError: (err) => {
            setMessages((prev) => [...prev, { role: 'assistant', content: `Payment issue: ${err}` }]);
          },
        });
      } else {
        // Unauthenticated! Prompt Auth Modal first
        setPendingPaymentUrl(paymentUrl);
        setCheckoutBookingId(bookingId);
        setIsAuthModalOpen(true);
      }
    } catch {
      setPendingPaymentUrl(paymentUrl);
      setCheckoutBookingId(bookingId);
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    // If they were trying to checkout a previously created booking
    if (checkoutBookingId) {
      launchRazorpayCheckout(checkoutBookingId, {
        onLoading: setLoading,
        onSuccess: (msg) => {
          setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
        },
        onError: (err) => {
          setMessages((prev) => [...prev, { role: 'assistant', content: `Payment issue: ${err}` }]);
        },
      });
      setCheckoutBookingId(null);
      setPendingPaymentUrl(null);
    } else {
      // Just logged in mid-flow (e.g. AUTH_REQUIRED prompt)
      // Auto-trigger "Yes proceed" to resume the booking
      handleSendMessage('Yes proceed');
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-full shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
        aria-label="Toggle DriveAI Assistant chat"
      >
        <Sparkles className="w-5 h-5 text-white animate-pulse" />
        <span className="font-sans font-bold text-xs uppercase tracking-wider hidden sm:inline pr-1">
          DriveAI Assistant
        </span>
      </button>

      {/* Auth Modal for Login Handoff */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        redirectToDashboard={false}
      />

      {/* Chat Window Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[560px] max-h-[80vh] bg-white border border-slate-200 rounded-3xl shadow-hover flex flex-col overflow-hidden overscroll-contain"
          >
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 border border-blue-300 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900">
                    DriveAI Assistant
                  </h3>
                  <p className="text-[11px] text-slate-500 font-light">
                    Here to help with bookings, pricing, and questions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
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

                  {/* Interactive Slots Card */}
                  {m.cardData && m.cardData.type === 'SLOTS_AVAILABLE' && (
                    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-card">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-blue-600">{m.cardData.packageName}</span>
                        <span className="text-slate-500">{m.cardData.date}</span>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Instructor: <strong className="text-slate-700">{m.cardData.instructorName}</strong> • Vehicle: <strong className="text-slate-700">{m.cardData.vehicleName}</strong>
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {m.cardData.availableSlots.map((slot: string, sIdx: number) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(`Book ${m.cardData.packageName} for ${m.cardData.date} at ${slot}`)}
                            className="bg-white hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200 text-xs py-2 px-3 rounded-xl font-semibold transition flex items-center justify-between cursor-pointer"
                          >
                            <span>{slot}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Booking Confirmation Card */}
                  {m.cardData && m.cardData.type === 'AUTH_REQUIRED' && (
                    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-card">
                      <button
                        type="button"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-blue-600/15 transition cursor-pointer"
                      >
                        <span>Sign In to Continue →</span>
                      </button>
                    </div>
                  )}

                  {/* Interactive Booking Confirmation Card */}
                  {m.cardData && m.cardData.type === 'BOOKING_CREATED' && (
                    <div className="w-full bg-white border border-blue-300 rounded-2xl p-4 space-y-3 shadow-card">
                      <div className="flex items-center gap-2 text-blue-600 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Session Reservation Created</span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 font-sans">
                        <p><strong className="text-slate-500">Booking ID:</strong> <span className="font-mono text-blue-600">{m.cardData.bookingId.slice(-8)}</span></p>
                        <p><strong className="text-slate-500">Program:</strong> {m.cardData.packageName}</p>
                        <p><strong className="text-slate-500">Fee:</strong> <span className="text-blue-600 font-bold">₹{m.cardData.amount}</span></p>
                        <p><strong className="text-slate-500">Schedule:</strong> {m.cardData.date} at {m.cardData.timeSlot}</p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleProceedToCheckout(e, m.cardData.paymentUrl, m.cardData.bookingId)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-blue-600/15 transition cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Proceed to Secure Checkout →</span>
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
