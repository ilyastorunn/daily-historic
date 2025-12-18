/**
 * Unified Cache Service
 *
 * Two-layer caching system for Daily Historic app:
 * - L1 (Session): In-memory Map for instant reads (<1ms)
 * - L2 (Persistent): AsyncStorage for cross-session persistence (10-30ms)
 *
 * Features:
 * - TTL-based expiration with date-awareness
 * - LRU eviction (max 500 entries)
 * - Version control for schema invalidation
 * - Network-aware stale data serving
 * - Request deduplication
 * - Size monitoring and analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNamespaceFromKey } from '@/utils/cache-keys';

const CACHE_KEY_PREFIX = '@daily_historic/unified_cache';
const MAX_SESSION_ENTRIES = 500;
const SIZE_WARNING_THRESHOLD = 100 * 1024; // 100KB per entry

/**
 * Cache options for individual entries
 */
export type CacheOptions<T = unknown> = {
  ttl: number; // Time-to-live in milliseconds
  namespace: string; // Organization namespace (home, explore, etc.)
  version?: number; // Schema version for invalidation
  allowStaleOffline?: boolean; // Serve stale data when offline
  validate?: (data: T) => boolean; // Custom validation function
};

/**
 * Cache entry stored in AsyncStorage
 */
type CacheEntry<T = unknown> = {
  data: T;
  timestamp: number; // Creation timestamp
  version: number; // Schema version
  namespace: string;
  key: string;
  expiresAt: number; // Pre-calculated expiry time for fast checks
};

/**
 * Cache statistics for monitoring
 */
export type CacheStats = {
  sessionSize: number; // L1 cache entries
  persistentSizeEstimate: number; // Estimated L2 size in bytes
  hitRate: number; // Cache hit percentage
  byNamespace: Record<
    string,
    {
      hits: number;
      misses: number;
      size: number;
    }
  >;
};

/**
 * Network status for offline support
 */
type NetworkStatus = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
};

/**
 * Unified Cache Service Implementation
 */
class CacheService {
  // L1: Session cache (in-memory Map)
  private sessionCache: Map<string, CacheEntry> = new Map();

  // LRU tracking: access order for eviction
  private accessOrder: string[] = [];

  // Request deduplication: track in-flight promises
  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  // Analytics tracking
  private stats = {
    hits: 0,
    misses: 0,
    byNamespace: new Map<
      string,
      {
        hits: number;
        misses: number;
        size: number;
      }
    >(),
  };

  // Network status
  private networkStatus: NetworkStatus = {
    isConnected: true,
    isInternetReachable: true,
  };

