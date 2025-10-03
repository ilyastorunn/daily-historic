import { classifyEvent } from './classification';
import { ensureMediaForEvent } from './media';
import { fetchWikidataEntities, type WikidataClientOptions } from './wikidata-client';
import type {
  EventEnrichment,
  HistoricalEventRecord,
  ParticipantSummary,
  RelatedPageSummary,
  WikidataEntitySummary,
} from './types';

export interface EventEnrichmentOptions extends WikidataClientOptions {
  enableEnrichment?: boolean;
  mediaUserAgent: string;
  mediaMinWidth?: number;
  mediaMinHeight?: number;
  mediaLimit?: number;
}

const collectPageEntityIds = (pages: RelatedPageSummary[]): string[] => {
  const ids = new Set<string>();
  for (const page of pages) {
    if (page.wikidataId) {
      ids.add(page.wikidataId);
    }
  }
  return Array.from(ids);
};

const toParticipantSummary = (
  entity: WikidataEntitySummary | undefined
): ParticipantSummary | undefined => {
  if (!entity) {
    return undefined;
  }

  return {
    wikidataId: entity.id,
    label: entity.label,
    description: entity.description,
  };
};

const buildEventEnrichment = (
  primaryEntityId: string | undefined,
  primaryEntity: WikidataEntitySummary | undefined,
  participantEntities: Record<string, WikidataEntitySummary>
): EventEnrichment | undefined => {
  if (!primaryEntityId || !primaryEntity) {
    return undefined;
  }

  const participants: ParticipantSummary[] = [];

  for (const participantId of primaryEntity.participantIds) {
    const entity = participantEntities[participantId];
    const summary = toParticipantSummary(entity);
    if (summary) {
      participants.push(summary);
    }
  }

  const supportingEntityIds = new Set<string>([
    ...primaryEntity.instanceOfIds,
    ...primaryEntity.subclassOfIds,
    ...primaryEntity.genreIds,
  ]);

  return {
    primaryEntityId,
    exactDate: primaryEntity.pointInTime,
    participantIds: primaryEntity.participantIds,
    participants,
    supportingEntityIds: Array.from(supportingEntityIds),
  };
};

export const enrichEvents = async (
  events: HistoricalEventRecord[],
  options: EventEnrichmentOptions
): Promise<HistoricalEventRecord[]> => {
  const {
    enableEnrichment = true,
    mediaUserAgent,
    mediaMinWidth = 800,
    mediaMinHeight = 600,
    mediaLimit = 5,
    ...wikidataOptions
  } = options;

  if (!enableEnrichment || events.length === 0) {
    return events;
  }

  const pageEntityIds = new Set<string>();
  for (const event of events) {
    collectPageEntityIds(event.relatedPages).forEach((id) => pageEntityIds.add(id));
  }

  const entityMap = await fetchWikidataEntities(Array.from(pageEntityIds), wikidataOptions);

  const participantIds = new Set<string>();
  for (const entity of Object.values(entityMap)) {
    for (const participantId of entity.participantIds) {
      participantIds.add(participantId);
    }
  }

  const participantMap = await fetchWikidataEntities(Array.from(participantIds), wikidataOptions);

  return Promise.all(
    events.map(async (event) => {
      const primaryEntityId = event.relatedPages.find((page) => page.wikidataId)?.wikidataId;
      const primaryEntity = primaryEntityId ? entityMap[primaryEntityId] : undefined;

      const enrichment = buildEventEnrichment(primaryEntityId, primaryEntity, participantMap);

      const relatedEntitySummaries: WikidataEntitySummary[] = [];
      for (const page of event.relatedPages) {
        if (page.wikidataId && entityMap[page.wikidataId]) {
          relatedEntitySummaries.push(entityMap[page.wikidataId]);
        }
      }

      const classification = classifyEvent({
        event,
        primaryEntity,
        relatedEntities: relatedEntitySummaries,
      });

      const selectedMedia = await ensureMediaForEvent(event.relatedPages, {
        userAgent: mediaUserAgent,
        minWidth: mediaMinWidth,
        minHeight: mediaMinHeight,
        limit: mediaLimit,
      });

      const relatedPages = event.relatedPages.map((page) => ({
        ...page,
        selectedMedia: page.selectedMedia ?? selectedMedia,
      }));

      return {
        ...event,
        categories: classification.categories,
        era: classification.era ?? event.era,
        tags: classification.tags,
        enrichment: enrichment ?? event.enrichment,
        relatedPages,
      };
    })
  );
};
