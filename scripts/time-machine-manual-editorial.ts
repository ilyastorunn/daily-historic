#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { TIME_MACHINE_MANUAL_EDITORIAL_ENTRIES } from '../constants/time-machine-manual-editorial';
import type { FirestoreEventDocument } from '../types/events';
import type {
  TimeMachineEditorialIntro,
  TimeMachinePublishState,
  TimeMachineYearDocument,
} from '../types/time-machine';
import { getPreferredEventTitle, selectPreferredRelatedPage } from '../utils/event-primary-page';
import { bootstrapFirestore } from './ingest/firestore-admin';
import {
  TIME_MACHINE_MANUAL_EDITORIAL_REVIEW_PATH,
  TIME_MACHINE_MANUAL_EDITORIAL_SOURCE_PATH,
  buildTimeMachineManualEditorialMap,
  renderTimeMachineManualEditorialSource,
  validateTimeMachineManualEditorialEntries,
  type TimeMachineManualEditorialEntry,
} from './time-machine-manual-editorial-shared';
import {
  DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX,
  resolveTimeMachineTargets,
} from './time-machine-firestore';

type Command = 'bootstrap' | 'review' | 'sync';

interface CliOptions {
  command: Command;
  collectionSuffix: string;
  dryRun?: boolean;
  serviceAccountPath?: string;
  serviceAccountJson?: string;
  projectId?: string;
}

interface EventEvidence {
  eventId: string;
  dateISO: string | null;
  title: string;
  summary: string;
  categories: string[];
}

interface YearEvidence {
  year: number;
  eventCount: number;
  publishState: TimeMachinePublishState;
  populatedMonths: number[];
  existingEditorialIntro: TimeMachineEditorialIntro | null;
  hero: EventEvidence | null;
  cover: EventEvidence | null;
  highlights: EventEvidence[];
}

const BATCH_LIMIT = 300;
const FIRESTORE_BATCH_READ_LIMIT = 200;
const FALLBACK_HOOK_PATTERN =
  /(opened with turning points that reshaped the months ahead|was shaped by )/i;

const DUAL_CATEGORY_HOOKS: Record<string, string[]> = {
  'art-culture|politics': [
    'Public Life Changed Shape',
    'Culture and Power Collided',
    'The Public Mood Shifted',
  ],
  'civil-rights|politics': [
    'Demands Reached the Streets',
    'The Crowd Wanted More',
    'Public Pressure Held',
  ],
  'exploration|natural-disasters': [
    'A Year of Reach and Rupture',
    'Ambition Met Upheaval',
    'Progress Faced the Elements',
  ],
  'exploration|science-discovery': [
    'Discovery Pushed Forward',
    'Frontiers Moved Again',
    'The Future Felt Closer',
  ],
  'natural-disasters|surprise': [
    'Shock Kept Arriving',
    'The Ground Would Not Settle',
    'Instability Came in Waves',
  ],
  'politics|world-wars': [
    'An Order Came Under Fire',
    'Power Turned Harder',
    'The Balance Broke Open',
  ],
  'science-discovery|world-wars': [
    'Innovation Met Conflict',
    'War and Knowledge Converged',
    'The Future Carried a Cost',
  ],
  'surprise|world-wars': [
    'Conflict Never Sat Still',
    'The Year Refused Calm',
    'Tension Kept Breaking Loose',
  ],
  'world-wars|natural-disasters': [
    'Pressure Came From Every Side',
    'War Met Relentless Strain',
    'The Year Tightened Further',
  ],
};

const SINGLE_CATEGORY_HOOKS: Record<string, string[]> = {
  'art-culture': ['Culture Moved Into View', 'The Public Imagination Shifted', 'A New Mood Took Hold'],
  'civil-rights': ['The Streets Refused Silence', 'The Public Pushed Back', 'Rights Moved to the Fore'],
  exploration: ['Frontiers Kept Moving', 'Distance Started to Shrink', 'The Horizon Pulled Wider'],
  inventions: ['New Tools Changed the Pace', 'Invention Left a Mark', 'Technology Entered the Frame'],
  'natural-disasters': ['Nature Hit Without Warning', 'The Year Took Heavy Blows', 'The Pressure Arrived Fast'],
  politics: ['Power Moved Quickly', 'Authority Changed Hands', 'The Order Started to Shift'],
  'science-discovery': ['Discovery Changed the Tempo', 'Knowledge Moved Ahead', 'Ideas Turned Practical'],
  surprise: ['The Year Refused a Pattern', 'Nothing Held Still for Long', 'The Story Kept Swerving'],
  'world-wars': ['Conflict Set the Pace', 'War Darkened the Calendar', 'The Front Kept Moving'],
};

