# UID tenant isolation and production migration

One Firebase Authentication UID is one tenant. Authentication and login remain
unchanged. Account creation/provisioning is still through the existing Firebase
Authentication administration flow; no tenant-selection or signup UI is added.
A new account needs no Firestore provisioning and starts empty.

## Architecture and security

All application documents now live at:

```
users/{uid}/events/{eventId}
users/{uid}/events/{eventId}/attendees/{attendeeId}
users/{uid}/events/{eventId}/usage/{usageId}
users/{uid}/expenses/{expenseId}
users/{uid}/inventory/{itemId}       # legacy optional collection, preserved
```

Inventory is calculated from expenses and event usage, rather than written to an
inventory collection. Dashboard, reporting and amortization reuse those scoped
services. Relationships currently use event IDs and item names; IDs do not change.
There are no Firestore snapshot listeners or collection-group queries in the app.

`tenantService.js` owns path construction, authentication readiness, and reset
notifications. It rejects unauthenticated access and path segments containing `/`.
`TenantSession` guards every async service continuation, including nested report
calculations. Component instances capture their login generation and guard async
actions before starting them and after completion. Before an auth transition the
UI is cleared, the cache is emptied, and keyed views are destroyed. Returning to
the same UID creates a fresh generation. Pending writes already submitted to
Firestore can still finish at their original path; they are never redirected to
the next account. Do not retry a write blindly if its result became unknown.

The cache is UID-keyed, memory-only and cleared on every auth transition. The old
shared `movieNightCache` localStorage entry is removed, never restored. This also
avoids corrupting Maps and Firestore timestamps through JSON serialization.
Firestore disk persistence is not enabled by this application.

The final rules allow an authenticated UID only inside its own `/users/{uid}`
subtree, including future nested collections. Other user subtrees, legacy roots
and unauthenticated requests are denied. There is no public application data.
The UID path is the security boundary; frontend filtering is not relied upon.
Admin SDK bypasses rules and is used only by operator scripts and tests.

## Local validation

Use Node 22+ and Java 21 for Firebase tooling. No credentials are needed for the
demo Firestore Emulator project. Run:

```sh
npm ci
npm test
npm run test:emulator
npm run lint
npm run build
```

For the optional Chromium UI smoke test (two local emulator accounts), start
`npm run dev -- --host 127.0.0.1` in another terminal, then run:

```sh
npx playwright install chromium
npm run test:browser
```

Alternatively set `BROWSER_EXECUTABLE_PATH` to an existing Chromium executable.
The test intercepts only the dev Firebase module to connect to local emulators,
blocks production Firebase requests, and checks logout/account switching for
transient private DOM data. It does not edit production configuration.

The project is JavaScript and has no configured TypeScript type-check command.
Svelte checking was additionally run with `svelte-check` (zero errors).
The Svelte/Vite build validates compilation. Existing oxlint Svelte unused-variable,
accessibility, and bundle-size warnings are separate from tenant isolation.
PR CI runs the unit tests, emulator tests, lint and build. Tests cover own/foreign/
anonymous access, denied legacy access, real-service CRUD/bulk writes, inventory,
financials, stale account requests and caches, plus migration preservation,
references, dry-run, retries and conflicts. The service integration test uses an
emulator administrative test context to switch simulated auth identities; rules
are independently tested with real authenticated emulator contexts.

## Migration behavior

`npm run migrate:tenant -- --project PROJECT_ID --uid OWNER_UID --dry-run`
recursively inventories **all root collections except `users`**, including missing
parent documents with surviving subcollections. Review every COPY/KEEP line and
the per-collection counts. Unexpected roots must be reviewed before applying;
the script intentionally includes discovered legacy data instead of losing it.
The script validates that the explicitly supplied UID exists in Firebase Auth.
It cannot determine the historical owner from shared records: confirm this UID
with the original operator in Firebase Console > Authentication. Do not assign
shared production data to the currently logged-in account by assumption.

`--dry-run` is mandatory unless `--apply` is explicitly supplied. The script never
deletes source records. IDs, nested paths, field timestamps and SDK values are
preserved; actual Firestore DocumentReference values pointing to legacy roots
are remapped under the owner. ID/name string relationships are unchanged. Firestore
system create/update metadata on the newly created copies is naturally new.
Dangling eventId fields or actual legacy document references stop preflight;
missing parent documents alone do not prevent preserving their subcollections.

All destination conflicts are preflighted before writing. Identical documents
are skipped; different data is an error, never overwritten. Each copy then uses
an Admin transaction to recheck its source and destination and create only when
absent. Finally all source paths/data and every destination are reread and
compared; the source count and collection counts are reported. A mid-run error
can leave a partial destination copy: fix the cause, keep writes frozen and
rerun. Retrying identical source data is idempotent. No blind merge is performed.
After tenant writes resume, rerunning can correctly report conflicts: it is a
one-time migration, not ongoing synchronization.

Discovery holds the plan in memory and reads documents individually, trading
speed for reviewability and conflict safety. Budget reads/writes and maintenance
time for the actual dataset. There is no cross-dataset atomic snapshot: the
client write freeze and a pause of all privileged writers are required.

