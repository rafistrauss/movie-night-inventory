import { parseArgs } from 'node:util';
import { operatorClient } from './operator-client.js';

try {
  const { values } = parseArgs({ options: {
    project: { type: 'string' }, tenant: { type: 'string' }, name: { type: 'string' },
    member: { type: 'string', multiple: true }, admin: { type: 'string' },
    'firebase-login': { type: 'boolean' },
    'dry-run': { type: 'boolean' }, apply: { type: 'boolean' }
  } });
  if (!values.project || !values.tenant || values.tenant.includes('/') || !values.name?.trim() ||
      Boolean(values.apply) === Boolean(values['dry-run'])) {
    throw new Error('Usage: node scripts/provision-tenant.js --project PROJECT --tenant ID --name NAME [--member EMAIL] [--admin EMAIL] (--dry-run | --apply)');
  }
  const { auth, db } = operatorClient(values.project, values['firebase-login']);
  const members = await Promise.all((values.member || []).map(email => auth.getUserByEmail(email)));
  const admin = values.admin ? await auth.getUserByEmail(values.admin) : null;
  console.log(JSON.stringify({ tenantId: values.tenant, name: values.name.trim(),
    addedMembers: members.map(user => ({ uid: user.uid, email: user.email })),
    administrator: admin ? { uid: admin.uid, email: admin.email } : null,
    mode: values.apply ? 'apply' : 'dry-run' }, null, 2));
  if (values.apply) {
    await db.runTransaction(async transaction => {
      const tenant = db.doc(`tenants/${values.tenant}`);
      const current = await transaction.get(tenant);
      const existingMembers = current.data()?.memberUids ?? [];
      if (!Array.isArray(existingMembers)) throw new Error('Existing tenant memberships must be an array');
      const memberUids = [...new Set([...existingMembers, ...members.map(user => user.uid)])];
      transaction.set(tenant, { name: values.name.trim(), memberUids }, { merge: true });
      if (admin) transaction.set(db.doc(`platformAdmins/${admin.uid}`), { email: admin.email });
    });
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
