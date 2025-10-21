import * as eventsModule from '@/constants/events';
import type { EventCollection } from '@/constants/events';
import { getImageUri } from '@/utils/image-source';

export type HomeCollectionSummary = {
  id: string;
  title: string;
  coverUrl: string;
  blurb?: string;
  previewCount?: number;
};

type FetchWeeklyCollectionsArgs = {
  weekKey?: string | null;
  limit?: number;
};

export const fetchWeeklyCollections = async ({
  weekKey,
  limit,
}: FetchWeeklyCollectionsArgs): Promise<{ items: HomeCollectionSummary[]; generatedAt: string }> => {
  // TODO: Replace with real API call once backend endpoint is available.
  const potentialCollections = (eventsModule as Record<string, unknown>)['EVENT_COLLECTIONS'];
  const fallbackCollections: EventCollection[] = Array.isArray(potentialCollections)
    ? (potentialCollections as EventCollection[])
    : [];

  const mapped = fallbackCollections.map((collection) => ({
    id: collection.id,
    title: collection.title,
    coverUrl: getImageUri(collection.image) ?? '',
    blurb: collection.summary,
    previewCount: collection.eventIds.length,
  }));

  const sliced = typeof limit === 'number' ? mapped.slice(0, limit) : mapped;

  return {
    items: sliced,
    generatedAt: new Date().toISOString(),
  };
};
