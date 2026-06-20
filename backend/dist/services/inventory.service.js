'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.inventoryService = exports.InventoryService = void 0;
const client_1 = require('@prisma/client');
const errors_js_1 = require('../lib/errors.js');
class InventoryService {
  async lockProduct(tx, productId) {
    await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`;
  }
  async balances(tx, productId) {
    const p = await tx.product.findUnique({ where: { id: productId } });
    if (!p) throw new errors_js_1.AppError(404, 'Product not found');
    const r = await tx.inventoryReservation.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });
    const reserved = Number(r._sum.quantity || 0);
    return { onHand: Number(p.onHandQty), reserved, available: Number(p.onHandQty) - reserved };
  }
  async calculateAvailableStock(tx, productId) {
    return this.balances(tx, productId);
  }
  async reserveStock(tx, productId, quantity, link) {
    if (quantity <= 0)
      throw new errors_js_1.AppError(422, 'Reservation quantity must be greater than zero');
    await this.lockProduct(tx, productId);
    const existing = await tx.inventoryReservation.findFirst({
      where: {
        productId,
        salesOrderId: link.salesOrderId,
        manufacturingOrderId: link.manufacturingOrderId,
      },
    });
    if (existing) throw new errors_js_1.AppError(409, 'Duplicate reservation detected');
    const b = await this.balances(tx, productId);
    if (b.available < quantity) throw new errors_js_1.AppError(422, 'Insufficient available stock');
    return tx.inventoryReservation.create({
      data: {
        productId,
        quantity,
        salesOrderId: link.salesOrderId,
        manufacturingOrderId: link.manufacturingOrderId,
      },
    });
  }
  async releaseStock(tx, where) {
    return tx.inventoryReservation.deleteMany({ where });
  }
  async issueReservedStock(
    tx,
    actorId,
    productId,
    quantity,
    link,
    source,
    referenceType,
    referenceId,
  ) {
    if (quantity <= 0)
      throw new errors_js_1.AppError(422, 'Issue quantity must be greater than zero');
    await this.lockProduct(tx, productId);
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new errors_js_1.AppError(404, 'Product not found');
    const reservations = await tx.inventoryReservation.findMany({ where: { productId } });
    const own = reservations.filter(
      (r) =>
        (link.salesOrderId && r.salesOrderId === link.salesOrderId) ||
        (link.manufacturingOrderId && r.manufacturingOrderId === link.manufacturingOrderId),
    );
    const ownQty = own.reduce((sum, r) => sum + Number(r.quantity), 0);
    const otherQty = reservations.reduce((sum, r) => sum + Number(r.quantity), 0) - ownQty;
    if (Number(product.onHandQty) - otherQty < quantity)
      throw new errors_js_1.AppError(422, 'Insufficient unreserved stock for issue');
    await this.move(
      tx,
      actorId,
      productId,
      client_1.StockDirection.OUT,
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
        await tx.inventoryReservation.delete({ where: { id: reservation.id } });
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
  async consumeStock(tx, actorId, productId, quantity, referenceType, referenceId) {
    return this.move(
      tx,
      actorId,
      productId,
      client_1.StockDirection.OUT,
      quantity,
      client_1.StockSource.MO_CONSUMPTION,
      referenceType,
      referenceId,
    );
  }
  async receiveStock(tx, actorId, productId, quantity, referenceType, referenceId) {
    return this.move(
      tx,
      actorId,
      productId,
      client_1.StockDirection.IN,
      quantity,
      client_1.StockSource.PURCHASE_RECEIPT,
      referenceType,
      referenceId,
    );
  }
  async produceStock(tx, actorId, productId, quantity, referenceType, referenceId) {
    return this.move(
      tx,
      actorId,
      productId,
      client_1.StockDirection.IN,
      quantity,
      client_1.StockSource.MO_PRODUCTION,
      referenceType,
      referenceId,
    );
  }
  async move(tx, actorId, productId, direction, quantity, source, referenceType, referenceId) {
    if (quantity <= 0) throw new errors_js_1.AppError(422, 'Quantity must be greater than zero');
    await this.lockProduct(tx, productId);
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new errors_js_1.AppError(404, 'Product not found');
    if (direction === 'OUT' && Number(product.onHandQty) < quantity)
      throw new errors_js_1.AppError(422, 'Insufficient on-hand stock');
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
  }
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
