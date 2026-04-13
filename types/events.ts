import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { TimeMachineMetadata } from '@/types/time-machine';

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
  canonicalKey?: string;
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
  timeMachine?: TimeMachineMetadata;
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

export interface MonthlyCollectionIAEMeta {
  eventName: string;
  shortPromo: string;
  longPromo: string;
  ctaLabel: string;
}

export interface MonthlyCollectionDocument {
  id: string;
  monthKey: string;
  title: string;
  subtitle: string;
  summary: string;
  heroBlurb: string;
  coverUrl: string;
  imageUrl?: string;
  featuredEventIds: string[];
  eventIds: string[];
  iaeMeta: MonthlyCollectionIAEMeta;
}
