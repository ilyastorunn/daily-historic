import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

import {
  CONTENT_EVENTS_COLLECTION,
  DAILY_DIGESTS_COLLECTION,
  firebaseFirestore,
} from '@/services/firebase';
import type { DailyDigestDocument, FirestoreEventDocument } from '@/types/events';

const toTwoDigits = (value: number) => value.toString().padStart(2, '0');

export const buildDigestDocumentId = (month: number, day: number) => {
  return `digest:onthisday:selected:${toTwoDigits(month)}-${toTwoDigits(day)}`;
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
  day: number
): Promise<{ digest: DailyDigestDocument | null; events: FirestoreEventDocument[] }> => {
  const digestId = buildDigestDocumentId(month, day);
  const digestRef = firebaseFirestore.collection<DailyDigestDocument>(DAILY_DIGESTS_COLLECTION).doc(digestId);
  const snapshot = await digestRef.get();

  if (!snapshot.exists) {
    return { digest: null, events: [] };
  }

  const digest = snapshot.data() ?? null;
  const eventIds = digest?.eventIds ?? [];

  if (eventIds.length === 0) {
    return { digest, events: [] };
  }

  const events = await fetchEventsByIds(eventIds);
  return { digest, events };
};
