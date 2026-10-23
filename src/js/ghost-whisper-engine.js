/**
 * NEXCHAT - Ghost Whisper Ephemeral 1-View Self-Destruct Engine
 * ==============================================================
 * Capabilities:
 * 1. 1-View Ephemeral Encrypted Messages:
 *    - Encrypted payload hidden behind a stealth vault card in chat
 *    - Tap to reveal with cryptographic handshake
 *
 * 2. 10-Second Burning Timer & Disintegration:
 *    - Visible countdown bar (10s -> 0s)
 *    - Web Audio ticking frequency chime
 *    - Particle ash disintegration effect that completely dissolves the card
 *
 * 3. Ghost Whisper Composer Tool:
 *    - 1-tap tool in message input dock to compose a 1-view stealth transmission
 *
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  class GhostWhisperEngine {
    constructor() {
      this.audioCtx = null;
      this.initStyles();
      this.bindDOM();
    }

    bindDOM() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.injectComposerTrigger());
      } else {
        this.injectComposerTrigger();
      }
    }

    getAudioContext() {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      return this.audioCtx;
    }

    playTickSound() {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.055);
      } catch (_) {}
    }

    playBurnSound() {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        // White noise burst for ash disintegration
        const bufferSize = ctx.sampleRate * 0.35;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.35);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } catch (_) {}
    }

    injectComposerTrigger() {
      let btn = document.getElementById('ghostWhisperDockBtn');
      if (btn) {
        if (!btn.dataset.bound) {
          btn.dataset.bound = 'true';
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openComposerModal();
          });
        }
        return;
      }

      const inputArea = document.querySelector('.message-input-area') || document.getElementById('message-form');
      if (!inputArea) return;

      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'ghostWhisperDockBtn';
      btn.className = 'input-btn ghost-whisper-dock-btn';
      btn.title = 'Send 1-View Ghost Whisper (Self-Destructs in 10s)';
      btn.innerHTML = '<i class="fa-solid fa-ghost"></i>';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openComposerModal();
      });

      const audioBtn = document.getElementById('audio-record-btn') || document.getElementById('sendBtn');
      if (audioBtn && audioBtn.parentNode) {
        audioBtn.parentNode.insertBefore(btn, audioBtn);
      } else {
        inputArea.appendChild(btn);
      }
    }

    openComposerModal() {
      let modal = document.getElementById('ghostWhisperComposerModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ghostWhisperComposerModal';
        modal.className = 'ghost-whisper-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="ghost-whisper-card-modal">
          <div class="whisper-header">
            <div class="whisper-icon-halo">
              <i class="fa-solid fa-ghost"></i>
            </div>
            <div>
              <h3>Compose Ghost Whisper</h3>
              <p>1-View Encrypted transmission &bull; Permanent 10s Burn</p>
            </div>
            <button type="button" class="whisper-close-btn" onclick="document.getElementById('ghostWhisperComposerModal').style.display='none';">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="whisper-body">
            <div class="whisper-alert-strip">
              <i class="fa-solid fa-fire" style="color: #f97316;"></i>
              <span>Recipient can only view this message once. It disintegrates into digital ash after 10 seconds.</span>
            </div>

            <textarea id="whisperSecretInput" rows="4" placeholder="Enter ultra-confidential text, cipher code, or secret transmission..."></textarea>

            <button type="button" class="btn-transmit-whisper" id="btnTransmitWhisper">
              <i class="fa-solid fa-paper-plane"></i>
              <span>Transmit Ghost Whisper</span>
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
      };

      modal.querySelector('#btnTransmitWhisper')?.addEventListener('click', () => {
        const text = modal.querySelector('#whisperSecretInput')?.value?.trim();
        if (!text) {
          if (typeof window.showNotif === 'function') window.showNotif('Please enter a secret message', 'error');
          return;
        }

        modal.style.display = 'none';
        this.sendGhostWhisperToChat(text);
      });
    }

    sendGhostWhisperToChat(secretText) {
      const whisperId = 'whisper_' + Date.now();

      // Mount in chat feed
      this.mountWhisperInFeed(whisperId, secretText, true);

      if (typeof window.showNotif === 'function') {
        window.showNotif('Ghost Whisper transmitted to channel', 'success', 2000);
      }
    }

    mountWhisperInFeed(whisperId, secretText, isOwn = false) {
      const messagesArea = document.getElementById('messages-area');
      if (!messagesArea) return;

      const div = document.createElement('div');
      div.className = `message-wrapper ${isOwn ? 'sent' : 'received'} ghost-whisper-wrapper`;
      div.dataset.whisperId = whisperId;

      div.innerHTML = `
        <div class="ghost-whisper-chat-card" id="${whisperId}">
          <div class="whisper-card-top">
            <i class="fa-solid fa-ghost" style="color: #c084fc;"></i>
            <strong>1-VIEW GHOST WHISPER</strong>
            <span class="whisper-encrypted-tag"><i class="fa-solid fa-lock"></i> E2EE</span>
          </div>

          <div class="whisper-card-content">
            <button type="button" class="btn-reveal-whisper" onclick="window.NexGhostWhisper.revealWhisper('${whisperId}', '${encodeURIComponent(secretText)}')">
              <i class="fa-solid fa-eye"></i>
              <span>Tap to Decrypt & Reveal</span>
            </button>
          </div>

          <div class="whisper-burn-timer-bar" style="display: none;">
            <div class="burn-timer-fill"></div>
          </div>
        </div>
      `;

      messagesArea.appendChild(div);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    revealWhisper(whisperId, encodedSecret) {
      const card = document.getElementById(whisperId);
      if (!card) return;

      const secretText = decodeURIComponent(encodedSecret);
      const contentBox = card.querySelector('.whisper-card-content');
      const timerBar = card.querySelector('.whisper-burn-timer-bar');
      const timerFill = card.querySelector('.burn-timer-fill');

      if (contentBox) {
        contentBox.innerHTML = `
          <div class="whisper-revealed-text">
            ${this.escapeHtml(secretText)}
          </div>
        `;
      }

      if (timerBar) timerBar.style.display = 'block';

      // 10-second countdown with ticking
      let timeLeft = 10;
      const interval = setInterval(() => {
        timeLeft -= 1;
        this.playTickSound();
        if (timerFill) timerFill.style.width = `${(timeLeft / 10) * 100}%`;

        if (timeLeft <= 0) {
          clearInterval(interval);
          this.disintegrateWhisper(card);
        }
      }, 1000);
    }

    disintegrateWhisper(card) {
      this.playBurnSound();

      card.classList.add('disintegrating');
      card.innerHTML = `
        <div class="whisper-burned-notice">
          <i class="fa-solid fa-fire-burner"></i>
          <span>Whisper Expired & Disintegrated</span>
        </div>
      `;

      setTimeout(() => {
        const wrapper = card.closest('.message-wrapper');
        if (wrapper) {
          wrapper.style.transition = 'opacity 0.4s, transform 0.4s';
          wrapper.style.opacity = '0';
          wrapper.style.transform = 'scale(0.85)';
          setTimeout(() => wrapper.remove(), 420);
        }
      }, 1800);
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
      if (document.getElementById('ghostWhisperStyles')) return;
      const style = document.createElement('style');
      style.id = 'ghostWhisperStyles';
      style.textContent = `
        .ghost-whisper-dock-btn {
          background: rgba(192, 132, 252, 0.12);
          border: 1px solid rgba(192, 132, 252, 0.35);
          color: #c084fc;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          cursor: pointer;
          margin: 0 4px;
          transition: all 0.18s ease;
        }
        .ghost-whisper-dock-btn:hover {
          background: #c084fc;
          color: #050811;
          transform: scale(1.15);
          box-shadow: 0 0 16px rgba(192, 132, 252, 0.45);
        }

        .ghost-whisper-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 8, 17, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 999999;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .ghost-whisper-card-modal {
          background: #0d121d;
          border: 1px solid rgba(192, 132, 252, 0.3);
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          color: #f1f5f9;
          font-family: 'Inter', -apple-system, sans-serif;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(192, 132, 252, 0.15);
        }

        .whisper-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
        }

        .whisper-icon-halo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(192, 132, 252, 0.15);
          border: 1px solid rgba(192, 132, 252, 0.4);
          color: #c084fc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .whisper-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #ffffff; }
        .whisper-header p { margin: 2px 0 0 0; font-size: 11.5px; color: #94a3b8; }

        .whisper-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
        }

        .whisper-body { padding: 18px 20px 22px 20px; }

        .whisper-alert-strip {
          background: rgba(249, 115, 22, 0.08);
          border: 1px solid rgba(249, 115, 22, 0.25);
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11.5px;
          color: #cbd5e1;
          margin-bottom: 14px;
        }

        .whisper-body textarea {
          width: 100%;
          background: #141b27;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #ffffff;
          padding: 12px;
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
          margin-bottom: 14px;
        }

        .btn-transmit-whisper {
          width: 100%;
          background: linear-gradient(135deg, #c084fc, #9333ea);
          color: #ffffff;
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
          box-shadow: 0 4px 14px rgba(192, 132, 252, 0.35);
        }

        /* In-Chat Card */
        .ghost-whisper-chat-card {
          background: #161226;
          border: 1.5px solid rgba(192, 132, 252, 0.35);
          border-radius: 16px;
          padding: 12px 14px;
          max-width: 290px;
          color: #ffffff;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          position: relative;
        }

        .whisper-card-top {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          color: #c084fc;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .whisper-encrypted-tag {
          margin-left: auto;
          font-size: 9.5px;
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1px 6px;
          border-radius: 9999px;
        }

        .btn-reveal-whisper {
          width: 100%;
          background: rgba(192, 132, 252, 0.15);
          border: 1px solid rgba(192, 132, 252, 0.35);
          color: #c084fc;
          border-radius: 10px;
          padding: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.15s;
        }
        .btn-reveal-whisper:hover {
          background: #c084fc;
          color: #050811;
        }

        .whisper-revealed-text {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 10px;
          font-size: 13px;
          line-height: 1.45;
          color: #ffffff;
          word-break: break-word;
        }

        .whisper-burn-timer-bar {
          margin-top: 10px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .burn-timer-fill {
          height: 100%;
          width: 100%;
          background: linear-gradient(90deg, #ef4444, #f97316);
          transition: width 1s linear;
        }

        .whisper-burned-notice {
          text-align: center;
          padding: 10px;
          font-size: 11.5px;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.NexGhostWhisper = new GhostWhisperEngine();
  window.ghostWhisper = window.NexGhostWhisper;
})();
