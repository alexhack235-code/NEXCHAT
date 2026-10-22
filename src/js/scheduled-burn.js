/**
 * NEXCHAT - Quantum Delayed Dispatches & Ephemeral Burning Timers Engine
 * Future message scheduling, autonomous background dispatcher,
 * and laser burning countdown timers with digital ash disintegration.
 */

(function() {
  'use strict';

  const SCHEDULED_KEY = 'nexchat_scheduled_messages';

  class ScheduledBurnEngine {
    constructor() {
      this.scheduledList = this.loadScheduledList();
      this.checkInterval = null;
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
      this.startSchedulerLoop();
    }

    bindDOM() {
      this.injectModal();
      this.injectHubAction();
    }

    loadScheduledList() {
      try {
        const raw = localStorage.getItem(SCHEDULED_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    saveScheduledList() {
      try {
        localStorage.setItem(SCHEDULED_KEY, JSON.stringify(this.scheduledList));
      } catch (e) {}
    }

    injectModal() {
      if (document.getElementById('scheduleMessageModal')) return;

      const modal = document.createElement('div');
      modal.id = 'scheduleMessageModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window schedule-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-[#00d4ff] text-lg"></i>
              <h3 class="font-bold text-white text-base">QUANTUM DELAYED DISPATCH</h3>
            </div>
            <button type="button" class="cyber-modal-close" id="closeScheduleModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="schedule-modal-body">
            <p class="text-xs text-gray-300 text-center mb-3">
              Schedule an encrypted transmission to be dispatched automatically at an exact future time.
            </p>

            <div class="schedule-field-group">
              <label class="schedule-label">MESSAGE TEXT TO DISPATCH:</label>
              <textarea id="scheduleMessageInput" class="schedule-text-area" rows="2" placeholder="Enter message to schedule..."></textarea>
            </div>

            <div class="schedule-field-group mt-3">
              <label class="schedule-label">SELECT DISPATCH TIME DELAY:</label>
              <div class="schedule-pills-row">
                <button type="button" class="schedule-delay-pill active" data-mins="5">+5 Mins</button>
                <button type="button" class="schedule-delay-pill" data-mins="30">+30 Mins</button>
                <button type="button" class="schedule-delay-pill" data-mins="60">+1 Hour</button>
                <button type="button" class="schedule-delay-pill" data-mins="1440">Tomorrow</button>
              </div>
            </div>

            <div class="schedule-field-group mt-3">
              <label class="schedule-label flex items-center gap-2">
                <input type="checkbox" id="selfDestructBurnCheckbox" />
                <span class="text-amber-400 font-bold">🔥 Attach Laser Self-Destruct Burn Timer (30s)</span>
              </label>
            </div>

            <button type="button" id="confirmScheduleBtn" class="schedule-submit-btn mt-4">
              <i class="fa-solid fa-hourglass-half"></i> SCHEDULE QUANTUM DISPATCH
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('closeScheduleModalBtn')?.addEventListener('click', () => {
        this.closeModal();
      });

      let selectedMins = 5;
      modal.querySelectorAll('.schedule-delay-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          modal.querySelectorAll('.schedule-delay-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          selectedMins = parseInt(pill.dataset.mins, 10);
        });
      });

      document.getElementById('confirmScheduleBtn')?.addEventListener('click', () => {
        const textInput = document.getElementById('scheduleMessageInput');
        const text = textInput ? textInput.value.trim() : '';
        const burnCheckbox = document.getElementById('selfDestructBurnCheckbox');
        const isBurn = burnCheckbox ? burnCheckbox.checked : false;

        if (!text) {
          if (typeof window.showNotif === 'function') window.showNotif('Please enter message text', 'error');
          return;
        }

        this.scheduleMessage(text, selectedMins, isBurn);
        this.closeModal();
      });
    }

    injectHubAction() {
      const hub = document.getElementById('attachmentPopupHub');
      if (hub && !document.getElementById('hubActionScheduleMsg')) {
        const item = document.createElement('div');
        item.className = 'attach-hub-item';
        item.id = 'hubActionScheduleMsg';
        item.innerHTML = `
          <div class="attach-hub-icon icon-schedule-msg"><i class="fa-solid fa-clock"></i></div>
          <span>Schedule</span>
        `;
        item.addEventListener('click', () => {
          hub.style.display = 'none';
          this.openModal();
        });
        hub.appendChild(item);
      }
    }

    openModal() {
      const modal = document.getElementById('scheduleMessageModal');
      if (!modal) return;
      const mainInput = document.getElementById('message-input');
      const schedInput = document.getElementById('scheduleMessageInput');
      if (schedInput && mainInput && mainInput.value.trim()) {
        schedInput.value = mainInput.value.trim();
      }
      modal.style.display = 'flex';
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    closeModal() {
      const modal = document.getElementById('scheduleMessageModal');
      if (modal) modal.style.display = 'none';
    }

    scheduleMessage(text, delayMins, isBurn) {
      const partnerId = window.currentChatUserId || window.currentChatUser;
      if (!partnerId) {
        if (typeof window.showNotif === 'function') window.showNotif('Please select a chat partner first', 'error');
        return;
      }

      const dueTimestamp = Date.now() + (delayMins * 60 * 1000);
      const schedItem = {
        id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: text,
        targetUser: partnerId,
        dueTime: dueTimestamp,
        isBurn: isBurn,
        createdAt: Date.now()
      };

      this.scheduledList.push(schedItem);
      this.saveScheduledList();

      if (typeof window.showNotif === 'function') {
        const dueFormatted = new Date(dueTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        window.showNotif(`⏰ Message scheduled for delivery at ${dueFormatted}!`, 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    startSchedulerLoop() {
      this.checkInterval = setInterval(() => {
        const now = Date.now();
        const dueItems = this.scheduledList.filter(item => item.dueTime <= now);
        if (dueItems.length > 0) {
          dueItems.forEach(item => this.dispatchDueMessage(item));
          this.scheduledList = this.scheduledList.filter(item => item.dueTime > now);
          this.saveScheduledList();
        }
      }, 5000); // Check every 5s
    }

    dispatchDueMessage(item) {
      if (typeof window.appendLocalSentMessage === 'function') {
        const clientMsgId = `burn_${Date.now()}`;
        window.appendLocalSentMessage(item.text, null, false, 'sent', clientMsgId);

        if (item.isBurn) {
          const wrapper = document.getElementById(`wrapper-${clientMsgId}`);
          if (wrapper) this.attachLaserBurnCountdown(wrapper, 30);
        }
      }

      if (typeof window.sendSupabaseMessage === 'function') {
        window.sendSupabaseMessage({
          from: window.myUID || 'u_current',
          to: item.targetUser,
          text: item.text,
          attachment: item.isBurn ? { isSelfDestruct: true, burnSeconds: 30 } : null,
          chatType: window.currentChatType || 'direct'
        }).catch(console.warn);
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif(`🚀 Scheduled transmission delivered to ${item.targetUser}!`, 'success', 2000);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
    }

    attachLaserBurnCountdown(wrapper, seconds = 30) {
      const fuse = document.createElement('div');
      fuse.className = 'laser-burn-fuse';
      fuse.innerHTML = `
        <div class="laser-fuse-glow"></div>
        <div class="laser-fuse-fill" style="animation-duration: ${seconds}s;"></div>
        <span class="laser-fuse-label"><i class="fa-solid fa-fire text-amber-400"></i> BURNING IN ${seconds}s</span>
      `;

      wrapper.appendChild(fuse);

      setTimeout(() => {
        wrapper.classList.add('burn-disintegrate-anim');
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');
        setTimeout(() => wrapper.remove(), 1200);
      }, seconds * 1000);
    }
  }

  window.scheduledBurnEngine = new ScheduledBurnEngine();
})();
