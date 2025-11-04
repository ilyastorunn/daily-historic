import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseFirestore } from '@/services/firebase';
import type { FirestoreEventDocument } from '@/types/events';
import type { CategoryOption } from '@/contexts/onboarding-context';
import { getYMBISeedEvents } from '@/constants/explore-seed';

const YMBI_CACHE_KEY_PREFIX = '@daily_historic/ymbi_cache';
const YMBI_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const YMBI_NOT_INTERESTED_KEY = '@daily_historic/ymbi_not_interested';
const NOT_INTERESTED_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export type YMBIResponse = {
  items: FirestoreEventDocument[];
  rationale?: string;
};

type YMBICache = {
  timestamp: number;
  dateKey: string; // Format: "MM-DD" to invalidate cache when day changes
  data: YMBIResponse;
};

type NotInterestedEntry = {
  eventId: string;
  categoryId: string;
  timestamp: number;
};

/**
 * Get today's date key in MM-DD format for the given timezone
 */
const getDateKey = (timezone?: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || undefined,
      month: '2-digit',
      day: '2-digit',
    });

    const parts = formatter.formatToParts(now);
    const month = parts.find((p) => p.type === 'month')?.value || '01';
    const day = parts.find((p) => p.type === 'day')?.value || '01';

    return `${month}-${day}`;
  } catch (error) {
    // Fallback to system timezone if invalid timezone
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
};

/**
 * Get cached YMBI from AsyncStorage
 */
