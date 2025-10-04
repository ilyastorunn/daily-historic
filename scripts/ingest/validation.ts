import { z } from 'zod';

import type { DailyDigestRecord, HistoricalEventRecord } from './types';

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

const eventSchema = z.object({
  eventId: z.string().min(1),
  year: z.number().int().optional(),
  text: z.string().min(1),
  summary: z.string().min(1),
  categories: z.array(z.string()),
  era: z.string().optional(),
  tags: z.array(z.string()),
  date: z.object({
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
  }),
  relatedPages: z.array(relatedPageSchema).min(1),
  source: z.object({
    provider: z.literal('wikimedia'),
    feed: z.literal('onthisday'),
    rawType: z.string().min(1),
    capturedAt: z.string().min(1),
    sourceDate: z.string().min(1),
    payloadCacheKey: z.string().min(1),
  }),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  enrichment: enrichmentSchema,
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
