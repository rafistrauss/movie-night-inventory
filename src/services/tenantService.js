import { beforeAuthStateChanged, onAuthStateChanged } from 'firebase/auth';
import { collection, doc } from 'firebase/firestore';
import { writable } from 'svelte/store';
import { auth, db } from '../firebase';
import { TenantSession } from './tenantSession';

const session = new TenantSession(() => auth.currentUser?.uid);
export const tenantState = writable({ uid: null, generation: 0, ready: false });
const resetHandlers = new Set();

function activate(uid, ready) {
  session.activate(uid);
  for (const reset of resetHandlers) reset();
  tenantState.set({ uid, generation: session.generation, ready });
}

// Clear the rendered tenant before Firebase commits an account transition.
beforeAuthStateChanged(auth, user => {
  if ((user?.uid ?? null) !== (auth.currentUser?.uid ?? null)) activate(null, false);
});
onAuthStateChanged(auth, user => activate(user?.uid ?? null, true));

export const captureTenant = () => session.capture();
export const onTenantReset = callback => {
  resetHandlers.add(callback);
  return () => resetHandlers.delete(callback);
};

function tenantPath(parts) {
  if (parts.some(part => typeof part !== 'string' || !part || part.includes('/'))) {
    throw new Error('Invalid tenant document path');
  }
  const { uid } = captureTenant();
  if (uid.includes('/')) throw new Error('Invalid tenant UID');
  return ['users', uid, ...parts];
}

export const tenantCollection = (...parts) => collection(db, ...tenantPath(parts));
export const tenantDoc = (...parts) => doc(db, ...tenantPath(parts));
