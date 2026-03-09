export type ExploreSearchSortMode = "relevance" | "recent";

export interface ExploreSearchFilters {
  categories?: string[];
  era?: string | null;
  month?: number;
  day?: number;
}

export interface ExploreSearchRequest {
  query: string;
  filters?: ExploreSearchFilters;
  page?: number;
  hitsPerPage?: number;
  sortMode?: ExploreSearchSortMode;
}

const quote = (value: string) => `"${value.replace(/"/g, '\\"')}"`;

export const buildAlgoliaFilters = (filters: ExploreSearchFilters = {}) => {
  const clauses: string[] = [];

  if (filters.categories && filters.categories.length > 0) {
    const categoryClause = filters.categories
      .map((category) => `categories:${quote(category)}`)
      .join(" OR ");
    clauses.push(filters.categories.length > 1 ? `(${categoryClause})` : categoryClause);
  }

  if (filters.era) {
    clauses.push(`era:${quote(filters.era)}`);
  }

  if (typeof filters.month === "number") {
    clauses.push(`month=${filters.month}`);
  }

  if (typeof filters.day === "number") {
    clauses.push(`day=${filters.day}`);
  }

  return clauses.length > 0 ? clauses.join(" AND ") : undefined;
};

export const resolveAlgoliaIndexName = (
  baseIndexName: string,
  sortMode: ExploreSearchSortMode = "relevance"
) => {
  return sortMode === "recent" ? `${baseIndexName}_recent` : baseIndexName;
};

export const buildAlgoliaSearchPayload = (
  request: ExploreSearchRequest,
  baseIndexName: string
) => {
  const filters = buildAlgoliaFilters(request.filters);

  return {
    indexName: resolveAlgoliaIndexName(baseIndexName, request.sortMode),
    payload: {
      query: request.query,
      page: request.page ?? 0,
      hitsPerPage: request.hitsPerPage ?? 10,
      filters,
      attributesToRetrieve: [
        "eventId",
        "title",
        "summary",
        "categories",
        "era",
        "year",
        "month",
        "day",
        "imageUrl",
        "location",
        "updatedAt",
      ],
    },
  };
};
