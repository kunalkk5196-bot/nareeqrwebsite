'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldCheck, Zap, Radio, Sliders, RefreshCw } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offlineTimeout, setOfflineTimeout] = useState('300');
  const [lowStockThresh, setLowStockThresh] = useState('20');
  const [paymentMode, setPaymentMode] = useState('mock');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { hasRole } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      setData(res);
      if (res?.runtimeConfig) {
        setOfflineTimeout(res.runtimeConfig.offlineTimeoutSeconds?.toString() || '300');
        setLowStockThresh(res.runtimeConfig.lowStockThreshold?.toString() || '20');
        setPaymentMode(res.runtimeConfig.paymentProviderMode || 'mock');
      }
    } catch (err) {
      console.error('Error loading settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    try {
      await api.updateSettings({
        offlineTimeoutSeconds: parseInt(offlineTimeout, 10),
        lowStockThreshold: parseInt(lowStockThresh, 10),
        paymentProviderMode: paymentMode,
      });
      setSaveMessage('System settings updated successfully!');
      fetchSettings();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col pb-16">
        <Header title="Fleet & Gateway System Configuration" />

        <div className="pt-20 px-8 max-w-4xl mx-auto w-full space-y-6">
          {saveMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              ✓ {saveMessage}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Fleet & IoT Parameters */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-slate-200 pb-3 border-b border-slate-800">
                <Radio className="w-5 h-5 text-pink-400" />
                <h2 className="text-base font-bold">IoT Fleet Telemetry Parameters</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Machine Offline Timeout (Seconds) *
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Time without heartbeat before marking machine OFFLINE (Default: 300s / 5 min).
                  </p>
                  <input
                    type="number"
                    min="30"
                    step="10"
                    required
                    value={offlineTimeout}
                    onChange={(e) => setOfflineTimeout(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Default Low Stock Alert Threshold *
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Trigger warning notification when remaining napkins fall to or below this count.
                  </p>
                  <input
                    type="number"
                    min="1"
                    required
                    value={lowStockThresh}
                    onChange={(e) => setLowStockThresh(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Payment Mode & Gateway Configuration */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-slate-200 pb-3 border-b border-slate-800">
                <Zap className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold">Payment Gateway Mode & Environment</h2>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Payment Provider Operational Mode
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    In &apos;mock&apos; mode, simulated webhooks can be triggered without live bank credentials. In &apos;production&apos;, real SHA256 / HMAC-SHA256 signatures are enforced.
                  </p>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-bold"
                  >
                    <option value="mock">MOCK (Local Sandbox &amp; Simulation)</option>
                    <option value="production">PRODUCTION (Live PhonePe &amp; Razorpay)</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-slate-300">Active Gateway Credentials (Masked):</div>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500">PhonePe Merchant: </span>
                      <span className="text-purple-300">{data?.runtimeConfig?.phonepeMerchantId || 'MERCHANT_NAREE_001'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Razorpay Key: </span>
                      <span className="text-sky-300">{data?.runtimeConfig?.razorpayKeyIdMasked || 'rzp_test_...'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {hasRole(['SUPER_ADMIN']) && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-600/25 flex items-center space-x-2 transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save System Settings</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
