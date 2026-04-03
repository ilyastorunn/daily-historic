#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import { bootstrapFirestore } from './ingest/firestore-admin';
import type { FirestoreEventDocument } from '../types/events';
import type { TimeMachineIndexDocument, TimeMachineYearDocument } from '../types/time-machine';
import { getPreferredEventTitle, selectPreferredRelatedPage } from '../utils/event-primary-page';
import {
  TIME_MACHINE_CONTENT_VERSION,
  buildTimeMachineIndexEntry,
  buildTimeMachineYearAggregate,
  createEmptyTimeMachineYearDocument,
  enumerateTimeMachineYears,
  parseTimeMachineDate,
} from '../utils/time-machine';
import {
  DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX,
  resolveTimeMachineTargets,
} from './time-machine-firestore';

const BATCH_LIMIT = 400;

interface CliOptions {
  collectionSuffix?: string;
  dryRun?: boolean;
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
      case '--dry-run':
      case '--dryRun':
        options.dryRun = true;
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
      'Build Time Machine aggregates',
      '',
      'Usage: npm run time-machine:build -- [options]',
      '',
      'Options:',
      `  --collectionSuffix <suffix>  Collection suffix to target (default: ${DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX}).`,
      '  --production                 Use production collections with no suffix.',
      '  --serviceAccount <path>      Path to Firebase service account JSON.',
      '  --serviceAccountJson <json>  Inline Firebase credentials.',
      '  --projectId <id>             Override Firebase project id.',
      '  --dry-run                    Print aggregate summary without writing.',
      '  -h, --help                   Show this help message.',
      '',
    ].join('\n')
  );
};

const selectPrimaryPage = (event: FirestoreEventDocument) => {
  const pages = Array.isArray(event.relatedPages) ? event.relatedPages : [];
  if (pages.length === 0) {
    return undefined;
  }

  return selectPreferredRelatedPage(pages, event.summary ?? event.text);
};

const resolveTitle = (event: FirestoreEventDocument) => {
  return getPreferredEventTitle(event.relatedPages, event.summary ?? event.text);
};

const resolveSummary = (event: FirestoreEventDocument) => {
  const primaryPage = selectPrimaryPage(event);
  return event.summary ?? event.text ?? primaryPage?.extract ?? 'Tap to open the full story.';
};

const resolveImageUrl = (event: FirestoreEventDocument) => {
  const primaryPage = selectPrimaryPage(event);
  return primaryPage?.selectedMedia?.sourceUrl ?? primaryPage?.thumbnails?.[0]?.sourceUrl;
};

const isEligibleTimeMachineEvent = (event: FirestoreEventDocument) => {
  if (!event.eventId || event.timeMachine?.eligible !== true) {
    return false;
  }

  return parseTimeMachineDate({
    year: event.year,
    date: event.date,
    dateISO: event.dateISO,
  }) !== null;
};

