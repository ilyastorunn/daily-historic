import type { CategoryOption } from '@/contexts/onboarding-context';
import type { DailyDigestDocument, FirestoreEventDocument, FirestoreMediaAsset, FirestoreRelatedPage } from '@/types/events';

const WIKIMEDIA_ON_THIS_DAY_ENDPOINT =
  'https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected';

type WikimediaContentUrls = {
  desktop?: { page?: string };
  mobile?: { page?: string };
};

type WikimediaMediaAsset = {
  source?: string;
  width?: number;
  height?: number;
};

type WikimediaPage = {
  pageid?: number;
  titles?: {
    canonical?: string;
    normalized?: string;
    display?: string;
  };
  displaytitle?: string;
  title?: string;
  description?: string;
  extract?: string;
  extract_html?: string;
  thumbnail?: WikimediaMediaAsset;
  originalimage?: WikimediaMediaAsset;
  content_urls?: WikimediaContentUrls;
  wikibase_item?: string;
};

type WikimediaEvent = {
  text?: string;
  year?: number;
  type?: string;
  pages?: WikimediaPage[];
};

type OnThisDayResponse = {
  selected?: WikimediaEvent[];
};

type FetchArgs = {
  month: number;
  day: number;
  signal?: AbortSignal;
  userAgent?: string;
};

const toTwoDigits = (value: number) => value.toString().padStart(2, '0');

const normalizeTitle = (page: WikimediaPage, fallback: string) => {
  return (
    page.titles?.display ??
    page.titles?.canonical ??
    page.titles?.normalized ??
    page.displaytitle ??
    page.title ??
    fallback
  );
};

const createMediaAsset = (
  media: WikimediaMediaAsset | undefined,
  id: string,
  assetType: FirestoreMediaAsset['assetType'],
  altText?: string
): FirestoreMediaAsset | undefined => {
  if (!media?.source) {
    return undefined;
  }
  return {
    id,
    sourceUrl: media.source,
    width: media.width,
    height: media.height,
    provider: 'wikimedia',
    license: 'wikimedia',
    altText,
    assetType,
  };
};

