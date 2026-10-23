/**
 * CAMSHOT REELS - Holographic Streamer Tipping Alerts & Live Super Chats
 * =======================================================================
 * Capabilities:
 * 1. Live Streamer Tipping Banner:
 *    - Floating holographic banner across top-center of video
 *    - Neon gradient border, coin badge, and sender attribution
 * 2. Synthesized Web Audio Fanfare:
 *    - Dual-tone cash register & victory arpeggio chime
 * 3. Quick Tip Modal with Token Balance Deductions:
 *    - 25, 50, 100, 250, 500 Token presets
 *    - Direct update of localStorage ('nexchat_user_tokens')
 *
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const TOKEN_BAL_KEY = 'nexchat_user_tokens';

  class ReelsStreamerTipping {
    constructor() {
      this.audioCtx = null;
      this.initStyles();
      this.bindDOM();
    }

    bindDOM() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.hookTipTriggers());
      } else {
        this.hookTipTriggers();
      }
    }

    getAudioContext() {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      return this.audioCtx;
    }

    playCashChime() {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // Cash register mechanical click + bright coin bell
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1480, now);
        osc.frequency.setValueAtTime(2200, now + 0.08);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.46);
      } catch (_) {}
    }

    hookTipTriggers() {
      document.addEventListener('click', (e) => {
        const tipBtn = e.target.closest('.tip-jar-btn') || e.target.closest('.action-tip-btn') || e.target.closest('.creator-tip-btn');
        if (!tipBtn) return;
        e.preventDefault();
        e.stopPropagation();

        const activeCard = tipBtn.closest('.reel-card') || document.querySelector('.reel-card');
        const author = activeCard?.querySelector('.author-name')?.textContent || 'Creator';

        this.openQuickTipModal(author);
      });
    }

    openQuickTipModal(author) {
      let modal = document.getElementById('reelsQuickTipModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reelsQuickTipModal';
        modal.className = 'reels-modal-overlay';
        document.body.appendChild(modal);
      }

      const userTokens = parseInt(localStorage.getItem(TOKEN_BAL_KEY) || '1000', 10);

      modal.innerHTML = `
        <div class="quick-tip-card">
          <div class="tip-header">
            <div class="tip-coin-halo">
              <i class="fa-solid fa-coins"></i>
            </div>
            <div>
              <h3>Tip @${this.escapeHtml(author)}</h3>
              <p>Send a Holographic Streamer Alert & Support Creator</p>
            </div>
            <button type="button" class="tip-close-btn" onclick="document.getElementById('reelsQuickTipModal').style.display='none';">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="tip-body">
            <div class="tip-user-balance-pill">
              <i class="fa-solid fa-wallet" style="color: #ffd700;"></i>
              <span>Your Cyber Balance: <strong>${userTokens} Tokens</strong></span>
            </div>

            <div class="tip-preset-grid">
              <button type="button" class="btn-tip-preset active" data-amt="25">
                <i class="fa-solid fa-bolt"></i> 25
              </button>
              <button type="button" class="btn-tip-preset" data-amt="50">
                <i class="fa-solid fa-fire"></i> 50
              </button>
              <button type="button" class="btn-tip-preset" data-amt="100">
                <i class="fa-solid fa-crown"></i> 100
              </button>
              <button type="button" class="btn-tip-preset" data-amt="250">
                <i class="fa-solid fa-gem"></i> 250
              </button>
            </div>

            <input type="text" id="tipShoutoutInput" class="tip-shoutout-input" placeholder="Add an optional broadcast message...">

            <button type="button" class="btn-send-hologram-tip" id="btnSendHologramTip">
              <i class="fa-solid fa-paper-plane"></i>
              <span>Broadcast 25 Tokens Tip Alert</span>
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
      };

      let selectedAmount = 25;
      const sendBtn = modal.querySelector('#btnSendHologramTip');

      modal.querySelectorAll('.btn-tip-preset').forEach(preset => {
        preset.addEventListener('click', () => {
          modal.querySelectorAll('.btn-tip-preset').forEach(p => p.classList.remove('active'));
          preset.classList.add('active');
          selectedAmount = parseInt(preset.dataset.amt, 10);
          if (sendBtn) {
            sendBtn.querySelector('span').textContent = `Broadcast ${selectedAmount} Tokens Tip Alert`;
          }
        });
      });

      sendBtn?.addEventListener('click', () => {
        const shoutout = modal.querySelector('#tipShoutoutInput')?.value?.trim();
        modal.style.display = 'none';
        this.broadcastStreamerAlert('Operative You', author, selectedAmount, shoutout);
      });
    }

    broadcastStreamerAlert(sender, creator, amount, message) {
      this.playCashChime();

      // Deduct balance
      const userTokens = parseInt(localStorage.getItem(TOKEN_BAL_KEY) || '1000', 10);
      if (userTokens >= amount) {
        localStorage.setItem(TOKEN_BAL_KEY, String(userTokens - amount));
      }

      // Render Floating Live Streamer Alert
      const alert = document.createElement('div');
      alert.className = 'reels-streamer-tip-alert';
      alert.innerHTML = `
        <div class="tip-alert-badge">
          <i class="fa-solid fa-coins fa-spin" style="animation-duration: 3s;"></i>
        </div>
        <div class="tip-alert-content">
          <div class="tip-alert-title">
            <strong>${this.escapeHtml(sender)}</strong> tipped <strong>${amount} TOKENS</strong> to @${this.escapeHtml(creator)}!
          </div>
          ${message ? `<div class="tip-alert-msg">"${this.escapeHtml(message)}"</div>` : ''}
        </div>
      `;

      document.body.appendChild(alert);

      setTimeout(() => {
        alert.classList.add('alert-fade-out');
        setTimeout(() => alert.remove(), 400);
      }, 4200);

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Tipped ${amount} Tokens to @${creator}!`, 'success', 2000);
      }
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    initStyles() {
      if (document.getElementById('reelsStreamerTippingStyles')) return;
      const style = document.createElement('style');
      style.id = 'reelsStreamerTippingStyles';
      style.textContent = `
        /* Live Streamer Alert */
        .reels-streamer-tip-alert {
          position: fixed;
          top: 74px;
          left: 50%;
          transform: translateX(-50%) translateY(-20px);
          background: linear-gradient(135deg, rgba(20, 25, 40, 0.95), rgba(35, 20, 45, 0.95));
          border: 1.5px solid #ffd700;
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.5), 0 10px 40px rgba(0, 0, 0, 0.8);
          border-radius: 9999px;
          padding: 8px 22px 8px 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 999999;
          animation: alertSlideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          max-width: 90%;
        }

        @keyframes alertSlideDown {
          to { transform: translateX(-50%) translateY(0); }
        }

        .reels-streamer-tip-alert.alert-fade-out {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
          transition: all 0.35s ease;
        }

        .tip-alert-badge {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #ffd700;
          color: #050811;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
        }

        .tip-alert-title {
          font-size: 12.5px;
          color: #f1f5f9;
        }
        .tip-alert-title strong {
          color: #ffd700;
        }

        .tip-alert-msg {
          font-size: 11px;
          color: #cbd5e1;
          font-style: italic;
          margin-top: 2px;
        }

        /* Quick Tip Card */
        .quick-tip-card {
          background: #0d121d;
          border: 1px solid rgba(255, 215, 0, 0.35);
          border-radius: 20px;
          width: 100%;
          max-width: 440px;
          color: #f1f5f9;
          font-family: 'Inter', -apple-system, sans-serif;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(255, 215, 0, 0.15);
        }

        .tip-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
        }

        .tip-coin-halo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(255, 215, 0, 0.15);
          border: 1px solid rgba(255, 215, 0, 0.4);
          color: #ffd700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .tip-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #ffffff; }
        .tip-header p { margin: 2px 0 0 0; font-size: 11.5px; color: #94a3b8; }

        .tip-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
        }

        .tip-body { padding: 18px 20px 22px 20px; }

        .tip-user-balance-pill {
          background: rgba(255, 215, 0, 0.08);
          border: 1px solid rgba(255, 215, 0, 0.25);
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #cbd5e1;
          margin-bottom: 14px;
        }

        .tip-preset-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }

        .btn-tip-preset {
          background: #141b27;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f1f5f9;
          border-radius: 10px;
          padding: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s;
        }

        .btn-tip-preset.active {
          border-color: #ffd700;
          background: rgba(255, 215, 0, 0.15);
          color: #ffd700;
          box-shadow: 0 0 14px rgba(255, 215, 0, 0.25);
        }

        .tip-shoutout-input {
          width: 100%;
          background: #141b27;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #ffffff;
          padding: 10px 12px;
          font-size: 12.5px;
          outline: none;
          box-sizing: border-box;
          margin-bottom: 14px;
        }

        .btn-send-hologram-tip {
          width: 100%;
          background: linear-gradient(135deg, #ffd700, #f59e0b);
          color: #050811;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(255, 215, 0, 0.4);
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.NexReelsStreamerTipping = new ReelsStreamerTipping();
  window.reelsStreamerTipping = window.NexReelsStreamerTipping;
})();
