'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Boxes, PackagePlus, AlertTriangle, XCircle, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function StockPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [newStockVal, setNewStockVal] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { hasRole } = useAuth();

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await api.getStock();
      setData(res);
    } catch (err) {
      console.error('Error fetching stock data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    setActionLoading(true);
    try {
      await api.adjustStock({
        machineId: selectedMachine.id,
        newStock: newStockVal,
        reason: adjustReason,
      });
      setShowAdjustModal(false);
      setAdjustReason('');
      fetchStock();
    } catch (err: any) {
      alert(`Adjustment failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title="Stock Inventory & Refill Management" />

        <div className="pt-20 px-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Fleet Capacity</div>
              <div className="text-2xl font-black text-slate-100 mt-1">{data?.summary?.totalCapacity ?? 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">Total Pad Slots</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Current Fleet Stock</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{data?.summary?.totalCurrentStock ?? 0}</div>
              <div className="text-[10px] text-emerald-500 mt-1">Available to Dispense</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-amber-900/30 bg-amber-950/10">
              <div className="text-[11px] font-bold text-amber-400 uppercase">Low Stock Machines</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{data?.summary?.lowStockCount ?? 0}</div>
              <div className="text-[10px] text-amber-500 mt-1">≤ 20 Pads Remaining</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-rose-900/30 bg-rose-950/10">
              <div className="text-[11px] font-bold text-rose-400 uppercase">Out of Stock Machines</div>
              <div className="text-2xl font-black text-rose-400 mt-1">{data?.summary?.outOfStockCount ?? 0}</div>
              <div className="text-[10px] text-rose-500 mt-1">Urgent Refill Required</div>
            </div>
          </div>

          {/* Machine Inventory Grid */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Vending Machine Inventory Status
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.inventory?.map((m: any) => (
                <div key={m.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/machines/${m.machineId}`} className="font-mono font-bold text-pink-400 hover:underline">
                        {m.machineId}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.isOutOfStock
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : m.isLowStock
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {m.isOutOfStock ? 'OUT OF STOCK' : m.isLowStock ? 'LOW STOCK' : 'HEALTHY'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-200">{m.machineName}</div>
                    <div className="text-[11px] text-slate-400 mb-4">{m.location}, {m.city}</div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="font-bold text-slate-100">{m.currentStock} / {m.productCapacity} Pads</span>
                        <span className="text-slate-400">{m.fillPercentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            m.isOutOfStock ? 'bg-rose-500' : m.isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${m.fillPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {hasRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']) && (
                    <div className="flex space-x-2 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          setSelectedMachine(m);
                          setNewStockVal(m.currentStock);
                          setShowAdjustModal(true);
                        }}
                        className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Adjust Stock</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stock Movements Ledger Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">Recent Stock Transactions & Audit Ledger</span>
              <span className="text-slate-400 font-mono">{data?.movements?.items?.length || 0} Movements</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Machine</th>
                    <th className="py-3.5 px-4 font-semibold">Event</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Previous</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Change</th>
                    <th className="py-3.5 px-4 font-semibold text-right">New Stock</th>
                    <th className="py-3.5 px-4 font-semibold">Reason / Source</th>
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Loading stock ledger...
                      </td>
                    </tr>
                  ) : (
                    data?.movements?.items?.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-pink-400">{s.machineIdCode}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.eventType === 'STOCK_MISMATCH'
                                ? 'bg-rose-950 text-rose-300 border border-rose-700'
                                : s.eventType === 'STOCK_REFILLED'
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-slate-900 text-slate-300'
                            }`}
                          >
                            {s.eventType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400">{s.previousStock}</td>
                        <td className={`py-3.5 px-4 text-right font-mono font-bold ${s.changeQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {s.changeQuantity > 0 ? `+${s.changeQuantity}` : s.changeQuantity}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">{s.newStock}</td>
                        <td className="py-3.5 px-4 text-slate-300">{s.reason || s.performedByName}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">{new Date(s.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal: Manual Stock Adjustment */}
        {showAdjustModal && selectedMachine && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-base font-bold text-slate-100 mb-1">Manual Stock Correction</h3>
              <p className="text-xs text-slate-400 mb-4">
                Machine: <span className="font-mono text-pink-400 font-bold">{selectedMachine.machineId}</span>
              </p>

              <form onSubmit={handleAdjust} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">New Physical Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    max={selectedMachine.productCapacity}
                    value={newStockVal}
                    onChange={(e) => setNewStockVal(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mandatory Audit Reason *</label>
                  <textarea
                    required
                    placeholder="e.g. Physical stock count verified after jammed spring reset"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-600"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg flex items-center space-x-1"
                  >
                    {actionLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>Record Adjustment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
