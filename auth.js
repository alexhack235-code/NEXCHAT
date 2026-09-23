import { auth, db, rtdb } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInWithPopup,
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
  'ðŸ˜‡', 'ðŸ˜Š', 'ðŸ˜', 'ðŸ¥°', 'ðŸ˜˜', 'ðŸ˜™', 'ðŸ˜š', 'ðŸ˜—', 'ðŸ¤—', 'ðŸ¤©',
  'ðŸ˜ƒ', 'ðŸ˜„', 'ðŸ˜', 'ðŸ˜†', 'ðŸ˜…', 'ðŸ˜‚', 'ðŸ¤£', 'â˜ºï¸', 'ðŸ™‚', 'ðŸ¤',
  'ðŸ‘¼', 'ðŸ’š', 'ðŸ’›', 'ðŸ’œ', 'ðŸ’™', 'â¤ï¸', 'ðŸ§¡', 'ðŸ’', 'ðŸ’–', 'ðŸ’—',
  'ðŸ‘', 'âœ¨', 'ðŸŒŸ', 'â­', 'ðŸŽ‰', 'ðŸŽŠ', 'ðŸŽˆ', 'ðŸŽ', 'ðŸ†', 'ðŸ¥‡',
  'ðŸ˜ˆ', 'ðŸ˜ ', 'ðŸ˜¡', 'ðŸ¤¬', 'ðŸ˜¤', 'ðŸ˜’', 'ðŸ™', 'ðŸ˜•', 'ðŸ˜”', 'ðŸ˜ž',
  'ðŸ˜¢', 'ðŸ˜­', 'ðŸ˜«', 'ðŸ˜©', 'ðŸ¥±', 'ðŸ˜ª', 'ðŸ˜´', 'ðŸ˜¬', 'ðŸ¤¥', 'ðŸ˜³',
  'ðŸ˜¨', 'ðŸ˜°', 'ðŸ˜¥', 'ðŸ˜“', 'ðŸ¤¤', 'ðŸ˜²', 'ðŸ˜¦', 'ðŸ˜§', 'ðŸ¤¯', 'ðŸ¤ª',
  'ðŸ’”', 'ðŸ’£', 'âš¡', 'â˜ ï¸', 'ðŸ’€', 'ðŸ”¥', 'â›”', 'ðŸš«', 'âŒ', 'âš ï¸',
  'ðŸ‘¿', 'ðŸ˜ˆ', 'ðŸ˜¹', 'ðŸ˜¾', 'ðŸ‰', 'ðŸ¦—', 'ðŸ›', 'ðŸ•·ï¸', 'ðŸ¦‚', 'ðŸ¦‡',
  'ðŸ¦‘', 'ðŸ™', 'ðŸ¦ˆ', 'ðŸ', 'ðŸ¦–', 'ðŸ¦•', 'ðŸ”±', 'âš”ï¸', 'ðŸ’€', 'ðŸ¦´',
  'ðŸ¤”', 'ðŸ¤¨', 'ðŸ˜', 'ðŸ˜‘', 'ðŸ¤ ', 'ðŸ¥¸', 'ðŸ˜Ž', 'ðŸ¤“', 'ðŸ§', 'ðŸ˜',
  'ðŸ˜œ', 'ðŸ˜', 'ðŸ˜›', 'ðŸ¤‘', 'ðŸ¤’', 'ðŸ¤•', 'ðŸ¤¢', 'ðŸ¤®', 'ðŸ¤§', 'ðŸ¤¨',
  'ðŸ¶', 'ðŸ±', 'ðŸ­', 'ðŸ¹', 'ðŸ°', 'ðŸ¦Š', 'ðŸ»', 'ðŸ¼', 'ðŸ¨', 'ðŸ¯',
  'ðŸ¦', 'ðŸ®', 'ðŸ·', 'ðŸ¸', 'ðŸµ', 'ðŸ™ˆ', 'ðŸ™‰', 'ðŸ™Š', 'ðŸ’', 'ðŸ”',
  'ðŸ§', 'ðŸ¦', 'ðŸ¤', 'ðŸ¦†', 'ðŸ¦…', 'ðŸ¦‰', 'ðŸ¦‡', 'ðŸº', 'ðŸ—', 'ðŸ´',
  'ðŸ¦„', 'ðŸ', 'ðŸ›', 'ðŸ¦‹', 'ðŸŒ', 'ðŸž', 'ðŸœ', 'ðŸ¦Ÿ', 'ðŸ¦—', 'ðŸ•·ï¸',
  'ðŸ‘‹', 'ðŸ‘', 'ðŸ™Œ', 'ðŸ‘', 'ðŸ¤', 'ðŸ¤²', 'ðŸ¤ž', 'ðŸ––', 'ðŸ¤˜', 'ðŸ¤Ÿ',
  'âœŠ', 'ðŸ‘Š', 'âœŒï¸', 'ðŸ¤ž', 'ðŸ«°', 'ðŸ«±', 'ðŸ«²', 'ðŸ’ª', 'ðŸ¦¿',
  'â¤ï¸', 'ðŸ§¡', 'ðŸ’›', 'ðŸ’š', 'ðŸ’™', 'ðŸ’œ', 'ðŸ–¤', 'ðŸ¤', 'ðŸ¤Ž', 'ðŸ’”',
  'ðŸ’•', 'ðŸ’ž', 'ðŸ’“', 'ðŸ’—', 'ðŸ’–', 'ðŸ’˜', 'ðŸ’', 'ðŸ’Ÿ', 'ðŸ’Œ', 'ðŸ’‹',
  'ðŸ”¥', 'âš¡', 'âœ¨', 'ðŸ’«', 'â­', 'ðŸŒŸ', 'ðŸ’¥', 'ðŸ’¢', 'ðŸ’¯', 'ðŸš€'
];

