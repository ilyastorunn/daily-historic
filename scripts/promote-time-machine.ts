#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { bootstrapFirestore } from './ingest/firestore-admin';
import {
  DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX,
  normalizeCollectionSuffix,
  resolveTimeMachineTargets,
} from './time-machine-firestore';

const BATCH_LIMIT = 400;

interface CliOptions {
  fromSuffix?: string;
  toSuffix?: string;
  dryRun?: boolean;
  serviceAccountPath?: string;
  serviceAccountJson?: string;
  projectId?: string;
}

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    fromSuffix: DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX,
    toSuffix: '',
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
      case '--fromSuffix':
        options.fromSuffix = readNext();
        break;
      case '--toSuffix':
        options.toSuffix = readNext();
        break;
      case '--production':
        options.toSuffix = '';
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
      case '--dryRun':
      case '--dry-run':
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
      'Promote Time Machine data between Firestore collection targets',
      '',
      'Usage: npm run time-machine:promote -- [options]',
      '',
      'Options:',
      `  --fromSuffix <suffix>       Source collection suffix (default: ${DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX}).`,
      '  --toSuffix <suffix>         Destination suffix (default: none / production).',
      '  --production                Shortcut for --toSuffix "".',
      '  --serviceAccount <path>     Path to Firebase service account JSON.',
      '  --serviceAccountJson <json> Inline Firebase credentials.',
      '  --projectId <id>            Override Firebase project id.',
      '  --dryRun                    Print what would be copied without writing.',
      '  -h, --help                  Show this help message.',
      '',
    ].join('\n')
  );
};

const commitDocuments = async (
  firestore: Firestore,
  documents: QueryDocumentSnapshot[],
  targetCollection: string
) => {
  let batch = firestore.batch();
  let operationCount = 0;

  const flush = async () => {
    if (operationCount === 0) {
      return;
    }

    await batch.commit();
    batch = firestore.batch();
    operationCount = 0;
  };

  for (const documentSnapshot of documents) {
    batch.set(
      firestore.collection(targetCollection).doc(documentSnapshot.id),
      documentSnapshot.data()
    );
    operationCount += 1;

    if (operationCount >= BATCH_LIMIT) {
      await flush();
    }
  }

  await flush();
};

export const promoteTimeMachine = async (options: CliOptions = {}) => {
  const sourceSuffix = normalizeCollectionSuffix(options.fromSuffix);
  const destinationSuffix = normalizeCollectionSuffix(options.toSuffix);

  if (sourceSuffix === destinationSuffix) {
    throw new Error('Source and destination suffixes must be different.');
  }

  const { firestore, collections } = await bootstrapFirestore({
    serviceAccountPath: options.serviceAccountPath,
    serviceAccountJson: options.serviceAccountJson ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: options.projectId,
  });

  const sourceTargets = resolveTimeMachineTargets(collections, sourceSuffix);
  const destinationTargets = resolveTimeMachineTargets(collections, destinationSuffix);

  const [sourceEventsSnapshot, sourceAggregatesSnapshot, sourceIndexSnapshot] = await Promise.all([
    firestore.collection(sourceTargets.events).get(),
    firestore.collection(sourceTargets.timeMachineYears).get(),
    firestore.collection(sourceTargets.contentMeta).doc(sourceTargets.indexDocumentId).get(),
  ]);

  if (!sourceIndexSnapshot.exists) {
    throw new Error(`Source index document ${sourceTargets.indexDocumentId} is missing.`);
  }

  console.log(
    [
      `Promoting Time Machine data`,
      `  events: ${sourceTargets.events} -> ${destinationTargets.events} (${sourceEventsSnapshot.size} docs)`,
      `  years: ${sourceTargets.timeMachineYears} -> ${destinationTargets.timeMachineYears} (${sourceAggregatesSnapshot.size} docs)`,
      `  index: ${sourceTargets.contentMeta}/${sourceTargets.indexDocumentId} -> ${destinationTargets.contentMeta}/${destinationTargets.indexDocumentId}`,
    ].join('\n')
  );

  if (options.dryRun) {
    console.log('Dry run complete. No documents were written.');
    return;
  }

  await commitDocuments(firestore, sourceEventsSnapshot.docs, destinationTargets.events);
  await commitDocuments(firestore, sourceAggregatesSnapshot.docs, destinationTargets.timeMachineYears);
  await firestore
    .collection(destinationTargets.contentMeta)
    .doc(destinationTargets.indexDocumentId)
    .set(sourceIndexSnapshot.data() ?? {});

  console.log(
    `Promotion complete: ${sourceEventsSnapshot.size} events, ${sourceAggregatesSnapshot.size} aggregates, and ${destinationTargets.indexDocumentId}.`
  );
};

const main = async () => {
  const options = parseArgs();
  await promoteTimeMachine(options);
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error) => {
    console.error('Time Machine promotion failed:', error);
    process.exitCode = 1;
  });
}
