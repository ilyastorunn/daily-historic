#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import { bootstrapFirestore } from './ingest/firestore-admin';
import { fetchWithRetry } from './ingest/http-utils';
import { logInfo, logWarn } from './ingest/logger';
import type { FirestoreEventDocument } from '../types/events';
import {
  TIME_MACHINE_MAX_YEAR,
  TIME_MACHINE_MIN_YEAR,
  type TimeMachineEditorialIntro,
  type TimeMachineTimelineEvent,
  type TimeMachineYearDocument,
} from '../types/time-machine';
import {
  buildTimeMachineFallbackEditorialIntro,
  buildTimeMachineSections,
  buildTimeMachineYearAggregate,
} from '../utils/time-machine';
import {
  DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX,
  resolveTimeMachineTargets,
} from './time-machine-firestore';
import { getPreferredEventTitle, selectPreferredRelatedPage } from '../utils/event-primary-page';

interface CliOptions {
  fromYear: number;
  toYear: number;
  collectionSuffix: string;
  dryRun?: boolean;
  fallbackOnly?: boolean;
  model: string;
  serviceAccountPath?: string;
  serviceAccountJson?: string;
  projectId?: string;
}

type GenerateTimeMachineEditorialOptions = Partial<CliOptions>;

const BATCH_LIMIT = 300;

