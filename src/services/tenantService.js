import { beforeAuthStateChanged, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { writable } from 'svelte/store';
import { auth, db } from '../firebase';
import { TenantSession } from './tenantSession';

const session = new TenantSession(() => auth.currentUser?.uid);
let state = { uid: null, tenantId: null, tenants: [], generation: 0, ready: false, error: '' };
export const tenantState = writable(state);
const resetHandlers = new Set();
let stopAdmin = () => {};
let stopTenants = () => {};
let accountGeneration = 0;

function publish(changes) {
  state = { ...state, ...changes, generation: session.generation };
  tenantState.set(state);
}

function activate(uid, tenantId, changes = {}) {
  session.activate(uid, tenantId);
  for (const reset of resetHandlers) reset();
  publish({ uid, tenantId, ...changes });
}

function clearAccount() {
  accountGeneration++;
  stopAdmin();
  stopTenants();
  activate(null, null, { ready: false, tenants: [], error: '' });
}

// Destroy old views before Firebase commits a different account.
beforeAuthStateChanged(auth, user => {
  if ((user?.uid ?? null) !== (auth.currentUser?.uid ?? null)) clearAccount();
});
onAuthStateChanged(auth, user => {
  clearAccount();
  if (!user) {
    publish({ ready: true });
    return;
  }
  const generation = accountGeneration;
  const active = () => generation === accountGeneration && auth.currentUser?.uid === user.uid;
  publish({ uid: user.uid });
  const fail = () => {
    if (active()) activate(user.uid, null, {
      ready: true, tenants: [], error: 'Unable to load your movie nights. Please sign out and try again.'
    });
  };
  let directoryGeneration = 0;
  // Live membership changes also remove access from the selector and clear views.
  stopAdmin = onSnapshot(doc(db, 'platformAdmins', user.uid), admin => {
    if (!active()) return;
    stopTenants();
    const directory = ++directoryGeneration;
    activate(user.uid, null, { ready: false, tenants: [], error: '' });
    const tenants = collection(db, 'tenants');
    const accessible = admin.exists() ? tenants : query(tenants, where('memberUids', 'array-contains', user.uid));
    stopTenants = onSnapshot(accessible, snapshot => {
      if (!active() || directory !== directoryGeneration) return;
      const tenants = snapshot.docs.map(item => ({ id: item.id, name: item.data().name || item.id }))
        .sort((a, b) => a.name.localeCompare(b.name));
      const tenantId = tenants.some(item => item.id === state.tenantId) ? state.tenantId : tenants[0]?.id ?? null;
      const changes = { tenants, ready: true, error: '' };
      if (tenantId !== state.tenantId) activate(user.uid, tenantId, changes);
      else publish(changes);
    }, () => {
      if (directory === directoryGeneration) fail();
    });
  }, fail);
});

export function selectTenant(tenantId) {
  if (!state.ready || !state.tenants.some(item => item.id === tenantId)) throw new Error('Movie night access is unavailable');
  if (tenantId !== state.tenantId) activate(state.uid, tenantId);
}

export const captureTenant = () => session.capture();
export const onTenantReset = callback => {
  resetHandlers.add(callback);
  return () => resetHandlers.delete(callback);
};

function tenantPath(parts) {
  if (parts.some(part => typeof part !== 'string' || !part || part.includes('/'))) {
    throw new Error('Invalid tenant document path');
  }
  const { tenantId } = captureTenant();
  if (tenantId.includes('/')) throw new Error('Invalid tenant ID');
  return ['tenants', tenantId, ...parts];
}

export const tenantCollection = (...parts) => collection(db, ...tenantPath(parts));
export const tenantDoc = (...parts) => doc(db, ...tenantPath(parts));
