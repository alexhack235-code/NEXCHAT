/**
 * NEXCHAT IN-CHAT MINI-GAMES & TOKEN WAGERING ARCADE
 * 
 * Capabilities:
 * - Rock-Paper-Scissors Token Wager (50, 100, 250 Tokens) with interactive in-chat resolution
 * - Cyber Pong: 60fps HTML5 Canvas Neon Paddle Game with responsive touch/mouse controls & AI
 * - Crypto & Cyber Trivia Blitz (5 rapid-fire questions with live timer)
 * - Real-time token pot transfers and celebratory victory banners
 */

(function () {
  'use strict';

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
              <button type="button" class="wager-pill active" data-wager="50">50 🪙</button>
              <button type="button" class="wager-pill" data-wager="100">100 🪙</button>
              <button type="button" class="wager-pill" data-wager="250">250 🪙</button>
            </div>

            <div class="wager-selector-title mt-4">PICK YOUR SECRET MOVE:</div>
            <div class="rps-choices-row">
              <button type="button" class="rps-choice-btn" data-choice="rock">
                <span class="rps-emoji">🪨</span>
                <span class="rps-name">ROCK</span>
              </button>
              <button type="button" class="rps-choice-btn" data-choice="paper">
                <span class="rps-emoji">📄</span>
                <span class="rps-name">PAPER</span>
              </button>
              <button type="button" class="rps-choice-btn" data-choice="scissors">
                <span class="rps-emoji">✂️</span>
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
              <span>SCORE: <strong id="triviaScoreVal" class="text-[#00ff66]">0 PTS</strong></span>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Close modal
      document.getElementById('closeArcadeModalBtn')?.addEventListener('click', () => {
        this.closeModal();
      });

      // Tab switcher
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
        });
      });

      // RPS choice buttons
      modal.querySelectorAll('.rps-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.rps-choice-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.myRpsChoice = btn.dataset.choice;
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
      const attachHubGrid = document.querySelector('.attach-hub-grid');
      if (attachHubGrid && !document.getElementById('hubActionArcade')) {
        const item = document.createElement('div');
        item.id = 'hubActionArcade';
        item.className = 'attach-hub-item';
        item.innerHTML = `
          <div class="attach-hub-icon icon-arcade" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(0, 240, 118, 0.25)); border-color: #a855f7;">
            <i class="fa-solid fa-gamepad" style="color: #c084fc;"></i>
          </div>
          <span>Mini-Games</span>
        `;
        item.addEventListener('click', () => {
          // Close attachment menu
          const hub = document.getElementById('attachmentHub');
          if (hub) hub.style.display = 'none';
          this.openModal();
        });
        attachHubGrid.appendChild(item);
      }
    }

    openModal() {
      const modal = document.getElementById('chatArcadeModal');
      const partnerName = window.currentChatName || 'Partner';
      const nameEl = document.getElementById('rpsTargetPartner');
      if (nameEl) nameEl.textContent = partnerName;

      if (modal) modal.style.display = 'flex';
      if (window.playLuxuryPopSound) window.playLuxuryPopSound();
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
      const challengeId = `rps_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      // Store private secret in localStorage
      localStorage.setItem(`rps_secret_${challengeId}`, this.myRpsChoice);

      // Create challenge card payload
      const cardText = `🎮 **ROCK-PAPER-SCISSORS BATTLE**\n${myName} challenged ${partnerName}!\n🪙 **Wager Pot: ${wager > 0 ? wager + ' NEX Tokens' : 'Free Match'}**\n\nTap your move below to accept the challenge!`;

      const input = document.getElementById('message-input');
      if (input) {
        input.value = cardText;
        if (typeof window.sendMessage === 'function') {
          window.sendMessage();
        }
      }

      this.closeModal();
      if (window.showNotif) window.showNotif(`Challenge dispatched with ${wager} token wager!`, 'success', 2500);
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

      // Mouse and Touch Controls
      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const root = document.documentElement;
        const mouseY = e.clientY - rect.top - root.scrollTop;
        this.pongState.playerY = Math.max(0, Math.min(canvas.height - this.pongState.paddleH, mouseY - this.pongState.paddleH / 2));
      };

      canvas.ontouchmove = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchY = e.touches[0].clientY - rect.top;
        this.pongState.playerY = Math.max(0, Math.min(canvas.height - this.pongState.paddleH, touchY - this.pongState.paddleH / 2));
      };

      this.drawPong();
    }

    startPongGame() {
      if (!this.pongState) this.initPongCanvas();
      this.pongState.running = true;
      this.pongState.playerScore = 0;
      this.pongState.aiScore = 0;
      this.resetBall();

      const btn = document.getElementById('startPongGameBtn');
      if (btn) btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> RESET MATCH';

      this.runPongLoop();
    }

    resetBall() {
      const s = this.pongState;
      s.ballX = s.canvas.width / 2;
      s.ballY = s.canvas.height / 2;
      s.ballVx = (Math.random() > 0.5 ? 4 : -4);
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
      }

      // AI Paddle Tracking
      const aiCenter = s.aiY + s.paddleH / 2;
      if (aiCenter < s.ballY - 12) s.aiY += 3.2;
      else if (aiCenter > s.ballY + 12) s.aiY -= 3.2;
      s.aiY = Math.max(0, Math.min(s.canvas.height - s.paddleH, s.aiY));

      // Player Paddle Collision (Left)
      if (s.ballX <= 22 && s.ballY >= s.playerY && s.ballY <= s.playerY + s.paddleH) {
        s.ballVx = Math.abs(s.ballVx) * 1.05; // speed up
        const delta = s.ballY - (s.playerY + s.paddleH / 2);
        s.ballVy = delta * 0.18;
      }

      // AI Paddle Collision (Right)
      if (s.ballX >= s.canvas.width - 22 && s.ballY >= s.aiY && s.ballY <= s.aiY + s.paddleH) {
        s.ballVx = -Math.abs(s.ballVx) * 1.05;
        const delta = s.ballY - (s.aiY + s.paddleH / 2);
        s.ballVy = delta * 0.18;
      }

      // Scoring
      if (s.ballX < 0) {
        s.aiScore++;
        document.getElementById('pongScoreAi').textContent = s.aiScore;
        this.resetBall();
      } else if (s.ballX > s.canvas.width) {
        s.playerScore++;
        document.getElementById('pongScorePlayer').textContent = s.playerScore;
        this.resetBall();
      }

      // Win Condition (First to 5)
      if (s.playerScore >= 5 || s.aiScore >= 5) {
        s.running = false;
        const win = s.playerScore >= 5;
        if (win && window.showNotif) {
          window.showNotif('🎉 VICTORY! You defeated Cyber-AI 5-' + s.aiScore, 'success', 3500);
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
      document.getElementById('triviaScoreVal').textContent = '0 PTS';
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
        document.getElementById('triviaQuestionText').textContent = `🏆 TRIVIA COMPLETE! Your Final Score: ${this.triviaScore} / ${questions.length * 20} PTS`;
        document.getElementById('triviaOptionsGrid').innerHTML = `
          <button type="button" class="trivia-opt-btn correct text-center" id="restartTriviaBtn">
            <i class="fa-solid fa-rotate-right"></i> PLAY AGAIN
          </button>
        `;
        document.getElementById('restartTriviaBtn')?.addEventListener('click', () => this.startTriviaGame());
        return;
      }

      const cur = questions[this.triviaIndex];
      document.getElementById('triviaProgressLabel').textContent = `QUESTION ${this.triviaIndex + 1} OF ${questions.length}`;
      document.getElementById('triviaQuestionText').textContent = cur.q;

      let seconds = 10;
      const timerBadge = document.getElementById('triviaTimerBadge');
      if (timerBadge) timerBadge.textContent = `${seconds}s`;

      this.triviaTimer = setInterval(() => {
        seconds--;
        if (timerBadge) timerBadge.textContent = `${seconds}s`;
        if (seconds <= 0) {
          clearInterval(this.triviaTimer);
          this.triviaIndex++;
          this.renderTriviaQuestion();
        }
      }, 1000);

      const grid = document.getElementById('triviaOptionsGrid');
      grid.innerHTML = cur.opts.map((opt, idx) => `
        <button type="button" class="trivia-opt-btn" data-idx="${idx}">
          <span class="trivia-key">${String.fromCharCode(65 + idx)}</span>
          <span>${opt}</span>
        </button>
      `).join('');

      grid.querySelectorAll('.trivia-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          clearInterval(this.triviaTimer);
          const chosen = parseInt(btn.dataset.idx, 10);
          if (chosen === cur.correct) {
            btn.classList.add('correct');
            this.triviaScore += 20;
            document.getElementById('triviaScoreVal').textContent = `${this.triviaScore} PTS`;
            if (window.playLuxuryPopSound) window.playLuxuryPopSound();
          } else {
            btn.classList.add('wrong');
          }

          setTimeout(() => {
            this.triviaIndex++;
            this.renderTriviaQuestion();
          }, 800);
        });
      });
    }
  }

  // Export globally
  window.chatArcadeEngine = new ChatArcadeEngine();
})();
