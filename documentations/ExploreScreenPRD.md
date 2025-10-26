# Explore Screen PRD

Owner: ilyas / chrono-history  
Dev Partner: Codex  
Platform: React Native (Expo)  
Last updated: 2025-10-22  
Revision history:
- 2025-10-22 ilyas — initial v1 draft circulated for review.
- 2024-06-20 Codex — v1 review and refinement captured in ExploreScreenPRD.md.

> Follow `documentations/NorthStar.md` for global typography, motion, spacing, and accent rules when implementing any Explore interactions.

## 0. Product Goals
- Reduce cognitive load on Explore by consolidating category/era controls into a unified Filter modal and clarifying the default, no-query layout.
- Define the default Explore experience (search bar, filter entry point, Story of the Day, You Might Be Interested) and resilience behavior when search/filters are inactive.
- Specify service contracts, caching layers, state handling, analytics, and QA gates required for Explore modules (Search, Filters, SOTD, YMBI, Results).
- Introduce a Story of the Day surface powered by Wikimedia Pageviews while deciding how Premium upsell (Deep Dive) appears without blocking free exploration.
- Deliver diverse “You Might Be Interested” recommendations that stretch user breadth without repeating Home content or saved items.
- Maintain performance (sub-300 ms cached default render) and accessibility (≥44×44pt targets, VO labels, AA contrast) while honoring NorthStar calm-design principles.

### Non-Goals
- Redesigning the Explore infinite scroll experience beyond the filter-driven result layout required here.
- Building or modifying payment infrastructure; this feature only consumes existing paywall hooks.
- Editing CMS authoring tools used to curate fallback pools.

### Assumptions
- Category and era taxonomies already exist and remain stable for v1; backend will expose matching IDs/labels.
- Base search endpoint and modal plumbing exist (Codex to supply updated UI/telemetry).
- Home PRD remains the canonical reference for premium paywall flows and copy.
- Wikimedia Pageviews integration can run server-side (cron/job) to populate SOTD cache.

## 1. Information Architecture

### 1.1 Entry & Default State (no query, no filters)
1. Top Bar: `Explore` title + helper text (“Search the archive, skim collections, or jump to a date.”)
2. Search Bar (full width)
3. Filter Button (right-aligned with badge; wraps to second line on small widths)
4. Story of the Day (featured card)
5. You Might Be Interested (diverse vertical list)

### 1.2 Active Query and/or Filters
1. Search Bar (shows query text)
2. Filter Button (badge `Filters • {count}` while filters active)
3. Results List (cards sorted by relevance; optional Recent toggle if surfaced)
4. Optional: Story of the Day lightweight banner below result list (A/B flag)

### 1.3 Navigation & Surface Switching
- Route: `/explore` (tab entry + deep links from Home modules, notifications, or paywall flows).
- Card tap pushes the shared Card Detail view (reuse expand/push navigation).
- “See more” from Story of the Day and YMBI deep-links to Explore with pre-applied filters.
- `Continue reading` or `Deep Dive` actions respect existing entitlement logic.

## 2. Modules & Interaction Details

### 2.1 Search Bar
- Placeholder: “Search events, people, or themes”.
- Debounced input (300–400 ms) for type-ahead; explicit keyboard search submits immediately.
- Clear button resets state to default Explore layout (SOTD + YMBI) and clears filters.
- VoiceOver: announce placeholder, hint for search, and “Clear search” action.
- Prefetch first page as soon as a query length ≥2 persists after debounce.

### 2.2 Filters (Button + Modal)
- Button: sits inline with search on wide layouts; on compact widths, wraps beneath search with consistent spacing. Badge shows active filter count (`Filters • N`).
- Modal: bottom sheet (mobile) or full-screen if sheet conflicts with keyboard; includes scrim + swipe-to-dismiss.
  - **Categories**: multi-select pills (3-column grid) using taxonomy order; include “All” default for clarity.
  - **Era**: single-select list (recommended for v1 to match backend); support optional range chips once backend exposes ranges.
  - **Future extensions (v2)**: Geography, Content type, Reading length (parked, but leave design affordance in sheet spacing).
