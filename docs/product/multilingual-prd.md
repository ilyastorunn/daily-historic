# Multilingual Support — PRD & Technical Preparation

**Date:** 2026-03-13
**Status:** Planning
**MVP Goal:** Launch with 2 languages (English + Turkish)

---

## Wikipedia / Wikimedia API — Language Support

The Wikimedia "On This Day" API supports multiple languages. Language is selected by changing the `en` segment in the URL path:

```
https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected  ← English
https://api.wikimedia.org/feed/v1/wikipedia/tr/onthisday/selected  ← Turkish
https://api.wikimedia.org/feed/v1/wikipedia/es/onthisday/selected  ← Spanish
https://api.wikimedia.org/feed/v1/wikipedia/de/onthisday/selected  ← German
https://api.wikimedia.org/feed/v1/wikipedia/fr/onthisday/selected  ← French
```

The Wikidata enrichment client (`scripts/ingest/wikidata-client.ts`) already accepts a `language?: string` parameter — that layer is ready. Only the Wikimedia feed endpoint is hardcoded to English.

---

## Current State Audit

| Component | Status |
|---|---|
| Wikimedia API language | Hardcoded `/en/` in URL |
| Wikidata enrichment | `language?: string` already supported ✅ |
| Firestore event content | Single language (English only) |
| User profile language preference | No field exists |
| UI text (categories, eras, labels) | All hardcoded English strings |
| i18n library | Not installed |
| `expo-localization` | Not installed (available in Expo ecosystem) |
| Date formatting | Hardcoded `'en-US'` locale in most places |

### Files with Hardcoded Language

- `services/wikimedia-digest.ts:5` — `https://api.wikimedia.org/feed/v1/wikipedia/en/...`
- `scripts/ingest/wikimedia-client.ts:13` — Same endpoint
- `constants/personalization.ts` — All category and era labels in English
- `utils/dates.ts` — `new Intl.DateTimeFormat('en-US', ...)` in multiple places
- All UI component strings — No translation key system

---

## Recommended Architecture

### Content Storage — Translation Subfield Approach

Store the primary language inline, add `translations` map for additional languages:

```
contentEvents/{eventId}
├── text: string                    ← primary (English)
├── summary: string                 ← primary (English)
├── tags: string[]                  ← primary (English)
├── translations: {
│     tr: {
│       text: string
│       summary: string
│       tags: string[]
│     }
│     es: {
│       text: string
│       summary: string
│       tags: string[]
│     }
│   }
└── (all other fields unchanged)
```

**Why this approach:**
- No breaking change to existing queries
- Fallback to primary (English) is trivial when translation is missing
- Ingestion can be run incrementally per language
- Single document fetch per event regardless of language

### User Language Preference

Add `language` field to `OnboardingData` and `UserProfile` in `types/user.ts`:

```typescript
type LanguageCode = 'en' | 'tr' | 'es' | 'de' | 'fr'

interface OnboardingData {
  // ...existing fields
  language: LanguageCode
}
```

**Detection strategy:**
1. Auto-detect from device via `expo-localization` → `getLocales()[0].languageCode`
2. Offer override in onboarding (language selection step)
3. Allow change in Profile settings post-onboarding

---

## Implementation Plan (MVP — EN + TR)

### Phase 1: Data Layer

1. **`types/events.ts`** — Add `translations` field to `ContentEvent`
2. **`types/user.ts`** — Add `language: LanguageCode` to `OnboardingData` and `UserProfile`
3. **Ingestion pipeline** — Add `--language=tr` CLI argument to `scripts/ingest/run.ts`:
   - Fetches from Turkish Wikipedia endpoint
   - Runs Wikidata enrichment with `language: 'tr'`
   - Writes result to `translations.tr` subfield (not a separate document)
4. **`services/wikimedia-digest.ts`** — Make endpoint language-dynamic
5. **`scripts/ingest/wikimedia-client.ts`** — Accept language parameter

### Phase 2: User Preference

1. Install `expo-localization` for device language detection
2. Add language selection to onboarding flow (after or combined with existing steps)
3. Save language preference to Firestore on `completeOnboarding()`
4. Expose language change in Profile tab settings

### Phase 3: Content Serving

1. **`services/content.ts`** — Read user language from profile, return `translations.{lang}.text` with fallback to `text`
2. **`hooks/useEventContent.ts`** — Pass language through to service layer
3. Ensure all content-fetching hooks respect language preference

### Phase 4: UI Localization

1. Install `i18next` + `react-i18next`
2. Create translation files:
   - `locales/en.json` — All current hardcoded strings
   - `locales/tr.json` — Turkish translations
3. Replace hardcoded strings in:
   - Category labels (`constants/personalization.ts`)
   - Era labels (`constants/personalization.ts`)
   - Onboarding step text
   - Navigation labels
   - Empty states, error messages
4. Update date formatting to use dynamic locale:
   - Replace `'en-US'` with user's locale in `utils/dates.ts`

---

## MVP Language Choice: English + Turkish

**Rationale:**
- Turkish Wikipedia "On This Day" feed is active and well-maintained
- Wikidata Turkish labels are available for most major events
- Primary target audience includes Turkish speakers
- Fastest path to validate multilingual hypothesis before broader expansion

**Expansion candidates post-MVP:** Spanish (large market), German, French

---

## Risks & Considerations

| Risk | Impact | Mitigation |
|---|---|---|
| Turkish Wikipedia content quality varies by date | Medium | Audit 10-15 dates before launch, add fallback to English |
| Wikidata Turkish labels missing for obscure events | Low | Already have English fallback in wikidata-client.ts |
| Storage cost doubles for translated content | Low | `translations` subfield only for translated fields, not duplicating media/enrichment |
| Ingestion takes 2x longer per date | Low | Run language ingestion as separate background job |
| UI strings are 2000+ strings to translate | Medium | Prioritize critical paths; onboarding, home, explore first |

---

## Open Questions

1. Should language be selectable during onboarding, or auto-detected and changeable later?
2. Do we translate category/era filter options, or keep them as universal English keys?
3. For dates with poor Turkish Wikipedia coverage, do we surface a notice or silently fall back to English?
4. Do push notification content (future) also need to be localized?

---

## Related Files

| File | Change Required |
|---|---|
| `types/user.ts` | Add `language: LanguageCode` |
| `types/events.ts` | Add `translations` map field |
| `contexts/onboarding-context.tsx` | Add language to reducer state |
| `constants/personalization.ts` | Refactor labels to translation keys |
| `services/wikimedia-digest.ts` | Dynamic language in endpoint URL |
| `services/content.ts` | Language-aware content resolution |
| `scripts/ingest/run.ts` | `--language` CLI argument |
| `scripts/ingest/wikimedia-client.ts` | Language parameter in fetch |
| `utils/dates.ts` | Dynamic locale instead of hardcoded `'en-US'` |
| `app/onboarding/index.tsx` | Add language selection step |
