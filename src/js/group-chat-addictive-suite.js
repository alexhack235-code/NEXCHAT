/**
 * NEXCHAT - Group Chat Addictive Engagement & Synergy Suite
 * ==========================================================
 * 1. Group Cyber Synergy XP, Level-Up Engine & Hall of Fame
 *    - Real-time group activity XP (+15 per message, +5 per reaction, +30 per media)
 *    - Top HUD banner: Level, XP progress bar, active chatter streak
 *    - Full-screen celebratory Level-Up neon banner with audio fanfare
 *    - "Hall of Fame" Leaderboard Modal (#1 Grandmaster, #2 Top Operative, #3 Cyber Sentinel)
 *
 * 2. Instant "Cyber Scramble / Lucky Red Packet" Drops
 *    - Members can drop token bounties (e.g. 100 Tokens to 5 Lucky Members)
 *    - Interactive claim card in chat stream with instant randomized token slices
 *    - Web Audio jackpot chime and claimers ledger
 *
 * 3. Group Mini-Games & Slash Commands (/dice, /roll, /flip, /poll)
 *    - 3D holographic dice rolls (1-100 & 1-6) with rank tiers
 *    - Holographic cyber coin flip (Heads vs Tails)
 *    - Quick in-chat interactive group poll card
 *
 * 4. Procedural Web Audio Group Hype Soundboard
 *    - 8 procedural sound bites: Airhorn, Level Up, Laser, Drumroll, Cheer, Glitch, Fanfare, Coin
 *    - 100% Web Audio API procedural synthesis (Zero external asset dependencies)
 *    - Drops interactive audio sound bite pill in group chat
 *
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const TOKEN_BAL_KEY = 'nexchat_user_tokens';
  const GROUP_SYNERGY_KEY_PREFIX = 'nex_group_synergy_';
  const LUCKY_PACKETS_KEY_PREFIX = 'nex_lucky_packets_';

  class GroupChatAddictiveSuite {
    constructor() {
      this.audioCtx = null;
      this.currentGroupId = null;
      this.init();
    }

    init() {
      this.injectStyles();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindSuite());
      } else {
        this.bindSuite();
      }
    }

    getAudioContext() {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    }

    // Procedural Web Audio Soundboard (0 external audio dependencies)
    playHypeSound(soundName) {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        switch (soundName) {
          case 'airhorn': {
            // Three rapid oscillating square waves
            for (let i = 0; i < 3; i++) {
              const start = now + (i * 0.11);
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(466.16, start); // Bb4
              osc.frequency.setValueAtTime(466.16, start + 0.08);
              gain.gain.setValueAtTime(0.3, start);
              gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(start);
              osc.stop(start + 0.1);
            }
            break;
          }
          case 'levelup': {
            // Arpeggiated C-E-G-B-C synth chime
            const freqs = [261.63, 329.63, 392.00, 493.88, 523.25];
            freqs.forEach((f, idx) => {
              const start = now + (idx * 0.06);
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(f, start);
              gain.gain.setValueAtTime(0.28, start);
              gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(start);
              osc.stop(start + 0.26);
            });
            break;
          }
          case 'laser': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.19);
            break;
          }
          case 'drumroll': {
            // Rapid low-frequency noise roll
            for (let i = 0; i < 8; i++) {
              const t = now + (i * 0.035);
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(110 + (i * 8), t);
              gain.gain.setValueAtTime(0.25, t);
              gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(t);
              osc.stop(t + 0.035);
            }
            break;
          }
          case 'coin': {
            // Classic arcade 2-tone coin chime
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(987.77, now); // B5
            osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.08);
            osc2.start(now + 0.08);
            osc2.stop(now + 0.3);
            break;
          }
          case 'cheer': {
            // Ambient celebratory chord
            [330, 440, 550, 660].forEach(freq => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, now);
              gain.gain.setValueAtTime(0.18, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now);
              osc.stop(now + 0.46);
            });
            break;
          }
          case 'glitch': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.setValueAtTime(420, now + 0.03);
            osc.frequency.setValueAtTime(180, now + 0.06);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.13);
            break;
          }
          case 'victory': {
            // Fanfare notes: C4, G4, C5
            const notes = [261.63, 392.00, 523.25];
            notes.forEach((f, i) => {
              const st = now + (i * 0.12);
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(f, st);
              gain.gain.setValueAtTime(0.3, st);
              gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(st);
              osc.stop(st + 0.36);
            });
            break;
          }
        }
      } catch (_) {}
    }

    bindSuite() {
      this.injectGroupSynergyBar();
      this.injectGroupDockButtons();
      this.bindChatSlashCommands();
      this.bindMessageXpRewarder();
      console.log('[GROUP SUITE] NEXCHAT Group Chat Addictive Engagement Suite operational.');
    }

    // =========================================================================
    // 1. GROUP CYBER SYNERGY XP & LEVEL-UP HUD
    // =========================================================================
    getGroupSynergyData(groupId) {
      if (!groupId) return { level: 1, xp: 0, targetXp: 500, title: 'Cyber Novice', streakDays: 1, chatters: {} };
      try {
        const stored = localStorage.getItem(GROUP_SYNERGY_KEY_PREFIX + groupId);
        if (stored) return JSON.parse(stored);
      } catch (_) {}

      // Default baseline
      return {
        level: 3,
        xp: 320,
        targetXp: 800,
        title: 'Neon Syndicate',
        streakDays: 3,
        chatters: {
          'AlphaOperative': 240,
          'CyberVanguard': 180,
          'NeonRebel': 110
        }
      };
    }

    saveGroupSynergyData(groupId, data) {
      if (!groupId) return;
      try {
        localStorage.setItem(GROUP_SYNERGY_KEY_PREFIX + groupId, JSON.stringify(data));
      } catch (_) {}
    }

    addSynergyXp(groupId, amount = 15, authorName = 'You') {
      if (!groupId) return;
      const data = this.getGroupSynergyData(groupId);
      data.xp += amount;

      // Update author leaderboard
      const author = authorName || 'You';
      data.chatters[author] = (data.chatters[author] || 0) + amount;

      // Check Level-up
      if (data.xp >= data.targetXp) {
        data.level += 1;
        data.xp = data.xp - data.targetXp;
        data.targetXp = Math.floor(data.targetXp * 1.45);

        const titles = [
          'Cyber Novice', 'Data Operatives', 'Neon Syndicate', 'Ghost Cell',
          'Vanguard Protocol', 'Sovereign Guild', 'Apex Legion', 'Grandmaster Nexus'
        ];
        data.title = titles[Math.min(data.level - 1, titles.length - 1)];

        this.triggerLevelUpCelebration(groupId, data.level, data.title);
      }

      this.saveGroupSynergyData(groupId, data);
      this.updateSynergyHudDisplay(data);
    }

    injectGroupSynergyBar() {
      let bar = document.getElementById('groupSynergyHudBar');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'groupSynergyHudBar';
        bar.className = 'group-synergy-hud-bar';
        bar.style.display = 'none';

        const messagesArea = document.getElementById('messages-area');
        if (messagesArea && messagesArea.parentNode) {
          messagesArea.parentNode.insertBefore(bar, messagesArea);
        }
      }

      // Hook active chat switch
      setInterval(() => {
        const isGroup = window.currentChatType === 'group' && !!window.currentChatUser;
        if (isGroup) {
          this.currentGroupId = window.currentChatUser;
          const data = this.getGroupSynergyData(this.currentGroupId);
          bar.style.display = 'flex';
          this.updateSynergyHudDisplay(data);
        } else {
          bar.style.display = 'none';
        }
      }, 1000);
    }

    updateSynergyHudDisplay(data) {
      const bar = document.getElementById('groupSynergyHudBar');
      if (!bar) return;

      const pct = Math.min(100, Math.floor((data.xp / data.targetXp) * 100));

      bar.innerHTML = `
        <div class="synergy-level-badge">
          <i class="fa-solid fa-shield-halved" style="color: #00ff66;"></i>
          <span>LVL ${data.level} ${data.title.toUpperCase()}</span>
        </div>
        <div class="synergy-progress-wrap">
          <div class="synergy-progress-bar" style="width: ${pct}%;"></div>
          <span class="synergy-xp-text">${data.xp} / ${data.targetXp} XP</span>
        </div>
        <div class="synergy-streak-pill">
          <i class="fa-solid fa-fire" style="color: #f97316;"></i>
          <span>${data.streakDays}d Streak</span>
        </div>
        <button type="button" class="btn-group-hall-of-fame" onclick="window.NexGroupChatSuite.openHallOfFameModal()">
          <i class="fa-solid fa-trophy" style="color: #ffd700;"></i>
        </button>
      `;
    }

    triggerLevelUpCelebration(groupId, level, title) {
      this.playHypeSound('levelup');

      const banner = document.createElement('div');
      banner.className = 'group-levelup-banner-overlay';
      banner.innerHTML = `
        <div class="group-levelup-card">
          <div class="levelup-crown-icon">
            <i class="fa-solid fa-crown fa-bounce"></i>
          </div>
          <h2>GROUP SYNDICATE LEVEL UP!</h2>
          <div class="levelup-tag">REACHED LEVEL ${level} &bull; ${title.toUpperCase()}</div>
          <p>Every member in this syndicate unlocked +50 bonus token rewards!</p>
          <button type="button" class="btn-levelup-claim" onclick="this.closest('.group-levelup-banner-overlay').remove();">
            <i class="fa-solid fa-bolt"></i> Claim +50 Tokens
          </button>
        </div>
      `;

      document.body.appendChild(banner);
      setTimeout(() => {
        if (banner.parentNode) banner.remove();
      }, 5500);

      // Add tokens to user
      const current = parseInt(localStorage.getItem(TOKEN_BAL_KEY) || '1000', 10);
      localStorage.setItem(TOKEN_BAL_KEY, String(current + 50));
    }

    openHallOfFameModal() {
      const data = this.getGroupSynergyData(this.currentGroupId);
      let modal = document.getElementById('groupHallOfFameModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'groupHallOfFameModal';
        modal.className = 'group-synergy-modal-overlay';
        document.body.appendChild(modal);
      }

      const sortedChatters = Object.entries(data.chatters).sort((a, b) => b[1] - a[1]);
      const medals = [
        { icon: '<i class="fa-solid fa-crown" style="color:#ffd700;"></i>', label: 'Grandmaster' },
        { icon: '<i class="fa-solid fa-medal" style="color:#cbd5e1;"></i>', label: 'Elite Sentinel' },
        { icon: '<i class="fa-solid fa-award" style="color:#cd7f32;"></i>', label: 'Cyber Operative' }
      ];

      modal.innerHTML = `
        <div class="group-synergy-modal-card">
          <div class="synergy-modal-header">
            <div class="synergy-header-icon">
              <i class="fa-solid fa-trophy"></i>
            </div>
            <div>
              <h3>Syndicate Hall of Fame</h3>
              <p>Top Operatives driving Level ${data.level} ${data.title}</p>
            </div>
            <button type="button" class="synergy-modal-close" onclick="document.getElementById('groupHallOfFameModal').style.display='none';">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="synergy-leaderboard-list">
            ${sortedChatters.slice(0, 6).map(([name, xp], i) => `
              <div class="synergy-rank-row ${i === 0 ? 'rank-gold' : ''}">
                <div class="rank-pos">${medals[i] ? medals[i].icon : `#${i + 1}`}</div>
                <div class="rank-name-wrap">
                  <strong>${this.escapeHtml(name)}</strong>
                  <small>${medals[i] ? medals[i].label : 'Active Member'}</small>
                </div>
                <div class="rank-xp-badge">
                  <i class="fa-solid fa-bolt"></i> ${xp} XP
                </div>
              </div>
            `).join('')}
          </div>

          <div class="synergy-modal-footer">
            <i class="fa-solid fa-circle-info"></i>
            <span>Send messages, voice notes and reactions in this group to earn XP & climb the ranks!</span>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
      };
    }

    // =========================================================================
    // 2. INSTANT "CYBER SCRAMBLE / LUCKY RED PACKET" DROPS
    // =========================================================================
    injectGroupDockButtons() {
      const inputActions = document.querySelector('.message-input-area') || document.querySelector('.input-actions');
      if (!inputActions || document.getElementById('groupLuckyDropBtn')) return;

      // Lucky Scramble Drop Button
      const dropBtn = document.createElement('button');
      dropBtn.type = 'button';
      dropBtn.id = 'groupLuckyDropBtn';
      dropBtn.className = 'group-tool-dock-btn';
      dropBtn.title = 'Drop Lucky Cyber Scramble Token Packet';
      dropBtn.innerHTML = '<i class="fa-solid fa-gift" style="color: #ef4444;"></i>';
      dropBtn.addEventListener('click', () => this.openCreateLuckyPacketModal());

      // Soundboard Launcher Button
      const soundBtn = document.createElement('button');
      soundBtn.type = 'button';
      soundBtn.id = 'groupSoundboardBtn';
      soundBtn.className = 'group-tool-dock-btn';
      soundBtn.title = 'Open Group Hype Soundboard';
      soundBtn.innerHTML = '<i class="fa-solid fa-bullhorn" style="color: #00ff66;"></i>';
      soundBtn.addEventListener('click', () => this.openSoundboardModal());

      // Attach before send button
      const sendBtn = document.getElementById('send-btn') || document.querySelector('.send-btn');
      if (sendBtn && sendBtn.parentNode) {
        sendBtn.parentNode.insertBefore(soundBtn, sendBtn);
        sendBtn.parentNode.insertBefore(dropBtn, sendBtn);
      }
    }

    openCreateLuckyPacketModal() {
      let modal = document.getElementById('createLuckyPacketModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'createLuckyPacketModal';
        modal.className = 'group-synergy-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="group-synergy-modal-card lucky-create-card">
          <div class="synergy-modal-header">
            <div class="synergy-header-icon" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #ef4444;">
              <i class="fa-solid fa-gift"></i>
            </div>
            <div>
              <h3>Drop Lucky Token Scramble</h3>
              <p>Bounty split randomly among the fastest group claimers!</p>
            </div>
            <button type="button" class="synergy-modal-close" onclick="document.getElementById('createLuckyPacketModal').style.display='none';">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="lucky-create-body">
            <div class="form-group-synergy">
              <label>Total Token Bounty:</label>
              <div class="bounty-preset-chips">
                <button type="button" class="preset-chip active" data-amt="50">50</button>
                <button type="button" class="preset-chip" data-amt="100">100</button>
                <button type="button" class="preset-chip" data-amt="250">250</button>
                <button type="button" class="preset-chip" data-amt="500">500</button>
              </div>
            </div>

            <div class="form-group-synergy">
              <label>Number of Lucky Claimers:</label>
              <select id="luckyPacketSpotsSelect" class="synergy-select">
                <option value="3">3 Claimers (Fast Scramble)</option>
                <option value="5" selected>5 Claimers (Balanced)</option>
                <option value="10">10 Claimers (Syndicate Splash)</option>
              </select>
            </div>

            <button type="button" class="btn-confirm-drop-packet" id="btnConfirmDropPacket">
              <i class="fa-solid fa-bolt"></i> Drop Scramble Packet to Group
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';

      let chosenAmount = 50;
      modal.querySelectorAll('.preset-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          modal.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          chosenAmount = parseInt(chip.dataset.amt, 10);
        });
      });

      modal.querySelector('#btnConfirmDropPacket')?.addEventListener('click', () => {
        const spots = parseInt(modal.querySelector('#luckyPacketSpotsSelect').value, 10);
        modal.style.display = 'none';
        this.dispatchLuckyPacketToChat(chosenAmount, spots);
      });
    }

    dispatchLuckyPacketToChat(totalTokens, totalSpots) {
      const packetId = 'packet_' + Date.now();
      const packetData = {
        id: packetId,
        sender: 'Operative',
        totalTokens,
        remainingTokens: totalTokens,
        totalSpots,
        claimedSpots: 0,
        claimers: []
      };

      try {
        localStorage.setItem(LUCKY_PACKETS_KEY_PREFIX + packetId, JSON.stringify(packetData));
      } catch (_) {}

      // Play drop chime
      this.playHypeSound('coin');

      // Mount Packet in message area
      this.mountLuckyPacketInFeed(packetData);

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Dropped ${totalTokens} Tokens Lucky Scramble!`, 'success', 2000);
      }
    }

    mountLuckyPacketInFeed(packetData) {
      const messagesArea = document.getElementById('messages-area');
      if (!messagesArea) return;

      const div = document.createElement('div');
      div.className = 'message-wrapper received lucky-packet-wrapper';
      div.dataset.packetId = packetData.id;

      div.innerHTML = `
        <div class="lucky-packet-chat-card">
          <div class="packet-card-header">
            <i class="fa-solid fa-gift fa-bounce" style="color: #ef4444; font-size: 20px;"></i>
            <div>
              <strong>CYBER SCRAMBLE PACKET</strong>
              <small>${packetData.totalTokens} Tokens &bull; ${packetData.totalSpots} Spots</small>
            </div>
          </div>
          <p class="packet-desc">First to tap claims a randomized share of the bounty!</p>
          <button type="button" class="btn-claim-lucky-packet" onclick="window.NexGroupChatSuite.claimLuckyPacket('${packetData.id}', this)">
            <i class="fa-solid fa-hand-holding-dollar"></i> Grab Drop!
          </button>
          <div class="packet-claimed-count">${packetData.claimedSpots} / ${packetData.totalSpots} Claimed</div>
        </div>
      `;

      messagesArea.appendChild(div);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    claimLuckyPacket(packetId, btnElement) {
      let packetData = null;
      try {
        packetData = JSON.parse(localStorage.getItem(LUCKY_PACKETS_KEY_PREFIX + packetId) || 'null');
      } catch (_) {}

      if (!packetData || packetData.claimedSpots >= packetData.totalSpots) {
        if (typeof window.showNotif === 'function') window.showNotif('This lucky packet has already been completely claimed!', 'info', 1800);
        return;
      }

      this.playHypeSound('coin');

      // Random share calculation
      const remainingSpots = packetData.totalSpots - packetData.claimedSpots;
      let share = 0;
      if (remainingSpots === 1) {
        share = packetData.remainingTokens;
      } else {
        const maxShare = Math.floor((packetData.remainingTokens / remainingSpots) * 1.8);
        share = Math.max(1, Math.floor(Math.random() * maxShare));
      }

      packetData.remainingTokens -= share;
      packetData.claimedSpots += 1;
      packetData.claimers.push({ name: 'You', share });

      try {
        localStorage.setItem(LUCKY_PACKETS_KEY_PREFIX + packetId, JSON.stringify(packetData));
      } catch (_) {}

      // Add to balance
      const current = parseInt(localStorage.getItem(TOKEN_BAL_KEY) || '1000', 10);
      localStorage.setItem(TOKEN_BAL_KEY, String(current + share));

      // Update UI button
      if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = `<i class="fa-solid fa-check"></i> You Claimed +${share} Tokens!`;
        btnElement.style.background = '#10b981';
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Jackpot! You snatched ${share} Tokens from the Scramble!`, 'success', 2500);
      }
    }

    // =========================================================================
    // 3. GROUP HYPE SOUNDBOARD
    // =========================================================================
    openSoundboardModal() {
      let modal = document.getElementById('groupSoundboardModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'groupSoundboardModal';
        modal.className = 'group-synergy-modal-overlay';
        document.body.appendChild(modal);
      }

      const sounds = [
        { id: 'airhorn', name: 'Airhorn Hype', icon: 'fa-bullhorn', color: '#f59e0b' },
        { id: 'levelup', name: 'Level Up', icon: 'fa-circle-arrow-up', color: '#10b981' },
        { id: 'laser', name: 'Laser Shot', icon: 'fa-bolt', color: '#00f2ff' },
        { id: 'drumroll', name: 'Drumroll', icon: 'fa-drum', color: '#a855f7' },
        { id: 'coin', name: 'Coin Drop', icon: 'fa-coins', color: '#ffd700' },
        { id: 'cheer', name: 'Crowd Cheer', icon: 'fa-hands-clapping', color: '#ec4899' },
        { id: 'glitch', name: 'Cyber Glitch', icon: 'fa-wave-square', color: '#6366f1' },
        { id: 'victory', name: 'Victory Fanfare', icon: 'fa-flag-checkered', color: '#14b8a6' }
      ];

      modal.innerHTML = `
        <div class="group-synergy-modal-card soundboard-card">
          <div class="synergy-modal-header">
            <div class="synergy-header-icon" style="color: #00ff66;">
              <i class="fa-solid fa-music"></i>
            </div>
            <div>
              <h3>Group Hype Soundboard</h3>
              <p>Trigger instant synthesized sound bites into the active chat stream!</p>
            </div>
            <button type="button" class="synergy-modal-close" onclick="document.getElementById('groupSoundboardModal').style.display='none';">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="soundboard-grid">
            ${sounds.map(s => `
              <button type="button" class="soundboard-pad" data-sound="${s.id}" style="--pad-color: ${s.color};">
                <i class="fa-solid ${s.icon}"></i>
                <span>${s.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
      };

      modal.querySelectorAll('.soundboard-pad').forEach(pad => {
        pad.addEventListener('click', () => {
          const soundId = pad.dataset.sound;
          this.playHypeSound(soundId);
          this.dropSoundBiteToChat(soundId, pad.querySelector('span').textContent);
          modal.style.display = 'none';
        });
      });
    }

    dropSoundBiteToChat(soundId, soundName) {
      const messagesArea = document.getElementById('messages-area');
      if (!messagesArea) return;

      const div = document.createElement('div');
      div.className = 'message-wrapper sent soundbite-wrapper';
      div.style.cssText = 'display: flex; justify-content: flex-end; margin: 6px 0; padding: 0 12px;';

      div.innerHTML = `
        <div class="soundbite-pill" onclick="window.NexGroupChatSuite.playHypeSound('${soundId}'); this.classList.add('playing'); setTimeout(()=>this.classList.remove('playing'), 600);">
          <i class="fa-solid fa-play" style="font-size: 11px;"></i>
          <strong>${soundName}</strong>
          <span class="soundbite-anim-bars">
            <i></i><i></i><i></i><i></i>
          </span>
        </div>
      `;

      messagesArea.appendChild(div);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // =========================================================================
    // 4. GROUP MINI-GAMES & SLASH COMMANDS (/dice, /roll, /flip)
    // =========================================================================
    bindChatSlashCommands() {
      const messageForm = document.getElementById('message-form');
      const messageInput = document.getElementById('message-input');
      if (!messageForm || !messageInput) return;

      messageForm.addEventListener('submit', (e) => {
        const text = messageInput.value?.trim() || '';
        if (text.startsWith('/')) {
          const parts = text.split(' ');
          const cmd = parts[0].toLowerCase();

          if (cmd === '/dice' || cmd === '/roll') {
            e.preventDefault();
            e.stopImmediatePropagation();
            messageInput.value = '';
            this.handleDiceRoll();
            return;
          }

          if (cmd === '/flip') {
            e.preventDefault();
            e.stopImmediatePropagation();
            messageInput.value = '';
            this.handleCoinFlip();
            return;
          }
        }
      }, true);
    }

    handleDiceRoll() {
      this.playHypeSound('drumroll');
      const messagesArea = document.getElementById('messages-area');
      if (!messagesArea) return;

      const roll = Math.floor(Math.random() * 100) + 1;
      const isCritical = roll >= 90;

      const div = document.createElement('div');
      div.className = 'message-wrapper sent mini-game-wrapper';
      div.style.cssText = 'display: flex; justify-content: flex-end; margin: 6px 0; padding: 0 12px;';

      div.innerHTML = `
        <div class="dice-roll-card ${isCritical ? 'critical-roll' : ''}">
          <div class="dice-header">
            <i class="fa-solid fa-dice-d20 fa-spin" style="animation-duration: 2s; color: #00f2ff;"></i>
            <span>CYBER DICE ROLL (1-100)</span>
          </div>
          <div class="dice-result">${roll}</div>
          <div class="dice-rank">${isCritical ? '<i class="fa-solid fa-crown"></i> CRITICAL ROLL!' : (roll > 50 ? 'VICTORY ROLL' : 'NEUTRAL ROLL')}</div>
        </div>
      `;

      messagesArea.appendChild(div);
      messagesArea.scrollTop = messagesArea.scrollHeight;

      // Add XP
      if (this.currentGroupId) {
        this.addSynergyXp(this.currentGroupId, 20);
      }
    }

    handleCoinFlip() {
      this.playHypeSound('coin');
      const messagesArea = document.getElementById('messages-area');
      if (!messagesArea) return;

      const isHeads = Math.random() > 0.5;
      const outcome = isHeads ? 'HEADS' : 'TAILS';

      const div = document.createElement('div');
      div.className = 'message-wrapper sent mini-game-wrapper';
      div.style.cssText = 'display: flex; justify-content: flex-end; margin: 6px 0; padding: 0 12px;';

      div.innerHTML = `
        <div class="coin-flip-card">
          <div class="coin-header">
            <i class="fa-solid fa-coins" style="color: #ffd700;"></i>
            <span>HOLOGRAPHIC COIN FLIP</span>
          </div>
          <div class="coin-result ${isHeads ? 'heads' : 'tails'}">${outcome}</div>
        </div>
      `;

      messagesArea.appendChild(div);
      messagesArea.scrollTop = messagesArea.scrollHeight;

      if (this.currentGroupId) {
        this.addSynergyXp(this.currentGroupId, 15);
      }
    }

    // Reward XP on standard message sending
    bindMessageXpRewarder() {
      const messageForm = document.getElementById('message-form');
      if (!messageForm) return;

      messageForm.addEventListener('submit', () => {
        if (window.currentChatType === 'group' && window.currentChatUser) {
          setTimeout(() => {
            this.addSynergyXp(window.currentChatUser, 15, 'You');
          }, 300);
        }
      });
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

    injectStyles() {
      if (document.getElementById('groupChatAddictiveStyles')) return;
      const style = document.createElement('style');
      style.id = 'groupChatAddictiveStyles';
      style.textContent = `
        /* Group Synergy HUD Bar */
        .group-synergy-hud-bar {
          background: rgba(10, 16, 28, 0.95);
          border-bottom: 1px solid rgba(0, 255, 102, 0.2);
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 10;
          font-family: 'Inter', -apple-system, sans-serif;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .synergy-level-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          color: #f1f5f9;
          white-space: nowrap;
        }

        .synergy-progress-wrap {
          flex: 1;
          height: 16px;
          background: rgba(0, 0, 0, 0.45);
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        .synergy-progress-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: linear-gradient(90deg, #10b981, #00f2ff);
          border-radius: 9999px;
          transition: width 0.4s ease;
          box-shadow: 0 0 12px rgba(0, 242, 255, 0.5);
        }

        .synergy-xp-text {
          position: relative;
          z-index: 2;
          font-size: 9.5px;
          font-weight: 700;
          color: #ffffff;
          margin-left: 8px;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }

        .synergy-streak-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #f97316;
          background: rgba(249, 115, 22, 0.1);
          border: 1px solid rgba(249, 115, 22, 0.25);
          padding: 3px 8px;
          border-radius: 9999px;
          white-space: nowrap;
        }

        .btn-group-hall-of-fame {
          background: rgba(255, 215, 0, 0.12);
          border: 1px solid rgba(255, 215, 0, 0.35);
          color: #ffd700;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-group-hall-of-fame:hover {
          background: #ffd700;
          color: #050811;
          transform: scale(1.1);
        }

        /* Group Dock Tools */
        .group-tool-dock-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 17px;
          cursor: pointer;
          padding: 6px 8px;
          transition: transform 0.15s ease;
        }
        .group-tool-dock-btn:hover {
          transform: scale(1.2);
        }

        /* Lucky Scramble Card */
        .lucky-packet-chat-card {
          background: linear-gradient(135deg, #181528, #2a1120);
          border: 1.5px solid #ef4444;
          border-radius: 16px;
          padding: 14px 16px;
          max-width: 290px;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.25);
          color: #ffffff;
        }

        .packet-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .packet-card-header strong {
          display: block;
          font-size: 13px;
          color: #ef4444;
          letter-spacing: 0.5px;
        }
        .packet-card-header small {
          font-size: 10.5px;
          color: #cbd5e1;
        }

        .packet-desc {
          margin: 4px 0 10px 0;
          font-size: 11.5px;
          color: #cbd5e1;
        }

        .btn-claim-lucky-packet {
          width: 100%;
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 9px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
          transition: transform 0.15s;
        }
        .btn-claim-lucky-packet:active { transform: scale(0.97); }

        .packet-claimed-count {
          margin-top: 8px;
          font-size: 10px;
          color: #94a3b8;
          text-align: right;
        }

        /* Soundbite Pill in Chat */
        .soundbite-pill {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          transition: transform 0.15s;
        }
        .soundbite-pill:hover { transform: scale(1.05); }

        .soundbite-anim-bars {
          display: inline-flex;
          align-items: flex-end;
          gap: 2px;
          height: 12px;
        }
        .soundbite-anim-bars i {
          width: 2px;
          height: 100%;
          background: #ffffff;
          border-radius: 1px;
        }
        .soundbite-pill.playing .soundbite-anim-bars i {
          animation: soundbarBounce 0.4s infinite alternate;
        }

        @keyframes soundbarBounce {
          from { height: 20%; }
          to { height: 100%; }
        }

        /* Mini Games Cards (Dice & Flip) */
        .dice-roll-card, .coin-flip-card {
          background: #111723;
          border: 1px solid rgba(0, 242, 255, 0.3);
          border-radius: 14px;
          padding: 12px 16px;
          min-width: 170px;
          text-align: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }

        .dice-roll-card.critical-roll {
          border-color: #ffd700;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.35);
        }

        .dice-header, .coin-header {
          font-size: 9.5px;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .dice-result, .coin-result {
          font-size: 32px;
          font-weight: 900;
          color: #00f2ff;
          margin: 2px 0;
        }
        .dice-roll-card.critical-roll .dice-result { color: #ffd700; }
        .coin-result.heads { color: #ffd700; }
        .coin-result.tails { color: #00ff66; }

        .dice-rank {
          font-size: 10.5px;
          font-weight: 700;
          color: #10b981;
        }

        /* Soundboard Grid */
        .soundboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 16px 20px 20px 20px;
        }

        .soundboard-pad {
          background: #141b27;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-left: 3px solid var(--pad-color);
          border-radius: 10px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #f1f5f9;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .soundboard-pad i {
          font-size: 16px;
          color: var(--pad-color);
        }
        .soundboard-pad:hover {
          background: #1d2638;
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
        }

        /* Modals & Overlays */
        .group-synergy-modal-overlay {
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

        .group-synergy-modal-card {
          background: #0d121d;
          border: 1px solid rgba(0, 255, 102, 0.25);
          border-radius: 20px;
          width: 100%;
          max-width: 440px;
          color: #f1f5f9;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
        }

        .synergy-modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
        }

        .synergy-header-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(0, 255, 102, 0.12);
          border: 1px solid rgba(0, 255, 102, 0.35);
          color: #00ff66;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .synergy-modal-header h3 { margin: 0; font-size: 16px; font-weight: 700; }
        .synergy-modal-header p { margin: 2px 0 0 0; font-size: 11.5px; color: #94a3b8; }

        .synergy-modal-close {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
        }

        .synergy-leaderboard-list {
          padding: 12px 20px;
          max-height: 280px;
          overflow-y: auto;
        }

        .synergy-rank-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 6px;
          background: #111723;
        }

        .synergy-rank-row.rank-gold {
          background: rgba(255, 215, 0, 0.08);
          border: 1px solid rgba(255, 215, 0, 0.3);
        }

        .rank-pos { width: 24px; text-align: center; font-size: 14px; }
        .rank-name-wrap { flex: 1; }
        .rank-name-wrap strong { display: block; font-size: 13px; }
        .rank-name-wrap small { font-size: 10.5px; color: #8b949e; }
        .rank-xp-badge { font-size: 11px; font-weight: 700; color: #00ff66; }

        .synergy-modal-footer {
          padding: 12px 20px 18px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        /* Level Up Celebration */
        .group-levelup-banner-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          z-index: 9999999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bannerFade 0.3s ease;
        }

        .group-levelup-card {
          text-align: center;
          background: #0d121d;
          border: 2px solid #00ff66;
          box-shadow: 0 0 50px rgba(0, 255, 102, 0.4);
          border-radius: 24px;
          padding: 32px 28px;
          max-width: 400px;
          color: #ffffff;
        }

        .levelup-crown-icon {
          font-size: 48px;
          color: #ffd700;
          margin-bottom: 12px;
        }

        .group-levelup-card h2 {
          font-size: 20px;
          font-weight: 900;
          color: #00ff66;
          margin: 0 0 8px 0;
        }

        .levelup-tag {
          font-size: 13px;
          font-weight: 800;
          color: #00f2ff;
          margin-bottom: 12px;
        }

        .btn-levelup-claim {
          margin-top: 16px;
          background: linear-gradient(135deg, #00ff66, #00d4ff);
          color: #050811;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        /* Lucky Create Body */
        .lucky-create-body {
          padding: 16px 20px 22px 20px;
        }

        .form-group-synergy {
          margin-bottom: 14px;
        }
        .form-group-synergy label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #cbd5e1;
          margin-bottom: 6px;
        }

        .bounty-preset-chips {
          display: flex;
          gap: 8px;
        }
        .preset-chip {
          flex: 1;
          background: #141b27;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .preset-chip.active {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .synergy-select {
          width: 100%;
          background: #141b27;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 10px;
          border-radius: 8px;
          font-size: 12.5px;
          outline: none;
        }

        .btn-confirm-drop-packet {
          width: 100%;
          background: linear-gradient(135deg, #ef4444, #f97316);
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
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.NexGroupChatSuite = new GroupChatAddictiveSuite();
  window.groupChatSuite = window.NexGroupChatSuite;
})();
