export interface SearchRecordPage {
  displayTitle?: string;
  canonicalTitle?: string;
  normalizedTitle?: string;
  description?: string;
  extract?: string;
  selectedMedia?: {
    sourceUrl?: string | null;
  } | null;
  thumbnails?: {
    sourceUrl?: string | null;
  }[] | null;
}

export interface SearchRecordEvent {
  eventId: string;
  year?: number;
  text?: string;
  summary?: string;
  categories?: string[];
  era?: string;
  tags?: string[];
  date?: {
    month: number;
    day: number;
  };
  relatedPages?: SearchRecordPage[];
  updatedAt?: unknown;
}

export interface AlgoliaSearchRecord {
  objectID: string;
  eventId: string;
  title: string;
  summary: string;
  searchableText: string;
  tags: string[];
  categories: string[];
  era?: string;
  year?: number;
  month?: number;
  day?: number;
  imageUrl?: string;
  location?: string;
  updatedAt?: string;
  editorialBoost: number;
  popularityScore: number;
}

const MAX_TITLE_CHARS = 180;
const MAX_SUMMARY_CHARS = 320;
const MAX_SEARCHABLE_TEXT_CHARS = 2200;
const MAX_LOCATION_CHARS = 120;
const MAX_TAG_CHARS = 48;
const MAX_TAGS = 20;

const stripHtml = (value?: string | null) => {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const truncate = (value: string, maxChars: number) => {
  if (value.length <= maxChars) {
    return value;
  }

  if (maxChars <= 1) {
    return value.slice(0, maxChars);
  }

  return `${value.slice(0, maxChars - 1).trimEnd()}…`;
};

const resolvePrimaryPage = (event: SearchRecordEvent) => {
  const pages = Array.isArray(event.relatedPages) ? event.relatedPages : [];

  return (
    pages.find(
      (page) =>
        page.selectedMedia?.sourceUrl ||
        page.thumbnails?.some((asset) => typeof asset.sourceUrl === "string" && asset.sourceUrl.length > 0)
    ) ?? pages[0]
  );
};

const resolveImageUrl = (page?: SearchRecordPage) => {
  if (!page) {
    return undefined;
  }

  if (page.selectedMedia?.sourceUrl) {
    return page.selectedMedia.sourceUrl ?? undefined;
  }

  return page.thumbnails?.find((asset) => asset.sourceUrl)?.sourceUrl ?? undefined;
};

const coerceTimestamp = (value: unknown) => {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    const withToDate = value as { toDate?: () => Date };
    if (typeof withToDate.toDate === "function") {
      return withToDate.toDate().toISOString();
    }

    const withSeconds = value as { seconds?: number };
    if (typeof withSeconds.seconds === "number") {
      return new Date(withSeconds.seconds * 1000).toISOString();
    }
  }

  return undefined;
};

const buildSearchableText = (event: SearchRecordEvent) => {
  const buffer: string[] = [];
  const pages = Array.isArray(event.relatedPages) ? event.relatedPages : [];

  if (event.text) buffer.push(stripHtml(event.text));
  if (event.summary) buffer.push(stripHtml(event.summary));
  if (Array.isArray(event.tags)) {
    buffer.push(...event.tags.map((tag) => stripHtml(tag)));
  }

  for (const page of pages) {
    if (page.displayTitle) buffer.push(stripHtml(page.displayTitle));
    if (page.canonicalTitle) buffer.push(stripHtml(page.canonicalTitle));
    if (page.normalizedTitle) buffer.push(stripHtml(page.normalizedTitle));
    if (page.description) buffer.push(stripHtml(page.description));
    if (page.extract) buffer.push(stripHtml(page.extract));
  }

  return truncate(buffer.filter(Boolean).join(" ").trim(), MAX_SEARCHABLE_TEXT_CHARS);
};

export const toAlgoliaSearchRecord = (event: SearchRecordEvent): AlgoliaSearchRecord | null => {
  if (!event.eventId) {
    return null;
  }

  const primaryPage = resolvePrimaryPage(event);
  const title =
    stripHtml(primaryPage?.displayTitle) ||
    stripHtml(primaryPage?.canonicalTitle) ||
    stripHtml(event.summary) ||
    stripHtml(event.text) ||
    "Historic spotlight";
  const summary =
    stripHtml(event.summary) ||
    stripHtml(event.text) ||
    stripHtml(primaryPage?.extract) ||
    "Tap to open the full story.";

  const normalizedTags = Array.isArray(event.tags)
    ? event.tags
        .map((tag) => truncate(stripHtml(tag), MAX_TAG_CHARS))
        .filter(Boolean)
        .slice(0, MAX_TAGS)
    : [];

  return {
    objectID: event.eventId,
    eventId: event.eventId,
    title: truncate(title, MAX_TITLE_CHARS),
    summary: truncate(summary, MAX_SUMMARY_CHARS),
    searchableText: buildSearchableText(event),
    tags: normalizedTags,
    categories: Array.isArray(event.categories) ? event.categories : [],
    era: event.era,
    year: event.year,
    month: event.date?.month,
    day: event.date?.day,
    imageUrl: resolveImageUrl(primaryPage),
    location: truncate(stripHtml(primaryPage?.description) || "", MAX_LOCATION_CHARS) || undefined,
    updatedAt: coerceTimestamp(event.updatedAt),
    editorialBoost: 0,
    popularityScore: 0,
  };
};
