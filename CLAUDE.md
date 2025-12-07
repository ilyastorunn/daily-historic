# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Daily Historic is an Expo + React Native mobile app (iOS/Android) that delivers personalized historical insights. The app uses anonymous Firebase Authentication, collects user preferences during onboarding, and stores them in Firestore. Built with React 19, React Native 0.81, and Expo 54 using TypeScript in strict mode.

## Development Commands

### App Development
```bash
# Install dependencies
npm install

# Start Expo dev server
npm run start

# Run on specific platforms
npm run ios
npm run android
npm run web

# Lint code
npm run lint
```

### Data Ingestion
```bash
# Ingest historical events for a specific date
npm run ingest -- --month=10 --day=23 --year=2024

# Validate override configuration
npm run validate:overrides

# Run ingestion tests
npm run test:ingest
```

### Testing
```bash
# Run vitest suite (ingestion scripts only)
npm run test:ingest
```

## High-Level Architecture

### Navigation & Routing

**File-based routing via Expo Router** in the `app/` directory:
- `app/_layout.tsx` - Root layout that wraps app with `UserProvider` and theme provider
- `app/index.tsx` - Entry point that redirects to onboarding or tabs based on user state
- `app/(tabs)/` - Main tab navigation with custom bottom dock (Home, Explore, Profile)
- `app/onboarding/index.tsx` - Multi-step onboarding flow orchestrator
- `app/event/[id].tsx` - Dynamic event detail pages with context-aware navigation
- `app/collection/[id].tsx` - Dynamic collection detail pages

The custom tab bar in `(tabs)/_layout.tsx` uses `BottomTabBarProps` and includes haptic feedback on iOS.

**Context-Aware Navigation Pattern**:
Event detail pages support sequential browsing via URL params:
- `source` - Origin of navigation (e.g., 'home-carousel')
- `carouselIndex` - Current position in carousel
- `carouselItemIds` - Comma-separated list of all event IDs in sequence

This enables:
- Conditional "Next" button in top-right when navigating from carousels
- Preserving navigation context across page transitions
- Extensible pattern for other list-based features (Explore, Collections)

### State Management

**Two primary React Contexts** handle global state:

1. **UserContext** (`contexts/user-context.tsx`) - Authentication and user profile
   - Automatic anonymous sign-in on first launch
   - Real-time Firestore subscription to `Users/{uid}` documents
   - Methods: `completeOnboarding()`, `updateProfile()`, `signOut()`
   - State: `authUser`, `profile`, `initializing`, `onboardingCompleted`, `error`

2. **OnboardingContext** (`contexts/onboarding-context.tsx`) - Onboarding flow state
   - Uses reducer pattern with actions: `SET_STEP`, `NEXT_STEP`, `PREV_STEP`, `UPDATE`, `RESET`
   - Manages: step navigation, account selection, timezone, notifications, era/category preferences
   - Auto-detects device timezone using `Intl.DateTimeFormat()`

### Firebase & Data Layer

**Service Layer** (`services/`) abstracts Firebase/API access:
- `firebase.ts` - Centralized Firebase Auth, Firestore, and FieldValue exports
- `content.ts` - Event and digest fetching with fallback logic
- `home.ts`, `chips.ts`, `time-machine.ts` - Feature-specific data services
- `wikimedia-digest.ts` - Wikipedia "On This Day" integration
- `story-of-the-day.ts` - SOTD with 24h AsyncStorage cache, Firestore → Wikimedia → Seed fallback
- `you-might-be-interested.ts` - YMBI with 6h cache, diversity algorithm (≥3 categories, max 2/category)
- `analytics.ts` - Event tracking (development logs, production-ready)

**Firestore Collections:**
- `Users/{uid}` - User profiles with onboarding data, `savedEventIds[]`, and `reactions{}` map
- `contentEvents` - Historical events with `eventId`, `year`, `text`, `summary`, `categories[]`, `era`, `tags[]`, `enrichment{}`, etc.
- `dailyDigests` - Date-based digests with format `digest:onthisday:selected:MM-DD`
- `storyOfTheDay` - SOTD cache with doc IDs like `sotd:MM-DD`, contains `eventId` reference (optional, used by Explore)

**Data Fetching Pattern** - Three-tier cascading fallbacks:
1. Primary: Firestore query
2. Secondary: Wikipedia API via `wikimedia-digest.ts`
3. Tertiary: Local dev data from `constants/dev-digest.ts`

