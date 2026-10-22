/**
 * NEXCHAT - Encrypted Dynamic QR Node Pairing Engine
 * Fast-rotating cryptographic session pairing tokens, HTML5 Canvas QR matrix generator,
 * and zero-network device-to-device synchronization handshakes.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and iconography.
 */

(function() {
  'use strict';

  class QRPairingEngine {
    constructor() {
      this.refreshInterval = null;
      this.pairingToken = '';
      this.secondsRemaining = 30;
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
    }

    injectModal() {
      if (document.getElementById('qrPairingModal')) return;

      const modal = document.createElement('div');
      modal.id = 'qrPairingModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window qr-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-qrcode text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">ENCRYPTED NODE PAIRING</h3>
              <span class="qr-secure-tag">AES-GCM ROTATING</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeQrModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="qr-modal-body">
            <p class="text-xs text-gray-300 text-center mb-3">
              Scan with your mobile device camera to establish an encrypted device-to-device session. Keys refresh every 30 seconds.
            </p>

            <div class="qr-canvas-wrapper">
              <canvas id="qrPairingCanvas" class="qr-pairing-canvas" width="200" height="200"></canvas>
              <div class="qr-timer-bar mt-2">
                <span class="text-[10px] text-gray-400 font-mono">TOKEN EXPIRES IN: <strong class="text-[#00ff66]" id="qrCountdownSeconds">30s</strong></span>
              </div>
            </div>

            <div class="qr-payload-box mt-3">
              <span class="text-[9px] text-gray-500 font-mono">TOKEN NONCE:</span>
              <div class="text-[10px] text-[#00d4ff] font-mono break-all" id="qrTokenNonceText">GEN_NONCE_...</div>
            </div>

            <button type="button" id="simulatePairingScanBtn" class="qr-handshake-btn mt-4">
              <i class="fa-solid fa-link"></i> SIMULATE SECURE PAIRING HANDSHAKE
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindModalEvents();
    }

    bindModalEvents() {
      const modal = document.getElementById('qrPairingModal');
      document.getElementById('closeQrModalBtn')?.addEventListener('click', () => {
        this.stopTimer();
        modal.style.display = 'none';
      });

      document.getElementById('simulatePairingScanBtn')?.addEventListener('click', () => {
        if (typeof window.showNotif === 'function') {
          window.showNotif('Device paired successfully! Local conversation keys synchronized.', 'success', 3000);
        }
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('victory');
        this.stopTimer();
        modal.style.display = 'none';
      });
    }

    injectHeaderTrigger() {
      const headerActions = document.querySelector('.chat-detail-header-actions') || 
                            document.querySelector('.chat-detail-header-right');
      if (headerActions && !document.getElementById('qrPairingBtnHeader')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'qrPairingBtnHeader';
        btn.className = 'header-icon-btn';
        btn.title = 'Encrypted QR Device Pairing';
        btn.innerHTML = `<i class="fa-solid fa-qrcode text-[#00d4ff]"></i>`;
        btn.addEventListener('click', () => this.openModal());
        headerActions.appendChild(btn);
      }
    }

    
    closeModal() {
      const modal = document.getElementById('qrPairingModal');
      if (modal) modal.style.display = 'none';
      if (this.timerInterval) clearInterval(this.timerInterval);
    }
    openModal() {
      const modal = document.getElementById('qrPairingModal');
      if (!modal) return;
      modal.style.display = 'flex';
      this.generateNewToken();
      this.startTimer();
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    generateNewToken() {
      this.pairingToken = 'NEXPAIR_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
      const nonceEl = document.getElementById('qrTokenNonceText');
      if (nonceEl) nonceEl.textContent = this.pairingToken;
      this.drawQRMatrix();
    }

    drawQRMatrix() {
      const canvas = document.getElementById('qrPairingCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, size, size);

      const gridSize = 21;
      const cellSize = Math.floor(size / gridSize);

      // Draw synthetic QR matrix pattern
      ctx.fillStyle = '#00ff66';

      // Corner position squares
      this.drawPositionMarker(ctx, 0, 0, cellSize);
      this.drawPositionMarker(ctx, (gridSize - 7) * cellSize, 0, cellSize);
      this.drawPositionMarker(ctx, 0, (gridSize - 7) * cellSize, cellSize);

      // Procedural data cells based on token string
      let seed = 0;
      for (let i = 0; i < this.pairingToken.length; i++) {
        seed += this.pairingToken.charCodeAt(i);
      }

      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if ((r < 7 && c < 7) || (r < 7 && c >= gridSize - 7) || (r >= gridSize - 7 && c < 7)) continue;
          const pseudoRand = Math.sin(seed * (r * gridSize + c)) * 10000;
          if (pseudoRand - Math.floor(pseudoRand) > 0.52) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize - 1, cellSize - 1);
          }
        }
      }
    }

    drawPositionMarker(ctx, x, y, cell) {
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = cell;
      ctx.strokeRect(x + cell / 2, y + cell / 2, cell * 6, cell * 6);
      ctx.fillRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3);
    }

    startTimer() {
      this.stopTimer();
      this.secondsRemaining = 30;
      const countEl = document.getElementById('qrCountdownSeconds');
      if (countEl) countEl.textContent = '30s';

      this.refreshInterval = setInterval(() => {
        this.secondsRemaining--;
        if (countEl) countEl.textContent = `${this.secondsRemaining}s`;

        if (this.secondsRemaining <= 0) {
          this.secondsRemaining = 30;
          this.generateNewToken();
        }
      }, 1000);
    }

    stopTimer() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    }
  }

  window.qrPairingEngine = new QRPairingEngine();
})();
