/**
 * =============================================================================
 * NEXCHAT - WHATSAPP-STYLE STATUS VIDEO TRIMMER & MESH CHAIN ENGINE (v3.0)
 * Global Namespace: window.NexTransmitterTrimmer
 * =============================================================================
 * Capabilities:
 * 1. Automatic Activation: When ANY video is selected for status upload,
 *    activates the top rectangular filmstrip trimmer bar above the preview stage.
 * 2. Draggable Start/End Scrubber: Dual handles with neon green bounding box
 *    to trim/shorten video duration with real-time frame seeking.
 * 3. Timestamp Indicator & Duration Pill: Live playhead vs duration readout
 *    (e.g. "0:00 / 0:30") synced with laser playhead.
 * 4. Audio Mute Toggle: Instant mute/unmute audio control synced with video element.
 * 5. High-Contrast Filmstrip Extractor: Samples 16 video frames across duration
 *    into high-performance thumbnail tiles with zero UI thread freezing.
 * 6. Dual Modes:
 *    - TRIM: Selects highlight segment for single status dispatch (max 120s).
 *    - CHAIN: Automatically segments videos >120s into sequential status thread parts.
 * 7. Seamless Wiring: Automatically attaches to `statusMediaModalFileInput`.
 *
 * STRICTLY 0 UNICODE EMOJIS: Pure FontAwesome 6 vector glyphs only.
 * PURE WINDOWS CRLF LINE ENDINGS. ES2022 COMPLIANT.
 * =============================================================================
 */

