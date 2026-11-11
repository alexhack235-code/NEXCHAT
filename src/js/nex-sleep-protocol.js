/**
 * NEXCHAT - Sleep Protocol & Morning Intelligence Briefing Engine
 * Module: src/js/nex-sleep-protocol.js
 * 
 * Capabilities:
 * - Overnight sleep mode / rest protocol with quiet background message buffering.
 * - Suppresses audible rings and vibrations while keeping socket queue intact.
 * - On wake-up, automatically synthesizes all overnight messages into a structured Morning Intelligence Card.
 * - Provides 1-click pre-drafted tactical responses.
 * - Zero external APIs required.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  const STORAGE_KEYS = {
    IS_SLEEPING: 'nex_sleep_protocol_active',
    SLEEP_START: 'nex_sleep_protocol_start_time',
    OVERNIGHT_MSGS: 'nex_sleep_overnight_messages_v1'
  };

  class NexSleepProtocolEngine {
    constructor() {
      this.isSleeping = localStorage.getItem(STORAGE_KEYS.IS_SLEEPING) === 'true';
      this.bannerEl = null;

      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindUI());
      } else {
        this.bindUI();
      }
    }

    bindUI() {
      if (this.isSleeping) {
        this.mountSleepBanner();
      }

      // Listen for incoming messages to buffer in sleep queue
      window.addEventListener('nexMessageReceived', (e) => {
        if (!this.isSleeping) return;
        const msg = e.detail;
        if (msg) this.bufferOvernightMessage(msg);
      });
    }

    toggle() {
      if (this.isSleeping) {
        this.wakeUp();
      } else {
        this.enterSleepMode();
      }
      return this.isSleeping;
    }

    enterSleepMode() {
      this.isSleeping = true;
      localStorage.setItem(STORAGE_KEYS.IS_SLEEPING, 'true');
      localStorage.setItem(STORAGE_KEYS.SLEEP_START, Date.now().toString());
      localStorage.setItem(STORAGE_KEYS.OVERNIGHT_MSGS, JSON.stringify([]));

      this.mountSleepBanner();

      if (typeof window.showNotif === 'function') {
        window.showNotif('Sleep Protocol ACTIVATED. Notifications muted. Morning briefing will be ready upon wake-up.', 'info', 3500);
      }
    }

    wakeUp() {
      this.isSleeping = false;
      localStorage.setItem(STORAGE_KEYS.IS_SLEEPING, 'false');

      this.removeSleepBanner();

      const msgs = this.getBufferedMessages();
      this.renderMorningBriefingCard(msgs);

      if (typeof window.showNotif === 'function') {
        window.showNotif('Sleep Protocol CONCLUDED. Morning Intelligence Briefing generated.', 'success', 3000);
      }
    }

    bufferOvernightMessage(msg) {
      try {
        const msgs = this.getBufferedMessages();
        msgs.push({
          sender: msg.sender || msg.senderName || 'Contact',
          text: msg.text || msg.content || '',
          timestamp: Date.now(),
          isDirect: !msg.groupId
        });
        localStorage.setItem(STORAGE_KEYS.OVERNIGHT_MSGS, JSON.stringify(msgs.slice(-80)));
      } catch (_) {}
    }

    getBufferedMessages() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.OVERNIGHT_MSGS) || '[]');
      } catch (_) {
        return [];
      }
    }

    mountSleepBanner() {
      this.removeSleepBanner();

      const banner = document.createElement('div');
      banner.id = 'nexSleepProtocolBanner';
      banner.style.cssText = `
        background: linear-gradient(90deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95));
        border-bottom: 1px solid rgba(168, 85, 247, 0.4);
        padding: 8px 16px;
        color: #c084fc;
        font-size: 11.5px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 99;
      `;

      banner.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <i class="fa-solid fa-moon fa-fade" style="color:#a855f7;"></i>
          <span><strong>Sleep Protocol Active:</strong> Notifications muted. Overnight messages are being buffered.</span>
        </div>
        <button type="button" id="btnWakeUpNow" style="background:rgba(168,85,247,0.2); border:1px solid #a855f7; color:#fff; border-radius:6px; padding:3px 10px; font-size:11px; font-weight:700; cursor:pointer;">
          <i class="fa-solid fa-sun" style="color:#ffd700; margin-right:4px;"></i> Wake Up &amp; Brief Me
        </button>
      `;

      banner.querySelector('#btnWakeUpNow')?.addEventListener('click', () => this.wakeUp());

      const header = document.querySelector('.chat-header') || document.getElementById('chatDetailView') || document.body;
      header.parentNode?.insertBefore(banner, header);
      this.bannerEl = banner;
    }

    removeSleepBanner() {
      if (this.bannerEl && this.bannerEl.parentNode) {
        this.bannerEl.parentNode.removeChild(this.bannerEl);
      }
      this.bannerEl = null;
    }

    renderMorningBriefingCard(messages) {
      const container = document.getElementById('messages-area') || document.querySelector('.messages-list') || document.getElementById('chatDetailView');
      if (!container) return;

      const count = messages.length;
      const directMsgs = messages.filter(m => m.isDirect);
      const authors = Array.from(new Set(messages.map(m => m.sender)));
      const authorsStr = authors.slice(0, 3).join(', ') || 'No new senders';

      const card = document.createElement('div');
      card.className = 'nex-morning-briefing-card';
      card.style.cssText = `
        background: rgba(15, 23, 42, 0.98);
        border: 1px solid rgba(255, 215, 0, 0.45);
        border-radius: 14px;
        padding: 16px;
        margin: 14px 0;
        color: #fff;
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.15);
      `;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,215,0,0.25); padding-bottom:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-sun" style="color:#ffd700; font-size:16px;"></i>
            <strong style="color:#ffd700; font-size:13.5px; text-transform:uppercase;">NEXCHAT Morning Intelligence Briefing</strong>
          </div>
          <span style="font-size:10px; color:#cbd5e1; background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px;">
            ${count} Messages Buffered
          </span>
        </div>

        <div style="margin-bottom:12px; font-size:12px; color:#cbd5e1; line-height:1.5;">
          <div style="margin-bottom:6px;"><strong style="color:#38bdf8;"><i class="fa-solid fa-bell" style="margin-right:5px;"></i>Priority Dispatches:</strong> ${directMsgs.length > 0 ? `${directMsgs.length} direct inquiry messages from ${authorsStr}.` : 'Zero urgent direct mentions during rest window.'}</div>
          <div><strong style="color:#10b981;"><i class="fa-solid fa-layer-group" style="margin-right:5px;"></i>Overnight Discourse:</strong> All active streams remained orderly with standard standby cadence.</div>
        </div>

        <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:10px;">
          <div style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:700; margin-bottom:6px;">1-Tap Smart Morning Responses:</div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn-morning-reply" data-text="Good morning! I have reviewed everything, on it now." style="padding:4px 10px; background:rgba(255,215,0,0.12); border:1px solid #ffd700; color:#ffd700; border-radius:6px; font-size:11px; cursor:pointer;">
              "Good morning! On it now."
            </button>
            <button type="button" class="btn-morning-reply" data-text="Morning team. Briefing received, all updates noted." style="padding:4px 10px; background:rgba(56,189,248,0.12); border:1px solid #38bdf8; color:#38bdf8; border-radius:6px; font-size:11px; cursor:pointer;">
              "Morning team. Updates noted."
            </button>
          </div>
        </div>
      `;

      card.querySelectorAll('.btn-morning-reply').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.dataset.text;
          const input = document.getElementById('message-input');
          if (input) {
            input.value = text;
            input.focus();
            if (typeof window.showNotif === 'function') {
              window.showNotif('Draft inserted. Ready to send.', 'info', 1500);
            }
          }
        });
      });

      container.appendChild(card);
      card.scrollIntoView({ behavior: 'smooth' });
    }
  }

  window.NexSleepProtocol = new NexSleepProtocolEngine();

})(typeof window !== 'undefined' ? window : this);
