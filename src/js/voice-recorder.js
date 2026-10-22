/**
 * NEXCHAT Tactical Voice Notes & Audio Recording Controller
 * 
 * Capabilities:
 * - HTML5 MediaRecorder voice capture (WebM / Ogg / MP4)
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

      this.recordBtn = null;
      this.recordingUI = null;
      this.timerEl = null;
      this.waveformBars = [];
      this.cancelBtn = null;
      this.stopBtn = null;
      this.sendBtn = null;
      this.messageForm = null;

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
      this.recordBtn = document.getElementById('audio-record-btn');
      this.recordingUI = document.getElementById('audioRecordingUI');
      this.timerEl = document.getElementById('audioTimer');
      this.waveformBars = Array.from(document.querySelectorAll('.audio-waveform-bars span'));
      this.cancelBtn = document.getElementById('audioCancelBtn');
      this.stopBtn = document.getElementById('audioStopBtn');
      this.sendBtn = document.getElementById('audioSendNowBtn');
      this.messageForm = document.getElementById('message-form');

      if (!this.recordBtn) return;

      // Click microphone button to start recording
      this.recordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.startRecording();
      });

      // Cancel button
      if (this.cancelBtn) {
        this.cancelBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.cancelRecording();
        });
      }

      // Stop button (finishes recording & sends)
      if (this.stopBtn) {
        this.stopBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.stopAndSendRecording();
        });
      }

      // Send Now button
      if (this.sendBtn) {
        this.sendBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.stopAndSendRecording();
        });
      }
    }

    async startRecording() {
      if (this.isRecording) return;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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
        this.startTime = Date.now();

        // UI transitions
        if (this.messageForm) this.messageForm.style.display = 'none';
        if (this.recordingUI) this.recordingUI.style.display = 'flex';
        this.startTimer();

        if (navigator.vibrate) navigator.vibrate(30);
        if (window.playLuxuryPopSound) window.playLuxuryPopSound();

      } catch (err) {
        console.error('[VoiceRecorder] Mic access error:', err);
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

    cancelRecording() {
      if (!this.isRecording) return;
      this.isRecording = false;

      // Discard recorder without triggering send
      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = null;
        try { this.mediaRecorder.stop(); } catch (e) {}
      }

      this.cleanupMedia();
      this.resetUI();
      if (window.showNotif) window.showNotif('Voice note cancelled', 'info', 1500);
    }

    stopAndSendRecording() {
      if (!this.isRecording) return;
      this.isRecording = false;

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    }

    async handleRecordingComplete(mimeType) {
      this.cleanupMedia();
      this.resetUI();

      if (this.audioChunks.length === 0) {
        if (window.showNotif) window.showNotif('No audio captured', 'error');
        return;
      }

      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      const duration = Math.max(1, this.durationSec || 1);

      // Verify minimum duration (at least 0.5s to prevent accidental tap)
      if (audioBlob.size < 500) {
        if (window.showNotif) window.showNotif('Audio too short (hold to record)', 'info');
        return;
      }

      // Read audio blob as Data URL for 100% offline-ready zero-delay playback
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        await this.dispatchVoiceMessage(dataUrl, audioBlob, duration);
      };
      reader.readAsDataURL(audioBlob);
    }

    async dispatchVoiceMessage(dataUrl, blob, durationSec) {
      if (typeof window.dispatchVoiceNoteMessage === 'function') {
        window.dispatchVoiceNoteMessage(dataUrl, durationSec);
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
      clearInterval(this.timerInterval);
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        try { this.audioCtx.close(); } catch (e) {}
        this.audioCtx = null;
      }
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