const getCachedYMBI = async (userId: string, timezone?: string): Promise<YMBIResponse | null> => {
  try {
    const cacheKey = `${YMBI_CACHE_KEY_PREFIX}:${userId}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) {
      return null;
    }

    const parsedCache: YMBICache = JSON.parse(cached);
    const now = Date.now();
    const age = now - parsedCache.timestamp;

    // Get today's date key in user's timezone
    const todayKey = getDateKey(timezone);

    // Check if cached data is from today
    if (parsedCache.dateKey !== todayKey) {
      console.log('[YMBI] Cache from different day', {
        cached: parsedCache.dateKey,
        today: todayKey,
      });
      return null;
    }

    // Check if cache is still valid (within TTL)
    if (age < YMBI_CACHE_TTL) {
      console.log('[YMBI] Using cached recommendations', {
        userId,
        age: `${Math.round(age / 1000 / 60)}min`,
        date: parsedCache.dateKey,
      });
      return parsedCache.data;
    }

    // Cache expired
    console.log('[YMBI] Cache expired', { userId, age: `${Math.round(age / 1000 / 60 / 60)}hrs` });
    return null;
  } catch (error) {
    console.warn('[YMBI] Failed to read cache', error);
    return null;
  }
};

/**
 * Set cached YMBI in AsyncStorage
 */
const setCachedYMBI = async (userId: string, data: YMBIResponse, timezone?: string): Promise<void> => {
  try {
    const dateKey = getDateKey(timezone);

    const cacheKey = `${YMBI_CACHE_KEY_PREFIX}:${userId}`;
    const cache: YMBICache = {
      timestamp: Date.now(),
      dateKey,
      data,
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cache));
    console.log('[YMBI] Cached recommendations', { userId, count: data.items.length, date: dateKey });
  } catch (error) {
    console.warn('[YMBI] Failed to write cache', error);
  }
};

/**
 * Get "Not interested" suppressions
 */
const getNotInterestedList = async (): Promise<NotInterestedEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(YMBI_NOT_INTERESTED_KEY);
    if (!data) {
      return [];
    }

    const entries: NotInterestedEntry[] = JSON.parse(data);
    const now = Date.now();

    // Filter out expired entries
    const active = entries.filter((entry) => now - entry.timestamp < NOT_INTERESTED_TTL);

    // If we filtered any, update storage
    if (active.length !== entries.length) {
      await AsyncStorage.setItem(YMBI_NOT_INTERESTED_KEY, JSON.stringify(active));
    }

    return active;
  } catch (error) {
    console.warn('[YMBI] Failed to read not interested list', error);
    return [];
  }
};

/**
 * Add event to "Not interested" list
 */
export const markNotInterested = async (
  eventId: string,
  categoryId: string
): Promise<void> => {
  try {
    const entries = await getNotInterestedList();
    const newEntry: NotInterestedEntry = {
      eventId,
      categoryId,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(YMBI_NOT_INTERESTED_KEY, JSON.stringify([...entries, newEntry]));
    console.log('[YMBI] Marked as not interested', { eventId, categoryId });
  } catch (error) {
    console.warn('[YMBI] Failed to mark not interested', error);
  }
};

/**
 * Diversity algorithm: ensure at least 3 categories, max 2 per category
 */
const diversifyEvents = (
  events: FirestoreEventDocument[],
  minCategories: number = 3,
  maxPerCategory: number = 2
): FirestoreEventDocument[] => {
  const categoryCounts = new Map<string, number>();
  const categoryRepresented = new Set<string>();
  const result: FirestoreEventDocument[] = [];

  for (const event of events) {
    const primaryCategory = event.categories?.[0];
    if (!primaryCategory) {
      continue;
    }

    const count = categoryCounts.get(primaryCategory) ?? 0;

    // Add if under limit or we haven't reached min categories yet
    if (count < maxPerCategory || categoryRepresented.size < minCategories) {
      result.push(event);
      categoryCounts.set(primaryCategory, count + 1);
      categoryRepresented.add(primaryCategory);
    }

    // Stop once we have enough diverse content
    if (result.length >= 8 && categoryRepresented.size >= minCategories) {
      break;
    }
  }

  return result;
};

/**
 * Get user's least-engaged categories (categories they selected but don't interact with much)
 */
const getLeastEngagedCategories = (
  userCategories: CategoryOption[],
  savedEventIds: string[] = [],
  allEvents: FirestoreEventDocument[]
): CategoryOption[] => {
  if (userCategories.length === 0) {
    return [];
  }

  // Count how many saved events per category
  const categoryEngagement = new Map<CategoryOption, number>();
  userCategories.forEach((cat) => categoryEngagement.set(cat, 0));

  const savedEventCategories = new Set<string>();
  savedEventIds.forEach((eventId) => {
    const event = allEvents.find((e) => e.eventId === eventId);
    if (event?.categories) {
      event.categories.forEach((cat) => savedEventCategories.add(cat));
    }
  });

  savedEventCategories.forEach((cat) => {
    if (categoryEngagement.has(cat as CategoryOption)) {
      const current = categoryEngagement.get(cat as CategoryOption) ?? 0;
      categoryEngagement.set(cat as CategoryOption, current + 1);
    }
  });

  // Sort by engagement (ascending) - least engaged first
  const sorted = Array.from(categoryEngagement.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([cat]) => cat);

  return sorted;
};

/**
 * Fetch YMBI recommendations from Firestore
 */
const fetchYMBIFromFirestore = async (
  userId: string,
  userCategories: CategoryOption[],
  savedEventIds: string[],
  homeEventIds: string[],
  limit: number
): Promise<YMBIResponse | null> => {
  try {
    console.log('[YMBI] Fetching from Firestore', { userId });

    // Fetch a large pool of events to ensure diversity
    const snapshot = await firebaseFirestore
      .collection('contentEvents')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    if (snapshot.empty) {
      console.log('[YMBI] No events found in Firestore');
      return null;
    }

    const allEvents = snapshot.docs.map((doc) => doc.data() as FirestoreEventDocument);

    // Get least-engaged categories
    const leastEngaged = getLeastEngagedCategories(userCategories, savedEventIds, allEvents);

    // Get "not interested" suppressions
    const notInterested = await getNotInterestedList();
    const suppressedEventIds = new Set(notInterested.map((entry) => entry.eventId));

    // Filter events
    let filtered = allEvents.filter((event) => {
      // Exclude Home content
      if (homeEventIds.includes(event.eventId)) {
        return false;
      }
      // Exclude saved
      if (savedEventIds.includes(event.eventId)) {
        return false;
      }
      // Exclude not interested
      if (suppressedEventIds.has(event.eventId)) {
        return false;
      }
      return true;
    });

    // Prioritize least-engaged categories
    const prioritized: FirestoreEventDocument[] = [];
    const fallback: FirestoreEventDocument[] = [];

    filtered.forEach((event) => {
      const primaryCategory = event.categories?.[0];
      if (primaryCategory && leastEngaged.includes(primaryCategory as CategoryOption)) {
        prioritized.push(event);
      } else {
        fallback.push(event);
      }
    });

    // Shuffle each group
    const shufflePrioritized = prioritized.sort(() => Math.random() - 0.5);
    const shuffleFallback = fallback.sort(() => Math.random() - 0.5);

    // Combine: prioritized first, then fallback
    const combined = [...shufflePrioritized, ...shuffleFallback];

    // Apply diversity algorithm
    const diverse = diversifyEvents(combined);

    // Limit to requested count
    const items = diverse.slice(0, limit);

    if (items.length === 0) {
      console.log('[YMBI] No suitable items after filtering');
      return null;
    }

    return {
      items,
      rationale: `Showing ${items.length} diverse events from under-explored categories`,
    };
  } catch (error) {
    console.error('[YMBI] Firestore fetch failed', error);
    return null;
  }
};

/**
 * Get YMBI from seed data (fallback)
 */
const getYMBIFromSeed = (limit: number): YMBIResponse => {
  const items = getYMBISeedEvents(limit);
  return {
    items,
    rationale: 'Showing curated popular classics',
  };
};

/**
 * Fetch You Might Be Interested recommendations
 * @param userId - User ID for caching
 * @param userCategories - Categories user selected during onboarding
 * @param savedEventIds - Events user has saved
 * @param homeEventIds - Events currently shown on Home (to avoid duplicates)
 * @param limit - Number of recommendations (default 8)
 * @param timezone - User's timezone (for date-based cache invalidation)
 */
export const fetchYMBI = async (
  userId: string,
  userCategories: CategoryOption[] = [],
  savedEventIds: string[] = [],
  homeEventIds: string[] = [],
  limit: number = 8,
  timezone?: string
): Promise<YMBIResponse> => {
  try {
    // Check cache first
    const cached = await getCachedYMBI(userId, timezone);
    if (cached) {
      return cached;
    }

    // Try Firestore
    const firestoreResult = await fetchYMBIFromFirestore(
      userId,
      userCategories,
      savedEventIds,
      homeEventIds,
      limit
    );

    if (firestoreResult) {
      await setCachedYMBI(userId, firestoreResult, timezone);
      return firestoreResult;
    }

    // Final fallback: seed data
    console.log('[YMBI] Using seed fallback');
    const seedResult = getYMBIFromSeed(limit);
    await setCachedYMBI(userId, seedResult, timezone);
    return seedResult;
  } catch (error) {
    console.error('[YMBI] Unexpected error in fetch chain', error);
    return getYMBIFromSeed(limit);
  }
};

/**
 * Clear YMBI cache (useful for testing or manual refresh)
 */
export const clearYMBICache = async (userId: string): Promise<void> => {
  try {
    const cacheKey = `${YMBI_CACHE_KEY_PREFIX}:${userId}`;
    await AsyncStorage.removeItem(cacheKey);
    console.log('[YMBI] Cache cleared', { userId });
  } catch (error) {
    console.warn('[YMBI] Failed to clear cache', error);
  }
};
