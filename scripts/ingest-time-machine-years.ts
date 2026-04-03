#!/usr/bin/env node

import { bootstrapFirestore } from './ingest/firestore-admin';
import { enrichEvents } from './ingest/enrichment';
import { loadTimeMachineOverrides, applyTimeMachineOverride } from './ingest/time-machine-overrides';
import {
  fetchPageSummariesByTitles,
  fetchYearPageWikitext,
  normalizeYearPageEvent,
  parseYearPageEvents,
} from './ingest/wikimedia-year-client';
import type { HistoricalEventRecord } from './ingest/types';
import { logInfo } from './ingest/logger';
import { assertValidPayload, validateEvents } from './ingest/validation';
import { TIME_MACHINE_MAX_YEAR, TIME_MACHINE_MIN_YEAR } from '../types/time-machine';
import { buildTimeMachineAggregates } from './build-time-machine-aggregates';
import { generateTimeMachineEditorial } from './generate-time-machine-editorial';
import { validateTimeMachineCoverage } from './validate-time-machine-coverage';
import {
  DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX,
  resolveTimeMachineTargets,
} from './time-machine-firestore';

interface CliOptions {
  fromYear: number;
  toYear: number;
  collectionSuffix: string;
  dryRun?: boolean;
  skipEnrichment?: boolean;
  skipEditorial?: boolean;
  editorialModel?: string;
  userAgent?: string;
  token?: string;
  serviceAccountPath?: string;
  serviceAccountJson?: string;
  projectId?: string;
  overridePath?: string;
}

const BATCH_LIMIT = 400;

const parseNumeric = (value: string | undefined) => {
  if (value === undefined) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Failed to parse numeric value from '${value}'`);
  }
  return parsed;
};

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const options: Partial<CliOptions> = {
    fromYear: TIME_MACHINE_MIN_YEAR,
    toYear: TIME_MACHINE_MAX_YEAR,
    collectionSuffix: DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX,
  };

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    const [flag, possibleValue] = token.split('=');

    const readNext = () => {
      if (possibleValue !== undefined) {
        return possibleValue;
      }
      const nextValue = args[index + 1];
      if (nextValue === undefined) {
        throw new Error(`Flag ${flag} expects a value`);
      }
      index += 1;
      return nextValue;
    };

    switch (flag) {
      case '--fromYear':
        options.fromYear = parseNumeric(readNext());
        break;
      case '--toYear':
        options.toYear = parseNumeric(readNext());
        break;
      case '--collectionSuffix':
        options.collectionSuffix = readNext();
        break;
      case '--production':
        options.collectionSuffix = '';
        break;
      case '--userAgent':
        options.userAgent = readNext();
        break;
      case '--token':
        options.token = readNext();
        break;
      case '--serviceAccount':
        options.serviceAccountPath = readNext();
        break;
      case '--serviceAccountJson':
        options.serviceAccountJson = readNext();
        break;
      case '--projectId':
        options.projectId = readNext();
        break;
      case '--overridePath':
        options.overridePath = readNext();
        break;
      case '--dry-run':
      case '--dryRun':
        options.dryRun = true;
        break;
      case '--skipEnrichment':
        options.skipEnrichment = true;
        break;
      case '--skipEditorial':
        options.skipEditorial = true;
        break;
      case '--editorialModel':
        options.editorialModel = readNext();
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unrecognized flag: ${flag}`);
    }
  }

  if (!options.fromYear || !options.toYear) {
    throw new Error('fromYear and toYear must be defined.');
  }

  return options as CliOptions;
};

