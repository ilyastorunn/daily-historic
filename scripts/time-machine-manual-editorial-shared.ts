import { TIME_MACHINE_MAX_YEAR, TIME_MACHINE_MIN_YEAR } from '../types/time-machine';

export interface TimeMachineManualEditorialEntry {
  year: number;
  hook: string;
  teaser: string;
}

export const TIME_MACHINE_MANUAL_EDITORIAL_SOURCE_PATH = 'constants/time-machine-manual-editorial.ts';
export const TIME_MACHINE_MANUAL_EDITORIAL_REVIEW_PATH =
  'docs/product/time-machine-manual-editorial.md';

const compareByYear = (
  left: TimeMachineManualEditorialEntry,
  right: TimeMachineManualEditorialEntry
) => left.year - right.year;

export const normalizeTimeMachineManualEditorialEntry = (
  entry: TimeMachineManualEditorialEntry
): TimeMachineManualEditorialEntry => ({
  year: entry.year,
  hook: entry.hook.trim(),
  teaser: entry.teaser.trim(),
});

export const validateTimeMachineManualEditorialEntries = (
  entries: readonly TimeMachineManualEditorialEntry[]
) => {
  const years = new Set<number>();

  for (const rawEntry of entries) {
    const entry = normalizeTimeMachineManualEditorialEntry(rawEntry);

    if (!Number.isInteger(entry.year)) {
      throw new Error(`Manual editorial entry year must be an integer. Received: ${entry.year}`);
    }

    if (entry.year < TIME_MACHINE_MIN_YEAR || entry.year > TIME_MACHINE_MAX_YEAR) {
      throw new Error(
        `Manual editorial entry year ${entry.year} is outside ${TIME_MACHINE_MIN_YEAR}-${TIME_MACHINE_MAX_YEAR}.`
      );
    }

    if (!entry.hook) {
      throw new Error(`Manual editorial entry ${entry.year} is missing a hook.`);
    }

    if (!entry.teaser) {
      throw new Error(`Manual editorial entry ${entry.year} is missing a teaser.`);
    }

    if (years.has(entry.year)) {
      throw new Error(`Duplicate manual editorial entry for year ${entry.year}.`);
    }

    years.add(entry.year);
  }

  for (let year = TIME_MACHINE_MIN_YEAR; year <= TIME_MACHINE_MAX_YEAR; year += 1) {
    if (!years.has(year)) {
      throw new Error(`Missing manual editorial entry for year ${year}.`);
    }
  }
};

export const buildTimeMachineManualEditorialMap = (
  entries: readonly TimeMachineManualEditorialEntry[]
) => {
  validateTimeMachineManualEditorialEntries(entries);

  return new Map(
    [...entries]
      .map((entry) => normalizeTimeMachineManualEditorialEntry(entry))
      .sort(compareByYear)
      .map((entry) => [entry.year, entry] as const)
  );
};

const escapeTemplateValue = (value: string) => {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
};

export const renderTimeMachineManualEditorialSource = (
  entries: readonly TimeMachineManualEditorialEntry[]
) => {
  const normalizedEntries = [...entries]
    .map((entry) => normalizeTimeMachineManualEditorialEntry(entry))
    .sort(compareByYear);

  validateTimeMachineManualEditorialEntries(normalizedEntries);

  const lines = [
    'export const TIME_MACHINE_MANUAL_EDITORIAL_ENTRIES = [',
    ...normalizedEntries.map(
      (entry) =>
        `  { year: ${entry.year}, hook: '${escapeTemplateValue(entry.hook)}', teaser: '${escapeTemplateValue(entry.teaser)}' },`
    ),
    '] as const satisfies ReadonlyArray<{',
    '  year: number;',
    '  hook: string;',
    '  teaser: string;',
    '}>;',
    '',
  ];

  return lines.join('\n');
};