  /**
   * Get value from cache (L1 → L2)
   */
  async get<T>(key: string, options: CacheOptions<T>): Promise<T | null> {
    const fullKey = this.buildFullKey(key);
    const namespace = options.namespace;

    // Check L1 (session cache)
    const sessionEntry = this.sessionCache.get(fullKey) as CacheEntry<T> | undefined;
    if (sessionEntry) {
      if (this.isValidEntry<T>(sessionEntry, options)) {
        this.trackAccess(fullKey, namespace);
        this.trackHit(namespace);
        console.log(`[Cache] L1 HIT: ${key}`);
        return sessionEntry.data;
      } else {
        // Expired or invalid - remove from L1
        this.sessionCache.delete(fullKey);
      }
    }

    // Check L2 (AsyncStorage)
    try {
      const stored = await AsyncStorage.getItem(fullKey);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);

        // Validate entry
        if (this.isValidEntry(entry, options)) {
          // Populate L1 for faster future access
          this.setSessionCache(fullKey, entry);
          this.trackAccess(fullKey, namespace);
          this.trackHit(namespace);
          console.log(`[Cache] L2 HIT: ${key}`);
          return entry.data;
        } else {
          // Expired or invalid - remove from L2
          await AsyncStorage.removeItem(fullKey);
          console.log(`[Cache] Expired entry removed: ${key}`);
        }
      }
    } catch (error) {
      console.warn('[Cache] L2 read error:', error);
    }

    // Cache miss
    this.trackMiss(namespace);
    console.log(`[Cache] MISS: ${key}`);
    return null;
  }

  /**
   * Set value in cache (L1 + L2)
   */
  async set<T>(key: string, data: T, options: CacheOptions<T>): Promise<void> {
    const fullKey = this.buildFullKey(key);
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      version: options.version ?? 1,
      namespace: options.namespace,
      key,
      expiresAt: now + options.ttl,
    };

    // Validate data if custom validator provided
    if (options.validate && !options.validate(data)) {
      console.warn('[Cache] Validation failed, not caching:', key);
      return;
    }

    // Check size and warn if large
    const size = this.estimateSize(data);
    if (size > SIZE_WARNING_THRESHOLD) {
      console.warn(
        `[Cache] Large entry (${Math.round(size / 1024)}KB):`,
        key
      );
    }

    // Write to L1 (session cache)
    this.setSessionCache(fullKey, entry);

    // Write to L2 (AsyncStorage)
    try {
      await AsyncStorage.setItem(fullKey, JSON.stringify(entry));
      this.trackWrite(options.namespace);
      console.log(`[Cache] WRITE: ${key} (TTL: ${options.ttl}ms)`);
    } catch (error) {
      console.error('[Cache] L2 write error:', error);
      // Still keep in L1 even if L2 fails
    }
  }

  /**
   * Invalidate specific cache entry
   */
  async invalidate(namespace: string, key: string): Promise<void> {
    const fullKey = this.buildFullKey(key);

    // Remove from L1
    this.sessionCache.delete(fullKey);
    this.accessOrder = this.accessOrder.filter((k) => k !== fullKey);

    // Remove from L2
    try {
      await AsyncStorage.removeItem(fullKey);
      console.log(`[Cache] Invalidated: ${key}`);
    } catch (error) {
      console.warn('[Cache] Invalidation error:', error);
    }
  }

  /**
   * Invalidate all entries in a namespace
   */
  async invalidateNamespace(namespace: string): Promise<void> {
    console.log(`[Cache] Invalidating namespace: ${namespace}`);

    // Get all keys from L2
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const namespaceKeys = allKeys.filter((fullKey) => {
        if (!fullKey.startsWith(CACHE_KEY_PREFIX)) return false;

        const key = fullKey.replace(`${CACHE_KEY_PREFIX}:`, '');
        return getNamespaceFromKey(key) === namespace;
      });

      // Remove from L1
      namespaceKeys.forEach((fullKey) => {
        this.sessionCache.delete(fullKey);
        this.accessOrder = this.accessOrder.filter((k) => k !== fullKey);
      });

      // Remove from L2
      await AsyncStorage.multiRemove(namespaceKeys);
      console.log(
        `[Cache] Cleared ${namespaceKeys.length} entries from namespace: ${namespace}`
      );
    } catch (error) {
      console.error('[Cache] Namespace invalidation error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    console.log('[Cache] Clearing all caches');

    // Clear L1
    this.sessionCache.clear();
    this.accessOrder = [];

    // Clear L2
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((key) =>
        key.startsWith(CACHE_KEY_PREFIX)
      );
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`[Cache] Cleared ${cacheKeys.length} entries from storage`);
    } catch (error) {
      console.error('[Cache] Clear all error:', error);
    }

    // Reset stats
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.byNamespace.clear();
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    // Estimate L2 size
    let persistentSizeEstimate = 0;
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((key) =>
        key.startsWith(CACHE_KEY_PREFIX)
      );

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          persistentSizeEstimate += value.length;
        }
      }
    } catch (error) {
      console.warn('[Cache] Stats calculation error:', error);
    }

    const byNamespace: Record<
      string,
      { hits: number; misses: number; size: number }
    > = {};
    this.stats.byNamespace.forEach((value, key) => {
      byNamespace[key] = value;
    });

    return {
      sessionSize: this.sessionCache.size,
      persistentSizeEstimate,
      hitRate,
      byNamespace,
    };
  }

  /**
   * Get pending request (for deduplication)
   */
  getPendingRequest<T>(key: string): Promise<T> | null {
    const fullKey = this.buildFullKey(key);
    return (this.pendingRequests.get(fullKey) as Promise<T>) || null;
  }

  /**
   * Set pending request (for deduplication)
   */
  setPendingRequest<T>(key: string, promise: Promise<T>): void {
    const fullKey = this.buildFullKey(key);
    this.pendingRequests.set(fullKey, promise);

    // Auto-cleanup when promise resolves
    promise
      .finally(() => {
        this.pendingRequests.delete(fullKey);
      })
      .catch(() => {
        // Ignore errors - just cleanup
      });
  }

  /**
   * Set network status (for offline support)
   */
  setNetworkStatus(status: NetworkStatus): void {
    this.networkStatus = status;
    console.log('[Cache] Network status updated:', status);
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  // ============ Private Helper Methods ============

  /**
   * Build full key with prefix
   */
  private buildFullKey(key: string): string {
    return `${CACHE_KEY_PREFIX}:${key}`;
  }

  /**
   * Validate cache entry (TTL, version, custom validation)
   */
  private isValidEntry<T>(
    entry: CacheEntry<T>,
    options: CacheOptions<T>
  ): boolean {
    const now = Date.now();

    // Check TTL expiration
    if (now > entry.expiresAt) {
      // If offline and stale allowed, serve stale data
      if (
        options.allowStaleOffline &&
        !this.networkStatus.isConnected
      ) {
        console.log('[Cache] Serving stale data (offline):', entry.key);
        return true;
      }
      return false;
    }

    // Check version
    if (options.version && entry.version !== options.version) {
      console.log(
        `[Cache] Version mismatch: ${entry.key} (cached: ${entry.version}, expected: ${options.version})`
      );
      return false;
    }

    // Custom validation
    if (options.validate && !options.validate(entry.data)) {
      console.log('[Cache] Custom validation failed:', entry.key);
      return false;
    }

    return true;
  }

  /**
   * Set session cache with LRU eviction
   */
  private setSessionCache<T>(fullKey: string, entry: CacheEntry<T>): void {
    // Add to cache
    this.sessionCache.set(fullKey, entry);

    // Update access order
    this.accessOrder = this.accessOrder.filter((k) => k !== fullKey);
    this.accessOrder.push(fullKey);

    // LRU eviction if over limit
    if (this.sessionCache.size > MAX_SESSION_ENTRIES) {
      const evictKey = this.accessOrder.shift();
      if (evictKey) {
        this.sessionCache.delete(evictKey);
        console.log('[Cache] LRU eviction:', evictKey);
      }
    }
  }

  /**
   * Track cache access (update LRU order)
   */
  private trackAccess(fullKey: string, namespace: string): void {
    this.accessOrder = this.accessOrder.filter((k) => k !== fullKey);
    this.accessOrder.push(fullKey);

    // Update namespace stats
    const nsStats = this.stats.byNamespace.get(namespace);
    if (nsStats) {
      nsStats.size = this.sessionCache.size;
    }
  }

  /**
   * Track cache hit
   */
  private trackHit(namespace: string): void {
    this.stats.hits++;

    const nsStats = this.stats.byNamespace.get(namespace) || {
      hits: 0,
      misses: 0,
      size: 0,
    };
    nsStats.hits++;
    this.stats.byNamespace.set(namespace, nsStats);
  }

  /**
   * Track cache miss
   */
  private trackMiss(namespace: string): void {
    this.stats.misses++;

    const nsStats = this.stats.byNamespace.get(namespace) || {
      hits: 0,
      misses: 0,
      size: 0,
    };
    nsStats.misses++;
    this.stats.byNamespace.set(namespace, nsStats);
  }

  /**
   * Track cache write
   */
  private trackWrite(namespace: string): void {
    const nsStats = this.stats.byNamespace.get(namespace) || {
      hits: 0,
      misses: 0,
      size: 0,
    };
    nsStats.size = this.sessionCache.size;
    this.stats.byNamespace.set(namespace, nsStats);
  }

  /**
   * Estimate data size in bytes
   */
  private estimateSize(data: unknown): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
