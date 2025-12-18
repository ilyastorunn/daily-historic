import { firebaseFirestore } from '@/services/firebase';
import type { FirestoreEventDocument } from '@/types/events';
import { getRandomSOTDSeed } from '@/constants/explore-seed';
import { lookupAlias } from '@/utils/wiki-aliases';
import { findBestMatch } from '@/utils/title-matching';
import { getTopContentArticle, decodeArticleTitle } from '@/services/wikimedia-pageviews';
import { fetchWithCache, CachePresets } from '@/services/api-helpers';
import { CacheKeys } from '@/utils/cache-keys';
import { cacheService } from '@/services/cache-service';

export type SOTDSource = 'firestore' | 'wikimedia' | 'seed';

export type SOTDResponse = {
  id: string;
  title: string;
  blurb?: string;
  imageUrl?: string;
  matched: boolean;
  source: SOTDSource;
  dateISO?: string;
  eventId?: string;
  event?: FirestoreEventDocument;
};

/**
 * Helper to get today's date key in MM-DD format
 */
const getTodayDateKey = (): string => {
  const today = new Date();
  return `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

/**
 * Fetch SOTD from Firestore
 * Looks for a special collection `storyOfTheDay` with today's date
 */
const fetchSOTDFromFirestore = async (): Promise<SOTDResponse | null> => {
  try {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateKey = `sotd:${month}-${day}`;

    console.log('[SOTD] Fetching from Firestore', { dateKey });

    const sotdDocRef = firebaseFirestore.collection('storyOfTheDay').doc(dateKey);
    const sotdDocSnap = await sotdDocRef.get();

    if (!sotdDocSnap.exists) {
      console.log('[SOTD] No Firestore document found for today');
      return null;
    }

    const data = sotdDocSnap.data();
    if (!data?.eventId) {
      console.log('[SOTD] Firestore document missing eventId');
      return null;
    }

    // Fetch the full event document
    const eventDocRef = firebaseFirestore.collection('contentEvents').doc(data.eventId);
    const eventDocSnap = await eventDocRef.get();
    if (!eventDocSnap.exists) {
      console.log('[SOTD] Event document not found', { eventId: data.eventId });
      return null;
    }

    const event = eventDocSnap.data() as FirestoreEventDocument;
    const imageUrl = event.relatedPages?.[0]?.thumbnails?.[0]?.sourceUrl;

    const response: SOTDResponse = {
      id: data.eventId,
      title: event.text || event.summary || 'Untitled Event',
      blurb: event.summary,
      imageUrl,
      matched: true,
      source: 'firestore',
      dateISO: today.toISOString(),
      eventId: data.eventId,
      event,
    };

    return response;
  } catch (error) {
    console.error('[SOTD] Firestore fetch failed', error);
    return null;
  }
};

/**
 * Fetch SOTD from Wikimedia Pageviews API
 * 1. Get top viewed Wikipedia article
 * 2. Check alias table for manual mapping
 * 3. Try fuzzy matching against Firestore events
 * 4. Return matched event or generic article card
 */
const fetchSOTDFromWikimedia = async (): Promise<SOTDResponse | null> => {
  try {
    console.log('[SOTD] Fetching from Wikimedia Pageviews API');

    // 1. Get top viewed article (yesterday's data)
    const topArticle = await getTopContentArticle();

    if (!topArticle) {
      console.log('[SOTD] No top article found from Pageviews API');
      return null;
    }

    const wikipediaTitle = topArticle.article;
    const decodedTitle = decodeArticleTitle(wikipediaTitle);

    console.log('[SOTD] Top article:', {
      title: decodedTitle,
      views: topArticle.views,
      rank: topArticle.rank,
    });

    // 2. Check alias table first
    const aliasEventId = lookupAlias(wikipediaTitle);

    if (aliasEventId) {
      console.log('[SOTD] Found alias mapping', { eventId: aliasEventId });

      const eventDocRef = firebaseFirestore.collection('contentEvents').doc(aliasEventId);
      const eventDocSnap = await eventDocRef.get();

      if (eventDocSnap.exists) {
        const event = eventDocSnap.data() as FirestoreEventDocument;
        const imageUrl = event.relatedPages?.[0]?.thumbnails?.[0]?.sourceUrl;

        return {
          id: aliasEventId,
          title: event.text || event.summary || decodedTitle,
          blurb: event.summary,
          imageUrl,
          matched: true,
          source: 'wikimedia',
          dateISO: new Date().toISOString(),
          eventId: aliasEventId,
          event,
        };
      }
    }

    // 3. Try fuzzy matching against all events
    console.log('[SOTD] No alias found, trying fuzzy matching');

    const eventsSnapshot = await firebaseFirestore.collection('contentEvents').limit(100).get();

    const allEvents = eventsSnapshot.docs.map((docSnap) => docSnap.data() as FirestoreEventDocument);

    const bestMatch = findBestMatch(decodedTitle, allEvents, 70); // Min score: 70

    if (bestMatch) {
      console.log('[SOTD] Found fuzzy match', {
        eventId: bestMatch.event.eventId,
        score: bestMatch.match.score,
        similarity: bestMatch.match.similarity,
      });

      const imageUrl = bestMatch.event.relatedPages?.[0]?.thumbnails?.[0]?.sourceUrl;

      return {
        id: bestMatch.event.eventId ?? 'unknown',
        title: bestMatch.event.text || bestMatch.event.summary || decodedTitle,
        blurb: bestMatch.event.summary,
        imageUrl,
        matched: true,
        source: 'wikimedia',
        dateISO: new Date().toISOString(),
        eventId: bestMatch.event.eventId,
        event: bestMatch.event,
      };
    }

    // 4. No match found - return null to fallback to seed
    console.log('[SOTD] No match found, falling back to seed');
    return null;
  } catch (error) {
    console.error('[SOTD] Wikimedia fetch failed', error);
    return null;
  }
};

/**
 * Get SOTD from seed data (final fallback)
 */
const getSOTDFromSeed = (): SOTDResponse => {
  const seedEvent = getRandomSOTDSeed();
  const imageUrl = seedEvent.relatedPages?.[0]?.thumbnails?.[0]?.sourceUrl;

  return {
    id: seedEvent.eventId,
    title: seedEvent.text || seedEvent.summary || 'Editor\'s Pick',
    blurb: seedEvent.summary,
    imageUrl,
    matched: true,
    source: 'seed',
    dateISO: new Date().toISOString(),
    eventId: seedEvent.eventId,
    event: seedEvent,
  };
};

/**
 * Fetch Story of the Day with cascading fallbacks
 * Now uses unified cache system with:
 * 1. Unified cache (L1 session + L2 AsyncStorage, 24h TTL)
 * 2. Firestore
 * 3. Wikimedia Pageviews API
 * 4. Local seed data
 */
export const fetchStoryOfTheDay = async (forceRefresh = false): Promise<SOTDResponse> => {
  const dateKey = getTodayDateKey();
  const cacheKey = CacheKeys.explore.sotd(dateKey);

  return fetchWithCache(
    cacheKey,
    async () => {
      try {
        // Try Firestore
        const firestoreResult = await fetchSOTDFromFirestore();
        if (firestoreResult) {
          return firestoreResult;
        }

        // Try Wikimedia
        const wikimediaResult = await fetchSOTDFromWikimedia();
        if (wikimediaResult) {
          return wikimediaResult;
        }

        // Final fallback: seed data
        console.log('[SOTD] All sources failed, using seed fallback');
        return getSOTDFromSeed();
      } catch (error) {
        console.error('[SOTD] Unexpected error in fetch chain', error);
        // Even if something goes wrong, return seed data
        return getSOTDFromSeed();
      }
    },
    {
      ...CachePresets.daily('explore'),
      version: 5, // Incremented from 4 to invalidate old cache format
      forceRefresh,
    }
  );
};

/**
 * Clear SOTD cache (useful for testing or manual refresh)
 * Now uses unified cache service
 */
export const clearSOTDCache = async (): Promise<void> => {
  const dateKey = getTodayDateKey();
  const cacheKey = CacheKeys.explore.sotd(dateKey);
  await cacheService.invalidate('explore', cacheKey);
  console.log('[SOTD] Cache cleared via unified cache service');
};
