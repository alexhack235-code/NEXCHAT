import { auth, db, rtdb } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { setDoc, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const loginAttempts = new Map();
const registerAttempts = new Map();

function checkRateLimit(identifier, type = 'login', maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  const record = (type === 'login' ? loginAttempts : registerAttempts).get(identifier);

  if (!record) {
    (type === 'login' ? loginAttempts : registerAttempts).set(identifier, { count: 1, timestamp: now });
    return { allowed: true };
  }

  if (now - record.timestamp > windowMs) {
    (type === 'login' ? loginAttempts : registerAttempts).set(identifier, { count: 1, timestamp: now });
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    return {
      allowed: false,
      message: `Too many attempts. Please try again in ${Math.ceil((windowMs - (now - record.timestamp)) / 1000)} seconds.`
    };
  }

  record.count++;
  return { allowed: true };
}

function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('at least one uppercase letter (A-Z)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('at least one lowercase letter (a-z)');
  }

  if (!/\d/.test(password)) {
    errors.push('at least one number (0-9)');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password)) {
    errors.push('at least one special character (!@#$%^&*, etc)');
  }

  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'user'];
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('use a less common password');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

const randomStickers = [
  '⚡', '✨', '🔥', '🚀', '🌟', '💎', '👑', '🎯', '🛡️', '⚔️',
  '🤖', '👾', '🎮', '🎧', '💻', '🔮', '💫', '🌌', '🪐', '🛸',
  '🦁', '🐺', '🦊', '🦅', '🐉', '🐯', '🐼', '🦄', '🐬', '🦋',
  '💚', '💙', '💜', '🧡', '❤️', '🤍', '🖤', '💛', '💖', '⭐',
  '😎', '🥳', '🤩', '🤠', '😇', '🛸', '🎯', '🏆', '🥇', '⚡'
];

function getRandomSticker() {
  return randomStickers[Math.floor(Math.random() * randomStickers.length)];
}

async function detectIPAndVPN() {
  try {
    console.log("🔍 Detecting IP and VPN...");

    const response = await fetch('https://ipapi.co/json/', { timeout: 5000 });
    const data = await response.json();

    const ipInfo = {
      ip: data.ip,
      country: data.country_name,
      city: data.city,
      isp: data.org,
      isVPN: data.is_vpn === true || data.org?.toLowerCase().includes('vpn'),
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone
    };

    console.log("📍 IP Info:", ipInfo);
    return ipInfo;
  } catch (err) {
    console.warn("⚠️ Could not detect IP:", err);
    return null;
  }
}

async function checkIPRegistration(ipAddress) {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("registrationIP", "==", ipAddress));
    const snap = await getDocs(q);

    if (snap.docs.length > 0) {
      console.warn("⚠️ IP already registered!");
      return snap.docs.map(doc => doc.data().email);
    }
    return null;
  } catch (err) {
    console.warn("Could not check IP registration:", err);
    return null;
  }
}

function showResult(msg, isError = false) {
  const el = document.getElementById('result');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('error', isError);
  el.classList.toggle('success', !isError);
  el.classList.toggle('result-box', Boolean(msg));
  el.style.display = msg ? 'block' : 'none';
  if (!msg) {
    el.classList.remove('error', 'success', 'result-box');
  }
}

