/**
 * Wikipedia Article Aliases
 * Manual mapping for cases where fuzzy matching fails
 */

export type WikiAlias = {
  wikipediaTitle: string; // URL-encoded Wikipedia title
  eventId: string; // Firestore event ID
  reason: string; // Documentation
  addedAt: string; // ISO date
};

type AliasTable = {
  aliases: WikiAlias[];
};

// Inline alias data to avoid JSON import issues in React Native
const aliasData: AliasTable = {
  aliases: [
    {
      wikipediaTitle: 'World_War_II',
      eventId: 'event-1939-world-war-2-begins',
      reason: 'Common alternate name',
      addedAt: '2025-10-27',
    },
    {
      wikipediaTitle: 'Second_World_War',
      eventId: 'event-1939-world-war-2-begins',
      reason: 'British English variant',
      addedAt: '2025-10-27',
    },
    {
      wikipediaTitle: 'Albert_Einstein',
      eventId: 'event-1879-einstein-birth',
      reason: 'Famous physicist',
      addedAt: '2025-10-27',
    },
    {
      wikipediaTitle: 'Moon_landing',
      eventId: 'event-1969-apollo-11-moon-landing',
      reason: 'Common search term',
      addedAt: '2025-10-27',
    },
    {
      wikipediaTitle: 'Apollo_11',
      eventId: 'event-1969-apollo-11-moon-landing',
      reason: 'Mission name',
      addedAt: '2025-10-27',
    },
  ],
};

/**
 * Load alias table from JSON
 */
const loadAliasTable = (): Map<string, string> => {
  const table = new Map<string, string>();

  for (const alias of aliasData.aliases) {
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
  return aliasData.aliases;
};

/**
 * Get alias count (for debugging/admin)
 */
export const getAliasCount = (): number => {
  return getAliasTable().size;
};
