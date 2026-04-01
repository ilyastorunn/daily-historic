# Pre-Launch Checklist - Historiq

**Target Launch Date:** May 20, 2026
**Platforms:** Apple App Store (primary), Google Play Store (secondary)
**Bundle Identifier:** com.ilyastorun.histora
**EAS Project ID:** 0a726bd7-ebfe-4119-a928-1492199af645
**Status:** 0/52 items complete

---

## Phase 1: App Store Metadata

### Apple App Store
- [ ] App name "Historiq" reserved in App Store Connect
- [ ] Title finalized (XX/30 chars)
- [ ] Subtitle finalized (XX/30 chars) -- e.g. "Daily History, Personalized"
- [ ] Promotional text written (XX/170 chars)
- [ ] Keywords selected (XX/100 chars)
- [ ] Description written (XXXX/4000 chars)
- [ ] "What's New" text written for v1.0.0
- [ ] All character limits validated
- [ ] Primary category selected: Education
- [ ] Secondary category selected: Reference or Lifestyle

### Google Play Store
- [ ] App name "Historiq" reserved in Play Console
- [ ] Title finalized (XX/50 chars)
- [ ] Short description written (XX/80 chars)
- [ ] Full description written (XXXX/4000 chars)
- [ ] All character limits validated
- [ ] Primary category selected: Education
- [ ] Tags selected (up to 5)

---

## Phase 2: Visual Assets

### App Icon
- [ ] Icon finalized at 1024x1024px (currently exists: `assets/images/icon.png`)
- [ ] Icon tested at small sizes (29x29, 40x40, 60x60, 76x76)
- [ ] Icon follows Apple Human Interface Guidelines (no transparency, no rounded corners baked in)
- [ ] Android adaptive icon verified (foreground, background, monochrome layers exist)
- [ ] Icon uploaded to App Store Connect
- [ ] Icon uploaded to Play Console

### Screenshots (Apple)
- [ ] 6.7" iPhone screenshots created (1290x2796px) -- REQUIRED (iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max)
- [ ] 6.5" iPhone screenshots created (1284x2778px) -- iPhone 14 Plus / 15 Plus
- [ ] 5.5" iPhone screenshots created (1242x2208px) -- legacy, recommended
- [ ] Minimum 3 screenshots per size, recommended 6-10
- [ ] First screenshot: hero shot showing daily feed with historical event
- [ ] Second screenshot: onboarding / personalization flow
- [ ] Third screenshot: time machine feature
- [ ] Text overlays readable at 24pt+ font
- [ ] Screenshots uploaded to App Store Connect

### Screenshots (Google)
- [ ] Phone screenshots created (1080x1920px minimum)
- [ ] Feature graphic created (1024x500px) -- REQUIRED
- [ ] Screenshots uploaded to Play Console

### App Preview Video (Optional but Recommended)
- [ ] 15-30 second preview video created (Apple)
- [ ] Video shows core loop: open app -> see today's events -> explore -> save
- [ ] Subtitles added

---

## Phase 3: Technical Requirements

### Apple App Store
- [ ] EAS Build configured for production (`eas build --platform ios --profile production`)
- [ ] App binary built and uploaded to App Store Connect
- [ ] Build processed without errors
- [ ] TestFlight internal testing completed (minimum 3 devices)
- [ ] TestFlight external beta testing completed (10+ testers, 48-hour minimum)
- [ ] Crash reports reviewed -- zero P0 crashes
- [ ] Performance tested on oldest supported device (iPhone SE 3rd gen / iPhone XR)
- [ ] iOS version compatibility confirmed (iOS 16.0+)
- [ ] Memory usage profiled (< 200MB peak)
- [ ] App launch time < 3 seconds on cold start