function attachRegisterHandler() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;

  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value;
    const passConfirm = document.getElementById('regPasswordConfirm').value;

    if (pass !== passConfirm) {
      showResult('❌ Passwords do not match!', true);
      return;
    }

    const passwordValidation = validatePassword(pass);
    if (!passwordValidation.isValid) {
      const errorMsg = `❌ Password must have: ${passwordValidation.errors.join(', ')}`;
      showResult(errorMsg, true);
      return;
    }

    if (name.length < 2) {
      showResult('❌ Name must be at least 2 characters!', true);
      return;
    }

    if (username.length < 3) {
      showResult('❌ Username must be at least 3 characters!', true);
      return;
    }

    if (username.length > 20) {
      showResult('❌ Username must be 20 characters or less!', true);
      return;
    }

    const registerRateLimit = checkRateLimit(email, 'register', 3, 3600000); // 3 attempts per hour
    if (!registerRateLimit.allowed) {
      showResult(`❌ ${registerRateLimit.message}`, true);
      return;
    }

    try {
      showResult('⏳ Detecting your IP and VPN status...', false);
      const ipInfo = await detectIPAndVPN();

      if (ipInfo && ipInfo.isVPN) {
        showResult('⚠️ VPN detected - Registration blocked for security', true);
        console.warn("VPN detected, blocking registration");
        return;
      }

      if (ipInfo) {
        const existingUsers = await checkIPRegistration(ipInfo.ip);
        if (existingUsers) {
          showResult(`⚠️ This IP (${ipInfo.ip}) already has accounts: ${existingUsers.join(', ')}`, true);
          console.warn("Duplicate IP detected, blocking registration");
          return;
        }
      }

      showResult('⏳ Creating account...', false);
      await setPersistence(auth, browserLocalPersistence);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      console.log('✅ User created in Auth:', cred.user.uid);

      const selectedAvatarInput = document.getElementById('selectedAvatarData');
      const customAvatar = selectedAvatarInput && selectedAvatarInput.value ? selectedAvatarInput.value : null;
      const randomSticker = getRandomSticker();
      const finalProfilePic = customAvatar || randomSticker;

      showResult('⏳ Saving user data to database...', false);
      const userData = {
        email,
        name,
        username,
        tokens: 2000,
        createdAt: new Date().toISOString(),
        online: true,
        profilePic: finalProfilePic,
        profilePicUrl: finalProfilePic,
        uid: cred.user.uid,
        registrationTimestamp: new Date().toISOString(),
      };

      const securityData = {
        email,
        uid: cred.user.uid,
        registrationIP: ipInfo?.ip || 'unknown',
        registrationCountry: ipInfo?.country || 'unknown',
        registrationCity: ipInfo?.city || 'unknown',
        registrationISP: ipInfo?.isp || 'unknown',
        registrationTimestamp: new Date().toISOString(),
        lastLoginIP: ipInfo?.ip || 'unknown',
        lastLoginTimestamp: new Date().toISOString(),
        loginAttempts: 0
      };

      const savePromise = setDoc(doc(db, 'users', cred.user.uid), userData);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore write timeout - check your internet connection')), 10000)
      );
      await Promise.race([savePromise, timeoutPromise]);

      console.log('✅ User data saved successfully to Firestore:', cred.user.uid);
      console.log('🌍 Registration IP:', ipInfo?.ip);

      try {
        await setDoc(doc(db, 'userSecurity', cred.user.uid), securityData);
        console.log('✅ Security data saved to separate collection');
      } catch (secErr) {
        console.warn('⚠️ Could not save security data:', secErr);
      }

      try {
        await set(ref(rtdb, 'users/' + cred.user.uid), userData);
        console.log('✅ User data also saved to Realtime Database:', cred.user.uid);
      } catch (rtdbErr) {
        console.warn('⚠️ Realtime Database save failed, but Firestore succeeded:', rtdbErr);
      }

      showResult('✅ Successfully registered! Redirecting...', false);
      setTimeout(() => {
        window.location.replace('profile-upload.html');
      }, 1500);
    } catch (err) {
      console.error('❌ Registration error:', err);
      let userFriendlyMessage = err.message || 'Registration failed. Please try again.';

      if (err.code === 'auth/email-already-in-use') {
        userFriendlyMessage = '❌ This email is already registered. Please login or use a different email.';
      } else if (err.code === 'auth/invalid-email') {
        userFriendlyMessage = '❌ Invalid email address.';
      } else if (err.code === 'auth/weak-password') {
        userFriendlyMessage = '❌ Password is too weak. Use at least 8 characters with upper/lowercase and a number.';
      } else if (err.code === 'auth/operation-not-allowed') {
        userFriendlyMessage = '❌ Registration is currently disabled. Try again later.';
      } else if (err.message && err.message.includes('Permission denied')) {
        userFriendlyMessage = '❌ Database Error: Permission denied. Check Firestore security rules in Firebase Console.';
      } else if (err.message && (err.message.includes('offline') || err.message.includes('timeout'))) {
        userFriendlyMessage = '❌ Network Error: Check your internet connection or Firebase rules.';
      }

      showResult(userFriendlyMessage, true);
    }
  });
}

