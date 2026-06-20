import assert from 'node:assert/strict';
import test from 'node:test';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const unique = Date.now();

async function request(path: string, options: RequestInit = {}, token?: string) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${options.method || 'GET'} ${path} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json() as Promise<{ success: boolean; data: any }>;
}

async function requestRaw(path: string, options: RequestInit = {}, token?: string) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await res.json().catch(() => ({}));
  return { status: res.status, payload };
}

async function loginAdmin() {
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ loginId: 'admin01', password: 'Admin@123' }),
  });
  return login.data.accessToken as string;
}

test('demand-to-delivery flow creates demand, auto-procures, receives, delivers, and proves traceability', async () => {
  const token = await loginAdmin();
  assert.ok(token);

  const vendors = await request('/vendors', {}, token);
  const customers = await request('/customers', {}, token);
  assert.ok(vendors.data.length > 0);
  assert.ok(customers.data.length > 0);

  const product = await request(
    '/products',
    {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E Purchase Product ${unique}`,
        salesPrice: 1000,
        costPrice: 600,
        onHandQty: 0,
        reorderPoint: 0,
        procureOnDemand: true,
        procurementType: 'PURCHASE',
        defaultVendorId: vendors.data[0].id,
      }),
    },
    token,
  );

  const salesOrder = await request(
    '/sales-orders',
    {
      method: 'POST',
      body: JSON.stringify({
        customerId: customers.data[0].id,
        items: [{ productId: product.data.id, orderedQty: 2, salesPrice: 1000 }],
      }),
    },
    token,
  );

  const confirmed = await request(
    `/sales-orders/${salesOrder.data.id}/confirm`,
    { method: 'PATCH' },
    token,
  );
  assert.equal(confirmed.data.status, 'CONFIRMED');

  const tracedAfterConfirm = await request(
    `/traceability/sales-order/${salesOrder.data.id}`,
    {},
    token,
  );
  assert.equal(tracedAfterConfirm.data.purchaseOrders.length, 1);
  const purchaseOrder = tracedAfterConfirm.data.purchaseOrders[0];

  await request(`/purchase-orders/${purchaseOrder.id}/confirm`, { method: 'PATCH' }, token);
  const received = await request(
    `/purchase-orders/${purchaseOrder.id}/receive`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        items: purchaseOrder.items.map((item: any) => ({
          itemId: item.id,
          receivedQty: Number(item.orderedQty),
        })),
      }),
    },
    token,
  );
  assert.equal(received.data.status, 'FULLY_RECEIVED');

  const detail = await request(`/sales-orders/${salesOrder.data.id}`, {}, token);
  const delivered = await request(
    `/sales-orders/${salesOrder.data.id}/deliver`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        items: detail.data.items.map((item: any) => ({
          itemId: item.id,
          deliveredQty: Number(item.orderedQty),
        })),
      }),
    },
    token,
  );
  assert.equal(delivered.data.status, 'FULLY_DELIVERED');

  const reconciliation = await request('/inventory/reconciliation', {}, token);
  assert.equal(reconciliation.data.status, 'HEALTHY');

  const trace = await request(`/traceability/sales-order/${salesOrder.data.id}`, {}, token);
  assert.ok(
    trace.data.stockMovements.some((movement: any) => movement.source === 'PURCHASE_RECEIPT'),
  );
  assert.ok(
    trace.data.stockMovements.some((movement: any) => movement.source === 'SALES_DELIVERY'),
  );
  assert.ok(trace.data.auditLogs.length >= 2);
});

test('sales rules reject locked edits, over delivery, duplicate procurement, and late cancellation', async () => {
  const token = await loginAdmin();
  const suffix = Date.now();
  const vendors = await request('/vendors', {}, token);
  const customers = await request('/customers', {}, token);
  const product = await request(
    '/products',
    {
      method: 'POST',
      body: JSON.stringify({
        name: `Rule Sales Product ${suffix}`,
        salesPrice: 300,
        costPrice: 120,
        onHandQty: 0,
        reorderPoint: 0,
        procureOnDemand: true,
        procurementType: 'PURCHASE',
        defaultVendorId: vendors.data[0].id,
      }),
    },
    token,
  );
  await request(
    `/products/${product.data.id}/adjust-stock`,
    {
      method: 'POST',
      body: JSON.stringify({ direction: 'IN', quantity: 2, reason: `rules-opening-${suffix}` }),
    },
    token,
  );
  const so = await request(
    '/sales-orders',
    {
      method: 'POST',
      body: JSON.stringify({
        customerId: customers.data[0].id,
        items: [{ productId: product.data.id, orderedQty: 3, salesPrice: 300 }],
      }),
    },
    token,
  );
  await request(`/sales-orders/${so.data.id}/confirm`, { method: 'PATCH' }, token);

  const lockedEdit = await requestRaw(
    `/sales-orders/${so.data.id}`,
    { method: 'PATCH', body: JSON.stringify({ customerId: customers.data[1].id }) },
    token,
  );
  assert.equal(lockedEdit.status, 409);
  const secondConfirm = await requestRaw(
    `/sales-orders/${so.data.id}/confirm`,
    { method: 'PATCH' },
    token,
  );
  assert.equal(secondConfirm.status, 409);
  const detail = await request(`/sales-orders/${so.data.id}`, {}, token);
  const overDelivery = await requestRaw(
    `/sales-orders/${so.data.id}/deliver`,
    {
      method: 'PATCH',
      body: JSON.stringify({ items: [{ itemId: detail.data.items[0].id, deliveredQty: 4 }] }),
    },
    token,
  );
  assert.equal(overDelivery.status, 422);
  const cancelled = await requestRaw(`/sales-orders/${so.data.id}/cancel`, { method: 'PATCH' }, token);
  assert.equal(cancelled.status, 409);
});

test('purchase rules reject locked edits, over receipt, and cancellation after receiving', async () => {
  const token = await loginAdmin();
  const suffix = Date.now();
  const vendors = await request('/vendors', {}, token);
  const product = await request(
    '/products',
    {
      method: 'POST',
      body: JSON.stringify({
        name: `Rule Purchase Product ${suffix}`,
        salesPrice: 200,
        costPrice: 80,
        onHandQty: 0,
        reorderPoint: 0,
        procureOnDemand: false,
      }),
    },
    token,
  );
  const po = await request(
    '/purchase-orders',
    {
      method: 'POST',
      body: JSON.stringify({
        vendorId: vendors.data[0].id,
        items: [{ productId: product.data.id, orderedQty: 5, costPrice: 80 }],
      }),
    },
    token,
  );
  await request(`/purchase-orders/${po.data.id}/confirm`, { method: 'PATCH' }, token);
  const lockedEdit = await requestRaw(
    `/purchase-orders/${po.data.id}`,
    { method: 'PATCH', body: JSON.stringify({ vendorId: vendors.data[1].id }) },
    token,
  );
  assert.equal(lockedEdit.status, 409);
  const overReceipt = await requestRaw(
    `/purchase-orders/${po.data.id}/receive`,
    {
      method: 'PATCH',
      body: JSON.stringify({ items: [{ itemId: po.data.items[0].id, receivedQty: 6 }] }),
    },
    token,
  );
  assert.equal(overReceipt.status, 422);
  await request(
    `/purchase-orders/${po.data.id}/receive`,
    {
      method: 'PATCH',
      body: JSON.stringify({ items: [{ itemId: po.data.items[0].id, receivedQty: 2 }] }),
    },
    token,
  );
  const lateCancel = await requestRaw(
    `/purchase-orders/${po.data.id}/cancel`,
    { method: 'PATCH' },
    token,
  );
  assert.equal(lateCancel.status, 409);
});

test('manufacturing rules reject invalid transitions, locked bom changes, and duplicate confirmation', async () => {
  const token = await loginAdmin();
  const suffix = Date.now();
  const material = await request(
    '/products',
    {
      method: 'POST',
      body: JSON.stringify({
        name: `Rule Material ${suffix}`,
        salesPrice: 50,
        costPrice: 20,
        onHandQty: 0,
        reorderPoint: 0,
        procureOnDemand: false,
      }),
    },
    token,
  );
  await request(
    `/products/${material.data.id}/adjust-stock`,
    {
      method: 'POST',
      body: JSON.stringify({ direction: 'IN', quantity: 10, reason: `mo-opening-${suffix}` }),
    },
    token,
  );
  const finished = await request(
    '/products',
    {
      method: 'POST',
      body: JSON.stringify({
        name: `Rule Finished ${suffix}`,
        salesPrice: 500,
        costPrice: 200,
        onHandQty: 0,
        reorderPoint: 0,
        procureOnDemand: false,
      }),
    },
    token,
  );
  const bom = await request(
    '/bom',
    {
      method: 'POST',
      body: JSON.stringify({
        finishedProductId: finished.data.id,
        referenceQty: 1,
        items: [{ productId: material.data.id, quantity: 2 }],
        operations: [{ name: 'Assembly', expectedMinutes: 10 }],
      }),
    },
    token,
  );
  const mo = await request(
    '/manufacturing-orders',
    {
      method: 'POST',
      body: JSON.stringify({
        finishedProductId: finished.data.id,
        bomId: bom.data.id,
        quantity: 2,
      }),
    },
    token,
  );
  const earlyComplete = await requestRaw(
    `/manufacturing-orders/${mo.data.id}/complete`,
    { method: 'PATCH' },
    token,
  );
  assert.equal(earlyComplete.status, 409);
  await request(`/manufacturing-orders/${mo.data.id}/confirm`, { method: 'PATCH' }, token);
  const lockedEdit = await requestRaw(
    `/manufacturing-orders/${mo.data.id}`,
    { method: 'PATCH', body: JSON.stringify({ bomId: bom.data.id }) },
    token,
  );
  assert.equal(lockedEdit.status, 409);
  const duplicateConfirm = await requestRaw(
    `/manufacturing-orders/${mo.data.id}/confirm`,
    { method: 'PATCH' },
    token,
  );
  assert.equal(duplicateConfirm.status, 409);
  await request(`/manufacturing-orders/${mo.data.id}/cancel`, { method: 'PATCH' }, token);
});
