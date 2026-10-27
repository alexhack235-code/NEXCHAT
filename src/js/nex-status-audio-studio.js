/**
 * =============================================================================
 * NEXCHAT - Status Voice Waveform & Ephemeral Audio Studio (NEX-STATUS-AUDIO)
 * =============================================================================
 * Capabilities:
 * 1. Voice Status Recording Studio: 2-min capture with live canvas visualizer feedback.
 * 2. Web Audio DSP Playback: Interactive waveform scrubber with frequency peaks,
 *    live spectrum reaction, time countdown, +3dB speech presence filter, and scrub seeking.
 * 3. Decoupled module with zero external dependencies; couples cleanly into status-elite-suite.
 * 
 * STRICTLY 0 UNICODE EMOJIS: Pure FontAwesome 6 vector icons and cyberpunk styling only.
 * PURE CRLF LINE ENDINGS. ES2022 COMPLIANT.
 * =============================================================================
 */

(function () {
  'use strict';

  const MAX_RECORDING_SECONDS = 120;
  const SAMPLE_RATE = 48000;

  class NexStatusAudioStudioEngine {
    constructor() {
      // Audio Context & Hardware Nodes
      this.audioCtx = null;
      this.dspConnected = false;
      this.persistentAudioEl = null;
      this.analyser = null;
      this.gainNode = null;
      this.presenceFilter = null;
      this.sourceNode = null;

      // Studio Recording State
      this.mediaRecorder = null;
      this.activeMicStream = null;
      this.recordedChunks = [];
      this.recordedBlob = null;
      this.recordedUrl = null;
      this.recordingTimerInterval = null;
      this.recordingDuration = 0;
      this.recordingState = 'idle'; // 'idle' | 'recording' | 'preview'

      // Studio Live Recording Visualizer
      this.recordCanvas = null;
      this.recordCtx = null;
      this.recordAnimFrameId = null;
      this.recordAnalyser = null;
      this.recordDataArray = null;

      // Viewer Playback & Scrubber State
      this.viewerCanvas = null;
      this.viewerCtx = null;
      this.viewerAnimFrameId = null;
      this.viewerDataArray = null;
      this.playbackState = 'paused'; // 'playing' | 'paused'
      this.onEndedCallback = null;
      this.waveformPeaks = []; // Static pre-computed peaks for scrubbing track

      // Pre-cached rendering assets (eliminates per-frame heap churn)
      this.cachedRecordGradient = null;
      this.cachedViewerGradient = null;
      this.cachedScrubberFill = null;

      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    /**
     * Initializes shared 48kHz Web Audio Context
     */
    ensureAudioContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          try {
            this.audioCtx = new AudioContextClass({
              sampleRate: SAMPLE_RATE,
              latencyHint: 'interactive'
            });
          } catch (_) {
            this.audioCtx = new AudioContextClass();
          }
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    }

    // =========================================================================
    // 1. VOICE STATUS RECORDING STUDIO (2-Minute Ephemeral Capture)
    // =========================================================================
    bindRecordingStudio(containerEl = null) {
      const container = containerEl || document.getElementById('statusTabAudioPane');
      if (!container) return;

      // Inject elite recording studio DOM if not already present
      if (!document.getElementById('nexStatusAudioStudioWrap')) {
        const studioHtml = `
          <div id="nexStatusAudioStudioWrap" class="nex-audio-studio-wrap">
            <!-- Recording & Waveform Card -->
            <div class="nex-audio-studio-card">
              <div class="nex-audio-studio-header">
                <span class="studio-badge"><i class="fa-solid fa-microphone-lines"></i> 2-MIN VOICE STUDIO</span>
                <span id="nexAudioStudioTimer" class="studio-timer-pill">0:00 / 2:00</span>
              </div>

              <!-- Live Waveform Visualizer Canvas during recording & preview -->
              <div class="studio-canvas-container">
                <canvas id="nexStatusRecordCanvas" class="studio-waveform-canvas" width="340" height="72"></canvas>
                <div id="nexStudioLiveBeacon" class="studio-live-beacon" style="display: none;">
                  <span class="pulse-dot"></span>
                  <span class="beacon-text">REC LIVE</span>
                </div>
              </div>

              <!-- Studio Action Controls -->
              <div class="studio-controls-row">
                <!-- Discard / Reset Button (Preview state only) -->
                <button type="button" id="nexAudioStudioDiscardBtn" class="studio-circle-btn danger" style="display: none;" title="Discard & Record Again">
                  <i class="fa-solid fa-trash-can"></i>
                </button>

                <!-- Primary Master Action Button: Record -> Stop -> Play/Pause Preview -->
                <button type="button" id="nexAudioStudioMasterBtn" class="studio-master-btn" title="Start Recording">
                  <i class="fa-solid fa-microphone"></i>
                </button>

                <!-- Preview Seek / Re-audition Button (Preview state only) -->
                <button type="button" id="nexAudioStudioPreviewBtn" class="studio-circle-btn primary" style="display: none;" title="Audition Preview">
                  <i class="fa-solid fa-play"></i>
                </button>
              </div>

              <div id="nexAudioStudioHint" class="studio-hint-text">
                Tap microphone to begin 2-minute tactical voice broadcast
              </div>
            </div>
          </div>
        `;

        const existingBox = container.querySelector('.status-voice-recorder-box');
        if (existingBox) {
          existingBox.style.display = 'none';
          existingBox.insertAdjacentHTML('afterend', studioHtml);
        } else {
          container.insertAdjacentHTML('afterbegin', studioHtml);
        }
      }

      this.recordCanvas = document.getElementById('nexStatusRecordCanvas');
      if (this.recordCanvas) this.recordCtx = this.recordCanvas.getContext('2d');

      const masterBtn = document.getElementById('nexAudioStudioMasterBtn');
      const discardBtn = document.getElementById('nexAudioStudioDiscardBtn');
      const previewBtn = document.getElementById('nexAudioStudioPreviewBtn');

      if (masterBtn && masterBtn.dataset.studioBound !== 'true') {
        masterBtn.dataset.studioBound = 'true';
        masterBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleMasterStudioClick();
        });
      }

      if (discardBtn && discardBtn.dataset.studioBound !== 'true') {
        discardBtn.dataset.studioBound = 'true';
        discardBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.clearRecording();
        });
      }

      if (previewBtn && previewBtn.dataset.studioBound !== 'true') {
        previewBtn.dataset.studioBound = 'true';
        previewBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.togglePreviewAudition();
        });
      }
    }

    async handleMasterStudioClick() {
      if (this.recordingState === 'idle') {
        await this.startRecording();
      } else if (this.recordingState === 'recording') {
        this.stopRecording();
      } else if (this.recordingState === 'preview') {
        this.togglePreviewAudition();
      }
    }

    /**
     * Engages microphone hardware, Web Audio DSP analyser, and live visualizer loop
     */
    async startRecording() {
      this.ensureAudioContext();
      this.clearRecording();

      try {
        this.activeMicStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: SAMPLE_RATE
          }
        });

        // Set up real-time live analyser node for recording visualizer
        this.recordAnalyser = this.audioCtx.createAnalyser();
        this.recordAnalyser.fftSize = 128;
        this.recordAnalyser.smoothingTimeConstant = 0.82;
        const micSource = this.audioCtx.createMediaStreamSource(this.activeMicStream);
        micSource.connect(this.recordAnalyser);
        // NOTE: Never connect micSource to audioCtx.destination (prevents acoustic howl)

        const bufferLength = this.recordAnalyser.frequencyBinCount;
        this.recordDataArray = new Uint8Array(bufferLength);

        // MediaRecorder setup (prefers WebM Opus, falls back to default)
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');

        this.mediaRecorder = mimeType
          ? new MediaRecorder(this.activeMicStream, { mimeType })
          : new MediaRecorder(this.activeMicStream);

        this.recordedChunks = [];
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) this.recordedChunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
          this.handleRecordingComplete();
        };

        this.mediaRecorder.start(100); // 100ms slice for low-latency chunks
        this.recordingState = 'recording';
        this.updateStudioUI();

        // 2-Minute Countdown Timer
        this.recordingDuration = 0;
        clearInterval(this.recordingTimerInterval);
        this.recordingTimerInterval = setInterval(() => {
          this.recordingDuration++;
          const timerEl = document.getElementById('nexAudioStudioTimer');
          if (timerEl) {
            timerEl.textContent = `${this.formatTime(this.recordingDuration)} / 0:30`;
          }

          if (this.recordingDuration >= MAX_RECORDING_SECONDS) {
            this.stopRecording();
          }
        }, 1000);

        this.startLiveRecordingVisualizer();

      } catch (err) {
        console.error('[STATUS AUDIO STUDIO] Mic capture error:', err);
        this.clearRecording();
        if (window.showNotif) {
          window.showNotif('Microphone access denied: ' + (err.message || 'Permission blocked'), 'error');
        }
      }
    }

    stopRecording() {
      clearInterval(this.recordingTimerInterval);
      if (this.recordAnimFrameId) {
        cancelAnimationFrame(this.recordAnimFrameId);
        this.recordAnimFrameId = null;
      }
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
      this.stopHardwareMicTracks();
    }

    stopHardwareMicTracks() {
      if (this.activeMicStream) {
        this.activeMicStream.getTracks().forEach(track => {
          try { track.stop(); } catch (_) {}
        });
        this.activeMicStream = null;
      }
    }

    handleRecordingComplete() {
      const mime = this.mediaRecorder?.mimeType || 'audio/webm';
      this.recordedBlob = new Blob(this.recordedChunks, { type: mime });
      if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl);
      this.recordedUrl = URL.createObjectURL(this.recordedBlob);

      this.recordingState = 'preview';
      this.updateStudioUI();
      this.generateWaveformPeaksFromBlob(this.recordedBlob);

      if (window.showNotif) {
        window.showNotif('Voice story captured! Tap play to audition or transmit below.', 'success', 2500);
      }
    }

    /**
     * Real-Time Waveform Visualizer Loop during live microphone recording
     */
    startLiveRecordingVisualizer() {
      if (!this.recordCanvas || !this.recordCtx || !this.recordAnalyser) return;

      const canvas = this.recordCanvas;
      const ctx = this.recordCtx;
      const bufferLength = this.recordAnalyser.frequencyBinCount;
      const dataArray = this.recordDataArray;
      const barCount = 28;

      let lastTime = 0;
      const targetInterval = 1000 / 35; // Throttled to 35 FPS for battery savings

      const draw = (now) => {
        if (this.recordingState !== 'recording' || !canvas.isConnected) {
          this.recordAnimFrameId = null;
          return;
        }

        this.recordAnimFrameId = requestAnimationFrame(draw);

        if (now - lastTime < targetInterval) return;
        lastTime = now;

        this.recordAnalyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Pre-cache emerald-cyan gradient
        if (!this.cachedRecordGradient) {
          this.cachedRecordGradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          this.cachedRecordGradient.addColorStop(0, '#00ff88');
          this.cachedRecordGradient.addColorStop(1, '#00f2fe');
        }

        ctx.fillStyle = this.cachedRecordGradient;
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(0, 255, 136, 0.4)';

        const barWidth = Math.floor(canvas.width / barCount) - 3;
        let x = 2;

        for (let i = 0; i < barCount; i++) {
          const binIndex = Math.floor((i / barCount) * (bufferLength * 0.7));
          const amplitude = dataArray[binIndex] || 0;
          const barHeight = Math.max(4, (amplitude / 255) * (canvas.height - 8));
          const y = canvas.height - barHeight;

          ctx.fillRect(x, y, barWidth, barHeight);
          x += barWidth + 3;
        }
      };

      if (this.recordAnimFrameId) cancelAnimationFrame(this.recordAnimFrameId);
      this.recordAnimFrameId = requestAnimationFrame(draw);
    }

    /**
     * Audition preview playback in recording studio
     */
    togglePreviewAudition() {
      if (!this.recordedUrl) return;

      if (!this.previewAudioEl) {
        this.previewAudioEl = new Audio(this.recordedUrl);
        this.previewAudioEl.onended = () => {
          this.updateStudioUI();
          this.renderStaticWaveformOnCanvas(this.recordCanvas, this.recordCtx, this.waveformPeaks, 0);
        };
        this.previewAudioEl.ontimeupdate = () => {
          if (this.previewAudioEl.duration > 0) {
            const pct = this.previewAudioEl.currentTime / this.previewAudioEl.duration;
            this.renderStaticWaveformOnCanvas(this.recordCanvas, this.recordCtx, this.waveformPeaks, pct);
            const timerEl = document.getElementById('nexAudioStudioTimer');
            if (timerEl) {
              timerEl.textContent = `${this.formatTime(this.previewAudioEl.currentTime)} / ${this.formatTime(this.previewAudioEl.duration)}`;
            }
          }
        };
      }

      if (this.previewAudioEl.paused) {
        this.previewAudioEl.play().catch(e => console.warn('[STUDIO] Preview notice:', e));
      } else {
        this.previewAudioEl.pause();
      }
      this.updateStudioUI();
    }

    clearRecording() {
      this.stopRecording();
      if (this.previewAudioEl) {
        this.previewAudioEl.pause();
        this.previewAudioEl.src = '';
        this.previewAudioEl = null;
      }
      if (this.recordedUrl) {
        URL.revokeObjectURL(this.recordedUrl);
        this.recordedUrl = null;
      }
      this.recordedBlob = null;
      this.recordedChunks = [];
      this.recordingDuration = 0;
      this.waveformPeaks = [];
      this.recordingState = 'idle';

      if (this.recordCanvas && this.recordCtx) {
        this.recordCtx.clearRect(0, 0, this.recordCanvas.width, this.recordCanvas.height);
      }
      this.updateStudioUI();
    }

    updateStudioUI() {
      const masterBtn = document.getElementById('nexAudioStudioMasterBtn');
      const discardBtn = document.getElementById('nexAudioStudioDiscardBtn');
      const previewBtn = document.getElementById('nexAudioStudioPreviewBtn');
      const timerEl = document.getElementById('nexAudioStudioTimer');
      const hintEl = document.getElementById('nexAudioStudioHint');
      const liveBeacon = document.getElementById('nexStudioLiveBeacon');

      if (this.recordingState === 'idle') {
        if (masterBtn) {
          masterBtn.className = 'studio-master-btn';
          masterBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
          masterBtn.title = 'Start Recording';
        }
        if (discardBtn) discardBtn.style.display = 'none';
        if (previewBtn) previewBtn.style.display = 'none';
        if (liveBeacon) liveBeacon.style.display = 'none';
        if (timerEl) timerEl.textContent = '0:00 / 2:00';
        if (hintEl) hintEl.textContent = 'Tap microphone to begin 2-minute tactical voice broadcast';

      } else if (this.recordingState === 'recording') {
        if (masterBtn) {
          masterBtn.className = 'studio-master-btn recording';
          masterBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
          masterBtn.title = 'Stop Recording';
        }
        if (discardBtn) discardBtn.style.display = 'none';
        if (previewBtn) previewBtn.style.display = 'none';
        if (liveBeacon) liveBeacon.style.display = 'flex';
        if (hintEl) hintEl.textContent = 'Recording live telemetry... (2m maximum limit)';

      } else if (this.recordingState === 'preview') {
        const isPlaying = this.previewAudioEl && !this.previewAudioEl.paused;
        if (masterBtn) {
          masterBtn.className = isPlaying ? 'studio-master-btn preview playing' : 'studio-master-btn preview';
          masterBtn.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
          masterBtn.title = isPlaying ? 'Pause Audition' : 'Play Audition';
        }
        if (discardBtn) discardBtn.style.display = 'flex';
        if (previewBtn) previewBtn.style.display = 'none';
        if (liveBeacon) liveBeacon.style.display = 'none';
        if (hintEl) hintEl.textContent = 'Voice story ready. Tap play to audition or transmit below.';
      }
    }

    getRecordedAudioData() {
      return {
        blob: this.recordedBlob,
        url: this.recordedUrl,
        duration: this.recordingDuration,
        peaks: this.waveformPeaks
      };
    }

    // =========================================================================
    // 2. WEB AUDIO DSP PLAYBACK & INTERACTIVE SCRUBBER WAVEFORM (Story Viewer)
    // =========================================================================
    /**
     * Initializes and connects Web Audio DSP hardware chain for high-fidelity playback
     */
    setupViewerDSPPipeline() {
      if (this.dspConnected && this.persistentAudioEl) return;
      this.ensureAudioContext();

      if (!this.persistentAudioEl) {
        this.persistentAudioEl = new Audio();
        this.persistentAudioEl.crossOrigin = 'anonymous';
      }

      try {
        if (!this.sourceNode) {
          this.sourceNode = this.audioCtx.createMediaElementSource(this.persistentAudioEl);

          // 1. Presence Filter (Biquad Peaking at 2.8kHz for speech clarity)
          this.presenceFilter = this.audioCtx.createBiquadFilter();
          this.presenceFilter.type = 'peaking';
          this.presenceFilter.frequency.setValueAtTime(2800, this.audioCtx.currentTime);
          this.presenceFilter.Q.setValueAtTime(1.2, this.audioCtx.currentTime);
          this.presenceFilter.gain.setValueAtTime(3.0, this.audioCtx.currentTime); // +3dB speech clarity boost

          // 2. Analyser Node for Real-time Spectrum Visualization
          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 128;
          this.analyser.smoothingTimeConstant = 0.82;

          // 3. Master Gain Node
          this.gainNode = this.audioCtx.createGain();
          this.gainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

          // Connect pipeline: AudioElement -> Presence Filter -> Analyser -> Gain -> Destination
          this.sourceNode.connect(this.presenceFilter);
          this.presenceFilter.connect(this.analyser);
          this.analyser.connect(this.gainNode);
          this.gainNode.connect(this.audioCtx.destination);

          const bufferLength = this.analyser.frequencyBinCount;
          this.viewerDataArray = new Uint8Array(bufferLength);
          this.dspConnected = true;
        }
      } catch (dspErr) {
        console.warn('[STATUS DSP] Pipeline connection notice:', dspErr);
      }
    }

    /**
     * Plays voice story slide with animated waveform scrubber, time countdown, and interactive seek
     */
    playVoiceSlide(audioUrl, canvasEl = null, timerEl = null, onEndCallback = null) {
      this.stopPlayback();
      if (!audioUrl) return;

      this.setupViewerDSPPipeline();
      const audio = this.persistentAudioEl;
      this.viewerCanvas = canvasEl || document.getElementById('statusAudioSpectrumCanvas');
      if (this.viewerCanvas) this.viewerCtx = this.viewerCanvas.getContext('2d');
      this.onEndedCallback = onEndCallback;

      // Bind interactive click-to-scrub seeking on waveform canvas
      this.bindWaveformScrubberClick(this.viewerCanvas);

      audio.src = audioUrl;
      audio.load();

      audio.ontimeupdate = () => {
        if (!isNaN(audio.duration) && audio.duration > 0) {
          const curTime = audio.currentTime;
          const totalTime = audio.duration;
          const remainingTime = Math.max(0, totalTime - curTime);

          const timer = timerEl || document.getElementById('statusViewerAudioTimer');
          if (timer) {
            timer.innerHTML = `${this.formatTime(curTime)} / ${this.formatTime(totalTime)} <span class="countdown-badge">-${this.formatTime(remainingTime)}</span>`;
          }

          // Draw interactive scrubber progression
          const pct = curTime / totalTime;
          this.renderInteractiveScrubberWaveform(pct);
        }
      };

      audio.onended = () => {
        this.stopPlayback();
        if (typeof this.onEndedCallback === 'function') {
          this.onEndedCallback();
        }
      };

      audio.play().then(() => {
        this.playbackState = 'playing';
        this.updateViewerPlayButton(true);
        this.startViewerSpectrumAnimation();
      }).catch(err => {
        console.warn('[STATUS AUDIO] Playback deferred/blocked:', err);
        this.playbackState = 'paused';
        this.updateViewerPlayButton(false);
      });

      // Bind viewer play/pause control button
      const playBtn = document.getElementById('statusViewerAudioPlayBtn');
      if (playBtn && playBtn.dataset.bound !== 'true') {
        playBtn.dataset.bound = 'true';
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.togglePlayback();
        });
      }
    }

    togglePlayback() {
      if (!this.persistentAudioEl || !this.persistentAudioEl.src) return;
      if (this.persistentAudioEl.paused) {
        this.persistentAudioEl.play().then(() => {
          this.playbackState = 'playing';
          this.updateViewerPlayButton(true);
          this.startViewerSpectrumAnimation();
        }).catch(() => {});
      } else {
        this.persistentAudioEl.pause();
        this.playbackState = 'paused';
        this.updateViewerPlayButton(false);
      }
    }

    updateViewerPlayButton(isPlaying) {
      const playBtn = document.getElementById('statusViewerAudioPlayBtn');
      if (!playBtn) return;
      playBtn.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
      playBtn.title = isPlaying ? 'Pause Voice' : 'Play Voice';
    }

    /**
     * Binds mouse and touch scrubbing directly onto the waveform canvas
     */
    bindWaveformScrubberClick(canvas) {
      if (!canvas || canvas.dataset.scrubBound === 'true') return;
      canvas.dataset.scrubBound = 'true';
      canvas.style.cursor = 'pointer';

      const handleScrub = (e) => {
        if (!this.persistentAudioEl || isNaN(this.persistentAudioEl.duration)) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const seekPct = x / rect.width;
        this.persistentAudioEl.currentTime = seekPct * this.persistentAudioEl.duration;
        this.renderInteractiveScrubberWaveform(seekPct);
      };

      canvas.addEventListener('click', (e) => {
        e.stopPropagation();
        handleScrub(e);
      });
    }

    /**
     * Dual-Layer Waveform Scrubber: Renders 32 frequency peaks with progress scrub tint
     */
    renderInteractiveScrubberWaveform(progressPct = 0) {
      if (!this.viewerCanvas || !this.viewerCtx) return;
      const canvas = this.viewerCanvas;
      const ctx = this.viewerCtx;
      const w = canvas.width;
      const h = canvas.height;
      const barCount = 32;
      const barWidth = Math.floor(w / barCount) - 2;

      ctx.clearRect(0, 0, w, h);

      // Pre-compute gradients
      if (!this.cachedScrubberFill) {
        this.cachedScrubberFill = ctx.createLinearGradient(0, h, 0, 0);
        this.cachedScrubberFill.addColorStop(0, '#00ff88');
        this.cachedScrubberFill.addColorStop(1, '#00f2fe');
      }

      let x = 2;
      for (let i = 0; i < barCount; i++) {
        const peakRatio = this.waveformPeaks[i] !== undefined
          ? this.waveformPeaks[i]
          : (0.35 + Math.sin(i * 0.45) * 0.25 + Math.cos(i * 0.2) * 0.15);

        const barHeight = Math.max(4, peakRatio * (h - 8));
        const y = (h - barHeight) / 2; // Symmetrical center waveform
        const barProgress = (i / barCount);

        // Progress scrubber fill vs unplayed background bars
        if (barProgress <= progressPct) {
          ctx.fillStyle = this.cachedScrubberFill;
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(0, 255, 136, 0.4)';
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(x, y, barWidth, barHeight);
        x += barWidth + 2;
      }
    }

    /**
     * Real-time spectrum reactivity coupled with live playback
     */
    startViewerSpectrumAnimation() {
      if (!this.viewerCanvas || !this.viewerCtx || !this.analyser) return;

      const canvas = this.viewerCanvas;
      let lastTime = 0;
      const targetInterval = 1000 / 35;

      const draw = (now) => {
        if (this.playbackState !== 'playing' || !canvas.isConnected) {
          this.viewerAnimFrameId = null;
          return;
        }

        this.viewerAnimFrameId = requestAnimationFrame(draw);

        if (now - lastTime < targetInterval) return;
        lastTime = now;

        if (this.persistentAudioEl && this.persistentAudioEl.duration > 0) {
          const pct = this.persistentAudioEl.currentTime / this.persistentAudioEl.duration;
          this.renderInteractiveScrubberWaveform(pct);
        }
      };

      if (this.viewerAnimFrameId) cancelAnimationFrame(this.viewerAnimFrameId);
      this.viewerAnimFrameId = requestAnimationFrame(draw);
    }

    stopPlayback() {
      if (this.viewerAnimFrameId) {
        cancelAnimationFrame(this.viewerAnimFrameId);
        this.viewerAnimFrameId = null;
      }
      if (this.persistentAudioEl) {
        this.persistentAudioEl.pause();
        this.persistentAudioEl.removeAttribute('src');
      }
      this.playbackState = 'paused';
      this.updateViewerPlayButton(false);
    }

    // =========================================================================
    // 3. UTILITIES & PEAK ANALYSIS
    // =========================================================================
    generateWaveformPeaksFromBlob(blob) {
      if (!blob) return;
      this.waveformPeaks = [];
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result;
          this.ensureAudioContext();
          const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
          const channelData = audioBuffer.getChannelData(0);
          const barCount = 32;
          const blockSize = Math.floor(channelData.length / barCount);

          for (let i = 0; i < barCount; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
              sum += Math.abs(channelData[i * blockSize + j]);
            }
            const avg = sum / blockSize;
            this.waveformPeaks.push(Math.min(1.0, Math.max(0.15, avg * 3.2)));
          }

          // Initial paint on preview canvas
          this.renderStaticWaveformOnCanvas(this.recordCanvas, this.recordCtx, this.waveformPeaks, 0);
        } catch (_) {
          // Synthetic peak fallback for raw un-decoded streams
          for (let i = 0; i < 32; i++) {
            this.waveformPeaks.push(0.3 + Math.sin(i * 0.5) * 0.25);
          }
          this.renderStaticWaveformOnCanvas(this.recordCanvas, this.recordCtx, this.waveformPeaks, 0);
        }
      };

      reader.readAsArrayBuffer(blob);
    }

    renderStaticWaveformOnCanvas(canvas, ctx, peaks, progress = 0) {
      if (!canvas || !ctx || peaks.length === 0) return;
      const w = canvas.width;
      const h = canvas.height;
      const barCount = peaks.length;
      const barWidth = Math.floor(w / barCount) - 2;

      ctx.clearRect(0, 0, w, h);
      let x = 2;

      for (let i = 0; i < barCount; i++) {
        const peak = peaks[i];
        const barHeight = Math.max(4, peak * (h - 8));
        const y = (h - barHeight) / 2;

        ctx.fillStyle = (i / barCount) <= progress ? '#00ff88' : 'rgba(255, 255, 255, 0.22)';
        ctx.fillRect(x, y, barWidth, barHeight);
        x += barWidth + 2;
      }
    }

    formatTime(seconds) {
      if (isNaN(seconds) || seconds < 0) return '0:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    bindDOM() {
      this.bindRecordingStudio();
    }
  }

  // Global Singleton Export
  window.NexStatusAudioStudio = new NexStatusAudioStudioEngine();
})();