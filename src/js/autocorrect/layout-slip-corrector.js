/**
 * NEXCHAT Multilingual Layout Slip Corrector
 * =====================================================================
 * Real-time bidirectional scancode transposition:
 * - QWERTY -> JCUKEN ('ghbdtn' -> 'привет', 'rfr ltkf' -> 'как дела')
 * - JCUKEN -> QWERTY ('руддщ' -> 'hello', 'цшер' -> 'wifi')
 * - Arabizi Numeral Transposition ('3alaikoum' -> 'alaykum', '7abibi' -> 'habibi')
 * 
 * STRICTLY ZERO UNICODE EMOJIS: Pure FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  const QWERTY_TO_JCUKEN = {
    'q':'й','w':'ц','e':'у','r':'к','t':'е','y':'н','u':'г','i':'ш','o':'щ','p':'з','[':'х',']':'ъ',
    'a':'ф','s':'ы','d':'в','f':'а','g':'п','h':'р','j':'о','k':'л','l':'д',';':'ж','\'':'э',
    'z':'я','x':'ч','c':'с','v':'м','b':'и','n':'т','m':'ь',',':'б','.':'ю',
    'Q':'Й','W':'Ц','E':'У','R':'К','T':'Е','Y':'Н','U':'Г','I':'Ш','O':'Щ','P':'З','{':'Х','}':'Ъ',
    'A':'Ф','S':'Ы','D':'В','F':'А','G':'П','H':'Р','J':'О','K':'Л','L':'Д',':':'Ж','"':'Э',
    'Z':'Я','X':'Ч','C':'С','V':'М','B':'И','N':'Т','M':'Ь','<':'Б','>':'Ю'
  };

  const JCUKEN_TO_QWERTY = Object.create(null);
  for (const [en, ru] of Object.entries(QWERTY_TO_JCUKEN)) {
    JCUKEN_TO_QWERTY[ru] = en;
  }

  const ARABIZI_NUM_MAP = {
    '2': 'a',
    '3': 'a',
    '5': 'kh',
    '6': 't',
    '7': 'h',
    '8': 'gh',
    '9': 's'
  };

  class LayoutSlipCorrector {
    constructor() {
      this.qwertyToJcuken = QWERTY_TO_JCUKEN;
      this.jcukenToQwerty = JCUKEN_TO_QWERTY;
      this.arabiziMap = ARABIZI_NUM_MAP;
    }

    /**
     * Detects layout mismatch and transposes to target language
     */
    correctSlip(token, trieEngine) {
      if (!token || typeof token !== 'string' || token.length < 2) return null;
      const clean = token.trim();

      // If trie exists and token is already a valid word in active lexicon, do not transpose
      if (trieEngine && trieEngine.hasWord(clean)) {
        return null;
      }

      // 1. QWERTY -> JCUKEN Cyrillic check
      if (/^[a-zA-Z[\];',.<>]+$/.test(clean)) {
        let ruCandidate = '';
        for (let i = 0; i < clean.length; i++) {
          ruCandidate += this.qwertyToJcuken[clean[i]] || clean[i];
        }
        if (trieEngine) {
          const match = trieEngine.lookup(ruCandidate.toLowerCase());
          if (match && match.lang === 'ru') {
            return {
              original: clean,
              corrected: ruCandidate,
              direction: 'qwerty_to_jcuken',
              targetLang: 'ru'
            };
          }
        }
      }

      // 2. JCUKEN -> QWERTY English/Tech check
      if (/^[\u0400-\u04FF]+$/i.test(clean)) {
        let enCandidate = '';
        for (let i = 0; i < clean.length; i++) {
          enCandidate += this.jcukenToQwerty[clean[i]] || clean[i];
        }
        if (trieEngine) {
          const match = trieEngine.lookup(enCandidate.toLowerCase());
          if (match && (match.lang === 'en' || match.lang === 'tech')) {
            return {
              original: clean,
              corrected: enCandidate,
              direction: 'jcuken_to_qwerty',
              targetLang: match.lang
            };
          }
        }
      }

      // 3. Arabizi numeral transcription (e.g. 3alaikoum -> alaykum, 7abibi -> habibi)
      if (/[2356789]/.test(clean)) {
        const normalized = clean.replace(/[2356789]/g, (digit) => this.arabiziMap[digit] || digit);
        if (trieEngine) {
          const match = trieEngine.lookup(normalized.toLowerCase());
          if (match && (match.lang === 'ar' || match.lang === 'arabic')) {
            return {
              original: clean,
              corrected: normalized,
              direction: 'arabizi_normalized',
              targetLang: 'ar'
            };
          }
        }
      }

      return null;
    }

    /**
     * Transposes string from QWERTY to JCUKEN unconditionally
     */
    toCyrillic(str) {
      if (!str) return '';
      let out = '';
      for (let i = 0; i < str.length; i++) {
        out += this.qwertyToJcuken[str[i]] || str[i];
      }
      return out;
    }

    /**
     * Transposes string from JCUKEN to QWERTY unconditionally
     */
    toLatin(str) {
      if (!str) return '';
      let out = '';
      for (let i = 0; i < str.length; i++) {
        out += this.jcukenToQwerty[str[i]] || str[i];
      }
      return out;
    }
  }

  const instance = new LayoutSlipCorrector();
  window.LayoutSlipCorrector = LayoutSlipCorrector;
  window.NexLayoutSlipCorrector = instance;
})(typeof window !== 'undefined' ? window : globalThis);
