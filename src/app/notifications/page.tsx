'use client';

import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, AlertTriangle, Info, Check, CheckCheck, RefreshCw } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications({ severity: filterSeverity });
      setNotifications(res.items || []);
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterSeverity]);

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title="System Notifications & Alerts" />

        <div className="pt-20 px-8 max-w-5xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="WARNING">Warning Only</option>
                <option value="INFO">Info Only</option>
              </select>
            </div>

            <button
              onClick={markAllRead}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-pink-400" />
              <span>Mark All as Read</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 glass-panel rounded-2xl border border-slate-800">
                No notifications found.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`glass-panel p-4 rounded-2xl border transition-all flex items-start justify-between ${
                    !n.isRead
                      ? 'border-slate-700 bg-slate-900/90 shadow-md'
                      : 'border-slate-800/60 opacity-75'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="mt-0.5">
                      {n.severity === 'CRITICAL' ? (
                        <div className="p-2 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      ) : n.severity === 'WARNING' ? (
                        <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-sky-950/60 text-sky-400 border border-sky-800">
                          <Info className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-100">{n.title}</span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-pink-500" />
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                      <div className="text-[10px] text-slate-500 mt-2 font-mono">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-xs text-slate-400 hover:text-pink-400 p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Mark as Read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
