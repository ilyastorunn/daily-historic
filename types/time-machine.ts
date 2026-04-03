export const TIME_MACHINE_MIN_YEAR = 1800;
export const TIME_MACHINE_MAX_YEAR = 2026;
export const TIME_MACHINE_HIGHLIGHT_LIMIT = 12;
export const TIME_MACHINE_CONTENT_VERSION = '2026.04.v1';
export const TIME_MACHINE_LAST_YEAR_STORAGE_KEY = '@daily_historic/time-machine/last-year';

export type TimeMachineSummarySource = 'generated' | 'manual';
export type TimeMachinePublishState = 'strong' | 'partial' | 'empty';
export type TimeMachineSourceType = 'wikipedia-year-page' | 'on-this-day-selected';
export type TimeMachineEditorialSource = 'ai' | 'fallback';

export interface TimeMachineEditorialIntro {
  hook: string;
  teaser: string;
  source: TimeMachineEditorialSource;
  generatedAt?: string;
}

export interface TimeMachineMetadata {
  eligible: boolean;
  sourceType: TimeMachineSourceType;
  sourceTypes?: TimeMachineSourceType[];
  sourceKey: string;
  parserVersion: string;
  importanceScore?: number;
  qualityFlags: string[];
  lastAggregatedAt?: string;
  featured?: boolean;
  generatedAt?: string;
}

export interface TimeMachineYearDocument {
  year: number;
  summary: string;
  heroEventId?: string;
  coverEventId?: string;
  coverImageUrl?: string;
  editorialIntro: TimeMachineEditorialIntro;
  eventCount: number;
  populatedMonths: number[];
  highlightEventIds: string[];
  overflowEventIds: string[];
  publishState: TimeMachinePublishState;
  qualityScore: number;
  qualityFlags: string[];
  generatedAt: string;
  contentVersion: string;
  summarySource?: TimeMachineSummarySource;
}

export interface TimeMachineStats {
  eventCount: number;
  populatedMonthCount: number;
  categoryCount: number;
  highlightedEventCount: number;
}

export interface TimeMachineTimelineEvent {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  dateISO: string;
  month: number;
  day: number;
  categories: string[];
  categoryId?: string;
  beforeContext?: string;
  afterContext?: string;
  importanceScore: number;
}

export interface TimeMachineSection {
  month: number;
  label: string;
  events: TimeMachineTimelineEvent[];
  highlightedCount: number;
  overflowCount: number;
}

export interface TimeMachineYearResponse {
  year: number;
  summary: string;
  coverEventId?: string;
  coverImageUrl?: string;
  editorialIntro: TimeMachineEditorialIntro;
  publishState: TimeMachinePublishState;
  qualityFlags: string[];
  stats: TimeMachineStats;
  hero: TimeMachineTimelineEvent | null;
  sections: TimeMachineSection[];
  overflowCount: number;
}

export interface TimeMachineIndexYearEntry {
  year: number;
  publishState: TimeMachinePublishState;
  eventCount: number;
  populatedMonthCount: number;
}

export interface TimeMachineIndexDocument {
  contentVersion: string;
  updatedAt: string;
  years: TimeMachineIndexYearEntry[];
}
