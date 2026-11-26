/**
 * =============================================================================
 * NEXCHAT MOBILE UI/UX AUDIT RUNTIME COORDINATOR (v1.0)
 * =============================================================================
 * Self-initializing runtime loaded by chat.html. Coordinates:
 *   1. Single-modal stacking & strict closed-state inert/aria-hidden/focus guard
 *   2. First-tap reliability (<8px touch/pointer) on nav, chat rows, & menu items
 *   3. Dispatches / Alerts 4s timeout watchdog -> offline + Retry Sync + wrapping
 *   4. Three-dot #chatOptionsMenu categorized sections, live filter & backdrop
 *   5. Status Studio inline unsaved-draft guard & Ghost/Aegis toggle state sync
 *
 * STRICTLY 0 UNICODE EMOJIS. Pure Windows CRLF safe ES module.
 * =============================================================================
 */

const MODAL_ROOT_SELECTOR = [
  '.modal',
  '.cyber-hub-modal',
  '.cyber-modal-backdrop',
  '.nextgen-modal-overlay',
  '.nex-ext-modal-backdrop',
  '.channels-modal-overlay',
  '.whatsapp-channel-route',
  '[class*="-modal"]',
  '#nexExtensionHubModal',
  '#nexConsentModal',
  '#extensionsDrawer',
  '#createStatusModal',
  '#statusMusicPickerModal',
  '#nexCyberHubModal',
  '#cyberHubModal',
  '#settingsModal',
  '#nexbotStudioModal',
  '#neuralRadarModal',
  '#cipherPinModal',
  '#streakStatusModal',
  '#cyberLootboxModal',
  '#cyberStreakModal',
  '#nexDailyStreakModal',
  '#channelsExploreModal',
  '#createChannelModal',
  '#channelFeedModal',
  '#chronexGhostSettingsModal',
  '#chronexGhostBriefingModal',
  '#globalDropComposerModal',
  '#globalDropRepliesDrawer',
  '#globalDropUserProfileModal'
].join(', ');

const NON_MODAL_TAGS = new Set([
  'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A', 'SPAN', 'I', 'SVG', 'PATH',
  'LABEL', 'IMG', 'VIDEO', 'AUDIO', 'SMALL', 'STRONG', 'P', 'H1', 'H2', 'H3', 'H4'
]);

const IGNORED_MODAL_CLASSES = [
  'modal-content', 'modal-body', 'modal-header', 'modal-footer', 'modal-dialog',
  'close-modal', 'modal-close', 'cyber-modal-window', 'cyber-modal-close',
  'nex-ext-modal-window', 'channels-modal-card', 'nextgen-modal-card',
  'nextgen-modal-header', 'nextgen-modal-close', 'status-studio-card'
];

const IGNORED_MODAL_IDS = new Set([
  'chatOptionsMenu',
  'chatOptionsBackdrop',
  'mobileDropdownMenu',
  'statusUnsavedConfirmBar'
]);

const CHAT_OPTION_GROUPS = [
  {
    key: 'media',
    label: 'Media & Search',
    ids: new Set([
      'callBtn', 'videoCallBtn', 'menuSearchInChatBtn', 'menuWallpaperBtn',
      'menuP2PTransferBtn', 'menuTacticalScreenBtn', 'menuGroupStageBtn',
      'menuNanoCanvasBtn', 'groupAdminBtn', 'groupInviteQrBtn'
    ])
  },
  {
    key: 'ai',
    label: 'AI & Tools',
    ids: new Set([
      'toggleChatAutoTranslateBtn', 'openTranslationHubOptionBtn',
      'menuChronexxSummaryBtn', 'menuChronexxAllSummaryBtn',
      'menuCompanionToggleBtn', 'menuTrackRecordBtn',
      'menuProbingBtn', 'menuVoicePersonasBtn'
    ])
  },
  {
    key: 'privacy',
    label: 'Privacy & Safety',
    ids: new Set([
      'hideChatInGhostVaultBtn', 'menuDeadDropBtn', 'menuSleepProtocolBtn',
      'menuZenShieldBtn', 'blockBtn', 'unblockBtn', 'groupLeaveBtn',
      'reportBtn', 'deleteBtn'
    ])
  }
];

class NexMobileAuditRuntimeController {
  constructor() {
    this.isBooted = false;
    this.isCoordinatingModals = false;
    this._modalObserver = null;
    this._modalObserverConfig = null;
    this.suspendedStatusParent = false;
    this.previouslyFocusedByModal = new WeakMap();
    this.openModalOrder = [];
    this.dispatchTimeoutId = null;
    this.chatOptionsBackdrop = null;
    this.lastGhostState = null;
  }

  init() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (this.isBooted) return;
    this.isBooted = true;

