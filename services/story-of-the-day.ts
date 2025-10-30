import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  firebaseFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  limit,
} from '@/services/firebase';
import type { FirestoreEventDocument } from '@/types/events';
import { getRandomSOTDSeed } from '@/constants/explore-seed';
import { lookupAlias } from '@/utils/wiki-aliases';
import { findBestMatch } from '@/utils/title-matching';
import { getTopContentArticle, decodeArticleTitle } from '@/services/wikimedia-pageviews';

const SOTD_CACHE_KEY = '@daily_historic/sotd_cache';
const SOTD_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

type SOTDCache = {
  timestamp: number;
  dateKey: string; // Format: "MM-DD" to invalidate cache when day changes
  data: SOTDResponse;
};

/**
 * Get cached SOTD from AsyncStorage
 */
const getCachedSOTD = async (): Promise<SOTDResponse | null> => {
  try {
    const cached = await AsyncStorage.getItem(SOTD_CACHE_KEY);
    if (!cached) {
      return null;
    }

    const parsedCache: SOTDCache = JSON.parse(cached);
    const now = Date.now();
    const age = now - parsedCache.timestamp;

    // Get today's date key
    const today = new Date();
    const todayKey = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Check if cached data is from today
    if (parsedCache.dateKey !== todayKey) {
      console.log('[SOTD] Cache from different day', {
        cached: parsedCache.dateKey,
        today: todayKey,
      });
      return null;
    }

    // Check if cache is still valid (within TTL)
    if (age < SOTD_CACHE_TTL) {
      console.log('[SOTD] Using cached story', {
        age: `${Math.round(age / 1000 / 60)}min`,
        date: parsedCache.dateKey,
      });
      return parsedCache.data;
    }

    // Cache expired
    console.log('[SOTD] Cache expired', { age: `${Math.round(age / 1000 / 60 / 60)}hrs` });
    return null;
  } catch (error) {
    console.warn('[SOTD] Failed to read cache', error);
    return null;
  }
};

/**
 * Set cached SOTD in AsyncStorage
 */
const setCachedSOTD = async (data: SOTDResponse): Promise<void> => {
  try {
    const today = new Date();
    const dateKey = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const cache: SOTDCache = {
      timestamp: Date.now(),
      dateKey,
      data,
    };
    await AsyncStorage.setItem(SOTD_CACHE_KEY, JSON.stringify(cache));
    console.log('[SOTD] Cached story', { source: data.source, date: dateKey });
  } catch (error) {
    console.warn('[SOTD] Failed to write cache', error);
  }
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

    const sotdDocRef = doc(firebaseFirestore, 'storyOfTheDay', dateKey);
    const sotdDocSnap = await getDoc(sotdDocRef);

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
    const eventDocRef = doc(firebaseFirestore, 'contentEvents', data.eventId);
    const eventDocSnap = await getDoc(eventDocRef);
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

      const eventDocRef = doc(firebaseFirestore, 'contentEvents', aliasEventId);
      const eventDocSnap = await getDoc(eventDocRef);

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

    const eventsCol = collection(firebaseFirestore, 'contentEvents');
    const eventsQuery = query(eventsCol, limit(100));
    const eventsSnapshot = await getDocs(eventsQuery);

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

    // 4. No match found - return generic Wikipedia article card
    console.log('[SOTD] No match found, returning generic article card');

    return {
      id: `wikimedia:${wikipediaTitle}`,
      title: decodedTitle,
      blurb: `Trending on Wikipedia with ${topArticle.views.toLocaleString()} views`,
      imageUrl: undefined,
      matched: false,
      source: 'wikimedia',
      dateISO: new Date().toISOString(),
    };
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
 * 1. AsyncStorage cache (24h TTL)
 * 2. Firestore
 * 3. Wikimedia Pageviews API
 * 4. Local seed data
 */
export const fetchStoryOfTheDay = async (): Promise<SOTDResponse> => {
  try {
    // Check cache first
    const cached = await getCachedSOTD();
    if (cached) {
      return cached;
    }

    // Try Firestore
    const firestoreResult = await fetchSOTDFromFirestore();
    if (firestoreResult) {
      await setCachedSOTD(firestoreResult);
      return firestoreResult;
    }

    // Try Wikimedia (stub for now)
    const wikimediaResult = await fetchSOTDFromWikimedia();
    if (wikimediaResult) {
      await setCachedSOTD(wikimediaResult);
      return wikimediaResult;
    }

    // Final fallback: seed data
    console.log('[SOTD] All sources failed, using seed fallback');
    const seedResult = getSOTDFromSeed();
    await setCachedSOTD(seedResult);
    return seedResult;
  } catch (error) {
    console.error('[SOTD] Unexpected error in fetch chain', error);
    // Even if something goes wrong, return seed data
    return getSOTDFromSeed();
  }
};

/**
 * Clear SOTD cache (useful for testing or manual refresh)
 */
export const clearSOTDCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SOTD_CACHE_KEY);
    console.log('[SOTD] Cache cleared');
  } catch (error) {
    console.warn('[SOTD] Failed to clear cache', error);
  }
};
