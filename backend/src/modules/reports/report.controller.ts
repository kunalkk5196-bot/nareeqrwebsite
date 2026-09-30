import { Router, Response } from 'express';
import { db } from '../../data/store.js';
import { authenticate, AuthenticatedRequest } from '../auth/auth.middleware.js';

const router = Router();

// GET /api/v1/reports/summary - Aggregate metrics for reporting view
router.get('/summary', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate, machineId, gateway } = req.query as Record<string, string>;

  let payments = db.payments.filter((p) => p.status === 'SUCCESS');
  let dispenses = db.dispenses.filter((d) => d.status === 'SUCCESS');

  if (startDate) {
    payments = payments.filter((p) => p.createdAt >= startDate);
    dispenses = dispenses.filter((d) => d.createdAt >= startDate);
  }
  if (endDate) {
    payments = payments.filter((p) => p.createdAt <= `${endDate}T23:59:59.999Z`);
    dispenses = dispenses.filter((d) => d.createdAt <= `${endDate}T23:59:59.999Z`);
  }
  if (machineId && machineId !== 'ALL') {
    payments = payments.filter((p) => p.machineId === machineId || p.machineId === db.machines.find((m) => m.machineId === machineId)?.id);
    dispenses = dispenses.filter((d) => d.machineId === machineId || d.machineId === db.machines.find((m) => m.machineId === machineId)?.id);
  }
  if (gateway && gateway !== 'ALL') {
    payments = payments.filter((p) => p.gateway === gateway);
  }

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPads = dispenses.length;
  const phonepeRev = payments.filter((p) => p.gateway === 'PHONEPE').reduce((sum, p) => sum + p.amount, 0);
  const razorpayRev = payments.filter((p) => p.gateway === 'RAZORPAY').reduce((sum, p) => sum + p.amount, 0);

  return res.json({
    success: true,
    data: {
      totalRevenue,
      totalPadsDispensed: totalPads,
      phonepeRevenue: phonepeRev,
      razorpayRevenue: razorpayRev,
      transactionsCount: payments.length,
      averageOrderValue: payments.length > 0 ? (totalRevenue / payments.length).toFixed(2) : 0,
    },
  });
});

// GET /api/v1/reports/export - Export transactions or machine reports as CSV or JSON
router.get('/export', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { type = 'transactions', format = 'csv', startDate, endDate } = req.query as Record<string, string>;

  if (type === 'transactions') {
    let payments = [...db.payments];
    if (startDate) payments = payments.filter((p) => p.createdAt >= startDate);
    if (endDate) payments = payments.filter((p) => p.createdAt <= `${endDate}T23:59:59.999Z`);

    if (format === 'csv') {
      const headers = ['Transaction ID', 'Machine ID', 'Location', 'Gateway', 'Amount (INR)', 'Status', 'Provider Txn ID', 'Dispense Status', 'Date'];
      const rows = payments.map((p) => {
        const machine = db.machines.find((m) => m.id === p.machineId);
        const dispense = db.dispenses.find((d) => d.paymentId === p.id);
        return [
          p.transactionId,
          machine?.machineId || p.machineId,
          `"${(machine?.location || '').replace(/"/g, '""')}"`,
          p.gateway,
          p.amount,
          p.status,
          p.providerTxnId || 'N/A',
          dispense?.status || 'N/A',
          p.createdAt,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="naree_transactions_report_${Date.now()}.csv"`);
      return res.send(csvContent);
    }

    return res.json({ success: true, data: payments });
  }

  if (type === 'machines') {
    const headers = ['Machine ID', 'Name', 'Location', 'City', 'Status', 'Current Stock', 'Capacity', 'Last Seen'];
    const rows = db.machines.map((m) => [
      m.machineId,
      `"${m.machineName.replace(/"/g, '""')}"`,
      `"${m.location.replace(/"/g, '""')}"`,
      m.city,
      m.status,
      m.currentStock,
      m.productCapacity,
      m.lastSeen || 'Never',
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="naree_machines_inventory_report_${Date.now()}.csv"`);
    return res.send(csvContent);
  }

  return res.status(400).json({ success: false, error: 'UNKNOWN_REPORT_TYPE' });
});

export default router;
