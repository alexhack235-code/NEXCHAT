/**
 * =============================================================================
 * NEXCHAT - CHAT VANISH & SECRET SCREEN TAP REVEAL ENGINE (v1.0)
 * Global Namespace: window.NexChatVanish
 * =============================================================================
 * Capabilities:
 * 1. Zero-Footprint Chat Evaporation: Designated chats completely vanish from
 *    the conversation feed, contact list, and search results.
 * 2. Secret Multi-Tap Screen Gesture Detection: Rapid taps (configurable: 2-7 taps)
 *    on the app brand header, background, or screen activate the reveal sequence.
 * 3. Stealth Cryptographic Gate: Optional 4-digit code verification before unveiling.
 * 4. Active Stealth Session Pill: Discreet floating status halo with live countdown
 *    and instant 1-tap "Vanish Now" trigger.
 * 5. Auto-Re-Vanish Inactivity Guardian: Automatically vaporizes conversations
 *    after configured idle timeout (1, 2, 5, or 10 minutes) or window blur.
 *
 * STRICTLY 0 UNICODE EMOJIS: Pure FontAwesome 6 vector glyphs only.
 * PURE WINDOWS CRLF LINE ENDINGS. ES2022 COMPLIANT.
 * =============================================================================
 */

(function (global) {
  'use strict';

  const STORAGE_KEY_ENABLED = 'nex_chat_vanish_enabled';
  const STORAGE_KEY_CHATS = 'nex_vanished_chats';
  const STORAGE_KEY_TAP_COUNT = 'nex_vanish_tap_count';
  const STORAGE_KEY_TAP_TARGET = 'nex_vanish_tap_target';
  const STORAGE_KEY_REQUIRE_PIN = 'nex_vanish_require_pin';
  const STORAGE_KEY_TIMEOUT = 'nex_vanish_auto_timeout';
  const STORAGE_KEY_TRIGGER_METHOD = 'nex_vanish_trigger_method';
  const STORAGE_KEY_FLIP_PANIC = 'nex_vanish_flip_panic';

  const DEFAULT_TRIGGER_METHOD = 'hybrid'; // 'hybrid' | 'shake' | 'twoFinger' | 'tap' | 'hold'

  const DEFAULT_TAP_COUNT = 3;
  const DEFAULT_TAP_TARGET = 'header';
  const DEFAULT_TIMEOUT_MINS = 2;
  const TAP_WINDOW_MS = 1400; // Sliding window for multi-tap detection

  class ChatVanishEngine {
    constructor() {
      this.vanishedChatIds = new Set();
      this.isStealthRevealed = false;
      this.tapHistory = [];
      this.currentPinInput = '';
      this._countdownInterval = null;
      this._remainingSeconds = 0;
      this._hasBoundEvents = false;
      this._keyboardHandler = null;

      this.init();
    }

    init() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      this.loadVanishedChats();

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    loadVanishedChats() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_CHATS);
        if (stored) {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr)) {
            this.vanishedChatIds = new Set(arr);
          }
        }
      } catch (_) {}
    }

    saveVanishedChats() {
      try {
        localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(Array.from(this.vanishedChatIds)));
        this.updateBadgeCounts();
      } catch (_) {}
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

      if (!enabled && this.isStealthRevealed) {
        this.concealChats();
      }

      this.notifyStateChanged();
      if (typeof window.loadContacts === 'function') {
        window.loadContacts();
      }
    }

    getTapCount() {
      try {
        const count = parseInt(localStorage.getItem(STORAGE_KEY_TAP_COUNT), 10);
        return isNaN(count) || count < 2 || count > 10 ? DEFAULT_TAP_COUNT : count;
      } catch (_) {
        return DEFAULT_TAP_COUNT;
      }
    }

    setTapCount(count) {
      try {
        const num = Math.max(2, Math.min(10, parseInt(count, 10) || DEFAULT_TAP_COUNT));
        localStorage.setItem(STORAGE_KEY_TAP_COUNT, String(num));
      } catch (_) {}
    }

    getTapTarget() {
      try {
        return localStorage.getItem(STORAGE_KEY_TAP_TARGET) || DEFAULT_TAP_TARGET;
      } catch (_) {
        return DEFAULT_TAP_TARGET;
      }
    }

    setTapTarget(target) {
      try {
        localStorage.setItem(STORAGE_KEY_TAP_TARGET, target || DEFAULT_TAP_TARGET);
      } catch (_) {}
    }

    isRequirePin() {
      try {
        return localStorage.getItem(STORAGE_KEY_REQUIRE_PIN) !== 'false';
      } catch (_) {
        return true;
      }
    }

    setRequirePin(require) {
      try {
        localStorage.setItem(STORAGE_KEY_REQUIRE_PIN, require ? 'true' : 'false');
      } catch (_) {}
    }

    getAutoTimeoutMins() {
      try {
        const t = parseInt(localStorage.getItem(STORAGE_KEY_TIMEOUT), 10);
        return isNaN(t) || t < 1 ? DEFAULT_TIMEOUT_MINS : t;
      } catch (_) {
        return DEFAULT_TIMEOUT_MINS;
      }
    }

    setAutoTimeoutMins(mins) {
      try {
        const num = Math.max(1, parseInt(mins, 10) || DEFAULT_TIMEOUT_MINS);
        localStorage.setItem(STORAGE_KEY_TIMEOUT, String(num));
      } catch (_) {}
    }

    isChatVanished(chatId) {
      if (!chatId) return false;
      return this.vanishedChatIds.has(chatId);
    }

    vanishChat(chatId) {
      if (!chatId) return;
      this.vanishedChatIds.add(chatId);
      this.saveVanishedChats();

      // If this conversation is currently open and we are not in stealth reveal session, close it immediately
      if (!this.isStealthRevealed && window.currentChatUser === chatId) {
        if (typeof window.showChatListView === 'function') {
          window.showChatListView();
        } else if (typeof window.closeChat === 'function') {
          window.closeChat();
        }
      }

      this.notifyStateChanged();
      if (typeof window.loadContacts === 'function') {
        window.loadContacts();
      }

      if (typeof window.safeShowNotification === 'function') {
        window.safeShowNotification('Conversation vanished from feed', 'info');
      }
    }

    unvanishChat(chatId) {
      if (!chatId) return;
      this.vanishedChatIds.delete(chatId);
      this.saveVanishedChats();

      this.notifyStateChanged();
      if (typeof window.loadContacts === 'function') {
        window.loadContacts();
      }

      if (typeof window.safeShowNotification === 'function') {
        window.safeShowNotification('Conversation restored to feed', 'success');
      }
    }

    getVanishedChatsForFilter() {
      // If feature disabled OR stealth mode currently active/revealed, do not filter out vanished chats
      if (!this.isEnabled() || this.isStealthRevealed) {
        return [];
      }
      return Array.from(this.vanishedChatIds);
    }

    bindDOM() {
      if (this._hasBoundEvents) return;
      this._hasBoundEvents = true;

      // 1. Bind global pointer / click listener for secret tap detection
      document.addEventListener('pointerdown', (e) => this.handlePointerTap(e), { passive: true });

      // 2. Bind Stealth Banner "Vanish Now" button
      const vanishNowBtn = document.getElementById('btnVanishNow');
      if (vanishNowBtn) {
        vanishNowBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.concealChats();
        });
      }

      // 3. Bind PIN Modal Keypad
      const pinModal = document.getElementById('vanishSecretPinModal');
      if (pinModal) {
        pinModal.querySelectorAll('.vanish-keypad-btn[data-digit]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const digit = btn.getAttribute('data-digit');
            if (digit) this.handlePinDigit(digit);
          });
        });

        pinModal.querySelector('#btnVanishPinBackspace')?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.currentPinInput.length > 0) {
            this.currentPinInput = this.currentPinInput.slice(0, -1);
            this.updatePinDotsUI();
          }
        });

        pinModal.querySelector('#closeVanishPinBtn')?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.closePinModal();
        });
      }

      // 4. Bind Management Modal
      const manageModal = document.getElementById('vanishManagementModal');
      if (manageModal) {
        manageModal.querySelector('#closeVanishManageBtn')?.addEventListener('click', () => {
          this.closeManagementModal();
        });
      }

      const openManageBtn = document.getElementById('btnManageVanishedChats');
      if (openManageBtn) {
        openManageBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.openManagementModal();
        });
      }

      const testGestureBtn = document.getElementById('btnTestVanishGesture');
      if (testGestureBtn) {
        testGestureBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.testTapGesture();
        });
      }

      // 5. Visibility change guardian: re-vanish when switching app / tabs
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.isStealthRevealed) {
          this.concealChats();
        }
      });

      this.updateBadgeCounts();
    }

    handlePointerTap(e) {
      if (!this.isEnabled()) return;
      const method = this.getTriggerMethod();
      if (method !== 'hybrid' && method !== 'tap') return;

      // If PIN modal or management modal is currently active, ignore taps
      const pinModal = document.getElementById('vanishSecretPinModal');
      if (pinModal && pinModal.classList.contains('active')) return;
      const manageModal = document.getElementById('vanishManagementModal');
      if (manageModal && manageModal.classList.contains('active')) return;

      const target = e.target;
      if (!target) return;

      // Do not trigger if typing in inputs or buttons
      const tagName = target.tagName ? target.tagName.toLowerCase() : '';
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return;

      const tapZone = this.getTapTarget();
      let isMatch = false;

      if (tapZone === 'anywhere') {
        isMatch = true;
      } else if (tapZone === 'header') {
        isMatch = Boolean(
          target.closest('#chatHeader') ||
          target.closest('.app-header') ||
          target.closest('.chat-brand') ||
          target.closest('.chat-list-header') ||
          target.closest('.chat-header') ||
          target.closest('.sidebar-header') ||
          target.closest('.nav-brand')
        );
      } else if (tapZone === 'emptySpace') {
        isMatch = Boolean(
          target.id === 'messages-area' ||
          target.classList.contains('messages-container') ||
          target.classList.contains('chat-list-container') ||
          target.classList.contains('empty-chat-placeholder') ||
          target.classList.contains('app-container')
        );
      }

      if (!isMatch) return;

      const now = Date.now();
      this.tapHistory.push(now);

      // Prune taps older than TAP_WINDOW_MS
      this.tapHistory = this.tapHistory.filter(t => now - t <= TAP_WINDOW_MS);

      const requiredTaps = this.getTapCount();
      if (this.tapHistory.length >= requiredTaps) {
        this.tapHistory = [];
        this.triggerRevealSequence();
      }
    }

    handleDeviceMotion(event) {
      if (!this.isEnabled()) return;
      const method = this.getTriggerMethod();
      if (method !== 'hybrid' && method !== 'shake') return;

      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;

      const curX = acc.x || 0;
      const curY = acc.y || 0;
      const curZ = acc.z || 0;

      if (this._lastAccel.x !== null) {
        const deltaX = Math.abs(curX - this._lastAccel.x);
        const deltaY = Math.abs(curY - this._lastAccel.y);
        const deltaZ = Math.abs(curZ - this._lastAccel.z);
        const deltaSpeed = deltaX + deltaY + deltaZ;

        // Shake threshold: 19 m/s^2 delta
        if (deltaSpeed > 19) {
          const now = Date.now();
          if (now - this._lastShakeTime > 220) {
            this._shakeCount++;
            this._lastShakeTime = now;

            // If already revealed: an emergency 2-shake triggers immediate panic conceal!
            if (this.isStealthRevealed && this._shakeCount >= 2) {
              this._shakeCount = 0;
              this.concealChats();
              return;
            }

            // If not revealed: 3 continuous shakes trigger reveal sequence!
            if (this._shakeCount >= 3) {
              this._shakeCount = 0;
              if (!this.isStealthRevealed) {
                this.triggerRevealSequence();
              }
            }
          }
        }
      }

      this._lastAccel = { x: curX, y: curY, z: curZ };

      // Decay shake count if idle for > 1400ms
      if (Date.now() - this._lastShakeTime > 1400) {
        this._shakeCount = 0;
      }
    }

    handleDeviceOrientation(event) {
      if (!this.isEnabled() || !this.isStealthRevealed || !this.isFlipPanicEnabled()) return;

      const beta = event.beta;
      const gamma = event.gamma;

      // Face-down phone orientation: beta > 155 or beta < -155, or gamma rolled flat
      if (beta !== null && (Math.abs(beta) > 155 || Math.abs(gamma) > 80)) {
        this.concealChats();
      }
    }

    handleTouchStart(e) {
      if (!this.isEnabled()) return;
      const method = this.getTriggerMethod();
      if (method !== 'hybrid' && method !== 'twoFinger') return;

      if (e.touches && e.touches.length === 2) {
        this._twoFingerStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        this._twoFingerStartTime = Date.now();
      } else {
        this._twoFingerStartY = null;
      }
    }

    handleTouchEnd(e) {
      if (!this.isEnabled() || this._twoFingerStartY === null) return;
      const method = this.getTriggerMethod();
      if (method !== 'hybrid' && method !== 'twoFinger') return;

      if (e.changedTouches && e.changedTouches.length >= 1) {
        const endY = e.changedTouches[0].clientY;
        const deltaY = endY - this._twoFingerStartY;
        const duration = Date.now() - this._twoFingerStartTime;

        // Two fingers dragged downwards by at least 65px within 700ms
        if (deltaY > 65 && duration < 700) {
          this._twoFingerStartY = null;
          this.triggerRevealSequence();
        }
      }
    }

    handlePointerHoldStart(e) {
      if (!this.isEnabled()) return;
      const method = this.getTriggerMethod();
      if (method !== 'hybrid' && method !== 'hold') return;

      const target = e.target;
      if (!target) return;

      const isBrandTarget = Boolean(
        target.closest('#chatHeader') ||
        target.closest('.app-header') ||
        target.closest('.chat-brand') ||
        target.closest('.nav-brand')
      );

      if (!isBrandTarget) return;

      this._holdTimer = setTimeout(() => {
        this._holdTimer = null;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate([30, 40, 30]); } catch (_) {}
        }
        this.triggerRevealSequence();
      }, 2500); // 2.5-second tactical hold
    }

    handlePointerHoldEnd() {
      if (this._holdTimer) {
        clearTimeout(this._holdTimer);
        this._holdTimer = null;
      }
    }

    triggerRevealSequence() {
      // If already revealed, notify user or allow instant re-lock
      if (this.isStealthRevealed) {
        if (typeof window.safeShowNotification === 'function') {
          window.safeShowNotification('Stealth reveal is already active', 'info');
        }
        return;
      }

      if (this.isRequirePin()) {
        this.openPinModal();
      } else {
        this.revealChats();
      }
    }

    openPinModal() {
      const modal = document.getElementById('vanishSecretPinModal');
      if (!modal) {
        this.revealChats();
        return;
      }

      this.currentPinInput = '';
      this.updatePinDotsUI();

      const feedback = modal.querySelector('#vanishPinFeedback');
      if (feedback) {
        feedback.classList.remove('visible');
        feedback.textContent = '';
      }

      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');

      // Bind keyboard events
      if (this._keyboardHandler) {
        window.removeEventListener('keydown', this._keyboardHandler);
      }

      this._keyboardHandler = (e) => {
        if (!modal.classList.contains('active')) return;
        if (/^[0-9]$/.test(e.key)) {
          this.handlePinDigit(e.key);
        } else if (e.key === 'Backspace') {
          if (this.currentPinInput.length > 0) {
            this.currentPinInput = this.currentPinInput.slice(0, -1);
            this.updatePinDotsUI();
          }
        } else if (e.key === 'Escape') {
          this.closePinModal();
        }
      };
      window.addEventListener('keydown', this._keyboardHandler);
    }

    closePinModal() {
      if (this._keyboardHandler) {
        window.removeEventListener('keydown', this._keyboardHandler);
        this._keyboardHandler = null;
      }

      const modal = document.getElementById('vanishSecretPinModal');
      if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
      this.currentPinInput = '';
    }

    handlePinDigit(digit) {
      if (this.currentPinInput.length >= 4) return;
      this.currentPinInput += digit;
      this.updatePinDotsUI();

      if (this.currentPinInput.length === 4) {
        setTimeout(() => this.verifyPin(this.currentPinInput), 90);
      }
    }

    updatePinDotsUI() {
      const dots = document.querySelectorAll('#vanishPinDots .vanish-pin-dot');
      dots.forEach((dot, idx) => {
        if (idx < this.currentPinInput.length) {
          dot.classList.add('filled');
          dot.classList.remove('error');
        } else {
          dot.classList.remove('filled', 'error');
        }
      });
    }

    verifyPin(code) {
      const correctPin = (window.NexChatPasscodeGate && typeof window.NexChatPasscodeGate.getSecurityCode === 'function')
        ? window.NexChatPasscodeGate.getSecurityCode()
        : (localStorage.getItem('nex_chat_security_code') || '1337');

      if (code === correctPin) {
        this.closePinModal();
        this.revealChats();
      } else {
        // Shake error dots
        const dots = document.querySelectorAll('#vanishPinDots .vanish-pin-dot');
        dots.forEach(d => d.classList.add('error'));

        const modal = document.getElementById('vanishSecretPinModal');
        const feedback = modal?.querySelector('#vanishPinFeedback');
        if (feedback) {
          feedback.textContent = 'Incorrect security passcode';
          feedback.classList.add('visible');
        }

        setTimeout(() => {
          this.currentPinInput = '';
          this.updatePinDotsUI();
        }, 600);
      }
    }

    revealChats() {
      this.isStealthRevealed = true;

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([40, 50, 40]); } catch (_) {}
      }

      // Mount floating banner
      const banner = document.getElementById('vanishStealthBanner');
      if (banner) {
        banner.classList.add('active');
      }

      // Start Countdown Timer
      this._remainingSeconds = this.getAutoTimeoutMins() * 60;
      this.updateCountdownDisplay();

      if (this._countdownInterval) clearInterval(this._countdownInterval);
      this._countdownInterval = setInterval(() => {
        this._remainingSeconds -= 1;
        this.updateCountdownDisplay();
        if (this._remainingSeconds <= 0) {
          this.concealChats();
        }
      }, 1000);

      this.notifyStateChanged();
      if (typeof window.loadContacts === 'function') {
        window.loadContacts();
      }

      if (typeof window.safeShowNotification === 'function') {
        window.safeShowNotification('Stealth session active: Vanished chats revealed', 'success');
      }
    }

    concealChats() {
      this.isStealthRevealed = false;

      if (this._countdownInterval) {
        clearInterval(this._countdownInterval);
        this._countdownInterval = null;
      }

      // Dismount floating banner
      const banner = document.getElementById('vanishStealthBanner');
      if (banner) {
        banner.classList.remove('active');
      }

      // If active conversation is in vanished list, close it immediately
      if (window.currentChatUser && this.vanishedChatIds.has(window.currentChatUser)) {
        if (typeof window.showChatListView === 'function') {
          window.showChatListView();
        } else if (typeof window.closeChat === 'function') {
          window.closeChat();
        }
      }

      this.notifyStateChanged();
      if (typeof window.loadContacts === 'function') {
        window.loadContacts();
      }

      if (typeof window.safeShowNotification === 'function') {
        window.safeShowNotification('Stealth session terminated: Chats vanished', 'info');
      }
    }

    updateCountdownDisplay() {
      const timerEl = document.getElementById('vanishBannerCountdown');
      if (!timerEl) return;
      const mins = Math.floor(Math.max(0, this._remainingSeconds) / 60);
      const secs = Math.max(0, this._remainingSeconds) % 60;
      timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    notifyStateChanged() {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('nex:vanish:stateChanged', {
          detail: {
            enabled: this.isEnabled(),
            revealed: this.isStealthRevealed,
            vanishedCount: this.vanishedChatIds.size
          }
        }));
      }
      this.updateBadgeCounts();
    }

    updateBadgeCounts() {
      const badge = document.getElementById('vanishedChatsCountBadge');
      if (badge) {
        badge.textContent = String(this.vanishedChatIds.size);
      }
    }

    testTapGesture() {
      const required = this.getTapCount();
      const zone = this.getTapTarget();
      const zoneName = zone === 'header' ? 'top app bar / header' : (zone === 'emptySpace' ? 'empty background area' : 'screen');
      if (typeof window.safeShowNotification === 'function') {
        window.safeShowNotification(`Test mode: Tap ${required} times rapidly on the ${zoneName}`, 'info');
      }
    }

    openManagementModal() {
      const modal = document.getElementById('vanishManagementModal');
      if (!modal) return;

      const listContainer = modal.querySelector('#vanishManageList');
      if (listContainer) {
        listContainer.innerHTML = '';

        if (this.vanishedChatIds.size === 0) {
          listContainer.innerHTML = `
            <div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">
              <i class="fa-solid fa-ghost" style="font-size: 28px; color: #a855f7; margin-bottom: 8px; display: block;"></i>
              No chats currently vanished.<br>
              <span style="font-size: 11px; color: #64748b;">Right-click or hold any conversation in the list to vanish it.</span>
            </div>
          `;
        } else {
          this.vanishedChatIds.forEach(chatId => {
            const item = document.createElement('div');
            item.className = 'vanish-manage-item';

            let displayName = chatId;
            // Lookup user display name if cached
            const cachedContact = document.querySelector(`li[data-chat-id="${chatId}"] .chat-name`);
            if (cachedContact && cachedContact.textContent) {
              displayName = cachedContact.textContent;
            }

            item.innerHTML = `
              <div class="vanish-item-meta">
                <i class="fa-solid fa-ghost" style="color: #c084fc; font-size: 15px;"></i>
                <div>
                  <div class="vanish-item-name">${displayName}</div>
                  <div class="vanish-item-status">Vaporized from list</div>
                </div>
              </div>
              <button type="button" class="btn-setup-remove" style="padding: 4px 10px; font-size: 11px; border-radius: 6px;" title="Restore to feed">
                <i class="fa-solid fa-eye"></i> Unvanish
              </button>
            `;

            item.querySelector('button')?.addEventListener('click', () => {
              this.unvanishChat(chatId);
              this.openManagementModal(); // Re-render modal
            });

            listContainer.appendChild(item);
          });
        }
      }

      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }

    closeManagementModal() {
      const modal = document.getElementById('vanishManagementModal');
      if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
    }
  }

  // Attach Singleton instance
  global.NexChatVanish = new ChatVanishEngine();

})(typeof window !== 'undefined' ? window : this);
