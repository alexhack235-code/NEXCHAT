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
    }
  ];

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
              <!-- Left: Canvas Preview Box -->
              <div class="sticker-canvas-wrapper">
                <div class="sticker-checkered-stage">
                  <canvas id="stickerStudioCanvas" width="360" height="360"></canvas>
                </div>
                <span class="text-[11px] text-gray-400 mt-2 text-center block">Real-time Die-Cut Sticker Preview</span>
              </div>

              <!-- Right: Controls & Customization -->
              <div class="sticker-controls-column">
                <div class="sticker-upload-dropzone" id="stickerDropzone">
                  <input type="file" id="stickerImageInput" accept="image/*" style="display: none;">
                  <i class="fa-solid fa-cloud-arrow-up text-2xl text-[#00f2fe] mb-1"></i>
                  <strong class="text-white text-xs block">Choose or Drop Image</strong>
                  <span class="text-[10px] text-gray-400">PNG, JPG, WebP, GIF supported</span>
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
          tile.title = `${s.name || 'Custom Sticker'} (Click to send)`;

          const img = document.createElement('img');
          img.src = s.dataUrl;
          img.className = 'sticker-tile-img';
          tile.appendChild(img);

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
            this.sendStickerToChat(s.dataUrl, s.name || 'Sticker');
            this.closeStoreModal();
          });

          grid.appendChild(tile);
        });
        return;
      }

      // Preset Pack rendering
      const pack = PRESET_PACKS.find(p => p.id === packId);
      if (!pack) return;

      pack.stickers.forEach(s => {
        const tile = document.createElement('div');
        tile.className = 'sticker-tile-item';
        tile.title = `${s.name} (Click to send)`;

        const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(s.svg)}`;
        const img = document.createElement('img');
        img.src = dataUrl;
        img.className = 'sticker-tile-img';
        tile.appendChild(img);

        tile.addEventListener('click', () => {
          this.sendStickerToChat(dataUrl, s.name);
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
      this.studioStyle = 'diecut';
      this.studioBorderWidth = 6;
      this.studioCaption = '';

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

      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          const canvas = document.getElementById('stickerStudioCanvas');
          if (!canvas) return;
          const dataUrl = canvas.toDataURL('image/webp', 0.95);
          const newSticker = {
            id: 'stk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: this.studioCaption || 'Custom Sticker',
            pack: 'my_stickers',
            dataUrl: dataUrl,
            createdAt: Date.now()
          };
          await this.saveCustomSticker(newSticker);
          if (window.showNotif) window.showNotif('Sticker saved to your device collection!', 'success');
          this.closeStudioModal();
          this.openStoreModal();
        });
      }

      if (sendBtn) {
        sendBtn.addEventListener('click', () => {
          const canvas = document.getElementById('stickerStudioCanvas');
          if (!canvas) return;
          const dataUrl = canvas.toDataURL('image/webp', 0.95);
          this.sendStickerToChat(dataUrl, this.studioCaption || 'Custom Sticker');
          this.closeStudioModal();
        });
      }
    }

    loadStudioImage(file) {
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
    sendStickerToChat(stickerUrl, stickerName) {
      if (typeof window.dispatchStickerMessage === 'function') {
        window.dispatchStickerMessage(stickerUrl, stickerName);
      } else if (typeof window.sendMessage === 'function') {
        // Fallback: Set attachment as sticker
        window.selectedFile = null;
        const input = document.getElementById('message-input');
        if (input) input.value = '';
        
        // Dispatch synthetic event or direct call
        const event = new CustomEvent('nex_send_sticker', {
          detail: { url: stickerUrl, name: stickerName }
        });
        window.dispatchEvent(event);
      }
      if (navigator.vibrate) navigator.vibrate(25);
    }
  }

  // Export to global scope
  window.nexStickerStore = new NexStickerStore();
})();
