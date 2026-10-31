/**
 * NEXCHAT - ChronEX Live VC Web Audio DSP & Tactical Acoustic Engine
 * Module: src/js/chronex-live-vc-dsp.js
 * 
 * CORE CAPABILITIES:
 * 1. Zero-latency tactile radio/cyber chimes synthesized dynamically via Web Audio API
 *    - playJoinChime(): Ascending two-tone sine/triangle chime (520Hz -> 880Hz)
 *    - playLeaveChime(): Descending two-tone chime (880Hz -> 440Hz)
 *    - playPttOnChime(): Military/tactical walkie-talkie chirp (1200Hz 35ms burst with soft square tone)
 *    - playPttOffChime(): Tactical squelch release beep (450Hz soft sine with noise burst)
 *    - playTranslationReceivedChime(): Subtle high-frequency blip (1760Hz shimmer)
 * 2. Real-time Audio Analyzer (AudioContext + AnalyserNode)
 *    - Connect microphone stream via createMediaStreamSource
 *    - Expose getByteFrequencyData(), getByteTimeDomainData(), and getDecibelLevel()
 *    - FFT-based Voice Activity Detection (VAD) threshold check (-45dB default)
 * 3. Fundamental Frequency (F0) Pitch Estimator
 *    - Fast autocorrelation with center clipping and parabolic interpolation
 *    - Human voice F0 detection (75Hz - 450Hz)
 *    - Normalized voicePitchMultiplier (0.75 - 1.35) for pitch-matched SpeechSynthesisUtterance
 * 4. 3D Spatial Audio Pan Matrix & 2D Proximity Spatial Radar Matrix
 *    - StereoPannerNode per participant mapped from grid index (-0.8 left to +0.8 right)
 *    - Dynamic balance smoothing on participant join/leave
 *    - 2D Proximity Spatial Radar Matrix with distance attenuation and dynamic stereo pan
 *    - updateParticipant2DPosition(participantId, myPos, peerPos, roomRadius)
 *    - getParticipantSpatialPanner(participantId) with 40ms anti-zipper clickless smoothing
 * 5. Cyberpunk Canvas Visualizer Renderers
 *    - Tactical spectrum analyzer bars, oscilloscope line, and circular voice rings
 * 
 * STRICT COMPLIANCE:
 * - Strictly 0 Unicode emojis across all code and comments.
 * - Pure Windows CRLF line endings.
 */

export class ChronexLiveVcDsp {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.chimeGain = null;

    // Microphone Analyzer & VAD State
    this.micStream = null;
    this.micSourceNode = null;
    this.micAnalyser = null;
    this.micFftData = null;
    this.micTimeData = null;
    this.micFloatTimeData = null;
    this.clippedBuffer = null;

    // VAD Configuration & State
    this.vadThresholdDb = -45;
    this.vadHangoverMs = 250;
    this.lastSpeechTimestamp = 0;
    this.isSpeaking = false;
    this.vadInterval = null;

    // Fundamental Frequency (F0) Tracking
    this.detectedPitchHz = 0;
    this.pitchMultiplier = 1.0;
    this.pitchHistory = [];
    this.maxPitchHistory = 10;

    // 3D Spatial Audio Pan Matrix
    // Map: participantId -> { id, pannerNode, gainNode, sourceNode, panValue, index }
    this.participants = new Map();

