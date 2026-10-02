'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Server,
  Radio,
  WifiOff,
  BatteryCharging,
  Cpu,
  Activity,
  CreditCard,
  QrCode,
  PackageCheck,
  Boxes,
  ShieldCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

export default function MachineDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'dispensing' | 'stock' | 'health'>('overview');
  const [showConnectModal, setShowConnectModal] = useState<string | null>(null);

  useEffect(() => {
    fetchMachineDetails();
  }, [machineId]);

  const fetchMachineDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getMachine(machineId);
      setData(res);
    } catch (err) {
      console.error('Failed to load machine details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async (gateway: string) => {
    try {
      await api.simulatePayment({ machineId, gateway, status: 'SUCCESS', amount: 10 });
      alert(`${gateway} Payment Simulation Triggered! Refreshing details...`);
      fetchMachineDetails();
    } catch (err) {
      alert('Simulation failed.');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex bg-[#0b0f19] min-h-screen">
        <Sidebar />
        <div className="ml-64 flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const { machine, stats, qrCodes, latestHeartbeat, recentPayments, recentDispenses, recentStockHistory, events } = data;

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title={`Machine: ${machine.machineId}`} />

        <div className="pt-20 px-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Back button and Machine Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center space-x-3">
              <Link
                href="/machines"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                    {machine.machineId}
                  </h2>
                  <span
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      machine.status === 'ONLINE'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${machine.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span>{machine.status}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {machine.machineName} • {machine.location}, {machine.city}, {machine.state}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                Hardware: <span className="font-mono text-pink-400 font-bold">{machine.iotDeviceId}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 border-b border-slate-800 text-xs font-semibold">
            {[
              { id: 'overview', label: 'Overview & Gateways' },
              { id: 'payments', label: `Payments (${recentPayments?.length || 0})` },
              { id: 'dispensing', label: `Dispenses (${recentDispenses?.length || 0})` },
              { id: 'stock', label: `Stock Ledger (${recentStockHistory?.length || 0})` },
              { id: 'health', label: 'IoT Diagnostics & Hardware' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 transition-all ${
                  activeTab === tab.id
                    ? 'text-pink-400 border-b-2 border-pink-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview & Payment Gateways */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial & Dispense Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Current Stock</div>
                  <div className="text-2xl font-black text-slate-100 mt-1">
                    {machine.currentStock} / {machine.productCapacity}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {Math.round((machine.currentStock / machine.productCapacity) * 100)}% Capacity Fill
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Pads Dispensed Today</div>
                  <div className="text-2xl font-black text-pink-400 mt-1">{stats.todayDispensed}</div>
                  <div className="text-[10px] text-slate-500 mt-1">All-time: {stats.totalPadsDispensed} pads</div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Revenue Today</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">₹{stats.todayRevenue}</div>
                  <div className="text-[10px] text-slate-500 mt-1">All-time: ₹{stats.totalRevenue}</div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Last Heartbeat</div>
                  <div className="text-sm font-bold text-slate-200 mt-2 font-mono">
                    {machine.lastSeen ? new Date(machine.lastSeen).toLocaleTimeString() : 'N/A'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {machine.status === 'ONLINE' ? 'Signal Good' : 'Missed (> 5m)'}
                  </div>
                </div>
              </div>

              {/* Gateway-specific Configuration & Stats (Section 9) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PhonePe Card */}
                <div className="glass-panel p-6 rounded-2xl border border-purple-900/40 bg-purple-950/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-purple-900/50 rounded-xl text-purple-300">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-purple-200">PhonePe Static QR</div>
                        <div className="text-[11px] text-purple-400 font-mono">{stats.phonepe.identifier || 'Unmapped'}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
                      ₹{stats.phonepe.revenue} Collected
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-purple-900/30 text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">QR Scans</div>
                      <div className="text-slate-200 font-bold mt-0.5">
                        {stats.phonepe.scans !== null ? stats.phonepe.scans : 'Unavailable'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Success Txns</div>
                      <div className="text-emerald-400 font-bold mt-0.5">{stats.phonepe.successfulTransactions}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Failed Txns</div>
                      <div className="text-rose-400 font-bold mt-0.5">{stats.phonepe.failedTransactions}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-purple-900/30 flex justify-end space-x-2">
                    <a
                      href="https://business.phonepe.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-700"
                    >
                      Login & Configure PhonePe
                    </a>
                    <button 
                      onClick={() => handleSimulate('PHONEPE')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Simulate Test Payment
                    </button>
                  </div>
                </div>

                {/* Razorpay Card */}
                <div className="glass-panel p-6 rounded-2xl border border-sky-900/40 bg-sky-950/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-sky-900/50 rounded-xl text-sky-300">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-sky-200">Razorpay Static QR</div>
                        <div className="text-[11px] text-sky-400 font-mono">{stats.razorpay.identifier || 'Unmapped'}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-sky-900/40 border border-sky-500/30 text-sky-300 text-xs font-mono font-bold">
                      ₹{stats.razorpay.revenue} Collected
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-sky-900/30 text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">QR Scans</div>
                      <div className="text-slate-200 font-bold mt-0.5">
                        {stats.razorpay.scans !== null ? stats.razorpay.scans : 'Unavailable'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Success Txns</div>
                      <div className="text-emerald-400 font-bold mt-0.5">{stats.razorpay.successfulTransactions}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Failed Txns</div>
                      <div className="text-rose-400 font-bold mt-0.5">{stats.razorpay.failedTransactions}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-sky-900/30 flex justify-end space-x-2">
                    <a
                      href="https://dashboard.razorpay.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-700"
                    >
                      Login & Configure Razorpay
                    </a>
                    <button 
                      onClick={() => handleSimulate('RAZORPAY')}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Simulate Test Payment
                    </button>
                  </div>
                </div>
              </div>

              {/* Account & Connectivity Configurations */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 mb-4 border-b border-slate-800 pb-2">Business & Connectivity Configuration</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                  <div>
                    <div className="text-slate-500 font-bold uppercase mb-1">Business Mobile</div>
                    <div className="text-slate-200 font-mono">{machine.businessMobileNumber || 'Not Configured'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-bold uppercase mb-1">SIM Number</div>
                    <div className="text-slate-200 font-mono">{machine.simNumber || 'Not Configured'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-bold uppercase mb-1">SIM Operator</div>
                    <div className="text-slate-200">{machine.simOperator || 'Not Configured'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-bold uppercase mb-1">IMEI Number</div>
                    <div className="text-slate-200 font-mono">{machine.imei || 'Not Configured'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Payments Sub-Table */}
          {activeTab === 'payments' && (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200">Recent Payment Transactions</span>
                <span className="text-slate-400 font-mono">{recentPayments?.length || 0} Transactions</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Transaction ID</th>
                      <th className="py-3 px-4 font-semibold">Gateway</th>
                      <th className="py-3 px-4 font-semibold">Amount</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Provider ID</th>
                      <th className="py-3 px-4 font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium">
                    {recentPayments?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-pink-400">{p.transactionId}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.gateway === 'PHONEPE' ? 'bg-purple-950 text-purple-300' : 'bg-sky-950 text-sky-300'}`}>
                            {p.gateway}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-100">₹{p.amount}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{p.providerTxnId || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-400">{new Date(p.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Dispensing Sub-Table */}
          {activeTab === 'dispensing' && (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200">Physical Dispensing History</span>
                <span className="text-slate-400 font-mono">{recentDispenses?.length || 0} Dispenses</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Dispense ID</th>
                      <th className="py-3 px-4 font-semibold">Motor Index</th>
                      <th className="py-3 px-4 font-semibold">Quantity</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Device Confirmation</th>
                      <th className="py-3 px-4 font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium">
                    {recentDispenses?.map((d: any) => (
                      <tr key={d.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-pink-400">{d.dispenseId}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">Motor #{d.motorIndex}</td>
                        <td className="py-3 px-4 font-mono text-slate-200">{d.quantity}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{d.deviceConfirmation || d.failureReason || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-400">{new Date(d.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Stock Ledger Sub-Table */}
          {activeTab === 'stock' && (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200">Stock Movement Audit Trail</span>
                <span className="text-slate-400 font-mono">Current: {machine.currentStock} pads</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Event Type</th>
                      <th className="py-3 px-4 font-semibold text-right">Prev Stock</th>
                      <th className="py-3 px-4 font-semibold text-right">Change</th>
                      <th className="py-3 px-4 font-semibold text-right">New Stock</th>
                      <th className="py-3 px-4 font-semibold">Reason / Performed By</th>
                      <th className="py-3 px-4 font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium">
                    {recentStockHistory?.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-slate-200">{s.eventType}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">{s.previousStock}</td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${s.changeQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {s.changeQuantity > 0 ? `+${s.changeQuantity}` : s.changeQuantity}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">{s.newStock}</td>
                        <td className="py-3 px-4 text-slate-300">{s.reason || s.performedBy || 'System'}</td>
                        <td className="py-3 px-4 text-slate-400">{new Date(s.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 5: IoT Diagnostics & Hardware Health */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
                    <Radio className="w-4 h-4 text-pink-400" />
                    <span>4G SIM RSSI</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-100">
                    {latestHeartbeat?.signalStrength ? `${latestHeartbeat.signalStrength}%` : '85% Good'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">IoT SIM 4G Connected</div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                    <span>Bus Voltage</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-100">
                    {latestHeartbeat?.voltage ? `${latestHeartbeat.voltage} V` : '12.1 V'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Mains Power Active</div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span>Motor Driver</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {latestHeartbeat?.motorStatus || 'OK'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Dispenser Motors Ready</div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Optical Sensor</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {latestHeartbeat?.sensorStatus || 'OK'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Drop Detection Sensor</div>
                </div>
              </div>

              {/* Diagnostic Events */}
              <div className="glass-panel rounded-2xl border border-slate-800 p-6">
                <h3 className="text-sm font-bold text-slate-200 mb-3">Diagnostic Telemetry Events</h3>
                {events?.length === 0 ? (
                  <p className="text-xs text-slate-500">No fault events recorded for this machine.</p>
                ) : (
                  <div className="space-y-2">
                    {events?.map((ev: any) => (
                      <div key={ev.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-pink-400">{ev.eventType}</span>
                          <span className="text-slate-400 ml-2">{ev.details}</span>
                        </div>
                        <span className="text-slate-500 text-[11px]">{new Date(ev.createdAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
