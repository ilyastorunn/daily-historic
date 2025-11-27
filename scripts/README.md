# Scripts

This directory contains utility scripts for data ingestion, validation, and testing.

## Data Ingestion Scripts

Located in `ingest/` directory. See [ingest/README.md](./ingest/README.md) for details.

### Usage
```bash
npm run ingest -- --month=10 --day=23 --year=2024
npm run validate:overrides
npm run test:ingest
```

## Collection Cover Validation

### `test-collection-covers.ts`

Validates that all collection cover images are accessible from Wikimedia Commons.

**Usage:**
```bash
npm run test:covers
```

**What it does:**
- Tests HTTP accessibility of all 16 collection cover images
- Reports which images return 404 or other errors
- Provides detailed failure information with URLs
- Exit code 0 if all pass, 1 if any fail

**Example output:**
```
🧪 Testing Collection Cover Images...

Testing: Women Who Changed the World...
  ✅ OK (200)
Testing: Voices of Change...
  ✅ OK (200)
...

============================================================
📊 Summary: 16 passed, 0 failed out of 16 total
============================================================

✅ All collection covers are accessible!
```

**When to run:**
- After adding new collections
- After changing cover images
- Before production deployments
- When debugging missing images in the app

**Troubleshooting broken images:**
1. Run the test to identify broken URLs
2. Find alternative Wikimedia images with correct filenames
3. Update `constants/events.ts` with new `coverImage` URLs
4. Re-run test to verify fixes

**Common Wikimedia URL issues:**
- Filename case sensitivity
- Special characters in filenames
- Archived or deleted files
- Incorrect file extensions
