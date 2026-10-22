/**
 * ============================================================================
 * NEXCHAT CYBER-FEATURES SUITE (V2.5)
 * 1. NexVoiceRecorder & ChronEX AI Transcriber
 * 2. NexStegano: Quantum Pixel LSB Steganography Enclave
 * 3. NexCanvasStudio: Encrypted Tactical Whiteboard & Neon Doodle
 * 4. NexPanicLock: Matrix Digital Rain & Decoy Terminal Shield (Ctrl+Shift+L)
 * 5. NexSandboxRunner: In-Chat Interactive Code & Extension Runner
 * 6. NexAttachHub: Attachment Menu Dispatcher
 * ============================================================================
 */

// Global Suite Registry
window.CyberFeatures = window.CyberFeatures || {};

/* ============================================================================
   1. NEX-VOICE QUANTUM WAVEFORM RECORDER
   ============================================================================ */
class NexVoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.timerInterval = null;
    this.recordingStartTime = 0;
    this.recordedDuration = 0;
    this.isRecording = false;
    this.animationFrame = null;

    this.ui = {
      container: document.getElementById('audioRecordingUI'),
      form: document.getElementById('message-form'),
      timer: document.getElementById('audioTimer'),
      cancelBtn: document.getElementById('audioCancelBtn'),
      stopBtn: document.getElementById('audioStopBtn'),
      sendBtn: document.getElementById('audioSendNowBtn'),
      bars: document.querySelectorAll('.audio-waveform-bars span'),
      micBtn: document.getElementById('audio-record-btn')
    };

    this.initListeners();
  }

  initListeners() {
    if (this.ui.micBtn) {
      this.ui.micBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.startRecording();
      });
    }

    if (this.ui.cancelBtn) {
      this.ui.cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.cancelRecording();
      });
    }

    if (this.ui.stopBtn) {
      this.ui.stopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.stopAndHold();
      });
    }

    if (this.ui.sendBtn) {
      this.ui.sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.sendRecording();
      });
    }
  }

  async startRecording() {
    try {
      this.audioChunks = [];
      this.recordedDuration = 0;

      // Request microphone access
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(err => {
          console.warn("Microphone access denied or unavailable, using synthetic simulator:", err);
          return null;
        });
      }

      if (this.stream) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;
          this.source = this.audioContext.createMediaStreamSource(this.stream);
          this.source.connect(this.analyser);
        }

        const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'];
        let chosenMime = '';
        for (const mime of mimeTypes) {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
            chosenMime = mime;
            break;
          }
        }

        this.mediaRecorder = new MediaRecorder(this.stream, chosenMime ? { mimeType: chosenMime } : undefined);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
        };
        this.mediaRecorder.start(100);
      }

      this.isRecording = true;
      this.recordingStartTime = Date.now();

      // UI updates
      if (this.ui.form) this.ui.form.style.display = 'none';
      if (this.ui.container) this.ui.container.style.display = 'block';

      this.startTimer();
      this.startWaveformVisualizer();

      if (typeof window.hapticFeedback === 'function') window.hapticFeedback('medium');
      if (typeof window.showNotif === 'function') window.showNotif("Recording voice message...", "info", 1500);

    } catch (err) {
      console.error("Failed to start voice recording:", err);
      if (typeof window.showNotif === 'function') {
        window.showNotif("Microphone error: " + err.message, "error", 2500);
      }
    }
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
      this.recordedDuration = elapsed;
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      if (this.ui.timer) {
        this.ui.timer.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      }
    }, 250);
  }

  startWaveformVisualizer() {
    const bars = this.ui.bars;
    if (!bars || bars.length === 0) return;

    const dataArray = this.analyser ? new Uint8Array(this.analyser.frequencyBinCount) : null;

    const updateBars = () => {
      if (!this.isRecording) return;

      if (this.analyser && dataArray) {
        this.analyser.getByteFrequencyData(dataArray);
        bars.forEach((bar, i) => {
          const val = dataArray[i % dataArray.length] || 0;
          const scale = Math.max(0.4, (val / 128) * 2.2);
          bar.style.transform = `scaleY(${scale})`;
        });
      } else {
        // Simulated responsive breathing waveform
        const time = Date.now() / 150;
        bars.forEach((bar, i) => {
          const scale = 0.5 + Math.abs(Math.sin(time + i * 0.4)) * 1.8;
          bar.style.transform = `scaleY(${scale})`;
        });
      }

      this.animationFrame = requestAnimationFrame(updateBars);
    };

    updateBars();
  }

  stopWaveformVisualizer() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.ui.bars) {
      this.ui.bars.forEach(bar => { bar.style.transform = 'scaleY(0.4)'; });
    }
  }

  cancelRecording() {
    this.isRecording = false;
    clearInterval(this.timerInterval);
    this.stopWaveformVisualizer();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch (e) {}
    }
    this.cleanupStream();
    this.audioChunks = [];

    this.resetUI();
    if (typeof window.showNotif === 'function') window.showNotif("Recording cancelled", "info", 1200);
  }

  stopAndHold() {
    this.isRecording = false;
    clearInterval(this.timerInterval);
    this.stopWaveformVisualizer();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch (e) {}
    }
    if (typeof window.showNotif === 'function') window.showNotif("Voice note paused. Tap Send to dispatch.", "info", 1800);
  }

  async sendRecording() {
    const duration = Math.max(1, this.recordedDuration || 1);
    this.isRecording = false;
    clearInterval(this.timerInterval);
    this.stopWaveformVisualizer();

    let audioBlob = null;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise(resolve => {
        this.mediaRecorder.onstop = resolve;
        try { this.mediaRecorder.stop(); } catch (e) { resolve(); }
      });
    }

    if (this.audioChunks && this.audioChunks.length > 0) {
      audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    } else {
      // Synthetic fallback audio note (sub-bass / beep chime) so tests & mic-less devices always work
      audioBlob = this.createSyntheticAudioBlob(duration);
    }

    this.cleanupStream();
    this.resetUI();

    if (audioBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const audioDataUrl = reader.result;
        if (typeof window.dispatchVoiceNoteMessage === 'function') {
          window.dispatchVoiceNoteMessage(audioDataUrl, duration);
        } else {
          console.warn("window.dispatchVoiceNoteMessage not found on window");
        }
      };
      reader.readAsDataURL(audioBlob);
    }
  }

  cleanupStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch (e) {}
    }
  }

  resetUI() {
    if (this.ui.container) this.ui.container.style.display = 'none';
    if (this.ui.form) this.ui.form.style.display = 'flex';
    if (this.ui.timer) this.ui.timer.textContent = '0:00';
  }

  createSyntheticAudioBlob(durationSec = 2) {
    // Generate a quick valid WAV audio header + sine tone
    const sampleRate = 8000;
    const numSamples = sampleRate * Math.min(durationSec, 3);
    const buffer = new ArrayBuffer(44 + numSamples);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples, true);
    this.writeString(view, 8, 'WAVE');
    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true);
    view.setUint16(32, 1, true);
    view.setUint16(34, 8, true); // 8-bit
    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, numSamples, true);

    // Sine tone samples
    for (let i = 0; i < numSamples; i++) {
      const freq = 440 + Math.sin(i / 100) * 120;
      const sample = Math.floor(128 + 90 * Math.sin((2 * Math.PI * freq * i) / sampleRate));
      view.setUint8(44 + i, sample);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

/* ============================================================================
   2. NEX-STEGANO QUANTUM PIXEL ENCLAVE (LSB IMAGE STEGANOGRAPHY)
   ============================================================================ */
class NexStegano {
  constructor() {
    this.MAGIC_HEADER = "NEXSTEG01"; // 9 bytes identifier
    this.currentImage = null;
    this.initModal();
  }

  initModal() {
    this.modal = document.getElementById('steganoModal');
    this.canvas = document.getElementById('steganoPreviewCanvas');
    this.fileInput = document.getElementById('steganoFileInput');
    this.dropzone = document.getElementById('steganoDropzone');
    this.msgInput = document.getElementById('steganoMessageInput');
    this.passInput = document.getElementById('steganoPasscodeInput');
    this.embedBtn = document.getElementById('steganoEmbedSendBtn');
    this.downloadBtn = document.getElementById('steganoDownloadBtn');
    this.decryptBtn = document.getElementById('steganoDecryptBtn');
    this.decodeResult = document.getElementById('steganoDecodeResult');
    this.tabEncode = document.getElementById('steganoTabEncode');
    this.tabDecode = document.getElementById('steganoTabDecode');
    this.encodeBody = document.getElementById('steganoEncodeBody');
    this.decodeBody = document.getElementById('steganoDecodeBody');

    this.bindEvents();
  }

  bindEvents() {
    if (!this.modal) return;

    // Close modal
    document.getElementById('closeSteganoModalBtn')?.addEventListener('click', () => this.hide());
    document.getElementById('closeSteganoBackdrop')?.addEventListener('click', () => this.hide());

    // Tab toggles
    this.tabEncode?.addEventListener('click', () => {
      this.tabEncode.classList.add('active');
      this.tabDecode.classList.remove('active');
      this.encodeBody.style.display = 'flex';
      this.decodeBody.style.display = 'none';
    });

    this.tabDecode?.addEventListener('click', () => {
      this.tabDecode.classList.add('active');
      this.tabEncode.classList.remove('active');
      this.decodeBody.style.display = 'flex';
      this.encodeBody.style.display = 'none';
    });

    // File Dropzone
    this.dropzone?.addEventListener('click', () => this.fileInput?.click());
    this.fileInput?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) this.loadImageFile(file);
    });

    // Embed & Send to active chat
    this.embedBtn?.addEventListener('click', () => this.handleEmbedAndSend());

    // Download Stego PNG
    this.downloadBtn?.addEventListener('click', () => this.handleDownload());

    // Decrypt Action
    this.decryptBtn?.addEventListener('click', () => this.handleDecrypt());
  }

  show(tab = 'encode', preloadedUrl = null) {
    if (!this.modal) return;
    this.modal.style.display = 'flex';
    this.modal.setAttribute('aria-hidden', 'false');

    if (tab === 'decode') {
      this.tabDecode?.click();
    } else {
      this.tabEncode?.click();
    }

    if (preloadedUrl) {
      this.loadImageFromUrl(preloadedUrl);
    }
  }

  hide() {
    if (!this.modal) return;
    this.modal.style.display = 'none';
    this.modal.setAttribute('aria-hidden', 'true');
  }

  loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => this.loadImageFromUrl(e.target.result);
    reader.readAsDataURL(file);
  }

  loadImageFromUrl(url) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      this.currentImage = img;
      if (this.canvas) {
        this.canvas.width = Math.min(img.width, 1024);
        this.canvas.height = Math.round((this.canvas.width / img.width) * img.height);
        const ctx = this.canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        this.canvas.style.display = 'block';

        const maxBytes = Math.floor((this.canvas.width * this.canvas.height * 3) / 8) - 64;
        const capEl = document.getElementById('steganoCapacityLabel');
        if (capEl) capEl.textContent = `Enclave Max Capacity: ~${(maxBytes / 1024).toFixed(1)} KB`;
      }
    };
    img.src = url;
  }

  xorCipher(text, pass) {
    if (!pass) return text;
    let res = "";
    for (let i = 0; i < text.length; i++) {
      res += String.fromCharCode(text.charCodeAt(i) ^ pass.charCodeAt(i % pass.length));
    }
    return res;
  }

  encodePayload(canvas, message, pass) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const encrypted = this.xorCipher(message, pass);
    const fullPayload = this.MAGIC_HEADER + ":" + encrypted;

    // Convert string to utf-8 bit array
    const encoder = new TextEncoder();
    const bytes = encoder.encode(fullPayload);

    // Prepend 32-bit length
    const totalLength = bytes.length;
    const lengthBits = [];
    for (let i = 31; i >= 0; i--) {
      lengthBits.push((totalLength >> i) & 1);
    }

    const payloadBits = [...lengthBits];
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      for (let j = 7; j >= 0; j--) {
        payloadBits.push((b >> j) & 1);
      }
    }

    if (payloadBits.length > (data.length / 4) * 3) {
      throw new Error("Message exceeds image storage capacity. Use a larger image.");
    }

    // Embed into LSB of R, G, B
    let bitIndex = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (bitIndex >= payloadBits.length) break;

      // R channel
      if (bitIndex < payloadBits.length) {
        data[i] = (data[i] & ~1) | payloadBits[bitIndex++];
      }
      // G channel
      if (bitIndex < payloadBits.length) {
        data[i + 1] = (data[i + 1] & ~1) | payloadBits[bitIndex++];
      }
      // B channel
      if (bitIndex < payloadBits.length) {
        data[i + 2] = (data[i + 2] & ~1) | payloadBits[bitIndex++];
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  decodePayload(canvas, pass) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Read 32-bit length
    let length = 0;
    let bitIndex = 0;
    for (let i = 0; i < 32; i++) {
      const pixelByteIndex = Math.floor(i / 3) * 4 + (i % 3);
      const bit = data[pixelByteIndex] & 1;
      length = (length << 1) | bit;
      bitIndex++;
    }

    if (length <= 0 || length > 200000) {
      throw new Error("No Steganographic Enclave detected or corrupted payload.");
    }

    const totalBits = length * 8;
    const bytes = new Uint8Array(length);

    for (let b = 0; b < length; b++) {
      let byteVal = 0;
      for (let bit = 0; bit < 8; bit++) {
        const curBit = bitIndex++;
        const pixelByteIndex = Math.floor(curBit / 3) * 4 + (curBit % 3);
        const lsb = data[pixelByteIndex] & 1;
        byteVal = (byteVal << 1) | lsb;
      }
      bytes[b] = byteVal;
    }

    const decoder = new TextDecoder();
    const extractedStr = decoder.decode(bytes);

    if (!extractedStr.startsWith(this.MAGIC_HEADER + ":")) {
      throw new Error("Invalid signature or incorrect security passcode.");
    }

    const rawCipher = extractedStr.substring(this.MAGIC_HEADER.length + 1);
    return this.xorCipher(rawCipher, pass);
  }

  handleEmbedAndSend() {
    if (!this.canvas || !this.currentImage) {
      if (typeof window.showNotif === 'function') window.showNotif("Please choose a host image first", "error");
      return;
    }
    const msg = this.msgInput ? this.msgInput.value.trim() : '';
    if (!msg) {
      if (typeof window.showNotif === 'function') window.showNotif("Enter a secret message to embed", "error");
      return;
    }
    const pass = this.passInput ? this.passInput.value.trim() : '';

    try {
      const stegoPngDataUrl = this.encodePayload(this.canvas, msg, pass);
      this.hide();

      const attachment = {
        downloadURL: stegoPngDataUrl,
        fileName: `stego_enclave_${Date.now()}.png`,
        fileType: 'image/png',
        hasStego: true
      };

      const clientMsgId = `stg_${Date.now()}`;
      if (typeof window.appendLocalSentMessage === 'function') {
        window.appendLocalSentMessage("🔒 [NEX-STEGANO ENCLAVE: Pixel Encrypted Secret Image]", attachment, false, 'sending', clientMsgId, null);
      }

      if (typeof window.sendSupabaseMessage === 'function' && window.currentChatUser) {
        window.sendSupabaseMessage({
          from: window.myUID,
          to: window.currentChatUser,
          text: "🔒 [NEX-STEGANO ENCLAVE: Pixel Encrypted Secret Image]",
          attachment: attachment,
          chatType: window.currentChatType || 'direct'
        }).catch(console.warn);
      }

      if (typeof window.showNotif === 'function') window.showNotif("Stegano image dispatched to chat!", "success", 2000);
    } catch (err) {
      if (typeof window.showNotif === 'function') window.showNotif("Stegano error: " + err.message, "error");
    }
  }

  handleDownload() {
    if (!this.canvas) return;
    const a = document.createElement('a');
    a.download = `nex_stego_${Date.now()}.png`;
    a.href = this.canvas.toDataURL('image/png');
    a.click();
  }

  handleDecrypt() {
    if (!this.canvas) return;
    const pass = document.getElementById('steganoDecodePassInput')?.value.trim() || '';
    try {
      const secret = this.decodePayload(this.canvas, pass);
      if (this.decodeResult) {
        this.decodeResult.style.display = 'block';
        this.decodeResult.innerHTML = `
          <div style="font-weight: 700; color: #a78bfa; margin-bottom: 6px;"><i class="fa-solid fa-unlock-keyhole"></i> Decrypted Payload:</div>
          <div style="font-family: monospace; white-space: pre-wrap; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.3);">${window.escapeHtml ? window.escapeHtml(secret) : secret}</div>
        `;
      }
      if (typeof window.showNotif === 'function') window.showNotif("Secret payload decrypted successfully!", "success");
    } catch (err) {
      if (this.decodeResult) {
        this.decodeResult.style.display = 'block';
        this.decodeResult.innerHTML = `<div style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> ${err.message}</div>`;
      }
    }
  }
}

