import type { JwtPayload } from 'jsonwebtoken';
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { sub: string; ver: number; permissions: { module: string; accessLevel: 'ADMIN' | 'VIEW' | 'NONE' }[] };
    }
  }
}
export {};
