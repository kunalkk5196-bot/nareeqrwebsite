'use client';

import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  CreditCard,
  PackageCheck,
  IndianRupee,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('transactions');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [gateway, setGateway] = useState('ALL');

  useEffect(() => {
    fetchSummary();
  }, [startDate, endDate, gateway]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.getReportSummary({
        startDate,
        endDate,
        gateway,
      });
      setSummary(res);
    } catch (err) {
      console.error('Error fetching report summary', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const params = new URLSearchParams({
      type: reportType,
      format: format === 'excel' ? 'csv' : format, // CSV opens seamlessly in Excel
      startDate,
      endDate,
    }).toString();

    window.open(`/api/v1/reports/export?${params}`, '_blank');
  };

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title="Comprehensive Audit & Analytics Reports" />

        <div className="pt-20 px-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Filtered Revenue</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">₹{summary?.totalRevenue ?? 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">Total verified revenue</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Pads Dispensed</div>
              <div className="text-2xl font-black text-pink-400 mt-1">{summary?.totalPadsDispensed ?? 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">Physical sanitary pads</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">PhonePe Share</div>
              <div className="text-2xl font-black text-purple-300 mt-1">₹{summary?.phonepeRevenue ?? 0}</div>
              <div className="text-[10px] text-purple-400 mt-1">PhonePe Gateway</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Razorpay Share</div>
              <div className="text-2xl font-black text-sky-300 mt-1">₹{summary?.razorpayRevenue ?? 0}</div>
              <div className="text-[10px] text-sky-400 mt-1">Razorpay Gateway</div>
            </div>
          </div>

          {/* Report Configuration & Export Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center space-x-2 text-slate-200">
              <FileBarChart2 className="w-5 h-5 text-pink-400" />
              <h2 className="text-base font-bold">Generate & Export Data Reports</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Report Domain</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-pink-500"
                >
                  <option value="transactions">Payment Transactions Report</option>
                  <option value="machines">Machine Inventory & Health Report</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Gateway Filter</label>
                <select
                  value={gateway}
                  onChange={(e) => setGateway(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-pink-500"
                >
                  <option value="ALL">All Gateways</option>
                  <option value="PHONEPE">PhonePe Only</option>
                  <option value="RAZORPAY">Razorpay Only</option>
                </select>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Exports conform to Indian GST and merchant reporting standards.
              </span>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download CSV</span>
                </button>

                <button
                  onClick={() => handleExport('excel')}
                  className="px-4 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Excel (.xlsx compatible)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
