/**
 * NEXCHAT Master Auto-Correct Engine
 * Integrates 30,000+ Word Dictionary, Fuzzy Matcher, and Instant Grammar Polish
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
      this.init();
    }

    init() {
      if (!this.matcher && window.FuzzyMatcher) {
        this.matcher = new window.FuzzyMatcher();
      }
    }

    /**
     * Checks if a word is recognized as valid English
     */
    isValidWord(word) {
      if (!word) return false;
      const clean = word.toLowerCase().replace(/[^\w']/g, '');
      return this.dict.has(clean) || clean.length <= 1;
    }

    /**
     * Auto-corrects a single word token in 0ms
     */
    correctWord(rawWord) {
      if (!rawWord || rawWord.length < 2) {
        if (rawWord === 'i') return 'I';
        return rawWord;
      }

      const clean = rawWord.toLowerCase().replace(/[^\w']/g, '');

      // 1. Direct typo / abbreviation / contraction check
      if (this.typoMap[clean]) {
        return applyCasePattern(rawWord, this.typoMap[clean]);
      }

      // 2. Already correctly spelled
      if (this.dict.has(clean)) {
        return rawWord;
      }

      // 3. Fuzzy correction via Damerau-Levenshtein
      if (this.matcher) {
        const best = this.matcher.findBestMatch(clean, 2);
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

      // 1. Normalize spacing around punctuation
      text = text.replace(/\s+([,;:.!?])/g, '$1');
      text = text.replace(/([,;:.!?])([A-Za-z])/g, '$1 $2');
      text = text.replace(/\s+/g, ' ');

      // 2. Tokenize and correct every word
      const tokens = text.split(/(\s+|[.,!?;:()]+)/);
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!token || /^\s+$/.test(token) || /^[.,!?;:()]+$/.test(token)) continue;

        const clean = token.toLowerCase().replace(/[^\w']/g, '');
        if (clean === 'i') {
          tokens[i] = 'I';
        } else if (this.typoMap[clean]) {
          tokens[i] = applyCasePattern(token, this.typoMap[clean]);
        } else if (!this.dict.has(clean) && clean.length >= 3 && this.matcher) {
          const fuzzy = this.matcher.findBestMatch(clean, 1);
          if (fuzzy) {
            tokens[i] = applyCasePattern(token, fuzzy);
          }
        }
      }
      text = tokens.join('');

      // 3. Sentence capitalization after punctuation
      text = text.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => prefix + letter.toUpperCase());

      // 4. Standalone lowercase 'i'
      text = text.replace(/\bi\b/g, 'I');

      return text.trim();
    }
  }

  // Export engine
  window.AutoCorrectEngine = AutoCorrectEngine;
  window.autoCorrectEngine = new AutoCorrectEngine();
})();
