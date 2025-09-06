import 'dotenv/config'
import admin from 'firebase-admin'
import fs from 'fs';

// Initialize Firebase Admin SDK
// Strict mode: requires SERVICE_ACCOUNT_JSON (base64-encoded). No fallback.
const initAdmin = () => {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  let storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is required');
  }
  if (!storageBucket) {
    throw new Error('FIREBASE_STORAGE_BUCKET is required');
  }

  const saPath = process.env.SERVICE_ACCOUNT_JSON_PATH;
  const saB64 = process.env.SERVICE_ACCOUNT_JSON;
  if (!saPath && !saB64) {
    throw new Error('Provide SERVICE_ACCOUNT_JSON_PATH (file path) or SERVICE_ACCOUNT_JSON (base64).');
  }

  let credential;
  try {
    let jsonStr;
    if (saPath) {
      // Read exact file bytes and parse
      jsonStr = fs.readFileSync(saPath, 'utf8');
    } else {
      jsonStr = Buffer.from(saB64, 'base64').toString('utf8');
    }
    // Basic sanity check without leaking secrets
    if (!jsonStr.trim().startsWith('{')) {
      throw new Error('service account content does not start with {');
    }
    const json = JSON.parse(jsonStr);
    if (json.type !== 'service_account') {
      throw new Error('expected a service_account JSON');
    }
    credential = admin.credential.cert(json);
  } catch (e) {
    throw new Error('Invalid service account credentials: ' + (e?.message || e));
  }

  return admin.initializeApp({
    credential,
    projectId,
    storageBucket,
  });
};

export const adminApp = initAdmin();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
export default admin;
