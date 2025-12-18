import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

import {
  CONTENT_EVENTS_COLLECTION,
  DAILY_DIGESTS_COLLECTION,
  firebaseFirestore,
} from '@/services/firebase';
import type { DailyDigestDocument, FirestoreEventDocument } from '@/types/events';
import { fetchWithCache, CachePresets } from '@/services/api-helpers';
import { CacheKeys } from '@/utils/cache-keys';

const toTwoDigits = (value: number) => value.toString().padStart(2, '0');
const toFourDigits = (value: number) => value.toString().padStart(4, '0');

const buildLegacyDigestDocumentId = (month: number, day: number) => {
  return `digest:onthisday:selected:${toTwoDigits(month)}-${toTwoDigits(day)}`;
};

const buildYearAwareDigestDocumentId = (year: number, month: number, day: number) => {
  return `digest:onthisday:selected:${toFourDigits(year)}-${toTwoDigits(month)}-${toTwoDigits(day)}`;
};

const buildIsoDate = (year: number, month: number, day: number) => {
  return `${toFourDigits(year)}-${toTwoDigits(month)}-${toTwoDigits(day)}`;
};

const extractEventIds = (
  digest: DailyDigestDocument | (DailyDigestDocument & { entries?: unknown }) | null
) => {
  if (!digest) {
    return [];
  }

  if (Array.isArray(digest.eventIds)) {
    return digest.eventIds.filter((id): id is string => typeof id === 'string' && id.length > 0);
  }

  const entries = (digest as { entries?: unknown }).entries;
  if (Array.isArray(entries)) {
    return entries
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }
        if (entry && typeof entry === 'object' && 'eventId' in entry) {
          const eventId = (entry as { eventId?: unknown }).eventId;
          return typeof eventId === 'string' ? eventId : null;
        }
        return null;
      })
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
  }

  return [];
};

export const buildDigestDocumentId = (month: number, day: number) => {
  return buildLegacyDigestDocumentId(month, day);
};

const mapEventSnapshot = (
  snapshot: FirebaseFirestoreTypes.DocumentSnapshot<FirestoreEventDocument>
): FirestoreEventDocument | null => {
  if (!snapshot.exists) {
    return null;
  }
  const data = snapshot.data();
  if (!data) {
    return null;
  }
  return {
    ...data,
    eventId: data.eventId ?? snapshot.id,
  };
};

export const fetchEventsByIds = async (ids: string[]): Promise<FirestoreEventDocument[]> => {
  if (ids.length === 0) {
    return [];
  }

  const uniqueIds = Array.from(new Set(ids));
  const eventCollection = firebaseFirestore.collection<FirestoreEventDocument>(CONTENT_EVENTS_COLLECTION);

  const snapshots = await Promise.all(uniqueIds.map((id) => eventCollection.doc(id).get()));
  const events = snapshots
    .map((snapshot) => mapEventSnapshot(snapshot))
    .filter((event): event is FirestoreEventDocument => event !== null);

  const indexById = new Map(events.map((event) => [event.eventId, event]));

  return uniqueIds
    .map((id) => indexById.get(id))
    .filter((event): event is FirestoreEventDocument => Boolean(event));
};

export const fetchDailyDigest = async (
  month: number,
  day: number,
  year?: number,
  forceRefresh = false
): Promise<{ digest: DailyDigestDocument | null; events: FirestoreEventDocument[] }> => {
  const cacheKey = CacheKeys.home.dailyDigest(month, day, year);

  return fetchWithCache(
    cacheKey,
    async () => {
      // Original fetch logic (unchanged)
      const digestCollection = firebaseFirestore.collection<DailyDigestDocument>(DAILY_DIGESTS_COLLECTION);
      const numericYear = typeof year === 'number' && Number.isFinite(year) ? year : undefined;
      const candidateIds: string[] = [];

      if (numericYear !== undefined) {
        candidateIds.push(buildYearAwareDigestDocumentId(numericYear, month, day));
      }
      candidateIds.push(buildLegacyDigestDocumentId(month, day));

      let resolvedSnapshot: FirebaseFirestoreTypes.DocumentSnapshot<DailyDigestDocument> | null = null;

      for (const candidateId of candidateIds) {
        const snapshot = await digestCollection.doc(candidateId).get();
        if (snapshot.exists) {
          resolvedSnapshot = snapshot;
          break;
        }
      }

      if (!resolvedSnapshot && numericYear !== undefined) {
        const isoDate = buildIsoDate(numericYear, month, day);
        const querySnapshot = await digestCollection.where('date', '==', isoDate).limit(1).get();
        if (!querySnapshot.empty) {
          resolvedSnapshot =
            (querySnapshot.docs[0] as FirebaseFirestoreTypes.DocumentSnapshot<DailyDigestDocument>) ?? null;
        }
      }

      if (!resolvedSnapshot) {
        return { digest: null, events: [] };
      }

      const digestData = resolvedSnapshot.data() ?? null;

      if (!digestData) {
        return { digest: null, events: [] };
      }

      const eventIds = extractEventIds(digestData);

      if (eventIds.length === 0) {
        const normalizedDigest: DailyDigestDocument = {
          ...digestData,
          digestId: digestData.digestId ?? resolvedSnapshot.id,
          eventIds,
        };
        return { digest: normalizedDigest, events: [] };
      }

      const events = await fetchEventsByIds(eventIds);
      const normalizedDigest: DailyDigestDocument = {
        ...digestData,
        digestId: digestData.digestId ?? resolvedSnapshot.id,
        eventIds,
      };

      return { digest: normalizedDigest, events };
    },
    {
      ...CachePresets.daily('home'),
      forceRefresh,
    }
  );
};
