import type { FirestoreCollections } from './ingest/types';

export const DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX = 'tm_staging';

export interface TimeMachineCollectionTargets {
  events: string;
  timeMachineYears: string;
  contentMeta: string;
  indexDocumentId: string;
}

export const normalizeCollectionSuffix = (suffix?: string | null) => {
  const trimmed = suffix?.trim() ?? '';
  return trimmed.replace(/^_+/, '');
};

export const resolveTimeMachineTargets = (
  collections: Pick<FirestoreCollections, 'events' | 'timeMachineYears' | 'contentMeta'>,
  suffix?: string | null
): TimeMachineCollectionTargets => {
  const normalizedSuffix = normalizeCollectionSuffix(suffix);
  const collectionSuffix = normalizedSuffix ? `_${normalizedSuffix}` : '';
  const indexDocumentId = normalizedSuffix ? `timeMachineIndex_${normalizedSuffix}` : 'timeMachineIndex';

  return {
    events: `${collections.events}${collectionSuffix}`,
    timeMachineYears: `${collections.timeMachineYears}${collectionSuffix}`,
    contentMeta: collections.contentMeta,
    indexDocumentId,
  };
};
