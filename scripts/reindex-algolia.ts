#!/usr/bin/env node

import { bootstrapFirestore } from "./ingest/firestore-admin";
import type { HistoricalEventRecord } from "./ingest/types";
import { clearAlgoliaIndex, configureAlgoliaIndices, upsertAlgoliaRecords } from "./algolia-admin";
import { toAlgoliaSearchRecord } from "../search/algolia-record";

const BATCH_SIZE = 500;

const extractOversizedObjectId = (error: unknown): string | null => {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/objectID=([A-Za-z0-9:_-]+)/);
  return match?.[1] ?? null;
};

const upsertWithOversizeRecovery = async (
  records: NonNullable<ReturnType<typeof toAlgoliaSearchRecord>>[]
) => {
  if (records.length === 0) {
    return;
  }

  let remaining = [...records];
  const skippedOversized: string[] = [];

  while (remaining.length > 0) {
    try {
      await upsertAlgoliaRecords(remaining);
      if (skippedOversized.length > 0) {
        console.warn(
          `[Algolia Reindex] Skipped ${skippedOversized.length} oversized record(s): ${skippedOversized.join(", ")}`
        );
      }
      return;
    } catch (error) {
      const oversizedId = extractOversizedObjectId(error);
      if (!oversizedId) {
        throw error;
      }

      const nextRemaining = remaining.filter((record) => record.objectID !== oversizedId);
      if (nextRemaining.length === remaining.length) {
        throw error;
      }

      skippedOversized.push(oversizedId);
      remaining = nextRemaining;
      console.warn(`[Algolia Reindex] Dropping oversized record ${oversizedId} and continuing...`);
    }
  }
};

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

    await upsertWithOversizeRecovery(records);

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
