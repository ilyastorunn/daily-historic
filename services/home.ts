import {
  EVENT_COLLECTIONS,
  EVENT_LIBRARY,
  MONTHLY_COLLECTIONS,
  type EventRecord,
  type MonthlyCollection,
  type MonthlyCollectionIAEMeta,
} from '@/constants/events';
import { getImageUri } from '@/utils/image-source';

export type HomeCollectionSummary = {
  id: string;
  title: string;
  coverUrl: string;
  blurb?: string;
  previewCount?: number;
};

export type MonthlyFeaturedEventSummary = {
  id: string;
  title: string;
  summary: string;
  year?: number;
  imageUrl?: string;
  categoryIds?: string[];
};

export type MonthlyCollectionSummary = {
  id: string;
  monthKey: string;
  title: string;
  subtitle: string;
  heroBlurb: string;
  coverUrl: string;
  iaeMeta: MonthlyCollectionIAEMeta;
  featuredItems: MonthlyFeaturedEventSummary[];
};

export type CollectionDetail = {
  id: string;
  title: string;
  subtitle?: string;
  monthKey?: string;
  coverUrl: string;
  blurb?: string;
  heroBlurb?: string;
  iaeMeta?: MonthlyCollectionIAEMeta;
  featuredItems?: MonthlyFeaturedEventSummary[];
  items: {
    id: string;
    title: string;
    summary: string;
    year?: number;
    imageUrl?: string;
    categoryIds?: string[];
  }[];
};

export type MonthlyIAEPackage = {
  collectionId: string;
  monthKey: string;
  eventName: string;
  shortPromo: string;
  longPromo: string;
  ctaLabel: string;
  deeplink: string;
};

type FetchWeeklyCollectionsArgs = {
  weekKey?: string | null;
  limit?: number;
};

