# Daily Historical Insights App — Onboarding Flow

## Overview
- **Flow Name**: "Your History Journey Begins"
- **Goal**: Capture essential preferences (account, time zone, interests) and establish a daily reminder so users experience a personalized history feed on day one.
- **Principles**: Show value early, keep momentum, minimize token fatigue, and ensure the notification promise is clear.

## Step-by-Step Flow

### 1. Spark & Value (Welcome)
- **Screen Title**: "Welcome to [App Name]!"
- **Visual**: Immersive collage tile with subtle motion blur and accent glow.
- **Copy**: "Discover history, every day." Subheadline: "Uncover fascinating events tailored just for you."
- **CTA**: Primary footer `Continue`; secondary hero chip `See today’s highlight` toggles preview state.

### 2. Quick Account Stub
- **Purpose**: Secure email/OAuth early to store preferences and sync progress.
- **Copy**: "Create your free account to sync favorites and keep daily streaks."
- **Options**: `Continue with Google`, `Continue with Apple`, carded email capture (`Save email`), and `Continue without account (limited)`.
- **Behavior**: OAuth/guest choices advance immediately; email validates basic format before continuing.

### 3. Time Zone & Reminder Intent
- **Screen Title**: "When should we visit?"
- **Elements**:
  - Auto-detected time zone (editable text field).
  - Reminder window chips (`Morning`, `Afternoon`, `Evening`, `Off`) with live status copy.
  - Reminder toggle is implied: selecting `Off` disables daily reminders.
- **Validation**: `Save preferences` CTA writes values, then footer continue is available.

### 4. Interests — Historical Eras
- **Prompt**: "Which eras captivate you most?"
- **UI**: Multi-select chips (Ancient, Medieval, Renaissance, 17th–18th, 19th Century, 1900s, 21st Century, Prehistory) plus `I’m open to everything`.
- **Logic**: Selecting `I’m open to everything` clears other chips; messaging encourages at least one pick.

### 5. Interests — Themes & Story Types
- **Prompt**: "What kinds of stories keep you intrigued?"
- **Chips**: `Wars & Revolutions`, `Science & Innovation`, `Art & Culture`, `Politics & Leaders`, `Social Movements`, `Biographies`, `Daily Life & Society`, `Mysteries`, `Exploration`, `Entertainment & Sport`, `Surprise me`.
- **Logic**: Selecting `Surprise me` clears other chips; copy nudges toward ≥3 selections.

### 6. Regional Focus (Optional)
- **Prompt**: "Should we spotlight a region?"
- **Controls**: Text field for freeform region/country plus chips for `No preference` and `Surprise me`.
- **Persistence**: Clearing input reverts to `No preference`; chips sync with text field state.

### 7. Engagement Preference Summary
- **Purpose**: Reinforce commitment and capture format preference.
- **Cards**: `Quick reads (1 min)`, `In-depth dives`, `Mix it up` (single select).
- **Extras**: Inline ghost button toggles weekly recap email; confirmation copy reflects selection.

### 8. Reminder Permission & Push Prompt
- **Screen Title**: "Stay on top of history."
- **Copy**: Reinforces reminder window selection and streak value.
- **CTAs**: `Enable notifications` + `Maybe later`; state captured as `enabled` or `declined` for future re-asks.

### 9. Personalization Loading State
- **Screen Title**: "Curating your history feed..."
- **Animation**: Timeline progressing, gears turning.
- **Copy**: "Training your time machine with eras and themes you love."
- **Behavior**: Shown only while personalization API resolves; display progress bar if >1.5s.

### 10. First Experience Tour
- **Screen Title**: "You’re set for today"
- **Content**: Card summarizing what to expect (hero event, personalized timeline, reminder status) with bullet list and helper text.
- **CTA**: Footer `Enter Dashboard` advances to main tabs; future release can add contextual tooltips.

## Additional Guidelines
- **Progress Indicator**: Persistent header counter (`Step X of 10`) with animated progress bar.
- **Skip Logic**: Only optional on region and account creation; if account skipped, prompt after first save/share attempt post-onboarding.
- **Visual Consistency**: Maintain warm color palette, subtle gradients, and micro-animations for chip selections.
- **Micro-interactions**: Provide haptic feedback (mobile) and animated chips when selections made.
- **Analytics Instrumentation**: `onboarding_step_viewed`, `onboarding_step_completed`, `onboarding_account_choice`, `push_permission_result`, `onboarding_flow_completed`.
- **A/B Testing Opportunities**:
  - Placement of account creation (Step 2 vs. post-interest).
  - Reminder opt-in default state.
  - Teaser preview vs. straight flow.
- **Content Prep**: Preload hero teaser event aligned with most popular selections to show instant personalization.
- **Accessibility**: WCAG AA contrast, support VoiceOver/TalkBack, ensure all CTAs reachable with switch control.

## Next Actions
1. Build Figma prototype with revised step order and progress indicator.
2. Conduct 5 usability sessions focusing on comprehension and drop-off.
3. Implement analytics events and baseline funnel dashboards prior to beta.
