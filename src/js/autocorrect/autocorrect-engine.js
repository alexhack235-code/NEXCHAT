/**
 * NEXCHAT Multilingual Master Auto-Correct Engine
 * 
 * Capabilities:
 * 1. Personal Vocabulary Whitelist (Never flags contact names, handles, custom terms)
 * 2. Dynamic Sub-Directory Activation:
 *    - Nigerian Pidgin (Naija Pidgin) sub-directory with slang, contractions & typo mapping
 *    - Russian (Русский) Cyrillic sub-directory with JCUKEN keyboard adjacency & typo mapping
 *    - Multilingual European sub-directories (Spanish, French, Portuguese, German)
 * 3. 30,000+ Word Lexicon & 3,500+ Typo/Contraction Map (English)
 * 4. Contextual N-Gram Disambiguation ('your welcome' -> "you're welcome", 'me to' -> 'me too')
 * 5. QWERTY & JCUKEN Spatial Adjacency Matrix (Fat-Finger Correction)
 * 6. Character De-Elongation ('pleaaase' -> 'please', 'щааас' -> 'сейчас')
 * 7. Instant 0ms Neural Grammar & Multilingual Synthesizer (instantPolish)
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  /**
   * Applies the casing of the source token onto the target replacement
   */
  function applyCasePattern(source, target) {
    if (!source || !target) return target;
    if (source === source.toUpperCase() && source.length > 1) {
      return target.toUpperCase();
    }
    if (source[0] === source[0].toUpperCase()) {
      return target.charAt(0).toUpperCase() + target.slice(1);
    }
    return target;
  }

  /**
   * Cleans a token preserving Unicode letters (Latin, Cyrillic, accented) + digits + apostrophe
   */
  function cleanToken(word) {
    if (!word) return '';
    try {
      return word.replace(/[^\p{L}\p{N}'-]/gu, '').toLowerCase();
    } catch (_) {
      return word.replace(/[^\w'\u00C0-\u024F\u0400-\u04FF-]/g, '').toLowerCase();
    }
  }

  class AutoCorrectEngine {
    constructor() {
      this.dict = window.WORDS_SET_30K || new Set();
      this.typoMap = window.TYPO_MAP_30K || {};
      this.matcher = window.fuzzyMatcher || null;
      this.ngram = window.ngramContextEngine || null;
      this.personal = window.personalVocabEngine || null;

      // Sub-directories
      this.pidginSubDir = window.PIDGIN_SUBDIRECTORY || null;
      this.ruSubDir = window.RU_SUBDIRECTORY || null;
      this.multiSuite = window.MULTILINGUAL_SUITE || null;

      // Active languages registry
      this.activeSubdirectories = new Set(['en']);
      this.currentPrimaryLanguage = 'en';

      this.init();
    }

    init() {
      if (!this.matcher && window.FuzzyMatcher) {
        this.matcher = new window.FuzzyMatcher();
      }
      if (!this.ngram && window.NgramContextEngine) {
        this.ngram = new window.NgramContextEngine();
      }
      if (!this.personal && window.PersonalVocabEngine) {
        this.personal = new window.PersonalVocabEngine();
      }
      if (!this.pidginSubDir && window.PIDGIN_SUBDIRECTORY) {
        this.pidginSubDir = window.PIDGIN_SUBDIRECTORY;
      }
      if (!this.ruSubDir && window.RU_SUBDIRECTORY) {
        this.ruSubDir = window.RU_SUBDIRECTORY;
      }
      if (!this.multiSuite && window.MULTILINGUAL_SUITE) {
        this.multiSuite = window.MULTILINGUAL_SUITE;
      }
    }

    /**
     * Activates a specific language sub-directory
     * Example: this.activateSubdirectory('pidgin')
     */
    activateSubdirectory(langKey, triggerSource = 'auto-detect') {
      if (!langKey) return;
      const wasActive = this.activeSubdirectories.has(langKey);
      this.activeSubdirectories.add(langKey);
      this.currentPrimaryLanguage = langKey;

      if (langKey === 'pidgin' && this.pidginSubDir) {
        this.pidginSubDir.activate();
      } else if (langKey === 'ru' && this.ruSubDir) {
        this.ruSubDir.activate();
      }

      if (!wasActive) {
        this.dispatchLanguageEvent(langKey, triggerSource);
      }
    }

    /**
     * Deactivates a specific language sub-directory
     */
    deactivateSubdirectory(langKey) {
      if (!langKey || langKey === 'en') return;
      this.activeSubdirectories.delete(langKey);

      if (langKey === 'pidgin' && this.pidginSubDir) {
        this.pidginSubDir.deactivate();
      } else if (langKey === 'ru' && this.ruSubDir) {
        this.ruSubDir.deactivate();
      }

      if (this.currentPrimaryLanguage === langKey) {
        this.currentPrimaryLanguage = 'en';
      }
      this.dispatchLanguageEvent('en', 'deactivate');
    }

    /**
     * Checks if a sub-directory is currently active
     */
    isSubdirectoryActive(langKey) {
      return this.activeSubdirectories.has(langKey);
    }

    /**
     * Gets the currently active primary language metadata
     */
    getActiveLanguage() {
      const code = this.currentPrimaryLanguage;
      switch (code) {
        case 'pidgin':
          return { code: 'pidgin', name: 'Nigerian Pidgin', badge: 'Naija Pidgin' };
        case 'ru':
          return { code: 'ru', name: 'Russian', badge: 'Русский' };
        case 'es':
          return { code: 'es', name: 'Spanish', badge: 'Español' };
        case 'fr':
          return { code: 'fr', name: 'French', badge: 'Français' };
        case 'pt':
          return { code: 'pt', name: 'Portuguese', badge: 'Português' };
        case 'de':
          return { code: 'de', name: 'German', badge: 'Deutsch' };
        default:
          return { code: 'en', name: 'English', badge: 'English' };
      }
    }

    /**
     * Emits a custom window event when language changes
     */
    dispatchLanguageEvent(langKey, triggerSource) {
      if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
      if (typeof CustomEvent !== 'function') return;
      const meta = this.getActiveLanguage();
      const event = new CustomEvent('nexchat:autocorrect:lang-change', {
        detail: { langKey, meta, triggerSource }
      });
      window.dispatchEvent(event);
    }

    /**
     * Detects language context dynamically from text and active token
     */
    detectLanguage(text, activeWord = '') {
      const sample = ((text || '') + ' ' + (activeWord || '')).trim();
      if (!sample) return this.currentPrimaryLanguage || 'en';

      // 1. Cyrillic script check -> Russian
      if (/[\u0400-\u04FF]/.test(sample)) {
        this.activateSubdirectory('ru', 'cyrillic-script');
        return 'ru';
      }

      // 2. Nigerian Pidgin detection
      // Check if text or token contains Nigerian Pidgin markers or typo triggers
      if (this.pidginSubDir && this.pidginSubDir.detect(sample)) {
        this.activateSubdirectory('pidgin', 'pidgin-marker');
        return 'pidgin';
      }

      // 3. Multilingual suite (Spanish, French, Portuguese, German)
      if (this.multiSuite) {
        const detectedMulti = this.multiSuite.detect(sample);
        if (detectedMulti) {
          this.activateSubdirectory(detectedMulti, 'multilingual-marker');
          return detectedMulti;
        }
      }

      return 'en';
    }

    /**
     * Checks if a word is recognized as valid in any active sub-directory
     */
    isValidWord(word) {
      if (!word) return false;
      const clean = cleanToken(word);

      // Whitelist personal vocabulary
      if (this.personal && this.personal.hasWord(clean)) return true;

      // Russian sub-directory
      if (/[\u0400-\u04FF]/.test(clean)) {
        return this.ruSubDir ? this.ruSubDir.hasWord(clean) : true;
      }

      // Nigerian Pidgin sub-directory
      if (this.isSubdirectoryActive('pidgin') && this.pidginSubDir && this.pidginSubDir.hasWord(clean)) {
        return true;
      }

      // Multilingual suite
      if (this.multiSuite && this.multiSuite.hasWord(clean)) {
        return true;
      }

      // English Contraction with apostrophe
      if (clean.includes("'")) return true;

      // English 30k Master Dictionary
      return this.dict.has(clean) || clean.length <= 1;
    }

    /**
     * Auto-corrects a single word token in 0ms with multilingual sub-directory awareness
     */
    correctWord(rawWord, prevWord = '', nextWord = '') {
      if (!rawWord || rawWord.length < 2) {
        if (rawWord === 'i' && !this.isSubdirectoryActive('ru')) return 'I';
        return rawWord;
      }

      const clean = cleanToken(rawWord);
      if (!clean) return rawWord;

      // 1. Personal Vocab whitelist (contacts, custom tags)
      if (this.personal && this.personal.hasWord(clean)) {
        return rawWord;
      }

      // -------------------------------------------------------------
      // SUB-DIRECTORY 1: RUSSIAN CYRILLIC
      // -------------------------------------------------------------
      if (/[\u0400-\u04FF]/.test(clean)) {
        this.activateSubdirectory('ru', 'cyrillic-token');

        if (this.ruSubDir) {
          // Direct typo resolution (O(1))
          const ruFixed = this.ruSubDir.correctWord(clean);
          if (ruFixed) {
            return applyCasePattern(rawWord, ruFixed);
          }

          // Already correctly spelled Russian word
          if (this.ruSubDir.hasWord(clean)) {
            return rawWord;
          }

          // Russian JCUKEN Cyrillic fuzzy matching
          const ruFuzzy = this.ruSubDir.findFuzzyMatch(clean, 1.5);
          if (ruFuzzy && ruFuzzy !== clean) {
            return applyCasePattern(rawWord, ruFuzzy);
          }
        }
        return rawWord;
      }

      // -------------------------------------------------------------
      // SUB-DIRECTORY 2: NIGERIAN PIDGIN (NAIJA PIDGIN)
      // -------------------------------------------------------------
      // 2a. Check if the token is a known Pidgin typo / contraction
      if (this.pidginSubDir && window.PIDGIN_TYPO_MAP && window.PIDGIN_TYPO_MAP[clean]) {
        // Automatically activate Pidgin sub-directory upon Pidgin typo detection!
        this.activateSubdirectory('pidgin', 'pidgin-typo-trigger');
        return applyCasePattern(rawWord, window.PIDGIN_TYPO_MAP[clean]);
      }

      // 2b. Check if Pidgin context is active or triggered by previous word
      const isPidginContext = this.isSubdirectoryActive('pidgin') ||
        (this.pidginSubDir && this.pidginSubDir.detect((prevWord + ' ' + rawWord).trim()));

      if (isPidginContext) {
        this.activateSubdirectory('pidgin', 'pidgin-context');

        // If it's a valid Pidgin word (e.g. 'dey', 'wetin', 'abeg', 'sabi', 'chop', 'sef', 'oya', 'pikin', 'na so'),
        // PRESERVE IT and DO NOT allow English auto-correct to overwrite it with 'day', 'waiting', etc.!
        if (this.pidginSubDir && this.pidginSubDir.hasWord(clean)) {
          return rawWord;
        }
      }

      // -------------------------------------------------------------
      // SUB-DIRECTORY 3: MULTILINGUAL SUITE (ES, FR, PT, DE)
      // -------------------------------------------------------------
      if (this.multiSuite) {
        const multiFixed = this.multiSuite.correctWord(clean);
        if (multiFixed) {
          const detectedLang = this.multiSuite.detect(clean) || 'multilingual';
          this.activateSubdirectory(detectedLang, 'multi-typo');
          return applyCasePattern(rawWord, multiFixed);
        }

        if (this.multiSuite.hasWord(clean)) {
          return rawWord;
        }
      }

      // -------------------------------------------------------------
      // SUB-DIRECTORY 4: ENGLISH 30,000+ LEXICON & CONTEXTUAL N-GRAM
      // -------------------------------------------------------------
      // Check Contextual N-Gram disambiguation (e.g. 'your welcome' -> "you're welcome", 'me to' -> "me too")
      if (this.ngram) {
        const contextual = this.ngram.disambiguate(rawWord, prevWord, nextWord);
        if (contextual && contextual !== rawWord) {
          return contextual;
        }
      }

      // Direct English typo / abbreviation / contraction check (O(1))
      if (this.typoMap[clean]) {
        return applyCasePattern(rawWord, this.typoMap[clean]);
      }

      // Contractions with apostrophe or correctly spelled in 30k dictionary
      if (clean.includes("'") || this.dict.has(clean)) {
        return rawWord;
      }

      // QWERTY & Phonetic fuzzy correction
      if (this.matcher) {
        const best = this.matcher.findBestMatch(clean, 1.8);
        if (best && best !== clean) {
          return applyCasePattern(rawWord, best);
        }
      }

      return rawWord;
    }

    /**
     * Instant 0ms Full Draft Multilingual Grammar & Typo Synthesizer
     */
    instantPolish(rawText) {
      if (!rawText || !rawText.trim()) return rawText;
      let text = rawText;

      // Detect overall language context
      const detectedLang = this.detectLanguage(text);

      // Phase 1: Normalize spacing around punctuation
      text = text.replace(/\s+([,;:.!?])/g, '$1');
      text = text.replace(/([,;:.!?])([A-Za-z\u0400-\u04FF])/g, '$1 $2');
      text = text.replace(/\s+/g, ' ');

      // Phase 2: Contextual N-Gram Disambiguation (Latin/English mode)
      if (detectedLang !== 'ru' && this.ngram) {
        text = this.ngram.polishContext(text);
      }

      // Phase 3: Tokenize and auto-correct every word token
      const tokens = text.split(/(\s+|[.,!?;:()]+)/);
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!token || /^\s+$/.test(token) || /^[.,!?;:()]+$/.test(token)) continue;

        const clean = cleanToken(token);
        if (!clean) continue;

        // Cyrillic (Russian) token
        if (/[\u0400-\u04FF]/.test(clean)) {
          if (this.ruSubDir) {
            const ruFixed = this.ruSubDir.correctWord(clean);
            if (ruFixed) {
              tokens[i] = applyCasePattern(token, ruFixed);
              continue;
            }
          }
          continue;
        }

        // Nigerian Pidgin token
        if (this.pidginSubDir && window.PIDGIN_TYPO_MAP && window.PIDGIN_TYPO_MAP[clean]) {
          tokens[i] = applyCasePattern(token, window.PIDGIN_TYPO_MAP[clean]);
          continue;
        }

        if (this.isSubdirectoryActive('pidgin') && this.pidginSubDir && this.pidginSubDir.hasWord(clean)) {
          continue; // Valid Pidgin word, keep as is
        }

        // Multilingual token
        if (this.multiSuite) {
          const multiFixed = this.multiSuite.correctWord(clean);
          if (multiFixed) {
            tokens[i] = applyCasePattern(token, multiFixed);
            continue;
          }
        }

        // English token
        if (clean === 'i' && detectedLang !== 'ru') {
          tokens[i] = 'I';
        } else if (clean.includes("'")) {
          continue;
        } else if (this.personal && this.personal.hasWord(clean)) {
          continue;
        } else if (this.typoMap[clean]) {
          tokens[i] = applyCasePattern(token, this.typoMap[clean]);
        } else if (!this.dict.has(clean) && clean.length >= 3 && this.matcher) {
          const fuzzy = this.matcher.findBestMatch(clean, 1.6);
          if (fuzzy) {
            tokens[i] = applyCasePattern(token, fuzzy);
          }
        }
      }
      text = tokens.join('');

      // Phase 4: Sentence capitalization across Latin and Cyrillic
      text = text.replace(/(^|[.!?]\s+)([a-z\u0430-\u044f])/g, (match, prefix, letter) => prefix + letter.toUpperCase());

      // Phase 5: Capitalize standalone 'I' in Latin contexts
      if (detectedLang !== 'ru') {
        text = text.replace(/\bi\b/g, 'I');
      }

      return text.trim();
    }
  }

  // Export engine
  window.AutoCorrectEngine = AutoCorrectEngine;
  window.autoCorrectEngine = new AutoCorrectEngine();
})();
