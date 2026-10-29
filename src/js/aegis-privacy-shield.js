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

      // 2. Setup DOM Listeners & Keyboard Shortcuts
      this.bindDOM();
      this.bindKeyboardShortcuts();
      this.bindTouchListeners();
      this.bindWindowFocusGuard();

      // 3. Apply Initial State
      this.applyState(this.isActive, false);

      console.log('[NEX-AEGIS] Anti-Shoulder Surfing Privacy Shield initialized. State:', this.isActive ? 'ACTIVE' : 'STANDBY');
    }

    bindDOM() {
      // Desktop Header Button
      const desktopBtn = document.getElementById('aegisPrivacyShieldBtn');
      if (desktopBtn) {
        desktopBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleShield();
        });
      }

      // Mobile Header Action Button
      const mobileBtn = document.getElementById('aegisPrivacyBtnMobile');
      if (mobileBtn) {
        mobileBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleShield();
        });
      }
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

      // Update Desktop Button UI
      const desktopBtn = document.getElementById('aegisPrivacyShieldBtn');
      if (desktopBtn) {
        desktopBtn.setAttribute('data-aegis-active', active ? 'true' : 'false');
        desktopBtn.setAttribute('title', active ? 'Aegis Privacy Shield: ACTIVE (Anti-Shoulder Surfing Blur Engaged)' : 'Aegis Privacy Shield: STANDBY (Ctrl+Shift+P)');
      }

      // Update Mobile Button UI
      const mobileBtn = document.getElementById('aegisPrivacyBtnMobile');
      if (mobileBtn) {
        mobileBtn.setAttribute('data-aegis-active', active ? 'true' : 'false');
        mobileBtn.style.color = active ? '#00f3ff' : '';
      }

      if (showToast && typeof window.showCustomNotification === 'function') {
        const msg = active 
          ? '<i class="fa-solid fa-user-secret" style="color:#00f3ff;margin-right:6px;"></i> Aegis Privacy Shield Engaged (Hover or Touch to Reveal)'
          : '<i class="fa-solid fa-shield-halved" style="color:#94a3b8;margin-right:6px;"></i> Aegis Privacy Shield Disengaged';
        window.showCustomNotification(msg, 2800);
      }
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
        existingHud.innerHTML = '<span class="aegis-hud-beacon"></span><i class="fa-solid fa-user-secret"></i> <span>AEGIS SHIELD ACTIVE &bull; HOVER OR HOLD TO REVEAL</span>';
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

})(typeof window !== 'undefined' ? window : this);
