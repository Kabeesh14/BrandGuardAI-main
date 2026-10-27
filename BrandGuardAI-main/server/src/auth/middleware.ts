import type { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from './tokenService.js';
import type { AuthUser, UserRole } from './types.js';

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Middleware requiring a valid Bearer authentication token.
 * Rejects unauthenticated requests with 401 Unauthorized.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Missing Bearer token in Authorization header.',
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Bearer token is empty.',
    });
  }

  try {
    const user = await verifyAuthToken(token);
    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({
      error: `Authentication failed. ${err.message}`,
    });
  }
}

/**
 * Middleware requiring specific user roles.
 * Must be preceded by requireAuth.
 * Rejects unauthorized roles with 403 Forbidden.
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required. No user context found.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Insufficient privileges. Required role: ${allowedRoles.join(
          ' or '
        )}. Your verified role: ${req.user.role}`,
      });
    }

    next();
  };
}
