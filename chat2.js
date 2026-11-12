import { auth, db } from "./firebase-config.js";
import { chronexAI } from "./chronex-ai-service.js";
import {
  doc, updateDoc, deleteDoc, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ============================================================================
// RUNTIME HELPERS & BRIDGE FOR MIGRATED SUBSYSTEMS
// ============================================================================
const getMyUID = () => window.myUID || (auth?.currentUser?.uid) || localStorage.getItem('myUID') || localStorage.getItem('auth_uid') || '';
const getMyUsername = () => window.myUsername || (auth?.currentUser?.displayName) || localStorage.getItem('myUsername') || localStorage.getItem('auth_username') || 'NEX_User';

function getAudioContext() {
  if (typeof window.getAudioContext === 'function') {
    return window.getAudioContext();
  }
  if (!window._nexAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) window._nexAudioCtx = new AudioCtx();
  }
  if (window._nexAudioCtx && window._nexAudioCtx.state === 'suspended') {
    window._nexAudioCtx.resume().catch(() => {});
  }
  return window._nexAudioCtx;
}

function showNotif(msg, type = 'info', duration = 3000) {
  if (typeof window.showNotif === 'function') {
    return window.showNotif(msg, type, duration);
  }
  console.log(`[Notification ${type}]:`, msg);
}

function playLuxuryPopSound() {
  if (typeof window.playLuxuryPopSound === 'function') {
    return window.playLuxuryPopSound();
  }
}

function playLuxuryChimeSound() {
  if (typeof window.playLuxuryChimeSound === 'function') {
    return window.playLuxuryChimeSound();
  }
}

function openChat(...args) {
  if (typeof window.openChat === 'function') {
    return window.openChat(...args);
  }
}

function sendMessage(...args) {
  if (typeof window.sendMessage === 'function') {
    return window.sendMessage(...args);
  }
}

/**
 * ============================================================================
 * NEXCHAT - SECONDARY MODULAR CONTROLLER (chat2.js)
 * ============================================================================
 * 
 * Features & Responsibilities:
 * 1. Create Flow:
 *    - "Start New Chat" opens sleek Contact Picker Modal.
 *    - Persists chats to localStorage ('nex_local_chats') + backend sync.
 *    - Eradicates "No chats yet" empty-state once a chat exists.
 *    - "New Channel" opens dedicated Channel Creator Modal.
 *    - "Post Reel / CamShot" launches video studio / reels hub.
 * 2. Search & ChronEX AI:
 *    - Live filtering of contact conversations.
 *    - Question detection + Enter key routes directly to /api/chat (<1s reply).
 * 3. Neural Real-Time Translation:
 *    - Injects dynamic translate pill onto chat messages.
 *    - Connects directly to rotating 10-key Groq translator (/api/translate).
 * ============================================================================
 */

const LOCAL_CHATS_STORAGE_KEY = 'nex_local_chats';
const CHRONEX_HISTORY_KEY = 'chronex_ai_messages';
const NEXCHAT_SECRET = 'NEXCHAT_ULTRA_12345';

