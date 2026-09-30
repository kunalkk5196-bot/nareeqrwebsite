'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Server,
  Search,
  Filter,
  Plus,
  Radio,
  WifiOff,
  AlertTriangle,
  XCircle,
  ExternalLink,
  RefreshCw,
  PackagePlus,
  Trash2,
  Trash,
  ArchiveRestore,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function MachinesPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const [summary, setSummary] = useState<any>({});

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [refillQty, setRefillQty] = useState(50);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // New machine form
  const [newMachine, setNewMachine] = useState({
    machineId: '',
    machineName: '',
    location: '',
    city: '',
    state: '',
    iotDeviceId: '',
    productCapacity: 100,
    currentStock: 100,
    lowStockThreshold: 20,
    phonepeIdentifier: '',
    razorpayIdentifier: '',
    simNumber: '',
    simOperator: '',
    businessMobileNumber: '',
    imei: '',
  });

  const { hasRole } = useAuth();

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await api.getMachines({
        search,
        status: statusFilter,
        city: cityFilter,
        page: page.toString(),
        limit: '10',
      });
      setMachines(res.items || []);
      setPagination(res.pagination || { totalPages: 1, totalItems: 0 });
      setSummary(res.summary || {});
    } catch (err) {
      console.error('Error fetching machines', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, [search, statusFilter, cityFilter, page]);

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setModalError(null);
    try {
      const payload = { ...newMachine };
      // Remove empty strings so they don't fail Zod's .min() validation
      if (!payload.phonepeIdentifier) delete (payload as any).phonepeIdentifier;
      if (!payload.razorpayIdentifier) delete (payload as any).razorpayIdentifier;
      if (!payload.simNumber) delete (payload as any).simNumber;
      if (!payload.simOperator) delete (payload as any).simOperator;
      if (!payload.businessMobileNumber) delete (payload as any).businessMobileNumber;
      if (!payload.imei) delete (payload as any).imei;
      
      // Also delete location, city, state if empty to avoid Zod min() errors
      if (!payload.location) delete (payload as any).location;
      if (!payload.city) delete (payload as any).city;
      if (!payload.state) delete (payload as any).state;

      await api.createMachine(payload);
      setShowAddModal(false);
      fetchMachines();
      setNewMachine({
        machineId: '',
        machineName: '',
        location: '',
        city: '',
        state: '',
        iotDeviceId: '',
        productCapacity: 100,
        currentStock: 100,
        lowStockThreshold: 20,
        phonepeIdentifier: '',
        razorpayIdentifier: '',
        simNumber: '',
        simOperator: '',
        imei: '',
      });
    } catch (err: any) {
      setModalError(err.message || 'Failed to register machine');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefillStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    setActionLoading(true);
    try {
      await api.refillStock(selectedMachine.id, { quantity: refillQty });
      setShowRefillModal(false);
      fetchMachines();
    } catch (err: any) {
      alert(`Refill failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title="Vending Machine Fleet Management" />

        <div className="pt-20 px-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Quick Filter Status Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
            <button
              onClick={() => { setStatusFilter('ALL'); setPage(1); }}
              className={`p-3 rounded-xl border text-left transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 border-pink-500/60 text-white shadow-md'
                  : 'glass-panel border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-500">All Machines</div>
              <div className="text-xl font-bold text-slate-100 mt-0.5">{summary.total ?? 0}</div>
            </button>

            <button
              onClick={() => { setStatusFilter('ONLINE'); setPage(1); }}
              className={`p-3 rounded-xl border text-left transition-all ${
                statusFilter === 'ONLINE'
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-md'
                  : 'glass-panel border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-emerald-500 flex items-center space-x-1">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Online</span>
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{summary.online ?? 0}</div>
            </button>

            <button
              onClick={() => { setStatusFilter('OFFLINE'); setPage(1); }}
              className={`p-3 rounded-xl border text-left transition-all ${
                statusFilter === 'OFFLINE'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-300 shadow-md'
                  : 'glass-panel border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-rose-500 flex items-center space-x-1">
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </div>
              <div className="text-xl font-bold text-rose-400 mt-0.5">{summary.offline ?? 0}</div>
            </button>

            <button
              onClick={() => { setStatusFilter('LOW_STOCK'); setPage(1); }}
              className={`p-3 rounded-xl border text-left transition-all ${
                statusFilter === 'LOW_STOCK'
                  ? 'bg-amber-950/40 border-amber-500 text-amber-300 shadow-md'
                  : 'glass-panel border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-amber-500 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Low Stock</span>
              </div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{summary.lowStock ?? 0}</div>
            </button>

            <button
              onClick={() => { setStatusFilter('OUT_OF_STOCK'); setPage(1); }}
              className={`p-3 rounded-xl border text-left transition-all ${
                statusFilter === 'OUT_OF_STOCK'
                  ? 'bg-slate-800 border-rose-500 text-white shadow-md'
                  : 'glass-panel border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <XCircle className="w-3 h-3 text-rose-400" />
                <span>Out of Stock</span>
              </div>
              <div className="text-xl font-bold text-slate-200 mt-0.5">{summary.outOfStock ?? 0}</div>
            </button>

            <button
              onClick={() => { setStatusFilter('DELETED'); setPage(1); }}
              className={`p-3 rounded-xl border text-left transition-all ${
                statusFilter === 'DELETED'
                  ? 'bg-slate-800 border-purple-500 text-white shadow-md'
                  : 'glass-panel border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <Trash className="w-3 h-3 text-purple-400" />
                <span>Recycle Bin</span>
              </div>
              <div className="text-xl font-bold text-slate-200 mt-0.5">{summary.deleted ?? 0}</div>
            </button>
          </div>

          {/* Search, Filter Bar & Add Machine */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search machine ID, location, name..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <select
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500"
              >
                <option value="ALL">All Cities</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="New Delhi">Delhi</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>

            {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Register Vending Machine</span>
              </button>
            )}
          </div>

          {/* Machines Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Machine ID</th>
                    <th className="py-3.5 px-4 font-semibold">Location</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold">Stock Level</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Today Dispensed</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Today Revenue</th>
                    <th className="py-3.5 px-4 font-semibold">Last Heartbeat</th>
                    <th className="py-3.5 px-4 font-semibold">SIM Card</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <div className="flex justify-center items-center space-x-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
                          <span>Loading machines...</span>
                        </div>
                      </td>
                    </tr>
                  ) : machines.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No vending machines match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    machines.map((m) => {
                      const fillPct = Math.round((m.currentStock / m.productCapacity) * 100);
                      return (
                        <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-pink-400">
                            <Link href={`/machines/${m.machineId}`} className="hover:underline flex items-center space-x-1">
                              <span>{m.machineId}</span>
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-200 font-semibold">{m.machineName}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{m.location}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                m.status === 'ONLINE'
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                              <span>{m.status}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="w-32">
                              <div className="flex justify-between text-[10px] mb-1">
                                <span className={m.isOutOfStock ? 'text-rose-400 font-bold' : m.isLowStock ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                                  {m.currentStock} / {m.productCapacity}
                                </span>
                                <span className="text-slate-500">{fillPct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    m.isOutOfStock
                                      ? 'bg-rose-500'
                                      : m.isLowStock
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${fillPct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                            {m.todayDispensed} pads
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                            ₹{m.todayRevenue}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-slate-400">
                            {m.lastSeen ? new Date(m.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1 min-w-[150px]">
                              {/* Operator badge */}
                              {m.simOperator ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${
                                  m.simOperator === 'Jio'    ? 'bg-blue-950/70 text-blue-300 border border-blue-500/30' :
                                  m.simOperator === 'Airtel' ? 'bg-red-950/70 text-red-300 border border-red-500/30' :
                                  m.simOperator === 'Vi'     ? 'bg-violet-950/70 text-violet-300 border border-violet-500/30' :
                                  m.simOperator === 'BSNL'   ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30' :
                                  'bg-slate-800 text-slate-300 border border-slate-600'
                                }`}>
                                  {m.simOperator}
                                </span>
                              ) : null}
                              {/* IoT Device ID */}
                              <div className="font-mono text-[10px] font-bold text-cyan-400 truncate max-w-[160px]" title={m.iotDeviceId}>
                                {m.iotDeviceId || '—'}
                              </div>
                              {/* SIM Number */}
                              {m.simNumber && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-[9px] uppercase font-bold text-slate-500">SIM</span>
                                  <span className="font-mono text-[10px] text-slate-300 truncate max-w-[140px]" title={m.simNumber}>
                                    {m.simNumber}
                                  </span>
                                </div>
                              )}
                              {/* IMEI */}
                              {m.imei && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-[9px] uppercase font-bold text-slate-500">IMEI</span>
                                  <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title={m.imei}>
                                    {m.imei}
                                  </span>
                                </div>
                              )}
                              {!m.simOperator && !m.simNumber && !m.imei && (
                                <div className="text-[10px] text-slate-600 italic">No SIM data</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <Link
                                href={`/machines/${m.machineId}`}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold transition-colors"
                              >
                                View
                              </Link>
                                {hasRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']) && (
                                  <>
                                    {statusFilter === 'DELETED' ? (
                                      <>
                                        <button
                                          onClick={() => {
                                            if (window.confirm('Are you sure you want to restore this machine?')) {
                                              api.restoreMachine(m.id).then(() => {
                                                fetchMachines();
                                              }).catch(err => alert('Failed to restore machine: ' + err.message));
                                            }
                                          }}
                                          title="Restore Machine"
                                          className="p-1 bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-400 text-slate-400 rounded-lg transition-colors"
                                        >
                                          <ArchiveRestore className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (window.confirm('WARNING: This will permanently delete the machine and ALL its data (payments, dispenses, stock). This cannot be undone. Are you absolutely sure?')) {
                                              api.deleteMachinePermanently(m.id).then(() => {
                                                fetchMachines();
                                              }).catch(err => alert('Failed to permanently delete machine: ' + err.message));
                                            }
                                          }}
                                          title="Permanently Delete Machine"
                                          className="p-1 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 rounded-lg transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => { setSelectedMachine(m); setShowRefillModal(true); }}
                                          title="Refill Stock"
                                          className="p-1 bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-400 text-slate-400 rounded-lg transition-colors"
                                        >
                                          <PackagePlus className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (window.confirm('Are you sure you want to move this machine to the recycle bin?')) {
                                              api.deleteMachine(m.id).then(() => {
                                                fetchMachines();
                                              }).catch(err => alert('Failed to delete machine: ' + err.message));
                                            }
                                          }}
                                          title="Delete Machine"
                                          className="p-1 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 rounded-lg transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </>
                              )}
                            </div>
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
                <div>Showing page {page} of {pagination.totalPages} ({pagination.totalItems} machines)</div>
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

        {/* Modal: Register Vending Machine */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-pink-400" />
                  <h2 className="text-base font-bold text-slate-100">Register New Vending Machine</h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {modalError && (
                <div className="p-3 mb-4 rounded-lg text-xs bg-rose-950/60 border border-rose-800 text-rose-300">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateMachine} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Machine ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. VM-DEL-0003"
                      required
                      value={newMachine.machineId}
                      onChange={(e) => setNewMachine({ ...newMachine, machineId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">IoT Device ID (Hardware) *</label>
                    <input
                      type="text"
                      placeholder="e.g. IOT-SIM7600-DEL-0003"
                      required
                      value={newMachine.iotDeviceId}
                      onChange={(e) => setNewMachine({ ...newMachine, iotDeviceId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Machine Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. IIT Delhi Hostel 4"
                    required
                    value={newMachine.machineName}
                    onChange={(e) => setNewMachine({ ...newMachine, machineName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Ground Floor Restroom Corridor"
                    value={newMachine.location}
                    onChange={(e) => setNewMachine({ ...newMachine, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. New Delhi"
                      value={newMachine.city}
                      onChange={(e) => setNewMachine({ ...newMachine, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">State</label>
                    <input
                      type="text"
                      placeholder="e.g. Delhi"
                      value={newMachine.state}
                      onChange={(e) => setNewMachine({ ...newMachine, state: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>
                </div>

                {/* Payment Mapping */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="font-bold text-pink-400">Payment & Business Account Details <span className="text-slate-500 font-normal text-[10px]">(Optional)</span></div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Business Mobile Number <span className="text-slate-500 font-normal">(Linked to PhonePe/Razorpay)</span></label>
                      <input
                        type="text"
                        placeholder="e.g. +91 9876543210"
                        value={newMachine.businessMobileNumber}
                        onChange={(e) => setNewMachine({ ...newMachine, businessMobileNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">PhonePe QR Code / Identifier</label>
                      <input
                        type="text"
                        placeholder="e.g. UPI VPA or QR Code string"
                        value={newMachine.phonepeIdentifier}
                        onChange={(e) => setNewMachine({ ...newMachine, phonepeIdentifier: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-purple-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Razorpay QR Code / Identifier</label>
                      <input
                        type="text"
                        placeholder="e.g. UPI VPA or QR Code string"
                        value={newMachine.razorpayIdentifier}
                        onChange={(e) => setNewMachine({ ...newMachine, razorpayIdentifier: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sky-300 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="font-bold text-sky-400">Connectivity Details <span className="text-slate-500 font-normal text-[10px]">(Optional)</span></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">SIM Number</label>
                      <input
                        type="text"
                        placeholder="e.g. +91 9876543210"
                        value={newMachine.simNumber}
                        onChange={(e) => setNewMachine({ ...newMachine, simNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">SIM Operator</label>
                      <input
                        type="text"
                        placeholder="e.g. Airtel IoT"
                        value={newMachine.simOperator}
                        onChange={(e) => setNewMachine({ ...newMachine, simOperator: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">IMEI Number</label>
                      <input
                        type="text"
                        placeholder="Hardware IMEI"
                        value={newMachine.imei}
                        onChange={(e) => setNewMachine({ ...newMachine, imei: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Capacity</label>
                    <input
                      type="number"
                      value={newMachine.productCapacity}
                      onChange={(e) => setNewMachine({ ...newMachine, productCapacity: parseInt(e.target.value, 10) || 100 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Current Stock</label>
                    <input
                      type="number"
                      value={newMachine.currentStock}
                      onChange={(e) => setNewMachine({ ...newMachine, currentStock: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Low Threshold</label>
                    <input
                      type="number"
                      value={newMachine.lowStockThreshold}
                      onChange={(e) => setNewMachine({ ...newMachine, lowStockThreshold: parseInt(e.target.value, 10) || 20 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg flex items-center space-x-1"
                  >
                    {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Machine</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Refill Stock */}
        {showRefillModal && selectedMachine && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <h3 className="text-base font-bold text-slate-100 mb-1">Refill Sanitary Napkins</h3>
              <p className="text-xs text-slate-400 mb-4">
                Machine: <span className="font-mono text-pink-400 font-bold">{selectedMachine.machineId}</span> ({selectedMachine.location})
              </p>

              <form onSubmit={handleRefillStock} className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Current Stock: <strong>{selectedMachine.currentStock}</strong></span>
                    <span>Max Capacity: <strong>{selectedMachine.productCapacity}</strong></span>
                  </div>
                  <label className="block text-slate-300 font-semibold mt-3 mb-1">Quantity to Add</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedMachine.productCapacity - selectedMachine.currentStock}
                    value={refillQty}
                    onChange={(e) => setRefillQty(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-bold"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRefillModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                  >
                    Confirm Refill
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
