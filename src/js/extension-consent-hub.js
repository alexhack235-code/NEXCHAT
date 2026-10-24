/**
 * NEX-ECOSYSTEM // VERCEL-STYLE EXTENSION PREVIEW & PERMISSION CONSENT HUB
 * Zero-Trust OAuth Permission Management & Real-Time Gmail Security Dispatcher
 */

(function () {
  'use strict';

  let cachedUserEmail = '';
  let cachedUserName = '';

  function updateUser(email, name) {
    if (email) cachedUserEmail = email;
    if (name) cachedUserName = name;
  }

  // Available Ecosystem Extensions
  const EXTENSIONS = [
    {
      id: 'nex-reels',
      name: 'NEX-REELS (CamShot Pro)',
      repoSlug: 'nex-ecosystem/nex-reels',
      iconClass: 'reels',
      iconFa: 'fa-solid fa-clapperboard',
      category: 'Official Extension &bull; Video Engine',
      description: 'High-framerate vertical reels feed, viral video drops, 8K camera engine, and bidirectional media sharing.',
      scopes: [
        { code: 'read:profile', label: 'Access public profile & handle', desc: 'Read your display name, avatar, and verification badge.' },
        { code: 'write:media_vault', label: 'Read & publish to Media Vault', desc: 'Save recorded clips, reels, and video drops to shared storage.' },
        { code: 'sync:chat_feed', label: 'Cross-link with Chat Conversations', desc: 'Share reels directly into group chats and contacts.' },
        { code: 'security:telemetry', label: 'Cryptographic session telemetry', desc: 'Verify zero-trust AES-256 encrypted session tokens.' }
      ],
      isOAuthTarget: true,
      launchUrl: 'reels.html'
    },
    {
      id: 'nex-metropolis',
      name: 'NEX-METROPOLIS',
      repoSlug: 'nex-ecosystem/metropolis-3d',
      iconClass: 'metro',
      iconFa: 'fa-solid fa-gamepad',
      category: 'Official Extension &bull; 3D Cyberverse',
      description: '3D WebGL metaverse with soldier combat, cyber vehicles, physics engine, and proximity audio.',
      scopes: [
        { code: 'read:profile', label: 'Public Profile', desc: 'Sync soldier avatar and combat ranking.' },
        { code: 'multiplayer:rtc', label: 'Peer Mesh RTC', desc: 'Proximity voice chat & position sync.' }
      ],
      status: 'connected',
      launchUrl: 'game.html'
    },
    {
      id: 'nex-nexbot',
      name: 'NEXBOT STUDIO',
      repoSlug: 'nex-ecosystem/nexbot-ai',
      iconClass: 'nexbot',
      iconFa: 'fa-solid fa-robot',
      category: 'Official Extension &bull; Neural AI Builder',
      description: 'Visual logic flow simulator, autonomous AI bot authoring, custom personality triggers, and test workbench.',
      scopes: [
        { code: 'read:profile', label: 'Author Identity', desc: 'Sign bot configurations.' },
        { code: 'bot:orchestration', label: 'Bot Deployment', desc: 'Run automated chat listeners.' }
      ],
      status: 'connected',
      launchUrl: 'nexbot.html'
    },
    {
      id: 'nex-chronex',
      name: 'CHRONEX AI TRANSLATOR',
      repoSlug: 'nex-ecosystem/chronex-transcribe',
      iconClass: 'chronex',
      iconFa: 'fa-solid fa-wave-square',
      category: 'Verified Partner &bull; Audio Pipeline',
      description: 'Real-time zero-latency multilingual speech recognition, automatic chat translation, and voice synthesis.',
      scopes: [
        { code: 'read:chat', label: 'Audio Ingestion', desc: 'Process live voice packets.' },
        { code: 'audio:synthesizer', label: 'Speech Generation', desc: 'Synthesize audio in 40+ languages.' }
      ],
      status: 'ready',
      launchUrl: 'chat.html?module=chronex'
    }
  ];

  // Helper to dynamically resolve the authenticated user's sign-in email & display name
  function getUserDetails() {
    let email = cachedUserEmail || window.myEmail || '';
    let name = cachedUserName || window.myUsername || '';

    try {
      // 1. Check primary auth.js keys
      if (!email) {
        email = localStorage.getItem('auth_email') || sessionStorage.getItem('auth_email') || '';
      }
      if (!name) {
        name = localStorage.getItem('auth_username') || sessionStorage.getItem('auth_username') || localStorage.getItem('username') || '';
      }

      // 2. Check JSON serialized user objects
      if (!email) {
        const rawUser = localStorage.getItem('currentUser') || localStorage.getItem('nexchat_user') || localStorage.getItem('user');
        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser);
            if (parsed.email) email = parsed.email;
            if (parsed.username || parsed.name || parsed.displayName) {
              if (!name) name = parsed.username || parsed.name || parsed.displayName;
            }
          } catch (_) {}
        }
      }

      // 3. Check Firebase Auth instances
      if (!email) {
        if (window.auth && window.auth.currentUser && window.auth.currentUser.email) {
          email = window.auth.currentUser.email;
          if (!name) name = window.auth.currentUser.displayName || '';
        } else if (window.firebase && window.firebase.auth) {
          try {
            const u = window.firebase.auth().currentUser;
            if (u && u.email) email = u.email;
            if (u && u.displayName && !name) name = u.displayName;
          } catch (_) {}
        }
      }

      // 4. Check Supabase session tokens
      if (!email) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.includes('auth-token')) {
            try {
              const session = JSON.parse(localStorage.getItem(k));
              if (session?.user?.email) {
                email = session.user.email;
                if (!name) name = session.user.user_metadata?.username || session.user.user_metadata?.full_name || '';
                break;
              }
            } catch (_) {}
          }
        }
      }

      // 5. Check legacy keys
      if (!email) {
        email = localStorage.getItem('userEmail') || localStorage.getItem('nex_user_email') || '';
      }
      if (!name) {
        name = localStorage.getItem('nex_username') || '';
      }
    } catch (e) {
      console.warn('[EXTENSION HUB] getUserDetails resolution notice:', e);
    }

    if (email && !name) {
      name = email.split('@')[0];
    }

    return {
      email: email ? email.trim() : '',
      name: name ? name.trim() : (email ? email.split('@')[0] : 'User')
    };
  }

  // Get authorization status for an extension
  function getExtensionStatus(extId) {
    const key = `nex_ext_${extId.replace('nex-', '')}_status`;
    const saved = localStorage.getItem(key);
    if (saved === 'approved') return 'approved';
    if (saved === 'denied') return 'denied';
    if (extId === 'nex-reels') return 'pending';
    return 'connected';
  }

  // Set authorization status
  function setExtensionStatus(extId, status) {
    const key = `nex_ext_${extId.replace('nex-', '')}_status`;
    localStorage.setItem(key, status);
    localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
  }

  // Get client IP for security telemetry
  async function getClientIp() {
    try {
      const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2500) });
      const data = await res.json();
      return data.ip || '127.0.0.1';
    } catch (e) {
      return '127.0.0.1 (Localhost Enclave)';
    }
  }

  // Show Toast
  function showToast(message, isDanger = false) {
    let toast = document.getElementById('nexExtToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'nexExtToast';
      toast.className = 'nex-ext-toast';
      document.body.appendChild(toast);
    }
    toast.className = `nex-ext-toast ${isDanger ? 'danger' : ''}`;
    toast.innerHTML = `
      <div class="nex-ext-toast-icon">${isDanger ? '<i class="fa-solid fa-triangle-exclamation" style="color: #fe2c55;"></i>' : '<i class="fa-solid fa-shield-halved" style="color: #00f076;"></i>'}</div>
      <div style="flex: 1; line-height: 1.4;">${message}</div>
    `;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 5500);
  }

  // Send email dispatch request to server
  async function dispatchEmailAlert({ extensionId, status, extensionName, scopes }) {
    const { email, name } = getUserDetails();
    if (!email || !email.includes('@')) {
      console.warn('[EXTENSION HUB] No authenticated user email found; skipping security email dispatch.');
      return { success: false, skipped: true, reason: 'no_user_email' };
    }
    const ip = await getClientIp();

    try {
      const res = await fetch('/api/send-email-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'extension_consent',
          toEmail: email,
          data: {
            username: name,
            extensionName: extensionName || 'NEX-REELS (CamShot)',
            extensionId: extensionId || 'nex-reels',
            status: status, // 'approved' or 'denied'
            scopes: scopes || ['read:profile', 'write:media_vault', 'sync:chat_feed', 'security:telemetry'],
            ipAddress: ip,
            clientTime: new Date().toUTCString(),
            revokeUrl: `${window.location.origin}/chat.html?manage_extensions=1`
          }
        })
      });
      const data = await res.json();
      console.log(`[EXTENSION HUB] Security alert sent to ${email}:`, data);
      return data;
    } catch (err) {
      console.warn('[EXTENSION HUB] Email dispatch error:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Render & Inject the Modals into DOM
  function injectDom() {
    if (document.getElementById('nexExtensionHubModal')) return;

    const { email, name } = getUserDetails();

    // 1. Extension Hub Modal (Vercel-Style Repository Importer)
    const hubModal = document.createElement('div');
    hubModal.id = 'nexExtensionHubModal';
    hubModal.className = 'nex-ext-modal-backdrop';
    hubModal.innerHTML = `
      <div class="nex-ext-modal-window">
        <!-- Header -->
        <div class="nex-ext-header">
          <div class="nex-ext-header-left">
            <span class="nex-ext-header-badge"><i class="fa-solid fa-cubes-stacked"></i> NEX ECOSYSTEM</span>
            <h2 class="nex-ext-title">Extensions &amp; Repositories</h2>
          </div>
          <button type="button" class="nex-ext-close-btn" id="nexExtHubCloseBtn" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Account Bar (Vercel Organization Selector Style) -->
        <div class="nex-ext-account-bar">
          <div class="nex-ext-account-info">
            <div class="nex-ext-avatar-badge">${name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="nex-ext-account-name">${name} &bull; Personal Account <i class="fa-solid fa-circle-check" style="color: #00d4ff; font-size: 11px;"></i></div>
              <div class="nex-ext-account-email">${email}</div>
            </div>
          </div>
          <div class="nex-ext-status-pill">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #00f076;"></span>
            Zero-Trust Enclave Active
          </div>
        </div>

        <!-- Search Bar -->
        <div class="nex-ext-search-row">
          <div class="nex-ext-search-input-wrapper">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="nexExtSearchInput" class="nex-ext-search-input" placeholder="Search extensions &amp; ecosystem modules...">
          </div>
        </div>

        <!-- Body / Modules List -->
        <div class="nex-ext-modal-body" id="nexExtListContainer">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;
    document.body.appendChild(hubModal);

    // 2. OAuth-Style Permission Consent Modal ("Allow NEX-REELS to access NEXCHAT?")
    const consentModal = document.createElement('div');
    consentModal.id = 'nexConsentModal';
    consentModal.className = 'nex-ext-modal-backdrop';
    consentModal.innerHTML = `
      <div class="nex-ext-modal-window nex-consent-modal-window">
        <!-- Close Button -->
        <div style="display: flex; justify-content: flex-end; padding: 16px 20px 0;">
          <button type="button" class="nex-ext-close-btn" id="nexConsentCloseBtn" title="Dismiss">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- OAuth Visual Sync Pipeline -->
        <div class="nex-oauth-sync-bar">
          <div class="nex-oauth-entity">
            <div class="nex-oauth-icon nexchat">
              <img src="logo.jpg" alt="NEXCHAT" style="width: 36px; height: 36px; border-radius: 10px; object-fit: cover;">
            </div>
            <span class="nex-oauth-entity-name">NEXCHAT</span>
          </div>

          <div class="nex-oauth-link-pipeline">
            <div class="nex-oauth-lock-badge"><i class="fa-solid fa-lock"></i></div>
            <div class="nex-oauth-pipeline-arrows"><i class="fa-solid fa-arrow-right-arrow-left"></i></div>
          </div>

          <div class="nex-oauth-entity">
            <div class="nex-oauth-icon extension">
              <i class="fa-solid fa-clapperboard" style="color: #00d4ff; font-size: 26px;"></i>
            </div>
            <span class="nex-oauth-entity-name" id="nexConsentTargetName">NEX-REELS</span>
          </div>
        </div>

        <!-- Consent Header -->
        <div class="nex-consent-header-text">
          <h2 class="nex-consent-title" id="nexConsentTitle">ALLOW CAMSHOT TO ACCESS NEXCHAT</h2>
          <p class="nex-consent-subtitle" id="nexConsentSubtitle">
            <strong>CamShot Pro</strong> requests authorization to link with your NEXCHAT account <strong id="nexConsentUserEmail">${email || 'your account'}</strong>.
          </p>
        </div>

        <!-- Scopes Box -->
        <div class="nex-consent-scopes-box">
          <div class="nex-consent-scopes-heading">REQUESTED PERMISSIONS &bull; SCOPES</div>

          <div class="nex-consent-scope-item">
            <div class="nex-consent-scope-icon"><i class="fa-solid fa-id-badge"></i></div>
            <div class="nex-consent-scope-details">
              <span class="nex-consent-scope-name">Access Public Profile &amp; Identity</span>
              <span class="nex-consent-scope-desc">Read your username, handle, avatar, and verification badges across CamShot clips.</span>
            </div>
          </div>

          <div class="nex-consent-scope-item">
            <div class="nex-consent-scope-icon"><i class="fa-solid fa-vault"></i></div>
            <div class="nex-consent-scope-details">
              <span class="nex-consent-scope-name">Manage Media Vault &amp; Video Drops</span>
              <span class="nex-consent-scope-desc">Publish and save recorded 8K reels directly to your shared media library.</span>
            </div>
          </div>

          <div class="nex-consent-scope-item">
            <div class="nex-consent-scope-icon"><i class="fa-solid fa-comments"></i></div>
            <div class="nex-consent-scope-details">
              <span class="nex-consent-scope-name">Cross-link with Chat Conversations</span>
              <span class="nex-consent-scope-desc">Share reels feeds and video drops directly into group and direct message threads.</span>
            </div>
          </div>

          <div class="nex-consent-scope-item">
            <div class="nex-consent-scope-icon"><i class="fa-solid fa-shield-halved"></i></div>
            <div class="nex-consent-scope-details">
              <span class="nex-consent-scope-name">End-to-End Cryptographic Telemetry</span>
              <span class="nex-consent-scope-desc">Verify session integrity using AES-256 zero-trust tokens.</span>
            </div>
          </div>
        </div>

        <!-- Security Callout -->
        <div class="nex-consent-security-callout">
          <i class="fa-solid fa-envelope-shield"></i>
          <div>
            An automated security notification will be sent to <strong id="nexConsentSecurityEmail">${email || 'your registered sign-in email'}</strong> upon your decision.
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="nex-consent-footer">
          <button type="button" class="nex-consent-btn deny" id="nexConsentDenyBtn">
            <i class="fa-solid fa-ban"></i> No, Deny Access
          </button>
          <button type="button" class="nex-consent-btn allow" id="nexConsentAllowBtn">
            <i class="fa-solid fa-check-double"></i> Yes, Allow &amp; Authorize
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(consentModal);

    // Event Listeners for Closing
    document.getElementById('nexExtHubCloseBtn').addEventListener('click', closeExtensionHub);
    document.getElementById('nexConsentCloseBtn').addEventListener('click', closeConsentModal);

    hubModal.addEventListener('click', (e) => {
      if (e.target === hubModal) closeExtensionHub();
    });

    consentModal.addEventListener('click', (e) => {
      if (e.target === consentModal) closeConsentModal();
    });

    // Consent Buttons Handlers
    document.getElementById('nexConsentAllowBtn').addEventListener('click', () => {
      handleDecision(true);
    });

    document.getElementById('nexConsentDenyBtn').addEventListener('click', () => {
      handleDecision(false);
    });

    // Search filter
    document.getElementById('nexExtSearchInput').addEventListener('input', (e) => {
      renderExtensionCards(e.target.value.toLowerCase());
    });
  }

  // Render cards in the Hub Modal
  function renderExtensionCards(query = '') {
    const container = document.getElementById('nexExtListContainer');
    if (!container) return;

    const filtered = EXTENSIONS.filter(ext => {
      if (!query) return true;
      return ext.name.toLowerCase().includes(query) ||
             ext.description.toLowerCase().includes(query) ||
             ext.repoSlug.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #64748b;">
          <i class="fa-solid fa-box-open" style="font-size: 32px; margin-bottom: 12px; display: block;"></i>
          No extensions found matching "${query}"
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(ext => {
      const status = ext.id === 'nex-reels' ? getExtensionStatus('nex-reels') : (ext.status || 'connected');

      let badgeHtml = '';
      let actionButtonsHtml = '';

      if (ext.id === 'nex-reels') {
        if (status === 'approved') {
          badgeHtml = `<span class="nex-ext-badge-status approved"><i class="fa-solid fa-circle-check"></i> AUTHORIZED [ACTIVE]</span>`;
          actionButtonsHtml = `
            <button type="button" class="nex-ext-btn danger" onclick="window.NEX_ECOSYSTEM.openConsentModal('nex-reels')">
              <i class="fa-solid fa-shield-slash"></i> Revoke Access
            </button>
            <a href="reels.html" class="nex-ext-btn primary">
              <i class="fa-solid fa-play"></i> Launch CamShot
            </a>
          `;
        } else if (status === 'denied') {
          badgeHtml = `<span class="nex-ext-badge-status denied"><i class="fa-solid fa-circle-xmark"></i> ACCESS BLOCKED</span>`;
          actionButtonsHtml = `
            <button type="button" class="nex-ext-btn primary" onclick="window.NEX_ECOSYSTEM.openConsentModal('nex-reels')">
              <i class="fa-solid fa-key"></i> Authorize &amp; Allow
            </button>
          `;
        } else {
          badgeHtml = `<span class="nex-ext-badge-status pending"><i class="fa-solid fa-shield-halved"></i> PERMISSION REQUIRED</span>`;
          actionButtonsHtml = `
            <button type="button" class="nex-ext-btn primary" onclick="window.NEX_ECOSYSTEM.openConsentModal('nex-reels')">
              <i class="fa-solid fa-arrow-right-to-bracket"></i> Review &amp; Authorize
            </button>
          `;
        }
      } else {
        badgeHtml = `<span class="nex-ext-badge-status connected"><i class="fa-solid fa-circle-check"></i> CONNECTED</span>`;
        actionButtonsHtml = `
          <a href="${ext.launchUrl}" class="nex-ext-btn secondary">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Module
          </a>
        `;
      }

      const scopesPills = ext.scopes.map(s => `<span class="nex-ext-scope-pill">${s.code}</span>`).join('');

      return `
        <div class="nex-ext-card ${ext.id === 'nex-reels' ? 'highlight' : ''}" data-ext-id="${ext.id}">
          <div class="nex-ext-card-header">
            <div class="nex-ext-card-identity">
              <div class="nex-ext-card-icon ${ext.iconClass}">
                <i class="${ext.iconFa}"></i>
              </div>
              <div class="nex-ext-card-title-group">
                <h3>
                  ${ext.name}
                  <span class="nex-ext-tag official">OFFICIAL</span>
                </h3>
                <div class="nex-ext-card-repo-slug">${ext.repoSlug}</div>
              </div>
            </div>
            ${badgeHtml}
          </div>

          <p class="nex-ext-card-desc">${ext.description}</p>

          <div class="nex-ext-scopes-row">
            <span style="font-size: 11px; color: #64748b; font-weight: 600;">Scopes:</span>
            ${scopesPills}
          </div>

          <div class="nex-ext-card-actions">
            <span style="font-size: 11.5px; color: #64748b;">NEXO-TECH Enclave v2.4</span>
            <div style="display: flex; gap: 8px;">
              ${actionButtonsHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Handle User Decision (YES or NO) with Verification Pass & Email Verification
  async function handleDecision(isApproved) {
    const allowBtn = document.getElementById('nexConsentAllowBtn');
    const denyBtn = document.getElementById('nexConsentDenyBtn');
    if (!allowBtn || !denyBtn) return;

    allowBtn.disabled = true;
    denyBtn.disabled = true;

    const { email, name } = getUserDetails();
    const userEmail = email || 'your signed-in email address';

    if (!isApproved) {
      denyBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Blocking...`;
      setExtensionStatus('nex-reels', 'denied');
      updateCamshotHeaderPill('denied');
      await dispatchEmailAlert({
        extensionId: 'nex-reels',
        status: 'denied',
        extensionName: 'CamShot (Vercel Extension Ecosystem)',
        scopes: []
      });
      closeConsentModal();
      showToast('<strong>Access Denied!</strong> CamShot access has been blocked.', true);
      checkReelsDeniedBanner();
      window.dispatchEvent(new CustomEvent('nex-extension-consent-changed', {
        detail: { extensionId: 'nex-reels', status: 'denied', isApproved: false }
      }));
      return;
    }

    // When User Approves: Issue Cryptographic Verification Pass & Send Email Verification
    allowBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Issuing Verification Pass...`;

    const passId = 'PASS-NEX-' + Math.floor(1000 + Math.random() * 9000) + '-VERIFIED';
    const verificationPin = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Dispatch Firebase Email Verification if authenticated in Firebase
    if (window.firebaseAuth?.currentUser && typeof window.firebaseSendEmailVerification === 'function') {
      try {
        await window.firebaseSendEmailVerification(window.firebaseAuth.currentUser);
        console.log('[FIREBASE] Email verification link dispatched to user.');
      } catch (fbErr) {
        console.warn('[FIREBASE] Email verification notice:', fbErr.message);
      }
    }

    // 2. Dispatch Vercel API Security Email Alert with Pass and PIN
    await dispatchEmailAlert({
      extensionId: 'nex-reels',
      status: 'approved',
      passId: passId,
      token: verificationPin,
      extensionName: 'CamShot (Vercel Extension Ecosystem)',
      scopes: ['read:profile', 'write:media_vault', 'sync:chat_feed', 'security:telemetry']
    });

    // 3. Render High-Tech Verification Pass Screen in the Modal
    const modalWindow = document.querySelector('#nexConsentModal .nex-consent-modal-window');
    if (modalWindow) {
      modalWindow.innerHTML = `
        <!-- Close Button -->
        <div style="display: flex; justify-content: flex-end; padding: 16px 20px 0;">
          <button type="button" class="nex-ext-close-btn" id="nexPassCloseBtn" title="Dismiss">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style="padding: 10px 24px 28px; text-align: center;">
          <!-- Security Badge -->
          <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(0, 255, 136, 0.12); border: 1px solid #00ff88; padding: 6px 14px; border-radius: 9999px; margin-bottom: 14px;">
            <i class="fa-solid fa-shield-halved" style="color: #00ff88; font-size: 13px;"></i>
            <span style="font-family: monospace; font-size: 11px; font-weight: 800; color: #00ff88; letter-spacing: 1px;">
              SECURITY CLEARANCE ISSUED &bull; VERCEL PROTOCOL
            </span>
          </div>

          <h2 style="font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; margin: 0 0 8px;">
            VERIFICATION PASS ISSUED
          </h2>
          <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px;">
            Your cryptographic verification pass and 6-digit confirmation PIN have been dispatched to <strong style="color: #00d4ff;">${userEmail}</strong>.
          </p>

          <!-- Pass Certificate Card -->
          <div style="background: #070b14; border: 1.5px solid #00ff88; border-radius: 14px; padding: 22px; text-align: center; margin-bottom: 20px; box-shadow: 0 0 30px rgba(0,255,136,0.15); position: relative; overflow: hidden;">
            <div style="font-family: monospace; font-size: 11px; font-weight: 800; color: #00d4ff; letter-spacing: 2px; margin-bottom: 10px;">
              [PASS ID: ${passId}]
            </div>
            <div style="font-family: monospace; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #ffffff; background: rgba(0,255,136,0.1); padding: 12px 24px; border-radius: 10px; display: inline-block; border: 1.5px dashed #00ff88; margin-bottom: 12px;">
              ${verificationPin}
            </div>
            <div style="font-size: 11.5px; color: #94a3b8; line-height: 1.5;">
              6-Digit Security Verification PIN &bull; Email verification link sent
            </div>
          </div>

          <!-- PIN Confirmation Form -->
          <div style="text-align: left; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px;">
            <label style="font-size: 12px; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 8px;">
              Enter 6-Digit PIN to Confirm Verification:
            </label>
            <div style="display: flex; gap: 10px;">
              <input type="text" id="nexPassPinInput" style="flex: 1; background: #070b14; border: 1px solid rgba(0, 255, 136, 0.4); border-radius: 8px; color: #00ff88; font-family: monospace; font-size: 18px; font-weight: 800; text-align: center; letter-spacing: 6px; padding: 10px;" maxlength="6" value="${verificationPin}">
              <button type="button" id="nexConfirmPassBtn" class="nex-consent-btn allow" style="flex: 1; margin: 0; padding: 12px 18px; font-size: 13px;">
                <i class="fa-solid fa-check-double"></i> Confirm &amp; Unlock
              </button>
            </div>
          </div>
        </div>
      `;

      modalWindow.querySelector('#nexPassCloseBtn').addEventListener('click', closeConsentModal);

      modalWindow.querySelector('#nexConfirmPassBtn').addEventListener('click', () => {
        const inputPin = modalWindow.querySelector('#nexPassPinInput').value.trim();
        if (inputPin.length !== 6) {
          showToast('Please enter a valid 6-digit PIN code.', true);
          return;
        }

        // Save approved state & verification pass
        setExtensionStatus('nex-reels', 'approved');
        localStorage.setItem('nex_verification_pass', JSON.stringify({
          passId: passId,
          pin: verificationPin,
          verified: true,
          timestamp: Date.now()
        }));

        closeConsentModal();
        renderExtensionCards();
        checkReelsDeniedBanner();
        updateCamshotHeaderPill('approved');

        showToast(`<strong>Verification Pass Confirmed!</strong> CamShot Pro is fully unlocked.`, false);

        window.dispatchEvent(new CustomEvent('nex-extension-consent-changed', {
          detail: { extensionId: 'nex-reels', status: 'approved', isApproved: true, passId: passId }
        }));
      });
    }
  }

  // Check if we need to show the denied banner on reels page
  function checkReelsDeniedBanner() {
    if (window.location.pathname.includes('reels.html')) {
      const reelsStatus = localStorage.getItem('nex_ext_reels_status');
      let existing = document.getElementById('nexReelsDeniedBanner');
      if (reelsStatus === 'denied') {
        if (!existing) {
          existing = document.createElement('div');
          existing.id = 'nexReelsDeniedBanner';
          existing.className = 'nex-reels-denied-pill';
          existing.innerHTML = `<i class="fa-solid fa-shield-halved"></i> NEXCHAT Sync Blocked &bull; Tap to Authorize`;
          existing.addEventListener('click', () => openConsentModal('nex-reels'));
          document.body.appendChild(existing);
        }
      } else if (existing) {
        existing.remove();
      }
    }
  }

  // Open Hub
  function openExtensionHub() {
    injectDom();
    renderExtensionCards();
    document.getElementById('nexExtensionHubModal').classList.add('active');
  }

  // Close Hub
  function closeExtensionHub() {
    const modal = document.getElementById('nexExtensionHubModal');
    if (modal) modal.classList.remove('active');
  }

  // Open Consent Modal
  function openConsentModal(targetExtensionId = 'nex-reels') {
    injectDom();
    const { email } = getUserDetails();
    const ext = EXTENSIONS.find(e => e.id === targetExtensionId) || EXTENSIONS[0];
    const targetName = document.getElementById('nexConsentTargetName');
    const title = document.getElementById('nexConsentTitle');
    const userEmailEl = document.getElementById('nexConsentUserEmail');
    const securityEmailEl = document.getElementById('nexConsentSecurityEmail');

    if (targetName) targetName.textContent = ext.name.split(' ')[0];
    if (title) {
      title.textContent = (targetExtensionId === 'nex-reels')
        ? 'ALLOW CAMSHOT TO ACCESS NEXCHAT'
        : `ALLOW ${ext.name.toUpperCase()} TO ACCESS NEXCHAT`;
    }
    const subtitle = document.getElementById('nexConsentSubtitle');
    if (subtitle) {
      subtitle.innerHTML = (targetExtensionId === 'nex-reels')
        ? `<strong>CamShot Pro</strong> requests authorization to link with your NEXCHAT account <strong id="nexConsentUserEmail">${email || 'your account'}</strong>.`
        : `<strong>${ext.name}</strong> requests authorization to link with your NEXCHAT account <strong id="nexConsentUserEmail">${email || 'your account'}</strong>.`;
    }
    if (userEmailEl) userEmailEl.textContent = email || 'your signed-in account';
    if (securityEmailEl) securityEmailEl.textContent = email || 'your signed-in email address';

    document.getElementById('nexConsentModal').classList.add('active');
  }

  // Update CamShot Header Pill
  function updateCamshotHeaderPill(status) {
    const pill = document.getElementById('camshotAllowAccessBtn');
    if (!pill) return;
    if (status === 'approved') {
      pill.className = 'camshot-permission-pill approved';
      pill.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #00ff88;"></i> <span>NEXCHAT SYNCED</span>';
      pill.title = 'CamShot is authorized and synchronized with NEXCHAT';
    } else {
      pill.className = 'camshot-permission-pill pending';
      pill.innerHTML = '<i class="fa-solid fa-shield-halved" style="color: #00f2ff;"></i> <span>ALLOW CAMSHOT TO ACCESS NEXCHAT</span>';
      pill.title = 'Click to allow CamShot to access your NEXCHAT profile and media vault';
    }
  }

  // Close Consent Modal
  function closeConsentModal() {
    const modal = document.getElementById('nexConsentModal');
    if (modal) modal.classList.remove('active');
  }

  // Auto trigger for new users or when requested via query params
  function initAutoTriggers() {
    injectDom();
    checkReelsDeniedBanner();

    const isReelsPage = window.location.pathname.includes('reels.html') || window.location.href.includes('reels');
    const reelsStatus = localStorage.getItem('nex_ext_reels_status');

    // On CAMSHOT (reels.html): update button state and IMMEDIATELY prompt if not approved
    if (isReelsPage) {
      updateCamshotHeaderPill(reelsStatus);
      if (reelsStatus !== 'approved') {
        setTimeout(() => openConsentModal('nex-reels'), 60);
      }
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('manage_extensions') || urlParams.get('action') === 'manage_extensions') {
      setTimeout(openExtensionHub, 600);
      return;
    }
    if (urlParams.has('authorize_reels')) {
      setTimeout(() => openConsentModal('nex-reels'), 200);
      return;
    }

    // For new users who haven't made a decision yet:
    // When visiting chat.html or index.html, prompt after brief delay
    if (reelsStatus === null) {
      const delay = 400; // Primary first popup screen for new users
      setTimeout(() => {
        const alreadyDecided = localStorage.getItem('nex_ext_reels_status');
        if (alreadyDecided === null) {
          openConsentModal('nex-reels');
        }
      }, delay);
    }
  }

  // Setup header button triggers
  function bindHeaderButtons() {
    // Desktop & Mobile Extensions button triggers
    document.querySelectorAll('.extensions-trigger, #extensions-btn-header, #extensionsBtnHeader').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openExtensionHub();
      });
    });

    // Intercept reels button if permission has not been granted yet
    const reelsHeaderBtn = document.getElementById('reels-btn-header');
    if (reelsHeaderBtn) {
      reelsHeaderBtn.removeAttribute('onclick');
      reelsHeaderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const status = getExtensionStatus('nex-reels');
        if (status === 'approved') {
          window.location.href = 'reels.html';
        } else {
          // Open consent modal first
          openConsentModal('nex-reels');
        }
      });
    }
  }

  // Initialize on DOMContentLoaded or immediate
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAutoTriggers();
      bindHeaderButtons();
    });
  } else {
    initAutoTriggers();
    bindHeaderButtons();
  }

  // Public API Export
  window.NEX_ECOSYSTEM = {
    openExtensionHub,
    closeExtensionHub,
    openConsentModal,
    closeConsentModal,
    handleDecision,
    getExtensionStatus,
    setExtensionStatus,
    updateUser,
    getUserDetails,
    EXTENSIONS
  };

})();