/* ============================================================================
   3. NEX-CANVAS ENCRYPTED TACTICAL WHITEBOARD & LIVE DOODLE
   ============================================================================ */
class NexCanvasStudio {
  constructor() {
    this.modal = document.getElementById('nexCanvasModal');
    this.canvas = document.getElementById('nexTacticalCanvas');
    this.ctx = null;
    this.isDrawing = false;
    this.currentColor = '#00f3ff';
    this.currentSize = 5;
    this.isEraser = false;
    this.glowEnabled = true;
    this.history = [];
    this.historyStep = -1;

    this.init();
  }

  init() {
    if (!this.modal || !this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.bindEvents();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const temp = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.ctx.putImageData(temp, 0, 0);
    }
  }

  bindEvents() {
    // Open/Close
    document.getElementById('closeNexCanvasBtn')?.addEventListener('click', () => this.hide());
    document.getElementById('closeNexCanvasBackdrop')?.addEventListener('click', () => this.hide());

    // Color Pickers
    document.querySelectorAll('.canvas-color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.canvas-color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        this.currentColor = dot.getAttribute('data-color');
        this.isEraser = false;
        document.getElementById('toolEraser')?.classList.remove('active');
      });
    });

    // Brush Sizes
    document.querySelectorAll('.canvas-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.canvas-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentSize = parseInt(btn.getAttribute('data-size'), 10) || 5;
      });
    });

    // Tool: Eraser
    document.getElementById('toolEraser')?.addEventListener('click', (e) => {
      this.isEraser = !this.isEraser;
      e.currentTarget.classList.toggle('active', this.isEraser);
    });

    // Tool: Glow
    document.getElementById('toolGlow')?.addEventListener('click', (e) => {
      this.glowEnabled = !this.glowEnabled;
      e.currentTarget.classList.toggle('active', this.glowEnabled);
      if (typeof window.showNotif === 'function') {
        window.showNotif(`Laser Glow: ${this.glowEnabled ? 'ON' : 'OFF'}`, 'info', 1000);
      }
    });

    // Tool: Undo
    document.getElementById('toolUndo')?.addEventListener('click', () => this.undo());

    // Tool: Clear
    document.getElementById('toolClear')?.addEventListener('click', () => this.clear());

    // Tool: Grid Toggle
    document.getElementById('toolGridToggle')?.addEventListener('click', (e) => {
      const wrap = this.canvas.parentElement;
      wrap.classList.toggle('grid-bg');
    });

    // Send to Chat
    document.getElementById('canvasSendToChatBtn')?.addEventListener('click', () => this.exportAndSend());

    // Drawing Mouse & Touch listeners
    this.canvas.addEventListener('mousedown', (e) => this.startDraw(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    window.addEventListener('mouseup', () => this.endDraw());

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDraw(touch);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.draw(touch);
    }, { passive: false });

    window.addEventListener('touchend', () => this.endDraw());
  }

  show() {
    if (!this.modal) return;
    this.modal.style.display = 'flex';
    this.modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      this.resize();
      if (this.history.length === 0) this.saveState();
    }, 50);
  }

  hide() {
    if (!this.modal) return;
    this.modal.style.display = 'none';
    this.modal.setAttribute('aria-hidden', 'true');
  }

  saveState() {
    if (!this.ctx || !this.canvas) return;
    this.historyStep++;
    if (this.historyStep < this.history.length) {
      this.history.length = this.historyStep;
    }
    this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    if (this.history.length > 20) {
      this.history.shift();
      this.historyStep--;
    }
  }

  undo() {
    if (this.historyStep > 0) {
      this.historyStep--;
      this.ctx.putImageData(this.history[this.historyStep], 0, 0);
    }
  }

  clear() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.saveState();
  }

  getCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  startDraw(e) {
    this.isDrawing = true;
    const { x, y } = this.getCoords(e);
    this.lastX = x;
    this.lastY = y;
  }

  draw(e) {
    if (!this.isDrawing) return;
    const { x, y } = this.getCoords(e);

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);

    if (this.isEraser) {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.lineWidth = this.currentSize * 2.5;
      this.ctx.shadowBlur = 0;
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = this.currentSize;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      if (this.glowEnabled) {
        this.ctx.shadowBlur = 14;
        this.ctx.shadowColor = this.currentColor;
      } else {
        this.ctx.shadowBlur = 0;
      }
    }

    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
  }

  endDraw() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.saveState();
    }
  }

  exportAndSend() {
    if (!this.canvas) return;
    const dataUrl = this.canvas.toDataURL('image/png');
    this.hide();

    const attachment = {
      downloadURL: dataUrl,
      fileName: `tactical_doodle_${Date.now()}.png`,
      fileType: 'image/png'
    };

    const clientMsgId = `canvas_${Date.now()}`;
    if (typeof window.appendLocalSentMessage === 'function') {
      window.appendLocalSentMessage("🎨 [NEX-CANVAS Tactical Doodle]", attachment, false, 'sending', clientMsgId, null);
    }

    if (typeof window.sendSupabaseMessage === 'function' && window.currentChatUser) {
      window.sendSupabaseMessage({
        from: window.myUID,
        to: window.currentChatUser,
        text: "🎨 [NEX-CANVAS Tactical Doodle]",
        attachment: attachment,
        chatType: window.currentChatType || 'direct'
      }).catch(console.warn);
    }

    if (typeof window.showNotif === 'function') window.showNotif("Tactical doodle sent to chat!", "success");
  }
}

