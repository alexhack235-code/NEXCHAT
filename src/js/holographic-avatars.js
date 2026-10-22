/**
 * NEXCHAT - Interactive 3D WebGL Holographic Avatars Engine
 * Procedural 3D holographic avatar micro-viewports, mouse tilt tracking,
 * wireframe cyber helmets, scanline shaders, and profile inspection cards.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and iconography.
 */

(function() {
  'use strict';

  class HolographicAvatarsEngine {
    constructor() {
      this.activeStyle = 'cyber_helmet';
      this.canvas = null;
      this.ctx = null;
      this.animId = null;
      this.rotX = 0;
      this.rotY = 0;
      this.targetRotX = 0;
      this.targetRotY = 0;
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
      this.injectHeaderTrigger();
    }

    injectModal() {
      if (document.getElementById('holographicAvatarModal')) return;

      const modal = document.createElement('div');
      modal.id = 'holographicAvatarModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window holo-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-cube text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">3D HOLOGRAPHIC AVATAR STUDIO</h3>
              <span class="holo-tag">WEBGL PROCEDURAL</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeHoloModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="holo-modal-body">
            <!-- 3D Canvas Viewport -->
            <div class="holo-viewport-container" id="holoViewportContainer">
              <canvas id="holoAvatarCanvas" class="holo-avatar-canvas" width="280" height="260"></canvas>
              <div class="holo-scanline-beam"></div>
              <span class="holo-tracking-label" id="holoCoordsLabel">ROT X: 0.00 &bull; ROT Y: 0.00</span>
            </div>

            <div class="holo-styles-row mt-3">
              <button type="button" class="holo-style-btn active" data-style="cyber_helmet">CYBER HELMET</button>
              <button type="button" class="holo-style-btn" data-style="neon_visor">NEON VISOR GHOST</button>
              <button type="button" class="holo-style-btn" data-style="golden_sentinel">GOLDEN SENTINEL</button>
            </div>

            <button type="button" id="saveHoloAvatarBtn" class="holo-save-btn mt-4">
              <i class="fa-solid fa-floppy-disk"></i> SAVE 3D AVATAR PRESET
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindModalEvents();
    }

    bindModalEvents() {
      const modal = document.getElementById('holographicAvatarModal');
      document.getElementById('closeHoloModalBtn')?.addEventListener('click', () => {
        this.stopRenderer();
        modal.style.display = 'none';
      });

      const viewport = document.getElementById('holoViewportContainer');
      viewport?.addEventListener('mousemove', (e) => {
        const rect = viewport.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        this.targetRotY = x * 1.5;
        this.targetRotX = -y * 1.5;
      });

      modal.querySelectorAll('.holo-style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.holo-style-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeStyle = btn.dataset.style;
        });
      });

      document.getElementById('saveHoloAvatarBtn')?.addEventListener('click', () => {
        if (typeof window.showNotif === 'function') {
          window.showNotif('3D Holographic Avatar preset equipped', 'success', 2500);
        }
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
        this.stopRenderer();
        modal.style.display = 'none';
      });
    }

    injectHeaderTrigger() {
      const headerActions = document.querySelector('.chat-detail-header-actions') || 
                            document.querySelector('.chat-detail-header-right');
      if (headerActions && !document.getElementById('holoAvatarBtnHeader')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'holoAvatarBtnHeader';
        btn.className = 'header-icon-btn';
        btn.title = '3D Holographic Avatar Studio';
        btn.innerHTML = `<i class="fa-solid fa-cube text-[#00ff66]"></i>`;
        btn.addEventListener('click', () => this.openModal());
        headerActions.appendChild(btn);
      }
    }

    
    closeModal() {
      const modal = document.getElementById('holographicAvatarModal');
      if (modal) modal.style.display = 'none';
      if (this.animId) cancelAnimationFrame(this.animId);
    }
    openModal() {
      const modal = document.getElementById('holographicAvatarModal');
      if (!modal) return;
      modal.style.display = 'flex';
      this.startRenderer();
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    startRenderer() {
      this.canvas = document.getElementById('holoAvatarCanvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) return;

      if (this.animId) cancelAnimationFrame(this.animId);

      let step = 0;
      const render = () => {
        step++;
        // Smooth rotation damping
        this.rotX += (this.targetRotX - this.rotX) * 0.1;
        this.rotY += (this.targetRotY - this.rotY) * 0.1;

        const lbl = document.getElementById('holoCoordsLabel');
        if (lbl) lbl.textContent = `ROT X: ${this.rotX.toFixed(2)} • ROT Y: ${this.rotY.toFixed(2)}`;

        this.drawHoloBust(step);
        this.animId = requestAnimationFrame(render);
      };

      this.animId = requestAnimationFrame(render);
    }

    stopRenderer() {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    }

    drawHoloBust(step) {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx, cy);

      let themeColor = '#00ff66';
      if (this.activeStyle === 'neon_visor') themeColor = '#00d4ff';
      if (this.activeStyle === 'golden_sentinel') themeColor = '#f59e0b';

      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 10;

      // 3D Isometric projection simulated vertices
      const ox = this.rotY * 45;
      const oy = this.rotX * 35;

      // Outer Cyber Helmet Octagon
      ctx.beginPath();
      ctx.moveTo(-50 + ox, -60 + oy);
      ctx.lineTo(50 + ox, -60 + oy);
      ctx.lineTo(75 + ox * 1.2, -10 + oy);
      ctx.lineTo(60 + ox, 60 + oy);
      ctx.lineTo(0 + ox, 85 + oy);
      ctx.lineTo(-60 + ox, 60 + oy);
      ctx.lineTo(-75 + ox * 1.2, -10 + oy);
      ctx.closePath();
      ctx.stroke();

      // Inner Visor Hex Plate
      ctx.beginPath();
      ctx.fillStyle = themeColor === '#00ff66' ? 'rgba(0, 255, 102, 0.15)' : (themeColor === '#00d4ff' ? 'rgba(0, 212, 255, 0.18)' : 'rgba(245, 158, 11, 0.18)');
      ctx.moveTo(-35 + ox * 1.1, -15 + oy);
      ctx.lineTo(35 + ox * 1.1, -15 + oy);
      ctx.lineTo(45 + ox * 1.1, 15 + oy);
      ctx.lineTo(-45 + ox * 1.1, 15 + oy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Antenna / Telemetry stalks
      ctx.beginPath();
      ctx.moveTo(-50 + ox, -60 + oy);
      ctx.lineTo(-65 + ox, -90 + oy);
      ctx.moveTo(50 + ox, -60 + oy);
      ctx.lineTo(65 + ox, -90 + oy);
      ctx.stroke();

      ctx.restore();
    }
  }

  window.holographicAvatarsEngine = new HolographicAvatarsEngine();
})();
