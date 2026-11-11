/**
 * NEXCHAT - Nano-Canvas Collaborative Scratchpad & Tactical Annotator
 * Module: src/js/nex-nano-canvas.js
 * 
 * Capabilities:
 * - Instant in-app vector and sketch canvas for rapid wireframing, diagrams, and arrows.
 * - Works natively on both mobile touch and desktop cursor (Pointer Events).
 * - Exports drawing directly into active conversation stream.
 * - Zero external APIs required: pure HTML5 Canvas API.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  class NexNanoCanvasEngine {
    constructor() {
      this.modalEl = null;
      this.canvas = null;
      this.ctx = null;
      this.isDrawing = false;
      this.currentColor = '#00f2fe';
      this.lineWidth = 3;
      this.tool = 'pen'; // 'pen', 'arrow', 'eraser'
      this.startX = 0;
      this.startY = 0;
      this.snapshot = null;

      this.init();
    }

    init() {
      // Global hook
      window.openNanoCanvas = () => this.openModal();
    }

    openModal() {
      if (this.modalEl) {
        this.modalEl.style.display = 'flex';
        return;
      }

      const modal = document.createElement('div');
      modal.id = 'nexNanoCanvasModal';
      modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(3, 7, 18, 0.85);
        backdrop-filter: blur(14px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      `;

      modal.innerHTML = `
        <div style="background: rgba(15, 23, 42, 0.98); border: 1.5px solid rgba(0, 242, 254, 0.5); border-radius: 16px; width: 100%; max-width: 540px; box-shadow: 0 0 35px rgba(0, 242, 254, 0.25); display: flex; flex-direction: column; overflow: hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px 16px; border-bottom: 1px solid rgba(0,242,254,0.25);">
            <div style="display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-paintbrush" style="color:#00f2fe; font-size:15px;"></i>
              <strong style="color:#00f2fe; font-size:13.5px; text-transform:uppercase;">NEXCHAT Nano-Canvas Annotator</strong>
            </div>
            <button type="button" id="btnCloseNanoCanvas" style="background:transparent; border:none; color:#94a3b8; font-size:15px; cursor:pointer;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div style="padding: 12px 16px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; background:rgba(0,0,0,0.3); border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex; align-items:center; gap:6px;">
              <button type="button" class="tool-btn active" data-tool="pen" style="padding:5px 9px; background:rgba(0,242,254,0.2); border:1px solid #00f2fe; color:#00f2fe; border-radius:6px; font-size:12px; cursor:pointer;" title="Pen">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button type="button" class="tool-btn" data-tool="arrow" style="padding:5px 9px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15); color:#cbd5e1; border-radius:6px; font-size:12px; cursor:pointer;" title="Arrow">
                <i class="fa-solid fa-arrow-right"></i>
              </button>
              <button type="button" class="tool-btn" data-tool="eraser" style="padding:5px 9px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15); color:#cbd5e1; border-radius:6px; font-size:12px; cursor:pointer;" title="Eraser">
                <i class="fa-solid fa-eraser"></i>
              </button>
              <button type="button" id="btnClearNanoCanvas" style="padding:5px 9px; background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#ef4444; border-radius:6px; font-size:12px; cursor:pointer;" title="Clear">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>

            <div style="display:flex; align-items:center; gap:6px;">
              <span class="color-swatch active" data-color="#00f2fe" style="width:20px; height:20px; border-radius:50%; background:#00f2fe; cursor:pointer; border:2px solid #fff;"></span>
              <span class="color-swatch" data-color="#c084fc" style="width:20px; height:20px; border-radius:50%; background:#c084fc; cursor:pointer; border:2px solid transparent;"></span>
              <span class="color-swatch" data-color="#10b981" style="width:20px; height:20px; border-radius:50%; background:#10b981; cursor:pointer; border:2px solid transparent;"></span>
              <span class="color-swatch" data-color="#ffd700" style="width:20px; height:20px; border-radius:50%; background:#ffd700; cursor:pointer; border:2px solid transparent;"></span>
              <span class="color-swatch" data-color="#ffffff" style="width:20px; height:20px; border-radius:50%; background:#ffffff; cursor:pointer; border:2px solid transparent;"></span>
            </div>
          </div>

          <div style="padding: 12px; background: #030712; display: flex; justify-content: center; overflow: hidden;">
            <canvas id="nanoCanvasSurface" width="480" height="320" style="background:#0b1120; border:1px solid rgba(255,255,255,0.1); border-radius:10px; touch-action:none; width:100%; max-width:480px; height:auto; aspect-ratio:480/320;"></canvas>
          </div>

          <div style="padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; color:#64748b;"><i class="fa-solid fa-fingerprint" style="margin-right:4px;"></i>Touch &amp; Cursor Vector Canvas</span>
            <button type="button" id="btnSendNanoCanvas" style="padding:7px 18px; background:linear-gradient(135deg, #00f2fe, #0ea5e9); color:#000; border:none; border-radius:8px; font-weight:800; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-paper-plane"></i> Send to Chat
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.modalEl = modal;

      this.canvas = modal.querySelector('#nanoCanvasSurface');
      this.ctx = this.canvas.getContext('2d');
      this.bindCanvasEvents();

      modal.querySelector('#btnCloseNanoCanvas')?.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      modal.querySelector('#btnClearNanoCanvas')?.addEventListener('click', () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      });

      modal.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
          modal.querySelectorAll('.color-swatch').forEach(s => s.style.borderColor = 'transparent');
          swatch.style.borderColor = '#fff';
          this.currentColor = swatch.dataset.color;
          if (this.tool === 'eraser') {
            this.setTool('pen');
          }
        });
      });

      modal.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.setTool(btn.dataset.tool);
        });
      });

      modal.querySelector('#btnSendNanoCanvas')?.addEventListener('click', () => {
        this.sendDrawingToChat();
        modal.style.display = 'none';
      });
    }

    setTool(toolName) {
      this.tool = toolName;
      if (!this.modalEl) return;
      this.modalEl.querySelectorAll('.tool-btn').forEach(b => {
        const active = b.dataset.tool === toolName;
        b.style.borderColor = active ? '#00f2fe' : 'rgba(255,255,255,0.15)';
        b.style.color = active ? '#00f2fe' : '#cbd5e1';
        b.style.background = active ? 'rgba(0,242,254,0.2)' : 'rgba(255,255,255,0.05)';
      });
    }

    bindCanvasEvents() {
      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY
        };
      };

      this.canvas.addEventListener('pointerdown', (e) => {
        this.isDrawing = true;
        const pos = getPos(e);
        this.startX = pos.x;
        this.startY = pos.y;

        if (this.tool === 'arrow') {
          this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        } else {
          this.ctx.beginPath();
          this.ctx.moveTo(pos.x, pos.y);
        }
      });

      this.canvas.addEventListener('pointermove', (e) => {
        if (!this.isDrawing) return;
        const pos = getPos(e);

        if (this.tool === 'pen') {
          this.ctx.strokeStyle = this.currentColor;
          this.ctx.lineWidth = this.lineWidth;
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';
          this.ctx.lineTo(pos.x, pos.y);
          this.ctx.stroke();
        } else if (this.tool === 'eraser') {
          this.ctx.strokeStyle = '#0b1120';
          this.ctx.lineWidth = 16;
          this.ctx.lineCap = 'round';
          this.ctx.lineTo(pos.x, pos.y);
          this.ctx.stroke();
        } else if (this.tool === 'arrow') {
          if (this.snapshot) {
            this.ctx.putImageData(this.snapshot, 0, 0);
          }
          this.drawArrow(this.startX, this.startY, pos.x, pos.y);
        }
      });

      const stopDrawing = () => {
        this.isDrawing = false;
        this.ctx.closePath();
      };

      this.canvas.addEventListener('pointerup', stopDrawing);
      this.canvas.addEventListener('pointercancel', stopDrawing);
    }

    drawArrow(fromX, fromY, toX, toY) {
      const headLength = 12;
      const dx = toX - fromX;
      const dy = toY - fromY;
      const angle = Math.atan2(dy, dx);

      this.ctx.strokeStyle = this.currentColor;
      this.ctx.fillStyle = this.currentColor;
      this.ctx.lineWidth = this.lineWidth;

      this.ctx.beginPath();
      this.ctx.moveTo(fromX, fromY);
      this.ctx.lineTo(toX, toY);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(toX, toY);
      this.ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
      this.ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
      this.ctx.closePath();
      this.ctx.fill();
    }

    sendDrawingToChat() {
      const dataUrl = this.canvas.toDataURL('image/png');
      const container = document.getElementById('messages-area') || document.querySelector('.messages-list') || document.getElementById('chatDetailView');
      if (!container) return;

      const card = document.createElement('div');
      card.className = 'message-bubble sent nano-canvas-bubble';
      card.style.cssText = `
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(0, 242, 254, 0.4);
        border-radius: 12px;
        padding: 10px;
        margin: 10px 0;
        max-width: 380px;
        margin-left: auto;
        color: #fff;
        box-shadow: 0 4px 20px rgba(0, 242, 254, 0.15);
      `;

      card.innerHTML = `
        <div style="font-size:10px; color:#00f2fe; text-transform:uppercase; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:5px;">
          <i class="fa-solid fa-paintbrush"></i> Nano-Canvas Vector Dispatch
        </div>
        <img src="${dataUrl}" alt="Canvas Sketch" style="width:100%; border-radius:8px; border:1px solid rgba(255,255,255,0.1); display:block;" />
      `;

      container.appendChild(card);
      card.scrollIntoView({ behavior: 'smooth' });

      if (typeof window.showNotif === 'function') {
        window.showNotif('Nano-Canvas drawing dispatched.', 'success', 2000);
      }
    }
  }

  window.NexNanoCanvas = new NexNanoCanvasEngine();

})(typeof window !== 'undefined' ? window : this);
