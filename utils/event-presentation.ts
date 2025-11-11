import { formatCategoryLabel, formatEraLabel } from '@/constants/personalization';
import type { FirestoreEventDocument, FirestoreRelatedPage } from '@/types/events';

const decodeHtmlEntities = (text: string): string => {
  // Common HTML entities map
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&#x27;': "'",
    '&nbsp;': ' ',
    '&mdash;': '\u2014',
    '&ndash;': '\u2013',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
  };

  return text
    .replace(/&[a-zA-Z]+;|&#\d+;|&#x[0-9a-fA-F]+;/g, (entity) => {
      // Check if it's in our common entities map
      if (entities[entity]) {
        return entities[entity];
      }

      // Decode numeric entities (&#039; or &#39;)
      if (entity.startsWith('&#x')) {
        const code = parseInt(entity.slice(3, -1), 16);
        return String.fromCharCode(code);
      }
      if (entity.startsWith('&#')) {
        const code = parseInt(entity.slice(2, -1), 10);
        return String.fromCharCode(code);
      }

      // Return as-is if we can't decode
      return entity;
    });
};

const stripHtmlTags = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  const withoutTags = value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const decoded = decodeHtmlEntities(withoutTags);
  return decoded.length > 0 ? decoded : undefined;
};

export const selectPrimaryPage = (event: FirestoreEventDocument): FirestoreRelatedPage | undefined => {
  const pages = event.relatedPages ?? [];
  if (pages.length === 0) {
    return undefined;
  }
  return pages.find((page) => page.selectedMedia?.sourceUrl) ?? pages[0];
};

export const getEventImageUri = (event: FirestoreEventDocument) => {
  const primaryPage = selectPrimaryPage(event);
  if (!primaryPage) {
    return undefined;
  }
  if (primaryPage.selectedMedia?.sourceUrl) {
    return primaryPage.selectedMedia.sourceUrl;
  }
  const thumbnail = primaryPage.thumbnails?.find((asset) => asset.sourceUrl);
  return thumbnail?.sourceUrl;
};

export const getEventTitle = (event: FirestoreEventDocument) => {
  const primaryPage = selectPrimaryPage(event);
  return (
    stripHtmlTags(primaryPage?.displayTitle) ??
    stripHtmlTags(primaryPage?.canonicalTitle) ??
    stripHtmlTags(event.summary) ??
    stripHtmlTags(event.text) ??
    'Historic spotlight'
  );
};

export const getEventSummary = (event: FirestoreEventDocument) => {
  const primaryPage = selectPrimaryPage(event);
  return event.summary ?? event.text ?? primaryPage?.extract ?? 'Tap to open the full story.';
};

export const getEventLocation = (event: FirestoreEventDocument) => {
  const primaryPage = selectPrimaryPage(event);
  return primaryPage?.description ?? '';
};

export const getEventMeta = (event: FirestoreEventDocument) => {
  const parts: string[] = [];
  if (event.era) {
    parts.push(formatEraLabel(event.era));
  }
  const categories = event.categories ?? [];
  if (categories.length > 0) {
    parts.push(categories.map((category) => formatCategoryLabel(category)).join(', '));
  }
  return parts.join(' • ');
};

export const getEventYearLabel = (event: FirestoreEventDocument, fallback = 'Today') => {
  if (typeof event.year === 'number') {
    return String(event.year);
  }
  if (event.date) {
    const month = event.date.month.toString().padStart(2, '0');
    const day = event.date.day.toString().padStart(2, '0');
    return `${month}-${day}`;
  }
  return fallback;
};

export const buildEventSearchText = (event: FirestoreEventDocument) => {
  const buffer: string[] = [];
  if (event.summary) buffer.push(event.summary);
  if (event.text) buffer.push(event.text);
  const primaryPage = selectPrimaryPage(event);
  if (primaryPage?.displayTitle) buffer.push(primaryPage.displayTitle);
  if (primaryPage?.description) buffer.push(primaryPage.description);
  if (primaryPage?.extract) buffer.push(primaryPage.extract);
  for (const page of event.relatedPages ?? []) {
    if (page.displayTitle) buffer.push(page.displayTitle);
    if (page.description) buffer.push(page.description);
  }
  return buffer.join(' ').toLowerCase();
};

export interface EventSourceLink {
  label: string;
  url: string;
}

export const buildEventSourceLinks = (event: FirestoreEventDocument): EventSourceLink[] => {
  const pages = event.relatedPages ?? [];
  return pages
    .map((page) => {
      const rawLabel =
        page.displayTitle ?? page.canonicalTitle ?? page.normalizedTitle ?? page.desktopUrl ?? '';
      const label = stripHtmlTags(rawLabel) ?? rawLabel;
      const url = page.desktopUrl ?? page.mobileUrl ?? '';
      if (!label || !url) {
        return null;
      }
      return { label, url };
    })
    .filter((link): link is EventSourceLink => link !== null);
};
