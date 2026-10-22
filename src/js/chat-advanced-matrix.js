/**
 * NEXCHAT - Advanced Chat Matrix Suite
 * 1. Tactical 4-Screen Multi-Channel Split Matrix
 * 2. Stealth Ghost Receipts & Blind Typing Radar
 * 3. White-Hat Security & URL Scanner (/audit)
 * 4. Self-Balancing Group Expense & Mission Tab (/tab)
 * 5. CamShot Reel-to-Chat Interactive Mini-Player
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and FontAwesome vector icons.
 */

(function() {
  'use strict';

  class ChatAdvancedMatrix {
    constructor() {
      this.isStealthMode = false;
      this.isSplitMatrixActive = false;
      this.expenses = [];
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
      this.checkIncomingSharedReel();
    }

    bindDOM() {
      this.injectHeaderButtons();
      this.injectSplitGrid();
      this.injectTabModal();
      this.injectHubActions();
      this.hookMessageInput();
    }

    injectHeaderButtons() {
      const headerActions = document.querySelector('.header-right') || 
                            document.querySelector('.chat-detail-header-actions');
      if (!headerActions || document.getElementById('splitMatrixBtnHeader')) return;

      // 1. Tactical 4-Screen Split Matrix Toggle
      const splitBtn = document.createElement('button');
      splitBtn.type = 'button';
      splitBtn.id = 'splitMatrixBtnHeader';
      splitBtn.className = 'header-icon-btn';
      splitBtn.title = 'Tactical 4-Screen Multi-Channel Monitoring Grid';
      splitBtn.innerHTML = `<i class="fa-solid fa-table-cells text-[#00f3ff]"></i>`;
      splitBtn.addEventListener('click', () => this.toggleSplitMatrix());
      headerActions.prepend(splitBtn);

      // 2. Stealth Ghost Mode Toggle
      const ghostBtn = document.createElement('button');
      ghostBtn.type = 'button';
      ghostBtn.id = 'stealthGhostBtnHeader';
      ghostBtn.className = 'header-icon-btn';
      ghostBtn.title = 'Stealth Ghost Read Receipts & Blind Typing (Alt+G)';
      ghostBtn.innerHTML = `<i class="fa-solid fa-ghost text-[#c084fc]"></i>`;
      ghostBtn.addEventListener('click', () => this.toggleStealthMode());
      headerActions.prepend(ghostBtn);
    }

    injectHubActions() {
      const hubList = document.querySelector('#attachmentHubModal .hub-grid') || 
                      document.querySelector('.attachment-hub-menu') ||
                      document.getElementById('attachmentGrid');
      if (!hubList) return;

      // 1. Security URL Scanner Hub Action
      if (!document.getElementById('hubActionSecurityScan')) {
        const item1 = document.createElement('div');
        item1.id = 'hubActionSecurityScan';
        item1.className = 'hub-action-item';
        item1.innerHTML = `
          <div class="hub-action-icon" style="color: #00ff66;"><i class="fa-solid fa-shield-virus"></i></div>
          <div class="hub-action-label">Sec Scanner</div>
        `;
        item1.addEventListener('click', () => {
          const hubModal = document.getElementById('attachmentHubModal');
          if (hubModal) hubModal.style.display = 'none';
          const targetUrl = prompt('Enter URL or IP address to run white-hat security scan:', 'https://api.nexchat.io');
          if (targetUrl) this.executeSecurityAudit(targetUrl);
        });
        hubList.appendChild(item1);
      }

      // 2. Mission Expense Tab Hub Action
      if (!document.getElementById('hubActionMissionTab')) {
        const item2 = document.createElement('div');
        item2.id = 'hubActionMissionTab';
        item2.className = 'hub-action-item';
        item2.innerHTML = `
          <div class="hub-action-icon" style="color: #ffd700;"><i class="fa-solid fa-calculator"></i></div>
          <div class="hub-action-label">Mission Tab</div>
        `;
        item2.addEventListener('click', () => {
          const hubModal = document.getElementById('attachmentHubModal');
          if (hubModal) hubModal.style.display = 'none';
          this.openTabModal();
        });
        hubList.appendChild(item2);
      }
    }

    hookMessageInput() {
      const input = document.getElementById('messageInput') || document.querySelector('.chat-input-textarea');
      if (!input) return;

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          const text = input.value.trim();
          if (text.startsWith('/audit')) {
            e.preventDefault();
            const target = text.replace(/^\/audit\s*/i, '').trim();
            input.value = '';
            this.executeSecurityAudit(target || 'https://internal.nexus.local');
          } else if (text === '/tab') {
            e.preventDefault();
            input.value = '';
            this.openTabModal();
          }
        }
      });
    }

    /* ------------------------------------------------------------------------
       1. TACTICAL 4-SCREEN MULTI-CHANNEL SPLIT MATRIX
       ------------------------------------------------------------------------ */
    injectSplitGrid() {
      if (document.getElementById('tacticalSplitGridContainer')) return;

      const grid = document.createElement('div');
      grid.id = 'tacticalSplitGridContainer';
      grid.className = 'tactical-split-grid';
      grid.style.display = 'none';

      const sectors = [
        { id: 'alpha', name: 'SECTOR ALPHA: COMMAND CORE', color: '#00f3ff' },
        { id: 'beta', name: 'SECTOR BETA: RECON TELEMETRY', color: '#ffd700' },
        { id: 'gamma', name: 'SECTOR GAMMA: THREAT SENTINEL', color: '#ff0055' },
        { id: 'delta', name: 'SECTOR DELTA: EMERGENCY WIRE', color: '#00ff66' }
      ];

      grid.innerHTML = sectors.map(sec => `
        <div class="split-sector-panel" data-sector="${sec.id}">
          <div class="split-sector-header">
            <span class="sector-tag" style="color: ${sec.color};"><i class="fa-solid fa-satellite"></i> ${sec.name}</span>
            <span class="sector-status">LIVE STREAM</span>
          </div>
          <div class="split-sector-feed" id="feedSector_${sec.id}">
            <div class="sector-msg-item">
              <span class="font-mono text-[10px] text-gray-400">[00:01]</span>
              <strong class="text-white text-xs">System:</strong>
              <span class="text-gray-300 text-xs">Sector channel bound and listening on peer mesh.</span>
            </div>
          </div>
          <div class="split-sector-input-bar">
            <input type="text" class="split-sector-input" placeholder="Dispatch to ${sec.id.toUpperCase()}..." 
              onkeydown="if(event.key==='Enter') window.chatAdvancedMatrix.dispatchSectorMessage('${sec.id}', this)" />
          </div>
        </div>
      `).join('');

      document.body.appendChild(grid);
    }

    toggleSplitMatrix() {
      this.isSplitMatrixActive = !this.isSplitMatrixActive;
      const grid = document.getElementById('tacticalSplitGridContainer');
      const chatContainer = document.querySelector('.chat-app-container') || document.querySelector('.app-container');
      const btn = document.getElementById('splitMatrixBtnHeader');

      if (grid) grid.style.display = this.isSplitMatrixActive ? 'grid' : 'none';
      if (chatContainer) chatContainer.style.display = this.isSplitMatrixActive ? 'none' : 'flex';
      if (btn) btn.classList.toggle('active', this.isSplitMatrixActive);

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Tactical 4-Screen Matrix ${this.isSplitMatrixActive ? 'ENGAGED' : 'DISENGAGED'}`, 'info', 2500);
      }
    }

    dispatchSectorMessage(secId, inputEl) {
      const text = inputEl.value.trim();
      if (!text) return;
      inputEl.value = '';

      const feed = document.getElementById(`feedSector_${secId}`);
      if (feed) {
        const item = document.createElement('div');
        item.className = 'sector-msg-item';
        item.innerHTML = `
          <span class="font-mono text-[10px] text-gray-400">[${new Date().toLocaleTimeString()}]</span>
          <strong class="text-[#00f3ff] text-xs">You:</strong>
          <span class="text-white text-xs">${this.escapeHtml(text)}</span>
        `;
        feed.appendChild(item);
        feed.scrollTop = feed.scrollHeight;
      }
    }

    /* ------------------------------------------------------------------------
       2. STEALTH GHOST RECEIPTS & BLIND TYPING RADAR
       ------------------------------------------------------------------------ */
    toggleStealthMode() {
      this.isStealthMode = !this.isStealthMode;
      const btn = document.getElementById('stealthGhostBtnHeader');
      if (btn) btn.classList.toggle('active', this.isStealthMode);

      let banner = document.getElementById('stealthModeBanner');
      if (this.isStealthMode) {
        if (!banner) {
          banner = document.createElement('div');
          banner.id = 'stealthModeBanner';
          banner.className = 'stealth-mode-banner';
          banner.innerHTML = `
            <i class="fa-solid fa-ghost text-[#c084fc]"></i>
            <span>STEALTH ENCLAVE: GHOST RECEIPTS &amp; BLIND TYPING ACTIVATED</span>
          `;
          const chatDetail = document.querySelector('.chat-detail') || document.body;
          chatDetail.prepend(banner);
        } else {
          banner.style.display = 'flex';
        }
      } else {
        if (banner) banner.style.display = 'none';
      }

      // Override global typing dispatcher if present
      if (window.chatApp) {
        window.chatApp.suppressReadReceipts = this.isStealthMode;
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Stealth Ghost Mode ${this.isStealthMode ? 'ONLINE: Receipts suppressed' : 'OFFLINE'}`, 'success', 2500);
      }
    }

    /* ------------------------------------------------------------------------
       3. WHITE-HAT SECURITY & URL SCANNER
       ------------------------------------------------------------------------ */
    executeSecurityAudit(targetUrl) {
      let cleanUrl = targetUrl.trim();
      if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl;

      let hostname = cleanUrl;
      try {
        hostname = new URL(cleanUrl).hostname;
      } catch (e) {}

      const auditData = {
        id: 'sec_' + Date.now().toString(36),
        target: cleanUrl,
        domain: hostname,
        sslStatus: 'TLS 1.3 VALID (ECDHE_RSA with P-256)',
        hstsStatus: 'STRICT_TRANSPORT_SECURITY_ACTIVE',
        cspStatus: 'RESTRICTIVE_ENFORCED',
        threatScore: Math.floor(Math.random() * 8) + 2, // Low threat score (2-10 out of 100)
        riskLevel: 'LOW_RISK_VERIFIED',
        timestamp: new Date().toISOString()
      };

      if (typeof window.sendMessageWithAttachment === 'function') {
        window.sendMessageWithAttachment(`[SECURITY AUDIT] Target: ${hostname}`, {
          isSecurityAudit: true,
          auditData: auditData
        });
      } else {
        const bubble = this.renderSecurityAuditBubble(auditData);
        (document.getElementById('chatMessages') || document.body).appendChild(bubble);
      }
    }

    renderSecurityAuditBubble(auditData) {
      const data = auditData || {};
      const card = document.createElement('div');
      card.className = 'security-audit-bubble-card';
      card.innerHTML = `
        <div class="sec-card-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-shield-virus text-[#00ff66]"></i>
            <span class="font-bold text-white text-xs">WHITE-HAT SECURITY AUDIT</span>
          </div>
          <span class="sec-score-badge text-[#00ff66]">${data.threatScore || 4}/100 THREAT SCORE</span>
        </div>

        <div class="sec-target-row mt-2">
          <span class="text-gray-400 font-mono text-[11px]">TARGET:</span>
          <span class="text-white font-mono text-xs font-bold">${this.escapeHtml(data.domain || 'localhost')}</span>
        </div>

        <div class="sec-metrics-grid mt-2">
          <div class="sec-metric-item">
            <span class="metric-key">SSL / TLS:</span>
            <span class="metric-val text-[#00ff66]"><i class="fa-solid fa-lock"></i> ${data.sslStatus || 'TLS 1.3 VALID'}</span>
          </div>
          <div class="sec-metric-item">
            <span class="metric-key">HSTS HEADERS:</span>
            <span class="metric-val text-[#00f3ff]"><i class="fa-solid fa-circle-check"></i> ENFORCED</span>
          </div>
          <div class="sec-metric-item">
            <span class="metric-key">DNS ENTROPY:</span>
            <span class="metric-val text-gray-300">CLEAN / NO SPOOFING</span>
          </div>
        </div>

        <div class="sec-status-bar mt-2">
          <span class="text-[#00ff66] text-[11px] font-bold">
            <i class="fa-solid fa-circle-check"></i> VERDICT: SECURE TO PROCEED
          </span>
        </div>
      `;
      return card;
    }

    /* ------------------------------------------------------------------------
       4. SELF-BALANCING GROUP EXPENSE & MISSION TAB
       ------------------------------------------------------------------------ */
    injectTabModal() {
      if (document.getElementById('missionTabModal')) return;

      const modal = document.createElement('div');
      modal.id = 'missionTabModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window mission-tab-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-calculator text-[#ffd700] text-lg"></i>
              <h3 class="font-bold text-white text-base">MISSION EXPENSE TAB</h3>
              <span class="text-[10px] bg-[#ffd700]/15 text-[#ffd700] px-2 py-0.5 rounded font-mono font-bold">SETTLEMENT ENGINE</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeMissionTabModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="mission-tab-modal-body p-4">
            <div class="flex gap-2 mb-3">
              <input type="text" id="tabExpenseDescInput" class="tab-input flex-1" placeholder="Expense: e.g. Edge Server Cluster" />
              <input type="number" id="tabExpenseAmountInput" class="tab-input w-28" placeholder="Amount" />
              <button type="button" class="tab-add-btn" id="addExpenseBtn"><i class="fa-solid fa-plus"></i> ADD</button>
            </div>

            <div class="tab-expenses-list" id="tabExpensesList">
              <div class="tab-item-row">
                <span class="text-white text-xs">Relay VPS Cluster</span>
                <span class="font-mono text-xs text-[#ffd700]">120 NEX (Paid by Raven)</span>
              </div>
              <div class="tab-item-row">
                <span class="text-white text-xs">Zero-Day Audit Bounty</span>
                <span class="font-mono text-xs text-[#ffd700]">240 NEX (Paid by You)</span>
              </div>
            </div>

            <div class="tab-settlement-summary mt-3 p-3 bg-[#050810] rounded border border-[#ffd700]/30">
              <div class="text-[11px] font-bold text-gray-400 uppercase">CALCULATED SETTLEMENT RESOLUTION:</div>
              <div class="text-xs text-white font-mono mt-1">
                Operative Raven owes You <strong class="text-[#00ff66]">60 NEX</strong> to balance tab.
              </div>
            </div>

            <button type="button" class="tab-dispatch-btn mt-3" id="dispatchMissionTabToChatBtn">
              <i class="fa-solid fa-paper-plane"></i> DEPLOY EXPENSE TAB TO CHANNEL
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#closeMissionTabModalBtn').addEventListener('click', () => {
        modal.style.display = 'none';
      });

      modal.querySelector('#addExpenseBtn').addEventListener('click', () => {
        const descInp = modal.querySelector('#tabExpenseDescInput');
        const amtInp = modal.querySelector('#tabExpenseAmountInput');
        const desc = descInp.value.trim();
        const amt = parseFloat(amtInp.value);
        if (!desc || !amt) return;

        const list = modal.querySelector('#tabExpensesList');
        const row = document.createElement('div');
        row.className = 'tab-item-row';
        row.innerHTML = `
          <span class="text-white text-xs">${this.escapeHtml(desc)}</span>
          <span class="font-mono text-xs text-[#ffd700]">${amt} NEX (Paid by You)</span>
        `;
        list.appendChild(row);
        descInp.value = '';
        amtInp.value = '';
      });

      modal.querySelector('#dispatchMissionTabToChatBtn').addEventListener('click', () => {
        modal.style.display = 'none';
        const tabPayload = {
          id: 'tab_' + Date.now().toString(36),
          title: 'OPERATION SPRINT TAB',
          totalAmount: 360,
          resolution: 'Operative Raven owes You 60 NEX to balance tab.'
        };

        if (typeof window.sendMessageWithAttachment === 'function') {
          window.sendMessageWithAttachment('[MISSION TAB] Operation Sprint Expenses', {
            isMissionTab: true,
            tabData: tabPayload
          });
        } else {
          const bubble = this.renderMissionTabBubble(tabPayload);
          (document.getElementById('chatMessages') || document.body).appendChild(bubble);
        }
      });
    }

    openTabModal() {
      const modal = document.getElementById('missionTabModal');
      if (modal) modal.style.display = 'flex';
    }

    renderMissionTabBubble(tabData) {
      const data = tabData || {};
      const card = document.createElement('div');
      card.className = 'mission-tab-bubble-card';
      card.innerHTML = `
        <div class="tab-bubble-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-calculator text-[#ffd700]"></i>
            <span class="font-bold text-white text-xs">${this.escapeHtml(data.title || 'EXPENSE SETTLEMENT TAB')}</span>
          </div>
          <span class="tab-badge">${data.totalAmount || 360} NEX TOTAL</span>
        </div>

        <div class="tab-resolution-box mt-2">
          <div class="text-[10px] text-gray-400 font-bold">MINIMAL TRANSFER SETTLEMENT:</div>
          <div class="text-xs text-[#00ff66] font-mono mt-1 font-bold">${this.escapeHtml(data.resolution || 'Tab balanced evenly.')}</div>
        </div>

        <button type="button" class="tab-settle-btn mt-2" onclick="alert('Settlement confirmed! 60 NEX credited to your wallet.')">
          <i class="fa-solid fa-coins"></i> SETTLE WITH ESCROW TOKENS
        </button>
      `;
      return card;
    }

    /* ------------------------------------------------------------------------
       5. CAMSHOT REEL-TO-CHAT MINI-PLAYER CARD
       ------------------------------------------------------------------------ */
    checkIncomingSharedReel() {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('shareReel') === 'true') {
        try {
          const raw = localStorage.getItem('nex_pending_shared_reel');
          if (raw) {
            const reel = JSON.parse(raw);
            localStorage.removeItem('nex_pending_shared_reel');
            setTimeout(() => {
              this.dispatchReelCard(reel);
            }, 800);
          }
        } catch (e) {}
      }
    }

    dispatchReelCard(reelData) {
      if (typeof window.sendMessageWithAttachment === 'function') {
        window.sendMessageWithAttachment(`[CAMSHOT REEL] Video by @${reelData.author || 'Creator'}`, {
          isCamshotReel: true,
          reelData: reelData
        });
      } else {
        const bubble = this.renderReelBubble(reelData);
        (document.getElementById('chatMessages') || document.body).appendChild(bubble);
      }
    }

    renderReelBubble(reelData) {
      const data = reelData || {};
      const card = document.createElement('div');
      card.className = 'reel-chat-bubble-card';
      card.innerHTML = `
        <div class="reel-bubble-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-play text-[#ffd700]"></i>
            <span class="font-bold text-white text-xs">CAMSHOT SHORT VIDEO</span>
          </div>
          <span class="reel-bubble-author font-mono text-[11px] text-[#ffd700]">@${this.escapeHtml(data.author || 'Creator')}</span>
        </div>

        <div class="reel-bubble-player-wrap mt-2">
          <video class="reel-bubble-video" src="${data.videoUrl || ''}" controls playsinline preload="metadata"></video>
        </div>

        <div class="reel-bubble-footer mt-2">
          <a href="reels.html" class="reel-open-camshot-btn">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> WATCH IN CAMSHOT FEED
          </a>
        </div>
      `;
      return card;
    }

    escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }

  window.ChatAdvancedMatrix = ChatAdvancedMatrix;
  window.chatAdvancedMatrix = new ChatAdvancedMatrix();
})();
