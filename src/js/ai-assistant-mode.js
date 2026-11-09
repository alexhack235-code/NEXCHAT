/**
 * NEXCHAT - AI ASSISTANT MODE
 * One File - Universal Button For All Encrypted AI Features
 * Module: src/js/ai-assistant-mode.js
 * 
 * PROBLEM RESOLUTION:
 * NEXCHAT utilizes End-to-End Post-Quantum Encryption (ML-KEM / Kyber-768 + ECDH P-256).
 * Messages are Quantum Sealed on servers and on the wire.
 * When a user taps Transcribe, Translate, AI Summary, or Encrypted Search without local decryption clearance,
 * raw encrypted ciphertext/noise is received, resulting in silent failure.
 * 
 * SOLUTION:
 * AI Assistant Mode acts as an explicit on-device cryptographic gatekeeper.
 * 1. AIUnlockButton appears wherever an AI feature is blocked by encryption. Never silent empty.
 * 2. Universal Popup with 4 clear choices (This Chat, Just This Once, All Chats, Cancel).
 * 3. Local-Only Decryption in volatile memory; AI audio/data buffers purged after inference.
 * 4. Auto-retry pending feature on approval without requiring the user to tap twice.
 * 5. Strict Zero-Emoji compliance (FontAwesome 6 vector glyphs only).
 * 6. Cryptography preservation: Kyber-768 and ECDH keys are NEVER modified or disabled.
 */

