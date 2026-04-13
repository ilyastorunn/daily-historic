/**
 * Validate monthly collections quality and integrity.
 *
 * Usage:
 *   npx tsx scripts/validate-monthly-content.ts
 *   npx tsx scripts/validate-monthly-content.ts --skip-links
 *
 * Output:
 *   - Console report (month-by-month + summary)
 *   - JSON report: scripts/monthly-content-report.json
 */

import fs from 'node:fs/promises';

import { EVENT_LIBRARY, MONTHLY_COLLECTIONS, type EventCategory, type EraSlug } from '../constants/events';
import { getImageUri } from '../utils/image-source';

type SourceHealth = {
  url: string;
  status: 'ok' | 'error' | 'skipped';
  httpStatus?: number;
  error?: string;
};

type EventIssue = {
  eventId: string;
  type:
    | 'missing_event'
    | 'duplicate_event_id'
    | 'featured_not_in_event_ids'
    | 'invalid_event_count'
    | 'invalid_featured_count'
    | 'missing_cover_image'
    | 'missing_source_count'
    | 'month_key_format'
    | 'duplicate_month_key';
  message: string;
};

type MonthReport = {
  id: string;
  monthKey: string;
  title: string;
  eventCount: number;
  featuredCount: number;
  uniqueEventCount: number;
  repeatInMonthCount: number;
  categoryDistribution: Record<string, number>;
  eraDistribution: Record<string, number>;
  sourceHealthSummary: {
    totalUrls: number;
    ok: number;
    error: number;
    skipped: number;
  };
  sourceHealthByEvent: Record<string, SourceHealth[]>;
  issues: EventIssue[];
};

type GlobalReport = {
  generatedAt: string;
  year: string;
  monthCount: number;
  totalEventRefs: number;
  uniqueEventRefs: number;
  repeatedRefCount: number;
  repeatRatio: number;
  topRepeatedEvents: { eventId: string; count: number }[];
  overallCategoryDistribution: Record<string, number>;
  overallEraDistribution: Record<string, number>;
  monthCoverageOk: boolean;
  sourceHealthSummary: {
    totalUrls: number;
    ok: number;
    error: number;
    skipped: number;
  };
  violations: EventIssue[];
  perMonth: MonthReport[];
};

const monthKeyPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

const allCategories: EventCategory[] = ['science', 'culture', 'politics', 'innovation', 'art', 'human-rights'];
const allEras: EraSlug[] = ['ancient', 'renaissance', 'industrial', 'modern', 'contemporary'];

const args = process.argv.slice(2);
const argSet = new Set(args);
const skipLinks = argSet.has('--skip-links');
const reportErrorsOnly = argSet.has('--report-errors-only');
const strict403 = argSet.has('--strict-403');
const retryArg = args.find((arg) => arg.startsWith('--retry='));
const uaArg = args.find((arg) => arg.startsWith('--ua='));
const maxRetries = Math.max(0, Number(retryArg?.split('=')[1] ?? 1));
const userAgent =
  uaArg?.split('=')[1] ??
  'Mozilla/5.0 (compatible; DailyHistoricValidator/1.0; +https://example.com)';

const eventMap = new Map(EVENT_LIBRARY.map((event) => [event.id, event]));

