/**
 * NEXCHAT - Quantum Stegano-Voice Interactive UI & Chat Pipeline
 * Module: src/js/quantum-stegano-voice-ui.js
 * 
 * CORE CAPABILITIES:
 * 1. Attachment Hub integration: [Quantum Stegano-Voice]
 * 2. Interactive Audio Recording & Ambient Cover Synthesizer Modal
 * 3. Procedural live audio preview (Cyber Storm, Lo-Fi Synthwave, Deep Space)
 * 4. In-chat ambient audio card rendering with one-tap [Reveal Secret Voice] cipher prompt
 * 5. Hardware-accelerated 60fps waveform visualization
 * 
 * STRICT COMPLIANCE:
 * - Strictly 0 Unicode emojis (FontAwesome 6 vector glyphs only).
 * - Pure Windows CRLF line endings.
 */

import { quantumSteganoVoice, encodeSteganoAudio, decodeSteganoAudio } from './quantum-stegano-voice.js';

class QuantumSteganoVoiceUI {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordedVoiceBlob = null;
    this.isRecording = false;
    this.recordingStartTime = 0;
    this.recordingTimerInterval = null;
    this.previewActive = false;
    this.activeCoverType = 'cyber_rain';
    this.analyserNode = null;
    this.visualizerRafId = null;
    this.audioContext = null;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.injectAttachmentHubItem();
    this.createModalDOM();
    this.bindEvents();
    window.QuantumSteganoVoiceUI = this;
    window.openQuantumSteganoVoiceModal = () => this.openRecorderModal();
  }

  injectAttachmentHubItem() {
    const hub = document.getElementById('attachmentPopupHub');
    if (!hub || hub.querySelector('#hubActionQuantumSteganoVoice')) return;

    const item = document.createElement('div');
    item.className = 'attach-hub-item';
    item.id = 'hubActionQuantumSteganoVoice';
    item.innerHTML = `
      <div class="attach-hub-icon" style="color: #a855f7;">
        <i class="fa-solid fa-volume-high"></i>
      </div>
      <span>Stegano-Voice</span>
    `;
    item.addEventListener('click', () => {
      hub.style.display = 'none';
      this.openRecorderModal();
    });

    hub.appendChild(item);
  }

  createModalDOM() {
    if (document.getElementById('quantumSteganoModal')) return;

    const modal = document.createElement('div');
    modal.id = 'quantumSteganoModal';
    modal.className = 'quantum-stegano-modal-backdrop';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="quantum-stegano-window">
        <div class="quantum-stegano-header">
          <div class="quantum-stegano-header-title">
            <i class="fa-solid fa-user-secret" style="color: #a855f7;"></i>
            <span>QUANTUM STEGANO-VOICE</span>
            <span class="stegano-pill-badge">PSYCHOACOUSTIC</span>
          </div>
          <button type="button" class="btn-close-stegano" id="btnCloseQuantumStegano">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="quantum-stegano-body">
          <div class="quantum-stegano-desc">
            Encode secret voice transmissions inside an innocent procedural ambient track. To outsiders, it plays relaxing sound; to the authorized recipient with your PIN, your secret voice decrypts and reveals.
          </div>

          <!-- Step 1: Record Voice Message -->
          <div class="stegano-section-card">
            <div class="stegano-section-header">
              <span class="stegano-step-num">1</span>
              <span>RECORD SECRET TRANSMISSION</span>
            </div>
            
            <div class="stegano-record-box">
              <canvas id="steganoWaveCanvas" class="stegano-wave-canvas" width="340" height="60"></canvas>
              <div class="stegano-record-timer" id="steganoRecordTimer">00:00</div>
              
              <div class="stegano-record-controls">
                <button type="button" id="btnSteganoRecord" class="btn-stegano-record">
                  <i class="fa-solid fa-microphone"></i>
                  <span>Hold or Tap to Record</span>
                </button>
                <button type="button" id="btnSteganoPlayPreview" class="btn-stegano-small" style="display: none;">
                  <i class="fa-solid fa-play"></i> Playback
                </button>
                <button type="button" id="btnSteganoClearRecord" class="btn-stegano-small" style="display: none;">
                  <i class="fa-solid fa-trash-can"></i> Re-record
                </button>
              </div>
            </div>
          </div>

          <!-- Step 2: Select Ambient Cover -->
          <div class="stegano-section-card">
            <div class="stegano-section-header">
              <span class="stegano-step-num">2</span>
              <span>SELECT PROCEDURAL AMBIENT COVER</span>
            </div>

            <div class="stegano-cover-grid">
              <div class="stegano-cover-card active" data-cover="cyber_rain">
                <div class="cover-card-icon"><i class="fa-solid fa-cloud-showers-heavy"></i></div>
                <div class="cover-card-info">
                  <span class="cover-title">Cyber Storm</span>
                  <span class="cover-sub">Pink noise + acoustic rainfall</span>
                </div>
              </div>

              <div class="stegano-cover-card" data-cover="lofi_synthwave">
                <div class="cover-card-icon"><i class="fa-solid fa-compact-disc"></i></div>
                <div class="cover-card-info">
                  <span class="cover-title">Lo-Fi Synthwave</span>
                  <span class="cover-sub">Detuned analog synth drone</span>
                </div>
              </div>

              <div class="stegano-cover-card" data-cover="deep_space">
                <div class="cover-card-icon"><i class="fa-solid fa-satellite"></i></div>
                <div class="cover-card-info">
                  <span class="cover-title">Deep Space</span>
                  <span class="cover-sub">Cosmic carrier white noise</span>
                </div>
              </div>
            </div>

            <div class="stegano-ambient-preview-row">
              <button type="button" id="btnSteganoPreviewAmbient" class="btn-stegano-ambient-preview">
                <i class="fa-solid fa-play"></i>
                <span>Preview Ambient Cover (Web Audio)</span>
              </button>
            </div>
          </div>

          <!-- Step 3: Decryption PIN / Key -->
          <div class="stegano-section-card">
            <div class="stegano-section-header">
              <span class="stegano-step-num">3</span>
              <span>DECRYPTION PIN / KEY (OPTIONAL)</span>
            </div>
            
            <div class="stegano-input-wrap">
              <i class="fa-solid fa-key stegano-input-icon"></i>
              <input type="password" id="steganoSecretKeyInput" class="stegano-key-input" placeholder="Enter secret PIN or passphrase (leave blank for default cipher)" autocomplete="off" />
            </div>
          </div>

          <!-- Synthesize Action -->
          <div class="stegano-footer-actions">
            <button type="button" id="btnSynthesizeStegano" class="btn-stegano-synthesize" disabled>
              <i class="fa-solid fa-fingerprint"></i>
              <span>Synthesize & Send Stegano-Audio</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Also create secret decryption prompt modal
    this.createDecryptModalDOM();
  }

  createDecryptModalDOM() {
    if (document.getElementById('quantumSteganoDecryptModal')) return;

    const modal = document.createElement('div');
    modal.id = 'quantumSteganoDecryptModal';
    modal.className = 'quantum-stegano-modal-backdrop';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="quantum-stegano-window decrypt-window">
        <div class="quantum-stegano-header">
          <div class="quantum-stegano-header-title">
            <i class="fa-solid fa-lock-open" style="color: #00ff66;"></i>
            <span>REVEAL QUANTUM STEGANO-VOICE</span>
          </div>
          <button type="button" class="btn-close-stegano" id="btnCloseDecryptStegano">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="quantum-stegano-body">
          <p class="quantum-stegano-desc">
            This audio note contains a psychoacoustically hidden voice transmission encrypted with AES-GCM 256. Enter the decryption PIN to extract and listen.
          </p>

          <div class="stegano-input-wrap">
            <i class="fa-solid fa-key stegano-input-icon"></i>
            <input type="password" id="steganoDecryptKeyInput" class="stegano-key-input" placeholder="Enter decryption PIN or passphrase" autofocus />
          </div>

          <div id="steganoDecryptStatus" class="stegano-status-msg" style="display: none;"></div>

          <div class="stegano-footer-actions">
            <button type="button" id="btnConfirmDecryptStegano" class="btn-stegano-synthesize" style="background: linear-gradient(135deg, #10b981, #059669);">
              <i class="fa-solid fa-unlock"></i>
              <span>Decrypt & Play Secret Voice</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  bindEvents() {
    const modal = document.getElementById('quantumSteganoModal');
    if (!modal) return;

    modal.querySelector('#btnCloseQuantumStegano')?.addEventListener('click', () => this.closeRecorderModal());

    // Cover card selector
    modal.querySelectorAll('.stegano-cover-card').forEach(card => {
      card.addEventListener('click', () => {
        modal.querySelectorAll('.stegano-cover-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.activeCoverType = card.getAttribute('data-cover') || 'cyber_rain';

        if (this.previewActive) {
          quantumSteganoVoice.stopAmbientPreview();
          quantumSteganoVoice.startAmbientPreview(this.activeCoverType);
        }
      });
    });

    // Ambient preview button
    modal.querySelector('#btnSteganoPreviewAmbient')?.addEventListener('click', () => {
      const btn = modal.querySelector('#btnSteganoPreviewAmbient');
      if (this.previewActive) {
        quantumSteganoVoice.stopAmbientPreview();
        this.previewActive = false;
        if (btn) btn.innerHTML = `<i class="fa-solid fa-play"></i> <span>Preview Ambient Cover (Web Audio)</span>`;
      } else {
        quantumSteganoVoice.startAmbientPreview(this.activeCoverType);
        this.previewActive = true;
        if (btn) btn.innerHTML = `<i class="fa-solid fa-stop"></i> <span>Stop Ambient Preview</span>`;
      }
    });

    // Recording button
    const recordBtn = modal.querySelector('#btnSteganoRecord');
    if (recordBtn) {
      recordBtn.addEventListener('click', () => this.toggleRecording());
    }

    modal.querySelector('#btnSteganoPlayPreview')?.addEventListener('click', () => this.playRecordedPreview());
    modal.querySelector('#btnSteganoClearRecord')?.addEventListener('click', () => this.resetRecording());
    modal.querySelector('#btnSynthesizeStegano')?.addEventListener('click', () => this.handleSynthesizeAndSend());

    // Decrypt modal bindings
    const decryptModal = document.getElementById('quantumSteganoDecryptModal');
    decryptModal?.querySelector('#btnCloseDecryptStegano')?.addEventListener('click', () => {
      decryptModal.style.display = 'none';
    });
    decryptModal?.querySelector('#btnConfirmDecryptStegano')?.addEventListener('click', () => this.executeDecryption());
  }

  openRecorderModal() {
    const modal = document.getElementById('quantumSteganoModal');
    if (!modal) return;
    modal.style.display = 'flex';
    this.resetRecording();
    this.previewActive = false;
  }

  closeRecorderModal() {
    const modal = document.getElementById('quantumSteganoModal');
    if (modal) modal.style.display = 'none';
    if (this.previewActive) {
      quantumSteganoVoice.stopAmbientPreview();
      this.previewActive = false;
    }
    if (this.isRecording) {
      this.stopRecording();
    }
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        this.recordedVoiceBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        this.updateRecordingUIState(false, true);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.startRecordingTimer();
      this.updateRecordingUIState(true, false);
      this.initWaveformVisualizer(stream);
    } catch (err) {
      if (typeof window.showNotif === 'function') {
        window.showNotif('Microphone access is required to record a secret transmission.', 'error');
      }
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.stopRecordingTimer();
      this.stopWaveformVisualizer();
    }
  }

  resetRecording() {
    this.recordedVoiceBlob = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.stopRecordingTimer();
    this.stopWaveformVisualizer();

    const timer = document.getElementById('steganoRecordTimer');
    if (timer) timer.textContent = '00:00';

    this.updateRecordingUIState(false, false);
  }

  updateRecordingUIState(isRec, hasBlob) {
    const modal = document.getElementById('quantumSteganoModal');
    if (!modal) return;

    const recordBtn = modal.querySelector('#btnSteganoRecord');
    const playBtn = modal.querySelector('#btnSteganoPlayPreview');
    const clearBtn = modal.querySelector('#btnSteganoClearRecord');
    const synthBtn = modal.querySelector('#btnSynthesizeStegano');

    if (recordBtn) {
      recordBtn.classList.toggle('recording', isRec);
      recordBtn.innerHTML = isRec ?
        `<i class="fa-solid fa-stop"></i> <span>Stop Recording</span>` :
        `<i class="fa-solid fa-microphone"></i> <span>${hasBlob ? 'Record Again' : 'Hold or Tap to Record'}</span>`;
    }

    if (playBtn) playBtn.style.display = hasBlob ? 'inline-flex' : 'none';
    if (clearBtn) clearBtn.style.display = hasBlob ? 'inline-flex' : 'none';
    if (synthBtn) synthBtn.disabled = !hasBlob;
  }

  startRecordingTimer() {
    const timer = document.getElementById('steganoRecordTimer');
    this.recordingTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      if (timer) timer.textContent = `${mins}:${secs}`;
    }, 250);
  }

  stopRecordingTimer() {
    if (this.recordingTimerInterval) {
      clearInterval(this.recordingTimerInterval);
      this.recordingTimerInterval = null;
    }
  }

  initWaveformVisualizer(stream) {
    const canvas = document.getElementById('steganoWaveCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.audioContext = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      if (!this.isRecording) return;
      this.visualizerRafId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / dataArray.length) * 1.5;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 2, barHeight);
        x += barWidth;
      }
    };

    draw();
  }

  stopWaveformVisualizer() {
    if (this.visualizerRafId) {
      cancelAnimationFrame(this.visualizerRafId);
      this.visualizerRafId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (_) {}
      this.audioContext = null;
    }
    const canvas = document.getElementById('steganoWaveCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  playRecordedPreview() {
    if (!this.recordedVoiceBlob) return;
    const audioUrl = URL.createObjectURL(this.recordedVoiceBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  }

  async handleSynthesizeAndSend() {
    if (!this.recordedVoiceBlob) return;

    const synthBtn = document.getElementById('btnSynthesizeStegano');
    const keyInput = document.getElementById('steganoSecretKeyInput');
    const secretKey = keyInput ? keyInput.value.trim() : '';

    if (synthBtn) {
      synthBtn.disabled = true;
      synthBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Synthesizing Psychoacoustic Wave...</span>`;
    }

    try {
      const steganoBlob = await encodeSteganoAudio(this.recordedVoiceBlob, this.activeCoverType, secretKey);

      // Package transmission payload for chat
      const fileData = {
        name: `QUANTUM_STEG_${this.activeCoverType.toUpperCase()}_${Date.now()}.wav`,
        type: 'audio/wav',
        size: steganoBlob.size,
        blob: steganoBlob,
        coverType: this.activeCoverType,
        isSteganoVoice: true,
        hasCustomKey: Boolean(secretKey)
      };

      // Dispatch to active chat send pipeline
      if (typeof window.sendSteganoVoiceMessage === 'function') {
        await window.sendSteganoVoiceMessage(fileData);
      } else if (typeof window.sendMessageWithAttachment === 'function') {
        await window.sendMessageWithAttachment(steganoBlob, fileData.name, 'audio/wav', { isSteganoVoice: true, coverType: this.activeCoverType });
      } else {
        // Fallback: Create downloadable or trigger active input
        const url = URL.createObjectURL(steganoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.name;
        a.click();
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif('Quantum Stegano-Voice synthesized & beamed into quantum channel!', 'success', 3500);
      }

      this.closeRecorderModal();
    } catch (err) {
      console.error('[Stegano UI] Synthesis failed:', err);
      if (typeof window.showNotif === 'function') {
        window.showNotif('Steganographic audio synthesis failed: ' + err.message, 'error');
      }
    } finally {
      if (synthBtn) {
        synthBtn.disabled = false;
        synthBtn.innerHTML = `<i class="fa-solid fa-fingerprint"></i> <span>Synthesize & Send Stegano-Audio</span>`;
      }
    }
  }

  // In-chat decrypt prompt
  promptDecryptSteganoAudio(blobUrlOrBlob) {
    this.pendingSteganoBlob = blobUrlOrBlob;
    const modal = document.getElementById('quantumSteganoDecryptModal');
    if (!modal) return;

    const input = document.getElementById('steganoDecryptKeyInput');
    if (input) input.value = '';

    const status = document.getElementById('steganoDecryptStatus');
    if (status) status.style.display = 'none';

    modal.style.display = 'flex';
  }

  async executeDecryption() {
    const input = document.getElementById('steganoDecryptKeyInput');
    const status = document.getElementById('steganoDecryptStatus');
    const secretKey = input ? input.value.trim() : '';

    if (status) {
      status.style.display = 'block';
      status.className = 'stegano-status-msg';
      status.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Scanning audio spectrogram and decrypting AES-GCM...`;
    }

    try {
      let blob = this.pendingSteganoBlob;
      if (typeof blob === 'string') {
        const resp = await fetch(blob);
        blob = await resp.blob();
      }

      const result = await decodeSteganoAudio(blob, secretKey);

      if (status) {
        status.className = 'stegano-status-msg success';
        status.innerHTML = `<i class="fa-solid fa-check"></i> Secret voice decrypted successfully (${result.duration.toFixed(1)}s)`;
      }

      // Play decrypted secret audio
      await result.play();

      if (typeof window.showNotif === 'function') {
        window.showNotif('Quantum Stegano-Voice decrypted and playing!', 'success', 3000);
      }

      setTimeout(() => {
        const modal = document.getElementById('quantumSteganoDecryptModal');
        if (modal) modal.style.display = 'none';
      }, 1200);
    } catch (err) {
      if (status) {
        status.className = 'stegano-status-msg error';
        status.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Decryption failed: Check PIN or encryption key`;
      }
    }
  }
}

export const quantumSteganoVoiceUI = new QuantumSteganoVoiceUI();
export default quantumSteganoVoiceUI;