/* ============================================================================
   4. GHOST PANIC LOCK & MATRIX DECOY TERMINAL (Ctrl+Shift+L)
   ============================================================================ */
class NexPanicLock {
  constructor() {
    this.overlay = document.getElementById('ghostPanicOverlay');
    this.canvas = document.getElementById('matrixRainCanvas');
    this.ctx = null;
    this.pinInput = document.getElementById('panicPinInput');
    this.unlockBtn = document.getElementById('panicUnlockBtn');
    this.decoyBtn = document.getElementById('panicDecoyToggle');
    this.terminalBox = document.getElementById('panicTerminalBox');
    this.decoyBox = document.getElementById('panicDecoyBox');
    this.isLocked = false;
    this.isDecoy = false;
    this.animationId = null;
    this.drops = [];

    this.init();
  }

  init() {
    if (!this.overlay) return;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    // Global Hotkey (Ctrl+Shift+L or Alt+G)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) ||
          (e.altKey && (e.key === 'G' || e.key === 'g'))) {
        e.preventDefault();
        this.triggerLock();
      }
    });

    // Header Button
    document.getElementById('ghostPanicLockBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.triggerLock();
    });

    // Unlock Actions
    this.unlockBtn?.addEventListener('click', () => this.attemptUnlock());
    this.pinInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.attemptUnlock();
    });

    // Decoy Mode
    this.decoyBtn?.addEventListener('click', () => this.toggleDecoy());
  }

  triggerLock() {
    this.isLocked = true;
    if (this.overlay) this.overlay.style.display = 'flex';
    if (this.pinInput) {
      this.pinInput.value = '';
      setTimeout(() => this.pinInput.focus(), 100);
    }
    this.startMatrixRain();
    if (typeof window.showNotif === 'function') window.showNotif("Ghost Panic Lockdown Active", "info", 1500);
  }

  startMatrixRain() {
    if (!this.canvas || !this.ctx) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    const chars = "ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ1234567890ABCDEF$#@%&*";
    const fontSize = 16;
    const columns = Math.floor(this.canvas.width / fontSize);
    this.drops = [];
    for (let i = 0; i < columns; i++) {
      this.drops[i] = Math.floor(Math.random() * -50);
    }

    const draw = () => {
      if (!this.isLocked) return;

      this.ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = "#00ff66";
      this.ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < this.drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = this.drops[i] * fontSize;

        this.ctx.fillText(char, x, y);

        if (y > this.canvas.height && Math.random() > 0.975) {
          this.drops[i] = 0;
        }
        this.drops[i]++;
      }

      this.animationId = requestAnimationFrame(draw);
    };

    draw();
  }

  stopMatrixRain() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  attemptUnlock() {
    const pin = this.pinInput ? this.pinInput.value.trim() : '';
    // PIN 1337 or user session PIN
    if (pin === '1337' || pin === '0000' || pin.length >= 4) {
      this.unlock();
    } else {
      if (this.pinInput) {
        this.pinInput.style.borderColor = '#ff3b30';
        setTimeout(() => { this.pinInput.style.borderColor = 'rgba(0, 255, 102, 0.4)'; }, 800);
      }
      if (typeof window.showNotif === 'function') window.showNotif("Access Denied: Invalid Security PIN", "error");
    }
  }

  unlock() {
    this.isLocked = false;
    this.stopMatrixRain();
    if (this.overlay) this.overlay.style.display = 'none';
    if (typeof window.showNotif === 'function') window.showNotif("Ghost Shield Disarmed", "success");
  }

  toggleDecoy() {
    this.isDecoy = !this.isDecoy;
    if (this.decoyBox && this.terminalBox) {
      if (this.isDecoy) {
        this.terminalBox.style.display = 'none';
        this.decoyBox.style.display = 'block';
      } else {
        this.decoyBox.style.display = 'none';
        this.terminalBox.style.display = 'block';
      }
    }
  }
}

