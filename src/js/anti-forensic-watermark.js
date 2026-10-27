/**
 * =============================================================================
 * NEXCHAT - ANTI-FORENSIC SCREEN WATERMARKING & SCREENSHOT TRAP (v1.0)
 * Namespace: window.NexStealthPrivacy.WatermarkTrap
 * Specification: Imperceptible Steganographic Identity Lattice • Leak Attribution
 * STRICTLY ZERO UNICODE EMOJIS - FontAwesome 6 Vector Icons Only
 * =============================================================================
 */

(function (global) {
  'use strict';

  class AntiForensicWatermarkTrap {
    constructor() {
      this.viewerUid = null;
      this.sessionHash = this.generateSessionHash();
      this.phaseOffset = 0;
      this.phaseTimer = null;
      this.canvasPattern = null;
      this.overlayElement = null;

      this.init();
    }

    init() {
      this.resolveViewerIdentity();
      this.createProceduralPattern();
      this.injectGlobalOverlay();
      this.startDynamicPhaseShift();
      this.bindDuressWipe();
      console.log('[NEX-WATERMARK-TRAP] Anti-Forensic Lattice Initialized. Session Hash:', this.sessionHash.substring(0, 10));
    }

    resolveViewerIdentity() {
      this.viewerUid = window.myUID || (window.firebaseAuth?.currentUser?.uid) || 'UID_ANON_SEALED';
    }

    generateSessionHash() {
      const entropy = `${Date.now()}_${Math.random()}_${navigator.userAgent}`;
      let hash = 0;
      for (let i = 0; i < entropy.length; i++) {
        hash = (hash << 5) - hash + entropy.charCodeAt(i);
        hash |= 0;
      }
      return '0x' + Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
    }

    // -------------------------------------------------------------------------
    // 1. PROCEDURAL STEGANOGRAPHIC PATTERN GENERATION
    // -------------------------------------------------------------------------
    createProceduralPattern() {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 140;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Micro-dither lattice (high-frequency noise)
      const imgData = ctx.createImageData(canvas.width, canvas.height);
      const data = imgData.data;
      const uidSeed = this.viewerUid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

      for (let i = 0; i < data.length; i += 4) {
        // High-frequency modulation: ±1 luminance delta (invisible to naked eye)
        const pseudoRand = ((i * 13 + uidSeed * 37) % 7);
        if (pseudoRand === 0) {
          data[i] = 255;     // R
          data[i + 1] = 255; // G
          data[i + 2] = 255; // B
          data[i + 3] = 4;   // ~1.5% alpha
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // Micro-steganographic identification barcode text
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)'; // Barely perceptible
      ctx.textAlign = 'center';

      const attributionToken = `${this.viewerUid.substring(0, 12)}::${this.sessionHash}::${Date.now().toString(36)}`;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-15 * Math.PI / 180);
      ctx.fillText(attributionToken, 0, 0);
      ctx.restore();

      this.canvasPattern = canvas.toDataURL('image/png');
    }

    // -------------------------------------------------------------------------
    // 2. VIEWPORT & BUBBLE OVERLAY INJECTION
    // -------------------------------------------------------------------------
    injectGlobalOverlay() {
      if (document.getElementById('nexForensicLatticeOverlay')) return;

      const overlay = document.createElement('div');
      overlay.id = 'nexForensicLatticeOverlay';
      overlay.className = 'nex-forensic-lattice-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        pointer-events: none;
        z-index: 99990;
        background-repeat: repeat;
        background-image: url('${this.canvasPattern}');
        mix-blend-mode: overlay;
        opacity: 0.85;
      `;
      document.body.appendChild(overlay);
      this.overlayElement = overlay;
    }

    // -------------------------------------------------------------------------
    // 3. DYNAMIC PERIODIC PHASE-SHIFT (Anti-Stitching & Anti-Blending)
    // -------------------------------------------------------------------------
    startDynamicPhaseShift() {
      if (this.phaseTimer) clearInterval(this.phaseTimer);
      this.phaseTimer = setInterval(() => {
        this.phaseOffset = (this.phaseOffset + 13) % 240;
        if (this.overlayElement) {
          this.overlayElement.style.backgroundPosition = `${this.phaseOffset}px ${this.phaseOffset / 2}px`;
        }
      }, 12000); // Shift phase every 12 seconds
    }

    // -------------------------------------------------------------------------
    // 4. ATTACH WATERMARK TO MEDIA & PROTECTED BUBBLES
    // -------------------------------------------------------------------------
    protectMediaNode(mediaContainer) {
      if (!mediaContainer || mediaContainer.dataset.watermarked === 'true') return;
      mediaContainer.dataset.watermarked = 'true';

      const tag = document.createElement('div');
      tag.className = 'media-watermark-tag';
      tag.style.cssText = `
        position: absolute;
        inset: 0;
        background-image: url('${this.canvasPattern}');
        background-repeat: repeat;
        pointer-events: none;
        mix-blend-mode: overlay;
        opacity: 0.9;
        z-index: 5;
      `;
      mediaContainer.style.position = 'relative';
      mediaContainer.appendChild(tag);
    }

    // -------------------------------------------------------------------------
    // 5. FORENSIC AUDIT & EXTRACTION TOOLKIT
    // -------------------------------------------------------------------------
    applyForensicContrastReveal(enable = true) {
      // Diagnostic tool for white-hat security testing to reveal watermark on screen
      if (this.overlayElement) {
        if (enable) {
          this.overlayElement.style.mixBlendMode = 'difference';
          this.overlayElement.style.opacity = '0.95';
          this.overlayElement.style.filter = 'contrast(500%) brightness(150%)';
        } else {
          this.overlayElement.style.mixBlendMode = 'overlay';
          this.overlayElement.style.opacity = '0.85';
          this.overlayElement.style.filter = 'none';
        }
      }
    }

    bindDuressWipe() {
      window.addEventListener('nex:duress:wipe', () => {
        if (this.phaseTimer) clearInterval(this.phaseTimer);
        if (this.overlayElement) this.overlayElement.remove();
        console.warn('[NEX-WATERMARK-TRAP] Forensic watermark layers sanitized under duress wipe.');
      });
    }
  }

  // Unified global namespace registration
  if (!global.NexStealthPrivacy) global.NexStealthPrivacy = {};
  const trapInstance = new AntiForensicWatermarkTrap();
  global.NexStealthPrivacy.WatermarkTrap = trapInstance;

})(typeof window !== 'undefined' ? window : globalThis);