import { parseArgs } from 'node:util';
import { operatorClient } from './operator-client.js';
import { migrate } from './migration.js';

try {
  const { values } = parseArgs({ options: {
    tenant: { type: 'string' }, project: { type: 'string' },
    'firebase-login': { type: 'boolean' },
    'dry-run': { type: 'boolean' }, apply: { type: 'boolean' }
  } });
  if (!values.tenant || values.tenant.includes('/') || !values.project || Boolean(values.apply) === Boolean(values['dry-run'])) {
    throw new Error('Usage: node scripts/migrate-tenant.js --project PROJECT_ID --tenant TENANT_ID (--dry-run | --apply)');
  }
  const { db } = operatorClient(values.project, values['firebase-login']);
  if (!(await db.doc(`tenants/${values.tenant}`).get()).exists) throw new Error('Provision the destination tenant before migrating');
  await migrate(db, { tenantId: values.tenant, apply: values.apply });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