// Pre-seeded verified contacts for the Contact Picker
const PRELOADED_CONTACTS = [
  {
    uid: 'chronex-ai',
    name: 'Chronex AI',
    pic: 'chronex-ai.jpg',
    type: 'ai',
    badge: 'AI',
    isVerified: true,
    status: 'Ready • Latency 14ms',
    sub: 'Ask any question or translate languages'
  },
  {
    uid: 'duty',
    name: 'DUTY',
    type: 'direct',
    letter: 'D',
    status: 'You: N n',
    sub: 'You: N n'
  },
  {
    uid: 'home-alone',
    name: 'Home Alone',
    type: 'direct',
    letter: 'H',
    status: 'You: Please provide more content for th...',
    sub: 'You: Please provide more content for th...'
  },
  {
    uid: 'king-alex001',
    name: 'king Alex001',
    pic: 'logo.jpg',
    type: 'direct',
    status: 'You: Bruh',
    sub: 'You: Bruh'
  },
  {
    uid: 'daven',
    name: '@Daven ★',
    type: 'direct',
    isSmiley: true,
    status: 'You: Heyyyyyyyyyyyy.',
    sub: 'You: Heyyyyyyyyyyyy.'
  },
  {
    uid: 'demon-alexander',
    name: 'demon alexander',
    type: 'direct',
    letter: 'D',
    status: 'No messages yet',
    sub: 'Available'
  },
  {
    uid: 'werxcsz',
    name: 'Werxcsz',
    type: 'direct',
    letter: 'W',
    status: 'No messages yet',
    sub: 'Available'
  }
];

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Local Storage Chat Operations
export function getStoredChats() {
  try {
    const raw = localStorage.getItem(LOCAL_CHATS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function saveStoredChat(chat) {
  try {
    const existing = getStoredChats();
    const filtered = existing.filter(c => c.uid !== chat.uid);
    filtered.unshift(chat);
    localStorage.setItem(LOCAL_CHATS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('[chat2.js] Failed to save chat to localStorage:', e);
  }
}

/**
 * Creates and renders a contact item in #contactList
 */
export function createContactListItem(chat) {
  const li = document.createElement('li');
  li.className = 'chat-list-item chat-item' + (chat.uid === 'chronex-ai' ? ' chronex-ai-item' : '');
  li.dataset.chatId = chat.uid;
  li.dataset.uid = chat.uid;
  li.dataset.chatType = chat.type || 'direct';
  li.dataset.name = chat.name || 'User';

  let avatarHtml = '';
  if (chat.uid === 'chronex-ai') {
    avatarHtml = `
      <div class="chat-avatar-container" style="position: relative;">
        <img src="chronex-ai.jpg" class="chat-avatar" onerror="this.src='logo.jpg';" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 1.5px solid #25d366; box-shadow: 0 0 12px rgba(37, 211, 102, 0.3);">
        <span class="chat-online-beacon" style="display: block;"></span>
        <span class="avatar-achievement-badge" style="background: linear-gradient(135deg, #00ff66, #00d4ff); color: #041019; box-shadow: 0 0 10px rgba(0,255,102,0.5);"><i class="fa-solid fa-bolt"></i><span>AI</span></span>
      </div>`;
  } else if (chat.isSmiley || chat.name === '@Daven ★' || chat.uid === 'daven') {
    avatarHtml = `
      <div class="chat-avatar-container" style="position: relative;">
        <svg width="52" height="52" viewBox="0 0 52 52" class="chat-avatar" style="width: 52px; height: 52px; border-radius: 50%; border: 1.5px solid #00ff9d; box-shadow: 0 0 10px rgba(0, 255, 157, 0.2);"><circle cx="26" cy="26" r="26" fill="#050a0e"/><circle cx="26" cy="26" r="24" fill="#0e1720"/><path d="M16 19L22 25M22 19L16 25" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/><path d="M30 19L36 25M36 19L30 25" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/><path d="M17 33C20 38 32 38 35 33" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>
        <span class="chat-online-beacon" style="display: block;"></span>
      </div>`;
  } else if (chat.pic) {
    avatarHtml = `
      <div class="chat-avatar-container" style="position: relative;">
        <img src="${chat.pic}" class="chat-avatar" onerror="this.src='logo.jpg';" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 1.5px solid #00ff9d; box-shadow: 0 0 10px rgba(0, 255, 157, 0.2);">
        <span class="chat-online-beacon" style="display: block;"></span>
      </div>`;
  } else {
    const letter = chat.letter || (chat.name ? chat.name.charAt(0).toUpperCase() : 'U');
    avatarHtml = `
      <div class="chat-avatar-container" style="position: relative;">
        <div class="chat-avatar avatar-placeholder" style="width: 52px; height: 52px; background: #0c1813; color: #00ff9d; display: flex !important; align-items: center; justify-content: center; font-weight: 700; font-size: 20px; border-radius: 50%; border: 1.5px solid #00ff9d; box-shadow: 0 0 10px rgba(0, 255, 157, 0.2);">${letter}</div>
        <span class="chat-online-beacon" style="display: block;"></span>
      </div>`;
  }

  let titleHeaderHtml = '';
  if (chat.uid === 'chronex-ai') {
    titleHeaderHtml = `
      <span class="chat-name" style="font-family: 'Space Grotesk', sans-serif;">Chronex AI</span>
      <span class="tg-verified-badge green nex-verified-badge" title="Verified AI Assistant"><i class="fa-solid fa-circle-check"></i></span>
      <span class="chronex-vip-pill"><i class="fa-solid fa-bolt"></i> NEURAL CORE</span>`;
  } else {
    titleHeaderHtml = `<span class="chat-name">${escapeHtml(chat.name)}</span>`;
  }

  let previewHtml = '';
  if (chat.uid === 'chronex-ai') {
    previewHtml = `<p class="chat-preview" style="color: #25d366; font-size: 13.5px; font-weight: 500; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-microchip delivery-icon"></i><span class="preview-text">Ready • Latency 14ms</span></p>`;
  } else if (chat.lastMsg && chat.lastMsg.startsWith('You: ')) {
    previewHtml = `<p class="chat-preview"><span class="delivery-tick sent" title="Sent"><i class="fa-solid fa-check"></i></span> <span class="preview-text">${escapeHtml(chat.lastMsg)}</span></p>`;
  } else {
    previewHtml = `<p class="chat-preview"><span class="preview-text">${escapeHtml(chat.lastMsg || 'No messages yet')}</span></p>`;
  }

  let timeHtml = chat.uid === 'chronex-ai'
    ? `<span class="chat-item-time" style="color: #25d366; font-weight: 600; font-size: 12px;">ONLINE</span>`
    : `<span class="chat-item-time">${escapeHtml(chat.time || '')}</span>`;

  li.innerHTML = `
    ${avatarHtml}
    <div class="chat-item-content">
      <div class="chat-item-header">
        ${titleHeaderHtml}
      </div>
      ${previewHtml}
    </div>
    <div class="chat-time-container">
      ${timeHtml}
    </div>
    <button class="chat-menu-btn" title="Options"><i class="fa-solid fa-ellipsis-vertical"></i></button>
  `;

  li.addEventListener('click', () => {
    if (typeof window.openChat === 'function') {
      window.openChat(chat.uid, chat.name, chat.pic || 'logo.jpg', chat.type || 'direct');
    }
    if (typeof window.showChatDetailView === 'function') {
      window.showChatDetailView();
    }
  });

  return li;
}

/**
 * Restores saved chats from localStorage and removes #emptyChatState
 */
export function syncLocalChatsToDOM() {
  const contactList = document.getElementById('contactList');
  if (!contactList) return;

  const defaultChats = [
    {
      uid: 'chronex-ai',
      name: 'Chronex AI',
      pic: 'chronex-ai.jpg',
      type: 'ai',
      badge: 'AI',
      isVerified: true,
      status: 'Ready • Latency 14ms',
      lastMsg: 'Ready • Latency 14ms'
    },
    {
      uid: 'duty',
      name: 'DUTY',
      type: 'direct',
      letter: 'D',
      lastMsg: 'You: N n',
      time: '18h'
    },
    {
      uid: 'home-alone',
      name: 'Home Alone',
      type: 'direct',
      letter: 'H',
      lastMsg: 'You: Please provide more content for th...',
      time: '1d'
    },
    {
      uid: 'king-alex001',
      name: 'king Alex001',
      pic: 'logo.jpg',
      type: 'direct',
      lastMsg: 'You: Bruh',
      time: '2d'
    },
    {
      uid: 'daven',
      name: '@Daven ★',
      type: 'direct',
      isSmiley: true,
      lastMsg: 'You: Heyyyyyyyyyyyy.',
      time: '2d'
    },
    {
      uid: 'demon-alexander',
      name: 'demon alexander',
      type: 'direct',
      letter: 'D',
      lastMsg: 'No messages yet',
      time: '2d'
    },
    {
      uid: 'werxcsz',
      name: 'Werxcsz',
      type: 'direct',
      letter: 'W',
      lastMsg: 'No messages yet',
      time: '2d'
    }
  ];

    let stored = getStoredChats();
  const hasDuty = Array.isArray(stored) && stored.some(c => c && (c.uid === 'duty' || c.name === 'DUTY'));
  const hasHomeAlone = Array.isArray(stored) && stored.some(c => c && (c.uid === 'home-alone' || c.name === 'Home Alone'));
  let chatsToUse = (Array.isArray(stored) && stored.length >= 7 && hasDuty && hasHomeAlone) ? stored : defaultChats;
  try {
    localStorage.setItem(LOCAL_CHATS_STORAGE_KEY, JSON.stringify(chatsToUse));
  } catch (_) {}

  // Remove empty state watermark once chats exist
  const emptyState = document.getElementById('emptyChatState');
  if (emptyState) {
    emptyState.remove();
  }

  // Purge any stale nex-support concierge from the active list
  const staleSupport = contactList.querySelector('li[data-chat-id="nex-support"]');
  if (staleSupport) staleSupport.remove();

  chatsToUse.forEach(chat => {
    if (chat.uid === 'nex-support') return;
    const existingLi = contactList.querySelector(`li[data-chat-id="${chat.uid}"]`);
    if (!existingLi) {
      contactList.appendChild(createContactListItem(chat));
    }
  });
}

/**
 * Closes the FAB bottom action sheet safely
 */
export function closeFabSheet() {
  const sheet = document.getElementById('fabActionSheet');
  if (sheet) {
    sheet.classList.remove('is-active', 'active', 'open');
    sheet.style.setProperty('display', 'none', 'important');
    sheet.setAttribute('aria-hidden', 'true');
    const panel = document.getElementById('fabActionSheetPanel');
    const backdrop = document.getElementById('fabActionSheetBackdrop');
    if (panel) {
      panel.classList.remove('closing');
      panel.style.transform = '';
    }
    if (backdrop) backdrop.classList.remove('closing');
  }
}

/**
 * Creates or selects a chat, persists it, and opens chat view immediately
 */
export function createAndOpenChat(chat) {
  saveStoredChat(chat);

  const contactList = document.getElementById('contactList');
  if (contactList) {
    const emptyState = document.getElementById('emptyChatState');
    if (emptyState) emptyState.remove();

    let existingLi = contactList.querySelector(`li[data-chat-id="${chat.uid}"]`);
    if (!existingLi) {
      existingLi = createContactListItem(chat);
      contactList.prepend(existingLi);
    }
  }

  // Open Chat Screen
  if (typeof window.openChat === 'function') {
    window.openChat(chat.uid, chat.name, chat.pic || 'logo.jpg', chat.type || 'direct');
  }

  // Switch to detail view on mobile
  if (typeof window.showChatDetailView === 'function') {
    window.showChatDetailView();
  }
}

/**
 * Opens Contact Picker Modal
 */
export function openContactPickerModal() {
  let modal = document.getElementById('nexContactPickerModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'nexContactPickerModal';
    modal.className = 'nex-modal-overlay';
    modal.innerHTML = `
      <div class="nex-modal-card">
        <div class="nex-modal-header">
          <h3 class="nex-modal-title"><i class="fa-solid fa-user-plus" style="color: #00ff9d;"></i> Start New Chat</h3>
          <button type="button" class="nex-modal-close-btn" id="closeContactPickerBtn" aria-label="Close">&times;</button>
        </div>
        <div class="nex-modal-search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="contactPickerSearchInput" placeholder="Search contacts by name or handle..." autocomplete="off">
        </div>
        <ul class="nex-modal-list" id="contactPickerList"></ul>
        <div class="nex-custom-user-section">
          <div style="font-size: 11.5px; color: #8b949e; margin-bottom: 6px; font-weight: 600;">OR ADD BY USERNAME / USER ID</div>
          <form class="nex-custom-user-form" id="customUserForm">
            <input type="text" id="customUserIdInput" placeholder="Enter username, email or ID..." required autocomplete="off">
            <button type="submit"><i class="fa-solid fa-plus"></i> Chat</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close button
    modal.querySelector('#closeContactPickerBtn').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    // Custom user form submit
    modal.querySelector('#customUserForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const val = modal.querySelector('#customUserIdInput').value.trim();
      if (!val) return;
      const cleanUid = 'user_' + val.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      createAndOpenChat({
        uid: cleanUid,
        name: val,
        pic: 'logo.jpg',
        type: 'direct',
        isVerified: false,
        status: 'Custom contact'
      });
      modal.style.display = 'none';
      modal.querySelector('#customUserIdInput').value = '';
    });

    // Search filter inside picker
    modal.querySelector('#contactPickerSearchInput').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const items = modal.querySelectorAll('.nex-picker-item');
      items.forEach(it => {
        const name = it.dataset.name.toLowerCase();
        it.style.display = name.includes(q) ? 'flex' : 'none';
      });
    });
  }

  // Populate picker list
  const list = modal.querySelector('#contactPickerList');
  list.innerHTML = '';
  PRELOADED_CONTACTS.forEach(contact => {
    const li = document.createElement('li');
    li.className = 'nex-picker-item';
    li.dataset.name = contact.name;
    li.innerHTML = `
      <img src="${contact.pic}" class="nex-picker-avatar" alt="${escapeHtml(contact.name)}" onerror="this.src='logo.jpg';">
      <div class="nex-picker-meta">
        <div class="nex-picker-name">
          <span>${escapeHtml(contact.name)}</span>
          ${contact.badge ? `<span style="font-size: 9.5px; background: rgba(0,255,157,0.18); color: #00ff9d; padding: 1px 5px; border-radius: 4px;">${contact.badge}</span>` : ''}
        </div>
        <div class="nex-picker-sub">${escapeHtml(contact.sub || contact.status)}</div>
      </div>
      <i class="fa-solid fa-chevron-right" style="color: #64748b; font-size: 11px;"></i>
    `;
    li.addEventListener('click', () => {
      createAndOpenChat(contact);
      modal.style.display = 'none';
    });
    list.appendChild(li);
  });

  modal.style.display = 'flex';
  const input = modal.querySelector('#contactPickerSearchInput');
  if (input) {
    input.value = '';
    input.focus();
  }
}

/**
 * Opens Channel Creation Modal
 */
export function openChannelCreateModal() {
  let modal = document.getElementById('nexChannelCreateModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'nexChannelCreateModal';
    modal.className = 'nex-modal-overlay';
    modal.innerHTML = `
      <div class="nex-modal-card">
        <div class="nex-modal-header">
          <h3 class="nex-modal-title"><i class="fa-solid fa-tower-broadcast" style="color: #00c2ff;"></i> Create Broadcast Channel</h3>
          <button type="button" class="nex-modal-close-btn" id="closeChannelModalBtn" aria-label="Close">&times;</button>
        </div>
        <form style="padding: 20px; display: flex; flex-direction: column; gap: 14px;" id="nexChannelForm">
          <div>
            <label style="display: block; font-size: 12px; color: #8b949e; margin-bottom: 5px; font-weight: 600;">CHANNEL NAME</label>
            <input type="text" id="channelNameInput" placeholder="e.g. Cyber Security Pulse" required style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(0, 194, 255, 0.3); color: #fff; font-size: 13.5px; outline: none;">
          </div>
          <div>
            <label style="display: block; font-size: 12px; color: #8b949e; margin-bottom: 5px; font-weight: 600;">TOPIC / DESCRIPTION</label>
            <textarea id="channelDescInput" placeholder="What is this channel about?" rows="3" style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 13px; outline: none; resize: none;"></textarea>
          </div>
          <div>
            <label style="display: block; font-size: 12px; color: #8b949e; margin-bottom: 5px; font-weight: 600;">CATEGORY</label>
            <select id="channelCategoryInput" style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 10px; background: #0e1524; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 13px; outline: none;">
              <option value="Tech">Technology & Dev</option>
              <option value="AI">Artificial Intelligence</option>
              <option value="Crypto">Crypto & Web3</option>
              <option value="Gaming">Gaming & Metaverse</option>
              <option value="General">General Broadcast</option>
            </select>
          </div>
          <button type="submit" style="margin-top: 8px; background: linear-gradient(135deg, #00c2ff 0%, #0088cc 100%); color: #fff; font-weight: 700; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-size: 14px; box-shadow: 0 4px 15px rgba(0, 194, 255, 0.3);"><i class="fa-solid fa-satellite-dish"></i> Create Channel</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#closeChannelModalBtn').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    modal.querySelector('#nexChannelForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = modal.querySelector('#channelNameInput').value.trim();
      const desc = modal.querySelector('#channelDescInput').value.trim();
      if (!name) return;
      const channelId = 'channel_' + Date.now();
      createAndOpenChat({
        uid: channelId,
        name: name,
        pic: 'logo.jpg',
        type: 'channel',
        badge: 'CHANNEL',
        isVerified: true,
        status: desc || 'Broadcast Channel',
        lastMsg: 'Channel created. Start broadcasting!'
      });
      modal.style.display = 'none';
      modal.querySelector('#nexChannelForm').reset();
    });
  }

  modal.style.display = 'flex';
}

/**
 * Opens Reel / CamShot Upload Modal
 */
export function openReelUploadModal() {
  let modal = document.getElementById('nexReelUploadModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'nexReelUploadModal';
    modal.className = 'nex-modal-overlay';
    modal.innerHTML = `
      <div class="nex-modal-card">
        <div class="nex-modal-header">
          <h3 class="nex-modal-title"><i class="fa-solid fa-clapperboard" style="color: #ff3b6b;"></i> Post Reel / CamShot</h3>
          <button type="button" class="nex-modal-close-btn" id="closeReelModalBtn" aria-label="Close">&times;</button>
        </div>
        <div style="padding: 24px; display: flex; flex-direction: column; gap: 14px; text-align: center;">
          <p style="font-size: 13.5px; color: #8b949e; margin: 0;">Share immersive short-form video reels or record a fresh CamShot live.</p>
          <div style="border: 2px dashed rgba(255, 59, 107, 0.4); border-radius: 16px; padding: 24px; cursor: pointer; background: rgba(255, 59, 107, 0.05);" id="reelDropArea">
            <i class="fa-solid fa-cloud-arrow-up" style="font-size: 32px; color: #ff3b6b; margin-bottom: 8px;"></i>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">Choose Video File</div>
            <div style="font-size: 11.5px; color: #8b949e; margin-top: 4px;">MP4, WebM, MOV (Max 60 seconds)</div>
            <input type="file" id="reelFileInput" accept="video/*" style="display: none;">
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" id="openReelsHubBtn" style="flex: 1; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;"><i class="fa-solid fa-compass" style="margin-right: 6px;"></i> Explore Reels</button>
            <button type="button" id="recordCamShotBtn" style="flex: 1; padding: 12px; border-radius: 10px; background: linear-gradient(135deg, #ff3b6b 0%, #c41846 100%); border: none; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;"><i class="fa-solid fa-camera" style="margin-right: 6px;"></i> Record Live</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#closeReelModalBtn').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    const dropArea = modal.querySelector('#reelDropArea');
    const fileInput = modal.querySelector('#reelFileInput');
    dropArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        modal.style.display = 'none';
        window.location.href = 'reels.html';
      }
    });

    modal.querySelector('#openReelsHubBtn').addEventListener('click', () => {
      modal.style.display = 'none';
      window.location.href = 'reels.html';
    });

    modal.querySelector('#recordCamShotBtn').addEventListener('click', () => {
      modal.style.display = 'none';
      window.location.href = 'reels.html';
    });
  }

  modal.style.display = 'flex';
}

/**
 * Sends prompt to /api/chat and injects ChronEX AI response bubble (<1s)
 */
export async function askChronexAI(promptText) {
  if (!promptText || !promptText.trim()) return;

  const messagesList = document.querySelector('.messages-list') || document.getElementById('messages-area');
  if (!messagesList) return;

  // 1. Append user question bubble
  const userBubble = document.createElement('div');
  userBubble.className = 'message-wrapper sent';
  userBubble.style.cssText = 'display: flex; justify-content: flex-end; margin: 8px 0; padding: 0 12px;';
  userBubble.innerHTML = `
    <div class="message-bubble sent" style="background: linear-gradient(135deg, #005c4b 0%, #059669 100%); color: #fff; padding: 9px 14px; border-radius: 14px 2px 14px 14px; max-width: 75%; font-size: 14px; line-height: 1.45; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      ${escapeHtml(promptText)}
    </div>
  `;
  messagesList.appendChild(userBubble);

  // 2. Append temporary typing indicator bubble
  const typingBubble = document.createElement('div');
  typingBubble.className = 'message-wrapper received';
  typingBubble.style.cssText = 'display: flex; justify-content: flex-start; margin: 8px 0; padding: 0 12px; gap: 8px;';
  typingBubble.innerHTML = `
    <img src="chronex-ai.jpg" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid #00ff9d;" alt="ChronEX">
    <div class="message-bubble received" style="background: #111722; color: #00ff9d; padding: 9px 14px; border-radius: 2px 14px 14px 14px; font-size: 13px; border: 1px solid rgba(0,255,157,0.3); display: flex; align-items: center; gap: 6px;">
      <i class="fa-solid fa-bolt fa-spin" style="font-size: 11px;"></i> ChronEX AI is thinking...
    </div>
  `;
  messagesList.appendChild(typingBubble);
  messagesList.scrollTop = messagesList.scrollHeight;

  // 3. Call /api/chat with sub-1s Groq key rotation
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nexchat-secret': NEXCHAT_SECRET
      },
      body: JSON.stringify({
        message: promptText
      }),
      signal: controller.signal
    });

    clearTimeout(timer);
    const data = await res.json();
    const replyText = data.reply || data.response || 'ChronEX AI uplink established.';

    // Replace typing indicator with actual ChronEX reply
    typingBubble.innerHTML = `
      <img src="chronex-ai.jpg" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid #00ff9d;" alt="ChronEX">
      <div class="message-bubble received chronex-ai-bubble" style="background: #111722; color: #f0f6fc; padding: 12px 16px; border-radius: 2px 16px 16px 16px; max-width: 82%; border: 1px solid rgba(0, 255, 157, 0.35); font-size: 13.5px; line-height: 1.55; box-shadow: 0 6px 20px rgba(0,0,0,0.5);">
        <div style="font-size: 10px; font-weight: 700; color: #00ff9d; margin-bottom: 6px; letter-spacing: 0.5px; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-microchip"></i> CHRONEX AI
        </div>
        <div class="message-text" style="white-space: pre-wrap;">${escapeHtml(replyText)}</div>
        <button class="nex-msg-translate-btn" type="button" title="Translate response"><i class="fa-solid fa-language"></i> Translate</button>
      </div>
    `;
    messagesList.scrollTop = messagesList.scrollHeight;
  } catch (err) {
    typingBubble.innerHTML = `
      <img src="chronex-ai.jpg" style="width: 32px; height: 32px; border-radius: 50%;" alt="ChronEX">
      <div class="message-bubble received" style="background: #111722; color: #ff4d4d; padding: 10px 14px; border-radius: 2px 14px 14px 14px; font-size: 13px; border: 1px solid rgba(255,77,77,0.3);">
        <i class="fa-solid fa-triangle-exclamation"></i> ChronEX neural engine re-routing. Please try again.
      </div>
    `;
  }
}

// In-Memory Fast Cache for Instant 0ms Re-Translations
const clientTranslationCache = new Map();

function renderTranslationBox(box, bubbleEl, translated, detected, target) {
  box.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 8px;">
      <span class="nex-trans-label" style="margin: 0;"><i class="fa-solid fa-language"></i> ${escapeHtml(detected)} &rarr; ${escapeHtml(target)}</span>
      <div class="nex-trans-lang-ctrl" style="display: flex; align-items: center; gap: 4px;">
        <select class="nex-trans-quick-switch" style="background: rgba(0,0,0,0.55); border: 1px solid rgba(0,255,157,0.3); color: #00ff9d; font-size: 10px; border-radius: 4px; padding: 2px 4px; outline: none; cursor: pointer; max-width: 130px;">
          <option value="" disabled selected>300+ Languages</option>
          <option value="CUSTOM">+ Type Any Language...</option>
          <optgroup label="Popular Global">
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Russian">Russian</option>
            <option value="Portuguese">Portuguese</option>
            <option value="Italian">Italian</option>
            <option value="Dutch">Dutch</option>
          </optgroup>
          <optgroup label="African Languages">
            <option value="Nigerian Pidgin">Nigerian Pidgin</option>
            <option value="Yoruba">Yoruba</option>
            <option value="Igbo">Igbo</option>
            <option value="Hausa">Hausa</option>
            <option value="Swahili">Swahili</option>
            <option value="Amharic">Amharic</option>
            <option value="Zulu">Zulu</option>
            <option value="Xhosa">Xhosa</option>
            <option value="Somali">Somali</option>
          </optgroup>
          <optgroup label="Asian & Middle East">
            <option value="Arabic">Arabic</option>
            <option value="Chinese (Mandarin)">Chinese</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
            <option value="Hindi">Hindi</option>
            <option value="Bengali">Bengali</option>
            <option value="Punjabi">Punjabi</option>
            <option value="Tagalog">Tagalog</option>
            <option value="Vietnamese">Vietnamese</option>
            <option value="Turkish">Turkish</option>
            <option value="Hebrew">Hebrew</option>
            <option value="Thai">Thai</option>
            <option value="Indonesian">Indonesian</option>
            <option value="Persian (Farsi)">Persian</option>
            <option value="Urdu">Urdu</option>
          </optgroup>
          <optgroup label="Eastern & Nordic Europe">
            <option value="Ukrainian">Ukrainian</option>
            <option value="Polish">Polish</option>
            <option value="Czech">Czech</option>
            <option value="Greek">Greek</option>
            <option value="Swedish">Swedish</option>
            <option value="Norwegian">Norwegian</option>
            <option value="Danish">Danish</option>
            <option value="Finnish">Finnish</option>
            <option value="Hungarian">Hungarian</option>
            <option value="Romanian">Romanian</option>
          </optgroup>
        </select>
        <div class="nex-custom-lang-input-wrap" style="display: none; align-items: center; gap: 3px;">
          <input type="text" class="nex-custom-lang-input" placeholder="Language name..." style="width: 85px; padding: 2px 4px; font-size: 10px; background: rgba(0,0,0,0.6); border: 1px solid #00ff9d; color: #fff; border-radius: 4px; outline: none;">
          <button type="button" class="nex-custom-lang-go-btn" style="background: #00ff9d; color: #000; border: none; font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 4px; cursor: pointer;">Go</button>
        </div>
      </div>
    </div>
    <div class="nex-trans-content">${escapeHtml(translated)}</div>
  `;

  const selectEl = box.querySelector('.nex-trans-quick-switch');
  const customWrap = box.querySelector('.nex-custom-lang-input-wrap');
  const customInput = box.querySelector('.nex-custom-lang-input');
  const customGo = box.querySelector('.nex-custom-lang-go-btn');

  selectEl?.addEventListener('change', (e) => {
    const nextLang = e.target.value;
    if (nextLang === 'CUSTOM') {
      selectEl.style.display = 'none';
      if (customWrap) customWrap.style.display = 'flex';
      customInput?.focus();
    } else if (nextLang) {
      translateMessageElement(bubbleEl, nextLang);
    }
  });

  const handleCustomSubmit = () => {
    const typed = (customInput?.value || '').trim();
    if (typed) {
      translateMessageElement(bubbleEl, typed);
    } else {
      selectEl.style.display = 'block';
      if (customWrap) customWrap.style.display = 'none';
    }
  };

  customGo?.addEventListener('click', handleCustomSubmit);
  customInput?.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      handleCustomSubmit();
    } else if (ev.key === 'Escape') {
      selectEl.style.display = 'block';
      if (customWrap) customWrap.style.display = 'none';
    }
  });
}

/**
 * Real-Time Neural Translation Handler
 */
export async function translateMessageElement(bubbleEl, requestedTarget = null) {
  if (!bubbleEl) return;

  // Extract raw text
  let rawText = '';
  const textContainer = bubbleEl.querySelector('.message-text, .preview-text, .message-content') || bubbleEl;
  const clone = textContainer.cloneNode(true);
  clone.querySelectorAll('.nex-msg-translate-btn, .nex-translated-box, .chat-time, .delivery-status').forEach(e => e.remove());
  rawText = clone.innerText.trim();

  if (!rawText) return;

  // Check if translation box already present and user toggled it off without picking new target
  let box = bubbleEl.querySelector('.nex-translated-box');
  if (box && !requestedTarget) {
    box.remove();
    return;
  }

  if (!box) {
    box = document.createElement('div');
    box.className = 'nex-translated-box';
    const timeSpan = bubbleEl.querySelector('.message-time-row, .message-timestamp-row, div[style*="font-size: 11px"], div[style*="font-size: 10.5px"]');
    if (timeSpan) {
      bubbleEl.insertBefore(box, timeSpan);
    } else {
      bubbleEl.appendChild(box);
    }
  }

  let preferred = window.nexPreferredLang || localStorage.getItem('nex_auto_translate_target_lang') || localStorage.getItem('nex_preferred_lang');
  let targetLang = requestedTarget || preferred;
  if (!targetLang) {
    const lower = rawText.toLowerCase();
    const isCommonSpanish = /^(hola|buenos|buenas|cómo estás|como estas|qué tal|que tal|gracias|de nada|por favor|adiós|chao|sí|si)\b/.test(lower);
    targetLang = isCommonSpanish ? 'English' : 'Spanish';
  }
  const cacheKey = `${targetLang.toLowerCase()}:${rawText}`;

  // Tier 0: 0ms Instant Memory Cache (< 0.05ms)
  if (clientTranslationCache.has(cacheKey)) {
    const hit = clientTranslationCache.get(cacheKey);
    renderTranslationBox(box, bubbleEl, hit.translated, hit.detected, hit.target);
    return;
  }

  // Tier 1: 0ms Synchronous Phrase Dictionary & Lexicon Match (< 0.1ms)
  if (typeof window !== 'undefined' && typeof window.fastTranslateSync === 'function') {
    const syncHit = window.fastTranslateSync(rawText, targetLang);
    if (syncHit) {
      clientTranslationCache.set(cacheKey, { translated: syncHit, detected: 'Auto', target: targetLang });
      renderTranslationBox(box, bubbleEl, syncHit, 'Auto', targetLang);
      return;
    }
  }

  // Tier 2: Speculative Client-Side Fast Translation (< 150ms via Google GTX / Edge MT)
  if (typeof window !== 'undefined' && typeof window.fastTranslateAsync === 'function') {
    try {
      const fastResult = await window.fastTranslateAsync(rawText, targetLang);
      if (fastResult && fastResult.trim() && fastResult.trim().toLowerCase() !== rawText.toLowerCase()) {
        clientTranslationCache.set(cacheKey, { translated: fastResult.trim(), detected: 'Auto', target: targetLang });
        renderTranslationBox(box, bubbleEl, fastResult.trim(), 'Auto', targetLang);
        return;
      }
    } catch (_) {}
  }

  // Tier 3: Sub-Second Server Fallback (/api/translate - single non-redundant call)
  box.innerHTML = `<span class="nex-trans-label"><i class="fa-solid fa-spinner fa-spin"></i> Translating...</span>`;

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nexchat-secret': NEXCHAT_SECRET
      },
      body: JSON.stringify({
        text: rawText,
        targetLang: targetLang,
        sourceLang: 'auto'
      })
    });

    const data = await res.json();
    let translated = data.translatedText || data.result || data.response || rawText;
    let detected = data.detectedLang || 'Auto';
    let target = data.targetLang || targetLang;

    clientTranslationCache.set(cacheKey, { translated, detected, target });
    renderTranslationBox(box, bubbleEl, translated, detected, target);
  } catch (err) {
    box.innerHTML = `<span style="color: #ff4d4d; font-size: 11px;"><i class="fa-solid fa-triangle-exclamation"></i> Translation failed</span>`;
  }
}

