# Chrono - Post-Onboarding PRD (MVP)

This document defines the MVP experience after onboarding completes. All patterns must comply with `documentations/NorthStar.md`: single focus per screen, one accent hue, editorial surfaces with gentle grain/vignette, generous whitespace, short copy, and micro-interactions under 250 ms.

## 1. Goals & Success Signals
- Deliver a calm, cinematic daily moment that prompts one decision: read, save, or share.
- Reinforce habit via reminders and a lightweight engagement loop (save/reaction, email digest).
- Maintain simple information architecture: Home · Explore · Profile via translucent inset bottom bar.
- Key metrics (MVP): Day-7 retention, sessions per week, percent of users who open the daily hero, save rate, reaction rate, email digest open/click.

## 2. Navigation (Global)
### 2.1 Footer Navbar (New)
- Tabs: Home, Explore, Profile.
- Bar is translucent, inset (width <= 92% of device), centered with >= 16 pt side gutters, large radius (~24 pt), subtle shadow.
- Active tab shows a soft glow (accent). Labels optional; touch targets >= 48 x 48 pt.

**Acceptance**
- Bar width <= 92% of device width with visible side insets.
- Background translucency keeps breathing room; no heavy block.
- Active tab glow follows North Star bottom nav spec; inactive tabs stay neutral.

### 2.2 Routing
- Post-onboarding landing: Home (Today).
- Search and calendar live under Explore.
- Account, preferences, saved items, notifications under Profile. Onboarding already persists these settings.

## 3. Home (Today)
- Keep current hero content and card design (year badge, serif headline, short summary, action row) per Card spec.
- Remove Spotlight Chronicle and Keep Exploring for MVP; they return within Explore.

### 3.1 Content & Layout
- Section header: "Today’s Moment" (small, neutral treatment).
- Hero card: Editorial image or soft gradient block with gentle grain/vignette; single accent used for CTA or year pill.
- Copy: headline <= 60 chars; body <= 120 chars.
- Actions: Continue (primary), Preview (ghost). Reactions (thumbs up/lightbulb) and Save/Share surface on action row or in detail view.
- Tap hero -> Event Detail modal/screen.

**Acceptance**
- Only one primary hero above the fold; no competing modules.
- Typography pairing: serif headline + sans body, max two weights.
- Contrast AA compliant; internal padding >= 24 pt; card radius ~16 pt; soft shadow per North Star spec.

## 4. Explore
Purpose: discovery without clutter. Holds the content removed from Home and broader search tools.

### 4.1 Top Area
- Search for events/people/themes with auto-suggest.
- Date picker (calendar) to jump to any past date; dates with saved items highlighted.
- Quick filters: chips for categories/eras captured during onboarding (multi-select under one accent rule).

### 4.2 Results & Collections
- Results list: Event cards with title, year, short summary, category badge, save/share/reaction.
- Collections: Thematic sets (e.g., "Women in STEM Week") shown as peek carousels with gentle parallax.
- Optional "I’m feeling curious" random date affordance.

**Acceptance**
- Query returns top 20 results quickly; filters update instantly (perceived < 500 ms).
- Chips show clear neutral/selected states with 120-200 ms feedback.
- Collections use peek carousel pattern (center emphasized, sides visible ~40%).

## 5. Event Detail (Modal/Screen)
- Content: image/banner, year, title, extended summary, location/context, sources/citations, reactions, save/share, "Why you’re seeing this" tag when personalized.

**Acceptance**
- Layout remains readable, uncluttered, short copy blocks, sources clearly visible.
- Save/reaction state persists across sessions/devices.
- Accessibility: alt text coverage, correct focus order, AA contrast.

## 6. Profile
### Sections
- Saved: library of saved events (with tags), share from detail.
- Preferences: edit categories/eras, time zone, notification time, toggle daily email; uses onboarding chip UI.
- Account: sign-in method (Apple/Google/Email) or continue as guest; data privacy links.

**Acceptance**
- Updates to preferences immediately influence Home/Explore ranking (rule-based v1).
- Email digest opt-in/out respected; time zone honored.

## 7. Notifications & Email Digest (MVP)
- Daily email digest: hero event plus 2-3 highlights with deep links. Honor time zone and opt-in.
- Reminder time uses onboarding value; editable in Profile.

**Acceptance**
- Emails render correctly across major clients; send window respects user time zone.
- Digest clicks open the correct day and event detail.

## 8. Global Design & Interaction Contract
- Every surface follows North Star rules: one focus, one accent, editorial tone, generous spacing, short copy, micro-interactions < 250 ms.
- Cards: 16 pt radius, soft shadow, year pill, two-line summary, action row.
- Peek carousel: center item emphasized, side items visible (~40%).
- Accessibility: AA contrast, focus ring 2 pt with 4 pt offset, touch targets >= 48 x 48 pt, dynamic type resilient.

## 9. Data & Personalization (Phase 1)
- Use onboarding fields (categories, eras, notification preference/time, account selection) to drive rule-based ranking for Home hero and Explore.
- Persist saves/reactions for future relevance scoring (v2).

## 10. Non-Functional Requirements
- Performance: Home hero loads fast; Explore results perceived < 500 ms for top items; dashboard p95 render ~2 s on broadband.
- Reliability: graceful fallback when content service is slow (skeleton loaders).
- Privacy/Security: respect sign-in method; consent links present; PII encrypted in transit/at rest.

## 11. Analytics & Experimentation
- Track: `home_hero_view`, `home_hero_open`, `event_saved`, `reaction_added`, `explore_search`, `explore_filter_change`, `email_digest_open`, `email_digest_click` (onboarding analytics already defined).
- Initial A/B ideas: hero CTA copy order, Explore default sort, bottom-nav labels on/off.

## 12. Out of Scope (MVP)
- Social graph, UGC submissions (beyond flagging), premium paywall, native push notifications (email first), advanced admin tooling.

## 13. Phased Roadmap
- **Phase A – MVP**: Footer navbar (inset, translucent), Home (hero only), Explore (search, calendar, filters, results), Event Detail, Save/Share/Reactions, Profile (Saved/Preferences/Account), Daily Email Digest.
- **Phase B – Depth & Habit**: Collections in Explore (peek carousels), streak indicator, upcoming anniversaries, random date, relevance tuning using behavior signals.
- **Phase C – Growth**: Push notifications (PWA/native), notes on saved events, localization plan, premium exploration.

## 14. Acceptance Checklist (Design + Product)
- Home shows a single hero; no Spotlight/Keep Exploring.
- Bottom nav is translucent, inset, under 100% width; tabs = Home/Explore/Profile with active glow.
- Explore includes search, calendar, filters; collections (if enabled) live here only.
- Event Detail exposes sources and supports save/share/reaction with persistent state.
- Profile lets users adjust preferences (categories/eras), notification time, and email opt-in; saved items persist and remain accessible.
- All surfaces honor North Star rules (focus, accent, editorial tone, whitespace, short copy, micro-interactions) and AA accessibility.
