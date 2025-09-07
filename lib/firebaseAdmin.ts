
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
const app = getApps().length ? getApps()[0]! : initializeApp({
  credential: applicationDefault(),
  projectId: process.env.GCP_PROJECT_ID,
  storageBucket: process.env.GCS_BUCKET,
})
export const db = getFirestore(app)
export const bucket = getStorage(app).bucket()