### Google Play Store
- [ ] EAS Build configured for Android production (`eas build --platform android --profile production`)
- [ ] AAB built and uploaded to Play Console
- [ ] Internal testing track created and tested
- [ ] Crash reports reviewed -- zero P0 crashes
- [ ] Performance tested on mid-range Android device
- [ ] Android version compatibility confirmed (API 24+ / Android 7.0+)

---

## Phase 4: Legal and Compliance

### Required for Both Platforms
- [ ] Privacy policy published at accessible URL
- [ ] Terms of service published (app has user accounts)
- [ ] Age rating completed -- likely 4+ (Apple) / Everyone (Google)
- [ ] COPPA compliance verified (app is not directed at children under 13)
- [ ] GDPR compliance verified (anonymous auth collects device data)

### Apple-Specific
- [ ] App Review Information completed (notes for reviewer)
- [ ] Demo account credentials provided (or note that anonymous auth is automatic)
- [ ] Export compliance: `ITSAppUsesNonExemptEncryption` set to `false` (already configured)
- [ ] App Privacy nutrition labels completed (data types: identifiers, usage data, diagnostics)

### Google-Specific
- [ ] Target audience and content declaration completed
- [ ] Data safety section filled out (anonymous auth, Firestore data, analytics)
- [ ] Store listing contact details provided (email, website)
- [ ] Content rating questionnaire completed (IARC)

---

## Phase 5: Business Setup

### Apple App Store
- [ ] Apple Developer account active ($99/year)
- [ ] Pricing configured: Free with IAP (Deep Dive premium planned)
- [ ] Availability territories selected (start with US, UK, CA, AU, NZ)
- [ ] Tax and banking information completed (for future IAP)
- [ ] App category: Education (primary), Reference (secondary)

### Google Play Store
- [ ] Google Play Developer account active ($25 one-time)
- [ ] Pricing configured: Free
- [ ] Distribution countries selected (match Apple territories)
- [ ] Merchant account setup (for future IAP)
- [ ] App category: Education

---

## Phase 6: Marketing Preparation

- [ ] App website or landing page live (even a simple one-pager)
- [ ] Support email set up and monitored (e.g. support@historiq.app)
- [ ] Social media presence created (at minimum Twitter/X, optional Instagram)
- [ ] Press kit prepared (icon, screenshots, one-paragraph description)
- [ ] Launch announcement drafted (email, social, Product Hunt if applicable)
- [ ] Analytics integrated and verified (Firebase Analytics or equivalent)
- [ ] Crash reporting integrated (Firebase Crashlytics)

---

## Phase 7: ASO Foundation

- [ ] Primary keywords identified and integrated into title/subtitle
- [ ] Long-tail keywords mapped into description naturally
- [ ] Competitor apps analyzed (This Day in History, On This Day, Timehop, History Channel)
- [ ] Keyword ranking tracking set up (AppTweak, Sensor Tower, or manual spreadsheet)
- [ ] A/B testing plan documented (icon variants, screenshot order)
- [ ] Localization assessment completed (English first, then evaluate Spanish, German, French)

---

## Final Validation

- [ ] All metadata spell-checked and grammar-checked
- [ ] All links working (privacy policy, support URL, website)
- [ ] Screenshots show actual app UI (not mockups or placeholders)
- [ ] App follows Apple Human Interface Guidelines
- [ ] App follows Google Material Design guidelines
- [ ] Story of the Day feature either working or cleanly disabled before submission
- [ ] No placeholder content visible in any screen
- [ ] Deep link scheme (`historiq://`) tested
- [ ] Submitted for review

---

**Total Items:** 52
**Completed:** 0
**Remaining:** 52

**Status:** In progress (0% complete)

**Estimated Time to Complete All Items:** 45-60 hours of focused work (spread over 8 weeks)

**Known Blockers:**
- Firebase authentication migration in progress (anonymous -> Apple Sign-In / Google Sign-In)
- Story of the Day feature disabled due to Wikimedia image loading issues
- Deep Dive premium feature is stub only (not blocking v1.0 launch)
