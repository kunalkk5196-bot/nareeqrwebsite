import { Router, Response } from 'express';
import { db } from '../../data/store.js';
import { authenticate, AuthenticatedRequest } from '../auth/auth.middleware.js';
import { authorize } from '../auth/rbac.middleware.js';
import { AuditService } from '../audit/audit.service.js';

const router = Router();

// GET /api/v1/stock - Stock inventory summary and stock movement history
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { machineId, eventType, page = '1', limit = '15' } = req.query as Record<string, string>;

  let filteredTxns = [...db.stockTransactions];

  if (machineId && machineId !== 'ALL') {
    filteredTxns = filteredTxns.filter(
      (s) => s.machineId === machineId || s.machineId === db.machines.find((m) => m.machineId === machineId)?.id
    );
  }

  if (eventType && eventType !== 'ALL') {
    filteredTxns = filteredTxns.filter((s) => s.eventType === eventType);
  }

  // Sort newest first
  filteredTxns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const enrichedTxns = filteredTxns.map((s) => {
    const machine = db.machines.find((m) => m.id === s.machineId);
    const user = db.users.find((u) => u.id === s.performedBy);
    return {
      ...s,
      machineIdCode: machine?.machineId || s.machineId,
      machineName: machine?.machineName || 'Unknown Machine',
      location: machine?.location || '',
      performedByName: user?.name || s.performedBy || 'SYSTEM',
    };
  });

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = enrichedTxns.slice(startIndex, startIndex + limitNum);

  // Machine stock health snapshot
  const machinesStock = db.machines.map((m) => ({
    id: m.id,
    machineId: m.machineId,
    machineName: m.machineName,
    location: m.location,
    city: m.city,
    productCapacity: m.productCapacity,
    currentStock: m.currentStock,
    lowStockThreshold: m.lowStockThreshold,
    fillPercentage: Math.round((m.currentStock / m.productCapacity) * 100),
    isLowStock: m.currentStock > 0 && m.currentStock <= m.lowStockThreshold,
    isOutOfStock: m.currentStock === 0,
    status: m.status,
  }));

  return res.json({
    success: true,
    data: {
      inventory: machinesStock,
      movements: {
        items: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: filteredTxns.length,
          totalPages: Math.ceil(filteredTxns.length / limitNum),
        },
      },
      summary: {
        totalCapacity: db.machines.reduce((sum, m) => sum + m.productCapacity, 0),
        totalCurrentStock: db.machines.reduce((sum, m) => sum + m.currentStock, 0),
        lowStockCount: db.machines.filter((m) => m.currentStock > 0 && m.currentStock <= m.lowStockThreshold).length,
        outOfStockCount: db.machines.filter((m) => m.currentStock === 0).length,
      },
    },
  });
});

// POST /api/v1/stock/adjust - Manual stock correction with audit log
router.post('/adjust', authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']), (req: AuthenticatedRequest, res: Response) => {
  const { machineId, newStock, reason } = req.body;

  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({
      success: false,
      error: { code: 'REASON_REQUIRED', message: 'A descriptive reason (min 5 characters) is required for manual stock adjustment.' },
    });
  }

  const stockVal = parseInt(newStock, 10);
  if (isNaN(stockVal) || stockVal < 0) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_STOCK', message: 'New stock must be non-negative.' } });
  }

  const machine = db.machines.find((m) => m.id === machineId || m.machineId === machineId);
  if (!machine) {
    return res.status(404).json({ success: false, error: { code: 'MACHINE_NOT_FOUND', message: 'Machine not found.' } });
  }

  const prevStock = machine.currentStock;
  const diff = stockVal - prevStock;
  machine.currentStock = stockVal;
  machine.updatedAt = new Date().toISOString();

  const stockTxn = {
    id: `stk-${Date.now()}`,
    machineId: machine.id,
    productId: 'prod-001',
    eventType: 'MANUAL_ADJUSTMENT' as const,
    previousStock: prevStock,
    changeQuantity: diff,
    newStock: stockVal,
    reason,
    performedBy: req.user?.id,
    createdAt: new Date().toISOString(),
  };
  db.stockTransactions.unshift(stockTxn);

  AuditService.record({
    userId: req.user?.id,
    action: 'MANUAL_STOCK_ADJUSTMENT',
    entity: 'Machine',
    entityId: machine.id,
    oldValues: { currentStock: prevStock },
    newValues: { currentStock: stockVal, diff, reason },
  });

  return res.json({
    success: true,
    data: {
      machineId: machine.machineId,
      previousStock: prevStock,
      newStock: stockVal,
      change: diff,
      transactionId: stockTxn.id,
    },
  });
});

export default router;
