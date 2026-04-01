# Time Machine Feature - Phase 1 Implementation Guide

**Owner:** ilyas / chrono-history
**Dev Partner:** Claude Code
**Platform:** React Native (Expo)
**Created:** 2024-12-09
**Last Updated:** 2024-12-09
**Status:** Phase 1A - In Progress (MVP Core Building)

---

## 0. Implementation Progress

### ✅ Completed (as of 2024-12-09)

**Data Layer:**
- [x] Featured years selected: 2013, 1991, 1987, 1943, 1944
- [x] Event analysis script created (`scripts/analyze-events.ts`)
- [x] Manual enrichment script created (`scripts/enrich-featured-events.ts`)
- [x] 2013 events enriched (16 events with images + 5 with before/after context)
- [x] Firestore schema updated (beforeContext, afterContext, relatedPages structure)
- [x] Firebase Admin SDK security setup (service account, .gitignore)

**Service Layer:**
- [x] `fetchTimeMachineSeed()` updated - returns featured year directly (no API call)
- [x] `fetchTimeMachineTimeline()` fetches from Firestore with year filter
- [x] Fallback logic for missing data (heroEvent - 1969 Moon Landing)
- [x] TypeScript types updated (beforeContext, afterContext in TimelineEvent)

**UI Layer:**
- [x] Phase 1 paywall removed (all users have access)
- [x] Teaser mode removed
- [x] TimelineCard onPress navigation to event detail
- [x] Year picker shows featured years only
- [x] Existing Time Machine screen functional (`app/time-machine/index.tsx`)
- [x] TimelineCard component ready (`components/time-machine/TimelineCard.tsx`)

**Scripts & Tools:**
- [x] npm scripts added: `analyze:events`, `enrich:featured`
- [x] SECURITY.md created for credential management
- [x] Analysis output: `scripts/time-machine-analysis.json`

### 🚧 In Progress

- [ ] Debugging image loading (relatedPages structure issue being resolved)
- [ ] Testing with 2013 data

### 📋 Remaining (Phase 1)

**Content:**
- [ ] Enrich 1991 events (14 events)
- [ ] Enrich 1987 events (14 events)
- [ ] Enrich 1943 events (14 events)
- [ ] Enrich 1944 events (14 events)
- [ ] Add before/after context to top events of each year

**UI Enhancements:**
- [ ] Year summary cards (optional)
- [ ] Timeline visualization (month dots)
- [ ] Year selection animation
- [ ] Card entrance animations
- [ ] Loading states polish
- [ ] Empty states for sparse years

**Features:**
- [ ] Last visited year persistence (AsyncStorage)
- [ ] Pull-to-refresh
- [ ] Context toggle UI (before/after swipe)
- [ ] Haptic feedback

**Polish:**
- [ ] Analytics integration (events listed in section 9.1)
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Manual QA checklist completion

### 🐛 Known Issues

1. **Image Loading:** `relatedPages.find is not a function` error - debug logs added, investigating Firestore data structure
2. **Network Fallback Warning:** Console shows "Falling back to local time machine timeline" - expected during Firestore fetch failures

### 📊 Current Stats

- **Total events in DB:** 1,014 across 124 years (1901-2024)
- **Rich years (10+ events):** 18 years
- **Featured years ready:** 1/5 (2013 complete)
- **Events enriched:** 16/72 total needed (22%)

---

## 1. Executive Summary

Time Machine is a **premium feature** that allows users to travel to any year in history (1900-2024) and explore the defining moments of that year through an immersive, chronologically-organized timeline. This document covers **Phase 1**: building the full premium experience WITHOUT paywall infrastructure.

### Goals

- Create a "magical" time travel experience with smooth animations
- Deliver 10-15 curated events per year in chronological order
- Implement year picker with intuitive navigation
- Add before/after context to help users understand historical significance
- Remember last visited year for returning users
- Establish premium UI patterns for future features

### Non-Goals (This Phase)

- Paywall/subscription infrastructure (Phase 2)
- Audio narrations
- AI-generated summaries (nice-to-have, not blocker)
- Social sharing features
- Gamification elements

