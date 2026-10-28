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
import { setDoc, doc, getDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
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

  if (!password || password.length < 6) {
    errors.push('at least 6 characters');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

const randomStickers = ['logo.jpg'];

function getRandomSticker() {
  return 'logo.jpg';
}

function sanitizeIpKey(ip) {
  if (!ip || ip === 'unknown') return 'unknown_ip';
  return String(ip).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function detectIPAndVPN() {
  let ipCandidate = null;
  // 1. Try ipify.org (ultra fast, CORS-safe, high availability worldwide)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const d = await resp.json();
      if (d.ip) ipCandidate = d.ip;
    }
  } catch (_) { }

  // 2. Try ipapi.co for rich geolocation & ISP metadata
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      return {
        ip: data.ip || ipCandidate || 'unknown',
        country: data.country_name || 'unknown',
        city: data.city || 'unknown',
        isp: data.org || 'unknown',
        isVPN: false,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        timezone: data.timezone || 'UTC'
      };
    }
  } catch (err) {
    console.warn('[AUTH] Geo IP telemetry note:', err.message);
  }

  // 3. Fallback to ipwho.is if ipapi was rate-limited
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.ip) {
        return {
          ip: data.ip,
          country: data.country || 'unknown',
          city: data.city || 'unknown',
          isp: (data.connection && data.connection.isp) || 'unknown',
          isVPN: false,
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          timezone: (data.timezone && data.timezone.id) || 'UTC'
        };
      }
    }
  } catch (_) { }

  if (ipCandidate) {
    return {
      ip: ipCandidate,
      country: 'unknown',
      city: 'unknown',
      isp: 'unknown',
      isVPN: false,
      latitude: 0,
      longitude: 0,
      timezone: 'UTC'
    };
  }

  return null;
}

async function checkIpRegistrationLimit(ip) {
  // Device-level check
  const localCount = parseInt(localStorage.getItem('nex_reg_accounts_count') || '0', 10);
  if (localCount >= 2) {
    return {
      allowed: false,
      reason: 'Registration quota reached (maximum 2 accounts per device/network). Contact SuperAdmin on WhatsApp (+234 905 434 5858) for authorization.',
      count: localCount
    };
  }

  if (!ip || ip === 'unknown') {
    return { allowed: true, count: localCount };
  }

  const ipKey = sanitizeIpKey(ip);
  try {
    const ipDocRef = doc(db, 'ip_registrations', ipKey);
    const snap = await Promise.race([
      getDoc(ipDocRef),
      new Promise((_, reject) => setTimeout(() => reject(new Error('IP check timeout')), 2500))
    ]);

    if (snap && snap.exists()) {
      const data = snap.data();
      if (data.blocked === true) {
        return {
          allowed: false,
          reason: 'Network registration restricted by security policy. Contact SuperAdmin on WhatsApp: +234 905 434 5858.',
          count: data.count || 2
        };
      }
      if (data.exempt === true) {
        return { allowed: true, count: data.count || 0, exempt: true };
      }
      const count = Number(data.count) || (data.accountUids ? data.accountUids.length : 0);
      if (count >= 2) {
        return {
          allowed: false,
          reason: `Registration Limit Exceeded: Maximum 2 accounts permitted per IP address (${ip}). Existing accounts registered: ${count}/2. Contact SuperAdmin on WhatsApp: +234 905 434 5858 for an exemption.`,
          count: count
        };
      }
      return { allowed: true, count: count };
    }
    return { allowed: true, count: 0 };
  } catch (err) {
    console.warn('[AUTH] IP limit check bypass on network glitch:', err.message);
    return { allowed: true, count: 0 };
  }
}

async function recordIpRegistration(ipInfo, uid, email, username) {
  try {
    const localCount = parseInt(localStorage.getItem('nex_reg_accounts_count') || '0', 10);
    localStorage.setItem('nex_reg_accounts_count', String(localCount + 1));

    if (!ipInfo || !ipInfo.ip || ipInfo.ip === 'unknown') return;

    const ipKey = sanitizeIpKey(ipInfo.ip);
    const ipDocRef = doc(db, 'ip_registrations', ipKey);

    const snap = await Promise.race([
      getDoc(ipDocRef),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
    ]).catch(() => null);

    if (!snap || !snap.exists()) {
      await setDoc(ipDocRef, {
        ip: ipInfo.ip,
        count: 1,
        accountUids: [uid],
        accountEmails: [email],
        lastRegisteredAt: new Date().toISOString(),
        lastUsername: username,
        country: ipInfo.country || 'unknown',
        city: ipInfo.city || 'unknown',
        isp: ipInfo.isp || 'unknown',
        blocked: false,
        exempt: false
      });
    } else {
      const existing = snap.data();
      const currentCount = Number(existing.count || 0);
      const uids = Array.isArray(existing.accountUids) ? [...existing.accountUids] : [];
      const emails = Array.isArray(existing.accountEmails) ? [...existing.accountEmails] : [];
      if (!uids.includes(uid)) uids.push(uid);
      if (!emails.includes(email)) emails.push(email);

      await updateDoc(ipDocRef, {
        count: currentCount + 1,
        accountUids: uids,
        accountEmails: emails,
        lastRegisteredAt: new Date().toISOString(),
        lastUsername: username,
        country: ipInfo.country || existing.country || 'unknown',
        city: ipInfo.city || existing.city || 'unknown',
        isp: ipInfo.isp || existing.isp || 'unknown'
      });
    }
    console.log('[AUTH] IP registration record updated for:', ipKey);
  } catch (err) {
    console.warn('[AUTH] Could not record IP registration:', err.message);
  }
}

