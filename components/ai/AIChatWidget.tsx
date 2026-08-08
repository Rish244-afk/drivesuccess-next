'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, X, Send, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processAIChatAction, AIMessage, AIOption, AIPackageCard } from '@/actions/aiAssistant';

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [navigatingToBook, setNavigatingToBook] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isBookingPage = pathname?.startsWith('/book');

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your DriveAI Assistant. How can I help you today?',
      options: [
        { label: 'Browse Packages', value: 'Show packages' },
        { label: 'Check Open Slots', value: 'Check available slots' },
        { label: 'RTO License Docs', value: 'What documents do I need' },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current || loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, loading]);

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
      // Strip emojis from server options if any
      const cleanedOptions = res.options?.map((opt) => ({
        ...opt,
        label: opt.label.replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/g, '').trim(),
      }));

      const botMsg: AIMessage = {
        role: 'assistant',
        content: (res.message || '').replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/g, '').trim(),
        options: cleanedOptions,
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

  const handleNavigateToBooking = (packageId: string) => {
    if (navigatingToBook) return;

    if (!packageId || packageId === 'undefined' || packageId === 'null' || !packageId.trim()) {
      return;
    }

    setNavigatingToBook(true);
    const destination = `/book?package=${encodeURIComponent(packageId)}`;
    setIsOpen(false);

    try {
      router.push(destination);
    } catch (err) {
      console.error('[DriveAI] Navigation error:', err);
    }

    setTimeout(() => {
      setNavigatingToBook(false);
    }, 4000);
  };

  if (isBookingPage) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-[#384633] hover:bg-[#2B3B2B] text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 cursor-pointer"
        aria-label="Open DriveAI Assistant"
      >
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <span className="font-serif font-bold text-xs uppercase tracking-wider">DRIVEAI ASSISTANT</span>
      </button>

      {/* Slide-Up Popover Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-full max-w-[380px] h-[520px] bg-[#F4F0E8] border border-[#384633]/20 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden font-sans text-[#384633]"
          >
            {/* Header */}
            <div className="p-4 bg-[#E7E1D6] border-b border-[#384633]/15 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#384633] text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-sm text-[#384633]">DriveAI Assistant</h3>
                  <p className="text-[10px] text-[#7E8466]">Here to help with bookings, pricing, and questions</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#7E8466] hover:text-[#384633] p-1.5 rounded-full transition cursor-pointer"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col space-y-2 ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#384633] text-white rounded-br-none shadow-xs font-medium'
                        : 'bg-white text-[#384633] border border-[#384633]/10 rounded-bl-none shadow-xs font-light'
                    }`}
                  >
                    {m.content}
                  </div>

                  {/* Option Chips (No Emojis, Sage Green Styling) */}
                  {m.options && m.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 max-w-[90%]">
                      {m.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          disabled={idx < messages.length - 1 || loading}
                          onClick={() => handleSendMessage(opt.value)}
                          className={`text-xs px-3.5 py-1.5 rounded-full transition text-left cursor-pointer border ${
                            idx < messages.length - 1
                              ? 'bg-white/50 text-[#7E8466] border-[#384633]/10 cursor-not-allowed opacity-60'
                              : 'bg-white text-[#384633] border-[#384633]/30 hover:bg-[#384633] hover:text-white font-semibold shadow-xs'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Package Cards */}
                  {m.packageCards && m.packageCards.length > 0 && (
                    <div className="w-full space-y-2 pt-2">
                      {m.packageCards.map((card, cIdx) => (
                        <div
                          key={cIdx}
                          className="bg-white border border-[#384633]/15 rounded-2xl p-4 space-y-2 shadow-xs"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-serif font-bold text-xs text-[#384633]">{card.name}</h4>
                            <span className="font-serif font-normal text-xs text-[#384633] bg-[#E7E1D6] px-2 py-0.5 rounded-full">
                              ₹{card.price.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7E8466] leading-relaxed font-light">{card.description}</p>
                          <div className="flex items-center justify-between text-[10px] text-[#7E8466] pt-1 border-t border-[#384633]/5">
                            <span>{card.sessionsCount} Sessions</span>
                            <button
                              type="button"
                              disabled={idx < messages.length - 1 || loading}
                              onClick={() => handleSendMessage(`Select ${card.name}`)}
                              className="text-[#384633] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Select Package</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Available Slots Reference Card */}
                  {m.cardData && m.cardData.type === 'SLOTS_AVAILABLE' && (
                    <div className="w-full bg-white border border-[#384633]/15 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[#384633]">{m.cardData.packageName}</span>
                        <span className="text-[#7E8466]">{m.cardData.date}</span>
                      </div>

                      <p className="text-[11px] text-[#7E8466]">
                        Instructor: <strong className="text-[#384633]">{m.cardData.instructorName}</strong> • Vehicle: <strong className="text-[#384633]">{m.cardData.vehicleName}</strong>
                      </p>

                      {m.cardData.availableSlots && m.cardData.availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {m.cardData.availableSlots.map((slot: string, sIdx: number) => (
                            <div
                              key={sIdx}
                              className="bg-[#F4F0E8] border border-[#384633]/10 text-[#384633] text-xs py-2 px-3 rounded-xl font-semibold flex items-center justify-center select-none"
                            >
                              {slot}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#7E8466] italic">No open slots found for this date. Try another date in the booking wizard.</p>
                      )}

                      <button
                        type="button"
                        disabled={idx < messages.length - 1 || loading}
                        onClick={() => router.push('/book')}
                        className={`w-full py-2.5 px-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          idx < messages.length - 1
                            ? 'bg-[#E7E1D6] text-[#7E8466] opacity-60'
                            : 'bg-[#384633] hover:bg-[#2B3B2B] text-white shadow-xs'
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Live Availability &rarr;</span>
                      </button>
                    </div>
                  )}

                  {/* Booking Handoff Card */}
                  {m.cardData && m.cardData.type === 'BOOKING_HANDOFF' && (
                    <div className="w-full bg-[#E7E1D6] border border-[#384633]/20 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-semibold text-[#7E8466] uppercase tracking-wider">Selected Package</p>
                        <h4 className="font-serif font-bold text-sm text-[#384633]">{m.cardData.packageName}</h4>
                        {m.cardData.price && (
                          <p className="text-xs text-[#384633] font-mono font-bold">₹{(m.cardData.price as number).toLocaleString()}</p>
                        )}
                      </div>

                      {navigatingToBook && (
                        <div className="flex items-center gap-2 text-[11px] text-[#384633] font-medium bg-white px-3 py-2 rounded-xl border border-[#384633]/20">
                          <span className="w-3 h-3 border-2 border-[#384633] border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>Opening your booking options…</span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={navigatingToBook}
                        onClick={() => handleNavigateToBooking(m.cardData.packageId as string)}
                        className={`w-full py-3 px-4 rounded-full text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                          navigatingToBook
                            ? 'bg-white/50 text-[#7E8466] cursor-not-allowed'
                            : 'bg-[#384633] hover:bg-[#2B3B2B] text-white'
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{navigatingToBook ? 'Redirecting…' : 'Continue to Booking'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 bg-white border border-[#384633]/15 p-3.5 rounded-2xl rounded-bl-none w-fit text-[#7E8466] text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#384633] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#384633] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#384633] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[11px] font-medium text-[#7E8466]">Fetching options...</span>
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
              className="p-3 bg-[#E7E1D6] border-t border-[#384633]/15 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message or tap an option above..."
                className="flex-1 bg-white border border-[#384633]/20 focus:border-[#384633] text-[#384633] px-4 py-2.5 rounded-2xl text-xs outline-none transition font-sans"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-[#384633] hover:bg-[#2B3B2B] text-white p-2.5 rounded-2xl disabled:opacity-50 transition cursor-pointer shadow-xs"
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
