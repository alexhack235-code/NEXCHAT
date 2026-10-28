/**
 * NEXCHAT - 2-Player Realtime Cyber Canvas (Live Co-Doodling)
 * Simultaneous multi-user drawing, neon stroke interpolation,
 * Supabase broadcast sync, and 1-tap direct chat export.
 */

(function() {
  'use strict';

  class LiveCanvasEngine {
    constructor() {
      this.currentColor = '#00f0ff';
      this.currentSize = 4;
      this.isEraser = false;
      this.isDrawing = false;
      this.lastX = 0;
      this.lastY = 0;
      this.history = [];
      this.maxHistory = 20;
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
      this.injectModal();
      this.injectHubAction();
      this.listenSupabaseRealtime();
    }

    injectModal() {
      if (document.getElementById('liveCanvasModal')) return;

      const modal = document.createElement('div');
      modal.id = 'liveCanvasModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window live-canvas-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-paintbrush text-[#00f0ff] text-lg"></i>
              <h3 class="font-bold text-white text-base">CYBER CANVAS // 2-PLAYER CO-DOODLE</h3>
              <span class="live-sync-indicator"><i class="fa-solid fa-circle-dot animate-pulse text-[#00ff66]"></i> LIVE SYNC</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeLiveCanvasModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <!-- Canvas Drawing Board -->
          <div class="canvas-viewport-wrap" id="canvasViewportWrap">
            <canvas id="liveCoDoodleCanvas" width="600" height="400"></canvas>
          </div>

          <!-- Canvas Toolbar Controls -->
          <div class="canvas-toolbar">
            <div class="canvas-color-palette">
              <button type="button" class="color-swatch-btn active" data-color="#00f0ff" style="background: #00f0ff;" title="Cyan"></button>
              <button type="button" class="color-swatch-btn" data-color="#00ff66" style="background: #00ff66;" title="Matrix Green"></button>
              <button type="button" class="color-swatch-btn" data-color="#ff007f" style="background: #ff007f;" title="Hot Pink"></button>
              <button type="button" class="color-swatch-btn" data-color="#ffe600" style="background: #ffe600;" title="Laser Yellow"></button>
              <button type="button" class="color-swatch-btn" data-color="#ffffff" style="background: #ffffff;" title="Pure White"></button>
              <button type="button" class="color-swatch-btn eraser-swatch-btn" id="canvasEraserBtn" title="Eraser">
                <i class="fa-solid fa-eraser"></i>
              </button>
            </div>

            <div class="canvas-stroke-sizes">
              <button type="button" class="size-pill" data-size="2">Fine</button>
              <button type="button" class="size-pill active" data-size="5">Med</button>
              <button type="button" class="size-pill" data-size="12">Bold</button>
            </div>

            <div class="canvas-actions-row">
              <button type="button" id="canvasUndoBtn" class="canvas-tool-btn" title="Undo"><i class="fa-solid fa-rotate-left"></i></button>
              <button type="button" id="canvasClearBtn" class="canvas-tool-btn" title="Clear"><i class="fa-solid fa-trash-can"></i></button>
              <button type="button" id="sendCanvasToChatBtn" class="canvas-send-btn">
                <i class="fa-solid fa-paper-plane"></i> SEND TO CHAT
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      this.canvas = document.getElementById('liveCoDoodleCanvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.resetCanvasBackground();
        this.bindCanvasEvents();
      }

      // Close modal
      document.getElementById('closeLiveCanvasModalBtn')?.addEventListener('click', () => {
        this.closeModal();
      });

      // Palette selection
      modal.querySelectorAll('.color-swatch-btn').forEach(swatch => {
        swatch.addEventListener('click', () => {
          modal.querySelectorAll('.color-swatch-btn').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');

          if (swatch.id === 'canvasEraserBtn') {
            this.isEraser = true;
          } else {
            this.isEraser = false;
            this.currentColor = swatch.dataset.color;
          }
        });
      });

      // Size selection
      modal.querySelectorAll('.size-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          modal.querySelectorAll('.size-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.currentSize = parseInt(pill.dataset.size, 10);
        });
      });

      // Undo
      document.getElementById('canvasUndoBtn')?.addEventListener('click', () => {
        this.undo();
      });

      // Clear
      document.getElementById('canvasClearBtn')?.addEventListener('click', () => {
        this.clearCanvas(true);
      });

      // Send to Chat
      document.getElementById('sendCanvasToChatBtn')?.addEventListener('click', () => {
        this.sendArtworkToChat();
      });
    }

    injectHubAction() {
      const hub = document.getElementById('attachmentPopupHub');
      if (hub && !document.getElementById('hubActionCoDoodle')) {
        const item = document.createElement('div');
        item.className = 'attach-hub-item';
        item.id = 'hubActionCoDoodle';
        item.innerHTML = `
          <div class="attach-hub-icon icon-co-doodle"><i class="fa-solid fa-paintbrush"></i></div>
          <span>Co-Doodle</span>
        `;
        item.addEventListener('click', () => {
          hub.style.display = 'none';
          this.openModal();
        });
        hub.appendChild(item);
      }

      // Also wire existing hubActionCanvas if present
      const existingCanvasHub = document.getElementById('hubActionCanvas');
      if (existingCanvasHub) {
        existingCanvasHub.addEventListener('click', () => {
          if (hub) hub.style.display = 'none';
          this.openModal();
        });
      }
    }

    openModal() {
      const modal = document.getElementById('liveCanvasModal');
      if (!modal) return;
      modal.style.display = 'flex';
      this.saveHistoryState();
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    closeModal() {
      const modal = document.getElementById('liveCanvasModal');
      if (modal) modal.style.display = 'none';
    }

    resetCanvasBackground() {
      if (!this.ctx || !this.canvas) return;
      this.ctx.fillStyle = '#0c1017';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw faint cyber grid
      this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      this.ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < this.canvas.width; x += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
      for (let y = 0; y < this.canvas.height; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
    }

    bindCanvasEvents() {
      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        if (e.touches && e.touches.length > 0) {
          return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
          };
        }
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY
        };
      };

      const startDrawing = (e) => {
        e.preventDefault();
        this.isDrawing = true;
        const pos = getPos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        this.drawDot(pos.x, pos.y, this.currentColor, this.currentSize, this.isEraser);
      };

      const drawMove = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        this.drawLine(this.lastX, this.lastY, pos.x, pos.y, this.currentColor, this.currentSize, this.isEraser);

        // Broadcast segment to partner
        this.broadcastStroke(this.lastX, this.lastY, pos.x, pos.y, this.currentColor, this.currentSize, this.isEraser);

        this.lastX = pos.x;
        this.lastY = pos.y;
      };

      const stopDrawing = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        this.isDrawing = false;
        this.saveHistoryState();
      };

      // Mouse events
      this.canvas.addEventListener('mousedown', startDrawing);
      this.canvas.addEventListener('mousemove', drawMove);
      this.canvas.addEventListener('mouseup', stopDrawing);
      this.canvas.addEventListener('mouseleave', stopDrawing);

      // Touch events
      this.canvas.addEventListener('touchstart', startDrawing, { passive: false });
      this.canvas.addEventListener('touchmove', drawMove, { passive: false });
      this.canvas.addEventListener('touchend', stopDrawing);
    }

    drawDot(x, y, color, size, isEraser) {
      if (!this.ctx) return;
      this.ctx.save();
      if (isEraser) {
        this.ctx.fillStyle = '#0c1017';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = size * 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    drawLine(fromX, fromY, toX, toY, color, size, isEraser) {
      if (!this.ctx) return;
      this.ctx.save();
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      if (isEraser) {
        this.ctx.strokeStyle = '#0c1017';
        this.ctx.lineWidth = size * 3;
      } else {
        this.ctx.strokeStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = size * 1.8;
        this.ctx.lineWidth = size;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(fromX, fromY);
      this.ctx.lineTo(toX, toY);
      this.ctx.stroke();
      this.ctx.restore();
    }

    saveHistoryState() {
      if (!this.ctx || !this.canvas) return;
      if (this.history.length >= this.maxHistory) {
        this.history.shift();
      }
      this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    }

    undo() {
      if (this.history.length > 1) {
        this.history.pop(); // Remove current
        const previousState = this.history[this.history.length - 1];
        if (previousState && this.ctx) {
          this.ctx.putImageData(previousState, 0, 0);
          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');
        }
      }
    }

    clearCanvas(broadcast = true) {
      this.resetCanvasBackground();
      this.saveHistoryState();
      if (broadcast) {
        this.broadcastClear();
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');
    }

    sendArtworkToChat() {
      if (!this.canvas) return;

      // Create composite with watermark banner
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = this.canvas.width;
      exportCanvas.height = this.canvas.height + 40;
      const expCtx = exportCanvas.getContext('2d');

      // Copy drawing
      expCtx.drawImage(this.canvas, 0, 0);

      // Footer banner
      expCtx.fillStyle = '#070b10';
      expCtx.fillRect(0, this.canvas.height, exportCanvas.width, 40);

      expCtx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      expCtx.lineWidth = 1;
      expCtx.beginPath();
      expCtx.moveTo(0, this.canvas.height);
      expCtx.lineTo(exportCanvas.width, this.canvas.height);
      expCtx.stroke();

      expCtx.fillStyle = '#00f0ff';
      expCtx.font = 'bold 12px monospace';
      expCtx.fillText('[CO-DOODLE] NEXCHAT CO-DOODLE - SYNCHRONIZED CANVAS', 16, this.canvas.height + 25);

      const artworkDataUrl = exportCanvas.toDataURL('image/png');

      const attachment = {
        downloadURL: artworkDataUrl,
        fileName: `co_doodle_${Date.now()}.png`,
        fileType: 'image/png',
        isCoDoodle: true
      };

      if (typeof window.appendLocalSentMessage === 'function') {
        window.appendLocalSentMessage('[CO-DOODLE] Created a live Co-Doodle together!', attachment, false, 'sent');
      }

      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (partnerId) {
          window.sendSupabaseMessage({
            from: window.myUID || 'u_current',
            to: partnerId,
            text: '[CO-DOODLE] Created a live Co-Doodle together!',
            attachment: attachment,
            chatType: window.currentChatType || 'direct'
          }).catch(console.warn);
        }
      }

      this.closeModal();

      if (typeof window.showNotif === 'function') {
        window.showNotif('[CO-DOODLE] Co-Doodle sent to chat!', 'success', 2000);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
    }

    broadcastStroke(fromX, fromY, toX, toY, color, size, isEraser) {
      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (!partnerId) return;

        window.sendSupabaseMessage({
          from: window.myUID || 'u_current',
          to: partnerId,
          text: "",
          attachment: {
            fileType: 'canvas_stroke',
            isCanvasStroke: true,
            stroke: { fromX, fromY, toX, toY, color, size, isEraser }
          },
          chatType: window.currentChatType || 'direct'
        }).catch(() => {});
      }
    }

    broadcastClear() {
      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (!partnerId) return;

        window.sendSupabaseMessage({
          from: window.myUID || 'u_current',
          to: partnerId,
          text: "",
          attachment: {
            fileType: 'canvas_clear',
            isCanvasClear: true
          },
          chatType: window.currentChatType || 'direct'
        }).catch(() => {});
      }
    }

    listenSupabaseRealtime() {
      // Inbound stroke receiver
      window.addEventListener('nexchat:canvas_stroke_received', (e) => {
        const stroke = e.detail?.stroke;
        if (!stroke) return;
        this.drawLine(stroke.fromX, stroke.fromY, stroke.toX, stroke.toY, stroke.color, stroke.size, stroke.isEraser);
      });

      window.addEventListener('nexchat:canvas_clear_received', () => {
        this.clearCanvas(false);
      });
    }
  }

  window.liveCanvasEngine = new LiveCanvasEngine();
})();
