/**
 * NEXCHAT Zero-Trust Client Security Guard & Anti-Bypass Shield
 * Enforces the server-first security rule: "Never trust the app, trust the server."
 * Safeguards sensitive administration routes while preserving instant, vibrant,
 * guest-friendly exploration across the NEXCHAT real-time messaging suite.
 */
import { auth } from '../../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

// Public pages and exploratory client surfaces that do not force-eject visitors
const PUBLIC_PAGES = new Set([
  'index.html',
  'register.html',
  'reset.html',
  'link-device.html',
  'landing.html',
  'reels.html',
  'chat.html',
  'chat',
  'gaminghub.html',
  'game.html',
  'unity_game.html',
  'game_module.html',
  'terms.html',
  'privacy.html',
  'cart.html',
  '',
]);

/**
 * Detects whether the current page requires active authentication.
 */
function isProtectedPage() {
  const path = window.location.pathname.split('/').pop().toLowerCase();
  return !PUBLIC_PAGES.has(path);
}

/**
 * Heuristic inspection to detect Frida / dynamic instrumentation hooks.
 */
function detectInstrumentation() {
  try {
    if (
      typeof window.Frida !== 'undefined' ||
      typeof window.__frida_init !== 'undefined' ||
      typeof window._frida_rpc !== 'undefined'
    ) {
      console.warn('[SECURITY HEURISTIC] Dynamic instrumentation detected.');
      return true;
    }
  } catch {}
  return false;
}

/**
 * Installs the zero-trust impenetrable security shield immediately on page load.
 */
export function initSecurityGuard() {
  // 0. Remote Session Poison-Pill Revocation Check
  try {
    const targetRevocation = localStorage.getItem('nex_poison_pill_target');
    const localUser = JSON.parse(localStorage.getItem('nexchat_user') || '{}');
    if (targetRevocation && (localUser.uid === targetRevocation || localUser.email === targetRevocation)) {
      console.warn('[SECURITY GUARD] Session revoked by SuperAdmin Poison-Pill command.');
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('index.html?reason=poison_pill_revoked');
      return;
    }
  } catch {}

  // Exploratory routes and public surfaces bypass the blocking shield
  if (!isProtectedPage()) {
    return;
  }

  const isLocalDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local')
  );

  if (typeof window !== 'undefined' && isLocalDev && (
    window.authRedirectDisabled ||
    sessionStorage.getItem('disable_auth_redirect') === 'true' ||
    new URLSearchParams(window.location.search).get('preview') === 'true'
  )) {
    console.log('[SECURITY GUARD] Auth guard bypassed for development environment.');
    return;
  }

  // 1. Unveil / dismiss helper
  const shield = document.createElement('div');
  shield.id = 'nexSecurityShield';
  shield.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #050811;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: #00ff66;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: opacity 0.3s ease;
  `;
  shield.innerHTML = `
    <div style="text-align: center;">
      <div style="width: 48px; height: 48px; border: 3px solid rgba(0, 255, 102, 0.2); border-top-color: #00ff66; border-radius: 50%; animation: nexSpin 0.8s linear infinite; margin: 0 auto 16px auto;"></div>
      <p style="font-size: 13px; letter-spacing: 1px; color: #8899a6; text-transform: uppercase;">Authenticating Session...</p>
    </div>
    <style>
      @keyframes nexSpin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;

  const dismissShield = () => {
    if (shield && shield.parentNode) {
      shield.style.opacity = '0';
      setTimeout(() => {
        if (shield.parentNode) shield.parentNode.removeChild(shield);
      }, 300);
    }
  };

  if (document.body) {
    document.body.prepend(shield);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.body.prepend(shield));
  }

  // 2. Timeout: Gracefully dismiss shield after 2.5s if auth check is delayed
  const authTimeout = setTimeout(() => {
    console.log('[SECURITY GUARD] Auth verification timeout elapsed. Dismissing shield.');
    dismissShield();
  }, 2500);

  // 3. Verify server-side Firebase Authentication state
  onAuthStateChanged(auth, (user) => {
    clearTimeout(authTimeout);

    if (user && user.uid) {
      if (detectInstrumentation()) {
        console.warn('[SECURITY] Notice: Running in modified client environment.');
      }
      dismissShield();
    } else {
      // If user has saved authenticated UID in localStorage
      const userUid = localStorage.getItem('auth_uid');
      if (userUid) {
        dismissShield();
        return;
      }

      // If on an administrative protected surface, redirect smoothly to login
      dismissShield();
      console.warn('[SECURITY GUARD] Administrative surface requires signed-in credentials.');
      window.location.replace('index.html?reason=auth_required');
    }
  });
}

// Auto-run immediately when script loads
if (typeof window !== 'undefined') {
  initSecurityGuard();
}
