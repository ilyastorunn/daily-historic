# A/B Test Setup - Historiq

**Status:** Ready to Configure
**Last Updated:** 2026-03-25
**Platforms:** Apple App Store (Product Page Optimization) + Google Play (Store Listing Experiments)

---

## Test Priority Order

| Priority | Element | Platform | Expected CVR Impact | Implementation Time |
|----------|---------|---------|-------------------|-------------------|
| 1 | App Icon | Both | 15–25% | 3–4 hours (design + upload) |
| 2 | First Screenshot | Both | 10–20% | 2–3 hours |
| 3 | Title Variant | Both | 5–10% | 30 minutes |
| 4 | Short Description | Google only | 3–7% | 30 minutes |

Run tests sequentially, not simultaneously — concurrent tests make it impossible to attribute CVR changes to a specific variable.

---

## Test 1: App Icon (Highest Priority)

### Hypothesis
A refined icon using a gold/navy color scheme with a distinctive symbol (hourglass or compass) will increase install conversion rate by at least 15% over a flat letter-based design.

### Variants

**Control (Version A):** Current launch icon (brand letter "H" or initial design)

**Treatment B — Hourglass:**
- Concept: Stylized hourglass with sand flowing, warm gold tones on deep navy background
- Communicates: Time, history, discovery
- File: `icon-v2-hourglass.png`

**Treatment C — Compass Rose:**
- Concept: Antique compass rose with subtle parchment texture center, gold on dark slate
- Communicates: Exploration, discovery, navigation through history
- File: `icon-v3-compass.png`

### Apple Setup — Product Page Optimization

**Step 1:** App Store Connect > My Apps > Historiq > Product Page Optimization tab

**Step 2:** Click "Create Product Page Optimization Test"
- Test Name: `Icon Test — Launch Variant`
- Reference Page: Default Product Page

**Step 3:** Configure Treatments
- Click "Add Treatment"
- Treatment 1 Name: `Hourglass Icon`
  - Upload `icon-v2-hourglass.png` (1024x1024px PNG, no alpha)
- Treatment 2 Name: `Compass Icon`
  - Upload `icon-v3-compass.png` (1024x1024px PNG, no alpha)

**Step 4:** Set Traffic Split
- Reference (Control): 34%
- Treatment 1 (Hourglass): 33%
- Treatment 2 (Compass): 33%

**Step 5:** Duration and Sample Size
- Minimum duration: 7 days
- Recommended duration: 14 days
- Target: 3,000+ impressions per variant before reading results
- Do not stop early even if one variant looks ahead — wait for statistical significance

**Step 6:** Launch
- Click "Start Test"
- Note start date: ___________

**Step 7:** Read Results (Day 14+)
- Navigate to Product Page Optimization > [Test Name] > Results
- Look for "Improvement over reference" column
- Require 95% confidence before declaring a winner
- If inconclusive after 21 days: extend or declare no winner and move to next test

### Google Play Setup — Store Listing Experiments

**Step 1:** Play Console > Grow > Store listing experiments > Create experiment

**Step 2:** Configure
- Experiment name: `Icon Test — Launch`
- Base store listing: Main listing
- Experiment duration: 14 days

**Step 3:** Add Variants
- Variant A: Upload hourglass icon (512x512px PNG)
- Variant B: Upload compass icon (512x512px PNG)

**Step 4:** Traffic Allocation
- Control: 50%, Variant A: 25%, Variant B: 25%
- (Google requires minimum audience split; adjust based on daily active traffic)

**Step 5:** Start Experiment and monitor in Play Console dashboard

### Decision Criteria
- Winner: Variant with highest install CVR at 95% statistical confidence
- No winner: Retain control, move to Test 2
- Expected outcome: 15–25% CVR improvement with winning icon variant

---

## Test 2: First Screenshot

### Hypothesis
A screenshot that leads with the Time Machine feature (unique differentiator) will outperform a screenshot showing the standard home feed, because differentiation drives installs more than feature comprehensiveness.

### Variants

**Control (Screenshot A — Home Feed):**
- Shows: Personalized event feed with 3 cards
- Overlay text: "History, personalized for you."
- Rationale: Establishes core value prop immediately

**Treatment B — Time Machine Lead:**
- Shows: Time Machine date picker in use with a dramatic event result
- Overlay text: "Travel to any date in history."
- Rationale: No competitor has this feature; novelty drives curiosity installs

**Treatment C — Emotion/Story Lead:**
- Shows: Single dramatic event detail view (e.g., Moon Landing or fall of Rome)
- Overlay text: "5,000 years of history. One app."
- Rationale: Story beats feature lists; emotional resonance at thumbnail size

### Apple Setup

**Step 1:** App Store Connect > Product Page Optimization > Create new test (after Test 1 concludes)
- Test Name: `Screenshot 1 Test — Feature vs Differentiation`

**Step 2:** Add Treatments
- Treatment 1: Upload 5-screenshot set with Time Machine as Screenshot 1
- Treatment 2: Upload 5-screenshot set with emotion/story as Screenshot 1
- (Keep screenshots 2–5 identical across all variants)

**Step 3:** Traffic Split: 34% / 33% / 33%

