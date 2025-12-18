/**
 * API Helpers with Unified Caching
 *
 * Provides fetchWithCache wrapper that integrates services with the unified cache system.
 * Handles:
 * - Request deduplication (prevent duplicate simultaneous fetches)
 * - Force refresh support (for pull-to-refresh)
 * - Stale-while-revalidate logic
 * - Analytics event tracking
 */

import { cacheService, type CacheOptions } from '@/services/cache-service';
import { trackEvent } from '@/services/analytics';

export type FetchWithCacheOptions<T> = CacheOptions<T> & {
  forceRefresh?: boolean; // Skip cache and force fresh fetch
  onCacheHit?: (data: T) => void; // Callback on cache hit
  onCacheMiss?: () => void; // Callback on cache miss
};

/**
 * Unified fetch wrapper with caching, deduplication, and offline support
 *
 * @param key Cache key (from CacheKeys utility)
 * @param fetcher Function that performs the actual data fetch
 * @param options Caching options (TTL, namespace, version, etc.)
 * @returns Fetched or cached data
 *
 * @example
 * ```typescript
 * const data = await fetchWithCache(
 *   CacheKeys.home.dailyDigest(12, 17),
 *   () => fetchDailyDigestFromFirestore(12, 17),
 *   {
 *     ttl: 24 * 60 * 60 * 1000, // 24 hours
 *     namespace: 'home',
 *     version: 1,
 *     allowStaleOffline: true,
 *   }
 * );
 * ```
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: FetchWithCacheOptions<T>
): Promise<T> {
  const {
    forceRefresh = false,
    onCacheHit,
    onCacheMiss,
    ...cacheOptions
  } = options;

  // Force refresh: skip cache and fetch fresh
  if (forceRefresh) {
    console.log(`[API] Force refresh: ${key}`);
    trackEvent('cache_force_refresh', {
      namespace: cacheOptions.namespace,
      key,
    });

    const data = await executeFetch(key, fetcher, cacheOptions);
    return data;
  }

  // Check cache (L1 → L2)
  const cached = await cacheService.get<T>(key, cacheOptions);
  if (cached !== null) {
    onCacheHit?.(cached);
    trackEvent('cache_hit', {
      namespace: cacheOptions.namespace,
      key,
      source: 'unified',
    });
    return cached;
  }

  // Check for in-flight request (deduplication)
  const pending = cacheService.getPendingRequest<T>(key);
  if (pending) {
    console.log(`[API] Deduplicating request: ${key}`);
    trackEvent('cache_deduplicate', {
      namespace: cacheOptions.namespace,
      key,
    });
    return pending;
  }

  // Cache miss - execute fetch
  onCacheMiss?.();
  trackEvent('cache_miss', {
    namespace: cacheOptions.namespace,
    key,
  });

  const data = await executeFetch(key, fetcher, cacheOptions);
  return data;
}

/**
 * Execute fetch with error handling and cache writing
 */
async function executeFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  cacheOptions: CacheOptions<T>
): Promise<T> {
  // Create promise and track it (for deduplication)
  const promise = fetcher();
  cacheService.setPendingRequest(key, promise);

  try {
    const data = await promise;

    // Write to cache
    await cacheService.set(key, data, cacheOptions);

    trackEvent('cache_write', {
      namespace: cacheOptions.namespace,
      key,
      size: estimateSize(data),
    });

    return data;
  } catch (error) {
    // On error, try to serve stale data if offline mode allows it
    if (cacheOptions.allowStaleOffline) {
      const networkStatus = cacheService.getNetworkStatus();
      if (!networkStatus.isConnected) {
        console.log(`[API] Fetch failed, trying stale data: ${key}`);

        // Temporarily allow stale data by setting a very old TTL check
        const stale = await cacheService.get<T>(key, {
          ...cacheOptions,
          ttl: Number.MAX_SAFE_INTEGER, // Accept any age
        });

        if (stale !== null) {
          console.log(`[API] Serving stale data (offline fallback): ${key}`);
          trackEvent('cache_stale_fallback', {
            namespace: cacheOptions.namespace,
            key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return stale;
        }
      }
    }

    // No stale data available or not offline - propagate error
    trackEvent('cache_fetch_error', {
      namespace: cacheOptions.namespace,
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Estimate data size for analytics
 */
function estimateSize(data: unknown): number {
  try {
    return JSON.stringify(data).length;
  } catch {
    return 0;
  }
}

/**
 * Helper to build cache options with common patterns
 */
export const CachePresets = {
  /**
   * Daily content (24h TTL, date-aware)
   */
  daily: (namespace: string): Omit<CacheOptions, 'ttl'> & { ttl: number } => ({
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    namespace,
    version: 1,
    allowStaleOffline: true,
  }),

  /**
   * Weekly content (7d TTL)
   */
  weekly: (namespace: string): Omit<CacheOptions, 'ttl'> & { ttl: number } => ({
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    namespace,
    version: 1,
    allowStaleOffline: true,
  }),

  /**
   * Short-lived content (6h TTL)
   */
  shortLived: (namespace: string): Omit<CacheOptions, 'ttl'> & { ttl: number } => ({
    ttl: 6 * 60 * 60 * 1000, // 6 hours
    namespace,
    version: 1,
    allowStaleOffline: true,
  }),

  /**
   * Static content (30d TTL, good for historical data)
   */
  static: (namespace: string): Omit<CacheOptions, 'ttl'> & { ttl: number } => ({
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
    namespace,
    version: 1,
    allowStaleOffline: true,
  }),
};
