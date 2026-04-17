/**
 * Analyze language coverage against Wikimedia On This Day selected feed.
 *
 * Measures whether existing contentEvents can be matched by wikidataId
 * in each language's onthisday/selected feed for the same month/day.
 *
 * Usage:
 *   npx tsx scripts/analyze-language-feed-coverage.ts --serviceAccount ./firebase-service-account.json --langs=en,tr,de,es,ar,fr,it,zh,ja,ru
 *
 * Output:
 *   - scripts/language-feed-coverage-report.json
 */

import { writeFile } from 'node:fs/promises';

import { bootstrapFirestore } from './ingest/firestore-admin';

type CliOptions = {
  langs: string[];
  serviceAccountPath?: string;
  serviceAccountJson?: string;
  projectId?: string;
};

type EventRef = {
  eventId: string;
  month: number;
  day: number;
  wikidataIds: string[];
};

type FeedPayload = {
  selected?: Array<{
    pages?: Array<{
      wikibase_item?: string;
    }>;
  }>;
};

const DEFAULT_LANGS = ['en', 'tr', 'de', 'es', 'ar', 'fr', 'it', 'zh', 'ja', 'ru'];
const REQUEST_TIMEOUT_MS = 20_000;
const FEED_ATTEMPTS = 2;
const EARLY_STOP_FAILURE_STREAK = 15;

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    langs: DEFAULT_LANGS,
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

const toTwo = (n: number) => n.toString().padStart(2, '0');
const dateKey = (month: number, day: number) => `${toTwo(month)}-${toTwo(day)}`;

const extractEventWikidataIds = (doc: Record<string, unknown>) => {
  const relatedPages = Array.isArray(doc.relatedPages) ? doc.relatedPages : [];
  const ids: string[] = [];

  for (const page of relatedPages) {
    if (!page || typeof page !== 'object') continue;
    const qid = (page as Record<string, unknown>).wikidataId;
    if (typeof qid === 'string' && /^Q\d+$/i.test(qid)) {
      ids.push(qid.toUpperCase());
    }
  }

  return Array.from(new Set(ids));
};

const fetchFeedQids = async (lang: string, month: number, day: number, userAgent: string) => {
  const endpoint = `https://api.wikimedia.org/feed/v1/wikipedia/${lang}/onthisday/selected/${toTwo(month)}/${toTwo(day)}`;

  let response: Response | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt < FEED_ATTEMPTS; attempt += 1) {
    try {
      response = await fetch(endpoint, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
          'User-Agent': userAgent,
        },
      });

      if (response.ok) {
        break;
      }

      if (response.status < 500 && response.status !== 429) {
        break;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (!response) {
    return {
      ok: false,
      status: 0,
      detail: lastError instanceof Error ? lastError.message : String(lastError),
      qids: new Set<string>(),
    };
  }

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      status: response.status,
      detail: text.slice(0, 300),
      qids: new Set<string>(),
    };
  }

  const payload = (await response.json()) as FeedPayload;
  const qids = new Set<string>();

  for (const event of payload.selected ?? []) {
    for (const page of event.pages ?? []) {
      if (typeof page.wikibase_item === 'string' && /^Q\d+$/i.test(page.wikibase_item)) {
        qids.add(page.wikibase_item.toUpperCase());
      }
    }
  }

  return {
    ok: true,
    status: response.status,
    detail: '',
    qids,
  };
};

const intersects = (a: string[], b: Set<string>) => {
  for (const x of a) {
    if (b.has(x)) return true;
  }
  return false;
};

