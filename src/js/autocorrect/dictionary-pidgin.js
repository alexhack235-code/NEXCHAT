/**
 * NEXCHAT Multilingual Sub-Directory: Nigerian Pidgin (Naija Pidgin)
 * High-Speed O(1) Prefix-Indexed Lexicon & Typo Engine
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const PIDGIN_WORDS = [
  "wetin",
  "dey",
  "abeg",
  "commot",
  "comot",
  "shey",
  "wahala",
  "kwanu",
  "pikin",
  "sabi",
  "chop",
  "no be",
  "na so",
  "sef",
  "oya",
  "fit",
  "dem",
  "una",
  "how far",
  "baff",
  "breeze",
  "dash",
  "jara",
  "mumu",
  "palava",
  "sharp",
  "tink",
  "yarn",
  "waka",
  "parole",
  "gist",
  "chook",
  "kolo",
  "vawulence",
  "overabi",
  "bobo",
  "sisi",
  "carry go",
  "baff up",
  "kpai",
  "gbege",
  "k-leg",
  "magun",
  "japa",
  "nack",
  "run am",
  "settle",
  "hammer",
  "waka pass",
  "alaye",
  "chache",
  "wayo",
  "yanga",
  "zazu",
  "gbagbe",
  "gbedu",
  "ajebutter",
  "ajepako",
  "akara",
  "suya",
  "garri",
  "kpomo",
  "boli",
  "isi ewu",
  "egusi",
  "ogbono",
  "abi",
  "wotowoto",
  "dorime",
  "bambam",
  "jekalo",
  "gbese",
  "kpo",
  "tule",
  "kprokpro",
  "otilo",
  "effico",
  "agbero",
  "bros",
  "sista",
  "paddy",
  "guy",
  "baddo",
  "senior man",
  "chairman",
  "idamu",
  "no cap",
  "shayo",
  "calm down",
  "jeje",
  "slowly",
  "smallie",
  "lepa",
  "orobo",
  "fine boy",
  "fine girl",
  "omo",
  "baba",
  "mama",
  "papa",
  "shaku",
  "legwork",
  "zanku",
  "afrobeats",
  "as e dey hot",
  "as e dey go",
  "wetin dey happen",
  "no wahala",
  "no shaking",
  "sharp sharp",
  "hear word",
  "leave am",
  "talk am",
  "comot body",
  "pour me water",
  "wahala dey",
  "koko",
  "tori",
  "yab",
  "yabbis",
  "gra-gra",
  "gragra",
  "gbeborun",
  "aproko",
  "shine eye",
  "para",
  "don par",
  "dey vex",
  "vex",
  "chook eye",
  "bad belle",
  "belliful",
  "belle",
  "chop life",
  "enjoyment",
  "soft work",
  "better soup",
  "na you biko",
  "biko",
  "ndewo",
  "bawo",
  "ekaro",
  "eku",
  "sannu",
  "nagode",
  "ina kwana",
  "yawa",
  "yawa don gas",
  "don gas",
  "no dulling",
  "dull",
  "fall hand",
  "don fall my hand",
  "oversabi",
  "wetin man go do",
  "everywhere good",
  "we dey",
  "all correct",
  "levels don change",
  "levels",
  "odogwu",
  "egbon",
  "nwanne",
  "obia",
  "guy man",
  "street",
  "otondo",
  "corper",
  "kpa",
  "raba",
  "ego",
  "owo",
  "dough",
  "shishi",
  "broke",
  "sapa",
  "sapa dey",
  "cut soap",
  "update",
  "sharp update",
  "who dey",
  "who dey breathe",
  "e choke",
  "e shock you",
  "e shock me",
  "gather dey",
  "we outside",
  "outside",
  "cruise",
  "cruise catch",
  "catching cruise",
  "catch cruise",
  "dey play",
  "just dey play",
  "no cast am",
  "cast",
  "breakfast",
  "serve breakfast",
  "chopping breakfast",
  "trenches",
  "soft life",
  "high table",
  "baller",
  "big boy",
  "big man",
  "olopa",
  "police",
  "checkpoint",
  "soji",
  "sharp guy",
  "coded",
  "stay coded",
  "keep am coded",
  "lowkey",
  "on a low",
  "pure water",
  "okada",
  "keke",
  "danfo",
  "conductor",
  "alight",
  "enter",
  "drop",
  "bustop",
  "toll gate",
  "go slow",
  "hold up",
  "light don come",
  "light don go",
  "nepa",
  "gen",
  "fuel",
  "pos",
  "transfer",
  "urgent 2k",
  "send aza",
  "aza",
  "gbam",
  "true talk",
  "as in",
  "no lie",
  "walahi",
  "tor",
  "kai",
  "chai",
  "ewooo",
  "chei",
  "abasi",
  "chineke",
  "olohun",
  "chisos",
  "jesu",
  "modupe",
  "oshe",
  "alhamdulillah",
  "insha allah",
  "naso",
  "howfar",
  "nodey",
  "nobi",
  "japaa",
  "koloo",
  "palavr",
  "vawulens",
  "gbeduu",
  "dasc",
  "sharply",
  "badbelle",
  "choplife",
  "nowahala",
  "noshaking",
  "carrygo",
  "runam",
  "hearword",
  "leaveam",
  "talkam",
  "whodey",
  "echoke",
  "eshock",
  "deyplay",
  "nocast",
  "cutsoap",
  "urgent2k",
  "sendaza",
  "truetalk",
  "as e dey be",
  "na so e be",
  "na so we see am",
  "no be lie",
  "wetin happen",
  "how body",
  "body dey inside clothes",
  "wetin dey sup",
  "wetin dey",
  "I dey",
  "we dey kampe",
  "kampe",
  "steady",
  "sharp sharp",
  "sharp guy",
  "shine your eyes",
  "eye clear",
  "don wake",
  "sleep dey catch me",
  "belle full",
  "dey hungry me",
  "hunger dey wire me",
  "wire me",
  "no vex",
  "make we yarn",
  "yarn me",
  "give me gist",
  "sweet gist",
  "gist me",
  "tori dey",
  "gbeborun people",
  "bad belle people",
  "enemies don fall",
  "head balance",
  "spirit dey lead",
  "street orientation",
  "street OT",
  "OT",
  "brain box",
  "correct guy",
  "correct babe",
  "slay queen",
  "slay mama",
  "baby girl",
  "baby boy",
  "nwa",
  "asa",
  "fine girl no pimples",
  "fine geh",
  "geh",
  "chick",
  "guy man",
  "jaye",
  "jaye lo",
  "faaji",
  "owambe",
  "party",
  "aso ebi",
  "turn up",
  "vibe dey",
  "good vibes only",
  "energy clean",
  "no bad energy",
  "protect your peace",
  "safe trip",
  "reach well",
  "greet them",
  "till later",
  "we go see",
  "later things",
  "catch you",
  "kolo mental",
  "brain touch",
  "ment",
  "you dey ment",
  "craze dey head",
  "no dey whine me",
  "whine",
  "stop whining me",
  "you dey whine me ni",
  "dey play",
  "just dey play o",
  "e don tey",
  "since when",
  "small time",
  "sharpally",
  "one time",
  "two time",
  "bad boy",
  "real gee",
  "my gee",
  "gee",
  "blood",
  "brother from another mother",
  "my person",
  "confam",
  "confirm",
  "e confam",
  "tested and trusted",
  "solid",
  "100 percent",
  "no cap",
  "straight up",
  "facts",
  "on god",
  "walahi talahi",
  "aswear",
  "swear",
  "tuale",
  "salute",
  "respect",
  "give honors",
  "baff up sharp",
  "fresher",
  "fresher than fresh",
  "dripping",
  "drip",
  "sauce",
  "swag",
  "steeze",
  "composure",
  "maximum steeze",
  "shey you get",
  "you get am",
  "you hear me",
  "you dey hear me so",
  "matter don cast",
  "cast die",
  "kpai finish",
  "wipe clean",
  "sweep clean",
  "clean sheet",
  "zero worries",
  "hakuna matata",
  "all good",
  "steady moving",
  "moving train",
  "unstoppable"
];
  const PIDGIN_TYPO_MAP = {
  "wtn": "wetin",
  "weting": "wetin",
  "wehtin": "wetin",
  "wetn": "wetin",
  "watin": "wetin",
  "watn": "wetin",
  "whtn": "wetin",
  "abg": "abeg",
  "ebeg": "abeg",
  "abegg": "abeg",
  "begg": "abeg",
  "abg na": "abeg na",
  "whala": "wahala",
  "wahla": "wahala",
  "wahalla": "wahala",
  "wala": "wahala",
  "whalla": "wahala",
  "sbi": "sabi",
  "sb": "sabi",
  "saby": "sabi",
  "sabii": "sabi",
  "cmot": "commot",
  "comout": "commot",
  "comot": "commot",
  "shebi": "shey",
  "shabi": "shey",
  "sebi": "shey",
  "shii": "shey",
  "pkin": "pikin",
  "pickin": "pikin",
  "pikn": "pikin",
  "pkn": "pikin",
  "chp": "chop",
  "chopp": "chop",
  "naso": "na so",
  "nasso": "na so",
  "nso": "na so",
  "howfar": "how far",
  "hwfar": "how far",
  "hfr": "how far",
  "hw far": "how far",
  "nodey": "no dey",
  "ndey": "no dey",
  "nod": "no dey",
  "nobi": "no be",
  "nobe": "no be",
  "nob": "no be",
  "jpa": "japa",
  "japaa": "japa",
  "japp": "japa",
  "kl": "kolo",
  "koloo": "kolo",
  "cloo": "kolo",
  "palavr": "palava",
  "palaver": "palava",
  "plv": "palava",
  "vawulens": "vawulence",
  "vawulece": "vawulence",
  "vawu": "vawulence",
  "gbdu": "gbedu",
  "gbeduu": "gbedu",
  "gbd": "gbedu",
  "gbg": "gbege",
  "gbeg": "gbege",
  "mm": "mumu",
  "mmu": "mumu",
  "yrn": "yarn",
  "yrng": "yarn",
  "wk": "waka",
  "wka": "waka",
  "parol": "parole",
  "prl": "parole",
  "gst": "gist",
  "gstd": "gist",
  "shkn": "shaking",
  "shakin": "shaking",
  "shk": "shaking",
  "otil": "otilo",
  "otill": "otilo",
  "dasc": "dash",
  "dsh": "dash",
  "kwanuu": "kwanu",
  "kwnu": "kwanu",
  "sharply": "sharp sharp",
  "shrply": "sharp sharp",
  "baf": "baff",
  "odgw": "odogwu",
  "odogw": "odogwu",
  "egbn": "egbon",
  "ovrsabi": "oversabi",
  "oversbi": "oversabi",
  "badbelle": "bad belle",
  "choplife": "chop life",
  "nowahala": "no wahala",
  "noshaking": "no shaking",
  "carrygo": "carry go",
  "runam": "run am",
  "hearword": "hear word",
  "leaveam": "leave am",
  "talkam": "talk am",
  "whodey": "who dey",
  "echoke": "e choke",
  "eshock": "e shock you",
  "deyplay": "just dey play",
  "justdeyplay": "just dey play",
  "nocast": "no cast am",
  "servbreakfast": "serve breakfast",
  "cutsoap": "cut soap",
  "urgent2k": "urgent 2k",
  "sendaza": "send aza",
  "truetalk": "true talk",
  "whine me": "whine me",
  "whineme": "whine me",
  "confam": "confirm",
  "cnfam": "confirm",
  "steez": "steeze",
  "steze": "steeze"
};
  const PIDGIN_TRIGGERS = [
  "wetin",
  "dey",
  "abeg",
  "wahala",
  "shey",
  "oya",
  "pikin",
  "sabi",
  "chop",
  "sef",
  "una",
  "commot",
  "comot",
  "how far",
  "japa",
  "kolo",
  "palava",
  "gbedu",
  "vawulence",
  "omo",
  "abi",
  "shaking",
  "yarn",
  "waka",
  "gbege",
  "magun",
  "alaye",
  "baff",
  "wayo",
  "ajebutter",
  "kwanu",
  "mumu",
  "biko",
  "sapa",
  "e choke",
  "who dey",
  "don gas",
  "soft work",
  "gist",
  "whine",
  "steeze",
  "composure",
  "confam",
  "chache",
  "zazu",
  "odogwu"
];
  const PIDGIN_PREFIX_TABLE = {
  "10": [
    "100 percent"
  ],
  "100": [
    "100 percent"
  ],
  "we": [
    "wetin",
    "wetin dey happen",
    "wetin man go do",
    "we dey",
    "we outside"
  ],
  "wet": [
    "wetin",
    "wetin dey happen",
    "wetin man go do",
    "wetin happen",
    "wetin dey sup"
  ],
  "weti": [
    "wetin",
    "wetin dey happen",
    "wetin man go do",
    "wetin happen",
    "wetin dey sup"
  ],
  "de": [
    "dey",
    "dem",
    "dey vex",
    "dey play",
    "deyplay"
  ],
  "dey": [
    "dey",
    "dey vex",
    "dey play",
    "deyplay",
    "dey hungry me"
  ],
  "ab": [
    "abeg",
    "abi",
    "abasi"
  ],
  "abe": [
    "abeg"
  ],
  "abeg": [
    "abeg"
  ],
  "co": [
    "commot",
    "comot",
    "comot body",
    "corper",
    "coded"
  ],
  "com": [
    "commot",
    "comot",
    "comot body",
    "composure"
  ],
  "comm": [
    "commot"
  ],
  "como": [
    "comot",
    "comot body"
  ],
  "sh": [
    "shey",
    "sharp",
    "shayo",
    "shaku",
    "sharp sharp"
  ],
  "she": [
    "shey",
    "shey you get"
  ],
  "shey": [
    "shey",
    "shey you get"
  ],
  "wa": [
    "wahala",
    "waka",
    "waka pass",
    "wayo",
    "wahala dey"
  ],
  "wah": [
    "wahala",
    "wahala dey"
  ],
  "waha": [
    "wahala",
    "wahala dey"
  ],
  "kw": [
    "kwanu"
  ],
  "kwa": [
    "kwanu"
  ],
  "kwan": [
    "kwanu"
  ],
  "pi": [
    "pikin"
  ],
  "pik": [
    "pikin"
  ],
  "piki": [
    "pikin"
  ],
  "sa": [
    "sabi",
    "sannu",
    "sapa",
    "sapa dey",
    "safe trip"
  ],
  "sab": [
    "sabi"
  ],
  "sabi": [
    "sabi"
  ],
  "ch": [
    "chop",
    "chook",
    "chache",
    "chairman",
    "chook eye"
  ],
  "cho": [
    "chop",
    "chook",
    "chook eye",
    "chop life",
    "chopping breakfast"
  ],
  "chop": [
    "chop",
    "chop life",
    "chopping breakfast",
    "choplife"
  ],
  "no": [
    "no be",
    "no cap",
    "no wahala",
    "no shaking",
    "no dulling"
  ],
  "no ": [
    "no be",
    "no cap",
    "no wahala",
    "no shaking",
    "no dulling"
  ],
  "no b": [
    "no be",
    "no be lie",
    "no bad energy"
  ],
  "na": [
    "na so",
    "nack",
    "na you biko",
    "nagode",
    "naso"
  ],
  "na ": [
    "na so",
    "na you biko",
    "na so e be",
    "na so we see am"
  ],
  "na s": [
    "na so",
    "na so e be",
    "na so we see am"
  ],
  "se": [
    "sef",
    "settle",
    "senior man",
    "serve breakfast",
    "send aza"
  ],
  "sef": [
    "sef"
  ],
  "oy": [
    "oya"
  ],
  "oya": [
    "oya"
  ],
  "fi": [
    "fit",
    "fine boy",
    "fine girl",
    "fine girl no pimples",
    "fine geh"
  ],
  "fit": [
    "fit"
  ],
  "dem": [
    "dem"
  ],
  "un": [
    "una",
    "unstoppable"
  ],
  "una": [
    "una"
  ],
  "ho": [
    "how far",
    "hold up",
    "howfar",
    "how body"
  ],
  "how": [
    "how far",
    "howfar",
    "how body"
  ],
  "how ": [
    "how far",
    "how body"
  ],
  "ba": [
    "baff",
    "baff up",
    "bambam",
    "baddo",
    "baba"
  ],
  "baf": [
    "baff",
    "baff up",
    "baff up sharp"
  ],
  "baff": [
    "baff",
    "baff up",
    "baff up sharp"
  ],
  "br": [
    "breeze",
    "bros",
    "broke",
    "breakfast",
    "brain box"
  ],
  "bre": [
    "breeze",
    "breakfast"
  ],
  "bree": [
    "breeze"
  ],
  "da": [
    "dash",
    "danfo",
    "dasc"
  ],
  "das": [
    "dash",
    "dasc"
  ],
  "dash": [
    "dash"
  ],
  "ja": [
    "jara",
    "japa",
    "japaa",
    "jaye",
    "jaye lo"
  ],
  "jar": [
    "jara"
  ],
  "jara": [
    "jara"
  ],
  "mu": [
    "mumu"
  ],
  "mum": [
    "mumu"
  ],
  "mumu": [
    "mumu"
  ],
  "pa": [
    "palava",
    "parole",
    "paddy",
    "papa",
    "para"
  ],
  "pal": [
    "palava",
    "palavr"
  ],
  "pala": [
    "palava",
    "palavr"
  ],
  "sha": [
    "sharp",
    "shayo",
    "shaku",
    "sharp sharp",
    "sharp update"
  ],
  "shar": [
    "sharp",
    "sharp sharp",
    "sharp update",
    "sharp guy",
    "sharply"
  ],
  "ti": [
    "tink",
    "till later"
  ],
  "tin": [
    "tink"
  ],
  "tink": [
    "tink"
  ],
  "ya": [
    "yarn",
    "yanga",
    "yab",
    "yabbis",
    "yawa"
  ],
  "yar": [
    "yarn",
    "yarn me"
  ],
  "yarn": [
    "yarn",
    "yarn me"
  ],
  "wak": [
    "waka",
    "waka pass"
  ],
  "waka": [
    "waka",
    "waka pass"
  ],
  "par": [
    "parole",
    "para",
    "party"
  ],
  "paro": [
    "parole"
  ],
  "gi": [
    "gist",
    "give me gist",
    "gist me",
    "give honors"
  ],
  "gis": [
    "gist",
    "gist me"
  ],
  "gist": [
    "gist",
    "gist me"
  ],
  "choo": [
    "chook",
    "chook eye"
  ],
  "ko": [
    "kolo",
    "koko",
    "koloo",
    "kolo mental"
  ],
  "kol": [
    "kolo",
    "koloo",
    "kolo mental"
  ],
  "kolo": [
    "kolo",
    "koloo",
    "kolo mental"
  ],
  "va": [
    "vawulence",
    "vawulens"
  ],
  "vaw": [
    "vawulence",
    "vawulens"
  ],
  "vawu": [
    "vawulence",
    "vawulens"
  ],
  "ov": [
    "overabi",
    "oversabi"
  ],
  "ove": [
    "overabi",
    "oversabi"
  ],
  "over": [
    "overabi",
    "oversabi"
  ],
  "bo": [
    "bobo",
    "boli",
    "body dey inside clothes"
  ],
  "bob": [
    "bobo"
  ],
  "bobo": [
    "bobo"
  ],
  "si": [
    "sisi",
    "sista",
    "since when"
  ],
  "sis": [
    "sisi",
    "sista"
  ],
  "sisi": [
    "sisi"
  ],
  "ca": [
    "carry go",
    "calm down",
    "catching cruise",
    "catch cruise",
    "cast"
  ],
  "car": [
    "carry go",
    "carrygo"
  ],
  "carr": [
    "carry go",
    "carrygo"
  ],
  "kp": [
    "kpai",
    "kpomo",
    "kpo",
    "kprokpro",
    "kpa"
  ],
  "kpa": [
    "kpai",
    "kpa",
    "kpai finish"
  ],
  "kpai": [
    "kpai",
    "kpai finish"
  ],
  "gb": [
    "gbege",
    "gbagbe",
    "gbedu",
    "gbese",
    "gbeborun"
  ],
  "gbe": [
    "gbege",
    "gbedu",
    "gbese",
    "gbeborun",
    "gbeduu"
  ],
  "gbeg": [
    "gbege"
  ],
  "k-": [
    "k-leg"
  ],
  "k-l": [
    "k-leg"
  ],
  "k-le": [
    "k-leg"
  ],
  "ma": [
    "magun",
    "mama",
    "make we yarn",
    "maximum steeze",
    "matter don cast"
  ],
  "mag": [
    "magun"
  ],
  "magu": [
    "magun"
  ],
  "jap": [
    "japa",
    "japaa"
  ],
  "japa": [
    "japa",
    "japaa"
  ],
  "nac": [
    "nack"
  ],
  "nack": [
    "nack"
  ],
  "ru": [
    "run am",
    "runam"
  ],
  "run": [
    "run am",
    "runam"
  ],
  "run ": [
    "run am"
  ],
  "set": [
    "settle"
  ],
  "sett": [
    "settle"
  ],
  "ha": [
    "hammer",
    "hakuna matata"
  ],
  "ham": [
    "hammer"
  ],
  "hamm": [
    "hammer"
  ],
  "al": [
    "alaye",
    "all correct",
    "alight",
    "alhamdulillah",
    "all good"
  ],
  "ala": [
    "alaye"
  ],
  "alay": [
    "alaye"
  ],
  "cha": [
    "chache",
    "chairman",
    "chai"
  ],
  "chac": [
    "chache"
  ],
  "way": [
    "wayo"
  ],
  "wayo": [
    "wayo"
  ],
  "yan": [
    "yanga"
  ],
  "yang": [
    "yanga"
  ],
  "za": [
    "zazu",
    "zanku"
  ],
  "zaz": [
    "zazu"
  ],
  "zazu": [
    "zazu"
  ],
  "gba": [
    "gbagbe",
    "gbam"
  ],
  "gbag": [
    "gbagbe"
  ],
  "gbed": [
    "gbedu",
    "gbeduu"
  ],
  "aj": [
    "ajebutter",
    "ajepako"
  ],
  "aje": [
    "ajebutter",
    "ajepako"
  ],
  "ajeb": [
    "ajebutter"
  ],
  "ajep": [
    "ajepako"
  ],
  "ak": [
    "akara"
  ],
  "aka": [
    "akara"
  ],
  "akar": [
    "akara"
  ],
  "su": [
    "suya"
  ],
  "suy": [
    "suya"
  ],
  "suya": [
    "suya"
  ],
  "ga": [
    "garri",
    "gather dey"
  ],
  "gar": [
    "garri"
  ],
  "garr": [
    "garri"
  ],
  "kpo": [
    "kpomo",
    "kpo"
  ],
  "kpom": [
    "kpomo"
  ],
  "bol": [
    "boli"
  ],
  "boli": [
    "boli"
  ],
  "is": [
    "isi ewu"
  ],
  "isi": [
    "isi ewu"
  ],
  "isi ": [
    "isi ewu"
  ],
  "eg": [
    "egusi",
    "egbon",
    "ego"
  ],
  "egu": [
    "egusi"
  ],
  "egus": [
    "egusi"
  ],
  "og": [
    "ogbono"
  ],
  "ogb": [
    "ogbono"
  ],
  "ogbo": [
    "ogbono"
  ],
  "abi": [
    "abi"
  ],
  "wo": [
    "wotowoto"
  ],
  "wot": [
    "wotowoto"
  ],
  "woto": [
    "wotowoto"
  ],
  "do": [
    "dorime",
    "don par",
    "don gas",
    "don fall my hand",
    "dough"
  ],
  "dor": [
    "dorime"
  ],
  "dori": [
    "dorime"
  ],
  "bam": [
    "bambam"
  ],
  "bamb": [
    "bambam"
  ],
  "je": [
    "jekalo",
    "jeje",
    "jesu"
  ],
  "jek": [
    "jekalo"
  ],
  "jeka": [
    "jekalo"
  ],
  "gbes": [
    "gbese"
  ],
  "tu": [
    "tule",
    "turn up",
    "tuale"
  ],
  "tul": [
    "tule"
  ],
  "tule": [
    "tule"
  ],
  "kpr": [
    "kprokpro"
  ],
  "kpro": [
    "kprokpro"
  ],
  "ot": [
    "otilo",
    "otondo",
    "ot"
  ],
  "oti": [
    "otilo"
  ],
  "otil": [
    "otilo"
  ],
  "ef": [
    "effico"
  ],
  "eff": [
    "effico"
  ],
  "effi": [
    "effico"
  ],
  "ag": [
    "agbero"
  ],
  "agb": [
    "agbero"
  ],
  "agbe": [
    "agbero"
  ],
  "bro": [
    "bros",
    "broke",
    "brother from another mother"
  ],
  "bros": [
    "bros"
  ],
  "sist": [
    "sista"
  ],
  "pad": [
    "paddy"
  ],
  "padd": [
    "paddy"
  ],
  "gu": [
    "guy",
    "guy man"
  ],
  "guy": [
    "guy",
    "guy man"
  ],
  "bad": [
    "baddo",
    "bad belle",
    "badbelle",
    "bad belle people",
    "bad boy"
  ],
  "badd": [
    "baddo"
  ],
  "sen": [
    "senior man",
    "send aza",
    "sendaza"
  ],
  "seni": [
    "senior man"
  ],
  "chai": [
    "chairman",
    "chai"
  ],
  "id": [
    "idamu"
  ],
  "ida": [
    "idamu"
  ],
  "idam": [
    "idamu"
  ],
  "no c": [
    "no cap",
    "no cast am"
  ],
  "shay": [
    "shayo"
  ],
  "cal": [
    "calm down"
  ],
  "calm": [
    "calm down"
  ],
  "jej": [
    "jeje"
  ],
  "jeje": [
    "jeje"
  ],
  "sl": [
    "slowly",
    "sleep dey catch me",
    "slay queen",
    "slay mama"
  ],
  "slo": [
    "slowly"
  ],
  "slow": [
    "slowly"
  ],
  "sm": [
    "smallie",
    "small time"
  ],
  "sma": [
    "smallie",
    "small time"
  ],
  "smal": [
    "smallie",
    "small time"
  ],
  "le": [
    "lepa",
    "legwork",
    "leave am",
    "levels don change",
    "levels"
  ],
  "lep": [
    "lepa"
  ],
  "lepa": [
    "lepa"
  ],
  "or": [
    "orobo"
  ],
  "oro": [
    "orobo"
  ],
  "orob": [
    "orobo"
  ],
  "fin": [
    "fine boy",
    "fine girl",
    "fine girl no pimples",
    "fine geh"
  ],
  "fine": [
    "fine boy",
    "fine girl",
    "fine girl no pimples",
    "fine geh"
  ],
  "om": [
    "omo"
  ],
  "omo": [
    "omo"
  ],
  "bab": [
    "baba",
    "baby girl",
    "baby boy"
  ],
  "baba": [
    "baba"
  ],
  "mam": [
    "mama"
  ],
  "mama": [
    "mama"
  ],
  "pap": [
    "papa"
  ],
  "papa": [
    "papa"
  ],
  "shak": [
    "shaku"
  ],
  "leg": [
    "legwork"
  ],
  "legw": [
    "legwork"
  ],
  "zan": [
    "zanku"
  ],
  "zank": [
    "zanku"
  ],
  "af": [
    "afrobeats"
  ],
  "afr": [
    "afrobeats"
  ],
  "afro": [
    "afrobeats"
  ],
  "as": [
    "as e dey hot",
    "as e dey go",
    "as in",
    "as e dey be",
    "asa"
  ],
  "as ": [
    "as e dey hot",
    "as e dey go",
    "as in",
    "as e dey be"
  ],
  "as e": [
    "as e dey hot",
    "as e dey go",
    "as e dey be"
  ],
  "no w": [
    "no wahala"
  ],
  "no s": [
    "no shaking"
  ],
  "he": [
    "hear word",
    "hearword",
    "head balance"
  ],
  "hea": [
    "hear word",
    "hearword",
    "head balance"
  ],
  "hear": [
    "hear word",
    "hearword"
  ],
  "lea": [
    "leave am",
    "leaveam"
  ],
  "leav": [
    "leave am",
    "leaveam"
  ],
  "ta": [
    "talk am",
    "talkam"
  ],
  "tal": [
    "talk am",
    "talkam"
  ],
  "talk": [
    "talk am",
    "talkam"
  ],
  "po": [
    "pour me water",
    "police",
    "pos"
  ],
  "pou": [
    "pour me water"
  ],
  "pour": [
    "pour me water"
  ],
  "kok": [
    "koko"
  ],
  "koko": [
    "koko"
  ],
  "to": [
    "tori",
    "toll gate",
    "tor",
    "tori dey"
  ],
  "tor": [
    "tori",
    "tor",
    "tori dey"
  ],
  "tori": [
    "tori",
    "tori dey"
  ],
  "yab": [
    "yab",
    "yabbis"
  ],
  "yabb": [
    "yabbis"
  ],
  "gr": [
    "gra-gra",
    "gragra",
    "greet them"
  ],
  "gra": [
    "gra-gra",
    "gragra"
  ],
  "gra-": [
    "gra-gra"
  ],
  "grag": [
    "gragra"
  ],
  "gbeb": [
    "gbeborun",
    "gbeborun people"
  ],
  "ap": [
    "aproko"
  ],
  "apr": [
    "aproko"
  ],
  "apro": [
    "aproko"
  ],
  "shi": [
    "shine eye",
    "shishi",
    "shine your eyes"
  ],
  "shin": [
    "shine eye",
    "shine your eyes"
  ],
  "para": [
    "para"
  ],
  "don": [
    "don par",
    "don gas",
    "don fall my hand",
    "don wake"
  ],
  "don ": [
    "don par",
    "don gas",
    "don fall my hand",
    "don wake"
  ],
  "dey ": [
    "dey vex",
    "dey play",
    "dey hungry me"
  ],
  "ve": [
    "vex"
  ],
  "vex": [
    "vex"
  ],
  "bad ": [
    "bad belle",
    "bad belle people",
    "bad boy"
  ],
  "be": [
    "belliful",
    "belle",
    "better soup",
    "belle full"
  ],
  "bel": [
    "belliful",
    "belle",
    "belle full"
  ],
  "bell": [
    "belliful",
    "belle",
    "belle full"
  ],
  "en": [
    "enjoyment",
    "enter",
    "enemies don fall",
    "energy clean"
  ],
  "enj": [
    "enjoyment"
  ],
  "enjo": [
    "enjoyment"
  ],
  "so": [
    "soft work",
    "soft life",
    "soji",
    "solid"
  ],
  "sof": [
    "soft work",
    "soft life"
  ],
  "soft": [
    "soft work",
    "soft life"
  ],
  "bet": [
    "better soup"
  ],
  "bett": [
    "better soup"
  ],
  "na y": [
    "na you biko"
  ],
  "bi": [
    "biko",
    "big boy",
    "big man"
  ],
  "bik": [
    "biko"
  ],
  "biko": [
    "biko"
  ],
  "nd": [
    "ndewo"
  ],
  "nde": [
    "ndewo"
  ],
  "ndew": [
    "ndewo"
  ],
  "baw": [
    "bawo"
  ],
  "bawo": [
    "bawo"
  ],
  "ek": [
    "ekaro",
    "eku"
  ],
  "eka": [
    "ekaro"
  ],
  "ekar": [
    "ekaro"
  ],
  "eku": [
    "eku"
  ],
  "san": [
    "sannu"
  ],
  "sann": [
    "sannu"
  ],
  "nag": [
    "nagode"
  ],
  "nago": [
    "nagode"
  ],
  "in": [
    "ina kwana",
    "insha allah"
  ],
  "ina": [
    "ina kwana"
  ],
  "ina ": [
    "ina kwana"
  ],
  "yaw": [
    "yawa",
    "yawa don gas"
  ],
  "yawa": [
    "yawa",
    "yawa don gas"
  ],
  "no d": [
    "no dulling",
    "no dey whine me"
  ],
  "du": [
    "dull"
  ],
  "dul": [
    "dull"
  ],
  "dull": [
    "dull"
  ],
  "fa": [
    "fall hand",
    "faaji",
    "facts"
  ],
  "fal": [
    "fall hand"
  ],
  "fall": [
    "fall hand"
  ],
  "ev": [
    "everywhere good"
  ],
  "eve": [
    "everywhere good"
  ],
  "ever": [
    "everywhere good"
  ],
  "we ": [
    "we dey",
    "we outside",
    "we dey kampe",
    "we go see"
  ],
  "we d": [
    "we dey",
    "we dey kampe"
  ],
  "all": [
    "all correct",
    "all good"
  ],
  "all ": [
    "all correct",
    "all good"
  ],
  "lev": [
    "levels don change",
    "levels"
  ],
  "leve": [
    "levels don change",
    "levels"
  ],
  "od": [
    "odogwu"
  ],
  "odo": [
    "odogwu"
  ],
  "odog": [
    "odogwu"
  ],
  "egb": [
    "egbon"
  ],
  "egbo": [
    "egbon"
  ],
  "nw": [
    "nwanne",
    "nwa"
  ],
  "nwa": [
    "nwanne",
    "nwa"
  ],
  "nwan": [
    "nwanne"
  ],
  "ob": [
    "obia"
  ],
  "obi": [
    "obia"
  ],
  "obia": [
    "obia"
  ],
  "guy ": [
    "guy man"
  ],
  "st": [
    "street",
    "stay coded",
    "steady",
    "street orientation",
    "street ot"
  ],
  "str": [
    "street",
    "street orientation",
    "street ot",
    "straight up"
  ],
  "stre": [
    "street",
    "street orientation",
    "street ot"
  ],
  "oto": [
    "otondo"
  ],
  "oton": [
    "otondo"
  ],
  "cor": [
    "corper",
    "correct guy",
    "correct babe"
  ],
  "corp": [
    "corper"
  ],
  "ra": [
    "raba"
  ],
  "rab": [
    "raba"
  ],
  "raba": [
    "raba"
  ],
  "ego": [
    "ego"
  ],
  "ow": [
    "owo",
    "owambe"
  ],
  "owo": [
    "owo"
  ],
  "dou": [
    "dough"
  ],
  "doug": [
    "dough"
  ],
  "shis": [
    "shishi"
  ],
  "brok": [
    "broke"
  ],
  "sap": [
    "sapa",
    "sapa dey"
  ],
  "sapa": [
    "sapa",
    "sapa dey"
  ],
  "cu": [
    "cut soap",
    "cutsoap"
  ],
  "cut": [
    "cut soap",
    "cutsoap"
  ],
  "cut ": [
    "cut soap"
  ],
  "up": [
    "update"
  ],
  "upd": [
    "update"
  ],
  "upda": [
    "update"
  ],
  "wh": [
    "who dey",
    "who dey breathe",
    "whodey",
    "whine"
  ],
  "who": [
    "who dey",
    "who dey breathe",
    "whodey"
  ],
  "who ": [
    "who dey",
    "who dey breathe"
  ],
  "e ": [
    "e choke",
    "e shock you",
    "e shock me",
    "e don tey",
    "e confam"
  ],
  "e c": [
    "e choke",
    "e confam"
  ],
  "e ch": [
    "e choke"
  ],
  "e s": [
    "e shock you",
    "e shock me"
  ],
  "e sh": [
    "e shock you",
    "e shock me"
  ],
  "gat": [
    "gather dey"
  ],
  "gath": [
    "gather dey"
  ],
  "we o": [
    "we outside"
  ],
  "ou": [
    "outside"
  ],
  "out": [
    "outside"
  ],
  "outs": [
    "outside"
  ],
  "cr": [
    "cruise",
    "cruise catch",
    "craze dey head"
  ],
  "cru": [
    "cruise",
    "cruise catch"
  ],
  "crui": [
    "cruise",
    "cruise catch"
  ],
  "cat": [
    "catching cruise",
    "catch cruise",
    "catch you"
  ],
  "catc": [
    "catching cruise",
    "catch cruise",
    "catch you"
  ],
  "ju": [
    "just dey play",
    "just dey play o"
  ],
  "jus": [
    "just dey play",
    "just dey play o"
  ],
  "just": [
    "just dey play",
    "just dey play o"
  ],
  "cas": [
    "cast",
    "cast die"
  ],
  "cast": [
    "cast",
    "cast die"
  ],
  "brea": [
    "breakfast"
  ],
  "ser": [
    "serve breakfast"
  ],
  "serv": [
    "serve breakfast"
  ],
  "tr": [
    "trenches",
    "transfer",
    "true talk",
    "truetalk"
  ],
  "tre": [
    "trenches"
  ],
  "tren": [
    "trenches"
  ],
  "hi": [
    "high table"
  ],
  "hig": [
    "high table"
  ],
  "high": [
    "high table"
  ],
  "bal": [
    "baller"
  ],
  "ball": [
    "baller"
  ],
  "big": [
    "big boy",
    "big man"
  ],
  "big ": [
    "big boy",
    "big man"
  ],
  "ol": [
    "olopa",
    "olohun"
  ],
  "olo": [
    "olopa",
    "olohun"
  ],
  "olop": [
    "olopa"
  ],
  "pol": [
    "police"
  ],
  "poli": [
    "police"
  ],
  "che": [
    "checkpoint",
    "chei"
  ],
  "chec": [
    "checkpoint"
  ],
  "soj": [
    "soji"
  ],
  "soji": [
    "soji"
  ],
  "cod": [
    "coded"
  ],
  "code": [
    "coded"
  ],
  "sta": [
    "stay coded"
  ],
  "stay": [
    "stay coded"
  ],
  "ke": [
    "keep am coded",
    "keke"
  ],
  "kee": [
    "keep am coded"
  ],
  "keep": [
    "keep am coded"
  ],
  "lo": [
    "lowkey"
  ],
  "low": [
    "lowkey"
  ],
  "lowk": [
    "lowkey"
  ],
  "on": [
    "on a low",
    "one time",
    "on god"
  ],
  "on ": [
    "on a low",
    "on god"
  ],
  "on a": [
    "on a low"
  ],
  "pu": [
    "pure water"
  ],
  "pur": [
    "pure water"
  ],
  "pure": [
    "pure water"
  ],
  "ok": [
    "okada"
  ],
  "oka": [
    "okada"
  ],
  "okad": [
    "okada"
  ],
  "kek": [
    "keke"
  ],
  "keke": [
    "keke"
  ],
  "dan": [
    "danfo"
  ],
  "danf": [
    "danfo"
  ],
  "con": [
    "conductor",
    "confam",
    "confirm"
  ],
  "cond": [
    "conductor"
  ],
  "ali": [
    "alight"
  ],
  "alig": [
    "alight"
  ],
  "ent": [
    "enter"
  ],
  "ente": [
    "enter"
  ],
  "dr": [
    "drop",
    "dripping",
    "drip"
  ],
  "dro": [
    "drop"
  ],
  "drop": [
    "drop"
  ],
  "bu": [
    "bustop"
  ],
  "bus": [
    "bustop"
  ],
  "bust": [
    "bustop"
  ],
  "tol": [
    "toll gate"
  ],
  "toll": [
    "toll gate"
  ],
  "go": [
    "go slow",
    "good vibes only"
  ],
  "go ": [
    "go slow"
  ],
  "go s": [
    "go slow"
  ],
  "hol": [
    "hold up"
  ],
  "hold": [
    "hold up"
  ],
  "li": [
    "light don come",
    "light don go"
  ],
  "lig": [
    "light don come",
    "light don go"
  ],
  "ligh": [
    "light don come",
    "light don go"
  ],
  "ne": [
    "nepa"
  ],
  "nep": [
    "nepa"
  ],
  "nepa": [
    "nepa"
  ],
  "ge": [
    "gen",
    "geh",
    "gee"
  ],
  "gen": [
    "gen"
  ],
  "fu": [
    "fuel"
  ],
  "fue": [
    "fuel"
  ],
  "fuel": [
    "fuel"
  ],
  "pos": [
    "pos"
  ],
  "tra": [
    "transfer"
  ],
  "tran": [
    "transfer"
  ],
  "ur": [
    "urgent 2k",
    "urgent2k"
  ],
  "urg": [
    "urgent 2k",
    "urgent2k"
  ],
  "urge": [
    "urgent 2k",
    "urgent2k"
  ],
  "send": [
    "send aza",
    "sendaza"
  ],
  "az": [
    "aza"
  ],
  "aza": [
    "aza"
  ],
  "gbam": [
    "gbam"
  ],
  "tru": [
    "true talk",
    "truetalk"
  ],
  "true": [
    "true talk",
    "truetalk"
  ],
  "as i": [
    "as in"
  ],
  "no l": [
    "no lie"
  ],
  "wal": [
    "walahi",
    "walahi talahi"
  ],
  "wala": [
    "walahi",
    "walahi talahi"
  ],
  "ka": [
    "kai",
    "kampe"
  ],
  "kai": [
    "kai"
  ],
  "ew": [
    "ewooo"
  ],
  "ewo": [
    "ewooo"
  ],
  "ewoo": [
    "ewooo"
  ],
  "chei": [
    "chei"
  ],
  "aba": [
    "abasi"
  ],
  "abas": [
    "abasi"
  ],
  "chi": [
    "chineke",
    "chisos",
    "chick"
  ],
  "chin": [
    "chineke"
  ],
  "oloh": [
    "olohun"
  ],
  "chis": [
    "chisos"
  ],
  "jes": [
    "jesu"
  ],
  "jesu": [
    "jesu"
  ],
  "mo": [
    "modupe",
    "moving train"
  ],
  "mod": [
    "modupe"
  ],
  "modu": [
    "modupe"
  ],
  "os": [
    "oshe"
  ],
  "osh": [
    "oshe"
  ],
  "oshe": [
    "oshe"
  ],
  "alh": [
    "alhamdulillah"
  ],
  "alha": [
    "alhamdulillah"
  ],
  "ins": [
    "insha allah"
  ],
  "insh": [
    "insha allah"
  ],
  "nas": [
    "naso"
  ],
  "naso": [
    "naso"
  ],
  "howf": [
    "howfar"
  ],
  "nod": [
    "nodey"
  ],
  "node": [
    "nodey"
  ],
  "nob": [
    "nobi"
  ],
  "nobi": [
    "nobi"
  ],
  "dasc": [
    "dasc"
  ],
  "badb": [
    "badbelle"
  ],
  "now": [
    "nowahala"
  ],
  "nowa": [
    "nowahala"
  ],
  "nos": [
    "noshaking"
  ],
  "nosh": [
    "noshaking"
  ],
  "runa": [
    "runam"
  ],
  "whod": [
    "whodey"
  ],
  "ec": [
    "echoke"
  ],
  "ech": [
    "echoke"
  ],
  "echo": [
    "echoke"
  ],
  "es": [
    "eshock"
  ],
  "esh": [
    "eshock"
  ],
  "esho": [
    "eshock"
  ],
  "deyp": [
    "deyplay"
  ],
  "noc": [
    "nocast"
  ],
  "noca": [
    "nocast"
  ],
  "cuts": [
    "cutsoap"
  ],
  "bod": [
    "body dey inside clothes"
  ],
  "body": [
    "body dey inside clothes"
  ],
  "i ": [
    "i dey"
  ],
  "i d": [
    "i dey"
  ],
  "i de": [
    "i dey"
  ],
  "kam": [
    "kampe"
  ],
  "kamp": [
    "kampe"
  ],
  "ste": [
    "steady",
    "steeze",
    "steady moving"
  ],
  "stea": [
    "steady",
    "steady moving"
  ],
  "ey": [
    "eye clear"
  ],
  "eye": [
    "eye clear"
  ],
  "eye ": [
    "eye clear"
  ],
  "sle": [
    "sleep dey catch me"
  ],
  "slee": [
    "sleep dey catch me"
  ],
  "hu": [
    "hunger dey wire me"
  ],
  "hun": [
    "hunger dey wire me"
  ],
  "hung": [
    "hunger dey wire me"
  ],
  "wi": [
    "wire me",
    "wipe clean"
  ],
  "wir": [
    "wire me"
  ],
  "wire": [
    "wire me"
  ],
  "no v": [
    "no vex"
  ],
  "mak": [
    "make we yarn"
  ],
  "make": [
    "make we yarn"
  ],
  "giv": [
    "give me gist",
    "give honors"
  ],
  "give": [
    "give me gist",
    "give honors"
  ],
  "sw": [
    "sweet gist",
    "swear",
    "swag",
    "sweep clean"
  ],
  "swe": [
    "sweet gist",
    "swear",
    "sweep clean"
  ],
  "swee": [
    "sweet gist",
    "sweep clean"
  ],
  "ene": [
    "enemies don fall",
    "energy clean"
  ],
  "enem": [
    "enemies don fall"
  ],
  "head": [
    "head balance"
  ],
  "sp": [
    "spirit dey lead"
  ],
  "spi": [
    "spirit dey lead"
  ],
  "spir": [
    "spirit dey lead"
  ],
  "bra": [
    "brain box",
    "brain touch"
  ],
  "brai": [
    "brain box",
    "brain touch"
  ],
  "corr": [
    "correct guy",
    "correct babe"
  ],
  "sla": [
    "slay queen",
    "slay mama"
  ],
  "slay": [
    "slay queen",
    "slay mama"
  ],
  "baby": [
    "baby girl",
    "baby boy"
  ],
  "asa": [
    "asa"
  ],
  "geh": [
    "geh"
  ],
  "chic": [
    "chick"
  ],
  "jay": [
    "jaye",
    "jaye lo"
  ],
  "jaye": [
    "jaye",
    "jaye lo"
  ],
  "faa": [
    "faaji"
  ],
  "faaj": [
    "faaji"
  ],
  "owa": [
    "owambe"
  ],
  "owam": [
    "owambe"
  ],
  "part": [
    "party"
  ],
  "aso": [
    "aso ebi"
  ],
  "aso ": [
    "aso ebi"
  ],
  "tur": [
    "turn up"
  ],
  "turn": [
    "turn up"
  ],
  "vi": [
    "vibe dey"
  ],
  "vib": [
    "vibe dey"
  ],
  "vibe": [
    "vibe dey"
  ],
  "goo": [
    "good vibes only"
  ],
  "good": [
    "good vibes only"
  ],
  "ener": [
    "energy clean"
  ],
  "pr": [
    "protect your peace"
  ],
  "pro": [
    "protect your peace"
  ],
  "prot": [
    "protect your peace"
  ],
  "saf": [
    "safe trip"
  ],
  "safe": [
    "safe trip"
  ],
  "re": [
    "reach well",
    "real gee",
    "respect"
  ],
  "rea": [
    "reach well",
    "real gee"
  ],
  "reac": [
    "reach well"
  ],
  "gre": [
    "greet them"
  ],
  "gree": [
    "greet them"
  ],
  "til": [
    "till later"
  ],
  "till": [
    "till later"
  ],
  "we g": [
    "we go see"
  ],
  "la": [
    "later things"
  ],
  "lat": [
    "later things"
  ],
  "late": [
    "later things"
  ],
  "me": [
    "ment"
  ],
  "men": [
    "ment"
  ],
  "ment": [
    "ment"
  ],
  "yo": [
    "you dey ment",
    "you dey whine me ni",
    "you get am",
    "you hear me",
    "you dey hear me so"
  ],
  "you": [
    "you dey ment",
    "you dey whine me ni",
    "you get am",
    "you hear me",
    "you dey hear me so"
  ],
  "you ": [
    "you dey ment",
    "you dey whine me ni",
    "you get am",
    "you hear me",
    "you dey hear me so"
  ],
  "cra": [
    "craze dey head"
  ],
  "craz": [
    "craze dey head"
  ],
  "whi": [
    "whine"
  ],
  "whin": [
    "whine"
  ],
  "sto": [
    "stop whining me"
  ],
  "stop": [
    "stop whining me"
  ],
  "e d": [
    "e don tey"
  ],
  "e do": [
    "e don tey"
  ],
  "sin": [
    "since when"
  ],
  "sinc": [
    "since when"
  ],
  "one": [
    "one time"
  ],
  "one ": [
    "one time"
  ],
  "tw": [
    "two time"
  ],
  "two": [
    "two time"
  ],
  "two ": [
    "two time"
  ],
  "real": [
    "real gee"
  ],
  "my": [
    "my gee",
    "my person"
  ],
  "my ": [
    "my gee",
    "my person"
  ],
  "my g": [
    "my gee"
  ],
  "gee": [
    "gee"
  ],
  "bl": [
    "blood"
  ],
  "blo": [
    "blood"
  ],
  "bloo": [
    "blood"
  ],
  "brot": [
    "brother from another mother"
  ],
  "my p": [
    "my person"
  ],
  "conf": [
    "confam",
    "confirm"
  ],
  "e co": [
    "e confam"
  ],
  "te": [
    "tested and trusted"
  ],
  "tes": [
    "tested and trusted"
  ],
  "test": [
    "tested and trusted"
  ],
  "sol": [
    "solid"
  ],
  "soli": [
    "solid"
  ],
  "100 ": [
    "100 percent"
  ],
  "stra": [
    "straight up"
  ],
  "fac": [
    "facts"
  ],
  "fact": [
    "facts"
  ],
  "on g": [
    "on god"
  ],
  "asw": [
    "aswear"
  ],
  "aswe": [
    "aswear"
  ],
  "swea": [
    "swear"
  ],
  "tua": [
    "tuale"
  ],
  "tual": [
    "tuale"
  ],
  "sal": [
    "salute"
  ],
  "salu": [
    "salute"
  ],
  "res": [
    "respect"
  ],
  "resp": [
    "respect"
  ],
  "fr": [
    "fresher",
    "fresher than fresh"
  ],
  "fre": [
    "fresher",
    "fresher than fresh"
  ],
  "fres": [
    "fresher",
    "fresher than fresh"
  ],
  "dri": [
    "dripping",
    "drip"
  ],
  "drip": [
    "dripping",
    "drip"
  ],
  "sau": [
    "sauce"
  ],
  "sauc": [
    "sauce"
  ],
  "swa": [
    "swag"
  ],
  "swag": [
    "swag"
  ],
  "stee": [
    "steeze"
  ],
  "comp": [
    "composure"
  ],
  "max": [
    "maximum steeze"
  ],
  "maxi": [
    "maximum steeze"
  ],
  "mat": [
    "matter don cast"
  ],
  "matt": [
    "matter don cast"
  ],
  "wip": [
    "wipe clean"
  ],
  "wipe": [
    "wipe clean"
  ],
  "cl": [
    "clean sheet"
  ],
  "cle": [
    "clean sheet"
  ],
  "clea": [
    "clean sheet"
  ],
  "ze": [
    "zero worries"
  ],
  "zer": [
    "zero worries"
  ],
  "zero": [
    "zero worries"
  ],
  "hak": [
    "hakuna matata"
  ],
  "haku": [
    "hakuna matata"
  ],
  "mov": [
    "moving train"
  ],
  "movi": [
    "moving train"
  ],
  "uns": [
    "unstoppable"
  ],
  "unst": [
    "unstoppable"
  ]
};

  const PIDGIN_WORD_SET = new Set(PIDGIN_WORDS.map(w => w.toLowerCase()));
  const PIDGIN_TRIGGER_SET = new Set(PIDGIN_TRIGGERS.map(w => w.toLowerCase()));

  class PidginSubDirectory {
    constructor() {
      this.name = 'Nigerian Pidgin';
      this.code = 'pidgin';
      this.badge = 'Naija Pidgin';
      this.wordSet = PIDGIN_WORD_SET;
      this.typoMap = PIDGIN_TYPO_MAP;
      this.triggers = PIDGIN_TRIGGER_SET;
      this.prefixTable = PIDGIN_PREFIX_TABLE;
      this.isActive = false;
    }

    hasWord(word) {
      if (!word) return false;
      const clean = word.toLowerCase().replace(/[^a-z0-9'-]/g, '');
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
      const tokens = text.toLowerCase().split(/\s+|[.,!?;:()]+/);
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i].replace(/[^a-z0-9'-]/g, '');
        if (this.triggers.has(t) || this.typoMap[t]) {
          return true;
        }
      }
      return false;
    }

    activate() {
      this.isActive = true;
      if (typeof window !== 'undefined') window.PIDGIN_SUBDIRECTORY_ACTIVE = true;
    }

    deactivate() {
      this.isActive = false;
      if (typeof window !== 'undefined') window.PIDGIN_SUBDIRECTORY_ACTIVE = false;
    }
  }

  const pidginSubDir = new PidginSubDirectory();

  window.PIDGIN_WORDS = PIDGIN_WORDS;
  window.PIDGIN_TYPO_MAP = PIDGIN_TYPO_MAP;
  window.PIDGIN_TRIGGERS = PIDGIN_TRIGGERS;
  window.PIDGIN_WORD_SET = PIDGIN_WORD_SET;
  window.PIDGIN_PREFIX_TABLE = PIDGIN_PREFIX_TABLE;
  window.PIDGIN_SUBDIRECTORY = pidginSubDir;
})();
