/**
 * NEXCHAT Multilingual Sub-Directory: Swahili (Kiswahili) & Sheng (Deepened)
 * High-Speed O(1) Prefix-Indexed Radix Engine
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
  "kwaheri",
  "ndiyo",
  "hapana",
  "nzuri",
  "salama",
  "sawa",
  "tafadhali",
  "pole",
  "rafiki",
  "kaka",
  "dada",
  "mama",
  "baba",
  "mtoto",
  "leo",
  "jana",
  "kesho",
  "sasa",
  "baadaye",
  "asubuhi",
  "mchana",
  "jioni",
  "usiku",
  "kazi",
  "nyumbani",
  "shule",
  "pesa",
  "safari",
  "gari",
  "chakula",
  "maji",
  "chai",
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
  "haraka",
  "fit",
  "fiti",
  "maze",
  "mbogi",
  "manzi",
  "buda",
  "chapaa",
  "ganji",
  "morio",
  "beshte",
  "rada",
  "cheki",
  "lugha",
  "ngoma",
  "shika",
  "form",
  "niaje",
  "ninajua",
  "unajua",
  "anajua",
  "tunajua",
  "wanajua",
  "nilijua",
  "ulijua",
  "alijua",
  "tulijua",
  "walijua",
  "nitajua",
  "utajua",
  "atajua",
  "tutajua",
  "watajua",
  "kujua",
  "ninaona",
  "unaona",
  "anaona",
  "tunaona",
  "wanaona",
  "niliona",
  "uliona",
  "aliona",
  "tuliona",
  "waliona",
  "nitaona",
  "utaona",
  "ataona",
  "tutaona",
  "wataona",
  "kuona",
  "ninataka",
  "unataka",
  "anataka",
  "tunataka",
  "wanataka",
  "nilitaka",
  "ulitaka",
  "alitaka",
  "tulitaka",
  "walitaka",
  "nitataka",
  "utataka",
  "atataka",
  "tutataka",
  "watataka",
  "kutaka",
  "ninaenda",
  "unaenda",
  "anaenda",
  "tunaenda",
  "wanaenda",
  "nilienda",
  "ulienda",
  "alienda",
  "tulienda",
  "walienda",
  "nitaenda",
  "utaenda",
  "ataenda",
  "tutaenda",
  "wataenda",
  "kuenda",
  "ninakuja",
  "unakuja",
  "anakuja",
  "tunakuja",
  "wanakuja",
  "nilikuja",
  "ulikuja",
  "alikuja",
  "tulikuja",
  "walikuja",
  "nitakuja",
  "utakuja",
  "atakuja",
  "tutakuja",
  "watakuja",
  "kukuja",
  "ninakula",
  "unakula",
  "anakula",
  "tunakula",
  "wanakula",
  "nilikula",
  "ulikula",
  "alikula",
  "tulikula",
  "walikula",
  "nitakula",
  "utakula",
  "atakula",
  "tutakula",
  "watakula",
  "kukula",
  "ninakunywa",
  "unakunywa",
  "anakunywa",
  "tunakunywa",
  "wanakunywa",
  "nilikunywa",
  "ulikunywa",
  "alikunywa",
  "tulikunywa",
  "walikunywa",
  "nitakunywa",
  "utakunywa",
  "atakunywa",
  "tutakunywa",
  "watakunywa",
  "kukunywa",
  "ninafanya",
  "unafanya",
  "anafanya",
  "tunafanya",
  "wanafanya",
  "nilifanya",
  "ulifanya",
  "alifanya",
  "tulifanya",
  "walifanya",
  "nitafanya",
  "utafanya",
  "atafanya",
  "tutafanya",
  "watafanya",
  "kufanya",
  "ninasema",
  "unasema",
  "anasema",
  "tunasema",
  "wanasema",
  "nilisema",
  "ulisema",
  "alisema",
  "tulisema",
  "walisema",
  "nitasema",
  "utasema",
  "atasema",
  "tutasema",
  "watasema",
  "kusema",
  "ninasikia",
  "unasikia",
  "anasikia",
  "tunasikia",
  "wanasikia",
  "nilisikia",
  "ulisikia",
  "alisikia",
  "tulisikia",
  "walisikia",
  "nitasikia",
  "utasikia",
  "atasikia",
  "tutasikia",
  "watasikia",
  "kusikia",
  "ninasoma",
  "unasoma",
  "anasoma",
  "tunasoma",
  "wanasoma",
  "nilisoma",
  "ulisoma",
  "alisoma",
  "tulisoma",
  "walisoma",
  "nitasoma",
  "utasoma",
  "atasoma",
  "tutasoma",
  "watasoma",
  "kusoma",
  "ninaandika",
  "unaandika",
  "anaandika",
  "tunaandika",
  "wanaandika",
  "niliandika",
  "uliandika",
  "aliandika",
  "tuliandika",
  "waliandika",
  "nitaandika",
  "utaandika",
  "ataandika",
  "tutaandika",
  "wataandika",
  "kuandika",
  "ninapenda",
  "unapenda",
  "anapenda",
  "tunapenda",
  "wanapenda",
  "nilipenda",
  "ulipenda",
  "alipenda",
  "tulipenda",
  "walipenda",
  "nitapenda",
  "utapenda",
  "atapenda",
  "tutapenda",
  "watapenda",
  "kupenda",
  "ninakaa",
  "unakaa",
  "anakaa",
  "tunakaa",
  "wanakaa",
  "nilikaa",
  "ulikaa",
  "alikaa",
  "tulikaa",
  "walikaa",
  "nitakaa",
  "utakaa",
  "atakaa",
  "tutakaa",
  "watakaa",
  "kukaa",
  "ninalala",
  "unalala",
  "analala",
  "tunalala",
  "wanalala",
  "nililala",
  "ulilala",
  "alilala",
  "tulilala",
  "walilala",
  "nitalala",
  "utalala",
  "atalala",
  "tutalala",
  "watalala",
  "kulala"
];
  const SW_TYPO_MAP = {
  "hbr": "habari",
  "mmb": "mambo",
  "asnt": "asante",
  "krb": "karibu",
  "kwhr": "kwaheri",
  "tfd": "tafadhali",
  "ndio": "ndiyo",
  "thx": "asante",
  "ty": "asante",
  "asantesana": "asante sana",
  "sana": "sana sana",
  "msee": "mtu",
  "beshte": "rafiki",
  "chapaa": "pesa",
  "niaje": "habari yako",
  "poa": "safi sana",
  "fiti": "vizuri",
  "habri": "habari",
  "asnte": "asante",
  "karbu": "karibu",
  "rafki": "rafiki",
  "nyumbn": "nyumbani",
  "chakla": "chakula"
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
    "maji",
    "maze",
    "manzi"
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
    "asante",
    "asubuhi"
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
    "kazi"
  ],
  "kar": [
    "karibu"
  ],
  "kari": [
    "karibu"
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
    "salama",
    "sawa",
    "sasa",
    "safari"
  ],
  "sal": [
    "salama"
  ],
  "sala": [
    "salama"
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
  "pol": [
    "pole"
  ],
  "pole": [
    "pole"
  ],
  "ra": [
    "rafiki",
    "rada"
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
  "mama": [
    "mama"
  ],
  "ba": [
    "baba",
    "baadaye"
  ],
  "bab": [
    "baba"
  ],
  "baba": [
    "baba"
  ],
  "mt": [
    "mtoto"
  ],
  "mto": [
    "mtoto"
  ],
  "mtot": [
    "mtoto"
  ],
  "le": [
    "leo"
  ],
  "leo": [
    "leo"
  ],
  "ja": [
    "jana"
  ],
  "jan": [
    "jana"
  ],
  "jana": [
    "jana"
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
  "sas": [
    "sasa"
  ],
  "sasa": [
    "sasa"
  ],
  "baa": [
    "baadaye"
  ],
  "baad": [
    "baadaye"
  ],
  "asu": [
    "asubuhi"
  ],
  "asub": [
    "asubuhi"
  ],
  "mc": [
    "mchana"
  ],
  "mch": [
    "mchana"
  ],
  "mcha": [
    "mchana"
  ],
  "ji": [
    "jioni"
  ],
  "jio": [
    "jioni"
  ],
  "jion": [
    "jioni"
  ],
  "us": [
    "usiku"
  ],
  "usi": [
    "usiku"
  ],
  "usik": [
    "usiku"
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
  "sh": [
    "shule",
    "shika"
  ],
  "shu": [
    "shule"
  ],
  "shul": [
    "shule"
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
  "ga": [
    "gari",
    "ganji"
  ],
  "gar": [
    "gari"
  ],
  "gari": [
    "gari"
  ],
  "ch": [
    "chakula",
    "chai",
    "chapaa",
    "cheki"
  ],
  "cha": [
    "chakula",
    "chai",
    "chapaa"
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
    "nini",
    "niaje",
    "ninajua",
    "nilijua",
    "nitajua",
    "ninaona",
    "niliona",
    "nitaona",
    "ninataka",
    "nilitaka",
    "nitataka",
    "ninaenda",
    "nilienda",
    "nitaenda",
    "ninakuja"
  ],
  "nin": [
    "nini",
    "ninajua",
    "ninaona",
    "ninataka",
    "ninaenda",
    "ninakuja",
    "ninakula",
    "ninakunywa",
    "ninafanya",
    "ninasema",
    "ninasikia",
    "ninasoma",
    "ninaandika",
    "ninapenda",
    "ninakaa"
  ],
  "nini": [
    "nini"
  ],
  "wa": [
    "wapi",
    "wanajua",
    "walijua",
    "watajua",
    "wanaona",
    "waliona",
    "wataona",
    "wanataka",
    "walitaka",
    "watataka",
    "wanaenda",
    "walienda",
    "wataenda",
    "wanakuja",
    "walikuja"
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
    "ngapi",
    "ngoma"
  ],
  "nga": [
    "ngapi"
  ],
  "ngap": [
    "ngapi"
  ],
  "ku": [
    "kubwa",
    "kujua",
    "kuona",
    "kutaka",
    "kuenda",
    "kukuja",
    "kukula",
    "kukunywa",
    "kufanya",
    "kusema",
    "kusikia",
    "kusoma",
    "kuandika",
    "kupenda",
    "kukaa"
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
  "har": [
    "haraka"
  ],
  "hara": [
    "haraka"
  ],
  "fi": [
    "fit",
    "fiti"
  ],
  "fit": [
    "fit",
    "fiti"
  ],
  "fiti": [
    "fiti"
  ],
  "maz": [
    "maze"
  ],
  "maze": [
    "maze"
  ],
  "mb": [
    "mbogi"
  ],
  "mbo": [
    "mbogi"
  ],
  "mbog": [
    "mbogi"
  ],
  "man": [
    "manzi"
  ],
  "manz": [
    "manzi"
  ],
  "bu": [
    "buda"
  ],
  "bud": [
    "buda"
  ],
  "buda": [
    "buda"
  ],
  "chap": [
    "chapaa"
  ],
  "gan": [
    "ganji"
  ],
  "ganj": [
    "ganji"
  ],
  "mo": [
    "morio"
  ],
  "mor": [
    "morio"
  ],
  "mori": [
    "morio"
  ],
  "be": [
    "beshte"
  ],
  "bes": [
    "beshte"
  ],
  "besh": [
    "beshte"
  ],
  "rad": [
    "rada"
  ],
  "rada": [
    "rada"
  ],
  "che": [
    "cheki"
  ],
  "chek": [
    "cheki"
  ],
  "lu": [
    "lugha"
  ],
  "lug": [
    "lugha"
  ],
  "lugh": [
    "lugha"
  ],
  "ngo": [
    "ngoma"
  ],
  "ngom": [
    "ngoma"
  ],
  "shi": [
    "shika"
  ],
  "shik": [
    "shika"
  ],
  "fo": [
    "form"
  ],
  "for": [
    "form"
  ],
  "form": [
    "form"
  ],
  "nia": [
    "niaje"
  ],
  "niaj": [
    "niaje"
  ],
  "nina": [
    "ninajua",
    "ninaona",
    "ninataka",
    "ninaenda",
    "ninakuja",
    "ninakula",
    "ninakunywa",
    "ninafanya",
    "ninasema",
    "ninasikia",
    "ninasoma",
    "ninaandika",
    "ninapenda",
    "ninakaa",
    "ninalala"
  ],
  "un": [
    "unajua",
    "unaona",
    "unataka",
    "unaenda",
    "unakuja",
    "unakula",
    "unakunywa",
    "unafanya",
    "unasema",
    "unasikia",
    "unasoma",
    "unaandika",
    "unapenda",
    "unakaa",
    "unalala"
  ],
  "una": [
    "unajua",
    "unaona",
    "unataka",
    "unaenda",
    "unakuja",
    "unakula",
    "unakunywa",
    "unafanya",
    "unasema",
    "unasikia",
    "unasoma",
    "unaandika",
    "unapenda",
    "unakaa",
    "unalala"
  ],
  "unaj": [
    "unajua"
  ],
  "an": [
    "anajua",
    "anaona",
    "anataka",
    "anaenda",
    "anakuja",
    "anakula",
    "anakunywa",
    "anafanya",
    "anasema",
    "anasikia",
    "anasoma",
    "anaandika",
    "anapenda",
    "anakaa",
    "analala"
  ],
  "ana": [
    "anajua",
    "anaona",
    "anataka",
    "anaenda",
    "anakuja",
    "anakula",
    "anakunywa",
    "anafanya",
    "anasema",
    "anasikia",
    "anasoma",
    "anaandika",
    "anapenda",
    "anakaa",
    "analala"
  ],
  "anaj": [
    "anajua"
  ],
  "tu": [
    "tunajua",
    "tulijua",
    "tutajua",
    "tunaona",
    "tuliona",
    "tutaona",
    "tunataka",
    "tulitaka",
    "tutataka",
    "tunaenda",
    "tulienda",
    "tutaenda",
    "tunakuja",
    "tulikuja",
    "tutakuja"
  ],
  "tun": [
    "tunajua",
    "tunaona",
    "tunataka",
    "tunaenda",
    "tunakuja",
    "tunakula",
    "tunakunywa",
    "tunafanya",
    "tunasema",
    "tunasikia",
    "tunasoma",
    "tunaandika",
    "tunapenda",
    "tunakaa",
    "tunalala"
  ],
  "tuna": [
    "tunajua",
    "tunaona",
    "tunataka",
    "tunaenda",
    "tunakuja",
    "tunakula",
    "tunakunywa",
    "tunafanya",
    "tunasema",
    "tunasikia",
    "tunasoma",
    "tunaandika",
    "tunapenda",
    "tunakaa",
    "tunalala"
  ],
  "wan": [
    "wanajua",
    "wanaona",
    "wanataka",
    "wanaenda",
    "wanakuja",
    "wanakula",
    "wanakunywa",
    "wanafanya",
    "wanasema",
    "wanasikia",
    "wanasoma",
    "wanaandika",
    "wanapenda",
    "wanakaa",
    "wanalala"
  ],
  "wana": [
    "wanajua",
    "wanaona",
    "wanataka",
    "wanaenda",
    "wanakuja",
    "wanakula",
    "wanakunywa",
    "wanafanya",
    "wanasema",
    "wanasikia",
    "wanasoma",
    "wanaandika",
    "wanapenda",
    "wanakaa",
    "wanalala"
  ],
  "nil": [
    "nilijua",
    "niliona",
    "nilitaka",
    "nilienda",
    "nilikuja",
    "nilikula",
    "nilikunywa",
    "nilifanya",
    "nilisema",
    "nilisikia",
    "nilisoma",
    "niliandika",
    "nilipenda",
    "nilikaa",
    "nililala"
  ],
  "nili": [
    "nilijua",
    "niliona",
    "nilitaka",
    "nilienda",
    "nilikuja",
    "nilikula",
    "nilikunywa",
    "nilifanya",
    "nilisema",
    "nilisikia",
    "nilisoma",
    "niliandika",
    "nilipenda",
    "nilikaa",
    "nililala"
  ],
  "ul": [
    "ulijua",
    "uliona",
    "ulitaka",
    "ulienda",
    "ulikuja",
    "ulikula",
    "ulikunywa",
    "ulifanya",
    "ulisema",
    "ulisikia",
    "ulisoma",
    "uliandika",
    "ulipenda",
    "ulikaa",
    "ulilala"
  ],
  "uli": [
    "ulijua",
    "uliona",
    "ulitaka",
    "ulienda",
    "ulikuja",
    "ulikula",
    "ulikunywa",
    "ulifanya",
    "ulisema",
    "ulisikia",
    "ulisoma",
    "uliandika",
    "ulipenda",
    "ulikaa",
    "ulilala"
  ],
  "ulij": [
    "ulijua"
  ],
  "al": [
    "alijua",
    "aliona",
    "alitaka",
    "alienda",
    "alikuja",
    "alikula",
    "alikunywa",
    "alifanya",
    "alisema",
    "alisikia",
    "alisoma",
    "aliandika",
    "alipenda",
    "alikaa",
    "alilala"
  ],
  "ali": [
    "alijua",
    "aliona",
    "alitaka",
    "alienda",
    "alikuja",
    "alikula",
    "alikunywa",
    "alifanya",
    "alisema",
    "alisikia",
    "alisoma",
    "aliandika",
    "alipenda",
    "alikaa",
    "alilala"
  ],
  "alij": [
    "alijua"
  ],
  "tul": [
    "tulijua",
    "tuliona",
    "tulitaka",
    "tulienda",
    "tulikuja",
    "tulikula",
    "tulikunywa",
    "tulifanya",
    "tulisema",
    "tulisikia",
    "tulisoma",
    "tuliandika",
    "tulipenda",
    "tulikaa",
    "tulilala"
  ],
  "tuli": [
    "tulijua",
    "tuliona",
    "tulitaka",
    "tulienda",
    "tulikuja",
    "tulikula",
    "tulikunywa",
    "tulifanya",
    "tulisema",
    "tulisikia",
    "tulisoma",
    "tuliandika",
    "tulipenda",
    "tulikaa",
    "tulilala"
  ],
  "wal": [
    "walijua",
    "waliona",
    "walitaka",
    "walienda",
    "walikuja",
    "walikula",
    "walikunywa",
    "walifanya",
    "walisema",
    "walisikia",
    "walisoma",
    "waliandika",
    "walipenda",
    "walikaa",
    "walilala"
  ],
  "wali": [
    "walijua",
    "waliona",
    "walitaka",
    "walienda",
    "walikuja",
    "walikula",
    "walikunywa",
    "walifanya",
    "walisema",
    "walisikia",
    "walisoma",
    "waliandika",
    "walipenda",
    "walikaa",
    "walilala"
  ],
  "nit": [
    "nitajua",
    "nitaona",
    "nitataka",
    "nitaenda",
    "nitakuja",
    "nitakula",
    "nitakunywa",
    "nitafanya",
    "nitasema",
    "nitasikia",
    "nitasoma",
    "nitaandika",
    "nitapenda",
    "nitakaa",
    "nitalala"
  ],
  "nita": [
    "nitajua",
    "nitaona",
    "nitataka",
    "nitaenda",
    "nitakuja",
    "nitakula",
    "nitakunywa",
    "nitafanya",
    "nitasema",
    "nitasikia",
    "nitasoma",
    "nitaandika",
    "nitapenda",
    "nitakaa",
    "nitalala"
  ],
  "ut": [
    "utajua",
    "utaona",
    "utataka",
    "utaenda",
    "utakuja",
    "utakula",
    "utakunywa",
    "utafanya",
    "utasema",
    "utasikia",
    "utasoma",
    "utaandika",
    "utapenda",
    "utakaa",
    "utalala"
  ],
  "uta": [
    "utajua",
    "utaona",
    "utataka",
    "utaenda",
    "utakuja",
    "utakula",
    "utakunywa",
    "utafanya",
    "utasema",
    "utasikia",
    "utasoma",
    "utaandika",
    "utapenda",
    "utakaa",
    "utalala"
  ],
  "utaj": [
    "utajua"
  ],
  "at": [
    "atajua",
    "ataona",
    "atataka",
    "ataenda",
    "atakuja",
    "atakula",
    "atakunywa",
    "atafanya",
    "atasema",
    "atasikia",
    "atasoma",
    "ataandika",
    "atapenda",
    "atakaa",
    "atalala"
  ],
  "ata": [
    "atajua",
    "ataona",
    "atataka",
    "ataenda",
    "atakuja",
    "atakula",
    "atakunywa",
    "atafanya",
    "atasema",
    "atasikia",
    "atasoma",
    "ataandika",
    "atapenda",
    "atakaa",
    "atalala"
  ],
  "ataj": [
    "atajua"
  ],
  "tut": [
    "tutajua",
    "tutaona",
    "tutataka",
    "tutaenda",
    "tutakuja",
    "tutakula",
    "tutakunywa",
    "tutafanya",
    "tutasema",
    "tutasikia",
    "tutasoma",
    "tutaandika",
    "tutapenda",
    "tutakaa",
    "tutalala"
  ],
  "tuta": [
    "tutajua",
    "tutaona",
    "tutataka",
    "tutaenda",
    "tutakuja",
    "tutakula",
    "tutakunywa",
    "tutafanya",
    "tutasema",
    "tutasikia",
    "tutasoma",
    "tutaandika",
    "tutapenda",
    "tutakaa",
    "tutalala"
  ],
  "wat": [
    "watajua",
    "wataona",
    "watataka",
    "wataenda",
    "watakuja",
    "watakula",
    "watakunywa",
    "watafanya",
    "watasema",
    "watasikia",
    "watasoma",
    "wataandika",
    "watapenda",
    "watakaa",
    "watalala"
  ],
  "wata": [
    "watajua",
    "wataona",
    "watataka",
    "wataenda",
    "watakuja",
    "watakula",
    "watakunywa",
    "watafanya",
    "watasema",
    "watasikia",
    "watasoma",
    "wataandika",
    "watapenda",
    "watakaa",
    "watalala"
  ],
  "kuj": [
    "kujua"
  ],
  "kuju": [
    "kujua"
  ],
  "unao": [
    "unaona"
  ],
  "anao": [
    "anaona"
  ],
  "ulio": [
    "uliona"
  ],
  "alio": [
    "aliona"
  ],
  "utao": [
    "utaona"
  ],
  "atao": [
    "ataona"
  ],
  "kuo": [
    "kuona"
  ],
  "kuon": [
    "kuona"
  ],
  "unat": [
    "unataka"
  ],
  "anat": [
    "anataka"
  ],
  "ulit": [
    "ulitaka"
  ],
  "alit": [
    "alitaka"
  ],
  "utat": [
    "utataka"
  ],
  "atat": [
    "atataka"
  ],
  "kut": [
    "kutaka"
  ],
  "kuta": [
    "kutaka"
  ],
  "unae": [
    "unaenda"
  ],
  "anae": [
    "anaenda"
  ],
  "ulie": [
    "ulienda"
  ],
  "alie": [
    "alienda"
  ],
  "utae": [
    "utaenda"
  ],
  "atae": [
    "ataenda"
  ],
  "kue": [
    "kuenda"
  ],
  "kuen": [
    "kuenda"
  ],
  "unak": [
    "unakuja",
    "unakula",
    "unakunywa",
    "unakaa"
  ],
  "anak": [
    "anakuja",
    "anakula",
    "anakunywa",
    "anakaa"
  ],
  "ulik": [
    "ulikuja",
    "ulikula",
    "ulikunywa",
    "ulikaa"
  ],
  "alik": [
    "alikuja",
    "alikula",
    "alikunywa",
    "alikaa"
  ],
  "utak": [
    "utakuja",
    "utakula",
    "utakunywa",
    "utakaa"
  ],
  "atak": [
    "atakuja",
    "atakula",
    "atakunywa",
    "atakaa"
  ],
  "kuk": [
    "kukuja",
    "kukula",
    "kukunywa",
    "kukaa"
  ],
  "kuku": [
    "kukuja",
    "kukula",
    "kukunywa"
  ],
  "unaf": [
    "unafanya"
  ],
  "anaf": [
    "anafanya"
  ],
  "ulif": [
    "ulifanya"
  ],
  "alif": [
    "alifanya"
  ],
  "utaf": [
    "utafanya"
  ],
  "ataf": [
    "atafanya"
  ],
  "kuf": [
    "kufanya"
  ],
  "kufa": [
    "kufanya"
  ],
  "unas": [
    "unasema",
    "unasikia",
    "unasoma"
  ],
  "anas": [
    "anasema",
    "anasikia",
    "anasoma"
  ],
  "ulis": [
    "ulisema",
    "ulisikia",
    "ulisoma"
  ],
  "alis": [
    "alisema",
    "alisikia",
    "alisoma"
  ],
  "utas": [
    "utasema",
    "utasikia",
    "utasoma"
  ],
  "atas": [
    "atasema",
    "atasikia",
    "atasoma"
  ],
  "kus": [
    "kusema",
    "kusikia",
    "kusoma"
  ],
  "kuse": [
    "kusema"
  ],
  "kusi": [
    "kusikia"
  ],
  "kuso": [
    "kusoma"
  ],
  "unaa": [
    "unaandika"
  ],
  "anaa": [
    "anaandika"
  ],
  "ulia": [
    "uliandika"
  ],
  "alia": [
    "aliandika"
  ],
  "utaa": [
    "utaandika"
  ],
  "ataa": [
    "ataandika"
  ],
  "kua": [
    "kuandika"
  ],
  "kuan": [
    "kuandika"
  ],
  "unap": [
    "unapenda"
  ],
  "anap": [
    "anapenda"
  ],
  "ulip": [
    "ulipenda"
  ],
  "alip": [
    "alipenda"
  ],
  "utap": [
    "utapenda"
  ],
  "atap": [
    "atapenda"
  ],
  "kup": [
    "kupenda"
  ],
  "kupe": [
    "kupenda"
  ],
  "kuka": [
    "kukaa"
  ],
  "unal": [
    "unalala"
  ],
  "anal": [
    "analala"
  ],
  "ulil": [
    "ulilala"
  ],
  "alil": [
    "alilala"
  ],
  "utal": [
    "utalala"
  ],
  "atal": [
    "atalala"
  ],
  "kul": [
    "kulala"
  ],
  "kula": [
    "kulala"
  ]
};
  const SW_WORD_SET = new Set(SW_WORDS);

  class SwahiliSubDirectory {
    constructor() {
      this.name = 'Swahili (Kiswahili)';
      this.code = 'sw';
      this.badge = 'Kiswahili / Sheng';
      this.icon = 'fa-sun';
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
      const lower = text.toLowerCase();
      const tokens = lower.split(/\s+|[.,!?;:()]+/);
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i].trim();
        if (this.typoMap[t]) return true;
      }
      return /\b(habari|hujambo|mambo|poa|asante|karibu|kwaheri|ndiyo|hapana|tafadhali|pole|sheng|maze|beshte|chapaa|niaje|mbogi)\b/i.test(lower);
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
