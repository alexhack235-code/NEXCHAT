/**
 * NEXCHAT Cyber Audio DSP Engine
 * Real-time Web Audio API voice transformation, masking, and vocoding pipeline.
 * Strictly zero emojis.
 */

class CyberAudioDSPEngine {
  constructor() {
    this.audioCtx = null;
    this.sourceNode = null;
    this.destinationNode = null;
    this.currentPreset = 'clean';
    this.activeNodes = [];
    this.previewStream = null;
    this.previewAudio = null;
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  getAvailablePresets() {
    return [
      { id: 'clean', name: 'Studio Clean', desc: 'Adaptive de-noised studio pass-through with soft compression.' },
      { id: 'android', name: 'Cyber Android', desc: 'Ring-modulated robotic voice with harmonic distortion.' },
      { id: 'radio', name: 'Radio Comm Dispatch', desc: 'Bandpass dispatch radio with static dispersion and squelch.' },
      { id: 'ghost', name: 'Ghost Operative', desc: 'Pitch-dropped formant filter with dark feedback resonance.' },
      { id: 'vocoder', name: 'Harmonic Vocoder', desc: 'Comb-filtered spectral vocoder with cyber resonance.' }
    ];
  }

  createDistortionCurve(amount = 20) {
    const k = amount;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  applyVoicePreset(stream, preset = 'clean') {
    const ctx = this.ensureContext();
    this.currentPreset = preset;

    // Disconnect any existing node chain
    this.activeNodes.forEach(node => {
      try { node.disconnect(); } catch {}
    });
    this.activeNodes = [];

    const source = ctx.createMediaStreamSource(stream);
    const destination = ctx.createMediaStreamDestination();
    this.activeNodes.push(source, destination);

    if (preset === 'android') {
      // Ring Modulator + Subtle WaveShaper
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const shaper = ctx.createWaveShaper();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(54, ctx.currentTime); // 54Hz robotic carrier
      osc.start();

      shaper.curve = this.createDistortionCurve(25);
      shaper.oversample = '4x';

      source.connect(gainNode);
      osc.connect(gainNode.gain);
      gainNode.connect(shaper);
      shaper.connect(destination);

      this.activeNodes.push(osc, gainNode, shaper);
    } else if (preset === 'radio') {
      // Bandpass 400Hz - 3400Hz + Soft Overdrive
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(450, ctx.currentTime);

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(3200, ctx.currentTime);

      const shaper = ctx.createWaveShaper();
      shaper.curve = this.createDistortionCurve(18);

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-18, ctx.currentTime);
      comp.knee.setValueAtTime(6, ctx.currentTime);
      comp.ratio.setValueAtTime(8, ctx.currentTime);

      source.connect(hp);
      hp.connect(lp);
      lp.connect(shaper);
      shaper.connect(comp);
      comp.connect(destination);

      this.activeNodes.push(hp, lp, shaper, comp);
    } else if (preset === 'ghost') {
      // Dark Lowpass + Delay Feedback loop
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(850, ctx.currentTime);

      const delay = ctx.createDelay();
      delay.delayTime.setValueAtTime(0.08, ctx.currentTime);

      const feedback = ctx.createGain();
      feedback.gain.setValueAtTime(0.35, ctx.currentTime);

      const merger = ctx.createGain();

      source.connect(lp);
      lp.connect(merger);
      lp.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(merger);
      merger.connect(destination);

      this.activeNodes.push(lp, delay, feedback, merger);
    } else if (preset === 'vocoder') {
      // Multi-band resonant harmonic filter
      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.setValueAtTime(320, ctx.currentTime);
      f1.Q.setValueAtTime(4.0, ctx.currentTime);

      const f2 = ctx.createBiquadFilter();
      f2.type = 'bandpass';
      f2.frequency.setValueAtTime(1200, ctx.currentTime);
      f2.Q.setValueAtTime(4.0, ctx.currentTime);

      const f3 = ctx.createBiquadFilter();
      f3.type = 'bandpass';
      f3.frequency.setValueAtTime(2600, ctx.currentTime);
      f3.Q.setValueAtTime(4.0, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.4, ctx.currentTime);

      source.connect(f1);
      source.connect(f2);
      source.connect(f3);

      f1.connect(gain);
      f2.connect(gain);
      f3.connect(gain);
      gain.connect(destination);

      this.activeNodes.push(f1, f2, f3, gain);
    } else {
      // Clean Studio Compressor
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-24, ctx.currentTime);
      comp.knee.setValueAtTime(12, ctx.currentTime);
      comp.ratio.setValueAtTime(4, ctx.currentTime);
      comp.attack.setValueAtTime(0.003, ctx.currentTime);
      comp.release.setValueAtTime(0.25, ctx.currentTime);

      source.connect(comp);
      comp.connect(destination);
      this.activeNodes.push(comp);
    }

    return destination.stream;
  }
}

// Global Singleton Export
window.CyberAudioDSP = new CyberAudioDSPEngine();
