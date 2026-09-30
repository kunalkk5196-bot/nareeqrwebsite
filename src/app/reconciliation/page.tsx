'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  XOctagon,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function ReconciliationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const { hasRole } = useAuth();

  const fetchReconciliation = async () => {
    try {
      setLoading(true);
      const res = await api.getReconciliation();
      setData(res);
    } catch (err) {
      console.error('Error fetching reconciliation data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, []);

  const handleResolve = async (paymentId: string, action: string) => {
    const notes = prompt(`Please enter mandatory audit notes for action: ${action}`);
    if (!notes) return;

    try {
      setResolvingId(paymentId);
      await api.resolveReconciliation({ paymentId, action, notes });
      alert(`Resolution recorded: ${action}`);
      fetchReconciliation();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title="Financial & IoT Stock Reconciliation" />

        <div className="pt-20 px-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Architectural Rule 44 Header */}
          <div className="glass-panel border-l-4 border-rose-500 bg-rose-950/15 p-5 rounded-2xl">
            <div className="flex items-start space-x-3">
              <Scale className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-rose-300">
                  Critical Principle: PAYMENT SUCCESS ≠ DISPENSE SUCCESS
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  The system enforces strict decoupling between financial transactions and physical mechanical execution. When a customer pays successfully via PhonePe or Razorpay, but the vending machine encounters a motor jam, optical drop timeout, or empty tray, the discrepancy is quarantined here for administrative remediation or automated refund.
                </p>
              </div>
            </div>
          </div>

          {/* Exception Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-rose-900/40 bg-rose-950/10">
              <div className="text-[11px] font-bold text-rose-400 uppercase">Payment Captured, Dispense Failed</div>
              <div className="text-2xl font-black text-rose-400 mt-1">
                {data?.summary?.paymentDispenseFailures ?? 0}
              </div>
              <div className="text-[10px] text-rose-300/80 mt-1">Customer refund or retry required</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-amber-900/40 bg-amber-950/10">
              <div className="text-[11px] font-bold text-amber-400 uppercase">Dispense Without Payment</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {data?.summary?.dispenseWithoutPayments ?? 0}
              </div>
              <div className="text-[10px] text-amber-300/80 mt-1">Manual coin or physical test cycle</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-indigo-900/40 bg-indigo-950/10">
              <div className="text-[11px] font-bold text-indigo-400 uppercase">Physical Stock Mismatches</div>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {data?.summary?.stockMismatches ?? 0}
              </div>
              <div className="text-[10px] text-indigo-300/80 mt-1">Expected stock ≠ Sensor reported stock</div>
            </div>
          </div>

          {/* Section 1: Payment Success but Dispense Failed Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <XOctagon className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-slate-200">
                  Failed Dispenses on Verified Payments (Eligible for Refund)
                </span>
              </div>
              <span className="text-rose-400 font-mono font-bold">
                {data?.paymentDispenseMismatches?.length || 0} Open Discrepancies
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                    <th className="py-3.5 px-4 font-semibold">Machine</th>
                    <th className="py-3.5 px-4 font-semibold">Gateway</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Hardware Failure Reason</th>
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Remediation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Loading reconciliation records...
                      </td>
                    </tr>
                  ) : data?.paymentDispenseMismatches?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-emerald-400 font-medium">
                        ✓ All verified payments match physical dispense confirmations. No open anomalies.
                      </td>
                    </tr>
                  ) : (
                    data?.paymentDispenseMismatches?.map((m: any) => (
                      <tr key={m.paymentId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-pink-400">
                          {m.transactionId}
                        </td>
                        <td className="py-3.5 px-4">
                          <Link href={`/machines/${m.machineId}`} className="font-mono text-slate-200 hover:underline">
                            {m.machineId}
                          </Link>
                          <div className="text-[10px] text-slate-500">{m.machineName}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">{m.gateway}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">₹{m.amount}</td>
                        <td className="py-3.5 px-4">
                          <div className="text-rose-400 font-bold">{m.reason}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{m.deviceConfirmation}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-400">
                          {new Date(m.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleResolve(m.paymentId, 'REFUNDED')}
                                disabled={resolvingId === m.paymentId}
                                className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-200 rounded-lg text-[10px] font-bold transition-colors"
                              >
                                Record Refund
                              </button>
                              <button
                                onClick={() => handleResolve(m.paymentId, 'MANUAL_DISPENSE_APPROVED')}
                                disabled={resolvingId === m.paymentId}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold transition-colors"
                              >
                                Manual Clear
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Stock Mismatches Table (Section 47) */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-200">
                  Stock Discrepancy Events (Expected Book Stock ≠ Physical Reported Stock)
                </span>
              </div>
              <span className="text-amber-400 font-mono font-bold">
                {data?.stockMismatches?.length || 0} Stock Mismatches
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Machine</th>
                    <th className="py-3.5 px-4 font-semibold">Location</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Expected Stock</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Reported Physical Count</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Variance</th>
                    <th className="py-3.5 px-4 font-semibold">Discrepancy Description</th>
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {data?.stockMismatches?.map((s: any) => (
                    <tr key={s.transactionId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-pink-400">{s.machineId}</td>
                      <td className="py-3.5 px-4 text-slate-300">{s.location}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">{s.previousStock}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">{s.reportedStock}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">{s.difference}</td>
                      <td className="py-3.5 px-4 text-slate-300">{s.reason}</td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-400">{new Date(s.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
