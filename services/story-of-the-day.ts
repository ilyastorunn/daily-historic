import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseFirestore } from '@/services/firebase';
import type { FirestoreEventDocument } from '@/types/events';
import { getRandomSOTDSeed } from '@/constants/explore-seed';

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

    // Check if cache is still valid (within TTL)
    if (age < SOTD_CACHE_TTL) {
      console.log('[SOTD] Using cached story', { age: `${Math.round(age / 1000 / 60)}min` });
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
    const cache: SOTDCache = {
      timestamp: Date.now(),
      data,
    };
    await AsyncStorage.setItem(SOTD_CACHE_KEY, JSON.stringify(cache));
    console.log('[SOTD] Cached story', { source: data.source });
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

    const doc = await firebaseFirestore.collection('storyOfTheDay').doc(dateKey).get();

    if (!doc.exists) {
      console.log('[SOTD] No Firestore document found for today');
      return null;
    }

    const data = doc.data();
    if (!data?.eventId) {
      console.log('[SOTD] Firestore document missing eventId');
      return null;
    }

    // Fetch the full event document
    const eventDoc = await firebaseFirestore.collection('contentEvents').doc(data.eventId).get();
    if (!eventDoc.exists) {
      console.log('[SOTD] Event document not found', { eventId: data.eventId });
      return null;
    }

    const event = eventDoc.data() as FirestoreEventDocument;
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
 * Fetch SOTD from Wikimedia Pageviews API (stub for now)
 * TODO: Implement actual Wikimedia Pageviews integration
 */
const fetchSOTDFromWikimedia = async (): Promise<SOTDResponse | null> => {
  // Stub: In a real implementation, this would:
  // 1. Fetch top viewed pages from Wikimedia Pageviews API
  // 2. Normalize titles and attempt to match to internal event IDs
  // 3. Return matched event or generic article card

  console.log('[SOTD] Wikimedia integration not yet implemented, using fallback');
  return null;
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