function showResult(msg, isError = false) {
  const el = document.getElementById('result');
  if (!el) return;
  el.innerHTML = msg;
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
      showResult('Passwords do not match!', true);
      return;
    }

    const passwordValidation = validatePassword(pass);
    if (!passwordValidation.isValid) {
      const errorMsg = `Password must have ${passwordValidation.errors.join(', ')}`;
      showResult(errorMsg, true);
      return;
    }

    if (name.length < 2) {
      showResult('Name must be at least 2 characters!', true);
      return;
    }

    if (username.length < 3) {
      showResult('Username must be at least 3 characters!', true);
      return;
    }

    if (username.length > 20) {
      showResult('Username must be 20 characters or less!', true);
      return;
    }

    const registerRateLimit = checkRateLimit(email, 'register', 10, 3600000); // 10 attempts per hour
    if (!registerRateLimit.allowed) {
      showResult(`${registerRateLimit.message}`, true);
      return;
    }

    try {
      showLoginLoader('Verifying Security Quota...', 'Inspecting network authorization and IP registration limits.');

      // 1. IP Rate Limiting Guard (Max 2 accounts per IP)
      let detectedIpData = null;
      try {
        detectedIpData = await detectIPAndVPN();
      } catch (_) { }

      const ipLimitCheck = await checkIpRegistrationLimit(detectedIpData ? detectedIpData.ip : null);
      if (!ipLimitCheck.allowed) {
        hideLoginLoader();
        showResult(`
          <div style="display:flex; align-items:flex-start; gap:10px; text-align:left;">
            <i class="fa-solid fa-triangle-exclamation" style="color:#ff3366; font-size:18px; margin-top:2px;"></i>
            <div>
              <strong style="color:#ff3366; display:block; margin-bottom:4px;">Registration Quota Exceeded (Max 2 Accounts per IP)</strong>
              <span>${ipLimitCheck.reason}</span>
              <div style="margin-top:6px; font-size:11px; opacity:0.85;">
                Support &amp; Exemption Hotline: <a href="https://wa.me/2349054345858" target="_blank" style="color:#00f3ff; text-decoration:underline;">+234 905 434 5858</a>
              </div>
            </div>
          </div>
        `, true);
        return;
      }

      showLoginLoader('Creating Account...', 'Registering credentials and configuring secure workspace.');
      showResult('Creating your secure NEXCHAT account...', false);

      // Non-blocking persistence initialization
      setPersistence(auth, browserLocalPersistence).catch(() => { });

      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      console.log('[AUTH] User created in Auth:', cred.user.uid);

      // Record IP registration to ip_registrations collection (Non-blocking background promise)
      recordIpRegistration(detectedIpData, cred.user.uid, email, username).catch(rErr => {
        console.warn('[AUTH] Background IP registration record notice:', rErr?.message);
      });

      const selectedAvatarInput = document.getElementById('selectedAvatarData');
      const customAvatar = selectedAvatarInput && selectedAvatarInput.value ? selectedAvatarInput.value : null;
      const randomSticker = getRandomSticker();
      const finalProfilePic = customAvatar || randomSticker;

      showLoginLoader('Configuring Profile...', 'Saving user profile and initializing wallet tokens.');
      showResult('Saving user profile...', false);

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
        registrationIP: detectedIpData?.ip || 'unknown',
        ipKey: sanitizeIpKey(detectedIpData?.ip)
      };

      // 1. Immediately store to localStorage for zero-latency session continuity
      try {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('auth_uid', cred.user.uid);
        localStorage.setItem('auth_name', name);
        localStorage.setItem('auth_email', email);
        localStorage.setItem('auth_username', username);
        localStorage.setItem('auth_avatar', finalProfilePic);
      } catch (_) { }

      // 2. Save user profile to Firestore with 2.5s safety timeout race (never hang on slow connections)
      try {
        await Promise.race([
          setDoc(doc(db, 'users', cred.user.uid), userData, { merge: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 2500))
        ]);
        console.log('[AUTH] User profile saved to Firestore:', cred.user.uid);
      } catch (docErr) {
        console.warn('[AUTH] Firestore profile write continuing in background:', docErr.message);
      }

      // 3. Telemetry in background (completely non-blocking)
      (async () => {
        const ipInfo = detectedIpData || await detectIPAndVPN();
        if (!ipInfo) return;
        const securityData = {
          email,
          uid: cred.user.uid,
          registrationIP: ipInfo.ip || 'unknown',
          registrationCountry: ipInfo.country || 'unknown',
          registrationCity: ipInfo.city || 'unknown',
          registrationISP: ipInfo.isp || 'unknown',
          registrationTimestamp: new Date().toISOString(),
          lastLoginIP: ipInfo.ip || 'unknown',
          lastLoginTimestamp: new Date().toISOString(),
          loginAttempts: 0
        };
        try {
          await setDoc(doc(db, 'userSecurity', cred.user.uid), securityData, { merge: true });
        } catch (secErr) {
          console.warn('[AUTH] Security telemetry skipped:', secErr.message);
        }
      })().catch(() => { });

      // 4. Realtime Database sync - STRICTLY NON-BLOCKING! NEVER AWAIT!
      try {
        set(ref(rtdb, 'users/' + cred.user.uid), userData).catch(rtdbErr => {
          console.warn('[AUTH] RTDB sync skipped:', rtdbErr?.message);
        });
      } catch (rtdbErr) {
        console.warn('[AUTH] RTDB set skipped:', rtdbErr?.message);
      }

      // 5. Instantly notify & redirect
      showLoginLoader('Registration Complete!', 'Redirecting to your workspace...');
      showResult('Successfully registered! Redirecting...', false);
      setTimeout(() => {
        hideLoginLoader();
        window.location.replace('profile-upload.html');
      }, 500);
    } catch (err) {
      hideLoginLoader();
      console.error('[ERROR] Registration error:', err);
      let userFriendlyMessage = err.message || 'Registration failed. Please try again.';

      if (err.code === 'auth/email-already-in-use') {
        userFriendlyMessage = `This email is already registered. <a href="index.html" style="color: #00f3ff; text-decoration: underline; font-weight: 600;">Sign In here &rarr;</a>`;
      } else if (err.code === 'auth/invalid-email') {
        userFriendlyMessage = 'Invalid email address. Please check and try again.';
      } else if (err.code === 'auth/weak-password') {
        userFriendlyMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/operation-not-allowed') {
        userFriendlyMessage = 'Email registration is currently unavailable. Try Google Sign-In.';
      } else if (err.message && err.message.includes('Permission denied')) {
        userFriendlyMessage = 'Account created in authentication, proceeding to profile setup...';
        setTimeout(() => { window.location.replace('profile-upload.html'); }, 1500);
      } else if (err.message && (err.message.includes('offline') || err.message.includes('timeout'))) {
        userFriendlyMessage = 'Network is slow, retrying your profile setup...';
        setTimeout(() => { window.location.replace('profile-upload.html'); }, 1500);
      }

      showResult(userFriendlyMessage, true);
    }
  });
}

