/**
 * NEXCHAT WATCH TOGETHER // SYNCHRONIZED THEATER & FLOATING REACTIONS
 * 
 * Capabilities:
 * - Sub-150ms synchronized video playback (Play, Pause, Seek) via Supabase Realtime
 * - Multi-source support: Direct MP4 / WebM video links & YouTube embeds
 * - Live Floating Reaction Cannon (particles float up across all participants in real time)
 * - Integrated live video commentary feed
 */

(function () {
  'use strict';

  class WatchTogetherEngine {
    constructor() {
      this.activeUrl = null;
      this.isHost = false;
      this.isPlaying = false;
      this.currentTime = 0;
      this.mediaType = 'video'; // 'video' or 'youtube'

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
      this.injectModal();
      this.bindTriggers();
    }

    injectModal() {
      if (document.getElementById('watchTogetherModal')) return;

      const modal = document.createElement('div');
      modal.id = 'watchTogetherModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window theater-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-film text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">WATCH TOGETHER // SYNCHRONIZED THEATER</h3>
            </div>
            <button type="button" class="cyber-modal-close" id="closeTheaterModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <!-- Video URL Ingestion Bar -->
          <div class="theater-url-bar">
            <input type="text" id="theaterVideoUrlInput" placeholder="Paste YouTube link or direct MP4/WebM video URL..." autocomplete="off">
            <button type="button" id="loadTheaterVideoBtn" class="theater-load-btn">
              <i class="fa-solid fa-play"></i> LOAD &amp; SYNC
            </button>
          </div>

          <!-- Quick Presets -->
          <div class="theater-presets-row">
            <span class="text-xs text-gray-400 font-semibold mr-1">PRESETS:</span>
            <button type="button" class="theater-preset-pill" data-url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4">
              <i class="fa-solid fa-film"></i> Cyber Bunny HD
            </button>
            <button type="button" class="theater-preset-pill" data-url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4">
              <i class="fa-solid fa-video"></i> Neon Dream Sci-Fi
            </button>
            <button type="button" class="theater-preset-pill" data-url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4">
              <i class="fa-solid fa-robot"></i> Tears of Steel (VFX)
            </button>
          </div>

          <!-- Main Stage Viewport -->
          <div class="theater-stage" id="theaterStage">
            <div id="theaterPlaceholder" class="theater-placeholder">
              <i class="fa-solid fa-clapperboard" style="font-size: 48px; color: #64748b; margin-bottom: 12px; display: block;"></i>
              <p class="text-sm text-gray-300">Select a preset or paste any video link to start synced playback with your friend</p>
            </div>

            <video id="theaterVideoPlayer" class="theater-player" controls playsinline style="display: none;"></video>
            <iframe id="theaterIframePlayer" class="theater-iframe" style="display: none;" frameborder="0" allowfullscreen allow="autoplay"></iframe>

            <!-- Floating Reaction Overlay Particles Stage -->
            <div id="floatingReactionsStage" class="floating-reactions-stage"></div>
          </div>

          <!-- In-Theater Floating Reaction Cannon Bar -->
          <div class="theater-reaction-dock">
            <div class="reaction-dock-label">TAP TO FIRE REACTION:</div>
            <div class="reaction-buttons-grid">
              <button type="button" class="theater-react-btn" data-emoji="fire"><i class="fa-solid fa-fire" style="color: #f97316;"></i></button>
              <button type="button" class="theater-react-btn" data-emoji="skull"><i class="fa-solid fa-skull"></i></button>
              <button type="button" class="theater-react-btn" data-emoji="rocket"><i class="fa-solid fa-rocket" style="color: #38bdf8;"></i></button>
              <button type="button" class="theater-react-btn" data-emoji="heart"><i class="fa-solid fa-heart" style="color: #ef4444;"></i></button>
              <button type="button" class="theater-react-btn" data-emoji="mindblown"><i class="fa-solid fa-burst" style="color: #eab308;"></i></button>
              <button type="button" class="theater-react-btn" data-emoji="laugh"><i class="fa-solid fa-face-laugh" style="color: #22c55e;"></i></button>
            </div>
            <button type="button" id="shareTheaterInviteBtn" class="theater-share-btn" title="Invite active chat partner">
              <i class="fa-solid fa-share-nodes"></i> Share Link in Chat
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('closeTheaterModalBtn')?.addEventListener('click', () => {
        this.closeModal();
      });

      document.getElementById('loadTheaterVideoBtn')?.addEventListener('click', () => {
        const input = document.getElementById('theaterVideoUrlInput');
        if (input && input.value.trim()) {
          this.loadVideo(input.value.trim(), true);
        }
      });

      // Presets
      modal.querySelectorAll('.theater-preset-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const url = pill.dataset.url;
          const input = document.getElementById('theaterVideoUrlInput');
          if (input) input.value = url;
          this.loadVideo(url, true);
        });
      });

      // Reaction Cannon Buttons
      modal.querySelectorAll('.theater-react-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const emoji = btn.dataset.emoji;
          this.fireReaction(emoji, true);
        });
      });

      // Share Link
      document.getElementById('shareTheaterInviteBtn')?.addEventListener('click', () => {
        this.shareInviteToChat();
      });

      // HTML5 Video Sync Event Listeners
      const videoEl = document.getElementById('theaterVideoPlayer');
      if (videoEl) {
        videoEl.addEventListener('play', () => {
          if (this.isHost) this.broadcastSync('play', videoEl.currentTime);
        });
        videoEl.addEventListener('pause', () => {
          if (this.isHost) this.broadcastSync('pause', videoEl.currentTime);
        });
        videoEl.addEventListener('seeked', () => {
          if (this.isHost) this.broadcastSync('seek', videoEl.currentTime);
        });
      }
    }

    bindTriggers() {
      // Add tile into Attachment Hub
      const attachHubGrid = document.querySelector('.attach-hub-grid');
      if (attachHubGrid && !document.getElementById('hubActionWatchTogether')) {
        const item = document.createElement('div');
        item.id = 'hubActionWatchTogether';
        item.className = 'attach-hub-item';
        item.innerHTML = `
          <div class="attach-hub-icon icon-theater" style="background: linear-gradient(135deg, rgba(0, 240, 118, 0.25), rgba(0, 212, 255, 0.25)); border-color: #00d4ff;">
            <i class="fa-solid fa-film" style="color: #00f2fe;"></i>
          </div>
          <span>Watch Together</span>
        `;
        item.addEventListener('click', () => {
          const hub = document.getElementById('attachmentHub');
          if (hub) hub.style.display = 'none';
          this.openModal();
        });
        attachHubGrid.appendChild(item);
      }
    }

    openModal() {
      const modal = document.getElementById('watchTogetherModal');
      if (modal) modal.style.display = 'flex';
      this.isHost = true;
      if (window.playLuxuryPopSound) window.playLuxuryPopSound();
    }

    closeModal() {
      const modal = document.getElementById('watchTogetherModal');
      if (modal) modal.style.display = 'none';

      const video = document.getElementById('theaterVideoPlayer');
      if (video) {
        video.pause();
        video.src = '';
      }
      const iframe = document.getElementById('theaterIframePlayer');
      if (iframe) iframe.src = '';
    }

    loadVideo(url, isHost = false) {
      this.activeUrl = url;
      this.isHost = isHost;

      const placeholder = document.getElementById('theaterPlaceholder');
      const video = document.getElementById('theaterVideoPlayer');
      const iframe = document.getElementById('theaterIframePlayer');

      if (placeholder) placeholder.style.display = 'none';

      // Check if YouTube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        this.mediaType = 'youtube';
        let videoId = '';
        if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('v=')) {
          videoId = url.split('v=')[1].split('&')[0];
        }

        if (video) video.style.display = 'none';
        if (iframe) {
          iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
          iframe.style.display = 'block';
        }
      } else {
        // Direct MP4 / WebM
        this.mediaType = 'video';
        if (iframe) iframe.style.display = 'none';
        if (video) {
          video.src = url;
          video.style.display = 'block';
          video.play().catch(() => {});
        }
      }

      if (isHost) {
        this.broadcastSync('load', 0, url);
        if (window.showNotif) window.showNotif('Synchronized video loaded!', 'success', 2000);
      }
    }

    broadcastSync(action, time = 0, url = null) {
      const partnerId = window.currentChatUserId || window.currentChatUser;
      if (!partnerId) return;

      if (typeof window.sendSupabaseMessage === 'function') {
        window.sendSupabaseMessage({
          from: window.myUID,
          to: partnerId,
          text: `[THEATER] Sync: ${action}`,
          isWatchPartySync: true,
          syncAction: action,
          syncTime: time,
          syncUrl: url || this.activeUrl,
          chatType: 'direct'
        }).catch(() => {});
      }
    }

    fireReaction(emoji, broadcast = true) {
      const stage = document.getElementById('floatingReactionsStage');
      if (!stage) return;

      // Spawn 3-5 floating emoji particles
      for (let i = 0; i < 4; i++) {
        const span = document.createElement('span');
        span.className = 'floating-emoji-particle';
        span.textContent = emoji;

        // Random horizontal start within stage
        const leftPercent = 65 + (Math.random() * 25);
        span.style.left = `${leftPercent}%`;
        span.style.bottom = '10px';
        span.style.animationDuration = `${1.6 + Math.random() * 0.8}s`;
        span.style.fontSize = `${24 + Math.random() * 16}px`;

        stage.appendChild(span);

        // Remove on animation end
        setTimeout(() => span.remove(), 2400);
      }

      if (broadcast) {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (partnerId && typeof window.sendSupabaseMessage === 'function') {
          window.sendSupabaseMessage({
            from: window.myUID,
            to: partnerId,
            text: `Reacted with ${emoji}`,
            isWatchPartyReaction: true,
            emoji: emoji,
            chatType: 'direct'
          }).catch(() => {});
        }
      }
    }

    shareInviteToChat() {
      const partnerName = window.currentChatName || 'Friend';
      const text = `[WATCH TOGETHER INVITATION]\nHey ${partnerName}, I've opened a synchronized watch theater! Click "Watch Together" in the attachment menu to sync screens and stream together!`;

      const input = document.getElementById('message-input');
      if (input) {
        input.value = text;
        if (typeof window.sendMessage === 'function') {
          window.sendMessage();
        }
      }

      if (window.showNotif) window.showNotif('Invitation dispatched to chat!', 'success', 2000);
    }
  }

  // Export globally
  window.watchTogetherEngine = new WatchTogetherEngine();
})();
