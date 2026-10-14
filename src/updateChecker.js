// Detects newer deployments (Safari/iOS aggressively caches the page) and prompts a reload.
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
let bannerShown = false;

async function isOutdated() {
  try {
    const url = `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return false;
    const { buildId } = await res.json();
    console.info("buildId:", buildId)
    return buildId !== __BUILD_ID__;
  } catch {
    return false;
  }
}

async function reloadFresh() {
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    } catch {}
  }
  // Changing the query string forces Safari to refetch index.html
  const url = new URL(window.location.href);
  url.searchParams.set('v', Date.now());
  window.location.replace(url.toString());
}

function showBanner() {
  if (bannerShown) return;
  bannerShown = true;
  const banner = document.createElement('div');
  banner.style.cssText =
    'position:fixed;left:0;right:0;bottom:0;z-index:2000;display:flex;gap:0.75rem;align-items:center;' +
    'justify-content:center;padding:0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));' +
    'background:#2c3e50;color:white;font-size:0.95rem;box-shadow:0 -2px 8px rgba(0,0,0,0.3);';
  const text = document.createElement('span');
  text.textContent = 'A new version is available.';
  const button = document.createElement('button');
  button.textContent = 'Update now';
  button.style.cssText =
    'background:#3498db;color:white;border:none;border-radius:4px;padding:0.5rem 1rem;font-size:0.95rem;cursor:pointer;';
  button.addEventListener('click', reloadFresh);
  banner.append(text, button);
  document.body.appendChild(banner);
}

async function check() {
  if (!bannerShown && (await isOutdated())) showBanner();
}

export function startUpdateChecker() {
  if (import.meta.env.DEV) return;
  check();
  setInterval(check, CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  window.addEventListener('pageshow', check);
}
