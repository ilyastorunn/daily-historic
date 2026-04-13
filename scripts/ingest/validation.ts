import { z } from 'zod';

import type { DailyDigestRecord, HistoricalEventRecord } from './types';
import { CATEGORY_OPTIONS, ERA_OPTIONS } from '../../shared/taxonomy';

const mediaAssetSchema = z.object({
  id: z.string().min(1),
  sourceUrl: z.string().url(),
  width: z.number().positive(),
  height: z.number().positive(),
  provider: z.enum(['wikimedia', 'custom']),
  attribution: z.string().optional(),
  license: z.string().optional(),
  altText: z.string().optional(),
  assetType: z.enum(['thumbnail', 'original']),
});

const relatedPageSchema = z.object({
  pageId: z.number().int(),
  canonicalTitle: z.string().min(1),
  displayTitle: z.string().min(1),
  normalizedTitle: z.string().min(1),
  description: z.string().optional(),
  extract: z.string().optional(),
  wikidataId: z.string().optional(),
  desktopUrl: z.string().url(),
  mobileUrl: z.string().url(),
  thumbnails: z.array(mediaAssetSchema),
  selectedMedia: mediaAssetSchema.optional(),
});

const enrichmentSchema = z
  .object({
    primaryEntityId: z.string().optional(),
    exactDate: z.string().optional(),
    participantIds: z.array(z.string()),
    participants: z.array(
      z.object({
        wikidataId: z.string(),
        label: z.string(),
        description: z.string().optional(),
      })
    ),
    supportingEntityIds: z.array(z.string()),
  })
  .optional();

const validCategorySet = new Set<string>(CATEGORY_OPTIONS);
const validEraSet = new Set<string>(ERA_OPTIONS);

const categoriesSchema = z.array(z.string()).min(1).superRefine((categories, context) => {
  for (const category of categories) {
    if (!validCategorySet.has(category)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unknown category "${category}"`,
      });
    }
  }

  if (categories.includes('surprise') && categories.length > 1) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: '"surprise" cannot be combined with other categories',
    });
  }
});

const eraSchema = z.string().refine((era) => validEraSet.has(era), {
  message: `era must be one of: ${ERA_OPTIONS.join(', ')}`,
});

const eventSchema = z.object({
  eventId: z.string().min(1),
  canonicalKey: z.string().min(1),
  year: z.number().int().optional(),
  text: z.string().min(1),
  summary: z.string().min(1),
  categories: categoriesSchema,
  era: eraSchema,
  tags: z.array(z.string()),
  date: z.object({
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
  }),
  dateISO: z.string().regex(/^-?\d{4,}-\d{2}-\d{2}$/),
  relatedPages: z.array(relatedPageSchema).min(1),
  source: z.object({
    provider: z.literal('wikimedia'),
    feed: z.enum(['onthisday', 'year-page']),
    rawType: z.string().min(1),
    capturedAt: z.string().min(1),
    sourceDate: z.string().min(1),
    payloadCacheKey: z.string().min(1),
    pageTitle: z.string().optional(),
    revisionId: z.number().int().optional(),
  }),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  enrichment: enrichmentSchema,
  timeMachine: z.object({
    eligible: z.boolean(),
    sourceType: z.enum(['wikipedia-year-page', 'on-this-day-selected']),
    sourceTypes: z.array(z.enum(['wikipedia-year-page', 'on-this-day-selected'])).optional(),
    sourceKey: z.string().min(1),
    parserVersion: z.string().min(1),
    importanceScore: z.number().optional(),
    qualityFlags: z.array(z.string()),
    lastAggregatedAt: z.string().optional(),
    featured: z.boolean().optional(),
    generatedAt: z.string().optional(),
  }),
});

const digestSchema = z.object({
  digestId: z.string().min(1),
  date: z.string().min(1),
  eventIds: z.array(z.string().min(1)),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateEvents = (events: HistoricalEventRecord[]) => {
  const issues: string[] = [];

  events.forEach((event) => {
    const parsed = eventSchema.safeParse(event);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ');
      issues.push(`Event ${event.eventId}: ${detail}`);
    }
  });

  if (issues.length) {
    throw new ValidationError(issues.join(' | '));
  }
};

export const validateDigest = (digest: DailyDigestRecord, events: HistoricalEventRecord[]) => {
  const parsed = digestSchema.safeParse(digest);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
    throw new ValidationError(`Digest ${digest.digestId}: ${detail}`);
  }

  const eventIdSet = new Set(events.map((event) => event.eventId));
  const missing = digest.eventIds.filter((eventId) => !eventIdSet.has(eventId));
  if (missing.length) {
    throw new ValidationError(`Digest ${digest.digestId}: missing eventIds ${missing.join(', ')}`);
  }
};

export const assertValidPayload = (
  events: HistoricalEventRecord[],
  digest: DailyDigestRecord
) => {
  validateEvents(events);
  validateDigest(digest, events);
};
