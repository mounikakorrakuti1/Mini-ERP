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

test('Audit Suite', async (t) => {
  const adminToken = await login('admin01');
  const headers = { Authorization: `Bearer ${adminToken}` };

  await t.test('1. Audit logs: retrieve and filter by module', async () => {
    // There should be some logs from other tests or just login
    const res = await api.get('/audit-logs?module=AUTH').set(headers);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.data));
  });

  await t.test('2. Audit logs: filter by action', async () => {
    const res = await api.get('/audit-logs?action=LOGIN').set(headers);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.data));
  });

  await t.test('3. Audit logs: pagination', async () => {
    const res = await api.get('/audit-logs?page=1&limit=2').set(headers);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.data.length <= 2);
  });
});