function attachResetHandler() {
  const resetForm = document.getElementById('resetForm');
  if (!resetForm || window.__resetPageCustomHandler) return;

  resetForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();

    if (!email) {
      showResult('Please enter your email address!', true);
      return;
    }

    showLoginLoader('Sending Recovery Link...', 'Dispatching encrypted instructions to your email.');
    const startTime = Date.now();
    const MIN_PROCESSING_TIME_MS = 800; // Uniform constant-time window

    try {
      await sendPasswordResetEmail(auth, email);

      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
      const origin = 'https://nexchat-drab.vercel.app';
      const publicResetUrl = `${origin}/reset.html?email=${encodeURIComponent(email)}&token=${generatedPin}`;

      fetch('/api/send-email-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'password_reset',
          toEmail: email,
          data: {
            username: email.split('@')[0],
            resetUrl: publicResetUrl,
            token: generatedPin,
            ipAddress: 'Current Client IP',
            expiresMinutes: 15,
          },
        }),
      }).catch((dispatchErr) => console.warn('[AUTH] Gmail recovery dispatch notice:', dispatchErr));
    } catch (err) {
      // Suppress enumeration errors completely to prevent attacker reconnaissance
      console.warn('[AUTH] Password reset notice:', err.code);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_PROCESSING_TIME_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_PROCESSING_TIME_MS - elapsed));
      }
      hideLoginLoader();
      showResult('If that email exists, we sent a link. Please check your inbox and spam folder.', false);
      const emailField = document.getElementById('resetEmail');
      if (emailField) emailField.value = '';
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

