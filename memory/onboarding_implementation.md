---
name: Onboarding — Implementation Progress
description: New 14-step high-converting onboarding flow built on new-onboarding branch
type: project
---

**Status:** Implementation complete. Branch: `new-onboarding`.

**Why:** Redesigned from utilitarian 10-step flow to high-converting 14-step questionnaire sequence. Missing social proof, goal question, pain points, and interactive demo.

**14-Step Flow:**
1. hook — transformation hook (NEW: StepHook.tsx)
2. goal — goal question, single-select (NEW: StepGoal.tsx)
3. name — reused as-is
4. pain-points — multi-select pain chips (NEW: StepPainPoints.tsx)
5. social-proof — testimonials + stat (NEW: StepSocialProof.tsx)
6. tinder-cards — swipeable event stack with reanimated (NEW: StepTinderCards.tsx)
7. solution — personalised solution mirroring pain+goal (NEW: StepSolution.tsx)
8. categories — reused as-is
9. eras — reused as-is
10. personalizing — enhanced with multi-phase messages (MODIFIED)
11. notification-permission — reused as-is
12. notification-time — reused as-is (conditional)
13. account — reused as-is
14. paywall — reused as-is

**New state fields added to OnboardingState + OnboardingData:**
- `goal: GoalOption | null`
- `painPoints: PainPointOption[]`
- `tinderLikes: string[]`
- `tinderDismissals: string[]`

**Files created:**
- components/onboarding/steps/StepHook.tsx
- components/onboarding/steps/StepGoal.tsx
- components/onboarding/steps/StepPainPoints.tsx
- components/onboarding/steps/StepSocialProof.tsx
- components/onboarding/steps/StepTinderCards.tsx
- components/onboarding/steps/StepSolution.tsx

**Files modified:**
- contexts/onboarding-context.tsx (new types + state)
- components/onboarding/types.ts (StepKey union)
- types/user.ts (OnboardingData extended)
- components/onboarding/steps/index.ts (barrel exports)
- components/onboarding/steps/StepPersonalizing.tsx (multi-phase)
- app/onboarding/index.tsx (full rewrite of steps array)

**How to apply:** Run `npm run ios` on new-onboarding branch to test end-to-end.
