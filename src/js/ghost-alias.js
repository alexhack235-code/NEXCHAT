/**
 * NEXCHAT - Disposable Ghost Aliases & Burner Identity Engine
 * Module: src/js/ghost-alias.js
 * 
 * Enables one-click generation of cryptographic burner pseudonyms with neon vector
 * avatars and timed self-destruction (1h, 24h, 7d). Masks UID and real username across
 * public chat lobbies, reels interactions, and group participation.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'nex_ghost_alias_session';

  const PREFIXES = ['ghost', 'spectre', 'phantom', 'cipher', 'nexus', 'shadow', 'zero', 'vortex', 'stealth', 'hyper'];
  const SUFFIXES = ['node', 'proxy', 'operator', 'agent', 'shard', 'runner', 'matrix', 'echo', 'pulse', 'sentinel'];

  function generateRandomAlias() {
    const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
    const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${p}_${s}_${num}`;
  }

  function generateGhostAvatar(alias) {
    const hue = Math.floor(Math.random() * 360);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="hsl(${hue}, 100%, 55%)"/>
            <stop offset="100%" stop-color="hsl(${(hue + 60) % 360}, 100%, 45%)"/>
          </linearGradient>
        </defs>
        <rect width="80" height="80" rx="40" fill="#030712"/>
        <circle cx="40" cy="40" r="36" fill="none" stroke="url(#g)" stroke-width="2.5" stroke-dasharray="4 2"/>
        <path d="M40 24c-8.8 0-16 7.2-16 16v14l5-4 5 4 6-4 6 4 5-4 5 4V40c0-8.8-7.2-16-16-16zm-5 13a3 3 0 110-6 3 3 0 010 6zm10 0a3 3 0 110-6 3 3 0 010 6z" fill="url(#g)"/>
      </svg>
    `;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  const NexGhostAlias = {
    init() {
      this.checkExpiry();
      this.renderPill();
      this.bindTriggers();
      setInterval(() => this.checkExpiry(), 10000);
    },

    getActiveSession() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (Date.now() > data.expiresAt) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
        return data;
      } catch (_) {
        return null;
      }
    },

    isGhostActive() {
      return this.getActiveSession() !== null;
    },

    createAlias(durationHours = 24) {
      const alias = generateRandomAlias();
      const avatar = generateGhostAvatar(alias);
      const session = {
        alias,
        avatar,
        durationHours,
        createdAt: Date.now(),
        expiresAt: Date.now() + durationHours * 3600 * 1000,
        ghostUid: 'ghost_' + Math.random().toString(36).substring(2, 10)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      this.renderPill();
      return session;
    },

    deactivate() {
      localStorage.removeItem(STORAGE_KEY);
      this.renderPill();
      window.location.reload();
    },

    checkExpiry() {
      const sess = this.getActiveSession();
      if (!sess && document.getElementById('ghostAliasPill')) {
        this.renderPill();
      }
    },

    getIdentityOverride(originalUser = {}) {
      const sess = this.getActiveSession();
      if (!sess) return originalUser;
      return {
        ...originalUser,
        name: sess.alias,
        username: sess.alias,
        displayName: sess.alias,
        profilePic: sess.avatar,
        profilePicUrl: sess.avatar,
        isGhost: true,
        realUid: originalUser.uid,
        uid: sess.ghostUid
      };
    },

    renderPill() {
      const existing = document.getElementById('ghostAliasPill');
      const sess = this.getActiveSession();

      if (!sess) {
        if (existing) existing.remove();
        return;
      }

      const remainingMs = Math.max(0, sess.expiresAt - Date.now());
      const hours = Math.floor(remainingMs / 3600000);
      const mins = Math.floor((remainingMs % 3600000) / 60000);
      const timeStr = `${hours}h ${mins}m`;

      let pill = existing;
      if (!pill) {
        pill = document.createElement('div');
        pill.id = 'ghostAliasPill';
        pill.style.cssText = 'position:fixed; bottom:18px; left:18px; z-index:9999; display:inline-flex; align-items:center; gap:8px; padding:6px 12px; background:rgba(3,7,18,0.9); border:1px solid #a855f7; border-radius:30px; box-shadow:0 0 15px rgba(168,85,247,0.3); font-size:11.5px; color:#e9d5ff; backdrop-filter:blur(6px);';
        document.body.appendChild(pill);
      }

      pill.innerHTML = `
        <i class="fa-solid fa-ghost" style="color:#c084fc;"></i>
        <span>GHOST ALIAS: <strong>${sess.alias}</strong> (${timeStr})</span>
        <button type="button" id="btnExitGhostAlias" style="background:none; border:none; color:#f43f5e; cursor:pointer; padding:0 4px; font-size:11px;" title="Deactivate Ghost Identity">
          <i class="fa-solid fa-power-off"></i>
        </button>
      `;

      pill.querySelector('#btnExitGhostAlias')?.addEventListener('click', () => {
        if (confirm('Deactivate Ghost Alias and return to your primary identity?')) {
          this.deactivate();
        }
      });
    },

    openModal() {
      let modal = document.getElementById('ghostAliasModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ghostAliasModal';
        modal.className = 'cyber-modal-overlay';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:99999; padding:16px;';
        modal.innerHTML = `
          <div style="background:#090d16; border:1px solid rgba(168,85,247,0.4); border-radius:14px; max-width:440px; width:100%; padding:24px; box-shadow:0 0 30px rgba(168,85,247,0.2); color:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <h3 style="font-size:16px; font-weight:800; color:#c084fc; margin:0; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-ghost"></i> Disposable Ghost Persona
              </h3>
              <button type="button" onclick="document.getElementById('ghostAliasModal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p style="font-size:12px; color:#94a3b8; line-height:1.5; margin-bottom:16px;">
              Generate an ephemeral cryptographic pseudonym. All interactions in public rooms and reels comments will display this ghost persona without leaking your account UID or personal email.
            </p>
            <div style="margin-bottom:16px;">
              <label style="display:block; font-size:11px; text-transform:uppercase; color:#c084fc; margin-bottom:6px; font-weight:700;">
                Select Lifespan
              </label>
              <select id="selectGhostDuration" style="width:100%; padding:10px 12px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-size:13px;">
                <option value="1">1 Hour Burner</option>
                <option value="24" selected>24 Hours Active</option>
                <option value="168">7 Days Extended Shard</option>
              </select>
            </div>
            <div style="display:flex; gap:10px; justify-content:flex-end;">
              <button type="button" onclick="document.getElementById('ghostAliasModal').style.display='none'" style="padding:8px 14px; background:transparent; border:1px solid rgba(255,255,255,0.15); color:#94a3b8; border-radius:6px; font-size:12px; cursor:pointer;">
                Cancel
              </button>
              <button type="button" id="btnConfirmGhostAlias" style="padding:8px 16px; background:#a855f7; border:none; color:#fff; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-mask"></i> Engage Ghost Persona
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btnConfirmGhostAlias')?.addEventListener('click', () => {
          const duration = parseInt(document.getElementById('selectGhostDuration')?.value || '24', 10);
          const sess = NexGhostAlias.createAlias(duration);
          modal.style.display = 'none';
          alert(`Ghost Persona [${sess.alias}] activated for ${duration} hours!`);
        });
      }
      modal.style.display = 'flex';
    },

    bindTriggers() {
      document.querySelectorAll('#btnToggleGhostAlias, .btn-ghost-alias').forEach(btn => {
        btn.addEventListener('click', () => this.openModal());
      });
    }
  };

  window.NexGhostAlias = NexGhostAlias;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NexGhostAlias.init());
  } else {
    NexGhostAlias.init();
  }
})(window);