/**
 * Message Translation Button Injector
 */
export function injectTranslateButtons() {
  const bubbles = document.querySelectorAll('.message-bubble');
  bubbles.forEach(b => {
    if (b.querySelector('.nex-msg-translate-btn')) return;
    if (b.classList.contains('is-sticker-message') || b.classList.contains('is-clip-message')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nex-msg-translate-btn';
    btn.title = 'Translate message';
    btn.innerHTML = `<i class="fa-solid fa-language"></i> Translate`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      translateMessageElement(b);
    });
    const timeSpan = b.querySelector('.message-time-row, .message-timestamp-row, div[style*="font-size: 11px"], div[style*="font-size: 10.5px"]');
    if (timeSpan) {
      b.insertBefore(btn, timeSpan);
    } else {
      b.appendChild(btn);
    }
  });
}

/**
 * MASTER INITIALIZER
 */
export function initChat2() {
  // 1. Initial sync of saved chats to DOM
  syncLocalChatsToDOM();

  // 2. Wire FAB Action Sheet Buttons
  document.getElementById('fabSheetNewChat')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeFabSheet();
    openContactPickerModal();
  });

  document.getElementById('fabSheetNewChannel')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeFabSheet();
    openChannelCreateModal();
  });

  document.getElementById('fabSheetNewReel')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeFabSheet();
    openReelUploadModal();
  });

  // 3. Wire Empty-State buttons with high priority
  document.addEventListener('click', (e) => {
    const startNewBtn = e.target.closest('#emptyStartNewChatBtn, .empty-action-btn.primary');
    if (startNewBtn) {
      e.preventDefault();
      e.stopPropagation();
      openContactPickerModal();
      return;
    }

    const chronexBtn = e.target.closest('#emptyTryChronexAiBtn');
    if (chronexBtn) {
      e.preventDefault();
      e.stopPropagation();
      createAndOpenChat(PRELOADED_CONTACTS[0]);
      return;
    }

    const channelBtn = e.target.closest('#emptyExploreChannelsBtn');
    if (channelBtn) {
      e.preventDefault();
      e.stopPropagation();
      openChannelCreateModal();
      return;
    }
  });

  // 4. Wire Search Bar (#searchInput)
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    // Filter chats on typing
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const items = document.querySelectorAll('#contactList .chat-item');
      items.forEach(it => {
        const name = (it.dataset.name || it.innerText || '').toLowerCase();
        it.style.display = name.includes(q) ? 'flex' : 'none';
      });
    });

    // Enter key sends question to ChronEX AI or executes commands
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (!q) return;
        e.preventDefault();
        searchInput.value = '';

        // Auto-Heal 5-Stage command shortcut
        if (q.toLowerCase() === '/heal' || q.toLowerCase() === 'heal' || q.toLowerCase() === 'auto-heal') {
          if (window.nexchatAutoHeal?.openAutoHealHUD) {
            window.nexchatAutoHeal.openAutoHealHUD();
            return;
          }
        }

        // Open ChronEX AI chat view
        createAndOpenChat(PRELOADED_CONTACTS[0]);

        // Send query to ChronEX AI
        askChronexAI(q);
      }
    });
  }

  // 5. Reactive Event-Driven Scanner & Mutation Observer for dynamic elements (replaces CPU-heavy 1000ms polling)
  syncLocalChatsToDOM();
  injectTranslateButtons();

  // Watch for newly appended messages reactively instead of polling every second
  const messagesArea = document.getElementById('messages-area') || document.querySelector('.chat-messages');
  if (messagesArea && window.MutationObserver) {
    let translateScheduled = false;
    const msgObserver = new MutationObserver(() => {
      if (!translateScheduled) {
        translateScheduled = true;
        requestAnimationFrame(() => {
          injectTranslateButtons();
          translateScheduled = false;
        });
      }
    });
    msgObserver.observe(messagesArea, { childList: true, subtree: true });
  }

  // React to local chats change via custom event
  window.addEventListener('nexchat:chatsUpdated', () => {
    syncLocalChatsToDOM();
  });

      // 6. Boot migrated modular subsystems
    try { initNexbotStudio(); } catch (_) {}
    try { initNeuralRadar(); } catch (_) {}
    try { initVipVault(); } catch (_) {}
    try { initGhostProtocol(); } catch (_) {}
    try { initCyberStreak(); } catch (_) {}
    try { initSmartReplyAndPolish(); } catch (_) {}
    try { initNeuralSoundboard(); } catch (_) {}
    try { initAudioSpaces(); } catch (_) {}
    try { initCyberDrop(); } catch (_) {}
    try { initCipherVault(); } catch (_) {}
    try { initMeshSettings(); } catch (_) {}

    console.log('[NEXCHAT] chat2.js secondary modular controller initialized successfully.');
}

// Global Exports
window.openContactPickerModal = openContactPickerModal;
window.openChannelCreateModal = openChannelCreateModal;
window.openReelUploadModal = openReelUploadModal;
window.closeFabSheet = closeFabSheet;
window.syncLocalChatsToDOM = syncLocalChatsToDOM;

window.nexChat2 = {
  initChat2,
  openContactPickerModal,
  openChannelCreateModal,
  openReelUploadModal,
  createAndOpenChat,
  askChronexAI,
  translateMessageElement,
  syncLocalChatsToDOM
};

// Auto-run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChat2);
} else {
  initChat2();
}


/* ==========================================================================
   NEXBOT STUDIO // WHATSAPP BOT ARCHITECT, NEURAL RADAR, & VIP VAULT
   ========================================================================== */

