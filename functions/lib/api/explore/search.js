"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreSearch = exploreSearch;
const index_1 = require("../../index");
/**
 * Calculate relevance score for an event
 */
function calculateRelevanceScore(event, query, selectedCategories) {
    var _a;
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
        else if ((_a = event.tags) === null || _a === void 0 ? void 0 : _a.some((tag) => tag.toLowerCase().includes(queryLower))) {
            score += 20;
        }
    }
    // Category match bonus (0-30 points)
    if (selectedCategories.length > 0 && event.categories) {
        const matchCount = event.categories.filter((cat) => selectedCategories.includes(cat)).length;
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
async function exploreSearch(request, response) {
    try {
        // Parse query parameters
        const params = {
            q: request.query.q || "",
            categories: request.query.categories || "",
            era: request.query.era || undefined,
            month: request.query.month ? parseInt(request.query.month, 10) : undefined,
            day: request.query.day ? parseInt(request.query.day, 10) : undefined,
            sort: request.query.sort || "relevance",
            cursor: request.query.cursor || undefined,
            limit: parseInt(request.query.limit || "20", 10),
        };
        // Validate limit
        if (params.limit && (params.limit < 1 || params.limit > 50)) {
            response.status(400).json({ error: "Limit must be between 1 and 50" });
            return;
        }
        // Validate month and day
        if (params.month !== undefined && (params.month < 1 || params.month > 12)) {
            response.status(400).json({ error: "Month must be between 1 and 12" });
            return;
        }
        if (params.day !== undefined && (params.day < 1 || params.day > 31)) {
            response.status(400).json({ error: "Day must be between 1 and 31" });
            return;
        }
        console.log("[Search API] Request params:", Object.assign(Object.assign({}, params), { hasMonth: params.month !== undefined, hasDay: params.day !== undefined, hasEra: !!params.era, hasCategories: !!params.categories }));
        // Get Firestore instance
        const db = (0, index_1.getDb)();
        // Parse category array early for query building
        const categoryArray = params.categories
            ? params.categories.split(",").filter(Boolean)
            : [];
        // Build Firestore query - CRITICAL ORDER: where() filters BEFORE orderBy()
        let firestoreQuery = db.collection("contentEvents");
        // STEP 1: Apply month/day filters FIRST (if provided)
        if (params.month !== undefined && params.day !== undefined) {
            console.log("[Search API] Applying month/day filters:", {
                month: params.month,
                day: params.day,
            });
            firestoreQuery = firestoreQuery
                .where("date.month", "==", params.month)
                .where("date.day", "==", params.day);
        }
        else if (params.month !== undefined) {
            // Month only (unlikely, but handle it)
            firestoreQuery = firestoreQuery.where("date.month", "==", params.month);
        }
        else if (params.day !== undefined) {
            // Day only (unlikely, but handle it)
            firestoreQuery = firestoreQuery.where("date.day", "==", params.day);
        }
        // STEP 2: Apply era filter (if provided)
        if (params.era) {
            console.log("[Search API] Applying era filter:", params.era);
            firestoreQuery = firestoreQuery.where("era", "==", params.era);
        }
        // STEP 3: Apply category filter (single category only - multi handled client-side)
        // Note: Firestore doesn't support 'array-contains-any' with other filters
        if (categoryArray.length === 1) {
            console.log("[Search API] Applying single category filter:", categoryArray[0]);
            firestoreQuery = firestoreQuery.where("categories", "array-contains", categoryArray[0]);
        }
        // STEP 4: Apply orderBy (MUST come after all where() clauses)
        firestoreQuery = firestoreQuery
            .orderBy("year", "desc")
            .orderBy("__name__", "desc"); // Required for cursor pagination
        console.log("[Search API] Query structure built, applying cursor and limit");
        // STEP 5: Apply cursor pagination (if provided)
        if (params.cursor) {
            const cursorDoc = await db
                .collection("contentEvents")
                .doc(params.cursor)
                .get();
            if (cursorDoc.exists) {
                firestoreQuery = firestoreQuery.startAfter(cursorDoc);
            }
            else {
                console.warn("[Search API] Cursor document not found:", params.cursor);
            }
        }
        // STEP 6: Apply limit
        const requestedLimit = params.limit || 20;
        const fetchLimit = Math.min(requestedLimit + 1, 51); // Max 50 results + 1 for hasMore
        if (categoryArray.length > 1) {
            // Multi-category: fetch limited set and filter client-side
            // Limit to 50 to prevent timeout
            console.log("[Search API] Multi-category mode, fetching up to 50 for client-side filtering");
            firestoreQuery = firestoreQuery.limit(50);
        }
        else {
            firestoreQuery = firestoreQuery.limit(fetchLimit);
        }
        // Timeout protection: max 8 seconds
        const QUERY_TIMEOUT_MS = 8000;
        const fetchWithTimeout = async () => {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Query timeout after 8s")), QUERY_TIMEOUT_MS);
            });
            const queryPromise = firestoreQuery.get();
            return Promise.race([queryPromise, timeoutPromise]);
        };
        const snapshot = await fetchWithTimeout();
        console.log("[Search API] Fetched documents:", snapshot.size);
        // Map documents to events
        let events = snapshot.docs.map((doc) => {
            const data = doc.data();
            return Object.assign(Object.assign({}, data), { eventId: doc.id });
        });
        // Client-side filtering for multi-category or text search
        if (categoryArray.length > 1) {
            events = events.filter((event) => { var _a; return (_a = event.categories) === null || _a === void 0 ? void 0 : _a.some((cat) => categoryArray.includes(cat)); });
        }
        // Text search (case-insensitive, searches in text, summary, tags)
        if (params.q && params.q.length > 0) {
            const queryLower = params.q.toLowerCase();
            events = events.filter((event) => {
                var _a, _b, _c;
                const textMatch = (_a = event.text) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(queryLower);
                const summaryMatch = (_b = event.summary) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(queryLower);
                const tagsMatch = (_c = event.tags) === null || _c === void 0 ? void 0 : _c.some((tag) => tag.toLowerCase().includes(queryLower));
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
        }
        else {
            // "recent" mode: already sorted by year desc from Firestore
            // No additional sorting needed
        }
        // Determine next cursor and slice results
        const hasMore = events.length > requestedLimit;
        const items = events.slice(0, requestedLimit);
        const nextCursor = hasMore && items.length > 0
            ? items[items.length - 1].eventId
            : undefined;
        const searchResponse = {
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
    }
    catch (error) {
        console.error("[Search API] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const isIndexError = errorMessage.includes("FAILED_PRECONDITION") ||
            errorMessage.includes("requires an index") ||
            errorMessage.includes("index");
        if (isIndexError) {
            console.error("[Search API] INDEX REQUIRED - Query params:", {
                month: request.query.month,
                day: request.query.day,
                era: request.query.era,
                categories: request.query.categories,
            });
            response.status(503).json({
                error: "Index building",
                message: "Database indexes are being prepared. Please try again in a few minutes.",
                retryAfter: 60,
            });
            return;
        }
        response.status(500).json({
            error: "Internal server error",
            message: errorMessage,
        });
    }
}
//# sourceMappingURL=search.js.map