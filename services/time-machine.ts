import { getImageUri } from '@/utils/image-source';
import { heroEvent } from '@/constants/events';
import { firebaseFirestore, query, collection, getDocs } from '@/services/firebase';
import type { FirestoreEventDocument } from '@/types/events';
import { getEventImageUri, getEventSummary, getEventTitle } from '@/utils/event-presentation';

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

  // Debug: Check relatedPages structure
  const relatedPages = doc.relatedPages;
  console.log('[Time Machine] Event:', doc.eventId?.slice(0, 8), {
    hasRelatedPages: !!relatedPages,
    isArray: Array.isArray(relatedPages),
    length: Array.isArray(relatedPages) ? relatedPages.length : 'N/A',
    hasSelectedMedia: Array.isArray(relatedPages) && relatedPages.length > 0
      ? !!relatedPages[0]?.selectedMedia
      : false,
  });

  try {
    imageUrl = getEventImageUri(doc);
  } catch (error) {
    console.warn('[Time Machine] Failed to get image for event', doc.eventId, error);
    // Try direct access to relatedPages
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
  options: { categories?: string } = {}
): Promise<TimeMachineTimelineResponse> => {
  try {
    console.log('[Time Machine] Fetching timeline for year:', year);

    // Fetch events from Firestore for the specified year
    const eventsCollection = collection(firebaseFirestore, 'contentEvents');
    const eventsQuery = query(eventsCollection);
    const eventsSnapshot = await getDocs(eventsQuery);

    const yearEvents: FirestoreEventDocument[] = [];
    eventsSnapshot.forEach((doc) => {
      const data = doc.data() as FirestoreEventDocument;
      if (data.year === year) {
        yearEvents.push(data);
      }
    });

    console.log('[Time Machine] Found events for year:', year, yearEvents.length);

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
    console.warn('Falling back to local time machine timeline', error);
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
};
