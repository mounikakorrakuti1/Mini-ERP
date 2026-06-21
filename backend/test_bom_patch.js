const jwt = require('jsonwebtoken');
const http = require('http');

const secret = 'development-secret-must-be-replaced-12345';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user');
    return;
  }
  
  const token = jwt.sign({ sub: user.id }, secret, { expiresIn: '1h' });
  
  const bom = await prisma.bom.findFirst({ include: { items: true, operations: true } });
  if (!bom) {
    console.log('No BOM found');
    return;
  }
  
  const patchData = JSON.stringify({
    finishedProductId: bom.finishedProductId,
    referenceQty: 5,
    items: bom.items.map(i => ({ productId: i.productId, quantity: 10 })),
    operations: bom.operations.map(o => ({ name: o.name, expectedMinutes: 30 }))
  });
  
  const patchReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: `/bom/${bom.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(patchData),
      'Authorization': `Bearer ${token}`
    }
  }, (resPatch) => {
    let patchBody = '';
    resPatch.on('data', d => patchBody += d);
    resPatch.on('end', () => {
      console.log('PATCH Response Status:', resPatch.statusCode);
      console.log('PATCH Response:', patchBody);
    });
  });
  patchReq.write(patchData);
  patchReq.end();
}
run();