let loaderWatchdog = null;

// ============================================================================
// NEXCHAT QUANTUM DECRYPTION CINEMATIC INTRO ENGINE
// Combines 4 progressive philosophical phrases while 3D tesseract rolls
// ============================================================================
const NEX_CINEMATIC_PHRASES = [
  "WHAT IF PRIVACY WAS NOT A PRIVILEGE, BUT ABSOLUTE POWER?",
  "IN A WORLD OF TOTAL SURVEILLANCE, TRUE FREEDOM LIES IN THE ENCLAVE.",
  "BEYOND THE HORIZON // ENTER THE ZERO-KNOWLEDGE FRONTIER.",
  "COMMUNICATION EVOLVED. ZERO TRACE. ABSOLUTE AUTONOMY."
];

let cinematicTypewriterTimer = null;
let currentPhraseIndex = 0;
let currentCharIndex = 0;
let isCinematicActive = false;

function startCinematicTypewriter() {
  const textEl = document.getElementById('quantumTypewriterText');
  if (!textEl) return;

  isCinematicActive = true;
  currentPhraseIndex = 0;
  currentCharIndex = 0;
  textEl.textContent = '';
  updatePhasePills(0);

  function typeNextChar() {
    if (!isCinematicActive) return;

    const phrase = NEX_CINEMATIC_PHRASES[currentPhraseIndex];
    if (currentCharIndex < phrase.length) {
      textEl.textContent += phrase.charAt(currentCharIndex);
      currentCharIndex++;
      cinematicTypewriterTimer = setTimeout(typeNextChar, 25);
    } else {
      updatePhasePills(currentPhraseIndex, true);
      cinematicTypewriterTimer = setTimeout(() => {
        if (!isCinematicActive) return;
        currentPhraseIndex = (currentPhraseIndex + 1) % NEX_CINEMATIC_PHRASES.length;
        currentCharIndex = 0;
        textEl.textContent = '';
        updatePhasePills(currentPhraseIndex);
        typeNextChar();
      }, 550);
    }
  }

  typeNextChar();
}

function updatePhasePills(activeIndex, markPreviousCompleted = false) {
  for (let i = 1; i <= 4; i++) {
    const pill = document.getElementById(`phasePill${i}`);
    if (!pill) continue;
    const pillIndex = i - 1;
    pill.classList.remove('active', 'completed');
    if (pillIndex === activeIndex) {
      pill.classList.add('active');
    } else if (pillIndex < activeIndex || (markPreviousCompleted && pillIndex <= activeIndex)) {
      pill.classList.add('completed');
    }
  }
}

function stopCinematicTypewriter(finalSeal = true) {
  isCinematicActive = false;
  if (cinematicTypewriterTimer) {
    clearTimeout(cinematicTypewriterTimer);
    cinematicTypewriterTimer = null;
  }
  const textEl = document.getElementById('quantumTypewriterText');
  if (textEl && finalSeal) {
    textEl.textContent = "QUANTUM CORE ENGAGED // ACCESS GRANTED";
    updatePhasePills(3, true);
  }
}

function showLoginLoader(message = 'Preparing secure login...', subtext = 'Authenticating your account and loading your workspace.') {
  if (loaderWatchdog) clearTimeout(loaderWatchdog);
  const overlay = document.getElementById('loginLoaderOverlay');
  if (overlay) {
    overlay.classList.add('active');
    const titleEl = overlay.querySelector('.loader-title');
    const textEl = overlay.querySelector('.loader-text');
    if (titleEl) titleEl.textContent = message;
    if (textEl) textEl.textContent = subtext;
  }
  startCinematicTypewriter();
  document.body.classList.add('login-loading');
  const activeSubmitBtn = document.querySelector('form button[type="submit"]');
  if (activeSubmitBtn) {
    activeSubmitBtn.classList.add('loading');
    activeSubmitBtn.disabled = true;
  }

  // Safety watchdog: auto-hide after 8 seconds so the UI NEVER stays frozen
  loaderWatchdog = setTimeout(() => {
    console.warn('[AUTH] Loader watchdog triggered after 8s - auto-hiding loader');
    hideLoginLoader();
  }, 8000);
}

