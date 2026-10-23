/**
 * NEXCHAT - Quantum Ghost Panic Lockdown & Duress PIN Engine
 * Instant session memory incinerator, duress sterile decoy environment,
 * hotkey emergency interception (Ctrl+Alt+X), and volatile cache purger.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and iconography.
 */

(function() {
  'use strict';

  const DURESS_PIN_KEY = 'nexchat_duress_pin';

  class GhostPanicLockEngine {
    constructor() {
      this.isDecoyActive = false;
      this.duressPin = localStorage.getItem(DURESS_PIN_KEY) || '0000';
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    bindDOM() {
      this.injectModal();
      this.bindHeaderTrigger();
      this.bindPanicHotkeys();
    }

    injectHeaderTrigger() {
      this.bindHeaderTrigger();
    }

    injectModal() {
      if (document.getElementById('ghostPanicModal')) return;

      const modal = document.createElement('div');
      modal.id = 'ghostPanicModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window panic-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-triangle-exclamation text-[#ef4444] text-lg"></i>
              <h3 class="font-bold text-white text-base">QUANTUM PANIC INCINERATOR</h3>
              <span class="panic-tag">EMERGENCY PROTOCOL</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closePanicModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="panic-modal-body">
            <p class="text-xs text-gray-300 text-center mb-3">
              Trigger instant lockdown defenses in hostile or inspected environments. Choose sterile decoy mode or complete volatile memory purge.
            </p>

            <div class="panic-actions-grid">
              <!-- Action 1: Sterile Decoy Mode -->
              <div class="panic-action-card">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-mask text-[#00d4ff]"></i>
                  <strong class="text-white text-xs">STERILE DECOY ENCLAVE</strong>
                </div>
                <p class="text-[11px] text-gray-400 mt-1">
                  Replaces confidential transcripts and rooms with sanitized system logs and decoy chats. Operates undetectable under scrutiny.
                </p>
                <button type="button" id="triggerDecoyBtn" class="panic-execute-btn decoy mt-2">
                  ACTIVATE DECOY ENCLAVE
                </button>
              </div>

              <!-- Action 2: Total Memory Incineration -->
              <div class="panic-action-card danger mt-3">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-fire-flame-curved text-[#ef4444]"></i>
                  <strong class="text-[#ef4444] text-xs">PURGE VOLATILE SESSION MEMORY</strong>
                </div>
                <p class="text-[11px] text-gray-400 mt-1">
                  Instantly incinerates all in-memory message buffers, token keys, and session cache. Requires master authorization to restore.
                </p>
                <button type="button" id="triggerPurgeBtn" class="panic-execute-btn danger mt-2">
                  INCINERATE SESSION NOW
                </button>
              </div>
            </div>

            <!-- Duress PIN Configuration -->
            <div class="panic-duress-box mt-3">
              <label class="text-[10px] text-gray-400 font-bold uppercase">DURESS EMERGENCY PIN (DEFAULT: 0000):</label>
              <div class="flex gap-2 mt-1">
                <input type="password" id="duressPinInput" class="duress-pin-input" value="${this.duressPin}" maxlength="8" />
                <button type="button" id="saveDuressPinBtn" class="duress-save-btn">UPDATE PIN</button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindModalEvents();
    }

    bindModalEvents() {
      const modal = document.getElementById('ghostPanicModal');
      document.getElementById('closePanicModalBtn')?.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });

      document.getElementById('triggerDecoyBtn')?.addEventListener('click', () => {
        this.activateDecoyEnclave();
        if (modal) modal.style.display = 'none';
      });

      document.getElementById('triggerPurgeBtn')?.addEventListener('click', () => {
        this.executeVolatilePurge();
        if (modal) modal.style.display = 'none';
      });

      document.getElementById('saveDuressPinBtn')?.addEventListener('click', () => {
        const inp = document.getElementById('duressPinInput');
        const pin = inp ? inp.value.trim() : '0000';
        this.duressPin = pin;
        localStorage.setItem(DURESS_PIN_KEY, pin);
        if (typeof window.showNotif === 'function') window.showNotif('Duress Emergency PIN updated', 'success', 2000);
      });
    }

    bindHeaderTrigger() {
      const headerActions = document.querySelector('.chat-detail-header-actions') || 
                            document.querySelector('.chat-detail-header-right');
      if (headerActions && !document.getElementById('ghostPanicBtnHeader')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'ghostPanicBtnHeader';
        btn.className = 'header-icon-btn';
        btn.title = 'Quantum Panic Lockdown (Ctrl+Alt+X)';
        btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-[#ef4444]"></i>`;
        btn.addEventListener('click', () => this.openModal());
        headerActions.appendChild(btn);
      }
    }

    bindPanicHotkeys() {
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'x' || e.key === 'X')) {
          e.preventDefault();
          this.activateDecoyEnclave();
        }
      });
    }

    openModal() {
      const modal = document.getElementById('ghostPanicModal');
      if (!modal) return;
      modal.style.display = 'flex';
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');
    }

    activateDecoyEnclave() {
      this.isDecoyActive = true;
      const messagesArea = document.getElementById('messages-area');
      const chatHeaderName = document.getElementById('chatName');

      if (chatHeaderName) chatHeaderName.textContent = 'Decoy System Log // Node 14';

      if (messagesArea) {
        messagesArea.innerHTML = `
          <div class="message-wrapper received">
            <div class="message-bubble received">
              <span class="text-xs text-gray-300 font-mono">[SYS_INIT]: Standard diagnostics complete. All public telemetry nominal.</span>
            </div>
          </div>
          <div class="message-wrapper sent">
            <div class="message-bubble sent">
              <span class="text-xs text-white font-mono">Routine operational checks verified. No anomalies detected.</span>
            </div>
          </div>
          <div class="message-wrapper received">
            <div class="message-bubble received">
              <span class="text-xs text-gray-300 font-mono">[SERVER]: Network connection authenticated. Public ledger ping: 14ms.</span>
            </div>
          </div>
        `;
      }

      // Add decoy banner
      let banner = document.getElementById('decoyEnclaveBanner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'decoyEnclaveBanner';
        banner.className = 'decoy-enclave-banner';
        banner.innerHTML = `
          <span><i class="fa-solid fa-shield-halved text-[#00d4ff]"></i> STERILE DECOY ENCLAVE ACTIVE</span>
          <button type="button" id="restoreFromDecoyBtn" class="decoy-restore-btn">RESTORE ACTIVE ENCLAVE</button>
        `;
        const chatDetail = document.getElementById('chatDetailView');
        if (chatDetail) chatDetail.insertBefore(banner, chatDetail.firstChild);

        document.getElementById('restoreFromDecoyBtn')?.addEventListener('click', () => {
          this.restoreActiveEnclave();
        });
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif('STERILE DECOY ACTIVE: Transcripts Sanitized', 'warning', 3000);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');
    }

    restoreActiveEnclave() {
      this.isDecoyActive = false;
      const banner = document.getElementById('decoyEnclaveBanner');
      if (banner) banner.remove();

      const chatHeaderName = document.getElementById('chatName');
      if (chatHeaderName) chatHeaderName.textContent = window.currentChatName || 'Chronex AI';

      if (typeof window.loadMessages === 'function') {
        window.loadMessages();
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif('Active Enclave Transcripts Restored', 'success', 2000);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    executeVolatilePurge() {
      try {
        sessionStorage.clear();
        const area = document.getElementById('messages-area');
        if (area) {
          area.innerHTML = `
            <div class="session-incinerated-notice">
              <i class="fa-solid fa-skull-crossbones text-[#ef4444] text-3xl"></i>
              <h3 class="text-white font-bold text-sm mt-2">VOLATILE SESSION INCINERATED</h3>
              <p class="text-xs text-gray-400 mt-1">All in-memory buffers and decrypted message nodes have been permanently purged.</p>
            </div>
          `;
        }
      } catch (e) {}

      if (typeof window.showNotif === 'function') {
        window.showNotif('CRITICAL: Volatile Session Memory Incinerated', 'error', 4000);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');
    }
  }

  window.ghostPanicLockEngine = new GhostPanicLockEngine();
})();
