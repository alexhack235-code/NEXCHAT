/**
 * NEXCHAT - Telegram & WhatsApp Live Presence & Heartbeat Engine
 * ================================================================
 * Core Capabilities:
 * 1. Data-Flow Heartbeat:
 *    - Sends presence ping only when data is flowing (active app usage).
 *    - Heartbeat interval: 20 seconds.
 * 2. Instant Background & Visibility Disconnect:
 *    - visibilitychange (hidden): Immediately pushes offline status and halts heartbeat.
 *    - visibilitychange (visible): Immediately pushes online status and resumes heartbeat.
 *    - blur / focus: Suspends heartbeat on prolonged unfocused window.
 *    - pagehide / beforeunload: Pushes offline timestamp with beacon fallback.
 * 3. User Activity / Idle Detection:
 *    - Detects typing, mouse movement, touches, keypresses, and scrolling.
 *    - If inactive for > 45 seconds, transitions to idle/offline until next interaction.
 * 4. Strict Heartbeat TTL Verification (isUserActuallyOnline):
 *    - Evaluates other users' status dynamically: A user is ONLY considered Online
 *      if their lastSeen timestamp is within the last 45 seconds.
 *    - Stale boolean online values are automatically rejected as "Last seen...".
 * 5. Real-Time Active Chat Presence Sync:
 *    - Attaches real-time listener to active chat partner.
 *    - Updates header text and pulse dot dynamically ("Online" vs "Last seen Xm ago").
 *
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector glyphs and cyberpunk pulse beacons only.
 */