function hideLoginLoader() {
  stopCinematicTypewriter(false);
  if (loaderWatchdog) {
    clearTimeout(loaderWatchdog);
    loaderWatchdog = null;
  }
  const overlay = document.getElementById('loginLoaderOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
  document.body.classList.remove('login-loading');
  const activeSubmitBtn = document.querySelector('form button[type="submit"]');
  if (activeSubmitBtn) {
    activeSubmitBtn.classList.remove('loading');
    activeSubmitBtn.disabled = false;
  }
}

// Allow user to dismiss login loader via backdrop click or Escape key
const loginOverlayEl = document.getElementById('loginLoaderOverlay');
if (loginOverlayEl) {
  loginOverlayEl.addEventListener('click', (e) => {
    if (e.target === loginOverlayEl) {
      hideLoginLoader();
    }
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideLoginLoader();
  }
});

if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;

    const loginRateLimit = checkRateLimit(email, 'login', 5, 900000);
    if (!loginRateLimit.allowed) {
      showResult(`${loginRateLimit.message}`, true);
      return;
    }

    showLoginLoader('Checking credentials...');

    try {
      setPersistence(auth, browserLocalPersistence).catch(() => { });
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      showResult('Successfully signed in!');

      // Cache session UID immediately
      try {
        localStorage.setItem('auth_uid', cred.user.uid);
        localStorage.setItem('auth_email', email);
      } catch (_) { }

      // Update online status in Firestore (with 2s race) and non-blocking RTDB
      try {
        const userRef = doc(db, 'users', cred.user.uid);
        Promise.race([
          setDoc(userRef, { online: true, lastLogin: new Date().toISOString() }, { merge: true }),
          new Promise(res => setTimeout(res, 2000))
        ]).catch(() => { });

        // RTDB online update: NEVER AWAIT
        set(ref(rtdb, 'users/' + cred.user.uid + '/online'), true).catch(() => { });
      } catch (statusErr) {
        console.warn('Status update notice:', statusErr);
      }

      setTimeout(() => {
        hideLoginLoader();
        location.href = 'chat.html';
      }, 400);
    } catch (err) {
      hideLoginLoader();
      let errorMsg = err.message || 'Login failed. Please verify your credentials.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Incorrect email or password. Please try again or reset your password.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed login attempts. Please reset your password or try again later.';
      }
      showResult(`${errorMsg}`, true);
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

window.quickGuestLogin = function () {
  const guestUid = 'guest_' + Math.floor(100000 + Math.random() * 900000);
  const guestName = 'Guest Explorer';
  const guestUser = {
    uid: guestUid,
    email: 'guest@nexchat.io',
    name: guestName,
    username: 'Guest' + Math.floor(100 + Math.random() * 900),
    profilePic: 'favicon.png',
    profilePicUrl: 'favicon.png',
    tokens: 2000,
    isGuest: true,
    online: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  try {
    localStorage.setItem('auth_uid', guestUid);
    localStorage.setItem('auth_email', guestUser.email);
    localStorage.setItem('auth_name', guestUser.name);
    localStorage.setItem('auth_username', guestUser.username);
    localStorage.setItem('auth_avatar', guestUser.profilePic);
    localStorage.setItem('currentUser', JSON.stringify(guestUser));
  } catch (_) { }

  showResult('Signed in as Guest Explorer! Launching NEXCHAT...', false);
  showLoginLoader('Setting up guest workspace...');

  setTimeout(() => {
    hideLoginLoader();
    location.href = 'chat.html';
  }, 400);
};

window.signInWithRedirectFallback = async function () {
  showLoginLoader('Redirecting to Google...');
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithRedirect(auth, provider);
  } catch (err) {
    hideLoginLoader();
    showResult(`Redirect Error: ${err.message || 'Unable to redirect.'}`, true);
  }
};

async function processGoogleUser(user, credentialResult) {
  showLoginLoader('Setting up workspace...');

  // 1. Immediately cache session locally for instant authentication
  const baseName = (user.displayName || user.email?.split('@')[0] || 'User')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 12);
  const randomNum = Math.floor(100 + Math.random() * 900);
  const username = `${baseName || 'User'}${randomNum}`;
  const avatar = user.photoURL || getRandomSticker();

  const primaryUserData = {
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

  try {
    localStorage.setItem('auth_uid', user.uid);
    localStorage.setItem('auth_email', user.email || '');
    localStorage.setItem('auth_name', user.displayName || 'Google User');
    localStorage.setItem('auth_username', username);
    localStorage.setItem('auth_avatar', avatar);
    localStorage.setItem('currentUser', JSON.stringify(primaryUserData));
  } catch (storageErr) {
    console.warn('[AUTH] Local storage session notice:', storageErr);
  }

  // Save credential access token if available
  try {
    const credential = GoogleAuthProvider.credentialFromResult(credentialResult);
    if (credential?.accessToken) {
      localStorage.setItem('driveAccessToken', credential.accessToken);
      localStorage.setItem('driveAccessTokenExpiry', String(Date.now() + 55 * 60 * 1000));
    }
  } catch (tokenErr) {
    console.warn('[AUTH] Credential token note:', tokenErr);
  }

  // 2. Safe, non-blocking sync with Firestore & Realtime Database
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await Promise.race([
      getDoc(userRef),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]).catch(() => null);

    if (!userDoc || !userDoc.exists()) {
      setDoc(userRef, primaryUserData, { merge: true }).catch(() => { });
      try {
        set(ref(rtdb, 'users/' + user.uid), primaryUserData).catch(() => { });
      } catch (_) { }
    } else {
      setDoc(userRef, {
        online: true,
        lastLogin: new Date().toISOString()
      }, { merge: true }).catch(() => { });

      try {
        set(ref(rtdb, 'users/' + user.uid + '/online'), true).catch(() => { });
        set(ref(rtdb, 'users/' + user.uid + '/lastLogin'), Date.now()).catch(() => { });
      } catch (_) { }
    }
  } catch (syncErr) {
    console.warn('[AUTH] Background cloud sync note:', syncErr);
  }

  showResult('Google sign-in successful! Redirecting...', false);

  setTimeout(() => {
    hideLoginLoader();
    location.href = 'chat.html';
  }, 350);
}

