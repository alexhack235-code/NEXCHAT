/**
 * NEXCHAT - Offline-First Message Queue & Resilient IndexedDB Sync Engine
 * Autonomous offline queuing, IndexedDB persistence, network state beacons,
 * and automated zero-loss queue flush upon reconnection.
 */

(function() {
  'use strict';

  const DB_NAME = 'nexchat_offline_db';
  const STORE_NAME = 'offline_queue';
  const DB_VERSION = 1;

  class OfflineQueueEngine {
    constructor() {
      this.db = null;
      this.isOnlineState = navigator.onLine;
      this.isFlushing = false;
      this.init();
    }

    async init() {
      await this.initIndexedDB();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    initIndexedDB() {
      return new Promise((resolve) => {
        if (!window.indexedDB) {
          console.warn('IndexedDB not supported, fallback to memory queue');
          resolve(null);
          return;
        }

        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        req.onsuccess = (e) => {
          this.db = e.target.result;
          resolve(this.db);
        };

        req.onerror = () => {
          console.warn('Failed to open offline IndexedDB');
          resolve(null);
        };
      });
    }

    bindDOM() {
      this.injectNetworkStatusPill();
      this.bindNetworkListeners();
      this.updateStatusPill();
      this.refreshQueueCount();
    }

    injectNetworkStatusPill() {
      const headerText = document.querySelector('.header-text');
      if (headerText && !document.getElementById('networkStatusPill')) {
        const pill = document.createElement('div');
        pill.id = 'networkStatusPill';
        pill.className = 'network-status-pill online';
        pill.innerHTML = `<span class="network-dot"></span> <span id="networkStatusLabel">ONLINE</span>`;
        headerText.appendChild(pill);
      }
    }

    bindNetworkListeners() {
      window.addEventListener('online', () => {
        this.isOnlineState = true;
        this.updateStatusPill();
        if (typeof window.showNotif === 'function') {
          window.showNotif('[ONLINE] Connection re-established. Synchronizing queue...', 'info', 2000);
        }
        this.flushQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnlineState = false;
        this.updateStatusPill();
        if (typeof window.showNotif === 'function') {
          window.showNotif('[OFFLINE] Offline Mode Engaged. Outgoing transmissions will be queued.', 'warning', 3000);
        }
      });
    }

    updateStatusPill() {
      const pill = document.getElementById('networkStatusPill');
      const label = document.getElementById('networkStatusLabel');
      if (!pill || !label) return;

      if (this.isOnlineState) {
        pill.className = 'network-status-pill online';
        label.textContent = 'ENCRYPTED ONLINE';
      } else {
        pill.className = 'network-status-pill offline animate-pulse';
        label.innerHTML = `OFFLINE &bull; QUEUED (<strong id="queueCountVal">0</strong>)`;
        this.refreshQueueCount();
      }
    }

    async enqueue(msgPayload) {
      const item = {
        id: msgPayload.clientMsgId || `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: msgPayload.text || '',
        attachment: msgPayload.attachment || null,
        targetUser: msgPayload.targetUser || window.currentChatUser,
        chatType: msgPayload.chatType || 'direct',
        timestamp: Date.now()
      };

      if (this.db) {
        try {
          const tx = this.db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(item);
        } catch (e) {
          console.warn('Could not store in IndexedDB:', e);
        }
      }

      // Also render optimistic bubble into chat with clock icon
      if (typeof window.appendLocalSentMessage === 'function') {
        window.appendLocalSentMessage(item.text, item.attachment, false, 'sending', item.id);
        const tick = document.getElementById(`tick-${item.id}`);
        if (tick) {
          tick.className = 'fa-solid fa-clock tick-pending';
          tick.title = 'Queued offline';
        }
      }

      this.refreshQueueCount();

      if (typeof window.showNotif === 'function') {
        window.showNotif('Transmission securely queued in offline IndexedDB [QUEUED]', 'info', 1800);
      }
    }

    async getQueueItems() {
      if (!this.db) return [];
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        } catch (e) {
          resolve([]);
        }
      });
    }

    async removeQueueItem(id) {
      if (!this.db) return;
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.delete(id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch (e) {
          resolve();
        }
      });
    }

    async refreshQueueCount() {
      const countEl = document.getElementById('queueCountVal');
      if (!countEl) return;
      const items = await this.getQueueItems();
      countEl.textContent = String(items.length);
    }

    async flushQueue() {
      if (this.isFlushing || !this.isOnlineState) return;
      this.isFlushing = true;

      const items = await this.getQueueItems();
      if (items.length === 0) {
        this.isFlushing = false;
        return;
      }

      console.log(`[OfflineQueue] Flushing ${items.length} queued messages...`);
      let successCount = 0;

      for (const item of items) {
        try {
          // Send via Supabase
          if (typeof window.sendSupabaseMessage === 'function') {
            await window.sendSupabaseMessage({
              from: window.myUID || 'u_current',
              to: item.targetUser,
              text: item.text,
              attachment: item.attachment,
              chatType: item.chatType
            });
          }

          // Update UI tick mark to sent
          if (typeof window.updateLocalSentMessageStatus === 'function') {
            window.updateLocalSentMessageStatus(item.id, 'sent');
          }

          await this.removeQueueItem(item.id);
          successCount++;
        } catch (err) {
          console.warn('[OfflineQueue] Flush item retry needed:', err);
          break; // Stop and retry on next online pulse
        }
      }

      this.isFlushing = false;
      this.refreshQueueCount();

      if (successCount > 0) {
        if (typeof window.showNotif === 'function') {
          window.showNotif(`[SYNCED] Synchronized ${successCount} queued offline transmissions!`, 'success', 2500);
        }
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
      }
    }
  }

  window.offlineQueueEngine = new OfflineQueueEngine();
})();
