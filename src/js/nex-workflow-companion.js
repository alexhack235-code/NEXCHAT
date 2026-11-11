/**
 * NEXCHAT - AI Workflow & Mood Companion Engine
 * Module: src/js/nex-workflow-companion.js
 * 
 * Monitored workflow & fatigue detection companion for NEXCHAT.
 * 1. Tracks user chat session metrics & usage track record (messages, typing duration, voice conversions).
 * 2. Detects user mood/fatigue patterns (e.g., "I'm tired", "can't type much", late night long sessions).
 * 3. Presents subtle, non-intrusive AI recommendations (Switch to Voice-to-Text, Summarize All).
 * 4. User-controlled On/Off toggle switch persisted across sessions.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  const STORAGE_KEYS = {
    ENABLED: 'nex_workflow_companion_enabled',
    TRACK_RECORD: 'nex_usage_track_record_v1',
    LAST_ALERT: 'nex_companion_last_alert_time'
  };

  const FATIGUE_REGEX = /\b(tired|exhausted|sleepy|good\s*night|goodnight|can'?t\s*type|cant\s*type|cant\s*really\s*type|cannot\s*type|my\s*eyes\s*hurt|so\s*tired|too\s*tired|drained|weary|heading\s*to\s*bed|going\s*to\s*sleep|done\s*for\s*today|too\s*much\s*typing|falling\s*asleep|heavy\s*eyes)\b/i;
  const CATCHUP_REGEX = /\b(what\s*did\s*i\s*miss|what\s*happened|catch\s*up|so\s*many\s*messages|too\s*much\s*to\s*read|summarize\s*everything|summarize\s*all|tldr)\b/i;

  class NexWorkflowCompanion {
    constructor() {
      this.isEnabled = localStorage.getItem(STORAGE_KEYS.ENABLED) !== 'false';
      this.sessionStartTime = Date.now();
      this.keystrokesCount = 0;
      this.messagesSentCount = 0;
      this.voiceDictationsUsed = 0;
      this.summariesTriggered = 0;
      this.fatigueAlertsCount = 0;
      this.lastAlertTime = 0;
      this.alertCooldownMs = 60000; // 60s cooldown to keep recommendations subtle and non-intrusive
      this.pillEl = null;
      this.debounceTimer = null;

      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindEvents());
      } else {
        this.bindEvents();
      }
    }

    bindEvents() {
      const input = document.getElementById('message-input');
      if (input) {
        input.addEventListener('input', (e) => {
          if (!this.isEnabled) return;
          this.keystrokesCount += 1;
          this.handleInputCheck(input.value);
        });
      }

      // Intercept message sends for usage track record
      window.addEventListener('nexMessageSent', (e) => {
        const text = e.detail?.text || '';
        this.recordMessage(text);
      });

      // Also listen to custom toggle requests
      window.addEventListener('nexCompanionToggle', (e) => {
        if (typeof e.detail?.enabled === 'boolean') {
          this.setEnabled(e.detail.enabled);
        } else {
          this.toggle();
        }
      });
    }

    handleInputCheck(text) {
      if (!this.isEnabled || !text) return;

      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        const now = Date.now();
        if (now - this.lastAlertTime < this.alertCooldownMs) return;

        if (FATIGUE_REGEX.test(text)) {
          this.triggerRecommendation('fatigue');
        } else if (CATCHUP_REGEX.test(text)) {
          this.triggerRecommendation('catchup');
        }
      }, 450);
    }

    recordMessage(text) {
      this.messagesSentCount += 1;
      this.updateTrackRecord({ messagesDelta: 1 });

      if (!this.isEnabled) return;

      const now = Date.now();
      // Check if text sent itself indicated fatigue
      if (text && FATIGUE_REGEX.test(text) && (now - this.lastAlertTime >= this.alertCooldownMs)) {
        setTimeout(() => this.triggerRecommendation('fatigue'), 800);
        return;
      }

      // Check for prolonged high-velocity chat sessions (e.g. > 15 messages sent in late hours)
      const currentHour = new Date().getHours();
      const isLateNight = currentHour >= 22 || currentHour < 5;
      if (this.messagesSentCount >= 12 && isLateNight && (now - this.lastAlertTime >= this.alertCooldownMs * 2)) {
        this.triggerRecommendation('late_night');
      }
    }

    triggerRecommendation(reason) {
      if (!this.isEnabled) return;
      this.lastAlertTime = Date.now();
      this.fatigueAlertsCount += 1;
      this.updateTrackRecord({ fatigueAlertsDelta: 1 });

      this.renderRecommendationPill(reason);
    }

    renderRecommendationPill(reason) {
      this.dismissPill();

      const pill = document.createElement('div');
      pill.id = 'nexWorkflowCompanionPill';
      pill.className = 'nex-workflow-companion-pill';
      pill.style.cssText = `
        position: relative;
        margin: 8px 12px;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.96));
        border: 1px solid rgba(0, 242, 254, 0.4);
        border-radius: 12px;
        padding: 10px 14px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 242, 254, 0.15);
        color: #fff;
        z-index: 100;
        display: flex;
        flex-direction: column;
        gap: 8px;
        animation: companionSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      `;

      let iconHtml = '<i class="fa-solid fa-moon" style="color: #67e8f9; font-size: 14px;"></i>';
      let titleText = 'Tired of typing? ChronEX AI can take over:';
      let subText = 'Switch to voice dictation or generate an automatic executive summary.';

      if (reason === 'catchup') {
        iconHtml = '<i class="fa-solid fa-bolt" style="color: #ffd700; font-size: 14px;"></i>';
        titleText = 'Catching up on group messages?';
        subText = 'Let ChronEX synthesize the whole conversation while you relax.';
      } else if (reason === 'late_night') {
        iconHtml = '<i class="fa-solid fa-clock" style="color: #a855f7; font-size: 14px;"></i>';
        titleText = 'Late night conversation workflow detected';
        subText = 'Rest your hands and use voice-to-text or request an AI brief.';
      }

      pill.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 26px; height: 26px; border-radius: 6px; background: rgba(0, 242, 254, 0.1); display: flex; align-items: center; justify-content: center;">
              ${iconHtml}
            </div>
            <div>
              <div style="font-size: 12.5px; font-weight: 700; color: #f1f5f9;">${titleText}</div>
              <div style="font-size: 11px; color: #94a3b8;">${subText}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button type="button" id="btnCompanionTurnOff" title="Disable AI Companion recommendations" style="background: transparent; border: none; color: #64748b; font-size: 10px; cursor: pointer; padding: 4px; text-decoration: underline;">
              Turn off
            </button>
            <button type="button" id="btnCompanionClose" title="Dismiss" style="background: rgba(255, 255, 255, 0.08); border: none; color: #cbd5e1; width: 22px; height: 22px; border-radius: 50%; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 2px;">
          <button type="button" id="btnCompanionVoiceText" style="flex: 1; min-width: 130px; padding: 6px 12px; background: rgba(0, 242, 254, 0.15); border: 1px solid #00f2fe; color: #00f2fe; border-radius: 8px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <i class="fa-solid fa-microphone-lines"></i> Use Voice-to-Text
          </button>
          <button type="button" id="btnCompanionSummarizeAll" style="flex: 1; min-width: 130px; padding: 6px 12px; background: rgba(168, 85, 247, 0.15); border: 1px solid #a855f7; color: #c084fc; border-radius: 8px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Summarize All
          </button>
          <button type="button" id="btnCompanionTrackRecord" style="padding: 6px 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1; border-radius: 8px; font-size: 11.5px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
            <i class="fa-solid fa-chart-pie"></i> Usage Stats
          </button>
        </div>
      `;

      // Mount right above composer
      const targetParent = document.getElementById('composerBar') || document.querySelector('.chat-input-area') || document.getElementById('chatDetailView') || document.body;
      if (targetParent.id === 'composerBar' || targetParent.classList.contains('chat-input-area')) {
        targetParent.parentNode.insertBefore(pill, targetParent);
      } else {
        targetParent.appendChild(pill);
      }

      this.pillEl = pill;

      // Event handlers
      pill.querySelector('#btnCompanionClose')?.addEventListener('click', () => {
        this.dismissPill();
      });

      pill.querySelector('#btnCompanionTurnOff')?.addEventListener('click', () => {
        this.setEnabled(false);
        this.dismissPill();
        if (typeof window.showNotif === 'function') {
          window.showNotif('AI Workflow Companion turned OFF. Type /companion on to re-enable anytime.', 'info', 3500);
        }
      });

      pill.querySelector('#btnCompanionVoiceText')?.addEventListener('click', () => {
        this.dismissPill();
        this.activateVoiceToText();
      });

      pill.querySelector('#btnCompanionSummarizeAll')?.addEventListener('click', () => {
        this.dismissPill();
        this.activateSummarizeAll();
      });

      pill.querySelector('#btnCompanionTrackRecord')?.addEventListener('click', () => {
        this.dismissPill();
        this.showTrackRecord();
      });

      // Auto-dismiss after 15 seconds if ignored
      setTimeout(() => {
        if (this.pillEl === pill) {
          this.dismissPill();
        }
      }, 15000);
    }

    dismissPill() {
      if (this.pillEl && this.pillEl.parentNode) {
        this.pillEl.parentNode.removeChild(this.pillEl);
      }
      this.pillEl = null;
    }

    activateVoiceToText() {
      this.voiceDictationsUsed += 1;
      this.updateTrackRecord({ voiceDictationsDelta: 1 });

      const dictateBtn = document.getElementById('voiceDictateBtn');
      if (dictateBtn) {
        dictateBtn.click();
      } else if (window.voiceTranscriber && typeof window.voiceTranscriber.toggleDictation === 'function') {
        window.voiceTranscriber.toggleDictation();
      } else {
        const audioRecBtn = document.getElementById('audio-record-btn');
        if (audioRecBtn) audioRecBtn.click();
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif('Speech-to-Text active. Speak now, your words will be typed automatically.', 'success', 3000);
      }
    }

    activateSummarizeAll() {
      this.summariesTriggered += 1;
      this.updateTrackRecord({ summariesDelta: 1 });

      if (window.NexChronexxSummarizer && typeof window.NexChronexxSummarizer.triggerGroupCatchUp === 'function') {
        window.NexChronexxSummarizer.triggerGroupCatchUp({ fullHistory: true });
      } else if (typeof window.triggerGroupCatchUp === 'function') {
        window.triggerGroupCatchUp({ fullHistory: true });
      } else if (window.eliteSlashCommands) {
        window.eliteSlashCommands.executeCommand({ cmd: '/summarize all' });
      } else {
        if (typeof window.showNotif === 'function') {
          window.showNotif('Generating full conversation summary...', 'info', 2500);
        }
      }
    }

    setEnabled(enabled) {
      this.isEnabled = !!enabled;
      localStorage.setItem(STORAGE_KEYS.ENABLED, this.isEnabled ? 'true' : 'false');
      if (!this.isEnabled) {
        this.dismissPill();
      }
    }

    toggle() {
      this.setEnabled(!this.isEnabled);
      const status = this.isEnabled ? 'enabled' : 'disabled';
      if (typeof window.showNotif === 'function') {
        window.showNotif(`AI Workflow Companion ${status.toUpperCase()}.`, 'info', 2500);
      }
      return this.isEnabled;
    }

    updateTrackRecord(deltas = {}) {
      try {
        const current = this.getTrackRecord();
        current.totalMessagesSent += (deltas.messagesDelta || 0);
        current.voiceDictationsUsed += (deltas.voiceDictationsDelta || 0);
        current.summariesTriggered += (deltas.summariesDelta || 0);
        current.fatigueAlertsCount += (deltas.fatigueAlertsDelta || 0);
        current.lastActiveTimestamp = Date.now();
        localStorage.setItem(STORAGE_KEYS.TRACK_RECORD, JSON.stringify(current));
      } catch (_) {}
    }

    getTrackRecord() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.TRACK_RECORD);
        if (raw) return JSON.parse(raw);
      } catch (_) {}

      return {
        installedSince: new Date().toISOString(),
        totalMessagesSent: this.messagesSentCount,
        voiceDictationsUsed: 0,
        summariesTriggered: 0,
        fatigueAlertsCount: 0,
        lastActiveTimestamp: Date.now()
      };
    }

    showTrackRecord() {
      const record = this.getTrackRecord();
      const sessionMinutes = Math.max(1, Math.round((Date.now() - this.sessionStartTime) / 60000));
      const statusText = this.isEnabled ? 'ACTIVE (MONITORING)' : 'DISABLED';
      const statusColor = this.isEnabled ? '#10b981' : '#64748b';

      const card = document.createElement('div');
      card.className = 'nex-trackrecord-card';
      card.style.cssText = `
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(0, 242, 254, 0.4);
        border-radius: 14px;
        padding: 16px;
        margin: 14px 0;
        color: #fff;
        box-shadow: 0 0 25px rgba(0, 242, 254, 0.15);
      `;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(0,242,254,0.2); padding-bottom:10px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-chart-line" style="color:#00f2fe; font-size:16px;"></i>
            <strong style="color:#00f2fe; font-size:13.5px; text-transform:uppercase;">User Usage & Workflow Track Record</strong>
          </div>
          <span style="font-size:10.5px; font-weight:700; color:${statusColor}; background:rgba(255,255,255,0.05); padding:3px 8px; border-radius:6px; border:1px solid ${statusColor};">
            ${statusText}
          </span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:14px;">
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px; text-align:center;">
            <div style="font-size:10px; color:#94a3b8; text-transform:uppercase;">Active Session</div>
            <div style="font-size:18px; font-weight:800; color:#38bdf8; margin-top:2px;">${sessionMinutes} min</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px; text-align:center;">
            <div style="font-size:10px; color:#94a3b8; text-transform:uppercase;">Messages Sent</div>
            <div style="font-size:18px; font-weight:800; color:#10b981; margin-top:2px;">${record.totalMessagesSent}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px; text-align:center;">
            <div style="font-size:10px; color:#94a3b8; text-transform:uppercase;">Voice Conversions</div>
            <div style="font-size:18px; font-weight:800; color:#ffd700; margin-top:2px;">${record.voiceDictationsUsed}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px; text-align:center;">
            <div style="font-size:10px; color:#94a3b8; text-transform:uppercase;">Fatigue Alerts</div>
            <div style="font-size:18px; font-weight:800; color:#c084fc; margin-top:2px;">${record.fatigueAlertsCount}</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,242,254,0.06); padding:8px 12px; border-radius:8px;">
          <span style="font-size:11.5px; color:#cbd5e1;">Toggle Companion Monitoring:</span>
          <button type="button" id="btnTrackRecordToggle" style="padding:4px 10px; background:${this.isEnabled ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}; border:1px solid ${this.isEnabled ? '#ef4444' : '#10b981'}; color:${this.isEnabled ? '#ef4444' : '#10b981'}; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
            ${this.isEnabled ? 'Turn OFF' : 'Turn ON'}
          </button>
        </div>
      `;

      card.querySelector('#btnTrackRecordToggle')?.addEventListener('click', () => {
        this.toggle();
        card.remove();
        this.showTrackRecord();
      });

      const container = document.getElementById('messages-area') || document.querySelector('.messages-list') || document.getElementById('chatDetailView');
      if (container) {
        container.appendChild(card);
        card.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // Inject styles for slide-in animation
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes companionSlideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(styleEl);

  // Singleton instance
  window.NexWorkflowCompanion = new NexWorkflowCompanion();

})(typeof window !== 'undefined' ? window : this);
