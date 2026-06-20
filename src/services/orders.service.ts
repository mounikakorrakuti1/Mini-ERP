import {
  ManufacturingStatus,
  Prisma,
  PurchaseStatus,
  SalesStatus,
  StockDirection,
  StockSource,
} from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { audit } from '../lib/audit.js';
import { AppError } from '../lib/errors.js';
import { inventoryService } from './inventory.service.js';

const ref = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const locked = (data: any, fields: string[]) =>
  fields.filter((field) => Object.prototype.hasOwnProperty.call(data, field));
const requireUniqueProducts = (items: any[], label: string) => {
  const seen = new Set<string>();
  for (const item of items || []) {
    if (Number(item.orderedQty ?? item.quantity ?? item.requiredQty) <= 0)
      throw new AppError(422, `${label} quantity must be greater than zero`);
    if (seen.has(item.productId))
      throw new AppError(422, `${label} cannot contain duplicate product lines`);
    seen.add(item.productId);
  }
};

export class OrdersService {
  async createSales(actor: string, d: any) {
    return prisma.$transaction(async (tx) => {
      if (!d.items?.length) throw new AppError(422, 'Sales order requires at least one item');
      requireUniqueProducts(d.items, 'Sales order');
      const customer = await tx.customer.findUnique({ where: { id: d.customerId } });
      if (!customer) throw new AppError(404, 'Customer not found');
      const so = await tx.salesOrder.create({
        data: {
          reference: ref('SO'),
          customerId: d.customerId,
          customerAddress: d.customerAddress,
          salesPersonId: d.salesPersonId,
          items: {
            create: await Promise.all(
              d.items.map(async (i: any) => {
                const p = await tx.product.findUnique({ where: { id: i.productId } });
                if (!p || !p.active) throw new AppError(404, 'Active product not found');
                return {
                  productId: i.productId,
                  orderedQty: i.orderedQty,
                  salesPrice: i.salesPrice ?? p.salesPrice,
                };
              }),
            ),
          },
        },
        include: { items: true },
      });
      await audit(
        tx,
        actor,
        'SALES',
        'SalesOrder',
        so.id,
        'CREATE',
        'reference',
        null,
        so.reference,
      );
      return so;
    });
  }

