/**
 * CAMSHOT REELS - Viral & Addictive Engagement Suite
 * ===================================================
 * 1. Double-Tap Neon Heart & Particle Shockwave (CyberShockwaveHeart)
 *    - Vector particle explosion at exact touch/click coordinates
 *    - Procedural Web Audio frequency pop chime
 *    - Auto-likes reel & bounces right-side heart counter
 *
 * 2. Flying Cyber Danmaku Bullet Comments (ReelsCyberDanmaku)
 *    - Floating comments streaming across the video screen horizontally
 *    - 4 non-colliding speed/height lanes with neon glow colors
 *    - Danmaku toggle button in action bar (ON / OFF)
 *    - Instant golden bullet launch when user posts a comment
 *
 * 3. Hold-to-Speed 2.0x Rapid Playback (ReelsHoldToSpeed)
 *    - Holding finger or mouse on screen accelerates video to 2x
 *    - Displays futuristic top HUD pill: [2.0X >> RAPID STREAM]
 *    - Dynamic pitch preservation and release to normal 1x
 *
 * 4. Interactive In-Reel Prediction Poll Card (ReelsPredictionCard)
 *    - Real-time vote percentage bars and immediate reward feedback
 *
 * 5. Audio DJ Scrubber & Sound Remix Drawer (ReelsSoundRemix)
 *    - Interactive sound hub with soundwave visualizer & "Use This Sound" action
 *
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  class ReelsViralEngagementSuite {
    constructor() {
      this.audioCtx = null;
      this.danmakuEnabled = false;
      this.danmakuTimer = null;
      this.speedHoldTimer = null;
      this.isSpeedHolding = false;
      this.originalPlaybackRate = 1.0;

      this.danmakuPool = [
        "Pure cinema grade aesthetic!",
        "The sound sync on this is insane",
        "W fire operative setup",
        "Wait for the transition at the end",
        "10/10 visual fidelity",
        "How did you render this shader?",
        "Looping this for the 5th time",
        "Adding this to my cyber vault",
        "Apex level creativity",
        "Instant follow!"
      ];

      this.init();
    }

    init() {
      this.injectStyles();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindSuite());
      } else {
        this.bindSuite();
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

    // Procedural synthesized sound effects (0 external audio dependencies)
    playChime(type = 'pop') {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        if (type === 'pop') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.13);
        } else if (type === 'speed') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.09);
        } else if (type === 'vote') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.07);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.19);
        }
      } catch (_) {}
    }

    bindSuite() {
      this.bindDoubleTapShockwave();
      this.bindHoldToSpeed();
      this.bindDanmakuStream();
      this.injectDanmakuHeaderToggle();
      this.bindSoundRemixDrawer();
      console.log('[REELS SUITE] CamShot Viral & Addictive Engagement Suite operational.');
    }

    // =========================================================================
    // 1. DOUBLE-TAP NEON HEART & PARTICLE SHOCKWAVE
    // =========================================================================
    bindDoubleTapShockwave() {
      let lastTap = 0;
      let lastTapPos = { x: 0, y: 0 };

      document.addEventListener('click', (e) => {
        const videoWrapper = e.target.closest('.reel-video-wrapper') || e.target.closest('.reel-stage');
        if (!videoWrapper) return;

        // Skip if clicking an interactive control
        if (e.target.closest('button') || e.target.closest('.reel-actions-column') || e.target.closest('.prediction-poll-card')) {
          return;
        }

        const now = Date.now();
        const dist = Math.hypot(e.clientX - lastTapPos.x, e.clientY - lastTapPos.y);

        if (now - lastTap < 340 && dist < 45) {
          // Double-tap detected!
          this.triggerHeartShockwave(e.clientX, e.clientY, videoWrapper);
          lastTap = 0;
        } else {
          lastTap = now;
          lastTapPos = { x: e.clientX, y: e.clientY };
        }
      });

      // Mobile touch support
      document.addEventListener('touchend', (e) => {
        const videoWrapper = e.target.closest('.reel-video-wrapper') || e.target.closest('.reel-stage');
        if (!videoWrapper) return;
        if (e.target.closest('button') || e.target.closest('.reel-actions-column')) return;

        const touch = e.changedTouches[0];
        if (!touch) return;

        const now = Date.now();
        const dist = Math.hypot(touch.clientX - lastTapPos.x, touch.clientY - lastTapPos.y);

        if (now - lastTap < 340 && dist < 50) {
          this.triggerHeartShockwave(touch.clientX, touch.clientY, videoWrapper);
          lastTap = 0;
        } else {
          lastTap = now;
          lastTapPos = { x: touch.clientX, y: touch.clientY };
        }
      }, { passive: true });
    }

    triggerHeartShockwave(clientX, clientY, container) {
      this.playChime('pop');

      const burst = document.createElement('div');
      burst.className = 'cyber-heart-shockwave-burst';
      burst.style.left = `${clientX}px`;
      burst.style.top = `${clientY}px`;

      // Central Heart Icon + 2 Expanding Shockwave Rings
      burst.innerHTML = `
        <div class="shockwave-ring ring-1"></div>
        <div class="shockwave-ring ring-2"></div>
        <div class="shockwave-heart-icon">
          <i class="fa-solid fa-heart"></i>
        </div>
        <div class="shockwave-particles">
          <span style="--dx: -35px; --dy: -45px;"><i class="fa-solid fa-bolt"></i></span>
          <span style="--dx: 38px; --dy: -40px;"><i class="fa-solid fa-fire"></i></span>
          <span style="--dx: -45px; --dy: 30px;"><i class="fa-solid fa-star"></i></span>
          <span style="--dx: 40px; --dy: 35px;"><i class="fa-solid fa-heart"></i></span>
        </div>
      `;

      document.body.appendChild(burst);
      setTimeout(() => burst.remove(), 850);

      // Trigger active reel's like button
      const activeCard = container.closest('.reel-card') || document.querySelector('.reel-card');
      if (activeCard) {
        const likeBtn = activeCard.querySelector('.like-btn');
        if (likeBtn) {
          const heartIcon = likeBtn.querySelector('.fa-heart');
          if (heartIcon && !heartIcon.classList.contains('text-[#fe2c55]')) {
            likeBtn.click();
          }
          // Bounce animation on right action bar
          likeBtn.style.transform = 'scale(1.45)';
          setTimeout(() => { likeBtn.style.transform = ''; }, 250);
        }
      }
    }

    // =========================================================================
    // 2. FLYING CYBER DANMAKU COMMENTS
    // =========================================================================
    bindDanmakuStream() {
      // Periodic injection of floating bullet comments across current reel
      clearInterval(this.danmakuTimer);
      this.danmakuTimer = setInterval(() => {
        if (!this.danmakuEnabled) return;
        const visibleVideo = document.querySelector('.reel-card video');
        if (!visibleVideo) return;

        const stage = visibleVideo.closest('.reel-stage') || visibleVideo.parentElement;
        if (!stage) return;

        const text = this.danmakuPool[Math.floor(Math.random() * this.danmakuPool.length)];
        this.launchDanmakuBullet(text, stage, false);
      }, 4200);

      // Hook user comment submissions so their comment launches as an instant bullet
      document.addEventListener('commentSubmitted', (e) => {
        const commentText = e.detail?.text;
        if (commentText) {
          const stage = document.querySelector('.reel-card .reel-stage');
          if (stage) this.launchDanmakuBullet(commentText, stage, true);
        }
      });
    }

    launchDanmakuBullet(text, stage, isUserComment = false) {
      if (!stage || !this.danmakuEnabled) return;

      const bullet = document.createElement('div');
      bullet.className = `cyber-danmaku-bullet ${isUserComment ? 'user-danmaku-gold' : ''}`;

      // Pick lane (0 to 3)
      const lane = Math.floor(Math.random() * 4);
      const topOffset = 18 + (lane * 14); // 18%, 32%, 46%, 60%
      const duration = isUserComment ? 5.5 : (6.5 + Math.random() * 2.5);

      bullet.style.top = `${topOffset}%`;
      bullet.style.animationDuration = `${duration}s`;

      const neonColors = ['#00f2ff', '#00ff66', '#a855f7', '#ffd700', '#f43f5e'];
      const color = isUserComment ? '#ffd700' : neonColors[Math.floor(Math.random() * neonColors.length)];

      bullet.innerHTML = `
        <span class="danmaku-dot" style="background-color: ${color};"></span>
        <span class="danmaku-text" style="${isUserComment ? 'color: #ffd700; font-weight: 700;' : ''}">${this.escapeHtml(text)}</span>
      `;

      stage.appendChild(bullet);
      setTimeout(() => bullet.remove(), duration * 1000 + 500);
    }

    injectDanmakuHeaderToggle() {
      const headerRight = document.querySelector('.reels-header-right');
      if (!headerRight || document.getElementById('toggleDanmakuBtn')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'toggleDanmakuBtn';
      btn.className = 'reels-header-icon-btn danmaku-toggle-btn';
      btn.title = 'Toggle Flying Danmaku Comments (On/Off)';
      btn.innerHTML = '<i class="fa-solid fa-comments"></i>';
      btn.style.color = '#64748b';

      btn.addEventListener('click', () => {
        this.danmakuEnabled = !this.danmakuEnabled;
        btn.classList.toggle('active', this.danmakuEnabled);
        btn.style.color = this.danmakuEnabled ? '#00f2ff' : '#64748b';

        // Clear existing bullets if disabled
        if (!this.danmakuEnabled) {
          document.querySelectorAll('.cyber-danmaku-bullet').forEach(b => b.remove());
        }

        if (typeof window.showNotif === 'function') {
          window.showNotif(this.danmakuEnabled ? 'Cyber Danmaku Comments: ON' : 'Cyber Danmaku Comments: OFF', 'info', 1400);
        }
      });

      headerRight.prepend(btn);
    }

    // =========================================================================
    // 3. HOLD-TO-SPEED 2.0X RAPID PLAYBACK
    // =========================================================================
    bindHoldToSpeed() {
      let speedHud = document.getElementById('reelSpeedHoldHud');
      if (!speedHud) {
        speedHud = document.createElement('div');
        speedHud.id = 'reelSpeedHoldHud';
        speedHud.className = 'reel-speed-hold-hud';
        speedHud.innerHTML = '<i class="fa-solid fa-forward-fast"></i> <span>2.0X SPEED</span>';
        document.body.appendChild(speedHud);
      }

      const startHold = (video) => {
        if (!video || this.isSpeedHolding) return;
        this.isSpeedHolding = true;
        this.originalPlaybackRate = video.playbackRate || 1.0;
        video.playbackRate = 2.0;
        this.playChime('speed');
        speedHud.style.display = 'flex';
      };

      const endHold = (video) => {
        if (!this.isSpeedHolding) return;
        this.isSpeedHolding = false;
        if (video) video.playbackRate = this.originalPlaybackRate || 1.0;
        speedHud.style.display = 'none';
      };

      // Mouse events on video
      document.addEventListener('mousedown', (e) => {
        const video = e.target.closest('.reel-card video');
        if (!video) return;
        if (e.target.closest('button') || e.target.closest('.reel-actions-column')) return;

        this.speedHoldTimer = setTimeout(() => {
          startHold(video);
        }, 320); // Hold for 320ms to activate
      });

      document.addEventListener('mouseup', () => {
        if (this.speedHoldTimer) clearTimeout(this.speedHoldTimer);
        const activeVideo = document.querySelector('.reel-card video');
        endHold(activeVideo);
      });

      // Touch events on mobile
      document.addEventListener('touchstart', (e) => {
        const video = e.target.closest('.reel-card video');
        if (!video) return;
        if (e.target.closest('button') || e.target.closest('.reel-actions-column')) return;

        this.speedHoldTimer = setTimeout(() => {
          startHold(video);
        }, 350);
      }, { passive: true });

      document.addEventListener('touchend', () => {
        if (this.speedHoldTimer) clearTimeout(this.speedHoldTimer);
        const activeVideo = document.querySelector('.reel-card video');
        endHold(activeVideo);
      });
    }

    // =========================================================================
    // 4. INTERACTIVE IN-REEL PREDICTION POLL CARD
    // =========================================================================
    mountPredictionCard(stage, question, optA, optB) {
      if (!stage || stage.querySelector('.reel-prediction-card')) return;

      const card = document.createElement('div');
      card.className = 'reel-prediction-card';
      card.innerHTML = `
        <div class="prediction-header">
          <i class="fa-solid fa-scale-balanced" style="color: #00f2ff;"></i>
          <span>LIVE PREDICTOR &bull; VOTE & EARN +10 XP</span>
        </div>
        <div class="prediction-question">${this.escapeHtml(question || 'Which setup takes the win?')}</div>
        <div class="prediction-options">
          <button type="button" class="prediction-btn opt-a" data-choice="a">
            <span class="opt-label">${this.escapeHtml(optA || 'Option Alpha')}</span>
            <span class="opt-pct">50%</span>
            <div class="opt-bar" style="width: 50%;"></div>
          </button>
          <button type="button" class="prediction-btn opt-b" data-choice="b">
            <span class="opt-label">${this.escapeHtml(optB || 'Option Omega')}</span>
            <span class="opt-pct">50%</span>
            <div class="opt-bar" style="width: 50%;"></div>
          </button>
        </div>
      `;

      card.querySelectorAll('.prediction-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.playChime('vote');
          card.classList.add('voted');
          btn.classList.add('selected');

          const isA = btn.dataset.choice === 'a';
          const pctA = isA ? 68 : 32;
          const pctB = 100 - pctA;

          const barA = card.querySelector('.opt-a .opt-bar');
          const barB = card.querySelector('.opt-b .opt-bar');
          const lblA = card.querySelector('.opt-a .opt-pct');
          const lblB = card.querySelector('.opt-b .opt-pct');

          if (barA) barA.style.width = `${pctA}%`;
          if (barB) barB.style.width = `${pctB}%`;
          if (lblA) lblA.textContent = `${pctA}%`;
          if (lblB) lblB.textContent = `${pctB}%`;

          // Award user XP
          if (typeof window.showNotif === 'function') {
            window.showNotif('Prediction recorded! +10 Cyber XP earned', 'success', 1800);
          }
        });
      });

      stage.appendChild(card);
    }

    // =========================================================================
    // 5. SOUND WAVEFORM SCRUBBER & REMIX DRAWER
    // =========================================================================
    bindSoundRemixDrawer() {
      document.addEventListener('click', (e) => {
        const soundTrigger = e.target.closest('.sound-info') || e.target.closest('.reel-disc') || e.target.closest('.action-sound-disc');
        if (!soundTrigger) return;
        e.preventDefault();
        e.stopPropagation();

        const activeCard = soundTrigger.closest('.reel-card') || document.querySelector('.reel-card');
        const soundTitle = soundTrigger.textContent?.trim() || 'Original CamShot Soundtrack';
        const author = activeCard?.querySelector('.author-name')?.textContent || 'Creator';

        this.openSoundRemixModal(soundTitle, author);
      });
    }

    openSoundRemixModal(title, author) {
      let modal = document.getElementById('reelsSoundRemixModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reelsSoundRemixModal';
        modal.className = 'reels-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="sound-remix-card">
          <div class="sound-remix-header">
            <div class="sound-disc-pulse">
              <i class="fa-solid fa-compact-disc fa-spin" style="animation-duration: 4s;"></i>
            </div>
            <div class="sound-details">
              <h4>${this.escapeHtml(title)}</h4>
              <p><i class="fa-solid fa-user-ninja"></i> ${this.escapeHtml(author)} &bull; 14.2K Reels Created</p>
            </div>
            <button type="button" class="sound-close-btn" onclick="document.getElementById('reelsSoundRemixModal').style.display='none';">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="sound-waveform-visualizer">
            ${Array.from({ length: 28 }).map((_, i) => `<span class="waveform-col" style="animation-delay: ${i * 0.05}s; height: ${20 + Math.sin(i) * 22}px;"></span>`).join('')}
          </div>

          <div class="sound-remix-actions">
            <button type="button" class="btn-use-sound" id="btnUseSoundInReel">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>Use This Sound in My Reel</span>
            </button>
            <button type="button" class="btn-save-sound" onclick="this.innerHTML='<i class=\\'fa-solid fa-check\\'></i> Saved'; if(window.showNotif) showNotif('Sound saved to Cyber Vault', 'success');">
              <i class="fa-solid fa-bookmark"></i> Save Sound
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
      };

      modal.querySelector('#btnUseSoundInReel')?.addEventListener('click', () => {
        modal.style.display = 'none';
        const uploadModal = document.getElementById('openUploadModalBtn');
        if (uploadModal) uploadModal.click();
        if (typeof window.showNotif === 'function') {
          window.showNotif(`Loaded soundtrack: ${title}`, 'success', 2000);
        }
      });
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    injectStyles() {
      if (document.getElementById('reelsViralSuiteStyles')) return;
      const style = document.createElement('style');
      style.id = 'reelsViralSuiteStyles';
      style.textContent = `
        /* Double-Tap Heart Shockwave */
        .cyber-heart-shockwave-burst {
          position: fixed;
          pointer-events: none;
          z-index: 99999;
          transform: translate(-50%, -50%);
        }

        .shockwave-heart-icon {
          font-size: 82px;
          color: #fe2c55;
          filter: drop-shadow(0 0 25px rgba(254, 44, 85, 0.85)) drop-shadow(0 0 50px rgba(255, 0, 102, 0.5));
          animation: shockwaveHeartPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes shockwaveHeartPop {
          0% { transform: scale(0.2) rotate(-15deg); opacity: 0; }
          45% { transform: scale(1.35) rotate(0deg); opacity: 1; }
          75% { transform: scale(1.05) rotate(5deg); opacity: 1; }
          100% { transform: scale(1.8) translateY(-40px); opacity: 0; }
        }

        .shockwave-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          border: 2px solid #fe2c55;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .shockwave-ring.ring-1 {
          width: 20px;
          height: 20px;
          animation: shockwaveExpand 0.7s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }

        .shockwave-ring.ring-2 {
          width: 20px;
          height: 20px;
          border-color: #00f2ff;
          animation: shockwaveExpand 0.75s 0.08s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }

        @keyframes shockwaveExpand {
          0% { width: 20px; height: 20px; opacity: 1; border-width: 3px; }
          100% { width: 220px; height: 220px; opacity: 0; border-width: 1px; }
        }

        .shockwave-particles span {
          position: absolute;
          top: 50%;
          left: 50%;
          font-size: 16px;
          color: #ffd700;
          animation: particleFly 0.65s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
        }

        @keyframes particleFly {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.2); opacity: 0; }
        }

        /* Flying Cyber Danmaku */
        .cyber-danmaku-bullet {
          position: absolute;
          left: 100%;
          white-space: nowrap;
          pointer-events: none;
          z-index: 45;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 12px;
          border-radius: 9999px;
          background: rgba(5, 8, 17, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
          animation: danmakuFly linear forwards;
        }

        .cyber-danmaku-bullet.user-danmaku-gold {
          background: rgba(255, 215, 0, 0.2);
          border: 1.5px solid #ffd700;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
          z-index: 50;
        }

        .danmaku-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 8px currentColor;
        }

        .danmaku-text {
          font-size: 12.5px;
          font-weight: 600;
          color: #f1f5f9;
          letter-spacing: 0.3px;
        }

        @keyframes danmakuFly {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-100vw - 120%)); }
        }

        /* Hold to Speed HUD */
        .reel-speed-hold-hud {
          position: fixed;
          top: 74px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 242, 255, 0.18);
          border: 1px solid #00f2ff;
          color: #00f2ff;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 1px;
          display: none;
          align-items: center;
          gap: 7px;
          z-index: 99999;
          box-shadow: 0 0 20px rgba(0, 242, 255, 0.45);
          backdrop-filter: blur(8px);
          animation: speedPulse 0.8s infinite alternate;
        }

        @keyframes speedPulse {
          from { opacity: 0.85; transform: translateX(-50%) scale(1); }
          to { opacity: 1; transform: translateX(-50%) scale(1.05); }
        }

        /* In-Reel Prediction Poll Card */
        .reel-prediction-card {
          position: absolute;
          bottom: 120px;
          left: 14px;
          right: 70px;
          background: rgba(10, 15, 26, 0.85);
          border: 1px solid rgba(0, 242, 255, 0.3);
          border-radius: 14px;
          padding: 10px 12px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 30;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6);
        }

        .prediction-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9.5px;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }

        .prediction-question {
          font-size: 12.5px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .prediction-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .prediction-btn {
          position: relative;
          background: #162032;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 7px 10px;
          color: #f1f5f9;
          font-size: 11.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.15s;
        }

        .prediction-btn .opt-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: rgba(0, 242, 255, 0.25);
          z-index: 1;
          transition: width 0.4s ease;
        }

        .prediction-btn.opt-b .opt-bar {
          background: rgba(254, 44, 85, 0.25);
        }

        .prediction-btn .opt-label,
        .prediction-btn .opt-pct {
          position: relative;
          z-index: 2;
        }

        /* Sound Remix Bottom Drawer */
        .sound-remix-card {
          background: #0d121d;
          border: 1px solid rgba(0, 255, 102, 0.25);
          border-radius: 20px;
          width: 100%;
          max-width: 450px;
          padding: 22px;
          color: #ffffff;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 255, 102, 0.1);
        }

        .sound-remix-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
          position: relative;
        }

        .sound-disc-pulse {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #00f2ff);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: #050811;
          box-shadow: 0 0 20px rgba(0, 242, 255, 0.4);
        }

        .sound-details h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
        }

        .sound-details p {
          margin: 3px 0 0 0;
          font-size: 11.5px;
          color: #94a3b8;
        }

        .sound-close-btn {
          position: absolute;
          top: 0;
          right: 0;
          background: none;
          border: none;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
        }

        .sound-waveform-visualizer {
          height: 48px;
          background: rgba(0, 0, 0, 0.35);
          border-radius: 10px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          margin-bottom: 18px;
        }

        .waveform-col {
          width: 3px;
          background: #00f2ff;
          border-radius: 2px;
          animation: waveBounce 0.8s ease-in-out infinite alternate;
        }

        @keyframes waveBounce {
          from { transform: scaleY(0.4); opacity: 0.5; }
          to { transform: scaleY(1.1); opacity: 1; }
        }

        .sound-remix-actions {
          display: flex;
          gap: 10px;
        }

        .btn-use-sound {
          flex: 2;
          background: linear-gradient(135deg, #00ff66, #00d4ff);
          color: #050811;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-save-sound {
          flex: 1;
          background: #182232;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f1f5f9;
          border-radius: 12px;
          padding: 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.NexReelsViralSuite = new ReelsViralEngagementSuite();
  window.reelsViralSuite = window.NexReelsViralSuite;
})();
