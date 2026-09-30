import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../../data/store.js';
import { authenticate, AuthenticatedRequest } from '../auth/auth.middleware.js';
import { authorize } from '../auth/rbac.middleware.js';
import { AuditService } from '../audit/audit.service.js';
import { config } from '../../config/index.js';

const router = Router();

// Validation schema for creating a machine
const createMachineSchema = z.object({
  machineId: z.string().min(3).max(50),
  machineCode: z.string().optional(),
  machineName: z.string().min(2),
  location: z.string().min(2).optional(),
  address: z.string().optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  iotDeviceId: z.string().min(3),
  simNumber: z.string().optional(),
  simOperator: z.string().optional(),
  businessMobileNumber: z.string().optional(),
  imei: z.string().optional(),
  productCapacity: z.number().int().positive().default(100),
  currentStock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().positive().default(20),
  phonepeIdentifier: z.string().min(2).optional(),
  razorpayIdentifier: z.string().min(2).optional(),
});

// Validation schema for updating a machine
const updateMachineSchema = z.object({
  machineName: z.string().min(2).optional(),
  machineCode: z.string().optional(),
  location: z.string().min(2).optional(),
  address: z.string().optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  productCapacity: z.number().int().positive().optional(),
  lowStockThreshold: z.number().int().positive().optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'MAINTENANCE', 'DEACTIVATED']).optional(),
  phonepeIdentifier: z.string().min(2).optional(),
  razorpayIdentifier: z.string().min(2).optional(),
});

// 1. GET /api/v1/machines - List all machines with filters, search, sort, pagination
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  // First, update dynamic online/offline statuses based on heartbeat timeout
  db.updateMachineStatuses(config.iot.offlineTimeoutSeconds);

  const {
    search,
    status, // ONLINE, OFFLINE, LOW_STOCK, OUT_OF_STOCK, MAINTENANCE
    city,
    page = '1',
    limit = '10',
    sortBy = 'machineId',
    sortOrder = 'asc',
  } = req.query as Record<string, string>;

  let filtered = db.machines.filter((m: any) => 
    status === 'DELETED' ? m.isDeleted : !m.isDeleted
  );

  // Search filter (machineId, machineName, location, city)
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.machineId.toLowerCase().includes(q) ||
        m.machineName.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q)
    );
  }

  // City filter
  if (city && city !== 'ALL') {
    filtered = filtered.filter((m) => m.city.toLowerCase() === city.toLowerCase());
  }

  // Status / Stock filters
  if (status && status !== 'ALL') {
    if (status === 'ONLINE') {
      filtered = filtered.filter((m) => m.status === 'ONLINE');
    } else if (status === 'OFFLINE') {
      filtered = filtered.filter((m) => m.status === 'OFFLINE');
    } else if (status === 'MAINTENANCE') {
      filtered = filtered.filter((m) => m.status === 'MAINTENANCE');
    } else if (status === 'LOW_STOCK') {
      filtered = filtered.filter((m) => m.currentStock > 0 && m.currentStock <= m.lowStockThreshold);
    } else if (status === 'OUT_OF_STOCK') {
      filtered = filtered.filter((m) => m.currentStock === 0);
    }
  }

  // Sorting
  filtered.sort((a: any, b: any) => {
    const valA = a[sortBy] ?? '';
    const valB = b[sortBy] ?? '';
    if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
    if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
    return 0;
  });

  // Calculate today's dispensed and revenue for each machine
  const today = new Date().toISOString().split('T')[0];
  const itemsWithStats = filtered.map((m) => {
    const todayDispenses = db.dispenses.filter(
      (d) => d.machineId === m.id && d.status === 'SUCCESS' && d.createdAt.startsWith(today)
    ).length;
    const todayRevenue = db.payments
      .filter((p) => p.machineId === m.id && p.status === 'SUCCESS' && p.createdAt.startsWith(today))
      .reduce((sum, p) => sum + p.amount, 0);

    const qrCodes = db.qrIdentifiers.filter((q) => q.machineId === m.id && q.isActive);

    return {
      id: m.id,
      machineId: m.machineId,
      machineCode: m.machineCode,
      machineName: m.machineName,
      location: m.location,
      city: m.city,
      state: m.state,
      status: m.status,
      productCapacity: m.productCapacity,
      currentStock: m.currentStock,
      lowStockThreshold: m.lowStockThreshold,
      isLowStock: m.currentStock > 0 && m.currentStock <= m.lowStockThreshold,
      isOutOfStock: m.currentStock === 0,
      todayDispensed: todayDispenses,
      todayRevenue,
      lastSeen: m.lastSeen,
      phonepeIdentifier: qrCodes.find((q) => q.gateway === 'PHONEPE')?.identifier || null,
      razorpayIdentifier: qrCodes.find((q) => q.gateway === 'RAZORPAY')?.identifier || null,
      iotDeviceId: m.iotDeviceId,
      simNumber: m.simNumber || null,
      simOperator: m.simOperator || null,
      imei: m.imei || null,
    };
  });

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedItems = itemsWithStats.slice(startIndex, startIndex + limitNum);

  res.json({
    success: true,
    data: {
      items: paginatedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / limitNum),
      },
      summary: {
        total: db.machines.filter((m: any) => !m.isDeleted).length,
        online: db.machines.filter((m: any) => m.status === 'ONLINE' && !m.isDeleted).length,
        offline: db.machines.filter((m: any) => m.status === 'OFFLINE' && !m.isDeleted).length,
        lowStock: db.machines.filter((m: any) => m.currentStock > 0 && m.currentStock <= m.lowStockThreshold && !m.isDeleted).length,
        outOfStock: db.machines.filter((m: any) => m.currentStock === 0 && !m.isDeleted).length,
        deleted: db.machines.filter((m: any) => m.isDeleted).length,
      },
    },
  });
});

