/**
 * NEXCHAT Experience Studio:
 * - 20 Frosted Glassmorphism Chat List Themes & Picture/Profile Backdrop
 * - Zero-Lazy Instant Local DataURL Pre-Decode Cache
 * - 120Hz Swiping, Scroll Elasticity, & Typing Keystroke FX across Direct & Group Chats
 */

const CHATLIST_GLASS_THEMES = [
  { id: 'none', label: 'Default Clean List', swatch: 'linear-gradient(135deg, #111b21, #202c33)', glass: false },
  { id: 'telegram-glass', label: 'Telegram Frosted Glass', swatch: 'linear-gradient(135deg, rgba(0,168,132,0.62), rgba(5,150,105,0.82))', glass: true },
  { id: 'liquid-crystal', label: 'Liquid Crystal', swatch: 'linear-gradient(135deg, rgba(16,185,129,0.58), rgba(6,182,212,0.78))', glass: true },
  { id: 'midnight-obsidian', label: 'Midnight Obsidian Glass', swatch: 'linear-gradient(135deg, rgba(30,41,59,0.78), rgba(15,23,42,0.92))', glass: true },
  { id: 'glass-frost', label: 'Pure Glass Frost', swatch: 'linear-gradient(135deg, rgba(148,163,184,0.48), rgba(226,232,240,0.34))', glass: true },
  { id: 'crimson-velvet-glass', label: 'Crimson Velvet Glass', swatch: 'linear-gradient(135deg, rgba(225,29,72,0.62), rgba(159,18,57,0.8))', glass: true },
  { id: 'arctic-ice-glass', label: 'Arctic Ice Glass', swatch: 'linear-gradient(135deg, rgba(56,189,248,0.55), rgba(14,116,144,0.75))', glass: true },
  { id: 'cyber-violet-glass', label: 'Cyber Violet Glass', swatch: 'linear-gradient(135deg, rgba(139,92,246,0.62), rgba(109,40,217,0.8))', glass: true },
  { id: 'solar-amber-glass', label: 'Solar Amber Glass', swatch: 'linear-gradient(135deg, rgba(245,158,11,0.58), rgba(180,83,9,0.78))', glass: true },
  { id: 'rose-quartz-glass', label: 'Rose Quartz Glass', swatch: 'linear-gradient(135deg, rgba(244,114,182,0.55), rgba(190,24,93,0.72))', glass: true },
  { id: 'neon-cyan-glass', label: 'Neon Cyan Glass', swatch: 'linear-gradient(135deg, rgba(34,211,238,0.58), rgba(8,145,178,0.78))', glass: true },
  { id: 'emerald-matrix-glass', label: 'Emerald Matrix Glass', swatch: 'linear-gradient(135deg, rgba(16,185,129,0.62), rgba(4,120,87,0.82))', glass: true },
  { id: 'graphite-smoke-glass', label: 'Graphite Smoke Glass', swatch: 'linear-gradient(135deg, rgba(71,85,105,0.65), rgba(30,41,59,0.85))', glass: true },
  { id: 'cobalt-deep-glass', label: 'Cobalt Deep Glass', swatch: 'linear-gradient(135deg, rgba(37,99,235,0.62), rgba(30,64,175,0.82))', glass: true },
  { id: 'royal-amethyst-glass', label: 'Royal Amethyst Glass', swatch: 'linear-gradient(135deg, rgba(168,85,247,0.58), rgba(126,34,206,0.8))', glass: true },
  { id: 'sunset-coral-glass', label: 'Sunset Coral Glass', swatch: 'linear-gradient(135deg, rgba(251,113,133,0.58), rgba(249,115,22,0.72))', glass: true },
  { id: 'mint-breeze-glass', label: 'Mint Breeze Glass', swatch: 'linear-gradient(135deg, rgba(52,211,153,0.55), rgba(13,148,136,0.75))', glass: true },
  { id: 'champagne-gold-glass', label: 'Champagne Gold Glass', swatch: 'linear-gradient(135deg, rgba(250,204,21,0.52), rgba(161,98,7,0.72))', glass: true },
  { id: 'indigo-nebula-glass', label: 'Indigo Nebula Glass', swatch: 'linear-gradient(135deg, rgba(99,102,241,0.62), rgba(67,56,202,0.82))', glass: true },
  { id: 'chrome-mirror-glass', label: 'Chrome Mirror Glass', swatch: 'linear-gradient(135deg, rgba(203,213,225,0.5), rgba(100,116,139,0.7))', glass: true },
  { id: 'pearl-ivory-glass', label: 'Pearl Ivory Glass', swatch: 'linear-gradient(135deg, rgba(248,250,252,0.48), rgba(148,163,184,0.6))', glass: true }
];

