import { getImageUri } from '@/utils/image-source';
import { heroEvent } from '@/constants/events';
import { firebaseFirestore, query, collection, getDocs, where, limit } from '@/services/firebase';
import type { FirestoreEventDocument } from '@/types/events';
import { getEventImageUri, getEventSummary, getEventTitle } from '@/utils/event-presentation';
import { fetchWithCache, CachePresets } from '@/services/api-helpers';
import { CacheKeys } from '@/utils/cache-keys';

// Security: Limit max events per year to prevent unbounded queries
const MAX_EVENTS_PER_YEAR = 100;

// Security: Valid year range to prevent abuse
const MIN_VALID_YEAR = 1800;
const MAX_VALID_YEAR = new Date().getFullYear();

// Security: Validate year input
export const isValidYear = (year: unknown): year is number => {
  return (
    typeof year === 'number' &&
    Number.isFinite(year) &&
    Number.isInteger(year) &&
    year >= MIN_VALID_YEAR &&
    year <= MAX_VALID_YEAR
  );
};

export type TimeMachineSeedResponse = {
  year: number;
};

export type TimelineEvent = {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  dateISO?: string;
  categoryId?: string;
  beforeContext?: string;
  afterContext?: string;
};

export type TimeMachineTimelineResponse = {
  year: number;
  events: TimelineEvent[];
  before?: TimelineEvent[];
  after?: TimelineEvent[];
};

const TIME_MACHINE_BASE_URL = 'https://api.example.com/time-machine';

const buildUrl = (path: string, params?: Record<string, string | number | undefined>) => {
  const url = new URL(path, TIME_MACHINE_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
};

const fetchJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Time Machine request failed (${response.status})`);
  }
  return (await response.json()) as T;
};

// Featured years with enriched content (Phase 1)
const FEATURED_YEARS = [2013, 1991, 1987, 1943, 1944];

export const fetchTimeMachineSeed = async (): Promise<TimeMachineSeedResponse> => {
  // Phase 1: Return random featured year directly (no API call)
  const randomIndex = Math.floor(Math.random() * FEATURED_YEARS.length);
  return { year: FEATURED_YEARS[randomIndex] };
};

const mapFirestoreEventToTimelineEvent = (doc: FirestoreEventDocument): TimelineEvent => {
  let imageUrl: string | undefined;

  try {
    imageUrl = getEventImageUri(doc);
  } catch (error) {
    // Try direct access to relatedPages as fallback
    const relatedPages = doc.relatedPages;
    if (Array.isArray(relatedPages) && relatedPages.length > 0) {
      imageUrl = relatedPages[0]?.selectedMedia?.sourceUrl;
    }
  }

  return {
    id: doc.eventId,
    title: getEventTitle(doc),
    summary: getEventSummary(doc),
    imageUrl,
    dateISO: doc.dateISO,
    categoryId: doc.categories?.[0],
    beforeContext: doc.beforeContext,
    afterContext: doc.afterContext,
  };
};

export const fetchTimeMachineTimeline = async (
  year: number,
  options: { categories?: string; forceRefresh?: boolean } = {}
): Promise<TimeMachineTimelineResponse> => {
  // Security: Validate year input to prevent injection/abuse
  if (!isValidYear(year)) {
    throw new Error(`Invalid year: ${year}. Must be between ${MIN_VALID_YEAR} and ${MAX_VALID_YEAR}`);
  }

  const cacheKey = CacheKeys.timeMachine.timeline(year, options.categories);

  return fetchWithCache(
    cacheKey,
    async () => {
      try {
        // Fetch events from Firestore for the specified year (optimized with where clause + limit)
        const eventsCollection = collection(firebaseFirestore, 'contentEvents');
        const eventsQuery = query(
          eventsCollection,
          where('year', '==', year),
          limit(MAX_EVENTS_PER_YEAR)
        );
        const eventsSnapshot = await getDocs(eventsQuery);

        const yearEvents: FirestoreEventDocument[] = [];
        eventsSnapshot.forEach((doc: any) => {
          yearEvents.push(doc.data() as FirestoreEventDocument);
        });

        // Sort by dateISO chronologically
        yearEvents.sort((a, b) => {
          const dateA = a.dateISO || '1900-01-01';
          const dateB = b.dateISO || '1900-01-01';
          return dateA.localeCompare(dateB);
        });

        if (yearEvents.length === 0) {
          throw new Error(`No events found for year ${year}`);
        }

        // Map to TimelineEvent format
        const events = yearEvents.map(mapFirestoreEventToTimelineEvent);

        return {
          year,
          events,
          before: [], // Will be implemented in Phase 2
          after: [], // Will be implemented in Phase 2
        };
      } catch (error) {
        // Fallback to heroEvent (1969 Moon Landing)
        return {
          year,
          events: [
            {
              id: heroEvent.id,
              title: heroEvent.title,
              summary: heroEvent.summary,
              imageUrl: getImageUri(heroEvent.image) ?? undefined,
              dateISO: heroEvent.date,
              categoryId: heroEvent.categories?.[0],
            },
          ],
          before: [],
          after: [],
        };
      }
    },
    {
      ...CachePresets.shortLived('time-machine'), // 6 hours TTL
      version: 1,
      forceRefresh: options.forceRefresh || false,
    }
  );
};
