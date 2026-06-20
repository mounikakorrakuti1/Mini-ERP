'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
require('dotenv/config');
const express_1 = __importDefault(require('express'));
const cors_1 = __importDefault(require('cors'));
const helmet_1 = __importDefault(require('helmet'));
const morgan_1 = __importDefault(require('morgan'));
const express_rate_limit_1 = __importDefault(require('express-rate-limit'));
const bcryptjs_1 = __importDefault(require('bcryptjs'));
const jsonwebtoken_1 = __importDefault(require('jsonwebtoken'));
const swagger_ui_express_1 = __importDefault(require('swagger-ui-express'));
const zod_1 = require('zod');
const prisma_js_1 = require('./lib/prisma.js');
const errors_js_1 = require('./lib/errors.js');
const auth_js_1 = require('./middleware/auth.js');
const orders_service_js_1 = require('./services/orders.service.js');
const inventory_service_js_1 = require('./services/inventory.service.js');
const swagger_js_1 = require('./swagger.js');
const client_1 = require('@prisma/client');
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('tiny'));
app.use((0, express_rate_limit_1.default)({ windowMs: 60_000, max: 120 }));
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const body = (schema) => (req, _res, next) => {
  req.body = schema.parse(req.body);
  next();
};
const id = zod_1.z.string().uuid();
const items = zod_1.z
  .array(
    zod_1.z.object({
      productId: id,
      orderedQty: zod_1.z.coerce.number().positive(),
      salesPrice: zod_1.z.coerce.number().nonnegative().optional(),
      costPrice: zod_1.z.coerce.number().nonnegative().optional(),
    }),
  )
  .min(1);
