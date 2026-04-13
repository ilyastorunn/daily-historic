import { bootstrapFirestore } from './ingest/firestore-admin';
import { classifyEvent, inferEraForEvent } from './ingest/classification';
import type { HistoricalEventRecord } from './ingest/types';
import { existsSync } from 'node:fs';
import {
  CATEGORY_OPTIONS,
  ERA_OPTIONS,
  isCategoryOption,
  isEraOption,
  normalizeCategorySelection,
} from '../shared/taxonomy';

type CliOptions = {
  apply: boolean;
  projectId?: string;
  serviceAccountPath?: string;
  serviceAccountJson?: string;
  pageSize: number;
  maxDocs?: number;
  startAfter?: string;
};

type BackfillStats = {
  scanned: number;
  changed: number;
  unchanged: number;
  skippedMissingText: number;
  changedCategories: number;
  changedEra: number;
  lastEventId?: string;
};

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    apply: false,
    pageSize: 300,
  };

  for (const token of args) {
    const [flag, value] = token.split('=');
    switch (flag) {
      case '--apply':
        options.apply = true;
        break;
      case '--project-id':
        options.projectId = value;
        break;
      case '--service-account-path':
        options.serviceAccountPath = value;
        break;
      case '--service-account-json':
        options.serviceAccountJson = value;
        break;
      case '--page-size':
        if (value) {
          options.pageSize = Math.max(50, Math.min(500, Number.parseInt(value, 10) || 300));
        }
        break;
      case '--max-docs':
        if (value) {
          options.maxDocs = Math.max(1, Number.parseInt(value, 10));
        }
        break;
      case '--start-after':
        options.startAfter = value;
        break;
      default:
        break;
    }
  }

  return options;
};

const validCategorySet = new Set<string>(CATEGORY_OPTIONS);
const validEraSet = new Set<string>(ERA_OPTIONS);

const normalizeExistingCategories = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return normalizeCategorySelection(
    input.filter((value): value is string => typeof value === 'string' && validCategorySet.has(value))
  );
};

