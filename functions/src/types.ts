/**
 * Shared types for Firebase Functions
 */

import type { CategoryOption, EraOption } from "../../shared/taxonomy";

export type { CategoryOption, EraOption };

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

export type SortOption = "relevance" | "recent";

export interface SearchRequest {
  q?: string;
  categories?: string; // Comma-separated
  era?: EraOption;
  month?: number; // 1-12
  day?: number; // 1-31
  sort?: SortOption;
  cursor?: string;
  limit?: number;
}

export interface SearchResponse {
  items: FirestoreEventDocument[];
  nextCursor?: string;
  total?: number;
}
