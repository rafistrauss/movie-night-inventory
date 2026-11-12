import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as firestore from 'firebase/firestore';
import { writable } from 'svelte/store';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { migrate } from '../../scripts/migration.js';

let env, adminApp, admin;
before(async () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Run through npm run test:emulator');
  env = await initializeTestEnvironment({ projectId: 'demo-movie-tenants', firestore: {
    rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8')
  } });
  adminApp = initializeApp({ projectId: 'demo-movie-tenants' }, 'migration-test');
  admin = getFirestore(adminApp);
});
after(async () => { await env?.cleanup(); if (adminApp) await deleteApp(adminApp); });

test('provisioning creates an empty tenant and preserves existing memberships on retry', async () => {
  await env.clearFirestore();
  const args = ['scripts/provision-tenant.js', '--project', 'demo-movie-tenants',
    '--tenant', 'empty', '--name', 'Empty', '--apply'];
  execFileSync(process.execPath, args, { env: process.env });
  assert.deepEqual((await admin.doc('tenants/empty').get()).data().memberUids, []);
  await admin.doc('tenants/empty').update({ memberUids: ['existing'] });
  execFileSync(process.execPath, args, { env: process.env });
  assert.deepEqual((await admin.doc('tenants/empty').get()).data().memberUids, ['existing']);
});

test('membership rules allow shared CRUD, isolate tenants, grant global admins and prevent access escalation', async () => {
  await env.clearFirestore();
  await admin.doc('tenants/women').set({ name: 'Women', memberUids: ['a', 'shared'] });
  await admin.doc('tenants/men').set({ name: 'Men', memberUids: ['b', 'shared'] });
  await admin.doc('platformAdmins/super').set({});
  const a = env.authenticatedContext('a').firestore();
  const b = env.authenticatedContext('b').firestore();
  const shared = env.authenticatedContext('shared').firestore();
  const superuser = env.authenticatedContext('super').firestore();
  const anon = env.unauthenticatedContext().firestore();
  for (const path of ['events/e', 'expenses/x', 'inventory/i', 'events/e/attendees/p', 'events/e/usage/u']) {
    const own = firestore.doc(a, `tenants/women/${path}`);
    await assertSucceeds(firestore.setDoc(own, { value: 1 }));
    for (const db of [a, shared, superuser]) {
      await assertSucceeds(firestore.getDoc(firestore.doc(db, `tenants/women/${path}`)));
      await assertSucceeds(firestore.updateDoc(firestore.doc(db, `tenants/women/${path}`), { value: 3 }));
      await assertSucceeds(firestore.getDocs(firestore.collection(db, `tenants/women/${path.split('/').slice(0, -1).join('/')}`)));
    }
    for (const db of [b, anon]) {
      await assertFails(firestore.getDoc(firestore.doc(db, `tenants/women/${path}`)));
      await assertFails(firestore.setDoc(firestore.doc(db, `tenants/women/${path}`), { value: 2 }));
      await assertFails(firestore.deleteDoc(firestore.doc(db, `tenants/women/${path}`)));
      await assertFails(firestore.getDocs(firestore.collection(db, `tenants/women/${path.split('/').slice(0, -1).join('/')}`)));
    }
    await assertSucceeds(firestore.deleteDoc(own));
    for (const db of [a, b, superuser, anon]) {
      await assertFails(firestore.getDoc(firestore.doc(db, path)));
      await assertFails(firestore.setDoc(firestore.doc(db, path), {}));
      await assertFails(firestore.getDoc(firestore.doc(db, `users/a/${path}`)));
    }
  }
  await assertSucceeds(firestore.setDoc(firestore.doc(b, 'tenants/men/events/e'), {}));
  await assertFails(firestore.getDoc(firestore.doc(a, 'tenants/men/events/e')));
  await assertSucceeds(firestore.getDoc(firestore.doc(shared, 'tenants/men/events/e')));
  await assertSucceeds(firestore.getDocs(firestore.collection(superuser, 'tenants')));
  await assertFails(firestore.getDocs(firestore.collection(a, 'tenants')));
  const directory = await assertSucceeds(firestore.getDocs(firestore.query(
    firestore.collection(a, 'tenants'), firestore.where('memberUids', 'array-contains', 'a'))));
  assert.deepEqual(directory.docs.map(doc => doc.id), ['women']);
  await assertSucceeds(firestore.getDoc(firestore.doc(a, 'platformAdmins/a')));
  for (const db of [a, b, superuser, anon]) {
    await assertFails(firestore.setDoc(firestore.doc(db, 'platformAdmins/a'), {}));
    await assertFails(firestore.setDoc(firestore.doc(db, 'tenants/women'), { memberUids: ['b'] }));
    await assertFails(firestore.deleteDoc(firestore.doc(db, 'tenants/women')));
  }
  await admin.doc('tenants/future').set({ name: 'Future', memberUids: [] });
  await assertSucceeds(firestore.setDoc(firestore.doc(superuser, 'tenants/future/events/e'), {}));
  await assertFails(firestore.setDoc(firestore.doc(a, 'tenants/future/events/e'), {}));
  await admin.doc('tenants/women').update({ memberUids: [] });
  await assertFails(firestore.getDoc(firestore.doc(a, 'tenants/women/events/e')));
  await assertFails(firestore.getDocs(firestore.collectionGroup(a, 'usage')));
});

