#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import { bootstrapFirestore } from './ingest/firestore-admin';
import type { FirestoreEventDocument } from '../types/events';
import type { TimeMachineIndexDocument, TimeMachineYearDocument } from '../types/time-machine';
import {
  buildTimeMachineYearAggregate,
  enumerateTimeMachineYears,
  parseTimeMachineDate,
} from '../utils/time-machine';
import {
  DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX,
  resolveTimeMachineTargets,
} from './time-machine-firestore';

interface CliOptions {
  collectionSuffix?: string;
  serviceAccountPath?: string;
  serviceAccountJson?: string;
  projectId?: string;
}

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const options: CliOptions = {
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
      case '--collectionSuffix':
        options.collectionSuffix = readNext();
        break;
      case '--production':
        options.collectionSuffix = '';
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
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unrecognized flag: ${flag}`);
    }
  }

  return options;
};

const printHelp = () => {
  console.log(
    [
      'Validate Time Machine aggregate coverage',
      '',
      'Usage: npm run time-machine:validate -- [options]',
      '',
      'Options:',
      `  --collectionSuffix <suffix>  Collection suffix to validate (default: ${DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX}).`,
      '  --production                 Use production collections with no suffix.',
      '  --serviceAccount <path>      Path to Firebase service account JSON.',
      '  --serviceAccountJson <json>  Inline Firebase credentials.',
      '  --projectId <id>             Override Firebase project id.',
      '  -h, --help                   Show this help message.',
      '',
    ].join('\n')
  );
};

const resolveTitle = (event: FirestoreEventDocument) => {
  const primaryPage = Array.isArray(event.relatedPages) ? event.relatedPages[0] : undefined;
  return (
    primaryPage?.displayTitle ??
    primaryPage?.canonicalTitle ??
    event.summary ??
    event.text ??
    'Historic spotlight'
  );
};

const resolveSummary = (event: FirestoreEventDocument) => {
  return event.summary ?? event.text ?? event.relatedPages?.[0]?.extract ?? 'Tap to open the full story.';
};

const resolveImageUrl = (event: FirestoreEventDocument) => {
  const primaryPage = Array.isArray(event.relatedPages) ? event.relatedPages[0] : undefined;
  return primaryPage?.selectedMedia?.sourceUrl ?? primaryPage?.thumbnails?.[0]?.sourceUrl;
};

export const validateTimeMachineCoverage = async (options: CliOptions = {}) => {
  const { firestore, collections } = await bootstrapFirestore({
    serviceAccountPath: options.serviceAccountPath,
    serviceAccountJson: options.serviceAccountJson ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: options.projectId,
  });
  const targets = resolveTimeMachineTargets(collections, options.collectionSuffix);
  const [eventSnapshot, aggregateSnapshot, indexSnapshot] = await Promise.all([
    firestore.collection(targets.events).get(),
    firestore.collection(targets.timeMachineYears).get(),
    firestore.collection(targets.contentMeta).doc(targets.indexDocumentId).get(),
  ]);

  const issues: string[] = [];
  const eventMap = new Map<string, FirestoreEventDocument>();
  const eventsByYear = new Map<number, FirestoreEventDocument[]>();

  eventSnapshot.forEach((documentSnapshot) => {
    const data = documentSnapshot.data() as FirestoreEventDocument;
    const event = {
      ...data,
      eventId: data.eventId ?? documentSnapshot.id,
    };

    eventMap.set(event.eventId, event);

    if (
      typeof event.year === 'number' &&
      event.timeMachine?.eligible === true &&
      parseTimeMachineDate({ year: event.year, date: event.date, dateISO: event.dateISO })
    ) {
      const bucket = eventsByYear.get(event.year) ?? [];
      bucket.push(event);
      eventsByYear.set(event.year, bucket);
    }
  });

  const aggregateMap = new Map<number, TimeMachineYearDocument>();
  aggregateSnapshot.forEach((documentSnapshot) => {
    const data = documentSnapshot.data() as TimeMachineYearDocument;
    if (typeof data?.year === 'number') {
      aggregateMap.set(data.year, data);
    }
  });

  if (!indexSnapshot.exists) {
    issues.push(`Missing index document ${targets.indexDocumentId}`);
  }

  const indexDocument = (indexSnapshot.data() ?? null) as TimeMachineIndexDocument | null;
  const indexYearMap = new Map(
    (indexDocument?.years ?? []).map((entry) => [entry.year, entry])
  );

  for (const year of enumerateTimeMachineYears()) {
    const aggregate = aggregateMap.get(year);
    if (!aggregate) {
      issues.push(`Missing aggregate document for year ${year}`);
      continue;
    }

    const referencedIds = Array.from(
      new Set([
        ...(aggregate.heroEventId ? [aggregate.heroEventId] : []),
        ...aggregate.highlightEventIds,
        ...aggregate.overflowEventIds,
      ])
    );
    const seenIds = new Set<string>();
    const overlapIds = aggregate.highlightEventIds.filter((id) => aggregate.overflowEventIds.includes(id));
    if (overlapIds.length > 0) {
      issues.push(`Year ${year}: highlight/overflow overlap detected (${overlapIds.join(', ')})`);
    }

    for (const eventId of referencedIds) {
      if (seenIds.has(eventId)) {
        issues.push(`Year ${year}: duplicate reference ${eventId}`);
        continue;
      }
      seenIds.add(eventId);

      const event = eventMap.get(eventId);
      if (!event) {
        issues.push(`Year ${year}: missing event reference ${eventId}`);
        continue;
      }
      if (event.timeMachine?.eligible !== true) {
        issues.push(`Year ${year}: referenced event ${eventId} is not time-machine eligible`);
      }

      const parsed = parseTimeMachineDate({
        year: event.year,
        date: event.date,
        dateISO: event.dateISO,
      });
      if (!parsed) {
        issues.push(`Year ${year}: event ${eventId} has invalid date fields`);
      }
    }

    if (aggregate.eventCount > 0 && !aggregate.heroEventId) {
      issues.push(`Year ${year}: heroEventId missing despite eventCount=${aggregate.eventCount}`);
    }
    if (aggregate.heroEventId && !seenIds.has(aggregate.heroEventId)) {
      issues.push(`Year ${year}: heroEventId ${aggregate.heroEventId} is not present in references`);
    }

    const rebuilt = buildTimeMachineYearAggregate(
      year,
      (eventsByYear.get(year) ?? []).map((event) => ({
        eventId: event.eventId,
        year: event.year,
        title: resolveTitle(event),
        summary: resolveSummary(event),
        categories: event.categories ?? [],
        date: event.date,
        dateISO: event.dateISO,
        imageUrl: resolveImageUrl(event),
        beforeContext: event.beforeContext,
        afterContext: event.afterContext,
        pageCount: Array.isArray(event.relatedPages) ? event.relatedPages.length : 0,
        existingImportanceScore: event.timeMachine?.importanceScore,
      })),
      {
        existingSummary: aggregate.summary,
        summarySource: aggregate.summarySource,
        generatedAt: aggregate.generatedAt,
        contentVersion: aggregate.contentVersion,
        highlightLimit: aggregate.highlightEventIds.length,
      }
    ).document;

    if (rebuilt.eventCount !== aggregate.eventCount) {
      issues.push(`Year ${year}: eventCount mismatch (stored=${aggregate.eventCount}, rebuilt=${rebuilt.eventCount})`);
    }
    if (rebuilt.publishState !== aggregate.publishState) {
      issues.push(`Year ${year}: publishState mismatch (stored=${aggregate.publishState}, rebuilt=${rebuilt.publishState})`);
    }
    if (JSON.stringify(rebuilt.populatedMonths) !== JSON.stringify(aggregate.populatedMonths)) {
      issues.push(`Year ${year}: populatedMonths mismatch`);
    }

    const indexEntry = indexYearMap.get(year);
    if (!indexEntry) {
      issues.push(`Index missing year ${year}`);
    } else {
      if (indexEntry.publishState !== aggregate.publishState) {
        issues.push(`Index mismatch for ${year}: publishState differs`);
      }
      if (indexEntry.eventCount !== aggregate.eventCount) {
        issues.push(`Index mismatch for ${year}: eventCount differs`);
      }
      if (indexEntry.populatedMonthCount !== aggregate.populatedMonths.length) {
        issues.push(`Index mismatch for ${year}: populatedMonthCount differs`);
      }
    }
  }

  if (issues.length > 0) {
    const message = `Time Machine validation failed with ${issues.length} issue(s):\n- ${issues.join('\n- ')}`;
    throw new Error(message);
  }

  console.log(
    `Validated ${aggregateMap.size} aggregates, ${eventMap.size} events, and index ${targets.indexDocumentId} successfully.`
  );
};

const main = async () => {
  const options = parseArgs();
  await validateTimeMachineCoverage(options);
};

const isMainModule =
  typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  void main().catch((error) => {
    console.error('Time Machine validation failed:', error);
    process.exit(1);
  });
}
