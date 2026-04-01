# App Store Submission Guide - Historiq

**Last Updated:** March 25, 2026
**Primary Platform:** Apple App Store (iOS)
**Secondary Platform:** Google Play Store (Android)

---

## Part 1: Apple App Store Submission

### Prerequisites

Before you begin, confirm the following are ready:

- [ ] Apple Developer Program membership active ($99/year)
- [ ] App Store Connect access at https://appstoreconnect.apple.com
- [ ] Xcode installed (latest stable version)
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] EAS logged in (`eas login`)
- [ ] All visual assets prepared (icon, screenshots)
- [ ] All metadata written and reviewed
- [ ] Privacy policy hosted at a public URL
- [ ] TestFlight testing completed

---

### Step 1: Create the App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" then the "+" button, select "New App"
3. Fill in:
   - **Platform:** iOS
   - **Name:** Historiq
   - **Primary Language:** English (US)
   - **Bundle ID:** com.ilyastorun.histora (must match `app.config.js`)
   - **SKU:** historiq-ios-001 (any unique string)
   - **User Access:** Full Access
4. Click "Create"

---

### Step 2: Configure App Information

Navigate to "App Information" in the left sidebar:

1. **Name:** Historiq
2. **Subtitle:** Daily History, Personalized
3. **Category:**
   - Primary: Education
   - Secondary: Reference
4. **Content Rights:** Does not contain third-party content (or declare Wikipedia/Wikimedia as source with appropriate licensing)
5. **Age Rating:** Click "Edit" and complete the questionnaire
   - No mature content, violence, or gambling
   - Expected result: 4+

---

### Step 3: Enter Pricing and Availability

1. **Price:** Free
2. **Availability:**
   - Start with: United States, United Kingdom, Canada, Australia, New Zealand
   - Expand after successful launch
3. **Pre-Order:** Optional (can enable to collect interest before launch)

---

### Step 4: Prepare the Version (1.0.0)

Navigate to the version page (iOS App > 1.0.0):

#### Screenshots
Upload for each required device size:
- **6.7" Display** (iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max): 1290x2796px -- REQUIRED
- **6.5" Display** (iPhone 14 Plus / 15 Plus): 1284x2778px
- **5.5" Display** (iPhone 8 Plus): 1242x2208px

Upload 6-10 screenshots per size. Order matters -- first 3 are visible in search results.

#### App Preview Video (Optional)
- Format: H.264, 30fps
- Resolution: Match screenshot sizes
- Duration: 15-30 seconds
- No audio required, add text overlays

#### Promotional Text
```
Discover the history that shaped today. Personalized daily events tailored to your interests.
```
(Can be changed anytime without a new submission)

#### Description
Write 2000-3000 characters. Include keywords naturally. Structure:
- Opening hook (what the app does, why it matters)
- Key features (bullet points work well)
- Social proof or unique value proposition
- Call to action

#### Keywords
100 characters, comma-separated. Example:
```
history,today in history,historical events,this day,on this day,daily history,time machine,education
```

#### What's New
```
Welcome to Historiq! Discover personalized historical events for every day of the year. Choose your favorite eras and categories, explore the time machine, and save the moments that fascinate you.
```

#### Support URL
Your support email or help page URL.

#### Marketing URL
Your website or landing page URL (optional but recommended).

---

### Step 5: App Review Information

This section helps the Apple reviewer test your app:

1. **Contact Information:**
   - First Name, Last Name, Phone, Email

2. **Demo Account:** (if login required)
   - For Historiq: "No sign-in required. The app uses anonymous authentication on first launch. Users can optionally sign in with Apple or Google from the Profile tab."

3. **Notes for Reviewer:**
```
Historiq delivers personalized historical events based on user preferences.

On first launch:
1. The app shows a multi-step onboarding flow where users select their preferred historical eras and categories
2. After onboarding, the Home tab shows curated events for today's date
3. The Explore tab allows searching and filtering historical events
4. The Time Machine feature lets users browse events from any date
5. Users can save and react to events

Authentication is anonymous by default. Users can optionally link their account via Apple Sign-In or Google Sign-In from the Profile tab.

No demo account is needed -- the app works immediately after install.
```

4. **Attachment:** Optionally attach a short screen recording showing the main flow.

---

### Step 6: App Privacy

Navigate to "App Privacy" in App Store Connect:

1. **Privacy Policy URL:** [Your hosted URL]

2. **Data Collection:**
   Click "Get Started" and declare:

   | Data Type | Collected | Linked to User | Used for Tracking |
   |-----------|-----------|----------------|-------------------|
   | User ID (anonymous) | Yes | No | No |
   | Usage Data (interactions) | Yes | No | No |
   | Diagnostics (crash logs) | Yes | No | No |
   | Preferences (era/category) | Yes | No | No |

3. Purpose: "App Functionality" and "Analytics"

---

### Step 7: Build and Upload

#### Using EAS Build (Recommended)

```bash
# Ensure eas.json has a production profile
# Build for iOS
eas build --platform ios --profile production

# After build completes, submit to App Store Connect
eas submit --platform ios
```

