import 'dotenv/config';
import {
  AuditAction,
  ManufacturingStatus,
  Prisma,
  PrismaClient,
  PurchaseStatus,
  SalesStatus,
  StockDirection,
  StockSource,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const positions = [
  'Sales Executive',
  'Procurement Specialist',
  'Manufacturing Lead',
  'Inventory Coordinator',
  'Customer Success',
  'Operations Analyst',
];

const firstNames = [
  'Aarav', 'Priya', 'Neha', 'Rohan', 'Isha', 'Karan', 'Sanya', 'Vikram', 'Meera', 'Anaya',
  'Rhea', 'Siddharth', 'Arjun', 'Divya', 'Kunal', 'Sneha', 'Aditi', 'Manish', 'Simran', 'Nikhil',
];

const lastNames = [
  'Sharma', 'Patel', 'Reddy', 'Singh', 'Kaur', 'Mehta', 'Kapoor', 'Nair', 'Gupta', 'Chopra',
  'Desai', 'Bose', 'Verma', 'Joshi', 'Malhotra', 'Agarwal', 'Das', 'Bhattacharya', 'Fernandes', 'Iyer',
];

const customerNames = [
  'Horizon Interiors', 'Lotus Decor', 'Cedar Living', 'Urban Habitat', 'Elite Spaces',
  'Purewood Furnishings', 'Metro Interiors', 'Greenline Furnishings', 'Oak & Shade', 'Skyline Designs',
  'Amber Craft', 'Crown Interiors', 'Royal Seating', 'Nest Furnishings', 'Avenue Decor',
  'Harbor Homes', 'Serene Spaces', 'Bluewood Studio', 'Lotus Interiors', 'Prime Furnishings',
];

const vendorNames = [
  'Premium Timber Suppliers', 'Urban Hardware Co', 'Bengaluru Foam Works', 'SteelFit Industries',
  'Apex Adhesives', 'Varnish House', 'Metro Packaging', 'North Star Textiles', 'Eco Ply Boards',
  'Precision Castors', 'Golden Veneers', 'Polytech Plastics', 'Green Laminate', 'Furniture Fasteners',
  'Crystal Glassware', 'LaserCut Components', 'Timberline Mills', 'Craftboard Exports',
];

const rawMaterialNames = [
  'Teak Wood Plank', 'Oak Panel', 'Plywood Sheet', 'Foam Cushion', 'Cotton Fabric',
  'Steel Bracket', 'Drawer Rail', 'Wood Screw Box', 'Adhesive Tin', 'Clear Varnish',
  'Packing Carton', 'Caster Wheel', 'Hinge Set', 'Handle Set', 'Laminate Sheet',
  'Edge Band Roll', 'Glass Insert', 'Thread Spool', 'Rubber Foot', 'Polish Compound',
  'MDF Board', 'Nail Pack', 'Corner Clamp', 'Glue Stick', 'Protective Film',
  'Sanding Disc', 'Primer Tin', 'Lacquer Tin', 'Leatherette Roll', 'Metal Tube',
];

const finishedProductNames = [
  'Classic Teak Chair', 'Signature Dining Table', 'Executive Desk', 'Modern Sofa',
  'Accent Cabinet', 'Coffee Table Set', 'Office Book Shelf', 'Dining Bench',
  'Lounge Chair', 'Reception Counter', 'Bedroom Wardrobe', 'TV Unit',
  'Conference Table', 'Bed Frame', 'Study Table',
];

const modulesList = [
  'PRODUCTS', 'SALES_ORDERS', 'PURCHASE_ORDERS', 'MANUFACTURING_ORDERS',
  'BOM', 'VENDORS', 'CUSTOMERS', 'INVENTORY', 'PROCUREMENT', 'AUDIT_LOGS', 'USER_MANAGEMENT', 'DASHBOARDS',
];

function getItem<T>(items: T[], index: number): T {
  return items[index % items.length];
}

function pad(value: number, size = 4) {
  return String(value).padStart(size, '0');
}

async function main() {
  const passwordHash = await bcrypt.hash('User@123', 12);

  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({ where: { type: { startsWith: 'SEED_' } } });
    await tx.auditLog.deleteMany({ where: { module: 'SEED' } });
    await tx.stockMovement.deleteMany({ where: { referenceType: 'SEED' } });
    await tx.inventoryReservation.deleteMany({ where: { product: { reference: { startsWith: 'PROD-SEED' } } } });
    await tx.workOrder.deleteMany({ where: { manufacturingOrder: { reference: { startsWith: 'MO-SEED' } } } });
    await tx.manufacturingOrderItem.deleteMany({ where: { manufacturingOrder: { reference: { startsWith: 'MO-SEED' } } } });
    await tx.manufacturingOrder.deleteMany({ where: { reference: { startsWith: 'MO-SEED' } } });
    await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { reference: { startsWith: 'PO-SEED' } } } });
    await tx.purchaseOrder.deleteMany({ where: { reference: { startsWith: 'PO-SEED' } } });
    await tx.salesOrderItem.deleteMany({ where: { salesOrder: { reference: { startsWith: 'SO-SEED' } } } });
    await tx.salesOrder.deleteMany({ where: { reference: { startsWith: 'SO-SEED' } } });
    await tx.bomOperation.deleteMany({ where: { bom: { reference: { startsWith: 'BOM-SEED' } } } });
    await tx.bomItem.deleteMany({ where: { bom: { reference: { startsWith: 'BOM-SEED' } } } });
    await tx.bom.deleteMany({ where: { reference: { startsWith: 'BOM-SEED' } } });
    await tx.product.deleteMany({ where: { reference: { startsWith: 'PROD-SEED' } } });
    await tx.customer.deleteMany({ where: { reference: { startsWith: 'CUST-SEED' } } });
    await tx.vendor.deleteMany({ where: { reference: { startsWith: 'VEND-SEED' } } });
    await tx.userRole.deleteMany({ where: { user: { loginId: { startsWith: 'dummy' } } } });
    await tx.user.deleteMany({ where: { loginId: { startsWith: 'dummy' } } });

    await tx.permission.createMany({
      data: modulesList.map((module) => ({ module })),
      skipDuplicates: true,
    });

    await tx.role.createMany({
      data: [
        { name: 'Admin', description: 'Full system access' },
        { name: 'Business Owner', description: 'Business owner with read access' },
        { name: 'Sales User', description: 'Sales order operator' },
        { name: 'Purchase User', description: 'Purchase order operator' },
        { name: 'Manufacturing User', description: 'Manufacturing operator' },
        { name: 'Inventory Manager', description: 'Inventory manager' },
      ],
      skipDuplicates: true,
    });

    const [roles, permissions] = await Promise.all([
      tx.role.findMany(),
      tx.permission.findMany(),
    ]);

    const roleMap = new Map<string, { id: string; name: string }>();
    roles.forEach((role) => roleMap.set(role.name, { id: role.id, name: role.name }));

    const permissionMap = new Map<string, { id: string; module: string }>();
    permissions.forEach((permission) => permissionMap.set(permission.module, { id: permission.id, module: permission.module }));

    const matrix = [
      { role: 'Admin', module: 'PRODUCTS', level: 'ADMIN' },
      { role: 'Admin', module: 'SALES_ORDERS', level: 'ADMIN' },
      { role: 'Admin', module: 'PURCHASE_ORDERS', level: 'ADMIN' },
      { role: 'Admin', module: 'MANUFACTURING_ORDERS', level: 'ADMIN' },
      { role: 'Admin', module: 'BOM', level: 'ADMIN' },
      { role: 'Admin', module: 'VENDORS', level: 'ADMIN' },
      { role: 'Admin', module: 'CUSTOMERS', level: 'ADMIN' },
      { role: 'Admin', module: 'INVENTORY', level: 'ADMIN' },
      { role: 'Admin', module: 'PROCUREMENT', level: 'ADMIN' },
      { role: 'Admin', module: 'AUDIT_LOGS', level: 'ADMIN' },
      { role: 'Admin', module: 'USER_MANAGEMENT', level: 'ADMIN' },
      { role: 'Admin', module: 'DASHBOARDS', level: 'ADMIN' },

      { role: 'Business Owner', module: 'PRODUCTS', level: 'ADMIN' },
      { role: 'Business Owner', module: 'SALES_ORDERS', level: 'VIEW' },
      { role: 'Business Owner', module: 'PURCHASE_ORDERS', level: 'VIEW' },
      { role: 'Business Owner', module: 'MANUFACTURING_ORDERS', level: 'VIEW' },
      { role: 'Business Owner', module: 'BOM', level: 'VIEW' },
      { role: 'Business Owner', module: 'VENDORS', level: 'VIEW' },
      { role: 'Business Owner', module: 'CUSTOMERS', level: 'VIEW' },
      { role: 'Business Owner', module: 'INVENTORY', level: 'VIEW' },
      { role: 'Business Owner', module: 'PROCUREMENT', level: 'VIEW' },
      { role: 'Business Owner', module: 'DASHBOARDS', level: 'ADMIN' },

      { role: 'Sales User', module: 'PRODUCTS', level: 'VIEW' },
      { role: 'Sales User', module: 'SALES_ORDERS', level: 'ADMIN' },
      { role: 'Sales User', module: 'CUSTOMERS', level: 'ADMIN' },
      { role: 'Sales User', module: 'INVENTORY', level: 'VIEW' },
      { role: 'Sales User', module: 'DASHBOARDS', level: 'VIEW' },

      { role: 'Purchase User', module: 'PRODUCTS', level: 'VIEW' },
      { role: 'Purchase User', module: 'PURCHASE_ORDERS', level: 'ADMIN' },
      { role: 'Purchase User', module: 'VENDORS', level: 'ADMIN' },
      { role: 'Purchase User', module: 'INVENTORY', level: 'VIEW' },
      { role: 'Purchase User', module: 'PROCUREMENT', level: 'ADMIN' },
      { role: 'Purchase User', module: 'DASHBOARDS', level: 'VIEW' },

      { role: 'Manufacturing User', module: 'PRODUCTS', level: 'VIEW' },
      { role: 'Manufacturing User', module: 'MANUFACTURING_ORDERS', level: 'ADMIN' },
      { role: 'Manufacturing User', module: 'BOM', level: 'ADMIN' },
      { role: 'Manufacturing User', module: 'INVENTORY', level: 'VIEW' },
      { role: 'Manufacturing User', module: 'DASHBOARDS', level: 'VIEW' },

      { role: 'Inventory Manager', module: 'PRODUCTS', level: 'VIEW' },
      { role: 'Inventory Manager', module: 'SALES_ORDERS', level: 'VIEW' },
      { role: 'Inventory Manager', module: 'PURCHASE_ORDERS', level: 'VIEW' },
      { role: 'Inventory Manager', module: 'MANUFACTURING_ORDERS', level: 'VIEW' },
      { role: 'Inventory Manager', module: 'BOM', level: 'VIEW' },
      { role: 'Inventory Manager', module: 'VENDORS', level: 'VIEW' },
      { role: 'Inventory Manager', module: 'INVENTORY', level: 'ADMIN' },
      { role: 'Inventory Manager', module: 'DASHBOARDS', level: 'VIEW' },
    ];

    await tx.rolePermission.createMany({
      data: matrix.map((entry) => ({
        roleId: roleMap.get(entry.role)!.id,
        permissionId: permissionMap.get(entry.module)!.id,
        accessLevel: entry.level as any,
      })),
      skipDuplicates: true,
    });

    const admin = await tx.user.upsert({
      where: { loginId: 'admin01' },
      update: { passwordHash },
      create: {
        loginId: 'admin01',
        email: 'admin@shivfurniture.local',
        name: 'System Admin',
        position: 'Administrator',
        passwordHash,
      },
    });

    const owner = await tx.user.upsert({
      where: { loginId: 'owner01' },
      update: { passwordHash },
      create: {
        loginId: 'owner01',
        email: 'owner@shivfurniture.local',
        name: 'Business Owner',
        position: 'Owner',
        passwordHash,
      },
    });

    const salesUser = await tx.user.upsert({
      where: { loginId: 'sales01' },
      update: { passwordHash },
      create: {
        loginId: 'sales01',
        email: 'sales@shivfurniture.local',
        name: 'Anita Sales',
        position: 'Sales Executive',
        passwordHash,
      },
    });

    const purchaseUser = await tx.user.upsert({
      where: { loginId: 'buyer01' },
      update: { passwordHash },
      create: {
        loginId: 'buyer01',
        email: 'buyer@shivfurniture.local',
        name: 'Rahul Buyer',
        position: 'Purchase Executive',
        passwordHash,
      },
    });

    const mfgUser = await tx.user.upsert({
      where: { loginId: 'mfg01' },
      update: { passwordHash },
      create: {
        loginId: 'mfg01',
        email: 'mfg@shivfurniture.local',
        name: 'David Mfg',
        position: 'Factory Manager',
        passwordHash,
      },
    });

    const invUser = await tx.user.upsert({
      where: { loginId: 'inv01' },
      update: { passwordHash },
      create: {
        loginId: 'inv01',
        email: 'inv@shivfurniture.local',
        name: 'Sarah Inv',
        position: 'Inventory Manager',
        passwordHash,
      },
    });

    await tx.userRole.deleteMany({ where: { userId: { in: [admin.id, owner.id, salesUser.id, purchaseUser.id, mfgUser.id, invUser.id] } } });
    await tx.userRole.createMany({
      data: [
        { userId: admin.id, roleId: roleMap.get('Admin')!.id },
        { userId: owner.id, roleId: roleMap.get('Business Owner')!.id },
        { userId: salesUser.id, roleId: roleMap.get('Sales User')!.id },
        { userId: purchaseUser.id, roleId: roleMap.get('Purchase User')!.id },
        { userId: mfgUser.id, roleId: roleMap.get('Manufacturing User')!.id },
        { userId: invUser.id, roleId: roleMap.get('Inventory Manager')!.id },
      ],
      skipDuplicates: true,
    });

    const dummyUsers = Array.from({ length: 54 }, (_, index) => {
      const number = index + 1;
      const active = index % 10 !== 0;
      const base = {
        loginId: `dummy${pad(number)}`,
        email: `dummy${pad(number)}@example.com`,
        passwordHash,
        name: `${getItem(firstNames, index)} ${getItem(lastNames, index)}`,
        active,
      } as Prisma.UserCreateInput;

      if (active) {
        return {
          ...base,
          address: `${120 + index} Seed Avenue, Bangalore`,
          mobile: `+919000${String(100000 + index).slice(-6)}`,
          position: getItem(positions, index),
        };
      }

      return base;
    });

    await tx.user.createMany({ data: dummyUsers, skipDuplicates: true });

    const allDummyUsers = await tx.user.findMany({
      where: { loginId: { startsWith: 'dummy' } },
      orderBy: { loginId: 'asc' },
    });

    const activeDummyUsers = allDummyUsers.filter((user) => user.active);
    const roleSequence = ['Sales User', 'Purchase User', 'Manufacturing User', 'Inventory Manager', 'Business Owner'];

    await tx.userRole.createMany({
      data: activeDummyUsers.map((user, index) => ({
        userId: user.id,
        roleId: roleMap.get(getItem(roleSequence, index))!.id,
      })),
      skipDuplicates: true,
    });

    const vendors = await tx.vendor.createMany({
      data: vendorNames.map((name, index) => ({
        reference: `VEND-SEED-${pad(index + 1, 3)}`,
        name,
        address: `${20 + index} Industrial Park, Bangalore`,
        contact: `+91-90000${String(100000 + index).slice(-6)}`,
        leadTimeDays: 2 + (index % 5),
      })),
      skipDuplicates: true,
    });

    const customers = await tx.customer.createMany({
      data: customerNames.slice(0, 30).map((name, index) => ({
        reference: `CUST-SEED-${pad(index + 1, 3)}`,
        name,
        address: `${15 + index} Market Street, Bangalore`,
        contact: `+91-98000${String(100000 + index).slice(-6)}`,
      })),
      skipDuplicates: true,
    });

    const storedVendors = await tx.vendor.findMany({ where: { reference: { startsWith: 'VEND-SEED' } } });
    const storedCustomers = await tx.customer.findMany({ where: { reference: { startsWith: 'CUST-SEED' } } });

    const rawProductsData = rawMaterialNames.slice(0, 28).map((name, index) => ({
      reference: `PROD-SEED-RAW-${pad(index + 1, 3)}`,
      name,
      category: 'RAW_MATERIAL',
      salesPrice: 200 + index * 5,
      costPrice: 120 + index * 3,
      onHandQty: 150 + index * 6,
      reorderPoint: 20,
      safetyStock: 15,
      procureOnDemand: true,
      procurementType: 'PURCHASE',
      defaultVendorId: getItem(storedVendors, index).id,
      active: true,
    }));

    const finishedProductsData = finishedProductNames.slice(0, 10).map((name, index) => ({
      reference: `PROD-SEED-FIN-${pad(index + 1, 3)}`,
      name,
      category: 'FINISHED_GOOD',
      salesPrice: 4500 + index * 120,
      costPrice: 2500 + index * 90,
      onHandQty: 10 + index * 3,
      reorderPoint: 5,
      safetyStock: 4,
      procureOnDemand: true,
      procurementType: 'MANUFACTURING',
      defaultVendorId: null,
      active: true,
    }));

    await tx.product.createMany({ data: [...rawProductsData, ...finishedProductsData], skipDuplicates: true });

    const storedRawProducts = await tx.product.findMany({ where: { reference: { startsWith: 'PROD-SEED-RAW' } } });
    const storedFinishedProducts = await tx.product.findMany({ where: { reference: { startsWith: 'PROD-SEED-FIN' } } });

    const boms = [];
    for (let i = 0; i < 8; i++) {
      const finishedProduct = storedFinishedProducts[i];
      const bom = await tx.bom.create({
        data: {
          reference: `BOM-SEED-${pad(i + 1, 3)}`,
          finishedProductId: finishedProduct.id,
          referenceQty: 1,
          items: {
            create: [
              { productId: storedRawProducts[(i * 2) % storedRawProducts.length].id, quantity: 4 + (i % 3) },
              { productId: storedRawProducts[(i * 2 + 3) % storedRawProducts.length].id, quantity: 2 + (i % 2) },
            ],
          },
          operations: {
            create: [
              { name: 'Cutting and Assembly', workCenter: 'Carpentry', expectedMinutes: 70 + i * 5 },
              { name: 'Finishing', workCenter: 'Finishing', expectedMinutes: 28 + i * 2 },
            ],
          },
        },
      });

      await tx.product.update({ where: { id: finishedProduct.id }, data: { defaultBomId: bom.id } });
      boms.push(bom);
    }

    const salesOrders = [];
    for (let i = 0; i < 18; i++) {
      const customer = storedCustomers[i % storedCustomers.length];
      const product = getItem(storedFinishedProducts, i);
      const status = i < 10 ? 'CONFIRMED' : i < 14 ? 'DRAFT' : 'PARTIALLY_DELIVERED';
      const orderedQty = 2 + (i % 4);
      const deliveredQty = status === 'PARTIALLY_DELIVERED' ? 1 : 0;

      const order = await tx.salesOrder.create({
        data: {
          reference: `SO-SEED-${pad(i + 1, 4)}`,
          customerId: customer.id,
          customerAddress: customer.address,
          salesPersonId: salesUser.id,
          status: status as SalesStatus,
          items: {
            create: [
              {
                productId: product.id,
                orderedQty,
                deliveredQty,
                salesPrice: product.salesPrice,
              },
            ],
          },
        },
        include: { items: true },
      });

      salesOrders.push(order);
      if (status === 'CONFIRMED' || status === 'PARTIALLY_DELIVERED') {
        await tx.inventoryReservation.create({
          data: {
            productId: product.id,
            salesOrderId: order.id,
            quantity: orderedQty - deliveredQty,
          },
        });
      }
      if (deliveredQty > 0) {
        await tx.product.update({ where: { id: product.id }, data: { onHandQty: { decrement: deliveredQty } } });
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            direction: StockDirection.OUT,
            quantity: deliveredQty,
            signedQty: -deliveredQty,
            source: StockSource.SALES_DELIVERY,
            referenceType: 'SEED',
            referenceId: order.id,
            actorId: salesUser.id,
          },
        });
      }
    }

    const purchaseOrders = [];
    for (let i = 0; i < 18; i++) {
      const vendor = getItem(storedVendors, i);
      const product = storedRawProducts[i % storedRawProducts.length];
      const orderedQty = 40 + i * 2;
      const receivedQty = i % 3 === 0 ? orderedQty : Math.floor(orderedQty / 2);
      const status = receivedQty === orderedQty ? 'FULLY_RECEIVED' : 'PARTIALLY_RECEIVED';

      const po = await tx.purchaseOrder.create({
        data: {
          reference: `PO-SEED-${pad(i + 1, 4)}`,
          vendorId: vendor.id,
          vendorAddress: vendor.address,
          responsiblePersonId: purchaseUser.id,
          status: status as PurchaseStatus,
          autoCreated: i === 0,
          expectedReceiptDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          items: {
            create: [
              {
                productId: product.id,
                orderedQty,
                receivedQty,
                costPrice: product.costPrice,
              },
            ],
          },
        },
        include: { items: true },
      });

      purchaseOrders.push(po);
      await tx.product.update({ where: { id: product.id }, data: { onHandQty: { increment: receivedQty } } });
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          direction: StockDirection.IN,
          quantity: receivedQty,
          signedQty: receivedQty,
          source: StockSource.PURCHASE_RECEIPT,
          referenceType: 'SEED',
          referenceId: po.id,
          actorId: purchaseUser.id,
        },
      });
    }

    for (let i = 0; i < 8; i++) {
      const product = storedFinishedProducts[i];
      const bom = boms[i];
      const qty = 1 + (i % 3);
      const status = i < 4 ? 'COMPLETED' : 'CONFIRMED';
      const mo = await tx.manufacturingOrder.create({
        data: {
          reference: `MO-SEED-${pad(i + 1, 4)}`,
          finishedProductId: product.id,
          bomId: bom.id,
          quantity: qty,
          status: status as ManufacturingStatus,
          autoCreated: i % 2 === 0,
          plannedCompletionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
          items: {
            create: [
              { productId: storedRawProducts[i % storedRawProducts.length].id, requiredQty: qty * 3, consumedQty: status === 'COMPLETED' ? qty * 3 : 0 },
            ],
          },
          workOrders: {
            create: [{ name: 'Assembly', workCenter: 'Line A', expectedMinutes: 90 * qty }],
          },
        },
        include: { items: true },
      });

      if (status === 'COMPLETED') {
        await tx.product.update({ where: { id: storedRawProducts[i % storedRawProducts.length].id }, data: { onHandQty: { decrement: qty * 3 } } });
        await tx.product.update({ where: { id: product.id }, data: { onHandQty: { increment: qty } } });
        await tx.stockMovement.createMany({
          data: [
            {
              productId: storedRawProducts[i % storedRawProducts.length].id,
              direction: StockDirection.OUT,
              quantity: qty * 3,
              signedQty: -qty * 3,
              source: StockSource.MO_CONSUMPTION,
              referenceType: 'SEED',
              referenceId: mo.id,
              actorId: mfgUser.id,
            },
            {
              productId: product.id,
              direction: StockDirection.IN,
              quantity: qty,
              signedQty: qty,
              source: StockSource.MO_PRODUCTION,
              referenceType: 'SEED',
              referenceId: mo.id,
              actorId: mfgUser.id,
            },
          ],
        });
      } else {
        await tx.inventoryReservation.create({
          data: {
            productId: storedRawProducts[i % storedRawProducts.length].id,
            manufacturingOrderId: mo.id,
            quantity: qty * 3,
          },
        });
      }
    }

    const allProducts = [...storedRawProducts, ...storedFinishedProducts];
    await tx.stockMovement.createMany({
      data: allProducts.map((product) => ({
        productId: product.id,
        direction: StockDirection.IN,
        quantity: Number(product.onHandQty),
        signedQty: Number(product.onHandQty),
        source: StockSource.MANUAL_ADJUSTMENT,
        referenceType: 'SEED',
        referenceId: `OPEN-${product.reference}`,
        actorId: admin.id,
      })),
      skipDuplicates: true,
    });

    const auditData = [
      { actorId: admin.id, module: 'SEED', recordType: 'User', recordId: admin.id, action: AuditAction.CREATE, fieldName: 'loginId', newValue: 'admin01' },
      { actorId: salesUser.id, module: 'SEED', recordType: 'SalesOrder', recordId: salesOrders[0].id, action: AuditAction.CONFIRM, fieldName: 'status', oldValue: 'DRAFT', newValue: 'CONFIRMED' },
      { actorId: purchaseUser.id, module: 'SEED', recordType: 'PurchaseOrder', recordId: purchaseOrders[0].id, action: AuditAction.RECEIVE, fieldName: 'receivedQty', oldValue: '0', newValue: String(purchaseOrders[0].items[0].receivedQty) },
      { actorId: mfgUser.id, module: 'SEED', recordType: 'ManufacturingOrder', recordId: `MO-SEED-0001`, action: AuditAction.COMPLETE, fieldName: 'status', oldValue: 'IN_PROGRESS', newValue: 'COMPLETED' },
    ];

    for (let i = 0; i < 26; i++) {
      auditData.push({
        actorId: getItem([admin.id, salesUser.id, purchaseUser.id, mfgUser.id], i),
        module: 'SEED',
        recordType: 'Product',
        recordId: getItem(allProducts, i).id,
        action: AuditAction.UPDATE,
        fieldName: 'onHandQty',
        oldValue: '0',
        newValue: String(getItem(allProducts, i).onHandQty),
      });
    }

    await tx.auditLog.createMany({ data: auditData, skipDuplicates: true });

    await tx.notification.createMany({
      data: [
        { userId: admin.id, type: 'SEED_LOW_STOCK', message: 'Several products are below reorder point. Review inventory.', readAt: null },
        { userId: salesUser.id, type: 'SEED_ORDER_CONFIRMED', message: 'Seed sales orders are confirmed and reservations are active.', readAt: null },
        { userId: purchaseUser.id, type: 'SEED_PO_RECEIPT', message: 'Seed purchase receipts have been recorded.', readAt: null },
      ],
      skipDuplicates: true,
    });
  });

  console.log('Seeded a large demo dataset (300-500 records) into the cloud database.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
