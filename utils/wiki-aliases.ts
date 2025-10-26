/**
 * Wikipedia Article Aliases
 * Manual mapping for cases where fuzzy matching fails
 */

import aliasData from '@/scripts/ingest/wiki-aliases.json';

export type WikiAlias = {
  wikipediaTitle: string; // URL-encoded Wikipedia title
  eventId: string; // Firestore event ID
  reason: string; // Documentation
  addedAt: string; // ISO date
};

type AliasTable = {
  aliases: WikiAlias[];
};

/**
 * Load alias table from JSON
 */
const loadAliasTable = (): Map<string, string> => {
  const table = new Map<string, string>();
  const data = aliasData as AliasTable;

  for (const alias of data.aliases) {
    // Normalize Wikipedia title (lowercase, replace underscores with spaces)
    const normalizedTitle = alias.wikipediaTitle.toLowerCase().replace(/_/g, ' ');
    table.set(normalizedTitle, alias.eventId);
  }

  console.log('[WikiAliases] Loaded alias table', { count: table.size });
  return table;
};

// Singleton instance
let aliasTableInstance: Map<string, string> | null = null;

/**
 * Get alias table (singleton)
 */
export const getAliasTable = (): Map<string, string> => {
  if (!aliasTableInstance) {
    aliasTableInstance = loadAliasTable();
  }
  return aliasTableInstance;
};

/**
 * Look up event ID by Wikipedia title
 * @param wikipediaTitle - Wikipedia article title (can be URL-encoded or decoded)
 * @returns Event ID if found, null otherwise
 */
export const lookupAlias = (wikipediaTitle: string): string | null => {
  const table = getAliasTable();

  // Normalize input (lowercase, replace underscores with spaces)
  const normalizedTitle = wikipediaTitle.toLowerCase().replace(/_/g, ' ');

  return table.get(normalizedTitle) ?? null;
};

/**
 * Check if Wikipedia title has an alias
 */
export const hasAlias = (wikipediaTitle: string): boolean => {
  return lookupAlias(wikipediaTitle) !== null;
};

/**
 * Get all aliases (for debugging/admin)
 */
export const getAllAliases = (): WikiAlias[] => {
  const data = aliasData as AliasTable;
  return data.aliases;
};

/**
 * Get alias count (for debugging/admin)
 */
export const getAliasCount = (): number => {
  return getAliasTable().size;
};