const DEFAULT_FUTURISTIC_CHATLIST_BG = './assets/images/chatlist-futuristic-bg.jpg';

const CHATLIST_BUILT_IN_BACKDROPS = [
  { id: 'obsidian-futuristic', label: 'Obsidian Architecture', url: DEFAULT_FUTURISTIC_CHATLIST_BG },
  { id: 'emerald-aurora', label: 'Emerald Aurora', url: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><defs><radialGradient id="g1" cx="20%" cy="18%" r="75%"><stop offset="0%" stop-color="#00ff88" stop-opacity="0.45"/><stop offset="55%" stop-color="#07222b" stop-opacity="0.88"/><stop offset="100%" stop-color="#040812"/></radialGradient><radialGradient id="g2" cx="85%" cy="78%" r="65%"><stop offset="0%" stop-color="#00d4ff" stop-opacity="0.38"/><stop offset="100%" stop-color="#040812" stop-opacity="0"/></radialGradient></defs><rect width="800" height="1200" fill="#040812"/><rect width="800" height="1200" fill="url(#g1)"/><rect width="800" height="1200" fill="url(#g2)"/></svg>') },
  { id: 'cyber-nebula', label: 'Cyber Nebula', url: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><defs><radialGradient id="n1" cx="75%" cy="22%" r="70%"><stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.48"/><stop offset="100%" stop-color="#050814" stop-opacity="0"/></radialGradient><radialGradient id="n2" cx="15%" cy="75%" r="70%"><stop offset="0%" stop-color="#ec4899" stop-opacity="0.34"/><stop offset="100%" stop-color="#050814" stop-opacity="0"/></radialGradient></defs><rect width="800" height="1200" fill="#050814"/><rect width="800" height="1200" fill="url(#n1)"/><rect width="800" height="1200" fill="url(#n2)"/></svg>') },
  { id: 'ocean-prism', label: 'Deep Ocean Prism', url: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><defs><linearGradient id="o1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#031326"/><stop offset="45%" stop-color="#0b3b5c"/><stop offset="100%" stop-color="#06141f"/></linearGradient></defs><rect width="800" height="1200" fill="url(#o1)"/></svg>') },
  { id: 'crimson-silk', label: 'Crimson Silk', url: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><defs><radialGradient id="c1" cx="30%" cy="25%" r="80%"><stop offset="0%" stop-color="#e11d48" stop-opacity="0.44"/><stop offset="100%" stop-color="#0b050d"/></radialGradient></defs><rect width="800" height="1200" fill="#0b050d"/><rect width="800" height="1200" fill="url(#c1)"/></svg>') }
];

const _fastDecodedImages = new Map();

export function preloadImageEager(url) {
  if (!url || typeof url !== 'string' || typeof Image === 'undefined') return Promise.resolve(false);
  const clean = url.trim();
  if (!clean) return Promise.resolve(false);
  if (clean.startsWith('data:image/svg')) return Promise.resolve(true);
  if (_fastDecodedImages.has(clean)) return _fastDecodedImages.get(clean);
  const p = new Promise((resolve) => {
    const img = new Image();
    try { img.fetchPriority = 'high'; } catch (_) {}
    img.decoding = 'sync';
    img.onload = async () => {
      try { if (typeof img.decode === 'function') await img.decode(); } catch (_) {}
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = clean;
  });
  _fastDecodedImages.set(clean, p);
  return p;
}

export async function compressImageFileFast(file, maxDim = 1440, quality = 0.84) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = objectUrl;
    });
    const w = img.naturalWidth || img.width || 1080;
    const h = img.naturalHeight || img.height || 1080;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    await preloadImageEager(dataUrl);
    return dataUrl;
  } finally {
    try { URL.revokeObjectURL(objectUrl); } catch (_) {}
  }
}

export function applyChatListGlassVars() {
  try {
    const blur = Math.min(28, Math.max(4, parseInt(localStorage.getItem('nex_chatlist_blur') || '16', 10) || 16));
    const alphaPct = Math.min(90, Math.max(18, parseInt(localStorage.getItem('nex_chatlist_opacity') || '56', 10) || 56));
    const dimPct = Math.min(85, Math.max(0, parseInt(localStorage.getItem('nex_chatlist_bg_dim') || '42', 10) || 42));
    const bgBlur = Math.min(20, Math.max(0, parseInt(localStorage.getItem('nex_chatlist_bg_blur') || '0', 10) || 0));
    const cardStyle = localStorage.getItem('nex_chatlist_card_style') || 'frosted-cards';
    const specular = localStorage.getItem('nex_chatlist_specular') !== 'false';

    const root = document.documentElement;
    root.style.setProperty('--nex-chatlist-blur', `${blur}px`);
    root.style.setProperty('--nex-chatlist-alpha', (alphaPct / 100).toFixed(2));
    root.style.setProperty('--nex-chatlist-bg-dim', (dimPct / 100).toFixed(2));
    root.style.setProperty('--nex-chatlist-bg-blur', `${bgBlur}px`);
    document.body.setAttribute('data-chatlist-card-style', cardStyle);
    document.body.classList.toggle('nex-chatlist-no-rim', !specular);

    syncControlsByIds({ blur, alphaPct, dimPct, bgBlur, cardStyle, specular });
  } catch (_) {}
}

function syncControlsByIds(vals) {
  const mapText = [
    ['chatListBlurValue', `${vals.blur}px`],
    ['chatListOpacityValue', `${vals.alphaPct}%`],
    ['chatListBgDimValue', `${vals.dimPct}%`],
    ['chatListBgBlurValue', `${vals.bgBlur}px`],
    ['modalChatListBlurVal', `${vals.blur}px`],
    ['modalChatListOpacityVal', `${vals.alphaPct}%`],
    ['modalChatListBgDimVal', `${vals.dimPct}%`]
  ];
  mapText.forEach(([id, txt]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  });
  const mapVal = [
    ['chatListBlurRange', String(vals.blur)],
    ['chatListOpacityRange', String(vals.alphaPct)],
    ['chatListBgDimRange', String(vals.dimPct)],
    ['chatListBgBlurRange', String(vals.bgBlur)],
    ['chatListCardStyleSelect', vals.cardStyle],
    ['modalChatListBlurRange', String(vals.blur)],
    ['modalChatListOpacityRange', String(vals.alphaPct)],
    ['modalChatListBgDimRange', String(vals.dimPct)],
    ['modalChatListCardStyleSelect', vals.cardStyle]
  ];
  mapVal.forEach(([id, v]) => {
    const el = document.getElementById(id);
    if (el && el.value !== v) el.value = v;
  });
  const chkSpec = document.getElementById('chkChatListSpecularRim');
  if (chkSpec) chkSpec.checked = vals.specular;
}

export async function applyChatListWallpaper(wallpaperUrl) {
  const listView = document.getElementById('chatListView');
  const previewStage = document.getElementById('chatListLivePreview');
  const modalPreview = document.getElementById('modalChatListLivePreview');
  const root = document.documentElement;

  if (wallpaperUrl) {
    const cleanUrl = String(wallpaperUrl).replace(/[\n\r\t]/g, '').trim();
    const isSvg = cleanUrl.startsWith('data:image/svg');
    if (!isSvg) await preloadImageEager(cleanUrl);

    root.style.setProperty('--nex-chatlist-wallpaper', `url("${cleanUrl}")`);
    root.style.setProperty('--nex-chatlist-wallpaper-size', 'cover');
    root.style.setProperty('--nex-chatlist-wallpaper-repeat', 'no-repeat');
    if (listView) listView.classList.add('has-chatlist-wallpaper');
    if (previewStage) previewStage.style.backgroundImage = `url("${cleanUrl}")`;
    if (modalPreview) modalPreview.style.backgroundImage = `url("${cleanUrl}")`;
    try {
      localStorage.setItem('nex_chatlist_bg', cleanUrl);
      localStorage.removeItem('nex_chatlist_bg_cleared');
    } catch (_) {}
  } else {
    root.style.removeProperty('--nex-chatlist-wallpaper');
    if (listView) listView.classList.remove('has-chatlist-wallpaper');
    if (previewStage) previewStage.style.backgroundImage = '';
    if (modalPreview) modalPreview.style.backgroundImage = '';
    try {
      localStorage.removeItem('nex_chatlist_bg');
      localStorage.setItem('nex_chatlist_bg_cleared', 'true');
    } catch (_) {}
  }
}

export function applyChatListTheme(themeId) {
  const chosen = themeId || localStorage.getItem('nex_chatlist_theme') || 'telegram-glass';
  CHATLIST_GLASS_THEMES.forEach((t) => {
    if (t.id !== 'none') document.body.classList.remove(`chatlist-theme-${t.id}`);
  });
  if (chosen && chosen !== 'none') {
    document.body.classList.add(`chatlist-theme-${chosen}`);
  }
  const sel = document.getElementById('chatListStyleSelect');
  if (sel && sel.value !== chosen) sel.value = chosen;
  renderChatListSwatches('glassChatListSwatches', chosen);
  renderChatListSwatches('modalGlassChatListSwatches', chosen);
  applyChatListGlassVars();
  try { localStorage.setItem('nex_chatlist_theme', chosen); } catch (_) {}
}

function renderChatListSwatches(containerId, activeTheme) {
  const host = document.getElementById(containerId);
  if (!host) return;
  if (!host.dataset.rendered) {
    host.dataset.rendered = 'true';
    host.innerHTML = '';
    CHATLIST_GLASS_THEMES.forEach((t) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'glass-swatch-btn';
      btn.dataset.chatlistTheme = t.id;
      btn.title = t.label;
      btn.innerHTML = `<span class="glass-swatch-dot" style="background:${t.swatch}"></span><span class="glass-swatch-name">${t.label.replace(' Glass', '')}</span>`;
      btn.onclick = () => {
        applyChatListTheme(t.id);
        if (typeof window.showNotif === 'function') window.showNotif(`Chat list: ${t.label}`, 'success', 1500);
      };
      host.appendChild(btn);
    });
  }
  host.querySelectorAll('.glass-swatch-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.chatlistTheme === activeTheme);
  });
}

