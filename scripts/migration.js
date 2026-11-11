import { isDeepStrictEqual } from 'node:util';

// Preserve SDK values (timestamps, bytes, geopoints) and remap actual references.
export function remap(value, db, uid, roots) {
  if (value && typeof value.path === 'string' && typeof value.get === 'function') {
    return roots.has(value.path.split('/')[0]) ? db.doc(`users/${uid}/${value.path}`) : value;
  }
  if (Array.isArray(value)) return value.map(item => remap(item, db, uid, roots));
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, remap(item, db, uid, roots)]));
  }
  return value;
}

function comparable(value) {
  if (value && typeof value.path === 'string' && typeof value.get === 'function') return { reference: value.path };
  if (Array.isArray(value)) return value.map(comparable);
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, comparable(item)]));
  }
  return value;
}
const equal = (a, b) => isDeepStrictEqual(comparable(a), comparable(b));

export async function discover(db) {
  const roots = (await db.listCollections()).filter(ref => ref.id !== 'users');
  const documents = [];
  async function visit(collection) {
    // listDocuments includes missing parents with surviving subcollections.
    for (const ref of await collection.listDocuments()) {
      const snapshot = await ref.get();
      if (snapshot.exists) documents.push({ path: ref.path, data: snapshot.data() });
      for (const child of await ref.listCollections()) await visit(child);
    }
  }
  for (const root of roots) await visit(root);
  return { roots: new Set(roots.map(ref => ref.id)), documents };
}

function references(value, found = []) {
  if (value && typeof value.path === 'string' && typeof value.get === 'function') found.push(value.path);
  else if (Array.isArray(value)) value.forEach(item => references(item, found));
  else if (value && Object.getPrototypeOf(value) === Object.prototype) Object.values(value).forEach(item => references(item, found));
  return found;
}

export async function migrate(db, { uid, apply = false, log = console.log }) {
  if (typeof uid !== 'string' || !uid || uid.includes('/')) throw new Error('An explicit valid target UID is required');
  const source = await discover(db);
  const sourcePaths = new Set(source.documents.map(item => item.path));
  const plan = source.documents.map(item => ({
    ...item, target: `users/${uid}/${item.path}`, mapped: remap(item.data, db, uid, source.roots)
  }));
  let existing = 0;
  // Preflight the entire plan before writing anything.
  for (const item of plan) {
    if (item.data.eventId && !sourcePaths.has(`events/${item.data.eventId}`)) {
      throw new Error(`Dangling eventId in ${item.path}: ${item.data.eventId}`);
    }
    for (const path of references(item.data)) {
      if (source.roots.has(path.split('/')[0]) && !sourcePaths.has(path)) throw new Error(`Dangling reference in ${item.path}: ${path}`);
    }
    const target = await db.doc(item.target).get();
    if (target.exists) {
      if (!equal(target.data(), item.mapped)) throw new Error(`Conflict: ${item.target}`);
      existing++;
    }
    log(`${target.exists ? 'KEEP' : 'COPY'} ${item.path} -> ${item.target}`);
  }
  if (apply) {
    for (const item of plan) {
      await db.runTransaction(async transaction => {
        const sourceRef = db.doc(item.path);
        const targetRef = db.doc(item.target);
        const [current, target] = await transaction.getAll(sourceRef, targetRef);
        if (!current.exists || !equal(current.data(), item.data)) throw new Error(`Source changed: ${item.path}`);
        if (target.exists) {
          if (!equal(target.data(), item.mapped)) throw new Error(`Conflict: ${item.target}`);
        } else transaction.create(targetRef, item.mapped);
      });
    }
    const after = await discover(db);
    if (after.documents.length !== plan.length) throw new Error('Source document count changed; freeze writes and retry');
    const afterMap = new Map(after.documents.map(item => [item.path, item.data]));
    for (const item of plan) {
      if (!afterMap.has(item.path) || !equal(afterMap.get(item.path), item.data)) throw new Error(`Source changed: ${item.path}`);
      const target = await db.doc(item.target).get();
      if (!target.exists || !equal(target.data(), item.mapped)) throw new Error(`Verification failed: ${item.target}`);
    }
  }
  const counts = {};
  for (const item of plan) {
    const collection = item.path.split('/').filter((_, index) => index % 2 === 0).join('/');
    counts[collection] = (counts[collection] || 0) + 1;
  }
  const result = { uid, mode: apply ? 'applied-and-verified' : 'dry-run', total: plan.length, existing, counts };
  log(JSON.stringify(result, null, 2));
  return result;
}
