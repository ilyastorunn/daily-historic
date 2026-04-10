import { createHash } from 'node:crypto';

import { fetchWithRetry } from './http-utils';
import type {
  EventSourceRef,
  HistoricalEventRecord,
  MediaAssetSummary,
  RelatedPageSummary,
} from './types';
import { buildTimeMachineCanonicalKey, toTimeMachineDateISO } from '../../utils/time-machine';

const MEDIAWIKI_API_ENDPOINT = 'https://en.wikipedia.org/w/api.php';
const YEAR_PAGE_PARSER_VERSION = 'wikimedia-year-page/v1';
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
const MONTH_INDEX = new Map(MONTHS.map((month, index) => [month.toLowerCase(), index + 1]));
const PAGE_QUERY_CHUNK_SIZE = 20;
const LINK_TITLE_BLOCKLIST = /^(File|Image|Category|Template|Help|Portal|Draft):/i;

export interface WikimediaYearClientOptions {
  userAgent: string;
  token?: string;
  baseUrl?: string;
}

export interface FetchYearPageOptions extends WikimediaYearClientOptions {
  year: number;
}

export interface YearPagePayload {
  year: number;
  pageTitle: string;
  revisionId?: number;
  wikitext: string;
  capturedAt: string;
  sourceKey: string;
}

export interface ParsedYearPageEvent {
  year: number;
  month: number;
  day: number;
  text: string;
  sourceKey: string;
  qualityFlags: string[];
  rawLine: string;
  pageTitles: string[];
}

interface ParseResponse {
  parse?: {
    title?: string;
    revid?: number;
    wikitext?: string;
  };
}

interface QueryResponse {
  query?: {
    pages?: {
      pageid?: number;
      title?: string;
      missing?: boolean;
      extract?: string;
      fullurl?: string;
      canonicalurl?: string;
      thumbnail?: {
        source: string;
        width: number;
        height: number;
      };
      original?: {
        source: string;
        width: number;
        height: number;
      };
      pageprops?: {
        wikibase_item?: string;
      };
    }[];
  };
}

const requireUserAgent = (userAgent?: string) => {
  if (!userAgent) {
    throw new Error('Wikimedia requests require a descriptive user agent.');
  }
};

const buildApiUrl = (baseUrl: string, params: Record<string, string>) => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const stripComments = (value: string) => value.replace(/<!--[\s\S]*?-->/g, ' ');
const stripRefs = (value: string) => value.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, ' ').replace(/<ref[^/>]*\/>/gi, ' ');

const stripTemplates = (value: string) => {
  let next = value;
  while (/\{\{[^{}]*\}\}/.test(next)) {
    next = next.replace(/\{\{[^{}]*\}\}/g, ' ');
  }
  return next;
};

const decodeEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—');

