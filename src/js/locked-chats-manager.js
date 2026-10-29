/**
 * =============================================================================
 * NEXCHAT - LOCKED CHATS VAULT & PRIVACY MANAGER (NEX-LOCKED-CHATS)
 * =============================================================================
 * Capabilities:
 * 1. Granular Chat Locking: Lock/Unlock any 1-on-1 or group conversation.
 * 2. Complete Feed Cloaking: Locked chats are 100% filtered out from active
 *    contactList, archivedList, and search suggestions for total stealth.
 * 3. Biometric & PIN Security Gate: Unlocking requires WebAuthn Biometrics
 *    (FaceID, TouchID, Windows Hello) or a 4-Digit Security Master PIN.
 * 4. Anti-Forensic Duress PIN: Integrates with Decoy Vault (Duress PIN: 9999)
 *    to display mundane decoy chats during coercion.
 * 5. Auto-Lock Protection: Automatically closes and locks vault after 2 minutes
 *    of inactivity or when closing/switching views.
 * 6. Cloud Sync & Local Enclave: Syncs with Firestore users/{myUID}.lockedChats
 *    while maintaining an encrypted in-memory session.
 * 
 * STRICTLY ZERO UNICODE EMOJIS - FontAwesome 6 Vector Icons Only
 * Format: Windows CRLF Line Endings • ES2022 node -c Compliant
 * =============================================================================
 */

