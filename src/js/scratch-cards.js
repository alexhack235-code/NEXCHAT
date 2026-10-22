/**
 * NEXCHAT - Holographic Scratch & Win Mystery Cards Engine
 * Interactive HTML5 canvas scratch foil, touch & cursor scratch physics,
 * real-time procedural prize matrix generation, and instant token payouts.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and iconography.
 */

(function() {
  'use strict';

  const TOKEN_BAL_KEY = 'nexchat_user_tokens';
  const SCRATCH_CACHE_KEY = 'nexchat_scratch_cards';

  const SYMBOLS = [
    { id: 'seven', label: '777', weight: 1, multiplier: 10, color: '#f59e0b' },
    { id: 'diamond', label: 'DIAMOND', weight: 2, multiplier: 5, color: '#00d4ff' },
    { id: 'quantum', label: 'QUANTUM', weight: 3, multiplier: 3, color: '#00ff66' },
    { id: 'chip', label: 'NEURAL', weight: 4, multiplier: 2, color: '#a855f7' },
    { id: 'shield', label: 'ENCLAVE', weight: 5, multiplier: 1.5, color: '#ec4899' }
  ];

  class ScratchCardsEngine {
    constructor() {
      this.selectedCost = 50;
      this.cards = this.loadCards();
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

    loadCards() {
      try {
        const raw = localStorage.getItem(SCRATCH_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }

    saveCards() {
      try {
        localStorage.setItem(SCRATCH_CACHE_KEY, JSON.stringify(this.cards));
      } catch (e) {}
    }

    injectModal() {
      if (document.getElementById('createScratchCardModal')) return;

      const modal = document.createElement('div');
      modal.id = 'createScratchCardModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window scratch-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-ticket text-[#00d4ff] text-lg"></i>
              <h3 class="font-bold text-white text-base">DISPATCH MYSTERY SCRATCH CARD</h3>
            </div>
            <button type="button" class="cyber-modal-close" id="closeScratchModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="scratch-modal-body">
            <p class="text-xs text-gray-300 text-center mb-3">
              Deploy an interactive holographic scratch card into the chat. The recipient scratches off the security foil to reveal matched symbols and claim tokens.
            </p>

            <div class="scratch-field-group">
              <label class="scratch-label">CARD TITLE / SERIES:</label>
              <input type="text" id="scratchTitleInput" class="scratch-text-input" placeholder="e.g. Cyberpunk Quantum Matrix Jackpot" maxlength="60" value="Tactical Quantum Jackpot" />
            </div>

            <div class="scratch-field-group mt-3">
              <label class="scratch-label">TOKEN STAKE / TIER:</label>
              <div class="scratch-pills-row">
                <button type="button" class="scratch-tier-pill" data-cost="0">Free Trial (0 Tokens)</button>
                <button type="button" class="scratch-tier-pill active" data-cost="50">50 Tokens</button>
                <button type="button" class="scratch-tier-pill" data-cost="100">100 Tokens</button>
                <button type="button" class="scratch-tier-pill" data-cost="250">250 Tokens</button>
              </div>
            </div>

            <button type="button" id="confirmDispatchScratchBtn" class="scratch-dispatch-btn mt-4">
              <i class="fa-solid fa-bolt"></i> DISPATCH SCRATCH CARD TO CHAT
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('closeScratchModalBtn')?.addEventListener('click', () => {
        this.closeModal();
      });

      modal.querySelectorAll('.scratch-tier-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          modal.querySelectorAll('.scratch-tier-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.selectedCost = parseInt(pill.dataset.cost, 10);
        });
      });

      document.getElementById('confirmDispatchScratchBtn')?.addEventListener('click', () => {
        this.executeDispatch();
      });
    }

    injectHubAction() {
      const hub = document.getElementById('attachmentPopupHub');
      if (hub && !document.getElementById('hubActionScratchCard')) {
        const item = document.createElement('div');
        item.className = 'attach-hub-item';
        item.id = 'hubActionScratchCard';
        item.innerHTML = `
          <div class="attach-hub-icon icon-scratch"><i class="fa-solid fa-ticket"></i></div>
          <span>Scratch Card</span>
        `;
        item.addEventListener('click', () => {
          hub.style.display = 'none';
          this.openModal();
        });
        hub.appendChild(item);
      }
    }

    openModal() {
      const modal = document.getElementById('createScratchCardModal');
      if (!modal) return;
      modal.style.display = 'flex';
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    closeModal() {
      const modal = document.getElementById('createScratchCardModal');
      if (modal) modal.style.display = 'none';
    }

    executeDispatch() {
      const titleInput = document.getElementById('scratchTitleInput');
      const title = titleInput ? titleInput.value.trim() : 'Tactical Quantum Jackpot';

      const userTokens = this.getUserTokens();
      if (this.selectedCost > 0 && userTokens < this.selectedCost) {
        if (typeof window.showNotif === 'function') window.showNotif('Insufficient tokens to dispatch card', 'error');
        return;
      }

      if (this.selectedCost > 0) {
        this.setUserTokens(userTokens - this.selectedCost);
      }

      const cardId = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const creatorUid = window.myUID || 'u_current';

      // Generate 3x3 grid with predetermined outcome
      const grid = this.generateGrid();
      const outcome = this.evaluateGrid(grid);

      const cardData = {
        cardId: cardId,
        title: title,
        cost: this.selectedCost,
        grid: grid,
        isWin: outcome.isWin,
        winSymbol: outcome.winSymbol,
        payout: outcome.isWin ? Math.round(this.selectedCost * outcome.multiplier) : 0,
        creatorUid: creatorUid,
        claimed: false,
        scratched: false,
        timestamp: Date.now()
      };

      this.cards[cardId] = cardData;
      this.saveCards();

      const attachment = {
        fileType: 'scratch_card',
        isScratchCard: true,
        scratchData: cardData
      };

      if (typeof window.appendLocalSentMessage === 'function') {
        window.appendLocalSentMessage(`Dispatched Holographic Scratch Card: "${title}"`, attachment, false, 'sent');
      }

      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (partnerId) {
          window.sendSupabaseMessage({
            from: creatorUid,
            to: partnerId,
            text: "",
            attachment: attachment,
            chatType: window.currentChatType || 'direct'
          }).catch(() => {});
        }
      }

      this.closeModal();

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Holographic Scratch Card dispatched!`, 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    generateGrid() {
      // 30% chance to force a 3-match win for rewarding game feel
      const forceWin = Math.random() < 0.35;
      const grid = [];

      if (forceWin) {
        const winningSym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const row = Math.floor(Math.random() * 3);
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (r === row) {
              grid.push(winningSym.id);
            } else {
              const randSym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
              grid.push(randSym.id);
            }
          }
        }
      } else {
        for (let i = 0; i < 9; i++) {
          const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          grid.push(sym.id);
        }
      }
      return grid;
    }

    evaluateGrid(grid) {
      // Check rows
      for (let r = 0; r < 3; r++) {
        const s0 = grid[r * 3];
        const s1 = grid[r * 3 + 1];
        const s2 = grid[r * 3 + 2];
        if (s0 === s1 && s1 === s2) {
          const symObj = SYMBOLS.find(s => s.id === s0);
          return { isWin: true, winSymbol: symObj.label, multiplier: symObj.multiplier };
        }
      }

      // Check cols
      for (let c = 0; c < 3; c++) {
        const s0 = grid[c];
        const s1 = grid[c + 3];
        const s2 = grid[c + 6];
        if (s0 === s1 && s1 === s2) {
          const symObj = SYMBOLS.find(s => s.id === s0);
          return { isWin: true, winSymbol: symObj.label, multiplier: symObj.multiplier };
        }
      }

      // Check diagonals
      if (grid[0] === grid[4] && grid[4] === grid[8]) {
        const symObj = SYMBOLS.find(s => s.id === grid[0]);
        return { isWin: true, winSymbol: symObj.label, multiplier: symObj.multiplier };
      }
      if (grid[2] === grid[4] && grid[4] === grid[6]) {
        const symObj = SYMBOLS.find(s => s.id === grid[2]);
        return { isWin: true, winSymbol: symObj.label, multiplier: symObj.multiplier };
      }

      return { isWin: false, winSymbol: null, multiplier: 0 };
    }

    renderScratchBubble(attachment) {
      const card = attachment.scratchData || {};
      const cardId = card.cardId || `sc_${Date.now()}`;
      if (!this.cards[cardId]) {
        this.cards[cardId] = card;
        this.saveCards();
      }

      const activeCard = this.cards[cardId] || card;
      const wrap = document.createElement('div');
      wrap.className = 'scratch-bubble-card';
      wrap.id = `scratchCard_${cardId}`;

      wrap.innerHTML = `
        <div class="scratch-bubble-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-ticket text-[#00d4ff]"></i>
            <span class="scratch-card-title">${activeCard.title}</span>
          </div>
          <span class="scratch-tier-tag">${activeCard.cost > 0 ? activeCard.cost + ' TOKENS' : 'FREE TRIAL'}</span>
        </div>

        <div class="scratch-canvas-container" id="scratchContainer_${cardId}">
          <!-- Underlying Grid -->
          <div class="scratch-symbols-grid">
            ${activeCard.grid.map((sId, idx) => {
              const sym = SYMBOLS.find(s => s.id === sId) || SYMBOLS[0];
              return `
                <div class="scratch-slot-cell" data-idx="${idx}">
                  <span class="scratch-slot-label" style="color: ${sym.color};">${sym.label}</span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Holographic Scratch Foil Canvas -->
          <canvas class="scratch-foil-canvas" id="canvas_${cardId}" width="280" height="180"></canvas>
        </div>

        <div class="scratch-footer mt-2" id="scratchFooter_${cardId}">
          ${activeCard.claimed ? `
            <span class="scratch-claimed-tag">STATUS: SCRATCHED & CLAIMED</span>
          ` : `
            <span class="scratch-hint-text">DRAG CURSOR OVER FOIL TO SCRATCH</span>
            <button type="button" class="scratch-reveal-all-btn" data-card-id="${cardId}">REVEAL ALL</button>
          `}
        </div>
      `;

      setTimeout(() => {
        this.initFoilCanvas(cardId, activeCard);
      }, 50);

      const revealBtn = wrap.querySelector('.scratch-reveal-all-btn');
      revealBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.revealCardComplete(cardId, activeCard);
      });

      return wrap;
    }

    initFoilCanvas(cardId, card) {
      const canvas = document.getElementById(`canvas_${cardId}`);
      if (!canvas || card.scratched || card.claimed) {
        if (canvas) canvas.style.display = 'none';
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw metallic silver holographic foil
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#334155');
      grad.addColorStop(0.3, '#64748b');
      grad.addColorStop(0.5, '#94a3b8');
      grad.addColorStop(0.7, '#475569');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Foil text
      ctx.fillStyle = '#00d4ff';
      ctx.font = '700 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ SCRATCH FOIL TO REVEAL ]', canvas.width / 2, canvas.height / 2 - 6);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 10px monospace';
      ctx.fillText('MATCH 3 SYMBOLS TO WIN', canvas.width / 2, canvas.height / 2 + 12);

      let isScratching = false;

      const scratch = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();

        this.checkScratchProgress(cardId, card, ctx, canvas);
      };

      canvas.addEventListener('mousedown', (e) => {
        isScratching = true;
        scratch(e.clientX, e.clientY);
      });

      canvas.addEventListener('mousemove', (e) => {
        if (isScratching) scratch(e.clientX, e.clientY);
      });

      window.addEventListener('mouseup', () => {
        isScratching = false;
      });

      canvas.addEventListener('touchstart', (e) => {
        isScratching = true;
        if (e.touches[0]) scratch(e.touches[0].clientX, e.touches[0].clientY);
      });

      canvas.addEventListener('touchmove', (e) => {
        if (isScratching && e.touches[0]) {
          scratch(e.touches[0].clientX, e.touches[0].clientY);
        }
      });

      canvas.addEventListener('touchend', () => {
        isScratching = false;
      });
    }

    checkScratchProgress(cardId, card, ctx, canvas) {
      if (card.claimed) return;

      // Sample pixels periodically
      if (Math.random() < 0.25) {
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let transparentPixels = 0;
          for (let i = 3; i < imgData.data.length; i += 16) {
            if (imgData.data[i] === 0) transparentPixels++;
          }
          const totalSampled = imgData.data.length / 16;
          const pct = transparentPixels / totalSampled;

          if (pct > 0.42) {
            this.revealCardComplete(cardId, card);
          }
        } catch (e) {}
      }
    }

    revealCardComplete(cardId, card) {
      if (card.claimed) return;

      const canvas = document.getElementById(`canvas_${cardId}`);
      if (canvas) canvas.style.display = 'none';

      card.scratched = true;
      card.claimed = true;
      this.cards[cardId] = card;
      this.saveCards();

      const footer = document.getElementById(`scratchFooter_${cardId}`);
      if (footer) {
        if (card.isWin) {
          footer.innerHTML = `
            <div class="scratch-win-banner">
              <strong class="text-[#00ff66]">WINNER! Matched 3x ${card.winSymbol}!</strong>
              <span class="text-xs text-white">Awarded +${card.payout} Tokens!</span>
            </div>
          `;
        } else {
          footer.innerHTML = `
            <div class="scratch-lose-banner">
              <span class="text-xs text-gray-400">No match on this sequence. Try another tactical card!</span>
            </div>
          `;
        }
      }

      if (card.isWin && card.payout > 0) {
        const curBal = this.getUserTokens();
        this.setUserTokens(curBal + card.payout);
        if (typeof window.showNotif === 'function') {
          window.showNotif(`SCRATCH WIN! +${card.payout} Tokens Claimed!`, 'success', 3500);
        }
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('victory');
      } else {
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');
      }
    }
  }

  window.scratchCardsEngine = new ScratchCardsEngine();
})();
