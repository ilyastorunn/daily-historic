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