All data hooks follow pattern: `{ loading, data, error, refresh? }` with proper cleanup on unmount.

### Component Organization

```
components/
├── home/                   # Home tab specific (CategoryChipRail, WeeklyCollectionsGrid, etc.)
├── explore/                # Explore tab specific (FilterModal, StoryOfTheDay, YouMightBeInterested)
├── onboarding/steps/       # 12 modular onboarding step components
├── time-machine/           # Time machine feature components
├── ui/                     # Reusable primitives (collapsible, editorial-card, icon-symbol, etc.)
└── [shared components]     # external-link, parallax-scroll-view, themed-text/view
```

Components use `useAppTheme()` hook for consistent styling across light/dark modes.

**Engagement Button Pattern**:
Event cards and detail pages use a consistent icon-only button design (44×44pt):
1. **Like** (heart) - Toggles like state in user profile
2. **Deep Dive** (book) - Premium feature navigation (placeholder)
3. **Save** (bookmark) - Toggles save state in user profile
4. **Share** (square.and.arrow.up) - Native share sheet

- Buttons are circular with 1pt border (`borderSubtle`)
- Active states use `accentPrimary` color with `accentSoft` background
- 22pt icon size, centered in 44×44pt touch target
- Consistent spacing with `gap: spacing.md` (12pt) between buttons
- All interaction logic handled by `useEventEngagement` hook

### Custom Hooks

**Data Hooks** (`hooks/`):
- `useDailyDigestEvents` - Load events for a date with cascading fallbacks
- `useEventEngagement` - Track saves/reactions/likes with optimistic updates and Firestore sync
  - Manages `savedEventIds[]` array and `reactions{}` map in user profile
  - Methods: `toggleSave()`, `toggleLike()` with immediate UI updates
- `useWeeklyCollections`, `useTimeMachine`, `useHomeChips`, `useEventContent`, `useCollectionDetail` - Feature-specific data
- `useStoryOfTheDay` - SOTD hook with loading/error states, optional enabled flag
- `useYMBI` - You Might Be Interested hook with user context (categories, saved, home exclusions)

**Optimistic Updates Pattern**: UI updates immediately, async Firebase mutation in background, reverts on failure.

### Theme System

**Centralized design tokens** in `theme/tokens.ts`:
- Colors (primary, secondary, accent, text, surface, border, etc.)
- Spacing scale: `xs=4pt, sm=8pt, md=12pt, lg=18pt, xl=28pt, xxl=40pt, card=24pt`
- Radius (sm, md, lg, pill)
- Typography (heading, body, label, caption sizes)
- Shadows (iOS/Android optimized)

Access via `useAppTheme()` hook which returns current theme based on system color scheme.

**Spacing Guidelines**:
- Use `spacing.xxl` (40pt) for primary module spacing to ensure breathability
- Apply negative margins sparingly to fine-tune specific gaps (e.g., hero carousel: `-28pt`)
- Prefer flexbox `gap` property over manual margin wrappers for consistency
- Add extra `marginVertical` for premium/emphasis modules (e.g., Time Machine: `+12pt`)

**Home Page Layout Pattern** (`app/(tabs)/index.tsx`):
- ScrollView uses `gap: spacing.xxl` (40pt) between all direct children
- Section header → Hero carousel reduced to 12pt via `marginTop: -28`
- Time Machine has extra spacing (52pt total) via `marginVertical: spacing.md`
- No wrapper Views for spacing - rely on flexbox gap for cleaner code

### Type System

**Strict TypeScript** with path aliases (`@/*` maps to root):
- `types/user.ts` - User profiles, onboarding data, reactions
- `types/events.ts` - Event documents, media assets, digests
- Zod schemas in ingestion scripts for runtime validation

### Data Ingestion Pipeline

**Node.js CLI tool** in `scripts/ingest/` for populating Firestore:

**Flow**: `parseArgs()` → `fetchOnThisDaySelected()` (Wikipedia API) → `normalizeEvent()` → `enrichEvents()` (Wikidata + media) → `assertValidPayload()` → `writeToFirestore()`

**Key Modules**:
- `wikimedia-client.ts` - Wikipedia API client
- `wikidata-client.ts` - Wikidata enrichment queries
- `enrichment.ts` - Event enrichment with participants, media, categories
- `media.ts` - Media asset discovery with persistent cache (`cache.ts`)
- `classification.ts` - Auto-categorization and era assignment
- `firestore-admin.ts` - Firebase Admin SDK for batch writes
- `validation.ts` - Zod schemas for type-safe data validation

