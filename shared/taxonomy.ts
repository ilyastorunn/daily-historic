export const CATEGORY_OPTIONS = [
  'world-wars',
  'ancient-civilizations',
  'science-discovery',
  'art-culture',
  'politics',
  'inventions',
  'natural-disasters',
  'civil-rights',
  'exploration',
  'surprise',
] as const;

export const ERA_OPTIONS = [
  'prehistory',
  'ancient',
  'medieval',
  'early-modern',
  'nineteenth',
  'twentieth',
  'contemporary',
] as const;

export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];
export type EraOption = (typeof ERA_OPTIONS)[number];

const CATEGORY_SET = new Set<string>(CATEGORY_OPTIONS);
const ERA_SET = new Set<string>(ERA_OPTIONS);

const parseYearFromExactDate = (exactDate?: string) => {
  if (!exactDate) {
    return undefined;
  }

  const match = exactDate.match(/^-?\d{1,6}/);
  if (!match) {
    return undefined;
  }

  const parsed = Number.parseInt(match[0], 10);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
};

export const isCategoryOption = (value: string | undefined | null): value is CategoryOption => {
  return Boolean(value && CATEGORY_SET.has(value));
};

export const isEraOption = (value: string | undefined | null): value is EraOption => {
  return Boolean(value && ERA_SET.has(value));
};

export const deriveEraFromYear = (
  year?: number,
  exactDate?: string
): EraOption | undefined => {
  const resolvedYear = typeof year === 'number' && Number.isFinite(year)
    ? year
    : parseYearFromExactDate(exactDate);

  if (resolvedYear === undefined) {
    return undefined;
  }

  if (resolvedYear < -3000) return 'prehistory';
  if (resolvedYear < 500) return 'ancient';
  if (resolvedYear < 1500) return 'medieval';
  if (resolvedYear < 1800) return 'early-modern';
  if (resolvedYear < 1900) return 'nineteenth';
  if (resolvedYear < 2000) return 'twentieth';
  return 'contemporary';
};

export const normalizeCategorySelection = (input: readonly string[]): CategoryOption[] => {
  const valid = Array.from(new Set(input.filter((value): value is CategoryOption => isCategoryOption(value))));

  if (valid.length === 0) {
    return [];
  }

  if (valid.includes('surprise') && valid.length > 1) {
    return valid.filter((value) => value !== 'surprise');
  }

  return valid;
};