// Firebase validates object prototypes; normalize VM-created literals at the SDK boundary.
function native(value) {
  if (Array.isArray(value)) return Array.from(value, native);
  if (Object.prototype.toString.call(value) === '[object Date]') return new Date(value.getTime());
  if (value && value.constructor?.name === 'Object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, native(v)]));
  return value;
}

async function loadApplication(db) {
  let beforeAuth, authChanged;
  const auth = { currentUser: null };
  const context = createContext({ console, localStorage: { removeItem() {} } });
  let pausedRead;
  const mocks = {
    '../firebase': { auth, db },
    'firebase/auth': {
      beforeAuthStateChanged: (_auth, cb) => { beforeAuth = cb; },
      onAuthStateChanged: (_auth, cb) => { authChanged = cb; }
    },
    'firebase/firestore': { ...firestore,
      addDoc: (ref, data) => firestore.addDoc(ref, native(data)),
      updateDoc: (ref, data) => firestore.updateDoc(ref, native(data)),
      writeBatch: db => {
        const batch = firestore.writeBatch(db);
        return { set: (ref, data) => batch.set(ref, native(data)), commit: () => batch.commit() };
      },
      getDocs: async (...args) => {
      const result = await firestore.getDocs(...args);
      if (pausedRead) { const pause = pausedRead; pausedRead = null; await pause(); }
      return result;
    } },
    'svelte/store': { writable }
  };
  // The emulator bypass below lets one SDK database represent changing auth
  // identities for real service operations; rules are tested independently above.
  const modules = new Map();
  function getModule(specifier) {
    const name = specifier.replace(/^\.\//, '');
    if (modules.has(name)) return modules.get(name);
    const mock = mocks[specifier];
    const module = mock ? new SyntheticModule(Object.keys(mock), function () {
      for (const [key, value] of Object.entries(mock)) this.setExport(key, value);
    }, { context }) : new SourceTextModule(
      readFileSync(new URL(`../../src/services/${name}.js`, import.meta.url), 'utf8'), { context }
    );
    modules.set(name, module);
    return module;
  }
  const names = ['event', 'expense', 'attendee', 'usage', 'inventory', 'aggregation', 'reporting', 'tenant', 'cache'];
  const entry = new SourceTextModule(names.map(name => `export * as ${name} from './${name}Service';`).join('\n'), { context });
  await entry.link(getModule);
  await entry.evaluate();
  return {
    services: entry.namespace,
    async switchTo(uid) {
      beforeAuth(uid ? { uid } : null);
      auth.currentUser = uid ? { uid } : null;
      await new Promise(resolve => {
        let stop;
        stop = entry.namespace.tenant.tenantState.subscribe(state => {
          if (state.ready && state.uid === uid) {
            resolve();
            queueMicrotask(() => stop());
          }
        });
        authChanged(auth.currentUser);
      });
    },
    pauseNextRead(callback) { pausedRead = callback; }
  };
}

test('real services isolate CRUD, inventory, attendance, financial reports and caches across login transitions', async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    await admin.doc('tenants/a').set({ name: 'A', memberUids: ['a'] });
    await admin.doc('tenants/b').set({ name: 'B', memberUids: ['b'] });
    await admin.doc('platformAdmins/super').set({});
    const app = await loadApplication(context.firestore());
    const s = app.services;
    await app.switchTo('a');
    const eventId = await s.event.createEvent({ name: 'A night', date: '2026-01-01' });
    const expenseId = await s.expense.createExpense({ eventId, name: 'Popcorn', cost: 10, quantityPurchased: 20, reusableType: 'consumable' });
    const attendeeId = await s.attendee.addAttendee(eventId, { paidAmount: 30 });
    const usageId = await s.usage.addUsage(eventId, { itemName: 'Popcorn', quantityUsed: 4 });
    assert.equal((await s.inventory.buildInventory())[0].remainingQuantity, 16);
    assert.equal((await s.aggregation.getDashboardData()).leftoverFunds, 20);
    assert.equal((await s.reporting.getEventFinancialSummary(eventId)).totalUsageCost, '2.00');
    await app.switchTo('b');
    assert.equal((await s.event.getAllEvents()).length, 0);
    assert.equal((await s.expense.getAllExpenses()).length, 0);
    assert.equal((await s.inventory.buildInventory()).length, 0);
    assert.equal((await s.aggregation.getDashboardData()).leftoverFunds, 0);
    const bEvent = await s.event.createEvent({ name: 'B night', date: '2026-02-01' });
    await s.expense.createExpense({ eventId: bEvent, name: 'Popcorn', cost: 5, quantityPurchased: 50, reusableType: 'consumable' });
    await app.switchTo('a');
    assert.equal((await s.event.getAllEvents())[0].id, eventId);
    assert.equal((await s.inventory.buildInventory())[0].remainingQuantity, 16);
    await app.switchTo('super');
    s.tenant.selectTenant('a');
    assert.equal((await s.event.getAllEvents())[0].id, eventId);
    assert.equal((await s.inventory.buildInventory())[0].remainingQuantity, 16);
    s.tenant.selectTenant('b');
    assert.equal((await s.event.getAllEvents())[0].id, bEvent);
    assert.equal((await s.inventory.buildInventory())[0].remainingQuantity, 50);
    await app.switchTo('a');
    await s.event.updateEvent(eventId, { name: 'Updated' });
    await s.expense.updateExpense(expenseId, { eventId, cost: 12 });
    await s.attendee.updateAttendee(eventId, attendeeId, { paidAmount: 40 });
    await s.usage.updateUsage(eventId, usageId, { quantityUsed: 6 });
    assert.equal((await s.aggregation.getDashboardData()).leftoverFunds, 28);
    await s.attendee.bulkAddAttendees(eventId, [{ paidAmount: 1 }, { paidAmount: 2 }]);
    await s.usage.bulkAddUsage(eventId, [{ itemName: 'Popcorn', quantityUsed: 1 }]);
    assert.equal(await s.attendee.getTotalCollected(eventId), 43);
    let entered, finish;
    const reached = new Promise(resolve => { entered = resolve; });
    app.pauseNextRead(() => { entered(); return new Promise(resolve => { finish = resolve; }); });
    s.cache.dataCache.invalidateAll();
    const pending = s.usage.getAllUsage();
    await reached;
    await app.switchTo('b');
    finish();
    await assert.rejects(pending, /session changed/);
    assert.equal((await s.usage.getAllUsage()).length, 0);
    await app.switchTo('a');
    await s.usage.deleteUsage(eventId, usageId);
    await s.attendee.deleteAttendee(eventId, attendeeId);
    await s.expense.deleteExpense(expenseId);
    await s.event.deleteEvent(eventId);
    assert.equal((await s.event.getAllEvents()).length, 0);
    await app.switchTo(null);
    await assert.rejects(s.event.getAllEvents(), /Authentication/);
  });
});

