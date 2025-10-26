"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreSearch = exploreSearch;
const index_1 = require("../../index");
/**
 * Search API endpoint for Explore page
 * GET /api/explore/search?q=&categories=&era=&cursor=&limit=
 */
async function exploreSearch(request, response) {
    try {
        // Parse query parameters
        const params = {
            q: request.query.q || "",
            categories: request.query.categories || "",
            era: request.query.era || undefined,
            cursor: request.query.cursor || undefined,
            limit: parseInt(request.query.limit || "20", 10),
        };
        // Validate limit
        if (params.limit && (params.limit < 1 || params.limit > 50)) {
            response.status(400).json({ error: "Limit must be between 1 and 50" });
            return;
        }
        console.log("[Search API] Request params:", params);
        // Build Firestore query
        let firestoreQuery = index_1.db
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
            const cursorDoc = await index_1.db
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
        // Determine next cursor and slice results
        const hasMore = events.length > (params.limit || 20);
        const items = events.slice(0, params.limit || 20);
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
        response.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
//# sourceMappingURL=search.js.map