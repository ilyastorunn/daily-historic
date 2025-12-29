import type { ImageSource } from 'expo-image';

import { WIKIMEDIA_HEADERS } from '@/constants/api';

/**
 * Hostnames that indicate a Wikimedia URL
 */
const WIKIMEDIA_HOSTS = [
  'commons.wikimedia.org',
  'upload.wikimedia.org',
  'en.wikipedia.org',
  'wikipedia.org',
] as const;

/**
 * Checks if a URL is from Wikimedia Commons or Wikipedia
 */
export const isWikimediaUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return WIKIMEDIA_HOSTS.some((host) => urlObj.hostname.includes(host));
  } catch {
    return false;
  }
};

/**
 * Creates an ImageSource with appropriate headers for Wikimedia URLs.
 * For non-Wikimedia URLs, returns a simple { uri } object.
 *
 * @param uri - The image URL
 * @returns ImageSource with headers if Wikimedia, simple source otherwise
 */
export const createImageSource = (uri: string | undefined | null): ImageSource | undefined => {
  if (!uri) {
    return undefined;
  }

  if (isWikimediaUrl(uri)) {
    return {
      uri,
      headers: WIKIMEDIA_HEADERS,
    };
  }

  return { uri };
};

/**
 * Converts any image source type to ImageSource with Wikimedia headers when appropriate.
 * Handles string URIs, existing ImageSource objects, and undefined/null.
 *
 * @param source - String URI, ImageSource object, or undefined/null
 * @returns ImageSource with headers for Wikimedia URLs, or the source as-is
 */
export const toImageSource = (
  source: ImageSource | string | undefined | null
): ImageSource | undefined => {
  if (!source) {
    return undefined;
  }

  // String URI - convert to ImageSource with headers if Wikimedia
  if (typeof source === 'string') {
    return createImageSource(source);
  }

  // Already an ImageSource object
  if (typeof source === 'object') {
    // Handle number sources (local assets) - return as-is
    if (typeof source === 'number') {
      return source as unknown as ImageSource;
    }

    // Check if it has a uri property
    if ('uri' in source && typeof source.uri === 'string') {
      // If it's a Wikimedia URL without headers, add them
      if (isWikimediaUrl(source.uri) && !source.headers) {
        return {
          ...source,
          headers: WIKIMEDIA_HEADERS,
        };
      }
    }

    return source;
  }

  return undefined;
};
