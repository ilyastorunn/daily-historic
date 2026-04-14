#!/usr/bin/env node

import { bootstrapFirestore } from "./ingest/firestore-admin";
import type { HistoricalEventRecord } from "./ingest/types";
import { clearAlgoliaIndex, configureAlgoliaIndices, upsertAlgoliaRecords } from "./algolia-admin";
import { toAlgoliaSearchRecord } from "../search/algolia-record";

const BATCH_SIZE = 500;
const MAX_OVERSIZE_RETRIES_PER_RECORD = 2;

const extractOversizedObjectId = (error: unknown): string | null => {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/objectID=([A-Za-z0-9:_-]+)/);
  return match?.[1] ?? null;
};

const truncate = (value: string, maxChars: number) => {
  if (value.length <= maxChars) {
    return value;
  }

  if (maxChars <= 1) {
    return value.slice(0, maxChars);
  }

  return `${value.slice(0, maxChars - 1).trimEnd()}…`;
};

const aggressivelyCompactRecord = (record: NonNullable<ReturnType<typeof toAlgoliaSearchRecord>>) => {
  return {
    ...record,
    title: truncate(record.title, 120),
    summary: truncate(record.summary, 220),
    searchableText: truncate(record.searchableText, 900),
    location: record.location ? truncate(record.location, 80) : undefined,
    tags: record.tags.slice(0, 10).map((tag) => truncate(tag, 24)),
  };
};

const upsertWithOversizeRecovery = async (
  records: NonNullable<ReturnType<typeof toAlgoliaSearchRecord>>[]
) => {
  if (records.length === 0) {
    return 0;
  }

  let remaining = [...records];
  const retryCountById = new Map<string, number>();

  while (remaining.length > 0) {
    try {
      await upsertAlgoliaRecords(remaining);
      return remaining.length;
    } catch (error) {
      const oversizedId = extractOversizedObjectId(error);
      if (!oversizedId) {
        throw error;
      }

      const index = remaining.findIndex((record) => record.objectID === oversizedId);
      if (index < 0) {
        throw error;
      }

      const retries = (retryCountById.get(oversizedId) ?? 0) + 1;
      retryCountById.set(oversizedId, retries);

      if (retries > MAX_OVERSIZE_RETRIES_PER_RECORD) {
        throw new Error(
          `Record ${oversizedId} is still oversized after ${MAX_OVERSIZE_RETRIES_PER_RECORD} compaction attempt(s).`
        );
      }

      remaining[index] = aggressivelyCompactRecord(remaining[index]);
      console.warn(`[Algolia Reindex] Compacting oversized record ${oversizedId} (attempt ${retries})...`);
    }
  }

  return 0;
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

    const persistedCount = await upsertWithOversizeRecovery(records);

    indexedCount += persistedCount;
    lastEventId = snapshot.docs[snapshot.docs.length - 1]?.id ?? null;

    console.log(`[Algolia Reindex] Indexed ${indexedCount} records so far`);
  }

  console.log(`[Algolia Reindex] Completed. Total indexed records: ${indexedCount}`);
};

void main().catch((error) => {
  console.error("[Algolia Reindex] Failed:", error);
  process.exit(1);
});
