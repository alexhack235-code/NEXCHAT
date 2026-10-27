/**
 * NEXCHAT - TACTICAL MULTI-MESSAGE PINBOARD MATRIX RUNTIME
 * Architecture: Multi-Item Deck • Category Tags • Task Audit Stamps • Progress Bar
 * Global Namespace: window.NexPinboardMatrix
 * Standard: Strictly 0 Unicode Emojis (FontAwesome 6 Vector Icons Only)
 */

(function (window) {
  'use strict';

  class TacticalPinboardMatrix {
    constructor() {
      this.isExpanded = false;
      this.activeFilter = 'all';
      this.currentChatId = null;
      this.currentChatType = 'direct';
      this.pins = [];
      this.pendingPinPayload = null;
      this.tickerInterval = null;

      this.init();
    }

    init() {
      console.log('[NEX-PINBOARD] Booting Tactical Pinboard Matrix Engine...');
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
      this.setupDuressListener();
    }

    bindDOM() {
      // Summary Bar Trigger
      document.getElementById('nexPinboardToggleTrigger')?.addEventListener('click', () => this.toggleDeck());
      document.getElementById('nexPinboardToggleBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDeck();
      });

      // Filter Pills
      document.querySelectorAll('.pin-filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.pin-filter-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeFilter = btn.dataset.filter || 'all';
          this.renderDeckCards();
        });
      });

      // Clear completed tasks
      document.getElementById('btnPinboardClearCompleted')?.addEventListener('click', () => {
        this.purgeCompletedTasks();
      });

      // Pin Modal Category Selection
      document.querySelectorAll('.pin-cat-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.pin-cat-opt').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const cat = btn.dataset.cat;
          const deadlineRow = document.getElementById('pinDeadlinePickerRow');
          if (deadlineRow) {
            deadlineRow.style.display = (cat === 'deadline') ? 'flex' : 'none';
          }
        });
      });

      // Confirm Pin Button
      document.getElementById('btnConfirmPinMessage')?.addEventListener('click', () => {
        this.confirmPinFromModal();
      });

      // Close Modal Button
      document.getElementById('closePinModalBtn')?.addEventListener('click', () => {
        this.closePinModal();
      });

      // Listen for message stream navigation
      this.startCountdownTicker();
    }

    setupDuressListener() {
      window.addEventListener('nex:duress:wipe', () => {
        this.clearAllPins();
      });
    }

    getStorageKey(chatId) {
      return `nex_pinboard_${chatId || window.currentChatUser || 'general'}`;
    }

    loadPinsForChat(chatId, chatType = 'direct') {
      this.currentChatId = chatId || window.currentChatUser || 'general';
      this.currentChatType = chatType || window.currentChatType || 'direct';

      try {
        const raw = localStorage.getItem(this.getStorageKey(this.currentChatId));
        this.pins = raw ? JSON.parse(raw) : [];
      } catch (_) {
        this.pins = [];
      }

      this.render();
      this.syncFirestore();
    }

    savePins() {
      if (!this.currentChatId) return;
      try {
        localStorage.setItem(this.getStorageKey(this.currentChatId), JSON.stringify(this.pins));
      } catch (_) {}
      this.render();
      this.commitFirestore();
    }

    openPinModal(msgPayload) {
      this.pendingPinPayload = msgPayload;
      const modal = document.getElementById('nexPinSelectorModal');
      const preview = document.getElementById('pinModalMessagePreview');

      if (preview) {
        preview.textContent = msgPayload.text || '[Media / Attachment]';
      }

      if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
      }
    }

    closePinModal() {
      const modal = document.getElementById('nexPinSelectorModal');
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
      this.pendingPinPayload = null;
    }

    confirmPinFromModal() {
      if (!this.pendingPinPayload) return;

      const activeCatBtn = document.querySelector('.pin-cat-opt.active');
      const category = activeCatBtn ? activeCatBtn.dataset.cat : 'task';
      const deadlineHours = parseInt(document.getElementById('pinDeadlineHoursSelect')?.value || '24', 10);

      const isTask = category === 'task';
      const deadlineEpoch = category === 'deadline' ? (Date.now() + deadlineHours * 3600 * 1000) : null;

      this.addPin({
        id: this.pendingPinPayload.id || `pin_${Date.now()}`,
        text: this.pendingPinPayload.text || '[Media Item]',
        senderName: this.pendingPinPayload.senderName || 'User',
        senderUid: this.pendingPinPayload.senderUid || 'anon',
        category: category,
        isTask: isTask,
        isCompleted: false,
        deadlineEpochMs: deadlineEpoch,
        pinnedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pinnedByName: window.myUsername || 'Operator'
      });

      this.closePinModal();
      if (typeof window.showNotif === 'function') {
        window.showNotif(`Message pinned as [${category.toUpperCase()}]`, 'success', 2500);
      }
    }

    addPin(pinItem) {
      // Remove duplicate if already pinned
      const existingIdx = this.pins.findIndex(p => p.id === pinItem.id);
      if (existingIdx !== -1) {
        this.pins.splice(existingIdx, 1);
      }

      this.pins.unshift(pinItem);
      this.savePins();

      if (typeof window.playLuxuryPopSound === 'function') {
        window.playLuxuryPopSound();
      }

      window.dispatchEvent(new CustomEvent('nex:pinboard:item_pinned', { detail: pinItem }));
    }

    unpin(pinId) {
      const idx = this.pins.findIndex(p => p.id === pinId);
      if (idx !== -1) {
        const removed = this.pins.splice(idx, 1)[0];
        this.savePins();
        window.dispatchEvent(new CustomEvent('nex:pinboard:item_unpinned', { detail: removed }));
        if (typeof window.showNotif === 'function') {
          window.showNotif('Item unpinned from matrix', 'info', 1500);
        }
      }
    }

    toggleTask(pinId) {
      const item = this.pins.find(p => p.id === pinId);
      if (!item || !item.isTask) return;

      item.isCompleted = !item.isCompleted;
      if (item.isCompleted) {
        item.completedByName = window.myUsername || 'Operator';
        item.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        item.completedByName = null;
        item.completedAt = null;
      }

      this.savePins();
      if (typeof window.playLuxuryChimeSound === 'function' && item.isCompleted) {
        window.playLuxuryChimeSound();
      }

      window.dispatchEvent(new CustomEvent('nex:pinboard:task_toggled', { detail: item }));
    }

    purgeCompletedTasks() {
      const beforeCount = this.pins.length;
      this.pins = this.pins.filter(p => !(p.isTask && p.isCompleted));
      if (this.pins.length !== beforeCount) {
        this.savePins();
        if (typeof window.showNotif === 'function') {
          window.showNotif('Completed tasks purged from pinboard', 'info', 2000);
        }
      }
    }

    toggleDeck(forcedState = null) {
      this.isExpanded = forcedState !== null ? forcedState : !this.isExpanded;
      const deck = document.getElementById('nexTacticalPinboardDeck');
      const icon = document.getElementById('nexPinboardChevronIcon');

      if (deck) {
        deck.style.display = this.isExpanded ? 'flex' : 'none';
      }
      if (icon) {
        icon.className = this.isExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
      }
    }

    render() {
      const rootWrap = document.getElementById('pinnedMessagesBar');
      const countEl = document.getElementById('pinboardSummaryCountText');
      if (!rootWrap) return;

      if (this.pins.length === 0) {
        rootWrap.style.display = 'none';
        this.toggleDeck(false);
        return;
      }

      rootWrap.style.display = 'flex';
      if (countEl) {
        countEl.textContent = `${this.pins.length} PINNED`;
      }

      this.updateProgressMetric();
      this.updateFilterCounts();
      this.renderDeckCards();
    }

    updateProgressMetric() {
      const progressDock = document.getElementById('pinboardProgressDock');
      const percentEl = document.getElementById('pinboardProgressPercent');
      const fillEl = document.getElementById('pinboardProgressFill');

      const tasks = this.pins.filter(p => p.isTask);
      if (tasks.length === 0) {
        if (progressDock) progressDock.style.display = 'none';
        return;
      }

      if (progressDock) progressDock.style.display = 'flex';
      const completed = tasks.filter(p => p.isCompleted).length;
      const pct = Math.round((completed / tasks.length) * 100);

      if (percentEl) percentEl.textContent = `${pct}% (${completed}/${tasks.length})`;
      if (fillEl) fillEl.style.width = `${pct}%`;
    }

    updateFilterCounts() {
      const counts = { all: this.pins.length, urgent: 0, task: 0, secret: 0, finance: 0, deadline: 0 };
      this.pins.forEach(p => {
        if (counts[p.category] !== undefined) counts[p.category]++;
      });

      const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setTxt('countFilterAll', counts.all);
      setTxt('countFilterUrgent', counts.urgent);
      setTxt('countFilterTask', counts.task);
      setTxt('countFilterSecret', counts.secret);
      setTxt('countFilterFinance', counts.finance);
      setTxt('countFilterDeadline', counts.deadline);
    }

    renderDeckCards() {
      const container = document.getElementById('pinboardCardsViewport');
      if (!container) return;

      const filtered = this.activeFilter === 'all'
        ? this.pins
        : this.pins.filter(p => p.category === this.activeFilter);

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; color: #64748b; font-size: 12px; padding: 24px;">
            <i class="fa-solid fa-thumbtack" style="font-size: 20px; opacity: 0.3; margin-bottom: 6px; display: block;"></i>
            <span>No pinned messages under this classification tag.</span>
          </div>
        `;
        return;
      }

      const categoryIcons = {
        urgent: 'fa-triangle-exclamation',
        task: 'fa-list-check',
        secret: 'fa-key',
        finance: 'fa-coins',
        deadline: 'fa-hourglass-half'
      };

      container.innerHTML = filtered.map(item => {
        const icon = categoryIcons[item.category] || 'fa-thumbtack';
        const isCompleted = item.isTask && item.isCompleted;

        let bodyMarkup = '';
        if (item.isTask) {
          bodyMarkup = `
            <div class="pin-task-row">
              <div class="pin-task-check" data-action="toggle-task" data-id="${item.id}" title="Toggle Task Completion">
                <i class="fa-solid fa-check"></i>
              </div>
              <div class="pin-card-body">${this.escapeHtml(item.text)}</div>
            </div>
          `;
        } else {
          bodyMarkup = `<div class="pin-card-body">${this.escapeHtml(item.text)}</div>`;
        }

        let auditStamp = '';
        if (isCompleted && item.completedByName) {
          auditStamp = `
            <div class="pin-audit-stamp">
              <i class="fa-solid fa-circle-check"></i>
              <span>Checked off by @${this.escapeHtml(item.completedByName)} at ${item.completedAt}</span>
            </div>
          `;
        }

        let deadlineTicker = '';
        if (item.category === 'deadline' && item.deadlineEpochMs) {
          const remainingSec = Math.max(0, Math.floor((item.deadlineEpochMs - Date.now()) / 1000));
          const h = String(Math.floor(remainingSec / 3600)).padStart(2, '0');
          const m = String(Math.floor((remainingSec % 3600) / 60)).padStart(2, '0');
          const s = String(remainingSec % 60).padStart(2, '0');
          deadlineTicker = `
            <div class="pin-deadline-ticker" id="ticker-${item.id}">
              <i class="fa-solid fa-stopwatch"></i>
              <span>T-MINUS ${h}:${m}:${s}</span>
            </div>
          `;
        }

        return `
          <div class="pin-tactical-card cat-${item.category} ${isCompleted ? 'completed' : ''}" id="pincard-${item.id}">
            <div class="pin-card-header">
              <span class="pin-category-badge ${item.category}">
                <i class="fa-solid ${icon}"></i> ${item.category.toUpperCase()}
              </span>
              <span class="pin-author-meta">@${this.escapeHtml(item.senderName)} &bull; ${item.pinnedAt}</span>
            </div>
            ${bodyMarkup}
            ${auditStamp}
            ${deadlineTicker}
            <div class="pin-card-footer">
              <button type="button" class="pin-act-btn" data-action="locate-msg" data-id="${item.id}" title="Jump to Message in Stream">
                <i class="fa-solid fa-arrow-turn-down"></i> Locate
              </button>
              <button type="button" class="pin-act-btn" data-action="copy-pin" data-text="${this.escapeHtml(item.text)}" title="Copy Message Text">
                <i class="fa-solid fa-copy"></i>
              </button>
              <button type="button" class="pin-act-btn delete" data-action="unpin-msg" data-id="${item.id}" title="Unpin from Matrix">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Bind card interactions
      container.querySelectorAll('[data-action="toggle-task"]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleTask(el.dataset.id);
        });
      });

      container.querySelectorAll('[data-action="locate-msg"]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.locateMessageInStream(el.dataset.id);
        });
      });

      container.querySelectorAll('[data-action="copy-pin"]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(el.dataset.text || '');
          if (typeof window.showNotif === 'function') window.showNotif('Pinned text copied', 'success', 1500);
        });
      });

      container.querySelectorAll('[data-action="unpin-msg"]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.unpin(el.dataset.id);
        });
      });
    }

    locateMessageInStream(msgId) {
      const wrapper = document.getElementById(`msg-wrapper-${msgId}`) ||
                      document.getElementById(`wrapper-${msgId}`) ||
                      document.querySelector(`[data-doc-id="${msgId}"]`);
      if (wrapper) {
        this.toggleDeck(false); // Collapse deck to view message
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        wrapper.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease';
        wrapper.style.boxShadow = '0 0 25px rgba(0, 242, 254, 0.8)';
        setTimeout(() => { wrapper.style.boxShadow = ''; }, 2000);
      } else {
        if (typeof window.showNotif === 'function') {
          window.showNotif('Target message is archived earlier in conversation history', 'info', 2500);
        }
      }
    }

    startCountdownTicker() {
      if (this.tickerInterval) clearInterval(this.tickerInterval);
      this.tickerInterval = setInterval(() => {
        const deadlines = this.pins.filter(p => p.category === 'deadline' && p.deadlineEpochMs);
        if (deadlines.length === 0) return;

        deadlines.forEach(item => {
          const tickerEl = document.getElementById(`ticker-${item.id}`);
          if (!tickerEl) return;
          const remainingSec = Math.max(0, Math.floor((item.deadlineEpochMs - Date.now()) / 1000));
          const h = String(Math.floor(remainingSec / 3600)).padStart(2, '0');
          const m = String(Math.floor((remainingSec % 3600) / 60)).padStart(2, '0');
          const s = String(remainingSec % 60).padStart(2, '0');
          tickerEl.querySelector('span').textContent = `T-MINUS ${h}:${m}:${s}`;
        });
      }, 1000);
    }

    syncFirestore() {
      if (!window.db || !this.currentChatId || typeof window.doc !== 'function') return;
      try {
        const docRef = window.doc(window.db, 'pinnedMatrices', this.currentChatId);
        window.getDoc(docRef).then(snap => {
          if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data.items) && data.items.length > 0) {
              this.pins = data.items;
              localStorage.setItem(this.getStorageKey(this.currentChatId), JSON.stringify(this.pins));
              this.render();
            }
          }
        }).catch(err => console.warn('[NEX-PINBOARD] Cloud sync notice:', err));
      } catch (_) {}
    }

    commitFirestore() {
      if (!window.db || !this.currentChatId || typeof window.setDoc !== 'function') return;
      try {
        const docRef = window.doc(window.db, 'pinnedMatrices', this.currentChatId);
        window.setDoc(docRef, {
          chatId: this.currentChatId,
          chatType: this.currentChatType,
          items: this.pins,
          updatedAt: window.serverTimestamp ? window.serverTimestamp() : new Date()
        }, { merge: true }).catch(err => console.warn('[NEX-PINBOARD] Cloud commit notice:', err));
      } catch (_) {}
    }

    clearAllPins() {
      this.pins = [];
      if (this.currentChatId) {
        localStorage.removeItem(this.getStorageKey(this.currentChatId));
      }
      this.render();
    }

    escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }

  // Bind to Global Window Namespace
  window.NexPinboardMatrix = new TacticalPinboardMatrix();

})(window);