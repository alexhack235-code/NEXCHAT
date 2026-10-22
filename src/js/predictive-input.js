/**
 * NEXCHAT Predictive Text & Smart Auto-Correct Engine
 * 
 * Capabilities:
 * - Next-word bigram and prefix prediction
 * - Instant typo auto-correction chips (e.g. teh -> the, recieve -> receive)
 * - ChronEX AI Grammar & Polish synthesizer integration
 * - Mobile keyboard native suggestion bridge
 */

(function () {
  'use strict';

  // Common typo correction dictionary (fast local lookup)
  const TYPO_MAP = {
    'teh': 'the',
    'reciev': 'receive',
    'recieve': 'receive',
    'recieved': 'received',
    'recieving': 'receiving',
    'definately': 'definitely',
    'seperate': 'separate',
    'untill': 'until',
    'tommorow': 'tomorrow',
    'tomorow': 'tomorrow',
    'alot': 'a lot',
    'becuase': 'because',
    'becasue': 'because',
    'truely': 'truly',
    'wierd': 'weird',
    'goverment': 'government',
    'occurance': 'occurrence',
    'accomodate': 'accommodate',
    'beleive': 'believe',
    'belive': 'believe',
    'calender': 'calendar',
    'collogue': 'colleague',
    'freind': 'friend',
    'neccessary': 'necessary',
    'priviledge': 'privilege',
    'reccomend': 'recommend',
    'scheduele': 'schedule',
    'succesful': 'successful',
    'suprise': 'surprise',
    'thier': 'their',
    'writting': 'writing',
    'dont': "don't",
    'cant': "can't",
    'wont': "won't",
    'isnt': "isn't",
    'arent': "aren't",
    'wasnt': "wasn't",
    'werent': "weren't",
    'didnt': "didn't",
    'doesnt': "doesn't",
    'havent': "haven't",
    'hasnt': "hasn't",
    'hadnt': "hadn't",
    'couldnt': "couldn't",
    'shouldnt': "shouldn't",
    'wouldnt': "wouldn't",
    'im': "I'm",
    'ive': "I've",
    'id': "I'd",
    'ill': "I'll",
    'youre': "you're",
    'theyre': "they're",
    'weve': "we've",
    'whats': "what's",
    'thats': "that's",
    'theres': "there's",
    'heres': "here's",
    'plz': 'please',
    'pls': 'please',
    'thx': 'thanks',
    'ty': 'thank you',
    'np': 'no problem',
    'u': 'you',
    'ur': 'your',
    'r': 'are',
    'b4': 'before',
    'gr8': 'great',
    'l8r': 'later',
    'omw': 'on my way',
    'idk': "I don't know",
    'imo': 'in my opinion',
    'tbh': 'to be honest',
    'afk': 'away from keyboard',
    'gg': 'good game',
    'brb': 'be right back'
  };

  // Common word completion dictionary (prefix tree / candidates)
  const COMMON_WORDS = [
    'about', 'above', 'acknowledge', 'action', 'actually', 'address', 'after', 'again', 'against',
    'agree', 'almost', 'already', 'alright', 'always', 'amazing', 'another', 'answer', 'anyone',
    'anything', 'appreciate', 'around', 'available', 'awesome', 'because', 'before', 'behind',
    'believe', 'better', 'between', 'business', 'camera', 'cannot', 'certainly', 'change',
    'channel', 'character', 'chronex', 'completely', 'confirm', 'connection', 'continue',
    'conversation', 'correct', 'could', 'create', 'current', 'database', 'definitely',
    'deployed', 'details', 'different', 'direction', 'directly', 'document', 'download',
    'during', 'either', 'enough', 'especially', 'everyone', 'everything', 'excellent',
    'execute', 'expected', 'experience', 'favorite', 'feature', 'feedback', 'file', 'finally',
    'finish', 'follow', 'forward', 'friend', 'further', 'general', 'getting', 'great', 'group',
    'happen', 'hardware', 'having', 'header', 'hello', 'helpful', 'highest', 'history',
    'however', 'important', 'improve', 'information', 'inside', 'instead', 'interest',
    'interface', 'internet', 'keyboard', 'knowledge', 'latest', 'library', 'little', 'location',
    'looking', 'luxury', 'machine', 'making', 'manage', 'meaning', 'message', 'minutes',
    'mission', 'mobile', 'modify', 'morning', 'mostly', 'navigate', 'necessary', 'network',
    'nexchat', 'nothing', 'number', 'offline', 'online', 'operation', 'opinion', 'opportunity',
    'original', 'outside', 'package', 'partner', 'password', 'people', 'perfect', 'performance',
    'person', 'picture', 'platform', 'please', 'possible', 'practice', 'prepare', 'preview',
    'probably', 'problem', 'process', 'program', 'project', 'provide', 'quality', 'question',
    'quickly', 'reached', 'reading', 'receive', 'recently', 'recommend', 'record', 'release',
    'remember', 'replace', 'request', 'require', 'resolve', 'response', 'running', 'schedule',
    'screen', 'search', 'security', 'sending', 'separate', 'service', 'session', 'settings',
    'sharing', 'should', 'similar', 'simple', 'situation', 'software', 'solution', 'someone',
    'something', 'sometimes', 'standard', 'start', 'status', 'stickers', 'storage', 'stream',
    'strong', 'structure', 'student', 'success', 'suggest', 'support', 'surface', 'surprise',
    'system', 'tactical', 'talking', 'terminal', 'testing', 'thanks', 'together', 'tomorrow',
    'tonight', 'totally', 'towards', 'tracking', 'trouble', 'trying', 'understand', 'understood',
    'update', 'upload', 'usually', 'various', 'version', 'victory', 'viewing', 'virtual',
    'waiting', 'watching', 'welcome', 'whatever', 'whether', 'without', 'wonderful', 'working',
    'worry', 'writing', 'yesterday'
  ];

  // Common phrase & next-word pairings
  const BIGRAMS = {
    'how': ['are you', 'is it going', 'about', 'can I help'],
    'thank': ['you', 'you so much', 'you very much', 'god'],
    'thanks': ['for the update', 'a lot', 'for letting me know', 'man'],
    'let': ['me know', 'us know', 'me check', 'do this'],
    'sounds': ['good', 'great', 'awesome', 'like a plan'],
    'see': ['you tomorrow', 'you soon', 'you later', 'what happens'],
    'i': ['will', 'think', 'have', 'need', 'am', 'hope', 'agree', 'want'],
    'can': ['you', 'we', 'I', 'this be done', 'you check'],
    'could': ['you please', 'we check', 'you share', 'you explain'],
    'please': ['let me know', 'check this', 'send it over', 'confirm', 'update'],
    'good': ['morning', 'afternoon', 'evening', 'job', 'luck'],
    'no': ['problem', 'worries', 'way', 'rush'],
    'take': ['your time', 'care', 'a look', 'it easy'],
    'working': ['on it', 'well', 'fine', 'now'],
    'let\'s': ['do it', 'catch up', 'review', 'proceed'],
    'what': ['do you think', 'time', 'is the status', 'about']
  };

  class PredictiveInputEngine {
    constructor() {
      this.input = null;
      this.bar = null;
      this.chipsContainer = null;
      this.autocorrectBtn = null;
      this.activeCorrection = null;
      this.debounceTimer = null;
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.mount());
      } else {
        this.mount();
      }
    }

    mount() {
      this.input = document.getElementById('message-input');
      if (!this.input) return;

      // 1. Enable native phone keyboard autocomplete & autocorrect
      this.input.setAttribute('autocomplete', 'on');
      this.input.setAttribute('autocorrect', 'on');
      this.input.setAttribute('autocapitalize', 'sentences');
      this.input.setAttribute('spellcheck', 'true');

      // 2. Build or bind Predictive Word Bar
      let bar = document.getElementById('predictiveWordBar');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'predictiveWordBar';
        bar.className = 'predictive-word-bar';
        bar.style.display = 'none';

        bar.innerHTML = `
          <div class="predictive-chips-scroll" id="predictiveChipsScroll"></div>
          <button type="button" id="quickAutocorrectBtn" class="quick-autocorrect-btn" style="display: none;" title="Apply Instant Grammar & Spelling Fix">
            <i class="fa-solid fa-sparkles"></i> <span>Auto-Correct</span>
          </button>
        `;

        const form = document.getElementById('message-form');
        if (form && form.parentNode) {
          form.parentNode.insertBefore(bar, form);
        }
      }

      this.bar = bar;
      this.chipsContainer = document.getElementById('predictiveChipsScroll');
      this.autocorrectBtn = document.getElementById('quickAutocorrectBtn');

      if (this.autocorrectBtn) {
        this.autocorrectBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.applyAutoCorrection();
        });
      }

      // 3. Attach input listeners
      this.input.addEventListener('input', () => this.handleTyping());
      this.input.addEventListener('focus', () => this.handleTyping());
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          // Tab completes the first suggested word if available
          const firstChip = this.chipsContainer ? this.chipsContainer.querySelector('.predictive-chip') : null;
          if (firstChip && this.bar.style.display !== 'none') {
            e.preventDefault();
            firstChip.click();
          }
        }
      });

      // Hide suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#predictiveWordBar') && !e.target.closest('#message-input')) {
          if (this.bar) this.bar.style.display = 'none';
        }
      });
    }

    handleTyping() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.computePredictions(), 40);
    }

    computePredictions() {
      if (!this.input || !this.chipsContainer) return;
      const val = this.input.value;

      if (!val || !val.trim()) {
        this.bar.style.display = 'none';
        this.chipsContainer.innerHTML = '';
        if (this.autocorrectBtn) this.autocorrectBtn.style.display = 'none';
        return;
      }

      const cursorPos = (this.input.selectionStart !== null && this.input.selectionStart > 0) ? this.input.selectionStart : (this.input.selectionEnd || val.length);
      const textUpToCursor = val.slice(0, cursorPos);
      const endsWithSpace = /\s$/.test(textUpToCursor);

      let currentWord = '';
      let prevWord = '';

      if (endsWithSpace) {
        // User just pressed space: ready for next word, check previous word for typo
        currentWord = '';
        const tokens = textUpToCursor.trim().split(/\s+/);
        prevWord = tokens[tokens.length - 1] || '';
      } else {
        // User is actively typing a word
        const match = textUpToCursor.match(/(\S+)$/);
        currentWord = match ? match[1] : '';
        const beforeCurrent = textUpToCursor.slice(0, textUpToCursor.length - currentWord.length).trim();
        const tokens = beforeCurrent.split(/\s+/);
        prevWord = tokens[tokens.length - 1] || '';
      }

      const cleanWord = currentWord.replace(/[^\w']/g, '').toLowerCase();
      const cleanPrev = prevWord.replace(/[^\w']/g, '').toLowerCase();

      const suggestions = [];
      let detectedCorrection = null;

      // 1. Direct typo check on current active word or just-typed word
      const targetTypoWord = cleanWord || (endsWithSpace ? cleanPrev : '');
      if (targetTypoWord && TYPO_MAP[targetTypoWord]) {
        const fixed = TYPO_MAP[targetTypoWord];
        const rawTarget = cleanWord ? currentWord : prevWord;
        detectedCorrection = {
          original: rawTarget,
          replacement: fixed,
          fullText: val.replace(new RegExp(`\\b${rawTarget}\\b`), fixed)
        };
        suggestions.push({
          text: fixed,
          isCorrection: true,
          label: `Fix: ${fixed}`
        });
      }

      // 2. Prefix matching completions for current actively typed word
      if (cleanWord && cleanWord.length >= 2) {
        const matches = COMMON_WORDS.filter(w => w.startsWith(cleanWord) && w !== cleanWord).slice(0, 4);
        matches.forEach(m => {
          // Preserve case of typed prefix
          const formatted = (currentWord[0] === currentWord[0].toUpperCase()) ? (m.charAt(0).toUpperCase() + m.slice(1)) : m;
          if (!suggestions.some(s => s.text.toLowerCase() === formatted.toLowerCase())) {
            suggestions.push({ text: formatted, isCompletion: true });
          }
        });
      }

      // 3. Next-word Bigram predictions based on previous word
      const bigramKey = (cleanWord ? cleanWord : cleanPrev).toLowerCase();
      if (bigramKey && BIGRAMS[bigramKey]) {
        BIGRAMS[bigramKey].forEach(phrase => {
          if (!suggestions.some(s => s.text.toLowerCase() === phrase.toLowerCase())) {
            suggestions.push({ text: phrase, isBigram: true });
          }
        });
      }

      // 4. Fallback smart conversational prompts if single greeting
      if (suggestions.length === 0 && !prevWord && cleanWord.length >= 1) {
        const fallback = ['thanks', 'sounds good', 'let me check', 'understood'].filter(p => p.startsWith(cleanWord));
        fallback.forEach(f => suggestions.push({ text: f }));
      }

      // Render suggestions
      if (suggestions.length > 0 || detectedCorrection) {
        this.renderChips(suggestions, currentWord);
        this.bar.style.display = 'flex';

        if (detectedCorrection && this.autocorrectBtn) {
          this.activeCorrection = detectedCorrection;
          this.autocorrectBtn.style.display = 'inline-flex';
          this.autocorrectBtn.innerHTML = `<i class="fa-solid fa-sparkles"></i> <span>Fix to "${detectedCorrection.replacement}"</span>`;
        } else if (this.autocorrectBtn) {
          this.autocorrectBtn.style.display = 'none';
        }
      } else {
        this.bar.style.display = 'none';
      }
    }

    renderChips(suggestions, currentWord) {
      this.chipsContainer.innerHTML = '';
      suggestions.slice(0, 5).forEach(s => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `predictive-chip ${s.isCorrection ? 'is-correction' : ''}`;
        
        const icon = s.isCorrection ? '<i class="fa-solid fa-check text-[#00ff66]"></i> ' : (s.isBigram ? '<i class="fa-solid fa-arrow-turn-down text-[#38bdf8] text-[10px]"></i> ' : '');
        btn.innerHTML = `${icon}<span>${escapeText(s.text)}</span>`;

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.applySuggestion(s.text, currentWord);
        });

        this.chipsContainer.appendChild(btn);
      });
    }

    applySuggestion(replacementText, currentWord) {
      if (!this.input) return;
      const val = this.input.value;
      const cursorPos = this.input.selectionStart || val.length;

      let newText;
      let newCursor;

      if (currentWord && currentWord.trim().length > 0) {
        const start = cursorPos - currentWord.length;
        newText = val.slice(0, start) + replacementText + ' ' + val.slice(cursorPos);
        newCursor = start + replacementText.length + 1;
      } else {
        newText = val.slice(0, cursorPos) + (val.slice(0, cursorPos).endsWith(' ') ? '' : ' ') + replacementText + ' ' + val.slice(cursorPos);
        newCursor = newText.length;
      }

      this.input.value = newText;
      this.input.focus();
      this.input.setSelectionRange(newCursor, newCursor);

      // Trigger standard input event so auto-resize and listeners update
      this.input.dispatchEvent(new Event('input', { bubbles: true }));

      if (navigator.vibrate) navigator.vibrate(15);
      this.bar.style.display = 'none';
    }

    applyAutoCorrection() {
      if (!this.activeCorrection || !this.input) return;
      this.input.value = this.activeCorrection.fullText;
      this.input.focus();
      const pos = this.activeCorrection.fullText.length;
      this.input.setSelectionRange(pos, pos);
      this.input.dispatchEvent(new Event('input', { bubbles: true }));
      
      if (navigator.vibrate) navigator.vibrate(25);
      this.bar.style.display = 'none';
      if (this.autocorrectBtn) this.autocorrectBtn.style.display = 'none';
    }
  }

  function escapeText(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  // Export to global namespace
  window.predictiveInputEngine = new PredictiveInputEngine();
})();