async function handleChatListPictureUpload(file) {
  if (!file) return;
  try {
    const fastDataUrl = await compressImageFileFast(file, 1440, 0.85);
    await applyChatListWallpaper(fastDataUrl);
    if (localStorage.getItem('nex_chatlist_theme') === 'none' || !localStorage.getItem('nex_chatlist_theme')) {
      applyChatListTheme('telegram-glass');
    }
    if (typeof window.showNotif === 'function') window.showNotif('Chat list picture applied!', 'success', 1800);
  } catch (err) {
    console.warn('[ChatListBackdrop] Compress notice:', err);
  }
}

export function setTypingFxStyle(style) {
  const chosen = style || localStorage.getItem('nex_typing_fx_style') || 'kinetic';
  try { localStorage.setItem('nex_typing_fx_style', chosen); } catch (_) {}
  const wrap = document.querySelector('#messageInputArea .message-input-wrapper') || document.querySelector('.message-input-wrapper');
  if (wrap) {
    wrap.classList.remove('nex-typing-fx-kinetic', 'nex-typing-fx-ripple', 'nex-typing-fx-matrix', 'nex-typing-fx-stealth');
    wrap.classList.add(`nex-typing-fx-${chosen}`);
  }
  const sel = document.getElementById('typingFxStyleSelect');
  if (sel && sel.value !== chosen) sel.value = chosen;
}

