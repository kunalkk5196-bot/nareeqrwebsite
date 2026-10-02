import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { db } from '../data/store.js';
import { UserEntity } from '../data/seed-data.js';

export interface AuthenticatedRequest extends Request {
  user?: UserEntity;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is required. Please provide a valid Bearer token.',
      },
    });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; email: string; role: string };
    const user = db.users.find((u) => u.id === decoded.id && u.isActive);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE_OR_NOT_FOUND',
          message: 'The account associated with this token is inactive or no longer exists.',
        },
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'The token provided is invalid or has expired. Please log in again.',
      },
    });
  }
};
