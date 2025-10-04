export interface RawOnThisDayResponse {
  events?: RawOnThisDayEvent[];
  births?: RawOnThisDayEvent[];
  deaths?: RawOnThisDayEvent[];
  holidays?: RawOnThisDayEvent[];
  selected?: RawOnThisDayEvent[];
}

export interface RawOnThisDayEvent {
  text: string;
  pages: RawOnThisDayPage[];
  year?: number;
  type?: string;
}

export interface RawOnThisDayPage {
  type: string;
  title: string;
  displaytitle: string;
  pageid: number;
  namespace: {
    id: number;
    text: string;
  };
  wikibase_item?: string;
  titles: {
    canonical: string;
    normalized: string;
    display: string;
  };
  content_urls: {
    desktop: {
      page: string;
      revisions: string;
      edit: string;
      talk: string;
    };
    mobile: {
      page: string;
      revisions: string;
      edit: string;
      talk: string;
    };
  };
  description?: string;
  extract?: string;
  extract_html?: string;
  thumbnail?: RawMediaAsset;
  originalimage?: RawMediaAsset;
}

export interface RawMediaAsset {
  source: string;
  width: number;
  height: number;
}

export interface MediaAssetSummary {
  id: string;
  sourceUrl: string;
  width: number;
  height: number;
  provider: 'wikimedia' | 'custom';
  attribution?: string;
  license?: string;
  altText?: string;
  assetType: 'thumbnail' | 'original';
}

export interface RelatedPageSummary {
  pageId: number;
  canonicalTitle: string;
  displayTitle: string;
  normalizedTitle: string;
  description?: string;
  extract?: string;
  wikidataId?: string;
  desktopUrl: string;
  mobileUrl: string;
  thumbnails: MediaAssetSummary[];
  selectedMedia?: MediaAssetSummary;
}

export interface EventSourceRef {
  provider: 'wikimedia';
  feed: 'onthisday';
  rawType: string;
  capturedAt: string;
  sourceDate: string;
  payloadCacheKey: string;
}

export interface ParticipantSummary {
  wikidataId: string;
  label: string;
  description?: string;
}

export interface EventEnrichment {
  primaryEntityId?: string;
  exactDate?: string;
  participantIds: string[];
  participants: ParticipantSummary[];
  supportingEntityIds: string[];
}

export interface HistoricalEventRecord {
  eventId: string;
  year?: number;
  text: string;
  summary: string;
  categories: string[];
  era?: string;
  tags: string[];
  date: {
    month: number;
    day: number;
  };
  relatedPages: RelatedPageSummary[];
  source: EventSourceRef;
  createdAt: string;
  updatedAt: string;
  enrichment?: EventEnrichment;
}

export interface CachedPayload {
  key: string;
  fetchedAt: string;
  month: number;
  day: number;
  payload: RawOnThisDayResponse;
}

export interface FirestoreCollections {
  events: string;
  payloadCache: string;
  digests: string;
}

export interface IngestionConfig {
  userAgent: string;
  firestoreProjectId: string;
  collections: FirestoreCollections;
}

export interface DailyDigestRecord {
  digestId: string;
  date: string;
  eventIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WikidataEntitySummary {
  id: string;
  label: string;
  description?: string;
  instanceOfIds: string[];
  subclassOfIds: string[];
  genreIds: string[];
  participantIds: string[];
  pointInTime?: string;
}
