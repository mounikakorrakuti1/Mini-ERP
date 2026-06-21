import 'dotenv/config';
import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import { z } from 'zod';
import { prisma } from './lib/prisma.js';
import { AppError, asyncHandler, errorHandler } from './lib/errors.js';
import { authenticate, requirePermission } from './middleware/auth.js';
import { ordersService } from './services/orders.service.js';
import { inventoryService } from './services/inventory.service.js';
import { dashboardService } from './services/dashboard.service.js';
import { notificationService } from './services/notification.service.js';
import { realtimeService } from './services/realtime.service.js';
import { procurementService } from './services/procurement.service.js';
import { openApiSpec } from './swagger.js';
import { AuditAction, ProcurementType, ProductCategory, StockDirection, StockSource } from '@prisma/client';
const app = express();
const httpServer = createServer(app);
realtimeService.init(httpServer);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));
const ok = (res: express.Response, data: any, status = 200, meta: any = {}) =>
  res.status(status).json({ data, meta, error: null });
const body = (schema: z.ZodTypeAny) => (req: any, _res: any, next: any) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err: any) {
    next(new AppError(400, err.errors ? err.errors[0].message : 'Validation failed'));
  }
};
const id = z.string().uuid();
const items = z
  .array(
    z.object({
      productId: id,
      orderedQty: z.coerce.number().positive(),
      salesPrice: z.coerce.number().nonnegative().optional(),
      costPrice: z.coerce.number().nonnegative().optional(),
    }),
  )
  .min(1);
const dateField = z.coerce.date().optional();
const productInput = z.object({
  name: z.string().trim().min(1),
  reference: z.string().trim().min(1).optional(),
  category: z.nativeEnum(ProductCategory).default(ProductCategory.RAW_MATERIAL),
  salesPrice: z.coerce.number().nonnegative(),
  costPrice: z.coerce.number().nonnegative(),
  reorderPoint: z.coerce.number().nonnegative().default(0),
  safetyStock: z.coerce.number().nonnegative().default(0),
  procureOnDemand: z.boolean().default(false),
  procurementType: z.nativeEnum(ProcurementType).optional().nullable(),
  defaultVendorId: id.optional().nullable(),
  defaultBomId: id.optional().nullable(),
});
const salesUpdateInput = z.object({
  customerId: id.optional(),
  customerAddress: z.string().optional().nullable(),
  salesPersonId: id.optional().nullable(),
  expectedDeliveryDate: z.coerce.date().optional().nullable(),
});
const purchaseUpdateInput = z.object({
  vendorId: id.optional(),
  vendorAddress: z.string().optional().nullable(),
  responsiblePersonId: id.optional().nullable(),
  expectedReceiptDate: z.coerce.date().optional().nullable(),
});
const moUpdateInput = z.object({
  finishedProductId: id.optional(),
  bomId: id.optional(),
  quantity: z.coerce.number().positive().optional(),
  plannedCompletionDate: z.coerce.date().optional().nullable(),
});

function validateProcurementConfiguration(data: any) {
  if (!data.procureOnDemand) return;
  if (!data.procurementType) throw new AppError(422, 'Procurement type is required');
  if (data.procurementType === ProcurementType.PURCHASE) {
    if (!data.defaultVendorId) throw new AppError(422, 'Default vendor is required');
  }
  if (data.procurementType === ProcurementType.MANUFACTURING) {
    if (!data.defaultBomId) throw new AppError(422, 'Default BoM is required');
  }
}

