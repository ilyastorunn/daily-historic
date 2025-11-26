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

/**
 * Rotates collections based on ISO week number for weekly variation
 * @param weekKey ISO week key (e.g., "2025-47")
 * @param limit Number of collections to return
 * @returns Rotated collection subset
 */
const rotateCollections = (weekKey: string | null | undefined, limit: number): HomeCollectionSummary[] => {
  const allCollections = EVENT_COLLECTIONS.map((collection) => ({
    id: collection.id,
    title: collection.title,
    coverUrl: getImageUri(collection.image) ?? '',
    blurb: collection.summary,
    previewCount: collection.eventIds.length,
  }));

  // If no weekKey provided, return first N collections
  if (!weekKey) {
    return allCollections.slice(0, limit);
  }

  // Extract week number from weekKey (format: "YYYY-WW")
  const weekNumber = parseInt(weekKey.split('-')[1], 10);
  if (isNaN(weekNumber)) {
    console.warn('Invalid weekKey format, falling back to default rotation');
    return allCollections.slice(0, limit);
  }

  // Calculate starting index using modulo for wraparound
  const startIndex = (weekNumber * limit) % allCollections.length;

  // Select N consecutive collections with wraparound
  const selected: HomeCollectionSummary[] = [];
  for (let i = 0; i < limit; i++) {
    selected.push(allCollections[(startIndex + i) % allCollections.length]);
  }

  return selected;
};

const getFallbackCollections = (weekKey?: string | null, limit?: number) => {
  const allCollections = EVENT_COLLECTIONS.map((collection) => ({
    id: collection.id,
    title: collection.title,
    coverUrl: getImageUri(collection.image) ?? '',
    blurb: collection.summary,
    previewCount: collection.eventIds.length,
  }));

  // Apply rotation if weekKey and limit provided
  if (weekKey && typeof limit === 'number') {
    return rotateCollections(weekKey, limit);
  }

  // Otherwise return all or limited subset
  return typeof limit === 'number' ? allCollections.slice(0, limit) : allCollections;
};

export const fetchWeeklyCollections = async ({
  weekKey,
  limit = 4,
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
    console.warn('Falling back to local weekly collections with rotation', error);
    const items = getFallbackCollections(weekKey, limit);
    return {
      items,
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