## Coordinated rollout (operator actions, never automatic)

Deployment is now **manual** (`workflow_dispatch`), because the old workflow
published every merge to master before migration could be verified. Merging
this branch does not deploy the app. Firebase rules are also deployed separately.
Do not release this UI against the old shared-data rules.

1. Schedule maintenance and pause all Admin jobs, imports and other privileged
   writers. Record the current master commit, deployed Pages artifact, Firebase
   rules release, and existing rules source. Keep these in the change record.
   Validate in a separate staging Firebase project before production rollout.
2. Identify and verify the original owner's UID. Prepare a Firestore export
   bucket with the documented Firestore service-agent IAM permissions and
   compatible location. Use operator ADC outside the frontend (e.g.
   `gcloud auth application-default login`). Never commit service-account keys.
3. Replace `OWNER_UID_REPLACE_ME` in `firestore.migration.rules` with the verified
   owner UID, correctly escaped as a Firestore rules string. Review the diff.
   This temporary ruleset preserves the owner's legacy reads while freezing
   **all client writes**, including tenant writes. Its explicit legacy roots
   match the actual repository; if discovery finds additional roots, add
   equivalent owner-only read matches after reviewing them. Existing source
   records remain readable before migration finishes. Keep users informed that
   edits are paused. Deploy the freeze, then back up the frozen dataset:

   ```sh
   export PROJECT_ID='your-firebase-project-id'
   export OWNER_UID='the-verified-original-owner-uid'
   export BACKUP_URI='gs://your-firestore-backups/pre-tenancy-YYYYMMDD-HHMM'
   npx firebase deploy --only firestore:rules --project "$PROJECT_ID" --config firebase.migration.json
   gcloud firestore export "$BACKUP_URI" --project "$PROJECT_ID"
   gcloud firestore operations list --project "$PROJECT_ID"
   ```

   Confirm export completion, record its full output URI, and test restoration
   into a separate project. Also save an independent offsite copy of the rules.
4. With writes still frozen, review a dry-run and then apply:

   ```sh
   npm run migrate:tenant -- --project "$PROJECT_ID" --uid "$OWNER_UID" --dry-run
   npm run migrate:tenant -- --project "$PROJECT_ID" --uid "$OWNER_UID" --apply
   npm run migrate:tenant -- --project "$PROJECT_ID" --uid "$OWNER_UID" --apply
   ```

   Save output in the change record. Require `applied-and-verified`, expected
   counts, and a second run with `existing == total`. Check owner event names,
   attendee payments, inventory quantities, and financial totals against the
   legacy UI. Do not proceed on conflicts, changed sources or dangling references.
5. After verification and explicit release approval, merge/review the release
   commit through normal repository procedures. During maintenance deploy final
   rules first, then publish that exact application revision:

   ```sh
   npm test
   npm run test:emulator
   npm run lint
   npm run build
   npx firebase deploy --only firestore:rules --project "$PROJECT_ID" --config firebase.json
   gh workflow run deploy.yml --repo rafistrauss/movie-night-inventory --ref master
   gh run list --repo rafistrauss/movie-night-inventory --workflow deploy.yml --limit 3
   ```

   Final rules deny all legacy root access. Old tabs may receive denied requests
   between rules publication and refreshing the new app; ask users to reload.
   Do not reopen root access to make old clients work. Wait for Pages deployment
   completion and verify the loaded version before ending maintenance.
6. Smoke-test two independent Firebase accounts: original owner sees migrated
   data; a new account starts empty; each creates/edits inventory purchases,
   events, attendance and usage and sees isolated dashboards/financials. Logout,
   switch accounts in the same browser and reload. Confirm no old records flash
   and direct cross-UID/legacy requests fail. Re-enable privileged jobs only
   after updating their paths. Keep legacy data locked and retained for the
   agreed backup retention period; deletion is a separate approved operation.

The migration/template, export and deploy commands above are operator procedures;
none are run by tests or automatically during build/deployment. Do not commit the
production owner UID substituted into the migration template.

## Rollback

Before cutover, leave the legacy source untouched: stop on any verification error
and keep the freeze rules in place while investigating. No deletion is needed to
retry. Do not overwrite conflicts; compare them to the export and obtain an
explicit repair decision.

After cutover, first restore the freeze rules to stop new client writes (and
pause privileged writers), and back up both datasets. Prefer rolling back to a
previous **tenant-compatible** app artifact while keeping final tenant rules.
Rolling back to the old root-based app after new tenant writes would hide newer
data. Reconcile tenant-only changes into a reviewed copy of the old dataset or
restore/test an export in a separate project before any old-app rollback.

A tested export can be restored to a separate recovery project with:

```sh
gcloud firestore import "$BACKUP_URI" --project "$RECOVERY_PROJECT_ID"
```

An import can overwrite matching records; never import over live production as
an automatic rollback. If an old-app rollback is necessary, serve maintenance
until reconciliation is complete, manually deploy owner-only legacy read/write
rules (never the former any-authenticated-user rules), then restore the recorded
Pages artifact. Keep new user tenants inaccessible to the old app and retained
for later recovery. Record all changes and verify financial totals again.
