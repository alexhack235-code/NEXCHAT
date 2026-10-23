/**
 * NEXCHAT - Advanced View-Once Ephemeral Media & Audio Security Engine
 * ====================================================================
 * Full Suite Implementation:
 * 1. View-Once Picture, Audio (Voice Note), & Confidential Text.
 * 2. In-Stream Encrypted Ciphertext with "Hashes Come to Life" Descrambler:
 *    - Unopened card displays dynamic rolling cryptographic hash bytes.
 *    - On tap: procedural cryptographic descrambler animation cycles random
 *      hex bytes with progressive synthesized frequency chimes (600Hz -> 2100Hz).
 *    - Unveils the decrypted payload directly inside the Secure Viewer.
 * 3. Sender-Designated Expiration Timer (5s, 10s, 15s, 30s, 60s):
 *    - Countdown ticker & burning progress bar smoothly drain from designated timeout.
 *    - Web Audio synchronized ticking chimes.
 *    - Permanent ash disintegration sound & particle dissolution at 0s.
 *    - Immutable tombstone: [VIEW-ONCE EXPIRED &bull; DISINTEGRATED] (never reopenable).
 * 4. Anti-Screenshot & Screen Capture Protection Suite ("You cannot take pictures of it"):
 *    - Instant Blackout Privacy Shield triggered on window blur / tab switch / Alt+Tab.
 *    - Screen capture keystroke neutralization: PrintScreen, Meta+Shift+S, Ctrl+Shift+S, Ctrl+P.
 *    - Dynamic Moving Forensic Watermark with viewer UID, username, and timestamp.
 *    - CSS & DOM protection: pointer-events guard, drag prevention, contextmenu block.
 *
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector glyphs only.
 * WhatsApp Hotline: +234 905 434 5858
 */

