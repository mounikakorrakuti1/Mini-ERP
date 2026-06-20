import { PrismaClient } from '@prisma/client';
import * as brain from 'brain.js';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting ML Demand Model Training...');
  
  // 1. Fetch all OUT stock movements
  console.log('📦 Fetching historical stock movements...');
  const movements = await prisma.stockMovement.findMany({
    where: { direction: 'OUT' },
    orderBy: { createdAt: 'asc' },
    select: { productId: true, quantity: true, createdAt: true }
  });

  if (movements.length === 0) {
    console.log('❌ No historical data found to train the model.');
    process.exit(0);
  }

  // 2. Group by productId and Date (YYYY-MM-DD)
  console.log('📊 Processing time-series data...');
  const productDailyDemand: Record<string, Record<string, number>> = {};
  
  for (const mov of movements) {
    const dateKey = mov.createdAt.toISOString().split('T')[0];
    if (!productDailyDemand[mov.productId]) productDailyDemand[mov.productId] = {};
    if (!productDailyDemand[mov.productId][dateKey]) productDailyDemand[mov.productId][dateKey] = 0;
    productDailyDemand[mov.productId][dateKey] += Number(mov.quantity);
  }

  // 3. Find MAX_DEMAND for normalization (brain.js requires inputs between 0 and 1)
  let maxDemand = 1;
  for (const pid in productDailyDemand) {
    for (const date in productDailyDemand[pid]) {
      if (productDailyDemand[pid][date] > maxDemand) {
        maxDemand = productDailyDemand[pid][date];
      }
    }
  }
  // Add a small buffer to max demand to prevent clipping future spikes
  maxDemand = Math.ceil(maxDemand * 1.2);

  // 4. Create sliding window training dataset
  const WINDOW_SIZE = 5;
  const trainingData: { input: number[], output: number[] }[] = [];

  for (const pid in productDailyDemand) {
    const dates = Object.keys(productDailyDemand[pid]).sort();
    const demands = dates.map(d => productDailyDemand[pid][d]);

    // We need at least WINDOW_SIZE + 1 days of data to make a training pair
    for (let i = 0; i <= demands.length - WINDOW_SIZE - 1; i++) {
      const window = demands.slice(i, i + WINDOW_SIZE);
      const nextDay = demands[i + WINDOW_SIZE];

      trainingData.push({
        input: window.map(val => val / maxDemand),
        output: [nextDay / maxDemand]
      });
    }
  }

  if (trainingData.length === 0) {
    console.log('⚠️ Not enough sequential data to train sliding window model (need > 5 days per product). Fallback to dummy data to verify pipeline.');
    // Insert dummy training data so the engine doesn't crash on empty dataset
    for (let i = 0; i < 100; i++) {
        trainingData.push({ input: [0.1, 0.1, 0.1, 0.1, 0.1], output: [0.1] });
        trainingData.push({ input: [0.5, 0.6, 0.5, 0.6, 0.5], output: [0.6] });
        trainingData.push({ input: [0.9, 0.8, 0.9, 0.8, 0.9], output: [0.8] });
    }
  } else {
    console.log(`✅ Generated ${trainingData.length} training sequences.`);
  }

  // 5. Train the FeedForward Neural Network
  console.log('🧠 Initializing Neural Network...');
  const net = new brain.NeuralNetwork({
    hiddenLayers: [10, 10],
    activation: 'sigmoid'
  });

  console.log('⚙️ Training model (this may take a few minutes)...');
  net.train(trainingData, {
    iterations: 2000,
    errorThresh: 0.005,
    log: (stats) => console.log(`[Epoch Update] ${stats}`),
    logPeriod: 100,
    learningRate: 0.01
  });

  // 6. Save the model
  const modelOutput = {
    metadata: {
      maxDemand,
      windowSize: WINDOW_SIZE,
      trainedAt: new Date().toISOString(),
      trainingSamples: trainingData.length
    },
    network: net.toJSON()
  };

  const savePath = path.resolve(process.cwd(), 'demand-model.json');
  fs.writeFileSync(savePath, JSON.stringify(modelOutput, null, 2));

  console.log(`\n🎉 Model successfully trained and saved to: ${savePath}`);
  console.log(`Max Demand Normalization Factor: ${maxDemand}`);
  
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