const main = async () => {
  const options = parseArgs();
  const userAgent =
    process.env.DAILY_HISTORIC_USER_AGENT ?? 'DailyHistoricFeedCoverage/0.1 (contact@example.com)';

  console.log('Language feed coverage analysis started');
  console.log(JSON.stringify({ langs: options.langs }, null, 2));

  const { firestore, collections } = await bootstrapFirestore({
    serviceAccountPath: options.serviceAccountPath,
    serviceAccountJson: options.serviceAccountJson ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: options.projectId,
  });

  const snapshot = await firestore.collection(collections.events).get();
  const events: EventRef[] = [];
  const eventsByDate = new Map<string, EventRef[]>();
  let missingDate = 0;
  let missingWikidata = 0;

  snapshot.forEach((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const date = data.date as { month?: number; day?: number } | undefined;
    const month = date?.month;
    const day = date?.day;

    if (typeof month !== 'number' || typeof day !== 'number') {
      missingDate += 1;
      return;
    }

    const wikidataIds = extractEventWikidataIds(data);
    if (wikidataIds.length === 0) {
      missingWikidata += 1;
    }

    const ref: EventRef = {
      eventId: doc.id,
      month,
      day,
      wikidataIds,
    };

    events.push(ref);

    const key = dateKey(month, day);
    const current = eventsByDate.get(key) ?? [];
    current.push(ref);
    eventsByDate.set(key, current);
  });

  const dateKeys = Array.from(eventsByDate.keys()).sort();

  console.log(`Events considered: ${events.length}`);
  console.log(`Distinct month-day keys: ${dateKeys.length}`);
  console.log(`Events missing date: ${missingDate}`);
  console.log(`Events missing wikidataIds: ${missingWikidata}`);

  const byLanguage: Array<Record<string, unknown>> = [];

  for (const lang of options.langs) {
    let matchedEvents = 0;
    let unmatchedEvents = 0;
    let endpointSuccessDays = 0;
    let endpointUnsupportedDays = 0;
    let endpointErrorDays = 0;

    const sampleUnsupported: Array<{ date: string; status: number; detail: string }> = [];
    const sampleErrors: Array<{ date: string; status: number; detail: string }> = [];
    let consecutiveFailures = 0;
    let earlyStopped = false;

    for (let i = 0; i < dateKeys.length; i += 1) {
      const key = dateKeys[i];
      const [m, d] = key.split('-').map((x) => Number.parseInt(x, 10));
      const dayEvents = eventsByDate.get(key) ?? [];

      const feed = await (async () => {
        try {
          return await fetchFeedQids(lang, m, d, userAgent);
        } catch (error) {
          return {
            ok: false,
            status: 0,
            detail: error instanceof Error ? error.message : String(error),
            qids: new Set<string>(),
          };
        }
      })();

      if (!feed.ok) {
        consecutiveFailures += 1;
        if (feed.status === 404) {
          endpointUnsupportedDays += 1;
          if (sampleUnsupported.length < 15) {
            sampleUnsupported.push({ date: key, status: feed.status, detail: feed.detail });
          }
        } else {
          endpointErrorDays += 1;
          if (sampleErrors.length < 15) {
            sampleErrors.push({ date: key, status: feed.status, detail: feed.detail });
          }
        }

        unmatchedEvents += dayEvents.length;
      } else {
        consecutiveFailures = 0;
        endpointSuccessDays += 1;

        for (const event of dayEvents) {
          const matched = event.wikidataIds.length > 0 && intersects(event.wikidataIds, feed.qids);
          if (matched) {
            matchedEvents += 1;
          } else {
            unmatchedEvents += 1;
          }
        }
      }

      if (endpointSuccessDays === 0 && consecutiveFailures >= EARLY_STOP_FAILURE_STREAK) {
        const remainingDays = dateKeys.length - (i + 1);
        endpointErrorDays += remainingDays;

        for (let j = i + 1; j < dateKeys.length; j += 1) {
          const remainingKey = dateKeys[j];
          const remainingEvents = eventsByDate.get(remainingKey) ?? [];
          unmatchedEvents += remainingEvents.length;
        }

        earlyStopped = true;
        console.log(`[${lang}] early stop triggered after ${consecutiveFailures} consecutive failures`);
        break;
      }

      if ((i + 1) % 50 === 0 || i === dateKeys.length - 1) {
        console.log(`[${lang}] days processed: ${i + 1}/${dateKeys.length}`);
      }
    }

    const totalEvents = events.length;
    const coverageRatio = totalEvents === 0 ? 0 : matchedEvents / totalEvents;

    byLanguage.push({
      lang,
      matchedEvents,
      unmatchedEvents,
      coverageRatio,
      coveragePct: Number((coverageRatio * 100).toFixed(2)),
      endpoint: {
        successDays: endpointSuccessDays,
        unsupportedDays: endpointUnsupportedDays,
        errorDays: endpointErrorDays,
        totalDays: dateKeys.length,
        earlyStopped,
      },
      sampleUnsupported,
      sampleErrors,
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    input: {
      langs: options.langs,
    },
    totals: {
      firestoreEvents: snapshot.size,
      analyzedEvents: events.length,
      distinctDateKeys: dateKeys.length,
      eventsMissingDate: missingDate,
      eventsMissingWikidata: missingWikidata,
    },
    byLanguage,
  };

  await writeFile('./scripts/language-feed-coverage-report.json', `${JSON.stringify(report, null, 2)}\n`, 'utf-8');
  console.log('Saved report: scripts/language-feed-coverage-report.json');
  console.log('Language feed coverage analysis completed');
};

void main().catch((error) => {
  console.error('Language feed coverage analysis failed:', error);
  process.exit(1);
});
