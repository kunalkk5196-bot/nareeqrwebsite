'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QrCode, ShieldAlert, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

export default function QrActivityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getQrActivity()
      .then((res: any) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title="Static QR Telemetry & Analytics" />

        <div className="pt-20 px-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Section 4 & 21 Architectural Notice */}
          <div className="glass-panel border-l-4 border-indigo-500 bg-indigo-950/20 p-5 rounded-2xl shadow-lg">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-indigo-300">
                  Business Rule 4 & 21: Zero-Fabrication Static QR Telemetry Principle
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  The vending machines use pre-printed physical static QR codes. Static QR scans can only be counted if PhonePe or Razorpay merchant APIs expose raw scan events or telemetry hooks. If unavailable, scan metrics are strictly designated as <span className="font-mono text-pink-400 font-bold">Unavailable</span> rather than synthesizing deceptive numbers.
                </p>
                <div className="mt-2 text-[11px] text-slate-400 font-mono">
                  Rule Enforcement: Number of Payments ≠ Number of QR Scans
                </div>
              </div>
            </div>
          </div>

          {/* QR Analytics Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">Pre-printed QR Identifier Mapping & Activity</span>
              <span className="text-slate-400 font-mono">{data?.machines?.length || 0} Machines Tracked</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Machine ID</th>
                    <th className="py-3.5 px-4 font-semibold">Location</th>
                    <th className="py-3.5 px-4 font-semibold">PhonePe Static QR</th>
                    <th className="py-3.5 px-4 font-semibold text-center">PhonePe Scans</th>
                    <th className="py-3.5 px-4 font-semibold text-center">PhonePe Payments</th>
                    <th className="py-3.5 px-4 font-semibold">Razorpay Static QR</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Razorpay Scans</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Razorpay Payments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        Loading QR activity...
                      </td>
                    </tr>
                  ) : (
                    data?.machines?.map((m: any) => (
                      <tr key={m.machineId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-pink-400">
                          <Link href={`/machines/${m.machineId}`} className="hover:underline flex items-center space-x-1">
                            <span>{m.machineId}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-semibold">{m.machineName}</div>
                          <div className="text-[10px] text-slate-500">{m.city}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-purple-300">
                          {m.phonepe.identifier}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {m.phonepe.isScanDataAvailable ? (
                            <span className="font-mono font-bold text-slate-200">{m.phonepe.scanCount}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-500 font-mono">
                              Unavailable
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                          {m.phonepe.successfulPayments}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-sky-300">
                          {m.razorpay.identifier}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {m.razorpay.isScanDataAvailable ? (
                            <span className="font-mono font-bold text-slate-200">{m.razorpay.scanCount}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-500 font-mono">
                              Unavailable
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                          {m.razorpay.successfulPayments}
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
