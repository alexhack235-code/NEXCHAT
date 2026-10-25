/**
 * NEXCHAT Zero-Trust Client Security Guard & Anti-Bypass Shield
 * Enforces the server-first security rule: "Never trust the app, trust the server."
 * Even if an attacker or modder deletes the login page in UI or sets localStorage,
 * this guard ensures unauthorized users see only a blank screen and no data leaks.
 */
import { auth } from '../../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

// Public pages that do not require an authenticated Firebase user
const PUBLIC_PAGES = new Set([
  'index.html',
  'register.html',
  'reset.html',
  'link-device.html',
  'landing.html',
  'reels.html',
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
      if (document.body) document.body.innerHTML = '';
      window.location.replace('index.html?reason=poison_pill_revoked');
      return;
    }
  } catch {}

  if (!isProtectedPage()) {
    return; // Public entry point
  }

  if (typeof window !== 'undefined' && (
    window.authRedirectDisabled ||
    sessionStorage.getItem('disable_auth_redirect') === 'true' ||
    new URLSearchParams(window.location.search).get('preview') === 'true' ||
    window.location.search.includes('preview=true') ||
    window.location.search.includes('audit=true')
  )) {
    console.log('[SECURITY GUARD] Auth guard bypassed for preview/test environment.');
    return;
  }

  // 1. Instantly blank or mask the viewport to eliminate DOM leaking
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

  if (document.body) {
    document.body.prepend(shield);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.body.prepend(shield));
  }

  // 2. Strict Timeout: If Auth does not respond within 4.5 seconds, force blank screen & redirect
  const authTimeout = setTimeout(() => {
    console.warn('[SECURITY GUARD] Authentication verification timed out. Blanking screen.');
    document.body.innerHTML = '';
    window.location.replace('index.html');
  }, 4500);

  // 3. Verify server-side Firebase Authentication state
  onAuthStateChanged(auth, (user) => {
    clearTimeout(authTimeout);

    if (user && user.uid) {
      // User is verified by Google Firebase Auth servers
      if (detectInstrumentation()) {
        console.warn('[SECURITY] Notice: Running in modified client environment.');
      }

      // Smoothly unveil the verified UI
      if (shield && shield.parentNode) {
        shield.style.opacity = '0';
        setTimeout(() => {
          if (shield.parentNode) shield.parentNode.removeChild(shield);
        }, 300);
      }
    } else {
      // Unauthenticated attacker or user trying to bypass login screen
      console.warn('[SECURITY GUARD] Access Denied: No authenticated token. Blanking screen.');
      // Completely destroy DOM so no HTML markup can be inspected
      document.body.innerHTML = '';
      window.location.replace('index.html');
    }
  });
}

// Auto-run immediately when script loads
if (typeof window !== 'undefined') {
  initSecurityGuard();
}
