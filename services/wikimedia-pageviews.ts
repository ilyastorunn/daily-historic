/**
 * Wikimedia Pageviews API Client
 * Fetches top viewed Wikipedia articles for Story of the Day
 */

const PAGEVIEWS_API_BASE = 'https://wikimedia.org/api/rest_v1/metrics/pageviews';

export type PageviewsArticle = {
  article: string; // Article title (URL-encoded)
  views: number; // View count
  rank: number; // Ranking position
};

type PageviewsTopResponse = {
  items?: Array<{
    project: string; // e.g., "en.wikipedia"
    access: string; // e.g., "all-access"
    year: string; // YYYY
    month: string; // MM
    day: string; // DD
    articles: PageviewsArticle[];
  }>;
};

type FetchTopArticlesArgs = {
  project?: string; // Default: 'en.wikipedia'
  year?: number; // Default: yesterday
  month?: number; // Default: yesterday
  day?: number; // Default: yesterday
  signal?: AbortSignal;
  userAgent?: string;
};

/**
 * Format number with two digits (e.g., 5 -> '05')
 */
const toTwoDigits = (value: number) => value.toString().padStart(2, '0');

/**
 * Get yesterday's date (Pageviews API has ~1 day lag)
 */
const getYesterday = () => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return {
    year: yesterday.getFullYear(),
    month: yesterday.getMonth() + 1, // JavaScript months are 0-indexed
    day: yesterday.getDate(),
  };
};

/**
 * Fetch top viewed Wikipedia articles for a given date
 *
 * API Endpoint: GET /metrics/pageviews/top/{project}/{access}/{year}/{month}/{day}
 *
 * @param project - Wikipedia project (e.g., 'en.wikipedia', 'de.wikipedia')
 * @param year - Year (YYYY)
 * @param month - Month (1-12)
 * @param day - Day (1-31)
 * @param signal - AbortSignal for request cancellation
 * @param userAgent - Custom User-Agent header
 * @returns Array of top viewed articles with view counts
 *
 * @example
 * ```ts
 * const articles = await fetchTopArticles({
 *   year: 2025,
 *   month: 10,
 *   day: 26,
 * });
 * console.log(articles[0]); // { article: "Main_Page", views: 12345678, rank: 1 }
 * ```
 */
export const fetchTopArticles = async ({
  project = 'en.wikipedia',
  year,
  month,
  day,
  signal,
  userAgent,
}: FetchTopArticlesArgs = {}): Promise<PageviewsArticle[]> => {
  // Default to yesterday (Pageviews API has ~1 day lag)
  const yesterday = getYesterday();
  const resolvedYear = year ?? yesterday.year;
  const resolvedMonth = month ?? yesterday.month;
  const resolvedDay = day ?? yesterday.day;

  const yearStr = resolvedYear.toString();
  const monthStr = toTwoDigits(resolvedMonth);
  const dayStr = toTwoDigits(resolvedDay);

  const endpoint = `${PAGEVIEWS_API_BASE}/top/${project}/all-access/${yearStr}/${monthStr}/${dayStr}`;

  const resolvedUserAgent =
    userAgent ??
    process.env.EXPO_PUBLIC_WIKIMEDIA_USER_AGENT ??
    'DailyHistoricApp/0.1 (contact@dailyhistoric.app)';

  console.log('[Pageviews] Fetching top articles', {
    endpoint,
    date: `${yearStr}-${monthStr}-${dayStr}`,
  });

  const response = await fetch(endpoint, {
    signal,
    headers: {
      Accept: 'application/json',
      'User-Agent': resolvedUserAgent,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to fetch Wikimedia pageviews: ${response.status} ${response.statusText} -> ${text}`
    );
  }

  const payload = (await response.json()) as PageviewsTopResponse;

  if (!payload.items || payload.items.length === 0) {
    console.warn('[Pageviews] No items in response');
    return [];
  }

  const articles = payload.items[0]?.articles ?? [];

  console.log('[Pageviews] Fetched articles', { count: articles.length });

  return articles;
};

/**
 * Decode URL-encoded article title
 *
 * @param title - URL-encoded title (e.g., "Albert_Einstein")
 * @returns Decoded title (e.g., "Albert Einstein")
 */
export const decodeArticleTitle = (title: string): string => {
  try {
    return decodeURIComponent(title.replace(/_/g, ' '));
  } catch (error) {
    console.warn('[Pageviews] Failed to decode title', { title, error });
    return title.replace(/_/g, ' ');
  }
};

/**
 * Filter out common non-content pages
 *
 * Excludes:
 * - Main_Page
 * - Special: pages
 * - Wikipedia: namespace pages
 * - Template: pages
 * - Help: pages
 * - Portal: pages
 * - Category: pages
 * - File: pages
 *
 * @param articles - Array of articles to filter
 * @returns Filtered articles
 */
export const filterContentArticles = (articles: PageviewsArticle[]): PageviewsArticle[] => {
  const excludePatterns = [
    /^Main_Page$/i,
    /^Special:/i,
    /^Wikipedia:/i,
    /^Template:/i,
    /^Help:/i,
    /^Portal:/i,
    /^Category:/i,
    /^File:/i,
    /^-$/,
    /^404\.php$/i,
    /^index\.php$/i,
  ];

  return articles.filter((article) => {
    const isExcluded = excludePatterns.some((pattern) => pattern.test(article.article));
    return !isExcluded;
  });
};

/**
 * Get top content article (excluding meta pages)
 *
 * @param options - Same as fetchTopArticles
 * @returns Top content article or null
 */
export const getTopContentArticle = async (
  options: FetchTopArticlesArgs = {}
): Promise<PageviewsArticle | null> => {
  const allArticles = await fetchTopArticles(options);
  const contentArticles = filterContentArticles(allArticles);

  if (contentArticles.length === 0) {
    console.warn('[Pageviews] No content articles found');
    return null;
  }

  return contentArticles[0];
};