---

## 1. User Journey

### Entry Points

1. **Home Tab CTA** (Primary)
   - User taps `TimeMachineBlock` component
   - Direct navigation to `/time-machine` screen
   - If returning user: load last visited year
   - If new user: default to random "featured" year (1969, 1989, 2001)

2. **Future:** Deep links, notifications, explore cross-promotion

### Core Flow

```
┌─────────────────────────────────────────────┐
│ 1. Landing (Year Picker Prominent)         │
│    - Show current selected year             │
│    - "Travel to a year" header              │
│    - Year picker component                  │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 2. Year Selection Animation                │
│    - Number scroll with particles           │
│    - Brief loading (fetch timeline)         │
│    - "Traveling to [YEAR]..." text          │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 3. Timeline View                            │
│    - Year header with stats                 │
│    - Chronological event cards              │
│    - Before/After context (swipeable)       │
│    - Scroll to explore all events           │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 4. Event Detail (Optional)                  │
│    - Tap card → full event detail           │
│    - Standard event detail view (reuse)     │
└─────────────────────────────────────────────┘
```

---

## 2. Information Architecture

### Screen Structure

```
/time-machine
├─ Header
│  ├─ Back button
│  ├─ Title: "Time Machine"
│  └─ Year badge (current selected)
├─ Year Picker Section
│  ├─ "Travel to a year" text
│  └─ Year Picker Wheel (1900-2024)
├─ Timeline Section
│  ├─ Year Summary Card (optional)
│  │  ├─ Year title
│  │  ├─ Short context (AI-generated or manual)
│  │  └─ Event count badge
│  ├─ Timeline Visualization (dots + line)
│  └─ Event Cards (scrollable list)
│     ├─ Date badge
│     ├─ Image (16:9)
│     ├─ Title
│     ├─ Summary (2 lines)
│     └─ Context toggle (before/after)
└─ Footer (optional)
   └─ "Explore another year" CTA
```

---

## 3. Component Specifications

### 3.1 Year Picker Component

**File:** `components/time-machine/YearPicker.tsx`

```typescript
interface YearPickerProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  minYear?: number; // default 1900
  maxYear?: number; // default 2024
  disabled?: boolean;
}
```

**Design:**

