/**
 * NEXCHAT - Quantum AR Face Masks & Holo-Visors Engine
 * Real-time canvas procedural visual filters for WebRTC video streams,
 * identity anonymization, holographic HUD visors, and cyber face overlays.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and iconography.
 */

(function() {
  'use strict';

  const MASKS = [
    { id: 'none', label: 'Filter: None (Raw Video)' },
    { id: 'cyber_visor', label: 'Tactical Holo-Visor (Cyan / Green HUD)' },
    { id: 'cyborg_skull', label: 'Cyborg Ocular Plate (Neural Mesh)' },
    { id: 'glitch_phantom', label: 'Glitch Phantom (Encrypted Anonymizer)' },
    { id: 'golden_anubis', label: 'Apex Enclave (Golden Geometric Mask)' }
  ];

  class QuantumARMasksEngine {
    constructor() {
      this.activeMaskId = 'none';
      this.animFrameId = null;
      this.canvas = null;
      this.ctx = null;
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
      this.injectCallDockButton();
      this.injectMaskSelectorMenu();
    }

    injectCallDockButton() {
      const dock = document.querySelector('.active-call-dock');
      if (dock && !document.getElementById('toggleCallARMaskBtn')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'toggleCallARMaskBtn';
        btn.className = 'call-dock-btn';
        btn.title = 'Quantum AR Holo-Masks & Visors';
        btn.innerHTML = `<i class="fa-solid fa-masks-theater"></i>`;
        btn.addEventListener('click', () => this.toggleMaskSelectorMenu());

        const subBtn = document.getElementById('toggleCallSubtitlesBtn');
        if (subBtn) {
          dock.insertBefore(btn, subBtn.nextSibling);
        } else {
          dock.appendChild(btn);
        }
      }
    }

    injectMaskSelectorMenu() {
      const callContainer = document.querySelector('.active-call-container');
      if (callContainer && !document.getElementById('arMaskSelectorMenu')) {
        const menu = document.createElement('div');
        menu.id = 'arMaskSelectorMenu';
        menu.className = 'ar-mask-selector-menu';
        menu.style.display = 'none';

        menu.innerHTML = `
          <div class="ar-menu-header">
            <span class="ar-menu-title"><i class="fa-solid fa-masks-theater"></i> AR HOLO-MASKS</span>
            <button type="button" class="ar-menu-close" id="closeArMenuBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="ar-options-list">
            ${MASKS.map(m => `
              <button type="button" class="ar-option-btn ${m.id === this.activeMaskId ? 'active' : ''}" data-mask-id="${m.id}">
                ${m.label}
              </button>
            `).join('')}
          </div>
        `;

        callContainer.appendChild(menu);

        document.getElementById('closeArMenuBtn')?.addEventListener('click', () => {
          menu.style.display = 'none';
        });

        menu.querySelectorAll('.ar-option-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            menu.querySelectorAll('.ar-option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mId = btn.dataset.maskId;
            this.setMask(mId);
            menu.style.display = 'none';
          });
        });
      }
    }

    toggleMaskSelectorMenu() {
      const menu = document.getElementById('arMaskSelectorMenu');
      if (!menu) return;
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
    }

    setMask(maskId) {
      this.activeMaskId = maskId;

      const dockBtn = document.getElementById('toggleCallARMaskBtn');
      if (dockBtn) {
        dockBtn.classList.toggle('active', maskId !== 'none');
      }

      if (maskId === 'none') {
        this.stopMaskRenderer();
        if (typeof window.showNotif === 'function') window.showNotif('AR Mask disabled (raw video)', 'info', 1500);
      } else {
        this.startMaskRenderer();
        const maskObj = MASKS.find(m => m.id === maskId);
        if (typeof window.showNotif === 'function') {
          window.showNotif(`AR Filter Activated: ${maskObj ? maskObj.label : maskId}`, 'success', 2000);
        }
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
      }
    }

    ensureCanvas() {
      const callContainer = document.querySelector('.active-call-container');
      if (!callContainer) return null;

      let canvas = document.getElementById('arMaskOverlayCanvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'arMaskOverlayCanvas';
        canvas.className = 'ar-mask-overlay-canvas';
        callContainer.appendChild(canvas);
      }
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.resizeCanvas();
      return canvas;
    }

    resizeCanvas() {
      if (!this.canvas) return;
      const parent = this.canvas.parentElement;
      this.canvas.width = parent ? (parent.clientWidth || 640) : 640;
      this.canvas.height = parent ? (parent.clientHeight || 480) : 480;
    }

    startMaskRenderer() {
      this.ensureCanvas();
      if (!this.canvas || !this.ctx) return;
      this.canvas.style.display = 'block';

      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

      let step = 0;
      const render = () => {
        step++;
        if (this.activeMaskId === 'none') {
          if (this.canvas) this.canvas.style.display = 'none';
          return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2 - 20;

        if (this.activeMaskId === 'cyber_visor') {
          this.renderCyberVisor(cx, cy, step);
        } else if (this.activeMaskId === 'cyborg_skull') {
          this.renderCyborgSkull(cx, cy, step);
        } else if (this.activeMaskId === 'glitch_phantom') {
          this.renderGlitchPhantom(cx, cy, step);
        } else if (this.activeMaskId === 'golden_anubis') {
          this.renderGoldenAnubis(cx, cy, step);
        }

        this.animFrameId = requestAnimationFrame(render);
      };
      this.animFrameId = requestAnimationFrame(render);
    }

    stopMaskRenderer() {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      if (this.canvas) {
        this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.style.display = 'none';
      }
    }

    renderCyberVisor(cx, cy, step) {
      const ctx = this.ctx;
      const visorW = 240;
      const visorH = 64;
      const x = cx - visorW / 2;
      const y = cy - 20;

      // Glowing Visor Glass
      ctx.save();
      ctx.fillStyle = 'rgba(0, 212, 255, 0.22)';
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.moveTo(x + 20, y);
      ctx.lineTo(x + visorW - 20, y);
      ctx.lineTo(x + visorW, y + visorH);
      ctx.lineTo(x, y + visorH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Scanline beam
      const scanY = y + ((step * 2) % visorH);
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x, scanY);
      ctx.lineTo(x + visorW, scanY);
      ctx.stroke();

      // HUD Telemetry text
      ctx.fillStyle = '#00ff66';
      ctx.font = '700 9px monospace';
      ctx.fillText(`SYS: OPTICAL // 98.4% LOCK`, x + 10, y + 15);
      ctx.fillText(`TARGET: ENCLAVE_01`, x + visorW - 130, y + 15);

      // Target reticle
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 15, cy + 5, 30, 20);
      ctx.restore();
    }

    renderCyborgSkull(cx, cy, step) {
      const ctx = this.ctx;
      ctx.save();

      // Metallic right-side faceplate
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 60);
      ctx.lineTo(cx + 90, cy - 30);
      ctx.lineTo(cx + 100, cy + 60);
      ctx.lineTo(cx + 40, cy + 90);
      ctx.lineTo(cx, cy + 60);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crimson ocular glowing eye
      const eyeX = cx + 45;
      const eyeY = cy - 5;
      const pulse = 10 + Math.sin(step * 0.1) * 3;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = pulse * 2;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Neural connection traces
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(eyeX + 8, eyeY);
      ctx.lineTo(eyeX + 40, eyeY - 15);
      ctx.lineTo(eyeX + 50, eyeY + 20);
      ctx.stroke();

      ctx.restore();
    }

    renderGlitchPhantom(cx, cy, step) {
      const ctx = this.ctx;
      ctx.save();

      const boxW = 220;
      const boxH = 140;
      const x = cx - boxW / 2;
      const y = cy - 50;

      // Digital Pixelation / Noise Blocks
      for (let i = 0; i < 18; i++) {
        const bx = x + Math.random() * (boxW - 30);
        const by = y + Math.random() * (boxH - 20);
        const bw = 20 + Math.random() * 40;
        const bh = 10 + Math.random() * 15;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0, 255, 102, 0.25)' : 'rgba(0, 212, 255, 0.25)';
        ctx.fillRect(bx, by, bw, bh);
      }

      // Encrypted hex stream
      ctx.fillStyle = '#00ff66';
      ctx.font = '700 11px monospace';
      ctx.fillText('[ENCLAVE IDENTITY MASK ACTIVE]', cx - 105, cy + 60);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 9px monospace';
      ctx.fillText(`0x${(step * 1337).toString(16).toUpperCase()} // ANONYMIZED_NODE`, cx - 85, cy + 75);

      ctx.restore();
    }

    renderGoldenAnubis(cx, cy, step) {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;

      // Geometric Apex Facet Mask
      ctx.beginPath();
      ctx.moveTo(cx, cy - 80);
      ctx.lineTo(cx - 70, cy - 20);
      ctx.lineTo(cx - 40, cy + 70);
      ctx.lineTo(cx, cy + 90);
      ctx.lineTo(cx + 40, cy + 70);
      ctx.lineTo(cx + 70, cy - 20);
      ctx.closePath();
      ctx.stroke();

      // Center forehead prism
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 60);
      ctx.lineTo(cx - 20, cy - 30);
      ctx.lineTo(cx + 20, cy - 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  window.quantumARMasksEngine = new QuantumARMasksEngine();
})();