app.get('/health', (_q, r) => r.json({ status: 'ok' }));
app.use(
  '/swagger',
  swagger_ui_express_1.default.serve,
  swagger_ui_express_1.default.setup(swagger_js_1.openApiSpec),
);
app.post(
  '/auth/register',
  body(
    zod_1.z.object({
      loginId: zod_1.z.string().min(6).max(12),
      email: zod_1.z.string().email(),
      password: zod_1.z
        .string()
        .min(8)
        .regex(/[A-Z]/)
        .regex(/[a-z]/)
        .regex(/[^A-Za-z0-9]/),
      name: zod_1.z.string().min(1),
    }),
  ),
  (0, errors_js_1.asyncHandler)(async (req, res) => {
    const hash = await bcryptjs_1.default.hash(req.body.password, 12);
    const user = await prisma_js_1.prisma.user.create({
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
  body(zod_1.z.object({ loginId: zod_1.z.string(), password: zod_1.z.string() })),
  (0, errors_js_1.asyncHandler)(async (req, res) => {
    const user = await prisma_js_1.prisma.user.findUnique({
      where: { loginId: req.body.loginId },
      include: {
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
    if (
      !user ||
      !user.active ||
      !(await bcryptjs_1.default.compare(req.body.password, user.passwordHash))
    )
      throw new errors_js_1.AppError(401, 'Invalid Login Id or Password');
    const permissions = user.roles.flatMap((x) => x.role.permissions.map((p) => p.permission.code));
    const token = jsonwebtoken_1.default.sign(
      { sub: user.id, permissions },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );
    await prisma_js_1.prisma.auditLog.create({
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
  auth_js_1.authenticate,
  (0, errors_js_1.asyncHandler)(async (req, res) =>
    ok(res, {
      accessToken: jsonwebtoken_1.default.sign(
        { sub: req.user.sub, permissions: req.user.permissions },
        process.env.JWT_SECRET,
        { expiresIn: '15m' },
      ),
    }),
  ),
);
app.post('/auth/logout', auth_js_1.authenticate, (_q, r) => r.status(204).send());
const master = (path, model, permission, module, recordType) => {
  app.get(
    path,
    auth_js_1.authenticate,
    (0, auth_js_1.requirePermission)(permission),
    (0, errors_js_1.asyncHandler)(async (_q, r) => ok(r, await model.findMany())),
  );
  app.post(
    path,
    auth_js_1.authenticate,
    (0, auth_js_1.requirePermission)(permission),
    (0, errors_js_1.asyncHandler)(async (q, r) =>
      ok(
        r,
        await prisma_js_1.prisma.$transaction(async (tx) => {
          const created = await tx[model.name].create({ data: q.body });
          await tx.auditLog.create({
            data: {
              actorId: q.user.sub,
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
    auth_js_1.authenticate,
    (0, auth_js_1.requirePermission)(permission),
    (0, errors_js_1.asyncHandler)(async (q, r) =>
      ok(
        r,
        await prisma_js_1.prisma.$transaction(async (tx) => {
          const repo = tx[model.name];
          const before = await repo.findUniqueOrThrow({ where: { id: q.params.id } });
          const updated = await repo.update({ where: { id: q.params.id }, data: q.body });
          for (const [field, value] of Object.entries(q.body)) {
            await tx.auditLog.create({
              data: {
                actorId: q.user.sub,
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
  { ...prisma_js_1.prisma.customer, name: 'customer' },
  'MANAGE_CUSTOMERS',
  'CUSTOMER',
  'Customer',
);
master(
  '/vendors',
  { ...prisma_js_1.prisma.vendor, name: 'vendor' },
  'MANAGE_VENDORS',
  'VENDOR',
  'Vendor',
);
app.get(
  '/products',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('VIEW_PRODUCTS'),
  (0, errors_js_1.asyncHandler)(async (_q, r) =>
    ok(r, await prisma_js_1.prisma.product.findMany({ where: { active: true } })),
  ),
);
app.post(
  '/products',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('MANAGE_PRODUCTS'),
  (0, errors_js_1.asyncHandler)(async (q, r) => {
    const d = q.body;
    if (
      d.procureOnDemand &&
      (!d.procurementType ||
        (d.procurementType === 'PURCHASE' && !d.defaultVendorId) ||
        (d.procurementType === 'MANUFACTURING' && !d.defaultBomId))
    )
      throw new errors_js_1.AppError(422, 'Invalid procurement configuration');
    ok(
      r,
      await prisma_js_1.prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: { ...d, reference: `PROD-${Date.now()}` },
        });
        await tx.auditLog.create({
          data: {
            actorId: q.user.sub,
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
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('MANAGE_PRODUCTS'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(
      r,
      await prisma_js_1.prisma.$transaction(async (tx) => {
        const before = await tx.product.findUniqueOrThrow({ where: { id: q.params.id } });
        const updated = await tx.product.update({ where: { id: q.params.id }, data: q.body });
        for (const [field, value] of Object.entries(q.body)) {
          await tx.auditLog.create({
            data: {
              actorId: q.user.sub,
              module: 'PRODUCT',
              recordType: 'Product',
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
app.post(
  '/products/:id/adjust-stock',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('ADJUST_INVENTORY'),
  body(
    zod_1.z.object({
      direction: zod_1.z.nativeEnum(client_1.StockDirection),
      quantity: zod_1.z.coerce.number().positive(),
      reason: zod_1.z.string().min(1),
    }),
  ),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(
      r,
      await prisma_js_1.prisma.$transaction(async (tx) => {
        await inventory_service_js_1.inventoryService.move(
          tx,
          q.user.sub,
          q.params.id,
          q.body.direction,
          q.body.quantity,
          client_1.StockSource.MANUAL_ADJUSTMENT,
          'ManualAdjustment',
          q.body.reason,
        );
        return inventory_service_js_1.inventoryService.balances(tx, q.params.id);
      }),
    ),
  ),
);
app.post(
  '/sales-orders',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('CREATE_SALES_ORDER'),
  body(
    zod_1.z.object({
      customerId: id,
      customerAddress: zod_1.z.string().optional(),
      salesPersonId: id.optional(),
      items,
    }),
  ),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.createSales(q.user.sub, q.body), 201),
  ),
);
app.get(
  '/dashboard/summary',
  auth_js_1.authenticate,
  (0, errors_js_1.asyncHandler)(async (_q, r) => {
    const [
      totalSalesOrders,
      pendingDeliveries,
      manufacturingOrders,
      delayedOrders,
      totalPurchaseOrders,
      partialReceipts,
    ] = await Promise.all([
      prisma_js_1.prisma.salesOrder.count(),
      prisma_js_1.prisma.salesOrder.count({
        where: { status: { in: ['CONFIRMED', 'PARTIALLY_DELIVERED'] } },
      }),
      prisma_js_1.prisma.manufacturingOrder.count({
        where: { status: { in: ['DRAFT', 'CONFIRMED', 'IN_PROGRESS'] } },
      }),
      Promise.resolve(0),
      prisma_js_1.prisma.purchaseOrder.count(),
      prisma_js_1.prisma.purchaseOrder.count({ where: { status: 'PARTIALLY_RECEIVED' } }),
    ]);
    ok(r, {
      totalSalesOrders,
      pendingDeliveries,
      manufacturingOrders,
      delayedOrders,
      totalPurchaseOrders,
      partialReceipts,
    });
  }),
);
app.get(
  '/dashboard/role-summary',
  auth_js_1.authenticate,
  (0, errors_js_1.asyncHandler)(async (q, r) => {
    const roles = await prisma_js_1.prisma.userRole.findMany({
      where: { userId: q.user.sub },
      include: { role: true },
    });
    const roleNames = roles.map((x) => x.role.name);
    const base = { roles: roleNames };
    const [sales, purchase, manufacturing, inventory, audit] = await Promise.all([
      prisma_js_1.prisma.salesOrder.count({
        where: { status: { in: ['CONFIRMED', 'PARTIALLY_DELIVERED'] } },
      }),
      prisma_js_1.prisma.purchaseOrder.count({
        where: { status: { in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] } },
      }),
      prisma_js_1.prisma.manufacturingOrder.count({
        where: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
      }),
      prisma_js_1.prisma.product.count({ where: { active: true } }),
      prisma_js_1.prisma.auditLog.count(),
    ]);
    if (roleNames.some((x) => x.includes('Sales')))
      return ok(r, {
        ...base,
        pendingDeliveries: sales,
        totalSalesOrders: await prisma_js_1.prisma.salesOrder.count(),
      });
    if (roleNames.some((x) => x.includes('Purchase')))
      return ok(r, {
        ...base,
        openPurchaseOrders: purchase,
        partialReceipts: await prisma_js_1.prisma.purchaseOrder.count({
          where: { status: 'PARTIALLY_RECEIVED' },
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
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('VIEW_SALES_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(
      r,
      await prisma_js_1.prisma.salesOrder.findMany({
        where: q.query.status ? { status: String(q.query.status) } : undefined,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
    ),
  ),
);
app.get(
  '/sales-orders/:id',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('VIEW_SALES_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(
      r,
      await prisma_js_1.prisma.salesOrder.findUniqueOrThrow({
        where: { id: q.params.id },
        include: { items: { include: { product: true } }, reservations: true },
      }),
    ),
  ),
);
app.patch(
  '/sales-orders/:id',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('CREATE_SALES_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.updateSales(q.user.sub, q.params.id, q.body)),
  ),
);
app.patch(
  '/sales-orders/:id/confirm',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('CONFIRM_SALES_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.confirmSales(q.user.sub, q.params.id)),
  ),
);
app.patch(
  '/sales-orders/:id/deliver',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('DELIVER_SALES_ORDER'),
  body(
    zod_1.z.object({
      items: zod_1.z.array(
        zod_1.z.object({ itemId: id, deliveredQty: zod_1.z.coerce.number().nonnegative() }),
      ),
    }),
  ),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(
      r,
      await orders_service_js_1.ordersService.deliverSales(q.user.sub, q.params.id, q.body.items),
    ),
  ),
);
app.patch(
  '/sales-orders/:id/cancel',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('CONFIRM_SALES_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.cancelSales(q.user.sub, q.params.id)),
  ),
);
app.post(
  '/purchase-orders',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('CREATE_PURCHASE_ORDER'),
  body(zod_1.z.object({ vendorId: id, vendorAddress: zod_1.z.string().optional(), items })),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.createPurchase(q.user.sub, q.body), 201),
  ),
);
app.get(
  '/purchase-orders',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('VIEW_PURCHASE_ORDER'),
  (0, errors_js_1.asyncHandler)(async (_q, r) =>
    ok(r, await prisma_js_1.prisma.purchaseOrder.findMany({ include: { items: true } })),
  ),
);
app.patch(
  '/purchase-orders/:id',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('CREATE_PURCHASE_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.updatePurchase(q.user.sub, q.params.id, q.body)),
  ),
);
app.patch(
  '/purchase-orders/:id/confirm',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('CONFIRM_PURCHASE_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.confirmPurchase(q.user.sub, q.params.id)),
  ),
);
app.patch(
  '/purchase-orders/:id/receive',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('RECEIVE_PURCHASE_ORDER'),
  body(
    zod_1.z.object({
      items: zod_1.z.array(
        zod_1.z.object({ itemId: id, receivedQty: zod_1.z.coerce.number().nonnegative() }),
      ),
    }),
  ),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(
      r,
      await orders_service_js_1.ordersService.receivePurchase(
        q.user.sub,
        q.params.id,
        q.body.items,
      ),
    ),
  ),
);
app.patch(
  '/purchase-orders/:id/cancel',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('CONFIRM_PURCHASE_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.cancelPurchase(q.user.sub, q.params.id)),
  ),
);
app.get(
  '/bom',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('VIEW_BOM'),
  (0, errors_js_1.asyncHandler)(async (_q, r) =>
    ok(r, await prisma_js_1.prisma.bom.findMany({ include: { items: true, operations: true } })),
  ),
);
app.post(
  '/bom',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('EDIT_BOM'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(
      r,
      await prisma_js_1.prisma.$transaction(async (tx) => {
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
            actorId: q.user.sub,
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
app.post(
  '/manufacturing-orders',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('CREATE_MANUFACTURING_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.createMo(q.user.sub, q.body), 201),
  ),
);
app.get(
  '/manufacturing-orders',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('VIEW_MANUFACTURING_ORDER'),
  (0, errors_js_1.asyncHandler)(async (_q, r) =>
    ok(
      r,
      await prisma_js_1.prisma.manufacturingOrder.findMany({
        include: { items: true, workOrders: true },
      }),
    ),
  ),
);
app.patch(
  '/manufacturing-orders/:id',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('CREATE_MANUFACTURING_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.updateMo(q.user.sub, q.params.id, q.body)),
  ),
);
app.patch(
  '/manufacturing-orders/:id/confirm',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('CONFIRM_MANUFACTURING_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.confirmMo(q.user.sub, q.params.id)),
  ),
);
app.patch(
  '/manufacturing-orders/:id/start',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('START_MANUFACTURING_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.startMo(q.user.sub, q.params.id)),
  ),
);
app.patch(
  '/manufacturing-orders/:id/complete',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('COMPLETE_MANUFACTURING_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.completeMo(q.user.sub, q.params.id)),
  ),
);
app.patch(
  '/manufacturing-orders/:id/cancel',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('CONFIRM_MANUFACTURING_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(r, await orders_service_js_1.ordersService.cancelMo(q.user.sub, q.params.id)),
  ),
);
app.get(
  '/inventory/summary',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('VIEW_INVENTORY'),
  (0, errors_js_1.asyncHandler)(async (_q, r) => {
    const products = await prisma_js_1.prisma.product.findMany({ where: { active: true } });
    ok(
      r,
      await prisma_js_1.prisma.$transaction((tx) =>
        Promise.all(
          products.map(async (p) => ({
            ...p,
            ...(await inventory_service_js_1.inventoryService.balances(tx, p.id)),
          })),
        ),
      ),
    );
  }),
);
app.get(
  '/inventory/movements',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('VIEW_INVENTORY'),
  (0, errors_js_1.asyncHandler)(async (_q, r) =>
    ok(
      r,
      await prisma_js_1.prisma.stockMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
    ),
  ),
);
app.get(
  '/inventory/reconciliation',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('VIEW_INVENTORY'),
  (0, errors_js_1.asyncHandler)(async (_q, r) => {
    const [products, movementSums] = await Promise.all([
      prisma_js_1.prisma.product.findMany({ where: { active: true } }),
      prisma_js_1.prisma.stockMovement.groupBy({ by: ['productId'], _sum: { signedQty: true } }),
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
        difference: actual - expected,
      };
    });
    const mismatches = rows.filter((x) => Math.abs(x.difference) > 0.0001);
    ok(r, { status: mismatches.length ? 'MISMATCHED' : 'HEALTHY', mismatches, products: rows });
  }),
);
app.get(
  '/traceability/sales-order/:id',
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('VIEW_SALES_ORDER'),
  (0, errors_js_1.asyncHandler)(async (q, r) => {
    const salesOrder = await prisma_js_1.prisma.salesOrder.findUniqueOrThrow({
      where: { id: q.params.id },
      include: { items: { include: { product: true } }, customer: true, reservations: true },
    });
    const purchaseOrders = await prisma_js_1.prisma.purchaseOrder.findMany({
      where: { triggerSourceSoId: q.params.id },
      include: { items: { include: { product: true } }, vendor: true },
    });
    const manufacturingOrders = await prisma_js_1.prisma.manufacturingOrder.findMany({
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
      prisma_js_1.prisma.stockMovement.findMany({
        where: { referenceId: { in: referenceIds } },
        include: { product: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma_js_1.prisma.auditLog.findMany({
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
  auth_js_1.authenticate,
  (0, auth_js_1.requirePermission)('VIEW_AUDIT_LOGS'),
  (0, errors_js_1.asyncHandler)(async (_q, r) =>
    ok(
      r,
      await prisma_js_1.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }),
    ),
  ),
);
app.get(
  '/notifications',
  auth_js_1.authenticate,
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(
      r,
      await prisma_js_1.prisma.notification.findMany({
        where: { userId: q.user.sub, readAt: null },
      }),
    ),
  ),
);
app.patch(
  '/notifications/:id/read',
  auth_js_1.authenticate,
  (0, errors_js_1.asyncHandler)(async (q, r) =>
    ok(
      r,
      await prisma_js_1.prisma.$transaction(async (tx) => {
        const n = await tx.notification.update({
          where: { id: q.params.id },
          data: { readAt: new Date() },
        });
        await tx.auditLog.create({
          data: {
            actorId: q.user.sub,
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
app.use(errors_js_1.errorHandler);
app.listen(Number(process.env.PORT || 3000), () => console.log('Mini ERP API listening'));
