import type { FirestoreRelatedPage } from '@/types/events';

const EVENT_TITLE_KEYWORDS = [
  'war',
  'battle',
  'election',
  'crash',
  'spill',
  'affair',
  'revolution',
  'treaty',
  'attack',
  'raid',
  'coup',
  'incident',
  'disaster',
  'massacre',
  'protest',
  'riot',
  'mission',
  'siege',
  'landing',
  'shooting',
  'earthquake',
  'hurricane',
  'storm',
  'embassy',
  'eclipse',
  'summit',
  'referendum',
];

const GENERIC_DESCRIPTION_KEYWORDS = [
  'country',
  'city',
  'capital',
  'human settlement',
  'municipality',
  'state',
  'province',
  'continent',
  'sovereign',
  'island',
  'village',
];

const stripTitle = (value?: string | null) => {
  return value?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() ?? '';
};

export const isDateLikePageTitle = (value?: string | null) => {
  const normalized = stripTitle(value);
  return /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}$/i.test(
    normalized
  );
};

const buildHeadlineFromSummary = (summary?: string | null) => {
  const normalized = stripTitle(summary);
  if (!normalized) {
    return undefined;
  }

  const firstClause = normalized.split(/[.;]/, 1)[0]?.trim() ?? normalized;
  if (firstClause.length < 18) {
    return undefined;
  }

  return firstClause.slice(0, 96).trim();
};

const scorePage = (page: FirestoreRelatedPage, summary?: string | null) => {
  const title = stripTitle(page.displayTitle ?? page.canonicalTitle);
  const description = stripTitle(page.description);
  const normalizedTitle = title.toLowerCase();
  const normalizedSummary = stripTitle(summary).toLowerCase();

  if (!title) {
    return -100;
  }
  if (isDateLikePageTitle(title)) {
    return -100;
  }

  let score = 0;

  if (page.selectedMedia?.sourceUrl) {
    score += 10;
  }

  if (title.split(/\s+/).length > 1) {
    score += 4;
  }

  if (EVENT_TITLE_KEYWORDS.some((keyword) => normalizedTitle.includes(keyword))) {
    score += 18;
  }

  if (description && !GENERIC_DESCRIPTION_KEYWORDS.some((keyword) => description.toLowerCase().includes(keyword))) {
    score += 6;
  }

  if (normalizedSummary && normalizedTitle && normalizedSummary.includes(normalizedTitle)) {
    score += Math.min(16, normalizedTitle.length / 2);
  }

  if (GENERIC_DESCRIPTION_KEYWORDS.some((keyword) => description.toLowerCase().includes(keyword))) {
    score -= 10;
  }

  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}$/.test(title)) {
    score -= 2;
  }

  return score;
};

export const selectPreferredRelatedPage = (
  pages: FirestoreRelatedPage[] | undefined,
  summary?: string | null
) => {
  if (!Array.isArray(pages) || pages.length === 0) {
    return undefined;
  }

  return [...pages].sort((left, right) => scorePage(right, summary) - scorePage(left, summary))[0];
};

export const getPreferredEventTitle = (
  pages: FirestoreRelatedPage[] | undefined,
  summary?: string | null
) => {
  const preferredPage = selectPreferredRelatedPage(pages, summary);
  const pageTitle = stripTitle(preferredPage?.displayTitle ?? preferredPage?.canonicalTitle);

  if (preferredPage && pageTitle && scorePage(preferredPage, summary) >= 8) {
    return pageTitle;
  }

  return buildHeadlineFromSummary(summary) ?? pageTitle ?? 'Historic spotlight';
};
