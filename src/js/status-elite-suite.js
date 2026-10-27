/**
 * =============================================================================
 * NEXCHAT NEXT-GEN STATUS ELITE SUITE
 * =============================================================================
 * Architectural Capabilities:
 * 1. Audio Voice Stories: 60s voice recording with Web Audio DSP frequency spectrum.
 * 2. Interactive Widget Stickers: Mini-polls with real-time voting & AMA question boxes.
 * 3. Stealth Ghost Lens: Air-gap status peeking without triggering read receipts/view count.
 * 4. Slide-Up Viewers Analytics Drawer: Granular viewer audit with timestamps & reactions.
 * 5. Code Snippet Stories: Monospace hacker code terminal with 1-tap clipboard copy.
 * 6. Predictive Preloading & Pre-Upload WebP Image Optimization.
 * 
 * STRICTLY ZERO UNICODE EMOJIS: FontAwesome 6 vector glyphs and cyberpunk styling only.
 * PURE CRLF LINE ENDINGS.
 * =============================================================================
 */

(function () {
  'use strict';

  class NexStatusEliteSuite {
    constructor() {
      this.isStealth = localStorage.getItem('nex_status_stealth') === 'true';
      this.audioCtx = null;
      this.analyser = null;
      this.sourceNode = null;
      this.animFrameId = null;
      this.currentAudioEl = null;

      this.mediaRecorder = null;
      this.recordedAudioBlob = null;
      this.recordedAudioUrl = null;
      this.voiceTimerInterval = null;
      this.voiceDuration = 0;

      this.votedPolls = new Set();
      try {
        const saved = JSON.parse(localStorage.getItem('nex_voted_polls') || '[]');
        if (Array.isArray(saved)) saved.forEach(id => this.votedPolls.add(id));
      } catch (_) {}

      this.preloadCache = new Set();
    }

    init() {
      this.bindStealthToggle();
      this.bindViewersDrawer();
      this.bindVoiceStoryCreator();
      this.bindCodeSnippetCreator();
      console.log('[STATUS ELITE SUITE] Initialized. Stealth mode active:', this.isStealth);
    }

    // -------------------------------------------------------------------------
    // 1. STEALTH GHOST LENS (Air-Gap Status Peeking)
    // -------------------------------------------------------------------------
    bindStealthToggle() {
      const btn = document.getElementById('statusViewerStealthBtn');
      if (!btn || btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';

      this.updateStealthBtnUI(btn);

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isStealth = !this.isStealth;
        localStorage.setItem('nex_status_stealth', String(this.isStealth));
        this.updateStealthBtnUI(btn);

        if (window.showNotif) {
          if (this.isStealth) {
            window.showNotif('Stealth Ghost Peeking: Active. Viewing without notifying creator.', 'info', 3000);
          } else {
            window.showNotif('Stealth Ghost Peeking: Disabled. Views will be recorded.', 'info', 3000);
          }
        }
      });
    }

    updateStealthBtnUI(btn) {
      if (!btn) return;
      if (this.isStealth) {
        btn.classList.add('active');
        btn.title = 'Stealth Peeking: ACTIVE (Your views are hidden)';
      } else {
        btn.classList.remove('active');
        btn.title = 'Stealth Peeking: OFF (Click to view covertly)';
      }
    }

    isStealthActive() {
      return this.isStealth;
    }

    // -------------------------------------------------------------------------
    // 2. AUDIO VOICE STORIES (Playback & Live Spectrum Visualization)
    // -------------------------------------------------------------------------
    playVoiceSlide(audioUrl, canvasEl, timerEl, onEndCallback) {
      this.stopVoiceSlide();
      if (!audioUrl) return;

      if (!this.persistentAudioEl) {
        this.persistentAudioEl = new Audio();
        this.persistentAudioEl.crossOrigin = 'anonymous';
      }
      const audio = this.persistentAudioEl;
      this.currentAudioEl = audio;
      audio.src = audioUrl;

      audio.ontimeupdate = () => {
        if (timerEl && !isNaN(audio.duration)) {
          const cur = this.formatTime(audio.currentTime);
          const total = this.formatTime(audio.duration);
          timerEl.textContent = `${cur} / ${total}`;
        }
      };

      audio.onended = () => {
        this.stopVoiceSlide();
        if (typeof onEndCallback === 'function') onEndCallback();
      };

      audio.play().then(() => {
        this.startSpectrumAnimation(audio, canvasEl);
      }).catch(err => {
        console.warn('[STATUS VOICE] Playback deferred/blocked:', err);
      });
    }

    startSpectrumAnimation(audioEl, canvasEl) {
      if (!canvasEl) return;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return;

      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!this.audioCtx) this.audioCtx = new AudioContextClass();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        if (!this.analyser) {
          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 64;
          this.analyser.smoothingTimeConstant = 0.8;
        }

        if (!this.sourceNode && audioEl) {
          try {
            this.sourceNode = this.audioCtx.createMediaElementSource(audioEl);
            this.sourceNode.connect(this.analyser);
            this.analyser.connect(this.audioCtx.destination);
          } catch (_) {
            // Source already connected to element
          }
        }

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Pre-create gradient once outside RAF loop to avoid heap thrashing
        const gradient = ctx.createLinearGradient(0, canvasEl.height, 0, 0);
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(1, '#00f2fe');

        let lastDrawTime = 0;
        const targetFrameInterval = 1000 / 35; // Throttle to steady 35 FPS

        const draw = (now) => {
          if (!canvasEl.isConnected) return;
          this.animFrameId = requestAnimationFrame(draw);

          if (now - lastDrawTime < targetFrameInterval) return;
          lastDrawTime = now;

          this.analyser.getByteFrequencyData(dataArray);
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

          const barWidth = (canvasEl.width / bufferLength) * 1.8;
          let x = 0;

          ctx.fillStyle = gradient;
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvasEl.height * 0.9;
            ctx.fillRect(x, canvasEl.height - barHeight, barWidth - 2, barHeight);
            x += barWidth;
          }
        };

        this.animFrameId = requestAnimationFrame(draw);
      } catch (e) {
        console.warn('[STATUS SPECTRUM] Visualization fallback:', e);
      }
    }

    stopVoiceSlide() {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      if (this.persistentAudioEl) {
        this.persistentAudioEl.pause();
        this.persistentAudioEl.currentTime = 0;
      }
    }

    formatTime(seconds) {
      if (isNaN(seconds) || seconds < 0) return '0:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    // -------------------------------------------------------------------------
    // 3. VOICE RECORDING STUDIO (Creation Pane)
    // -------------------------------------------------------------------------
    bindVoiceStoryCreator() {
      const micBtn = document.getElementById('statusVoiceRecordBtn');
      const timerEl = document.getElementById('statusVoiceTimerDisplay');
      const hintEl = document.getElementById('statusVoiceHintText');
      if (!micBtn || micBtn.dataset.bound === 'true') return;
      micBtn.dataset.bound = 'true';

      let stream = null;
      let chunks = [];

      micBtn.addEventListener('click', async () => {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
          // Start Recording
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            chunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
              this.recordedAudioBlob = new Blob(chunks, { type: 'audio/webm' });
              this.recordedAudioUrl = URL.createObjectURL(this.recordedAudioBlob);
              if (stream) stream.getTracks().forEach(t => t.stop());

              if (hintEl) hintEl.textContent = 'Voice note recorded successfully! Tap transmit below.';
              if (micBtn) {
                micBtn.classList.remove('recording');
                micBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
              }
            };

            this.mediaRecorder.start();
            micBtn.classList.add('recording');
            micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            if (hintEl) hintEl.textContent = 'Recording live... (Max 60s)';

            this.voiceDuration = 0;
            clearInterval(this.voiceTimerInterval);
            this.voiceTimerInterval = setInterval(() => {
              this.voiceDuration++;
              if (timerEl) timerEl.textContent = this.formatTime(this.voiceDuration);
              if (this.voiceDuration >= 60) {
                this.stopVoiceRecording();
              }
            }, 1000);

          } catch (err) {
            console.error('[STATUS VOICE RECORD]', err);
            if (window.showNotif) window.showNotif('Microphone access denied: ' + err.message, 'error');
          }
        } else if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          // Stop Recording
          this.stopVoiceRecording();
        } else if (this.recordedAudioUrl) {
          // Playback preview
          const testAudio = new Audio(this.recordedAudioUrl);
          testAudio.play();
        }
      });
    }

    stopVoiceRecording() {
      clearInterval(this.voiceTimerInterval);
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
    }

    getRecordedAudioBlob() {
      return this.recordedAudioBlob;
    }

    clearRecordedVoice() {
      this.recordedAudioBlob = null;
      this.recordedAudioUrl = null;
      this.voiceDuration = 0;
      clearInterval(this.voiceTimerInterval);
      const timerEl = document.getElementById('statusVoiceTimerDisplay');
      if (timerEl) timerEl.textContent = '0:00';
      const micBtn = document.getElementById('statusVoiceRecordBtn');
      if (micBtn) {
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
      }
    }

    // -------------------------------------------------------------------------
    // 4. CODE SNIPPET STORIES (Creation & Viewer Rendering)
    // -------------------------------------------------------------------------
    bindCodeSnippetCreator() {
      const copyBtn = document.getElementById('statusViewerCopyCodeBtn');
      if (copyBtn && copyBtn.dataset.bound !== 'true') {
        copyBtn.dataset.bound = 'true';
        copyBtn.addEventListener('click', () => {
          const codeEl = document.getElementById('statusViewerCodeContent');
          if (codeEl && codeEl.textContent) {
            navigator.clipboard.writeText(codeEl.textContent).then(() => {
              copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
              setTimeout(() => {
                copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy';
              }, 2000);
            });
          }
        });
      }
    }

    renderCodeSlide(slide, codeStageEl) {
      if (!codeStageEl) return;
      const langEl = document.getElementById('statusViewerCodeLang');
      const contentEl = document.getElementById('statusViewerCodeContent');

      if (langEl) langEl.textContent = (slide.codeLanguage || 'JAVASCRIPT').toUpperCase();
      if (contentEl) contentEl.textContent = slide.codeContent || slide.content || '// No code payload';

      codeStageEl.style.display = 'flex';
    }

    // -------------------------------------------------------------------------
    // 5. INTERACTIVE OVERLAY WIDGETS (Polls & AMAs)
    // -------------------------------------------------------------------------
    renderInteractiveWidgets(slide, container) {
      if (!container) return;
      container.innerHTML = '';

      if (slide.pollData) {
        container.style.display = 'flex';
        const card = document.createElement('div');
        card.className = 'status-poll-card';

        const hasVoted = this.votedPolls.has(slide.id);
        const options = slide.pollData.options || ['Yes', 'No'];
        const votes = slide.pollData.votes || [0, 0];
        const totalVotes = votes.reduce((a, b) => a + b, 0);

        let optionsHtml = '';
        options.forEach((opt, idx) => {
          const voteCount = votes[idx] || 0;
          const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          optionsHtml += `
            <button type="button" class="status-poll-option-btn" data-opt-idx="${idx}" ${hasVoted ? 'disabled' : ''}>
              ${hasVoted ? `<div class="status-poll-progress-fill" style="width: ${pct}%"></div>` : ''}
              <span class="status-poll-option-label">${this.escape(opt)}</span>
              ${hasVoted ? `<span class="status-poll-option-pct">${pct}%</span>` : ''}
            </button>
          `;
        });

        card.innerHTML = `
          <div class="status-poll-question"><i class="fa-solid fa-square-poll-vertical" style="color: #00ff88; margin-right: 6px;"></i> ${this.escape(slide.pollData.question)}</div>
          <div class="status-poll-options">${optionsHtml}</div>
        `;

        if (!hasVoted) {
          card.querySelectorAll('.status-poll-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const optIdx = parseInt(btn.getAttribute('data-opt-idx'), 10);
              this.votePoll(slide.id, optIdx, slide, container);
            });
          });
        }

        container.appendChild(card);
      } else if (slide.amaPrompt) {
        container.style.display = 'flex';
        const card = document.createElement('div');
        card.className = 'status-ama-card';
        card.innerHTML = `
          <span class="status-ama-badge"><i class="fa-solid fa-comment-dots"></i> ASK ME ANYTHING</span>
          <div class="status-ama-title">${this.escape(slide.amaPrompt)}</div>
          <div class="status-ama-form" onclick="event.stopPropagation();">
            <input type="text" class="status-ama-input" id="statusAmaInputBox" placeholder="Type a question..." maxlength="140" />
            <button type="button" class="status-ama-send-btn" id="statusAmaSendBtn" title="Send question"><i class="fa-solid fa-arrow-up"></i></button>
          </div>
        `;

        const sendBtn = card.querySelector('#statusAmaSendBtn');
        const inputEl = card.querySelector('#statusAmaInputBox');
        if (sendBtn && inputEl) {
          sendBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = inputEl.value.trim();
            if (val) {
              this.submitAmaQuestion(slide, val);
              inputEl.value = '';
              if (window.showNotif) window.showNotif('Question sent to creator via DM!', 'success');
            }
          });
          inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              sendBtn.click();
            }
          });
        }

        container.appendChild(card);
      } else {
        container.style.display = 'none';
      }
    }

    async votePoll(statusId, optIdx, slide, container) {
      this.votedPolls.add(statusId);
      localStorage.setItem('nex_voted_polls', JSON.stringify(Array.from(this.votedPolls)));

      if (!slide.pollData.votes) slide.pollData.votes = [0, 0];
      slide.pollData.votes[optIdx] = (slide.pollData.votes[optIdx] || 0) + 1;

      // Re-render immediately with updated percentages
      this.renderInteractiveWidgets(slide, container);

      // Persist to Firestore if available
      try {
        if (window.db && typeof window.updateDoc === 'function' && typeof window.doc === 'function') {
          const statusRef = window.doc(window.db, 'statuses', statusId);
          await window.updateDoc(statusRef, {
            [`pollData.votes.${optIdx}`]: window.increment ? window.increment(1) : 1
          });
        }
      } catch (err) {
        console.warn('[STATUS POLL VOTE]', err);
      }
    }

    submitAmaQuestion(slide, question) {
      if (!slide || !slide.userId) return;
      const creatorUid = slide.userId;
      const text = `[AMA QUESTION on Status]: "${question}"`;

      if (typeof window.sendMessageDirect === 'function') {
        window.sendMessageDirect(creatorUid, text);
      } else if (typeof window.openChat === 'function') {
        window.openChat(creatorUid, slide.username || 'Creator', slide.profilePic || 'logo.jpg', 'direct');
        setTimeout(() => {
          const input = document.getElementById('message-input');
          if (input) {
            input.value = text;
            input.focus();
          }
        }, 300);
      }
    }

    // -------------------------------------------------------------------------
    // 6. SLIDE-UP VIEWERS ANALYTICS DRAWER
    // -------------------------------------------------------------------------
    bindViewersDrawer() {
      const badge = document.getElementById('statusViewerViewsBadge');
      const drawer = document.getElementById('statusViewersDrawer');
      const scrim = document.getElementById('statusViewersDrawerScrim');
      const closeBtn = document.getElementById('closeStatusViewersDrawerBtn');
      const searchInput = document.getElementById('statusViewersSearchInput');

      if (badge && badge.dataset.drawerBound !== 'true') {
        badge.dataset.drawerBound = 'true';
        badge.style.cursor = 'pointer';
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openViewersDrawer();
        });
      }

      if (scrim) scrim.addEventListener('click', () => this.closeViewersDrawer());
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeViewersDrawer());

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase().trim();
          document.querySelectorAll('.status-viewer-row-item').forEach(item => {
            const name = item.getAttribute('data-name') || '';
            item.style.display = name.toLowerCase().includes(q) ? 'flex' : 'none';
          });
        });
      }
    }

    async openViewersDrawer() {
      const drawer = document.getElementById('statusViewersDrawer');
      if (!drawer) return;
      drawer.style.display = 'flex';

      const listContainer = document.getElementById('statusViewersListContainer');
      const countChip = document.getElementById('statusViewersDrawerCount');
      if (!listContainer) return;

      listContainer.innerHTML = '<div class="status-viewers-empty"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading analytics...</p></div>';

      // Current active slide inspection
      let viewers = [];
      const currentSlide = window.currentStatusSlide || null;

      if (currentSlide && currentSlide.viewersList && Array.isArray(currentSlide.viewersList)) {
        viewers = currentSlide.viewersList;
      } else if (currentSlide && currentSlide.id && window.db && typeof window.collection === 'function') {
        // Fetch real-time viewer subcollection
        try {
          const viewsCol = window.collection(window.db, 'statuses', currentSlide.id, 'views');
          const snap = await window.getDocs(viewsCol);
          snap.forEach(docSnap => {
            viewers.push({ id: docSnap.id, ...docSnap.data() });
          });
        } catch (_) {}
      }

      if (countChip) countChip.textContent = `${viewers.length} Views`;

      if (viewers.length === 0) {
        listContainer.innerHTML = `
          <div class="status-viewers-empty">
            <i class="fa-regular fa-eye-slash"></i>
            <p>No viewers yet. New views and reactions will appear here in real time.</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = '';
      viewers.forEach(v => {
        const row = document.createElement('div');
        row.className = 'status-viewer-row-item';
        row.setAttribute('data-name', v.username || 'User');

        const timeStr = v.viewedAt ? new Date(v.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently';
        const reactionIcon = v.reaction ? `<span class="status-viewer-row-reaction"><i class="fa-solid fa-${this.escape(v.reaction)}" style="color: #00ff88;"></i></span>` : '';

        row.innerHTML = `
          <div class="status-viewer-row-left">
            <img src="${this.escape(v.avatarUrl || 'logo.jpg')}" alt="Avatar" class="status-viewer-row-avatar" onerror="this.src='logo.jpg'" />
            <div class="status-viewer-row-info">
              <span class="status-viewer-row-name">${this.escape(v.username || 'User')}</span>
              <span class="status-viewer-row-time"><i class="fa-solid fa-clock"></i> ${timeStr}</span>
            </div>
          </div>
          ${reactionIcon}
        `;
        listContainer.appendChild(row);
      });
    }

    closeViewersDrawer() {
      const drawer = document.getElementById('statusViewersDrawer');
      if (drawer) drawer.style.display = 'none';
      const search = document.getElementById('statusViewersSearchInput');
      if (search) search.value = '';
    }

    // -------------------------------------------------------------------------
    // 7. PRE-UPLOAD WEBP IMAGE COMPRESSION PIPELINE
    // -------------------------------------------------------------------------
    async optimizeImage(file, maxDimension = 1440, quality = 0.82) {
      if (!file || !file.type.startsWith('image/') || file.type.includes('gif')) {
        return file; // Pass through non-images or GIFs
      }

      return new Promise((resolve) => {
        const objUrl = URL.createObjectURL(file);
        const img = new Image();
        img.src = objUrl;

        const cleanup = () => {
          try { URL.revokeObjectURL(objUrl); } catch (_) {}
        };

        img.onload = () => {
          cleanup();
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            canvas.width = 0;
            canvas.height = 0; // Release backing surface immediately
            if (blob && blob.size < file.size) {
              const optimizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                type: 'image/webp'
              });
              resolve(optimizedFile);
            } else {
              resolve(file);
            }
          }, 'image/webp', quality);
        };

        img.onerror = () => {
          cleanup();
          resolve(file);
        };
      });
    }

    // -------------------------------------------------------------------------
    // 8. PREDICTIVE NEXT-SLIDE MEDIA PRELOADER
    // -------------------------------------------------------------------------
    preloadNextSlide(slide) {
      if (!slide || !slide.mediaUrl || this.preloadCache.has(slide.mediaUrl)) return;
      this.preloadCache.add(slide.mediaUrl);

      if (slide.mediaType === 'video') {
        const vid = document.createElement('video');
        vid.preload = 'auto';
        vid.src = slide.mediaUrl;
      } else if (slide.mediaType === 'image') {
        const img = new Image();
        img.src = slide.mediaUrl;
      }
    }

    escape(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  }

  const instance = new NexStatusEliteSuite();
  if (typeof window !== 'undefined') {
    window.NexStatusEliteSuite = instance;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => instance.init());
    } else {
      instance.init();
    }
  }
})();
