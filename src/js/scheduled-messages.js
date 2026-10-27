/**
 * NEXCHAT - Quantum Scheduled & Time-Triggered Dispatch Engine
 * Precision message timers, "Send When Online" presence triggers,
 * zero-disturbance silent delivery, and recurring enterprise standup check-ins.
 */

(function(global) {
  'use strict';

  const STORAGE_KEY = 'nexchat_scheduled_messages_vault';

  class ScheduledMessageEngine {
    constructor() {
      this.messages = this.loadFromStorage();
      this.timerInterval = null;
      this.currentFilterChatId = null;
      this.activePresenceWatchers = new Map();
      this.init();
    }

    init() {
      this.startClock();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    loadFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.warn('[ScheduledEngine] Storage parse notice:', e);
        return [];
      }
    }

    saveToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages));
      } catch (e) {
        console.warn('[ScheduledEngine] Storage save notice:', e);
      }
    }

    startClock() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      // Precision check every 1 second
      this.timerInterval = setInterval(() => {
        this.evaluateQueue();
      }, 1000);
    }

    /**
     * Evaluates pending items in queue against current epoch time
     */
    async evaluateQueue() {
      const now = Date.now();
      let hasChanges = false;

      for (let i = this.messages.length - 1; i >= 0; i--) {
        const item = this.messages[i];
        if (item.status !== 'pending') continue;

        let shouldDispatch = false;

        if (item.triggerMode === 'datetime') {
          if (now >= item.targetTime) {
            shouldDispatch = true;
          }
        } else if (item.triggerMode === 'when_online') {
          if (this.isRecipientOnline(item.chatId)) {
            shouldDispatch = true;
          }
        }

        if (shouldDispatch) {
          hasChanges = true;
          await this.dispatchScheduledItem(item, i);
        }
      }

      if (hasChanges) {
        this.saveToStorage();
        this.updateUI();
      }
    }

    isRecipientOnline(chatId) {
      if (!chatId) return false;
      // 1. Check window.activeContactsOnlineMap if present
      if (window.activeContactsOnlineMap && window.activeContactsOnlineMap.get) {
        if (window.activeContactsOnlineMap.get(chatId) === true) return true;
      }
      // 2. Check presence element in DOM
      const onlineEl = document.querySelector(`[data-uid="${chatId}"] .online-indicator, .chat-item[data-id="${chatId}"] .status-dot.online`);
      if (onlineEl && onlineEl.style.display !== 'none') return true;

      // 3. Check active header subtitle if currentChatUser is target
      if (window.currentChatUser === chatId) {
        const sub = document.getElementById('chatSubTitle') || document.querySelector('.chat-detail-subtitle');
        if (sub && sub.textContent.toLowerCase().includes('online')) return true;
      }

      return false;
    }

    async dispatchScheduledItem(item, index) {
      console.log('[ScheduledEngine] Dispatching due item:', item.id, item.chatName || item.chatId);
      
      try {
        // If current active chat matches target
        if (window.currentChatUser === item.chatId) {
          const input = document.getElementById('message-input');
          if (input) input.value = item.text;
          
          if (item.selfDestructSec > 0) {
            window.isAttachmentViewOnce = true;
            window.attachmentViewOnceTimeout = item.selfDestructSec;
          }

          if (typeof window.sendMessage === 'function') {
            await window.sendMessage();
          }
        } else {
          // Direct dispatch via Supabase or Firestore if available
          if (typeof window.sendSupabaseMessage === 'function') {
            await window.sendSupabaseMessage({
              sender_id: item.senderId || window.myUID,
              recipient_id: item.chatType === 'group' ? null : item.chatId,
              group_id: item.chatType === 'group' ? item.chatId : null,
              content: item.text,
              created_at: new Date().toISOString(),
              is_scheduled_delivery: true,
              is_silent: !!item.isSilent,
              burn_timeout: item.selfDestructSec || 0
            });
          } else if (typeof window.sendMessageDirectWithoutComposer === 'function') {
            await window.sendMessageDirectWithoutComposer(item.chatId, item.text, item.chatType);
          }
        }

        // Notification & Sound
        if (typeof playLuxuryChimeSound === 'function' && !item.isSilent) {
          playLuxuryChimeSound();
        }
        if (typeof showNotif === 'function') {
          showNotif(`Delivered scheduled message to @${item.chatName || item.chatId}`, 'success', 3500);
        }

        // Handle recurring check-ins
        if (item.recurring && item.recurring !== 'none') {
          let intervalMs = 24 * 60 * 60 * 1000; // daily default
          if (item.recurring === 'weekly') intervalMs = 7 * 24 * 60 * 60 * 1000;
          if (item.recurring === 'monthly') intervalMs = 30 * 24 * 60 * 60 * 1000;

          item.targetTime = Date.now() + intervalMs;
          item.lastDispatchedAt = Date.now();
          console.log('[ScheduledEngine] Recurring message rescheduled for:', new Date(item.targetTime).toLocaleString());
        } else {
          // Remove non-recurring from array
          this.messages.splice(index, 1);
        }
      } catch (err) {
        console.error('[ScheduledEngine] Dispatch error:', err);
      }
    }

    /**
     * Schedules a new message into queue
     */
    scheduleMessage(data) {
      const id = 'sched_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const entry = {
        id,
        chatId: data.chatId,
        chatName: data.chatName || data.chatId,
        chatType: data.chatType || 'direct',
        text: data.text,
        senderId: data.senderId || window.myUID || 'me',
        createdAt: Date.now(),
        targetTime: data.targetTime,
        triggerMode: data.triggerMode || 'datetime',
        isSilent: !!data.isSilent,
        selfDestructSec: data.selfDestructSec || 0,
        recurring: data.recurring || 'none',
        status: 'pending'
      };

      this.messages.push(entry);
      this.saveToStorage();
      this.updateUI();

      if (typeof playLuxuryChimeSound === 'function') playLuxuryChimeSound();
      if (typeof showNotif === 'function') {
        const timeLabel = entry.triggerMode === 'when_online' 
          ? 'when recipient comes online' 
          : new Date(entry.targetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        showNotif(`Message scheduled for ${timeLabel}!`, 'success', 3000);
      }

      return entry;
    }

    /**
     * Dispatches an item immediately now
     */
    async dispatchNow(id) {
      const idx = this.messages.findIndex(m => m.id === id);
      if (idx === -1) return;
      const item = this.messages[idx];
      await this.dispatchScheduledItem(item, idx);
      this.saveToStorage();
      this.updateUI();
    }

    /**
     * Reschedules an item
     */
    reschedule(id, newTargetTime) {
      const item = this.messages.find(m => m.id === id);
      if (!item) return;
      item.targetTime = newTargetTime;
      item.triggerMode = 'datetime';
      this.saveToStorage();
      this.updateUI();
      if (typeof showNotif === 'function') {
        showNotif('Message delivery rescheduled!', 'info', 2000);
      }
    }

    /**
     * Edits draft text
     */
    editText(id, newText) {
      const item = this.messages.find(m => m.id === id);
      if (!item) return;
      item.text = newText;
      this.saveToStorage();
      this.updateUI();
      if (typeof showNotif === 'function') {
        showNotif('Scheduled draft updated!', 'info', 2000);
      }
    }

    /**
     * Cancels / Deletes scheduled message
     */
    deleteScheduled(id) {
      const idx = this.messages.findIndex(m => m.id === id);
      if (idx === -1) return;
      this.messages.splice(idx, 1);
      this.saveToStorage();
      this.updateUI();
      if (typeof showNotif === 'function') {
        showNotif('Scheduled message cancelled.', 'info', 2000);
      }
    }

    getPendingForChat(chatId) {
      if (!chatId) return [];
      return this.messages.filter(m => m.chatId === chatId && m.status === 'pending');
    }

    getAllPending() {
      return this.messages.filter(m => m.status === 'pending');
    }

    updateUI() {
      const currentChatId = window.currentChatUser;
      this.updateComposerBanner(currentChatId);
      this.renderQueueModal();
    }

    updateComposerBanner(chatId) {
      const banner = document.getElementById('scheduledMessagesBanner');
      const textEl = document.getElementById('scheduledBannerText');
      if (!banner || !textEl) return;

      const pending = this.getPendingForChat(chatId);
      if (pending.length > 0) {
        banner.style.display = 'flex';
        textEl.textContent = `${pending.length} Message${pending.length > 1 ? 's' : ''} Scheduled for this Chat`;
      } else {
        banner.style.display = 'none';
      }
    }

    renderQueueModal() {
      const listEl = document.getElementById('scheduledQueueItemsList');
      const countEl = document.getElementById('scheduledQueueCountText');
      if (!listEl) return;

      const isCurrentOnly = this.currentFilterChatId !== 'all';
      const items = isCurrentOnly 
        ? this.getPendingForChat(window.currentChatUser) 
        : this.getAllPending();

      if (countEl) {
        countEl.textContent = `${items.length} Scheduled Message${items.length === 1 ? '' : 's'}`;
      }

      listEl.innerHTML = '';

      if (items.length === 0) {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; color: #8b949e;">
            <i class="fa-solid fa-clock-rotate-left" style="font-size: 32px; color: rgba(0, 242, 254, 0.3); margin-bottom: 12px; display: block;"></i>
            <strong style="color: #cbd5e1; font-size: 14px;">No Scheduled Messages</strong>
            <p style="font-size: 12px; margin: 4px 0 0 0;">Long-press the Send button or tap the clock icon to schedule messages on a timer.</p>
          </div>
        `;
        return;
      }

      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'scheduled-queue-card';
        card.style.cssText = `
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(0, 242, 254, 0.2);
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        `;

        let timeStr = '';
        if (item.triggerMode === 'when_online') {
          timeStr = '<span style="color: #00ff66;"><i class="fa-solid fa-signal"></i> When Recipient Comes Online</span>';
        } else {
          const d = new Date(item.targetTime);
          const diffMs = item.targetTime - Date.now();
          const diffMin = Math.max(0, Math.round(diffMs / 60000));
          const diffHour = Math.floor(diffMin / 60);
          const remMin = diffMin % 60;
          const remainingStr = diffHour > 0 ? `${diffHour}h ${remMin}m` : `${diffMin}m`;

          timeStr = `<span><i class="fa-solid fa-clock" style="color: #00f2fe;"></i> ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} <span style="color:#00f2fe;font-size:11px;">(${remainingStr} remaining)</span></span>`;
        }

        const badges = [];
        if (item.isSilent) badges.push('<span style="font-size: 10px; padding: 2px 6px; border-radius: 6px; background: rgba(255,255,255,0.08); color: #cbd5e1;"><i class="fa-solid fa-volume-xmark"></i> Silent</span>');
        if (item.selfDestructSec > 0) badges.push(`<span style="font-size: 10px; padding: 2px 6px; border-radius: 6px; background: rgba(255,136,0,0.15); color: #ff8800;"><i class="fa-solid fa-fire"></i> ${item.selfDestructSec}s Ephemeral</span>`);
        if (item.recurring && item.recurring !== 'none') badges.push(`<span style="font-size: 10px; padding: 2px 6px; border-radius: 6px; background: rgba(0,242,254,0.15); color: #00f2fe;"><i class="fa-solid fa-arrows-rotate"></i> ${item.recurring.toUpperCase()}</span>`);

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: #fff; font-size: 13px;">To: @${item.chatName || item.chatId}</strong>
              ${badges.join(' ')}
            </div>
            <div style="font-size: 11.5px; color: #94a3b8;">
              ${timeStr}
            </div>
          </div>

          <div style="font-size: 13px; color: #cbd5e1; background: rgba(0,0,0,0.25); padding: 8px 10px; border-radius: 6px; white-space: pre-wrap; word-break: break-word;">
            ${item.text}
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 2px;">
            <button type="button" class="btn-primary btn-queue-send-now" data-id="${item.id}" style="font-size: 11px; padding: 4px 10px; display: flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-paper-plane"></i> Send Now
            </button>
            <button type="button" class="btn-secondary btn-queue-reschedule" data-id="${item.id}" style="font-size: 11px; padding: 4px 10px; display: flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-calendar-days"></i> Reschedule
            </button>
            <button type="button" class="btn-danger btn-queue-delete" data-id="${item.id}" style="font-size: 11px; padding: 4px 10px; display: flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-trash"></i> Cancel
            </button>
          </div>
        `;

        // Bind Card Actions
        const sendNowBtn = card.querySelector('.btn-queue-send-now');
        if (sendNowBtn) {
          sendNowBtn.addEventListener('click', () => {
            this.dispatchNow(item.id);
          });
        }

        const rescheduleBtn = card.querySelector('.btn-queue-reschedule');
        if (rescheduleBtn) {
          rescheduleBtn.addEventListener('click', () => {
            const newMinutes = prompt('Reschedule message delivery (enter minutes from now):', '30');
            if (newMinutes && !isNaN(parseInt(newMinutes, 10))) {
              const newTime = Date.now() + parseInt(newMinutes, 10) * 60 * 1000;
              this.reschedule(item.id, newTime);
            }
          });
        }

        const deleteBtn = card.querySelector('.btn-queue-delete');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            if (confirm('Cancel and remove this scheduled message?')) {
              this.deleteScheduled(item.id);
            }
          });
        }

        listEl.appendChild(card);
      });
    }

    bindDOM() {
      // 1. Trigger button in composer
      const triggerBtn = document.getElementById('scheduleSendTriggerBtn');
      if (triggerBtn && !triggerBtn.dataset.bound) {
        triggerBtn.dataset.bound = 'true';
        triggerBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.openDispatchModal();
        });
      }

      // 2. Long-press and Right-click on Send button
      const sendBtn = document.getElementById('sendBtn');
      if (sendBtn && !sendBtn.dataset.scheduleBound) {
        sendBtn.dataset.scheduleBound = 'true';
        
        let pressTimer = null;
        let didLongPress = false;

        const startPress = (e) => {
          didLongPress = false;
          pressTimer = setTimeout(() => {
            didLongPress = true;
            if (navigator.vibrate) navigator.vibrate(30);
            this.openDispatchModal();
          }, 420); // 420ms long-press threshold
        };

        const cancelPress = () => {
          if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
          }
        };

        sendBtn.addEventListener('mousedown', startPress);
        sendBtn.addEventListener('mouseup', cancelPress);
        sendBtn.addEventListener('mouseleave', cancelPress);

        sendBtn.addEventListener('touchstart', startPress, { passive: true });
        sendBtn.addEventListener('touchend', (e) => {
          cancelPress();
          if (didLongPress) {
            e.preventDefault();
            e.stopPropagation();
          }
        });

        sendBtn.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.openDispatchModal();
        });
      }

      // 3. Modal close buttons
      const closeSchedBtn = document.getElementById('closeScheduleModalBtn');
      if (closeSchedBtn && !closeSchedBtn.dataset.bound) {
        closeSchedBtn.dataset.bound = 'true';
        closeSchedBtn.addEventListener('click', () => this.closeDispatchModal());
      }

      const closeQueueBtn = document.getElementById('closeScheduledQueueBtn');
      if (closeQueueBtn && !closeQueueBtn.dataset.bound) {
        closeQueueBtn.dataset.bound = 'true';
        closeQueueBtn.addEventListener('click', () => this.closeQueueModal());
      }

      const openQueueBannerBtn = document.getElementById('openScheduledQueueBtn');
      if (openQueueBannerBtn && !openQueueBannerBtn.dataset.bound) {
        openQueueBannerBtn.dataset.bound = 'true';
        openQueueBannerBtn.addEventListener('click', () => this.openQueueModal());
      }

      // 4. Modal tab switching (Datetime vs When Online)
      const tabDatetime = document.getElementById('scheduleTabDatetime');
      const tabOnline = document.getElementById('scheduleTabWhenOnline');
      const viewDatetime = document.getElementById('scheduleDatetimeView');
      const viewOnline = document.getElementById('scheduleWhenOnlineView');

      if (tabDatetime && tabOnline) {
        tabDatetime.addEventListener('click', () => {
          tabDatetime.className = 'btn-primary';
          tabOnline.className = 'btn-secondary';
          if (viewDatetime) viewDatetime.style.display = 'block';
          if (viewOnline) viewOnline.style.display = 'none';
          tabDatetime.dataset.active = 'true';
          tabOnline.dataset.active = 'false';
        });

        tabOnline.addEventListener('click', () => {
          tabOnline.className = 'btn-primary';
          tabDatetime.className = 'btn-secondary';
          if (viewDatetime) viewDatetime.style.display = 'none';
          if (viewOnline) viewOnline.style.display = 'block';
          tabOnline.dataset.active = 'true';
          tabDatetime.dataset.active = 'false';
        });
      }

      // 5. Presets
      document.querySelectorAll('.schedule-preset-btn').forEach(btn => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', () => {
          const preset = btn.dataset.preset;
          this.applyPreset(preset);
        });
      });

      // 6. Confirm schedule button
      const confirmBtn = document.getElementById('btnConfirmScheduleSend');
      if (confirmBtn && !confirmBtn.dataset.bound) {
        confirmBtn.dataset.bound = 'true';
        confirmBtn.addEventListener('click', () => this.handleConfirmSchedule());
      }

      // 7. Send immediately instead
      const sendNowInsteadBtn = document.getElementById('btnSendImmediatelyInstead');
      if (sendNowInsteadBtn && !sendNowInsteadBtn.dataset.bound) {
        sendNowInsteadBtn.dataset.bound = 'true';
        sendNowInsteadBtn.addEventListener('click', () => {
          this.closeDispatchModal();
          if (typeof window.sendMessage === 'function') window.sendMessage();
        });
      }

      // 8. Queue filter toggles
      const filterCurrent = document.getElementById('btnFilterCurrentChatSchedule');
      const filterAll = document.getElementById('btnFilterAllChatsSchedule');
      if (filterCurrent && filterAll) {
        filterCurrent.addEventListener('click', () => {
          filterCurrent.className = 'btn-primary';
          filterAll.className = 'btn-secondary';
          this.currentFilterChatId = window.currentChatUser;
          this.renderQueueModal();
        });
        filterAll.addEventListener('click', () => {
          filterAll.className = 'btn-primary';
          filterCurrent.className = 'btn-secondary';
          this.currentFilterChatId = 'all';
          this.renderQueueModal();
        });
      }
    }

    applyPreset(preset) {
      const now = new Date();
      let targetDate = new Date();

      if (preset === '15m') {
        targetDate = new Date(now.getTime() + 15 * 60 * 1000);
      } else if (preset === '30m') {
        targetDate = new Date(now.getTime() + 30 * 60 * 1000);
      } else if (preset === '1h') {
        targetDate = new Date(now.getTime() + 60 * 60 * 1000);
      } else if (preset === '3h') {
        targetDate = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      } else if (preset === 'tomorrow_morning') {
        targetDate.setDate(targetDate.getDate() + 1);
        targetDate.setHours(9, 0, 0, 0);
      } else if (preset === 'tomorrow_evening') {
        targetDate.setDate(targetDate.getDate() + 1);
        targetDate.setHours(18, 0, 0, 0);
      }

      const dateInput = document.getElementById('scheduleCustomDateInput');
      const timeInput = document.getElementById('scheduleCustomTimeInput');

      if (dateInput) {
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
      }

      if (timeInput) {
        const hh = String(targetDate.getHours()).padStart(2, '0');
        const min = String(targetDate.getMinutes()).padStart(2, '0');
        timeInput.value = `${hh}:${min}`;
      }

      // Visual feedback
      document.querySelectorAll('.schedule-preset-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.querySelector(`.schedule-preset-btn[data-preset="${preset}"]`);
      if (activeBtn) activeBtn.classList.add('active');
    }

    openDispatchModal() {
      const modal = document.getElementById('scheduledDispatchModal');
      const draftArea = document.getElementById('scheduleDraftText');
      const recipientBadge = document.getElementById('scheduleRecipientBadge');
      const input = document.getElementById('message-input');

      if (!modal) return;

      const currentText = input ? input.value.trim() : '';
      if (draftArea) draftArea.value = currentText;

      const targetName = window.currentChatName || window.currentChatUser || 'Active Chat';
      if (recipientBadge) recipientBadge.textContent = `@${targetName}`;

      // Default to 30 min preset
      this.applyPreset('30m');

      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    }

    closeDispatchModal() {
      const modal = document.getElementById('scheduledDispatchModal');
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    }

    openQueueModal() {
      const modal = document.getElementById('scheduledQueueModal');
      if (!modal) return;
      this.currentFilterChatId = window.currentChatUser;
      this.renderQueueModal();
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    }

    closeQueueModal() {
      const modal = document.getElementById('scheduledQueueModal');
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    }

    handleConfirmSchedule() {
      const draftArea = document.getElementById('scheduleDraftText');
      const text = draftArea ? draftArea.value.trim() : '';

      if (!text) {
        if (typeof showNotif === 'function') {
          showNotif('Please enter a message text to schedule!', 'error', 2500);
        }
        return;
      }

      const tabOnline = document.getElementById('scheduleTabWhenOnline');
      const isWhenOnline = tabOnline && tabOnline.dataset.active === 'true';

      let targetTime = Date.now() + 30 * 60 * 1000;
      let triggerMode = 'datetime';

      if (isWhenOnline) {
        triggerMode = 'when_online';
      } else {
        const dateInput = document.getElementById('scheduleCustomDateInput');
        const timeInput = document.getElementById('scheduleCustomTimeInput');
        if (dateInput && timeInput && dateInput.value && timeInput.value) {
          const parsed = new Date(`${dateInput.value}T${timeInput.value}`);
          if (!isNaN(parsed.getTime())) {
            targetTime = parsed.getTime();
          }
        }
        if (targetTime <= Date.now()) {
          if (typeof showNotif === 'function') {
            showNotif('Target schedule time must be in the future!', 'error', 2500);
          }
          return;
        }
      }

      const silentToggle = document.getElementById('scheduleSilentToggle');
      const selfDestructSelect = document.getElementById('scheduleSelfDestructSelect');
      const recurringSelect = document.getElementById('scheduleRecurringSelect');

      const isSilent = silentToggle ? silentToggle.checked : false;
      const selfDestructSec = selfDestructSelect ? parseInt(selfDestructSelect.value, 10) : 0;
      const recurring = recurringSelect ? recurringSelect.value : 'none';

      const entry = this.scheduleMessage({
        chatId: window.currentChatUser || 'default_room',
        chatName: window.currentChatName || window.currentChatUser || 'Chat',
        chatType: window.currentChatType || 'direct',
        text,
        targetTime,
        triggerMode,
        isSilent,
        selfDestructSec,
        recurring
      });

      // Clear main composer input
      const composerInput = document.getElementById('message-input');
      if (composerInput) composerInput.value = '';

      this.closeDispatchModal();
    }
  }

  // Export Singleton
  global.ScheduledMessageEngine = ScheduledMessageEngine;
  global.scheduledMessageEngine = new ScheduledMessageEngine();

  // Expose global helper methods for DOM triggers
  global.openScheduledDispatchModal = function() {
    global.scheduledMessageEngine.openDispatchModal();
  };
  global.openScheduledQueueModal = function() {
    global.scheduledMessageEngine.openQueueModal();
  };

})(typeof window !== 'undefined' ? window : this);
