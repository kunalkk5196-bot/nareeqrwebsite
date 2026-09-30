import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../../data/store.js';
import { authenticate, AuthenticatedRequest } from '../auth/auth.middleware.js';
import { authorize } from '../auth/rbac.middleware.js';
import { AuditService } from '../audit/audit.service.js';

const router = Router();

// GET /api/v1/users - List users
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  const users = db.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    isActive: u.isActive,
    lastLogin: u.lastLogin,
    createdAt: u.createdAt,
  }));

  return res.json({ success: true, data: users });
});

// POST /api/v1/users - Create new admin user
router.post('/', authenticate, authorize(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, role = 'OPERATOR', phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'NAME_EMAIL_PASSWORD_REQUIRED' });
  }

  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, error: 'EMAIL_ALREADY_EXISTS' });
  }

  const hash = await bcrypt.hash(password, 10);
  const nowIso = new Date().toISOString();
  const newUser = {
    id: `usr-${Date.now().toString(36)}`,
    name,
    email,
    passwordHash: hash,
    phone,
    role,
    isActive: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.users.push(newUser);

  AuditService.record({
    userId: req.user?.id,
    action: 'USER_CREATED',
    entity: 'User',
    entityId: newUser.id,
    newValues: { email, role, name },
  });

  return res.status(201).json({
    success: true,
    data: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      isActive: newUser.isActive,
    },
  });
});

// PUT /api/v1/users/:id/status - Toggle active/inactive
router.put('/:id/status', authenticate, authorize(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' });
  }

  if (user.id === req.user?.id) {
    return res.status(400).json({ success: false, error: 'CANNOT_DEACTIVATE_OWN_ACCOUNT' });
  }

  user.isActive = !user.isActive;
  user.updatedAt = new Date().toISOString();

  AuditService.record({
    userId: req.user?.id,
    action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    entity: 'User',
    entityId: user.id,
  });

  return res.json({ success: true, data: { id: user.id, isActive: user.isActive } });
});

export default router;
