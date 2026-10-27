/**
 * NEXCHAT Multilingual Sub-Directory: Arabic (العربية) & Arabizi
 * Script: Arabic ([\u0600-\u06FF]) & Franco-Arabic (Arabizi)
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const AR_WORDS = [
  "مرحبا",
  "أهلا",
  "شكرا",
  "عفوا",
  "نعم",
  "لا",
  "كيف",
  "حالك",
  "تمام",
  "الحمد",
  "لله",
  "صباح",
  "الخير",
  "مساء",
  "النور",
  "مع",
  "السلامة",
  "إلى",
  "اللقاء",
  "حبيبي",
  "صديقي",
  "أخي",
  "أختي",
  "الله",
  "إن شاء الله",
  "ما شاء الله",
  "تبارك",
  "أين",
  "متى",
  "لماذا",
  "ماذا",
  "من",
  "كم",
  "هنا",
  "هناك",
  "الآن",
  "اليوم",
  "غدا",
  "أمس",
  "جميل",
  "كبير",
  "صغير",
  "جيد",
  "سريع",
  "بطيء",
  "رسالة",
  "هاتف",
  "عمل",
  "بيت",
  "طعام",
  "ماء",
  "أريد",
  "أحب",
  "أعرف",
  "أفهم",
  "أتكلم",
  "أذهب",
  "أجيء",
  "أشوف",
  "يلا",
  "خلاص",
  "marhaba",
  "ahlan",
  "shukran",
  "afwan",
  "naam",
  "laa",
  "kaifak",
  "kifak",
  "tamam",
  "alhamdulillah",
  "sabah",
  "kheir",
  "masa",
  "nour",
  "habibi",
  "habibti",
  "inshallah",
  "mashallah",
  "yalla",
  "khalas",
  "mabrook",
  "wallah",
  "fein",
  "wen",
  "leish",
  "shu",
  "eh",
  "la",
  "zein",
  "mnih",
  "kteer",
  "shwaya",
  "dakheelo",
  "ya rab",
  "salam"
];
  const AR_TYPO_MAP = {
  "مرسب": "مرحبا",
  "شكرن": "شكرا",
  "شكرآ": "شكرا",
  "انشاالله": "إن شاء الله",
  "ازيك": "إزيك",
  "يعطيك العافيه": "يعطيك العافية",
  "shkrn": "shukran",
  "hbb": "habibi",
  "inshala": "inshallah",
  "slm": "salam",
  "mrhb": "marhaba",
  "tmm": "tamam",
  "wlh": "wallah",
  "mabrul": "mabrook",
  "yala": "yalla",
  "khlas": "khalas"
};
  const AR_PREFIX_TABLE = {
  "مر": [
    "مرحبا"
  ],
  "مرح": [
    "مرحبا"
  ],
  "مرحب": [
    "مرحبا"
  ],
  "أه": [
    "أهلا"
  ],
  "أهل": [
    "أهلا"
  ],
  "أهلا": [
    "أهلا"
  ],
  "شك": [
    "شكرا"
  ],
  "شكر": [
    "شكرا"
  ],
  "شكرا": [
    "شكرا"
  ],
  "عف": [
    "عفوا"
  ],
  "عفو": [
    "عفوا"
  ],
  "عفوا": [
    "عفوا"
  ],
  "نع": [
    "نعم"
  ],
  "نعم": [
    "نعم"
  ],
  "لا": [
    "لا"
  ],
  "كي": [
    "كيف"
  ],
  "كيف": [
    "كيف"
  ],
  "حا": [
    "حالك"
  ],
  "حال": [
    "حالك"
  ],
  "حالك": [
    "حالك"
  ],
  "تم": [
    "تمام"
  ],
  "تما": [
    "تمام"
  ],
  "تمام": [
    "تمام"
  ],
  "ال": [
    "الحمد",
    "الخير",
    "النور",
    "السلامة",
    "اللقاء"
  ],
  "الح": [
    "الحمد"
  ],
  "الحم": [
    "الحمد"
  ],
  "لل": [
    "لله"
  ],
  "لله": [
    "لله"
  ],
  "صب": [
    "صباح"
  ],
  "صبا": [
    "صباح"
  ],
  "صباح": [
    "صباح"
  ],
  "الخ": [
    "الخير"
  ],
  "الخي": [
    "الخير"
  ],
  "مس": [
    "مساء"
  ],
  "مسا": [
    "مساء"
  ],
  "مساء": [
    "مساء"
  ],
  "الن": [
    "النور"
  ],
  "النو": [
    "النور"
  ],
  "مع": [
    "مع"
  ],
  "الس": [
    "السلامة"
  ],
  "السل": [
    "السلامة"
  ],
  "إل": [
    "إلى"
  ],
  "إلى": [
    "إلى"
  ],
  "الل": [
    "اللقاء",
    "الله"
  ],
  "اللق": [
    "اللقاء"
  ],
  "حب": [
    "حبيبي"
  ],
  "حبي": [
    "حبيبي"
  ],
  "حبيب": [
    "حبيبي"
  ],
  "صد": [
    "صديقي"
  ],
  "صدي": [
    "صديقي"
  ],
  "صديق": [
    "صديقي"
  ],
  "أخ": [
    "أخي",
    "أختي"
  ],
  "أخي": [
    "أخي"
  ],
  "أخت": [
    "أختي"
  ],
  "أختي": [
    "أختي"
  ],
  "الله": [
    "الله"
  ],
  "إن": [
    "إن شاء الله"
  ],
  "إن ": [
    "إن شاء الله"
  ],
  "إن ش": [
    "إن شاء الله"
  ],
  "ما": [
    "ما شاء الله",
    "ماذا",
    "ماء"
  ],
  "ما ": [
    "ما شاء الله"
  ],
  "ما ش": [
    "ما شاء الله"
  ],
  "تب": [
    "تبارك"
  ],
  "تبا": [
    "تبارك"
  ],
  "تبار": [
    "تبارك"
  ],
  "أي": [
    "أين"
  ],
  "أين": [
    "أين"
  ],
  "مت": [
    "متى"
  ],
  "متى": [
    "متى"
  ],
  "لم": [
    "لماذا"
  ],
  "لما": [
    "لماذا"
  ],
  "لماذ": [
    "لماذا"
  ],
  "ماذ": [
    "ماذا"
  ],
  "ماذا": [
    "ماذا"
  ],
  "من": [
    "من"
  ],
  "كم": [
    "كم"
  ],
  "هن": [
    "هنا",
    "هناك"
  ],
  "هنا": [
    "هنا",
    "هناك"
  ],
  "هناك": [
    "هناك"
  ],
  "الآ": [
    "الآن"
  ],
  "الآن": [
    "الآن"
  ],
  "الي": [
    "اليوم"
  ],
  "اليو": [
    "اليوم"
  ],
  "غد": [
    "غدا"
  ],
  "غدا": [
    "غدا"
  ],
  "أم": [
    "أمس"
  ],
  "أمس": [
    "أمس"
  ],
  "جم": [
    "جميل"
  ],
  "جمي": [
    "جميل"
  ],
  "جميل": [
    "جميل"
  ],
  "كب": [
    "كبير"
  ],
  "كبي": [
    "كبير"
  ],
  "كبير": [
    "كبير"
  ],
  "صغ": [
    "صغير"
  ],
  "صغي": [
    "صغير"
  ],
  "صغير": [
    "صغير"
  ],
  "جي": [
    "جيد"
  ],
  "جيد": [
    "جيد"
  ],
  "سر": [
    "سريع"
  ],
  "سري": [
    "سريع"
  ],
  "سريع": [
    "سريع"
  ],
  "بط": [
    "بطيء"
  ],
  "بطي": [
    "بطيء"
  ],
  "بطيء": [
    "بطيء"
  ],
  "رس": [
    "رسالة"
  ],
  "رسا": [
    "رسالة"
  ],
  "رسال": [
    "رسالة"
  ],
  "ها": [
    "هاتف"
  ],
  "هات": [
    "هاتف"
  ],
  "هاتف": [
    "هاتف"
  ],
  "عم": [
    "عمل"
  ],
  "عمل": [
    "عمل"
  ],
  "بي": [
    "بيت"
  ],
  "بيت": [
    "بيت"
  ],
  "طع": [
    "طعام"
  ],
  "طعا": [
    "طعام"
  ],
  "طعام": [
    "طعام"
  ],
  "ماء": [
    "ماء"
  ],
  "أر": [
    "أريد"
  ],
  "أري": [
    "أريد"
  ],
  "أريد": [
    "أريد"
  ],
  "أح": [
    "أحب"
  ],
  "أحب": [
    "أحب"
  ],
  "أع": [
    "أعرف"
  ],
  "أعر": [
    "أعرف"
  ],
  "أعرف": [
    "أعرف"
  ],
  "أف": [
    "أفهم"
  ],
  "أفه": [
    "أفهم"
  ],
  "أفهم": [
    "أفهم"
  ],
  "أت": [
    "أتكلم"
  ],
  "أتك": [
    "أتكلم"
  ],
  "أتكل": [
    "أتكلم"
  ],
  "أذ": [
    "أذهب"
  ],
  "أذه": [
    "أذهب"
  ],
  "أذهب": [
    "أذهب"
  ],
  "أج": [
    "أجيء"
  ],
  "أجي": [
    "أجيء"
  ],
  "أجيء": [
    "أجيء"
  ],
  "أش": [
    "أشوف"
  ],
  "أشو": [
    "أشوف"
  ],
  "أشوف": [
    "أشوف"
  ],
  "يل": [
    "يلا"
  ],
  "يلا": [
    "يلا"
  ],
  "خل": [
    "خلاص"
  ],
  "خلا": [
    "خلاص"
  ],
  "خلاص": [
    "خلاص"
  ],
  "ma": [
    "marhaba",
    "masa",
    "mashallah",
    "mabrook"
  ],
  "mar": [
    "marhaba"
  ],
  "marh": [
    "marhaba"
  ],
  "ah": [
    "ahlan"
  ],
  "ahl": [
    "ahlan"
  ],
  "ahla": [
    "ahlan"
  ],
  "sh": [
    "shukran",
    "shu",
    "shwaya"
  ],
  "shu": [
    "shukran",
    "shu"
  ],
  "shuk": [
    "shukran"
  ],
  "af": [
    "afwan"
  ],
  "afw": [
    "afwan"
  ],
  "afwa": [
    "afwan"
  ],
  "na": [
    "naam"
  ],
  "naa": [
    "naam"
  ],
  "naam": [
    "naam"
  ],
  "la": [
    "laa",
    "la"
  ],
  "laa": [
    "laa"
  ],
  "ka": [
    "kaifak"
  ],
  "kai": [
    "kaifak"
  ],
  "kaif": [
    "kaifak"
  ],
  "ki": [
    "kifak"
  ],
  "kif": [
    "kifak"
  ],
  "kifa": [
    "kifak"
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
  "al": [
    "alhamdulillah"
  ],
  "alh": [
    "alhamdulillah"
  ],
  "alha": [
    "alhamdulillah"
  ],
  "sa": [
    "sabah",
    "salam"
  ],
  "sab": [
    "sabah"
  ],
  "saba": [
    "sabah"
  ],
  "kh": [
    "kheir",
    "khalas"
  ],
  "khe": [
    "kheir"
  ],
  "khei": [
    "kheir"
  ],
  "mas": [
    "masa",
    "mashallah"
  ],
  "masa": [
    "masa"
  ],
  "no": [
    "nour"
  ],
  "nou": [
    "nour"
  ],
  "nour": [
    "nour"
  ],
  "ha": [
    "habibi",
    "habibti"
  ],
  "hab": [
    "habibi",
    "habibti"
  ],
  "habi": [
    "habibi",
    "habibti"
  ],
  "in": [
    "inshallah"
  ],
  "ins": [
    "inshallah"
  ],
  "insh": [
    "inshallah"
  ],
  "mash": [
    "mashallah"
  ],
  "ya": [
    "yalla",
    "ya rab"
  ],
  "yal": [
    "yalla"
  ],
  "yall": [
    "yalla"
  ],
  "kha": [
    "khalas"
  ],
  "khal": [
    "khalas"
  ],
  "mab": [
    "mabrook"
  ],
  "mabr": [
    "mabrook"
  ],
  "wa": [
    "wallah"
  ],
  "wal": [
    "wallah"
  ],
  "wall": [
    "wallah"
  ],
  "fe": [
    "fein"
  ],
  "fei": [
    "fein"
  ],
  "fein": [
    "fein"
  ],
  "we": [
    "wen"
  ],
  "wen": [
    "wen"
  ],
  "le": [
    "leish"
  ],
  "lei": [
    "leish"
  ],
  "leis": [
    "leish"
  ],
  "eh": [
    "eh"
  ],
  "ze": [
    "zein"
  ],
  "zei": [
    "zein"
  ],
  "zein": [
    "zein"
  ],
  "mn": [
    "mnih"
  ],
  "mni": [
    "mnih"
  ],
  "mnih": [
    "mnih"
  ],
  "kt": [
    "kteer"
  ],
  "kte": [
    "kteer"
  ],
  "ktee": [
    "kteer"
  ],
  "shw": [
    "shwaya"
  ],
  "shwa": [
    "shwaya"
  ],
  "da": [
    "dakheelo"
  ],
  "dak": [
    "dakheelo"
  ],
  "dakh": [
    "dakheelo"
  ],
  "ya ": [
    "ya rab"
  ],
  "ya r": [
    "ya rab"
  ],
  "sal": [
    "salam"
  ],
  "sala": [
    "salam"
  ]
};

  const AR_WORD_SET = new Set(AR_WORDS.map(w => w.toLowerCase()));
  const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF]/;

  class ArabicSubDirectory {
    constructor() {
      this.name = 'Arabic (العربية)';
      this.code = 'ar';
      this.badge = 'العربية';
      this.wordSet = AR_WORD_SET;
      this.typoMap = AR_TYPO_MAP;
      this.prefixTable = AR_PREFIX_TABLE;
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
      if (ARABIC_SCRIPT_REGEX.test(text)) return true;
      return /\b(shukran|habibi|inshallah|marhaba|yalla|khalas|tamam|kaifak|ahlan)\b/i.test(text);
    }

    activate() {
      this.isActive = true;
      if (typeof window !== 'undefined') window.AR_SUBDIRECTORY_ACTIVE = true;
    }

    deactivate() {
      this.isActive = false;
      if (typeof window !== 'undefined') window.AR_SUBDIRECTORY_ACTIVE = false;
    }
  }

  const arSubDir = new ArabicSubDirectory();

  window.AR_WORDS = AR_WORDS;
  window.AR_TYPO_MAP = AR_TYPO_MAP;
  window.AR_WORD_SET = AR_WORD_SET;
  window.AR_PREFIX_TABLE = AR_PREFIX_TABLE;
  window.AR_SUBDIRECTORY = arSubDir;
})();
