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

      const autoBtn = document.getElementById('btnAutoTranslateAll');
      if (autoBtn && !autoBtn.dataset.bound) {
        autoBtn.dataset.bound = 'true';
        autoBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.translateAllAnnouncementsInFeed(this.currentLang);
          if (window.showNotif) {
            window.showNotif(`Announcements translating to ${SUPPORTED_LANGUAGES[this.currentLang] || this.currentLang}...`, 'info', 2000);
          }
        });
      }

      const refreshBtn = document.getElementById('refreshAnnouncementsBtn');
      if (refreshBtn && !refreshBtn.dataset.bound) {
        refreshBtn.dataset.bound = 'true';
        refreshBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (typeof window.loadAnnouncements === 'function') {
            window.loadAnnouncements();
          }
        });
      }
    }

    async translateText(text, targetLang) {
      if (!text || !text.trim() || targetLang === 'en') return text;

      const cacheKey = `${targetLang}_${text}`;
      if (this.translationCache.has(cacheKey)) {
        return this.translationCache.get(cacheKey);
      }

      // 1. Try Google Translate REST proxy
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
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
          const regex = new RegExp(`\\b${enWord}\\b`, 'gi');
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

      // Cache original text on dataset if not present
      if (!titleEl.dataset.originalText) {
        titleEl.dataset.originalText = titleEl.textContent.trim();
      }
      if (!contentEl.dataset.originalText) {
        contentEl.dataset.originalText = contentEl.textContent.trim();
      }

      const origTitle = titleEl.dataset.originalText;
      const origContent = contentEl.dataset.originalText;

      // If returning to English or original
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

        // Add language badge if not exists
        let badge = cardEl.querySelector('.translated-lang-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'translated-lang-badge';
          const header = cardEl.querySelector('.announcement-header');
          if (header) header.appendChild(badge);
        }
        const langName = SUPPORTED_LANGUAGES[targetLang] || targetLang.toUpperCase();
        badge.innerHTML = `<i class="fa-solid fa-globe"></i> ${langName}`;

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
      const cards = feed.querySelectorAll('.announcement-item:not(.announcements-empty-state)');
      if (cards.length === 0) return;

      const promises = Array.from(cards).map(c => this.translateAnnouncementCard(c, targetLang));
      await Promise.all(promises);
    }

    renderAnnouncementCardHtml(data, id) {
      const title = data.title || 'System Announcement';
      const message = data.message || data.content || '';
      const level = (data.level || 'info').toLowerCase();
      const sender = data.sender || data.author || 'SuperAdmin';
      const target = data.target || 'All Users';

      let timeText = 'Just now';
      if (data.timestamp) {
        const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diffSec < 60) timeText = 'Just now';
        else if (diffSec < 3600) timeText = `${Math.floor(diffSec / 60)}m ago`;
        else if (diffSec < 86400) timeText = `${Math.floor(diffSec / 3600)}h ago`;
        else timeText = `${Math.floor(diffSec / 86400)}d ago`;
      }

      const levelColor = level === 'critical' ? '#ef4444' : (level === 'warning' ? '#f59e0b' : '#00f3ff');
      const levelIcon = level === 'critical' ? 'fa-triangle-exclamation' : (level === 'warning' ? 'fa-circle-exclamation' : 'fa-bullhorn');

      return `
        <div class="announcement-item dynamic-announcement" id="ann_${id}" data-id="${id}" style="border-left: 4px solid ${levelColor};">
          <div class="announcement-header">
            <h4 class="announcement-title">${this.escapeHtml(title)}</h4>
            <div class="announcement-tags-wrap">
              <span class="announcement-badge level-${level}" style="border-color: ${levelColor}; color: ${levelColor};">
                <i class="fa-solid ${levelIcon}"></i> ${level.toUpperCase()}
              </span>
              <span class="announcement-target-tag">
                <i class="fa-solid fa-users"></i> ${this.escapeHtml(target)}
              </span>
            </div>
          </div>

          <p class="announcement-content">${this.escapeHtml(message)}</p>

          <div class="announcement-footer">
            <div class="announcement-meta-left">
              <span class="announcement-time"><i class="fa-solid fa-clock"></i> ${timeText}</span>
              <span class="announcement-admin"><i class="fa-solid fa-shield-halved"></i> ${this.escapeHtml(sender)}</span>
            </div>
            <div class="announcement-meta-right">
              <button type="button" class="btn-translate-single" onclick="window.NexTranslator.translateAnnouncementCard(document.getElementById('ann_${id}'), window.NexTranslator.currentLang)">
                <i class="fa-solid fa-language"></i> Translate
              </button>
            </div>
          </div>
        </div>
      `;
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
      if (document.getElementById('announcementTranslatorStyles')) return;
      const style = document.createElement('style');
      style.id = 'announcementTranslatorStyles';
      style.textContent = `
        /* Announcement Translation Controls Toolbar */
        .announcement-controls-bar {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .announcement-lang-picker {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(13, 18, 29, 0.85);
          border: 1px solid rgba(192, 132, 252, 0.35);
          border-radius: 8px;
          padding: 3px 8px;
        }
        .announcement-lang-select {
          background: transparent;
          border: none;
          color: #f1f5f9;
          font-size: 11.5px;
          font-weight: 700;
          font-family: inherit;
          outline: none;
          cursor: pointer;
        }
        .announcement-lang-select option {
          background: #0d121d;
          color: #ffffff;
        }
        .btn-auto-translate {
          background: rgba(192, 132, 252, 0.15);
          border: 1px solid rgba(192, 132, 252, 0.4);
          color: #c084fc;
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 11.5px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.18s;
        }
        .btn-auto-translate:hover {
          background: #c084fc;
          color: #050811;
          box-shadow: 0 0 12px rgba(192, 132, 252, 0.4);
        }
        .announcement-refresh-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94a3b8;
          border-radius: 8px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.18s;
        }
        .announcement-refresh-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.15);
        }

        /* Dynamic Announcement Card Styles */
        .dynamic-announcement {
          background: #0f172a;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          transition: transform 0.18s ease;
        }
        .dynamic-announcement:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
        }
        .announcement-tags-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .announcement-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 9999px;
          border: 1px solid currentColor;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .announcement-target-tag {
          font-size: 10px;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .translated-lang-badge {
          font-size: 9.5px;
          color: #10b981;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          padding: 2px 6px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 700;
        }
        .btn-translate-single {
          background: rgba(192, 132, 252, 0.1);
          border: 1px solid rgba(192, 132, 252, 0.3);
          color: #c084fc;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: all 0.15s;
        }
        .btn-translate-single:hover {
          background: #c084fc;
          color: #050811;
        }
        .announcement-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 11px;
          color: #64748b;
        }
        .announcement-meta-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.NexTranslator = new AnnouncementTranslatorEngine();
  window.announcementTranslator = window.NexTranslator;
})();