// 2. GET /api/v1/machines/:id - Detailed machine data
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  db.updateMachineStatuses(config.iot.offlineTimeoutSeconds);
  const details = db.getMachineWithDetails(req.params.id);

  if (!details) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'MACHINE_NOT_FOUND',
        message: `Machine with ID ${req.params.id} does not exist.`,
      },
    });
  }

  // Sanitize sensitive SIM & IMEI for viewers or operators if not SUPER_ADMIN
  const isSuper = req.user?.role === 'SUPER_ADMIN';
  const sanitizedMachine = {
    ...details.machine,
    simNumber: isSuper ? details.machine.simNumber : undefined,
    imei: isSuper ? details.machine.imei : undefined,
  };

  res.json({
    success: true,
    data: {
      ...details,
      machine: sanitizedMachine,
    },
  });
});

// 3. POST /api/v1/machines - Create new machine with QR mappings
router.post('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = createMachineSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid machine configuration parameters.',
          details: parseResult.error.errors,
        },
      });
    }

    const data = parseResult.data;

    // Check unique machineId and iotDeviceId
    if (db.machines.some((m) => m.machineId.toUpperCase() === data.machineId.toUpperCase())) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'MACHINE_ID_EXISTS',
          message: `Machine ID '${data.machineId}' is already registered.`,
        },
      });
    }

    if (db.machines.some((m) => m.iotDeviceId.toUpperCase() === data.iotDeviceId.toUpperCase())) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'IOT_DEVICE_EXISTS',
          message: `IoT Device ID '${data.iotDeviceId}' is already bound to another machine.`,
        },
      });
    }

    const newMachineId = `m-${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    const newMachine = {
      id: newMachineId,
      machineId: data.machineId.trim().toUpperCase(),
      machineCode: data.machineCode,
      machineName: data.machineName.trim(),
      location: data.location.trim(),
      address: data.address,
      city: data.city.trim(),
      state: data.state.trim(),
      latitude: data.latitude,
      longitude: data.longitude,
      installationDate: nowIso,
      iotDeviceId: data.iotDeviceId.trim(),
      simNumber: data.simNumber,
      simOperator: data.simOperator,
      businessMobileNumber: data.businessMobileNumber,
      imei: data.imei,
      productCapacity: data.productCapacity,
      currentStock: data.currentStock,
      lowStockThreshold: data.lowStockThreshold,
      status: 'OFFLINE' as const,
      lastSeen: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.machines.push(newMachine);

    // Bind QR identifiers only if provided (both are optional at registration time)
    if (data.phonepeIdentifier) {
      db.qrIdentifiers.push({
        id: `qr-${Date.now()}-ph`,
        machineId: newMachineId,
        gateway: 'PHONEPE' as const,
        identifier: data.phonepeIdentifier.trim(),
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    if (data.razorpayIdentifier) {
      db.qrIdentifiers.push({
        id: `qr-${Date.now()}-rp`,
        machineId: newMachineId,
        gateway: 'RAZORPAY' as const,
        identifier: data.razorpayIdentifier.trim(),
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    // Initial stock transaction
    if (data.currentStock > 0) {
      db.stockTransactions.unshift({
        id: `stk-${Date.now()}`,
        machineId: newMachineId,
        productId: 'prod-001',
        eventType: 'STOCK_INITIALIZED',
        previousStock: 0,
        changeQuantity: data.currentStock,
        newStock: data.currentStock,
        reason: 'Initial setup stock registration',
        performedBy: req.user?.id,
        createdAt: nowIso,
      });
    }

    AuditService.record({
      userId: req.user?.id,
      action: 'MACHINE_CREATED',
      entity: 'Machine',
      entityId: newMachineId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      newValues: { machineId: newMachine.machineId, location: newMachine.location },
    });

    return res.status(201).json({
      success: true,
      data: db.getMachineWithDetails(newMachineId),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

// 4. PUT /api/v1/machines/:id - Update machine and QR configurations
router.put('/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const machine = db.machines.find((m) => m.id === req.params.id || m.machineId === req.params.id);
    if (!machine) {
      return res.status(404).json({
        success: false,
        error: { code: 'MACHINE_NOT_FOUND', message: 'Machine does not exist.' },
      });
    }

    const parseResult = updateMachineSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: parseResult.error.errors },
      });
    }

    const oldValues = { ...machine };
    const data = parseResult.data;

    if (data.machineName !== undefined) machine.machineName = data.machineName;
    if (data.machineCode !== undefined) machine.machineCode = data.machineCode;
    if (data.location !== undefined) machine.location = data.location;
    if (data.address !== undefined) machine.address = data.address;
    if (data.city !== undefined) machine.city = data.city;
    if (data.state !== undefined) machine.state = data.state;
    if (data.latitude !== undefined) machine.latitude = data.latitude;
    if (data.longitude !== undefined) machine.longitude = data.longitude;
    if (data.productCapacity !== undefined) machine.productCapacity = data.productCapacity;
    if (data.lowStockThreshold !== undefined) machine.lowStockThreshold = data.lowStockThreshold;
    if (data.status !== undefined) machine.status = data.status;
    machine.updatedAt = new Date().toISOString();

    // Update PhonePe identifier if supplied
    if (data.phonepeIdentifier) {
      const phQr = db.qrIdentifiers.find((q) => q.machineId === machine.id && q.gateway === 'PHONEPE');
      if (phQr) {
        phQr.identifier = data.phonepeIdentifier.trim();
        phQr.updatedAt = new Date().toISOString();
      } else {
        db.qrIdentifiers.push({
          id: `qr-${Date.now()}-ph`,
          machineId: machine.id,
          gateway: 'PHONEPE',
          identifier: data.phonepeIdentifier.trim(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Update Razorpay identifier if supplied
    if (data.razorpayIdentifier) {
      const rpQr = db.qrIdentifiers.find((q) => q.machineId === machine.id && q.gateway === 'RAZORPAY');
      if (rpQr) {
        rpQr.identifier = data.razorpayIdentifier.trim();
        rpQr.updatedAt = new Date().toISOString();
      } else {
        db.qrIdentifiers.push({
          id: `qr-${Date.now()}-rp`,
          machineId: machine.id,
          gateway: 'RAZORPAY',
          identifier: data.razorpayIdentifier.trim(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    AuditService.record({
      userId: req.user?.id,
      action: 'MACHINE_UPDATED',
      entity: 'Machine',
      entityId: machine.id,
      oldValues,
      newValues: data,
    });

    return res.json({
      success: true,
      data: db.getMachineWithDetails(machine.id),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

// 5. POST /api/v1/machines/:id/stock-refill - Refill pads in machine
router.post('/:id/stock-refill', authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']), (req: AuthenticatedRequest, res: Response) => {
  const machine = db.machines.find((m) => m.id === req.params.id || m.machineId === req.params.id);
  if (!machine) {
    return res.status(404).json({ success: false, error: { code: 'MACHINE_NOT_FOUND', message: 'Machine not found.' } });
  }

  const { quantity, reason = 'Operator field stock refill' } = req.body;
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUANTITY', message: 'Quantity must be a positive integer.' } });
  }

  const prevStock = machine.currentStock;
  const newStock = Math.min(machine.productCapacity, prevStock + qty);
  const actualAdded = newStock - prevStock;
  machine.currentStock = newStock;
  machine.updatedAt = new Date().toISOString();

  const stockTxn = {
    id: `stk-${Date.now()}`,
    machineId: machine.id,
    productId: 'prod-001',
    eventType: 'STOCK_REFILLED' as const,
    previousStock: prevStock,
    changeQuantity: actualAdded,
    newStock,
    reason,
    performedBy: req.user?.id,
    createdAt: new Date().toISOString(),
  };
  db.stockTransactions.unshift(stockTxn);

  AuditService.record({
    userId: req.user?.id,
    action: 'STOCK_REFILLED',
    entity: 'Machine',
    entityId: machine.id,
    oldValues: { currentStock: prevStock },
    newValues: { currentStock: newStock, added: actualAdded },
  });

  return res.json({
    success: true,
    data: {
      machineId: machine.machineId,
      previousStock: prevStock,
      addedQuantity: actualAdded,
      currentStock: newStock,
      capacity: machine.productCapacity,
      stockTransactionId: stockTxn.id,
    },
  });
});

// 6. DELETE /api/v1/machines/:id - Soft delete a machine
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const machine = db.machines.find((m) => m.id === req.params.id || m.machineId === req.params.id);
  if (!machine) {
    return res.status(404).json({ success: false, error: { code: 'MACHINE_NOT_FOUND', message: 'Machine not found.' } });
  }

  // Soft delete by setting a property or changing status
  (machine as any).isDeleted = true;
  machine.updatedAt = new Date().toISOString();

  AuditService.record({
    userId: req.user?.id,
    action: 'MACHINE_DELETED',
    entity: 'Machine',
    entityId: machine.id,
  });

  return res.json({ success: true, message: 'Machine moved to recycle bin.' });
});

// 7. POST /api/v1/machines/:id/restore - Restore a soft-deleted machine
router.post('/:id/restore', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const machine = db.machines.find((m) => m.id === req.params.id || m.machineId === req.params.id);
  if (!machine) {
    return res.status(404).json({ success: false, error: { code: 'MACHINE_NOT_FOUND', message: 'Machine not found.' } });
  }

  (machine as any).isDeleted = false;
  machine.updatedAt = new Date().toISOString();

  AuditService.record({
    userId: req.user?.id,
    action: 'MACHINE_RESTORED',
    entity: 'Machine',
    entityId: machine.id,
  });

  return res.json({ success: true, message: 'Machine restored successfully.' });
});

// 8. DELETE /api/v1/machines/:id/permanent - Permanently delete a machine and all associated data
router.delete('/:id/permanent', authenticate, authorize(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const machine = db.machines.find((m) => m.id === req.params.id || m.machineId === req.params.id);
  if (!machine) {
    return res.status(404).json({ success: false, error: { code: 'MACHINE_NOT_FOUND', message: 'Machine not found.' } });
  }

  db.deleteMachinePermanently(machine.id);

  AuditService.record({
    userId: req.user?.id,
    action: 'MACHINE_PERMANENTLY_DELETED',
    entity: 'Machine',
    entityId: machine.id,
  });

  return res.json({ success: true, message: 'Machine and all associated data permanently deleted.' });
});

export default router;