function spawnKeystrokeSpark(inputEl) {
  const style = localStorage.getItem('nex_typing_fx_style') || 'kinetic';
  if (style === 'stealth' || document.body.classList.contains('nex-low-end')) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = inputEl.getBoundingClientRect();
  if (!rect || rect.width <= 0) return;

  const spark = document.createElement('span');
  spark.className = 'nex-keystroke-spark';
  const offsetX = Math.min(rect.width - 28, Math.max(24, (inputEl.value.length * 8) % (rect.width - 20)));
  spark.style.left = `${rect.left + offsetX}px`;
  spark.style.top = `${rect.top + 8}px`;
  spark.style.setProperty('--sx', `${Math.round((Math.random() - 0.5) * 26)}px`);
  document.body.appendChild(spark);
  setTimeout(() => spark.remove(), 500);
}

export function triggerMessageSendLaunchFx() {
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    sendBtn.classList.remove('nex-send-launched');
    void sendBtn.offsetWidth;
    sendBtn.classList.add('nex-send-launched');
  }
}

function bindFilterTabSwipeGestures() {
  const contactList = document.getElementById('contactList');
  if (!contactList || contactList.dataset.tabSwipeBound === 'true') return;
  contactList.dataset.tabSwipeBound = 'true';

  const FILTER_ORDER = ['all', 'syndicates', 'ai-bots', 'market', 'unread'];
  let sx = 0, sy = 0, tracking = false;

  contactList.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  contactList.addEventListener('touchend', (e) => {
    if (!tracking || !e.changedTouches || !e.changedTouches[0]) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 76 || Math.abs(dx) < Math.abs(dy) * 1.8) return;

    const tabs = document.querySelectorAll('#chatFilterTabs .filter-tab[data-filter]');
    if (!tabs.length) return;
    const activeTab = document.querySelector('#chatFilterTabs .filter-tab.active[data-filter]');
    const currentFilter = activeTab?.dataset?.filter || 'all';
    const curIdx = Math.max(0, FILTER_ORDER.indexOf(currentFilter));
    const nextIdx = dx < 0
      ? Math.min(FILTER_ORDER.length - 1, curIdx + 1)
      : Math.max(0, curIdx - 1);
    if (nextIdx === curIdx) return;

    const targetFilter = FILTER_ORDER[nextIdx];
    const targetBtn = document.querySelector(`#chatFilterTabs .filter-tab[data-filter="${targetFilter}"]`);
    if (targetBtn) {
      contactList.classList.remove('nex-filter-swipe-left', 'nex-filter-swipe-right');
      void contactList.offsetWidth;
      contactList.classList.add(dx < 0 ? 'nex-filter-swipe-left' : 'nex-filter-swipe-right');
      targetBtn.click();
    }
  }, { passive: true });
}

