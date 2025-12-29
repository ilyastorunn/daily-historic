import type { ImageSource } from 'expo-image';

import { WIKIMEDIA_HEADERS } from '@/constants/api';

const BASE_URL = 'https://commons.wikimedia.org/wiki/Special:FilePath';

type WikimediaOptions = {
  width?: number;
};

export const buildWikimediaFileUrl = (fileName: string, options: WikimediaOptions = {}): string => {
  const trimmed = fileName.trim();
  if (!trimmed) {
    throw new Error('buildWikimediaFileUrl requires a non-empty file name.');
  }

  // Remove 'File:' prefix but KEEP underscores (Wikimedia uses underscores in filenames)
  const normalizedName = trimmed.replace(/^file:/i, '');
  const encodedName = encodeURIComponent(normalizedName);
  const params: string[] = [];

  if (options.width && Number.isFinite(options.width) && options.width > 0) {
    params.push(`width=${Math.floor(options.width)}`);
  }

  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return `${BASE_URL}/${encodedName}${query}`;
};

/**
 * Builds a Wikimedia ImageSource with proper User-Agent headers.
 * Use this for all Image components displaying Wikimedia content.
 *
 * @param fileName - Wikimedia Commons filename (with or without 'File:' prefix)
 * @param options - Optional width parameter for responsive images
 * @returns ImageSource with uri and headers
 */
export const buildWikimediaImageSource = (
  fileName: string,
  options: WikimediaOptions = {}
): ImageSource => {
  const uri = buildWikimediaFileUrl(fileName, options);
  return {
    uri,
    headers: WIKIMEDIA_HEADERS,
  };
};
