import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { inventoryService } from './inventory.service.js';

type Db = PrismaClient | Prisma.TransactionClient;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export class DashboardService {
  async summary(db: Db = prisma) {
    const [
      totalSalesOrders,
      pendingDeliveries,
      activeManufacturingOrders,
      totalPurchaseOrders,
      partialReceipts,
      businessHealth,
    ] = await Promise.all([
      db.salesOrder.count(),
      db.salesOrder.count({ where: { status: { in: ['CONFIRMED', 'PARTIALLY_DELIVERED'] as any } } }),
      db.manufacturingOrder.count({ where: { status: { in: ['DRAFT', 'CONFIRMED', 'IN_PROGRESS'] as any } } }),
      db.purchaseOrder.count(),
      db.purchaseOrder.count({ where: { status: 'PARTIALLY_RECEIVED' as any } }),
      this.businessHealth(db),
    ]);
    return {
      totalSalesOrders,
      pendingDeliveries,
      manufacturingOrders: activeManufacturingOrders,
      delayedOrders: businessHealth.delayedOrders,
      totalPurchaseOrders,
      partialReceipts,
      inventoryHealthScore: businessHealth.inventoryHealthScore,
      lowStockProducts: businessHealth.lowStockProducts,
      productsBelowReorderPoint: businessHealth.productsBelowReorderPoint,
      productsWithNoMovement: businessHealth.productsWithNoMovement,
      openProcurementOrders: businessHealth.openProcurements,
      averageProcurementLeadTime: businessHealth.averageProcurementLeadTime,
      manufacturingThroughput: businessHealth.manufacturingThroughput,
      topSellingProducts: businessHealth.topSellingProducts,
    };
  }

  async roleSummary(db: Db = prisma) {
    const [sales, purchase, manufacturing, inventory, audit] = await Promise.all([
      db.salesOrder.count({ where: { status: { in: ['CONFIRMED', 'PARTIALLY_DELIVERED'] as any } } }),
      db.purchaseOrder.count({ where: { status: { in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] as any } } }),
      db.manufacturingOrder.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] as any } } }),
      db.product.count({ where: { active: true } }),
      db.auditLog.count(),
    ]);
    return {
      sales: { pendingDeliveries: sales },
      purchase: { openPurchaseOrders: purchase },
      manufacturing: { activeManufacturingOrders: manufacturing },
      admin: { activeProducts: inventory, totalAuditLogs: audit },
    };
  }

  async delayedOrders(db: Db = prisma) {
    const now = new Date();
    const [delayedSalesOrders, delayedPurchaseOrders, delayedManufacturingOrders] = await Promise.all([
      db.salesOrder.count({ where: { expectedDeliveryDate: { lt: now }, status: { notIn: ['FULLY_DELIVERED', 'CANCELLED'] as any } } }),
      db.purchaseOrder.count({ where: { expectedReceiptDate: { lt: now }, status: { notIn: ['FULLY_RECEIVED', 'CANCELLED'] as any } } }),
      db.manufacturingOrder.count({ where: { plannedCompletionDate: { lt: now }, status: { notIn: ['COMPLETED', 'CANCELLED'] as any } } }),
    ]);
    return {
      delayedOrders: delayedSalesOrders + delayedPurchaseOrders + delayedManufacturingOrders,
      delayedSalesOrders,
      delayedPurchaseOrders,
      delayedManufacturingOrders,
    };
  }

  async businessHealth(db: Db = prisma) {
    const [products, movedProducts, delayed, openProcurements, activeManufacturingOrders, reconciliation, auditEventsToday, completedMos, topSellingRows, leadTime] = await Promise.all([
      db.product.findMany({ where: { active: true } }),
      db.stockMovement.groupBy({ by: ['productId'] }),
      this.delayedOrders(db),
      db.purchaseOrder.count({ where: { status: { in: ['DRAFT', 'CONFIRMED', 'PARTIALLY_RECEIVED'] as any } } }),
      db.manufacturingOrder.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] as any } } }),
      this.reconciliation(db),
      db.auditLog.count({ where: { createdAt: { gte: startOfToday() } } }),
      db.manufacturingOrder.count({ where: { status: 'COMPLETED' as any } }),
      db.salesOrderItem.groupBy({ by: ['productId'], _sum: { deliveredQty: true, orderedQty: true }, orderBy: { _sum: { deliveredQty: 'desc' } }, take: 5 }),
      this.averageProcurementLeadTime(db),
    ]);
    const moved = new Set(movedProducts.map((x) => x.productId));
    const balances = await Promise.all(products.map(async (p) => ({ product: p, ...(await inventoryService.balances(db as Prisma.TransactionClient, p.id)) })));
    const lowStock = balances.filter((x) => x.available <= Math.max(Number(x.product.reorderPoint), Number(x.product.safetyStock)));
    const belowReorder = balances.filter((x) => x.available <= Number(x.product.reorderPoint));
    const noMovement = products.filter((p) => !moved.has(p.id));
    const topProductIds = topSellingRows.map((x) => x.productId);
    const topProducts = topProductIds.length ? await db.product.findMany({ where: { id: { in: topProductIds } } }) : [];
    const topById = new Map(topProducts.map((p) => [p.id, p]));
    const inventoryHealthScore = products.length ? Math.max(0, Math.round(((products.length - lowStock.length) / products.length) * 100)) : 100;

    return {
      inventoryHealthScore,
      lowStockProducts: lowStock.map((x) => ({ id: x.product.id, reference: x.product.reference, name: x.product.name, availableQty: x.available, reorderPoint: Number(x.product.reorderPoint), safetyStock: Number(x.product.safetyStock) })),
      productsBelowReorderPoint: belowReorder.length,
      productsWithNoMovement: noMovement.length,
      delayedOrders: delayed.delayedOrders,
      delayedSalesOrders: delayed.delayedSalesOrders,
      delayedPurchaseOrders: delayed.delayedPurchaseOrders,
      delayedManufacturingOrders: delayed.delayedManufacturingOrders,
      openProcurements,
      activeManufacturingOrders,
      reconciliationStatus: reconciliation.status,
      auditEventsToday,
      averageProcurementLeadTime: leadTime,
      manufacturingThroughput: completedMos,
      topSellingProducts: topSellingRows.map((row) => ({ productId: row.productId, reference: topById.get(row.productId)?.reference, name: topById.get(row.productId)?.name, deliveredQty: Number(row._sum.deliveredQty || 0), orderedQty: Number(row._sum.orderedQty || 0) })),
    };
  }

  async reconciliation(db: Db = prisma) {
    const [products, movementSums] = await Promise.all([
      db.product.findMany({ where: { active: true } }),
      db.stockMovement.groupBy({ by: ['productId'], _sum: { signedQty: true } }),
    ]);
    const sumByProduct = new Map(movementSums.map((x) => [x.productId, Number(x._sum.signedQty || 0)]));
    const rows = products.map((p) => {
      const expected = sumByProduct.get(p.id) || 0;
      const actual = Number(p.onHandQty);
      return { productId: p.id, reference: p.reference, name: p.name, expected, actual, difference: actual - expected };
    });
    const mismatches = rows.filter((x) => Math.abs(x.difference) > 0.0001);
    return { status: mismatches.length ? 'MISMATCHED' : 'HEALTHY', mismatches, products: rows };
  }

  async averageProcurementLeadTime(db: Db = prisma) {
    const received = await db.purchaseOrder.findMany({ where: { status: 'FULLY_RECEIVED' as any }, select: { createdAt: true, updatedAt: true } });
    if (!received.length) return 0;
    const totalMs = received.reduce((sum, po) => sum + (po.updatedAt.getTime() - po.createdAt.getTime()), 0);
    return Number((totalMs / received.length / 86_400_000).toFixed(2));
  }

  async vendorLeadTimes(db: Db = prisma) {
    const vendors = await db.vendor.findMany({ include: { purchaseOrders: { where: { status: 'FULLY_RECEIVED' as any }, select: { createdAt: true, updatedAt: true } } } });
    return vendors.map((vendor) => {
      const totalMs = vendor.purchaseOrders.reduce((sum, po) => sum + (po.updatedAt.getTime() - po.createdAt.getTime()), 0);
      return {
        vendor: { id: vendor.id, reference: vendor.reference, name: vendor.name },
        averageLeadTimeDays: vendor.purchaseOrders.length ? Number((totalMs / vendor.purchaseOrders.length / 86_400_000).toFixed(2)) : 0,
        totalOrders: vendor.purchaseOrders.length,
      };
    });
  }
}

export const dashboardService = new DashboardService();
