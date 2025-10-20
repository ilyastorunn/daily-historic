import { formatCategoryLabel, formatEraLabel } from '@/constants/personalization';
import type { FirestoreEventDocument, FirestoreRelatedPage } from '@/types/events';

const stripHtmlTags = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  const withoutTags = value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return withoutTags.length > 0 ? withoutTags : undefined;
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
