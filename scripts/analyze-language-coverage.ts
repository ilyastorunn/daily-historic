/**
 * Analyze language coverage for contentEvents using Wikidata sitelinks and Wikipedia text quality.
 *
 * Usage:
 *   npx tsx scripts/analyze-language-coverage.ts
 *   npx tsx scripts/analyze-language-coverage.ts --langs=en,tr,de,es,ar,fr,it,zh,ja,ru --threshold=0.6
 *
 * Outputs:
 *   - scripts/language-coverage-report.json
 *   - scripts/language-coverage-matrix.json
 */

import { writeFile } from 'node:fs/promises';

import { bootstrapFirestore } from './ingest/firestore-admin';
import { fetchWithRetry } from './ingest/http-utils';

type CliOptions = {
  langs: string[];
  threshold: number;
  wikidataBatchSize: number;
  wikiTitleBatchSize: number;
  textMinChars: number;
  textMinWords: number;
  skipTextAnalysis: boolean;
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
      sitelinks?: Record<string, { title?: string }>;
    }
  >;
};

type WikipediaQueryResponse = {
  query?: {
    normalized?: Array<{ from: string; to: string }>;
    redirects?: Array<{ from: string; to: string }>;
    pages?: Record<
      string,
      {
        pageid?: number;
        title?: string;
        missing?: string;
        extract?: string;
        pageprops?: Record<string, unknown>;
      }
    >;
  };
};

type TitleQuality = {
  title: string;
  canonicalTitle?: string;
  missing: boolean;
  hasText: boolean;
  usable: boolean;
  isDisambiguation: boolean;
  charCount: number;
  wordCount: number;
};

const DEFAULT_LANGS = ['en', 'tr', 'de', 'es', 'ar', 'fr', 'it', 'zh'];
const DEFAULT_THRESHOLD = 0.6;
const DEFAULT_WIKIDATA_BATCH_SIZE = 50;
const DEFAULT_WIKI_TITLE_BATCH_SIZE = 50;
const DEFAULT_TEXT_MIN_CHARS = 120;
const DEFAULT_TEXT_MIN_WORDS = 20;
const REQUEST_TIMEOUT_MS = 25_000;
const CJK_LANGS = new Set(['zh', 'ja', 'ko']);

const WIKIDATA_WBGETENTITIES_API = 'https://www.wikidata.org/w/api.php';

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    langs: DEFAULT_LANGS,
    threshold: DEFAULT_THRESHOLD,
    wikidataBatchSize: DEFAULT_WIKIDATA_BATCH_SIZE,
    wikiTitleBatchSize: DEFAULT_WIKI_TITLE_BATCH_SIZE,
    textMinChars: DEFAULT_TEXT_MIN_CHARS,
    textMinWords: DEFAULT_TEXT_MIN_WORDS,
    skipTextAnalysis: false,
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
      case '--wikidata-batch-size': {
        const value = Number.parseInt(readNext(), 10);
        if (Number.isNaN(value) || value < 1 || value > 50) {
          throw new Error('--wikidata-batch-size must be between 1 and 50');
        }
        options.wikidataBatchSize = value;
        break;
      }
      case '--wiki-title-batch-size': {
        const value = Number.parseInt(readNext(), 10);
        if (Number.isNaN(value) || value < 1 || value > 50) {
          throw new Error('--wiki-title-batch-size must be between 1 and 50');
        }
        options.wikiTitleBatchSize = value;
        break;
      }
      case '--text-min-chars': {
        const value = Number.parseInt(readNext(), 10);
        if (Number.isNaN(value) || value < 1) {
          throw new Error('--text-min-chars must be a positive number');
        }
        options.textMinChars = value;
        break;
      }
      case '--text-min-words': {
        const value = Number.parseInt(readNext(), 10);
        if (Number.isNaN(value) || value < 1) {
          throw new Error('--text-min-words must be a positive number');
        }
        options.textMinWords = value;
        break;
      }
      case '--skip-text-analysis':
        options.skipTextAnalysis = true;
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

const normalizeWordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
const usesWhitespaceWordBoundaries = (lang: string) => !CJK_LANGS.has(lang);

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
): Promise<Map<string, Map<string, string>>> => {
  const result = new Map<string, Map<string, string>>();
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
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
        result.set(qid, new Map());
        continue;
      }

      const sitelinkMap = new Map<string, string>();
      const sitelinks = entity.sitelinks ?? {};
      for (const [wikiKey, details] of Object.entries(sitelinks)) {
        const title = details?.title;
        if (typeof title === 'string' && title.trim().length > 0) {
          sitelinkMap.set(wikiKey, title);
        }
      }
      result.set(qid, sitelinkMap);
    }

    if ((index + 1) % 20 === 0 || index === groups.length - 1) {
      console.log(`Processed Wikidata batches: ${index + 1}/${groups.length}`);
    }
  }

  return result;
};

const resolveTitleThroughMappings = (
  title: string,
  normalized: Map<string, string>,
  redirects: Map<string, string>
) => {
  let current = normalized.get(title) ?? title;
  const seen = new Set<string>([current]);

  while (redirects.has(current)) {
    const next = redirects.get(current);
    if (!next || seen.has(next)) {
      break;
    }
    current = next;
    seen.add(current);
  }

  return current;
};

const fetchTitleQualityForLanguage = async (
  lang: string,
  titles: string[],
  userAgent: string,
  batchSize: number,
  textMinChars: number,
  textMinWords: number
): Promise<Map<string, TitleQuality>> => {
  const results = new Map<string, TitleQuality>();
  const groups = chunk(titles, batchSize);

  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index];
    const endpoint = `https://${lang}.wikipedia.org/w/api.php`;
    const body = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'extracts|pageprops',
      exintro: '1',
      explaintext: '1',
      redirects: '1',
      titles: group.join('|'),
    });

    const response = await fetchWithRetry(
      endpoint,
      {
        method: 'POST',
        body: body.toString(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': userAgent,
        },
      },
      {
        attempts: 4,
        baseDelayMs: 600,
        maxDelayMs: 5000,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Wikipedia title batch failed for ${lang} (${response.status}): ${text}`);
    }

    const payload = (await response.json()) as WikipediaQueryResponse;
    const normalized = new Map<string, string>((payload.query?.normalized ?? []).map((item) => [item.from, item.to]));
    const redirects = new Map<string, string>((payload.query?.redirects ?? []).map((item) => [item.from, item.to]));
    const pages = Object.values(payload.query?.pages ?? {});
    const pageByTitle = new Map<string, (typeof pages)[number]>();

    for (const page of pages) {
      if (typeof page.title === 'string') {
        pageByTitle.set(page.title, page);
      }
    }

    for (const requestedTitle of group) {
      const resolvedTitle = resolveTitleThroughMappings(requestedTitle, normalized, redirects);
      const page = pageByTitle.get(resolvedTitle) ?? pageByTitle.get(requestedTitle);
      const extract = typeof page?.extract === 'string' ? page.extract.trim() : '';
      const charCount = extract.length;
      const wordCount = charCount > 0 ? normalizeWordCount(extract) : 0;
      const missing = !page || Boolean('missing' in page && page.missing !== undefined);
      const isDisambiguation = Boolean(page?.pageprops && 'disambiguation' in page.pageprops);
      const hasText = charCount > 0;
      const meetsWordThreshold = usesWhitespaceWordBoundaries(lang) ? wordCount >= textMinWords : true;
      const usable = hasText && !missing && !isDisambiguation && charCount >= textMinChars && meetsWordThreshold;

      results.set(requestedTitle, {
        title: requestedTitle,
        canonicalTitle: page?.title,
        missing,
        hasText,
        usable,
        isDisambiguation,
        charCount,
        wordCount,
      });
    }

    if ((index + 1) % 50 === 0 || index === groups.length - 1) {
      console.log(`[${lang}] Processed title batches: ${index + 1}/${groups.length}`);
    }
  }

  return results;
};

const toPct = (value: number) => Number((value * 100).toFixed(2));

const main = async () => {
  const options = parseArgs();
  const userAgent =
    process.env.DAILY_HISTORIC_USER_AGENT ?? 'DailyHistoricLanguageCoverage/0.2 (contact@example.com)';

  console.log('Language coverage analysis started');
  console.log(
    JSON.stringify(
      {
        langs: options.langs,
        threshold: options.threshold,
        wikidataBatchSize: options.wikidataBatchSize,
        wikiTitleBatchSize: options.wikiTitleBatchSize,
        textMinChars: options.textMinChars,
        textMinWords: options.textMinWords,
        skipTextAnalysis: options.skipTextAnalysis,
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
  let eventsWithoutWikidata = 0;

  snapshot.forEach((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const { ids, primary } = getEventWikidataIds(data);

    if (ids.length === 0) {
      eventsWithoutWikidata += 1;
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
  console.log(`Events without wikidataId: ${eventsWithoutWikidata}`);

  const sitelinksByQid = await fetchSitelinksByQid(qidList, options.wikidataBatchSize, userAgent);

  const perLangEventAvailability = new Map<
    string,
    {
      eventId: string;
      anyTitle?: string;
      primaryTitle?: string;
    }[]
  >();

  for (const lang of options.langs) {
    const wikiKey = toWikiKey(lang);
    const entries: {
      eventId: string;
      anyTitle?: string;
      primaryTitle?: string;
    }[] = [];

    for (const event of events) {
      const primaryTitle = event.primaryWikidataId
        ? sitelinksByQid.get(event.primaryWikidataId)?.get(wikiKey)
        : undefined;

      let anyTitle: string | undefined;
      for (const qid of event.wikidataIds) {
        const title = sitelinksByQid.get(qid)?.get(wikiKey);
        if (title) {
          anyTitle = title;
          break;
        }
      }

      entries.push({
        eventId: event.eventId,
        anyTitle,
        primaryTitle,
      });
    }

    perLangEventAvailability.set(lang, entries);
  }

  const titleQualityByLang = new Map<string, Map<string, TitleQuality>>();

  if (!options.skipTextAnalysis) {
    for (const lang of options.langs) {
      const availability = perLangEventAvailability.get(lang) ?? [];
      const uniqueTitles = Array.from(
        new Set(
          availability
            .flatMap((item) => [item.anyTitle, item.primaryTitle])
            .filter((title): title is string => typeof title === 'string' && title.length > 0)
        )
      );

      console.log(`[${lang}] Unique titles to evaluate: ${uniqueTitles.length}`);

      if (uniqueTitles.length === 0) {
        titleQualityByLang.set(lang, new Map());
        continue;
      }

      const qualityMap = await fetchTitleQualityForLanguage(
        lang,
        uniqueTitles,
        userAgent,
        options.wikiTitleBatchSize,
        options.textMinChars,
        options.textMinWords
      );

      titleQualityByLang.set(lang, qualityMap);
    }
  }

  const reportByLanguage: Array<Record<string, unknown>> = [];

  const matrix = events.map((event) => ({
    eventId: event.eventId,
    wikidataIds: event.wikidataIds,
    languageStatus: {} as Record<
      string,
      {
        hasAnyPage: boolean;
        hasPrimaryPage: boolean;
        hasAnyText?: boolean;
        hasPrimaryText?: boolean;
        anyUsable?: boolean;
        primaryUsable?: boolean;
      }
    >,
  }));

  const matrixIndexByEventId = new Map(matrix.map((entry) => [entry.eventId, entry]));

  for (const lang of options.langs) {
    const availability = perLangEventAvailability.get(lang) ?? [];
    const qualityMap = titleQualityByLang.get(lang) ?? new Map<string, TitleQuality>();

    let anyPageCount = 0;
    let primaryPageCount = 0;
    let anyTextCount = 0;
    let primaryTextCount = 0;
    let anyUsableCount = 0;
    let primaryUsableCount = 0;

    let anyMissingCount = 0;
    let anyDisambiguationCount = 0;
    let anyShortCount = 0;

    const unavailableEventIds: string[] = [];

    for (const item of availability) {
      const hasAnyPage = Boolean(item.anyTitle);
      const hasPrimaryPage = Boolean(item.primaryTitle);

      if (hasAnyPage) anyPageCount += 1;
      if (hasPrimaryPage) primaryPageCount += 1;

      const anyQuality = item.anyTitle ? qualityMap.get(item.anyTitle) : undefined;
      const primaryQuality = item.primaryTitle ? qualityMap.get(item.primaryTitle) : undefined;

      const hasAnyText = Boolean(anyQuality?.hasText);
      const hasPrimaryText = Boolean(primaryQuality?.hasText);
      const anyUsable = Boolean(anyQuality?.usable);
      const primaryUsable = Boolean(primaryQuality?.usable);

      if (hasAnyText) anyTextCount += 1;
      if (hasPrimaryText) primaryTextCount += 1;
      if (anyUsable) anyUsableCount += 1;
      if (primaryUsable) primaryUsableCount += 1;

      if (hasAnyPage && !anyUsable) {
        unavailableEventIds.push(item.eventId);

        if (anyQuality?.missing) {
          anyMissingCount += 1;
        } else if (anyQuality?.isDisambiguation) {
          anyDisambiguationCount += 1;
        } else {
          anyShortCount += 1;
        }
      }

      const matrixRow = matrixIndexByEventId.get(item.eventId);
      if (matrixRow) {
        matrixRow.languageStatus[lang] = {
          hasAnyPage,
          hasPrimaryPage,
          hasAnyText: options.skipTextAnalysis ? undefined : hasAnyText,
          hasPrimaryText: options.skipTextAnalysis ? undefined : hasPrimaryText,
          anyUsable: options.skipTextAnalysis ? undefined : anyUsable,
          primaryUsable: options.skipTextAnalysis ? undefined : primaryUsable,
        };
      }
    }

    const totalEvents = events.length;
    const anyPageRatio = totalEvents === 0 ? 0 : anyPageCount / totalEvents;
    const primaryPageRatio = totalEvents === 0 ? 0 : primaryPageCount / totalEvents;
    const anyTextRatio = totalEvents === 0 ? 0 : anyTextCount / totalEvents;
    const primaryTextRatio = totalEvents === 0 ? 0 : primaryTextCount / totalEvents;
    const anyUsableRatio = totalEvents === 0 ? 0 : anyUsableCount / totalEvents;
    const primaryUsableRatio = totalEvents === 0 ? 0 : primaryUsableCount / totalEvents;

    reportByLanguage.push({
      lang,
      wikiKey: toWikiKey(lang),
      thresholds: {
        minChars: options.textMinChars,
        minWords: options.textMinWords,
      },
      pageCoverage: {
        anyPageCount,
        anyPageRatio,
        anyPagePct: toPct(anyPageRatio),
        primaryPageCount,
        primaryPageRatio,
        primaryPagePct: toPct(primaryPageRatio),
      },
      textCoverage: options.skipTextAnalysis
        ? undefined
        : {
            anyTextCount,
            anyTextRatio,
            anyTextPct: toPct(anyTextRatio),
            primaryTextCount,
            primaryTextRatio,
            primaryTextPct: toPct(primaryTextRatio),
          },
      usableCoverage: options.skipTextAnalysis
        ? undefined
        : {
            anyUsableCount,
            anyUsableRatio,
            anyUsablePct: toPct(anyUsableRatio),
            primaryUsableCount,
            primaryUsableRatio,
            primaryUsablePct: toPct(primaryUsableRatio),
            belowUsableBreakdown: {
              missing: anyMissingCount,
              disambiguation: anyDisambiguationCount,
              shortOrLowContent: anyShortCount,
            },
            sampleEventIdsNotUsable: unavailableEventIds.slice(0, 100),
          },
      meetsThreshold: options.skipTextAnalysis ? anyPageRatio >= options.threshold : anyUsableRatio >= options.threshold,
    });
  }

  const recommendedLangs = reportByLanguage
    .filter((item) => Boolean(item.meetsThreshold))
    .map((item) => item.lang as string);

  const excludedLangs = reportByLanguage
    .filter((item) => !item.meetsThreshold)
    .map((item) => item.lang as string);

  const report = {
    generatedAt: new Date().toISOString(),
    input: {
      langs: options.langs,
      threshold: options.threshold,
      wikidataBatchSize: options.wikidataBatchSize,
      wikiTitleBatchSize: options.wikiTitleBatchSize,
      textMinChars: options.textMinChars,
      textMinWords: options.textMinWords,
      skipTextAnalysis: options.skipTextAnalysis,
    },
    totals: {
      events: events.length,
      uniqueWikidataIds: qidList.length,
      eventsWithoutWikidata,
    },
    recommendations: {
      decisionMetric: options.skipTextAnalysis ? 'pageCoverage.anyPageRatio' : 'usableCoverage.anyUsableRatio',
      threshold: options.threshold,
      recommendedLangs,
      excludedLangs,
    },
    byLanguage: reportByLanguage,
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
