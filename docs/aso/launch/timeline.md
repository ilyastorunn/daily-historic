# Launch Timeline - Historiq

**Launch Target:** May 20, 2026 (Apple App Store primary, Google Play secondary)
**Today's Date:** March 25, 2026
**Time to Launch:** 56 days (8 weeks)
**Developer:** Ilyas Torun (solo developer)

---

## Week 1: March 25-31, 2026 -- Foundation and Auth Completion

### Wednesday, March 25
- [ ] Review and approve this launch timeline
- [ ] Audit current feature completeness against v1.0 scope
- [ ] Define v1.0 feature freeze list (what ships, what waits)

### Thursday, March 26
- [ ] Complete Firebase Authentication implementation (anonymous + Apple Sign-In + Google Sign-In)
- [ ] Test sign-in flow end-to-end on iOS simulator
- [ ] Verify Firestore user profile persistence after sign-in

### Friday, March 27
- [ ] Fix or confirm Story of the Day is cleanly disabled for v1.0
- [ ] Test onboarding flow end-to-end (all steps complete without errors)
- [ ] Verify all tab navigation works (Home, Explore, Profile)

### Saturday-Sunday, March 28-29
- [ ] Run through every screen manually -- note any broken UI or placeholder content
- [ ] Test time machine feature with multiple date ranges
- [ ] Test event detail pages (engagement buttons, sharing, navigation context)

### Monday, March 30
- [ ] Fix critical bugs found during weekend testing
- [ ] Confirm data ingestion pipeline covers sufficient date range for launch
- [ ] Run `npm run lint` -- fix all errors

### Tuesday, March 31
- [ ] Feature freeze for v1.0
- [ ] Create `release/1.0.0` branch
- [ ] Document any deferred features (Deep Dive, SOTD, etc.)

---

## Week 2: April 1-7, 2026 -- Metadata and Store Listings

### Wednesday, April 1
- [ ] Register "Historiq" in App Store Connect (if not already)
- [ ] Register "Historiq" in Google Play Console (if not already)
- [ ] Reserve app name on both platforms

### Thursday, April 2
- [ ] Write Apple App Store metadata:
  - Title: "Historiq" (8/30 chars)
  - Subtitle: "Daily History, Personalized" (27/30 chars)
  - Promotional text (170 chars)
  - Full description (target 2000-3000 chars)
  - Keywords (100 chars, comma-separated)

### Friday, April 3
- [ ] Write Google Play Store metadata:
  - Title: "Historiq - Daily History, Personalized" (38/50 chars)
  - Short description (80 chars)
  - Full description (target 2500-3500 chars)

### Saturday-Sunday, April 4-5
- [ ] Keyword research: analyze competitor metadata (This Day in History, Timehop, On This Day, History Channel)
- [ ] Build keyword priority list (primary, secondary, long-tail)
- [ ] Map keywords to metadata fields

### Monday, April 6
- [ ] Finalize and review all metadata -- spell check, grammar check
- [ ] Validate all character limits
- [ ] Enter metadata drafts into App Store Connect and Play Console

### Tuesday, April 7
- [ ] Write "What's New" text for v1.0.0
- [ ] Prepare App Review notes (explain anonymous auth, demo flow)
- [ ] Set up primary and secondary categories on both platforms

---

## Week 3: April 8-14, 2026 -- Visual Assets

### Wednesday, April 8
- [ ] Finalize app icon at 1024x1024px
- [ ] Test icon at small sizes (notification, settings, home screen)
- [ ] Verify Android adaptive icon layers render correctly

### Thursday, April 9
- [ ] Design screenshot template (consistent style, text overlays, device frames optional)
- [ ] Plan screenshot narrative (6-8 screenshots telling a story):
  1. Daily feed with curated historical events
  2. Personalization -- choose your eras and categories
  3. Time machine -- travel to any date in history
  4. Event detail with rich context
  5. Explore -- search and filter events
  6. Save and react to your favorite moments

### Friday, April 10
- [ ] Create iPhone 6.7" screenshots (1290x2796px) -- all 6-8 frames
- [ ] Create iPhone 6.5" screenshots (1284x2778px) -- all frames

### Saturday-Sunday, April 11-12
- [ ] Create iPhone 5.5" screenshots (1242x2208px) -- all frames
- [ ] Create Google Play phone screenshots (1080x1920px)
- [ ] Create Google Play feature graphic (1024x500px)

### Monday, April 13
- [ ] Internal review of all screenshots -- check readability, accuracy, appeal
- [ ] Upload screenshots to App Store Connect
- [ ] Upload screenshots and feature graphic to Play Console

### Tuesday, April 14
- [ ] Optional: create 15-30 second app preview video
- [ ] Optional: upload video to App Store Connect
- [ ] Final visual asset review

---

