import { fetchWithRetry } from './http-utils';
import type { MediaAssetSummary, RelatedPageSummary } from './types';

const COMMONS_SEARCH_ENDPOINT = 'https://api.wikimedia.org/core/v1/commons/search/title';

export interface CommonsSearchOptions {
  userAgent: string;
  limit?: number;
  minWidth?: number;
  minHeight?: number;
  cacheTtlMs?: number;
  disableCache?: boolean;
  retryAttempts?: number;
  retryBaseDelayMs?: number;
}

interface CommonsSearchResponse {
  pages: CommonsMediaPage[];
}

interface CommonsMediaPage {
  title: string;
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
  original?: {
    url: string;
    width: number;
    height: number;
  };
  namespace: { id: number };
  file_page: string;
  license?: {
    name?: string;
    url?: string;
  };
  terms?: {
    description?: string[];
  };
}

const commonsCache = new Map<string, { asset: MediaAssetSummary | null; expiresAt: number }>();

const pickBestAsset = (
  page: CommonsMediaPage,
  minWidth: number,
  minHeight: number
): MediaAssetSummary | undefined => {
  const candidate = page.original ?? page.thumbnail;

  if (!candidate) {
    return undefined;
  }

  if (candidate.width < minWidth || candidate.height < minHeight) {
    return undefined;
  }

  return {
    id: page.title,
    sourceUrl: candidate.url,
    width: candidate.width,
    height: candidate.height,
    provider: 'wikimedia',
    assetType: candidate === page.original ? 'original' : 'thumbnail',
    license: page.license?.name,
    attribution: page.license?.url,
    altText: page.terms?.description?.[0],
  };
};

export const searchCommonsMedia = async (
  query: string,
  options: CommonsSearchOptions
): Promise<MediaAssetSummary | undefined> => {
  const {
    userAgent,
    limit = 5,
    minWidth = 800,
    minHeight = 600,
    cacheTtlMs = 5 * 60 * 1000,
    disableCache = false,
    retryAttempts,
    retryBaseDelayMs,
  } = options;

  if (!query.trim()) {
    return undefined;
  }

  const endpoint = `${COMMONS_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&limit=${limit}`;

  const cacheKey = `${endpoint}|${minWidth}|${minHeight}`;
  const now = Date.now();

  if (!disableCache && cacheTtlMs > 0) {
    const cached = commonsCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.asset ?? undefined;
    }
  }

  const response = await fetchWithRetry(
    endpoint,
    {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
    },
    {
      attempts: retryAttempts,
      baseDelayMs: retryBaseDelayMs,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.warn(`Commons search failed for query "${query}": ${response.status} ${response.statusText} -> ${text}`);
    if (!disableCache && cacheTtlMs > 0) {
      commonsCache.set(cacheKey, { asset: null, expiresAt: now + cacheTtlMs });
    }
    return undefined;
  }

  const payload = (await response.json()) as CommonsSearchResponse;
  const pages = payload.pages ?? [];

  for (const page of pages) {
    const asset = pickBestAsset(page, minWidth, minHeight);
    if (asset) {
      if (!disableCache && cacheTtlMs > 0) {
        commonsCache.set(cacheKey, { asset, expiresAt: now + cacheTtlMs });
      }
      return asset;
    }
  }

  if (!disableCache && cacheTtlMs > 0) {
    commonsCache.set(cacheKey, { asset: null, expiresAt: now + cacheTtlMs });
  }

  return undefined;
};

export interface MediaSelectionOptions extends CommonsSearchOptions {
  enableCommonsFallback?: boolean;
}

const hasSufficientAsset = (
  thumbnails: MediaAssetSummary[],
  minWidth: number,
  minHeight: number
) => {
  return thumbnails.some((asset) => asset.width >= minWidth && asset.height >= minHeight);
};

export const ensureMediaForEvent = async (
  pages: RelatedPageSummary[],
  options: MediaSelectionOptions
): Promise<MediaAssetSummary | undefined> => {
  const {
    enableCommonsFallback = true,
    minWidth = 800,
    minHeight = 600,
    userAgent,
    limit,
    cacheTtlMs,
    disableCache,
    retryAttempts,
    retryBaseDelayMs,
  } = options;

  const thumbnails = pages.flatMap((page) => page.thumbnails);
  if (hasSufficientAsset(thumbnails, minWidth, minHeight)) {
    return thumbnails.find((asset) => asset.width >= minWidth && asset.height >= minHeight);
  }

  if (!enableCommonsFallback) {
    return undefined;
  }

  if (!pages.length) {
    return undefined;
  }

  const primary = pages[0];

  const queries = new Set<string>([primary.normalizedTitle, primary.canonicalTitle, primary.displayTitle]);

  for (const query of queries) {
    if (!query) {
      continue;
    }
    const result = await searchCommonsMedia(query, {
      userAgent,
      minWidth,
      minHeight,
      limit,
      cacheTtlMs,
      disableCache,
      retryAttempts,
      retryBaseDelayMs,
    });

    if (result) {
      return result;
    }
  }

  return undefined;
};
