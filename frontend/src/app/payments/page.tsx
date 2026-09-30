'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  CheckCircle2,
  XOctagon,
  Clock,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const [summary, setSummary] = useState<any>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.getPayments({
        search,
        gateway: gatewayFilter,
        status: statusFilter,
        page: page.toString(),
        limit: '12',
      });
      setPayments(res.items || []);
      setPagination(res.pagination || { totalPages: 1, totalItems: 0 });
      setSummary(res.summary || {});
    } catch (err) {
      console.error('Error loading payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search, gatewayFilter, statusFilter, page]);

  const handleVerifyLive = async (paymentId: string) => {
    try {
      setVerifyingId(paymentId);
      const res: any = await api.verifyPaymentLive(paymentId);
      alert(`Server-Side Gateway Verification Result:\nGateway Status: ${res.gatewayStatus}\nValid Signature: ${res.isValid}`);
      fetchPayments();
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title="Payment Transactions Ledger" />

        <div className="pt-20 px-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Verified Collections</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">₹{summary.totalAmount ?? 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">Verified Server-Side</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Successful Payments</div>
              <div className="text-2xl font-black text-slate-100 mt-1">{summary.successCount ?? 0}</div>
              <div className="text-[10px] text-emerald-500 mt-1">Dispense Dispatched</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Failed Transactions</div>
              <div className="text-2xl font-black text-rose-400 mt-1">{summary.failedCount ?? 0}</div>
              <div className="text-[10px] text-rose-500 mt-1">Bank / User Declined</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Pending Webhooks</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{summary.pendingCount ?? 0}</div>
              <div className="text-[10px] text-amber-500 mt-1">Awaiting Gateway Finality</div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search transaction ID, provider ID, machine..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <select
                value={gatewayFilter}
                onChange={(e) => { setGatewayFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
              >
                <option value="ALL">All Gateways</option>
                <option value="PHONEPE">PhonePe QR</option>
                <option value="RAZORPAY">Razorpay QR</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
              >
                <option value="ALL">All Status</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="PENDING">PENDING</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                    <th className="py-3.5 px-4 font-semibold">Machine</th>
                    <th className="py-3.5 px-4 font-semibold">Gateway</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Payment Status</th>
                    <th className="py-3.5 px-4 font-semibold">Dispense Status</th>
                    <th className="py-3.5 px-4 font-semibold">Provider Txn ID</th>
                    <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Verify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <div className="flex justify-center items-center space-x-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
                          <span>Loading payment transactions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No transactions found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => {
                      const isMismatch = p.status === 'SUCCESS' && p.dispenseStatus !== 'SUCCESS';
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-pink-400">
                            {p.transactionId}
                          </td>
                          <td className="py-3.5 px-4">
                            <Link href={`/machines/${p.machineIdCode}`} className="font-mono text-slate-200 hover:text-pink-300">
                              {p.machineIdCode}
                            </Link>
                            <div className="text-[10px] text-slate-500 truncate max-w-xs">{p.machineName}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.gateway === 'PHONEPE'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                                  : 'bg-sky-950 text-sky-300 border border-sky-800/60'
                              }`}
                            >
                              {p.gateway}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                            ₹{p.amount}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'SUCCESS'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                  : p.status === 'FAILED'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              <span>{p.status}</span>
                            </span>
                            {p.failureReason && (
                              <div className="text-[9px] text-rose-400 mt-0.5 max-w-xs truncate">{p.failureReason}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {isMismatch ? (
                              <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500 text-rose-300 text-[10px] font-bold animate-pulse">
                                FAILED ({p.dispenseStatus})
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${p.dispenseStatus === 'SUCCESS' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {p.dispenseStatus}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                            {p.providerTxnId || 'Pending'}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-slate-400">
                            {new Date(p.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleVerifyLive(p.id)}
                              disabled={verifyingId === p.id}
                              title="Check server-side against payment provider API"
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold transition-colors disabled:opacity-40"
                            >
                              {verifyingId === p.id ? 'Checking...' : 'Verify'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>Showing page {page} of {pagination.totalPages} ({pagination.totalItems} transactions)</div>
                <div className="flex space-x-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
