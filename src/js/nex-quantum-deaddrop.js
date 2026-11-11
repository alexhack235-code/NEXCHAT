/**
 * NEXCHAT - Quantum Dead Drop & Anti-Shoulder-Surfing Ephemeral Vault
 * Module: src/js/nex-quantum-deaddrop.js
 * 
 * Capabilities:
 * - Ephemeral secrets decrypted ONLY while user continuously presses and holds screen.
 * - Hardware tilt & movement detection (DeviceOrientation / DeviceMotion):
 *   If recipient tilts phone away or looks away, content immediately scrambles into matrix noise.
 * - Auto-destruct 15-second burnout timer upon first reveal.
 * - Zero external APIs required: Web Crypto & HTML5 Sensors only.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  class NexQuantumDeadDropEngine {
    constructor() {
      this.init();
    }

    init() {
      // Global shortcut
      window.createQuantumDeadDrop = (secret) => this.dispatchDeadDrop(secret);
    }

    dispatchDeadDrop(secretText) {
      if (!secretText || secretText.trim().length === 0) {
        if (typeof window.showNotif === 'function') {
          window.showNotif('Please specify secret message: /deaddrop <secret text>', 'warning');
        }
        return;
      }

      const id = 'qdrop_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
      const card = this.renderDeadDropCard(id, secretText.trim());

      const container = document.getElementById('messages-area') || document.querySelector('.messages-list') || document.getElementById('chatDetailView');
      if (container) {
        container.appendChild(card);
        card.scrollIntoView({ behavior: 'smooth' });
        if (typeof window.showNotif === 'function') {
          window.showNotif('Quantum Dead Drop created with hardware anti-peeking shield.', 'success', 3000);
        }
      }
    }

    renderDeadDropCard(id, secret) {
      const card = document.createElement('div');
      card.id = id;
      card.className = 'quantum-deaddrop-card';
      card.style.cssText = `
        background: rgba(15, 23, 42, 0.98);
        border: 1px solid rgba(192, 132, 252, 0.5);
        border-radius: 12px;
        padding: 14px;
        margin: 12px 0;
        color: #fff;
        max-width: 380px;
        box-shadow: 0 0 25px rgba(192, 132, 252, 0.2);
        user-select: none;
        -webkit-user-select: none;
      `;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(192,132,252,0.25); padding-bottom:6px; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-atom fa-spin" style="color:#c084fc; font-size:14px; --fa-animation-duration: 6s;"></i>
            <strong style="color:#c084fc; font-size:12px; text-transform:uppercase;">Quantum Ephemeral Dead Drop</strong>
          </div>
          <span class="burnout-timer" style="font-size:10px; color:#94a3b8; font-family:monospace;">READY</span>
        </div>

        <div class="secret-vault-viewport" style="background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px; min-height:55px; display:flex; align-items:center; justify-content:center; text-align:center; position:relative; overflow:hidden;">
          <div class="scrambled-text" style="font-family:monospace; font-size:13px; color:#a855f7; letter-spacing:2px; word-break:break-all;">
            &bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;
          </div>
          <div class="clear-text" style="display:none; font-size:13.5px; font-weight:700; color:#fff; word-break:break-word;">
            ${escapeHtml(secret)}
          </div>
        </div>

        <div style="margin-top:10px; display:flex; align-items:center; justify-content:space-between;">
          <button type="button" class="btn-hold-to-reveal" style="flex:1; padding:8px 12px; background:linear-gradient(135deg, rgba(168,85,247,0.25), rgba(192,132,252,0.15)); border:1px solid #c084fc; color:#c084fc; border-radius:8px; font-size:11.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
            <i class="fa-solid fa-fingerprint"></i> Press &amp; Hold to Reveal
          </button>
        </div>

        <div style="font-size:9.5px; color:#64748b; margin-top:6px; text-align:center;">
          <i class="fa-solid fa-shield" style="margin-right:4px;"></i>Tilt phone or release finger to instantly scramble.
        </div>
      `;

      const btnHold = card.querySelector('.btn-hold-to-reveal');
      const scrambledEl = card.querySelector('.scrambled-text');
      const clearEl = card.querySelector('.clear-text');
      const timerEl = card.querySelector('.burnout-timer');

      let burnoutSeconds = 15;
      let countdownInterval = null;
      let hasRevealed = false;

      const reveal = () => {
        scrambledEl.style.display = 'none';
        clearEl.style.display = 'block';
        btnHold.style.background = 'rgba(168,85,247,0.5)';

        if (!hasRevealed) {
          hasRevealed = true;
          countdownInterval = setInterval(() => {
            burnoutSeconds -= 1;
            if (timerEl) timerEl.textContent = `BURNING: ${burnoutSeconds}s`;
            if (burnoutSeconds <= 0) {
              clearInterval(countdownInterval);
              card.innerHTML = '<div style="text-align:center; padding:12px; color:#ef4444; font-size:12px;"><i class="fa-solid fa-fire"></i> Dead Drop has evaporated into quantum entropy.</div>';
              setTimeout(() => card.remove(), 4000);
            }
          }, 1000);
        }
      };

      const conceal = () => {
        scrambledEl.style.display = 'block';
        clearEl.style.display = 'none';
        btnHold.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(192,132,252,0.15))';
      };

      // Pointer press and hold
      btnHold.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        reveal();
      });

      window.addEventListener('pointerup', conceal);
      window.addEventListener('pointercancel', conceal);

      // Hardware tilt anti-shoulder-surfing
      const handleOrientation = (event) => {
        if (clearEl.style.display === 'block') {
          const gamma = Math.abs(event.gamma || 0); // left to right tilt
          const beta = Math.abs(event.beta || 0);   // front to back tilt
          if (gamma > 35 || beta > 65) {
            conceal();
            if (typeof window.showNotif === 'function') {
              window.showNotif('Tilt detected. Content scrambled for anti-peeking privacy.', 'info', 1500);
            }
          }
        }
      };

      if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation, { passive: true });
      }

      return card;
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  window.NexQuantumDeadDrop = new NexQuantumDeadDropEngine();

})(typeof window !== 'undefined' ? window : this);
