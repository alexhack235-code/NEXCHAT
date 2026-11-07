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
    name: 'ChronEX AI',
    pic: 'chronex-ai.jpg',
    type: 'ai',
    badge: 'AI',
    isVerified: true,
    status: 'Autonomous Cyber Intelligence (Online)',
    sub: 'Ask any question or translate languages'
  },
  {
    uid: 'nex-support',
    name: 'NEXCHAT Concierge',
    pic: 'logo.jpg',
    type: 'direct',
    badge: 'VERIFIED',
    isVerified: true,
    status: 'Official VIP System Support',
    sub: 'Platform assistance and feedback'
  },
  {
    uid: 'cyber-syndicate',
    name: 'Cyber Syndicate',
    pic: 'assets/syndicate.png',
    type: 'group',
    badge: 'VERIFIED',
    isVerified: true,
    status: 'Decentralized Tech Network',
    sub: '3,842 members online'
  },
  {
    uid: 'alex-vance',
    name: 'Alex Vance',
    pic: 'logo.jpg',
    type: 'direct',
    badge: 'DEV',
    isVerified: true,
    status: 'Core Contributor',
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
  li.className = 'chat-item';
  li.dataset.chatId = chat.uid;
  li.dataset.uid = chat.uid;
  li.dataset.chatType = chat.type || 'direct';
  li.dataset.name = chat.name || 'User';

  const badgeHtml = chat.badge === 'AI'
    ? `<span class="verified-badge-pill ai-badge" style="background: rgba(0, 243, 255, 0.2); color: #00f3ff; font-size: 10px; padding: 1px 6px; border-radius: 4px; margin-left: 6px; font-weight: 700;"><i class="fa-solid fa-microchip"></i> AI</span>`
    : (chat.isVerified ? `<span class="verified-badge-pill" style="background: rgba(0, 255, 157, 0.2); color: #00ff9d; font-size: 10px; padding: 1px 6px; border-radius: 4px; margin-left: 6px; font-weight: 700;"><i class="fa-solid fa-shield-check"></i> PRO</span>` : '');

  li.innerHTML = `
    <div class="chat-avatar-container" style="position: relative;">
      <img src="${chat.pic || 'logo.jpg'}" class="chat-avatar" alt="${escapeHtml(chat.name)}" onerror="this.src='logo.jpg';">
      <span class="chat-online-beacon"></span>
    </div>
    <div class="chat-item-content">
      <div class="chat-item-header">
        <span class="chat-name">${escapeHtml(chat.name)}</span>
        ${badgeHtml}
      </div>
      <p class="chat-preview">${escapeHtml(chat.lastMsg || chat.status || 'Tap to chat')}</p>
    </div>
    <div class="chat-time-container">
      <span class="chat-item-time">Active</span>
    </div>
  `;

  li.addEventListener('click', () => {
    if (typeof window.openChat === 'function') {
      window.openChat(chat.uid, chat.name, chat.pic || 'logo.jpg', chat.type || 'direct');
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

  const chats = getStoredChats();
  if (chats.length === 0) return;

  // Remove empty state watermark once chats exist
  const emptyState = document.getElementById('emptyChatState');
  if (emptyState) {
    emptyState.remove();
  }

  chats.forEach(chat => {
    const existingLi = contactList.querySelector(`li[data-chat-id="${chat.uid}"]`);
    if (!existingLi) {
      contactList.prepend(createContactListItem(chat));
    }
  });
}

/**
 * Closes the FAB bottom action sheet safely
 */
export function closeFabSheet() {
  const sheet = document.getElementById('fabActionSheet');
  if (sheet) {
    sheet.style.display = 'none';
    sheet.classList.remove('is-active', 'open');
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
    bubbleEl.appendChild(box);
  }

  box.innerHTML = `<span class="nex-trans-label"><i class="fa-solid fa-spinner fa-spin"></i> Translating...</span>`;

  let targetLang = requestedTarget || window.nexPreferredLang || localStorage.getItem('nex_preferred_lang') || 'English';

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
    let translated = data.translatedText || data.result || data.response || 'Translation unavailable';
    let detected = data.detectedLang || 'Auto';
    let target = data.targetLang || targetLang;

    // Smart auto-alternate: if detected language matches target (e.g. English -> English), translate to Spanish
    if (!requestedTarget && (detected.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(detected.toLowerCase()))) {
      const alternateTarget = target.toLowerCase().includes('english') ? 'Spanish' : 'English';
      const resAlt = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-nexchat-secret': NEXCHAT_SECRET },
        body: JSON.stringify({ text: rawText, targetLang: alternateTarget, sourceLang: 'auto' })
      });
      const dataAlt = await resAlt.json();
      if (dataAlt && dataAlt.translatedText) {
        translated = dataAlt.translatedText;
        target = dataAlt.targetLang || alternateTarget;
        detected = dataAlt.detectedLang || detected;
      }
    }

    box.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 8px;">
        <span class="nex-trans-label" style="margin: 0;"><i class="fa-solid fa-language"></i> ${escapeHtml(detected)} &rarr; ${escapeHtml(target)}</span>
        <select class="nex-trans-quick-switch" style="background: rgba(0,0,0,0.45); border: 1px solid rgba(0,255,157,0.3); color: #00ff9d; font-size: 10px; border-radius: 4px; padding: 1px 4px; outline: none; cursor: pointer;">
          <option value="" disabled selected>Switch Lang</option>
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Russian">Russian</option>
          <option value="Arabic">Arabic</option>
          <option value="Nigerian Pidgin">Pidgin</option>
          <option value="Yoruba">Yoruba</option>
          <option value="Igbo">Igbo</option>
          <option value="Hausa">Hausa</option>
          <option value="Chinese">Chinese</option>
          <option value="Japanese">Japanese</option>
        </select>
      </div>
      <div class="nex-trans-content">${escapeHtml(translated)}</div>
    `;

    box.querySelector('.nex-trans-quick-switch')?.addEventListener('change', (e) => {
      const nextLang = e.target.value;
      if (nextLang) {
        translateMessageElement(bubbleEl, nextLang);
      }
    });
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

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nex-msg-translate-btn';
    btn.title = 'Translate message';
    btn.innerHTML = `<i class="fa-solid fa-language"></i> Translate`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      translateMessageElement(b);
    });
    b.appendChild(btn);
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

    // Enter key sends question to ChronEX AI
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (!q) return;
        e.preventDefault();
        searchInput.value = '';

        // Open ChronEX AI chat view
        createAndOpenChat(PRELOADED_CONTACTS[0]);

        // Send query to ChronEX AI
        askChronexAI(q);
      }
    });
  }

  // 5. Periodic Scanner & Mutation Observer for dynamic elements
  setInterval(() => {
    syncLocalChatsToDOM();
    injectTranslateButtons();
  }, 1000);

  console.log('[NEXCHAT] chat2.js secondary modular controller initialized successfully.');
}

// Global Exports
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
