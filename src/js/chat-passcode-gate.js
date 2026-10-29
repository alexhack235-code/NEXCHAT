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
      this.gateOverlayEl = null;

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
      // Bind Header Lock Toggle Button
      const headerLockBtn = document.getElementById('headerLockChatBtn');
      if (headerLockBtn) {
        headerLockBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleActiveChatLock();
        });
      }

      // Sync active chat lock button whenever openChat is executed
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
      return localStorage.getItem(STORAGE_KEY_PIN) || DEFAULT_PIN;
    }

    setSecurityCode(newCode) {
      if (!newCode || newCode.length !== 4 || !/^\d{4}$/.test(newCode)) {
        return { success: false, error: 'Security code must be exactly 4 digits.' };
      }
      localStorage.setItem(STORAGE_KEY_PIN, newCode);
      return { success: true };
    }

    isChatLocked(chatId) {
      if (!chatId) return false;
      // Also check NexLockedChats if integrated
      const isRegistered = this.lockedChatIds.has(chatId) || 
        (window.NexLockedChats && typeof window.NexLockedChats.isChatLocked === 'function' && window.NexLockedChats.isChatLocked(chatId));
      return isRegistered && !this.sessionUnlockedChats.has(chatId);
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
      const btn = document.getElementById('headerLockChatBtn');
      if (!btn) return;

      const isRegistered = this.lockedChatIds.has(chatId);
      const isCurrentlyLocked = this.isChatLocked(chatId);

      if (isCurrentlyLocked) {
        btn.innerHTML = '<i class="fa-solid fa-lock" style="color: #ff0055;"></i>';
        btn.className = 'header-icon-btn chat-lock-toggle-btn is-locked';
        btn.setAttribute('title', 'Chat is LOCKED with Security Code (Tap to Unlock)');
      } else if (isRegistered) {
        btn.innerHTML = '<i class="fa-solid fa-lock-open" style="color: #00ff88;"></i>';
        btn.className = 'header-icon-btn chat-lock-toggle-btn is-unlocked';
        btn.setAttribute('title', 'Chat is Unlocked for this session (Tap to Re-Lock immediately)');
      } else {
        btn.innerHTML = '<i class="fa-solid fa-lock" style="color: #94a3b8;"></i>';
        btn.className = 'header-icon-btn chat-lock-toggle-btn';
        btn.setAttribute('title', 'Lock This Chat with a Security Code');
      }
    }

    toggleActiveChatLock() {
      const chatId = this.activeChatId || window.currentChatUser;
      if (!chatId) {
        if (typeof window.showCustomNotification === 'function') {
          window.showCustomNotification('<i class="fa-solid fa-circle-exclamation"></i> Please open a chat first', 2000);
        }
        return;
      }

      const isRegistered = this.lockedChatIds.has(chatId);
      const isCurrentlyLocked = this.isChatLocked(chatId);

      if (isCurrentlyLocked) {
        // Chat is locked: prompt to enter code
        this.mountGate(chatId);
      } else if (isRegistered) {
        // Chat was unlocked during session: immediately re-lock it
        this.sessionUnlockedChats.delete(chatId);
        this.mountGate(chatId);
        this.updateHeaderButtonUI(chatId);
        if (typeof window.showCustomNotification === 'function') {
          window.showCustomNotification('<i class="fa-solid fa-lock" style="color:#ff0055;margin-right:6px;"></i> Chat Locked with Security Code', 2400);
        }
      } else {
        // Chat is not yet in locked list: register it and lock it
        this.lockedChatIds.add(chatId);
        this.saveLockedChats();
        if (window.NexLockedChats && typeof window.NexLockedChats.lockChat === 'function') {
          window.NexLockedChats.lockedChatIds.add(chatId);
          window.NexLockedChats.saveLocalCache();
        }
        this.sessionUnlockedChats.delete(chatId);
        this.mountGate(chatId);
        this.updateHeaderButtonUI(chatId);
        if (typeof window.showCustomNotification === 'function') {
          window.showCustomNotification('<i class="fa-solid fa-shield-halved" style="color:#00f3ff;margin-right:6px;"></i> Conversation Locked behind Security Code', 2600);
        }
      }
    }

    mountGate(chatId) {
      this.dismountGate();

      const container = document.getElementById('messages-area') || 
                        document.getElementById('messages-container') || 
                        document.querySelector('.messages-section');
      if (!container) return;

      this.currentPinInput = '';

      const overlay = document.createElement('div');
      overlay.id = 'chatPasscodeGateOverlay';
      overlay.className = 'chat-passcode-gate-overlay';
      overlay.innerHTML = `
        <div class="passcode-gate-card">
          <div class="passcode-gate-shield-icon">
            <i class="fa-solid fa-lock"></i>
          </div>
          <h3 class="passcode-gate-title">CHAT LOCKED WITH SECURITY CODE</h3>
          <p class="passcode-gate-subtitle">Enter your 4-digit security code to reveal messages.</p>
          
          <div class="passcode-dots-row" id="gatePinDots">
            <span class="passcode-dot"></span>
            <span class="passcode-dot"></span>
            <span class="passcode-dot"></span>
            <span class="passcode-dot"></span>
          </div>
          
          <div id="gatePinError" class="passcode-gate-error" style="display:none;">
            <i class="fa-solid fa-triangle-exclamation"></i> Incorrect security code
          </div>
          
          <div class="passcode-keypad" id="gateKeypad">
            <button type="button" class="k-btn" data-key="1">1</button>
            <button type="button" class="k-btn" data-key="2">2</button>
            <button type="button" class="k-btn" data-key="3">3</button>
            <button type="button" class="k-btn" data-key="4">4</button>
            <button type="button" class="k-btn" data-key="5">5</button>
            <button type="button" class="k-btn" data-key="6">6</button>
            <button type="button" class="k-btn" data-key="7">7</button>
            <button type="button" class="k-btn" data-key="8">8</button>
            <button type="button" class="k-btn" data-key="9">9</button>
            <button type="button" class="k-btn action" id="btnGateClear" title="Clear"><i class="fa-solid fa-xmark"></i></button>
            <button type="button" class="k-btn" data-key="0">0</button>
            <button type="button" class="k-btn action" id="btnGateBackspace" title="Delete"><i class="fa-solid fa-delete-left"></i></button>
          </div>
          
          <div class="passcode-gate-footer">
            <button type="button" class="gate-btn-link" id="btnChangePasscode">
              <i class="fa-solid fa-key"></i> Set / Change Security Code
            </button>
          </div>
        </div>
      `;

      container.appendChild(overlay);
      this.gateOverlayEl = overlay;

      // Bind Keypad
      overlay.querySelectorAll('.passcode-keypad-matrix .passcode-key[data-key]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const digit = btn.getAttribute('data-key');
          this.handleKeyDigit(digit, chatId);
        });
      });

      overlay.querySelector('#btnGateClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentPinInput = '';
        this.updateDotsUI();
      });

      overlay.querySelector('#btnGateBackspace')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentPinInput = this.currentPinInput.slice(0, -1);
        this.updateDotsUI();
      });

      overlay.querySelector('#btnChangePasscode')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openChangeCodeModal();
      });

      // Bind physical keyboard
      this._keyboardHandler = (e) => {
        if (!this.gateOverlayEl) return;
        if (/^[0-9]$/.test(e.key)) {
          this.handleKeyDigit(e.key, chatId);
        } else if (e.key === 'Backspace') {
          this.currentPinInput = this.currentPinInput.slice(0, -1);
          this.updateDotsUI();
        } else if (e.key === 'Escape') {
          this.currentPinInput = '';
          this.updateDotsUI();
        }
      };
      window.addEventListener('keydown', this._keyboardHandler);
    }

    dismountGate() {
      if (this._keyboardHandler) {
        window.removeEventListener('keydown', this._keyboardHandler);
        this._keyboardHandler = null;
      }
      const existing = document.getElementById('chatPasscodeGateOverlay');
      if (existing) existing.remove();
      this.gateOverlayEl = null;
      this.currentPinInput = '';
    }

    handleKeyDigit(digit, chatId) {
      if (this.currentPinInput.length >= 4) return;
      this.currentPinInput += digit;
      this.updateDotsUI();

      if (this.currentPinInput.length === 4) {
        setTimeout(() => this.verifyCode(this.currentPinInput, chatId), 80);
      }
    }

    updateDotsUI() {
      const dots = document.querySelectorAll('#gatePinDots .passcode-dot');
      dots.forEach((dot, idx) => {
        if (idx < this.currentPinInput.length) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      });
      const err = document.getElementById('gatePinError');
      if (err) err.style.display = 'none';
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
        this.dismountGate();
        this.updateHeaderButtonUI(chatId);

        if (typeof window.showCustomNotification === 'function') {
          window.showCustomNotification('<i class="fa-solid fa-lock-open" style="color:#00ff88;margin-right:6px;"></i> Chat Security Code Verified', 2000);
        }

        // Trigger message reload or render
        if (typeof window.loadMessages === 'function' && window.currentChatType !== 'group') {
          window.loadMessages();
        }
      } else {
        // Incorrect Code
        const err = document.getElementById('gatePinError');
        if (err) err.style.display = 'flex';
        if (navigator.vibrate) {
          try { navigator.vibrate([60, 50, 60]); } catch (_) {}
        }
        this.currentPinInput = '';
        this.updateDotsUI();
      }
    }

    triggerDuressDecoy(chatId) {
      const container = document.getElementById('messages-area') || document.querySelector('.messages-list');
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
      if (typeof window.showCustomNotification === 'function') {
        window.showCustomNotification('<i class="fa-solid fa-circle-check" style="color:#00ff88;margin-right:6px;"></i> Verified', 1500);
      }
    }

    openChangeCodeModal() {
      let modal = document.getElementById('nexChangePasscodeModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'nexChangePasscodeModal';
        modal.className = 'chat-passcode-gate-overlay';
        modal.style.zIndex = '100060';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="passcode-gate-card">
          <div class="passcode-gate-shield-icon">
            <i class="fa-solid fa-key"></i>
          </div>
          <h3 class="passcode-gate-title">CONFIGURE SECURITY CODE</h3>
          <p class="passcode-gate-subtitle">Set a 4-digit code to block anyone from reading your messages.</p>
          
          <div style="margin-bottom: 16px;">
            <input type="password" id="inputNewSecurityCode" maxlength="4" placeholder="Enter 4-digit code" 
              style="width: 100%; box-sizing: border-box; text-align: center; font-size: 22px; letter-spacing: 8px; font-weight: 800; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,243,255,0.4); border-radius: 10px; padding: 10px; color: #00f3ff; outline: none;" />
          </div>
          
          <div style="display: flex; gap: 10px;">
            <button type="button" id="btnCancelPasscodeChange" class="k-btn action" style="flex: 1; height: 42px; font-size: 13px;">Cancel</button>
            <button type="button" id="btnSaveNewPasscode" class="k-btn" style="flex: 1; height: 42px; font-size: 13px; background: #00f3ff; color: #060913; font-weight: 800; border: none;">Save Code</button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';

      const close = () => { modal.style.display = 'none'; };
      modal.querySelector('#btnCancelPasscodeChange')?.addEventListener('click', close);
      modal.querySelector('#btnSaveNewPasscode')?.addEventListener('click', () => {
        const val = modal.querySelector('#inputNewSecurityCode')?.value?.trim();
        const res = this.setSecurityCode(val);
        if (res.success) {
          close();
          if (typeof window.showCustomNotification === 'function') {
            window.showCustomNotification('<i class="fa-solid fa-circle-check" style="color:#00ff88;margin-right:6px;"></i> Security Code Successfully Updated', 2800);
          }
        } else {
          alert(res.error || 'Please enter exactly 4 digits');
        }
      });
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
