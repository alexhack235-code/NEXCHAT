/**
 * NEXCHAT - Holographic Cyber Card Profiles & Custom Chat Bubble Themes
 * 3D perspective gyro tilt (OPTIONAL toggleable), holographic iridescent foil,
 * user telemetry card, and 5-preset custom chat bubble theme studio.
 */

(function() {
  'use strict';

  const HOLO_ENABLED_KEY = 'nexchat_holo_fx_enabled';
  const ACTIVE_THEME_KEY = 'nexchat_active_bubble_theme';

  const THEMES = {
    emerald: {
      name: 'Cyber Emerald',
      icon: '🟢',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      border: '1px solid rgba(16, 185, 129, 0.4)',
      shadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
      color: '#ffffff'
    },
    matrix: {
      name: 'Matrix Terminal',
      icon: '🌐',
      gradient: 'linear-gradient(135deg, #052e16 0%, #14532d 100%)',
      border: '1px solid #00ff66',
      shadow: '0 0 15px rgba(0, 255, 102, 0.3)',
      color: '#00ff66'
    },
    synthwave: {
      name: 'Synthwave Sunset',
      icon: '🌆',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
      border: '1px solid rgba(219, 39, 119, 0.5)',
      shadow: '0 4px 18px rgba(219, 39, 119, 0.4)',
      color: '#ffffff'
    },
    crimson: {
      name: 'Crimson Overdrive',
      icon: '🔴',
      gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
      border: '1px solid rgba(239, 68, 68, 0.6)',
      shadow: '0 4px 16px rgba(220, 38, 38, 0.45)',
      color: '#ffffff'
    },
    gold: {
      name: 'Obsidian Gold',
      icon: '👑',
      gradient: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
      border: '1px solid #fbbf24',
      shadow: '0 0 18px rgba(251, 191, 36, 0.35)',
      color: '#fef08a'
    }
  };

  class ProfileThemesEngine {
    constructor() {
      this.holoFxEnabled = localStorage.getItem(HOLO_ENABLED_KEY) !== 'false'; // Default TRUE, user can toggle OFF
      this.currentTheme = localStorage.getItem(ACTIVE_THEME_KEY) || 'emerald';
      this.init();
    }

    init() {
      this.applyCurrentTheme(this.currentTheme);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    bindDOM() {
      this.injectModals();
      this.bindProfileHeaderTrigger();
      this.applyCurrentTheme(this.currentTheme);
    }

    // 1. Holographic Cyber Profile Card (with OPTIONAL Toggle)
    injectModals() {
      // Profile Card Modal
      if (!document.getElementById('cyberProfileCardModal')) {
        const modal = document.createElement('div');
        modal.id = 'cyberProfileCardModal';
        modal.className = 'cyber-modal-backdrop';
        modal.style.display = 'none';

        modal.innerHTML = `
          <div class="cyber-modal-window profile-modal-window">
            <div class="cyber-modal-header">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-id-card-clip text-[#00d4ff] text-lg"></i>
                <h3 class="font-bold text-white text-base">CYBER OPERATIVE TELEMETRY</h3>
              </div>
              <button type="button" class="cyber-modal-close" id="closeProfileModalBtn"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <!-- Optional Holographic Display Toggle -->
            <div class="holo-toggle-control-bar">
              <span class="text-xs text-gray-300 flex items-center gap-1">
                <i class="fa-solid fa-cube text-[#00d4ff]"></i> 3D Holographic Display:
              </span>
              <label class="holo-switch">
                <input type="checkbox" id="holoDisplayToggle" ${this.holoFxEnabled ? 'checked' : ''} />
                <span class="holo-slider"></span>
              </label>
              <span id="holoStatusLabel" class="text-xs font-bold text-[#00d4ff]">
                ${this.holoFxEnabled ? '3D ACTIVE' : 'FLAT 2D'}
              </span>
            </div>

            <!-- The Holographic 3D Tilt Card -->
            <div class="holo-card-stage" id="holoCardStage">
              <div class="holo-card-container ${this.holoFxEnabled ? 'holo-active' : 'holo-flat'}" id="holoCardContainer">
                <div class="holo-foil-shimmer" id="holoFoilShimmer"></div>
                <div class="holo-card-inner">
                  <div class="holo-card-header">
                    <div class="holo-avatar-wrap">
                      <img id="holoCardAvatar" src="logo.jpg" alt="Avatar" class="holo-avatar" onerror="this.onerror=null;this.src='logo.jpg';" />
                      <span class="holo-avatar-status"></span>
                    </div>
                    <div class="holo-identity-info">
                      <h3 class="holo-username" id="holoCardUsername">Operative</h3>
                      <span class="holo-uid-badge" id="holoCardUid">ID: u_404</span>
                      <span class="holo-title-pill" id="holoCardTitle">👑 Quantum Pioneer</span>
                    </div>
                  </div>

                  <div class="holo-stats-grid">
                    <div class="holo-stat-box">
                      <span class="stat-lbl"><i class="fa-solid fa-fire text-amber-400"></i> STREAK</span>
                      <strong class="stat-val" id="holoCardStreak">7 Days</strong>
                    </div>
                    <div class="holo-stat-box">
                      <span class="stat-lbl"><i class="fa-solid fa-coins text-yellow-400"></i> TOKENS</span>
                      <strong class="stat-val text-amber-400" id="holoCardTokens">1,000 NEX</strong>
                    </div>
                    <div class="holo-stat-box">
                      <span class="stat-lbl"><i class="fa-solid fa-shield-halved text-[#00d4ff]"></i> FREEZES</span>
                      <strong class="stat-val text-[#00d4ff]" id="holoCardFreezes">1 Shield</strong>
                    </div>
                    <div class="holo-stat-box">
                      <span class="stat-lbl"><i class="fa-solid fa-gamepad text-[#00ff66]"></i> ARCADE</span>
                      <strong class="stat-val text-[#00ff66]">Rank S</strong>
                    </div>
                  </div>

                  <div class="holo-card-footer">
                    <button type="button" id="openThemeStudioFromCardBtn" class="holo-action-btn">
                      <i class="fa-solid fa-palette"></i> Customize Bubble Themes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        // Bind events
        document.getElementById('closeProfileModalBtn')?.addEventListener('click', () => {
          modal.style.display = 'none';
        });

        // Holographic display toggle
        const holoToggle = document.getElementById('holoDisplayToggle');
        holoToggle?.addEventListener('change', () => {
          this.setHoloEnabled(holoToggle.checked);
        });

        // 3D Tilt interaction
        this.bind3DTiltEvents();

        // Switch to theme studio
        document.getElementById('openThemeStudioFromCardBtn')?.addEventListener('click', () => {
          modal.style.display = 'none';
          this.openThemeStudio();
        });
      }

      // 2. Chat Bubble Theme Studio Modal
      if (!document.getElementById('themeStudioModal')) {
        const themeModal = document.createElement('div');
        themeModal.id = 'themeStudioModal';
        themeModal.className = 'cyber-modal-backdrop';
        themeModal.style.display = 'none';

        themeModal.innerHTML = `
          <div class="cyber-modal-window theme-studio-modal-window">
            <div class="cyber-modal-header">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-palette text-[#00ff66] text-lg"></i>
                <h3 class="font-bold text-white text-base">CHAT BUBBLE THEME STUDIO</h3>
              </div>
              <button type="button" class="cyber-modal-close" id="closeThemeModalBtn"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div class="theme-studio-body">
              <p class="text-xs text-gray-300 text-center mb-4">
                Personalize your outgoing message bubbles across all encrypted chats. Unlocked themes apply instantly!
              </p>

              <!-- Live Preview Bubble -->
              <div class="theme-preview-card">
                <span class="preview-label">LIVE PREVIEW:</span>
                <div class="preview-message-bubble" id="themePreviewBubble">
                  <p>Cyber security protocols verified. All transmissions encrypted via NEX-Enclave. 🚀</p>
                  <span class="preview-time">12:00 PM • You <i class="fa-solid fa-check-double text-cyan-400"></i></span>
                </div>
              </div>

              <!-- Theme Selector Grid -->
              <div class="theme-selector-grid mt-4">
                ${Object.keys(THEMES).map(key => {
                  const t = THEMES[key];
                  const isActive = key === this.currentTheme;
                  return `
                    <div class="theme-card-option ${isActive ? 'active' : ''}" data-theme="${key}">
                      <div class="theme-color-chip" style="background: ${t.gradient}; border: ${t.border};"></div>
                      <div class="theme-card-meta">
                        <span class="theme-card-name">${t.icon} ${t.name}</span>
                        <span class="theme-card-status">${isActive ? 'ACTIVE' : 'SELECT'}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <button type="button" id="saveThemeBtn" class="theme-save-btn mt-4">
                <i class="fa-solid fa-check"></i> APPLY SELECTED THEME
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(themeModal);

        document.getElementById('closeThemeModalBtn')?.addEventListener('click', () => {
          themeModal.style.display = 'none';
        });

        // Theme cards click
        themeModal.querySelectorAll('.theme-card-option').forEach(card => {
          card.addEventListener('click', () => {
            themeModal.querySelectorAll('.theme-card-option').forEach(c => {
              c.classList.remove('active');
              c.querySelector('.theme-card-status').textContent = 'SELECT';
            });
            card.classList.add('active');
            card.querySelector('.theme-card-status').textContent = 'ACTIVE';

            const themeKey = card.dataset.theme;
            this.previewTheme(themeKey);
          });
        });

        document.getElementById('saveThemeBtn')?.addEventListener('click', () => {
          const activeCard = themeModal.querySelector('.theme-card-option.active');
          const themeKey = activeCard ? activeCard.dataset.theme : 'emerald';
          this.applyCurrentTheme(themeKey);
          themeModal.style.display = 'none';
          if (typeof window.showNotif === 'function') {
            window.showNotif(`🎨 Applied theme: ${THEMES[themeKey].name}!`, 'success', 2000);
          }
          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
        });
      }
    }

    bindProfileHeaderTrigger() {
      // Hook into chat header profile click
      const profile = document.getElementById('chatHeaderProfile');
      if (profile) {
        profile.addEventListener('click', () => {
          this.openProfileModal();
        });
      }

      // Add Theme Studio button to header actions if not present
      const headerActions = document.querySelector('.chat-detail-header-actions') || 
                            document.querySelector('.chat-detail-header-right');
      if (headerActions && !document.getElementById('openThemeStudioBtn')) {
        const themeBtn = document.createElement('button');
        themeBtn.type = 'button';
        themeBtn.id = 'openThemeStudioBtn';
        themeBtn.className = 'header-icon-btn';
        themeBtn.title = 'Chat Bubble Theme Studio';
        themeBtn.innerHTML = `<i class="fa-solid fa-palette text-[#00ff66]"></i>`;
        themeBtn.addEventListener('click', () => {
          this.openThemeStudio();
        });
        headerActions.appendChild(themeBtn);
      }
    }

    setHoloEnabled(enabled) {
      this.holoFxEnabled = enabled;
      localStorage.setItem(HOLO_ENABLED_KEY, enabled ? 'true' : 'false');

      const card = document.getElementById('holoCardContainer');
      const label = document.getElementById('holoStatusLabel');

      if (card) {
        if (enabled) {
          card.classList.remove('holo-flat');
          card.classList.add('holo-active');
        } else {
          card.classList.remove('holo-active');
          card.classList.add('holo-flat');
          card.style.transform = 'none';
        }
      }

      if (label) {
        label.textContent = enabled ? '3D ACTIVE' : 'FLAT 2D';
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif(enabled ? '✨ 3D Holographic Display Enabled' : '🛡️ Flat 2D Mode Enabled', 'info', 1800);
      }
    }

    bind3DTiltEvents() {
      const stage = document.getElementById('holoCardStage');
      const card = document.getElementById('holoCardContainer');
      const foil = document.getElementById('holoFoilShimmer');

      if (!stage || !card) return;

      const handleMove = (clientX, clientY) => {
        if (!this.holoFxEnabled) return;

        const rect = stage.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -18; // Max 18 deg
        const rotateY = ((x - centerX) / centerX) * 18;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        if (foil) {
          const foilX = (x / rect.width) * 100;
          const foilY = (y / rect.height) * 100;
          foil.style.backgroundPosition = `${foilX}% ${foilY}%`;
          foil.style.opacity = '0.75';
        }
      };

      const handleLeave = () => {
        if (!this.holoFxEnabled) return;
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        if (foil) foil.style.opacity = '0.2';
      };

      stage.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
      stage.addEventListener('mouseleave', handleLeave);

      // Mobile gyro support
      if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
          if (!this.holoFxEnabled || !e.gamma || !e.beta) return;
          const rotateY = Math.min(20, Math.max(-20, e.gamma)); // Left/right tilt
          const rotateX = Math.min(20, Math.max(-20, (e.beta - 45))); // Up/down tilt
          card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
      }
    }

    openProfileModal() {
      const modal = document.getElementById('cyberProfileCardModal');
      if (!modal) return;

      // Update telemetry data
      const user = localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')) : {};
      const usernameEl = document.getElementById('holoCardUsername');
      const uidEl = document.getElementById('holoCardUid');
      const tokensEl = document.getElementById('holoCardTokens');
      const streakEl = document.getElementById('holoCardStreak');
      const freezesEl = document.getElementById('holoCardFreezes');

      if (usernameEl) usernameEl.textContent = window.currentUserName || user.displayName || 'Cyber Operative';
      if (uidEl) uidEl.textContent = `ID: ${window.myUID || user.uid || 'u_active'}`;

      const tokens = localStorage.getItem('nexchat_user_tokens') || '1,000';
      if (tokensEl) tokensEl.textContent = `${parseInt(tokens, 10).toLocaleString()} NEX`;

      const partnerId = window.currentChatUserId || window.currentChatUser || 'partner';
      let streakCount = 7;
      try {
        const streaks = JSON.parse(localStorage.getItem('nexchat_streaks_data') || '{}');
        if (streaks[partnerId]) streakCount = streaks[partnerId].count;
      } catch (e) {}

      if (streakEl) streakEl.textContent = `${streakCount} Days`;

      const freezes = localStorage.getItem('nexchat_streak_freezes') || '1';
      if (freezesEl) freezesEl.textContent = `${freezes} Shield${freezes !== '1' ? 's' : ''}`;

      modal.style.display = 'flex';
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    openThemeStudio() {
      const modal = document.getElementById('themeStudioModal');
      if (!modal) return;
      this.previewTheme(this.currentTheme);
      modal.style.display = 'flex';
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    previewTheme(themeKey) {
      const theme = THEMES[themeKey] || THEMES.emerald;
      const bubble = document.getElementById('themePreviewBubble');
      if (bubble) {
        bubble.style.background = theme.gradient;
        bubble.style.border = theme.border;
        bubble.style.boxShadow = theme.shadow;
        bubble.style.color = theme.color;
      }
    }

    applyCurrentTheme(themeKey) {
      const theme = THEMES[themeKey] || THEMES.emerald;
      this.currentTheme = themeKey;
      localStorage.setItem(ACTIVE_THEME_KEY, themeKey);

      // Inject / update CSS root variables and custom styles
      let styleTag = document.getElementById('nexchatDynamicThemeStyle');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'nexchatDynamicThemeStyle';
        document.head.appendChild(styleTag);
      }

      styleTag.textContent = `
        :root {
          --active-bubble-bg: ${theme.gradient};
          --active-bubble-border: ${theme.border};
          --active-bubble-shadow: ${theme.shadow};
          --active-bubble-color: ${theme.color};
        }

        .message-bubble.sent:not(.is-sticker-message):not(.is-clip-message) {
          background: ${theme.gradient} !important;
          border: ${theme.border} !important;
          box-shadow: ${theme.shadow} !important;
          color: ${theme.color} !important;
        }
      `;
    }
  }

  window.profileThemesEngine = new ProfileThemesEngine();
})();
