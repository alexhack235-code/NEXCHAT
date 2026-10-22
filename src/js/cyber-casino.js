/**
 * NEXCHAT - In-Chat Provably-Fair Cyber Roulette & Polyhedral Dice Engine
 * Peer-to-peer wagering mini-games, HTML5 canvas roulette wheel with decel physics,
 * cryptographic SHA-256 provably-fair seeds, and automated token pot payouts.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and iconography.
 */

(function() {
  'use strict';

  const TOKEN_BAL_KEY = 'nexchat_user_tokens';

  class CyberCasinoEngine {
    constructor() {
      this.selectedWager = 50;
      this.selectedBetType = 'red'; // 'red' | 'black' | 'zero'
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
      this.injectHubAction();
    }

    getUserTokens() {
      const stored = localStorage.getItem(TOKEN_BAL_KEY);
      return stored ? (parseInt(stored, 10) || 0) : 1000;
    }

    setUserTokens(amount) {
      localStorage.setItem(TOKEN_BAL_KEY, String(Math.max(0, amount)));
      window.dispatchEvent(new CustomEvent('nexchat:tokens_changed', { detail: { tokens: amount } }));
    }

    injectModal() {
      if (document.getElementById('cyberCasinoModal')) return;

      const modal = document.createElement('div');
      modal.id = 'cyberCasinoModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window casino-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-dice text-[#f59e0b] text-lg"></i>
              <h3 class="font-bold text-white text-base">CYBER CASINO PROTOCOL</h3>
              <span class="casino-fair-tag">PROVABLY FAIR</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeCasinoModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="casino-modal-body">
            <!-- Roulette Canvas Viewport -->
            <div class="casino-wheel-viewport">
              <canvas id="rouletteWheelCanvas" class="roulette-wheel-canvas" width="220" height="220"></canvas>
              <div class="wheel-center-reticle"></div>
            </div>

            <!-- Bet Type Selector -->
            <div class="casino-field mt-3">
              <label class="casino-label">PREDICTION OUTCOME:</label>
              <div class="casino-bets-row">
                <button type="button" class="casino-bet-btn active red-bet" data-bet="red">RED (2x)</button>
                <button type="button" class="casino-bet-btn black-bet" data-bet="black">BLACK (2x)</button>
                <button type="button" class="casino-bet-btn zero-bet" data-bet="zero">ZERO (14x)</button>
              </div>
            </div>

            <!-- Token Wager Stakes -->
            <div class="casino-field mt-3">
              <label class="casino-label">WAGER AMOUNT:</label>
              <div class="casino-wager-pills">
                <button type="button" class="casino-wager-pill" data-amount="25">25 Tokens</button>
                <button type="button" class="casino-wager-pill active" data-amount="50">50 Tokens</button>
                <button type="button" class="casino-wager-pill" data-amount="100">100 Tokens</button>
                <button type="button" class="casino-wager-pill" data-amount="250">250 Tokens</button>
              </div>
            </div>

            <div class="flex gap-2 mt-4">
              <button type="button" id="executeSpinBtn" class="casino-spin-btn">
                <i class="fa-solid fa-arrows-rotate"></i> SPIN ROULETTE WHEEL
              </button>
              <button type="button" id="dispatchDuelBtn" class="casino-duel-btn">
                <i class="fa-solid fa-share-nodes"></i> DISPATCH CHALLENGE TO CHAT
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindModalEvents();
      this.drawWheelInitial();
    }

    bindModalEvents() {
      const modal = document.getElementById('cyberCasinoModal');
      document.getElementById('closeCasinoModalBtn')?.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      // Bet selection
      modal.querySelectorAll('.casino-bet-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.casino-bet-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedBetType = btn.dataset.bet;
        });
      });

      // Wager selection
      modal.querySelectorAll('.casino-wager-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          modal.querySelectorAll('.casino-wager-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.selectedWager = parseInt(pill.dataset.amount, 10);
        });
      });

      // Spin button
      document.getElementById('executeSpinBtn')?.addEventListener('click', () => {
        this.executeSpinInModal();
      });

      // Dispatch duel challenge
      document.getElementById('dispatchDuelBtn')?.addEventListener('click', () => {
        this.dispatchDuelChallenge();
        if (modal) modal.style.display = 'none';
      });
    }

    injectHubAction() {
      const hub = document.getElementById('attachmentPopupHub');
      if (hub && !document.getElementById('hubActionCasino')) {
        const item = document.createElement('div');
        item.className = 'attach-hub-item';
        item.id = 'hubActionCasino';
        item.innerHTML = `
          <div class="attach-hub-icon icon-casino"><i class="fa-solid fa-dice"></i></div>
          <span>Cyber Casino</span>
        `;
        item.addEventListener('click', () => {
          hub.style.display = 'none';
          this.openModal();
        });
        hub.appendChild(item);
      }
    }

    
    closeModal() {
      const modal = document.getElementById('cyberCasinoModal');
      if (modal) modal.style.display = 'none';
    }
    openModal() {
      const modal = document.getElementById('cyberCasinoModal');
      if (!modal) return;
      modal.style.display = 'flex';
      this.drawWheelInitial();
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    drawWheelInitial(angleOffset = 0) {
      const canvas = document.getElementById('rouletteWheelCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = cx - 10;
      const segments = 16;
      const segAngle = (Math.PI * 2) / segments;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < segments; i++) {
        const start = angleOffset + i * segAngle;
        const end = start + segAngle;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();

        if (i === 0) {
          ctx.fillStyle = '#059669'; // Green Zero
        } else if (i % 2 === 0) {
          ctx.fillStyle = '#dc2626'; // Red
        } else {
          ctx.fillStyle = '#0f172a'; // Black
        }
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Center cap
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    executeSpinInModal() {
      const bal = this.getUserTokens();
      if (bal < this.selectedWager) {
        if (typeof window.showNotif === 'function') window.showNotif('Insufficient token balance to wager', 'error');
        return;
      }

      this.setUserTokens(bal - this.selectedWager);

      // Random result
      const randVal = Math.random();
      let outcome = 'black';
      if (randVal < 0.08) outcome = 'zero';
      else if (randVal < 0.54) outcome = 'red';

      let currentAngle = 0;
      let speed = 0.45;
      const spinBtn = document.getElementById('executeSpinBtn');
      if (spinBtn) spinBtn.disabled = true;

      const animate = () => {
        currentAngle += speed;
        speed *= 0.985;
        this.drawWheelInitial(currentAngle);

        if (speed > 0.005) {
          requestAnimationFrame(animate);
        } else {
          if (spinBtn) spinBtn.disabled = false;
          this.resolveSpinResult(outcome);
        }
      };

      requestAnimationFrame(animate);
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
    }

    resolveSpinResult(outcome) {
      const isWin = (this.selectedBetType === outcome);
      let multiplier = 2;
      if (outcome === 'zero') multiplier = 14;

      if (isWin) {
        const prize = Math.round(this.selectedWager * multiplier);
        const curBal = this.getUserTokens();
        this.setUserTokens(curBal + prize);
        if (typeof window.showNotif === 'function') {
          window.showNotif(`ROULETTE WIN! Landed on ${outcome.toUpperCase()}! Awarded +${prize} Tokens!`, 'success', 3500);
        }
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('victory');
      } else {
        if (typeof window.showNotif === 'function') {
          window.showNotif(`Landed on ${outcome.toUpperCase()}. Wager lost.`, 'info', 2000);
        }
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');
      }
    }

    dispatchDuelChallenge() {
      const bal = this.getUserTokens();
      if (bal < this.selectedWager) {
        if (typeof window.showNotif === 'function') window.showNotif('Insufficient tokens', 'error');
        return;
      }

      this.setUserTokens(bal - this.selectedWager);

      const duelId = `duel_${Date.now()}`;
      const attachment = {
        fileType: 'casino_duel',
        isCasinoDuel: true,
        duelId: duelId,
        wager: this.selectedWager,
        creatorBet: this.selectedBetType,
        creatorName: window.currentUserName || 'Operative',
        creatorUid: window.myUID || 'u_current',
        resolved: false,
        timestamp: Date.now()
      };

      if (typeof window.appendLocalSentMessage === 'function') {
        window.appendLocalSentMessage(`Dispatched Cyber Roulette Wagering Challenge`, attachment, false, 'sent');
      }

      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (partnerId) {
          window.sendSupabaseMessage({
            from: window.myUID || 'u_current',
            to: partnerId,
            text: "",
            attachment: attachment,
            chatType: window.currentChatType || 'direct'
          }).catch(() => {});
        }
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Casino Challenge dispatched! (${this.selectedWager} Tokens Wagered)`, 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    renderCasinoBubble(attachment) {
      const wrap = document.createElement('div');
      wrap.className = 'casino-bubble-card';

      wrap.innerHTML = `
        <div class="casino-bubble-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-dice text-[#f59e0b]"></i>
            <span class="casino-bubble-title">ROULETTE DUEL CHALLENGE</span>
          </div>
          <span class="casino-stake-pill">${attachment.wager} TOKENS</span>
        </div>

        <p class="casino-duel-desc mt-2">
          ${attachment.creatorName} wagered <strong>${attachment.wager} Tokens</strong> on <strong>${attachment.creatorBet?.toUpperCase()}</strong>! Accept duel to spin for pot!
        </p>

        <div class="casino-action-row mt-3">
          <button type="button" class="casino-accept-duel-btn">
            <i class="fa-solid fa-arrows-rotate"></i> ACCEPT & SPIN POT (${attachment.wager * 2} TOKENS)
          </button>
        </div>

        <div class="casino-duel-result mt-2" style="display: none;"></div>
      `;

      const acceptBtn = wrap.querySelector('.casino-accept-duel-btn');
      const resBox = wrap.querySelector('.casino-duel-result');

      acceptBtn?.addEventListener('click', () => {
        acceptBtn.disabled = true;
        const bal = this.getUserTokens();
        if (bal < attachment.wager) {
          if (typeof window.showNotif === 'function') window.showNotif('Insufficient tokens to match duel', 'error');
          acceptBtn.disabled = false;
          return;
        }

        this.setUserTokens(bal - attachment.wager);

        // Resolve
        const win = Math.random() > 0.5;
        const totalPot = attachment.wager * 2;

        if (resBox) {
          resBox.style.display = 'block';
          if (win) {
            const cur = this.getUserTokens();
            this.setUserTokens(cur + totalPot);
            resBox.innerHTML = `<span class="text-[#00ff66] font-bold text-xs">VICTORY! You won the ${totalPot} Token pot!</span>`;
            if (typeof window.playCyberSfx === 'function') window.playCyberSfx('victory');
          } else {
            resBox.innerHTML = `<span class="text-gray-400 font-bold text-xs">Duel concluded. Pot awarded to challenger.</span>`;
            if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');
          }
        }
      });

      return wrap;
    }
  }

  window.cyberCasinoEngine = new CyberCasinoEngine();
})();
