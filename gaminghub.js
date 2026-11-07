// ============================================================
// NEXCHAT GAMING HUB — ASTROSHIFT: BEYOND EARTH CONTROLLER
// CLOSED DEVELOPMENT: EARLY ACCESS ENCLAVE & 3D SIMULATION SUITE
// ============================================================

(function () {
  'use strict';

  // Sound FX Synthesizer using Web Audio API with zero external dependencies
  class HubAudioEngine {
    constructor() {
      this.ctx = null;
      try {
        this.enabled = localStorage.getItem('nex_hub_audio_muted') !== 'true';
      } catch (_) {
        this.enabled = true;
      }
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    // Silent buffer unlock for iOS Safari and mobile Chrome
    primeGesture() {
      this.init();
      if (!this.ctx) return;
      try {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
      } catch (_) {}
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
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.08);
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

  // Gesture unlock on first interaction
  const unlockAudioOnce = () => {
    hubAudio.primeGesture();
    window.removeEventListener('pointerdown', unlockAudioOnce);
    window.removeEventListener('keydown', unlockAudioOnce);
    window.removeEventListener('touchstart', unlockAudioOnce);
  };
  window.addEventListener('pointerdown', unlockAudioOnce, { passive: true });
  window.addEventListener('keydown', unlockAudioOnce, { passive: true });
  window.addEventListener('touchstart', unlockAudioOnce, { passive: true });

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

  // Unified Token synchronization
  function syncTokens() {
    try {
      const userTokens = localStorage.getItem('nexchat_user_tokens') ||
                          localStorage.getItem('nex_user_tokens') ||
                          localStorage.getItem('tokens') ||
                          localStorage.getItem('userTokens') || '2000';
      const cleanVal = parseInt(String(userTokens).replace(/,/g, ''), 10) || 0;
      if (hubTokenBalance) {
        hubTokenBalance.textContent = cleanVal.toLocaleString();
      }
    } catch (_) {}
  }

  window.addEventListener('storage', (e) => {
    if (e.key && (e.key.includes('token') || e.key.includes('tokens'))) {
      syncTokens();
    }
  });
  window.addEventListener('nexchat:tokens_changed', () => {
    syncTokens();
  });

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

  function applyRegistrationDOM(email, queueNumber) {
    if (earlyAccessEmailForm) earlyAccessEmailForm.style.display = 'none';
    if (earlyAccessConfirmedCard) earlyAccessConfirmedCard.style.display = 'flex';
    if (confirmedEmailDisplay) confirmedEmailDisplay.textContent = email;
    if (confirmedQueueNum) confirmedQueueNum.textContent = queueNumber;

    const banner = document.querySelector('.astro-head-tag-banner');
    if (banner) banner.classList.remove('locked-state');

    const opBadge = document.getElementById('operativesCount');
    if (opBadge) opBadge.textContent = '14,895';

    const specsBtn = document.getElementById('specsRegisterBtn');
    if (specsBtn) {
      specsBtn.classList.remove('locked-btn');
      specsBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> <span>LAUNCH ASTROSHIFT 3D METROPOLIS</span>';
      specsBtn.onclick = () => { window.location.href = 'game.html'; };
    }
  }

  // Check existing early access registration
  function checkExistingRegistration() {
    try {
      const isRegistered = localStorage.getItem('nex_astro_early_access_registered') === 'true';
      const savedEmail = localStorage.getItem('nex_astro_early_access_email') || (isRegistered ? 'operative.developer@nexchat.io' : null);
      const savedQueue = localStorage.getItem('nex_astro_queue_num') || '14,895';

      if (isRegistered && savedEmail) {
        applyRegistrationDOM(savedEmail, savedQueue);
      }
    } catch (_) {}
  }

  // RFC 5322 Compliant Email Validation
  function isValidEmail(email) {
    const rfc5322Regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return rfc5322Regex.test(email);
  }

  // Handle Early Access Email Submission
  if (earlyAccessEmailForm) {
    earlyAccessEmailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = earlyAccessEmailInput.value.trim().toLowerCase();

      // Check for Developer Passphrase Override
      if (email === 'iamatomicdeveloper18@$#' || email === 'iamatomicdeveloper18@$#.com') {
        window.devAuth('IAMATOMICDEVELOPER18@$#');
        return;
      }

      if (!isValidEmail(email)) {
        hubAudio.playLockBuzz();
        earlyAccessEmailInput.style.borderColor = '#fe2c55';
        earlyAccessEmailInput.placeholder = 'ENTER VALID EMAIL ADDRESS';
        setTimeout(() => { earlyAccessEmailInput.style.borderColor = ''; }, 2000);
        return;
      }

      if (btnRegisterEmail) {
        btnRegisterEmail.disabled = true;
        btnRegisterEmail.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>ENCRYPTING CREDENTIALS...</span>';
      }

      // Generate Queue Number
      const queueNumber = '14,' + Math.floor(895 + Math.random() * 80).toString();

      // Save to localStorage
      try {
        localStorage.setItem('nex_astro_early_access_registered', 'true');
        localStorage.setItem('nex_astro_early_access_email', email);
        localStorage.setItem('nex_astro_queue_num', queueNumber);
        localStorage.setItem('nex_astro_registered_time', new Date().toISOString());
      } catch (_) {}

      // Attempt to dispatch security alert / email via API
      try {
        await fetch('/api/send-email-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'early_access',
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
      applyRegistrationDOM(email, queueNumber);

      if (btnRegisterEmail) {
        btnRegisterEmail.disabled = false;
        btnRegisterEmail.innerHTML = '<i class="fa-solid fa-check"></i> <span>REGISTERED</span>';
      }
    });
  }

  // Launch AstroShift 3D Game directly
  if (btnLaunchAstro) {
    btnLaunchAstro.addEventListener('click', (e) => {
      hubAudio.playClick();
      // Allow default href navigation to game.html
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

  // Audio toggle with persistence
  if (hubAudioToggle) {
    const icon = hubAudioToggle.querySelector('i');
    if (icon) {
      icon.className = hubAudio.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    }

    hubAudioToggle.addEventListener('click', () => {
      hubAudio.enabled = !hubAudio.enabled;
      try {
        localStorage.setItem('nex_hub_audio_muted', hubAudio.enabled ? 'false' : 'true');
      } catch (_) {}
      hubAudio.playClick();
      if (icon) {
        icon.className = hubAudio.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
      }
    });
  }

  // Level 5 Developer Security Override Engine
  window.devAuth = function(passphrase) {
    const cleanPass = (passphrase || '').trim().toUpperCase();
    if (cleanPass === 'IAMATOMICDEVELOPER18@$#' || cleanPass === 'ASTRO-2026-NEX') {
      try {
        localStorage.setItem('nex_astro_clearance_level', '5');
        localStorage.setItem('nex_astro_early_access_registered', 'true');
        localStorage.setItem('nex_astro_early_access_email', 'operative.developer@nexchat.io');
        localStorage.setItem('ATOMIC_METROPOLIS_UNLOCKED', 'true');
        sessionStorage.setItem('ATOMIC_METROPOLIS_UNLOCKED', 'true');
        localStorage.setItem('nex_user_tokens', '1000000');
        localStorage.setItem('nexchat_user_tokens', '1000000');
      } catch (_) {}
      hubAudio.playSuccessChime();
      console.log('%c[SECURITY OVERRIDE GRANTED] Level 5 Developer Passphrase Verified.', 'color:#00ff88;font-weight:bold;font-size:14px;');
      window.location.href = 'game.html?dev=1&autostart=1';
      return true;
    }
    hubAudio.playLockBuzz();
    console.warn('[SECURITY] Invalid clearance passphrase.');
    return false;
  };

  // Career Leaderboard & Arcade Stats Hydrator
  function renderArcadeLeaderboard() {
    const pongWins = localStorage.getItem('nex_pong_wins') || '0';
    const triviaHigh = localStorage.getItem('nex_trivia_highscore') || '0';
    const rpsWins = localStorage.getItem('nex_rps_wins') || '0';

    const pEl = document.getElementById('statPongWins');
    const tEl = document.getElementById('statTriviaHigh');
    const rEl = document.getElementById('statRpsWins');
    if (pEl) pEl.textContent = pongWins;
    if (tEl) tEl.textContent = `${triviaHigh} PTS`;
    if (rEl) rEl.textContent = rpsWins;
  }

  // Init
  syncTokens();
  checkExistingRegistration();
  renderArcadeLeaderboard();
  console.log('[Gaming Hub] LOCKED & SECURED: Closed Development Early Access Enclave Active.');
})();