function bindEdgeSwipeBackAndScrollPhysics() {
  const detailView = document.getElementById('chatDetailView');
  const messagesArea = document.getElementById('messages-area');

  if (detailView && detailView.dataset.edgeSwipeBound !== 'true') {
    detailView.dataset.edgeSwipeBound = 'true';
    let startX = 0, startY = 0, trackingEdge = false;

    detailView.addEventListener('touchstart', (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      const touchX = e.touches[0].clientX;
      if (touchX <= 34 && detailView.style.display !== 'none') {
        trackingEdge = true;
        startX = touchX;
        startY = e.touches[0].clientY;
        detailView.style.transition = 'none';
      }
    }, { passive: true });

    detailView.addEventListener('touchmove', (e) => {
      if (!trackingEdge || !e.touches || e.touches.length !== 1) return;
      const dx = Math.max(0, e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dy > dx * 1.15 && dx < 24) {
        trackingEdge = false;
        detailView.style.transition = '';
        detailView.style.transform = '';
        return;
      }
      if (dx > 8) {
        detailView.style.transform = `translate3d(${Math.min(dx, window.innerWidth * 0.72)}px, 0, 0)`;
      }
    }, { passive: true });

    const finishEdge = (e) => {
      if (!trackingEdge) return;
      trackingEdge = false;
      const dx = e?.changedTouches?.[0] ? (e.changedTouches[0].clientX - startX) : 0;
      detailView.style.transition = 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)';
      if (dx >= 96 && typeof window.showChatListView === 'function') {
        detailView.style.transform = `translate3d(${window.innerWidth}px, 0, 0)`;
        setTimeout(() => {
          detailView.style.transition = '';
          detailView.style.transform = '';
          window.showChatListView();
        }, 160);
      } else {
        detailView.style.transform = '';
        setTimeout(() => { detailView.style.transition = ''; }, 240);
      }
    };
    detailView.addEventListener('touchend', finishEdge, { passive: true });
    detailView.addEventListener('touchcancel', finishEdge, { passive: true });
  }

  if (messagesArea && messagesArea.dataset.scrollPhysicsBound !== 'true') {
    messagesArea.dataset.scrollPhysicsBound = 'true';
    let lastY = messagesArea.scrollTop;
    let settleTimer = null;
    let pillHideTimer = null;

    let datePill = document.getElementById('nexFloatingDatePill');
    if (!datePill) {
      datePill = document.createElement('div');
      datePill.id = 'nexFloatingDatePill';
      datePill.className = 'nex-floating-date-pill';
      document.body.appendChild(datePill);
    }

    messagesArea.addEventListener('scroll', () => {
      const curY = messagesArea.scrollTop;
      const vel = Math.max(-24, Math.min(24, curY - lastY));
      lastY = curY;

      if (!document.body.classList.contains('nex-low-end')) {
        const skew = -(vel * 0.045);
        messagesArea.style.setProperty('--nex-scroll-skew', `${skew.toFixed(2)}deg`);
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          messagesArea.style.setProperty('--nex-scroll-skew', '0deg');
        }, 110);
      }

      if (Math.abs(vel) > 3 && document.body.classList.contains('in-conversation')) {
        const firstVisible = messagesArea.querySelector('.message-wrapper, .nex-msg-wrapper');
        datePill.textContent = firstVisible?.dataset?.dateLabel || 'Today';
        datePill.classList.add('visible');
        clearTimeout(pillHideTimer);
        pillHideTimer = setTimeout(() => datePill.classList.remove('visible'), 1100);
      }
    }, { passive: true });
  }
}

function bindComposerKeystrokeEffects() {
  const input = document.getElementById('message-input');
  if (!input || input.dataset.typingFxBound === 'true') return;
  input.dataset.typingFxBound = 'true';
  let idleTimer = null;

  input.addEventListener('input', () => {
    const wrap = input.closest('.message-input-wrapper');
    if (wrap) {
      wrap.classList.add('is-composing');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => wrap.classList.remove('is-composing'), 850);
    }
    spawnKeystrokeSpark(input);
  });

  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn && sendBtn.dataset.launchFxBound !== 'true') {
    sendBtn.dataset.launchFxBound = 'true';
    sendBtn.addEventListener('click', () => triggerMessageSendLaunchFx(), { capture: true });
  }
  const msgForm = document.getElementById('message-form');
  if (msgForm && msgForm.dataset.launchFxBound !== 'true') {
    msgForm.dataset.launchFxBound = 'true';
    msgForm.addEventListener('submit', () => triggerMessageSendLaunchFx(), { capture: true });
  }
}

