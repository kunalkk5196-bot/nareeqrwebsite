'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  CreditCard,
  QrCode,
  PackageCheck,
  Boxes,
  Scale,
  FileBarChart2,
  Bell,
  Users,
  ShieldAlert,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Machines', href: '/machines', icon: Server },
    { label: 'Payments', href: '/payments', icon: CreditCard },
    { label: 'QR Activity', href: '/qr-activity', icon: QrCode },
    { label: 'Dispensing', href: '/dispensing', icon: PackageCheck },
    { label: 'Stock & Refill', href: '/stock', icon: Boxes },
    { label: 'Reconciliation', href: '/reconciliation', icon: Scale, highlight: true },
    { label: 'Reports', href: '/reports', icon: FileBarChart2 },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    ...(hasRole(['ADMIN', 'SUPER_ADMIN'])
      ? [
          { label: 'Users & Roles', href: '/users', icon: Users },
          { label: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert },
        ]
      : []),
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-pink-950/70 text-pink-300 border-pink-500/40';
      case 'ADMIN':
        return 'bg-blue-950/70 text-blue-300 border-blue-500/40';
      case 'OPERATOR':
        return 'bg-teal-950/70 text-teal-300 border-teal-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <aside className="w-64 bg-[#090f1d] border-r border-slate-800/80 flex flex-col h-screen fixed top-0 left-0 z-40 shadow-2xl">
      {/* Brand Header with Official Company Logo */}
      <div className="p-4 border-b border-slate-800/80 bg-gradient-to-b from-[#0e172a] to-[#090f1d]">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          {/* Logo container with white backdrop pill so the official colors pop brilliantly */}
          <div className="relative w-12 h-12 rounded-xl bg-white p-1 shadow-md shadow-pink-500/10 border border-pink-100 flex-shrink-0 group-hover:scale-105 group-hover:shadow-pink-500/30 transition-all duration-300">
            <img
              src="/naree-logo.png"
              alt="Naree Foundation Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="overflow-hidden">
            <div className="font-extrabold text-sm tracking-tight flex items-center space-x-1">
              <span className="text-rose-500">Naree</span>
              <span className="text-slate-100">Foundation</span>
            </div>
            <div className="text-[9px] font-bold tracking-wider text-teal-400 uppercase">
              Empower • Educate • Elevate
            </div>
            <div className="text-[9px] font-mono text-slate-400">
              VendTrack IoT Platform
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Operations & Fleet
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-900 text-rose-300 border-l-4 border-rose-500 shadow-md shadow-rose-950/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:translate-x-1'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-rose-400' : 'text-slate-400 group-hover:text-rose-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.highlight && (
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Session Footer */}
      {user && (
        <div className="p-3.5 border-t border-slate-800/80 bg-[#070b16]">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden mr-2">
              <div className="text-xs font-bold text-slate-200 truncate flex items-center space-x-1">
                <span>{user.name}</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              <span
                className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${getRoleBadgeColor(
                  user.role
                )}`}
              >
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              title="Log Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
