import { Router, Response } from 'express';
import { db } from '../../data/store.js';
import { authenticate, AuthenticatedRequest } from '../auth/auth.middleware.js';
import { authorize } from '../auth/rbac.middleware.js';
import { AuditService } from '../audit/audit.service.js';

const router = Router();

// GET /api/v1/reconciliation - Discrepancy & exception list
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  // 1. Successful payments with failed or missing dispense
  const paymentWithoutDispense: any[] = [];
  const successfulPayments = db.payments.filter((p) => p.status === 'SUCCESS');

  for (const pay of successfulPayments) {
    const dispense = db.dispenses.find((d) => d.paymentId === pay.id);
    const machine = db.machines.find((m) => m.id === pay.machineId);

    if (!dispense) {
      paymentWithoutDispense.push({
        type: 'PAYMENT_WITHOUT_DISPENSE_RECORD',
        severity: 'CRITICAL',
        paymentId: pay.id,
        transactionId: pay.transactionId,
        gateway: pay.gateway,
        amount: pay.amount,
        createdAt: pay.createdAt,
        machineId: machine?.machineId || pay.machineId,
        machineName: machine?.machineName || 'Unknown',
        location: machine?.location || '',
        reason: 'Payment captured but no dispense transaction was initiated by controller',
        status: pay.status,
      });
    } else if (dispense.status !== 'SUCCESS') {
      paymentWithoutDispense.push({
        type: 'PAYMENT_SUCCESS_DISPENSE_FAILED',
        severity: 'CRITICAL',
        paymentId: pay.id,
        transactionId: pay.transactionId,
        dispenseId: dispense.dispenseId,
        gateway: pay.gateway,
        amount: pay.amount,
        createdAt: pay.createdAt,
        machineId: machine?.machineId || pay.machineId,
        machineName: machine?.machineName || 'Unknown',
        location: machine?.location || '',
        reason: `Payment succeeded (₹${pay.amount}), but physical motor reported: ${dispense.failureReason || dispense.status}`,
        dispenseStatus: dispense.status,
        deviceConfirmation: dispense.deviceConfirmation,
        suggestedAction: 'REFUND_CUSTOMER_OR_REMOTE_VEND',
      });
    }
  }

  // 2. Dispenses without payment
  const dispenseWithoutPayment: any[] = [];
  for (const disp of db.dispenses) {
    if (!disp.paymentId) {
      const machine = db.machines.find((m) => m.id === disp.machineId);
      dispenseWithoutPayment.push({
        type: 'DISPENSE_WITHOUT_PAYMENT',
        severity: 'WARNING',
        dispenseId: disp.dispenseId,
        status: disp.status,
        machineId: machine?.machineId || disp.machineId,
        machineName: machine?.machineName || 'Unknown',
        createdAt: disp.createdAt,
        reason: 'Dispense occurred without associated payment ID (possible manual test, coin, or bypass)',
      });
    }
  }

  // 3. Stock discrepancies
  const stockMismatches = db.stockTransactions
    .filter((s) => s.eventType === 'STOCK_MISMATCH')
    .map((s) => {
      const machine = db.machines.find((m) => m.id === s.machineId);
      return {
        type: 'STOCK_MISMATCH',
        severity: 'WARNING',
        transactionId: s.id,
        machineId: machine?.machineId || s.machineId,
        machineName: machine?.machineName || 'Unknown',
        location: machine?.location || '',
        previousStock: s.previousStock,
        reportedStock: s.newStock,
        difference: s.changeQuantity,
        reason: s.reason,
        createdAt: s.createdAt,
      };
    });

  return res.json({
    success: true,
    data: {
      summary: {
        paymentDispenseFailures: paymentWithoutDispense.length,
        dispenseWithoutPayments: dispenseWithoutPayment.length,
        stockMismatches: stockMismatches.length,
        totalExceptions:
          paymentWithoutDispense.length + dispenseWithoutPayment.length + stockMismatches.length,
      },
      paymentDispenseMismatches: paymentWithoutDispense,
      dispenseWithoutPayment,
      stockMismatches,
    },
  });
});

// POST /api/v1/reconciliation/resolve - Action taken on an exception
router.post('/resolve', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { paymentId, action, notes } = req.body; // action: 'REFUNDED' | 'MANUAL_DISPENSE_APPROVED' | 'DISMISSED'

  if (!paymentId || !action) {
    return res.status(400).json({ success: false, error: 'PAYMENT_ID_AND_ACTION_REQUIRED' });
  }

  const payment = db.payments.find((p) => p.id === paymentId || p.transactionId === paymentId);
  if (!payment) {
    return res.status(404).json({ success: false, error: 'PAYMENT_NOT_FOUND' });
  }

  const prevStatus = payment.status;
  if (action === 'REFUNDED') {
    payment.status = 'REFUNDED';
    payment.updatedAt = new Date().toISOString();
  }

  AuditService.record({
    userId: req.user?.id,
    action: `RECONCILIATION_${action}`,
    entity: 'Payment',
    entityId: payment.id,
    oldValues: { status: prevStatus },
    newValues: { status: payment.status, action, notes },
    metadata: { notes, performedBy: req.user?.name },
  });

  return res.json({
    success: true,
    message: `Payment ${payment.transactionId} resolved with action: ${action}`,
    data: {
      transactionId: payment.transactionId,
      newStatus: payment.status,
      action,
      notes,
    },
  });
});

export default router;
