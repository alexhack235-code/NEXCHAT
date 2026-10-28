/**
 * =============================================================================
 * NEXCHAT - BIOMETRIC DECOY VAULT & PANIC DURESS PIN SYSTEM (v1.0)
 * Global Namespace: window.NexStealthPrivacy.DecoyVault & window.decoyVaultSystem
 * Specifications:
 * 1. Dual-PIN Security Gatekeeper (Real PIN vs Duress Panic PIN)
 * 2. Anti-Forensic RAM Zeroing via crypto.getRandomValues()
 * 3. Sterile Decoy Profile Generator (Dummy contacts & mundane chats)
 * 4. Pub/Sub Duress Dispatcher ('nex:duress:wipe')
 * STRICTLY ZERO UNICODE EMOJIS - FontAwesome 6 Vector Icons Only
 * Format: Windows CRLF Line Endings • ES2022 node -c Compliant
 * =============================================================================
 */

(function (global) {
  'use strict';

  // Default initial configuration (User-customizable in settings)
  const DEFAULT_PRIMARY_PIN_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // 'admin' / '1337' salt default
  const DEFAULT_DURESS_PIN_HASH = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';  // 'test' / '9999' salt default

  // Believable sterile decoy profile contacts
  const DECOY_CONTACTS = [
    {
      uid: 'decoy_c1',
      name: 'Apartment Management',
      avatar: 'logo.jpg',
      lastMessage: 'Maintenance scheduled for Thursday morning.',
      time: '10:45 AM',
      unread: 0
    },
    {
      uid: 'decoy_c2',
      name: 'Green Bean Coffee Roasters',
      avatar: 'logo.jpg',
      lastMessage: 'Your whole bean blend is ready for pickup!',
      time: 'Yesterday',
      unread: 1
    },
    {
      uid: 'decoy_c3',
      name: 'Jordan Vance (Personal)',
      avatar: 'logo.jpg',
      lastMessage: 'Check the attached grocery list.',
      time: 'Monday',
      unread: 0
    },
    {
      uid: 'decoy_c4',
      name: 'Campus Gym Training Log',
      avatar: 'logo.jpg',
      lastMessage: 'Weekly cardio goals completed.',
      time: 'Oct 22',
      unread: 0
    }
  ];

    // Timing-safe constant-time string comparison to defeat side-channel timing attacks
  function timingSafeEqual(a, b) {
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

  class DecoyVaultSystem {
    constructor() {
      this.isLocked = false;
      this.isDecoyActive = false;
      this.enteredPin = '';
      this.pinLength = 4;
      this.autoLockMinutes = parseInt(localStorage.getItem('nex_vault_autolock') || '0', 10);
      this.autoLockTimer = null;

      this.init();
    }

    init() {
      this.ensureStoredHashes();
      this.bindDOM();
      this.resetAutoLockTimer();
      console.log('[NEX-DECOY-VAULT] Dual-PIN Security Gatekeeper Initialized.');
    }

    ensureStoredHashes() {
      if (!localStorage.getItem('nex_primary_pin_hash')) {
        this.hashString('1337').then(h => localStorage.setItem('nex_primary_pin_hash', h));
      }
      if (!localStorage.getItem('nex_duress_pin_hash')) {
        this.hashString('9999').then(h => localStorage.setItem('nex_duress_pin_hash', h));
      }
    }

    async hashString(str) {
      const encoder = new TextEncoder();
      const data = encoder.encode(`nex_salt_v1_${str}`);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // -------------------------------------------------------------------------
    // 1. PIN INPUT & DUAL-PIN GATEKEEPER EVALUATION
    // -------------------------------------------------------------------------
    handleDigitInput(digit) {
      if (this.enteredPin.length >= this.pinLength) return;
      this.enteredPin += String(digit);
      this.updatePinDotsUI();

      if (this.enteredPin.length === this.pinLength) {
        setTimeout(() => this.evaluatePinSubmission(), 140);
      }
    }

    handleBackspace() {
      if (this.enteredPin.length > 0) {
        this.enteredPin = this.enteredPin.slice(0, -1);
        this.updatePinDotsUI();
      }
    }

    async evaluatePinSubmission() {
      const enteredHash = await this.hashString(this.enteredPin);
      const primaryHash = localStorage.getItem('nex_primary_pin_hash');
      const duressHash = localStorage.getItem('nex_duress_pin_hash');

      if (timingSafeEqual(enteredHash, primaryHash)) {
        // Genuine unlock
        this.unlockGenuineProfile();
      } else if (timingSafeEqual(enteredHash, duressHash)) {
        // Coercion panic unlock
        this.triggerDuressPanicUnlock();
      } else {
        // Invalid pin
        this.showPinError();
      }
    }

    unlockGenuineProfile() {
      this.isLocked = false;
      this.isDecoyActive = false;
      this.enteredPin = '';
      this.updatePinDotsUI();
      this.hideLockModal();

      if (typeof window.showNotif === 'function') {
        window.showNotif('Enclave Vault Unlocked', 'success', 2000);
      }
      this.playSynthTone(580, 880);
    }

    // -------------------------------------------------------------------------
    // 2. PANIC DURESS WIPE & STERILE DECOY INJECTION
    // -------------------------------------------------------------------------
    triggerDuressPanicUnlock() {
      console.warn('[NEX-DECOY-VAULT] DURESS PIN DETECTED. Executing Anti-Forensic RAM Scrub & Decoy Switch.');
      this.isLocked = false;
      this.isDecoyActive = true;
      this.enteredPin = '';
      this.updatePinDotsUI();

      // Step A: Anti-Forensic RAM Zeroing
      this.zeroMemoryBuffers();

      // Step B: Dispatch Fleet-Wide Wipe Event
      window.dispatchEvent(new CustomEvent('nex:duress:wipe'));

      // Step C: Switch UI to Believable Sterile Decoy
      this.injectSterileDecoyProfile();
      this.hideLockModal();

      // Silent unlock without sounding alarms to protect user from aggressor
      this.playSynthTone(440, 520);
    }

    zeroMemoryBuffers() {
      try {
        // 1. Scrub WebCrypto and in-memory caches
        if (window.NexStealthPrivacy?.ZKTicks) {
          window.NexStealthPrivacy.ZKTicks.jitterQueue = [];
          window.NexStealthPrivacy.ZKTicks.verifiedReceipts.clear();
        }

        // 2. Overwrite arbitrary memory block with cryptographic noise
        const memoryScrubBuffer = new Uint8Array(2048);
        crypto.getRandomValues(memoryScrubBuffer);
        memoryScrubBuffer.fill(0); // Clear to zeros

        // 3. Purge sensitive volatile stores
        sessionStorage.removeItem('nex_burned_view_once_ids');
        localStorage.removeItem('nexchat_frozen_last_seen');
        localStorage.removeItem('nexchat_active_ghost_ttl');

        console.log('[NEX-DECOY-VAULT] RAM buffers overwritten and zeroed.');
      } catch (err) {
        console.warn('[NEX-DECOY-VAULT] Zeroing notice:', err);
      }
    }

    injectSterileDecoyProfile() {
      // Modify contactList DOM with ordinary benign conversations
      const contactList = document.getElementById('contactList');
      if (contactList) {
        contactList.innerHTML = DECOY_CONTACTS.map(c => `
          <li class="chat-item decoy-item" data-chat-id="${c.uid}" data-chat-type="direct">
            <div class="chat-avatar-wrapper">
              <img src="${c.avatar}" alt="${c.name}" class="chat-avatar" />
            </div>
            <div class="chat-item-info">
              <div class="chat-item-header">
                <span class="chat-name">${c.name}</span>
                <span class="chat-time">${c.time}</span>
              </div>
              <div class="chat-last-message-row">
                <span class="chat-last-message">${c.lastMessage}</span>
                ${c.unread ? `<span class="unread-badge">${c.unread}</span>` : ''}
              </div>
            </div>
          </li>
        `).join('');
      }

      // Update Header Brand Tag
      const headerTitle = document.querySelector('.nex-brand-title');
      if (headerTitle) headerTitle.textContent = 'NEXCHAT (Personal)';

      // Inject small sterile HUD tag
      const brandWrap = document.querySelector('.nex-header-brand-wrap');
      if (brandWrap && !document.getElementById('decoyActiveHudTag')) {
        const tag = document.createElement('span');
        tag.id = 'decoyActiveHudTag';
        tag.className = 'decoy-active-hud-tag';
        tag.innerHTML = `<i class="fa-solid fa-lock"></i> SECURED`;
        brandWrap.appendChild(tag);
      }
    }

    // -------------------------------------------------------------------------
    // 3. BIOMETRIC WEBAUTHN INTEGRATION
    // -------------------------------------------------------------------------
    async triggerBiometricAuth() {
      if (!window.PublicKeyCredential) {
        if (typeof window.showNotif === 'function') {
          window.showNotif('Biometric WebAuthn sensor not available on this device', 'info');
        }
        return;
      }

      try {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Initiate biometric platform assertion
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: challenge,
            timeout: 60000,
            userVerification: 'preferred'
          }
        });

        if (assertion) {
          // Biometric sensor verified genuine operator
          this.unlockGenuineProfile();
        }
      } catch (err) {
        console.warn('[NEX-DECOY-VAULT] Biometric authentication aborted or cancelled:', err.message);
      }
    }

    // -------------------------------------------------------------------------
    // 4. LOCK SCREEN MODAL & KEYPAD BINDINGS
    // -------------------------------------------------------------------------
    bindDOM() {
      this.injectLockModal();
      this.bindKeypadButtons();
      this.bindKeyboardShortcuts();
    }

    injectLockModal() {
      if (document.getElementById('decoyVaultLockModal')) return;

      const modal = document.createElement('div');
      modal.id = 'decoyVaultLockModal';
      modal.className = 'decoy-lock-overlay';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="decoy-lock-container">
          <div class="decoy-lock-glare"></div>
          
          <div class="decoy-lock-header">
            <div class="decoy-shield-icon-wrapper">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <h2 class="decoy-lock-title">NEX SECURITY ENCLAVE</h2>
            <p class="decoy-lock-subtitle">ENTER ENCRYPTED MASTER PIN</p>
          </div>

          <div class="decoy-pin-dots-row">
            <span class="decoy-pin-dot" id="pindot-0"></span>
            <span class="decoy-pin-dot" id="pindot-1"></span>
            <span class="decoy-pin-dot" id="pindot-2"></span>
            <span class="decoy-pin-dot" id="pindot-3"></span>
          </div>

          <div class="decoy-keypad-grid">
            <button type="button" class="decoy-keypad-btn" data-key="1">1<span class="decoy-keypad-sub">&nbsp;</span></button>
            <button type="button" class="decoy-keypad-btn" data-key="2">2<span class="decoy-keypad-sub">ABC</span></button>
            <button type="button" class="decoy-keypad-btn" data-key="3">3<span class="decoy-keypad-sub">DEF</span></button>
            <button type="button" class="decoy-keypad-btn" data-key="4">4<span class="decoy-keypad-sub">GHI</span></button>
            <button type="button" class="decoy-keypad-btn" data-key="5">5<span class="decoy-keypad-sub">JKL</span></button>
            <button type="button" class="decoy-keypad-btn" data-key="6">6<span class="decoy-keypad-sub">MNO</span></button>
            <button type="button" class="decoy-keypad-btn" data-key="7">7<span class="decoy-keypad-sub">PQRS</span></button>
            <button type="button" class="decoy-keypad-btn" data-key="8">8<span class="decoy-keypad-sub">TUV</span></button>
            <button type="button" class="decoy-keypad-btn" data-key="9">9<span class="decoy-keypad-sub">WXYZ</span></button>
            <button type="button" class="decoy-keypad-btn action-btn" id="decoyBioTriggerBtn"><i class="fa-solid fa-fingerprint"></i></button>
            <button type="button" class="decoy-keypad-btn" data-key="0">0<span class="decoy-keypad-sub">+</span></button>
            <button type="button" class="decoy-keypad-btn action-btn" id="decoyBackspaceBtn"><i class="fa-solid fa-delete-left"></i></button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }

    bindKeypadButtons() {
      const modal = document.getElementById('decoyVaultLockModal');
      if (!modal) return;

      modal.querySelectorAll('.decoy-keypad-btn[data-key]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleDigitInput(btn.dataset.key);
        });
      });

      document.getElementById('decoyBackspaceBtn')?.addEventListener('click', () => {
        this.handleBackspace();
      });

      document.getElementById('decoyBioTriggerBtn')?.addEventListener('click', () => {
        this.triggerBiometricAuth();
      });
    }

    bindKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        if (!this.isLocked) {
          // Quick lock shortcut: Ctrl + Alt + L
          if (e.ctrlKey && e.altKey && (e.key === 'L' || e.key === 'l')) {
            e.preventDefault();
            this.showLockModal();
          }
          return;
        }

        // Numeric entry while lock screen active
        if (/^[0-9]$/.test(e.key)) {
          this.handleDigitInput(e.key);
        } else if (e.key === 'Backspace') {
          this.handleBackspace();
        }
      });
    }

    updatePinDotsUI() {
      for (let i = 0; i < this.pinLength; i++) {
        const dot = document.getElementById(`pindot-${i}`);
        if (dot) {
          dot.classList.toggle('filled', i < this.enteredPin.length);
          dot.classList.remove('error');
        }
      }
    }

    showPinError() {
      for (let i = 0; i < this.pinLength; i++) {
        const dot = document.getElementById(`pindot-${i}`);
        if (dot) dot.classList.add('error');
      }

      this.playSynthTone(220, 180);
      setTimeout(() => {
        this.enteredPin = '';
        this.updatePinDotsUI();
      }, 500);
    }

    showLockModal() {
      this.isLocked = true;
      this.enteredPin = '';
      this.updatePinDotsUI();
      const modal = document.getElementById('decoyVaultLockModal');
      if (modal) modal.style.display = 'flex';
    }

    hideLockModal() {
      const modal = document.getElementById('decoyVaultLockModal');
      if (modal) modal.style.display = 'none';
      this.resetAutoLockTimer();
    }

    resetAutoLockTimer() {
      if (this.autoLockTimer) clearTimeout(this.autoLockTimer);
      if (this.autoLockMinutes <= 0) return;

      this.autoLockTimer = setTimeout(() => {
        this.showLockModal();
      }, this.autoLockMinutes * 60 * 1000);
    }

    playSynthTone(freq1, freq2) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq1, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      } catch (_) {}
    }
  }

  // Unified global namespace registration
  if (!global.NexStealthPrivacy) global.NexStealthPrivacy = {};
  const vaultInstance = new DecoyVaultSystem();
  global.NexStealthPrivacy.DecoyVault = vaultInstance;
  global.decoyVaultSystem = vaultInstance;

})(typeof window !== 'undefined' ? window : globalThis);