const printHelp = () => {
  console.log(
    [
      'Ingest Time Machine year pages',
      '',
      'Usage: npm run time-machine:ingest -- [options]',
      '',
      'Options:',
      `  --fromYear <year>           First year to ingest (default: ${TIME_MACHINE_MIN_YEAR}).`,
      `  --toYear <year>             Last year to ingest (default: ${TIME_MACHINE_MAX_YEAR}).`,
      `  --collectionSuffix <suffix> Target collection suffix (default: ${DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX}).`,
      '  --production                Use production collections with no suffix.',
      '  --overridePath <path>       Path to Time Machine override JSON.',
      '  --userAgent <string>        User agent header for Wikimedia requests.',
      '  --token <string>            Optional Wikimedia API bearer token.',
      '  --serviceAccount <path>     Path to Firebase service account JSON.',
      '  --serviceAccountJson <json> Inline JSON credentials.',
      '  --projectId <id>            Override Firebase project id.',
      '  --skipEnrichment            Skip Wikidata/media enrichment for faster smoke tests.',
      '  --skipEditorial             Skip Time Machine editorial generation after aggregate build.',
      '  --editorialModel <id>       Override the OpenAI model used for editorial generation.',
      '  --dry-run                   Parse and enrich without writing or building aggregates.',
      '  -h, --help                  Show this help message.',
      '',
    ].join('\n')
  );
};

const resolveUserAgent = (override?: string) => {
  return override ?? process.env.DAILY_HISTORIC_USER_AGENT ?? 'DailyHistoric/0.1 (contact@example.com)';
};

const mergeQualityFlags = (...sources: (string[] | undefined)[]) => {
  return Array.from(
    new Set(
      sources
        .flatMap((source) => source ?? [])
        .filter((value) => typeof value === 'string' && value.trim().length > 0)
    )
  );
};

const mergeSourceTypes = (
  existing: HistoricalEventRecord['timeMachine'] | undefined,
  next: HistoricalEventRecord['timeMachine']
) => {
  return Array.from(
    new Set([
      ...(existing?.sourceTypes ?? (existing?.sourceType ? [existing.sourceType] : [])),
      ...(next.sourceTypes ?? [next.sourceType]),
    ])
  );
};

const mergeExistingEvent = (
  existing: HistoricalEventRecord,
  next: HistoricalEventRecord,
  updatedAt: string
): HistoricalEventRecord => {
  return {
    ...existing,
    ...next,
    eventId: existing.eventId || next.eventId,
    createdAt: existing.createdAt || next.createdAt,
    updatedAt,
    relatedPages: next.relatedPages.length > 0 ? next.relatedPages : existing.relatedPages,
    categories: next.categories.length > 0 ? next.categories : existing.categories,
    tags: next.tags.length > 0 ? next.tags : existing.tags,
    era: next.era ?? existing.era,
    enrichment: next.enrichment ?? existing.enrichment,
    timeMachine: {
      ...existing.timeMachine,
      ...next.timeMachine,
      eligible: true,
      sourceType: 'wikipedia-year-page',
      sourceTypes: mergeSourceTypes(existing.timeMachine, next.timeMachine),
      qualityFlags: mergeQualityFlags(existing.timeMachine?.qualityFlags, next.timeMachine?.qualityFlags),
      featured: existing.timeMachine?.featured,
      importanceScore: existing.timeMachine?.importanceScore ?? next.timeMachine?.importanceScore,
      lastAggregatedAt: existing.timeMachine?.lastAggregatedAt,
    },
  };
};

