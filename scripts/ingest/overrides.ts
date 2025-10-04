import { readFile } from 'node:fs/promises';

import type { MediaAssetSummary } from './types';

export interface MediaOverride {
  sourceUrl: string;
  width?: number;
  height?: number;
  license?: string;
  attribution?: string;
  altText?: string;
  provider?: 'wikimedia' | 'custom';
  assetType?: 'thumbnail' | 'original';
}

export interface EventOverride {
  categories?: string[];
  era?: string;
  tags?: string[];
  selectedMedia?: MediaOverride;
  suppress?: boolean;
}

export interface OverrideConfig {
  events?: Record<string, EventOverride>;
}

const DEFAULT_OVERRIDE_PATH = 'overrides/events.json';

export const loadOverrides = async (path?: string): Promise<OverrideConfig> => {
  const filePath = path ?? process.env.INGEST_OVERRIDES_PATH ?? DEFAULT_OVERRIDE_PATH;

  try {
    const data = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data) as OverrideConfig;
    return {
      events: parsed.events ?? {},
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
