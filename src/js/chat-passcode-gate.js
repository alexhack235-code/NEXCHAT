/**
 * =============================================================================
 * NEXCHAT - CHAT PASSCODE SECURITY GATE & MESSAGE CIPHER ENGINE (v1.0)
 * Global Namespace: window.NexChatPasscodeGate
 * =============================================================================
 * Capabilities:
 * 1. Active Chat In-Place Passcode Gatekeeper (Blocks all messages behind a 4-digit code)
 * 2. 1-Click Header Lock Button to instantly secure or unlock active conversation
 * 3. Timing-Safe Constant-Time Passcode Verification & PBKDF2 Key Derivation
 * 4. Panic Duress PIN (9999) Interception: Unlocks decoy chat & wipes RAM
 * 5. Per-Message Secret Code Cipher (AES-256-GCM Encrypted Envelope)
 * 6. WebAuthn Biometric Unlock Bridge (FaceID, TouchID, Windows Hello)
 *
 * STRICTLY 0 UNICODE EMOJIS: Pure FontAwesome 6 vector glyphs only.
 * PURE WINDOWS CRLF LINE ENDINGS. ES2022 COMPLIANT.
 * =============================================================================
 */

(function (global) {
  'use strict';

  const STORAGE_KEY_PIN = 'nex_chat_security_code';
  const STORAGE_KEY_LOCKED_CHATS = 'nex_locked_chats_cache';
  const DEFAULT_PIN = '1337'; // Default security code if none configured
  const DURESS_PIN = '9999';  // Panic Duress PIN

  class ChatPasscodeGateEngine {
    constructor() {
      this.lockedChatIds = new Set();
      this.sessionUnlockedChats = new Set();
      this.currentPinInput = '';
      this.activeChatId = null;
      this._keyboardHandler = null;
      this._hasBoundEvents = false;

      this.init();
    }

    init() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      this.loadLockedChats();

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    loadLockedChats() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_LOCKED_CHATS);
        if (stored) {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr)) {
            this.lockedChatIds = new Set(arr);
          }
        }
      } catch (_) {}
    }

    saveLockedChats() {
      try {
        localStorage.setItem(STORAGE_KEY_LOCKED_CHATS, JSON.stringify(Array.from(this.lockedChatIds)));
      } catch (_) {}
    }

    bindDOM() {
      if (this._hasBoundEvents) return;
      this._hasBoundEvents = true;

      // 1. Bind Header Lock Toggle Buttons (Desktop & Top Bar)
      const bindLockBtn = (btnId) => {
        const btn = document.getElementById(btnId);
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleActiveChatLock();
          });
        }
      };

      bindLockBtn('btnQuickLockChat');
      bindLockBtn('btnQuickLockChatTop');
      bindLockBtn('headerLockChatBtn');

      // 2. Bind Keypad on static Overlay
      const overlay = document.getElementById('chatPasscodeGateOverlay');
      if (overlay) {
        overlay.querySelectorAll('#passcodeKeypadMatrix .passcode-key[data-digit]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const digit = btn.getAttribute('data-digit');
            if (digit) this.handleKeyDigit(digit);
          });
        });

        overlay.querySelector('#btnGateBackspace')?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.currentPinInput.length > 0) {
            this.currentPinInput = this.currentPinInput.slice(0, -1);
            this.updateDotsUI();
          }
        });

        overlay.querySelector('#btnGateBiometric')?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.authenticateBiometric();
        });

        overlay.querySelector('#btnGateLeaveChat')?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof window.showChatListView === 'function') {
            window.showChatListView();
          } else if (typeof window.closeChat === 'function') {
            window.closeChat();
          }
        });

        overlay.querySelector('#btnGateChangeCode')?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.openSetupModal(this.activeChatId || window.currentChatUser);
        });
      }

      // 3. Bind Passcode Setup Modal
      const setupModal = document.getElementById('chatPasscodeSetupModal');
      if (setupModal) {
        setupModal.querySelector('#closePasscodeSetupBtn')?.addEventListener('click', () => {
          this.closeSetupModal();
        });

        setupModal.querySelector('#btnSaveChatPasscode')?.addEventListener('click', () => {
          this.handleSaveSetupCode();
        });

        setupModal.querySelector('#btnRemoveChatPasscode')?.addEventListener('click', () => {
          this.handleRemoveSetupCode();
        });
      }

      // 4. Sync active chat lock button whenever openChat is executed
      window.addEventListener('nex:chat:opened', (e) => {
        const chatId = e.detail?.chatId || window.currentChatUser;
        if (chatId) this.handleChatOpened(chatId);
      });
    }

    timingSafeEqual(a, b) {
      if (typeof a !== 'string' || typeof b !== 'string') return false;
      let mismatch = a.length === b.length ? 0 : 1;
      const len = Math.max(a.length, b.length);
      for (let i = 0; i < len; i++) {
        const charA = i < a.length ? a.charCodeAt(i) : 0;
        const charB = i < b.charCodeAt(i) ? b.charCodeAt(i) : 0;
        mismatch |= charA ^ charB;
      }
      return mismatch === 0;
    }

    getSecurityCode() {
      return localStorage.getItem(STORAGE_KEY_PIN) ||
             (window.NexLockedChats ? localStorage.getItem('nex_locked_chats_pin') : null) ||
             DEFAULT_PIN;
    }

    setSecurityCode(newCode) {
      if (!newCode || newCode.length !== 4 || !/^\d{4}$/.test(newCode)) {
        return { success: false, error: 'Security code must be exactly 4 digits.' };
      }
      localStorage.setItem(STORAGE_KEY_PIN, newCode);
      try {
        localStorage.setItem('nex_locked_chats_pin', newCode);
      } catch (_) {}
      return { success: true };
    }

    isChatLocked(chatId) {
      if (!chatId) return false;
      const isRegistered = this.lockedChatIds.has(chatId) ||
        (window.NexLockedChats && typeof window.NexLockedChats.isChatLocked === 'function' && window.NexLockedChats.isChatLocked(chatId));
      return isRegistered && !this.sessionUnlockedChats.has(chatId);
    }

    onChatOpened(chatId) {
      return this.handleChatOpened(chatId);
    }

    handleChatOpened(chatId) {
      this.activeChatId = chatId;
      this.updateHeaderButtonUI(chatId);

      if (this.isChatLocked(chatId)) {
        this.mountGate(chatId);
      } else {
        this.dismountGate();
      }
    }

    updateHeaderButtonUI(chatId) {
      const btnIds = ['btnQuickLockChat', 'btnQuickLockChatTop', 'headerLockChatBtn'];
      const isRegistered = this.lockedChatIds.has(chatId) ||
        (window.NexLockedChats && typeof window.NexLockedChats.isChatLocked === 'function' && window.NexLockedChats.isChatLocked(chatId));
      const isCurrentlyLocked = this.isChatLocked(chatId);

      btnIds.forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;

        if (isCurrentlyLocked) {
          btn.innerHTML = '<i class="fa-solid fa-lock"></i>';
          btn.classList.add('is-locked');
          btn.classList.remove('is-unlocked');
          btn.setAttribute('title', 'Chat is LOCKED with Security Code (Tap to Unlock)');
          btn.style.color = '#ef4444';
        } else if (isRegistered) {
          btn.innerHTML = '<i class="fa-solid fa-lock-open"></i>';
          btn.classList.add('is-unlocked');
          btn.classList.remove('is-locked');
          btn.setAttribute('title', 'Chat is Unlocked for this session (Tap to Re-Lock immediately)');
          btn.style.color = '#00ff66';
        } else {
          btn.innerHTML = '<i class="fa-solid fa-lock"></i>';
          btn.classList.remove('is-locked', 'is-unlocked');
          btn.setAttribute('title', 'Lock this conversation with a 4-digit code');
          btn.style.color = '#94a3b8';
        }
      });
    }

    toggleActiveChatLock() {
      const chatId = this.activeChatId || window.currentChatUser;
      if (!chatId) {
        if (typeof window.safeShowNotification === 'function') {
          window.safeShowNotification('Please open a conversation first', 'info');
        }
        return;
      }

      const isRegistered = this.lockedChatIds.has(chatId) ||
        (window.NexLockedChats && typeof window.NexLockedChats.isChatLocked === 'function' && window.NexLockedChats.isChatLocked(chatId));
      const isCurrentlyLocked = this.isChatLocked(chatId);

      if (isCurrentlyLocked) {
        // Chat is currently locked and gate is visible: focus gate
        this.mountGate(chatId);
      } else if (isRegistered) {
        // Chat was unlocked during session: immediately re-lock it
        this.sessionUnlockedChats.delete(chatId);
        if (window.NexLockedChats && typeof window.NexLockedChats.relockChatSession === 'function') {
          window.NexLockedChats.relockChatSession(chatId);
        }
        this.mountGate(chatId);
        this.updateHeaderButtonUI(chatId);
        if (typeof window.safeShowNotification === 'function') {
          window.safeShowNotification('Conversation locked and shielded', 'info');
        }
      } else {
        // Chat is not yet registered: open configuration modal
        this.openSetupModal(chatId);
      }
    }

    mountGate(chatId) {
      const overlay = document.getElementById('chatPasscodeGateOverlay');
      if (!overlay) return;

      this.currentPinInput = '';

      // Update Target Name
      const targetNameEl = overlay.querySelector('#passcodeGateTargetName');
      if (targetNameEl) {
        targetNameEl.textContent = window.currentChatName || 'Confidential Contact';
      }

      // Reset Feedback & Dots
      const feedback = overlay.querySelector('#passcodeGateFeedback');
      if (feedback) feedback.style.display = 'none';

      overlay.querySelectorAll('#passcodeGateDots .passcode-dot').forEach(d => {
        d.classList.remove('filled', 'error');
      });

      // Clear messages area DOM to prevent shoulder surfing & inspection leaks
      const messagesDiv = document.getElementById('messages-area');
      if (messagesDiv) {
        messagesDiv.innerHTML = '';
      }

      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');

      // Bind physical keyboard
      if (this._keyboardHandler) {
        window.removeEventListener('keydown', this._keyboardHandler);
      }

      this._keyboardHandler = (e) => {
        if (overlay.style.display === 'none') return;
        if (/^[0-9]$/.test(e.key)) {
          this.handleKeyDigit(e.key);
        } else if (e.key === 'Backspace') {
          if (this.currentPinInput.length > 0) {
            this.currentPinInput = this.currentPinInput.slice(0, -1);
            this.updateDotsUI();
          }
        } else if (e.key === 'Escape') {
          this.currentPinInput = '';
          this.updateDotsUI();
        }
      };
      window.addEventListener('keydown', this._keyboardHandler);

      // Auto-trigger biometric if configured
      if (window.PublicKeyCredential && localStorage.getItem('nex_biometric_enabled') === 'true') {
        setTimeout(() => this.authenticateBiometric(), 200);
      }
    }

    dismountGate() {
      if (this._keyboardHandler) {
        window.removeEventListener('keydown', this._keyboardHandler);
        this._keyboardHandler = null;
      }

      const overlay = document.getElementById('chatPasscodeGateOverlay');
      if (overlay) {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
      }

      this.currentPinInput = '';
    }

    handleKeyDigit(digit) {
      if (this.currentPinInput.length >= 4) return;
      this.currentPinInput += digit;
      this.updateDotsUI();

      if (this.currentPinInput.length === 4) {
        setTimeout(() => this.verifyCode(this.currentPinInput, this.activeChatId || window.currentChatUser), 80);
      }
    }

    updateDotsUI() {
      const dots = document.querySelectorAll('#passcodeGateDots .passcode-dot');
      dots.forEach((dot, idx) => {
        if (idx < this.currentPinInput.length) {
          dot.classList.add('filled');
          dot.classList.remove('error');
        } else {
          dot.classList.remove('filled', 'error');
        }
      });

      const fb = document.getElementById('passcodeGateFeedback');
      if (fb) fb.style.display = 'none';
    }

    verifyCode(enteredCode, chatId) {
      // 1. Coercion Duress PIN (9999) Interception
      if (enteredCode === DURESS_PIN) {
        this.dismountGate();
        this.triggerDuressDecoy(chatId);
        return;
      }

      // 2. Genuine Code Verification (Constant-Time)
      const correctCode = this.getSecurityCode();
      const isMatch = this.timingSafeEqual(enteredCode, correctCode);

      if (isMatch) {
        // Unlock chat for current session
        this.sessionUnlockedChats.add(chatId);
        if (window.NexLockedChats && typeof window.NexLockedChats.unlockChatSession === 'function') {
          window.NexLockedChats.unlockChatSession(chatId);
        }

        this.dismountGate();
        this.updateHeaderButtonUI(chatId);

        if (typeof window.safeShowNotification === 'function') {
          window.safeShowNotification('Conversation Unlocked', 'success');
        }

        // Trigger message reload or render
        if (window.currentChatType === 'group' && typeof window.loadGroupMessages === 'function') {
          window.loadGroupMessages(chatId);
        } else if (typeof window.loadMessages === 'function') {
          window.loadMessages();
        }
      } else {
        // Incorrect Code
        const card = document.getElementById('chatPasscodeGateCard');
        if (card) {
          card.classList.remove('shake');
          void card.offsetWidth; // force reflow
          card.classList.add('shake');
          setTimeout(() => card.classList.remove('shake'), 400);
        }

        const dots = document.querySelectorAll('#passcodeGateDots .passcode-dot');
        dots.forEach(dot => dot.classList.add('error'));

        const fb = document.getElementById('passcodeGateFeedback');
        if (fb) fb.style.display = 'flex';

        if (navigator.vibrate) {
          try { navigator.vibrate([60, 50, 60]); } catch (_) {}
        }

        this.currentPinInput = '';
      }
    }

    async authenticateBiometric() {
      try {
        if (window.biometricLockEngine && typeof window.biometricLockEngine.verifyBiometric === 'function') {
          const success = await window.biometricLockEngine.verifyBiometric();
          if (success) {
            const chatId = this.activeChatId || window.currentChatUser;
            this.sessionUnlockedChats.add(chatId);
            if (window.NexLockedChats && typeof window.NexLockedChats.unlockChatSession === 'function') {
              window.NexLockedChats.unlockChatSession(chatId);
            }
            this.dismountGate();
            this.updateHeaderButtonUI(chatId);

            if (typeof window.safeShowNotification === 'function') {
              window.safeShowNotification('Biometric Verification Successful', 'success');
            }

            if (window.currentChatType === 'group' && typeof window.loadGroupMessages === 'function') {
              window.loadGroupMessages(chatId);
            } else if (typeof window.loadMessages === 'function') {
              window.loadMessages();
            }
          }
        }
      } catch (err) {
        console.warn('[PASSCODE GATE] Biometric authentication fallback:', err);
      }
    }

    triggerDuressDecoy(chatId) {
      const container = document.getElementById('messages-area');
      if (container) {
        container.innerHTML = `
          <div style="padding: 32px 16px; text-align: center; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
            <i class="fa-solid fa-circle-check" style="font-size: 32px; color: #00ff88; margin-bottom: 12px; display: block;"></i>
            <p style="font-size: 14px; font-weight: 700; color: #ffffff;">Apartment Management Office</p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 6px;">Your monthly utility receipt has been processed.</p>
          </div>
        `;
      }
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('nex:duress:wipe'));
      }
      if (typeof window.safeShowNotification === 'function') {
        window.safeShowNotification('Verified', 'success');
      }
    }

    openSetupModal(chatId) {
      const modal = document.getElementById('chatPasscodeSetupModal');
      if (!modal) return;

      const inputPin = modal.querySelector('#setupPasscodeInput');
      const inputConfirm = modal.querySelector('#setupPasscodeConfirmInput');
      const removeBtn = modal.querySelector('#btnRemoveChatPasscode');

      if (inputPin) inputPin.value = '';
      if (inputConfirm) inputConfirm.value = '';

      const isRegistered = this.lockedChatIds.has(chatId) ||
        (window.NexLockedChats && typeof window.NexLockedChats.isChatLocked === 'function' && window.NexLockedChats.isChatLocked(chatId));

      if (removeBtn) {
        removeBtn.style.display = isRegistered ? 'inline-flex' : 'none';
      }

      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
      if (inputPin) inputPin.focus();
    }

    closeSetupModal() {
      const modal = document.getElementById('chatPasscodeSetupModal');
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    }

    handleSaveSetupCode() {
      const modal = document.getElementById('chatPasscodeSetupModal');
      if (!modal) return;

      const inputPin = modal.querySelector('#setupPasscodeInput');
      const inputConfirm = modal.querySelector('#setupPasscodeConfirmInput');
      const code = inputPin?.value?.trim();
      const confirmCode = inputConfirm?.value?.trim();

      if (!code || code.length !== 4 || !/^\d{4}$/.test(code)) {
        if (typeof window.safeShowNotification === 'function') {
          window.safeShowNotification('Security code must be exactly 4 numeric digits', 'error');
        }
        return;
      }

      if (code !== confirmCode) {
        if (typeof window.safeShowNotification === 'function') {
          window.safeShowNotification('Passcodes do not match. Please re-enter', 'error');
        }
        return;
      }

      const res = this.setSecurityCode(code);
      if (!res.success) {
        if (typeof window.safeShowNotification === 'function') {
          window.safeShowNotification(res.error, 'error');
        }
        return;
      }

      const chatId = this.activeChatId || window.currentChatUser;
      if (chatId) {
        this.lockedChatIds.add(chatId);
        this.saveLockedChats();
        if (window.NexLockedChats && typeof window.NexLockedChats.lockChat === 'function') {
          window.NexLockedChats.lockedChatIds.add(chatId);
          window.NexLockedChats.saveLocalCache();
        }
        this.sessionUnlockedChats.delete(chatId);
        this.closeSetupModal();
        this.mountGate(chatId);
        this.updateHeaderButtonUI(chatId);
        if (typeof window.safeShowNotification === 'function') {
          window.safeShowNotification('Conversation locked with 4-digit code', 'success');
        }
      } else {
        this.closeSetupModal();
      }
    }

    handleRemoveSetupCode() {
      const chatId = this.activeChatId || window.currentChatUser;
      if (chatId) {
        this.lockedChatIds.delete(chatId);
        this.sessionUnlockedChats.delete(chatId);
        this.saveLockedChats();
        if (window.NexLockedChats && typeof window.NexLockedChats.unlockChat === 'function') {
          window.NexLockedChats.unlockChat(chatId);
        }
        this.closeSetupModal();
        this.dismountGate();
        this.updateHeaderButtonUI(chatId);

        if (typeof window.safeShowNotification === 'function') {
          window.safeShowNotification('Passcode removed from conversation', 'info');
        }

        if (window.currentChatType === 'group' && typeof window.loadGroupMessages === 'function') {
          window.loadGroupMessages(chatId);
        } else if (typeof window.loadMessages === 'function') {
          window.loadMessages();
        }
      }
    }

    /**
     * PER-MESSAGE SECRET CIPHER ENGINE (AES-256-GCM Envelope)
     */
    async encryptMessage(plainText, passcode) {
      if (!passcode || passcode.length < 4) throw new Error('Passcode must be at least 4 digits');

      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const passBuffer = new TextEncoder().encode(passcode);
      const baseKey = await crypto.subtle.importKey('raw', passBuffer, { name: 'PBKDF2' }, false, ['deriveKey']);
      const aesKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const encoded = new TextEncoder().encode(plainText);
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, aesKey, encoded);

      const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
      return {
        isSecretCipher: true,
        salt: toB64(salt),
        iv: toB64(iv),
        ciphertext: toB64(encrypted)
      };
    }

    async decryptMessage(envelope, passcode) {
      if (passcode === DURESS_PIN) {
        return { success: true, plainText: '[CONFIDENTIAL]: Routine message received.' };
      }

      try {
        const fromB64 = (str) => Uint8Array.from(atob(str), c => c.charCodeAt(0));
        const salt = fromB64(envelope.salt);
        const iv = fromB64(envelope.iv);
        const cipherBuffer = fromB64(envelope.ciphertext);

        const passBuffer = new TextEncoder().encode(passcode);
        const baseKey = await crypto.subtle.importKey('raw', passBuffer, { name: 'PBKDF2' }, false, ['deriveKey']);
        const aesKey = await crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
          baseKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, aesKey, cipherBuffer);
        return { success: true, plainText: new TextDecoder().decode(decrypted) };
      } catch (err) {
        return { success: false, error: 'Incorrect Passcode' };
      }
    }
  }

  // Export Singleton to global scope
  global.NexChatPasscodeGate = new ChatPasscodeGateEngine();

})(typeof window !== 'undefined' ? window : this);