async function handleGoogleSignIn() {
  showLoginLoader('Connecting with Google...');

  try {
    // DO NOT await setPersistence synchronously right before popup!
    setPersistence(auth, browserLocalPersistence).catch(() => { });

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupErr) {
      console.warn('[AUTH] Popup attempt notice:', popupErr.code, popupErr.message);
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
        showLoginLoader('Redirecting to Google sign in...');
        await signInWithRedirect(auth, provider);
        return;
      }
      throw popupErr;
    }

    if (result && result.user) {
      await processGoogleUser(result.user, result);
    }
  } catch (error) {
    hideLoginLoader();
    console.error("Google Sign-in Error:", error);

    let errorHtml = '';
    const errCode = error?.code || '';

    if (errCode === 'auth/unauthorized-domain') {
      const currentHost = location.hostname || 'this domain';
      errorHtml = `
        <div class="auth-error-detail">
          <strong><i class="fa-solid fa-triangle-exclamation"></i> Domain Unauthorized in Firebase</strong>
          <p style="margin: 6px 0 8px; font-size: 12px; line-height: 1.4;">
            Domain <code>${currentHost}</code> is not in your Firebase Authorized Domains list.<br>
            Add it in <b>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains</b>.
          </p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            <a href="https://console.firebase.google.com/project/nexchat-47326/authentication/settings" target="_blank" rel="noopener" class="quick-guest-btn" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; background: rgba(0,243,255,0.15); border: 1px solid #00f3ff; color: #00f3ff; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Firebase Console Settings
            </a>
            <button type="button" class="quick-guest-btn" onclick="window.quickGuestLogin()">
              <i class="fa-solid fa-bolt"></i> Continue as Guest / Demo Mode
            </button>
          </div>
        </div>
      `;
    } else if (errCode === 'auth/operation-not-allowed') {
      errorHtml = `
        <div class="auth-error-detail">
          <strong><i class="fa-solid fa-triangle-exclamation"></i> Google Sign-In Disabled</strong>
          <p style="margin: 6px 0 8px; font-size: 12px;">
            Google Provider is not enabled in Firebase.<br>
            Enable it in <b>Firebase Console &gt; Authentication &gt; Sign-in method &gt; Google</b>.
          </p>
          <button type="button" class="quick-guest-btn" onclick="window.quickGuestLogin()">
            <i class="fa-solid fa-bolt"></i> Continue as Guest / Demo Mode
          </button>
        </div>
      `;
    } else if (errCode === 'auth/popup-closed-by-user') {
      errorHtml = 'Google sign-in popup was closed before completing.';
    } else if (errCode === 'auth/popup-blocked') {
      errorHtml = `
        <div class="auth-error-detail">
          <strong>Popup Blocked</strong>
          <p style="margin: 4px 0 8px; font-size: 12px;">Please allow popups for this site, or try redirect sign-in.</p>
          <button type="button" class="quick-guest-btn" onclick="window.signInWithRedirectFallback()">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> Try Redirect Sign-In
          </button>
        </div>
      `;
    } else if (errCode === 'auth/cancelled-popup-request') {
      errorHtml = 'Sign-in request was cancelled.';
    } else if (errCode === 'auth/account-exists-with-different-credential') {
      errorHtml = 'An account already exists with this email address using another login method.';
    } else if (errCode === 'auth/network-request-failed') {
      errorHtml = 'Network connection failed. Please check your internet connection.';
    } else {
      let rawMsg = error?.message || 'Google sign-in failed. Please try again.';
      rawMsg = rawMsg.replace(/^Firebase:\s*Error\s*\(([^)]+)\)\.?/i, '$1:').trim();
      errorHtml = `
        <div class="auth-error-detail">
          <strong>Authentication Notice (${errCode || 'Info'})</strong>
          <p style="margin: 4px 0 8px; font-size: 12px;">${rawMsg}</p>
          <button type="button" class="quick-guest-btn" onclick="window.quickGuestLogin()">
            <i class="fa-solid fa-bolt"></i> Continue as Guest / Demo Mode
          </button>
        </div>
      `;
    }

    showResult(errorHtml, true);
  }
}