    // White noise buffer cache for tactical squelch
    this.cachedNoiseBuffer = null;
  }

  /**
   * Lazily initialize or resume Web Audio context
   * @returns {AudioContext|null}
   */
  getAudioContext() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume?.().catch?.(() => {});
      }
      return this.audioCtx;
    }
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass({ latencyHint: 'interactive' });

        // Master Gain
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);

        // Chimes Output Sub-Bus
        this.chimeGain = this.audioCtx.createGain();
        this.chimeGain.gain.setValueAtTime(0.75, this.audioCtx.currentTime);
        this.chimeGain.connect(this.masterGain);
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  /**
   * Adjust master sound volume (0.0 to 1.0)
   * @param {number} level
   */
  setMasterVolume(level) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain) return;
    const clamped = Math.max(0, Math.min(1.5, Number(level) || 0));
    this.masterGain.gain.setTargetAtTime(clamped, ctx.currentTime, 0.02);
  }

  /**
   * Adjust chime effects volume (0.0 to 1.0)
   * @param {number} level
   */
  setChimeVolume(level) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.chimeGain) return;
    const clamped = Math.max(0, Math.min(1.5, Number(level) || 0));
    this.chimeGain.gain.setTargetAtTime(clamped, ctx.currentTime, 0.02);
  }

  // =========================================================================
  // SECTION 1: TACTICAL RADIO & CYBER CHIMES SYNTHESIZER
  // 0 audio assets to download, zero latency, 100% Web Audio oscillators.
  // =========================================================================

  /**
   * Ascending two-tone sine/triangle chime (520Hz -> 880Hz) with smooth gain decay.
   * Played when joining a voice room.
   */
  playJoinChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Tone 1: 520Hz Triangle wave for warm futuristic body
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(520, now);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.28, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.03, now + 0.12);
    gain1.gain.linearRampToValueAtTime(0.0001, now + 0.14);

    osc1.connect(gain1);
    gain1.connect(this.chimeGain);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Tone 2: 880Hz Sine wave for crystal clear high chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.10);

    gain2.gain.setValueAtTime(0.0001, now + 0.10);
    gain2.gain.exponentialRampToValueAtTime(0.32, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    osc2.connect(gain2);
    gain2.connect(this.chimeGain);
    osc2.start(now + 0.10);
    osc2.stop(now + 0.44);
  }

  /**
   * Descending two-tone chime (880Hz -> 440Hz).
   * Played when disconnecting from voice channel.
   */
  playLeaveChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Tone 1: 880Hz Triangle wave
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, now);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.03, now + 0.11);
    gain1.gain.linearRampToValueAtTime(0.0001, now + 0.13);

    osc1.connect(gain1);
    gain1.connect(this.chimeGain);
    osc1.start(now);
    osc1.stop(now + 0.14);

    // Tone 2: 440Hz Sine wave
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440, now + 0.09);

    gain2.gain.setValueAtTime(0.0001, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.28, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc2.connect(gain2);
    gain2.connect(this.chimeGain);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.40);
  }

  /**
   * Military/tactical walkie-talkie chirp (1200Hz 35ms burst with soft square tone).
   * Played on Push-To-Talk activation.
   */
  playPttOnChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);

    // Biquad lowpass filter softens the square wave edges to prevent harsh aliasing
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.Q.setValueAtTime(1.0, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.004);
    gain.gain.setValueAtTime(0.20, now + 0.026);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.chimeGain);

    osc.start(now);
    osc.stop(now + 0.038);
  }

  /**
   * Tactical squelch release beep (450Hz soft sine with noise burst).
   * Played on Push-To-Talk release.
   */
  playPttOffChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Component 1: 450Hz soft sine beep
    const osc = ctx.createOscillator();
    const toneGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);

    toneGain.gain.setValueAtTime(0.0001, now);
    toneGain.gain.exponentialRampToValueAtTime(0.20, now + 0.005);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(toneGain);
    toneGain.connect(this.chimeGain);
    osc.start(now);
    osc.stop(now + 0.060);

    // Component 2: Squelch noise burst tail (tactical radio static)
    const noiseBuffer = this.getOrCreateNoiseBuffer(0.05);
    if (noiseBuffer) {
      const noiseSource = ctx.createBufferSource();
      const noiseFilter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();

      noiseSource.buffer = noiseBuffer;

      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1800, now + 0.020);
      noiseFilter.Q.setValueAtTime(2.2, now + 0.020);

      noiseGain.gain.setValueAtTime(0.0001, now + 0.020);
      noiseGain.gain.exponentialRampToValueAtTime(0.12, now + 0.024);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.chimeGain);

      noiseSource.start(now + 0.020);
      noiseSource.stop(now + 0.070);
    }
  }

  /**
   * Subtle high-frequency blip (1760Hz shimmer) when a peer's translated sentence is received.
   */
  playTranslationReceivedChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Primary frequency: 1760Hz (musical A6 pitch)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1760, now);

    // Shimmer companion detuned slightly (+5Hz) for cyber harmonic shimmer
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1765, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.chimeGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.17);
    osc2.stop(now + 0.17);
  }

  /**
   * Helper to generate or reuse white noise buffer for radio squelch effects
   * @param {number} durationSeconds
   * @returns {AudioBuffer|null}
   */
  getOrCreateNoiseBuffer(durationSeconds = 0.05) {
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    if (this.cachedNoiseBuffer && this.cachedNoiseBuffer.duration >= durationSeconds) {
      return this.cachedNoiseBuffer;
    }

    const frameCount = Math.floor(ctx.sampleRate * durationSeconds);
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      channelData[i] = Math.random() * 2 - 1;
    }

    this.cachedNoiseBuffer = buffer;
    return buffer;
  }

  // =========================================================================
  // SECTION 2: REAL-TIME AUDIO ANALYZER & VOICE ACTIVITY DETECTION (VAD)
  // =========================================================================

  /**
   * Connect microphone stream to the DSP pipeline and initialize AnalyserNode.
   * @param {MediaStream} mediaStream
   * @returns {AnalyserNode|null}
   */
  attachMediaStream(mediaStream) {
    if (!mediaStream) return null;
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    this.detachMediaStream();

    this.micStream = mediaStream;
    try {
      this.micSourceNode = ctx.createMediaStreamSource(mediaStream);
      this.micAnalyser = ctx.createAnalyser();

      this.micAnalyser.fftSize = 2048;
      this.micAnalyser.smoothingTimeConstant = 0.82;
      this.micAnalyser.minDecibels = -90;
      this.micAnalyser.maxDecibels = -10;

      // Allocate cached typed buffers
      const binCount = this.micAnalyser.frequencyBinCount;
      this.micFftData = new Uint8Array(binCount);
      this.micTimeData = new Uint8Array(this.micAnalyser.fftSize);
      this.micFloatTimeData = new Float32Array(this.micAnalyser.fftSize);
      this.clippedBuffer = new Float32Array(this.micAnalyser.fftSize);

      // Connect source to analyser only (NOT to destination, prevents acoustic feedback loop)
      this.micSourceNode.connect(this.micAnalyser);

      return this.micAnalyser;
    } catch (err) {
      console.warn('[ChronEX DSP] Failed to attach media stream source:', err);
      return null;
    }
  }

  /**
   * Detach microphone stream and release audio nodes
   */
  detachMediaStream() {
    if (this.micSourceNode) {
      try {
        this.micSourceNode.disconnect();
      } catch (_) {}
      this.micSourceNode = null;
    }
    if (this.micStream) {
      try {
        this.micStream.getTracks().forEach(t => t.stop());
      } catch (_) {}
    }
    this.micAnalyser = null;
    this.micStream = null;
  }

  /**
   * Returns byte frequency data array (0 to 255 per FFT bin).
   * @param {Uint8Array} [targetArray]
   * @returns {Uint8Array}
   */
  getByteFrequencyData(targetArray) {
    if (!this.micAnalyser) {
      return targetArray || new Uint8Array(0);
    }
    const arr = targetArray || this.micFftData || new Uint8Array(this.micAnalyser.frequencyBinCount);
    this.micAnalyser.getByteFrequencyData(arr);
    return arr;
  }

  /**
   * Returns byte time domain data (0 to 255 waveform samples, 128 is center).
   * @param {Uint8Array} [targetArray]
   * @returns {Uint8Array}
   */
  getByteTimeDomainData(targetArray) {
    if (!this.micAnalyser) {
      return targetArray || new Uint8Array(0);
    }
    const arr = targetArray || this.micTimeData || new Uint8Array(this.micAnalyser.fftSize);
    this.micAnalyser.getByteTimeDomainData(arr);
    return arr;
  }

  /**
   * Computes true RMS decibel level from the time domain audio buffer (-100dB to 0dB).
   * @returns {number}
   */
  getDecibelLevel() {
    if (!this.micAnalyser) return -100;

    if (!this.micFloatTimeData) {
      this.micFloatTimeData = new Float32Array(this.micAnalyser.fftSize);
    }

    this.micAnalyser.getFloatTimeDomainData(this.micFloatTimeData);

    let sumSquares = 0;
    const len = this.micFloatTimeData.length;
    for (let i = 0; i < len; i++) {
      const sample = this.micFloatTimeData[i];
      sumSquares += sample * sample;
    }

    const rms = Math.sqrt(sumSquares / len);
    if (rms < 1e-5) return -100;

    const db = 20 * Math.log10(rms);
    return Math.max(-100, Math.min(0, Math.round(db * 10) / 10));
  }

  /**
   * FFT-based Voice Activity Detection (VAD) threshold check (-45dB default)
   * Evaluates RMS power and spectral density within human vocal formant bandwidth (85Hz - 3400Hz).
   * @param {number} [thresholdDb=-45]
   * @returns {boolean}
   */
  isVoiceActive(thresholdDb = -45) {
    const db = this.getDecibelLevel();
    if (db < thresholdDb) {
      return false;
    }

    if (!this.micAnalyser) return true;

    // Spectral energy confirmation in human vocal range (85Hz - 3400Hz)
    const binCount = this.micAnalyser.frequencyBinCount;
    const sampleRate = this.audioCtx ? this.audioCtx.sampleRate : 48000;
    const binWidth = (sampleRate / 2) / binCount;

    const startBin = Math.max(0, Math.floor(85 / binWidth));
    const endBin = Math.min(binCount - 1, Math.ceil(3400 / binWidth));

    const fft = this.getByteFrequencyData();
    let speechEnergySum = 0;
    for (let i = startBin; i <= endBin; i++) {
      speechEnergySum += fft[i];
    }
    const avgSpeechEnergy = speechEnergySum / (endBin - startBin + 1);

    // Average magnitude above threshold indicates true vocal energy rather than white noise
    return avgSpeechEnergy > 18;
  }

  /**
   * Start polling Voice Activity with hysteresis hangover filtering
   * @param {Function} callback - Invoked with { isSpeaking, decibelLevel, detectedPitchHz, voicePitchMultiplier }
   * @param {Object} [options]
   */
  startVadMonitoring(callback, options = {}) {
    const thresholdDb = options.thresholdDb !== undefined ? options.thresholdDb : this.vadThresholdDb;
    const pollIntervalMs = options.pollIntervalMs || 50;

    this.stopVadMonitoring();

    this.vadInterval = setInterval(() => {
      const active = this.isVoiceActive(thresholdDb);
      const db = this.getDecibelLevel();
      const now = Date.now();

      if (active) {
        this.lastSpeechTimestamp = now;
        if (!this.isSpeaking) {
          this.isSpeaking = true;
        }

        // Run fundamental frequency estimator on vocal frame
        const pitchEst = this.estimatePitch();
        if (pitchEst && pitchEst.pitchHz > 0) {
          this.recordPitchSample(pitchEst.pitchHz);
        }
      } else if (this.isSpeaking && (now - this.lastSpeechTimestamp > this.vadHangoverMs)) {
        this.isSpeaking = false;
      }

      if (typeof callback === 'function') {
        callback({
          isSpeaking: this.isSpeaking,
          decibelLevel: db,
          detectedPitchHz: this.detectedPitchHz,
          voicePitchMultiplier: this.getVoicePitchMultiplier()
        });
      }
    }, pollIntervalMs);
  }

  /**
   * Stop polling Voice Activity
   */
  stopVadMonitoring() {
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }
  }

  // =========================================================================
  // SECTION 3: FUNDAMENTAL FREQUENCY (F0) PITCH ESTIMATOR
  // Fast autocorrelation with center clipping and parabolic interpolation.
  // =========================================================================

  /**
   * Performs fast autocorrelation on time domain audio buffer to estimate
   * speaker's fundamental voice pitch (F0) in Hertz.
   * Deep voices: 90Hz - 130Hz. Higher voices: 180Hz - 240Hz.
   * @param {Float32Array} [buffer]
   * @param {number} [sampleRate]
   * @returns {{ pitchHz: number, voicePitchMultiplier: number }}
   */
  estimatePitch(buffer, sampleRate) {
    const ctx = this.getAudioContext();
    const sRate = sampleRate || (ctx ? ctx.sampleRate : 48000);

    let audioBuffer = buffer;
    if (!audioBuffer) {
      if (!this.micAnalyser) return { pitchHz: 0, voicePitchMultiplier: 1.0 };
      if (!this.micFloatTimeData) {
        this.micFloatTimeData = new Float32Array(this.micAnalyser.fftSize);
      }
      this.micAnalyser.getFloatTimeDomainData(this.micFloatTimeData);
      audioBuffer = this.micFloatTimeData;
    }

    const len = audioBuffer.length;
    if (len < 512) return { pitchHz: 0, voicePitchMultiplier: 1.0 };

    // 1. RMS Energy Gate
    let sumSq = 0;
    for (let i = 0; i < len; i++) {
      sumSq += audioBuffer[i] * audioBuffer[i];
    }
    const rms = Math.sqrt(sumSq / len);
    if (rms < 0.012) {
      return { pitchHz: 0, voicePitchMultiplier: this.pitchMultiplier || 1.0 };
    }

    // 2. Center Clipping (Enhances glottal pulse periodicity while suppressing vocal tract formants)
    let maxAmp = 0;
    for (let i = 0; i < len; i++) {
      const absVal = Math.abs(audioBuffer[i]);
      if (absVal > maxAmp) maxAmp = absVal;
    }

    const clipThreshold = maxAmp * 0.32;
    if (!this.clippedBuffer || this.clippedBuffer.length !== len) {
      this.clippedBuffer = new Float32Array(len);
    }

    for (let i = 0; i < len; i++) {
      const v = audioBuffer[i];
      if (v > clipThreshold) this.clippedBuffer[i] = v - clipThreshold;
      else if (v < -clipThreshold) this.clippedBuffer[i] = v + clipThreshold;
      else this.clippedBuffer[i] = 0;
    }

    // 3. Autocorrelation across human vocal range (75Hz to 480Hz)
    const minFreq = 75;
    const maxFreq = 480;
    const minLag = Math.floor(sRate / maxFreq);
    const maxLag = Math.min(len - 1, Math.floor(sRate / minFreq));

    let bestLag = -1;
    let maxCorrelation = -1;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0;
      const count = len - lag;
      for (let i = 0; i < count; i++) {
        corr += this.clippedBuffer[i] * this.clippedBuffer[i + lag];
      }

      if (corr > maxCorrelation) {
        maxCorrelation = corr;
        bestLag = lag;
      }
    }

    if (bestLag <= minLag || bestLag >= maxLag) {
      return { pitchHz: 0, voicePitchMultiplier: this.pitchMultiplier || 1.0 };
    }

    // 4. Parabolic Interpolation for sub-bin frequency accuracy
    let refinedLag = bestLag;
    if (bestLag > 0 && bestLag < len - 1) {
      let cPrev = 0;
      let cCurr = maxCorrelation;
      let cNext = 0;

      const countPrev = len - (bestLag - 1);
      for (let i = 0; i < countPrev; i++) {
        cPrev += this.clippedBuffer[i] * this.clippedBuffer[i + bestLag - 1];
      }

      const countNext = len - (bestLag + 1);
      for (let i = 0; i < countNext; i++) {
        cNext += this.clippedBuffer[i] * this.clippedBuffer[i + bestLag + 1];
      }

      const denom = (2 * cCurr - cPrev - cNext);
      if (denom !== 0) {
        const delta = (cNext - cPrev) / (2 * denom);
        refinedLag = bestLag + delta;
      }
    }

    const detectedF0 = sRate / refinedLag;
    if (detectedF0 >= minFreq && detectedF0 <= maxFreq) {
      const multiplier = this.pitchToMultiplier(detectedF0);
      return {
        pitchHz: Math.round(detectedF0 * 10) / 10,
        voicePitchMultiplier: multiplier
      };
    }

    return { pitchHz: 0, voicePitchMultiplier: this.pitchMultiplier || 1.0 };
  }

  /**
   * Maps detected fundamental frequency (Hz) to normalized voicePitchMultiplier (0.75 - 1.35)
   * so SpeechSynthesisUtterance.pitch replicates the original speaker's vocal pitch!
   * Reference neutral voice baseline: 155Hz.
   * @param {number} pitchHz
   * @returns {number}
   */
  pitchToMultiplier(pitchHz) {
    if (!pitchHz || pitchHz < 65 || pitchHz > 500) {
      return 1.0;
    }

    // Reference center frequency: 155Hz
    const octaves = Math.log2(pitchHz / 155);

    // Natural octave scaling compression factor (0.38)
    const rawMultiplier = Math.pow(2, octaves * 0.38);

    // Strict clamp between 0.75 (deep bass) and 1.35 (high soprano/child)
    const clamped = Math.max(0.75, Math.min(1.35, Math.round(rawMultiplier * 100) / 100));
    return clamped;
  }

  /**
   * Internal tracker recording pitch samples into a rolling median/moving window
   * to eliminate momentary vocal glottal fry artifacts.
   * @param {number} hz
   */
  recordPitchSample(hz) {
    if (!hz || hz < 70 || hz > 480) return;

    this.detectedPitchHz = hz;
    this.pitchHistory.push(hz);
    if (this.pitchHistory.length > this.maxPitchHistory) {
      this.pitchHistory.shift();
    }

    // Calculate median pitch from history window
    const sorted = [...this.pitchHistory].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    this.pitchMultiplier = this.pitchToMultiplier(median);
  }

  /**
   * Returns current smoothed voice pitch multiplier (0.75 to 1.35)
   * Suitable for direct assignment to SpeechSynthesisUtterance.pitch.
   * @returns {number}
   */
  getVoicePitchMultiplier() {
    return this.pitchMultiplier || 1.0;
  }

  /**
   * Returns current fundamental pitch in Hertz
   * @returns {number}
   */
  getDetectedPitchHz() {
    return this.detectedPitchHz || 0;
  }

  // =========================================================================
  // SECTION 4: 3D SPATIAL AUDIO PAN MATRIX
  // StereoPannerNode per participant mapped from grid index (-0.8 left to +0.8 right)
  // =========================================================================

  /**
   * Calculates stereo pan value (-0.8 to +0.8) for participant index in grid
   * @param {number} index
   * @param {number} totalParticipants
   * @returns {number}
   */
  calculateGridPan(index, totalParticipants) {
    if (!totalParticipants || totalParticipants <= 1) return 0.0;

    if (totalParticipants === 2) {
      return index === 0 ? -0.55 : 0.55;
    }

    const ratio = index / (totalParticipants - 1);
    const pan = -0.8 + (ratio * 1.6);
    return Math.max(-0.8, Math.min(0.8, Math.round(pan * 100) / 100));
  }

  /**
   * Setup or re-balance StereoPannerNode for a participant based on grid positioning
   * @param {string} participantId
   * @param {number} index
   * @param {number} totalParticipants
   * @returns {Object|null}
   */
  /**
   * Returns or instantiates the spatial audio node pair (StereoPannerNode & GainNode) for a participant.
   * @param {string} participantId
   * @returns {{ pannerNode: StereoPannerNode|null, gainNode: GainNode, panner: StereoPannerNode|null, gain: GainNode, entry: Object }|null}
   */
  getParticipantSpatialPanner(participantId) {
    if (!participantId) return null;
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    let entry = this.participants.get(participantId);
    if (!entry) {
      let pannerNode = null;
      if (typeof ctx.createStereoPanner === 'function') {
        pannerNode = ctx.createStereoPanner();
        pannerNode.pan.setValueAtTime(0.0, ctx.currentTime);
      }

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(1.0, ctx.currentTime);

      if (pannerNode) {
        gainNode.connect(pannerNode);
        if (this.masterGain) {
          pannerNode.connect(this.masterGain);
        } else {
          pannerNode.connect(ctx.destination);
        }
      } else {
        if (this.masterGain) {
          gainNode.connect(this.masterGain);
        } else {
          gainNode.connect(ctx.destination);
        }
      }

      entry = {
        id: participantId,
        pannerNode,
        gainNode,
        panner: pannerNode,
        gain: gainNode,
        panValue: 0.0,
        gainValue: 1.0,
        index: this.participants.size,
        sourceNode: null
      };

      this.participants.set(participantId, entry);
    } else {
      entry.panner = entry.pannerNode;
      entry.gain = entry.gainNode;
    }

    return {
      pannerNode: entry.pannerNode,
      gainNode: entry.gainNode,
      panner: entry.pannerNode,
      gain: entry.gainNode,
      entry
    };
  }

  /**
   * 2D Proximity Spatial Radar Matrix: Updates participant acoustic position
   * based on relative 2D coordinates, applying distance attenuation gain and stereo panning.
   * Smoothly ramps StereoPannerNode.pan and GainNode.gain over 40ms to eliminate clicks or zipper noise.
   * 
   * @param {string} participantId
   * @param {{ x: number, y: number }} myPos
   * @param {{ x: number, y: number }} peerPos
   * @param {number} [roomRadius=250]
   * @returns {{ distance: number, normalizedDistance: number, gain: number, pan: number }|null}
   */
  updateParticipant2DPosition(participantId, myPos, peerPos, roomRadius = 250) {
    if (!participantId) return null;

    const spatial = this.getParticipantSpatialPanner(participantId);
    if (!spatial) return null;

    const mx = (myPos && typeof myPos.x === 'number') ? myPos.x : 0;
    const my = (myPos && typeof myPos.y === 'number') ? myPos.y : 0;
    const px = (peerPos && typeof peerPos.x === 'number') ? peerPos.x : mx;
    const py = (peerPos && typeof peerPos.y === 'number') ? peerPos.y : my;

    const radius = (typeof roomRadius === 'number' && roomRadius > 0) ? roomRadius : 250;
    const deltaX = px - mx;
    const deltaY = py - my;
    const distance = Math.hypot(deltaX, deltaY);
    const normalizedDistance = Math.min(1.0, distance / radius);

    // Attenuation gain: gain = Math.max(0.08, 1.0 - (distance / (roomRadius * 1.5)))
    const gain = Math.max(0.08, 1.0 - (distance / (radius * 1.5)));

    // Stereo Pan: pan = Math.max(-1.0, Math.min(1.0, (peerPos.x - myPos.x) / roomRadius))
    const pan = Math.max(-1.0, Math.min(1.0, deltaX / radius));

    const ctx = this.getAudioContext();
    const rampTimeSec = 0.040; // 40ms smooth ramp to prevent clicks or zipper noise

    if (ctx) {
      const now = ctx.currentTime;

      // Smooth ramp for StereoPannerNode
      if (spatial.pannerNode && spatial.pannerNode.pan) {
        try {
          spatial.pannerNode.pan.cancelScheduledValues(now);
          spatial.pannerNode.pan.setValueAtTime(spatial.pannerNode.pan.value, now);
          spatial.pannerNode.pan.linearRampToValueAtTime(pan, now + rampTimeSec);
        } catch (_) {
          try {
            spatial.pannerNode.pan.setTargetAtTime(pan, now, 0.012);
          } catch (__) {
            spatial.pannerNode.pan.value = pan;
          }
        }
      }

      // Smooth ramp for GainNode
      if (spatial.gainNode && spatial.gainNode.gain) {
        try {
          spatial.gainNode.gain.cancelScheduledValues(now);
          const currentGain = Math.max(0.0001, spatial.gainNode.gain.value);
          spatial.gainNode.gain.setValueAtTime(currentGain, now);
          spatial.gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), now + rampTimeSec);
        } catch (_) {
          try {
            spatial.gainNode.gain.setTargetAtTime(gain, now, 0.012);
          } catch (__) {
            spatial.gainNode.gain.value = gain;
          }
        }
      }
    } else {
      if (spatial.pannerNode && spatial.pannerNode.pan) {
        spatial.pannerNode.pan.value = pan;
      }
      if (spatial.gainNode && spatial.gainNode.gain) {
        spatial.gainNode.gain.value = gain;
      }
    }

    if (spatial.entry) {
      spatial.entry.panValue = pan;
      spatial.entry.gainValue = gain;
      spatial.entry.distance = distance;
      spatial.entry.normalizedDistance = normalizedDistance;
    }

    return {
      distance,
      normalizedDistance,
      gain,
      pan
    };
  }

  setupParticipantPan(participantId, index, totalParticipants) {
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    const panValue = this.calculateGridPan(index, totalParticipants);
    const spatial = this.getParticipantSpatialPanner(participantId);
    if (!spatial) return null;

    const entry = spatial.entry;
    this.setParticipantPan(participantId, panValue);
    entry.index = index;

    return entry;
  }

  /**
   * Sets stereo pan position with smooth exponential/target transition
   * @param {string} participantId
   * @param {number} panValue - Between -0.8 and +0.8
   */
  setParticipantPan(participantId, panValue) {
    const entry = this.participants.get(participantId);
    if (!entry) return;

    const ctx = this.getAudioContext();
    const clampedPan = Math.max(-0.8, Math.min(0.8, Number(panValue) || 0));
    entry.panValue = clampedPan;

    if (entry.pannerNode && ctx) {
      try {
        entry.pannerNode.pan.setTargetAtTime(clampedPan, ctx.currentTime, 0.05);
      } catch (_) {
        entry.pannerNode.pan.value = clampedPan;
      }
    }
  }

  /**
   * Re-balances pan positions for all participants in a given array order
   * @param {string[]} participantIds
   */
  updateGridPositions(participantIds = []) {
    const total = participantIds.length;
    participantIds.forEach((id, index) => {
      this.setupParticipantPan(id, index, total);
    });
  }

  /**
   * Connect an HTMLAudioElement to participant's spatial audio chain
   * @param {string} participantId
   * @param {HTMLAudioElement} audioElement
   * @returns {MediaElementAudioSourceNode|null}
   */
  connectParticipantAudioElement(participantId, audioElement) {
    const entry = this.participants.get(participantId) || this.setupParticipantPan(participantId, 0, 1);
    if (!entry || !audioElement) return null;

    const ctx = this.getAudioContext();
    if (!ctx) return null;

    try {
      if (entry.sourceNode) {
        try { entry.sourceNode.disconnect(); } catch (_) {}
      }
      const source = ctx.createMediaElementSource(audioElement);
      source.connect(entry.gainNode);
      entry.sourceNode = source;
      return source;
    } catch (err) {
      console.warn('[ChronEX DSP] MediaElement source setup note:', err);
      return null;
    }
  }

  /**
   * Connect a MediaStream (e.g. WebRTC remote track) to participant's spatial audio chain
   * @param {string} participantId
   * @param {MediaStream} mediaStream
   * @returns {MediaStreamAudioSourceNode|null}
   */
  connectParticipantStream(participantId, mediaStream) {
    const entry = this.participants.get(participantId) || this.setupParticipantPan(participantId, 0, 1);
    if (!entry || !mediaStream) return null;

    const ctx = this.getAudioContext();
    if (!ctx) return null;

    try {
      if (entry.sourceNode) {
        try { entry.sourceNode.disconnect(); } catch (_) {}
      }
      const source = ctx.createMediaStreamSource(mediaStream);
      source.connect(entry.gainNode);
      entry.sourceNode = source;
      return source;
    } catch (err) {
      console.warn('[ChronEX DSP] MediaStream source setup note:', err);
      return null;
    }
  }

  /**
   * Set participant volume level (0.0 to 2.0)
   * @param {string} participantId
   * @param {number} volume
   */
  setParticipantVolume(participantId, volume = 1.0) {
    const entry = this.participants.get(participantId);
    if (entry && entry.gainNode) {
      const ctx = this.getAudioContext();
      const clamped = Math.max(0, Math.min(2.0, volume));
      if (ctx) {
        entry.gainNode.gain.setTargetAtTime(clamped, ctx.currentTime, 0.05);
      } else {
        entry.gainNode.gain.value = clamped;
      }
    }
  }

  /**
   * Removes participant from spatial matrix and disconnects nodes
   * @param {string} participantId
   */
  removeParticipant(participantId) {
    const entry = this.participants.get(participantId);
    if (entry) {
      try {
        if (entry.sourceNode) entry.sourceNode.disconnect();
        if (entry.gainNode) entry.gainNode.disconnect();
        if (entry.pannerNode) entry.pannerNode.disconnect();
      } catch (_) {}
      this.participants.delete(participantId);
    }
  }

  /**
   * Cleans up all participants from spatial matrix
   */
  clearAllParticipants() {
    for (const id of this.participants.keys()) {
      this.removeParticipant(id);
    }
  }

  // =========================================================================
  // SECTION 5: TACTICAL CANVAS VISUALIZER RENDERERS
  // Cyberpunk spectrum bars, oscilloscope waveform, and circular audio rings
  // =========================================================================

  /**
   * Render cyberpunk frequency bars on an HTML5 canvas element
   * @param {HTMLCanvasElement} canvas
   * @param {Object} [options]
   */
  drawFrequencyBars(canvas, options = {}) {
    if (!canvas || !this.micAnalyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barCount = options.barCount || 32;
    const gap = options.gap || 2;

    const fft = this.getByteFrequencyData();
    ctx.clearRect(0, 0, width, height);

    const totalGap = gap * (barCount - 1);
    const barWidth = Math.max(2, (width - totalGap) / barCount);
    const step = Math.floor(fft.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = fft[i * step] || 0;
      const percent = value / 255;
      const barHeight = Math.max(3, percent * height);
      const x = i * (barWidth + gap);
      const y = height - barHeight;

      // Cyberpunk cyan to neon green gradient
      const grad = ctx.createLinearGradient(0, y, 0, height);
      grad.addColorStop(0, '#00f2ff');
      grad.addColorStop(1, '#00ff66');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  /**
   * Render tactical oscilloscope line on an HTML5 canvas element
   * @param {HTMLCanvasElement} canvas
   * @param {Object} [options]
   */
  drawOscilloscopeWaveform(canvas, options = {}) {
    if (!canvas || !this.micAnalyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const color = options.color || '#00f2ff';
    const lineWidth = options.lineWidth || 2;

    const timeData = this.getByteTimeDomainData();
    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.beginPath();

    const sliceWidth = width / timeData.length;
    let x = 0;

    for (let i = 0; i < timeData.length; i++) {
      const v = timeData[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /**
   * Render circular glowing ripple rings on an HTML5 canvas element over participant avatar
   * @param {HTMLCanvasElement} canvas
   * @param {Object} [options]
   */
  drawCircularRipples(canvas, options = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width || 84;
    const height = canvas.height || 84;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(centerX, centerY) - 2;
    const energy = options.energy !== undefined ? options.energy : (this.micAnalyser ? (this.getDecibelLevel() + 70) / 70 : 0.6);
    const clampedEnergy = Math.max(0, Math.min(1, energy));

    ctx.clearRect(0, 0, width, height);
    if (clampedEnergy <= 0.05) return;

    const ringCount = options.ringCount || 3;
    const time = performance.now() * 0.003;

    for (let r = 0; r < ringCount; r++) {
      const offset = (time + (r / ringCount)) % 1.0;
      const radius = 22 + offset * (maxRadius - 22);
      const alpha = (1 - offset) * clampedEnergy * 0.85;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = r % 2 === 0 ? `rgba(0, 242, 255, ${alpha})` : `rgba(0, 255, 102, ${alpha})`;
      ctx.lineWidth = 1.5 + clampedEnergy * 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = r % 2 === 0 ? '#00f2ff' : '#00ff66';
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }
}

// Singleton instance for immediate plug-and-play use
export const chronexLiveVcDsp = new ChronexLiveVcDsp();

// Global browser window attachment for native DOM engines
if (typeof window !== 'undefined') {
  window.ChronexLiveVcDsp = ChronexLiveVcDsp;
  window.chronexLiveVcDsp = chronexLiveVcDsp;
}

export default chronexLiveVcDsp;