const parseNumeric = (value: string | undefined) => {
  if (value === undefined) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Failed to parse numeric value from '${value}'`);
  }
  return parsed;
};

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const options: Partial<CliOptions> = {
    fromYear: TIME_MACHINE_MIN_YEAR,
    toYear: TIME_MACHINE_MAX_YEAR,
    collectionSuffix: DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX,
    model: process.env.TIME_MACHINE_EDITORIAL_MODEL ?? 'gpt-4o-mini',
  };

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    const [flag, possibleValue] = token.split('=');

    const readNext = () => {
      if (possibleValue !== undefined) {
        return possibleValue;
      }
      const nextValue = args[index + 1];
      if (nextValue === undefined) {
        throw new Error(`Flag ${flag} expects a value`);
      }
      index += 1;
      return nextValue;
    };

    switch (flag) {
      case '--fromYear':
        options.fromYear = parseNumeric(readNext());
        break;
      case '--toYear':
        options.toYear = parseNumeric(readNext());
        break;
      case '--collectionSuffix':
        options.collectionSuffix = readNext();
        break;
      case '--production':
        options.collectionSuffix = '';
        break;
      case '--model':
        options.model = readNext();
        break;
      case '--fallbackOnly':
      case '--fallback-only':
        options.fallbackOnly = true;
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
        break;
      default:
        throw new Error(`Unrecognized flag: ${flag}`);
    }
  }

  if (!options.fromYear || !options.toYear || !options.model) {
    throw new Error('fromYear, toYear, and model must be defined.');
  }

  return options as CliOptions;
};

const printHelp = () => {
  console.log(
    [
      'Generate Time Machine editorial copy',
      '',
      'Usage: npm run time-machine:editorial -- [options]',
      '',
      'Options:',
      `  --fromYear <year>           First year to process (default: ${TIME_MACHINE_MIN_YEAR}).`,
      `  --toYear <year>             Last year to process (default: ${TIME_MACHINE_MAX_YEAR}).`,
      `  --collectionSuffix <suffix> Target collection suffix (default: ${DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX}).`,
      '  --production                Use production collections with no suffix.',
      '  --model <id>                OpenAI model id (default: TIME_MACHINE_EDITORIAL_MODEL or gpt-4o-mini).',
      '  --fallbackOnly              Skip AI generation and write fallback editorial copy only.',
      '  --dry-run                   Print what would be generated without writing.',
      '  --serviceAccount <path>     Path to Firebase service account JSON.',
      '  --serviceAccountJson <json> Inline Firebase credentials.',
      '  --projectId <id>            Override Firebase project id.',
      '  -h, --help                  Show this help message.',
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

const resolveImageUrl = (event: FirestoreEventDocument) => {
  const primaryPage = selectPreferredRelatedPage(event.relatedPages ?? [], event.summary ?? event.text);
  return primaryPage?.selectedMedia?.sourceUrl ?? primaryPage?.thumbnails?.[0]?.sourceUrl;
};

const mapEventToAggregateInput = (event: FirestoreEventDocument) => ({
  eventId: event.eventId,
  year: event.year,
  title: resolveTitle(event),
  summary: resolveSummary(event),
  categories: event.categories ?? [],
  date: event.date,
  dateISO: event.dateISO,
  imageUrl: resolveImageUrl(event),
  beforeContext: event.beforeContext,
  afterContext: event.afterContext,
  pageCount: Array.isArray(event.relatedPages) ? event.relatedPages.length : 0,
  existingImportanceScore: event.timeMachine?.importanceScore,
});

const extractResponseText = (payload: any): string => {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const buffer: string[] = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') {
        buffer.push(content.text);
      }
    }
  }

  return buffer.join('').trim();
};

const parseEditorialJson = (raw: string): Pick<TimeMachineEditorialIntro, 'hook' | 'teaser'> => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? raw;
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('OpenAI response did not contain a JSON object.');
  }

  const parsed = JSON.parse(fenced.slice(start, end + 1)) as Record<string, unknown>;
  const hook = typeof parsed.hook === 'string' ? parsed.hook.trim() : '';
  const teaser = typeof parsed.teaser === 'string' ? parsed.teaser.trim() : '';

  if (!hook || !teaser) {
    throw new Error('OpenAI response JSON is missing hook or teaser.');
  }

  return { hook, teaser };
};

const buildPromptPayload = (input: {
  year: number;
  startMonthLabel: string | null;
  coverEvent: TimeMachineTimelineEvent | null;
  highlightEvents: TimeMachineTimelineEvent[];
}) => {
  const { year, startMonthLabel, coverEvent, highlightEvents } = input;

  return JSON.stringify(
    {
      year,
      startMonth: startMonthLabel,
      coverEvent: coverEvent
        ? {
            title: coverEvent.title,
            summary: coverEvent.summary,
            categories: coverEvent.categories,
            dateISO: coverEvent.dateISO,
          }
        : null,
      highlightEvents: highlightEvents.map((event) => ({
        title: event.title,
        summary: event.summary,
        categories: event.categories,
        dateISO: event.dateISO,
      })),
    },
    null,
    2
  );
};

const generateEditorialWithOpenAI = async (input: {
  apiKey: string;
  model: string;
  year: number;
  startMonthLabel: string | null;
  coverEvent: TimeMachineTimelineEvent | null;
  highlightEvents: TimeMachineTimelineEvent[];
}) => {
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  const promptPayload = buildPromptPayload(input);

  const response = await fetchWithRetry(
    `${baseUrl}/responses`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: input.model,
        store: false,
        temperature: 0.7,
        max_output_tokens: 180,
        text: {
          format: {
            type: 'text',
          },
        },
        instructions:
          'You write premium editorial copy for a historical timeline app. Return only JSON with keys "hook" and "teaser". Write exactly two concise English sentences. Keep them grounded in the supplied facts, evocative, and user-facing. Do not mention counts, themes, categories, JSON, or unsupported claims. Avoid exclamation marks and quotation marks.',
        input: `Create an editorial intro for the year below.\n\n${promptPayload}`,
      }),
    },
    {
      attempts: 3,
      baseDelayMs: 700,
      maxDelayMs: 4_000,
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText} -> ${body}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return parseEditorialJson(extractResponseText(payload));
};

export const generateTimeMachineEditorial = async (
  input: GenerateTimeMachineEditorialOptions = {}
) => {
  const options: CliOptions = {
    fromYear: input.fromYear ?? TIME_MACHINE_MIN_YEAR,
    toYear: input.toYear ?? TIME_MACHINE_MAX_YEAR,
    collectionSuffix: input.collectionSuffix ?? DEFAULT_TIME_MACHINE_COLLECTION_SUFFIX,
    dryRun: input.dryRun,
    fallbackOnly: input.fallbackOnly,
    model: input.model ?? process.env.TIME_MACHINE_EDITORIAL_MODEL ?? 'gpt-4o-mini',
    serviceAccountPath: input.serviceAccountPath,
    serviceAccountJson: input.serviceAccountJson,
    projectId: input.projectId,
  };

  const { firestore, collections } = await bootstrapFirestore({
    serviceAccountPath: options.serviceAccountPath,
    serviceAccountJson: options.serviceAccountJson ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: options.projectId,
  });
  const targets = resolveTimeMachineTargets(collections, options.collectionSuffix);
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey && !options.fallbackOnly) {
    logWarn('time-machine-editorial-ai-missing-key', {
      message: 'OPENAI_API_KEY is missing; using fallback editorial copy.',
    });
  }

  const [aggregateSnapshot, eventsSnapshot] = await Promise.all([
    firestore.collection(targets.timeMachineYears).get(),
    firestore.collection(targets.events).get(),
  ]);

  const aggregateMap = new Map<number, TimeMachineYearDocument>();
  aggregateSnapshot.forEach((snapshot) => {
    const data = snapshot.data() as TimeMachineYearDocument;
    if (typeof data?.year === 'number') {
      aggregateMap.set(data.year, data);
    }
  });

  const eventsByYear = new Map<number, FirestoreEventDocument[]>();
  eventsSnapshot.forEach((snapshot) => {
    const data = snapshot.data() as FirestoreEventDocument;
    const event = {
      ...data,
      eventId: data.eventId ?? snapshot.id,
    };

    if (typeof event.year !== 'number' || event.timeMachine?.eligible !== true) {
      return;
    }

    const bucket = eventsByYear.get(event.year) ?? [];
    bucket.push(event);
    eventsByYear.set(event.year, bucket);
  });

  const generatedAt = new Date().toISOString();
  const updates: {
    year: number;
    coverEventId?: string;
    coverImageUrl?: string;
    editorialIntro: TimeMachineEditorialIntro;
  }[] = [];

  for (let year = options.fromYear; year <= options.toYear; year += 1) {
    const aggregate = aggregateMap.get(year);
    if (!aggregate) {
      continue;
    }

    const yearEvents = eventsByYear.get(year) ?? [];
    const rebuilt = buildTimeMachineYearAggregate(
      year,
      yearEvents.map(mapEventToAggregateInput),
      {
        existingSummary: aggregate.summary,
        existingEditorialIntro: aggregate.editorialIntro,
        summarySource: aggregate.summarySource,
        generatedAt: aggregate.generatedAt,
        contentVersion: aggregate.contentVersion,
        highlightLimit: aggregate.highlightEventIds.length,
      }
    );

    const sections = buildTimeMachineSections(rebuilt.events, rebuilt.document.highlightEventIds);
    const startMonthLabel = sections[0]?.label ?? null;
    const coverEvent =
      (aggregate.coverEventId
        ? rebuilt.events.find((event) => event.id === aggregate.coverEventId)
        : null) ??
      rebuilt.cover;
    const highlightEvents = aggregate.highlightEventIds
      .map((eventId) => rebuilt.events.find((event) => event.id === eventId))
      .filter((event): event is TimeMachineTimelineEvent => event !== undefined)
      .slice(0, 5);
    const fallbackEditorialIntro = {
      ...buildTimeMachineFallbackEditorialIntro({
        year,
        hero: coverEvent ?? rebuilt.hero,
        sections,
      }),
      generatedAt,
    } satisfies TimeMachineEditorialIntro;

    let editorialIntro = fallbackEditorialIntro;

    if (
      aggregate.publishState !== 'empty' &&
      !options.fallbackOnly &&
      openAiApiKey &&
      highlightEvents.length > 0
    ) {
      try {
        const aiIntro = await generateEditorialWithOpenAI({
          apiKey: openAiApiKey,
          model: options.model,
          year,
          startMonthLabel,
          coverEvent,
          highlightEvents,
        });

        editorialIntro = {
          ...aiIntro,
          source: 'ai',
          generatedAt,
        };
      } catch (error) {
        logWarn('time-machine-editorial-fallback', {
          year,
          error: (error as Error).message,
        });
      }
    }

    updates.push({
      year,
      coverEventId: rebuilt.document.coverEventId,
      coverImageUrl: rebuilt.document.coverImageUrl,
      editorialIntro,
    });
  }

  if (options.dryRun) {
    console.log(
      `Dry run: prepared ${updates.length} Time Machine editorial update(s) for ${targets.timeMachineYears}.`
    );
    console.log(
      JSON.stringify(
        updates.slice(0, 3).map((update) => ({
          year: update.year,
          coverEventId: update.coverEventId,
          editorialIntro: update.editorialIntro,
        })),
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

  for (const update of updates) {
    batch.set(
      firestore.collection(targets.timeMachineYears).doc(String(update.year)),
      {
        coverEventId: update.coverEventId,
        coverImageUrl: update.coverImageUrl,
        editorialIntro: update.editorialIntro,
      },
      { merge: true }
    );
    opCount += 1;

    if (opCount >= BATCH_LIMIT) {
      await flushBatch();
    }
  }

  await flushBatch();

  logInfo('time-machine-editorial-generated', {
    count: updates.length,
    targetCollection: targets.timeMachineYears,
    source: options.fallbackOnly || !openAiApiKey ? 'fallback' : 'mixed',
  });
};

const main = async () => {
  const options = parseArgs();
  await generateTimeMachineEditorial(options);
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error) => {
    console.error('Time Machine editorial generation failed:', error);
    process.exitCode = 1;
  });
}
