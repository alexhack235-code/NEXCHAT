/**
 * Authentic Chat & Group Wallpaper System for NEXCHAT
 * Provides iconic encrypted doodle patterns, cyber themes, high-res Vercel Blob genre themes,
 * custom multi-vault uploads, and scope management (Per-Chat vs Global Default).
 */

import { doc, setDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { uploadImageToCloudinary } from './cloudinary.js';
import { VERCEL_BLOB_WALLPAPERS } from './wallpapers-catalog.js';

/**
 * Escapes HTML special characters to prevent template injection / XSS.
 */
function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// SVG Doodle Pattern Generators (Optimized Data URIs)
const SVG_DOODLE_CLASSIC = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="340" height="340" viewBox="0 0 340 340"><rect width="340" height="340" fill="%230b141a"/><g fill="none" stroke="%23ffffff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.075"><path d="M30 40h40a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10h-25l-12 10v-10h-3a10 10 0 0 1-10-10v-20a10 10 0 0 1 10-10z"/><circle cx="50" cy="60" r="2" fill="%23fff"/><circle cx="60" cy="60" r="2" fill="%23fff"/><path d="M140 50h25v18a10 10 0 0 1-10 10h-5a10 10 0 0 1-10-10z"/><path d="M165 54h6a5 5 0 0 1 0 10h-6"/><rect x="230" y="45" width="34" height="24" rx="4"/><circle cx="247" cy="57" r="6"/><path d="M242 45l2-5h6l2 5"/><path d="M30 150l45 15-20 8 10 15 5-10 18-5z"/><rect x="130" y="130" width="22" height="40" rx="4"/><line x1="138" y1="164" x2="144" y2="164"/><path d="M240 145a5 5 0 0 0-7 7l7 7 7-7a5 5 0 0 0-7-7z"/><path d="M275 130l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/><rect x="40" y="240" width="24" height="18" rx="3"/><path d="M46 240v-8a6 6 0 0 1 12 0v8"/><circle cx="52" cy="249" r="2" fill="%23fff"/><path d="M130 250a16 16 0 0 1 32 0v10h-6v-8h6a10 10 0 0 0-20 0v8h-6z"/><circle cx="245" cy="245" r="14"/><circle cx="240" cy="242" r="1.5" fill="%23fff"/><circle cx="250" cy="242" r="1.5" fill="%23fff"/><path d="M239 250a6 6 0 0 0 12 0"/><path d="M90 300l10-15 10 15-4-2v6h-12v-6z"/><path d="M190 310h20v-10h-20z"/><circle cx="196" cy="305" r="1.5" fill="%23fff"/><circle cx="204" cy="305" r="1.5" fill="%23fff"/></g></svg>`;

const SVG_DOODLE_EMERALD = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="340" height="340" viewBox="0 0 340 340"><rect width="340" height="340" fill="%23060c11"/><g fill="none" stroke="%2300ff88" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" opacity="0.14"><rect x="25" y="35" width="46" height="30" rx="5"/><path d="M33 46l6 4-6 4"/><line x1="43" y1="54" x2="52" y2="54"/><path d="M140 40l16-6 16 6v14c0 10-16 18-16 18s-16-8-16-18z"/><path d="M235 55a16 16 0 0 1 24 0"/><path d="M240 60a9 9 0 0 1 14 0"/><circle cx="247" cy="65" r="1.5" fill="%2300ff88"/><path d="M45 130l-12 18h10l-4 18 16-22h-10z"/><rect x="135" y="135" width="26" height="26" rx="4"/><rect x="140" y="140" width="16" height="16" fill="%2300ff88" opacity="0.2"/><line x1="148" y1="130" x2="148" y2="135"/><line x1="148" y1="161" x2="148" y2="166"/><line x1="130" y1="148" x2="135" y2="148"/><line x1="161" y1="148" x2="166" y2="148"/><circle cx="240" cy="145" r="7"/><line x1="247" y1="145" x2="265" y2="145"/><line x1="257" y1="145" x2="257" y2="150"/><line x1="262" y1="145" x2="262" y2="148"/><path d="M35 245c0-6 4-10 10-10h14c6 0 10 4 10 10v10l-6 10h-6l-4-6-4 6h-6l-6-10z"/><circle cx="60" cy="245" r="1.5" fill="%2300ff88"/><polygon points="148,230 166,240 148,250 130,240"/><polygon points="130,240 148,250 148,270 130,260"/><polygon points="166,240 148,250 148,270 166,260"/><path d="M235 250l5 5 10-10"/><path d="M243 250l5 5 10-10"/></g></svg>`;

const SVG_MATRIX_STREAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280"><rect width="280" height="280" fill="%23050811"/><g fill="%2300ff88" font-family="monospace" font-size="11" opacity="0.12"><text x="20" y="30">0 1 1 0 1</text><text x="20" y="55">1 0 0 1 0</text><text x="20" y="80">0 1 0 1 1</text><text x="20" y="105">N E X C H</text><text x="120" y="45">1 1 0 0 1</text><text x="120" y="70">A E S 2 5</text><text x="120" y="95">6 B I T S</text><text x="120" y="120">0 1 1 0 0</text><text x="200" y="25">E 2 E C R</text><text x="200" y="50">Y P T O K</text><text x="200" y="75">1 0 1 0 1</text><text x="200" y="100">0 0 1 1 0</text><text x="60" y="170">0 1 1 1 0</text><text x="60" y="195">C H A T 1</text><text x="160" y="185">1 0 0 0 1</text><text x="160" y="210">N E U R A</text><text x="220" y="230">0 1 0 1 0</text><text x="100" y="260">1 1 1 0 0</text></g></svg>`;

const SVG_HEX_MESH = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="104" viewBox="0 0 60 104"><rect width="60" height="104" fill="%23080d1a"/><path d="M30 0l30 17.3v34.7L30 69.3 0 52V17.3zM30 104l30-17.3V52L30 69.3 0 52v34.7z" fill="none" stroke="%2300d4ff" stroke-width="0.8" opacity="0.08"/></svg>`;

// Classic Doodle & Solid Color Presets
export const CLASSIC_PRESETS = [
  {
    id: 'classic_encrypted_doodle',
    name: 'Classic Encrypted Doodle',
    genre: 'doodles',
    category: 'Doodles & Solids',
    type: 'doodle',
    url: SVG_DOODLE_CLASSIC,
    thumbnailUrl: SVG_DOODLE_CLASSIC,
    previewBg: '#0b141a',
    accentColor: '#00a884',
    description: 'Iconic authentic dark doodle wallpaper pattern.'
  },
  {
    id: 'cyber_emerald_doodle',
    name: 'Cyber Emerald',
    genre: 'doodles',
    category: 'Doodles & Solids',
    type: 'doodle',
    url: SVG_DOODLE_EMERALD,
    thumbnailUrl: SVG_DOODLE_EMERALD,
    previewBg: '#060c11',
    accentColor: '#00ff88',
    description: 'NEXCHAT signature glowing neon green cyber doodles.'
  },
  {
    id: 'matrix_stream',
    name: 'Matrix Stream',
    genre: 'doodles',
    category: 'Doodles & Solids',
    type: 'pattern',
    url: SVG_MATRIX_STREAM,
    thumbnailUrl: SVG_MATRIX_STREAM,
    previewBg: '#050811',
    accentColor: '#00ff66',
    description: 'Encrypted green binary data stream.'
  },
  {
    id: 'hex_carbon',
    name: 'Carbon Hex Mesh',
    genre: 'doodles',
    category: 'Doodles & Solids',
    type: 'pattern',
    url: SVG_HEX_MESH,
    thumbnailUrl: SVG_HEX_MESH,
    previewBg: '#080d1a',
    accentColor: '#00d4ff',
    description: 'High-tech hexagonal carbon mesh.'
  },
  {
    id: 'chronex_ai',
    name: 'Chronex Deep Void',
    genre: 'doodles',
    category: 'Doodles & Solids',
    type: 'image',
    url: 'chronex-background.jpg',
    thumbnailUrl: 'chronex-background.jpg',
    previewBg: '#090e1a',
    accentColor: '#00f076',
    description: 'Atmospheric Chronex AI neural galaxy.'
  },
  {
    id: 'solid_slate_dark',
    name: 'Deep Obsidian Slate',
    genre: 'doodles',
    category: 'Doodles & Solids',
    type: 'solid',
    url: '',
    thumbnailUrl: '',
    solidColor: '#111b21',
    previewBg: '#111b21',
    accentColor: '#00a884',
    description: 'Clean distraction-free dark solid slate.'
  },
  {
    id: 'solid_obsidian',
    name: 'Pure Obsidian',
    genre: 'doodles',
    category: 'Doodles & Solids',
    type: 'solid',
    url: '',
    thumbnailUrl: '',
    solidColor: '#060912',
    previewBg: '#060912',
    accentColor: '#00ff88',
    description: 'Ultra deep pure black with zero glare.'
  }
];

// Combined Wallpaper Catalog (76 High-Res Vercel Blob Themes + 7 Classics = 83 Total)
export const WALLPAPER_PRESETS = [
  ...CLASSIC_PRESETS,
  ...(Array.isArray(VERCEL_BLOB_WALLPAPERS) ? VERCEL_BLOB_WALLPAPERS : [])
];

/**
 * Filter presets array to sanitize against unsafe injection strings
 */
export const SAFE_WALLPAPER_PRESETS = WALLPAPER_PRESETS.filter(p => {
  if (!p) return false;
  const str = `${p.id || ''} ${p.name || ''} ${p.url || ''}`;
  return !str.includes("');") && !str.includes('--') && !str.includes('<script');
});

/**
 * Applies a wallpaper to the active chat screen and messages container.
 */
export function applyActiveWallpaper(wallpaperUrl, solidColor = null) {
  const app = document.querySelector('.app');
  const messagesArea = document.getElementById('messages-area');
  const chatDetail = document.getElementById('chatDetailView');

  if (wallpaperUrl) {
    const isSvg = String(wallpaperUrl).startsWith('data:image/svg');
    const bgSize = isSvg ? 'auto' : '100% 100%';
    const bgRepeat = isSvg ? 'repeat' : 'no-repeat';

    if (app) {
      app.style.backgroundImage = `url('${wallpaperUrl}')`;
      app.style.backgroundSize = bgSize;
      app.style.backgroundPosition = 'center center';
      app.style.backgroundRepeat = bgRepeat;
      app.style.backgroundColor = 'transparent';
      app.setAttribute('data-custom-bg', 'true');
    }
    document.documentElement.style.setProperty('--chat-wallpaper', `url('${wallpaperUrl}')`);
    try { localStorage.setItem('nexchat_background', wallpaperUrl); } catch (_) {}
    if (chatDetail) {
      chatDetail.style.backgroundImage = `url('${wallpaperUrl}')`;
      chatDetail.style.backgroundSize = bgSize;
      chatDetail.style.backgroundPosition = 'center center';
      chatDetail.style.backgroundRepeat = bgRepeat;
      chatDetail.style.backgroundColor = 'transparent';
      chatDetail.classList.add('has-custom-wallpaper', 'chat-background');
      if (isSvg) chatDetail.setAttribute('data-wallpaper-type', 'svg');
      else chatDetail.removeAttribute('data-wallpaper-type');
    }
    if (messagesArea) {
      messagesArea.classList.add('has-custom-wallpaper');
      messagesArea.style.backgroundImage = 'none'; // allow chatDetail full-frame wallpaper to show through cleanly
      messagesArea.style.backgroundColor = 'rgba(6, 9, 18, 0.35)';
    }
  } else if (solidColor) {
    if (app) {
      app.style.backgroundImage = 'none';
      app.style.backgroundColor = solidColor;
      app.setAttribute('data-custom-bg', 'true');
    }
    if (chatDetail) {
      chatDetail.style.backgroundImage = 'none';
      chatDetail.style.backgroundColor = solidColor;
      chatDetail.classList.remove('has-custom-wallpaper');
      chatDetail.removeAttribute('data-wallpaper-type');
    }
    if (messagesArea) {
      messagesArea.classList.remove('has-custom-wallpaper');
      messagesArea.style.backgroundImage = 'none';
      messagesArea.style.backgroundColor = 'transparent';
    }
  } else {
    if (app) {
      app.style.backgroundImage = 'none';
      app.style.backgroundColor = '';
      app.setAttribute('data-custom-bg', 'false');
    }
    if (chatDetail) {
      chatDetail.style.backgroundImage = 'none';
      chatDetail.style.background = '';
      chatDetail.classList.remove('has-custom-wallpaper');
      chatDetail.removeAttribute('data-wallpaper-type');
    }
    if (messagesArea) {
      messagesArea.classList.remove('has-custom-wallpaper');
      messagesArea.style.backgroundImage = 'none';
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
    const globalBg = localStorage.getItem('nexchat_background');
    if (globalBg) {
      applyActiveWallpaper(globalBg);
    } else {
      applyActiveWallpaper(null);
    }
  } else {
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
 * Initializes and opens the Chat Wallpaper Picker Modal with full Vercel Blob genre themes
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
  let selectedUrl = currentChatBg || currentGlobalBg || (SAFE_WALLPAPER_PRESETS[0] ? SAFE_WALLPAPER_PRESETS[0].url : '');
  let selectedScope = chatId ? 'chat' : 'global';
  let activeGenre = 'all';

  const modal = document.createElement('div');
  modal.id = 'nexchatWallpaperModal';
  modal.className = 'wallpaper-modal-backdrop';
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(4, 7, 14, 0.88);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    z-index: 10050;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: wpFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  `;

  const GENRES_LIST = [
    { id: 'all', label: 'All Themes', icon: 'fa-shapes', count: SAFE_WALLPAPER_PRESETS.length },
    { id: 'hacker_style', label: 'Hacker Style', icon: 'fa-user-secret', count: 40 },
    { id: 'space_fight', label: 'Space Fight', icon: 'fa-shuttle-space', count: 17 },
    { id: 'oled_minimal', label: 'OLED Minimal', icon: 'fa-moon', count: 5 },
    { id: 'cyberpunk', label: 'Cyberpunk', icon: 'fa-bolt', count: 16 },
    { id: 'cosmos', label: 'Cosmos', icon: 'fa-meteor', count: 7 },
    { id: 'nature', label: 'Nature', icon: 'fa-mountain-sun', count: 6 },
    { id: 'abstract', label: 'Abstract', icon: 'fa-palette', count: 38 },
    { id: 'luxury_gold', label: 'Luxury Gold', icon: 'fa-crown', count: 4 },
    { id: 'doodles', label: 'Doodles & Solids', icon: 'fa-wand-magic-sparkles', count: CLASSIC_PRESETS.length }
  ];

  modal.innerHTML = `
    <style>
      @keyframes wpFadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      .wallpaper-card {
        background: #0b111e;
        border: 1px solid rgba(0, 255, 136, 0.25);
        border-radius: 22px;
        width: 100%;
        max-width: 680px;
        max-height: 90vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        box-shadow: 0 24px 60px rgba(0,0,0,0.85), 0 0 40px rgba(0,255,136,0.18);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #f8fafc;
      }
      .wp-header {
        padding: 18px 24px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(11, 17, 30, 0.95);
        position: sticky;
        top: 0;
        z-index: 20;
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
      .wp-header h3 span { color: #00ff88; text-shadow: 0 0 10px rgba(0,255,136,0.5); }
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
      .wp-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 18px; }
      
      .wp-preview-stage {
        border-radius: 14px;
        height: 140px;
        border: 1px solid rgba(255,255,255,0.12);
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 12px 18px;
        gap: 8px;
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.6);
        transition: background 0.3s ease;
        background-size: 100% 100%;
        background-position: center center; background-repeat: no-repeat;
      }
      .wp-mock-bubble {
        padding: 7px 13px;
        border-radius: 12px;
        font-size: 12px;
        max-width: 75%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      }
      .wp-mock-received { background: #1e293b; color: #f1f5f9; align-self: flex-start; }
      .wp-mock-sent { background: #00a884; color: #fff; align-self: flex-end; font-weight: 500; }
      
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
        border: 1px solid rgba(0,255,136,0.35);
      }

      /* Genre Navigation Bar */
      .wp-genre-nav {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: thin;
      }
      .wp-genre-pill {
        padding: 6px 12px;
        border-radius: 20px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        color: #94a3b8;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .wp-genre-pill:hover { background: rgba(255,255,255,0.1); color: #fff; }
      .wp-genre-pill.active {
        background: rgba(0, 255, 136, 0.18);
        border-color: #00ff88;
        color: #00ff88;
        box-shadow: 0 0 12px rgba(0,255,136,0.25);
      }
      .wp-genre-pill span.badge {
        font-size: 10px;
        background: rgba(0,0,0,0.35);
        padding: 1px 5px;
        border-radius: 10px;
        opacity: 0.8;
      }

      /* Grid & Tiles */
      .wp-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 10px;
        max-height: 340px;
        overflow-y: auto;
        padding-right: 4px;
      }
      .wp-preset-tile {
        height: 90px;
        border-radius: 12px;
        border: 2px solid transparent;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 6px 8px;
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .wp-preset-tile:not([data-is-svg="true"]) {
        background-size: 100% 100% !important;
        background-position: center center !important;
        background-repeat: no-repeat !important;
      }
      .wp-preset-tile[data-is-svg="true"] {
        background-size: auto !important;
        background-position: center center !important;
        background-repeat: repeat !important;
      }
      .wp-preset-tile:hover { transform: translateY(-2px); border-color: rgba(0,255,136,0.6); }
      .wp-preset-tile.active { border-color: #00ff88; box-shadow: 0 0 16px rgba(0,255,136,0.45); }
      .wp-preset-tile.active::after {
        content: '\\f058';
        font-family: 'Font Awesome 6 Free';
        font-weight: 900;
        position: absolute;
        top: 6px;
        right: 6px;
        color: #00ff88;
        font-size: 14px;
        background: rgba(0,0,0,0.6);
        border-radius: 50%;
        line-height: 1;
      }
      .wp-tile-label {
        font-size: 11px;
        font-weight: 600;
        background: rgba(0,0,0,0.75);
        backdrop-filter: blur(4px);
        padding: 2px 6px;
        border-radius: 6px;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        z-index: 2;
      }

      .wp-upload-tile {
        height: 90px;
        border-radius: 12px;
        border: 2px dashed rgba(0,255,136,0.4);
        background: rgba(0,255,136,0.05);
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
      .wp-upload-tile:hover { background: rgba(0,255,136,0.12); border-color: #00ff88; transform: translateY(-2px); }

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
        <h3><i class="fa-solid fa-palette"></i> Chat <span>Wallpapers</span> <small style="font-size: 11px; color: #94a3b8; font-weight: 400; margin-left: 6px;">(${SAFE_WALLPAPER_PRESETS.length} Curated Themes)</small></h3>
        <button class="wp-close-btn" id="wpCloseBtn" title="Close"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div class="wp-body">
        <!-- Live Chat Preview -->
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Live Interactive Preview</div>
          <div id="wpPreviewStage" class="wp-preview-stage">
            <div class="wp-mock-bubble wp-mock-received">
              <span>Hey! Check out this new wallpaper theme</span>
            </div>
            <div class="wp-mock-bubble wp-mock-sent">
              <span>Looks so clean! High resolution & OLED ready</span>
            </div>
          </div>
        </div>

        <!-- Scope Selection (This Chat vs All Chats) -->
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Apply To Scope</div>
          <div class="wp-scope-switch">
            <button type="button" class="wp-scope-btn ${selectedScope === 'chat' ? 'active' : ''}" id="wpScopeChatBtn">
              <i class="fa-solid fa-comment"></i> This Chat Only (${escapeHTML(chatName)})
            </button>
            <button type="button" class="wp-scope-btn ${selectedScope === 'global' ? 'active' : ''}" id="wpScopeGlobalBtn">
              <i class="fa-solid fa-globe"></i> All Chats (Default)
            </button>
          </div>
        </div>

        <!-- Genre Navigation Filter Tabs -->
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Browse by Genre</div>
          <div class="wp-genre-nav" id="wpGenreNav">
            ${GENRES_LIST.map(g => `
              <button type="button" class="wp-genre-pill ${g.id === activeGenre ? 'active' : ''}" data-genre="${escapeHTML(g.id)}">
                <i class="fa-solid ${g.icon}"></i> ${escapeHTML(g.label)} <span class="badge">${g.count}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Wallpaper Selection Grid -->
        <div>
          <div class="wp-grid" id="wpPresetGrid">
            <!-- Upload Custom Card -->
            <label class="wp-upload-tile" for="wpCustomUploadInput" title="Upload custom wallpaper image to Vercel Blob">
              <i class="fa-solid fa-cloud-arrow-up" style="font-size: 20px;"></i>
              <span>Upload Custom</span>
              <input type="file" id="wpCustomUploadInput" accept="image/*" style="display: none;">
            </label>
            ${SAFE_WALLPAPER_PRESETS.map((p) => `
              <div class="wp-preset-tile ${p.url === selectedUrl ? 'active' : ''}" data-preset-id="${escapeHTML(p.id)}" data-genre="${escapeHTML(p.genre || 'doodles')}">
                <div class="wp-tile-label">${escapeHTML(p.name)}</div>
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

  // Safely assign background styles programmatically to prevent template injection
  const presetMap = new Map(SAFE_WALLPAPER_PRESETS.map(p => [p.id, p]));
  modal.querySelectorAll('.wp-preset-tile[data-preset-id]').forEach((tile) => {
    const preset = presetMap.get(tile.dataset.presetId);
    if (!preset) return;
    tile.style.backgroundColor = preset.previewBg || '#0b141a';
    const thumb = preset.thumbnailUrl || preset.url;
    if (thumb) {
      tile.style.backgroundImage = `url("${thumb.replace(/"/g, '\\"')}")`;
      const isSvgThumb = thumb.startsWith('data:image/svg');
      if (isSvgThumb) tile.setAttribute('data-is-svg', 'true');
      else tile.removeAttribute('data-is-svg');
      tile.style.backgroundSize = isSvgThumb ? 'auto' : '100% 100%';
      tile.style.backgroundRepeat = isSvgThumb ? 'repeat' : 'no-repeat';
      tile.style.backgroundPosition = 'center center';
    }
    tile.addEventListener('click', () => {
      modal.querySelectorAll('.wp-preset-tile').forEach(t => t.classList.remove('active'));
      tile.classList.add('active');
      selectedUrl = preset.url || '';
      refreshPreview();
    });
  });

  // Genre Navigation Filter Handler
  const genrePills = modal.querySelectorAll('.wp-genre-pill');
  const allTiles = modal.querySelectorAll('.wp-preset-tile');
  genrePills.forEach(pill => {
    pill.addEventListener('click', () => {
      genrePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeGenre = pill.dataset.genre;

      allTiles.forEach(tile => {
        const tileGenre = tile.dataset.genre;
        if (activeGenre === 'all' || tileGenre === activeGenre) {
          tile.style.display = 'flex';
        } else {
          tile.style.display = 'none';
        }
      });
    });
  });

  // Update preview stage visually
  function refreshPreview() {
    const stage = document.getElementById('wpPreviewStage');
    if (!stage) return;
    if (selectedUrl) {
      stage.style.backgroundImage = `url("${selectedUrl.replace(/"/g, '\\"')}")`;
      const isSvgStage = selectedUrl.startsWith('data:image/svg');
      stage.style.backgroundSize = isSvgStage ? 'auto' : '100% 100%';
      stage.style.backgroundRepeat = isSvgStage ? 'repeat' : 'no-repeat';
      stage.style.backgroundPosition = 'center center';
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

  // Custom Upload Handler (Vercel Blob Primary)
  const customInput = document.getElementById('wpCustomUploadInput');
  customInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showNotif('Uploading wallpaper to Vercel Blob store...', 'info');

    try {
      let uploadedUrl = null;

      // 1. Primary: onUploadCustom (uses NEXCHAT Vercel Blob vaults)
      if (typeof onUploadCustom === 'function') {
        try {
          uploadedUrl = await onUploadCustom(file);
        } catch (bErr) {
          console.warn('[WALLPAPER] Vercel Blob upload notice:', bErr?.message || bErr);
        }
      }

      // 2. Secondary fallback: Cloudinary
      if (!uploadedUrl) {
        try {
          const cRes = await uploadImageToCloudinary(file, { folder: 'nexchat-wallpapers' });
          if (cRes && (cRes.secure_url || cRes.url)) {
            uploadedUrl = cRes.secure_url || cRes.url;
          }
        } catch (cErr) {
          console.warn('[WALLPAPER] Cloudinary fallback notice:', cErr?.message || cErr);
        }
      }

      // 3. Last resort fallback: local FileReader
      if (!uploadedUrl) {
        uploadedUrl = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = (re) => res(re.target.result);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
      }

      if (uploadedUrl) {
        selectedUrl = uploadedUrl;
        refreshPreview();
        showNotif('Wallpaper uploaded! Click "Set Wallpaper" to apply.', 'success');
      }
    } catch (err) {
      console.error('Wallpaper upload failed:', err);
      showNotif('Failed to upload wallpaper: ' + (err.message || 'Upload error'), 'error');
    }
  });

  // Apply Button
  document.getElementById('wpApplyBtn')?.addEventListener('click', async () => {
    await setWallpaper(selectedUrl, selectedScope, chatId, chatType, myUID, db);
    showNotif('Wallpaper applied successfully!', 'success');
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

// Auto-apply persisted wallpaper on startup
document.addEventListener('DOMContentLoaded', () => {
  try {
    const saved = localStorage.getItem('nexchat_background');
    if (saved) applyActiveWallpaper(saved);
  } catch (_) {}
});
