# Algolia Setup

This project uses Algolia as the Explore search backend. Firestore remains the source of truth for `contentEvents`, but Explore search reads should come entirely from Algolia.

## 1. Create Algolia keys

In the Algolia dashboard:

1. Copy the `Application ID`.
2. Create or copy a `Search-Only API Key` for the mobile app.
3. Copy the `Admin API Key` for indexing and Firebase sync.

Use `events_prod` as the primary index name.

## 2. Configure app env vars

Create or update the root `.env` file:

```bash
EXPO_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id
EXPO_PUBLIC_ALGOLIA_SEARCH_API_KEY=your_algolia_search_only_key
EXPO_PUBLIC_ALGOLIA_INDEX_EVENTS=events_prod

ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_ADMIN_API_KEY=your_algolia_admin_key
ALGOLIA_INDEX_EVENTS=events_prod
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

The `EXPO_PUBLIC_*` values are used by the app. The `ALGOLIA_*` values are used by local indexing scripts.

## 3. Configure Firebase Functions env + secret

Create `functions/.env` from `functions/.env.example`:

```bash
cp functions/.env.example functions/.env
```

Set the values:

```bash
ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_INDEX_EVENTS=events_prod
```

Set the admin API key in Firebase Secret Manager:

```bash
firebase functions:secrets:set ALGOLIA_ADMIN_API_KEY
```

The `contentEvents` Firestore trigger binds this secret at runtime.

## 4. Build the Algolia index from Firestore

Run the bulk reindex script from the project root:

```bash
npx tsx scripts/reindex-algolia.ts
```

This script will:

1. Create/update the primary index settings.
2. Create/update the `events_prod_recent` replica.
3. Clear the primary index.
4. Re-upload all `contentEvents` records from Firestore.

## 5. Deploy Firebase Functions

Deploy the functions after the secret is set:

```bash
cd functions
npm run deploy
```

This enables the Firestore trigger that keeps Algolia in sync on create, update, and delete.

## 6. Start the app and verify search

Restart Expo so the new env vars are loaded:

```bash
npm run start -- --clear
```

Manual checks:

1. Search for a modern event and an older event.
2. Apply category and era filters.
3. Select a date while searching and confirm the results are filtered by `month/day`.
4. Switch sort from relevance to recent.
5. Confirm there is no request to `/explore/search`.

## Notes

- Search results should not read Firestore. Event detail can still read by `eventId`.
- If the search index schema changes, run `npx tsx scripts/reindex-algolia.ts` again.
- If an event is edited outside the ingestion scripts, the Firebase trigger will update Algolia automatically after deploy.
