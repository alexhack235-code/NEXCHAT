/**
 * NEXCHAT CYBER STREAKS & DAILY LOOTBOX CRATES ENGINE
 * 
 * Capabilities:
 * - Real-time daily streak calculation (Streak Count, Level, & Milestones)
 * - Anti-break Streak Freeze Shield system
 * - Streak status & countdown HUD with 1-click "Streak Nudge"
 * - Daily 24-Hour Encrypted Cyber Crate with particle animations & rewards
 * - Dynamic token rewards credited directly into user balance
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'nex_streaks_data';
  const LOOTBOX_KEY = 'nex_lootbox_last_claim';
  const STREAK_FREEZE_KEY = 'nex_streak_freezes_count';

  class CyberStreaksEngine {
    constructor() {
      this.streaks = this.loadStreaks();
      this.freezes = parseInt(localStorage.getItem(STREAK_FREEZE_KEY) || '1', 10);
      this.currentPartnerId = null;

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
      this.bindHeaderTriggers();
      this.updateLootboxButtonBadge();
      this.startCountdownTimer();
    }

    loadStreaks() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }

    saveStreaks() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.streaks));
      } catch (e) {}
    }

    // Call when a message is sent or received between current user & partner
    recordInteraction(partnerId) {
      if (!partnerId) return;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (!this.streaks[partnerId]) {
        this.streaks[partnerId] = {
          count: 1,
          lastDate: todayStr,
          startDate: todayStr
        };
        this.saveStreaks();
        this.renderStreakBadge();
        return;
      }

      const streak = this.streaks[partnerId];
      if (streak.lastDate === todayStr) {
        // Already recorded for today
        return;
      }

      const lastDate = new Date(streak.lastDate);
      const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Continued streak!
        streak.count += 1;
        streak.lastDate = todayStr;
        if (window.showNotif) {
          window.showNotif(`[STREAK] Cyber Streak increased! ${streak.count} Days with partner!`, 'success', 2500);
        }
      } else if (diffDays > 1) {
        // Check if user has streak freeze
        if (this.freezes > 0) {
          this.freezes -= 1;
          localStorage.setItem(STREAK_FREEZE_KEY, String(this.freezes));
          streak.lastDate = todayStr;
          if (window.showNotif) {
            window.showNotif(`[SHIELD] Streak Freeze Shield activated! Streak saved at ${streak.count} Days!`, 'info', 3000);
          }
        } else {
          // Streak broken, reset to 1
          streak.count = 1;
          streak.lastDate = todayStr;
        }
      }

      this.saveStreaks();
      this.renderStreakBadge();
    }

    getStreak(partnerId) {
      return this.streaks[partnerId] || { count: 0, lastDate: null };
    }

    renderStreakBadge() {
      const badge = document.getElementById('chatStreakBadge');
      if (!badge) return;

      const partnerId = window.currentChatUserId || window.currentChatUser;
      if (!partnerId) {
        badge.style.display = 'none';
        return;
      }

      const streak = this.getStreak(partnerId);
      const count = streak.count || 0;

      if (count <= 0) {
        badge.style.display = 'none';
        return;
      }

      badge.style.display = 'inline-flex';
      let flameIcon = '<i class="fa-solid fa-fire text-amber-400"></i>';
      if (count >= 30) flameIcon = '<i class="fa-solid fa-crown text-yellow-300"></i>';
      else if (count >= 7) flameIcon = '<i class="fa-solid fa-bolt text-cyan-400"></i>';

      badge.innerHTML = `${flameIcon} <span>${count}</span>`;
      badge.title = `${count} Day Cyber Streak! Click for milestone rewards`;
    }

    injectReadabilityStyles() {
      if (document.getElementById('nexCyberStreakReadabilityCss')) return;
      const style = document.createElement('style');
      style.id = 'nexCyberStreakReadabilityCss';
      style.textContent = `
        #streakStatusModal .streak-card-window,
        #cyberLootboxModal .lootbox-modal-window,
        #cyberStreakModal .cyber-modal-window,
        #nexDailyStreakModal .cyber-modal-window {
          color: #f8fafc;
        }
        #streakStatusModal .streak-row {
          font-size: 13.5px;
          line-height: 1.45;
          color: #cbd5e1;
        }
        #cyberStreakModal .streak-days-grid,
        #nexDailyStreakModal .streak-days-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
          gap: 8px;
        }
        .streak-day-card {
          background: rgba(15, 23, 42, 0.94) !important;
          border: 1px solid rgba(148, 163, 184, 0.36) !important;
          border-radius: 10px !important;
          padding: 10px 8px !important;
          min-height: 76px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #f8fafc !important;
          text-align: center;
        }
        .streak-day-card .day-num {
          font-size: 13px !important;
          font-weight: 800 !important;
          color: #f8fafc !important;
          letter-spacing: 0.2px;
        }
        .streak-day-card .day-tokens {
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #38bdf8 !important;
        }
        .streak-day-card .day-status-pill {
          font-size: 10.5px !important;
          font-weight: 800 !important;
          padding: 2px 7px !important;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.16);
          color: #e2e8f0 !important;
        }
        .streak-day-card.claimed,
        .streak-day-card.active-day {
          border-color: rgba(0, 255, 136, 0.65) !important;
          background: rgba(6, 78, 59, 0.42) !important;
        }
        .streak-day-card.claimed .day-status-pill,
        .streak-day-card.active-day .day-status-pill {
          background: rgba(0, 255, 136, 0.18);
          color: #4ade80 !important;
        }
      `;
      document.head.appendChild(style);
    }

    setCyberModalState(modal, open) {
      if (!modal) return;
      if (open) {
        modal.hidden = false;
        modal.removeAttribute('hidden');
        modal.inert = false;
        modal.removeAttribute('inert');
        modal.setAttribute('aria-hidden', 'false');
        modal.style.display = 'flex';
      } else {
        if (document.activeElement && modal.contains(document.activeElement)) {
          try { document.activeElement.blur(); } catch (_) { }
        }
        modal.setAttribute('aria-hidden', 'true');
        modal.hidden = true;
        modal.setAttribute('hidden', '');
        modal.inert = true;
        modal.setAttribute('inert', '');
        modal.style.display = 'none';
      }
    }

    injectModals() {
      this.injectReadabilityStyles();

      // 1. Streak Info & Milestone Modal
      if (!document.getElementById('streakStatusModal')) {
        const modal = document.createElement('div');
        modal.id = 'streakStatusModal';
        modal.className = 'cyber-modal-backdrop';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.style.display = 'none';

        modal.innerHTML = `
          <div class="cyber-modal-window streak-card-window">
            <div class="cyber-modal-header">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-fire text-amber-400 text-lg"></i>
                <h3 class="font-bold text-white text-base">Cyber Streak Telemetry</h3>
              </div>
              <button type="button" class="cyber-modal-close" id="closeStreakModalBtn"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div class="streak-hero">
              <div class="streak-flame-orb">
                <i class="fa-solid fa-fire"></i>
              </div>
              <div class="streak-counter-number" id="streakModalCount">0</div>
              <div class="streak-counter-label">CONSECUTIVE DAYS ACTIVE</div>
            </div>

            <div class="streak-details-box">
              <div class="streak-row">
                <span>Active Partner:</span>
                <strong id="streakPartnerName" class="text-white">Partner</strong>
              </div>
              <div class="streak-row">
                <span>Milestone Tier:</span>
                <span id="streakTierBadge" class="streak-tier-pill">Bronze Enclave</span>
              </div>
              <div class="streak-row">
                <span>Streak Freezes Remaining:</span>
                <strong id="streakFreezesCount" class="text-[#00d4ff]">1 Shield</strong>
              </div>
            </div>

            <div class="streak-actions">
              <button type="button" id="sendStreakNudgeBtn" class="streak-nudge-btn">
                <i class="fa-solid fa-hand-fist"></i> Send Streak Nudge
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        this.setCyberModalState(modal, false);

        document.getElementById('closeStreakModalBtn')?.addEventListener('click', () => {
          this.setCyberModalState(modal, false);
        });

        document.getElementById('sendStreakNudgeBtn')?.addEventListener('click', () => {
          this.sendStreakNudge();
          this.setCyberModalState(modal, false);
        });
      }

      // 2. Daily Cyber Lootbox Modal
      if (!document.getElementById('cyberLootboxModal')) {
        const lootboxModal = document.createElement('div');
        lootboxModal.id = 'cyberLootboxModal';
        lootboxModal.className = 'cyber-modal-backdrop';
        lootboxModal.setAttribute('role', 'dialog');
        lootboxModal.setAttribute('aria-modal', 'true');
        lootboxModal.style.display = 'none';

        lootboxModal.innerHTML = `
          <div class="cyber-modal-window lootbox-modal-window">
            <div class="cyber-modal-header">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-box-open text-[#00ff66] text-lg"></i>
                <h3 class="font-bold text-white text-base">Daily Cryptographic Lootbox</h3>
              </div>
              <button type="button" class="cyber-modal-close" id="closeLootboxModalBtn"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div class="lootbox-stage" id="lootboxStage">
              <div class="lootbox-crate-graphic" id="lootboxCrate">
                <div class="crate-glow"></div>
                <div class="crate-cube">
                  <i class="fa-solid fa-cube"></i>
                </div>
              </div>

              <div id="lootboxCountdown" class="lootbox-countdown-text">
                Next Crate Available: <strong id="lootboxCountdownTimer">24:00:00</strong>
              </div>

              <button type="button" id="claimLootboxBtn" class="lootbox-claim-btn">
                <i class="fa-solid fa-lock-open"></i> DECRYPT CRATE NOW
              </button>
            </div>

            <!-- Reward Unveiling Container -->
            <div id="lootboxRewardsWrap" class="lootbox-rewards-wrap" style="display: none;">
              <h4 class="text-white font-bold text-center text-sm mb-3">CRATE DECRYPTED! REWARDS CLAIMED</h4>
              <div class="lootbox-rewards-grid" id="lootboxRewardsGrid">
                <!-- Injected dynamically -->
              </div>
              <button type="button" id="ackLootboxRewardBtn" class="lootbox-claim-btn mt-4">
                <i class="fa-solid fa-check"></i> AWESOME
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(lootboxModal);
        this.setCyberModalState(lootboxModal, false);

        document.getElementById('closeLootboxModalBtn')?.addEventListener('click', () => {
          this.setCyberModalState(lootboxModal, false);
        });

        document.getElementById('claimLootboxBtn')?.addEventListener('click', () => {
          this.decryptLootbox();
        });

        document.getElementById('ackLootboxRewardBtn')?.addEventListener('click', () => {
          this.setCyberModalState(lootboxModal, false);
        });
      }
    }

    bindFirstTapTrigger(btn, action) {
      if (!btn || btn.dataset.nexFirstTapBound === '1') return;
      btn.dataset.nexFirstTapBound = '1';

      let startX = 0;
      let startY = 0;
      let lastHandledAt = 0;

      const fireOnce = (e) => {
        const now = Date.now();
        if (now - lastHandledAt < 350) return;
        lastHandledAt = now;
        if (e) e.stopPropagation();
        this.injectModals();
        action();
      };

      btn.addEventListener('pointerdown', (e) => {
        startX = e.clientX || 0;
        startY = e.clientY || 0;
      }, { capture: true, passive: true });

      btn.addEventListener('pointerup', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const dist = Math.hypot((e.clientX || 0) - startX, (e.clientY || 0) - startY);
        if (dist < 8) {
          fireOnce(e);
        }
      }, { capture: true });

      btn.addEventListener('click', (e) => {
        fireOnce(e);
      });
    }

    bindHeaderTriggers() {
      // 1. Streak badge in chat header
      const headerActions = document.querySelector('.chat-detail-header-actions') || 
                            document.querySelector('.chat-detail-header-right') || 
                            document.querySelector('.chat-detail-header');
      if (headerActions && !document.getElementById('chatStreakBadge')) {
        const badge = document.createElement('button');
        badge.type = 'button';
        badge.id = 'chatStreakBadge';
        badge.className = 'chat-streak-badge';
        badge.style.display = 'none';
        badge.innerHTML = `<i class="fa-solid fa-fire text-amber-400"></i> <span>0</span>`;
        headerActions.insertBefore(badge, headerActions.firstChild);
      }

      // 2. Daily Lootbox button in header or nav
      if (headerActions && !document.getElementById('dailyLootboxBtn')) {
        const lootboxBtn = document.createElement('button');
        lootboxBtn.type = 'button';
        lootboxBtn.id = 'dailyLootboxBtn';
        lootboxBtn.className = 'header-icon-btn daily-lootbox-btn';
        lootboxBtn.title = 'Daily Cyber Lootbox (Claim Free Tokens & Badges)';
        lootboxBtn.innerHTML = `
          <i class="fa-solid fa-cube text-[#00ff66]"></i>
          <span class="lootbox-ready-dot" id="lootboxReadyDot" style="display: none;"></span>
        `;
        headerActions.appendChild(lootboxBtn);
      }

      // Ensure first-tap reliability on Cyber Streak & Daily Streak buttons
      this.bindFirstTapTrigger(document.getElementById('chatStreakBadge'), () => this.openStreakModal());
      this.bindFirstTapTrigger(document.getElementById('dailyLootboxBtn'), () => this.openLootboxModal());

      const dailyStreakAction = () => {
        document.getElementById('mobileDropdownMenu')?.classList.remove('show');
        if (typeof window.openDailyStreakModal === 'function') {
          window.openDailyStreakModal();
          return;
        }
        if (typeof window.openCyberStreakModal === 'function') {
          window.openCyberStreakModal();
          return;
        }
        const extModal = document.getElementById('nexDailyStreakModal') || document.getElementById('cyberStreakModal');
        if (extModal) {
          this.setCyberModalState(extModal, true);
          return;
        }
        this.openStreakModal();
      };

      ['cyberStreakBtn', 'cyberStreakBtnHeader', 'mobileStreakBtn', 'dailyStreakDropBtnHeader'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) this.bindFirstTapTrigger(el, dailyStreakAction);
      });
    }

    openStreakModal() {
      const modal = document.getElementById('streakStatusModal');
      const partnerId = window.currentChatUserId || window.currentChatUser;
      const partnerName = window.currentChatName || 'Partner';
      const streak = this.getStreak(partnerId);

      const countEl = document.getElementById('streakModalCount');
      const nameEl = document.getElementById('streakPartnerName');
      const tierEl = document.getElementById('streakTierBadge');
      const freezeEl = document.getElementById('streakFreezesCount');

      if (countEl) countEl.textContent = streak.count || 0;
      if (nameEl) nameEl.textContent = partnerName;
      if (freezeEl) freezeEl.textContent = `${this.freezes} Shield${this.freezes !== 1 ? 's' : ''}`;

      if (tierEl) {
        const c = streak.count || 0;
        if (c >= 30) {
          tierEl.textContent = '[LEGEND] Quantum Legend';
          tierEl.style.color = '#facc15';
        } else if (c >= 7) {
          tierEl.textContent = '[SPARK] Neon Spark';
          tierEl.style.color = '#00d4ff';
        } else {
          tierEl.textContent = '[BRONZE] Bronze Enclave';
          tierEl.style.color = '#fb923c';
        }
      }

      this.setCyberModalState(modal, true);
      if (window.playLuxuryPopSound) window.playLuxuryPopSound();
    }

    sendStreakNudge() {
      const partnerName = window.currentChatName || 'Friend';
      const streak = this.getStreak(window.currentChatUserId || window.currentChatUser);
      const text = `[CYBER STREAK NUDGE]\nHey ${partnerName}, keep our ${streak.count || 1}-day streak alive! Send a quick reply before today ends!`;

      const input = document.getElementById('message-input');
      if (input) {
        input.value = text;
        if (typeof window.sendMessage === 'function') {
          window.sendMessage();
        }
      }

      if (window.showNotif) window.showNotif('Streak nudge sent to chat!', 'success', 2000);
    }

    // ─── Daily Lootbox Operations ───
    isLootboxAvailable() {
      const lastClaim = parseInt(localStorage.getItem(LOOTBOX_KEY) || '0', 10);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      return (now - lastClaim) >= twentyFourHours;
    }

    updateLootboxButtonBadge() {
      const dot = document.getElementById('lootboxReadyDot');
      if (dot) {
        dot.style.display = this.isLootboxAvailable() ? 'block' : 'none';
      }
    }

    startCountdownTimer() {
      setInterval(() => {
        const timerEl = document.getElementById('lootboxCountdownTimer');
        const claimBtn = document.getElementById('claimLootboxBtn');
        const countdownBox = document.getElementById('lootboxCountdown');
        if (!timerEl) return;

        const lastClaim = parseInt(localStorage.getItem(LOOTBOX_KEY) || '0', 10);
        const now = Date.now();
        const diff = (lastClaim + 24 * 60 * 60 * 1000) - now;

        if (diff <= 0) {
          timerEl.textContent = 'READY NOW!';
          if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.classList.add('ready');
          }
          if (countdownBox) countdownBox.classList.add('ready');
          this.updateLootboxButtonBadge();
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          timerEl.textContent = `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
          if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.classList.remove('ready');
          }
        }
      }, 1000);
    }

    openLootboxModal() {
      const modal = document.getElementById('cyberLootboxModal');
      const stage = document.getElementById('lootboxStage');
      const rewardsWrap = document.getElementById('lootboxRewardsWrap');

      if (stage) stage.style.display = 'block';
      if (rewardsWrap) rewardsWrap.style.display = 'none';

      this.setCyberModalState(modal, true);
      if (window.playLuxuryPopSound) window.playLuxuryPopSound();
    }

    decryptLootbox() {
      if (!this.isLootboxAvailable()) {
        if (window.showNotif) window.showNotif('Crate is recharging! Check countdown timer.', 'info');
        return;
      }

      const crate = document.getElementById('lootboxCrate');
      if (crate) crate.classList.add('opening');

      if (window.playLuxuryPopSound) window.playLuxuryPopSound();

      setTimeout(() => {
        // Calculate random rewards
        const tokenReward = Math.floor(Math.random() * (250 - 75 + 1)) + 75; // 75 - 250 tokens
        const badges = ['[CYBER] Cyber Phantom', '[SHIELD] Enclave Sentinel', '[FIRE] Firestarter', '[LEGEND] Quantum Pioneer'];
        const randomBadge = badges[Math.floor(Math.random() * badges.length)];

        // Credit Tokens
        if (typeof window.tokens !== 'undefined') {
          window.tokens += tokenReward;
        }
        const tokenEl = document.getElementById('tokenCount');
        if (tokenEl && typeof window.formatBalanceDisplay === 'function') {
          tokenEl.textContent = window.formatBalanceDisplay(window.tokens || 1000);
        }

        // Add 1 Streak Freeze
        this.freezes += 1;
        localStorage.setItem(STREAK_FREEZE_KEY, String(this.freezes));

        // Save last claim
        localStorage.setItem(LOOTBOX_KEY, String(Date.now()));
        this.updateLootboxButtonBadge();

        // Render rewards
        const stage = document.getElementById('lootboxStage');
        const rewardsWrap = document.getElementById('lootboxRewardsWrap');
        const rewardsGrid = document.getElementById('lootboxRewardsGrid');

        if (stage) stage.style.display = 'none';
        if (crate) crate.classList.remove('opening');

        if (rewardsGrid) {
          rewardsGrid.innerHTML = `
            <div class="lootbox-reward-card">
              <div class="reward-icon tokens"><i class="fa-solid fa-coins"></i></div>
              <div class="reward-val">+${tokenReward} TOKENS</div>
              <div class="reward-desc">Credited to your balance</div>
            </div>
            <div class="lootbox-reward-card">
              <div class="reward-icon badge"><i class="fa-solid fa-shield-halved"></i></div>
              <div class="reward-val">${randomBadge}</div>
              <div class="reward-desc">Unlocked for your profile</div>
            </div>
            <div class="lootbox-reward-card">
              <div class="reward-icon shield"><i class="fa-solid fa-snowflake"></i></div>
              <div class="reward-val">+1 STREAK FREEZE</div>
              <div class="reward-desc">Protects streak if inactive</div>
            </div>
          `;
        }

        if (rewardsWrap) rewardsWrap.style.display = 'block';

        if (window.showNotif) window.showNotif(`[REWARD] Unboxed ${tokenReward} Tokens & ${randomBadge}!`, 'success', 3500);

      }, 1400);
    }
  }

  // Export globally
  window.cyberStreaksEngine = new CyberStreaksEngine();
})();
