'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.requirePermission = void 0;
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require('jsonwebtoken'));
const prisma_js_1 = require('../lib/prisma.js');
const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is required');
  return value;
};
async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
    req.user = jsonwebtoken_1.default.verify(token, secret());
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
const requirePermission =
  (...needed) =>
  async (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Authentication required' });
    let permissions = req.user.permissions || [];
    if (req.method !== 'GET') {
      const roles = await prisma_js_1.prisma.userRole.findMany({
        where: { userId: req.user.sub },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });
      permissions = roles.flatMap((x) => x.role.permissions.map((p) => p.permission.code));
    }
    if (!needed.some((p) => permissions.includes(p)))
      return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
  };
exports.requirePermission = requirePermission;
