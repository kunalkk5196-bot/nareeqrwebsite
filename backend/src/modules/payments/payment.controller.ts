import { Router, Response } from 'express';
import { db } from '../../data/store.js';
import { authenticate, AuthenticatedRequest } from '../auth/auth.middleware.js';
import { PaymentService } from './payment.service.js';
import { phonePeService } from './providers/phonepe.service.js';
import { razorpayService } from './providers/razorpay.service.js';

const router = Router();

// GET /api/v1/payments - List payments with filters & search
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const {
    search,
    machineId,
    gateway,
    status,
    startDate,
    endDate,
    page = '1',
    limit = '10',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query as Record<string, string>;

  let filtered = [...db.payments];

  // Search by transactionId, providerTxnId, machineId
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((p) => {
      const machine = db.machines.find((m) => m.id === p.machineId);
      return (
        p.transactionId.toLowerCase().includes(q) ||
        (p.providerTxnId && p.providerTxnId.toLowerCase().includes(q)) ||
        (machine && machine.machineId.toLowerCase().includes(q)) ||
        (machine && machine.machineName.toLowerCase().includes(q))
      );
    });
  }

  // Filter by machine
  if (machineId && machineId !== 'ALL') {
    filtered = filtered.filter((p) => p.machineId === machineId || p.machineId === db.machines.find(m => m.machineId === machineId)?.id);
  }

  // Filter by gateway (PHONEPE, RAZORPAY)
  if (gateway && gateway !== 'ALL') {
    filtered = filtered.filter((p) => p.gateway === gateway);
  }

  // Filter by status (SUCCESS, FAILED, PENDING, CANCELLED, REFUNDED)
  if (status && status !== 'ALL') {
    filtered = filtered.filter((p) => p.status === status);
  }

  // Filter by date range
  if (startDate) {
    filtered = filtered.filter((p) => p.createdAt >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((p) => p.createdAt <= `${endDate}T23:59:59.999Z`);
  }

  // Sort
  filtered.sort((a: any, b: any) => {
    const valA = a[sortBy] ?? '';
    const valB = b[sortBy] ?? '';
    if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
    if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
    return 0;
  });

  // Enrich with machine and dispense info
  const enriched = filtered.map((p) => {
    const machine = db.machines.find((m) => m.id === p.machineId);
    const dispense = db.dispenses.find((d) => d.paymentId === p.id);
    return {
      ...p,
      machineIdCode: machine?.machineId || p.machineId,
      machineName: machine?.machineName || 'Unknown Machine',
      location: machine?.location || '',
      dispenseStatus: dispense ? dispense.status : 'NONE',
      dispenseId: dispense?.dispenseId || null,
    };
  });

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = enriched.slice(startIndex, startIndex + limitNum);

  return res.json({
    success: true,
    data: {
      items: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / limitNum),
      },
      summary: {
        totalAmount: filtered.filter((p) => p.status === 'SUCCESS').reduce((sum, p) => sum + p.amount, 0),
        successCount: filtered.filter((p) => p.status === 'SUCCESS').length,
        failedCount: filtered.filter((p) => p.status === 'FAILED').length,
        pendingCount: filtered.filter((p) => p.status === 'PENDING').length,
      },
    },
  });
});

// GET /api/v1/payments/:id - Details of single payment
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const payment = db.payments.find((p) => p.id === req.params.id || p.transactionId === req.params.id);
  if (!payment) {
    return res.status(404).json({ success: false, error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found.' } });
  }

  const machine = db.machines.find((m) => m.id === payment.machineId);
  const dispense = db.dispenses.find((d) => d.paymentId === payment.id);
  const webhooks = db.webhooks.filter((w) => w.paymentId === payment.id);

  return res.json({
    success: true,
    data: {
      payment,
      machine,
      dispense,
      webhooks,
    },
  });
});

// POST /api/v1/payments/:id/verify-live - Manual server-side status inquiry against official gateway
router.post('/:id/verify-live', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const payment = db.payments.find((p) => p.id === req.params.id || p.transactionId === req.params.id);
  if (!payment) {
    return res.status(404).json({ success: false, error: 'PAYMENT_NOT_FOUND' });
  }

  const service = payment.gateway === 'PHONEPE' ? phonePeService : razorpayService;
  const result = await service.checkPaymentStatus(payment.providerTxnId || payment.transactionId);

  return res.json({
    success: true,
    data: {
      gatewayStatus: result.status,
      isValid: result.isValid,
      failureReason: result.failureReason,
      rawResponse: result.rawResponse,
    },
  });
});

// POST /api/v1/payments/simulate - Test Harness for Development & Demo (Section 39)
router.post('/simulate', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { machineId, gateway = 'PHONEPE', status = 'SUCCESS', amount = 10 } = req.body;

    const machine = db.machines.find((m) => m.id === machineId || m.machineId === machineId);
    if (!machine) {
      return res.status(404).json({ success: false, error: 'MACHINE_NOT_FOUND' });
    }

    const qr = db.qrIdentifiers.find((q) => q.machineId === machine.id && q.gateway === gateway);
    const qrIdentifier = qr ? qr.identifier : `${gateway}-${machine.machineId}`;

    const mockPayload = {
      transactionId: `TXN-SIM-${Date.now()}`,
      providerTxnId: gateway === 'PHONEPE' ? `T${Date.now()}` : `pay_sim_${Date.now()}`,
      amount: parseFloat(amount),
      status,
      qrIdentifier,
      machineId: machine.machineId,
      failureReason: status === 'FAILED' ? 'SIMULATED_USER_CANCELLED_OR_TIMEOUT' : undefined,
    };

    const outcome = await PaymentService.processWebhook({
      gateway,
      rawBody: JSON.stringify(mockPayload),
      signature: 'simulated_test_signature',
      idempotencyHeader: `sim-key-${Date.now()}`,
    });

    return res.json({
      success: true,
      message: 'Simulated payment processed successfully',
      data: outcome,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
