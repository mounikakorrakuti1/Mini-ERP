/* Run with: API_URL=http://localhost:3000 npm run demo:api */
const baseUrl = process.env.API_URL ?? 'http://localhost:3000';

type ApiResult<T = any> = { success: boolean; data: T; message?: string };
let token = '';

async function request<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as ApiResult<T>;
  if (!response.ok || !payload.success)
    throw new Error(
      `${method} ${path}: ${response.status} ${payload.message ?? JSON.stringify(payload)}`,
    );
  console.log(`✓ ${method} ${path} → ${response.status}`);
  return payload.data;
}

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function main() {
  const health = await fetch(`${baseUrl}/health`);
  expect(health.ok, 'API health endpoint must be available');
  console.log('✓ GET /health → 200');

  const login = await request<{ accessToken: string }>('POST', '/auth/login', {
    loginId: 'admin01',
    password: 'Admin@123',
  });
  token = login.accessToken;
  expect(token.length > 20, 'login must return JWT');

  const suffix = Date.now();
  const customer = await request<any>('POST', '/customers', {
    reference: `DEMO-CUST-${suffix}`,
    name: 'Demo Customer',
    address: 'Demo Address',
    contact: '+910000000000',
  });
  const vendor = await request<any>('POST', '/vendors', {
    reference: `DEMO-VEND-${suffix}`,
    name: 'Demo Vendor',
    address: 'Vendor Address',
    contact: '+910000000001',
    leadTimeDays: 3,
  });
  const material = await request<any>('POST', '/products', {
    reference: `DEMO-MAT-${suffix}`,
    name: `Demo Material ${suffix}`,
    salesPrice: 100,
    costPrice: 50,
    reorderPoint: 5,
    procureOnDemand: false,
  });
  const finished = await request<any>('POST', '/products', {
    reference: `DEMO-FG-${suffix}`,
    name: `Demo Finished Good ${suffix}`,
    salesPrice: 500,
    costPrice: 250,
    reorderPoint: 2,
    procureOnDemand: false,
  });

  const po = await request<any>('POST', '/purchase-orders', {
    vendorId: vendor.id,
    vendorAddress: 'Vendor Address',
    items: [{ productId: material.id, orderedQty: 20, costPrice: 50 }],
  });
  await request('PATCH', `/purchase-orders/${po.id}/confirm`);
  const received = await request<any>('PATCH', `/purchase-orders/${po.id}/receive`, {
    items: [{ itemId: po.items[0].id, receivedQty: 20 }],
  });
  expect(received.status === 'FULLY_RECEIVED', 'PO must be fully received');

  const bom = await request<any>('POST', '/bom', {
    finishedProductId: finished.id,
    referenceQty: 1,
    items: [{ productId: material.id, quantity: 2 }],
    operations: [{ name: 'Assembly', workCenter: 'Demo Line', expectedMinutes: 15 }],
  });
  const mo = await request<any>('POST', '/manufacturing-orders', {
    finishedProductId: finished.id,
    bomId: bom.id,
    quantity: 2,
  });
  await request('PATCH', `/manufacturing-orders/${mo.id}/confirm`);
  await request('PATCH', `/manufacturing-orders/${mo.id}/start`);
  const completed = await request<any>('PATCH', `/manufacturing-orders/${mo.id}/complete`);
  expect(completed.status === 'COMPLETED', 'MO must be completed');

  const order = await request<any>('POST', '/sales-orders', {
    customerId: customer.id,
    customerAddress: 'Demo Address',
    items: [{ productId: finished.id, orderedQty: 1, salesPrice: 500 }],
  });
  const confirmed = await request<any>('PATCH', `/sales-orders/${order.id}/confirm`);
  expect(confirmed.status === 'CONFIRMED', 'SO must be confirmed');
  const delivered = await request<any>('PATCH', `/sales-orders/${order.id}/deliver`, {
    items: [{ itemId: order.items[0].id, deliveredQty: 1 }],
  });
  expect(delivered.status === 'FULLY_DELIVERED', 'SO must be fully delivered');

  const inventory = await request<any[]>('GET', '/inventory/summary');
  const finishedBalance = inventory.find((item) => item.id === finished.id);
  expect(
    Number(finishedBalance?.onHand) === 1,
    'finished-goods stock must equal production minus delivery',
  );
  const movements = await request<any[]>('GET', '/inventory/movements');
  expect(
    movements.some((m) => m.referenceId === mo.id && m.source === 'MO_PRODUCTION'),
    'MO production movement must exist',
  );
  expect(
    movements.some((m) => m.referenceId === order.id && m.source === 'SALES_DELIVERY'),
    'sales delivery movement must exist',
  );
  await request('GET', '/audit-logs');
  await request('GET', '/notifications');
  console.log('\nDemo completed successfully.');
}

main().catch((error) => {
  console.error(`\nDemo failed: ${(error as Error).message}`);
  process.exitCode = 1;
});
