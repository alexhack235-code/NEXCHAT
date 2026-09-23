/**
 * Profile Upload Service for NEXCHAT
 * Replaces Firebase Storage with Vercel Blob (free, no credit card required)
 */
import { db } from '../../firebase-config.js';
import { doc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

/**
 * Uploads a profile picture using Vercel Blob API (/api/upload).
 * Supports binary streaming and automatically falls back to local Base64 encoding
 * if the Vercel API is unreachable (e.g., local Vite dev without Vercel CLI).
 *
 * @param {File|Blob} file - The image file to upload
 * @param {string} uid - Firebase User ID
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export async function uploadProfilePicture(file, uid) {
  if (!file) {
    throw new Error('No file provided for upload');
  }

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

    if (!response.ok) {
      const errPayload = await response.json().catch(() => ({}));
      throw new Error(errPayload.error || `Upload endpoint returned status ${response.status}`);
    }

    const data = await response.json();
    if (!data.url) {
      throw new Error('No URL returned from upload server');
    }

    return data.url;
  } catch (error) {
    console.warn('Vercel Blob upload failed or offline. Using Base64 fallback for local preview:', error.message);
    
    // Robust fallback: convert to Data URL so user is never blocked
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }
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
