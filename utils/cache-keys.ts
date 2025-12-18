/**
 * Standardized cache key generation utilities
 *
 * Provides consistent, collision-free key patterns for the unified cache system.
 * Keys follow the pattern: namespace:identifier:context
 */

/**
 * Simple deterministic hash function for objects
 * Used to create consistent cache keys from complex parameters
 */
export const hashParams = (params: Record<string, unknown>): string => {
  // Sort keys to ensure consistent ordering
  const sorted = Object.keys(params)
    .sort()
    .map((key) => {
      const value = params[key];

      // Handle arrays
      if (Array.isArray(value)) {
        return `${key}:${value.sort().join(',')}`;
      }

      // Handle objects
      if (value && typeof value === 'object') {
        return `${key}:${JSON.stringify(value)}`;
      }

      // Handle primitives
      return `${key}:${String(value)}`;
    })
    .join('|');

  // Create a simple hash (not cryptographic, just for cache keys)
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
};

/**
 * Cache key builders organized by namespace
 *
 * Each namespace represents a feature area with specific caching needs.
 * Keys are designed to be unique, readable, and enable efficient invalidation.
 */
export const CacheKeys = {
  /**
   * Home screen cache keys
   */
  home: {
    /**
     * Daily digest events for a specific date
     * @param month Month (1-12)
     * @param day Day of month (1-31)
     * @param year Optional year (defaults to current year context)
     */
    dailyDigest: (month: number, day: number, year?: number): string => {
      const monthStr = String(month).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');

      if (year) {
        const yearStr = String(year).padStart(4, '0');
        return `digest:${yearStr}-${monthStr}-${dayStr}`;
      }

      return `digest:${monthStr}-${dayStr}`;
    },

    /**
     * Weekly collections grid
     * @param weekKey ISO week key (e.g., "2024-W51")
     * @param limit Number of collections to fetch
     */
    weeklyCollections: (weekKey: string, limit: number): string => {
      return `collections:${weekKey}:${limit}`;
    },

    /**
     * Category chips for home screen
     */
    chips: (): string => {
      return 'chips';
    },
  },

  /**
   * Explore screen cache keys
   */
  explore: {
    /**
     * Story of the Day
     * @param dateKey Date in MM-DD format
     */
    sotd: (dateKey: string): string => {
      return `sotd:${dateKey}`;
    },

    /**
     * You Might Be Interested recommendations
     * @param userId User ID for personalization
     * @param categories User's selected categories
     * @param limit Number of recommendations
     * @param homeEventIds IDs of events on home (to exclude)
     */
    ymbi: (
      userId: string,
      categories: string[],
      limit: number,
      homeEventIds: string[]
    ): string => {
      // Hash params to create deterministic key
      // Only include first 10 homeEventIds to keep key stable
      const paramsHash = hashParams({
        categories: categories.sort(),
        limit,
        homeIds: homeEventIds.slice(0, 10).sort(),
      });

      return `ymbi:${userId}:${paramsHash}`;
    },

    /**
     * Search results
     * @param query Search query text
     * @param filters Applied filters (categories, era)
     * @param dateKey Date context (MM-DD format)
     */
    search: (
      query: string,
      filters: { categories?: string[]; era?: string },
      dateKey: string
    ): string => {
      const paramsHash = hashParams({
        q: query.toLowerCase().trim(),
        categories: filters.categories?.sort() || [],
        era: filters.era || '',
        date: dateKey,
      });

      return `search:${paramsHash}`;
    },
  },

  /**
   * Time Machine cache keys
   */
  timeMachine: {
    /**
     * Timeline for a specific year
     * @param year Year (1800-2024)
     * @param categories Optional category filter
     */
    timeline: (year: number, categories?: string): string => {
      if (categories) {
        return `timeline:${year}:${categories}`;
      }

      return `timeline:${year}`;
    },
  },

  /**
   * Event detail cache keys
   */
  event: {
    /**
     * Single event details
     * @param eventId Event identifier
     */
    detail: (eventId: string): string => {
      return `event:${eventId}`;
    },
  },

  /**
   * Collection cache keys
   */
  collection: {
    /**
     * Collection detail with items
     * @param collectionId Collection identifier
     */
    detail: (collectionId: string): string => {
      return `collection:${collectionId}`;
    },
  },
};

/**
 * Extract namespace from a cache key
 * Used for namespace-based invalidation
 */
export const getNamespaceFromKey = (key: string): string => {
  const parts = key.split(':');
  return parts[0] || '';
};
