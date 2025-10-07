#!/usr/bin/env node

import { exit } from 'node:process';

import { bootstrapFirestore } from './firestore-admin';
import { buildCacheKey, fetchOnThisDaySelected, normalizeEvent } from './wikimedia-client';
import { enrichEvents } from './enrichment';
import { logInfo } from './logger';
import { assertValidPayload } from './validation';
import type { CachedPayload, DailyDigestRecord, HistoricalEventRecord } from './types';

interface CliOptions {
  month?: number;
  day?: number;
  year?: number;
  dryRun?: boolean;
  userAgent?: string;
  token?: string;
  serviceAccountPath?: string;
  serviceAccountJson?: string;
  projectId?: string;
}

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
  const options: CliOptions = {};

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
      case '--month':
        options.month = parseNumeric(readNext());
        break;
      case '--day':
        options.day = parseNumeric(readNext());
        break;
      case '--year':
        options.year = parseNumeric(readNext());
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
      case '--dry-run':
      case '--dryRun':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        exit(0);
        break;
      default:
        throw new Error(`Unrecognized flag: ${flag}`);
    }
  }

  return options;
};

const printHelp = () => {
  console.log(`Daily Historic ingestion\n\nUsage: npm run ingest -- [options]\n\nOptions:\n  --month <1-12>             Month to ingest (defaults to today, UTC).\n  --day <1-31>               Day to ingest (defaults to today, UTC).\n  --year <yyyy>              Year for digest metadata (defaults to today, UTC).\n  --userAgent <string>       User agent header for Wikimedia requests.\n  --token <string>           Optional Wikimedia API bearer token.\n  --serviceAccount <path>    Path to Firebase service account JSON.\n  --serviceAccountJson <json> Inline JSON credentials (use with caution).\n  --projectId <id>           Override Firebase project id.\n  --dry-run                  Do not write to Firestore, only log actions.\n  -h, --help                 Show this help message.\n`);
};

const resolveTargetDate = (options: CliOptions) => {
  const now = new Date();
  const month = options.month ?? now.getUTCMonth() + 1;
  const day = options.day ?? now.getUTCDate();
  const year = options.year ?? now.getUTCFullYear();
  const isoDate = new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
  return { month, day, year, isoDate };
};

const writeToFirestore = async (
  payload: CachedPayload,
  events: HistoricalEventRecord[],
  digest: DailyDigestRecord,
  options: CliOptions
) => {
  const { firestore, collections } = await bootstrapFirestore({
    serviceAccountPath: options.serviceAccountPath,
    serviceAccountJson: options.serviceAccountJson ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: options.projectId,
  });

  const batch = firestore.batch();

  const payloadRef = firestore.collection(collections.payloadCache).doc(payload.key);
  batch.set(payloadRef, payload, { merge: true });

  for (const event of events) {
    const docRef = firestore.collection(collections.events).doc(event.eventId);
    batch.set(docRef, event, { merge: true });
  }

  const digestRef = firestore.collection(collections.digests).doc(digest.digestId);
  batch.set(digestRef, digest, { merge: true });

  await batch.commit();
};

const main = async () => {
  try {
    const options = parseArgs();
    const { month, day, isoDate } = resolveTargetDate(options);

    const userAgent =
      options.userAgent ?? process.env.DAILY_HISTORIC_USER_AGENT ?? 'DailyHistoric/0.1 (contact@example.com)';

    const { events: rawEvents, raw, capturedAt } = await fetchOnThisDaySelected({
      month,
      day,
      userAgent,
      token: options.token ?? process.env.WIKIMEDIA_API_TOKEN,
    });

    const cacheKey = buildCacheKey(month, day);

    const normalized = rawEvents.map((event) =>
      normalizeEvent(event, {
        month,
        day,
        capturedAt,
        rawType: event.type ?? 'selected',
        cacheKey,
      })
    );

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

    const enrichedEvents = await enrichEvents(normalized, {
      userAgent,
      concurrency: Number.isNaN(wikidataConcurrency) ? undefined : Math.max(1, wikidataConcurrency),
      retryAttempts: Number.isNaN(wikidataRetryAttempts) ? undefined : Math.max(1, wikidataRetryAttempts),
      retryBaseDelayMs: Number.isNaN(wikidataRetryBaseDelay) ? undefined : Math.max(100, wikidataRetryBaseDelay),
      mediaUserAgent: process.env.DAILY_HISTORIC_USER_AGENT ?? userAgent,
      mediaMinWidth,
      mediaMinHeight,
      mediaLimit,
      mediaCacheTtlMs,
      mediaDisableCache,
      mediaRetryAttempts,
      mediaRetryBaseDelayMs,
      mediaCachePath,
      overridePath: process.env.INGEST_OVERRIDES_PATH,
    });

    const summary = {
      eventsFetched: rawEvents.length,
      eventsStored: enrichedEvents.length,
      cacheKey,
      isoDate,
    };

    const payload: CachedPayload = {
      key: cacheKey,
      fetchedAt: capturedAt,
      month,
      day,
      payload: raw,
    };

    const digestId = `digest:${cacheKey}`;
    const digest: DailyDigestRecord = {
      digestId,
      date: isoDate,
      eventIds: enrichedEvents.map((event) => event.eventId),
      createdAt: capturedAt,
      updatedAt: capturedAt,
    };

    assertValidPayload(enrichedEvents, digest);

    if (options.dryRun) {
      console.log('[dry-run] Would persist payload cache entry:', payload.key);
      console.log('[dry-run] Would persist events:', enrichedEvents.map((event) => event.eventId));
      console.log('[dry-run] Would persist digest:', digest.digestId);
      logInfo('ingestion-summary', summary);
      return;
    }

    await writeToFirestore(payload, enrichedEvents, digest, options);

    logInfo('ingestion-completed', summary);
  } catch (error) {
    console.error('Ingestion failed:', error);
    exit(1);
  }
};

void main();
