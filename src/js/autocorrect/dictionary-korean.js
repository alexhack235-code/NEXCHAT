/**
 * NEXCHAT Multilingual Sub-Directory: Korean Romanized & K-Wave (Deepened)
 * High-Speed O(1) Prefix-Indexed Radix Engine
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const KO_WORDS = [
  "annyeong",
  "annyeonghaseyo",
  "gamsahamnida",
  "kamsahamnida",
  "mianhe",
  "joesonghamnida",
  "gwaenchanha",
  "hwaiting",
  "fighting",
  "daebak",
  "heol",
  "jinjja",
  "jeongmal",
  "oppa",
  "unnie",
  "noona",
  "hyung",
  "maknae",
  "chingu",
  "uri",
  "gaja",
  "kaja",
  "ottoke",
  "waeyo",
  "museun",
  "eonje",
  "eodi",
  "nugu",
  "mwo",
  "maja",
  "arasseo",
  "mollayo",
  "saranghae",
  "bogoshipeo",
  "baegopa",
  "aigo",
  "omo",
  "jjang",
  "kpop",
  "kdrama",
  "kimchi",
  "ramen",
  "bap",
  "mul",
  "coffee",
  "jip",
  "oneul",
  "naeil",
  "eoje",
  "jigeum",
  "hayo",
  "hasseoyo",
  "halkkayo",
  "hago",
  "haseumnida",
  "bwayo",
  "bwasseoyo",
  "bwalkkayo",
  "bwago",
  "bwaseumnida",
  "meogeoyo",
  "meogeosseoyo",
  "meogeolkkayo",
  "meogeogo",
  "meogeoseumnida",
  "masyeoyo",
  "masyeosseoyo",
  "masyeolkkayo",
  "masyeogo",
  "masyeoseumnida",
  "gayo",
  "gasseoyo",
  "galkkayo",
  "gago",
  "gaseumnida",
  "wayo",
  "wasseoyo",
  "walkkayo",
  "wago",
  "waseumnida",
  "jayo",
  "jasseoyo",
  "jalkkayo",
  "jago",
  "jaseumnida",
  "ilhayo",
  "ilhasseoyo",
  "ilhalkkayo",
  "ilhago",
  "ilhaseumnida",
  "aryo",
  "arsseoyo",
  "arlkkayo",
  "argo",
  "arseumnida",
  "mannayo",
  "mannasseoyo",
  "mannalkkayo",
  "mannago",
  "mannaseumnida",
  "issyo",
  "isssseoyo",
  "isslkkayo",
  "issgo",
  "issseumnida",
  "eopsyo",
  "eopssseoyo",
  "eopslkkayo",
  "eopsgo",
  "eopsseumnida",
  "joayo",
  "joasseoyo",
  "joalkkayo",
  "joago",
  "joaseumnida"
];
  const KO_TYPO_MAP = {
  "kamsahamnida": "gamsahamnida",
  "mian": "mianhe",
  "saranghe": "saranghae",
  "bogoshipo": "bogoshipeo",
  "bogoshipda": "bogoshipeo",
  "kaja": "gaja",
  "wae": "waeyo",
  "otoke": "eotteoke",
  "jinja": "jinjja",
  "jungmal": "jeongmal",
  "arasso": "arasseo",
  "thx": "gamsahamnida",
  "ty": "gamsahamnida",
  "kkk": "ha ha ha"
};
  const KO_PREFIX_TABLE = {
  "an": [
    "annyeong",
    "annyeonghaseyo"
  ],
  "ann": [
    "annyeong",
    "annyeonghaseyo"
  ],
  "anny": [
    "annyeong",
    "annyeonghaseyo"
  ],
  "ga": [
    "gamsahamnida",
    "gaja",
    "gayo",
    "gasseoyo",
    "galkkayo",
    "gago",
    "gaseumnida"
  ],
  "gam": [
    "gamsahamnida"
  ],
  "gams": [
    "gamsahamnida"
  ],
  "ka": [
    "kamsahamnida",
    "kaja"
  ],
  "kam": [
    "kamsahamnida"
  ],
  "kams": [
    "kamsahamnida"
  ],
  "mi": [
    "mianhe"
  ],
  "mia": [
    "mianhe"
  ],
  "mian": [
    "mianhe"
  ],
  "jo": [
    "joesonghamnida",
    "joayo",
    "joasseoyo",
    "joalkkayo",
    "joago",
    "joaseumnida"
  ],
  "joe": [
    "joesonghamnida"
  ],
  "joes": [
    "joesonghamnida"
  ],
  "gw": [
    "gwaenchanha"
  ],
  "gwa": [
    "gwaenchanha"
  ],
  "gwae": [
    "gwaenchanha"
  ],
  "hw": [
    "hwaiting"
  ],
  "hwa": [
    "hwaiting"
  ],
  "hwai": [
    "hwaiting"
  ],
  "fi": [
    "fighting"
  ],
  "fig": [
    "fighting"
  ],
  "figh": [
    "fighting"
  ],
  "da": [
    "daebak"
  ],
  "dae": [
    "daebak"
  ],
  "daeb": [
    "daebak"
  ],
  "he": [
    "heol"
  ],
  "heo": [
    "heol"
  ],
  "heol": [
    "heol"
  ],
  "ji": [
    "jinjja",
    "jip",
    "jigeum"
  ],
  "jin": [
    "jinjja"
  ],
  "jinj": [
    "jinjja"
  ],
  "je": [
    "jeongmal"
  ],
  "jeo": [
    "jeongmal"
  ],
  "jeon": [
    "jeongmal"
  ],
  "op": [
    "oppa"
  ],
  "opp": [
    "oppa"
  ],
  "oppa": [
    "oppa"
  ],
  "un": [
    "unnie"
  ],
  "unn": [
    "unnie"
  ],
  "unni": [
    "unnie"
  ],
  "no": [
    "noona"
  ],
  "noo": [
    "noona"
  ],
  "noon": [
    "noona"
  ],
  "hy": [
    "hyung"
  ],
  "hyu": [
    "hyung"
  ],
  "hyun": [
    "hyung"
  ],
  "ma": [
    "maknae",
    "maja",
    "masyeoyo",
    "masyeosseoyo",
    "masyeolkkayo",
    "masyeogo",
    "masyeoseumnida",
    "mannayo",
    "mannasseoyo",
    "mannalkkayo",
    "mannago",
    "mannaseumnida"
  ],
  "mak": [
    "maknae"
  ],
  "makn": [
    "maknae"
  ],
  "ch": [
    "chingu"
  ],
  "chi": [
    "chingu"
  ],
  "chin": [
    "chingu"
  ],
  "ur": [
    "uri"
  ],
  "uri": [
    "uri"
  ],
  "gaj": [
    "gaja"
  ],
  "gaja": [
    "gaja"
  ],
  "kaj": [
    "kaja"
  ],
  "kaja": [
    "kaja"
  ],
  "ot": [
    "ottoke"
  ],
  "ott": [
    "ottoke"
  ],
  "otto": [
    "ottoke"
  ],
  "wa": [
    "waeyo",
    "wayo",
    "wasseoyo",
    "walkkayo",
    "wago",
    "waseumnida"
  ],
  "wae": [
    "waeyo"
  ],
  "waey": [
    "waeyo"
  ],
  "mu": [
    "museun",
    "mul"
  ],
  "mus": [
    "museun"
  ],
  "muse": [
    "museun"
  ],
  "eo": [
    "eonje",
    "eodi",
    "eoje",
    "eopsyo",
    "eopssseoyo",
    "eopslkkayo",
    "eopsgo",
    "eopsseumnida"
  ],
  "eon": [
    "eonje"
  ],
  "eonj": [
    "eonje"
  ],
  "eod": [
    "eodi"
  ],
  "eodi": [
    "eodi"
  ],
  "nu": [
    "nugu"
  ],
  "nug": [
    "nugu"
  ],
  "nugu": [
    "nugu"
  ],
  "mw": [
    "mwo"
  ],
  "mwo": [
    "mwo"
  ],
  "maj": [
    "maja"
  ],
  "maja": [
    "maja"
  ],
  "ar": [
    "arasseo",
    "aryo",
    "arsseoyo",
    "arlkkayo",
    "argo",
    "arseumnida"
  ],
  "ara": [
    "arasseo"
  ],
  "aras": [
    "arasseo"
  ],
  "mo": [
    "mollayo"
  ],
  "mol": [
    "mollayo"
  ],
  "moll": [
    "mollayo"
  ],
  "sa": [
    "saranghae"
  ],
  "sar": [
    "saranghae"
  ],
  "sara": [
    "saranghae"
  ],
  "bo": [
    "bogoshipeo"
  ],
  "bog": [
    "bogoshipeo"
  ],
  "bogo": [
    "bogoshipeo"
  ],
  "ba": [
    "baegopa",
    "bap"
  ],
  "bae": [
    "baegopa"
  ],
  "baeg": [
    "baegopa"
  ],
  "ai": [
    "aigo"
  ],
  "aig": [
    "aigo"
  ],
  "aigo": [
    "aigo"
  ],
  "om": [
    "omo"
  ],
  "omo": [
    "omo"
  ],
  "jj": [
    "jjang"
  ],
  "jja": [
    "jjang"
  ],
  "jjan": [
    "jjang"
  ],
  "kp": [
    "kpop"
  ],
  "kpo": [
    "kpop"
  ],
  "kpop": [
    "kpop"
  ],
  "kd": [
    "kdrama"
  ],
  "kdr": [
    "kdrama"
  ],
  "kdra": [
    "kdrama"
  ],
  "ki": [
    "kimchi"
  ],
  "kim": [
    "kimchi"
  ],
  "kimc": [
    "kimchi"
  ],
  "ra": [
    "ramen"
  ],
  "ram": [
    "ramen"
  ],
  "rame": [
    "ramen"
  ],
  "bap": [
    "bap"
  ],
  "mul": [
    "mul"
  ],
  "co": [
    "coffee"
  ],
  "cof": [
    "coffee"
  ],
  "coff": [
    "coffee"
  ],
  "jip": [
    "jip"
  ],
  "on": [
    "oneul"
  ],
  "one": [
    "oneul"
  ],
  "oneu": [
    "oneul"
  ],
  "na": [
    "naeil"
  ],
  "nae": [
    "naeil"
  ],
  "naei": [
    "naeil"
  ],
  "eoj": [
    "eoje"
  ],
  "eoje": [
    "eoje"
  ],
  "jig": [
    "jigeum"
  ],
  "jige": [
    "jigeum"
  ],
  "ha": [
    "hayo",
    "hasseoyo",
    "halkkayo",
    "hago",
    "haseumnida"
  ],
  "hay": [
    "hayo"
  ],
  "hayo": [
    "hayo"
  ],
  "has": [
    "hasseoyo",
    "haseumnida"
  ],
  "hass": [
    "hasseoyo"
  ],
  "hal": [
    "halkkayo"
  ],
  "halk": [
    "halkkayo"
  ],
  "hag": [
    "hago"
  ],
  "hago": [
    "hago"
  ],
  "hase": [
    "haseumnida"
  ],
  "bw": [
    "bwayo",
    "bwasseoyo",
    "bwalkkayo",
    "bwago",
    "bwaseumnida"
  ],
  "bwa": [
    "bwayo",
    "bwasseoyo",
    "bwalkkayo",
    "bwago",
    "bwaseumnida"
  ],
  "bway": [
    "bwayo"
  ],
  "bwas": [
    "bwasseoyo",
    "bwaseumnida"
  ],
  "bwal": [
    "bwalkkayo"
  ],
  "bwag": [
    "bwago"
  ],
  "me": [
    "meogeoyo",
    "meogeosseoyo",
    "meogeolkkayo",
    "meogeogo",
    "meogeoseumnida"
  ],
  "meo": [
    "meogeoyo",
    "meogeosseoyo",
    "meogeolkkayo",
    "meogeogo",
    "meogeoseumnida"
  ],
  "meog": [
    "meogeoyo",
    "meogeosseoyo",
    "meogeolkkayo",
    "meogeogo",
    "meogeoseumnida"
  ],
  "mas": [
    "masyeoyo",
    "masyeosseoyo",
    "masyeolkkayo",
    "masyeogo",
    "masyeoseumnida"
  ],
  "masy": [
    "masyeoyo",
    "masyeosseoyo",
    "masyeolkkayo",
    "masyeogo",
    "masyeoseumnida"
  ],
  "gay": [
    "gayo"
  ],
  "gayo": [
    "gayo"
  ],
  "gas": [
    "gasseoyo",
    "gaseumnida"
  ],
  "gass": [
    "gasseoyo"
  ],
  "gal": [
    "galkkayo"
  ],
  "galk": [
    "galkkayo"
  ],
  "gag": [
    "gago"
  ],
  "gago": [
    "gago"
  ],
  "gase": [
    "gaseumnida"
  ],
  "way": [
    "wayo"
  ],
  "wayo": [
    "wayo"
  ],
  "was": [
    "wasseoyo",
    "waseumnida"
  ],
  "wass": [
    "wasseoyo"
  ],
  "wal": [
    "walkkayo"
  ],
  "walk": [
    "walkkayo"
  ],
  "wag": [
    "wago"
  ],
  "wago": [
    "wago"
  ],
  "wase": [
    "waseumnida"
  ],
  "ja": [
    "jayo",
    "jasseoyo",
    "jalkkayo",
    "jago",
    "jaseumnida"
  ],
  "jay": [
    "jayo"
  ],
  "jayo": [
    "jayo"
  ],
  "jas": [
    "jasseoyo",
    "jaseumnida"
  ],
  "jass": [
    "jasseoyo"
  ],
  "jal": [
    "jalkkayo"
  ],
  "jalk": [
    "jalkkayo"
  ],
  "jag": [
    "jago"
  ],
  "jago": [
    "jago"
  ],
  "jase": [
    "jaseumnida"
  ],
  "il": [
    "ilhayo",
    "ilhasseoyo",
    "ilhalkkayo",
    "ilhago",
    "ilhaseumnida"
  ],
  "ilh": [
    "ilhayo",
    "ilhasseoyo",
    "ilhalkkayo",
    "ilhago",
    "ilhaseumnida"
  ],
  "ilha": [
    "ilhayo",
    "ilhasseoyo",
    "ilhalkkayo",
    "ilhago",
    "ilhaseumnida"
  ],
  "ary": [
    "aryo"
  ],
  "aryo": [
    "aryo"
  ],
  "ars": [
    "arsseoyo",
    "arseumnida"
  ],
  "arss": [
    "arsseoyo"
  ],
  "arl": [
    "arlkkayo"
  ],
  "arlk": [
    "arlkkayo"
  ],
  "arg": [
    "argo"
  ],
  "argo": [
    "argo"
  ],
  "arse": [
    "arseumnida"
  ],
  "man": [
    "mannayo",
    "mannasseoyo",
    "mannalkkayo",
    "mannago",
    "mannaseumnida"
  ],
  "mann": [
    "mannayo",
    "mannasseoyo",
    "mannalkkayo",
    "mannago",
    "mannaseumnida"
  ],
  "is": [
    "issyo",
    "isssseoyo",
    "isslkkayo",
    "issgo",
    "issseumnida"
  ],
  "iss": [
    "issyo",
    "isssseoyo",
    "isslkkayo",
    "issgo",
    "issseumnida"
  ],
  "issy": [
    "issyo"
  ],
  "isss": [
    "isssseoyo",
    "issseumnida"
  ],
  "issl": [
    "isslkkayo"
  ],
  "issg": [
    "issgo"
  ],
  "eop": [
    "eopsyo",
    "eopssseoyo",
    "eopslkkayo",
    "eopsgo",
    "eopsseumnida"
  ],
  "eops": [
    "eopsyo",
    "eopssseoyo",
    "eopslkkayo",
    "eopsgo",
    "eopsseumnida"
  ],
  "joa": [
    "joayo",
    "joasseoyo",
    "joalkkayo",
    "joago",
    "joaseumnida"
  ],
  "joay": [
    "joayo"
  ],
  "joas": [
    "joasseoyo",
    "joaseumnida"
  ],
  "joal": [
    "joalkkayo"
  ],
  "joag": [
    "joago"
  ]
};
  const KO_WORD_SET = new Set(KO_WORDS);

  class KoreanSubDirectory {
    constructor() {
      this.name = 'Korean Romanized (한국어)';
      this.code = 'ko';
      this.badge = '한국어 Romaji';
      this.icon = 'fa-heart';
      this.wordSet = KO_WORD_SET;
      this.typoMap = KO_TYPO_MAP;
      this.prefixTable = KO_PREFIX_TABLE;
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
      const lower = text.toLowerCase();
      const tokens = lower.split(/\s+|[.,!?;:()]+/);
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i].trim();
        if (this.typoMap[t]) return true;
      }
      return /\b(annyeong|gamsahamnida|saranghae|daebak|fighting|hwaiting|oppa|unnie|jinjja|ottoke|bogoshipeo)\b/i.test(lower);
    }

    activate() {
      this.isActive = true;
      if (typeof window !== 'undefined') window.KO_SUBDIRECTORY_ACTIVE = true;
    }

    deactivate() {
      this.isActive = false;
      if (typeof window !== 'undefined') window.KO_SUBDIRECTORY_ACTIVE = false;
    }
  }

  const koSubDir = new KoreanSubDirectory();

  window.KO_WORDS = KO_WORDS;
  window.KO_TYPO_MAP = KO_TYPO_MAP;
  window.KO_WORD_SET = KO_WORD_SET;
  window.KO_PREFIX_TABLE = KO_PREFIX_TABLE;
  window.KO_SUBDIRECTORY = koSubDir;
})();
