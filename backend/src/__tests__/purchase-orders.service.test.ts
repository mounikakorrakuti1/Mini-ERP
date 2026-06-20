import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { app } from '../server.js';

const api = request(app);

async function login(loginId: string, password = 'Admin@123') {
  const res = await api.post('/auth/login').send({ loginId, password });
  return res.body.data.accessToken as string;
}

test('Purchase Orders Service Suite', async (t) => {
  const adminToken = await login('admin01');
  const headers = { Authorization: `Bearer ${adminToken}` };

  const vendorsRes = await api.get('/vendors').set(headers);
  const vendorId = vendorsRes.body.data[0]?.id;

  const createProduct = async (opts: any = {}) => {
    const res = await api.post('/products').set(headers).send({
      name: `POTestProd-${Date.now()}-${Math.random()}`,
      salesPrice: 100, costPrice: 50, onHandQty: 0, reorderPoint: 0, procureOnDemand: false,
      ...opts
    });
    return res.body.data.id;
  };

  await t.test('1. Creation: invalid vendor', async () => {
    const res = await api.post('/purchase-orders').set(headers).send({
      vendorId: 'invalid-id', items: [{ productId: await createProduct(), orderedQty: 5, costPrice: 50 }]
    });
    assert.equal(res.status, 400);
  });

  await t.test('2. Creation: empty items', async () => {
    const res = await api.post('/purchase-orders').set(headers).send({
      vendorId, items: []
    });
    assert.equal(res.status, 400);
  });

  await t.test('3. Creation: invalid product', async () => {
    const res = await api.post('/purchase-orders').set(headers).send({
      vendorId, items: [{ productId: 'invalid-id', orderedQty: 5, costPrice: 50 }]
    });
    assert.equal(res.status, 400);
  });

  await t.test('4. Lifecycle: receive before confirm', async () => {
    const productId = await createProduct();
    const po = await api.post('/purchase-orders').set(headers).send({
      vendorId, items: [{ productId, orderedQty: 10, costPrice: 50 }]
    });
    const detail = await api.get(`/purchase-orders/${po.body.data.id}`).set(headers);
    const itemId = detail.body.data.items[0].id;
    
    const rec = await api.patch(`/purchase-orders/${po.body.data.id}/receive`).set(headers)
      .send({ items: [{ itemId, receivedQty: 5 }] });
    assert.equal(rec.status, 422); // Must be confirmed
  });

  await t.test('5. Lifecycle: receive cancelled PO', async () => {
    const productId = await createProduct();
    const po = await api.post('/purchase-orders').set(headers).send({
      vendorId, items: [{ productId, orderedQty: 10, costPrice: 50 }]
    });
    await api.patch(`/purchase-orders/${po.body.data.id}/cancel`).set(headers).expect(200);
    
    const detail = await api.get(`/purchase-orders/${po.body.data.id}`).set(headers);
    const itemId = detail.body.data.items[0].id;

    const rec = await api.patch(`/purchase-orders/${po.body.data.id}/receive`).set(headers)
      .send({ items: [{ itemId, receivedQty: 5 }] });
    assert.equal(rec.status, 422);
  });

  await t.test('6. Lifecycle: receive > remaining quantity', async () => {
    const productId = await createProduct();
    const po = await api.post('/purchase-orders').set(headers).send({
      vendorId, items: [{ productId, orderedQty: 10, costPrice: 50 }]
    });
    await api.patch(`/purchase-orders/${po.body.data.id}/confirm`).set(headers).expect(200);

    const detail = await api.get(`/purchase-orders/${po.body.data.id}`).set(headers);
    const itemId = detail.body.data.items[0].id;

    const rec = await api.patch(`/purchase-orders/${po.body.data.id}/receive`).set(headers)
      .send({ items: [{ itemId, receivedQty: 15 }] });
    assert.equal(rec.status, 422);
  });

  await t.test('7. Lifecycle: duplicate receive request', async () => {
    const productId = await createProduct();
    const po = await api.post('/purchase-orders').set(headers).send({
      vendorId, items: [{ productId, orderedQty: 10, costPrice: 50 }]
    });
    await api.patch(`/purchase-orders/${po.body.data.id}/confirm`).set(headers).expect(200);

    const detail = await api.get(`/purchase-orders/${po.body.data.id}`).set(headers);
    const itemId = detail.body.data.items[0].id;

    await api.patch(`/purchase-orders/${po.body.data.id}/receive`).set(headers)
      .send({ items: [{ itemId, receivedQty: 10 }] }).expect(200);

    const dup = await api.patch(`/purchase-orders/${po.body.data.id}/receive`).set(headers)
      .send({ items: [{ itemId, receivedQty: 1 }] });
    assert.equal(dup.status, 422); // already fully received
  });
});
