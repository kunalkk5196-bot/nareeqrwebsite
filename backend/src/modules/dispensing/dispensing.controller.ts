import { Router, Response } from 'express';
import { db } from '../../data/store.js';
import { authenticate, AuthenticatedRequest } from '../auth/auth.middleware.js';

const router = Router();

// GET /api/v1/dispensing - Dispensing transactions ledger
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const {
    machineId,
    status, // SUCCESS, FAILED, JAMMED, TIMEOUT
    page = '1',
    limit = '10',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query as Record<string, string>;

  let filtered = [...db.dispenses];

  if (machineId && machineId !== 'ALL') {
    filtered = filtered.filter(
      (d) => d.machineId === machineId || d.machineId === db.machines.find((m) => m.machineId === machineId)?.id
    );
  }

  if (status && status !== 'ALL') {
    filtered = filtered.filter((d) => d.status === status);
  }

  filtered.sort((a: any, b: any) => {
    const valA = a[sortBy] ?? '';
    const valB = b[sortBy] ?? '';
    if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
    if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
    return 0;
  });

  const enriched = filtered.map((d) => {
    const machine = db.machines.find((m) => m.id === d.machineId);
    const payment = db.payments.find((p) => p.id === d.paymentId);
    const product = db.products.find((p) => p.id === d.productId);
    return {
      ...d,
      machineIdCode: machine?.machineId || d.machineId,
      machineName: machine?.machineName || 'Unknown Machine',
      location: machine?.location || '',
      paymentTransactionId: payment?.transactionId || 'NO_LINKED_PAYMENT',
      paymentStatus: payment?.status || 'NO_PAYMENT',
      paymentAmount: payment?.amount || 0,
      paymentGateway: payment?.gateway || null,
      productName: product?.name || 'Sanitary Napkin',
      hasMismatch: payment?.status === 'SUCCESS' && d.status !== 'SUCCESS',
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
        totalDispenses: filtered.length,
        successCount: filtered.filter((d) => d.status === 'SUCCESS').length,
        failedCount: filtered.filter((d) => d.status !== 'SUCCESS').length,
      },
    },
  });
});

export default router;
