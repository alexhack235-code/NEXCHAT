import { auth } from '../../firebase-config.js';

export async function getFirebaseAuthorizationHeaders() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sign in is required to upload files.');
  }

  return { Authorization: `Bearer ${await user.getIdToken()}` };
}
