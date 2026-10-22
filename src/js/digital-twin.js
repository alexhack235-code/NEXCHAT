/**
 * NEXCHAT - Autonomous Neural Digital Twins (AI Persona Clones for AFK Mode)
 * Trainable persona model, automated conversational reply agent,
 * AFK activation triggers, and post-session operative intelligence briefings.
 * STRICTLY NO EMOJIS: Professional cyberpunk terminology.
 */

(function() {
  'use strict';

  const TWIN_CONFIG_KEY = 'nexchat_digital_twin_config';
  const BRIEFING_LOG_KEY = 'nexchat_twin_briefings';

  const DEFAULT_CONFIG = {
    enabled: false,
    personaName: 'Ghost-Twin Alpha',
    slangLevel: 'tactical', // 'tactical' | 'minimal' | 'cyberpunk'
    responseTone: 'analytical', // 'analytical' | 'banter' | 'concise'
    responseDelaySec: 2,
    autoCollectBounties: true
  };

  class DigitalTwinEngine {
    constructor() {
      this.config = this.loadConfig();
      this.briefings = this.loadBriefings();
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
      this.injectHeaderTrigger();
      this.listenIncomingMessages();
    }

    loadConfig() {
      try {
        const raw = localStorage.getItem(TWIN_CONFIG_KEY);
        return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_CONFIG };
      } catch (e) {
        return { ...DEFAULT_CONFIG };
      }
    }

    saveConfig() {
      try {
        localStorage.setItem(TWIN_CONFIG_KEY, JSON.stringify(this.config));
      } catch (e) {}
    }

    loadBriefings() {
      try {
        const raw = localStorage.getItem(BRIEFING_LOG_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    saveBriefings() {
      try {
        localStorage.setItem(BRIEFING_LOG_KEY, JSON.stringify(this.briefings));
      } catch (e) {}
    }

    injectModal() {
      if (document.getElementById('digitalTwinModal')) return;

      const modal = document.createElement('div');
      modal.id = 'digitalTwinModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window twin-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-robot text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">AUTONOMOUS DIGITAL TWIN</h3>
              <span class="twin-status-pill ${this.config.enabled ? 'active' : ''}" id="twinHeaderStatusPill">
                ${this.config.enabled ? 'ONLINE (AFK ACTIVE)' : 'STANDBY'}
              </span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeTwinModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="twin-modal-body">
            <!-- Master Toggle -->
            <div class="twin-toggle-row">
              <div>
                <strong class="text-white text-sm block">ENABLE AUTONOMOUS REPLIES</strong>
                <span class="text-xs text-gray-400">When active, your AI Twin handles inbound messages while you are AFK.</span>
              </div>
              <label class="cyber-switch">
                <input type="checkbox" id="twinMasterCheckbox" ${this.config.enabled ? 'checked' : ''} />
                <span class="cyber-slider"></span>
              </label>
            </div>

            <!-- Persona Tuning -->
            <div class="twin-settings-block mt-4">
              <div class="twin-field">
                <label class="twin-label">TWIN DESIGNATION / CODENAME:</label>
                <input type="text" id="twinNameInput" class="twin-input" value="${this.config.personaName}" maxlength="30" />
              </div>

              <div class="twin-field mt-3">
                <label class="twin-label">RESPONSE PROFILE:</label>
                <select id="twinToneSelect" class="twin-select">
                  <option value="analytical" ${this.config.responseTone === 'analytical' ? 'selected' : ''}>Analytical & Tactical (Direct intel, zero fluff)</option>
                  <option value="banter" ${this.config.responseTone === 'banter' ? 'selected' : ''}>Cyberpunk Banter (Witty operative retorts)</option>
                  <option value="concise" ${this.config.responseTone === 'concise' ? 'selected' : ''}>Concise Dispatch (Acknowledgment and status updates)</option>
                </select>
              </div>

              <div class="twin-field mt-3">
                <label class="twin-label">DISPATCH LATENCY SIMULATION:</label>
                <div class="twin-latency-pills">
                  <button type="button" class="twin-latency-pill ${this.config.responseDelaySec === 1 ? 'active' : ''}" data-sec="1">Instant (1s)</button>
                  <button type="button" class="twin-latency-pill ${this.config.responseDelaySec === 2 ? 'active' : ''}" data-sec="2">Natural (2s)</button>
                  <button type="button" class="twin-latency-pill ${this.config.responseDelaySec === 4 ? 'active' : ''}" data-sec="4">Deliberate (4s)</button>
                </div>
              </div>
            </div>

            <!-- Briefing Transcripts Log -->
            <div class="twin-briefings-box mt-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-gray-300 uppercase tracking-wider">AFK DISPATCH INTELLIGENCE LOG:</span>
                <button type="button" id="clearTwinBriefingsBtn" class="twin-clear-btn">CLEAR LOG</button>
              </div>
              <div class="twin-log-list" id="twinBriefingList">
                <!-- Rendered dynamically -->
              </div>
            </div>

            <button type="button" id="saveTwinConfigBtn" class="twin-save-btn mt-4">
              <i class="fa-solid fa-floppy-disk"></i> SAVE DIGITAL TWIN PROTOCOLS
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindModalEvents();
      this.renderBriefingLog();
    }

    bindModalEvents() {
      const modal = document.getElementById('digitalTwinModal');
      document.getElementById('closeTwinModalBtn')?.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });

      // Master checkbox
      document.getElementById('twinMasterCheckbox')?.addEventListener('change', (e) => {
        this.config.enabled = e.target.checked;
        this.saveConfig();
        this.updateHeaderButtonUI();

        const pill = document.getElementById('twinHeaderStatusPill');
        if (pill) {
          pill.className = `twin-status-pill ${this.config.enabled ? 'active' : ''}`;
          pill.textContent = this.config.enabled ? 'ONLINE (AFK ACTIVE)' : 'STANDBY';
        }

        if (typeof window.showNotif === 'function') {
          window.showNotif(this.config.enabled ? 'Digital Twin: Autonomous AFK Mode Armed' : 'Digital Twin: Standby Mode', 'info', 2000);
        }
      });

      // Latency pills
      document.querySelectorAll('.twin-latency-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          document.querySelectorAll('.twin-latency-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.config.responseDelaySec = parseInt(pill.dataset.sec, 10);
        });
      });

      // Clear log
      document.getElementById('clearTwinBriefingsBtn')?.addEventListener('click', () => {
        this.briefings = [];
        this.saveBriefings();
        this.renderBriefingLog();
      });

      // Save button
      document.getElementById('saveTwinConfigBtn')?.addEventListener('click', () => {
        const nameInput = document.getElementById('twinNameInput');
        const toneSelect = document.getElementById('twinToneSelect');
        if (nameInput) this.config.personaName = nameInput.value.trim() || 'Ghost-Twin Alpha';
        if (toneSelect) this.config.responseTone = toneSelect.value;
        this.saveConfig();
        if (modal) modal.style.display = 'none';
        if (typeof window.showNotif === 'function') {
          window.showNotif('Digital Twin protocols updated', 'success', 2000);
        }
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
      });
    }

    bindHeaderTrigger() {
      const headerActions = document.querySelector('.chat-detail-header-actions') || 
                            document.querySelector('.chat-detail-header-right');
      if (headerActions && !document.getElementById('digitalTwinBtnHeader')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'digitalTwinBtnHeader';
        btn.className = 'header-icon-btn';
        btn.title = 'Autonomous Digital Twin Settings';
        btn.innerHTML = `<i class="fa-solid fa-robot ${this.config.enabled ? 'text-[#00ff66]' : 'text-gray-400'}"></i>`;
        btn.addEventListener('click', () => this.openModal());
        headerActions.insertBefore(btn, headerActions.children[1] || null);
      }
    }

    updateHeaderButtonUI() {
      const btn = document.getElementById('digitalTwinBtnHeader');
      if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-robot ${this.config.enabled ? 'text-[#00ff66]' : 'text-gray-400'}"></i>`;
      }
    }

    openModal() {
      const modal = document.getElementById('digitalTwinModal');
      if (!modal) return;
      modal.style.display = 'flex';
      this.renderBriefingLog();
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    renderBriefingLog() {
      const list = document.getElementById('twinBriefingList');
      if (!list) return;

      if (this.briefings.length === 0) {
        list.innerHTML = `<div class="text-xs text-gray-500 italic text-center py-4">No autonomous dispatch actions logged yet.</div>`;
        return;
      }

      list.innerHTML = this.briefings.slice(-10).reverse().map(b => `
        <div class="twin-log-item">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#00d4ff]">${b.partner}</span>
            <span class="text-[10px] text-gray-500">${new Date(b.time).toLocaleTimeString()}</span>
          </div>
          <p class="text-xs text-gray-300 mt-1">Prompt: "${b.inbound}"</p>
          <p class="text-xs text-[#00ff66] font-semibold mt-1">Reply: "${b.reply}"</p>
        </div>
      `).join('');
    }

    listenIncomingMessages() {
      window.addEventListener('nexchat:incoming_message', (e) => {
        const msg = e.detail;
        if (!this.config.enabled || !msg || !msg.text) return;
        this.processAutonomousReply(msg.text, msg.from || 'Operative');
      });
    }

    processAutonomousReply(inboundText, senderId) {
      if (!this.config.enabled) return;

      const replyText = this.generateAutonomousText(inboundText);
      const delay = (this.config.responseDelaySec || 2) * 1000;

      setTimeout(() => {
        // Append local message bubble with Digital Twin badge
        const formattedText = `[AI DIGITAL TWIN ACTIVE] ${replyText}`;

        if (typeof window.appendLocalSentMessage === 'function') {
          window.appendLocalSentMessage(formattedText, null, false, 'sent');
        }

        if (typeof window.sendSupabaseMessage === 'function') {
          const partnerId = window.currentChatUserId || window.currentChatUser || senderId;
          if (partnerId) {
            window.sendSupabaseMessage({
              from: window.myUID || 'u_current',
              to: partnerId,
              text: formattedText,
              attachment: null,
              chatType: window.currentChatType || 'direct'
            }).catch(() => {});
          }
        }

        // Record briefing entry
        this.briefings.push({
          partner: senderId,
          inbound: inboundText,
          reply: replyText,
          time: Date.now()
        });
        this.saveBriefings();
        this.renderBriefingLog();

        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
      }, delay);
    }

    generateAutonomousText(inboundText) {
      const lower = inboundText.toLowerCase();

      if (this.config.responseTone === 'analytical') {
        if (lower.includes('status') || lower.includes('update')) {
          return "Telemetry stable. Primary operative is currently off-grid. All communication streams logged for review.";
        }
        if (lower.includes('when') || lower.includes('time')) {
          return "Operative estimated reconnect window is upcoming. Dispatch logged to encrypted queue.";
        }
        return `Acknowledged. I have logged "${inboundText.slice(0, 40)}" to the central briefing vault for operative inspection upon return.`;
      } else if (this.config.responseTone === 'banter') {
        if (lower.includes('hello') || lower.includes('hey')) {
          return "Greetings operative. Primary is currently AFK, but I am keeping guard. What is the tactical brief?";
        }
        return `My neural copy is handling comms right now while my flesh counterpart is offline. Transmission noted and filed.`;
      } else {
        // Concise
        return `[Automated Dispatch]: Received. Operative is AFK. Transmission recorded.`;
      }
    }
  }

  window.digitalTwinEngine = new DigitalTwinEngine();
})();
