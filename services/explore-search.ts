import { buildAlgoliaSearchPayload, type ExploreSearchSortMode } from "@/search/algolia-query";
import type { AlgoliaSearchRecord } from "@/search/algolia-record";

export type ExploreSearchResultItem = AlgoliaSearchRecord;

type ExploreSearchParams = {
  query: string;
  categories?: string[];
  era?: string | null;
  month?: number;
  day?: number;
  page?: number;
  hitsPerPage?: number;
  sortMode?: ExploreSearchSortMode;
  signal?: AbortSignal;
};

type AlgoliaSearchResponse = {
  hits: (AlgoliaSearchRecord & { objectID?: string })[];
  page: number;
  nbPages: number;
  nbHits: number;
};

const ALGOLIA_APP_ID = process.env.EXPO_PUBLIC_ALGOLIA_APP_ID;
const ALGOLIA_SEARCH_API_KEY = process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_API_KEY;
const ALGOLIA_INDEX_EVENTS = process.env.EXPO_PUBLIC_ALGOLIA_INDEX_EVENTS;
const SEARCH_CACHE_TTL_MS = 30_000;

type CachedSearchResult = {
  expiresAt: number;
  value: {
    items: ExploreSearchResultItem[];
    page: number;
    hasMore: boolean;
    totalHits: number;
  };
};

const searchCache = new Map<string, CachedSearchResult>();

const getAlgoliaConfig = () => {
  if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_API_KEY || !ALGOLIA_INDEX_EVENTS) {
    throw new Error(
      "Algolia search env vars are missing. Set EXPO_PUBLIC_ALGOLIA_APP_ID, EXPO_PUBLIC_ALGOLIA_SEARCH_API_KEY, and EXPO_PUBLIC_ALGOLIA_INDEX_EVENTS."
    );
  }

  return {
    appId: ALGOLIA_APP_ID,
    apiKey: ALGOLIA_SEARCH_API_KEY,
    indexName: ALGOLIA_INDEX_EVENTS,
  };
};

export const searchExploreEvents = async ({
  query,
  categories = [],
  era = null,
  month,
  day,
  page = 0,
  hitsPerPage = 10,
  sortMode = "relevance",
  signal,
}: ExploreSearchParams) => {
  const { appId, apiKey, indexName } = getAlgoliaConfig();
  const { indexName: resolvedIndexName, payload } = buildAlgoliaSearchPayload(
    {
      query,
      filters: {
        categories,
        era,
        month,
        day,
      },
      page,
      hitsPerPage,
      sortMode,
    },
    indexName
  );
  const cacheKey = JSON.stringify([resolvedIndexName, payload]);
  const cached = searchCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const response = await fetch(
    `https://${appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(resolvedIndexName)}/query`,
    {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        "X-Algolia-API-Key": apiKey,
        "X-Algolia-Application-Id": appId,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Algolia search failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as AlgoliaSearchResponse;
  const items: ExploreSearchResultItem[] = (data.hits ?? []).map((hit) => ({
    ...hit,
    objectID: hit.objectID ?? hit.eventId,
  }));

  const result = {
    items,
    page: data.page,
    hasMore: data.page + 1 < data.nbPages,
    totalHits: data.nbHits,
  };

  searchCache.set(cacheKey, {
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    value: result,
  });

  return result;
};
