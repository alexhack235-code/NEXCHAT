
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, browserPopupRedirectResolver } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, disableNetwork, enableNetwork } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { firebaseConfig } from './firebase-public-config.js';

const app = initializeApp(firebaseConfig);

// Avoid sessionStorage-dependent state in storage-partitioned WebViews / browsers
let initializedAuth;
try {
  initializedAuth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    popupRedirectResolver: browserPopupRedirectResolver
  });
} catch (_) {
  initializedAuth = getAuth(app);
}
export const auth = initializedAuth;
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

enableNetwork(db)
  .then(() => {
    console.log('[OK] Firestore network enabled');
  })
  .catch((err) => {
    console.error('[ERROR] Failed to enable Firestore network:', err);
  });

window.auth = auth;
window.db = db;
window.rtdb = rtdb;

window.enableFirestoreNetwork = () => enableNetwork(db);
window.disableFirestoreNetwork = () => disableNetwork(db);








