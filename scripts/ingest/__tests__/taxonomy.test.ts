import { describe, expect, it } from 'vitest';

import { CATEGORY_LABELS, ERA_LABELS } from '../../../constants/personalization';
import { CATEGORY_OPTIONS, ERA_OPTIONS, deriveEraFromYear, normalizeCategorySelection } from '../../../shared/taxonomy';
import { CATEGORY_OPTIONS as FUNCTION_CATEGORY_OPTIONS, ERA_OPTIONS as FUNCTION_ERA_OPTIONS } from '../../../functions/src/taxonomy';

describe('taxonomy parity', () => {
  it('keeps app labels aligned with canonical category taxonomy', () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([...CATEGORY_OPTIONS].sort());
  });

  it('keeps app labels aligned with canonical era taxonomy', () => {
    expect(Object.keys(ERA_LABELS).sort()).toEqual([...ERA_OPTIONS].sort());
  });

  it('keeps functions taxonomy aligned with canonical taxonomy', () => {
    expect(FUNCTION_CATEGORY_OPTIONS).toEqual(CATEGORY_OPTIONS);
    expect(FUNCTION_ERA_OPTIONS).toEqual(ERA_OPTIONS);
  });
});

describe('taxonomy helpers', () => {
  it('normalizes category selections and enforces surprise exclusivity', () => {
    expect(normalizeCategorySelection(['surprise', 'politics'])).toEqual(['politics']);
    expect(normalizeCategorySelection(['surprise', 'surprise'])).toEqual(['surprise']);
    expect(normalizeCategorySelection(['politics', 'politics', 'inventions'])).toEqual([
      'politics',
      'inventions',
    ]);
  });

  it('derives eras for edge years', () => {
    expect(deriveEraFromYear(-3500)).toBe('prehistory');
    expect(deriveEraFromYear(476)).toBe('ancient');
    expect(deriveEraFromYear(1492)).toBe('medieval');
    expect(deriveEraFromYear(1789)).toBe('early-modern');
    expect(deriveEraFromYear(1899)).toBe('nineteenth');
    expect(deriveEraFromYear(1969)).toBe('twentieth');
    expect(deriveEraFromYear(2026)).toBe('contemporary');
  });
});