- Actions: Reset (ghost button) clears all selections and restores default Explore state; Apply (primary) commits and dismisses modal.
- Apply behavior: triggers search refetch; if no query present, request curated filtered set. Always ensure non-empty results by falling back to curated lists.
- Dismiss without Apply should not persist changes.

### 2.3 Story of the Day (SOTD)
- Purpose: highlight a culturally relevant story using Wikimedia Pageviews.
- Data pipeline:
  - Fetch top pages for current day (fallback to previous day if unavailable).
  - Normalize titles and attempt to match to internal event IDs (alias table, slug normalization, manual overrides).
  - Cache matched payload for 24 h; fallback to last successful result, then to local editorial seed.
- Content states:
  - **Matched event**: show standard card data plus SOTD ribbon.
  - **Unmatched article**: display generic SOTD card linking to in-app web view or unmatched template.
  - **Fallback**: “Editor’s pick of the day” card from seeded pool.
- UI: 16:9 image, title, 1–2 line blurb, `Read` CTA; optional ribbon “Story of the Day”.
- Premium model (Option A): Surface “Deep Dive” CTA inside detail; free users see locked module with paywall trigger, premium users see full timeline/context.
- Telemetry: emit impression, open, deep dive CTA/viewed events per §8.

### 2.4 You Might Be Interested (YMBI)
- Goal: broaden exploration beyond user-selected interests.
- Heuristic inputs (v1): user’s least-engaged categories, global trending, evergreen sets, and Home exclusions.
- Constraints: ensure at least three categories represented; cap 1–2 cards per category; avoid recently viewed/saved duplicates; shuffling while respecting 6–8 card output (2–3 on compact by chunking into rows).
- Behavior: tapping a card opens detail; long-press “Not interested” hides similar category/content for 7 days locally.
- “See more” navigates to Explore pre-filtered for underlying rationale (log instrumentation).

### 2.5 Results List & Pagination
- Default sort: Relevance; optional toggle to `Recent` (A/B). Persist last choice per session.
- Use paginated endpoint with `nextCursor`; prefetch next page when user scroll position ≥70% of current list.
- When results are active, SOTD/YMBI shift below the fold unless explicitly pinned via experiment.

### 2.6 Shared Card Behavior
- Reuse global Card component styles and interactions (save, share, read progress).
- Ensure cards announce section context for accessibility (e.g., “You Might Be Interested, card 1 of 6”).

## 3. Data & API Contracts

### Shared Card Shape
```ts
type Card = {
  id: string;
  title: string;
  subtitle?: string;
  year: number;
  dateISO?: string;
  imageUrl: string;
  categoryIds: string[];
  eraId?: string;
  readProgress?: number; // 0..1
  isSaved?: boolean;
};
```

### Search
`GET /explore/search?q=&categories=&era=&sort=relevance|recent&cursor=`
→ `{ items: Card[]; total: number; nextCursor?: string }`

### Taxonomy
- `GET /taxonomy/categories` → `{ items: { id: string; label: string; description?: string }[] }`
- `GET /taxonomy/eras` → `{ items: { id: string; label: string; range?: [number, number] }[] }`
- Version these responses so cached lists can invalidate when taxonomy updates (e.g., `etag` header).

### Story of the Day
`GET /explore/sotd`
```ts
type SOTDResponse = {
  id: string;          // internal event id if matched, otherwise external key
  title: string;
  blurb?: string;
  imageUrl?: string;
  matched: boolean;
  source: "wikimedia" | "seed";
  dateISO?: string;
};
```
- `POST /explore/sotd/deep-dive-open` captures analytics for CTA usage (authorized via standard token).

### You Might Be Interested
`GET /explore/ymbi?limit=8`
```ts
type YMBIResponse = {
  items: Card[];
  rationale?: string; // optional debug surface (omit in prod payload)
};
```

