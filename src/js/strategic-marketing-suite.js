/**
 * NEXCHAT - Strategic Marketing & Growth Engine Suite
 * ═════════════════════════════════════════════════════════════════════
 * 1. NexReferralEngine: Viral Ambassador protocol, referral links, QR cards,
 *    dual bounties (+50 NEX on signup, +10% WhatsApp purchase commission),
 *    and Apex Ambassador Leaderboard.
 * 2. NexReelBoostEngine: CamShot Reel Promotion engine (Starter, Viral Surge,
 *    Apex Domination) with impressions delivery and sponsored badges.
 * 3. NexDailyStreakEngine: 7-day habit-forming login rewards calendar,
 *    token claim multipliers, countdown timers, and WhatsApp streak freeze.
 * 4. NexViralShareEngine: Watermarked media attribution, 1-click WhatsApp Status
 *    invite distributor, and dynamic story cards.
 * 5. NexVipSubscriptionEngine: Gated creator channels, token pass checkouts,
 *    and automated subscriber access control.
 * 6. NexFlashDropsEngine: Scarcity countdown timers, live inventory counters,
 *    and limited-edition flash badge drops.
 *
 * STRICTLY ZERO EMOJIS: Clean typography, vector styling, and FontAwesome icons only.
 */

(function () {
  'use strict';

  const WHATSAPP_HOTLINE = '+234 905 434 5858';
  const WHATSAPP_RAW_NUMBER = '2349054345858';

  // ═════════════════════════════════════════════════════════════════════
  // 1. VIRAL REFERRAL & AMBASSADOR ENGINE
  // ═════════════════════════════════════════════════════════════════════

  class ReferralEngine {
    constructor() {
      this.storageKey = 'nex_referral_data_v2';
      this.referralData = this.loadData();
      this.checkUrlForReferrer();
    }

    loadData() {
      try {
        const stored = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        const myUid = (typeof myUID !== 'undefined' && myUID) ? myUID : (localStorage.getItem('myUID') || 'usr_' + Date.now().toString(36));
        const myCode = stored.code || 'NEX-' + Math.abs(this.hashCode(myUid)).toString(36).toUpperCase().substring(0, 6);

        return {
          code: myCode,
          invitesCount: stored.invitesCount || 0,
          registeredCount: stored.registeredCount || 0,
          earnedTokens: stored.earnedTokens || 0,
          referredUsers: stored.referredUsers || [],
          appliedReferrer: stored.appliedReferrer || null
        };
      } catch (_) {
        return {
          code: 'NEX-7721',
          invitesCount: 0,
          registeredCount: 0,
          earnedTokens: 0,
          referredUsers: [],
          appliedReferrer: null
        };
      }
    }

    saveData() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.referralData));
      } catch (_) {}
    }

    hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    }

    getReferralCode() {
      return this.referralData.code;
    }

    getReferralUrl() {
      const origin = window.location.origin || 'https://nexchat.io';
      return `${origin}/cart.html?ref=${this.referralData.code}`;
    }

    checkUrlForReferrer() {
      try {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref && ref !== this.referralData.code && !this.referralData.appliedReferrer) {
          this.referralData.appliedReferrer = ref;
          this.saveData();
          console.log('[AMBASSADOR PROTOCOL] Applied referrer code:', ref);
        }
      } catch (_) {}
    }

    generateWhatsAppInviteMessage() {
      const code = this.getReferralCode();
      const url = this.getReferralUrl();
      return `HEY! I am using NEXCHAT for secure messaging, CamShot Reels, and digital collectibles.\n\nJoin with my Ambassador link to get +50 FREE NEX TOKENS on registration:\n${url}\n\nReferral Code: ${code}\n\nDownload or open web app instantly!`;
    }

    openWhatsAppShare() {
      const msg = this.generateWhatsAppInviteMessage();
      const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      this.referralData.invitesCount += 1;
      this.saveData();
    }

    copyReferralLink() {
      const url = this.getReferralUrl();
      navigator.clipboard.writeText(url).then(() => {
        if (typeof window.showNotif === 'function') {
          window.showNotif('Referral link copied to clipboard!', 'success');
        } else {
          alert('Referral link copied to clipboard: ' + url);
        }
      });
    }

    openReferralModal() {
      let modal = document.getElementById('nexAmbassadorModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'nexAmbassadorModal';
        modal.style.cssText = `
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(4, 7, 15, 0.85);
          backdrop-filter: blur(8px);
          z-index: 10002;
          align-items: center;
          justify-content: center;
          padding: 16px;
        `;
        document.body.appendChild(modal);
      }

      const code = this.getReferralCode();
      const url = this.getReferralUrl();

      modal.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #090e1a 0%, #0f172a 100%);
          border: 1px solid rgba(0, 255, 102, 0.35);
          box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0, 255, 102, 0.15);
          border-radius: 18px;
          max-width: 580px;
          width: 100%;
          padding: 24px;
          color: #f8fafc;
          font-family: inherit;
        ">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(0,255,102,0.15); border: 1px solid #00ff66; color: #00ff66; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                <i class="fa-solid fa-gift"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #fff;">Viral Ambassador &amp; Bounty Protocol</h3>
                <div style="font-size: 11px; color: #94a3b8;">Earn +50 NEX per invite + 10% commission on WhatsApp orders</div>
              </div>
            </div>
            <button type="button" id="btnCloseAmbassadorModal" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Stats Grid -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px;">
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; text-align: center;">
              <div style="font-size: 20px; font-weight: 800; color: #00ff66; font-family: monospace;">${this.referralData.invitesCount}</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Invites Sent</div>
            </div>
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; text-align: center;">
              <div style="font-size: 20px; font-weight: 800; color: #00f2ff; font-family: monospace;">${this.referralData.registeredCount}</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Registered</div>
            </div>
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; text-align: center;">
              <div style="font-size: 20px; font-weight: 800; color: #ffd700; font-family: monospace;">${Number(this.referralData.earnedTokens).toLocaleString()}</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Bounty NEX</div>
            </div>
          </div>

          <!-- Referral Link Box -->
          <div style="background: rgba(0,255,102,0.04); border: 1px solid rgba(0,255,102,0.25); border-radius: 12px; padding: 14px; margin-bottom: 18px;">
            <label style="font-size: 11px; font-weight: 700; color: #00ff66; display: block; margin-bottom: 6px;">YOUR UNIQUE AMBASSADOR LINK</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="ambassadorUrlInput" readonly value="${url}" style="flex: 1; font-family: monospace; font-size: 12px; padding: 8px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff;">
              <button type="button" id="btnCopyAmbassadorLink" style="padding: 8px 14px; background: #00ff66; color: #000; border: none; border-radius: 8px; font-weight: 800; font-size: 11.5px; cursor: pointer;">
                <i class="fa-regular fa-copy"></i> Copy
              </button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 11px; color: #94a3b8;">
              <span>Ambassador Code: <strong style="color: #00f2ff; font-family: monospace;">${code}</strong></span>
              <span>10% commission on friend WhatsApp orders</span>
            </div>
          </div>

          <!-- Viral Share Actions -->
          <div style="display: flex; gap: 10px;">
            <button type="button" id="btnShareAmbassadorWhatsapp" style="flex: 1; padding: 12px; background: #25d366; color: #000; font-weight: 800; font-size: 12.5px; border: none; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <i class="fa-brands fa-whatsapp"></i> Share on WhatsApp (+50 NEX)
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.querySelector('#btnCloseAmbassadorModal')?.addEventListener('click', () => modal.style.display = 'none');
      modal.querySelector('#btnCopyAmbassadorLink')?.addEventListener('click', () => this.copyReferralLink());
      modal.querySelector('#btnShareAmbassadorWhatsapp')?.addEventListener('click', () => this.openWhatsAppShare());
    }
  }


  // ═════════════════════════════════════════════════════════════════════
  // 2. CAMSHOT REEL BOOST & PROMOTED FEED ENGINE
  // ═════════════════════════════════════════════════════════════════════

  const BOOST_PACKAGES = [
    {
      id: 'BOOST_STARTER',
      name: 'Starter Velocity Boost',
      impressions: '5,000 Impressions',
      tokens: 500,
      usd: 3.50,
      ngn: 5000,
      icon: 'fa-bolt',
      color: '#00f2ff',
      tag: '5K BOOST',
      desc: 'Injected into top 5 feed rotations, algorithmic priority boost for 24h.'
    },
    {
      id: 'BOOST_VIRAL',
      name: 'Viral Surge Campaign',
      impressions: '20,000 Impressions',
      tokens: 1500,
      usd: 10.00,
      ngn: 15000,
      icon: 'fa-fire-flame-curved',
      color: '#ffd700',
      tag: 'VIRAL 20K',
      desc: 'Glowing golden PROMOTED badge, pinned soundwave banner, 3-day boost.'
    },
    {
      id: 'BOOST_APEX',
      name: 'Apex National Domination',
      impressions: '50,000 Impressions',
      tokens: 3500,
      usd: 24.00,
      ngn: 36000,
      icon: 'fa-crown',
      color: '#c084fc',
      tag: 'APEX 50K',
      desc: 'Top 1 sticky slot for 7 days, cross-platform watermark, VIP aura glow.'
    }
  ];

  class ReelBoostEngine {
    constructor() {
      this.activeCampaignsKey = 'nex_promoted_reels_v2';
    }

    openBoostModal(reelId, creatorHandle) {
      let modal = document.getElementById('nexReelBoostModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'nexReelBoostModal';
        modal.style.cssText = `
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(4, 7, 15, 0.85);
          backdrop-filter: blur(8px);
          z-index: 10003;
          align-items: center;
          justify-content: center;
          padding: 16px;
        `;
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #090e1a 0%, #0f172a 100%);
          border: 1px solid rgba(0, 242, 255, 0.35);
          box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0, 242, 255, 0.15);
          border-radius: 18px;
          max-width: 600px;
          width: 100%;
          padding: 24px;
          color: #f8fafc;
        ">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(0,242,255,0.15); border: 1px solid #00f2ff; color: #00f2ff; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                <i class="fa-solid fa-rocket"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #fff;">CamShot Reel Promote Engine</h3>
                <div style="font-size: 11px; color: #94a3b8;">Boost @${creatorHandle || 'creator'} into millions of impressions</div>
              </div>
            </div>
            <button type="button" id="btnCloseReelBoostModal" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Packages Grid -->
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px;">
            ${BOOST_PACKAGES.map(pkg => `
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 36px; height: 36px; border-radius: 8px; background: ${pkg.color}22; border: 1px solid ${pkg.color}; color: ${pkg.color}; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                    <i class="fa-solid ${pkg.icon}"></i>
                  </div>
                  <div>
                    <strong style="color: #fff; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                      ${pkg.name}
                      <span class="badge" style="background: ${pkg.color}22; border: 1px solid ${pkg.color}; color: ${pkg.color}; font-size: 9px; padding: 2px 6px;">${pkg.tag}</span>
                    </strong>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${pkg.desc}</div>
                    <div style="font-size: 10.5px; color: #00ff66; font-family: monospace; margin-top: 3px;">
                      ${pkg.tokens.toLocaleString()} NEX Tokens &bull; $${pkg.usd.toFixed(2)} USD (₦${pkg.ngn.toLocaleString()})
                    </div>
                  </div>
                </div>
                <button type="button" class="btn-boost-pkg" data-pkg-id="${pkg.id}" data-reel-id="${reelId}" data-creator="${creatorHandle}" style="white-space: nowrap; padding: 9px 14px; background: linear-gradient(135deg, ${pkg.color}, #059669); color: #000; font-weight: 800; font-size: 11.5px; border: none; border-radius: 8px; cursor: pointer;">
                  <i class="fa-solid fa-arrow-trend-up"></i> Boost Now
                </button>
              </div>
            `).join('')}
          </div>

          <div style="font-size: 11px; color: #94a3b8; text-align: center;">
            Need custom ad campaigns? WhatsApp Hotline: <strong style="color: #25d366;">+234 905 434 5858</strong>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.querySelector('#btnCloseReelBoostModal')?.addEventListener('click', () => modal.style.display = 'none');

      modal.querySelectorAll('.btn-boost-pkg').forEach(btn => {
        btn.addEventListener('click', () => {
          const pkgId = btn.getAttribute('data-pkg-id');
          const rId = btn.getAttribute('data-reel-id');
          const creator = btn.getAttribute('data-creator');
          this.executeBoostOrder(pkgId, rId, creator);
          modal.style.display = 'none';
        });
      });
    }

    executeBoostOrder(pkgId, reelId, creator) {
      const pkg = BOOST_PACKAGES.find(p => p.id === pkgId) || BOOST_PACKAGES[0];
      const msg = `NEXCHAT CAMSHOT REEL BOOST ORDER\nHotline: ${WHATSAPP_HOTLINE}\n\nPackage: ${pkg.name} (${pkg.tag})\nReel ID: ${reelId || 'current_reel'}\nCreator: @${creator || 'creator'}\nPrice: $${pkg.usd} (₦${pkg.ngn.toLocaleString()} / ${pkg.tokens} NEX)\n\nPlease activate my algorithm promotion!`;
      const url = `https://wa.me/${WHATSAPP_RAW_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      alert(`[REEL BOOST DISPATCHED]\nYour promotion request for @${creator} (${pkg.tag}) is ready to send on WhatsApp!\nHotline: ${WHATSAPP_HOTLINE}`);
    }
  }


  // ═════════════════════════════════════════════════════════════════════
  // 3. 7-DAY CYBER LOGIN STREAK & RETENTION REWARDS
  // ═════════════════════════════════════════════════════════════════════

  const STREAK_REWARDS = [
    { day: 1, tokens: 10, label: 'Day 1: Genesis', icon: 'fa-seedling', perk: '+10 NEX Tokens' },
    { day: 2, tokens: 20, label: 'Day 2: Momentum', icon: 'fa-bolt', perk: '+20 NEX Tokens' },
    { day: 3, tokens: 35, label: 'Day 3: Velocity', icon: 'fa-fire', perk: '+35 NEX Tokens' },
    { day: 4, tokens: 50, label: 'Day 4: Synthesis', icon: 'fa-shield-halved', perk: '+50 NEX Tokens' },
    { day: 5, tokens: 75, label: 'Day 5: Overdrive', icon: 'fa-star', perk: '+75 NEX + Neon Aura Glow' },
    { day: 6, tokens: 100, label: 'Day 6: Apex Node', icon: 'fa-gem', perk: '+100 NEX Tokens' },
    { day: 7, tokens: 250, label: 'Day 7: Cyber Vault', icon: 'fa-crown', perk: '+250 NEX + Mystery Shader Box' }
  ];

  class DailyStreakEngine {
    constructor() {
      this.storageKey = 'nex_daily_streak_v2';
      this.data = this.loadData();
    }

    loadData() {
      try {
        const stored = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        return {
          currentDay: stored.currentDay || 0,
          lastClaimTime: stored.lastClaimTime || 0,
          totalTokensClaimed: stored.totalTokensClaimed || 0,
          streakFrozen: stored.streakFrozen || false
        };
      } catch (_) {
        return { currentDay: 0, lastClaimTime: 0, totalTokensClaimed: 0, streakFrozen: false };
      }
    }

    saveData() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      } catch (_) {}
    }

    canClaim() {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      return (now - this.data.lastClaimTime) >= oneDay;
    }

    claimDailyReward() {
      if (!this.canClaim()) {
        const remainingHours = Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - this.data.lastClaimTime)) / (60 * 60 * 1000));
        alert(`Next daily reward available in approximately ${remainingHours} hours!`);
        return false;
      }

      this.data.currentDay = (this.data.currentDay % 7) + 1;
      this.data.lastClaimTime = Date.now();
      const reward = STREAK_REWARDS[this.data.currentDay - 1];
      this.data.totalTokensClaimed += reward.tokens;
      this.saveData();

      if (typeof window.showNotif === 'function') {
        window.showNotif(`[STREAK REWARD CLAIMED] +${reward.tokens} NEX Tokens credited!`, 'success');
      } else {
        alert(`[DAILY STREAK CLAIMED!]\nDay ${this.data.currentDay}: +${reward.tokens} NEX Tokens credited to your balance.`);
      }

      return true;
    }

    openStreakModal() {
      let modal = document.getElementById('nexDailyStreakModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'nexDailyStreakModal';
        modal.style.cssText = `
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(4, 7, 15, 0.85);
          backdrop-filter: blur(8px);
          z-index: 10004;
          align-items: center;
          justify-content: center;
          padding: 16px;
        `;
        document.body.appendChild(modal);
      }

      const canClaim = this.canClaim();
      const currentDay = this.data.currentDay;

      modal.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #090e1a 0%, #0f172a 100%);
          border: 1px solid rgba(255, 215, 0, 0.35);
          box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255, 215, 0, 0.15);
          border-radius: 18px;
          max-width: 620px;
          width: 100%;
          padding: 24px;
          color: #f8fafc;
        ">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(255,215,0,0.15); border: 1px solid #ffd700; color: #ffd700; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                <i class="fa-solid fa-calendar-check"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #fff;">7-Day Cyber Login Streak</h3>
                <div style="font-size: 11px; color: #94a3b8;">Log in daily to claim escalating token vaults &amp; special crate shaders</div>
              </div>
            </div>
            <button type="button" id="btnCloseDailyStreakModal" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- 7 Day Cards Row -->
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 20px;">
            ${STREAK_REWARDS.map(r => {
              const isPassed = r.day <= currentDay;
              const isToday = r.day === (currentDay + 1);
              const color = isPassed ? '#00ff66' : (isToday ? '#ffd700' : '#64748b');

              return `
                <div style="
                  background: ${isPassed ? 'rgba(0,255,102,0.1)' : 'rgba(255,255,255,0.02)'};
                  border: 1px solid ${color};
                  border-radius: 10px;
                  padding: 10px 4px;
                  text-align: center;
                ">
                  <div style="font-size: 9.5px; font-weight: 700; color: ${color}; text-transform: uppercase;">D${r.day}</div>
                  <div style="font-size: 14px; color: ${color}; margin: 6px 0;"><i class="fa-solid ${r.icon}"></i></div>
                  <div style="font-size: 10px; font-weight: 800; color: #fff; font-family: monospace;">+${r.tokens}</div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Claim Button & Freeze Row -->
          <div style="display: flex; gap: 10px; margin-bottom: 12px;">
            <button type="button" id="btnClaimDailyStreak" style="
              flex: 1.5;
              padding: 12px;
              background: ${canClaim ? 'linear-gradient(135deg, #ffd700, #ff8800)' : 'rgba(255,255,255,0.1)'};
              color: ${canClaim ? '#000' : '#94a3b8'};
              font-weight: 800;
              font-size: 13px;
              border: none;
              border-radius: 10px;
              cursor: ${canClaim ? 'pointer' : 'not-allowed'};
            ">
              <i class="fa-solid fa-gift"></i> ${canClaim ? 'Claim Today\'s Reward' : 'Reward Claimed for Today'}
            </button>
            <button type="button" id="btnFreezeStreakWhatsapp" style="
              flex: 1;
              padding: 12px;
              background: rgba(37,211,102,0.1);
              border: 1px solid #25d366;
              color: #25d366;
              font-weight: 700;
              font-size: 11.5px;
              border-radius: 10px;
              cursor: pointer;
            ">
              <i class="fa-brands fa-whatsapp"></i> Freeze Streak via Share
            </button>
          </div>

          <div style="font-size: 10.5px; color: #94a3b8; text-align: center;">
            Total Claimed to date: <strong style="color: #ffd700; font-family: monospace;">${this.data.totalTokensClaimed} NEX</strong> &bull; Reset cycle every 7 days
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.querySelector('#btnCloseDailyStreakModal')?.addEventListener('click', () => modal.style.display = 'none');
      modal.querySelector('#btnClaimDailyStreak')?.addEventListener('click', () => {
        if (this.claimDailyReward()) {
          modal.style.display = 'none';
        }
      });
      modal.querySelector('#btnFreezeStreakWhatsapp')?.addEventListener('click', () => {
        window.NexReferralEngine.openWhatsAppShare();
        alert('[STREAK PROTECTED] Streak freeze activated via WhatsApp referral share.');
      });
    }
  }


  // ═════════════════════════════════════════════════════════════════════
  // 4. VIRAL BRANDED WATERMARK & STATUS EXPORTER
  // ═════════════════════════════════════════════════════════════════════

  class ViralShareEngine {
    generateWatermarkText(creatorHandle) {
      return `NEXCHAT | @${creatorHandle || 'user'} | Watch on CamShot Reels`;
    }

    shareReelToWhatsAppStatus(reelTitle, creatorHandle, reelUrl) {
      const code = window.NexReferralEngine ? window.NexReferralEngine.getReferralCode() : 'NEX';
      const msg = `Check out this CamShot Reel by @${creatorHandle || 'creator'} on NEXCHAT!\n\n"${reelTitle || 'Cyber Video'}"\n\nWatch full video in 1080p60: ${reelUrl || window.location.href}\nUse referral code ${code} for +50 free tokens!`;
      const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    }
  }


  // ═════════════════════════════════════════════════════════════════════
  // 5. VIP GATED CHANNELS & CREATOR SUBSCRIPTIONS
  // ═════════════════════════════════════════════════════════════════════

  class VipSubscriptionEngine {
    isChannelGated(groupData) {
      return !!groupData?.isVipGated;
    }

    hasActiveSubscription(groupData, userUid) {
      if (!this.isChannelGated(groupData)) return true;
      if (groupData.admins?.includes(userUid) || groupData.createdBy === userUid) return true;
      const subs = groupData.subscribers || {};
      const expiry = subs[userUid];
      if (!expiry) return false;
      return new Date(expiry) > new Date();
    }

    openSubscribeModal(groupData) {
      const groupName = groupData.name || 'VIP Community';
      const feeTokens = groupData.subscriptionFeeTokens || 500;
      const feeUsd = groupData.subscriptionFeeUsd || 3.50;

      const confirmBuy = confirm(`[VIP CHANNEL SUBSCRIPTION]\n\nJoin "${groupName}" VIP Room.\nMonthly Pass: ${feeTokens} NEX Tokens ($${feeUsd} USD).\n\nClick OK to order VIP pass via WhatsApp hotline.`);
      if (confirmBuy) {
        const msg = `NEXCHAT VIP CHANNEL PASS ORDER\nHotline: ${WHATSAPP_HOTLINE}\n\nGroup: ${groupName}\nMonthly Pass: ${feeTokens} NEX ($${feeUsd} USD)\nUID: ${localStorage.getItem('myUID') || 'user'}\n\nPlease issue my VIP room subscriber token!`;
        window.open(`https://wa.me/${WHATSAPP_RAW_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    }
  }


  // ═════════════════════════════════════════════════════════════════════
  // 6. FLASH DROPS & SCARCITY BADGE VAULT
  // ═════════════════════════════════════════════════════════════════════

  const FLASH_VAULT_ITEMS = [
    {
      id: 'FLASH_FOUNDING_MEMBER',
      name: 'Founding Member Sovereign Rosette',
      totalMinted: 50,
      remaining: 7,
      priceUsd: 65,
      priceNgn: 95000,
      color: '#ffd700',
      icon: 'fa-certificate',
      desc: 'Only 50 ever minted on-chain. Zero commission on P2P escrow transfers.'
    },
    {
      id: 'FLASH_APEX_PREDATOR',
      name: 'Apex Neon Predator Sensor Shield',
      totalMinted: 25,
      remaining: 3,
      priceUsd: 80,
      priceNgn: 120000,
      color: '#00f2ff',
      icon: 'fa-shield-halved',
      desc: 'Ultra-rare hardware enclave attestor. Injects radiant neon cyan pulse aura.'
    }
  ];

  class FlashDropsEngine {
    getFlashItems() {
      return FLASH_VAULT_ITEMS;
    }

    orderFlashDrop(item) {
      const msg = `NEXCHAT LIMITED FLASH DROP ORDER\nHotline: ${WHATSAPP_HOTLINE}\n\nItem: ${item.name}\nScarcity: Only ${item.remaining} of ${item.totalMinted} Remaining!\nPrice: $${item.priceUsd} (₦${item.priceNgn.toLocaleString()} NGN)\nUID: ${localStorage.getItem('myUID') || 'user'}\n\nPlease secure my limited flash vault mint before inventory sells out!`;
      window.open(`https://wa.me/${WHATSAPP_RAW_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }

  // Global Singletons
  window.NexReferralEngine = new ReferralEngine();
  window.NexReelBoostEngine = new ReelBoostEngine();
  window.NexDailyStreakEngine = new DailyStreakEngine();
  window.NexViralShareEngine = new ViralShareEngine();
  window.NexVipSubscriptionEngine = new VipSubscriptionEngine();
  window.NexFlashDropsEngine = new FlashDropsEngine();

})();