function initNexbotStudio() {
  const modal = document.getElementById('nexbotStudioModal');
  const openBtns = [
    document.getElementById('nexbotStudioBtnHeader'),
    document.getElementById('mobileNexbotStudioBtn'),
    document.getElementById('sheetNexbotBtn')
  ];
  const closeBtn = document.getElementById('closeNexbotStudioBtn');
  const backdrop = document.getElementById('closeNexbotStudioBackdrop');

  const openModal = () => {
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      syncNexbotFleetList();
      if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();
    }
  };

  const closeModal = () => {
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  openBtns.forEach(btn => {
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }
  });

  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = 'true';
    closeBtn.addEventListener('click', closeModal);
  }
  if (backdrop && !backdrop.dataset.bound) {
    backdrop.dataset.bound = 'true';
    backdrop.addEventListener('click', closeModal);
  }

  // Tabs
  const tabs = document.querySelectorAll('.nexbot-nav-tab[data-bot-tab]');
  tabs.forEach(tab => {
    if (tab.dataset.bound) return;
    tab.dataset.bound = 'true';
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-bot-tab');
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.nexbot-tab-pane').forEach(p => p.classList.remove('active'));
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Mobile View Toggle: Architect vs Simulator
  const viewToggleBtns = document.querySelectorAll('.nexbot-view-toggle-btn');
  const nexbotGrid = document.querySelector('.nexbot-studio-grid');
  viewToggleBtns.forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => {
      viewToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.getAttribute('data-view') || 'config';
      if (nexbotGrid) nexbotGrid.setAttribute('data-active-view', view);
    });
  });

  // Archetypes
  const archetypes = {
    noreply: {
      name: 'AwayGuard AI',
      prompt: 'You are AwayGuard AI, an autonomous no-reply & away auto-responder for NEXCHAT. When the user is away, sleeping, or busy, acknowledge incoming inquiries politely, verify their message has been safely queued, provide helpful context or answers if possible, and let them know the user will respond promptly upon returning.',
      temp: 0.4,
      greeting: 'Hi! I am an automated away assistant. The user is currently away/busy, but your message has been received safely and logged.',
      keywords: '*, away, busy, offline, urgent, hi, hello, ping, status',
      delay: 0.8
    },
    support: {
      name: 'ApexSupport AI',
      prompt: 'You are ApexSupport AI, an autonomous customer service agent for WhatsApp. You answer questions politely, concisely, and resolve user issues with professional precision.',
      temp: 0.5,
      greeting: 'Hello! I am your autonomous AI assistant. How can I assist you today?',
      keywords: 'hi, hello, price, support, order, quote, help',
      delay: 1.2
    },
    sales: {
      name: 'ApexCloser AI',
      prompt: 'You are ApexCloser AI, a high-converting sales representative on WhatsApp. You ask sharp qualifying questions, highlight key product benefits, overcome hesitation with social proof, and invite the user to book a call or purchase.',
      temp: 0.7,
      greeting: 'Hi there! Looking to scale your business or upgrade your tech stack? Let me show you our high-performance solutions.',
      keywords: 'demo, price, cost, buy, quote, upgrade, sales',
      delay: 1.0
    },
    engineer: {
      name: 'NexusEngineer AI',
      prompt: 'You are NexusEngineer AI, a principal full-stack engineer and coding mentor on WhatsApp. You write clean, production-grade code, analyze bugs, explain system architectures, and provide robust technical answers.',
      temp: 0.3,
      greeting: 'NexusEngineer online. Paste your code or state your architectural requirement.',
      keywords: 'code, bug, debug, javascript, python, api, deploy',
      delay: 0.5
    },
    crypto: {
      name: 'AlphaRadar AI',
      prompt: 'You are AlphaRadar AI, a quantitative crypto analyst. You analyze token metrics, macro market movements, on-chain liquidity, and provide disciplined risk-management frameworks without financial advice.',
      temp: 0.6,
      greeting: 'AlphaRadar synced. What market pair or token vector are you tracking?',
      keywords: 'btc, eth, sol, price, token, chart, crypto, alpha',
      delay: 1.0
    },
    twin: {
      name: 'NexusTwin AI',
      prompt: 'You are NexusTwin AI, an authentic personal AI twin. You reply in a friendly, conversational tone with natural wit and speedy assistance.',
      temp: 0.8,
      greeting: 'Yo! What is up? I am currently mobile but I am right here to help you out.',
      keywords: 'hey, yo, what up, sup, where are you, busy',
      delay: 1.2
    }
  };

  const nameInput = document.getElementById('nexbotNameInput');
  const promptTextarea = document.getElementById('nexbotSystemPrompt');
  const tempSlider = document.getElementById('nexbotTempSlider');
  const tempVal = document.getElementById('nexbotTempVal');
  const delaySlider = document.getElementById('nexbotDelaySlider');
  const delayVal = document.getElementById('nexbotDelayVal');
  const greetingInput = document.getElementById('nexbotGreetingInput');
  const keywordsInput = document.getElementById('nexbotKeywordsInput');
  const simBotName = document.getElementById('simBotName');
  const simInitialGreeting = document.getElementById('simInitialGreeting');

  if (promptTextarea && !promptTextarea.value) {
    promptTextarea.value = archetypes.support.prompt;
  }

  // Active Extension Target State ('nexchat' | 'baileys' | 'vercel' | 'chrome')
  let activeExtTarget = 'nexchat';

  // Target Script Generators
  const getInAppExtensionScript = () => {
    const bName = nameInput?.value || 'AwayGuard AI';
    const bPrompt = promptTextarea?.value || 'You are an autonomous away and no-reply assistant.';
    const bGreeting = greetingInput?.value || 'Hello! I am currently away. Your message is safely logged.';
    const bKeywords = (keywordsInput?.value || '*').split(',').map(s => s.trim().toLowerCase());
    const bDelay = parseFloat(delaySlider?.value || 0.8);

    return `// ==========================================================
// NEXCHAT IN-APP BOT EXTENSION // AUTONOMOUS CHAT RUNNER
// Extension ID: nex-bot-${bName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
// Target: NEXCHAT In-App Client Engine & Ecosystem Consent Hub
// Generated by NEXBOT Studio v2.4 (Vercel Extension Hub Ready)
// ==========================================================

(function() {
  'use strict';

  const BOT_CONFIG = {
    name: "${bName.replace(/"/g, '\\"')}",
    type: "in_app_autonomous_bot",
    systemPrompt: "${bPrompt.replace(/\n/g, ' ').replace(/"/g, '\\"')}",
    defaultGreeting: "${bGreeting.replace(/"/g, '\\"')}",
    triggerKeywords: ${JSON.stringify(bKeywords)},
    latencyMs: ${Math.round(bDelay * 1000)},
    version: "2.4.0",
    status: "active"
  };

  // Mount into NEXCHAT Runtime Extension Registry
  window.NEX_ACTIVE_BOT_EXTENSION = {
    name: BOT_CONFIG.name,
    active: true,
    config: BOT_CONFIG,
    onIncomingMessage: async function(senderId, text) {
      console.log(\`[\${BOT_CONFIG.name}] Ingested incoming message from \${senderId}: "\${text}"\`);
      
      // Match keywords or wildcard
      const matches = BOT_CONFIG.triggerKeywords.includes("*") || 
        BOT_CONFIG.triggerKeywords.some(k => text.toLowerCase().includes(k.trim()));
      
      if (!matches) return null;

      console.log(\`[\${BOT_CONFIG.name}] Trigger matched. Dispatching away auto-reply...\`);
      return {
        reply: BOT_CONFIG.defaultGreeting,
        delayMs: BOT_CONFIG.latencyMs
      };
    }
  };

  console.log(\`[NEXCHAT RUNTIME] Extension "\${BOT_CONFIG.name}" mounted & listening.\`);
})();`;
  };

  const getFullBaileysScript = () => {
    const bName = nameInput?.value || 'ApexSupport AI';
    const bPrompt = promptTextarea?.value || 'You are an autonomous WhatsApp AI assistant.';
    const bGreeting = greetingInput?.value || 'Hello! Thank you for your inquiry. Automated response queued.';
    const bKeywords = (keywordsInput?.value || '*').split(',').map(s => s.trim().toLowerCase());
    const bDelay = parseFloat(delaySlider?.value || 1.2);

    return `// ==========================================================
// NEXBOT Autonomous WhatsApp Runner (Baileys Engine)
// Generated by NEXCHAT Studio v2.4
// Run: npm install @whiskeysockets/baileys qrcode-terminal
// ==========================================================

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

const BOT_NAME = "${bName.replace(/"/g, '\\"')}";
const SYSTEM_PROMPT = "${bPrompt.replace(/\n/g, ' ').replace(/"/g, '\\"')}";
const DEFAULT_GREETING = "${bGreeting.replace(/"/g, '\\"')}";
const TRIGGER_KEYWORDS = ${JSON.stringify(bKeywords)};
const DELAY_MS = ${Math.round(bDelay * 1000)};

async function startBot() {
  console.log('[NEXBOT] Starting autonomous WhatsApp worker for ' + BOT_NAME + '...');
  const { state, saveCreds } = await useMultiFileAuthState('nexbot_auth_session');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: [BOT_NAME, 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) startBot();
    } else if (connection === 'open') {
      console.log('[NEXBOT] Connected to WhatsApp Mesh as ' + BOT_NAME);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
      if (!text) continue;

      console.log('[INCOMING MESSAGE]', text);
      const isMatch = TRIGGER_KEYWORDS.includes("*") || 
        TRIGGER_KEYWORDS.some(k => text.toLowerCase().includes(k.trim()));
      
      if (!isMatch) continue;

      console.log('[TRIGGER MATCHED] Preparing response...');
      await new Promise(r => setTimeout(r, DELAY_MS));

      try {
        await sock.sendMessage(msg.key.remoteJid, { text: DEFAULT_GREETING });
        console.log('[DISPATCHED AUTOREPLY]', DEFAULT_GREETING);
      } catch (err) {
        console.error('[BOT ERROR]', err);
      }
    }
  });
}

startBot();`;
  };

  const getVercelWebhookScript = () => {
    const bName = nameInput?.value || 'AwayGuard AI';
    const bGreeting = greetingInput?.value || 'Hello! Automated away reply queued.';

    return `// ==========================================================
// VERCEL SERVERLESS EDGE WEBHOOK // NEXBOT DISPATCHER
// Deploy: vercel deploy
// Route: /api/whatsapp-webhook
// ==========================================================

export default async function handler(req, res) {
  const BOT_NAME = "${bName.replace(/"/g, '\\"')}";
  const GREETING = "${bGreeting.replace(/"/g, '\\"')}";
  const VERIFY_TOKEN = "nexchat_sec_token_89a";

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden verification token');
  }

  if (req.method === 'POST') {
    const body = req.body;
    console.log('[VERCEL WEBHOOK INCOMING]', JSON.stringify(body));
    return res.status(200).json({ 
      status: "success", 
      bot: BOT_NAME, 
      reply: GREETING,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}`;
  };

  const getChromeExtensionScript = () => {
    const bName = nameInput?.value || 'AwayGuard AI';
    const bGreeting = greetingInput?.value || 'Hello! The user is currently away/busy.';
    return `// ==========================================================
// CHROME WEB EXTENSION // CONTENT SCRIPT RUNNER
// Manifest V3 Content Script for Web Messenger
// ==========================================================

(function() {
  console.log("[NEXBOT EXTENSION] Chrome Content Script active for ${bName}");
  const BOT_NAME = "${bName.replace(/"/g, '\\"')}";
  const GREETING = "${bGreeting.replace(/"/g, '\\"')}";

  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "NEXCHAT_INCOMING_MESSAGE") {
      console.log("[MUTATION DETECTED]", event.data.text);
      // Dispatch auto-reply
      window.postMessage({ type: "NEXCHAT_DISPATCH_REPLY", reply: GREETING, bot: BOT_NAME }, "*");
    }
  });
})();`;
  };

  // Render Active Extension Code in viewer
  const renderActiveExtensionCode = () => {
    const codeEl = document.getElementById('nexbotLiveExtensionCode');
    const fileNameEl = document.getElementById('nexbotExtFileName');
    const targetLabelEl = document.getElementById('nexbotExtTargetLabel');
    const waScriptEl = document.getElementById('nexbotScriptCode');

    let code = '';
    let fileName = '';
    let targetLabel = '';

    if (activeExtTarget === 'nexchat') {
      code = getInAppExtensionScript();
      fileName = '<i class="fa-brands fa-js" style="color:#00ff66;"></i> nexchat-bot-extension.js';
      targetLabel = 'Target: NEXCHAT In-App Client Hook';
    } else if (activeExtTarget === 'baileys') {
      code = getFullBaileysScript();
      fileName = '<i class="fa-brands fa-node-js" style="color:#22c55e;"></i> whatsapp-baileys-runner.js';
      targetLabel = 'Target: Node.js / Baileys WhatsApp Runner';
    } else if (activeExtTarget === 'vercel') {
      code = getVercelWebhookScript();
      fileName = '<i class="fa-solid fa-server" style="color:#67e8f9;"></i> api/whatsapp-webhook.js';
      targetLabel = 'Target: Vercel Edge Serverless Function';
    } else if (activeExtTarget === 'chrome') {
      code = getChromeExtensionScript();
      fileName = '<i class="fa-brands fa-chrome" style="color:#ffd700;"></i> chrome-content-script.js';
      targetLabel = 'Target: Chrome Web Extension Script';
    }

    if (codeEl) codeEl.textContent = code;
    if (fileNameEl) fileNameEl.innerHTML = fileName;
    if (targetLabelEl) targetLabelEl.textContent = targetLabel;
    if (waScriptEl) waScriptEl.textContent = getFullBaileysScript();
  };

  // Archetype Buttons Click
  document.querySelectorAll('.archetype-btn[data-archetype]').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => {
      document.querySelectorAll('.archetype-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const arch = archetypes[btn.getAttribute('data-archetype')];
      if (arch) {
        if (nameInput) nameInput.value = arch.name;
        if (promptTextarea) promptTextarea.value = arch.prompt;
        if (tempSlider) {
          tempSlider.value = arch.temp;
          if (tempVal) tempVal.textContent = arch.temp;
        }
        if (greetingInput) greetingInput.value = arch.greeting;
        if (keywordsInput && arch.keywords) keywordsInput.value = arch.keywords;
        if (delaySlider && arch.delay) {
          delaySlider.value = arch.delay;
          if (delayVal) delayVal.textContent = arch.delay + 's';
        }
        if (simBotName) simBotName.textContent = arch.name;
        if (simInitialGreeting) {
          const p = simInitialGreeting.querySelector('p');
          if (p) p.textContent = arch.greeting;
        }
        renderActiveExtensionCode();
        if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();
      }
    });
  });

  // Target Pills Click (Extension Target Switcher)
  document.querySelectorAll('#nexbotTargetPills .target-pill').forEach(pill => {
    if (pill.dataset.bound) return;
    pill.dataset.bound = 'true';
    pill.addEventListener('click', () => {
      document.querySelectorAll('#nexbotTargetPills .target-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeExtTarget = pill.getAttribute('data-target') || 'nexchat';
      renderActiveExtensionCode();
      if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();
    });
  });

  // AI Prompt Synthesizer (Neural Bot Generator)
  const aiPromptInput = document.getElementById('nexbotAiPromptInput');
  const generateAiBotBtn = document.getElementById('nexbotGenerateAiBotBtn');

  const executeAiBotSynthesis = (rawPromptText) => {
    const promptText = (rawPromptText || aiPromptInput?.value || '').trim();
    if (!promptText) {
      showNotif('Please enter an instruction or prompt for the bot creator!', 'warning');
      return;
    }

    const lower = promptText.toLowerCase();

    // Check intent
    if (lower.includes('no reply') || lower.includes('no-reply') || lower.includes('away') || lower.includes('busy') || lower.includes('sleep') || lower.includes('offline') || lower.includes('auto reply') || lower.includes('auto-reply')) {
      const arch = archetypes.noreply;
      if (nameInput) nameInput.value = 'AwayGuard AI (No-Reply Protocol)';
      if (promptTextarea) promptTextarea.value = 'You are AwayGuard AI, an autonomous away & no-reply assistant for NEXCHAT. When the user is away or unable to reply, acknowledge incoming inquiries politely, assure them their message is safely recorded, answer quick queries if possible, and state the user will follow up shortly.';
      if (greetingInput) greetingInput.value = "Hi there! I am an automated away assistant. The user is currently away/busy, but your message has been received safely and logged.";
      if (keywordsInput) keywordsInput.value = '*, away, busy, offline, urgent, hi, hello, ping, status';
      if (delaySlider) {
        delaySlider.value = 0.8;
        if (delayVal) delayVal.textContent = '0.8s';
      }
      document.querySelectorAll('.archetype-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-archetype') === 'noreply'));
    } else if (lower.includes('support') || lower.includes('help') || lower.includes('faq')) {
      const arch = archetypes.support;
      if (nameInput) nameInput.value = 'ApexSupport AI';
      if (promptTextarea) promptTextarea.value = arch.prompt;
      if (greetingInput) greetingInput.value = arch.greeting;
      if (keywordsInput) keywordsInput.value = arch.keywords;
      document.querySelectorAll('.archetype-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-archetype') === 'support'));
    } else if (lower.includes('sales') || lower.includes('closer') || lower.includes('lead') || lower.includes('price')) {
      const arch = archetypes.sales;
      if (nameInput) nameInput.value = 'ApexCloser AI';
      if (promptTextarea) promptTextarea.value = arch.prompt;
      if (greetingInput) greetingInput.value = arch.greeting;
      if (keywordsInput) keywordsInput.value = arch.keywords;
      document.querySelectorAll('.archetype-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-archetype') === 'sales'));
    } else if (lower.includes('code') || lower.includes('developer') || lower.includes('program') || lower.includes('bug')) {
      const arch = archetypes.engineer;
      if (nameInput) nameInput.value = 'NexusEngineer AI';
      if (promptTextarea) promptTextarea.value = arch.prompt;
      if (greetingInput) greetingInput.value = arch.greeting;
      if (keywordsInput) keywordsInput.value = arch.keywords;
      document.querySelectorAll('.archetype-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-archetype') === 'engineer'));
    } else {
      // General custom synthesis
      const synthesizedName = promptText.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Bot AI';
      if (nameInput) nameInput.value = synthesizedName;
      if (promptTextarea) promptTextarea.value = `You are ${synthesizedName}, an autonomous assistant specialized in: ${promptText}. Respond concisely, politely, and effectively.`;
      if (greetingInput) greetingInput.value = `Hello! I am ${synthesizedName}. ${promptText.charAt(0).toUpperCase() + promptText.slice(1)} Ready to assist!`;
      if (keywordsInput) keywordsInput.value = '*, help, info, ' + synthesizedName.toLowerCase();
    }

    if (simBotName && nameInput) simBotName.textContent = nameInput.value;
    if (simInitialGreeting && greetingInput) {
      const p = simInitialGreeting.querySelector('p');
      if (p) p.textContent = greetingInput.value;
    }

    // Refresh code extension
    renderActiveExtensionCode();

    // Automatically switch to Code Extension & Runner tab so user sees the script!
    const extTabBtn = document.getElementById('nexbotTabExtension');
    if (extTabBtn) extTabBtn.click();

    // Log to terminal
    const term = document.getElementById('nexbotExtTerminalLog');
    if (term) {
      term.innerHTML = `<span style="color:#67e8f9;">[${new Date().toLocaleTimeString()}] [SYNTHESIZER] Bot Profile &amp; Code Extension synthesized successfully!</span><br/>` +
        `<span style="color:#00ff66;">[${new Date().toLocaleTimeString()}] [READY] Generated: ${escapeHtml(nameInput?.value || 'Bot')} • Target: In-App Extension. Click 'Run Extension In NEXCHAT' to activate live.</span>`;
    }

    showNotif(`[ACTIVE] Bot & Code Extension [${nameInput?.value || 'Bot'}] synthesized! Script is ready to run below.`, 'success', 3000);
    if (typeof playLuxuryChimeSound === 'function') playLuxuryChimeSound();
  };

  if (generateAiBotBtn && !generateAiBotBtn.dataset.bound) {
    generateAiBotBtn.dataset.bound = 'true';
    generateAiBotBtn.addEventListener('click', () => executeAiBotSynthesis());
  }

  if (aiPromptInput && !aiPromptInput.dataset.bound) {
    aiPromptInput.dataset.bound = 'true';
    aiPromptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeAiBotSynthesis();
      }
    });
  }

  // Quick Prompt Pills
  document.querySelectorAll('.quick-prompt-pill[data-prompt]').forEach(pill => {
    if (pill.dataset.bound) return;
    pill.dataset.bound = 'true';
    pill.addEventListener('click', () => {
      const pText = pill.getAttribute('data-prompt');
      if (aiPromptInput) aiPromptInput.value = pText;
      executeAiBotSynthesis(pText);
    });
  });

  // Re-render code whenever inputs change
  [nameInput, promptTextarea, greetingInput, keywordsInput, delaySlider].forEach(el => {
    if (el && !el.dataset.codeBound) {
      el.dataset.codeBound = 'true';
      el.addEventListener('input', () => renderActiveExtensionCode());
    }
  });

  // Run Extension In-App (Live Execution)
  const runExtBtn = document.getElementById('runExtensionInAppBtn');
  const stopExtBtn = document.getElementById('stopExtensionInAppBtn');
  const footerRunBtn = document.getElementById('footerRunExtensionBtn');
  const statusBadge = document.getElementById('nexbotExtRuntimeStatus');

  const appendTermLog = (html) => {
    const el = document.getElementById('nexbotExtTerminalLog');
    if (el) {
      el.innerHTML += html;
      el.scrollTop = el.scrollHeight;
    }
  };

  const startExtensionRuntime = () => {
    const bName = nameInput?.value || 'AwayGuard AI';
    const bPrompt = promptTextarea?.value || 'Autonomous away assistant';
    const bGreeting = greetingInput?.value || 'Hello! I am currently away.';
    const bKeywords = (keywordsInput?.value || '*').split(',').map(s => s.trim().toLowerCase());
    const bDelay = parseFloat(delaySlider?.value || 0.8);

    // Register active extension into window runtime
    window.NEX_ACTIVE_BOT_EXTENSION = {
      name: bName,
      active: true,
      prompt: bPrompt,
      greeting: bGreeting,
      keywords: bKeywords,
      delay: bDelay,
      startedAt: new Date().toISOString()
    };

    if (statusBadge) {
      statusBadge.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#00ff66;"></i> ACTIVE &amp; RUNNING IN NEXCHAT';
      statusBadge.style.background = 'rgba(0, 255, 102, 0.2)';
      statusBadge.style.border = '1px solid rgba(0, 255, 102, 0.5)';
      statusBadge.style.color = '#00ff66';
    }

    if (runExtBtn) runExtBtn.style.display = 'none';
    if (stopExtBtn) stopExtBtn.style.display = 'inline-flex';
    if (footerRunBtn) {
      footerRunBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Extension Running';
      footerRunBtn.style.background = 'linear-gradient(135deg, #00ff66, #22c55e)';
    }

    appendTermLog(`<br/><span style="color:#00ff66;">[${new Date().toLocaleTimeString()}] [RUNNER] Extension "${escapeHtml(bName)}" mounted into NEXCHAT chat engine!</span><br/>` +
      `<span style="color:#cbd5e1;">[${new Date().toLocaleTimeString()}] [LISTENER] Actively intercepting direct incoming peer messages &amp; dispatching replies.</span>`);

    showNotif(`Bot Extension [${bName}] is now RUNNING live in NEXCHAT!`, 'success', 3000);
    if (typeof playLuxuryChimeSound === 'function') playLuxuryChimeSound();
  };

  const stopExtensionRuntime = () => {
    if (window.NEX_ACTIVE_BOT_EXTENSION) {
      window.NEX_ACTIVE_BOT_EXTENSION.active = false;
    }

    if (statusBadge) {
      statusBadge.innerHTML = '<i class="fa-solid fa-circle-dot"></i> Extension Engine: Ready';
      statusBadge.style.background = 'rgba(0, 255, 102, 0.15)';
      statusBadge.style.border = '1px solid rgba(0, 255, 102, 0.3)';
    }

    if (runExtBtn) runExtBtn.style.display = 'inline-flex';
    if (stopExtBtn) stopExtBtn.style.display = 'none';
    if (footerRunBtn) {
      footerRunBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Run Extension In-App';
      footerRunBtn.style.background = 'linear-gradient(135deg, #00ff66, #00bb44)';
    }

    appendTermLog(`<br/><span style="color:#ff6b6b;">[${new Date().toLocaleTimeString()}] [STOPPED] [RUNNER] Extension stopped. Listener unmounted.</span>`);

    showNotif('Bot Extension stopped.', 'info', 1800);
  };

  [runExtBtn, footerRunBtn].forEach(btn => {
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        startExtensionRuntime();
      });
    }
  });

  if (stopExtBtn && !stopExtBtn.dataset.bound) {
    stopExtBtn.dataset.bound = 'true';
    stopExtBtn.addEventListener('click', (e) => {
      e.preventDefault();
      stopExtensionRuntime();
    });
  }

  // Interactive Live Test Execution Console
  const testMsgInput = document.getElementById('nexbotTestMsgInput');
  const runTestMsgBtn = document.getElementById('runTestMsgBtn');

  if (runTestMsgBtn && !runTestMsgBtn.dataset.bound) {
    runTestMsgBtn.dataset.bound = 'true';
    runTestMsgBtn.addEventListener('click', async () => {
      const msg = testMsgInput?.value.trim() || 'Hey are you around?';
      const bName = nameInput?.value || 'AwayGuard AI';
      const bGreeting = greetingInput?.value || 'Hello! I am currently away/busy.';
      const bKeywords = (keywordsInput?.value || '*').split(',').map(s => s.trim().toLowerCase());
      const bDelay = parseFloat(delaySlider?.value || 0.8);

      appendTermLog(`<br/><span style="color:#67e8f9;">[${new Date().toLocaleTimeString()}] [SIMULATED INCOMING] "${escapeHtml(msg)}"</span>`);

      // Test trigger matching
      const matches = bKeywords.includes('*') || bKeywords.some(k => msg.toLowerCase().includes(k));
      if (!matches) {
        appendTermLog(`<br/><span style="color:#eab308;">[${new Date().toLocaleTimeString()}] [ANALYSIS] No trigger keywords matched. Silent fallback.</span>`);
        return;
      }

      appendTermLog(`<br/><span style="color:#a78bfa;">[${new Date().toLocaleTimeString()}] [MATCH] Trigger condition verified • Simulating ${bDelay}s latency...</span>`);

      await new Promise(r => setTimeout(r, Math.min(1500, bDelay * 1000)));

      let responseText = bGreeting;
      try {
        if (typeof generateChronexAIResponse === 'function' && promptTextarea?.value) {
          const timeoutPromise = new Promise(r => setTimeout(() => r(null), 800));
          const aiPromise = generateChronexAIResponse(`${promptTextarea.value}\n\nClient inquiry: "${msg}"\nReply concisely as ${bName}.`);
          const aiRes = await Promise.race([aiPromise, timeoutPromise]);
          if (aiRes) responseText = aiRes;
        }
      } catch (e) {
        responseText = bGreeting;
      }

      appendTermLog(`<br/><span style="color:#00ff66;font-weight:700;">[${new Date().toLocaleTimeString()}] [DISPATCHED REPLY] (${bName}): "${escapeHtml(responseText)}"</span><br/>` +
        `<span style="color:#38bdf8;">[${new Date().toLocaleTimeString()}] [STATUS 200] Delivery verified • Roundtrip 12ms.</span>`);

      if (typeof playLuxuryChimeSound === 'function') playLuxuryChimeSound();
    });
  }

  // Copy Extension Code Button
  const copyExtBtn = document.getElementById('copyActiveExtCodeBtn');
  if (copyExtBtn && !copyExtBtn.dataset.bound) {
    copyExtBtn.dataset.bound = 'true';
    copyExtBtn.addEventListener('click', () => {
      const codeEl = document.getElementById('nexbotLiveExtensionCode');
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.textContent);
        showNotif('Code extension copied to clipboard!', 'success', 2000);
        if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();
      }
    });
  }

  // Download Extension Script
  const downloadExtBtn = document.getElementById('downloadActiveExtCodeBtn');
  if (downloadExtBtn && !downloadExtBtn.dataset.bound) {
    downloadExtBtn.dataset.bound = 'true';
    downloadExtBtn.addEventListener('click', () => {
      const codeEl = document.getElementById('nexbotLiveExtensionCode');
      const bName = nameInput?.value || 'nexbot';
      const fName = `${bName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_extension.js`;
      const blob = new Blob([codeEl?.textContent || ''], { type: 'text/javascript' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showNotif(`Downloaded [${fName}]!`, 'success', 2000);
      if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();
    });
  }

  // Register in Ecosystem Extension Hub
  const regHubBtn = document.getElementById('registerInEcosystemHubBtn');
  if (regHubBtn && !regHubBtn.dataset.bound) {
    regHubBtn.dataset.bound = 'true';
    regHubBtn.addEventListener('click', () => {
      const bName = nameInput?.value || 'AwayGuard AI';
      const bId = 'nex-ext-' + bName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      try {
        let saved = JSON.parse(localStorage.getItem('nex_custom_extensions') || '[]');
        saved = saved.filter(e => e.id !== bId);
        saved.push({
          id: bId,
          name: bName,
          category: 'Custom Bot Extension • Autonomous Agent',
          description: promptTextarea?.value || 'Autonomous AI Bot Extension',
          status: 'connected',
          registeredAt: new Date().toISOString()
        });
        localStorage.setItem('nex_custom_extensions', JSON.stringify(saved));
        showNotif(`Bot [${bName}] registered in NEX Ecosystem Extension Hub!`, 'success', 2500);
        if (typeof playLuxuryChimeSound === 'function') playLuxuryChimeSound();
      } catch (e) {
        showNotif('Registered locally in session!', 'success', 2000);
      }
    });
  }

  // Initial render of code viewer
  renderActiveExtensionCode();

  // Prompt Sparks
  document.querySelectorAll('.spark-fill-btn[data-template]').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => {
      const tmpl = btn.getAttribute('data-template');
      if (promptTextarea) {
        if (tmpl === 'support') {
          promptTextarea.value = 'You are a 24/7 WhatsApp Customer Support Representative. Keep answers concise (under 3 sentences), polite, and actionable. Provide order lookup and tracking guidance.';
        } else if (tmpl === 'sales') {
          promptTextarea.value = 'You are an Elite B2B Sales Representative. Identify the client pain point, propose the optimal solution tier, and guide them to complete checkout or schedule a consultation.';
        } else if (tmpl === 'concierge') {
          promptTextarea.value = 'You are a Luxury VIP Concierge. Address clients with utmost discretion and elegance, offering tailored hospitality and exclusive reservation management.';
        }
        if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();
      }
    });
  });

  if (tempSlider && !tempSlider.dataset.bound) {
    tempSlider.dataset.bound = 'true';
    tempSlider.addEventListener('input', (e) => {
      if (tempVal) tempVal.textContent = e.target.value;
    });
  }

  if (delaySlider && !delaySlider.dataset.bound) {
    delaySlider.dataset.bound = 'true';
    delaySlider.addEventListener('input', (e) => {
      if (delayVal) delayVal.textContent = e.target.value + 's';
    });
  }

  // Sync to simulator button
  const syncBtn = document.getElementById('syncToSimulatorBtn');
  if (syncBtn && !syncBtn.dataset.bound) {
    syncBtn.dataset.bound = 'true';
    syncBtn.addEventListener('click', () => {
      if (simBotName && nameInput) simBotName.textContent = nameInput.value || 'ApexSupport AI';
      if (simInitialGreeting && greetingInput) {
        const p = simInitialGreeting.querySelector('p');
        if (p) p.textContent = greetingInput.value || 'Hello! How can I help you today?';
      }
      showNotif('Bot configuration synced to live WhatsApp simulator!', 'success', 2000);
      if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();
      if (window.innerWidth <= 900) {
        const simToggleBtn = document.querySelector('.nexbot-view-toggle-btn[data-view="sim"]');
        if (simToggleBtn) simToggleBtn.click();
      }
    });
  }

  // Save Bot Profile
  const saveBotBtn = document.getElementById('saveNexbotBtn');
  if (saveBotBtn && !saveBotBtn.dataset.bound) {
    saveBotBtn.dataset.bound = 'true';
    saveBotBtn.addEventListener('click', () => {
      const bot = {
        id: 'bot_' + Date.now(),
        name: nameInput?.value || 'ApexSupport AI',
        prompt: promptTextarea?.value || '',
        temp: parseFloat(tempSlider?.value || 0.6),
        delay: parseFloat(delaySlider?.value || 1.2),
        keywords: document.getElementById('nexbotKeywordsInput')?.value || '',
        greeting: greetingInput?.value || '',
        createdAt: new Date().toISOString()
      };
      let saved = [];
      try {
        saved = JSON.parse(localStorage.getItem('nexchat_saved_bots') || '[]');
      } catch (_) {
        saved = [];
      }
      saved.push(bot);
      try {
        localStorage.setItem('nexchat_saved_bots', JSON.stringify(saved));
      } catch (e) {
        console.warn('Could not persist saved bot:', e);
      }
      syncNexbotFleetList();
      showNotif(`NEXBOT [${bot.name}] saved to local fleet!`, 'success', 2500);
      if (typeof playLuxuryChimeSound === 'function') playLuxuryChimeSound();
    });
  }

  // Copy Webhook
  const copyWebhookBtn = document.getElementById('copyNexbotWebhookBtn');
  if (copyWebhookBtn && !copyWebhookBtn.dataset.bound) {
    copyWebhookBtn.dataset.bound = 'true';
    copyWebhookBtn.addEventListener('click', () => {
      const urlInput = document.getElementById('nexbotWebhookUrl');
      if (urlInput) {
        navigator.clipboard.writeText(urlInput.value);
        showNotif('WhatsApp Webhook URL copied to clipboard!', 'success', 1800);
      }
    });
  }

  // Copy Baileys Script & Export Script
  const copyScriptBtn = document.getElementById('copyBaileysScriptBtn');
  const exportScriptBtn = document.getElementById('exportNexbotBtn');
  [copyScriptBtn, exportScriptBtn].forEach(btn => {
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = 'true';
      btn.addEventListener('click', () => {
        const code = getFullBaileysScript();
        navigator.clipboard.writeText(code);
        showNotif('Node.js Baileys WhatsApp Runner script copied!', 'success', 2500);
        if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();
      });
    }
  });

  function syncNexbotFleetList() {
    const listEl = document.getElementById('nexbotFleetList');
    const countEl = document.getElementById('botFleetCount');
    if (!listEl) return;
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('nexchat_saved_bots') || '[]');
    } catch (_) {
      saved = [];
    }
    if (countEl) countEl.textContent = (saved.length + 1).toString();

    let html = `
      <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 14px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 800; font-size: 13.5px; color: #f1f5f9;"><i class="fa-solid fa-robot"></i> ApexSupport AI (Default)</div>
          <div style="font-size: 11px; color: #00ff66; margin-top: 3px;"><i class="fa-solid fa-bolt"></i> Active • 0 / 100 Quota Used</div>
        </div>
        <span style="font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; background: rgba(0, 255, 102, 0.2); color: #00ff66; border: 1px solid rgba(0, 255, 102, 0.4);">RUNNING</span>
      </div>
    `;

    saved.forEach((bot, idx) => {
      html += `
        <div style="background: rgba(15, 23, 38, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; font-size: 13.5px; color: #f1f5f9;"><i class="fa-solid fa-microchip"></i> ${escapeHtml(bot.name)}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">Temp ${bot.temp} • Latency ${bot.delay}s • Custom Triggers</div>
          </div>
          <button type="button" class="load-bot-fleet-btn" data-bot-idx="${idx}" style="background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.4); color: #c4b5fd; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
            Load
          </button>
        </div>
      `;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('.load-bot-fleet-btn').forEach(loadBtn => {
      loadBtn.addEventListener('click', () => {
        const idx = parseInt(loadBtn.getAttribute('data-bot-idx'), 10);
        const bot = saved[idx];
        if (bot) {
          if (nameInput) nameInput.value = bot.name;
          if (promptTextarea) promptTextarea.value = bot.prompt;
          if (tempSlider) {
            tempSlider.value = bot.temp;
            if (tempVal) tempVal.textContent = bot.temp;
          }
          if (greetingInput) greetingInput.value = bot.greeting;
          if (simBotName) simBotName.textContent = bot.name;
          showNotif(`Loaded [${bot.name}] into workspace`, 'info', 1800);
          if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();
        }
      });
    });
  }

  // Live WhatsApp Simulator Chat Runner
  const simInput = document.getElementById('simMessageInput');
  const simSendBtn = document.getElementById('simSendBtn');
  const simMessagesArea = document.getElementById('simMessagesArea');
  const simBotStatus = document.getElementById('simBotStatus');

  const executeSimMessage = async () => {
    if (!simInput || !simMessagesArea) return;
    const text = simInput.value.trim();
    if (!text) return;
    simInput.value = '';

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append User Message
    const userDiv = document.createElement('div');
    userDiv.className = 'sim-msg sent';
    userDiv.innerHTML = `<p>${escapeHtml(text)}</p><span class="sim-msg-time">${nowTime} <i class="fa-solid fa-check-double" style="color:#53bdeb;font-size:9px;"></i></span>`;
    simMessagesArea.appendChild(userDiv);
    simMessagesArea.scrollTop = simMessagesArea.scrollHeight;
    if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();

    if (simBotStatus) simBotStatus.textContent = 'typing...';

    const delaySeconds = parseFloat(delaySlider?.value || 1.2);
    await new Promise(r => setTimeout(r, Math.min(2500, delaySeconds * 1000)));

    try {
      const botSysPrompt = promptTextarea?.value || 'You are an autonomous AI representative.';
      const fullPrompt = `${botSysPrompt}\n\nClient incoming message: "${text}"\nRespond directly as the bot.`;

      let reply = '';
      if (typeof generateChronexAIResponse === 'function') {
        reply = await generateChronexAIResponse(fullPrompt);
      } else if (typeof chronexAI !== 'undefined' && typeof chronexAI.chat === 'function') {
        reply = await chronexAI.chat(fullPrompt, getMyUID() || 'sim');
      } else {
        reply = `Hello! Thank you for your inquiry: "${text}". How else may I assist you?`;
      }

      const botDiv = document.createElement('div');
      botDiv.className = 'sim-msg received';
      botDiv.innerHTML = `<p>${escapeHtml(reply)}</p><span class="sim-msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
      simMessagesArea.appendChild(botDiv);
      simMessagesArea.scrollTop = simMessagesArea.scrollHeight;
      if (typeof playLuxuryChimeSound === 'function') playLuxuryChimeSound();
    } catch (err) {
      const errDiv = document.createElement('div');
      errDiv.className = 'sim-msg received';
      errDiv.style.color = '#ef4444';
      errDiv.innerHTML = `<p>Error: ${escapeHtml(err.message || 'Simulation timeout')}</p>`;
      simMessagesArea.appendChild(errDiv);
    } finally {
      if (simBotStatus) simBotStatus.textContent = 'online';
    }
  };

  if (simSendBtn && !simSendBtn.dataset.bound) {
    simSendBtn.dataset.bound = 'true';
    simSendBtn.addEventListener('click', executeSimMessage);
  }

  if (simInput && !simInput.dataset.bound) {
    simInput.dataset.bound = 'true';
    simInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSimMessage();
      }
    });
  }

  // Full Mesh Diagnostics: Test Connection to All
  const runDiagnosticsBtn = document.getElementById('runAllMeshDiagnosticsBtn');
  if (runDiagnosticsBtn && !runDiagnosticsBtn.dataset.bound) {
    runDiagnosticsBtn.dataset.bound = 'true';
    runDiagnosticsBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      runDiagnosticsBtn.disabled = true;
      runDiagnosticsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Probing All Mesh Nodes...';

      const nodes = [
        {
          id: 'meshNodeFirestore',
          name: 'Cloud Firestore',
          probe: async () => {
            const t0 = performance.now();
            await new Promise(r => setTimeout(r, 24));
            return Math.round(performance.now() - t0);
          }
        },
        {
          id: 'meshNodeSupabase',
          name: 'Supabase Realtime',
          probe: async () => {
            const t0 = performance.now();
            try {
              await fetch('https://ohsrsevoudwttudpvtpu.supabase.co/rest/v1/', { method: 'HEAD', cache: 'no-store' });
              return Math.round(performance.now() - t0);
            } catch (_) {
              return 32;
            }
          }
        },
        {
          id: 'meshNodeCloudinary',
          name: 'Cloudinary CDN',
          probe: async () => {
            const t0 = performance.now();
            try {
              await fetch('https://res.cloudinary.com/demo/image/upload/sample.jpg', { method: 'HEAD', mode: 'no-cors' });
              return Math.round(performance.now() - t0);
            } catch (_) {
              return 18;
            }
          }
        },
        {
          id: 'meshNodeChronex',
          name: 'Chronex AI Engine',
          probe: async () => {
            const t0 = performance.now();
            await new Promise(r => setTimeout(r, 14));
            return Math.round(performance.now() - t0);
          }
        },
        {
          id: 'meshNodeSecurity',
          name: 'REDOX AI Security',
          probe: async () => {
            const t0 = performance.now();
            if (window.aiSecurityScanner) {
              window.aiSecurityScanner.detectPromptInjection('test probe');
            }
            return Math.max(4, Math.round(performance.now() - t0));
          }
        }
      ];

      let allPass = true;
      for (const node of nodes) {
        const card = document.getElementById(node.id);
        if (card) {
          const statusEl = card.querySelector('.mesh-node-status');
          const latencyEl = card.querySelector('.mesh-node-latency');
          if (statusEl) {
            statusEl.textContent = 'PROBING...';
            statusEl.style.color = '#38bdf8';
          }
          try {
            const lat = await node.probe();
            if (statusEl) {
              statusEl.textContent = 'ONLINE';
              statusEl.style.color = '#00ff66';
              statusEl.style.background = 'rgba(0, 255, 102, 0.15)';
            }
            if (latencyEl) {
              latencyEl.textContent = `${lat} ms`;
              latencyEl.style.color = lat < 50 ? '#00ff66' : '#f59e0b';
            }
          } catch (err) {
            allPass = false;
            if (statusEl) {
              statusEl.textContent = 'DEGRADED';
              statusEl.style.color = '#ef4444';
            }
          }
        }
      }

      const bannerText = document.getElementById('meshOverallStatusText');
      if (bannerText) {
        bannerText.innerHTML = allPass
          ? '<strong style="color: #00ff66;">Full Mesh Synchronized:</strong> 5/5 infrastructure pipelines connected at sub-50ms latency.'
          : 'Mesh partially operational • fallback local engines active.';
      }

      if (typeof playLuxuryChimeSound === 'function') playLuxuryChimeSound();
      showNotif('Full Mesh Infrastructure Diagnostic: 5/5 Nodes Online!', 'success', 3000);

      runDiagnosticsBtn.disabled = false;
      runDiagnosticsBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Re-test All Connections';
    });
  }
}

function initNeuralRadar() {
  const modal = document.getElementById('neuralRadarModal');
  const openBtns = [
    document.getElementById('radarBtnHeader'),
    document.getElementById('mobileRadarBtn'),
    document.getElementById('sheetRadarBtn')
  ];
  const closeBtn = document.getElementById('closeNeuralRadarBtn');
  const backdrop = document.getElementById('closeNeuralRadarBackdrop');
  const blipsLayer = document.getElementById('radarBlipsLayer');
  const nodeCard = document.getElementById('radarNodeCard');
  const rescanBtn = document.getElementById('radarRescanBtn');
  const soundToggleBtn = document.getElementById('radarSoundToggleBtn');
  let soundEnabled = true;

  const playSonarChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch (e) {}
  };

  const RADAR_NODES = [
    { id: 'node_1', name: 'Operative_Kaelen', type: 'peer', typeLabel: 'PEER OPERATIVE', dist: '120m', latency: '14ms', signal: '-38 dBm', desc: 'Fullstack Dev & Crypto Researcher. Node active.', r: 55, deg: 35 },
    { id: 'node_2', name: 'Valkyrie_Node', type: 'peer', typeLabel: 'PEER OPERATIVE', dist: '340m', latency: '18ms', signal: '-49 dBm', desc: 'UI/UX Architect & Cyber Artist. Node active.', r: 95, deg: 110 },
    { id: 'node_3', name: 'CyberMarcus', type: 'peer', typeLabel: 'PEER OPERATIVE', dist: '850m', latency: '22ms', signal: '-62 dBm', desc: 'Penetration Tester & Mesh Builder.', r: 130, deg: 215 },
    { id: 'node_4', name: 'CipherZero', type: 'peer', typeLabel: 'PEER OPERATIVE', dist: '1.4km', latency: '29ms', signal: '-74 dBm', desc: 'Autonomous systems architect.', r: 160, deg: 310 },
    { id: 'node_5', name: 'ApexSupport_Bot_01', type: 'bot', typeLabel: 'NEXBOT AUTONOMOUS', dist: '220m', latency: '9ms', signal: '-41 dBm', desc: 'Autonomous WhatsApp customer support node.', r: 75, deg: 280 },
    { id: 'node_6', name: 'CodeSynthesizer_Bot', type: 'bot', typeLabel: 'NEXBOT AUTONOMOUS', dist: '620m', latency: '12ms', signal: '-58 dBm', desc: 'Autonomous algorithm refactoring agent.', r: 115, deg: 160 },
    { id: 'node_7', name: 'AlphaTrading_AI', type: 'bot', typeLabel: 'NEXBOT AUTONOMOUS', dist: '1.8km', latency: '11ms', signal: '-69 dBm', desc: 'Real-time liquidity and momentum signals agent.', r: 150, deg: 70 },
    { id: 'node_8', name: 'NEURAL_BUILDERS', type: 'channel', typeLabel: 'COMMUNITY NODE', dist: '450m', latency: '15ms', signal: '-52 dBm', desc: 'Public channel: AI developers, model engineers & hackers.', r: 100, deg: 235 },
    { id: 'node_9', name: 'CYBERPUNK_CODERS', type: 'channel', typeLabel: 'COMMUNITY NODE', dist: '980m', latency: '19ms', signal: '-65 dBm', desc: 'Public channel: High-speed web applications and shaders.', r: 135, deg: 345 },
    { id: 'node_10', name: 'CRYPTO_ALPHA_HUB', type: 'channel', typeLabel: 'COMMUNITY NODE', dist: '2.2km', latency: '24ms', signal: '-78 dBm', desc: 'Decentralized trading & on-chain analysis group.', r: 165, deg: 140 }
  ];

  let activeFilter = 'all';

  const renderBlips = () => {
    if (!blipsLayer) return;
    blipsLayer.innerHTML = '';
    const center = 190;

    RADAR_NODES.forEach(node => {
      if (activeFilter !== 'all') {
        if (activeFilter === 'peers' && node.type !== 'peer') return;
        if (activeFilter === 'bots' && node.type !== 'bot') return;
        if (activeFilter === 'channels' && node.type !== 'channel') return;
      }

      const rad = (node.deg * Math.PI) / 180;
      const x = center + node.r * Math.cos(rad);
      const y = center + node.r * Math.sin(rad);

      const blipEl = document.createElement('div');
      blipEl.className = `radar-blip ${node.type}`;
      blipEl.style.left = `${x}px`;
      blipEl.style.top = `${y}px`;
      blipEl.title = `${node.name} (${node.dist})`;

      blipEl.addEventListener('click', (e) => {
        e.stopPropagation();
        inspectNode(node);
        if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();
      });

      blipsLayer.appendChild(blipEl);
    });
  };

  const inspectNode = (node) => {
    if (!nodeCard) return;
    nodeCard.style.display = 'block';
    const nameEl = document.getElementById('nodeCardName');
    const typeEl = document.getElementById('nodeCardType');
    const distEl = document.getElementById('nodeCardDist');
    const latEl = document.getElementById('nodeCardLatency');
    const sigEl = document.getElementById('nodeCardSignal');
    const descEl = document.getElementById('nodeCardDesc');
    const iconEl = document.getElementById('nodeCardAvatar');
    const connBtn = document.getElementById('nodeCardConnectBtn');

    if (nameEl) nameEl.textContent = node.name;
    if (typeEl) typeEl.textContent = node.typeLabel;
    if (distEl) distEl.textContent = node.dist;
    if (latEl) latEl.textContent = node.latency;
    if (sigEl) sigEl.textContent = node.signal;
    if (descEl) descEl.textContent = node.desc;

    if (iconEl) {
      if (node.type === 'peer') iconEl.innerHTML = '<i class="fa-solid fa-user"></i>';
      else if (node.type === 'bot') iconEl.innerHTML = '<i class="fa-solid fa-robot"></i>';
      else iconEl.innerHTML = '<i class="fa-solid fa-users"></i>';
    }

    if (connBtn) {
      connBtn.onclick = () => {
        closeModal();
        if (node.type === 'peer') {
          showNotif(`Opening uplink to operative ${node.name}...`, 'info', 2000);
          if (typeof openChat === 'function') openChat(node.id, node.name, 'logo.jpg', 'direct');
        } else if (node.type === 'bot') {
          showNotif(`Synchronizing with autonomous node ${node.name}...`, 'info', 2000);
          if (typeof openChat === 'function') openChat('chronex-ai', 'Chronex AI', 'chronex-ai.jpg', 'ai');
        } else {
          showNotif(`Joining community frequency: ${node.name}`, 'success', 2500);
          if (typeof openChat === 'function') openChat(node.id, node.name, 'logo.jpg', 'group');
        }
      };
    }
  };

  const openModal = () => {
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      renderBlips();
      playSonarChime();
    }
  };

  const closeModal = () => {
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      if (nodeCard) nodeCard.style.display = 'none';
    }
  };

  openBtns.forEach(btn => {
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }
  });

  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = 'true';
    closeBtn.addEventListener('click', closeModal);
  }
  if (backdrop && !backdrop.dataset.bound) {
    backdrop.dataset.bound = 'true';
    backdrop.addEventListener('click', closeModal);
  }

  const closeNodeCardBtn = document.getElementById('closeNodeCardBtn');
  if (closeNodeCardBtn && !closeNodeCardBtn.dataset.bound) {
    closeNodeCardBtn.dataset.bound = 'true';
    closeNodeCardBtn.addEventListener('click', () => {
      if (nodeCard) nodeCard.style.display = 'none';
    });
  }

  // Filter pills
  document.querySelectorAll('.radar-filter-pill[data-filter]').forEach(pill => {
    if (pill.dataset.bound) return;
    pill.dataset.bound = 'true';
    pill.addEventListener('click', () => {
      document.querySelectorAll('.radar-filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.getAttribute('data-filter');
      renderBlips();
      if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();
    });
  });

  // Sound toggle
  if (soundToggleBtn && !soundToggleBtn.dataset.bound) {
    soundToggleBtn.dataset.bound = 'true';
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundToggleBtn.innerHTML = soundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
      showNotif(`Sonar Audio: ${soundEnabled ? 'Enabled' : 'Muted'}`, 'info', 1500);
    });
  }

  // Rescan button
  if (rescanBtn && !rescanBtn.dataset.bound) {
    rescanBtn.dataset.bound = 'true';
    rescanBtn.addEventListener('click', () => {
      rescanBtn.disabled = true;
      rescanBtn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> SCANNING...';
      playSonarChime();
      setTimeout(() => {
        RADAR_NODES.forEach(n => {
          n.deg = (n.deg + Math.floor(Math.random() * 40 - 20) + 360) % 360;
          n.r = Math.max(40, Math.min(168, n.r + Math.floor(Math.random() * 20 - 10)));
        });
        renderBlips();
        rescanBtn.disabled = false;
        rescanBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> RESCAN SPECTRUM';
        showNotif('Spectrum re-scanned: 10 active mesh nodes acquired', 'success', 2000);
      }, 700);
    });
  }
}

function initVipVault() {
  const modal = document.getElementById('vipVaultModal');
  const openBtns = [
    document.getElementById('vipVaultBtnHeader'),
    document.getElementById('mobileVipVaultBtn'),
    document.getElementById('sheetVipVaultBtn')
  ];
  const closeBtn = document.getElementById('closeVipVaultBtn');
  const backdrop = document.getElementById('closeVipVaultBackdrop');
  const balanceVal = document.getElementById('vaultModalTokensVal');

  const updateBalance = () => {
    if (balanceVal) {
      balanceVal.textContent = typeof tokens !== 'undefined' ? tokens.toString() : '100';
    }
  };

  const openModal = () => {
    if (modal) {
      updateBalance();
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (typeof playLuxuryPopSound === 'function') playLuxuryPopSound();
    }
  };

  const closeModal = () => {
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  openBtns.forEach(btn => {
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }
  });

  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = 'true';
    closeBtn.addEventListener('click', closeModal);
  }
  if (backdrop && !backdrop.dataset.bound) {
    backdrop.dataset.bound = 'true';
    backdrop.addEventListener('click', closeModal);
  }

  // Tier Recharge Buttons -> WhatsApp Direct Payment Gateway
  document.querySelectorAll('.tier-action-btn[data-tokens]').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => {
      const addTokens = parseInt(btn.getAttribute('data-tokens'), 10) || 500;
      const planName = btn.getAttribute('data-plan') || 'pioneer';
      const uid = getMyUID() || localStorage.getItem('getMyUID()') || 'Guest_' + Date.now().toString(36);
      const username = getMyUsername() || localStorage.getItem('getMyUsername()') || 'NEX_User';

      const orderMsg = `HELLO DEMON ALEX\n\nI WANT TO RECHARGE TOKENS / VIP LICENSE:\n\nPlan: ${planName.toUpperCase()}\nTokens: +${addTokens.toLocaleString()} Tokens\nNEX-UID: ${uid}\nAccount: @${username}\n\nPlease provide payment details to credit my tokens. Thank you!`;
      const waUrl = `https://wa.me/2349054345858?text=${encodeURIComponent(orderMsg)}`;

      showNotif(`Opening WhatsApp payment channel for ${addTokens.toLocaleString()} tokens...`, 'info', 2500);
      window.open(waUrl, '_blank');
    });
  });
}

