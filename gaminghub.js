// ============================================================
// NEXCHAT GAMING HUB — ASTROSHIFT: BEYOND EARTH CONTROLLER
// CLOSED DEVELOPMENT: EARLY ACCESS EMAIL REGISTRATION ONLY
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

    playSuccessChime() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.09, this.ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(this.ctx.currentTime + idx * 0.08);
          osc.stop(this.ctx.currentTime + idx * 0.08 + 0.35);
        });
      } catch (_) {}
    }

    playLockBuzz() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.setValueAtTime(110, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
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
  const specsRegisterBtn = document.getElementById('specsRegisterBtn');

  // Early Access Form Elements
  const earlyAccessRegBox = document.getElementById('earlyAccessRegBox');
  const earlyAccessEmailForm = document.getElementById('earlyAccessEmailForm');
  const earlyAccessEmailInput = document.getElementById('earlyAccessEmailInput');
  const earlyAccessConfirmedCard = document.getElementById('earlyAccessConfirmedCard');
  const confirmedEmailDisplay = document.getElementById('confirmedEmailDisplay');
  const confirmedQueueNum = document.getElementById('confirmedQueueNum');
  const btnRegisterEmail = document.getElementById('btnRegisterEmail');

  // Token synchronization
  function syncTokens() {
    try {
      const userTokens = localStorage.getItem('nex_user_tokens') || '1250';
      if (hubTokenBalance) {
        hubTokenBalance.textContent = Number(userTokens).toLocaleString();
      }
    } catch (_) {}
  }

  // Focus and Highlight the Early Access Registration Box
  function highlightRegistrationBox() {
    hubAudio.playLockBuzz();
    if (earlyAccessRegBox) {
      earlyAccessRegBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      earlyAccessRegBox.classList.add('glow-flash');
      setTimeout(() => earlyAccessRegBox.classList.remove('glow-flash'), 1200);
    }
    if (earlyAccessEmailInput) {
      earlyAccessEmailInput.focus();
    }
  }

  // Check existing early access registration
  function checkExistingRegistration() {
    const isRegistered = localStorage.getItem('nex_astro_early_access_registered') === 'true';
    const savedEmail = localStorage.getItem('nex_astro_early_access_email');
    const savedQueue = localStorage.getItem('nex_astro_queue_num') || '14,893';

    if (isRegistered && savedEmail) {
      if (earlyAccessEmailForm) earlyAccessEmailForm.style.display = 'none';
      if (earlyAccessConfirmedCard) earlyAccessConfirmedCard.style.display = 'flex';
      if (confirmedEmailDisplay) confirmedEmailDisplay.textContent = savedEmail;
      if (confirmedQueueNum) confirmedQueueNum.textContent = savedQueue;
    }
  }

  // Handle Early Access Email Submission
  if (earlyAccessEmailForm) {
    earlyAccessEmailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = earlyAccessEmailInput.value.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        alert('Please enter a valid email address.');
        return;
      }

      if (btnRegisterEmail) {
        btnRegisterEmail.disabled = true;
        btnRegisterEmail.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>REGISTERING...</span>';
      }

      // Generate Queue Number
      const queueNumber = '14,' + Math.floor(895 + Math.random() * 80).toString();

      // Save to localStorage
      localStorage.setItem('nex_astro_early_access_registered', 'true');
      localStorage.setItem('nex_astro_early_access_email', email);
      localStorage.setItem('nex_astro_queue_num', queueNumber);
      localStorage.setItem('nex_astro_registered_time', new Date().toISOString());

      // Attempt to dispatch security alert / email via API
      try {
        await fetch('/api/send-email-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'early_access_registration',
            toEmail: email,
            data: {
              email: email,
              queueNumber: queueNumber,
              gameTitle: 'AstroShift: Beyond Earth',
              registeredAt: new Date().toUTCString()
            }
          })
        }).catch(() => {});
      } catch (_) {}

      // Play chime
      hubAudio.playSuccessChime();

      // UI Transition
      earlyAccessEmailForm.style.display = 'none';
      if (earlyAccessConfirmedCard) earlyAccessConfirmedCard.style.display = 'flex';
      if (confirmedEmailDisplay) confirmedEmailDisplay.textContent = email;
      if (confirmedQueueNum) confirmedQueueNum.textContent = queueNumber;

      if (btnRegisterEmail) {
        btnRegisterEmail.disabled = false;
        btnRegisterEmail.innerHTML = '<i class="fa-solid fa-check"></i> <span>REGISTERED</span>';
      }
    });
  }

  // Launch AstroShift Unity 3D Game directly
  if (btnLaunchAstro) {
    btnLaunchAstro.addEventListener('click', (e) => {
      hubAudio.playClick();
      window.location.href = 'unity_game.html';
    });
  }

  if (specsRegisterBtn) {
    specsRegisterBtn.addEventListener('click', () => {
      if (specsModal) specsModal.style.display = 'none';
      highlightRegistrationBox();
    });
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

  // Init
  syncTokens();
  checkExistingRegistration();
  console.log('[Gaming Hub] LOCKED & SECURED: Closed Development Early Access Email Registration Active.');
})();
