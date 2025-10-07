import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MEDIA_CACHE_PATH,
  getMediaCacheAsset,
  loadMediaCache,
  makeMediaCacheKey,
  persistMediaCache,
  setMediaCacheAsset,
} from '../cache';

const createTempCachePath = () => {
  const dir = mkdtempSync(join(tmpdir(), 'media-cache-test-'));
  return { dir, path: join(dir, 'cache.json') };
};

describe('media cache', () => {
  it('loads empty cache when file is missing', async () => {
    const cache = await loadMediaCache('/tmp/non-existent-cache.json');
    expect(cache.entries.size).toBe(0);
  });

  it('persists and retrieves cached asset', async () => {
    const { dir, path } = createTempCachePath();
    try {
      const cache = await loadMediaCache(path, 0);
      const key = makeMediaCacheKey('apollo', 800, 600);
      setMediaCacheAsset(
        cache,
        key,
        {
          id: 'override:test',
          sourceUrl: 'https://example.com/image.jpg',
          width: 1024,
          height: 768,
          provider: 'custom',
          assetType: 'original',
        },
        10_000,
        0
      );
      await persistMediaCache(cache);

      const reloaded = await loadMediaCache(path, 1000);
      const asset = getMediaCacheAsset(reloaded, key, 1000);
      expect(asset?.sourceUrl).toBe('https://example.com/image.jpg');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('removes expired entries when loading', async () => {
    const { dir, path } = createTempCachePath();
    try {
      const cache = await loadMediaCache(path, 0);
      const key = makeMediaCacheKey('apollo', 800, 600);
      setMediaCacheAsset(cache, key, null, 1000, 0);
      await persistMediaCache(cache);

      const reloaded = await loadMediaCache(path, 2000);
      expect(getMediaCacheAsset(reloaded, key, 2000)).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('uses default cache path constant', () => {
    expect(DEFAULT_MEDIA_CACHE_PATH).toMatch(/cache\/media-cache\.json$/);
  });
});