function bindStudioSettingsControls() {
  const settingsSel = document.getElementById('chatListStyleSelect');
  if (settingsSel && !settingsSel.dataset.bound) {
    settingsSel.dataset.bound = 'true';
    settingsSel.addEventListener('change', () => applyChatListTheme(settingsSel.value));
  }

  const cardSel = document.getElementById('chatListCardStyleSelect');
  if (cardSel && !cardSel.dataset.bound) {
    cardSel.dataset.bound = 'true';
    cardSel.addEventListener('change', () => {
      try { localStorage.setItem('nex_chatlist_card_style', cardSel.value); } catch (_) {}
      applyChatListGlassVars();
    });
  }

  const uploadBtn = document.getElementById('chatListWallpaperFileInput');
  if (uploadBtn && !uploadBtn.dataset.bound) {
    uploadBtn.dataset.bound = 'true';
    uploadBtn.addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      if (f) await handleChatListPictureUpload(f);
      e.target.value = '';
    });
  }

  const useAvatarBtn = document.getElementById('chatListUseProfilePicBtn');
  if (useAvatarBtn && !useAvatarBtn.dataset.bound) {
    useAvatarBtn.dataset.bound = 'true';
    useAvatarBtn.addEventListener('click', () => {
      const rawAvatar = document.getElementById('myAvatar')?.src || localStorage.getItem('user_avatar') || window.myProfilePic || '';
      const isDefaultLogo = !rawAvatar || /logo\.jpg$/i.test(rawAvatar);
      const chosen = isDefaultLogo ? DEFAULT_FUTURISTIC_CHATLIST_BG : rawAvatar;
      applyChatListWallpaper(chosen);
      if (localStorage.getItem('nex_chatlist_theme') === 'none' || !localStorage.getItem('nex_chatlist_theme')) {
        applyChatListTheme('telegram-glass');
      }
      if (typeof window.showNotif === 'function') {
        window.showNotif(isDefaultLogo ? 'Applied Obsidian Futuristic backdrop (upload a profile photo anytime)!' : 'Applied profile picture to chat list!', 'success', 2000);
      }
    });
  }

  const browseWallpapersBtn = document.getElementById('chatListBrowseAllWallpapersBtn');
  if (browseWallpapersBtn && !browseWallpapersBtn.dataset.bound) {
    browseWallpapersBtn.dataset.bound = 'true';
    browseWallpapersBtn.addEventListener('click', () => {
      if (typeof window.openChatWallpaperPicker === 'function') {
        window.openChatWallpaperPicker(null, 'Chat List', false, 'chatlist');
      }
    });
  }

  const resetBgBtn = document.getElementById('chatListResetBgBtn');
  if (resetBgBtn && !resetBgBtn.dataset.bound) {
    resetBgBtn.dataset.bound = 'true';
    resetBgBtn.addEventListener('click', () => {
      applyChatListWallpaper(null);
      if (typeof window.showNotif === 'function') window.showNotif('Cleared chat list picture.', 'info', 1500);
    });
  }

  const sliders = [
    ['chatListBlurRange', 'nex_chatlist_blur'],
    ['chatListOpacityRange', 'nex_chatlist_opacity'],
    ['chatListBgDimRange', 'nex_chatlist_bg_dim'],
    ['chatListBgBlurRange', 'nex_chatlist_bg_blur']
  ];
  sliders.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el && !el.dataset.bound) {
      el.dataset.bound = 'true';
      el.addEventListener('input', () => {
        try { localStorage.setItem(key, el.value); } catch (_) {}
        applyChatListGlassVars();
      });
    }
  });

  const chkRim = document.getElementById('chkChatListSpecularRim');
  if (chkRim && !chkRim.dataset.bound) {
    chkRim.dataset.bound = 'true';
    chkRim.addEventListener('change', () => {
      try { localStorage.setItem('nex_chatlist_specular', chkRim.checked ? 'true' : 'false'); } catch (_) {}
      applyChatListGlassVars();
    });
  }

  const typingSel = document.getElementById('typingFxStyleSelect');
  if (typingSel && !typingSel.dataset.bound) {
    typingSel.dataset.bound = 'true';
    typingSel.addEventListener('change', () => setTypingFxStyle(typingSel.value));
  }

  const quickBtn = document.getElementById('chatListCustomizeBtn');
  if (quickBtn && !quickBtn.dataset.bound) {
    quickBtn.dataset.bound = 'true';
    quickBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openChatListStudioModal();
    });
  }
}

