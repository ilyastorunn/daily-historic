# Content-Category-Era QC Report

Date: 2026-04-13  
Scope: `onboarding -> profile -> home hero selection -> explore filters`  
Method: Code audit + scenario simulation + read-only production sampling (Firestore + Algolia)

## Executive Summary

- Explore filter pipeline is structurally correct (`category OR`, `era AND`, `date AND`) and sampled Algolia responses were accurate for all tested combinations.
- Onboarding -> profile persistence and profile -> home/explore reads are consistent.
- Largest quality risk is data completeness: many `contentEvents` documents have empty `categories` and missing `era`, which weakens personalization.
- Home hero personalization behaves deterministically and only breaks strict preference matching when no candidate exists in digest (fallback by design), but fallback reason is not surfaced.
- Wikimedia fallback events currently infer categories but do not infer `era`, causing weaker era alignment when this fallback is active.

## Findings (Severity Ordered)

### 1) [High] Data completeness gap in `contentEvents` reduces preference accuracy

Evidence (read-only scan of production Firestore `contentEvents`):
- total: `19737`
- empty `categories`: `15558`
- missing `era`: `15558`
- invalid category values: `0`
- invalid era values: `0`
- missing/invalid `date.month/day`: `0`

Impact:
- Home and Explore can only match user preferences when `categories`/`era` exist.
- Empty metadata significantly reduces meaningful personalization, especially for category/era constrained profiles.

### 2) [Medium] Wikimedia daily digest fallback does not set `era`

Code evidence:
- `services/wikimedia-digest.ts` maps fallback events with `categories` and `date` but no `era` field ([services/wikimedia-digest.ts](/Users/ilyastorun/Desktop/daily-historic/services/wikimedia-digest.ts:354)).

Impact:
- If Firestore digest misses and Wikimedia fallback is used, era-based preference matching degrades.

### 3) [Medium] Home hero fallback reason is implicit, not observable

Code evidence:
- Home selection returns `eraMatches[0] ?? categoryMatches[0] ?? events[0]` ([app/(tabs)/index.tsx](/Users/ilyastorun/Desktop/daily-historic/app/(tabs)/index.tsx:292)).

Observed behavior:
- Across 120 latest digests, strict mismatch only happened when no strict candidate existed for that profile.
- This is expected by current logic, but no reason code/telemetry exposes “no candidate, fallback used”.

Impact:
- Harder to distinguish “algorithm bug” vs “content coverage gap”.

### 4) [Low] Legacy type drift risk in Functions type definitions

Code evidence:
- `functions/src/types.ts` category/era unions differ from app/onboarding vocabulary ([functions/src/types.ts](/Users/ilyastorun/Desktop/daily-historic/functions/src/types.ts:5)).

Impact:
- Current app Explore path uses Algolia client directly, so immediate runtime impact is limited.
- Future backend usage may regress if these types are used as source of truth.

## Confirmed Scenarios

## Onboarding -> Profile Consistency

- Onboarding writes `categories`, `categoriesSkipped`, `eras` to completion payload ([app/onboarding/index.tsx](/Users/ilyastorun/Desktop/daily-historic/app/onboarding/index.tsx:160)).
- `completeOnboarding` persists sanitized payload to `Users/{uid}` ([contexts/user-context.tsx](/Users/ilyastorun/Desktop/daily-historic/contexts/user-context.tsx:454)).
- Profile normalization reads categories/eras robustly as arrays ([contexts/user-context.tsx](/Users/ilyastorun/Desktop/daily-historic/contexts/user-context.tsx:195)).
- `surprise` exclusivity is enforced in onboarding and profile edit flows ([components/onboarding/steps/StepCategories.tsx](/Users/ilyastorun/Desktop/daily-historic/components/onboarding/steps/StepCategories.tsx:225), [app/(tabs)/profile.tsx](/Users/ilyastorun/Desktop/daily-historic/app/(tabs)/profile.tsx:1331)).

## Home Personalization Scenario Matrix (10 profiles, 120 latest digests)

Metric definitions:
- `strictPass`: selected hero satisfies requested category/era constraints.
- `hasCandidate`: digest contains at least one strict candidate.

Results:
- `single_cat_politics`: pass `110/120`, hasCandidate `110/120`
- `single_cat_science`: pass `18/120`, hasCandidate `18/120`
- `multi_cat_science_inventions`: pass `23/120`, hasCandidate `23/120`
- `single_era_twentieth`: pass `120/120`, hasCandidate `120/120`
- `single_era_medieval`: pass `79/120`, hasCandidate `79/120`
- `multi_era_modern_mix`: pass `120/120`, hasCandidate `120/120`
- `cat_plus_era_politics20`: pass `87/120`, hasCandidate `87/120`
- `cat_plus_era_science19`: pass `4/120`, hasCandidate `4/120`
- `surprise`: pass `120/120`, hasCandidate `120/120`
- `empty`: pass `120/120`, hasCandidate `120/120`

Interpretation:
- `strictFail == noCandidate` in all tested profiles. No evidence of wrong candidate selection when candidate exists.

## Explore Filter Accuracy

Code path evidence:
- UI state to search params wiring ([app/(tabs)/explore.tsx](/Users/ilyastorun/Desktop/daily-historic/app/(tabs)/explore.tsx:867)).
- Filter expression builder (`OR` for categories, `AND` across dimensions) ([search/algolia-query.ts](/Users/ilyastorun/Desktop/daily-historic/search/algolia-query.ts:20)).

Live sampled checks against Algolia (violations = returned item not matching applied filters):
- `categories:"politics"` -> hits `50`, violations `0`
- `(science-discovery OR inventions) AND era:"twentieth"` -> hits `26`, violations `0`
- `era:"medieval"` -> hits `50`, violations `0`
- `month=7 AND day=20` -> hits `41`, violations `0`
- `query="apollo" + categories:"exploration" + era:"twentieth"` -> hits `10`, violations `0`

Conclusion:
- Sampled filter accuracy met `100%` criterion for tested combinations.

## Open Risks / Technical Debt

- Metadata sparsity in Firestore (`categories`/`era` mostly empty) is the primary blocker to stronger personalization quality.
- Home fallback path has no explicit reason telemetry.
- Wikimedia fallback lacks `era` derivation.
- Functions type vocabulary drift should be harmonized to avoid future backend divergence.

## Prioritized Quick Fix List

1. Backfill `categories` and `era` for existing `contentEvents` (highest impact on personalization quality).  
2. Add `era` inference in Wikimedia fallback mapping (`services/wikimedia-digest.ts`).  
3. Emit explicit fallback reason from home selector (`matched_era`, `matched_category`, `fallback_first`) for observability.  
4. Add automated QC script (CI/manual) that fails on:
   - invalid category/era values
   - empty category+era ratio above threshold
   - Explore filter invariant violations in sampled records
5. Align `functions/src/types.ts` category/era enums with onboarding/app vocabulary.

## Notes on Other Home Modules

- Monthly Collection and Time Machine modules are not personalized by onboarding category/era in current implementation. This appears intentional product scope, but should be tracked as a potential personalization gap (not a bug).
