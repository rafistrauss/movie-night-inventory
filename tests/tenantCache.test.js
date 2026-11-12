import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';

async function loadSessionAndCache() {
  const auth = { currentUser: null };
  let beforeAuth, authChanged, state;
  const mocks = {
    'firebase/auth': {
      beforeAuthStateChanged: (_, callback) => { beforeAuth = callback; },
      onAuthStateChanged: (_, callback) => { authChanged = callback; }
    },
    'firebase/firestore': {
      collection: (...parts) => ({ parts }), doc: (...parts) => ({ parts }),
      query: ref => ref, where() {},
      onSnapshot(ref, callback) {
        if (ref.parts[1] === 'platformAdmins') callback({ exists: () => false });
        else callback({ docs: [auth.currentUser.uid, 'shared'].map(id => ({ id, data: () => ({ name: id }) })) });
        return () => {};
      }
    },
    'svelte/store': { writable: initial => {
      state = initial;
      return { set(value) { state = value; } };
    } },
    '../firebase': { auth, db: {} }
  };
  const context = createContext();
  const modules = new Map();
  async function load(specifier) {
    const name = specifier.replace(/^\.\//, '');
    if (modules.has(name)) return modules.get(name);
    const mock = mocks[specifier];
    const module = mock ? new SyntheticModule(Object.keys(mock), function () {
      for (const [key, value] of Object.entries(mock)) this.setExport(key, value);
    }, { context }) : new SourceTextModule(
      await readFile(new URL(`../src/services/${name}.js`, import.meta.url), 'utf8'), { context }
    );
    modules.set(name, module);
    await module.link(load);
    return module;
  }
  const cache = await load('./cacheService');
  await cache.evaluate();
  return {
    cache: cache.namespace.dataCache,
    tenant: modules.get('tenantService').namespace,
    get state() { return state; },
    signIn(uid) {
      const incoming = uid ? { uid } : null;
      beforeAuth(incoming);
      const changed = auth.currentUser?.uid !== incoming?.uid;
      auth.currentUser = incoming;
      // Firebase suppresses the observer for a replacement User with the same UID.
      if (changed) authChanged(incoming);
    }
  };
}

test('same-UID sign-in preserves readiness, cache and the active generation', async () => {
  const app = await loadSessionAndCache();
  app.signIn('a');
  const tenant = app.tenant.captureTenant();
  const generation = app.state.generation;
  app.cache.set('events', ['A'], tenant);
  app.signIn('a');
  assert.equal(app.state.ready, true);
  assert.equal(app.state.uid, 'a');
  assert.equal(app.state.generation, generation);
  assert.equal(tenant.isActive(), true);
  assert.equal(app.cache.get('events')[0], 'A');
  app.signIn(null);
  assert.equal(tenant.isActive(), false);
  app.signIn('a');
  assert.equal(app.state.ready, true);
  assert.equal(app.cache.get('events'), null);
  assert.throws(() => app.cache.set('events', ['old A'], tenant), /session changed/);
});

test('a transition after wait validation cannot write old records into the new account cache', async () => {
  const app = await loadSessionAndCache();
  app.signIn('a');
  const tenant = app.tenant.captureTenant();
  const pending = tenant.wait(() => Promise.resolve(['private A']));
  // Register the transition first so it runs after wait validates but before the writer resumes.
  pending.then(() => app.signIn('b'));
  await assert.rejects((async () => {
    const records = await pending;
    app.cache.set('events', records, tenant);
  })(), /session changed/);
  assert.equal(app.state.uid, 'b');
  assert.equal(app.cache.get('events'), null);
  app.cache.set('events', ['B'], app.tenant.captureTenant());
  assert.equal(app.cache.get('events')[0], 'B');
});

test('switching movie nights clears caches and invalidates pending work within the same account', async () => {
  const app = await loadSessionAndCache();
  app.signIn('a');
  const first = app.tenant.captureTenant();
  app.cache.set('events', ['Private A'], first);
  app.tenant.selectTenant('shared');
  assert.equal(app.state.uid, 'a');
  assert.equal(app.state.tenantId, 'shared');
  assert.equal(app.cache.get('events'), null);
  assert.throws(() => app.cache.set('events', ['stale'], first), /session changed/);
  assert.throws(() => app.tenant.selectTenant('forbidden'), /unavailable/);
  app.cache.set('events', ['Shared'], app.tenant.captureTenant());
  app.tenant.selectTenant('a');
  assert.equal(app.cache.get('events'), null);
});
