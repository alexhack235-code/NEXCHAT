/**
 * CHRONEXX AI - Professional Markdown Layout & Neural Voice Note Engine
 * =====================================================================
 * 1. ChronexxLayoutEngine:
 *    - Structured GitHub-Flavored Markdown Parser
 *    - Responsive Cyber Data Tables (| Col 1 | Col 2 |)
 *    - Fenced Code Blocks with Language Badges, Run-in-Sandbox, and Copy
 *    - Hierarchical Headings with subtle gradient dividers
 *    - Executive Callout Cards (> [!NOTE], [!TIP], [!IMPORTANT], [!WARNING])
 *    - Ordered and Unordered Lists with custom cyber bullets
 *    - Key-Value Metadata Badges (**Key:** Value)
 *    - Safe for live token streaming
 *
 * 2. ChronexxVoiceEngine:
 *    - Procedural Neural Speech Synthesis (Voice Note Player)
 *    - Soundwave Frequency Bars Visualizer
 *    - Play, Pause, Resume & Speed Controls (1.0x, 1.25x, 1.5x, 2.0x)
 *    - Natural speech filter (strips code blocks & URLs before speaking)
 *
 * STRICTLY ZERO EMOJIS: Vector icons and clean cyberpunk styling only.
 */

(function () {
  'use strict';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ===================================================================
  // 1. CHRONEXX MARKDOWN & LAYOUT PARSER
  // ===================================================================

  class ChronexxLayoutEngine {
    formatMarkdown(rawText) {
      if (!rawText) return '';
      let text = String(rawText);

      // A. Extract and protect code blocks
      const codeBlocks = [];
      text = text.replace(/```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const placeholder = `__CHRONEX_CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push({ lang: lang || 'code', code: code.trim() });
        return placeholder;
      });

      // B. Parse Markdown Tables
      text = this.parseTables(text);

      // C. Parse Executive Callout Alerts
      text = this.parseCallouts(text);

      // D. Headers
      text = text.replace(/^#### (.*$)/gim, '<h4 class="chronex-h4 chronex-h">$1</h4>');
      text = text.replace(/^### (.*$)/gim, '<h3 class="chronex-h3 chronex-h">$1</h3>');
      text = text.replace(/^## (.*$)/gim, '<h2 class="chronex-h2 chronex-h">$1</h2>');
      text = text.replace(/^# (.*$)/gim, '<h1 class="chronex-h1 chronex-h">$1</h1>');

      // E. Horizontal Rule
      text = text.replace(/^(?:---|\*\*\*|___)\s*$/gim, '<hr class="chronex-hr">');

      // F. Lists
      text = this.parseLists(text);

      // G. Inline Code
      text = text.replace(/`([^`]+)`/g, '<code class="chronex-inline-code">$1</code>');

      // H. Bold and Italic
      text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
      text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

      // I. Key-Value Tag Pair Highlights (**Key:** Value)
      text = text.replace(/<strong>([^:<]+):<\/strong>\s+([^<\n]+)/g, '<span class="chronex-kv-pill"><strong class="kv-key">$1:</strong> <span class="kv-val">$2</span></span>');

      // J. Paragraph Line Breaks (Preserving container structure)
      text = text.replace(/\n\n+/g, '</p><p class="chronex-p">');
      text = text.replace(/\n/g, '<br>');
      text = `<p class="chronex-p">${text}</p>`;

      // Clean empty paragraphs
      text = text.replace(/<p class="chronex-p">\s*<\/p>/g, '');
      text = text.replace(/<p class="chronex-p">\s*(<h[1-4]|<table|<div class="chronex-alert|<hr|<ul|<ol|<div class="chronex-table-wrapper)/g, '$1');
      text = text.replace(/(<\/h[1-4]>|<\/table>|<\/div>|<\/hr>|<\/ul>|<\/ol>)\s*<\/p>/g, '$1');

      // K. Re-inject Protected Code Blocks
      codeBlocks.forEach((item, idx) => {
        const safeCode = escapeHtml(item.code);
        const safeLang = escapeHtml(item.lang);
        const cardHtml = `
          <div class="chronex-code-card">
            <div class="chronex-code-header">
              <span class="chronex-code-lang"><i class="fa-solid fa-code"></i> ${safeLang}</span>
              <div class="chronex-code-actions">
                <button type="button" class="run-sandbox-chip" onclick="window.CyberFeatures?.sandbox?.show(this.closest('.chronex-code-card').querySelector('code').innerText)">
                  <i class="fa-solid fa-play"></i> Run in Sandbox
                </button>
                <button type="button" class="copy-code-btn" onclick="navigator.clipboard.writeText(this.closest('.chronex-code-card').querySelector('code').innerText); this.innerHTML='<i class=\\'fa-solid fa-check\\'></i> Copied!'; setTimeout(()=>{ this.innerHTML='<i class=\\'fa-regular fa-copy\\'></i> Copy'; }, 2000);">
                  <i class="fa-regular fa-copy"></i> Copy
                </button>
              </div>
            </div>
            <pre class="chronex-code-pre"><code>${safeCode}</code></pre>
          </div>
        `;
        text = text.replace(`__CHRONEX_CODE_BLOCK_${idx}__`, cardHtml);
      });

      return text;
    }

    parseTables(text) {
      // Matches consecutive lines starting and ending with '|'
      const tableRegex = /(?:^|\n)((?:\|[^\n]+\|\r?\n?){2,})/g;
      return text.replace(tableRegex, (match, tableBlock) => {
        const lines = tableBlock.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return match;
        // Verify line 1 is a valid markdown separator (| --- | --- |)
        if (!/^\|[\s\-:|]+\|$/.test(lines[1])) return match;

        const parseCols = (line) => line.split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
        const headerCols = parseCols(lines[0]);
        const rows = lines.slice(2).map(parseCols);

        let tableHtml = '<div class="chronex-table-wrapper"><table class="chronex-table"><thead><tr>';
        headerCols.forEach(h => {
          tableHtml += `<th>${escapeHtml(h)}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        rows.forEach(r => {
          tableHtml += '<tr>';
          r.forEach(cell => {
            tableHtml += `<td>${escapeHtml(cell)}</td>`;
          });
          tableHtml += '</tr>';
        });

        tableHtml += '</tbody></table></div>';
        return '\n' + tableHtml + '\n';
      });
    }

    parseCallouts(text) {
      // Handles > [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], or general > Quote
      const calloutRegex = /(?:^|\n)> ?(?:\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\])? ?([\s\S]*?)(?=\n\n|\n(?!>)|$)/gim;

      return text.replace(calloutRegex, (match, type, content) => {
        const cleanContent = content ? content.replace(/^>\s?/gm, '').trim() : '';
        const alertType = (type || 'NOTE').toUpperCase();

        let icon = 'fa-circle-info';
        let color = '#00f2ff';
        let label = 'NOTE';

        if (alertType === 'TIP') {
          icon = 'fa-lightbulb';
          color = '#ffd700';
          label = 'PRO TIP';
        } else if (alertType === 'IMPORTANT') {
          icon = 'fa-circle-exclamation';
          color = '#00ff66';
          label = 'CRITICAL ARCHITECTURE';
        } else if (alertType === 'WARNING') {
          icon = 'fa-triangle-exclamation';
          color = '#ff9900';
          label = 'SECURITY WARNING';
        }

        return `
          <div class="chronex-alert chronex-alert-${alertType.toLowerCase()}" style="border-left: 3px solid ${color}; background: rgba(15, 23, 42, 0.65); padding: 12px 14px; border-radius: 8px; margin: 12px 0;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; color: ${color}; text-transform: uppercase; margin-bottom: 5px;">
              <i class="fa-solid ${icon}"></i> <span>${label}</span>
            </div>
            <div style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">${escapeHtml(cleanContent)}</div>
          </div>
        `;
      });
    }

    parseLists(text) {
      // Unordered list items: wrap contiguous items in <ul>
      text = text.replace(/((?:^[ \t]*[-*]\s+.+(?:\n|$))+)/gm, (match) => {
        const items = match.trim().split(/\n/).map(i => {
          const itemText = i.replace(/^[ \t]*[-*]\s+/, '').trim();
          return `<li class="chronex-li"><i class="fa-solid fa-angle-right chronex-bullet-icon"></i> <span>${itemText}</span></li>`;
        }).join('');
        return `<ul class="chronex-ul">${items}</ul>`;
      });

      // Ordered list items: wrap contiguous items in <ol>
      text = text.replace(/((?:^[ \t]*\d+\.\s+.+(?:\n|$))+)/gm, (match) => {
        let counter = 1;
        const items = match.trim().split(/\n/).map(i => {
          const itemText = i.replace(/^[ \t]*\d+\.\s+/, '').trim();
          return `<li class="chronex-oli"><span class="chronex-num-badge">${counter++}</span> <span>${itemText}</span></li>`;
        }).join('');
        return `<ol class="chronex-ol">${items}</ol>`;
      });

      return text;
    }
  }


  // ===================================================================
  // 2. CHRONEXX NEURAL VOICE NOTE SYNTHESIS ENGINE
  // ===================================================================

  class ChronexxVoiceEngine {
    constructor() {
      this.synth = window.speechSynthesis || null;
      this.activeUtterance = null;
      this.activePlayerEl = null;
      this.timerInterval = null;
      this.elapsedSec = 0;
      this.playbackRate = 1.05;
      this.pitch = 1.02;
    }

    cleanTextForSpeech(rawText) {
      if (!rawText) return '';
      let clean = String(rawText);
      // Remove code blocks
      clean = clean.replace(/```[\s\S]*?```/g, ' [Code segment omitted] ');
      // Remove inline code
      clean = clean.replace(/`([^`]+)`/g, '$1');
      // Remove markdown links [text](url)
      clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      // Remove markdown headers and bullets
      clean = clean.replace(/^[#\-*>]+\s*/gm, '');
      // Remove markdown tables
      clean = clean.replace(/\|.+?\|/g, ' ');
      // Remove bold and italic
      clean = clean.replace(/[*_]{1,3}/g, '');
      // Normalize whitespace
      clean = clean.replace(/\s+/g, ' ').trim();
      return clean;
    }

    estimateDurationSeconds(text) {
      const words = text ? text.split(/\s+/).length : 0;
      // Normal speaking rate ~ 2.5 words per second
      return Math.max(3, Math.round(words / 2.5));
    }

    formatTime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    renderVoicePlayerBar(rawText) {
      const speechText = this.cleanTextForSpeech(rawText);
      if (!speechText || speechText.length < 5) return '';

      const durationSec = this.estimateDurationSeconds(speechText);
      const durationFormatted = this.formatTime(durationSec);

      return `
        <div class="chronex-voice-player-bar" data-speech="${escapeHtml(speechText)}" data-duration="${durationSec}">
          <button type="button" class="chronex-voice-play-btn" title="Listen to ChronEX AI Voice Note">
            <i class="fa-solid fa-play"></i>
          </button>
          <div class="chronex-voice-track">
            <div class="chronex-voice-waveform">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            <div class="chronex-voice-meta-row">
              <span class="voice-time-display">0:00 / ${durationFormatted}</span>
              <button type="button" class="voice-speed-chip" title="Playback Speed">1.0x</button>
            </div>
          </div>
          <div class="chronex-voice-core-pill">
            <span class="chronex-neural-dot"></span> NEURAL VOICE
          </div>
        </div>
      `;
    }

    togglePlay(playerBarEl) {
      if (!this.synth) {
        if (window.showNotif) window.showNotif('Speech synthesis not supported on this device', 'error');
        return;
      }

      const isCurrentPlayer = this.activePlayerEl === playerBarEl;

      if (isCurrentPlayer && this.synth.speaking) {
        if (this.synth.paused) {
          this.synth.resume();
          this.setPlayerPlayingState(playerBarEl, true);
        } else {
          this.synth.pause();
          this.setPlayerPlayingState(playerBarEl, false);
        }
        return;
      }

      // Stop any other active voice note
      this.stop();

      const speechText = playerBarEl.getAttribute('data-speech');
      const totalDuration = parseInt(playerBarEl.getAttribute('data-duration') || '10', 10);
      if (!speechText) return;

      this.activePlayerEl = playerBarEl;
      this.elapsedSec = 0;

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = this.playbackRate;
      utterance.pitch = this.pitch;

      // Select high quality voice if available
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Neural')) && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => {
        this.setPlayerPlayingState(playerBarEl, true);
        this.startTimer(playerBarEl, totalDuration);
      };

      utterance.onend = () => {
        this.stop();
      };

      utterance.onerror = () => {
        this.stop();
      };

      this.activeUtterance = utterance;
      this.synth.speak(utterance);
    }

    startTimer(playerBarEl, totalDuration) {
      clearInterval(this.timerInterval);
      const timerEl = playerBarEl.querySelector('.voice-time-display');

      this.timerInterval = setInterval(() => {
        this.elapsedSec += 1;
        if (timerEl) {
          timerEl.textContent = `${this.formatTime(this.elapsedSec)} / ${this.formatTime(totalDuration)}`;
        }
        if (this.elapsedSec >= totalDuration) {
          clearInterval(this.timerInterval);
        }
      }, 1000);
    }

    setPlayerPlayingState(playerBarEl, isPlaying) {
      if (!playerBarEl) return;
      const playBtn = playerBarEl.querySelector('.chronex-voice-play-btn');
      const waveform = playerBarEl.querySelector('.chronex-voice-waveform');

      if (playBtn) {
        playBtn.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
      }
      if (waveform) {
        waveform.classList.toggle('animating', isPlaying);
      }
    }

    cycleSpeed(playerBarEl) {
      const speeds = [1.0, 1.25, 1.5, 2.0];
      const speedBtn = playerBarEl.querySelector('.voice-speed-chip');
      const curIdx = speeds.indexOf(this.playbackRate);
      const nextIdx = (curIdx + 1) % speeds.length;
      this.playbackRate = speeds[nextIdx];

      if (speedBtn) {
        speedBtn.textContent = `${this.playbackRate.toFixed(1)}x`;
      }

      if (this.synth && this.synth.speaking) {
        const speechText = playerBarEl.getAttribute('data-speech');
        this.stop();
        this.togglePlay(playerBarEl);
      }
    }

    stop() {
      clearInterval(this.timerInterval);
      if (this.synth) {
        try { this.synth.cancel(); } catch (_) {}
      }
      if (this.activePlayerEl) {
        this.setPlayerPlayingState(this.activePlayerEl, false);
        const timerEl = this.activePlayerEl.querySelector('.voice-time-display');
        const totalDuration = parseInt(this.activePlayerEl.getAttribute('data-duration') || '10', 10);
        if (timerEl) {
          timerEl.textContent = `0:00 / ${this.formatTime(totalDuration)}`;
        }
        this.activePlayerEl = null;
      }
      this.activeUtterance = null;
      this.elapsedSec = 0;
    }
  }

  // Global Singletons
  window.ChronexxLayoutEngine = new ChronexxLayoutEngine();
  window.ChronexxVoiceEngine = new ChronexxVoiceEngine();

  // Global event delegation for Chronexx voice buttons
  document.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.chronex-voice-play-btn');
    if (playBtn) {
      e.stopPropagation();
      const playerBar = playBtn.closest('.chronex-voice-player-bar');
      if (playerBar && window.ChronexxVoiceEngine) {
        window.ChronexxVoiceEngine.togglePlay(playerBar);
      }
      return;
    }

    const speedBtn = e.target.closest('.voice-speed-chip');
    if (speedBtn) {
      e.stopPropagation();
      const playerBar = speedBtn.closest('.chronex-voice-player-bar');
      if (playerBar && window.ChronexxVoiceEngine) {
        window.ChronexxVoiceEngine.cycleSpeed(playerBar);
      }
    }
  });

})();