const toHistoricalSeed = (eventId: string, data: Record<string, unknown>): HistoricalEventRecord | null => {
  const text = typeof data.text === 'string' ? data.text : '';
  const summary = typeof data.summary === 'string' ? data.summary : text;
  if (!text && !summary) {
    return null;
  }

  const month = typeof data?.date === 'object' && data?.date
    && typeof (data.date as { month?: unknown }).month === 'number'
    ? (data.date as { month: number }).month
    : 1;
  const day = typeof data?.date === 'object' && data?.date
    && typeof (data.date as { day?: unknown }).day === 'number'
    ? (data.date as { day: number }).day
    : 1;

  const year = typeof data.year === 'number' ? data.year : undefined;

  return {
    eventId,
    canonicalKey: typeof data.canonicalKey === 'string' ? data.canonicalKey : `backfill:${eventId}`,
    year,
    text: text || summary,
    summary: summary || text,
    categories: [],
    era: undefined,
    tags: [],
    date: { month, day },
    dateISO: typeof data.dateISO === 'string' ? data.dateISO : `${year ?? 0}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    relatedPages: [],
    source: {
      provider: 'wikimedia',
      feed: 'year-page',
      rawType: 'backfill',
      capturedAt: new Date().toISOString(),
      sourceDate: typeof year === 'number' ? String(year) : 'unknown',
      payloadCacheKey: `backfill:${eventId}`,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    enrichment: {
      participantIds: [],
      participants: [],
      supportingEntityIds: [],
      exactDate:
        typeof data.enrichment === 'object' && data.enrichment
          ? (data.enrichment as { exactDate?: string }).exactDate
          : undefined,
    },
    timeMachine: {
      eligible: false,
      sourceType: 'wikipedia-year-page',
      sourceKey: `backfill:${eventId}`,
      parserVersion: 'category-era-backfill/v1',
      qualityFlags: [],
    },
  };
};

const classifyFallback = (eventId: string, data: Record<string, unknown>) => {
  const seed = toHistoricalSeed(eventId, data);
  if (!seed) {
    return null;
  }

  const result = classifyEvent({
    event: seed,
    relatedEntities: [],
  });

  return {
    categories: normalizeCategorySelection(result.categories.filter((value): value is string => isCategoryOption(value))),
    era: result.era && isEraOption(result.era) ? result.era : undefined,
  };
};

const resolveNextValues = (eventId: string, data: Record<string, unknown>) => {
  const currentCategories = normalizeExistingCategories(data.categories);
  const currentEra = typeof data.era === 'string' && validEraSet.has(data.era) ? data.era : undefined;

  let nextCategories = currentCategories;
  let nextEra = currentEra;

  const classification = classifyFallback(eventId, data);
  if (classification) {
    if (nextCategories.length === 0) {
      nextCategories = classification.categories;
    }

    if (!nextEra) {
      nextEra = classification.era;
    }
  }

  if (nextCategories.length === 0) {
    nextCategories = ['surprise'];
  }

  if (!nextEra) {
    const year = typeof data.year === 'number' ? data.year : undefined;
    const exactDate = typeof data.enrichment === 'object' && data.enrichment
      ? (data.enrichment as { exactDate?: string }).exactDate
      : undefined;
    nextEra = inferEraForEvent(year, exactDate);
  }

  return {
    currentCategories,
    currentEra,
    nextCategories,
    nextEra,
  };
};

const run = async () => {
  const options = parseArgs();
  const resolvedServiceAccountPath =
    options.serviceAccountPath ??
    (existsSync('./firebase-service-account.json') ? './firebase-service-account.json' : undefined);
  const { firestore, collections } = await bootstrapFirestore({
    projectId: options.projectId,
    serviceAccountPath: resolvedServiceAccountPath,
    serviceAccountJson: options.serviceAccountJson ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  });

  const stats: BackfillStats = {
    scanned: 0,
    changed: 0,
    unchanged: 0,
    skippedMissingText: 0,
    changedCategories: 0,
    changedEra: 0,
  };

  const examples: Array<{ eventId: string; before: { categories: string[]; era?: string }; after: { categories: string[]; era?: string } }> = [];

  let query = firestore.collection(collections.events).orderBy('eventId').limit(options.pageSize);
  if (options.startAfter) {
    query = query.startAfter(options.startAfter);
  }

  let batch = firestore.batch();
  let pendingOps = 0;
  const commitWithRetry = async (attempt = 1): Promise<void> => {
    try {
      await batch.commit();
    } catch (error) {
      if (attempt >= 3) {
        throw error;
      }
      const delayMs = 300 * attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await commitWithRetry(attempt + 1);
    }
  };

  const flush = async () => {
    if (!options.apply || pendingOps === 0) {
      return;
    }
    await commitWithRetry();
    batch = firestore.batch();
    pendingOps = 0;
  };

  while (true) {
    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    for (const doc of snapshot.docs) {
      stats.scanned += 1;
      stats.lastEventId = doc.id;

      const data = doc.data() as Record<string, unknown>;
      const resolved = resolveNextValues(doc.id, data);

      const categoriesChanged =
        JSON.stringify(resolved.currentCategories) !== JSON.stringify(resolved.nextCategories);
      const eraChanged = (resolved.currentEra ?? null) !== (resolved.nextEra ?? null);

      if (!categoriesChanged && !eraChanged) {
        stats.unchanged += 1;
      } else {
        stats.changed += 1;
        if (categoriesChanged) stats.changedCategories += 1;
        if (eraChanged) stats.changedEra += 1;

        if (examples.length < 20) {
          examples.push({
            eventId: doc.id,
            before: { categories: resolved.currentCategories, era: resolved.currentEra },
            after: { categories: resolved.nextCategories, era: resolved.nextEra },
          });
        }

        if (options.apply) {
          batch.set(
            doc.ref,
            {
              categories: resolved.nextCategories,
              era: resolved.nextEra ?? 'contemporary',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          pendingOps += 1;
          if (pendingOps >= 450) {
            await flush();
          }
        }
      }

      if (options.maxDocs && stats.scanned >= options.maxDocs) {
        await flush();
        console.log(
          JSON.stringify(
            {
              mode: options.apply ? 'apply' : 'dry-run',
              limited: true,
              stats,
              examples,
              resumeCursor: stats.lastEventId,
            },
            null,
            2
          )
        );
        return;
      }
    }

    const last = snapshot.docs[snapshot.docs.length - 1];
    query = firestore.collection(collections.events).orderBy('eventId').startAfter(last.id).limit(options.pageSize);
  }

  await flush();

  console.log(
    JSON.stringify(
      {
        mode: options.apply ? 'apply' : 'dry-run',
        limited: false,
        stats,
        examples,
        resumeCursor: stats.lastEventId,
      },
      null,
      2
    )
  );
};

void run().catch((error) => {
  console.error('[Backfill] Failed:', error);
  process.exit(1);
});