type FetchMonthlyCollectionArgs = {
  monthKey?: string | null;
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

const mapEventRecordToSummary = (event: EventRecord): MonthlyFeaturedEventSummary => ({
  id: event.id,
  title: event.title,
  summary: event.summary,
  year: Number(event.year) || undefined,
  imageUrl: getImageUri(event.image) ?? undefined,
  categoryIds: event.categories,
});

const createSeedFromKey = (key: string) => {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return hash || 1;
};

const createDeterministicRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const deterministicShuffle = <T,>(items: T[], key: string) => {
  const shuffled = [...items];
  const rng = createDeterministicRng(createSeedFromKey(key));

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

const parseMonthFromMonthKey = (monthKey?: string | null) => {
  if (!monthKey) {
    return null;
  }
  const monthPart = Number(monthKey.split('-')[1]);
  if (Number.isNaN(monthPart) || monthPart < 1 || monthPart > 12) {
    return null;
  }
  return monthPart;
};

const mapMonthlyCollectionToSummary = (
  collection: MonthlyCollection,
  featuredItems: MonthlyFeaturedEventSummary[]
): MonthlyCollectionSummary => ({
  id: collection.id,
  monthKey: collection.monthKey,
  title: collection.title,
  subtitle: collection.subtitle,
  heroBlurb: collection.heroBlurb,
  coverUrl: getImageUri(collection.coverImage ?? collection.image) ?? '',
  iaeMeta: collection.iaeMeta,
  featuredItems,
});

const selectMonthlyCollection = (monthKey?: string | null): MonthlyCollection => {
  if (!monthKey) {
    return MONTHLY_COLLECTIONS[0];
  }

  const exact = MONTHLY_COLLECTIONS.find((collection) => collection.monthKey === monthKey);
  if (exact) {
    return exact;
  }

  const targetMonth = parseMonthFromMonthKey(monthKey);
  if (!targetMonth) {
    return MONTHLY_COLLECTIONS[0];
  }

  const sameMonth = MONTHLY_COLLECTIONS
    .filter((collection) => Number(collection.monthKey.split('-')[1]) === targetMonth)
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  if (sameMonth.length > 0) {
    return sameMonth[0];
  }

  return MONTHLY_COLLECTIONS[(targetMonth - 1) % MONTHLY_COLLECTIONS.length];
};

export const getMonthlyIAEPackage = (monthKey?: string | null): MonthlyIAEPackage => {
  const collection = selectMonthlyCollection(monthKey);
  return {
    collectionId: collection.id,
    monthKey: collection.monthKey,
    eventName: collection.iaeMeta.eventName,
    shortPromo: collection.iaeMeta.shortPromo,
    longPromo: collection.iaeMeta.longPromo,
    ctaLabel: collection.iaeMeta.ctaLabel,
    deeplink: `/collection/${collection.id}`,
  };
};

export const getWeeklyFeaturedFromMonthly = ({
  monthKey,
  weekKey,
  limit = 4,
}: {
  monthKey?: string | null;
  weekKey?: string | null;
  limit?: number;
}): MonthlyFeaturedEventSummary[] => {
  const collection = selectMonthlyCollection(monthKey);
  const shuffledEventIds = deterministicShuffle(
    [...collection.eventIds],
    `${collection.monthKey}:${weekKey ?? 'no-week-key'}`
  );

  const selectedIds = shuffledEventIds.slice(0, Math.min(limit, collection.eventIds.length));

  return selectedIds
    .map((eventId) => EVENT_LIBRARY.find((event) => event.id === eventId))
    .filter((event): event is EventRecord => Boolean(event))
    .map(mapEventRecordToSummary);
};

const getFallbackMonthlyCollection = ({
  monthKey,
  weekKey,
  limit = 4,
}: FetchMonthlyCollectionArgs): { item: MonthlyCollectionSummary; generatedAt: string } => {
  const collection = selectMonthlyCollection(monthKey);
  const featuredItems = getWeeklyFeaturedFromMonthly({
    monthKey: collection.monthKey,
    weekKey,
    limit,
  });

  return {
    item: mapMonthlyCollectionToSummary(collection, featuredItems),
    generatedAt: new Date().toISOString(),
  };
};

export const fetchMonthlyCollection = async ({
  monthKey,
  weekKey,
  limit = 4,
}: FetchMonthlyCollectionArgs): Promise<{ item: MonthlyCollectionSummary; generatedAt: string }> => {
  try {
    const result = await fetchJson<{ item: MonthlyCollectionSummary; generatedAt: string }>(
      buildUrl('/home/monthly-collection', {
        monthKey: monthKey ?? undefined,
        weekKey: weekKey ?? undefined,
        limit,
      })
    );
    return result;
  } catch (error) {
    console.warn('Falling back to local monthly collection', error);
    return getFallbackMonthlyCollection({ monthKey, weekKey, limit });
  }
};

/**
 * @deprecated Use fetchMonthlyCollection instead.
 */
export const fetchWeeklyCollections = async ({
  weekKey,
  limit = 4,
}: FetchWeeklyCollectionsArgs): Promise<{ items: HomeCollectionSummary[]; generatedAt: string }> => {
  const allCollections = EVENT_COLLECTIONS.map((collection) => ({
    id: collection.id,
    title: collection.title,
    coverUrl: getImageUri(collection.coverImage ?? collection.image) ?? '',
    blurb: collection.summary,
    previewCount: collection.eventIds.length,
  }));

  const items = weekKey
    ? deterministicShuffle(allCollections, `legacy:${weekKey}`).slice(0, Math.min(limit, allCollections.length))
    : allCollections.slice(0, limit);

  return {
    items,
    generatedAt: new Date().toISOString(),
  };
};

const mapCollectionItems = (eventIds: string[]) =>
  eventIds
    .map((eventId) => EVENT_LIBRARY.find((event) => event.id === eventId))
    .filter((event): event is EventRecord => Boolean(event))
    .map((event) => ({
      id: event.id,
      title: event.title,
      summary: event.summary,
      year: Number(event.year) || undefined,
      imageUrl: getImageUri(event.image) ?? undefined,
      categoryIds: event.categories,
    }));

export const fetchCollectionDetail = async (collectionId: string): Promise<CollectionDetail> => {
  if (!collectionId) {
    throw new Error('collectionId is required');
  }
  try {
    return await fetchJson<CollectionDetail>(buildUrl(`/collections/${collectionId}`));
  } catch (error) {
    console.warn('Falling back to local collection detail', error);

    const monthlyMatch = MONTHLY_COLLECTIONS.find((collection) => collection.id === collectionId);
    if (monthlyMatch) {
      const featuredItems = monthlyMatch.featuredEventIds
        .map((eventId) => EVENT_LIBRARY.find((event) => event.id === eventId))
        .filter((event): event is EventRecord => Boolean(event))
        .map(mapEventRecordToSummary);

      return {
        id: monthlyMatch.id,
        title: monthlyMatch.title,
        subtitle: monthlyMatch.subtitle,
        monthKey: monthlyMatch.monthKey,
        coverUrl: getImageUri(monthlyMatch.coverImage ?? monthlyMatch.image) ?? '',
        blurb: monthlyMatch.summary,
        heroBlurb: monthlyMatch.heroBlurb,
        iaeMeta: monthlyMatch.iaeMeta,
        featuredItems,
        items: mapCollectionItems(monthlyMatch.eventIds),
      };
    }

    const legacyMatch = EVENT_COLLECTIONS.find((collection) => collection.id === collectionId);
    if (!legacyMatch) {
      throw error instanceof Error ? error : new Error('Collection not found');
    }

    return {
      id: legacyMatch.id,
      title: legacyMatch.title,
      coverUrl: getImageUri(legacyMatch.coverImage ?? legacyMatch.image) ?? '',
      blurb: legacyMatch.summary,
      items: mapCollectionItems(legacyMatch.eventIds),
    };
  }
};