  async updateSales(actor: string, id: string, data: any) {
    return prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.findUnique({ where: { id }, include: { items: true } });
      if (!so) throw new AppError(404, 'Sales order not found');
      const lockedFields = locked(data, ['customerId', 'items', 'quantity']);
      if (so.status !== SalesStatus.DRAFT && lockedFields.length)
        throw new AppError(
          409,
          `Sales order fields locked after confirmation: ${lockedFields.join(', ')}`,
        );
      const updateData: any = { ...data };
      delete updateData.items;
      delete updateData.quantity;
      const updated = await tx.salesOrder.update({ where: { id }, data: updateData });
      for (const [field, value] of Object.entries(updateData))
        await audit(
          tx,
          actor,
          'SALES',
          'SalesOrder',
          id,
          'UPDATE',
          field,
          (so as any)[field],
          value,
        );
      return updated;
    });
  }

  async confirmSales(actor: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM sales_orders WHERE id = ${id} FOR UPDATE`;
      const so = await tx.salesOrder.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
      });
      if (!so) throw new AppError(404, 'Sales order not found');
      if (so.status !== SalesStatus.DRAFT)
        throw new AppError(409, 'Only draft sales orders can be confirmed');
      let short = false;
      for (const item of so.items) {
        await inventoryService.lockProduct(tx, item.productId);
        const existing = await tx.inventoryReservation.findFirst({
          where: { productId: item.productId, salesOrderId: id },
        });
        if (existing) throw new AppError(409, 'Duplicate sales reservation detected');
        const b = await inventoryService.balances(tx, item.productId);
        const ordered = Number(item.orderedQty);
        const reserveQty = Math.min(ordered, Math.max(0, b.available));
        const shortage = ordered - reserveQty;
        short ||= shortage > 0;
        if (reserveQty > 0) {
          await tx.inventoryReservation.create({
            data: { productId: item.productId, salesOrderId: id, quantity: reserveQty },
          });
          await audit(
            tx,
            actor,
            'INVENTORY',
            'InventoryReservation',
            id,
            'CREATE',
            'quantity',
            null,
            reserveQty,
          );
        }
        if (shortage > 0) await this.createProcurement(tx, actor, item.product, shortage, id);
      }
      const updated = await tx.salesOrder.update({
        where: { id },
        data: { status: SalesStatus.CONFIRMED, availabilityFlag: short },
      });
      await audit(
        tx,
        actor,
        'SALES',
        'SalesOrder',
        id,
        'CONFIRM',
        'status',
        so.status,
        updated.status,
      );
      return updated;
    });
  }

  private async createProcurement(
    tx: Prisma.TransactionClient,
    actor: string,
    product: any,
    shortage: number,
    salesOrderId: string,
  ) {
    if (!product.procureOnDemand)
      throw new AppError(422, `Product ${product.name} has shortage but procurement is disabled`);
    const duplicatePo = await tx.purchaseOrderItem.findFirst({
      where: {
        productId: product.id,
        purchaseOrder: {
          triggerSourceSoId: salesOrderId,
          status: { not: PurchaseStatus.CANCELLED },
        },
      },
    });
    const duplicateMo = await tx.manufacturingOrder.findFirst({
      where: {
        finishedProductId: product.id,
        triggerSourceSoId: salesOrderId,
        status: { not: ManufacturingStatus.CANCELLED },
      },
    });
    if (duplicatePo || duplicateMo)
      throw new AppError(409, 'Procurement already generated for this shortage');
    if (product.procurementType === 'PURCHASE') {
      if (!product.defaultVendorId)
        throw new AppError(422, 'Product is missing default vendor for purchase procurement');
      const po = await tx.purchaseOrder.create({
        data: {
          reference: ref('PO'),
          vendorId: product.defaultVendorId,
          status: PurchaseStatus.DRAFT,
          autoCreated: true,
          triggerSourceSoId: salesOrderId,
          items: {
            create: { productId: product.id, orderedQty: shortage, costPrice: product.costPrice },
          },
        },
      });
      await audit(
        tx,
        actor,
        'PROCUREMENT',
        'PurchaseOrder',
        po.id,
        'CREATE',
        'triggerSourceSoId',
        null,
        salesOrderId,
      );
      return;
    }
    if (product.procurementType === 'MANUFACTURING') {
      if (!product.defaultBomId)
        throw new AppError(422, 'Product is missing default BoM for manufacturing procurement');
      const bom = await tx.bom.findUnique({
        where: { id: product.defaultBomId },
        include: { items: true, operations: true },
      });
      if (!bom) throw new AppError(422, 'Configured BoM not found');
      const mo = await tx.manufacturingOrder.create({
        data: {
          reference: ref('MO'),
          finishedProductId: product.id,
          bomId: bom.id,
          quantity: shortage,
          autoCreated: true,
          triggerSourceSoId: salesOrderId,
          items: {
            create: bom.items.map((x) => ({
              productId: x.productId,
              requiredQty: (Number(x.quantity) * shortage) / Number(bom.referenceQty),
            })),
          },
          workOrders: {
            create: bom.operations.map((x) => ({
              name: x.name,
              workCenter: x.workCenter,
              expectedMinutes: (Number(x.expectedMinutes) * shortage) / Number(bom.referenceQty),
            })),
          },
        },
      });
      await audit(
        tx,
        actor,
        'PROCUREMENT',
        'ManufacturingOrder',
        mo.id,
        'CREATE',
        'triggerSourceSoId',
        null,
        salesOrderId,
      );
      return;
    }
    throw new AppError(422, 'Product is missing procurement type');
  }

  async deliverSales(actor: string, id: string, lines: any[]) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM sales_orders WHERE id = ${id} FOR UPDATE`;
      const so = await tx.salesOrder.findUnique({ where: { id }, include: { items: true } });
      if (!so) throw new AppError(404, 'Sales order not found');
      if (so.status !== SalesStatus.CONFIRMED && so.status !== SalesStatus.PARTIALLY_DELIVERED)
        throw new AppError(409, 'Order is not deliverable');
      for (const line of lines) {
        const item = so.items.find((x) => x.id === line.itemId);
        if (!item) throw new AppError(422, 'Invalid sales item');
        const newQty = Number(line.deliveredQty);
        const delta = newQty - Number(item.deliveredQty);
        if (delta < 0 || newQty > Number(item.orderedQty))
          throw new AppError(422, 'Delivered quantity is invalid');
        if (delta) {
          await inventoryService.issueReservedStock(
            tx,
            actor,
            item.productId,
            delta,
            { salesOrderId: id },
            StockSource.SALES_DELIVERY,
            'SalesOrder',
            id,
          );
          await tx.salesOrderItem.update({
            where: { id: item.id },
            data: { deliveredQty: newQty },
          });
          await audit(
            tx,
            actor,
            'SALES',
            'SalesOrderItem',
            item.id,
            'DELIVER',
            'deliveredQty',
            item.deliveredQty,
            newQty,
          );
        }
      }
      const fresh = await tx.salesOrder.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });
      const full = fresh.items.every((x) => Number(x.deliveredQty) === Number(x.orderedQty));
      const status = full ? SalesStatus.FULLY_DELIVERED : SalesStatus.PARTIALLY_DELIVERED;
      const result = await tx.salesOrder.update({ where: { id }, data: { status } });
      if (full) await inventoryService.releaseStock(tx, { salesOrderId: id });
      await audit(
        tx,
        actor,
        'SALES',
        'SalesOrder',
        id,
        'DELIVER',
        'status',
        so.status,
        result.status,
      );
      return result;
    });
  }

  async cancelSales(actor: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM sales_orders WHERE id = ${id} FOR UPDATE`;
      const so = await tx.salesOrder.findUnique({ where: { id } });
      if (!so) throw new AppError(404, 'Sales order not found');
      if (so.status !== SalesStatus.DRAFT && so.status !== SalesStatus.CONFIRMED)
        throw new AppError(409, 'Sales order cannot be cancelled after delivery has started');
      await inventoryService.releaseStock(tx, { salesOrderId: id });
      const result = await tx.salesOrder.update({
        where: { id },
        data: { status: SalesStatus.CANCELLED },
      });
      await audit(
        tx,
        actor,
        'SALES',
        'SalesOrder',
        id,
        'CANCEL',
        'status',
        so.status,
        result.status,
      );
      return result;
    });
  }

  async createPurchase(actor: string, d: any) {
    return prisma.$transaction(async (tx) => {
      if (!d.items?.length) throw new AppError(422, 'Purchase order requires at least one item');
      requireUniqueProducts(d.items, 'Purchase order');
      const vendor = await tx.vendor.findUnique({ where: { id: d.vendorId } });
      if (!vendor) throw new AppError(404, 'Vendor not found');
      const po = await tx.purchaseOrder.create({
        data: {
          reference: ref('PO'),
          vendorId: d.vendorId,
          vendorAddress: d.vendorAddress,
          items: {
            create: await Promise.all(
              d.items.map(async (i: any) => {
                const p = await tx.product.findUnique({ where: { id: i.productId } });
                if (!p || !p.active) throw new AppError(404, 'Active product not found');
                return {
                  productId: i.productId,
                  orderedQty: i.orderedQty,
                  costPrice: i.costPrice ?? p.costPrice,
                };
              }),
            ),
          },
        },
        include: { items: true },
      });
      await audit(
        tx,
        actor,
        'PURCHASE',
        'PurchaseOrder',
        po.id,
        'CREATE',
        'reference',
        null,
        po.reference,
      );
      return po;
    });
  }

  async updatePurchase(actor: string, id: string, data: any) {
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({ where: { id } });
      if (!po) throw new AppError(404, 'Purchase order not found');
      const lockedFields = locked(data, ['vendorId', 'items', 'quantity']);
      if (po.status !== PurchaseStatus.DRAFT && lockedFields.length)
        throw new AppError(
          409,
          `Purchase order fields locked after confirmation: ${lockedFields.join(', ')}`,
        );
      const updateData: any = { ...data };
      delete updateData.items;
      delete updateData.quantity;
      const updated = await tx.purchaseOrder.update({ where: { id }, data: updateData });
      for (const [field, value] of Object.entries(updateData))
        await audit(
          tx,
          actor,
          'PURCHASE',
          'PurchaseOrder',
          id,
          'UPDATE',
          field,
          (po as any)[field],
          value,
        );
      return updated;
    });
  }

  async confirmPurchase(actor: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM purchase_orders WHERE id = ${id} FOR UPDATE`;
      const po = await tx.purchaseOrder.findUnique({ where: { id } });
      if (!po) throw new AppError(404, 'Purchase order not found');
      if (po.status !== PurchaseStatus.DRAFT)
        throw new AppError(409, 'Only draft purchase orders can be confirmed');
      const result = await tx.purchaseOrder.update({
        where: { id },
        data: { status: PurchaseStatus.CONFIRMED },
      });
      await audit(
        tx,
        actor,
        'PURCHASE',
        'PurchaseOrder',
        id,
        'CONFIRM',
        'status',
        po.status,
        result.status,
      );
      return result;
    });
  }

  async receivePurchase(actor: string, id: string, lines: any[]) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM purchase_orders WHERE id = ${id} FOR UPDATE`;
      const po = await tx.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
      if (!po) throw new AppError(404, 'Purchase order not found');
      if (po.status !== PurchaseStatus.CONFIRMED && po.status !== PurchaseStatus.PARTIALLY_RECEIVED)
        throw new AppError(409, 'Order is not receivable');
      for (const line of lines) {
        const item = po.items.find((x) => x.id === line.itemId);
        if (!item) throw new AppError(422, 'Invalid purchase item');
        const qty = Number(line.receivedQty),
          delta = qty - Number(item.receivedQty);
        if (delta < 0 || qty > Number(item.orderedQty))
          throw new AppError(422, 'Received quantity is invalid');
        if (delta) {
          await inventoryService.receiveStock(
            tx,
            actor,
            item.productId,
            delta,
            'PurchaseOrder',
            id,
          );
          await tx.purchaseOrderItem.update({ where: { id: item.id }, data: { receivedQty: qty } });
          await audit(
            tx,
            actor,
            'PURCHASE',
            'PurchaseOrderItem',
            item.id,
            'RECEIVE',
            'receivedQty',
            item.receivedQty,
            qty,
          );
        }
      }
      const fresh = await tx.purchaseOrder.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });
      const full = fresh.items.every((x) => Number(x.receivedQty) === Number(x.orderedQty));
      const result = await tx.purchaseOrder.update({
        where: { id },
        data: { status: full ? PurchaseStatus.FULLY_RECEIVED : PurchaseStatus.PARTIALLY_RECEIVED },
      });
      await audit(
        tx,
        actor,
        'PURCHASE',
        'PurchaseOrder',
        id,
        'RECEIVE',
        'status',
        po.status,
        result.status,
      );
      return result;
    });
  }

  async cancelPurchase(actor: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM purchase_orders WHERE id = ${id} FOR UPDATE`;
      const po = await tx.purchaseOrder.findUnique({ where: { id } });
      if (!po) throw new AppError(404, 'Purchase order not found');
      if (po.status !== PurchaseStatus.DRAFT && po.status !== PurchaseStatus.CONFIRMED)
        throw new AppError(409, 'Purchase order cannot be cancelled after receiving has started');
      const result = await tx.purchaseOrder.update({
        where: { id },
        data: { status: PurchaseStatus.CANCELLED },
      });
      await audit(
        tx,
        actor,
        'PURCHASE',
        'PurchaseOrder',
        id,
        'CANCEL',
        'status',
        po.status,
        result.status,
      );
      return result;
    });
  }

  async createMo(actor: string, d: any) {
    return prisma.$transaction(async (tx) => {
      const bom = await tx.bom.findUnique({
        where: { id: d.bomId },
        include: { items: true, operations: true },
      });
      if (!bom || !bom.active || bom.finishedProductId !== d.finishedProductId)
        throw new AppError(422, 'Active BoM does not match finished product');
      if (!bom.items.length) throw new AppError(422, 'Manufacturing order requires BoM components');
      const qty = Number(d.quantity);
      if (qty <= 0) throw new AppError(422, 'Manufacturing quantity must be greater than zero');
      const mo = await tx.manufacturingOrder.create({
        data: {
          reference: ref('MO'),
          finishedProductId: d.finishedProductId,
          bomId: bom.id,
          quantity: qty,
          items: {
            create: bom.items.map((x) => ({
              productId: x.productId,
              requiredQty: (Number(x.quantity) * qty) / Number(bom.referenceQty),
            })),
          },
          workOrders: {
            create: bom.operations.map((x) => ({
              name: x.name,
              workCenter: x.workCenter,
              expectedMinutes: (Number(x.expectedMinutes) * qty) / Number(bom.referenceQty),
            })),
          },
        },
        include: { items: true, workOrders: true },
      });
      await audit(
        tx,
        actor,
        'MANUFACTURING',
        'ManufacturingOrder',
        mo.id,
        'CREATE',
        'reference',
        null,
        mo.reference,
      );
      return mo;
    });
  }

  async updateMo(actor: string, id: string, data: any) {
    return prisma.$transaction(async (tx) => {
      const mo = await tx.manufacturingOrder.findUnique({ where: { id } });
      if (!mo) throw new AppError(404, 'Manufacturing order not found');
      const lockedFields = locked(data, ['bomId', 'items', 'components']);
      if (mo.status !== ManufacturingStatus.DRAFT && lockedFields.length)
        throw new AppError(
          409,
          `Manufacturing order fields locked after confirmation: ${lockedFields.join(', ')}`,
        );
      const updateData: any = { ...data };
      delete updateData.items;
      delete updateData.components;
      const updated = await tx.manufacturingOrder.update({ where: { id }, data: updateData });
      for (const [field, value] of Object.entries(updateData))
        await audit(
          tx,
          actor,
          'MANUFACTURING',
          'ManufacturingOrder',
          id,
          'UPDATE',
          field,
          (mo as any)[field],
          value,
        );
      return updated;
    });
  }

  async confirmMo(actor: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM manufacturing_orders WHERE id = ${id} FOR UPDATE`;
      const mo = await tx.manufacturingOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!mo) throw new AppError(404, 'Manufacturing order not found');
      if (mo.status !== ManufacturingStatus.DRAFT)
        throw new AppError(409, 'Only draft manufacturing orders can be confirmed');
      for (const item of mo.items) {
        await inventoryService.lockProduct(tx, item.productId);
        const existing = await tx.inventoryReservation.findFirst({
          where: { productId: item.productId, manufacturingOrderId: id },
        });
        if (existing) throw new AppError(409, 'Duplicate manufacturing reservation detected');
        const b = await inventoryService.balances(tx, item.productId);
        const reserveQty = Math.min(Number(item.requiredQty), Math.max(0, b.available));
        if (reserveQty > 0) {
          await tx.inventoryReservation.create({
            data: { productId: item.productId, manufacturingOrderId: id, quantity: reserveQty },
          });
          await audit(
            tx,
            actor,
            'INVENTORY',
            'InventoryReservation',
            id,
            'CREATE',
            'quantity',
            null,
            reserveQty,
          );
        }
      }
      const result = await tx.manufacturingOrder.update({
        where: { id },
        data: { status: ManufacturingStatus.CONFIRMED },
      });
      await audit(
        tx,
        actor,
        'MANUFACTURING',
        'ManufacturingOrder',
        id,
        'CONFIRM',
        'status',
        mo.status,
        result.status,
      );
      return result;
    });
  }

  async startMo(actor: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM manufacturing_orders WHERE id = ${id} FOR UPDATE`;
      const mo = await tx.manufacturingOrder.findUnique({ where: { id } });
      if (!mo) throw new AppError(404, 'Manufacturing order not found');
      if (mo.status !== ManufacturingStatus.CONFIRMED)
        throw new AppError(409, 'Only confirmed manufacturing orders can start');
      const result = await tx.manufacturingOrder.update({
        where: { id },
        data: { status: ManufacturingStatus.IN_PROGRESS },
      });
      await audit(
        tx,
        actor,
        'MANUFACTURING',
        'ManufacturingOrder',
        id,
        'START',
        'status',
        mo.status,
        result.status,
      );
      return result;
    });
  }

  async completeMo(actor: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM manufacturing_orders WHERE id = ${id} FOR UPDATE`;
      const mo = await tx.manufacturingOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!mo) throw new AppError(404, 'Manufacturing order not found');
      if (mo.status !== ManufacturingStatus.IN_PROGRESS)
        throw new AppError(409, 'Only in-progress orders can be completed');
      for (const item of mo.items) {
        if (Number(item.consumedQty) > Number(item.requiredQty))
          throw new AppError(422, 'Consumed quantity cannot exceed required quantity');
        const qty = Number(item.consumedQty) || Number(item.requiredQty);
        await inventoryService.issueReservedStock(
          tx,
          actor,
          item.productId,
          qty,
          { manufacturingOrderId: id },
          StockSource.MO_CONSUMPTION,
          'ManufacturingOrder',
          id,
        );
        await tx.manufacturingOrderItem.update({
          where: { id: item.id },
          data: { consumedQty: qty },
        });
        await audit(
          tx,
          actor,
          'MANUFACTURING',
          'ManufacturingOrderItem',
          item.id,
          'COMPLETE',
          'consumedQty',
          item.consumedQty,
          qty,
        );
      }
      await inventoryService.produceStock(
        tx,
        actor,
        mo.finishedProductId,
        Number(mo.quantity),
        'ManufacturingOrder',
        id,
      );
      await inventoryService.releaseStock(tx, { manufacturingOrderId: id });
      const result = await tx.manufacturingOrder.update({
        where: { id },
        data: { status: ManufacturingStatus.COMPLETED },
      });
      await audit(
        tx,
        actor,
        'MANUFACTURING',
        'ManufacturingOrder',
        id,
        'COMPLETE',
        'status',
        mo.status,
        result.status,
      );
      return result;
    });
  }

  async cancelMo(actor: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM manufacturing_orders WHERE id = ${id} FOR UPDATE`;
      const mo = await tx.manufacturingOrder.findUnique({ where: { id } });
      if (!mo) throw new AppError(404, 'Manufacturing order not found');
      if (mo.status !== ManufacturingStatus.DRAFT && mo.status !== ManufacturingStatus.CONFIRMED)
        throw new AppError(
          409,
          'Manufacturing order cannot be cancelled after production has started',
        );
      await inventoryService.releaseStock(tx, { manufacturingOrderId: id });
      const result = await tx.manufacturingOrder.update({
        where: { id },
        data: { status: ManufacturingStatus.CANCELLED },
      });
      await audit(
        tx,
        actor,
        'MANUFACTURING',
        'ManufacturingOrder',
        id,
        'CANCEL',
        'status',
        mo.status,
        result.status,
      );
      return result;
    });
  }
}

export const ordersService = new OrdersService();
