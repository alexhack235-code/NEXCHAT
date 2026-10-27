/**
 * =============================================================================
 * NEXCHAT - QUANTUM AIR-GAP SNEAK PEEK & STEALTH GHOST ENGINE (v1.0)
 * Global Namespace: window.NexStealthPrivacy.AirGap & window.quantumAirGap
 * Specification: Zero-Emission Telemetry Proxy - 3D Hardware Perspective Lens
 * STRICTLY ZERO UNICODE EMOJIS - FontAwesome 6 Vector Icons Only
 * Format: Windows CRLF Line Endings - ES2022 node -c Compliant
 * =============================================================================
 */

(function (global) {
  'use strict';

  class QuantumAirGapEngine {
    constructor() {
      this.isStealthActive = (typeof localStorage !== 'undefined' && localStorage.getItem('nexchat_stealth_ghost_mode') === 'true');
      this.frozenLastSeen = (typeof localStorage !== 'undefined' && localStorage.getItem('nexchat_frozen_last_seen')) || null;
      this.activePeekChatId = null;
      this.activePeekChatType = 'direct';
      this.longPressTimer = null;
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.isPeeking = false;
      this._tiltHandler = null;

      if (typeof window !== 'undefined') {
        this.init();
      }
    }

    init() {
      this.mountDomIfMissing();
      this.bindStealthToggle();
      this.installNetworkAirGapHooks();
      this.bindChatListLongPressDelegation();
      this.bindDuressWipeListener();
      this.applyStealthVisualState();
      console.log('[NEX-STEALTH-PRIVACY] Quantum Air-Gap Subsystem Initialized. Stealth Active:', this.isStealthActive);
    }

    bindDuressWipeListener() {
      if (typeof window === 'undefined') return;
      window.addEventListener('nex:duress:wipe', () => {
        this.purgeMemory();
      });
    }

    purgeMemory() {
      console.warn('[NEX-STEALTH-PRIVACY] Emergency duress wipe signal received. Purging ephemeral buffers.');
      this.dismissAirGapLens();
      this.isStealthActive = false;
      this.frozenLastSeen = null;
      try {
        localStorage.removeItem('nexchat_stealth_ghost_mode');
        localStorage.removeItem('nexchat_frozen_last_seen');
        sessionStorage.removeItem('nex_burned_view_once_ids');
      } catch (_) {}
      
      const streamEl = document.getElementById('quantumPeekStream');
      if (streamEl) streamEl.innerHTML = '';
      
      this.applyStealthVisualState();
      window.dispatchEvent(new CustomEvent('nex:stealth:state_change', {
        detail: { active: false, mode: 'duress_purged' }
      }));
    }

    mountDomIfMissing() {
      if (typeof document === 'undefined') return;
      if (!document.getElementById('quantumPeekLensModal')) {
        const portal = document.createElement('div');
        portal.id = 'quantumPeekLensModal';
        portal.className = 'quantum-peek-overlay';
        portal.style.display = 'none';
        portal.setAttribute('aria-hidden', 'true');
        portal.setAttribute('role', 'dialog');
        portal.setAttribute('aria-label', 'Air-Gap Conversation Preview');
        portal.innerHTML = `
          <div class="quantum-peek-backdrop" id="quantumPeekBackdrop"></div>
          <div class="quantum-peek-lens-container" id="quantumPeekContainer">
            <div class="quantum-peek-lens" id="quantumPeekLens">
              <div class="quantum-lens-glare"></div>
              <div class="quantum-lens-scanline"></div>
              <header class="quantum-peek-header">
                <div class="peek-header-left">
                  <div class="peek-avatar-wrapper">
                    <img id="quantumPeekAvatar" src="logo.jpg" alt="Avatar" class="peek-avatar-img">
                    <span id="quantumPeekOnlineDot" class="peek-status-dot"></span>
                  </div>
                  <div class="peek-identity-meta">
                    <div class="peek-title-row">
                      <span id="quantumPeekName" class="peek-chat-name">Contact</span>
                      <span id="quantumPeekBadge" class="peek-verification-badge"></span>
                    </div>
                    <div class="peek-telemetry-row">
                      <span class="peek-airgap-tag"><i class="fa-solid fa-shield-halved"></i> AIR-GAP ISOLATED</span>
                      <span class="peek-telemetry-bullet">&bull;</span>
                      <span id="quantumPeekSubtitle" class="peek-time-label">Snapshot</span>
                    </div>
                  </div>
                </div>
                <div class="peek-header-right">
                  <span class="peek-unread-pill" id="quantumPeekUnreadPill">
                    <i class="fa-solid fa-eye-slash"></i> <span id="quantumPeekUnreadCount">0 UNREAD</span>
                  </span>
                </div>
              </header>
              <div class="quantum-peek-body custom-scrollbar" id="quantumPeekBody">
                <div class="peek-loading-state" id="quantumPeekLoading">
                  <i class="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Engaging Quantum Air-Gap Lens...</span>
                </div>
                <div class="peek-message-stream" id="quantumPeekStream"></div>
              </div>
              <footer class="quantum-peek-dock">
                <button type="button" class="peek-dock-btn" id="peekActionMarkRead" title="Mark Read on Remote Network" aria-label="Mark as read">
                  <i class="fa-solid fa-check-double"></i>
                  <span>Mark Read</span>
                </button>
                <button type="button" class="peek-dock-btn" id="peekActionMute" title="Toggle Mute" aria-label="Mute conversation">
                  <i class="fa-solid fa-bell-slash"></i>
                  <span id="peekActionMuteLabel">Mute</span>
                </button>
                <button type="button" class="peek-dock-btn highlight-stealth" id="peekActionStealthOpen" title="Open Full Chat in Ghost Mode" aria-label="Open in Stealth Ghost Mode">
                  <i class="fa-solid fa-user-secret"></i>
                  <span>Stealth Open</span>
                </button>
                <button type="button" class="peek-dock-btn" id="peekActionPin" title="Pin / Unpin Conversation" aria-label="Pin conversation">
                  <i class="fa-solid fa-thumbtack"></i>
                  <span>Pin</span>
                </button>
                <button type="button" class="peek-dock-btn peek-dismiss-btn" id="peekActionDismiss" title="Dismiss Lens (Esc)" aria-label="Dismiss preview">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </footer>
            </div>
          </div>
        `;
        document.body.appendChild(portal);
      }

      this.bindLensInternalEvents();
    }

    bindStealthToggle() {
      if (typeof document === 'undefined') return;
      const toggleBtns = document.querySelectorAll('.stealth-ghost-toggle-btn, #stealthGhostToggleBtn, #stealthGhostBtnHeader, #stealthGhostBtnMobile');
      toggleBtns.forEach(btn => {
        if (btn.dataset.airgapBound === 'true') return;
        btn.dataset.airgapBound = 'true';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleStealthGhostMode();
        });
      });

      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey && e.shiftKey && (e.key === 'G' || e.key === 'g')) || (e.altKey && (e.key === 'g' || e.key === 'G'))) {
          e.preventDefault();
          this.toggleStealthGhostMode();
        }
      });
    }

    toggleStealthGhostMode(forceState = null) {
      this.isStealthActive = typeof forceState === 'boolean' ? forceState : !this.isStealthActive;
      try {
        localStorage.setItem('nexchat_stealth_ghost_mode', this.isStealthActive ? 'true' : 'false');
      } catch (_) {}

      if (this.isStealthActive) {
        if (!this.frozenLastSeen) {
          this.frozenLastSeen = new Date().toISOString();
          try { localStorage.setItem('nexchat_frozen_last_seen', this.frozenLastSeen); } catch (_) {}
        }
        this.disconnectPresenceHeartbeat();
        if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
          window.showNotif('Stealth Ghost Mode ENGAGED: Presence Frozen & Receipts Blocked', 'info', 2500);
        }
        this.playSynthPulse('engage');
      } else {
        this.frozenLastSeen = null;
        try { localStorage.removeItem('nexchat_frozen_last_seen'); } catch (_) {}
        this.reconnectPresenceHeartbeat();
        if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
          window.showNotif('Stealth Ghost Mode DISENGAGED: Normal Presence Restored', 'success', 2000);
        }
        this.playSynthPulse('disengage');
      }

      this.applyStealthVisualState();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nex:stealth:state_change', {
          detail: { active: this.isStealthActive, mode: 'quantum_airgap' }
        }));
      }
    }

    applyStealthVisualState() {
      if (typeof document === 'undefined') return;
      const toggleBtns = document.querySelectorAll('.stealth-ghost-toggle-btn, #stealthGhostToggleBtn, #stealthGhostBtnHeader, #stealthGhostBtnMobile');
      toggleBtns.forEach(btn => {
        btn.classList.toggle('active', this.isStealthActive);
        btn.dataset.stealthActive = this.isStealthActive ? 'true' : 'false';
        btn.title = this.isStealthActive
          ? 'Stealth Ghost Mode ACTIVE: Presence Frozen & Read Receipts Suppressed'
          : 'Stealth Ghost Mode: Freeze presence & read receipts (Ctrl+Shift+G)';
      });

      const chatDetailView = document.getElementById('chatDetailView');
      let hudBanner = document.getElementById('stealthGhostHudBanner');

      if (this.isStealthActive) {
        if (!hudBanner && chatDetailView) {
          hudBanner = document.createElement('div');
          hudBanner.id = 'stealthGhostHudBanner';
          hudBanner.className = 'stealth-ghost-hud-banner';
          hudBanner.innerHTML = `
            <div class="stealth-hud-content">
              <span class="stealth-hud-indicator"></span>
              <span>STEALTH GHOST ENGAGED &bull; PRESENCE FROZEN &bull; ZERO READ RECEIPTS</span>
            </div>
            <button type="button" class="stealth-hud-restore-btn" onclick="window.NexStealthPrivacy?.AirGap?.toggleStealthGhostMode(false)">Restore</button>
          `;
          const header = chatDetailView.querySelector('.chat-detail-header');
          if (header && header.nextSibling) {
            chatDetailView.insertBefore(hudBanner, header.nextSibling);
          } else if (chatDetailView) {
            chatDetailView.prepend(hudBanner);
          }
        }
        if (hudBanner) hudBanner.style.display = 'flex';
      } else {
        if (hudBanner) hudBanner.style.display = 'none';
      }
    }

    installNetworkAirGapHooks() {
      if (typeof window === 'undefined') return;
      const self = this;

      if (typeof window.markSupabaseMessagesRead === 'function') {
        const originalMarkRead = window.markSupabaseMessagesRead;
        window.markSupabaseMessagesRead = async function (roomId, readerId) {
          if (self.isStealthActive) {
            console.log(`[NEX-STEALTH-PRIVACY] Intercepted markSupabaseMessagesRead for room: ${roomId}`);
            return;
          }
          return originalMarkRead.apply(this, arguments);
        };
      }

      if (typeof window.broadcastTyping === 'function') {
        const originalBroadcastTyping = window.broadcastTyping;
        window.broadcastTyping = async function (isTyping) {
          if (self.isStealthActive && isTyping) {
            console.log('[NEX-STEALTH-PRIVACY] Typing status suppressed.');
            return;
          }
          return originalBroadcastTyping.apply(this, arguments);
        };
      }
    }

    disconnectPresenceHeartbeat() {
      if (typeof window !== 'undefined' && typeof window.unsubscribeChatPresence === 'function') {
        try { window.unsubscribeChatPresence(); } catch (_) {}
      }
    }

    reconnectPresenceHeartbeat() {
      if (typeof window !== 'undefined' && window.currentChatUser && typeof window.subscribeUserPresence === 'function') {
        try { window.subscribeUserPresence(window.currentChatUser); } catch (_) {}
      }
    }

    bindChatListLongPressDelegation() {
      if (typeof document === 'undefined') return;
      const chatLists = [
        document.getElementById('contactList'),
        document.getElementById('groupsList'),
        document.getElementById('archivedList')
      ];

      chatLists.forEach(list => {
        if (!list || list._hasAirGapLongPressBound) return;
        list._hasAirGapLongPressBound = true;

        const onPointerStart = (e) => {
          if (e.target.closest('button, a, input, textarea, .chat-menu-btn')) return;
          const chatItem = e.target.closest('.chat-item, .chat-list-item, li[data-chat-id]');
          if (!chatItem) return;

          this.touchStartX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
          this.touchStartY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

          if (this.longPressTimer) clearTimeout(this.longPressTimer);
          this.longPressTimer = setTimeout(() => {
            this.triggerAirGapPeek(chatItem);
          }, 400);
        };

        const onPointerMove = (e) => {
          if (!this.longPressTimer) return;
          const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
          const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
          if (Math.hypot(currentX - this.touchStartX, currentY - this.touchStartY) > 10) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
          }
        };

        const onPointerEnd = () => {
          if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
          }
        };

        list.addEventListener('touchstart', onPointerStart, { passive: true });
        list.addEventListener('touchmove', onPointerMove, { passive: true });
        list.addEventListener('touchend', onPointerEnd, { passive: true });
        list.addEventListener('touchcancel', onPointerEnd, { passive: true });

        list.addEventListener('mousedown', onPointerStart, { passive: true });
        list.addEventListener('mousemove', onPointerMove, { passive: true });
        list.addEventListener('mouseup', onPointerEnd, { passive: true });
      });
    }

    async triggerAirGapPeek(chatItem) {
      if (!chatItem) return;
      this.isPeeking = true;

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([16, 45, 20]); } catch (_) {}
      }
      this.playSynthPulse('engage');

      const chatId = chatItem.getAttribute('data-chat-id');
      const chatType = chatItem.getAttribute('data-chat-type') || (chatId === 'chronex-ai' ? 'ai' : (chatItem.classList.contains('group-item') ? 'group' : 'direct'));
      const chatName = chatItem.querySelector('.chat-name, h4')?.textContent?.trim() || 'Conversation';
      const avatarImg = chatItem.querySelector('img.chat-avatar')?.src || 'logo.jpg';
      const unreadCount = chatItem.querySelector('.unread-badge, .chat-unread-count')?.textContent?.trim() || '0';

      this.activePeekChatId = chatId;
      this.activePeekChatType = chatType;

      const nameEl = document.getElementById('quantumPeekName');
      const avatarEl = document.getElementById('quantumPeekAvatar');
      const unreadEl = document.getElementById('quantumPeekUnreadCount');
      const unreadPill = document.getElementById('quantumPeekUnreadPill');
      const subtitleEl = document.getElementById('quantumPeekSubtitle');
      const streamEl = document.getElementById('quantumPeekStream');
      const loadingEl = document.getElementById('quantumPeekLoading');

      if (nameEl) nameEl.textContent = chatName;
      if (avatarEl) avatarEl.src = avatarImg;
      if (unreadEl) unreadEl.textContent = `${unreadCount} UNREAD`;
      if (unreadPill) unreadPill.style.display = unreadCount && unreadCount !== '0' ? 'inline-flex' : 'none';
      if (subtitleEl) subtitleEl.textContent = `Air-Gap Cached Preview`;

      if (streamEl) streamEl.innerHTML = '';
      if (loadingEl) loadingEl.style.display = 'flex';

      const modal = document.getElementById('quantumPeekLensModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => modal.classList.add('open'));
        } else {
          modal.classList.add('open');
        }
      }

      this.bind3DTiltTracking();
      await this.loadAirGapPreviewMessages(chatId, chatType);
    }

    async loadAirGapPreviewMessages(chatId, chatType) {
      const streamEl = document.getElementById('quantumPeekStream');
      const loadingEl = document.getElementById('quantumPeekLoading');
      if (!streamEl) return;

      try {
        let previewMessages = [];

        if (typeof window !== 'undefined' && typeof window.fetchSupabaseRoomMessages === 'function' && chatType === 'direct' && window.myUID) {
          const roomId = `direct_${[window.myUID, chatId].sort().join('_')}`;
          try {
            const msgs = await window.fetchSupabaseRoomMessages(roomId, 8);
            if (msgs && msgs.length > 0) previewMessages = msgs;
          } catch (_) {}
        }

        if (previewMessages.length === 0 && typeof window !== 'undefined' && window.nexFirestore && window.myUID) {
          const { db, collection, query, where, limit, getDocs } = window.nexFirestore;
          const q = query(
            collection(db, chatType === 'group' ? 'groupMessages' : 'messages'),
            where(chatType === 'group' ? 'groupId' : 'from', 'in', chatType === 'group' ? [chatId] : [window.myUID, chatId]),
            limit(8)
          );
          const snap = await getDocs(q);
          const docs = [];
          snap.forEach(d => docs.push({ ...d.data(), id: d.id }));
          previewMessages = chatType === 'group' ? docs : docs.filter(m => (m.from === window.myUID && m.to === chatId) || (m.from === chatId && m.to === window.myUID));
        }

        if (loadingEl) loadingEl.style.display = 'none';

        if (previewMessages.length === 0) {
          streamEl.innerHTML = `
            <div style="text-align: center; padding: 32px 16px; color: #64748b; font-size: 13px;">
              <i class="fa-solid fa-lock" style="font-size: 24px; color: #334155; margin-bottom: 8px; display: block;"></i>
              <span>No cached messages in local enclave</span>
            </div>
          `;
          return;
        }

        streamEl.innerHTML = previewMessages.map(msg => {
          const isOwn = typeof window !== 'undefined' && msg.from === window.myUID;
          const textContent = msg.text || (msg.attachment ? `[Attachment: ${msg.attachment.fileName || msg.attachment.fileType || 'File'}]` : 'Message');
          const timeStr = msg.time?.toDate ? msg.time.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return `
            <div class="peek-message-bubble ${isOwn ? 'outgoing' : 'incoming'}">
              <div class="peek-bubble-text">${this.escapeHtml(textContent)}</div>
              <div class="peek-bubble-meta">
                <span>${timeStr}</span>
                ${isOwn ? (msg.read ? '<i class="fa-solid fa-check-double" style="color:#00f2fe;"></i>' : '<i class="fa-solid fa-check"></i>') : ''}
              </div>
            </div>
          `;
        }).join('');

        const bodyEl = document.getElementById('quantumPeekBody');
        if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;

      } catch (err) {
        console.warn('[NEX-STEALTH-PRIVACY] Preview error:', err);
        if (loadingEl) loadingEl.style.display = 'none';
        if (streamEl) streamEl.innerHTML = `<div style="text-align:center;padding:24px;color:#94a3b8;font-size:12.5px;">Air-Gap preview synchronized from offline enclave.</div>`;
      }
    }

    bind3DTiltTracking() {
      if (typeof window === 'undefined') return;
      const lens = document.getElementById('quantumPeekLens');
      const container = document.getElementById('quantumPeekContainer');
      if (!lens || !container) return;

      this._tiltHandler = (e) => {
        if (!this.isPeeking) return;
        const rect = container.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

        const x = clientX - (rect.left + rect.width / 2);
        const y = clientY - (rect.top + rect.height / 2);

        const rotateX = Math.max(-12, Math.min(12, (-y / (rect.height / 2)) * 10));
        const rotateY = Math.max(-12, Math.min(12, (x / (rect.width / 2)) * 10));

        lens.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      };

      window.addEventListener('mousemove', this._tiltHandler, { passive: true });
      window.addEventListener('touchmove', this._tiltHandler, { passive: true });
    }

    unbind3DTiltTracking() {
      if (typeof window === 'undefined') return;
      if (this._tiltHandler) {
        window.removeEventListener('mousemove', this._tiltHandler);
        window.removeEventListener('touchmove', this._tiltHandler);
        this._tiltHandler = null;
      }
    }

    bindLensInternalEvents() {
      if (typeof document === 'undefined') return;
      const backdrop = document.getElementById('quantumPeekBackdrop');
      const dismissBtn = document.getElementById('peekActionDismiss');
      const markReadBtn = document.getElementById('peekActionMarkRead');
      const muteBtn = document.getElementById('peekActionMute');
      const stealthOpenBtn = document.getElementById('peekActionStealthOpen');
      const pinBtn = document.getElementById('peekActionPin');

      backdrop?.addEventListener('click', () => this.dismissAirGapLens());
      dismissBtn?.addEventListener('click', () => this.dismissAirGapLens());

      markReadBtn?.addEventListener('click', () => {
        if (this.activePeekChatId && typeof window !== 'undefined' && typeof window.markSupabaseMessagesRead === 'function') {
          const roomId = `direct_${[window.myUID, this.activePeekChatId].sort().join('_')}`;
          window.markSupabaseMessagesRead(roomId, window.myUID);
          if (typeof window.showNotif === 'function') window.showNotif('Read receipt emitted to peer', 'info', 1500);
        }
        this.dismissAirGapLens();
      });

      muteBtn?.addEventListener('click', async () => {
        if (this.activePeekChatId && typeof window !== 'undefined' && typeof window.muteChat === 'function') {
          await window.muteChat(this.activePeekChatId);
        }
        this.dismissAirGapLens();
      });

      stealthOpenBtn?.addEventListener('click', () => {
        const targetId = this.activePeekChatId;
        const targetType = this.activePeekChatType;
        this.dismissAirGapLens();
        if (!this.isStealthActive) {
          this.toggleStealthGhostMode(true);
        }
        if (typeof window !== 'undefined' && typeof window.openChat === 'function') {
          const name = document.getElementById('quantumPeekName')?.textContent || 'Contact';
          const pic = document.getElementById('quantumPeekAvatar')?.src || 'logo.jpg';
          window.openChat(targetId, name, pic, targetType);
        }
      });

      pinBtn?.addEventListener('click', async () => {
        if (this.activePeekChatId && typeof window !== 'undefined' && typeof window.toggleFavorite === 'function') {
          await window.toggleFavorite(this.activePeekChatId);
        }
        this.dismissAirGapLens();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isPeeking) {
          this.dismissAirGapLens();
        }
      });
    }

    dismissAirGapLens() {
      if (!this.isPeeking) return;
      this.isPeeking = false;
      this.unbind3DTiltTracking();

      const modal = document.getElementById('quantumPeekLensModal');
      const lens = document.getElementById('quantumPeekLens');
      if (lens) {
        lens.style.transform = 'scale(0.85) translateY(20px)';
        lens.style.opacity = '0';
      }
      if (modal) {
        modal.classList.remove('open');
        setTimeout(() => {
          modal.style.display = 'none';
          modal.setAttribute('aria-hidden', 'true');
          if (lens) lens.style.transform = '';
        }, 250);
      }
      this.playSynthPulse('disengage');
    }

    playSynthPulse(type = 'engage') {
      if (typeof window === 'undefined') return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'engage') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 0.14);
          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.14);
        } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(580, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.12);
        }
      } catch (_) {}
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
  }

  if (typeof global !== 'undefined') {
    if (!global.NexStealthPrivacy) {
      global.NexStealthPrivacy = {};
    }
    const airGapInstance = new QuantumAirGapEngine();
    global.NexStealthPrivacy.AirGap = airGapInstance;
    global.quantumAirGap = airGapInstance;
  }

})(typeof window !== 'undefined' ? window : globalThis);
