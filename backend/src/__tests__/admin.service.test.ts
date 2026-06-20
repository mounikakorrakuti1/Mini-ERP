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

test('Admin Service Suite', async (t) => {
  const adminToken = await login('admin01');
  const headers = { Authorization: `Bearer ${adminToken}` };

  await t.test('1. Get all users', async () => {
    const res = await api.get('/admin/users').set(headers);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test('2. Update user position and active status', async () => {
    // get a user
    const users = await api.get('/admin/users').set(headers);
    const targetUserId = users.body.data.find((u: any) => u.loginId !== 'admin01').id;
    
    const res = await api.patch(`/admin/users/${targetUserId}`).set(headers).send({
      position: 'Senior Tester',
      active: true
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.position, 'Senior Tester');
  });

  await t.test('3. Update user role', async () => {
    const users = await api.get('/admin/users').set(headers);
    const targetUserId = users.body.data.find((u: any) => u.loginId !== 'admin01').id;

    // We can clear roles and set a new role
    const salesRole = await prisma.role.findFirst({ where: { name: 'Sales Manager' } });

    const res = await api.patch(`/admin/users/${targetUserId}`).set(headers).send({
      roleId: salesRole?.id
    });
    assert.equal(res.status, 200);
  });
});
