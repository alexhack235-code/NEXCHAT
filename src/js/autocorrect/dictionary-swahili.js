/**
 * NEXCHAT Multilingual Sub-Directory: Swahili (Kiswahili)
 * High-Speed O(1) Prefix-Indexed East African Lexicon
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const SW_WORDS = [
  "habari",
  "hujambo",
  "sijambo",
  "mambo",
  "poa",
  "asante",
  "karibu",
  "jambo",
  "kwaheri",
  "ndiyo",
  "hapana",
  "nzuri",
  "sawa",
  "tafadhali",
  "haraka",
  "pole",
  "rafiki",
  "kaka",
  "dada",
  "bwana",
  "mama",
  "leo",
  "kesho",
  "jana",
  "sasa",
  "baadaye",
  "kazi",
  "nyumbani",
  "pesa",
  "safari",
  "chakula",
  "maji",
  "chai",
  "kahawa",
  "simu",
  "ujumbe",
  "kitabu",
  "nini",
  "wapi",
  "lini",
  "kwanini",
  "nani",
  "ngapi",
  "kubwa",
  "ndogo",
  "nzuri",
  "mbaya"
];
  const SW_TYPO_MAP = {
  "hbr": "habari",
  "mmb": "mambo",
  "asnt": "asante",
  "krb": "karibu",
  "kwhr": "kwaheri",
  "tfd": "tafadhali",
  "ndio": "ndiyo",
  "asantesana": "asante sana"
};
  const SW_PREFIX_TABLE = {
  "ha": [
    "habari",
    "hapana",
    "haraka"
  ],
  "hab": [
    "habari"
  ],
  "haba": [
    "habari"
  ],
  "hu": [
    "hujambo"
  ],
  "huj": [
    "hujambo"
  ],
  "huja": [
    "hujambo"
  ],
  "si": [
    "sijambo",
    "simu"
  ],
  "sij": [
    "sijambo"
  ],
  "sija": [
    "sijambo"
  ],
  "ma": [
    "mambo",
    "mama",
    "maji"
  ],
  "mam": [
    "mambo",
    "mama"
  ],
  "mamb": [
    "mambo"
  ],
  "po": [
    "poa",
    "pole"
  ],
  "poa": [
    "poa"
  ],
  "as": [
    "asante"
  ],
  "asa": [
    "asante"
  ],
  "asan": [
    "asante"
  ],
  "ka": [
    "karibu",
    "kaka",
    "kazi",
    "kahawa"
  ],
  "kar": [
    "karibu"
  ],
  "kari": [
    "karibu"
  ],
  "ja": [
    "jambo",
    "jana"
  ],
  "jam": [
    "jambo"
  ],
  "jamb": [
    "jambo"
  ],
  "kw": [
    "kwaheri",
    "kwanini"
  ],
  "kwa": [
    "kwaheri",
    "kwanini"
  ],
  "kwah": [
    "kwaheri"
  ],
  "nd": [
    "ndiyo",
    "ndogo"
  ],
  "ndi": [
    "ndiyo"
  ],
  "ndiy": [
    "ndiyo"
  ],
  "hap": [
    "hapana"
  ],
  "hapa": [
    "hapana"
  ],
  "nz": [
    "nzuri"
  ],
  "nzu": [
    "nzuri"
  ],
  "nzur": [
    "nzuri"
  ],
  "sa": [
    "sawa",
    "sasa",
    "safari"
  ],
  "saw": [
    "sawa"
  ],
  "sawa": [
    "sawa"
  ],
  "ta": [
    "tafadhali"
  ],
  "taf": [
    "tafadhali"
  ],
  "tafa": [
    "tafadhali"
  ],
  "har": [
    "haraka"
  ],
  "hara": [
    "haraka"
  ],
  "pol": [
    "pole"
  ],
  "pole": [
    "pole"
  ],
  "ra": [
    "rafiki"
  ],
  "raf": [
    "rafiki"
  ],
  "rafi": [
    "rafiki"
  ],
  "kak": [
    "kaka"
  ],
  "kaka": [
    "kaka"
  ],
  "da": [
    "dada"
  ],
  "dad": [
    "dada"
  ],
  "dada": [
    "dada"
  ],
  "bw": [
    "bwana"
  ],
  "bwa": [
    "bwana"
  ],
  "bwan": [
    "bwana"
  ],
  "mama": [
    "mama"
  ],
  "le": [
    "leo"
  ],
  "leo": [
    "leo"
  ],
  "ke": [
    "kesho"
  ],
  "kes": [
    "kesho"
  ],
  "kesh": [
    "kesho"
  ],
  "jan": [
    "jana"
  ],
  "jana": [
    "jana"
  ],
  "sas": [
    "sasa"
  ],
  "sasa": [
    "sasa"
  ],
  "ba": [
    "baadaye"
  ],
  "baa": [
    "baadaye"
  ],
  "baad": [
    "baadaye"
  ],
  "kaz": [
    "kazi"
  ],
  "kazi": [
    "kazi"
  ],
  "ny": [
    "nyumbani"
  ],
  "nyu": [
    "nyumbani"
  ],
  "nyum": [
    "nyumbani"
  ],
  "pe": [
    "pesa"
  ],
  "pes": [
    "pesa"
  ],
  "pesa": [
    "pesa"
  ],
  "saf": [
    "safari"
  ],
  "safa": [
    "safari"
  ],
  "ch": [
    "chakula",
    "chai"
  ],
  "cha": [
    "chakula",
    "chai"
  ],
  "chak": [
    "chakula"
  ],
  "maj": [
    "maji"
  ],
  "maji": [
    "maji"
  ],
  "chai": [
    "chai"
  ],
  "kah": [
    "kahawa"
  ],
  "kaha": [
    "kahawa"
  ],
  "sim": [
    "simu"
  ],
  "simu": [
    "simu"
  ],
  "uj": [
    "ujumbe"
  ],
  "uju": [
    "ujumbe"
  ],
  "ujum": [
    "ujumbe"
  ],
  "ki": [
    "kitabu"
  ],
  "kit": [
    "kitabu"
  ],
  "kita": [
    "kitabu"
  ],
  "ni": [
    "nini"
  ],
  "nin": [
    "nini"
  ],
  "nini": [
    "nini"
  ],
  "wa": [
    "wapi"
  ],
  "wap": [
    "wapi"
  ],
  "wapi": [
    "wapi"
  ],
  "li": [
    "lini"
  ],
  "lin": [
    "lini"
  ],
  "lini": [
    "lini"
  ],
  "kwan": [
    "kwanini"
  ],
  "na": [
    "nani"
  ],
  "nan": [
    "nani"
  ],
  "nani": [
    "nani"
  ],
  "ng": [
    "ngapi"
  ],
  "nga": [
    "ngapi"
  ],
  "ngap": [
    "ngapi"
  ],
  "ku": [
    "kubwa"
  ],
  "kub": [
    "kubwa"
  ],
  "kubw": [
    "kubwa"
  ],
  "ndo": [
    "ndogo"
  ],
  "ndog": [
    "ndogo"
  ],
  "mb": [
    "mbaya"
  ],
  "mba": [
    "mbaya"
  ],
  "mbay": [
    "mbaya"
  ]
};

  const SW_WORD_SET = new Set(SW_WORDS.map(w => w.toLowerCase()));

  class SwahiliSubDirectory {
    constructor() {
      this.name = 'Swahili (Kiswahili)';
      this.code = 'sw';
      this.badge = 'Kiswahili';
      this.wordSet = SW_WORD_SET;
      this.typoMap = SW_TYPO_MAP;
      this.prefixTable = SW_PREFIX_TABLE;
      this.isActive = false;
    }

    hasWord(word) {
      if (!word) return false;
      return this.wordSet.has(word.toLowerCase().trim());
    }

    correctWord(cleanWord) {
      if (!cleanWord) return null;
      return this.typoMap[cleanWord] || null;
    }

    getPrefixSuggestions(prefix, max = 4) {
      if (!prefix || prefix.length < 2) return [];
      const clean = prefix.toLowerCase();
      const p = clean.slice(0, Math.min(4, clean.length));
      return (this.prefixTable[p] || []).filter(w => w.startsWith(clean) && w !== clean).slice(0, max);
    }

    detect(text) {
      if (!text || typeof text !== 'string') return false;
      return /\b(habari|mambo|asante|karibu|jambo|kwaheri|ndiyo|hapana|tafadhali)\b/i.test(text);
    }

    activate() {
      this.isActive = true;
      if (typeof window !== 'undefined') window.SW_SUBDIRECTORY_ACTIVE = true;
    }

    deactivate() {
      this.isActive = false;
      if (typeof window !== 'undefined') window.SW_SUBDIRECTORY_ACTIVE = false;
    }
  }

  const swSubDir = new SwahiliSubDirectory();

  window.SW_WORDS = SW_WORDS;
  window.SW_TYPO_MAP = SW_TYPO_MAP;
  window.SW_WORD_SET = SW_WORD_SET;
  window.SW_PREFIX_TABLE = SW_PREFIX_TABLE;
  window.SW_SUBDIRECTORY = swSubDir;
})();
