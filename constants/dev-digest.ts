import { EVENT_LIBRARY } from '@/constants/events';
import type { EventCategory, EventRecord, EraSlug } from '@/constants/events';
import type { CategoryOption, EraOption } from '@/contexts/onboarding-context';
import type { DailyDigestDocument, FirestoreEventDocument, FirestoreMediaAsset, FirestoreRelatedPage } from '@/types/events';

const EVENT_CATEGORY_TO_CATEGORY_OPTION: Record<EventCategory, CategoryOption> = {
  science: 'science-discovery',
  culture: 'art-culture',
  politics: 'politics',
  innovation: 'inventions',
  art: 'art-culture',
  'human-rights': 'civil-rights',
};

const ERA_SLUG_TO_ERA_OPTION: Partial<Record<EraSlug, EraOption>> = {
  ancient: 'ancient',
  renaissance: 'early-modern',
  industrial: 'nineteenth',
  modern: 'twentieth',
  contemporary: 'contemporary',
};

const toTwoDigits = (value: number) => value.toString().padStart(2, '0');

const normalizeEventRecord = (event: EventRecord, pageIdSeed: number): FirestoreEventDocument => {
  const primaryImageUri =
    typeof event.image === 'object' && event.image !== null && 'uri' in event.image
      ? (event.image.uri as string)
      : undefined;

  const sharedAsset: FirestoreMediaAsset | undefined = primaryImageUri
    ? {
        id: `${event.id}-media`,
        sourceUrl: primaryImageUri,
        width: 1200,
        height: 900,
        provider: 'wikimedia',
        assetType: 'original',
        altText: event.summary,
      }
    : undefined;

  const relatedPages: FirestoreRelatedPage[] = [
    {
      pageId: pageIdSeed,
      canonicalTitle: event.title,
      displayTitle: event.title,
      normalizedTitle: event.title,
      description: event.summary,
      extract: event.detail,
      desktopUrl: event.sources[0]?.url ?? 'https://en.wikipedia.org/wiki/Main_Page',
      mobileUrl: event.sources[0]?.url ?? 'https://en.wikipedia.org/wiki/Main_Page',
      thumbnails: sharedAsset
        ? [
            {
              ...sharedAsset,
              id: `${sharedAsset.id}-thumb`,
              assetType: 'thumbnail',
              width: 800,
              height: 600,
            },
          ]
        : undefined,
      selectedMedia: sharedAsset ? { ...sharedAsset } : undefined,
    },
  ];

  const categories = Array.from(
    new Set(
      event.categories
        .map((category) => EVENT_CATEGORY_TO_CATEGORY_OPTION[category])
        .filter((value): value is CategoryOption => Boolean(value))
    )
  );

  const era = event.eras
    .map((eraSlug) => ERA_SLUG_TO_ERA_OPTION[eraSlug])
    .find((value): value is EraOption => Boolean(value));

  const [yearStr, monthStr, dayStr] = event.date.split('-');
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  const day = Number.parseInt(dayStr, 10);

  return {
    eventId: `dev-digest:${event.id}`,
    year: Number.isFinite(year) ? year : undefined,
    summary: event.summary,
    text: event.detail,
    categories,
    era,
    date:
      Number.isFinite(month) && Number.isFinite(day)
        ? {
            month,
            day,
          }
        : undefined,
    relatedPages,
    source: {
      provider: 'dev-local',
      title: event.title,
    },
    enrichment: {
      sample: true,
    },
  };
};

const DEV_DIGEST_EVENTS: FirestoreEventDocument[] = EVENT_LIBRARY.map((event, index) =>
  normalizeEventRecord(event, index + 1)
);

const selectDevEventsForDate = (month: number, day: number) => {
  if (DEV_DIGEST_EVENTS.length === 0) {
    return [];
  }

  const normalizedMonth = Number.isFinite(month) ? Math.max(1, Math.min(12, Math.floor(month))) : 1;
  const normalizedDay = Number.isFinite(day) ? Math.max(1, Math.min(31, Math.floor(day))) : 1;
  const seed = normalizedMonth * 100 + normalizedDay;
  const maxEvents = Math.min(5, DEV_DIGEST_EVENTS.length);
  const startIndex = seed % DEV_DIGEST_EVENTS.length;

  const events: FirestoreEventDocument[] = [];
  for (let offset = 0; offset < maxEvents; offset += 1) {
    const index = (startIndex + offset) % DEV_DIGEST_EVENTS.length;
    const event = DEV_DIGEST_EVENTS[index];
    events.push({
      ...event,
      relatedPages: event.relatedPages?.map((page) => ({
        ...page,
        thumbnails: page.thumbnails?.map((asset) => ({ ...asset })),
        selectedMedia: page.selectedMedia ? { ...page.selectedMedia } : undefined,
      })),
    });
  }

  return events;
};

export const buildDevDailyDigest = (
  month: number,
  day: number
): { digest: DailyDigestDocument; events: FirestoreEventDocument[] } | null => {
  const events = selectDevEventsForDate(month, day);
  if (events.length === 0) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const digest: DailyDigestDocument = {
    digestId: `dev-digest:onthisday:selected:${toTwoDigits(month)}-${toTwoDigits(day)}`,
    date: `${new Date().getFullYear()}-${toTwoDigits(month)}-${toTwoDigits(day)}`,
    eventIds: events.map((event) => event.eventId),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  return { digest, events };
};
