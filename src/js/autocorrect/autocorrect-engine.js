/**
 * NEXCHAT Master Auto-Correct Engine
 * Multi-Tier Pipeline:
 * 1. Personal Vocabulary Whitelist (Never flags contact names)
 * 2. Contextual N-Gram Disambiguation ('your welcome' -> "you're welcome", 'me to' -> 'me too')
 * 3. 30,000+ Word Lexicon & 3,500+ Typo/Contraction Map (O(1))
 * 4. QWERTY Spatial Adjacency Matrix (Fat-Finger Correction)
 * 5. Character De-Elongation ('pleaaase' -> 'please')
 * 6. Phonetic Soundex Matching ('fon' -> 'phone', 'enuf' -> 'enough')
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

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

  class AutoCorrectEngine {
    constructor() {
      this.dict = window.WORDS_SET_30K || new Set();
      this.typoMap = window.TYPO_MAP_30K || {};
      this.matcher = window.fuzzyMatcher || null;
      this.ngram = window.ngramContextEngine || null;
      this.personal = window.personalVocabEngine || null;
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
    }

    /**
     * Checks if a word is recognized as valid English or Personal Name
     */
    isValidWord(word) {
      if (!word) return false;
      const clean = word.toLowerCase().replace(/[^\w']/g, '');
      if (this.personal && this.personal.hasWord(clean)) return true;
      if (clean.includes("'")) return true; // Contraction
      return this.dict.has(clean) || clean.length <= 1;
    }

    /**
     * Auto-corrects a single word token in 0ms with context awareness
     */
    correctWord(rawWord, prevWord = '', nextWord = '') {
      if (!rawWord || rawWord.length < 2) {
        if (rawWord === 'i') return 'I';
        return rawWord;
      }

      const clean = rawWord.toLowerCase().replace(/[^\w']/g, '');

      // 1. Check Personal Vocab whitelist (contacts, custom tags)
      if (this.personal && this.personal.hasWord(clean)) {
        return rawWord;
      }

      // 2. Check Contextual N-Gram disambiguation (e.g. 'your welcome' -> "you're welcome", 'me to' -> "me too")
      if (this.ngram) {
        const contextual = this.ngram.disambiguate(rawWord, prevWord, nextWord);
        if (contextual && contextual !== rawWord) {
          return contextual;
        }
      }

      // 3. Direct typo / abbreviation / contraction check (O(1))
      if (this.typoMap[clean]) {
        return applyCasePattern(rawWord, this.typoMap[clean]);
      }

      // 4. Contractions with apostrophe or already correctly spelled in 30k dictionary
      if (clean.includes("'") || this.dict.has(clean)) {
        return rawWord;
      }

      // 5. Advanced QWERTY & Phonetic fuzzy correction
      if (this.matcher) {
        const best = this.matcher.findBestMatch(clean, 1.8);
        if (best && best !== clean) {
          return applyCasePattern(rawWord, best);
        }
      }

      return rawWord;
    }

    /**
     * Instant 0ms Full Draft Neural Grammar & Typo Synthesizer
     */
    instantPolish(rawText) {
      if (!rawText || !rawText.trim()) return rawText;
      let text = rawText;

      // Phase 1: Normalize spacing around punctuation first so tokens separate cleanly
      text = text.replace(/\s+([,;:.!?])/g, '$1');
      text = text.replace(/([,;:.!?])([A-Za-z])/g, '$1 $2');
      text = text.replace(/\s+/g, ' ');

      // Phase 2: Contextual N-Gram Disambiguation
      if (this.ngram) {
        text = this.ngram.polishContext(text);
      }

      // Phase 3: Tokenize and auto-correct every word
      const tokens = text.split(/(\s+|[.,!?;:()]+)/);
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!token || /^\s+$/.test(token) || /^[.,!?;:()]+$/.test(token)) continue;

        const clean = token.toLowerCase().replace(/[^\w']/g, '');
        if (clean === 'i') {
          tokens[i] = 'I';
        } else if (clean.includes("'")) {
          // Already formatted contraction (e.g. you're, it's, don't)
          continue;
        } else if (this.personal && this.personal.hasWord(clean)) {
          // Whitelisted personal word
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

      // Phase 4: Sentence capitalization after sentence terminal
      text = text.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => prefix + letter.toUpperCase());

      // Phase 5: Capitalize standalone 'I'
      text = text.replace(/\bi\b/g, 'I');

      return text.trim();
    }
  }

  // Export engine
  window.AutoCorrectEngine = AutoCorrectEngine;
  window.autoCorrectEngine = new AutoCorrectEngine();
})();
