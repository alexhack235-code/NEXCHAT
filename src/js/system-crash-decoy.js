/**
 * =============================================================================
 * NEXCHAT - SYSTEM CRASH & FIRMWARE UPDATE DECOY MATRIX (v1.0)
 * Global Namespace: window.NexCrashDecoy
 * =============================================================================
 * Capabilities:
 * 1. 4-Finger Tactical Panic Gesture: Touching 4 fingers to the screen triggers
 *    an indistinguishable fake Android Firmware Update screen.
 * 2. Realistic Simulated Telemetry: Progress track crawls incrementally from
 *    14% to 18% with stochastic delays, preventing snoopers from suspecting a fake.
 * 3. Covert Geometric Escape Hatch: 3 rapid taps on the top-right invisible
 *    54x54px corner immediately dissolves the decoy and returns to chat.
 * 4. Global Hotkey Activation: Pressing Ctrl+Alt+K immediately arms the crash decoy.
 *
 * STRICTLY 0 UNICODE EMOJIS: Pure FontAwesome 6 vector glyphs only.
 * PURE WINDOWS CRLF LINE ENDINGS. ES2022 COMPLIANT.
 * =============================================================================
 */

(function (global) {
  'use strict';

  const STORAGE_KEY_ENABLED = 'nex_crash_decoy_enabled';

  class SystemCrashDecoyEngine {
    constructor() {
      this.isCrashEngaged = false;
      this.fourFingerTimer = null;
      this.escapeTapCount = 0;
      this.escapeTapTimer = null;
      this.progressTicker = null;
      this.currentPercent = 14;
      this._hasBoundEvents = false;

      this.init();
    }

    init() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    isEnabled() {
      try {
        return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
      } catch (_) {
        return false;
      }
    }

    setEnabled(enabled) {
      try {
        localStorage.setItem(STORAGE_KEY_ENABLED, enabled ? 'true' : 'false');
      } catch (_) {}
    }

    bindDOM() {
      if (this._hasBoundEvents) return;
      this._hasBoundEvents = true;

      // 1. 4-Finger Touch Detector
      window.addEventListener('touchstart', (e) => {
        if (!this.isEnabled()) return;
        if (e.touches && e.touches.length === 4) {
          this.fourFingerTimer = setTimeout(() => {
            this.engageCrashDecoy();
          }, 380);
        }
      }, { passive: true });

      window.addEventListener('touchend', () => {
        if (this.fourFingerTimer) {
          clearTimeout(this.fourFingerTimer);
          this.fourFingerTimer = null;
        }
      }, { passive: true });

      // 2. Secret Escape Hatch (Top-right corner hotspot)
      const escapeZone = document.getElementById('crashSecretEscapeZone');
      if (escapeZone) {
        escapeZone.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleEscapeTap();
        });
        escapeZone.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleEscapeTap();
        }, { passive: false });
      }

      // 3. Header Crash Button
      const bindBtn = (id) => {
        const btn = document.getElementById(id);
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.engageCrashDecoy();
          });
        }
      };
      bindBtn('systemCrashPanicBtnHeader');
      bindBtn('systemCrashPanicBtnTop');

      // 4. Global Hotkey: Ctrl + Alt + K
      window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.code === 'KeyK') {
          if (!this.isEnabled()) return;
          e.preventDefault();
          if (this.isCrashEngaged) {
            this.disengageCrashDecoy();
          } else {
            this.engageCrashDecoy();
          }
        }
      });
    }

    engageCrashDecoy(force = false) {
      if (!force && !this.isEnabled()) return;
      if (this.isCrashEngaged) return;
      this.isCrashEngaged = true;

      const overlay = document.getElementById('systemCrashDecoyOverlay');
      if (overlay) {
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
      }

      // Enter fullscreen if supported
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (_) {}

      this.currentPercent = 14;
      this.updateProgressUI();

      // Start realistic crawl
      if (this.progressTicker) clearInterval(this.progressTicker);
      this.progressTicker = setInterval(() => {
        if (this.currentPercent < 98) {
          // Stochastic increment: +1% or +2% every 9-16 seconds
          this.currentPercent += Math.floor(Math.random() * 2) + 1;
          this.updateProgressUI();
        }
      }, 11000);
    }

    disengageCrashDecoy() {
      if (!this.isCrashEngaged) return;

      const overlay = document.getElementById('systemCrashDecoyOverlay');
      if (overlay) {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
      }

      if (this.progressTicker) {
        clearInterval(this.progressTicker);
        this.progressTicker = null;
      }

      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (_) {}

      this.isCrashEngaged = false;
      this.escapeTapCount = 0;

      if (typeof window.safeShowNotification === 'function') {
        window.safeShowNotification('System crash decoy disengaged', 'info');
      }
    }

    handleEscapeTap() {
      this.escapeTapCount++;
      clearTimeout(this.escapeTapTimer);
      this.escapeTapTimer = setTimeout(() => {
        this.escapeTapCount = 0;
      }, 1200);

      if (this.escapeTapCount >= 3) {
        this.escapeTapCount = 0;
        this.disengageCrashDecoy();
      }
    }

    updateProgressUI() {
      const bar = document.getElementById('androidProgressBar');
      const label = document.getElementById('androidProgressPercent');

      if (bar) bar.style.width = `${this.currentPercent}%`;
      if (label) label.textContent = `${this.currentPercent}%`;
    }
  }

  // Attach Singleton instance
  global.NexCrashDecoy = new SystemCrashDecoyEngine();

})(typeof window !== 'undefined' ? window : this);
