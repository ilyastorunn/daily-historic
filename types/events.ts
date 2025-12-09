import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type FirestoreTimestamp = FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue | string;

export interface FirestoreMediaAsset {
  id: string;
  sourceUrl: string;
  width?: number;
  height?: number;
  provider?: string;
  attribution?: string;
  license?: string;
  altText?: string;
  assetType?: string;
}

export interface FirestoreRelatedPage {
  pageId: number;
  canonicalTitle: string;
  displayTitle?: string;
  normalizedTitle?: string;
  description?: string;
  extract?: string;
  wikidataId?: string;
  desktopUrl: string;
  mobileUrl: string;
  thumbnails?: FirestoreMediaAsset[];
  selectedMedia?: FirestoreMediaAsset | null;
}

export interface FirestoreEventDate {
  month: number;
  day: number;
}

export interface FirestoreEventDocument {
  eventId: string;
  year?: number;
  text?: string;
  summary?: string;
  categories?: string[];
  era?: string;
  tags?: string[];
  date?: FirestoreEventDate;
  dateISO?: string;
  relatedPages?: FirestoreRelatedPage[];
  source?: Record<string, unknown>;
  enrichment?: Record<string, unknown>;
  beforeContext?: string;
  afterContext?: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

export interface DailyDigestDocument {
  digestId?: string;
  date?: string;
  eventIds?: string[];
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}