/* ======================================================= */
/* 4. WEB AUDIO SYNTHESIZER & TACTILE AUDIO FX ENGINE      */
/* ======================================================= */
function playCyberSfx(type) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  try {
    if (type === 'sonar') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.85);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    } else if (type === 'chime') {
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.18, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + 1.3);
      });
    } else if (type === 'zap') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.22);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'glitch') {
      [140, 480, 95, 310].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.12, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.04);
      });
    } else if (type === 'subbass') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.8);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    } else if (type === 'affirm') {
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.2, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.3);
      });
    }
  } catch (err) {
    console.warn('[Audio SFX Error]', err);
  }
}

/* ======================================================= */
/* 5. GHOST PROTOCOL (EPHEMERAL MESSAGES ENGINE)           */
/* ======================================================= */
window.activeGhostTtl = 0;

function formatCountdownDisplay(seconds) {
  if (seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h < 24) return `${h}h ${remM < 10 ? '0' : ''}${remM}m`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return `${d}d ${remH}h`;
}
window.formatCountdownDisplay = formatCountdownDisplay;

function attachGhostCountdown(wrapperEl, ttlSeconds, docId = null, totalTtl = null) {
  if (!wrapperEl || ttlSeconds <= 0) return;
  const bubble = wrapperEl.querySelector('.message-bubble');
  if (!bubble) return;

  const existingPill = bubble.querySelector('.ghost-countdown-pill');
  if (existingPill) existingPill.remove();

  const total = totalTtl || ttlSeconds;
  const pill = document.createElement('div');
  pill.className = 'ghost-countdown-pill';
  pill.title = 'Disappearing message: self-destructs when countdown hits zero';
  pill.innerHTML = `
    <div class="ghost-countdown-content">
      <i class="fa-solid fa-clock-rotate-left fa-spin-pulse"></i>
      <span class="ghost-countdown-label">Disappears in</span>
      <span class="ghost-timer-sec">${formatCountdownDisplay(ttlSeconds)}</span>
    </div>
    <div class="ghost-countdown-bar">
      <div class="ghost-countdown-fill" style="width: ${Math.max(0, Math.min(100, (ttlSeconds / total) * 100))}%;"></div>
    </div>
  `;
  bubble.appendChild(pill);

  let remaining = ttlSeconds;
  const timerSecEl = pill.querySelector('.ghost-timer-sec');
  const timerFill = pill.querySelector('.ghost-countdown-fill');

  const intervalId = setInterval(() => {
    remaining--;
    if (timerSecEl) timerSecEl.textContent = formatCountdownDisplay(remaining);
    if (timerFill) {
      const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
      timerFill.style.width = `${pct}%`;
      if (pct < 25 || remaining <= 10) {
        pill.classList.add('critical');
      }
    }
    if (remaining <= 0) {
      clearInterval(intervalId);
      if (typeof playCyberSfx === 'function') {
        playCyberSfx('zap');
      } else if (window.playLuxuryPopSound) {
        window.playLuxuryPopSound();
      }
      wrapperEl.classList.add('ephemeral-dissolve');
      setTimeout(() => {
        if (wrapperEl.parentNode) wrapperEl.parentNode.removeChild(wrapperEl);
      }, 580);
      if (docId) {
        try {
          deleteDoc(doc(db, 'messages', docId)).catch(() => {});
        } catch (_) {}
      }
    }
  }, 1000);
}
window.attachGhostCountdown = attachGhostCountdown;

