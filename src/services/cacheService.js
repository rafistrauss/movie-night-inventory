// Enhanced cache service with longer TTL and localStorage persistence
class DataCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes cache (increased from 30 seconds)
    this.persistenceKey = 'movieNightCache';
    
    // Load from localStorage on init
    this.loadFromStorage();
  }

  set(key, value) {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    this.saveToStorage();
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return null;
    
    const age = Date.now() - timestamp;
    if (age > this.cacheDuration) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      this.saveToStorage();
      return null;
    }
    
    return this.cache.get(key);
  }

  invalidate(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    this.saveToStorage();
  }

  invalidateAll() {
    this.cache.clear();
    this.timestamps.clear();
    this.saveToStorage();
  }
  
  // Persist cache to localStorage
  saveToStorage() {
    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        timestamps: Array.from(this.timestamps.entries())
      };
      localStorage.setItem(this.persistenceKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }
  
  // Load cache from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (!stored) return;
      
      const data = JSON.parse(stored);
      this.cache = new Map(data.cache);
      this.timestamps = new Map(data.timestamps);
      
      // Clean expired entries
      const now = Date.now();
      for (const [key, timestamp] of this.timestamps.entries()) {
        if (now - timestamp > this.cacheDuration) {
          this.cache.delete(key);
          this.timestamps.delete(key);
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
      this.cache.clear();
      this.timestamps.clear();
    }
  }
}

export const dataCache = new DataCache();
