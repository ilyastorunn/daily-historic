import { EVENT_COLLECTIONS, EVENT_LIBRARY } from '@/constants/events';
import type { EventCollection } from '@/constants/events';
import { getImageUri } from '@/utils/image-source';

export type HomeCollectionSummary = {
  id: string;
  title: string;
  coverUrl: string;
  blurb?: string;
  previewCount?: number;
};

export type CollectionDetail = {
  id: string;
  title: string;
  coverUrl: string;
  blurb?: string;
  items: Array<{
    id: string;
    title: string;
    summary: string;
    year?: number;
    imageUrl?: string;
    categoryIds?: string[];
  }>;
};

type FetchWeeklyCollectionsArgs = {
  weekKey?: string | null;
  limit?: number;
};

const HOME_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com';

const buildUrl = (path: string, params?: Record<string, string | number | undefined>) => {
  const url = new URL(path, HOME_API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
};

const fetchJson = async <T>(input: RequestInfo | URL) => {
  const response = await fetch(input);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return (await response.json()) as T;
};

const getFallbackCollections = () => {
  return EVENT_COLLECTIONS.map((collection) => ({
    id: collection.id,
    title: collection.title,
    coverUrl: getImageUri(collection.image) ?? '',
    blurb: collection.summary,
    previewCount: collection.eventIds.length,
  }));
};

export const fetchWeeklyCollections = async ({
  weekKey,
  limit,
}: FetchWeeklyCollectionsArgs): Promise<{ items: HomeCollectionSummary[]; generatedAt: string }> => {
  try {
    const result = await fetchJson<{ items: HomeCollectionSummary[]; generatedAt: string }>(
      buildUrl('/home/collections', {
        weekKey: weekKey ?? undefined,
        limit,
      })
    );
    return result;
  } catch (error) {
    console.warn('Falling back to local weekly collections', error);
    const items = getFallbackCollections();
    const sliced = typeof limit === 'number' ? items.slice(0, limit) : items;
    return {
      items: sliced,
      generatedAt: new Date().toISOString(),
    };
  }
};

export const fetchCollectionDetail = async (collectionId: string): Promise<CollectionDetail> => {
  if (!collectionId) {
    throw new Error('collectionId is required');
  }
  try {
    return await fetchJson<CollectionDetail>(buildUrl(`/collections/${collectionId}`));
  } catch (error) {
    console.warn('Falling back to local collection detail', error);
    const match = EVENT_COLLECTIONS.find((collection) => collection.id === collectionId);
    if (!match) {
      throw error instanceof Error ? error : new Error('Collection not found');
    }
    const items = match.eventIds
      .map((eventId) => EVENT_LIBRARY.find((event) => event.id === eventId))
      .filter((event): event is typeof EVENT_LIBRARY[number] => Boolean(event))
      .map((event) => ({
        id: event.id,
        title: event.title,
        summary: event.summary,
        year: Number(event.year) || undefined,
        imageUrl: getImageUri(event.image) ?? undefined,
        categoryIds: event.categories,
      }));
    return {
      id: match.id,
      title: match.title,
      coverUrl: getImageUri(match.image) ?? '',
      blurb: match.summary,
      items,
    };
  }
};
