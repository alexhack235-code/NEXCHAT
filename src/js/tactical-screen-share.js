/**
 * NEXCHAT - Dual-Screen Tactical Screen Share & Telestrator Engine
 * Module: src/js/tactical-screen-share.js
 * 
 * Provides 60 FPS WebRTC screen sharing with an interactive transparent telestrator canvas,
 * featuring tactical laser pointer, target reticles, and collaborative drawing tools.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  let screenStream = null;
  let activeTool = 'pen'; // 'pen' | 'laser' | 'reticle'
  let drawColor = '#00f3ff';
  let isDrawing = false;

  const NexTacticalScreenShare = {
    async startScreenShare() {
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 60 },
          audio: true
        });

        this.openOverlay(screenStream);
      } catch (err) {
        console.warn('[TACTICAL SCREEN SHARE] Stream aborted:', err.message);
      }
    },

    openOverlay(stream) {
      let modal = document.getElementById('tacticalScreenModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'tacticalScreenModal';
        modal.className = 'cyber-modal-overlay';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:99999; display:flex; flex-direction:column; padding:12px; overflow-y:auto;';
        modal.innerHTML = `
          <!-- Header Toolbar -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:10px 14px; background:rgba(9,13,22,0.9); border:1px solid rgba(0,243,255,0.25); border-radius:10px; margin-bottom:10px;">
            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
              <span style="font-size:12px; font-weight:800; color:#00f3ff; text-transform:uppercase; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-display"></i> TACTICAL SCREEN SHARE (60 FPS)
              </span>
              <div style="display:flex; gap:6px;">
                <button type="button" id="toolLaserBtn" style="padding:5px 10px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:4px; font-size:11px; cursor:pointer;">
                  <i class="fa-solid fa-crosshairs"></i> Laser
                </button>
                <button type="button" id="toolPenBtn" style="padding:5px 10px; background:rgba(0,243,255,0.2); border:1px solid #00f3ff; color:#00f3ff; border-radius:4px; font-size:11px; cursor:pointer;">
                  <i class="fa-solid fa-pen"></i> Pen
                </button>
                <button type="button" id="toolReticleBtn" style="padding:5px 10px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:4px; font-size:11px; cursor:pointer;">
                  <i class="fa-solid fa-bullseye"></i> Reticle
                </button>
              </div>
              <div style="display:flex; gap:4px; margin-left:8px;">
                <button type="button" class="btn-color" data-color="#00f3ff" style="width:20px; height:20px; border-radius:50%; background:#00f3ff; border:2px solid #fff; cursor:pointer;"></button>
                <button type="button" class="btn-color" data-color="#ffd700" style="width:20px; height:20px; border-radius:50%; background:#ffd700; border:1px solid rgba(255,255,255,0.4); cursor:pointer;"></button>
                <button type="button" class="btn-color" data-color="#ef4444" style="width:20px; height:20px; border-radius:50%; background:#ef4444; border:1px solid rgba(255,255,255,0.4); cursor:pointer;"></button>
              </div>
            </div>

            <div style="display:flex; gap:8px;">
              <button type="button" id="btnClearTelestrator" style="padding:6px 12px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:6px; font-size:11px; cursor:pointer;">
                <i class="fa-solid fa-eraser"></i> Clear
              </button>
              <button type="button" id="btnCloseTacticalScreen" style="padding:6px 14px; background:#ef4444; border:none; color:#fff; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-stop"></i> Stop Share
              </button>
            </div>
          </div>

          <!-- Viewport with Video & Canvas Overlay -->
          <div style="position:relative; flex:1; background:#000; border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center;">
            <video id="tacticalScreenVideo" playsinline autoplay muted style="width:100%; height:100%; object-fit:contain;"></video>
            <canvas id="telestratorCanvas" style="position:absolute; inset:0; width:100%; height:100%; pointer-events:auto; cursor:crosshair;"></canvas>
          </div>
        `;
        document.body.appendChild(modal);

        this.bindModalEvents();
      }

      modal.style.display = 'flex';
      const video = document.getElementById('tacticalScreenVideo');
      if (video && stream) {
        video.srcObject = stream;
      }
      this.initTelestratorCanvas();
    },

    bindModalEvents() {
      const modal = document.getElementById('tacticalScreenModal');
      if (!modal) return;

      modal.querySelector('#btnCloseTacticalScreen')?.addEventListener('click', () => {
        this.stopScreenShare();
      });

      modal.querySelector('#toolLaserBtn')?.addEventListener('click', () => {
        activeTool = 'laser';
        this.updateToolButtons();
      });

      modal.querySelector('#toolPenBtn')?.addEventListener('click', () => {
        activeTool = 'pen';
        this.updateToolButtons();
      });

      modal.querySelector('#toolReticleBtn')?.addEventListener('click', () => {
        activeTool = 'reticle';
        this.updateToolButtons();
      });

      modal.querySelectorAll('.btn-color').forEach(btn => {
        btn.addEventListener('click', () => {
          drawColor = btn.getAttribute('data-color');
          modal.querySelectorAll('.btn-color').forEach(b => b.style.border = '1px solid rgba(255,255,255,0.4)');
          btn.style.border = '2px solid #fff';
        });
      });

      modal.querySelector('#btnClearTelestrator')?.addEventListener('click', () => {
        const canvas = document.getElementById('telestratorCanvas');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      });
    },

    updateToolButtons() {
      const laser = document.getElementById('toolLaserBtn');
      const pen = document.getElementById('toolPenBtn');
      const reticle = document.getElementById('toolReticleBtn');

      [laser, pen, reticle].forEach(b => {
        if (b) {
          b.style.background = 'rgba(255,255,255,0.06)';
          b.style.borderColor = 'rgba(255,255,255,0.15)';
          b.style.color = '#fff';
        }
      });

      const active = activeTool === 'laser' ? laser : activeTool === 'reticle' ? reticle : pen;
      if (active) {
        active.style.background = 'rgba(0,243,255,0.2)';
        active.style.borderColor = '#00f3ff';
        active.style.color = '#00f3ff';
      }
    },

    initTelestratorCanvas() {
      const canvas = document.getElementById('telestratorCanvas');
      if (!canvas) return;

      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      const ctx = canvas.getContext('2d');

      let lastX = 0;
      let lastY = 0;

      canvas.onmousedown = e => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (activeTool === 'reticle') {
          // Stamp Reticle
          ctx.save();
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, 24, 0, Math.PI * 2);
          ctx.moveTo(x - 30, y);
          ctx.lineTo(x + 30, y);
          ctx.moveTo(x, y - 30);
          ctx.lineTo(x, y + 30);
          ctx.stroke();
          ctx.fillStyle = drawColor;
          ctx.font = '10px monospace';
          ctx.fillText(`LOC: [${Math.round(x)}, ${Math.round(y)}]`, x + 28, y - 8);
          ctx.restore();
          return;
        }

        isDrawing = true;
        lastX = x;
        lastY = y;
      };

      canvas.onmousemove = e => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (activeTool === 'laser') {
          // Temporary pulsing laser point
          ctx.save();
          ctx.fillStyle = drawColor;
          ctx.shadowColor = drawColor;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }

        if (!isDrawing) return;
        ctx.save();
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowColor = drawColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
        lastX = x;
        lastY = y;
      };

      window.onmouseup = () => {
        isDrawing = false;
      };
    },

    stopScreenShare() {
      if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        screenStream = null;
      }
      const modal = document.getElementById('tacticalScreenModal');
      if (modal) modal.style.display = 'none';
    }
  };

  window.NexTacticalScreenShare = NexTacticalScreenShare;
})(window);
