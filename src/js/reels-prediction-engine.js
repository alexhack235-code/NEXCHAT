/**
 * NEXCHAT - Interactive Reels Prediction & Token Wager Engine
 * Module: src/js/reels-prediction-engine.js
 * 
 * Embeds gamified prediction pools into NEX-REELS, enabling viewers to wager wallet
 * tokens on video outcomes, clip predictions, or trivia with automated dividend payouts.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  const STORAGE_POOLS_KEY = 'nex_reels_prediction_pools';
  const STORAGE_BETS_KEY = 'nex_user_reels_bets';

  // Seed default demonstration prediction pool
  const DEFAULT_POOLS = {
    'reel_default_01': {
      reelId: 'reel_default_01',
      title: 'Will the cyber runner make the 40m canyon jump?',
      optionA: 'Clean Land (Yes)',
      optionB: 'Emergency Glide (No)',
      poolA: 1850,
      poolB: 1200,
      status: 'OPEN', // 'OPEN' | 'RESOLVED'
      winner: null
    }
  };

  function getPools() {
    try {
      const raw = localStorage.getItem(STORAGE_POOLS_KEY);
      return raw ? JSON.parse(raw) : { ...DEFAULT_POOLS };
    } catch (_) {
      return { ...DEFAULT_POOLS };
    }
  }

  function savePools(pools) {
    localStorage.setItem(STORAGE_POOLS_KEY, JSON.stringify(pools));
  }

  function getUserBets() {
    try {
      const raw = localStorage.getItem(STORAGE_BETS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveUserBets(bets) {
    localStorage.setItem(STORAGE_BETS_KEY, JSON.stringify(bets));
  }

  const NexReelsPredictionEngine = {
    getPool(reelId) {
      const pools = getPools();
      return pools[reelId] || pools['reel_default_01'];
    },

    placeBet(reelId, choice, amount) {
      amount = parseInt(amount, 10);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid token amount.');
      }

      // Check user tokens
      let user = null;
      try {
        user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      } catch (_) { }

      const balance = Number(user.tokens || 1000);
      if (balance < amount) {
        throw new Error(`Insufficient tokens! Current balance: ${balance}`);
      }

      // Deduct tokens
      user.tokens = balance - amount;
      localStorage.setItem('currentUser', JSON.stringify(user));
      document.querySelectorAll('#userTokenBalance, #walletBalance').forEach(el => {
        el.textContent = user.tokens;
      });

      // Update pool
      const pools = getPools();
      const pool = pools[reelId] || { ...DEFAULT_POOLS['reel_default_01'], reelId };
      if (choice === 'A') {
        pool.poolA += amount;
      } else {
        pool.poolB += amount;
      }
      pools[reelId] = pool;
      savePools(pools);

      // Record bet
      const bets = getUserBets();
      bets.push({
        id: 'bet_' + Date.now(),
        reelId,
        choice,
        amount,
        timestamp: new Date().toISOString()
      });
      saveUserBets(bets);

      return { pool, newBalance: user.tokens };
    },

    resolvePool(reelId, winningChoice) {
      const pools = getPools();
      const pool = pools[reelId];
      if (!pool) return null;

      pool.status = 'RESOLVED';
      pool.winner = winningChoice;
      pools[reelId] = pool;
      savePools(pools);

      // Distribute returns to matching local bets
      const bets = getUserBets();
      const totalPool = pool.poolA + pool.poolB;
      const winningPool = winningChoice === 'A' ? pool.poolA : pool.poolB;
      let totalPayout = 0;

      bets.forEach(b => {
        if (b.reelId === reelId && b.choice === winningChoice && !b.claimed) {
          const share = b.amount / (winningPool || 1);
          const payout = Math.floor(share * totalPool * 0.95); // 5% house dividend
          totalPayout += payout;
          b.claimed = true;
        }
      });
      saveUserBets(bets);

      if (totalPayout > 0) {
        let user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        user.tokens = (Number(user.tokens) || 0) + totalPayout;
        localStorage.setItem('currentUser', JSON.stringify(user));
        document.querySelectorAll('#userTokenBalance, #walletBalance').forEach(el => {
          el.textContent = user.tokens;
        });
        alert(`Prediction Won! Received dividend payout of +${totalPayout} tokens.`);
      }

      return pool;
    },

    renderWidget(reelId, containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const pool = this.getPool(reelId);
      const total = pool.poolA + pool.poolB;
      const pctA = total > 0 ? Math.round((pool.poolA / total) * 100) : 50;
      const pctB = 100 - pctA;

      container.innerHTML = `
        <div style="background:rgba(3,7,18,0.85); border:1px solid rgba(0,243,255,0.25); border-radius:12px; padding:12px; color:#fff; backdrop-filter:blur(6px); margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:10px; font-weight:800; color:#00f3ff; text-transform:uppercase; display:flex; align-items:center; gap:5px;">
              <i class="fa-solid fa-chart-line"></i> PREDICTION POOL (${pool.status})
            </span>
            <span style="font-size:10.5px; color:#ffd700; font-family:monospace;">
              <i class="fa-solid fa-coins"></i> Total Pool: ${total} Tokens
            </span>
          </div>

          <div style="font-size:12px; font-weight:700; margin-bottom:10px; color:#f8fafc;">
            ${pool.title}
          </div>

          <!-- Odds Bar -->
          <div style="height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; display:flex; margin-bottom:8px;">
            <div style="width:${pctA}%; background:#00f3ff; transition:width 0.3s ease;"></div>
            <div style="width:${pctB}%; background:#a855f7; transition:width 0.3s ease;"></div>
          </div>

          <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:10px; font-family:monospace;">
            <span style="color:#00f3ff;">[A] ${pool.optionA} (${pctA}%)</span>
            <span style="color:#c084fc;">[B] ${pool.optionB} (${pctB}%)</span>
          </div>

          ${pool.status === 'OPEN' ? `
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn-bet-a" style="flex:1; padding:7px; background:rgba(0,243,255,0.15); border:1px solid #00f3ff; color:#00f3ff; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-arrow-trend-up"></i> Bet A (50)
              </button>
              <button type="button" class="btn-bet-b" style="flex:1; padding:7px; background:rgba(168,85,247,0.15); border:1px solid #a855f7; color:#c084fc; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-arrow-trend-up"></i> Bet B (50)
              </button>
            </div>
          ` : `
            <div style="padding:6px; background:rgba(16,185,129,0.15); border:1px solid #10b981; color:#10b981; border-radius:6px; font-size:11px; text-align:center; font-weight:700;">
              <i class="fa-solid fa-trophy"></i> Winner Declared: Option ${pool.winner}
            </div>
          `}
        </div>
      `;

      container.querySelector('.btn-bet-a')?.addEventListener('click', () => {
        try {
          this.placeBet(reelId, 'A', 50);
          this.renderWidget(reelId, containerId);
        } catch (e) { alert(e.message); }
      });

      container.querySelector('.btn-bet-b')?.addEventListener('click', () => {
        try {
          this.placeBet(reelId, 'B', 50);
          this.renderWidget(reelId, containerId);
        } catch (e) { alert(e.message); }
      });
    }
  };

  window.NexReelsPredictionEngine = NexReelsPredictionEngine;
})(window);
