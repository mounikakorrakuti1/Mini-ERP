import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { app } from '../server.js';
import { prisma } from '../lib/prisma.js';
import { procurementService } from '../services/procurement.service.js';

const api = request(app);

async function login(loginId: string, password = 'Admin@123') {
  const res = await api.post('/auth/login').send({ loginId, password });
  return res.body.data.accessToken as string;
}

test('Edge Cases & Procurement Suite', async (t) => {
  const adminToken = await login('admin01');
  const headers = { Authorization: `Bearer ${adminToken}` };

  const vendorsRes = await api.get('/vendors').set(headers);
  const vendorId = vendorsRes.body.data[0]?.id;

  const createProduct = async (opts: any = {}) => {
    const res = await api.post('/products').set(headers).send({
      name: `EdgeTestProd-${Date.now()}-${Math.random()}`,
      salesPrice: 100, costPrice: 50, onHandQty: 0, reorderPoint: 0, procureOnDemand: false,
      ...opts
    });
    return res.body.data.id;
  };

  await t.test('1. Database Edge Case: duplicate unique fields (name)', async () => {
    const name = `DupName-${Date.now()}`;
    await api.post('/products').set(headers).send({
      name, salesPrice: 100, costPrice: 50
    }).expect(201);
    
    const dup = await api.post('/products').set(headers).send({
      name, salesPrice: 100, costPrice: 50
    });
    assert.equal(dup.status, 400); // the error handler catches unique constraint
  });

  await t.test('2. Database Edge Case: malformed UUIDs', async () => {
    const res = await api.get('/products/not-a-uuid').set(headers);
    assert.equal(res.status, 400); // validation error on params
  });

  await t.test('3. Database Edge Case: delete product in use', async () => {
    const productId = await createProduct();
    // Use it in an inventory adjustment
    await api.post(`/products/${productId}/adjust-stock`).set(headers).send({ direction: 'IN', quantity: 10, reason: 'init' });
    
    // There is no DELETE endpoint in this API, so we try via raw Prisma
    try {
      await prisma.product.delete({ where: { id: productId } });
      assert.fail('Should not be able to delete product in use');
    } catch (e: any) {
      assert.ok(e.message.includes('Foreign key constraint failed') || e.code === 'P2003');
    }
  });

  await t.test('4. Procurement Recommendation: purchase route calculation', async () => {
    const productId = await createProduct({ 
      procureOnDemand: true, procurementType: 'PURCHASE', defaultVendorId: vendorId 
    });
    const result = await procurementService.recommend(productId, 15);
    
    assert.equal(result.purchase?.route, 'PURCHASE');
    assert.equal(result.purchase?.cost, 15 * 50); // 15 qty * 50 costPrice
    assert.equal(result.manufacture, null);
  });

  await t.test('4b. Procurement Recommendation: manufacturing route calculation', async () => {
    const matId = await createProduct({ costPrice: 10 });
    const finId = await createProduct({ category: 'FINISHED_GOOD', procureOnDemand: false });
    const bomRes = await api.post('/bom').set(headers).send({
      finishedProductId: finId, referenceQty: 1, 
      items: [{ productId: matId, quantity: 2 }], 
      operations: [{ name: 'Assy', expectedMinutes: 60 }]
    });
    // Set manufacturing procurement config manually to bypass controller validations for setup
    await prisma.product.update({
      where: { id: finId },
      data: { procureOnDemand: true, procurementType: 'MANUFACTURING', defaultBomId: bomRes.body.data.id }
    });

    const result = await procurementService.recommend(finId, 10);
    assert.equal(result.manufacture?.route, 'MANUFACTURING');
    // 10 units * 2 parts/unit * 10 cost = 200
    assert.equal(result.manufacture?.cost, 200);
    assert.equal(result.manufacture?.totalComponents, 1);
  });

  await t.test('5. Procurement Recommendation: missing vendor handles gracefully', async () => {
    const productId = await createProduct({ 
      procureOnDemand: false 
    });
    const result = await procurementService.recommend(productId, 10);
    assert.equal(result.purchase, null);
  });
});
