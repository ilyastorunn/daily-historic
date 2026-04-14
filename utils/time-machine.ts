import {
  TIME_MACHINE_CONTENT_VERSION,
  TIME_MACHINE_HIGHLIGHT_LIMIT,
  TIME_MACHINE_MAX_YEAR,
  TIME_MACHINE_MIN_YEAR,
  type TimeMachineEditorialIntro,
  type TimeMachineIndexYearEntry,
  type TimeMachinePublishState,
  type TimeMachineSection,
  type TimeMachineStats,
  type TimeMachineSummarySource,
  type TimeMachineTimelineEvent,
  type TimeMachineYearDocument,
} from '../types/time-machine';

export {
  TIME_MACHINE_CONTENT_VERSION,
  TIME_MACHINE_HIGHLIGHT_LIMIT,
  TIME_MACHINE_LAST_YEAR_STORAGE_KEY,
  TIME_MACHINE_MAX_YEAR,
  TIME_MACHINE_MIN_YEAR,
} from '../types/time-machine';

export type TimeMachineAggregateInputEvent = {
  eventId: string;
  year?: number;
  title: string;
  summary: string;
  categories?: string[];
  date?: {
    month?: number;
    day?: number;
  };
  dateISO?: string;
  imageUrl?: string;
  beforeContext?: string;
  afterContext?: string;
  pageCount?: number;
  existingImportanceScore?: number;
};

type BuildYearAggregateResult = {
  document: TimeMachineYearDocument;
  stats: TimeMachineStats;
  events: TimeMachineTimelineEvent[];
  hero: TimeMachineTimelineEvent | null;
  cover: TimeMachineTimelineEvent | null;
};

const MONTH_LABELS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const CRITICAL_YEAR_FLAGS = new Set([
  'chronology-error',
  'duplicate-reference',
  'invalid-reference',
  'missing-hero',
]);

const EDITORIAL_CATEGORY_PHRASES: Record<string, string> = {
  politics: 'power',
  'world-wars': 'conflict',
  'natural-disasters': 'shock',
  'art-culture': 'new cultural energy',
  'science-discovery': 'discovery',
  'civil-rights': 'public pressure',
  exploration: 'daring ambition',
  inventions: 'invention',
  surprise: 'unexpected turns',
};

type TimeMachineYearQuality = {
  publishState: TimeMachinePublishState;
  qualityScore: number;
  qualityFlags: string[];
};