const readEnrichmentEnv = (userAgent: string) => {
  const wikidataConcurrency = Number.parseInt(process.env.WIKIDATA_CONCURRENCY ?? '', 10);
  const wikidataRetryAttempts = Number.parseInt(process.env.WIKIDATA_RETRY_ATTEMPTS ?? '', 10);
  const wikidataRetryBaseDelay = Number.parseInt(process.env.WIKIDATA_RETRY_BASE_DELAY_MS ?? '', 10);
  const mediaMinWidth = Number.parseInt(process.env.MEDIA_MIN_WIDTH ?? '', 10) || undefined;
  const mediaMinHeight = Number.parseInt(process.env.MEDIA_MIN_HEIGHT ?? '', 10) || undefined;
  const mediaLimit = Number.parseInt(process.env.MEDIA_SEARCH_LIMIT ?? '', 10) || undefined;
  const mediaCacheTtlMs = Number.parseInt(process.env.MEDIA_CACHE_TTL_MS ?? '', 10) || undefined;
  const mediaRetryAttempts = Number.parseInt(process.env.MEDIA_RETRY_ATTEMPTS ?? '', 10) || undefined;
  const mediaRetryBaseDelayMs = Number.parseInt(process.env.MEDIA_RETRY_BASE_DELAY_MS ?? '', 10) || undefined;
  const mediaDisableCache = ['true', '1', 'yes'].includes((process.env.MEDIA_DISABLE_CACHE ?? '').toLowerCase());
  const mediaCachePath = process.env.MEDIA_CACHE_PATH;

  return {
    userAgent,
    concurrency: Number.isNaN(wikidataConcurrency) ? undefined : Math.max(1, wikidataConcurrency),
    retryAttempts: Number.isNaN(wikidataRetryAttempts) ? undefined : Math.max(1, wikidataRetryAttempts),
    retryBaseDelayMs: Number.isNaN(wikidataRetryBaseDelay) ? undefined : Math.max(100, wikidataRetryBaseDelay),
    mediaUserAgent: userAgent,
    mediaMinWidth,
    mediaMinHeight,
    mediaLimit,
    mediaCacheTtlMs,
    mediaDisableCache,
    mediaRetryAttempts,
    mediaRetryBaseDelayMs,
    mediaCachePath,
  };
};

