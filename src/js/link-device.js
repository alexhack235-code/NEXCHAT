/**
 * NEXCHAT Linked Devices Service (QR Code & 6-Character Pairing Code)
 * Multi-device pairing and active session management powered by Firebase Firestore.
 */
import { db } from '../../firebase-config.js';
import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import QRCode from 'qrcode';

/**
 * Detects current client device, browser, and platform.
 */
export function detectDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType = 'Desktop';

  if (/Mobile|Android|iP(hone|od)/.test(ua)) {
    deviceType = 'Mobile';
  } else if (/iPad|Tablet/.test(ua)) {
    deviceType = 'Tablet';
  }

  // Detect OS
  if (/Windows NT 10.0/.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Linux/.test(ua)) os = 'Linux';

  // Detect Browser
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/OPR\//.test(ua)) browser = 'Opera';

  return {
    browser,
    os,
    deviceType,
    userAgent: ua,
    screen: `${window.screen.width}x${window.screen.height}`,
    label: `${browser} on ${os}`,
  };
}

/**
 * Generates a readable 6-character pairing code: NX-XXXX
 */
function generatePairingCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NX-${code}`;
}

/**
 * Creates a new pairing session for the current device and generates a dynamic QR code.
 * 
 * @param {function(string, object):void} onStatusChange - ('pending'|'approved'|'rejected'|'expired', data)
 * @returns {Promise<{sessionId: string, pairingCode: string, qrDataUrl: string, unsubscribe: function}>}
 */
export async function createPairingSession(onStatusChange) {
  const deviceInfo = detectDeviceInfo();
  const pairingCode = generatePairingCode();
  const sessionRef = doc(collection(db, 'link_sessions'));
  const sessionId = sessionRef.id;

  const sessionData = {
    sessionId,
    pairingCode,
    status: 'pending',
    deviceInfo,
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min expiry
  };

  await setDoc(sessionRef, sessionData);

  // Generate QR Code containing pairing metadata
  const qrPayload = JSON.stringify({
    app: 'NEXCHAT',
    action: 'link_device',
    sessionId,
    code: pairingCode,
    url: `${window.location.origin}/chat.html?link_session=${sessionId}`
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 280,
    margin: 1,
    color: {
      dark: '#00ff66',
      light: '#050811',
    },
  });

  // Listen for primary device approval
  const unsubscribe = onSnapshot(sessionRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();

    if (data.status === 'approved' && data.user) {
      // Store session identity locally
      localStorage.setItem('nexchat_linked_session', JSON.stringify({
        sessionId,
        uid: data.uid,
        user: data.user,
        linkedAt: Date.now(),
      }));
      if (onStatusChange) onStatusChange('approved', data);
    } else if (data.status === 'rejected') {
      if (onStatusChange) onStatusChange('rejected', data);
    } else if (data.status === 'revoked') {
      if (onStatusChange) onStatusChange('revoked', data);
    }
  });

  return {
    sessionId,
    pairingCode,
    qrDataUrl,
    unsubscribe,
  };
}

/**
 * Searches for an active pending session by pairing code or sessionId.
 * @param {string} codeOrId - 6-char code (e.g. 'NX-4921') or sessionId
 * @returns {Promise<{sessionId: string, deviceInfo: object, expiresAt: string}|null>}
 */
export async function findPendingSession(codeOrId) {
  const clean = codeOrId.trim().toUpperCase();

  // Try by pairingCode
  const q = query(
    collection(db, 'link_sessions'),
    where('pairingCode', '==', clean),
    where('status', '==', 'pending')
  );

  const snap = await getDocs(q);
  if (!snap.empty) {
    const docSnap = snap.docs[0];
    const data = docSnap.data();
    if (new Date(data.expiresAt) > new Date()) {
      return { id: docSnap.id, ...data };
    }
  }

  // Try direct docId lookup
  try {
    const directSnap = await getDoc(doc(db, 'link_sessions', codeOrId.trim()));
    if (directSnap.exists() && directSnap.data().status === 'pending') {
      return { id: directSnap.id, ...directSnap.data() };
    }
  } catch {}

  return null;
}

/**
 * Approves a pending pairing session from the primary logged-in device.
 * 
 * @param {string} sessionId - The session ID to approve
 * @param {object} primaryUser - The currently authenticated Firebase user
 * @returns {Promise<boolean>}
 */
export async function approvePairingSession(sessionId, primaryUser) {
  if (!primaryUser || !primaryUser.uid) {
    throw new Error('You must be logged in on this device to approve a new device.');
  }

  const sessionRef = doc(db, 'link_sessions', sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    throw new Error('Session not found or has expired.');
  }

  const sessionData = sessionSnap.data();
  const deviceInfo = sessionData.deviceInfo || {};

  const userPayload = {
    uid: primaryUser.uid,
    email: primaryUser.email,
    name: primaryUser.displayName || primaryUser.email?.split('@')[0] || 'User',
    photoURL: primaryUser.photoURL || 'favicon.png',
  };

  // 1. Mark session approved
  await updateDoc(sessionRef, {
    status: 'approved',
    uid: primaryUser.uid,
    user: userPayload,
    approvedAt: serverTimestamp(),
  });

  // 2. Register in primary user's linked devices record
  const deviceRecordRef = doc(db, 'users', primaryUser.uid, 'linkedDevices', sessionId);
  await setDoc(deviceRecordRef, {
    sessionId,
    label: deviceInfo.label || 'Unknown Device',
    deviceType: deviceInfo.deviceType || 'Desktop',
    browser: deviceInfo.browser || 'Browser',
    os: deviceInfo.os || 'OS',
    linkedAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    status: 'active',
  });

  return true;
}

/**
 * Rejects a pending pairing session.
 */
export async function rejectPairingSession(sessionId) {
  const sessionRef = doc(db, 'link_sessions', sessionId);
  await updateDoc(sessionRef, {
    status: 'rejected',
    rejectedAt: serverTimestamp(),
  });
}

/**
 * Retrieves all active linked devices for a user.
 */
export async function getLinkedDevices(uid) {
  if (!uid) return [];
  const q = query(collection(db, 'users', uid, 'linkedDevices'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Revokes / unlinks a device remotely.
 */
export async function unlinkDevice(uid, sessionId) {
  if (!uid || !sessionId) return;

  // 1. Delete from user's linkedDevices collection
  await deleteDoc(doc(db, 'users', uid, 'linkedDevices', sessionId)).catch(() => {});

  // 2. Mark session doc as revoked to immediately kick the secondary device
  try {
    await updateDoc(doc(db, 'link_sessions', sessionId), {
      status: 'revoked',
      revokedAt: serverTimestamp(),
    });
  } catch {}
}

/**
 * Secondary device listens for remote revocation from primary phone.
 */
export function listenForSessionRevocation(sessionId, onRevoked) {
  if (!sessionId) return () => {};
  return onSnapshot(doc(db, 'link_sessions', sessionId), (snap) => {
    if (!snap.exists() || snap.data().status === 'revoked') {
      localStorage.removeItem('nexchat_linked_session');
      if (onRevoked) onRevoked();
    }
  });
}
