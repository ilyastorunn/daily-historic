# Database Migrations

This directory contains one-time migration scripts for updating Firestore data.

## Safety Guidelines

⚠️ **IMPORTANT**: Migrations modify production data!

1. **Always run in dry-run mode first**
2. **Backup Firestore before executing**
3. **Test on staging environment if available**
4. **Monitor execution and be ready to rollback**

## Available Migrations

### add-normalized-titles.ts

Adds `normalizedTitle` field to all `contentEvents` documents for faster title matching.

**Before:**
```json
{
  "eventId": "event-1969-moon-landing",
  "text": "Apollo 11 Moon Landing",
  "summary": "...",
  ...
}
```

**After:**
```json
{
  "eventId": "event-1969-moon-landing",
  "text": "Apollo 11 Moon Landing",
  "summary": "...",
  "normalizedTitle": "apollo 11 moon landing",
  "updatedAt": "2025-10-27T...",
  ...
}
```

**Usage:**

```bash
# Dry run (no changes)
npx ts-node scripts/migrations/add-normalized-titles.ts --dry-run

# Execute (applies changes)
npx ts-node scripts/migrations/add-normalized-titles.ts --execute
```

**What it does:**
- Fetches all `contentEvents` in batches (100 per batch)
- Skips events that already have `normalizedTitle`
- Skips events without `text` or `summary`
- Normalizes using `normalizeTitle()` from `utils/title-matching.ts`
- Updates in batches using Firestore batch writes
- Sets `updatedAt` timestamp for audit trail

**Performance:**
- ~100 events/second
- For 10,000 events: ~2 minutes

## Creating New Migrations

1. Copy template from existing migration
2. Update script name and documentation
3. Test thoroughly in dry-run mode
4. Add entry to this README
5. Commit migration script (never delete old migrations)

## Rollback Strategy

If a migration fails or causes issues:

1. **Stop execution** (Ctrl+C)
2. **Check Firestore logs** for partial updates
3. **Restore from backup** if needed
4. **Fix migration script** and re-run dry-run
5. **Document the issue** in git commit

## Migration Log

| Date | Migration | Status | Notes |
|------|-----------|--------|-------|
| 2025-10-27 | add-normalized-titles | Created | Sprint 3.5 - Wikimedia integration |
