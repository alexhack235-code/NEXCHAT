/**
 * NEXCHAT WhatsApp-Style Sticker Store & Custom Sticker Studio
 * 
 * Capabilities:
 * - Local Device Storage: IndexedDB (App Data Store) with LocalStorage fallback
 * - WhatsApp-style Die-Cut Sticker Creator Canvas Studio
 * - Preset High-Definition Sticker Packs (Cyber, Memes, Reactions)
 * - Transparent Sticker Message Dispatch & In-Chat Rendering
 */

(function () {
  'use strict';

  const DB_NAME = 'NexChatStickerDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'user_stickers';

  // Preset Sticker Collections (High-Fidelity SVG / Vector Art Data)
  const PRESET_PACKS = [
    {
      id: 'cyber',
      name: 'Cyber Squad',
      icon: 'fa-bolt',
      stickers: [
        {
          id: 'cyber_cat',
          name: 'Cyber Cat',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <filter id="c-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#00f2fe" flood-opacity="0.8"/>
            </filter>
            <path d="M 50 140 C 40 100 45 60 70 40 L 95 80 L 105 80 L 130 40 C 155 60 160 100 150 140 C 135 165 65 165 50 140 Z" fill="#0b0f19" stroke="#ffffff" stroke-width="8" filter="url(#c-glow)"/>
            <circle cx="80" cy="115" r="14" fill="#00ff66"/>
            <circle cx="120" cy="115" r="14" fill="#00f2fe"/>
            <path d="M 75 115 L 85 115 M 115 115 L 125 115" stroke="#000" stroke-width="4" stroke-linecap="round"/>
            <polygon points="100,128 92,136 108,136" fill="#fe2c55"/>
            <path d="M 90 142 Q 100 150 110 142" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
            <text x="100" y="180" font-family="'Impact', sans-serif" font-size="20" fill="#fff" stroke="#000" stroke-width="3" text-anchor="middle" paint-order="stroke fill">CYBER CAT</text>
          </svg>`
        },
        {
          id: 'chronex_core',
          name: 'ChronEX AI',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="75" fill="#060913" stroke="#ffffff" stroke-width="8"/>
            <circle cx="100" cy="100" r="58" fill="none" stroke="#00ff66" stroke-width="5" stroke-dasharray="12 6"/>
            <polygon points="100,50 135,75 135,125 100,150 65,125 65,75" fill="none" stroke="#00f2fe" stroke-width="6"/>
            <circle cx="100" cy="100" r="22" fill="#00ff66"/>
            <text x="100" y="107" font-family="'Impact', sans-serif" font-size="19" fill="#000" font-weight="900" text-anchor="middle">AI</text>
            <text x="100" y="184" font-family="'Impact', sans-serif" font-size="18" fill="#fff" stroke="#000" stroke-width="3" text-anchor="middle" paint-order="stroke fill">CHRONEX 3.8</text>
          </svg>`
        },
        {
          id: 'gg_wp',
          name: 'GG WP',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="45" width="150" height="110" rx="24" fill="#0f172a" stroke="#ffffff" stroke-width="8"/>
            <text x="100" y="105" font-family="'Impact', sans-serif" font-size="44" fill="#ffd700" stroke="#000" stroke-width="5" text-anchor="middle" paint-order="stroke fill">GG WP</text>
            <text x="100" y="135" font-family="'Impact', sans-serif" font-size="18" fill="#38bdf8" stroke="#000" stroke-width="2" text-anchor="middle" paint-order="stroke fill">WELL PLAYED</text>
          </svg>`
        },
        {
          id: 'level_up',
          name: 'Level Up',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M 100 25 L 170 70 L 170 145 L 100 185 L 30 145 L 30 70 Z" fill="#1e1035" stroke="#ffffff" stroke-width="8"/>
            <polygon points="100,55 125,95 75,95" fill="#e8b84b"/>
            <polygon points="100,85 125,125 75,125" fill="#00ff66"/>
            <text x="100" y="160" font-family="'Impact', sans-serif" font-size="24" fill="#fff" stroke="#000" stroke-width="4" text-anchor="middle" paint-order="stroke fill">LEVEL UP!</text>
          </svg>`
        },
        {
          id: 'hacker_root',
          name: 'Root Access',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="40" width="150" height="120" rx="18" fill="#020617" stroke="#ffffff" stroke-width="8"/>
            <circle cx="45" cy="58" r="5" fill="#ff5f56"/>
            <circle cx="62" cy="58" r="5" fill="#ffbd2e"/>
            <circle cx="79" cy="58" r="5" fill="#27c93f"/>
            <text x="100" y="100" font-family="'Courier New', monospace" font-size="20" font-weight="900" fill="#00ff66" text-anchor="middle"># root:~$</text>
            <text x="100" y="132" font-family="'Impact', sans-serif" font-size="19" fill="#00f2fe" stroke="#000" stroke-width="2" text-anchor="middle" paint-order="stroke fill">GRANTED</text>
          </svg>`
        },
        {
          id: 'diamond_hands',
          name: 'Diamond Hands',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <polygon points="100,35 155,75 100,165 45,75" fill="#0ea5e9" stroke="#ffffff" stroke-width="8"/>
            <polygon points="100,35 125,75 100,165 75,75" fill="#38bdf8"/>
            <line x1="45" y1="75" x2="155" y2="75" stroke="#ffffff" stroke-width="4"/>
            <text x="100" y="185" font-family="'Impact', sans-serif" font-size="22" fill="#ffd700" stroke="#000" stroke-width="4" text-anchor="middle" paint-order="stroke fill">HODL</text>
          </svg>`
        }
      ]
    },
    {
      id: 'memes',
      name: 'Memes & Vibes',
      icon: 'fa-face-laugh-squint',
      stickers: [
        {
          id: 'pepe_chill',
          name: 'Chill Frog',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="110" rx="70" ry="55" fill="#588d3d" stroke="#ffffff" stroke-width="8"/>
            <ellipse cx="75" cy="70" rx="22" ry="22" fill="#588d3d" stroke="#ffffff" stroke-width="7"/>
            <ellipse cx="125" cy="70" rx="22" ry="22" fill="#588d3d" stroke="#ffffff" stroke-width="7"/>
            <circle cx="75" cy="70" r="10" fill="#fff"/>
            <circle cx="78" cy="70" r="5" fill="#000"/>
            <circle cx="125" cy="70" r="10" fill="#fff"/>
            <circle cx="128" cy="70" r="5" fill="#000"/>
            <path d="M 60 125 Q 100 150 140 125" stroke="#2d4a1f" stroke-width="6" fill="none" stroke-linecap="round"/>
            <text x="100" y="180" font-family="'Impact', sans-serif" font-size="22" fill="#fff" stroke="#000" stroke-width="4" text-anchor="middle" paint-order="stroke fill">CHILL</text>
          </svg>`
        },
        {
          id: 'mind_blown',
          name: 'Mind Blown',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="115" r="55" fill="#facc15" stroke="#ffffff" stroke-width="8"/>
            <!-- Brain explosion cloud -->
            <path d="M 50 80 Q 70 30 100 45 Q 130 30 150 80 Q 170 100 140 115 L 60 115 Q 30 100 50 80 Z" fill="#ec4899" stroke="#ffffff" stroke-width="7"/>
            <ellipse cx="80" cy="120" rx="7" ry="12" fill="#000"/>
            <ellipse cx="120" cy="120" rx="7" ry="12" fill="#000"/>
            <ellipse cx="100" cy="145" rx="14" ry="16" fill="#78350f"/>
            <text x="100" y="185" font-family="'Impact', sans-serif" font-size="20" fill="#fff" stroke="#000" stroke-width="4" text-anchor="middle" paint-order="stroke fill">MIND BLOWN</text>
          </svg>`
        },
        {
          id: 'lit_fire',
          name: 'LIT',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M 100 25 C 125 70 170 100 160 145 C 150 180 115 185 100 185 C 85 185 50 180 40 145 C 30 100 75 70 100 25 Z" fill="#ef4444" stroke="#ffffff" stroke-width="8"/>
            <path d="M 100 70 C 115 100 140 120 135 150 C 130 170 110 175 100 175 C 90 175 70 170 65 150 C 60 120 85 100 100 70 Z" fill="#f59e0b"/>
            <path d="M 100 110 C 108 125 120 135 118 155 C 115 168 105 170 100 170 C 95 170 85 168 82 155 C 80 135 92 125 100 110 Z" fill="#fef08a"/>
            <text x="100" y="160" font-family="'Impact', sans-serif" font-size="32" fill="#fff" stroke="#000" stroke-width="5" text-anchor="middle" paint-order="stroke fill">LIT!</text>
          </svg>`
        },
        {
          id: 'bruh_moment',
          name: 'Bruh',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="68" fill="#facc15" stroke="#ffffff" stroke-width="8"/>
            <line x1="65" y1="88" x2="88" y2="88" stroke="#000" stroke-width="8" stroke-linecap="round"/>
            <line x1="112" y1="88" x2="135" y2="88" stroke="#000" stroke-width="8" stroke-linecap="round"/>
            <line x1="75" y1="130" x2="125" y2="130" stroke="#000" stroke-width="8" stroke-linecap="round"/>
            <text x="100" y="180" font-family="'Impact', sans-serif" font-size="28" fill="#fff" stroke="#000" stroke-width="4" text-anchor="middle" paint-order="stroke fill">BRUH...</text>
          </svg>`
        }
      ]
    },
    {
      id: 'reactions',
      name: 'Reactions',
      icon: 'fa-thumbs-up',
      stickers: [
        {
          id: 'lgtm',
          name: 'LGTM',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="45" width="150" height="110" rx="22" fill="#059669" stroke="#ffffff" stroke-width="8"/>
            <path d="M 65 100 L 90 125 L 140 75" stroke="#ffffff" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <text x="100" y="145" font-family="'Impact', sans-serif" font-size="22" fill="#fff" stroke="#000" stroke-width="3" text-anchor="middle" paint-order="stroke fill">LGTM</text>
          </svg>`
        },
        {
          id: 'approved_stamp',
          name: 'Approved',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="55" width="150" height="90" rx="14" fill="#dc2626" stroke="#ffffff" stroke-width="8" transform="rotate(-8 100 100)"/>
            <text x="100" y="112" font-family="'Impact', sans-serif" font-size="28" fill="#fff" stroke="#7f1d1d" stroke-width="3" text-anchor="middle" transform="rotate(-8 100 100)" paint-order="stroke fill">APPROVED</text>
          </svg>`
        },
        {
          id: 'one_hundred',
          name: '100%',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="70" fill="#dc2626" stroke="#ffffff" stroke-width="8"/>
            <text x="100" y="115" font-family="'Impact', sans-serif" font-size="48" fill="#fff" stroke="#000" stroke-width="4" text-anchor="middle" paint-order="stroke fill">100</text>
            <line x1="55" y1="130" x2="145" y2="130" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
            <line x1="55" y1="140" x2="145" y2="140" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
          </svg>`
        },
        {
          id: 'big_brain',
          name: 'Big Brain',
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="90" rx="65" ry="50" fill="#a855f7" stroke="#ffffff" stroke-width="8"/>
            <path d="M 60 85 C 80 50 120 50 140 85 M 75 90 C 85 70 115 70 125 90" stroke="#fff" stroke-width="4" fill="none"/>
            <text x="100" y="165" font-family="'Impact', sans-serif" font-size="22" fill="#fff" stroke="#000" stroke-width="4" text-anchor="middle" paint-order="stroke fill">BIG BRAIN</text>
          </svg>`
        }
      ]
    },
    {
      id: 'video_sound',
      name: 'Video & Audio',
      icon: 'fa-film',
      stickers: [
        {
          id: 'kinetic_pulse',
          name: 'Sonic Pulse',
          soundPreset: 'bass_drop',
          isAnimated: true,
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="76" fill="#07131e" stroke="#00ff88" stroke-width="6">
              <animate attributeName="r" values="70;78;70" dur="1.1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="100" cy="100" r="54" fill="none" stroke="#00d4ff" stroke-width="4" stroke-dasharray="18 10">
              <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="4s" repeatCount="indefinite"/>
            </circle>
            <g fill="#00ff88">
              <rect x="64" y="80" width="10" height="40" rx="5"><animate attributeName="height" values="24;68;24" dur="0.7s" repeatCount="indefinite"/><animate attributeName="y" values="88;66;88" dur="0.7s" repeatCount="indefinite"/></rect>
              <rect x="82" y="65" width="10" height="70" rx="5" fill="#00d4ff"><animate attributeName="height" values="70;28;70" dur="0.65s" repeatCount="indefinite"/><animate attributeName="y" values="65;86;65" dur="0.65s" repeatCount="indefinite"/></rect>
              <rect x="100" y="55" width="10" height="90" rx="5"><animate attributeName="height" values="36;86;36" dur="0.58s" repeatCount="indefinite"/><animate attributeName="y" values="82;57;82" dur="0.58s" repeatCount="indefinite"/></rect>
              <rect x="118" y="68" width="10" height="64" rx="5" fill="#00d4ff"><animate attributeName="height" values="66;26;66" dur="0.72s" repeatCount="indefinite"/><animate attributeName="y" values="67;87;67" dur="0.72s" repeatCount="indefinite"/></rect>
              <rect x="136" y="80" width="10" height="40" rx="5"><animate attributeName="height" values="24;58;24" dur="0.62s" repeatCount="indefinite"/><animate attributeName="y" values="88;71;88" dur="0.62s" repeatCount="indefinite"/></rect>
            </g>
            <text x="100" y="176" font-family="'Impact', sans-serif" font-size="18" fill="#ffffff" stroke="#000" stroke-width="3" text-anchor="middle" paint-order="stroke fill">BASS DROP</text>
          </svg>`
        },
        {
          id: 'neon_heartbeat',
          name: 'Neon Heart',
          soundPreset: 'sci_fi_chime',
          isAnimated: true,
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <g>
              <animateTransform attributeName="transform" type="scale" values="1;1.1;0.96;1.08;1" dur="1.15s" repeatCount="indefinite" additive="sum" />
              <path d="M100 160 C55 128 28 96 28 65 C28 42 46 26 68 26 C82 26 94 34 100 45 C106 34 118 26 132 26 C154 26 172 42 172 65 C172 96 145 128 100 160 Z" fill="#e11d48" stroke="#ffffff" stroke-width="7"/>
            </g>
            <path d="M55 95 L78 95 L88 74 L100 116 L112 82 L122 95 L145 95" fill="none" stroke="#67e8f9" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="140">
              <animate attributeName="stroke-dashoffset" from="140" to="0" dur="1.15s" repeatCount="indefinite"/>
            </path>
            <text x="100" y="185" font-family="'Impact', sans-serif" font-size="19" fill="#ffffff" stroke="#000" stroke-width="3" text-anchor="middle" paint-order="stroke fill">HEARTBEAT</text>
          </svg>`
        },
        {
          id: 'laser_zap_motion',
          name: 'Laser Bolt',
          soundPreset: 'laser_zap',
          isAnimated: true,
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="76" fill="#0f172a" stroke="#38bdf8" stroke-width="6"/>
            <polygon points="112,32 62,108 102,108 86,168 142,88 102,88" fill="#ffd700" stroke="#ffffff" stroke-width="5">
              <animate attributeName="opacity" values="1;0.65;1;0.9;1" dur="0.45s" repeatCount="indefinite"/>
              <animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,0" dur="0.6s" repeatCount="indefinite"/>
            </polygon>
            <text x="100" y="184" font-family="'Impact', sans-serif" font-size="18" fill="#67e8f9" stroke="#000" stroke-width="3" text-anchor="middle" paint-order="stroke fill">HYPER ZAP</text>
          </svg>`
        },
        {
          id: 'applause_orbit',
          name: 'Gold Star FX',
          soundPreset: 'applause_burst',
          isAnimated: true,
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <polygon points="100,26 121,72 172,78 134,113 144,164 100,139 56,164 66,113 28,78 79,72" fill="#f59e0b" stroke="#ffffff" stroke-width="7">
              <animateTransform attributeName="transform" type="rotate" values="-6 100 100;6 100 100;-6 100 100" dur="1.4s" repeatCount="indefinite"/>
            </polygon>
            <text x="100" y="185" font-family="'Impact', sans-serif" font-size="19" fill="#ffffff" stroke="#000" stroke-width="3" text-anchor="middle" paint-order="stroke fill">LEGENDARY</text>
          </svg>`
        },
        {
          id: 'cyber_laugh_motion',
          name: 'HAHA Motion',
          soundPreset: 'pop_laugh',
          isAnimated: true,
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect x="24" y="42" width="152" height="112" rx="26" fill="#7c3aed" stroke="#ffffff" stroke-width="7">
              <animateTransform attributeName="transform" type="rotate" values="-4 100 100;4 100 100;-4 100 100" dur="0.55s" repeatCount="indefinite"/>
            </rect>
            <text x="100" y="106" font-family="'Impact', sans-serif" font-size="38" fill="#00ff88" stroke="#000" stroke-width="4" text-anchor="middle" paint-order="stroke fill">HAHAHA!</text>
            <text x="100" y="136" font-family="'Impact', sans-serif" font-size="16" fill="#ffffff" text-anchor="middle">SOUND ON</text>
          </svg>`
        },
        {
          id: 'hype_radar_siren',
          name: 'Alert Siren',
          soundPreset: 'hype_siren',
          isAnimated: true,
          svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="78" fill="none" stroke="#ff2a5f" stroke-width="5" opacity="0.7">
              <animate attributeName="r" values="42;84" dur="1s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.9;0" dur="1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="100" cy="100" r="56" fill="#0b0f19" stroke="#ff2a5f" stroke-width="6"/>
            <text x="100" y="108" font-family="'Impact', sans-serif" font-size="28" fill="#ff5f7e" stroke="#000" stroke-width="3" text-anchor="middle" paint-order="stroke fill">HYPE!</text>
          </svg>`
        }
      ]
    }
  ];

  let _activeAudioNode = null;
  function playNexStickerAudio(meta = {}) {
    try {
      if (_activeAudioNode) {
        try { _activeAudioNode.pause(); } catch (_) {}
        _activeAudioNode = null;
      }
      if (meta && meta.audioUrl) {
        const audio = new Audio(meta.audioUrl);
        audio.volume = 0.88;
        _activeAudioNode = audio;
        audio.play().catch(() => {});
        return true;
      }
      const preset = meta?.soundPreset || 'sci_fi_chime';
      if (preset === 'none') return false;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      const ctx = window.__nexStickerAudioCtx || (window.__nexStickerAudioCtx = new AudioCtx());
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;

      const tone = (freqStart, freqEnd, dur, type = 'sine', startOffset = 0, vol = 0.16) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, now + startOffset);
        osc.frequency.exponentialRampToValueAtTime(Math.max(24, freqEnd), now + startOffset + dur);
        gain.gain.setValueAtTime(0.001, now + startOffset);
        gain.gain.linearRampToValueAtTime(vol, now + startOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + startOffset + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + dur + 0.03);
      };

      if (preset === 'bass_drop') {
        tone(170, 42, 0.55, 'sawtooth', 0, 0.2);
        tone(95, 36, 0.65, 'sine', 0.04, 0.25);
      } else if (preset === 'laser_zap') {
        tone(1200, 180, 0.24, 'sawtooth', 0, 0.16);
        tone(980, 140, 0.22, 'triangle', 0.12, 0.14);
      } else if (preset === 'applause_burst') {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => tone(f, f * 1.02, 0.32, 'triangle', idx * 0.06, 0.14));
      } else if (preset === 'pop_laugh') {
        [420, 560, 480, 640, 580].forEach((f, idx) => tone(f, f * 1.25, 0.1, 'sine', idx * 0.085, 0.16));
      } else if (preset === 'hype_siren') {
        tone(540, 880, 0.22, 'sawtooth', 0, 0.13);
        tone(880, 540, 0.22, 'sawtooth', 0.22, 0.13);
      } else {
        tone(587.33, 880, 0.24, 'sine', 0, 0.15);
        tone(880, 1174.66, 0.34, 'triangle', 0.09, 0.14);
      }
      return true;
    } catch (_) {
      return false;
    }
  }
  if (typeof window !== 'undefined') {
    window.playNexStickerAudio = playNexStickerAudio;
  }

  class NexStickerStore {
    constructor() {
      this.db = null;
      this.activePack = 'my_stickers';
      this.initDB();
      this.bindUI();
    }

    // ─── 1. App Data Store (IndexedDB) ───
    initDB() {
      if (!window.indexedDB) {
        console.warn('[NexStickers] IndexedDB not available, using localStorage fallback');
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('pack', 'pack', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        console.log('[NexStickers] IndexedDB App Data Store initialized.');
      };
      request.onerror = (e) => {
        console.error('[NexStickers] IndexedDB error:', e);
      };
    }

    async saveCustomSticker(sticker) {
      if (this.db) {
        return new Promise((resolve, reject) => {
          const tx = this.db.transaction([STORE_NAME], 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(sticker);
          tx.oncomplete = () => resolve(sticker);
          tx.onerror = (err) => reject(err);
        });
      } else {
        // LocalStorage fallback
        try {
          const list = JSON.parse(localStorage.getItem('nex_custom_stickers') || '[]');
          const idx = list.findIndex(s => s.id === sticker.id);
          if (idx >= 0) list[idx] = sticker;
          else list.push(sticker);
          localStorage.setItem('nex_custom_stickers', JSON.stringify(list));
          return sticker;
        } catch (e) {
          console.error(e);
        }
      }
    }

    async getCustomStickers() {
      if (this.db) {
        return new Promise((resolve) => {
          const tx = this.db.transaction([STORE_NAME], 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
      } else {
        try {
          return JSON.parse(localStorage.getItem('nex_custom_stickers') || '[]');
        } catch (e) {
          return [];
        }
      }
    }

    async deleteCustomSticker(id) {
      if (this.db) {
        return new Promise((resolve) => {
          const tx = this.db.transaction([STORE_NAME], 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.delete(id);
          tx.oncomplete = () => resolve(true);
        });
      } else {
        const list = JSON.parse(localStorage.getItem('nex_custom_stickers') || '[]').filter(s => s.id !== id);
        localStorage.setItem('nex_custom_stickers', JSON.stringify(list));
      }
    }

    // ─── 2. DOM & Modal Bindings ───
    bindUI() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupDOM());
      } else {
        this.setupDOM();
      }
    }

    setupDOM() {
      this.injectModals();
      this.attachEvents();
    }

    injectModals() {
      // 1. Sticker Store & Picker Modal
      if (!document.getElementById('stickerStoreModal')) {
        const storeModal = document.createElement('div');
        storeModal.id = 'stickerStoreModal';
        storeModal.className = 'sticker-store-modal';
        storeModal.style.display = 'none';

        storeModal.innerHTML = `
          <div class="sticker-store-card">
            <div class="sticker-store-header">
              <div class="sticker-header-left">
                <i class="fa-solid fa-note-sticky text-[#00f2fe] text-lg"></i>
                <span class="sticker-modal-title">Sticker Hub & Store</span>
              </div>
              <div class="sticker-header-right">
                <button type="button" id="openStickerCreatorBtn" class="sticker-create-quick-btn" title="Create Your Own Custom Sticker">
                  <i class="fa-solid fa-wand-magic-sparkles"></i> <span>Create Sticker</span>
                </button>
                <button type="button" id="closeStickerStoreBtn" class="sticker-close-btn" title="Close"><i class="fa-solid fa-xmark"></i></button>
              </div>
            </div>

            <!-- Pack Tabs Bar -->
            <div class="sticker-pack-tabs" id="stickerPackTabs">
              <button type="button" class="sticker-tab-pill active" data-pack="my_stickers">
                <i class="fa-solid fa-star text-[#e8b84b]"></i> <span>My Stickers</span>
              </button>
              <button type="button" class="sticker-tab-pill" data-pack="cyber">
                <i class="fa-solid fa-bolt text-[#00f2fe]"></i> <span>Cyber</span>
              </button>
              <button type="button" class="sticker-tab-pill" data-pack="memes">
                <i class="fa-solid fa-face-laugh-squint text-[#00ff66]"></i> <span>Memes</span>
              </button>
              <button type="button" class="sticker-tab-pill" data-pack="reactions">
                <i class="fa-solid fa-thumbs-up text-[#38bdf8]"></i> <span>Reactions</span>
              </button>
              <button type="button" class="sticker-tab-pill" data-pack="video_sound">
                <i class="fa-solid fa-film text-[#00ff88]"></i> <span>Video &amp; Audio</span>
              </button>
            </div>

            <!-- Sticker Grid Stream -->
            <div class="sticker-grid-container" id="stickerGridContainer"></div>

            <div class="sticker-store-footer">
              <span class="sticker-storage-info"><i class="fa-solid fa-database text-[10px]"></i> Saved safely to your local device app data store</span>
            </div>
          </div>
        `;
        document.body.appendChild(storeModal);
      }

      // 2. Sticker Studio Creator Mini Pop-Up Page
      if (!document.getElementById('stickerStudioModal')) {
        const creatorModal = document.createElement('div');
        creatorModal.id = 'stickerStudioModal';
        creatorModal.className = 'sticker-studio-modal';
        creatorModal.style.display = 'none';

        creatorModal.innerHTML = `
          <div class="sticker-studio-card">
            <div class="sticker-studio-header">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-wand-magic-sparkles text-[#00ff66] text-lg"></i>
                <span class="font-bold text-white text-[15px]">Sticker Studio & Creator</span>
              </div>
              <button type="button" id="closeStickerStudioBtn" class="sticker-close-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div class="sticker-studio-body">
              <!-- Left: Canvas / Video Preview Box -->
              <div class="sticker-canvas-wrapper">
                <div class="sticker-checkered-stage">
                  <canvas id="stickerStudioCanvas" width="360" height="360"></canvas>
                  <video id="stickerStudioVideoPreview" autoplay loop muted playsinline style="display:none;width:100%;height:100%;max-width:300px;max-height:300px;object-fit:contain;border-radius:16px;"></video>
                </div>
                <span class="text-[11px] text-gray-400 mt-2 text-center block">Real-time Image &amp; Video Sticker Preview</span>
              </div>

              <!-- Right: Controls & Customization -->
              <div class="sticker-controls-column">
                <div class="sticker-upload-dropzone" id="stickerDropzone">
                  <input type="file" id="stickerImageInput" accept="image/*,video/mp4,video/webm,video/quicktime" style="display: none;">
                  <i class="fa-solid fa-cloud-arrow-up text-2xl text-[#00f2fe] mb-1"></i>
                  <strong class="text-white text-xs block">Choose Photo, GIF or Video Sticker</strong>
                  <span class="text-[10px] text-gray-400">PNG, WebP, GIF, MP4, WebM supported</span>
                </div>

                <div class="sticker-control-group mt-3">
                  <label class="sticker-control-label">Sticker Outline Style</label>
                  <div class="flex gap-2">
                    <button type="button" class="sticker-style-pill active" data-style="diecut">White Die-Cut</button>
                    <button type="button" class="sticker-style-pill" data-style="squircle">Squircle</button>
                    <button type="button" class="sticker-style-pill" data-style="circle">Circle</button>
                    <button type="button" class="sticker-style-pill" data-style="transparent">Transparent</button>
                  </div>
                </div>

                <div class="sticker-control-group mt-2">
                  <label class="sticker-control-label">Border Stroke: <span id="strokeVal">6px</span></label>
                  <input type="range" id="stickerBorderRange" min="0" max="14" value="6" class="w-full accent-[#00ff66]">
                </div>

                <div class="sticker-control-group mt-2">
                  <label class="sticker-control-label">Meme Caption / Text (Optional)</label>
                  <input type="text" id="stickerCaptionInput" class="sticker-text-input" placeholder="e.g. GG, NO WAY, APPROVED" maxlength="24">
                </div>

                <div class="sticker-control-group mt-2">
                  <label class="sticker-control-label">Sticker Audio / Sound Effect</label>
                  <div style="display:flex;gap:6px;align-items:center;">
                    <select id="stickerSoundPresetSelect" class="sticker-text-input" style="flex:1;">
                      <option value="none">No Audio</option>
                      <option value="bass_drop">Bass Drop</option>
                      <option value="sci_fi_chime">Sci-Fi Chime</option>
                      <option value="laser_zap">Laser Zap</option>
                      <option value="applause_burst">Applause Burst</option>
                      <option value="pop_laugh">Pop Laugh</option>
                      <option value="hype_siren">Hype Siren</option>
                    </select>
                    <label class="sticker-style-pill" style="cursor:pointer;white-space:nowrap;" title="Attach custom audio file">
                      <i class="fa-solid fa-music"></i> MP3/WAV
                      <input type="file" id="stickerAudioInput" accept="audio/*" style="display:none;" />
                    </label>
                    <button type="button" id="stickerTestSoundBtn" class="sticker-style-pill" title="Preview Sound"><i class="fa-solid fa-volume-high"></i></button>
                  </div>
                </div>

                <div class="sticker-studio-actions mt-4 flex gap-2">
                  <button type="button" id="saveStickerToDeviceBtn" class="sticker-action-primary flex-1">
                    <i class="fa-solid fa-floppy-disk"></i> Save to My Stickers
                  </button>
                  <button type="button" id="sendStickerDirectBtn" class="sticker-action-send">
                    <i class="fa-solid fa-paper-plane"></i> Send Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(creatorModal);
      }
    }

    attachEvents() {
      // Open sticker button on input bar
      const openBtn = document.getElementById('sticker-btn');
      if (openBtn) {
        openBtn.addEventListener('click', () => this.openStoreModal());
      }

      // Close store modal
      const storeModalEl = document.getElementById('stickerStoreModal');
      if (storeModalEl) {
        storeModalEl.addEventListener('click', (e) => {
          if (e.target === storeModalEl) this.closeStoreModal();
        });
      }
      const closeStoreBtn = document.getElementById('closeStickerStoreBtn');
      if (closeStoreBtn) {
        closeStoreBtn.addEventListener('click', () => this.closeStoreModal());
      }

      // Open creator from store modal
      const openCreatorBtn = document.getElementById('openStickerCreatorBtn');
      if (openCreatorBtn) {
        openCreatorBtn.addEventListener('click', () => {
          this.closeStoreModal();
          this.openStudioModal();
        });
      }

      // Close creator modal
      const closeStudioBtn = document.getElementById('closeStickerStudioBtn');
      if (closeStudioBtn) {
        closeStudioBtn.addEventListener('click', () => this.closeStudioModal());
      }

      // Tab switcher
      const tabs = document.querySelectorAll('.sticker-tab-pill');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.activePack = tab.getAttribute('data-pack');
          this.renderPack(this.activePack);
        });
      });

      // Canvas Studio bindings
      this.bindStudioEvents();
    }

    openStoreModal() {
      const modal = document.getElementById('stickerStoreModal');
      if (modal) {
        modal.style.display = 'flex';
        this.renderPack(this.activePack || 'my_stickers');
      }
    }

    closeStoreModal() {
      const modal = document.getElementById('stickerStoreModal');
      if (modal) modal.style.display = 'none';
    }

    openStudioModal() {
      const modal = document.getElementById('stickerStudioModal');
      if (modal) {
        modal.style.display = 'flex';
        this.drawDefaultStudioCanvas();
      }
    }

    closeStudioModal() {
      const modal = document.getElementById('stickerStudioModal');
      if (modal) modal.style.display = 'none';
    }

    async renderPack(packId) {
      const grid = document.getElementById('stickerGridContainer');
      if (!grid) return;
      grid.innerHTML = '';

      if (packId === 'my_stickers') {
        const customStickers = await this.getCustomStickers();

        // Create Sticker Tile Card
        const addCard = document.createElement('div');
        addCard.className = 'sticker-tile-add-card';
        addCard.innerHTML = `
          <i class="fa-solid fa-plus text-2xl text-[#00ff66] mb-1"></i>
          <span>Create Sticker</span>
        `;
        addCard.addEventListener('click', () => {
          this.closeStoreModal();
          this.openStudioModal();
        });
        grid.appendChild(addCard);

        if (customStickers.length === 0) {
          const emptyMsg = document.createElement('div');
          emptyMsg.className = 'sticker-empty-pack-message';
          emptyMsg.innerHTML = `
            <i class="fa-solid fa-wand-magic-sparkles text-3xl text-gray-500 mb-2"></i>
            <strong class="text-white text-sm block">No Custom Stickers Yet</strong>
            <span class="text-xs text-gray-400">Click "Create Sticker" above to turn any photo into a WhatsApp-style sticker!</span>
          `;
          grid.appendChild(emptyMsg);
          return;
        }

        customStickers.forEach(s => {
          const tile = document.createElement('div');
          tile.className = 'sticker-tile-item';
          tile.style.position = 'relative';
          tile.title = `${s.name || 'Custom Sticker'} (Click to send)`;

          if (s.isVideoSticker) {
            const vid = document.createElement('video');
            vid.src = s.dataUrl;
            vid.autoplay = true;
            vid.loop = true;
            vid.muted = true;
            vid.playsInline = true;
            vid.className = 'sticker-tile-video';
            tile.appendChild(vid);
            const vBadge = document.createElement('span');
            vBadge.className = 'sticker-tile-video-badge';
            vBadge.textContent = 'VIDEO';
            tile.appendChild(vBadge);
          } else {
            const img = document.createElement('img');
            img.src = s.dataUrl;
            img.className = 'sticker-tile-img';
            tile.appendChild(img);
          }

          if (s.hasAudio || s.audioUrl || (s.soundPreset && s.soundPreset !== 'none') || s.isVideoSticker) {
            const aBadge = document.createElement('span');
            aBadge.className = 'sticker-tile-audio-badge';
            aBadge.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            tile.appendChild(aBadge);
          }

          // Delete sticker icon
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'sticker-tile-del-btn';
          delBtn.title = 'Delete sticker';
          delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
          delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Delete this custom sticker from device?')) {
              await this.deleteCustomSticker(s.id);
              this.renderPack('my_stickers');
            }
          });
          tile.appendChild(delBtn);

          tile.addEventListener('click', () => {
            this.sendStickerToChat(s.dataUrl, s.name || 'Sticker', {
              isVideoSticker: Boolean(s.isVideoSticker),
              mimeType: s.mimeType,
              hasAudio: Boolean(s.hasAudio || s.audioUrl || (s.soundPreset && s.soundPreset !== 'none') || s.isVideoSticker),
              audioUrl: s.audioUrl || null,
              soundPreset: s.soundPreset || null
            });
            this.closeStoreModal();
          });

          grid.appendChild(tile);
        });
        return;
      }

      if (packId === 'video_sound') {
        const uploadCard = document.createElement('div');
        uploadCard.className = 'sticker-tile-add-card';
        uploadCard.innerHTML = `
          <i class="fa-solid fa-film text-2xl text-[#00d4ff] mb-1"></i>
          <span>Add Video/Audio</span>
        `;
        uploadCard.addEventListener('click', () => {
          this.closeStoreModal();
          this.openStudioModal();
        });
        grid.appendChild(uploadCard);
      }

      // Preset Pack rendering
      const pack = PRESET_PACKS.find(p => p.id === packId);
      if (!pack) return;

      pack.stickers.forEach(s => {
        const tile = document.createElement('div');
        tile.className = 'sticker-tile-item';
        tile.style.position = 'relative';
        tile.title = `${s.name} (Click to send)`;

        const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(s.svg)}`;
        const img = document.createElement('img');
        img.src = dataUrl;
        img.className = 'sticker-tile-img';
        tile.appendChild(img);

        if (s.soundPreset || s.audioUrl) {
          const aBadge = document.createElement('span');
          aBadge.className = 'sticker-tile-audio-badge';
          aBadge.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
          tile.appendChild(aBadge);
        }
        if (s.isAnimated) {
          const mBadge = document.createElement('span');
          mBadge.className = 'sticker-tile-video-badge';
          mBadge.textContent = 'LIVE';
          tile.appendChild(mBadge);
        }

        tile.addEventListener('click', () => {
          const meta = {
            isVideoSticker: false,
            hasAudio: Boolean(s.soundPreset || s.audioUrl),
            soundPreset: s.soundPreset || null,
            audioUrl: s.audioUrl || null
          };
          if (meta.hasAudio) playNexStickerAudio(meta);
          this.sendStickerToChat(dataUrl, s.name, meta);
          this.closeStoreModal();
        });

        grid.appendChild(tile);
      });
    }

    // ─── 3. Canvas Sticker Studio Implementation ───
    bindStudioEvents() {
      const dropzone = document.getElementById('stickerDropzone');
      const fileInput = document.getElementById('stickerImageInput');
      const borderRange = document.getElementById('stickerBorderRange');
      const strokeVal = document.getElementById('strokeVal');
      const captionInput = document.getElementById('stickerCaptionInput');
      const stylePills = document.querySelectorAll('.sticker-style-pill');
      const saveBtn = document.getElementById('saveStickerToDeviceBtn');
      const sendBtn = document.getElementById('sendStickerDirectBtn');

      this.studioImage = null;
      this.studioVideoFile = null;
      this.studioVideoPreviewUrl = null;
      this.studioAudioFile = null;
      this.studioAudioUrl = null;
      this.studioSoundPreset = 'none';
      this.studioStyle = 'diecut';
      this.studioBorderWidth = 6;
      this.studioCaption = '';

      const soundSelect = document.getElementById('stickerSoundPresetSelect');
      const audioInput = document.getElementById('stickerAudioInput');
      const testSoundBtn = document.getElementById('stickerTestSoundBtn');

      soundSelect?.addEventListener('change', () => {
        this.studioSoundPreset = soundSelect.value || 'none';
      });
      audioInput?.addEventListener('change', async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        this.studioAudioFile = f;
        this.studioAudioUrl = URL.createObjectURL(f);
        if (soundSelect) soundSelect.value = 'sci_fi_chime';
        if (window.showNotif) window.showNotif(`Audio "${f.name}" attached to sticker!`, 'success', 1800);
      });
      testSoundBtn?.addEventListener('click', () => {
        playNexStickerAudio({
          audioUrl: this.studioAudioUrl,
          soundPreset: this.studioSoundPreset !== 'none' ? this.studioSoundPreset : 'sci_fi_chime'
        });
      });

      if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            this.loadStudioImage(e.dataTransfer.files[0]);
          }
        });
        fileInput.addEventListener('change', () => {
          if (fileInput.files && fileInput.files[0]) {
            this.loadStudioImage(fileInput.files[0]);
          }
        });
      }

      if (borderRange && strokeVal) {
        borderRange.addEventListener('input', () => {
          this.studioBorderWidth = parseInt(borderRange.value, 10);
          strokeVal.textContent = `${this.studioBorderWidth}px`;
          this.redrawStudioCanvas();
        });
      }

      if (captionInput) {
        captionInput.addEventListener('input', () => {
          this.studioCaption = captionInput.value.toUpperCase();
          this.redrawStudioCanvas();
        });
      }

      stylePills.forEach(pill => {
        pill.addEventListener('click', () => {
          stylePills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.studioStyle = pill.getAttribute('data-style');
          this.redrawStudioCanvas();
        });
      });

      const buildStudioStickerPayload = async () => {
        let finalAudioUrl = null;
        if (this.studioAudioFile) {
          try {
            if (typeof window.uploadAnyMedia === 'function') {
              const res = await window.uploadAnyMedia(this.studioAudioFile, { folder: 'sticker-audio', uid: window.myUID });
              finalAudioUrl = res?.url || res?.downloadUrl || null;
            }
          } catch (_) {}
          if (!finalAudioUrl && this.studioAudioFile.size <= 350 * 1024) {
            finalAudioUrl = await new Promise((resolve) => {
              const r = new FileReader();
              r.onload = (ev) => resolve(ev.target.result);
              r.readAsDataURL(this.studioAudioFile);
            });
          }
        }

        if (this.studioVideoFile) {
          let videoUrl = null;
          try {
            if (typeof window.uploadAnyMedia === 'function') {
              const res = await window.uploadAnyMedia(this.studioVideoFile, { folder: 'video-stickers', uid: window.myUID });
              videoUrl = res?.url || res?.downloadUrl || null;
            }
          } catch (_) {}
          if (!videoUrl && this.studioVideoFile.size <= 700 * 1024) {
            videoUrl = await new Promise((resolve) => {
              const r = new FileReader();
              r.onload = (ev) => resolve(ev.target.result);
              r.readAsDataURL(this.studioVideoFile);
            });
          } else if (!videoUrl) {
            videoUrl = this.studioVideoPreviewUrl;
          }
          return {
            dataUrl: videoUrl,
            isVideoSticker: true,
            mimeType: this.studioVideoFile.type || 'video/mp4',
            hasAudio: Boolean(finalAudioUrl || this.studioSoundPreset !== 'none' || true),
            audioUrl: finalAudioUrl,
            soundPreset: this.studioSoundPreset !== 'none' ? this.studioSoundPreset : null
          };
        }

        const canvas = document.getElementById('stickerStudioCanvas');
        const dataUrl = canvas ? canvas.toDataURL('image/webp', 0.95) : '';
        return {
          dataUrl,
          isVideoSticker: false,
          mimeType: 'image/webp',
          hasAudio: Boolean(finalAudioUrl || this.studioSoundPreset !== 'none'),
          audioUrl: finalAudioUrl,
          soundPreset: this.studioSoundPreset !== 'none' ? this.studioSoundPreset : null
        };
      };

      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          const payload = await buildStudioStickerPayload();
          if (!payload.dataUrl) return;
          const newSticker = {
            id: 'stk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: this.studioCaption || (payload.isVideoSticker ? 'Video Sticker' : 'Custom Sticker'),
            pack: 'my_stickers',
            dataUrl: payload.dataUrl,
            isVideoSticker: payload.isVideoSticker,
            mimeType: payload.mimeType,
            hasAudio: payload.hasAudio,
            audioUrl: payload.audioUrl,
            soundPreset: payload.soundPreset,
            createdAt: Date.now()
          };
          await this.saveCustomSticker(newSticker);
          if (window.showNotif) window.showNotif('Sticker saved to your device collection!', 'success');
          this.closeStudioModal();
          this.openStoreModal();
        });
      }

      if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
          const payload = await buildStudioStickerPayload();
          if (!payload.dataUrl) return;
          this.sendStickerToChat(payload.dataUrl, this.studioCaption || (payload.isVideoSticker ? 'Video Sticker' : 'Custom Sticker'), payload);
          this.closeStudioModal();
        });
      }
    }

    loadStudioImage(file) {
      if (!file) return;
      const canvas = document.getElementById('stickerStudioCanvas');
      const vidPrev = document.getElementById('stickerStudioVideoPreview');
      const isVideo = (file.type && file.type.startsWith('video/')) || /\.(mp4|webm|mov)$/i.test(file.name || '');

      if (isVideo) {
        this.studioVideoFile = file;
        this.studioImage = null;
        if (this.studioVideoPreviewUrl) {
          try { URL.revokeObjectURL(this.studioVideoPreviewUrl); } catch (_) {}
        }
        this.studioVideoPreviewUrl = URL.createObjectURL(file);
        if (canvas) canvas.style.display = 'none';
        if (vidPrev) {
          vidPrev.src = this.studioVideoPreviewUrl;
          vidPrev.muted = false;
          vidPrev.style.display = 'block';
          vidPrev.play().catch(() => { vidPrev.muted = true; vidPrev.play().catch(() => {}); });
        }
        return;
      }

      this.studioVideoFile = null;
      if (vidPrev) {
        vidPrev.pause();
        vidPrev.style.display = 'none';
      }
      if (canvas) canvas.style.display = 'block';

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.studioImage = img;
          this.redrawStudioCanvas();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    drawDefaultStudioCanvas() {
      const canvas = document.getElementById('stickerStudioCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Default sample sticker if none loaded yet
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(180, 180, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.restore();

      ctx.font = '900 32px Impact, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      ctx.textAlign = 'center';
      ctx.strokeText('DROP PHOTO HERE', 180, 175);
      ctx.fillText('DROP PHOTO HERE', 180, 175);

      ctx.font = '700 16px Inter, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('Turn any picture into a sticker!', 180, 210);
    }

    redrawStudioCanvas() {
      const canvas = document.getElementById('stickerStudioCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!this.studioImage) {
        this.drawDefaultStudioCanvas();
        return;
      }

      const img = this.studioImage;
      const size = 320;
      const x = 20;
      const y = 20;

      ctx.save();

      // Shadow for realistic WhatsApp sticker appearance
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;

      if (this.studioStyle === 'circle') {
        ctx.beginPath();
        ctx.arc(180, 180, 140, 0, Math.PI * 2);
        if (this.studioBorderWidth > 0) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = this.studioBorderWidth * 2;
          ctx.stroke();
        }
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
      } else if (this.studioStyle === 'squircle') {
        const r = 40;
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, r);
        if (this.studioBorderWidth > 0) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = this.studioBorderWidth * 2;
          ctx.stroke();
        }
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
      } else {
        // Die-cut outline style / transparent
        if (this.studioBorderWidth > 0) {
          // Die-cut border: Draw image multiple times offset in white to generate outline
          const offCanvas = document.createElement('canvas');
          offCanvas.width = canvas.width;
          offCanvas.height = canvas.height;
          const offCtx = offCanvas.getContext('2d');
          offCtx.drawImage(img, x, y, size, size);

          // Apply silhouette stroke
          ctx.save();
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = this.studioBorderWidth * 2;
          ctx.drawImage(offCanvas, 0, 0);
          ctx.drawImage(offCanvas, 0, 0);
          ctx.restore();
        }
        ctx.drawImage(img, x, y, size, size);
      }

      ctx.restore();

      // Meme Caption overlay
      if (this.studioCaption) {
        ctx.save();
        ctx.font = '900 36px Impact, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;

        const captionY = 320;
        ctx.strokeText(this.studioCaption, 180, captionY);
        ctx.fillText(this.studioCaption, 180, captionY);
        ctx.restore();
      }
    }

    // ─── 4. Send Sticker into Chat ───
    sendStickerToChat(stickerUrl, stickerName, stickerMeta = {}) {
      if (typeof window.dispatchStickerMessage === 'function') {
        window.dispatchStickerMessage(stickerUrl, stickerName, stickerMeta);
      } else if (typeof window.sendMessage === 'function') {
        // Fallback: Set attachment as sticker
        window.selectedFile = null;
        const input = document.getElementById('message-input');
        if (input) input.value = '';
        
        // Dispatch synthetic event or direct call
        const event = new CustomEvent('nex_send_sticker', {
          detail: { url: stickerUrl, name: stickerName, meta: stickerMeta }
        });
        window.dispatchEvent(event);
      }
      if (navigator.vibrate) navigator.vibrate(25);
    }
  }

  // Export to global scope
  window.nexStickerStore = new NexStickerStore();
})();
