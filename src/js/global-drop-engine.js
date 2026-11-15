/**
 * =============================================================================
 * NEXCHAT GLOBAL DROP ENGINE (src/js/global-drop-engine.js)
 * High-Performance Obsidian Cyber-Green Microblogging & Public Broadcast Matrix
 * =============================================================================
 */

import { auth, db } from '../../firebase-config.js';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { uploadAnyMedia } from './media-upload.js';

class GlobalDropEngine {
  constructor() {
    this.currentMode = 'radar'; // 'radar' | 'following' | 'nodes'
    this.currentTopic = 'all';  // 'all' | 'tech' | 'cybersec' | etc.
    this.unsubscribeFeed = null;
    this.selectedMediaFiles = [];
    this.recordedVoiceBlob = null;
    this.codeSnippet = null;
    this.activePoll = null;
    this.selectedTtl = 'permanent';
    this.currentReplyDrop = null;
    this.unsubscribeReplies = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecordingVoice = false;
    this.cachedDrops = [];
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION & EVENT BINDINGS
  // ---------------------------------------------------------------------------
  init() {
    console.log('[GLOBAL DROP] Initializing Global Drop Microblogging Engine...');
    this.bindHeaderTabs();
    this.bindTopicChips();
    this.bindComposer();
    this.bindRepliesDrawer();
    this.bindMobileFab();
    this.bindGlobalEvents();
    this.loadSideWidgets();
  }

  getUID() {
    return auth?.currentUser?.uid || window.myUID || localStorage.getItem('myUID') || localStorage.getItem('auth_uid') || '';
  }

  getUsername() {
    return auth?.currentUser?.displayName || window.myUsername || localStorage.getItem('myUsername') || 'Transmitter';
  }

  getAvatar() {
    return auth?.currentUser?.photoURL || window.myProfilePic || localStorage.getItem('myProfilePic') || 'logo.jpg';
  }

  // ---------------------------------------------------------------------------
  // 1. HEADER & MODE SWITCHING
  // ---------------------------------------------------------------------------
  // 1. HEADER & MODE SWITCHING
  // ---------------------------------------------------------------------------
  bindHeaderTabs() {
    const tabs = document.querySelectorAll('.x-tab-btn, .global-drop-mode-pill');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.getAttribute('data-mode') || 'radar';
        this.currentMode = mode;
        this.subscribeFeed();
      });
    });

    // Refresh feed button
    document.getElementById('globalDropRefreshBtn')?.addEventListener('click', () => {
      const icon = document.querySelector('#globalDropRefreshBtn i');
      if (icon) icon.classList.add('fa-spin');
      this.subscribeFeed();
      setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin');
      }, 700);
    });
  }

  bindTopicChips() {
    const chips = document.querySelectorAll('.x-topic-chip, .global-drop-topic-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const topic = chip.getAttribute('data-topic') || 'all';
        this.currentTopic = topic;
        this.filterAndRenderCachedDrops();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 2. DISPATCH COMPOSER (NEW DROP)
  // ---------------------------------------------------------------------------
  bindComposer() {
    const textarea = document.getElementById('globalDropTextarea');
    const charRingProgress = document.getElementById('globalDropCharProgress');
    const transmitBtn = document.getElementById('globalDropTransmitBtn');
    const mediaInput = document.getElementById('globalDropMediaFileInput');
    const addMediaBtn = document.getElementById('globalDropAddMediaBtn');
    const addCodeBtn = document.getElementById('globalDropAddCodeBtn');
    const addVoiceBtn = document.getElementById('globalDropAddVoiceBtn');
    const codeDrawer = document.getElementById('globalDropCodeDrawer');
    const voiceDrawer = document.getElementById('globalDropVoiceDrawer');
    const ttlSelect = document.getElementById('globalDropTtlSelect');
    const topicSelect = document.getElementById('globalDropTopicSelect');

    // Update avatar on composer
    const userAvatar = document.getElementById('globalDropComposerAvatar');
    if (userAvatar) userAvatar.src = this.getAvatar();

    // Auto-grow textarea & character limit ring
    textarea?.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 240) + 'px';

      const length = textarea.value.length;
      const max = 500;
      const radius = 10;
      const circumference = 2 * Math.PI * radius; // ~62.83
      const offset = circumference - (Math.min(length, max) / max) * circumference;

      if (charRingProgress) {
        charRingProgress.style.strokeDashoffset = offset;
        if (length > max) {
          charRingProgress.style.stroke = '#ef4444';
        } else if (length > max - 50) {
          charRingProgress.style.stroke = '#f59e0b';
        } else {
          charRingProgress.style.stroke = 'var(--drop-accent)';
        }
      }

      if (transmitBtn) {
        transmitBtn.disabled = (length === 0 && this.selectedMediaFiles.length === 0 && !this.codeSnippet && !this.recordedVoiceBlob);
      }
    });

    // Media attachment triggers
    addMediaBtn?.addEventListener('click', () => mediaInput?.click());
    mediaInput?.addEventListener('change', (e) => this.handleMediaSelection(e));

    // Code snippet drawer toggle
    addCodeBtn?.addEventListener('click', () => {
      if (!codeDrawer) return;
      const isOpen = codeDrawer.style.display === 'flex';
      codeDrawer.style.display = isOpen ? 'none' : 'flex';
      addCodeBtn.classList.toggle('active', !isOpen);
      if (!isOpen) {
        document.getElementById('globalDropCodeTextarea')?.focus();
      }
    });

    // Voice recording drawer toggle
    addVoiceBtn?.addEventListener('click', () => {
      if (!voiceDrawer) return;
      const isOpen = voiceDrawer.style.display === 'flex';
      voiceDrawer.style.display = isOpen ? 'none' : 'flex';
      addVoiceBtn.classList.toggle('active', !isOpen);
    });

    // Voice record button in composer
    const recBtn = document.getElementById('globalDropVoiceRecordBtn');
    recBtn?.addEventListener('click', () => this.toggleVoiceRecording());

    // TTL selector
    ttlSelect?.addEventListener('change', (e) => {
      this.selectedTtl = e.target.value || 'permanent';
    });

    // Transmit drop button
    transmitBtn?.addEventListener('click', () => this.transmitDrop());
  }

  handleMediaSelection(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Maximum 4 media items per drop
    const total = this.selectedMediaFiles.length + files.length;
    if (total > 4) {
      if (window.showNotif) window.showNotif('Maximum 4 media attachments per Drop', 'warning');
      return;
    }

    files.forEach(f => {
      if (f.size > 100 * 1024 * 1024) {
        if (window.showNotif) window.showNotif(`File ${f.name} exceeds 100MB limit`, 'error');
        return;
      }
      this.selectedMediaFiles.push(f);
    });

    this.renderComposerMediaPreviews();
    const transmitBtn = document.getElementById('globalDropTransmitBtn');
    if (transmitBtn) transmitBtn.disabled = false;
  }

  renderComposerMediaPreviews() {
    const container = document.getElementById('globalDropMediaPreviews');
    if (!container) return;
    container.innerHTML = '';

    if (!this.selectedMediaFiles.length) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    this.selectedMediaFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'global-drop-media-preview-item';

      const fileUrl = URL.createObjectURL(file);
      if (file.type.startsWith('video/')) {
        const vid = document.createElement('video');
        vid.src = fileUrl;
        vid.muted = true;
        item.appendChild(vid);
      } else {
        const img = document.createElement('img');
        img.src = fileUrl;
        item.appendChild(img);
      }

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'global-drop-media-remove-btn';
      removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', () => {
        this.selectedMediaFiles.splice(index, 1);
        this.renderComposerMediaPreviews();
        const textarea = document.getElementById('globalDropTextarea');
        const transmitBtn = document.getElementById('globalDropTransmitBtn');
        if (transmitBtn) {
          transmitBtn.disabled = (!textarea?.value.trim() && this.selectedMediaFiles.length === 0 && !this.codeSnippet && !this.recordedVoiceBlob);
        }
      });

      item.appendChild(removeBtn);
      container.appendChild(item);
    });
  }

  // ---------------------------------------------------------------------------
  // VOICE RECORDING IN COMPOSER
  // ---------------------------------------------------------------------------
  async toggleVoiceRecording() {
    const btn = document.getElementById('globalDropVoiceRecordBtn');
    const timerText = document.getElementById('globalDropVoiceTimer');

    if (!this.isRecordingVoice) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.audioChunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
          this.recordedVoiceBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          stream.getTracks().forEach(t => t.stop());
          if (btn) btn.classList.remove('recording');
          if (timerText) timerText.textContent = 'Voice Note Ready';
          const transmitBtn = document.getElementById('globalDropTransmitBtn');
          if (transmitBtn) transmitBtn.disabled = false;
        };

        this.mediaRecorder.start();
        this.isRecordingVoice = true;
        if (btn) btn.classList.add('recording');
        if (timerText) timerText.textContent = 'Recording... (Tap stop)';
      } catch (err) {
        console.error('[GLOBAL DROP] Microphone error:', err);
        if (window.showNotif) window.showNotif('Microphone access denied or unavailable', 'error');
      }
    } else {
      // Stop recording
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.isRecordingVoice = false;
    }
  }

  // ---------------------------------------------------------------------------
  // 3. TRANSMIT DROP (PUBLISH TO COLD-VAULT & FIRESTORE)
  // ---------------------------------------------------------------------------
  async transmitDrop() {
    const textarea = document.getElementById('globalDropTextarea');
    const transmitBtn = document.getElementById('globalDropTransmitBtn');
    const topicSelect = document.getElementById('globalDropTopicSelect');
    const codeTextarea = document.getElementById('globalDropCodeTextarea');
    const codeLangSelect = document.getElementById('globalDropCodeLangSelect');

    const content = textarea?.value.trim() || '';
    const uid = this.getUID();

    if (!uid) {
      if (window.showNotif) window.showNotif('Please sign in to transmit a Global Drop', 'error');
      return;
    }

    // Code snippet payload
    const rawCode = codeTextarea?.value.trim();
    if (rawCode) {
      this.codeSnippet = {
        code: rawCode,
        language: codeLangSelect?.value || 'javascript'
      };
    } else {
      this.codeSnippet = null;
    }

    if (!content && !this.selectedMediaFiles.length && !this.codeSnippet && !this.recordedVoiceBlob) {
      if (window.showNotif) window.showNotif('Drop cannot be empty. Add text, media, or code.', 'warning');
      return;
    }

    if (transmitBtn) {
      transmitBtn.disabled = true;
      transmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Posting...</span>';
    }

    try {
      // 1. Upload media files to Cold-Vault
      const mediaUrls = [];
      let detectedMediaType = 'none';

      for (const file of this.selectedMediaFiles) {
        try {
          const res = await uploadAnyMedia(file, { folder: 'global_drops', uid });
          const url = res.url || res.downloadUrl;
          if (url) {
            mediaUrls.push({
              url: url,
              type: file.type.startsWith('video/') ? 'video' : 'image',
              name: file.name
            });
            if (file.type.startsWith('video/')) detectedMediaType = 'video';
            else if (detectedMediaType !== 'video') detectedMediaType = 'image';
          }
        } catch (mErr) {
          console.error('[GLOBAL DROP] Media vault error:', mErr);
        }
      }

      // 2. Upload voice blob if present
      let voiceUrl = null;
      if (this.recordedVoiceBlob) {
        try {
          const voiceFile = new File([this.recordedVoiceBlob], `drop_voice_${Date.now()}.webm`, { type: 'audio/webm' });
          const vRes = await uploadAnyMedia(voiceFile, { folder: 'global_drops', uid });
          voiceUrl = vRes.url || vRes.downloadUrl;
          detectedMediaType = 'voice';
        } catch (vErr) {
          console.error('[GLOBAL DROP] Voice vault error:', vErr);
        }
      }

      if (this.codeSnippet && detectedMediaType === 'none') {
        detectedMediaType = 'code';
      }

      // 3. Extract hashtags
      const hashtags = (content.match(/#[a-zA-Z0-9_]+/g) || []).map(h => h.toLowerCase());
      const selectedTopic = topicSelect?.value || 'general';

      // 4. Calculate TTL
      const now = Date.now();
      let expiresAtMs = null;
      if (this.selectedTtl === '24h') expiresAtMs = now + 86400000;
      else if (this.selectedTtl === '48h') expiresAtMs = now + 172800000;
      else if (this.selectedTtl === '7d') expiresAtMs = now + 604800000;

      // 5. Build Drop Document Payload
      const dropDoc = {
        authorId: uid,
        userId: uid,
        authorName: this.getUsername(),
        authorHandle: (this.getUsername() || 'user').toLowerCase().replace(/\s+/g, '_'),
        authorPhoto: this.getAvatar(),
        authorVerified: true,
        content: content,
        mediaUrls: mediaUrls.map(m => m.url),
        mediaItems: mediaUrls,
        mediaType: detectedMediaType,
        voiceUrl: voiceUrl,
        codeSnippet: this.codeSnippet,
        topic: selectedTopic,
        tags: hashtags,
        ttl: this.selectedTtl,
        expiresAtMs: expiresAtMs,
        signalsCount: 0,
        likesCount: 0,
        likes: [],
        echoesCount: 0,
        repostsCount: 0,
        echoes: [],
        repliesCount: 0,
        viewsCount: 1,
        pinned: false,
        createdAt: serverTimestamp(),
        createdAtMs: now
      };

      // 6. Write to Firestore
      if (db) {
        await addDoc(collection(db, 'global_drops'), dropDoc);
      }

      // Reset composer
      if (textarea) {
        textarea.value = '';
        textarea.style.height = 'auto';
      }
      if (codeTextarea) codeTextarea.value = '';
      const codeDrawer = document.getElementById('globalDropCodeDrawer');
      if (codeDrawer) codeDrawer.style.display = 'none';
      const voiceDrawer = document.getElementById('globalDropVoiceDrawer');
      if (voiceDrawer) voiceDrawer.style.display = 'none';
      this.selectedMediaFiles = [];
      this.recordedVoiceBlob = null;
      this.codeSnippet = null;
      this.renderComposerMediaPreviews();

      if (window.showNotif) {
        window.showNotif('Global Drop transmitted to the network!', 'success', 3000);
      }
    } catch (err) {
      console.error('[GLOBAL DROP] Transmission error:', err);
      if (window.showNotif) {
        window.showNotif('Failed to transmit Drop: ' + (err.message || 'Unknown network error'), 'error');
      }
    } finally {
      if (transmitBtn) {
        transmitBtn.disabled = false;
        transmitBtn.innerHTML = '<span>Post</span>';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. REAL-TIME FEED SUBSCRIPTION
  // ---------------------------------------------------------------------------
  subscribeFeed() {
    if (!db) return;

    if (this.unsubscribeFeed) {
      this.unsubscribeFeed();
      this.unsubscribeFeed = null;
    }

    const streamContainer = document.getElementById('globalDropStreamList');
    if (streamContainer) {
      streamContainer.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; color: var(--drop-text-muted);">
          <i class="fa-solid fa-satellite fa-spin" style="font-size: 28px; color: var(--drop-accent); margin-bottom: 12px; display: block;"></i>
          <span>Synchronizing Global Radar...</span>
        </div>
      `;
    }

    try {
      const dropsRef = collection(db, 'global_drops');
      let q = query(dropsRef, orderBy('createdAtMs', 'desc'), limit(50));

      this.unsubscribeFeed = onSnapshot(q, (snapshot) => {
        const drops = [];
        const now = Date.now();

        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          // Filter out expired TTL drops
          if (data.expiresAtMs && data.expiresAtMs < now) {
            return;
          }
          drops.push({ id: docSnap.id, ...data });
        });

        this.cachedDrops = drops;
        this.filterAndRenderCachedDrops();
      }, (err) => {
        console.warn('[GLOBAL DROP] Feed listener notice:', err);
        if (streamContainer) {
          streamContainer.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: var(--drop-text-muted);">
              <i class="fa-solid fa-earth-americas" style="font-size: 32px; color: var(--drop-card-border); margin-bottom: 12px; display: block;"></i>
              <p style="font-weight: 600; margin-bottom: 6px;">No drops received yet</p>
              <span style="font-size: 13px;">Be the first transmitter to broadcast a Global Drop!</span>
            </div>
          `;
        }
      });
    } catch (err) {
      console.error('[GLOBAL DROP] Query error:', err);
    }
  }

  filterAndRenderCachedDrops() {
    let list = [...this.cachedDrops];

    // Filter by mode
    if (this.currentMode === 'following') {
      const myUid = this.getUID();
      // Show user's own drops or mutual contacts
      list = list.filter(d => d.authorId === myUid);
    }

    // Filter by topic
    if (this.currentTopic && this.currentTopic !== 'all') {
      const topicTag = '#' + this.currentTopic.replace('#', '').toLowerCase();
      list = list.filter(d => {
        const hasTopic = (d.topic && d.topic.toLowerCase() === this.currentTopic.toLowerCase());
        const hasTag = (Array.isArray(d.tags) && d.tags.some(t => t.toLowerCase() === topicTag));
        return hasTopic || hasTag;
      });
    }

    this.renderDrops(list);
  }

  // ---------------------------------------------------------------------------
  // 5. DROP CARDS RENDERING (OFFICIAL X CONTINUOUS TIMELINE ARCHITECTURE)
  // ---------------------------------------------------------------------------
  renderDrops(drops) {
    const container = document.getElementById('globalDropStreamList');
    if (!container) return;

    if (!drops.length) {
      container.innerHTML = `
        <div style="padding: 60px 20px; text-align: center; color: var(--x-text-secondary); border-bottom: 1px solid var(--x-border);">
          <i class="fa-solid fa-earth-americas" style="font-size: 38px; color: var(--x-green); margin-bottom: 14px; display: block; opacity: 0.85; filter: drop-shadow(0 0 14px var(--x-green-glow));"></i>
          <h3 style="font-size: 19px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">Welcome to Global Drop!</h3>
          <p style="font-size: 14px; color: var(--x-text-secondary); max-width: 380px; margin: 0 auto; line-height: 1.45;">This is the best place to see what is happening in the cyber matrix right now. Transmit your first drop above!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    const myUid = this.getUID();

    drops.forEach(drop => {
      const card = document.createElement('article');
      card.className = 'x-drop-row global-drop-card';
      card.id = `drop-card-${drop.id}`;
      card.dataset.dropId = drop.id;

      // Time format
      const timeStr = this.formatRelativeTime(drop.createdAtMs || (drop.createdAt?.seconds ? drop.createdAt.seconds * 1000 : Date.now()));
      const safeAuthor = this.escapeHtml(drop.authorName || 'Transmitter');
      const safeHandle = this.escapeHtml(drop.authorHandle || (drop.authorName ? drop.authorName.toLowerCase().replace(/\s+/g, '_') : 'node'));
      const safeAvatar = drop.authorPhoto || 'logo.jpg';
      const isSignaled = Array.isArray(drop.likes) && drop.likes.includes(myUid);
      const isEchoed = Array.isArray(drop.echoes) && drop.echoes.includes(myUid);

      // Pinned / TTL badge
      let ttlBadge = '';
      if (drop.ttl && drop.ttl !== 'permanent') {
        ttlBadge = `<span class="x-drop-ttl-badge" title="Auto-purges after ${drop.ttl}"><i class="fa-regular fa-clock"></i> ${drop.ttl}</span>`;
      }

      // Text with highlighted tags
      const formattedContent = this.formatDropText(drop.content || '');

      // Media Grid HTML
      const mediaHtml = this.buildMediaGridHtml(drop);

      // Code Box HTML
      const codeHtml = this.buildCodeBoxHtml(drop.codeSnippet);

      // Voice Player HTML
      const voiceHtml = drop.voiceUrl ? `
        <div class="x-drop-voice-player global-drop-voice-player">
          <button type="button" class="x-drop-voice-play-btn global-drop-voice-play-btn" data-url="${drop.voiceUrl}">
            <i class="fa-solid fa-play"></i>
          </button>
          <div class="x-drop-voice-wave-bars global-drop-voice-wave-bars">
            ${Array.from({ length: 28 }).map((_, i) => `<div class="x-drop-voice-wave-bar" style="height: ${4 + (i % 7) * 3}px;"></div>`).join('')}
          </div>
          <span style="font-size: 11px; color: var(--x-text-secondary); font-family: var(--x-mono); letter-spacing: 0.5px;">AUDIO DROP</span>
        </div>
      ` : '';

      card.innerHTML = `
        <div class="x-drop-avatar-col">
          <div class="x-avatar-wrap">
            <img src="${safeAvatar}" alt="${safeAuthor}" class="x-drop-avatar" onerror="this.src='logo.jpg'" />
            <div class="x-avatar-status-beacon"></div>
          </div>
        </div>

        <div class="x-drop-main-col">
          <div class="x-drop-header">
            <div class="x-drop-author-info">
              <span class="x-drop-author-name">${safeAuthor}</span>
              <i class="fa-solid fa-circle-check x-drop-verified" title="Verified Cyber Node"></i>
              <span class="x-drop-author-handle">@${safeHandle}</span>
              <span class="x-drop-dot">·</span>
              <span class="x-drop-time">${timeStr}</span>
              ${ttlBadge}
            </div>
            <button type="button" class="x-drop-more-btn global-drop-card-more-btn" data-drop-id="${drop.id}" title="More options">
              <i class="fa-solid fa-ellipsis"></i>
            </button>
          </div>

          ${formattedContent ? `<div class="x-drop-text">${formattedContent}</div>` : ''}
          ${mediaHtml}
          ${codeHtml}
          ${voiceHtml}

          <!-- X Action Row (Comment, Retweet, Like, Views, Bookmark, Share) -->
          <div class="x-action-row">
            <!-- 1. Reply -->
            <button type="button" class="x-action-btn x-action-reply global-drop-action-btn discuss" data-drop-id="${drop.id}" title="Reply">
              <div class="x-action-icon-circle">
                <i class="fa-regular fa-comment"></i>
              </div>
              <span class="x-action-count reply-count">${drop.repliesCount || 0}</span>
            </button>

            <!-- 2. Repost / Echo -->
            <button type="button" class="x-action-btn x-action-echo global-drop-action-btn echo ${isEchoed ? 'active' : ''}" data-drop-id="${drop.id}" title="Repost">
              <div class="x-action-icon-circle">
                <i class="fa-solid fa-retweet"></i>
              </div>
              <span class="x-action-count echo-count">${drop.echoesCount || 0}</span>
            </button>

            <!-- 3. Like / Signal -->
            <button type="button" class="x-action-btn x-action-like global-drop-action-btn signal ${isSignaled ? 'active' : ''}" data-drop-id="${drop.id}" title="Like">
              <div class="x-action-icon-circle">
                <i class="${isSignaled ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
              </div>
              <span class="x-action-count signal-count">${drop.signalsCount || drop.likesCount || (Array.isArray(drop.likes) ? drop.likes.length : 0)}</span>
            </button>

            <!-- 4. Views / Analytics -->
            <button type="button" class="x-action-btn x-action-views" data-drop-id="${drop.id}" title="Views">
              <div class="x-action-icon-circle">
                <i class="fa-solid fa-chart-simple"></i>
              </div>
              <span class="x-action-count">${drop.viewsCount || (drop.likesCount ? drop.likesCount * 4 + 18 : '84')}</span>
            </button>

            <!-- 5. Bookmark & Share -->
            <div class="x-action-group-right">
              <button type="button" class="x-action-btn x-action-bookmark global-drop-action-btn bookmark" data-drop-id="${drop.id}" title="Bookmark">
                <div class="x-action-icon-circle">
                  <i class="fa-regular fa-bookmark"></i>
                </div>
              </button>
              <button type="button" class="x-action-btn x-action-share global-drop-action-btn forward" data-drop-id="${drop.id}" title="Share">
                <div class="x-action-icon-circle">
                  <i class="fa-solid fa-arrow-up-from-bracket"></i>
                </div>
              </button>
            </div>
          </div>
        </div>
      `;

      // Event Listeners for actions
      this.bindCardActions(card, drop);
      container.appendChild(card);
    });
  }

  buildMediaGridHtml(drop) {
    const urls = Array.isArray(drop.mediaUrls) ? drop.mediaUrls : [];
    if (!urls.length) return '';

    const count = Math.min(urls.length, 4);
    const gridClass = `grid-${count}`;

    const cellsHtml = urls.slice(0, 4).map(url => {
      const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || drop.mediaType === 'video';
      if (isVideo) {
        return `
          <div class="x-media-cell global-drop-media-cell" data-media-url="${url}">
            <video src="${url}" controls preload="metadata" playsinline></video>
          </div>
        `;
      }
      return `
        <div class="x-media-cell global-drop-media-cell" data-media-url="${url}">
          <img src="${url}" alt="Drop Attachment" loading="lazy" />
        </div>
      `;
    }).join('');

    return `<div class="x-media-grid global-drop-media-grid ${gridClass}">${cellsHtml}</div>`;
  }

  buildCodeBoxHtml(codeSnippet) {
    if (!codeSnippet || !codeSnippet.code) return '';
    const safeCode = this.escapeHtml(codeSnippet.code);
    const lang = this.escapeHtml(codeSnippet.language || 'code');

    return `
      <div class="x-drop-code-box global-drop-code-box">
        <div class="x-drop-code-header">
          <div class="x-drop-code-dots">
            <span class="x-dot-r"></span>
            <span class="x-dot-y"></span>
            <span class="x-dot-g"></span>
          </div>
          <div class="x-drop-code-meta">
            <span class="x-drop-code-lang">${lang}</span>
            <button type="button" class="x-drop-code-copy-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(codeSnippet.code)}')).then(() => { if(window.showNotif) window.showNotif('Code snippet copied to clipboard', 'success'); })">
              <i class="fa-regular fa-copy"></i> Copy
            </button>
          </div>
        </div>
        <pre class="x-drop-code-pre"><code>${safeCode}</code></pre>
      </div>
    `;
  }

  bindCardActions(card, drop) {
    // 1. Signal / Like
    card.querySelector('.global-drop-action-btn.signal')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSignal(drop.id, card);
    });

    // 2. Echo / Retransmit
    card.querySelector('.global-drop-action-btn.echo')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleEcho(drop.id, card);
    });

    // 3. Discussion / Reply
    card.querySelector('.global-drop-action-btn.discuss')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openRepliesDrawer(drop);
    });

    // 4. Forward to Chat
    card.querySelector('.global-drop-action-btn.forward')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.shareDropToChat(drop);
    });

    // 5. Bookmark
    card.querySelector('.global-drop-action-btn.bookmark')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = card.querySelector('.global-drop-action-btn.bookmark');
      btn.classList.toggle('active');
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = btn.classList.contains('active') ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
      }
      if (window.showNotif) window.showNotif('Drop saved to Cyber Vault bookmarks', 'success');
    });

    // 6. Voice playback trigger
    const voiceBtn = card.querySelector('.global-drop-voice-play-btn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playVoiceAudio(voiceBtn, voiceBtn.getAttribute('data-url'));
      });
    }

    // 7. More options (Delete if owner)
    card.querySelector('.global-drop-card-more-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openDropOptionsMenu(drop);
    });
  }

  // ---------------------------------------------------------------------------
  // 6. INTERACTIVE ACTIONS (SIGNAL, ECHO, SHARE)
  // ---------------------------------------------------------------------------
  async toggleSignal(dropId, card) {
    const uid = this.getUID();
    if (!uid) {
      if (window.showNotif) window.showNotif('Please sign in to pulse signals', 'warning');
      return;
    }

    const btn = card.querySelector('.global-drop-action-btn.signal');
    const countEl = btn?.querySelector('.signal-count');
    const icon = btn?.querySelector('i');
    const isActive = btn?.classList.contains('active');

    // Optimistic UI
    if (btn) btn.classList.toggle('active');
    if (icon) icon.className = !isActive ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    if (countEl) {
      const cur = parseInt(countEl.textContent || '0', 10);
      countEl.textContent = !isActive ? cur + 1 : Math.max(0, cur - 1);
    }

    try {
      const dropRef = doc(db, 'global_drops', dropId);
      if (!isActive) {
        await updateDoc(dropRef, {
          likes: arrayUnion(uid),
          signalsCount: increment(1),
          likesCount: increment(1)
        });
      } else {
        await updateDoc(dropRef, {
          likes: arrayRemove(uid),
          signalsCount: increment(-1),
          likesCount: increment(-1)
        });
      }
    } catch (err) {
      console.error('[GLOBAL DROP] Signal error:', err);
    }
  }

  async toggleEcho(dropId, card) {
    const uid = this.getUID();
    if (!uid) return;

    const btn = card.querySelector('.global-drop-action-btn.echo');
    const countEl = btn?.querySelector('.echo-count');
    const isActive = btn?.classList.contains('active');

    if (btn) btn.classList.toggle('active');
    if (countEl) {
      const cur = parseInt(countEl.textContent || '0', 10);
      countEl.textContent = !isActive ? cur + 1 : Math.max(0, cur - 1);
    }

    try {
      const dropRef = doc(db, 'global_drops', dropId);
      if (!isActive) {
        await updateDoc(dropRef, {
          echoes: arrayUnion(uid),
          echoesCount: increment(1),
          repostsCount: increment(1)
        });
        if (window.showNotif) window.showNotif('Echoed to your network transmitters!', 'success');
      } else {
        await updateDoc(dropRef, {
          echoes: arrayRemove(uid),
          echoesCount: increment(-1),
          repostsCount: increment(-1)
        });
      }
    } catch (err) {
      console.error('[GLOBAL DROP] Echo error:', err);
    }
  }

  shareDropToChat(drop) {
    const link = `${window.location.origin}/chat?drop=${drop.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      if (window.showNotif) window.showNotif('Drop link copied! Share directly in chats.', 'success');
    }
  }

  playVoiceAudio(btn, url) {
    if (!url) return;
    if (this.currentAudio && this.currentAudioBtn === btn) {
      if (this.currentAudio.paused) {
        this.currentAudio.play();
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      } else {
        this.currentAudio.pause();
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
      return;
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      if (this.currentAudioBtn) this.currentAudioBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }

    const audio = new Audio(url);
    this.currentAudio = audio;
    this.currentAudioBtn = btn;
    btn.innerHTML = '<i class="fa-solid fa-pause"></i>';

    audio.onended = () => {
      btn.innerHTML = '<i class="fa-solid fa-play"></i>';
      this.currentAudio = null;
      this.currentAudioBtn = null;
    };

    audio.play().catch(e => console.warn('[GLOBAL DROP] Audio play block:', e));
  }

  openDropOptionsMenu(drop) {
    const myUid = this.getUID();
    const isOwner = (drop.authorId === myUid || drop.userId === myUid);

    const action = confirm(isOwner ? 'Delete this Global Drop from the network?' : 'Copy link to this Drop?');
    if (!action) return;

    if (isOwner) {
      deleteDoc(doc(db, 'global_drops', drop.id))
        .then(() => {
          if (window.showNotif) window.showNotif('Drop purged from the network', 'success');
        })
        .catch(err => console.error('[GLOBAL DROP] Delete error:', err));
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/chat?drop=${drop.id}`);
      if (window.showNotif) window.showNotif('Drop link copied to clipboard', 'success');
    }
  }

  // ---------------------------------------------------------------------------
  // 7. REPLIES & DISCUSSIONS DRAWER
  // ---------------------------------------------------------------------------
  bindRepliesDrawer() {
    const drawer = document.getElementById('globalDropRepliesDrawer');
    const closeBtn = document.getElementById('globalDropRepliesCloseBtn');
    const sendBtn = document.getElementById('globalDropReplySendBtn');
    const input = document.getElementById('globalDropReplyInput');

    closeBtn?.addEventListener('click', () => {
      if (drawer) drawer.style.display = 'none';
      if (this.unsubscribeReplies) {
        this.unsubscribeReplies();
        this.unsubscribeReplies = null;
      }
    });

    drawer?.addEventListener('click', (e) => {
      if (e.target === drawer) {
        drawer.style.display = 'none';
        if (this.unsubscribeReplies) {
          this.unsubscribeReplies();
          this.unsubscribeReplies = null;
        }
      }
    });

    const submitReply = async () => {
      const text = input?.value.trim();
      if (!text || !this.currentReplyDrop) return;
      const uid = this.getUID();
      if (!uid) return;

      input.value = '';

      try {
        const repliesCol = collection(db, 'global_drops', this.currentReplyDrop.id, 'replies');
        await addDoc(repliesCol, {
          authorId: uid,
          userId: uid,
          authorName: this.getUsername(),
          authorHandle: (this.getUsername() || 'user').toLowerCase().replace(/\s+/g, '_'),
          authorPhoto: this.getAvatar(),
          content: text,
          createdAt: serverTimestamp(),
          createdAtMs: Date.now()
        });

        // Increment reply count on parent drop
        const dropRef = doc(db, 'global_drops', this.currentReplyDrop.id);
        await updateDoc(dropRef, { repliesCount: increment(1) });
      } catch (err) {
        console.error('[GLOBAL DROP] Post reply error:', err);
      }
    };

    sendBtn?.addEventListener('click', submitReply);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitReply();
      }
    });
  }

  openRepliesDrawer(drop) {
    this.currentReplyDrop = drop;
    const drawer = document.getElementById('globalDropRepliesDrawer');
    const list = document.getElementById('globalDropRepliesList');
    if (!drawer || !list) return;

    drawer.style.display = 'flex';
    list.innerHTML = `
      <div style="padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--drop-card-border); border-radius: 12px; margin-bottom: 12px;">
        <span style="font-weight: 700; color: var(--drop-accent);">@${this.escapeHtml(drop.authorHandle || 'user')}</span>: ${this.escapeHtml(drop.content || '')}
      </div>
      <div style="text-align: center; color: var(--drop-text-muted); padding: 20px;">
        <i class="fa-solid fa-spinner fa-spin"></i> Loading replies...
      </div>
    `;

    if (this.unsubscribeReplies) {
      this.unsubscribeReplies();
      this.unsubscribeReplies = null;
    }

    try {
      const repliesCol = collection(db, 'global_drops', drop.id, 'replies');
      const q = query(repliesCol, orderBy('createdAtMs', 'asc'), limit(50));

      this.unsubscribeReplies = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          list.innerHTML = `
            <div style="padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--drop-card-border); border-radius: 12px; margin-bottom: 12px;">
              <span style="font-weight: 700; color: var(--drop-accent);">@${this.escapeHtml(drop.authorHandle || 'user')}</span>: ${this.escapeHtml(drop.content || '')}
            </div>
            <div style="text-align: center; color: var(--drop-text-muted); padding: 20px;">
              No replies yet. Be the first to start the discussion!
            </div>
          `;
          return;
        }

        let html = `
          <div style="padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--drop-card-border); border-radius: 12px; margin-bottom: 12px;">
            <span style="font-weight: 700; color: var(--drop-accent);">@${this.escapeHtml(drop.authorHandle || 'user')}</span>: ${this.escapeHtml(drop.content || '')}
          </div>
        `;

        snapshot.forEach(docSnap => {
          const rep = docSnap.data();
          const t = this.formatRelativeTime(rep.createdAtMs || Date.now());
          html += `
            <div style="display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
              <img src="${rep.authorPhoto || 'logo.jpg'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" onerror="this.src='logo.jpg'" />
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                  <span style="font-size: 13px; font-weight: 700; color: #ffffff;">${this.escapeHtml(rep.authorName || 'Transmitter')}</span>
                  <span style="font-size: 11px; color: var(--drop-text-muted);">@${this.escapeHtml(rep.authorHandle || 'user')} • ${t}</span>
                </div>
                <div style="font-size: 13.5px; color: #e2e8f0; line-height: 1.45;">${this.escapeHtml(rep.content || '')}</div>
              </div>
            </div>
          `;
        });

        list.innerHTML = html;
      });
    } catch (err) {
      console.error('[GLOBAL DROP] Reply subscription error:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // 8. MOBILE CYBER-FAB
  // ---------------------------------------------------------------------------
  bindMobileFab() {
    const fab = document.getElementById('globalDropMobileFab');
    fab?.addEventListener('click', () => {
      const composer = document.querySelector('.x-composer, .global-drop-composer-card');
      if (composer) {
        composer.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('globalDropTextarea')?.focus();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 9. SIDEBAR MODULES (TRENDING & WHO TO FOLLOW)
  // ---------------------------------------------------------------------------
  loadSideWidgets() {
    // 1. Trending Topics (What's happening)
    const trendingList = document.getElementById('globalDropTrendingList');
    if (trendingList) {
      const trendingItems = [
        { category: 'Technology · Trending', tag: '#ChronexAI', count: '48.2K Drops' },
        { category: 'Cyber Security · Trending', tag: '#E2EEProtocol', count: '29.5K Drops' },
        { category: 'Web3 & Quantum · Trending', tag: '#QuantumVault', count: '18.1K Drops' },
        { category: 'Development · Trending', tag: '#ViteArchitecture', count: '14.3K Drops' },
        { category: 'Gaming Hub · Trending', tag: '#CyberCombat', count: '10.8K Drops' }
      ];

      trendingList.innerHTML = trendingItems.map(item => `
        <div class="x-trending-item global-drop-trending-item" data-tag="${item.tag}">
          <span class="x-trending-category">${item.category}</span>
          <span class="x-trending-tag">${item.tag}</span>
          <span class="x-trending-count">${item.count}</span>
        </div>
      `).join('');

      trendingList.querySelectorAll('.x-trending-item').forEach(el => {
        el.addEventListener('click', () => {
          const tag = el.getAttribute('data-tag');
          if (tag) {
            this.currentTopic = tag.replace('#', '').toLowerCase();
            const chip = document.querySelector(`.x-topic-chip[data-topic="${this.currentTopic}"], .global-drop-topic-chip[data-topic="${this.currentTopic}"]`);
            if (chip) chip.click();
            else this.filterAndRenderCachedDrops();
          }
        });
      });
    }

    // 2. Who to follow widget
    const followList = document.getElementById('globalDropFollowList');
    if (followList) {
      const followRecs = [
        { name: 'Chronex AI', handle: 'chronex_ai', avatar: 'logo.jpg' },
        { name: 'NEX Core Enclave', handle: 'nex_core', avatar: 'logo.jpg' },
        { name: 'Sentinel Protocol', handle: 'sentinel_shield', avatar: 'logo.jpg' }
      ];

      followList.innerHTML = followRecs.map(rec => `
        <div class="x-follow-item">
          <div class="x-follow-user-left">
            <img src="${rec.avatar}" alt="${rec.name}" class="x-follow-avatar" onerror="this.src='logo.jpg'" />
            <div class="x-follow-names">
              <span class="x-follow-display-name">${rec.name}</span>
              <span class="x-follow-handle">@${rec.handle}</span>
            </div>
          </div>
          <button type="button" class="x-follow-btn" onclick="this.textContent = this.textContent === 'Follow' ? 'Following' : 'Follow'; if(window.showNotif) window.showNotif('Following @${rec.handle}', 'success');">Follow</button>
        </div>
      `).join('');
    }

    // 3. User rail info update
    this.updateUserRailPill();
  }

  updateUserRailPill() {
    const name = this.getUsername();
    const handle = '@' + name.toLowerCase().replace(/\s+/g, '_');
    const avatar = this.getAvatar();

    const nameEl = document.getElementById('globalDropNavUserName');
    if (nameEl) nameEl.textContent = name;

    const handleEl = document.getElementById('globalDropNavUserHandle');
    if (handleEl) handleEl.textContent = handle;

    const avatarEl = document.getElementById('globalDropNavUserAvatar');
    if (avatarEl) avatarEl.src = avatar;

    const mobileAvatarEl = document.getElementById('globalDropMobileHeaderAvatar');
    if (mobileAvatarEl) mobileAvatarEl.src = avatar;
  }

  bindGlobalEvents() {
    // Lightbox image clicks
    document.addEventListener('click', (e) => {
      const cell = e.target.closest('.global-drop-media-cell');
      if (cell) {
        const img = cell.querySelector('img');
        if (img && window.setupMediaLightbox) {
          // If lightbox available
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  formatRelativeTime(ms) {
    if (!ms) return 'now';
    const diff = Math.floor((Date.now() - ms) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  formatDropText(text) {
    if (!text) return '';
    let escaped = this.escapeHtml(text);
    // Replace hashtags with links
    escaped = escaped.replace(/(^|\s)(#[a-zA-Z0-9_]+)/g, '$1<a href="javascript:void(0)" class="drop-hashtag">$2</a>');
    // Replace @mentions with links
    escaped = escaped.replace(/(^|\s)(@[a-zA-Z0-9_]+)/g, '$1<a href="javascript:void(0)" class="drop-mention">$2</a>');
    return escaped;
  }

  escapeHtml(str) {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(str).replace(/[&<>"']/g, m => map[m]);
  }
}

// Global Singleton
const globalDropEngine = new GlobalDropEngine();

export function initGlobalDropEngine() {
  globalDropEngine.init();
  globalDropEngine.subscribeFeed();
}

export { globalDropEngine };
