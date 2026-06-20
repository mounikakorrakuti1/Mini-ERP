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

test('Inventory Service Suite', async (t) => {
  const adminToken = await login('admin01');
  const headers = { Authorization: `Bearer ${adminToken}` };

  const createProduct = async (opts: any = {}) => {
    const res = await api.post('/products').set(headers).send({
      name: `InvTestProd-${Date.now()}-${Math.random()}`,
      salesPrice: 100, costPrice: 50, onHandQty: 0, reorderPoint: 0, procureOnDemand: false,
      ...opts
    });
    return res.body.data.id;
  };

  await t.test('1. Adjustments: manual IN adjustment', async () => {
    const productId = await createProduct();
    const res = await api.post(`/products/${productId}/adjust-stock`).set(headers)
      .send({ direction: 'IN', quantity: 50, reason: 'Test IN' });
    assert.equal(res.status, 200);

    const prod = await api.get(`/products/${productId}`).set(headers);
    assert.equal(Number(prod.body.data.onHandQty), 50);
  });

  await t.test('2. Adjustments: manual OUT adjustment', async () => {
    const productId = await createProduct();
    await api.post(`/products/${productId}/adjust-stock`).set(headers)
      .send({ direction: 'IN', quantity: 50, reason: 'Test IN' });

    const res = await api.post(`/products/${productId}/adjust-stock`).set(headers)
      .send({ direction: 'OUT', quantity: 20, reason: 'Test OUT' });
    assert.equal(res.status, 200);

    const prod = await api.get(`/products/${productId}`).set(headers);
    assert.equal(Number(prod.body.data.onHandQty), 30);
  });

  await t.test('3. Reject negative adjustment quantity', async () => {
    const productId = await createProduct();
    const res = await api.post(`/products/${productId}/adjust-stock`).set(headers)
      .send({ direction: 'IN', quantity: -10, reason: 'Test Neg IN' });
    assert.equal(res.status, 400); // Validation error
  });

  await t.test('4. Reject insufficient stock during OUT adjustment', async () => {
    const productId = await createProduct();
    await api.post(`/products/${productId}/adjust-stock`).set(headers)
      .send({ direction: 'IN', quantity: 10, reason: 'Test IN' });

    const res = await api.post(`/products/${productId}/adjust-stock`).set(headers)
      .send({ direction: 'OUT', quantity: 20, reason: 'Test Neg OUT' });
    assert.equal(res.status, 422); // Insufficient stock
  });

  await t.test('5. Verify invariant: On Hand Quantity = SUM(stock_movements)', async () => {
    const productId = await createProduct();
    await api.post(`/products/${productId}/adjust-stock`).set(headers)
      .send({ direction: 'IN', quantity: 100, reason: 'init' });
    await api.post(`/products/${productId}/adjust-stock`).set(headers)
      .send({ direction: 'OUT', quantity: 30, reason: 'out' });
    await api.post(`/products/${productId}/adjust-stock`).set(headers)
      .send({ direction: 'IN', quantity: 15, reason: 'in' });

    const prod = await api.get(`/products/${productId}`).set(headers);
    const onHand = Number(prod.body.data.onHandQty);

    const moves = await prisma.stockMovement.findMany({ where: { productId } });
    const sum = moves.reduce((acc, m) => acc + (m.direction === 'IN' ? Number(m.quantity) : -Number(m.quantity)), 0);

    assert.equal(onHand, sum);
    assert.equal(onHand, 85);
  });
});
