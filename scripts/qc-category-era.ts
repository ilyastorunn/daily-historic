import { bootstrapFirestore } from './ingest/firestore-admin';
import { CATEGORY_OPTIONS, ERA_OPTIONS, isCategoryOption, isEraOption } from '../shared/taxonomy';
import { existsSync, readFileSync } from 'node:fs';

type Options = {
  projectId?: string;
  serviceAccountPath?: string;
  serviceAccountJson?: string;
  sampleSize: number;
  maxEmptyCategoriesRatio: number;
  maxMissingEraRatio: number;
  requireAlgolia: boolean;
  minAlgoliaCoverageRatio: number;
};

type SearchCase = {
  name: string;
  query: string;
  filters: {
    categories?: string[];
    era?: string;
    month?: number;
    day?: number;
  };
  hitsPerPage: number;
};

const parseArgs = (): Options => {
  const options: Options = {
    sampleSize: 50,
    maxEmptyCategoriesRatio: 0,
    maxMissingEraRatio: 0,
    requireAlgolia: false,
    minAlgoliaCoverageRatio: 0.98,
  };

  for (const token of process.argv.slice(2)) {
    const [flag, value] = token.split('=');
    switch (flag) {
      case '--project-id':
        options.projectId = value;
        break;
      case '--service-account-path':
        options.serviceAccountPath = value;
        break;
      case '--service-account-json':
        options.serviceAccountJson = value;
        break;
      case '--sample-size':
        if (value) options.sampleSize = Math.max(10, Math.min(200, Number.parseInt(value, 10) || 50));
        break;
      case '--max-empty-categories-ratio':
        if (value) options.maxEmptyCategoriesRatio = Number.parseFloat(value);
        break;
      case '--max-missing-era-ratio':
        if (value) options.maxMissingEraRatio = Number.parseFloat(value);
        break;
      case '--require-algolia':
        options.requireAlgolia = true;
        break;
      case '--min-algolia-coverage-ratio':
        if (value) options.minAlgoliaCoverageRatio = Number.parseFloat(value);
        break;
      default:
        break;
    }
  }

  return options;
};

const buildAlgoliaFilters = (filters: SearchCase['filters']) => {
  const clauses: string[] = [];
  if (filters.categories?.length) {
    const categoryClause = filters.categories.map((category) => `categories:"${category}"`).join(' OR ');
    clauses.push(filters.categories.length > 1 ? `(${categoryClause})` : categoryClause);
  }
  if (filters.era) clauses.push(`era:"${filters.era}"`);
  if (typeof filters.month === 'number') clauses.push(`month=${filters.month}`);
  if (typeof filters.day === 'number') clauses.push(`day=${filters.day}`);
  return clauses.length > 0 ? clauses.join(' AND ') : undefined;
};

const verifyHit = (hit: Record<string, unknown>, filters: SearchCase['filters']) => {
  if (filters.categories?.length) {
    const categories = Array.isArray(hit.categories) ? hit.categories.filter((value): value is string => typeof value === 'string') : [];
    if (!categories.some((category) => filters.categories?.includes(category))) {
      return false;
    }
  }

  if (filters.era && hit.era !== filters.era) {
    return false;
  }

  if (typeof filters.month === 'number' && hit.month !== filters.month) {
    return false;
  }

  if (typeof filters.day === 'number' && hit.day !== filters.day) {
    return false;
  }

  return true;
};

