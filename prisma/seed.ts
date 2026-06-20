import {
  AuditAction,
  ManufacturingStatus,
  PrismaClient,
  PurchaseStatus,
  SalesStatus,
  StockDirection,
  StockSource,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const permissions = [
  'VIEW_PRODUCTS',
  'MANAGE_PRODUCTS',
  'MANAGE_CUSTOMERS',
  'MANAGE_VENDORS',
  'ADJUST_INVENTORY',
  'CREATE_SALES_ORDER',
  'VIEW_SALES_ORDER',
  'CONFIRM_SALES_ORDER',
  'DELIVER_SALES_ORDER',
  'CREATE_PURCHASE_ORDER',
  'VIEW_PURCHASE_ORDER',
  'CONFIRM_PURCHASE_ORDER',
  'RECEIVE_PURCHASE_ORDER',
  'VIEW_BOM',
  'EDIT_BOM',
  'CREATE_MANUFACTURING_ORDER',
  'VIEW_MANUFACTURING_ORDER',
  'CONFIRM_MANUFACTURING_ORDER',
  'START_MANUFACTURING_ORDER',
  'COMPLETE_MANUFACTURING_ORDER',
  'VIEW_INVENTORY',
  'VIEW_AUDIT_LOGS',
];

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.stockMovement.deleteMany();
    await tx.inventoryReservation.deleteMany();
    await tx.workOrder.deleteMany();
    await tx.manufacturingOrderItem.deleteMany();
    await tx.manufacturingOrder.deleteMany();
    await tx.purchaseOrderItem.deleteMany();
    await tx.purchaseOrder.deleteMany();
    await tx.salesOrderItem.deleteMany();
    await tx.salesOrder.deleteMany();
    await tx.bomOperation.deleteMany();
    await tx.bomItem.deleteMany();
    await tx.product.updateMany({ data: { defaultBomId: null } });
    await tx.bom.deleteMany();
    await tx.product.deleteMany();
    await tx.customer.deleteMany();
    await tx.vendor.deleteMany();
    await tx.rolePermission.deleteMany();
    await tx.userRole.deleteMany();
    await tx.permission.deleteMany();
    await tx.role.deleteMany();
    await tx.user.deleteMany();

    const adminRole = await tx.role.create({
      data: { name: 'Admin', description: 'Full system access' },
    });
    const salesRole = await tx.role.create({
      data: { name: 'Sales User', description: 'Sales order operator' },
    });
    const purchaseRole = await tx.role.create({
      data: { name: 'Purchase User', description: 'Purchase order operator' },
    });
    const createdPermissions = await Promise.all(
      permissions.map((code) => tx.permission.create({ data: { code } })),
    );
    await Promise.all(
      createdPermissions.map((permission) =>
        tx.rolePermission.create({ data: { roleId: adminRole.id, permissionId: permission.id } }),
      ),
    );
    for (const code of [
      'VIEW_PRODUCTS',
      'CREATE_SALES_ORDER',
      'VIEW_SALES_ORDER',
      'CONFIRM_SALES_ORDER',
      'DELIVER_SALES_ORDER',
    ]) {
      await tx.rolePermission.create({
        data: {
          roleId: salesRole.id,
          permissionId: createdPermissions.find((p) => p.code === code)!.id,
        },
      });
    }
    for (const code of [
      'VIEW_PRODUCTS',
      'CREATE_PURCHASE_ORDER',
      'VIEW_PURCHASE_ORDER',
      'CONFIRM_PURCHASE_ORDER',
      'RECEIVE_PURCHASE_ORDER',
    ]) {
      await tx.rolePermission.create({
        data: {
          roleId: purchaseRole.id,
          permissionId: createdPermissions.find((p) => p.code === code)!.id,
        },
      });
    }

    const passwordHash = await bcrypt.hash('Admin@123', 12);
    const admin = await tx.user.create({
      data: {
        loginId: 'admin01',
        email: 'admin@shivfurniture.local',
        name: 'System Admin',
        position: 'Administrator',
        passwordHash,
      },
    });
    const salesUser = await tx.user.create({
      data: {
        loginId: 'sales01',
        email: 'sales@shivfurniture.local',
        name: 'Anita Sales',
        position: 'Sales Executive',
        passwordHash,
      },
    });
    const buyer = await tx.user.create({
      data: {
        loginId: 'buyer01',
        email: 'buyer@shivfurniture.local',
        name: 'Rahul Buyer',
        position: 'Purchase Executive',
        passwordHash,
      },
    });
    await tx.userRole.createMany({
      data: [
        { userId: admin.id, roleId: adminRole.id },
        { userId: salesUser.id, roleId: salesRole.id },
        { userId: buyer.id, roleId: purchaseRole.id },
      ],
    });

    const vendorNames = [
      'Premium Timber Suppliers',
      'Urban Hardware Co',
      'Bengaluru Foam Works',
      'SteelFit Industries',
      'Apex Adhesives',
      'Varnish House',
      'Metro Packaging',
      'North Star Textiles',
      'Eco Ply Boards',
      'Precision Castors',
    ];
    const vendors = [];
    for (let i = 0; i < 10; i++)
      vendors.push(
        await tx.vendor.create({
          data: {
            reference: `VEND-${String(i + 1).padStart(4, '0')}`,
            name: vendorNames[i],
            address: `${20 + i} Industrial Area, Bengaluru`,
            contact: `+91-90000000${String(i).padStart(2, '0')}`,
            leadTimeDays: 2 + (i % 6),
          },
        }),
      );

    const customers = [];
    for (let i = 0; i < 20; i++)
      customers.push(
        await tx.customer.create({
          data: {
            reference: `CUST-${String(i + 1).padStart(4, '0')}`,
            name: `Customer ${String(i + 1).padStart(2, '0')} Interiors`,
            address: `${100 + i} Market Road, Bengaluru`,
            contact: `+91-98800000${String(i).padStart(2, '0')}`,
          },
        }),
      );

    const materialNames = [
      'Teak Wood Plank',
      'Oak Panel',
      'Plywood Sheet',
      'Foam Cushion',
      'Cotton Fabric',
      'Steel Bracket',
      'Drawer Rail',
      'Wood Screw Box',
      'Adhesive Tin',
      'Clear Varnish',
      'Packing Carton',
      'Caster Wheel',
      'Hinge Set',
      'Handle Set',
      'Laminate Sheet',
      'Edge Band Roll',
      'Glass Insert',
      'Thread Spool',
      'Rubber Foot',
      'Polish Compound',
      'MDF Board',
      'Nail Pack',
      'Corner Clamp',
      'Glue Stick',
      'Protective Film',
      'Sanding Disc',
      'Primer Tin',
      'Lacquer Tin',
      'Leatherette Roll',
      'Metal Tube',
    ];
    const products = [];
    for (let i = 0; i < 50; i++) {
      const finished = i >= 30;
      const onHandQty = finished ? 8 + (i % 8) : 80 + ((i * 7) % 90);
      products.push(
        await tx.product.create({
          data: {
            reference: `PROD-${String(i + 1).padStart(4, '0')}`,
            name: finished ? `Finished Furniture ${i - 29}` : materialNames[i],
            salesPrice: finished ? 4200 + i * 95 : 300 + i * 17,
            costPrice: finished ? 2400 + i * 55 : 160 + i * 11,
            onHandQty,
            reorderPoint: finished ? 4 : 25,
            procureOnDemand: true,
            procurementType: finished ? 'MANUFACTURING' : 'PURCHASE',
            defaultVendorId: finished ? null : vendors[i % vendors.length].id,
          },
        }),
      );
      await tx.stockMovement.create({
        data: {
          productId: products[i].id,
          direction: StockDirection.IN,
          quantity: onHandQty,
          signedQty: onHandQty,
          source: StockSource.MANUAL_ADJUSTMENT,
          referenceType: 'SeedOpening',
          referenceId: `OPEN-${i + 1}`,
          actorId: admin.id,
        },
      });
    }

    const boms = [];
    for (let i = 30; i < 40; i++) {
      const bom = await tx.bom.create({
        data: {
          reference: `BOM-${String(i - 29).padStart(4, '0')}`,
          finishedProductId: products[i].id,
          referenceQty: 1,
          items: {
            create: [
              { productId: products[(i - 30) % 10].id, quantity: 3 + (i % 3) },
              { productId: products[(i - 20) % 20].id, quantity: 1 + (i % 2) },
            ],
          },
          operations: {
            create: [
              { name: 'Cutting and Assembly', workCenter: 'Carpentry', expectedMinutes: 75 },
              { name: 'Finishing', workCenter: 'Finishing', expectedMinutes: 35 },
            ],
          },
        },
      });
      await tx.product.update({ where: { id: products[i].id }, data: { defaultBomId: bom.id } });
      boms.push(bom);
    }

    const firstSo = await tx.salesOrder.create({
      data: {
        reference: 'SO-000001',
        customerId: customers[0].id,
        customerAddress: customers[0].address,
        salesPersonId: salesUser.id,
        status: SalesStatus.CONFIRMED,
        items: {
          create: [
            { productId: products[30].id, orderedQty: 3, salesPrice: products[30].salesPrice },
          ],
        },
      },
      include: { items: true },
    });
    await tx.inventoryReservation.create({
      data: { productId: products[30].id, salesOrderId: firstSo.id, quantity: 3 },
    });
    for (let i = 1; i < 10; i++) {
      const delivered = i % 3 === 0 ? 1 : 0;
      const status = delivered
        ? SalesStatus.PARTIALLY_DELIVERED
        : i % 4 === 0
          ? SalesStatus.DRAFT
          : SalesStatus.CONFIRMED;
      const so = await tx.salesOrder.create({
        data: {
          reference: `SO-${String(i + 1).padStart(6, '0')}`,
          customerId: customers[i].id,
          customerAddress: customers[i].address,
          salesPersonId: salesUser.id,
          status,
          items: {
            create: [
              {
                productId: products[30 + (i % 10)].id,
                orderedQty: 2 + (i % 3),
                deliveredQty: delivered,
                salesPrice: products[30 + (i % 10)].salesPrice,
              },
            ],
          },
        },
        include: { items: true },
      });
      if (status === SalesStatus.CONFIRMED)
        await tx.inventoryReservation.create({
          data: {
            productId: so.items[0].productId,
            salesOrderId: so.id,
            quantity: Number(so.items[0].orderedQty),
          },
        });
      if (delivered) {
        await tx.product.update({
          where: { id: so.items[0].productId },
          data: { onHandQty: { decrement: delivered } },
        });
        await tx.stockMovement.create({
          data: {
            productId: so.items[0].productId,
            direction: StockDirection.OUT,
            quantity: delivered,
            signedQty: -delivered,
            source: StockSource.SALES_DELIVERY,
            referenceType: 'SalesOrder',
            referenceId: so.id,
            actorId: salesUser.id,
          },
        });
      }
    }

    for (let i = 0; i < 10; i++) {
      const orderedQty = 40 + i * 5;
      const receivedQty = i % 2 === 0 ? orderedQty : Math.floor(orderedQty / 2);
      const po = await tx.purchaseOrder.create({
        data: {
          reference: `PO-${String(i + 1).padStart(6, '0')}`,
          vendorId: vendors[i].id,
          vendorAddress: vendors[i].address,
          responsiblePersonId: buyer.id,
          status:
            receivedQty === orderedQty
              ? PurchaseStatus.FULLY_RECEIVED
              : PurchaseStatus.PARTIALLY_RECEIVED,
          autoCreated: i === 0,
          triggerSourceSoId: i === 0 ? firstSo.id : null,
          items: {
            create: [
              {
                productId: products[i].id,
                orderedQty,
                receivedQty,
                costPrice: products[i].costPrice,
              },
            ],
          },
        },
        include: { items: true },
      });
      await tx.product.update({
        where: { id: products[i].id },
        data: { onHandQty: { increment: receivedQty } },
      });
      await tx.stockMovement.create({
        data: {
          productId: products[i].id,
          direction: StockDirection.IN,
          quantity: receivedQty,
          signedQty: receivedQty,
          source: StockSource.PURCHASE_RECEIPT,
          referenceType: 'PurchaseOrder',
          referenceId: po.id,
          actorId: buyer.id,
        },
      });
    }

    for (let i = 0; i < 5; i++) {
      const qty = 2 + i;
      const mo = await tx.manufacturingOrder.create({
        data: {
          reference: `MO-2026-${String(i + 1).padStart(4, '0')}`,
          finishedProductId: products[30 + i].id,
          bomId: boms[i].id,
          quantity: qty,
          status: i < 2 ? ManufacturingStatus.COMPLETED : ManufacturingStatus.CONFIRMED,
          autoCreated: i === 0,
          triggerSourceSoId: i === 0 ? firstSo.id : null,
          items: {
            create: [
              { productId: products[i].id, requiredQty: qty * 3, consumedQty: i < 2 ? qty * 3 : 0 },
            ],
          },
          workOrders: {
            create: [{ name: 'Assembly', workCenter: 'Line A', expectedMinutes: 90 * qty }],
          },
        },
        include: { items: true },
      });
      if (i < 2) {
        await tx.product.update({
          where: { id: products[i].id },
          data: { onHandQty: { decrement: qty * 3 } },
        });
        await tx.product.update({
          where: { id: products[30 + i].id },
          data: { onHandQty: { increment: qty } },
        });
        await tx.stockMovement.createMany({
          data: [
            {
              productId: products[i].id,
              direction: StockDirection.OUT,
              quantity: qty * 3,
              signedQty: -qty * 3,
              source: StockSource.MO_CONSUMPTION,
              referenceType: 'ManufacturingOrder',
              referenceId: mo.id,
              actorId: admin.id,
            },
            {
              productId: products[30 + i].id,
              direction: StockDirection.IN,
              quantity: qty,
              signedQty: qty,
              source: StockSource.MO_PRODUCTION,
              referenceType: 'ManufacturingOrder',
              referenceId: mo.id,
              actorId: admin.id,
            },
          ],
        });
      } else {
        await tx.inventoryReservation.create({
          data: { productId: products[i].id, manufacturingOrderId: mo.id, quantity: qty * 3 },
        });
      }
    }

    await tx.auditLog.createMany({
      data: [
        {
          actorId: admin.id,
          module: 'AUTH',
          recordType: 'User',
          recordId: admin.id,
          action: AuditAction.CREATE,
          fieldName: 'loginId',
          newValue: 'admin01',
        },
        {
          actorId: admin.id,
          module: 'PRODUCT',
          recordType: 'Product',
          recordId: products[0].id,
          action: AuditAction.CREATE,
          fieldName: 'reference',
          newValue: products[0].reference,
        },
        {
          actorId: salesUser.id,
          module: 'SALES',
          recordType: 'SalesOrder',
          recordId: firstSo.id,
          action: AuditAction.CONFIRM,
          fieldName: 'status',
          oldValue: 'DRAFT',
          newValue: 'CONFIRMED',
        },
        {
          actorId: buyer.id,
          module: 'PURCHASE',
          recordType: 'PurchaseOrder',
          recordId: 'seed-purchase',
          action: AuditAction.RECEIVE,
          fieldName: 'receivedQty',
          oldValue: '0',
          newValue: 'multiple',
        },
        {
          actorId: admin.id,
          module: 'MANUFACTURING',
          recordType: 'ManufacturingOrder',
          recordId: 'seed-manufacturing',
          action: AuditAction.COMPLETE,
          fieldName: 'status',
          oldValue: 'IN_PROGRESS',
          newValue: 'COMPLETED',
        },
      ],
    });
    await tx.notification.createMany({
      data: [
        {
          userId: buyer.id,
          type: 'PURCHASE_RECEIPT',
          message: 'Several purchase orders are partially received and awaiting balance stock.',
        },
        {
          userId: salesUser.id,
          type: 'ORDER_CONFIRMED',
          message: 'SO-000001 is confirmed and stock is reserved.',
        },
        {
          userId: admin.id,
          type: 'LOW_STOCK',
          message: 'Review finished furniture reorder points before the next sales cycle.',
        },
      ],
    });
  });
  console.log('Realistic demo ERP data seeded. Password for all users: Admin@123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