## Week 4: April 15-21, 2026 -- Legal, Compliance, and Business

### Wednesday, April 15
- [ ] Write and publish privacy policy (hosted URL)
- [ ] Write and publish terms of service (hosted URL)
- [ ] Verify both URLs are accessible and load correctly

### Thursday, April 16
- [ ] Complete Apple App Privacy nutrition labels:
  - Data collected: Identifiers (anonymous user ID), Usage Data (interactions), Diagnostics (crash logs)
  - Data not linked to user (anonymous auth)
- [ ] Complete Google Play Data Safety section

### Friday, April 17
- [ ] Complete age rating questionnaire (Apple)
- [ ] Complete content rating questionnaire (Google / IARC)
- [ ] COPPA and GDPR compliance self-assessment

### Saturday-Sunday, April 18-19
- [ ] Buffer time -- catch up on any delayed items
- [ ] Prepare support email address and test it
- [ ] Set up basic landing page or App Store redirect URL

### Monday, April 20
- [ ] Configure pricing: Free on both platforms
- [ ] Select availability territories (US, UK, CA, AU, NZ initially)
- [ ] Verify Apple Developer and Google Play Developer accounts are in good standing

### Tuesday, April 21
- [ ] Complete all App Review Information fields in App Store Connect
- [ ] Complete all store listing contact details in Play Console
- [ ] Tax and banking information verified (for future IAP revenue)

---

## Week 5: April 22-28, 2026 -- Build, Test, and Internal Beta

### Wednesday, April 22
- [ ] Configure EAS Build production profile for iOS
- [ ] Run `eas build --platform ios --profile production`
- [ ] Wait for build to complete (30-60 minutes)

### Thursday, April 23
- [ ] Upload iOS build to App Store Connect
- [ ] Wait for processing (1-2 hours)
- [ ] Start TestFlight internal testing
- [ ] Test on at minimum: iPhone SE (3rd gen), iPhone 15, iPhone 16 Pro Max

### Friday, April 24
- [ ] Configure EAS Build production profile for Android
- [ ] Run `eas build --platform android --profile production`
- [ ] Upload AAB to Google Play Internal Testing track
- [ ] Test on minimum 2 Android devices

### Saturday-Sunday, April 25-26
- [ ] Intensive testing: run through all flows on TestFlight
  - Fresh install onboarding
  - Sign in (anonymous, Apple, Google)
  - Home feed loading and scrolling
  - Explore search and filtering
  - Time machine date selection
  - Event detail engagement (save, like, share)
  - Profile screen
  - Dark mode and light mode
  - Poor network conditions
  - Backgrounding and foregrounding

### Monday, April 27
- [ ] Fix critical and high-priority bugs from testing
- [ ] Rebuild if needed
- [ ] Re-test fixed issues

### Tuesday, April 28
- [ ] Open TestFlight external beta to 10-20 testers (friends, fellow history enthusiasts)
- [ ] Share testing instructions and feedback form
- [ ] Monitor crash reports in Firebase Crashlytics

---

## Week 6: April 29 - May 5, 2026 -- External Beta and Polish

### Wednesday, April 29
- [ ] Collect and triage beta tester feedback
- [ ] Prioritize: P0 (crashes, data loss) > P1 (broken features) > P2 (UX issues) > P3 (nice-to-have)

### Thursday, April 30
- [ ] Fix P0 and P1 issues
- [ ] Rebuild and re-upload if needed

### Friday, May 1
- [ ] Fix P2 issues
- [ ] Final performance profiling (launch time, memory, scroll jank)
- [ ] Verify analytics events firing correctly

### Saturday-Sunday, May 2-3
- [ ] Continue external beta (minimum 48 hours for external TestFlight)
- [ ] Monitor for new crash reports
- [ ] Prepare launch announcement copy

### Monday, May 4
- [ ] Finalize all bug fixes
- [ ] Code freeze
- [ ] Build final release candidate

### Tuesday, May 5
- [ ] Upload final RC to App Store Connect
- [ ] Upload final RC to Google Play Console
- [ ] Run one last full regression test

---

## Week 7: May 6-12, 2026 -- Soft Launch

### Wednesday, May 6
- [ ] Submit to Apple App Store for review (with manual release selected)
- [ ] Estimated Apple review time: 1-3 days
- [ ] Submit to Google Play for review (staged rollout: 5%)

### Thursday-Friday, May 7-8
- [ ] Wait for Apple review
- [ ] If Apple requests changes: fix and resubmit immediately
- [ ] Monitor Google Play staged rollout (5% of users)

### Saturday-Sunday, May 9-10
- [ ] Apple app approved (estimated)
- [ ] Soft launch on Apple: release to New Zealand and Australia only
- [ ] Monitor: crash rate, download numbers, user retention