## 4. State, Cache & Performance
- **SOTD**: 24 h cache; fallback sequence → last successful response → local seed. Cache bust daily at 00:30 UTC after cron refresh.
- **YMBI**: cache per user for 6 h; maintain shuffled order while preventing duplicates within 48 h window.
- **Search Results**: paginate via cursor; prefetch next page once scroll threshold met; recycle cards with `windowSize=6` to preserve memory.
- **Filter lists**: cache taxonomy for 7 days unless version/etag changes; store locally for offline warm start.
- **Images**: prefetch hero imagery when card enters viewport using Expo image caching; degrade gracefully on slow networks.
- **Performance budget**: default Explore render using cached SOTD/YMBI in <300 ms; maintain ≥55 FPS on mid-tier devices during scroll.

## 5. Empty, Error & Loading States
- No query + no filters: show SOTD + YMBI default layout.
- Search/filter yields zero results: display empty state copy (“No matches found. Try fewer filters.”) + fallback chips (2 suggestions) + “Broaden filters” CTA.
- SOTD fetch error: render fallback seed card labeled “Editor’s pick”.
- YMBI error: render 3 curated “popular classic” cards with neutral styling.
- Skeletons: show 3–5 skeleton rows for search results and YMBI while loading.
- Maintain analytics for empty/error events to monitor data quality.

## 6. Monetization & Premium Hooks (SOTD)
- Adopt Option A: SOTD article is fully readable; Deep Dive module gates premium context (timeline, before/after, related events).
- Premium users see unlocked Deep Dive with mini timeline (3–6 nodes), related events list, and “Before/After” toggles.
- Free users see the section ghosted with a lock icon and “Unlock Deep Dive” CTA; pressing triggers existing paywall hook.
- Ensure messaging mirrors Time Machine tone (“Unlock Deep Dives for richer context and timelines.”).
- Track impression/CTA/paywall events per analytics spec.

## 7. UI & Interaction Specs
- **Top Bar**: Serif title, helper text subtitle, align spacing with Home per NorthStar. Respect safe-area padding.
- **Search + Filters**: search bar full width; filter button transitions between inline and wrap states with 220 ms ease; badge animates on count change.
- **Filter Modal**: bottom sheet rises 220 ms with scrim fade; Reset slides selections back to defaults with subtle scale-down; Apply triggers haptic light impact.
- **SOTD Card**: 16:9 image, optional ribbon, CTA row. In detail view, Deep Dive section expands/collapses with 200 ms easing; locked state uses translucent overlay per NorthStar accent rules.
- **YMBI List**: header “You Might Be Interested”, cards interleaved by category to maximize diversity; support vertical list on mobile and chunked layout for tablet.
- **Accessibility**: VO labels include section names; filter controls announce selection state; all tap targets ≥44×44pt; ensure color contrast meets AA.

## 8. Analytics & Telemetry
- `explore_opened { source: "tab" | "deeplink" }`
- `explore_search_typed { q_len, submitted: boolean }`
- `explore_filters_opened`
- `explore_filters_applied { categories_count, era_selected }`
- `sotd_shown { source: "wikimedia" | "seed", matched: boolean }`
- `sotd_opened { matched: boolean }`
- `sotd_deep_dive_cta_clicked { user_tier }`
- `sotd_deep_dive_viewed { user_tier }`
- `ymbi_shown { count }`
- `ymbi_card_opened { card_id, category_id }`
- `explore_no_results { q_len, categories_count, era_selected }`
- North-star metrics: SOTD open-through rate (impressions → opens), Deep Dive CTA → paywall conversion, YMBI CTR + dwell, filter usage per session.

