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
import { openApiSpec } from './swagger.js';
import { StockDirection, StockSource } from '@prisma/client';
const app = express();
const httpServer = createServer(app);
realtimeService.init(httpServer);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));
const ok = (res: express.Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data });
const body = (schema: z.ZodTypeAny) => (req: any, _res: any, next: any) => {
  req.body = schema.parse(req.body);
  next();
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
        .min(8)
        .regex(/[A-Z]/)
        .regex(/[a-z]/)
        .regex(/[^A-Za-z0-9]/),
      name: z.string().min(1),
    }),
  ),
  asyncHandler(async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.user.create({
      data: {
        loginId: req.body.loginId,
        email: req.body.email,
        passwordHash: hash,
        name: req.body.name,
      },
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
    const permissions = user.roles.flatMap((x) => x.role.permissions.map((p) => p.permission.code));
    const token = jwt.sign({ sub: user.id, permissions }, process.env.JWT_SECRET!, {
      expiresIn: '15m',
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
    ok(res, { accessToken: token, user: { id: user.id, name: user.name, permissions } });
  }),
);
app.post(
  '/auth/refresh',
  authenticate,
  asyncHandler(async (req, res) =>
    ok(res, {
      accessToken: jwt.sign(
        { sub: req.user!.sub, permissions: req.user!.permissions },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' },
      ),
    }),
  ),
);
app.post('/auth/logout', authenticate, (_q, r) => r.status(204).send());
const master = (
  path: string,
  model: any,
  permission: string,
  module: string,
  recordType: string,
) => {
  app.get(
    path,
    authenticate,
    requirePermission(permission),
    asyncHandler(async (_q, r) => ok(r, await model.findMany())),
  );
  app.post(
    path,
    authenticate,
    requirePermission(permission),
    asyncHandler(async (q, r) =>
      ok(
        r,
        await prisma.$transaction(async (tx) => {
          const created = await (tx as any)[model.name].create({ data: q.body });
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
    requirePermission(permission),
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
  'MANAGE_CUSTOMERS',
  'CUSTOMER',
  'Customer',
);
master('/vendors', { ...prisma.vendor, name: 'vendor' }, 'MANAGE_VENDORS', 'VENDOR', 'Vendor');
app.get(
  '/products',
  authenticate,
  requirePermission('VIEW_PRODUCTS'),
  asyncHandler(async (_q, r) => ok(r, await prisma.product.findMany({ where: { active: true } }))),
);
app.post(
  '/products',
  authenticate,
  requirePermission('MANAGE_PRODUCTS'),
  asyncHandler(async (q, r) => {
    const d = q.body;
    if (
      d.procureOnDemand &&
      (!d.procurementType ||
        (d.procurementType === 'PURCHASE' && !d.defaultVendorId) ||
        (d.procurementType === 'MANUFACTURING' && !d.defaultBomId))
    )
      throw new AppError(422, 'Invalid procurement configuration');
    ok(
      r,
      await prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: { ...d, reference: `PROD-${Date.now()}` },
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
  }),
);
app.patch(
  '/products/:id',
  authenticate,
  requirePermission('MANAGE_PRODUCTS'),
  asyncHandler(async (q, r) =>
    ok(
      r,
      await prisma.$transaction(async (tx) => {
        const before = await tx.product.findUniqueOrThrow({ where: { id: q.params.id } });
        const updated = await tx.product.update({ where: { id: q.params.id }, data: q.body });
        for (const [field, value] of Object.entries(q.body)) {
          await tx.auditLog.create({
            data: {
              actorId: q.user!.sub,
              module: 'PRODUCT',
              recordType: 'Product',
              recordId: q.params.id,
              action: 'UPDATE',
              fieldName: field,
              oldValue: String((before as any)[field]),
              newValue: String(value),
            },
          });
        }
        return updated;
      }),
    ),
  ),
);
app.post(
  '/products/:id/adjust-stock',
  authenticate,
  requirePermission('ADJUST_INVENTORY'),
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
  requirePermission('CREATE_SALES_ORDER'),
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
  asyncHandler(async (_q, r) => ok(r, await dashboardService.summary())),
);
app.get(
  '/dashboard/business-health',
  authenticate,
  asyncHandler(async (_q, r) => ok(r, await dashboardService.businessHealth())),
);
app.get(
  '/dashboard/role-summary',
  authenticate,
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
  requirePermission('VIEW_SALES_ORDER'),
  asyncHandler(async (q, r) =>
    ok(
      r,
      await prisma.salesOrder.findMany({
        where: q.query.status ? { status: String(q.query.status) as any } : undefined,
        include: { items: true, customer: true },
        orderBy: { createdAt: 'desc' },
      }),
    ),
  ),
);
app.get(
  '/sales-orders/:id',
  authenticate,
  requirePermission('VIEW_SALES_ORDER'),
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
  requirePermission('CREATE_SALES_ORDER'),
  asyncHandler(async (q, r) =>
    ok(r, await ordersService.updateSales(q.user!.sub, q.params.id, q.body)),
  ),
);
app.patch(
  '/sales-orders/:id/confirm',
  authenticate,
  requirePermission('CONFIRM_SALES_ORDER'),
  asyncHandler(async (q, r) => ok(r, await ordersService.confirmSales(q.user!.sub, q.params.id))),
);
app.patch(
  '/sales-orders/:id/deliver',
  authenticate,
  requirePermission('DELIVER_SALES_ORDER'),
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
  requirePermission('CONFIRM_SALES_ORDER'),
  asyncHandler(async (q, r) => ok(r, await ordersService.cancelSales(q.user!.sub, q.params.id))),
);
app.post(
  '/purchase-orders',
  authenticate,
  requirePermission('CREATE_PURCHASE_ORDER'),
  body(z.object({ vendorId: id, vendorAddress: z.string().optional(), expectedReceiptDate: dateField, items })),
  asyncHandler(async (q, r) => ok(r, await ordersService.createPurchase(q.user!.sub, q.body), 201)),
);
app.get(
  '/purchase-orders',
  authenticate,
  requirePermission('VIEW_PURCHASE_ORDER'),
  asyncHandler(async (_q, r) =>
    ok(r, await prisma.purchaseOrder.findMany({ include: { items: true, vendor: true }, orderBy: { createdAt: 'desc' } })),
  ),
);
app.get(
  '/purchase-orders/:id',
  authenticate,
  requirePermission('VIEW_PURCHASE_ORDER'),
  asyncHandler(async (q, r) =>
    ok(r, await prisma.purchaseOrder.findUniqueOrThrow({ where: { id: q.params.id }, include: { items: { include: { product: true } }, vendor: true } })),
  ),
);
app.patch(
  '/purchase-orders/:id',
  authenticate,
  requirePermission('CREATE_PURCHASE_ORDER'),
  asyncHandler(async (q, r) =>
    ok(r, await ordersService.updatePurchase(q.user!.sub, q.params.id, q.body)),
  ),
);
app.patch(
  '/purchase-orders/:id/confirm',
  authenticate,
  requirePermission('CONFIRM_PURCHASE_ORDER'),
  asyncHandler(async (q, r) =>
    ok(r, await ordersService.confirmPurchase(q.user!.sub, q.params.id)),
  ),
);
app.patch(
  '/purchase-orders/:id/receive',
  authenticate,
  requirePermission('RECEIVE_PURCHASE_ORDER'),
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
  requirePermission('CONFIRM_PURCHASE_ORDER'),
  asyncHandler(async (q, r) => ok(r, await ordersService.cancelPurchase(q.user!.sub, q.params.id))),
);
app.get(
  '/bom',
  authenticate,
  requirePermission('VIEW_BOM'),
  asyncHandler(async (_q, r) =>
    ok(r, await prisma.bom.findMany({ include: { items: { include: { product: true } }, operations: true, finishedProduct: true }, orderBy: { createdAt: 'desc' } })),
  ),
);
app.get(
  '/bom/:id',
  authenticate,
  requirePermission('VIEW_BOM'),
  asyncHandler(async (q, r) =>
    ok(r, await prisma.bom.findUniqueOrThrow({ where: { id: q.params.id }, include: { items: { include: { product: true } }, operations: true, finishedProduct: true } })),
  ),
);
app.post(
  '/bom',
  authenticate,
  requirePermission('EDIT_BOM'),
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
  requirePermission('EDIT_BOM'),
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
  requirePermission('CREATE_MANUFACTURING_ORDER'),
  asyncHandler(async (q, r) => ok(r, await ordersService.createMo(q.user!.sub, q.body), 201)),
);
app.get(
  '/manufacturing-orders',
  authenticate,
  requirePermission('VIEW_MANUFACTURING_ORDER'),
  asyncHandler(async (_q, r) =>
    ok(r, await prisma.manufacturingOrder.findMany({ include: { items: { include: { product: true } }, workOrders: true, finishedProduct: true, bom: true }, orderBy: { createdAt: 'desc' } })),
  ),
);
app.get(
  '/manufacturing-orders/:id',
  authenticate,
  requirePermission('VIEW_MANUFACTURING_ORDER'),
  asyncHandler(async (q, r) =>
    ok(r, await prisma.manufacturingOrder.findUniqueOrThrow({ where: { id: q.params.id }, include: { items: { include: { product: true } }, workOrders: true, finishedProduct: true, bom: true } })),
  ),
);
app.patch(
  '/manufacturing-orders/:id',
  authenticate,
  requirePermission('CREATE_MANUFACTURING_ORDER'),
  asyncHandler(async (q, r) =>
    ok(r, await ordersService.updateMo(q.user!.sub, q.params.id, q.body)),
  ),
);
app.patch(
  '/manufacturing-orders/:id/confirm',
  authenticate,
  requirePermission('CONFIRM_MANUFACTURING_ORDER'),
  asyncHandler(async (q, r) => ok(r, await ordersService.confirmMo(q.user!.sub, q.params.id))),
);
app.patch(
  '/manufacturing-orders/:id/start',
  authenticate,
  requirePermission('START_MANUFACTURING_ORDER'),
  asyncHandler(async (q, r) => ok(r, await ordersService.startMo(q.user!.sub, q.params.id))),
);
app.patch(
  '/manufacturing-orders/:id/complete',
  authenticate,
  requirePermission('COMPLETE_MANUFACTURING_ORDER'),
  asyncHandler(async (q, r) => ok(r, await ordersService.completeMo(q.user!.sub, q.params.id))),
);
app.patch(
  '/manufacturing-orders/:id/cancel',
  authenticate,
  requirePermission('CONFIRM_MANUFACTURING_ORDER'),
  asyncHandler(async (q, r) => ok(r, await ordersService.cancelMo(q.user!.sub, q.params.id))),
);
app.get(
  '/inventory/summary',
  authenticate,
  requirePermission('VIEW_INVENTORY'),
  asyncHandler(async (_q, r) => {
    const products = await prisma.product.findMany({ where: { active: true } });
    ok(
      r,
      await prisma.$transaction((tx) =>
        Promise.all(
          products.map(async (p) => ({ ...p, ...(await inventoryService.balances(tx, p.id)) })),
        ),
      ),
    );
  }),
);
app.get(
  '/inventory/movements',
  authenticate,
  requirePermission('VIEW_INVENTORY'),
  asyncHandler(async (_q, r) =>
    ok(r, await prisma.stockMovement.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })),
  ),
);
app.get(
  '/inventory/reconciliation',
  authenticate,
  requirePermission('VIEW_INVENTORY'),
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
  '/traceability/sales-order/:id',
  authenticate,
  requirePermission('VIEW_SALES_ORDER'),
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
  requirePermission('VIEW_AUDIT_LOGS'),
  asyncHandler(async (_q, r) =>
    ok(r, await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })),
  ),
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
        const n = await tx.notification.update({
          where: { id: q.params.id },
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
app.use(errorHandler);
app.listen(Number(process.env.PORT || 3000), () => console.log('Mini ERP API listening'));
