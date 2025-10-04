import { readFile } from 'node:fs/promises';

import { z, type ZodIssue } from 'zod';

import type { MediaAssetSummary } from './types';

const mediaOverrideSchema = z.object({
  sourceUrl: z.string().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  license: z.string().optional(),
  attribution: z.string().optional(),
  altText: z.string().optional(),
  provider: z.enum(['wikimedia', 'custom']).optional(),
  assetType: z.enum(['thumbnail', 'original']).optional(),
});

const eventOverrideSchema = z.object({
  categories: z.array(z.string().min(1)).optional(),
  era: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  selectedMedia: mediaOverrideSchema.optional(),
  suppress: z.boolean().optional(),
});

export const overridesSchema = z.object({
  events: z.record(eventOverrideSchema).optional(),
});

export type MediaOverride = z.infer<typeof mediaOverrideSchema>;
export type EventOverride = z.infer<typeof eventOverrideSchema>;
export type OverrideConfig = z.infer<typeof overridesSchema>;


export const DEFAULT_OVERRIDE_PATH = 'overrides/events.json';

export const formatOverrideIssues = (issues: ZodIssue[]): string[] => {
  return issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : 'root';
    return `${path}: ${issue.message}`;
  });
};

export const validateOverrideData = (data: unknown) => {
  return overridesSchema.safeParse(data);
};

export const loadOverrides = async (path?: string): Promise<OverrideConfig> => {
  const filePath = path ?? process.env.INGEST_OVERRIDES_PATH ?? DEFAULT_OVERRIDE_PATH;

  try {
    const data = await readFile(filePath, 'utf-8');
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(data);
    } catch (jsonError) {
      throw new Error(`Override file ${filePath} contains invalid JSON: ${(jsonError as Error).message}`);
    }

    const result = validateOverrideData(parsedJson);
    if (!result.success) {
      const detail = formatOverrideIssues(result.error.issues).join('; ');
      throw new Error(`Override file ${filePath} is invalid: ${detail}`);
    }

    return {
      events: result.data.events ?? {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { events: {} };
    }

    throw error;
  }
};

export const applyMediaOverride = (
  mediaOverride: MediaOverride,
  fallbackId: string
): MediaAssetSummary | undefined => {
  const { sourceUrl } = mediaOverride;
  if (!sourceUrl) {
    return undefined;
  }

  const width = mediaOverride.width ?? 1024;
  const height = mediaOverride.height ?? 1024;

  if (width <= 0 || height <= 0) {
    return undefined;
  }

  const id = mediaOverride.sourceUrl ? `override:${mediaOverride.sourceUrl}` : fallbackId;

  return {
    id,
    sourceUrl,
    width,
    height,
    provider: mediaOverride.provider ?? 'custom',
    assetType: mediaOverride.assetType ?? 'original',
    license: mediaOverride.license,
    attribution: mediaOverride.attribution,
    altText: mediaOverride.altText,
  };
};