### Monday, May 11
- [ ] Analyze soft launch data (48+ hours of NZ/AU data)
- [ ] Check: crash-free rate > 99.5%
- [ ] Check: no critical user-facing bugs
- [ ] Increase Google Play rollout to 20%

### Tuesday, May 12
- [ ] Fix any issues found during soft launch
- [ ] Rebuild and resubmit update if needed
- [ ] Prepare for global launch

---

## Week 8: May 13-20, 2026 -- Global Launch

### Wednesday, May 13
- [ ] Expand Apple availability to all selected territories (US, UK, CA, AU, NZ)
- [ ] Increase Google Play rollout to 50%
- [ ] Final check: all store listings look correct in each territory

### Thursday, May 14
- [ ] Increase Google Play rollout to 100%
- [ ] Monitor download trends
- [ ] Respond to any early reviews

### Friday, May 15
- [ ] Social media launch teasers
- [ ] Finalize launch day plan
- [ ] Brief anyone helping with launch support

### Saturday-Sunday, May 16-17
- [ ] Buffer / rest before launch week
- [ ] Pre-schedule social media posts for launch day

### Monday, May 18
- [ ] Final pre-launch check: store listings, links, screenshots all correct
- [ ] Verify support email working
- [ ] Test app one more time from a fresh install

### Tuesday, May 19
- [ ] Pre-launch: share with close network, ask for day-one reviews
- [ ] Prepare Product Hunt submission (if planned)

### **Wednesday, May 20, 2026 -- LAUNCH DAY**
- [ ] 8:00 AM: Verify app is live and downloadable in all territories
- [ ] 9:00 AM: Send launch announcement (email list, social media)
- [ ] 10:00 AM: Post on Product Hunt (if planned)
- [ ] 11:00 AM: Share in relevant communities (Reddit r/history, r/apps, Twitter/X)
- [ ] Throughout day: Monitor downloads, crash reports, reviews
- [ ] Throughout day: Respond to all reviews within hours
- [ ] End of day: Download and review tally, note any issues

---

## Post-Launch: May 21-June 3, 2026 (Weeks 9-10)

### Daily Tasks (May 21-June 3)
- [ ] Respond to all reviews within 24 hours
- [ ] Monitor crash reports -- target 99.5%+ crash-free rate
- [ ] Track daily downloads and conversion rate
- [ ] Monitor keyword rankings (manual search or tool)

### Weekly Tasks
- [ ] Week 9 (May 21-27): Analyze first full week of data
  - Downloads by territory
  - Conversion rate (impressions to installs)
  - Review sentiment
  - Top crash reports
  - Plan v1.1.0 based on feedback
- [ ] Week 10 (May 28-June 3): Ship v1.1.0 update
  - Bug fixes from user reports
  - Quick wins from feedback
  - Updated "What's New" text
  - Metadata refinement based on early keyword data

---

## Milestones Summary

| Date | Milestone | Status |
|------|-----------|--------|
| Mar 31 | Feature freeze | Pending |
| Apr 7 | Metadata finalized | Pending |
| Apr 14 | Visual assets complete | Pending |
| Apr 21 | Legal and compliance complete | Pending |
| Apr 28 | TestFlight external beta opens | Pending |
| May 5 | Code freeze, final RC uploaded | Pending |
| May 6 | Submitted to Apple and Google for review | Pending |
| May 9 | Soft launch (NZ/AU) | Pending |
| May 14 | Google Play full rollout | Pending |
| **May 20** | **GLOBAL LAUNCH** | **Pending** |
| Jun 3 | v1.1.0 shipped | Pending |

---

## Contingency Planning

**If Apple review is delayed (> 5 days):**
- Buffer built in: 11 days between submission (May 6) and launch (May 20)
- Can launch Google Play first if Apple is stuck
- Use expedited review request if critical

**If Apple rejects the app:**
- Common reasons: missing privacy policy URL, unclear app purpose, crashes
- Fix within 24 hours and resubmit
- Delay launch by 3-5 days if needed

**If critical bug found during soft launch:**
- Stop staged rollout immediately
- Fix, rebuild, resubmit
- Delay global launch by 1 week (new target: May 27)

**If low conversion rate (< 3% after first week):**
- Immediate: optimize first 2 screenshots
- Week 2: A/B test app icon
- Week 3: rewrite subtitle/short description
- Iterate weekly until CVR improves

**If poor ratings (< 4.0 average):**
- Analyze negative review themes
- Ship quick-fix update within 5 days
- Respond personally to every negative review
- Consider in-app rating prompt timing adjustment

---

**Timeline Status:** On track (56 days to launch)
**Confidence Level:** 80% (solo developer, accounting for review times and unknown bugs)
**Biggest Risks:** Auth migration completion, Apple review timing, data coverage gaps
