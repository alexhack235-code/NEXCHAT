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

async function detectIPAndVPN() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();

    const ipInfo = {
      ip: data.ip || 'unknown',
      country: data.country_name || 'unknown',
      city: data.city || 'unknown',
      isp: data.org || 'unknown',
      isVPN: false, // Do not block users based on carrier proxy heuristics
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      timezone: data.timezone || 'UTC'
    };

    return ipInfo;
  } catch (err) {
    console.warn('[AUTH] Network telemetry note:', err.message);
    return null;
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
      showLoginLoader('Creating Account...', 'Registering credentials and configuring secure workspace.');
      showResult('Creating your secure NEXCHAT account...', false);

      // Non-blocking persistence initialization
      setPersistence(auth, browserLocalPersistence).catch(() => {});

      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      console.log('[AUTH] User created in Auth:', cred.user.uid);

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
      };

      // 1. Immediately store to localStorage for zero-latency session continuity
      try {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('auth_uid', cred.user.uid);
        localStorage.setItem('auth_name', name);
        localStorage.setItem('auth_email', email);
        localStorage.setItem('auth_username', username);
        localStorage.setItem('auth_avatar', finalProfilePic);
      } catch (_) {}

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
      detectIPAndVPN().then(async (ipInfo) => {
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
      }).catch(() => {});

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
  if (!resetForm) return;

  resetForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();

    if (!email) {
      showResult('Please enter your email address!', true);
      return;
    }

    showLoginLoader('Sending Recovery Link...', 'Dispatching encrypted instructions to your email.');

    try {
      await sendPasswordResetEmail(auth, email);
      hideLoginLoader();
      showResult('Reset link sent! Check your email inbox (or spam folder).', false);
      document.getElementById('resetEmail').value = '';
    } catch (err) {
      hideLoginLoader();
      console.error('Reset Password Error:', err);
      if (err.code === 'auth/user-not-found') {
        showResult('No account found with this email address.', true);
      } else if (err.code === 'auth/invalid-email') {
        showResult('Please enter a valid email address.', true);
      } else if (err.code === 'auth/too-many-requests') {
        showResult('Too many requests. Please try again later.', true);
      } else {
        showResult(`Error: ${err.message}`, true);
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

let loaderWatchdog = null;

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
      setPersistence(auth, browserLocalPersistence).catch(() => {});
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      showResult('Successfully signed in!');

      // Cache session UID immediately
      try {
        localStorage.setItem('auth_uid', cred.user.uid);
        localStorage.setItem('auth_email', email);
      } catch (_) {}

      // Update online status in Firestore (with 2s race) and non-blocking RTDB
      try {
        const userRef = doc(db, 'users', cred.user.uid);
        Promise.race([
          setDoc(userRef, { online: true, lastLogin: new Date().toISOString() }, { merge: true }),
          new Promise(res => setTimeout(res, 2000))
        ]).catch(() => {});

        // RTDB online update: NEVER AWAIT
        set(ref(rtdb, 'users/' + cred.user.uid + '/online'), true).catch(() => {});
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

    setDoc(userRef, userData, { merge: true }).catch(() => {});

    try {
      set(ref(rtdb, 'users/' + user.uid), userData).catch(rtdbErr => {
        console.warn('Realtime Database sync warning:', rtdbErr);
      });
    } catch (rtdbErr) {
      console.warn('Realtime Database sync warning:', rtdbErr);
    }
  } else {
    // Existing user: preserve existing profile data, update online and lastLogin
    setDoc(userRef, {
      online: true,
      lastLogin: new Date().toISOString()
    }, { merge: true }).catch(() => {});

    try {
      set(ref(rtdb, 'users/' + user.uid + '/online'), true).catch(() => {});
      set(ref(rtdb, 'users/' + user.uid + '/lastLogin'), Date.now()).catch(() => {});
    } catch (rtdbErr) {
      console.warn('RTDB online update note:', rtdbErr);
    }
  }

  showResult('Google sign-in successful! Redirecting...', false);

  setTimeout(() => {
    hideLoginLoader();
    location.href = 'chat.html';
  }, 400);
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
    showResult(`${message}`, true);
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
      showResult(`${err.message || 'Google sign-in failed'}`, true);
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
   NEXSHOT FUSION CINEMATIC INTRO CONTROLLER
   NEXCHAT × CAMSHOT = NEXSHOT // "THE FUTURE IS RIGHT HERE"
   ============================================================ */
function initNexshotFusionIntro() {
  const overlay = document.getElementById('nexshotFusionOverlay');
  if (!overlay) return;

  const canvas = document.getElementById('fusionCanvas');
  const skipBtn = document.getElementById('fusionSkipBtn');
  const audioBtn = document.getElementById('fusionAudioBtn');
  const replayBtn = document.getElementById('replayFusionBtn');
  const streams = document.getElementById('fusionStreams');
  const singularity = document.getElementById('fusionSingularity');
  const reveal = document.getElementById('fusionReveal');
  const progressBar = document.getElementById('fusionProgressBar');

  let animationTimers = [];
  let isMuted = false;
  let audioCtx = null;
  let canvasAnimId = null;

  function getAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
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
    } catch (_) {}
  }

  function playCollisionBoom() {
    if (isMuted) return;
    try {
      const ctx = getAudio();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    } catch (_) {}
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
    const count = 70;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        size: Math.random() * 2 + 0.8,
        color: Math.random() > 0.5 ? '#00f076' : '#fbbf24',
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

  function startAnimation(forced = false) {
    clearAllTimers();
    overlay.style.display = 'flex';
    overlay.classList.remove('fusion-completed');

    // Reset streams & reveal
    if (streams) {
      streams.style.opacity = '1';
      streams.style.transform = 'scale(1)';
      streams.style.filter = 'blur(0px)';
    }
    if (singularity) {
      singularity.style.opacity = '0';
    }
    if (reveal) {
      reveal.style.opacity = '0';
      reveal.style.transform = 'translate(-50%, -50%) scale(0.85)';
    }
    if (progressBar) {
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
    }

    initParticleCanvas();

    // Step 1: Initial chime at start
    animationTimers.push(setTimeout(() => {
      playSynthTone(523.25, 'sine', 0.6, 0.1);
    }, 150));

    // Step 2: Streams surge & converge (T = 1.7s)
    animationTimers.push(setTimeout(() => {
      if (streams) {
        streams.style.transition = 'all 0.55s cubic-bezier(0.55, 0.055, 0.675, 0.19)';
        streams.style.transform = 'scale(0.15)';
        streams.style.opacity = '0';
        streams.style.filter = 'blur(10px)';
      }
    }, 1650));

    // Step 3: Singularity Collision Supernova (T = 2.1s)
    animationTimers.push(setTimeout(() => {
      if (singularity) {
        singularity.style.opacity = '1';
        const shock = singularity.querySelector('.singularity-shockwave');
        const flash = singularity.querySelector('.singularity-flash');
        if (shock) {
          shock.style.transition = 'all 0.6s ease-out';
          shock.style.transform = 'translate(-50%, -50%) scale(5)';
          shock.style.opacity = '0';
        }
        if (flash) {
          flash.style.transition = 'all 0.4s ease-out';
          flash.style.opacity = '1';
          flash.style.transform = 'translate(-50%, -50%) scale(3)';
          setTimeout(() => { flash.style.opacity = '0'; }, 350);
        }
      }
      playCollisionBoom();
    }, 2100));

    // Step 4: Manifestation of NEXSHOT Master Brand (T = 2.45s)
    animationTimers.push(setTimeout(() => {
      if (reveal) {
        reveal.style.opacity = '1';
        reveal.style.transform = 'translate(-50%, -50%) scale(1)';
      }
      if (progressBar) {
        progressBar.style.transition = 'width 2.1s linear';
        progressBar.style.width = '100%';
      }
      playMajesticChord();
    }, 2450));

    // Step 5: Smooth exit into Login Screen (T = 4.7s)
    animationTimers.push(setTimeout(() => {
      dismissOverlay();
    }, 4700));
  }

  function dismissOverlay() {
    clearAllTimers();
    overlay.classList.add('fusion-completed');
    try { sessionStorage.setItem('nexshot_fusion_seen', 'true'); } catch (_) {}
    setTimeout(() => {
      overlay.style.display = 'none';
      if (canvasAnimId) cancelAnimationFrame(canvasAnimId);
    }, 700);
  }

  // Event Listeners
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      dismissOverlay();
    });
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', (e) => {
      e.preventDefault();
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

  // Check if previously seen in this session
  let alreadySeen = false;
  try {
    alreadySeen = sessionStorage.getItem('nexshot_fusion_seen') === 'true';
  } catch (_) {}

  if (!alreadySeen) {
    startAnimation(false);
  } else {
    overlay.classList.add('fusion-completed');
    overlay.style.display = 'none';
  }
}