Media cache has TTL to avoid repeated API requests.

## Important Development Notes

### Authentication
- Every user is automatically signed in anonymously on first launch
- No credentials needed for basic app functionality
- Real-time sync via Firestore listeners, not polling

### Onboarding
- Uses Context + reducer pattern for state management
- Changes don't persist until `completeOnboarding()` is called
- Onboarding state doesn't write to Firestore until completion
- Visual steps in `components/onboarding/steps/`
- State shape defined in `contexts/onboarding-context.tsx`
- Final data structure in `types/user.ts`

### Firebase Configuration
- Requires `GoogleService-Info.plist` (iOS) and `google-services.json` (Android) at project root
- New architecture enabled in Expo config (`newArchEnabled: true`)
- iOS uses static frameworks with React Native built from source
- Predictive back gesture disabled on Android

### Path Aliases
- `@/*` resolves to project root (configured in `tsconfig.json`)
- Example: `import { firebaseAuth } from '@/services/firebase'`

### Expo Features
- Typed routes enabled (`experiments.typedRoutes: true`)
- React Compiler enabled (`experiments.reactCompiler: true`)
- Deep linking scheme: `codexdeneme://`
- Edge-to-edge rendering on Android

### Testing
- Vitest configured for ingestion scripts only (`scripts/ingest/__tests__/`)
- Tests for cache, overrides, and media handling
- No React component tests configured yet

### Linting
- ESLint with `eslint-config-expo`
- Run `npm run lint` before committing

### Explore Page Architecture (PRD: ExploreScreenPRD.md)

**Implementation Status**: ~85% complete (MVP features)

**Key Features**:
- **Search**: 350ms debouncing, clear button resets to default layout
- **Filters**: Bottom sheet modal with categories (multi-select) + era (single-select)
- **Story of the Day**: 24h AsyncStorage cache with Firestore → Wikimedia → Seed fallbacks
- **You Might Be Interested**: 6h cache, diversity algorithm (≥3 categories, max 2 per category)
- **Conditional Layout**: Default (SOTD + YMBI) vs Active (search results)
- **Analytics**: 9 tracked events (explore_opened, search_typed, filters_applied, sotd_shown, etc.)
- **Accessibility**: All touch targets ≥44×44pt, VoiceOver labels, AA contrast compliance

**Data Flow**:
1. User opens Explore → `explore_opened` analytics
2. Default: Fetch SOTD + YMBI (cache-first, 24h/6h TTL)
3. Search/Filter: Client-side filtering on `dailyDigestEvents`
4. Card tap → Event detail page with `eventId`

**Caching Strategy**:
- SOTD: `@daily_historic/sotd_cache` (24h TTL, AsyncStorage)
- YMBI: `@daily_historic/ymbi_cache_{userId}` (6h TTL, per-user)
- Both use timestamp-based expiration checks

**Known Limitations** (pending backend/future work):
- Wikimedia Pageviews API integration (stub)
- Deep Dive premium module (requires paywall system)
- Pagination with cursor (currently slice(0, 20))
- "Not interested" suppression (requires local storage)
- Backend API endpoints (using client-side filtering)

**Related Files**:
- `app/(tabs)/explore.tsx` - Main screen (1015 lines)
- `components/explore/FilterModal.tsx` - Filter UI
- `components/explore/StoryOfTheDay.tsx` - SOTD card
- `components/explore/YouMightBeInterested.tsx` - YMBI list
- `services/story-of-the-day.ts` - SOTD service
- `services/you-might-be-interested.ts` - YMBI service
- `constants/explore-seed.ts` - Fallback data (3 SOTD + 8 YMBI seeds)

## Common Workflows

### Adding a New Onboarding Step
1. Create step component in `components/onboarding/steps/`
2. Add to `OnboardingState` type in `contexts/onboarding-context.tsx`
3. Add reducer action if needed
4. Update step sequence in `app/onboarding/index.tsx`

### Adding a New Event Category
1. Update `constants/categories.ts`
2. Modify classification logic in `scripts/ingest/classification.ts`
3. Update `types/events.ts` if schema changes
4. Re-run ingestion for affected dates

