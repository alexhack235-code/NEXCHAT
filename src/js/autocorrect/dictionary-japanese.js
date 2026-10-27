/**
 * NEXCHAT Multilingual Sub-Directory: Japanese Romaji & Net Slang (Deepened)
 * High-Speed O(1) Prefix-Indexed Radix Engine
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const JA_WORDS = [
  "konnichiwa",
  "konbanwa",
  "ohayou",
  "arigatou",
  "doumo",
  "gomen",
  "gomennasai",
  "sumimasen",
  "sayonara",
  "jaane",
  "matane",
  "ittekimasu",
  "tadaima",
  "okaeri",
  "itadakimasu",
  "hai",
  "iie",
  "daijoubu",
  "onegai",
  "yoroshiku",
  "otsukare",
  "sugoi",
  "yabai",
  "kawaii",
  "kakkoii",
  "baka",
  "hontou",
  "majide",
  "naruhodo",
  "wakarimashita",
  "daisuki",
  "suki",
  "omoshiroi",
  "oishii",
  "nani",
  "doko",
  "itsu",
  "watashi",
  "boku",
  "tomodachi",
  "kazoku",
  "kuruma",
  "meeru",
  "anime",
  "manga",
  "mizu",
  "ocha",
  "gohan",
  "ramen",
  "sushi",
  "www",
  "maji",
  "otsu",
  "ryo",
  "ikimasu",
  "ikimashita",
  "ikimasen",
  "ikitai",
  "ikite",
  "ikita",
  "kimasu",
  "kimashita",
  "kimasen",
  "kitai",
  "kite",
  "kita",
  "mimasu",
  "mimashita",
  "mimasen",
  "mitai",
  "mite",
  "mita",
  "kikimasu",
  "kikimashita",
  "kikimasen",
  "kikitai",
  "kikite",
  "kikita",
  "hanashimasu",
  "hanashimashita",
  "hanashimasen",
  "hanashitai",
  "hanashite",
  "hanashita",
  "tabemasu",
  "tabemashita",
  "tabemasen",
  "tabetai",
  "tabete",
  "tabeta",
  "nomimasu",
  "nomimashita",
  "nomimasen",
  "nomitai",
  "nomite",
  "nomita",
  "kaimasu",
  "kaimashita",
  "kaimasen",
  "kaitai",
  "kaite",
  "kaita",
  "machimasu",
  "machimashita",
  "machimasen",
  "machitai",
  "machite",
  "machita",
  "wakarimasu",
  "wakarimasen",
  "wakaritai",
  "wakarite",
  "wakarita",
  "dekimasu",
  "dekimashita",
  "dekimasen",
  "dekitai",
  "dekite",
  "dekita",
  "oshimasu",
  "oshimashita",
  "oshimasen",
  "oshitai",
  "oshite",
  "oshita"
];
  const JA_TYPO_MAP = {
  "arigato": "arigatou",
  "arigatogozaimasu": "arigatougozaimasu",
  "ohayo": "ohayou",
  "konichiwa": "konnichiwa",
  "gomenasai": "gomennasai",
  "sumimsen": "sumimasen",
  "daijobu": "daijoubu",
  "otsukaresama": "otsukaresamadesu",
  "kawai": "kawaii",
  "kakoi": "kakkoii",
  "thx": "arigatou",
  "ty": "arigatou",
  "plz": "onegaishimasu",
  "ryo": "ryoukai",
  "otsu": "otsukare"
};
  const JA_PREFIX_TABLE = {
  "ko": [
    "konnichiwa",
    "konbanwa"
  ],
  "kon": [
    "konnichiwa",
    "konbanwa"
  ],
  "konn": [
    "konnichiwa"
  ],
  "konb": [
    "konbanwa"
  ],
  "oh": [
    "ohayou"
  ],
  "oha": [
    "ohayou"
  ],
  "ohay": [
    "ohayou"
  ],
  "ar": [
    "arigatou"
  ],
  "ari": [
    "arigatou"
  ],
  "arig": [
    "arigatou"
  ],
  "do": [
    "doumo",
    "doko"
  ],
  "dou": [
    "doumo"
  ],
  "doum": [
    "doumo"
  ],
  "go": [
    "gomen",
    "gomennasai",
    "gohan"
  ],
  "gom": [
    "gomen",
    "gomennasai"
  ],
  "gome": [
    "gomen",
    "gomennasai"
  ],
  "su": [
    "sumimasen",
    "sugoi",
    "suki",
    "sushi"
  ],
  "sum": [
    "sumimasen"
  ],
  "sumi": [
    "sumimasen"
  ],
  "sa": [
    "sayonara"
  ],
  "say": [
    "sayonara"
  ],
  "sayo": [
    "sayonara"
  ],
  "ja": [
    "jaane"
  ],
  "jaa": [
    "jaane"
  ],
  "jaan": [
    "jaane"
  ],
  "ma": [
    "matane",
    "majide",
    "manga",
    "maji",
    "machimasu",
    "machimashita",
    "machimasen",
    "machitai",
    "machite",
    "machita"
  ],
  "mat": [
    "matane"
  ],
  "mata": [
    "matane"
  ],
  "it": [
    "ittekimasu",
    "itadakimasu",
    "itsu"
  ],
  "itt": [
    "ittekimasu"
  ],
  "itte": [
    "ittekimasu"
  ],
  "ta": [
    "tadaima",
    "tabemasu",
    "tabemashita",
    "tabemasen",
    "tabetai",
    "tabete",
    "tabeta"
  ],
  "tad": [
    "tadaima"
  ],
  "tada": [
    "tadaima"
  ],
  "ok": [
    "okaeri"
  ],
  "oka": [
    "okaeri"
  ],
  "okae": [
    "okaeri"
  ],
  "ita": [
    "itadakimasu"
  ],
  "itad": [
    "itadakimasu"
  ],
  "ha": [
    "hai",
    "hanashimasu",
    "hanashimashita",
    "hanashimasen",
    "hanashitai",
    "hanashite",
    "hanashita"
  ],
  "hai": [
    "hai"
  ],
  "ii": [
    "iie"
  ],
  "iie": [
    "iie"
  ],
  "da": [
    "daijoubu",
    "daisuki"
  ],
  "dai": [
    "daijoubu",
    "daisuki"
  ],
  "daij": [
    "daijoubu"
  ],
  "on": [
    "onegai"
  ],
  "one": [
    "onegai"
  ],
  "oneg": [
    "onegai"
  ],
  "yo": [
    "yoroshiku"
  ],
  "yor": [
    "yoroshiku"
  ],
  "yoro": [
    "yoroshiku"
  ],
  "ot": [
    "otsukare",
    "otsu"
  ],
  "ots": [
    "otsukare",
    "otsu"
  ],
  "otsu": [
    "otsukare",
    "otsu"
  ],
  "sug": [
    "sugoi"
  ],
  "sugo": [
    "sugoi"
  ],
  "ya": [
    "yabai"
  ],
  "yab": [
    "yabai"
  ],
  "yaba": [
    "yabai"
  ],
  "ka": [
    "kawaii",
    "kakkoii",
    "kazoku",
    "kaimasu",
    "kaimashita",
    "kaimasen",
    "kaitai",
    "kaite",
    "kaita"
  ],
  "kaw": [
    "kawaii"
  ],
  "kawa": [
    "kawaii"
  ],
  "kak": [
    "kakkoii"
  ],
  "kakk": [
    "kakkoii"
  ],
  "ba": [
    "baka"
  ],
  "bak": [
    "baka"
  ],
  "baka": [
    "baka"
  ],
  "ho": [
    "hontou"
  ],
  "hon": [
    "hontou"
  ],
  "hont": [
    "hontou"
  ],
  "maj": [
    "majide",
    "maji"
  ],
  "maji": [
    "majide",
    "maji"
  ],
  "na": [
    "naruhodo",
    "nani"
  ],
  "nar": [
    "naruhodo"
  ],
  "naru": [
    "naruhodo"
  ],
  "wa": [
    "wakarimashita",
    "watashi",
    "wakarimasu",
    "wakarimasen",
    "wakaritai",
    "wakarite",
    "wakarita"
  ],
  "wak": [
    "wakarimashita",
    "wakarimasu",
    "wakarimasen",
    "wakaritai",
    "wakarite",
    "wakarita"
  ],
  "waka": [
    "wakarimashita",
    "wakarimasu",
    "wakarimasen",
    "wakaritai",
    "wakarite",
    "wakarita"
  ],
  "dais": [
    "daisuki"
  ],
  "suk": [
    "suki"
  ],
  "suki": [
    "suki"
  ],
  "om": [
    "omoshiroi"
  ],
  "omo": [
    "omoshiroi"
  ],
  "omos": [
    "omoshiroi"
  ],
  "oi": [
    "oishii"
  ],
  "ois": [
    "oishii"
  ],
  "oish": [
    "oishii"
  ],
  "nan": [
    "nani"
  ],
  "nani": [
    "nani"
  ],
  "dok": [
    "doko"
  ],
  "doko": [
    "doko"
  ],
  "its": [
    "itsu"
  ],
  "itsu": [
    "itsu"
  ],
  "wat": [
    "watashi"
  ],
  "wata": [
    "watashi"
  ],
  "bo": [
    "boku"
  ],
  "bok": [
    "boku"
  ],
  "boku": [
    "boku"
  ],
  "to": [
    "tomodachi"
  ],
  "tom": [
    "tomodachi"
  ],
  "tomo": [
    "tomodachi"
  ],
  "kaz": [
    "kazoku"
  ],
  "kazo": [
    "kazoku"
  ],
  "ku": [
    "kuruma"
  ],
  "kur": [
    "kuruma"
  ],
  "kuru": [
    "kuruma"
  ],
  "me": [
    "meeru"
  ],
  "mee": [
    "meeru"
  ],
  "meer": [
    "meeru"
  ],
  "an": [
    "anime"
  ],
  "ani": [
    "anime"
  ],
  "anim": [
    "anime"
  ],
  "man": [
    "manga"
  ],
  "mang": [
    "manga"
  ],
  "mi": [
    "mizu",
    "mimasu",
    "mimashita",
    "mimasen",
    "mitai",
    "mite",
    "mita"
  ],
  "miz": [
    "mizu"
  ],
  "mizu": [
    "mizu"
  ],
  "oc": [
    "ocha"
  ],
  "och": [
    "ocha"
  ],
  "ocha": [
    "ocha"
  ],
  "goh": [
    "gohan"
  ],
  "goha": [
    "gohan"
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
  "sus": [
    "sushi"
  ],
  "sush": [
    "sushi"
  ],
  "ww": [
    "www"
  ],
  "www": [
    "www"
  ],
  "ry": [
    "ryo"
  ],
  "ryo": [
    "ryo"
  ],
  "ik": [
    "ikimasu",
    "ikimashita",
    "ikimasen",
    "ikitai",
    "ikite",
    "ikita"
  ],
  "iki": [
    "ikimasu",
    "ikimashita",
    "ikimasen",
    "ikitai",
    "ikite",
    "ikita"
  ],
  "ikim": [
    "ikimasu",
    "ikimashita",
    "ikimasen"
  ],
  "ikit": [
    "ikitai",
    "ikite",
    "ikita"
  ],
  "ki": [
    "kimasu",
    "kimashita",
    "kimasen",
    "kitai",
    "kite",
    "kita",
    "kikimasu",
    "kikimashita",
    "kikimasen",
    "kikitai",
    "kikite",
    "kikita"
  ],
  "kim": [
    "kimasu",
    "kimashita",
    "kimasen"
  ],
  "kima": [
    "kimasu",
    "kimashita",
    "kimasen"
  ],
  "kit": [
    "kitai",
    "kite",
    "kita"
  ],
  "kita": [
    "kitai",
    "kita"
  ],
  "kite": [
    "kite"
  ],
  "mim": [
    "mimasu",
    "mimashita",
    "mimasen"
  ],
  "mima": [
    "mimasu",
    "mimashita",
    "mimasen"
  ],
  "mit": [
    "mitai",
    "mite",
    "mita"
  ],
  "mita": [
    "mitai",
    "mita"
  ],
  "mite": [
    "mite"
  ],
  "kik": [
    "kikimasu",
    "kikimashita",
    "kikimasen",
    "kikitai",
    "kikite",
    "kikita"
  ],
  "kiki": [
    "kikimasu",
    "kikimashita",
    "kikimasen",
    "kikitai",
    "kikite",
    "kikita"
  ],
  "han": [
    "hanashimasu",
    "hanashimashita",
    "hanashimasen",
    "hanashitai",
    "hanashite",
    "hanashita"
  ],
  "hana": [
    "hanashimasu",
    "hanashimashita",
    "hanashimasen",
    "hanashitai",
    "hanashite",
    "hanashita"
  ],
  "tab": [
    "tabemasu",
    "tabemashita",
    "tabemasen",
    "tabetai",
    "tabete",
    "tabeta"
  ],
  "tabe": [
    "tabemasu",
    "tabemashita",
    "tabemasen",
    "tabetai",
    "tabete",
    "tabeta"
  ],
  "no": [
    "nomimasu",
    "nomimashita",
    "nomimasen",
    "nomitai",
    "nomite",
    "nomita"
  ],
  "nom": [
    "nomimasu",
    "nomimashita",
    "nomimasen",
    "nomitai",
    "nomite",
    "nomita"
  ],
  "nomi": [
    "nomimasu",
    "nomimashita",
    "nomimasen",
    "nomitai",
    "nomite",
    "nomita"
  ],
  "kai": [
    "kaimasu",
    "kaimashita",
    "kaimasen",
    "kaitai",
    "kaite",
    "kaita"
  ],
  "kaim": [
    "kaimasu",
    "kaimashita",
    "kaimasen"
  ],
  "kait": [
    "kaitai",
    "kaite",
    "kaita"
  ],
  "mac": [
    "machimasu",
    "machimashita",
    "machimasen",
    "machitai",
    "machite",
    "machita"
  ],
  "mach": [
    "machimasu",
    "machimashita",
    "machimasen",
    "machitai",
    "machite",
    "machita"
  ],
  "de": [
    "dekimasu",
    "dekimashita",
    "dekimasen",
    "dekitai",
    "dekite",
    "dekita"
  ],
  "dek": [
    "dekimasu",
    "dekimashita",
    "dekimasen",
    "dekitai",
    "dekite",
    "dekita"
  ],
  "deki": [
    "dekimasu",
    "dekimashita",
    "dekimasen",
    "dekitai",
    "dekite",
    "dekita"
  ],
  "os": [
    "oshimasu",
    "oshimashita",
    "oshimasen",
    "oshitai",
    "oshite",
    "oshita"
  ],
  "osh": [
    "oshimasu",
    "oshimashita",
    "oshimasen",
    "oshitai",
    "oshite",
    "oshita"
  ],
  "oshi": [
    "oshimasu",
    "oshimashita",
    "oshimasen",
    "oshitai",
    "oshite",
    "oshita"
  ]
};
  const JA_WORD_SET = new Set(JA_WORDS);

  class JapaneseSubDirectory {
    constructor() {
      this.name = 'Japanese Romaji (日本語)';
      this.code = 'ja';
      this.badge = '日本語 Romaji';
      this.icon = 'fa-torii-gate';
      this.wordSet = JA_WORD_SET;
      this.typoMap = JA_TYPO_MAP;
      this.prefixTable = JA_PREFIX_TABLE;
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
      return /\b(konnichiwa|arigatou|ohayou|daijoubu|sugoi|yabai|kawaii|otsukare|gomennasai|sayonara|itadakimasu)\b/i.test(lower);
    }

    activate() {
      this.isActive = true;
      if (typeof window !== 'undefined') window.JA_SUBDIRECTORY_ACTIVE = true;
    }

    deactivate() {
      this.isActive = false;
      if (typeof window !== 'undefined') window.JA_SUBDIRECTORY_ACTIVE = false;
    }
  }

  const jaSubDir = new JapaneseSubDirectory();

  window.JA_WORDS = JA_WORDS;
  window.JA_TYPO_MAP = JA_TYPO_MAP;
  window.JA_WORD_SET = JA_WORD_SET;
  window.JA_PREFIX_TABLE = JA_PREFIX_TABLE;
  window.JA_SUBDIRECTORY = jaSubDir;
})();