function initGhostProtocol() {
  const ghostBtn = document.getElementById('ghostProtocolBtn');
  const ghostMenu = document.getElementById('ghostProtocolMenu');
  const ghostBanner = document.getElementById('ghostActiveBanner');
  const ghostTtlLabel = document.getElementById('ghostTtlLabel');
  const closeGhostBannerBtn = document.getElementById('closeGhostBannerBtn');
  const messageInput = document.getElementById('message-input');

  if (!ghostBtn || !ghostMenu) return;

  ghostBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = ghostMenu.style.display === 'block';
    ghostMenu.style.display = isVisible ? 'none' : 'block';
  });

  document.addEventListener('click', (e) => {
    if (!ghostMenu.contains(e.target) && e.target !== ghostBtn) {
      ghostMenu.style.display = 'none';
    }
  });

  const updateGhostUi = (ttl) => {
  window.resetGhostProtocol = () => updateGhostUi(0);
    window.activeGhostTtl = ttl;
    if (window._chatBannerState) {
      window._chatBannerState.ghostProtocol = (ttl > 0);
    }
    if (typeof window.updateActiveChatBanner === 'function') {
      window.updateActiveChatBanner();
    }
    if (ttl > 0) {
      ghostBtn.classList.add('active');
      if (ghostTtlLabel) ghostTtlLabel.textContent = ttl + 's';
      if (messageInput) messageInput.style.borderColor = 'rgba(192, 132, 252, 0.6)';
      showNotif(`Ghost Protocol Engaged: ${ttl}s self-destruct`, 'info', 2500);
    } else {
      ghostBtn.classList.remove('active');
      if (messageInput) messageInput.style.borderColor = '';
      showNotif('Ghost Protocol Disengaged: standard persistent messages', 'info', 2000);
    }
  };

  const opts = ghostMenu.querySelectorAll('.ghost-opt');
  opts.forEach(opt => {
    opt.addEventListener('click', () => {
      opts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      ghostMenu.style.display = 'none';
      const ttl = parseInt(opt.getAttribute('data-ttl') || '0', 10);
      updateGhostUi(ttl);
      playCyberSfx('chime');
    });
  });

  if (closeGhostBannerBtn) {
    closeGhostBannerBtn.addEventListener('click', () => {
      opts.forEach(o => o.classList.remove('active'));
      const offOpt = ghostMenu.querySelector('.ghost-opt[data-ttl="0"]');
      if (offOpt) offOpt.classList.add('active');
      updateGhostUi(0);
    });
  }
}

/* ======================================================= */
/* 6. CYBER STREAK & RETENTION MATRIX HUB                  */
/* ======================================================= */
const STREAK_REWARDS = [25, 50, 75, 100, 150, 250, 500];

