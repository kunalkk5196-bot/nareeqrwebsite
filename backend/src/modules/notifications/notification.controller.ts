import { Router, Response } from 'express';
import { db } from '../../data/store.js';
import { authenticate, AuthenticatedRequest } from '../auth/auth.middleware.js';

const router = Router();

// GET /api/v1/notifications
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { isRead, severity } = req.query as Record<string, string>;

  let filtered = [...db.notifications];

  if (isRead !== undefined && isRead !== 'ALL') {
    const readBool = isRead === 'true';
    filtered = filtered.filter((n) => n.isRead === readBool);
  }

  if (severity && severity !== 'ALL') {
    filtered = filtered.filter((n) => n.severity === severity);
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = db.notifications.filter((n) => !n.isRead).length;

  return res.json({
    success: true,
    data: {
      unreadCount,
      items: filtered,
    },
  });
});

// PUT /api/v1/notifications/:id/read
router.put('/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (!notif) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  }

  notif.isRead = true;
  notif.readAt = new Date().toISOString();

  return res.json({ success: true, data: notif });
});

// POST /api/v1/notifications/mark-all-read
router.post('/mark-all-read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const now = new Date().toISOString();
  for (const n of db.notifications) {
    n.isRead = true;
    n.readAt = now;
  }
  return res.json({ success: true, message: 'All notifications marked as read' });
});

export default router;
