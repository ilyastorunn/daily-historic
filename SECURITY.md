# Security Guidelines

## Firebase Service Account Credentials

**CRITICAL**: Never commit the `firebase-service-account.json` file to version control.

### Protected Files

The following files contain sensitive credentials and are automatically ignored by git:

```
firebase-service-account.json
*service-account*.json
GoogleService-Info.plist
google-services.json
.env
.env*.local
```

### Setup Instructions

1. Download service account JSON from Firebase Console:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `firebase-service-account.json` in project root

2. Verify `.gitignore` includes the file (already configured)

3. Never share this file via:
   - Git commits
   - Screenshots
   - Slack/Discord messages
   - Email
   - Cloud storage (Dropbox, Google Drive, etc.)

### Credential Leak Response

If service account credentials are accidentally exposed:

1. **Immediately** revoke the compromised key:
   - Firebase Console → Project Settings → Service Accounts
   - Click "Manage service account permissions"
   - Delete the exposed service account or key

2. Generate a new private key

3. Update local `firebase-service-account.json`

4. If committed to git:
   - Use `git-filter-branch` or BFG Repo-Cleaner to remove from history
   - Force push to all remotes
   - Notify all team members to re-clone the repository

### Environment Variables

The `.env` file is also protected and should never be committed. It contains:

- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON

### Verification

Check that credentials are not tracked by git:

```bash
# Should return nothing
git log --all --full-history -- "*service-account*.json"

# Check current status
git status --ignored
```

### Permissions

Service accounts should follow the principle of least privilege:

- **Ingestion scripts**: Firestore write access only
- **Read-only scripts**: Firestore read access only
- Avoid granting "Owner" or "Editor" roles unless necessary

### Contact

If you discover a security vulnerability, contact: [your-email]

---

**Last Updated**: 2025-12-09
