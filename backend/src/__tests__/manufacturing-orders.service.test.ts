import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { app } from '../server.js';
import { prisma } from '../lib/prisma.js';

const api = request(app);

async function login(loginId: string, password = 'Admin@123') {
  const res = await api.post('/auth/login').send({ loginId, password });
  return res.body.data.accessToken as string;
}

test('Manufacturing Orders Service Suite', async (t) => {
  const adminToken = await login('admin01');
  const headers = { Authorization: `Bearer ${adminToken}` };

  const createProduct = async (opts: any = {}) => {
    const res = await api.post('/products').set(headers).send({
      name: `MfgTestProd-${Date.now()}-${Math.random()}`,
      salesPrice: 100, costPrice: 50, onHandQty: 0, reorderPoint: 0, procureOnDemand: false,
      ...opts
    });
    return res.body.data.id;
  };

  const adjustStock = async (productId: string, quantity: number) => {
    await api.post(`/products/${productId}/adjust-stock`).set(headers).send({ direction: 'IN', quantity, reason: 'test init' });
  };

  await t.test('1. BoM: missing components', async () => {
    const finId = await createProduct({ category: 'FINISHED_GOOD' });
    const res = await api.post('/bom').set(headers).send({
      finishedProductId: finId, referenceQty: 1, items: [], operations: [{ name: 'Assy', expectedMinutes: 10 }]
    });
    assert.equal(res.status, 400);
  });

  await t.test('2. BoM: invalid quantities', async () => {
    const finId = await createProduct({ category: 'FINISHED_GOOD' });
    const matId = await createProduct();
    const res = await api.post('/bom').set(headers).send({
      finishedProductId: finId, referenceQty: 1, items: [{ productId: matId, quantity: 0 }], operations: [{ name: 'Assy', expectedMinutes: 10 }]
    });
    assert.equal(res.status, 400);
  });

  await t.test('3. MO: invalid product', async () => {
    const res = await api.post('/manufacturing-orders').set(headers).send({
      finishedProductId: 'invalid-id', bomId: 'invalid-id', quantity: 10
    });
    assert.equal(res.status, 400);
  });

  await t.test('4. MO: missing BoM', async () => {
    const finId = await createProduct({ category: 'FINISHED_GOOD' });
    const res = await api.post('/manufacturing-orders').set(headers).send({
      finishedProductId: finId, bomId: '00000000-0000-0000-0000-000000000000', quantity: 10
    });
    assert.equal(res.status, 422); // bom not found returns 422 due to validation
  });

  await t.test('5. MO: confirm cancelled MO', async () => {
    const matId = await createProduct();
    const finId = await createProduct({ category: 'FINISHED_GOOD' });
    const bomRes = await api.post('/bom').set(headers).send({
      finishedProductId: finId, referenceQty: 1, items: [{ productId: matId, quantity: 2 }], operations: [{ name: 'Assy', expectedMinutes: 10 }]
    });
    const mo = await api.post('/manufacturing-orders').set(headers).send({
      finishedProductId: finId, bomId: bomRes.body.data.id, quantity: 5
    });
    await api.patch(`/manufacturing-orders/${mo.body.data.id}/cancel`).set(headers).expect(200);
    const confirm = await api.patch(`/manufacturing-orders/${mo.body.data.id}/confirm`).set(headers);
    assert.equal(confirm.status, 409);
  });

  await t.test('6. MO: start completed MO', async () => {
    const matId = await createProduct();
    const finId = await createProduct({ category: 'FINISHED_GOOD' });
    await adjustStock(matId, 100);
    const bomRes = await api.post('/bom').set(headers).send({
      finishedProductId: finId, referenceQty: 1, items: [{ productId: matId, quantity: 2 }], operations: [{ name: 'Assy', expectedMinutes: 10 }]
    });
    const mo = await api.post('/manufacturing-orders').set(headers).send({
      finishedProductId: finId, bomId: bomRes.body.data.id, quantity: 5
    });
    await api.patch(`/manufacturing-orders/${mo.body.data.id}/confirm`).set(headers).expect(200);
    await api.patch(`/manufacturing-orders/${mo.body.data.id}/start`).set(headers).expect(200);
    await api.patch(`/manufacturing-orders/${mo.body.data.id}/complete`).set(headers).expect(200);
    
    const start = await api.patch(`/manufacturing-orders/${mo.body.data.id}/start`).set(headers);
    assert.equal(start.status, 409);
  });

  await t.test('7. MO: complete before start', async () => {
    const matId = await createProduct();
    const finId = await createProduct({ category: 'FINISHED_GOOD' });
    await adjustStock(matId, 100);
    const bomRes = await api.post('/bom').set(headers).send({
      finishedProductId: finId, referenceQty: 1, items: [{ productId: matId, quantity: 2 }], operations: [{ name: 'Assy', expectedMinutes: 10 }]
    });
    const mo = await api.post('/manufacturing-orders').set(headers).send({
      finishedProductId: finId, bomId: bomRes.body.data.id, quantity: 5
    });
    await api.patch(`/manufacturing-orders/${mo.body.data.id}/confirm`).set(headers).expect(200);
    
    const comp = await api.patch(`/manufacturing-orders/${mo.body.data.id}/complete`).set(headers);
    assert.equal(comp.status, 409);
  });

  await t.test('8. Completion: Example with 3 components, and rollback failure case', async () => {
    const legsId = await createProduct();
    const topId = await createProduct();
    const screwsId = await createProduct();
    const tableId = await createProduct({ category: 'FINISHED_GOOD' });

    // Table qty = 10. Consume: Legs (40), Top (10), Screws (120)
    const bomRes = await api.post('/bom').set(headers).send({
      finishedProductId: tableId, referenceQty: 1, 
      items: [
        { productId: legsId, quantity: 4 },
        { productId: topId, quantity: 1 },
        { productId: screwsId, quantity: 12 }
      ], 
      operations: [{ name: 'Assy', expectedMinutes: 10 }]
    });

    await adjustStock(legsId, 40);
    await adjustStock(topId, 10);
    await adjustStock(screwsId, 100); // Need 120, only have 100!

    const mo = await api.post('/manufacturing-orders').set(headers).send({
      finishedProductId: tableId, bomId: bomRes.body.data.id, quantity: 10
    });
    await api.patch(`/manufacturing-orders/${mo.body.data.id}/confirm`).set(headers).expect(200);
    await api.patch(`/manufacturing-orders/${mo.body.data.id}/start`).set(headers).expect(200);
    
    // Get MO items to execute
    const moDetail = await api.get(`/manufacturing-orders/${mo.body.data.id}`).set(headers);
    const legsItem = moDetail.body.data.items.find((i: any) => i.productId === legsId);
    const topItem = moDetail.body.data.items.find((i: any) => i.productId === topId);
    const screwsItem = moDetail.body.data.items.find((i: any) => i.productId === screwsId);

    // Set consumed quantities
    await api.patch(`/manufacturing-orders/${mo.body.data.id}/execution`).set(headers).send({
      components: [
        { itemId: legsItem.id, consumedQty: 40 },
        { itemId: topItem.id, consumedQty: 10 },
        { itemId: screwsItem.id, consumedQty: 120 }
      ]
    }).expect(200);

    const comp = await api.patch(`/manufacturing-orders/${mo.body.data.id}/complete`).set(headers);
    assert.equal(comp.status, 422); // Insufficient stock for Screws (100 < 120)

    // Verify rollback: legs should still be 40, top 10, screws 100, tables 0
    const legsProd = await api.get(`/products/${legsId}`).set(headers);
    assert.equal(Number(legsProd.body.data.onHandQty), 40);
    
    const tablesProd = await api.get(`/products/${tableId}`).set(headers);
    assert.equal(Number(tablesProd.body.data.onHandQty), 0);
  });
});
