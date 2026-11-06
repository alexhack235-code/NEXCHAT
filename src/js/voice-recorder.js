/**
 * NEXCHAT Tactical Voice Notes & Audio Recording Controller
 * 
 * Capabilities:
 * - HTML5 MediaRecorder voice capture (WebM / Ogg / MP4)
 * - Strict user-gesture hold-to-record only (0 background / auto recording)
 * - 2-second minimum duration guard (discards accidental taps)
 * - Immediate microphone track revocation upon stop or cancel
 * - Real-time AudioContext frequency analyser driving waveform visualizer
 * - Elapsed recording timer (0:00 -> 0:01...)
 * - Instant upload & dispatch as custom waveform audio message
 * - Dual-layer fallback (Base64 Audio Data URL + Cloud Storage)
 */

(function () {
  'use strict';

  class VoiceRecorderController {
    constructor() {
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.stream = null;
      this.audioCtx = null;
      this.analyser = null;
      this.animFrameId = null;
      this.timerInterval = null;
      this.startTime = 0;
      this.durationSec = 0;
      this.isRecording = false;
      this.isStarting = false;
      this.isPressedOnMic = false;
      this.isCancelled = false;
      this.holdTimer = null;
      this.startX = 0;
      this.pointerDownTime = 0;
      this.speechRecognizer = null;
      this.speechTranscript = '';

      this.recordBtn = null;
      this.recordingUI = null;
      this.timerEl = null;
      this.waveformBars = [];
      this.cancelBtn = null;
      this.stopBtn = null;
      this.sendBtn = null;
      this.audioSendBtn = null;
      this.messageForm = null;

      this.init();
    }

    init() {
      if (typeof window !== 'undefined') {
        window.NexVoiceRecorderActive = true;
        window.VoiceRecorderController = this;
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }

      // Cleanup on page unload or navigation
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          this.cancelRecording();
        });
        window.addEventListener('pagehide', () => {
          this.cancelRecording();
        });
      }
    }

    bindDOM() {
      this.recordBtn = document.getElementById('audio-record-btn');
      this.recordingUI = document.getElementById('audioRecordingUI');
      this.timerEl = document.getElementById('audioTimer');
      this.waveformBars = Array.from(document.querySelectorAll('.audio-waveform-bars span'));
      this.cancelBtn = document.getElementById('audioCancelBtn');
      this.stopBtn = document.getElementById('audioStopBtn');
      this.sendBtn = document.getElementById('audioSendNowBtn');
      this.audioSendBtn = document.getElementById('audio-send-btn');
      this.messageForm = document.getElementById('message-form');

      if (!this.recordBtn) return;

      // Touch and pointer prevention for tactile hold-to-record
      this.recordBtn.style.userSelect = 'none';
      this.recordBtn.style.webkitUserSelect = 'none';
      this.recordBtn.style.touchAction = 'none';
      this.recordBtn.addEventListener('contextmenu', (e) => e.preventDefault());

      const handlePointerDown = (e) => {
        // Strict guard: Only left-click or touch initiates recording
        if (e.button && e.button !== 0) return;
        this.isPressedOnMic = true;
        this.isCancelled = false;
        this.pointerDownTime = Date.now();
        this.startX = (e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0)) || 0;

        if (this.holdTimer) {
          clearTimeout(this.holdTimer);
          this.holdTimer = null;
        }

        // Guard against duplicate start
        if (this.isRecording || this.isStarting) return;

        // Tactile hold threshold (250ms). Must maintain press to start.
        this.holdTimer = setTimeout(() => {
          if (this.isPressedOnMic && !this.isRecording && !this.isStarting) {
            this.startRecording();
          }
        }, 250);
      };

      const handlePointerMove = (e) => {
        // Guard: Only process slide-to-cancel if user is actively holding the mic
        if (!this.isPressedOnMic) return;
        const currentX = (e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0)) || 0;
        const deltaX = this.startX - currentX;
        // Slide left by > 50px cancels recording
        if (deltaX > 50) {
          this.isPressedOnMic = false;
          if (this.holdTimer) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
          }
          this.cancelRecording();
          if (typeof window.showNotif === 'function') {
            window.showNotif('Slide to cancel: Voice note cancelled', 'info', 1500);
          }
        }
      };

      const handlePointerUp = (e) => {
        if (this.holdTimer) {
          clearTimeout(this.holdTimer);
          this.holdTimer = null;
        }

        // STRICT GUARD: If this release event is NOT from active mic press, ignore completely!
        if (!this.isPressedOnMic) return;
        this.isPressedOnMic = false;

        // Quick tap without holding (< 250ms): show guidance and discard
        if (!this.isRecording && !this.isStarting) {
          if (typeof window.showNotif === 'function') {
            window.showNotif('Hold mic button to record voice note', 'info', 1600);
          }
          return;
        }

        // Minimum duration check: Less than 2 seconds -> discard
        const elapsedMs = Date.now() - this.startTime;
        if (elapsedMs < 2000) {
          this.cancelRecording();
          if (typeof window.showNotif === 'function') {
            window.showNotif('Voice note too short (< 2s) - discarded', 'info', 1800);
          }
          return;
        }

        // Valid voice note duration (>= 2s)
        this.stopAndSendRecording();
      };

      const handlePointerLeave = (e) => {
        // If finger glides off button before hold threshold, cancel hold
        if (this.isPressedOnMic && !this.isRecording) {
          if (this.holdTimer) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
          }
          this.isPressedOnMic = false;
        }
      };

      // Pointer events for modern touch and mouse
      if (window.PointerEvent) {
        this.recordBtn.addEventListener('pointerdown', handlePointerDown);
        this.recordBtn.addEventListener('pointerleave', handlePointerLeave);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
      } else {
        // Fallback touch and mouse events
        this.recordBtn.addEventListener('touchstart', handlePointerDown, { passive: true });
        this.recordBtn.addEventListener('mouseleave', handlePointerLeave);
        window.addEventListener('touchmove', handlePointerMove, { passive: true });
        window.addEventListener('touchend', handlePointerUp);
        window.addEventListener('touchcancel', handlePointerUp);
        this.recordBtn.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('mouseup', handlePointerUp);
      }

      this.recordBtn.addEventListener('click', (e) => {
        e.preventDefault();
      });

      // Cancel button
      if (this.cancelBtn) {
        this.cancelBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.cancelRecording();
        });
      }

      // Stop button (finishes recording & sends if duration criteria met)
      if (this.stopBtn) {
        this.stopBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.stopAndSendRecording();
        });
      }

      // Send Now button (#audioSendNowBtn)
      if (this.sendBtn) {
        this.sendBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.stopAndSendRecording();
        });
      }

      // Send Audio button (#audio-send-btn)
      if (this.audioSendBtn) {
        this.audioSendBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.stopAndSendRecording();
        });
      }
    }

    async startRecording() {
      // 1. Strict guard: never double start, never start unless mic button is actively held
      if (this.isRecording || this.isStarting) {
        console.log('[VoiceRecorder] Guard: Already recording or starting, ignoring duplicate call.');
        return;
      }
      if (!this.isPressedOnMic) {
        console.log('[VoiceRecorder] Guard: Not triggered by active mic press, ignoring.');
        return;
      }

      this.isStarting = true;
      this.isCancelled = false;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.isStarting = false;
        if (window.showNotif) window.showNotif('Microphone access requires HTTPS or a modern browser', 'error');
        return;
      }

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        // Re-check after async getUserMedia: if user released button or cancelled during prompt, abort
        if (!this.isPressedOnMic || this.isCancelled) {
          console.log('[VoiceRecorder] User released mic before stream ready. Stopping tracks immediately.');
          if (this.stream) {
            try {
              this.stream.getTracks().forEach(t => t.stop());
            } catch (_) {}
            this.stream = null;
          }
          this.isStarting = false;
          return;
        }

        // Determine best supported mimeType
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
          else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          else mimeType = '';
        }

        const options = mimeType ? { mimeType } : {};
        this.mediaRecorder = new MediaRecorder(this.stream, options);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.audioChunks.push(e.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          this.handleRecordingComplete(mimeType || 'audio/webm');
        };

        // Initialize AudioContext for waveform visualizer
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            this.audioCtx = new AudioContextClass();
            const source = this.audioCtx.createMediaStreamSource(this.stream);
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 64;
            source.connect(this.analyser);
            this.startVisualizer();
          }
        } catch (ctxErr) {
          console.warn('[VoiceRecorder] AudioContext visualizer notice:', ctxErr);
        }

        this.mediaRecorder.start(100);
        this.isRecording = true;
        this.isStarting = false;
        this.startTime = Date.now();

        // UI transitions
        if (this.messageForm) this.messageForm.style.display = 'none';
        if (this.recordingUI) this.recordingUI.style.display = 'flex';
        this.startTimer();
        this.startSpeechRecognition();

        if (navigator.vibrate) navigator.vibrate(30);
        if (window.playLuxuryPopSound) window.playLuxuryPopSound();

      } catch (err) {
        console.error('[VoiceRecorder] Mic access error:', err);
        if (this.stream) {
          try {
            this.stream.getTracks().forEach(t => t.stop());
          } catch (_) {}
          this.stream = null;
        }
        if (this.audioCtx && this.audioCtx.state !== 'closed') {
          try { this.audioCtx.close(); } catch (_) {}
          this.audioCtx = null;
        }
        this.isRecording = false;
        this.isStarting = false;
        this.isPressedOnMic = false;
        if (window.showNotif) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            window.showNotif('Microphone permission was denied. Please allow mic in browser settings.', 'error', 4000);
          } else {
            window.showNotif('Could not access microphone: ' + err.message, 'error');
          }
        }
      }
    }

    startTimer() {
      this.updateTimerDisplay(0);
      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.durationSec = elapsed;
        this.updateTimerDisplay(elapsed);

        // Auto-stop at 5 minutes safety limit
        if (elapsed >= 300) {
          this.stopAndSendRecording();
        }
      }, 1000);
    }

    updateTimerDisplay(seconds) {
      if (!this.timerEl) return;
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      this.timerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    startVisualizer() {
      if (!this.analyser || this.waveformBars.length === 0) return;
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const renderFrame = () => {
        if (!this.isRecording) return;
        this.analyser.getByteFrequencyData(dataArray);

        // Distribute frequency amplitudes across the 10 waveform bars
        const step = Math.floor(dataArray.length / this.waveformBars.length) || 1;
        this.waveformBars.forEach((bar, i) => {
          const val = dataArray[i * step] || 0;
          const scale = Math.max(0.2, (val / 255) * 1.8);
          bar.style.transform = `scaleY(${scale})`;
          bar.style.backgroundColor = val > 120 ? '#00f2fe' : '#00ff66';
        });

        this.animFrameId = requestAnimationFrame(renderFrame);
      };

      this.animFrameId = requestAnimationFrame(renderFrame);
    }

    startSpeechRecognition() {
      this.speechTranscript = '';
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) {
        return;
      }
      try {
        this.speechRecognizer = new SpeechRec();
        this.speechRecognizer.continuous = true;
        this.speechRecognizer.interimResults = true;
        this.speechRecognizer.lang = localStorage.getItem('nex_voice_input_lang') || navigator.language || 'en-US';

        this.speechRecognizer.onresult = (event) => {
          let finalStr = '';
          for (let i = 0; i < event.results.length; i++) {
            finalStr += event.results[i][0].transcript + ' ';
          }
          if (finalStr.trim()) {
            this.speechTranscript = finalStr.trim();
          }
        };
        this.speechRecognizer.onerror = (e) => {
          console.warn('[VoiceRecorder] Speech recognition notice:', e.error);
        };
        this.speechRecognizer.start();
      } catch (e) {
        console.warn('[VoiceRecorder] SpeechRecognition start warning:', e);
      }
    }

    cancelRecording() {
      this.isCancelled = true;
      this.isRecording = false;
      this.isStarting = false;
      this.isPressedOnMic = false;
      if (this.holdTimer) {
        clearTimeout(this.holdTimer);
        this.holdTimer = null;
      }

      if (this.speechRecognizer) {
        try { this.speechRecognizer.stop(); } catch (e) {}
        this.speechRecognizer = null;
      }
      this.speechTranscript = '';

      // Discard recorder without triggering send
      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.ondataavailable = null;
        try {
          if (this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
          }
        } catch (e) {}
        this.mediaRecorder = null;
      }

      this.audioChunks = [];
      this.cleanupMedia();
      this.resetUI();
    }

    stopAndSendRecording() {
      if (this.holdTimer) {
        clearTimeout(this.holdTimer);
        this.holdTimer = null;
      }
      this.isPressedOnMic = false;

      if (!this.isRecording && !this.isStarting) return;
      this.isStarting = false;

      // Minimum duration: less than 2 seconds -> discard completely
      const elapsedMs = Date.now() - this.startTime;
      if (elapsedMs < 2000) {
        console.log('[VoiceRecorder] Discarding recording (< 2s):', elapsedMs, 'ms');
        this.isCancelled = true;
        this.cancelRecording();
        if (window.showNotif) window.showNotif('Voice note too short (< 2s) - discarded', 'info', 1800);
        return;
      }

      this.isRecording = false;
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        this.cleanupMedia();
        this.resetUI();
      }
    }

    async handleRecordingComplete(mimeType) {
      if (this.isCancelled) {
        console.log('[VoiceRecorder] Recording was cancelled. Discarding audio.');
        this.audioChunks = [];
        this.cleanupMedia();
        this.resetUI();
        return;
      }

      const elapsedMs = Date.now() - this.startTime;
      const elapsedSec = Math.floor(elapsedMs / 1000);

      // Minimum duration requirement: strictly at least 2 seconds
      if (elapsedMs < 2000 || elapsedSec < 2) {
        console.log('[VoiceRecorder] Discarding recording (< 2s):', elapsedMs, 'ms');
        this.audioChunks = [];
        this.cleanupMedia();
        this.resetUI();
        if (window.showNotif) window.showNotif('Voice note too short (< 2s) - discarded', 'info', 1800);
        return;
      }

      const capturedTranscript = this.speechTranscript || '';
      this.speechTranscript = '';

      this.cleanupMedia();
      this.resetUI();

      if (!this.audioChunks || this.audioChunks.length === 0) {
        console.warn('[VoiceRecorder] No audio chunks captured. Aborting.');
        return;
      }

      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      this.audioChunks = [];

      // Check minimum valid blob size
      if (audioBlob.size < 1000) {
        console.warn('[VoiceRecorder] Audio blob size too small (< 1KB). Discarding.');
        return;
      }

      const duration = Math.max(2, elapsedSec);

      // Read audio blob as Data URL for 100% offline-ready zero-delay playback
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        await this.dispatchVoiceMessage(dataUrl, audioBlob, duration, capturedTranscript);
      };
      reader.readAsDataURL(audioBlob);
    }

    async dispatchVoiceMessage(dataUrl, blob, durationSec, transcript = '') {
      if (typeof window.dispatchVoiceNoteMessage === 'function') {
        window.dispatchVoiceNoteMessage(dataUrl, durationSec, transcript);
        return;
      }

      // Convert to file attachment for standard chat send
      const ext = dataUrl.includes('audio/ogg') ? 'ogg' : (dataUrl.includes('audio/mp4') ? 'm4a' : 'webm');
      const voiceFile = new File([blob], `voice_note_${Date.now()}.${ext}`, { type: blob.type });

      // Attach duration to file
      voiceFile.duration = durationSec;

      if (typeof window.selectedFile !== 'undefined') {
        window.selectedFile = voiceFile;
      }

      // Dispatch via window.sendMessage or synthetic attachment
      if (typeof window.sendMessage === 'function') {
        try {
          await window.sendMessage();
        } catch (err) {
          console.warn('[VoiceRecorder] Direct send notice:', err);
        }
      }
    }

    cleanupMedia() {
      if (this.speechRecognizer) {
        try { this.speechRecognizer.stop(); } catch (e) {}
        this.speechRecognizer = null;
      }
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      if (this.stream) {
        try {
          this.stream.getTracks().forEach(t => {
            try { t.stop(); } catch (_) {}
          });
        } catch (_) {}
        this.stream = null;
      }
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        try { this.audioCtx.close(); } catch (_) {}
        this.audioCtx = null;
      }
      this.isRecording = false;
      this.isStarting = false;
      this.isPressedOnMic = false;
    }

    resetUI() {
      if (this.recordingUI) this.recordingUI.style.display = 'none';
      if (this.messageForm) this.messageForm.style.display = 'flex';
      this.updateTimerDisplay(0);
      this.waveformBars.forEach(b => {
        b.style.transform = 'scaleY(0.3)';
        b.style.backgroundColor = '#00ff66';
      });
    }
  }

  // Export to global namespace
  window.voiceRecorderController = new VoiceRecorderController();
})();
