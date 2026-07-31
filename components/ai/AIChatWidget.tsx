'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, CheckCircle2, Calendar, CreditCard, ArrowRight, RefreshCw, Terminal } from 'lucide-react';
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
      content: 'Hello! I am DriveSuccess AI Assistant. I can check live instructor availability, answer RTO questions, or book a driving lesson directly into our database for you!',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        toolCall: res.toolCall,
        cardData: res.cardData,
      };
      setMessages((prev) => [...prev, botMsg]);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble querying the database. Please try again.' },
      ]);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 p-4 rounded-full shadow-2xl shadow-amber-500/40 hover:scale-105 transition-transform flex items-center gap-2 group"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="font-heading font-extrabold text-xs uppercase tracking-wider hidden sm:inline pr-1">
          DriveAI Assistant
        </span>
      </button>

      {/* Chat Window Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[440px] h-[580px] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-slate-100 flex items-center gap-2">
                    DriveSuccess AI Engine
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">Live PostgreSQL Function Calling Active</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
                >
                  {/* Tool Call Invocation Badge */}
                  {m.toolCall && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-900 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full shadow">
                      <Terminal className="w-3 h-3" />
                      <span>DB Function: {m.toolCall.name}()</span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-amber-500 text-slate-950 font-semibold rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {m.content}
                  </div>

                  {/* Interactive Payload Cards */}
                  {m.cardData && m.cardData.type === 'SLOTS_AVAILABLE' && (
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-heading font-bold text-amber-400">{m.cardData.packageName}</span>
                        <span className="text-slate-400 font-mono">{m.cardData.date}</span>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Instructor: <strong className="text-slate-200">{m.cardData.instructorName}</strong> • Vehicle: <strong className="text-slate-200">{m.cardData.vehicleName}</strong>
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {m.cardData.availableSlots.map((slot: string, sIdx: number) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(`Book ${m.cardData.packageName} for ${m.cardData.date} at ${slot}`)}
                            className="bg-slate-950 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-800 text-xs py-2 px-3 rounded-xl font-bold transition flex items-center justify-between"
                          >
                            <span>{slot}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.cardData && m.cardData.type === 'BOOKING_CREATED' && (
                    <div className="w-full bg-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Booking Created in Database</span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <p><strong className="text-slate-400">Booking ID:</strong> <span className="font-mono text-amber-400">{m.cardData.bookingId.slice(-8)}</span></p>
                        <p><strong className="text-slate-400">Package:</strong> {m.cardData.packageName}</p>
                        <p><strong className="text-slate-400">Total Price:</strong> <span className="text-amber-400 font-bold">₹{m.cardData.amount}</span></p>
                        <p><strong className="text-slate-400">Scheduled:</strong> {m.cardData.date} at {m.cardData.timeSlot}</p>
                      </div>

                      <Link
                        href={m.cardData.paymentUrl}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Proceed to Razorpay Payment →</span>
                      </Link>
                    </div>
                  )}

                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-slate-900 border border-slate-800 p-3 rounded-xl w-fit">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI executing database query...</span>
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
              className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Try: 'Book 4 wheeler Saturday'"
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 px-4 py-2.5 rounded-xl text-xs outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-2.5 rounded-xl disabled:opacity-50 transition"
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
