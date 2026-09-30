'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PackageCheck, Search, Filter, AlertTriangle, ExternalLink } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

export default function DispensingPage() {
  const [dispenses, setDispenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const [summary, setSummary] = useState<any>({});

  const fetchDispensing = async () => {
    try {
      setLoading(true);
      const res = await api.getDispensing({
        status: statusFilter,
        page: page.toString(),
        limit: '15',
      });
      setDispenses(res.items || []);
      setPagination(res.pagination || { totalPages: 1, totalItems: 0 });
      setSummary(res.summary || {});
    } catch (err) {
      console.error('Error fetching dispensing data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispensing();
  }, [statusFilter, page]);

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title="Physical Dispensing Telemetry Ledger" />

        <div className="pt-20 px-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Dispense Cycles</div>
              <div className="text-2xl font-black text-slate-100 mt-1">{summary.totalDispenses ?? 0}</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-emerald-900/30 bg-emerald-950/10">
              <div className="text-[11px] font-bold text-emerald-400 uppercase">Successful Dispenses</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{summary.successCount ?? 0}</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-rose-900/30 bg-rose-950/10">
              <div className="text-[11px] font-bold text-rose-400 uppercase">Dispense Faults (Jammed / Timeout)</div>
              <div className="text-2xl font-black text-rose-400 mt-1">{summary.failedCount ?? 0}</div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
            >
              <option value="ALL">All Dispense Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="JAMMED">JAMMED</option>
              <option value="TIMEOUT">TIMEOUT</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          {/* Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Dispense ID</th>
                    <th className="py-3.5 px-4 font-semibold">Machine</th>
                    <th className="py-3.5 px-4 font-semibold">Linked Payment</th>
                    <th className="py-3.5 px-4 font-semibold">Payment Status</th>
                    <th className="py-3.5 px-4 font-semibold">Dispense Status</th>
                    <th className="py-3.5 px-4 font-semibold">Hardware Confirmation</th>
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Loading dispensing events...
                      </td>
                    </tr>
                  ) : dispenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No dispensing transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    dispenses.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-pink-400">{d.dispenseId}</td>
                        <td className="py-3.5 px-4">
                          <Link href={`/machines/${d.machineIdCode}`} className="font-mono text-slate-200 hover:underline">
                            {d.machineIdCode}
                          </Link>
                          <div className="text-[10px] text-slate-500">{d.location}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {d.paymentTransactionId}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.paymentStatus === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                            {d.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {d.hasMismatch ? (
                            <span className="px-2.5 py-1 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold text-[10px] flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>MISMATCH ({d.status})</span>
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                              {d.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {d.deviceConfirmation || d.failureReason || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-400">
                          {new Date(d.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