const mapPage = (page: WikimediaPage, index: number): FirestoreRelatedPage | null => {
  const pageId = page.pageid ?? index + 1;
  const displayTitle = normalizeTitle(page, `Event Page ${index + 1}`);
  const desktopUrl = page.content_urls?.desktop?.page ?? '';
  const mobileUrl = page.content_urls?.mobile?.page ?? desktopUrl;

  const thumbnail =
    createMediaAsset(page.thumbnail, `${pageId}:thumbnail`, 'thumbnail', page.description) ?? undefined;
  const original =
    createMediaAsset(page.originalimage, `${pageId}:original`, 'original', page.description) ?? undefined;

  return {
    pageId,
    canonicalTitle: page.titles?.canonical ?? displayTitle,
    displayTitle,
    normalizedTitle: page.titles?.normalized ?? displayTitle,
    description: page.description,
    extract: page.extract ?? page.extract_html,
    wikidataId: page.wikibase_item,
    desktopUrl,
    mobileUrl,
    thumbnails: thumbnail ? [thumbnail] : undefined,
    selectedMedia: original ?? thumbnail ?? undefined,
  };
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const cloneFirestoreEvent = (event: FirestoreEventDocument): FirestoreEventDocument => ({
  ...event,
  categories: event.categories ? [...event.categories] : undefined,
  tags: event.tags ? [...event.tags] : undefined,
  relatedPages: event.relatedPages?.map((page) => ({
    ...page,
    thumbnails: page.thumbnails?.map((asset) => ({ ...asset })),
    selectedMedia: page.selectedMedia ? { ...page.selectedMedia } : undefined,
  })),
  source: event.source ? { ...event.source } : undefined,
  enrichment: event.enrichment ? { ...event.enrichment } : undefined,
});

type CategoryRule = {
  id: CategoryOption;
  patterns: RegExp[];
};

const CATEGORY_RULES: CategoryRule[] = [
  {
    id: 'world-wars',
    patterns: [
      /\bworld war\b/i,
      /\bwwi\b/i,
      /\bworld war i\b/i,
      /\bworld war 1\b/i,
      /\bwwii\b/i,
      /\bworld war ii\b/i,
      /\bworld war 2\b/i,
      /\bnazi\b/i,
      /\ballied\b/i,
      /\baxis\b/i,
    ],
  },
  {
    id: 'ancient-civilizations',
    patterns: [
      /\bancient\b/i,
      /\bpharaoh\b/i,
      /\bpyramid\b/i,
      /\bro(man|me)\b/i,
      /\bgreek\b/i,
      /\bmesopotamia\b/i,
      /\bdynasty\b/i,
      /\bbc[e]?\b/i,
    ],
  },
  {
    id: 'science-discovery',
    patterns: [
      /\bscientist\b/i,
      /\bdiscovered?\b/i,
      /\bresearch\b/i,
      /\bphysics\b/i,
      /\bchemistry\b/i,
      /\bbiology\b/i,
      /\bspace\b/i,
      /\bsatellite\b/i,
      /\bobservation\b/i,
      /\bexperiment\b/i,
    ],
  },
  {
    id: 'art-culture',
    patterns: [
      /\bart(ist|s)?\b/i,
      /\bpainting\b/i,
      /\bmuseum\b/i,
      /\bnovel\b/i,
      /\bliterature\b/i,
      /\bpoet(ic)?\b/i,
      /\bmusic(al)?\b/i,
      /\btheatre\b/i,
      /\bfilm\b/i,
      /\bcultural\b/i,
      /\bcomposer\b/i,
      /\bsymphony\b/i,
    ],
  },
  {
    id: 'politics',
    patterns: [
      /\bpresident\b/i,
      /\bprime minister\b/i,
      /\bparliament\b/i,
      /\bsenate\b/i,
      /\btreaty\b/i,
      /\bpolitic(al|s)\b/i,
      /\belection\b/i,
      /\bconstitution\b/i,
      /\bgovt\b/i,
      /\bgovernment\b/i,
      /\bmonarch\b/i,
      /\bking\b/i,
      /\bqueen\b/i,
      /\bdeclaration\b/i,
    ],
  },
  {
    id: 'inventions',
    patterns: [
      /\binvent(ed|ion)\b/i,
      /\bpatent\b/i,
      /\btechnology\b/i,
      /\bengine\b/i,
      /\bdevice\b/i,
      /\bprototype\b/i,
      /\binnovation\b/i,
      /\btelegraph\b/i,
      /\btelephone\b/i,
    ],
  },
  {
    id: 'natural-disasters',
    patterns: [
      /\bearthquake\b/i,
      /\bhurricane\b/i,
      /\bcyclone\b/i,
      /\btyphoon\b/i,
      /\bvolcan(ic|o)\b/i,
      /\btsunami\b/i,
      /\bflood\b/i,
      /\bdisaster\b/i,
      /\blerupt(ion)?\b/i,
      /\bwildfire\b/i,
    ],
  },
  {
    id: 'civil-rights',
    patterns: [
      /\bcivil rights\b/i,
      /\bsuffrage\b/i,
      /\babolition\b/i,
      /\bhuman rights\b/i,
      /\bsegregation\b/i,
      /\bprotest\b/i,
      /\bactivist\b/i,
      /\bmovement\b/i,
      /\bfreedom\b/i,
      /\bequality\b/i,
    ],
  },
  {
    id: 'exploration',
    patterns: [
      /\bexpedition\b/i,
      /\bexplor(e|ation)\b/i,
      /\bvoyage\b/i,
      /\bnavigation\b/i,
      /\bantarctic\b/i,
      /\barctic\b/i,
      /\bpolar\b/i,
      /\bspacewalk\b/i,
      /\blocated\b/i,
      /\bdiscovered\b/i,
    ],
  },
];

const inferCategories = (
  event: WikimediaEvent,
  relatedPages: FirestoreRelatedPage[]
): CategoryOption[] => {
  const buffer: string[] = [];

  if (event.text) {
    buffer.push(event.text);
  }

  for (const page of relatedPages) {
    if (page.description) buffer.push(page.description);
    if (page.extract) buffer.push(page.extract);
  }

  const combined = buffer.join(' ').toLowerCase();
  const matches = new Set<CategoryOption>();

  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(combined))) {
      matches.add(rule.id);
    }
  }

  if (
    event.year &&
    ((event.year >= 1914 && event.year <= 1918) || (event.year >= 1939 && event.year <= 1945))
  ) {
    matches.add('world-wars');
  }

  if (matches.size === 0) {
    matches.add('surprise');
  }

  return Array.from(matches);
};

