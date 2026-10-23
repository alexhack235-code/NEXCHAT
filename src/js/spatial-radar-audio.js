/**
 * NEXCHAT - Spatial 3D Radar Proximity Voice Grid Engine
 * Tactical 2D acoustic radar map, Web Audio stereo panning & distance attenuation,
 * drag-and-drop avatar movement, and localized whisper enclaves.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and iconography.
 */

(function() {
  'use strict';

  class SpatialRadarAudioEngine {
    constructor() {
      this.myPos = { x: 250, y: 250 };
      this.peers = [
        { id: 'u_operative_404', name: 'Cyber Commander', x: 250, y: 150, role: 'host', color: '#00ff66' },
        { id: 'u_chronex_ai', name: 'ChronEX AI', x: 140, y: 220, role: 'ai', color: '#00d4ff' },
        { id: 'u_synth_coder', name: 'Synth Operative', x: 360, y: 280, role: 'speaker', color: '#a855f7' }
      ];
      this.isDragging = false;
      this.audioCtx = null;
      this.pannerNode = null;
      this.gainNode = null;
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
    }

    injectHeaderTrigger() {
      this.bindHeaderTrigger();
    }

    injectModal() {
      if (document.getElementById('spatialRadarModal')) return;

      const modal = document.createElement('div');
      modal.id = 'spatialRadarModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window radar-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-radar text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">TACTICAL SPATIAL RADAR</h3>
              <span class="radar-status-badge">ACOUSTIC MESH LIVE</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeRadarModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="radar-modal-body">
            <div class="radar-instructions">
              <span class="text-[11px] text-gray-300">
                DRAG OR USE WASD TO MOVE YOUR BLIP. Operatives closer to you sound louder; audio pans dynamically to your left/right ear.
              </span>
            </div>

            <!-- Radar Grid Viewport -->
            <div class="radar-viewport-container" id="radarViewport">
              <div class="radar-sweep-beam"></div>
              <div class="radar-concentric-ring ring-1"></div>
              <div class="radar-concentric-ring ring-2"></div>
              <div class="radar-concentric-ring ring-3"></div>

              <!-- Acoustic Zones -->
              <div class="radar-zone zone-podium">
                <span class="zone-label">MAIN PODIUM</span>
              </div>
              <div class="radar-zone zone-whisper">
                <span class="zone-label">WHISPER ENCLAVE</span>
              </div>

              <!-- Peer Blips -->
              <div class="radar-blips-layer" id="radarBlipsLayer">
                <!-- Rendered dynamically -->
              </div>
            </div>

            <div class="radar-metrics-footer mt-3">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">YOUR COORDINATES: <strong class="text-white" id="radarCoordText">X: 250, Y: 250</strong></span>
                <span class="text-gray-400">PROXIMITY ATTENUATION: <strong class="text-[#00ff66]" id="radarProximityGain">100% STEREO</strong></span>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindModalEvents();
      this.renderRadarBlips();
    }

    bindModalEvents() {
      const modal = document.getElementById('spatialRadarModal');
      document.getElementById('closeRadarModalBtn')?.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });

      const viewport = document.getElementById('radarViewport');
      if (viewport) {
        viewport.addEventListener('mousedown', (e) => {
          this.handleMoveToCursor(e);
          this.isDragging = true;
        });

        viewport.addEventListener('mousemove', (e) => {
          if (this.isDragging) this.handleMoveToCursor(e);
        });

        window.addEventListener('mouseup', () => {
          this.isDragging = false;
        });
      }

      // WASD / Arrow Keys movement
      window.addEventListener('keydown', (e) => {
        if (!modal || modal.style.display === 'none') return;
        const step = 15;
        let moved = false;

        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
          this.myPos.y = Math.max(30, this.myPos.y - step);
          moved = true;
        } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
          this.myPos.y = Math.min(450, this.myPos.y + step);
          moved = true;
        } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
          this.myPos.x = Math.max(30, this.myPos.x - step);
          moved = true;
        } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
          this.myPos.x = Math.min(470, this.myPos.x + step);
          moved = true;
        }

        if (moved) {
          e.preventDefault();
          this.updateRadarPositions();
        }
      });
    }

    bindHeaderTrigger() {
      const headerActions = document.querySelector('.chat-detail-header-actions') || 
                            document.querySelector('.chat-detail-header-right');
      if (headerActions && !document.getElementById('spatialRadarBtnHeader')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'spatialRadarBtnHeader';
        btn.className = 'header-icon-btn';
        btn.title = 'Tactical Spatial 3D Audio Radar';
        btn.innerHTML = `<i class="fa-solid fa-radar text-[#00d4ff]"></i>`;
        btn.addEventListener('click', () => this.openModal());
        headerActions.insertBefore(btn, headerActions.children[2] || null);
      }
    }

    openModal() {
      const modal = document.getElementById('spatialRadarModal');
      if (!modal) return;
      modal.style.display = 'flex';
      this.updateRadarPositions();
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    handleMoveToCursor(e) {
      const viewport = document.getElementById('radarViewport');
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const x = Math.max(25, Math.min(475, e.clientX - rect.left));
      const y = Math.max(25, Math.min(455, e.clientY - rect.top));
      this.myPos = { x, y };
      this.updateRadarPositions();
    }

    renderRadarBlips() {
      const layer = document.getElementById('radarBlipsLayer');
      if (!layer) return;

      layer.innerHTML = `
        <!-- My Avatar Blip with Proximity Range -->
        <div class="radar-blip my-blip" id="myRadarBlip" style="left: ${this.myPos.x}px; top: ${this.myPos.y}px;">
          <div class="radar-proximity-ring"></div>
          <div class="blip-core my-core"></div>
          <span class="blip-tag">YOU</span>
        </div>

        <!-- Peer Blips -->
        ${this.peers.map(p => `
          <div class="radar-blip peer-blip" id="peerBlip_${p.id}" style="left: ${p.x}px; top: ${p.y}px;">
            <div class="blip-core" style="background: ${p.color}; box-shadow: 0 0 10px ${p.color};"></div>
            <span class="blip-tag">${p.name}</span>
          </div>
        `).join('')}
      `;
    }

    updateRadarPositions() {
      const myBlip = document.getElementById('myRadarBlip');
      if (myBlip) {
        myBlip.style.left = `${this.myPos.x}px`;
        myBlip.style.top = `${this.myPos.y}px`;
      }

      const coordEl = document.getElementById('radarCoordText');
      if (coordEl) coordEl.textContent = `X: ${Math.round(this.myPos.x)}, Y: ${Math.round(this.myPos.y)}`;

      // Calculate nearest peer audio metrics
      let nearestDist = 999999;
      let nearestPan = 0;

      this.peers.forEach(p => {
        const dx = p.x - this.myPos.x;
        const dy = p.y - this.myPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          // Pan from -1.0 (left) to 1.0 (right)
          nearestPan = Math.max(-1, Math.min(1, dx / 150));
        }
      });

      const gainPct = Math.max(15, Math.min(100, Math.round(100 - (nearestDist / 3.5))));
      const gainEl = document.getElementById('radarProximityGain');
      if (gainEl) {
        const panSide = nearestPan < -0.2 ? 'LEFT EAR' : (nearestPan > 0.2 ? 'RIGHT EAR' : 'CENTER');
        gainEl.textContent = `${gainPct}% GAIN [${panSide}]`;
      }
    }
  }

  window.spatialRadarAudioEngine = new SpatialRadarAudioEngine();
})();
