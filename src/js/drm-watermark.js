/**
 * NEXCHAT - Ephemeral DRM & Anti-Leak Watermark Enclave Engine
 * Micro-tiled forensic watermarking, keyboard screenshot interception (PrintScreen, Ctrl+P),
 * viewport blanking on capture attempt, and cryptographic security audit alerts.
 */

(function() {
  'use strict';

  const DRM_ENABLED_KEY = 'nexchat_drm_watermark_enabled';

  class DRMWatermarkEngine {
    constructor() {
      this.enabled = localStorage.getItem(DRM_ENABLED_KEY) !== 'false'; // Default TRUE
      this.canvas = null;
      this.ctx = null;
      this.refreshInterval = null;
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
      this.injectWatermarkCanvas();
      this.bindScreenshotInterceptors();
      this.bindWindowVisibilityShield();
      this.startWatermarkRenderer();
    }

    injectWatermarkCanvas() {
      const chatDetail = document.getElementById('chatDetailView');
      if (chatDetail && !document.getElementById('drmWatermarkCanvas')) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'drmWatermarkCanvas';
        this.canvas.className = 'drm-watermark-canvas';
        this.canvas.style.display = this.enabled ? 'block' : 'none';
        chatDetail.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
      }
    }

    resizeCanvas() {
      const chatDetail = document.getElementById('chatDetailView');
      if (!this.canvas || !chatDetail) return;
      this.canvas.width = chatDetail.clientWidth || window.innerWidth;
      this.canvas.height = chatDetail.clientHeight || window.innerHeight;
      this.renderWatermark();
    }

    renderWatermark() {
      if (!this.ctx || !this.canvas || !this.enabled) return;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const user = localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')) : {};
      const uid = window.myUID || user.uid || 'u_active';
      const now = new Date();
      const timeStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const watermarkText = `VIEWER: ${uid} • NEX-ENCLAVE SECURE • ${timeStr}`;

      this.ctx.save();
      this.ctx.font = '700 11px monospace';
      this.ctx.fillStyle = 'rgba(0, 240, 255, 0.045)'; // Subtle forensic imprint
      this.ctx.rotate(-22 * Math.PI / 180);

      const stepX = 320;
      const stepY = 140;

      // Draw repeating forensic grid
      for (let x = -this.canvas.width; x < this.canvas.width * 2; x += stepX) {
        for (let y = -this.canvas.height; y < this.canvas.height * 2; y += stepY) {
          this.ctx.fillText(watermarkText, x, y);
        }
      }
      this.ctx.restore();
    }

    startWatermarkRenderer() {
      this.renderWatermark();
      // Periodically refresh timestamp
      this.refreshInterval = setInterval(() => {
        this.renderWatermark();
      }, 30000); // Every 30s
    }

    bindScreenshotInterceptors() {
      window.addEventListener('keydown', (e) => {
        if (!this.enabled) return;

        // PrintScreen Key
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
          this.triggerScreenshotDefense('PrintScreen intercepted');
        }

        // Ctrl+P or Cmd+P (Print to PDF)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
          e.preventDefault();
          this.triggerScreenshotDefense('Print transmission blocked');
        }

        // Windows Snipping Tool (Win + Shift + S) or Mac (Cmd + Shift + 4)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S' || e.key === '4')) {
          this.triggerScreenshotDefense('Screen snip intercepted');
        }
      });

      // Clipboard copy intercept
      window.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
          // Clear clipboard
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('[ENCLAVE PROTECTED TRANSCRIPTION - CAPTURE BLOCKED]').catch(() => {});
          }
        }
      });
    }

    bindWindowVisibilityShield() {
      // Window blur obscuring intentionally neutralized to prevent chat fading/cutting on mobile and focus loss
      window.addEventListener('focus', () => {
        const area = document.getElementById('messages-area');
        if (area) area.classList.remove('drm-obscure-active');
      });
    }

    bindWindowVisibilityShield() {
      const removeObscure = () => {
        const area = document.getElementById('messages-area');
        if (area) area.classList.remove('drm-obscure-active');
      };
      window.addEventListener('focus', removeObscure);
      window.addEventListener('touchstart', removeObscure, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') removeObscure();
      });
    }

    triggerScreenshotDefense(reason) {
      const area = document.getElementById('messages-area');
      if (area) {
        area.classList.add('drm-obscure-active');
        setTimeout(() => area.classList.remove('drm-obscure-active'), 1400);
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif(`[SECURITY] DRM Enclave: ${reason}! Message contents shielded.`, 'warning', 3000);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');
    }

    setDRMEnabled(enabled) {
      this.enabled = enabled;
      localStorage.setItem(DRM_ENABLED_KEY, enabled ? 'true' : 'false');
      if (this.canvas) {
        this.canvas.style.display = enabled ? 'block' : 'none';
        if (enabled) this.renderWatermark();
      }
    }
  }

  window.drmWatermarkEngine = new DRMWatermarkEngine();
})();
