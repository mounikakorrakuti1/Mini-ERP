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
  (...needed: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Authentication required' });
    let permissions = req.user.permissions || [];
    if (req.method !== 'GET') {
      const roles = await prisma.userRole.findMany({
        where: { userId: req.user.sub },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });
      permissions = roles.flatMap((x) => x.role.permissions.map((p) => p.permission.code));
    }
    if (!needed.some((p) => permissions.includes(p)))
      return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
  };