async function checkRedirectAuth() {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      console.log('[AUTH] Google redirect auth successful for:', result.user.uid);
      await processGoogleUser(result.user, result);
    }
  } catch (err) {
    console.error('Redirect sign-in error:', err);
    hideLoginLoader();
    if (err.code !== 'auth/null-user') {
      let rawMsg = err.message || 'Google sign-in failed';
      rawMsg = rawMsg.replace(/^Firebase:\s*Error\s*\(([^)]+)\)\.?/i, '$1:').trim();
      showResult(`
        <div class="auth-error-detail">
          <strong>Google Sign-In (${err.code || 'Notice'})</strong>
          <p style="margin: 4px 0 8px; font-size: 12px;">${rawMsg}</p>
          <button type="button" class="quick-guest-btn" onclick="window.quickGuestLogin()">
            <i class="fa-solid fa-bolt"></i> Continue as Guest / Demo Mode
          </button>
        </div>
      `, true);
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
  document.addEventListener('DOMContentLoaded', () => {
    initializeGoogleSignIn();
    initNexshotFusionIntro();
  });
} else {
  initializeGoogleSignIn();
  initNexshotFusionIntro();
}

/* ============================================================
   NEXCHAT QUANTUM CINEMATIC INTRO CONTROLLER
   True 3D Rotating Cyber Cube + Quantum Decryption Typewriter
   ============================================================ */
