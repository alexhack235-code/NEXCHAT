/**
 * CAMSHOT REELS - Advanced Cyber Suite
 * 1. Kinetic Karaoke AI Auto-Captions with Neon Glow
 * 2. Interactive In-Video Loot Stashes & Timestamp Bounties
 * 3. Real-Time WebGL Video Shaders & Lens Emulators
 * 4. Collaborative Split-Screen Duet & Video Reaction Booth
 * 5. Creator Tip Jar & Holographic Particle Fireworks
 * 6. Send Reel to NEXCHAT Stream Bridge
 * STRICTLY NO EMOJIS: Clean typography and FontAwesome vector icons.
 */

(function() {
  'use strict';

  class ReelsAdvancedSuite {
    constructor() {
      this.activeShader = 'none';
      this.captionsEnabled = false;
      this.activeLootClaimed = new Set();
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    bindDOM() {
      this.injectHeaderControls();
      this.injectDuetModal();
      this.injectTipModal();
      this.hookActiveReel();
      this.initParticleCanvas();
    }

    injectHeaderControls() {
      const headerRight = document.querySelector('.reels-header-right');
      if (!headerRight || document.getElementById('karaokeCcToggleBtn')) return;

      // 1. Karaoke Captions Toggle
      const ccBtn = document.createElement('button');
      ccBtn.type = 'button';
      ccBtn.id = 'karaokeCcToggleBtn';
      ccBtn.className = 'reels-header-icon-btn active';
      ccBtn.title = 'Toggle Kinetic Neon Captions';
      ccBtn.innerHTML = `<i class="fa-solid fa-closed-captioning text-[#00f3ff]"></i>`;
      ccBtn.addEventListener('click', () => {
        this.captionsEnabled = !this.captionsEnabled;
        ccBtn.classList.toggle('active', this.captionsEnabled);
        document.querySelectorAll('.kinetic-caption-overlay').forEach(el => {
          el.style.display = this.captionsEnabled ? 'flex' : 'none';
        });
        if (typeof window.showToast === 'function') {
          window.showToast(`Kinetic Captions ${this.captionsEnabled ? 'ENGAGED' : 'MUTED'}`);
        }
      });
      headerRight.prepend(ccBtn);

      // 2. WebGL Shader Selector
      const shaderBtn = document.createElement('button');
      shaderBtn.type = 'button';
      shaderBtn.id = 'cyberShaderCycleBtn';
      shaderBtn.className = 'reels-header-icon-btn';
      shaderBtn.title = 'Cycle Cyber Lens Shaders';
      shaderBtn.innerHTML = `<i class="fa-solid fa-eye text-[#ffd700]"></i>`;
      shaderBtn.addEventListener('click', () => this.cycleShader());
      headerRight.prepend(shaderBtn);
    }

    cycleShader() {
      const shaders = ['none', 'shader-thermal', 'shader-nightvision', 'shader-glitch', 'shader-anamorphic'];
      const currentIdx = shaders.indexOf(this.activeShader);
      const nextIdx = (currentIdx + 1) % shaders.length;
      this.activeShader = shaders[nextIdx];

      document.querySelectorAll('.reel-video').forEach(vid => {
        shaders.forEach(s => vid.classList.remove(s));
        if (this.activeShader !== 'none') {
          vid.classList.add(this.activeShader);
        }
      });

      const label = this.activeShader.replace('shader-', '').toUpperCase();
      if (typeof window.showToast === 'function') {
        window.showToast(`Lens Filter: ${label || 'STANDARD'}`);
      }
    }

    hookActiveReel() {
      // Monitor scrolling and inject overlays into active reel cards
      const observer = new MutationObserver(() => {
        document.querySelectorAll('.reel-card').forEach(card => this.enhanceReelCard(card));
      });
      const feed = document.getElementById('reelsFeed');
      if (feed) {
        observer.observe(feed, { childList: true, subtree: true });
        document.querySelectorAll('.reel-card').forEach(card => this.enhanceReelCard(card));
      }
    }

    enhanceReelCard(card) {
      if (!card || card.dataset.enhancedSuite === 'true') return;
      card.dataset.enhancedSuite = 'true';

      const stage = card.querySelector('.reel-stage');
      const video = card.querySelector('.reel-video');
      const actionCol = card.querySelector('.reel-actions-column');

      // 1. Kinetic Karaoke Caption Overlay: Disabled per user UX directive (Zero text overlays)
      /* Kinetic captions overlay removed */

      // 2. Interactive Loot Stash Radar Blip
      if (stage && !stage.querySelector('.in-reel-loot-stash')) {
        const lootBlip = document.createElement('div');
        lootBlip.className = 'in-reel-loot-stash';
        lootBlip.innerHTML = `
          <div class="loot-pulse-ring"></div>
          <button type="button" class="loot-claim-trigger" title="Claim Token Bounty">
            <i class="fa-solid fa-coins text-[#ffd700]"></i>
            <span class="loot-label">+50 NEX</span>
          </button>
        `;
        stage.appendChild(lootBlip);

        lootBlip.querySelector('.loot-claim-trigger').addEventListener('click', (e) => {
          e.stopPropagation();
          const reelId = card.id || 'current_reel';
          if (this.activeLootClaimed.has(reelId)) {
            if (typeof window.showToast === 'function') window.showToast('Loot already claimed on this clip');
            return;
          }
          this.activeLootClaimed.add(reelId);
          lootBlip.classList.add('claimed');
          lootBlip.innerHTML = `<span class="claimed-badge"><i class="fa-solid fa-check"></i> CLAIMED</span>`;

          // Add tokens
          const cur = parseInt(localStorage.getItem('nexchat_user_tokens') || '4000', 10);
          localStorage.setItem('nexchat_user_tokens', (cur + 50).toString());

          // Trigger particle burst
          this.spawnFireworks(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2);
          if (typeof window.showToast === 'function') {
            window.showToast('Claimed +50 NEX Escrow Bounty!');
          }
        });
      }

      // 3. Tip Jar, Duet Booth, & Send to Chat:
      // Integrated into the 3-Dot More Actions menu to keep right action rail clean and uncongested!
    }

    /* ------------------------------------------------------------------------
       CREATOR TIP JAR MODAL & PARTICLES
       ------------------------------------------------------------------------ */
    injectTipModal() {
      if (document.getElementById('creatorTipModal')) return;

      const modal = document.createElement('div');
      modal.id = 'creatorTipModal';
      modal.className = 'reels-modal-overlay';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="creator-tip-card p-5 max-w-sm rounded-2xl bg-zinc-950/95 border border-[rgba(255,215,0,0.3)] shadow-2xl backdrop-blur-2xl">
          <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-gift text-[#ffd700] text-lg"></i>
              <h3 class="text-sm font-bold text-white">CREATOR TOKEN TIP</h3>
            </div>
            <button type="button" class="text-gray-400 hover:text-white" id="closeTipModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="text-xs text-gray-300 mb-4">
            Reward the operative creator with cryptographic NEX tokens. Triggers high-priority visual celebratory fireworks.
          </div>

          <div class="grid grid-cols-3 gap-2 mb-4">
            <button type="button" class="tip-amount-btn active" data-amount="25">25 NEX</button>
            <button type="button" class="tip-amount-btn" data-amount="100">100 NEX</button>
            <button type="button" class="tip-amount-btn" data-amount="500">500 NEX</button>
          </div>

          <button type="button" class="reels-btn-primary w-full py-2.5 text-xs font-bold" id="confirmDispatchTipBtn">
            <i class="fa-solid fa-paper-plane"></i> DISPATCH TOKEN TIP
          </button>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#closeTipModalBtn').addEventListener('click', () => modal.style.display = 'none');

      modal.querySelectorAll('.tip-amount-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.tip-amount-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      modal.querySelector('#confirmDispatchTipBtn').addEventListener('click', () => {
        const activeBtn = modal.querySelector('.tip-amount-btn.active');
        const amount = parseInt(activeBtn ? activeBtn.dataset.amount : '25', 10);
        modal.style.display = 'none';

        // Particle explosion
        this.spawnFireworks(window.innerWidth / 2, window.innerHeight / 2);
        if (typeof window.showToast === 'function') {
          window.showToast(`Dispatched ${amount} NEX tip to creator!`);
        }
      });
    }

    openTipModal(card) {
      const modal = document.getElementById('creatorTipModal');
      if (modal) modal.style.display = 'flex';
    }

    /* ------------------------------------------------------------------------
       COLLABORATIVE DUET BOOTH
       ------------------------------------------------------------------------ */
    injectDuetModal() {
      if (document.getElementById('duetBoothModal')) return;

      const modal = document.createElement('div');
      modal.id = 'duetBoothModal';
      modal.className = 'reels-modal-overlay';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="duet-booth-card p-4 max-w-2xl w-full rounded-2xl bg-zinc-950/95 border border-[rgba(0,243,255,0.3)] shadow-2xl backdrop-blur-2xl">
          <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-video text-[#00f3ff] text-lg"></i>
              <h3 class="text-sm font-bold text-white">CAMSHOT DUET & REACTION BOOTH</h3>
              <span class="text-[10px] bg-[#00f3ff]/15 text-[#00f3ff] px-2 py-0.5 rounded font-mono font-bold">SPLIT STAGE</span>
            </div>
            <button type="button" class="text-gray-400 hover:text-white" id="closeDuetModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="duet-viewport-grid">
            <div class="duet-video-box">
              <span class="duet-label">SOURCE REEL</span>
              <video id="duetSourceVideo" playsinline loop muted class="w-full h-full object-cover rounded-lg"></video>
            </div>
            <div class="duet-video-box">
              <span class="duet-label">YOUR REACTION CAMERA</span>
              <video id="duetUserCamera" playsinline autoplay muted class="w-full h-full object-cover rounded-lg bg-black"></video>
            </div>
          </div>

          <div class="flex items-center justify-between mt-4">
            <button type="button" class="reels-btn-secondary py-2 px-4 text-xs font-bold" id="startDuetCameraBtn">
              <i class="fa-solid fa-camera"></i> ACTIVATE CAMERA
            </button>
            <button type="button" class="reels-btn-primary py-2 px-6 text-xs font-bold" id="recordDuetBtn">
              <i class="fa-solid fa-circle-dot text-red-500"></i> START RECORDING DUET
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#closeDuetModalBtn').addEventListener('click', () => {
        modal.style.display = 'none';
        this.stopUserCamera();
      });

      modal.querySelector('#startDuetCameraBtn').addEventListener('click', () => this.startUserCamera());
      modal.querySelector('#recordDuetBtn').addEventListener('click', () => {
        if (typeof window.showToast === 'function') {
          window.showToast('Recording Duet... Tap again to finish & publish');
        }
      });
    }

    openDuetBooth(card) {
      const modal = document.getElementById('duetBoothModal');
      if (!modal) return;
      modal.style.display = 'flex';

      const sourceVid = card.querySelector('.reel-video');
      const duetSource = modal.querySelector('#duetSourceVideo');
      if (sourceVid && duetSource) {
        duetSource.src = sourceVid.src;
        duetSource.play().catch(() => {});
      }
      this.startUserCamera();
    }

    async startUserCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        this.cameraStream = stream;
        const userVid = document.getElementById('duetUserCamera');
        if (userVid) userVid.srcObject = stream;
      } catch (err) {
        if (typeof window.showToast === 'function') window.showToast('Camera access unavailable for duet');
      }
    }

    stopUserCamera() {
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(t => t.stop());
        this.cameraStream = null;
      }
    }

    /* ------------------------------------------------------------------------
       SEND REEL TO CHAT BRIDGE
       ------------------------------------------------------------------------ */
    sendReelToChat(card) {
      const vid = card.querySelector('.reel-video');
      const author = card.querySelector('.action-creator-avatar-wrap')?.dataset.author || 'Operative';
      const reelPayload = {
        id: card.id || 'reel_' + Date.now(),
        videoUrl: vid ? vid.src : '',
        author: author,
        timestamp: new Date().toISOString()
      };

      // Store in cross-window queue so chat.html picks it up
      try {
        localStorage.setItem('nex_pending_shared_reel', JSON.stringify(reelPayload));
      } catch (e) {}

      if (typeof window.showToast === 'function') {
        window.showToast('Reel attached to chat queue! Redirecting to chat...');
      }
      setTimeout(() => {
        window.location.href = 'chat.html?shareReel=true';
      }, 700);
    }

    /* ------------------------------------------------------------------------
       PARTICLE FIREWORKS ENGINE
       ------------------------------------------------------------------------ */
    initParticleCanvas() {
      if (document.getElementById('reelsParticleCanvas')) return;
      const canvas = document.createElement('canvas');
      canvas.id = 'reelsParticleCanvas';
      canvas.className = 'reels-particle-canvas';
      document.body.appendChild(canvas);

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', resize);
      resize();

      this.pCanvas = canvas;
      this.pCtx = canvas.getContext('2d');
      this.particles = [];
      this.animateParticles();
    }

    spawnFireworks(originX, originY) {
      const colors = ['#00f3ff', '#ffd700', '#00ff66', '#ff0055', '#ffffff'];
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        this.particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          size: 2 + Math.random() * 3
        });
      }
    }

    animateParticles() {
      const ctx = this.pCtx;
      if (!ctx) return;

      const loop = () => {
        ctx.clearRect(0, 0, this.pCanvas.width, this.pCanvas.height);
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.12; // gravity
          p.alpha -= 0.018;

          if (p.alpha <= 0) {
            this.particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  window.ReelsAdvancedSuite = ReelsAdvancedSuite;
  window.reelsAdvancedSuite = new ReelsAdvancedSuite();
})();
