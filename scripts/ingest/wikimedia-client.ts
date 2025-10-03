import { createHash } from 'node:crypto';

import type {
  HistoricalEventRecord,
  RawOnThisDayEvent,
  RawOnThisDayPage,
  RawOnThisDayResponse,
  RelatedPageSummary,
  MediaAssetSummary,
  EventSourceRef,
} from './types';

const WIKIMEDIA_ON_THIS_DAY_ENDPOINT = 'https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected';

export interface WikimediaClientOptions {
  userAgent: string;
  token?: string;
  baseUrl?: string;
}

export interface FetchOnThisDayOptions extends WikimediaClientOptions {
  month: number;
  day: number;
}

export interface OnThisDayPayload {
  raw: RawOnThisDayResponse;
  events: RawOnThisDayEvent[];
  capturedAt: string;
}

const toTwoDigits = (value: number) => value.toString().padStart(2, '0');

export const buildCacheKey = (month: number, day: number) => {
  return `onthisday:selected:${toTwoDigits(month)}-${toTwoDigits(day)}`;
};

export const fetchOnThisDaySelected = async (options: FetchOnThisDayOptions): Promise<OnThisDayPayload> => {
  const { month, day, userAgent, token, baseUrl } = options;
  if (!userAgent) {
    throw new Error('Wikimedia requests require a descriptive user agent.');
  }

  const endpoint = `${baseUrl ?? WIKIMEDIA_ON_THIS_DAY_ENDPOINT}/${toTwoDigits(month)}/${toTwoDigits(day)}`;

  const response = await fetch(endpoint, {
    headers: {
      'User-Agent': userAgent,
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch On This Day data: ${response.status} ${response.statusText} -> ${text}`);
  }

  const payload = (await response.json()) as RawOnThisDayResponse;
  const capturedAt = new Date().toISOString();

  return {
    raw: payload,
    events: payload.selected ?? [],
    capturedAt,
  };
};

export interface NormalizationContext {
  month: number;
  day: number;
  capturedAt: string;
  rawType: string;
  cacheKey: string;
}

const normalizeMedia = (pageId: number, page: RawOnThisDayPage): MediaAssetSummary[] => {
  const assets: MediaAssetSummary[] = [];

  if (page.thumbnail) {
    assets.push({
      id: `${pageId}:thumbnail`,
      sourceUrl: page.thumbnail.source,
      width: page.thumbnail.width,
      height: page.thumbnail.height,
      provider: 'wikimedia',
      assetType: 'thumbnail',
      altText: page.description,
    });
  }

  if (page.originalimage) {
    assets.push({
      id: `${pageId}:original`,
      sourceUrl: page.originalimage.source,
      width: page.originalimage.width,
      height: page.originalimage.height,
      provider: 'wikimedia',
      assetType: 'original',
      altText: page.description,
    });
  }

  return assets;
};

const normalizeRelatedPage = (page: RawOnThisDayPage): RelatedPageSummary => {
  const thumbnails = normalizeMedia(page.pageid, page);

  return {
    pageId: page.pageid,
    canonicalTitle: page.titles.canonical,
    displayTitle: page.titles.display,
    normalizedTitle: page.titles.normalized,
    description: page.description,
    extract: page.extract,
    wikidataId: page.wikibase_item,
    desktopUrl: page.content_urls.desktop.page,
    mobileUrl: page.content_urls.mobile.page,
    thumbnails,
  };
};

const buildEventId = (event: RawOnThisDayEvent, context: NormalizationContext) => {
  const hash = createHash('sha256');
  hash.update(event.text ?? '');
  hash.update('|');
  hash.update(String(event.year ?? 'unknown'));
  hash.update('|');
  hash.update(String(context.month));
  hash.update('|');
  hash.update(String(context.day));
  if (event.pages?.length) {
    for (const page of event.pages) {
      hash.update('|');
      hash.update(page.title ?? '');
    }
  }
  return hash.digest('hex').slice(0, 32);
};

const buildSourceRef = (context: NormalizationContext): EventSourceRef => ({
  provider: 'wikimedia',
  feed: 'onthisday',
  rawType: context.rawType,
  sourceDate: `${context.month.toString().padStart(2, '0')}-${context.day.toString().padStart(2, '0')}`,
  capturedAt: context.capturedAt,
  payloadCacheKey: context.cacheKey,
});

export const normalizeEvent = (
  event: RawOnThisDayEvent,
  context: NormalizationContext
): HistoricalEventRecord => {
  const eventId = buildEventId(event, context);
  const relatedPages = (event.pages ?? []).map(normalizeRelatedPage);

  return {
    eventId,
    year: event.year,
    text: event.text,
    summary: event.text,
    categories: [],
    era: undefined,
    tags: [],
    date: {
      month: context.month,
      day: context.day,
    },
    relatedPages,
    source: buildSourceRef(context),
    createdAt: context.capturedAt,
    updatedAt: context.capturedAt,
  };
};
