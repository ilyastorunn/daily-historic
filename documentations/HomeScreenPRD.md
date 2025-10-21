# Home Screen PRD

Owner: ilyas / chrono-history  
Dev Partner: Codex  
Platform: React Native (Expo)  
Last updated: 2025-10-21  
Revision history:
- 2024-06-19 Codex — consolidated requirements for hero carousel, collections, time machine, and chip rail (v1.2 review).

## 0. Product Goals
- Preserve the current hero card visual language while presenting five personalized stories in a swipeable carousel.
- Introduce Weekly Collections as a curated discovery block that links to collection detail and Explore.
- Introduce Time Machine as a premium CTA that previews a guided timeline experience.
- Add a compact Category Chip rail that filters the hero carousel and surfaces a lightweight related strip without competing visually with premium/editorial modules.
- Maintain NorthStar principles: single accent per screen, generous whitespace, calm motion, clear hierarchy, and accessible targets.

### Non-Goals
- Redesign of downstream detail views (event detail, collection detail) beyond navigation hooks needed for this release.
- Changes to Explore architecture beyond the “See all” filter hook.
- Monetization paywall design—the Time Machine block should trigger existing paywall components.

## 1. Information Architecture (Top → Bottom)
1. Hero Carousel (5 personalized cards; existing hero design)
2. Weekly Collections Grid (2×2 tiles + “See all” CTA)
3. Time Machine Premium Block (full-width, two-row height)
4. Category Chip Rail (compact horizontal list + optional “Related now” strip)

> Rationale: preserves the current Hero-first hierarchy, introduces editorial discovery immediately after, positions premium upsell centrally, and keeps quick filters last to avoid visual competition.

## 2. Modules & Interaction Details

### 2.1 Hero Carousel
- **Design**: reuse current hero card layout (year pill, serif headline, two-line summary, actions). Embed in a snap carousel with peek cards.
- **Content**: five personalized events ordered by relevance (default) or by currently selected chip filter.
- **Interaction**: tapping image/title opens the existing event detail with shared expand animation. `Continue`/`Preview` buttons behave as today.
- **Controls**: show pagination (1/5) or pip indicators; allow manual swipe and programmatic scrolling.
- **Performance**: preload adjacent images and detail payloads; debounce chip-driven refetches.
- **Empty/Error**: fall back to current single hero flow with status messaging.
- **Implementation status**: carousel + pagination + chip filtering live (2024-06-19).

### 2.2 Weekly Collections Grid
- **Layout**: 2 columns × 2 rows on phone (4 tiles). Gap ≥16pt; block padding ≥20pt.
- **Tile**: cover image, serif title overlay, soft drop shadow, elevation e-2, radius r-md.
- **Behavior**: tap opens Collection Detail (stack screen) with swipeable pages of cards; `See all` CTA routes to Explore pre-filtered by `collectionId`.
- **Content source**: rotation resets weekly (Mon 00:00 UTC); if fewer than four collections, show available + skeleton/placeholder copy.
- **Empty state**: “Editor’s picks incoming” and fallback popular tags (click opens Explore with matching filter).
- **Implementation status**: grid shell + placeholder navigation live; awaiting backend data hook + detail screen.

### 2.3 Time Machine Block
- **Purpose**: premium upsell into guided timeline (Model A).
- **Design**: full-width block ≈160–200pt tall, fixed illustration background, overlay copy (title + subtitle), premium badge/lock for free users. Radius r-lg, elevation e-2.
- **Behavior**:
  - Premium users: tap opens Time Machine flow, remembers last visited year.
  - Free users: tap shows teaser (1 unlocked event + blurred timeline) and triggers paywall CTA.
  - Entire block is tappable; pressed state scales to 0.98 and dims.
- **State**: loading (faded), disabled (opacity 60% with accessible text), memory of last year stored locally.
- **Haptics**: light impact on press for both tiers.
- **Implementation status**: CTA block live; dedicated `/time-machine` screen renders teaser for free users and premium timeline cards via `useTimeMachine` (2024-06-19). Full premium UX (year picker, context panes) still pending.
  - API integration: Home uses `fetchTimeMachineSeed` / `fetchTimeMachineTimeline` wrappers that hit `/time-machine` endpoints with local fallback.
  - `/time-machine` screen emits `time_machine_started` for premium journeys and `time_machine_paywall_shown` for teaser mode (2024-06-19).

### 2.4 Category Chip Rail (Compact)
- **Layout**: horizontal scroll of outline chips (28–32pt height, 24pt radius). Neutral by default; accent applied to selected chip only.
- **Behavior**:
  - Tap chip → filters hero carousel to matching category set and reveals a “Related now” strip of 2–3 compact cards directly below.
  - Long-press to pin chip as default; persisted to profile/settings.
  - Scroll position resets when selection changes.
