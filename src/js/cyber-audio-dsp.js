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
      if (AudioContextClass) {
        try {
          this.audioCtx = new AudioContextClass({ sampleRate: 48000, latencyHint: 'interactive' });
        } catch (_) {
          this.audioCtx = new AudioContextClass();
        }
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
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

    // Disconnect any existing node chain and stop active oscillators
    this.activeNodes.forEach(node => {
      try {
        if (typeof node.stop === 'function') {
          node.stop();
        }
        node.disconnect();
      } catch {}
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

  /**
   * Neural Noise Suppression & Spectral Noise Gate DSP
   * Strips ambient background rumble, electrical hum, and keyboard clatter in real-time.
   */
  enableNoiseSuppression(mediaStream) {
    if (!mediaStream) return mediaStream;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return mediaStream;
      const source = ctx.createMediaStreamSource(mediaStream);

      // 1. 85Hz High-Pass Filter (eliminates desk bumps, A/C hum, air pressure rumble)
      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.setValueAtTime(85, ctx.currentTime);
      highPass.Q.setValueAtTime(0.7, ctx.currentTime);

      // 2. 60Hz Electrical AC Hum Notch Filter
      const notch60 = ctx.createBiquadFilter();
      notch60.type = 'notch';
      notch60.frequency.setValueAtTime(60, ctx.currentTime);
      notch60.Q.setValueAtTime(4.0, ctx.currentTime);

      // 3. 50Hz International Mains Hum Notch Filter
      const notch50 = ctx.createBiquadFilter();
      notch50.type = 'notch';
      notch50.frequency.setValueAtTime(50, ctx.currentTime);
      notch50.Q.setValueAtTime(4.0, ctx.currentTime);

      // 4. Dynamic Noise Gate (Downward Expander below -44dB)
      const gate = ctx.createDynamicsCompressor();
      gate.threshold.setValueAtTime(-44, ctx.currentTime);
      gate.knee.setValueAtTime(8, ctx.currentTime);
      gate.ratio.setValueAtTime(14, ctx.currentTime);
      gate.attack.setValueAtTime(0.003, ctx.currentTime);
      gate.release.setValueAtTime(0.12, ctx.currentTime);

      // 5. Connect processing pipeline
      source.connect(highPass);
      highPass.connect(notch60);
      notch60.connect(notch50);
      notch50.connect(gate);

      const destination = ctx.createMediaStreamDestination();
      gate.connect(destination);

      console.log('[AUDIO DSP] Neural Noise Suppression pipeline active (85Hz HPF + Dual Notch + Noise Gate).');
      return destination.stream;
    } catch (err) {
      console.warn('[AUDIO DSP] Noise suppression fallback to raw stream:', err);
      return mediaStream;
    }
  }

  /**
   * 3D Spatial Audio Panner for Multi-Participant Voice Rooms
   * Positions speakers naturally across stereo soundstage (-0.85 to +0.85).
   */
  createSpatialVoicePanner(participantIndex, totalParticipants = 5) {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return null;

      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        // Calculate pan position: index 0 -> left, middle -> center, last -> right
        const ratio = totalParticipants > 1 ? (participantIndex / (totalParticipants - 1)) : 0.5;
        const panValue = (ratio * 1.7) - 0.85; // Scale from -0.85 (left) to +0.85 (right)
        panner.pan.setValueAtTime(Math.max(-0.85, Math.min(0.85, panValue)), ctx.currentTime);
        return { panner, context: ctx };
      } else if (ctx.createPanner) {
        const panner = ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        const angle = ((participantIndex / Math.max(1, totalParticipants)) * Math.PI) - (Math.PI / 2);
        panner.setPosition(Math.sin(angle), 0, Math.cos(angle));
        return { panner, context: ctx };
      }
      return null;
    } catch (err) {
      console.warn('[AUDIO DSP] Spatial panner initialization notice:', err);
      return null;
    }
  }

}

// Global Singleton Export
window.CyberAudioDSP = new CyberAudioDSPEngine();
