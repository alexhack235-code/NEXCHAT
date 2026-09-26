
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, disableNetwork, enableNetwork } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { firebaseConfig } from './firebase-public-config.js';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

enableNetwork(db)
  .then(() => {
    console.log('[OK] Firestore network enabled');
  })
  .catch((err) => {
    console.error('âŒ Failed to enable Firestore network:', err);
  });

window.auth = auth;
window.db = db;
window.rtdb = rtdb;

window.enableFirestoreNetwork = () => enableNetwork(db);
window.disableFirestoreNetwork = () => disableNetwork(db);








