// Cache service to reduce redundant Firebase queries
class DataCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.cacheDuration = 30000; // 30 seconds cache
  }

  set(key, value) {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return null;
    
    const age = Date.now() - timestamp;
    if (age > this.cacheDuration) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  invalidate(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  invalidateAll() {
    this.cache.clear();
    this.timestamps.clear();
  }
}

export const dataCache = new DataCache();
