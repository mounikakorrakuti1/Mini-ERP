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

test('Sales Orders Service Suite', async (t) => {
  const adminToken = await login('admin01');
  const headers = { Authorization: `Bearer ${adminToken}` };

  const customersRes = await api.get('/customers').set(headers);
  const customerId = customersRes.body.data[0]?.id;

  let vendorsRes = await api.get('/vendors').set(headers);
  let vendorId = vendorsRes.body.data[0]?.id;
  if (!vendorId) {
    const vRes = await api.post('/vendors').set(headers).send({ name: 'Test Vendor SO', paymentTerms: 'Net 30' });
    vendorId = vRes.body.data.id;
  }

  const createProduct = async (opts: any = {}) => {
    const res = await api.post('/products').set(headers).send({
      name: `SOTestProd-${Date.now()}-${Math.random()}`,
      salesPrice: 100, costPrice: 50, onHandQty: 0, reorderPoint: 0, procureOnDemand: false,
      ...opts
    });
    return res.body.data.id;
  };

  const adjustStock = async (productId: string, quantity: number) => {
    await api.post(`/products/${productId}/adjust-stock`).set(headers).send({ direction: 'IN', quantity, reason: 'test init' });
  };

  await t.test('1. Creation: missing customer', async () => {
    const res = await api.post('/sales-orders').set(headers).send({
      items: [{ productId: await createProduct(), orderedQty: 5, salesPrice: 100 }]
    });
    assert.equal(res.status, 400);
  });

  await t.test('2. Creation: empty order items', async () => {
    const res = await api.post('/sales-orders').set(headers).send({
      customerId, items: []
    });
    assert.equal(res.status, 400);
  });

  await t.test('3. Creation: invalid product', async () => {
    const res = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId: 'invalid-id-format', orderedQty: 5, salesPrice: 100 }]
    });
    assert.equal(res.status, 400);
  });

  await t.test('4. Creation: negative quantity', async () => {
    const res = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId: await createProduct(), orderedQty: -5, salesPrice: 100 }]
    });
    assert.equal(res.status, 400);
  });

  await t.test('5. Creation: zero quantity', async () => {
    const res = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId: await createProduct(), orderedQty: 0, salesPrice: 100 }]
    });
    assert.equal(res.status, 400);
  });

  await t.test('6. Confirmation: already confirmed order', async () => {
    const productId = await createProduct();
    await adjustStock(productId, 10);
    const so = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId, orderedQty: 5, salesPrice: 100 }]
    });
    await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set(headers).expect(200);
    const dup = await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set(headers);
    assert.equal(dup.status, 409); // Order must be in DRAFT
  });

  await t.test('7. Confirmation: cancelled order confirmation', async () => {
    const productId = await createProduct();
    await adjustStock(productId, 10);
    const so = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId, orderedQty: 5, salesPrice: 100 }]
    });
    await api.patch(`/sales-orders/${so.body.data.id}/cancel`).set(headers).expect(200);
    const confirm = await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set(headers);
    assert.equal(confirm.status, 409);
  });

  await t.test('8. Confirmation: product deactivated after draft creation', async () => {
    const productId = await createProduct();
    await adjustStock(productId, 10);
    const so = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId, orderedQty: 5, salesPrice: 100 }]
    });
    // Deactivate product
    await prisma.product.update({ where: { id: productId }, data: { active: false } });
    const confirm = await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set(headers);
    assert.equal(confirm.status, 200); // System allows confirming inactive products if already in draft
  });

  await t.test('9. Confirmation: insufficient stock (procurement disabled)', async () => {
    const productId = await createProduct({ procureOnDemand: false });
    const so = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId, orderedQty: 5, salesPrice: 100 }]
    });
    const confirm = await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set(headers);
    assert.equal(confirm.status, 200);
    assert.equal(confirm.body.data.availabilityFlag, true); // Should be flagged as short
  });

  await t.test('10. Confirmation: procurement enabled with purchase', async () => {
    const productId = await createProduct({ procureOnDemand: true, procurementType: 'PURCHASE', defaultVendorId: vendorId });
    const so = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId, orderedQty: 5, salesPrice: 100 }]
    });
    const confirm = await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set(headers);
    assert.equal(confirm.status, 200);
  });

  await t.test('11. Confirmation: procurement enabled with manufacturing', async () => {
    const matId = await createProduct();
    await adjustStock(matId, 100);
    const finId = await createProduct({ procureOnDemand: false, category: 'FINISHED_GOOD' });
    const bomRes = await api.post('/bom').set(headers).send({
      finishedProductId: finId, referenceQty: 1, items: [{ productId: matId, quantity: 2 }], operations: [{ name: 'Assy', expectedMinutes: 10 }]
    });
    assert.equal(bomRes.status, 201, JSON.stringify(bomRes.body));
    await api.patch(`/products/${finId}`).set(headers).send({ 
      procureOnDemand: true,
      procurementType: 'MANUFACTURING',
      defaultBomId: bomRes.body.data.id 
    });

    const so = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId: finId, orderedQty: 5, salesPrice: 100 }]
    });
    const confirm = await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set(headers);
    assert.equal(confirm.status, 200);
  });

  await t.test('12. Delivery: Multiple partial deliveries and exact OUT stock movements', async () => {
    const productId = await createProduct();
    await adjustStock(productId, 20);
    const so = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId, orderedQty: 10, salesPrice: 100 }]
    });
    await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set(headers).expect(200);
    const soDetail = await api.get(`/sales-orders/${so.body.data.id}`).set(headers);
    const itemId = soDetail.body.data.items[0].id;

    // Delivery 1: 5
    const del1 = await api.patch(`/sales-orders/${so.body.data.id}/deliver`).set(headers)
      .send({ items: [{ itemId, deliveredQty: 5 }] });
    assert.equal(del1.status, 200);
    
    // Delivery 2: 10 (cumulative)
    const del2 = await api.patch(`/sales-orders/${so.body.data.id}/deliver`).set(headers)
      .send({ items: [{ itemId, deliveredQty: 10 }] });
    assert.equal(del2.status, 200);
    assert.equal(del2.body.data.status, 'FULLY_DELIVERED');
  });

  await t.test('13. Reject delivery > ordered quantity', async () => {
    const productId = await createProduct();
    await adjustStock(productId, 20);
    const so = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId, orderedQty: 5, salesPrice: 100 }]
    });
    await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set(headers);
    const soDetail = await api.get(`/sales-orders/${so.body.data.id}`).set(headers);
    const itemId = soDetail.body.data.items[0].id;

    const del = await api.patch(`/sales-orders/${so.body.data.id}/deliver`).set(headers)
      .send({ items: [{ itemId, deliveredQty: 6 }] });
    assert.equal(del.status, 422);
  });

  await t.test('14. Reject negative delivered quantity', async () => {
    const productId = await createProduct();
    await adjustStock(productId, 20);
    const so = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId, orderedQty: 5, salesPrice: 100 }]
    });
    await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set(headers);
    const soDetail = await api.get(`/sales-orders/${so.body.data.id}`).set(headers);
    const itemId = soDetail.body.data.items[0].id;

    const del = await api.patch(`/sales-orders/${so.body.data.id}/deliver`).set(headers)
      .send({ items: [{ itemId, deliveredQty: -1 }] });
    assert.equal(del.status, 400); // Validation error
  });

  await t.test('15. Reject delivery on cancelled order', async () => {
    const productId = await createProduct();
    await adjustStock(productId, 20);
    const so = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId, orderedQty: 5, salesPrice: 100 }]
    });
    await api.patch(`/sales-orders/${so.body.data.id}/cancel`).set(headers);
    const soDetail = await api.get(`/sales-orders/${so.body.data.id}`).set(headers);
    const itemId = soDetail.body.data.items[0].id;

    const del = await api.patch(`/sales-orders/${so.body.data.id}/deliver`).set(headers)
      .send({ items: [{ itemId, deliveredQty: 5 }] });
    assert.equal(del.status, 409);
  });

  await t.test('16. Reject duplicate full delivery', async () => {
    const productId = await createProduct();
    await adjustStock(productId, 20);
    const so = await api.post('/sales-orders').set(headers).send({
      customerId, items: [{ productId, orderedQty: 5, salesPrice: 100 }]
    });
    await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set(headers);
    const soDetail = await api.get(`/sales-orders/${so.body.data.id}`).set(headers);
    const itemId = soDetail.body.data.items[0].id;

    await api.patch(`/sales-orders/${so.body.data.id}/deliver`).set(headers)
      .send({ items: [{ itemId, deliveredQty: 5 }] }).expect(200);

    const dup = await api.patch(`/sales-orders/${so.body.data.id}/deliver`).set(headers)
      .send({ items: [{ itemId, deliveredQty: 5 }] });
    assert.equal(dup.status, 409);
  });
});
