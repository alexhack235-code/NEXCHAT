/**
 * =============================================================================
 * NEXCHAT - AEGIS-SPECTRE ANTI-SHOULDER SURFING PRIVACY SHIELD ENGINE (v2.6)
 * Global Namespace: window.NexAegisShield
 * =============================================================================
 * Capabilities:
 * 1. 1-Click & Hotkey (Ctrl+Shift+P) Anti-Shoulder Surfing Frosted Obfuscation
 * 2. Tactical Single-Bubble Hover & Touch-Hold Spotlighting (0ms Instant Unblur)
 * 3. Mobile Touch Sentinel with Automatic 800ms Recloak Timer
 * 4. Window Blur Auto-Sanitizer (Locks Max Blur on Tab / Window Focus Loss)
 * 5. Silent Ghost Message Recall & Zero-Tombstone DOM Box Collapse Engine
 *
 * STRICTLY 0 UNICODE EMOJIS: Pure FontAwesome 6 vector glyphs only.
 * PURE WINDOWS CRLF LINE ENDINGS. ES2022 COMPLIANT.
 * =============================================================================
 */

(function (global) {
  'use strict';

  class NexAegisPrivacyShieldEngine {
    constructor() {
      this.isActive = false;
      this.hudEl = null;
      this.touchRecloakTimer = null;
      this.init();
    }

    init() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bootEngine());
      } else {
        this.bootEngine();
      }
    }

    bootEngine() {
      // 1. Restore User Preference (100% Opt-In, Default False)
      const savedState = localStorage.getItem('nex_aegis_privacy_active');
      this.isActive = savedState === 'true';

      // 2. Inject visual glow/badge styles + Setup DOM Listeners & Keyboard Shortcuts
      this.injectBadgeStyles();
      this.bindDOM();
      this.bindKeyboardShortcuts();
      this.bindTouchListeners();
      this.bindWindowFocusGuard();

      // 3. Apply Initial State
      this.applyState(this.isActive, false);

      console.log('[NEX-AEGIS] Anti-Shoulder Surfing Privacy Shield initialized. State:', this.isActive ? 'ACTIVE' : 'STANDBY');
    }

    injectBadgeStyles() {
      if (document.getElementById('nexAegisToggleBadgeStyles')) return;
      const style = document.createElement('style');
      style.id = 'nexAegisToggleBadgeStyles';
      style.textContent = `
        #aegisPrivacyShieldBtn.aegis-active,
        #aegisPrivacyBtnMobile.aegis-active,
        .aegis-privacy-toggle-btn.aegis-active {
          color: #00f3ff !important;
          border-color: rgba(0, 243, 255, 0.72) !important;
          background: rgba(0, 243, 255, 0.16) !important;
          box-shadow: 0 0 14px rgba(0, 243, 255, 0.42), inset 0 0 8px rgba(0, 243, 255, 0.2) !important;
          position: relative;
        }
        .aegis-state-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 5px;
          padding: 1px 5px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          background: rgba(0, 243, 255, 0.2);
          border: 1px solid rgba(0, 243, 255, 0.7);
          color: #00f3ff;
          line-height: 1.2;
          pointer-events: none;
        }
        #aegisPrivacyBtnMobile .aegis-state-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          margin-left: 0;
          padding: 0 4px;
          font-size: 8px;
        }
        .aegis-state-badge[data-state="off"] {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    bindDOM() {
      const bindBtn = (btn) => {
        if (!btn || btn.dataset.aegisBound === '1') return;
        btn.dataset.aegisBound = '1';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleShield();
        });
      };

      bindBtn(document.getElementById('aegisPrivacyShieldBtn'));
      bindBtn(document.getElementById('aegisPrivacyBtnMobile'));
      document.querySelectorAll('.aegis-privacy-toggle-btn').forEach(bindBtn);
    }

    bindKeyboardShortcuts() {
      window.addEventListener('keydown', (e) => {
        // Ctrl+Shift+P or Cmd+Shift+P
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
          e.preventDefault();
          this.toggleShield();
        }
      });
    }

    bindTouchListeners() {
      // Mobile touch-and-hold to inspect a message bubble
      document.addEventListener('touchstart', (e) => {
        if (!this.isActive) return;
        const bubble = e.target.closest('.message-bubble');
        if (bubble) {
          if (this.touchRecloakTimer) {
            clearTimeout(this.touchRecloakTimer);
            this.touchRecloakTimer = null;
          }
          // Remove previous revealed bubbles
          document.querySelectorAll('.aegis-touch-revealed').forEach(el => el.classList.remove('aegis-touch-revealed'));
          bubble.classList.add('aegis-touch-revealed');
        }
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        if (!this.isActive) return;
        const bubble = e.target.closest('.message-bubble');
        if (bubble) {
          this.touchRecloakTimer = setTimeout(() => {
            bubble.classList.remove('aegis-touch-revealed');
          }, 850);
        }
      }, { passive: true });
    }

    bindWindowFocusGuard() {
      // If user switches away or windows loses focus, immediately snap any revealed bubble back to cloak
      window.addEventListener('blur', () => {
        if (this.isActive) {
          document.querySelectorAll('.aegis-touch-revealed').forEach(el => el.classList.remove('aegis-touch-revealed'));
        }
      });
    }

    toggleShield(forceState) {
      const nextState = forceState !== undefined ? Boolean(forceState) : !this.isActive;
      this.applyState(nextState, true);
    }

    applyState(active, showToast) {
      this.isActive = active;
      localStorage.setItem('nex_aegis_privacy_active', active ? 'true' : 'false');

      if (active) {
        document.body.classList.add('aegis-shield-active');
        this.mountHud();
      } else {
        document.body.classList.remove('aegis-shield-active');
        this.dismountHud();
        document.querySelectorAll('.aegis-touch-revealed').forEach(el => el.classList.remove('aegis-touch-revealed'));
      }

      // Sync UI across desktop, mobile, and auxiliary Aegis toggle controls
      this.syncTriggerButtons(active);

      try {
        window.dispatchEvent(new CustomEvent('nex:aegis:state_change', { detail: { active } }));
      } catch (_) { }

      if (showToast) {
        this.showStatusToast(active);
      }
    }

    syncTriggerButtons(active) {
      const triggers = new Set([
        document.getElementById('aegisPrivacyShieldBtn'),
        document.getElementById('aegisPrivacyBtnMobile'),
        ...document.querySelectorAll('.aegis-privacy-toggle-btn')
      ]);

      triggers.forEach((btn) => {
        if (!btn) return;
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.setAttribute('data-aegis-active', active ? 'true' : 'false');
        btn.classList.toggle('active', active);
        btn.classList.toggle('aegis-active', active);
        btn.setAttribute(
          'title',
          active
            ? 'Aegis Privacy Shield: ON (Anti-Shoulder Surfing Blur Engaged)'
            : 'Aegis Privacy Shield: OFF (Ctrl+Shift+P)'
        );
        if (btn.id === 'aegisPrivacyBtnMobile') {
          btn.style.color = active ? '#00f3ff' : '';
        }

        let badge = btn.querySelector('.aegis-state-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'aegis-state-badge';
          badge.setAttribute('aria-hidden', 'true');
          btn.appendChild(badge);
        }
        badge.setAttribute('data-state', active ? 'on' : 'off');
        badge.textContent = active ? 'ON' : '';
      });
    }

    showStatusToast(active) {
      const plainText = active ? 'Aegis Privacy Shield ON' : 'Aegis Privacy Shield OFF';
      if (typeof window.showNotif === 'function') {
        window.showNotif(plainText, active ? 'success' : 'info', 2500);
        return;
      }
      if (typeof window.showCustomNotification === 'function') {
        const htmlMsg = active
          ? '<i class="fa-solid fa-user-secret" style="color:#00f3ff;margin-right:6px;"></i> Aegis Privacy Shield ON (Hover or Hold to Reveal)'
          : '<i class="fa-solid fa-shield-halved" style="color:#94a3b8;margin-right:6px;"></i> Aegis Privacy Shield OFF';
        window.showCustomNotification(htmlMsg, 2600);
        return;
      }
      let toast = document.getElementById('nexAegisInlineToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'nexAegisInlineToast';
        toast.style.cssText = 'position:fixed;bottom:84px;left:50%;transform:translateX(-50%);z-index:2147483000;background:rgba(15,23,42,0.95);color:#f8fafc;border:1px solid rgba(0,243,255,0.5);border-radius:999px;padding:8px 16px;font-size:12.5px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.45);pointer-events:none;transition:opacity 0.2s ease;';
        document.body.appendChild(toast);
      }
      toast.textContent = plainText;
      toast.style.opacity = '1';
      clearTimeout(this._inlineToastTimer);
      this._inlineToastTimer = setTimeout(() => {
        if (toast) toast.style.opacity = '0';
      }, 2400);
    }

    mountHud() {
      if (this.hudEl && document.body.contains(this.hudEl)) return;

      const container = document.getElementById('messages-container') || document.getElementById('chat-messages') || document.querySelector('.messages-section');
      if (!container) return;

      let existingHud = document.getElementById('aegisPrivacyHud');
      if (!existingHud) {
        existingHud = document.createElement('div');
        existingHud.id = 'aegisPrivacyHud';
        existingHud.className = 'aegis-privacy-hud';
        existingHud.innerHTML = '<span class="aegis-hud-beacon"></span><i class="fa-solid fa-user-secret"></i> <span>AEGIS SHIELD ACTIVE • HOVER OR HOLD TO REVEAL</span>';
        existingHud.onclick = () => this.toggleShield(false);
        existingHud.title = 'Click to disengage Aegis Shield';
        container.prepend(existingHud);
      }
      this.hudEl = existingHud;
    }

    dismountHud() {
      const hud = document.getElementById('aegisPrivacyHud');
      if (hud) hud.remove();
      this.hudEl = null;
    }

    /**
     * SILENT GHOST MESSAGE RECALL ENGINE (Zero-Tombstone Disappearance)
     * Completely eradicates a message from DOM and cache without leaving "This message was deleted"
     */
    async executeSilentGhostRecall(messageId) {
      if (!messageId) return { success: false, error: 'Missing messageId' };

      // 1. Locate DOM element
      const selector = `[data-message-id="${messageId}"], [data-doc-id="${messageId}"], [id="msg-${messageId}"]`;
      const messageWrapper = document.querySelector(selector) || document.querySelector(`.message-wrapper:has([data-id="${messageId}"])`);

      // 2. Animate Seamless DOM Collapse
      if (messageWrapper) {
        messageWrapper.classList.add('ghost-recalled-collapse');
        setTimeout(() => {
          messageWrapper.remove();
        }, 360);
      }

      // 3. Purge from in-memory and local session cache
      try {
        const currentUID = window.currentUser?.uid || window.myUID;
        const currentPeer = window.currentChatUser;
        if (typeof window.getCachedDirectChatMessages === 'function' && typeof window.cacheDirectChatMessages === 'function' && currentUID && currentPeer) {
          const cached = window.getCachedDirectChatMessages(currentUID, currentPeer, 3600000) || [];
          const filtered = cached.filter(m => m.id !== messageId && m.docId !== messageId && m.clientMsgId !== messageId);
          window.cacheDirectChatMessages(currentUID, currentPeer, filtered);
        }
      } catch (err) {
        console.warn('[NEX-AEGIS] Cache purge warning:', err);
      }

      console.log(`[NEX-AEGIS] Silent Ghost Purge completed for message: ${messageId}`);
      return { success: true, messageId };
    }
  }

  // Export Singleton to global scope
  global.NexAegisShield = new NexAegisPrivacyShieldEngine();

})(typeof window !== 'undefined' ? window : globalThis);
