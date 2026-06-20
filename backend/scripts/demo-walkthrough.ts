const baseUrl = process.env.API_URL ?? 'http://localhost:3000';

type ApiResult<T = any> = { success: boolean; data: T; message?: string };
let token = '';

const line = (label: string) => console.log(`\n${'='.repeat(72)}\n${label}\n${'='.repeat(72)}`);

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
  if (!response.ok || payload.success === false)
    throw new Error(
      `${method} ${path}: ${response.status} ${payload.message ?? JSON.stringify(payload)}`,
    );
  return payload.data ?? (payload as T);
}

async function main() {
  line('Mini ERP Demo Walkthrough');
  await request('GET', '/health');
  const login = await request<{ accessToken: string }>('POST', '/auth/login', {
    loginId: 'admin01',
    password: 'Admin@123',
  });
  token = login.accessToken;
  console.log(`API: ${baseUrl}`);
  console.log('Logged in as admin01');

  const suffix = Date.now();
  const customers = await request<any[]>('GET', '/customers');
  const vendors = await request<any[]>('GET', '/vendors');
  const customer = customers[0];
  const vendor = vendors[0];

  line('1. Create SO');
  const buyPart = await request<any>('POST', '/products', {
    name: `Walkthrough Buy Part ${suffix}`,
    salesPrice: 500,
    costPrice: 240,
    onHandQty: 0,
    reorderPoint: 5,
    procureOnDemand: true,
    procurementType: 'PURCHASE',
    defaultVendorId: vendor.id,
  });
  const so = await request<any>('POST', '/sales-orders', {
    customerId: customer.id,
    customerAddress: customer.address,
    items: [{ productId: buyPart.id, orderedQty: 4, salesPrice: 500 }],
  });
  console.table([
    {
      reference: so.reference,
      customer: customer.name,
      product: buyPart.name,
      quantity: 4,
      status: so.status,
    },
  ]);

  line('2. Confirm SO');
  const confirmed = await request<any>('PATCH', `/sales-orders/${so.id}/confirm`);
  console.table([
    {
      reference: confirmed.reference,
      status: confirmed.status,
      availabilityFlag: confirmed.availabilityFlag,
    },
  ]);

  line('3. Trigger Procurement');
  const traceAfterConfirm = await request<any>('GET', `/traceability/sales-order/${so.id}`);
  const autoPo = traceAfterConfirm.purchaseOrders[0];
  console.table(
    traceAfterConfirm.purchaseOrders.map((po: any) => ({
      reference: po.reference,
      vendor: po.vendor.name,
      status: po.status,
      autoCreated: po.autoCreated,
      product: po.items[0].product.name,
      orderedQty: Number(po.items[0].orderedQty),
    })),
  );

  line('4. Receive Stock');
  await request('PATCH', `/purchase-orders/${autoPo.id}/confirm`);
  const received = await request<any>('PATCH', `/purchase-orders/${autoPo.id}/receive`, {
    items: autoPo.items.map((item: any) => ({
      itemId: item.id,
      receivedQty: Number(item.orderedQty),
    })),
  });
  console.table([{ reference: received.reference, status: received.status }]);

  line('5. Manufacture');
  const material = await request<any>('POST', '/products', {
    name: `Walkthrough Raw Material ${suffix}`,
    salesPrice: 120,
    costPrice: 60,
    onHandQty: 0,
    reorderPoint: 5,
    procureOnDemand: false,
  });
  const finished = await request<any>('POST', '/products', {
    name: `Walkthrough Finished Good ${suffix}`,
    salesPrice: 1500,
    costPrice: 780,
    onHandQty: 0,
    reorderPoint: 2,
    procureOnDemand: false,
  });
  await request('POST', `/products/${material.id}/adjust-stock`, {
    direction: 'IN',
    quantity: 20,
    reason: `walkthrough-opening-${suffix}`,
  });
  const bom = await request<any>('POST', '/bom', {
    finishedProductId: finished.id,
    referenceQty: 1,
    items: [{ productId: material.id, quantity: 2 }],
    operations: [{ name: 'Assembly', workCenter: 'Demo Cell', expectedMinutes: 30 }],
  });
  const mo = await request<any>('POST', '/manufacturing-orders', {
    finishedProductId: finished.id,
    bomId: bom.id,
    quantity: 2,
  });
  await request('PATCH', `/manufacturing-orders/${mo.id}/confirm`);
  await request('PATCH', `/manufacturing-orders/${mo.id}/start`);
  const completed = await request<any>('PATCH', `/manufacturing-orders/${mo.id}/complete`);
  console.table([
    {
      reference: completed.reference,
      status: completed.status,
      produced: Number(completed.quantity),
      finishedGood: finished.name,
    },
  ]);

  line('6. Deliver');
  const soDetail = await request<any>('GET', `/sales-orders/${so.id}`);
  const delivered = await request<any>('PATCH', `/sales-orders/${so.id}/deliver`, {
    items: soDetail.items.map((item: any) => ({
      itemId: item.id,
      deliveredQty: Number(item.orderedQty),
    })),
  });
  console.table([{ reference: delivered.reference, status: delivered.status }]);

  line('7. Show Ledger');
  const movements = await request<any[]>('GET', '/inventory/movements');
  console.table(
    movements.slice(0, 10).map((m) => ({
      product: m.productId,
      direction: m.direction,
      quantity: Number(m.quantity),
      source: m.source,
      referenceType: m.referenceType,
    })),
  );
  const reconciliation = await request<any>('GET', '/inventory/reconciliation');
  console.log(
    `Reconciliation: ${reconciliation.status} (${reconciliation.mismatches.length} mismatches)`,
  );

  line('8. Show Traceability');
  const trace = await request<any>('GET', `/traceability/sales-order/${so.id}`);
  console.table([
    {
      so: trace.chain.so,
      po: trace.chain.po.join(', '),
      mo: trace.chain.mo.join(', ') || '-',
      stockMovements: trace.chain.stockMovements,
      auditLogs: trace.chain.auditLogs,
    },
  ]);
}

main().catch((error) => {
  console.error(`\nDemo walkthrough failed: ${(error as Error).message}`);
  process.exitCode = 1;
});
