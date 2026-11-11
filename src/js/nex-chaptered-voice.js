/**
 * NEXCHAT - Chaptered Voice Notes & Audio Mind-Map Engine
 * Module: src/js/nex-chaptered-voice.js
 * 
 * Capabilities:
 * - Multi-segment / Chaptered voice note bookmarking during recording.
 * - Interactive timestamped chapter pills on audio playback bubbles.
 * - 1-tap seeking directly to specific chapters with visual pulse.
 * - Zero external APIs required: leverages HTML5 MediaRecorder and Web Audio API.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  class NexChapteredVoiceEngine {
    constructor() {
      this.activeRecordingChapters = [];
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindUI());
      } else {
        this.bindUI();
      }
    }

    bindUI() {
      // Observer to detect newly rendered audio containers and inject chapter navigation
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.inspectAndMountChapters(node);
            }
          });
        }
      });

      const target = document.getElementById('messages-area') || document.body;
      observer.observe(target, { childList: true, subtree: true });

      // Initial pass
      document.querySelectorAll('.message-bubble, .audio-bubble, .voice-note-card').forEach(el => {
        this.inspectAndMountChapters(el);
      });
    }

    /**
     * Start a new recording session chapter log
     */
    startNewRecording() {
      this.activeRecordingChapters = [
        { time: 0, label: 'Intro / Overview' }
      ];
    }

    /**
     * Add a chapter bookmark at current recording elapsed seconds
     */
    addChapterBookmark(elapsedSeconds, customLabel) {
      const time = Math.floor(elapsedSeconds);
      const label = customLabel || `Section ${this.activeRecordingChapters.length + 1}`;
      this.activeRecordingChapters.push({ time, label });
      if (typeof window.showNotif === 'function') {
        window.showNotif(`Chapter marked at ${this.formatTime(time)}: ${label}`, 'success', 2000);
      }
      return this.activeRecordingChapters;
    }

    getRecordedChapters() {
      return [...this.activeRecordingChapters];
    }

    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    /**
     * Inspects a message element and renders chapter pills if audio or chapter metadata exists
     */
    inspectAndMountChapters(el) {
      if (!el || el.querySelector?.('.nex-audio-chapters-deck')) return;

      const audioEl = el.querySelector?.('audio') || (el.tagName === 'AUDIO' ? el : null);
      if (!audioEl) return;

      // Check if text or metadata specifies chapters, e.g. [0:00], [0:45], or custom dataset
      const textContent = el.textContent || '';
      let chapters = [];

      // Check for dataset chapters
      if (el.dataset?.chapters) {
        try { chapters = JSON.parse(el.dataset.chapters); } catch (_) {}
      }

      // Check text-based timestamps: e.g. "0:00 Intro, 0:35 Specs, 1:12 Deadlines"
      if (!chapters.length) {
        const matches = [...textContent.matchAll(/(?:\[?(\d{1,2}:\d{2})\]?)\s*([A-Za-z0-9\s_-]+)/g)];
        if (matches.length >= 2) {
          chapters = matches.map(m => {
            const parts = m[1].split(':');
            const sec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            return { time: sec, label: m[2].trim().slice(0, 20) };
          });
        }
      }

      // If audio duration is known and > 30s, provide smart segmented chapters if none defined
      if (!chapters.length && audioEl.duration && audioEl.duration > 40) {
        const d = Math.floor(audioEl.duration);
        chapters = [
          { time: 0, label: 'Overview' },
          { time: Math.floor(d * 0.35), label: 'Key Details' },
          { time: Math.floor(d * 0.75), label: 'Action Items' }
        ];
      }

      if (chapters.length > 0) {
        this.renderChapterPills(audioEl, chapters);
      }
    }

    renderChapterPills(audioEl, chapters) {
      const parent = audioEl.closest('.message-bubble, .chat-message, .msg-item') || audioEl.parentElement;
      if (!parent || parent.querySelector('.nex-audio-chapters-deck')) return;

      const deck = document.createElement('div');
      deck.className = 'nex-audio-chapters-deck';
      deck.style.cssText = `
        margin-top: 8px;
        padding-top: 6px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      `;

      const title = document.createElement('div');
      title.style.cssText = 'font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; width: 100%; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;';
      title.innerHTML = '<i class="fa-solid fa-bookmark" style="color: #00f2fe;"></i> Audio Chapters';
      deck.appendChild(title);

      chapters.forEach(c => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'nex-chapter-pill';
        pill.style.cssText = `
          background: rgba(0, 242, 254, 0.12);
          border: 1px solid rgba(0, 242, 254, 0.35);
          color: #38bdf8;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 10.5px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        `;
        pill.innerHTML = `<i class="fa-solid fa-play" style="font-size: 8px;"></i> <span>${this.formatTime(c.time)}</span> <strong style="color: #fff;">${c.label}</strong>`;

        pill.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          audioEl.currentTime = c.time;
          if (audioEl.paused) audioEl.play();

          // Highlight active pill
          deck.querySelectorAll('.nex-chapter-pill').forEach(p => p.style.borderColor = 'rgba(0, 242, 254, 0.35)');
          pill.style.borderColor = '#00f2fe';
          pill.style.background = 'rgba(0, 242, 254, 0.25)';
        });

        deck.appendChild(pill);
      });

      parent.appendChild(deck);
    }
  }

  window.NexChapteredVoice = new NexChapteredVoiceEngine();

})(typeof window !== 'undefined' ? window : this);
