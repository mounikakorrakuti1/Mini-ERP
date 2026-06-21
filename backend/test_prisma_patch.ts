import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const bom = await prisma.bom.findFirst({ include: { items: true, operations: true } });
  if (!bom) {
    console.log('No BOM found');
    return;
  }
  
  console.log('BOM:', bom.id);
  const updated = await prisma.bom.update({
    where: { id: bom.id },
    data: {
      items: { deleteMany: {}, create: bom.items.map(i => ({ productId: i.productId, quantity: 5 })) }
    }
  });
  console.log('Updated BOM items count:', await prisma.bomItem.count({ where: { bomId: bom.id } }));
}
run();
