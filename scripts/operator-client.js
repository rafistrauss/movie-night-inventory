import { createRequire } from 'node:module';
import { applicationDefault, initializeApp, refreshToken } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

// Firebase CLI credentials stay in memory and are never written into the repo.
export function operatorClient(projectId, firebaseLogin = false) {
  if (!firebaseLogin) {
    const app = initializeApp({ projectId, credential: applicationDefault() });
    return { db: getFirestore(app), auth: getAuth(app) };
  }
  const require = createRequire(import.meta.url);
  const { getGlobalDefaultAccount } = require('firebase-tools/lib/auth.js');
  const { clientId, clientSecret } = require('firebase-tools/lib/api.js');
  const account = getGlobalDefaultAccount();
  if (!account?.tokens?.refresh_token) throw new Error('Run firebase login before using --firebase-login');
  const credentials = {
    type: 'authorized_user', client_id: clientId(), client_secret: clientSecret(),
    refresh_token: account.tokens.refresh_token
  };
  const app = initializeApp({ projectId, credential: refreshToken(credentials) });
  return { db: new Firestore({ projectId, credentials, preferRest: true }), auth: getAuth(app) };
}
