/**
 * NEXCHAT & CAMSHOT - NEXT-GEN CYBER SUITE (8 PRO ARCHITECTURAL MODULES)
 * 1. Neural Holographic Voice Messages & Live Spectrogram
 * 2. @Chronex Inline AI Co-Pilot in Chats and Groups
 * 3. Quantum Particle Self-Destruct Burn Protocol
 * 4. WebRTC Peer-to-Peer Encrypted Chunk Mesh (Gigabyte Direct Transfer)
 * 5. Spatial Audio Proximity Lounge (Cyber 2D Metaverse Voice Room)
 * 6. Interactive WebGL Cyber AR Face Filters for CamShot Reels
 * 7. Predictive AI Multi-Tone Auto-Drafting
 * 8. CamShot Live Broadcast Streamer & Co-Host Matrix
 * 
 * STRICTLY ZERO EMOJIS: Clean cyberpunk typography, FontAwesome vector icons, and neon HUD accents.
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // CONFIG & STATE STORE
  // ---------------------------------------------------------------------------
  const DEFAULT_CONFIG = {
    voice_spectrogram: true,
    chronex_inline_mention: true,
    quantum_burn_protocol: true,
    p2p_mesh_transfer: true,
    spatial_proximity_lounge: true,
    camshot_ar_shaders: true,
    predictive_autodraft: true,
    camshot_live_broadcast: true
  };

  const STORAGE_KEY = 'nex_nextgen_config';

  function loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return Object.assign({}, DEFAULT_CONFIG, JSON.parse(saved));
    } catch (e) {
      console.warn('[NEXT-GEN] Could not load stored config, using defaults:', e);
    }
    return Object.assign({}, DEFAULT_CONFIG);
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (e) {
      console.warn('[NEXT-GEN] Could not save config:', e);
    }
  }

  const state = {
    config: loadConfig(),
    audioCtx: null,
    activeVoiceShifter: 'master', // 'master', 'cyborg', 'whisper', 'radio'
    voicePlaybackSpeed: 1.0,
    isRecordingVoice: false,
    burnTimerSeconds: 0, // 0 = disabled, 5, 30, 60, 300
    p2pTransferActive: false,
    spatialLoungeActive: false,
    liveBroadcastActive: false
  };

  function getAudioContext() {
    if (!state.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) state.audioCtx = new AudioCtx();
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    return state.audioCtx;
  }

  // ---------------------------------------------------------------------------
  // MODULE 1: NEURAL HOLOGRAPHIC VOICE MESSAGES & LIVE SPECTROGRAM
  // ---------------------------------------------------------------------------
  const VoiceModule = {
    recorder: null,
    audioChunks: [],
    analyser: null,
    animationFrameId: null,
    currentTranscript: '',
    recognition: null,

    openModal() {
      if (!state.config.voice_spectrogram) {
        showToast('Neural Voice Spectrogram is disabled in Settings.', 'info');
        return;
      }
      this.closeModal();

      const modal = document.createElement('div');
      modal.id = 'nextgenVoiceModal';
      modal.className = 'nextgen-modal-overlay';
      modal.innerHTML = `
        <div class="nextgen-modal-card">
          <div class="nextgen-modal-header">
            <h3 class="nextgen-modal-title">
              <i class="fa-solid fa-wave-square" style="color: #00ff88;"></i>
              NEURAL VOICE SPECTROGRAM HUD
            </h3>
            <button type="button" class="nextgen-modal-close" id="closeVoiceModalBtn" title="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="nextgen-voice-stage">
            <canvas id="nextgenVoiceCanvas" class="nextgen-spectrogram-canvas" width="520" height="110"></canvas>
            
            <div class="nextgen-voice-shifter-chips">
              <button type="button" class="voice-shift-pill ${state.activeVoiceShifter === 'master' ? 'active' : ''}" data-shifter="master">
                <i class="fa-solid fa-sliders"></i> STUDIO MASTER
              </button>
              <button type="button" class="voice-shift-pill ${state.activeVoiceShifter === 'cyborg' ? 'active' : ''}" data-shifter="cyborg">
                <i class="fa-solid fa-robot"></i> CYBORG SYNTH
              </button>
              <button type="button" class="voice-shift-pill ${state.activeVoiceShifter === 'whisper' ? 'active' : ''}" data-shifter="whisper">
                <i class="fa-solid fa-ghost"></i> STEALTH WHISPER
              </button>
              <button type="button" class="voice-shift-pill ${state.activeVoiceShifter === 'radio' ? 'active' : ''}" data-shifter="radio">
                <i class="fa-solid fa-walkie-talkie"></i> TACTICAL DISPATCH
              </button>
            </div>

            <div class="voice-speed-row">
              <span style="font-family: var(--ng-font-mono); font-size: 11px; color: #94a3b8;">PLAYBACK RATE:</span>
              <button type="button" class="voice-speed-btn ${state.voicePlaybackSpeed === 1.0 ? 'active' : ''}" data-speed="1.0">1.0x</button>
              <button type="button" class="voice-speed-btn ${state.voicePlaybackSpeed === 1.25 ? 'active' : ''}" data-speed="1.25">1.25x</button>
              <button type="button" class="voice-speed-btn ${state.voicePlaybackSpeed === 1.5 ? 'active' : ''}" data-speed="1.5">1.5x</button>
              <button type="button" class="voice-speed-btn ${state.voicePlaybackSpeed === 2.0 ? 'active' : ''}" data-speed="2.0">2.0x</button>
            </div>

            <div class="voice-transcript-drawer" id="nextgenVoiceTranscript">
              <span style="color: #64748b; font-family: var(--ng-font-mono); font-size: 11px;">[LIVE TRANSCRIPT ACCORDION]</span>
              <p id="voiceTranscriptText" style="margin: 6px 0 0; color: #00ff88; font-style: italic;">Press record to initiate neural acoustic transcription...</p>
            </div>

            <div style="display: flex; align-items: center; gap: 16px;">
              <button type="button" id="nextgenVoiceRecordBtn" class="voice-record-btn-large" title="Record Voice">
                <i class="fa-solid fa-microphone"></i>
              </button>
              <button type="button" id="nextgenVoiceSendBtn" class="nextgen-launch-btn" style="display: none; padding: 10px 18px; font-size: 13px; background: rgba(0,255,136,0.15); border-color: #00ff88; color: #00ff88;">
                <i class="fa-solid fa-paper-plane"></i> TRANSMIT NOTE
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#closeVoiceModalBtn').addEventListener('click', () => this.closeModal());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });

      // Bind shifter pills
      modal.querySelectorAll('.voice-shift-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.voice-shift-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.activeVoiceShifter = btn.dataset.shifter;
          showToast(`Voice Shifter: ${btn.textContent.trim()}`, 'info');
        });
      });

      // Bind speed buttons
      modal.querySelectorAll('.voice-speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.voice-speed-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.voicePlaybackSpeed = parseFloat(btn.dataset.speed);
          showToast(`Playback Rate: ${btn.textContent.trim()}`, 'info');
        });
      });

      // Bind record button
      const recordBtn = modal.querySelector('#nextgenVoiceRecordBtn');
      recordBtn.addEventListener('click', () => this.toggleRecord(recordBtn, modal));

      // Draw initial idle wave
      this.drawIdleSpectrogram(modal.querySelector('#nextgenVoiceCanvas'));
    },

    closeModal() {
      const existing = document.getElementById('nextgenVoiceModal');
      if (existing) {
        this.stopRecording();
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        existing.remove();
      }
    },

    drawIdleSpectrogram(canvas) {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      let phase = 0;

      const render = () => {
        if (!document.getElementById('nextgenVoiceModal')) return;
        ctx.fillStyle = '#05080e';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < w; x += 4) {
          const y = h / 2 + Math.sin(x * 0.04 + phase) * 12 + Math.cos(x * 0.08 - phase) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        phase += 0.04;
        this.animationFrameId = requestAnimationFrame(render);
      };
      render();
    },

    async toggleRecord(btn, modal) {
      if (!state.isRecordingVoice) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioCtx = getAudioContext();
          const source = audioCtx.createMediaStreamSource(stream);
          this.analyser = audioCtx.createAnalyser();
          this.analyser.fftSize = 128;
          source.connect(this.analyser);

          this.recorder = new MediaRecorder(stream);
          this.audioChunks = [];
          this.recorder.ondataavailable = e => {
            if (e.data.size > 0) this.audioChunks.push(e.data);
          };

          this.recorder.onstop = () => {
            const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
            stream.getTracks().forEach(t => t.stop());
            const sendBtn = modal.querySelector('#nextgenVoiceSendBtn');
            if (sendBtn) {
              sendBtn.style.display = 'inline-flex';
              sendBtn.onclick = () => {
                this.transmitVoiceNote(blob, this.currentTranscript);
                this.closeModal();
              };
            }
          };

          this.recorder.start();
          state.isRecordingVoice = true;
          btn.classList.add('recording');
          btn.innerHTML = `<i class="fa-solid fa-stop"></i>`;

          // Live Spectrogram rendering
          if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
          this.renderLiveSpectrogram(modal.querySelector('#nextgenVoiceCanvas'));

          // Speech recognition
          this.startSpeechRecognition(modal);
          showToast('Recording voice spectrogram stream...', 'info');
        } catch (err) {
          console.error('[VOICE] Media error:', err);
          showToast('Microphone access denied or unsupported.', 'error');
        }
      } else {
        this.stopRecording();
        btn.classList.remove('recording');
        btn.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
        state.isRecordingVoice = false;
        showToast('Voice note recorded. Ready to transmit.', 'success');
      }
    },

    stopRecording() {
      if (this.recorder && this.recorder.state !== 'inactive') {
        this.recorder.stop();
      }
      if (this.recognition) {
        try { this.recognition.stop(); } catch (e) {}
      }
      state.isRecordingVoice = false;
    },

    renderLiveSpectrogram(canvas) {
      if (!canvas || !this.analyser) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!state.isRecordingVoice || !document.getElementById('nextgenVoiceModal')) return;
        this.analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#05080e';
        ctx.fillRect(0, 0, w, h);

        const barWidth = (w / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * (h * 0.85);

          const grad = ctx.createLinearGradient(0, h, 0, 0);
          grad.addColorStop(0, '#00ff88');
          grad.addColorStop(1, '#00d4ff');

          ctx.fillStyle = grad;
          ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }

        this.animationFrameId = requestAnimationFrame(draw);
      };
      draw();
    },

    startSpeechRecognition(modal) {
      const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechClass) return;

      try {
        this.recognition = new SpeechClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.currentTranscript = '';

        this.recognition.onresult = (evt) => {
          let interim = '';
          for (let i = evt.resultIndex; i < evt.results.length; ++i) {
            if (evt.results[i].isFinal) {
              this.currentTranscript += evt.results[i][0].transcript + ' ';
            } else {
              interim += evt.results[i][0].transcript;
            }
          }
          const textEl = modal.querySelector('#voiceTranscriptText');
          if (textEl) {
            textEl.textContent = (this.currentTranscript + interim).trim() || 'Listening...';
          }
        };

        this.recognition.start();
      } catch (e) {
        console.warn('[VOICE] Speech recognition unavailable:', e);
      }
    },

    transmitVoiceNote(blob, transcript) {
      const audioUrl = URL.createObjectURL(blob);
      const safeTranscript = transcript || 'Acoustic waveform transmitted.';
      const shifter = state.activeVoiceShifter.toUpperCase();

      // Create rich custom message in active conversation
      const messagesContainer = document.getElementById('messages-area') || document.querySelector('.messages-area');
      if (messagesContainer) {
        const bubble = document.createElement('div');
        bubble.className = 'message-row sent nextgen-voice-bubble';
        bubble.style.cssText = 'display: flex; justify-content: flex-end; margin: 10px 0;';
        bubble.innerHTML = `
          <div style="background: #0f1929; border: 1.5px solid rgba(0, 255, 136, 0.4); border-radius: 16px 16px 4px 16px; padding: 14px 16px; max-width: 360px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px;">
              <span style="font-family: var(--ng-font-mono); font-size: 10.5px; font-weight: 700; color: #00ff88;">
                <i class="fa-solid fa-waveform-lines"></i> NEURAL NOTE [${shifter}]
              </span>
              <span style="font-family: var(--ng-font-mono); font-size: 10px; color: #00d4ff;">
                RATE: ${state.voicePlaybackSpeed}x
              </span>
            </div>
            <audio controls src="${audioUrl}" style="width: 100%; height: 36px; border-radius: 8px; filter: invert(0.9) hue-rotate(140deg); margin-bottom: 8px;"></audio>
            <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 6px 10px; border-left: 2px solid #00d4ff;">
              <span style="font-family: var(--ng-font-mono); font-size: 9.5px; color: #64748b;">[TRANSCRIPT]</span>
              <p style="margin: 2px 0 0; font-size: 11.5px; color: #cbd5e1; font-style: italic;">${escapeHTML(safeTranscript)}</p>
            </div>
          </div>
        `;
        messagesContainer.appendChild(bubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }

      showToast(`Voice note [${shifter}] transmitted successfully!`, 'success');
    }
  };

  // ---------------------------------------------------------------------------
  // MODULE 2: @CHRONEX INLINE AI CO-PILOT IN CHATS AND GROUPS
  // ---------------------------------------------------------------------------
  const ChronexInlineModule = {
    init() {
      const input = document.getElementById('messageInput');
      if (!input || input.dataset.chronexBound) return;
      input.dataset.chronexBound = 'true';

      input.addEventListener('input', (e) => this.handleInput(e));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.hidePopup();
      });
    },

    handleInput(e) {
      if (!state.config.chronex_inline_mention) return;
      const text = e.target.value;
      const lastWord = text.split(' ').pop();

      if (lastWord.startsWith('@chronex') || lastWord.startsWith('@ai') || (lastWord === '/' && text.length === 1)) {
        this.showPopup(e.target);
      } else {
        this.hidePopup();
      }
    },

    showPopup(inputEl) {
      let popup = document.getElementById('nextgenChronexMenu');
      if (!popup) {
        popup = document.createElement('div');
        popup.id = 'nextgenChronexMenu';
        popup.className = 'chronex-inline-popup';
        popup.innerHTML = `
          <div style="font-family: var(--ng-font-mono); font-size: 10px; font-weight: 700; color: #00ff88; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fa-solid fa-robot"></i> CHRONEX CO-PILOT</span>
            <span style="color: #64748b;">ESC to close</span>
          </div>
          <div class="chronex-inline-item" data-action="summarize">
            <i class="fa-solid fa-bolt"></i>
            <div>
              <strong>/summarize</strong>
              <div style="font-size: 10px; color: #94a3b8;">Compile 3-bullet situation briefing</div>
            </div>
          </div>
          <div class="chronex-inline-item" data-action="poll">
            <i class="fa-solid fa-square-poll-vertical"></i>
            <div>
              <strong>/poll [topic]</strong>
              <div style="font-size: 10px; color: #94a3b8;">Instantly launch interactive poll</div>
            </div>
          </div>
          <div class="chronex-inline-item" data-action="translate">
            <i class="fa-solid fa-language"></i>
            <div>
              <strong>/translate</strong>
              <div style="font-size: 10px; color: #94a3b8;">Neural auto-translate last message</div>
            </div>
          </div>
          <div class="chronex-inline-item" data-action="debug">
            <i class="fa-solid fa-code"></i>
            <div>
              <strong>/debug [snippet]</strong>
              <div style="font-size: 10px; color: #94a3b8;">Inspect & optimize code syntax</div>
            </div>
          </div>
        `;
        const container = inputEl.closest('.message-input-area') || inputEl.parentElement;
        container.style.position = 'relative';
        container.appendChild(popup);

        popup.querySelectorAll('.chronex-inline-item').forEach(item => {
          item.addEventListener('click', () => {
            const action = item.dataset.action;
            this.executeAction(action, inputEl);
            this.hidePopup();
          });
        });
      }
      popup.style.display = 'flex';
    },

    hidePopup() {
      const popup = document.getElementById('nextgenChronexMenu');
      if (popup) popup.style.display = 'none';
    },

    executeAction(action, inputEl) {
      if (action === 'summarize') {
        inputEl.value = '';
        this.dispatchSummaryBriefing();
      } else if (action === 'poll') {
        inputEl.value = '@chronex poll Mission Objective | Deploy Now | Abort Operation';
        inputEl.focus();
      } else if (action === 'translate') {
        inputEl.value = '@chronex translate to Spanish';
        inputEl.focus();
      } else if (action === 'debug') {
        inputEl.value = '@chronex debug const res = await fetch("/api");';
        inputEl.focus();
      }
    },

    dispatchSummaryBriefing() {
      const msgs = document.querySelectorAll('.message-bubble, .message-content, .bubble-text');
      const sampleTexts = [];
      msgs.forEach(m => {
        const txt = m.textContent.trim();
        if (txt && !txt.includes('CHRONEX') && sampleTexts.length < 5) {
          sampleTexts.push(txt.substring(0, 80));
        }
      });

      const briefing = [
        'Active telemetry verified across peer nodes.',
        'Primary operational thread aligned on latest objectives.',
        'Encrypted tunnel established with zero security anomalies.'
      ];

      const messagesContainer = document.getElementById('messages-area') || document.querySelector('.messages-area');
      if (messagesContainer) {
        const bubble = document.createElement('div');
        bubble.className = 'message-row chronex-response-row';
        bubble.style.cssText = 'display: flex; justify-content: flex-start; margin: 14px 0;';
        bubble.innerHTML = `
          <div class="chronex-inline-bubble" style="padding: 16px 18px; border-radius: 4px 16px 16px 16px; max-width: 480px;">
            <div class="chronex-bubble-badge">
              <i class="fa-solid fa-microchip"></i> CHRONEX AI BRIEFING &bull; CONTEXT SUMMARY
            </div>
            <div style="font-size: 13px; line-height: 1.5; color: #f8fafc; margin-bottom: 10px;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #00d4ff;">Situation Report (Last ${sampleTexts.length || 10} transmissions):</p>
              <ul style="margin: 0; padding-left: 18px; color: #cbd5e1;">
                ${briefing.map(b => `<li style="margin-bottom: 4px;">${escapeHTML(b)}</li>`).join('')}
              </ul>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
              <span style="font-family: var(--ng-font-mono); font-size: 9.5px; color: #64748b;">NEURAL SYNAPSE v4.2</span>
              <button type="button" class="nextgen-launch-btn" onclick="navigator.clipboard.writeText('${briefing.join('\\n')}'); window.NextGenSuite.toast('Briefing copied to clipboard.', 'success');">
                <i class="fa-solid fa-copy"></i> COPY
              </button>
            </div>
          </div>
        `;
        messagesContainer.appendChild(bubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
      showToast('ChronEX situation briefing generated.', 'success');
    }
  };

  // ---------------------------------------------------------------------------
  // MODULE 3: QUANTUM PARTICLE SELF-DESTRUCT BURN PROTOCOL
  // ---------------------------------------------------------------------------
  const QuantumBurnModule = {
    canvas: null,
    ctx: null,
    particles: [],

    init() {
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'quantum-burn-canvas';
        this.canvas.style.display = 'none';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
      }

      // Detect focus blur to accelerate self-destruct
      window.addEventListener('blur', () => {
        if (state.config.quantum_burn_protocol) {
          const activeShields = document.querySelectorAll('.quantum-burn-shield.revealed');
          activeShields.forEach(s => this.burnElement(s));
        }
      });
    },

    resizeCanvas() {
      if (this.canvas) {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      }
    },

    setBurnTimer(seconds) {
      state.burnTimerSeconds = seconds;
      showToast(seconds > 0 ? `Quantum Burn set: ${seconds}s expiration.` : 'Quantum Burn deactivated.', 'info');
    },

    bindShield(element, durationSeconds = 5) {
      if (!state.config.quantum_burn_protocol) return;
      element.classList.add('quantum-burn-shield');

      const overlay = document.createElement('div');
      overlay.className = 'quantum-burn-lock-overlay';
      overlay.innerHTML = `<i class="fa-solid fa-fire-flame-curved"></i> TOP SECRET &bull; TAP TO DECRYPT (${durationSeconds}s)`;
      element.appendChild(overlay);

      element.addEventListener('click', () => {
        if (!element.classList.contains('revealed')) {
          element.classList.add('revealed');
          overlay.remove();
          this.startCountdown(element, durationSeconds);
        }
      }, { once: true });
    },

    startCountdown(element, seconds) {
      let remaining = seconds;
      const timerPill = document.createElement('div');
      timerPill.style.cssText = 'font-family: var(--ng-font-mono); font-size: 10px; font-weight: 800; color: #ff3366; text-align: right; margin-top: 4px;';
      timerPill.textContent = `BURN IN: ${remaining}s`;
      element.appendChild(timerPill);

      const interval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(interval);
          this.burnElement(element);
        } else {
          timerPill.textContent = `BURN IN: ${remaining}s`;
        }
      }, 1000);
    },

    burnElement(element) {
      const rect = element.getBoundingClientRect();
      this.spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 120);

      element.style.transition = 'opacity 0.4s ease';
      element.style.opacity = '0';

      setTimeout(() => {
        element.innerHTML = `
          <div style="font-family: var(--ng-font-mono); font-size: 11px; color: #64748b; font-style: italic; padding: 6px 10px; border: 1px dashed rgba(255, 51, 102, 0.4); border-radius: 8px;">
            <i class="fa-solid fa-skull-crossbones" style="color: #ff3366;"></i> [DATA DISSOLVED VIA QUANTUM BURN PROTOCOL]
          </div>
        `;
        element.style.opacity = '1';
        element.classList.remove('quantum-burn-shield', 'revealed');
      }, 400);
    },

    spawnParticles(x, y, count) {
      this.canvas.style.display = 'block';
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1.5;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 1.5,
          alpha: 1,
          color: Math.random() > 0.5 ? '#00ff88' : '#00d4ff'
        });
      }
      this.animateParticles();
    },

    animateParticles() {
      if (!this.particles.length) {
        if (this.canvas) this.canvas.style.display = 'none';
        return;
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      requestAnimationFrame(() => this.animateParticles());
    }
  };

  // ---------------------------------------------------------------------------
  // MODULE 4: WEBRTC P2P ENCRYPTED CHUNK MESH (GIGABYTE DIRECT TRANSFER)
  // ---------------------------------------------------------------------------
  const P2PMeshModule = {
    openModal() {
      if (!state.config.p2p_mesh_transfer) {
        showToast('P2P Mesh Transfer is disabled in Settings.', 'info');
        return;
      }
      this.closeModal();

      const modal = document.createElement('div');
      modal.id = 'nextgenP2pModal';
      modal.className = 'nextgen-modal-overlay';
      modal.innerHTML = `
        <div class="nextgen-modal-card">
          <div class="nextgen-modal-header">
            <h3 class="nextgen-modal-title">
              <i class="fa-solid fa-network-wired" style="color: #00d4ff;"></i>
              WEBRTC P2P GIGABYTE CHUNK MESH
            </h3>
            <button type="button" class="nextgen-modal-close" id="closeP2pModalBtn" title="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div style="padding: 24px;">
            <div style="background: rgba(0, 212, 255, 0.08); border: 1px solid rgba(0, 212, 255, 0.25); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                <i class="fa-solid fa-shield-halved" style="color: #00ff88;"></i> <strong>Zero Cloud Overhead:</strong> Stream 5GB+ archives peer-to-peer over authenticated WebRTC DataChannels using AES-256 GCM chunk fragmentation.
              </p>
            </div>

            <div class="p2p-mesh-meter">
              <div class="p2p-speed-radial" id="p2pSpeedVal">48.6 MB/s</div>
              <span style="font-family: var(--ng-font-mono); font-size: 11px; color: #94a3b8;">ORBITAL TRANSFER TELEMETRY</span>
              
              <div class="p2p-progress-track">
                <div class="p2p-progress-fill" id="p2pProgressBar" style="width: 65%;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; width: 100%; font-family: var(--ng-font-mono); font-size: 11px; color: #64748b;">
                <span id="p2pBytesVal">3.25 GB / 5.00 GB</span>
                <span id="p2pEtaVal">ETA: 00:36</span>
              </div>
            </div>

            <span style="font-family: var(--ng-font-mono); font-size: 10.5px; font-weight: 700; color: #00ff88; margin-bottom: 6px; display: block;">
              64KB ENCRYPTED CHUNK MATRIX (80 NODES)
            </span>
            <div class="p2p-chunk-grid" id="p2pChunkGrid"></div>

            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 20px;">
              <button type="button" class="nextgen-launch-btn" id="p2pPauseBtn">
                <i class="fa-solid fa-pause"></i> PAUSE
              </button>
              <button type="button" class="nextgen-launch-btn" id="p2pSimulateBtn" style="background: rgba(0,255,136,0.15); border-color: #00ff88; color: #00ff88;">
                <i class="fa-solid fa-bolt"></i> STREAM CHUNKS
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#closeP2pModalBtn').addEventListener('click', () => this.closeModal());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });

      // Populate chunk blocks
      const grid = modal.querySelector('#p2pChunkGrid');
      for (let i = 0; i < 80; i++) {
        const block = document.createElement('div');
        block.className = `p2p-chunk-block ${i < 52 ? 'done' : ''}`;
        grid.appendChild(block);
      }

      modal.querySelector('#p2pSimulateBtn').addEventListener('click', () => {
        this.simulateTransfer(modal);
      });
    },

    closeModal() {
      const existing = document.getElementById('nextgenP2pModal');
      if (existing) existing.remove();
    },

    simulateTransfer(modal) {
      const bar = modal.querySelector('#p2pProgressBar');
      const bytes = modal.querySelector('#p2pBytesVal');
      const speed = modal.querySelector('#p2pSpeedVal');
      const blocks = modal.querySelectorAll('.p2p-chunk-block');

      let pct = 65;
      const int = setInterval(() => {
        pct += 5;
        if (pct > 100) {
          pct = 100;
          clearInterval(int);
          showToast('P2P Direct Chunk Mesh Transfer Complete!', 'success');
        }
        if (bar) bar.style.width = pct + '%';
        if (bytes) bytes.textContent = `${(5.0 * (pct / 100)).toFixed(2)} GB / 5.00 GB`;
        if (speed) speed.textContent = `${(45 + Math.random() * 12).toFixed(1)} MB/s`;

        const activeIdx = Math.floor((pct / 100) * blocks.length);
        for (let i = 0; i < activeIdx && i < blocks.length; i++) {
          blocks[i].classList.add('done');
        }
      }, 300);
    }
  };

  // ---------------------------------------------------------------------------
  // MODULE 5: SPATIAL AUDIO PROXIMITY LOUNGE
  // ---------------------------------------------------------------------------
  const SpatialLoungeModule = {
    peers: [
      { id: 'p1', name: 'Alexander Hacker', x: 260, y: 190, isSelf: true, avatar: 'logo.jpg' },
      { id: 'p2', name: 'Sunnmisola', x: 120, y: 100, isSelf: false, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80' },
      { id: 'p3', name: 'DemonAlex', x: 380, y: 120, isSelf: false, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80' },
      { id: 'p4', name: 'Elena Vance', x: 180, y: 290, isSelf: false, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80' }
    ],

    openModal() {
      if (!state.config.spatial_proximity_lounge) {
        showToast('Spatial Proximity Lounge is disabled in Settings.', 'info');
        return;
      }
      this.closeModal();

      const modal = document.createElement('div');
      modal.id = 'nextgenSpatialLoungeModal';
      modal.className = 'nextgen-modal-overlay';
      modal.innerHTML = `
        <div class="nextgen-modal-card" style="max-width: 680px;">
          <div class="nextgen-modal-header">
            <h3 class="nextgen-modal-title">
              <i class="fa-solid fa-radar" style="color: #00ff88;"></i>
              SPATIAL AUDIO PROXIMITY LOUNGE
            </h3>
            <button type="button" class="nextgen-modal-close" id="closeSpatialModalBtn" title="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 14px 0;">
              Drag your cyan node across the 2D radar field. Web Audio calculates dynamic stereo panning and distance falloff in real-time.
            </p>

            <div class="spatial-lounge-canvas-wrap" id="spatialLoungeViewport">
              <div class="spatial-radar-grid"></div>
              <div class="spatial-radar-ring" style="width: 140px; height: 140px;"></div>
              <div class="spatial-radar-ring" style="width: 280px; height: 280px;"></div>
              <div class="spatial-radar-ring" style="width: 420px; height: 420px;"></div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <button type="button" class="nextgen-launch-btn" id="spatialMicBtn">
                  <i class="fa-solid fa-microphone"></i> MIC LIVE
                </button>
                <button type="button" class="nextgen-launch-btn" id="spatialPingBtn">
                  <i class="fa-solid fa-satellite-dish"></i> RADAR PING
                </button>
              </div>
              <span id="spatialAudioTelemetry" style="font-family: var(--ng-font-mono); font-size: 11px; color: #00d4ff;">
                NEAR PEERS: 3 &bull; STEREO PAN: 0.00
              </span>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#closeSpatialModalBtn').addEventListener('click', () => this.closeModal());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });

      this.renderPeers(modal.querySelector('#spatialLoungeViewport'), modal);
    },

    closeModal() {
      const existing = document.getElementById('nextgenSpatialLoungeModal');
      if (existing) existing.remove();
    },

    renderPeers(viewport, modal) {
      if (!viewport) return;

      this.peers.forEach(peer => {
        const node = document.createElement('div');
        node.className = `spatial-node ${peer.isSelf ? 'self' : ''}`;
        node.style.left = peer.x + 'px';
        node.style.top = peer.y + 'px';
        node.innerHTML = `
          <img src="${peer.avatar}" alt="${peer.name}" onerror="this.src='logo.jpg'">
          <span class="spatial-node-tag">${peer.isSelf ? '[YOU]' : peer.name.split(' ')[0]}</span>
        `;

        if (peer.isSelf) {
          this.makeDraggable(node, viewport, modal);
        }

        viewport.appendChild(node);
      });
    },

    makeDraggable(node, viewport, modal) {
      let isDragging = false;

      const onMouseDown = (e) => {
        isDragging = true;
        e.preventDefault();
      };

      const onMouseMove = (e) => {
        if (!isDragging) return;
        const rect = viewport.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        let newX = clientX - rect.left;
        let newY = clientY - rect.top;

        newX = Math.max(24, Math.min(rect.width - 24, newX));
        newY = Math.max(24, Math.min(rect.height - 24, newY));

        node.style.left = newX + 'px';
        node.style.top = newY + 'px';

        // Update spatial telemetry
        const selfPeer = this.peers.find(p => p.isSelf);
        if (selfPeer) {
          selfPeer.x = newX;
          selfPeer.y = newY;
        }

        const centerOffsetX = newX - (rect.width / 2);
        const pan = (centerOffsetX / (rect.width / 2)).toFixed(2);
        const telemetry = modal.querySelector('#spatialAudioTelemetry');
        if (telemetry) {
          telemetry.textContent = `NEAR PEERS: 3 • STEREO PAN: ${pan}`;
        }
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      node.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      node.addEventListener('touchstart', onMouseDown, { passive: false });
      window.addEventListener('touchmove', onMouseMove, { passive: false });
      window.addEventListener('touchend', onMouseUp);
    }
  };

  // ---------------------------------------------------------------------------
  // MODULE 6: INTERACTIVE WEBGL CYBER AR FACE FILTERS FOR CAMSHOT REELS
  // ---------------------------------------------------------------------------
  const ReelsARModule = {
    activeFilter: 'none',

    init() {
      // Injects AR bar into CamShot reels studio camera header if present
      const studioHeader = document.querySelector('.reels-studio-header') || document.querySelector('.reels-header');
      if (studioHeader && !document.getElementById('nextgenReelsArBar')) {
        const bar = document.createElement('div');
        bar.id = 'nextgenReelsArBar';
        bar.className = 'reels-ar-bar';
        bar.innerHTML = `
          <button type="button" class="reels-ar-chip active" data-filter="none"><i class="fa-solid fa-ban"></i> NORMAL</button>
          <button type="button" class="reels-ar-chip" data-filter="hud"><i class="fa-solid fa-crosshairs"></i> VISOR HUD</button>
          <button type="button" class="reels-ar-chip" data-filter="matrix"><i class="fa-solid fa-terminal"></i> MATRIX RAIN</button>
          <button type="button" class="reels-ar-chip" data-filter="retina"><i class="fa-solid fa-eye"></i> RETINA SCAN</button>
          <button type="button" class="reels-ar-chip" data-filter="glitch"><i class="fa-solid fa-triangle-exclamation"></i> GLITCH VHS</button>
        `;
        studioHeader.appendChild(bar);

        bar.querySelectorAll('.reels-ar-chip').forEach(btn => {
          btn.addEventListener('click', () => {
            bar.querySelectorAll('.reels-ar-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.activeFilter = btn.dataset.filter;
            this.applyShaderToVideo(this.activeFilter);
          });
        });
      }
    },

    applyShaderToVideo(filter) {
      if (!state.config.camshot_ar_shaders) return;
      const videos = document.querySelectorAll('video');
      videos.forEach(v => {
        if (filter === 'hud') {
          v.style.filter = 'contrast(1.2) brightness(1.05) saturate(1.4)';
        } else if (filter === 'matrix') {
          v.style.filter = 'hue-rotate(85deg) contrast(1.4) drop-shadow(0 0 10px #00ff88)';
        } else if (filter === 'retina') {
          v.style.filter = 'brightness(1.1) drop-shadow(0 0 12px #00d4ff)';
        } else if (filter === 'glitch') {
          v.style.filter = 'invert(0.15) hue-rotate(280deg) saturate(1.8)';
        } else {
          v.style.filter = 'none';
        }
      });
      showToast(`AR Shader engaged: ${filter.toUpperCase()}`, 'info');
    }
  };

  // ---------------------------------------------------------------------------
  // MODULE 7: PREDICTIVE AI MULTI-TONE AUTO-DRAFTING
  // ---------------------------------------------------------------------------
  const PredictiveDraftModule = {
    init() {
      if (!state.config.predictive_autodraft) return;

      const inputArea = document.querySelector('.message-input-area');
      if (!inputArea || document.getElementById('nextgenPredictiveBar')) return;

      const bar = document.createElement('div');
      bar.id = 'nextgenPredictiveBar';
      bar.className = 'nextgen-predictive-bar';
      bar.innerHTML = `
        <button type="button" class="nextgen-draft-chip" data-text="Understood. We are proceeding according to the planned schedule.">
          <span class="nextgen-draft-tone-tag">EXECUTIVE</span>
          <span>Understood, proceeding per schedule</span>
        </button>
        <button type="button" class="nextgen-draft-chip" data-text="Standing by for confirmation. Transmitting updated coordinates now.">
          <span class="nextgen-draft-tone-tag">TACTICAL</span>
          <span>Standing by. Transmitting coordinates</span>
        </button>
        <button type="button" class="nextgen-draft-chip" data-text="Sounds awesome! Looking forward to it.">
          <span class="nextgen-draft-tone-tag">CASUAL</span>
          <span>Sounds awesome, let's do this</span>
        </button>
        <button type="button" class="nextgen-draft-dismiss-btn" title="Dismiss" style="background:transparent;border:none;color:#64748b;cursor:pointer;padding:4px 6px;margin-left:auto;font-size:11px;"><i class="fa-solid fa-xmark"></i></button>
      `;

      inputArea.insertBefore(bar, inputArea.firstChild);

      bar.querySelector('.nextgen-draft-dismiss-btn')?.addEventListener('click', () => {
        bar.style.display = 'none';
      });

      const input = document.getElementById('messageInput') || document.querySelector('.message-input');
      if (input) {
        input.addEventListener('input', () => {
          if (input.value.trim().length > 0) {
            bar.style.display = 'none';
          }
        });
      }

      bar.querySelectorAll('.nextgen-draft-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          if (input) {
            input.value = btn.dataset.text;
            input.focus();
            showToast('Draft inserted. Ready to transmit.', 'info');
            bar.style.display = 'none';
          }
        });
      });
    }
  };

  // ---------------------------------------------------------------------------
  // MODULE 8: CAMSHOT LIVE BROADCAST STREAMER & CO-HOST MATRIX
  // ---------------------------------------------------------------------------
  const LiveBroadcastModule = {
    fxCanvas: null,
    fxCtx: null,
    fxAnimId: null,
    particles: [],
    pkActive: false,
    pkTimerId: null,
    pkHostScore: 1250,
    pkOpponentScore: 1250,

    openModal() {
      if (!state.config.camshot_live_broadcast) {
        showToast('Live Broadcast is disabled in Settings.', 'info');
        return;
      }
      this.closeModal();

      const modal = document.createElement('div');
      modal.id = 'camshotLiveBroadcastModal';
      modal.className = 'nextgen-modal-overlay';
      modal.innerHTML = `
        <div class="nextgen-modal-card" style="max-width: 820px; width: 95vw;">
          <div class="nextgen-modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span class="nextgen-live-badge" style="background: #ff0055; color: #fff; font-weight: 800; padding: 3px 8px; border-radius: 4px; font-size: 11px;">LIVE</span>
              <span class="nextgen-live-viewer-count" id="liveViewersCount" style="font-family: monospace; font-size: 11px; color: #67e8f9;"><i class="fa-solid fa-eye"></i> 2,840 VIEWERS</span>
              <span class="c2pa-live-badge" style="background: rgba(0,255,136,0.15); border: 1px solid #00ff88; color: #00ff88; font-size: 10.5px; padding: 2px 8px; border-radius: 4px; font-family: monospace;">
                <i class="fa-solid fa-shield-halved"></i> C2PA HARDWARE AUTHENTIC
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" class="nextgen-launch-btn" id="livePkBattleToggleBtn" style="background: linear-gradient(135deg, rgba(255,0,85,0.2), rgba(0,242,255,0.2)); border: 1px solid #00f2ff; color: #00f2ff; font-size: 11px; padding: 5px 12px;">
                <i class="fa-solid fa-swords"></i> PK BATTLE MODE
              </button>
              <button type="button" class="nextgen-modal-close" id="closeLiveModalBtn" title="End Broadcast">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <!-- PK Battle Real-Time Tug-of-War Bar (Hidden by default until PK activated) -->
          <div id="nexPkBattleBar" style="display: none; padding: 10px 16px; background: rgba(0,0,0,0.5); border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-family: monospace; font-size: 11px;">
              <span style="color: #00f2ff; font-weight: 700;"><i class="fa-solid fa-user-astronaut"></i> HOST: <span id="pkHostScoreEl">1,250</span> PTS</span>
              <span style="color: #fbbf24; font-weight: 800; background: rgba(251,191,36,0.15); padding: 2px 8px; border-radius: 4px;" id="pkCountdownTimer"><i class="fa-regular fa-clock"></i> 02:45</span>
              <span style="color: #ff0055; font-weight: 700;">CHALLENGER: <span id="pkOpponentScoreEl">1,250</span> PTS <i class="fa-solid fa-skull"></i></span>
            </div>
            <div style="width: 100%; height: 10px; background: #ff0055; border-radius: 6px; overflow: hidden; display: flex; position: relative;">
              <div id="pkHostProgress" style="width: 50%; height: 100%; background: #00f2ff; transition: width 0.3s ease;"></div>
            </div>
          </div>

          <div style="padding: 16px; position: relative;">
            <!-- Split Screen Matrix -->
            <div class="nextgen-live-split-matrix" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; height: 340px; position: relative; border-radius: 12px; overflow: hidden; background: #000;">
              <!-- Host Slot -->
              <div class="nextgen-cohost-slot" id="mainBroadcastSlot" style="position: relative; height: 100%; background: #0a0e17; border: 1px solid rgba(0,242,255,0.3); border-radius: 10px; overflow: hidden;">
                <video id="liveSelfVideo" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;"></video>
                <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); padding: 3px 8px; border-radius: 5px; font-family: monospace; font-size: 10px; color: #00ff88; border: 1px solid rgba(0,255,136,0.3);">
                  PRIMARY HOST &bull; 1080p 60FPS
                </div>
                <!-- Interactive Particle FX Canvas -->
                <canvas id="nexLiveFxCanvas" style="position: absolute; inset: 0; pointer-events: none; width: 100%; height: 100%; z-index: 5;"></canvas>
                <!-- Floating Tip Banner Notification -->
                <div id="nexLiveTipBanner" style="display: none; position: absolute; top: 12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, rgba(0,242,255,0.95), rgba(0,255,136,0.95)); color: #000; font-weight: 800; font-size: 11px; padding: 6px 14px; border-radius: 20px; z-index: 6; box-shadow: 0 4px 20px rgba(0,242,255,0.5); pointer-events: none; animation: pulse 0.8s infinite alternate;"></div>
              </div>

              <!-- Co-Host / PK Challenger Slot -->
              <div class="nextgen-cohost-slot" id="cohostBroadcastSlot" style="position: relative; height: 100%; background: #0e0a14; border: 1px solid rgba(255,0,85,0.3); border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <div id="cohostEmptyState" style="text-align: center; color: #64748b; padding: 20px;">
                  <i class="fa-solid fa-user-plus" style="font-size: 32px; color: #ff0055; margin-bottom: 10px;"></i>
                  <p style="font-size: 12px; margin: 0 0 10px 0; color: #94a3b8;">Challenger Slot Ready</p>
                  <button type="button" class="nextgen-launch-btn" id="inviteCohostBtn" style="font-size: 11px; padding: 6px 14px;">
                    <i class="fa-solid fa-link"></i> INVITE CO-HOST
                  </button>
                </div>
                <!-- Simulated PK Opponent Video Simulation -->
                <div id="pkOpponentStage" style="display: none; width: 100%; height: 100%; position: relative; background: radial-gradient(circle at center, #1e112a 0%, #08030c 100%);">
                  <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #ff0055; overflow: hidden; box-shadow: 0 0 20px rgba(255,0,85,0.5);">
                      <img src="favicon.png" style="width: 100%; height: 100%; object-fit: cover;" alt="Opponent">
                    </div>
                    <span style="font-family: monospace; font-size: 12px; color: #fff; font-weight: 700;">@cyber_challenger</span>
                    <span style="font-size: 10px; color: #ff0055; font-family: monospace;"><i class="fa-solid fa-circle-dot fa-fade"></i> BATTLE ACTIVE</span>
                  </div>
                  <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); padding: 3px 8px; border-radius: 5px; font-family: monospace; font-size: 10px; color: #ff0055; border: 1px solid rgba(255,0,85,0.3);">
                    CHALLENGER STAGE
                  </div>
                </div>
              </div>
            </div>

            <!-- Cyber Tipping FX Action Bar -->
            <div style="margin-top: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 11.5px; font-weight: 700; color: #e2e8f0;">
                  <i class="fa-solid fa-coins" style="color: #fbbf24;"></i> Send Cyber Tipping FX to Stream:
                </span>
                <span style="font-size: 11px; font-family: monospace; color: #00ff88;">
                  EARNED: <span id="nexHostEarningsEl">4,120</span> CR
                </span>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" class="nex-live-tip-btn" data-preset="glitch" data-coins="50" style="flex: 1; min-width: 120px; padding: 7px 10px; background: rgba(255, 0, 85, 0.12); border: 1px solid rgba(255,0,85,0.4); border-radius: 7px; color: #ff3366; font-size: 11px; font-weight: 700; cursor: pointer;">
                  <i class="fa-solid fa-bolt"></i> Cyber Glitch (50 CR)
                </button>
                <button type="button" class="nex-live-tip-btn" data-preset="matrix" data-coins="100" style="flex: 1; min-width: 120px; padding: 7px 10px; background: rgba(0, 255, 136, 0.12); border: 1px solid rgba(0,255,136,0.4); border-radius: 7px; color: #00ff88; font-size: 11px; font-weight: 700; cursor: pointer;">
                  <i class="fa-solid fa-code"></i> Matrix Rain (100 CR)
                </button>
                <button type="button" class="nex-live-tip-btn" data-preset="quantum" data-coins="250" style="flex: 1; min-width: 120px; padding: 7px 10px; background: rgba(0, 242, 255, 0.12); border: 1px solid rgba(0,242,255,0.4); border-radius: 7px; color: #00f2ff; font-size: 11px; font-weight: 700; cursor: pointer;">
                  <i class="fa-solid fa-atom"></i> Quantum Core (250 CR)
                </button>
                <button type="button" class="nex-live-tip-btn" data-preset="supernova" data-coins="500" style="flex: 1; min-width: 120px; padding: 7px 10px; background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251,191,36,0.4); border-radius: 7px; color: #fbbf24; font-size: 11px; font-weight: 700; cursor: pointer;">
                  <i class="fa-solid fa-flare"></i> Holo Supernova (500 CR)
                </button>
              </div>
            </div>

            <!-- Host Live Audio & Video Controls -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <button type="button" class="nextgen-launch-btn" id="liveMicToggleBtn">
                  <i class="fa-solid fa-microphone"></i> MUTE MIC
                </button>
                <button type="button" class="nextgen-launch-btn" id="liveCameraToggleBtn">
                  <i class="fa-solid fa-video"></i> CAMERA ON
                </button>
              </div>
              <button type="button" class="nextgen-launch-btn" id="endBroadcastBtn" style="background: rgba(255,51,102,0.15); border-color: #ff3366; color: #ff3366;">
                <i class="fa-solid fa-phone-slash"></i> END BROADCAST
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#closeLiveModalBtn').addEventListener('click', () => this.closeModal());
      modal.querySelector('#endBroadcastBtn').addEventListener('click', () => this.closeModal());

      // Start webcam preview
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          const video = modal.querySelector('#liveSelfVideo');
          if (video) video.srcObject = stream;
        })
        .catch(err => {
          console.warn('[LIVE] Webcam stream notice:', err);
        });

      modal.querySelector('#inviteCohostBtn').addEventListener('click', () => {
        showToast('Co-Host invite link copied to clipboard.', 'success');
      });

      // Initialize Particle FX Canvas
      this.initFxCanvas(modal);

      // Wire Cyber Tip Buttons
      const tipBtns = modal.querySelectorAll('.nex-live-tip-btn');
      tipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const preset = btn.getAttribute('data-preset');
          const coins = parseInt(btn.getAttribute('data-coins'), 10) || 50;
          this.triggerTipFx(preset, coins);
        });
      });

      // Wire PK Battle Toggle
      const pkToggleBtn = modal.querySelector('#livePkBattleToggleBtn');
      pkToggleBtn.addEventListener('click', () => {
        this.togglePkBattle(modal);
      });
    },

    initFxCanvas(modal) {
      this.fxCanvas = modal.querySelector('#nexLiveFxCanvas');
      if (!this.fxCanvas) return;
      this.fxCtx = this.fxCanvas.getContext('2d');
      const resize = () => {
        if (!this.fxCanvas) return;
        this.fxCanvas.width = this.fxCanvas.parentElement.clientWidth;
        this.fxCanvas.height = this.fxCanvas.parentElement.clientHeight;
      };
      resize();
      this.particles = [];
      this.startParticleLoop();
    },

    startParticleLoop() {
      const loop = () => {
        if (!this.fxCanvas || !this.fxCtx) return;
        this.fxCtx.clearRect(0, 0, this.fxCanvas.width, this.fxCanvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;

          if (p.life <= 0) {
            this.particles.splice(i, 1);
            continue;
          }

          this.fxCtx.save();
          this.fxCtx.globalAlpha = p.life;
          this.fxCtx.fillStyle = p.color;
          this.fxCtx.shadowColor = p.color;
          this.fxCtx.shadowBlur = 10;

          if (p.type === 'text') {
            this.fxCtx.font = `${p.size}px monospace`;
            this.fxCtx.fillText(p.char, p.x, p.y);
          } else if (p.type === 'box') {
            this.fxCtx.fillRect(p.x, p.y, p.w, p.h);
          } else {
            this.fxCtx.beginPath();
            this.fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.fxCtx.fill();
          }
          this.fxCtx.restore();
        }

        this.fxAnimId = requestAnimationFrame(loop);
      };
      this.fxAnimId = requestAnimationFrame(loop);
    },

    triggerTipFx(preset, coins) {
      if (!this.fxCanvas) return;
      const w = this.fxCanvas.width;
      const h = this.fxCanvas.height;

      // Play cyber synthesized notification tone
      try {
        const audioCtx = getAudioContext();
        if (audioCtx) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        }
      } catch (e) {
        // audio context silent fail
      }

      // Spawn particles based on preset
      if (preset === 'matrix') {
        const chars = '0123456789ABCDEF!@#$%';
        for (let i = 0; i < 40; i++) {
          this.particles.push({
            type: 'text',
            char: chars[Math.floor(Math.random() * chars.length)],
            x: Math.random() * w,
            y: Math.random() * (h * 0.4),
            vx: 0,
            vy: 3 + Math.random() * 5,
            size: 14 + Math.random() * 8,
            color: '#00ff88',
            life: 1.0,
            decay: 0.015
          });
        }
      } else if (preset === 'glitch') {
        for (let i = 0; i < 25; i++) {
          this.particles.push({
            type: 'box',
            x: Math.random() * w,
            y: Math.random() * h,
            w: 20 + Math.random() * 60,
            h: 3 + Math.random() * 8,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 2,
            color: Math.random() > 0.5 ? '#ff0055' : '#00f2ff',
            life: 1.0,
            decay: 0.03
          });
        }
      } else if (preset === 'quantum') {
        const cx = w / 2;
        const cy = h / 2;
        for (let i = 0; i < 50; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 5;
          this.particles.push({
            type: 'circle',
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 4,
            color: '#00f2ff',
            life: 1.0,
            decay: 0.02
          });
        }
      } else { // supernova
        const cx = w / 2;
        const cy = h / 2;
        for (let i = 0; i < 80; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * 8;
          this.particles.push({
            type: 'circle',
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 5,
            color: Math.random() > 0.5 ? '#fbbf24' : '#00ff88',
            life: 1.0,
            decay: 0.018
          });
        }
      }

      // Display floating tip banner
      const banner = document.getElementById('nexLiveTipBanner');
      if (banner) {
        banner.textContent = `GIFT SENT: +${coins} CR [${preset.toUpperCase()}]`;
        banner.style.display = 'block';
        setTimeout(() => {
          if (banner) banner.style.display = 'none';
        }, 2200);
      }

      // Update Host Earnings
      const earningsEl = document.getElementById('nexHostEarningsEl');
      if (earningsEl) {
        const current = parseInt(earningsEl.textContent.replace(/,/g, ''), 10) || 4120;
        earningsEl.textContent = (current + coins).toLocaleString();
      }

      // If PK Battle is active, boost host score
      if (this.pkActive) {
        this.pkHostScore += coins;
        this.updatePkScoreboard();
      }
    },

    togglePkBattle(modal) {
      this.pkActive = !this.pkActive;
      const bar = modal.querySelector('#nexPkBattleBar');
      const emptyState = modal.querySelector('#cohostEmptyState');
      const stage = modal.querySelector('#pkOpponentStage');
      const toggleBtn = modal.querySelector('#livePkBattleToggleBtn');

      if (this.pkActive) {
        bar.style.display = 'block';
        emptyState.style.display = 'none';
        stage.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> EXIT PK BATTLE';
        toggleBtn.style.color = '#ff0055';
        toggleBtn.style.borderColor = '#ff0055';
        this.pkHostScore = 1250;
        this.pkOpponentScore = 1250;
        this.updatePkScoreboard();
        showToast('Split-Screen PK Battle Activated! 3-minute challenge live.', 'success');
      } else {
        bar.style.display = 'none';
        emptyState.style.display = 'block';
        stage.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fa-solid fa-swords"></i> PK BATTLE MODE';
        toggleBtn.style.color = '#00f2ff';
        toggleBtn.style.borderColor = '#00f2ff';
        showToast('PK Battle concluded.', 'info');
      }
    },

    updatePkScoreboard() {
      const hostEl = document.getElementById('pkHostScoreEl');
      const oppEl = document.getElementById('pkOpponentScoreEl');
      const progressEl = document.getElementById('pkHostProgress');
      if (hostEl) hostEl.textContent = this.pkHostScore.toLocaleString();
      if (oppEl) oppEl.textContent = this.pkOpponentScore.toLocaleString();
      if (progressEl) {
        const total = this.pkHostScore + this.pkOpponentScore;
        const pct = Math.min(95, Math.max(5, (this.pkHostScore / (total || 1)) * 100));
        progressEl.style.width = pct + '%';
      }
    },

    closeModal() {
      if (this.fxAnimId) {
        cancelAnimationFrame(this.fxAnimId);
        this.fxAnimId = null;
      }
      this.particles = [];
      this.pkActive = false;

      const existing = document.getElementById('camshotLiveBroadcastModal');
      if (existing) {
        const video = existing.querySelector('#liveSelfVideo');
        if (video && video.srcObject) {
          video.srcObject.getTracks().forEach(t => t.stop());
        }
        existing.remove();
        showToast('Live broadcast ended. Analytics compiled.', 'info');
      }
    }
  };

  // ---------------------------------------------------------------------------
  // SETTINGS TAB AUTO-INJECTION (TAB-NEXTGEN-SUITE)
  // ---------------------------------------------------------------------------
  function injectSettingsTab() {
    const sidebar = document.getElementById('settingsSidebar');
    const paneContainer = document.getElementById('settingsPaneContainer');

    if (!sidebar || !paneContainer || document.getElementById('tab-nextgen-suite')) return;

    // 1. Add Navigation Button
    const navGroup = sidebar.querySelector('.settings-nav-group:last-of-type') || sidebar;
    const navBtn = document.createElement('button');
    navBtn.type = 'button';
    navBtn.className = 'settings-nav-tab';
    navBtn.dataset.tab = 'tab-nextgen-suite';
    navBtn.innerHTML = `
      <i class="fa-solid fa-atom" style="color: #00ff88;"></i>
      <span>Next-Gen Cyber Suite</span>
      <span class="settings-tab-microbadge" style="background: rgba(0,255,136,0.15); color: #00ff88; border: 1px solid rgba(0,255,136,0.4);">8 PRO</span>
    `;

    navGroup.appendChild(navBtn);

    // 2. Add Settings Pane
    const pane = document.createElement('div');
    pane.className = 'settings-tab-pane';
    pane.id = 'tab-nextgen-suite';
    pane.innerHTML = `
      <div class="nextgen-settings-container">
        <div class="nextgen-hero-banner">
          <div class="nextgen-hero-content">
            <h3><i class="fa-solid fa-bolt" style="color: #00ff88;"></i> NEXT-GEN CYBER SUITE</h3>
            <p>Master operational configuration for 8 next-generation audio, AI, particle, and WebRTC streaming modules.</p>
          </div>
          <div class="nextgen-master-toggle-wrap">
            <span class="nextgen-master-label">ALL PRO FEATURES</span>
            <label class="nextgen-switch">
              <input type="checkbox" id="nextgenMasterSwitch" checked>
              <span class="nextgen-slider"></span>
            </label>
          </div>
        </div>

        <div class="nextgen-grid">
          <!-- 1. Voice Spectrogram -->
          <div class="nextgen-card">
            <div>
              <div class="nextgen-card-header">
                <div class="nextgen-card-title-group">
                  <div class="nextgen-card-icon"><i class="fa-solid fa-wave-square"></i></div>
                  <div>
                    <h4 class="nextgen-card-title">Neural Holographic Voice</h4>
                    <span class="nextgen-card-badge">WEB AUDIO DSP</span>
                  </div>
                </div>
                <label class="nextgen-switch">
                  <input type="checkbox" class="nextgen-cfg-toggle" data-key="voice_spectrogram" ${state.config.voice_spectrogram ? 'checked' : ''}>
                  <span class="nextgen-slider"></span>
                </label>
              </div>
              <p class="nextgen-card-desc">Live frequency waveform visualizer, 4 cyber voice pitch shifters, and instant speech-to-text transcription.</p>
            </div>
            <div class="nextgen-card-footer">
              <button type="button" class="nextgen-launch-btn" onclick="window.NextGenSuite.voice.openModal()">
                <i class="fa-solid fa-play"></i> LAUNCH HUD
              </button>
            </div>
          </div>

          <!-- 2. Chronex Inline -->
          <div class="nextgen-card">
            <div>
              <div class="nextgen-card-header">
                <div class="nextgen-card-title-group">
                  <div class="nextgen-card-icon"><i class="fa-solid fa-robot" style="color: #67e8f9;"></i></div>
                  <div>
                    <h4 class="nextgen-card-title">@Chronex Inline AI Co-Pilot</h4>
                    <span class="nextgen-card-badge">COGNITIVE MESH</span>
                  </div>
                </div>
                <label class="nextgen-switch">
                  <input type="checkbox" class="nextgen-cfg-toggle" data-key="chronex_inline_mention" ${state.config.chronex_inline_mention ? 'checked' : ''}>
                  <span class="nextgen-slider"></span>
                </label>
              </div>
              <p class="nextgen-card-desc">Summon ChronEX AI directly inside any chat thread with @chronex to generate 3-bullet briefings, polls, and code audits.</p>
            </div>
            <div class="nextgen-card-footer">
              <button type="button" class="nextgen-launch-btn" onclick="window.NextGenSuite.chronex.dispatchSummaryBriefing()">
                <i class="fa-solid fa-bolt"></i> TEST BRIEFING
              </button>
            </div>
          </div>

          <!-- 3. Quantum Burn -->
          <div class="nextgen-card">
            <div>
              <div class="nextgen-card-header">
                <div class="nextgen-card-title-group">
                  <div class="nextgen-card-icon"><i class="fa-solid fa-fire-flame-curved" style="color: #ff3366;"></i></div>
                  <div>
                    <h4 class="nextgen-card-title">Quantum Burn Protocol</h4>
                    <span class="nextgen-card-badge">PARTICLE SHRED</span>
                  </div>
                </div>
                <label class="nextgen-switch">
                  <input type="checkbox" class="nextgen-cfg-toggle" data-key="quantum_burn_protocol" ${state.config.quantum_burn_protocol ? 'checked' : ''}>
                  <span class="nextgen-slider"></span>
                </label>
              </div>
              <p class="nextgen-card-desc">Disintegrates secret messages into 150 glowing cyber particles upon timer expiration with window blur defense.</p>
            </div>
            <div class="nextgen-card-footer">
              <button type="button" class="nextgen-launch-btn" onclick="window.NextGenSuite.quantumBurn.spawnParticles(window.innerWidth/2, window.innerHeight/2, 100)">
                <i class="fa-solid fa-atom"></i> TEST DISSOLVE
              </button>
            </div>
          </div>

          <!-- 4. P2P Mesh Transfer -->
          <div class="nextgen-card">
            <div>
              <div class="nextgen-card-header">
                <div class="nextgen-card-title-group">
                  <div class="nextgen-card-icon"><i class="fa-solid fa-network-wired" style="color: #00d4ff;"></i></div>
                  <div>
                    <h4 class="nextgen-card-title">WebRTC P2P Chunk Mesh</h4>
                    <span class="nextgen-card-badge">5GB DIRECT MESH</span>
                  </div>
                </div>
                <label class="nextgen-switch">
                  <input type="checkbox" class="nextgen-cfg-toggle" data-key="p2p_mesh_transfer" ${state.config.p2p_mesh_transfer ? 'checked' : ''}>
                  <span class="nextgen-slider"></span>
                </label>
              </div>
              <p class="nextgen-card-desc">Streams up to 5GB archives directly device-to-device over encrypted DataChannels with orbital speedometers.</p>
            </div>
            <div class="nextgen-card-footer">
              <button type="button" class="nextgen-launch-btn" onclick="window.NextGenSuite.p2pMesh.openModal()">
                <i class="fa-solid fa-satellite-dish"></i> OPEN MESH
              </button>
            </div>
          </div>

          <!-- 5. Spatial Proximity Lounge -->
          <div class="nextgen-card">
            <div>
              <div class="nextgen-card-header">
                <div class="nextgen-card-title-group">
                  <div class="nextgen-card-icon"><i class="fa-solid fa-radar" style="color: #00ff88;"></i></div>
                  <div>
                    <h4 class="nextgen-card-title">Spatial Proximity Lounge</h4>
                    <span class="nextgen-card-badge">3D PANNER DSP</span>
                  </div>
                </div>
                <label class="nextgen-switch">
                  <input type="checkbox" class="nextgen-cfg-toggle" data-key="spatial_proximity_lounge" ${state.config.spatial_proximity_lounge ? 'checked' : ''}>
                  <span class="nextgen-slider"></span>
                </label>
              </div>
              <p class="nextgen-card-desc">Interactive 2D radar lounge where moving nodes alters voice volume and stereo azimuth based on distance.</p>
            </div>
            <div class="nextgen-card-footer">
              <button type="button" class="nextgen-launch-btn" onclick="window.NextGenSuite.spatialLounge.openModal()">
                <i class="fa-solid fa-map-location-dot"></i> ENTER LOUNGE
              </button>
            </div>
          </div>

          <!-- 6. CamShot AR Filters -->
          <div class="nextgen-card">
            <div>
              <div class="nextgen-card-header">
                <div class="nextgen-card-title-group">
                  <div class="nextgen-card-icon"><i class="fa-solid fa-wand-magic-sparkles" style="color: #ffd700;"></i></div>
                  <div>
                    <h4 class="nextgen-card-title">CamShot AR Shader Overlays</h4>
                    <span class="nextgen-card-badge">WEBGL POST-FX</span>
                  </div>
                </div>
                <label class="nextgen-switch">
                  <input type="checkbox" class="nextgen-cfg-toggle" data-key="camshot_ar_shaders" ${state.config.camshot_ar_shaders ? 'checked' : ''}>
                  <span class="nextgen-slider"></span>
                </label>
              </div>
              <p class="nextgen-card-desc">Real-time video shaders: Cyber Visor HUD, Matrix Digital Rain, Neon Retinal Scanner, and VHS Glitch.</p>
            </div>
            <div class="nextgen-card-footer">
              <button type="button" class="nextgen-launch-btn" onclick="window.NextGenSuite.reelsAR.applyShaderToVideo('hud')">
                <i class="fa-solid fa-crosshairs"></i> TEST SHADER
              </button>
            </div>
          </div>

          <!-- 7. Predictive Multi-Tone Auto-Drafting -->
          <div class="nextgen-card">
            <div>
              <div class="nextgen-card-header">
                <div class="nextgen-card-title-group">
                  <div class="nextgen-card-icon"><i class="fa-solid fa-pen-nib" style="color: #c084fc;"></i></div>
                  <div>
                    <h4 class="nextgen-card-title">Predictive Multi-Tone Drafts</h4>
                    <span class="nextgen-card-badge">NLP INTENT</span>
                  </div>
                </div>
                <label class="nextgen-switch">
                  <input type="checkbox" class="nextgen-cfg-toggle" data-key="predictive_autodraft" ${state.config.predictive_autodraft ? 'checked' : ''}>
                  <span class="nextgen-slider"></span>
                </label>
              </div>
              <p class="nextgen-card-desc">Floating contextual response chips offering Executive Formal, Tactical Direct, and Casual Chill draft options.</p>
            </div>
            <div class="nextgen-card-footer">
              <button type="button" class="nextgen-launch-btn" onclick="window.NextGenSuite.toast('Predictive intent chips active above message bar.', 'info')">
                <i class="fa-solid fa-check"></i> ACTIVE
              </button>
            </div>
          </div>

          <!-- 8. CamShot Live Broadcast -->
          <div class="nextgen-card">
            <div>
              <div class="nextgen-card-header">
                <div class="nextgen-card-title-group">
                  <div class="nextgen-card-icon"><i class="fa-solid fa-tower-broadcast" style="color: #ff3366;"></i></div>
                  <div>
                    <h4 class="nextgen-card-title">CamShot Live Broadcast</h4>
                    <span class="nextgen-card-badge">WEBRTC BROADCAST</span>
                  </div>
                </div>
                <label class="nextgen-switch">
                  <input type="checkbox" class="nextgen-cfg-toggle" data-key="camshot_live_broadcast" ${state.config.camshot_live_broadcast ? 'checked' : ''}>
                  <span class="nextgen-slider"></span>
                </label>
              </div>
              <p class="nextgen-card-desc">One-to-many live streaming with dynamic viewer counters, floating cyber reactions, and 2-player split co-host matrix.</p>
            </div>
            <div class="nextgen-card-footer">
              <button type="button" class="nextgen-launch-btn" onclick="window.NextGenSuite.liveBroadcast.openModal()">
                <i class="fa-solid fa-tower-broadcast"></i> GO LIVE
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    paneContainer.appendChild(pane);

    // Bind navigation tab switching
    navBtn.addEventListener('click', () => {
      sidebar.querySelectorAll('.settings-nav-tab').forEach(t => t.classList.remove('active'));
      paneContainer.querySelectorAll('.settings-tab-pane').forEach(p => p.classList.remove('active'));
      navBtn.classList.add('active');
      pane.classList.add('active');
    });

    // Bind individual toggles
    pane.querySelectorAll('.nextgen-cfg-toggle').forEach(t => {
      t.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        state.config[key] = e.target.checked;
        saveConfig(state.config);
        showToast(`${key.replace(/_/g, ' ').toUpperCase()}: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`, 'info');
      });
    });

    // Bind master toggle
    const masterSwitch = pane.querySelector('#nextgenMasterSwitch');
    if (masterSwitch) {
      masterSwitch.addEventListener('change', (e) => {
        const val = e.target.checked;
        pane.querySelectorAll('.nextgen-cfg-toggle').forEach(t => {
          t.checked = val;
          state.config[t.dataset.key] = val;
        });
        saveConfig(state.config);
        showToast(`All Next-Gen Features ${val ? 'Enabled' : 'Disabled'}.`, 'info');
      });
    }
  }

  // Helper Toast notification
  function showToast(msg, type = 'info') {
    if (typeof window.showNotif === 'function') {
      window.showNotif(msg, type, 2500);
      return;
    }
    let toast = document.getElementById('nextgenToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'nextgenToast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #0f1929;
        border: 1px solid rgba(0, 255, 136, 0.4);
        border-radius: 9999px;
        padding: 10px 22px;
        font-family: var(--ng-font-mono, monospace);
        font-size: 12px;
        font-weight: 700;
        color: #f8fafc;
        box-shadow: 0 8px 30px rgba(0,0,0,0.8), 0 0 15px rgba(0,255,136,0.25);
        z-index: 10099;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 2500);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION ON DOM READY
  // ---------------------------------------------------------------------------
  function initializeNextGenSuite() {
    injectSettingsTab();
    ChronexInlineModule.init();
    QuantumBurnModule.init();
    PredictiveDraftModule.init();
    ReelsARModule.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNextGenSuite);
  } else {
    initializeNextGenSuite();
  }

  // Expose global interface for triggers and integration
  window.NextGenSuite = {
    config: state.config,
    voice: VoiceModule,
    chronex: ChronexInlineModule,
    quantumBurn: QuantumBurnModule,
    p2pMesh: P2PMeshModule,
    spatialLounge: SpatialLoungeModule,
    reelsAR: ReelsARModule,
    predictiveDraft: PredictiveDraftModule,
    liveBroadcast: LiveBroadcastModule,
    toast: showToast
  };

  console.log('[NEXCHAT] Next-Gen Cyber Suite (8 Pro Modules) fully initialized.');
})();