**Step 4:** Run for 14 days minimum

### Google Play Setup

**Step 1:** Play Console > Store listing experiments > Create experiment
- Experiment name: `Screenshot 1 Test`
- Change: Screenshot order only — swap first screenshot per variant

**Step 2:** Run for 14 days

### Decision Criteria
- Primary metric: Install conversion rate (store listing CVR)
- Secondary metric: Retention D1 (a screenshot that sets wrong expectations increases installs but hurts D1)
- If CVR improves but D1 retention drops more than 5%: do not implement the winning variant — the install promise is misleading

---

## Test 3: Title Variant

### Hypothesis
"On This Day" framing will outperform "History Daily" because it maps to a high-frequency natural language query users already type into search.

### Variants

| Variant | Apple Title | Google Title |
|---------|------------|-------------|
| Control (A) | `Historiq - History Daily` | `Historiq - Daily History & On This Day Events` |
| Treatment B | `Historiq: On This Day` | `Historiq: History App & On This Day Facts` |
| Treatment C | `Historiq Daily History` | `Historiq - History Daily, Time Machine & Events` |

### Apple Setup

**Step 1:** Title changes require a new app submission — they cannot be tested via Product Page Optimization alone (PPO cannot change the title independently)

**Step 2:** Approach for Apple title testing:
- Submit app update with Treatment B title
- Monitor keyword rankings and CVR over 30 days using a third-party ASO tool
- Compare to baseline 30 days at Control title
- This is not a true controlled A/B test on Apple — it is a before/after measurement

**Step 3:** Use AppFollow or AppTweak to monitor:
- Rank changes for "on this day history" and "daily history app"
- Impression volume changes
- CVR changes in App Store Connect Analytics

### Google Play Setup

**Step 1:** Play Console > Store listing experiments > Create experiment
- Experiment name: `Title Test — On This Day vs History Daily`
- Change: App name field only

**Step 2:** Add Variant B title: `Historiq: History App & On This Day Facts`

**Step 3:** Traffic: 50% control / 50% treatment

**Step 4:** Run 21 days (title tests need longer windows due to lower sensitivity)

### Decision Criteria
- Google: Use Play Console experiment results (install CVR and clicks per impression)
- Apple: Use keyword rank change + CVR trend over 30 days
- Revert if top keyword rankings drop without a CVR gain to compensate

---

## Test 4: Short Description (Google Only)

### Hypothesis
A question-hook short description will outperform a feature-list format because it mirrors the exact mental state of a user typing a history query into search.

### Variants

| Variant | Short Description | Characters |
|---------|-----------------|-----------|
| Control (A) | `Discover history daily. Personalized events, Time Machine & era filters.` | 72/80 |
| Treatment B | `What happened on this day in history? Personalized daily events & more.` | 71/80 |
| Treatment C | `Your personal history feed. Daily events, Time Machine & era explorer.` | 70/80 |

### Google Play Setup

**Step 1:** Play Console > Store listing experiments > Create experiment
- Experiment name: `Short Description Test — Question Hook`
- Change: Short description field only

**Step 2:** Add Variant B and Variant C short descriptions

**Step 3:** Traffic: 34% / 33% / 33%

**Step 4:** Run 14 days

### Decision Criteria
- Primary metric: Store listing CVR (clicks that convert to installs)
- The short description is shown in search result cards — high CTR impact
- Require 90% confidence (lower threshold acceptable here given lower-stakes nature of the test)

---

## Measurement and Reporting

### Tools

**Native (Free):**
- App Store Connect Analytics — Impressions, Product Page Views, Conversion Rate, Downloads
- Google Play Console — Store listing conversion rate, Acquisition report, Experiment results

**Third-Party (Recommended):**
- AppTweak or Sensor Tower — Keyword rank tracking, competitor monitoring, historical CVR benchmarks
- Budget: $100–200/month at launch stage

### Weekly Review Template

Every Monday after tests go live, record:

```
Week: ___________
Test Running: ___________

Apple:
- Impressions (7d): _____
- Product Page Views (7d): _____
- Conversion Rate (7d): _____%
- Downloads (7d): _____
- PPO Test Status: Control ____% | Treatment A ____% | Treatment B ____%

Google:
- Store listing visitors (7d): _____
- Installers (7d): _____
- CVR (7d): _____%
- Experiment Status: Control ____% | Variant A ____% | Variant B ____%

Notes / Anomalies:
_____________________
```

### When to Stop a Test Early

Stop early ONLY if:
- A variant shows negative CVR and the confidence is above 95% (prevent ongoing damage)
- A serious bug or content issue is found in a treatment variant

Do NOT stop early for:
- One variant "looking like it's winning" before 95% confidence
- Impatience after fewer than 7 days
- External events (seasonality) — note them, but let the test run

---

## Post-Test Action

After each winning variant is identified:

1. Implement the winner as the new control
2. Document the result: what hypothesis was confirmed or rejected, and by how much
3. Start the next priority test within 7 days of implementing the winner
4. Update `action-metadata.md` with current best-performing metadata fields

Continuous iteration is the mechanism — each test compounds on the last.
