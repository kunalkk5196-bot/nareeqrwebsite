import { Router, Response } from 'express';
import { db } from '../../data/store.js';
import { authenticate, AuthenticatedRequest } from '../auth/auth.middleware.js';
import { authorize } from '../auth/rbac.middleware.js';

const router = Router();

router.get('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { entity, action, page = '1', limit = '20' } = req.query as Record<string, string>;

  let filtered = [...db.auditLogs];

  if (entity && entity !== 'ALL') {
    filtered = filtered.filter((a) => a.entity.toLowerCase() === entity.toLowerCase());
  }

  if (action && action !== 'ALL') {
    filtered = filtered.filter((a) => a.action.toLowerCase().includes(action.toLowerCase()));
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const enriched = filtered.map((a) => {
    const user = db.users.find((u) => u.id === a.userId);
    return {
      ...a,
      userName: user ? user.name : 'SYSTEM / WEBHOOK',
      userEmail: user ? user.email : 'system@internal',
      userRole: user ? user.role : 'SYSTEM',
    };
  });

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
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
    },
  });
});

export default router;
