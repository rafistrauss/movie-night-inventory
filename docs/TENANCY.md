# Movie night tenants and memberships

An account can belong to multiple movie nights. Each movie night has independent
inventory, purchases, events, attendance, usage and financial reports. Accounts
with multiple memberships select a movie night in the navigation bar. An account
without memberships sees an access message and can sign out.

## Firestore structure and access

```
platformAdmins/{uid}                          # global administrator grant
tenants/{tenantId}                            # { name, memberUids: [uid, ...] }
tenants/{tenantId}/events/{eventId}
tenants/{tenantId}/events/{eventId}/attendees/{attendeeId}
tenants/{tenantId}/events/{eventId}/usage/{usageId}
tenants/{tenantId}/expenses/{expenseId}
tenants/{tenantId}/inventory/{itemId}          # optional legacy inventory
```

Membership grants read/write access to the tenant's application collections.
A `platformAdmins/{uid}` document grants access to every current and future
tenant. The frontend reads its own administrator document, then either lists all
tenants or queries `memberUids` with `array-contains` for its UID. Membership and
administrator documents cannot be written by clients, including administrators.
Provision them with the operator script or Firebase Console. Authentication email
alone does not confer access. Firestore rules enforce these grants on every
request. Legacy shared collections and the earlier `/users/{uid}` layout are denied.

The app watches tenant memberships and administrator status. Revoking the selected
tenant clears the current views and cache. Switching tenants or accounts destroys
keyed component instances and invalidates outstanding asynchronous work. Cache
keys include both UID and tenant ID. Caches are memory-only and the old shared
localStorage cache is discarded. Already-submitted writes can complete at their
original tenant path. Retry a write only after checking its original outcome.

## Provision accounts and tenants

Create email/password accounts in Firebase Authentication. Use Node 22+ with
operator Application Default Credentials, or add `--firebase-login` to use an
existing local Firebase CLI login. Credentials are kept outside the frontend.

```sh
node scripts/provision-tenant.js --project PROJECT_ID --tenant women --name "Women's movie night" --member WOMENS_ACCOUNT_EMAIL --admin ADMIN_EMAIL --dry-run
node scripts/provision-tenant.js --project PROJECT_ID --tenant women --name "Women's movie night" --member WOMENS_ACCOUNT_EMAIL --admin ADMIN_EMAIL --apply
node scripts/provision-tenant.js --project PROJECT_ID --tenant men --name "Men's movie night" --dry-run
node scripts/provision-tenant.js --project PROJECT_ID --tenant men --name "Men's movie night" --apply
```

After creating the men's account, run the same command for `men` with
`--member MENS_ACCOUNT_EMAIL`. Repeat `--member` for more than one account.
Provisioning adds memberships without removing existing members, and validates
all email addresses against Firebase Authentication before committing the batch.
To revoke access, remove the UID from the tenant's `memberUids` array in Firebase
Console. To revoke global access, delete the administrator grant document.

## Migration and release

The current shared records belong to Women's movie night. Men's movie night starts
empty. The administrator receives global access and the existing restricted
account receives membership only in Women's movie night. The new men's account
can be provisioned once created.

1. Record the deployed application revision and Firestore rules release/source.
   Pause privileged writers and choose a maintenance window for client edits.
2. Prepare a backup destination compatible with the database location. Substitute
   the verified legacy owner UID in a local copy of `firestore.migration.rules`.
   Those rules preserve owner-only legacy reads and tenant membership reads while
   denying all client writes. Deploy using `firebase.migration.json`, then back
   up the frozen dataset and rules. Verify the backup is readable and recoverable.
3. Provision tenant metadata, membership and administrator grants using the
   operator script. Run the migration dry-run and review paths and counts.

   ```sh
   node scripts/migrate-tenant.js --project PROJECT_ID --tenant women --dry-run
   node scripts/migrate-tenant.js --project PROJECT_ID --tenant women --apply
   node scripts/migrate-tenant.js --project PROJECT_ID --tenant women --apply
   ```

   Require `applied-and-verified` and the expected counts. The second apply must
   report `existing == total`. Compare inventory quantities, events, payments and
   financial totals with the legacy dataset before release.
4. Run the validation commands below. Deploy final `firestore.rules` first, then
   publish the tested application revision using the manual GitHub Pages workflow.
   Ask users to reload after the deployment. Verify the administrator can switch
   tenants, restricted accounts see only their memberships, and both legacy and
   unauthorized tenant requests fail.
5. Resume privileged writers only after updating their paths. Retain locked legacy
   records and backups for recovery. Deleting legacy records is a separate action.

Migration discovers all root collections except reserved `tenants`,
`platformAdmins` and `users`. Review unexpected roots before applying. It preserves
IDs, nested and orphan subcollections, timestamps and SDK field types. Actual
DocumentReference values into legacy roots are remapped to the target tenant.
ID/name string relationships remain unchanged. The operator CLI requires an
existing destination tenant. The migration library preflights every destination,
rejects conflicts and dangling event links, and copies only absent documents in
transactions that recheck source and destination. A final pass compares every
copied document and verifies unchanged sources. Rerunning an interrupted migration
is safe while sources remain frozen and targets match. It never deletes sources.
Once tenant edits begin, do not rerun as ongoing synchronization.

If verification fails, keep writes frozen and investigate against the backup.
After cutover, freeze writes again before recovery. Tenant edits made after cutover
need reconciliation before any old-app rollback. Restoring permissive legacy
rules would reopen cross-account access.

## Validation

```sh
npm test
npm run test:emulator
npm run lint
npm run build
```

The emulator runs with a demo project and never needs production credentials.
Use Java 21+ for current Firebase tooling. For a real Chromium smoke test, start
`npm run dev -- --host 127.0.0.1`, then run `npm run test:browser`. The browser test
connects to local Auth/Firestore emulators, blocks production service requests,
and exercises administrator switching, restricted login and live revocation.
Set `BROWSER_EXECUTABLE_PATH` to an installed Chromium browser if needed.

Unit tests exercise financial calculations and stale session/cache protection.
Emulator tests exercise shared memberships, foreign/anonymous denial, future
tenant access for global admins, denied access escalation, revocation, real service
CRUD and migration conflict/retry/type preservation. Existing Svelte accessibility,
unused-variable and bundle-size warnings are unrelated to tenant permissions.
