/**
 * =============================================================================
 * NEXCHAT - WHATSAPP-STYLE STATUS MUSIC PICKER ENGINE
 * Global Namespace: window.statusMusicPickerEngine
 * =============================================================================
 * Capabilities:
 * 1. 100% Free Public iTunes Search API Integration with zero API keys / auth.
 * 2. Searchable music library across millions of commercial songs & artists.
 * 3. 30-Second High-Quality Streaming Audio Previews (matches status story length).
 * 4. WhatsApp-style interactive music sticker attached to photo/video status preview.
 * 5. Genre filter pills: Top Hits, Afrobeats, Pop, Hip-Hop, R&B, Chill, Cinematic.
 * 6. Synchronous background audio playback in status viewer with spinning vinyl disc.
 *
 * STRICTLY 0 UNICODE EMOJIS: Pure FontAwesome 6 vector glyphs only.
 * =============================================================================
 */

(function (global) {
  'use strict';

  class StatusMusicPickerEngine {
    constructor() {
      this.selectedTrack = null;
      this.currentPreviewAudio = null;
      this.currentlyPlayingId = null;
      this.activeGenre = 'top hits';
      this.searchDebounceTimer = null;
      this.cachedTracks = new Map();

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
      // Trigger button in Status Creator Preview Overlay
      const addMusicBtn = document.getElementById('statusAddMusicBtn');
      if (addMusicBtn) {
        addMusicBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.openPicker();
        });
      }

      // Close modal triggers
      document.getElementById('closeStatusMusicPickerBtn')?.addEventListener('click', () => this.closePicker());
      document.getElementById('statusMusicPickerBackdrop')?.addEventListener('click', () => this.closePicker());

      // Search input listener
      const searchInput = document.getElementById('statusMusicSearchInput');
      const clearBtn = document.getElementById('statusMusicClearSearchBtn');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const val = e.target.value.trim();
          if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';

          clearTimeout(this.searchDebounceTimer);
          this.searchDebounceTimer = setTimeout(() => {
            if (val.length >= 2) {
              this.searchMusic(val);
            } else if (!val) {
              this.searchMusic(this.activeGenre);
            }
          }, 350);
        });
      }

      if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
          searchInput.value = '';
          clearBtn.style.display = 'none';
          this.searchMusic(this.activeGenre);
        });
      }

      // Genre pills
      document.querySelectorAll('.music-genre-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          document.querySelectorAll('.music-genre-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          const genre = pill.getAttribute('data-genre') || 'top hits';
          this.activeGenre = genre;
          if (searchInput) searchInput.value = '';
          if (clearBtn) clearBtn.style.display = 'none';
          this.searchMusic(genre);
        });
      });

      // Remove music button on attached sticker
      document.getElementById('statusRemoveMusicBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeTrack();
      });

      // Preview Audio element
      this.currentPreviewAudio = document.getElementById('statusMusicPreviewPlayer');
      if (this.currentPreviewAudio) {
        this.currentPreviewAudio.addEventListener('ended', () => {
          this.stopPreviewPlayback();
        });
        this.currentPreviewAudio.addEventListener('error', () => {
          this.stopPreviewPlayback();
        });
      }
    }

    openPicker() {
      const modal = document.getElementById('statusMusicPickerModal');
      if (!modal) return;
      modal.style.display = 'flex';

      const searchInput = document.getElementById('statusMusicSearchInput');
      const currentQuery = searchInput?.value.trim() || this.activeGenre;
      this.searchMusic(currentQuery);
    }

    closePicker() {
      const modal = document.getElementById('statusMusicPickerModal');
      if (modal) modal.style.display = 'none';
      this.stopPreviewPlayback();
    }

    async searchMusic(query) {
      const listEl = document.getElementById('statusMusicTrackList');
      if (!listEl) return;

      const cacheKey = String(query).toLowerCase().trim();
      if (this.cachedTracks.has(cacheKey)) {
        this.renderTrackList(this.cachedTracks.get(cacheKey));
        return;
      }

      listEl.innerHTML = `
        <div class="music-picker-loading">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <span>Searching iTunes music catalog...</span>
        </div>
      `;

      try {
        const encoded = encodeURIComponent(query);
        const res = await fetch(`https://itunes.apple.com/search?term=${encoded}&entity=song&limit=25`);
        if (!res.ok) throw new Error('Network response failed');
        const data = await res.json();

        const tracks = (data.results || []).map(item => ({
          id: item.trackId,
          trackName: item.trackName || 'Unknown Title',
          artistName: item.artistName || 'Unknown Artist',
          collectionName: item.collectionName || '',
          previewUrl: item.previewUrl || '',
          artworkUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : 'logo.jpg',
          durationSec: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 30
        })).filter(t => !!t.previewUrl);

        this.cachedTracks.set(cacheKey, tracks);
        this.renderTrackList(tracks);
      } catch (err) {
        console.warn('[MUSIC PICKER] Search error:', err.message);
        listEl.innerHTML = `
          <div class="music-picker-loading" style="color: #ef4444;">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Unable to load music. Please check internet connection.</span>
          </div>
        `;
      }
    }

    renderTrackList(tracks) {
      const listEl = document.getElementById('statusMusicTrackList');
      if (!listEl) return;

      if (!tracks || tracks.length === 0) {
        listEl.innerHTML = `
          <div class="music-picker-loading">
            <i class="fa-solid fa-music-slash"></i>
            <span>No matching songs found. Try another search.</span>
          </div>
        `;
        return;
      }

      listEl.innerHTML = tracks.map(t => {
        const isSelected = this.selectedTrack && this.selectedTrack.id === t.id;
        const isPlaying = this.currentlyPlayingId === t.id;

        return `
          <div class="music-track-item ${isSelected ? 'selected' : ''} ${isPlaying ? 'playing' : ''}" data-track-id="${t.id}">
            <div class="music-track-artwork-wrap" data-play-id="${t.id}">
              <img src="${t.artworkUrl}" class="music-track-artwork" alt="${t.trackName}" onerror="this.src='logo.jpg';">
              <div class="music-track-play-overlay">
                <i class="fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}"></i>
              </div>
            </div>
            <div class="music-track-info" data-select-id="${t.id}">
              <div class="music-track-name">${t.trackName}</div>
              <div class="music-track-artist-row">
                <span>${t.artistName}</span>
                <span>•</span>
                <span class="music-track-duration">30s preview</span>
              </div>
            </div>
            <button type="button" class="music-track-select-btn" data-select-id="${t.id}">
              ${isSelected ? '<i class="fa-solid fa-check"></i> Added' : '<i class="fa-solid fa-plus"></i> Select'}
            </button>
          </div>
        `;
      }).join('');

      // Bind click listeners
      listEl.querySelectorAll('[data-play-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const trackId = Number(btn.getAttribute('data-play-id'));
          const track = tracks.find(t => t.id === trackId);
          if (track) this.togglePreviewPlayback(track);
        });
      });

      listEl.querySelectorAll('[data-select-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const trackId = Number(btn.getAttribute('data-select-id'));
          const track = tracks.find(t => t.id === trackId);
          if (track) this.selectTrack(track);
        });
      });
    }

    togglePreviewPlayback(track) {
      if (!this.currentPreviewAudio) return;

      if (this.currentlyPlayingId === track.id) {
        this.stopPreviewPlayback();
        return;
      }

      this.currentPreviewAudio.src = track.previewUrl;
      this.currentPreviewAudio.currentTime = 0;
      this.currentPreviewAudio.play().then(() => {
        this.currentlyPlayingId = track.id;
        this.updatePlayStateUI();
      }).catch(err => {
        console.warn('[MUSIC PICKER] Audio play blocked:', err.message);
        this.stopPreviewPlayback();
      });
    }

    stopPreviewPlayback() {
      if (this.currentPreviewAudio) {
        try {
          this.currentPreviewAudio.pause();
          this.currentPreviewAudio.removeAttribute('src');
          this.currentPreviewAudio.load();
        } catch (_) {}
      }
      this.currentlyPlayingId = null;
      this.updatePlayStateUI();
    }

    updatePlayStateUI() {
      const listEl = document.getElementById('statusMusicTrackList');
      if (!listEl) return;

      listEl.querySelectorAll('.music-track-item').forEach(item => {
        const id = Number(item.getAttribute('data-track-id'));
        const isPlaying = id === this.currentlyPlayingId;
        item.classList.toggle('playing', isPlaying);
        const icon = item.querySelector('.music-track-play-overlay i');
        if (icon) {
          icon.className = `fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`;
        }
      });
    }

    selectTrack(track) {
      this.selectedTrack = track;
      this.stopPreviewPlayback();

      // Update Floating Music Sticker on preview card
      const sticker = document.getElementById('statusAttachedMusicSticker');
      const art = document.getElementById('statusAttachedMusicArt');
      const title = document.getElementById('statusAttachedMusicTitle');
      const artist = document.getElementById('statusAttachedMusicArtist');

      if (sticker && art && title && artist) {
        art.src = track.artworkUrl;
        title.textContent = track.trackName;
        artist.textContent = track.artistName;
        sticker.style.display = 'flex';
      }

      if (window.showNotif) {
        window.showNotif(`Added music: ${track.trackName} - ${track.artistName}`, 'success', 2500);
      }

      this.closePicker();
    }

    removeTrack() {
      this.selectedTrack = null;
      this.stopPreviewPlayback();

      const sticker = document.getElementById('statusAttachedMusicSticker');
      if (sticker) sticker.style.display = 'none';

      if (window.showNotif) {
        window.showNotif('Music track removed from status', 'info', 2000);
      }
    }

    getSelectedMusic() {
      return this.selectedTrack ? {
        id: this.selectedTrack.id,
        trackName: this.selectedTrack.trackName,
        artistName: this.selectedTrack.artistName,
        collectionName: this.selectedTrack.collectionName,
        previewUrl: this.selectedTrack.previewUrl,
        artworkUrl: this.selectedTrack.artworkUrl,
        durationSec: this.selectedTrack.durationSec
      } : null;
    }

    reset() {
      this.removeTrack();
    }
  }

  global.StatusMusicPickerEngine = StatusMusicPickerEngine;
  global.statusMusicPickerEngine = new StatusMusicPickerEngine();

})(typeof window !== 'undefined' ? window : this);
