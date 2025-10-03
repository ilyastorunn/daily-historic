import { readFile } from 'node:fs/promises';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import type { FirestoreCollections } from './types';

export interface FirestoreBootstrapOptions {
  serviceAccountPath?: string;
  serviceAccountJson?: string;
  projectId?: string;
  collections?: Partial<FirestoreCollections>;
}

export interface FirestoreContext {
  firestore: ReturnType<typeof getFirestore>;
  collections: FirestoreCollections;
}

const DEFAULT_COLLECTIONS: FirestoreCollections = {
  events: 'contentEvents',
  payloadCache: 'contentPayloadCache',
  digests: 'dailyDigests',
};

const defaultAppName = 'daily-historic-ingestion';

const readJsonFromFile = async (filePath: string) => {
  const buffer = await readFile(filePath, 'utf-8');
  return JSON.parse(buffer) as Record<string, unknown>;
};

const resolveServiceAccount = async (
  serviceAccountPath?: string,
  serviceAccountJson?: string
) => {
  if (serviceAccountJson) {
    return JSON.parse(serviceAccountJson) as Record<string, unknown>;
  }

  const resolvedPath = serviceAccountPath ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!resolvedPath) {
    throw new Error(
      'Service account path is missing. Provide FIREBASE_SERVICE_ACCOUNT_PATH or set GOOGLE_APPLICATION_CREDENTIALS.'
    );
  }

  return readJsonFromFile(resolvedPath);
};

export const bootstrapFirestore = async (options: FirestoreBootstrapOptions): Promise<FirestoreContext> => {
  const { serviceAccountPath, serviceAccountJson, projectId, collections } = options;

  const serviceAccount = await resolveServiceAccount(serviceAccountPath, serviceAccountJson);

  const appName = getApps().length === 0 ? defaultAppName : `${defaultAppName}-${getApps().length}`;

  const app = initializeApp(
    {
      credential: cert(serviceAccount as Record<string, string>),
      projectId: projectId ?? process.env.FIREBASE_PROJECT_ID ?? (serviceAccount as { project_id?: string }).project_id,
    },
    appName
  );

  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });

  return {
    firestore: db,
    collections: {
      ...DEFAULT_COLLECTIONS,
      ...collections,
    },
  };
};

export const safeCollectionName = (name: string) => {
  if (!/^[-_A-Za-z0-9]+$/.test(name)) {
    throw new Error(`Invalid collection name: ${name}`);
  }
  return name;
};

export const buildDocumentId = (...parts: string[]) => {
  return parts
    .map((part) => part.trim().toLowerCase().replace(/\s+/g, '-')
    )
    .join(':');
};
