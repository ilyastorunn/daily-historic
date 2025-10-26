/**
 * Title Normalization and Fuzzy Matching Utilities
 * For matching Wikipedia article titles to Firestore events
 */

/**
 * Normalize a title for comparison
 * - Lowercase
 * - Remove special characters
 * - Trim whitespace
 * - Remove common prefixes/suffixes
 */
export const normalizeTitle = (title: string): string => {
  let normalized = title.toLowerCase();

  // Remove common Wikipedia disambiguation suffixes
  normalized = normalized.replace(/\s*\([^)]*\)$/g, ''); // e.g., "Paris (city)" -> "Paris"

  // Remove common prefixes
  normalized = normalized.replace(/^(the|a|an)\s+/i, ''); // e.g., "The Beatles" -> "Beatles"

  // Remove special characters but keep spaces and alphanumeric
  normalized = normalized.replace(/[^\w\s-]/g, '');

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
};

/**
 * Calculate Levenshtein distance between two strings
 * (Edit distance - minimum number of single-character edits)
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;

  // Create 2D array for dynamic programming
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Fill dp table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]; // No operation needed
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // Deletion
          dp[i][j - 1] + 1,     // Insertion
          dp[i - 1][j - 1] + 1  // Substitution
        );
      }
    }
  }

  return dp[m][n];
};

/**
 * Calculate similarity score between two strings (0-1)
 * Uses normalized Levenshtein distance
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
};

/**
 * Check if title contains a keyword (normalized)
 */
export const containsKeyword = (title: string, keyword: string): boolean => {
  const normalizedTitle = normalizeTitle(title);
  const normalizedKeyword = normalizeTitle(keyword);
  return normalizedTitle.includes(normalizedKeyword);
};

/**
 * Extract year from title if present
 * e.g., "World War II (1939-1945)" -> 1939
 */
export const extractYearFromTitle = (title: string): number | null => {
  // Match 4-digit years (1000-2999)
  const yearMatch = title.match(/\b([12]\d{3})\b/);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10);
  }
  return null;
};

/**
 * Match Wikipedia article title to Firestore event
 *
 * Scoring:
 * - Exact match (normalized): 100 points
 * - High similarity (>0.8): 80-99 points
 * - Keyword match in event text: +20 points
 * - Year match: +10 points
 * - Similarity (0.5-0.8): 50-79 points
 * - Below 0.5: 0 points
 */
export type TitleMatchScore = {
  score: number;
  similarity: number;
  exactMatch: boolean;
  yearMatch: boolean;
  keywordMatch: boolean;
};

export const matchTitle = (
  wikipediaTitle: string,
  eventText: string,
  eventYear?: number
): TitleMatchScore => {
  const normalizedWiki = normalizeTitle(wikipediaTitle);
  const normalizedEvent = normalizeTitle(eventText);

  // Calculate base similarity
  const similarity = calculateSimilarity(normalizedWiki, normalizedEvent);

  let score = 0;
  let exactMatch = false;
  let yearMatch = false;
  let keywordMatch = false;

  // Exact match (normalized)
  if (normalizedWiki === normalizedEvent) {
    score = 100;
    exactMatch = true;
  }
  // High similarity
  else if (similarity > 0.8) {
    score = Math.floor(80 + similarity * 20);
  }
  // Medium similarity
  else if (similarity >= 0.5) {
    score = Math.floor(50 + similarity * 30);
  }
  // Low similarity - no match
  else {
    score = 0;
  }

  // Keyword bonus
  if (containsKeyword(eventText, wikipediaTitle)) {
    keywordMatch = true;
    score += 20;
  }

  // Year match bonus
  const wikiYear = extractYearFromTitle(wikipediaTitle);
  if (wikiYear && eventYear && Math.abs(wikiYear - eventYear) <= 1) {
    yearMatch = true;
    score += 10;
  }

  return {
    score: Math.min(score, 100), // Cap at 100
    similarity,
    exactMatch,
    yearMatch,
    keywordMatch,
  };
};

/**
 * Find best matching event from a list
 * Returns null if no good match (score < 50)
 */
export const findBestMatch = <T extends { text?: string; year?: number }>(
  wikipediaTitle: string,
  events: T[],
  minScore: number = 50
): { event: T; match: TitleMatchScore } | null => {
  let bestMatch: { event: T; match: TitleMatchScore } | null = null;
  let bestScore = minScore - 1;

  for (const event of events) {
    if (!event.text) continue;

    const match = matchTitle(wikipediaTitle, event.text, event.year);

    if (match.score > bestScore) {
      bestScore = match.score;
      bestMatch = { event, match };
    }
  }

  return bestMatch;
};