## 9. QA / Acceptance Criteria
- Search bar supports debounced typing and explicit submit; clearing resets layout to SOTD + YMBI.
- Filter modal supports multi-select categories + single-select era, shows accurate badge counts, and Reset restores defaults.
- SOTD service fetches, matches to internal events when available, and falls back correctly on failures (last success → seed).
- Deep Dive section respects premium/free entitlements and triggers existing paywall hook for locked users.
- YMBI surfaces 6–8 cards spanning ≥3 categories, suppresses duplicates from Home today, and honors “Not interested” suppression for 7 days.
- When query or filters are active, results occupy the primary viewport; pagination + prefetch operate without duplicate cards.
- Accessibility audits confirm ≥44×44pt targets, VO labels, and AA contrast.
- Performance checks show cached default render <300 ms and scroll ≥55 FPS on target devices.

## 10. Technical Tasks (Codex)
- Build Explore scaffold: sectioned list that renders default (Search + Filters → SOTD → YMBI) and transitions to results view when applicable.
- Implement Filter modal (bottom sheet) with category pills, era selector, Reset/Apply actions, state persistence, and badge updates.
- Deliver SOTD service: Wikimedia Pageviews client, title matching, caching, fallback, and `/explore/sotd` endpoint.
- Ship SOTD UI: featured card, detail view with Deep Dive container, analytics wiring, and premium/paywall hook integration.
- Implement YMBI service heuristics + caching and expose `/explore/ymbi?limit=8` endpoint.
- Instrument telemetry per §8 and ensure analytics fire exactly once per impression/interaction.
- Add snapshot + integration tests covering filter modal behavior, SOTD fallback chain, YMBI diversity/suppression, and results pagination.

## 11. Copy (Draft)
- Explore helper: “Search the archive, skim collections, or jump to a date.”
- Filter button: “Filters” / badge “Filters • N”.
- Modal actions: “Reset” / “Apply”.
- SOTD ribbon: “Story of the Day”.
- Deep Dive CTA (free): “Unlock Deep Dive”.
- YMBI header: “You Might Be Interested”.
- Empty results: “No matches found. Try fewer filters.”
- Editor fallback (SOTD): “Editor’s pick of the day”.

## 12. Open Questions & Follow-Ups
- Confirm whether the backend can expose era ranges; if not, ship single-select list for v1 and log follow-up for range support.
- Decide whether SOTD should remain visible (banner) when results are active—recommend controlled experiment once baseline engagement known.
- Validate YMBI per-category cap (1 vs 2 items) with data; default to 2 until diversity metrics suggest otherwise.
- Explore “Jump to date” quick-picker inside Filter modal (v2 candidate) once base search KPIs stabilize.
- Align on cadence/owner for SOTD alias table maintenance to ensure high match rate.

---

## 13. Implementation Roadmap

**Last Updated**: 2025-10-24
**Status**: Sprint 1 Complete, Sprint 2 Ready

### Technical Decisions
- **Backend**: Firebase Cloud Functions (TypeScript)
- **Pagination**: Cursor-based with backend API
- **Alias Table**: JSON file + ingestion script
- **Caching**: AsyncStorage for client-side (SOTD 24h, YMBI 6h)

### Sprint 1: Backend Pagination ✅ COMPLETED
**Timeline**: 3-4 days
**Status**: 🟢 Completed (2025-10-24)

**Goals**:
- Implement cursor-based pagination with backend API
- Support infinite scroll in results view
- Replace client-side slice(0, 20) limitation

**Tasks**:
- [x] MVP Implementation (Sprint 1-5, October 2024)
- [x] 1.1: Firebase Functions setup
- [x] 1.2: `/api/explore/search` endpoint (cursor pagination, filters, text search)
- [x] 1.3: Client pagination state & scroll handler
- [x] 1.4: Testing & analytics (`explore_pagination_loaded`)
- [x] 1.5: Update PRD with completion status

**Deliverables**:
- ✅ `/api/explore/search?q=&categories=&era=&cursor=` endpoint
- ✅ Infinite scroll in Explore results (70% scroll threshold)
- ✅ Analytics tracking for pagination events
- ✅ Loading indicator during pagination

**Implementation Notes**:
- API base URL configured for development/production
- Pagination state managed with cursor, hasMore, loading flags
- Duplicate prevention via loadedIds Set
- ScrollView throttle set to 400ms for performance
- Falls back to digestEvents for date picker when not searching

