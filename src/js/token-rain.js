/**
 * NEXCHAT - Token Rain & Cyber Drop Engine
 * Live in-chat group bounties, instant scramble claims, and token distribution.
 */

(function() {
  'use strict';

  const TOKEN_BAL_KEY = 'nexchat_user_tokens';
  const DROPS_CACHE_KEY = 'nexchat_drops_cache';

  class TokenRainEngine {
    constructor() {
      this.selectedPot = 250;
      this.selectedRecipients = 5;
      this.drops = this.loadDropsCache();
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
      this.injectModals();
      this.injectHubAction();
      this.listenSupabaseRealtime();
    }

    getUserTokens() {
      const stored = localStorage.getItem(TOKEN_BAL_KEY);
      if (stored === null) {
        // Default seed balance for active operatives
        localStorage.setItem(TOKEN_BAL_KEY, '1000');
        return 1000;
      }
      return parseInt(stored, 10) || 0;
    }

    setUserTokens(amount) {
      localStorage.setItem(TOKEN_BAL_KEY, String(Math.max(0, amount)));
      // Dispatch event for any other UI displays
      window.dispatchEvent(new CustomEvent('nexchat:tokens_changed', { detail: { tokens: amount } }));
    }

    loadDropsCache() {
      try {
        const raw = localStorage.getItem(DROPS_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }

    saveDropsCache() {
      try {
        localStorage.setItem(DROPS_CACHE_KEY, JSON.stringify(this.drops));
      } catch (e) {}
    }

    injectModals() {
      if (document.getElementById('tokenDropModal')) return;

      const modal = document.createElement('div');
      modal.id = 'tokenDropModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window token-drop-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-coins text-amber-400 text-lg"></i>
              <h3 class="font-bold text-white text-base">DISPATCH CYBER TOKEN RAIN</h3>
            </div>
            <button type="button" class="cyber-modal-close" id="closeTokenDropModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="token-drop-body">
            <p class="text-xs text-gray-300 text-center mb-3">
              Drop an encrypted token bounty into the chat. The fastest operatives to tap the crate claim a randomized slice of the pot!
            </p>

            <div class="token-balance-display-card">
              <span>YOUR AVAILABLE BALANCE:</span>
              <strong id="dropModalUserBalance" class="text-amber-400">1,000 NEX</strong>
            </div>

            <div class="wager-selector-title mt-3">SELECT TOTAL BOUNTY POT:</div>
            <div class="drop-pot-pills-row">
              <button type="button" class="drop-pot-pill" data-pot="100">100 🪙</button>
              <button type="button" class="drop-pot-pill active" data-pot="250">250 🪙</button>
              <button type="button" class="drop-pot-pill" data-pot="500">500 🪙</button>
              <button type="button" class="drop-pot-pill" data-pot="1000">1,000 🪙</button>
            </div>

            <div class="wager-selector-title mt-4">MAX LUCKY CLAIMANTS:</div>
            <div class="drop-recipients-pills-row">
              <button type="button" class="drop-recip-pill" data-recip="2">2 Operatives</button>
              <button type="button" class="drop-recip-pill" data-recip="3">3 Operatives</button>
              <button type="button" class="drop-recip-pill active" data-recip="5">5 Operatives</button>
              <button type="button" class="drop-recip-pill" data-recip="10">10 Operatives</button>
            </div>

            <div class="mt-4">
              <input type="text" id="dropBountyNote" class="drop-bounty-input" placeholder="Optional bounty memo (e.g. Fastest hacker wins!)" maxlength="60" />
            </div>

            <button type="button" id="confirmDispatchDropBtn" class="token-drop-dispatch-btn mt-4">
              <i class="fa-solid fa-bolt"></i> LAUNCH TOKEN RAIN (<span id="dispatchBtnPotVal">250</span> 🪙)
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Close modal
      document.getElementById('closeTokenDropModalBtn')?.addEventListener('click', () => {
        this.closeModal();
      });

      // Pot selection
      modal.querySelectorAll('.drop-pot-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.drop-pot-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedPot = parseInt(btn.dataset.pot, 10);
          const btnSpan = document.getElementById('dispatchBtnPotVal');
          if (btnSpan) btnSpan.textContent = this.selectedPot.toLocaleString();
        });
      });

      // Recipients selection
      modal.querySelectorAll('.drop-recip-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.drop-recip-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedRecipients = parseInt(btn.dataset.recip, 10);
        });
      });

      // Confirm dispatch
      document.getElementById('confirmDispatchDropBtn')?.addEventListener('click', () => {
        this.executeDispatch();
      });
    }

    injectHubAction() {
      const hub = document.getElementById('attachmentPopupHub');
      if (hub && !document.getElementById('hubActionTokenRain')) {
        const item = document.createElement('div');
        item.className = 'attach-hub-item';
        item.id = 'hubActionTokenRain';
        item.innerHTML = `
          <div class="attach-hub-icon icon-token-rain"><i class="fa-solid fa-coins"></i></div>
          <span>Token Rain</span>
        `;
        item.addEventListener('click', () => {
          hub.style.display = 'none';
          this.openModal();
        });
        hub.appendChild(item);
      }
    }

    openModal() {
      const modal = document.getElementById('tokenDropModal');
      if (!modal) return;
      const balEl = document.getElementById('dropModalUserBalance');
      if (balEl) balEl.textContent = `${this.getUserTokens().toLocaleString()} NEX`;
      modal.style.display = 'flex';
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    closeModal() {
      const modal = document.getElementById('tokenDropModal');
      if (modal) modal.style.display = 'none';
    }

    executeDispatch() {
      const balance = this.getUserTokens();
      if (balance < this.selectedPot) {
        if (typeof window.showNotif === 'function') {
          window.showNotif(`Insufficient tokens! You have ${balance} NEX, need ${this.selectedPot} NEX`, 'error');
        }
        return;
      }

      const noteInput = document.getElementById('dropBountyNote');
      const memo = (noteInput && noteInput.value.trim()) ? noteInput.value.trim() : 'Fastest fingers claim the bounty!';

      // Deduct balance
      this.setUserTokens(balance - this.selectedPot);

      const dropId = `drop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const senderUid = window.myUID || (localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')).uid : 'u_current');
      const senderName = window.currentUserName || 'Operative';

      const dropPayload = {
        dropId: dropId,
        senderUid: senderUid,
        senderName: senderName,
        totalPot: this.selectedPot,
        remainingPot: this.selectedPot,
        maxClaims: this.selectedRecipients,
        memo: memo,
        claims: [],
        timestamp: Date.now()
      };

      // Store in local cache
      this.drops[dropId] = dropPayload;
      this.saveDropsCache();

      // Dispatch as chat attachment
      const dropAttachment = {
        fileType: 'token_rain',
        isTokenRain: true,
        dropData: dropPayload
      };

      if (typeof window.dispatchTokenRain === 'function') {
        window.dispatchTokenRain(dropAttachment);
      } else if (typeof window.appendLocalSentMessage === 'function') {
        window.appendLocalSentMessage(`🪙 Dropped a ${this.selectedPot} NEX Token Rain!`, dropAttachment, false, 'sent');
      }

      this.broadcastDropEvent(dropPayload, 'create');
      this.closeModal();

      if (typeof window.showNotif === 'function') {
        window.showNotif(`⚡ Dispatched ${this.selectedPot} NEX Token Rain!`, 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    claimDrop(dropId) {
      let drop = this.drops[dropId];
      if (!drop) {
        // Fallback: look in localStorage
        const raw = localStorage.getItem(DROPS_CACHE_KEY);
        const cache = raw ? JSON.parse(raw) : {};
        drop = cache[dropId];
      }

      if (!drop) {
        if (typeof window.showNotif === 'function') window.showNotif('Token drop not found or expired', 'error');
        return;
      }

      const currentUid = window.myUID || (localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')).uid : 'u_current');
      const currentName = window.currentUserName || 'You';

      // Check if already claimed
      const already = drop.claims.find(c => c.uid === currentUid);
      if (already) {
        if (typeof window.showNotif === 'function') window.showNotif(`You already claimed ${already.amount} NEX from this drop!`, 'info');
        return;
      }

      if (drop.claims.length >= drop.maxClaims || drop.remainingPot <= 0) {
        if (typeof window.showNotif === 'function') window.showNotif('All bounties have been claimed! Crate depleted.', 'info');
        return;
      }

      // Calculate share
      const claimsLeft = drop.maxClaims - drop.claims.length;
      let share = 0;
      if (claimsLeft === 1) {
        share = drop.remainingPot;
      } else {
        const avg = Math.floor(drop.remainingPot / claimsLeft);
        // Randomized spread between 50% and 150% of avg
        const min = Math.max(1, Math.floor(avg * 0.5));
        const max = Math.min(drop.remainingPot - (claimsLeft - 1), Math.floor(avg * 1.5));
        share = Math.floor(Math.random() * (max - min + 1)) + min;
      }

      drop.remainingPot -= share;
      const claimRecord = {
        uid: currentUid,
        name: currentName,
        amount: share,
        time: Date.now()
      };
      drop.claims.push(claimRecord);

      this.drops[dropId] = drop;
      this.saveDropsCache();

      // Award tokens
      const curTokens = this.getUserTokens();
      this.setUserTokens(curTokens + share);

      // Trigger Confetti / Coin Burst
      this.spawnCoinBurst();

      // Update UI bubble
      this.updateBubbleUI(dropId, drop);

      // Broadcast claim to partner
      this.broadcastDropEvent(drop, 'claim');

      if (typeof window.showNotif === 'function') {
        window.showNotif(`🎉 JACKPOT! Claimed +${share} NEX Credits!`, 'success', 3000);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
    }

    renderDropBubble(attachment) {
      const drop = attachment.dropData || {};
      const dropId = drop.dropId || `drop_${Date.now()}`;
      if (!this.drops[dropId]) {
        this.drops[dropId] = drop;
        this.saveDropsCache();
      }

      const activeDrop = this.drops[dropId] || drop;
      const container = document.createElement('div');
      container.className = 'token-rain-bubble-card';
      container.id = `tokenDrop_${dropId}`;

      const currentUid = window.myUID || (localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')).uid : 'u_current');
      const hasClaimed = activeDrop.claims && activeDrop.claims.some(c => c.uid === currentUid);
      const isDepleted = activeDrop.claims && (activeDrop.claims.length >= activeDrop.maxClaims || activeDrop.remainingPot <= 0);

      container.innerHTML = `
        <div class="token-rain-card-header">
          <div class="token-rain-crate-icon ${isDepleted ? 'depleted' : 'active-pulsing'}">
            <i class="fa-solid fa-box-archive"></i>
          </div>
          <div class="token-rain-info">
            <div class="token-rain-tag">⚡ CYBER TOKEN RAIN</div>
            <h4 class="token-rain-pot">${activeDrop.totalPot.toLocaleString()} NEX CREDITS</h4>
            <span class="token-rain-memo">${activeDrop.memo || 'Bounty dropped!'}</span>
          </div>
        </div>

        <div class="token-rain-progress-bar">
          <div class="token-rain-progress-fill" style="width: ${Math.min(100, (activeDrop.claims.length / activeDrop.maxClaims) * 100)}%;"></div>
        </div>

        <div class="token-rain-status-row">
          <span>Claimed: <strong>${activeDrop.claims.length} / ${activeDrop.maxClaims}</strong></span>
          <span>Remaining: <strong class="text-amber-400">${activeDrop.remainingPot} NEX</strong></span>
        </div>

        <button type="button" class="token-rain-claim-btn ${hasClaimed ? 'claimed' : (isDepleted ? 'depleted' : '')}" 
                data-drop-id="${dropId}">
          ${hasClaimed ? '<i class="fa-solid fa-check"></i> BOUNTY CLAIMED' : (isDepleted ? '<i class="fa-solid fa-lock"></i> CRATE DEPLETED' : '<i class="fa-solid fa-bolt"></i> CRACK CRATE & CLAIM')}
        </button>

        <div class="token-rain-winners-list" id="winnersList_${dropId}">
          ${this.renderWinnersHTML(activeDrop.claims)}
        </div>
      `;

      const claimBtn = container.querySelector('.token-rain-claim-btn');
      claimBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.claimDrop(dropId);
      });

      return container;
    }

    renderWinnersHTML(claims) {
      if (!claims || claims.length === 0) {
        return `<span class="no-claims-text">Be the first operative to crack the crate!</span>`;
      }
      return claims.map((c, idx) => `
        <div class="token-winner-row">
          <span class="winner-rank">#${idx + 1}</span>
          <span class="winner-name">${c.name || 'Operative'}</span>
          <strong class="winner-amount">+${c.amount} 🪙</strong>
        </div>
      `).join('');
    }

    updateBubbleUI(dropId, drop) {
      const container = document.getElementById(`tokenDrop_${dropId}`);
      if (!container) return;

      const currentUid = window.myUID || (localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')).uid : 'u_current');
      const hasClaimed = drop.claims.some(c => c.uid === currentUid);
      const isDepleted = drop.claims.length >= drop.maxClaims || drop.remainingPot <= 0;

      const fill = container.querySelector('.token-rain-progress-fill');
      if (fill) fill.style.width = `${Math.min(100, (drop.claims.length / drop.maxClaims) * 100)}%`;

      const statusRow = container.querySelector('.token-rain-status-row');
      if (statusRow) {
        statusRow.innerHTML = `
          <span>Claimed: <strong>${drop.claims.length} / ${drop.maxClaims}</strong></span>
          <span>Remaining: <strong class="text-amber-400">${drop.remainingPot} NEX</strong></span>
        `;
      }

      const claimBtn = container.querySelector('.token-rain-claim-btn');
      if (claimBtn) {
        if (hasClaimed) {
          claimBtn.className = 'token-rain-claim-btn claimed';
          claimBtn.innerHTML = '<i class="fa-solid fa-check"></i> BOUNTY CLAIMED';
        } else if (isDepleted) {
          claimBtn.className = 'token-rain-claim-btn depleted';
          claimBtn.innerHTML = '<i class="fa-solid fa-lock"></i> CRATE DEPLETED';
        }
      }

      const winnersBox = document.getElementById(`winnersList_${dropId}`);
      if (winnersBox) {
        winnersBox.innerHTML = this.renderWinnersHTML(drop.claims);
      }
    }

    spawnCoinBurst() {
      for (let i = 0; i < 16; i++) {
        const coin = document.createElement('div');
        coin.className = 'floating-coin-particle';
        coin.innerHTML = '🪙';
        coin.style.left = `${Math.random() * 80 + 10}vw`;
        coin.style.bottom = '20vh';
        coin.style.animationDelay = `${Math.random() * 0.3}s`;
        coin.style.animationDuration = `${1.2 + Math.random() * 0.6}s`;
        document.body.appendChild(coin);
        setTimeout(() => coin.remove(), 2000);
      }
    }

    broadcastDropEvent(drop, action) {
      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (!partnerId) return;
        window.sendSupabaseMessage({
          from: window.myUID || 'u_current',
          to: partnerId,
          text: "",
          attachment: {
            fileType: 'token_rain_sync',
            isTokenRainSync: true,
            action: action,
            dropData: drop
          },
          chatType: window.currentChatType || 'direct'
        }).catch(console.warn);
      }
    }

    listenSupabaseRealtime() {
      // Custom event hook for incoming token rain updates
      window.addEventListener('nexchat:token_rain_received', (e) => {
        const data = e.detail;
        if (!data || !data.dropData) return;
        const drop = data.dropData;
        this.drops[drop.dropId] = drop;
        this.saveDropsCache();
        this.updateBubbleUI(drop.dropId, drop);
      });
    }
  }

  window.tokenRainEngine = new TokenRainEngine();
})();
