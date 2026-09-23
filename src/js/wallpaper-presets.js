/**
 * Authentic Chat & Group Wallpaper System for NEXCHAT
 * Provides iconic encrypted doodle patterns, cyber themes, custom Vercel Blob uploads,
 * and scope management (Per-Chat vs Global Default).
 */

import { doc, setDoc, updateDoc, serverTimestamp, getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// SVG Doodle Pattern Generators (Optimized Data URIs)
// Classic Encrypted Dark Doodle: Authentic chat doodles (bubbles, phones, coffee, paper planes, locks, hearts, stars)
const SVG_DOODLE_CLASSIC = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="340" height="340" viewBox="0 0 340 340"><rect width="340" height="340" fill="%230b141a"/><g fill="none" stroke="%23ffffff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.075"><!-- Chat Bubble --><path d="M30 40h40a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10h-25l-12 10v-10h-3a10 10 0 0 1-10-10v-20a10 10 0 0 1 10-10z"/><circle cx="50" cy="60" r="2" fill="%23fff"/><circle cx="60" cy="60" r="2" fill="%23fff"/><!-- Coffee Cup --><path d="M140 50h25v18a10 10 0 0 1-10 10h-5a10 10 0 0 1-10-10z"/><path d="M165 54h6a5 5 0 0 1 0 10h-6"/><!-- Camera --><rect x="230" y="45" width="34" height="24" rx="4"/><circle cx="247" cy="57" r="6"/><path d="M242 45l2-5h6l2 5"/><!-- Paper Plane --><path d="M30 150l45 15-20 8 10 15 5-10 18-5z"/><!-- Smartphone --><rect x="130" y="130" width="22" height="40" rx="4"/><line x1="138" y1="164" x2="144" y2="164"/><!-- Heart & Stars --><path d="M240 145a5 5 0 0 0-7 7l7 7 7-7a5 5 0 0 0-7-7z"/><path d="M275 130l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/><!-- Lock --><rect x="40" y="240" width="24" height="18" rx="3"/><path d="M46 240v-8a6 6 0 0 1 12 0v8"/><circle cx="52" cy="249" r="2" fill="%23fff"/><!-- Headphone --><path d="M130 250a16 16 0 0 1 32 0v10h-6v-8h6a10 10 0 0 0-20 0v8h-6z"/><!-- Smiley Face --><circle cx="245" cy="245" r="14"/><circle cx="240" cy="242" r="1.5" fill="%23fff"/><circle cx="250" cy="242" r="1.5" fill="%23fff"/><path d="M239 250a6 6 0 0 0 12 0"/><!-- Robot / Rocket --><path d="M90 300l10-15 10 15-4-2v6h-12v-6z"/><path d="M190 310h20v-10h-20z"/><circle cx="196" cy="305" r="1.5" fill="%23fff"/><circle cx="204" cy="305" r="1.5" fill="%23fff"/></g></svg>`;

// Cyber Emerald Doodle: NEXCHAT neon signature emerald green doodle theme
const SVG_DOODLE_EMERALD = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="340" height="340" viewBox="0 0 340 340"><rect width="340" height="340" fill="%23060c11"/><g fill="none" stroke="%2300ff88" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" opacity="0.14"><!-- Terminal Prompt --><rect x="25" y="35" width="46" height="30" rx="5"/><path d="M33 46l6 4-6 4"/><line x1="43" y1="54" x2="52" y2="54"/><!-- Shield --><path d="M140 40l16-6 16 6v14c0 10-16 18-16 18s-16-8-16-18z"/><!-- WiFi Signal --><path d="M235 55a16 16 0 0 1 24 0"/><path d="M240 60a9 9 0 0 1 14 0"/><circle cx="247" cy="65" r="1.5" fill="%2300ff88"/><!-- Lightning Bolt --><path d="M45 130l-12 18h10l-4 18 16-22h-10z"/><!-- CPU Chip --><rect x="135" y="135" width="26" height="26" rx="4"/><rect x="140" y="140" width="16" height="16" fill="%2300ff88" opacity="0.2"/><line x1="148" y1="130" x2="148" y2="135"/><line x1="148" y1="161" x2="148" y2="166"/><line x1="130" y1="148" x2="135" y2="148"/><line x1="161" y1="148" x2="166" y2="148"/><!-- Encryption Key --><circle cx="240" cy="145" r="7"/><line x1="247" y1="145" x2="265" y2="145"/><line x1="257" y1="145" x2="257" y2="150"/><line x1="262" y1="145" x2="262" y2="148"/><!-- Gamepad Controller --><path d="M35 245c0-6 4-10 10-10h14c6 0 10 4 10 10v10l-6 10h-6l-4-6-4 6h-6l-6-10z"/><circle cx="60" cy="245" r="1.5" fill="%2300ff88"/><!-- Matrix Cube --><polygon points="148,230 166,240 148,250 130,240"/><polygon points="130,240 148,250 148,270 130,260"/><polygon points="166,240 148,250 148,270 166,260"/><!-- Chat Double Tick --><path d="M235 250l5 5 10-10"/><path d="M243 250l5 5 10-10"/></g></svg>`;

// Matrix Digital Stream (Cyberpunk Green Rain)
const SVG_MATRIX_STREAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280"><rect width="280" height="280" fill="%23050811"/><g fill="%2300ff88" font-family="monospace" font-size="11" opacity="0.12"><text x="20" y="30">0 1 1 0 1</text><text x="20" y="55">1 0 0 1 0</text><text x="20" y="80">0 1 0 1 1</text><text x="20" y="105">N E X C H</text><text x="120" y="45">1 1 0 0 1</text><text x="120" y="70">A E S 2 5</text><text x="120" y="95">6 B I T S</text><text x="120" y="120">0 1 1 0 0</text><text x="200" y="25">E 2 E C R</text><text x="200" y="50">Y P T O K</text><text x="200" y="75">1 0 1 0 1</text><text x="200" y="100">0 0 1 1 0</text><text x="60" y="170">0 1 1 1 0</text><text x="60" y="195">C H A T 1</text><text x="160" y="185">1 0 0 0 1</text><text x="160" y="210">N E U R A</text><text x="220" y="230">0 1 0 1 0</text><text x="100" y="260">1 1 1 0 0</text></g></svg>`;

// Hexagonal Cyber Mesh
const SVG_HEX_MESH = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="104" viewBox="0 0 60 104"><rect width="60" height="104" fill="%23080d1a"/><path d="M30 0l30 17.3v34.7L30 69.3 0 52V17.3zM30 104l30-17.3V52L30 69.3 0 52v34.7z" fill="none" stroke="%2300d4ff" stroke-width="0.8" opacity="0.08"/></svg>`;

// Preset Wallpapers Catalog
export const WALLPAPER_PRESETS = [
  {
    id: 'classic_encrypted_doodle',
    name: 'Classic Encrypted Doodle',
    category: 'Classic',
    type: 'doodle',
    url: SVG_DOODLE_CLASSIC,
    previewBg: '#0b141a',
    accentColor: '#00a884',
    description: 'Iconic authentic dark doodle wallpaper pattern.'
  },
  {
    id: 'cyber_emerald_doodle',
    name: 'Cyber Emerald',
    category: 'Cyberpunk',
    type: 'doodle',
    url: SVG_DOODLE_EMERALD,
    previewBg: '#060c11',
    accentColor: '#00ff88',
    description: 'NEXCHAT signature glowing neon green cyber doodles.'
  },
  {
    id: 'matrix_stream',
    name: 'Matrix Stream',
    category: 'Cyberpunk',
    type: 'pattern',
    url: SVG_MATRIX_STREAM,
    previewBg: '#050811',
    accentColor: '#00ff66',
    description: 'Encrypted green binary data stream.'
  },
  {
    id: 'hex_carbon',
    name: 'Carbon Hex Mesh',
    category: 'Abstract',
    type: 'pattern',
    url: SVG_HEX_MESH,
    previewBg: '#080d1a',
    accentColor: '#00d4ff',
    description: 'High-tech hexagonal carbon mesh.'
  },
  {
    id: 'chronex_ai',
    name: 'Chronex Deep Void',
    category: 'Cosmic',
    type: 'image',
    url: 'chronex-background.jpg',
    previewBg: '#090e1a',
    accentColor: '#00f076',
    description: 'Atmospheric Chronex AI neural galaxy.'
  },
  {
    id: 'solid_slate_dark',
    name: 'Deep Obsidian Slate',
    category: 'Solid',
    type: 'solid',
    url: '',
    solidColor: '#111b21',
    previewBg: '#111b21',
    accentColor: '#00a884',
    description: 'Clean distraction-free dark solid slate.'
  },
  {
    id: 'solid_obsidian',
    name: 'Pure Obsidian',
    category: 'Solid',
    type: 'solid',
    url: '',
    solidColor: '#060912',
    previewBg: '#060912',
    accentColor: '#00ff88',
    description: 'Ultra deep pure black with zero glare.'
  }
];

/**
 * Applies a wallpaper to the active chat screen and messages container.
 * Updates both the master app element and the messages area with transparency classes.
 */
export function applyActiveWallpaper(wallpaperUrl, solidColor = null) {
  const app = document.querySelector('.app');
  const messagesArea = document.getElementById('messages-area');
  const chatDetail = document.getElementById('chatDetailView');

  if (wallpaperUrl) {
    // Wallpaper image/doodle pattern
    if (app) {
      app.style.backgroundImage = `url('${wallpaperUrl}')`;
      app.style.backgroundSize = wallpaperUrl.startsWith('data:image/svg') ? 'auto' : 'cover';
      app.style.backgroundPosition = 'center';
      app.style.backgroundRepeat = wallpaperUrl.startsWith('data:image/svg') ? 'repeat' : 'no-repeat';
      app.style.backgroundColor = 'transparent';
      app.setAttribute('data-custom-bg', 'true');
    }
    if (chatDetail) {
      chatDetail.style.background = 'transparent';
    }
    if (messagesArea) {
      messagesArea.classList.add('has-custom-wallpaper');
      messagesArea.style.backgroundColor = 'rgba(6, 9, 18, 0.45)';
    }
  } else if (solidColor) {
    // Solid color background
    if (app) {
      app.style.backgroundImage = 'none';
      app.style.backgroundColor = solidColor;
      app.setAttribute('data-custom-bg', 'true');
    }
    if (chatDetail) {
      chatDetail.style.backgroundColor = solidColor;
    }
    if (messagesArea) {
      messagesArea.classList.remove('has-custom-wallpaper');
      messagesArea.style.backgroundColor = 'transparent';
    }
  } else {
    // Reset to default app theme
    if (app) {
      app.style.backgroundImage = 'none';
      app.style.backgroundColor = '';
      app.setAttribute('data-custom-bg', 'false');
    }
    if (chatDetail) {
      chatDetail.style.background = '';
    }
    if (messagesArea) {
      messagesArea.classList.remove('has-custom-wallpaper');
      messagesArea.style.backgroundColor = '';
    }
  }
}

/**
 * Saves and applies a wallpaper across Firestore and localStorage.
 */
export async function setWallpaper(wallpaperUrl, scope = 'chat', chatId = null, chatType = 'direct', myUID = null, db = null) {
  applyActiveWallpaper(wallpaperUrl);

  if (scope === 'chat' && chatId) {
    localStorage.setItem(`chat_bg_${chatId}`, wallpaperUrl);
    if (db && myUID) {
      try {
        const coll = chatType === 'group' ? 'groupBackgrounds' : 'directMessageBackgrounds';
        const docId = chatType === 'group' ? chatId : `${myUID}_${chatId}`;
        await setDoc(doc(db, coll, docId), {
          backgroundUrl: wallpaperUrl,
          uploadedAt: serverTimestamp(),
          chatId: chatId,
          chatType: chatType,
          owner: myUID
        }, { merge: true });
      } catch (err) {
        console.warn('[Wallpaper] Firestore sync fallback to local cache:', err);
      }
    }
  } else {
    // Global Default for all chats
    localStorage.setItem('nexchat_background', wallpaperUrl);
    if (db && myUID) {
      try {
        await setDoc(doc(db, 'userBackgrounds', myUID), {
          backgroundUrl: wallpaperUrl,
          uploadedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('[Wallpaper] Global Firestore sync fallback:', err);
      }
    }
  }
}

/**
 * Removes custom wallpaper and restores system default.
 */
export async function removeWallpaper(scope = 'chat', chatId = null, chatType = 'direct', myUID = null, db = null) {
  if (scope === 'chat' && chatId) {
    localStorage.removeItem(`chat_bg_${chatId}`);
    if (db && myUID) {
      try {
        const coll = chatType === 'group' ? 'groupBackgrounds' : 'directMessageBackgrounds';
        const docId = chatType === 'group' ? chatId : `${myUID}_${chatId}`;
        await updateDoc(doc(db, coll, docId), {
          backgroundUrl: null,
          removedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('[Wallpaper] Remove fallback:', err);
      }
    }
    // Revert to global background if set, else system default
    const globalBg = localStorage.getItem('nexchat_background');
    if (globalBg) {
      applyActiveWallpaper(globalBg);
    } else {
      applyActiveWallpaper(null);
    }
  } else {
    // Global remove
    localStorage.removeItem('nexchat_background');
    if (db && myUID) {
      try {
        await updateDoc(doc(db, 'userBackgrounds', myUID), {
          backgroundUrl: null,
          removedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('[Wallpaper] Global remove fallback:', err);
      }
    }
    applyActiveWallpaper(null);
  }
}

/**
 * Initializes and opens the Chat Wallpaper Picker Modal
 */
export function openWallpaperModal(options = {}) {
  const {
    chatId = null,
    chatName = 'Active Chat',
    chatType = 'direct',
    myUID = null,
    db = null,
    onUploadCustom = null,
    showNotif = (msg) => console.log(msg)
  } = options;

  let existingModal = document.getElementById('nexchatWallpaperModal');
  if (existingModal) {
    existingModal.remove();
  }

  const currentChatBg = chatId ? localStorage.getItem(`chat_bg_${chatId}`) : null;
  const currentGlobalBg = localStorage.getItem('nexchat_background');
  let selectedUrl = currentChatBg || currentGlobalBg || WALLPAPER_PRESETS[0].url;
  let selectedScope = chatId ? 'chat' : 'global';

  const modal = document.createElement('div');
  modal.id = 'nexchatWallpaperModal';
  modal.className = 'wallpaper-modal-backdrop';
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(4, 7, 14, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 10050;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: wpFadeIn 0.25s ease forwards;
  `;

  modal.innerHTML = `
    <style>
      @keyframes wpFadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      .wallpaper-card {
        background: #0b111e;
        border: 1px solid rgba(0, 255, 136, 0.25);
        border-radius: 20px;
        width: 100%;
        max-width: 620px;
        max-height: 90vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        box-shadow: 0 24px 60px rgba(0,0,0,0.8), 0 0 35px rgba(0,255,136,0.15);
        font-family: 'Inter', sans-serif;
        color: #f8fafc;
      }
      .wp-header {
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .wp-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #fff;
      }
      .wp-header h3 span { color: #00ff88; }
      .wp-close-btn {
        background: rgba(255,255,255,0.06);
        border: none;
        color: #94a3b8;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .wp-close-btn:hover { background: rgba(255,77,77,0.2); color: #ff5555; }
      .wp-body { padding: 22px 24px; display: flex; flex-direction: column; gap: 20px; }
      .wp-preview-stage {
        border-radius: 14px;
        height: 155px;
        border: 1px solid rgba(255,255,255,0.12);
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 14px 20px;
        gap: 10px;
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
        transition: background 0.3s ease;
      }
      .wp-mock-bubble {
        padding: 8px 14px;
        border-radius: 12px;
        font-size: 12.5px;
        max-width: 75%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      .wp-mock-received { background: #1e293b; color: #f1f5f9; align-self: flex-start; }
      .wp-mock-sent { background: #00a884; color: #fff; align-self: flex-end; font-weight: 500; }
      .wp-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
        gap: 12px;
      }
      .wp-preset-tile {
        height: 80px;
        border-radius: 12px;
        border: 2px solid transparent;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 6px 8px;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .wp-preset-tile:hover { transform: translateY(-2px); border-color: rgba(0,255,136,0.5); }
      .wp-preset-tile.active { border-color: #00ff88; box-shadow: 0 0 16px rgba(0,255,136,0.4); }
      .wp-tile-label {
        font-size: 11px;
        font-weight: 600;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(4px);
        padding: 2px 6px;
        border-radius: 6px;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .wp-upload-tile {
        height: 80px;
        border-radius: 12px;
        border: 2px dashed rgba(0,255,136,0.35);
        background: rgba(0,255,136,0.04);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        cursor: pointer;
        color: #00ff88;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s;
      }
      .wp-upload-tile:hover { background: rgba(0,255,136,0.1); border-color: #00ff88; transform: translateY(-2px); }
      .wp-scope-switch {
        display: flex;
        background: rgba(255,255,255,0.04);
        padding: 4px;
        border-radius: 10px;
        gap: 6px;
        border: 1px solid rgba(255,255,255,0.06);
      }
      .wp-scope-btn {
        flex: 1;
        padding: 8px 12px;
        background: transparent;
        border: none;
        color: #94a3b8;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .wp-scope-btn.active {
        background: rgba(0,255,136,0.15);
        color: #00ff88;
        border: 1px solid rgba(0,255,136,0.3);
      }
      .wp-actions {
        display: flex;
        gap: 12px;
        padding-top: 6px;
      }
      .wp-btn-primary {
        flex: 2;
        padding: 12px 18px;
        background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
        border: none;
        border-radius: 12px;
        color: #030b06;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s;
      }
      .wp-btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
      .wp-btn-danger {
        flex: 1;
        padding: 12px 16px;
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 12px;
        color: #f87171;
        font-weight: 600;
        font-size: 13.5px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .wp-btn-danger:hover { background: rgba(239, 68, 68, 0.25); color: #fff; }
    </style>

    <div class="wallpaper-card" onclick="event.stopPropagation()">
      <div class="wp-header">
        <h3><i class="fa-solid fa-palette"></i> Chat <span>Wallpapers</span></h3>
        <button class="wp-close-btn" id="wpCloseBtn" title="Close"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div class="wp-body">
        <!-- Live Chat Preview -->
        <div>
          <div style="font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Live Preview</div>
          <div id="wpPreviewStage" class="wp-preview-stage">
            <div class="wp-mock-bubble wp-mock-received">
              <span>Hey! Check out this new encrypted doodle wallpaper 🚀</span>
            </div>
            <div class="wp-mock-bubble wp-mock-sent">
              <span>Looks so clean! Encrypted & dark mode ready 🔒</span>
            </div>
          </div>
        </div>

        <!-- Scope Selection (This Chat vs All Chats) -->
        <div>
          <div style="font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Apply To</div>
          <div class="wp-scope-switch">
            <button type="button" class="wp-scope-btn ${selectedScope === 'chat' ? 'active' : ''}" id="wpScopeChatBtn">
              <i class="fa-solid fa-comment"></i> This Chat Only (${chatName})
            </button>
            <button type="button" class="wp-scope-btn ${selectedScope === 'global' ? 'active' : ''}" id="wpScopeGlobalBtn">
              <i class="fa-solid fa-globe"></i> All Chats (Default)
            </button>
          </div>
        </div>

        <!-- Preset Selection Grid -->
        <div>
          <div style="font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Curated Presets</div>
          <div class="wp-grid" id="wpPresetGrid">
            <!-- Upload Custom Card -->
            <label class="wp-upload-tile" for="wpCustomUploadInput" title="Upload custom image to Vercel Blob">
              <i class="fa-solid fa-cloud-arrow-up" style="font-size: 18px;"></i>
              <span>Upload Custom</span>
              <input type="file" id="wpCustomUploadInput" accept="image/*" style="display: none;">
            </label>
            ${WALLPAPER_PRESETS.map((p) => `
              <div class="wp-preset-tile ${p.url === selectedUrl ? 'active' : ''}" data-url="${p.url}" data-solid="${p.solidColor || ''}" style="background-color: ${p.previewBg}; ${p.url ? `background-image: url('${p.url}'); background-size: ${p.url.startsWith('data:image/svg') ? 'auto' : 'cover'};` : ''}">
                <div class="wp-tile-label">${p.name}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="wp-actions">
          <button class="wp-btn-primary" id="wpApplyBtn">
            <i class="fa-solid fa-check"></i> Set Wallpaper
          </button>
          <button class="wp-btn-danger" id="wpRemoveBtn">
            <i class="fa-solid fa-trash-can"></i> Remove
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Update preview stage visually
  function refreshPreview() {
    const stage = document.getElementById('wpPreviewStage');
    if (!stage) return;
    if (selectedUrl) {
      stage.style.backgroundImage = `url('${selectedUrl}')`;
      stage.style.backgroundSize = selectedUrl.startsWith('data:image/svg') ? 'auto' : 'cover';
      stage.style.backgroundPosition = 'center';
      stage.style.backgroundColor = '#0b141a';
    } else {
      stage.style.backgroundImage = 'none';
      stage.style.backgroundColor = '#060912';
    }
  }
  refreshPreview();

  // Scope switcher
  const scopeChatBtn = document.getElementById('wpScopeChatBtn');
  const scopeGlobalBtn = document.getElementById('wpScopeGlobalBtn');
  scopeChatBtn?.addEventListener('click', () => {
    selectedScope = 'chat';
    scopeChatBtn.classList.add('active');
    scopeGlobalBtn.classList.remove('active');
  });
  scopeGlobalBtn?.addEventListener('click', () => {
    selectedScope = 'global';
    scopeGlobalBtn.classList.add('active');
    scopeChatBtn.classList.remove('active');
  });

  // Preset Selection Click Handlers
  document.querySelectorAll('.wp-preset-tile').forEach((tile) => {
    tile.addEventListener('click', () => {
      document.querySelectorAll('.wp-preset-tile').forEach(t => t.classList.remove('active'));
      tile.classList.add('active');
      selectedUrl = tile.dataset.url || '';
      refreshPreview();
    });
  });

  // Custom Upload Handler (Vercel Blob)
  const customInput = document.getElementById('wpCustomUploadInput');
  customInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showNotif('Uploading wallpaper to Vercel Blob...', 'info');

    try {
      if (typeof onUploadCustom === 'function') {
        const url = await onUploadCustom(file);
        if (url) {
          selectedUrl = url;
          refreshPreview();
          showNotif('Wallpaper uploaded! Click "Set Wallpaper" to apply.', 'success');
        }
      } else {
        // Fallback local reader
        const reader = new FileReader();
        reader.onload = (re) => {
          selectedUrl = re.target.result;
          refreshPreview();
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Wallpaper upload failed:', err);
      showNotif('Failed to upload wallpaper: ' + err.message, 'error');
    }
  });

  // Apply Button
  document.getElementById('wpApplyBtn')?.addEventListener('click', async () => {
    await setWallpaper(selectedUrl, selectedScope, chatId, chatType, myUID, db);
    showNotif('✅ Wallpaper applied successfully!', 'success');
    modal.remove();
  });

  // Remove Button
  document.getElementById('wpRemoveBtn')?.addEventListener('click', async () => {
    await removeWallpaper(selectedScope, chatId, chatType, myUID, db);
    showNotif('Default background restored.', 'info');
    modal.remove();
  });

  // Close handlers
  document.getElementById('wpCloseBtn')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}
