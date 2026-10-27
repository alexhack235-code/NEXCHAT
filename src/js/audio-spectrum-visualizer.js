/**
 * =============================================================================
 * NEXCHAT - 32-BAND TACTICAL ACOUSTIC SPECTRUM EQUALIZER & PEAK METERS (v3.5)
 * Logarithmic Human Ear Binning (32Hz to 16,000Hz) • -60dB to 0dB Decibel Scale
 * 1.5s Peak Decay Hold • 60 FPS Zero-GC Loop • Active Calls & Voice Notes Audio Pipeline
 * STRICTLY 0 UNICODE EMOJIS: Pure FontAwesome 6 vector glyphs and typography.
 * =============================================================================
 */

(function() {
  'use strict';

  const TARGET_FPS = 60;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  // 32 Logarithmic ISO-Derived Center Frequencies (32Hz to 16,000Hz)
  const SPECTRUM_32_BANDS = [
    { freq: 32, label: '32' },
    { freq: 40, label: '40' },
    { freq: 50, label: '50' },
    { freq: 63, label: '63' },
    { freq: 80, label: '80' },
    { freq: 100, label: '100' },
    { freq: 125, label: '125' },
    { freq: 160, label: '160' },
    { freq: 200, label: '200' },
    { freq: 250, label: '250' },
    { freq: 315, label: '315' },
    { freq: 400, label: '400' },
    { freq: 500, label: '500' },
    { freq: 630, label: '630' },
    { freq: 800, label: '800' },
    { freq: 1000, label: '1k' },
    { freq: 1250, label: '1.2k' },
    { freq: 1600, label: '1.6k' },
    { freq: 2000, label: '2k' },
    { freq: 2500, label: '2.5k' },
    { freq: 3150, label: '3.1k' },
    { freq: 4000, label: '4k' },
    { freq: 5000, label: '5k' },
    { freq: 6300, label: '6.3k' },
    { freq: 8000, label: '8k' },
    { freq: 10000, label: '10k' },
    { freq: 11500, label: '11.5k' },
    { freq: 12500, label: '12.5k' },
    { freq: 13500, label: '13.5k' },
    { freq: 14500, label: '14.5k' },
    { freq: 15200, label: '15.2k' },
    { freq: 16000, label: '16k' }
  ];

  class TacticalAcousticSpectrumEngine {
    constructor() {
      this.enabled = true;
      this.audioCtx = null;
      this.analyser = null;
      this.sourceNodes = new WeakSet();
      this.activeSource = null;
      this.frequencyData = null;
      this.timeDomainData = null;
      this.animFrameId = null;
      this.canvas = null;
      this.ctx = null;
      this.lastFrameTime = 0;
      this.lastRenderTime = performance.now();

      // Canvas gradient caching to eliminate heap allocations per frame
      this.cachedGradient = null;
      this.cachedGradHeight = 0;

      // 32-Band Peak Hold State Registers (1.5s decay)
      this.peakHoldDb = new Float32Array(32).fill(-60);
      this.peakHoldExpiry = new Float64Array(32).fill(0);

      // Master Decibel Telemetry
      this.masterRmsDb = -60.0;
      this.masterPeakDb = -60.0;
      this.masterPeakHoldDb = -60.0;
      this.masterPeakExpiry = 0;

      // Synthetic Energy Injection from TTS / Formant Engines
      this.syntheticBurstRemaining = 0;
      this.syntheticEnergy = 0;

      this.init();
    }

    init() {
      this.bindAudioUnlock();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.boot());
      } else {
        this.boot();
      }
    }

    boot() {
      this.injectCallDockVisualizer();
      this.hookVoiceNoteElements();
      this.observeDynamicAudioElements();
      this.bindDuressWipe();
    }

    bindAudioUnlock() {
      const unlockEvents = ['touchstart', 'touchend', 'click', 'keydown'];
      const unlock = () => {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        unlockEvents.forEach(evt => window.removeEventListener(evt, unlock, true));
      };
      unlockEvents.forEach(evt => window.addEventListener(evt, unlock, { once: true, capture: true, passive: true }));
    }

    /* ------------------------------------------------------------------------
       1. WEB AUDIO CONTEXT & ANALYSER INITIALIZATION (48kHz INTERACTIVE)
       ------------------------------------------------------------------------ */
    ensureAudioContext() {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          try {
            this.audioCtx = new AudioCtxClass({
              sampleRate: 48000, // Matched to WebRTC Opus 48kHz
              latencyHint: 'interactive'
            });
          } catch (_) {
            this.audioCtx = new AudioCtxClass();
          }

          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 2048; // High resolution frequency bins
          this.analyser.smoothingTimeConstant = 0.82; // Natural acoustic inertia
          this.analyser.minDecibels = -70;
          this.analyser.maxDecibels = -10;

          const binCount = this.analyser.frequencyBinCount;
          this.frequencyData = new Uint8Array(binCount);
          this.timeDomainData = new Float32Array(binCount);
        }
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      return this.audioCtx;
    }

    /* ------------------------------------------------------------------------
       2. DUAL AUDIO HOOKS (ACTIVE WEBRTC CALLS & VOICE NOTES)
       ------------------------------------------------------------------------ */
    attachMediaStream(mediaStream) {
      if (!mediaStream) return;
      const ctx = this.ensureAudioContext();
      if (!ctx || !this.analyser) return;

      try {
        if (this.activeSource) {
          try { this.activeSource.disconnect(); } catch (_) {}
          this.activeSource = null;
        }
        this.activeSource = ctx.createMediaStreamSource(mediaStream);
        this.activeSource.connect(this.analyser);
        // Do not connect mic input to ctx.destination to prevent local feedback howling
        this.startVisualizer();
      } catch (err) {
        console.warn('[TACTICAL SPECTRUM] MediaStream attach notice:', err?.message);
      }
    }

    connectStream(mediaStream) {
      this.attachMediaStream(mediaStream);
    }

    attachAudioElement(audioElement) {
      if (!audioElement || this.sourceNodes.has(audioElement)) return;
      const ctx = this.ensureAudioContext();
      if (!ctx || !this.analyser) return;

      try {
        const source = ctx.createMediaElementSource(audioElement);
        source.connect(this.analyser);
        this.analyser.connect(ctx.destination);
        this.sourceNodes.add(audioElement);

        audioElement.addEventListener('play', () => {
          this.ensureAudioContext();
          this.startVisualizer();
        });
      } catch (err) {
        console.warn('[TACTICAL SPECTRUM] HTMLAudioElement attach notice:', err?.message);
      }
    }

    connectAudioElement(audioElement) {
      this.attachAudioElement(audioElement);
    }

    hookVoiceNoteElements() {
      document.querySelectorAll('audio').forEach(audio => {
        this.attachAudioElement(audio);
      });
    }

    observeDynamicAudioElements() {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== 1) continue;
            if (node.tagName === 'AUDIO') {
              this.attachAudioElement(node);
            } else if (node.querySelectorAll) {
              node.querySelectorAll('audio').forEach(a => this.attachAudioElement(a));
            }
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Injects synthetic audio energy from procedural voice synthesizers
     */
    feedSyntheticEnergy(freq, tokenCount) {
      this.syntheticBurstRemaining = Math.max(30, Math.min(180, (tokenCount || 10) * 8));
      this.syntheticEnergy = Math.min(95, Math.max(35, Math.round(freq / 2)));
      if (!this.animFrameId && this.enabled) {
        this.startVisualizer();
      }
    }

    bindDuressWipe() {
      window.addEventListener('nex:duress:wipe', () => {
        this.stopVisualizer();
        this.peakHoldDb.fill(-60);
        this.peakHoldExpiry.fill(0);
        if (this.ctx && this.canvas) {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
      });
    }

    /* ------------------------------------------------------------------------
       3. DOM WIREFRAME INJECTION IN CALL OVERLAY & TACTICAL DOCK
       ------------------------------------------------------------------------ */
    injectCallDockVisualizer() {
      const callContainer = document.querySelector('.active-call-container') || document.body;
      if (document.getElementById('callAudioSpectrumCanvas')) return;

      const wrap = document.createElement('div');
      wrap.id = 'callSpectrumWrap';
      wrap.className = 'call-spectrum-wrap';
      wrap.innerHTML = `
        <div class="spectrum-header">
          <div class="spectrum-brand">
            <i class="fa-solid fa-chart-simple text-[#00ff66]"></i>
            <span class="spectrum-label">32-BAND ACOUSTIC SPECTRUM // 60 FPS</span>
          </div>
          <div class="spectrum-db-cluster">
            <span class="spectrum-pill rms" title="Root-Mean-Square Energy">RMS: <strong id="liveSpectrumRms">-60.0 dB</strong></span>
            <span class="spectrum-pill peak" title="Peak Transients">PEAK: <strong id="liveSpectrumPeak">-60.0 dB</strong></span>
            <span class="spectrum-pill clip-beacon" id="liveSpectrumClipLight">CLIP</span>
          </div>
        </div>
        <div class="spectrum-canvas-container">
          <canvas id="callAudioSpectrumCanvas" class="call-spectrum-canvas" width="640" height="90"></canvas>
        </div>
        <div class="spectrum-freq-legend">
          <span>32Hz</span>
          <span>125Hz</span>
          <span>500Hz</span>
          <span>2kHz</span>
          <span>8kHz</span>
          <span>16kHz</span>
        </div>
      `;

      const subBox = document.getElementById('liveCallSubtitlesBox');
      if (subBox && subBox.parentNode) {
        subBox.parentNode.insertBefore(wrap, subBox);
      } else {
        const header = document.querySelector('.chat-detail-header');
        if (header && header.parentNode) {
          header.parentNode.insertBefore(wrap, header.nextSibling);
        }
      }

      this.canvas = document.getElementById('callAudioSpectrumCanvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.setupHiDPI();
      }

      // Hook up call dock toggle button
      const dock = document.querySelector('.active-call-dock');
      if (dock && !document.getElementById('toggleCallSpectrumBtn')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'toggleCallSpectrumBtn';
        btn.className = 'call-dock-btn active';
        btn.title = 'Toggle 32-Band Tactical Acoustic Spectrum';
        btn.innerHTML = `<i class="fa-solid fa-chart-simple"></i>`;
        btn.addEventListener('click', () => this.toggleSpectrumUI());
        dock.insertBefore(btn, dock.firstChild);
      }
    }

    setupHiDPI() {
      if (!this.canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = this.canvas.getBoundingClientRect();
      const cssWidth = rect.width > 0 ? rect.width : 640;
      const cssHeight = rect.height > 0 ? rect.height : 90;

      this.canvas.width = Math.round(cssWidth * dpr);
      this.canvas.height = Math.round(cssHeight * dpr);
      if (this.ctx) {
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      this.cachedGradient = null; // Invalidate cached gradient on resize
    }

    toggleSpectrumUI() {
      this.enabled = !this.enabled;
      const wrap = document.getElementById('callSpectrumWrap');
      const btn = document.getElementById('toggleCallSpectrumBtn');

      if (wrap) wrap.style.display = this.enabled ? 'flex' : 'none';
      if (btn) btn.classList.toggle('active', this.enabled);

      if (this.enabled) {
        this.startVisualizer();
        if (typeof window.showNotif === 'function') window.showNotif('32-Band Acoustic Spectrum Active', 'info', 1500);
      } else {
        this.stopVisualizer();
      }
    }

    /* ------------------------------------------------------------------------
       4. 60 FPS RENDER LOOP: LOGARITHMIC BINNING & 1.5s PEAK HOLD DECAY
       ------------------------------------------------------------------------ */
    startVisualizer() {
      if (!this.canvas) this.canvas = document.getElementById('callAudioSpectrumCanvas');
      if (this.canvas && !this.ctx) this.ctx = this.canvas.getContext('2d');
      if (!this.canvas || !this.ctx) return;
      if (this.animFrameId) return;

      this.ensureAudioContext();
      this.lastFrameTime = performance.now();
      this.lastRenderTime = performance.now();

      const sampleRate = (this.audioCtx && this.audioCtx.sampleRate) || 48000;
      const nyquist = sampleRate / 2;
      const fftBinWidth = nyquist / (this.analyser ? this.analyser.frequencyBinCount : 1024);

      let step = 0;

      const render = (now) => {
        // DOM Liveness check: Stop if canvas was unmounted
        if (!this.enabled || !this.canvas || !this.canvas.isConnected || !this.ctx) {
          this.animFrameId = null;
          return;
        }

        this.animFrameId = requestAnimationFrame(render);

        // 60 FPS Frame-Rate Throttle
        const elapsed = now - this.lastFrameTime;
        if (elapsed < FRAME_INTERVAL) return;
        this.lastFrameTime = now - (elapsed % FRAME_INTERVAL);

        const dt = Math.max(0.001, (now - this.lastRenderTime) / 1000);
        this.lastRenderTime = now;
        step++;

        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width > 0 ? rect.width : (this.canvas.width / (window.devicePixelRatio || 1));
        const h = rect.height > 0 ? rect.height : (this.canvas.height / (window.devicePixelRatio || 1));

        this.ctx.clearRect(0, 0, w, h);

        let hasLiveSignal = false;
        if (this.analyser && this.frequencyData && this.timeDomainData) {
          // Optimized: Fetch frequency data ONCE per frame before loop
          this.analyser.getByteFrequencyData(this.frequencyData);
          this.analyser.getFloatTimeDomainData(this.timeDomainData);
          hasLiveSignal = Boolean(this.activeSource || this.sourceNodes.size > 0);
        }

        const isSynthetic = this.syntheticBurstRemaining > 0;
        if (isSynthetic) this.syntheticBurstRemaining--;

        // Calculate Master RMS & Peak Decibels
        if (hasLiveSignal && this.timeDomainData) {
          let sumSquares = 0;
          let maxAbs = 0;
          for (let i = 0; i < this.timeDomainData.length; i++) {
            const abs = Math.abs(this.timeDomainData[i]);
            if (abs > maxAbs) maxAbs = abs;
            sumSquares += abs * abs;
          }
          const rms = Math.sqrt(sumSquares / this.timeDomainData.length);
          this.masterRmsDb = rms > 0.0001 ? Math.max(-60, Math.min(0, 20 * Math.log10(rms))) : -60;
          this.masterPeakDb = maxAbs > 0.0001 ? Math.max(-60, Math.min(0, 20 * Math.log10(maxAbs))) : -60;

          if (this.masterPeakDb >= this.masterPeakHoldDb) {
            this.masterPeakHoldDb = this.masterPeakDb;
            this.masterPeakExpiry = now + 1500;
          } else if (now > this.masterPeakExpiry) {
            this.masterPeakHoldDb = Math.max(-60, this.masterPeakHoldDb - 18 * dt);
          }
        } else if (isSynthetic) {
          const normSyn = this.syntheticEnergy / 100;
          this.masterRmsDb = -45 + normSyn * 35;
          this.masterPeakDb = -35 + normSyn * 30;
          this.masterPeakHoldDb = Math.max(this.masterPeakHoldDb, this.masterPeakDb);
        } else {
          this.masterRmsDb = -60.0;
          this.masterPeakDb = -60.0;
          this.masterPeakHoldDb = Math.max(-60, this.masterPeakHoldDb - 18 * dt);
        }

        // Optimized: Pre-create / Cache gradient outside bar loop
        if (!this.cachedGradient || this.cachedGradHeight !== h) {
          this.cachedGradHeight = h;
          this.cachedGradient = this.ctx.createLinearGradient(0, 0, 0, h);
          this.cachedGradient.addColorStop(0, '#00f2fe'); // Quantum Cyan
          this.cachedGradient.addColorStop(0.5, '#00ff66'); // Cyber Emerald
          this.cachedGradient.addColorStop(1, '#059669');
        }

        // 32-Band Computation & Layout Metrics
        const numBands = 32;
        const gutter = 2;
        const totalGutters = (numBands - 1) * gutter;
        const barWidth = Math.max(2, (w - totalGutters) / numBands);

        for (let i = 0; i < numBands; i++) {
          const centerFreq = SPECTRUM_32_BANDS[i].freq;

          // Bandwidth bounds (1/3 octave: f_low = f / 2^(1/6), f_high = f * 2^(1/6))
          const fLow = centerFreq / 1.12246;
          const fHigh = centerFreq * 1.12246;

          let rawEnergy = 0;
          if (hasLiveSignal && this.frequencyData) {
            const startBin = Math.max(0, Math.floor(fLow / fftBinWidth));
            const endBin = Math.min(this.frequencyData.length - 1, Math.ceil(fHigh / fftBinWidth));
            let maxVal = 0;
            for (let b = startBin; b <= endBin; b++) {
              if (this.frequencyData[b] > maxVal) maxVal = this.frequencyData[b];
            }
            rawEnergy = maxVal;
          } else if (isSynthetic) {
            rawEnergy = Math.floor(this.syntheticEnergy * (0.55 + Math.sin(step * 0.22 + i * 0.38) * 0.45));
          } else {
            // Ambient idle noise floor simulation (-58dB to -52dB)
            rawEnergy = 8 + Math.sin(step * 0.08 + i * 0.35) * 6;
          }

          // Map raw energy [0..255] to Decibels [-60 dBFS..0 dBFS]
          const currentDb = rawEnergy > 0 ? -60 + (rawEnergy / 255) * 60 : -60;

          // 1.5-Second Peak Hold Decay Logic
          if (currentDb >= this.peakHoldDb[i]) {
            this.peakHoldDb[i] = currentDb;
            this.peakHoldExpiry[i] = now + 1500; // 1500ms freeze
          } else if (now > this.peakHoldExpiry[i]) {
            this.peakHoldDb[i] = Math.max(-60, this.peakHoldDb[i] - 18 * dt); // 18 dB/sec smooth fall
          }

          // Normalized Bar Height
          const normCurrent = Math.max(0, Math.min(1, (currentDb + 60) / 60));
          const normPeak = Math.max(0, Math.min(1, (this.peakHoldDb[i] + 60) / 60));

          const barHeight = Math.max(2, normCurrent * (h - 8));
          const peakY = h - (normPeak * (h - 8)) - 2;
          const x = i * (barWidth + gutter);
          const y = h - barHeight;

          // Render Main Equalizer Bar
          this.ctx.fillStyle = this.cachedGradient;
          this.ctx.fillRect(x, y, barWidth, barHeight);

          // Render 1.5s Floating Peak Hold Cap
          this.ctx.fillStyle = this.peakHoldDb[i] >= -1.0 ? '#ef4444' : (this.peakHoldDb[i] >= -6.0 ? '#f59e0b' : '#ffffff');
          this.ctx.fillRect(x, Math.max(0, peakY), barWidth, 2);
        }

        // Update Real-Time Telemetry Readouts (Throttled every 4th frame)
        if (step % 4 === 0) {
          const rmsEl = document.getElementById('liveSpectrumRms');
          const peakEl = document.getElementById('liveSpectrumPeak');
          const clipLight = document.getElementById('liveSpectrumClipLight');

          if (rmsEl) rmsEl.textContent = `${this.masterRmsDb.toFixed(1)} dB`;
          if (peakEl) peakEl.textContent = `${this.masterPeakHoldDb.toFixed(1)} dB`;
          if (clipLight) {
            clipLight.classList.toggle('active', this.masterPeakDb >= -0.2);
          }
        }
      };

      this.animFrameId = requestAnimationFrame(render);
    }

    stopVisualizer() {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  // Bind to global namespace
  window.audioSpectrumVisualizerEngine = new TacticalAcousticSpectrumEngine();
})();
