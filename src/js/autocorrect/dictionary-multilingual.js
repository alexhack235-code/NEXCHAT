/**
 * NEXCHAT Multilingual Sub-Directory: Spanish, French, Portuguese, German & Italian
 * High-Speed O(1) Prefix-Indexed European Suite
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const ES_WORDS = [
  "hola",
  "gracias",
  "por favor",
  "amigo",
  "buenos",
  "días",
  "noches",
  "tardes",
  "cómo",
  "estás",
  "bien",
  "dónde",
  "cuándo",
  "hacer",
  "tiempo",
  "ahora",
  "siempre",
  "nunca",
  "también",
  "después",
  "mensaje",
  "trabajo",
  "familia",
  "casa",
  "vida",
  "mundo",
  "nuevo",
  "porque",
  "pero",
  "mucho",
  "poco",
  "todo",
  "nada",
  "bueno",
  "malo",
  "grande",
  "pequeño",
  "estar",
  "haber",
  "tener",
  "poder",
  "decir",
  "ir"
];
  const FR_WORDS = [
  "bonjour",
  "bonsoir",
  "merci",
  "s'il vous plaît",
  "comment",
  "allez-vous",
  "très",
  "bien",
  "oui",
  "non",
  "ami",
  "toujours",
  "jamais",
  "aujourd'hui",
  "demain",
  "hier",
  "faire",
  "temps",
  "maintenant",
  "après",
  "message",
  "travail",
  "famille",
  "maison",
  "monde",
  "nouveau",
  "pourquoi",
  "mais",
  "beaucoup",
  "tout"
];
  const PT_WORDS = [
  "olá",
  "obrigado",
  "obrigada",
  "por favor",
  "como",
  "você",
  "está",
  "tudo",
  "bom",
  "bem",
  "sim",
  "não",
  "amigo",
  "sempre",
  "nunca",
  "hoje",
  "amanhã",
  "ontem",
  "fazer",
  "tempo",
  "agora",
  "depois",
  "mensagem",
  "trabalho",
  "família",
  "casa",
  "mundo",
  "novo",
  "porque",
  "mas",
  "muito",
  "pouco",
  "nada",
  "grande"
];
  const DE_WORDS = [
  "hallo",
  "danke",
  "bitte",
  "guten",
  "morgen",
  "tag",
  "abend",
  "nacht",
  "wie",
  "geht",
  "gut",
  "schön",
  "ja",
  "nein",
  "freund",
  "immer",
  "nie",
  "heute",
  "morgen",
  "gestern",
  "machen",
  "zeit",
  "jetzt",
  "später",
  "nachricht",
  "arbeit",
  "familie",
  "haus",
  "welt",
  "neu",
  "warum",
  "aber",
  "sehr",
  "viel"
];
  const IT_WORDS = [
  "ciao",
  "grazie",
  "per favore",
  "prego",
  "buongiorno",
  "buonasera",
  "buonanotte",
  "arrivederci",
  "come stai",
  "bene",
  "male",
  "sì",
  "no",
  "amico",
  "amica",
  "famiglia",
  "casa",
  "lavoro",
  "tempo",
  "adesso",
  "oggi",
  "domani",
  "ieri",
  "sempre",
  "mai",
  "molto",
  "poco",
  "tutto",
  "niente",
  "bello",
  "grande",
  "piccolo",
  "nuovo",
  "vecchio",
  "fare",
  "andare",
  "venire",
  "dire",
  "sapere",
  "potere",
  "volere",
  "dovere",
  "vedere"
];

  const ES_TYPO_MAP = {
    'ola': 'hola', 'q': 'que', 'k': 'que', 'pq': 'porque', 'xq': 'por qué',
    'tmb': 'también', 'tb': 'también', 'dsp': 'después', 'xfa': 'por favor',
    'muxo': 'mucho', 'bno': 'bueno', 'aki': 'aquí', 'sta': 'está', 'toy': 'estoy',
    'bn': 'bien', 'ns': 'no sé', 'ntp': 'no te preocupes', 'd': 'de', 'cm': 'cómo'
  };

  const FR_TYPO_MAP = {
    'bjr': 'bonjour', 'bsr': 'bonsoir', 'mrc': 'merci', 'stp': 's\'il te plaît',
    'svp': 's\'il vous plaît', 'pk': 'pourquoi', 'bcp': 'beaucoup', 'tlm': 'tout le monde',
    'jpp': 'je n\'en peux plus', 'mdr': 'mort de rire', 'slt': 'salut', 'cb': 'combien',
    'tkt': 't\'inquiète', 'cv': 'ça va', 'jsp': 'je ne sais pas', 'dsl': 'désolé'
  };

  const PT_TYPO_MAP = {
    'ola': 'olá', 'vc': 'você', 'vcs': 'vocês', 'obg': 'obrigado', 'pfv': 'por favor',
    'tbm': 'também', 'tb': 'também', 'blz': 'beleza', 'oq': 'o que', 'kd': 'cadê',
    'ctz': 'certeza', 'dps': 'depois', 'nd': 'nada', 'pq': 'porque', 'hj': 'hoje',
    'flw': 'falou', 'tmj': 'estamos juntos', 'bjo': 'beijo', 'vdd': 'verdade', 'agr': 'agora'
  };

  const DE_TYPO_MAP = {
    'hlo': 'hallo', 'vg': 'viele grüße', 'lg': 'liebe grüße', 'mfg': 'mit freundlichen grüßen',
    'garnicht': 'gar nicht', 'warscheinlich': 'wahrscheinlich', 'thx': 'danke', 'pls': 'bitte',
    'bd': 'bis dann', 'bb': 'bis bald', 'ka': 'keine ahnung', 'kp': 'kein plan', 'vllt': 'vielleicht'
  };

  const IT_TYPO_MAP = {
  "grz": "grazie",
  "cmq": "comunque",
  "nn": "non",
  "pk": "perché",
  "xke": "perché",
  "salve": "salve",
  "prg": "prego",
  "dop": "dopo"
};
  const MULTI_PREFIX_TABLE = {
  "es": {
    "ho": [
      "hola"
    ],
    "hol": [
      "hola"
    ],
    "hola": [
      "hola"
    ],
    "gr": [
      "gracias",
      "grande"
    ],
    "gra": [
      "gracias",
      "grande"
    ],
    "grac": [
      "gracias"
    ],
    "po": [
      "por favor",
      "porque",
      "poco",
      "poder"
    ],
    "por": [
      "por favor",
      "porque"
    ],
    "por ": [
      "por favor"
    ],
    "am": [
      "amigo"
    ],
    "ami": [
      "amigo"
    ],
    "amig": [
      "amigo"
    ],
    "bu": [
      "buenos",
      "bueno"
    ],
    "bue": [
      "buenos",
      "bueno"
    ],
    "buen": [
      "buenos",
      "bueno"
    ],
    "dí": [
      "días"
    ],
    "día": [
      "días"
    ],
    "días": [
      "días"
    ],
    "no": [
      "noches"
    ],
    "noc": [
      "noches"
    ],
    "noch": [
      "noches"
    ],
    "ta": [
      "tardes",
      "también"
    ],
    "tar": [
      "tardes"
    ],
    "tard": [
      "tardes"
    ],
    "có": [
      "cómo"
    ],
    "cóm": [
      "cómo"
    ],
    "cómo": [
      "cómo"
    ],
    "es": [
      "estás",
      "estar"
    ],
    "est": [
      "estás",
      "estar"
    ],
    "está": [
      "estás"
    ],
    "bi": [
      "bien"
    ],
    "bie": [
      "bien"
    ],
    "bien": [
      "bien"
    ],
    "dó": [
      "dónde"
    ],
    "dón": [
      "dónde"
    ],
    "dónd": [
      "dónde"
    ],
    "cu": [
      "cuándo"
    ],
    "cuá": [
      "cuándo"
    ],
    "cuán": [
      "cuándo"
    ],
    "ha": [
      "hacer",
      "haber"
    ],
    "hac": [
      "hacer"
    ],
    "hace": [
      "hacer"
    ],
    "ti": [
      "tiempo"
    ],
    "tie": [
      "tiempo"
    ],
    "tiem": [
      "tiempo"
    ],
    "ah": [
      "ahora"
    ],
    "aho": [
      "ahora"
    ],
    "ahor": [
      "ahora"
    ],
    "si": [
      "siempre"
    ],
    "sie": [
      "siempre"
    ],
    "siem": [
      "siempre"
    ],
    "nu": [
      "nunca",
      "nuevo"
    ],
    "nun": [
      "nunca"
    ],
    "nunc": [
      "nunca"
    ],
    "tam": [
      "también"
    ],
    "tamb": [
      "también"
    ],
    "de": [
      "después",
      "decir"
    ],
    "des": [
      "después"
    ],
    "desp": [
      "después"
    ],
    "me": [
      "mensaje"
    ],
    "men": [
      "mensaje"
    ],
    "mens": [
      "mensaje"
    ],
    "tr": [
      "trabajo"
    ],
    "tra": [
      "trabajo"
    ],
    "trab": [
      "trabajo"
    ],
    "fa": [
      "familia"
    ],
    "fam": [
      "familia"
    ],
    "fami": [
      "familia"
    ],
    "ca": [
      "casa"
    ],
    "cas": [
      "casa"
    ],
    "casa": [
      "casa"
    ],
    "vi": [
      "vida"
    ],
    "vid": [
      "vida"
    ],
    "vida": [
      "vida"
    ],
    "mu": [
      "mundo",
      "mucho"
    ],
    "mun": [
      "mundo"
    ],
    "mund": [
      "mundo"
    ],
    "nue": [
      "nuevo"
    ],
    "nuev": [
      "nuevo"
    ],
    "porq": [
      "porque"
    ],
    "pe": [
      "pero",
      "pequeño"
    ],
    "per": [
      "pero"
    ],
    "pero": [
      "pero"
    ],
    "muc": [
      "mucho"
    ],
    "much": [
      "mucho"
    ],
    "poc": [
      "poco"
    ],
    "poco": [
      "poco"
    ],
    "to": [
      "todo"
    ],
    "tod": [
      "todo"
    ],
    "todo": [
      "todo"
    ],
    "na": [
      "nada"
    ],
    "nad": [
      "nada"
    ],
    "nada": [
      "nada"
    ],
    "ma": [
      "malo"
    ],
    "mal": [
      "malo"
    ],
    "malo": [
      "malo"
    ],
    "gran": [
      "grande"
    ],
    "peq": [
      "pequeño"
    ],
    "pequ": [
      "pequeño"
    ],
    "esta": [
      "estar"
    ],
    "hab": [
      "haber"
    ],
    "habe": [
      "haber"
    ],
    "te": [
      "tener"
    ],
    "ten": [
      "tener"
    ],
    "tene": [
      "tener"
    ],
    "pod": [
      "poder"
    ],
    "pode": [
      "poder"
    ],
    "dec": [
      "decir"
    ],
    "deci": [
      "decir"
    ],
    "ir": [
      "ir"
    ]
  },
  "fr": {
    "bo": [
      "bonjour",
      "bonsoir"
    ],
    "bon": [
      "bonjour",
      "bonsoir"
    ],
    "bonj": [
      "bonjour"
    ],
    "bons": [
      "bonsoir"
    ],
    "me": [
      "merci",
      "message"
    ],
    "mer": [
      "merci"
    ],
    "merc": [
      "merci"
    ],
    "s'": [
      "s'il vous plaît"
    ],
    "s'i": [
      "s'il vous plaît"
    ],
    "s'il": [
      "s'il vous plaît"
    ],
    "co": [
      "comment"
    ],
    "com": [
      "comment"
    ],
    "comm": [
      "comment"
    ],
    "al": [
      "allez-vous"
    ],
    "all": [
      "allez-vous"
    ],
    "alle": [
      "allez-vous"
    ],
    "tr": [
      "très",
      "travail"
    ],
    "trè": [
      "très"
    ],
    "très": [
      "très"
    ],
    "bi": [
      "bien"
    ],
    "bie": [
      "bien"
    ],
    "bien": [
      "bien"
    ],
    "ou": [
      "oui"
    ],
    "oui": [
      "oui"
    ],
    "no": [
      "non",
      "nouveau"
    ],
    "non": [
      "non"
    ],
    "am": [
      "ami"
    ],
    "ami": [
      "ami"
    ],
    "to": [
      "toujours",
      "tout"
    ],
    "tou": [
      "toujours",
      "tout"
    ],
    "touj": [
      "toujours"
    ],
    "ja": [
      "jamais"
    ],
    "jam": [
      "jamais"
    ],
    "jama": [
      "jamais"
    ],
    "au": [
      "aujourd'hui"
    ],
    "auj": [
      "aujourd'hui"
    ],
    "aujo": [
      "aujourd'hui"
    ],
    "de": [
      "demain"
    ],
    "dem": [
      "demain"
    ],
    "dema": [
      "demain"
    ],
    "hi": [
      "hier"
    ],
    "hie": [
      "hier"
    ],
    "hier": [
      "hier"
    ],
    "fa": [
      "faire",
      "famille"
    ],
    "fai": [
      "faire"
    ],
    "fair": [
      "faire"
    ],
    "te": [
      "temps"
    ],
    "tem": [
      "temps"
    ],
    "temp": [
      "temps"
    ],
    "ma": [
      "maintenant",
      "maison",
      "mais"
    ],
    "mai": [
      "maintenant",
      "maison",
      "mais"
    ],
    "main": [
      "maintenant"
    ],
    "ap": [
      "après"
    ],
    "apr": [
      "après"
    ],
    "aprè": [
      "après"
    ],
    "mes": [
      "message"
    ],
    "mess": [
      "message"
    ],
    "tra": [
      "travail"
    ],
    "trav": [
      "travail"
    ],
    "fam": [
      "famille"
    ],
    "fami": [
      "famille"
    ],
    "mais": [
      "maison",
      "mais"
    ],
    "mo": [
      "monde"
    ],
    "mon": [
      "monde"
    ],
    "mond": [
      "monde"
    ],
    "nou": [
      "nouveau"
    ],
    "nouv": [
      "nouveau"
    ],
    "po": [
      "pourquoi"
    ],
    "pou": [
      "pourquoi"
    ],
    "pour": [
      "pourquoi"
    ],
    "be": [
      "beaucoup"
    ],
    "bea": [
      "beaucoup"
    ],
    "beau": [
      "beaucoup"
    ],
    "tout": [
      "tout"
    ]
  },
  "pt": {
    "ol": [
      "olá"
    ],
    "olá": [
      "olá"
    ],
    "ob": [
      "obrigado",
      "obrigada"
    ],
    "obr": [
      "obrigado",
      "obrigada"
    ],
    "obri": [
      "obrigado",
      "obrigada"
    ],
    "po": [
      "por favor",
      "porque",
      "pouco"
    ],
    "por": [
      "por favor",
      "porque"
    ],
    "por ": [
      "por favor"
    ],
    "co": [
      "como"
    ],
    "com": [
      "como"
    ],
    "como": [
      "como"
    ],
    "vo": [
      "você"
    ],
    "voc": [
      "você"
    ],
    "você": [
      "você"
    ],
    "es": [
      "está"
    ],
    "est": [
      "está"
    ],
    "está": [
      "está"
    ],
    "tu": [
      "tudo"
    ],
    "tud": [
      "tudo"
    ],
    "tudo": [
      "tudo"
    ],
    "bo": [
      "bom"
    ],
    "bom": [
      "bom"
    ],
    "be": [
      "bem"
    ],
    "bem": [
      "bem"
    ],
    "si": [
      "sim"
    ],
    "sim": [
      "sim"
    ],
    "nã": [
      "não"
    ],
    "não": [
      "não"
    ],
    "am": [
      "amigo",
      "amanhã"
    ],
    "ami": [
      "amigo"
    ],
    "amig": [
      "amigo"
    ],
    "se": [
      "sempre"
    ],
    "sem": [
      "sempre"
    ],
    "semp": [
      "sempre"
    ],
    "nu": [
      "nunca"
    ],
    "nun": [
      "nunca"
    ],
    "nunc": [
      "nunca"
    ],
    "ho": [
      "hoje"
    ],
    "hoj": [
      "hoje"
    ],
    "hoje": [
      "hoje"
    ],
    "ama": [
      "amanhã"
    ],
    "aman": [
      "amanhã"
    ],
    "on": [
      "ontem"
    ],
    "ont": [
      "ontem"
    ],
    "onte": [
      "ontem"
    ],
    "fa": [
      "fazer",
      "família"
    ],
    "faz": [
      "fazer"
    ],
    "faze": [
      "fazer"
    ],
    "te": [
      "tempo"
    ],
    "tem": [
      "tempo"
    ],
    "temp": [
      "tempo"
    ],
    "ag": [
      "agora"
    ],
    "ago": [
      "agora"
    ],
    "agor": [
      "agora"
    ],
    "de": [
      "depois"
    ],
    "dep": [
      "depois"
    ],
    "depo": [
      "depois"
    ],
    "me": [
      "mensagem"
    ],
    "men": [
      "mensagem"
    ],
    "mens": [
      "mensagem"
    ],
    "tr": [
      "trabalho"
    ],
    "tra": [
      "trabalho"
    ],
    "trab": [
      "trabalho"
    ],
    "fam": [
      "família"
    ],
    "famí": [
      "família"
    ],
    "ca": [
      "casa"
    ],
    "cas": [
      "casa"
    ],
    "casa": [
      "casa"
    ],
    "mu": [
      "mundo",
      "muito"
    ],
    "mun": [
      "mundo"
    ],
    "mund": [
      "mundo"
    ],
    "no": [
      "novo"
    ],
    "nov": [
      "novo"
    ],
    "novo": [
      "novo"
    ],
    "porq": [
      "porque"
    ],
    "ma": [
      "mas"
    ],
    "mas": [
      "mas"
    ],
    "mui": [
      "muito"
    ],
    "muit": [
      "muito"
    ],
    "pou": [
      "pouco"
    ],
    "pouc": [
      "pouco"
    ],
    "na": [
      "nada"
    ],
    "nad": [
      "nada"
    ],
    "nada": [
      "nada"
    ],
    "gr": [
      "grande"
    ],
    "gra": [
      "grande"
    ],
    "gran": [
      "grande"
    ]
  },
  "de": {
    "ha": [
      "hallo",
      "haus"
    ],
    "hal": [
      "hallo"
    ],
    "hall": [
      "hallo"
    ],
    "da": [
      "danke"
    ],
    "dan": [
      "danke"
    ],
    "dank": [
      "danke"
    ],
    "bi": [
      "bitte"
    ],
    "bit": [
      "bitte"
    ],
    "bitt": [
      "bitte"
    ],
    "gu": [
      "guten",
      "gut"
    ],
    "gut": [
      "guten",
      "gut"
    ],
    "gute": [
      "guten"
    ],
    "mo": [
      "morgen"
    ],
    "mor": [
      "morgen"
    ],
    "morg": [
      "morgen"
    ],
    "ta": [
      "tag"
    ],
    "tag": [
      "tag"
    ],
    "ab": [
      "abend",
      "aber"
    ],
    "abe": [
      "abend",
      "aber"
    ],
    "aben": [
      "abend"
    ],
    "na": [
      "nacht",
      "nachricht"
    ],
    "nac": [
      "nacht",
      "nachricht"
    ],
    "nach": [
      "nacht",
      "nachricht"
    ],
    "wi": [
      "wie"
    ],
    "wie": [
      "wie"
    ],
    "ge": [
      "geht",
      "gestern"
    ],
    "geh": [
      "geht"
    ],
    "geht": [
      "geht"
    ],
    "sc": [
      "schön"
    ],
    "sch": [
      "schön"
    ],
    "schö": [
      "schön"
    ],
    "ja": [
      "ja"
    ],
    "ne": [
      "nein",
      "neu"
    ],
    "nei": [
      "nein"
    ],
    "nein": [
      "nein"
    ],
    "fr": [
      "freund"
    ],
    "fre": [
      "freund"
    ],
    "freu": [
      "freund"
    ],
    "im": [
      "immer"
    ],
    "imm": [
      "immer"
    ],
    "imme": [
      "immer"
    ],
    "ni": [
      "nie"
    ],
    "nie": [
      "nie"
    ],
    "he": [
      "heute"
    ],
    "heu": [
      "heute"
    ],
    "heut": [
      "heute"
    ],
    "ges": [
      "gestern"
    ],
    "gest": [
      "gestern"
    ],
    "ma": [
      "machen"
    ],
    "mac": [
      "machen"
    ],
    "mach": [
      "machen"
    ],
    "ze": [
      "zeit"
    ],
    "zei": [
      "zeit"
    ],
    "zeit": [
      "zeit"
    ],
    "je": [
      "jetzt"
    ],
    "jet": [
      "jetzt"
    ],
    "jetz": [
      "jetzt"
    ],
    "sp": [
      "später"
    ],
    "spä": [
      "später"
    ],
    "spät": [
      "später"
    ],
    "ar": [
      "arbeit"
    ],
    "arb": [
      "arbeit"
    ],
    "arbe": [
      "arbeit"
    ],
    "fa": [
      "familie"
    ],
    "fam": [
      "familie"
    ],
    "fami": [
      "familie"
    ],
    "hau": [
      "haus"
    ],
    "haus": [
      "haus"
    ],
    "we": [
      "welt"
    ],
    "wel": [
      "welt"
    ],
    "welt": [
      "welt"
    ],
    "neu": [
      "neu"
    ],
    "wa": [
      "warum"
    ],
    "war": [
      "warum"
    ],
    "waru": [
      "warum"
    ],
    "aber": [
      "aber"
    ],
    "se": [
      "sehr"
    ],
    "seh": [
      "sehr"
    ],
    "sehr": [
      "sehr"
    ],
    "vi": [
      "viel"
    ],
    "vie": [
      "viel"
    ],
    "viel": [
      "viel"
    ]
  },
  "it": {
    "ci": [
      "ciao"
    ],
    "cia": [
      "ciao"
    ],
    "ciao": [
      "ciao"
    ],
    "gr": [
      "grazie",
      "grande"
    ],
    "gra": [
      "grazie",
      "grande"
    ],
    "graz": [
      "grazie"
    ],
    "pe": [
      "per favore"
    ],
    "per": [
      "per favore"
    ],
    "per ": [
      "per favore"
    ],
    "pr": [
      "prego"
    ],
    "pre": [
      "prego"
    ],
    "preg": [
      "prego"
    ],
    "bu": [
      "buongiorno",
      "buonasera",
      "buonanotte"
    ],
    "buo": [
      "buongiorno",
      "buonasera",
      "buonanotte"
    ],
    "buon": [
      "buongiorno",
      "buonasera",
      "buonanotte"
    ],
    "ar": [
      "arrivederci"
    ],
    "arr": [
      "arrivederci"
    ],
    "arri": [
      "arrivederci"
    ],
    "co": [
      "come stai"
    ],
    "com": [
      "come stai"
    ],
    "come": [
      "come stai"
    ],
    "be": [
      "bene",
      "bello"
    ],
    "ben": [
      "bene"
    ],
    "bene": [
      "bene"
    ],
    "ma": [
      "male",
      "mai"
    ],
    "mal": [
      "male"
    ],
    "male": [
      "male"
    ],
    "sì": [
      "sì"
    ],
    "no": [
      "no"
    ],
    "am": [
      "amico",
      "amica"
    ],
    "ami": [
      "amico",
      "amica"
    ],
    "amic": [
      "amico",
      "amica"
    ],
    "fa": [
      "famiglia",
      "fare"
    ],
    "fam": [
      "famiglia"
    ],
    "fami": [
      "famiglia"
    ],
    "ca": [
      "casa"
    ],
    "cas": [
      "casa"
    ],
    "casa": [
      "casa"
    ],
    "la": [
      "lavoro"
    ],
    "lav": [
      "lavoro"
    ],
    "lavo": [
      "lavoro"
    ],
    "te": [
      "tempo"
    ],
    "tem": [
      "tempo"
    ],
    "temp": [
      "tempo"
    ],
    "ad": [
      "adesso"
    ],
    "ade": [
      "adesso"
    ],
    "ades": [
      "adesso"
    ],
    "og": [
      "oggi"
    ],
    "ogg": [
      "oggi"
    ],
    "oggi": [
      "oggi"
    ],
    "do": [
      "domani",
      "dovere"
    ],
    "dom": [
      "domani"
    ],
    "doma": [
      "domani"
    ],
    "ie": [
      "ieri"
    ],
    "ier": [
      "ieri"
    ],
    "ieri": [
      "ieri"
    ],
    "se": [
      "sempre"
    ],
    "sem": [
      "sempre"
    ],
    "semp": [
      "sempre"
    ],
    "mai": [
      "mai"
    ],
    "mo": [
      "molto"
    ],
    "mol": [
      "molto"
    ],
    "molt": [
      "molto"
    ],
    "po": [
      "poco",
      "potere"
    ],
    "poc": [
      "poco"
    ],
    "poco": [
      "poco"
    ],
    "tu": [
      "tutto"
    ],
    "tut": [
      "tutto"
    ],
    "tutt": [
      "tutto"
    ],
    "ni": [
      "niente"
    ],
    "nie": [
      "niente"
    ],
    "nien": [
      "niente"
    ],
    "bel": [
      "bello"
    ],
    "bell": [
      "bello"
    ],
    "gran": [
      "grande"
    ],
    "pi": [
      "piccolo"
    ],
    "pic": [
      "piccolo"
    ],
    "picc": [
      "piccolo"
    ],
    "nu": [
      "nuovo"
    ],
    "nuo": [
      "nuovo"
    ],
    "nuov": [
      "nuovo"
    ],
    "ve": [
      "vecchio",
      "venire",
      "vedere"
    ],
    "vec": [
      "vecchio"
    ],
    "vecc": [
      "vecchio"
    ],
    "far": [
      "fare"
    ],
    "fare": [
      "fare"
    ],
    "an": [
      "andare"
    ],
    "and": [
      "andare"
    ],
    "anda": [
      "andare"
    ],
    "ven": [
      "venire"
    ],
    "veni": [
      "venire"
    ],
    "di": [
      "dire"
    ],
    "dir": [
      "dire"
    ],
    "dire": [
      "dire"
    ],
    "sa": [
      "sapere"
    ],
    "sap": [
      "sapere"
    ],
    "sape": [
      "sapere"
    ],
    "pot": [
      "potere"
    ],
    "pote": [
      "potere"
    ],
    "vo": [
      "volere"
    ],
    "vol": [
      "volere"
    ],
    "vole": [
      "volere"
    ],
    "dov": [
      "dovere"
    ],
    "dove": [
      "dovere"
    ],
    "ved": [
      "vedere"
    ],
    "vede": [
      "vedere"
    ]
  }
};

  const ES_SET = new Set(ES_WORDS.map(w => w.toLowerCase()));
  const FR_SET = new Set(FR_WORDS.map(w => w.toLowerCase()));
  const PT_SET = new Set(PT_WORDS.map(w => w.toLowerCase()));
  const DE_SET = new Set(DE_WORDS.map(w => w.toLowerCase()));
  const IT_SET = new Set(IT_WORDS.map(w => w.toLowerCase()));

  class MultilingualSuite {
    constructor() {
      this.es = { name: 'Spanish', badge: 'Español', words: ES_SET, typos: ES_TYPO_MAP };
      this.fr = { name: 'French', badge: 'Français', words: FR_SET, typos: FR_TYPO_MAP };
      this.pt = { name: 'Portuguese', badge: 'Português', words: PT_SET, typos: PT_TYPO_MAP };
      this.de = { name: 'German', badge: 'Deutsch', words: DE_SET, typos: DE_TYPO_MAP };
      this.it = { name: 'Italian', badge: 'Italiano', words: IT_SET, typos: IT_TYPO_MAP };
      this.prefixTable = MULTI_PREFIX_TABLE;
    }

    detect(text) {
      if (!text || typeof text !== 'string') return null;
      const lower = text.toLowerCase();
      if (/[¿¡ñáéíóú]/.test(lower) || /\b(hola|gracias|estás|amigo|bueno|cómo)\b/.test(lower)) return 'es';
      if (/[çœæàèêëîïôùû]/.test(lower) || /\b(bonjour|merci|s'il|vous|plaît|très|avec)\b/.test(lower)) return 'fr';
      if (/[ãõ]/.test(lower) || /\b(olá|obrigado|você|tudo|bom|beleza)\b/.test(lower)) return 'pt';
      if (/[äöüß]/.test(lower) || /\b(hallo|danke|bitte|guten|morgen|nicht|haben)\b/.test(lower)) return 'de';
      if (/\b(ciao|grazie|prego|buongiorno|arrivederci|come stai)\b/.test(lower)) return 'it';
      return null;
    }

    correctWord(cleanWord, lang) {
      if (!cleanWord) return null;
      if (lang && this[lang]) return this[lang].typos[cleanWord] || null;
      if (this.es.typos[cleanWord]) return this.es.typos[cleanWord];
      if (this.fr.typos[cleanWord]) return this.fr.typos[cleanWord];
      if (this.pt.typos[cleanWord]) return this.pt.typos[cleanWord];
      if (this.de.typos[cleanWord]) return this.de.typos[cleanWord];
      if (this.it.typos[cleanWord]) return this.it.typos[cleanWord];
      return null;
    }

    hasWord(cleanWord, lang) {
      if (!cleanWord) return false;
      if (lang && this[lang]) return this[lang].words.has(cleanWord);
      return this.es.words.has(cleanWord) ||
             this.fr.words.has(cleanWord) ||
             this.pt.words.has(cleanWord) ||
             this.de.words.has(cleanWord) ||
             this.it.words.has(cleanWord);
    }

    getPrefixSuggestions(prefix, lang, max = 4) {
      if (!prefix || prefix.length < 2) return [];
      const clean = prefix.toLowerCase();
      const p = clean.slice(0, Math.min(4, clean.length));
      const targetLangs = lang ? [lang] : ['es', 'fr', 'pt', 'de', 'it'];
      for (const l of targetLangs) {
        if (this.prefixTable[l] && this.prefixTable[l][p]) {
          const matches = this.prefixTable[l][p].filter(w => w.startsWith(clean) && w !== clean);
          if (matches.length > 0) return matches.slice(0, max);
        }
      }
      return [];
    }
  }

  const multiSuite = new MultilingualSuite();

  window.ES_SUBDIRECTORY = multiSuite.es;
  window.FR_SUBDIRECTORY = multiSuite.fr;
  window.PT_SUBDIRECTORY = multiSuite.pt;
  window.DE_SUBDIRECTORY = multiSuite.de;
  window.IT_SUBDIRECTORY = multiSuite.it;
  window.MULTILINGUAL_SUITE = multiSuite;
})();