- Horizontal scrollable wheel (like iOS picker)
- Center item highlighted with accent color (#6B8E7F)
- Smooth snap-to-center behavior
- Year numbers in serif font (Cormorant Garamond)
- Subtle fade on edges
- Haptic feedback on selection change

**Animation:**

- 220ms easing when snapping to year
- Scale center item to 1.2x
- Opacity: center 1.0, adjacent 0.6, distant 0.3

**Accessibility:**

- VoiceOver: "Year picker, currently {year}"
- Swipe actions: "Next year" / "Previous year"
- Direct year input option (long press → modal)

---

### 3.2 Timeline Visualization

**File:** `components/time-machine/TimelineVisualization.tsx`

```typescript
interface TimelineVisualizationProps {
  events: TimelineEvent[];
  selectedEventId?: string;
  onEventPress?: (eventId: string) => void;
}

interface TimelineEvent {
  id: string;
  dateISO: string; // "1969-07-20"
  month: number;   // 1-12
  title: string;
}
```

**Design:**

- Horizontal scrollable bar at top of timeline section
- 12 dots representing months (Jan-Dec)
- Vertical line connecting all dots
- Highlight dots with events (accent color)
- Empty dots in neutral gray

**Visual Style:**

```
  ○───●───○───●───○───○───●───○───○───○───●───○
 Jan  Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
```

**Interaction:**

- Tap dot → scroll timeline to first event of that month
- Auto-scroll as user scrolls event list

---

### 3.3 Year Summary Card (Optional MVP)

**File:** `components/time-machine/YearSummaryCard.tsx`

```typescript
interface YearSummaryCardProps {
  year: number;
  summary?: string; // AI-generated or manual
  eventCount: number;
  themes?: string[]; // e.g. ["Space Race", "Cold War"]
}
```

**Design:**

- Full-width card with gradient background
- Serif title: "1969"
- 2-3 line summary text
- Badge: "15 defining moments"
- Optional theme chips

**Content Strategy:**

- Phase 1: Manual summaries for featured years only
- Phase 2: AI-generated (Gemini) for all years
- Fallback: Simple "Explore {count} events from {year}"

---

### 3.4 Timeline Event Card

**File:** `components/time-machine/TimelineEventCard.tsx`

```typescript
interface TimelineEventCardProps {
  event: TimelineEvent;
  showContext?: boolean; // before/after toggle
  onPress?: () => void;
  onContextToggle?: () => void;
}

interface TimelineEvent {
  id: string;
  dateISO: string;
  title: string;
  summary: string;
  imageUrl?: string;
  categoryId: string;
  beforeContext?: string;
  afterContext?: string;
}
```

**Design:**

- 16:9 image at top (or placeholder gradient)
- Date badge: "July 20" (serif, accent background)
- Title: 2 lines max, serif font
- Summary: 3 lines max, gray text
- Context toggle: "Before → After" chip (if available)

**Context Toggle:**

```
┌─────────────────────┐
│  [Image]            │
│                     │
│  July 20, 1969      │
│  First Moon Landing │
│                     │
│  Neil Armstrong...  │
│                     │
│  ┌───────────────┐  │
│  │ ← Before      │  │ ← Swipeable
│  └───────────────┘  │
└─────────────────────┘

Swipe left:
┌─────────────────────┐
│  [Image]            │
│                     │
│  July 20, 1969      │
│  First Moon Landing │
│                     │
│  After this event...│
│                     │
│  ┌───────────────┐  │
│  │      After →  │  │
│  └───────────────┘  │
└─────────────────────┘
```

**Animation:**

- Card enter: fade + slide up (120ms)
- Context swap: horizontal slide (180ms)
- Press: scale 0.98 + haptic

---

### 3.5 Loading States

**File:** `components/time-machine/LoadingStates.tsx`

**Year Change Loading:**

```
┌─────────────────────────┐
│                         │
│   Traveling to 1969...  │
│                         │
│   [Particle animation]  │
│                         │
└─────────────────────────┘
```

**Timeline Skeleton:**

- 3 skeleton event cards
- Pulsing animation (1.5s loop)
- Maintain layout structure

---

## 4. Data & API Contracts

### 4.1 Service Layer

**File:** `services/time-machine.ts`

```typescript
// Existing functions to enhance:
export async function fetchTimeMachineSeed(): Promise<number> {
  // Returns a featured year for first-time users
  // Strategy: Random from [1969, 1989, 2001, 2008, 2020]
}

export async function fetchTimeMachineTimeline(
  year: number,
  categories?: string[]
): Promise<TimelineResponse> {
  // Fetch 10-15 events for given year
  // Return chronologically sorted
}

// New functions to add:
export async function fetchYearSummary(
  year: number
): Promise<YearSummary | null> {
  // Phase 1: Return null (not implemented)
  // Phase 2: AI-generated summary
}

export async function saveLastVisitedYear(
  userId: string,
  year: number
): Promise<void> {
  // Save to AsyncStorage (local)
  // Phase 2: Sync to Firebase
}

export async function getLastVisitedYear(
  userId: string
): Promise<number | null> {
  // Retrieve from AsyncStorage
}
```

### 4.2 Backend Endpoints

**Cloud Functions:** `functions/src/api/time-machine/`

#### GET `/time-machine/timeline`

```typescript
// Query params:
{
  year: number;      // Required: 1900-2024
  categories?: string; // Optional: comma-separated
  limit?: number;    // Optional: default 15
}

// Response:
{
  year: number;
  events: TimelineEvent[];
  summary?: string; // Phase 2
}

interface TimelineEvent {
  id: string;
  dateISO: string;
  title: string;
  summary: string;
  imageUrl?: string;
  categoryId: string;
  beforeContext?: string;
  afterContext?: string;
  tags?: string[];
}
```

**Firestore Query Strategy:**

```typescript
// Query contentEvents collection:
db.collection('contentEvents')
  .where('year', '==', year)
  .orderBy('dateISO', 'asc')
  .limit(15)
  .get()

// Enrich with before/after context (Phase 1: manual, Phase 2: AI)
```

#### GET `/time-machine/seed`

```typescript
// No params

// Response:
{
  year: number; // Featured year for new users
  reason?: string; // e.g. "50th anniversary"
}
```

### 4.3 Data Requirements

**Firestore Schema Enhancement:**

```typescript
// contentEvents/{eventId}
{
  // ... existing fields
  beforeContext?: string; // What led to this event
  afterContext?: string;  // What happened as a result
  significance?: string;  // Why it matters
  featured?: boolean;     // Highlight in Time Machine
}
```

**Manual Curation Needed:**

- Identify 5-10 "featured years" with rich content
- Write before/after context for top 50 events
- Create year summaries for featured years

---

## 5. State Management

### 5.1 Time Machine Hook

**File:** `hooks/useTimeMachine.ts`

```typescript
// Enhance existing hook:
interface UseTimeMachineResult {
  // Existing:
  selectedYear: number;
  timeline: TimelineEvent[];
  loading: boolean;
  error: string | null;
  
  // New additions:
  selectYear: (year: number) => Promise<void>;
  yearSummary: YearSummary | null;
  lastVisitedYear: number | null;
  
  // Event context:
  expandedEventId: string | null;
  showBeforeContext: (eventId: string) => void;
  showAfterContext: (eventId: string) => void;
  
  // Navigation:
  goToNextYear: () => void;
  goToPreviousYear: () => void;
}
```

**Implementation Notes:**

- Use React Query for caching timeline data (1 hour stale time)
- Store last visited year in AsyncStorage
- Prefetch adjacent years (±1) for smooth navigation
- Handle year change with optimistic updates

---

### 5.2 Local Storage Keys

```typescript
// AsyncStorage keys:
const STORAGE_KEYS = {
  LAST_VISITED_YEAR: '@chrono/time-machine/last-year',
  FEATURED_YEARS_CACHE: '@chrono/time-machine/featured',
  YEAR_SUMMARIES_CACHE: '@chrono/time-machine/summaries',
};
```

---

## 6. Animations & Interactions

### 6.1 Year Selection Animation

**Duration:** 600ms total

```
1. User selects new year (220ms)
   - Year picker snaps to selection
   - Haptic feedback (light impact)
   - Number scale up animation

2. Loading transition (380ms)
   - "Traveling to {year}..." text fades in
   - Particle effect (optional: use Lottie)
   - Timeline content fades out

3. Timeline appears (220ms)
   - Content fades in from bottom
   - Cards stagger enter (40ms delay each)
```

**Implementation:**

```typescript
// react-native-reanimated
const yearTransition = useSharedValue(0);

const animateYearChange = () => {
  yearTransition.value = withSequence(
    withTiming(0.5, { duration: 220 }),
    withTiming(1, { duration: 380 })
  );
};
```

### 6.2 Context Toggle Animation

**Duration:** 180ms

```
- Horizontal slide (left/right)
- Card content crossfade
- Haptic feedback (selection)
```

**Gesture:**

- Swipe left: Show "After" context
- Swipe right: Show "Before" context
- Tap toggle chip: Switch mode

### 6.3 Scroll Behavior

**Timeline List:**

- Vertical scroll (FlatList)
- Pull-to-refresh: Reload timeline
- On scroll: Update timeline visualization highlight
- Near bottom: Show "Explore another year" prompt

---

## 7. UI/UX Specifications

### 7.1 Design Tokens

**Following NorthStar.md:**

```typescript
// Colors
const COLORS = {
  accent: '#6B8E7F',      // Sage green
  background: '#F5F1E8',  // Cream
  surface: '#FFFFFF',     // White cards
  textPrimary: '#2C2C2C', // Near black
  textSecondary: '#6B6B6B', // Gray
  border: '#E5E0D8',      // Subtle border
};

// Spacing
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Radius
const RADIUS = {
  sm: 12,  // Chips, badges
  md: 16,  // Cards
  lg: 20,  // Hero elements
};

// Typography
const FONTS = {
  serifHeading: 'CormorantGaramond-SemiBold',
  sansBody: 'Inter-Regular',
  sansMedium: 'Inter-Medium',
};
```

### 7.2 Layout Guidelines

**Safe Area:**

- Respect iOS safe area insets
- Header: 60pt tall (includes status bar)
- Bottom: Account for home indicator

**Spacing:**

- Screen horizontal padding: 20pt
- Card vertical spacing: 16pt
- Section spacing: 24pt

**Accessibility:**

- Minimum tap target: 44×44pt
- Text contrast: AA compliance (4.5:1 for body)
- VoiceOver labels on all interactive elements
- Reduce motion support (disable particles)

---

## 8. Empty & Error States

### 8.1 No Events for Year

```
┌─────────────────────────────┐
│                             │
│   📭                        │
│                             │
│   No events recorded        │
│   for {year}                │
│                             │
│   [Try another year]        │
│                             │
└─────────────────────────────┘
```

**Copy:** "We haven't curated events for this year yet. Explore another year or check back soon!"

### 8.2 Network Error

```
┌─────────────────────────────┐
│                             │
│   ⚠️                        │
│                             │
│   Couldn't load timeline    │
│                             │
│   [Retry]  [Go back]        │
│                             │
└─────────────────────────────┘
```

### 8.3 First-Time Experience

**On first open:**

- Show brief onboarding tooltip
- "Pick any year from 1900 to 2024 and explore history"
- Dismiss after 3 seconds or tap

---

## 9. Analytics & Telemetry

### 9.1 Events to Track

```typescript
// Entry
analytics.track('time_machine_opened', {
  source: 'home_cta' | 'deeplink' | 'explore',
  last_visited_year: number | null,
});

// Year selection
analytics.track('time_machine_year_selected', {
  year: number,
  method: 'picker' | 'navigation_button',
  previous_year: number | null,
});

// Timeline engagement
analytics.track('time_machine_timeline_viewed', {
  year: number,
  event_count: number,
  scroll_depth: number, // 0-1
});

// Event interaction
analytics.track('time_machine_event_opened', {
  event_id: string,
  year: number,
  position: number, // index in timeline
});

// Context toggle
analytics.track('time_machine_context_toggled', {
  event_id: string,
  context_type: 'before' | 'after',
});

// Exit
analytics.track('time_machine_closed', {
  year: number,
  time_spent: number, // seconds
  events_viewed: number,
});
```

### 9.2 Key Metrics

- **Engagement rate:** % of users who explore 2+ years
- **Average years explored per session**
- **Most popular years**
- **Context toggle rate:** % of events where users view before/after
- **Scroll depth:** How far users scroll in timeline
- **Session duration:** Time spent in Time Machine

---

## 10. Testing & QA

### 10.1 Unit Tests

**Files to test:**

- `hooks/useTimeMachine.ts`
  - Year selection logic
  - Data fetching & caching
  - Error handling
- `services/time-machine.ts`
  - API calls
  - Data transformation
  - Local storage operations

### 10.2 Integration Tests

**Scenarios:**

- Year picker interaction
- Timeline scrolling
- Event card press
- Context toggle
- Navigation between years
- Error recovery

### 10.3 Manual QA Checklist

- [ ] Year picker scrolls smoothly (no lag)
- [ ] Timeline loads within 2 seconds
- [ ] Images load progressively (no blank cards)
- [ ] Before/after context swipes correctly
- [ ] Animations feel smooth (60fps)
- [ ] Back button returns to Home
- [ ] Last visited year persists across sessions
- [ ] Empty state shows for uncurated years
- [ ] Error state shows on network failure
- [ ] VoiceOver reads all content correctly
- [ ] Dark mode support (if applicable)
- [ ] Works on iPhone SE (small screen)
- [ ] Works on iPad (responsive layout)

---

## 11. Performance Targets

### 11.1 Loading Times

- **Year change:** <500ms (cached), <2s (network)
- **Timeline render:** <300ms for 15 cards
- **Image loading:** Progressive (placeholder → full)

### 11.2 Optimization Strategies

- **React Query:** Cache timelines for 1 hour
- **Image prefetch:** Load next 3 card images on scroll
- **Lazy load:** Render cards in viewport only (FlatList)
- **Memoization:** Memoize expensive calculations
- **Bundle size:** Keep animations under 100kb (use Lottie selectively)

### 11.3 Memory Management

- **FlatList windowSize:** 5 items (2 above, 2 below viewport)
- **Image cache:** Max 50 images in memory
- **Cleanup:** Unmount listeners on screen blur

---

## 12. Content Strategy (Phase 1)

### 12.1 Featured Years (Manual Curation)

**UPDATED:** Based on event richness analysis, these years were selected:

- **2013** ✅ ENRICHED: 16 events (Mars Mission, Typhoon Haiyan, Magnus Carlsen, Marmaray Tunnel, Metallica Antarctica)
- **1991** 🚧 PENDING: 14 events (Soviet collapse, Gulf War, Yugoslav wars)
- **1987** 🚧 PENDING: 14 events (Black Monday, First Intifada, King's Cross fire)
- **1943** 🚧 PENDING: 14 events (WWII mid-period, Holocaust events)
- **1944** 🚧 PENDING: 14 events (D-Day era, Operation Overlord)

**Why these years?**
- Highest event count in Firestore (10-16 events each)
- Diverse categories (world wars, politics, culture, disasters)
- Good chronological spread (1940s, 1980s, 1990s, 2010s)

**Requirements per featured year:**

- 12-15 events with images
- Before/after context for top 5 events
- Year summary (2-3 sentences)

### 12.2 Other Years (Basic Coverage)

- 8-10 events minimum
- Images optional (graceful fallback)
- No before/after context (Phase 2)
- Generic summary or none

### 12.3 Content Gaps

**If a year has <5 events:**

- Show empty state
- Suggest adjacent years
- Log as content gap for future curation

---

## 13. Technical Implementation Checklist

### 13.1 Phase 1A: Core UI

- [x] Create `/time-machine` screen structure ✅ (existing, updated)
- [x] Build `YearPicker` component ✅ (modal-based, featured years)
- [ ] Build `TimelineVisualization` component (month dots - deferred)
- [x] Build `TimelineEventCard` component ✅ (with onPress handler)
- [ ] Build `YearSummaryCard` component (deferred to polish phase)
- [x] Add loading states ✅ (text-based, skeleton pending)
- [x] Add empty/error states ✅ (basic implementation)
- [x] Implement navigation from Home CTA ✅ (paywall removed)
- [x] Basic styling (NorthStar compliance) ✅

### 13.2 Phase 1B: Data Layer

- [x] Enhance `services/time-machine.ts` ✅
  - [x] `fetchTimeMachineTimeline()` uses Firestore ✅
  - [ ] Year summary endpoint (deferred)
  - [ ] Local storage helpers (last visited year - pending)
- [x] Firestore integration ✅
  - [x] Year parameter filtering ✅
  - [x] Chronological sorting by dateISO ✅
- [x] Populate Firestore with featured year data ✅ (partial)
  - [x] 2013: 16 events with images ✅
  - [ ] 1991: 14 events (pending)
  - [ ] 1987: 14 events (pending)
  - [ ] 1943: 14 events (pending)
  - [ ] 1944: 14 events (pending)
  - [x] Before/after context (5 events in 2013) ✅
- [ ] Set up React Query caching (pending)

### 13.3 Phase 1C: Interactions (Week 2)

- [ ] Year picker scroll + snap behavior
- [ ] Year selection animation (particles optional)
- [ ] Timeline card entrance animation
- [ ] Context toggle swipe gesture
- [ ] Pull-to-refresh
- [ ] Scroll-linked timeline visualization
- [ ] Haptic feedback
- [ ] VoiceOver labels

### 13.4 Phase 1D: Polish & Testing (Week 2)

- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Analytics integration
- [ ] Error handling refinement
- [ ] Manual QA (all test cases)
- [ ] Beta testing with 5-10 users
- [ ] Bug fixes

---

## 14. Known Risks & Mitigations

### 14.1 Content Gaps

**Risk:** Many years have insufficient events
**Mitigation:**

- Focus on featured years for Phase 1
- Show empty state gracefully
- Build content pipeline for Phase 2

### 14.2 Performance on Older Devices

**Risk:** Animations lag on iPhone 8 / Android equivalents
**Mitigation:**

- Test on minimum spec devices early
- Reduce animation complexity if needed
- Provide "reduce motion" settings option

### 14.3 User Confusion

**Risk:** Users don't understand what Time Machine does
**Mitigation:**

- Clear onboarding tooltip on first use
- Add "How it works" help button in header
- Use intuitive year picker UI

### 14.4 API Latency

**Risk:** Slow network → frustrated users
**Mitigation:**

- Aggressive React Query caching
- Prefetch adjacent years
- Show skeleton states immediately
- Offline support (cache last 3 timelines)

---

## 15. Future Phases (Out of Scope)

### Phase 2: Paywall & Monetization

- RevenueCat integration
- Subscription tiers
- Paywall modal
- Free tier limitations (1 year/day)
- Premium tier unlock

### Phase 3: AI Enhancements

- Gemini-generated year summaries
- Auto-generated before/after context
- "What if" scenarios
- Personalized insights

### Phase 4: Social & Sharing

- Timeline poster generation
- Share to Instagram Stories
- "Which year are you from?" quiz
- Collaborative collections

---

## 16. Success Criteria (Phase 1)

### Must Have ✅

- [ ] Users can select any year (1900-2024)
- [ ] Timeline shows 10+ events chronologically
- [ ] Before/after context works on featured events
- [ ] Animations are smooth (>45fps)
- [ ] Last visited year persists
- [ ] No critical bugs (crashes, data loss)
- [ ] Accessibility: VoiceOver works, AA contrast

### Nice to Have 🎯

- [ ] Year summary cards for featured years
- [ ] Timeline visualization dots sync with scroll
- [ ] Particle effects on year change
- [ ] Audio feedback (subtle sounds)
- [ ] Dark mode support

### Phase 1 Complete When

1. 5 featured years fully curated
2. All UI components implemented & tested
3. Analytics tracking live
4. 10 beta testers report positive feedback
5. No P0/P1 bugs in backlog
6. Documentation updated (this file + codebase)

---

## 17. Appendix

### 17.1 Design References

- **Year Picker:** Similar to iOS time picker (wheel)
- **Timeline:** Pinterest-style vertical scroll
- **Context Toggle:** Tinder swipe interaction
- **Animations:** Calm, editorial (not flashy)

### 17.2 Content Examples

**1969 Year Summary:**
"The year humanity reached the Moon and gathered at Woodstock. Cold War tensions peaked while counterculture flourished. A defining moment between eras."

**Before Context (Moon Landing):**
"The Space Race between US and USSR had intensified since 1957's Sputnik launch. Kennedy's 1961 promise to land on the Moon before decade's end drove NASA's Apollo program."

**After Context (Moon Landing):**
"Apollo 11's success secured American dominance in space. Six more Moon missions followed until 1972. The technology developed revolutionized computing and telecommunications."

### 17.3 Open Questions

- Should we show "most viewed years" ranking?
- Add search/filter by event type within a year?
- Allow users to bookmark favorite years?
- Integrate with Explore (cross-link events)?

---

## 18. Contact & Collaboration

**Questions during implementation?**

- Check existing code: `app/time-machine.tsx`, `hooks/useTimeMachine.ts`
- Reference: `HomeScreenPRD.md`, `NorthStar.md`
- Ask İlyas for content/design decisions
- Ask Claude Code for technical implementation

**Weekly check-ins:**

- Monday: Review progress, unblock issues
- Thursday: Demo working features, gather feedback

---

**Ready to build? Let's make Time Machine magical! 🕰️✨**
