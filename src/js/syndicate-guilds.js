/**
 * NEXCHAT - Cyber Syndicate Guilds & Clan Territories Engine
 * Faction allegiance, territory sector map, synchronized guild raids,
 * communal token vaults, and clan prestige progression.
 */

(function() {
  'use strict';

  const GUILD_STORAGE_KEY = 'nexchat_user_guild';
  const SECTORS_STORAGE_KEY = 'nexchat_guild_sectors';
  const TOKEN_BAL_KEY = 'nexchat_user_tokens';

  const DEFAULT_GUILDS = [
    {
      id: 'neon_syndicate',
      name: 'Neon Syndicate',
      tag: '[NEON]',
      motto: 'Speed, High-Stakes Infiltration, and Market Dominance',
      primaryColor: '#00ff66',
      membersCount: 1420,
      vaultTokens: 125400,
      controlledSectors: ['Sector 01: Core Exchange', 'Sector 04: Fiber Highway']
    },
    {
      id: 'cipher_vanguard',
      name: 'Cipher Vanguard',
      tag: '[CIPHER]',
      motto: 'Zero-Day Enclave Defense and Cryptographic Sovereignty',
      primaryColor: '#00d4ff',
      membersCount: 1890,
      vaultTokens: 210800,
      controlledSectors: ['Sector 02: Quantum Relay', 'Sector 05: Satellite Uplink']
    },
    {
      id: 'ghost_collective',
      name: 'Ghost Collective',
      tag: '[GHOST]',
      motto: 'Decentralized P2P Mesh and Undetected Surveillance',
      primaryColor: '#a855f7',
      membersCount: 1110,
      vaultTokens: 98700,
      controlledSectors: ['Sector 03: Black Vault']
    }
  ];

  const DEFAULT_SECTORS = [
    { id: 'sec_01', name: 'Sector 01: Core Exchange', controlledBy: 'neon_syndicate', defensePoints: 850, maxDefense: 1000 },
    { id: 'sec_02', name: 'Sector 02: Quantum Relay', controlledBy: 'cipher_vanguard', defensePoints: 920, maxDefense: 1000 },
    { id: 'sec_03', name: 'Sector 03: Black Vault', controlledBy: 'ghost_collective', defensePoints: 640, maxDefense: 1000 },
    { id: 'sec_04', name: 'Sector 04: Fiber Highway', controlledBy: 'neon_syndicate', defensePoints: 780, maxDefense: 1000 },
    { id: 'sec_05', name: 'Sector 05: Satellite Uplink', controlledBy: 'cipher_vanguard', defensePoints: 890, maxDefense: 1000 }
  ];

  class SyndicateGuildsEngine {
    constructor() {
      this.currentGuild = this.loadUserGuild();
      this.sectors = this.loadSectors();
      this.guilds = DEFAULT_GUILDS;
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
      this.bindHeaderTrigger();
      this.listenSupabaseRealtime();
    }

    injectHeaderTrigger() {
      this.bindHeaderTrigger();
    }

    loadUserGuild() {
      try {
        const raw = localStorage.getItem(GUILD_STORAGE_KEY);
        return raw ? JSON.parse(raw) : { guildId: 'cipher_vanguard', rank: 'Operative', contributions: 350 };
      } catch (e) {
        return { guildId: 'cipher_vanguard', rank: 'Operative', contributions: 350 };
      }
    }

    saveUserGuild() {
      try {
        localStorage.setItem(GUILD_STORAGE_KEY, JSON.stringify(this.currentGuild));
      } catch (e) {}
    }

    loadSectors() {
      try {
        const raw = localStorage.getItem(SECTORS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : DEFAULT_SECTORS;
      } catch (e) {
        return DEFAULT_SECTORS;
      }
    }

    saveSectors() {
      try {
        localStorage.setItem(SECTORS_STORAGE_KEY, JSON.stringify(this.sectors));
      } catch (e) {}
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
      if (document.getElementById('syndicateGuildsModal')) return;

      const modal = document.createElement('div');
      modal.id = 'syndicateGuildsModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window syndicate-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-shield-halved text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">CYBER SYNDICATE FACTIONS</h3>
              <span class="syndicate-live-badge">SECTOR CONFLICT ACTIVE</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeSyndicateModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="syndicate-modal-body">
            <!-- Active Allegiance Card -->
            <div class="syndicate-active-bar" id="activeSyndicateBar">
              <!-- Rendered via JS -->
            </div>

            <!-- Tab Switcher -->
            <div class="syndicate-tabs-nav mt-3">
              <button type="button" class="syndicate-tab-btn active" data-tab="factions">
                <i class="fa-solid fa-users"></i> FACTIONS
              </button>
              <button type="button" class="syndicate-tab-btn" data-tab="sectors">
                <i class="fa-solid fa-map-location-dot"></i> SECTOR MAP
              </button>
              <button type="button" class="syndicate-tab-btn" data-tab="vault">
                <i class="fa-solid fa-vault"></i> GUILD VAULT
              </button>
            </div>

            <!-- Tab Content: Factions List -->
            <div class="syndicate-tab-view" id="tabViewFactions">
              <div class="syndicate-grid mt-3" id="syndicateGrid">
                <!-- Rendered dynamically -->
              </div>
            </div>

            <!-- Tab Content: Sector War Map -->
            <div class="syndicate-tab-view" id="tabViewSectors" style="display: none;">
              <div class="sectors-list mt-3" id="sectorsList">
                <!-- Rendered dynamically -->
              </div>
            </div>

            <!-- Tab Content: Guild Vault -->
            <div class="syndicate-tab-view" id="tabViewVault" style="display: none;">
              <div class="vault-panel mt-3">
                <div class="vault-stats-box">
                  <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">SYNDICATE COMMUNAL TREASURY:</span>
                  <h2 class="text-2xl font-bold text-[#00ff66] mt-1" id="vaultTreasuryTotal">210,800 TOKENS</h2>
                  <p class="text-xs text-gray-400 mt-1">Pool tokens with your syndicate to finance sector shields and unlock daily operative dividends.</p>
                </div>

                <div class="vault-deposit-form mt-4">
                  <label class="text-xs font-bold text-gray-300">CONTRIBUTE TO VAULT:</label>
                  <div class="flex gap-2 mt-2">
                    <input type="number" id="vaultDepositInput" class="vault-amount-input" placeholder="Amount (min 25)" min="25" />
                    <button type="button" id="confirmVaultDepositBtn" class="vault-deposit-btn">DEPOSIT</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindModalEvents();
      this.renderAllViews();
    }

    bindModalEvents() {
      const modal = document.getElementById('syndicateGuildsModal');
      document.getElementById('closeSyndicateModalBtn')?.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });

      // Tabs
      const tabs = document.querySelectorAll('.syndicate-tab-btn');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const target = tab.dataset.tab;
          document.querySelectorAll('.syndicate-tab-view').forEach(v => v.style.display = 'none');

          if (target === 'factions') {
            const v = document.getElementById('tabViewFactions');
            if (v) v.style.display = 'block';
          } else if (target === 'sectors') {
            const v = document.getElementById('tabViewSectors');
            if (v) v.style.display = 'block';
          } else if (target === 'vault') {
            const v = document.getElementById('tabViewVault');
            if (v) v.style.display = 'block';
          }
        });
      });

      // Vault deposit
      document.getElementById('confirmVaultDepositBtn')?.addEventListener('click', () => {
        const input = document.getElementById('vaultDepositInput');
        const amount = input ? parseInt(input.value, 10) : 0;
        if (!amount || amount < 25) {
          if (typeof window.showNotif === 'function') window.showNotif('Minimum deposit is 25 tokens', 'error');
          return;
        }

        const bal = this.getUserTokens();
        if (bal < amount) {
          if (typeof window.showNotif === 'function') window.showNotif('Insufficient token balance', 'error');
          return;
        }

        this.setUserTokens(bal - amount);
        this.currentGuild.contributions = (this.currentGuild.contributions || 0) + amount;
        this.saveUserGuild();

        const activeG = this.guilds.find(g => g.id === this.currentGuild.guildId);
        if (activeG) activeG.vaultTokens += amount;

        if (input) input.value = '';
        this.renderAllViews();

        if (typeof window.showNotif === 'function') {
          window.showNotif(`Deposited ${amount} tokens to Syndicate Vault`, 'success', 2500);
        }
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
      });
    }

    bindHeaderTrigger() {
      const headerActions = document.querySelector('.chat-detail-header-actions') || 
                            document.querySelector('.chat-detail-header-right');
      if (headerActions && !document.getElementById('syndicateBtnHeader')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'syndicateBtnHeader';
        btn.className = 'header-icon-btn';
        btn.title = 'Cyber Syndicate Factions & Territories';
        btn.innerHTML = `<i class="fa-solid fa-shield-halved text-[#00ff66]"></i>`;
        btn.addEventListener('click', () => this.openModal());
        headerActions.insertBefore(btn, headerActions.firstChild);
      }
    }

    openModal() {
      const modal = document.getElementById('syndicateGuildsModal');
      if (!modal) return;
      modal.style.display = 'flex';
      this.renderAllViews();
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    renderAllViews() {
      this.renderActiveBar();
      this.renderFactionsGrid();
      this.renderSectorsList();
      this.renderVaultView();
    }

    renderActiveBar() {
      const bar = document.getElementById('activeSyndicateBar');
      if (!bar) return;
      const activeG = this.guilds.find(g => g.id === this.currentGuild.guildId) || this.guilds[0];

      bar.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <span class="text-[10px] text-gray-400 uppercase font-bold tracking-wider">YOUR SYNDICATE ALLEGIANCE:</span>
            <div class="flex items-center gap-2 mt-1">
              <strong class="text-white text-sm" style="color: ${activeG.primaryColor};">${activeG.name}</strong>
              <span class="syndicate-tag-pill">${activeG.tag}</span>
              <span class="syndicate-rank-pill">${this.currentGuild.rank || 'Operative'}</span>
            </div>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-gray-400 uppercase font-bold tracking-wider">YOUR MERIT POINTS:</span>
            <div class="text-sm font-bold text-[#00ff66]">${this.currentGuild.contributions || 0} PTS</div>
          </div>
        </div>
      `;
    }

    renderFactionsGrid() {
      const grid = document.getElementById('syndicateGrid');
      if (!grid) return;

      grid.innerHTML = this.guilds.map(g => {
        const isCurrent = g.id === this.currentGuild.guildId;
        return `
          <div class="syndicate-card ${isCurrent ? 'active-allegiance' : ''}" style="border-top: 3px solid ${g.primaryColor};">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-white text-sm">${g.name}</h4>
              <span class="syndicate-tag-pill">${g.tag}</span>
            </div>
            <p class="syndicate-motto mt-2">${g.motto}</p>

            <div class="syndicate-stats-row mt-3">
              <div>
                <span class="stat-label">OPERATIVES:</span>
                <span class="stat-val">${g.membersCount.toLocaleString()}</span>
              </div>
              <div>
                <span class="stat-label">VAULT:</span>
                <span class="stat-val text-[#00ff66]">${g.vaultTokens.toLocaleString()}</span>
              </div>
              <div>
                <span class="stat-label">SECTORS:</span>
                <span class="stat-val text-[#00d4ff]">${g.controlledSectors.length}</span>
              </div>
            </div>

            <div class="mt-4">
              ${isCurrent ? `
                <button type="button" class="syndicate-join-btn current" disabled>ACTIVE ALLEGIANCE</button>
              ` : `
                <button type="button" class="syndicate-join-btn" data-guild-id="${g.id}">PLEDGE ALLEGIANCE</button>
              `}
            </div>
          </div>
        `;
      }).join('');

      grid.querySelectorAll('.syndicate-join-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
          const gId = btn.dataset.guildId;
          this.pledgeAllegiance(gId);
        });
      });
    }

    pledgeAllegiance(guildId) {
      this.currentGuild.guildId = guildId;
      this.saveUserGuild();
      this.renderAllViews();
      const targetG = this.guilds.find(g => g.id === guildId);
      if (typeof window.showNotif === 'function') {
        window.showNotif(`Pledged allegiance to ${targetG ? targetG.name : guildId}`, 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    renderSectorsList() {
      const list = document.getElementById('sectorsList');
      if (!list) return;

      list.innerHTML = this.sectors.map(s => {
        const controllingGuild = this.guilds.find(g => g.id === s.controlledBy) || { name: 'Neutral', tag: '[FREE]', primaryColor: '#94a3b8' };
        const isOurSector = s.controlledBy === this.currentGuild.guildId;
        const pct = Math.round((s.defensePoints / s.maxDefense) * 100);

        return `
          <div class="sector-card mt-2">
            <div class="flex items-center justify-between">
              <div>
                <h5 class="text-white text-xs font-bold">${s.name}</h5>
                <span class="text-[10px] text-gray-400">Occupied by: <strong style="color: ${controllingGuild.primaryColor};">${controllingGuild.name} ${controllingGuild.tag}</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold" style="color: ${controllingGuild.primaryColor};">${pct}% DEFENSE</span>
                <button type="button" class="sector-raid-btn ${isOurSector ? 'reinforce' : 'attack'}" data-sector-id="${s.id}">
                  ${isOurSector ? 'REINFORCE' : 'RAID SECTOR'}
                </button>
              </div>
            </div>

            <div class="sector-defense-bar-track mt-2">
              <div class="sector-defense-bar-fill" style="width: ${pct}%; background: ${controllingGuild.primaryColor};"></div>
            </div>
          </div>
        `;
      }).join('');

      list.querySelectorAll('.sector-raid-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const sId = btn.dataset.sectorId;
          this.executeSectorAction(sId);
        });
      });
    }

    executeSectorAction(sectorId) {
      const sector = this.sectors.find(s => s.id === sectorId);
      if (!sector) return;

      const isOurSector = sector.controlledBy === this.currentGuild.guildId;

      if (isOurSector) {
        // Reinforce
        sector.defensePoints = Math.min(sector.maxDefense, sector.defensePoints + 50);
        this.currentGuild.contributions = (this.currentGuild.contributions || 0) + 15;
        this.saveUserGuild();
        this.saveSectors();
        this.renderAllViews();

        if (typeof window.showNotif === 'function') {
          window.showNotif(`Sector reinforced (+50 Defense, +15 Merit Points)`, 'success', 2000);
        }
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
      } else {
        // Raid
        sector.defensePoints = Math.max(0, sector.defensePoints - 75);
        if (sector.defensePoints <= 0) {
          sector.controlledBy = this.currentGuild.guildId;
          sector.defensePoints = 300;
          if (typeof window.showNotif === 'function') {
            window.showNotif(`SECTOR CAPTURED FOR YOUR SYNDICATE!`, 'success', 3500);
          }
          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('victory');
        } else {
          if (typeof window.showNotif === 'function') {
            window.showNotif(`Raid strike executed! Neutralized 75 Defense points.`, 'info', 2000);
          }
          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');
        }
        this.currentGuild.contributions = (this.currentGuild.contributions || 0) + 25;
        this.saveUserGuild();
        this.saveSectors();
        this.renderAllViews();
      }

      this.broadcastGuildEvent('sector_strike', { sectorId, controlledBy: sector.controlledBy });
    }

    renderVaultView() {
      const el = document.getElementById('vaultTreasuryTotal');
      if (el) {
        const activeG = this.guilds.find(g => g.id === this.currentGuild.guildId) || this.guilds[0];
        el.textContent = `${activeG.vaultTokens.toLocaleString()} TOKENS`;
      }
    }

    broadcastGuildEvent(action, payload) {
      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (!partnerId) return;

        window.sendSupabaseMessage({
          from: window.myUID || 'u_current',
          to: partnerId,
          text: "",
          attachment: {
            fileType: 'syndicate_event',
            isSyndicateEvent: true,
            action: action,
            payload: payload
          },
          chatType: window.currentChatType || 'direct'
        }).catch(() => {});
      }
    }

    listenSupabaseRealtime() {
      window.addEventListener('nexchat:syndicate_event_received', (e) => {
        const data = e.detail;
        if (!data) return;
        this.sectors = this.loadSectors();
        this.renderAllViews();
      });
    }
  }

  window.syndicateGuildsEngine = new SyndicateGuildsEngine();
})();
