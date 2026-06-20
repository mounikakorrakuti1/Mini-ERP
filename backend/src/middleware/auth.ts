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
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
    req.user = jwt.verify(token, secret()) as any;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
export const requirePermission =
  (module: string, level: 'ADMIN' | 'VIEW' = 'ADMIN') =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Authentication required' });
    
    let permissions = req.user.permissions || [];
    if (req.method !== 'GET') {
      const roles = await prisma.userRole.findMany({
        where: { userId: req.user.sub },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });
      permissions = roles.flatMap((x) => x.role.permissions.map((p) => ({
        module: p.permission.module,
        accessLevel: p.accessLevel
      })));
    }
    
    const p = permissions.find((perm: any) => perm.module === module);
    console.log(`[AUTH CHECK] req to ${req.originalUrl}. user: ${req.user.sub}, checking module: ${module}, level: ${level}. Found: ${JSON.stringify(p)}`);
    
    if (!p)
      return res.status(403).json({ success: false, message: 'Forbidden: Missing module permission' });
      
    if (level === 'ADMIN' && p.accessLevel !== 'ADMIN')
      return res.status(403).json({ success: false, message: 'Forbidden: Requires ADMIN access' });

    next();
  };

