'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Clock } from 'lucide-react';
import { markNotificationAsReadAction, markAllNotificationsAsReadAction } from '@/actions/notification';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Click-Outside & Escape Key to Close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success) {
            setUnreadCount(data.unreadCount || 0);
            setNotifications(data.notifications || []);
          }
        }
      } catch (err) {
        // Silent polling error fallback
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s polling
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationAsReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div ref={bellRef} className="relative">
      
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-amber-400 hover:border-slate-700 transition"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />

        {/* Live Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-sm text-slate-100">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-slate-400 hover:text-amber-400 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border transition space-y-1.5 ${
                    !n.isRead
                      ? 'bg-slate-950 border-amber-500/30'
                      : 'bg-slate-950/50 border-slate-800 opacity-70'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-heading font-bold text-xs text-slate-100">{n.title}</h4>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                      >
                        <Check className="w-3 h-3" />
                        <span>Read</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>

                  <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}
