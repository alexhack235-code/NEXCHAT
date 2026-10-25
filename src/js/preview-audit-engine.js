/**
 * =============================================================================
 * NEXCHAT - Visual Preview & Screenshot Audit Engine (v1.0)
 * Allows automated visual inspection & screenshot capture of all 5 core
 * WhatsApp-style UI views without requiring live Firebase authentication.
 * Strictly 0 Unicode emojis, standard FontAwesome 6 icons, clean CRLF.
 * =============================================================================
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const isPreview = params.get('preview') === 'true' || window.location.search.includes('preview=true') || window.location.search.includes('audit=true');

  if (!isPreview) return;

  console.log('[PREVIEW AUDIT ENGINE] Initializing automated preview mode...');

  // 1. Disable auth redirection, consent popups & destroy security shields
  window.authRedirectDisabled = true;
  try {
    sessionStorage.setItem('disable_auth_redirect', 'true');
    sessionStorage.setItem('auth_redirect_block', 'true');
    localStorage.setItem('nex_ext_reels_status', 'approved');
    localStorage.setItem('nex_app_install_dismissed', 'true');
  } catch (_) {}

  function cleanOverlays() {
    const messagesArea = document.getElementById('messages-area');
    if (messagesArea) messagesArea.classList.remove('drm-obscure-active');

    const shield = document.getElementById('nexSecurityShield');
    if (shield) shield.remove();

    const consentModal = document.getElementById('nexConsentModal');
    if (consentModal) consentModal.remove();

    const extHub = document.getElementById('nexExtHubModal');
    if (extHub) extHub.remove();

    const installModal = document.getElementById('nexAppInstallModal');
    if (installModal) installModal.remove();

    const loader = document.getElementById('loadingOverlay') || document.getElementById('loading-screen');
    if (loader) loader.style.display = 'none';

    const reloadOverlay = document.getElementById('chatReloadOverlay');
    if (reloadOverlay) reloadOverlay.style.display = 'none';

    const splash = document.getElementById('splash-screen');
    if (splash) splash.style.display = 'none';
  }

  // Periodic safeguard against dynamically injected shields
  cleanOverlays();
  const overlayInterval = setInterval(cleanOverlays, 100);
  setTimeout(() => clearInterval(overlayInterval), 4000);

  const view = params.get('view') || 'chats';
  const isMobile = params.get('mobile') === 'true' || window.location.search.includes('mobile=true');

  function setupPreview() {
    if (isMobile) {
      document.documentElement.classList.add('mobile-preview');
      document.body.classList.add('mobile-preview');
    }
    cleanOverlays();
    console.log('[PREVIEW AUDIT ENGINE] Activating view:', view);

    const chatMain = document.querySelector('.chat-main');
    const chatListView = document.getElementById('chatListView');
    const chatDetailView = document.getElementById('chatDetailView');
    const statusContainer = document.getElementById('statusContainer');
    const callHistoryContainer = document.getElementById('callHistoryContainer');
    const groupsContainer = document.getElementById('groupsContainer');
    const announcementsContainer = document.getElementById('announcementsContainer');

    // Reset visibility of major sections
    if (chatListView) chatListView.style.display = 'none';
    if (chatDetailView) chatDetailView.style.display = 'none';
    if (statusContainer) statusContainer.style.display = 'none';
    if (callHistoryContainer) callHistoryContainer.style.display = 'none';
    if (groupsContainer) groupsContainer.style.display = 'none';
    if (announcementsContainer) announcementsContainer.style.display = 'none';

    // Update bottom navigation active tab
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    switch (view) {
      case 'chats':
        renderChatListView(chatMain, chatListView);
        break;
      case '1on1':
        renderChatListView(null, null); // Also populate left-hand contact list for desktop split screen
        renderDirectChatView(chatMain, chatDetailView);
        break;
      case 'group':
        renderChatListView(null, null); // Also populate left-hand contact list for desktop split screen
        renderGroupChatView(chatMain, chatDetailView);
        break;
      case 'updates':
      case 'status':
        renderUpdatesView(chatMain, statusContainer);
        break;
      case 'calls':
        renderCallsView(chatMain, callHistoryContainer);
        break;
      default:
        renderChatListView(chatMain, chatListView);
    }
  }

  // =========================================================================
  // VIEW 1: CHAT LIST VIEW (WhatsApp Layout)
  // =========================================================================
  function renderChatListView(chatMain, chatListView) {
    if (chatMain) {
      chatMain.style.display = 'flex';
      chatMain.dataset.layout = 'list';
    }
    if (chatListView) chatListView.style.display = 'flex';

    document.getElementById('nav-messages')?.classList.add('active');
    document.getElementById('navChatsCountBadge')?.setAttribute('style', 'display: inline-flex;');

    const contactList = document.getElementById('contactList');
    if (!contactList) return;

    const mockChats = [
      {
        name: 'ChronEX AI',
        avatar: 'chronex-ai.jpg',
        message: 'Quantum neural link calibrated at 99.8% precision.',
        time: '10:45 AM',
        unread: 1,
        status: 'delivered'
      },
      {
        name: 'Alpha Nexus Core',
        avatar: 'logo.jpg',
        message: '~ ChronEX AI: Pull request has been merged into main.',
        time: '10:20 AM',
        unread: 3,
        isGroup: true
      },
      {
        name: 'NEXCHAT Support',
        avatar: 'logo.jpg',
        message: 'Your quantum security enclave has been activated.',
        time: 'Yesterday',
        unread: 0,
        status: 'read'
      },
      {
        name: 'Security & Enclave Alerts',
        avatar: 'logo.jpg',
        message: 'Biometric authorization active on this device.',
        time: 'Yesterday',
        unread: 0,
        status: 'read'
      },
      {
        name: 'Cyber Defense Guild',
        avatar: 'logo.jpg',
        message: '~ Security Enclave: Network protected by quantum firewall.',
        time: '15/10/2026',
        unread: 0,
        isGroup: true
      }
    ];

    contactList.innerHTML = mockChats.map((c, idx) => {
      let tickHtml = '';
      if (c.status === 'read') {
        tickHtml = '<i class="fa-solid fa-check-double" style="color: #53bdeb; font-size: 11px; margin-right: 4px; flex-shrink: 0;"></i>';
      } else if (c.status === 'delivered') {
        tickHtml = '<i class="fa-solid fa-check-double" style="color: #8696a0; font-size: 11px; margin-right: 4px; flex-shrink: 0;"></i>';
      }

      const unreadBadge = c.unread > 0
        ? `<span class="chat-item-unread-badge" style="background: #25d366; color: #000; font-size: 11px; font-weight: 700; min-width: 20px; height: 20px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px; flex-shrink: 0;">${c.unread}</span>`
        : '';

      return `
        <li class="chat-item contact-item" style="display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; width: 100%; box-sizing: border-box; overflow: hidden;">
          <div class="chat-item-avatar-wrapper" style="position: relative; margin-right: 14px; flex-shrink: 0; width: 48px; height: 48px;">
            <img src="${c.avatar}" alt="${c.name}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 1.5px solid rgba(0, 255, 102, 0.3);">
            ${c.unread > 0 ? '<span style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background: #25d366; border-radius: 50%; border: 2px solid #0b141a;"></span>' : ''}
          </div>
          <div class="chat-item-body" style="flex: 1 1 auto; min-width: 0; overflow: hidden;">
            <div class="chat-item-header" style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; min-width: 0;">
              <span class="chat-item-name" style="font-size: 15.5px; font-weight: 600; color: #e9edef; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 1 1 auto;">${c.name}</span>
              <span class="chat-item-time" style="font-size: 11.5px; color: ${c.unread > 0 ? '#25d366' : '#8696a0'}; flex-shrink: 0; margin-left: 8px; text-align: right;">${c.time}</span>
            </div>
            <div class="chat-item-preview-row" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; min-width: 0;">
              <div style="flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13.5px; color: #8696a0; display: flex; align-items: center; gap: 4px;">
                ${tickHtml}<span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.message}</span>
              </div>
              ${unreadBadge ? `<div style="flex-shrink: 0; margin-left: auto;">${unreadBadge}</div>` : ''}
            </div>
          </div>
        </li>
      `;
    }).join('');

    // Ensure filter tabs are rendered and active
    const allTab = document.querySelector('#chatFilterTabs .filter-tab[data-filter="all"]');
    if (allTab) {
      document.querySelectorAll('#chatFilterTabs .filter-tab').forEach(t => t.classList.remove('active'));
      allTab.classList.add('active');
    }
  }

  // =========================================================================
  // VIEW 2: 1-ON-1 DIRECT CONVERSATION VIEW (WhatsApp Layout)
  // =========================================================================
  function renderDirectChatView(chatMain, chatDetailView) {
    document.body.dataset.activeSection = 'chat';
    const topHeader = document.querySelector('.top-header');
    if (topHeader) topHeader.style.setProperty('display', 'none', 'important');
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.setProperty('display', 'none', 'important');
    if (chatMain) {
      chatMain.style.display = 'flex';
      chatMain.dataset.layout = 'conversation';
    }
    if (chatDetailView) {
      chatDetailView.style.display = 'flex';
      chatDetailView.classList.remove('hidden');
      chatDetailView.classList.add('visible');
      chatDetailView.classList.remove('group-chat');
    }

    const header = document.querySelector('.chat-detail-header');
    if (header) header.classList.remove('group-chat');

    const chatName = document.getElementById('chatName');
    if (chatName) chatName.textContent = 'ChronEX AI';

    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = 'Online • Quantum Neural Assistant';

    const chatPic = document.getElementById('chatProfilePic');
    if (chatPic) chatPic.src = 'chronex-ai.jpg';

    const messagesList = document.querySelector('.messages-list');
    if (!messagesList) return;

    messagesList.innerHTML = `
      <div style="text-align: center; margin: 8px auto 14px auto; max-width: 90%; width: 100%; box-sizing: border-box;">
        <span style="background: rgba(17, 24, 39, 0.85); color: #8696a0; font-size: 11px; padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); display: inline-block; line-height: 1.45; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
          <i class="fa-solid fa-lock" style="font-size: 9.5px; color: #00ff66; margin-right: 4px;"></i>Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
        </span>
      </div>

      <!-- Received Message from ChronEX AI -->
      <div class="message-wrapper received" style="display: flex; justify-content: flex-start; margin: 6px 0; padding: 0 4px; width: 100%; box-sizing: border-box;">
        <div class="message-bubble received" style="position: relative; padding: 7px 11px 5px 11px; border-radius: 2px 12px 12px 12px; max-width: 72%; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35); background: #1f2c34; border: 1px solid rgba(255, 255, 255, 0.05); color: #e9edef; font-size: 14px; line-height: 1.45;">
          <div class="message-text-content" style="margin: 0;">Greetings operative! Quantum neural matrix is calibrated and all secure vaults are synchronized.</div>
          <div style="font-size: 10px; margin-top: 4px; opacity: 0.85; display: flex; align-items: center; justify-content: flex-end; gap: 4px; color: #8696a0;">
            <span>10:30 AM</span>
          </div>
        </div>
      </div>

      <!-- Sent Message (Emerald #005c4b) -->
      <div class="message-wrapper sent" style="display: flex; justify-content: flex-end; margin: 6px 0; padding: 0 4px; width: 100%; box-sizing: border-box;">
        <div class="message-bubble sent" style="position: relative; padding: 7px 11px 5px 11px; border-radius: 12px 2px 12px 12px; max-width: 76%; word-wrap: break-word; box-sizing: border-box; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35); background: #005c4b !important; color: #ffffff; font-size: 14px; line-height: 1.45;">
          <div class="message-text-content" style="margin: 0;">Excellent! The WhatsApp interface pass and 4-tab bottom navigation with Market Hub are completely seamless.</div>
          <div style="font-size: 10px; margin-top: 4px; opacity: 0.85; display: flex; align-items: center; justify-content: flex-end; gap: 4px; color: rgba(255, 255, 255, 0.75);">
            <span>10:32 AM</span>
            <i class="fa-solid fa-check-double" style="color: #53bdeb; font-size: 10px; margin-left: 2px;" title="Read"></i>
          </div>
        </div>
      </div>

      <!-- Received Message from ChronEX AI -->
      <div class="message-wrapper received" style="display: flex; justify-content: flex-start; margin: 6px 0; padding: 0 4px; width: 100%; box-sizing: border-box;">
        <div class="message-bubble received" style="position: relative; padding: 7px 11px 5px 11px; border-radius: 2px 12px 12px 12px; max-width: 72%; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35); background: #1f2c34; border: 1px solid rgba(255, 255, 255, 0.05); color: #e9edef; font-size: 14px; line-height: 1.45;">
          <div class="message-text-content" style="margin: 0;">How does the contextual reply quote styling render in this channel?</div>
          <div style="font-size: 10px; margin-top: 4px; opacity: 0.85; display: flex; align-items: center; justify-content: flex-end; gap: 4px; color: #8696a0;">
            <span>10:34 AM</span>
          </div>
        </div>
      </div>

      <!-- Sent Message with Reply Quote -->
      <div class="message-wrapper sent" style="display: flex; justify-content: flex-end; margin: 6px 0; padding: 0 4px; width: 100%; box-sizing: border-box;">
        <div class="message-bubble sent" style="position: relative; padding: 7px 11px 5px 11px; border-radius: 12px 2px 12px 12px; max-width: 76%; word-wrap: break-word; box-sizing: border-box; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35); background: #005c4b !important; color: #ffffff; font-size: 14px; line-height: 1.45;">
          <div class="reply-quote" style="background: rgba(0, 0, 0, 0.22); border-left: 3.5px solid #25d366; padding: 6px 10px; margin-bottom: 6px; border-radius: 6px; font-size: 12px; line-height: 1.35;">
            <strong style="color: #bbf7d0; display: block; font-weight: 700; margin-bottom: 2px; font-size: 12px;">
              <i class="fa-solid fa-reply" style="font-size: 9.5px; margin-right: 5px; opacity: 0.85;"></i>ChronEX AI
            </strong>
            <span style="font-style: italic; color: #d1d7db; font-size: 11.5px;">How does the contextual reply quote styling render in this channel?</span>
          </div>
          <div class="message-text-content" style="margin: 0;">Like this! Crisp emerald border, italicized preview snippet, and responsive touch gestures.</div>
          <div style="font-size: 10px; margin-top: 4px; opacity: 0.85; display: flex; align-items: center; justify-content: flex-end; gap: 4px; color: rgba(255, 255, 255, 0.75);">
            <span>10:35 AM</span>
            <i class="fa-solid fa-check-double" style="color: #53bdeb; font-size: 10px; margin-left: 2px;" title="Read"></i>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 3: GROUP CONVERSATION VIEW (WhatsApp Multi-Sender Colors)
  // =========================================================================
  function renderGroupChatView(chatMain, chatDetailView) {
    document.body.dataset.activeSection = 'chat';
    const topHeader = document.querySelector('.top-header');
    if (topHeader) topHeader.style.setProperty('display', 'none', 'important');
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.setProperty('display', 'none', 'important');
    if (chatMain) {
      chatMain.style.display = 'flex';
      chatMain.dataset.layout = 'conversation';
    }
    if (chatDetailView) {
      chatDetailView.style.display = 'flex';
      chatDetailView.classList.remove('hidden');
      chatDetailView.classList.add('visible');
      chatDetailView.classList.add('group-chat');
    }

    const header = document.querySelector('.chat-detail-header');
    if (header) header.classList.add('group-chat');

    const chatName = document.getElementById('chatName');
    if (chatName) chatName.textContent = 'Alpha Nexus Core';

    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = 'You, ChronEX AI, Security Enclave, NEXCHAT Support';

    const chatPic = document.getElementById('chatProfilePic');
    if (chatPic) chatPic.src = 'logo.jpg';

    const messagesList = document.querySelector('.messages-list');
    if (!messagesList) return;

    messagesList.innerHTML = `
      <div style="text-align: center; margin: 8px auto 14px auto; max-width: 90%; width: 100%; box-sizing: border-box;">
        <span style="background: rgba(17, 24, 39, 0.85); color: #8696a0; font-size: 11px; padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); display: inline-block; line-height: 1.45; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
          <i class="fa-solid fa-shield-halved" style="font-size: 9.5px; color: #00ff66; margin-right: 4px;"></i>Alpha Nexus Core created by NEXCHAT System. End-to-end encrypted.
        </span>
      </div>

      <!-- Received Message from ChronEX AI (Cyan #06b6d4) -->
      <div class="message-wrapper received" style="display: flex; justify-content: flex-start; align-items: flex-end; margin: 8px 0; padding: 0 4px; gap: 8px; width: 100%; box-sizing: border-box;">
        <img src="chronex-ai.jpg" alt="ChronEX AI" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1.5px solid #06b6d4; flex-shrink: 0; margin-bottom: 2px;">
        <div class="message-bubble received" style="position: relative; padding: 6px 11px 5px 11px; border-radius: 2px 12px 12px 12px; max-width: 72%; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35); background: #1f2c34; border: 1px solid rgba(255, 255, 255, 0.05); color: #e9edef; font-size: 14px; line-height: 1.45;">
          <div style="font-size: 12px; font-weight: 700; color: #06b6d4; margin-bottom: 3px; letter-spacing: 0.3px;">~ ChronEX AI</div>
          <div class="message-text-content" style="margin: 0;">Good morning operatives! The WhatsApp layout pass and 4-tab bottom navigation with Market Hub are deployed.</div>
          <div style="font-size: 10px; margin-top: 4px; opacity: 0.85; display: flex; align-items: center; justify-content: flex-end; gap: 4px; color: #8696a0;">
            <span>09:15 AM</span>
          </div>
        </div>
      </div>

      <!-- Received Message from Security Enclave (Magenta #ec4899) with Quote -->
      <div class="message-wrapper received" style="display: flex; justify-content: flex-start; align-items: flex-end; margin: 8px 0; padding: 0 4px; width: 100%; box-sizing: border-box; gap: 8px;">
        <img src="logo.jpg" alt="Security Enclave" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1.5px solid #ec4899; flex-shrink: 0; margin-bottom: 2px;">
        <div class="message-bubble received" style="position: relative; padding: 6px 11px 5px 11px; border-radius: 2px 12px 12px 12px; max-width: 72%; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35); background: #1f2c34; border: 1px solid rgba(255, 255, 255, 0.05); color: #e9edef; font-size: 14px; line-height: 1.45;">
          <div style="font-size: 12px; font-weight: 700; color: #ec4899; margin-bottom: 3px; letter-spacing: 0.3px;">~ Security Enclave</div>
          <div class="reply-quote" style="background: rgba(0, 0, 0, 0.32); border-left: 3.5px solid #06b6d4; padding: 5px 8px; margin-bottom: 5px; border-radius: 6px; font-size: 11.5px; line-height: 1.35;">
            <strong style="color: #06b6d4; display: block; font-weight: 700; font-size: 11px; margin-bottom: 1px;">~ ChronEX AI</strong>
            <span style="font-style: italic; color: #94a3b8; font-size: 11px;">Good morning operatives! The WhatsApp layout pass and 4-tab bottom navigation with Market Hub are deployed.</span>
          </div>
          <div class="message-text-content" style="margin: 0;">Audit completed: zero demo names remain and all 4 navigation tabs are aligned perfectly.</div>
          <div style="font-size: 10px; margin-top: 4px; opacity: 0.85; display: flex; align-items: center; justify-content: flex-end; gap: 4px; color: #8696a0;">
            <span>09:18 AM</span>
          </div>
        </div>
      </div>

      <!-- Received Message from Support Node (Amber #f59e0b) -->
      <div class="message-wrapper received" style="display: flex; justify-content: flex-start; align-items: flex-end; margin: 8px 0; padding: 0 4px; width: 100%; box-sizing: border-box; gap: 8px;">
        <img src="logo.jpg" alt="NEXCHAT Support" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1.5px solid #f59e0b; flex-shrink: 0; margin-bottom: 2px;">
        <div class="message-bubble received" style="position: relative; padding: 6px 11px 5px 11px; border-radius: 2px 12px 12px 12px; max-width: 72%; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35); background: #1f2c34; border: 1px solid rgba(255, 255, 255, 0.05); color: #e9edef; font-size: 14px; line-height: 1.45;">
          <div style="font-size: 12px; font-weight: 700; color: #f59e0b; margin-bottom: 3px; letter-spacing: 0.3px;">~ NEXCHAT Support</div>
          <div class="message-text-content" style="margin: 0;">Desktop and mobile responsive viewports render with zero overlay or colliding buttons.</div>
          <div style="font-size: 10px; margin-top: 4px; opacity: 0.85; display: flex; align-items: center; justify-content: flex-end; gap: 4px; color: #8696a0;">
            <span>09:21 AM</span>
          </div>
        </div>
      </div>

      <!-- Sent Message from You (Emerald #005c4b) -->
      <div class="message-wrapper sent" style="display: flex; justify-content: flex-end; margin: 8px 0; padding: 0 4px; width: 100%; box-sizing: border-box;">
        <div class="message-bubble sent" style="position: relative; padding: 7px 11px 5px 11px; border-radius: 12px 2px 12px 12px; max-width: 76%; word-wrap: break-word; box-sizing: border-box; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35); background: #005c4b !important; color: #ffffff; font-size: 14px; line-height: 1.45;">
          <div class="message-text-content" style="margin: 0;">Verified! Taking comprehensive audit screenshots now.</div>
          <div style="font-size: 10px; margin-top: 4px; opacity: 0.85; display: flex; align-items: center; justify-content: flex-end; gap: 4px; color: rgba(255, 255, 255, 0.75);">
            <span>09:24 AM</span>
            <i class="fa-solid fa-check-double" style="color: #53bdeb; font-size: 10px; margin-left: 2px;" title="Read"></i>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 4: UPDATES / STATUS VAULT VIEW (WhatsApp Portrait Cards & Channels)
  // =========================================================================
  function renderUpdatesView(chatMain, statusContainer) {
    document.body.dataset.activeSection = 'updates';
    const app = document.querySelector('.app');
    if (app) app.dataset.activeSection = 'updates';
    const topHeader = document.querySelector('.top-header');
    if (topHeader) topHeader.style.setProperty('display', 'none', 'important');

    if (chatMain) {
      chatMain.style.display = 'none';
      chatMain.dataset.layout = 'section';
    }
    if (statusContainer) {
      statusContainer.style.display = 'flex';
    }

    document.getElementById('nav-status')?.classList.add('active');

    const feed = document.getElementById('statusHorizontalFeed');
    if (feed) {
      feed.innerHTML = ''; // Only user status should be seen
    }

    // Ensure channels list displays authentic empty state (no fake/demo channels)
    const channelsList = document.getElementById('channelsList');
    if (channelsList) {
      channelsList.innerHTML = `
        <div class="channels-empty-state" style="padding: 28px 16px; text-align: center; color: #8696a0;">
          <i class="fa-solid fa-tower-broadcast" style="font-size: 34px; margin-bottom: 12px; color: #334155; display: block;"></i>
          <p style="font-size: 14.5px; font-weight: 600; color: #cbd5e1; margin: 0 0 6px 0;">Stay updated on topics you care about</p>
          <p style="font-size: 12px; color: #64748b; margin: 0 0 16px 0; line-height: 1.4;">Find channels to follow or explore public broadcast wires</p>
          <button type="button" class="channels-explore-pill-btn" onclick="if(window.broadcastChannelsEngine?.openModal) window.broadcastChannelsEngine.openModal();" style="display: inline-flex; margin: 0 auto; padding: 7px 18px; font-size: 12px;">Explore Channels</button>
        </div>
      `;
    }
  }

  // =========================================================================
  // VIEW 5: CALLS HISTORY VIEW (WhatsApp 4 Action Circles & Angled Arrows)
  // =========================================================================
  function renderCallsView(chatMain, callHistoryContainer) {
    document.body.dataset.activeSection = 'calls';
    const app = document.querySelector('.app');
    if (app) app.dataset.activeSection = 'calls';
    const topHeader = document.querySelector('.top-header');
    if (topHeader) topHeader.style.setProperty('display', 'none', 'important');

    if (chatMain) {
      chatMain.style.display = 'none';
      chatMain.dataset.layout = 'section';
    }
    if (callHistoryContainer) {
      callHistoryContainer.style.display = 'block';
    }

    document.getElementById('nav-calls')?.classList.add('active');

    const feed = document.getElementById('callHistoryFeed');
    if (!feed) return;

    const mockCalls = [
      {
        name: 'ChronEX AI',
        type: 'outgoing',
        time: 'Today, 14:22',
        subtitle: '(14 mins)',
        video: true,
        avatar: 'chronex-ai.jpg'
      },
      {
        name: 'NEXCHAT Support',
        type: 'incoming',
        time: 'Yesterday, 19:40',
        subtitle: '(4 mins)',
        video: false,
        avatar: 'logo.jpg'
      },
      {
        name: 'Security Dispatch',
        type: 'missed',
        time: '16 October, 11:05',
        subtitle: 'Silenced by Do Not Disturb',
        video: false,
        avatar: 'logo.jpg'
      }
    ];

    feed.innerHTML = mockCalls.map(c => {
      const isMissed = c.type === 'missed';
      const arrowIcon = isMissed
        ? '<i class="fa-solid fa-arrow-down-left" style="color: #ef4444; font-size: 11px; margin-right: 5px;"></i>'
        : '<i class="fa-solid fa-arrow-up-right" style="color: #22c55e; font-size: 11px; margin-right: 5px;"></i>';

      const nameColor = isMissed ? '#ef4444' : '#f1f5f9';
      const actionIcon = c.video
        ? '<i class="fa-solid fa-video" style="color: #22c55e; font-size: 16px;"></i>'
        : '<i class="fa-solid fa-phone" style="color: #22c55e; font-size: 16px;"></i>';

      return `
        <div class="call-log-item" style="display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; width: 100%; box-sizing: border-box; overflow: hidden;">
          <img src="${c.avatar}" alt="${c.name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; margin-right: 14px; flex-shrink: 0; border: 1.5px solid rgba(0, 255, 102, 0.25);">
          <div style="flex: 1 1 auto; min-width: 0; overflow: hidden;">
            <div style="font-size: 15.5px; font-weight: 600; color: ${nameColor}; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${c.name}
            </div>
            <div style="font-size: 12.5px; color: #8696a0; display: flex; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${arrowIcon}
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.time} &bull; ${c.subtitle}</span>
            </div>
          </div>
          <button type="button" style="background: none; border: none; padding: 8px 12px; cursor: pointer; flex-shrink: 0; margin-left: auto;" title="Call back">
            ${actionIcon}
          </button>
        </div>
      `;
    }).join('');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPreview);
  } else {
    setupPreview();
  }

  // Backup trigger after full page load
  window.addEventListener('load', () => {
    setTimeout(setupPreview, 150);
  });
})();
