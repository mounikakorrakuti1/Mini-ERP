import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is required');
  return value;
};
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ data: null, meta: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const payload = jwt.verify(token, secret()) as any;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });
    if (!user || !user.active || user.tokenVersion !== payload.ver)
      return res.status(401).json({ data: null, meta: null, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
    req.user = {
      ...payload,
      permissions: user.roles.flatMap((assignment) =>
        assignment.role.permissions.map((entry) => ({
          module: entry.permission.module,
          accessLevel: entry.accessLevel,
        })),
      ),
    };
    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ data: null, meta: null, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
    }
    console.error('Authentication error:', err);
    return res.status(500).json({ data: null, meta: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error during authentication' } });
  }
}
export const requirePermission =
  (module: string, level: 'ADMIN' | 'VIEW' = 'ADMIN') =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new Error('Authentication required')); // This should be a 401 ideally
    }
    
    const p = (req.user.permissions || []).find((perm: any) => perm.module === module);
    
    if (!p) {
      return res.status(403).json({ data: null, meta: null, error: { code: 'FORBIDDEN_ERROR', message: 'Forbidden: Missing module permission' } });
    }
      
    if (level === 'ADMIN' && p.accessLevel !== 'ADMIN') {
      return res.status(403).json({ data: null, meta: null, error: { code: 'FORBIDDEN_ERROR', message: 'Forbidden: Requires ADMIN access' } });
    }

    next();
  };