const runAlgoliaChecks = async (sampleSize: number, requireAlgolia: boolean) => {
  const envFallback: Record<string, string> = {};
  if (
    (!process.env.EXPO_PUBLIC_ALGOLIA_APP_ID ||
      !process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_API_KEY ||
      !process.env.EXPO_PUBLIC_ALGOLIA_INDEX_EVENTS) &&
    existsSync('./.env')
  ) {
    const raw = readFileSync('./.env', 'utf-8');
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#') && line.includes('='))
      .forEach((line) => {
        const splitIndex = line.indexOf('=');
        envFallback[line.slice(0, splitIndex)] = line.slice(splitIndex + 1);
      });
  }

  const appId = process.env.EXPO_PUBLIC_ALGOLIA_APP_ID ?? envFallback.EXPO_PUBLIC_ALGOLIA_APP_ID;
  const apiKey = process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_API_KEY ?? envFallback.EXPO_PUBLIC_ALGOLIA_SEARCH_API_KEY;
  const indexName = process.env.EXPO_PUBLIC_ALGOLIA_INDEX_EVENTS ?? envFallback.EXPO_PUBLIC_ALGOLIA_INDEX_EVENTS;

  if (!appId || !apiKey || !indexName) {
    if (requireAlgolia) {
      throw new Error('Algolia environment variables are required for this QC run');
    }
    return {
      skipped: true,
      totalHits: 0,
      cases: [] as Array<{ name: string; hits: number; violations: number }>,
    };
  }

  const cases: SearchCase[] = [
    { name: 'category-politics', query: '', filters: { categories: ['politics'] }, hitsPerPage: sampleSize },
    { name: 'category-era-combo', query: '', filters: { categories: ['science-discovery', 'inventions'], era: 'twentieth' }, hitsPerPage: sampleSize },
    { name: 'era-only', query: '', filters: { era: 'medieval' }, hitsPerPage: sampleSize },
    { name: 'date-only', query: '', filters: { month: 7, day: 20 }, hitsPerPage: sampleSize },
    { name: 'query-with-filters', query: 'apollo', filters: { categories: ['exploration'], era: 'twentieth' }, hitsPerPage: sampleSize },
  ];

  const results: Array<{ name: string; hits: number; violations: number }> = [];
  let totalHits = 0;

  {
    const response = await fetch(
      `https://${appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(indexName)}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Algolia-API-Key': apiKey,
          'X-Algolia-Application-Id': appId,
        },
        body: JSON.stringify({
          query: '',
          page: 0,
          hitsPerPage: 1,
          attributesToRetrieve: ['eventId'],
        }),
      }
    );
    if (!response.ok) {
      throw new Error(`Algolia totalHits probe failed: ${response.status}`);
    }
    const payload = (await response.json()) as { nbHits?: number };
    totalHits = typeof payload.nbHits === 'number' ? payload.nbHits : 0;
  }

  for (const testCase of cases) {
    const payload = {
      query: testCase.query,
      page: 0,
      hitsPerPage: testCase.hitsPerPage,
      filters: buildAlgoliaFilters(testCase.filters),
      attributesToRetrieve: ['eventId', 'categories', 'era', 'month', 'day'],
    };

    const response = await fetch(
      `https://${appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(indexName)}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Algolia-API-Key': apiKey,
          'X-Algolia-Application-Id': appId,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Algolia request failed for ${testCase.name}: ${response.status}`);
    }

    const data = (await response.json()) as { hits?: Record<string, unknown>[] };
    const hits = data.hits ?? [];
    const violations = hits.filter((hit) => !verifyHit(hit, testCase.filters)).length;

    results.push({
      name: testCase.name,
      hits: hits.length,
      violations,
    });
  }

  return { skipped: false, totalHits, cases: results };
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

  let query = firestore.collection(collections.events).orderBy('eventId').limit(500);
  let total = 0;
  let emptyCategories = 0;
  let missingEra = 0;
  let invalidCategories = 0;
  let invalidEra = 0;

  while (true) {
    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, unknown>;
      total += 1;

      const categories = Array.isArray(data.categories)
        ? data.categories.filter((value): value is string => typeof value === 'string')
        : [];
      if (categories.length === 0) {
        emptyCategories += 1;
      }

      if (categories.includes('surprise') && categories.length > 1) {
        invalidCategories += 1;
      }

      categories.forEach((category) => {
        if (!isCategoryOption(category)) {
          invalidCategories += 1;
        }
      });

      const era = typeof data.era === 'string' ? data.era : undefined;
      if (!era) {
        missingEra += 1;
      } else if (!isEraOption(era)) {
        invalidEra += 1;
      }
    }

    const last = snapshot.docs[snapshot.docs.length - 1];
    query = firestore.collection(collections.events).orderBy('eventId').startAfter(last.id).limit(500);
  }

  const emptyCategoriesRatio = total === 0 ? 0 : emptyCategories / total;
  const missingEraRatio = total === 0 ? 0 : missingEra / total;

  const algolia = await runAlgoliaChecks(options.sampleSize, options.requireAlgolia);
  const totalAlgoliaViolations = algolia.cases.reduce((sum, item) => sum + item.violations, 0);
  const algoliaCoverageRatio = total === 0 ? 0 : algolia.totalHits / total;

  const report = {
    summary: {
      total,
      emptyCategories,
      missingEra,
      invalidCategories,
      invalidEra,
      emptyCategoriesRatio,
      missingEraRatio,
      allowedCategories: CATEGORY_OPTIONS.length,
      allowedEras: ERA_OPTIONS.length,
    },
    algolia,
    thresholds: {
      maxEmptyCategoriesRatio: options.maxEmptyCategoriesRatio,
      maxMissingEraRatio: options.maxMissingEraRatio,
      maxAlgoliaViolations: 0,
      minAlgoliaCoverageRatio: options.minAlgoliaCoverageRatio,
    },
    coverage: {
      firestoreTotal: total,
      algoliaTotalHits: algolia.totalHits,
      algoliaCoverageRatio,
    },
  };

  console.log(JSON.stringify(report, null, 2));

  const failed =
    emptyCategoriesRatio > options.maxEmptyCategoriesRatio ||
    missingEraRatio > options.maxMissingEraRatio ||
    invalidCategories > 0 ||
    invalidEra > 0 ||
    totalAlgoliaViolations > 0 ||
    (!algolia.skipped && algoliaCoverageRatio < options.minAlgoliaCoverageRatio);

  if (failed) {
    process.exit(1);
  }
};

void run().catch((error) => {
  console.error('[QC] Failed:', error);
  process.exit(1);
});
