import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

assert.ok(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Run through npm run test:browser');
const projectId = 'demo-movie-tenants';
async function account(email) {
  const result = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'Testing123!', returnSecureToken: true })
  });
  const data = await result.json();
  assert.ok(data.localId, JSON.stringify(data));
  return data.localId;
}
const uidA = await account('tenant-a@example.com');
await account('tenant-b@example.com');
const app = initializeApp({ projectId });
const db = getFirestore(app);
await db.doc(`users/${uidA}/events/secret-a`).set({ name: 'Private Alpha Movie', date: Timestamp.fromDate(new Date('2026-01-01')) });
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Redirect only the browser's dev Firebase module to disposable local emulators.
  // No application config, credentials or production data are changed.
  await page.route(/\/src\/firebase\.js(?:\?|$)/, async route => {
    const response = await route.fetch();
    let body = await response.text();
    body = body.split('//# sourceMappingURL=')[0];
    const authModule = body.match(/from "([^"]*firebase_auth.js[^"]*)"/)[1];
    const firestoreModule = body.match(/from "([^"]*firebase_firestore.js[^"]*)"/)[1];
    body = body.replace('projectId: "movie-night-fc78c"', `projectId: "${projectId}"`);
    body += `\nimport {connectAuthEmulator} from '${authModule}';\nimport {connectFirestoreEmulator} from '${firestoreModule}';\nconnectAuthEmulator(auth, 'http://127.0.0.1:9099', {disableWarnings:true});\nconnectFirestoreEmulator(db, '127.0.0.1', 8080);`;
    await route.fulfill({ response, body });
  });
  // Block any unintended production service connection.
  await page.route(/https:\/\/.*(?:googleapis\.com|firebaseio\.com)/, route => route.abort());
  await page.goto('http://localhost:5173/movie-night-inventory/');
  async function login(email) {
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('Testing123!');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.getByRole('button', { name: 'Logout', exact: true }).waitFor();
  }
  await login('tenant-a@example.com');
  await page.getByRole('button', { name: 'Events', exact: true }).click();
  await page.getByText('Private Alpha Movie', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await page.locator('#email').waitFor();
  assert.equal(await page.getByText('Private Alpha Movie', { exact: true }).count(), 0);
  // Watch every DOM update during B's login for a transient old record.
  await page.evaluate(() => {
    window.oldTenantFlashed = false;
    new MutationObserver(() => {
      if (document.body.textContent.includes('Private Alpha Movie')) window.oldTenantFlashed = true;
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  await login('tenant-b@example.com');
  await page.getByRole('button', { name: 'Events', exact: true }).click();
  await page.getByText('No events yet', { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => window.oldTenantFlashed), false);
  assert.equal(await page.getByText('Private Alpha Movie', { exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: real Chromium login A -> logout -> login B; isolated views, no stale DOM flash, no page errors.');
} finally { await browser.close(); }
