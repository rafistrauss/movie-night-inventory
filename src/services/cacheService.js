import { captureTenant, onTenantReset } from './tenantService';

// Memory only: Maps and Firebase Timestamps do not survive JSON serialization.
// Never restore the old shared localStorage cache into a tenant session.
class DataCache {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000;
    onTenantReset(() => this.invalidateAll());
    try { globalThis.localStorage?.removeItem('movieNightCache'); } catch { /* Storage may be disabled. */ }
  }

  key(key) { return `${captureTenant().uid}:${key}`; }

  set(key, value) {
    this.cache.set(this.key(key), { value, timestamp: Date.now() });
  }

  get(key) {
    const scopedKey = this.key(key);
    const entry = this.cache.get(scopedKey);
    if (!entry || Date.now() - entry.timestamp > this.cacheDuration) {
      this.cache.delete(scopedKey);
      return null;
    }
    return entry.value;
  }

  invalidate(key) { this.cache.delete(this.key(key)); }
  invalidateAll() { this.cache.clear(); }
}

export const dataCache = new DataCache();
