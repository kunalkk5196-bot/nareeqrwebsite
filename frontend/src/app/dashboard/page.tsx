'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Server,
  Radio,
  WifiOff,
  AlertTriangle,
  XCircle,
  QrCode,
  CheckCircle2,
  XOctagon,
  PackageCheck,
  IndianRupee,
  CreditCard,
  Scale,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [chartPeriod, setChartPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [chartPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [m, c] = await Promise.all([
        api.getDashboardMetrics(),
        api.getDashboardCharts(chartPeriod),
      ]);
      setMetrics(m?.cards || {});
      setCharts(c || {});
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex bg-[#0b0f19] min-h-screen">
        <Sidebar />
        <div className="ml-64 flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title="Fleet Operations Command" />

        <div className="pt-20 px-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Critical Exception Banner (Section 44 & 45: Payment Success != Dispense Success) */}
          {metrics?.failedDispensesCount > 0 && (
            <div className="glass-panel border-l-4 border-amber-500 bg-amber-950/20 p-4 rounded-xl flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                  <Scale className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-300">
                    Reconciliation Exception Notice (Payment Success ≠ Dispense Success)
                  </div>
                  <div className="text-xs text-slate-400">
                    {metrics.failedDispensesCount} verified payments encountered a physical vending jam or timeout. Immediate investigation or refund required.
                  </div>
                </div>
              </div>
              <Link
                href="/reconciliation"
                className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
              >
                <span>Investigate In Reconciliation</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* 12 Core KPI Cards (Section 6) */}
          <div>
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">
              Fleet & Financial Overview
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
              {/* 1. Total Machines */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Machines</span>
                  <Server className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-black text-slate-100">{metrics?.totalMachines ?? 0}</div>
                <div className="text-[10px] text-slate-500 mt-1">Installed Nationwide</div>
              </div>

              {/* 2. Online Machines */}
              <div className="glass-panel p-4 rounded-xl border border-emerald-900/30 bg-emerald-950/10">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Online</span>
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="text-2xl font-black text-emerald-400">{metrics?.onlineMachines ?? 0}</div>
                <div className="text-[10px] text-emerald-500/80 mt-1">4G Connected & Active</div>
              </div>

              {/* 3. Offline Machines */}
              <div className="glass-panel p-4 rounded-xl border border-rose-900/30 bg-rose-950/10">
                <div className="flex items-center justify-between text-rose-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Offline</span>
                  <WifiOff className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-rose-400">{metrics?.offlineMachines ?? 0}</div>
                <div className="text-[10px] text-rose-500/80 mt-1">&gt; 5 min heartbeat missed</div>
              </div>

              {/* 4. Low Stock Machines */}
              <div className="glass-panel p-4 rounded-xl border border-amber-900/30 bg-amber-950/10">
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">{metrics?.lowStockMachines ?? 0}</div>
                <div className="text-[10px] text-amber-500/80 mt-1">Below threshold (≤ 20)</div>
              </div>

              {/* 5. Out of Stock Machines */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Out of Stock</span>
                  <XCircle className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-black text-slate-300">{metrics?.outOfStockMachines ?? 0}</div>
                <div className="text-[10px] text-slate-500 mt-1">0 pads available</div>
              </div>

              {/* 6. Today's QR Scans (Strict rule 4 compliance) */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Today&apos;s Scans</span>
                  <QrCode className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-lg font-bold text-slate-300">
                  {metrics?.todayQrScans === 'Unavailable' ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Not Exposed
                    </span>
                  ) : (
                    metrics?.todayQrScans
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Static QR Telemetry</div>
              </div>

              {/* 7. Today's Successful Payments */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Success Payments</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">{metrics?.todaySuccessfulPayments ?? 0}</div>
                <div className="text-[10px] text-slate-500 mt-1">Success rate: {metrics?.paymentSuccessRate}%</div>
              </div>

              {/* 8. Today's Failed Payments */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Failed Payments</span>
                  <XOctagon className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-rose-400">{metrics?.todayFailedPayments ?? 0}</div>
                <div className="text-[10px] text-slate-500 mt-1">User/Bank declined</div>
              </div>

              {/* 9. Today's Pads Dispensed */}
              <div className="glass-panel p-4 rounded-xl border border-pink-900/30 bg-pink-950/10">
                <div className="flex items-center justify-between text-pink-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pads Dispensed</span>
                  <PackageCheck className="w-4 h-4 text-pink-400" />
                </div>
                <div className="text-2xl font-black text-pink-400">{metrics?.todayPadsDispensed ?? 0}</div>
                <div className="text-[10px] text-pink-500/80 mt-1">Total: {metrics?.totalPadsDispensed} pads</div>
              </div>

              {/* 10. Today's Revenue */}
              <div className="glass-panel p-4 rounded-xl border border-pink-900/40 bg-gradient-to-br from-pink-950/20 to-slate-900">
                <div className="flex items-center justify-between text-pink-300 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Today&apos;s Revenue</span>
                  <IndianRupee className="w-4 h-4 text-pink-400" />
                </div>
                <div className="text-2xl font-black text-slate-100">₹{metrics?.todayRevenue ?? 0}</div>
                <div className="text-[10px] text-slate-400 mt-1">Total: ₹{metrics?.totalRevenue ?? 0}</div>
              </div>

              {/* 11. PhonePe Revenue */}
              <div className="glass-panel p-4 rounded-xl border border-purple-900/30 bg-purple-950/15">
                <div className="flex items-center justify-between text-purple-300 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">PhonePe</span>
                  <CreditCard className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-300">₹{metrics?.phonepeRevenue ?? 0}</div>
                <div className="text-[10px] text-purple-400/80 mt-1">Today: ₹{metrics?.phonepeTodayRevenue ?? 0}</div>
              </div>

              {/* 12. Razorpay Revenue */}
              <div className="glass-panel p-4 rounded-xl border border-sky-900/30 bg-sky-950/15">
                <div className="flex items-center justify-between text-sky-300 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Razorpay</span>
                  <CreditCard className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black text-sky-300">₹{metrics?.razorpayRevenue ?? 0}</div>
                <div className="text-[10px] text-sky-400/80 mt-1">Today: ₹{metrics?.razorpayTodayRevenue ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Section 7: Analytics & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Revenue Timeseries */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-pink-400" />
                    <span>Daily Revenue Trends</span>
                  </h3>
                  <p className="text-xs text-slate-400">Verified payment collections over time</p>
                </div>
                {/* Period Selector */}
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 space-x-1 text-xs font-semibold">
                  {['today', '7d', '30d', '3m'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setChartPeriod(p)}
                      className={`px-3 py-1 rounded-md transition-all ${
                        chartPeriod === p
                          ? 'bg-pink-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts?.dailyTimeseries || []}>
                    <defs>
                      <linearGradient id="phonepeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="razorpayGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      formatter={(val: any) => [`₹${val}`, '']}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="phonepe"
                      name="PhonePe QR"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#phonepeGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="razorpay"
                      name="Razorpay QR"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#razorpayGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Gateway Distribution & Fleet Health */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 mb-1">Gateway Revenue Split</h3>
                <p className="text-xs text-slate-400 mb-4">PhonePe vs Razorpay share</p>

                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts?.gatewayDistribution || []}
                        dataKey="amount"
                        nameKey="gateway"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#0ea5e9" />
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        formatter={(val: any) => [`₹${val}`, 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-around text-xs mt-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-slate-300">PhonePe: ₹{metrics?.phonepeRevenue}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-sky-500" />
                    <span className="text-slate-300">Razorpay: ₹{metrics?.razorpayRevenue}</span>
                  </div>
                </div>
              </div>

              {/* Machine Status Breakdown */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Fleet Status Distribution
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {charts?.machineStatusCounts?.map((s: any) => (
                    <div key={s.name} className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300">{s.name}</span>
                      <span className="font-mono font-bold" style={{ color: s.color }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Pads Dispensed Daily */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center space-x-2">
              <PackageCheck className="w-4 h-4 text-pink-400" />
              <span>Daily Sanitary Napkins Dispensed</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Physical count of pads dispensed by IoT controllers</p>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.dailyTimeseries || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="padsDispensed" name="Pads Dispensed" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Machine Factual Performance Ranking (Section 7) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Vending Machine Performance (Factual Metrics)</h3>
                <p className="text-xs text-slate-400">Sortable metrics across verified revenue, dispensed units, and transactions</p>
              </div>
              <Link
                href="/machines"
                className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center space-x-1"
              >
                <span>View Full Machine Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Machine ID</th>
                    <th className="py-3 px-4 font-semibold">Location</th>
                    <th className="py-3 px-4 font-semibold">City</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Current Stock</th>
                    <th className="py-3 px-4 font-semibold text-right">Pads Dispensed</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {charts?.machinePerformance?.slice(0, 5).map((m: any) => (
                    <tr key={m.machineId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-pink-400">
                        <Link href={`/machines/${m.machineId}`} className="hover:underline">
                          {m.machineId}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-200">{m.location}</td>
                      <td className="py-3 px-4 text-slate-400">{m.city}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'ONLINE'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={m.currentStock === 0 ? 'text-rose-400 font-bold' : m.currentStock <= 20 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {m.currentStock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-200">{m.padsDispensed}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">₹{m.revenue}</td>
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
