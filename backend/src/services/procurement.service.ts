import type { Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { inventoryService } from './inventory.service.js';

type Db = PrismaClient | Prisma.TransactionClient;

export class ProcurementService {
  async recommend(productId: string, quantity: number, db: Db = prisma) {
    if (quantity <= 0) throw new AppError(422, 'Recommendation quantity must be greater than zero');
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        vendor: true,
        boms: {
          where: { active: true },
          include: { items: { include: { product: true } }, operations: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
    if (!product || !product.active) throw new AppError(404, 'Active product not found');

    const bom = product.boms[0];
    const purchase = product.vendor
      ? {
          route: 'PURCHASE' as const,
          available: true,
          cost: Number(product.costPrice) * quantity,
          leadTimeDays: product.vendor.leadTimeDays,
          vendor: { id: product.vendor.id, name: product.vendor.name },
        }
      : null;

    let manufacture: null | {
      route: 'MANUFACTURING'; available: true; cost: number; leadTimeDays: number;
      materialShortagePenalty: number; shortComponents: number; totalComponents: number;
      bom: { id: string; reference: string };
    } = null;
    if (bom) {
      const scale = quantity / Number(bom.referenceQty);
      const componentRequirements = bom.items.map((item) => ({
        item,
        required: Number(item.quantity) * scale,
      }));
      const balances = await Promise.all(
        componentRequirements.map(({ item }) =>
          inventoryService.balances(db as Prisma.TransactionClient, item.productId),
        ),
      );
      const shortComponents = componentRequirements.filter(
        ({ required }, index) => balances[index].available < required,
      ).length;
      manufacture = {
        route: 'MANUFACTURING',
        available: true,
        cost: componentRequirements.reduce(
          (sum, { item, required }) => sum + Number(item.product.costPrice) * required,
          0,
        ),
        leadTimeDays:
          bom.operations.reduce(
            (sum, operation) => sum + Number(operation.expectedMinutes) * scale,
            0,
          ) / 480,
        materialShortagePenalty: componentRequirements.length
          ? shortComponents / componentRequirements.length
          : 0,
        shortComponents,
        totalComponents: componentRequirements.length,
        bom: { id: bom.id, reference: bom.reference },
      };
    }

    if (!purchase && !manufacture)
      throw new AppError(422, 'Neither purchase nor manufacturing is configured for this product');
    const candidates = [purchase, manufacture].filter(Boolean) as NonNullable<typeof purchase | typeof manufacture>[];
    const maxCost = Math.max(...candidates.map((candidate) => candidate.cost), 1);
    const maxLead = Math.max(...candidates.map((candidate) => candidate.leadTimeDays), 1);
    const scored = candidates.map((candidate) => {
      const normalizedCost = candidate.cost / maxCost;
      const normalizedLeadTime = candidate.leadTimeDays / maxLead;
      const shortagePenalty = candidate.route === 'MANUFACTURING' ? candidate.materialShortagePenalty : 0;
      return {
        ...candidate,
        normalizedCost,
        normalizedLeadTime,
        score: 0.5 * normalizedCost + 0.3 * normalizedLeadTime + 0.2 * shortagePenalty,
        formula: candidate.route === 'MANUFACTURING'
          ? '0.5 * normalized cost + 0.3 * normalized lead time + 0.2 * material shortage penalty'
          : '0.5 * normalized cost + 0.3 * normalized lead time',
      };
    }).sort((a, b) => a.score - b.score);

    return {
      product: { id: product.id, reference: product.reference, name: product.name },
      quantity,
      recommendation: scored[0].route,
      explanation: `${scored[0].route} has the lower deterministic weighted score.`,
      candidates: scored,
      weights: { cost: 0.5, leadTime: 0.3, materialShortage: 0.2 },
    };
  }
}

export const procurementService = new ProcurementService();