    this.injectRuntimeStyles();
    this.installModalCoordinator();
    this.installFirstTapCoordinator();
    this.installDispatchesWatchdog();
    this.installChatOptionsEnhancer();
    this.installStatusUnsavedGuard();
    this.installGhostToggleSync();
    this.patchCyberHubMismatch();
  }

  // ---------------------------------------------------------------------------
  // 0. SHARED RUNTIME STYLES
  // ---------------------------------------------------------------------------
  injectRuntimeStyles() {
    if (document.getElementById('nexMobileAuditRuntimeStyles')) return;
    const style = document.createElement('style');
    style.id = 'nexMobileAuditRuntimeStyles';
    style.textContent = `
      /* Enforce non-interactive hidden state on closed modals */
      [data-nex-modal-closed="true"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      /* Mobile & Dispatches dropdown wrapping + full labels */
      #mobileDropdownMenu {
        min-width: min(260px, 88vw) !important;
        max-width: calc(100vw - 24px) !important;
      }
      #mobileDropdownMenu .mobile-menu-item,
      .mobile-dropdown-menu .mobile-menu-item {
        white-space: normal !important;
        word-break: break-word !important;
        overflow-wrap: anywhere !important;
        line-height: 1.3 !important;
        height: auto !important;
        min-height: 42px !important;
        padding-top: 9px !important;
        padding-bottom: 9px !important;
        text-align: left !important;
      }
      #announcementLangSelect,
      #announcementsContainer select {
        max-width: 100% !important;
        min-height: 36px;
        height: auto;
        white-space: normal;
        text-overflow: clip;
      }

      /* Dispatches timeout card */
      .nex-dispatch-timeout-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 24px 18px;
        margin: 12px 0;
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(245, 158, 11, 0.42);
        text-align: center;
        color: #f8fafc;
      }
      .nex-dispatch-retry-btn {
        padding: 9px 18px;
        border-radius: 999px;
        border: 1px solid rgba(0, 242, 255, 0.55);
        background: rgba(0, 242, 255, 0.16);
        color: #67e8f9;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }

      /* Three-dot #chatOptionsMenu search, groups & backdrop */
      .nex-chat-options-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.48);
        backdrop-filter: blur(2px);
        z-index: 10001;
        display: none;
      }
      .nex-chat-options-backdrop.open {
        display: block;
      }
      #chatOptionsMenu {
        z-index: 10002 !important;
        max-height: min(76vh, 540px);
        overflow-y: auto;
      }
      .nex-chat-options-search-wrap {
        position: sticky;
        top: 0;
        z-index: 2;
        padding: 8px 10px;
        background: rgba(10, 15, 28, 0.98);
        border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #chatOptionsFilterInput {
        width: 100%;
        background: rgba(30, 41, 59, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 8px;
        color: #f8fafc;
        font-size: 12.5px;
        padding: 6px 10px;
        outline: none;
      }
      #chatOptionsFilterInput:focus {
        border-color: #00f2ff;
      }
      .nex-chat-options-group-header {
        padding: 8px 12px 4px;
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 0.7px;
        text-transform: uppercase;
        color: #38bdf8;
        border-top: 1px solid rgba(148, 163, 184, 0.14);
        margin-top: 4px;
      }
      .nex-chat-options-group:first-of-type .nex-chat-options-group-header {
        border-top: none;
        margin-top: 0;
      }
      .nex-menu-filter-hidden,
      .nex-chat-options-group.nex-menu-filter-hidden {
        display: none !important;
      }

      /* Inline Status Studio discard confirmation bar */
      .nex-status-unsaved-bar {
        display: none;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        padding: 10px 14px;
        margin: 8px 0 0;
        border-radius: 10px;
        background: rgba(127, 29, 29, 0.28);
        border: 1px solid rgba(248, 113, 113, 0.55);
        color: #fee2e2;
        font-size: 12.5px;
        font-weight: 700;
      }
      .nex-status-unsaved-bar.visible {
        display: flex;
      }
      .nex-status-unsaved-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
      }
      .nex-status-keep-btn,
      .nex-status-discard-btn {
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        border: 1px solid transparent;
      }
      .nex-status-keep-btn {
        background: rgba(15, 23, 42, 0.9);
        border-color: rgba(148, 163, 184, 0.4);
        color: #e2e8f0;
      }
      .nex-status-discard-btn {
        background: rgba(239, 68, 68, 0.24);
        border-color: rgba(248, 113, 113, 0.7);
        color: #fecaca;
      }

      /* Stealth Ghost toggle active badge + glow */
      #stealthGhostToggleBtn.ghost-active,
      #stealthGhostBtnMobile.ghost-active {
        color: #00f2ff !important;
        border-color: rgba(0, 242, 255, 0.72) !important;
        background: rgba(0, 242, 255, 0.16) !important;
        box-shadow: 0 0 14px rgba(0, 242, 255, 0.42), inset 0 0 8px rgba(0, 242, 255, 0.2) !important;
        position: relative;
      }
      .nex-ghost-state-pill {
        display: inline-flex;
        align-items: center;
        padding: 1px 5px;
        margin-left: 5px;
        border-radius: 999px;
        font-size: 8.5px;
        font-weight: 800;
        background: rgba(0, 242, 255, 0.22);
        border: 1px solid rgba(0, 242, 255, 0.75);
        color: #00f2ff;
        line-height: 1.1;
        pointer-events: none;
      }
      .nex-ghost-state-pill[data-state="off"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // 1. MUTATION OBSERVER & SINGLE-MODAL STACKING COORDINATOR
  // ---------------------------------------------------------------------------
  isModalRoot(el) {
    if (!el || el.nodeType !== 1) return false;
    if (NON_MODAL_TAGS.has(el.tagName)) return false;
    if (IGNORED_MODAL_IDS.has(el.id)) return false;
    if (el.getAttribute('role') === 'tooltip') return false;

    for (const cls of IGNORED_MODAL_CLASSES) {
      if (el.classList.contains(cls)) return false;
    }

    const matchesKnown = el.matches(MODAL_ROOT_SELECTOR);
    if (!matchesKnown && el.getAttribute('aria-modal') !== 'true') return false;

    // Exclude decorative/non-overlay sub-elements inside another modal
    const parentModal = el.parentElement?.closest('.modal, .cyber-hub-modal, .nextgen-modal-overlay, .nex-ext-modal-backdrop, .channels-modal-overlay');
    if (parentModal && parentModal !== el && el.id !== 'statusMusicPickerModal') {
      return false;
    }
    return true;
  }

  isModalVisuallyOpen(el) {
    if (!el || !el.isConnected) return false;
    if (el.hidden || el.getAttribute('hidden') !== null) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;

    const inlineDisplay = (el.style.display || '').toLowerCase();
    if (inlineDisplay === 'none') return false;
    if (el.style.opacity === '0' && el.style.pointerEvents === 'none') return false;

    if (el.classList.contains('open') || el.classList.contains('active') || el.classList.contains('show')) {
      return true;
    }

    if (inlineDisplay && inlineDisplay !== 'none') {
      return true;
    }

    if (typeof window.getComputedStyle === 'function') {
      try {
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        if (cs.opacity === '0' && cs.pointerEvents === 'none') return false;
        return cs.display !== 'none';
      } catch (_) { }
    }
    return false;
  }

  isModalAlreadyClosed(el) {
    if (!el) return true;
    return (
      el.dataset?.nexModalClosed === 'true' &&
      el.getAttribute('aria-hidden') === 'true' &&
      el.hidden === true &&
      el.inert === true &&
      !el.classList.contains('open') &&
      !el.classList.contains('active') &&
      !el.classList.contains('show') &&
      el.style.display === 'none'
    );
  }

  runWithModalCoordination(fn) {
    if (this.isCoordinatingModals) return;
    this.isCoordinatingModals = true;
    try {
      fn();
    } finally {
      if (this._modalObserver) {
        try { this._modalObserver.takeRecords(); } catch (_) { }
      }
      this.isCoordinatingModals = false;
    }
  }

  markModalClosed(el) {
    if (!el || !el.isConnected) return;
    const activeEl = document.activeElement;
    if (activeEl && el.contains(activeEl)) {
      try { activeEl.blur(); } catch (_) { }
      const restore = this.previouslyFocusedByModal.get(el);
      if (restore && restore.isConnected && !el.contains(restore)) {
        try { restore.focus({ preventScroll: true }); } catch (_) { }
      }
    }

    if (this.openModalOrder.includes(el)) {
      this.openModalOrder = this.openModalOrder.filter((m) => m !== el);
    }

    if (this.isModalAlreadyClosed(el)) {
      return;
    }

    if (el.dataset?.nexModalClosed !== 'true') {
      el.setAttribute('data-nex-modal-closed', 'true');
    }
    if (el.getAttribute('aria-hidden') !== 'true') {
      el.setAttribute('aria-hidden', 'true');
    }
    if (!el.hidden) {
      el.hidden = true;
    }
    if (!el.hasAttribute('hidden')) {
      el.setAttribute('hidden', '');
    }
    if (!el.inert) {
      el.inert = true;
    }
    if (!el.hasAttribute('inert')) {
      el.setAttribute('inert', '');
    }
    if (el.classList.contains('open') || el.classList.contains('active') || el.classList.contains('show')) {
      el.classList.remove('open', 'active', 'show');
    }
    if (el.style.display !== 'none') {
      el.style.display = 'none';
    }
  }

  markModalOpen(el) {
    if (!el || !el.isConnected) return;
    const prev = document.activeElement;
    if (prev && !el.contains(prev) && typeof prev.focus === 'function') {
      this.previouslyFocusedByModal.set(el, prev);
    }

    if (el.hasAttribute('data-nex-modal-closed')) {
      el.removeAttribute('data-nex-modal-closed');
    }
    if (el.hidden) {
      el.hidden = false;
    }
    if (el.hasAttribute('hidden')) {
      el.removeAttribute('hidden');
    }
    if (el.inert) {
      el.inert = false;
    }
    if (el.hasAttribute('inert')) {
      el.removeAttribute('inert');
    }
    if (el.getAttribute('aria-hidden') !== 'false') {
      el.setAttribute('aria-hidden', 'false');
    }
    if (el.style.display === 'none') {
      el.style.display = 'flex';
    }
    this.openModalOrder = this.openModalOrder.filter((m) => m !== el);
    this.openModalOrder.push(el);
  }

  enforceSingleModalFor(activeModal) {
    if (!activeModal || this.isCoordinatingModals) return;
    this.runWithModalCoordination(() => {
      // Nested Status Music Picker pauses Create Status without wiping draft
      if (activeModal.id === 'statusMusicPickerModal') {
        const statusModal = document.getElementById('createStatusModal');
        if (statusModal && this.isModalVisuallyOpen(statusModal)) {
          this.suspendedStatusParent = true;
          this.markModalClosed(statusModal);
        }
      }

      document.querySelectorAll(MODAL_ROOT_SELECTOR).forEach((candidate) => {
        if (!this.isModalRoot(candidate) || candidate === activeModal) return;
        if (activeModal.contains(candidate) || candidate.contains(activeModal)) return;
        if (this.isModalVisuallyOpen(candidate)) {
          this.markModalClosed(candidate);
        }
      });

      this.markModalOpen(activeModal);
    });
  }

  sweepAllModals() {
    if (this.isCoordinatingModals) return;
    this.runWithModalCoordination(() => {
      const openModals = [];
      document.querySelectorAll(MODAL_ROOT_SELECTOR).forEach((el) => {
        if (!this.isModalRoot(el)) return;
        if (this.isModalVisuallyOpen(el)) {
          openModals.push(el);
        } else {
          this.markModalClosed(el);
        }
      });

      // Keep only top-most active modal open
      if (openModals.length > 1) {
        const winner = openModals[openModals.length - 1];
        openModals.forEach((m) => {
          if (m !== winner && !winner.contains(m) && !m.contains(winner)) {
            this.markModalClosed(m);
          }
        });
      }
    });
  }

  didMutationOpenModal(el, mutation) {
    if (mutation.attributeName === 'style') {
      const oldStyle = (mutation.oldValue || '').toLowerCase();
      const newDisp = (el.style.display || '').toLowerCase();
      const wasNone = /display\s*:\s*none/.test(oldStyle) || el.getAttribute('data-nex-modal-closed') === 'true';
      if (wasNone && newDisp && newDisp !== 'none') return true;
    }
    if (mutation.attributeName === 'class') {
      const oldClasses = new Set((mutation.oldValue || '').split(/\s+/));
      for (const cls of ['open', 'active', 'show']) {
        if (el.classList.contains(cls) && !oldClasses.has(cls)) return true;
      }
    }
    if (mutation.attributeName === 'hidden' && !el.hidden && el.style.display !== 'none') {
      return true;
    }
    if (mutation.attributeName === 'aria-hidden' && el.getAttribute('aria-hidden') === 'false' && el.style.display !== 'none') {
      return true;
    }
    return false;
  }

  didMutationCloseModal(el, mutation) {
    if (mutation.attributeName === 'style') {
      const disp = (el.style.display || '').toLowerCase();
      if (disp === 'none') return true;
      if (el.style.opacity === '0' && el.style.pointerEvents === 'none') return true;
    }
    if (mutation.attributeName === 'class') {
      const oldClasses = new Set((mutation.oldValue || '').split(/\s+/));
      for (const cls of ['open', 'active', 'show']) {
        if (oldClasses.has(cls) && !el.classList.contains(cls)) return true;
      }
    }
    if (mutation.attributeName === 'hidden' && (el.hidden || el.getAttribute('hidden') !== null)) {
      return true;
    }
    if (mutation.attributeName === 'aria-hidden' && el.getAttribute('aria-hidden') === 'true') {
      return true;
    }
    return false;
  }

  installModalCoordinator() {
    this.sweepAllModals();
    requestAnimationFrame(() => this.sweepAllModals());
    setTimeout(() => this.sweepAllModals(), 350);
    setTimeout(() => this.sweepAllModals(), 1100);

    const observer = new MutationObserver((mutations) => {
      if (this.isCoordinatingModals) return;

      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) return;
            const candidates = this.isModalRoot(node)
              ? [node]
              : Array.from(node.querySelectorAll?.(MODAL_ROOT_SELECTOR) || []).filter((c) => this.isModalRoot(c));
            candidates.forEach((modalEl) => {
              if (this.isModalVisuallyOpen(modalEl)) {
                this.enforceSingleModalFor(modalEl);
              } else if (!this.isModalAlreadyClosed(modalEl)) {
                this.runWithModalCoordination(() => this.markModalClosed(modalEl));
              }
            });
          });
          m.removedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.id === 'statusMusicPickerModal' && this.suspendedStatusParent) {
              this.suspendedStatusParent = false;
              const statusModal = document.getElementById('createStatusModal');
              if (statusModal) this.enforceSingleModalFor(statusModal);
            }
          });
          continue;
        }

        if (m.type === 'attributes' && this.isModalRoot(m.target)) {
          const el = m.target;
          if (this.didMutationOpenModal(el, m)) {
            this.enforceSingleModalFor(el);
          } else if (this.didMutationCloseModal(el, m)) {
            if (!this.isModalAlreadyClosed(el)) {
              this.runWithModalCoordination(() => this.markModalClosed(el));
            }
            if (el.id === 'statusMusicPickerModal' && this.suspendedStatusParent) {
              this.suspendedStatusParent = false;
              const statusModal = document.getElementById('createStatusModal');
              if (statusModal) this.enforceSingleModalFor(statusModal);
            }
          }
        }
      }
    });

    this._modalObserver = observer;
    this._modalObserverConfig = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['style', 'class', 'hidden', 'aria-hidden']
    };
    observer.observe(document.body, this._modalObserverConfig);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const chatMenu = document.getElementById('chatOptionsMenu');
      if (chatMenu && chatMenu.style.display && chatMenu.style.display !== 'none' && !chatMenu.hidden) {
        if (typeof window.closeChatOptionsMenu === 'function') window.closeChatOptionsMenu();
        return;
      }
      const topModal = [...this.openModalOrder].reverse().find((m) => this.isModalVisuallyOpen(m));
      if (!topModal) return;
      if (topModal.id === 'createStatusModal' && typeof window.closeCreateStatusModal === 'function') {
        window.closeCreateStatusModal();
      } else {
        this.runWithModalCoordination(() => this.markModalClosed(topModal));
      }
    });
  }

  patchCyberHubMismatch() {
    const attemptPatch = () => {
      if (typeof window.toggleCyberHubModal !== 'function' || window.toggleCyberHubModal._nexPatched) return;
      const orig = window.toggleCyberHubModal;
      const wrapped = (...args) => {
        const res = orig.apply(window, args);
        const hub = document.getElementById('cyberHubModal') || document.getElementById('nexCyberHubModal');
        if (hub && !document.getElementById('cyberHubModal')) {
          const isOpen = this.isModalVisuallyOpen(hub);
          if (isOpen) {
            this.runWithModalCoordination(() => this.markModalClosed(hub));
          } else {
            this.enforceSingleModalFor(hub);
          }
        }
        return res;
      };
      wrapped._nexPatched = true;
      window.toggleCyberHubModal = wrapped;
    };

    attemptPatch();
    setTimeout(attemptPatch, 400);
  }

  // ---------------------------------------------------------------------------
  // 2. FIRST-TAP RELIABILITY (<8px MOVE ON NAV, CHAT ROWS & MENU ITEMS)
  // ---------------------------------------------------------------------------
  installFirstTapCoordinator() {
    const TARGET_SELECTOR = [
      '#nav-calls',
      '.bottom-nav .nav-item',
      '.chat-item',
      '.chat-list-item',
      '#mobileMenuBtn',
      '.mobile-menu-item',
      '#dailyStreakDropBtnHeader',
      '#cyberStreakBtn',
      '#cyberStreakBtnHeader',
      '#mobileStreakBtn',
      '.chat-menu-btn'
    ].join(', ');

    let activeTap = null;
    let sawBubbleClickOnTarget = null;
    let syntheticInProgress = false;

    const getCoords = (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      }
      return { x: e.clientX || 0, y: e.clientY || 0 };
    };

    const startTap = (e) => {
      if (e.button && e.button !== 0) return;
      const el = e.target?.closest?.(TARGET_SELECTOR);
      if (!el) return;
      const pt = getCoords(e);
      activeTap = { el, x: pt.x, y: pt.y, startedAt: Date.now() };
      sawBubbleClickOnTarget = null;
    };

    const finishTap = (e) => {
      if (!activeTap) return;
      const tap = activeTap;
      activeTap = null;
      const pt = getCoords(e);
      const dist = Math.hypot(pt.x - tap.x, pt.y - tap.y);
      const elapsed = Date.now() - tap.startedAt;
      if (dist >= 8 || elapsed > 650 || !tap.el.isConnected) return;

      // Lift AirGap / swipe suppression flags if a genuine tap landed
      window._nexLastCleanTapAt = Date.now();

      setTimeout(() => {
        if (!tap.el.isConnected) return;
        if (sawBubbleClickOnTarget === tap.el) return;
        if (syntheticInProgress) return;
        syntheticInProgress = true;
        try {
          tap.el.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          }));
        } finally {
          syntheticInProgress = false;
        }
      }, 95);
    };

    window.addEventListener('pointerdown', startTap, { capture: true, passive: true });
    window.addEventListener('touchstart', startTap, { capture: true, passive: true });
    window.addEventListener('pointerup', finishTap, { capture: true, passive: true });
    window.addEventListener('touchend', finishTap, { capture: true, passive: true });

    document.addEventListener('click', (e) => {
      const matched = e.target?.closest?.(TARGET_SELECTOR);
      if (matched) {
        sawBubbleClickOnTarget = matched;
      }
    }, false);
  }

  // ---------------------------------------------------------------------------
  // 3. ALERTS / DISPATCHES 4s TIMEOUT & RETRY SYNC
  // ---------------------------------------------------------------------------
  installDispatchesWatchdog() {
    const checkDispatchesState = () => {
      const container = document.getElementById('announcementsContainer');
      const feed = document.getElementById('announcementsFeed');
      const emptyState = document.getElementById('announcementsEmptyState');
      if (!container || !emptyState) return;

      const hasLoadedCards = !!(feed && feed.querySelector('.announcement-card, .dispatch-card, [data-announcement-id]'));
      const text = (emptyState.textContent || '').trim();
      const isConnecting = /Connecting to NEX Protocol Network/i.test(text);

      if (hasLoadedCards || !isConnecting) {
        if (this.dispatchTimeoutId) {
          clearTimeout(this.dispatchTimeoutId);
          this.dispatchTimeoutId = null;
        }
        return;
      }

      if (this.dispatchTimeoutId) return;

      this.dispatchTimeoutId = setTimeout(() => {
        this.dispatchTimeoutId = null;
        const stillEmpty = !(feed && feed.querySelector('.announcement-card, .dispatch-card, [data-announcement-id]'));
        const stillConnecting = /Connecting to NEX Protocol Network/i.test(emptyState.textContent || '');
        if (!stillEmpty || !stillConnecting) return;

        const beaconLabel = container.querySelector('.announcements-live-beacon .beacon-label');
        if (beaconLabel) beaconLabel.textContent = 'OFFLINE';

        emptyState.innerHTML = `
          <div class="nex-dispatch-timeout-card" role="status" aria-live="polite">
            <i class="fa-solid fa-satellite-dish" style="font-size:24px;color:#fbbf24;"></i>
            <div style="font-size:15px;font-weight:800;color:#ffffff;">Protocol sync paused or offline</div>
            <div style="font-size:12.5px;color:#94a3b8;max-width:300px;line-height:1.45;">
              Dispatches could not connect within 4 seconds. Check your connection and try syncing again.
            </div>
            <button type="button" id="retryAnnouncementsSyncBtn" class="nex-dispatch-retry-btn">
              <i class="fa-solid fa-rotate-right"></i> Retry Sync
            </button>
          </div>
        `;

        document.getElementById('retryAnnouncementsSyncBtn')?.addEventListener('click', () => {
          if (beaconLabel) beaconLabel.textContent = 'SYNCING';
          emptyState.innerHTML = `
            <div style="padding:24px 16px;text-align:center;color:#94a3b8;">
              <i class="fa-solid fa-spinner fa-spin" style="font-size:20px;color:#00f2ff;margin-bottom:8px;"></i>
              <div>Connecting to NEX Protocol Network...</div>
            </div>
          `;
          if (typeof window.loadAnnouncements === 'function') {
            try { window.loadAnnouncements(true); } catch (_) { }
          } else {
            document.getElementById('refreshAnnouncementsBtn')?.click();
          }
          checkDispatchesState();
        });
      }, 4000);
    };

    checkDispatchesState();

    const target = document.getElementById('announcementsContainer') || document.body;
    const obs = new MutationObserver(() => checkDispatchesState());
    obs.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });

    document.getElementById('refreshAnnouncementsBtn')?.addEventListener('click', () => {
      setTimeout(checkDispatchesState, 50);
    });
  }

  // ---------------------------------------------------------------------------
  // 4. THREE-DOT #chatOptionsMenu GROUPING, FILTER & BACKDROP
  // ---------------------------------------------------------------------------
  installChatOptionsEnhancer() {
    const menu = document.getElementById('chatOptionsMenu');
    if (!menu) return;

    this.organizeChatOptionsMenu(menu);
    this.ensureChatOptionsBackdrop(menu);

    let isSyncingMenu = false;
    let menuObs = null;
    const syncMenuState = () => {
      if (isSyncingMenu) return;
      isSyncingMenu = true;
      try {
        const isOpen = menu.style.display && menu.style.display !== 'none' && !menu.hidden && !menu.classList.contains('hidden');
        if (isOpen) {
          if (menu.hidden) menu.hidden = false;
          if (menu.hasAttribute('hidden')) menu.removeAttribute('hidden');
          if (menu.inert) menu.inert = false;
          if (menu.hasAttribute('inert')) menu.removeAttribute('inert');
          if (menu.getAttribute('aria-hidden') !== 'false') menu.setAttribute('aria-hidden', 'false');
          if (this.chatOptionsBackdrop) this.chatOptionsBackdrop.classList.add('open');
        } else {
          if (document.activeElement && menu.contains(document.activeElement)) {
            try { document.activeElement.blur(); } catch (_) { }
          }
          if (menu.getAttribute('aria-hidden') !== 'true') menu.setAttribute('aria-hidden', 'true');
          if (!menu.inert) menu.inert = true;
          if (!menu.hasAttribute('inert')) menu.setAttribute('inert', '');
          if (this.chatOptionsBackdrop) this.chatOptionsBackdrop.classList.remove('open');
          const filterInput = document.getElementById('chatOptionsFilterInput');
          if (filterInput && filterInput.value) {
            filterInput.value = '';
            this.filterChatOptions(menu, '');
          }
        }
      } finally {
        if (menuObs) {
          try { menuObs.takeRecords(); } catch (_) { }
        }
        isSyncingMenu = false;
      }
    };

    syncMenuState();

    menuObs = new MutationObserver(syncMenuState);
    menuObs.observe(menu, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });

    if (typeof window.closeChatOptionsMenu === 'function' && !window.closeChatOptionsMenu._nexAuditWrapped) {
      const origClose = window.closeChatOptionsMenu;
      const wrappedClose = (...args) => {
        const res = origClose.apply(window, args);
        syncMenuState();
        return res;
      };
      wrappedClose._nexAuditWrapped = true;
      window.closeChatOptionsMenu = wrappedClose;
    }

    if (typeof window.toggleChatOptionsMenu === 'function' && !window.toggleChatOptionsMenu._nexAuditWrapped) {
      const origToggle = window.toggleChatOptionsMenu;
      const wrappedToggle = (...args) => {
        const res = origToggle.apply(window, args);
        requestAnimationFrame(syncMenuState);
        return res;
      };
      wrappedToggle._nexAuditWrapped = true;
      window.toggleChatOptionsMenu = wrappedToggle;
    }
  }

  organizeChatOptionsMenu(menu) {
    if (menu.dataset.nexGrouped === '1') return;
    menu.dataset.nexGrouped = '1';

    const existingItems = Array.from(menu.querySelectorAll('.option-item'));
    if (!existingItems.length) return;

    // Remove legacy plain dividers so grouped headers keep layout clean
    menu.querySelectorAll('.dropdown-divider').forEach((d) => d.remove());

    const searchWrap = document.createElement('div');
    searchWrap.className = 'nex-chat-options-search-wrap';
    searchWrap.innerHTML = `
      <i class="fa-solid fa-magnifying-glass" style="color:#64748b;font-size:12px;"></i>
      <input type="search" id="chatOptionsFilterInput" placeholder="Filter chat options..." aria-label="Filter chat options">
    `;

    const headerEl = menu.querySelector('.dropdown-header');
    if (headerEl) {
      headerEl.insertAdjacentElement('afterend', searchWrap);
    } else {
      menu.insertBefore(searchWrap, menu.firstChild);
    }

    const groupEls = {};
    for (const grp of CHAT_OPTION_GROUPS) {
      const wrapper = document.createElement('div');
      wrapper.className = 'nex-chat-options-group';
      wrapper.dataset.groupKey = grp.key;

      const title = document.createElement('div');
      title.className = 'nex-chat-options-group-header';
      title.textContent = grp.label;
      wrapper.appendChild(title);

      menu.appendChild(wrapper);
      groupEls[grp.key] = wrapper;
    }

    // Move existing DOM buttons preserving every listener attached by chat.js
    for (const btn of existingItems) {
      const targetGroup = CHAT_OPTION_GROUPS.find((g) => g.ids.has(btn.id)) || CHAT_OPTION_GROUPS[1];
      groupEls[targetGroup.key].appendChild(btn);
    }

    const filterInput = searchWrap.querySelector('#chatOptionsFilterInput');
    filterInput?.addEventListener('click', (e) => e.stopPropagation());
    filterInput?.addEventListener('input', (e) => {
      this.filterChatOptions(menu, e.target.value);
    });
  }

  filterChatOptions(menu, query) {
    const needle = String(query || '').trim().toLowerCase();
    menu.querySelectorAll('.nex-chat-options-group').forEach((grp) => {
      let visibleCount = 0;
      grp.querySelectorAll('.option-item').forEach((item) => {
        const text = (item.textContent || '').toLowerCase();
        const matches = !needle || text.includes(needle);
        item.classList.toggle('nex-menu-filter-hidden', !matches);
        if (matches && !item.hidden && !item.classList.contains('hidden') && item.style.display !== 'none') {
          visibleCount += 1;
        }
      });
      grp.classList.toggle('nex-menu-filter-hidden', Boolean(needle) && visibleCount === 0);
    });
  }

  ensureChatOptionsBackdrop(menu) {
    let backdrop = document.getElementById('chatOptionsBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'chatOptionsBackdrop';
      backdrop.className = 'nex-chat-options-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      (menu.parentElement || document.body).insertBefore(backdrop, menu);
    }
    this.chatOptionsBackdrop = backdrop;

    if (!backdrop.dataset.nexBound) {
      backdrop.dataset.nexBound = '1';
      backdrop.addEventListener('click', () => {
        if (typeof window.closeChatOptionsMenu === 'function') {
          window.closeChatOptionsMenu();
        } else {
          menu.style.display = 'none';
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 5. STATUS STUDIO INLINE UNSAVED CONFIRMATION + GHOST/AEGIS SYNC
  // ---------------------------------------------------------------------------
  hasStatusUnsavedDraft() {
    const modal = document.getElementById('createStatusModal');
    if (!modal || !this.isModalVisuallyOpen(modal)) return false;

    const textInputs = [
      'statusTextStoryInput',
      'statusMediaCaptionInput',
      'statusAudioCaptionInput',
      'statusCodeStoryInput'
    ];
    for (const id of textInputs) {
      const el = document.getElementById(id);
      if (el && (el.value || '').trim().length > 0) return true;
    }

    const fileInput = document.getElementById('statusMediaModalFileInput');
    if (fileInput && fileInput.files && fileInput.files.length > 0) return true;
    return false;
  }

  clearStatusDraftFields() {
    ['statusTextStoryInput', 'statusMediaCaptionInput', 'statusAudioCaptionInput', 'statusCodeStoryInput'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    const fileInput = document.getElementById('statusMediaModalFileInput');
    if (fileInput) {
      try { fileInput.value = ''; } catch (_) { }
    }
  }

  ensureStatusUnsavedBar() {
    const modal = document.getElementById('createStatusModal');
    if (!modal) return null;
    let bar = document.getElementById('statusUnsavedConfirmBar');
    if (bar) return bar;

    bar = document.createElement('div');
    bar.id = 'statusUnsavedConfirmBar';
    bar.className = 'nex-status-unsaved-bar';
    bar.setAttribute('role', 'alert');
    bar.innerHTML = `
      <span><i class="fa-solid fa-triangle-exclamation" style="color:#f87171;margin-right:6px;"></i>Discard unsaved status draft?</span>
      <div class="nex-status-unsaved-actions">
        <button type="button" id="statusConfirmKeepBtn" class="nex-status-keep-btn">Keep Editing</button>
        <button type="button" id="statusConfirmDiscardBtn" class="nex-status-discard-btn">Discard</button>
      </div>
    `;

    const footer = modal.querySelector('.status-studio-footer');
    const card = modal.querySelector('.status-studio-card');
    if (footer && footer.parentElement) {
      footer.parentElement.insertBefore(bar, footer);
    } else if (card) {
      card.appendChild(bar);
    } else {
      modal.appendChild(bar);
    }

    bar.querySelector('#statusConfirmKeepBtn')?.addEventListener('click', () => {
      bar.classList.remove('visible');
    });

    bar.querySelector('#statusConfirmDiscardBtn')?.addEventListener('click', () => {
      bar.classList.remove('visible');
      this.clearStatusDraftFields();
      if (typeof window._origCloseCreateStatusModal === 'function') {
        window._origCloseCreateStatusModal(true);
      } else {
        this.runWithModalCoordination(() => this.markModalClosed(modal));
      }
    });

    return bar;
  }

  installStatusUnsavedGuard() {
    const showConfirmOrClose = () => {
      const publishBtn = document.getElementById('publishStatusBtn');
      const isPublishing = Boolean(publishBtn && publishBtn.disabled);
      if (isPublishing || !this.hasStatusUnsavedDraft()) {
        return false;
      }
      const bar = this.ensureStatusUnsavedBar();
      if (bar) {
        bar.classList.add('visible');
        bar.querySelector('#statusConfirmDiscardBtn')?.focus?.({ preventScroll: true });
      }
      return true;
    };

    const wrapClose = () => {
      if (typeof window.closeCreateStatusModal !== 'function' || window.closeCreateStatusModal._nexGuardWrapped) return;
      const origClose = window.closeCreateStatusModal;
      window._origCloseCreateStatusModal = origClose;

      const guardedClose = (force = false, ...rest) => {
        if (force !== true && showConfirmOrClose()) return;
        document.getElementById('statusUnsavedConfirmBar')?.classList.remove('visible');
        return origClose.call(window, force, ...rest);
      };

      guardedClose._nexGuardWrapped = true;
      window.closeCreateStatusModal = guardedClose;
    };

    wrapClose();
    setTimeout(wrapClose, 350);

    // Intercept direct close/cancel clicks even if bound directly to pre-wrap closure
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('#closeCreateStatusModalBtn, #createStatusModal .status-cancel-btn');
      if (closeBtn && showConfirmOrClose()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (e.target.closest('#createStatusBtn, #statusTabAddBtn')) {
        requestAnimationFrame(() => {
          window.NexTransmitterTrimmer?.enhanceStatusStudioTabs?.();
        });
      }
    }, true);
  }

  installGhostToggleSync() {
    const syncStealthButtons = (active, emitToast = false) => {
      const enabled = Boolean(active);
      ['stealthGhostToggleBtn', 'stealthGhostBtnMobile'].forEach((id) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        btn.classList.toggle('active', enabled);
        btn.classList.toggle('ghost-active', enabled);
        let pill = btn.querySelector('.nex-ghost-state-pill');
        if (!pill) {
          pill = document.createElement('span');
          pill.className = 'nex-ghost-state-pill';
          pill.setAttribute('aria-hidden', 'true');
          btn.appendChild(pill);
        }
        pill.setAttribute('data-state', enabled ? 'on' : 'off');
        pill.textContent = enabled ? 'ON' : '';
      });

      const toggleInput = document.getElementById('ghostModeToggle');
      if (toggleInput && toggleInput.checked !== enabled) {
        toggleInput.checked = enabled;
      }

      if (emitToast && this.lastGhostState !== enabled) {
        const msg = enabled ? 'Ghost Mode ON' : 'Ghost Mode OFF';
        if (typeof window.showNotif === 'function') {
          window.showNotif(msg, enabled ? 'success' : 'info', 2400);
        }
      }
      this.lastGhostState = enabled;
    };

    let initial = false;
    try {
      initial = localStorage.getItem('nexchat_stealth_ghost_mode') === 'true' ||
        localStorage.getItem('nex_stealth_mode') === 'true' ||
        document.getElementById('ghostModeToggle')?.checked === true;
    } catch (_) {
      initial = document.getElementById('ghostModeToggle')?.checked === true;
    }
    this.lastGhostState = initial;
    syncStealthButtons(initial, false);

    window.addEventListener('nex:stealth:state_change', (e) => {
      syncStealthButtons(Boolean(e?.detail?.active), true);
    });

    document.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'ghostModeToggle') {
        syncStealthButtons(Boolean(e.target.checked), true);
      }
    });
  }
}

const runtimeInstance = new NexMobileAuditRuntimeController();
if (typeof window !== 'undefined') {
  window.NexMobileAuditRuntime = runtimeInstance;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => runtimeInstance.init());
  } else {
    runtimeInstance.init();
  }
}

export default runtimeInstance;
