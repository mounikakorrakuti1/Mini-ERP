import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const bom = await prisma.bom.findFirst({ include: { items: true, operations: true } });
    if (!bom) {
      console.log('No BOM found');
      return;
    }
    console.log('Testing update on BOM', bom.id);
    
    // Simulate what the server does
    const q = {
      params: { id: bom.id },
      body: {
        finishedProductId: bom.finishedProductId,
        referenceQty: 2,
        items: bom.items.map(i => ({ productId: i.productId, quantity: 5 })),
        operations: bom.operations.map(o => ({ name: 'Test Op', expectedMinutes: 20 }))
      }
    };
    
    // update
    const updated = await prisma.bom.update({
      where: { id: q.params.id },
      data: {
        finishedProductId: q.body.finishedProductId,
        referenceQty: q.body.referenceQty,
        ...(q.body.items
          ? { items: { deleteMany: {}, create: q.body.items } }
          : {}),
        ...(q.body.operations
          ? { operations: { deleteMany: {}, create: q.body.operations } }
          : {}),
      },
    });
    console.log('Updated successfully', updated);
  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
