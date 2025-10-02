# Daily Historical Insights App — Onboarding Flow

## Overview
- **Flow Name**: "Your History Journey Begins"
- **Goal**: Capture core content preferences, notification intent, and basic account choice so the user lands in a personalized feed on first launch.
- **Principles**: Show value quickly, keep completion light, and reuse captured signals to personalize reminders and feed content.
- **Implementation Notes**: Anonymous Firebase users are created on first app launch. When onboarding finishes we write a `Users/{uid}` document in Firestore and mark `onboardingCompleted: true`, preventing the flow from showing again.

## Step-by-Step Flow (current build)

### 1. Welcome
- **Screen Title**: "Welcome"
- **Purpose**: Set the tone for the experience and explain the value.
- **UI**: Hero image + intro copy. Primary CTA `Get Started` advances to Step 2.

### 2. Preview
- **Purpose**: Highlight the type of daily content that will be delivered.
- **Behavior**: Users swipe through sample cards; footer CTA continues.

### 3. Categories
- **Prompt**: "What kinds of stories interest you?"
- **Options**: Multi-select historical themes (e.g., world wars, science discovery, art & culture, surprise).
- **Validation logic**: User must select at least one theme unless they toggle `Continue without picking` (`categoriesSkipped`). Selecting `Surprise` qualifies as a valid choice by itself.

### 4. Eras
- **Prompt**: "Pick the eras you want more of"
- **UI**: Multi-select chips for historical eras. No minimum selection requirement.

### 5. Notification Permission
- **Purpose**: Explain the benefit of reminders before triggering the system prompt.
- **Outcomes**: `pushPermission` recorded as `enabled` or `declined`.
- **Logic**: If a user declines, the dedicated reminder time step is skipped automatically.

### 6. Reminder Time *(conditional)*
- **Shown only when**: `pushPermission === 'enabled'`.
- **Prompt**: "Choose when to receive your daily story"
- **Validation**: A reminder time must be selected before continuing.

### 7. Account Choice
- **Purpose**: Let the user link an account or continue as a guest.
- **Options**: Email sign-up (with validation for email format, password length/match, terms acceptance) and social placeholders (Apple, Google, Meta). "Continue without Sign Up" advances as an anonymous user.
- **Behavior**: Social options immediately advance and record the chosen method; email form persists selections in context for use in future auth work but we currently finalize onboarding regardless of sign-in success.

### Completion
- When the final step is confirmed we call `completeOnboarding` which saves:
  - Categories, eras, notification settings, timezone (auto-detected), account selection, and whether categories were skipped.
  - Metadata: `onboardingCompleted: true`, timestamps, and preview state.
- On success the app replaces the stack with `/(tabs)`. Failures are logged but the user proceeds to the main experience.

## Data & Persistence
- **Auth**: `UserProvider` signs in anonymously on launch via Firebase Auth.
- **Firestore**: User preferences stored in `Users/{uid}` with a normalized shape:
  ```ts
  interface UserProfile {
    uid: string;
    name?: string;
    age?: string;
    gender?: string;
    displayName?: string;
    accountSelection: 'email' | 'google' | 'apple' | 'meta' | 'anonymous' | null;
    emailAddress?: string;
    timezone: string;
    categories: CategoryOption[];
    categoriesSkipped: boolean;
    eras: EraOption[];
    notificationEnabled: boolean;
    notificationTime?: string;
    pushPermission: PushPermission;
    heroPreviewSeen: boolean;
    additionalNotes?: string;
    onboardingCompleted: boolean;
    createdAt?: FirebaseFirestoreTypes.Timestamp;
    updatedAt?: FirebaseFirestoreTypes.Timestamp;
  }
  ```
  We merge updates so re-running the flow can augment existing data without overwriting.
- **Context Layer**: `useUserContext` exposes `initializing`, `onboardingCompleted`, and the `completeOnboarding` handler to both the index route (for routing decisions) and onboarding flow.
- **Routing**: The index route waits for initialization, then redirects to onboarding or the main tab navigator based on `onboardingCompleted`.

## UX Guidelines
- **Progress Indicator**: Header shows `Step X of Y` with a dynamic progress bar. The reminder time step is omitted from the count when notifications are declined.
- **Skip Logic**:
  - Notification-time step skipped when reminders are declined.
  - Categories may be bypassed via the "skip" affordance but we still capture that intent.
  - Account creation is optional; skipping keeps the anonymous Firebase user active.
- **Accessibility**: Maintain WCAG AA color contrast, ensure chip groups and buttons are accessible to screen readers, and provide haptic feedback on major selections.
- **Analytics (planned)**: Instrument `onboarding_step_viewed`, `onboarding_step_completed`, `onboarding_flow_completed`, `onboarding_notification_permission`, and `onboarding_account_choice` events using the context data once analytics wiring lands.

## Future Enhancements
1. Hook up real social/Email authentication once backend endpoints are ready.
2. Add a confirmation toast/state change when Firestore writes succeed or fail.
3. Expand analytics coverage and build funnel dashboards for drop-off monitoring.
