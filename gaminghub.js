// ============================================================
// NEXCHAT GAMING HUB — ASTROSHIFT: BEYOND EARTH CONTROLLER
// Exclusively dedicated to AstroShift: beyond Earth
// ============================================================

(function () {
  'use strict';

  // Sound FX Synthesizer using Web Audio API
  class HubAudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } catch (_) {}
    }

    playLaunchTone() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
      } catch (_) {}
    }
  }

  const hubAudio = new HubAudioEngine();

  // DOM Elements
  const openSpecsBtn = document.getElementById('openSpecsBtn');
  const closeSpecsBtn = document.getElementById('closeSpecsBtn');
  const specsModal = document.getElementById('specsModal');
  const hubAudioToggle = document.getElementById('hubAudioToggle');
  const hubTokenBalance = document.getElementById('hubTokenBalance');
  const btnLaunchAstro = document.getElementById('btnLaunchAstro');

  // Token synchronization
  function syncTokens() {
    try {
      const userTokens = localStorage.getItem('nex_user_tokens') || '1250';
      if (hubTokenBalance) {
        hubTokenBalance.textContent = Number(userTokens).toLocaleString();
      }
    } catch (_) {}
  }

  // Modal open/close
  if (openSpecsBtn && specsModal) {
    openSpecsBtn.addEventListener('click', () => {
      hubAudio.playClick();
      specsModal.style.display = 'flex';
    });
  }

  if (closeSpecsBtn && specsModal) {
    closeSpecsBtn.addEventListener('click', () => {
      hubAudio.playClick();
      specsModal.style.display = 'none';
    });
  }

  if (specsModal) {
    specsModal.addEventListener('click', (e) => {
      if (e.target === specsModal) {
        specsModal.style.display = 'none';
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && specsModal) {
      specsModal.style.display = 'none';
    }
  });

  // Audio toggle
  if (hubAudioToggle) {
    hubAudioToggle.addEventListener('click', () => {
      hubAudio.enabled = !hubAudio.enabled;
      hubAudio.playClick();
      const icon = hubAudioToggle.querySelector('i');
      if (icon) {
        icon.className = hubAudio.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
      }
    });
  }

  // Launch button sound
  if (btnLaunchAstro) {
    btnLaunchAstro.addEventListener('click', () => {
      hubAudio.playLaunchTone();
    });
  }

  // Init
  syncTokens();
  console.log('[Gaming Hub] Exclusively configured for AstroShift: beyond Earth.');
})();
