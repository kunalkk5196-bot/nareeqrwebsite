import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';

type RoleType = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER';

export const authorize = (allowedRoles: RoleType[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is not authenticated.',
        },
      });
    }

    // SUPER_ADMIN always has access to all routes
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE_PERMISSION',
          message: `Your role (${req.user.role}) does not have permission to perform this operation. Allowed roles: ${allowedRoles.join(', ')}`,
        },
      });
    }

    next();
  };
};
