import { auth } from '../../firebase-config.js';

export async function getFirebaseAuthorizationHeaders(strict = false) {
  let user = auth?.currentUser;
  if (!user && typeof auth?.authStateReady === 'function') {
    try {
      await auth.authStateReady();
      user = auth.currentUser;
    } catch (_) {}
  }

  if (!user) {
    if (strict) {
      throw new Error('Sign in is required to upload files.');
    }
    return { Authorization: '' };
  }

  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch (err) {
    if (strict) throw err;
    return { Authorization: '' };
  }
}

