/**
 * Profile Upload Service for NEXCHAT
 * Uses Multi-Vault Cloudinary Media Pipeline (free, direct client-side unsigned upload)
 * with graceful fallback to Vercel Blob and local Data URLs.
 */
import { db } from '../../firebase-config.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { uploadImageToCloudinary } from './cloudinary.js';

/**
 * Uploads a profile picture directly to Cloudinary (no backend/Vercel required).
 * Falls back to /api/upload (if deployed on Vercel) or Base64 data URL.
 *
 * @param {File|Blob} file - The image file to upload
 * @param {string} uid - Firebase User ID
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export async function uploadProfilePicture(file, uid) {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  // 1. Primary Strategy: Direct Client-Side Cloudinary Upload (Zero backend, no 405 error)
  try {
    const cldRes = await uploadImageToCloudinary(file, {
      folder: 'nexchat-avatars',
    });
    if (cldRes && (cldRes.secure_url || cldRes.url)) {
      console.log('[PROFILE] Avatar saved to Cloudinary:', cldRes.secure_url || cldRes.url);
      return cldRes.secure_url || cldRes.url;
    }
  } catch (cldErr) {
    console.warn('[PROFILE] Cloudinary upload warning, trying serverless endpoint fallback:', cldErr.message);
  }

  // 2. Secondary Strategy: Vercel Blob /api/upload (if hosted on Vercel)
  const safeUid = uid || 'guest';
  const cleanName = (file.name || 'avatar.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `avatars/${safeUid}/${Date.now()}_${cleanName}`;

  try {
    const response = await fetch(`/api/upload?type=profile&filename=${encodeURIComponent(filename)}`, {
      method: 'POST',
      headers: {
        'x-filename': filename,
        'x-upload-type': 'profile',
      },
      body: file,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.url) {
        return data.url;
      }
    }
  } catch (apiErr) {
    console.warn('[PROFILE] Serverless endpoint offline, using local preview fallback:', apiErr.message);
  }

  // 3. Fallback: Base64 Data URL so user is never blocked
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Updates user profile photo and details in Firestore (users/{uid})
 * @param {string} uid 
 * @param {string} photoURL 
 * @param {object} additionalData - Optional extra fields (displayName, bio, etc.)
 */
export async function saveUserProfile(uid, photoURL, additionalData = {}) {
  if (!uid) throw new Error('User ID is required');

  const userRef = doc(db, 'users', uid);
  const payload = {
    photoURL: photoURL,
    avatar: photoURL,
    profilePic: photoURL,
    profilePicUrl: photoURL,
    updatedAt: new Date(),
    ...additionalData,
  };

  await setDoc(userRef, payload, { merge: true });
  return payload;
}
