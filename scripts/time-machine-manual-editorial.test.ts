import { describe, expect, it } from 'vitest';

import { TIME_MACHINE_MANUAL_EDITORIAL_ENTRIES } from '../constants/time-machine-manual-editorial';
import {
  buildTimeMachineManualEditorialMap,
  validateTimeMachineManualEditorialEntries,
} from './time-machine-manual-editorial-shared';

describe('time machine manual editorial source', () => {
  it('covers every year from 1800 through 2026', () => {
    expect(() =>
      validateTimeMachineManualEditorialEntries(TIME_MACHINE_MANUAL_EDITORIAL_ENTRIES)
    ).not.toThrow();
  });

  it('builds a year-indexed lookup from the validated source', () => {
    const lookup = buildTimeMachineManualEditorialMap(TIME_MACHINE_MANUAL_EDITORIAL_ENTRIES);

    expect(lookup.get(1800)?.year).toBe(1800);
    expect(lookup.get(2026)?.year).toBe(2026);
  });

  it('rejects duplicate years', () => {
    expect(() =>
      validateTimeMachineManualEditorialEntries([
        { year: 1800, hook: 'A', teaser: 'B' },
        { year: 1800, hook: 'C', teaser: 'D' },
      ])
    ).toThrow('Duplicate manual editorial entry for year 1800.');
  });
});
