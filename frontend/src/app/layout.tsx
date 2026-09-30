import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'NAREE VendTrack — Sanitary Napkin Vending Machine IoT Management Platform',
  description:
    'Industrial IoT management system for sanitary napkin vending machines. Real-time telemetry, PhonePe and Razorpay static QR tracking, stock monitoring, dispensing control, and financial reconciliation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f19] text-slate-100 antialiased selection:bg-pink-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
