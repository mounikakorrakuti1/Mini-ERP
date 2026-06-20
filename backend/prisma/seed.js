'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const client_1 = require('@prisma/client');
const bcryptjs_1 = __importDefault(require('bcryptjs'));
const prisma = new client_1.PrismaClient();
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
      const permission = createdPermissions.find((p) => p.code === code);
      await tx.rolePermission.create({
        data: { roleId: salesRole.id, permissionId: permission.id },
      });
    }
    for (const code of [
      'VIEW_PRODUCTS',
      'CREATE_PURCHASE_ORDER',
      'VIEW_PURCHASE_ORDER',
      'CONFIRM_PURCHASE_ORDER',
      'RECEIVE_PURCHASE_ORDER',
    ]) {
      const permission = createdPermissions.find((p) => p.code === code);
      await tx.rolePermission.create({
        data: { roleId: purchaseRole.id, permissionId: permission.id },
      });
    }
    const passwordHash = await bcryptjs_1.default.hash('Admin@123', 12);
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
    const customer = await tx.customer.create({
      data: {
        reference: 'CUST-0001',
        name: 'Acme Interiors Pvt Ltd',
        address: '12 MG Road, Bengaluru',
        contact: '+91-9876543210',
      },
    });
    const vendor = await tx.vendor.create({
      data: {
        reference: 'VEND-0001',
        name: 'Premium Timber Suppliers',
        address: 'Industrial Area, Bengaluru',
        contact: '+91-9000000001',
        leadTimeDays: 5,
      },
    });
    const wood = await tx.product.create({
      data: {
        reference: 'PROD-0001',
        name: 'Teak Wood Plank',
        salesPrice: 1200,
        costPrice: 800,
        onHandQty: 200,
        reorderPoint: 50,
        procureOnDemand: true,
        procurementType: 'PURCHASE',
        defaultVendorId: vendor.id,
      },
    });
    const chair = await tx.product.create({
      data: {
        reference: 'PROD-0002',
        name: 'Classic Teak Chair',
        salesPrice: 5500,
        costPrice: 3200,
        onHandQty: 10,
        reorderPoint: 5,
        procureOnDemand: true,
        procurementType: 'MANUFACTURING',
      },
    });
    const bom = await tx.bom.create({
      data: {
        reference: 'BOM-0001',
        finishedProductId: chair.id,
        referenceQty: 1,
        items: { create: [{ productId: wood.id, quantity: 5 }] },
        operations: {
          create: [
            { name: 'Cutting and Assembly', workCenter: 'Carpentry', expectedMinutes: 90 },
            { name: 'Finishing', workCenter: 'Finishing', expectedMinutes: 30 },
          ],
        },
      },
      include: { items: true, operations: true },
    });
    await tx.product.update({ where: { id: chair.id }, data: { defaultBomId: bom.id } });
    const salesOrder = await tx.salesOrder.create({
      data: {
        reference: 'SO-000001',
        customerId: customer.id,
        customerAddress: customer.address,
        salesPersonId: salesUser.id,
        status: client_1.SalesStatus.CONFIRMED,
        availabilityFlag: false,
        items: {
          create: [{ productId: chair.id, orderedQty: 3, deliveredQty: 0, salesPrice: 5500 }],
        },
      },
      include: { items: true },
    });
    const purchaseOrder = await tx.purchaseOrder.create({
      data: {
        reference: 'PO-000001',
        vendorId: vendor.id,
        vendorAddress: vendor.address,
        responsiblePersonId: buyer.id,
        status: client_1.PurchaseStatus.PARTIALLY_RECEIVED,
        autoCreated: false,
        items: {
          create: [{ productId: wood.id, orderedQty: 100, receivedQty: 50, costPrice: 800 }],
        },
      },
      include: { items: true },
    });
    const manufacturingOrder = await tx.manufacturingOrder.create({
      data: {
        reference: 'MO-2026-0001',
        finishedProductId: chair.id,
        bomId: bom.id,
        quantity: 2,
        status: client_1.ManufacturingStatus.CONFIRMED,
        items: { create: [{ productId: wood.id, requiredQty: 10, consumedQty: 0 }] },
        workOrders: {
          create: bom.operations.map((operation) => ({
            name: operation.name,
            workCenter: operation.workCenter,
            expectedMinutes: Number(operation.expectedMinutes) * 2,
          })),
        },
      },
      include: { items: true },
    });
    await tx.inventoryReservation.createMany({
      data: [
        { productId: chair.id, salesOrderId: salesOrder.id, quantity: 3 },
        { productId: wood.id, manufacturingOrderId: manufacturingOrder.id, quantity: 10 },
      ],
    });
    await tx.stockMovement.createMany({
      data: [
        {
          productId: wood.id,
          direction: client_1.StockDirection.IN,
          quantity: 150,
          signedQty: 150,
          source: client_1.StockSource.MANUAL_ADJUSTMENT,
          referenceType: 'Seed',
          referenceId: 'opening-wood',
          actorId: admin.id,
        },
        {
          productId: wood.id,
          direction: client_1.StockDirection.IN,
          quantity: 50,
          signedQty: 50,
          source: client_1.StockSource.PURCHASE_RECEIPT,
          referenceType: 'PurchaseOrder',
          referenceId: purchaseOrder.id,
          actorId: buyer.id,
        },
        {
          productId: chair.id,
          direction: client_1.StockDirection.IN,
          quantity: 10,
          signedQty: 10,
          source: client_1.StockSource.MANUAL_ADJUSTMENT,
          referenceType: 'Seed',
          referenceId: 'opening-chair',
          actorId: admin.id,
        },
      ],
    });
    await tx.auditLog.createMany({
      data: [
        {
          actorId: admin.id,
          module: 'AUTH',
          recordType: 'User',
          recordId: admin.id,
          action: client_1.AuditAction.CREATE,
          fieldName: 'loginId',
          newValue: 'admin01',
        },
        {
          actorId: admin.id,
          module: 'PRODUCT',
          recordType: 'Product',
          recordId: chair.id,
          action: client_1.AuditAction.CREATE,
          fieldName: 'name',
          newValue: chair.name,
        },
        {
          actorId: salesUser.id,
          module: 'SALES',
          recordType: 'SalesOrder',
          recordId: salesOrder.id,
          action: client_1.AuditAction.CONFIRM,
          fieldName: 'status',
          oldValue: 'DRAFT',
          newValue: 'CONFIRMED',
        },
        {
          actorId: buyer.id,
          module: 'PURCHASE',
          recordType: 'PurchaseOrder',
          recordId: purchaseOrder.id,
          action: client_1.AuditAction.RECEIVE,
          fieldName: 'receivedQty',
          oldValue: '0',
          newValue: '50',
        },
      ],
    });
    await tx.notification.createMany({
      data: [
        {
          userId: buyer.id,
          type: 'PURCHASE_RECEIPT',
          message: 'PO-000001 was partially received: 50 Teak Wood Planks.',
        },
        {
          userId: salesUser.id,
          type: 'ORDER_CONFIRMED',
          message: 'SO-000001 is confirmed and stock is reserved.',
        },
        {
          userId: admin.id,
          type: 'LOW_STOCK',
          message: 'Classic Teak Chair has 7 units available after reservations.',
        },
      ],
    });
  });
  console.log('Demo ERP data seeded. Password for all users: Admin@123');
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