const emptyDistribution = (keys: string[]) =>
  keys.reduce<Record<string, number>>((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

const mergeDistribution = (base: Record<string, number>, added: Record<string, number>) => {
  for (const [key, value] of Object.entries(added)) {
    base[key] = (base[key] ?? 0) + value;
  }
};

const testUrl = async (url: string): Promise<SourceHealth> => {
  if (skipLinks) {
    return { url, status: 'skipped' };
  }

  const tryMethods: ('HEAD' | 'GET')[] = ['HEAD', 'GET'];
  let lastFailure: SourceHealth | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    for (const method of tryMethods) {
      try {
        const response = await fetch(url, {
          method,
          redirect: 'follow',
          headers: {
            'user-agent': userAgent,
            accept: 'text/html,application/xhtml+xml',
            'accept-language': 'en-US,en;q=0.9',
          },
        });

        if (response.ok) {
          return { url, status: 'ok', httpStatus: response.status };
        }

        if (response.status === 403 && !strict403) {
          return { url, status: 'ok', httpStatus: response.status };
        }

        if (method === 'GET') {
          lastFailure = {
            url,
            status: 'error',
            httpStatus: response.status,
            error: `HTTP ${response.status}`,
          };
        }
      } catch (error) {
        if (method === 'GET') {
          lastFailure = {
            url,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown network error',
          };
        }
      }
    }
  }

  return lastFailure ?? { url, status: 'error', error: 'URL check failed' };
};

const reportMonth = async (index: number): Promise<MonthReport> => {
  const collection = MONTHLY_COLLECTIONS[index];
  const issues: EventIssue[] = [];

  if (!monthKeyPattern.test(collection.monthKey)) {
    issues.push({
      eventId: collection.id,
      type: 'month_key_format',
      message: `Invalid monthKey: ${collection.monthKey}`,
    });
  }

  if (collection.featuredEventIds.length !== 4) {
    issues.push({
      eventId: collection.id,
      type: 'invalid_featured_count',
      message: `featuredEventIds must be exactly 4, got ${collection.featuredEventIds.length}`,
    });
  }

  if (collection.eventIds.length < 8 || collection.eventIds.length > 12) {
    issues.push({
      eventId: collection.id,
      type: 'invalid_event_count',
      message: `eventIds must be between 8 and 12, got ${collection.eventIds.length}`,
    });
  }

  const coverUrl = getImageUri(collection.coverImage);
  if (!coverUrl) {
    issues.push({
      eventId: collection.id,
      type: 'missing_cover_image',
      message: 'coverImage does not resolve to a URL',
    });
  }

  const seenEventIds = new Set<string>();
  const categoryDistribution = emptyDistribution(allCategories);
  const eraDistribution = emptyDistribution(allEras);
  const sourceHealthByEvent: Record<string, SourceHealth[]> = {};

  for (const eventId of collection.eventIds) {
    if (seenEventIds.has(eventId)) {
      issues.push({
        eventId,
        type: 'duplicate_event_id',
        message: `${eventId} is duplicated in ${collection.id}`,
      });
      continue;
    }
    seenEventIds.add(eventId);

    const event = eventMap.get(eventId);
    if (!event) {
      issues.push({
        eventId,
        type: 'missing_event',
        message: `${eventId} not found in EVENT_LIBRARY`,
      });
      continue;
    }

    for (const category of event.categories) {
      categoryDistribution[category] = (categoryDistribution[category] ?? 0) + 1;
    }

    for (const era of event.eras) {
      eraDistribution[era] = (eraDistribution[era] ?? 0) + 1;
    }

    if (!event.sources || event.sources.length < 2) {
      issues.push({
        eventId,
        type: 'missing_source_count',
        message: `${eventId} has ${event.sources?.length ?? 0} sources (min 2 required)`,
      });
    }

    const health = await Promise.all(event.sources.map((source) => testUrl(source.url)));
    sourceHealthByEvent[eventId] = health;
  }

  for (const featuredEventId of collection.featuredEventIds) {
    if (!collection.eventIds.includes(featuredEventId)) {
      issues.push({
        eventId: featuredEventId,
        type: 'featured_not_in_event_ids',
        message: `${featuredEventId} is featured but missing in eventIds for ${collection.id}`,
      });
    }
  }

  const allSourceChecks = Object.values(sourceHealthByEvent).flat();
  const sourceHealthSummary = {
    totalUrls: allSourceChecks.length,
    ok: allSourceChecks.filter((item) => item.status === 'ok').length,
    error: allSourceChecks.filter((item) => item.status === 'error').length,
    skipped: allSourceChecks.filter((item) => item.status === 'skipped').length,
  };

  return {
    id: collection.id,
    monthKey: collection.monthKey,
    title: collection.title,
    eventCount: collection.eventIds.length,
    featuredCount: collection.featuredEventIds.length,
    uniqueEventCount: seenEventIds.size,
    repeatInMonthCount: collection.eventIds.length - seenEventIds.size,
    categoryDistribution,
    eraDistribution,
    sourceHealthSummary,
    sourceHealthByEvent,
    issues,
  };
};

const buildGlobalReport = async (): Promise<GlobalReport> => {
  const perMonth = await Promise.all(MONTHLY_COLLECTIONS.map((_, index) => reportMonth(index)));

  const monthKeys = MONTHLY_COLLECTIONS.map((collection) => collection.monthKey);
  const duplicateMonthKeys = monthKeys.filter((key, index) => monthKeys.indexOf(key) !== index);

  const allEventRefs = MONTHLY_COLLECTIONS.flatMap((collection) => collection.eventIds);
  const refCountMap = allEventRefs.reduce<Record<string, number>>((acc, eventId) => {
    acc[eventId] = (acc[eventId] ?? 0) + 1;
    return acc;
  }, {});

  const uniqueEventRefs = Object.keys(refCountMap).length;
  const totalEventRefs = allEventRefs.length;
  const repeatedRefCount = Object.values(refCountMap)
    .filter((count) => count > 1)
    .reduce((sum, count) => sum + (count - 1), 0);

  const overallCategoryDistribution = emptyDistribution(allCategories);
  const overallEraDistribution = emptyDistribution(allEras);

  for (const month of perMonth) {
    mergeDistribution(overallCategoryDistribution, month.categoryDistribution);
    mergeDistribution(overallEraDistribution, month.eraDistribution);
  }

  const sourceHealthSummary = perMonth.reduce(
    (acc, month) => {
      acc.totalUrls += month.sourceHealthSummary.totalUrls;
      acc.ok += month.sourceHealthSummary.ok;
      acc.error += month.sourceHealthSummary.error;
      acc.skipped += month.sourceHealthSummary.skipped;
      return acc;
    },
    { totalUrls: 0, ok: 0, error: 0, skipped: 0 }
  );

  const violations: EventIssue[] = [...perMonth.flatMap((month) => month.issues)];

  if (duplicateMonthKeys.length > 0) {
    for (const monthKey of duplicateMonthKeys) {
      violations.push({
        eventId: monthKey,
        type: 'duplicate_month_key',
        message: `Duplicate month key detected: ${monthKey}`,
      });
    }
  }

  const yearSet = new Set(monthKeys.map((key) => key.slice(0, 4)));
  const monthSet = new Set(monthKeys.map((key) => Number(key.slice(5, 7))));
  const monthCoverageOk = MONTHLY_COLLECTIONS.length === 12 && yearSet.size === 1 && monthSet.size === 12;

  if (!monthCoverageOk) {
    violations.push({
      eventId: 'monthly-coverage',
      type: 'month_key_format',
      message: 'Monthly collections must include all 12 unique months in the same year',
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    year: [...yearSet][0] ?? 'unknown',
    monthCount: MONTHLY_COLLECTIONS.length,
    totalEventRefs,
    uniqueEventRefs,
    repeatedRefCount,
    repeatRatio: totalEventRefs > 0 ? repeatedRefCount / totalEventRefs : 0,
    topRepeatedEvents: Object.entries(refCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([eventId, count]) => ({ eventId, count })),
    overallCategoryDistribution,
    overallEraDistribution,
    monthCoverageOk,
    sourceHealthSummary,
    violations,
    perMonth,
  };
};

const printReport = (report: GlobalReport) => {
  console.log('\n📆 Monthly Collections Validation Report');
  console.log('='.repeat(72));
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Year: ${report.year}`);
  console.log(`Month count: ${report.monthCount} | Coverage OK: ${report.monthCoverageOk ? 'YES' : 'NO'}`);
  console.log(
    `Refs: total=${report.totalEventRefs}, unique=${report.uniqueEventRefs}, repeated=${report.repeatedRefCount}, repeatRatio=${report.repeatRatio.toFixed(3)}`
  );

  console.log('\n📊 Overall Category Distribution');
  for (const [category, count] of Object.entries(report.overallCategoryDistribution)) {
    console.log(`- ${category}: ${count}`);
  }

  console.log('\n🕰️ Overall Era Distribution');
  for (const [era, count] of Object.entries(report.overallEraDistribution)) {
    console.log(`- ${era}: ${count}`);
  }

  console.log('\n🔁 Top Repeated Events');
  for (const item of report.topRepeatedEvents.slice(0, 8)) {
    console.log(`- ${item.eventId}: ${item.count}`);
  }

  console.log('\n🔗 Source Health Summary');
  console.log(
    `- total=${report.sourceHealthSummary.totalUrls}, ok=${report.sourceHealthSummary.ok}, error=${report.sourceHealthSummary.error}, skipped=${report.sourceHealthSummary.skipped}`
  );

  console.log('\n🗓️ Per-month Summary');
  for (const month of report.perMonth) {
    if (reportErrorsOnly && month.issues.length === 0 && month.sourceHealthSummary.error === 0) {
      continue;
    }
    console.log(
      `- ${month.monthKey} | ${month.title} | events=${month.eventCount}, featured=${month.featuredCount}, issues=${month.issues.length}, sourceErrors=${month.sourceHealthSummary.error}`
    );
  }

  if (report.violations.length > 0) {
    console.log('\n❌ Violations');
    for (const violation of report.violations) {
      console.log(`- [${violation.type}] ${violation.message}`);
    }
  } else {
    console.log('\n✅ No rule violations detected.');
  }

  console.log('\nTip: --skip-links (fast), --report-errors-only, --retry=2, --strict-403, --ua=...');
};

const run = async () => {
  const report = await buildGlobalReport();
  printReport(report);

  const outputPath = 'scripts/monthly-content-report.json';
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\n💾 JSON report written to ${outputPath}\n`);

  if (report.violations.length > 0) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error('Monthly validation failed:', error);
  process.exit(1);
});
