/**
 * NEXCHAT - Voice Morpher & Cyber Soundboard Engine
 * Real-time audio DSP filtering (Robotic, Stealth Shadow, Glitch, Helium)
 * + 8-pad synthesized tactile soundboard with live chat broadcasting.
 */

(function() {
  'use strict';

  class VoiceSoundboardEngine {
    constructor() {
      this.currentMorpherMode = 'normal'; // 'normal' | 'cyberborg' | 'shadow' | 'glitch' | 'helium'
      this.audioCtx = null;
      this.activeSourceNode = null;
      this.morpherDestination = null;
      this.broadcastSoundEnabled = true;
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    getAudioContext() {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    }

    bindDOM() {
      this.injectMorpherBarIntoVoiceHUD();
      this.injectSoundboardModal();
      this.bindToggleTriggers();
      this.listenSupabaseRealtime();
    }

    // 1. Voice Morpher UI injection into voice recording & call screens
    injectMorpherBarIntoVoiceHUD() {
      const audioUI = document.getElementById('audioRecordingUI');
      if (audioUI && !document.getElementById('voiceMorpherBar')) {
        const bar = document.createElement('div');
        bar.id = 'voiceMorpherBar';
        bar.className = 'voice-morpher-bar';
        bar.innerHTML = `
          <span class="morpher-label"><i class="fa-solid fa-wand-magic-sparkles"></i> VOICE FX:</span>
          <div class="morpher-pills-wrap">
            <button type="button" class="morpher-pill active" data-mode="normal"><i class="fa-solid fa-microphone"></i> Normal</button>
            <button type="button" class="morpher-pill" data-mode="cyberborg"><i class="fa-solid fa-robot"></i> Cyberborg</button>
            <button type="button" class="morpher-pill" data-mode="shadow"><i class="fa-solid fa-glasses"></i> Shadow</button>
            <button type="button" class="morpher-pill" data-mode="glitch"><i class="fa-solid fa-bolt"></i> Glitch</button>
            <button type="button" class="morpher-pill" data-mode="helium"><i class="fa-solid fa-cloud"></i> Helium</button>
          </div>
        `;

        audioUI.insertBefore(bar, audioUI.firstChild);

        bar.querySelectorAll('.morpher-pill').forEach(pill => {
          pill.addEventListener('click', () => {
            bar.querySelectorAll('.morpher-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            this.setMorpherMode(pill.dataset.mode);
          });
        });
      }
    }

    setMorpherMode(mode) {
      this.currentMorpherMode = mode;
      if (typeof window.showNotif === 'function') {
        const names = {
          normal: 'Standard Voice (Natural Audio)',
          cyberborg: 'Neural Cyberborg (Robotic Vocoder FX)',
          shadow: 'Shadow Operative (Stealth Pitch Shift)',
          glitch: 'Overclocked Glitch (Hacker Bitcrusher FX)',
          helium: 'Micro-Drone (High Frequency Chirp)'
        };
        window.showNotif(`[VOICE FILTER]: ${names[mode] || mode}`, 'info', 1800);
      }
      this.playSfx('zap');
    }

    // Real-Time Web Audio DSP Stream Transformer
    applyMorpher(inputStream) {
      if (!inputStream || this.currentMorpherMode === 'normal') {
        return inputStream;
      }

      try {
        const ctx = this.getAudioContext();
        const source = ctx.createMediaStreamSource(inputStream);
        const destination = ctx.createMediaStreamDestination();

        let lastNode = source;

        if (this.currentMorpherMode === 'cyberborg') {
          // Bandpass vocoder emulation + ring modulation
          const biquad = ctx.createBiquadFilter();
          biquad.type = 'bandpass';
          biquad.frequency.value = 1100;
          biquad.Q.value = 5.0;

          const ringGain = ctx.createGain();
          ringGain.gain.value = 0.5;

          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.value = 45; // 45 Hz low-frequency ring modulator
          osc.connect(ringGain.gain);
          osc.start();

          lastNode.connect(biquad);
          biquad.connect(ringGain);
          lastNode = ringGain;

        } else if (this.currentMorpherMode === 'shadow') {
          // Deep pitch-shifted low-frequency resonance + distortion
          const lowShelf = ctx.createBiquadFilter();
          lowShelf.type = 'lowshelf';
          lowShelf.frequency.value = 160;
          lowShelf.gain.value = 14;

          const highCut = ctx.createBiquadFilter();
          highCut.type = 'highshelf';
          highCut.frequency.value = 2200;
          highCut.gain.value = -18;

          const shaper = ctx.createWaveShaper();
          shaper.curve = this.makeDistortionCurve(25);
          shaper.oversample = '4x';

          lastNode.connect(lowShelf);
          lowShelf.connect(highCut);
          highCut.connect(shaper);
          lastNode = shaper;

        } else if (this.currentMorpherMode === 'glitch') {
          // Bitcrusher quantization & aggressive saturation
          const shaper = ctx.createWaveShaper();
          shaper.curve = this.makeBitcrusherCurve(8);

          const midFilter = ctx.createBiquadFilter();
          midFilter.type = 'peaking';
          midFilter.frequency.value = 1800;
          midFilter.gain.value = 8;

          lastNode.connect(shaper);
          shaper.connect(midFilter);
          lastNode = midFilter;

        } else if (this.currentMorpherMode === 'helium') {
          // High-frequency chirp boost
          const highPass = ctx.createBiquadFilter();
          highPass.type = 'highpass';
          highPass.frequency.value = 650;

          const peak = ctx.createBiquadFilter();
          peak.type = 'peaking';
          peak.frequency.value = 3200;
          peak.gain.value = 12;

          lastNode.connect(highPass);
          highPass.connect(peak);
          lastNode = peak;
        }

        lastNode.connect(destination);

        // Keep any video tracks intact
        const morphedStream = destination.stream;
        inputStream.getVideoTracks().forEach(track => {
          morphedStream.addTrack(track);
        });

        return morphedStream;
      } catch (err) {
        console.warn('Voice morpher error, falling back to raw stream:', err);
        return inputStream;
      }
    }

    makeDistortionCurve(amount) {
      const k = typeof amount === 'number' ? amount : 50;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      return curve;
    }

    makeBitcrusherCurve(bits) {
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const step = 2 / Math.pow(2, bits);
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = Math.round(x / step) * step;
      }
      return curve;
    }

    // 2. Tactile Cyber Soundboard UI & Synthesizers
    injectSoundboardModal() {
      if (document.getElementById('cyberSoundboardModal')) return;

      const modal = document.createElement('div');
      modal.id = 'cyberSoundboardModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window soundboard-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-volume-high text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">CYBER SOUNDBOARD // AUDIO MEMES</h3>
            </div>
            <button type="button" class="cyber-modal-close" id="closeSoundboardModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="soundboard-body">
            <div class="soundboard-broadcast-toggle-row">
              <label class="soundboard-toggle-label">
                <input type="checkbox" id="broadcastSoundToggle" checked />
                <span>Broadcast SFX to Chat Partner Live</span>
              </label>
              <span class="text-xs text-gray-400">0ms Web Audio Latency</span>
            </div>

            <div class="soundboard-grid mt-4">
              <button type="button" class="soundboard-pad-btn" data-sfx="airhorn">
                <span class="pad-emoji"><i class="fa-solid fa-bullhorn"></i></span>
                <span class="pad-name">AIRHORN</span>
              </button>
              <button type="button" class="soundboard-pad-btn" data-sfx="glitch">
                <span class="pad-emoji"><i class="fa-solid fa-bolt"></i></span>
                <span class="pad-name">GLITCH</span>
              </button>
              <button type="button" class="soundboard-pad-btn" data-sfx="bassdrop">
                <span class="pad-emoji"><i class="fa-solid fa-burst"></i></span>
                <span class="pad-name">808 DROP</span>
              </button>
              <button type="button" class="soundboard-pad-btn" data-sfx="victory">
                <span class="pad-emoji"><i class="fa-solid fa-trophy"></i></span>
                <span class="pad-name">VICTORY</span>
              </button>
              <button type="button" class="soundboard-pad-btn" data-sfx="buzzer">
                <span class="pad-emoji"><i class="fa-solid fa-xmark"></i></span>
                <span class="pad-name">BRUH / BUZZ</span>
              </button>
              <button type="button" class="soundboard-pad-btn" data-sfx="complete">
                <span class="pad-emoji"><i class="fa-solid fa-sparkles"></i></span>
                <span class="pad-name">MISSION OK</span>
              </button>
              <button type="button" class="soundboard-pad-btn" data-sfx="heartbeat">
                <span class="pad-emoji"><i class="fa-solid fa-heart-pulse"></i></span>
                <span class="pad-name">HEARTBEAT</span>
              </button>
              <button type="button" class="soundboard-pad-btn" data-sfx="zap">
                <span class="pad-emoji"><i class="fa-solid fa-gun"></i></span>
                <span class="pad-name">LASER ZAP</span>
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('closeSoundboardModalBtn')?.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      const broadcastCheckbox = document.getElementById('broadcastSoundToggle');
      if (broadcastCheckbox) {
        broadcastCheckbox.addEventListener('change', () => {
          this.broadcastSoundEnabled = broadcastCheckbox.checked;
        });
      }

      modal.querySelectorAll('.soundboard-pad-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const sfx = btn.dataset.sfx;
          this.triggerSoundboardSfx(sfx);

          btn.classList.add('pad-active-flash');
          setTimeout(() => btn.classList.remove('pad-active-flash'), 250);
        });
      });
    }

    bindToggleTriggers() {
      // Toggle soundboard from message bar button
      const toggleBtn = document.getElementById('soundboardToggleBtn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const modal = document.getElementById('cyberSoundboardModal');
          if (modal) {
            modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
          }
        });
      }
    }

    triggerSoundboardSfx(sfxType) {
      // 1. Play locally
      this.playSfx(sfxType);

      // 2. Broadcast to partner if enabled
      if (this.broadcastSoundEnabled && typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (partnerId) {
          window.sendSupabaseMessage({
            from: window.myUID || 'u_current',
            to: partnerId,
            text: "",
            attachment: {
              fileType: 'soundboard_ping',
              isSoundboardPing: true,
              soundType: sfxType,
              senderName: window.currentUserName || 'Partner'
            },
            chatType: window.currentChatType || 'direct'
          }).catch(console.warn);
        }
      }
    }

    playSfx(type) {
      try {
        const ctx = this.getAudioContext();
        const now = ctx.currentTime;

        if (type === 'airhorn') {
          // Dual sawtooth blast with octave harmonic
          [466.16, 472.0, 932.33].forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(freq * 1.05, now + 0.1);
            osc.frequency.linearRampToValueAtTime(freq * 0.98, now + 0.5);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.6);
          });

        } else if (type === 'bassdrop') {
          // 808 exponential sub-bass drop
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(36, now + 0.8);

          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.9);

        } else if (type === 'victory') {
          // 4-note arcade fanfare
          const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
          notes.forEach((freq, idx) => {
            const t = now + idx * 0.12;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.28);
          });

        } else if (type === 'buzzer') {
          // Dissonant harsh rejection buzz
          [145, 153].forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.45);
          });

        } else if (type === 'glitch') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(2400, now);
          osc.frequency.linearRampToValueAtTime(320, now + 0.08);
          osc.frequency.linearRampToValueAtTime(1600, now + 0.16);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);

        } else if (type === 'complete') {
          [659.25, 880.0, 1174.66, 1760.0].forEach((freq, idx) => {
            const t = now + idx * 0.08;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.38);
          });

        } else if (type === 'heartbeat') {
          // Double acoustic sub-kick pulse
          [0, 0.22].forEach(delay => {
            const t = now + delay;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(75, t);
            osc.frequency.exponentialRampToValueAtTime(42, t + 0.15);

            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.2);
          });

        } else if (type === 'zap') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2400, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.28);
        }
      } catch (e) {
        console.warn('SFX Synth error:', e);
      }
    }

    listenSupabaseRealtime() {
      window.addEventListener('nexchat:soundboard_sfx_received', (e) => {
        const data = e.detail;
        if (!data || !data.soundType) return;
        this.playSfx(data.soundType);
        if (typeof window.showNotif === 'function') {
          window.showNotif(`[AUDIO] ${data.senderName || 'Partner'} played: [${data.soundType.toUpperCase()}]`, 'info', 2000);
        }
      });
    }
  }

  window.voiceSoundboardEngine = new VoiceSoundboardEngine();
})();
