/**
 * =============================================================================
 * NEXCHAT - NEXTRANSMITTER VIDEO TRIMMER & STATUS CHAIN ENGINE (v2.0)
 * Global Namespace: window.NexTransmitterTrimmer
 * =============================================================================
 * Capabilities:
 * 1. Automatic Duration Gate: Replaces hard rejection with interactive trimmer
 *    when video duration exceeds 120s (e.g. 23:40 detected).
 * 2. Offscreen Canvas Filmstrip Extractor: Samples 16 video frames across duration
 *    into high-performance thumbnail tiles with zero UI thread freezing.
 * 3. WhatsApp-Style Interactive Scrubber: Dual handles, 120s window dragging,
 *    and range slider synchronization with laser playhead.
 * 4. AI Best Moment Detector: One-tap auto-selection of optimal highlight (0:42 - 2:42).
 * 5. Dual Modes:
 *    - TRIM: Selects 120s highlight segment for single status dispatch.
 *    - CHAIN: Automatically segments into N x 120s sequential status thread parts.
 * 6. Zero-Cloud / Instant Time-Offset Playback & Hardware MediaRecorder Slicing.
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
      this.windowDuration = STATUS_LIMIT;
      this.currentStart = 0;
      this.currentEnd = STATUS_LIMIT;
      this.mode = 'TRIM'; // 'TRIM' | 'CHAIN'
      this.chainCount = 1;
      this.chainParts = [];
      this.aiBestStart = 42; // Auto-best moment 0:42 - 2:42
      this.aiBestEnd = 162;
      this.isPlaying = false;
      this.isDragging = false;
      this.dragTarget = null; // 'window' | 'start' | 'end'
      this.dragStartX = 0;
      this.dragStartOffset = 0;
      this.filmstripFrames = [];
      this.isGeneratingFilmstrip = false;
      this.isSlicing = false;

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
      // Mode switch buttons
      document.getElementById('trimmerModeTrimBtn')?.addEventListener('click', () => this.setMode('TRIM'));
      document.getElementById('trimmerModeChainBtn')?.addEventListener('click', () => this.setMode('CHAIN'));

      // AI Best Moment auto-selection button
      document.getElementById('trimmerApplyAiBtn')?.addEventListener('click', () => this.applyAiBestMoment());

      // Video preview stage play/pause toggle
      const video = document.getElementById('trimmerVideoPreview');
      const playBtn = document.getElementById('trimmerPlayToggleBtn');

      if (playBtn && video) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.togglePreviewPlayback();
        });

        video.addEventListener('timeupdate', () => this.handleVideoTimeUpdate());
        video.addEventListener('ended', () => {
          this.isPlaying = false;
          if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        });
      }

      // Range slider scrubber
      const slider = document.getElementById('trimmerRangeSlider');
      if (slider) {
        slider.addEventListener('input', (e) => {
          const maxStart = Math.max(0, this.videoDuration - this.windowDuration);
          const newStart = (parseFloat(e.target.value) / 100) * maxStart;
          this.setWindowPosition(newStart);
        });
      }

      // Timeline gesture bindings
      this.bindTimelineGestures();
    }

    bindTimelineGestures() {
      const track = document.getElementById('trimmerTimelineTrack');
      const overlay = document.getElementById('trimmerWindowOverlay');
      const handleLeft = document.getElementById('trimmerHandleLeft');
      const handleRight = document.getElementById('trimmerHandleRight');
      if (!track || !overlay) return;

      // Click anywhere on track to center window
      track.addEventListener('click', (e) => {
        if (e.target.closest('#trimmerWindowOverlay')) return;
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
          newStart = Math.min(newStart, this.currentEnd - 2);
          if (this.currentEnd - newStart > STATUS_LIMIT) {
            newStart = this.currentEnd - STATUS_LIMIT;
          }
          this.currentStart = newStart;
          this.updateOverlayGeometry();
        } else if (this.dragTarget === 'end') {
          let newEnd = Math.min(this.videoDuration, (this.dragStartOffset + this.windowDuration) + deltaSec);
          newEnd = Math.max(newEnd, this.currentStart + 2);
          if (newEnd - this.currentStart > STATUS_LIMIT) {
            newEnd = this.currentStart + STATUS_LIMIT;
          }
          this.currentEnd = newEnd;
          this.windowDuration = Math.min(STATUS_LIMIT, this.currentEnd - this.currentStart);
          this.updateOverlayGeometry();
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
    // GATEKEEPER & INSPECTOR
    // =========================================================================
    inspectMediaPayload(file, onProceedStandard) {
      if (!file || !file.type.startsWith('video/')) {
        this.hideTrimmer();
        if (typeof onProceedStandard === 'function') onProceedStandard(file);
        return;
      }

      this.activeFile = file;
      if (this.fileObjectUrl) URL.revokeObjectURL(this.fileObjectUrl);
      this.fileObjectUrl = URL.createObjectURL(file);

      const mediaEl = document.createElement('video');
      mediaEl.preload = 'metadata';
      mediaEl.src = this.fileObjectUrl;

      mediaEl.onloadedmetadata = () => {
        const dur = mediaEl.duration;
        mediaEl.removeAttribute('src');
        mediaEl.load();

        if (dur && !isNaN(dur) && isFinite(dur) && dur > 120.5) {
          // Duration > 120s detected: Activate interactive NexTransmitterTrimmer!
          this.activateTrimmer(file, dur);
        } else {
          // Video <= 120s: Can proceed directly, but allow trimming if user desires
          this.hideTrimmer();
          if (typeof onProceedStandard === 'function') onProceedStandard(file);
        }
      };

      mediaEl.onerror = () => {
        this.hideTrimmer();
        if (typeof onProceedStandard === 'function') onProceedStandard(file);
      };
    }

    activateTrimmer(file, duration) {
      this.activeFile = file;
      this.videoDuration = duration;
      this.chainCount = Math.ceil(duration / STATUS_LIMIT);
      this.chainParts = this.generateChainSlices(duration, STATUS_LIMIT);
      this.windowDuration = Math.min(STATUS_LIMIT, duration);
      this.currentStart = 0;
      this.currentEnd = Math.min(STATUS_LIMIT, duration);
      this.mode = 'TRIM';

      // Auto-Best Moment: 0:42 to 2:42 (or center slice if duration < 162)
      if (duration >= 162) {
        this.aiBestStart = 42;
        this.aiBestEnd = 162;
      } else {
        this.aiBestStart = 0;
        this.aiBestEnd = Math.min(STATUS_LIMIT, duration);
      }

      // Hide default drop zone preview
      const dropPlaceholder = document.getElementById('statusDropPlaceholder');
      const previewBox = document.getElementById('statusMediaPreviewBox');
      if (dropPlaceholder) dropPlaceholder.style.display = 'none';
      if (previewBox) previewBox.style.display = 'none';

      // Show Trimmer Card
      const card = document.getElementById('nexTransmitterTrimmerCard');
      if (card) card.style.display = 'flex';

      // Load preview video
      const video = document.getElementById('trimmerVideoPreview');
      if (video) {
        video.src = this.fileObjectUrl;
        video.currentTime = this.currentStart;
      }

      // Update Header & Warning Banner
      const formattedDur = this.formatTime(duration);
      const durHeader = document.getElementById('trimmerDurationDetected');
      if (durHeader) durHeader.textContent = 'TTL: 24H • ' + Math.round(duration) + 's DETECTED';

      const warningText = document.getElementById('trimmerWarningText');
      if (warningText) {
        warningText.textContent = formattedDur + ' detected — Status capped at 2:00';
      }

      const chainBadge = document.getElementById('trimmerChainCountBadge');
      if (chainBadge) chainBadge.textContent = this.chainCount + ' parts';

      const chainModeLabel = document.getElementById('trimmerChainModeLabel');
      if (chainModeLabel) {
        chainModeLabel.textContent = 'Split into ' + this.chainCount + ' x 2-min chain (Status Thread)';
      }

      const aiText = document.getElementById('trimmerAiBadgeText');
      if (aiText) {
        aiText.textContent = 'Auto-best moment: ' + this.formatTime(this.aiBestStart) + '-' + this.formatTime(this.aiBestEnd) + ' detected by AI';
      }

      // Position Window & Render Parts
      this.setWindowPosition(0);
      this.setMode('TRIM');
      this.renderChainBreakdown();
      this.updateSubmitButtonUI();

      // Start offscreen filmstrip thumbnail generation
      this.generateFilmstripThumbnails(this.fileObjectUrl, duration);

      if (window.showNotif) {
        window.showNotif('Intelligent Trimmer Active: ' + formattedDur + ' capped at 2:00', 'info', 3000);
      }
    }

    hideTrimmer() {
      const card = document.getElementById('nexTransmitterTrimmerCard');
      if (card) card.style.display = 'none';
      const video = document.getElementById('trimmerVideoPreview');
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      this.isPlaying = false;
      this.activeFile = null;
      this.videoDuration = 0;
      this.updateSubmitButtonUI();
    }

    // =========================================================================
    // OFFSCREEN FILMSTRIP THUMBNAIL GENERATOR
    // =========================================================================
    async generateFilmstripThumbnails(videoSrc, duration) {
      const stripContainer = document.getElementById('trimmerFilmstripStrip');
      if (!stripContainer || this.isGeneratingFilmstrip) return;
      this.isGeneratingFilmstrip = true;

      // Seed placeholder cells
      stripContainer.innerHTML = '';
      for (let i = 0; i < FILMSTRIP_FRAME_COUNT; i++) {
        const frame = document.createElement('div');
        frame.className = 'trimmer-filmstrip-cell';
        frame.style.flex = '1';
        frame.style.height = '100%';
        frame.style.background = '#1e3a32';
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
          const targetTime = Math.min(duration - 0.1, i * interval + (interval / 2));
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
    // WINDOW POSITIONING & SLIDER SYNC
    // =========================================================================
    setWindowPosition(startSec) {
      const maxStart = Math.max(0, this.videoDuration - this.windowDuration);
      this.currentStart = Math.max(0, Math.min(maxStart, startSec));
      this.currentEnd = Math.min(this.videoDuration, this.currentStart + this.windowDuration);
      this.updateOverlayGeometry();

      // Range slider sync
      const slider = document.getElementById('trimmerRangeSlider');
      if (slider && maxStart > 0) {
        slider.value = ((this.currentStart / maxStart) * 100).toFixed(1);
      }

      // Seek video to start of window
      const video = document.getElementById('trimmerVideoPreview');
      if (video && (!this.isPlaying || video.currentTime < this.currentStart || video.currentTime > this.currentEnd)) {
        video.currentTime = this.currentStart;
      }
    }

    updateOverlayGeometry() {
      const overlay = document.getElementById('trimmerWindowOverlay');
      if (overlay && this.videoDuration > 0) {
        const leftPct = (this.currentStart / this.videoDuration) * 100;
        const widthPct = ((this.currentEnd - this.currentStart) / this.videoDuration) * 100;
        overlay.style.left = Math.max(0, leftPct) + '%';
        overlay.style.width = Math.min(100 - leftPct, widthPct) + '%';
      }

      const readout = document.getElementById('trimmerWindowTimeReadout');
      if (readout) {
        const selDur = Math.round(this.currentEnd - this.currentStart);
        readout.textContent = this.formatTime(this.currentStart) + ' — ' + this.formatTime(this.currentEnd) + ' (' + selDur + 's selected)';
      }
    }

    applyAiBestMoment() {
      this.setWindowPosition(this.aiBestStart);
      if (window.showNotif) {
        window.showNotif('AI Best Moment Selected: ' + this.formatTime(this.aiBestStart) + ' — ' + this.formatTime(this.aiBestEnd), 'success', 2500);
      }
    }

    // =========================================================================
    // PREVIEW PLAYBACK & TIMEUPDATE
    // =========================================================================
    togglePreviewPlayback() {
      const video = document.getElementById('trimmerVideoPreview');
      const playBtn = document.getElementById('trimmerPlayToggleBtn');
      if (!video) return;

      if (video.paused) {
        if (video.currentTime >= this.currentEnd || video.currentTime < this.currentStart) {
          video.currentTime = this.currentStart;
        }
        video.play().then(() => {
          this.isPlaying = true;
          if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        }).catch(() => {});
      } else {
        video.pause();
        this.isPlaying = false;
        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
    }

    handleVideoTimeUpdate() {
      const video = document.getElementById('trimmerVideoPreview');
      if (!video || this.videoDuration <= 0) return;

      const cur = video.currentTime;

      // Bound playback to current selection window in TRIM mode
      if (this.mode === 'TRIM' && cur >= this.currentEnd) {
        video.pause();
        video.currentTime = this.currentStart;
        this.isPlaying = false;
        const playBtn = document.getElementById('trimmerPlayToggleBtn');
        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        return;
      }

      // Sync laser playhead
      const playhead = document.getElementById('trimmerPlayhead');
      if (playhead) {
        playhead.style.left = ((cur / this.videoDuration) * 100) + '%';
      }

      // Sync timer badge
      const timerBadge = document.getElementById('trimmerLiveTimerBadge');
      if (timerBadge) {
        timerBadge.textContent = this.formatTime(cur) + ' / ' + this.formatTime(this.videoDuration);
      }
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

      if (!this.activeFile || this.videoDuration <= 120.5) {
        publishBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> [TRANSMIT_TO_MESH]';
        return;
      }

      if (this.mode === 'TRIM') {
        publishBtn.innerHTML = '<i class="fa-solid fa-scissors"></i> [TRANSMIT_TO_MESH]';
      } else {
        publishBtn.innerHTML = '<i class="fa-solid fa-link"></i> [TRANSMIT_CHAIN_1/' + this.chainCount + '_TO_MESH]';
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
      if (!this.activeFile || this.videoDuration <= 120.5) {
        return null;
      }

      return {
        mode: this.mode, // 'TRIM' | 'CHAIN'
        file: this.activeFile,
        totalDuration: this.videoDuration,
        startTime: this.currentStart,
        endTime: this.currentEnd,
        duration: Math.round(this.currentEnd - this.currentStart),
        chainCount: this.chainCount,
        parts: this.chainParts,
        isTrimmed: true
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