test('migration dry-run, timestamps, nested/orphan records, references, retries and conflicts', async () => {
  await env.clearFirestore();
  const date = new Timestamp(1700000000, 123456789);
  await admin.doc('events/e').set({ date, name: 'Original' });
  await admin.doc('expenses/x').set({ eventId: 'e', eventRef: admin.doc('events/e'), createdAt: date });
  await admin.doc('events/e/attendees/a').set({ paidAmount: 5 });
  await admin.doc('events/e/usage/u').set({ itemName: 'Popcorn', quantityUsed: 1 });
  await admin.doc('inventory/i').set({ quantity: 10 });
  await admin.doc('settings/preferences').set({ currency: 'USD' });
  await admin.doc('events/deleted/usage/orphan').set({ quantityUsed: 2 });
  await admin.doc('tenants/owner').set({ name: 'Owner', memberUids: ['a'] });
  await admin.doc('platformAdmins/a').set({});
  await admin.doc('users/old/events/private').set({ name: 'Old UID scope' });
  const options = { tenantId: 'owner', log() {} };
  assert.equal((await migrate(admin, options)).total, 7);
  assert.equal((await admin.doc('tenants/owner/events/e').get()).exists, false);
  const applied = await migrate(admin, { ...options, apply: true });
  assert.equal(applied.total, 7);
  assert.equal((await admin.doc('events/e').get()).exists, true);
  const expense = (await admin.doc('tenants/owner/expenses/x').get()).data();
  assert.equal(expense.eventId, 'e');
  assert.equal(expense.eventRef.path, 'tenants/owner/events/e');
  assert.ok(expense.createdAt.isEqual((await admin.doc('expenses/x').get()).data().createdAt));
  assert.equal((await migrate(admin, { ...options, apply: true })).existing, 7);
  await admin.doc('tenants/fresh/expenses/x').set({ cost: 999 });
  await assert.rejects(migrate(admin, { tenantId: 'fresh', apply: true, log() {} }), /Conflict/);
  assert.equal((await admin.doc('tenants/fresh/events/e').get()).exists, false);
  await admin.doc('tenants/owner/events/e').update({ name: 'Conflict' });
  await assert.rejects(migrate(admin, { ...options, apply: true }), /Conflict/);
  assert.equal((await admin.doc('tenants/owner/events/e').get()).data().name, 'Conflict');
  await admin.doc('expenses/bad').set({ eventId: 'missing' });
  await assert.rejects(migrate(admin, { tenantId: 'new-owner', apply: true, log() {} }), /Dangling eventId/);
  assert.equal((await admin.doc('tenants/new-owner/events/e').get()).exists, false);
});