const buildEventId = (event: WikimediaEvent, month: number, day: number, index: number) => {
  const baseText = event.text ?? `event-${index}`;
  const slug = slugify(baseText);
  return `wikimedia:${toTwoDigits(month)}-${toTwoDigits(day)}:${slug || index}`;
};

const WIKIMEDIA_EVENT_ID_PATTERN = /^wikimedia:(\d{2})-(\d{2}):.+$/;

export const fetchWikimediaDailyDigest = async ({
  month,
  day,
  signal,
  userAgent,
}: FetchArgs): Promise<{ digest: DailyDigestDocument | null; events: FirestoreEventDocument[] }> => {
  const resolvedMonth = Math.max(1, Math.min(12, Math.floor(month)));
  const resolvedDay = Math.max(1, Math.min(31, Math.floor(day)));
  const endpoint = `${WIKIMEDIA_ON_THIS_DAY_ENDPOINT}/${toTwoDigits(resolvedMonth)}/${toTwoDigits(resolvedDay)}`;
  const resolvedUserAgent =
    userAgent ?? process.env.EXPO_PUBLIC_WIKIMEDIA_USER_AGENT ?? 'DailyHistoricApp/0.1 (contact@dailyhistoric.app)';

  const response = await fetch(endpoint, {
    signal,
    headers: {
      Accept: 'application/json',
      'User-Agent': resolvedUserAgent,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch Wikimedia daily digest: ${response.status} ${response.statusText} -> ${text}`);
  }

  const payload = (await response.json()) as OnThisDayResponse;
  const events = payload.selected ?? [];
  const capturedAt = new Date().toISOString();

  const mappedEvents = events.map<FirestoreEventDocument | null>((event, index) => {
    const relatedPages = (event.pages ?? [])
      .map((page, pageIndex) => mapPage(page, pageIndex))
      .filter((page): page is FirestoreRelatedPage => page !== null);

    const eventId = buildEventId(event, resolvedMonth, resolvedDay, index);
    const categories = inferCategories(event, relatedPages);

    return {
      eventId,
      year: event.year,
      summary: event.text ?? '',
      text: event.text ?? '',
      categories,
      tags: [],
      date: {
        month: resolvedMonth,
        day: resolvedDay,
      },
      relatedPages,
      source: {
        provider: 'wikimedia',
        feed: 'onthisday',
        rawType: event.type ?? 'selected',
        capturedAt,
      },
      enrichment: {
        wikimediaPageCount: relatedPages.length,
      },
    };
  });

  const filteredEvents = mappedEvents.filter(
    (event): event is FirestoreEventDocument => event !== null
  );

  if (filteredEvents.length === 0) {
    return { digest: null, events: [] };
  }

  const digest: DailyDigestDocument = {
    digestId: `wikimedia:onthisday:selected:${toTwoDigits(resolvedMonth)}-${toTwoDigits(resolvedDay)}`,
    date: `${new Date().getFullYear()}-${toTwoDigits(resolvedMonth)}-${toTwoDigits(resolvedDay)}`,
    eventIds: filteredEvents.map((event) => event.eventId),
    createdAt: capturedAt,
    updatedAt: capturedAt,
  };

  return { digest, events: filteredEvents };
};

export const isWikimediaEventId = (eventId: string | null | undefined) =>
  typeof eventId === 'string' && WIKIMEDIA_EVENT_ID_PATTERN.test(eventId);

export const resolveWikimediaEventById = async (
  eventId: string,
  options: { signal?: AbortSignal; userAgent?: string } = {}
): Promise<FirestoreEventDocument | null> => {
  const match = eventId.match(WIKIMEDIA_EVENT_ID_PATTERN);
  if (!match) {
    return null;
  }

  const month = Number.parseInt(match[1], 10);
  const day = Number.parseInt(match[2], 10);
  if (!Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const result = await fetchWikimediaDailyDigest({ month, day, ...options });
  const target = result.events.find((event) => event.eventId === eventId);
  return target ? cloneFirestoreEvent(target) : null;
};
