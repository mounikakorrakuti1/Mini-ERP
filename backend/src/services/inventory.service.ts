import { Prisma, StockDirection, StockSource } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import { notificationService } from './notification.service.js';
export class InventoryService {
  async lockProduct(tx: Prisma.TransactionClient, productId: string) {
    await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`;
  }
  async balances(tx: Prisma.TransactionClient, productId: string) {
    const p = await tx.product.findUnique({ where: { id: productId } });
    if (!p) throw new AppError(404, 'Product not found');
    const r = await tx.inventoryReservation.aggregate({
      where: { productId, active: true },
      _sum: { quantity: true },
    });
    const reserved = Number(r._sum.quantity || 0);
    return { onHand: Number(p.onHandQty), reserved, available: Number(p.onHandQty) - reserved };
  }
  async calculateAvailableStock(tx: Prisma.TransactionClient, productId: string) {
    return this.balances(tx, productId);
  }
  async reserveStock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
    link: { salesOrderId?: string; manufacturingOrderId?: string },
  ) {
    if (quantity <= 0) throw new AppError(422, 'Reservation quantity must be greater than zero');
    await this.lockProduct(tx, productId);
    const existing = await tx.inventoryReservation.findFirst({
      where: {
        productId,
        active: true,
        salesOrderId: link.salesOrderId,
        manufacturingOrderId: link.manufacturingOrderId,
      },
    });
    if (existing) throw new AppError(409, 'Duplicate reservation detected');
    return tx.inventoryReservation.create({
      data: {
        productId,
        quantity,
        salesOrderId: link.salesOrderId,
        manufacturingOrderId: link.manufacturingOrderId,
      },
    });
  }
  async releaseStock(
    tx: Prisma.TransactionClient,
    where: { salesOrderId?: string; manufacturingOrderId?: string; productId?: string },
  ) {
    return tx.inventoryReservation.updateMany({
      where: { ...where, active: true },
      data: { active: false, releasedAt: new Date() },
    });
  }
  async replaceReservation(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
    link: { salesOrderId?: string; manufacturingOrderId?: string },
  ) {
    await this.lockProduct(tx, productId);
    await this.releaseStock(tx, { productId, ...link });
    if (quantity <= 0) return null;
    return tx.inventoryReservation.create({
      data: { productId, quantity, ...link },
    });
  }
  async issueReservedStock(
    tx: Prisma.TransactionClient,
    actorId: string | undefined,
    productId: string,
    quantity: number,
    link: { salesOrderId?: string; manufacturingOrderId?: string },
    source: StockSource,
    referenceType: string,
    referenceId: string,
  ) {
    if (quantity <= 0) throw new AppError(422, 'Issue quantity must be greater than zero');
    await this.lockProduct(tx, productId);
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError(404, 'Product not found');
    const reservations = await tx.inventoryReservation.findMany({
      where: { productId, active: true },
    });
    const own = reservations.filter(
      (r) =>
        (link.salesOrderId && r.salesOrderId === link.salesOrderId) ||
        (link.manufacturingOrderId && r.manufacturingOrderId === link.manufacturingOrderId),
    );
    const ownQty = own.reduce((sum, r) => sum + Number(r.quantity), 0);
    if (Number(product.onHandQty) < quantity)
      throw new AppError(422, 'Insufficient on-hand stock for issue');
    await this.move(
      tx,
      actorId,
      productId,
      StockDirection.OUT,
      quantity,
      source,
      referenceType,
      referenceId,
    );
    let remaining = Math.min(quantity, ownQty);
    for (const reservation of own) {
      if (remaining <= 0) break;
      const current = Number(reservation.quantity);
      if (current <= remaining) {
        await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: { active: false, releasedAt: new Date() },
        });
        remaining -= current;
      } else {
        await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: { quantity: current - remaining },
        });
        remaining = 0;
      }
    }
  }
  async consumeStock(
    tx: Prisma.TransactionClient,
    actorId: string | undefined,
    productId: string,
    quantity: number,
    referenceType: string,
    referenceId: string,
  ) {
    return this.move(
      tx,
      actorId,
      productId,
      StockDirection.OUT,
      quantity,
      StockSource.MO_CONSUMPTION,
      referenceType,
      referenceId,
    );
  }
  async receiveStock(
    tx: Prisma.TransactionClient,
    actorId: string | undefined,
    productId: string,
    quantity: number,
    referenceType: string,
    referenceId: string,
  ) {
    return this.move(
      tx,
      actorId,
      productId,
      StockDirection.IN,
      quantity,
      StockSource.PURCHASE_RECEIPT,
      referenceType,
      referenceId,
    );
  }
  async produceStock(
    tx: Prisma.TransactionClient,
    actorId: string | undefined,
    productId: string,
    quantity: number,
    referenceType: string,
    referenceId: string,
  ) {
    return this.move(
      tx,
      actorId,
      productId,
      StockDirection.IN,
      quantity,
      StockSource.MO_PRODUCTION,
      referenceType,
      referenceId,
    );
  }
  async move(
    tx: Prisma.TransactionClient,
    actorId: string | undefined,
    productId: string,
    direction: StockDirection,
    quantity: number,
    source: StockSource,
    referenceType: string,
    referenceId: string,
  ) {
    if (quantity <= 0) throw new AppError(422, 'Quantity must be greater than zero');
    await this.lockProduct(tx, productId);
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError(404, 'Product not found');
    if (direction === 'OUT' && Number(product.onHandQty) < quantity)
      throw new AppError(422, 'Insufficient on-hand stock');
    const signed = direction === 'IN' ? quantity : -quantity;
    await tx.stockMovement.create({
      data: {
        productId,
        direction,
        quantity,
        signedQty: signed,
        source,
        referenceType,
        referenceId,
        actorId,
      },
    });
    const updated = await tx.product.update({
      where: { id: productId },
      data: { onHandQty: { increment: signed } },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        module: 'INVENTORY',
        recordType: 'Product',
        recordId: productId,
        action: 'INVENTORY_CHANGE',
        fieldName: 'onHandQty',
        oldValue: String(product.onHandQty),
        newValue: String(updated.onHandQty),
      },
    });
    await notificationService.checkLowStock(tx, productId);
  }

  async lockProducts(tx: Prisma.TransactionClient, productIds: string[]) {
    for (const productId of [...new Set(productIds)].sort()) {
      await this.lockProduct(tx, productId);
    }
  }
}
export const inventoryService = new InventoryService();
