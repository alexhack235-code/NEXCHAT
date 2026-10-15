// js/game_modules/audio.js
// High-performance procedural Web Audio API synthesizer for NEXCHAT game modules

class ModularAudio {
  constructor() {
    this.ctx = null;
    this.trainGain = null;
    this.trainOsc = null;
    this.jetGain = null;
    this.jetOsc = null;
  }

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playChirp() {
    this.init(); if (!this.ctx) return;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.14);
    osc.start(); osc.stop(this.ctx.currentTime + 0.14);
  }

  playLootChime() {
    this.init(); if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.type = 'triangle';
      const t = this.ctx.currentTime + idx * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t); osc.stop(t + 0.45);
    });
  }

  playFootstep() {
    this.init(); if (!this.ctx) return;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80 + Math.random() * 30, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.08);
    osc.start(); osc.stop(this.ctx.currentTime + 0.08);
  }

  playMaglevTrainSound() {
    this.init(); if (!this.ctx) return;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, this.ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
    osc.start(); osc.stop(this.ctx.currentTime + 1.5);
  }

  playJetEngineSound(throttle = 50, speed = 40) {
    this.init(); if (!this.ctx) return;
    if (!this.jetOsc) {
      this.jetOsc = this.ctx.createOscillator();
      this.jetGain = this.ctx.createGain();
      this.jetOsc.type = 'sawtooth';
      this.jetOsc.connect(this.jetGain);
      this.jetGain.connect(this.ctx.destination);
      this.jetGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.jetOsc.start();
    }
    const freq = 120 + (throttle / 100) * 280 + speed * 1.5;
    this.jetOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    this.jetGain.gain.setTargetAtTime(Math.min(0.18, (throttle / 100) * 0.18), this.ctx.currentTime, 0.1);
  }

  stopJetEngineSound() {
    if (this.jetGain && this.ctx) {
      this.jetGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
  }
}

window.cyberAudio = new ModularAudio();
