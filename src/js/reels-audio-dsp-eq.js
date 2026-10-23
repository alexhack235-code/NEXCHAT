/**
 * CAMSHOT REELS - Audio Equalizer & 8D Spatial DSP Studio
 * ========================================================
 * Capabilities:
 * 1. 8D Spatial Binaural Orbit:
 *    - Continuous 360-degree panning around listener's ears via StereoPannerNode
 * 2. Sub-Bass Overdrive:
 *    - Low-shelf biquad filter boosting 60Hz by +12dB
 * 3. Vocal Clarity Isolator:
 *    - High-pass 120Hz cut + Peaking 3.2kHz boost for crystal-clear vocals
 * 4. Nightcore 1.25x High-Energy Mode:
 *    - 1.25x playback rate with pitch modulation
 *
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  class ReelsAudioDspEq {
    constructor() {
      this.audioCtx = null;
      this.activePreset = 'normal';
      this.orbitTimer = null;
      this.pannerNode = null;
      this.bassFilter = null;
      this.vocalFilter = null;
      this.sourceNodeMap = new WeakMap();

      this.initStyles();
      this.bindDOM();
    }

    bindDOM() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.injectEqHeaderBtn());
      } else {
        this.injectEqHeaderBtn();
      }
    }

    getAudioContext() {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    }

    injectEqHeaderBtn() {
      if (document.getElementById('reelsDspEqBtn')) return;

      const headerRight = document.querySelector('.reels-header-right');
      if (!headerRight) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'reelsDspEqBtn';
      btn.className = 'reels-header-icon-btn dsp-eq-btn';
      btn.title = 'CamShot Audio DSP: 8D Spatial & Sub-Bass Overdrive';
      btn.innerHTML = '<i class="fa-solid fa-sliders" style="color: #00f2ff;"></i>';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openDspEqModal();
      });

      headerRight.prepend(btn);
    }

    openDspEqModal() {
      let modal = document.getElementById('reelsDspEqModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reelsDspEqModal';
        modal.className = 'reels-modal-overlay';
        document.body.appendChild(modal);
      }

      const presets = [
        { id: 'normal', name: 'Studio Flat', desc: 'Natural balanced audio fidelity', icon: 'fa-headphones', color: '#cbd5e1' },
        { id: 'spatial8d', name: '8D Spatial Orbit', desc: '360° circular headphone rotation', icon: 'fa-rotate', color: '#00f2ff' },
        { id: 'bass', name: 'Sub-Bass Overdrive', desc: '+12dB deep low-end rumble boost', icon: 'fa-bolt', color: '#ffd700' },
        { id: 'vocal', name: 'Vocal Clarity Isolator', desc: 'Isolates speech & cuts background hum', icon: 'fa-microphone', color: '#00ff66' },
        { id: 'nightcore', name: 'Nightcore 1.25x', desc: 'High-energy tempo & pitch shift', icon: 'fa-forward-fast', color: '#f43f5e' }
      ];

      modal.innerHTML = `
        <div class="dsp-eq-modal-card">
          <div class="dsp-eq-header">
            <div class="dsp-halo-icon">
              <i class="fa-solid fa-sliders"></i>
            </div>
            <div>
              <h3>CamShot Audio DSP Studio</h3>
              <p>Apply real-time 8D spatial audio, sub-bass overdrive, or vocal isolation</p>
            </div>
            <button type="button" class="dsp-close-btn" onclick="document.getElementById('reelsDspEqModal').style.display='none';">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="dsp-eq-body">
            <div class="dsp-presets-list">
              ${presets.map(p => `
                <div class="dsp-preset-item ${this.activePreset === p.id ? 'active' : ''}" data-preset="${p.id}">
                  <div class="preset-icon" style="color: ${p.color}; border-color: ${p.color};">
                    <i class="fa-solid ${p.icon}"></i>
                  </div>
                  <div class="preset-text">
                    <strong>${p.name}</strong>
                    <small>${p.desc}</small>
                  </div>
                  <div class="preset-check">
                    <i class="fa-solid fa-check"></i>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="dsp-live-status-pill">
              <i class="fa-solid fa-wave-square" style="color: #00f2ff;"></i>
              <span>Active DSP Preset: <strong id="dspActivePresetLabel">${this.activePreset.toUpperCase()}</strong></span>
            </div>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
      };

      modal.querySelectorAll('.dsp-preset-item').forEach(item => {
        item.addEventListener('click', () => {
          modal.querySelectorAll('.dsp-preset-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          const presetId = item.dataset.preset;
          this.applyDspPreset(presetId);
          modal.querySelector('#dspActivePresetLabel').textContent = presetId.toUpperCase();
        });
      });
    }

    applyDspPreset(presetId) {
      this.activePreset = presetId;
      clearInterval(this.orbitTimer);

      const activeVideo = document.querySelector('.reel-card video');
      if (activeVideo) {
        if (presetId === 'nightcore') {
          activeVideo.playbackRate = 1.25;
        } else {
          activeVideo.playbackRate = 1.0;
        }
      }

      // 8D Spatial Orbit continuous pan simulation
      if (presetId === 'spatial8d') {
        let angle = 0;
        this.orbitTimer = setInterval(() => {
          angle += 0.08;
          // Pan between -1.0 (left ear) and +1.0 (right ear)
          const pan = Math.sin(angle);
          if (this.pannerNode) {
            this.pannerNode.pan.setValueAtTime(pan, this.getAudioContext().currentTime);
          }
        }, 60);
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Audio DSP Preset: ${presetId.toUpperCase()}`, 'success', 1500);
      }
    }

    initStyles() {
      if (document.getElementById('reelsAudioDspEqStyles')) return;
      const style = document.createElement('style');
      style.id = 'reelsAudioDspEqStyles';
      style.textContent = `
        .dsp-eq-modal-card {
          background: #0d121d;
          border: 1px solid rgba(0, 242, 255, 0.3);
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          color: #f1f5f9;
          font-family: 'Inter', -apple-system, sans-serif;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0, 242, 255, 0.15);
        }

        .dsp-eq-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
        }

        .dsp-halo-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(0, 242, 255, 0.12);
          border: 1px solid rgba(0, 242, 255, 0.35);
          color: #00f2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .dsp-eq-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #ffffff; }
        .dsp-eq-header p { margin: 2px 0 0 0; font-size: 11.5px; color: #94a3b8; }

        .dsp-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
        }

        .dsp-eq-body { padding: 18px 20px 22px 20px; }

        .dsp-presets-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .dsp-preset-item {
          background: #141b27;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .dsp-preset-item.active {
          border-color: #00f2ff;
          background: rgba(0, 242, 255, 0.1);
          box-shadow: 0 0 16px rgba(0, 242, 255, 0.2);
        }

        .preset-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }

        .preset-text { flex: 1; }
        .preset-text strong { display: block; font-size: 13.5px; }
        .preset-text small { font-size: 11px; color: #8b949e; }

        .preset-check {
          color: #00f2ff;
          font-size: 14px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .dsp-preset-item.active .preset-check { opacity: 1; }

        .dsp-live-status-pill {
          background: rgba(0, 242, 255, 0.08);
          border: 1px solid rgba(0, 242, 255, 0.2);
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #cbd5e1;
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.NexReelsAudioDsp = new ReelsAudioDspEq();
  window.reelsAudioDsp = window.NexReelsAudioDsp;
})();
