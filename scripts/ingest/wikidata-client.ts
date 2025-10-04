import { fetchWithRetry } from './http-utils';
import type { WikidataEntitySummary } from './types';

const WIKIDATA_ENTITY_ENDPOINT = 'https://www.wikidata.org/wiki/Special:EntityData';

export interface WikidataClientOptions {
  userAgent: string;
  language?: string;
  baseUrl?: string;
  concurrency?: number;
  retryAttempts?: number;
  retryBaseDelayMs?: number;
}

interface RawWikidataResponse {
  entities: Record<string, RawWikidataEntity>;
}

interface RawWikidataEntity {
  id: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, RawWikidataClaim[]>;
}

interface RawWikidataClaim {
  mainsnak?: {
    datavalue?: {
      value?: RawWikidataValue;
    };
  };
}

type RawWikidataValue =
  | {
      time?: string;
    }
  | {
      id?: string;
    }
  | {
      'entity-type'?: string;
      'numeric-id'?: number;
      id?: string;
    };

const parseTimeClaim = (claims?: RawWikidataClaim[]): string | undefined => {
  if (!claims?.length) {
    return undefined;
  }

  for (const claim of claims) {
    const value = claim.mainsnak?.datavalue?.value as { time?: string } | undefined;
    const time = value?.time;
    if (!time) {
      continue;
    }

    const normalized = time.startsWith('+') ? time.slice(1) : time;
    const isoDate = normalized.slice(0, 10);
    if (isoDate && isoDate !== '0000-00-00') {
      return isoDate;
    }
  }

  return undefined;
};

const extractEntityIds = (claims?: RawWikidataClaim[]): string[] => {
  if (!claims?.length) {
    return [];
  }

  const ids = new Set<string>();

  for (const claim of claims) {
    const value = claim.mainsnak?.datavalue?.value as RawWikidataValue | undefined;
    if (!value) {
      continue;
    }

    if (typeof (value as { id?: string }).id === 'string') {
      ids.add((value as { id: string }).id);
      continue;
    }

    const numericId = (value as { 'numeric-id'?: number })['numeric-id'];
    if (numericId) {
      ids.add(`Q${numericId}`);
    }
  }

  return Array.from(ids);
};

const extractLabel = (entity: RawWikidataEntity, language: string): string => {
  const labels = entity.labels ?? {};
  return labels[language]?.value ?? labels.en?.value ?? entity.id;
};

const extractDescription = (entity: RawWikidataEntity, language: string): string | undefined => {
  const descriptions = entity.descriptions ?? {};
  return descriptions[language]?.value ?? descriptions.en?.value;
};

const toEntitySummary = (
  entity: RawWikidataEntity,
  language: string
): WikidataEntitySummary => {
  const claims = entity.claims ?? {};

  return {
    id: entity.id,
    label: extractLabel(entity, language),
    description: extractDescription(entity, language),
    instanceOfIds: extractEntityIds(claims.P31),
    subclassOfIds: extractEntityIds(claims.P279),
    genreIds: extractEntityIds(claims.P136),
    participantIds: extractEntityIds(claims.P710),
    pointInTime: parseTimeClaim(claims.P585),
  };
};

const entityCache = new Map<string, WikidataEntitySummary>();
const entityFailureCache = new Set<string>();

const buildCacheKey = (id: string, language: string, baseUrl?: string) => {
  return `${id}:${language}:${baseUrl ?? ''}`;
};

const fetchSingleEntity = async (
  id: string,
  options: WikidataClientOptions
): Promise<WikidataEntitySummary | undefined> => {
  const { userAgent, language = 'en', baseUrl, retryAttempts, retryBaseDelayMs } = options;
  const cacheKey = buildCacheKey(id, language, baseUrl);

  if (entityCache.has(cacheKey)) {
    return entityCache.get(cacheKey);
  }

  if (entityFailureCache.has(cacheKey)) {
    return undefined;
  }

  const endpoint = `${baseUrl ?? WIKIDATA_ENTITY_ENDPOINT}/${encodeURIComponent(id)}.json`;

  const response = await fetchWithRetry(
    endpoint,
    {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
      redirect: 'follow',
    },
    {
      attempts: retryAttempts,
      baseDelayMs: retryBaseDelayMs,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.warn(`Wikidata fetch failed for ${id}: ${response.status} ${response.statusText} -> ${text}`);
    entityFailureCache.add(cacheKey);
    return undefined;
  }

  const json = (await response.json()) as RawWikidataResponse;
  const entity = json.entities?.[id];

  if (!entity) {
    console.warn(`Wikidata entity missing in payload for ${id}.`);
    entityFailureCache.add(cacheKey);
    return undefined;
  }

  const summary = toEntitySummary(entity, language);
  entityCache.set(cacheKey, summary);
  return summary;
};

const runWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  handler: (item: T) => Promise<R>
): Promise<R[]> => {
  if (limit <= 1) {
    const results: R[] = [];
    for (const item of items) {
      results.push(await handler(item));
    }
    return results;
  }

  const queue = [...items];
  const active: Promise<R>[] = [];
  const results: R[] = [];

  const scheduleNext = () => {
    if (queue.length === 0) {
      return;
    }

    const item = queue.shift();
    if (item === undefined) {
      return;
    }

    const promise = handler(item).then((result) => {
      results.push(result);
      const index = active.indexOf(promise);
      if (index >= 0) {
        active.splice(index, 1);
      }
      scheduleNext();
      return result;
    });

    active.push(promise);
  };

  while (active.length < limit && queue.length > 0) {
    scheduleNext();
  }

  while (active.length) {
    await Promise.race(active);
  }

  return results;
};

export const fetchWikidataEntities = async (
  ids: string[],
  options: WikidataClientOptions
): Promise<Record<string, WikidataEntitySummary>> => {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  const summaries: Record<string, WikidataEntitySummary> = {};

  const { concurrency = 4 } = options;

  await runWithConcurrency(uniqueIds, Math.max(1, concurrency), async (id) => {
    try {
      const summary = await fetchSingleEntity(id, options);
      if (summary) {
        summaries[summary.id] = summary;
      }
    } catch (error) {
      console.warn(`Failed to process Wikidata entity ${id}:`, error);
    }
  });

  return summaries;
};
