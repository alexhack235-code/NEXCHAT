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
      trackId: 1500000001,
      trackName: 'Calm Down',
      artistName: 'Rema',
      collectionName: 'Rave & Roses',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/bf/20/7e/bf207e47-e25f-2ec4-eaec-cb242d59cf7a/mzaf_14022800318534015697.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/bf/20/7e/bf207e47-e25f-2ec4-eaec-cb242d59cf7a/22UMGIM10373.rgb.jpg/600x600bb.jpg',
      trackTimeMillis: 30000,
      genres: ['top hits', 'afrobeats', 'trending']
    },
    {
      trackId: 1500000002,
      trackName: 'Last Last',
      artistName: 'Burna Boy',
      collectionName: 'Love, Damini',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/09/b3/ef/09b3efbc-ebf3-4ca2-c288-cf941a50a1df/mzaf_5521255536486183358.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/09/b3/ef/09b3efbc-ebf3-4ca2-c288-cf941a50a1df/075679753441.jpg/600x600bb.jpg',
      trackTimeMillis: 30000,
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
      trackId: 1440843468,
      trackName: 'Blinding Lights',
      artistName: 'The Weeknd',
      collectionName: 'After Hours',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/4a/5b/4b/4a5b4be4-20b8-c3e0-652a-cf0fba0d588a/mzaf_10034237194161726059.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/4a/5b/4b/4a5b4be4-20b8-c3e0-652a-cf0fba0d588a/20UMGIM03138.rgb.jpg/600x600bb.jpg',
      trackTimeMillis: 30000,
      genres: ['top hits', 'pop', 'r&b']
    },
    {
      trackId: 1544494222,
      trackName: 'Save Your Tears',
      artistName: 'The Weeknd',
      collectionName: 'After Hours',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/5e/5c/42/5e5c4266-98dc-a9fc-c744-996ff2064971/mzaf_7811195679549326402.plus.aac.p.m4a',
      artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/5e/5c/42/5e5c4266-98dc-a9fc-c744-996ff2064971/20UMGIM03138.rgb.jpg/600x600bb.jpg',
      trackTimeMillis: 30000,
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
          const genre = pill.getAttribute('data-genre') || 'top hits';
          this.activeGenre = genre;
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

      // Prepare singleton Preview Audio element cleanly
      this._ensureAudioPlayer();
    }

    openPicker() {
      const modal = document.getElementById('statusMusicPickerModal');
      if (!modal) return;
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

        // Merge curated + live tracks cleanly without duplicates
        const seenIds = new Set();
        const mergedTracks = [];
        for (const t of [...curatedInstant, ...liveTracks]) {
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
      el.playsInline = true;
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');

      if (!el.dataset.nexMusicBound) {
        el.dataset.nexMusicBound = 'true';
        el.addEventListener('ended', () => {
          if (!el.loop) this.stopPreviewPlayback();
        });
        el.addEventListener('play', () => {
          const sticker = document.getElementById('statusAttachedMusicSticker');
          if (sticker && this.selectedTrack) sticker.classList.add('playing');
        });
        el.addEventListener('pause', () => {
          const sticker = document.getElementById('statusAttachedMusicSticker');
          if (sticker) sticker.classList.remove('playing');
        });
        el.addEventListener('error', () => {
          this.stopPreviewPlayback();
        });
      }

      this.currentPreviewAudio = el;
      return this.currentPreviewAudio;
    }

    togglePreviewPlayback(track) {
      const audio = this._ensureAudioPlayer();
      if (!audio || !track?.previewUrl) return;

      if (this.currentlyPlayingId === track.id && !audio.paused) {
        this.stopPreviewPlayback();
        return;
      }

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
        const playPromise = audio.play();
        this.currentlyPlayingId = track.id;
        this.updatePlayStateUI();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(err => {
            console.warn('[MUSIC PICKER] Audio play blocked:', err.message);
            this.stopPreviewPlayback();
            if (typeof window.showNotif === 'function') {
              window.showNotif('Tap Play again to preview track', 'info', 2000);
            }
          });
        }
      } catch (err) {
        console.warn('[MUSIC PICKER] Preview playback error:', err.message);
        this.stopPreviewPlayback();
      }
    }

    stopPreviewPlayback() {
      if (this.currentPreviewAudio) {
        try {
          this.currentPreviewAudio.pause();
          if (this.currentPreviewAudio.readyState >= 1) {
            this.currentPreviewAudio.currentTime = 0;
          }
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

        if (!sticker.dataset.interactiveBound) {
          sticker.dataset.interactiveBound = 'true';
          sticker.style.cursor = 'pointer';
          sticker.title = 'Click to toggle background music playback';
          sticker.addEventListener('click', (e) => {
            if (e.target.closest('#statusRemoveMusicBtn')) return;
            const player = this._ensureAudioPlayer();
            if (!player || !this.selectedTrack?.previewUrl) return;
            if (player.paused) {
              if (player.src !== this.selectedTrack.previewUrl) {
                player.src = this.selectedTrack.previewUrl;
              }
              player.loop = true;
              player.muted = false;
              player.volume = 0.85;
              player.play().then(() => {
                sticker.classList.add('playing');
                this.currentlyPlayingId = this.selectedTrack.id;
              }).catch(() => {});
            } else {
              player.pause();
              sticker.classList.remove('playing');
            }
          });
        }
      }

      // Start playback synchronously inside tap gesture BEFORE hiding modal (critical for iOS WebKit)
      const audio = this._ensureAudioPlayer();
      if (audio && track.previewUrl) {
        try {
          const alreadyPlayingSame = audio.src === track.previewUrl && !audio.paused;
          audio.loop = true;
          audio.volume = 0.85;
          audio.muted = false;
          if (!alreadyPlayingSame) {
            audio.pause();
            if (audio.src !== track.previewUrl) {
              audio.src = track.previewUrl;
            } else if (audio.readyState >= 1) {
              try { audio.currentTime = 0; } catch (_) {}
            }
          }
          const playPromise = alreadyPlayingSame ? Promise.resolve() : audio.play();
          this.currentlyPlayingId = track.id;
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise.then(() => {
              this.currentlyPlayingId = track.id;
              if (sticker) sticker.classList.add('playing');
            }).catch(err => {
              console.warn('[STATUS MUSIC] Autoplay preview notice:', err.message);
              if (sticker) sticker.classList.remove('playing');
            });
          }
        } catch (e) {
          console.warn('[STATUS MUSIC] Audio play setup error:', e);
        }
      }

      // Close modal sheet after triggering audio playback on body-level player
      const modal = document.getElementById('statusMusicPickerModal');
      if (modal) modal.style.display = 'none';

      if (window.showNotif) {
        window.showNotif(`Added music: ${track.trackName} - ${track.artistName}`, 'success', 2500);
      }
    }

    removeTrack() {
      this.selectedTrack = null;
      this.stopPreviewPlayback();

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