const DUAL_CATEGORY_TONES: Record<string, string[]> = {
  'art-culture|politics': [
    'cultural change and political pressure',
    'public mood shifts and institutional change',
    'cultural momentum and political rearrangement',
  ],
  'civil-rights|politics': [
    'public pressure and political reckoning',
    'mass demands and contested authority',
    'collective pressure and civic change',
  ],
  'exploration|natural-disasters': [
    'catastrophe and outward ambition',
    'disaster and modern reach',
    'shock and technical ambition',
  ],
  'exploration|science-discovery': [
    'scientific momentum and outward ambition',
    'discovery and expanding horizons',
    'technical confidence and new reach',
  ],
  'natural-disasters|surprise': [
    'repeated shock and sudden turns',
    'instability and abrupt disruption',
    'pressure without much warning',
  ],
  'politics|world-wars': [
    'conflict and political realignment',
    'hard power and unstable order',
    'warfare and reshaped authority',
  ],
  'science-discovery|world-wars': [
    'military escalation and technical change',
    'scientific momentum under wartime pressure',
    'conflict fused with new capability',
  ],
  'surprise|world-wars': [
    'conflict and volatile turns',
    'military pressure and persistent instability',
    'war and abrupt reversals',
  ],
  'world-wars|natural-disasters': [
    'conflict, strain, and repeated shocks',
    'military pressure and heavy disruption',
    'warfare intensified by wider instability',
  ],
};

const SINGLE_CATEGORY_TONES: Record<string, string[]> = {
  'art-culture': ['cultural momentum', 'a visible shift in public life', 'a changing public imagination'],
  'civil-rights': ['public pressure', 'organised civic demand', 'rights moving into full view'],
  exploration: ['outward ambition', 'expanding horizons', 'distance giving way to reach'],
  inventions: ['technical reinvention', 'new tools entering daily life', 'invention setting the pace'],
  'natural-disasters': ['sudden pressure', 'disruption on a large scale', 'instability coming fast'],
  politics: ['political realignment', 'authority shifting in plain sight', 'power changing hands'],
  'science-discovery': ['scientific momentum', 'knowledge moving into action', 'discovery changing expectations'],
  surprise: ['unpredictable turns', 'constant instability', 'events refusing a neat pattern'],
  'world-wars': ['military escalation', 'conflict setting the tempo', 'war shaping the calendar'],
};

