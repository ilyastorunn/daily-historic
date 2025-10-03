# Daily Historic – External Data Integration Roadmap

## 1. Prerequisites
- Create a Wikimedia developer account and register your app at <https://api.wikimedia.org/>
  for an API key. Even for unauthenticated calls, always send a descriptive
  `User-Agent` (e.g. `DailyHistoricApp/0.1 (contact@yourdomain.com)`).
- Pick a datastore (Firestore, PostgreSQL, or a JSON cache during prototyping)
  and define schemas for `event`, `person`, `mediaAsset`, and `dailyDigest`.
- Add environment variables for external APIs: `WIKIMEDIA_API_TOKEN`,
  `OPENROUTER_API_KEY` (optional), `GOOGLE_GENAI_KEY` (optional).

## 2. Fetch Daily Events (Wikimedia On This Day)
1. Build a thin client for
   `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/{month}/{day}`.
   Required headers: `User-Agent`; optional `Authorization: Bearer {token}` if you
   enable higher limits.
2. Parse the JSON response. Each `event` includes `text`, `year`, `pages`.
3. Persist a normalized record with keys such as `eventId` (hash of the English
   title + date), `year`, `summary`, `relatedPageIds`, `rawSource`.
4. Cache the raw payload so you can recover from downstream errors without
   refetching.

## 3. Enrich Events with Wikidata
1. For each `page` in the event payload, use `page.wikibase_item` to hit the
   Wikidata entity endpoint:
   `https://www.wikidata.org/wiki/Special:EntityData/{itemId}.json`.
2. Extract facts you need:
   - `claims.P585` (point in time) for exact date.
   - `claims.P710` (participants) to gather linked entities.
   - `claims.P136` (genre) or `claims.P279` (subclass) to drive categorization.
3. Map the raw claims into your internal shape; e.g. convert Wikidata time format
   to ISO strings and collect `participant` records with `label`,
   `description`, `wikidataId`.
4. Store enriched data alongside the base event so the mobile app never calls
   Wikidata directly.

## 4. Category and Era Classification
1. Define a static lookup table that maps keywords, Wikidata properties, or
   categories to your app’s era/category taxonomy.
2. Run lightweight heuristics first (e.g. if the event’s instance of is
   `Q198` → wars) before falling back to an LLM.
3. If a manual override is needed, keep a YAML/JSON overrides file checked into
   the repo so you can patch misclassified items quickly.

## 5. Media Selection (Wikimedia Commons)
1. Check whether the `event.pages[].thumbnail` or `originalimage` fields already
   provide a suitable asset. Validate size/aspect ratio and license data.
2. If missing, query Commons Search:
   `https://api.wikimedia.org/core/v1/commons/search/title?q={query}&limit=10`.
   Use the event title or participant names as the query string.
3. Filter results for safe Creative Commons / Public Domain usage using
   `license` metadata, prefer SVG/large JPEGs.
4. Download the image URL to your CDN/bucket if you need deterministic delivery;
   otherwise store the direct Commons URL.
5. Save an accompanying caption (file description or `metadata.description`).

## 6. Optional LLM Polish
1. Keep raw factual text from the APIs as the source of truth. Use the LLM only
   to generate concise summaries or fun facts.
2. For OpenRouter (free tier models like `gpt-4o-mini` or `mistral/mixtral-8x7b`):
   - Endpoint: `https://openrouter.ai/api/v1/chat/completions` with headers
     `Authorization: Bearer ${OPENROUTER_API_KEY}`, `HTTP-Referer`, `X-Title`.
   - Prompt template: provide the event summary and ask for a 2–3 sentence
     rewrite under 350 characters, instructing it to avoid inventing facts.
3. Log every prompt/response pair and mark the generated copy as
   `status=draft` until manually reviewed.

## 7. Generative Image Fallbacks
1. If Commons yields nothing usable, use a local Stable Diffusion web UI or
   DALL·E Mini. Keep generation offline to avoid per-image fees.
2. Maintain a checklist (style guide, no faces unless historically accurate,
   include credit line “Generated illustration”).
3. Store generated assets separately so you can audit or replace them later.

## 8. Google AI Studio (Gemini) Contingency
1. Create a Google Cloud project, enable the Generative Language API, and grab
   an API key from <https://aistudio.google.com>.
2. Endpoint example:
   `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
   with body `{ "contents": [{ "parts": [{ "text": "...prompt..." }] }] }` and
   header `x-goog-api-key`.
3. Use Gemini only when OpenRouter is down or you require multimodal reasoning.
   Track usage carefully—while there is a free tier, quotas are limited.

## 9. Scheduling & Automation
1. Create a daily cron (GitHub Actions, Cloud Scheduler, or a simple cron job)
   to run the ingestion pipeline at 00:05 UTC.
2. Steps inside the job:
   - Fetch On This Day data and cache it.
   - Enrich with Wikidata, categorize, select media.
   - Run optional LLM polish and queue for manual review if needed.
   - Publish final payload to your production datastore (or feature flag for MVP).

## 10. Quality Assurance & Monitoring
- Validate every record with automated schema checks (e.g. Zod) and flag
  missing fields before publish.
- Add unit tests around category heuristics so new rules do not break existing
  mappings.
- Log API failures with retry/backoff and fallback to cached data so the daily
  digest never misses a day.
- Keep a lightweight admin UI or spreadsheet to track which events were
  approved, edited, or suppressed.

## 11. Integration Timeline (Suggested)
1. **Week 1** – Implement On This Day fetcher + datastore, manual review flow.
2. **Week 2** – Add Wikidata enrichment, category heuristics, Commons media.
3. **Week 3** – Layer in LLM polishing, fallback generators, observability.
4. **Week 4** – Hook mobile app to the new API, test personalization logic with
   real data.

