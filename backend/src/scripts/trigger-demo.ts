import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎭 Setting up Hackathon Demo Scenario...');

  // 1. Pick 5 random active products
  const products = await prisma.product.findMany({
    where: { active: true },
    take: 5
  });

  if (products.length === 0) {
    console.log('❌ No active products found.');
    process.exit(1);
  }

  console.log(`📉 Deliberately draining inventory for 5 products to trigger the AI Engine...`);

  for (const product of products) {
    // 1. Force current stock to 0 to trigger immediate Low Stock & Stockout Alerts
    await prisma.product.update({
      where: { id: product.id },
      data: { onHandQty: 0 }
    });

    // 2. Insert a massive recent OUT movement to train the ML model that demand is spiking
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        direction: 'OUT',
        source: 'MANUAL_ADJUSTMENT',
        quantity: 500, // Massive demand spike!
        signedQty: -500,
        referenceType: 'MANUAL',
        referenceId: 'DEMO-' + Date.now()
      }
    });

    console.log(`   ✅ Drained Product: ${product.name} (SKU: ${product.sku}) - Set Qty to 0 and spiked demand.`);
  }

  console.log('\n🎉 Demo Scenario Ready!');
  console.log('👉 Now go to the UI, refresh, and click "✨ Analyze & Generate" again!');
  console.log('The AI will see the 0 stock and the massive demand spike, and instantly generate Critical Recommendations!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
