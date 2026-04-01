# Launch Action Plan - Historiq

**Created:** March 25, 2026
**Target Launch:** May 20, 2026
**Days to Launch:** 56

---

## Executive Summary

Historiq is an Expo + React Native app delivering personalized daily historical events. The app is in pre-launch with core features approximately 85% complete. Firebase authentication is being finalized. This action plan covers the 8-week sprint from today to global launch.

---

## Immediate Next Steps (This Week: March 25-31)

1. **Review and approve the launch timeline** (`timeline.md`)
   - Confirm May 20 works as a target date
   - Identify any hard constraints (vacations, other commitments)

2. **Complete Firebase auth migration**
   - Anonymous sign-in, Apple Sign-In, Google Sign-In must all work
   - Profile persistence in Firestore verified

3. **Feature freeze by March 31**
   - Lock v1.0 scope: Home feed, Explore, Time Machine, Profile, Onboarding
   - Defer: Story of the Day (image issues), Deep Dive (premium feature)
   - Create release/1.0.0 branch

---

## Critical Path Items

These items are sequential dependencies -- delays here delay the launch:

```
Auth complete (Mar 26) -->
Feature freeze (Mar 31) -->
Metadata written (Apr 7) -->
Screenshots created (Apr 14) -->
Legal/compliance done (Apr 21) -->
TestFlight beta (Apr 28) -->
Final build uploaded (May 5) -->
Apple submission (May 6) -->
Apple approval (~May 9) -->
Soft launch NZ/AU (May 9) -->
Global launch (May 20)
```

**Total buffer built in:** 11 days between Apple submission and launch date.

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Apple review rejection | Medium | High | Provide clear reviewer notes, test thoroughly, buffer time |
| Auth migration bugs | Medium | High | Complete early (Week 1), extensive TestFlight testing |
| Insufficient Firestore data coverage | Low | Medium | Run ingestion scripts to ensure 365 days covered |
| Low initial downloads | High | Medium | ASO optimization, social media, community posts |
| Negative early reviews | Medium | Medium | Respond within hours, ship fixes fast |

---

## Key Files in This Directory

| File | Purpose |
|------|---------|
| `prelaunch-checklist.md` | 52-item validation checklist across 7 phases |
| `timeline.md` | Week-by-week schedule with specific dates (Mar 25 - Jun 3) |
| `submission-guide.md` | Step-by-step Apple App Store and Google Play submission |
| `review-responses.md` | 12+ response templates for common review scenarios |

## Related Files

| File | Purpose |
|------|---------|
| `../05-optimization/ongoing-tasks.md` | Daily/weekly/monthly optimization schedule post-launch |

---

## Success Metrics (First 30 Days)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Downloads (first week) | 100+ | App Store Connect + Play Console |
| Downloads (first month) | 500+ | App Store Connect + Play Console |
| App Store rating | 4.5+ | App Store Connect |
| Crash-free rate | 99.5%+ | Firebase Crashlytics |
| Day 1 retention | 40%+ | Firebase Analytics |
| Day 7 retention | 20%+ | Firebase Analytics |
| Review response time | < 24 hours | Manual tracking |
| Conversion rate (Apple) | > 5% | App Store Connect Analytics |