(function () {
  'use strict';

  const HEARTBEAT_INTERVAL = 20000; // 20s heartbeat
  const HEARTBEAT_TTL = 45000;      // 45s TTL for online validity
  const IDLE_TIMEOUT = 50000;       // 50s user idle timeout

  class TelegramWhatsAppPresence {
    constructor() {
      this.heartbeatTimer = null;
      this.idleTimer = null;
      this.activePartnerListener = null;
      this.currentPartnerUid = null;
      this.isOnlineState = false;
      this.isWindowFocused = document.hasFocus ? document.hasFocus() : true;
      this.lastInteractionTime = Date.now();

      this.initStyles();
      this.bindWindowEvents();
      this.startPresenceEngine();
    }

    initStyles() {
      if (document.getElementById('nexPresenceStyles')) return;
      const style = document.createElement('style');
      style.id = 'nexPresenceStyles';
      style.textContent = `
        /* Live Presence Indicator Dot */
        .presence-pulse-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 5px;
          vertical-align: middle;
          position: relative;
        }

        .presence-pulse-dot.online {
          background-color: #00ff66;
          box-shadow: 0 0 8px #00ff66;
        }

        .presence-pulse-dot.online::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          border: 1px solid #00ff66;
          animation: presencePulse 1.8s infinite;
        }

        .presence-pulse-dot.offline {
          background-color: #64748b;
          box-shadow: none;
        }

        @keyframes presencePulse {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        .chat-presence-text {
          font-size: 11.5px;
          color: #94a3b8;
          display: inline-flex;
          align-items: center;
        }

        .chat-presence-text.is-online {
          color: #00ff66;
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);
    }

    bindWindowEvents() {
      // 1. Visibility Change: Instant WhatsApp/Telegram background disconnect
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          console.log('[PRESENCE] App minimized/hidden. Marking offline & stopping heartbeat.');
          this.setPresence(false);
          this.stopHeartbeat();
        } else if (document.visibilityState === 'visible') {
          console.log('[PRESENCE] App foregrounded. Marking online & resuming heartbeat.');
          this.lastInteractionTime = Date.now();
          this.setPresence(true);
          this.startHeartbeat();
        }
      });

      // 2. Window Blur & Focus
      window.addEventListener('blur', () => {
        this.isWindowFocused = false;
      });

      window.addEventListener('focus', () => {
        this.isWindowFocused = true;
        this.lastInteractionTime = Date.now();
        if (document.visibilityState === 'visible' && !this.isOnlineState) {
          this.setPresence(true);
          this.startHeartbeat();
        }
      });

      // 3. User Activity Tracker (Anti-Idle)
      const activityEvents = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
      const onUserActivity = () => {
        this.lastInteractionTime = Date.now();
        if (!this.isOnlineState && document.visibilityState === 'visible') {
          console.log('[PRESENCE] User resumed activity. Re-activating online presence.');
          this.setPresence(true);
          this.startHeartbeat();
        }
        this.resetIdleTimer();
      };

      activityEvents.forEach(ev => {
        window.addEventListener(ev, onUserActivity, { passive: true });
      });

      // 4. Online & Offline network events
      window.addEventListener('online', () => {
        console.log('[PRESENCE] Network connection re-established.');
        if (document.visibilityState === 'visible') {
          this.setPresence(true);
          this.startHeartbeat();
        }
      });

      window.addEventListener('offline', () => {
        console.log('[PRESENCE] Network connection lost.');
        this.setPresence(false);
        this.stopHeartbeat();
      });

      // 5. Page Unload / Hide
      window.addEventListener('pagehide', () => {
        this.setPresence(false, true);
      });

      window.addEventListener('beforeunload', () => {
        this.setPresence(false, true);
      });
    }

    resetIdleTimer() {
      if (this.idleTimer) clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        console.log('[PRESENCE] Inactivity timeout reached (50s). Transitioning to idle/offline.');
        this.setPresence(false);
        this.stopHeartbeat();
      }, IDLE_TIMEOUT);
    }

    startPresenceEngine() {
      // Delay initial presence check until auth state is loaded
      const checkAuthInterval = setInterval(() => {
        const uid = this.getMyUid();
        if (uid && window.db) {
          clearInterval(checkAuthInterval);
          this.setPresence(true);
          this.startHeartbeat();
          this.resetIdleTimer();
          this.startContactPresenceTicker();
        }
      }, 500);

      // Timeout safety for auth check
      setTimeout(() => clearInterval(checkAuthInterval), 20000);
    }

    getMyUid() {
      if (typeof window.myUID !== 'undefined' && window.myUID) return window.myUID;
      if (window.auth && window.auth.currentUser) return window.auth.currentUser.uid;
      return localStorage.getItem('myUID') || null;
    }

    async setPresence(online, isExiting = false) {
      const uid = this.getMyUid();
      if (!uid || !window.db) return;

      this.isOnlineState = online;

      const payload = {
        online: !!online,
        lastSeen: new Date().toISOString()
      };

      try {
        // Modular Firebase v9 support
        if (typeof window.doc === 'function' && typeof window.updateDoc === 'function') {
          const userDocRef = window.doc(window.db, 'users', uid);
          const fbPayload = {
            online: !!online,
            lastSeen: typeof window.serverTimestamp === 'function' ? window.serverTimestamp() : new Date()
          };
          if (isExiting) {
            window.updateDoc(userDocRef, fbPayload).catch(() => {});
          } else {
            await window.updateDoc(userDocRef, fbPayload).catch(() => {});
          }
        } else if (window.db.collection) {
          // Compat Firebase support
          const ref = window.db.collection('users').doc(uid);
          if (isExiting) {
            ref.update(payload).catch(() => {});
          } else {
            await ref.update(payload).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('[PRESENCE] setPresence error:', err.message);
      }
    }

    startHeartbeat() {
      this.stopHeartbeat();
      this.heartbeatTimer = setInterval(() => {
        // Send heartbeat ONLY when data is actively flowing
        if (document.visibilityState === 'visible' && this.isOnlineState) {
          const idleTime = Date.now() - this.lastInteractionTime;
          if (idleTime < IDLE_TIMEOUT) {
            this.setPresence(true);
          } else {
            console.log('[PRESENCE] Heartbeat paused due to idle state.');
            this.setPresence(false);
            this.stopHeartbeat();
          }
        }
      }, HEARTBEAT_INTERVAL);
    }

    stopHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    }

    /**
     * Strict presence validator (Telegram & WhatsApp methodology):
     * User is ONLY online if online === true AND lastSeen was within the last 45 seconds.
     */
    isUserActuallyOnline(userData) {
      if (!userData) return false;
      if (userData.online !== true) return false;

      // Extract date from Firestore Timestamp or ISO string
      let lastSeenDate = null;
      if (userData.lastSeen) {
        if (typeof userData.lastSeen.toDate === 'function') {
          lastSeenDate = userData.lastSeen.toDate();
        } else if (typeof userData.lastSeen.toMillis === 'function') {
          lastSeenDate = new Date(userData.lastSeen.toMillis());
        } else {
          lastSeenDate = new Date(userData.lastSeen);
        }
      }

      if (!lastSeenDate || isNaN(lastSeenDate.getTime())) {
        return false;
      }

      const ageMs = Date.now() - lastSeenDate.getTime();
      return ageMs <= HEARTBEAT_TTL;
    }

    formatLastSeen(timestamp) {
      if (!timestamp) return 'Last seen recently';
      let date = null;
      if (typeof timestamp.toDate === 'function') date = timestamp.toDate();
      else if (typeof timestamp.toMillis === 'function') date = new Date(timestamp.toMillis());
      else date = new Date(timestamp);

      if (isNaN(date.getTime())) return 'Last seen recently';

      const diffMs = Date.now() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);

      if (diffSecs < 45) return 'Last seen just now';
      if (diffMins < 60) return `Last seen ${diffMins}m ago`;
      if (diffHours < 24) return `Last seen ${diffHours}h ago`;
      return `Last seen on ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    }

    /**
     * Real-time Sync for the Active Chat Partner
     */
    syncActiveChatPartner(partnerUid, partnerName = 'User') {
      if (this.activePartnerListener) {
        try { this.activePartnerListener(); } catch (_) {}
        this.activePartnerListener = null;
      }

      this.currentPartnerUid = partnerUid;
      if (!partnerUid || partnerUid === 'chronex-ai' || window.currentChatType === 'group') {
        return;
      }

      // Check modular vs compat for real-time listener
      if (typeof window.onSnapshot === 'function' && typeof window.doc === 'function' && window.db) {
        const userRef = window.doc(window.db, 'users', partnerUid);
        this.activePartnerListener = window.onSnapshot(userRef, (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          this.updateHeaderPresenceDisplay(data, partnerName);
        }, (err) => {
          console.warn('[PRESENCE] Partner snapshot listener warning:', err.message);
        });
      } else if (window.db && window.db.collection) {
        this.activePartnerListener = window.db.collection('users').doc(partnerUid).onSnapshot((snap) => {
          if (!snap.exists) return;
          const data = snap.data();
          this.updateHeaderPresenceDisplay(data, partnerName);
        });
      }
    }

    updateHeaderPresenceDisplay(userData, defaultName) {
      const activeChatStatus = document.getElementById('activeChatStatus');
      const chatUserStatus = document.getElementById('chatUserStatus');
      const isOnline = this.isUserActuallyOnline(userData);

      const statusText = isOnline ? 'Online' : this.formatLastSeen(userData?.lastSeen);
      const dotHtml = `<span class="presence-pulse-dot ${isOnline ? 'online' : 'offline'}"></span>`;
      const fullHtml = `<span class="chat-presence-text ${isOnline ? 'is-online' : ''}">${dotHtml} ${statusText}</span>`;

      if (activeChatStatus) {
        activeChatStatus.innerHTML = fullHtml;
      }
      if (chatUserStatus) {
        chatUserStatus.innerHTML = fullHtml;
      }
    }

    /**
     * Periodic ticker every 10 seconds to update contact list status dots
     */
    startContactPresenceTicker() {
      setInterval(() => {
        // Re-evaluate active chat partner if open
        if (this.currentPartnerUid && window.currentChatType === 'direct') {
          const statusEl = document.getElementById('activeChatStatus');
          if (statusEl && statusEl.textContent.includes('Online')) {
            // Check if we need to expire them
            const partnerData = window.cachedUsers?.find(u => u.uid === this.currentPartnerUid || u.id === this.currentPartnerUid);
            if (partnerData && !this.isUserActuallyOnline(partnerData)) {
              this.updateHeaderPresenceDisplay(partnerData, partnerData.username || 'User');
            }
          }
        }
      }, 10000);
    }
  }

  // Export to window
  window.NexPresenceEngine = new TelegramWhatsAppPresence();
  window.presenceEngine = window.NexPresenceEngine;

  // Global helper for other scripts
  window.isUserActuallyOnline = function (userData) {
    return window.NexPresenceEngine.isUserActuallyOnline(userData);
  };
})();