(function (global) {
  'use strict';

  const STATUS_LIMIT = 120; // 2 minutes - Fortress cap
  const FILMSTRIP_FRAME_COUNT = 16;

  class NexTransmitterTrimmerController {
    constructor() {
      this.activeFile = null;
      this.fileObjectUrl = null;
      this.videoDuration = 0;
      this.windowDuration = 30;
      this.currentStart = 0;
      this.currentEnd = 30;
      this.isMuted = false;
      this.mode = 'TRIM'; // 'TRIM' | 'CHAIN'
      this.chainCount = 1;
      this.chainParts = [];
      this.aiBestStart = 0;
      this.aiBestEnd = 30;
      this.isPlaying = false;
      this.isDragging = false;
      this.dragTarget = null; // 'window' | 'start' | 'end'
      this.dragStartX = 0;
      this.dragStartOffset = 0;
      this.filmstripFrames = [];
      this.isGeneratingFilmstrip = false;
      this.videoEl = null;

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
      // Audio mute toggle button
      document.getElementById('statusTrimmerAudioMuteBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMute();
      });

      // AI Best Moment auto-selection button
      document.getElementById('statusTrimmerAiBestBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.applyAiBestMoment();
      });

      // Mode switch buttons for long videos (>120s)
      document.getElementById('trimmerModeTrimBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setMode('TRIM');
      });
      document.getElementById('trimmerModeChainBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setMode('CHAIN');
      });

      // Timeline gesture bindings
      this.bindTimelineGestures();

      // Seamlessly wire to statusMediaModalFileInput if not already bound
      this.wireFileInput();

      // Enhance Code, Voice, and Typography tabs inside Status Studio
      this.enhanceStatusStudioTabs();
    }

    enhanceStatusStudioTabs() {
      this.injectStudioEnhancementStyles();
      this.setupCodeStudioControls();
      this.setupVoiceMicPrompt();
      this.setupTypographyLivePreview();

      if (!document.body.dataset.nexStatusStudioTabsWired) {
        document.body.dataset.nexStatusStudioTabsWired = '1';
        ['statusTabCodeBtn', 'statusTabAudioBtn', 'statusTabTextBtn', 'createStatusBtn', 'statusTabAddBtn'].forEach((id) => {
          document.getElementById(id)?.addEventListener('click', () => {
            requestAnimationFrame(() => this.enhanceStatusStudioTabs());
          });
        });
      }
    }

    injectStudioEnhancementStyles() {
      if (document.getElementById('nexStatusStudioEnhancementsCss')) return;
      const style = document.createElement('style');
      style.id = 'nexStatusStudioEnhancementsCss';
      style.textContent = `
        .nex-code-toolbar-extra {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
        }
        .nex-code-fontsize-select {
          background: rgba(15, 23, 42, 0.9);
          color: #e2e8f0;
          border: 1px solid rgba(56, 189, 248, 0.45);
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }
        .nex-code-editor-shell {
          display: flex;
          align-items: stretch;
          width: 100%;
          min-height: 170px;
          background: rgba(2, 6, 23, 0.85);
          border-top: 1px solid rgba(148, 163, 184, 0.16);
        }
        .nex-code-line-numbers {
          margin: 0;
          padding: 12px 10px 12px 8px;
          min-width: 36px;
          text-align: right;
          user-select: none;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 14px;
          line-height: 1.55;
          color: #64748b;
          background: rgba(15, 23, 42, 0.65);
          border-right: 1px solid rgba(148, 163, 184, 0.16);
          overflow: hidden;
          flex-shrink: 0;
        }
        .nex-code-editor-shell textarea#statusCodeStoryInput {
          flex: 1 1 auto !important;
          width: 100% !important;
          line-height: 1.55 !important;
          padding: 12px !important;
          margin: 0 !important;
          border: none !important;
        }
        .nex-voice-mic-prompt {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 13px;
          margin-bottom: 12px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.86);
          border: 1px solid rgba(0, 242, 255, 0.32);
          color: #e2e8f0;
          font-size: 12px;
          line-height: 1.45;
        }
        .nex-voice-mic-prompt-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          flex-wrap: wrap;
        }
        .nex-voice-mic-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          background: rgba(0, 242, 255, 0.12);
          border: 1px solid rgba(0, 242, 255, 0.4);
          color: #67e8f9;
        }
        .nex-voice-mic-test-btn {
          margin-left: auto;
          background: rgba(0, 242, 255, 0.14);
          border: 1px solid rgba(0, 242, 255, 0.48);
          color: #e0f2fe;
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
        }
        .nex-typography-live-preview {
          margin-top: 10px;
          border-radius: 14px;
          padding: 14px 16px;
          min-height: 92px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0e7490 100%);
          transition: background 0.2s ease;
        }
        .nex-typography-preview-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          align-self: flex-start;
          padding: 2px 8px;
          margin-bottom: 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          background: rgba(0, 0, 0, 0.4);
          color: #f8fafc;
        }
        .nex-typography-preview-body {
          color: #ffffff;
          font-size: 17px;
          font-weight: 700;
          line-height: 1.4;
          word-break: break-word;
          white-space: pre-wrap;
        }
      `;
      document.head.appendChild(style);
    }

    setupCodeStudioControls() {
      const pane = document.getElementById('statusTabCodePane');
      const codeInput = document.getElementById('statusCodeStoryInput');
      if (!pane || !codeInput) return;

      const bar = pane.querySelector('.status-code-window-bar');
      let fontSelect = document.getElementById('statusCodeFontSizeSelect');
      if (bar && !fontSelect) {
        const extra = document.createElement('div');
        extra.className = 'nex-code-toolbar-extra';
        extra.innerHTML = `
          <label for="statusCodeFontSizeSelect" style="font-size:11px;color:#94a3b8;font-weight:700;">Size</label>
          <select id="statusCodeFontSizeSelect" class="nex-code-fontsize-select" aria-label="Code snippet font size">
            <option value="12">12px</option>
            <option value="13">13px</option>
            <option value="14" selected>14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
          </select>
        `;
        bar.appendChild(extra);
        fontSelect = document.getElementById('statusCodeFontSizeSelect');
      }

      if (!document.getElementById('statusCodeLineNumbers') && codeInput.parentElement) {
        const shell = document.createElement('div');
        shell.className = 'nex-code-editor-shell';
        const gutter = document.createElement('pre');
        gutter.id = 'statusCodeLineNumbers';
        gutter.className = 'nex-code-line-numbers';
        gutter.setAttribute('aria-hidden', 'true');
        codeInput.parentElement.insertBefore(shell, codeInput);
        shell.appendChild(gutter);
        shell.appendChild(codeInput);
      }

      const gutterEl = document.getElementById('statusCodeLineNumbers');
      const syncLineNumbers = () => {
        if (!gutterEl) return;
        const lines = Math.max(6, (codeInput.value || '').split(/\r?\n/).length);
        const nums = [];
        for (let i = 1; i <= lines; i++) nums.push(String(i));
        gutterEl.textContent = nums.join('\n');
        gutterEl.scrollTop = codeInput.scrollTop;
      };

      const applyFontSize = (px) => {
        const sizePx = `${px || '14'}px`;
        codeInput.style.fontSize = sizePx;
        if (gutterEl) gutterEl.style.fontSize = sizePx;
      };

      if (fontSelect && !fontSelect.dataset.nexBound) {
        fontSelect.dataset.nexBound = '1';
        fontSelect.addEventListener('change', () => applyFontSize(fontSelect.value));
      }
      if (!codeInput.dataset.nexLinesBound) {
        codeInput.dataset.nexLinesBound = '1';
        codeInput.addEventListener('input', syncLineNumbers);
        codeInput.addEventListener('scroll', () => {
          if (gutterEl) gutterEl.scrollTop = codeInput.scrollTop;
        });
      }

      applyFontSize(fontSelect ? fontSelect.value : '14');
      syncLineNumbers();
    }

    setupVoiceMicPrompt() {
      const pane = document.getElementById('statusTabAudioPane');
      if (!pane) return;

      if (!document.getElementById('statusVoiceMicPermissionPrompt')) {
        const prompt = document.createElement('div');
        prompt.id = 'statusVoiceMicPermissionPrompt';
        prompt.className = 'nex-voice-mic-prompt';
        prompt.setAttribute('role', 'status');
        prompt.innerHTML = `
          <div class="nex-voice-mic-prompt-head">
            <span style="display:inline-flex;align-items:center;gap:7px;font-weight:800;color:#f8fafc;">
              <i class="fa-solid fa-microphone-lines" style="color:#00f2ff;"></i>
              Microphone Permission
            </span>
            <span id="statusMicPermBadge" class="nex-voice-mic-badge">
              <i class="fa-solid fa-circle-info"></i> Prompt on record
            </span>
          </div>
          <div style="flex:1 1 220px;color:#cbd5e1;">
            Browser microphone permission is needed to capture your encrypted voice status (up to 30s). Nothing uploads until you press Share Status.
          </div>
          <button type="button" id="statusTestMicAccessBtn" class="nex-voice-mic-test-btn">
            <i class="fa-solid fa-sliders"></i> Allow Microphone
          </button>
        `;
        pane.insertBefore(prompt, pane.firstChild || null);
      }

      const badge = document.getElementById('statusMicPermBadge');
      const updatePermLabel = (state) => {
        if (!badge) return;
        if (state === 'granted') {
          badge.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#00ff88;"></i> Mic Ready';
        } else if (state === 'denied') {
          badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:#f87171;"></i> Blocked in Browser';
        } else {
          badge.innerHTML = '<i class="fa-solid fa-circle-info"></i> Ask on Record';
        }
      };

      if (navigator.permissions && typeof navigator.permissions.query === 'function') {
        navigator.permissions.query({ name: 'microphone' }).then((status) => {
          updatePermLabel(status.state);
          status.onchange = () => updatePermLabel(status.state);
        }).catch(() => { });
      }

      const testBtn = document.getElementById('statusTestMicAccessBtn');
      if (testBtn && !testBtn.dataset.nexBound) {
        testBtn.dataset.nexBound = '1';
        testBtn.addEventListener('click', async () => {
          if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
            updatePermLabel('denied');
            return;
          }
          testBtn.disabled = true;
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((t) => t.stop());
            updatePermLabel('granted');
          } catch (_) {
            updatePermLabel('denied');
          } finally {
            testBtn.disabled = false;
          }
        });
      }
    }

    setupTypographyLivePreview() {
      const pane = document.getElementById('statusTabTextPane');
      const textInput = document.getElementById('statusTextStoryInput');
      if (!pane || !textInput) return;

      if (!document.getElementById('statusTextLivePreviewCard')) {
        const card = document.createElement('div');
        card.id = 'statusTextLivePreviewCard';
        card.className = 'nex-typography-live-preview';
        card.innerHTML = `
          <span class="nex-typography-preview-tag">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Live Styled Card Preview
          </span>
          <div id="statusTextLivePreviewBody" class="nex-typography-preview-body"></div>
        `;
        const canvas = document.getElementById('statusTextStoryCanvas');
        if (canvas && canvas.parentElement === pane) {
          canvas.insertAdjacentElement('afterend', card);
        } else {
          pane.insertBefore(card, textInput.nextSibling || null);
        }
      }

      const syncPreview = () => {
        const card = document.getElementById('statusTextLivePreviewCard');
        const body = document.getElementById('statusTextLivePreviewBody');
        const canvas = document.getElementById('statusTextStoryCanvas');
        if (!card || !body) return;

        const raw = (textInput.value || '').trim();
        body.textContent = raw || 'Type above to preview your styled typography status live';
        body.style.opacity = raw ? '1' : '0.72';

        const activeSwatch = pane.querySelector('.gradient-swatch.active');
        const bg = (activeSwatch && (activeSwatch.dataset.gradient || activeSwatch.style.background || activeSwatch.style.backgroundImage))
          || (canvas && (canvas.style.background || canvas.style.backgroundImage));
        if (bg) card.style.background = bg;

        const activeFont = pane.querySelector('.status-font-pill.active');
        if (activeFont) {
          const ff = activeFont.dataset.font || activeFont.style.fontFamily;
          if (ff) body.style.fontFamily = ff;
        } else if (canvas && canvas.style.fontFamily) {
          body.style.fontFamily = canvas.style.fontFamily;
        }

        const activeAlign = pane.querySelector('.status-align-pill.active');
        body.style.textAlign = (activeAlign && activeAlign.dataset.align) || textInput.style.textAlign || 'center';
      };

      if (!pane.dataset.nexTypographyWired) {
        pane.dataset.nexTypographyWired = '1';
        textInput.addEventListener('input', syncPreview);
        pane.addEventListener('click', (e) => {
          if (e.target.closest('.gradient-swatch, .status-font-pill, .status-align-pill')) {
            requestAnimationFrame(syncPreview);
          }
        });
      }

      syncPreview();
    }

    wireFileInput() {
      const fileInput = document.getElementById('statusMediaModalFileInput');
      if (fileInput && !fileInput.dataset.trimmerAutoBound) {
        fileInput.dataset.trimmerAutoBound = 'true';
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files?.[0];
          if (file && file.type.startsWith('video/')) {
            this.activateTrimmer(file);
          } else if (!file || !file.type.startsWith('video/')) {
            this.hideTrimmer();
          }
        });
      }

      const removeBtn = document.getElementById('removeStatusMediaPreviewBtn');
      if (removeBtn && !removeBtn.dataset.trimmerAutoBound) {
        removeBtn.dataset.trimmerAutoBound = 'true';
        removeBtn.addEventListener('click', () => {
          this.hideTrimmer();
        });
      }
    }

    bindTimelineGestures() {
      const track = document.getElementById('trimmerTimelineTrack');
      const overlay = document.getElementById('trimmerWindowOverlay');
      const handleLeft = document.getElementById('trimmerHandleLeft');
      const handleRight = document.getElementById('trimmerHandleRight');
      if (!track || !overlay) return;

      // Click anywhere on track to center window
      track.addEventListener('click', (e) => {
        if (e.target.closest('#trimmerWindowOverlay') || this.videoDuration <= 0) return;
        const rect = track.getBoundingClientRect();
        const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const clickedTime = clickRatio * this.videoDuration;
        const centeredStart = Math.max(0, Math.min(this.videoDuration - this.windowDuration, clickedTime - (this.windowDuration / 2)));
        this.setWindowPosition(centeredStart);
      });

      // Pointer drag handlers for overlay window and handles
      const onPointerDown = (targetType, e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isDragging = true;
        this.dragTarget = targetType;
        this.dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
        this.dragStartOffset = this.currentStart;
        overlay.classList.add('dragging');
      };

      overlay.addEventListener('mousedown', (e) => {
        if (e.target.closest('#trimmerHandleLeft') || e.target.closest('#trimmerHandleRight')) return;
        onPointerDown('window', e);
      });
      overlay.addEventListener('touchstart', (e) => {
        if (e.target.closest('#trimmerHandleLeft') || e.target.closest('#trimmerHandleRight')) return;
        onPointerDown('window', e);
      }, { passive: false });

      handleLeft?.addEventListener('mousedown', (e) => onPointerDown('start', e));
      handleLeft?.addEventListener('touchstart', (e) => onPointerDown('start', e), { passive: false });

      handleRight?.addEventListener('mousedown', (e) => onPointerDown('end', e));
      handleRight?.addEventListener('touchstart', (e) => onPointerDown('end', e), { passive: false });

      const onPointerMove = (e) => {
        if (!this.isDragging || this.videoDuration <= 0) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaX = clientX - this.dragStartX;
        const trackWidth = track.clientWidth || 1;
        const deltaSec = (deltaX / trackWidth) * this.videoDuration;

        if (this.dragTarget === 'window') {
          const maxStart = Math.max(0, this.videoDuration - this.windowDuration);
          const newStart = Math.max(0, Math.min(maxStart, this.dragStartOffset + deltaSec));
          this.setWindowPosition(newStart);
        } else if (this.dragTarget === 'start') {
          let newStart = Math.max(0, this.dragStartOffset + deltaSec);
          newStart = Math.min(newStart, this.currentEnd - 1.0); // Minimum 1 second duration
          if (this.currentEnd - newStart > STATUS_LIMIT) {
            newStart = this.currentEnd - STATUS_LIMIT;
          }
          this.currentStart = newStart;
          this.windowDuration = this.currentEnd - this.currentStart;
          this.updateOverlayGeometry();
          if (this.videoEl) {
            this.videoEl.currentTime = this.currentStart;
          }
          this.updateTimeIndicators(this.currentStart);
        } else if (this.dragTarget === 'end') {
          let newEnd = Math.min(this.videoDuration, (this.dragStartOffset + this.windowDuration) + deltaSec);
          newEnd = Math.max(newEnd, this.currentStart + 1.0); // Minimum 1 second duration
          if (newEnd - this.currentStart > STATUS_LIMIT) {
            newEnd = this.currentStart + STATUS_LIMIT;
          }
          this.currentEnd = newEnd;
          this.windowDuration = this.currentEnd - this.currentStart;
          this.updateOverlayGeometry();
          if (this.videoEl) {
            this.videoEl.currentTime = this.currentEnd;
          }
          this.updateTimeIndicators(this.currentEnd);
        }
      };

      const onPointerUp = () => {
        if (this.isDragging) {
          this.isDragging = false;
          this.dragTarget = null;
          overlay.classList.remove('dragging');
        }
      };

      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchend', onPointerUp);
    }

    // =========================================================================
    // ACTIVATION & GATEKEEPER
    // =========================================================================
    activateTrimmer(file, explicitDuration, targetVideoEl) {
      if (!file || !file.type.startsWith('video/')) {
        this.hideTrimmer();
        return;
      }

      this.activeFile = file;
      if (this.fileObjectUrl) URL.revokeObjectURL(this.fileObjectUrl);
      this.fileObjectUrl = URL.createObjectURL(file);

      const video = targetVideoEl || document.getElementById('statusModalVideoPreview');
      this.videoEl = video;

      // Ensure drop placeholder is hidden and preview box is visible
      const dropPlaceholder = document.getElementById('statusDropPlaceholder');
      const previewBox = document.getElementById('statusMediaPreviewBox');
      const imgPreview = document.getElementById('statusModalImgPreview');

      if (dropPlaceholder) dropPlaceholder.style.display = 'none';
      if (previewBox) previewBox.style.display = 'block';
      if (imgPreview) {
        imgPreview.style.display = 'none';
        imgPreview.src = '';
      }

      // Show top WhatsApp-style status video trimmer bar
      const topBar = document.getElementById('statusVideoTopTrimmerBar');
      if (topBar) topBar.style.display = 'flex';

      if (video) {
        video.style.display = 'block';
        video.src = this.fileObjectUrl;
        video.muted = this.isMuted;
        video.playsInline = true;
        this.bindVideoEvents(video);
      }

      if (typeof explicitDuration === 'number' && explicitDuration > 0) {
        this.setupDuration(explicitDuration);
      } else {
        // Probe metadata offscreen
        const probe = document.createElement('video');
        probe.preload = 'metadata';
        probe.src = this.fileObjectUrl;

        const onMeta = () => {
          let dur = probe.duration;
          if (!dur || isNaN(dur) || !isFinite(dur) || dur <= 0) {
            dur = 30; // fallback safe default
          }
          this.setupDuration(dur);
          try {
            probe.removeAttribute('src');
            probe.load();
          } catch (_) {}
        };

        probe.onloadedmetadata = onMeta;
        probe.onerror = () => onMeta();
      }
    }

    bindVideoEvents(video) {
      if (!video || video.dataset.trimmerEventsBound) return;
      video.dataset.trimmerEventsBound = 'true';

      video.addEventListener('timeupdate', () => this.handleVideoTimeUpdate());
      video.addEventListener('ended', () => {
        this.isPlaying = false;
        if (this.videoEl) {
          this.videoEl.currentTime = this.currentStart;
        }
        if (window.statusMusicPickerEngine?.selectedTrack && window.statusMusicPickerEngine.syncWithVideo) {
          window.statusMusicPickerEngine.syncFromVideoPause?.();
        }
      });
      video.addEventListener('play', () => {
        this.isPlaying = true;
        if (!this._suppressMusicSync && window.statusMusicPickerEngine?.selectedTrack && window.statusMusicPickerEngine.syncWithVideo) {
          const offset = this.videoEl ? Math.max(0, this.videoEl.currentTime - this.currentStart) : 0;
          window.statusMusicPickerEngine.syncFromVideoPlay?.(offset);
        }
      });
      video.addEventListener('pause', () => {
        this.isPlaying = false;
        if (!this._suppressMusicSync && window.statusMusicPickerEngine?.selectedTrack && window.statusMusicPickerEngine.syncWithVideo) {
          window.statusMusicPickerEngine.syncFromVideoPause?.();
        }
      });
    }

    setupDuration(duration) {
      this.videoDuration = duration;
      const isOverLimit = duration > STATUS_LIMIT;

      if (isOverLimit) {
        this.windowDuration = STATUS_LIMIT;
        this.currentStart = 0;
        this.currentEnd = STATUS_LIMIT;
        this.chainCount = Math.ceil(duration / STATUS_LIMIT);
        this.chainParts = this.generateChainSlices(duration, STATUS_LIMIT);

        // Auto-Best Moment: 0:42 to 2:42 (or center slice if duration < 162)
        if (duration >= 162) {
          this.aiBestStart = 42;
          this.aiBestEnd = 162;
        } else {
          this.aiBestStart = 0;
          this.aiBestEnd = STATUS_LIMIT;
        }

        const longBanner = document.getElementById('trimmerLongVideoBanner');
        if (longBanner) longBanner.style.display = 'flex';
        const warnText = document.getElementById('trimmerWarningText');
        if (warnText) {
          warnText.textContent = `${this.formatTime(duration)} detected — Capped at 2:00`;
        }
        const chainLabel = document.getElementById('trimmerChainModeLabel');
        if (chainLabel) {
          chainLabel.textContent = `Split into ${this.chainCount}x Chain`;
        }
        this.renderChainBreakdown();
      } else {
        this.windowDuration = duration;
        this.currentStart = 0;
        this.currentEnd = duration;
        this.chainCount = 1;
        this.chainParts = [];
        this.aiBestStart = 0;
        this.aiBestEnd = duration;

        const longBanner = document.getElementById('trimmerLongVideoBanner');
        if (longBanner) longBanner.style.display = 'none';
        const chainBreakdown = document.getElementById('trimmerChainBreakdown');
        if (chainBreakdown) chainBreakdown.style.display = 'none';
      }

      this.setMode('TRIM');
      this.updateOverlayGeometry();
      this.updateTimeIndicators(0);
      this.updateMuteButtonUI();
      this.updateSubmitButtonUI();

      // Extract high-performance filmstrip thumbnails from video
      this.generateFilmstripThumbnails(this.fileObjectUrl, duration);
    }

    hideTrimmer() {
      const topBar = document.getElementById('statusVideoTopTrimmerBar');
      if (topBar) topBar.style.display = 'none';

      if (this.fileObjectUrl) {
        URL.revokeObjectURL(this.fileObjectUrl);
        this.fileObjectUrl = null;
      }

      if (this.videoEl) {
        this.videoEl.pause();
        this.videoEl.removeAttribute('src');
        this.videoEl.load();
        this.videoEl = null;
      }

      this.isPlaying = false;
      this.activeFile = null;
      this.videoDuration = 0;
      this.currentStart = 0;
      this.currentEnd = 0;
      this.isMuted = false;
      this.updateMuteButtonUI();
      this.updateSubmitButtonUI();
      if (window.statusMusicPickerEngine?.onVideoFrameUpdated) {
        window.statusMusicPickerEngine.onVideoFrameUpdated(null, null);
      }
    }

    // =========================================================================
    // AUDIO MUTE TOGGLE
    // =========================================================================
    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.videoEl) {
        this.videoEl.muted = this.isMuted;
      }
      this.updateMuteButtonUI();
    }

    updateMuteButtonUI() {
      const muteBtn = document.getElementById('statusTrimmerAudioMuteBtn');
      if (!muteBtn) return;
      if (this.isMuted) {
        muteBtn.classList.add('muted');
        muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        muteBtn.title = 'Unmute audio';
      } else {
        muteBtn.classList.remove('muted');
        muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        muteBtn.title = 'Mute audio';
      }
    }

    // =========================================================================
    // OFFSCREEN FILMSTRIP THUMBNAIL GENERATOR
    // =========================================================================
    async generateFilmstripThumbnails(videoSrc, duration) {
      const stripContainer = document.getElementById('trimmerFilmstripStrip');
      if (!stripContainer || this.isGeneratingFilmstrip) return;
      this.isGeneratingFilmstrip = true;

      // Seed placeholder cells with sleek gradient tiles
      stripContainer.innerHTML = '';
      for (let i = 0; i < FILMSTRIP_FRAME_COUNT; i++) {
        const frame = document.createElement('div');
        frame.className = 'trimmer-filmstrip-cell';
        frame.style.background = (i % 2 === 0) ? '#0c1a24' : '#08131b';
        stripContainer.appendChild(frame);
      }

      try {
        const offVideo = document.createElement('video');
        offVideo.preload = 'auto';
        offVideo.muted = true;
        offVideo.playsInline = true;
        offVideo.src = videoSrc;

        await new Promise((res) => {
          offVideo.onloadedmetadata = () => res();
          offVideo.onerror = () => res();
          setTimeout(res, 2500);
        });

        const offCanvas = document.createElement('canvas');
        offCanvas.width = 120;
        offCanvas.height = 68;
        const ctx = offCanvas.getContext('2d', { willReadFrequently: true });

        const cells = stripContainer.querySelectorAll('.trimmer-filmstrip-cell');
        const interval = duration / FILMSTRIP_FRAME_COUNT;

        for (let i = 0; i < FILMSTRIP_FRAME_COUNT; i++) {
          const targetTime = Math.min(duration - 0.05, i * interval + (interval / 2));
          offVideo.currentTime = targetTime;

          await new Promise((resolve) => {
            const onSeek = () => {
              offVideo.removeEventListener('seeked', onSeek);
              resolve();
            };
            offVideo.addEventListener('seeked', onSeek);
            setTimeout(resolve, 300);
          });

          if (ctx && offVideo.videoWidth > 0 && cells[i]) {
            ctx.drawImage(offVideo, 0, 0, offCanvas.width, offCanvas.height);
            const thumbUrl = offCanvas.toDataURL('image/jpeg', 0.55);
            cells[i].style.backgroundImage = 'url(\'' + thumbUrl + '\')';
            cells[i].style.backgroundSize = 'cover';
            cells[i].style.backgroundPosition = 'center';
          }
        }

        offVideo.removeAttribute('src');
        offVideo.load();
      } catch (err) {
        console.warn('[TRIMMER] Filmstrip extraction fallback:', err);
      } finally {
        this.isGeneratingFilmstrip = false;
      }
    }

    // =========================================================================
    // WINDOW POSITIONING & OVERLAY GEOMETRY
    // =========================================================================
    setWindowPosition(startSec) {
      const maxStart = Math.max(0, this.videoDuration - this.windowDuration);
      this.currentStart = Math.max(0, Math.min(maxStart, startSec));
      this.currentEnd = Math.min(this.videoDuration, this.currentStart + this.windowDuration);
      this.updateOverlayGeometry();

      // Seek video to start of window
      if (this.videoEl) {
        this.videoEl.currentTime = this.currentStart;
      }
      this.updateTimeIndicators(this.currentStart);
    }

    updateOverlayGeometry() {
      const overlay = document.getElementById('trimmerWindowOverlay');
      const scrimLeft = document.getElementById('trimmerScrimLeft');
      const scrimRight = document.getElementById('trimmerScrimRight');

      if (this.videoDuration <= 0) return;

      const leftPct = (this.currentStart / this.videoDuration) * 100;
      const widthPct = ((this.currentEnd - this.currentStart) / this.videoDuration) * 100;
      const rightPct = Math.max(0, 100 - (leftPct + widthPct));

      if (overlay) {
        overlay.style.left = Math.max(0, leftPct) + '%';
        overlay.style.width = Math.min(100 - leftPct, Math.max(1, widthPct)) + '%';
      }

      if (scrimLeft) {
        scrimLeft.style.width = Math.max(0, leftPct) + '%';
      }
      if (scrimRight) {
        scrimRight.style.width = Math.max(0, rightPct) + '%';
      }

      const selectedSec = Math.max(1, Math.round(this.currentEnd - this.currentStart));
      const timeReadout = document.getElementById('trimmerWindowTimeReadout');
      if (timeReadout) {
        timeReadout.textContent = `${this.formatTime(this.currentStart)} - ${this.formatTime(this.currentEnd)}`;
      }

      const durBadge = document.getElementById('statusTrimmerDurationBadge');
      if (durBadge) {
        durBadge.textContent = `${selectedSec}s`;
      }
      if (window.statusMusicPickerEngine?.onVideoFrameUpdated) {
        window.statusMusicPickerEngine.onVideoFrameUpdated(this.getTrimmingPayload(), this.videoEl);
      }
    }

    updateTimeIndicators(currentTime) {
      const indicator = document.getElementById('statusTrimmerTimestampIndicator');
      if (!indicator) return;

      const cur = typeof currentTime === 'number' ? currentTime : this.currentStart;
      const total = this.videoDuration || 0;
      indicator.textContent = `${this.formatTime(cur)} / ${this.formatTime(total)}`;
    }

    applyAiBestMoment() {
      if (this.videoDuration <= 0) return;
      if (this.videoDuration <= STATUS_LIMIT) {
        this.currentStart = 0;
        this.currentEnd = this.videoDuration;
      } else {
        this.currentStart = this.aiBestStart;
        this.currentEnd = Math.min(this.videoDuration, this.currentStart + STATUS_LIMIT);
      }
      this.windowDuration = this.currentEnd - this.currentStart;
      this.updateOverlayGeometry();

      if (this.videoEl) {
        this.videoEl.currentTime = this.currentStart;
      }
      this.updateTimeIndicators(this.currentStart);

      if (window.showNotif) {
        window.showNotif(`AI Highlight: ${this.formatTime(this.currentStart)} — ${this.formatTime(this.currentEnd)}`, 'info', 2500);
      }
    }

    // =========================================================================
    // VIDEO PLAYBACK TIMEUPDATE & LASER PLAYHEAD
    // =========================================================================
    handleVideoTimeUpdate() {
      if (!this.videoEl || this.videoDuration <= 0) return;

      const cur = this.videoEl.currentTime;

      // Bound playback to current selection window in TRIM mode
      if (this.mode === 'TRIM') {
        if (cur >= this.currentEnd) {
          this.videoEl.currentTime = this.currentStart;
          if (!this._suppressMusicSync && window.statusMusicPickerEngine?.selectedTrack && window.statusMusicPickerEngine.syncWithVideo) {
            window.statusMusicPickerEngine.syncFromVideoPlay?.(0);
          }
          return;
        }
        if (cur < this.currentStart - 0.2) {
          this.videoEl.currentTime = this.currentStart;
          return;
        }
      }

      // Sync laser playhead
      const playhead = document.getElementById('trimmerPlayhead');
      if (playhead) {
        playhead.style.left = ((cur / this.videoDuration) * 100) + '%';
      }

      // Sync timestamp readout
      this.updateTimeIndicators(cur);
    }

    // =========================================================================
    // MODE SWITCHING: TRIM vs CHAIN
    // =========================================================================
    setMode(mode) {
      this.mode = mode;
      const trimBtn = document.getElementById('trimmerModeTrimBtn');
      const chainBtn = document.getElementById('trimmerModeChainBtn');
      const breakdown = document.getElementById('trimmerChainBreakdown');

      if (mode === 'TRIM') {
        trimBtn?.classList.add('active');
        chainBtn?.classList.remove('active');
        if (breakdown) breakdown.style.display = 'none';
      } else {
        chainBtn?.classList.add('active');
        trimBtn?.classList.remove('active');
        if (breakdown) breakdown.style.display = 'flex';
      }

      this.updateSubmitButtonUI();
    }

    renderChainBreakdown() {
      const grid = document.getElementById('trimmerChainPartsGrid');
      if (!grid) return;
      grid.innerHTML = '';

      this.chainParts.forEach((pt, idx) => {
        const chip = document.createElement('div');
        chip.className = 'trimmer-part-chip' + (idx === 0 ? ' active' : '');
        chip.innerHTML = '<i class="fa-solid fa-link" style="color: #00ff88; font-size: 9px;"></i> <strong>Part ' + pt.index + ':</strong> ' + this.formatTime(pt.start) + ' - ' + this.formatTime(pt.end);
        chip.addEventListener('click', () => {
          grid.querySelectorAll('.trimmer-part-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.setWindowPosition(pt.start);
        });
        grid.appendChild(chip);
      });
    }

    updateSubmitButtonUI() {
      const publishBtn = document.getElementById('publishStatusBtn');
      if (!publishBtn) return;

      if (!this.activeFile || this.videoDuration <= STATUS_LIMIT) {
        publishBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Share Status</span>';
        return;
      }

      if (this.mode === 'TRIM') {
        publishBtn.innerHTML = '<i class="fa-solid fa-scissors"></i> <span>Share Trimmed</span>';
      } else {
        publishBtn.innerHTML = '<i class="fa-solid fa-link"></i> <span>Share Chain (1/' + this.chainCount + ')</span>';
      }
    }

    // =========================================================================
    // PAYLOAD EXTRACTION & CHAIN SLICES
    // =========================================================================
    generateChainSlices(totalDuration, sliceSize = STATUS_LIMIT) {
      if (!totalDuration || totalDuration <= 0) return [];
      const count = Math.ceil(totalDuration / sliceSize);
      const slices = [];

      for (let i = 1; i <= count; i++) {
        const start = (i - 1) * sliceSize;
        const end = Math.min(totalDuration, i * sliceSize);
        slices.push({
          index: i,
          total: count,
          start: parseFloat(start.toFixed(2)),
          end: parseFloat(end.toFixed(2)),
          duration: parseFloat((end - start).toFixed(2))
        });
      }
      return slices;
    }

    getTrimmingPayload() {
      if (!this.activeFile || this.videoDuration <= 0) {
        return null;
      }

      const isTrimmed = (this.currentStart > 0.1 || (this.videoDuration - this.currentEnd) > 0.1);

      return {
        mode: this.mode, // 'TRIM' | 'CHAIN'
        file: this.activeFile,
        totalDuration: this.videoDuration,
        startTime: parseFloat(this.currentStart.toFixed(2)),
        endTime: parseFloat(this.currentEnd.toFixed(2)),
        duration: Math.max(1, Math.round(this.currentEnd - this.currentStart)),
        chainCount: this.chainCount,
        parts: this.chainParts,
        isTrimmed: isTrimmed,
        isMuted: !!this.isMuted
      };
    }

    formatTime(seconds) {
      if (isNaN(seconds) || seconds < 0) return '0:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }
  }

  // Register Global Singleton
  global.NexTransmitterTrimmer = new NexTransmitterTrimmerController();

})(typeof window !== 'undefined' ? window : globalThis);