function attachResetHandler() {
  const resetForm = document.getElementById('resetForm');
  if (!resetForm) return;

  resetForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();

    if (!email) {
      showResult('❌ Please enter your email address!', true);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showResult('✅ Reset link sent! Check your email inbox (or spam folder).', false);
      document.getElementById('resetEmail').value = '';
    } catch (err) {
      console.error('Reset Password Error:', err);
      if (err.code === 'auth/user-not-found') {
        showResult('❌ No account found with this email address.', true);
      } else if (err.code === 'auth/invalid-email') {
        showResult('❌ Please enter a valid email address.', true);
      } else if (err.code === 'auth/too-many-requests') {
        showResult('❌ Too many requests. Please try again later.', true);
      } else {
        showResult(`❌ Error: ${err.message}`, true);
      }
    }
  });
}

function initializePasswordToggles() {
  const toggles = document.querySelectorAll('.password-toggle');
  toggles.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const icon = button.querySelector('i');
      if (icon) {
        if (isPassword) {
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      } else {
        button.textContent = isPassword ? 'Hide' : 'Show';
      }
      button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });
}

function initializeFormHandlers() {
  attachRegisterHandler();
  attachResetHandler();
  initializePasswordToggles();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFormHandlers);
} else {
  initializeFormHandlers();
}

const loginForm = document.getElementById('loginForm');
const loginLoaderOverlay = document.getElementById('loginLoaderOverlay');

function showLoginLoader(message = 'Preparing secure login...') {
  if (loginLoaderOverlay) {
    loginLoaderOverlay.classList.add('active');
    const titleEl = loginLoaderOverlay.querySelector('.loader-title');
    const textEl = loginLoaderOverlay.querySelector('.loader-text');
    if (titleEl) titleEl.textContent = message;
    if (textEl) textEl.textContent = 'Authenticating your account and loading your workspace.';
  }
  document.body.classList.add('login-loading');
  const submitBtn = loginForm?.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
  }
}

function hideLoginLoader() {
  if (loginLoaderOverlay) {
    loginLoaderOverlay.classList.remove('active');
  }
  document.body.classList.remove('login-loading');
  const submitBtn = loginForm?.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;

    const loginRateLimit = checkRateLimit(email, 'login', 5, 900000);
    if (!loginRateLimit.allowed) {
      showResult(`❌ ${loginRateLimit.message}`, true);
      return;
    }

    showLoginLoader('Checking credentials...');

    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      showResult('✅ Successfully signed in!');

      // Update online status in Firestore and RTDB
      try {
        const userRef = doc(db, 'users', cred.user.uid);
        await setDoc(userRef, { online: true, lastLogin: new Date().toISOString() }, { merge: true });
        await set(ref(rtdb, 'users/' + cred.user.uid + '/online'), true);
      } catch (statusErr) {
        console.warn('Status update notice:', statusErr);
      }

      setTimeout(() => {
        hideLoginLoader();
        location.href = 'chat.html';
      }, 700);
    } catch (err) {
      hideLoginLoader();
      let errorMsg = err.message || 'Login failed. Please verify your credentials.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Incorrect email or password. Please try again or reset your password.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed login attempts. Please reset your password or try again later.';
      }
      showResult(`❌ ${errorMsg}`, true);
    }
  });
}

onAuthStateChanged(auth, user => {
  if (!user) return;
  const path = location.pathname.toLowerCase();
  const isAuthPage = path === '' || path === '/' || path.endsWith('/') || path.endsWith('index.html') || path.includes('login.html');
  if (isAuthPage && !path.includes('profile') && !path.includes('chat') && !path.includes('register') && !path.includes('reset')) {
    location.href = 'chat.html';
  }
});

let googleSignInInitialized = false;