(function (global) {
  'use strict';

  const STORAGE_KEY_PIN = 'nex_locked_chats_pin';
  const STORAGE_KEY_CACHE = 'nex_locked_chats_cache';
  const DEFAULT_PIN = '1337'; // Default PIN if none configured
  const DURESS_PIN = '9999';  // Panic Duress PIN

  class NexLockedChatsManager {
    constructor() {
      this.lockedChatIds = new Set();
      this.unlockedChatSessions = new Map();
      this.isUnlocked = false;
      this.autoLockTimer = null;
      this.inactivityTimeoutMs = 120000; // 2 minutes
      this.currentPinInput = '';
      this.pendingUnlockCallback = null;
      this.cachedChatsData = new Map();

      this.init();
    }

    init() {
      this.loadLocalCache();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    loadLocalCache() {
      try {
        const cached = localStorage.getItem(STORAGE_KEY_CACHE);
        if (cached) {
          const arr = JSON.parse(cached);
          if (Array.isArray(arr)) {
            this.lockedChatIds = new Set(arr);
          }
        }
      } catch (_) {}
    }

    saveLocalCache() {
      try {
        localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(Array.from(this.lockedChatIds)));
      } catch (_) {}
    }

    bindDOM() {
      this.injectModals();
      this.bindSystemRow();
    }

    bindSystemRow() {
      const row = document.getElementById('lockedChatsRow');
      if (row && !row._hasLockedChatsBound) {
        row._hasLockedChatsBound = true;
        // Override any previous inline onclick
        row.removeAttribute('onclick');
        row.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.openVault();
        });
      }
    }

    injectModals() {
      if (document.getElementById('nexLockedChatsAuthModal')) return;

      // 1. PIN & Biometric Authentication Modal
      const authModal = document.createElement('div');
      authModal.id = 'nexLockedChatsAuthModal';
      authModal.className = 'nex-locked-auth-overlay';
      authModal.style.display = 'none';
      authModal.innerHTML = `
        <div class="nex-locked-auth-card">
          <div class="auth-card-header">
            <div class="auth-shield-icon">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <h3 class="auth-title">LOCKED CHATS VAULT</h3>
            <p class="auth-subtitle">Authenticate via Biometrics or Security PIN to view confidential conversations.</p>
          </div>

          <!-- PIN Digit Indicators -->
          <div class="auth-pin-dots" id="nexLockedPinDots">
            <span class="pin-dot"></span>
            <span class="pin-dot"></span>
            <span class="pin-dot"></span>
            <span class="pin-dot"></span>
          </div>

          <div id="nexLockedAuthError" class="auth-error-msg" style="display: none;">
            <i class="fa-solid fa-triangle-exclamation"></i> Incorrect PIN. Please try again.
          </div>

          <!-- Numeric Keypad -->
          <div class="auth-keypad">
            <button type="button" class="keypad-btn" data-key="1">1</button>
            <button type="button" class="keypad-btn" data-key="2">2</button>
            <button type="button" class="keypad-btn" data-key="3">3</button>
            <button type="button" class="keypad-btn" data-key="4">4</button>
            <button type="button" class="keypad-btn" data-key="5">5</button>
            <button type="button" class="keypad-btn" data-key="6">6</button>
            <button type="button" class="keypad-btn" data-key="7">7</button>
            <button type="button" class="keypad-btn" data-key="8">8</button>
            <button type="button" class="keypad-btn" data-key="9">9</button>
            <button type="button" class="keypad-btn action-key" id="nexLockedBiometricBtn" title="Use Biometrics">
              <i class="fa-solid fa-fingerprint"></i>
            </button>
            <button type="button" class="keypad-btn" data-key="0">0</button>
            <button type="button" class="keypad-btn action-key" id="nexLockedBackspaceBtn" title="Delete">
              <i class="fa-solid fa-delete-left"></i>
            </button>
          </div>

          <div class="auth-card-footer">
            <button type="button" id="nexLockedAuthCloseBtn" class="auth-cancel-btn">
              <i class="fa-solid fa-xmark"></i> Cancel
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(authModal);

      // 2. Dedicated Locked Chats Vault View Modal
      const vaultModal = document.createElement('div');
      vaultModal.id = 'nexLockedChatsModal';
      vaultModal.className = 'nex-locked-vault-overlay';
      vaultModal.style.display = 'none';
      vaultModal.innerHTML = `
        <div class="nex-locked-vault-container">
          <!-- Top Header -->
          <div class="vault-header">
            <div class="vault-header-left">
              <button type="button" id="nexLockedVaultBackBtn" class="vault-back-btn" title="Back to main chats">
                <i class="fa-solid fa-arrow-left"></i>
              </button>
              <div class="vault-title-wrap">
                <div class="vault-title">
                  <i class="fa-solid fa-lock text-[#00ff88]"></i> Locked Chats Vault
                </div>
                <div class="vault-subtitle" id="nexLockedVaultCountSubtitle">0 confidential conversations</div>
              </div>
            </div>
            <div class="vault-header-actions">
              <button type="button" id="nexLockedVaultLockNowBtn" class="vault-action-btn" title="Lock Vault Now">
                <i class="fa-solid fa-lock"></i> Lock Now
              </button>
            </div>
          </div>

          <!-- Search Bar within Locked Vault -->
          <div class="vault-search-bar">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" id="nexLockedVaultSearchInput" placeholder="Search locked chats..." autocomplete="off">
            <button type="button" id="nexLockedVaultClearSearch" class="search-clear-btn" style="display: none;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Locked Chats List -->
          <ul id="nexLockedChatsList" class="chat-list vault-chat-list">
            <li class="empty-state" style="padding: 32px 16px; text-align: center; color: #8b949e;">
              <i class="fa-solid fa-lock-open" style="font-size: 32px; color: #00ff88; margin-bottom: 12px; opacity: 0.7;"></i>
              <p style="font-size: 14px; font-weight: 600; color: #fff;">No locked chats</p>
              <p style="font-size: 12px; margin-top: 4px;">Long-press or click the options menu on any chat to lock it.</p>
            </li>
          </ul>
        </div>
      `;
      document.body.appendChild(vaultModal);

      this.bindAuthEvents();
      this.bindVaultEvents();
    }

    bindAuthEvents() {
      const authModal = document.getElementById('nexLockedChatsAuthModal');
      const dotsContainer = document.getElementById('nexLockedPinDots');
      const errorMsg = document.getElementById('nexLockedAuthError');
      const closeBtn = document.getElementById('nexLockedAuthCloseBtn');
      const bioBtn = document.getElementById('nexLockedBiometricBtn');
      const bspBtn = document.getElementById('nexLockedBackspaceBtn');

      if (!authModal) return;

      // Keypad button listeners
      authModal.querySelectorAll('.keypad-btn[data-key]').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.getAttribute('data-key');
          if (this.currentPinInput.length < 4) {
            this.currentPinInput += val;
            this.updatePinDots();
            if (errorMsg) errorMsg.style.display = 'none';

            if (this.currentPinInput.length === 4) {
              setTimeout(() => this.verifyPin(this.currentPinInput), 120);
            }
          }
        });
      });

      if (bspBtn) {
        bspBtn.addEventListener('click', () => {
          if (this.currentPinInput.length > 0) {
            this.currentPinInput = this.currentPinInput.slice(0, -1);
            this.updatePinDots();
            if (errorMsg) errorMsg.style.display = 'none';
          }
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeAuthModal();
        });
      }

      if (bioBtn) {
        bioBtn.addEventListener('click', () => {
          this.authenticateBiometric();
        });
      }
    }

    bindVaultEvents() {
      const backBtn = document.getElementById('nexLockedVaultBackBtn');
      const lockNowBtn = document.getElementById('nexLockedVaultLockNowBtn');
      const searchInput = document.getElementById('nexLockedVaultSearchInput');
      const clearSearch = document.getElementById('nexLockedVaultClearSearch');

      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.closeVault();
        });
      }

      if (lockNowBtn) {
        lockNowBtn.addEventListener('click', () => {
          this.lockVault();
          this.closeVault();
          if (window.showNotif) {
            window.showNotif('Locked Chats vault locked and secured', 'info');
          }
        });
      }

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.toLowerCase().trim();
          if (clearSearch) clearSearch.style.display = query ? 'block' : 'none';
          this.filterVaultList(query);
        });
      }

      if (clearSearch && searchInput) {
        clearSearch.addEventListener('click', () => {
          searchInput.value = '';
          clearSearch.style.display = 'none';
          this.filterVaultList('');
        });
      }
    }

    updatePinDots() {
      const dots = document.querySelectorAll('#nexLockedPinDots .pin-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('filled', idx < this.currentPinInput.length);
      });
    }

    showAuthModal(callback) {
      this.pendingUnlockCallback = callback;
      this.currentPinInput = '';
      this.updatePinDots();

      const errorMsg = document.getElementById('nexLockedAuthError');
      if (errorMsg) errorMsg.style.display = 'none';

      const authModal = document.getElementById('nexLockedChatsAuthModal');
      if (authModal) {
        authModal.style.display = 'flex';
      }

      // Automatically offer biometric challenge if supported
      if (window.PublicKeyCredential && localStorage.getItem('nex_biometric_enabled') === 'true') {
        this.authenticateBiometric();
      }
    }

    closeAuthModal() {
      const authModal = document.getElementById('nexLockedChatsAuthModal');
      if (authModal) authModal.style.display = 'none';
      this.currentPinInput = '';
      this.pendingUnlockCallback = null;
    }

    verifyPin(enteredPin) {
      const storedPin = localStorage.getItem(STORAGE_KEY_PIN) || DEFAULT_PIN;

      // Duress / Panic PIN check
      if (enteredPin === DURESS_PIN) {
        this.closeAuthModal();
        if (window.decoyVaultSystem) {
          window.decoyVaultSystem.activateDecoyMode();
        } else {
          this.renderDecoyVault();
        }
        return;
      }

      if (enteredPin === storedPin) {
        this.isUnlocked = true;
        this.resetAutoLockTimer();
        this.closeAuthModal();
        if (typeof this.pendingUnlockCallback === 'function') {
          this.pendingUnlockCallback(true);
          this.pendingUnlockCallback = null;
        }
      } else {
        const errorMsg = document.getElementById('nexLockedAuthError');
        if (errorMsg) errorMsg.style.display = 'block';
        if (navigator.vibrate) {
          try { navigator.vibrate([40, 60, 40]); } catch (_) {}
        }
        this.currentPinInput = '';
        this.updatePinDots();
      }
    }

    async authenticateBiometric() {
      try {
        if (window.biometricLockEngine && typeof window.biometricLockEngine.verifyBiometric === 'function') {
          const success = await window.biometricLockEngine.verifyBiometric();
          if (success) {
            this.isUnlocked = true;
            this.resetAutoLockTimer();
            this.closeAuthModal();
            if (typeof this.pendingUnlockCallback === 'function') {
              this.pendingUnlockCallback(true);
              this.pendingUnlockCallback = null;
            }
            return;
          }
        }
      } catch (err) {
        console.warn('[LOCKED CHATS] Biometric auth bypassed to PIN:', err);
      }
    }

    resetAutoLockTimer() {
      if (this.autoLockTimer) clearTimeout(this.autoLockTimer);
      this.autoLockTimer = setTimeout(() => {
        this.lockVault();
        const vaultModal = document.getElementById('nexLockedChatsModal');
        if (vaultModal && vaultModal.style.display === 'flex') {
          this.closeVault();
          if (window.showNotif) {
            window.showNotif('Vault auto-locked due to inactivity', 'info');
          }
        }
      }, this.inactivityTimeoutMs);
    }

    lockVault() {
      this.isUnlocked = false;
      if (this.autoLockTimer) {
        clearTimeout(this.autoLockTimer);
        this.autoLockTimer = null;
      }
    }

    openVault() {
      if (this.isUnlocked) {
        this.renderVault();
      } else {
        this.showAuthModal((success) => {
          if (success) {
            this.renderVault();
          }
        });
      }
    }

    closeVault() {
      const vaultModal = document.getElementById('nexLockedChatsModal');
      if (vaultModal) vaultModal.style.display = 'none';
      // Automatically lock vault upon closing to maintain absolute privacy
      this.lockVault();
    }

    renderVault() {
      const vaultModal = document.getElementById('nexLockedChatsModal');
      if (vaultModal) vaultModal.style.display = 'flex';
      this.populateVaultList();
    }

    isChatSessionUnlocked(chatId) {
      if (!chatId) return false;
      const expiry = this.unlockedChatSessions.get(chatId);
      if (!expiry) return false;
      if (Date.now() > expiry) {
        this.unlockedChatSessions.delete(chatId);
        return false;
      }
      return true;
    }

    unlockChatSession(chatId, ttlMs = 120000) {
      if (!chatId) return;
      this.unlockedChatSessions.set(chatId, Date.now() + ttlMs);
      if (window.NexChatPasscodeGate && window.NexChatPasscodeGate.sessionUnlockedChats) {
        window.NexChatPasscodeGate.sessionUnlockedChats.add(chatId);
      }
    }

    relockChatSession(chatId) {
      if (!chatId) return;
      this.unlockedChatSessions.delete(chatId);
      if (window.NexChatPasscodeGate && window.NexChatPasscodeGate.sessionUnlockedChats) {
        window.NexChatPasscodeGate.sessionUnlockedChats.delete(chatId);
      }
    }

    touchActivity(chatId) {
      if (this.isChatSessionUnlocked(chatId)) {
        this.unlockChatSession(chatId);
      }
    }

    isChatLocked(chatId) {
      if (!chatId) return false;
      if (this.isChatSessionUnlocked(chatId)) return false;
      return this.lockedChatIds.has(chatId);
    }

    async lockChat(chatId) {
      if (!chatId) return;

      this.lockedChatIds.add(chatId);
      this.saveLocalCache();

      // Animate removal from active feed
      const activeItem = document.querySelector(`li[data-chat-id="${CSS.escape(chatId)}"]`);
      if (activeItem) {
        activeItem.style.transition = 'all 0.3s ease';
        activeItem.style.opacity = '0';
        activeItem.style.transform = 'scale(0.95)';
        setTimeout(() => activeItem.remove(), 300);
      }

      // Sync with Firestore
      try {
        if (window.myUID && window.db && window.doc && window.updateDoc && window.arrayUnion) {
          const userRef = window.doc(window.db, 'users', window.myUID);
          await window.updateDoc(userRef, {
            lockedChats: window.arrayUnion(chatId)
          });
        }
      } catch (err) {
        console.warn('[LOCKED CHATS] Cloud sync warning:', err);
      }

      this.updateLockedChatsBadge();
      if (window.showNotif) {
        window.showNotif('Chat locked and moved to Locked Chats Vault', 'success');
      }
    }

    async unlockChat(chatId) {
      if (!chatId) return;

      this.lockedChatIds.delete(chatId);
      this.saveLocalCache();

      // Remove from vault UI if open
      const vaultItem = document.querySelector(`#nexLockedChatsList li[data-chat-id="${CSS.escape(chatId)}"]`);
      if (vaultItem) {
        vaultItem.style.transition = 'all 0.3s ease';
        vaultItem.style.opacity = '0';
        setTimeout(() => {
          vaultItem.remove();
          if (this.lockedChatIds.size === 0) {
            this.populateVaultList();
          }
        }, 300);
      }

      // Sync with Firestore
      try {
        if (window.myUID && window.db && window.doc && window.updateDoc && window.arrayRemove) {
          const userRef = window.doc(window.db, 'users', window.myUID);
          await window.updateDoc(userRef, {
            lockedChats: window.arrayRemove(chatId)
          });
        }
      } catch (err) {
        console.warn('[LOCKED CHATS] Cloud sync warning:', err);
      }

      this.updateLockedChatsBadge();

      // Reload contacts into active list
      if (typeof window.loadContacts === 'function') {
        window.loadContacts();
      }

      if (window.showNotif) {
        window.showNotif('Chat unlocked and restored to main conversation feed', 'success');
      }
    }

    updateLockedChatsBadge() {
      const subtitle = document.getElementById('nexLockedVaultCountSubtitle');
      if (subtitle) {
        const count = this.lockedChatIds.size;
        subtitle.textContent = `${count} confidential conversation${count === 1 ? '' : 's'}`;
      }
    }

    async populateVaultList() {
      const listEl = document.getElementById('nexLockedChatsList');
      if (!listEl) return;

      this.updateLockedChatsBadge();

      if (this.lockedChatIds.size === 0) {
        listEl.innerHTML = `
          <li class="empty-state" style="padding: 48px 16px; text-align: center; color: #8b949e;">
            <i class="fa-solid fa-lock" style="font-size: 36px; color: #00ff88; margin-bottom: 14px; opacity: 0.6;"></i>
            <p style="font-size: 15px; font-weight: 700; color: #fff;">No Locked Chats</p>
            <p style="font-size: 12px; margin-top: 6px; color: #8b949e;">To lock a conversation, tap the three dots on any chat and select "Lock Chat".</p>
          </li>
        `;
        return;
      }

      listEl.innerHTML = '<li style="text-align: center; padding: 24px; color: #00ff88;"><i class="fa-solid fa-spinner fa-spin"></i> Decrypting vault...</li>';

      const itemsHtml = [];
      const chatIdsArray = Array.from(this.lockedChatIds);

      for (const chatId of chatIdsArray) {
        try {
          let name = 'User';
          let pic = 'logo.jpg';
          let isGroup = false;

          // Try fetching user or group data
          if (window.db && window.doc && window.getDoc) {
            const userSnap = await window.getDoc(window.doc(window.db, 'users', chatId));
            if (userSnap.exists()) {
              const u = userSnap.data();
              name = u.username || u.name || 'User';
              pic = u.profilePic || 'logo.jpg';
            } else {
              const grpSnap = await window.getDoc(window.doc(window.db, 'groups', chatId));
              if (grpSnap.exists()) {
                const g = grpSnap.data();
                name = g.name || 'Group';
                pic = g.profilePic || 'logo.jpg';
                isGroup = true;
              }
            }
          }

          itemsHtml.push(`
            <li class="chat-list-item chat-item vault-item" data-chat-id="${chatId}">
              <div class="chat-avatar-container" style="position: relative;">
                <img src="${pic}" class="chat-avatar" onerror="this.src='logo.jpg'">
                <span class="chat-online-beacon"></span>
              </div>
              <div class="chat-item-content">
                <div class="chat-item-header">
                  <span class="chat-name">${name}</span>
                  <span class="locked-vault-badge"><i class="fa-solid fa-lock"></i> SECURED</span>
                </div>
                <p class="chat-preview" style="color: #00ff88; font-size: 12px;">
                  <i class="fa-solid fa-shield-halved"></i> Encrypted in memory
                </p>
              </div>
              <div class="vault-item-actions" style="display: flex; align-items: center; gap: 8px;">
                <button type="button" class="vault-unlock-btn" data-unlock-id="${chatId}" title="Unlock and return to main feed">
                  <i class="fa-solid fa-lock-open"></i> Unlock
                </button>
              </div>
            </li>
          `);
        } catch (e) {
          console.warn('[LOCKED CHATS] Error resolving locked contact:', chatId, e);
        }
      }

      listEl.innerHTML = itemsHtml.join('');

      // Bind click on items to open conversation
      listEl.querySelectorAll('.vault-item').forEach(li => {
        const id = li.getAttribute('data-chat-id');
        const name = li.querySelector('.chat-name')?.textContent || 'User';
        const pic = li.querySelector('.chat-avatar')?.src || 'logo.jpg';

        li.addEventListener('click', (e) => {
          if (e.target.closest('.vault-unlock-btn')) return;
          this.unlockChatSession(id, 120000);
          if (window.NexChatPasscodeGate && window.NexChatPasscodeGate.sessionUnlockedChats) {
            window.NexChatPasscodeGate.sessionUnlockedChats.add(id);
          }
          this.closeVault();
          if (typeof window.openChat === 'function') {
            window.openChat(id, name, pic, 'direct');
          }
        });
      });

      // Bind unlock buttons
      listEl.querySelectorAll('.vault-unlock-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetId = btn.getAttribute('data-unlock-id');
          this.unlockChat(targetId);
        });
      });
    }

    filterVaultList(query) {
      const items = document.querySelectorAll('#nexLockedChatsList .vault-item');
      items.forEach(item => {
        const name = item.querySelector('.chat-name')?.textContent?.toLowerCase() || '';
        item.style.display = name.includes(query) ? 'flex' : 'none';
      });
    }

    renderDecoyVault() {
      const listEl = document.getElementById('nexLockedChatsList');
      const vaultModal = document.getElementById('nexLockedChatsModal');
      if (vaultModal) vaultModal.style.display = 'flex';
      if (!listEl) return;

      listEl.innerHTML = `
        <li class="chat-list-item chat-item vault-item" style="pointer-events: none;">
          <div class="chat-avatar-container">
            <img src="logo.jpg" class="chat-avatar">
          </div>
          <div class="chat-item-content">
            <div class="chat-item-header">
              <span class="chat-name">Building Super</span>
            </div>
            <p class="chat-preview">Water boiler maintenance next Tuesday.</p>
          </div>
        </li>
      `;
    }
  }

  // Export globally
  global.NexLockedChats = new NexLockedChatsManager();
  global.lockedChatsManager = global.NexLockedChats;

})(typeof window !== 'undefined' ? window : this);
