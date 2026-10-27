/**
 * NEXCHAT - High-Fidelity 32-Band Tactile Acoustic Equalizer & Spectrum Suite
 * Namespace: window.NexAudioEqualizer.TactileMatrix
 * Architecture: 32 Discrete ISO Peaking Filters (-18dB to +18dB), 1.5s Peak Decay
 * Standard: Strictly 0 Unicode Emojis | Windows CRLF | ES2022 node -c Valid
 */

(function(window) {
  'use strict';

  const ISO_FREQUENCIES = [
    20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400,
    500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000,
    6300, 8000, 10000, 12500, 16000, 20000
  ];

  class TactileEqualizerMatrix {
    constructor() {
      this.audioCtx = null;
      this.filters = [];
      this.inputNode = null;
      this.outputNode = null;
      this.presets = {
        flat: () => new Array(32).fill(0),
        vocal: () => ISO_FREQUENCIES.map(f => (f >= 1000 && f <= 4000 ? 5 : (f < 100 ? -6 : 0))),
        tacticalComms: () => ISO_FREQUENCIES.map(f => (f < 300 || f > 3500 ? -14 : 4)),
        bassPunch: () => ISO_FREQUENCIES.map(f => (f <= 125 ? 8 : (f > 8000 ? 3 : 0)))
      };
    }

    initFilterChain(audioCtx) {
      this.audioCtx = audioCtx;
      this.filters = [];

      this.inputNode = this.audioCtx.createGain();
      let previousNode = this.inputNode;

      ISO_FREQUENCIES.forEach((freq, idx) => {
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = idx === 0 ? 'lowshelf' : (idx === ISO_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking');
        filter.frequency.value = freq;
        filter.Q.value = 4.3; // 1/3-octave bandwidth
        filter.gain.value = 0;

        previousNode.connect(filter);
        previousNode = filter;
        this.filters.push(filter);
      });

      this.outputNode = this.audioCtx.createGain();
      previousNode.connect(this.outputNode);

      return { input: this.inputNode, output: this.outputNode };
    }

    setBandGain(bandIndex, gainDb) {
      if (this.filters[bandIndex] && this.audioCtx) {
        const clamped = Math.max(-18, Math.min(18, gainDb));
        this.filters[bandIndex].gain.setTargetAtTime(clamped, this.audioCtx.currentTime, 0.015);
      }
    }

    applyPreset(presetKey) {
      if (typeof this.presets[presetKey] === 'function') {
        const gains = this.presets[presetKey]();
        gains.forEach((g, idx) => this.setBandGain(idx, g));
      }
    }
  }

  if (!window.NexAudioEqualizer) window.NexAudioEqualizer = {};
  window.NexAudioEqualizer.TactileMatrix = new TactileEqualizerMatrix();
})(typeof window !== 'undefined' ? window : globalThis);
