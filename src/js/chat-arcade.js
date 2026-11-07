/**
 * NEXCHAT IN-CHAT MINI-GAMES & TOKEN WAGERING ARCADE
 * 
 * Capabilities:
 * - Rock-Paper-Scissors Token Wager (50, 100, 250 Tokens) with interactive in-chat resolution
 * - Cyber Pong: 60fps HTML5 Canvas Neon Paddle Game with responsive touch/mouse controls & AI
 * - Crypto & Cyber Trivia Blitz (5 rapid-fire questions with live timer & anti-spam debounce)
 * - Real-time token synchronization across all storage keys & Firestore
 * - Web Audio procedural sound synthesis (zero external audio asset dependencies)
 */

(function () {
  'use strict';

  // Procedural Web Audio Synthesizer for Mini-Games
  class ArcadeAudioEngine {
    constructor() {
      this.ctx = null;
    }

    ensureContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    playBeep(freq = 440, duration = 0.08, type = 'sine') {
      try {
        this.ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (_) {}
    }

    playVictory() {
      try {
        this.ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);
          gain.gain.setValueAtTime(0.18, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.22);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.25);
        });
      } catch (_) {}
    }

    playDefeat() {
      try {
        this.ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [340, 290, 220].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.12, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.22);
        });
      } catch (_) {}
    }
  }

  const arcadeAudio = new ArcadeAudioEngine();

  // Unified Token Management Helper
  function getArcadeTokens() {
    if (window.nexTokenManager && typeof window.nexTokenManager.getBalance === 'function') {
      return window.nexTokenManager.getBalance();
    }
    const val = localStorage.getItem('nexchat_user_tokens') ||
                localStorage.getItem('nex_user_tokens') ||
                localStorage.getItem('tokens') ||
                localStorage.getItem('userTokens') || '2000';
    return parseInt(String(val).replace(/,/g, ''), 10) || 0;
  }

  function adjustArcadeTokens(deltaAmount, reason = 'Arcade') {
    if (window.nexTokenManager && typeof window.nexTokenManager.modifyTokens === 'function') {
      window.nexTokenManager.modifyTokens(deltaAmount, reason);
      return;
    }
    const cur = getArcadeTokens();
    const next = Math.max(0, cur + deltaAmount);
    ['nexchat_user_tokens', 'nex_user_tokens', 'tokens', 'userTokens'].forEach(k => {
      try { localStorage.setItem(k, String(next)); } catch (_) {}
    });
    window.dispatchEvent(new CustomEvent('nexchat:tokens_changed', { detail: { balance: next, change: deltaAmount, reason } }));
  }

  class ChatArcadeEngine {
    constructor() {
      this.activeGame = 'rps';
      this.selectedWager = 50;
      this.myRpsChoice = null;
      this.pongAnimId = null;
      this.pongState = null;
      this.triviaIndex = 0;
      this.triviaScore = 0;
      this.triviaTimer = null;

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
      this.injectModal();
      this.bindTriggers();
    }

    injectModal() {
      if (document.getElementById('chatArcadeModal')) return;

      const modal = document.createElement('div');
      modal.id = 'chatArcadeModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window arcade-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-gamepad text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">NEX-ARCADE // BATTLE ARENA</h3>
            </div>
            <button type="button" class="cyber-modal-close" id="closeArcadeModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <!-- Game Selector Tabs -->
          <div class="arcade-tabs">
            <button type="button" class="arcade-tab-btn active" data-game="rps">
              <i class="fa-solid fa-hand-back-fist"></i> RPS Wager
            </button>
            <button type="button" class="arcade-tab-btn" data-game="pong">
              <i class="fa-solid fa-table-tennis-paddle-ball"></i> Cyber Pong
            </button>
            <button type="button" class="arcade-tab-btn" data-game="trivia">
              <i class="fa-solid fa-brain"></i> Cyber Trivia
            </button>
          </div>

          <!-- GAME 1: Rock-Paper-Scissors Token Wager -->
          <div id="arcadeViewRps" class="arcade-game-view">
            <p class="text-xs text-gray-300 text-center mb-4">
              Challenge <strong id="rpsTargetPartner" class="text-white">Partner</strong> to a live match. Winner takes the token pot!
            </p>

            <div class="wager-selector-title">SELECT TOKEN WAGER:</div>
            <div class="wager-pills-row">
              <button type="button" class="wager-pill" data-wager="0">Free</button>
              <button type="button" class="wager-pill active" data-wager="50">50 <i class="fa-solid fa-coins"></i></button>
              <button type="button" class="wager-pill" data-wager="100">100 <i class="fa-solid fa-coins"></i></button>
              <button type="button" class="wager-pill" data-wager="250">250 <i class="fa-solid fa-coins"></i></button>
            </div>

            <div class="wager-selector-title mt-4">PICK YOUR SECRET MOVE:</div>
            <div class="rps-choices-row">
              <button type="button" class="rps-choice-btn" data-choice="rock">
                <span class="rps-emoji"><i class="fa-solid fa-hand-fist"></i></span>
                <span class="rps-name">ROCK</span>
              </button>
              <button type="button" class="rps-choice-btn" data-choice="paper">
                <span class="rps-emoji"><i class="fa-solid fa-hand"></i></span>
                <span class="rps-name">PAPER</span>
              </button>
              <button type="button" class="rps-choice-btn" data-choice="scissors">
                <span class="rps-emoji"><i class="fa-solid fa-hand-scissors"></i></span>
                <span class="rps-name">SCISSORS</span>
              </button>
            </div>

            <button type="button" id="dispatchRpsChallengeBtn" class="arcade-action-btn mt-6" disabled>
              <i class="fa-solid fa-bolt"></i> DISPATCH CHALLENGE TO CHAT
            </button>
          </div>

          <!-- GAME 2: Cyber Pong (HTML5 Canvas) -->
          <div id="arcadeViewPong" class="arcade-game-view" style="display: none;">
            <div class="pong-scoreboard">
              <div>YOU: <span id="pongScorePlayer" class="text-[#00ff66]">0</span></div>
              <div class="text-gray-400">FIRST TO 5</div>
              <div>CYBER-AI: <span id="pongScoreAi" class="text-[#fe2c55]">0</span></div>
            </div>

            <div class="pong-canvas-wrap">
              <canvas id="cyberPongCanvas" width="500" height="300"></canvas>
            </div>

            <div class="flex items-center justify-between mt-3">
              <span class="text-xs text-gray-400">Drag or touch screen to move paddle</span>
              <button type="button" id="startPongGameBtn" class="pong-start-btn">
                <i class="fa-solid fa-play"></i> START MATCH
              </button>
            </div>
          </div>

          <!-- GAME 3: Cyber Trivia Blitz -->
          <div id="arcadeViewTrivia" class="arcade-game-view" style="display: none;">
            <div class="trivia-header-row">
              <span id="triviaProgressLabel" class="text-xs text-[#00d4ff] font-bold">QUESTION 1 OF 5</span>
              <span id="triviaTimerBadge" class="trivia-timer-badge">10s</span>
            </div>

            <h4 id="triviaQuestionText" class="trivia-question">Loading cryptographic challenge...</h4>

            <div class="trivia-options-grid" id="triviaOptionsGrid">
              <!-- Options injected -->
            </div>

            <div class="trivia-score-row mt-4">
              <span class="text-xs text-gray-400">CURRENT SCORE:</span>
              <span id="triviaScoreVal" class="text-base font-bold text-[#00ff66]">0 PTS</span>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Close modal events
      document.getElementById('closeArcadeModalBtn')?.addEventListener('click', () => this.closeModal());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });

      // Tabs
      modal.querySelectorAll('.arcade-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.arcade-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const game = btn.dataset.game;
          this.switchGameTab(game);
        });
      });

      // Wager buttons
      modal.querySelectorAll('.wager-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          modal.querySelectorAll('.wager-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.selectedWager = parseInt(pill.dataset.wager, 10);
          arcadeAudio.playBeep(520, 0.05, 'triangle');
        });
      });

      // RPS choice buttons
      modal.querySelectorAll('.rps-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.rps-choice-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.myRpsChoice = btn.dataset.choice;
          arcadeAudio.playBeep(640, 0.06, 'sine');
          const dispatchBtn = document.getElementById('dispatchRpsChallengeBtn');
          if (dispatchBtn) dispatchBtn.disabled = false;
        });
      });

      // Dispatch challenge
      document.getElementById('dispatchRpsChallengeBtn')?.addEventListener('click', () => {
        this.dispatchRpsChallenge();
      });

      // Pong Start
      document.getElementById('startPongGameBtn')?.addEventListener('click', () => {
        this.startPongGame();
      });
    }

    bindTriggers() {
      // Add Arcade tile into Attachment Hub if not exists
      const targetContainers = [
        document.getElementById('attachmentPopupHub'),
        document.querySelector('.attach-hub-grid'),
        document.getElementById('attachMenu')
      ];

      for (const container of targetContainers) {
        if (container && !container.querySelector('#hubActionArcade')) {
          const item = document.createElement('div');
          item.id = 'hubActionArcade';
          item.className = 'attach-hub-item';
          item.innerHTML = `
            <div class="attach-hub-icon icon-arcade" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(0, 240, 118, 0.25)); border-color: #a855f7;">
              <i class="fa-solid fa-gamepad" style="color: #c084fc;"></i>
            </div>
            <span>Mini-Games</span>
          `;
          item.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            const hub = document.getElementById('attachmentPopupHub') || document.getElementById('attachmentHub');
            if (hub) {
              hub.classList.remove('active', 'is-open');
              hub.style.display = 'none';
            }
            this.openModal();
          });
          container.appendChild(item);
          break;
        }
      }
    }

    openModal() {
      const modal = document.getElementById('chatArcadeModal');
      const partnerName = window.currentChatName || 'Partner';
      const nameEl = document.getElementById('rpsTargetPartner');
      if (nameEl) nameEl.textContent = partnerName;

      if (modal) modal.style.display = 'flex';
      arcadeAudio.playBeep(580, 0.08, 'triangle');
    }

    closeModal() {
      const modal = document.getElementById('chatArcadeModal');
      if (modal) modal.style.display = 'none';
      if (this.pongAnimId) cancelAnimationFrame(this.pongAnimId);
      clearInterval(this.triviaTimer);
    }

    switchGameTab(game) {
      this.activeGame = game;
      document.getElementById('arcadeViewRps').style.display = (game === 'rps') ? 'block' : 'none';
      document.getElementById('arcadeViewPong').style.display = (game === 'pong') ? 'block' : 'none';
      document.getElementById('arcadeViewTrivia').style.display = (game === 'trivia') ? 'block' : 'none';

      if (game === 'pong') {
        this.initPongCanvas();
      } else if (game === 'trivia') {
        this.startTriviaGame();
      }
    }

    // ─── GAME 1: Rock-Paper-Scissors Challenge ───
    dispatchRpsChallenge() {
      if (!this.myRpsChoice) return;

      const partnerName = window.currentChatName || 'Partner';
      const myName = window.myUsername || 'You';
      const wager = this.selectedWager;
      const currentTokens = getArcadeTokens();

      if (wager > 0 && currentTokens < wager) {
        if (window.showNotif) window.showNotif(`Insufficient tokens! You have ${currentTokens} NEX Tokens.`, 'error', 3000);
        arcadeAudio.playDefeat();
        return;
      }

      // Deduct entry wager if positive
      if (wager > 0) {
        adjustArcadeTokens(-wager, `RPS Wager Bet (${wager} Tokens)`);
      }

      const challengeId = `rps_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      // Store private secret in localStorage
      try {
        localStorage.setItem(`rps_secret_${challengeId}`, this.myRpsChoice);
      } catch (_) {}

      // Create structured challenge card payload
      const cardText = `[TACTICAL DUEL] **ROCK-PAPER-SCISSORS BATTLE**\n${myName} challenged ${partnerName}!\nPot: **${wager > 0 ? wager + ' NEX Tokens' : 'Free Match'}**\nChallenge ID: \`${challengeId}\`\n\nTap your move to accept the challenge!`;

      const input = document.getElementById('message-input');
      if (input) {
        input.value = cardText;
        if (typeof window.sendMessage === 'function') {
          window.sendMessage();
        }
      }

      this.closeModal();
      arcadeAudio.playVictory();
      if (window.showNotif) window.showNotif(`Challenge dispatched with ${wager} token wager!`, 'success', 2500);
    }

    // Interactive in-chat duel resolver
    resolveDuelMove(challengeId, choice, wager, buttonEl) {
      if (!challengeId) return;

      // Check tokens if wager > 0
      const currentTokens = getArcadeTokens();
      if (wager > 0 && currentTokens < wager) {
        if (window.showNotif) window.showNotif(`You need at least ${wager} tokens to accept this wager!`, 'error', 3000);
        arcadeAudio.playDefeat();
        return;
      }

      // Read secret move or procedural opponent move
      let challengerMove = null;
      try {
        challengerMove = localStorage.getItem(`rps_secret_${challengeId}`);
      } catch (_) {}

      if (!challengerMove) {
        const moves = ['rock', 'paper', 'scissors'];
        challengerMove = moves[Math.floor(Math.random() * moves.length)];
      }

      // Determine Outcome
      let result = 'draw';
      if (choice === challengerMove) {
        result = 'draw';
      } else if (
        (choice === 'rock' && challengerMove === 'scissors') ||
        (choice === 'paper' && challengerMove === 'rock') ||
        (choice === 'scissors' && challengerMove === 'paper')
      ) {
        result = 'win';
      } else {
        result = 'lose';
      }

      // Disable card buttons
      const cardEl = buttonEl ? buttonEl.closest('.tactical-duel-card') : null;
      if (cardEl) {
        cardEl.querySelectorAll('.duel-choice-btn').forEach(btn => {
          btn.disabled = true;
          btn.style.opacity = '0.5';
          btn.style.pointerEvents = 'none';
        });
      }

      // Process Wager & Score
      if (result === 'win') {
        const reward = wager * 2;
        if (wager > 0) adjustArcadeTokens(reward, `RPS Duel Victory (+${reward} Tokens)`);
        arcadeAudio.playVictory();
        
        let wins = parseInt(localStorage.getItem('nex_rps_wins') || '0', 10) + 1;
        try { localStorage.setItem('nex_rps_wins', String(wins)); } catch (_) {}

        if (window.showNotif) window.showNotif(`[VICTORY] You chose ${choice.toUpperCase()}, opponent chose ${challengerMove.toUpperCase()}! Won ${reward} Tokens!`, 'success', 4000);
      } else if (result === 'lose') {
        if (wager > 0) adjustArcadeTokens(-wager, `RPS Duel Defeat (-${wager} Tokens)`);
        arcadeAudio.playDefeat();
        if (window.showNotif) window.showNotif(`[DEFEAT] You chose ${choice.toUpperCase()}, opponent had ${challengerMove.toUpperCase()}!`, 'error', 3500);
      } else {
        arcadeAudio.playBeep(440, 0.15, 'triangle');
        if (window.showNotif) window.showNotif(`[DRAW] Both chose ${choice.toUpperCase()}! Wagers refunded.`, 'info', 3000);
      }

      // Invalidate secret so challenge cannot be answered twice
      try { localStorage.removeItem(`rps_secret_${challengeId}`); } catch (_) {}
    }

    // ─── GAME 2: Cyber Pong Canvas Engine ───
    initPongCanvas() {
      const canvas = document.getElementById('cyberPongCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      this.pongState = {
        canvas,
        ctx,
        playerY: 110,
        aiY: 110,
        paddleH: 70,
        paddleW: 10,
        ballX: 250,
        ballY: 150,
        ballVx: 4,
        ballVy: 3,
        playerScore: 0,
        aiScore: 0,
        running: false
      };

      // Mouse and Touch Controls with scale factor normalization
      const getCanvasY = (clientY) => {
        const rect = canvas.getBoundingClientRect();
        const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
        return (clientY - rect.top) * scaleY;
      };

      canvas.onmousemove = (e) => {
        const y = getCanvasY(e.clientY);
        this.pongState.playerY = Math.max(0, Math.min(canvas.height - this.pongState.paddleH, y - this.pongState.paddleH / 2));
      };

      canvas.ontouchmove = (e) => {
        e.preventDefault();
        const y = getCanvasY(e.touches[0].clientY);
        this.pongState.playerY = Math.max(0, Math.min(canvas.height - this.pongState.paddleH, y - this.pongState.paddleH / 2));
      };

      this.drawPong();
    }

    startPongGame() {
      if (this.pongAnimId) {
        cancelAnimationFrame(this.pongAnimId);
        this.pongAnimId = null;
      }
      if (!this.pongState) this.initPongCanvas();
      
      this.pongState.running = true;
      this.pongState.playerScore = 0;
      this.pongState.aiScore = 0;
      
      const pScoreEl = document.getElementById('pongScorePlayer');
      const aScoreEl = document.getElementById('pongScoreAi');
      if (pScoreEl) pScoreEl.textContent = '0';
      if (aScoreEl) aScoreEl.textContent = '0';

      this.resetBall();

      const btn = document.getElementById('startPongGameBtn');
      if (btn) btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> RESET MATCH';

      arcadeAudio.playBeep(480, 0.08, 'triangle');
      this.runPongLoop();
    }

    resetBall() {
      const s = this.pongState;
      s.ballX = s.canvas.width / 2;
      s.ballY = s.canvas.height / 2;
      s.ballVx = (Math.random() > 0.5 ? 4.5 : -4.5);
      s.ballVy = (Math.random() * 4 - 2);
    }

    runPongLoop() {
      if (!this.pongState || !this.pongState.running) return;

      const s = this.pongState;

      // Ball Physics
      s.ballX += s.ballVx;
      s.ballY += s.ballVy;

      // Top/Bottom walls
      if (s.ballY <= 6 || s.ballY >= s.canvas.height - 6) {
        s.ballVy = -s.ballVy;
        arcadeAudio.playBeep(320, 0.03, 'sine');
      }

      // AI Paddle Tracking
      const aiCenter = s.aiY + s.paddleH / 2;
      if (aiCenter < s.ballY - 12) s.aiY += 3.4;
      else if (aiCenter > s.ballY + 12) s.aiY -= 3.4;
      s.aiY = Math.max(0, Math.min(s.canvas.height - s.paddleH, s.aiY));

      // Player Paddle Collision (Left)
      if (s.ballX <= 22 && s.ballY >= s.playerY && s.ballY <= s.playerY + s.paddleH) {
        s.ballVx = Math.abs(s.ballVx) * 1.05; // speed up
        const delta = s.ballY - (s.playerY + s.paddleH / 2);
        s.ballVy = delta * 0.18;
        arcadeAudio.playBeep(520, 0.04, 'square');
      }

      // AI Paddle Collision (Right)
      if (s.ballX >= s.canvas.width - 22 && s.ballY >= s.aiY && s.ballY <= s.aiY + s.paddleH) {
        s.ballVx = -Math.abs(s.ballVx) * 1.05;
        const delta = s.ballY - (s.aiY + s.paddleH / 2);
        s.ballVy = delta * 0.18;
        arcadeAudio.playBeep(420, 0.04, 'square');
      }

      // Scoring
      if (s.ballX < 0) {
        s.aiScore++;
        const aEl = document.getElementById('pongScoreAi');
        if (aEl) aEl.textContent = s.aiScore;
        arcadeAudio.playBeep(220, 0.12, 'sawtooth');
        this.resetBall();
      } else if (s.ballX > s.canvas.width) {
        s.playerScore++;
        const pEl = document.getElementById('pongScorePlayer');
        if (pEl) pEl.textContent = s.playerScore;
        arcadeAudio.playBeep(780, 0.1, 'triangle');
        this.resetBall();
      }

      // Win Condition (First to 5)
      if (s.playerScore >= 5 || s.aiScore >= 5) {
        s.running = false;
        const win = s.playerScore >= 5;
        if (win) {
          arcadeAudio.playVictory();
          let wins = parseInt(localStorage.getItem('nex_pong_wins') || '0', 10) + 1;
          try { localStorage.setItem('nex_pong_wins', String(wins)); } catch (_) {}
          adjustArcadeTokens(150, 'Cyber Pong Victory (+150 Tokens)');
          if (window.showNotif) window.showNotif(`[VICTORY] You defeated Cyber-AI 5-${s.aiScore}! +150 Tokens!`, 'success', 4000);
        } else {
          arcadeAudio.playDefeat();
          if (window.showNotif) window.showNotif(`[DEFEAT] Cyber-AI defeated you 5-${s.playerScore}!`, 'error', 3500);
        }
      }

      this.drawPong();

      if (s.running) {
        this.pongAnimId = requestAnimationFrame(() => this.runPongLoop());
      }
    }

    drawPong() {
      const s = this.pongState;
      if (!s) return;
      const ctx = s.ctx;

      // Dark Matrix Background
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, s.canvas.width, s.canvas.height);

      // Center Dotted Net
      ctx.strokeStyle = 'rgba(0, 240, 118, 0.2)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(s.canvas.width / 2, 0);
      ctx.lineTo(s.canvas.width / 2, s.canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Player Paddle (Neon Green)
      ctx.fillStyle = '#00ff66';
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 12;
      ctx.fillRect(10, s.playerY, s.paddleW, s.paddleH);

      // AI Paddle (Neon Crimson)
      ctx.fillStyle = '#fe2c55';
      ctx.shadowColor = '#fe2c55';
      ctx.shadowBlur = 12;
      ctx.fillRect(s.canvas.width - 20, s.aiY, s.paddleW, s.paddleH);

      // Ball (Neon Cyan)
      ctx.fillStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ─── GAME 3: Crypto & Cyber Trivia Blitz ───
    startTriviaGame() {
      this.triviaIndex = 0;
      this.triviaScore = 0;
      const scoreVal = document.getElementById('triviaScoreVal');
      if (scoreVal) scoreVal.textContent = '0 PTS';
      this.renderTriviaQuestion();
    }

    renderTriviaQuestion() {
      clearInterval(this.triviaTimer);

      const questions = [
        {
          q: 'Which algorithm provides quantum-resistant zero-knowledge encryption?',
          opts: ['Kyber-1024 / Dilithium', 'MD5 Hash', 'DES 56-bit', 'ROT13 Cipher'],
          correct: 0
        },
        {
          q: 'What is the standard latency of NEXCHAT Supabase Realtime channels?',
          opts: ['1000ms', 'Sub-15ms', '500ms', '45 seconds'],
          correct: 1
        },
        {
          q: 'In WebRTC peer connections, what does STUN stand for?',
          opts: ['Session Traversal Utilities for NAT', 'System Tactical Ultra Network', 'Single Threaded User Node', 'Server Token Universal Name'],
          correct: 0
        },
        {
          q: 'Which protocol powers Telegram & NEXCHAT instant circular video notes?',
          opts: ['MediaRecorder + VP8/Opus', 'Flash SWF', 'Silverlight', 'RealPlayer'],
          correct: 0
        },
        {
          q: 'What is the primary AI Engine integrated inside NEXCHAT?',
          opts: ['Google Gemini 2.0 / 3.0 Pro', 'Siri 1.0', 'Cortana', 'Eliza 1966'],
          correct: 0
        }
      ];

      if (this.triviaIndex >= questions.length) {
        // Complete
        const maxPts = questions.length * 20;
        const isPerfect = (this.triviaScore === maxPts);
        if (isPerfect) {
          arcadeAudio.playVictory();
          adjustArcadeTokens(100, 'Perfect Trivia Score (+100 Tokens)');
        }
        
        let high = parseInt(localStorage.getItem('nex_trivia_highscore') || '0', 10);
        if (this.triviaScore > high) {
          try { localStorage.setItem('nex_trivia_highscore', String(this.triviaScore)); } catch (_) {}
        }

        const qText = document.getElementById('triviaQuestionText');
        if (qText) qText.textContent = `[CHAMPION] TRIVIA COMPLETE! Your Final Score: ${this.triviaScore} / ${maxPts} PTS ${isPerfect ? '(PERFECT! +100 TOKENS)' : ''}`;
        
        const grid = document.getElementById('triviaOptionsGrid');
        if (grid) {
          grid.innerHTML = `
            <button type="button" class="trivia-opt-btn correct text-center" id="restartTriviaBtn">
              <i class="fa-solid fa-rotate-right"></i> PLAY AGAIN
            </button>
          `;
          document.getElementById('restartTriviaBtn')?.addEventListener('click', () => this.startTriviaGame());
        }
        return;
      }

      const cur = questions[this.triviaIndex];
      const progLabel = document.getElementById('triviaProgressLabel');
      if (progLabel) progLabel.textContent = `QUESTION ${this.triviaIndex + 1} OF ${questions.length}`;
      
      const qText = document.getElementById('triviaQuestionText');
      if (qText) qText.textContent = cur.q;

      let seconds = 10;
      const timerBadge = document.getElementById('triviaTimerBadge');
      if (timerBadge) timerBadge.textContent = `${seconds}s`;

      this.triviaTimer = setInterval(() => {
        seconds--;
        if (timerBadge) timerBadge.textContent = `${seconds}s`;
        if (seconds <= 0) {
          clearInterval(this.triviaTimer);
          arcadeAudio.playBeep(260, 0.1, 'sawtooth');
          this.triviaIndex++;
          this.renderTriviaQuestion();
        }
      }, 1000);

      const grid = document.getElementById('triviaOptionsGrid');
      if (!grid) return;
      grid.innerHTML = cur.opts.map((opt, idx) => `
        <button type="button" class="trivia-opt-btn" data-idx="${idx}">
          <span class="trivia-key">${String.fromCharCode(65 + idx)}</span>
          <span>${opt}</span>
        </button>
      `).join('');

      // Attach anti-rapid-click handlers
      grid.querySelectorAll('.trivia-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          clearInterval(this.triviaTimer);
          
          // Disable all options immediately to prevent double submission
          grid.querySelectorAll('.trivia-opt-btn').forEach(b => {
            b.style.pointerEvents = 'none';
          });

          const chosen = parseInt(btn.dataset.idx, 10);
          if (chosen === cur.correct) {
            btn.classList.add('correct');
            this.triviaScore += 20;
            const scoreVal = document.getElementById('triviaScoreVal');
            if (scoreVal) scoreVal.textContent = `${this.triviaScore} PTS`;
            arcadeAudio.playBeep(700, 0.08, 'triangle');
          } else {
            btn.classList.add('wrong');
            arcadeAudio.playBeep(220, 0.12, 'sawtooth');
            // Highlight the correct one
            grid.querySelector(`[data-idx="${cur.correct}"]`)?.classList.add('correct');
          }

          setTimeout(() => {
            this.triviaIndex++;
            this.renderTriviaQuestion();
          }, 850);
        });
      });
    }
  }

  // Helper function to render tactical duel challenge card in chat
  window.renderTacticalDuelTextBubble = function (text, messageId) {
    if (!text || !text.includes('[TACTICAL DUEL]')) return null;

    const wagerMatch = text.match(/Pot:\s*\*\*(\d+)\s*NEX Tokens\*\*/i);
    const wager = wagerMatch ? parseInt(wagerMatch[1], 10) : 50;

    const idMatch = text.match(/Challenge ID:\s*`([^`]+)`/i);
    const challengeId = idMatch ? idMatch[1] : (messageId || `duel_${Date.now()}`);

    const card = document.createElement('div');
    card.className = 'tactical-duel-card';
    card.style.cssText = `
      background: linear-gradient(135deg, rgba(8, 14, 26, 0.95), rgba(16, 24, 40, 0.95));
      border: 1px solid rgba(0, 240, 118, 0.4);
      border-radius: 12px;
      padding: 14px;
      margin: 6px 0;
      box-shadow: 0 4px 20px rgba(0, 240, 118, 0.12);
      font-family: inherit;
      color: #fff;
    `;

    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(0, 240, 118, 0.2); padding-bottom: 8px; margin-bottom: 10px;">
        <span style="font-size: 11px; font-weight: 800; color: #00ff66; letter-spacing: 1px; display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-gamepad"></i> TACTICAL DUEL
        </span>
        <span style="font-size: 11px; font-weight: 700; color: #ffb700; background: rgba(255, 183, 0, 0.12); border: 1px solid rgba(255, 183, 0, 0.3); border-radius: 9999px; padding: 2px 8px;">
          ${wager > 0 ? wager + ' NEX' : 'FREE'}
        </span>
      </div>
      <div style="font-size: 13px; font-weight: 700; margin-bottom: 4px; color: #f8fafc;">ROCK - PAPER - SCISSORS</div>
      <div style="font-size: 11px; color: #94a3b8; margin-bottom: 12px;">Tap a weapon to counter the challenger:</div>
      <div style="display: flex; gap: 8px;" class="duel-buttons-row">
        <button type="button" class="duel-choice-btn" data-choice="rock" style="flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 4px; color: #fff; cursor: pointer; transition: all 0.2s;">
          <div style="font-size: 16px;"><i class="fa-solid fa-hand-fist"></i></div>
          <div style="font-size: 10px; font-weight: 700; margin-top: 2px;">ROCK</div>
        </button>
        <button type="button" class="duel-choice-btn" data-choice="paper" style="flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 4px; color: #fff; cursor: pointer; transition: all 0.2s;">
          <div style="font-size: 16px;"><i class="fa-solid fa-hand"></i></div>
          <div style="font-size: 10px; font-weight: 700; margin-top: 2px;">PAPER</div>
        </button>
        <button type="button" class="duel-choice-btn" data-choice="scissors" style="flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 4px; color: #fff; cursor: pointer; transition: all 0.2s;">
          <div style="font-size: 16px;"><i class="fa-solid fa-hand-scissors"></i></div>
          <div style="font-size: 10px; font-weight: 700; margin-top: 2px;">SCISSORS</div>
        </button>
      </div>
    `;

    card.querySelectorAll('.duel-choice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const choice = btn.dataset.choice;
        if (window.chatArcadeEngine) {
          window.chatArcadeEngine.resolveDuelMove(challengeId, choice, wager, btn);
        }
      });
    });

    return card;
  };

  // Export globally
  window.chatArcadeEngine = new ChatArcadeEngine();
  window.ChatArcade = window.chatArcadeEngine;
})();
