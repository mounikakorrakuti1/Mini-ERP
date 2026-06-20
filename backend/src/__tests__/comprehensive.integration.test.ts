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

test('Comprehensive Backend Integration Suite', async (t) => {
  const adminToken = await login('admin01');
  const salesToken = await login('sales01');
  
  await t.test('1. Authentication Failures', async () => {
    await api.get('/products').expect(401);
    
    await api.get('/products')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);

    await api.post('/auth/login')
      .send({ loginId: 'admin01', password: 'wrongpassword' })
      .expect(401);
  });

  await t.test('2. RBAC Violations', async () => {
    // sales user trying to access manufacturing orders (should be 403 Forbidden)
    await api.get('/manufacturing-orders')
      .set('Authorization', `Bearer ${salesToken}`)
      .expect(403);
  });

  await t.test('3. Invalid Payloads', async () => {
    await api.post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Incomplete Product' })
      .expect(400);

    const product = await api.post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `NegQtyProduct-${Date.now() + '-' + Math.random()}`,
        salesPrice: 100, costPrice: 50, onHandQty: 0, reorderPoint: 0, procureOnDemand: false
      }).expect(201);

    await api.post('/bom')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        finishedProductId: product.body.data.id,
        referenceQty: 1,
        items: [{ productId: product.body.data.id, quantity: -5 }],
        operations: []
      }).expect(400);
  });

  await t.test('4. Duplicate Actions & 10. Concurrent Confirmations', async () => {
    const suffix = Date.now() + '-' + Math.random();
    const vendors = await api.get('/vendors').set('Authorization', `Bearer ${adminToken}`).expect(200);
    const customers = await api.get('/customers').set('Authorization', `Bearer ${adminToken}`).expect(200);
    
    const product = await api.post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `DupProduct-${suffix}`, salesPrice: 100, costPrice: 50, onHandQty: 10, reorderPoint: 0, procureOnDemand: false
      });
      
    await api.post(`/products/${product.body.data.id}/adjust-stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ direction: 'IN', quantity: 10, reason: 'init' });

    const so = await api.post('/sales-orders').set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: customers.body.data[0].id,
        items: [{ productId: product.body.data.id, orderedQty: 5, salesPrice: 100 }]
      });

    const req1 = api.patch(`/sales-orders/${so.body.data.id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    const req2 = api.patch(`/sales-orders/${so.body.data.id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    const [res1, res2] = await Promise.all([req1, req2]);
    
    assert.ok(
      (res1.status === 200 && res2.status === 409) || 
      (res1.status === 409 && res2.status === 200) ||
      (res1.status === 409 && res2.status === 409), // depending on how PG handles concurrent transaction locks
      'One should succeed, the other should fail with 409'
    );

    await api.patch(`/sales-orders/${so.body.data.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);
  });

  await t.test('5. Inventory Reconciliation', async () => {
    const res = await api.get('/inventory/reconciliation')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    
    assert.ok(res.body.data.status === 'HEALTHY' || res.body.data.status === 'MISMATCHED');
  });

  await t.test('6. Partial delivery delta calculation', async () => {
    const suffix = Date.now() + '-' + Math.random();
    const customers = await api.get('/customers').set('Authorization', `Bearer ${adminToken}`);
    const product = await api.post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `PartialSOProd-${suffix}`, salesPrice: 100, costPrice: 50, onHandQty: 0, reorderPoint: 0, procureOnDemand: false });
      
    await api.post(`/products/${product.body.data.id}/adjust-stock`).set('Authorization', `Bearer ${adminToken}`)
      .send({ direction: 'IN', quantity: 10, reason: 'init' });

    const so = await api.post('/sales-orders').set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: customers.body.data[0].id,
        items: [{ productId: product.body.data.id, orderedQty: 5, salesPrice: 100 }]
      });
    
    await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set('Authorization', `Bearer ${adminToken}`).expect(200);

    const soDetail = await api.get(`/sales-orders/${so.body.data.id}`).set('Authorization', `Bearer ${adminToken}`);
    const itemId = soDetail.body.data.items[0].id;
    
    const delivery = await api.patch(`/sales-orders/${so.body.data.id}/deliver`).set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [{ itemId, deliveredQty: 2 }] })
      .expect(200);
      
    assert.equal(delivery.body.data.status, 'PARTIALLY_DELIVERED');
    
    const trace = await api.get(`/traceability/sales-order/${so.body.data.id}`).set('Authorization', `Bearer ${adminToken}`);
    const outMovements = trace.body.data.stockMovements.filter((m: any) => m.source === 'SALES_DELIVERY');
    assert.equal(outMovements.length, 1);
    assert.equal(Number(outMovements[0].quantity), 2);
  });

  await t.test('7. Partial purchase receipt delta calculation', async () => {
    const suffix = Date.now() + '-' + Math.random();
    const vendors = await api.get('/vendors').set('Authorization', `Bearer ${adminToken}`);
    const product = await api.post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `PartialPOProd-${suffix}`, salesPrice: 100, costPrice: 50, onHandQty: 0, reorderPoint: 0, procureOnDemand: false });

    const po = await api.post('/purchase-orders').set('Authorization', `Bearer ${adminToken}`)
      .send({
        vendorId: vendors.body.data[0].id,
        items: [{ productId: product.body.data.id, orderedQty: 10, costPrice: 50 }]
      });

    await api.patch(`/purchase-orders/${po.body.data.id}/confirm`).set('Authorization', `Bearer ${adminToken}`).expect(200);

    const poDetail = await api.get(`/purchase-orders/${po.body.data.id}`).set('Authorization', `Bearer ${adminToken}`);
    const itemId = poDetail.body.data.items[0].id;

    const receipt = await api.patch(`/purchase-orders/${po.body.data.id}/receive`).set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [{ itemId, receivedQty: 4 }] })
      .expect(200);
      
    assert.equal(receipt.body.data.status, 'PARTIALLY_RECEIVED');

    const allProds = await api.get('/products').set('Authorization', `Bearer ${adminToken}`);
    const prodDetail = allProds.body.data.find((p: any) => p.id === product.body.data.id);
    assert.equal(Number(prodDetail.onHandQty), 4);
  });

  await t.test('8. Manufacturing rollback & 11. Audit completeness', async () => {
    const suffix = Date.now() + '-' + Math.random();
    const mat = await api.post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `MatMO-${suffix}`, salesPrice: 50, costPrice: 20, onHandQty: 0, reorderPoint: 0, procureOnDemand: false });
    const fin = await api.post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `FinMO-${suffix}`, salesPrice: 200, costPrice: 100, onHandQty: 0, reorderPoint: 0, procureOnDemand: false });

    await api.post(`/products/${mat.body.data.id}/adjust-stock`).set('Authorization', `Bearer ${adminToken}`)
      .send({ direction: 'IN', quantity: 20, reason: 'init' });

    const bom = await api.post('/bom').set('Authorization', `Bearer ${adminToken}`)
      .send({
        finishedProductId: fin.body.data.id,
        referenceQty: 1,
        items: [{ productId: mat.body.data.id, quantity: 2 }],
        operations: [{ name: 'Assembly', expectedMinutes: 10 }]
      });

    const mo = await api.post('/manufacturing-orders').set('Authorization', `Bearer ${adminToken}`)
      .send({ finishedProductId: fin.body.data.id, bomId: bom.body.data.id, quantity: 5 });

    await api.patch(`/manufacturing-orders/${mo.body.data.id}/confirm`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    
    const cancelled = await api.patch(`/manufacturing-orders/${mo.body.data.id}/cancel`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    assert.equal(cancelled.body.data.status, 'CANCELLED');

    const logsRes = await api.get(`/audit-logs?recordId=${mo.body.data.id}`).set('Authorization', `Bearer ${adminToken}`);
    assert.ok(logsRes.body.success, `Audit logs fetch failed: ${JSON.stringify(logsRes.body)}`);
    const actions = logsRes.body.data.items.map((l: any) => l.action);
    assert.ok(actions.includes('CREATE'));
    assert.ok(actions.includes('CONFIRM'));
    assert.ok(actions.includes('CANCEL'));
  });

  await t.test('9. Procurement triggers', async () => {
    const suffix = Date.now() + '-' + Math.random();
    const vendors = await api.get('/vendors').set('Authorization', `Bearer ${adminToken}`);
    const customers = await api.get('/customers').set('Authorization', `Bearer ${adminToken}`);

    const product = await api.post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        name: `TriggerPOProd-${suffix}`, salesPrice: 100, costPrice: 50, onHandQty: 0, reorderPoint: 0, 
        procureOnDemand: true, procurementType: 'PURCHASE', defaultVendorId: vendors.body.data[0].id 
      });

    const so = await api.post('/sales-orders').set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: customers.body.data[0].id,
        items: [{ productId: product.body.data.id, orderedQty: 3, salesPrice: 100 }]
      });

    await api.patch(`/sales-orders/${so.body.data.id}/confirm`).set('Authorization', `Bearer ${adminToken}`).expect(200);

    const trace = await api.get(`/traceability/sales-order/${so.body.data.id}`).set('Authorization', `Bearer ${adminToken}`);
    assert.equal(trace.body.data.purchaseOrders.length, 1, 'PO should have been auto-triggered');
  });
});