#### Manual Upload (Alternative)
1. Download the .ipa from EAS dashboard
2. Open Transporter app on macOS
3. Drag and drop the .ipa
4. Click "Deliver"
5. Wait for processing in App Store Connect (1-2 hours)

#### Verify Build
1. In App Store Connect, go to "TestFlight" tab
2. Confirm the build appears and has status "Ready to Submit"
3. If there are compliance warnings, address them

---

### Step 8: Select Build and Submit

1. Go to the version page (1.0.0)
2. Scroll to "Build" section
3. Click "+" to select the build you uploaded
4. Choose the processed build
5. Scroll through all sections -- verify everything is filled in (green checkmarks)
6. **Release method:** Select "Manually release this version" (for controlled launch)
7. Click "Submit for Review"

---

### Step 9: Post-Submission

- **Review time:** Typically 24-48 hours, can take up to 5 days
- **Status tracking:** Check App Store Connect for status changes
  - "Waiting for Review" -> "In Review" -> "Ready for Sale" (or "Rejected")
- **If rejected:** Read the rejection reason carefully, fix the issue, resubmit
  - Common rejection reasons:
    - Crashes during review
    - Missing privacy policy
    - Guideline 4.0: Design (UI issues)
    - Guideline 2.1: Performance (bugs)
  - You can reply to the reviewer in Resolution Center

---

## Part 2: Google Play Store Submission

### Step 1: Create the App in Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - **App name:** Historiq
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
4. Accept declarations and click "Create app"

---

### Step 2: Set Up Store Listing

Navigate to "Main store listing":

1. **App name:** Historiq - Daily History, Personalized
2. **Short description:** Discover what happened today in history. Personalized events, curated for you.
3. **Full description:** (Similar to Apple, optimized for Google's algorithm -- can be longer and more keyword-rich)
4. **App icon:** 512x512px PNG
5. **Feature graphic:** 1024x500px PNG -- REQUIRED
6. **Screenshots:** Minimum 2, recommended 8 (1080x1920px minimum)

---

### Step 3: Content Rating

1. Navigate to "Content rating"
2. Start the IARC questionnaire
3. Answer truthfully (no violence, gambling, mature content)
4. Expected result: Rated for Everyone

---

### Step 4: Data Safety

1. Navigate to "Data safety"
2. Declare:
   - App collects: Device identifiers (anonymous), App interactions, Crash logs
   - Data is encrypted in transit (Firebase uses HTTPS)
   - Users cannot request data deletion (note: may need to implement for compliance)
   - Data is not shared with third parties

---

### Step 5: Target Audience

1. Navigate to "Target audience and content"
2. Target age group: 13+ (not primarily for children)
3. Confirm app is not designed for children under 13

---

### Step 6: Build and Upload

```bash
# Build AAB for Android
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

Select "Internal testing" track initially. After testing, promote to Production.

---

### Step 7: Staged Rollout

1. Start at 5% rollout
2. Monitor for 48 hours
3. Check crash rate (target < 0.5%)
4. If stable, increase to 20%, then 50%, then 100%
5. Each stage: monitor for 24-48 hours before increasing

---

### Step 8: Release

1. Once at 100% rollout and stable, the app is fully live
2. Google review typically takes 1-3 days for first submission, faster for updates

---

## Part 3: Post-Submission Monitoring

### First 24 Hours After Going Live

- [ ] Verify app appears in search results for "Historiq"
- [ ] Verify app page displays correctly (screenshots, description, icon)
- [ ] Download app from store on a fresh device -- test full flow
- [ ] Monitor crash reports (App Store Connect / Play Console / Firebase Crashlytics)
- [ ] Monitor first reviews and respond immediately

### First Week

- [ ] Track daily impressions and conversion rate
- [ ] Search for app using target keywords -- note positions
- [ ] Respond to every review within 24 hours
- [ ] Identify top crash reports and plan fixes
- [ ] Prepare v1.1.0 update with bug fixes

---

## Quick Reference: EAS Commands

```bash
# Build iOS production
eas build --platform ios --profile production

# Build Android production
eas build --platform android --profile production

# Submit iOS to App Store Connect
eas submit --platform ios

# Submit Android to Google Play
eas submit --platform android

# Build and submit in one command
eas build --platform ios --profile production --auto-submit
eas build --platform android --profile production --auto-submit

# Check build status
eas build:list --platform ios --limit 5
eas build:list --platform android --limit 5
```

---

## Estimated Timeline for Submission Process

| Step | Apple | Google |
|------|-------|--------|
| Build time (EAS) | 20-40 min | 15-30 min |
| Processing after upload | 1-2 hours | < 1 hour |
| Review time (first submission) | 1-3 days | 2-7 days |
| Review time (updates) | 1-2 days | 1-3 hours |
| Staged rollout recommended | No (but use limited territories) | Yes (5% -> 20% -> 50% -> 100%) |

---

**Remember:** Submit to Apple first (longer review time), then Google. Build in buffer time. The first submission always takes longest.