function initNexshotFusionIntro() {
  const overlay = document.getElementById('nexshotFusionOverlay');
  if (!overlay) return;

  const canvas = document.getElementById('fusionCanvas');
  const skipBtn = document.getElementById('fusionSkipBtn');
  const audioBtn = document.getElementById('fusionAudioBtn');
  const replayBtn = document.getElementById('replayFusionBtn');
  const typewriterText = document.getElementById('introTypewriterText');
  const phaseBadge = document.getElementById('introConsolePhaseBadge');
  const progressBar = document.getElementById('introProgressBar');



  const CINEMATIC_PHRASES = [
    "HAVE YOU EVER FELT LIKE YOUR PRIVACY WAS NEVER TRULY YOURS?",
    "IN A WORLD OF TOTAL SURVEILLANCE, TRUE FREEDOM LIES IN THE ENCLAVE.",
    "BEYOND THE HORIZON // ENTER THE ZERO-KNOWLEDGE FRONTIER.",
    "COMMUNICATION EVOLVED. ZERO TRACE. ABSOLUTE AUTONOMY."
  ];

  let animationTimers = [];
  let isMuted = false;
  let audioCtx = null;
  let canvasAnimId = null;
  let isIntroActive = false;
  let currentPhraseIdx = 0;
  let currentCharIdx = 0;

  function getAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => { });
    }
    return audioCtx;
  }

  function playSynthTone(freq, type = 'sine', duration = 0.5, gainVal = 0.15) {
    if (isMuted) return;
    try {
      const ctx = getAudio();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) { }
  }

  function playMajesticChord() {
    if (isMuted) return;
    // Harmonious quantum chord: C4, G4, C5, E5, G5
    const freqs = [261.63, 392.00, 523.25, 659.25, 783.99];
    freqs.forEach((f, idx) => {
      setTimeout(() => {
        playSynthTone(f, 'sine', 1.6, 0.12 - (idx * 0.015));
      }, idx * 60);
    });
  }

  // Particle Starfield Canvas Engine
  function initParticleCanvas() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      if (overlay.classList.contains('fusion-completed')) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 75;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        size: Math.random() * 2 + 0.8,
        color: Math.random() > 0.5 ? '#00f0ff' : '#00ff66',
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    function renderParticles() {
      if (overlay.classList.contains('fusion-completed')) {
        cancelAnimationFrame(canvasAnimId);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      canvasAnimId = requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  function clearAllTimers() {
    animationTimers.forEach(t => clearTimeout(t));
    animationTimers = [];
  }



  function typeIntroCharacter() {
    if (!isIntroActive) return;

    const currentPhrase = CINEMATIC_PHRASES[currentPhraseIdx];
    if (currentCharIdx < currentPhrase.length) {
      if (typewriterText) {
        typewriterText.textContent = currentPhrase.slice(0, currentCharIdx + 1);
      }

      // Progress calculation across phrases
      if (progressBar) {
        const charRatio = (currentCharIdx + 1) / currentPhrase.length;
        const totalProgress = ((currentPhraseIdx + charRatio) / CINEMATIC_PHRASES.length) * 100;
        progressBar.style.width = `${totalProgress}%`;
      }

      // Soft cyber click every few characters
      if (currentCharIdx % 3 === 0) {
        playSynthTone(1300 + (currentCharIdx * 8) % 400, 'sine', 0.03, 0.015);
      }

      currentCharIdx++;
      const timer = setTimeout(typeIntroCharacter, 24);
      animationTimers.push(timer);
    } else {
      // Finished typing current phrase

      if (currentPhraseIdx < CINEMATIC_PHRASES.length - 1) {
        // Pause between phrases (~600ms)
        const pauseTimer = setTimeout(() => {
          if (!isIntroActive) return;
          currentPhraseIdx++;
          currentCharIdx = 0;
          if (typewriterText) typewriterText.textContent = '';
          if (phaseBadge) phaseBadge.textContent = `PHASE ${currentPhraseIdx + 1}/4`;
          typeIntroCharacter();
        }, 650);
        animationTimers.push(pauseTimer);
      } else {
        // All 4 phases finished! Access granted final seal
        if (progressBar) progressBar.style.width = '100%';
        const finalTimer = setTimeout(() => {
          if (!isIntroActive) return;
          if (typewriterText) {
            typewriterText.textContent = "[NEXCHAT QUANTUM CORE ENGAGED // ACCESS GRANTED]";
          }
          if (phaseBadge) phaseBadge.textContent = "CORE SEALED";
          playMajesticChord();

          // Auto-transition to login
          const exitTimer = setTimeout(() => {
            dismissOverlay();
          }, 1400);
          animationTimers.push(exitTimer);
        }, 400);
        animationTimers.push(finalTimer);
      }
    }
  }

  function startAnimation(forced = false) {
    clearAllTimers();
    overlay.style.display = 'flex';
    overlay.classList.remove('fusion-completed');

    isIntroActive = true;
    currentPhraseIdx = 0;
    currentCharIdx = 0;

    if (typewriterText) typewriterText.textContent = '';
    if (phaseBadge) phaseBadge.textContent = 'PHASE 1/4';
    if (progressBar) progressBar.style.width = '0%';

    initParticleCanvas();

    // Subtle initial chime
    playSynthTone(523.25, 'sine', 0.5, 0.08);

    // Start typing after brief 250ms warmup
    const startTimer = setTimeout(() => {
      typeIntroCharacter();
    }, 250);
    animationTimers.push(startTimer);
  }

  function dismissOverlay() {
    isIntroActive = false;
    clearAllTimers();
    overlay.classList.add('fusion-completed');
    try { sessionStorage.setItem('nexshot_fusion_seen', 'true'); } catch (_) { }
    setTimeout(() => {
      overlay.style.display = 'none';
      if (canvasAnimId) cancelAnimationFrame(canvasAnimId);
    }, 650);
  }

  // Event Listeners
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismissOverlay();
    });
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isMuted = !isMuted;
      audioBtn.innerHTML = isMuted
        ? '<i class="fa-solid fa-volume-xmark" style="color: #ef4444;"></i>'
        : '<i class="fa-solid fa-volume-high" style="color: var(--accent-emerald);"></i>';
      if (!isMuted) getAudio();
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      startAnimation(true);
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('fusion-completed')) {
      dismissOverlay();
    }
  });

  // Clicking on background overlay outside console/buttons allows instant pass-through
  overlay.addEventListener('click', (e) => {
    if (e.target.closest('#introTypewriterConsole') || e.target.closest('.fusion-topbar')) {
      return;
    }
    dismissOverlay();
  });

  // Check if previously seen in this session
  let alreadySeen = false;
  try {
    alreadySeen = sessionStorage.getItem('nexshot_fusion_seen') === 'true';
  } catch (_) { }

  if (!alreadySeen) {
    startAnimation(false);
  } else {
    overlay.classList.add('fusion-completed');
    overlay.style.display = 'none';
  }
}

// Window exports for IP Sybil Shield & Registration Quota Monitoring
window.checkIpRegistrationLimit = checkIpRegistrationLimit;
window.recordIpRegistration = recordIpRegistration;
window.detectIPAndVPN = detectIPAndVPN;
window.sanitizeIpKey = sanitizeIpKey;