const EMPTY_HOOKS_BY_ERA: Array<{
  start: number;
  end: number;
  hooks: string[];
  teasers: string[];
}> = [
  {
    start: 1800,
    end: 1849,
    hooks: [
      'A Quieter Corridor for Now',
      'This Stop Is Still Taking Shape',
      'The Archive Stays Light Here',
    ],
    teasers: [
      'The current timeline for this year is still sparse, so the stop stays deliberately restrained until fuller curation arrives.',
      'This year is lightly populated in the current archive, leaving a quieter threshold while more material is assembled.',
      'The year currently reads as a leaner waypoint, with premium-neutral copy holding the space until deeper curation catches up.',
    ],
  },
  {
    start: 1850,
    end: 1913,
    hooks: [
      'A Lighter Trace in the Archive',
      'This Year Still Reads Quietly',
      'The Record Remains Thin Here',
    ],
    teasers: [
      'The current Time Machine record for this year is still sparse, so the copy stays measured while fuller editorial coverage is built out.',
      'This stop is only lightly populated today, which leaves the year intentionally understated until more events are curated in.',
      'For now the year holds a slimmer footprint in the archive, and the copy stays neutral until a deeper timeline is ready.',
    ],
  },
  {
    start: 1914,
    end: 1945,
    hooks: [
      'A Sparse Stop in a Heavy Era',
      'This Year Waits in the Wings',
      'The Archive Is Still Catching Up',
    ],
    teasers: [
      'This year remains lightly populated in the current timeline, so the copy stays restrained until fuller editorial coverage is added.',
      'The archive still holds only a sparse record here, leaving a deliberately quiet pause while more curation is assembled.',
      'For now the year is represented with a lighter footprint, and the copy remains neutral until the timeline is expanded.',
    ],
  },
  {
    start: 1946,
    end: 2026,
    hooks: [
      'The Timeline Stays Light Here',
      'This Stop Is Still Filling In',
      'A Leaner Year for Now',
    ],
    teasers: [
      'The current timeline for this year is still sparse, so the copy holds a premium-neutral tone until fuller curation is ready.',
      'This year carries a lighter archival footprint for now, leaving room for a fuller editorial pass later on.',
      'The record here is still relatively thin, so the copy stays controlled and minimal until more events are curated in.',
    ],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  'art-culture': 'art and culture',
  'civil-rights': 'civil rights',
  exploration: 'exploration',
  inventions: 'inventions',
  'natural-disasters': 'natural disasters',
  politics: 'politics',
  'science-discovery': 'science and discovery',
  surprise: 'surprise turns',
  'world-wars': 'conflict',
};

const EVENTFUL_KEYWORDS = [
  'war',
  'battle',
  'campaign',
  'election',
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
  'strike',
  'expedition',
  'referendum',
  'conference',
  'assassination',
];

const INFERRED_CATEGORY_KEYWORDS: Record<string, string[]> = {
  'art-culture': ['album', 'opera', 'novel', 'premiere', 'film', 'music', 'theatre', 'museum'],
  'civil-rights': ['rights', 'strike', 'protest', 'march', 'boycott', 'demonstrator', 'union'],
  exploration: ['mission', 'voyage', 'expedition', 'orbit', 'landing', 'probe', 'ship'],
  inventions: ['patent', 'telephone', 'railway', 'engine', 'telegraph', 'reactor', 'computer'],
  'natural-disasters': ['earthquake', 'storm', 'hurricane', 'typhoon', 'flood', 'fire', 'eruption'],
  politics: ['election', 'treaty', 'parliament', 'congress', 'accords', 'constitution', 'referendum'],
  'science-discovery': ['scientist', 'discovery', 'physics', 'chemistry', 'observatory', 'medical'],
  surprise: ['crash', 'collapse', 'bombing', 'stampede', 'panic', 'mutiny'],
  'world-wars': ['war', 'battle', 'siege', 'army', 'navy', 'torpedo', 'front', 'raid'],
};

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    command: 'review',
    collectionSuffix: DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX,
  };

  let commandSet = false;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    const [flag, inlineValue] = token.split('=');

    const readNext = () => {
      if (inlineValue !== undefined) {
        return inlineValue;
      }

      const nextValue = args[index + 1];
      if (nextValue === undefined) {
        throw new Error(`Flag ${flag} expects a value.`);
      }
      index += 1;
      return nextValue;
    };

    if (!commandSet && !token.startsWith('-')) {
      if (token === 'bootstrap' || token === 'review' || token === 'sync') {
        options.command = token;
        commandSet = true;
        continue;
      }
      throw new Error(`Unknown command: ${token}`);
    }

    switch (flag) {
      case '--collectionSuffix':
        options.collectionSuffix = readNext();
        break;
      case '--production':
        options.collectionSuffix = '';
        break;
      case '--dryRun':
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--serviceAccount':
        options.serviceAccountPath = readNext();
        break;
      case '--serviceAccountJson':
        options.serviceAccountJson = readNext();
        break;
      case '--projectId':
        options.projectId = readNext();
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        throw new Error(`Unknown flag: ${flag}`);
    }
  }

  return options;
};

const printHelp = () => {
  console.log(
    [
      'Manage Time Machine manual editorial copy',
      '',
      'Usage:',
      '  npm run time-machine:manual:bootstrap -- [options]',
      '  npm run time-machine:manual:review -- [options]',
      '  npm run time-machine:manual:sync -- [options]',
      '',
      'Commands:',
      '  bootstrap                  Build the repo-authored manual copy source from Firestore context.',
      '  review                     Generate docs/product/time-machine-manual-editorial.md.',
      '  sync                       Write the local manual copy source into Firestore as source=manual.',
      '',
      'Options:',
      `  --collectionSuffix <id>    Firestore suffix (default: ${DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX}).`,
      '  --production               Use production collections with no suffix.',
      '  --dry-run                  Print summary only; do not write files or Firestore.',
      '  --serviceAccount <path>    Path to Firebase service account JSON.',
      '  --serviceAccountJson <json> Inline Firebase credentials.',
      '  --projectId <id>           Override Firebase project id.',
      '  -h, --help                 Show this help message.',
      '',
    ].join('\n')
  );
};

