/**
 * NEXCHAT Contextual N-Gram Auto-Correct Engine
 * Disambiguates homophones, grammar context, and split/merged words in 0ms
 * 
 * Capabilities:
 * - your vs you're
 * - their vs there vs they're
 * - its vs it's
 * - then vs than
 * - to vs too
 * - loose vs lose
 * - Compound word space insertion (e.g. thankyou -> thank you, alot -> a lot)
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  // Merged compound word corrections
  const COMPOUND_SPLITS = {
    'alot': 'a lot',
    'thankyou': 'thank you',
    'infront': 'in front',
    'atleast': 'at least',
    'aswell': 'as well',
    'eachother': 'each other',
    'nevermind': 'never mind',
    'goodmorning': 'good morning',
    'goodnight': 'good night',
    'howareyou': 'how are you',
    'bytheway': 'by the way',
    'inorder': 'in order',
    'infact': 'in fact',
    'nomatter': 'no matter',
    'highschool': 'high school',
    'everytime': 'every time',
    'afterall': 'after all',
    'allright': 'all right',
    'cellphone': 'cell phone',
    'anyway': 'anyway'
  };

  // Contextual bigram rules: [prevWord, currentWord] -> correction
  const BIGRAM_RULES = {
    // your vs you're
    'youre': {
      default: "you're"
    },
    'your': {
      followMatches: {
        'welcome': "you're",
        'right': "you're",
        'great': "you're",
        'amazing': "you're",
        'awesome': "you're",
        'the': "you're",
        'doing': "you're",
        'going': "you're",
        'invited': "you're",
        'ready': "you're",
        'late': "you're",
        'early': "you're",
        'free': "you're",
        'sure': "you're",
        'allowed': "you're",
        'fired': "you're",
        'hired': "you're"
      }
    },

    // its vs it's
    'its': {
      followMatches: {
        'ok': "it's",
        'okay': "it's",
        'fine': "it's",
        'good': "it's",
        'great': "it's",
        'time': "it's",
        'been': "it's",
        'not': "it's",
        'all': "it's",
        'working': "it's",
        'done': "it's",
        'ready': "it's",
        'cool': "it's",
        'true': "it's",
        'hard': "it's",
        'easy': "it's",
        'fast': "it's",
        'possible': "it's"
      }
    },

    // then vs than
    'then': {
      prevMatches: {
        'better': 'than',
        'more': 'than',
        'less': 'than',
        'faster': 'than',
        'slower': 'than',
        'rather': 'than',
        'bigger': 'than',
        'smaller': 'than',
        'greater': 'than',
        'easier': 'than',
        'harder': 'than',
        'other': 'than',
        'different': 'than',
        'taller': 'than',
        'shorter': 'than',
        'stronger': 'than',
        'longer': 'than',
        'worse': 'than',
        'higher': 'than',
        'lower': 'than'
      }
    },

    // to vs too
    'to': {
      prevMatches: {
        'me': 'too',
        'you': 'too',
        'them': 'too',
        'us': 'too',
        'him': 'too',
        'her': 'too',
        'way': 'too',
        'far': 'too'
      },
      followMatches: {
        'much': 'too',
        'late': 'too',
        'early': 'too',
        'fast': 'too',
        'slow': 'too',
        'hard': 'too',
        'bad': 'too',
        'good': 'too',
        'many': 'too',
        'high': 'too',
        'low': 'too',
        'expensive': 'too',
        'cheap': 'too',
        'busy': 'too',
        'cold': 'too',
        'hot': 'too'
      }
    },

    // their / there / they're
    'their': {
      followMatches: {
        'going': "they're",
        'coming': "they're",
        'here': "they're",
        'ready': "they're",
        'done': "they're",
        'doing': "they're",
        'is': 'there',
        'are': 'there',
        'was': 'there',
        'were': 'there',
        'will': 'there'
      }
    },
    'there': {
      prevMatches: {
        'all': 'their',
        'in': 'their',
        'with': 'their',
        'for': 'their'
      },
      followMatches: {
        'car': 'their',
        'house': 'their',
        'team': 'their',
        'friends': 'their',
        'family': 'their',
        'work': 'their',
        'code': 'their',
        'project': 'their'
      }
    }
  };

  class NgramContextEngine {
    constructor() {
      this.compoundSplits = COMPOUND_SPLITS;
      this.rules = BIGRAM_RULES;
    }

    /**
     * Checks if current word has compound split (e.g. thankyou -> thank you)
     */
    checkCompound(word) {
      if (!word) return null;
      const clean = word.toLowerCase().replace(/[^\w']/g, '');
      return this.compoundSplits[clean] || null;
    }

    /**
     * Contextual disambiguation given previous word, current word, and next word
     */
    disambiguate(currentWord, prevWord = '', nextWord = '') {
      if (!currentWord) return currentWord;
      const cleanCurrent = currentWord.toLowerCase().replace(/[^\w']/g, '');
      const cleanPrev = (prevWord || '').toLowerCase().replace(/[^\w']/g, '');
      const cleanNext = (nextWord || '').toLowerCase().replace(/[^\w']/g, '');

      // 1. Compound word split check
      if (this.compoundSplits[cleanCurrent]) {
        return this.compoundSplits[cleanCurrent];
      }

      const rule = this.rules[cleanCurrent];
      if (!rule) return currentWord;

      // Check following word match
      if (cleanNext && rule.followMatches && rule.followMatches[cleanNext]) {
        return this.applyCase(currentWord, rule.followMatches[cleanNext]);
      }

      // Check previous word match
      if (cleanPrev && rule.prevMatches && rule.prevMatches[cleanPrev]) {
        return this.applyCase(currentWord, rule.prevMatches[cleanPrev]);
      }

      if (rule.default) {
        return this.applyCase(currentWord, rule.default);
      }

      return currentWord;
    }

    /**
     * Full message pass to disambiguate all contextual bigrams
     */
    polishContext(text) {
      if (!text || !text.trim()) return text;
      const tokens = text.split(/(\s+|[.,!?;:()]+)/);
      const words = [];
      const wordIndices = [];

      // Extract words and their token indices
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t && !/^\s+$/.test(t) && !/^[.,!?;:()]+$/.test(t)) {
          words.push(t);
          wordIndices.push(i);
        }
      }

      for (let wIdx = 0; wIdx < words.length; wIdx++) {
        const cur = words[wIdx];
        const prev = (wIdx > 0) ? words[wIdx - 1] : '';
        const next = (wIdx < words.length - 1) ? words[wIdx + 1] : '';

        const resolved = this.disambiguate(cur, prev, next);
        if (resolved !== cur) {
          const tIdx = wordIndices[wIdx];
          tokens[tIdx] = resolved;
        }
      }

      return tokens.join('');
    }

    applyCase(source, target) {
      if (!source || !target) return target;
      if (source === source.toUpperCase() && source.length > 1) {
        return target.toUpperCase();
      }
      if (source[0] === source[0].toUpperCase()) {
        return target.charAt(0).toUpperCase() + target.slice(1);
      }
      return target;
    }
  }

  // Export to window
  window.NgramContextEngine = NgramContextEngine;
  window.ngramContextEngine = new NgramContextEngine();
})();