export function openChatListStudioModal() {
  let modal = document.getElementById('chatListStudioModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'chatListStudioModal';
    modal.className = 'nex-chatlist-studio-backdrop';
    modal.innerHTML = `
      <div class="nex-chatlist-studio-sheet">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h3 style="margin:0;font-size:17px;font-weight:800;display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-wand-magic-sparkles" style="color:#00ff88;"></i>
            Chat List Glassmorphism &amp; Picture
          </h3>
          <button type="button" id="closeChatListStudioBtn" class="wp-close-btn" style="background:rgba(255,255,255,0.08);border:none;color:#cbd5e1;width:32px;height:32px;border-radius:50%;cursor:pointer;" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div id="modalChatListLivePreview" class="nex-chatlist-preview-stage" style="background-image:url('./assets/images/chatlist-futuristic-bg.jpg');">
          <div class="nex-chatlist-preview-row">
            <img src="chronex-ai.jpg" class="nex-chatlist-preview-avatar" onerror="this.style.display='none'" alt="" />
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:700;color:#fff;">Chronex AI</div>
              <div style="font-size:11px;color:#cbd5e1;opacity:0.85;">Frosted liquid glass chat list row</div>
            </div>
            <span style="background:#00ff88;color:#041019;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;">3</span>
          </div>
          <div class="nex-chatlist-preview-row">
            <span class="nex-chatlist-preview-avatar" style="display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#00ff88,#00d4ff);color:#041019;font-weight:800;font-size:12px;">G</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:700;color:#fff;">Group Syndicate</div>
              <div style="font-size:11px;color:#00ff88;">typing &amp; swipe FX ready</div>
            </div>
            <span style="font-size:10px;color:#94a3b8;">Now</span>
          </div>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
          <label class="btn-primary" style="flex:1;min-width:120px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 12px;border-radius:12px;cursor:pointer;font-size:12px;font-weight:700;">
            <i class="fa-solid fa-image"></i> Upload Photo
            <input type="file" id="modalChatListPicInput" accept="image/*" style="display:none;" />
          </label>
          <button type="button" id="modalChatListBrowseWallpapersBtn" class="btn-secondary" style="flex:1;min-width:130px;padding:9px 12px;border-radius:12px;font-size:12px;font-weight:700;background:linear-gradient(135deg,rgba(0,255,136,0.16),rgba(0,212,255,0.16));border-color:rgba(0,255,136,0.45);color:#00ff88;">
            <i class="fa-solid fa-palette"></i> 84+ Wallpapers
          </button>
          <button type="button" id="modalChatListUseAvatarBtn" class="btn-secondary" style="flex:1;min-width:120px;padding:9px 12px;border-radius:12px;font-size:12px;font-weight:700;">
            <i class="fa-solid fa-user-astronaut"></i> Profile Pic
          </button>
          <button type="button" id="modalChatListClearPicBtn" class="btn-secondary" style="padding:9px 12px;border-radius:12px;font-size:12px;" title="Remove Backdrop">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>

        <div style="margin-bottom:10px;">
          <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:6px;">Instant Built-In Backdrops</div>
          <div id="modalChatListPresetBackdrops" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;"></div>
        </div>

        <div style="margin-bottom:10px;">
          <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;">20 Frosted Glassmorphism Row Styles</div>
          <div id="modalGlassChatListSwatches" class="nex-chatlist-swatch-grid"></div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
          <div>
            <label style="font-size:11.5px;font-weight:600;">Card Shape</label>
            <select id="modalChatListCardStyleSelect" class="settings-select" style="margin-top:4px;">
              <option value="frosted-cards">Frosted Cards</option>
              <option value="prism-trim">Prism Neon Trim</option>
              <option value="ultra-clear">Ultra Clear Film</option>
              <option value="aurora-pills">Aurora Pill Rows</option>
            </select>
          </div>
          <div>
            <label style="font-size:11.5px;font-weight:600;">Frosted Blur: <span id="modalChatListBlurVal">16px</span></label>
            <input type="range" id="modalChatListBlurRange" min="6" max="28" step="2" value="16" class="settings-input" style="width:100%;" />
          </div>
          <div>
            <label style="font-size:11.5px;font-weight:600;">Row Glass Opacity: <span id="modalChatListOpacityVal">56%</span></label>
            <input type="range" id="modalChatListOpacityRange" min="20" max="88" step="4" value="56" class="settings-input" style="width:100%;" />
          </div>
          <div>
            <label style="font-size:11.5px;font-weight:600;">Backdrop Dim: <span id="modalChatListBgDimVal">42%</span></label>
            <input type="range" id="modalChatListBgDimRange" min="0" max="85" step="5" value="42" class="settings-input" style="width:100%;" />
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const presetRow = modal.querySelector('#modalChatListPresetBackdrops');
    CHATLIST_BUILT_IN_BACKDROPS.forEach((b) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-secondary';
      btn.style.cssText = 'min-width:94px;height:42px;border-radius:10px;font-size:10.5px;font-weight:700;background-size:cover;color:#fff;text-shadow:0 1px 4px #000;flex-shrink:0;';
      btn.style.backgroundImage = `url("${b.url}")`;
      btn.textContent = b.label;
      btn.onclick = () => {
        applyChatListWallpaper(b.url);
        if (localStorage.getItem('nex_chatlist_theme') === 'none' || !localStorage.getItem('nex_chatlist_theme')) {
          applyChatListTheme('telegram-glass');
        }
      };
      presetRow.appendChild(btn);
    });

    modal.querySelector('#closeChatListStudioBtn').onclick = () => modal.classList.remove('open');
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
    modal.querySelector('#modalChatListPicInput').addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      if (f) await handleChatListPictureUpload(f);
      e.target.value = '';
    });
    modal.querySelector('#modalChatListBrowseWallpapersBtn').onclick = () => {
      modal.classList.remove('open');
      if (typeof window.openChatWallpaperPicker === 'function') {
        window.openChatWallpaperPicker(null, 'Chat List', false, 'chatlist');
      }
    };
    modal.querySelector('#modalChatListUseAvatarBtn').onclick = () => {
      const rawAvatar = document.getElementById('myAvatar')?.src || localStorage.getItem('user_avatar') || window.myProfilePic || '';
      const isDefaultLogo = !rawAvatar || /logo\.jpg$/i.test(rawAvatar);
      applyChatListWallpaper(isDefaultLogo ? DEFAULT_FUTURISTIC_CHATLIST_BG : rawAvatar);
      if (localStorage.getItem('nex_chatlist_theme') === 'none' || !localStorage.getItem('nex_chatlist_theme')) {
        applyChatListTheme('telegram-glass');
      }
    };
    modal.querySelector('#modalChatListClearPicBtn').onclick = () => applyChatListWallpaper(null);

    modal.querySelector('#modalChatListCardStyleSelect').addEventListener('change', (e) => {
      try { localStorage.setItem('nex_chatlist_card_style', e.target.value); } catch (_) {}
      applyChatListGlassVars();
    });
    [
      ['modalChatListBlurRange', 'nex_chatlist_blur'],
      ['modalChatListOpacityRange', 'nex_chatlist_opacity'],
      ['modalChatListBgDimRange', 'nex_chatlist_bg_dim']
    ].forEach(([id, key]) => {
      modal.querySelector(`#${id}`).addEventListener('input', (e) => {
        try { localStorage.setItem(key, e.target.value); } catch (_) {}
        applyChatListGlassVars();
      });
    });
  }

  const savedBg = localStorage.getItem('nex_chatlist_bg');
  const cleared = localStorage.getItem('nex_chatlist_bg_cleared') === 'true';
  const effectiveBg = savedBg || (!cleared ? DEFAULT_FUTURISTIC_CHATLIST_BG : '');
  const prev = modal.querySelector('#modalChatListLivePreview');
  if (prev) prev.style.backgroundImage = effectiveBg ? `url("${effectiveBg}")` : '';
  renderChatListSwatches('modalGlassChatListSwatches', localStorage.getItem('nex_chatlist_theme') || 'telegram-glass');
  applyChatListGlassVars();
  modal.classList.add('open');
}

export function initChatExperienceStudio() {
  applyChatListTheme(localStorage.getItem('nex_chatlist_theme') || 'telegram-glass');
  const savedBg = localStorage.getItem('nex_chatlist_bg');
  const cleared = localStorage.getItem('nex_chatlist_bg_cleared') === 'true';
  if (savedBg) applyChatListWallpaper(savedBg);
  else if (!cleared) applyChatListWallpaper(DEFAULT_FUTURISTIC_CHATLIST_BG);
  setTypingFxStyle(localStorage.getItem('nex_typing_fx_style') || 'kinetic');
  bindFilterTabSwipeGestures();
  bindEdgeSwipeBackAndScrollPhysics();
  bindComposerKeystrokeEffects();
  bindStudioSettingsControls();

  if (typeof window !== 'undefined') {
    window.NexChatExperienceStudio = {
      openChatListStudioModal,
      applyChatListTheme,
      applyChatListWallpaper,
      setTypingFxStyle,
      triggerMessageSendLaunchFx,
      preloadImageEager
    };
  }
}