async function processGoogleUser(user, credentialResult) {
  showLoginLoader('Setting up workspace...');

  // Save credential access token if provided
  try {
    const credential = GoogleAuthProvider.credentialFromResult(credentialResult);
    if (credential?.accessToken) {
      localStorage.setItem('driveAccessToken', credential.accessToken);
      localStorage.setItem('driveAccessTokenExpiry', String(Date.now() + 55 * 60 * 1000));
    }
  } catch (tokenErr) {
    console.warn('Credential token note:', tokenErr);
  }

  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const baseName = (user.displayName || user.email.split('@')[0] || 'User')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 12);
    const randomNum = Math.floor(100 + Math.random() * 900);
    const username = `${baseName || 'User'}${randomNum}`;
    const avatar = user.photoURL || getRandomSticker();

    const userData = {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || 'Google User',
      username: username,
      profilePic: avatar,
      profilePicUrl: avatar,
      tokens: 2000,
      createdAt: new Date().toISOString(),
      registrationTimestamp: new Date().toISOString(),
      online: true,
      lastLogin: new Date().toISOString()
    };

    await setDoc(userRef, userData, { merge: true });

    try {
      await set(ref(rtdb, 'users/' + user.uid), userData);
    } catch (rtdbErr) {
      console.warn('Realtime Database sync warning:', rtdbErr);
    }
  } else {
    // Existing user: preserve existing profile data, update online and lastLogin
    await setDoc(userRef, {
      online: true,
      lastLogin: new Date().toISOString()
    }, { merge: true });

    try {
      await set(ref(rtdb, 'users/' + user.uid + '/online'), true);
      await set(ref(rtdb, 'users/' + user.uid + '/lastLogin'), Date.now());
    } catch (rtdbErr) {
      console.warn('RTDB online update note:', rtdbErr);
    }
  }

  showResult('✅ Google sign-in successful! Redirecting...', false);

  setTimeout(() => {
    hideLoginLoader();
    location.href = 'chat.html';
  }, 700);
}

async function handleGoogleSignIn() {
  showLoginLoader('Connecting with Google...');

  try {
    await setPersistence(auth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    // Do NOT add drive.file scope here — standard login only needs profile and email
    provider.setCustomParameters({ prompt: 'select_account' });

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      showLoginLoader('Redirecting to Google...');
      await signInWithRedirect(auth, provider);
      return;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      await processGoogleUser(result.user, result);
    } catch (popupErr) {
      console.warn('Popup attempt notice:', popupErr.code);
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
        showLoginLoader('Redirecting to Google sign in...');
        await signInWithRedirect(auth, provider);
        return;
      }
      throw popupErr;
    }
  } catch (error) {
    hideLoginLoader();
    console.error("Google Sign-in Error:", error);
    let message = error?.message || 'Google sign-in failed. Please try again.';
    if (error?.code === 'auth/popup-closed-by-user') {
      message = 'Google sign-in was cancelled.';
    } else if (error?.code === 'auth/account-exists-with-different-credential') {
      message = 'An account already exists with this email using a different sign-in method.';
    }
    showResult(`❌ ${message}`, true);
  }
}

async function checkRedirectAuth() {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      console.log('✅ Google redirect auth successful for:', result.user.uid);
      await processGoogleUser(result.user, result);
    }
  } catch (err) {
    console.error('Redirect sign-in error:', err);
    hideLoginLoader();
    if (err.code !== 'auth/null-user') {
      showResult(`❌ ${err.message || 'Google sign-in failed'}`, true);
    }
  }
}

function initializeGoogleSignIn() {
  if (googleSignInInitialized) return;
  googleSignInInitialized = true;

  // Handle redirect return on page load
  checkRedirectAuth();

  const container = document.getElementById('googleSignInContainer');
  let btn = document.getElementById('googleLoginBtn');

  // If container exists but button is not yet inside (e.g. on register.html)
  if (!btn && container) {
    container.innerHTML = `
      <button type="button" id="googleLoginBtn" class="google-auth-btn">
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span class="google-btn-text">Continue with Google</span>
      </button>
    `;
    btn = document.getElementById('googleLoginBtn');
  }

  if (btn) {
    btn.addEventListener('click', handleGoogleSignIn);
  }

  const googleConnectLink = document.getElementById('googleConnectLink');
  if (googleConnectLink) {
    googleConnectLink.addEventListener('click', (e) => {
      e.preventDefault();
      handleGoogleSignIn();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGoogleSignIn);
} else {
  initializeGoogleSignIn();
}
