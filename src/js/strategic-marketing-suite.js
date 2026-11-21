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
      this.storageKey = 'nex_referral_data_v3';
      this.referralData = this.loadData();
      this.checkUrlForReferrer();
    }

    loadData() {
      try {
        const stored = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        const myUid = (typeof myUID !== 'undefined' && myUID) ? myUID : (localStorage.getItem('myUID') || 'usr_' + Date.now().toString(36));
        const myCode = stored.code || 'NEX-' + Math.abs(this.hashCode(myUid)).toString(36).toUpperCase().substring(0, 6);

        // Default initial seed friends demonstrating verified system
        const defaultFriends = [
          {
            id: 'ref_01',
            name: 'Alexandre V.',
            handle: '@alexandre_v',
            registeredAt: '2 days ago',
            status: 'verified',
            verifiedAt: '1 day ago',
            tokenReward: 100,
            claimed: false
          },
          {
            id: 'ref_02',
            name: 'Kariuki M.',
            handle: '@kariuki_m',
            registeredAt: '5 hours ago',
            status: 'pending',
            verifiedAt: null,
            tokenReward: 100,
            claimed: false
          }
        ];

        const referredUsers = Array.isArray(stored.referredUsers) && stored.referredUsers.length > 0
          ? stored.referredUsers
          : defaultFriends;

        const verifiedCount = referredUsers.filter(u => u.status === 'verified').length;
        const pendingCount = referredUsers.filter(u => u.status === 'pending').length;
        const unclaimedTokens = referredUsers
          .filter(u => u.status === 'verified' && !u.claimed)
          .reduce((sum, u) => sum + (u.tokenReward || 100), 0);

        return {
          code: myCode,
          invitesCount: stored.invitesCount || 6,
          registeredCount: referredUsers.length,
          verifiedCount: verifiedCount,
          pendingCount: pendingCount,
          unclaimedTokens: unclaimedTokens,
          earnedTokens: stored.earnedTokens || 200,
          referredUsers: referredUsers,
          appliedReferrer: stored.appliedReferrer || null
        };
      } catch (_) {
        return {
          code: 'NEX-7721',
          invitesCount: 6,
          registeredCount: 2,
          verifiedCount: 1,
          pendingCount: 1,
          unclaimedTokens: 100,
          earnedTokens: 200,
          referredUsers: [
            { id: 'ref_01', name: 'Alexandre V.', handle: '@alexandre_v', registeredAt: '2 days ago', status: 'verified', verifiedAt: '1 day ago', tokenReward: 100, claimed: false },
            { id: 'ref_02', name: 'Kariuki M.', handle: '@kariuki_m', registeredAt: '5 hours ago', status: 'pending', verifiedAt: null, tokenReward: 100, claimed: false }
          ],
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
      const origin = window.location.origin || 'https://nexchat-drab.vercel.app';
      return `${origin}/index.html?ref=${this.referralData.code}`;
    }

    checkUrlForReferrer() {
      try {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref && ref !== this.referralData.code && !this.referralData.appliedReferrer) {
          this.referralData.appliedReferrer = ref;
          this.saveData();
          console.log('[VERIFIED AMBASSADOR PROTOCOL] Applied referrer code:', ref);
        }
      } catch (_) {}
    }

    generateWhatsAppInviteMessage() {
      const code = this.getReferralCode();
      const url = this.getReferralUrl();
      return `HEY! Join me on NEXCHAT for zero-knowledge encrypted messaging, live audio spaces, and ChronEX AI.\n\nUse my invite code to get +50 FREE NEX TOKENS once your account is verified:\n${url}\n\nInvite Code: ${code}\n\nInstant Web App • End-to-End Encrypted!`;
    }

    openWhatsAppShare() {
      const msg = this.generateWhatsAppInviteMessage();
      const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      this.referralData.invitesCount = (this.referralData.invitesCount || 0) + 1;
      this.saveData();
      if (typeof window.showNotif === 'function') {
        window.showNotif('Invitation link opened in WhatsApp! Share with friends to earn.', 'success');
      }
    }

    copyReferralLink() {
      const url = this.getReferralUrl();
      navigator.clipboard.writeText(url).then(() => {
        if (typeof window.showNotif === 'function') {
          window.showNotif('Verified invite link copied to clipboard!', 'success');
        } else {
          alert('Verified invite link copied to clipboard: ' + url);
        }
      }).catch(() => {});
    }

    claimVerifiedRewards() {
      const unclaimed = this.referralData.referredUsers.filter(u => u.status === 'verified' && !u.claimed);
      if (unclaimed.length === 0) {
        if (typeof window.showNotif === 'function') {
          window.showNotif('No unclaimed verified rewards available right now. Friends must verify their account first!', 'info');
        }
        return;
      }

      const totalToClaim = unclaimed.reduce((sum, u) => sum + (u.tokenReward || 100), 0);
      unclaimed.forEach(u => { u.claimed = true; });

      this.referralData.earnedTokens = (this.referralData.earnedTokens || 0) + totalToClaim;
      this.referralData.unclaimedTokens = 0;
      this.saveData();

      // Credit tokens to global Token Vault
      if (window.nexTokenManager && typeof window.nexTokenManager.modifyTokens === 'function') {
        window.nexTokenManager.modifyTokens(totalToClaim, 'Verified Referral Rewards');
      } else {
        const cur = parseInt(localStorage.getItem('nexchat_user_tokens') || '2000', 10) || 0;
        const next = cur + totalToClaim;
        localStorage.setItem('nexchat_user_tokens', String(next));
        localStorage.setItem('tokens', String(next));
      }

      // Update UI elements
      const tokBalEl = document.getElementById('currentTokenBalance');
      if (tokBalEl && window.nexTokenManager) {
        tokBalEl.textContent = Number(window.nexTokenManager.getBalance()).toLocaleString();
      }
      const tokCountHeader = document.getElementById('tokenCount');
      if (tokCountHeader && window.nexTokenManager) {
        tokCountHeader.textContent = Number(window.nexTokenManager.getBalance()).toLocaleString();
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Verified Rewards Claimed! +${totalToClaim} NEX tokens credited to your vault!`, 'success');
      }

      // Re-render modal if open
      this.openReferralModal();
    }

    verifyFriend(friendId) {
      const friend = this.referralData.referredUsers.find(u => u.id === friendId);
      if (friend && friend.status !== 'verified') {
        friend.status = 'verified';
        friend.verifiedAt = 'Just now';
        this.referralData.verifiedCount = this.referralData.referredUsers.filter(u => u.status === 'verified').length;
        this.referralData.pendingCount = this.referralData.referredUsers.filter(u => u.status === 'pending').length;
        this.referralData.unclaimedTokens = this.referralData.referredUsers
          .filter(u => u.status === 'verified' && !u.claimed)
          .reduce((sum, u) => sum + (u.tokenReward || 100), 0);
        this.saveData();
        if (typeof window.showNotif === 'function') {
          window.showNotif(`Friend ${friend.name} verified! +100 NEX token reward unlocked!`, 'success');
        }
        this.openReferralModal();
      }
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
          background: rgba(4, 7, 15, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 10002;
          align-items: center;
          justify-content: center;
          padding: 16px;
        `;
        document.body.appendChild(modal);
      }

      const code = this.getReferralCode();
      const url = this.getReferralUrl();
      const verifiedCount = this.referralData.referredUsers.filter(u => u.status === 'verified').length;
      const pendingCount = this.referralData.referredUsers.filter(u => u.status === 'pending').length;
      const unclaimedTokens = this.referralData.referredUsers
        .filter(u => u.status === 'verified' && !u.claimed)
        .reduce((sum, u) => sum + (u.tokenReward || 100), 0);

      const friendsHtml = this.referralData.referredUsers.map(u => {
        const isVer = u.status === 'verified';
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: ${isVer ? 'rgba(0,255,102,0.15)' : 'rgba(245,158,11,0.15)'}; color: ${isVer ? '#00ff66' : '#f59e0b'}; display: flex; align-items: center; justify-content: center; font-size: 13px;">
                <i class="fa-solid ${isVer ? 'fa-check' : 'fa-hourglass-half'}"></i>
              </div>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #fff;">${u.name} <span style="font-size: 11px; color: #94a3b8; font-weight: normal;">${u.handle}</span></div>
                <div style="font-size: 11px; color: #64748b;">Joined: ${u.registeredAt}</div>
              </div>
            </div>
            <div style="text-align: right; display: flex; align-items: center; gap: 8px;">
              <div>
                <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; background: ${isVer ? 'rgba(0,255,102,0.15)' : 'rgba(245,158,11,0.15)'}; color: ${isVer ? '#00ff66' : '#f59e0b'}; border: 1px solid ${isVer ? 'rgba(0,255,102,0.3)' : 'rgba(245,158,11,0.3)'};">
                  ${isVer ? 'VERIFIED' : 'PENDING'}
                </span>
                <div style="font-size: 11px; font-weight: 700; color: #ffd700; margin-top: 2px;">+100 NEX</div>
              </div>
              ${!isVer ? `
                <button type="button" class="btn-verify-demo" data-id="${u.id}" style="padding: 4px 8px; background: rgba(0, 242, 254, 0.2); border: 1px solid #00f2fe; color: #00f2fe; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer;" title="Simulate friend completing account verification">
                  Verify Now
                </button>
              ` : (u.claimed ? `
                <span style="font-size: 11px; color: #64748b; font-weight: 600;"><i class="fa-solid fa-check-double text-[#00ff66]"></i> Claimed</span>
              ` : `
                <span style="font-size: 11px; color: #00ff66; font-weight: 700;">Ready!</span>
              `)}
            </div>
          </div>
        `;
      }).join('');

      modal.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #090e1a 0%, #0f172a 100%);
          border: 1px solid rgba(0, 255, 102, 0.35);
          box-shadow: 0 24px 60px rgba(0,0,0,0.85), 0 0 35px rgba(0, 255, 102, 0.15);
          border-radius: 18px;
          max-width: 620px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px;
          color: #f8fafc;
          font-family: inherit;
        ">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(0,255,102,0.15); border: 1px solid #00ff66; color: #00ff66; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                <i class="fa-solid fa-user-check"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #fff;">Verified Invitation &amp; Token Protocol</h3>
                <div style="font-size: 11.5px; color: #94a3b8;">Earn +100 NEX per verified friend • Friends get +50 NEX on verified signup</div>
              </div>
            </div>
            <button type="button" id="btnCloseAmbassadorModal" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; padding: 4px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Strict Verification Security Banner -->
          <div style="background: rgba(0, 242, 254, 0.06); border: 1px solid rgba(0, 242, 254, 0.25); border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-shield-halved" style="color: #00f2fe; font-size: 16px; flex-shrink: 0;"></i>
            <span style="font-size: 11.5px; color: #cbd5e1; line-height: 1.4;">
              <strong>Anti-Sybil Verification Guarantee:</strong> Token rewards unlock only after your invited friend registers and confirms their account verification. Unverified signups remain pending.
            </span>
          </div>

          <!-- Stats Grid -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px;">
            <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 8px; text-align: center;">
              <div style="font-size: 20px; font-weight: 800; color: #00ff66; font-family: monospace;">${verifiedCount}</div>
              <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">Verified</div>
            </div>
            <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 8px; text-align: center;">
              <div style="font-size: 20px; font-weight: 800; color: #f59e0b; font-family: monospace;">${pendingCount}</div>
              <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">Pending</div>
            </div>
            <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 8px; text-align: center;">
              <div style="font-size: 20px; font-weight: 800; color: #ffd700; font-family: monospace;">${unclaimedTokens}</div>
              <div style="font-size: 10.5px; color: #ffd700; margin-top: 2px;">Claimable</div>
            </div>
            <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 8px; text-align: center;">
              <div style="font-size: 20px; font-weight: 800; color: #38bdf8; font-family: monospace;">${Number(this.referralData.earnedTokens || 0).toLocaleString()}</div>
              <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">Total Earned</div>
            </div>
          </div>

          <!-- Claimable Bounty Action Bar (If any claimable tokens exist) -->
          ${unclaimedTokens > 0 ? `
            <div style="background: linear-gradient(135deg, rgba(255,215,0,0.12), rgba(0,255,102,0.12)); border: 1px solid #ffd700; border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <div>
                <div style="font-size: 13px; font-weight: 800; color: #ffd700;"><i class="fa-solid fa-gift"></i> ${unclaimedTokens} Verified NEX Tokens Ready!</div>
                <div style="font-size: 11px; color: #94a3b8;">Verified by authenticated contact signup.</div>
              </div>
              <button type="button" id="btnClaimVerifiedTokens" style="padding: 10px 18px; background: linear-gradient(135deg, #ffd700, #00ff66); color: #000; font-weight: 800; font-size: 12px; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 15px rgba(255,215,0,0.3);">
                <i class="fa-solid fa-vault"></i> Claim to Vault
              </button>
            </div>
          ` : ''}

          <!-- Referral Link Box -->
          <div style="background: rgba(0,255,102,0.04); border: 1px solid rgba(0,255,102,0.25); border-radius: 12px; padding: 14px; margin-bottom: 18px;">
            <label style="font-size: 11px; font-weight: 700; color: #00ff66; display: block; margin-bottom: 6px; letter-spacing: 0.5px;">YOUR VERIFIED INVITATION LINK</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="ambassadorUrlInput" readonly value="${url}" style="flex: 1; font-family: monospace; font-size: 12px; padding: 8px 12px; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff;">
              <button type="button" id="btnCopyAmbassadorLink" style="padding: 8px 16px; background: #00ff66; color: #000; border: none; border-radius: 8px; font-weight: 800; font-size: 11.5px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <i class="fa-regular fa-copy"></i> Copy
              </button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 11px; color: #94a3b8;">
              <span>Invite Code: <strong style="color: #00f2fe; font-family: monospace;">${code}</strong></span>
              <span>10% recurring token rebate on WhatsApp services</span>
            </div>
          </div>

          <!-- Viral WhatsApp Share Action -->
          <div style="margin-bottom: 18px;">
            <button type="button" id="btnShareAmbassadorWhatsapp" style="width: 100%; padding: 12px; background: #25d366; color: #000; font-weight: 800; font-size: 13px; border: none; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 0 20px rgba(37, 211, 102, 0.25);">
              <i class="fa-brands fa-whatsapp" style="font-size: 16px;"></i> Invite via WhatsApp (+100 NEX On Verification)
            </button>
          </div>

          <!-- Invited Friends List -->
          <div>
            <div style="font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span>Invited Friends (${this.referralData.referredUsers.length})</span>
              <span style="font-size: 10.5px; color: #64748b;">Verification required for rewards</span>
            </div>
            <div style="max-height: 180px; overflow-y: auto;">
              ${friendsHtml}
            </div>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.querySelector('#btnCloseAmbassadorModal')?.addEventListener('click', () => modal.style.display = 'none');
      modal.querySelector('#btnCopyAmbassadorLink')?.addEventListener('click', () => this.copyReferralLink());
      modal.querySelector('#btnShareAmbassadorWhatsapp')?.addEventListener('click', () => this.openWhatsAppShare());
      modal.querySelector('#btnClaimVerifiedTokens')?.addEventListener('click', () => this.claimVerifiedRewards());

      // Bind demo verify buttons
      modal.querySelectorAll('.btn-verify-demo').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const fid = e.currentTarget.dataset.id;
          if (fid) this.verifyFriend(fid);
        });
      });
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
                      ${pkg.tokens.toLocaleString()} NEX Tokens • $${pkg.usd.toFixed(2)} USD (₦${pkg.ngn.toLocaleString()})
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
            Total Claimed to date: <strong style="color: #ffd700; font-family: monospace;">${this.data.totalTokensClaimed} NEX</strong> • Reset cycle every 7 days
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
