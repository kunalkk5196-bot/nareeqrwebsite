import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../../data/store.js';
import { config } from '../../config/index.js';
import { authenticate, AuthenticatedRequest } from './auth.middleware.js';
import { AuditService } from '../audit/audit.service.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email or password format.',
          details: parseResult.error.errors,
        },
      });
    }

    const { email, password } = parseResult.data;
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    user.lastLogin = new Date().toISOString();
    user.updatedAt = new Date().toISOString();

    AuditService.record({
      userId: user.id,
      action: 'ADMIN_LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { email: user.email, role: user.role },
    });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred during authentication.',
      },
    });
  }
});

router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      lastLogin: user.lastLogin,
    },
  });
});

router.get('/demo-accounts', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: db.users.map((u) => ({
      name: u.name,
      email: u.email,
      role: u.role,
      password: 'Password@123',
    })),
  });
});

export default router;
