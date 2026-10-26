/**
 * NEXCHAT Adaptive Personal Vocabulary & Name Whitelist
 * Prevents auto-correcting contact names, gamer tags, and custom user terms
 * 
 * Capabilities:
 * - Automatically learns contacts and active chat names
 * - Persistent localStorage dictionary (learnWord, unlearnWord)
 * - Zero-latency O(1) Set lookup
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'nexchat_personal_vocab_v1';

  class PersonalVocabEngine {
    constructor() {
      this.vocab = new Set();
      this.load();
      this.scanContacts();
    }

    load() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const arr = JSON.parse(saved);
          if (Array.isArray(arr)) {
            arr.forEach(w => this.vocab.add(String(w).toLowerCase()));
          }
        }
      } catch (_) {}

      // Built-in core ecosystem keywords whitelist
      const core = [
        'nexchat', 'chronex', 'astroshift', 'cyberdrop', 'camshot', 'cams',
        'stegano', 'ghostvault', 'soundboard', 'babel', 'reels', 'cipher',
        'syndicate', 'syndicates', 'escrow', 'davide', 'alexander', 'demon',
        'tressy', 'metropolis', 'subagent', 'vercellabs', 'webrtc'
      ];
      core.forEach(w => this.vocab.add(w.toLowerCase()));
    }

    save() {
      try {
        const arr = Array.from(this.vocab).slice(0, 1000);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      } catch (_) {}
    }

    learnWord(word) {
      if (!word || word.length < 2) return;
      const clean = String(word).trim().toLowerCase();
      this.vocab.add(clean);
      this.save();
    }

    unlearnWord(word) {
      if (!word) return;
      const clean = String(word).trim().toLowerCase();
      this.vocab.delete(clean);
      this.save();
    }

    hasWord(word) {
      if (!word) return false;
      const clean = String(word).trim().toLowerCase();
      return this.vocab.has(clean);
    }

    /**
     * Scans DOM contact list to automatically whitelist all contacts
     */
    scanContacts() {
      if (typeof document === 'undefined') return;
      const scan = () => {
        const names = document.querySelectorAll('.chat-name, .contact-name, .chat-list-item[data-chat-name]');
        names.forEach(el => {
          const name = el.textContent || el.getAttribute('data-chat-name') || '';
          if (name) {
            const parts = name.trim().split(/\s+/);
            parts.forEach(p => {
              const clean = p.replace(/[^\w]/g, '').toLowerCase();
              if (clean.length >= 2) this.vocab.add(clean);
            });
          }
        });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(scan, 1000));
      } else {
        setTimeout(scan, 800);
      }
    }
  }

  // Export to window
  window.PersonalVocabEngine = PersonalVocabEngine;
  window.personalVocabEngine = new PersonalVocabEngine();
})();
