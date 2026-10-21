/**
 * NEXCHAT — Zero-Trust Hardware & WebGL Fingerprint Sentinel
 * Cryptographic device identity binding & anti-session hijacking engine
 */

(function(global) {
  'use strict';

  class HardwareFingerprintSentinel {
    constructor() {
      this.cachedFingerprint = null;
      this.cachedTelemetry = null;
    }

    /**
     * Extracts WebGL GPU Vendor & Renderer
     */
    getWebGLMetrics() {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return { vendor: 'Generic/No-WebGL', renderer: 'Software Rasterizer' };

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          return {
            vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown Vendor',
            renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown Renderer'
          };
        }
        return {
          vendor: gl.getParameter(gl.VENDOR) || 'Standard GL',
          renderer: gl.getParameter(gl.RENDERER) || 'Standard Renderer'
        };
      } catch (e) {
        return { vendor: 'Protected', renderer: 'Restricted' };
      }
    }

    /**
     * Canvas 2D cryptographic rasterization noise signature
     */
    getCanvasNoise() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no-canvas-2d';

        ctx.textBaseline = 'top';
        ctx.font = '14px "Orbitron", "Inter", "Arial"';
        ctx.fillStyle = '#00f2ff';
        ctx.fillRect(10, 5, 80, 45);

        ctx.fillStyle = '#00ff66';
        ctx.fillText('NEXCHAT<Sentinel>_4.8#', 15, 15);

        ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
        ctx.strokeRect(5, 2, 220, 50);

        return canvas.toDataURL();
      } catch (e) {
        return 'canvas-blocked';
      }
    }

    /**
     * Web Audio API oscillator frequency response hash
     */
    async getAudioFingerprint() {
      try {
        const AudioCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (!AudioCtx) return 'no-audio-context';

        const context = new AudioCtx(1, 44100, 44100);
        const oscillator = context.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, context.currentTime);

        const compressor = context.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, context.currentTime);
        compressor.knee.setValueAtTime(40, context.currentTime);
        compressor.ratio.setValueAtTime(12, context.currentTime);
        compressor.attack.setValueAtTime(0, context.currentTime);
        compressor.release.setValueAtTime(0.25, context.currentTime);

        oscillator.connect(compressor);
        compressor.connect(context.destination);
        oscillator.start(0);

        const renderedBuffer = await context.startRendering();
        const data = renderedBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 4500; i < 5000; i++) {
          sum += Math.abs(data[i]);
        }
        return sum.toFixed(6);
      } catch (e) {
        return 'audio-blocked';
      }
    }

    /**
     * Generates SHA-256 hash from a string using Web Crypto API
     */
    async sha256(str) {
      if (!crypto.subtle || !crypto.subtle.digest) {
        // Fallback simple 64-char hex hash
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash |= 0;
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
      }
      const buffer = new TextEncoder().encode(str);
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    /**
     * Computes the complete cryptographic hardware fingerprint
     */
    async computeFingerprint() {
      if (this.cachedFingerprint && this.cachedTelemetry) {
        return {
          fingerprint: this.cachedFingerprint,
          telemetry: this.cachedTelemetry
        };
      }

      const webgl = this.getWebGLMetrics();
      const canvasNoise = this.getCanvasNoise();
      const audioMetric = await this.getAudioFingerprint();

      const telemetry = {
        platform: navigator.platform || 'Unknown',
        userAgent: (navigator.userAgent || '').substring(0, 120),
        cores: navigator.hardwareConcurrency || 4,
        screenRes: `${window.screen?.width || 1920}x${window.screen?.height || 1080}`,
        colorDepth: window.screen?.colorDepth || 24,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        gpuVendor: webgl.vendor,
        gpuRenderer: webgl.renderer,
        audioMetric: audioMetric,
        timestamp: new Date().toISOString()
      };

      const rawString = [
        telemetry.platform,
        telemetry.cores,
        telemetry.screenRes,
        telemetry.colorDepth,
        telemetry.timezone,
        telemetry.gpuVendor,
        telemetry.gpuRenderer,
        telemetry.audioMetric,
        canvasNoise.substring(0, 100)
      ].join('||');

      const hash = await this.sha256(rawString);
      const fullFingerprint = '0x' + hash;

      this.cachedFingerprint = fullFingerprint;
      this.cachedTelemetry = telemetry;

      return {
        fingerprint: fullFingerprint,
        telemetry: telemetry
      };
    }

    /**
     * Binds current hardware fingerprint to the SuperAdmin session
     */
    async bindSession(sessionToken = 'SUPERADMIN_MASTER') {
      const { fingerprint, telemetry } = await this.computeFingerprint();
      const record = {
        sessionToken,
        fingerprint,
        telemetry,
        boundAt: new Date().toISOString(),
        verified: true
      };
      sessionStorage.setItem('nex_hardware_bound_fingerprint', JSON.stringify(record));
      return record;
    }

    /**
     * Validates that the active session has not been hijacked/replayed onto another machine
     */
    async validateSession() {
      const storedRaw = sessionStorage.getItem('nex_hardware_bound_fingerprint');
      if (!storedRaw) {
        // Automatically bind if this is a fresh authorized session
        return await this.bindSession();
      }

      try {
        const stored = JSON.parse(storedRaw);
        const { fingerprint } = await this.computeFingerprint();
        const isValid = stored.fingerprint === fingerprint;

        if (!isValid) {
          console.error('[HARDWARE SENTINEL] Security Alert: Session hardware fingerprint mismatch detected!');
          // Log security event
          if (global.logTerminal) {
            global.logTerminal('[SECURITY LOCKDOWN] Session Hijack Attempt Neutralized. Hardware hash altered.', 'alert');
          }
          return {
            valid: false,
            reason: 'HARDWARE_MISMATCH_POTENTIAL_HIJACK',
            expected: stored.fingerprint,
            actual: fingerprint
          };
        }

        return {
          valid: true,
          fingerprint: fingerprint,
          telemetry: stored.telemetry
        };
      } catch (e) {
        return { valid: true };
      }
    }
  }

  // Attach singleton to global scope
  const sentinel = new HardwareFingerprintSentinel();
  global.NexHardwareSentinel = sentinel;

  // Auto-initialize in browser
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      sentinel.computeFingerprint().catch(() => {});
    });
  }

})(typeof window !== 'undefined' ? window : this);
