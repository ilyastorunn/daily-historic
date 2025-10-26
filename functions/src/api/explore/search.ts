import {Request, Response} from "firebase-functions";
import {db} from "../../index";
import {
  SearchRequest,
  SearchResponse,
  EraOption,
  FirestoreEventDocument,
  SortOption,
} from "../../types";

/**
 * Calculate relevance score for an event
 */
function calculateRelevanceScore(
  event: FirestoreEventDocument,
  query: string,
  selectedCategories: string[]
): number {
  let score = 0;

  // Text match scoring (0-50 points)
  if (query.length > 0) {
    const queryLower = query.toLowerCase();
    const textLower = (event.text || "").toLowerCase();
    const summaryLower = (event.summary || "").toLowerCase();

    // Exact match in text: 50 points
    if (textLower.includes(queryLower)) {
      score += 50;
    }
    // Exact match in summary: 30 points
    else if (summaryLower.includes(queryLower)) {
      score += 30;
    }
    // Tag match: 20 points
    else if (event.tags?.some((tag) => tag.toLowerCase().includes(queryLower))) {
      score += 20;
    }
  }

  // Category match bonus (0-30 points)
  if (selectedCategories.length > 0 && event.categories) {
    const matchCount = event.categories.filter((cat) =>
      selectedCategories.includes(cat)
    ).length;
    score += matchCount * 15; // 15 points per matching category
  }

  // Recency boost (0-20 points)
  // Events from 1900+ get more points, scaled logarithmically
  if (event.year >= 1900) {
    const yearsSince1900 = event.year - 1900;
    score += Math.min(20, Math.log10(yearsSince1900 + 1) * 5);
  }

  return score;
}

/**
 * Search API endpoint for Explore page
 * GET /api/explore/search?q=&categories=&era=&sort=&cursor=&limit=
 */
export async function exploreSearch(
  request: Request,
  response: Response
): Promise<void> {
  try {
    // Parse query parameters
    const params: SearchRequest = {
      q: (request.query.q as string) || "",
      categories: (request.query.categories as string) || "",
      era: (request.query.era as EraOption) || undefined,
      sort: (request.query.sort as SortOption) || "relevance",
      cursor: (request.query.cursor as string) || undefined,
      limit: parseInt((request.query.limit as string) || "20", 10),
    };

    // Validate limit
    if (params.limit && (params.limit < 1 || params.limit > 50)) {
      response.status(400).json({error: "Limit must be between 1 and 50"});
      return;
    }

    console.log("[Search API] Request params:", params);

    // Build Firestore query
    let firestoreQuery = db
      .collection("contentEvents")
      .orderBy("year", "desc");

    // Apply era filter
    if (params.era) {
      firestoreQuery = firestoreQuery.where("era", "==", params.era);
    }

    // Apply category filter (if single category)
    // Note: Firestore doesn't support 'array-contains-any' with other filters
    // For multiple categories, we'll filter client-side after fetching
    const categoryArray = params.categories
      ? params.categories.split(",").filter(Boolean)
      : [];

    if (categoryArray.length === 1) {
      firestoreQuery = firestoreQuery
        .where("categories", "array-contains", categoryArray[0]);
    }

    // Apply cursor pagination
    if (params.cursor) {
      const cursorDoc = await db
        .collection("contentEvents")
        .doc(params.cursor)
        .get();

      if (cursorDoc.exists) {
        firestoreQuery = firestoreQuery.startAfter(cursorDoc);
      }
    }

    // Fetch with +1 to determine if there are more results
    const fetchLimit = (params.limit || 20) + 1;
    firestoreQuery = firestoreQuery.limit(fetchLimit);

    const snapshot = await firestoreQuery.get();

    console.log("[Search API] Fetched documents:", snapshot.size);

    // Map documents to events
    let events = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        eventId: doc.id,
      } as FirestoreEventDocument;
    });

    // Client-side filtering for multi-category or text search
    if (categoryArray.length > 1) {
      events = events.filter((event) =>
        event.categories?.some((cat) => categoryArray.includes(cat))
      );
    }

    // Text search (case-insensitive, searches in text, summary, tags)
    if (params.q && params.q.length > 0) {
      const queryLower = params.q.toLowerCase();
      events = events.filter((event) => {
        const textMatch = event.text?.toLowerCase().includes(queryLower);
        const summaryMatch = event.summary?.toLowerCase().includes(queryLower);
        const tagsMatch = event.tags?.some((tag) =>
          tag.toLowerCase().includes(queryLower)
        );
        return textMatch || summaryMatch || tagsMatch;
      });
    }

    // Apply sorting
    if (params.sort === "relevance") {
      // Calculate relevance scores and sort
      const scoredEvents = events.map((event) => ({
        event,
        score: calculateRelevanceScore(event, params.q || "", categoryArray),
      }));
      scoredEvents.sort((a, b) => b.score - a.score); // Highest score first
      events = scoredEvents.map((item) => item.event);
    } else {
      // "recent" mode: already sorted by year desc from Firestore
      // No additional sorting needed
    }

    // Determine next cursor and slice results
    const hasMore = events.length > (params.limit || 20);
    const items = events.slice(0, params.limit || 20);
    const nextCursor = hasMore && items.length > 0
      ? items[items.length - 1].eventId
      : undefined;

    const searchResponse: SearchResponse = {
      items,
      nextCursor,
      total: items.length, // Note: This is just current page count
    };

    console.log("[Search API] Response:", {
      itemCount: items.length,
      hasMore,
      nextCursor,
    });

    response.status(200).json(searchResponse);
  } catch (error) {
    console.error("[Search API] Error:", error);
    response.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
