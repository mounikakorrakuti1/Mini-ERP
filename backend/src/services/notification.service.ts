import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { realtimeService } from './realtime.service.js';

type Db = PrismaClient | Prisma.TransactionClient;

class NotificationService {
  async createNotification(
    db: Db,
    data: { userId?: string | null; type: string; message: string },
  ) {
    const notification = await db.notification.create({
      data: {
        userId: data.userId ?? null,
        type: data.type,
        message: data.message,
      },
    });
    this.broadcastNotification(notification);
    return notification;
  }

  broadcastNotification(notification: unknown) {
    realtimeService.broadcastNotification(notification);
  }

  async notifyAdmins(db: Db, type: string, message: string) {
    const adminUsers = await db.user.findMany({
      where: { roles: { some: { role: { name: 'Admin' } } } },
      select: { id: true },
    });
    if (!adminUsers.length) {
      await this.createNotification(db, { type, message });
      return;
    }
    for (const user of adminUsers) {
      await this.createNotification(db, { userId: user.id, type, message });
    }
  }

  async checkLowStock(db: Db, productId: string) {
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) return;
    const reserved = await db.inventoryReservation.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });
    const balance = {
      available: Number(product.onHandQty) - Number(reserved._sum.quantity || 0),
    };
    const threshold = Math.max(Number(product.reorderPoint), Number(product.safetyStock));
    if (balance.available > threshold) return;
    const existing = await db.notification.findFirst({
      where: {
        type: 'LOW_STOCK',
        readAt: null,
        message: { contains: product.reference },
      },
    });
    if (existing) return;
    await this.notifyAdmins(
      db,
      'LOW_STOCK',
      `${product.reference} ${product.name} is low stock. Available ${balance.available}, reorder point ${Number(product.reorderPoint)}, safety stock ${Number(product.safetyStock)}.`,
    );
  }
}

export const notificationService = new NotificationService();
