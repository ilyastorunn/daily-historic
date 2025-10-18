import type { ImageSource } from 'expo-image';

type MaybeImageSource =
  | ImageSource
  | string
  | number
  | Array<ImageSource | string | number>
  | null
  | undefined;

const isObjectWithUri = (value: unknown): value is { uri?: unknown } => {
  return typeof value === 'object' && value !== null && 'uri' in value;
};

const extractFromArray = (
  entries: Array<ImageSource | string | number>
): string | undefined => {
  for (const entry of entries) {
    const resolved = getImageUri(entry);
    if (resolved) {
      return resolved;
    }
  }
  return undefined;
};

export const getImageUri = (source: MaybeImageSource): string | undefined => {
  if (source == null) {
    return undefined;
  }

  if (typeof source === 'string') {
    return source;
  }

  if (typeof source === 'number') {
    return undefined;
  }

  if (Array.isArray(source)) {
    return extractFromArray(source);
  }

  if (isObjectWithUri(source) && typeof source.uri === 'string') {
    return source.uri;
  }

  return undefined;
};