const run = async () => {
  const options = parseArgs();
  const userAgent = resolveUserAgent(options.userAgent);
  const { firestore, collections } = await bootstrapFirestore({
    serviceAccountPath: options.serviceAccountPath,
    serviceAccountJson: options.serviceAccountJson ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: options.projectId,
  });
  const targets = resolveTimeMachineTargets(collections, options.collectionSuffix);
  const overrides = await loadTimeMachineOverrides(options.overridePath);

  const targetEventsCollection = firestore.collection(targets.events);
  const enrichOptions = {
    ...readEnrichmentEnv(userAgent),
    enableEnrichment: !options.skipEnrichment,
    overridePath: process.env.INGEST_OVERRIDES_PATH,
  };

  let writeBatch = firestore.batch();
  let opCount = 0;
  let upsertCount = 0;

  const flushBatch = async () => {
    if (opCount === 0) {
      return;
    }
    await writeBatch.commit();
    writeBatch = firestore.batch();
    opCount = 0;
  };

  for (let year = options.fromYear; year <= options.toYear; year += 1) {
    console.log(`Ingesting Time Machine year ${year}...`);

    const payload = await fetchYearPageWikitext({
      year,
      userAgent,
      token: options.token ?? process.env.WIKIMEDIA_API_TOKEN,
    });

    const parsedEvents = parseYearPageEvents(payload.wikitext, year)
      .map((event) => applyTimeMachineOverride(event, overrides.events?.[event.sourceKey]))
      .filter((event): event is NonNullable<typeof event> => event !== null);

    const pageTitles = parsedEvents.flatMap((event) => event.pageTitles);
    console.log(
      `Year ${year}: parsed ${parsedEvents.length} events with ${new Set(pageTitles).size} unique linked pages.`
    );
    const pageMap = await fetchPageSummariesByTitles(pageTitles, {
      userAgent,
      token: options.token ?? process.env.WIKIMEDIA_API_TOKEN,
    });

    const normalized = parsedEvents
      .map((event) => normalizeYearPageEvent(event, payload, pageMap))
      .filter((event): event is HistoricalEventRecord => event !== null);
    console.log(`Year ${year}: normalized ${normalized.length} events after page resolution.`);

    const enriched = await enrichEvents(normalized, enrichOptions);
    console.log(`Year ${year}: ${options.skipEnrichment ? 'skipped enrichment' : 'enriched'} ${enriched.length} events.`);
    validateEvents(enriched);

    const existingSnapshot = await targetEventsCollection.where('year', '==', year).get();
    const existingByCanonicalKey = new Map<string, HistoricalEventRecord>();
    const duplicateDocs: string[] = [];

    existingSnapshot.forEach((documentSnapshot) => {
      const data = documentSnapshot.data() as HistoricalEventRecord;
      const existingRecord = {
        ...data,
        eventId: data.eventId ?? documentSnapshot.id,
      };

      if (!existingRecord.canonicalKey) {
        return;
      }

      if (existingByCanonicalKey.has(existingRecord.canonicalKey)) {
        duplicateDocs.push(documentSnapshot.id);
        return;
      }

      existingByCanonicalKey.set(existingRecord.canonicalKey, existingRecord);
    });

    for (const duplicateId of duplicateDocs) {
      if (options.dryRun) {
        continue;
      }
      writeBatch.set(
        targetEventsCollection.doc(duplicateId),
        {
          timeMachine: {
            eligible: false,
            qualityFlags: ['duplicate-canonical-key'],
          },
        },
        { merge: true }
      );
      opCount += 1;
    }

    const mergedEvents = enriched.map((event) => {
      const existing = existingByCanonicalKey.get(event.canonicalKey);
      if (!existing) {
        return event;
      }

      return mergeExistingEvent(existing, event, payload.capturedAt);
    });

    const syntheticDigest = {
      digestId: `time-machine:${year}`,
      date: `${year}-01-01`,
      eventIds: mergedEvents.map((event) => event.eventId),
      createdAt: payload.capturedAt,
      updatedAt: payload.capturedAt,
    };
    assertValidPayload(mergedEvents, syntheticDigest);

    if (options.dryRun) {
      logInfo('time-machine-year-dry-run', {
        year,
        parsed: parsedEvents.length,
        normalized: normalized.length,
        enriched: mergedEvents.length,
      });
      continue;
    }

    for (const event of mergedEvents) {
      writeBatch.set(targetEventsCollection.doc(event.eventId), event, { merge: true });
      opCount += 1;
      upsertCount += 1;

      if (opCount >= BATCH_LIMIT) {
        await flushBatch();
      }
    }

    await flushBatch();

    logInfo('time-machine-year-ingested', {
      year,
      parsed: parsedEvents.length,
      normalized: normalized.length,
      enriched: mergedEvents.length,
      targetCollection: targets.events,
    });
  }

  if (options.dryRun) {
    console.log('Dry run complete. No Firestore writes or aggregate rebuild were executed.');
    return;
  }

  await flushBatch();
  console.log(`Upserted ${upsertCount} events into ${targets.events}. Building aggregates...`);

  await buildTimeMachineAggregates({
    collectionSuffix: options.collectionSuffix,
    serviceAccountPath: options.serviceAccountPath,
    serviceAccountJson: options.serviceAccountJson,
    projectId: options.projectId,
  });

  if (!options.skipEditorial) {
    await generateTimeMachineEditorial({
      fromYear: options.fromYear,
      toYear: options.toYear,
      collectionSuffix: options.collectionSuffix,
      model: options.editorialModel ?? process.env.TIME_MACHINE_EDITORIAL_MODEL ?? 'gpt-4o-mini',
      serviceAccountPath: options.serviceAccountPath,
      serviceAccountJson: options.serviceAccountJson,
      projectId: options.projectId,
    });
  }

  await validateTimeMachineCoverage({
    collectionSuffix: options.collectionSuffix,
    serviceAccountPath: options.serviceAccountPath,
    serviceAccountJson: options.serviceAccountJson,
    projectId: options.projectId,
  });

  console.log('Time Machine year ingestion completed successfully.');
};

void run().catch((error) => {
  console.error('Time Machine year ingestion failed:', error);
  process.exit(1);
});