function getRandomSticker() {
  return randomStickers[Math.floor(Math.random() * randomStickers.length)];
}

async function detectIPAndVPN() {
  try {
    console.log("ðŸ” Detecting IP and VPN...");

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

    console.log("ðŸ“ IP Info:", ipInfo);
    return ipInfo;
  } catch (err) {
    console.warn("âš ï¸ Could not detect IP:", err);
    return null;
  }
}

async function checkIPRegistration(ipAddress) {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("registrationIP", "==", ipAddress));
    const snap = await getDocs(q);

    if (snap.docs.length > 0) {
      console.warn("âš ï¸ IP already registered!");
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
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isVisible = input.type === 'text';
      input.type = isVisible ? 'password' : 'text';
      button.textContent = isVisible ? 'Show' : 'Hide';
      button.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
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
      showResult(`âŒ ${loginRateLimit.message}`, true);
      return;
    }

    showLoginLoader('Checking credentials...');

    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      showResult('âœ… Successfully signed in!');

      setTimeout(() => {
        hideLoginLoader();
        location.href = 'chat.html';
      }, 700);
    } catch (err) {
      hideLoginLoader();
      showResult(err.message, true);
    }
  });
}


onAuthStateChanged(auth, user => {
  if (!user) return;
  const path = location.pathname.toLowerCase();
  if ((path.endsWith('index.html') || path.includes('login')) && !path.includes('profile') && !path.includes('chat')) {
    location.href = 'chat.html';
  }
});

function initializeGoogleSignIn() {
  const container = document.getElementById('googleSignInContainer');
  if (!container) return;

  container.innerHTML = `
    <button type="button" id="googleLoginBtn" class="google-btn">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18" style="margin-right: 8px;">
      🔐 Sign in with Google
    </button>
  `;

  async function handleGoogleSignIn() {
    showLoginLoader('Connecting with Google...');

    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      if (accessToken) {
        localStorage.setItem('driveAccessToken', accessToken);
        localStorage.setItem('driveAccessTokenExpiry', String(Date.now() + 55 * 60 * 1000));
      }

      showResult('✅ Google sign-in successful! Redirecting...', false);

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: user.email,
          username: (user.displayName || 'User').split(' ')[0] + Math.floor(Math.random() * 1000),
          name: user.displayName || 'Google User',
          profilePic: user.photoURL,
          tokens: 2000,
          createdAt: new Date().toISOString(),
          online: true
        });
      }

      setTimeout(() => {
        hideLoginLoader();
        location.href = 'chat.html';
      }, 900);
    } catch (error) {
      hideLoginLoader();
      console.error("Google Sign-in Error:", error);
      let message = error?.message || 'Google sign-in failed. Please try again.';
      if (error?.code === 'auth/popup-closed-by-user') {
        message = 'Google sign-in cancelled. Please try again if you want to sign in with Google.';
      }
      showResult(`❌ ${message}`, true);
    }
  }

  document.getElementById('googleLoginBtn').addEventListener('click', handleGoogleSignIn);
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



