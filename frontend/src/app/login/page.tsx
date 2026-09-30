'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Lock, Mail, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.login({ email, password });
      login(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-indigo-600 shadow-xl shadow-pink-500/25 mb-4">
            <Radio className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            NAREE <span className="bg-gradient-to-r from-pink-400 to-rose-300 bg-clip-text text-transparent">VendTrack</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            IoT Sanitary Napkin Vending Machine Central Command
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800/80">
          {error && (
            <div className="p-3 mb-5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@naree.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-pink-600/25 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold mb-3">
              <Shield className="w-3.5 h-3.5 text-pink-400" />
              <span>Quick Demo Role Logins (Pre-seeded):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('superadmin@naree.com')}
                className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-lg text-slate-300 text-left transition-colors"
              >
                <div className="font-bold text-purple-300">Super Admin</div>
                <div className="text-[10px] text-slate-500">Full System Control</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin@naree.com')}
                className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-lg text-slate-300 text-left transition-colors"
              >
                <div className="font-bold text-blue-300">Operations Admin</div>
                <div className="text-[10px] text-slate-500">Machines & Reports</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('operator@naree.com')}
                className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-slate-300 text-left transition-colors"
              >
                <div className="font-bold text-emerald-300">Refill Operator</div>
                <div className="text-[10px] text-slate-500">Stock Refills</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('viewer@naree.com')}
                className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-500/50 rounded-lg text-slate-300 text-left transition-colors"
              >
                <div className="font-bold text-slate-300">Analytics Viewer</div>
                <div className="text-[10px] text-slate-500">Read-only Telemetry</div>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          Naree VendTrack System • Production IoT Ready • PhonePe & Razorpay Static QR
        </div>
      </div>
    </div>
  );
}