**Files Modified**:
- `functions/src/api/explore/search.ts` - Search endpoint
- `app/(tabs)/explore.tsx` - Client pagination logic
- `firebase.json` - Functions configuration

---

### Sprint 2: UX Improvements ⏸️ PLANNED
**Timeline**: 2-3 days
**Status**: ⚪ Planned

**Goals**:
- Add "Not Interested" suppression for YMBI (7-day local storage)
- Add "See More" navigation from YMBI
- Implement Relevance/Recent sort toggle

**Tasks**:
- [ ] 2.1: YMBI "Not Interested" with AsyncStorage (7-day TTL)
- [ ] 2.2: YMBI "See More" button with filter navigation
- [ ] 2.3: Relevance/Recent sort toggle with scoring algorithm
- [ ] 2.4: Update PRD

**Deliverables**:
- Long-press "Not Interested" gesture on YMBI cards
- "See More" quick navigation
- Sort toggle UI with analytics

---

### Sprint 3: Wikimedia Integration ⏸️ PLANNED
**Timeline**: 3-4 days
**Status**: ⚪ Planned

**Goals**:
- Replace SOTD stub with real Wikimedia Pageviews API
- Implement title normalization & matching
- Create alias table system for manual overrides

**Tasks**:
- [ ] 3.1: Wikimedia Pageviews API client
- [ ] 3.2: Title normalization & fuzzy matching
- [ ] 3.3: Alias table (JSON + ingestion script)
- [ ] 3.4: Update `fetchSOTDFromWikimedia()` implementation
- [ ] 3.5: Data migration (add `normalizedTitle` to contentEvents)
- [ ] 3.6: Update PRD

**Deliverables**:
- Real-time trending Wikipedia articles as SOTD
- `scripts/ingest/wiki-aliases.json` with manual mappings
- Fallback for unmatched articles

---

### Sprint 4: Premium Features 🔒 BLOCKED
**Timeline**: 2 weeks (blocked by subscription system)
**Status**: ⚪ Blocked (Requires paywall infrastructure)

**Goals**:
- Deep Dive module for premium users
- Paywall integration for free users
- Premium analytics tracking

**Blockers**:
- Subscription system (RevenueCat/Stripe) not implemented
- `Users/{uid}.isPremium` field not available
- Paywall modal component missing

---

### Current MVP Status: ~90% Complete

**✅ Completed**:
- Search with debouncing (350ms)
- Filter modal (categories multi-select, era single-select)
- Story of the Day (24h cache, Firestore → Wikimedia stub → Seed fallback)
- You Might Be Interested (6h cache, diversity algorithm)
- Conditional layout (Default: SOTD + YMBI / Active: Results)
- Analytics (11 events tracked: +search_results_loaded, +pagination_loaded)
- Accessibility (≥44pt targets, VO labels, AA contrast)
- **Backend pagination with infinite scroll (Sprint 1 ✅)**

**⚪ Planned**:
- UX improvements (Sprint 2)
- Wikimedia integration (Sprint 3)
- Backend API migration for SOTD/YMBI (future)

**🔒 Blocked**:
- Premium Deep Dive module (requires subscription system)
- Paywall hooks
- Advanced admin features

---

### Known Issues & Workarounds
1. **Pagination Limited to 20 Results**
   - **Issue**: Client-side `slice(0, 20)` in explore.tsx:829
   - **Workaround**: Sprint 1 implementing backend pagination
   - **ETA**: Sprint 1 completion

2. **Wikimedia SOTD is Stub**
   - **Issue**: `fetchSOTDFromWikimedia()` returns null
   - **Workaround**: Falls back to seed data
   - **ETA**: Sprint 3 completion

3. **No "Not Interested" Feature**
   - **Issue**: Users can't hide YMBI content
   - **Workaround**: N/A
   - **ETA**: Sprint 2 completion

---

Keep this document in sync as Explore design/implementation evolves. Reference `documentations/NorthStar.md` before introducing new interactions or motion treatments.
