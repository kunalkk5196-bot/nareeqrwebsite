import { Router, Response } from 'express';
import { db } from '../../data/store.js';
import { authenticate, AuthenticatedRequest } from '../auth/auth.middleware.js';
import { config } from '../../config/index.js';

const router = Router();

// GET /api/v1/dashboard - Summary cards and high-level KPIs
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  db.updateMachineStatuses(config.iot.offlineTimeoutSeconds);

  const today = new Date().toISOString().split('T')[0];

  const activeMachines = db.machines.filter((m: any) => !m.isDeleted);
  const totalMachines = activeMachines.length;
  const onlineMachines = activeMachines.filter((m) => m.status === 'ONLINE').length;
  const offlineMachines = activeMachines.filter((m) => m.status === 'OFFLINE').length;
  const lowStockMachines = activeMachines.filter(
    (m) => m.currentStock > 0 && m.currentStock <= m.lowStockThreshold
  ).length;
  const outOfStockMachines = activeMachines.filter((m) => m.currentStock === 0).length;

  // Payments today
  const todayPayments = db.payments.filter((p) => p.createdAt.startsWith(today));
  const todaySuccessfulPayments = todayPayments.filter((p) => p.status === 'SUCCESS').length;
  const todayFailedPayments = todayPayments.filter((p) => p.status === 'FAILED').length;
  const todayRevenue = todayPayments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  // Gateway revenues (All-time and Today)
  const phonepeRevenue = db.payments
    .filter((p) => p.gateway === 'PHONEPE' && p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const razorpayRevenue = db.payments
    .filter((p) => p.gateway === 'RAZORPAY' && p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const phonepeTodayRevenue = todayPayments
    .filter((p) => p.gateway === 'PHONEPE' && p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const razorpayTodayRevenue = todayPayments
    .filter((p) => p.gateway === 'RAZORPAY' && p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  // Dispenses today
  const todayDispenses = db.dispenses.filter(
    (d) => d.status === 'SUCCESS' && d.createdAt.startsWith(today)
  ).length;

  const totalDispenses = db.dispenses.filter((d) => d.status === 'SUCCESS').length;

  // QR scans today (Handling availability strictly per Section 4 & 21)
  const todayQrScansList = db.qrActivities.filter(
    (q) => q.createdAt.startsWith(today) && q.scanCount !== null && q.scanCount !== undefined
  );
  const isScanDataAvailable = todayQrScansList.length > 0;
  const todayQrScans = isScanDataAvailable
    ? todayQrScansList.reduce((acc, curr) => acc + (curr.scanCount || 0), 0)
    : null;

  // Payment success rate
  const allVerifiedAttempts = db.payments.filter((p) => p.status === 'SUCCESS' || p.status === 'FAILED');
  const paymentSuccessRate = allVerifiedAttempts.length > 0
    ? ((db.payments.filter((p) => p.status === 'SUCCESS').length / allVerifiedAttempts.length) * 100).toFixed(1)
    : '100.0';

  // Dispense success vs payment success anomaly check
  const successfulPaymentsCount = db.payments.filter((p) => p.status === 'SUCCESS').length;
  const failedDispensesCount = db.dispenses.filter((d) => d.status !== 'SUCCESS').length;

  return res.json({
    success: true,
    data: {
      cards: {
        totalMachines,
        onlineMachines,
        offlineMachines,
        lowStockMachines,
        outOfStockMachines,
        todayQrScans: isScanDataAvailable ? todayQrScans : 'Unavailable',
        isScanDataAvailable,
        todaySuccessfulPayments,
        todayFailedPayments,
        todayPadsDispensed: todayDispenses,
        todayRevenue,
        totalRevenue: phonepeRevenue + razorpayRevenue,
        totalPadsDispensed: totalDispenses,
        phonepeRevenue,
        razorpayRevenue,
        phonepeTodayRevenue,
        razorpayTodayRevenue,
        paymentSuccessRate: parseFloat(paymentSuccessRate),
        successfulPaymentsCount,
        failedDispensesCount,
      },
    },
  });
});

// GET /api/v1/dashboard/charts - Timeseries and distribution data for charts
router.get('/charts', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { period = '7d' } = req.query as { period?: string };

  const daysCount = period === 'today' ? 1 : period === '30d' ? 30 : period === '3m' ? 90 : 7;
  const dailyData: { date: string; label: string; revenue: number; phonepe: number; razorpay: number; padsDispensed: number }[] = [];

  const now = new Date();
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

    const dayPayments = db.payments.filter((p) => p.createdAt.startsWith(dateStr) && p.status === 'SUCCESS');
    const phRev = dayPayments.filter((p) => p.gateway === 'PHONEPE').reduce((sum, p) => sum + p.amount, 0);
    const rzRev = dayPayments.filter((p) => p.gateway === 'RAZORPAY').reduce((sum, p) => sum + p.amount, 0);
    const pads = db.dispenses.filter((disp) => disp.createdAt.startsWith(dateStr) && disp.status === 'SUCCESS').length;

    dailyData.push({
      date: dateStr,
      label,
      revenue: phRev + rzRev,
      phonepe: phRev,
      razorpay: rzRev,
      padsDispensed: pads,
    });
  }

  // Payment gateway distribution
  const totalPhonepePayments = db.payments.filter((p) => p.gateway === 'PHONEPE' && p.status === 'SUCCESS');
  const totalRazorpayPayments = db.payments.filter((p) => p.gateway === 'RAZORPAY' && p.status === 'SUCCESS');

  const gatewayDistribution = [
    {
      gateway: 'PhonePe',
      amount: totalPhonepePayments.reduce((sum, p) => sum + p.amount, 0),
      count: totalPhonepePayments.length,
      fill: '#5f259f', // PhonePe brand purple
    },
    {
      gateway: 'Razorpay',
      amount: totalRazorpayPayments.reduce((sum, p) => sum + p.amount, 0),
      count: totalRazorpayPayments.length,
      fill: '#0c2340', // Razorpay dark navy
    },
  ];

  const activeMachines = db.machines.filter((m: any) => !m.isDeleted);

  // Machine factual rankings
  const machinePerformance = activeMachines.map((m) => {
    const mDispenses = db.dispenses.filter((d) => d.machineId === m.id && d.status === 'SUCCESS').length;
    const mPayments = db.payments.filter((p) => p.machineId === m.id && p.status === 'SUCCESS');
    const mRev = mPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      machineId: m.machineId,
      machineName: m.machineName,
      location: m.location,
      city: m.city,
      padsDispensed: mDispenses,
      revenue: mRev,
      transactions: mPayments.length,
      status: m.status,
      currentStock: m.currentStock,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Machine status counts
  const machineStatusCounts = [
    { name: 'Online', count: activeMachines.filter((m) => m.status === 'ONLINE').length, color: '#10b981' },
    { name: 'Offline', count: activeMachines.filter((m) => m.status === 'OFFLINE').length, color: '#ef4444' },
    { name: 'Low Stock', count: activeMachines.filter((m) => m.currentStock > 0 && m.currentStock <= m.lowStockThreshold).length, color: '#f59e0b' },
    { name: 'Out of Stock', count: activeMachines.filter((m) => m.currentStock === 0).length, color: '#6b7280' },
  ];

  return res.json({
    success: true,
    data: {
      dailyTimeseries: dailyData,
      gatewayDistribution,
      machinePerformance,
      machineStatusCounts,
    },
  });
});

export default router;
