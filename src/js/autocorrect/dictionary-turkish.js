/**
 * NEXCHAT Multilingual Sub-Directory: Turkish (Türkçe)
 * High-Speed O(1) Prefix-Indexed Turkish Lexicon & Slang
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const TR_WORDS = [
  "merhaba",
  "selam",
  "teşekkürler",
  "sağol",
  "lütfen",
  "nasılsın",
  "iyiyim",
  "günaydın",
  "iyi akşamlar",
  "iyi geceler",
  "görüşürüz",
  "tamam",
  "evet",
  "hayır",
  "bilmiyorum",
  "harika",
  "güzel",
  "kolay gelsin",
  "hoşça kal",
  "afiyet olsun",
  "inşallah",
  "eyvallah",
  "kardeşim",
  "dostum",
  "arkadaş",
  "yardım",
  "sorun",
  "zaman",
  "şimdi",
  "bugün",
  "yarın",
  "dün",
  "ev",
  "iş",
  "para",
  "yemek",
  "su",
  "çay",
  "kahve",
  "mesaj",
  "telefon",
  "araba",
  "yol",
  "ne",
  "nasıl",
  "neden",
  "nerede",
  "kim",
  "kaç",
  "çok",
  "az",
  "biraz",
  "büyük",
  "küçük",
  "yeni",
  "eski",
  "doğru",
  "yanlış",
  "hızlı",
  "yavaş"
];
  const TR_TYPO_MAP = {
  "mrb": "merhaba",
  "slm": "selam",
  "tşk": "teşekkürler",
  "tşkler": "teşekkürler",
  "nslsn": "nasılsın",
  "iym": "iyiyim",
  "tmm": "tamam",
  "grsrz": "görüşürüz",
  "eyw": "eyvallah",
  "nbr": "ne haber",
  "ii": "iyi",
  "kib": "kendine iyi bak",
  "hoscakal": "hoşça kal",
  "gunaydin": "günaydın",
  "tesekkur": "teşekkürler"
};
  const TR_PREFIX_TABLE = {
  "me": [
    "merhaba",
    "mesaj"
  ],
  "mer": [
    "merhaba"
  ],
  "merh": [
    "merhaba"
  ],
  "se": [
    "selam"
  ],
  "sel": [
    "selam"
  ],
  "sela": [
    "selam"
  ],
  "te": [
    "teşekkürler",
    "telefon"
  ],
  "teş": [
    "teşekkürler"
  ],
  "teşe": [
    "teşekkürler"
  ],
  "sa": [
    "sağol"
  ],
  "sağ": [
    "sağol"
  ],
  "sağo": [
    "sağol"
  ],
  "lü": [
    "lütfen"
  ],
  "lüt": [
    "lütfen"
  ],
  "lütf": [
    "lütfen"
  ],
  "na": [
    "nasılsın",
    "nasıl"
  ],
  "nas": [
    "nasılsın",
    "nasıl"
  ],
  "nası": [
    "nasılsın",
    "nasıl"
  ],
  "iy": [
    "iyiyim",
    "iyi akşamlar",
    "iyi geceler"
  ],
  "iyi": [
    "iyiyim",
    "iyi akşamlar",
    "iyi geceler"
  ],
  "iyiy": [
    "iyiyim"
  ],
  "gü": [
    "günaydın",
    "güzel"
  ],
  "gün": [
    "günaydın"
  ],
  "güna": [
    "günaydın"
  ],
  "iyi ": [
    "iyi akşamlar",
    "iyi geceler"
  ],
  "gö": [
    "görüşürüz"
  ],
  "gör": [
    "görüşürüz"
  ],
  "görü": [
    "görüşürüz"
  ],
  "ta": [
    "tamam"
  ],
  "tam": [
    "tamam"
  ],
  "tama": [
    "tamam"
  ],
  "ev": [
    "evet",
    "ev"
  ],
  "eve": [
    "evet"
  ],
  "evet": [
    "evet"
  ],
  "ha": [
    "hayır",
    "harika"
  ],
  "hay": [
    "hayır"
  ],
  "hayı": [
    "hayır"
  ],
  "bi": [
    "bilmiyorum",
    "biraz"
  ],
  "bil": [
    "bilmiyorum"
  ],
  "bilm": [
    "bilmiyorum"
  ],
  "har": [
    "harika"
  ],
  "hari": [
    "harika"
  ],
  "güz": [
    "güzel"
  ],
  "güze": [
    "güzel"
  ],
  "ko": [
    "kolay gelsin"
  ],
  "kol": [
    "kolay gelsin"
  ],
  "kola": [
    "kolay gelsin"
  ],
  "ho": [
    "hoşça kal"
  ],
  "hoş": [
    "hoşça kal"
  ],
  "hoşç": [
    "hoşça kal"
  ],
  "af": [
    "afiyet olsun"
  ],
  "afi": [
    "afiyet olsun"
  ],
  "afiy": [
    "afiyet olsun"
  ],
  "in": [
    "inşallah"
  ],
  "inş": [
    "inşallah"
  ],
  "inşa": [
    "inşallah"
  ],
  "ey": [
    "eyvallah"
  ],
  "eyv": [
    "eyvallah"
  ],
  "eyva": [
    "eyvallah"
  ],
  "ka": [
    "kardeşim",
    "kahve",
    "kaç"
  ],
  "kar": [
    "kardeşim"
  ],
  "kard": [
    "kardeşim"
  ],
  "do": [
    "dostum",
    "doğru"
  ],
  "dos": [
    "dostum"
  ],
  "dost": [
    "dostum"
  ],
  "ar": [
    "arkadaş",
    "araba"
  ],
  "ark": [
    "arkadaş"
  ],
  "arka": [
    "arkadaş"
  ],
  "ya": [
    "yardım",
    "yarın",
    "yanlış",
    "yavaş"
  ],
  "yar": [
    "yardım",
    "yarın"
  ],
  "yard": [
    "yardım"
  ],
  "so": [
    "sorun"
  ],
  "sor": [
    "sorun"
  ],
  "soru": [
    "sorun"
  ],
  "za": [
    "zaman"
  ],
  "zam": [
    "zaman"
  ],
  "zama": [
    "zaman"
  ],
  "şi": [
    "şimdi"
  ],
  "şim": [
    "şimdi"
  ],
  "şimd": [
    "şimdi"
  ],
  "bu": [
    "bugün"
  ],
  "bug": [
    "bugün"
  ],
  "bugü": [
    "bugün"
  ],
  "yarı": [
    "yarın"
  ],
  "dü": [
    "dün"
  ],
  "dün": [
    "dün"
  ],
  "iş": [
    "iş"
  ],
  "pa": [
    "para"
  ],
  "par": [
    "para"
  ],
  "para": [
    "para"
  ],
  "ye": [
    "yemek",
    "yeni"
  ],
  "yem": [
    "yemek"
  ],
  "yeme": [
    "yemek"
  ],
  "su": [
    "su"
  ],
  "ça": [
    "çay"
  ],
  "çay": [
    "çay"
  ],
  "kah": [
    "kahve"
  ],
  "kahv": [
    "kahve"
  ],
  "mes": [
    "mesaj"
  ],
  "mesa": [
    "mesaj"
  ],
  "tel": [
    "telefon"
  ],
  "tele": [
    "telefon"
  ],
  "ara": [
    "araba"
  ],
  "arab": [
    "araba"
  ],
  "yo": [
    "yol"
  ],
  "yol": [
    "yol"
  ],
  "ne": [
    "ne",
    "neden",
    "nerede"
  ],
  "ned": [
    "neden"
  ],
  "nede": [
    "neden"
  ],
  "ner": [
    "nerede"
  ],
  "nere": [
    "nerede"
  ],
  "ki": [
    "kim"
  ],
  "kim": [
    "kim"
  ],
  "kaç": [
    "kaç"
  ],
  "ço": [
    "çok"
  ],
  "çok": [
    "çok"
  ],
  "az": [
    "az"
  ],
  "bir": [
    "biraz"
  ],
  "bira": [
    "biraz"
  ],
  "bü": [
    "büyük"
  ],
  "büy": [
    "büyük"
  ],
  "büyü": [
    "büyük"
  ],
  "kü": [
    "küçük"
  ],
  "küç": [
    "küçük"
  ],
  "küçü": [
    "küçük"
  ],
  "yen": [
    "yeni"
  ],
  "yeni": [
    "yeni"
  ],
  "es": [
    "eski"
  ],
  "esk": [
    "eski"
  ],
  "eski": [
    "eski"
  ],
  "doğ": [
    "doğru"
  ],
  "doğr": [
    "doğru"
  ],
  "yan": [
    "yanlış"
  ],
  "yanl": [
    "yanlış"
  ],
  "hı": [
    "hızlı"
  ],
  "hız": [
    "hızlı"
  ],
  "hızl": [
    "hızlı"
  ],
  "yav": [
    "yavaş"
  ],
  "yava": [
    "yavaş"
  ]
};

  const TR_WORD_SET = new Set(TR_WORDS.map(w => w.toLowerCase()));

  class TurkishSubDirectory {
    constructor() {
      this.name = 'Turkish (Türkçe)';
      this.code = 'tr';
      this.badge = 'Türkçe';
      this.wordSet = TR_WORD_SET;
      this.typoMap = TR_TYPO_MAP;
      this.prefixTable = TR_PREFIX_TABLE;
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
      if (/[çğıöşü]/.test(lower)) return true;
      return /\b(merhaba|nasılsın|teşekkürler|tamam|evet|hayır|görüşürüz|eyvallah)\b/i.test(lower);
    }

    activate() {
      this.isActive = true;
      if (typeof window !== 'undefined') window.TR_SUBDIRECTORY_ACTIVE = true;
    }

    deactivate() {
      this.isActive = false;
      if (typeof window !== 'undefined') window.TR_SUBDIRECTORY_ACTIVE = false;
    }
  }

  const trSubDir = new TurkishSubDirectory();

  window.TR_WORDS = TR_WORDS;
  window.TR_TYPO_MAP = TR_TYPO_MAP;
  window.TR_WORD_SET = TR_WORD_SET;
  window.TR_PREFIX_TABLE = TR_PREFIX_TABLE;
  window.TR_SUBDIRECTORY = trSubDir;
})();
