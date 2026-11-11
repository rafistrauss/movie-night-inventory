import { parseArgs } from 'node:util';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { migrate } from './migration.js';

try {
  const { values } = parseArgs({ options: {
    uid: { type: 'string' }, project: { type: 'string' },
    'dry-run': { type: 'boolean' }, apply: { type: 'boolean' }
  } });
  if (!values.uid || !values.project || Boolean(values.apply) === Boolean(values['dry-run'])) {
    throw new Error('Usage: node scripts/migrate-tenant.js --project PROJECT_ID --uid OWNER_UID (--dry-run | --apply)');
  }
  const app = initializeApp({ credential: applicationDefault(), projectId: values.project });
  await getAuth(app).getUser(values.uid); // Refuse accidental migration to a nonexistent account.
  await migrate(getFirestore(app), { uid: values.uid, apply: values.apply });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
