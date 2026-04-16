/**
 * Analyze language coverage for contentEvents using Wikidata sitelinks.
 *
 * Usage:
 *   npx tsx scripts/analyze-language-coverage.ts
 *   npx tsx scripts/analyze-language-coverage.ts --langs=en,tr,de,es,ar,fr,it,zh --threshold=0.65
 *
 * Output:
 *   - scripts/language-coverage-report.json
 *   - scripts/language-coverage-matrix.json
 */

import { writeFile } from 'node:fs/promises';

import { bootstrapFirestore } from './ingest/firestore-admin';
import { fetchWithRetry } from './ingest/http-utils';

type CliOptions = {
  langs: string[];
  threshold: number;
  batchSize: number;
  serviceAccountPath?: string;
  serviceAccountJson?: string;
  projectId?: string;
};

type EventRecord = {
  eventId: string;
  year?: number;
  text?: string;
  wikidataIds: string[];
  primaryWikidataId?: string;
};

type WikidataEntityApiResponse = {
  entities?: Record<
    string,
    {
      id?: string;
      missing?: string;
      sitelinks?: Record<string, unknown>;
    }
  >;
};

const DEFAULT_LANGS = ['en', 'tr', 'de', 'es', 'ar', 'fr', 'it', 'zh'];
const DEFAULT_THRESHOLD = 0.6;
const DEFAULT_BATCH_SIZE = 50;
const WIKIDATA_WBGETENTITIES_API = 'https://www.wikidata.org/w/api.php';

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    langs: DEFAULT_LANGS,
    threshold: DEFAULT_THRESHOLD,
    batchSize: DEFAULT_BATCH_SIZE,
  };

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    const [flag, possibleValue] = token.split('=');

    const readNext = () => {
      if (possibleValue !== undefined) return possibleValue;
      const next = args[i + 1];
      if (!next) {
        throw new Error(`Flag ${flag} expects a value`);
      }
      i += 1;
      return next;
    };

    switch (flag) {
      case '--langs': {
        const value = readNext();
        options.langs = value
          .split(',')
          .map((lang) => lang.trim().toLowerCase())
          .filter(Boolean);
        break;
      }
      case '--threshold': {
        const value = Number.parseFloat(readNext());
        if (Number.isNaN(value) || value < 0 || value > 1) {
          throw new Error('--threshold must be between 0 and 1');
        }
        options.threshold = value;
        break;
      }
      case '--batch-size': {
        const value = Number.parseInt(readNext(), 10);
        if (Number.isNaN(value) || value < 1 || value > 50) {
          throw new Error('--batch-size must be between 1 and 50');
        }
        options.batchSize = value;
        break;
      }
      case '--serviceAccount':
        options.serviceAccountPath = readNext();
        break;
      case '--serviceAccountJson':
        options.serviceAccountJson = readNext();
        break;
      case '--projectId':
        options.projectId = readNext();
        break;
      default:
        throw new Error(`Unknown flag: ${flag}`);
    }
  }

  return options;
};

const chunk = <T>(items: T[], size: number): T[][] => {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
};

const toWikiKey = (lang: string) => `${lang}wiki`;

const getEventWikidataIds = (event: Record<string, unknown>): { ids: string[]; primary?: string } => {
  const relatedPages = Array.isArray(event.relatedPages) ? event.relatedPages : [];
  const ids: string[] = [];

  for (const page of relatedPages) {
    if (page && typeof page === 'object') {
      const value = (page as Record<string, unknown>).wikidataId;
      if (typeof value === 'string' && /^Q\d+$/i.test(value)) {
        ids.push(value.toUpperCase());
      }
    }
  }

  const unique = Array.from(new Set(ids));
  return { ids: unique, primary: unique[0] };
};

