import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseFirestore } from '@/services/firebase';
import type { FirestoreEventDocument } from '@/types/events';
import type { CategoryOption } from '@/contexts/onboarding-context';
import { getYMBISeedEvents } from '@/constants/explore-seed';
import { fetchWithCache, CachePresets } from '@/services/api-helpers';
import { CacheKeys } from '@/utils/cache-keys';
import { cacheService } from '@/services/cache-service';

const YMBI_NOT_INTERESTED_KEY = '@daily_historic/ymbi_not_interested';
const NOT_INTERESTED_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export type YMBIResponse = {
  items: FirestoreEventDocument[];
  rationale?: string;
};

type NotInterestedEntry = {
  eventId: string;
  categoryId: string;
  timestamp: number;
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
 * Now uses unified cache system
 * @param userId - User ID for caching
 * @param userCategories - Categories user selected during onboarding
 * @param savedEventIds - Events user has saved
 * @param homeEventIds - Events currently shown on Home (to avoid duplicates)
 * @param limit - Number of recommendations (default 8)
 * @param forceRefresh - Force bypass cache (default false)
 */
export const fetchYMBI = async (
  userId: string,
  userCategories: CategoryOption[] = [],
  savedEventIds: string[] = [],
  homeEventIds: string[] = [],
  limit: number = 8,
  forceRefresh = false
): Promise<YMBIResponse> => {
  const cacheKey = CacheKeys.explore.ymbi(userId, userCategories, limit, homeEventIds);

  return fetchWithCache(
    cacheKey,
    async () => {
      try {
        // Try Firestore
        const firestoreResult = await fetchYMBIFromFirestore(
          userId,
          userCategories,
          savedEventIds,
          homeEventIds,
          limit
        );

        if (firestoreResult) {
          return firestoreResult;
        }

        // Final fallback: seed data
        console.log('[YMBI] Using seed fallback');
        return getYMBIFromSeed(limit);
      } catch (error) {
        console.error('[YMBI] Unexpected error in fetch chain', error);
        return getYMBIFromSeed(limit);
      }
    },
    {
      ...CachePresets.shortLived('explore'), // 6 hours TTL
      version: 1,
      forceRefresh,
    }
  );
};

/**
 * Clear YMBI cache (useful for testing or manual refresh)
 * Now uses unified cache service
 */
export const clearYMBICache = async (
  userId: string,
  userCategories: CategoryOption[] = [],
  limit: number = 8,
  homeEventIds: string[] = []
): Promise<void> => {
  const cacheKey = CacheKeys.explore.ymbi(userId, userCategories, limit, homeEventIds);
  await cacheService.invalidate('explore', cacheKey);
  console.log('[YMBI] Cache cleared via unified cache service', { userId });
};
