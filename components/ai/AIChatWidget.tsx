'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, X, Send, Sparkles, CheckCircle2, CreditCard, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processAIChatAction, AIMessage } from '@/actions/aiAssistant';
import Link from 'next/link';

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your DriveAI Assistant. How can I help you today with course packages, open session slots, or booking details?',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 p-4 rounded-full shadow-2xl shadow-amber-500/30 hover:scale-105 transition-all flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
        aria-label="Toggle DriveAI Assistant chat"
      >
        <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
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
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[560px] max-h-[80vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden overscroll-contain"
          >
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800/80 p-4 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-100">
                    DriveAI Assistant
                  </h3>
                  <p className="text-[11px] text-slate-400 font-light">
                    Here to help with bookings, pricing, and questions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-2 rounded-full hover:bg-slate-800/60 transition"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Touch-optimized Scrollable Messages Container (Fixes Issue 1) */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 touch-pan-y overscroll-contain"
              style={{
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
                >
                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-amber-500 text-slate-950 font-semibold rounded-br-none shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>
                  </div>

                  {/* Interactive Slots Card */}
                  {m.cardData && m.cardData.type === 'SLOTS_AVAILABLE' && (
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-amber-400">{m.cardData.packageName}</span>
                        <span className="text-slate-400">{m.cardData.date}</span>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Instructor: <strong className="text-slate-200">{m.cardData.instructorName}</strong> • Vehicle: <strong className="text-slate-200">{m.cardData.vehicleName}</strong>
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {m.cardData.availableSlots.map((slot: string, sIdx: number) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(`Book ${m.cardData.packageName} for ${m.cardData.date} at ${slot}`)}
                            className="bg-slate-950 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-800 text-xs py-2 px-3 rounded-xl font-semibold transition flex items-center justify-between"
                          >
                            <span>{slot}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Booking Confirmation Card */}
                  {m.cardData && m.cardData.type === 'BOOKING_CREATED' && (
                    <div className="w-full bg-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Session Reservation Created</span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 font-sans">
                        <p><strong className="text-slate-400">Booking ID:</strong> <span className="font-mono text-amber-400">{m.cardData.bookingId.slice(-8)}</span></p>
                        <p><strong className="text-slate-400">Program:</strong> {m.cardData.packageName}</p>
                        <p><strong className="text-slate-400">Fee:</strong> <span className="text-amber-400 font-bold">₹{m.cardData.amount}</span></p>
                        <p><strong className="text-slate-400">Schedule:</strong> {m.cardData.date} at {m.cardData.timeSlot}</p>
                      </div>

                      <Link
                        href={m.cardData.paymentUrl}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Proceed to Secure Checkout →</span>
                      </Link>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-bl-none w-fit text-slate-400 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 font-sans">Checking options & database...</span>
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
              className="p-3 bg-slate-900 border-t border-slate-800/80 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about courses, pricing, or open slots..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 px-4 py-2.5 rounded-xl text-xs outline-none transition font-sans"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-2.5 rounded-xl disabled:opacity-50 transition focus:outline-none"
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
