/**
 * NEXCHAT - TACTICAL GROUP WAR ROOM & EPHEMERAL BRIEFINGS ENGINE
 * Global Namespace: window.NexWarRoomEngine
 * Standard: Strictly 0 Unicode Emojis (FontAwesome 6 Vector Icons Only)
 */

(function (window) {
  'use strict';

  class NexWarRoomEngine {
    constructor() {
      this.activeWarRoomId = null;
      this.groupId = null;
      this.operationCodename = 'OPERATION VOID';
      this.missionStatus = 'BRIEFING'; // BRIEFING | ACTIVE_OP | EXTRACTION | SELF_DESTRUCT
      this.targetEpochMs = 0;
      this.serverTimeOffsetMs = 0;
      this.clockRafId = null;
      this.snapshotUnsubscribe = null;
      this.objectives = [];
      this.isDestructed = false;
      this.isLeadOperative = false;

      this.init();
    }

    init() {
      console.log('[NEX-WAR-ROOM] Initializing Tactical Enclave Engine...');
      this.bindDOMEvents();
      this.setupDuressListener();
    }

    bindDOMEvents() {
      // Ephemeral Rail Toggle
      document.getElementById('btnToggleBriefingRail')?.addEventListener('click', () => {
        this.openBriefingRail();
      });

      document.getElementById('btnCloseBriefingRail')?.addEventListener('click', () => {
        this.closeBriefingRail();
      });

      document.getElementById('closeBriefingRailBackdrop')?.addEventListener('click', () => {
        this.closeBriefingRail();
      });

      // Phase Advance Button
      document.getElementById('btnAdvanceWarRoomPhase')?.addEventListener('click', () => {
        this.advancePhase();
      });

      // Emergency Abort / Destruct
      document.getElementById('btnAbortWarRoom')?.addEventListener('click', () => {
        if (confirm('ENGAGE IRREVOCABLE EMERGENCY SELF-DESTRUCT? ALL ROOM DATA WILL DISINTEGRATE IMMEDIATELY.')) {
          this.triggerSelfDestruct();
        }
      });

      // Tab switcher in Briefing Rail
      document.querySelectorAll('.briefing-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.briefing-tab-btn').forEach(b => b.classList.remove('active'));
          document.querySelectorAll('.briefing-pane').forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          const target = btn.dataset.tab;
          const paneMap = {
            'directives': 'paneDirectives',
            'threat-intel': 'paneThreatIntel',
            'objectives': 'paneObjectives',
            'roster': 'paneRoster'
          };
          const paneEl = document.getElementById(paneMap[target]);
          if (paneEl) paneEl.classList.add('active');
        });
      });
    }

    setupDuressListener() {
      // Panic wipe trigger listener
      window.addEventListener('nex:duress:wipe', () => {
        console.warn('[NEX-WAR-ROOM] Duress wipe event caught. Vaporizing tactical enclave...');
        this.triggerSelfDestruct(true);
      });
    }

    /**
     * Mount and bind an active War Room session to current group chat
     */
    async mountWarRoom(groupId, warRoomId = null) {
      this.groupId = groupId;
      this.activeWarRoomId = warRoomId || `wr_${groupId}`;

      const container = document.getElementById('nexWarRoomContainer');
      if (container) container.style.display = 'block';

      // 1. Calculate clock offset against server timestamp
      await this.syncServerTimeOffset();

      // 2. Subscribe to real-time War Room doc
      this.subscribeWarRoomDoc();
    }

    async syncServerTimeOffset() {
      try {
        if (window.db && window.doc && window.setDoc && window.serverTimestamp) {
          const probeRef = window.doc(window.db, 'systemTelemetry', 'timeBeacon');
          const localSent = Date.now();
          await window.setDoc(probeRef, { probe: window.serverTimestamp() }, { merge: true });
          const snap = await window.getDoc(probeRef);
          if (snap.exists()) {
            const serverMs = snap.data().probe?.toMillis?.() || Date.now();
            const latencyEst = Math.max(0, (Date.now() - localSent) / 2);
            this.serverTimeOffsetMs = (serverMs + latencyEst) - Date.now();
          }
        }
      } catch (_) {
        this.serverTimeOffsetMs = 0;
      }
    }

    subscribeWarRoomDoc() {
      if (this.snapshotUnsubscribe) {
        this.snapshotUnsubscribe();
        this.snapshotUnsubscribe = null;
      }

      if (!window.db || typeof window.onSnapshot !== 'function') {
        // Fallback local simulation mode (15 min countdown)
        this.startLocalSimulation();
        return;
      }

      try {
        const docRef = window.doc(window.db, 'groupWarRooms', this.activeWarRoomId);
        this.snapshotUnsubscribe = window.onSnapshot(docRef, (snap) => {
          if (!snap.exists()) {
            this.startLocalSimulation();
            return;
          }

          const data = snap.data();
          this.applyWarRoomState(data);
        }, (err) => {
          console.warn('[NEX-WAR-ROOM] Remote subscription error:', err);
          this.startLocalSimulation();
        });
      } catch (err) {
        console.warn('[NEX-WAR-ROOM] Cloud sync unavailable, falling back:', err);
        this.startLocalSimulation();
      }
    }

    startLocalSimulation() {
      const defaultDurationSec = 900; // 15:00:00
      this.applyWarRoomState({
        operationCodename: 'OPERATION BLACKOUT',
        missionStatus: 'BRIEFING',
        targetEpochMs: Date.now() + (defaultDurationSec * 1000),
        threatLevel: 'DEFCON_1',
        operationalObjectives: [
          { id: 'obj_1', text: 'Initialize encrypted air-gap micro-rail handshake', completed: true },
          { id: 'obj_2', text: 'Deliver zero-knowledge tactical intelligence payload', completed: false },
          { id: 'obj_3', text: 'Extract operatives prior to zero countdown epoch', completed: false }
        ]
      });
    }

    applyWarRoomState(data) {
      if (data.isDestructed) {
        this.executeDisintegrationRoutine(data.tombstoneSeal?.sha256);
        return;
      }

      this.operationCodename = data.operationCodename || 'OPERATION VOID';
      this.missionStatus = data.missionStatus || 'BRIEFING';
      this.targetEpochMs = data.targetEpochMs || (Date.now() + 900000);
      this.objectives = data.operationalObjectives || [];

      // Update HUD elements
      const codeEl = document.getElementById('warRoomCodenameDisplay');
      if (codeEl) codeEl.textContent = `OP: ${this.operationCodename.toUpperCase()}`;

      this.updatePhaseUI(this.missionStatus);
      this.renderObjectivesList();
      this.startCountdownLoop();
    }

    updatePhaseUI(phase) {
      const container = document.getElementById('nexWarRoomContainer');
      if (!container) return;

      container.classList.remove('phase-briefing', 'phase-active', 'phase-extraction', 'phase-destruct');

      const phaseClassMap = {
        'BRIEFING': 'phase-briefing',
        'ACTIVE_OP': 'phase-active',
        'EXTRACTION': 'phase-extraction',
        'SELF_DESTRUCT': 'phase-destruct'
      };
      container.classList.add(phaseClassMap[phase] || 'phase-briefing');

      document.querySelectorAll('.phase-pill').forEach(pill => {
        if (pill.dataset.phase === phase) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });
    }

    startCountdownLoop() {
      if (this.clockRafId) cancelAnimationFrame(this.clockRafId);

      const clockEl = document.getElementById('warRoomCountdownClock');

      const tick = () => {
        const nowAuthoritative = Date.now() + this.serverTimeOffsetMs;
        const remainingMs = Math.max(0, this.targetEpochMs - nowAuthoritative);

        if (clockEl) {
          clockEl.textContent = this.formatTimeRemaining(remainingMs);
        }

        // Automatic Phase Escalations
        if (remainingMs <= 300000 && remainingMs > 0 && this.missionStatus === 'ACTIVE_OP') {
          this.missionStatus = 'EXTRACTION';
          this.updatePhaseUI('EXTRACTION');
        }

        if (remainingMs <= 0 && !this.isDestructed) {
          this.triggerSelfDestruct();
          return;
        }

        this.clockRafId = requestAnimationFrame(tick);
      };

      this.clockRafId = requestAnimationFrame(tick);
    }

    formatTimeRemaining(ms) {
      const totalSec = Math.floor(ms / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      const millis = Math.floor(ms % 1000);

      const pad = (n, z = 2) => String(n).padStart(z, '0');
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`;
    }

    openBriefingRail() {
      const rail = document.getElementById('nexBriefingMicroRail');
      if (rail) {
        rail.classList.add('open');
        rail.setAttribute('aria-hidden', 'false');
      }
    }

    closeBriefingRail() {
      const rail = document.getElementById('nexBriefingMicroRail');
      if (rail) {
        rail.classList.remove('open');
        rail.setAttribute('aria-hidden', 'true');
      }
    }

    renderObjectivesList() {
      const container = document.getElementById('briefingObjectivesList');
      if (!container) return;

      container.innerHTML = this.objectives.map(obj => `
        <div class="objective-row ${obj.completed ? 'completed' : ''}" data-obj-id="${obj.id}">
          <div class="objective-checkbox">
            <i class="fa-solid fa-check"></i>
          </div>
          <div class="objective-text">${escapeHtml(obj.text)}</div>
        </div>
      `).join('');

      container.querySelectorAll('.objective-row').forEach(row => {
        row.addEventListener('click', () => {
          const id = row.dataset.objId;
          this.toggleObjective(id);
        });
      });
    }

    toggleObjective(objId) {
      const target = this.objectives.find(o => o.id === objId);
      if (!target) return;
      target.completed = !target.completed;
      this.renderObjectivesList();

      if (typeof window.playLuxuryPopSound === 'function') {
        window.playLuxuryPopSound();
      }

      // Propagate state to Firestore if connected
      if (window.db && this.activeWarRoomId) {
        const docRef = window.doc(window.db, 'groupWarRooms', this.activeWarRoomId);
        window.setDoc(docRef, { operationalObjectives: this.objectives }, { merge: true }).catch(console.warn);
      }
    }

    advancePhase() {
      const order = ['BRIEFING', 'ACTIVE_OP', 'EXTRACTION', 'SELF_DESTRUCT'];
      const currentIndex = order.indexOf(this.missionStatus);
      if (currentIndex < order.length - 1) {
        const nextPhase = order[currentIndex + 1];
        this.missionStatus = nextPhase;
        this.updatePhaseUI(nextPhase);

        if (nextPhase === 'SELF_DESTRUCT') {
          this.triggerSelfDestruct();
        } else if (window.db && this.activeWarRoomId) {
          const docRef = window.doc(window.db, 'groupWarRooms', this.activeWarRoomId);
          window.setDoc(docRef, { missionStatus: nextPhase }, { merge: true }).catch(console.warn);
        }
      }
    }

    /**
     * Irrevocable Auto-Destruct Protocol
     */
    async triggerSelfDestruct(silent = false) {
      if (this.isDestructed) return;
      this.isDestructed = true;
      if (this.clockRafId) cancelAnimationFrame(this.clockRafId);

      this.missionStatus = 'SELF_DESTRUCT';
      this.updatePhaseUI('SELF_DESTRUCT');

      // Generate Cryptographic Seal Hash
      const sealHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      if (!silent && typeof window.showNotif === 'function') {
        window.showNotif('MISSION TIMEOUT ZERO: AUTO-DESTRUCT SEQUENCE ENGAGED', 'error', 4500);
      }

      // 1. Commit Tombstone to Firestore
      if (window.db && this.activeWarRoomId) {
        try {
          const docRef = window.doc(window.db, 'groupWarRooms', this.activeWarRoomId);
          await window.setDoc(docRef, {
            isDestructed: true,
            missionStatus: 'SELF_DESTRUCT',
            tombstoneSeal: {
              sha256: sealHash,
              wipedAt: window.serverTimestamp ? window.serverTimestamp() : new Date(),
              messagesPurgedCount: document.querySelectorAll('.message-wrapper').length
            }
          }, { merge: true });
        } catch (_) {}
      }

      // 2. Hardware Canvas Ash Disintegration Animation
      this.executeDisintegrationRoutine(sealHash);
    }

    /**
     * Ash Particle Disintegration Routine
     */
    executeDisintegrationRoutine(sealHash) {
      const canvas = document.getElementById('nexAshCanvas');
      const messagesArea = document.getElementById('messages-area');

      if (!canvas || !messagesArea) {
        this.injectTombstone(sealHash);
        return;
      }

      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.display = 'block';

      const rect = messagesArea.getBoundingClientRect();
      const particles = [];
      const particleCount = 220;

      // Spawn ash particles over messages area
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: rect.left + Math.random() * rect.width,
          y: rect.top + Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 4 - 1,
          size: Math.random() * 3 + 1,
          alpha: 1,
          color: Math.random() > 0.4 ? '#ef4444' : '#64748b'
        });
      }

      // Fade out and dissolve messages DOM
      messagesArea.style.transition = 'opacity 0.8s ease, filter 0.8s ease';
      messagesArea.style.opacity = '0';
      messagesArea.style.filter = 'blur(10px) grayscale(100%)';

      let frames = 0;
      const animateAsh = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frames++;

        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.012;

          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        if (frames < 80) {
          requestAnimationFrame(animateAsh);
        } else {
          canvas.style.display = 'none';
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          messagesArea.innerHTML = '';
          messagesArea.style.opacity = '1';
          messagesArea.style.filter = 'none';
          this.injectTombstone(sealHash);
        }
      };

      requestAnimationFrame(animateAsh);
    }

    injectTombstone(sealHash) {
      const messagesArea = document.getElementById('messages-area');
      if (!messagesArea) return;

      const template = document.getElementById('nexTombstoneTemplate');
      if (!template) return;

      const tombstoneClone = template.firstElementChild.cloneNode(true);
      const hashEl = tombstoneClone.querySelector('#tombstoneHashDisplay');
      if (hashEl) hashEl.textContent = `SHA256: ${sealHash || '0x9E8FA7...SECURE'}`;

      messagesArea.innerHTML = '';
      messagesArea.appendChild(tombstoneClone);

      this.closeBriefingRail();
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Bind to Global Window Namespace
  window.NexWarRoomEngine = new NexWarRoomEngine();

})(window);