const unwrapLinks = (value: string) =>
  value
    .replace(/\[\[([^[\]|#]+)(?:#[^[\]|]+)?\|([^[\]]+)\]\]/g, '$2')
    .replace(/\[\[([^[\]|#]+)(?:#[^[\]|]+)?\]\]/g, '$1')
    .replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '$2');

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const normalizeWikitextToPlainText = (value: string) => {
  return normalizeWhitespace(
    decodeEntities(
      unwrapLinks(
        stripTemplates(
          stripRefs(
            stripComments(value)
          )
        )
      )
        .replace(/''+/g, '')
        .replace(/<[^>]+>/g, ' ')
    )
  );
};

const extractPageTitles = (value: string) => {
  const titles = new Set<string>();
  const matches = value.matchAll(/\[\[([^[\]|#]+)(?:#[^[\]|]+)?(?:\|([^[\]]+))?\]\]/g);

  for (const match of matches) {
    const rawTitle = match[1]?.trim();
    if (!rawTitle || LINK_TITLE_BLOCKLIST.test(rawTitle)) {
      continue;
    }
    titles.add(rawTitle.replace(/_/g, ' '));
  }

  return Array.from(titles);
};

const buildYearPageSourceKey = (year: number, month: number, day: number, rawLine: string) => {
  const hash = createHash('sha256');
  hash.update(String(year));
  hash.update('|');
  hash.update(String(month));
  hash.update('|');
  hash.update(String(day));
  hash.update('|');
  hash.update(rawLine);
  return `year-page:${year}:${month}:${day}:${hash.digest('hex').slice(0, 16)}`;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MONTH_PATTERN = MONTHS.map((month) => escapeRegExp(month)).join('|');

const stripListPrefix = (line: string) => line.replace(/^[*#;:]+\s*/, '').trim();

const extractDateAndBody = (rawLine: string, currentMonth: number | null) => {
  const normalized = normalizeWikitextToPlainText(stripListPrefix(rawLine));
  if (!normalized) {
    return null;
  }

  const matchers: {
    pattern: RegExp;
    resolve: (match: RegExpExecArray) => { month: number; day: number; body: string; qualityFlags: string[] } | null;
  }[] = [
    {
      pattern: new RegExp(`^(${MONTH_PATTERN})\\s+(\\d{1,2})(?:\\s*[–-]\\s*\\d{1,2})?\\s*[–—:-]\\s*(.+)$`, 'i'),
      resolve: (match) => ({
        month: MONTH_INDEX.get(match[1].toLowerCase()) ?? 0,
        day: Number.parseInt(match[2], 10),
        body: match[3].trim(),
        qualityFlags: /[–-]\s*\d{1,2}\s*[–—:-]/.test(match[0]) ? ['date-range'] : [],
      }),
    },
    {
      pattern: new RegExp(`^(\\d{1,2})(?:\\s*[–-]\\s*\\d{1,2})?\\s+(${MONTH_PATTERN})\\s*[–—:-]\\s*(.+)$`, 'i'),
      resolve: (match) => ({
        month: MONTH_INDEX.get(match[2].toLowerCase()) ?? 0,
        day: Number.parseInt(match[1], 10),
        body: match[3].trim(),
        qualityFlags: /[–-]\s*\d{1,2}\s+/.test(match[0]) ? ['date-range'] : [],
      }),
    },
    {
      pattern: /^(\d{1,2})(?:\s*[–-]\s*\d{1,2})?\s*[–—:-]\s*(.+)$/i,
      resolve: (match) => {
        if (currentMonth === null) {
          return null;
        }

        return {
          month: currentMonth,
          day: Number.parseInt(match[1], 10),
          body: match[2].trim(),
          qualityFlags: /[–-]\s*\d{1,2}\s*[–—:-]/.test(match[0]) ? ['date-range'] : [],
        };
      },
    },
  ];

  for (const matcher of matchers) {
    const match = matcher.pattern.exec(normalized);
    if (!match) {
      continue;
    }

    const resolved = matcher.resolve(match);
    if (!resolved) {
      continue;
    }
    if (resolved.month < 1 || resolved.month > 12 || resolved.day < 1 || resolved.day > 31) {
      return null;
    }
    return resolved;
  }

  return null;
};

const extractEventsSection = (wikitext: string) => {
  const lines = wikitext.split('\n');
  const extracted: string[] = [];
  let inEventsSection = false;

  for (const line of lines) {
    const levelTwoHeading = /^==\s*([^=]+?)\s*==\s*$/.exec(line);
    if (levelTwoHeading) {
      const heading = levelTwoHeading[1]?.trim().toLowerCase() ?? '';
      if (heading === 'events') {
        inEventsSection = true;
        continue;
      }
      if (inEventsSection) {
        break;
      }
    }

    if (!inEventsSection) {
      continue;
    }

    extracted.push(line);
  }

  return extracted;
};

export const parseYearPageEvents = (wikitext: string, year: number): ParsedYearPageEvent[] => {
  const eventsSectionLines = extractEventsSection(wikitext);
  const events: ParsedYearPageEvent[] = [];
  let currentMonth: number | null = null;

  for (const rawLine of eventsSectionLines) {
    const monthHeading = /^===\s*([^=]+?)\s*===\s*$/.exec(rawLine);
    if (monthHeading) {
      const normalizedMonth = monthHeading[1]?.trim().toLowerCase() ?? '';
      currentMonth = MONTH_INDEX.get(normalizedMonth) ?? null;
      continue;
    }

    if (!/^[*#]/.test(rawLine.trim())) {
      continue;
    }

    const parsed = extractDateAndBody(rawLine, currentMonth);
    if (!parsed) {
      continue;
    }

    const pageTitles = extractPageTitles(rawLine);
    if (pageTitles.length === 0) {
      continue;
    }

    events.push({
      year,
      month: parsed.month,
      day: parsed.day,
      text: parsed.body,
      sourceKey: buildYearPageSourceKey(year, parsed.month, parsed.day, rawLine),
      qualityFlags: parsed.qualityFlags,
      rawLine,
      pageTitles,
    });
  }

  return events;
};

export const fetchYearPageWikitext = async (options: FetchYearPageOptions): Promise<YearPagePayload> => {
  const { year, userAgent, token, baseUrl = MEDIAWIKI_API_ENDPOINT } = options;
  requireUserAgent(userAgent);

  const endpoint = buildApiUrl(baseUrl, {
    action: 'parse',
    page: String(year),
    prop: 'wikitext|revid',
    format: 'json',
    formatversion: '2',
    redirects: '1',
  });

  const response = await fetchWithRetry(
    endpoint,
    {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
    {}
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch year page ${year}: ${response.status} ${response.statusText} -> ${text}`);
  }

  const payload = (await response.json()) as ParseResponse;
  const wikitext = payload.parse?.wikitext;
  if (!wikitext) {
    throw new Error(`Year page ${year} did not return wikitext.`);
  }

  const capturedAt = new Date().toISOString();
  return {
    year,
    pageTitle: payload.parse?.title ?? String(year),
    revisionId: payload.parse?.revid,
    wikitext,
    capturedAt,
    sourceKey: `year-page:${year}`,
  };
};

const chunkArray = <T>(values: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

const toMediaAssets = (page: {
  thumbnail?: { source: string; width: number; height: number };
  original?: { source: string; width: number; height: number };
}) => {
  const assets: MediaAssetSummary[] = [];

  if (page.thumbnail) {
    assets.push({
      id: `${page.thumbnail.source}:thumbnail`,
      sourceUrl: page.thumbnail.source,
      width: page.thumbnail.width,
      height: page.thumbnail.height,
      provider: 'wikimedia',
      assetType: 'thumbnail',
    });
  }

  if (page.original) {
    assets.push({
      id: `${page.original.source}:original`,
      sourceUrl: page.original.source,
      width: page.original.width,
      height: page.original.height,
      provider: 'wikimedia',
      assetType: 'original',
    });
  }

  return assets;
};

const toWikipediaUrl = (title: string) => {
  const path = title.replace(/\s+/g, '_');
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(path)}`;
};

export const fetchPageSummariesByTitles = async (
  titles: string[],
  options: WikimediaYearClientOptions
) => {
  requireUserAgent(options.userAgent);

  const uniqueTitles = Array.from(new Set(titles.map((title) => title.trim()).filter(Boolean)));
  const pageMap = new Map<string, RelatedPageSummary>();

  for (const chunk of chunkArray(uniqueTitles, PAGE_QUERY_CHUNK_SIZE)) {
    const endpoint = buildApiUrl(options.baseUrl ?? MEDIAWIKI_API_ENDPOINT, {
      action: 'query',
      prop: 'pageprops|pageimages|extracts|info',
      inprop: 'url',
      piprop: 'thumbnail|original',
      pithumbsize: '1200',
      exintro: '1',
      explaintext: '1',
      redirects: '1',
      titles: chunk.join('|'),
      format: 'json',
      formatversion: '2',
    });

    const response = await fetchWithRetry(
      endpoint,
      {
        headers: {
          'User-Agent': options.userAgent,
          Accept: 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
      },
      {}
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to resolve page summaries: ${response.status} ${response.statusText} -> ${text}`);
    }

    const payload = (await response.json()) as QueryResponse;
    const pages = payload.query?.pages ?? [];

    for (const page of pages) {
      if (!page.title || page.missing || typeof page.pageid !== 'number' || page.pageid <= 0) {
        continue;
      }

      const thumbnails = toMediaAssets(page);
      const selectedMedia = thumbnails.find((asset) => asset.assetType === 'original') ?? thumbnails[0];
      const url = page.canonicalurl ?? page.fullurl ?? toWikipediaUrl(page.title);

      const summary: RelatedPageSummary = {
        pageId: page.pageid,
        canonicalTitle: page.title,
        displayTitle: page.title,
        normalizedTitle: page.title.replace(/_/g, ' '),
        extract: page.extract,
        wikidataId: page.pageprops?.wikibase_item,
        desktopUrl: url,
        mobileUrl: url,
        thumbnails,
        selectedMedia,
      };

      pageMap.set(page.title, summary);
      pageMap.set(page.title.replace(/_/g, ' '), summary);
    }
  }

  return pageMap;
};

const buildSourceRef = (payload: YearPagePayload): EventSourceRef => ({
  provider: 'wikimedia',
  feed: 'year-page',
  rawType: 'events',
  capturedAt: payload.capturedAt,
  sourceDate: String(payload.year),
  payloadCacheKey: payload.sourceKey,
  pageTitle: payload.pageTitle,
  revisionId: payload.revisionId,
});

const buildEventId = (canonicalKey: string) => {
  return createHash('sha256').update(canonicalKey).digest('hex').slice(0, 32);
};

export const normalizeYearPageEvent = (
  event: ParsedYearPageEvent,
  payload: YearPagePayload,
  pageMap: Map<string, RelatedPageSummary>
): HistoricalEventRecord | null => {
  const relatedPages = event.pageTitles
    .map((title) => pageMap.get(title))
    .filter((page): page is RelatedPageSummary => page !== undefined);

  if (relatedPages.length === 0) {
    return null;
  }

  const canonicalLead =
    relatedPages[0]?.canonicalTitle ??
    relatedPages[0]?.displayTitle ??
    event.text;
  const canonicalKey = buildTimeMachineCanonicalKey({
    year: event.year,
    month: event.month,
    day: event.day,
    lead: canonicalLead,
  });

  return {
    eventId: buildEventId(canonicalKey),
    canonicalKey,
    year: event.year,
    text: event.text,
    summary: event.text,
    categories: [],
    era: undefined,
    tags: [],
    date: {
      month: event.month,
      day: event.day,
    },
    dateISO: toTimeMachineDateISO(event.year, event.month, event.day),
    relatedPages,
    source: buildSourceRef(payload),
    createdAt: payload.capturedAt,
    updatedAt: payload.capturedAt,
    timeMachine: {
      eligible: true,
      sourceType: 'wikipedia-year-page',
      sourceTypes: ['wikipedia-year-page'],
      sourceKey: event.sourceKey,
      parserVersion: YEAR_PAGE_PARSER_VERSION,
      qualityFlags: event.qualityFlags,
    },
  };
};
