import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchEventsByIds } from '@/services/content';
import {
  TIME_MACHINE_YEARS_COLLECTION,
  doc,
  firebaseFirestore,
  getDoc,
} from '@/services/firebase';
import { fetchWithCache, CachePresets } from '@/services/api-helpers';
import type { FirestoreEventDocument } from '@/types/events';
import type {
  TimeMachineEditorialIntro,
  TimeMachineTimelineEvent,
  TimeMachineYearDocument,
  TimeMachineYearResponse,
} from '@/types/time-machine';
import {
  TIME_MACHINE_HIGHLIGHT_LIMIT,
  TIME_MACHINE_LAST_YEAR_STORAGE_KEY,
  clampTimeMachineYear,
  buildTimeMachineSections,
  buildTimeMachineFallbackEditorialIntro,
  buildTimeMachineYearAggregate,
  isValidTimeMachineYear,
} from '@/utils/time-machine';
import { CacheKeys } from '@/utils/cache-keys';
import { getEventImageUri, getEventSummary, getEventTitle } from '@/utils/event-presentation';

const mapFirestoreEventToAggregateInput = (event: FirestoreEventDocument) => {
  return {
    eventId: event.eventId,
    year: event.year,
    title: getEventTitle(event),
    summary: getEventSummary(event),
    categories: Array.isArray(event.categories) ? event.categories : [],
    date: event.date,
    dateISO: event.dateISO,
    imageUrl: getEventImageUri(event),
    beforeContext: event.beforeContext,
    afterContext: event.afterContext,
    pageCount: Array.isArray(event.relatedPages) ? event.relatedPages.length : 0,
    existingImportanceScore: event.timeMachine?.importanceScore,
  };
};

const buildResponseFromEvents = (
  year: number,
  events: FirestoreEventDocument[],
  aggregateDoc?: Partial<TimeMachineYearDocument> | null
): TimeMachineYearResponse => {
  const aggregate = buildTimeMachineYearAggregate(
    year,
    events.map(mapFirestoreEventToAggregateInput),
    {
      existingSummary: aggregateDoc?.summary,
      existingEditorialIntro: aggregateDoc?.editorialIntro,
      summarySource: aggregateDoc?.summarySource,
      generatedAt: aggregateDoc?.generatedAt,
      contentVersion: aggregateDoc?.contentVersion,
      highlightLimit:
        aggregateDoc?.highlightEventIds?.length && aggregateDoc.highlightEventIds.length > 0
          ? aggregateDoc.highlightEventIds.length
          : TIME_MACHINE_HIGHLIGHT_LIMIT,
    }
  );

  const allEventIds = new Set(aggregate.events.map((event) => event.id));
  const preferredHighlightIds = (aggregateDoc?.highlightEventIds ?? []).filter((eventId) => allEventIds.has(eventId));
  const highlightIds = preferredHighlightIds.length > 0 ? preferredHighlightIds : aggregate.document.highlightEventIds;
  const preferredHero =
    aggregateDoc?.heroEventId && allEventIds.has(aggregateDoc.heroEventId)
      ? aggregate.events.find((event) => event.id === aggregateDoc.heroEventId) ?? null
      : aggregate.hero;
  const preferredCover =
    aggregateDoc?.coverEventId && allEventIds.has(aggregateDoc.coverEventId)
      ? aggregate.events.find((event) => event.id === aggregateDoc.coverEventId) ?? null
      : aggregate.cover;

  const sections = buildTimeMachineSections(aggregate.events, highlightIds);
  const overflowCount = Math.max(aggregate.events.length - highlightIds.length, 0);
  const editorialIntro: TimeMachineEditorialIntro =
    aggregateDoc?.editorialIntro ??
    buildTimeMachineFallbackEditorialIntro({
      year,
      hero: preferredCover ?? preferredHero,
      sections,
    });

  return {
    year,
    summary: aggregateDoc?.summary?.trim() || aggregate.document.summary,
    coverEventId: preferredCover?.id ?? aggregateDoc?.coverEventId ?? aggregate.document.coverEventId,
    coverImageUrl:
      preferredCover?.imageUrl ?? aggregateDoc?.coverImageUrl ?? aggregate.document.coverImageUrl,
    editorialIntro,
    publishState: aggregateDoc?.publishState ?? aggregate.document.publishState,
    qualityFlags: aggregateDoc?.qualityFlags ?? aggregate.document.qualityFlags,
    stats: {
      ...aggregate.stats,
      highlightedEventCount: highlightIds.length,
    },
    hero: preferredHero,
    sections,
    overflowCount,
  };
};