async function validateBom(tx: any, finishedProductId: string, items: any[]) {
  if (!finishedProductId) throw new AppError(422, 'BoM finished product is required');
  if (!items?.length) throw new AppError(422, 'BoM requires at least one component');
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.productId) throw new AppError(422, 'BoM component product is required');
    if (item.productId === finishedProductId) throw new AppError(422, 'BoM cannot reference its own finished product');
    if (Number(item.quantity) <= 0) throw new AppError(422, 'BoM component quantity must be greater than zero');
    if (seen.has(item.productId)) throw new AppError(422, 'BoM cannot contain duplicate components');
    seen.add(item.productId);
  }
  const reachesFinished = async (productId: string, visited = new Set<string>()): Promise<boolean> => {
    if (productId === finishedProductId) return true;
    if (visited.has(productId)) return false;
    visited.add(productId);
    const product = await tx.product.findUnique({ where: { id: productId }, include: { defaultBom: { include: { items: true } } } });
    if (!product?.defaultBom) return false;
    for (const child of product.defaultBom.items) {
      if (await reachesFinished(child.productId, visited)) return true;
    }
    return false;
  };
  for (const item of items) {
    if (await reachesFinished(item.productId)) throw new AppError(422, 'Circular BoM reference detected');
  }
}
app.get('/health', (_q, r) => r.json({ status: 'ok' }));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.post(
  '/auth/register',
  body(
    z.object({
      loginId: z.string().min(6).max(12),
      email: z.string().email(),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
      name: z.string().min(1, 'Name is required'),
    }),
  ),
  asyncHandler(async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { loginId: req.body.loginId, email: req.body.email, passwordHash: hash, name: req.body.name },
      });
      for (const field of ['loginId', 'email', 'name'] as const)
        await tx.auditLog.create({
          data: { module: 'AUTH', recordType: 'User', recordId: created.id, action: 'CREATE', fieldName: field, newValue: created[field] },
        });
      await tx.auditLog.create({
        data: { module: 'AUTH', recordType: 'User', recordId: created.id, action: 'CREATE', fieldName: 'passwordHash', newValue: 'Password changed.' },
      });
      return created;
    });
    ok(res, { id: user.id, loginId: user.loginId }, 201);
  }),
);
app.post(
  '/auth/login',
  body(z.object({ loginId: z.string(), password: z.string() })),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { loginId: req.body.loginId },
      include: {
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
    if (!user || !user.active || !(await bcrypt.compare(req.body.password, user.passwordHash)))
      throw new AppError(401, 'Invalid Login Id or Password');
    const permissions = user.roles.flatMap((x) => x.role.permissions.map((p) => ({ module: p.permission.module, accessLevel: p.accessLevel })));
    const token = jwt.sign({ sub: user.id, ver: user.tokenVersion, permissions }, process.env.JWT_SECRET!, {
      expiresIn: '12h',
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        module: 'AUTH',
        recordType: 'User',
        recordId: user.id,
        action: 'LOGIN',
      },
    });
    ok(res, { accessToken: token, user: { id: user.id, loginId: user.loginId, email: user.email, name: user.name, address: user.address, mobile: user.mobile, position: user.position, permissions } });
  }),
);
app.post(
  '/auth/refresh',
  authenticate,
  asyncHandler(async (req, res) =>
    ok(res, {
      accessToken: jwt.sign(
        { sub: req.user!.sub, ver: req.user!.ver, permissions: req.user!.permissions },
        process.env.JWT_SECRET!,
        { expiresIn: '12h' },
      ),
    }),
  ),
);
app.post('/auth/logout', authenticate, asyncHandler(async (q, r) => {
  await prisma.user.update({ where: { id: q.user!.sub }, data: { tokenVersion: { increment: 1 } } });
  r.status(204).send();
}));
app.get('/auth/me', authenticate, asyncHandler(async (q, r) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: q.user!.sub },
    select: { id: true, loginId: true, email: true, name: true, address: true, mobile: true, position: true, active: true },
  });
  ok(r, { ...user, permissions: q.user!.permissions });
}));
app.patch(
  '/auth/me',
  authenticate,
  body(z.object({ name: z.string().trim().min(1).optional(), address: z.string().optional().nullable(), mobile: z.string().optional().nullable() })),
  asyncHandler(async (q, r) => {
    const user = await prisma.$transaction(async (tx) => {
      const before = await tx.user.findUniqueOrThrow({ where: { id: q.user!.sub } });
      const updated = await tx.user.update({ where: { id: q.user!.sub }, data: q.body });
      for (const [field, value] of Object.entries(q.body))
        await tx.auditLog.create({ data: { actorId: q.user!.sub, module: 'AUTH', recordType: 'User', recordId: before.id, action: 'UPDATE', fieldName: field, oldValue: String((before as any)[field] ?? ''), newValue: String(value ?? '') } });
      return updated;
    });
    ok(r, { id: user.id, loginId: user.loginId, email: user.email, name: user.name, address: user.address, mobile: user.mobile, position: user.position, permissions: q.user!.permissions });
  }),
);
app.patch(
  '/auth/me/password',
  authenticate,
  body(z.object({ currentPassword: z.string(), newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[^A-Za-z0-9]/) })),
  asyncHandler(async (q, r) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: q.user!.sub } });
    if (!(await bcrypt.compare(q.body.currentPassword, user.passwordHash)))
      throw new AppError(422, 'Current password is incorrect');
    const passwordHash = await bcrypt.hash(q.body.newPassword, 12);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash, tokenVersion: { increment: 1 } } });
      await tx.auditLog.create({ data: { actorId: user.id, module: 'AUTH', recordType: 'User', recordId: user.id, action: 'UPDATE', fieldName: 'passwordHash', oldValue: 'Password changed.', newValue: 'Password changed.' } });
    });
    r.status(204).send();
  }),
);
const master = (
  path: string,
  model: any,
  module: string,
  recordType: string,
  schema: z.AnyZodObject,
) => {
  app.get(
    path,
    authenticate,
    requirePermission(module.toUpperCase(), 'VIEW'),
    asyncHandler(async (_q, r) => ok(r, await model.findMany())),
  );
  app.post(
    path,
    authenticate,
    requirePermission(module.toUpperCase(), 'ADMIN'),
    body(schema),
    asyncHandler(async (q, r) =>
      ok(
        r,
        await prisma.$transaction(async (tx) => {
          const created = await (tx as any)[model.name].create({
            data: { ...q.body, reference: `${recordType === 'Customer' ? 'CUS' : 'VEN'}-${Date.now()}` },
          });
          await tx.auditLog.create({
            data: {
              actorId: q.user!.sub,
              module,
              recordType,
              recordId: created.id,
              action: 'CREATE',
              fieldName: 'id',
              newValue: created.id,
            },
          });
          return created;
        }),
        201,
      ),
    ),
  );
  app.patch(
    `${path}/:id`,
    authenticate,
    requirePermission(module.toUpperCase(), 'ADMIN'),
    body(schema.partial()),
    asyncHandler(async (q, r) =>
      ok(
        r,
        await prisma.$transaction(async (tx) => {
          const repo = (tx as any)[model.name];
          const before = await repo.findUniqueOrThrow({ where: { id: q.params.id } });
          const updated = await repo.update({ where: { id: q.params.id }, data: q.body });
          for (const [field, value] of Object.entries(q.body)) {
            await tx.auditLog.create({
              data: {
                actorId: q.user!.sub,
                module,
                recordType,
                recordId: q.params.id,
                action: 'UPDATE',
                fieldName: field,
                oldValue: String(before[field]),
                newValue: String(value),
              },
            });
          }
          return updated;
        }),
      ),
    ),
  );
};
master(
  '/customers',
  { ...prisma.customer, name: 'customer' },
  'CUSTOMERS',
  'Customer',
  z.object({ name: z.string().trim().min(1), address: z.string().optional().nullable(), contact: z.string().optional().nullable() }),
);
master(
  '/vendors',
  { ...prisma.vendor, name: 'vendor' },
  'VENDORS',
  'Vendor',
  z.object({ name: z.string().trim().min(1), address: z.string().optional().nullable(), contact: z.string().optional().nullable(), leadTimeDays: z.coerce.number().int().nonnegative().default(0) }),
);
app.get(
  '/products',
  authenticate,
  requirePermission('PRODUCTS', 'VIEW'),
  asyncHandler(async (q, r) => {
    const { page = '1', limit = '100', search, category, status, procurementFilter } = q.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 100;
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { reference: { contains: String(search), mode: 'insensitive' } }
      ];
    }
    if (category && category !== 'ALL') {
      where.category = String(category);
    }
    if (procurementFilter && procurementFilter !== 'ALL') {
      if (procurementFilter === 'PURCHASE') {
        where.procurementType = 'PURCHASE';
        where.procureOnDemand = true;
      } else if (procurementFilter === 'MANUFACTURING') {
        where.procurementType = 'MANUFACTURING';
        where.procureOnDemand = true;
      } else if (procurementFilter === 'STOCKED') {
        where.procureOnDemand = false;
      }
    }

    if (status && status !== 'ALL') {
      const productsWithQuantities = await prisma.product.findMany({
        where,
        select: { id: true, onHandQty: true, reorderPoint: true }
      });
      const activeReservations = await prisma.inventoryReservation.groupBy({
        by: ['productId'],
        where: { active: true, productId: { in: productsWithQuantities.map(p => p.id) } },
        _sum: { quantity: true }
      });
      const reservedMap = new Map(activeReservations.map(res => [res.productId, Number(res._sum.quantity || 0)]));
      
      const validIds = productsWithQuantities.filter(p => {
        const reserved = reservedMap.get(p.id) || 0;
        const available = Number(p.onHandQty) - reserved;
        const isLow = available < Number(p.reorderPoint);
        if (status === 'LOW') return isLow && available > 0;
        if (status === 'OUT') return available <= 0;
        if (status === 'OK') return !isLow && available > 0;
        return true;
      }).map(p => p.id);

      where.id = { in: validIds };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, skip, take: limitNum, orderBy: { name: 'asc' } })
    ]);

    const activeReservationsFinal = await prisma.inventoryReservation.groupBy({
      by: ['productId'],
      where: { active: true, productId: { in: products.map(p => p.id) } },
      _sum: { quantity: true }
    });
    const reservedMapFinal = new Map(activeReservationsFinal.map(res => [res.productId, Number(res._sum.quantity || 0)]));
    
    const data = products.map((p) => {
      const reserved = reservedMapFinal.get(p.id) || 0;
      return {
        ...p,
        onHand: Number(p.onHandQty),
        reserved,
        available: Number(p.onHandQty) - reserved,
      };
    });

    ok(r, data, 200, { total, page: pageNum, limit: limitNum });
  }),
);

