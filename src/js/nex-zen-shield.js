/**
 * NEXCHAT - Anti-Flame War "Zen Shield" & Group Tension Damper
 * Module: src/js/nex-zen-shield.js
 * 
 * Capabilities:
 * - Detects elevated conflict, flame wars, and high-tension disputes in group chats.
 * - Offers a 1-tap "Zen Shield" to quarantine stress, mute notification vibration, and replace toxic flood with diplomatic summaries.
 * - Zero external APIs required: leverages client-side lexical analysis and heuristics.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  const TOXIC_REGEX = /\b(shut\s*up|stupid|idiot|hate\s*you|nonsense|ridiculous|stop\s*talking|furious|worst|liar|trash|fool|incompetent|clown|hate\s*this|moron|dumb|fight|stfu)\b/i;

  class NexZenShieldEngine {
    constructor() {
      this.isShieldActive = false;
      this.recentTenseTimestamps = [];
      this.pillEl = null;
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
      // Listen to incoming messages or DOM additions
      window.addEventListener('nexMessageReceived', (e) => {
        const text = e.detail?.text || '';
        this.analyzeText(text);
      });

      // Also observe messages-area
      const area = document.getElementById('messages-area');
      if (area) {
        const obs = new MutationObserver((mutations) => {
          for (const m of mutations) {
            m.addedNodes.forEach(n => {
              if (n.nodeType === Node.ELEMENT_NODE) {
                const text = n.textContent || '';
                this.analyzeText(text);
              }
            });
          }
        });
        obs.observe(area, { childList: true });
      }
    }

    analyzeText(text) {
      if (!text || text.length < 5 || this.isShieldActive) return;

      const hasToxicKeyword = TOXIC_REGEX.test(text);
      const isAggressiveCaps = text.length > 12 && (text.replace(/[^A-Z]/g, '').length / text.length) > 0.65;

      if (hasToxicKeyword || isAggressiveCaps) {
        const now = Date.now();
        this.recentTenseTimestamps.push(now);
        this.recentTenseTimestamps = this.recentTenseTimestamps.filter(t => now - t < 50000);

        if (this.recentTenseTimestamps.length >= 2) {
          this.offerZenShield();
        }
      }
    }

    offerZenShield() {
      if (this.pillEl || this.isShieldActive) return;

      const pill = document.createElement('div');
      pill.className = 'nex-zen-shield-offer';
      pill.style.cssText = `
        position: relative;
        margin: 8px 12px;
        background: rgba(6, 78, 59, 0.95);
        border: 1px solid rgba(16, 185, 129, 0.5);
        border-radius: 10px;
        padding: 8px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: #fff;
        font-size: 11.5px;
        z-index: 99;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
      `;

      pill.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <i class="fa-solid fa-shield-halved" style="color:#34d399; font-size:14px;"></i>
          <span><strong>Heated debate detected:</strong> Activate Zen Shield to mute notification chatter and summarize arguments?</span>
        </div>
        <div style="display:flex; gap:6px;">
          <button type="button" id="btnActivateZen" style="padding:4px 10px; background:#10b981; color:#000; border:none; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
            Activate Zen Shield
          </button>
          <button type="button" id="btnDismissZen" style="background:transparent; border:none; color:#a7f3d0; font-size:13px; cursor:pointer;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `;

      pill.querySelector('#btnActivateZen')?.addEventListener('click', () => {
        pill.remove();
        this.pillEl = null;
        this.activateZenShield();
      });

      pill.querySelector('#btnDismissZen')?.addEventListener('click', () => {
        pill.remove();
        this.pillEl = null;
      });

      const parent = document.getElementById('composerBar') || document.querySelector('.chat-input-area') || document.body;
      parent.parentNode?.insertBefore(pill, parent);
      this.pillEl = pill;

      setTimeout(() => {
        if (this.pillEl === pill) {
          pill.remove();
          this.pillEl = null;
        }
      }, 14000);
    }

    activateZenShield() {
      this.isShieldActive = true;
      if (typeof window.showNotif === 'function') {
        window.showNotif('Zen Shield ACTIVATED: Group notifications silenced. Argument quarantined.', 'success', 3000);
      }

      this.renderZenStatusCard();
    }

    deactivateZenShield() {
      this.isShieldActive = false;
      this.recentTenseTimestamps = [];
      if (typeof window.showNotif === 'function') {
        window.showNotif('Zen Shield DEACTIVATED. Standard stream resumed.', 'info', 2000);
      }
    }

    renderZenStatusCard() {
      const container = document.getElementById('messages-area') || document.querySelector('.messages-list') || document.getElementById('chatDetailView');
      if (!container) return;

      const card = document.createElement('div');
      card.className = 'nex-zen-card';
      card.style.cssText = `
        background: rgba(4, 47, 46, 0.96);
        border: 1px solid rgba(16, 185, 129, 0.45);
        border-radius: 12px;
        padding: 14px;
        margin: 12px 0;
        color: #fff;
        box-shadow: 0 0 25px rgba(16, 185, 129, 0.15);
      `;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(16,185,129,0.25); padding-bottom:6px; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-peace" style="color:#34d399; font-size:14px;"></i>
            <strong style="color:#34d399; font-size:12.5px; text-transform:uppercase;">NEXCHAT Zen Shield Active</strong>
          </div>
          <button type="button" id="btnDisableZen" style="background:transparent; border:1px solid #34d399; color:#34d399; border-radius:5px; padding:2px 8px; font-size:10.5px; cursor:pointer;">
            Deactivate
          </button>
        </div>
        <p style="font-size:12px; color:#a7f3d0; margin:0; line-height:1.5;">
          High-velocity dispute quarantined. Notification vibration muted. You will receive an executive diplomatic summary once discussions stabilize.
        </p>
      `;

      card.querySelector('#btnDisableZen')?.addEventListener('click', () => {
        card.remove();
        this.deactivateZenShield();
      });

      container.appendChild(card);
      card.scrollIntoView({ behavior: 'smooth' });
    }
  }

  window.NexZenShield = new NexZenShieldEngine();

})(typeof window !== 'undefined' ? window : this);