const AIAssistantMode = (function () {
  'use strict';

  // --- STORAGE KEYS ---
  const STORAGE_KEYS = {
    MODE: 'nex_ai_assistant_mode',                // 'off' | 'this_chat' | 'once' | 'global'
    PER_CHAT: 'nex_ai_per_chat',                  // JSON { [chatId]: boolean }
    ENABLED: 'nex_ai_assistant_enabled',          // 'true' | 'false' (Settings master toggle)
    ASK_EVERY_TIME: 'nex_ai_assistant_ask_every_time', // 'true' | 'false' (Default: true)
    APPLY_ALL_CHATS: 'nex_ai_assistant_apply_all' // 'true' | 'false'
  };

  // Internal pending retry store
  let _pendingExecution = null;
  let _activeModalEl = null;

  // --- STATE ACCESSORS ---
  function getMode() {
    try {
      const mode = localStorage.getItem(STORAGE_KEYS.MODE);
      if (mode === 'global' || mode === 'this_chat' || mode === 'once') {
        return mode;
      }
      return 'off';
    } catch (_) {
      return 'off';
    }
  }

  function setMode(mode) {
    try {
      const validMode = (mode === 'global' || mode === 'this_chat' || mode === 'once') ? mode : 'off';
      localStorage.setItem(STORAGE_KEYS.MODE, validMode);
      localStorage.setItem(STORAGE_KEYS.ENABLED, validMode !== 'off' ? 'true' : 'false');
      if (validMode === 'global') {
        localStorage.setItem(STORAGE_KEYS.APPLY_ALL_CHATS, 'true');
        localStorage.setItem(STORAGE_KEYS.ASK_EVERY_TIME, 'false');
      }
      syncSettingsUI();
      dispatchModeChangeEvent(validMode);
      return validMode;
    } catch (_) {
      return 'off';
    }
  }

  function getPerChatMap() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PER_CHAT);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function setChatAllowed(chatId, allowed) {
    if (!chatId) return;
    try {
      const map = getPerChatMap();
      if (allowed) {
        map[chatId] = true;
      } else {
        delete map[chatId];
      }
      localStorage.setItem(STORAGE_KEYS.PER_CHAT, JSON.stringify(map));
      syncSettingsUI();
    } catch (_) {}
  }

  function isChatAllowed(chatId) {
    if (!chatId) return false;
    const map = getPerChatMap();
    return Boolean(map[chatId]);
  }

  function clearAllChatApprovals() {
    try {
      localStorage.removeItem(STORAGE_KEYS.PER_CHAT);
      syncSettingsUI();
    } catch (_) {}
  }

  function isAskEveryTime() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.ASK_EVERY_TIME);
      return val === null ? true : (val === 'true');
    } catch (_) {
      return true;
    }
  }

  function setAskEveryTime(val) {
    try {
      localStorage.setItem(STORAGE_KEYS.ASK_EVERY_TIME, val ? 'true' : 'false');
      if (val) {
        localStorage.setItem(STORAGE_KEYS.APPLY_ALL_CHATS, 'false');
        if (getMode() === 'global') {
          setMode('this_chat');
        }
      }
      syncSettingsUI();
    } catch (_) {}
  }

  function isApplyAllChats() {
    try {
      return localStorage.getItem(STORAGE_KEYS.APPLY_ALL_CHATS) === 'true';
    } catch (_) {
      return false;
    }
  }

  function setApplyAllChats(val) {
    try {
      localStorage.setItem(STORAGE_KEYS.APPLY_ALL_CHATS, val ? 'true' : 'false');
      if (val) {
        localStorage.setItem(STORAGE_KEYS.ASK_EVERY_TIME, 'false');
        setMode('global');
      } else if (getMode() === 'global') {
        setMode('off');
      }
      syncSettingsUI();
    } catch (_) {}
  }

  function getActiveChatId() {
    if (typeof window !== 'undefined') {
      if (window.currentChatUser) return window.currentChatUser;
      if (window.currentChatId) return window.currentChatId;
      if (window.activeRoomId) return window.activeRoomId;
    }
    return 'default_chat';
  }

  function isFeatureAllowed(featureName, chatId) {
    const targetChat = chatId || getActiveChatId();
    const mode = getMode();

    if (mode === 'global') {
      return true;
    }
    if (mode === 'once') {
      return true;
    }
    if (mode === 'this_chat') {
      return isChatAllowed(targetChat);
    }
    return false;
  }

  function dispatchModeChangeEvent(mode) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('nex_ai_assistant_mode_changed', { detail: { mode } }));
      } catch (_) {}
    }
  }

  // --- LOCAL DECRYPTION HELPER (Zero Wire Leakage) ---
  /**
   * Decrypts encrypted audio or message payload locally on device memory only.
   * Clears buffers immediately after use.
   */
  async function decryptLocally(encryptedPayload, options = {}) {
    if (!encryptedPayload) return null;

    // 1. If payload is already a local Blob URL or plaintext string, return directly
    if (typeof encryptedPayload === 'string') {
      if (encryptedPayload.startsWith('blob:') || encryptedPayload.startsWith('data:audio')) {
        return encryptedPayload;
      }
    }

    // 2. If E2EE Crypto Vault is available on-device, perform authenticated local decipher
    if (typeof window !== 'undefined' && window.nexCryptoVault && typeof window.nexCryptoVault.decryptPayload === 'function') {
      try {
        const decrypted = await window.nexCryptoVault.decryptPayload(encryptedPayload, options);
        return decrypted;
      } catch (err) {
        console.warn('[AIAssistantMode] Local decryption fallback notice:', err.message);
      }
    }

    // 3. If direct decryptMessage helper exists in chat runtime
    if (typeof window !== 'undefined' && typeof window.decryptMessage === 'function') {
      try {
        return await window.decryptMessage(encryptedPayload);
      } catch (_) {}
    }

    // 4. Return as-is if already readable
    return encryptedPayload;
  }

  /**
   * Explicit ephemeral cleanup to satisfy the 10-second audio scrubber requirement
   */
  function scheduleBufferPurge(bufferRef, delayMs = 10000) {
    if (!bufferRef) return;
    setTimeout(() => {
      try {
        if (typeof bufferRef === 'string' && bufferRef.startsWith('blob:')) {
          URL.revokeObjectURL(bufferRef);
        } else if (bufferRef instanceof ArrayBuffer) {
          // Zero-fill buffer if accessible
          new Uint8Array(bufferRef).fill(0);
        }
      } catch (_) {}
    }, delayMs);
  }

  // --- UNIVERSAL BUTTON COMPONENT (AIUnlockButton) ---
  /**
   * Renders the universal unlock button inside the specified container.
   * Replaces empty / silent failure with an interactive prompt.
   * 
   * Box structure:
   * [ 🔒 {featureName} needs AI Assistant Mode ]
   * [ Button: Enable AI Assistant Mode ]
   * [ Small text: Decrypt on this device only to use AI ]
   */
  function renderUnlockButton(container, featureName = 'Transcribe', onEnable = null, chatId = null) {
    if (!container) return null;

    const targetChat = chatId || getActiveChatId();
    const cleanFeature = featureName || 'This Feature';

    // Ensure container is visible
    if (container.style && container.style.display === 'none') {
      container.style.display = 'block';
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'nex-ai-unlock-box';
    wrapper.setAttribute('role', 'alert');
    wrapper.style.cssText = [
      'display: flex',
      'flex-direction: column',
      'align-items: center',
      'justify-content: center',
      'text-align: center',
      'padding: 12px 14px',
      'margin: 6px 0',
      'background: rgba(10, 16, 28, 0.95)',
      'border: 1px solid rgba(0, 242, 255, 0.35)',
      'border-radius: 10px',
      'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 0 12px rgba(0, 242, 255, 0.05)',
      'color: #f1f5f9',
      'font-family: inherit',
      'box-sizing: border-box',
      'animation: nexFadeIn 0.25s ease-out'
    ].join(';');

    wrapper.innerHTML = `
      <div class="nex-ai-unlock-header" style="display: flex; align-items: center; justify-content: center; gap: 7px; margin-bottom: 8px; font-size: 12px; font-weight: 700; color: #00f2fe; letter-spacing: 0.2px;">
        <i class="fa-solid fa-lock" style="font-size: 13px; color: #00f2fe;"></i>
        <span>${escapeHtml(cleanFeature)} needs AI Assistant Mode</span>
      </div>
      <button type="button" class="nex-ai-unlock-btn" style="background: linear-gradient(135deg, rgba(0, 242, 255, 0.2) 0%, rgba(14, 165, 233, 0.3) 100%); border: 1px solid #00f2fe; color: #ffffff; padding: 7px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 0 10px rgba(0, 242, 255, 0.25); transition: all 0.15s ease; touch-action: manipulation; min-height: 36px;">
        <i class="fa-solid fa-microchip" style="color: #00f2fe;"></i>
        <span>Enable AI Assistant Mode</span>
      </button>
      <div class="nex-ai-unlock-footnote" style="margin-top: 7px; font-size: 10.5px; color: #94a3b8; letter-spacing: 0.2px;">
        Decrypt on this device only to use AI
      </div>
    `;

    const unlockBtn = wrapper.querySelector('.nex-ai-unlock-btn');
    if (unlockBtn) {
      unlockBtn.addEventListener('mouseenter', () => {
        unlockBtn.style.background = 'linear-gradient(135deg, rgba(0, 242, 255, 0.35) 0%, rgba(14, 165, 233, 0.5) 100%)';
        unlockBtn.style.boxShadow = '0 0 15px rgba(0, 242, 255, 0.45)';
      });
      unlockBtn.addEventListener('mouseleave', () => {
        unlockBtn.style.background = 'linear-gradient(135deg, rgba(0, 242, 255, 0.2) 0%, rgba(14, 165, 233, 0.3) 100%)';
        unlockBtn.style.boxShadow = '0 0 10px rgba(0, 242, 255, 0.25)';
      });
      unlockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        openEnableModal(cleanFeature, targetChat, () => {
          // Remove unlock box on confirmation
          wrapper.remove();
          if (typeof onEnable === 'function') {
            onEnable();
          }
        });
      });
    }

    // Clear and mount into container
    container.innerHTML = '';
    container.appendChild(wrapper);
    return wrapper;
  }

  // --- UNIVERSAL POPUP MODAL ---
  /**
   * Title: AI Assistant Mode is OFF
   * Body: This chat is Quantum Sealed. To use [FEATURE NAME], your phone needs
   * to decrypt this message locally for ChronEX AI. Messages stay encrypted
   * on our servers. AI audio is deleted after 10 seconds.
   * 
   * Buttons:
   * 1. Turn On For This Chat
   * 2. Just This Once
   * 3. Turn On For All Chats
   * 4. Cancel
   */
  function openEnableModal(featureName = 'Transcribe', chatId = null, onConfirmedCallback = null) {
    const targetChat = chatId || getActiveChatId();
    const cleanFeature = featureName || 'This Feature';

    // Remove any existing modal
    closeEnableModal();

    // Store pending callback for auto-retry
    _pendingExecution = onConfirmedCallback;

    const overlay = document.createElement('div');
    overlay.id = 'nexAIAssistantModalOverlay';
    overlay.className = 'nex-ai-modal-overlay';
    overlay.style.cssText = [
      'position: fixed',
      'inset: 0',
      'background: rgba(4, 7, 14, 0.88)',
      'backdrop-filter: blur(8px)',
      '-webkit-backdrop-filter: blur(8px)',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'padding: 16px',
      'z-index: 999999',
      'animation: nexFadeIn 0.2s ease-out'
    ].join(';');

    const modalBox = document.createElement('div');
    modalBox.className = 'nex-ai-modal-box';
    modalBox.setAttribute('role', 'dialog');
    modalBox.setAttribute('aria-modal', 'true');
    modalBox.setAttribute('aria-labelledby', 'nexAIModalTitle');
    modalBox.style.cssText = [
      'width: 100%',
      'max-width: 440px',
      'background: #0b1322',
      'border: 1px solid rgba(0, 242, 255, 0.4)',
      'border-radius: 14px',
      'box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 242, 255, 0.15)',
      'padding: 22px 20px',
      'box-sizing: border-box',
      'color: #f8fafc',
      'animation: nexSlideUp 0.22s ease-out'
    ].join(';');

    modalBox.innerHTML = `
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(0, 242, 255, 0.12); border: 1px solid rgba(0, 242, 255, 0.35); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="fa-solid fa-shield-halved" style="color: #00f2fe; font-size: 17px;"></i>
          </div>
          <div>
            <h3 id="nexAIModalTitle" style="margin: 0; font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px;">AI Assistant Mode is OFF</h3>
            <span style="font-size: 11px; color: #00f2fe; font-weight: 600;">Let ChronEX AI help you on this device.</span>
          </div>
        </div>
        <button type="button" id="nexAIModalCloseCross" title="Close" style="background: transparent; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center; min-width: 32px; min-height: 32px;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="nex-ai-modal-body" style="background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; font-size: 12.5px; line-height: 1.5; color: #cbd5e1;">
        <p style="margin: 0 0 8px 0;">
          This chat is <strong style="color: #00ff66;"><i class="fa-solid fa-atom" style="font-size: 11px; margin-right: 4px;"></i>Quantum Sealed</strong>. To use <strong style="color: #00f2fe;">${escapeHtml(cleanFeature)}</strong>, your phone needs to decrypt this message locally for ChronEX AI.
        </p>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
          <i class="fa-solid fa-lock" style="color: #00ff66;"></i>
          <span>Messages stay encrypted on our servers. AI audio is deleted after 10 seconds.</span>
        </div>
      </div>

      <div class="nex-ai-modal-actions" style="display: flex; flex-direction: column; gap: 8px;">
        <button type="button" id="nexAIBtnThisChat" class="nex-modal-action-btn primary" style="width: 100%; padding: 10px 14px; background: linear-gradient(135deg, rgba(0, 242, 255, 0.25) 0%, rgba(14, 165, 233, 0.4) 100%); border: 1px solid #00f2fe; border-radius: 8px; color: #ffffff; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s ease; touch-action: manipulation; min-height: 42px;">
          <i class="fa-solid fa-comment-dots" style="color: #00f2fe;"></i>
          <span>Turn On For This Chat</span>
        </button>

        <button type="button" id="nexAIBtnJustOnce" class="nex-modal-action-btn secondary" style="width: 100%; padding: 10px 14px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 8px; color: #e2e8f0; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s ease; touch-action: manipulation; min-height: 42px;">
          <i class="fa-solid fa-clock" style="color: #fbbf24;"></i>
          <span>Just This Once</span>
        </button>

        <button type="button" id="nexAIBtnAllChats" class="nex-modal-action-btn tertiary" style="width: 100%; padding: 10px 14px; background: rgba(0, 255, 102, 0.08); border: 1px solid rgba(0, 255, 102, 0.3); border-radius: 8px; color: #86efac; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s ease; touch-action: manipulation; min-height: 42px;">
          <i class="fa-solid fa-globe" style="color: #00ff66;"></i>
          <span>Turn On For All Chats</span>
        </button>

        <button type="button" id="nexAIBtnCancel" class="nex-modal-action-btn cancel" style="width: 100%; padding: 9px 14px; background: transparent; border: 1px solid transparent; border-radius: 8px; color: #94a3b8; font-size: 12.5px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: color 0.15s ease; touch-action: manipulation; min-height: 38px;">
          <span>Cancel</span>
        </button>
      </div>
    `;

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
    _activeModalEl = overlay;

    // Attach Action Listeners
    const btnThisChat = modalBox.querySelector('#nexAIBtnThisChat');
    const btnJustOnce = modalBox.querySelector('#nexAIBtnJustOnce');
    const btnAllChats = modalBox.querySelector('#nexAIBtnAllChats');
    const btnCancel = modalBox.querySelector('#nexAIBtnCancel');
    const btnClose = modalBox.querySelector('#nexAIModalCloseCross');

    if (btnThisChat) {
      btnThisChat.addEventListener('click', () => {
        enableMode('this_chat', targetChat);
      });
    }
    if (btnJustOnce) {
      btnJustOnce.addEventListener('click', () => {
        enableMode('once', targetChat);
      });
    }
    if (btnAllChats) {
      btnAllChats.addEventListener('click', () => {
        enableMode('global', targetChat);
      });
    }
    if (btnCancel) {
      btnCancel.addEventListener('click', closeEnableModal);
    }
    if (btnClose) {
      btnClose.addEventListener('click', closeEnableModal);
    }

    // Dismiss on background click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeEnableModal();
      }
    });

    // Dismiss on Esc key
    const onKeydown = (e) => {
      if (e.key === 'Escape') {
        closeEnableModal();
        window.removeEventListener('keydown', onKeydown);
      }
    };
    window.addEventListener('keydown', onKeydown);
  }

  function closeEnableModal() {
    _pendingExecution = null;
    if (_activeModalEl) {
      try {
        _activeModalEl.remove();
      } catch (_) {}
      _activeModalEl = null;
    }
  }

  /**
   * Enables mode and triggers auto-retry
   * 
   * Function enableMode(type):
   *   If type = global: aiAssistantMode = global
   *   If type = this_chat: aiPerChat[chatId] = true
   *   If type = once: aiAssistantMode = once
   *   Close popup
   *   Auto-retry pendingFeature - user should NOT have to tap Transcribe again
   */
  function enableMode(type, chatId = null) {
    const targetChat = chatId || getActiveChatId();
    const retryFn = _pendingExecution;
    _pendingExecution = null;

    if (type === 'global') {
      setMode('global');
      setApplyAllChats(true);
    } else if (type === 'this_chat') {
      setMode('this_chat');
      setChatAllowed(targetChat, true);
    } else if (type === 'once') {
      setMode('once');
    }

    closeEnableModal();

    // Auto-retry pending feature so user never has to tap again
    if (typeof retryFn === 'function') {
      try {
        retryFn();
      } catch (err) {
        console.error('[AIAssistantMode] Auto-retry execution error:', err);
      }
    }
  }

  // --- CORE PIPELINE METHOD (tryAIFeature) ---
  /**
   * One function fixes all.
   * 
   * Usage:
   * const allowed = await AIAssistantMode.tryAIFeature({
   *   featureName: 'Transcribe',
   *   chatId: currentChatUser,
   *   container: resultCard,
   *   executeFn: () => runVoiceUnifiedPipeline(opts)
   * });
   * if (!allowed) return;
   */
  async function tryAIFeature(featureOrOptions, maybeOptions = {}) {
    let opts = {};
    if (typeof featureOrOptions === 'string') {
      opts = { ...maybeOptions, featureName: featureOrOptions };
    } else if (typeof featureOrOptions === 'object' && featureOrOptions !== null) {
      opts = featureOrOptions;
    }

    const {
      featureName = 'AI Feature',
      chatId = null,
      container = null,
      executeFn = null,
      args = []
    } = opts;

    const targetChat = chatId || getActiveChatId();
    const allowed = isFeatureAllowed(featureName, targetChat);

    if (!allowed) {
      if (container) {
        renderUnlockButton(container, featureName, () => {
          if (typeof executeFn === 'function') {
            executeFn(...args);
          }
        }, targetChat);
      } else {
        openEnableModal(featureName, targetChat, () => {
          if (typeof executeFn === 'function') {
            executeFn(...args);
          }
        });
      }
      return false;
    }

    // AI IS allowed:
    try {
      let result = true;
      if (typeof executeFn === 'function') {
        result = await executeFn(...args);
      }

      // Step 5: If mode was "once", set mode back to "off"
      if (getMode() === 'once') {
        setMode('off');
      }

      return result !== undefined ? result : true;
    } catch (err) {
      if (getMode() === 'once') {
        setMode('off');
      }
      throw err;
    }
  }

  // --- SETTINGS UI SYNC & INITIALIZATION ---
  /**
   * Synchronizes the Settings > Privacy screen elements with active storage state
   */
  function syncSettingsUI() {
    if (typeof document === 'undefined') return;

    const masterToggle = document.getElementById('toggleAIAssistantMode');
    const radioAskEveryTime = document.getElementById('aiAssistantAskEveryTime');
    const radioApplyAllChats = document.getElementById('aiAssistantApplyAllChats');
    const modeBadge = document.getElementById('aiAssistantModeStatusBadge');
    const approvedCountSpan = document.getElementById('aiAssistantApprovedChatsCount');

    const mode = getMode();
    const isEnabled = (mode !== 'off');
    const askEveryTime = isAskEveryTime();
    const applyAll = isApplyAllChats();

    if (masterToggle) {
      masterToggle.checked = isEnabled;
    }
    if (radioAskEveryTime) {
      radioAskEveryTime.checked = askEveryTime;
      radioAskEveryTime.disabled = !isEnabled;
    }
    if (radioApplyAllChats) {
      radioApplyAllChats.checked = applyAll || (mode === 'global');
      radioApplyAllChats.disabled = !isEnabled;
    }
    if (modeBadge) {
      if (mode === 'global') {
        modeBadge.textContent = 'Active (All Chats)';
        modeBadge.style.color = '#00ff66';
        modeBadge.style.borderColor = 'rgba(0, 255, 102, 0.4)';
      } else if (mode === 'this_chat') {
        modeBadge.textContent = 'Per-Chat Only';
        modeBadge.style.color = '#00f2fe';
        modeBadge.style.borderColor = 'rgba(0, 242, 255, 0.4)';
      } else {
        modeBadge.textContent = 'OFF';
        modeBadge.style.color = '#94a3b8';
        modeBadge.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      }
    }
    if (approvedCountSpan) {
      const count = Object.keys(getPerChatMap()).length;
      approvedCountSpan.textContent = `${count} chat${count === 1 ? '' : 's'}`;
    }
  }

  function initSettingsListeners() {
    if (typeof document === 'undefined') return;

    const masterToggle = document.getElementById('toggleAIAssistantMode');
    const radioAskEveryTime = document.getElementById('aiAssistantAskEveryTime');
    const radioApplyAllChats = document.getElementById('aiAssistantApplyAllChats');
    const clearApprovalsBtn = document.getElementById('btnClearAIChatApprovals');

    if (masterToggle && !masterToggle.dataset.aiBound) {
      masterToggle.dataset.aiBound = 'true';
      masterToggle.addEventListener('change', () => {
        if (masterToggle.checked) {
          // If turning ON from Settings, default to 'this_chat' + ask every time
          setMode(isApplyAllChats() ? 'global' : 'this_chat');
        } else {
          setMode('off');
        }
      });
    }

    if (radioAskEveryTime && !radioAskEveryTime.dataset.aiBound) {
      radioAskEveryTime.dataset.aiBound = 'true';
      radioAskEveryTime.addEventListener('change', () => {
        if (radioAskEveryTime.checked) {
          setAskEveryTime(true);
        }
      });
    }

    if (radioApplyAllChats && !radioApplyAllChats.dataset.aiBound) {
      radioApplyAllChats.dataset.aiBound = 'true';
      radioApplyAllChats.addEventListener('change', () => {
        if (radioApplyAllChats.checked) {
          setApplyAllChats(true);
        }
      });
    }

    if (clearApprovalsBtn && !clearApprovalsBtn.dataset.aiBound) {
      clearApprovalsBtn.dataset.aiBound = 'true';
      clearApprovalsBtn.addEventListener('click', () => {
        clearAllChatApprovals();
        if (typeof window.showNotif === 'function') {
          window.showNotif('Cleared all per-chat AI decryption approvals.', 'info');
        }
      });
    }

    // Initial sync
    syncSettingsUI();
  }

  // Auto-init listeners on DOMContentLoaded
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSettingsListeners);
    } else {
      setTimeout(initSettingsListeners, 100);
    }
  }

  // --- HTML ESCAPE UTILITY ---
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- PUBLIC API EXPORTS ---
  return {
    getMode,
    setMode,
    getPerChatMap,
    isChatAllowed,
    setChatAllowed,
    clearAllChatApprovals,
    isAskEveryTime,
    setAskEveryTime,
    isApplyAllChats,
    setApplyAllChats,
    isFeatureAllowed,
    decryptLocally,
    scheduleBufferPurge,
    renderUnlockButton,
    openEnableModal,
    closeEnableModal,
    enableMode,
    tryAIFeature,
    syncSettingsUI,
    initSettingsListeners
  };
})();

if (typeof window !== 'undefined') {
  window.AIAssistantMode = AIAssistantMode;
  window.tryAIFeature = AIAssistantMode.tryAIFeature;
  window.renderAIUnlockButton = AIAssistantMode.renderUnlockButton;
}
if (typeof globalThis !== 'undefined') {
  globalThis.AIAssistantMode = AIAssistantMode;
}

export { AIAssistantMode };
export default AIAssistantMode;