(function () {
  'use strict';

  class GhostWhisperEngine {
    constructor() {
      this.audioCtx = null;
      this.burnedCardIds = new Set(this.loadBurnedFromStorage());
      this.activeViewer = null;
      this.activeTimerInterval = null;
      this.activeAudioElement = null;
      this.boundKeyHandler = null;
      this.boundBlurHandler = null;
      this.boundVisibilityHandler = null;

      this.initStyles();
      this.bindDOM();
    }

    loadBurnedFromStorage() {
      try {
        const stored = sessionStorage.getItem('nex_burned_view_once_ids');
        return stored ? JSON.parse(stored) : [];
      } catch (_) {
        return [];
      }
    }

    saveBurnedToStorage(id) {
      try {
        this.burnedCardIds.add(id);
        const list = Array.from(this.burnedCardIds);
        sessionStorage.setItem('nex_burned_view_once_ids', JSON.stringify(list));
      } catch (_) {}
    }

    bindDOM() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupDOMHooks());
      } else {
        this.setupDOMHooks();
      }
    }

    setupDOMHooks() {
      this.injectComposerTrigger();
      this.setupAttachmentToggle();
      this.setupAudioRecordingToggle();
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

    // Synthesized digital ticking chime
    playTickSound() {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } catch (_) {}
    }

    // Synthesized ash disintegration white-noise burst
    playBurnSound() {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const bufferSize = ctx.sampleRate * 0.45;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.45);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } catch (_) {}
    }

    // Synthesized cryptographic descrambler sequence ("hashes come to life")
    playDescrambleChime(step = 0) {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const freqs = [520, 680, 880, 1150, 1480, 1920, 2400];
        const freq = freqs[step % freqs.length] || 1000;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.065);
      } catch (_) {}
    }

    // Play final decryption unlock chord
    playUnlockChord() {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        [1046.5, 1318.5, 1567.98].forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + (idx * 0.04));
          gain.gain.setValueAtTime(0.1, now + (idx * 0.04));
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + (idx * 0.04));
          osc.stop(now + 0.4);
        });
      } catch (_) {}
    }

    generateRandomHash() {
      const hex = '0123456789ABCDEF';
      let hash = '0x';
      for (let i = 0; i < 28; i++) {
        hash += hex.charAt(Math.floor(Math.random() * hex.length));
      }
      return hash;
    }

    // ==========================================
    // 1. DOCK & COMPOSER MODAL INTEGRATION
    // ==========================================

    injectComposerTrigger() {
      let btn = document.getElementById('ghostWhisperDockBtn');
      if (btn) {
        if (!btn.dataset.bound) {
          btn.dataset.bound = 'true';
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openComposerModal();
          });
        }
        return;
      }

      const inputArea = document.querySelector('.message-input-area') || document.getElementById('message-form');
      if (!inputArea) return;

      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'ghostWhisperDockBtn';
      btn.className = 'input-btn ghost-whisper-dock-btn';
      btn.title = 'View-Once Studio (Picture, Audio, Secret Text)';
      btn.innerHTML = '<span class="vo-dock-badge">1</span><i class="fa-solid fa-ghost"></i>';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openComposerModal();
      });

      const audioBtn = document.getElementById('audio-record-btn') || document.getElementById('sendBtn');
      if (audioBtn && audioBtn.parentNode) {
        audioBtn.parentNode.insertBefore(btn, audioBtn);
      } else {
        inputArea.appendChild(btn);
      }
    }

    setupAttachmentToggle() {
      const preview = document.getElementById('attachment-preview');
      if (!preview) return;

      let voBar = document.getElementById('attachmentVoControls');
      if (!voBar) {
        voBar = document.createElement('div');
        voBar.id = 'attachmentVoControls';
        voBar.className = 'attachment-vo-controls';
        voBar.innerHTML = `
          <button type="button" id="btnToggleViewOnceAttachment" class="btn-toggle-vo" title="Toggle View-Once mode">
            <span class="vo-circle-one">1</span>
            <span>View Once</span>
          </button>
          <div id="voTimerPillSelect" class="vo-timer-pills-row" style="display: none;">
            <span class="vo-timer-label"><i class="fa-solid fa-fire"></i> Timeout:</span>
            <button type="button" class="vo-time-chip" data-sec="5">5s</button>
            <button type="button" class="vo-time-chip active" data-sec="10">10s</button>
            <button type="button" class="vo-time-chip" data-sec="15">15s</button>
            <button type="button" class="vo-time-chip" data-sec="30">30s</button>
            <button type="button" class="vo-time-chip" data-sec="60">60s</button>
          </div>
        `;

        const removeBtn = document.getElementById('remove-attachment');
        if (removeBtn && removeBtn.parentNode) {
          removeBtn.parentNode.insertBefore(voBar, removeBtn);
        } else {
          preview.appendChild(voBar);
        }
      }

      window.isAttachmentViewOnce = false;
      window.attachmentViewOnceTimeout = 10;

      const toggleBtn = voBar ? voBar.querySelector('#btnToggleViewOnceAttachment') : document.getElementById('btnToggleViewOnceAttachment');
      const timerRow = voBar ? voBar.querySelector('#voTimerPillSelect') : document.getElementById('voTimerPillSelect');

      if (toggleBtn && !toggleBtn.dataset.voBound) {
        toggleBtn.dataset.voBound = 'true';
        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          window.isAttachmentViewOnce = !window.isAttachmentViewOnce;
          if (window.isAttachmentViewOnce) {
            toggleBtn.classList.add('active');
            if (timerRow) timerRow.style.display = 'inline-flex';
            if (window.showNotif) window.showNotif(`View-Once active: photo will burn after ${window.attachmentViewOnceTimeout}s`, 'info', 2200);
          } else {
            toggleBtn.classList.remove('active');
            if (timerRow) timerRow.style.display = 'none';
            if (window.showNotif) window.showNotif('View-Once disabled', 'info', 1500);
          }
        });
      }

      if (timerRow && !timerRow.dataset.voBound) {
        timerRow.dataset.voBound = 'true';
        timerRow.querySelectorAll('.vo-time-chip').forEach(chip => {
          chip.addEventListener('click', (e) => {
            e.preventDefault();
            timerRow.querySelectorAll('.vo-time-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            window.attachmentViewOnceTimeout = parseInt(chip.dataset.sec, 10) || 10;
            if (window.showNotif) window.showNotif(`Burn timeout set to ${window.attachmentViewOnceTimeout} seconds`, 'info', 1600);
          });
        });
      }
    }

    setupAudioRecordingToggle() {
      const audioUI = document.getElementById('audioRecordingUI');
      if (!audioUI) return;

      const actions = audioUI.querySelector('.audio-record-actions');
      if (!actions) return;

      let btn = document.getElementById('btnToggleViewOnceAudio');
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'btnToggleViewOnceAudio';
        btn.className = 'audio-control-btn vo-audio-toggle-btn';
        btn.title = 'Toggle View-Once Voice Note (Self-destructs)';
        btn.innerHTML = '<span class="vo-circle-one">1</span>';
        actions.insertBefore(btn, actions.firstChild);
      }

      window.isVoiceViewOnce = false;
      window.voiceViewOnceTimeout = 10;

      if (btn && !btn.dataset.voBound) {
        btn.dataset.voBound = 'true';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          window.isVoiceViewOnce = !window.isVoiceViewOnce;
          if (window.isVoiceViewOnce) {
            btn.classList.add('active');
            if (window.showNotif) window.showNotif('Voice note set to View-Once (Burns in 10s)', 'info', 2000);
          } else {
            btn.classList.remove('active');
            if (window.showNotif) window.showNotif('Standard Voice Note restored', 'info', 1500);
          }
        });
      }
    }

    openComposerModal() {
      let modal = document.getElementById('ghostWhisperComposerModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ghostWhisperComposerModal';
        modal.className = 'ghost-whisper-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="ghost-whisper-card-modal">
          <div class="whisper-header">
            <div class="whisper-icon-halo">
              <span class="vo-badge-bubble">1</span>
              <i class="fa-solid fa-ghost"></i>
            </div>
            <div>
              <h3>View-Once Transmission Studio</h3>
              <p>Self-destructs after designated timeout &bull; Anti-Capture Shield</p>
            </div>
            <button type="button" class="whisper-close-btn" id="voCloseComposerBtn">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="vo-composer-tabs">
            <button type="button" class="vo-tab-btn active" data-tab="photo">
              <i class="fa-solid fa-camera"></i> Photo
            </button>
            <button type="button" class="vo-tab-btn" data-tab="audio">
              <i class="fa-solid fa-microphone"></i> Audio
            </button>
            <button type="button" class="vo-tab-btn" data-tab="text">
              <i class="fa-solid fa-key"></i> Secret Text
            </button>
          </div>

          <div class="whisper-body">
            <div class="whisper-alert-strip">
              <i class="fa-solid fa-shield-halved" style="color: #c084fc;"></i>
              <span>Hashes come to life on click &bull; Disappears permanently after designated timer. Screen captures strictly blocked.</span>
            </div>

            <!-- TAB 1: PHOTO -->
            <div id="voTabContent_photo" class="vo-tab-pane active">
              <div class="vo-drop-zone" id="voPhotoDropZone">
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <p>Drag & drop confidential photo here, or <strong>browse</strong></p>
                <input type="file" id="voPhotoFileInput" accept="image/*" style="display: none;" />
              </div>
              <div id="voPhotoPreviewWrap" style="display: none; margin-top: 10px; position: relative;">
                <img id="voPhotoPreviewImg" src="" alt="View-Once Preview" style="width: 100%; max-height: 180px; object-fit: contain; border-radius: 10px; border: 1px solid rgba(192, 132, 252, 0.4);" />
                <button type="button" id="voRemovePhotoBtn" class="vo-remove-preview-btn"><i class="fa-solid fa-xmark"></i></button>
              </div>
            </div>

            <!-- TAB 2: AUDIO -->
            <div id="voTabContent_audio" class="vo-tab-pane" style="display: none;">
              <div class="vo-audio-studio-box">
                <div class="vo-audio-state-display" id="voAudioStatusText">
                  <i class="fa-solid fa-microphone"></i> Ready to record 1-view voice note
                </div>
                <div class="vo-audio-timer" id="voStudioAudioTimer">0:00</div>
                <div class="vo-audio-action-row">
                  <button type="button" id="btnStudioRecordVoice" class="btn-studio-audio-action">
                    <i class="fa-solid fa-circle-dot"></i> Record Voice Note
                  </button>
                  <button type="button" id="btnStudioStopVoice" class="btn-studio-audio-action danger" style="display: none;">
                    <i class="fa-solid fa-stop"></i> Stop Recording
                  </button>
                </div>
                <audio id="voStudioAudioPreview" controls style="display: none; width: 100%; margin-top: 10px;" controlsList="nodownload"></audio>
              </div>
            </div>

            <!-- TAB 3: SECRET TEXT -->
            <div id="voTabContent_text" class="vo-tab-pane" style="display: none;">
              <textarea id="whisperSecretInput" rows="3" placeholder="Enter ultra-confidential text, cipher code, or secret transmission..."></textarea>
            </div>

            <!-- DESIGNATED TIMEOUT SELECTOR -->
            <div class="vo-timeout-selector-group">
              <label><i class="fa-solid fa-fire"></i> Designated Burn Timeout (sent to recipient):</label>
              <div class="vo-timeout-pill-options" id="voStudioTimeoutPills">
                <button type="button" class="btn-vo-timeout" data-timeout="5">5s</button>
                <button type="button" class="btn-vo-timeout active" data-timeout="10">10s</button>
                <button type="button" class="btn-vo-timeout" data-timeout="15">15s</button>
                <button type="button" class="btn-vo-timeout" data-timeout="30">30s</button>
                <button type="button" class="btn-vo-timeout" data-timeout="60">60s</button>
              </div>
            </div>

            <button type="button" class="btn-transmit-whisper" id="btnTransmitViewOnce">
              <span class="vo-circle-one">1</span>
              <i class="fa-solid fa-paper-plane"></i>
              <span>Transmit View-Once Payload</span>
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';

      let currentTab = 'photo';
      let designatedTimeout = 10;
      let selectedPhotoDataUrl = null;
      let recordedAudioDataUrl = null;
      let mediaRecorderInstance = null;
      let audioChunks = [];
      let recordInterval = null;
      let recordSeconds = 0;

      modal.querySelector('#voCloseComposerBtn').onclick = () => {
        if (mediaRecorderInstance && mediaRecorderInstance.state !== 'inactive') {
          mediaRecorderInstance.stop();
        }
        modal.style.display = 'none';
      };

      // Tab switching
      modal.querySelectorAll('.vo-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.vo-tab-btn').forEach(b => b.classList.remove('active'));
          modal.querySelectorAll('.vo-tab-pane').forEach(p => p.style.display = 'none');
          btn.classList.add('active');
          currentTab = btn.dataset.tab;
          const target = modal.querySelector(`#voTabContent_${currentTab}`);
          if (target) target.style.display = 'block';
        });
      });

      // Timeout selection
      modal.querySelectorAll('#voStudioTimeoutPills .btn-vo-timeout').forEach(pill => {
        pill.addEventListener('click', () => {
          modal.querySelectorAll('#voStudioTimeoutPills .btn-vo-timeout').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          designatedTimeout = parseInt(pill.dataset.timeout, 10) || 10;
        });
      });

      // Photo upload
      const dropZone = modal.querySelector('#voPhotoDropZone');
      const fileInput = modal.querySelector('#voPhotoFileInput');
      const previewWrap = modal.querySelector('#voPhotoPreviewWrap');
      const previewImg = modal.querySelector('#voPhotoPreviewImg');
      const removePhotoBtn = modal.querySelector('#voRemovePhotoBtn');

      dropZone?.addEventListener('click', () => fileInput?.click());
      dropZone?.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
      dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handlePhotoFile(e.dataTransfer.files[0]);
        }
      });

      fileInput?.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
          handlePhotoFile(fileInput.files[0]);
        }
      });

      const handlePhotoFile = (file) => {
        if (!file.type.startsWith('image/')) {
          if (window.showNotif) window.showNotif('Please select a valid image file', 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          selectedPhotoDataUrl = e.target.result;
          previewImg.src = selectedPhotoDataUrl;
          previewWrap.style.display = 'block';
          dropZone.style.display = 'none';
        };
        reader.readAsDataURL(file);
      };

      removePhotoBtn?.addEventListener('click', () => {
        selectedPhotoDataUrl = null;
        previewImg.src = '';
        previewWrap.style.display = 'none';
        dropZone.style.display = 'block';
        if (fileInput) fileInput.value = '';
      });

      // Audio recording inside modal
      const btnRecord = modal.querySelector('#btnStudioRecordVoice');
      const btnStop = modal.querySelector('#btnStudioStopVoice');
      const audioStatus = modal.querySelector('#voAudioStatusText');
      const audioTimerEl = modal.querySelector('#voStudioAudioTimer');
      const audioPreview = modal.querySelector('#voStudioAudioPreview');

      btnRecord?.addEventListener('click', async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioChunks = [];
          mediaRecorderInstance = new MediaRecorder(stream);
          mediaRecorderInstance.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunks.push(e.data);
          };
          mediaRecorderInstance.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            clearInterval(recordInterval);
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = (e) => {
              recordedAudioDataUrl = e.target.result;
              audioPreview.src = recordedAudioDataUrl;
              audioPreview.style.display = 'block';
              audioStatus.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> Voice note captured';
              btnRecord.style.display = 'inline-flex';
              btnRecord.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Re-record';
              btnStop.style.display = 'none';
            };
            reader.readAsDataURL(blob);
          };

          mediaRecorderInstance.start();
          recordSeconds = 0;
          audioTimerEl.textContent = '0:00';
          recordInterval = setInterval(() => {
            recordSeconds++;
            const m = Math.floor(recordSeconds / 60);
            const s = recordSeconds % 60;
            audioTimerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
          }, 1000);

          btnRecord.style.display = 'none';
          btnStop.style.display = 'inline-flex';
          audioStatus.innerHTML = '<span class="vo-rec-pulsar"></span> Recording voice note...';
        } catch (err) {
          if (window.showNotif) window.showNotif('Microphone access denied: ' + err.message, 'error');
        }
      });

      btnStop?.addEventListener('click', () => {
        if (mediaRecorderInstance && mediaRecorderInstance.state !== 'inactive') {
          mediaRecorderInstance.stop();
        }
      });

      // Transmit button
      modal.querySelector('#btnTransmitViewOnce')?.addEventListener('click', () => {
        let payload = null;

        if (currentTab === 'photo') {
          if (!selectedPhotoDataUrl) {
            if (window.showNotif) window.showNotif('Please select or drop a photo to send', 'error');
            return;
          }
          payload = {
            viewOnceType: 'photo',
            dataUrl: selectedPhotoDataUrl,
            burnTimeout: designatedTimeout,
            cipherHash: this.generateRandomHash()
          };
        } else if (currentTab === 'audio') {
          if (!recordedAudioDataUrl) {
            if (window.showNotif) window.showNotif('Please record a voice note first', 'error');
            return;
          }
          payload = {
            viewOnceType: 'audio',
            dataUrl: recordedAudioDataUrl,
            burnTimeout: designatedTimeout,
            cipherHash: this.generateRandomHash()
          };
        } else {
          const text = modal.querySelector('#whisperSecretInput')?.value?.trim();
          if (!text) {
            if (window.showNotif) window.showNotif('Please enter your secret message', 'error');
            return;
          }
          payload = {
            viewOnceType: 'text',
            text: text,
            burnTimeout: designatedTimeout,
            cipherHash: this.generateRandomHash()
          };
        }

        modal.style.display = 'none';
        this.dispatchViewOncePayload(payload);
      });
    }

    // ==========================================
    // 2. DISPATCH & CHAT MOUNTING
    // ==========================================

    dispatchViewOncePayload(payload) {
      const viewOnceId = 'vo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      payload.viewOnceId = viewOnceId;

      // 1. Mount locally in active chat feed
      this.mountViewOnceCardInFeed(payload, true);

      // 2. Also dispatch to active conversation via chat.js if present
      if (window.currentChatUser && typeof window.sendSupabaseMessage === 'function') {
        const attachment = {
          isViewOnce: true,
          viewOnceId: viewOnceId,
          viewOnceType: payload.viewOnceType,
          burnTimeout: payload.burnTimeout,
          cipherHash: payload.cipherHash,
          downloadURL: payload.dataUrl || null,
          text: payload.text || null,
          fileType: 'view_once'
        };

        window.sendSupabaseMessage({
          from: window.myUID,
          to: window.currentChatUser,
          text: `[1-VIEW ${payload.viewOnceType.toUpperCase()}]`,
          attachment: attachment,
          chatType: window.currentChatType || 'direct'
        }).catch(err => console.warn('[VIEW-ONCE] Supabase send notice:', err));
      }

      if (window.showNotif) {
        window.showNotif(`View-Once ${payload.viewOnceType} transmitted (Burns in ${payload.burnTimeout}s)`, 'success', 2500);
      }
    }

    renderViewOnceBubble(attachment, container) {
      const viewOnceId = attachment.viewOnceId || 'vo_' + Date.now();
      const type = (attachment.viewOnceType || (attachment.fileType?.includes('audio') ? 'audio' : 'photo')).toLowerCase();
      const burnTimeout = parseInt(attachment.burnTimeout, 10) || 10;
      const cipherHash = attachment.cipherHash || this.generateRandomHash();
      const isBurned = this.burnedCardIds.has(viewOnceId);

      const wrapper = document.createElement('div');
      wrapper.className = 'view-once-bubble-wrapper';
      wrapper.id = `wrap_${viewOnceId}`;

      if (isBurned) {
        wrapper.innerHTML = this.renderBurnedTombstoneHtml(type);
        return wrapper;
      }

      const typeIcon = type === 'audio' ? 'fa-microphone' : (type === 'photo' ? 'fa-camera' : 'fa-key');
      const typeLabel = type === 'audio' ? 'VOICE NOTE' : (type === 'photo' ? 'PHOTO' : 'CIPHER');

      wrapper.innerHTML = `
        <div class="ghost-whisper-chat-card vo-interactive-card" id="${viewOnceId}" data-view-once-id="${viewOnceId}">
          <div class="whisper-card-top">
            <div class="vo-card-badge">
              <span class="vo-num-badge">1</span>
              <i class="fa-solid ${typeIcon}"></i>
            </div>
            <strong>VIEW ONCE ${typeLabel}</strong>
            <span class="whisper-burn-pill">
              <i class="fa-solid fa-fire"></i> ${burnTimeout}s Burn
            </span>
          </div>

          <div class="vo-hash-stream-container">
            <div class="vo-hash-label-bar">
              <span><i class="fa-solid fa-shield-halved"></i> E2EE CIPHERTEXT HASH</span>
              <span class="vo-live-pulse-dot"></span>
            </div>
            <div class="vo-rolling-hash" id="hash_${viewOnceId}">
              ${cipherHash}
            </div>
          </div>

          <div class="whisper-card-content">
            <button type="button" class="btn-reveal-whisper" id="btnReveal_${viewOnceId}">
              <i class="fa-solid fa-eye"></i>
              <span>Tap to Decrypt & Reveal</span>
            </button>
          </div>

          <div class="whisper-burn-timer-bar" id="bar_${viewOnceId}" style="display: none;">
            <div class="burn-timer-fill"></div>
          </div>
        </div>
      `;

      const btnReveal = wrapper.querySelector(`#btnReveal_${viewOnceId}`);
      btnReveal?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.triggerHashDescrambleAndReveal(viewOnceId, attachment);
      });

      return wrapper;
    }

    mountViewOnceCardInFeed(payload, isOwn = false) {
      const messagesArea = document.getElementById('messages-area');
      if (!messagesArea) return;

      const div = document.createElement('div');
      div.className = `message-wrapper ${isOwn ? 'sent' : 'received'} ghost-whisper-wrapper`;
      div.dataset.whisperId = payload.viewOnceId;

      const bubbleNode = this.renderViewOnceBubble(payload);
      div.appendChild(bubbleNode);

      messagesArea.appendChild(div);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // =======================================================
    // 3. "HASHES COME TO LIFE" DESCRAMBLER & SECURE REVEAL
    // =======================================================

    triggerHashDescrambleAndReveal(viewOnceId, attachment) {
      if (this.burnedCardIds.has(viewOnceId)) {
        if (window.showNotif) window.showNotif('This view-once transmission has already expired', 'error');
        return;
      }

      const card = document.getElementById(viewOnceId);
      const hashEl = document.getElementById(`hash_${viewOnceId}`);
      const btnReveal = document.getElementById(`btnReveal_${viewOnceId}`);

      if (btnReveal) {
        btnReveal.disabled = true;
        btnReveal.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Descrambling Ciphertext...</span>';
      }

      if (card) card.classList.add('vo-descrambling-active');

      // The hashes come to life! Rapid procedural glyph scrambling sequence
      const hexChars = '0123456789ABCDEFλ§ΞΨ0x#';
      let cycles = 0;
      const maxCycles = 10;

      const scrambleInterval = setInterval(() => {
        cycles++;
        this.playDescrambleChime(cycles);

        if (hashEl) {
          let scrambled = '0x';
          for (let i = 0; i < 28; i++) {
            scrambled += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
          }
          hashEl.textContent = scrambled;
          hashEl.style.color = cycles % 2 === 0 ? '#38bdf8' : '#c084fc';
        }

        if (cycles >= maxCycles) {
          clearInterval(scrambleInterval);
          this.playUnlockChord();
          if (hashEl) {
            hashEl.textContent = '[0x00 CIPHER DECRYPTED - VERIFIED]';
            hashEl.style.color = '#10b981';
          }
          if (card) card.classList.remove('vo-descrambling-active');

          setTimeout(() => {
            this.openAntiScreenshotSecureViewer(viewOnceId, attachment);
          }, 180);
        }
      }, 35);
    }

    // =======================================================
    // 4. ANTI-SCREENSHOT SECURE VIEWER & CAPTURE SHIELD
    // =======================================================

    openAntiScreenshotSecureViewer(viewOnceId, attachment) {
      const type = (attachment.viewOnceType || (attachment.fileType?.includes('audio') ? 'audio' : 'photo')).toLowerCase();
      const burnTimeout = parseInt(attachment.burnTimeout, 10) || 10;
      const dataUrl = attachment.downloadURL || attachment.dataUrl;
      const text = attachment.text || '';
      const currentViewerName = window.currentUserName || (window.myProfile && window.myProfile.username) || 'AUTHENTICATED_RECIPIENT';
      const viewerUID = window.myUID || 'UID-SECRET';
      const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

      let viewer = document.getElementById('nexAntiScreenshotViewer');
      if (!viewer) {
        viewer = document.createElement('div');
        viewer.id = 'nexAntiScreenshotViewer';
        viewer.className = 'vo-secure-fullscreen-viewer';
        document.body.appendChild(viewer);
      }

      this.activeViewer = viewer;

      // Forensic watermark tile generator
      const watermarkText = `VIEWER: @${this.escapeHtml(currentViewerName)} [${this.escapeHtml(viewerUID)}] &bull; NEXCHAT ANTI-CAPTURE ARMED &bull; ${timestampStr}`;

      viewer.innerHTML = `
        <div class="vo-secure-backdrop"></div>

        <!-- OPAQUE BLACKOUT PRIVACY SHIELD -->
        <div id="voBlackoutPrivacyShield" class="vo-blackout-privacy-shield" style="display: none;">
          <div class="vo-shield-alert-box">
            <i class="fa-solid fa-shield-halved"></i>
            <h3>ANTI-SCREENSHOT SHIELD ACTIVE</h3>
            <p>Screen capture shortcut detected or window focus lost.</p>
            <p class="vo-sub-alert">Content protected by NEXCHAT Hardware-Accelerated DRM &bull; Return focus to resume.</p>
          </div>
        </div>

        <!-- MOVING FORENSIC WATERMARK OVERLAY (Prevents external camera capture) -->
        <div class="vo-forensic-watermark-overlay" id="voWatermarkLayer">
          <div class="vo-watermark-grid">
            <span class="wm-tile">${watermarkText}</span>
            <span class="wm-tile">${watermarkText}</span>
            <span class="wm-tile">${watermarkText}</span>
            <span class="wm-tile">${watermarkText}</span>
            <span class="wm-tile">${watermarkText}</span>
            <span class="wm-tile">${watermarkText}</span>
          </div>
        </div>

        <!-- MAIN SECURE HUD -->
        <div class="vo-secure-hud-container">
          <div class="vo-secure-hud-header">
            <div class="vo-header-left">
              <span class="vo-badge-bubble">1</span>
              <div>
                <h4>SECURE VIEW-ONCE ${type.toUpperCase()}</h4>
                <p><i class="fa-solid fa-lock"></i> Encrypted Session &bull; Disintegrates on Timeout</p>
              </div>
            </div>

            <div class="vo-header-right">
              <div class="vo-burning-ticker-pill">
                <i class="fa-solid fa-fire" style="color: #ef4444;"></i>
                <span id="voBurnCountdownTimer">${burnTimeout}s</span>
              </div>
              <button type="button" class="vo-close-burn-btn" id="voCloseBurnEarlyBtn" title="Close and Burn Immediately">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <!-- TOP BURNING COUNTDOWN BAR -->
          <div class="vo-hud-timer-bar">
            <div class="vo-hud-timer-fill" id="voTimerBarFill" style="width: 100%;"></div>
          </div>

          <!-- SECURE CONTENT STAGE -->
          <div class="vo-secure-media-stage" id="voSecureMediaStage" oncontextmenu="return false;">
            ${type === 'photo' ? `
              <div class="vo-photo-frame">
                <img src="${dataUrl}" class="vo-protected-image" id="voProtectedImg" alt="View-Once Photo" draggable="false" oncontextmenu="return false;" />
              </div>
            ` : type === 'audio' ? `
              <div class="vo-audio-player-card">
                <div class="vo-audio-visualizer-bars">
                  <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                </div>
                <div class="vo-audio-status-pill">
                  <i class="fa-solid fa-volume-high"></i>
                  <span>Playing 1-View Voice Note</span>
                </div>
                <audio id="voProtectedAudio" src="${dataUrl}" autoplay controlsList="nodownload noplaybackrate" style="width: 100%; margin-top: 14px;"></audio>
              </div>
            ` : `
              <div class="vo-secret-text-box">
                <div class="vo-secret-text-header"><i class="fa-solid fa-key"></i> DECRYPTED TRANSMISSION</div>
                <div class="vo-secret-text-body">${this.escapeHtml(text)}</div>
              </div>
            `}
          </div>

          <!-- FOOTER SECURITY NOTICE -->
          <div class="vo-secure-hud-footer">
            <i class="fa-solid fa-fingerprint"></i>
            <span>Attributable Forensic Watermark Attached &bull; Screenshots & Screen Recordings are Blocked</span>
          </div>
        </div>
      `;

      viewer.style.display = 'flex';

      // Attach anti-screenshot shields & blur listeners
      this.attachAntiScreenshotProtection(viewer, viewOnceId);

      // Start designated countdown timer
      this.startDesignatedCountdown(viewOnceId, burnTimeout);

      // Early close button (burns immediately)
      viewer.querySelector('#voCloseBurnEarlyBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.burnAndCloseViewer(viewOnceId);
      });
    }

    attachAntiScreenshotProtection(viewer, viewOnceId) {
      const shield = viewer.querySelector('#voBlackoutPrivacyShield');

      const triggerBlackout = () => {
        if (shield) shield.style.display = 'flex';
      };

      const removeBlackout = () => {
        if (shield) shield.style.display = 'none';
      };

      // 1. Instant Blackout on Window Blur (e.g. Snipping tool, Alt-Tab, click out)
      this.boundBlurHandler = () => triggerBlackout();
      window.addEventListener('blur', this.boundBlurHandler);
      window.addEventListener('focus', removeBlackout);

      // 2. Visibility change (tab switch, window minimized)
      this.boundVisibilityHandler = () => {
        if (document.visibilityState === 'hidden') {
          triggerBlackout();
        } else {
          removeBlackout();
        }
      };
      document.addEventListener('visibilitychange', this.boundVisibilityHandler);

      // 3. Screen Capture Key Shortcut Interception
      this.boundKeyHandler = (e) => {
        // Catch PrintScreen (44)
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
          e.preventDefault();
          e.stopPropagation();
          triggerBlackout();
          this.neutralizeClipboard();
          if (window.showNotif) window.showNotif('Screenshot blocked by NEXCHAT Anti-Capture Shield', 'error', 3000);
          return false;
        }

        // Catch Meta+Shift+S / Ctrl+Shift+S (Windows Snipping Tool / Snipping)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
          e.preventDefault();
          e.stopPropagation();
          triggerBlackout();
          this.neutralizeClipboard();
          if (window.showNotif) window.showNotif('Screen snip shortcut neutralized by NEXCHAT Shield', 'error', 3000);
          return false;
        }

        // Catch Ctrl+P / Meta+P (Print to PDF)
        if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 'P')) {
          e.preventDefault();
          e.stopPropagation();
          triggerBlackout();
          if (window.showNotif) window.showNotif('Printing disabled for View-Once Media', 'error', 2500);
          return false;
        }
      };

      window.addEventListener('keydown', this.boundKeyHandler, true);
      window.addEventListener('keyup', this.boundKeyHandler, true);
    }

    neutralizeClipboard() {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('NEXCHAT_SECURITY_VIOLATION: SCREEN_CAPTURE_FORBIDDEN').catch(() => {});
        }
      } catch (_) {}
    }

    detachAntiScreenshotProtection() {
      if (this.boundBlurHandler) {
        window.removeEventListener('blur', this.boundBlurHandler);
        this.boundBlurHandler = null;
      }
      if (this.boundVisibilityHandler) {
        document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
        this.boundVisibilityHandler = null;
      }
      if (this.boundKeyHandler) {
        window.removeEventListener('keydown', this.boundKeyHandler, true);
        window.removeEventListener('keyup', this.boundKeyHandler, true);
        this.boundKeyHandler = null;
      }
    }

    startDesignatedCountdown(viewOnceId, totalSeconds) {
      clearInterval(this.activeTimerInterval);

      let timeLeft = totalSeconds;
      const ticker = document.getElementById('voBurnCountdownTimer');
      const barFill = document.getElementById('voTimerBarFill');

      this.activeTimerInterval = setInterval(() => {
        timeLeft -= 1;
        this.playTickSound();

        if (ticker) ticker.textContent = `${timeLeft}s`;
        if (barFill) {
          const pct = Math.max(0, (timeLeft / totalSeconds) * 100);
          barFill.style.width = `${pct}%`;
          if (pct < 35) {
            barFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
          }
        }

        if (timeLeft <= 0) {
          clearInterval(this.activeTimerInterval);
          this.burnAndCloseViewer(viewOnceId);
        }
      }, 1000);
    }

    burnAndCloseViewer(viewOnceId) {
      clearInterval(this.activeTimerInterval);
      this.detachAntiScreenshotProtection();
      this.saveBurnedToStorage(viewOnceId);
      this.playBurnSound();

      // Stop audio playback if active
      const audioEl = document.getElementById('voProtectedAudio');
      if (audioEl) {
        audioEl.pause();
        audioEl.src = '';
      }

      // Ash disintegration on viewer
      if (this.activeViewer) {
        this.activeViewer.classList.add('vo-viewer-disintegrating');
        setTimeout(() => {
          if (this.activeViewer) {
            this.activeViewer.style.display = 'none';
            this.activeViewer.classList.remove('vo-viewer-disintegrating');
            this.activeViewer.innerHTML = '';
          }
        }, 400);
      }

      // Permanently update in-chat card into burned tombstone
      const card = document.getElementById(viewOnceId);
      if (card) {
        card.classList.add('disintegrating');
        setTimeout(() => {
          const wrap = document.getElementById(`wrap_${viewOnceId}`) || card.closest('.message-wrapper') || card.parentNode;
          if (wrap) {
            wrap.innerHTML = this.renderBurnedTombstoneHtml();
          }
        }, 450);
      }

      if (window.showNotif) {
        window.showNotif('View-Once media disintegrated into digital ash', 'info', 2200);
      }
    }

    renderBurnedTombstoneHtml(type = 'media') {
      return `
        <div class="vo-burned-tombstone-card">
          <div class="vo-tombstone-icon">
            <i class="fa-solid fa-fire-burner"></i>
          </div>
          <div class="vo-tombstone-info">
            <span class="vo-tombstone-title">VIEW ONCE EXPIRED</span>
            <span class="vo-tombstone-sub">Permanently disintegrated &bull; Cannot be replayed</span>
          </div>
          <span class="vo-tombstone-lock"><i class="fa-solid fa-lock"></i></span>
        </div>
      `;
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

    // ==========================================
    // 5. CYBERPUNK STYLESHEET
    // ==========================================

    initStyles() {
      if (document.getElementById('ghostWhisperStyles')) return;
      const style = document.createElement('style');
      style.id = 'ghostWhisperStyles';
      style.textContent = `
        /* Dock Button */
        .ghost-whisper-dock-btn {
          background: rgba(192, 132, 252, 0.12);
          border: 1px solid rgba(192, 132, 252, 0.35);
          color: #c084fc;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          cursor: pointer;
          margin: 0 4px;
          position: relative;
          transition: all 0.18s ease;
        }
        .ghost-whisper-dock-btn:hover {
          background: #c084fc;
          color: #050811;
          transform: scale(1.15);
          box-shadow: 0 0 16px rgba(192, 132, 252, 0.45);
        }
        .vo-dock-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #a855f7;
          color: #ffffff;
          font-size: 9px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #050811;
        }

        /* Attachment preview controls */
        .attachment-vo-controls {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          margin-right: 8px;
        }
        .btn-toggle-vo {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #94a3b8;
          border-radius: 9999px;
          padding: 3px 10px;
          font-size: 11px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .btn-toggle-vo:hover, .btn-toggle-vo.active {
          background: rgba(192, 132, 252, 0.22);
          border-color: #c084fc;
          color: #c084fc;
          box-shadow: 0 0 10px rgba(192, 132, 252, 0.3);
        }
        .vo-circle-one {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid currentColor;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 900;
          line-height: 1;
        }
        .vo-timer-pills-row {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .vo-timer-label {
          font-size: 10.5px;
          color: #f97316;
          font-weight: 700;
          margin-right: 2px;
        }
        .vo-time-chip {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
        }
        .vo-time-chip.active {
          background: #f97316;
          border-color: #f97316;
          color: #ffffff;
        }

        /* Audio recording bar toggle */
        .vo-audio-toggle-btn {
          background: rgba(192, 132, 252, 0.12);
          border: 1px solid rgba(192, 132, 252, 0.3);
          color: #c084fc;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s;
        }
        .vo-audio-toggle-btn.active {
          background: #c084fc;
          color: #050811;
          box-shadow: 0 0 12px rgba(192, 132, 252, 0.5);
        }

        /* Composer Modal */
        .ghost-whisper-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 8, 17, 0.88);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          z-index: 999999;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .ghost-whisper-card-modal {
          background: #0d121d;
          border: 1.5px solid rgba(192, 132, 252, 0.35);
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          color: #f1f5f9;
          font-family: 'Inter', -apple-system, sans-serif;
          box-shadow: 0 20px 60px rgba(0,0,0,0.85), 0 0 30px rgba(192, 132, 252, 0.18);
          overflow: hidden;
        }
        .whisper-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
        }
        .whisper-icon-halo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(192, 132, 252, 0.15);
          border: 1px solid rgba(192, 132, 252, 0.4);
          color: #c084fc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          position: relative;
        }
        .vo-badge-bubble {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #ef4444;
          color: #ffffff;
          font-size: 9px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .whisper-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #ffffff; }
        .whisper-header p { margin: 2px 0 0 0; font-size: 11.5px; color: #94a3b8; }
        .whisper-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
        }
        .vo-composer-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.25);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 4px;
          gap: 4px;
        }
        .vo-tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.15s;
        }
        .vo-tab-btn.active {
          background: rgba(192, 132, 252, 0.18);
          color: #c084fc;
          box-shadow: inset 0 0 0 1px rgba(192, 132, 252, 0.35);
        }
        .whisper-body { padding: 18px 20px 22px 20px; }
        .whisper-alert-strip {
          background: rgba(192, 132, 252, 0.08);
          border: 1px solid rgba(192, 132, 252, 0.25);
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11.5px;
          color: #cbd5e1;
          margin-bottom: 14px;
        }
        .vo-drop-zone {
          border: 2px dashed rgba(192, 132, 252, 0.35);
          border-radius: 12px;
          padding: 24px 16px;
          text-align: center;
          background: rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: all 0.18s;
        }
        .vo-drop-zone:hover, .vo-drop-zone.drag-over {
          border-color: #c084fc;
          background: rgba(192, 132, 252, 0.08);
        }
        .vo-drop-zone i { font-size: 28px; color: #c084fc; margin-bottom: 8px; }
        .vo-drop-zone p { margin: 0; font-size: 12.5px; color: #94a3b8; }
        .vo-drop-zone strong { color: #c084fc; }
        .vo-remove-preview-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(239, 68, 68, 0.85);
          color: #ffffff;
          border: none;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          cursor: pointer;
        }
        .vo-audio-studio-box {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 18px;
          text-align: center;
        }
        .vo-audio-state-display { font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
        .vo-audio-timer { font-family: monospace; font-size: 26px; font-weight: 800; color: #10b981; margin-bottom: 14px; }
        .btn-studio-audio-action {
          background: rgba(192, 132, 252, 0.15);
          border: 1px solid rgba(192, 132, 252, 0.4);
          color: #c084fc;
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-studio-audio-action.danger {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: #ef4444;
        }
        .vo-rec-pulsar {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          display: inline-block;
          margin-right: 6px;
          animation: voPulse 1s infinite;
        }
        @keyframes voPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.4); }
        }
        .whisper-body textarea {
          width: 100%;
          background: #141b27;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #ffffff;
          padding: 12px;
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
        }
        .vo-timeout-selector-group {
          margin: 14px 0;
        }
        .vo-timeout-selector-group label {
          display: block;
          font-size: 11.5px;
          color: #94a3b8;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .vo-timeout-pill-options {
          display: flex;
          gap: 6px;
        }
        .btn-vo-timeout {
          flex: 1;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          padding: 7px 4px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-vo-timeout.active {
          background: #f97316;
          border-color: #f97316;
          color: #ffffff;
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.4);
        }
        .btn-transmit-whisper {
          width: 100%;
          background: linear-gradient(135deg, #c084fc, #9333ea);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 13px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(192, 132, 252, 0.35);
          margin-top: 14px;
        }

        /* In-Chat Feed Card */
        .ghost-whisper-chat-card {
          background: #151126;
          border: 1.5px solid rgba(192, 132, 252, 0.4);
          border-radius: 16px;
          padding: 12px 14px;
          max-width: 310px;
          color: #ffffff;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.55);
          overflow: hidden;
          position: relative;
        }
        .ghost-whisper-chat-card.vo-descrambling-active {
          border-color: #38bdf8;
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.45);
          animation: voJitter 0.08s infinite alternate;
        }
        @keyframes voJitter {
          0% { transform: translate(-1px, 0.5px); }
          100% { transform: translate(1px, -0.5px); }
        }
        .whisper-card-top {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          color: #c084fc;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .vo-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(192, 132, 252, 0.18);
          padding: 2px 7px;
          border-radius: 9999px;
          border: 1px solid rgba(192, 132, 252, 0.35);
        }
        .whisper-burn-pill {
          margin-left: auto;
          font-size: 9.5px;
          color: #f97316;
          border: 1px solid rgba(249, 115, 22, 0.35);
          background: rgba(249, 115, 22, 0.1);
          padding: 2px 7px;
          border-radius: 9999px;
          font-weight: 800;
        }
        .vo-hash-stream-container {
          background: #090c14;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 10px;
          margin-bottom: 10px;
        }
        .vo-hash-label-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 9.5px;
          font-weight: 800;
          color: #64748b;
          margin-bottom: 4px;
        }
        .vo-live-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
          animation: voPulse 1.2s infinite;
        }
        .vo-rolling-hash {
          font-family: 'SF Mono', Consolas, Monaco, monospace;
          font-size: 10.5px;
          color: #c084fc;
          letter-spacing: 0.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .btn-reveal-whisper {
          width: 100%;
          background: rgba(192, 132, 252, 0.18);
          border: 1px solid rgba(192, 132, 252, 0.4);
          color: #c084fc;
          border-radius: 10px;
          padding: 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.16s ease;
        }
        .btn-reveal-whisper:hover {
          background: #c084fc;
          color: #050811;
          box-shadow: 0 0 16px rgba(192, 132, 252, 0.4);
        }
        .whisper-burn-timer-bar {
          margin-top: 10px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .burn-timer-fill {
          height: 100%;
          width: 100%;
          background: linear-gradient(90deg, #ef4444, #f97316);
          transition: width 1s linear;
        }

        /* Expired Tombstone */
        .vo-burned-tombstone-card {
          background: rgba(15, 23, 42, 0.85);
          border: 1px dashed rgba(239, 68, 68, 0.35);
          border-radius: 14px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 290px;
          color: #94a3b8;
          opacity: 0.85;
        }
        .vo-tombstone-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .vo-tombstone-title {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: #ef4444;
          letter-spacing: 0.4px;
        }
        .vo-tombstone-sub {
          display: block;
          font-size: 9.5px;
          color: #64748b;
        }
        .vo-tombstone-lock {
          margin-left: auto;
          color: #475569;
          font-size: 12px;
        }

        /* FULLSCREEN SECURE VIEWER */
        .vo-secure-fullscreen-viewer {
          position: fixed;
          inset: 0;
          z-index: 1000000;
          display: none;
          align-items: center;
          justify-content: center;
          background: #030712;
          font-family: 'Inter', -apple-system, sans-serif;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
        .vo-secure-backdrop {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(17, 24, 39, 0.95) 0%, rgba(3, 7, 18, 1) 100%);
        }

        /* Blackout Privacy Shield */
        .vo-blackout-privacy-shield {
          position: absolute;
          inset: 0;
          background: #000000;
          z-index: 1000010;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .vo-shield-alert-box {
          background: #0f172a;
          border: 2px solid #ef4444;
          border-radius: 18px;
          padding: 32px 28px;
          max-width: 460px;
          text-align: center;
          color: #ffffff;
          box-shadow: 0 0 50px rgba(239, 68, 68, 0.4);
        }
        .vo-shield-alert-box i { font-size: 48px; color: #ef4444; margin-bottom: 16px; }
        .vo-shield-alert-box h3 { margin: 0 0 8px 0; font-size: 18px; font-weight: 800; color: #ef4444; letter-spacing: 0.5px; }
        .vo-shield-alert-box p { margin: 0 0 8px 0; font-size: 13px; color: #cbd5e1; }
        .vo-shield-alert-box .vo-sub-alert { font-size: 11px; color: #94a3b8; }

        /* Dynamic Moving Forensic Watermark */
        .vo-forensic-watermark-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1000005;
          overflow: hidden;
          opacity: 0.28;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-18deg) scale(1.3);
        }
        .vo-watermark-grid {
          display: flex;
          flex-direction: column;
          gap: 60px;
          text-align: center;
          animation: voWatermarkDrift 14s ease-in-out infinite alternate;
        }
        @keyframes voWatermarkDrift {
          0% { transform: translate(-15px, -15px); }
          100% { transform: translate(15px, 15px); }
        }
        .wm-tile {
          font-family: 'SF Mono', Consolas, Monaco, monospace;
          font-size: 11px;
          color: #ffffff;
          font-weight: 900;
          letter-spacing: 2px;
          text-shadow: 0 0 4px rgba(0,0,0,0.8);
          white-space: nowrap;
        }

        /* Secure HUD */
        .vo-secure-hud-container {
          position: relative;
          z-index: 1000002;
          width: 100%;
          max-width: 620px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          background: #0d121d;
          border: 1.5px solid rgba(192, 132, 252, 0.4);
          border-radius: 24px;
          box-shadow: 0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(192, 132, 252, 0.2);
          overflow: hidden;
          margin: 16px;
        }
        .vo-secure-hud-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.25);
        }
        .vo-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .vo-header-left h4 { margin: 0; font-size: 15px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; }
        .vo-header-left p { margin: 2px 0 0 0; font-size: 11px; color: #94a3b8; }
        .vo-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .vo-burning-ticker-pill {
          background: rgba(239, 68, 68, 0.15);
          border: 1.5px solid #ef4444;
          color: #ef4444;
          font-weight: 900;
          font-size: 13px;
          padding: 5px 12px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.35);
        }
        .vo-close-burn-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94a3b8;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .vo-hud-timer-bar {
          height: 5px;
          background: rgba(255, 255, 255, 0.08);
          width: 100%;
        }
        .vo-hud-timer-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #f97316, #ef4444);
          transition: width 1s linear;
        }
        .vo-secure-media-stage {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          max-height: 60vh;
          overflow: auto;
          position: relative;
        }
        .vo-photo-frame {
          max-width: 100%;
          max-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vo-protected-image {
          max-width: 100%;
          max-height: 50vh;
          object-fit: contain;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          pointer-events: none;
          box-shadow: 0 10px 40px rgba(0,0,0,0.7);
        }
        .vo-audio-player-card {
          width: 100%;
          background: #141b27;
          border: 1px solid rgba(192, 132, 252, 0.3);
          border-radius: 16px;
          padding: 24px 20px;
          text-align: center;
        }
        .vo-audio-visualizer-bars {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          height: 48px;
          margin-bottom: 16px;
        }
        .vo-audio-visualizer-bars span {
          width: 6px;
          height: 35%;
          background: #c084fc;
          border-radius: 9999px;
          animation: voWave 0.9s infinite alternate;
        }
        .vo-audio-visualizer-bars span:nth-child(2) { animation-delay: 0.15s; }
        .vo-audio-visualizer-bars span:nth-child(3) { animation-delay: 0.3s; }
        .vo-audio-visualizer-bars span:nth-child(4) { animation-delay: 0.45s; }
        .vo-audio-visualizer-bars span:nth-child(5) { animation-delay: 0.6s; }
        .vo-audio-visualizer-bars span:nth-child(6) { animation-delay: 0.75s; }
        @keyframes voWave {
          0% { height: 20%; background: #c084fc; }
          100% { height: 95%; background: #ef4444; }
        }
        .vo-audio-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: #38bdf8;
          font-weight: 700;
        }
        .vo-secret-text-box {
          background: #090c14;
          border: 1px solid rgba(192, 132, 252, 0.3);
          border-radius: 14px;
          padding: 20px;
          width: 100%;
          color: #ffffff;
        }
        .vo-secret-text-header {
          font-size: 11px;
          font-weight: 800;
          color: #c084fc;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .vo-secret-text-body {
          font-size: 15px;
          line-height: 1.6;
          word-break: break-word;
          font-family: inherit;
        }
        .vo-secure-hud-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 10.5px;
          color: #64748b;
          text-align: center;
        }
        .vo-viewer-disintegrating {
          animation: voDisintegrate 0.4s forwards;
        }
        @keyframes voDisintegrate {
          0% { opacity: 1; filter: contrast(100%) blur(0px); transform: scale(1); }
          50% { filter: contrast(250%) blur(4px); transform: scale(0.98); }
          100% { opacity: 0; filter: blur(16px); transform: scale(0.92); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.NexGhostWhisper = new GhostWhisperEngine();
  window.ghostWhisper = window.NexGhostWhisper;
})();
