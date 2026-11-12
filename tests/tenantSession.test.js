import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TenantSession } from '../src/services/tenantSession.js';

test('authentication must resolve before any tenant work', () => {
  assert.throws(() => new TenantSession().capture(), /Authentication/);
});

test('pending work rejects after switching accounts and after returning to the same UID', async () => {
  const session = new TenantSession();
  session.activate('a');
  const first = session.capture();
  let finish;
  const pending = first.wait(() => new Promise(resolve => { finish = resolve; }));
  session.activate('b');
  session.activate('a');
  finish('private a data');
  await assert.rejects(pending, /session changed/);
  assert.equal(await session.capture().wait(() => Promise.resolve('fresh')), 'fresh');
});

test('actual Firebase user mismatch blocks work before observer delivery', () => {
  let currentUid = 'a';
  const session = new TenantSession(() => currentUid);
  session.activate('a');
  const captured = session.capture();
  currentUid = 'b';
  assert.throws(() => captured.assertActive(), /session changed/);
  assert.throws(() => session.capture(), /session changed/);
});

test('a stale view cannot start a mutation in the next account', async () => {
  const session = new TenantSession();
  session.activate('a');
  const view = session.capture();
  session.activate('b');
  let writes = 0;
  await assert.rejects(view.wait(() => { writes++; }), /session changed/);
  assert.equal(writes, 0);
  assert.equal(view.isActive(), false);
});

test('a tenant switch invalidates an outstanding operation without changing the user', async () => {
  const session = new TenantSession();
  session.activate('admin', 'women');
  const first = session.capture();
  let finish;
  const pending = first.wait(() => new Promise(resolve => { finish = resolve; }));
  session.activate('admin', 'men');
  finish('women data');
  await assert.rejects(pending, /session changed/);
  assert.equal(session.capture().tenantId, 'men');
  assert.equal(session.capture().uid, 'admin');
  session.activate('admin', null);
  assert.throws(() => session.capture(), /Authentication/);
});
