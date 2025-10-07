import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { logDebug } from './logger';
import type { MediaAssetSummary } from './types';

const CACHE_VERSION = 1;

export interface MediaCacheEntry {
  asset: MediaAssetSummary | null;
  expiresAt: number;
  storedAt: string;
  ttlMs: number;
}

interface MediaCacheFile {
  version: number;
  updatedAt?: string;
  entries: Record<string, MediaCacheEntry>;
}

export interface MediaCacheState {
  path: string;
  entries: Map<string, MediaCacheEntry>;
  dirty: boolean;
}

export const DEFAULT_MEDIA_CACHE_PATH = 'cache/media-cache.json';

export const makeMediaCacheKey = (
  query: string,
  minWidth: number,
  minHeight: number,
  limit?: number
) => {
  return `${query.trim().toLowerCase()}|${minWidth}|${minHeight}|${limit ?? 'default'}`;
};

export const loadMediaCache = async (
  cachePath: string = DEFAULT_MEDIA_CACHE_PATH,
  now: number = Date.now()
): Promise<MediaCacheState> => {
  try {
    const raw = await readFile(cachePath, 'utf-8');
    const parsed = JSON.parse(raw) as MediaCacheFile;

    if (parsed.version !== CACHE_VERSION || !parsed.entries) {
      logDebug(`Media cache version mismatch, resetting ${cachePath}`);
      return { path: cachePath, entries: new Map(), dirty: true };
    }

    const entries = new Map<string, MediaCacheEntry>();
    let dirty = false;

    for (const [key, entry] of Object.entries(parsed.entries)) {
      if (entry.expiresAt > now) {
        entries.set(key, entry);
      } else {
        dirty = true;
      }
    }

    return { path: cachePath, entries, dirty };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { path: cachePath, entries: new Map(), dirty: false };
    }

    throw error;
  }
};

export const getMediaCacheAsset = (
  cache: MediaCacheState,
  key: string,
  now: number = Date.now()
): MediaAssetSummary | null | undefined => {
  const entry = cache.entries.get(key);
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= now) {
    cache.entries.delete(key);
    cache.dirty = true;
    return undefined;
  }

  return entry.asset;
};

export const setMediaCacheAsset = (
  cache: MediaCacheState,
  key: string,
  asset: MediaAssetSummary | null,
  ttlMs: number,
  now: number = Date.now()
) => {
  if (ttlMs <= 0) {
    return;
  }

  cache.entries.set(key, {
    asset,
    ttlMs,
    storedAt: new Date(now).toISOString(),
    expiresAt: now + ttlMs,
  });
  cache.dirty = true;
};

export const persistMediaCache = async (cache: MediaCacheState) => {
  if (!cache.dirty) {
    return;
  }

  await mkdir(dirname(cache.path), { recursive: true });

  const entriesObject: Record<string, MediaCacheEntry> = {};
  for (const [key, entry] of cache.entries.entries()) {
    entriesObject[key] = entry;
  }

  const payload: MediaCacheFile = {
    version: CACHE_VERSION,
    updatedAt: new Date().toISOString(),
    entries: entriesObject,
  };

  await writeFile(cache.path, JSON.stringify(payload, null, 2));
  logDebug(`Persisted media cache with ${cache.entries.size} entries to ${cache.path}`);
  cache.dirty = false;
};