const resolveTitle = (event: FirestoreEventDocument) => {
  return getPreferredEventTitle(event.relatedPages, event.summary ?? event.text);
};

const resolveSummary = (event: FirestoreEventDocument) => {
  const primaryPage = selectPreferredRelatedPage(event.relatedPages ?? [], event.summary ?? event.text);
  return event.summary ?? event.text ?? primaryPage?.extract ?? 'Tap to open the full story.';
};

const buildSummaryLead = (value: string) => {
  const normalized = value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.:;,\s]+$/g, '');

  const firstClause = normalized.split(/[.;]/, 1)[0]?.trim() ?? normalized;
  const words = firstClause.split(' ').filter(Boolean).slice(0, 8);

  while (
    words.length > 1 &&
    ['a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'the', 'to'].includes(
      words[words.length - 1]?.toLowerCase() ?? ''
    )
  ) {
    words.pop();
  }

  return words.join(' ');
};

const compactTitle = (value: string) => {
  const stripped = value
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.:;,\s]+$/g, '');

  if (stripped.length <= 56) {
    return stripped;
  }

  const words = stripped.split(' ').filter(Boolean).slice(0, 8);

  while (
    words.length > 1 &&
    ['a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'the', 'to'].includes(
      words[words.length - 1]?.toLowerCase() ?? ''
    )
  ) {
    words.pop();
  }

  return words.join(' ');
};

const looksLikeProperName = (value: string) => {
  return /^[A-Z][A-Za-z'’.-]+(?:\s+[A-Z0-9][A-Za-z0-9'’.-]+){0,4}$/.test(value);
};

const buildAnchorLabel = (event: EventEvidence) => {
  const title = compactTitle(event.title);
  const normalizedTitle = title.toLowerCase();
  const hasEventKeyword = EVENTFUL_KEYWORDS.some((keyword) => normalizedTitle.includes(keyword));

  if (hasEventKeyword) {
    return title;
  }

  const summaryLead = buildSummaryLead(event.summary);

  if (looksLikeProperName(title) || title.split(' ').length <= 4) {
    return compactTitle(summaryLead || title);
  }

  return title;
};