### Fetching New Data
1. Create service function in `services/` for API/Firestore access
2. Create custom hook in `hooks/` that wraps service with loading/error state
3. Handle cleanup with `useEffect` return function
4. Implement error handling with fallbacks where appropriate

### Adding UI Components
1. Create in `components/ui/` for reusable primitives
2. Use `useAppTheme()` for styling
3. Follow pattern of existing components (props interface, theme integration)
4. Export from component directory index if applicable

### Working with Explore Features
1. **Add Analytics Event**: Update `services/analytics.ts` and call `trackEvent()` in `app/(tabs)/explore.tsx`
2. **Modify SOTD Fallback**: Edit `constants/explore-seed.ts` SOTD_SEED_EVENTS array
3. **Modify YMBI Fallback**: Edit `constants/explore-seed.ts` YMBI_SEED_EVENTS array
4. **Adjust Cache TTL**: Update `SOTD_CACHE_TTL` in `services/story-of-the-day.ts` or `YMBI_CACHE_TTL` in `services/you-might-be-interested.ts`
5. **Change Diversity Rules**: Modify `diversifyEvents()` in `services/you-might-be-interested.ts`

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | App root, provider setup |
| `contexts/user-context.tsx` | Auth & profile logic |
| `services/firebase.ts` | Firebase initialization |
| `app/(tabs)/_layout.tsx` | Tab navigation structure |
| `app/(tabs)/explore.tsx` | Explore screen (search, filters, SOTD, YMBI) |
| `app/index.tsx` | Landing page router |
| `theme/use-app-theme.ts` | Theme system hook |
| `services/story-of-the-day.ts` | SOTD service with 24h cache |
| `services/you-might-be-interested.ts` | YMBI service with diversity algorithm |
| `services/analytics.ts` | Event tracking service |
| `scripts/ingest/run.ts` | Data ingestion entry point |
| `utils/categories.ts` | Category definitions |
| `utils/dates.ts` | Date formatting helpers |
| `constants/events.ts` | Event library metadata |
| `constants/explore-seed.ts` | Explore fallback data (SOTD + YMBI seeds) |

## Architecture Patterns

1. **Context-Based State** - Two contexts at root handle cross-cutting concerns
2. **Layered Data Access** - Services → Hooks → Components
3. **Cascading Fallbacks** - Primary (Firestore) → Secondary (API) → Tertiary (local)
4. **Optimistic Updates** - Immediate UI response with async sync
5. **Type-Safe Pipeline** - Zod validation + TypeScript throughout

## Temporarily Disabled Features

### Story of the Day (SOTD)

**Status**: Disabled as of 2025-11-08
**Reason**: Persistent image loading issues with Wikimedia URLs in seed events

**Problem Summary**:
- Seed events in `constants/explore-seed.ts` use Wikimedia Commons image URLs
- URLs frequently return 404 errors even after multiple URL format changes:
  - Direct `/commons/` URLs fail
  - `/thumb/` URLs fail
  - `Special:FilePath` endpoint still returns 404 for some images
- Cache invalidation attempts (versions 2, 3, 4) did not resolve the issue
- Fallback to astronaut image (heroEvent) is contextually irrelevant for historical events

**Where Disabled**:
- `app/(tabs)/explore.tsx`:
  - Line ~786: `useStoryOfTheDay({ enabled: false })` - Hook disabled
  - Line ~1378: `<StoryOfTheDay />` component commented out
  - Line ~805: `refreshSOTD()` removed from pull-to-refresh
  - Line ~1073: `sotd_shown` analytics tracking disabled

**To Re-Enable**:
1. Fix Wikimedia image URLs in `constants/explore-seed.ts`
2. Test all 3 seed event images load successfully
3. Bump `SOTD_CACHE_VERSION` in `services/story-of-the-day.ts`
4. Uncomment code in `app/(tabs)/explore.tsx`:
   - Set `useStoryOfTheDay({ enabled: !showResults })`
   - Uncomment `<StoryOfTheDay />` component
   - Uncomment `refreshSOTD()` in handleRefresh
   - Uncomment analytics tracking
5. Clear app cache: `npm start -- --clear`

**Alternative Solutions Attempted**:
- ❌ Updated URLs to full-resolution originals
- ❌ Used Special:FilePath endpoint
- ❌ Cache versioning system (v2, v3, v4)
- ❌ Image error fallback in EventDetailScreen
- ✅ Temporarily disabled to unblock development

**Impact**: Explore page now shows SavedStories + YMBI only (no SOTD card)
