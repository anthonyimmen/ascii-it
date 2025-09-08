import 'dotenv/config'
import admin from 'firebase-admin'
import fs from 'fs'

// Initialize Firebase Admin SDK
// Works in both local dev (.env + SERVICE_ACCOUNT_JSON) and on GCP (ADC)
const initAdmin = () => {
  if (admin.apps.length) return admin.app()

  // Prefer explicit PROJECT_ID if provided; otherwise fall back to GCP env
  const projectId =
    process.env.PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT

  if (!projectId) {
    throw new Error('PROJECT_ID is required (or GOOGLE_CLOUD_PROJECT)')
  }

  // Storage bucket: allow override via env; otherwise use default appspot bucket
  let storageBucket = process.env.STORAGE_BUCKET
  if (!storageBucket) {
    storageBucket = `${projectId}.appspot.com`
  }

  // If running on GCP (Cloud Functions/Run), rely on Application Default Credentials.
  // Detect via common envs set by those platforms.
  const runningOnGcp = Boolean(
    process.env.K_SERVICE || // Cloud Run / Functions v2
      process.env.FUNCTION_TARGET || // Functions v1
      process.env.GAE_SERVICE // App Engine
  )

  if (runningOnGcp) {
    return admin.initializeApp({ projectId, storageBucket })
  }

  // Local/dev: try to load service account from env or file
  const saPath = process.env.SERVICE_ACCOUNT_JSON_PATH
  const saB64 = process.env.SERVICE_ACCOUNT_JSON
  if (!saPath && !saB64) {
    throw new Error(
      'Provide SERVICE_ACCOUNT_JSON_PATH (file path) or SERVICE_ACCOUNT_JSON (base64) for local/dev.'
    )
  }

  let credential
  try {
    let jsonStr
    if (saPath) {
      jsonStr = fs.readFileSync(saPath, 'utf8')
    } else {
      jsonStr = Buffer.from(saB64, 'base64').toString('utf8')
    }
    if (!jsonStr.trim().startsWith('{')) {
      throw new Error('service account content does not start with {')
    }
    const json = JSON.parse(jsonStr)
    if (json.type !== 'service_account') {
      throw new Error('expected a service_account JSON')
    }
    credential = admin.credential.cert(json)
  } catch (e) {
    throw new Error('Invalid service account credentials: ' + (e?.message || e))
  }

  return admin.initializeApp({ credential, projectId, storageBucket })
}

export const adminApp = initAdmin()
export const adminAuth = admin.auth()
export const adminStorage = admin.storage()
export default admin
