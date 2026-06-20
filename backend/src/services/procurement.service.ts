import { PrismaClient, Prisma, ProcurementAlertType, ProcurementType } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { inventoryService } from './inventory.service.js';
import * as fs from 'fs';
import * as path from 'path';
import * as brain from 'brain.js';

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

  async calculateAllDailyDemands(days = 30, db: Db = prisma): Promise<Record<string, number>> {
    const demandMap: Record<string, number> = {};
    const modelPath = path.resolve(process.cwd(), 'demand-model.json');
    let mlModel: any = null;
    let maxDemand = 1;

    try {
      if (fs.existsSync(modelPath)) {
        const fileData = fs.readFileSync(modelPath, 'utf8');
        const parsed = JSON.parse(fileData);
        maxDemand = parsed.metadata?.maxDemand || 1;
        const net = new brain.NeuralNetwork();
        net.fromJSON(parsed.network);
        mlModel = net;
      }
    } catch (e) {
      console.error('Failed to load ML model, falling back to heuristic', e);
    }

    if (mlModel) {
      const windowDate = new Date();
      windowDate.setDate(windowDate.getDate() - 5);
      const rawMovements = await db.stockMovement.findMany({
         where: { direction: 'OUT', createdAt: { gte: windowDate } },
         select: { productId: true, quantity: true, createdAt: true }
      });

      const prodMap: Record<string, Record<string, number>> = {};
      for (const m of rawMovements) {
         const dStr = m.createdAt.toISOString().split('T')[0];
         if (!prodMap[m.productId]) prodMap[m.productId] = {};
         if (!prodMap[m.productId][dStr]) prodMap[m.productId][dStr] = 0;
         prodMap[m.productId][dStr] += Number(m.quantity);
      }

      const dateStrs = [];
      for(let i=5; i>=1; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dateStrs.push(d.toISOString().split('T')[0]);
      }

      for (const pid in prodMap) {
         const inputSeq = dateStrs.map(ds => (prodMap[pid][ds] || 0) / maxDemand);
         const output = mlModel.run(inputSeq) as number[];
         demandMap[pid] = (output[0] || 0.01) * maxDemand;
      }
    }

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);

    const movements = await db.stockMovement.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        direction: 'OUT',
        createdAt: { gte: pastDate }
      }
    });

    for (const m of movements) {
      if (!demandMap[m.productId]) {
        demandMap[m.productId] = (Number(m._sum.quantity || 0) / days) || 0.1;
      }
    }
    return demandMap;
  }

  async calculateDailyDemand(productId: string, days = 30, db: Db = prisma): Promise<number> {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);

    const movements = await db.stockMovement.aggregate({
      _sum: { quantity: true },
      where: {
        productId,
        direction: 'OUT',
        createdAt: { gte: pastDate }
      }
    });

    const totalDemand = Number(movements._sum.quantity || 0);
    return (totalDemand / days) || 0.1;
  }

  async generateAlerts(db: Db = prisma) {
    const products = await db.product.findMany({
      where: { active: true },
      include: { vendor: true }
    });

    const demandMap = await this.calculateAllDailyDemands(30, db);
    const updateFns: (() => Promise<any>)[] = [];

    for (const product of products) {
      const dailyDemand = demandMap[product.id] || 0.1;
      const currentStock = Number(product.onHandQty);
      const safetyStock = Number(product.safetyStock || 0);
      const leadTime = product.vendor ? product.vendor.leadTimeDays : 7;

      const optimalROP = Math.ceil((dailyDemand * leadTime) + safetyStock);
      let reorderPoint = Number(product.reorderPoint);

      if (reorderPoint !== optimalROP) {
        updateFns.push(() => db.product.update({ where: { id: product.id }, data: { reorderPoint: optimalROP } }));
        reorderPoint = optimalROP;
      }

      const predictedDaysUntilStockout = currentStock / dailyDemand;

      if (currentStock <= reorderPoint) {
        updateFns.push(() => this.createOrUpdateAlert(product.id, 'LOW_STOCK', `Current stock (${currentStock}) is below the dynamically set reorder point (${reorderPoint}).`, db));
      } else {
        updateFns.push(() => this.resolveAlert(product.id, 'LOW_STOCK', db));
      }

      if (predictedDaysUntilStockout < leadTime && currentStock > 0) {
        updateFns.push(() => this.createOrUpdateAlert(product.id, 'PREDICTED_STOCKOUT', `Stockout predicted in ${Math.round(predictedDaysUntilStockout)} days, which is less than lead time (${leadTime} days).`, db));
      } else {
        updateFns.push(() => this.resolveAlert(product.id, 'PREDICTED_STOCKOUT', db));
      }

      if (dailyDemand > reorderPoint * 2 && reorderPoint > 0) {
        updateFns.push(() => this.createOrUpdateAlert(product.id, 'HIGH_DEMAND', `Unusually high demand detected: ${dailyDemand.toFixed(2)} units/day.`, db));
      } else {
         updateFns.push(() => this.resolveAlert(product.id, 'HIGH_DEMAND', db));
      }
    }
    
    if (updateFns.length > 0) {
      // Chunk updates to prevent neon connection limits
      for (let i = 0; i < updateFns.length; i += 15) {
        await Promise.all(updateFns.slice(i, i + 15).map(fn => fn()));
      }
    }
  }

  private async createOrUpdateAlert(productId: string, type: ProcurementAlertType, message: string, db: Db) {
    const existing = await db.procurementAlert.findFirst({ where: { productId, type, resolved: false } });
    if (!existing) {
      await db.procurementAlert.create({ data: { productId, type, message } });
    } else if (existing.message !== message) {
      await db.procurementAlert.update({ where: { id: existing.id }, data: { message } });
    }
  }

  private async resolveAlert(productId: string, type: ProcurementAlertType, db: Db) {
    await db.procurementAlert.updateMany({ where: { productId, type, resolved: false }, data: { resolved: true, resolvedAt: new Date() } });
  }

  async generateRecommendations(db: Db = prisma) {
    const products = await db.product.findMany({
      where: { active: true },
      include: { vendor: true, boms: { where: { active: true } } }
    });

    const demandMap = await this.calculateAllDailyDemands(30, db);
    const existingRecs = await db.procurementRecommendation.findMany({ where: { status: 'PENDING' } });
    const existingMap = new Map(existingRecs.map(r => [r.productId, r]));

    const createData: any[] = [];
    const updateData: any[] = [];
    const supersedeIds: string[] = [];
    const updateProductFns: (() => Promise<any>)[] = [];

    for (const product of products) {
      const dailyDemand = demandMap[product.id] || 0.1;
      const currentStock = Number(product.onHandQty);
      const safetyStock = Number(product.safetyStock || 0);
      const leadTime = product.vendor ? product.vendor.leadTimeDays : 7;
      
      const optimalROP = Math.ceil((dailyDemand * leadTime) + safetyStock);
      const reorderPoint = optimalROP;

      const expectedDemandDuringLeadTime = dailyDemand * leadTime;
      const recommendedQty = Math.ceil(expectedDemandDuringLeadTime + safetyStock - currentStock);

      const existing = existingMap.get(product.id);

      if (recommendedQty > 0 && currentStock <= reorderPoint) {
        const confidenceScore = Math.min(99, 50 + (dailyDemand * 5));
        let priority = 'LOW';
        if (currentStock <= 0) priority = 'HIGH';
        else if (currentStock <= reorderPoint) priority = 'MEDIUM';

        let explanation = `[AI Prediction] ROP dynamically set to ${optimalROP}. Predicted demand: ${dailyDemand.toFixed(1)}/day. `;
        explanation += `Lead time is ${leadTime} days. Expected demand: ${expectedDemandDuringLeadTime.toFixed(0)}. `;
        explanation += `Safety stock: ${safetyStock}. Current: ${currentStock}. `;
        
        if (product.procurementType === ProcurementType.MANUFACTURING) {
           explanation += 'Action: Manufacture.';
        } else {
           explanation += `Action: Purchase from ${product.vendor?.name || 'Unknown'}.`;
        }

        if (existing) {
          updateData.push({ id: existing.id, recommendedQty, priority, confidenceScore, explanation });
        } else {
          createData.push({ productId: product.id, vendorId: product.vendorId, recommendedQty, priority, confidenceScore, explanation });
        }
      } else {
        if (existing) supersedeIds.push(existing.id);
      }
    }
    
    if (supersedeIds.length > 0) {
      await db.procurementRecommendation.updateMany({ where: { id: { in: supersedeIds } }, data: { status: 'SUPERSEDED' } });
    }
    if (createData.length > 0) {
      await db.procurementRecommendation.createMany({ data: createData });
    }
    if (updateData.length > 0) {
      for (let i = 0; i < updateData.length; i += 15) {
        await Promise.all(updateData.slice(i, i + 15).map(data => 
          db.procurementRecommendation.update({ where: { id: data.id }, data })
        ));
      }
    }
  }

  async getActiveAlerts() {
    return prisma.procurementAlert.findMany({
      where: { resolved: false },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPendingRecommendations() {
    return prisma.procurementRecommendation.findMany({
      where: { status: 'PENDING' },
      include: { product: true, vendor: true },
      orderBy: { confidenceScore: 'desc' }
    });
  }

  async approveRecommendation(id: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const rec = await tx.procurementRecommendation.findUniqueOrThrow({
        where: { id },
        include: { product: true }
      });
      
      if (rec.status !== 'PENDING') throw new AppError(400, 'Only pending recommendations can be approved');

      await tx.procurementRecommendation.update({
        where: { id },
        data: { status: 'APPROVED' }
      });

      if (rec.product.procurementType === ProcurementType.PURCHASE) {
        if (!rec.vendorId) throw new AppError(400, 'Vendor required for purchase');
        const vendor = await tx.vendor.findUnique({ where: { id: rec.vendorId } });
        await tx.purchaseOrder.create({
          data: {
            reference: `PO-AI-${Date.now()}`,
            vendorId: rec.vendorId,
            vendorAddress: vendor?.address,
            responsiblePersonId: actorId,
            autoCreated: true,
            status: 'DRAFT',
            items: {
              create: [{ productId: rec.productId, orderedQty: rec.recommendedQty, costPrice: rec.product.costPrice }]
            }
          }
        });
      } else if (rec.product.procurementType === ProcurementType.MANUFACTURING) {
        if (!rec.product.defaultBomId) throw new AppError(400, 'Default BoM required for manufacturing');
        const bom = await tx.bom.findUnique({ where: { id: rec.product.defaultBomId }, include: { items: true, operations: true } });
        if (!bom) throw new AppError(400, 'Invalid BoM');
        await tx.manufacturingOrder.create({
          data: {
            reference: `MO-AI-${Date.now()}`,
            finishedProductId: rec.productId,
            bomId: bom.id,
            quantity: rec.recommendedQty,
            status: 'DRAFT',
            autoCreated: true,
            items: {
              create: bom.items.map(item => ({
                productId: item.productId,
                requiredQty: Number(item.quantity) * (Number(rec.recommendedQty) / Number(bom.referenceQty)),
                consumedQty: 0
              }))
            },
            workOrders: {
              create: bom.operations.map(op => ({
                name: op.name,
                workCenter: op.workCenter,
                expectedMinutes: Number(op.expectedMinutes) * (Number(rec.recommendedQty) / Number(bom.referenceQty))
              }))
            }
          }
        });
      }

      await tx.auditLog.create({
        data: { actorId, module: 'PROCUREMENT', recordType: 'ProcurementRecommendation', recordId: id, action: 'UPDATE', fieldName: 'status', oldValue: 'PENDING', newValue: 'APPROVED' }
      });

      return { success: true };
    });
  }
}

export const procurementService = new ProcurementService();