test('temporary migration rules keep owner reads and freeze every client write', async () => {
  const freeze = await initializeTestEnvironment({ projectId: 'demo-movie-tenants', firestore: {
    rules: readFileSync(new URL('../../firestore.migration.rules', import.meta.url), 'utf8').replaceAll('OWNER_UID_REPLACE_ME', 'owner')
  } });
  try {
    const owner = freeze.authenticatedContext('owner').firestore();
    const other = freeze.authenticatedContext('other').firestore();
    for (const path of ['events/e', 'expenses/x', 'inventory/i', 'events/e/attendees/a', 'events/e/usage/u']) {
      await assertSucceeds(firestore.getDoc(firestore.doc(owner, path)));
      await assertFails(firestore.getDoc(firestore.doc(other, path)));
      await assertFails(firestore.setDoc(firestore.doc(owner, path), {}));
    }
    await admin.doc('tenants/women').set({ name: 'Women', memberUids: ['owner'] });
    await assertSucceeds(firestore.getDoc(firestore.doc(owner, 'tenants/women/events/e')));
    await assertFails(firestore.getDoc(firestore.doc(other, 'tenants/women/events/e')));
    await assertFails(firestore.setDoc(firestore.doc(owner, 'tenants/women/events/e'), {}));
    await assertFails(firestore.getDoc(firestore.doc(owner, 'users/owner/events/e')));
    await assertFails(firestore.setDoc(firestore.doc(owner, 'users/owner/events/e'), {}));
    await assertFails(firestore.setDoc(firestore.doc(other, 'users/other/events/e'), {}));
  } finally { await freeze.cleanup(); }
});

test('migration rejects maps impersonating references in preflight and final verification', async () => {
  await env.clearFirestore();
  await admin.doc('events/e').set({ name: 'Original' });
  await admin.doc('expenses/x').set({ nested: [{ eventRef: admin.doc('events/e') }] });
  const impostor = { nested: [{ eventRef: { reference: 'tenants/owner/events/e' } }] };
  await admin.doc('tenants/owner/expenses/x').set(impostor);
  const options = { tenantId: 'owner', apply: true, log() {} };
  await assert.rejects(migrate(admin, options), /Conflict: tenants\/owner\/expenses\/x/);
  assert.equal((await admin.doc('tenants/owner/events/e').get()).exists, false);
  await admin.doc('tenants/owner/expenses/x').delete();
  // Change a correctly copied reference to a map after transactions complete.
  const tampered = {
    listCollections: () => admin.listCollections(),
    doc: path => admin.doc(path),
    async runTransaction(callback) {
      const result = await admin.runTransaction(callback);
      if ((await admin.doc('tenants/owner/expenses/x').get()).exists) {
        await admin.doc('tenants/owner/expenses/x').set(impostor);
      }
      return result;
    }
  };
  await assert.rejects(migrate(tampered, options), /Verification failed: tenants\/owner\/expenses\/x/);
});
