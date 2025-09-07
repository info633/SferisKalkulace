// api/lib/firebase.js
import { initializeApp, applicationDefault, getApps, getApp } from 'firebase-admin/app';
import { getFirestore as _getFirestore } from 'firebase-admin/firestore';

let app;
let db;

/** Inicializuje Admin SDK jednou, bezpečně i při hot-reloadu. */
export function initAdmin() {
  if (!getApps().length) {
    app = initializeApp({
      // Lokálně použije ADC (viz krok 3), na Cloud Run se použije default service account
      credential: applicationDefault(),
    });
  } else {
    app = getApp();
  }
  if (!db) db = _getFirestore(app);
  return app;
}

/** Vrať Firestore instance; když ještě neběží, nejdřív inicializuj. */
export function getDb() {
  if (!db) initAdmin();
  return db;
}