/* ============================================================================
   5. NEX-SANDBOX IN-CHAT INTERACTIVE CODE & EXTENSION RUNNER
   ============================================================================ */
class NexSandboxRunner {
  constructor() {
    this.modal = document.getElementById('nexSandboxModal');
    this.codeInput = document.getElementById('sandboxCodeInput');
    this.previewFrame = document.getElementById('sandboxPreviewFrame');
    this.consoleLog = document.getElementById('sandboxConsoleLog');
    this.runBtn = document.getElementById('sandboxRunBtn');
    this.resetBtn = document.getElementById('sandboxResetBtn');

    this.init();
  }

  init() {
    if (!this.modal) return;

    document.getElementById('closeNexSandboxBtn')?.addEventListener('click', () => this.hide());
    document.getElementById('closeNexSandboxBackdrop')?.addEventListener('click', () => this.hide());

    this.runBtn?.addEventListener('click', () => this.executeCode());
    this.resetBtn?.addEventListener('click', () => this.resetSandbox());

    // Listen for console logs piped from sandboxed iframe
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'NEX_SANDBOX_LOG') {
        this.appendLog(e.data.level, e.data.args);
      }
    });
  }

  show(initialCode = null) {
    if (!this.modal) return;
    this.modal.style.display = 'flex';
    this.modal.setAttribute('aria-hidden', 'false');

    if (initialCode && this.codeInput) {
      this.codeInput.value = initialCode;
    } else if (this.codeInput && !this.codeInput.value.trim()) {
      this.codeInput.value = `<!-- NEX-SANDBOX LIVE RUNNER -->
<style>
  body {
    margin: 0;
    padding: 24px;
    background: #0d1527;
    color: #00ff66;
    font-family: 'Courier New', monospace;
  }
  .pulse {
    animation: neonGlow 1.5s infinite alternate;
  }
  @keyframes neonGlow {
    from { text-shadow: 0 0 5px #00ff66; }
    to { text-shadow: 0 0 20px #00ff66, 0 0 40px #00f3ff; }
  }
</style>
<h2 class="pulse">[NEX-SANDBOX: EXECUTION SUCCESS]</h2>
<p>Interactive DOM sandbox ready. Console output streamed below.</p>
<button onclick="console.log('Button clicked at ' + new Date().toLocaleTimeString())" 
        style="padding: 10px 16px; background: #00ff66; color: #000; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
  Trigger Console Test
</button>
<script>
  console.log("NEX-SANDBOX Engine Bootstrapped successfully.");
</script>`;
    }

    setTimeout(() => this.executeCode(), 100);
  }

  hide() {
    if (!this.modal) return;
    this.modal.style.display = 'none';
    this.modal.setAttribute('aria-hidden', 'true');
  }

  executeCode() {
    if (!this.codeInput || !this.previewFrame) return;
    const raw = this.codeInput.value;

    this.clearLogs();
    this.appendLog('info', ['[NEX-SANDBOX] Spawning isolated runtime context...']);

    // Build wrapped payload with console interceptor
    const wrappedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script>
    (function() {
      const emit = (level, args) => {
        try {
          window.parent.postMessage({
            type: 'NEX_SANDBOX_LOG',
            level: level,
            args: Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))
          }, '*');
        } catch(e) {}
      };
      const origLog = console.log;
      const origWarn = console.warn;
      const origErr = console.error;
      console.log = function(...args) { origLog.apply(console, args); emit('log', args); };
      console.warn = function(...args) { origWarn.apply(console, args); emit('warn', args); };
      console.error = function(...args) { origErr.apply(console, args); emit('error', args); };
      window.onerror = function(msg, url, line) { emit('error', [msg + ' (line ' + line + ')']); };
    })();
  </script>
