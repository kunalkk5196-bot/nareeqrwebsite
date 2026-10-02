'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Bell, Zap, RefreshCw, FlaskConical } from 'lucide-react';
import { api } from '@/lib/api';

const IS_MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

export function Header({ title }: { title: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [machines, setMachines] = useState<any[]>([]);
  const [simMachineId, setSimMachineId] = useState('');
  const [simGateway, setSimGateway] = useState('PHONEPE');
  const [simStatus, setSimStatus] = useState('SUCCESS');
  const [simAmount, setSimAmount] = useState('10');
  const [simLoading, setSimLoading] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    api.getNotifications({ isRead: 'false' })
      .then((res: any) => setUnreadCount(res.unreadCount || 0))
      .catch(() => {});

    api.getMachines({ limit: '50' })
      .then((res: any) => {
        setMachines(res.items || []);
        if (res.items?.length > 0) {
          setSimMachineId(res.items[0].machineId);
        }
      })
      .catch(() => {});
  }, []);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setSimMessage(null);
    try {
      const res: any = await api.simulatePayment({
        machineId: simMachineId,
        gateway: simGateway,
        status: simStatus,
        amount: parseFloat(simAmount),
      });
      setSimMessage(`✅ Payment simulated! Trans ID: ${res.data?.transactionId || 'Success'}. Dispense Triggered: ${res.data?.dispenseTriggered ? 'YES' : 'NO'}`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setSimMessage(`❌ Error: ${err.message}`);
    } finally {
      setSimLoading(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) setShowSimulateModal(false); }}
    >
      <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-pink-400" />
            <h2 className="text-base font-bold text-slate-100">Live Payment Simulator</h2>
          </div>
          <button
            onClick={() => setShowSimulateModal(false)}
            className="text-slate-400 hover:text-slate-200 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Trigger a verified PhonePe or Razorpay webhook event. This verifies machine QR mapping, records financial audit trail, and issues an IoT dispense command.
        </p>

        {simMessage && (
          <div className="p-3 mb-4 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200">
            {simMessage}
          </div>
        )}

        <form onSubmit={handleSimulate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Target Vending Machine</label>
            <select
              value={simMachineId}
              onChange={(e) => setSimMachineId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-pink-500"
            >
              {machines.map((m) => (
                <option key={m.machineId} value={m.machineId}>
                  {m.machineId} — {m.machineName} ({m.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Gateway</label>
              <select
                value={simGateway}
                onChange={(e) => setSimGateway(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-pink-500"
              >
                <option value="PHONEPE">PhonePe QR</option>
                <option value="RAZORPAY">Razorpay QR</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Outcome</label>
              <select
                value={simStatus}
                onChange={(e) => setSimStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-pink-500"
              >
                <option value="SUCCESS">SUCCESS (Dispatches Pad)</option>
                <option value="FAILED">FAILED (Bank Declined)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Amount (INR)</label>
            <input
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-pink-500"
              min="5"
              step="5"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowSimulateModal(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={simLoading}
              className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center space-x-1.5"
            >
              {simLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Execute Webhook</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* MOCK MODE top banner */}
      {IS_MOCK_MODE && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/10 border-b border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center gap-2 py-1">
          <FlaskConical className="w-3.5 h-3.5" />
          DEMO / MOCK MODE — In-memory data store active. Data resets on server restart.
        </div>
      )}
      <header className={`h-16 bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-800/80 fixed ${IS_MOCK_MODE ? 'top-7' : 'top-0'} right-0 left-64 z-30 px-6 flex items-center justify-between`}>
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h1>
          {IS_MOCK_MODE ? (
            <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <FlaskConical className="w-3 h-3" />
              <span>Mock Mode</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>IoT Gateway Live</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Test Simulator Button */}
          <button
            onClick={() => setShowSimulateModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-300 text-xs font-bold transition-all shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-pink-400" />
            <span>Simulate Payment</span>
          </button>

          {/* Notifications Icon */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Modal rendered via React Portal directly on document.body for true viewport centering */}
      {mounted && showSimulateModal && createPortal(modal, document.body)}
    </>
  );
}