export const buildTimeMachineAggregates = async (options: CliOptions = {}) => {
  const { firestore, collections } = await bootstrapFirestore({
    serviceAccountPath: options.serviceAccountPath,
    serviceAccountJson: options.serviceAccountJson ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: options.projectId,
  });
  const targets = resolveTimeMachineTargets(collections, options.collectionSuffix);
  const generatedAt = new Date().toISOString();

  const [eventsSnapshot, aggregateSnapshot] = await Promise.all([
    firestore.collection(targets.events).get(),
    firestore.collection(targets.timeMachineYears).get(),
  ]);

  console.log(
    `Building Time Machine aggregates from ${eventsSnapshot.size} events in ${targets.events} -> ${targets.timeMachineYears}`
  );

  const eventsByYear = new Map<number, FirestoreEventDocument[]>();
  eventsSnapshot.forEach((documentSnapshot) => {
    const data = documentSnapshot.data() as FirestoreEventDocument;
    const event = {
      ...data,
      eventId: data.eventId ?? documentSnapshot.id,
    };

    if (typeof event.year !== 'number' || !isEligibleTimeMachineEvent(event)) {
      return;
    }

    const bucket = eventsByYear.get(event.year) ?? [];
    bucket.push(event);
    eventsByYear.set(event.year, bucket);
  });

  const existingAggregates = new Map<number, TimeMachineYearDocument>();
  aggregateSnapshot.forEach((documentSnapshot) => {
    const data = documentSnapshot.data() as TimeMachineYearDocument;
    if (typeof data?.year === 'number') {
      existingAggregates.set(data.year, data);
    }
  });

  const documents = enumerateTimeMachineYears().map((year) => {
    const yearEvents = eventsByYear.get(year) ?? [];
    const existingAggregate = existingAggregates.get(year);

    if (yearEvents.length === 0) {
      return createEmptyTimeMachineYearDocument(year, generatedAt);
    }

    return buildTimeMachineYearAggregate(
      year,
      yearEvents.map((event) => ({
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
        generatedAt,
        contentVersion: TIME_MACHINE_CONTENT_VERSION,
        existingSummary: existingAggregate?.summarySource === 'manual' ? existingAggregate.summary : undefined,
        existingEditorialIntro: existingAggregate?.editorialIntro,
        summarySource: existingAggregate?.summarySource === 'manual' ? 'manual' : undefined,
      }
    ).document;
  });

  const indexDocument: TimeMachineIndexDocument = {
    contentVersion: TIME_MACHINE_CONTENT_VERSION,
    updatedAt: generatedAt,
    years: documents.map((document) => buildTimeMachineIndexEntry(document)),
  };

  if (options.dryRun) {
    const counts = documents.reduce(
      (accumulator, document) => {
        accumulator[document.publishState] += 1;
        return accumulator;
      },
      { strong: 0, partial: 0, empty: 0 } as Record<'strong' | 'partial' | 'empty', number>
    );

    console.log('Dry run summary:', counts);
    return {
      aggregateCount: documents.length,
      backfillCount: eventsSnapshot.size,
      indexDocument,
      targets,
    };
  }

  let batch = firestore.batch();
  let opCount = 0;
  let aggregateCount = 0;
  let eventBackfillCount = 0;

  const flushBatch = async () => {
    if (opCount === 0) {
      return;
    }
    await batch.commit();
    batch = firestore.batch();
    opCount = 0;
  };

  for (const document of documents) {
    batch.set(
      firestore.collection(targets.timeMachineYears).doc(String(document.year)),
      document,
      { merge: true }
    );
    opCount += 1;
    aggregateCount += 1;

    const eventIds = [...document.highlightEventIds, ...document.overflowEventIds];
    const highlightSet = new Set(document.highlightEventIds);
    for (const eventId of eventIds) {
      batch.set(
        firestore.collection(targets.events).doc(eventId),
        {
          timeMachine: {
            featured: highlightSet.has(eventId),
            lastAggregatedAt: generatedAt,
            generatedAt,
          },
        },
        { merge: true }
      );
      opCount += 1;
      eventBackfillCount += 1;

      if (opCount >= BATCH_LIMIT) {
        await flushBatch();
      }
    }

    if (opCount >= BATCH_LIMIT) {
      await flushBatch();
    }
  }

  batch.set(
    firestore.collection(targets.contentMeta).doc(targets.indexDocumentId),
    indexDocument,
    { merge: true }
  );
  opCount += 1;

  await flushBatch();

  console.log(
    `Wrote ${aggregateCount} year aggregates, backfilled ${eventBackfillCount} event documents, and published ${targets.indexDocumentId}.`
  );

  return {
    aggregateCount,
    backfillCount: eventBackfillCount,
    indexDocument,
    targets,
  };
};

const main = async () => {
  const options = parseArgs();
  await buildTimeMachineAggregates(options);
};

const isMainModule =
  typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  void main().catch((error) => {
    console.error('Failed to build Time Machine aggregates:', error);
    process.exit(1);
  });
}
