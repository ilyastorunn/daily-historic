/**
 * Shared types for Firebase Functions
 */

export type CategoryOption =
  | "ancient-civilizations"
  | "art-literature"
  | "conflict-wars"
  | "culture-society"
  | "exploration"
  | "inventions"
  | "leaders-figures"
  | "movements"
  | "religion"
  | "science-discovery";

export type EraOption =
  | "ancient"
  | "medieval"
  | "renaissance"
  | "enlightenment"
  | "nineteenth"
  | "twentieth"
  | "twentyfirst";

export interface FirestoreEventDocument {
  eventId: string;
  year: number;
  text: string;
  summary?: string;
  categories?: CategoryOption[];
  era?: EraOption;
  tags?: string[];
  date?: {
    day: number;
    month: number;
  };
  relatedPages?: Array<{
    title: string;
    thumbnails?: Array<{
      sourceUrl: string;
      width: number;
      height: number;
    }>;
  }>;
  enrichment?: {
    participants?: string[];
    locations?: string[];
  };
  createdAt?: any;
  updatedAt?: any;
}

export interface SearchRequest {
  q?: string;
  categories?: string; // Comma-separated
  era?: EraOption;
  cursor?: string;
  limit?: number;
}

export interface SearchResponse {
  items: FirestoreEventDocument[];
  nextCursor?: string;
  total?: number;
}