- **States**: default, selected (accent fill, white label), disabled; selection animates (120ms scale 1.05 + opacity lift).
- **Implementation status**: chip rail + hero filtering + related strip live; pin persistence still local until profile schema updated.

### 2.5 Related Now Strip (conditional)
- Compact list (horizontal or small vertical stack) that appears only when a chip is selected.
- Content drawn from the same dataset as hero filtered results (top 2–3 items not already shown in hero).
- Should collapse when no chip is selected or when dataset is exhausted.

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

### Hero Carousel
`GET /home/hero?limit=5&prefCategoryIds=a,b,c&chipFilterId?=space`
- Returns `{ items: Card[]; generatedAt: string }`
- Must honor user prefs and optional chip filter; guarantee ≥3 items or flag fallback.
- Include sufficient metadata to display read progress and CTA state without extra calls.

### Weekly Collections
```ts
type Collection = {
  id: string;
  title: string;
  coverUrl: string;
  blurb?: string;
  previewCount?: number;
};
```
Endpoints:
- `GET /home/collections?weekKey=YYYY-WW&limit=4` → `{ items: Collection[] }`
- `GET /collections/:id` → `{ id, title, coverUrl, items: Card[] }`
- Collections should surface `previewCount` to inform skeleton states.

### Time Machine
- `POST /time-machine/seed` → `{ year: number }` (optional for free teaser)
- `GET /time-machine/timeline?year=1986&categories=all` → `{ year, events: TimelineEvent[], before?: TimelineEvent[], after?: TimelineEvent[] }`
```ts
type TimelineEvent = {
  id: string;
  dateISO?: string;
  title: string;
  imageUrl?: string;
  summary: string;
  categoryId: string;
};
```
- Endpoint should support caching/prefetch and respect premium entitlements (return full payload or teaser flag).

### Category Chip Rail
- `GET /home/chips` → `{ chips: { id: string; label: string; pinned: boolean }[] }`
- `POST /home/chips/pin` body `{ chipId: string; pinned: boolean }`
- Optionally extend hero endpoint to filter by multiple chip IDs if we decide to allow multi-select later.

## 4. State, Cache & Performance
- **Hero**: cache per `chipFilterId` for 2h; prefetch adjacent cards; optimistic update on saved/reaction state.
- **Collections**: cache by ISO week; invalidate Mondays 00:00 UTC (user timezone aware).
- **Time Machine**: store last premium year locally; cache free teaser 30 min to avoid repeated paywall calls.
- **Chips/Related strip**: persist pinned chips in profile; throttle scroll animations; use `FlatList` with `windowSize=5`, `initialNumToRender=3`.
- **Error handling**: show inline toasts or neutral placeholders; avoid blocking other modules if one fails.

## 5. Analytics & Telemetry
- `home_viewed`
- `hero_card_opened { card_id, index }`
- `hero_cta_clicked { card_id, cta }`
- `collections_tile_opened { collection_id }`
- `collections_see_all_clicked { collection_id }`
- `time_machine_open_clicked { user_tier }`
- `time_machine_started { year, user_tier }`
- `time_machine_paywall_shown { source: "teaser" }`
- `time_machine_paywall_converted { plan }`
- `chip_selected { chip_id }`
- `chip_pinned { chip_id, pinned }`
- `related_strip_card_opened { card_id, chip_id }`

## 6. Acceptance Criteria
- Hero carousel renders five cards, supports swipe + indicators, and keeps expand animation + progress bar.
- Collections grid shows four tiles (or fallback state) with working navigation to Collection detail and Explore.
- Time Machine block differentiates free vs premium, remembers last premium year, and triggers teaser/paywall correctly.
- Category chip rail is compact, filters hero dataset, supports pinning, and exposes the related strip when active.
- Modules respect NorthStar spacing, single accent, and accessibility (AA contrast, ≥48×48pt hit areas).

## 7. Open Questions & Dependencies
- **Data breadth**: confirm backend can provide ≥5 personalized hero events per chip without heavy Firestore reads.
- **Collections CMS**: define owner workflow for weekly rotation; ensure fallbacks exist if fewer than four live collections.
- **Time Machine gating**: align on entitlement check and paywall flow; clarify whether free users can trigger `seed` endpoint.
- **Related strip dataset**: confirm whether reuse hero payload or requires separate lightweight endpoint.
- **Chip persistence**: coordinate with profile service for pin storage and default ordering.

## 8. Risks & Mitigations
- **Data latency**: multi-endpoint fetch could delay first paint → stagger module loading and show skeletons independently.
- **Content gaps**: missing weekly collections or hero items → design graceful fallback states.
- **Premium messaging**: ensure lock/badge copy aligns with global monetization guidelines to avoid conflicting CTAs.
- **Interaction overload**: maintain calm motion durations (120–220ms) and single accent to avoid cognitive overload.
