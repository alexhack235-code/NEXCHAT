/**
 * NEXCHAT Multilingual Sub-Directory: Spanish, French, Portuguese, German & Italian (Deepened)
 * High-Speed O(1) Prefix-Indexed European Suite
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const ES_WORDS = [
  "hola",
  "buenos",
  "días",
  "noches",
  "gracias",
  "por favor",
  "amigo",
  "cómo",
  "estás",
  "bien",
  "dónde",
  "cuándo",
  "porque",
  "hacer",
  "tiempo",
  "ahora",
  "mensaje",
  "trabajo",
  "casa",
  "comida",
  "agua",
  "café",
  "xq",
  "dnd",
  "tqm",
  "xfa",
  "bn",
  "tb",
  "hago",
  "haces",
  "hace",
  "hacemos",
  "hacen",
  "hice",
  "tengo",
  "tienes",
  "tiene",
  "tenemos",
  "tienen",
  "voy",
  "vas",
  "va",
  "vamos",
  "van",
  "fui",
  "estoy",
  "está",
  "estamos",
  "están",
  "soy",
  "eres",
  "es",
  "somos",
  "son",
  "puedo",
  "puedes",
  "puede",
  "podemos",
  "pueden",
  "quiero",
  "quieres",
  "quiere",
  "queremos",
  "quieren"
];
  const FR_WORDS = [
  "bonjour",
  "bonsoir",
  "salut",
  "merci",
  "s'il vous plaît",
  "svp",
  "comment",
  "oui",
  "non",
  "ami",
  "où",
  "quand",
  "pourquoi",
  "faire",
  "temps",
  "maintenant",
  "message",
  "travail",
  "maison",
  "eau",
  "café",
  "mdr",
  "ptdr",
  "stp",
  "bjr",
  "bsr",
  "slt",
  "mrc",
  "pk",
  "fais",
  "fait",
  "faisons",
  "faites",
  "font",
  "suis",
  "es",
  "est",
  "sommes",
  "êtes",
  "sont",
  "ai",
  "as",
  "a",
  "avons",
  "avez",
  "ont",
  "vais",
  "vas",
  "va",
  "allons",
  "allez",
  "vont",
  "peux",
  "peut",
  "pouvons",
  "pouvez",
  "peuvent",
  "veux",
  "veut",
  "voulons",
  "voulez",
  "veulent"
];
  const PT_WORDS = [
  "olá",
  "oi",
  "bom dia",
  "boa noite",
  "obrigado",
  "por favor",
  "amigo",
  "tudo bem",
  "como você está",
  "onde",
  "quando",
  "porque",
  "fazer",
  "tempo",
  "agora",
  "mensagem",
  "trabalho",
  "casa",
  "água",
  "café",
  "vc",
  "tb",
  "obg",
  "pfv",
  "blz",
  "vlw",
  "dps",
  "pq",
  "faço",
  "faz",
  "fazemos",
  "fazem",
  "fiz",
  "tenho",
  "tem",
  "temos",
  "têm",
  "tive",
  "vou",
  "vai",
  "vamos",
  "vão",
  "fui",
  "estou",
  "está",
  "estamos",
  "estão",
  "sou",
  "é",
  "somos",
  "são",
  "posso",
  "pode",
  "podemos",
  "podem",
  "quero",
  "quer",
  "queremos",
  "querem"
];
  const DE_WORDS = [
  "hallo",
  "guten morgen",
  "guten tag",
  "gute nacht",
  "danke",
  "bitte",
  "freund",
  "wie geht es dir",
  "gut",
  "wo",
  "wann",
  "warum",
  "weil",
  "machen",
  "zeit",
  "jetzt",
  "nachricht",
  "arbeit",
  "haus",
  "wasser",
  "kaffee",
  "lg",
  "mfg",
  "cu",
  "vllt",
  "ka",
  "mache",
  "machst",
  "macht",
  "machte",
  "habe",
  "hast",
  "hat",
  "haben",
  "hatte",
  "bin",
  "bist",
  "ist",
  "sind",
  "war",
  "gehe",
  "gehst",
  "geht",
  "gehen",
  "ging",
  "kann",
  "kannst",
  "können",
  "konnte",
  "will",
  "willst",
  "wollen",
  "wollte"
];
  const IT_WORDS = [
  "ciao",
  "buongiorno",
  "buonasera",
  "grazie",
  "per favore",
  "amico",
  "come stai",
  "bene",
  "dove",
  "quando",
  "perché",
  "fare",
  "tempo",
  "adesso",
  "messaggio",
  "lavoro",
  "casa",
  "acqua",
  "caffè",
  "cmq",
  "xk",
  "risp",
  "tvb",
  "nn",
  "sn",
  "faccio",
  "fai",
  "fa",
  "facciamo",
  "fanno",
  "fatto",
  "ho",
  "hai",
  "ha",
  "abbiamo",
  "hanno",
  "avuto",
  "sono",
  "sei",
  "è",
  "siamo",
  "vado",
  "vai",
  "va",
  "andiamo",
  "vanno",
  "andato",
  "posso",
  "puoi",
  "può",
  "possiamo",
  "possono",
  "voglio",
  "vuoi",
  "vuole",
  "vogliamo",
  "vogliono"
];

  const MULTI_PREFIX_TABLE = {
    es: {
    "ho": [
        "hola"
    ],
    "hol": [
        "hola"
    ],
    "hola": [
        "hola"
    ],
    "bu": [
        "buenos"
    ],
    "bue": [
        "buenos"
    ],
    "buen": [
        "buenos"
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
    "gr": [
        "gracias"
    ],
    "gra": [
        "gracias"
    ],
    "grac": [
        "gracias"
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
        "estoy",
        "está",
        "estamos",
        "están",
        "es"
    ],
    "est": [
        "estás",
        "estoy",
        "está",
        "estamos",
        "están"
    ],
    "está": [
        "estás",
        "está",
        "están"
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
    "po": [
        "porque",
        "podemos"
    ],
    "por": [
        "porque"
    ],
    "porq": [
        "porque"
    ],
    "ha": [
        "hacer",
        "hago",
        "haces",
        "hace",
        "hacemos",
        "hacen"
    ],
    "hac": [
        "hacer",
        "haces",
        "hace",
        "hacemos",
        "hacen"
    ],
    "hace": [
        "hacer",
        "haces",
        "hace",
        "hacemos",
        "hacen"
    ],
    "ti": [
        "tiempo",
        "tienes",
        "tiene",
        "tienen"
    ],
    "tie": [
        "tiempo",
        "tienes",
        "tiene",
        "tienen"
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
    "ca": [
        "casa",
        "café"
    ],
    "cas": [
        "casa"
    ],
    "casa": [
        "casa"
    ],
    "co": [
        "comida"
    ],
    "com": [
        "comida"
    ],
    "comi": [
        "comida"
    ],
    "ag": [
        "agua"
    ],
    "agu": [
        "agua"
    ],
    "agua": [
        "agua"
    ],
    "caf": [
        "café"
    ],
    "café": [
        "café"
    ],
    "xq": [
        "xq"
    ],
    "dn": [
        "dnd"
    ],
    "dnd": [
        "dnd"
    ],
    "tq": [
        "tqm"
    ],
    "tqm": [
        "tqm"
    ],
    "xf": [
        "xfa"
    ],
    "xfa": [
        "xfa"
    ],
    "bn": [
        "bn"
    ],
    "tb": [
        "tb"
    ],
    "hag": [
        "hago"
    ],
    "hago": [
        "hago"
    ],
    "hi": [
        "hice"
    ],
    "hic": [
        "hice"
    ],
    "hice": [
        "hice"
    ],
    "te": [
        "tengo",
        "tenemos"
    ],
    "ten": [
        "tengo",
        "tenemos"
    ],
    "teng": [
        "tengo"
    ],
    "tien": [
        "tienes",
        "tiene",
        "tienen"
    ],
    "tene": [
        "tenemos"
    ],
    "vo": [
        "voy"
    ],
    "voy": [
        "voy"
    ],
    "va": [
        "vas",
        "va",
        "vamos",
        "van"
    ],
    "vas": [
        "vas"
    ],
    "vam": [
        "vamos"
    ],
    "vamo": [
        "vamos"
    ],
    "van": [
        "van"
    ],
    "fu": [
        "fui"
    ],
    "fui": [
        "fui"
    ],
    "esto": [
        "estoy"
    ],
    "esta": [
        "estamos"
    ],
    "so": [
        "soy",
        "somos",
        "son"
    ],
    "soy": [
        "soy"
    ],
    "er": [
        "eres"
    ],
    "ere": [
        "eres"
    ],
    "eres": [
        "eres"
    ],
    "som": [
        "somos"
    ],
    "somo": [
        "somos"
    ],
    "son": [
        "son"
    ],
    "pu": [
        "puedo",
        "puedes",
        "puede",
        "pueden"
    ],
    "pue": [
        "puedo",
        "puedes",
        "puede",
        "pueden"
    ],
    "pued": [
        "puedo",
        "puedes",
        "puede",
        "pueden"
    ],
    "pod": [
        "podemos"
    ],
    "pode": [
        "podemos"
    ],
    "qu": [
        "quiero",
        "quieres",
        "quiere",
        "queremos",
        "quieren"
    ],
    "qui": [
        "quiero",
        "quieres",
        "quiere",
        "quieren"
    ],
    "quie": [
        "quiero",
        "quieres",
        "quiere",
        "quieren"
    ],
    "que": [
        "queremos"
    ],
    "quer": [
        "queremos"
    ]
},
    fr: {
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
    "sa": [
        "salut"
    ],
    "sal": [
        "salut"
    ],
    "salu": [
        "salut"
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
    "sv": [
        "svp"
    ],
    "svp": [
        "svp"
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
    "ou": [
        "oui"
    ],
    "oui": [
        "oui"
    ],
    "no": [
        "non"
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
    "où": [
        "où"
    ],
    "qu": [
        "quand"
    ],
    "qua": [
        "quand"
    ],
    "quan": [
        "quand"
    ],
    "po": [
        "pourquoi",
        "pouvons",
        "pouvez"
    ],
    "pou": [
        "pourquoi",
        "pouvons",
        "pouvez"
    ],
    "pour": [
        "pourquoi"
    ],
    "fa": [
        "faire",
        "fais",
        "fait",
        "faisons",
        "faites"
    ],
    "fai": [
        "faire",
        "fais",
        "fait",
        "faisons",
        "faites"
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
        "maison"
    ],
    "mai": [
        "maintenant",
        "maison"
    ],
    "main": [
        "maintenant"
    ],
    "mes": [
        "message"
    ],
    "mess": [
        "message"
    ],
    "tr": [
        "travail"
    ],
    "tra": [
        "travail"
    ],
    "trav": [
        "travail"
    ],
    "mais": [
        "maison"
    ],
    "ea": [
        "eau"
    ],
    "eau": [
        "eau"
    ],
    "ca": [
        "café"
    ],
    "caf": [
        "café"
    ],
    "café": [
        "café"
    ],
    "md": [
        "mdr"
    ],
    "mdr": [
        "mdr"
    ],
    "pt": [
        "ptdr"
    ],
    "ptd": [
        "ptdr"
    ],
    "ptdr": [
        "ptdr"
    ],
    "st": [
        "stp"
    ],
    "stp": [
        "stp"
    ],
    "bj": [
        "bjr"
    ],
    "bjr": [
        "bjr"
    ],
    "bs": [
        "bsr"
    ],
    "bsr": [
        "bsr"
    ],
    "sl": [
        "slt"
    ],
    "slt": [
        "slt"
    ],
    "mr": [
        "mrc"
    ],
    "mrc": [
        "mrc"
    ],
    "pk": [
        "pk"
    ],
    "fais": [
        "fais",
        "faisons"
    ],
    "fait": [
        "fait",
        "faites"
    ],
    "fo": [
        "font"
    ],
    "fon": [
        "font"
    ],
    "font": [
        "font"
    ],
    "su": [
        "suis"
    ],
    "sui": [
        "suis"
    ],
    "suis": [
        "suis"
    ],
    "es": [
        "es",
        "est"
    ],
    "est": [
        "est"
    ],
    "so": [
        "sommes",
        "sont"
    ],
    "som": [
        "sommes"
    ],
    "somm": [
        "sommes"
    ],
    "êt": [
        "êtes"
    ],
    "ête": [
        "êtes"
    ],
    "êtes": [
        "êtes"
    ],
    "son": [
        "sont"
    ],
    "sont": [
        "sont"
    ],
    "ai": [
        "ai"
    ],
    "as": [
        "as"
    ],
    "av": [
        "avons",
        "avez"
    ],
    "avo": [
        "avons"
    ],
    "avon": [
        "avons"
    ],
    "ave": [
        "avez"
    ],
    "avez": [
        "avez"
    ],
    "on": [
        "ont"
    ],
    "ont": [
        "ont"
    ],
    "va": [
        "vais",
        "vas",
        "va"
    ],
    "vai": [
        "vais"
    ],
    "vais": [
        "vais"
    ],
    "vas": [
        "vas"
    ],
    "al": [
        "allons",
        "allez"
    ],
    "all": [
        "allons",
        "allez"
    ],
    "allo": [
        "allons"
    ],
    "alle": [
        "allez"
    ],
    "vo": [
        "vont",
        "voulons",
        "voulez"
    ],
    "von": [
        "vont"
    ],
    "vont": [
        "vont"
    ],
    "pe": [
        "peux",
        "peut",
        "peuvent"
    ],
    "peu": [
        "peux",
        "peut",
        "peuvent"
    ],
    "peux": [
        "peux"
    ],
    "peut": [
        "peut"
    ],
    "pouv": [
        "pouvons",
        "pouvez"
    ],
    "peuv": [
        "peuvent"
    ],
    "ve": [
        "veux",
        "veut",
        "veulent"
    ],
    "veu": [
        "veux",
        "veut",
        "veulent"
    ],
    "veux": [
        "veux"
    ],
    "veut": [
        "veut"
    ],
    "vou": [
        "voulons",
        "voulez"
    ],
    "voul": [
        "voulons",
        "voulez"
    ],
    "veul": [
        "veulent"
    ]
},
    pt: {
    "ol": [
        "olá"
    ],
    "olá": [
        "olá"
    ],
    "oi": [
        "oi"
    ],
    "ob": [
        "obrigado",
        "obg"
    ],
    "obr": [
        "obrigado"
    ],
    "obri": [
        "obrigado"
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
    "on": [
        "onde"
    ],
    "ond": [
        "onde"
    ],
    "onde": [
        "onde"
    ],
    "qu": [
        "quando",
        "quero",
        "quer",
        "queremos",
        "querem"
    ],
    "qua": [
        "quando"
    ],
    "quan": [
        "quando"
    ],
    "po": [
        "porque",
        "posso",
        "pode",
        "podemos",
        "podem"
    ],
    "por": [
        "porque"
    ],
    "porq": [
        "porque"
    ],
    "fa": [
        "fazer",
        "faço",
        "faz",
        "fazemos",
        "fazem"
    ],
    "faz": [
        "fazer",
        "faz",
        "fazemos",
        "fazem"
    ],
    "faze": [
        "fazer",
        "fazemos",
        "fazem"
    ],
    "te": [
        "tempo",
        "tenho",
        "tem",
        "temos"
    ],
    "tem": [
        "tempo",
        "tem",
        "temos"
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
    "ca": [
        "casa",
        "café"
    ],
    "cas": [
        "casa"
    ],
    "casa": [
        "casa"
    ],
    "ág": [
        "água"
    ],
    "águ": [
        "água"
    ],
    "água": [
        "água"
    ],
    "caf": [
        "café"
    ],
    "café": [
        "café"
    ],
    "vc": [
        "vc"
    ],
    "tb": [
        "tb"
    ],
    "obg": [
        "obg"
    ],
    "pf": [
        "pfv"
    ],
    "pfv": [
        "pfv"
    ],
    "bl": [
        "blz"
    ],
    "blz": [
        "blz"
    ],
    "vl": [
        "vlw"
    ],
    "vlw": [
        "vlw"
    ],
    "dp": [
        "dps"
    ],
    "dps": [
        "dps"
    ],
    "pq": [
        "pq"
    ],
    "faç": [
        "faço"
    ],
    "faço": [
        "faço"
    ],
    "fi": [
        "fiz"
    ],
    "fiz": [
        "fiz"
    ],
    "ten": [
        "tenho"
    ],
    "tenh": [
        "tenho"
    ],
    "temo": [
        "temos"
    ],
    "tê": [
        "têm"
    ],
    "têm": [
        "têm"
    ],
    "ti": [
        "tive"
    ],
    "tiv": [
        "tive"
    ],
    "tive": [
        "tive"
    ],
    "vo": [
        "vou"
    ],
    "vou": [
        "vou"
    ],
    "va": [
        "vai",
        "vamos"
    ],
    "vai": [
        "vai"
    ],
    "vam": [
        "vamos"
    ],
    "vamo": [
        "vamos"
    ],
    "vã": [
        "vão"
    ],
    "vão": [
        "vão"
    ],
    "fu": [
        "fui"
    ],
    "fui": [
        "fui"
    ],
    "es": [
        "estou",
        "está",
        "estamos",
        "estão"
    ],
    "est": [
        "estou",
        "está",
        "estamos",
        "estão"
    ],
    "esto": [
        "estou"
    ],
    "está": [
        "está"
    ],
    "esta": [
        "estamos"
    ],
    "estã": [
        "estão"
    ],
    "so": [
        "sou",
        "somos"
    ],
    "sou": [
        "sou"
    ],
    "som": [
        "somos"
    ],
    "somo": [
        "somos"
    ],
    "sã": [
        "são"
    ],
    "são": [
        "são"
    ],
    "pos": [
        "posso"
    ],
    "poss": [
        "posso"
    ],
    "pod": [
        "pode",
        "podemos",
        "podem"
    ],
    "pode": [
        "pode",
        "podemos",
        "podem"
    ],
    "que": [
        "quero",
        "quer",
        "queremos",
        "querem"
    ],
    "quer": [
        "quero",
        "quer",
        "queremos",
        "querem"
    ]
},
    de: {
    "ha": [
        "hallo",
        "haus",
        "habe",
        "hast",
        "hat",
        "haben",
        "hatte"
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
        "bitte",
        "bin",
        "bist"
    ],
    "bit": [
        "bitte"
    ],
    "bitt": [
        "bitte"
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
    "gu": [
        "gut"
    ],
    "gut": [
        "gut"
    ],
    "wo": [
        "wo",
        "wollen",
        "wollte"
    ],
    "wa": [
        "wann",
        "warum",
        "wasser",
        "war"
    ],
    "wan": [
        "wann"
    ],
    "wann": [
        "wann"
    ],
    "war": [
        "warum",
        "war"
    ],
    "waru": [
        "warum"
    ],
    "we": [
        "weil"
    ],
    "wei": [
        "weil"
    ],
    "weil": [
        "weil"
    ],
    "ma": [
        "machen",
        "mache",
        "machst",
        "macht",
        "machte"
    ],
    "mac": [
        "machen",
        "mache",
        "machst",
        "macht",
        "machte"
    ],
    "mach": [
        "machen",
        "mache",
        "machst",
        "macht",
        "machte"
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
    "na": [
        "nachricht"
    ],
    "nac": [
        "nachricht"
    ],
    "nach": [
        "nachricht"
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
    "hau": [
        "haus"
    ],
    "haus": [
        "haus"
    ],
    "was": [
        "wasser"
    ],
    "wass": [
        "wasser"
    ],
    "ka": [
        "kaffee",
        "ka",
        "kann",
        "kannst"
    ],
    "kaf": [
        "kaffee"
    ],
    "kaff": [
        "kaffee"
    ],
    "lg": [
        "lg"
    ],
    "mf": [
        "mfg"
    ],
    "mfg": [
        "mfg"
    ],
    "cu": [
        "cu"
    ],
    "vl": [
        "vllt"
    ],
    "vll": [
        "vllt"
    ],
    "vllt": [
        "vllt"
    ],
    "hab": [
        "habe",
        "haben"
    ],
    "habe": [
        "habe",
        "haben"
    ],
    "has": [
        "hast"
    ],
    "hast": [
        "hast"
    ],
    "hat": [
        "hat",
        "hatte"
    ],
    "hatt": [
        "hatte"
    ],
    "bin": [
        "bin"
    ],
    "bis": [
        "bist"
    ],
    "bist": [
        "bist"
    ],
    "is": [
        "ist"
    ],
    "ist": [
        "ist"
    ],
    "si": [
        "sind"
    ],
    "sin": [
        "sind"
    ],
    "sind": [
        "sind"
    ],
    "ge": [
        "gehe",
        "gehst",
        "geht",
        "gehen"
    ],
    "geh": [
        "gehe",
        "gehst",
        "geht",
        "gehen"
    ],
    "gehe": [
        "gehe",
        "gehen"
    ],
    "gehs": [
        "gehst"
    ],
    "geht": [
        "geht"
    ],
    "gi": [
        "ging"
    ],
    "gin": [
        "ging"
    ],
    "ging": [
        "ging"
    ],
    "kan": [
        "kann",
        "kannst"
    ],
    "kann": [
        "kann",
        "kannst"
    ],
    "kö": [
        "können"
    ],
    "kön": [
        "können"
    ],
    "könn": [
        "können"
    ],
    "ko": [
        "konnte"
    ],
    "kon": [
        "konnte"
    ],
    "konn": [
        "konnte"
    ],
    "wi": [
        "will",
        "willst"
    ],
    "wil": [
        "will",
        "willst"
    ],
    "will": [
        "will",
        "willst"
    ],
    "wol": [
        "wollen",
        "wollte"
    ],
    "woll": [
        "wollen",
        "wollte"
    ]
},
    it: {
    "ci": [
        "ciao"
    ],
    "cia": [
        "ciao"
    ],
    "ciao": [
        "ciao"
    ],
    "bu": [
        "buongiorno",
        "buonasera"
    ],
    "buo": [
        "buongiorno",
        "buonasera"
    ],
    "buon": [
        "buongiorno",
        "buonasera"
    ],
    "gr": [
        "grazie"
    ],
    "gra": [
        "grazie"
    ],
    "graz": [
        "grazie"
    ],
    "am": [
        "amico"
    ],
    "ami": [
        "amico"
    ],
    "amic": [
        "amico"
    ],
    "be": [
        "bene"
    ],
    "ben": [
        "bene"
    ],
    "bene": [
        "bene"
    ],
    "do": [
        "dove"
    ],
    "dov": [
        "dove"
    ],
    "dove": [
        "dove"
    ],
    "qu": [
        "quando"
    ],
    "qua": [
        "quando"
    ],
    "quan": [
        "quando"
    ],
    "pe": [
        "perché"
    ],
    "per": [
        "perché"
    ],
    "perc": [
        "perché"
    ],
    "fa": [
        "fare",
        "faccio",
        "fai",
        "fa",
        "facciamo",
        "fanno",
        "fatto"
    ],
    "far": [
        "fare"
    ],
    "fare": [
        "fare"
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
    "me": [
        "messaggio"
    ],
    "mes": [
        "messaggio"
    ],
    "mess": [
        "messaggio"
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
    "ca": [
        "casa",
        "caffè"
    ],
    "cas": [
        "casa"
    ],
    "casa": [
        "casa"
    ],
    "ac": [
        "acqua"
    ],
    "acq": [
        "acqua"
    ],
    "acqu": [
        "acqua"
    ],
    "caf": [
        "caffè"
    ],
    "caff": [
        "caffè"
    ],
    "cm": [
        "cmq"
    ],
    "cmq": [
        "cmq"
    ],
    "xk": [
        "xk"
    ],
    "ri": [
        "risp"
    ],
    "ris": [
        "risp"
    ],
    "risp": [
        "risp"
    ],
    "tv": [
        "tvb"
    ],
    "tvb": [
        "tvb"
    ],
    "nn": [
        "nn"
    ],
    "sn": [
        "sn"
    ],
    "fac": [
        "faccio",
        "facciamo"
    ],
    "facc": [
        "faccio",
        "facciamo"
    ],
    "fai": [
        "fai"
    ],
    "fan": [
        "fanno"
    ],
    "fann": [
        "fanno"
    ],
    "fat": [
        "fatto"
    ],
    "fatt": [
        "fatto"
    ],
    "ho": [
        "ho"
    ],
    "ha": [
        "hai",
        "ha",
        "hanno"
    ],
    "hai": [
        "hai"
    ],
    "ab": [
        "abbiamo"
    ],
    "abb": [
        "abbiamo"
    ],
    "abbi": [
        "abbiamo"
    ],
    "han": [
        "hanno"
    ],
    "hann": [
        "hanno"
    ],
    "av": [
        "avuto"
    ],
    "avu": [
        "avuto"
    ],
    "avut": [
        "avuto"
    ],
    "so": [
        "sono"
    ],
    "son": [
        "sono"
    ],
    "sono": [
        "sono"
    ],
    "se": [
        "sei"
    ],
    "sei": [
        "sei"
    ],
    "si": [
        "siamo"
    ],
    "sia": [
        "siamo"
    ],
    "siam": [
        "siamo"
    ],
    "va": [
        "vado",
        "vai",
        "va",
        "vanno"
    ],
    "vad": [
        "vado"
    ],
    "vado": [
        "vado"
    ],
    "vai": [
        "vai"
    ],
    "an": [
        "andiamo",
        "andato"
    ],
    "and": [
        "andiamo",
        "andato"
    ],
    "andi": [
        "andiamo"
    ],
    "van": [
        "vanno"
    ],
    "vann": [
        "vanno"
    ],
    "anda": [
        "andato"
    ],
    "po": [
        "posso",
        "possiamo",
        "possono"
    ],
    "pos": [
        "posso",
        "possiamo",
        "possono"
    ],
    "poss": [
        "posso",
        "possiamo",
        "possono"
    ],
    "pu": [
        "puoi",
        "può"
    ],
    "puo": [
        "puoi"
    ],
    "puoi": [
        "puoi"
    ],
    "può": [
        "può"
    ],
    "vo": [
        "voglio",
        "vogliamo",
        "vogliono"
    ],
    "vog": [
        "voglio",
        "vogliamo",
        "vogliono"
    ],
    "vogl": [
        "voglio",
        "vogliamo",
        "vogliono"
    ],
    "vu": [
        "vuoi",
        "vuole"
    ],
    "vuo": [
        "vuoi",
        "vuole"
    ],
    "vuoi": [
        "vuoi"
    ],
    "vuol": [
        "vuole"
    ]
}
  };

  class MultilingualSuite {
    constructor() {
      this.prefixTable = MULTI_PREFIX_TABLE;
      this.es = { code: 'es', name: 'Spanish', badge: 'Español', words: new Set(ES_WORDS) };
      this.fr = { code: 'fr', name: 'French', badge: 'Français', words: new Set(FR_WORDS) };
      this.pt = { code: 'pt', name: 'Portuguese', badge: 'Português', words: new Set(PT_WORDS) };
      this.de = { code: 'de', name: 'German', badge: 'Deutsch', words: new Set(DE_WORDS) };
      this.it = { code: 'it', name: 'Italian', badge: 'Italiano', words: new Set(IT_WORDS) };
    }

    correctWord(cleanWord) {
      if (!cleanWord) return null;
      const typoMap = {
        "xq": "porque", "dnd": "dónde", "tqm": "te quiero mucho", "tkm": "te quiero mucho",
        "xfa": "por favor", "bn": "bien", "tb": "también", "pq": "porque",
        "mdr": "mort de rire", "ptdr": "pété de rire", "stp": "s'il te plaît",
        "svp": "s'il vous plaît", "bjr": "bonjour", "bsr": "bonsoir", "slt": "salut",
        "mrc": "merci", "pk": "pourquoi",
        "vc": "você", "obg": "obrigado", "pfv": "por favor", "blz": "beleza",
        "vlw": "valeu", "dps": "depois", "tmj": "tamo junto",
        "lg": "liebe grüße", "mfg": "mit freundlichen grüßen", "cu": "bis später",
        "vllt": "vielleicht", "ka": "keine ahnung",
        "cmq": "comunque", "xk": "perché", "risp": "rispondi", "tvb": "ti voglio bene",
        "nn": "non", "sn": "sono"
      };
      return typoMap[cleanWord.toLowerCase()] || null;
    }

    detect(text) {
      if (!text || typeof text !== 'string') return null;
      const lower = text.toLowerCase();
      if (/\b(hola|gracias|por favor|buenos|amigo|dónde|hacer|estás|xq|tqm)\b/i.test(lower)) return 'es';
      if (/\b(bonjour|merci|salut|s'il vous plaît|oui|non|faire|svp|mdr|ptdr)\b/i.test(lower)) return 'fr';
      if (/\b(olá|obrigado|por favor|tudo bem|você|fazer|agora|vc|obg|blz)\b/i.test(lower)) return 'pt';
      if (/\b(hallo|danke|bitte|guten|morgen|zeit|jetzt|mfg|vllt)\b/i.test(lower)) return 'de';
      if (/\b(ciao|grazie|per favore|buongiorno|stai|fare|adesso|cmq|xk|tvb)\b/i.test(lower)) return 'it';
      return null;
    }

    hasWord(word, lang) {
      if (!word) return false;
      const cleanWord = word.toLowerCase().trim();
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