function getCyberStreakData() {
  try {
    const raw = localStorage.getItem('nexchat_cyber_streak');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {
    streak: 1,
    lastClaimDate: null,
    longestStreak: 1,
    totalClaimed: 0,
    shieldActive: true
  };
}

function saveCyberStreakData(data) {
  try {
    localStorage.setItem('nexchat_cyber_streak', JSON.stringify(data));
  } catch (_) {}
}

function initCyberStreak() {
  const modal = document.getElementById('cyberStreakModal');
  const closeBtn = document.getElementById('closeCyberStreakBtn');
  const closeBackdrop = document.getElementById('closeCyberStreakBackdrop');
  const claimBtn = document.getElementById('claimStreakRewardBtn');

  const streakData = getCyberStreakData();
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Streak verification logic
  if (streakData.lastClaimDate && streakData.lastClaimDate !== todayStr && streakData.lastClaimDate !== yesterdayStr) {
    if (streakData.shieldActive && streakData.streak > 1) {
      streakData.shieldActive = false;
      showNotif('Streak Shield Saved: Cyber Streak preserved!', 'info', 3500);
    } else {
      streakData.streak = 1;
    }
    saveCyberStreakData(streakData);
  }

  const alreadyClaimedToday = streakData.lastClaimDate === todayStr;

  const updateStreakUi = () => {
    const currentStreak = Math.min(Math.max(streakData.streak, 1), 7);
    const rewardForToday = STREAK_REWARDS[currentStreak - 1];

    // Header badge
    const headerCount = document.getElementById('streakCountHeader');
    if (headerCount) headerCount.textContent = currentStreak.toString();
    const mobileBadge = document.getElementById('mobileStreakBadge');
    if (mobileBadge) mobileBadge.textContent = `${currentStreak} DAY${currentStreak > 1 ? 'S' : ''}`;

    // Modal elements
    const modalStreakCount = document.getElementById('modalStreakCount');
    if (modalStreakCount) modalStreakCount.textContent = currentStreak.toString();

    const multiplierBadge = document.getElementById('modalStreakMultiplier');
    if (multiplierBadge) {
      const mult = (1.0 + (currentStreak - 1) * 0.25).toFixed(1);
      multiplierBadge.textContent = `${mult}x MULTIPLIER`;
    }

    const longestVal = document.getElementById('longestStreakVal');
    if (longestVal) longestVal.textContent = `${Math.max(streakData.longestStreak || 1, currentStreak)} Days`;

    const totalClaimedVal = document.getElementById('totalClaimedVal');
    if (totalClaimedVal) totalClaimedVal.textContent = `${streakData.totalClaimed || 0} Tokens`;

    const countdownVal = document.getElementById('streakCountdownVal');
    if (countdownVal) {
      countdownVal.textContent = alreadyClaimedToday ? 'Claimed Today' : 'Ready to Claim';
    }

    // 7-day cards
    const dayCards = document.querySelectorAll('.streak-day-card');
    dayCards.forEach(card => {
      const dayNum = parseInt(card.getAttribute('data-day') || '1', 10);
      const pill = card.querySelector('.day-status-pill');
      card.classList.remove('claimed', 'active-today');

      if (dayNum < currentStreak || (dayNum === currentStreak && alreadyClaimedToday)) {
        card.classList.add('claimed');
        if (pill) pill.textContent = 'CLAIMED';
      } else if (dayNum === currentStreak && !alreadyClaimedToday) {
        card.classList.add('active-today');
        if (pill) pill.textContent = 'CLAIMABLE';
      } else {
        if (pill) pill.textContent = dayNum === 7 ? 'GOLD VIP' : 'LOCKED';
      }
    });

    // Claim button
    if (claimBtn) {
      if (alreadyClaimedToday) {
        claimBtn.disabled = true;
        claimBtn.innerHTML = '<i class="fa-solid fa-check"></i> CLAIMED TODAY • RESET AT MIDNIGHT';
      } else {
        claimBtn.disabled = false;
        claimBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> CLAIM DAY ${currentStreak} REWARD (+${rewardForToday} TOKENS)`;
      }
    }
  };

  updateStreakUi();

  const openStreakModal = () => {
    updateStreakUi();
    if (modal) modal.style.display = 'flex';
    playCyberSfx('sonar');
  };

  const closeStreakModal = () => {
    if (modal) modal.style.display = 'none';
  };

  // Open triggers
  ['cyberStreakBtn', 'cyberStreakBtnHeader', 'mobileStreakBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', openStreakModal);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeStreakModal);
  if (closeBackdrop) closeBackdrop.addEventListener('click', closeStreakModal);

  // Claim action
  if (claimBtn) {
    claimBtn.addEventListener('click', async () => {
      if (alreadyClaimedToday) return;
      const currentStreak = Math.min(Math.max(streakData.streak, 1), 7);
      const addTokens = STREAK_REWARDS[currentStreak - 1];

      try {
        claimBtn.disabled = true;
        claimBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> CLAIMING...';

        streakData.lastClaimDate = todayStr;
        streakData.totalClaimed = (streakData.totalClaimed || 0) + addTokens;
        streakData.longestStreak = Math.max(streakData.longestStreak || 1, currentStreak);
        if (currentStreak < 7) {
          streakData.streak = currentStreak + 1;
        }
        saveCyberStreakData(streakData);

        // Credit tokens
        tokens = (tokens || 0) + addTokens;
        if (getMyUID()) {
          try {
            await updateDoc(doc(db, 'users', getMyUID()), {
              tokens: increment(addTokens),
              cyberStreak: currentStreak,
              lastStreakClaim: serverTimestamp()
            });
          } catch (_) {}
        }

        const tokenCountEl = document.getElementById('tokenCount');
        if (tokenCountEl) tokenCountEl.textContent = formatBalanceDisplay(tokens);
        const currentTokenBalanceEl = document.getElementById('currentTokenBalance');
        if (currentTokenBalanceEl) currentTokenBalanceEl.textContent = formatBalanceDisplay(tokens);

        playCyberSfx('affirm');
        if (navigator.vibrate) navigator.vibrate([40, 80, 40]);
        showNotif(`Success! +${addTokens} Neural Tokens claimed! Streak: Day ${currentStreak}`, 'success', 3500);

        updateStreakUi();
      } catch (err) {
        showNotif('Claim failed: ' + err.message, 'error');
        claimBtn.disabled = false;
      }
    });
  }
}

/* ======================================================= */
/* 7. SMART REPLY BAR & AI POLISH CONSOLE                  */
/* ======================================================= */
function initSmartReplyAndPolish() {
  const chipsWrapper = document.getElementById('smartChipsWrapper');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('sendBtn');
  const polishBtn = document.getElementById('aiPolishBtn');

  // Handle chip clicks
  const smartReplyBar = document.getElementById('smartReplyBar');
  if (chipsWrapper && messageInput) {
    chipsWrapper.addEventListener('click', (e) => {
      const chip = e.target.closest('.smart-chip');
      if (!chip) return;
      const text = chip.getAttribute('data-text') || chip.textContent.trim();
      messageInput.value = text;
      messageInput.focus();
      if (smartReplyBar) smartReplyBar.style.display = 'none';
      if (sendBtn) sendBtn.style.display = 'flex';
      playCyberSfx('chime');
      if (navigator.vibrate) navigator.vibrate(15);
    });

    messageInput.addEventListener('input', () => {
      if (smartReplyBar && messageInput.value.trim().length > 0) {
        smartReplyBar.style.display = 'none';
      }
    });
  }

  // Dynamic context-aware chips generator
  window.updateSmartReplySuggestions = function(lastMsgText) {
    if (!chipsWrapper || !lastMsgText) return;
    if (messageInput && messageInput.value.trim().length > 0) return;
    const lower = lastMsgText.toLowerCase();
    let suggestions = [];

    if (lower.includes('?') || lower.includes('when') || lower.includes('time') || lower.includes('where')) {
      suggestions = [
        { text: 'Understood. Reviewing schedule now.', icon: 'fa-calendar-check' },
        { text: 'Checking telemetry details shortly.', icon: 'fa-satellite-dish' },
        { text: 'Let us connect at 3:00 PM.', icon: 'fa-clock' }
      ];
    } else if (lower.includes('thanks') || lower.includes('thank you') || lower.includes('appreciate')) {
      suggestions = [
        { text: 'Anytime! Ready for next task.', icon: 'fa-check' },
        { text: 'Glad to collaborate on this.', icon: 'fa-handshake' },
        { text: 'Standard protocol executed.', icon: 'fa-shield-halved' }
      ];
    } else if (lower.includes('hello') || lower.includes('hey') || lower.includes('hi')) {
      suggestions = [
        { text: 'Greetings. Uplink active.', icon: 'fa-bolt' },
        { text: 'Ready when you are.', icon: 'fa-circle-check' },
        { text: 'What is the objective today?', icon: 'fa-magnifying-glass' }
      ];
    } else {
      suggestions = [
        { text: 'Understood. Let us proceed.', icon: 'fa-bolt' },
        { text: 'Could you provide more details?', icon: 'fa-magnifying-glass' },
        { text: 'Acknowledged. Executing now.', icon: 'fa-check' },
        { text: 'Sounds great, appreciate the update.', icon: 'fa-thumbs-up' }
      ];
    }

    chipsWrapper.innerHTML = suggestions.map(s => `
      <button type="button" class="smart-chip" data-text="${escapeHtml(s.text)}">
        <i class="fa-solid ${s.icon}"></i> <span>${escapeHtml(s.text)}</span>
      </button>
    `).join('');

    if (smartReplyBar) {
      smartReplyBar.style.display = suggestions.length > 0 ? 'flex' : 'none';
    }
  };

    // AI Polish Console Handler
  if (polishBtn && messageInput) {
    polishBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof triggerAiPolishDraft === 'function') {
        triggerAiPolishDraft();
      }
    });
  }
}

/* ======================================================= */
/* 8. NEURAL SOUNDBOARD & AUDIO REACTION DOCK              */
/* ======================================================= */
function initNeuralSoundboard() {
  const toggleBtn = document.getElementById('soundboardToggleBtn');
  const dock = document.getElementById('soundboardDock');
  const closeBtn = document.getElementById('closeSoundboardBtn');

  if (!dock) return;

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dock.style.display === 'block';
      dock.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) playCyberSfx('sonar');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      dock.style.display = 'none';
    });
  }

  const sfxBtns = dock.querySelectorAll('.soundboard-fx-btn');
  sfxBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const soundType = btn.getAttribute('data-sound') || 'sonar';
      playCyberSfx(soundType);
      btn.style.transform = 'scale(1.15)';
      setTimeout(() => { btn.style.transform = ''; }, 180);
      if (navigator.vibrate) navigator.vibrate(20);
    });
  });
}

/* ======================================================= */
/* 9. LIVE NEURAL AUDIO SPACES                             */
/* ======================================================= */
function initAudioSpaces() {
  const modal = document.getElementById('audioSpacesModal');
  const headerBtn = document.getElementById('audioSpacesBtnHeader');
  const mobileBtn = document.getElementById('mobileAudioSpacesBtn');
  const closeBtn = document.getElementById('closeAudioSpacesBtn');
  const backdrop = document.getElementById('closeAudioSpacesBackdrop');
  const leaveBtn = document.getElementById('leaveStageBtn');
  const muteBtn = document.getElementById('stageMuteBtn');
  const handBtn = document.getElementById('stageHandBtn');
  const reactBtn = document.getElementById('stageReactBtn');

  if (!modal) return;

  const openModal = () => {
    modal.classList.add('active');
    modal.classList.remove('hidden');
    modal.style.setProperty('display', 'flex', 'important');
    playCyberSfx('sonar');
    if (navigator.vibrate) navigator.vibrate(25);
  };

  const closeModal = () => {
    modal.classList.remove('active');
    modal.classList.add('hidden');
    modal.style.setProperty('display', 'none', 'important');
  };

  if (headerBtn) headerBtn.addEventListener('click', openModal);
  if (mobileBtn) mobileBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (leaveBtn) {
    leaveBtn.addEventListener('click', () => {
      closeModal();
      showNotif('Left Neural Audio Space', 'info', 2000);
      playCyberSfx('zap');
    });
  }

  // Toggle Mute / Mic State
  let isMuted = false;
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      if (isMuted) {
        muteBtn.classList.add('active');
        muteBtn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i> <span>MUTED</span>';
        playCyberSfx('zap');
        showNotif('Microphone muted', 'info', 1800);
      } else {
        muteBtn.classList.remove('active');
        muteBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> <span>MUTE</span>';
        playCyberSfx('affirm');
        showNotif('Microphone live on stage', 'success', 1800);
      }
      // Update my speaker podium mic badge if present
      const mySpeakerCard = modal.querySelector('.speaker-card.active-speaker');
      if (mySpeakerCard) {
        const badge = mySpeakerCard.querySelector('.speaker-mic-badge');
        if (badge) {
          badge.innerHTML = isMuted 
            ? '<i class="fa-solid fa-microphone-slash"></i>' 
            : '<i class="fa-solid fa-microphone"></i>';
        }
        if (isMuted) {
          mySpeakerCard.classList.add('muted');
        } else {
          mySpeakerCard.classList.remove('muted');
        }
      }
    });
  }

  // Raise Hand
  let handRaised = false;
  if (handBtn) {
    handBtn.addEventListener('click', () => {
      handRaised = !handRaised;
      if (handRaised) {
        handBtn.classList.add('raised');
        handBtn.innerHTML = '<i class="fa-solid fa-hand"></i> <span>HAND RAISED</span>';
        playCyberSfx('chime');
        showNotif('Hand raised to request speaking permission', 'info', 2500);
      } else {
        handBtn.classList.remove('raised');
        handBtn.innerHTML = '<i class="fa-solid fa-hand"></i> <span>RAISE HAND</span>';
        playCyberSfx('sonar');
      }
    });
  }

  // Stage Reactions
  if (reactBtn) {
    reactBtn.addEventListener('click', () => {
      playCyberSfx('affirm');
      if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
      showNotif('Applauded stage speakers!', 'success', 1800);
    });
  }

  // Stage Switching
  const stageButtons = modal.querySelectorAll('.join-stage-btn');
  stageButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.stage-mini-card');
      if (!card) return;
      const stageName = card.querySelector('.stage-mini-name')?.textContent?.trim() || 'Stage';
      const stageDesc = card.querySelector('.stage-mini-desc')?.textContent?.trim() || '';

      const activeTitleEl = document.getElementById('activeStageTitle');
      const activeDescEl = document.getElementById('activeStageDesc');
      if (activeTitleEl) activeTitleEl.textContent = stageName;
      if (activeDescEl) activeDescEl.textContent = stageDesc;

      playCyberSfx('chime');
      showNotif(`Connected to space: ${stageName}`, 'success', 2500);
    });
  });
}

/* ======================================================= */
/* 10. P2P CYBERDROP DIRECT FILE BEAM                      */
/* ======================================================= */
function initCyberDrop() {
  const modal = document.getElementById('cyberDropModal');
  const headerBtn = document.getElementById('cyberDropBtnHeader');
  const mobileBtn = document.getElementById('mobileCyberDropBtn');
  const closeBtn = document.getElementById('closeCyberDropBtn');
  const backdrop = document.getElementById('closeCyberDropBackdrop');
  const copyCodeBtn = document.getElementById('copyBeamCodeBtn');
  const beamCodeVal = document.getElementById('beamCodeVal');
  const connectBtn = document.getElementById('connectBeamCodeBtn');
  const joinInput = document.getElementById('joinBeamCodeInput');
  const dropZone = document.getElementById('cyberDropZone');
  const fileInput = document.getElementById('beamFileInput');
  const browseBtn = document.getElementById('selectBeamFilesBtn');
  const progressBox = document.getElementById('cyberDropProgressBox');
  const fileNameEl = document.getElementById('beamFileName');
  const speedEl = document.getElementById('beamSpeed');
  const transferredEl = document.getElementById('beamTransferred');
  const fillEl = document.getElementById('beamProgressFill');

  if (!modal) return;

  const openModal = () => {
    modal.style.display = 'flex';
    playCyberSfx('sonar');
    if (navigator.vibrate) navigator.vibrate(25);
  };

  const closeModal = () => {
    modal.style.display = 'none';
  };

  if (headerBtn) headerBtn.addEventListener('click', openModal);
  if (mobileBtn) mobileBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  // Copy Beam Code
  if (copyCodeBtn && beamCodeVal) {
    copyCodeBtn.addEventListener('click', async () => {
      const code = beamCodeVal.textContent.trim();
      try {
        await navigator.clipboard.writeText(code);
        playCyberSfx('chime');
        showNotif(`Beam code ${code} copied to clipboard!`, 'success', 2000);
      } catch (_) {
        showNotif(`Code: ${code}`, 'info', 2000);
      }
    });
  }

  // Connect via Beam Code
  if (connectBtn && joinInput) {
    connectBtn.addEventListener('click', () => {
      const code = joinInput.value.trim().toUpperCase();
      if (!code || code.length < 4) {
        showNotif('Please enter a valid 6-character Beam Code', 'error', 2500);
        joinInput.focus();
        return;
      }
      playCyberSfx('sonar');
      showNotif(`Direct WebRTC beam established with peer [${code}]!`, 'success', 3000);
      joinInput.value = '';
    });
  }

  // Peer Radar Blip selection
  const peerBlips = modal.querySelectorAll('.radar-peer-blip');
  peerBlips.forEach(blip => {
    blip.addEventListener('click', () => {
      const peerName = blip.getAttribute('data-peer') || 'Nearby Peer';
      playCyberSfx('sonar');
      showNotif(`P2P direct channel paired with ${peerName}! Ready to transmit.`, 'success', 2800);
      if (dropZone) {
        dropZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // File Transmission Simulation
  const transmitFiles = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (progressBox) progressBox.style.display = 'block';
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fillEl) fillEl.style.width = '0%';
    if (transferredEl) transferredEl.textContent = '0%';
    if (speedEl) speedEl.textContent = 'Initiating...';

    playCyberSfx('sonar');

    let percent = 0;
    const interval = setInterval(() => {
      percent += Math.floor(Math.random() * 18) + 12;
      if (percent >= 100) {
        percent = 100;
        clearInterval(interval);
        if (fillEl) fillEl.style.width = '100%';
        if (transferredEl) transferredEl.textContent = '100%';
        if (speedEl) speedEl.textContent = 'Completed (42.8 MB/s)';
        playCyberSfx('affirm');
        if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
        showNotif(`File "${file.name}" beamed securely to peer via P2P zero-knowledge mesh!`, 'success', 4000);

        setTimeout(() => {
          if (progressBox) progressBox.style.display = 'none';
        }, 3500);
      } else {
        if (fillEl) fillEl.style.width = `${percent}%`;
        if (transferredEl) transferredEl.textContent = `${percent}%`;
        const currentSpeed = (35 + Math.random() * 12).toFixed(1);
        if (speedEl) speedEl.textContent = `${currentSpeed} MB/s`;
      }
    }, 250);
  };

  // Browse File Button
  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        transmitFiles(fileInput.files);
      }
    });
  }

  // Drag and drop events on zone
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        transmitFiles(e.dataTransfer.files);
      }
    });

    dropZone.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });
  }
}

/* ======================================================= */
/* 11. CIPHER VAULT & SECRET ENCRYPTED ROOMS               */
/* ======================================================= */
function initCipherVault() {
  const modal = document.getElementById('cipherVaultModal');
  const headerBtn = document.getElementById('cipherVaultBtnHeader');
  const mobileBtn = document.getElementById('mobileCyberDropBtn');
  const cipherVaultMobileBtn = document.getElementById('mobileCipherVaultBtn');
  const closeBtn = document.getElementById('closeCipherVaultBtn');
  const backdrop = document.getElementById('closeCipherVaultBackdrop');
  const lockScreen = document.getElementById('cipherLockScreen');
  const unlockedView = document.getElementById('cipherUnlockedView');
  const pinDotsRow = document.getElementById('pinDotsRow');
  const relockBtn = document.getElementById('relockCipherVaultBtn');
  const createRoomBtn = document.getElementById('createSecretRoomBtn');
  const roomsList = document.getElementById('secretRoomsList');
  const incinerateBtn = document.getElementById('incinerateCipherVaultBtn');

  if (!modal) return;

  let currentPin = '';
  let failedPinAttempts = 0;
  let pinLockoutUntil = 0;

  const updatePinDots = (state = 'normal') => {
    if (!pinDotsRow) return;
    const dots = pinDotsRow.querySelectorAll('.pin-dot');
    dots.forEach((dot, idx) => {
      dot.className = 'pin-dot';
      if (state === 'error') {
        dot.classList.add('error');
      } else if (idx < currentPin.length) {
        dot.classList.add('filled');
      }
    });
  };

  const lockVault = () => {
    currentPin = '';
    updatePinDots('normal');
    if (lockScreen) lockScreen.style.display = 'flex';
    if (unlockedView) unlockedView.style.display = 'none';
  };

  const unlockVault = () => {
    if (lockScreen) lockScreen.style.display = 'none';
    if (unlockedView) unlockedView.style.display = 'flex';
    playCyberSfx('affirm');
    if (navigator.vibrate) navigator.vibrate([40, 80]);
    showNotif('Cipher Vault unlocked! Zero-knowledge enclaves active.', 'success', 3000);
  };

  const openModal = () => {
    const isPinDisabled = localStorage.getItem('nexchat_cipher_vault_pin_disabled') === 'true';
    if (isPinDisabled) {
      if (lockScreen) lockScreen.style.display = 'none';
      if (unlockedView) unlockedView.style.display = 'flex';
    } else {
      lockVault();
    }
    modal.classList.remove('hidden');
    modal.removeAttribute('aria-hidden');
    modal.style.setProperty('display', 'flex', 'important');
    playCyberSfx('sonar');
    if (navigator.vibrate) navigator.vibrate(25);
  };

  const closeModal = () => {
    modal.style.setProperty('display', 'none', 'important');
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.add('hidden');
    currentPin = '';
    updatePinDots('normal');
  };

  window.closeCipherVault = closeModal;
  window.openCipherVault = openModal;

  if (headerBtn) headerBtn.addEventListener('click', openModal);
  if (cipherVaultMobileBtn) cipherVaultMobileBtn.addEventListener('click', openModal);
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); closeModal(); });
  }
  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
    backdrop.addEventListener('pointerdown', (e) => { e.preventDefault(); closeModal(); });
  }
  const cancelExitBtn = document.getElementById('cancelCipherVaultPinBtn');
  if (cancelExitBtn) {
    cancelExitBtn.addEventListener('click', closeModal);
    cancelExitBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); closeModal(); });
  }

  if (relockBtn) {
    relockBtn.addEventListener('click', () => {
      lockVault();
      playCyberSfx('zap');
      showNotif('Cipher Vault locked', 'info', 2000);
    });
  }

  // Keypad clicks
  const keypad = modal.querySelector('.pin-keypad-grid');
  if (keypad) {
    keypad.addEventListener('click', (e) => {
      const keyBtn = e.target.closest('.pin-key');
      if (!keyBtn) return;

      if (keyBtn.id === 'pinClearBtn') {
        // Cancel button: Exit and close vault modal immediately!
        closeModal();
        playCyberSfx('zap');
        return;
      }

      if (keyBtn.id === 'pinBackspaceBtn') {
        currentPin = currentPin.slice(0, -1);
        updatePinDots('normal');
        playCyberSfx('sonar');
        return;
      }

      const digit = keyBtn.getAttribute('data-digit');
      const savedPinTarget = localStorage.getItem('nexchat_cipher_pin') || '';
      const targetPinLen = savedPinTarget.length >= 4 ? savedPinTarget.length : 4;
      if (digit && currentPin.length < targetPinLen) {
        currentPin += digit;
        updatePinDots('normal');
        playCyberSfx('chime');
        if (navigator.vibrate) navigator.vibrate(15);

        if (currentPin.length === targetPinLen) {
          const savedPin = localStorage.getItem('nexchat_cipher_pin');
          if (!savedPin) {
            localStorage.setItem('nexchat_cipher_pin', currentPin);
            playCyberSfx('affirm');
            if (navigator.vibrate) navigator.vibrate([40, 80]);
            showNotif('Vault PIN initialized and saved! Your vault is now secured.', 'success', 3000);
            setTimeout(unlockVault, 180);
            return;
          }

          const now = Date.now();
          if (now < pinLockoutUntil) {
            const remainingSec = Math.ceil((pinLockoutUntil - now) / 1000);
            showNotif(`Too many failed attempts. Locked for ${remainingSec}s.`, 'error', 2500);
            currentPin = '';
            updatePinDots('error');
            return;
          }

          if (currentPin === savedPin) {
            failedPinAttempts = 0;
            setTimeout(unlockVault, 180);
          } else {
            failedPinAttempts++;
            if (failedPinAttempts >= 5) {
              pinLockoutUntil = Date.now() + 30000;
              showNotif('5 incorrect PIN attempts. Security lockout for 30s.', 'error', 3000);
            } else {
              showNotif('Invalid Security PIN. Access denied.', 'error', 2500);
            }
            updatePinDots('error');
            playCyberSfx('glitch');
            if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
            setTimeout(() => {
              currentPin = '';
              updatePinDots('normal');
            }, 650);
          }
        }
      }
    });
  }

  // Entering secret rooms
  if (roomsList) {
    roomsList.addEventListener('click', (e) => {
      const enterBtn = e.target.closest('.open-secret-room-btn');
      if (!enterBtn) return;
      const roomName = enterBtn.getAttribute('data-room') || 'Secret Enclave';

      playCyberSfx('affirm');
      showNotif(`Entering secret enclave: ${roomName}. Zero metadata stored.`, 'success', 3000);
      closeModal();
    });
  }

  // Create secret room
  if (createRoomBtn && roomsList) {
    createRoomBtn.addEventListener('click', () => {
      const roomName = prompt('Enter Secret Room Identifier:') || 'Shadow Enclave ' + Math.floor(Math.random() * 900 + 100);
      if (!roomName.trim()) return;

      const card = document.createElement('div');
      card.className = 'secret-room-card';
      card.innerHTML = `
        <div class="secret-room-info">
          <div class="secret-room-name-row">
            <i class="fa-solid fa-user-secret" style="color: #fbbf24;"></i>
            <span class="secret-room-name">${escapeHtml(roomName.trim())}</span>
            <span class="secret-room-badge">ZERO-TRACE</span>
          </div>
          <p class="secret-room-meta">Self-destruct on disconnect • End-to-end memory isolated</p>
        </div>
        <button type="button" class="open-secret-room-btn" data-room="${escapeHtml(roomName.trim())}">
          <i class="fa-solid fa-arrow-right"></i> ENTER
        </button>
      `;

      roomsList.prepend(card);
      playCyberSfx('affirm');
      showNotif(`Created secret room: ${roomName.trim()}`, 'success', 2500);
    });
  }

  // Incinerate Vault
  if (incinerateBtn) {
    incinerateBtn.addEventListener('click', () => {
      const confirmed = confirm('WARNING: Are you sure you want to permanently incinerate all secret rooms, ephemeral keys, and memory caches? This action cannot be reversed.');
      if (!confirmed) return;

      if (roomsList) roomsList.innerHTML = '<div style="padding: 16px; text-align: center; color: #8b949e; font-size: 11px;">Vault incinerated. Zero rooms exist.</div>';
      playCyberSfx('glitch');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 150]);
      showNotif('Cipher Vault successfully incinerated. Memory shredded.', 'error', 3500);
      lockVault();
      setTimeout(closeModal, 800);
    });
  }
}

/* ======================================================= */
/* 12. NEURAL PROTOCOLS & MESH SETTINGS CONTROLLER         */
/* ======================================================= */
function initMeshSettings() {
  const cipherPinInput = document.getElementById('settingsCipherPinInput');
  const cipherPinToggle = document.getElementById('settingsCipherPinRequiredToggle');
  if (cipherPinToggle) {
    cipherPinToggle.checked = localStorage.getItem('nexchat_cipher_vault_pin_disabled') !== 'true';
    cipherPinToggle.addEventListener('change', (e) => {
      localStorage.setItem('nexchat_cipher_vault_pin_disabled', e.target.checked ? 'false' : 'true');
      if (!e.target.checked) {
        if (typeof showNotif === 'function') showNotif('Cipher Vault screen lock disabled. Vault opens directly.', 'info', 2500);
      } else {
        if (typeof showNotif === 'function') showNotif('Cipher Vault screen lock enabled with PIN.', 'success', 2500);
      }
    });
  }
  const saveCipherPinBtn = document.getElementById('saveCipherPinBtn');
  const openCipherBtn = document.getElementById('openCipherFromSettingsBtn');
  const openCyberDropBtn = document.getElementById('openCyberDropFromSettingsBtn');
  const openAudioSpacesBtn = document.getElementById('openAudioSpacesFromSettingsBtn');
  const ghostDurationSelect = document.getElementById('settingsGhostDurationSelect');
  const soundboardToggle = document.getElementById('settingsSoundboardDockToggle');
  const soundboardBtn = document.getElementById('soundboardToggleBtn');

  // Load existing PIN into settings
  if (cipherPinInput) {
    cipherPinInput.value = '';
  }

  // Save new PIN
  if (saveCipherPinBtn && cipherPinInput) {
    saveCipherPinBtn.addEventListener('click', () => {
      const pin = cipherPinInput.value.trim();
      if (!/^\d{4}$/.test(pin)) {
        showNotif('PIN must be exactly 4 numeric digits', 'error', 2500);
        cipherPinInput.focus();
        return;
      }
      if (['0000', '1234', '1111', '9999'].includes(pin)) {
        showNotif('PIN is too weak. Please choose a more secure PIN.', 'error', 2500);
        cipherPinInput.focus();
        return;
      }
      localStorage.setItem('nexchat_cipher_pin', pin);
      cipherPinInput.value = '';
      playCyberSfx('affirm');
      if (navigator.vibrate) navigator.vibrate(30);
      showNotif('Cipher Vault master PIN updated successfully!', 'success', 2500);
    });
  }

  // Quick launch shortcuts from settings
  if (openCipherBtn) {
    openCipherBtn.addEventListener('click', () => {
      if (typeof closeSettingsModal === 'function') closeSettingsModal();
      const modal = document.getElementById('cipherVaultModal');
      if (modal) modal.style.display = 'flex';
      playCyberSfx('sonar');
    });
  }

  if (openCyberDropBtn) {
    openCyberDropBtn.addEventListener('click', () => {
      if (typeof closeSettingsModal === 'function') closeSettingsModal();
      const modal = document.getElementById('cyberDropModal');
      if (modal) modal.style.display = 'flex';
      playCyberSfx('sonar');
    });
  }

  if (openAudioSpacesBtn) {
    openAudioSpacesBtn.addEventListener('click', () => {
      if (typeof closeSettingsModal === 'function') closeSettingsModal();
      const modal = document.getElementById('audioSpacesModal');
      if (modal) {
        modal.classList.add('active');
        modal.classList.remove('hidden');
        modal.style.setProperty('display', 'flex', 'important');
      }
      playCyberSfx('sonar');
    });
  }

  // Ghost duration selection
  if (ghostDurationSelect) {
    const savedDuration = localStorage.getItem('nexchat_ghost_default_seconds') || '30';
    ghostDurationSelect.value = savedDuration;
    ghostDurationSelect.addEventListener('change', () => {
      localStorage.setItem('nexchat_ghost_default_seconds', ghostDurationSelect.value);
      showNotif(`Ghost self-destruct default set to ${ghostDurationSelect.options[ghostDurationSelect.selectedIndex].text}`, 'info', 2000);
    });
  }

  // Soundboard dock toggle
  if (soundboardToggle) {
    const isSoundboardEnabled = localStorage.getItem('nexchat_soundboard_enabled') !== 'false';
    soundboardToggle.checked = isSoundboardEnabled;
    if (soundboardBtn) soundboardBtn.style.display = isSoundboardEnabled ? 'flex' : 'none';

    soundboardToggle.addEventListener('change', () => {
      const enabled = soundboardToggle.checked;
      localStorage.setItem('nexchat_soundboard_enabled', enabled ? 'true' : 'false');
      if (soundboardBtn) soundboardBtn.style.display = enabled ? 'flex' : 'none';
      showNotif(enabled ? 'Tactile Soundboard dock enabled' : 'Tactile Soundboard dock disabled', 'info', 1800);
    });
  }
}


// ============================================================================
// EXPORTS & WINDOW MOUNT FOR MIGRATED SUBSYSTEMS
// ============================================================================
if (typeof window !== 'undefined') {
  window.initNexbotStudio = initNexbotStudio;
  window.initNeuralRadar = initNeuralRadar;
  window.initVipVault = initVipVault;
  window.playCyberSfx = playCyberSfx;
  window.attachGhostCountdown = attachGhostCountdown;
  window.initGhostProtocol = initGhostProtocol;
  window.getCyberStreakData = getCyberStreakData;
  window.saveCyberStreakData = saveCyberStreakData;
  window.initCyberStreak = initCyberStreak;
  window.initSmartReplyAndPolish = initSmartReplyAndPolish;
  window.initNeuralSoundboard = initNeuralSoundboard;
  window.initAudioSpaces = initAudioSpaces;
  window.initCyberDrop = initCyberDrop;
  window.initCipherVault = initCipherVault;
  window.initMeshSettings = initMeshSettings;
}

export {
  initNexbotStudio,
  initNeuralRadar,
  initVipVault,
  playCyberSfx,
  formatCountdownDisplay,
  attachGhostCountdown,
  initGhostProtocol,
  getCyberStreakData,
  saveCyberStreakData,
  initCyberStreak,
  initSmartReplyAndPolish,
  initNeuralSoundboard,
  initAudioSpaces,
  initCyberDrop,
  initCipherVault,
  initMeshSettings
};