const hydrateYearAggregateResponse = async (
  year: number,
  aggregateDoc: TimeMachineYearDocument
): Promise<TimeMachineYearResponse> => {
  const referencedIds = Array.from(
    new Set([
      ...(aggregateDoc.heroEventId ? [aggregateDoc.heroEventId] : []),
      ...(aggregateDoc.coverEventId ? [aggregateDoc.coverEventId] : []),
      ...aggregateDoc.highlightEventIds,
      ...aggregateDoc.overflowEventIds,
    ])
  );

  const referencedEvents = referencedIds.length > 0 ? await fetchEventsByIds(referencedIds) : [];

  if (referencedEvents.length > 0) {
    return buildResponseFromEvents(year, referencedEvents, aggregateDoc);
  }

  return {
    year,
    summary: aggregateDoc.summary,
    coverEventId: aggregateDoc.coverEventId,
    coverImageUrl: aggregateDoc.coverImageUrl,
    editorialIntro:
      aggregateDoc.editorialIntro ??
      buildTimeMachineFallbackEditorialIntro({
        year,
        hero: null,
        sections: [],
      }),
    publishState: aggregateDoc.publishState,
    qualityFlags: aggregateDoc.qualityFlags,
    stats: {
      eventCount: aggregateDoc.eventCount,
      populatedMonthCount: aggregateDoc.populatedMonths.length,
      categoryCount: 0,
      highlightedEventCount: aggregateDoc.highlightEventIds.length,
    },
    hero: null,
    sections: [],
    overflowCount: aggregateDoc.overflowEventIds.length,
  };
};

const fetchAggregateDocument = async (year: number) => {
  const aggregateRef = doc(firebaseFirestore, TIME_MACHINE_YEARS_COLLECTION, String(year));
  const snapshot = await getDoc(aggregateRef);
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as TimeMachineYearDocument | undefined;
  return data ?? null;
};

export const fetchTimeMachineYear = async (
  year: number,
  options: { forceRefresh?: boolean } = {}
): Promise<TimeMachineYearResponse> => {
  if (!isValidTimeMachineYear(year)) {
    throw new Error(`Invalid year: ${year}`);
  }

  return fetchWithCache(
    CacheKeys.timeMachine.year(year),
    async () => {
      const aggregateDoc = await fetchAggregateDocument(year);

      if (!aggregateDoc) {
        throw new Error(`Time Machine aggregate is missing for year ${year}`);
      }

      return hydrateYearAggregateResponse(year, aggregateDoc);
    },
    {
      ...CachePresets.static('time-machine'),
      version: 4,
      forceRefresh: options.forceRefresh ?? false,
    }
  );
};

export const saveLastVisitedTimeMachineYear = async (year: number) => {
  if (!isValidTimeMachineYear(year)) {
    return;
  }

  await AsyncStorage.setItem(TIME_MACHINE_LAST_YEAR_STORAGE_KEY, String(year));
};

export const getLastVisitedTimeMachineYear = async () => {
  const raw = await AsyncStorage.getItem(TIME_MACHINE_LAST_YEAR_STORAGE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

  if (!isValidTimeMachineYear(parsed)) {
    return clampTimeMachineYear(new Date().getFullYear());
  }

  return parsed;
};

export type { TimeMachineTimelineEvent, TimeMachineYearDocument, TimeMachineYearResponse };
