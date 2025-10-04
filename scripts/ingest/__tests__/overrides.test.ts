import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  applyMediaOverride,
  formatOverrideIssues,
  loadOverrides,
  overridesSchema,
  validateOverrideData,
} from '../overrides';

describe('overrides', () => {
  it('parses valid override data', () => {
    const result = validateOverrideData({
      events: {
        sample: {
          categories: ['art-culture'],
          selectedMedia: {
            sourceUrl: 'https://example.com/image.jpg',
            width: 1200,
            height: 900,
          },
        },
      },
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.events?.sample?.categories).toEqual(['art-culture']);
  });

  it('returns issues for invalid overrides', () => {
    const result = validateOverrideData({
      events: {
        broken: {
          categories: 'not-an-array',
        },
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = formatOverrideIssues(result.error.issues);
      expect(issues[0]).toContain('events.broken.categories');
    }
  });

  it('loadOverrides returns empty config when file is missing', async () => {
    const overrides = await loadOverrides('/tmp/non-existent-overrides.json');
    expect(overrides.events).toEqual({});
  });

  it('loadOverrides throws for invalid file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'overrides-test-'));
    const filePath = join(dir, 'invalid.json');
    writeFileSync(filePath, '{"events": {"broken": {"categories": "oops"}}}');

    try {
      await expect(loadOverrides(filePath)).rejects.toThrowError(/invalid/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('applyMediaOverride produces media summary', () => {
    const media = applyMediaOverride(
      {
        sourceUrl: 'https://example.com/image.jpg',
        width: 1600,
        height: 900,
        license: 'CC-BY',
      },
      'fallback-id'
    );

    expect(media).toMatchObject({
      id: 'override:https://example.com/image.jpg',
      provider: 'custom',
      width: 1600,
      height: 900,
    });
  });
});