app.get(
  '/products/:id',
  authenticate,
  requirePermission('PRODUCTS', 'VIEW'),
  asyncHandler(async (q, r) => {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: q.params.id } });
    ok(r, product);
  }),
);

app.post(
  '/products',
  authenticate,
  requirePermission('PRODUCTS', 'ADMIN'),
  body(productInput),
  asyncHandler(async (q, r) => {
    const d = q.body;
    validateProcurementConfiguration(d);
    try {
      ok(
        r,
        await prisma.$transaction(async (tx) => {
          const created = await tx.product.create({
            data: { ...d, reference: d.reference || `PROD-${Date.now()}` },
          });
          await tx.auditLog.create({
            data: {
              actorId: q.user!.sub,
              module: 'PRODUCT',
              recordType: 'Product',
              recordId: created.id,
              action: 'CREATE',
              fieldName: 'reference',
              newValue: created.reference,
            },
          });
          return created;
        }),
        201,
      );
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new AppError(409, 'A product with this name or SKU already exists.');
      }
      throw err;
    }
  }),
);
app.patch(
  '/products/:id',
  authenticate,
  requirePermission('PRODUCTS', 'ADMIN'),
  body(productInput.partial()),
  asyncHandler(async (q, r) => {
    try {
      ok(r, await prisma.$transaction(async (tx) => {
          const before = await tx.product.findUniqueOrThrow({ where: { id: q.params.id } });
          const next = { ...before, ...q.body };
          
          if (!next.procureOnDemand) {
            next.defaultVendorId = null;
            next.defaultBomId = null;
            next.procurementType = null;
            q.body.defaultVendorId = null;
            q.body.defaultBomId = null;
            q.body.procurementType = null;
          }

          validateProcurementConfiguration(next);
          if (next.defaultBomId) {
            const bom = await tx.bom.findUnique({ where: { id: next.defaultBomId } });
            if (!bom || !bom.active || bom.finishedProductId !== before.id)
              throw new AppError(422, 'Default BoM must be active and belong to this product');
          }
          const updated = await tx.product.update({ where: { id: q.params.id }, data: q.body });
          
          for (const [field, value] of Object.entries(q.body)) {
            const oldVal = (before as any)[field];
            if (value !== undefined && String(oldVal) !== String(value)) {
              await tx.auditLog.create({
                data: {
                  actorId: q.user!.sub,
                  module: 'PRODUCT',
                  recordType: 'Product',
                  recordId: q.params.id,
                  action: 'UPDATE',
                  fieldName: field,
                  oldValue: String(oldVal),
                  newValue: String(value),
                },
              });
            }
          }
          return updated;
        }));
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new AppError(409, 'A product with this name or SKU already exists.');
      }
      throw err;
    }
  }),
);
app.post(
  '/products/:id/adjust-stock',
  authenticate,
  requirePermission('INVENTORY', 'ADMIN'),
  body(
    z.object({
      direction: z.nativeEnum(StockDirection),
      quantity: z.coerce.number().positive(),
      reason: z.string().min(1),
    }),
  ),
  asyncHandler(async (q, r) => {
    const balance = await prisma.$transaction(async (tx) => {
        await inventoryService.move(
          tx,
          q.user!.sub,
          q.params.id,
          q.body.direction,
          q.body.quantity,
          StockSource.MANUAL_ADJUSTMENT,
          'ManualAdjustment',
          q.body.reason,
        );
        return inventoryService.balances(tx, q.params.id);
      });
    await realtimeService.broadcastDashboardUpdate();
    ok(r, balance);
  }),
);
app.post(
  '/sales-orders',
  authenticate,
  requirePermission('SALES_ORDERS', 'ADMIN'),
  body(
    z.object({
      customerId: id,
      customerAddress: z.string().optional(),
      salesPersonId: id.optional(),
      expectedDeliveryDate: dateField,
      items,
    }),
  ),
  asyncHandler(async (q, r) => ok(r, await ordersService.createSales(q.user!.sub, q.body), 201)),
);
app.get(
  '/dashboard/summary',
  authenticate,
  requirePermission('DASHBOARDS', 'VIEW'),
  asyncHandler(async (_q, r) => ok(r, await dashboardService.summary())),
);
app.get(
  '/dashboard/business-health',
  authenticate,
  requirePermission('DASHBOARDS', 'VIEW'),
  asyncHandler(async (_q, r) => ok(r, await dashboardService.businessHealth())),
);
app.get(
  '/dashboard/role-summary',
  authenticate,
  requirePermission('DASHBOARDS', 'VIEW'),
  asyncHandler(async (q, r) => {
    const roles = await prisma.userRole.findMany({
      where: { userId: q.user!.sub },
      include: { role: true },
    });
    const roleNames = roles.map((x) => x.role.name);
    const base = { roles: roleNames };
    const roleSummary = await dashboardService.roleSummary();
    const sales = roleSummary.sales.pendingDeliveries;
    const purchase = roleSummary.purchase.openPurchaseOrders;
    const manufacturing = roleSummary.manufacturing.activeManufacturingOrders;
    const inventory = roleSummary.admin.activeProducts;
    const audit = roleSummary.admin.totalAuditLogs;
    if (roleNames.some((x) => x.includes('Sales')))
      return ok(r, {
        ...base,
        pendingDeliveries: sales,
        totalSalesOrders: await prisma.salesOrder.count(),
      });
    if (roleNames.some((x) => x.includes('Purchase')))
      return ok(r, {
        ...base,
        openPurchaseOrders: purchase,
        partialReceipts: await prisma.purchaseOrder.count({
          where: { status: 'PARTIALLY_RECEIVED' as any },
        }),
      });
    if (roleNames.some((x) => x.includes('Manufacturing')))
      return ok(r, { ...base, activeManufacturingOrders: manufacturing });
    ok(r, {
      ...base,
      pendingDeliveries: sales,
      openPurchaseOrders: purchase,
      activeManufacturingOrders: manufacturing,
      activeProducts: inventory,
      totalAuditLogs: audit,
    });
  }),
);
app.get(
  '/sales-orders',
  authenticate,
  requirePermission('SALES_ORDERS', 'VIEW'),
  asyncHandler(async (q, r) => {
    const where: any = {};
    if (q.query.status) where.status = String(q.query.status);
    if (q.query.salesPersonId) where.salesPersonId = String(q.query.salesPersonId);
    ok(
      r,
      await prisma.salesOrder.findMany({
        where,
        include: { items: { include: { product: true } }, customer: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }),
);
app.get(
  '/sales-orders/:id',
  authenticate,
  requirePermission('SALES_ORDERS', 'VIEW'),
  asyncHandler(async (q, r) =>
    ok(
      r,
      await prisma.salesOrder.findUniqueOrThrow({
        where: { id: q.params.id },
        include: { items: { include: { product: true } }, reservations: true, customer: true },
      }),
    ),
  ),
);
app.patch(
  '/sales-orders/:id',
  authenticate,
  requirePermission('SALES_ORDERS', 'ADMIN'),
  body(salesUpdateInput),
  asyncHandler(async (q, r) =>
    ok(r, await ordersService.updateSales(q.user!.sub, q.params.id, q.body)),
  ),
);
app.patch(
  '/sales-orders/:id/confirm',
  authenticate,
  requirePermission('SALES_ORDERS', 'ADMIN'),
  asyncHandler(async (q, r) => ok(r, await ordersService.confirmSales(q.user!.sub, q.params.id))),
);
app.patch(
  '/sales-orders/:id/deliver',
  authenticate,
  requirePermission('SALES_ORDERS', 'ADMIN'),
  body(
    z.object({
      items: z.array(z.object({ itemId: id, deliveredQty: z.coerce.number().nonnegative() })),
    }),
  ),
  asyncHandler(async (q, r) =>
    ok(r, await ordersService.deliverSales(q.user!.sub, q.params.id, q.body.items)),
  ),
);
app.patch(
  '/sales-orders/:id/cancel',
  authenticate,
  requirePermission('SALES_ORDERS', 'ADMIN'),
  asyncHandler(async (q, r) => ok(r, await ordersService.cancelSales(q.user!.sub, q.params.id))),
);
app.post(
  '/purchase-orders',
  authenticate,
  requirePermission('PURCHASE_ORDERS', 'ADMIN'),
  body(z.object({ vendorId: id, vendorAddress: z.string().optional(), responsiblePersonId: id.optional(), expectedReceiptDate: dateField, items })),
  asyncHandler(async (q, r) => ok(r, await ordersService.createPurchase(q.user!.sub, q.body), 201)),
);
app.get(
  '/purchase-orders',
  authenticate,
  requirePermission('PURCHASE_ORDERS', 'VIEW'),
  asyncHandler(async (q, r) => {
    const where: any = {};
    if (q.query.status) where.status = String(q.query.status);
    if (q.query.responsiblePersonId) where.responsiblePersonId = String(q.query.responsiblePersonId);
    ok(r, await prisma.purchaseOrder.findMany({ 
      where,
      include: { items: { include: { product: true } }, vendor: true }, 
      orderBy: { createdAt: 'desc' } 
    }));
  }),
);
app.get(
  '/purchase-orders/:id',
  authenticate,
  requirePermission('PURCHASE_ORDERS', 'VIEW'),
  asyncHandler(async (q, r) =>
    ok(r, await prisma.purchaseOrder.findUniqueOrThrow({ where: { id: q.params.id }, include: { items: { include: { product: true } }, vendor: true } })),
  ),
);
app.patch(
  '/purchase-orders/:id',
  authenticate,
  requirePermission('PURCHASE_ORDERS', 'ADMIN'),
  body(purchaseUpdateInput),
  asyncHandler(async (q, r) =>
    ok(r, await ordersService.updatePurchase(q.user!.sub, q.params.id, q.body)),
  ),
);
app.patch(
  '/purchase-orders/:id/confirm',
  authenticate,
  requirePermission('PURCHASE_ORDERS', 'ADMIN'),
  asyncHandler(async (q, r) =>
    ok(r, await ordersService.confirmPurchase(q.user!.sub, q.params.id)),
  ),
);
app.patch(
  '/purchase-orders/:id/receive',
  authenticate,
  requirePermission('PURCHASE_ORDERS', 'ADMIN'),
  body(
    z.object({
      items: z.array(z.object({ itemId: id, receivedQty: z.coerce.number().nonnegative() })),
    }),
  ),
  asyncHandler(async (q, r) =>
    ok(r, await ordersService.receivePurchase(q.user!.sub, q.params.id, q.body.items)),
  ),
);
app.patch(
  '/purchase-orders/:id/cancel',
  authenticate,
  requirePermission('PURCHASE_ORDERS', 'ADMIN'),
  asyncHandler(async (q, r) => ok(r, await ordersService.cancelPurchase(q.user!.sub, q.params.id))),
);
app.get(
  '/bom',
  authenticate,
  requirePermission('BOM', 'VIEW'),
  asyncHandler(async (_q, r) =>
    ok(r, await prisma.bom.findMany({ include: { items: { include: { product: true } }, operations: true, finishedProduct: true }, orderBy: { createdAt: 'desc' } })),
  ),
);
app.get(
  '/bom/:id',
  authenticate,
  requirePermission('BOM', 'VIEW'),
  asyncHandler(async (q, r) =>
    ok(r, await prisma.bom.findUniqueOrThrow({ where: { id: q.params.id }, include: { items: { include: { product: true } }, operations: true, finishedProduct: true } })),
  ),
);
app.post(
  '/bom',
  authenticate,
  requirePermission('BOM', 'ADMIN'),
  body(z.object({
    finishedProductId: id,
    referenceQty: z.coerce.number().positive(),
    items: z.array(z.object({ productId: id, quantity: z.coerce.number().positive() })).min(1),
    operations: z.array(z.object({ name: z.string().trim().min(1), workCenter: z.string().optional().nullable(), expectedMinutes: z.coerce.number().positive() })).default([]),
  })),
  asyncHandler(async (q, r) =>
    ok(
      r,
      await prisma.$transaction(async (tx) => {
        await validateBom(tx, q.body.finishedProductId, q.body.items || []);
        const created = await tx.bom.create({
          data: {
            reference: `BOM-${Date.now()}`,
            finishedProductId: q.body.finishedProductId,
            referenceQty: q.body.referenceQty,
            items: { create: q.body.items || [] },
            operations: { create: q.body.operations || [] },
          },
          include: { items: true, operations: true },
        });
        await tx.auditLog.create({
          data: {
            actorId: q.user!.sub,
            module: 'MANUFACTURING',
            recordType: 'Bom',
            recordId: created.id,
            action: 'CREATE',
            fieldName: 'reference',
            newValue: created.reference,
          },
        });
        return created;
      }),
      201,
    ),
  ),
);
app.patch(
  '/bom/:id',
  authenticate,
  requirePermission('BOM', 'ADMIN'),
  asyncHandler(async (q, r) =>
    ok(
      r,
      await prisma.$transaction(async (tx) => {
        const before = await tx.bom.findUniqueOrThrow({
          where: { id: q.params.id },
          include: { items: true, operations: true },
        });
        const finishedProductId = q.body.finishedProductId ?? before.finishedProductId;
        const nextItems = q.body.items ?? before.items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
        await validateBom(tx, finishedProductId, nextItems);
        const updated = await tx.bom.update({
          where: { id: q.params.id },
          data: {
            finishedProductId,
            referenceQty: q.body.referenceQty ?? before.referenceQty,
            active: q.body.active ?? before.active,
            ...(q.body.items
              ? { items: { deleteMany: {}, create: q.body.items } }
              : {}),
            ...(q.body.operations
              ? { operations: { deleteMany: {}, create: q.body.operations } }
              : {}),
          },
          include: { items: true, operations: true },
        });
        await tx.auditLog.create({
          data: {
            actorId: q.user!.sub,
            module: 'MANUFACTURING',
            recordType: 'Bom',
            recordId: updated.id,
            action: 'UPDATE',
            fieldName: 'id',
            oldValue: before.id,
            newValue: updated.id,
          },
        });
        return updated;
      }),
    ),
  ),
);
app.post(
  '/manufacturing-orders',
  authenticate,
  requirePermission('MANUFACTURING_ORDERS', 'ADMIN'),
  body(z.object({ finishedProductId: id, bomId: id, quantity: z.coerce.number().positive(), plannedCompletionDate: dateField })),
  asyncHandler(async (q, r) => ok(r, await ordersService.createMo(q.user!.sub, q.body), 201)),
);
app.get(
  '/manufacturing-orders',
  authenticate,
  requirePermission('MANUFACTURING_ORDERS', 'VIEW'),
  asyncHandler(async (q, r) => {
    const where: any = {};
    if (q.query.status) where.status = String(q.query.status);
    if (q.query.operatorId) where.workOrders = { some: { operatorId: String(q.query.operatorId) } };
    ok(r, await prisma.manufacturingOrder.findMany({ where, include: { items: { include: { product: true } }, workOrders: true, finishedProduct: true, bom: true }, orderBy: { createdAt: 'desc' } }));
  }),
);
app.get(
  '/manufacturing-orders/:id',
  authenticate,
  requirePermission('MANUFACTURING_ORDERS', 'VIEW'),
  asyncHandler(async (q, r) =>
    ok(r, await prisma.manufacturingOrder.findUniqueOrThrow({ where: { id: q.params.id }, include: { items: { include: { product: true } }, workOrders: true, finishedProduct: true, bom: true } })),
  ),
);
app.patch(
  '/manufacturing-orders/:id',
  authenticate,
  requirePermission('MANUFACTURING_ORDERS', 'ADMIN'),
  body(moUpdateInput),
  asyncHandler(async (q, r) =>
    ok(r, await ordersService.updateMo(q.user!.sub, q.params.id, q.body)),
  ),
);
app.patch(
  '/manufacturing-orders/:id/confirm',
  authenticate,
  requirePermission('MANUFACTURING_ORDERS', 'ADMIN'),
  asyncHandler(async (q, r) => ok(r, await ordersService.confirmMo(q.user!.sub, q.params.id))),
);
app.patch(
  '/manufacturing-orders/:id/start',
  authenticate,
  requirePermission('MANUFACTURING_ORDERS', 'ADMIN'),
  asyncHandler(async (q, r) => ok(r, await ordersService.startMo(q.user!.sub, q.params.id))),
);
app.patch(
  '/manufacturing-orders/:id/execution',
  authenticate,
  requirePermission('MANUFACTURING_ORDERS', 'ADMIN'),
  body(z.object({
    components: z.array(z.object({ itemId: id, consumedQty: z.coerce.number().nonnegative() })).optional(),
    workOrders: z.array(z.object({ workOrderId: id, actualMinutes: z.coerce.number().nonnegative(), operatorId: z.string().optional().nullable() })).optional(),
  }).refine((value) => value.components?.length || value.workOrders?.length, 'At least one execution update is required')),
  asyncHandler(async (q, r) => ok(r, await ordersService.recordMoExecution(q.user!.sub, q.params.id, q.body))),
);
app.patch(
  '/manufacturing-orders/:id/complete',
  authenticate,
  requirePermission('MANUFACTURING_ORDERS', 'ADMIN'),
  asyncHandler(async (q, r) => ok(r, await ordersService.completeMo(q.user!.sub, q.params.id))),
);
app.patch(
  '/manufacturing-orders/:id/cancel',
  authenticate,
  requirePermission('MANUFACTURING_ORDERS', 'ADMIN'),
  asyncHandler(async (q, r) => ok(r, await ordersService.cancelMo(q.user!.sub, q.params.id))),
);
app.get(
  '/inventory/summary',
  authenticate,
  requirePermission('INVENTORY', 'VIEW'),
  asyncHandler(async (_q, r) => {
    const products = await prisma.product.findMany({ where: { active: true } });
    const activeReservations = await prisma.inventoryReservation.groupBy({
      by: ['productId'],
      where: { active: true },
      _sum: { quantity: true }
    });
    const reservedMap = new Map(activeReservations.map(r => [r.productId, Number(r._sum.quantity || 0)]));
    
    ok(
      r,
      products.map((p) => {
        const reserved = reservedMap.get(p.id) || 0;
        return {
          ...p,
          onHand: Number(p.onHandQty),
          reserved,
          available: Number(p.onHandQty) - reserved,
        };
      })
    );
  }),
);
app.get(
  '/inventory/movements',
  authenticate,
  requirePermission('INVENTORY', 'VIEW'),
  asyncHandler(async (_q, r) =>
    ok(r, await prisma.stockMovement.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })),
  ),
);
app.get(
  '/inventory/reconciliation',
  authenticate,
  requirePermission('INVENTORY', 'VIEW'),
  asyncHandler(async (_q, r) => {
    const [products, movementSums] = await Promise.all([
      prisma.product.findMany({ where: { active: true } }),
      prisma.stockMovement.groupBy({ by: ['productId'], _sum: { signedQty: true } }),
    ]);
    const sumByProduct = new Map(
      movementSums.map((x) => [x.productId, Number(x._sum.signedQty || 0)]),
    );
    const rows = products.map((p) => {
      const expected = sumByProduct.get(p.id) || 0;
      const actual = Number(p.onHandQty);
      return {
        productId: p.id,
        reference: p.reference,
        name: p.name,
        expected,
        actual,
        difference: actual - Number(expected),
      };
    });
    const mismatches = rows.filter((x) => Math.abs(x.difference) > 0.0001);
    ok(r, { status: mismatches.length ? 'MISMATCHED' : 'HEALTHY', mismatches, products: rows });
  }),
);
app.get(
  '/procurement/recommendation',
  authenticate,
  requirePermission('PROCUREMENT', 'VIEW'),
  asyncHandler(async (q, r) =>
    ok(r, await procurementService.recommend(String(q.query.productId || ''), Number(q.query.quantity))),
  ),
);
app.get(
  '/traceability/sales-order/:id',
  authenticate,
  requirePermission('SALES_ORDERS', 'VIEW'),
  asyncHandler(async (q, r) => {
    const salesOrder = await prisma.salesOrder.findUniqueOrThrow({
      where: { id: q.params.id },
      include: { items: { include: { product: true } }, customer: true, reservations: true },
    });
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { triggerSourceSoId: q.params.id },
      include: { items: { include: { product: true } }, vendor: true },
    });
    const manufacturingOrders = await prisma.manufacturingOrder.findMany({
      where: { triggerSourceSoId: q.params.id },
      include: {
        items: { include: { product: true } },
        workOrders: true,
        bom: true,
        reservations: true,
      },
    });
    const referenceIds = [
      q.params.id,
      ...purchaseOrders.map((x) => x.id),
      ...manufacturingOrders.map((x) => x.id),
    ];
    const [stockMovements, auditLogs] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { referenceId: { in: referenceIds } },
        include: { product: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.auditLog.findMany({
        where: { recordId: { in: referenceIds } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    ok(r, {
      salesOrder,
      purchaseOrders,
      manufacturingOrders,
      reservations: salesOrder.reservations,
      stockMovements,
      auditLogs,
      chain: {
        so: salesOrder.reference,
        po: purchaseOrders.map((x) => x.reference),
        mo: manufacturingOrders.map((x) => x.reference),
        stockMovements: stockMovements.length,
        auditLogs: auditLogs.length,
      },
    });
  }),
);
app.get(
  '/audit-logs',
  authenticate,
  requirePermission('AUDIT_LOGS', 'VIEW'),
  asyncHandler(async (q, r) => {
    const page = Math.max(1, Number(q.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(q.query.pageSize || 50)));
    const where: any = {
      ...(q.query.userId ? { actorId: String(q.query.userId) } : {}),
      ...(q.query.module ? { module: String(q.query.module) } : {}),
      ...(q.query.action ? { action: String(q.query.action) as AuditAction } : {}),
      ...(q.query.recordType ? { recordType: String(q.query.recordType) } : {}),
      ...(q.query.recordId ? { recordId: String(q.query.recordId) } : {}),
      ...((q.query.dateFrom || q.query.dateTo) ? { createdAt: {
        ...(q.query.dateFrom ? { gte: new Date(String(q.query.dateFrom)) } : {}),
        ...(q.query.dateTo ? { lte: new Date(String(q.query.dateTo)) } : {}),
      } } : {}),
    };
    const [items, total, grouped] = await Promise.all([
      prisma.auditLog.findMany({ where, include: { actor: { select: { id: true, name: true, loginId: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({ by: ['action'], where, _count: true }),
    ]);
    const counts = new Map(grouped.map((entry) => [entry.action, entry._count]));
    ok(r, { items, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) }, summary: { total, create: counts.get(AuditAction.CREATE) || 0, update: counts.get(AuditAction.UPDATE) || 0, delete: counts.get(AuditAction.DELETE) || 0 } });
  }),
);
app.get(
  '/notifications',
  authenticate,
  asyncHandler(async (q, r) =>
    ok(r, await prisma.notification.findMany({ where: { userId: q.user!.sub, readAt: null } })),
  ),
);
app.patch(
  '/notifications/:id/read',
  authenticate,
  asyncHandler(async (q, r) =>
    ok(
      r,
      await prisma.$transaction(async (tx) => {
        const existing = await tx.notification.findFirst({ where: { id: q.params.id, userId: q.user!.sub } });
        if (!existing) throw new AppError(404, 'Notification not found');
        const n = await tx.notification.update({
          where: { id: existing.id },
          data: { readAt: new Date() },
        });
        await tx.auditLog.create({
          data: {
            actorId: q.user!.sub,
            module: 'NOTIFICATIONS',
            recordType: 'Notification',
            recordId: n.id,
            action: 'UPDATE',
            fieldName: 'readAt',
            oldValue: 'null',
            newValue: String(n.readAt),
          },
        });
        return n;
      }),
    ),
  ),
);
app.get(
  '/admin/roles',
  authenticate,
  requirePermission('USER_MANAGEMENT', 'VIEW'),
  asyncHandler(async (_q, r) => ok(r, await prisma.role.findMany()))
);
app.get(
  '/admin/users',
  authenticate,
  requirePermission('USER_MANAGEMENT', 'VIEW'),
  asyncHandler(async (_q, r) => {
    const users = await prisma.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    ok(r, users);
  })
);
app.get(
  '/admin/users/:id',
  authenticate,
  requirePermission('USER_MANAGEMENT', 'VIEW'),
  asyncHandler(async (q, r) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: q.params.id },
      include: { roles: { include: { role: true } } },
    });
    ok(r, user);
  })
);
app.patch(
  '/admin/users/:id',
  authenticate,
  requirePermission('USER_MANAGEMENT', 'ADMIN'),
  body(z.object({
    position: z.string().optional().nullable(),
    active: z.boolean().optional(),
    roleId: z.string().uuid().optional().nullable(),
  })),
  asyncHandler(async (q, r) => {
    const { position, active, roleId } = q.body;
    const user = await prisma.$transaction(async (tx) => {
      const before = await tx.user.findUniqueOrThrow({
        where: { id: q.params.id },
        include: { roles: true },
      });
      const dataToUpdate: any = {};
      if (position !== undefined) dataToUpdate.position = position;
      if (active !== undefined) dataToUpdate.active = active;
      if (active === false || roleId !== undefined) dataToUpdate.tokenVersion = { increment: 1 };
      
      const u = await tx.user.update({
        where: { id: q.params.id },
        data: dataToUpdate,
      });
      
      if (roleId !== undefined) {
        await tx.userRole.deleteMany({ where: { userId: q.params.id } });
        if (roleId) {
          await tx.userRole.create({ data: { userId: q.params.id, roleId } });
        }
      }
      if (position !== undefined && position !== before.position)
        await tx.auditLog.create({ data: { actorId: q.user!.sub, module: 'AUTH', recordType: 'User', recordId: u.id, action: 'UPDATE', fieldName: 'position', oldValue: before.position, newValue: position } });
      if (active !== undefined && active !== before.active)
        await tx.auditLog.create({ data: { actorId: q.user!.sub, module: 'AUTH', recordType: 'User', recordId: u.id, action: 'UPDATE', fieldName: 'active', oldValue: String(before.active), newValue: String(active) } });
      if (roleId !== undefined) {
        const oldRoleId = before.roles[0]?.roleId ?? null;
        if (oldRoleId !== roleId)
          await tx.auditLog.create({ data: { actorId: q.user!.sub, module: 'AUTH', recordType: 'User', recordId: u.id, action: 'PERMISSION_CHANGE', fieldName: 'roleId', oldValue: oldRoleId, newValue: roleId } });
      }
      
      return u;
    });
    ok(r, user);
  })
);
app.get(
  '/procurement/alerts',
  authenticate,
  requirePermission('PROCUREMENT', 'VIEW'),
  asyncHandler(async (_q, r) => ok(r, await procurementService.getActiveAlerts())),
);

app.get(
  '/procurement/recommendations',
  authenticate,
  requirePermission('PROCUREMENT', 'VIEW'),
  asyncHandler(async (_q, r) => ok(r, await procurementService.getPendingRecommendations())),
);

app.patch(
  '/procurement/recommendations/:id/approve',
  authenticate,
  requirePermission('PROCUREMENT', 'ADMIN'),
  asyncHandler(async (q, r) => ok(r, await procurementService.approveRecommendation(q.params.id, q.user!.sub))),
);

app.post(
  '/procurement/generate',
  authenticate,
  requirePermission('PROCUREMENT', 'ADMIN'),
  asyncHandler(async (_q, r) => {
    await procurementService.generateAlerts();
    await procurementService.generateRecommendations();
    ok(r, { success: true });
  }),
);

app.use(errorHandler);

export { app, httpServer };
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(Number(process.env.PORT || 3000), () => console.log('Mini ERP API listening'));
}