const formatList = (items: string[]) => {
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

const humanizeCategory = (category: string) => {
  return CATEGORY_LABELS[category] ?? category.replace(/-/g, ' ');
};

const pickVariant = (year: number, variants: string[]) => {
  return variants[Math.abs(year) % variants.length];
};

const buildCategoryWeights = (context: YearEvidence) => {
  const weights = new Map<string, number>();
  const weightedEvents = [
    ...(context.hero ? [{ event: context.hero, weight: 3 }] : []),
    ...(context.cover ? [{ event: context.cover, weight: 2 }] : []),
    ...context.highlights.map((event) => ({ event, weight: 1 })),
  ];

  for (const item of weightedEvents) {
    const categories =
      item.event.categories.length > 0
        ? item.event.categories
        : (() => {
            const haystack = `${item.event.title} ${item.event.summary}`.toLowerCase();
            const inferred = Object.entries(INFERRED_CATEGORY_KEYWORDS)
              .filter(([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)))
              .map(([category]) => category);

            return inferred.length > 0 ? inferred : ['surprise'];
          })();

    for (const category of categories) {
      weights.set(category, (weights.get(category) ?? 0) + item.weight);
    }
  }

  return [...weights.entries()].sort((left, right) => right[1] - left[1]);
};

const buildTone = (year: number, categories: string[]) => {
  const primary = categories[0];
  const secondary = categories[1];

  if (primary && secondary) {
    const key = [primary, secondary].sort().join('|');
    const dual = DUAL_CATEGORY_TONES[key];
    if (dual) {
      return pickVariant(year, dual);
    }
  }

  if (primary) {
    const single = SINGLE_CATEGORY_TONES[primary];
    if (single) {
      return pickVariant(year, single);
    }
  }

  return pickVariant(year, [
    'volatile historical pressure',
    'shifting momentum',
    'a restless historical mood',
  ]);
};

const buildHook = (year: number, categories: string[]) => {
  const primary = categories[0];
  const secondary = categories[1];

  if (primary && secondary) {
    const key = [primary, secondary].sort().join('|');
    const dual = DUAL_CATEGORY_HOOKS[key];
    if (dual) {
      return pickVariant(year, dual);
    }
  }

  if (primary) {
    const single = SINGLE_CATEGORY_HOOKS[primary];
    if (single) {
      return pickVariant(year, single);
    }
  }

  return pickVariant(year, [
    'The Year Refused to Flatten Out',
    'The Story Kept Changing Shape',
    'Momentum Moved in Multiple Directions',
  ]);
};

const buildEvidenceSummary = (context: YearEvidence) => {
  if (context.eventCount === 0 || context.highlights.length === 0) {
    return 'No highlighted events are present in the current aggregate, so this year uses premium-neutral copy until fuller curation arrives.';
  }

  const topCategories = buildCategoryWeights(context)
    .slice(0, 3)
    .map(([category]) => humanizeCategory(category));
  const monthCount = context.populatedMonths.length;
  const categorySummary =
    topCategories.length > 0 ? ` Strongest signals: ${formatList(topCategories)}.` : '';

  return `${context.eventCount} curated events across ${monthCount} active months.${categorySummary}`;
};

const buildPremiumNeutralIntro = (year: number): TimeMachineManualEditorialEntry => {
  const era = EMPTY_HOOKS_BY_ERA.find((item) => year >= item.start && year <= item.end) ?? EMPTY_HOOKS_BY_ERA[0];

  return {
    year,
    hook: pickVariant(year, era.hooks),
    teaser: pickVariant(year, era.teasers),
  };
};

const buildAnchorTitles = (context: YearEvidence) => {
  const seen = new Set<string>();
  const anchors = [context.cover, context.hero, ...context.highlights]
    .filter((event): event is EventEvidence => event !== null)
    .map((event) => buildAnchorLabel(event))
    .filter(Boolean)
    .filter((title) => {
      if (seen.has(title)) {
        return false;
      }
      seen.add(title);
      return true;
    });

  return anchors.slice(0, 2);
};

const buildContextualManualIntro = (context: YearEvidence): TimeMachineManualEditorialEntry => {
  const weightedCategories = buildCategoryWeights(context).map(([category]) => category);
  const categories = weightedCategories.slice(0, 2);
  const anchors = buildAnchorTitles(context);
  const hook = buildHook(context.year, categories);
  const tone = buildTone(context.year, categories);
  let teaser = `The year felt shaped by ${tone}.`;

  if (anchors.length === 2) {
    teaser = `${formatList(anchors)} shaped the year with ${tone}.`;
  } else if (anchors.length === 1) {
    teaser = `${anchors[0]} anchored a year marked by ${tone}.`;
  }

  return {
    year: context.year,
    hook,
    teaser,
  };
};

const shouldReuseExistingEditorial = (context: YearEvidence) => {
  const intro = context.existingEditorialIntro;
  if (!intro?.hook?.trim() || !intro.teaser?.trim()) {
    return false;
  }

  if (context.highlights.length === 0 || context.publishState === 'empty') {
    return false;
  }

  return !FALLBACK_HOOK_PATTERN.test(intro.hook);
};

const toEventEvidence = (event: FirestoreEventDocument): EventEvidence => ({
  eventId: event.eventId,
  dateISO: event.dateISO ?? null,
  title: resolveTitle(event),
  summary: resolveSummary(event),
  categories: event.categories ?? [],
});

const fetchYearEvidence = async (options: CliOptions) => {
  const { firestore, collections } = await bootstrapFirestore({
    serviceAccountPath: options.serviceAccountPath,
    serviceAccountJson: options.serviceAccountJson ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: options.projectId,
  });
  const targets = resolveTimeMachineTargets(collections, options.collectionSuffix);
  const aggregateSnapshot = await firestore.collection(targets.timeMachineYears).get();

  const aggregateDocs = new Map<number, TimeMachineYearDocument>();
  const eventRefs = new Map<string, FirebaseFirestore.DocumentReference>();

  aggregateSnapshot.forEach((snapshot) => {
    const data = snapshot.data() as TimeMachineYearDocument;
    if (typeof data?.year !== 'number') {
      return;
    }

    aggregateDocs.set(data.year, data);

    const referenceIds = new Set<string>([
      ...(data.highlightEventIds ?? []).slice(0, 5),
      ...(data.heroEventId ? [data.heroEventId] : []),
      ...(data.coverEventId ? [data.coverEventId] : []),
    ]);

    for (const eventId of referenceIds) {
      if (!eventRefs.has(eventId)) {
        eventRefs.set(eventId, firestore.collection(targets.events).doc(eventId));
      }
    }
  });

  const eventsById = new Map<string, FirestoreEventDocument>();
  const refs = [...eventRefs.values()];

  for (let index = 0; index < refs.length; index += FIRESTORE_BATCH_READ_LIMIT) {
    const batch = refs.slice(index, index + FIRESTORE_BATCH_READ_LIMIT);
    const snapshots = await firestore.getAll(...batch);

    for (const snapshot of snapshots) {
      if (!snapshot.exists) {
        continue;
      }

      const data = snapshot.data() as FirestoreEventDocument;
      const event = {
        ...data,
        eventId: data.eventId ?? snapshot.id,
      };
      eventsById.set(event.eventId, event);
    }
  }

  const years = [...aggregateDocs.values()]
    .map((aggregate) => {
      const resolveEvidence = (eventId?: string | null) => {
        if (!eventId) {
          return null;
        }
        const event = eventsById.get(eventId);
        return event ? toEventEvidence(event) : null;
      };

      return {
        year: aggregate.year,
        eventCount: aggregate.eventCount,
        publishState: aggregate.publishState,
        populatedMonths: aggregate.populatedMonths ?? [],
        existingEditorialIntro: aggregate.editorialIntro ?? null,
        hero: resolveEvidence(aggregate.heroEventId),
        cover: resolveEvidence(aggregate.coverEventId),
        highlights: (aggregate.highlightEventIds ?? [])
          .slice(0, 5)
          .map((eventId) => resolveEvidence(eventId))
          .filter((event): event is EventEvidence => event !== null),
      } satisfies YearEvidence;
    })
    .sort((left, right) => left.year - right.year);

  return {
    generatedAt: new Date().toISOString(),
    targets,
    years,
  };
};

const buildBootstrapEntries = (contexts: readonly YearEvidence[]) => {
  return contexts.map((context) => {
    if (shouldReuseExistingEditorial(context)) {
      return {
        year: context.year,
        hook: context.existingEditorialIntro?.hook.trim() ?? '',
        teaser: context.existingEditorialIntro?.teaser.trim() ?? '',
      } satisfies TimeMachineManualEditorialEntry;
    }

    if (context.highlights.length > 0 && context.publishState !== 'empty') {
      return buildContextualManualIntro(context);
    }

    return buildPremiumNeutralIntro(context.year);
  });
};

const renderReviewMarkdown = (
  contexts: readonly YearEvidence[],
  entries: readonly TimeMachineManualEditorialEntry[],
  input: {
    generatedAt: string;
    collectionName: string;
  }
) => {
  const entryMap = buildTimeMachineManualEditorialMap(entries);
  const lines = [
    '# Time Machine Manual Editorial Review',
    '',
    `Generated: ${input.generatedAt}`,
    `Source file: \`${TIME_MACHINE_MANUAL_EDITORIAL_SOURCE_PATH}\``,
    `Firestore collection: \`${input.collectionName}\``,
    '',
  ];

  for (const context of contexts) {
    const entry = entryMap.get(context.year);
    if (!entry) {
      throw new Error(`Missing manual editorial entry for ${context.year}.`);
    }

    lines.push(`## ${context.year}`);
    lines.push('');
    lines.push(`**Hook**: ${entry.hook}`);
    lines.push('');
    lines.push(`**Teaser**: ${entry.teaser}`);
    lines.push('');
    lines.push(`**Evidence Summary**: ${buildEvidenceSummary(context)}`);
    lines.push('');
    lines.push('**Anchor Events**');

    if (context.highlights.length === 0) {
      lines.push('- No highlighted events are currently present for this year.');
    } else {
      for (const event of context.highlights) {
        const dateLabel = event.dateISO ? ` (${event.dateISO})` : '';
        const categoryLabel =
          event.categories.length > 0
            ? ` [${event.categories.map((category) => humanizeCategory(category)).join(', ')}]`
            : '';
        lines.push(`- ${buildAnchorLabel(event)}${dateLabel}${categoryLabel}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
};

const bootstrapManualEditorial = async (options: CliOptions) => {
  const { years, generatedAt } = await fetchYearEvidence(options);
  const entries = buildBootstrapEntries(years);
  validateTimeMachineManualEditorialEntries(entries);

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          command: 'bootstrap',
          entryCount: entries.length,
          sourcePath: TIME_MACHINE_MANUAL_EDITORIAL_SOURCE_PATH,
          sample: entries.slice(0, 3),
        },
        null,
        2
      )
    );
    return;
  }

  const sourcePath = path.resolve(TIME_MACHINE_MANUAL_EDITORIAL_SOURCE_PATH);
  await mkdir(path.dirname(sourcePath), { recursive: true });
  await writeFile(sourcePath, renderTimeMachineManualEditorialSource(entries), 'utf-8');

  console.log(
    `Wrote ${entries.length} manual editorial entries to ${TIME_MACHINE_MANUAL_EDITORIAL_SOURCE_PATH} at ${generatedAt}.`
  );
};

const generateReviewMarkdown = async (options: CliOptions) => {
  validateTimeMachineManualEditorialEntries(TIME_MACHINE_MANUAL_EDITORIAL_ENTRIES);

  const { years, generatedAt, targets } = await fetchYearEvidence(options);
  const markdown = renderReviewMarkdown(years, TIME_MACHINE_MANUAL_EDITORIAL_ENTRIES, {
    generatedAt,
    collectionName: targets.timeMachineYears,
  });

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          command: 'review',
          reviewPath: TIME_MACHINE_MANUAL_EDITORIAL_REVIEW_PATH,
          yearCount: years.length,
        },
        null,
        2
      )
    );
    return;
  }

  const reviewPath = path.resolve(TIME_MACHINE_MANUAL_EDITORIAL_REVIEW_PATH);
  await mkdir(path.dirname(reviewPath), { recursive: true });
  await writeFile(reviewPath, markdown, 'utf-8');

  console.log(`Wrote review markdown to ${TIME_MACHINE_MANUAL_EDITORIAL_REVIEW_PATH}.`);
};

const syncManualEditorial = async (options: CliOptions) => {
  validateTimeMachineManualEditorialEntries(TIME_MACHINE_MANUAL_EDITORIAL_ENTRIES);

  const { firestore, collections } = await bootstrapFirestore({
    serviceAccountPath: options.serviceAccountPath,
    serviceAccountJson: options.serviceAccountJson ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: options.projectId,
  });
  const targets = resolveTimeMachineTargets(collections, options.collectionSuffix);
  const generatedAt = new Date().toISOString();

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          command: 'sync',
          targetCollection: targets.timeMachineYears,
          updateCount: TIME_MACHINE_MANUAL_EDITORIAL_ENTRIES.length,
          sample: TIME_MACHINE_MANUAL_EDITORIAL_ENTRIES.slice(0, 3),
        },
        null,
        2
      )
    );
    return;
  }

  let batch = firestore.batch();
  let opCount = 0;

  const flushBatch = async () => {
    if (opCount === 0) {
      return;
    }
    await batch.commit();
    batch = firestore.batch();
    opCount = 0;
  };

  for (const entry of TIME_MACHINE_MANUAL_EDITORIAL_ENTRIES) {
    batch.set(
      firestore.collection(targets.timeMachineYears).doc(String(entry.year)),
      {
        editorialIntro: {
          hook: entry.hook.trim(),
          teaser: entry.teaser.trim(),
          source: 'manual',
          generatedAt,
        },
      },
      { merge: true }
    );
    opCount += 1;

    if (opCount >= BATCH_LIMIT) {
      await flushBatch();
    }
  }

  await flushBatch();

  console.log(
    `Synced ${TIME_MACHINE_MANUAL_EDITORIAL_ENTRIES.length} manual editorial entries to ${targets.timeMachineYears}.`
  );
};

const run = async () => {
  const options = parseArgs();

  switch (options.command) {
    case 'bootstrap':
      await bootstrapManualEditorial(options);
      break;
    case 'review':
      await generateReviewMarkdown(options);
      break;
    case 'sync':
      await syncManualEditorial(options);
      break;
    default:
      throw new Error(`Unsupported command: ${String(options.command)}`);
  }
};

const isMainModule =
  typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  void run().catch((error) => {
    console.error('Time Machine manual editorial workflow failed:', error);
    process.exitCode = 1;
  });
}