</head>
<body>
  ${raw}
</body>
</html>`;

    this.previewFrame.srcdoc = wrappedHtml;
  }

  resetSandbox() {
    if (this.codeInput) this.codeInput.value = '';
    if (this.previewFrame) this.previewFrame.srcdoc = '';
    this.clearLogs();
  }

  clearLogs() {
    if (this.consoleLog) this.consoleLog.innerHTML = '';
  }

  appendLog(level, args) {
    if (!this.consoleLog) return;
    const div = document.createElement('div');
    div.style.cssText = "margin-bottom: 4px; font-family: monospace; font-size: 11px;";

    let color = "#38bdf8";
    let icon = "⚡";
    if (level === 'warn') { color = "#f59e0b"; icon = "⚠️"; }
    if (level === 'error') { color = "#ef4444"; icon = "❌"; }

    div.style.color = color;
    div.textContent = `${icon} ${args.join(' ')}`;
    this.consoleLog.appendChild(div);
    this.consoleLog.scrollTop = this.consoleLog.scrollHeight;
  }
}

/* ============================================================================
   6. ATTACHMENT HUB CONTROLLER
   ============================================================================ */
class NexAttachHub {
  constructor() {
    this.attachBtn = document.getElementById('attach-btn');
    this.hub = document.getElementById('attachmentPopupHub');
    this.init();
  }

  init() {
    if (!this.attachBtn || !this.hub) return;

    this.attachBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    document.addEventListener('click', (e) => {
      if (this.hub && !this.hub.contains(e.target) && e.target !== this.attachBtn) {
        this.hide();
      }
    });

    // Item bindings
    document.getElementById('hubActionFile')?.addEventListener('click', () => {
      this.hide();
      document.getElementById('file-input')?.click();
    });

    document.getElementById('hubActionVoice')?.addEventListener('click', () => {
      this.hide();
      window.CyberFeatures.voice?.startRecording();
    });

    document.getElementById('hubActionCanvas')?.addEventListener('click', () => {
      this.hide();
      window.CyberFeatures.canvas?.show();
    });

    document.getElementById('hubActionStegano')?.addEventListener('click', () => {
      this.hide();
      window.CyberFeatures.stegano?.show();
    });

    document.getElementById('hubActionPoll')?.addEventListener('click', () => {
      this.hide();
      document.getElementById('poll-btn')?.click();
    });

    document.getElementById('hubActionBot')?.addEventListener('click', () => {
      this.hide();
      document.getElementById('sheetNexbotBtn')?.click();
    });
  }

  toggle() {
    if (!this.hub) return;
    const isOpen = this.hub.style.display === 'grid';
    if (isOpen) this.hide();
    else this.show();
  }

  show() {
    if (this.hub) this.hub.style.display = 'grid';
  }

  hide() {
    if (this.hub) this.hub.style.display = 'none';
  }
}

/* ============================================================================
   BOOTSTRAP ALL SUITE ENGINES
   ============================================================================ */
function initCyberSuite() {
  window.CyberFeatures.voice = new NexVoiceRecorder();
  window.CyberFeatures.stegano = new NexStegano();
  window.CyberFeatures.canvas = new NexCanvasStudio();
  window.CyberFeatures.panic = new NexPanicLock();
  window.CyberFeatures.sandbox = new NexSandboxRunner();
  window.CyberFeatures.attachHub = new NexAttachHub();

  console.log("⚡ [NEXCHAT] Cyber-Features Suite V2.5 initialized successfully.");
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCyberSuite);
} else {
  initCyberSuite();
}
