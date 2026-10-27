/**
 * NEXCHAT Multilingual Sub-Directory: Hindi & Hinglish (हिन्दी / Hinglish)
 * Script: Devanagari ([\u0900-\u097F]) & Hinglish Roman Transliteration
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const HI_WORDS = [
  "नमस्ते",
  "नमस्कार",
  "धन्यवाद",
  "शुक्रिया",
  "हाँ",
  "नहीं",
  "क्या",
  "क्यों",
  "कहाँ",
  "कब",
  "कैसे",
  "कैसा",
  "कौन",
  "भाई",
  "दोस्त",
  "यार",
  "अच्छा",
  "बहुत",
  "ठीक",
  "सब",
  "कुछ",
  "कोई",
  "आज",
  "कल",
  "अभी",
  "यहाँ",
  "वहाँ",
  "समय",
  "काम",
  "घर",
  "खाना",
  "पानी",
  "प्यार",
  "खुशी",
  "बात",
  "बताओ",
  "सुनो",
  "चलो",
  "आओ",
  "जाओ",
  "करो",
  "namaste",
  "shukriya",
  "kya",
  "kyun",
  "kaha",
  "kab",
  "kaise",
  "kaisa",
  "kaun",
  "bhai",
  "bhaiya",
  "yaar",
  "dost",
  "achha",
  "accha",
  "bahut",
  "theek",
  "thik",
  "sab",
  "kuch",
  "koi",
  "aaj",
  "kal",
  "abhi",
  "yaha",
  "waha",
  "samay",
  "kaam",
  "ghar",
  "khana",
  "paani",
  "pyaar",
  "khushi",
  "baat",
  "batao",
  "suno",
  "chalo",
  "aao",
  "jao",
  "karo",
  "pata",
  "samjha",
  "arre",
  "ab",
  "bolo",
  "sahi",
  "mast",
  "jugaad",
  "bindaas",
  "pakka",
  "chalega",
  "badiya",
  "zordaar",
  "ekdum"
];
  const HI_TYPO_MAP = {
  "kyu": "kyun",
  "nhi": "nahi",
  "hn": "haan",
  "thk": "theek",
  "yr": "yaar",
  "smjh": "samjha",
  "btao": "batao",
  "namste": "namaste",
  "shukriyaa": "shukriya",
  "bdiya": "badiya",
  "achaa": "achha",
  "km": "kaam",
  "ghr": "ghar",
  "bhejo": "bhejo",
  "dhnyavad": "धन्यवाद",
  "nmste": "नमस्ते"
};
  const HI_PREFIX_TABLE = {
  "नम": [
    "नमस्ते",
    "नमस्कार"
  ],
  "नमस": [
    "नमस्ते",
    "नमस्कार"
  ],
  "नमस्": [
    "नमस्ते",
    "नमस्कार"
  ],
  "धन": [
    "धन्यवाद"
  ],
  "धन्": [
    "धन्यवाद"
  ],
  "धन्य": [
    "धन्यवाद"
  ],
  "शु": [
    "शुक्रिया"
  ],
  "शुक": [
    "शुक्रिया"
  ],
  "शुक्": [
    "शुक्रिया"
  ],
  "हा": [
    "हाँ"
  ],
  "हाँ": [
    "हाँ"
  ],
  "नह": [
    "नहीं"
  ],
  "नही": [
    "नहीं"
  ],
  "नहीं": [
    "नहीं"
  ],
  "क्": [
    "क्या",
    "क्यों"
  ],
  "क्य": [
    "क्या",
    "क्यों"
  ],
  "क्या": [
    "क्या"
  ],
  "क्यो": [
    "क्यों"
  ],
  "कह": [
    "कहाँ"
  ],
  "कहा": [
    "कहाँ"
  ],
  "कहाँ": [
    "कहाँ"
  ],
  "कब": [
    "कब"
  ],
  "कै": [
    "कैसे",
    "कैसा"
  ],
  "कैस": [
    "कैसे",
    "कैसा"
  ],
  "कैसे": [
    "कैसे"
  ],
  "कैसा": [
    "कैसा"
  ],
  "कौ": [
    "कौन"
  ],
  "कौन": [
    "कौन"
  ],
  "भा": [
    "भाई"
  ],
  "भाई": [
    "भाई"
  ],
  "दो": [
    "दोस्त"
  ],
  "दोस": [
    "दोस्त"
  ],
  "दोस्": [
    "दोस्त"
  ],
  "या": [
    "यार"
  ],
  "यार": [
    "यार"
  ],
  "अच": [
    "अच्छा"
  ],
  "अच्": [
    "अच्छा"
  ],
  "अच्छ": [
    "अच्छा"
  ],
  "बह": [
    "बहुत"
  ],
  "बहु": [
    "बहुत"
  ],
  "बहुत": [
    "बहुत"
  ],
  "ठी": [
    "ठीक"
  ],
  "ठीक": [
    "ठीक"
  ],
  "सब": [
    "सब"
  ],
  "कु": [
    "कुछ"
  ],
  "कुछ": [
    "कुछ"
  ],
  "को": [
    "कोई"
  ],
  "कोई": [
    "कोई"
  ],
  "आज": [
    "आज"
  ],
  "कल": [
    "कल"
  ],
  "अभ": [
    "अभी"
  ],
  "अभी": [
    "अभी"
  ],
  "यह": [
    "यहाँ"
  ],
  "यहा": [
    "यहाँ"
  ],
  "यहाँ": [
    "यहाँ"
  ],
  "वह": [
    "वहाँ"
  ],
  "वहा": [
    "वहाँ"
  ],
  "वहाँ": [
    "वहाँ"
  ],
  "सम": [
    "समय"
  ],
  "समय": [
    "समय"
  ],
  "का": [
    "काम"
  ],
  "काम": [
    "काम"
  ],
  "घर": [
    "घर"
  ],
  "खा": [
    "खाना"
  ],
  "खान": [
    "खाना"
  ],
  "खाना": [
    "खाना"
  ],
  "पा": [
    "पानी"
  ],
  "पान": [
    "पानी"
  ],
  "पानी": [
    "पानी"
  ],
  "प्": [
    "प्यार"
  ],
  "प्य": [
    "प्यार"
  ],
  "प्या": [
    "प्यार"
  ],
  "खु": [
    "खुशी"
  ],
  "खुश": [
    "खुशी"
  ],
  "खुशी": [
    "खुशी"
  ],
  "बा": [
    "बात"
  ],
  "बात": [
    "बात"
  ],
  "बत": [
    "बताओ"
  ],
  "बता": [
    "बताओ"
  ],
  "बताओ": [
    "बताओ"
  ],
  "सु": [
    "सुनो"
  ],
  "सुन": [
    "सुनो"
  ],
  "सुनो": [
    "सुनो"
  ],
  "चल": [
    "चलो"
  ],
  "चलो": [
    "चलो"
  ],
  "आओ": [
    "आओ"
  ],
  "जा": [
    "जाओ"
  ],
  "जाओ": [
    "जाओ"
  ],
  "कर": [
    "करो"
  ],
  "करो": [
    "करो"
  ],
  "na": [
    "namaste"
  ],
  "nam": [
    "namaste"
  ],
  "nama": [
    "namaste"
  ],
  "sh": [
    "shukriya"
  ],
  "shu": [
    "shukriya"
  ],
  "shuk": [
    "shukriya"
  ],
  "ky": [
    "kya",
    "kyun"
  ],
  "kya": [
    "kya"
  ],
  "kyu": [
    "kyun"
  ],
  "kyun": [
    "kyun"
  ],
  "ka": [
    "kaha",
    "kab",
    "kaise",
    "kaisa",
    "kaun"
  ],
  "kah": [
    "kaha"
  ],
  "kaha": [
    "kaha"
  ],
  "kab": [
    "kab"
  ],
  "kai": [
    "kaise",
    "kaisa"
  ],
  "kais": [
    "kaise",
    "kaisa"
  ],
  "kau": [
    "kaun"
  ],
  "kaun": [
    "kaun"
  ],
  "bh": [
    "bhai",
    "bhaiya"
  ],
  "bha": [
    "bhai",
    "bhaiya"
  ],
  "bhai": [
    "bhai",
    "bhaiya"
  ],
  "ya": [
    "yaar",
    "yaha"
  ],
  "yaa": [
    "yaar"
  ],
  "yaar": [
    "yaar"
  ],
  "do": [
    "dost"
  ],
  "dos": [
    "dost"
  ],
  "dost": [
    "dost"
  ],
  "ac": [
    "achha",
    "accha"
  ],
  "ach": [
    "achha"
  ],
  "achh": [
    "achha"
  ],
  "acc": [
    "accha"
  ],
  "acch": [
    "accha"
  ],
  "ba": [
    "bahut",
    "baat",
    "batao",
    "badiya"
  ],
  "bah": [
    "bahut"
  ],
  "bahu": [
    "bahut"
  ],
  "th": [
    "theek",
    "thik"
  ],
  "the": [
    "theek"
  ],
  "thee": [
    "theek"
  ],
  "thi": [
    "thik"
  ],
  "thik": [
    "thik"
  ],
  "sa": [
    "sab",
    "samay",
    "samjha",
    "sahi"
  ],
  "sab": [
    "sab"
  ],
  "ku": [
    "kuch"
  ],
  "kuc": [
    "kuch"
  ],
  "kuch": [
    "kuch"
  ],
  "ko": [
    "koi"
  ],
  "koi": [
    "koi"
  ],
  "aa": [
    "aaj",
    "aao"
  ],
  "aaj": [
    "aaj"
  ],
  "kal": [
    "kal"
  ],
  "ab": [
    "abhi",
    "ab"
  ],
  "abh": [
    "abhi"
  ],
  "abhi": [
    "abhi"
  ],
  "yah": [
    "yaha"
  ],
  "yaha": [
    "yaha"
  ],
  "wa": [
    "waha"
  ],
  "wah": [
    "waha"
  ],
  "waha": [
    "waha"
  ],
  "sam": [
    "samay",
    "samjha"
  ],
  "sama": [
    "samay"
  ],
  "kaa": [
    "kaam"
  ],
  "kaam": [
    "kaam"
  ],
  "gh": [
    "ghar"
  ],
  "gha": [
    "ghar"
  ],
  "ghar": [
    "ghar"
  ],
  "kh": [
    "khana",
    "khushi"
  ],
  "kha": [
    "khana"
  ],
  "khan": [
    "khana"
  ],
  "pa": [
    "paani",
    "pata",
    "pakka"
  ],
  "paa": [
    "paani"
  ],
  "paan": [
    "paani"
  ],
  "py": [
    "pyaar"
  ],
  "pya": [
    "pyaar"
  ],
  "pyaa": [
    "pyaar"
  ],
  "khu": [
    "khushi"
  ],
  "khus": [
    "khushi"
  ],
  "baa": [
    "baat"
  ],
  "baat": [
    "baat"
  ],
  "bat": [
    "batao"
  ],
  "bata": [
    "batao"
  ],
  "su": [
    "suno"
  ],
  "sun": [
    "suno"
  ],
  "suno": [
    "suno"
  ],
  "ch": [
    "chalo",
    "chalega"
  ],
  "cha": [
    "chalo",
    "chalega"
  ],
  "chal": [
    "chalo",
    "chalega"
  ],
  "aao": [
    "aao"
  ],
  "ja": [
    "jao"
  ],
  "jao": [
    "jao"
  ],
  "kar": [
    "karo"
  ],
  "karo": [
    "karo"
  ],
  "pat": [
    "pata"
  ],
  "pata": [
    "pata"
  ],
  "samj": [
    "samjha"
  ],
  "ar": [
    "arre"
  ],
  "arr": [
    "arre"
  ],
  "arre": [
    "arre"
  ],
  "bo": [
    "bolo"
  ],
  "bol": [
    "bolo"
  ],
  "bolo": [
    "bolo"
  ],
  "sah": [
    "sahi"
  ],
  "sahi": [
    "sahi"
  ],
  "ma": [
    "mast"
  ],
  "mas": [
    "mast"
  ],
  "mast": [
    "mast"
  ],
  "ju": [
    "jugaad"
  ],
  "jug": [
    "jugaad"
  ],
  "juga": [
    "jugaad"
  ],
  "bi": [
    "bindaas"
  ],
  "bin": [
    "bindaas"
  ],
  "bind": [
    "bindaas"
  ],
  "pak": [
    "pakka"
  ],
  "pakk": [
    "pakka"
  ],
  "bad": [
    "badiya"
  ],
  "badi": [
    "badiya"
  ],
  "zo": [
    "zordaar"
  ],
  "zor": [
    "zordaar"
  ],
  "zord": [
    "zordaar"
  ],
  "ek": [
    "ekdum"
  ],
  "ekd": [
    "ekdum"
  ],
  "ekdu": [
    "ekdum"
  ]
};

  const HI_WORD_SET = new Set(HI_WORDS.map(w => w.toLowerCase()));
  const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

  class HinglishSubDirectory {
    constructor() {
      this.name = 'Hindi / Hinglish';
      this.code = 'hi';
      this.badge = 'Hinglish';
      this.wordSet = HI_WORD_SET;
      this.typoMap = HI_TYPO_MAP;
      this.prefixTable = HI_PREFIX_TABLE;
      this.isActive = false;
    }

    hasWord(word) {
      if (!word) return false;
      const clean = word.toLowerCase().trim();
      return this.wordSet.has(clean);
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
      if (DEVANAGARI_REGEX.test(text)) return true;
      return /\b(namaste|shukriya|kaise|theek|achha|bhai|yaar|dost|kya|nahi|batao)\b/i.test(text);
    }

    activate() {
      this.isActive = true;
      if (typeof window !== 'undefined') window.HI_SUBDIRECTORY_ACTIVE = true;
    }

    deactivate() {
      this.isActive = false;
      if (typeof window !== 'undefined') window.HI_SUBDIRECTORY_ACTIVE = false;
    }
  }

  const hiSubDir = new HinglishSubDirectory();

  window.HI_WORDS = HI_WORDS;
  window.HI_TYPO_MAP = HI_TYPO_MAP;
  window.HI_WORD_SET = HI_WORD_SET;
  window.HI_PREFIX_TABLE = HI_PREFIX_TABLE;
  window.HI_SUBDIRECTORY = hiSubDir;
})();
