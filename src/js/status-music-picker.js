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

  const GENRE_SEARCH_MAP = {
    'top hits': 'top hits pop 2024',
    'trending': 'trending viral songs 2024',
    'afrobeats': 'afrobeats burna boy rema wizkid',
    'amapiano': 'amapiano tyla asake',
    'hip hop': 'hip hop drake kendrick',
    'r&b': 'r&b sza the weeknd',
    'pop': 'pop sabrina carpenter billie eilish',
    'dancehall': 'dancehall sean paul vybz kartel',
    'latin': 'latin bad bunny karol g',
    'gospel': 'gospel elevation worship',
    'edm': 'edm calvin harris david guetta',
    'rock': 'rock imagine dragons',
    'lofi': 'lofi chill beats',
    'chill': 'chill acoustic indie',
    'jazz': 'jazz miles davis frank sinatra',
    'cinematic': 'cinematic hans zimmer'
  };

  const CURATED_FALLBACK_TRACKS = [
    {
      trackId: 1752214923,
      trackName: 'Espresso',
      artistName: 'Sabrina Carpenter',
      collectionName: "Short n' Sweet",
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/99/da/ff/99daffce-cdde-59c6-5ae0-7f922ce411a8/mzaf_5621292401829922816.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a1/1c/ca/a11ccab6-7d4c-e041-d028-998bcebeb709/24UMGIM61704.rgb.jpg/100x100bb.jpg',
      trackTimeMillis: 175459,
      genres: ['top hits', 'trending', 'pop']
    },
    {
      trackId: 1739659142,
      trackName: 'BIRDS OF A FEATHER',
      artistName: 'Billie Eilish',
      collectionName: 'HIT ME HARD AND SOFT',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/34/31/d3/3431d34e-847f-5d66-df83-0bce688d997e/mzaf_18106743962423782018.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/100x100bb.jpg',
      trackTimeMillis: 210373,
      genres: ['top hits', 'trending', 'pop', 'chill']
    },
    {
      trackId: 1699082734,
      trackName: 'Water',
      artistName: 'Tyla',
      collectionName: 'Water - Single',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9a/62/e6/9a62e688-9080-feed-2411-cc793c4545cf/mzaf_4449175929344535361.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/1e/c9/5b/1ec95bbc-a56f-cbef-070c-ddec9f4fdd3c/196871296205.jpg/100x100bb.jpg',
      trackTimeMillis: 200256,
      genres: ['top hits', 'trending', 'afrobeats', 'amapiano', 'r&b']
    },
    {
      trackId: 1614063459,
      trackName: 'Calm Down',
      artistName: 'Rema',
      collectionName: 'Rave & Roses',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3c/7e/3b/3c7e3b1d-c005-91cb-51d1-2d86effd9990/mzaf_6788794088599474630.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/b2/b4/7c/b2b47cf9-d8e2-53f6-5c62-c974d665c95b/22UMGIM08994.rgb.jpg/100x100bb.jpg',
      trackTimeMillis: 219669,
      genres: ['top hits', 'afrobeats', 'trending']
    },
    {
      trackId: 1623677811,
      trackName: 'Last Last',
      artistName: 'Burna Boy',
      collectionName: 'Love, Damini',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/42/c0/0f/42c00f8b-fff6-2529-70c3-861c21143c0a/mzaf_2842108628707526245.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ca/eb/31/caeb3173-eaf0-0cd5-65ea-585adfe312ba/075679745156.jpg/100x100bb.jpg',
      trackTimeMillis: 172342,
      genres: ['top hits', 'afrobeats']
    },
    {
      trackId: 1531532767,
      trackName: 'Essence (feat. Tems)',
      artistName: 'Wizkid',
      collectionName: 'Made In Lagos',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b3/dc/ba/b3dcba73-7f33-9abe-089c-73557a6dcb54/mzaf_16412591162283722395.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b0/09/8e/b0098ed0-ef53-f2b5-386a-c8e6181f3c8a/886448775256.jpg/100x100bb.jpg',
      trackTimeMillis: 249034,
      genres: ['afrobeats', 'r&b', 'chill']
    },
    {
      trackId: 1688642838,
      trackName: 'Lonely At The Top',
      artistName: 'Asake',
      collectionName: 'Work Of Art',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/af/79/fd/af79fdf3-e757-5acd-c0de-b5c6edfaa77a/mzaf_15402833629808241649.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/cc/23/83/cc2383d9-eecc-f974-5f5b-d445c583acdb/197342233958_cover.jpg/100x100bb.jpg',
      trackTimeMillis: 157714,
      genres: ['afrobeats', 'amapiano']
    },
    {
      trackId: 1440841384,
      trackName: 'One Dance (feat. Wizkid & Kyla)',
      artistName: 'Drake',
      collectionName: 'Views',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/99/c9/02/99c90261-eee2-f9a5-f143-7496dca1583b/mzaf_3576977620384404770.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/f2/0d/8b/f20d8bff-a927-ae98-6784-20a1f51cb23e/16UMGIM27642.rgb.jpg/100x100bb.jpg',
      trackTimeMillis: 173985,
      genres: ['hip hop', 'dancehall', 'afrobeats', 'pop']
    },
    {
      trackId: 1657869393,
      trackName: 'Kill Bill',
      artistName: 'SZA',
      collectionName: 'SOS',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/45/2b/ea/452bead6-c7f5-82d4-f5f7-ec876014b4cc/mzaf_2905911853279084717.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/bd/3b/a9/bd3ba9fb-9609-144f-bcfe-ead67b5f6ab3/196589564931.jpg/100x100bb.jpg',
      trackTimeMillis: 153947,
      genres: ['r&b', 'top hits', 'pop']
    },
    {
      trackId: 1499378607,
      trackName: 'Blinding Lights',
      artistName: 'The Weeknd',
      collectionName: 'After Hours',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/19/d6/60/19d660ff-e3a9-8377-15a3-ce4b28e89cac/mzaf_18422426156481158187.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/25/a1/d6/25a1d6f7-e7df-5b57-53e2-2aa20377c887/20UMGIM11048.rgb.jpg/600x600bb.jpg',
      trackTimeMillis: 200040,
      genres: ['top hits', 'pop', 'r&b']
    },
    {
      trackId: 1505683980,
      trackName: 'Save Your Tears',
      artistName: 'The Weeknd',
      collectionName: 'After Hours (Deluxe)',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8b/38/17/8b3817e4-c0e9-7e02-2654-3e2ecee93603/mzaf_18415642125637540903.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/83/3a/f7/833af71b-2e0c-3303-24f5-8f5c546c073b/20UMGIM21167.rgb.jpg/100x100bb.jpg',
      trackTimeMillis: 215627,
      genres: ['pop', 'r&b', 'chill']
    },
    {
      trackId: 922876189,
      trackName: 'Summer',
      artistName: 'Calvin Harris',
      collectionName: 'Motion',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c3/32/f1/c332f138-aa3c-52b8-c414-e85111b58bf5/mzaf_12226515580236242706.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/da/50/cc/da50cc80-3515-a38d-369b-0d700ffd249d/886444820448.jpg/100x100bb.jpg',
      trackTimeMillis: 222533,
      genres: ['edm', 'pop', 'trending']
    },
    {
      trackId: 1411628233,
      trackName: 'Believer',
      artistName: 'Imagine Dragons',
      collectionName: 'Evolve',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c0/3f/36/c03f367a-b66b-fd0a-a54c-30f8250c4410/mzaf_12768434238801682952.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/11/7a/b8/117ab805-6811-8929-18b9-0fad7baf0c25/17UMGIM98210.rgb.jpg/100x100bb.jpg',
      trackTimeMillis: 204345,
      genres: ['rock', 'cinematic', 'top hits']
    },
    {
      trackId: 1781353929,
      trackName: 'Not Like Us',
      artistName: 'Kendrick Lamar',
      collectionName: 'Not Like Us - Single',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2d/e0/e8/2de0e874-cd0b-e9a9-e876-76be13a86662/mzaf_12385336780649591409.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/31/3a/3f/313a3fbc-bb8f-80c7-b5a2-e226869a38cd/24UMGIM51924.rgb.jpg/100x100bb.jpg',
      trackTimeMillis: 274192,
      genres: ['hip hop', 'trending', 'top hits']
    },
    {
      trackId: 1704156397,
      trackName: 'UNAVAILABLE (feat. Musa Keys) [Remix]',
      artistName: 'Davido, Sean Paul & Ding Dong',
      collectionName: 'UNAVAILABLE',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/6a/08/f8/6a08f8f4-05ac-fe83-68b9-85e4f8cac8b1/mzaf_11447656297166015034.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/f2/6f/40/f26f409e-958b-0b9f-adce-395673632c18/196871414814.jpg/100x100bb.jpg',
      trackTimeMillis: 172035,
      genres: ['afrobeats', 'amapiano', 'dancehall']
    },
    {
      trackId: 1468058171,
      trackName: 'Cruel Summer',
      artistName: 'Taylor Swift',
      collectionName: 'Lover',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/af/81/44af8168-9609-1b85-5048-ada08dceacf3/mzaf_1341699644335558812.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/100x100bb.jpg',
      trackTimeMillis: 178426,
      genres: ['pop', 'top hits', 'trending']
    },
    {
      trackId: 1447401620,
      trackName: 'Despacito',
      artistName: 'Luis Fonsi & Daddy Yankee',
      collectionName: 'VIDA',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/0d/cb/ec/0dcbec41-5e9e-bd09-7cdd-fdff44acdf78/mzaf_17345185466754008149.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e2/ef/f0/e2eff0bc-c51d-7de5-9280-6891ddcee71b/18UMGIM85289.rgb.jpg/100x100bb.jpg',
      trackTimeMillis: 229387,
      genres: ['latin', 'pop', 'dancehall']
    },
    {
      trackId: 1106569251,
      trackName: 'Fever',
      artistName: 'Vybz Kartel',
      collectionName: 'King of the Dancehall',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/3b/d6/88/3bd68820-6c0d-5cf3-9d8d-e12fbf905172/mzaf_6335052220443087202.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/6b/0c/9f/6b0c9fe6-130a-7898-6a8d-92c62011677b/KingOfTheDanceHall-COVER-colour-ver014.jpg/100x100bb.jpg',
      trackTimeMillis: 204500,
      genres: ['dancehall']
    },
    {
      trackId: 1680569035,
      trackName: 'Praise (feat. Brandon Lake, Chris Brown & Chandler Moore)',
      artistName: 'Elevation Worship',
      collectionName: 'CAN YOU IMAGINE?',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a1/4d/c8/a14dc8ba-59ed-a587-2ac6-c65e2f2c5483/mzaf_2260199512470538661.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/a8/87/4e/a8874e28-75b5-9ba1-b3a5-ccf5adf35e4f/196871015363.jpg/100x100bb.jpg',
      trackTimeMillis: 304536,
      genres: ['gospel']
    },
    {
      trackId: 6770648294,
      trackName: 'A Kid At Heart',
      artistName: 'Laffey',
      collectionName: 'Lofi Girl',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/17/2d/75/172d75da-9144-222b-e33b-be8816e4d403/mzaf_5273469681852096191.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/62/e8/4d/62e84d50-9a48-8bc0-1703-878df3ec1b19/7316475639892.jpg/100x100bb.jpg',
      trackTimeMillis: 166960,
      genres: ['lofi', 'chill']
    },
    {
      trackId: 1440858129,
      trackName: 'Fly Me to the Moon (feat. Count Basie and His Orchestra)',
      artistName: 'Frank Sinatra',
      collectionName: 'Nothing But the Best (Remastered)',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/88/30/08/8830086e-a020-d902-6c9f-90dfeec6e1d4/mzaf_14335189078733210073.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/3a/37/1a/3a371a7e-33fe-85db-0616-0c57ef26fb42/13UAEIM06265.rgb.jpg/100x100bb.jpg',
      trackTimeMillis: 147520,
      genres: ['jazz', 'chill']
    },
    {
      trackId: 380350246,
      trackName: 'Time',
      artistName: 'Hans Zimmer',
      collectionName: 'Inception (Music from the Motion Picture)',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e0/1d/a4/e01da4a2-a75f-7ebf-9971-3d49e17efc57/mzaf_10500078769097048384.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2b/62/eb/2b62ebd7-aa99-988a-0fee-714162f6fbeb/093624965008.jpg/100x100bb.jpg',
      trackTimeMillis: 275556,
      genres: ['cinematic']
    }
  ];

  function getCuratedFallback(queryKey) {
    const k = String(queryKey || '').toLowerCase().trim();
    const matched = CURATED_FALLBACK_TRACKS.filter(t => t.genres.includes(k));
    const list = matched.length > 0 ? matched : CURATED_FALLBACK_TRACKS;
    return list.map(item => ({
      id: item.trackId,
      trackName: item.trackName,
      artistName: item.artistName,
      collectionName: item.collectionName,
      previewUrl: item.previewUrl,
      artworkUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : 'logo.jpg',
      durationSec: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 30
    }));
  }

  class StatusMusicPickerEngine {
    constructor() {
      this.selectedTrack = null;
      this.currentPreviewAudio = null;
      this.currentlyPlayingId = null;
      this.activePreviewTrack = null;
      this.activeGenre = 'top hits';
      this.searchDebounceTimer = null;
      this.cachedTracks = new Map();
      this.clipStartSec = 0;
      this.clipEndSec = 30;
      this.trackDurationSec = 30;
      this.syncWithVideo = true;
      this.panelOpen = false;
      this.playbackStatus = 'stopped';
      this._playSeq = 0;
      this._suppressVideoSync = false;

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
          this._ensureAudioPlayer();
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
              this.searchMusic(val, false);
            } else if (!val) {
              this.searchMusic(this.activeGenre, true);
            }
          }, 350);
        });
      }

      if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
          searchInput.value = '';
          clearBtn.style.display = 'none';
          this.searchMusic(this.activeGenre, true);
        });
      }

      // Genre pills
      document.querySelectorAll('.music-genre-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          document.querySelectorAll('.music-genre-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          try { pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } catch (_) {}
          const genre = pill.getAttribute('data-genre') || 'top hits';
          this.activeGenre = genre;
          this._animateNextRender = true;
          if (searchInput) searchInput.value = '';
          if (clearBtn) clearBtn.style.display = 'none';
          this.searchMusic(genre, true);
        });
      });

      // Remove music button on attached sticker
      document.getElementById('statusRemoveMusicBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeTrack();
      });

      this._bindAttachedStickerAndPanel();

      // Prepare singleton Preview Audio element cleanly
      this._ensureAudioPlayer();
      this._bindSheetDragDismiss();
    }

    _fadeAudioTo(audio, targetVolume = 0.85, durationMs = 180) {
      if (!audio) return;
      if (audio._nexFadeRaf) {
        cancelAnimationFrame(audio._nexFadeRaf);
        audio._nexFadeRaf = 0;
      }
      const lowEnd = document.body?.classList?.contains('nex-low-end');
      if (lowEnd || durationMs <= 0) {
        audio.volume = targetVolume;
        return;
      }
      const startVol = Math.min(targetVolume, 0.05);
      audio.volume = startVol;
      const startTime = performance.now();
      const step = (now) => {
        if (audio.paused) {
          audio._nexFadeRaf = 0;
          return;
        }
        const t = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        audio.volume = Math.min(1, Math.max(0, startVol + (targetVolume - startVol) * eased));
        if (t < 1) {
          audio._nexFadeRaf = requestAnimationFrame(step);
        } else {
          audio._nexFadeRaf = 0;
        }
      };
      audio._nexFadeRaf = requestAnimationFrame(step);
    }

    _bindSheetDragDismiss() {
      const sheet = document.getElementById('statusMusicPickerSheet') || document.querySelector('#statusMusicPickerModal .status-music-picker-sheet');
      const backdrop = document.getElementById('statusMusicPickerBackdrop');
      const handle = document.getElementById('musicPickerDragHandle') || sheet?.querySelector('.music-picker-header');
      const listEl = document.getElementById('statusMusicTrackList');
      if (!sheet || sheet.dataset.dragDismissBound) return;
      sheet.dataset.dragDismissBound = 'true';

      let startY = 0;
      let startTime = 0;
      let dragging = false;
      let lastDy = 0;
      let dragRaf = 0;

      const applyTransform = (dy) => {
        if (dragRaf) cancelAnimationFrame(dragRaf);
        dragRaf = requestAnimationFrame(() => {
          dragRaf = 0;
          sheet.style.transform = `translate3d(0, ${Math.max(0, dy).toFixed(1)}px, 0)`;
          if (backdrop) {
            const fade = Math.max(0.15, 1 - Math.min(1, dy / 340) * 0.85);
            backdrop.style.opacity = String(fade);
          }
        });
      };

      const onTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        const fromList = e.target.closest('#statusMusicTrackList');
        const fromGrip = e.target.closest('#musicPickerDragHandle, .music-picker-header');
        if (!fromGrip && (!fromList || (listEl && listEl.scrollTop > 2))) return;
        startY = e.touches[0].clientY;
        startTime = Date.now();
        lastDy = 0;
        dragging = fromGrip ? true : false;
        if (dragging) sheet.classList.add('dragging');
      };

      const onTouchMove = (e) => {
        if (!startTime || e.touches.length !== 1) return;
        const dy = e.touches[0].clientY - startY;
        if (!dragging) {
          // Engage list pull-down only when at top and clearly swiping down
          if (dy > 10 && (!listEl || listEl.scrollTop <= 0)) {
            dragging = true;
            startY = e.touches[0].clientY;
            sheet.classList.add('dragging');
          } else if (dy < -6) {
            startTime = 0;
          }
          return;
        }
        lastDy = Math.max(0, dy);
        if (lastDy > 0) applyTransform(lastDy);
      };

      const onTouchEnd = () => {
        if (dragRaf) { cancelAnimationFrame(dragRaf); dragRaf = 0; }
        const elapsed = Math.max(1, Date.now() - startTime);
        const velocity = lastDy / elapsed;
        startTime = 0;
        if (!dragging) return;
        dragging = false;
        sheet.classList.remove('dragging');
        if (lastDy > 90 || (lastDy > 35 && velocity > 0.45)) {
          sheet.style.transform = 'translate3d(0, 100%, 0)';
          if (backdrop) backdrop.style.opacity = '0';
          setTimeout(() => {
            this.closePicker();
            sheet.style.transform = '';
            if (backdrop) backdrop.style.opacity = '';
          }, 210);
        } else {
          sheet.style.transform = 'translate3d(0, 0, 0)';
          if (backdrop) backdrop.style.opacity = '';
          setTimeout(() => { if (!sheet.classList.contains('dragging')) sheet.style.transform = ''; }, 260);
        }
      };

      [handle, listEl].forEach((zone) => {
        if (!zone) return;
        zone.addEventListener('touchstart', onTouchStart, { passive: true });
        zone.addEventListener('touchmove', onTouchMove, { passive: true });
        zone.addEventListener('touchend', onTouchEnd, { passive: true });
        zone.addEventListener('touchcancel', onTouchEnd, { passive: true });
      });
    }

    openPicker() {
      const modal = document.getElementById('statusMusicPickerModal');
      if (!modal) return;
      const sheet = document.getElementById('statusMusicPickerSheet') || modal.querySelector('.status-music-picker-sheet');
      const backdrop = document.getElementById('statusMusicPickerBackdrop');
      if (sheet) {
        sheet.classList.remove('dragging');
        sheet.style.transform = '';
      }
      if (backdrop) backdrop.style.opacity = '';
      this._animateNextRender = true;
      modal.style.display = 'flex';

      const searchInput = document.getElementById('statusMusicSearchInput');
      const typed = searchInput?.value.trim() || '';
      if (typed.length >= 2) {
        this.searchMusic(typed, false);
      } else {
        this.searchMusic(this.activeGenre, true);
      }
    }

    closePicker() {
      const modal = document.getElementById('statusMusicPickerModal');
      if (modal) modal.style.display = 'none';
      const sheet = document.getElementById('statusMusicPickerSheet') || modal?.querySelector('.status-music-picker-sheet');
      const backdrop = document.getElementById('statusMusicPickerBackdrop');
      if (sheet) {
        sheet.classList.remove('dragging');
        sheet.style.transform = '';
      }
      if (backdrop) backdrop.style.opacity = '';
      if (!this.selectedTrack) {
        this.stopPreviewPlayback();
      }
    }

    async searchMusic(query, isGenreKey) {
      const listEl = document.getElementById('statusMusicTrackList');
      if (!listEl) return;

      const rawKey = String(query || '').toLowerCase().trim();
      const useGenreMap = isGenreKey !== false && Object.prototype.hasOwnProperty.call(GENRE_SEARCH_MAP, rawKey);
      const effectiveQuery = useGenreMap ? GENRE_SEARCH_MAP[rawKey] : query;
      const cacheKey = `${rawKey}::${effectiveQuery}`;
      const requestToken = (this._searchSeq = (this._searchSeq || 0) + 1);

      if (this.cachedTracks.has(cacheKey)) {
        this.renderTrackList(this.cachedTracks.get(cacheKey));
        return;
      }

      const curatedInstant = useGenreMap ? getCuratedFallback(rawKey) : [];
      if (curatedInstant.length > 0) {
        this.renderTrackList(curatedInstant);
      } else {
        listEl.innerHTML = `
          <div class="music-picker-loading">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span>Searching iTunes music catalog...</span>
          </div>
        `;
      }

      try {
        const encoded = encodeURIComponent(effectiveQuery);
        let liveTracks = [];

        // For Top Hits / Trending, also fetch real Apple Music Top Songs RSS (includes direct 30s M4A previews)
        if (useGenreMap && (rawKey === 'top hits' || rawKey === 'trending')) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3000);
            const res = await fetch('https://itunes.apple.com/us/rss/topsongs/limit=25/json', { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
              const rss = await res.json();
              const entries = rss?.feed?.entry || [];
              liveTracks = entries.map(entry => {
                const links = Array.isArray(entry.link) ? entry.link : [entry.link];
                const previewLink = links.find(l => l?.attributes?.title === 'Preview' || l?.attributes?.type === 'audio/x-m4a');
                const imgs = Array.isArray(entry['im:image']) ? entry['im:image'] : [];
                const art = imgs[imgs.length - 1]?.label || imgs[0]?.label || 'logo.jpg';
                const idAttr = entry?.id?.attributes?.['im:id'] || Math.floor(Math.random() * 1e9);
                return {
                  id: Number(idAttr),
                  trackName: entry?.['im:name']?.label || 'Top Hit',
                  artistName: entry?.['im:artist']?.label || 'Artist',
                  collectionName: entry?.['im:collection']?.['im:name']?.label || '',
                  previewUrl: previewLink?.attributes?.href || '',
                  artworkUrl: art.replace('170x170bb', '600x600bb'),
                  durationSec: 30
                };
              }).filter(t => !!t.previewUrl);
            }
          } catch (rssErr) {
            console.warn('[MUSIC PICKER] RSS topsongs notice:', rssErr.message);
          }
        }

        // Standard iTunes Search API + JSONP fallback when not filled by RSS chart
        if (liveTracks.length === 0) {
          let data = null;
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(`https://itunes.apple.com/search?term=${encoded}&entity=song&limit=35`, {
              signal: controller.signal
            });
            clearTimeout(timer);
            if (res.ok) {
              data = await res.json();
            }
          } catch (fetchErr) {
            console.warn('[MUSIC PICKER] Direct fetch failed, trying JSONP fallback...', fetchErr.message);
          }

          if (!data || !Array.isArray(data.results) || data.results.length === 0) {
            try {
              data = await new Promise((resolve, reject) => {
                const cbName = 'itunes_jsonp_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
                const script = document.createElement('script');
                const timeout = setTimeout(() => {
                  cleanup();
                  reject(new Error('JSONP timeout'));
                }, 4000);

                function cleanup() {
                  clearTimeout(timeout);
                  try { delete window[cbName]; } catch (_) {}
                  if (script.parentNode) script.remove();
                }

                window[cbName] = (res) => {
                  cleanup();
                  resolve(res);
                };

                script.onerror = () => {
                  cleanup();
                  reject(new Error('JSONP script error'));
                };

                script.src = `https://itunes.apple.com/search?term=${encoded}&entity=song&limit=35&callback=${cbName}`;
                document.head.appendChild(script);
              });
            } catch (jsonpErr) {
              console.warn('[MUSIC PICKER] JSONP fallback error:', jsonpErr.message);
            }
          }

          const rawResults = (data && Array.isArray(data.results)) ? data.results : [];
          liveTracks = rawResults.map(item => ({
            id: item.trackId,
            trackName: item.trackName || 'Unknown Title',
            artistName: item.artistName || 'Unknown Artist',
            collectionName: item.collectionName || '',
            previewUrl: item.previewUrl || '',
            artworkUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : 'logo.jpg',
            durationSec: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 30
          })).filter(t => !!t.previewUrl);
        }

        // Filter out generic workout/karaoke compilation covers when browsing preset genres
        if (useGenreMap) {
          liveTracks = liveTracks.filter(t => !/(power music workout|mixxc|karaoke|rockabye baby)/i.test(`${t.artistName} ${t.trackName} ${t.collectionName}`));
        }

        // Merge fresh live iTunes tracks FIRST so curated fallbacks only fill missing slots
        const seenIds = new Set();
        const mergedTracks = [];
        for (const t of [...liveTracks, ...curatedInstant]) {
          if (t && t.previewUrl && !seenIds.has(t.id)) {
            seenIds.add(t.id);
            mergedTracks.push(t);
          }
        }

        const finalTracks = mergedTracks.length > 0 ? mergedTracks : getCuratedFallback(rawKey);
        this.cachedTracks.set(cacheKey, finalTracks);

        if (this._searchSeq === requestToken) {
          this.renderTrackList(finalTracks);
        }
      } catch (err) {
        console.warn('[MUSIC PICKER] Search error:', err.message);
        if (this._searchSeq === requestToken && curatedInstant.length === 0) {
          this.renderTrackList(getCuratedFallback(rawKey));
        }
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

      const shouldAnimateReveal = Boolean(this._animateNextRender || listEl.querySelector('.music-picker-loading'));
      this._animateNextRender = false;

      listEl.innerHTML = tracks.map((t, idx) => {
        const isSelected = this.selectedTrack && this.selectedTrack.id === t.id;
        const isPlaying = this.currentlyPlayingId === t.id;
        const animClass = shouldAnimateReveal && idx < 12 ? 'nex-track-reveal' : '';

        return `
          <div class="music-track-item ${isSelected ? 'selected' : ''} ${isPlaying ? 'playing' : ''} ${animClass}" data-track-id="${t.id}" style="--track-idx:${Math.min(idx, 10)}">
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

    _formatSec(sec) {
      const s = Math.max(0, Math.round(Number(sec) || 0));
      const m = Math.floor(s / 60);
      const rem = s % 60;
      return `${m}:${rem < 10 ? '0' : ''}${rem}`;
    }

    _getVideoFrameMeta() {
      const trimmer = window.NexTransmitterTrimmer;
      const videoEl = document.getElementById('statusModalVideoPreview');
      const hasVideo = Boolean(
        videoEl &&
        videoEl.style.display !== 'none' &&
        (videoEl.currentSrc || videoEl.src || trimmer?.activeFile)
      );
      if (hasVideo && trimmer && trimmer.videoDuration > 0) {
        const start = Number(trimmer.currentStart || 0);
        const end = Number(trimmer.currentEnd || trimmer.videoDuration || 30);
        return {
          hasVideo: true,
          start,
          end,
          duration: Math.max(1, end - start),
          totalDuration: Number(trimmer.videoDuration || end),
          videoEl
        };
      }
      if (hasVideo && videoEl && videoEl.duration > 0 && isFinite(videoEl.duration)) {
        return {
          hasVideo: true,
          start: 0,
          end: videoEl.duration,
          duration: Math.max(1, videoEl.duration),
          totalDuration: videoEl.duration,
          videoEl
        };
      }
      const fallbackSlideSec = parseFloat(
        document.getElementById('statusSlideDurationSelect')?.value ||
        localStorage.getItem('nex_status_default_duration') ||
        '15'
      ) || 15;
      return {
        hasVideo: false,
        start: 0,
        end: fallbackSlideSec,
        duration: fallbackSlideSec,
        totalDuration: fallbackSlideSec,
        videoEl: null
      };
    }

    _bindAttachedStickerAndPanel() {
      const sticker = document.getElementById('statusAttachedMusicSticker');
      if (sticker && !sticker.dataset.interactiveBound) {
        sticker.dataset.interactiveBound = 'true';
        sticker.style.cursor = 'pointer';
        sticker.title = 'Click to open Music Controls & Time Frame';
        sticker.addEventListener('click', (e) => {
          if (e.target.closest('#statusRemoveMusicBtn')) return;
          e.stopPropagation();
          if (e.target.closest('#statusAttachedMusicQuickPlay')) {
            this.toggleAttachedPlayback();
            return;
          }
          this.toggleControlPanel();
        });
      }

      const panel = document.getElementById('statusMusicControlPanel');
      if (!panel || panel.dataset.panelBound === 'true') return;
      panel.dataset.panelBound = 'true';

      document.getElementById('statusMusicCtrlCollapseBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setControlPanelOpen(false);
      });

      document.getElementById('statusMusicCtrlPlayBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleAttachedPlayback();
      });

      document.getElementById('statusMusicCtrlStopBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stopClip();
      });

      document.getElementById('statusMusicCtrlRestartBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playClip(true);
      });

      document.getElementById('statusMusicCtrlChangeBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openPicker();
      });

      const progressRange = document.getElementById('statusMusicProgressRange');
      progressRange?.addEventListener('input', (e) => {
        e.stopPropagation();
        const audio = this._ensureAudioPlayer();
        const target = Math.max(this.clipStartSec, Math.min(this.clipEndSec, Number(e.target.value) || 0));
        if (audio && audio.readyState >= 1) {
          try { audio.currentTime = target; } catch (_) {}
        }
        this._syncControlPanelUI();
      });

      const startRange = document.getElementById('statusMusicStartRange');
      const endRange = document.getElementById('statusMusicEndRange');

      startRange?.addEventListener('input', (e) => {
        e.stopPropagation();
        let nextStart = Math.max(0, Math.min(this.trackDurationSec - 1, Number(e.target.value) || 0));
        if (this.clipEndSec - nextStart < 1) {
          nextStart = Math.max(0, this.clipEndSec - 1);
          e.target.value = String(nextStart);
        }
        this.clipStartSec = Number(nextStart.toFixed(1));
        const audio = this._ensureAudioPlayer();
        if (audio && audio.readyState >= 1 && (audio.currentTime < this.clipStartSec || audio.currentTime > this.clipEndSec)) {
          try { audio.currentTime = this.clipStartSec; } catch (_) {}
        }
        this._syncControlPanelUI();
      });

      endRange?.addEventListener('input', (e) => {
        e.stopPropagation();
        let nextEnd = Math.min(this.trackDurationSec, Math.max(1, Number(e.target.value) || 30));
        if (nextEnd - this.clipStartSec < 1) {
          nextEnd = Math.min(this.trackDurationSec, this.clipStartSec + 1);
          e.target.value = String(nextEnd);
        }
        this.clipEndSec = Number(nextEnd.toFixed(1));
        const audio = this._ensureAudioPlayer();
        if (audio && audio.readyState >= 1 && audio.currentTime >= this.clipEndSec) {
          try { audio.currentTime = this.clipStartSec; } catch (_) {}
        }
        this._syncControlPanelUI();
      });

      document.getElementById('statusMusicFitVideoBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fitToVideoDuration();
      });

      const syncToggle = document.getElementById('statusMusicSyncVideoToggle');
      syncToggle?.addEventListener('change', (e) => {
        e.stopPropagation();
        this.syncWithVideo = Boolean(e.target.checked);
      });
    }

    setControlPanelOpen(open) {
      this.panelOpen = Boolean(open && this.selectedTrack);
      const panel = document.getElementById('statusMusicControlPanel');
      if (panel) {
        panel.style.display = this.panelOpen ? 'flex' : 'none';
      }
      if (this.panelOpen) {
        this._syncControlPanelUI();
        try {
          panel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (_) {}
      }
    }

    toggleControlPanel() {
      if (!this.selectedTrack) {
        this.openPicker();
        return;
      }
      this.setControlPanelOpen(!this.panelOpen);
    }

    onVideoFrameUpdated() {
      this._syncControlPanelUI();
    }

    fitToVideoDuration() {
      const meta = this._getVideoFrameMeta();
      const targetLen = Math.min(this.trackDurationSec, Math.max(1, meta.duration || 15));
      if (this.clipStartSec + targetLen > this.trackDurationSec) {
        this.clipStartSec = Math.max(0, Number((this.trackDurationSec - targetLen).toFixed(1)));
      }
      this.clipEndSec = Math.min(this.trackDurationSec, Number((this.clipStartSec + targetLen).toFixed(1)));
      const audio = this._ensureAudioPlayer();
      if (audio && audio.readyState >= 1) {
        try { audio.currentTime = this.clipStartSec; } catch (_) {}
      }
      this._syncControlPanelUI();
      if (window.showNotif) {
        const label = meta.hasVideo ? `Matched to video (${targetLen.toFixed(1)}s)` : `Clip set to ${targetLen.toFixed(1)}s`;
        window.showNotif(label, 'info', 2000);
      }
    }

    async resolveFreshPreviewUrl(track) {
      if (!track) return '';
      const q = `${track.trackName || ''} ${track.artistName || ''}`.trim();
      if (!q) return '';
      const encoded = encodeURIComponent(q);
      let results = [];
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`https://itunes.apple.com/search?term=${encoded}&entity=song&limit=5`, {
          signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          results = Array.isArray(data?.results) ? data.results : [];
        }
      } catch (_) {}

      if (results.length === 0) {
        try {
          const jsonp = await new Promise((resolve, reject) => {
            const cbName = 'itunes_fix_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            const script = document.createElement('script');
            const to = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 3500);
            function cleanup() {
              clearTimeout(to);
              try { delete window[cbName]; } catch (_) {}
              if (script.parentNode) script.remove();
            }
            window[cbName] = (d) => { cleanup(); resolve(d); };
            script.onerror = () => { cleanup(); reject(new Error('error')); };
            script.src = `https://itunes.apple.com/search?term=${encoded}&entity=song&limit=5&callback=${cbName}`;
            document.head.appendChild(script);
          });
          results = Array.isArray(jsonp?.results) ? jsonp.results : [];
        } catch (_) {}
      }

      const fresh = results.find(item => item?.previewUrl);
      if (fresh?.previewUrl) {
        track.previewUrl = fresh.previewUrl;
        if (this.selectedTrack && this.selectedTrack.id === track.id) {
          this.selectedTrack.previewUrl = fresh.previewUrl;
        }
        return fresh.previewUrl;
      }
      return '';
    }

    _syncControlPanelUI() {
      const audio = this.currentPreviewAudio;
      const isSelectedPlaying = Boolean(
        this.selectedTrack &&
        audio &&
        !audio.paused &&
        this.currentlyPlayingId === this.selectedTrack.id
      );

      let effectiveStatus = this.playbackStatus;
      if (isSelectedPlaying) {
        effectiveStatus = 'playing';
      } else if (effectiveStatus === 'playing') {
        effectiveStatus = 'paused';
      }

      const statePill = document.getElementById('statusAttachedMusicStatePill');
      if (statePill) {
        statePill.className = `music-sticker-state-pill ${effectiveStatus}`;
        if (effectiveStatus === 'playing') {
          statePill.textContent = `PLAYING ${this._formatSec(audio?.currentTime || this.clipStartSec)}`;
        } else if (effectiveStatus === 'loading') {
          statePill.textContent = 'LOADING';
        } else if (effectiveStatus === 'blocked') {
          statePill.textContent = 'TAP PLAY';
        } else if (effectiveStatus === 'error') {
          statePill.textContent = 'RETRY';
        } else if (effectiveStatus === 'paused') {
          statePill.textContent = 'PAUSED';
        } else {
          statePill.textContent = 'STOPPED';
        }
      }

      const dot = document.getElementById('statusMusicCtrlStateDot');
      const stateText = document.getElementById('statusMusicCtrlStateText');
      if (dot) dot.className = `music-ctrl-status-dot ${effectiveStatus}`;
      if (stateText) {
        const labels = {
          playing: 'Playing',
          paused: 'Paused',
          stopped: 'Stopped',
          loading: 'Loading...',
          blocked: 'Tap Play to hear audio',
          error: 'Audio unavailable'
        };
        stateText.textContent = labels[effectiveStatus] || 'Ready';
      }

      const playBtn = document.getElementById('statusMusicCtrlPlayBtn');
      if (playBtn) {
        playBtn.innerHTML = isSelectedPlaying
          ? '<i class="fa-solid fa-pause"></i> <span>Pause</span>'
          : '<i class="fa-solid fa-play"></i> <span>Play</span>';
      }

      const cur = (audio && isFinite(audio.currentTime))
        ? Math.max(this.clipStartSec, Math.min(this.clipEndSec, audio.currentTime))
        : this.clipStartSec;

      const timeReadout = document.getElementById('statusMusicCtrlTimeReadout');
      if (timeReadout) {
        timeReadout.textContent = `${this._formatSec(cur)} / ${this._formatSec(this.clipEndSec)}`;
      }

      const progressRange = document.getElementById('statusMusicProgressRange');
      if (progressRange) {
        progressRange.min = String(this.clipStartSec);
        progressRange.max = String(this.clipEndSec);
        progressRange.value = String(cur);
      }

      const startRange = document.getElementById('statusMusicStartRange');
      const endRange = document.getElementById('statusMusicEndRange');
      if (startRange) {
        startRange.max = String(Math.max(1, this.trackDurationSec - 1));
        startRange.value = String(this.clipStartSec);
      }
      if (endRange) {
        endRange.max = String(this.trackDurationSec);
        endRange.value = String(this.clipEndSec);
      }

      const startLabel = document.getElementById('statusMusicStartLabel');
      const endLabel = document.getElementById('statusMusicEndLabel');
      if (startLabel) startLabel.textContent = this._formatSec(this.clipStartSec);
      if (endLabel) endLabel.textContent = this._formatSec(this.clipEndSec);

      const summary = document.getElementById('statusMusicWindowSummary');
      if (summary) {
        const span = Math.max(1, this.clipEndSec - this.clipStartSec);
        summary.textContent = `${this._formatSec(this.clipStartSec)} - ${this._formatSec(this.clipEndSec)} (${span.toFixed(1)}s)`;
      }

      const videoMeta = this._getVideoFrameMeta();
      const videoInfoEl = document.getElementById('statusMusicVideoInfoLabel');
      const fitBtn = document.getElementById('statusMusicFitVideoBtn');
      const syncWrap = document.querySelector('.music-ctrl-sync-toggle');
      const syncToggle = document.getElementById('statusMusicSyncVideoToggle');

      if (videoInfoEl) {
        if (videoMeta.hasVideo) {
          videoInfoEl.textContent = `Video Frame: ${this._formatSec(videoMeta.start)} - ${this._formatSec(videoMeta.end)} (${videoMeta.duration.toFixed(1)}s)`;
        } else {
          videoInfoEl.textContent = `Story Slide: ${Math.round(videoMeta.duration)}s clip`;
        }
      }
      if (fitBtn) {
        fitBtn.innerHTML = videoMeta.hasVideo
          ? '<i class="fa-solid fa-arrows-left-right-to-line"></i> <span>Fit Video</span>'
          : '<i class="fa-solid fa-arrows-left-right-to-line"></i> <span>Fit Slide</span>';
      }
      if (syncWrap) {
        syncWrap.style.display = videoMeta.hasVideo ? 'inline-flex' : 'none';
      }
      if (syncToggle) {
        syncToggle.checked = Boolean(this.syncWithVideo);
      }

      const disc = document.querySelector('#statusAttachedMusicSticker .music-sticker-disc-icon i');
      if (disc) {
        disc.classList.toggle('fa-spin', isSelectedPlaying);
      }
    }

    _ensureAudioPlayer() {
      let el = this.currentPreviewAudio || document.getElementById('statusMusicPreviewPlayer');
      if (!el) {
        el = new Audio();
        el.id = 'statusMusicPreviewPlayer';
      }
      // Keep audio player outside display:none modal on document.body so iOS/WebKit never suspends playback
      if (document.body && el.parentNode !== document.body) {
        document.body.appendChild(el);
      }
      el.preload = 'auto';
      el.muted = false;
      el.playsInline = true;
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');

      if (!el.dataset.nexMusicBound) {
        el.dataset.nexMusicBound = 'true';
        el.addEventListener('loadedmetadata', () => {
          const previewDur = (el.duration && isFinite(el.duration) && el.duration > 0) ? Math.min(60, Math.round(el.duration)) : 30;
          if (this.selectedTrack && this.currentlyPlayingId === this.selectedTrack.id) {
            this.trackDurationSec = Math.max(5, previewDur);
            if (this.clipEndSec > this.trackDurationSec || this.clipEndSec <= this.clipStartSec) {
              this.clipEndSec = this.trackDurationSec;
            }
            if (this.clipStartSec > 0 && el.currentTime < this.clipStartSec) {
              try { el.currentTime = this.clipStartSec; } catch (_) {}
            }
          }
          this._syncControlPanelUI();
        });
        el.addEventListener('timeupdate', () => {
          if (this.selectedTrack && this.currentlyPlayingId === this.selectedTrack.id) {
            if (el.currentTime >= (this.clipEndSec - 0.06)) {
              if (el.loop) {
                try { el.currentTime = this.clipStartSec; } catch (_) {}
                const vMeta = this._getVideoFrameMeta();
                if (this.syncWithVideo && vMeta.hasVideo && vMeta.videoEl) {
                  try { vMeta.videoEl.currentTime = vMeta.start; } catch (_) {}
                }
              } else {
                this.stopClip();
                return;
              }
            }
            this._syncControlPanelUI();
          }
        });
        el.addEventListener('ended', () => {
          if (!el.loop) {
            this.playbackStatus = 'stopped';
            this.stopPreviewPlayback();
          }
        });
        el.addEventListener('play', () => {
          const sticker = document.getElementById('statusAttachedMusicSticker');
          this.playbackStatus = 'playing';
          if (sticker && this.selectedTrack) sticker.classList.add('playing');
          this._syncControlPanelUI();
          this.updatePlayStateUI();
        });
        el.addEventListener('pause', () => {
          const sticker = document.getElementById('statusAttachedMusicSticker');
          if (this.playbackStatus === 'playing') this.playbackStatus = 'paused';
          if (sticker) sticker.classList.remove('playing');
          this._syncControlPanelUI();
          this.updatePlayStateUI();
        });
        el.addEventListener('error', async () => {
          const track = this.activePreviewTrack || this.selectedTrack;
          if (track && !track._nexRecoveredUrl) {
            track._nexRecoveredUrl = true;
            this.playbackStatus = 'loading';
            this._syncControlPanelUI();
            const freshUrl = await this.resolveFreshPreviewUrl(track);
            if (freshUrl) {
              el.src = freshUrl;
              el.play().catch(() => {
                this.playbackStatus = 'blocked';
                this._syncControlPanelUI();
              });
              return;
            }
          }
          this.playbackStatus = 'error';
          this.stopPreviewPlayback(true);
          this._syncControlPanelUI();
          if (typeof window.showNotif === 'function') {
            window.showNotif('Preview stream could not load. Please try another track.', 'warning', 2600);
          }
        });
      }

      this.currentPreviewAudio = el;
      return this.currentPreviewAudio;
    }

    async togglePreviewPlayback(track) {
      const audio = this._ensureAudioPlayer();
      if (!audio || !track?.previewUrl) return;

      if (this.currentlyPlayingId === track.id && !audio.paused) {
        this.stopPreviewPlayback();
        return;
      }

      const seq = ++this._playSeq;
      this.activePreviewTrack = track;
      try {
        audio.pause();
        const isSameSrc = audio.src === track.previewUrl;
        audio.loop = false;
        audio.muted = false;
        audio.volume = 0.85;
        if (!isSameSrc) {
          audio.src = track.previewUrl;
        } else if (audio.readyState >= 1) {
          try { audio.currentTime = 0; } catch (_) {}
        }
        this.currentlyPlayingId = track.id;
        this.playbackStatus = 'loading';
        this.updatePlayStateUI();
        this._syncControlPanelUI();

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === 'function') {
          await playPromise;
        }
        if (seq !== this._playSeq) return;
        this.playbackStatus = 'playing';
        if (this.currentlyPlayingId === track.id && !audio.paused) {
          this._fadeAudioTo(audio, 0.85, 180);
        }
        this._syncControlPanelUI();
      } catch (err) {
        if (seq !== this._playSeq || err?.name === 'AbortError') return;
        console.warn('[MUSIC PICKER] Audio play blocked:', err.message);
        this.playbackStatus = err?.name === 'NotAllowedError' ? 'blocked' : 'error';
        this.currentlyPlayingId = null;
        this.updatePlayStateUI();
        this._syncControlPanelUI();
        if (typeof window.showNotif === 'function') {
          window.showNotif('Tap Play again to preview track', 'info', 2000);
        }
      }
    }

    stopPreviewPlayback(preserveErrorStatus = false) {
      if (this.currentPreviewAudio) {
        try {
          this.currentPreviewAudio.pause();
          if (this.currentPreviewAudio.readyState >= 1) {
            this.currentPreviewAudio.currentTime = this.selectedTrack ? this.clipStartSec : 0;
          }
        } catch (_) {}
      }
      this.currentlyPlayingId = null;
      if (!preserveErrorStatus && this.playbackStatus !== 'error') {
        this.playbackStatus = 'stopped';
      }
      this.updatePlayStateUI();
      this._syncControlPanelUI();
    }

    async playClip(fromStart = false) {
      if (!this.selectedTrack?.previewUrl) return;
      const audio = this._ensureAudioPlayer();
      if (!audio) return;
      const seq = ++this._playSeq;
      this.activePreviewTrack = this.selectedTrack;

      try {
        const isSameSrc = audio.src === this.selectedTrack.previewUrl;
        audio.loop = true;
        audio.muted = false;
        audio.volume = 0.85;
        if (!isSameSrc) {
          audio.src = this.selectedTrack.previewUrl;
        }
        if (fromStart || !isSameSrc || audio.currentTime < this.clipStartSec || audio.currentTime >= this.clipEndSec - 0.1) {
          if (audio.readyState >= 1) {
            try { audio.currentTime = this.clipStartSec; } catch (_) {}
          }
        }

        this.currentlyPlayingId = this.selectedTrack.id;
        this.playbackStatus = 'loading';
        this._syncControlPanelUI();

        const p = audio.play();
        if (p && typeof p.then === 'function') await p;
        if (seq !== this._playSeq) return;

        if (fromStart && audio.readyState >= 1 && Math.abs(audio.currentTime - this.clipStartSec) > 0.25) {
          try { audio.currentTime = this.clipStartSec; } catch (_) {}
        }

        this.playbackStatus = 'playing';
        const vMeta = this._getVideoFrameMeta();
        if (this.syncWithVideo && vMeta.hasVideo && vMeta.videoEl) {
          const trimmer = window.NexTransmitterTrimmer;
          if (trimmer) trimmer._suppressMusicSync = true;
          try {
            if (fromStart || vMeta.videoEl.currentTime < vMeta.start || vMeta.videoEl.currentTime >= vMeta.end - 0.1) {
              vMeta.videoEl.currentTime = vMeta.start;
            }
            vMeta.videoEl.play().catch(() => {});
          } finally {
            setTimeout(() => { if (trimmer) trimmer._suppressMusicSync = false; }, 120);
          }
        }
        this._syncControlPanelUI();
      } catch (err) {
        if (seq !== this._playSeq || err?.name === 'AbortError') return;
        console.warn('[STATUS MUSIC] Clip play failed:', err.message);
        this.playbackStatus = err?.name === 'NotAllowedError' ? 'blocked' : 'error';
        this._syncControlPanelUI();
      }
    }

    pauseClip() {
      const audio = this.currentPreviewAudio;
      this.playbackStatus = 'paused';
      if (audio && !audio.paused) {
        try { audio.pause(); } catch (_) {}
      }
      const vMeta = this._getVideoFrameMeta();
      if (this.syncWithVideo && vMeta.hasVideo && vMeta.videoEl && !vMeta.videoEl.paused) {
        const trimmer = window.NexTransmitterTrimmer;
        if (trimmer) trimmer._suppressMusicSync = true;
        try { vMeta.videoEl.pause(); } catch (_) {}
        setTimeout(() => { if (trimmer) trimmer._suppressMusicSync = false; }, 120);
      }
      this._syncControlPanelUI();
    }

    stopClip() {
      this._playSeq++;
      const audio = this.currentPreviewAudio;
      this.playbackStatus = 'stopped';
      if (audio) {
        try {
          audio.pause();
          if (audio.readyState >= 1) audio.currentTime = this.clipStartSec;
        } catch (_) {}
      }
      this.currentlyPlayingId = null;
      const vMeta = this._getVideoFrameMeta();
      if (this.syncWithVideo && vMeta.hasVideo && vMeta.videoEl) {
        const trimmer = window.NexTransmitterTrimmer;
        if (trimmer) trimmer._suppressMusicSync = true;
        try {
          vMeta.videoEl.pause();
          vMeta.videoEl.currentTime = vMeta.start;
        } catch (_) {}
        setTimeout(() => { if (trimmer) trimmer._suppressMusicSync = false; }, 120);
      }
      this.updatePlayStateUI();
      this._syncControlPanelUI();
    }

    toggleAttachedPlayback() {
      if (!this.selectedTrack) return;
      const audio = this._ensureAudioPlayer();
      const isPlaying = Boolean(audio && !audio.paused && this.currentlyPlayingId === this.selectedTrack.id);
      if (isPlaying) {
        this.pauseClip();
      } else {
        this.playClip(this.playbackStatus === 'stopped');
      }
    }

    syncFromVideoPlay(offsetSec = 0) {
      if (!this.selectedTrack?.previewUrl || !this.syncWithVideo) return;
      const audio = this._ensureAudioPlayer();
      if (!audio) return;
      const target = Math.min(this.clipEndSec - 0.1, this.clipStartSec + Math.max(0, Number(offsetSec) || 0));
      if (audio.src !== this.selectedTrack.previewUrl) {
        audio.src = this.selectedTrack.previewUrl;
      }
      audio.loop = true;
      audio.muted = false;
      audio.volume = 0.85;
      if (audio.readyState >= 1) {
        try { audio.currentTime = target; } catch (_) {}
      }
      this.currentlyPlayingId = this.selectedTrack.id;
      this.activePreviewTrack = this.selectedTrack;
      if (audio.paused) {
        audio.play().then(() => {
          this.playbackStatus = 'playing';
          this._syncControlPanelUI();
        }).catch(() => {});
      }
    }

    syncFromVideoPause() {
      const audio = this.currentPreviewAudio;
      if (audio && !audio.paused && this.selectedTrack && this.currentlyPlayingId === this.selectedTrack.id) {
        this.playbackStatus = 'paused';
        try { audio.pause(); } catch (_) {}
        this._syncControlPanelUI();
      }
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
      this.selectedTrack = { ...track };
      this.activePreviewTrack = this.selectedTrack;
      this.trackDurationSec = 30;
      this.clipStartSec = 0;

      // Auto-fit music clip length initially to uploaded video/slide duration if shorter than 30s
      const vMeta = this._getVideoFrameMeta();
      if (vMeta.hasVideo && vMeta.duration > 0) {
        this.clipEndSec = Math.min(this.trackDurationSec, Math.max(1, Number(vMeta.duration.toFixed(1))));
      } else {
        this.clipEndSec = 30;
      }

      // Update Floating Music Sticker on preview card BEFORE starting playback
      const sticker = document.getElementById('statusAttachedMusicSticker');
      const art = document.getElementById('statusAttachedMusicArt');
      const title = document.getElementById('statusAttachedMusicTitle');
      const artist = document.getElementById('statusAttachedMusicArtist');

      if (sticker && art && title && artist) {
        art.src = track.artworkUrl;
        title.textContent = track.trackName;
        artist.textContent = track.artistName;
        sticker.style.display = 'flex';
        sticker.classList.remove('playing');
        this._bindAttachedStickerAndPanel();
      }

      // Start playback synchronously inside tap gesture BEFORE hiding modal (critical for iOS WebKit)
      this.playClip(true);
      this.setControlPanelOpen(false);
      this._syncControlPanelUI();

      // Close modal sheet after triggering audio playback on body-level player
      const modal = document.getElementById('statusMusicPickerModal');
      if (modal) modal.style.display = 'none';

      if (window.showNotif) {
        window.showNotif(`Added: ${track.trackName}. Tap sticker to play/stop & adjust time frame.`, 'success', 2800);
      }
    }

    removeTrack() {
      this.selectedTrack = null;
      this.activePreviewTrack = null;
      this.clipStartSec = 0;
      this.clipEndSec = 30;
      this.trackDurationSec = 30;
      this.playbackStatus = 'stopped';
      this.stopPreviewPlayback();
      this.setControlPanelOpen(false);

      const sticker = document.getElementById('statusAttachedMusicSticker');
      if (sticker) {
        sticker.style.display = 'none';
        sticker.classList.remove('playing');
      }

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
        durationSec: this.selectedTrack.durationSec,
        startSec: Number((this.clipStartSec || 0).toFixed(1)),
        endSec: Number((this.clipEndSec || 30).toFixed(1)),
        clipDuration: Number(Math.max(1, (this.clipEndSec || 30) - (this.clipStartSec || 0)).toFixed(1)),
        syncWithVideo: Boolean(this.syncWithVideo)
      } : null;
    }

    reset() {
      this.removeTrack();
    }
  }

  global.StatusMusicPickerEngine = StatusMusicPickerEngine;
  global.statusMusicPickerEngine = new StatusMusicPickerEngine();

})(typeof window !== 'undefined' ? window : this);