const formatEditorialList = (items: string[]) => {
  if (items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

const buildEditorialCategoryWeights = (
  hero: TimeMachineTimelineEvent | null,
  sections: TimeMachineSection[]
) => {
  const weights = new Map<string, number>();

  for (const category of hero?.categories ?? []) {
    weights.set(category, (weights.get(category) ?? 0) + 6);
  }

  for (const section of sections) {
    for (const event of section.events) {
      const categories = event.categories.slice(0, 2);
      for (const category of categories) {
        weights.set(category, (weights.get(category) ?? 0) + 1);
      }
    }
  }

  const weightedCategories = Array.from(weights.entries())
    .filter(([category]) => Boolean(EDITORIAL_CATEGORY_PHRASES[category]))
    .sort((left, right) => right[1] - left[1]);

  const filteredCategories = weightedCategories
    .filter(([category]) => category !== 'surprise' || weightedCategories.length === 1)
    .slice(0, 3)
    .map(([category]) => category);

  return filteredCategories.map((category) => EDITORIAL_CATEGORY_PHRASES[category]);
};

const selectCoverCandidate = (input: {
  hero: TimeMachineTimelineEvent | null;
  importanceSorted: TimeMachineTimelineEvent[];
  highlightEventIds: string[];
}) => {
  const { hero, importanceSorted, highlightEventIds } = input;
  const highlightSet = new Set(highlightEventIds);

  if (hero?.imageUrl) {
    return hero;
  }

  return (
    importanceSorted.find((event) => Boolean(event.imageUrl) && highlightSet.has(event.id)) ??
    importanceSorted.find((event) => Boolean(event.imageUrl)) ??
    null
  );
};

export const isValidTimeMachineYear = (year: unknown): year is number => {
  return (
    typeof year === 'number' &&
    Number.isInteger(year) &&
    Number.isFinite(year) &&
    year >= TIME_MACHINE_MIN_YEAR &&
    year <= TIME_MACHINE_MAX_YEAR
  );
};

export const enumerateTimeMachineYears = (
  minYear = TIME_MACHINE_MIN_YEAR,
  maxYear = TIME_MACHINE_MAX_YEAR
) => {
  const years: number[] = [];
  for (let year = minYear; year <= maxYear; year += 1) {
    years.push(year);
  }
  return years;
};

export const clampTimeMachineYear = (year: number) => {
  if (year < TIME_MACHINE_MIN_YEAR) {
    return TIME_MACHINE_MIN_YEAR;
  }
  if (year > TIME_MACHINE_MAX_YEAR) {
    return TIME_MACHINE_MAX_YEAR;
  }
  return year;
};

const formatIsoYear = (year: number) => {
  const absoluteYear = Math.abs(Math.trunc(year));
  const paddedYear = String(absoluteYear).padStart(4, '0');
  return year < 0 ? `-${paddedYear}` : paddedYear;
};

export const toTimeMachineDateISO = (year: number, month: number, day: number) => {
  const safeYear = formatIsoYear(year);
  const safeMonth = String(month).padStart(2, '0');
  const safeDay = String(day).padStart(2, '0');
  return `${safeYear}-${safeMonth}-${safeDay}`;
};

export const getTimeMachineMonthLabel = (month: number) => {
  return MONTH_LABELS_LONG[month - 1] ?? 'Unknown';
};

export const normalizeTimeMachineLead = (value: string) => {
  const sanitized = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[\[([^[\]|]+)\|([^[\]]+)\]\]/g, '$2')
    .replace(/\[\[([^[\]]+)\]\]/g, '$1')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[^A-Za-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const words = sanitized.split(' ').filter(Boolean).slice(0, 10);
  if (words.length === 0) {
    return 'historic-event';
  }

  return words.join('-');
};

export const buildTimeMachineCanonicalKey = (input: {
  year: number;
  month: number;
  day: number;
  lead: string;
}) => {
  const { year, month, day, lead } = input;
  return `${year}:${String(month).padStart(2, '0')}:${String(day).padStart(2, '0')}:${normalizeTimeMachineLead(lead)}`;
};

export const parseTimeMachineDate = (
  event: Pick<TimeMachineAggregateInputEvent, 'year' | 'date' | 'dateISO'>
) => {
  const resolvedYear =
    typeof event.year === 'number' && Number.isFinite(event.year) ? event.year : undefined;

  if (event.dateISO) {
    const match = /^(-?\d{4,})-(\d{2})-(\d{2})$/.exec(event.dateISO);
    if (match) {
      return {
        year: Number.parseInt(match[1], 10),
        month: Number.parseInt(match[2], 10),
        day: Number.parseInt(match[3], 10),
        dateISO: event.dateISO,
      };
    }
  }

  const month = event.date?.month;
  const day = event.date?.day;

  if (
    resolvedYear !== undefined &&
    typeof month === 'number' &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    typeof day === 'number' &&
    Number.isInteger(day) &&
    day >= 1 &&
    day <= 31
  ) {
    return {
      year: resolvedYear,
      month,
      day,
      dateISO: toTimeMachineDateISO(resolvedYear, month, day),
    };
  }

  return null;
};

export const buildTimeMachineImportanceScore = (
  event: Pick<
    TimeMachineAggregateInputEvent,
    'categories' | 'summary' | 'imageUrl' | 'beforeContext' | 'afterContext' | 'pageCount'
  >
) => {
  const categoryCount = new Set(event.categories ?? []).size;
  const summaryLength = event.summary.trim().length;
  const pageCount = Math.max(0, event.pageCount ?? 0);
  const hasContext = Boolean(event.beforeContext || event.afterContext);

  let score = 0;
  if (event.imageUrl) score += 40;
  if (hasContext) score += 14;
  score += Math.min(categoryCount, 4) * 8;
  score += Math.min(pageCount, 4) * 6;
  score += Math.min(Math.floor(summaryLength / 40), 5) * 4;

  return score;
};

export const buildTimeMachineSummary = (
  year: number,
  eventCount: number,
  populatedMonths: number[],
  categories: string[],
  summarySource: TimeMachineSummarySource = 'generated'
) => {
  if (summarySource === 'manual') {
    return '';
  }

  if (eventCount === 0) {
    return `We are still curating standout moments from ${year}. Check back soon for a fuller timeline.`;
  }

  const categoryPreview = categories
    .slice(0, 3)
    .map((category) => category.replace(/-/g, ' '))
    .join(', ');

  const monthCount = populatedMonths.length;
  const categoryCopy = categoryPreview ? ` across ${categoryPreview}` : '';

  return `${year} currently includes ${eventCount} curated moments across ${monthCount} active months${categoryCopy}.`;
};

export const buildTimeMachineFallbackEditorialIntro = (input: {
  year: number;
  hero: TimeMachineTimelineEvent | null;
  sections: TimeMachineSection[];
}): TimeMachineEditorialIntro => {
  const { year, hero, sections } = input;
  const startMonthLabel = sections[0]?.label ?? null;
  const phrases = buildEditorialCategoryWeights(hero, sections);

  if (phrases.length > 0) {
    return {
      hook: `${year} was shaped by ${formatEditorialList(phrases)}.`,
      teaser: startMonthLabel
        ? `Begin in ${startMonthLabel} and follow the moments that defined the year.`
        : `The fuller timeline for ${year} is still taking shape.`,
      source: 'fallback',
    };
  }

  return {
    hook: `${year} opened with turning points that reshaped the months ahead.`,
    teaser: startMonthLabel
      ? `Begin in ${startMonthLabel} and move through the year chronologically.`
      : `The fuller timeline for ${year} is still taking shape.`,
    source: 'fallback',
  };
};

export const toTimeMachineTimelineEvent = (
  input: TimeMachineAggregateInputEvent
): TimeMachineTimelineEvent | null => {
  if (!input.eventId || !input.title || !input.summary) {
    return null;
  }

  const parsedDate = parseTimeMachineDate(input);
  if (!parsedDate) {
    return null;
  }

  const importanceScore =
    typeof input.existingImportanceScore === 'number'
      ? input.existingImportanceScore
      : buildTimeMachineImportanceScore(input);

  return {
    id: input.eventId,
    title: input.title,
    summary: input.summary,
    imageUrl: input.imageUrl,
    dateISO: parsedDate.dateISO,
    month: parsedDate.month,
    day: parsedDate.day,
    categories: Array.isArray(input.categories) ? input.categories : [],
    categoryId: input.categories?.[0],
    beforeContext: input.beforeContext,
    afterContext: input.afterContext,
    importanceScore,
  };
};

const compareEventsChronologically = (left: TimeMachineTimelineEvent, right: TimeMachineTimelineEvent) => {
  if (left.month !== right.month) {
    return left.month - right.month;
  }
  if (left.day !== right.day) {
    return left.day - right.day;
  }
  if (right.importanceScore !== left.importanceScore) {
    return right.importanceScore - left.importanceScore;
  }
  return left.id.localeCompare(right.id);
};

const compareEventsByImportance = (left: TimeMachineTimelineEvent, right: TimeMachineTimelineEvent) => {
  if (right.importanceScore !== left.importanceScore) {
    return right.importanceScore - left.importanceScore;
  }
  if (left.month !== right.month) {
    return left.month - right.month;
  }
  if (left.day !== right.day) {
    return left.day - right.day;
  }
  return left.id.localeCompare(right.id);
};

const buildTimeMachineYearQuality = (input: {
  eventCount: number;
  populatedMonthCount: number;
  heroPresent: boolean;
}) => {
  const qualityFlags: string[] = [];
  const { eventCount, populatedMonthCount, heroPresent } = input;

  if (eventCount === 0) {
    qualityFlags.push('no-events');
  }
  if (eventCount < 4) {
    qualityFlags.push('too-few-events');
  } else if (eventCount < 12) {
    qualityFlags.push('limited-event-count');
  }

  if (populatedMonthCount < 2) {
    qualityFlags.push('too-few-months');
  } else if (populatedMonthCount < 6) {
    qualityFlags.push('limited-month-coverage');
  }

  if (eventCount > 0 && !heroPresent) {
    qualityFlags.push('missing-hero');
  }

  const hasCriticalFlag = qualityFlags.some((flag) => CRITICAL_YEAR_FLAGS.has(flag));

  let publishState: TimeMachinePublishState = 'empty';
  if (!hasCriticalFlag && eventCount >= 12 && populatedMonthCount >= 6) {
    publishState = 'strong';
  } else if (!hasCriticalFlag && eventCount >= 4 && populatedMonthCount >= 2) {
    publishState = 'partial';
  }

  const eventScore = Math.min(55, eventCount * 4);
  const coverageScore = Math.min(30, populatedMonthCount * 5);
  const heroScore = heroPresent ? 15 : 0;
  const penalties = qualityFlags.length * 6;
  const qualityScore = Math.max(0, Math.min(100, eventScore + coverageScore + heroScore - penalties));

  return {
    publishState,
    qualityScore,
    qualityFlags,
  } satisfies TimeMachineYearQuality;
};

export const buildTimeMachineYearAggregate = (
  year: number,
  rawEvents: TimeMachineAggregateInputEvent[],
  options?: {
    highlightLimit?: number;
    existingSummary?: string;
    existingEditorialIntro?: TimeMachineEditorialIntro;
    summarySource?: TimeMachineSummarySource;
    generatedAt?: string;
    contentVersion?: string;
  }
): BuildYearAggregateResult => {
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const contentVersion = options?.contentVersion ?? TIME_MACHINE_CONTENT_VERSION;
  const highlightLimit = options?.highlightLimit ?? TIME_MACHINE_HIGHLIGHT_LIMIT;

  const events = rawEvents
    .map((event) => toTimeMachineTimelineEvent(event))
    .filter((event): event is TimeMachineTimelineEvent => event !== null)
    .sort(compareEventsChronologically);

  const importanceSorted = [...events].sort(compareEventsByImportance);
  const hero = importanceSorted[0] ?? null;
  const highlightSet = new Set(
    importanceSorted.slice(0, Math.min(highlightLimit, importanceSorted.length)).map((event) => event.id)
  );
  const highlightEventIds = events
    .filter((event) => highlightSet.has(event.id))
    .map((event) => event.id);
  const overflowEventIds = events
    .filter((event) => !highlightSet.has(event.id))
    .map((event) => event.id);

  const categories = Array.from(
    events.reduce((accumulator, event) => {
      event.categories.forEach((category) => accumulator.add(category));
      return accumulator;
    }, new Set<string>())
  );
  const populatedMonths = Array.from(new Set(events.map((event) => event.month))).sort((a, b) => a - b);
  const sections = buildTimeMachineSections(events, highlightEventIds);
  const summarySource = options?.summarySource ?? (options?.existingSummary ? 'manual' : 'generated');
  const generatedSummary = buildTimeMachineSummary(year, events.length, populatedMonths, categories, 'generated');
  const summary = options?.existingSummary?.trim() || generatedSummary;
  const cover = selectCoverCandidate({
    hero,
    importanceSorted,
    highlightEventIds,
  });
  const fallbackEditorialIntro = buildTimeMachineFallbackEditorialIntro({
    year,
    hero: cover ?? hero,
    sections,
  });
  const editorialIntro =
    options?.existingEditorialIntro?.source === 'ai'
      ? options.existingEditorialIntro
      : {
          ...fallbackEditorialIntro,
          generatedAt,
        };
  const quality = buildTimeMachineYearQuality({
    eventCount: events.length,
    populatedMonthCount: populatedMonths.length,
    heroPresent: hero !== null,
  });

  const document: TimeMachineYearDocument = {
    year,
    summary,
    heroEventId: hero?.id,
    coverEventId: cover?.id,
    coverImageUrl: cover?.imageUrl,
    editorialIntro,
    eventCount: events.length,
    populatedMonths,
    highlightEventIds,
    overflowEventIds,
    publishState: quality.publishState,
    qualityScore: quality.qualityScore,
    qualityFlags: quality.qualityFlags,
    generatedAt,
    contentVersion,
    summarySource,
  };

  return {
    document,
    stats: {
      eventCount: document.eventCount,
      populatedMonthCount: document.populatedMonths.length,
      categoryCount: categories.length,
      highlightedEventCount: document.highlightEventIds.length,
    },
    events,
    hero,
    cover,
  };
};

export const buildTimeMachineSections = (
  events: TimeMachineTimelineEvent[],
  highlightEventIds: string[]
): TimeMachineSection[] => {
  const highlightSet = new Set(highlightEventIds);
  const grouped = new Map<number, TimeMachineTimelineEvent[]>();

  for (const event of events) {
    const current = grouped.get(event.month) ?? [];
    current.push(event);
    grouped.set(event.month, current);
  }

  return Array.from(grouped.entries())
    .sort(([leftMonth], [rightMonth]) => leftMonth - rightMonth)
    .map(([month, monthEvents]) => {
      const highlightedCount = monthEvents.filter((event) => highlightSet.has(event.id)).length;
      const overflowCount = monthEvents.length - highlightedCount;

      return {
        month,
        label: getTimeMachineMonthLabel(month),
        events: monthEvents.sort(compareEventsChronologically),
        highlightedCount,
        overflowCount,
      };
    });
};

export const buildTimeMachineIndexEntry = (
  document: Pick<TimeMachineYearDocument, 'year' | 'publishState' | 'eventCount' | 'populatedMonths'>
): TimeMachineIndexYearEntry => ({
  year: document.year,
  publishState: document.publishState,
  eventCount: document.eventCount,
  populatedMonthCount: document.populatedMonths.length,
});

export const createEmptyTimeMachineYearDocument = (
  year: number,
  generatedAt = new Date().toISOString()
): TimeMachineYearDocument => {
  const quality = buildTimeMachineYearQuality({
    eventCount: 0,
    populatedMonthCount: 0,
    heroPresent: false,
  });

  return {
    year,
    summary: buildTimeMachineSummary(year, 0, [], []),
    editorialIntro: {
      ...buildTimeMachineFallbackEditorialIntro({
        year,
        hero: null,
        sections: [],
      }),
      generatedAt,
    },
    eventCount: 0,
    populatedMonths: [],
    highlightEventIds: [],
    overflowEventIds: [],
    publishState: quality.publishState,
    qualityScore: quality.qualityScore,
    qualityFlags: quality.qualityFlags,
    generatedAt,
    contentVersion: TIME_MACHINE_CONTENT_VERSION,
    summarySource: 'generated',
  };
};
