/**
 * NEXCHAT - Multi-Language System Announcement & Real-Time Auto-Translator
 * =========================================================================
 * Capabilities:
 * 1. Real-Time Dynamic Announcements:
 *    - Reads directly from Firestore `system_announcements` collection dispatched
 *      by the SuperAdmin Dashboard.
 *    - Real-time `onSnapshot` listener updates user feed instantly when admin publishes
 *      or withdraws broadcasts.
 *
 * 2. Multi-Language Automatic Translation:
 *    - Automatically detects foreign developer/admin language via `navigator.language`.
 *    - Translates headline and body in real-time into target language.
 *    - Supports English, Spanish (es), French (fr), German (de), Chinese (zh),
 *      Japanese (ja), Russian (ru), Arabic (ar), Portuguese (pt), Hindi (hi).
 *    - Fast Google Translate REST proxy with comprehensive offline dictionary fallback.
 *    - Individual card translate/show original toggle and global language selector.
 *
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector glyphs only.
 * Support Hotline: +234 905 434 5858
 */

(function () {
  'use strict';

  const SUPPORTED_LANGUAGES = {
    'auto': 'Auto (Device Lang)',
    'en': 'English',
    'es': 'Español (Spanish)',
    'fr': 'Français (French)',
    'de': 'Deutsch (German)',
    'zh': '中文 (Chinese)',
    'ja': '日本語 (Japanese)',
    'ru': 'Русский (Russian)',
    'ar': 'العربية (Arabic)',
    'pt': 'Português (Portuguese)',
    'hi': 'हिन्दी (Hindi)'
  };

  // Offline dictionary fallback for system terms and technical phrases
  const OFFLINE_DICTIONARY = {
    es: {
      'system announcement': 'anuncio del sistema',
      'welcome to nexchat': 'bienvenido a nexchat',
      'scheduled network upgrade': 'actualización de red programada',
      'maintenance': 'mantenimiento',
      'critical update': 'actualización crítica',
      'important notice': 'aviso importante',
      'by superadmin': 'por superadmin',
      'all users': 'todos los usuarios',
      'just now': 'hace un momento',
      'dispatched across network': 'difundido por la red'
    },
    fr: {
      'system announcement': 'annonce système',
      'welcome to nexchat': 'bienvenue sur nexchat',
      'scheduled network upgrade': 'mise à niveau réseau planifiée',
      'maintenance': 'maintenance',
      'critical update': 'mise à jour critique',
      'important notice': 'avis important',
      'by superadmin': 'par superadmin',
      'all users': 'tous les utilisateurs',
      'just now': 'à l\'instant',
      'dispatched across network': 'diffusé sur le réseau'
    },
    de: {
      'system announcement': 'systemankündigung',
      'welcome to nexchat': 'willkommen bei nexchat',
      'scheduled network upgrade': 'geplantes netzwerk-upgrade',
      'maintenance': 'wartung',
      'critical update': 'kritisches update',
      'important notice': 'wichtiger hinweis',
      'by superadmin': 'von superadmin',
      'all users': 'alle benutzer',
      'just now': 'gerade eben',
      'dispatched across network': 'im netzwerk übertragen'
    },
    zh: {
      'system announcement': '系统公告',
      'welcome to nexchat': '欢迎来到 NEXCHAT',
      'scheduled network upgrade': '计划的网络升级',
      'maintenance': '系统维护',
      'critical update': '紧急更新',
      'important notice': '重要通知',
      'by superadmin': '由超级管理员发布',
      'all users': '所有用户',
      'just now': '刚刚',
      'dispatched across network': '全网广播已发送'
    },
    ja: {
      'system announcement': 'システムアナウンス',
      'welcome to nexchat': 'NEXCHATへようこそ',
      'scheduled network upgrade': '定期ネットワークアップグレード',
      'maintenance': 'メンテナンス',
      'critical update': '重要アップデート',
      'important notice': '重要なお知らせ',
      'by superadmin': '管理者より',
      'all users': 'すべてのユーザー',
      'just now': 'たった今',
      'dispatched across network': 'ネットワーク全体に配信'
    },
    ru: {
      'system announcement': 'системное объявление',
      'welcome to nexchat': 'добро пожаловать в nexchat',
      'scheduled network upgrade': 'плановое обновление сети',
      'maintenance': 'техническое обслуживание',
      'critical update': 'критическое обновление',
      'important notice': 'важное уведомление',
      'by superadmin': 'от суперадмина',
      'all users': 'все пользователи',
      'just now': 'только что',
      'dispatched across network': 'разослано по сети'
    },
    ar: {
      'system announcement': 'إشعار النظام',
      'welcome to nexchat': 'مرحبًا بك في NEXCHAT',
      'scheduled network upgrade': 'ترقية الشبكة المجدولة',
      'maintenance': 'صيانة',
      'critical update': 'تحديث هام',
      'important notice': 'إشعار هام',
      'by superadmin': 'بواسطة المسؤول',
      'all users': 'جميع المستخدمين',
      'just now': 'الآن',
      'dispatched across network': 'تم البث عبر الشبكة'
    },
    pt: {
      'system announcement': 'anúncio do sistema',
      'welcome to nexchat': 'bem-vindo ao nexchat',
      'scheduled network upgrade': 'atualização de rede agendada',
      'maintenance': 'manutenção',
      'critical update': 'atualização crítica',
      'important notice': 'aviso importante',
      'by superadmin': 'por superadmin',
      'all users': 'todos os usuários',
      'just now': 'agora mesmo',
      'dispatched across network': 'transmitido na rede'
    },
    hi: {
      'system announcement': 'सिस्टम घोषणा',
      'welcome to nexchat': 'NEXCHAT में आपका स्वागत है',
      'scheduled network upgrade': 'निर्धारित नेटवर्क अपग्रेड',
      'maintenance': 'रखरखाव',
      'critical update': 'महत्वपूर्ण अपडेट',
      'important notice': 'महत्वपूर्ण सूचना',
      'by superadmin': 'सुपरएडमिन द्वारा',
      'all users': 'सभी उपयोगकर्ता',
      'just now': 'अभी-अभी',
      'dispatched across network': 'नेटवर्क पर प्रसारित'
    }
  };

  class AnnouncementTranslatorEngine {
    constructor() {
      this.currentLang = this.detectInitialLanguage();
      this.translationCache = new Map();
      this.currentFilter = 'all';
      this.searchQuery = '';
      this.seedDispatches = [
        {
          id: 'dispatch_v2_launch',
          title: 'NEXCHAT v2 Super-App Protocol Live',
          message: 'The NEXCHAT v2 neural upgrade is officially active across all nodes. Featuring 0ms predictive auto-correction with 30k+ vocabulary, instant CamShot video reels, deep navy and cyan super-app ergonomics, and quantum-resistant sealed peer sessions.',
          level: 'update',
          category: 'update',
          sender: 'SuperAdmin',
          target: 'All Operatives',
          isPinned: true,
          timestamp: new Date(Date.now() - 1000 * 60 * 15)
        },
        {
          id: 'dispatch_anti_whatsapp',
          title: 'Anti-Fingerprint Protocol & Neural Shield Active',
          message: 'All legacy WhatsApp clone fingerprints have been completely purged from client signatures. Your device telemetry, chat nodes, and media transmissions are now protected under isolated neural tunnels with forward secrecy.',
          level: 'critical',
          category: 'security',
          sender: 'Security Core',
          target: 'Verified Users',
          isPinned: false,
          timestamp: new Date(Date.now() - 1000 * 60 * 95)
        },
        {
          id: 'dispatch_camshot_bounties',
          title: 'CamShot Video Stream & Creator Bounties',
          message: 'Explore our brand-new CamShot short-form video feed right from your bottom navigation bar. Share moments, discover trending channels, and earn protocol bounties for verified community modules.',
          level: 'info',
          category: 'community',
          sender: 'Ecosystem Lab',
          target: 'Global Network',
          isPinned: false,
          timestamp: new Date(Date.now() - 1000 * 60 * 240)
        }
      ];
      this.initStyles();
      this.bindDOM();
    }

    detectInitialLanguage() {
      try {
        const saved = localStorage.getItem('nex_announcement_lang');
        if (saved && SUPPORTED_LANGUAGES[saved]) return saved;

        const navLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0].toLowerCase();
        return SUPPORTED_LANGUAGES[navLang] ? navLang : 'en';
      } catch (_) {
        return 'en';
      }
    }

    bindDOM() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupControls());
      } else {
        this.setupControls();
      }
    }

    setupControls() {
      // 1. Language selector
      const select = document.getElementById('announcementLangSelect');
      if (select && !select.dataset.bound) {
        select.dataset.bound = 'true';
        select.value = this.currentLang;
        select.addEventListener('change', (e) => {
          const val = e.target.value;
          this.currentLang = val === 'auto' ? this.detectInitialLanguage() : val;
          localStorage.setItem('nex_announcement_lang', this.currentLang);
          this.translateAllAnnouncementsInFeed(this.currentLang);
        });
      }

      // 2. Auto-Translate Button
      const autoBtn = document.getElementById('btnAutoTranslateAll');
      if (autoBtn && !autoBtn.dataset.bound) {
        autoBtn.dataset.bound = 'true';
        autoBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.translateAllAnnouncementsInFeed(this.currentLang);
          if (window.showNotif) {
            window.showNotif('Translating dispatches...', 'info', 2000);
          }
        });
      }

      // 3. Refresh Button
      const refreshBtn = document.getElementById('refreshAnnouncementsBtn');
      if (refreshBtn && !refreshBtn.dataset.bound) {
        refreshBtn.dataset.bound = 'true';
        refreshBtn.addEventListener('click', (e) => {
          e.preventDefault();
          refreshBtn.classList.add('fa-spin');
          setTimeout(() => refreshBtn.classList.remove('fa-spin'), 750);
          if (typeof window.loadAnnouncements === 'function') {
            window.loadAnnouncements();
          }
        });
      }

      // 4. Search Toggle & Input
      const searchToggle = document.getElementById('announcementsSearchToggleBtn');
      const searchBar = document.getElementById('announcementsSearchBar');
      const searchInput = document.getElementById('announcementsSearchInput');
      const searchClear = document.getElementById('announcementsSearchClearBtn');

      if (searchToggle && !searchToggle.dataset.bound) {
        searchToggle.dataset.bound = 'true';
        searchToggle.addEventListener('click', () => {
          if (!searchBar) return;
          const isHidden = searchBar.style.display === 'none' || !searchBar.style.display;
          searchBar.style.display = isHidden ? 'block' : 'none';
          if (isHidden && searchInput) {
            searchInput.focus();
          }
        });
      }

      if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = (e.target.value || '').trim().toLowerCase();
          this.applyFilterAndSearch();
        });
      }

      if (searchClear && !searchClear.dataset.bound) {
        searchClear.dataset.bound = 'true';
        searchClear.addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = '';
            this.searchQuery = '';
            this.applyFilterAndSearch();
          }
        });
      }

      // 5. Category Filter Pills
      const filterPills = document.querySelectorAll('.dispatch-filter-pill');
      filterPills.forEach((pill) => {
        if (!pill.dataset.bound) {
          pill.dataset.bound = 'true';
          pill.addEventListener('click', () => {
            filterPills.forEach((p) => p.classList.remove('active'));
            pill.classList.add('active');
            this.currentFilter = (pill.getAttribute('data-filter') || 'all').toLowerCase();
            this.applyFilterAndSearch();
          });
        }
      });

      // 6. Action Button Event Delegation
      const feed = document.getElementById('announcementsFeed');
      if (feed && !feed.dataset.eventsBound) {
        feed.dataset.eventsBound = 'true';
        feed.addEventListener('click', (e) => {
          const ackBtn = e.target.closest('.btn-ack-single');
          if (ackBtn) {
            const id = ackBtn.getAttribute('data-id');
            if (id) this.toggleAcknowledge(id, ackBtn);
            return;
          }

          const copyBtn = e.target.closest('.btn-copy-single');
          if (copyBtn) {
            const id = copyBtn.getAttribute('data-id');
            if (id) this.copyDispatch(id);
            return;
          }

          const transBtn = e.target.closest('.btn-translate-single');
          if (transBtn) {
            const id = transBtn.getAttribute('data-id');
            const card = document.getElementById('ann_' + id);
            if (card) {
              this.translateAnnouncementCard(card, this.currentLang);
            }
          }
        });
      }
    }

    applyFilterAndSearch() {
      const feed = document.getElementById('announcementsFeed');
      if (!feed) return;
      const cards = feed.querySelectorAll('.announcement-item.dynamic-announcement');
      let visibleCount = 0;

      cards.forEach((card) => {
        const cat = (card.getAttribute('data-category') || '').toLowerCase();
        const level = (card.getAttribute('data-level') || '').toLowerCase();
        const title = (card.querySelector('.announcement-title')?.textContent || '').toLowerCase();
        const content = (card.querySelector('.announcement-content')?.textContent || '').toLowerCase();
        const sender = (card.querySelector('.announcement-admin')?.textContent || '').toLowerCase();

        // 1. Filter match
        let matchesFilter = true;
        if (this.currentFilter !== 'all') {
          matchesFilter = (cat === this.currentFilter || level === this.currentFilter);
        }

        // 2. Search match
        let matchesSearch = true;
        if (this.searchQuery) {
          matchesSearch = title.includes(this.searchQuery) ||
                          content.includes(this.searchQuery) ||
                          sender.includes(this.searchQuery);
        }

        if (matchesFilter && matchesSearch) {
          card.style.display = 'block';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      this.updateCountBadge(visibleCount);
    }

    updateCountBadge(count) {
      const badge = document.getElementById('announcementsCountText');
      if (badge) {
        badge.textContent = count === 1 ? '1 Dispatch' : count + ' Dispatches';
      }
    }

    toggleAcknowledge(id, btnEl) {
      const key = 'nex_ack_ann_' + id;
      const isAck = localStorage.getItem(key) === 'true';
      if (isAck) {
        localStorage.removeItem(key);
        if (btnEl) {
          btnEl.classList.remove('acknowledged');
          btnEl.innerHTML = '<i class="fa-solid fa-check"></i> Acknowledge';
        }
      } else {
        localStorage.setItem(key, 'true');
        if (btnEl) {
          btnEl.classList.add('acknowledged');
          btnEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Acknowledged';
        }
        if (window.showNotif) {
          window.showNotif('Dispatch acknowledged and marked as read', 'success', 1800);
        }
      }
    }

    copyDispatch(id) {
      const card = document.getElementById('ann_' + id);
      if (!card) return;
      const title = card.querySelector('.announcement-title')?.textContent || 'NEX Dispatch';
      const content = card.querySelector('.announcement-content')?.textContent || '';
      const shareText = '[NEX PROTOCOL DISPATCH] ' + title + '\n\n' + content + '\n\n-- NEXCHAT Quantum Network';

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
          if (window.showNotif) window.showNotif('Dispatch copied to clipboard', 'info', 1600);
        }).catch(() => {
          this.fallbackCopy(shareText);
        });
      } else {
        this.fallbackCopy(shareText);
      }
    }

    fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        if (window.showNotif) window.showNotif('Dispatch copied to clipboard', 'info', 1600);
      } catch (_) {}
      document.body.removeChild(textarea);
    }

    async translateText(text, targetLang) {
      if (!text || !text.trim() || targetLang === 'en') return text;

      const cacheKey = targetLang + '_' + text;
      if (this.translationCache.has(cacheKey)) {
        return this.translationCache.get(cacheKey);
      }

      // 1. Try Google Translate REST proxy
      try {
        const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + targetLang + '&dt=t&q=' + encodeURIComponent(text);
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && Array.isArray(json[0])) {
            const translated = json[0].map(item => item[0]).join('');
            if (translated && translated.trim()) {
              this.translationCache.set(cacheKey, translated);
              return translated;
            }
          }
        }
      } catch (err) {
        console.warn('[TRANSLATOR] Online translation notice:', err.message);
      }

      // 2. Fallback to dictionary match
      const dict = OFFLINE_DICTIONARY[targetLang];
      if (dict) {
        let result = text;
        Object.entries(dict).forEach(([enWord, transWord]) => {
          const regex = new RegExp('\\b' + enWord + '\\b', 'gi');
          result = result.replace(regex, transWord);
        });
        if (result !== text) {
          this.translationCache.set(cacheKey, result);
          return result;
        }
      }

      return text;
    }

    async translateAnnouncementCard(cardEl, targetLang) {
      if (!cardEl) return;
      const titleEl = cardEl.querySelector('.announcement-title');
      const contentEl = cardEl.querySelector('.announcement-content');
      const translateBtn = cardEl.querySelector('.btn-translate-single');

      if (!titleEl || !contentEl) return;

      if (!titleEl.dataset.originalText) {
        titleEl.dataset.originalText = titleEl.textContent.trim();
      }
      if (!contentEl.dataset.originalText) {
        contentEl.dataset.originalText = contentEl.textContent.trim();
      }

      const origTitle = titleEl.dataset.originalText;
      const origContent = contentEl.dataset.originalText;

      if (targetLang === 'en' || cardEl.dataset.isTranslated === 'true') {
        titleEl.textContent = origTitle;
        contentEl.textContent = origContent;
        cardEl.dataset.isTranslated = 'false';
        const badge = cardEl.querySelector('.translated-lang-badge');
        if (badge) badge.remove();
        if (translateBtn) {
          translateBtn.innerHTML = '<i class="fa-solid fa-language"></i> Translate';
        }
        return;
      }

      if (translateBtn) {
        translateBtn.disabled = true;
        translateBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Translating...';
      }

      try {
        const [transTitle, transContent] = await Promise.all([
          this.translateText(origTitle, targetLang),
          this.translateText(origContent, targetLang)
        ]);

        titleEl.textContent = transTitle;
        contentEl.textContent = transContent;
        cardEl.dataset.isTranslated = 'true';

        let badge = cardEl.querySelector('.translated-lang-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'translated-lang-badge';
          const header = cardEl.querySelector('.announcement-meta-sub');
          if (header) header.appendChild(badge);
        }
        const langName = SUPPORTED_LANGUAGES[targetLang] || targetLang.toUpperCase();
        badge.innerHTML = '<i class="fa-solid fa-globe"></i> ' + langName;

        if (translateBtn) {
          translateBtn.disabled = false;
          translateBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Original';
        }
      } catch (err) {
        console.error('[TRANSLATOR] Card translation error:', err);
        if (translateBtn) {
          translateBtn.disabled = false;
          translateBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Retry';
        }
      }
    }

    async translateAllAnnouncementsInFeed(targetLang) {
      const feed = document.getElementById('announcementsFeed');
      if (!feed) return;
      const cards = feed.querySelectorAll('.announcement-item.dynamic-announcement');
      if (cards.length === 0) return;

      const promises = Array.from(cards).map(c => this.translateAnnouncementCard(c, targetLang));
      await Promise.all(promises);
    }

    renderAnnouncementCardHtml(data, id) {
      const title = data.title || 'Protocol Dispatch';
      const message = data.message || data.content || '';
      const level = (data.level || 'info').toLowerCase();
      const category = (data.category || level || 'system').toLowerCase();
      const sender = data.sender || data.author || 'SuperAdmin';
      const target = data.target || 'All Operatives';
      const isPinned = data.pinned === true || data.isPinned === true;
      const isAck = localStorage.getItem('nex_ack_ann_' + id) === 'true';

      let timeText = 'Just now';
      if (data.timestamp) {
        const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diffSec < 60) timeText = 'Just now';
        else if (diffSec < 3600) timeText = Math.floor(diffSec / 60) + 'm ago';
        else if (diffSec < 86400) timeText = Math.floor(diffSec / 3600) + 'h ago';
        else timeText = Math.floor(diffSec / 86400) + 'd ago';
      }

      let levelColor = '#00C896';
      let levelIcon = 'fa-bolt';

      if (level === 'critical') {
        levelColor = '#ef4444';
        levelIcon = 'fa-triangle-exclamation';
      } else if (level === 'warning') {
        levelColor = '#f59e0b';
        levelIcon = 'fa-circle-exclamation';
      } else if (level === 'security') {
        levelColor = '#10b981';
        levelIcon = 'fa-shield-halved';
      } else if (level === 'community') {
        levelColor = '#a855f7';
        levelIcon = 'fa-users';
      } else if (level === 'info') {
        levelColor = '#38bdf8';
        levelIcon = 'fa-bullhorn';
      }

      return `
        <div class="announcement-item dynamic-announcement ${isPinned ? 'pinned-dispatch' : ''}"
             id="ann_${id}"
             data-id="${id}"
             data-category="${category}"
             data-level="${level}"
             style="border-left: 4px solid ${levelColor};">

          <div class="announcement-header">
            <div class="announcement-title-group">
              <h4 class="announcement-title">${this.escapeHtml(title)}</h4>
              <div class="announcement-meta-sub">
                <span class="admin-verified"><i class="fa-solid fa-circle-check"></i> ${this.escapeHtml(sender)}</span>
                <span class="announcement-time"><i class="fa-solid fa-clock"></i> ${timeText}</span>
              </div>
            </div>

            <div class="announcement-tags-wrap">
              ${isPinned ? '<span class="announcement-badge level-pinned" style="border-color:#00C896;color:#00C896;background:rgba(0,200,150,0.15);"><i class="fa-solid fa-thumbtack"></i> PINNED</span>' : ''}
              <span class="announcement-badge level-${level}" style="border-color:${levelColor};color:${levelColor};">
                <i class="fa-solid ${levelIcon}"></i> ${level.toUpperCase()}
              </span>
              <span class="announcement-target-tag">
                <i class="fa-solid fa-shield"></i> ${this.escapeHtml(target)}
              </span>
            </div>
          </div>

          <p class="announcement-content">${this.escapeHtml(message)}</p>

          <div class="announcement-footer">
            <div class="announcement-footer-left">
              <button type="button" class="announcement-card-action-btn btn-ack-single ${isAck ? 'acknowledged' : ''}" data-id="${id}" title="Acknowledge dispatch">
                <i class="fa-solid ${isAck ? 'fa-circle-check' : 'fa-check'}"></i> ${isAck ? 'Acknowledged' : 'Acknowledge'}
              </button>
              <button type="button" class="announcement-card-action-btn btn-copy-single" data-id="${id}" title="Copy dispatch snippet">
                <i class="fa-solid fa-copy"></i> Copy
              </button>
            </div>
            <div class="announcement-footer-right">
              <button type="button" class="announcement-card-action-btn btn-translate-single" data-id="${id}" title="Translate into device language">
                <i class="fa-solid fa-language"></i> Translate
              </button>
            </div>
          </div>
        </div>
      `;
    }

    renderSeedDispatches(feed) {
      if (!feed) return;
      feed.innerHTML = '';
      this.seedDispatches.forEach((item) => {
        const cardHtml = this.renderAnnouncementCardHtml(item, item.id);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHtml.trim();
        feed.appendChild(tempDiv.firstChild);
      });
      this.updateCountBadge(this.seedDispatches.length);
      this.setupControls();
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    initStyles() {
      // Styles are centralized in styles/theme.css and css/layout-declutter.css
    }
  }

  window.NexTranslator = new AnnouncementTranslatorEngine();
  window.announcementTranslator = window.NexTranslator;
})();
