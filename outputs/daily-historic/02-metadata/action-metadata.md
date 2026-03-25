# Metadata Action Plan - Historiq

**Status:** Ready for Implementation
**Last Updated:** 2026-03-25

---

## Implementation Checklist

### Phase 1: Pre-Launch (Complete Before Submission)

#### Apple App Store Connect
- [ ] Log in to https://appstoreconnect.apple.com
- [ ] Navigate to My Apps > Historiq (com.ilyastorun.histora)
- [ ] Enter title: `Historiq - History Daily` (24/30 chars)
- [ ] Enter subtitle: `Daily Historical Events` (23/30 chars)
- [ ] Enter promotional text (149/170 chars — see apple-metadata.md)
- [ ] Enter keyword field (100/100 chars — see apple-metadata.md)
- [ ] Enter full description (2226 chars — see apple-metadata.md)
- [ ] Set primary category: Education
- [ ] Set secondary category: Reference
- [ ] Upload app icon 1024x1024px PNG (no alpha channel)
- [ ] Upload screenshots for 6.7" iPhone (1290x2796px) — minimum 3, target 5
- [ ] Upload screenshots for 6.5" iPhone (1284x2778px)
- [ ] Upload screenshots for 5.5" iPhone (1242x2208px)
- [ ] Preview listing on multiple device sizes in App Store Connect
- [ ] Confirm all character counts are within limits (inline counters in ASC)
- [ ] Set age rating (likely 4+ for educational content)
- [ ] Set pricing: Free (with optional IAP if applicable)
- [ ] Submit for review

#### Google Play Console
- [ ] Log in to https://play.google.com/console
- [ ] Navigate to Historiq (com.ilyastorun.histora) > Grow > Store presence > Main store listing
- [ ] Enter app name: `Historiq - Daily History & On This Day Events` (45/50 chars)
- [ ] Enter short description (72/80 chars — see google-metadata.md)
- [ ] Enter full description (2036 chars — see google-metadata.md)
- [ ] Set category: Education
- [ ] Upload app icon 512x512px PNG
- [ ] Upload feature graphic 1024x500px PNG
- [ ] Upload phone screenshots 1080x1920px — minimum 2, target 5
- [ ] Preview listing in Play Console preview panel
- [ ] Save as draft and review
- [ ] Publish

---

### Phase 2: Post-Launch (First 30 Days)

- [ ] Monitor keyword ranking using a third-party ASO tool (AppFollow, AppTweak, or Sensor Tower)
- [ ] Respond to all user reviews within 48 hours — review response is a Play Store ranking signal
- [ ] Update promotional text (Apple) with a timely angle — no submission required
  - Example rotation: "This week in history: [2–3 notable events]. Explore thousands more in Historiq."
- [ ] Track install conversion rate (CVR) in App Store Connect Analytics > Conversion > Product Page
- [ ] Track CVR in Play Console > Acquire users > Store listing conversion rate
- [ ] Identify which traffic source has the lowest CVR — that audience segment needs a targeted screenshot set

---

### Phase 3: A/B Testing (Days 30–90)

Priority order (highest impact first):

1. **App icon** — target 15–25% CVR improvement (see ab-test-setup.md)
2. **First screenshot** — target 10–20% CVR improvement
3. **Title variant** — test "On This Day" framing vs "History Daily" (see ab-test-setup.md)
4. **Short description** — Google Play only, test question-hook format (see ab-test-setup.md)

---

### Phase 4: Ongoing Optimization (Monthly)

- [ ] Refresh promotional text monthly with new content angles (Apple, no submission needed)
- [ ] Review keyword ranking monthly — swap underperforming keywords in Apple keyword field
- [ ] Update full description on each major feature release (include new features in KEY FEATURES section)
- [ ] Add social proof once app reaches 500+ ratings: insert a "Trusted by [X] history enthusiasts worldwide" line in description
- [ ] Re-evaluate screenshot set every major iOS/Android version — use latest device frames

---

## Keyword Strategy Notes

### Apple Keyword Field — Rotation Candidates

The 100-char keyword field should be reviewed every 60–90 days. Current keywords and potential swaps:

| Current Keyword | Characters | Potential Replacement | Rationale |
|----------------|-----------|----------------------|-----------|
| `trivia` | 6 | `quiz` | Shorter, captures trivia+quiz overlap |
| `learn` | 5 | `discovery` | 9 chars but higher intent match |
| `today` | 5 | `calendar` | 8 chars, stronger intent signal |
| `medieval` | 8 | `war` | 3 chars, frees space |

Swap decisions should be driven by ranking data from an ASO tool, not guesswork. Establish a baseline at launch before making changes.

### Google Play — Keyword Monitoring

Track these target queries weekly after launch:
- "what happened on this day in history"
- "daily history app"
- "on this day history"
- "history events today"
- "history trivia app"
- "time machine history"
- "historical events app"

If ranking for fewer than 4 of these within 60 days, revisit the full description to increase natural keyword density in the first 500 characters.

---

## Competitive Positioning Summary

| Competitor | Weakness | Historiq Advantage |
|-----------|---------|-------------------|
| This Day in History | Generic, non-personalized feed | Personalized by era and category |
| On This Day | Minimal design, no features beyond date browse | Time Machine + Explore + Save |
| Timehop | Social/nostalgia focused, not historical depth | Pure history, serious content quality |
| History Daily | News-style format, not interactive | Interactive preferences, filter system |
| History Channel app | Brand-heavy, TV-show centric | Neutral, education-focused, no ads |

Lead with personalization and the Time Machine in all metadata — these are the two features no direct competitor offers.

---

## Character Limit Quick Reference

| Field | Limit | Current Usage | Headroom |
|-------|-------|--------------|---------|
| Apple Title | 30 | 24 | 6 chars |
| Apple Subtitle | 30 | 23 | 7 chars |
| Apple Promo Text | 170 | 149 | 21 chars |
| Apple Keywords | 100 | 100 | 0 (at capacity) |
| Apple Description | 4000 | 2226 | 1774 chars |
| Google Title | 50 | 45 | 5 chars |
| Google Short Desc | 80 | 72 | 8 chars |
| Google Full Desc | 4000 | 2036 | 1964 chars |

Apple and Google descriptions have significant headroom. Use this space when adding social proof, new features, or localization-specific content.

---

## Files in This Package

| File | Purpose |
|------|---------|
| `apple-metadata.md` | Copy-paste ready Apple App Store metadata with implementation guide |
| `google-metadata.md` | Copy-paste ready Google Play Store metadata with implementation guide |
| `visual-assets-spec.md` | Icon and screenshot technical requirements and content strategy |
| `action-metadata.md` | This file — implementation checklist and ongoing optimization plan |
| `../03-testing/ab-test-setup.md` | Step-by-step A/B test configuration for icon, screenshots, and title |
