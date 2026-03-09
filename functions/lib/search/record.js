"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAlgoliaSearchRecord = void 0;
const stripHtml = (value) => {
    if (!value) {
        return "";
    }
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};
const resolvePrimaryPage = (event) => {
    var _a;
    const pages = Array.isArray(event.relatedPages) ? event.relatedPages : [];
    return ((_a = pages.find((page) => {
        var _a, _b;
        return ((_a = page.selectedMedia) === null || _a === void 0 ? void 0 : _a.sourceUrl) ||
            ((_b = page.thumbnails) === null || _b === void 0 ? void 0 : _b.some((asset) => typeof asset.sourceUrl === "string" && asset.sourceUrl.length > 0));
    })) !== null && _a !== void 0 ? _a : pages[0]);
};
const resolveImageUrl = (page) => {
    var _a, _b, _c, _d, _e;
    if (!page) {
        return undefined;
    }
    if ((_a = page.selectedMedia) === null || _a === void 0 ? void 0 : _a.sourceUrl) {
        return (_b = page.selectedMedia.sourceUrl) !== null && _b !== void 0 ? _b : undefined;
    }
    return (_e = (_d = (_c = page.thumbnails) === null || _c === void 0 ? void 0 : _c.find((asset) => asset.sourceUrl)) === null || _d === void 0 ? void 0 : _d.sourceUrl) !== null && _e !== void 0 ? _e : undefined;
};
const coerceTimestamp = (value) => {
    if (!value) {
        return undefined;
    }
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "object") {
        const withToDate = value;
        if (typeof withToDate.toDate === "function") {
            return withToDate.toDate().toISOString();
        }
        const withSeconds = value;
        if (typeof withSeconds.seconds === "number") {
            return new Date(withSeconds.seconds * 1000).toISOString();
        }
    }
    return undefined;
};
const buildSearchableText = (event) => {
    const buffer = [];
    const pages = Array.isArray(event.relatedPages) ? event.relatedPages : [];
    if (event.text)
        buffer.push(stripHtml(event.text));
    if (event.summary)
        buffer.push(stripHtml(event.summary));
    if (Array.isArray(event.tags)) {
        buffer.push(...event.tags.map((tag) => stripHtml(tag)));
    }
    for (const page of pages) {
        if (page.displayTitle)
            buffer.push(stripHtml(page.displayTitle));
        if (page.canonicalTitle)
            buffer.push(stripHtml(page.canonicalTitle));
        if (page.normalizedTitle)
            buffer.push(stripHtml(page.normalizedTitle));
        if (page.description)
            buffer.push(stripHtml(page.description));
        if (page.extract)
            buffer.push(stripHtml(page.extract));
    }
    return buffer.filter(Boolean).join(" ").trim();
};
const toAlgoliaSearchRecord = (event) => {
    var _a, _b;
    if (!event.eventId) {
        return null;
    }
    const primaryPage = resolvePrimaryPage(event);
    const title = stripHtml(primaryPage === null || primaryPage === void 0 ? void 0 : primaryPage.displayTitle) ||
        stripHtml(primaryPage === null || primaryPage === void 0 ? void 0 : primaryPage.canonicalTitle) ||
        stripHtml(event.summary) ||
        stripHtml(event.text) ||
        "Historic spotlight";
    const summary = stripHtml(event.summary) ||
        stripHtml(event.text) ||
        stripHtml(primaryPage === null || primaryPage === void 0 ? void 0 : primaryPage.extract) ||
        "Tap to open the full story.";
    return {
        objectID: event.eventId,
        eventId: event.eventId,
        title,
        summary,
        searchableText: buildSearchableText(event),
        tags: Array.isArray(event.tags) ? event.tags : [],
        categories: Array.isArray(event.categories) ? event.categories : [],
        era: event.era,
        year: event.year,
        month: (_a = event.date) === null || _a === void 0 ? void 0 : _a.month,
        day: (_b = event.date) === null || _b === void 0 ? void 0 : _b.day,
        imageUrl: resolveImageUrl(primaryPage),
        location: stripHtml(primaryPage === null || primaryPage === void 0 ? void 0 : primaryPage.description) || undefined,
        updatedAt: coerceTimestamp(event.updatedAt),
        editorialBoost: 0,
        popularityScore: 0,
    };
};
exports.toAlgoliaSearchRecord = toAlgoliaSearchRecord;
//# sourceMappingURL=record.js.map