const fetchSitelinksByQid = async (
  qids: string[],
  batchSize: number,
  userAgent: string
): Promise<Map<string, Set<string>>> => {
  const result = new Map<string, Set<string>>();
  const groups = chunk(qids, batchSize);

  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index];
    const url = new URL(WIKIDATA_WBGETENTITIES_API);
    url.searchParams.set('action', 'wbgetentities');
    url.searchParams.set('format', 'json');
    url.searchParams.set('props', 'sitelinks');
    url.searchParams.set('ids', group.join('|'));

    const response = await fetchWithRetry(
      url.toString(),
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': userAgent,
        },
      },
      {
        attempts: 4,
        baseDelayMs: 500,
        maxDelayMs: 4000,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Wikidata batch failed (${response.status}): ${text}`);
    }

    const payload = (await response.json()) as WikidataEntityApiResponse;
    const entities = payload.entities ?? {};

    for (const qid of group) {
      const entity = entities[qid];
      if (!entity || entity.missing) {
        result.set(qid, new Set());
        continue;
      }
      const sitelinks = Object.keys(entity.sitelinks ?? {});
      result.set(qid, new Set(sitelinks));
    }

    if ((index + 1) % 20 === 0 || index === groups.length - 1) {
      console.log(`Processed Wikidata batches: ${index + 1}/${groups.length}`);
    }
  }

  return result;
};

const main = async () => {
  const options = parseArgs();
  const userAgent =
    process.env.DAILY_HISTORIC_USER_AGENT ?? 'DailyHistoricLanguageCoverage/0.1 (contact@example.com)';

  console.log('Language coverage analysis started');
  console.log(
    JSON.stringify(
      {
        langs: options.langs,
        threshold: options.threshold,
        batchSize: options.batchSize,
      },
      null,
      2
    )
  );

  const { firestore, collections } = await bootstrapFirestore({
    serviceAccountPath: options.serviceAccountPath,
    serviceAccountJson: options.serviceAccountJson ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: options.projectId,
  });

  const snapshot = await firestore.collection(collections.events).get();
  console.log(`Fetched events: ${snapshot.size}`);

  const events: EventRecord[] = [];
  const allQids = new Set<string>();
  let missingWikidata = 0;

  snapshot.forEach((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const { ids, primary } = getEventWikidataIds(data);
    if (ids.length === 0) {
      missingWikidata += 1;
    } else {
      ids.forEach((id) => allQids.add(id));
    }

    events.push({
      eventId: doc.id,
      year: typeof data.year === 'number' ? data.year : undefined,
      text: typeof data.text === 'string' ? data.text : undefined,
      wikidataIds: ids,
      primaryWikidataId: primary,
    });
  });

  const qidList = Array.from(allQids);
  console.log(`Unique wikidata IDs: ${qidList.length}`);
  console.log(`Events without wikidataId: ${missingWikidata}`);

  const sitelinksByQid = await fetchSitelinksByQid(qidList, options.batchSize, userAgent);

  const langStats = options.langs.map((lang) => ({
    lang,
    wikiKey: toWikiKey(lang),
    availableCount: 0,
    unavailableCount: 0,
    eventIdsUnavailable: [] as string[],
  }));

  const matrix: Array<{
    eventId: string;
    availableLangs: string[];
    unavailableLangs: string[];
    wikidataIds: string[];
  }> = [];

  for (const event of events) {
    const availableLangs: string[] = [];
    const unavailableLangs: string[] = [];

    for (const stat of langStats) {
      const isAvailable = event.wikidataIds.some((qid) => sitelinksByQid.get(qid)?.has(stat.wikiKey));
      if (isAvailable) {
        availableLangs.push(stat.lang);
        stat.availableCount += 1;
      } else {
        unavailableLangs.push(stat.lang);
        stat.unavailableCount += 1;
        stat.eventIdsUnavailable.push(event.eventId);
      }
    }

    matrix.push({
      eventId: event.eventId,
      availableLangs,
      unavailableLangs,
      wikidataIds: event.wikidataIds,
    });
  }

  const totalEvents = events.length;
  const summaryByLanguage = langStats.map((stat) => {
    const coverage = totalEvents === 0 ? 0 : stat.availableCount / totalEvents;
    return {
      lang: stat.lang,
      wikiKey: stat.wikiKey,
      availableCount: stat.availableCount,
      unavailableCount: stat.unavailableCount,
      coverageRatio: coverage,
      coveragePct: Number((coverage * 100).toFixed(2)),
      meetsThreshold: coverage >= options.threshold,
    };
  });

  const recommendedLangs = summaryByLanguage.filter((item) => item.meetsThreshold).map((item) => item.lang);
  const excludedLangs = summaryByLanguage.filter((item) => !item.meetsThreshold).map((item) => item.lang);

  const report = {
    generatedAt: new Date().toISOString(),
    input: {
      langs: options.langs,
      threshold: options.threshold,
      batchSize: options.batchSize,
    },
    totals: {
      events: totalEvents,
      uniqueWikidataIds: qidList.length,
      eventsWithoutWikidata: missingWikidata,
    },
    recommendations: {
      recommendedLangs,
      excludedLangs,
    },
    byLanguage: summaryByLanguage,
  };

  await writeFile('./scripts/language-coverage-report.json', `${JSON.stringify(report, null, 2)}\n`, 'utf-8');
  await writeFile('./scripts/language-coverage-matrix.json', `${JSON.stringify(matrix, null, 2)}\n`, 'utf-8');

  console.log('Saved report: scripts/language-coverage-report.json');
  console.log('Saved matrix: scripts/language-coverage-matrix.json');
  console.log('Language coverage analysis completed');
};

void main().catch((error) => {
  console.error('Language coverage analysis failed:', error);
  process.exit(1);
});

