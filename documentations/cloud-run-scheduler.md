# Daily Historic – Cloud Run & Scheduler Deployment Guide

This walkthrough automates `npm run ingest` with Google Cloud Run Jobs and Cloud Scheduler. It assumes you already ran the ingestion CLI locally and have a Firebase service account JSON.

## 0. Prerequisites
- Google Cloud project (same one that hosts Firestore).
- `gcloud` CLI authenticated (`gcloud auth login`) and default project set (`gcloud config set project <PROJECT_ID>`).
- The service account JSON used for local ingestion (kept outside source control).
- Billing enabled on the project.

## 1. Enable Required APIs
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com
```

## 2. Create Artifact Registry Repository
Pick a region close to your users (example: `us-central1`).
```bash
gcloud artifacts repositories create daily-historic \
  --repository-format=docker \
  --location=us-central1 \
  --description="Daily Historic ingestion containers"
```

## 3. Prepare Runtime Service Accounts
Create a service account that the Cloud Run job will use and grant minimum roles.
```bash
gcloud iam service-accounts create ingest-runner \
  --display-name="Daily Historic Ingestion"

PROJECT_ID=$(gcloud config get-value project)
RUNTIME_SA=ingest-runner@${PROJECT_ID}.iam.gserviceaccount.com

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

Create another service account for Cloud Scheduler to trigger the job.
```bash
gcloud iam service-accounts create scheduler-runner \
  --display-name="Daily Historic Scheduler"

SCHEDULER_SA=scheduler-runner@${PROJECT_ID}.iam.gserviceaccount.com

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SCHEDULER_SA}" \
  --role="roles/run.jobsRunner"
```

## 4. Store Secrets in Secret Manager
Upload the Firebase service account JSON.
```bash
gcloud secrets create FIREBASE_SERVICE_ACCOUNT_JSON \
  --data-file=$HOME/secrets/chrono-history-b4003-10941a47bc17.json \
  --replication-policy=automatic
```

The other environment values can stay as plain env vars when the job runs:
- `FIREBASE_PROJECT_ID=chrono-history-b4003`
- `DAILY_HISTORIC_USER_AGENT="DailyHistory/0.1 (dailyhistory.app@gmail.com)"`
- `INGEST_LOG_FORMAT=json`
- (Optional) `WIKIMEDIA_API_TOKEN` – create a secret if you need it later.

## 5. Build and Push the Container
Ensure the new Dockerfile is committed, then build using Cloud Build. Replace `REGION` with your Artifact Registry region.
```bash
REGION=us-central1
IMAGE=${REGION}-docker.pkg.dev/${PROJECT_ID}/daily-historic/ingest:latest

gcloud builds submit --tag ${IMAGE} --project ${PROJECT_ID} --region ${REGION}
```

## 6. Create the Cloud Run Job
```bash
gcloud run jobs create daily-historic-ingest \
  --image ${IMAGE} \
  --region ${REGION} \
  --max-retries=1 \
  --memory=1Gi \
  --cpu=1 \
  --service-account ${RUNTIME_SA} \
  --set-env-vars FIREBASE_PROJECT_ID=chrono-history-b4003,DAILY_HISTORIC_USER_AGENT="DailyHistory/0.1 (dailyhistory.app@gmail.com)",INGEST_LOG_FORMAT=json \
  --set-secrets FIREBASE_SERVICE_ACCOUNT_JSON=FIREBASE_SERVICE_ACCOUNT_JSON:latest
```
If you add a Wikimedia token secret later, append `--set-secrets WIKIMEDIA_API_TOKEN=WIKIMEDIA_API_TOKEN:latest`.

### Test the job once
```bash
gcloud run jobs execute daily-historic-ingest --region ${REGION}
```
Check execution logs in Cloud Logging (`gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=daily-historic-ingest" --limit=20`).

## 7. Schedule Daily Execution
Create a Cloud Scheduler HTTP job that triggers the Cloud Run job at 00:05 UTC.
```bash
gcloud scheduler jobs create http daily-historic-ingest \
  --location ${REGION} \
  --schedule "5 0 * * *" \
  --uri "https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/jobs/daily-historic-ingest:run" \
  --http-method POST \
  --oidc-service-account-email ${SCHEDULER_SA} \
  --oidc-token-audience "https://${REGION}-run.googleapis.com/" \
  --time-zone "Etc/UTC"
```
You can trigger it manually with:
```bash
gcloud scheduler jobs run daily-historic-ingest --location ${REGION}
```

## 8. Operational Notes
- Update the container after code changes: rebuild (Step 5) and deploy (`gcloud run jobs update daily-historic-ingest --image ${IMAGE}`).
- Overrides: use `gcloud run jobs execute daily-historic-ingest --region ${REGION} --args="--dry-run"` for safe tests.
- Monitoring: add log-based alerts in Cloud Logging or Cloud Monitoring to email/Slack on failures.
- Rotate secrets regularly via Secret Manager; Cloud Run job automatically picks the latest version when rerun.
