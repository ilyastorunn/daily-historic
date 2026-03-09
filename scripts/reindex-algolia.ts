#!/usr/bin/env node

import { bootstrapFirestore } from "./ingest/firestore-admin";
import type { HistoricalEventRecord } from "./ingest/types";
import { clearAlgoliaIndex, configureAlgoliaIndices, upsertAlgoliaRecords } from "./algolia-admin";
import { toAlgoliaSearchRecord } from "../search/algolia-record";

const BATCH_SIZE = 500;

const main = async () => {
  const { firestore, collections } = await bootstrapFirestore({});

  await configureAlgoliaIndices();
  await clearAlgoliaIndex();

  let lastEventId: string | null = null;
  let indexedCount = 0;

  while (true) {
    let query = firestore.collection(collections.events).orderBy("eventId").limit(BATCH_SIZE);

    if (lastEventId) {
      query = query.startAfter(lastEventId);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    const records = snapshot.docs
      .map((doc) => {
        const event = {
          ...(doc.data() as HistoricalEventRecord),
          eventId: doc.id,
        };
        return toAlgoliaSearchRecord(event);
      })
      .filter((record): record is NonNullable<typeof record> => record !== null);

    await upsertAlgoliaRecords(records);

    indexedCount += records.length;
    lastEventId = snapshot.docs[snapshot.docs.length - 1]?.id ?? null;

    console.log(`[Algolia Reindex] Indexed ${indexedCount} records so far`);
  }

  console.log(`[Algolia Reindex] Completed. Total indexed records: ${indexedCount}`);
};

void main().catch((error) => {
  console.error("[Algolia Reindex] Failed:", error);
  process.exit(1);
});
