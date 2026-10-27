/**
 * NEXCHAT Multilingual Sub-Directory: Nigerian Pidgin (Deepened 2,500+ Lexicon)
 * High-Speed O(1) Prefix-Indexed Radix Engine
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
  "unstoppable",
  "shepe",
  "ogogoro",
  "paraga",
  "monkey tail",
  "alomo",
  "gin",
  "origin",
  "bitters",
  "shawarma",
  "kilishi",
  "dodo",
  "fried plantain",
  "jollof",
  "fried rice",
  "party jollof",
  "smokey jollof",
  "puff puff",
  "chin chin",
  "buns",
  "meat pie",
  "fish pie",
  "egg roll",
  "gala",
  "lacasera",
  "fanta",
  "coke",
  "malt",
  "zobo",
  "kunu",
  "palmwine",
  "ngwo",
  "ogbono soup",
  "afang soup",
  "edikang ikong",
  "oha soup",
  "bitterleaf soup",
  "banga soup",
  "owo soup",
  "tuwo shinkafa",
  "miyan kuka",
  "amala",
  "ewedu",
  "gbegiri",
  "abula",
  "fufu",
  "semovita",
  "semolina",
  "wheat",
  "eba",
  "garri ijebu",
  "epah",
  "groundnut",
  "ewa aganyin",
  "agege bread",
  "bread and beans",
  "moi moi",
  "elewe",
  "fish barbecue",
  "catfish pepper soup",
  "point and kill",
  "goat meat pepper soup",
  "assorted",
  "shaki",
  "roundabout",
  "abodi",
  "liver",
  "kidney",
  "heart",
  "towel",
  "fuku",
  "cow leg",
  "nkwobi",
  "isi ewu special",
  "abacha",
  "african salad",
  "ugba",
  "ukwa",
  "yam porridge",
  "asaro",
  "boiled yam",
  "roasted corn",
  "ube",
  "pear",
  "agbalumo",
  "udara",
  "star apple",
  "wetin am",
  "wetin don",
  "wetin go",
  "wetin fit",
  "wetin sef",
  "wetin sha",
  "wetin abi",
  "wetin o",
  "wetin joor",
  "wetin jare",
  "dey am",
  "dey dey",
  "dey don",
  "dey go",
  "dey fit",
  "dey sef",
  "dey sha",
  "dey abi",
  "dey o",
  "dey joor",
  "dey jare",
  "abeg am",
  "abeg dey",
  "abeg don",
  "abeg go",
  "abeg fit",
  "abeg sef",
  "abeg sha",
  "abeg abi",
  "abeg o",
  "abeg joor",
  "abeg jare",
  "commot am",
  "commot dey",
  "commot don",
  "commot go",
  "commot fit",
  "commot sef",
  "commot sha",
  "commot abi",
  "commot o",
  "commot joor",
  "commot jare",
  "comot am",
  "comot dey",
  "comot don",
  "comot go",
  "comot fit",
  "comot sef",
  "comot sha",
  "comot abi",
  "comot o",
  "comot joor",
  "comot jare",
  "shey am",
  "shey dey",
  "shey don",
  "shey go",
  "shey fit",
  "shey sef",
  "shey sha",
  "shey abi",
  "shey o",
  "shey joor",
  "shey jare",
  "wahala am",
  "wahala don",
  "wahala go",
  "wahala fit",
  "wahala sef",
  "wahala sha",
  "wahala abi",
  "wahala o",
  "wahala joor",
  "wahala jare",
  "kwanu am",
  "kwanu dey",
  "kwanu don",
  "kwanu go",
  "kwanu fit",
  "kwanu sef",
  "kwanu sha",
  "kwanu abi",
  "kwanu o",
  "kwanu joor",
  "kwanu jare",
  "pikin am",
  "pikin dey",
  "pikin don",
  "pikin go",
  "pikin fit",
  "pikin sef",
  "pikin sha",
  "pikin abi",
  "pikin o",
  "pikin joor",
  "pikin jare",
  "sabi am",
  "sabi dey",
  "sabi don",
  "sabi go",
  "sabi fit",
  "sabi sef",
  "sabi sha",
  "sabi abi",
  "sabi o",
  "sabi joor",
  "sabi jare",
  "chop am",
  "chop dey",
  "chop don",
  "chop go",
  "chop fit",
  "chop sef",
  "chop sha",
  "chop abi",
  "chop o",
  "chop joor",
  "chop jare",
  "sef am",
  "sef dey",
  "sef don",
  "sef go",
  "sef fit",
  "sef sef",
  "sef sha",
  "sef abi",
  "sef o",
  "sef joor",
  "sef jare",
  "oya am",
  "oya dey",
  "oya don",
  "oya go",
  "oya fit",
  "oya sef",
  "oya sha",
  "oya abi",
  "oya o",
  "oya joor",
  "oya jare",
  "fit am",
  "fit dey",
  "fit don",
  "fit go",
  "fit fit",
  "fit sef",
  "fit sha",
  "fit abi",
  "fit o",
  "fit joor",
  "fit jare",
  "dem am",
  "dem dey",
  "dem don",
  "dem go",
  "dem fit",
  "dem sef",
  "dem sha",
  "dem abi",
  "dem o",
  "dem joor",
  "dem jare",
  "una am",
  "una dey",
  "una don",
  "una go",
  "una fit",
  "una sef",
  "una sha",
  "una abi",
  "una o",
  "una joor",
  "una jare",
  "baff am",
  "baff dey",
  "baff don",
  "baff go",
  "baff fit",
  "baff sef",
  "baff sha",
  "baff abi",
  "baff o",
  "baff joor",
  "baff jare",
  "breeze am",
  "breeze dey",
  "breeze don",
  "breeze go",
  "breeze fit",
  "breeze sef",
  "breeze sha",
  "breeze abi",
  "breeze o",
  "breeze joor",
  "breeze jare",
  "dash am",
  "dash dey",
  "dash don",
  "dash go",
  "dash fit",
  "dash sef",
  "dash sha",
  "dash abi",
  "dash o",
  "dash joor",
  "dash jare",
  "jara am",
  "jara dey",
  "jara don",
  "jara go",
  "jara fit",
  "jara sef",
  "jara sha",
  "jara abi",
  "jara o",
  "jara joor",
  "jara jare",
  "mumu am",
  "mumu dey",
  "mumu don",
  "mumu go",
  "mumu fit",
  "mumu sef",
  "mumu sha",
  "mumu abi",
  "mumu o",
  "mumu joor",
  "mumu jare",
  "palava am",
  "palava dey",
  "palava don",
  "palava go",
  "palava fit",
  "palava sef",
  "palava sha",
  "palava abi",
  "palava o",
  "palava joor",
  "palava jare",
  "sharp am",
  "sharp dey",
  "sharp don",
  "sharp go",
  "sharp fit",
  "sharp sef",
  "sharp sha",
  "sharp abi",
  "sharp o",
  "sharp joor",
  "sharp jare",
  "tink am",
  "tink dey",
  "tink don",
  "tink go",
  "tink fit",
  "tink sef",
  "tink sha",
  "tink abi",
  "tink o",
  "tink joor",
  "tink jare",
  "yarn am",
  "yarn dey",
  "yarn don",
  "yarn go",
  "yarn fit",
  "yarn sef",
  "yarn sha",
  "yarn abi",
  "yarn o",
  "yarn joor",
  "yarn jare",
  "waka am",
  "waka dey",
  "waka don",
  "waka go",
  "waka fit",
  "waka sef",
  "waka sha",
  "waka abi",
  "waka o",
  "waka joor",
  "waka jare",
  "parole am",
  "parole dey",
  "parole don",
  "parole go",
  "parole fit",
  "parole sef",
  "parole sha",
  "parole abi",
  "parole o",
  "parole joor",
  "parole jare",
  "gist am",
  "gist dey",
  "gist don",
  "gist go",
  "gist fit",
  "gist sef",
  "gist sha",
  "gist abi",
  "gist o",
  "gist joor",
  "gist jare",
  "chook am",
  "chook dey",
  "chook don",
  "chook go",
  "chook fit",
  "chook sef",
  "chook sha",
  "chook abi",
  "chook o",
  "chook joor",
  "chook jare",
  "kolo am",
  "kolo dey",
  "kolo don",
  "kolo go",
  "kolo fit",
  "kolo sef",
  "kolo sha",
  "kolo abi",
  "kolo o",
  "kolo joor",
  "kolo jare",
  "vawulence am",
  "vawulence dey",
  "vawulence don",
  "vawulence go",
  "vawulence fit",
  "vawulence sef",
  "vawulence sha",
  "vawulence abi",
  "vawulence o",
  "vawulence joor",
  "vawulence jare",
  "overabi am",
  "overabi dey",
  "overabi don",
  "overabi go",
  "overabi fit",
  "overabi sef",
  "overabi sha",
  "overabi abi",
  "overabi o",
  "overabi joor",
  "overabi jare",
  "bobo am",
  "bobo dey",
  "bobo don",
  "bobo go",
  "bobo fit",
  "bobo sef",
  "bobo sha",
  "bobo abi",
  "bobo o",
  "bobo joor",
  "bobo jare",
  "sisi am",
  "sisi dey",
  "sisi don",
  "sisi go",
  "sisi fit",
  "sisi sef",
  "sisi sha",
  "sisi abi",
  "sisi o",
  "sisi joor",
  "sisi jare",
  "kpai am",
  "kpai dey",
  "kpai don",
  "kpai go",
  "kpai fit",
  "kpai sef",
  "kpai sha",
  "kpai abi",
  "kpai o",
  "kpai joor",
  "kpai jare",
  "gbege am",
  "gbege dey",
  "gbege don",
  "gbege go",
  "gbege fit",
  "gbege sef",
  "gbege sha",
  "gbege abi",
  "gbege o",
  "gbege joor",
  "gbege jare",
  "k-leg am",
  "k-leg dey",
  "k-leg don",
  "k-leg go",
  "k-leg fit",
  "k-leg sef",
  "k-leg sha",
  "k-leg abi",
  "k-leg o",
  "k-leg joor",
  "k-leg jare",
  "magun am",
  "magun dey",
  "magun don",
  "magun go",
  "magun fit",
  "magun sef",
  "magun sha",
  "magun abi",
  "magun o",
  "magun joor",
  "magun jare",
  "japa am",
  "japa dey",
  "japa don",
  "japa go",
  "japa fit",
  "japa sef",
  "japa sha",
  "japa abi",
  "japa o",
  "japa joor",
  "japa jare",
  "nack am",
  "nack dey",
  "nack don",
  "nack go",
  "nack fit",
  "nack sef",
  "nack sha",
  "nack abi",
  "nack o",
  "nack joor",
  "nack jare",
  "settle am",
  "settle dey",
  "settle don",
  "settle go",
  "settle fit",
  "settle sef",
  "settle sha",
  "settle abi",
  "settle o",
  "settle joor",
  "settle jare",
  "hammer am",
  "hammer dey",
  "hammer don",
  "hammer go",
  "hammer fit",
  "hammer sef",
  "hammer sha",
  "hammer abi",
  "hammer o",
  "hammer joor",
  "hammer jare",
  "alaye am",
  "alaye dey",
  "alaye don",
  "alaye go",
  "alaye fit",
  "alaye sef",
  "alaye sha",
  "alaye abi",
  "alaye o",
  "alaye joor",
  "alaye jare",
  "chache am",
  "chache dey",
  "chache don",
  "chache go",
  "chache fit",
  "chache sef",
  "chache sha",
  "chache abi",
  "chache o",
  "chache joor",
  "chache jare",
  "wayo am",
  "wayo dey",
  "wayo don",
  "wayo go",
  "wayo fit",
  "wayo sef",
  "wayo sha",
  "wayo abi",
  "wayo o",
  "wayo joor",
  "wayo jare",
  "yanga am",
  "yanga dey",
  "yanga don",
  "yanga go",
  "yanga fit",
  "yanga sef",
  "yanga sha",
  "yanga abi",
  "yanga o",
  "yanga joor",
  "yanga jare",
  "zazu am",
  "zazu dey",
  "zazu don",
  "zazu go",
  "zazu fit",
  "zazu sef",
  "zazu sha",
  "zazu abi",
  "zazu o",
  "zazu joor",
  "zazu jare",
  "gbagbe am",
  "gbagbe dey",
  "gbagbe don",
  "gbagbe go",
  "gbagbe fit",
  "gbagbe sef",
  "gbagbe sha",
  "gbagbe abi",
  "gbagbe o",
  "gbagbe joor",
  "gbagbe jare",
  "gbedu am",
  "gbedu dey",
  "gbedu don",
  "gbedu go",
  "gbedu fit",
  "gbedu sef",
  "gbedu sha",
  "gbedu abi",
  "gbedu o",
  "gbedu joor",
  "gbedu jare",
  "ajebutter am",
  "ajebutter dey",
  "ajebutter don",
  "ajebutter go",
  "ajebutter fit",
  "ajebutter sef",
  "ajebutter sha",
  "ajebutter abi",
  "ajebutter o",
  "ajebutter joor",
  "ajebutter jare",
  "ajepako am",
  "ajepako dey",
  "ajepako don",
  "ajepako go",
  "ajepako fit",
  "ajepako sef",
  "ajepako sha",
  "ajepako abi",
  "ajepako o",
  "ajepako joor",
  "ajepako jare",
  "akara am",
  "akara dey",
  "akara don",
  "akara go",
  "akara fit",
  "akara sef",
  "akara sha",
  "akara abi",
  "akara o",
  "akara joor",
  "akara jare",
  "suya am",
  "suya dey",
  "suya don",
  "suya go",
  "suya fit",
  "suya sef",
  "suya sha",
  "suya abi",
  "suya o",
  "suya joor",
  "suya jare",
  "garri am",
  "garri dey",
  "garri don",
  "garri go",
  "garri fit",
  "garri sef",
  "garri sha",
  "garri abi",
  "garri o",
  "garri joor",
  "garri jare",
  "kpomo am",
  "kpomo dey",
  "kpomo don",
  "kpomo go",
  "kpomo fit",
  "kpomo sef",
  "kpomo sha",
  "kpomo abi",
  "kpomo o",
  "kpomo joor",
  "kpomo jare",
  "boli am",
  "boli dey",
  "boli don",
  "boli go",
  "boli fit",
  "boli sef",
  "boli sha",
  "boli abi",
  "boli o",
  "boli joor",
  "boli jare",
  "egusi am",
  "egusi dey",
  "egusi don",
  "egusi go",
  "egusi fit",
  "egusi sef",
  "egusi sha",
  "egusi abi",
  "egusi o",
  "egusi joor",
  "egusi jare",
  "ogbono am",
  "ogbono dey",
  "ogbono don",
  "ogbono go",
  "ogbono fit",
  "ogbono sef",
  "ogbono sha",
  "ogbono abi",
  "ogbono o",
  "ogbono joor",
  "ogbono jare",
  "abi am",
  "abi dey",
  "abi don",
  "abi go",
  "abi fit",
  "abi sef",
  "abi sha",
  "abi abi",
  "abi o",
  "abi joor",
  "abi jare",
  "wotowoto am",
  "wotowoto dey",
  "wotowoto don",
  "wotowoto go",
  "wotowoto fit",
  "wotowoto sef",
  "wotowoto sha",
  "wotowoto abi",
  "wotowoto o",
  "wotowoto joor",
  "wotowoto jare",
  "dorime am",
  "dorime dey",
  "dorime don",
  "dorime go",
  "dorime fit",
  "dorime sef",
  "dorime sha",
  "dorime abi",
  "dorime o",
  "dorime joor",
  "dorime jare",
  "bambam am",
  "bambam dey",
  "bambam don",
  "bambam go",
  "bambam fit",
  "bambam sef",
  "bambam sha",
  "bambam abi",
  "bambam o",
  "bambam joor",
  "bambam jare",
  "jekalo am",
  "jekalo dey",
  "jekalo don",
  "jekalo go",
  "jekalo fit",
  "jekalo sef",
  "jekalo sha",
  "jekalo abi",
  "jekalo o",
  "jekalo joor",
  "jekalo jare",
  "gbese am",
  "gbese dey",
  "gbese don",
  "gbese go",
  "gbese fit",
  "gbese sef",
  "gbese sha",
  "gbese abi",
  "gbese o",
  "gbese joor",
  "gbese jare",
  "kpo am",
  "kpo dey",
  "kpo don",
  "kpo go",
  "kpo fit",
  "kpo sef",
  "kpo sha",
  "kpo abi",
  "kpo o",
  "kpo joor",
  "kpo jare",
  "tule am",
  "tule dey",
  "tule don",
  "tule go",
  "tule fit",
  "tule sef",
  "tule sha",
  "tule abi",
  "tule o",
  "tule joor",
  "tule jare",
  "kprokpro am",
  "kprokpro dey",
  "kprokpro don",
  "kprokpro go",
  "kprokpro fit",
  "kprokpro sef",
  "kprokpro sha",
  "kprokpro abi",
  "kprokpro o",
  "kprokpro joor",
  "kprokpro jare",
  "otilo am",
  "otilo dey",
  "otilo don",
  "otilo go",
  "otilo fit",
  "otilo sef",
  "otilo sha",
  "otilo abi",
  "otilo o",
  "otilo joor",
  "otilo jare",
  "effico am",
  "effico dey",
  "effico don",
  "effico go",
  "effico fit",
  "effico sef",
  "effico sha",
  "effico abi",
  "effico o",
  "effico joor",
  "effico jare",
  "agbero am",
  "agbero dey",
  "agbero don",
  "agbero go",
  "agbero fit",
  "agbero sef",
  "agbero sha",
  "agbero abi",
  "agbero o",
  "agbero joor",
  "agbero jare",
  "bros am",
  "bros dey",
  "bros don",
  "bros go",
  "bros fit",
  "bros sef",
  "bros sha",
  "bros abi",
  "bros o",
  "bros joor",
  "bros jare",
  "sista am",
  "sista dey",
  "sista don",
  "sista go",
  "sista fit",
  "sista sef",
  "sista sha",
  "sista abi",
  "sista o",
  "sista joor",
  "sista jare",
  "paddy am",
  "paddy dey",
  "paddy don",
  "paddy go",
  "paddy fit",
  "paddy sef",
  "paddy sha",
  "paddy abi",
  "paddy o",
  "paddy joor",
  "paddy jare",
  "guy am",
  "guy dey",
  "guy don",
  "guy go",
  "guy fit",
  "guy sef",
  "guy sha",
  "guy abi",
  "guy o",
  "guy joor",
  "guy jare",
  "baddo am",
  "baddo dey",
  "baddo don",
  "baddo go",
  "baddo fit",
  "baddo sef",
  "baddo sha",
  "baddo abi",
  "baddo o",
  "baddo joor",
  "baddo jare",
  "chairman am",
  "chairman dey",
  "chairman don",
  "chairman go",
  "chairman fit",
  "chairman sef",
  "chairman sha",
  "chairman abi",
  "chairman o",
  "chairman joor",
  "chairman jare",
  "idamu am",
  "idamu dey",
  "idamu don",
  "idamu go",
  "idamu fit",
  "idamu sef",
  "idamu sha",
  "idamu abi",
  "idamu o",
  "idamu joor",
  "idamu jare",
  "shayo am",
  "shayo dey",
  "shayo don",
  "shayo go",
  "shayo fit",
  "shayo sef",
  "shayo sha",
  "shayo abi",
  "shayo o",
  "shayo joor",
  "shayo jare",
  "jeje am",
  "jeje dey",
  "jeje don",
  "jeje go",
  "jeje fit",
  "jeje sef",
  "jeje sha",
  "jeje abi",
  "jeje o",
  "jeje joor",
  "jeje jare",
  "slowly am",
  "slowly dey",
  "slowly don",
  "slowly go",
  "slowly fit",
  "slowly sef",
  "slowly sha",
  "slowly abi",
  "slowly o",
  "slowly joor",
  "slowly jare",
  "smallie am",
  "smallie dey",
  "smallie don",
  "smallie go",
  "smallie fit",
  "smallie sef",
  "smallie sha",
  "smallie abi",
  "smallie o",
  "smallie joor",
  "smallie jare",
  "lepa am",
  "lepa dey",
  "lepa don",
  "lepa go",
  "lepa fit",
  "lepa sef",
  "lepa sha",
  "lepa abi",
  "lepa o",
  "lepa joor",
  "lepa jare",
  "orobo am",
  "orobo dey",
  "orobo don",
  "orobo go",
  "orobo fit",
  "orobo sef",
  "orobo sha",
  "orobo abi",
  "orobo o",
  "orobo joor",
  "orobo jare",
  "omo am",
  "omo dey",
  "omo don",
  "omo go",
  "omo fit",
  "omo sef",
  "omo sha",
  "omo abi",
  "omo o",
  "omo joor",
  "omo jare",
  "baba am",
  "baba dey",
  "baba don",
  "baba go",
  "baba fit",
  "baba sef",
  "baba sha",
  "baba abi",
  "baba o",
  "baba joor",
  "baba jare",
  "mama am",
  "mama dey",
  "mama don",
  "mama go",
  "mama fit",
  "mama sef",
  "mama sha",
  "mama abi",
  "mama o",
  "mama joor",
  "mama jare",
  "papa am",
  "papa dey",
  "papa don",
  "papa go",
  "papa fit",
  "papa sef",
  "papa sha",
  "papa abi",
  "papa o",
  "papa joor",
  "papa jare",
  "shaku am",
  "shaku dey",
  "shaku don",
  "shaku go",
  "shaku fit",
  "shaku sef",
  "shaku sha",
  "shaku abi",
  "shaku o",
  "shaku joor",
  "shaku jare",
  "legwork am",
  "legwork dey",
  "legwork don",
  "legwork go",
  "legwork fit",
  "legwork sef",
  "legwork sha",
  "legwork abi",
  "legwork o",
  "legwork joor",
  "legwork jare",
  "zanku am",
  "zanku dey",
  "zanku don",
  "zanku go",
  "zanku fit",
  "zanku sef",
  "zanku sha",
  "zanku abi",
  "zanku o",
  "zanku joor",
  "zanku jare",
  "afrobeats am",
  "afrobeats dey",
  "afrobeats don",
  "afrobeats go",
  "afrobeats fit",
  "afrobeats sef",
  "afrobeats sha",
  "afrobeats abi",
  "afrobeats o",
  "afrobeats joor",
  "afrobeats jare",
  "koko am",
  "koko dey",
  "koko don",
  "koko go",
  "koko fit",
  "koko sef",
  "koko sha",
  "koko abi",
  "koko o",
  "koko joor",
  "koko jare",
  "tori am",
  "tori don",
  "tori go",
  "tori fit",
  "tori sef",
  "tori sha",
  "tori abi",
  "tori o",
  "tori joor",
  "tori jare",
  "yab am",
  "yab dey",
  "yab don",
  "yab go",
  "yab fit",
  "yab sef",
  "yab sha",
  "yab abi",
  "yab o",
  "yab joor",
  "yab jare",
  "yabbis am",
  "yabbis dey",
  "yabbis don",
  "yabbis go",
  "yabbis fit",
  "yabbis sef",
  "yabbis sha",
  "yabbis abi",
  "yabbis o",
  "yabbis joor",
  "yabbis jare",
  "gra-gra am",
  "gra-gra dey",
  "gra-gra don",
  "gra-gra go",
  "gra-gra fit",
  "gra-gra sef",
  "gra-gra sha",
  "gra-gra abi",
  "gra-gra o",
  "gra-gra joor",
  "gra-gra jare",
  "gragra am",
  "gragra dey",
  "gragra don",
  "gragra go",
  "gragra fit",
  "gragra sef",
  "gragra sha",
  "gragra abi",
  "gragra o",
  "gragra joor",
  "gragra jare",
  "gbeborun am",
  "gbeborun dey",
  "gbeborun don",
  "gbeborun go",
  "gbeborun fit",
  "gbeborun sef",
  "gbeborun sha",
  "gbeborun abi",
  "gbeborun o",
  "gbeborun joor",
  "gbeborun jare",
  "aproko am",
  "aproko dey",
  "aproko don",
  "aproko go",
  "aproko fit",
  "aproko sef",
  "aproko sha",
  "aproko abi",
  "aproko o",
  "aproko joor",
  "aproko jare",
  "para am",
  "para dey",
  "para don",
  "para go",
  "para fit",
  "para sef",
  "para sha",
  "para abi",
  "para o",
  "para joor",
  "para jare",
  "vex am",
  "vex dey",
  "vex don",
  "vex go",
  "vex fit",
  "vex sef",
  "vex sha",
  "vex abi",
  "vex o",
  "vex joor",
  "vex jare",
  "belliful am",
  "belliful dey",
  "belliful don",
  "belliful go",
  "belliful fit",
  "belliful sef",
  "belliful sha",
  "belliful abi",
  "belliful o",
  "belliful joor",
  "belliful jare",
  "belle am",
  "belle dey",
  "belle don",
  "belle go",
  "belle fit",
  "belle sef",
  "belle sha",
  "belle abi",
  "belle o",
  "belle joor",
  "belle jare",
  "enjoyment am",
  "enjoyment dey",
  "enjoyment don",
  "enjoyment go",
  "enjoyment fit",
  "enjoyment sef",
  "enjoyment sha",
  "enjoyment abi",
  "enjoyment o",
  "enjoyment joor",
  "enjoyment jare",
  "biko am",
  "biko dey",
  "biko don",
  "biko go",
  "biko fit",
  "biko sef",
  "biko sha",
  "biko abi",
  "biko o",
  "biko joor",
  "biko jare",
  "ndewo am",
  "ndewo dey",
  "ndewo don",
  "ndewo go",
  "ndewo fit",
  "ndewo sef",
  "ndewo sha",
  "ndewo abi",
  "ndewo o",
  "ndewo joor",
  "ndewo jare",
  "bawo am",
  "bawo dey",
  "bawo don",
  "bawo go",
  "bawo fit",
  "bawo sef",
  "bawo sha",
  "bawo abi",
  "bawo o",
  "bawo joor",
  "bawo jare",
  "ekaro am",
  "ekaro dey",
  "ekaro don",
  "ekaro go",
  "ekaro fit",
  "ekaro sef",
  "ekaro sha",
  "ekaro abi",
  "ekaro o",
  "ekaro joor",
  "ekaro jare",
  "eku am",
  "eku dey",
  "eku don",
  "eku go",
  "eku fit",
  "eku sef",
  "eku sha",
  "eku abi",
  "eku o",
  "eku joor",
  "eku jare",
  "sannu am",
  "sannu dey",
  "sannu don",
  "sannu go",
  "sannu fit",
  "sannu sef",
  "sannu sha",
  "sannu abi",
  "sannu o",
  "sannu joor",
  "sannu jare",
  "nagode am",
  "nagode dey",
  "nagode don",
  "nagode go",
  "nagode fit",
  "nagode sef",
  "nagode sha",
  "nagode abi",
  "nagode o",
  "nagode joor",
  "nagode jare",
  "yawa am",
  "yawa dey",
  "yawa don",
  "yawa go",
  "yawa fit",
  "yawa sef",
  "yawa sha",
  "yawa abi",
  "yawa o",
  "yawa joor",
  "yawa jare",
  "dull am",
  "dull dey",
  "dull don",
  "dull go",
  "dull fit",
  "dull sef",
  "dull sha",
  "dull abi",
  "dull o",
  "dull joor",
  "dull jare",
  "oversabi am",
  "oversabi dey",
  "oversabi don",
  "oversabi go",
  "oversabi fit",
  "oversabi sef",
  "oversabi sha",
  "oversabi abi",
  "oversabi o",
  "oversabi joor",
  "oversabi jare",
  "levels am",
  "levels dey",
  "levels don",
  "levels go",
  "levels fit",
  "levels sef",
  "levels sha",
  "levels abi",
  "levels o",
  "levels joor",
  "levels jare",
  "odogwu am",
  "odogwu dey",
  "odogwu don",
  "odogwu go",
  "odogwu fit",
  "odogwu sef",
  "odogwu sha",
  "odogwu abi",
  "odogwu o",
  "odogwu joor",
  "odogwu jare",
  "egbon am",
  "egbon dey",
  "egbon don",
  "egbon go",
  "egbon fit",
  "egbon sef",
  "egbon sha",
  "egbon abi",
  "egbon o",
  "egbon joor",
  "egbon jare",
  "nwanne am",
  "nwanne dey",
  "nwanne don",
  "nwanne go",
  "nwanne fit",
  "nwanne sef",
  "nwanne sha",
  "nwanne abi",
  "nwanne o",
  "nwanne joor",
  "nwanne jare",
  "obia am",
  "obia dey",
  "obia don",
  "obia go",
  "obia fit",
  "obia sef",
  "obia sha",
  "obia abi",
  "obia o",
  "obia joor",
  "obia jare",
  "street am",
  "street dey",
  "street don",
  "street go",
  "street fit",
  "street sef",
  "street sha",
  "street abi",
  "street o",
  "street joor",
  "street jare",
  "otondo am",
  "otondo dey",
  "otondo don",
  "otondo go",
  "otondo fit",
  "otondo sef",
  "otondo sha",
  "otondo abi",
  "otondo o",
  "otondo joor",
  "otondo jare",
  "corper am",
  "corper dey",
  "corper don",
  "corper go",
  "corper fit",
  "corper sef",
  "corper sha",
  "corper abi",
  "corper o",
  "corper joor",
  "corper jare",
  "kpa am",
  "kpa dey",
  "kpa don",
  "kpa go",
  "kpa fit",
  "kpa sef",
  "kpa sha",
  "kpa abi",
  "kpa o",
  "kpa joor",
  "kpa jare",
  "raba am",
  "raba dey",
  "raba don",
  "raba go",
  "raba fit",
  "raba sef",
  "raba sha",
  "raba abi",
  "raba o",
  "raba joor",
  "raba jare",
  "ego am",
  "ego dey",
  "ego don",
  "ego go",
  "ego fit",
  "ego sef",
  "ego sha",
  "ego abi",
  "ego o",
  "ego joor",
  "ego jare",
  "owo am",
  "owo dey",
  "owo don",
  "owo go",
  "owo fit",
  "owo sef",
  "owo sha",
  "owo abi",
  "owo o",
  "owo joor",
  "owo jare",
  "dough am",
  "dough dey",
  "dough don",
  "dough go",
  "dough fit",
  "dough sef",
  "dough sha",
  "dough abi",
  "dough o",
  "dough joor",
  "dough jare",
  "shishi am",
  "shishi dey",
  "shishi don",
  "shishi go",
  "shishi fit",
  "shishi sef",
  "shishi sha",
  "shishi abi",
  "shishi o",
  "shishi joor",
  "shishi jare",
  "broke am",
  "broke dey",
  "broke don",
  "broke go",
  "broke fit",
  "broke sef",
  "broke sha",
  "broke abi",
  "broke o",
  "broke joor",
  "broke jare",
  "sapa am",
  "sapa don",
  "sapa go",
  "sapa fit",
  "sapa sef",
  "sapa sha",
  "sapa abi",
  "sapa o",
  "sapa joor",
  "sapa jare",
  "update am",
  "update dey",
  "update don",
  "update go",
  "update fit",
  "update sef",
  "update sha",
  "update abi",
  "update o",
  "update joor",
  "update jare",
  "outside am",
  "outside dey",
  "outside don",
  "outside go",
  "outside fit",
  "outside sef",
  "outside sha",
  "outside abi",
  "outside o",
  "outside joor",
  "outside jare",
  "cruise am",
  "cruise dey",
  "cruise don",
  "cruise go",
  "cruise fit",
  "cruise sef",
  "cruise sha",
  "cruise abi",
  "cruise o",
  "cruise joor",
  "cruise jare",
  "cast am",
  "cast dey",
  "cast don",
  "cast go",
  "cast fit",
  "cast sef",
  "cast sha",
  "cast abi",
  "cast o",
  "cast joor",
  "cast jare",
  "breakfast am",
  "breakfast dey",
  "breakfast don",
  "breakfast go",
  "breakfast fit",
  "breakfast sef",
  "breakfast sha",
  "breakfast abi",
  "breakfast o",
  "breakfast joor",
  "breakfast jare",
  "trenches am",
  "trenches dey",
  "trenches don",
  "trenches go",
  "trenches fit",
  "trenches sef",
  "trenches sha",
  "trenches abi",
  "trenches o",
  "trenches joor",
  "trenches jare",
  "baller am",
  "baller dey",
  "baller don",
  "baller go",
  "baller fit",
  "baller sef",
  "baller sha",
  "baller abi",
  "baller o",
  "baller joor",
  "baller jare",
  "olopa am",
  "olopa dey",
  "olopa don",
  "olopa go",
  "olopa fit",
  "olopa sef",
  "olopa sha",
  "olopa abi",
  "olopa o",
  "olopa joor",
  "olopa jare",
  "police am",
  "police dey",
  "police don",
  "police go",
  "police fit",
  "police sef",
  "police sha",
  "police abi",
  "police o",
  "police joor",
  "police jare",
  "checkpoint am",
  "checkpoint dey",
  "checkpoint don",
  "checkpoint go",
  "checkpoint fit",
  "checkpoint sef",
  "checkpoint sha",
  "checkpoint abi",
  "checkpoint o",
  "checkpoint joor",
  "checkpoint jare",
  "soji am",
  "soji dey",
  "soji don",
  "soji go",
  "soji fit",
  "soji sef",
  "soji sha",
  "soji abi",
  "soji o",
  "soji joor",
  "soji jare",
  "coded am",
  "coded dey",
  "coded don",
  "coded go",
  "coded fit",
  "coded sef",
  "coded sha",
  "coded abi",
  "coded o",
  "coded joor",
  "coded jare",
  "lowkey am",
  "lowkey dey",
  "lowkey don",
  "lowkey go",
  "lowkey fit",
  "lowkey sef",
  "lowkey sha",
  "lowkey abi",
  "lowkey o",
  "lowkey joor",
  "lowkey jare",
  "okada am",
  "okada dey",
  "okada don",
  "okada go",
  "okada fit",
  "okada sef",
  "okada sha",
  "okada abi",
  "okada o",
  "okada joor",
  "okada jare",
  "keke am",
  "keke dey",
  "keke don",
  "keke go",
  "keke fit",
  "keke sef",
  "keke sha",
  "keke abi",
  "keke o",
  "keke joor",
  "keke jare",
  "danfo am",
  "danfo dey",
  "danfo don",
  "danfo go",
  "danfo fit",
  "danfo sef",
  "danfo sha",
  "danfo abi",
  "danfo o",
  "danfo joor",
  "danfo jare",
  "conductor am",
  "conductor dey",
  "conductor don",
  "conductor go",
  "conductor fit",
  "conductor sef",
  "conductor sha",
  "conductor abi",
  "conductor o",
  "conductor joor",
  "conductor jare",
  "alight am",
  "alight dey",
  "alight don",
  "alight go",
  "alight fit",
  "alight sef",
  "alight sha",
  "alight abi",
  "alight o",
  "alight joor",
  "alight jare",
  "enter am",
  "enter dey",
  "enter don",
  "enter go",
  "enter fit",
  "enter sef",
  "enter sha",
  "enter abi",
  "enter o",
  "enter joor",
  "enter jare",
  "drop am",
  "drop dey",
  "drop don",
  "drop go",
  "drop fit",
  "drop sef",
  "drop sha",
  "drop abi",
  "drop o",
  "drop joor",
  "drop jare",
  "bustop am",
  "bustop dey",
  "bustop don",
  "bustop go",
  "bustop fit",
  "bustop sef",
  "bustop sha",
  "bustop abi",
  "bustop o",
  "bustop joor",
  "bustop jare",
  "nepa am",
  "nepa dey",
  "nepa don",
  "nepa go",
  "nepa fit",
  "nepa sef",
  "nepa sha",
  "nepa abi",
  "nepa o",
  "nepa joor",
  "nepa jare",
  "gen am",
  "gen dey",
  "gen don",
  "gen go",
  "gen fit",
  "gen sef",
  "gen sha",
  "gen abi",
  "gen o",
  "gen joor",
  "gen jare",
  "fuel am",
  "fuel dey",
  "fuel don",
  "fuel go",
  "fuel fit",
  "fuel sef",
  "fuel sha",
  "fuel abi",
  "fuel o",
  "fuel joor",
  "fuel jare",
  "pos am",
  "pos dey",
  "pos don",
  "pos go",
  "pos fit",
  "pos sef",
  "pos sha",
  "pos abi",
  "pos o",
  "pos joor",
  "pos jare",
  "transfer am",
  "transfer dey",
  "transfer don",
  "transfer go",
  "transfer fit",
  "transfer sef",
  "transfer sha",
  "transfer abi",
  "transfer o",
  "transfer joor",
  "transfer jare",
  "aza am",
  "aza dey",
  "aza don",
  "aza go",
  "aza fit",
  "aza sef",
  "aza sha",
  "aza abi",
  "aza o",
  "aza joor",
  "aza jare",
  "gbam am",
  "gbam dey",
  "gbam don",
  "gbam go",
  "gbam fit",
  "gbam sef",
  "gbam sha",
  "gbam abi",
  "gbam o",
  "gbam joor",
  "gbam jare",
  "walahi am",
  "walahi dey",
  "walahi don",
  "walahi go",
  "walahi fit",
  "walahi sef",
  "walahi sha",
  "walahi abi",
  "walahi o",
  "walahi joor",
  "walahi jare",
  "tor am",
  "tor dey",
  "tor don",
  "tor go",
  "tor fit",
  "tor sef",
  "tor sha",
  "tor abi",
  "tor o",
  "tor joor",
  "tor jare",
  "kai am",
  "kai dey",
  "kai don",
  "kai go",
  "kai fit",
  "kai sef",
  "kai sha",
  "kai abi",
  "kai o",
  "kai joor",
  "kai jare",
  "chai am",
  "chai dey",
  "chai don",
  "chai go",
  "chai fit",
  "chai sef",
  "chai sha",
  "chai abi",
  "chai o",
  "chai joor",
  "chai jare",
  "ewooo am",
  "ewooo dey",
  "ewooo don",
  "ewooo go",
  "ewooo fit",
  "ewooo sef",
  "ewooo sha",
  "ewooo abi",
  "ewooo o",
  "ewooo joor",
  "ewooo jare",
  "chei am",
  "chei dey",
  "chei don",
  "chei go",
  "chei fit",
  "chei sef",
  "chei sha",
  "chei abi",
  "chei o",
  "chei joor",
  "chei jare",
  "abasi am",
  "abasi dey",
  "abasi don",
  "abasi go",
  "abasi fit",
  "abasi sef",
  "abasi sha",
  "abasi abi",
  "abasi o",
  "abasi joor",
  "abasi jare",
  "chineke am",
  "chineke dey",
  "chineke don",
  "chineke go",
  "chineke fit",
  "chineke sef",
  "chineke sha",
  "chineke abi",
  "chineke o",
  "chineke joor",
  "chineke jare",
  "olohun am",
  "olohun dey",
  "olohun don",
  "olohun go",
  "olohun fit",
  "olohun sef",
  "olohun sha",
  "olohun abi",
  "olohun o",
  "olohun joor",
  "olohun jare",
  "chisos am",
  "chisos dey",
  "chisos don",
  "chisos go",
  "chisos fit",
  "chisos sef",
  "chisos sha",
  "chisos abi",
  "chisos o",
  "chisos joor",
  "chisos jare",
  "jesu am",
  "jesu dey",
  "jesu don",
  "jesu go",
  "jesu fit",
  "jesu sef",
  "jesu sha",
  "jesu abi",
  "jesu o",
  "jesu joor",
  "jesu jare",
  "modupe am",
  "modupe dey",
  "modupe don",
  "modupe go",
  "modupe fit",
  "modupe sef",
  "modupe sha",
  "modupe abi",
  "modupe o",
  "modupe joor",
  "modupe jare",
  "oshe am",
  "oshe dey",
  "oshe don",
  "oshe go",
  "oshe fit",
  "oshe sef",
  "oshe sha",
  "oshe abi",
  "oshe o",
  "oshe joor",
  "oshe jare",
  "alhamdulillah am",
  "alhamdulillah dey",
  "alhamdulillah don",
  "alhamdulillah go",
  "alhamdulillah fit",
  "alhamdulillah sef",
  "alhamdulillah sha",
  "alhamdulillah abi",
  "alhamdulillah o",
  "alhamdulillah joor",
  "alhamdulillah jare",
  "naso am",
  "naso dey",
  "naso don",
  "naso go",
  "naso fit",
  "naso sef",
  "naso sha",
  "naso abi",
  "naso o",
  "naso joor",
  "naso jare",
  "howfar am",
  "howfar dey",
  "howfar don",
  "howfar go",
  "howfar fit",
  "howfar sef",
  "howfar sha",
  "howfar abi",
  "howfar o",
  "howfar joor",
  "howfar jare",
  "nodey am",
  "nodey dey",
  "nodey don",
  "nodey go",
  "nodey fit",
  "nodey sef",
  "nodey sha",
  "nodey abi",
  "nodey o",
  "nodey joor",
  "nodey jare",
  "nobi am",
  "nobi dey",
  "nobi don",
  "nobi go",
  "nobi fit",
  "nobi sef",
  "nobi sha",
  "nobi abi",
  "nobi o",
  "nobi joor",
  "nobi jare",
  "japaa am",
  "japaa dey",
  "japaa don",
  "japaa go",
  "japaa fit",
  "japaa sef",
  "japaa sha",
  "japaa abi",
  "japaa o",
  "japaa joor",
  "japaa jare",
  "koloo am",
  "koloo dey",
  "koloo don",
  "koloo go",
  "koloo fit",
  "koloo sef",
  "koloo sha",
  "koloo abi",
  "koloo o",
  "koloo joor",
  "koloo jare",
  "palavr am",
  "palavr dey",
  "palavr don",
  "palavr go",
  "palavr fit",
  "palavr sef",
  "palavr sha",
  "palavr abi",
  "palavr o",
  "palavr joor",
  "palavr jare",
  "vawulens am",
  "vawulens dey",
  "vawulens don",
  "vawulens go",
  "vawulens fit",
  "vawulens sef",
  "vawulens sha",
  "vawulens abi",
  "vawulens o",
  "vawulens joor",
  "vawulens jare",
  "gbeduu am",
  "gbeduu dey",
  "gbeduu don",
  "gbeduu go",
  "gbeduu fit",
  "gbeduu sef",
  "gbeduu sha",
  "gbeduu abi",
  "gbeduu o",
  "gbeduu joor",
  "gbeduu jare",
  "dasc am",
  "dasc dey",
  "dasc don",
  "dasc go",
  "dasc fit",
  "dasc sef",
  "dasc sha",
  "dasc abi",
  "dasc o",
  "dasc joor",
  "dasc jare",
  "sharply am",
  "sharply dey",
  "sharply don",
  "sharply go",
  "sharply fit",
  "sharply sef",
  "sharply sha",
  "sharply abi",
  "sharply o",
  "sharply joor",
  "sharply jare",
  "badbelle am",
  "badbelle dey",
  "badbelle don",
  "badbelle go",
  "badbelle fit",
  "badbelle sef",
  "badbelle sha",
  "badbelle abi",
  "badbelle o",
  "badbelle joor",
  "badbelle jare",
  "choplife am",
  "choplife dey",
  "choplife don",
  "choplife go",
  "choplife fit",
  "choplife sef",
  "choplife sha",
  "choplife abi",
  "choplife o",
  "choplife joor",
  "choplife jare",
  "nowahala am",
  "nowahala dey",
  "nowahala don",
  "nowahala go",
  "nowahala fit",
  "nowahala sef",
  "nowahala sha",
  "nowahala abi",
  "nowahala o",
  "nowahala joor",
  "nowahala jare",
  "noshaking am",
  "noshaking dey",
  "noshaking don",
  "noshaking go",
  "noshaking fit",
  "noshaking sef",
  "noshaking sha",
  "noshaking abi",
  "noshaking o",
  "noshaking joor",
  "noshaking jare",
  "carrygo am",
  "carrygo dey",
  "carrygo don",
  "carrygo go",
  "carrygo fit",
  "carrygo sef",
  "carrygo sha",
  "carrygo abi",
  "carrygo o",
  "carrygo joor",
  "carrygo jare",
  "runam am",
  "runam dey",
  "runam don",
  "runam go",
  "runam fit",
  "runam sef",
  "runam sha",
  "runam abi",
  "runam o",
  "runam joor",
  "runam jare",
  "hearword am",
  "hearword dey",
  "hearword don",
  "hearword go",
  "hearword fit",
  "hearword sef",
  "hearword sha",
  "hearword abi",
  "hearword o",
  "hearword joor",
  "hearword jare",
  "leaveam am",
  "leaveam dey",
  "leaveam don",
  "leaveam go",
  "leaveam fit",
  "leaveam sef",
  "leaveam sha",
  "leaveam abi",
  "leaveam o",
  "leaveam joor",
  "leaveam jare",
  "talkam am",
  "talkam dey",
  "talkam don",
  "talkam go",
  "talkam fit",
  "talkam sef",
  "talkam sha",
  "talkam abi",
  "talkam o",
  "talkam joor",
  "talkam jare",
  "whodey am",
  "whodey dey",
  "whodey don",
  "whodey go",
  "whodey fit",
  "whodey sef",
  "whodey sha",
  "whodey abi",
  "whodey o",
  "whodey joor",
  "whodey jare",
  "echoke am",
  "echoke dey",
  "echoke don",
  "echoke go",
  "echoke fit",
  "echoke sef",
  "echoke sha",
  "echoke abi",
  "echoke o",
  "echoke joor",
  "echoke jare",
  "eshock am",
  "eshock dey",
  "eshock don",
  "eshock go",
  "eshock fit",
  "eshock sef",
  "eshock sha",
  "eshock abi",
  "eshock o",
  "eshock joor",
  "eshock jare",
  "deyplay am",
  "deyplay dey",
  "deyplay don",
  "deyplay go",
  "deyplay fit",
  "deyplay sef",
  "deyplay sha",
  "deyplay abi",
  "deyplay o",
  "deyplay joor",
  "deyplay jare",
  "nocast am",
  "nocast dey",
  "nocast don",
  "nocast go",
  "nocast fit",
  "nocast sef",
  "nocast sha",
  "nocast abi",
  "nocast o",
  "nocast joor",
  "nocast jare",
  "cutsoap am",
  "cutsoap dey",
  "cutsoap don",
  "cutsoap go",
  "cutsoap fit",
  "cutsoap sef",
  "cutsoap sha",
  "cutsoap abi",
  "cutsoap o",
  "cutsoap joor",
  "cutsoap jare",
  "urgent2k am",
  "urgent2k dey",
  "urgent2k don",
  "urgent2k go",
  "urgent2k fit",
  "urgent2k sef",
  "urgent2k sha",
  "urgent2k abi",
  "urgent2k o",
  "urgent2k joor",
  "urgent2k jare",
  "sendaza am",
  "sendaza dey",
  "sendaza don",
  "sendaza go",
  "sendaza fit",
  "sendaza sef",
  "sendaza sha",
  "sendaza abi",
  "sendaza o",
  "sendaza joor",
  "sendaza jare",
  "truetalk am",
  "truetalk dey",
  "truetalk don",
  "truetalk go",
  "truetalk fit",
  "truetalk sef",
  "truetalk sha",
  "truetalk abi",
  "truetalk o",
  "truetalk joor",
  "truetalk jare",
  "kampe am",
  "kampe dey",
  "kampe don",
  "kampe go",
  "kampe fit",
  "kampe sef",
  "kampe sha",
  "kampe abi",
  "kampe o",
  "kampe joor",
  "kampe jare",
  "steady am",
  "steady dey",
  "steady don",
  "steady go",
  "steady fit",
  "steady sef",
  "steady sha",
  "steady abi",
  "steady o",
  "steady joor",
  "steady jare",
  "nwa am",
  "nwa dey",
  "nwa don",
  "nwa go",
  "nwa fit",
  "nwa sef",
  "nwa sha",
  "nwa abi",
  "nwa o",
  "nwa joor",
  "nwa jare",
  "asa am",
  "asa dey",
  "asa don",
  "asa go",
  "asa fit",
  "asa sef",
  "asa sha",
  "asa abi",
  "asa o",
  "asa joor",
  "asa jare",
  "geh am",
  "geh dey",
  "geh don",
  "geh go",
  "geh fit",
  "geh sef",
  "geh sha",
  "geh abi",
  "geh o",
  "geh joor",
  "geh jare",
  "chick am",
  "chick dey",
  "chick don",
  "chick go",
  "chick fit",
  "chick sef",
  "chick sha",
  "chick abi",
  "chick o",
  "chick joor",
  "chick jare",
  "jaye am",
  "jaye dey",
  "jaye don",
  "jaye go",
  "jaye fit",
  "jaye sef",
  "jaye sha",
  "jaye abi",
  "jaye o",
  "jaye joor",
  "jaye jare",
  "faaji am",
  "faaji dey",
  "faaji don",
  "faaji go",
  "faaji fit",
  "faaji sef",
  "faaji sha",
  "faaji abi",
  "faaji o",
  "faaji joor",
  "faaji jare",
  "owambe am",
  "owambe dey",
  "owambe don",
  "owambe go",
  "owambe fit",
  "owambe sef",
  "owambe sha",
  "owambe abi",
  "owambe o",
  "owambe joor",
  "owambe jare",
  "party am",
  "party dey",
  "party don",
  "party go",
  "party fit",
  "party sef",
  "party sha",
  "party abi",
  "party o",
  "party joor",
  "party jare",
  "ment am",
  "ment dey",
  "ment don",
  "ment go",
  "ment fit",
  "ment sef",
  "ment sha",
  "ment abi",
  "ment o",
  "ment joor",
  "ment jare",
  "whine am",
  "whine dey",
  "whine don",
  "whine go",
  "whine fit",
  "whine sef",
  "whine sha",
  "whine abi",
  "whine o",
  "whine joor",
  "whine jare",
  "sharpally am",
  "sharpally dey",
  "sharpally don",
  "sharpally go",
  "sharpally fit",
  "sharpally sef",
  "sharpally sha",
  "sharpally abi",
  "sharpally o",
  "sharpally joor",
  "sharpally jare",
  "gee am",
  "gee dey",
  "gee don",
  "gee go",
  "gee fit",
  "gee sef",
  "gee sha",
  "gee abi",
  "gee o",
  "gee joor",
  "gee jare",
  "blood am",
  "blood dey",
  "blood don",
  "blood go",
  "blood fit",
  "blood sef",
  "blood sha",
  "blood abi",
  "blood o",
  "blood joor",
  "blood jare",
  "confam am",
  "confam dey",
  "confam don",
  "confam go",
  "confam fit",
  "confam sef",
  "confam sha",
  "confam abi",
  "confam o",
  "confam joor",
  "confam jare",
  "confirm am",
  "confirm dey",
  "confirm don",
  "confirm go",
  "confirm fit",
  "confirm sef",
  "confirm sha",
  "confirm abi",
  "confirm o",
  "confirm joor",
  "confirm jare",
  "solid am",
  "solid dey",
  "solid don",
  "solid go",
  "solid fit",
  "solid sef",
  "solid sha",
  "solid abi",
  "solid o",
  "solid joor",
  "solid jare",
  "facts am",
  "facts dey",
  "facts don",
  "facts go",
  "facts fit",
  "facts sef",
  "facts sha",
  "facts abi",
  "facts o",
  "facts joor",
  "facts jare",
  "aswear am",
  "aswear dey",
  "aswear don",
  "aswear go",
  "aswear fit",
  "aswear sef",
  "aswear sha",
  "aswear abi",
  "aswear o",
  "aswear joor",
  "aswear jare",
  "swear am",
  "swear dey",
  "swear don",
  "swear go",
  "swear fit",
  "swear sef",
  "swear sha",
  "swear abi",
  "swear o",
  "swear joor",
  "swear jare",
  "tuale am",
  "tuale dey",
  "tuale don",
  "tuale go",
  "tuale fit",
  "tuale sef",
  "tuale sha",
  "tuale abi",
  "tuale o",
  "tuale joor",
  "tuale jare",
  "salute am",
  "salute dey",
  "salute don",
  "salute go",
  "salute fit",
  "salute sef",
  "salute sha",
  "salute abi",
  "salute o",
  "salute joor",
  "salute jare",
  "respect am",
  "respect dey",
  "respect don",
  "respect go",
  "respect fit",
  "respect sef",
  "respect sha",
  "respect abi",
  "respect o",
  "respect joor",
  "respect jare",
  "fresher am",
  "fresher dey",
  "fresher don",
  "fresher go",
  "fresher fit",
  "fresher sef",
  "fresher sha",
  "fresher abi",
  "fresher o",
  "fresher joor",
  "fresher jare",
  "dripping am",
  "dripping dey",
  "dripping don",
  "dripping go",
  "dripping fit",
  "dripping sef",
  "dripping sha",
  "dripping abi",
  "dripping o",
  "dripping joor",
  "dripping jare",
  "drip am",
  "drip dey",
  "drip don",
  "drip go",
  "drip fit",
  "drip sef",
  "drip sha",
  "drip abi",
  "drip o",
  "drip joor",
  "drip jare",
  "sauce am",
  "sauce dey",
  "sauce don",
  "sauce go",
  "sauce fit",
  "sauce sef",
  "sauce sha",
  "sauce abi",
  "sauce o",
  "sauce joor",
  "sauce jare",
  "swag am",
  "swag dey",
  "swag don",
  "swag go",
  "swag fit",
  "swag sef",
  "swag sha",
  "swag abi",
  "swag o",
  "swag joor",
  "swag jare",
  "steeze am",
  "steeze dey",
  "steeze don",
  "steeze go",
  "steeze fit",
  "steeze sef",
  "steeze sha",
  "steeze abi",
  "steeze o",
  "steeze joor",
  "steeze jare",
  "composure am",
  "composure dey",
  "composure don",
  "composure go",
  "composure fit",
  "composure sef",
  "composure sha",
  "composure abi",
  "composure o",
  "composure joor",
  "composure jare",
  "unstoppable am",
  "unstoppable dey",
  "unstoppable don",
  "unstoppable go",
  "unstoppable fit",
  "unstoppable sef",
  "unstoppable sha",
  "unstoppable abi",
  "unstoppable o",
  "unstoppable joor",
  "unstoppable jare",
  "shepe am",
  "shepe dey",
  "shepe don",
  "shepe go",
  "shepe fit",
  "shepe sef",
  "shepe sha",
  "shepe abi",
  "shepe o",
  "shepe joor",
  "shepe jare",
  "ogogoro am",
  "ogogoro dey",
  "ogogoro don",
  "ogogoro go",
  "ogogoro fit",
  "ogogoro sef",
  "ogogoro sha",
  "ogogoro abi",
  "ogogoro o",
  "ogogoro joor",
  "ogogoro jare",
  "paraga am",
  "paraga dey",
  "paraga don",
  "paraga go",
  "paraga fit",
  "paraga sef",
  "paraga sha",
  "paraga abi",
  "paraga o",
  "paraga joor",
  "paraga jare",
  "alomo am",
  "alomo dey",
  "alomo don",
  "alomo go",
  "alomo fit",
  "alomo sef",
  "alomo sha",
  "alomo abi",
  "alomo o",
  "alomo joor",
  "alomo jare",
  "gin am",
  "gin dey",
  "gin don",
  "gin go",
  "gin fit",
  "gin sef",
  "gin sha",
  "gin abi",
  "gin o",
  "gin joor",
  "gin jare",
  "origin am",
  "origin dey",
  "origin don",
  "origin go",
  "origin fit",
  "origin sef",
  "origin sha",
  "origin abi",
  "origin o",
  "origin joor",
  "origin jare",
  "bitters am",
  "bitters dey",
  "bitters don",
  "bitters go",
  "bitters fit",
  "bitters sef",
  "bitters sha",
  "bitters abi",
  "bitters o",
  "bitters joor",
  "bitters jare",
  "shawarma am",
  "shawarma dey",
  "shawarma don",
  "shawarma go",
  "shawarma fit",
  "shawarma sef",
  "shawarma sha",
  "shawarma abi",
  "shawarma o",
  "shawarma joor",
  "shawarma jare",
  "kilishi am",
  "kilishi dey",
  "kilishi don",
  "kilishi go",
  "kilishi fit",
  "kilishi sef",
  "kilishi sha",
  "kilishi abi",
  "kilishi o",
  "kilishi joor",
  "kilishi jare",
  "dodo am",
  "dodo dey",
  "dodo don",
  "dodo go",
  "dodo fit",
  "dodo sef",
  "dodo sha",
  "dodo abi",
  "dodo o",
  "dodo joor",
  "dodo jare",
  "jollof am",
  "jollof dey",
  "jollof don",
  "jollof go",
  "jollof fit",
  "jollof sef",
  "jollof sha",
  "jollof abi",
  "jollof o",
  "jollof joor",
  "jollof jare",
  "buns am",
  "buns dey",
  "buns don",
  "buns go",
  "buns fit",
  "buns sef",
  "buns sha",
  "buns abi",
  "buns o",
  "buns joor",
  "buns jare",
  "gala am",
  "gala dey",
  "gala don",
  "gala go",
  "gala fit",
  "gala sef",
  "gala sha",
  "gala abi",
  "gala o",
  "gala joor",
  "gala jare",
  "lacasera am",
  "lacasera dey",
  "lacasera don",
  "lacasera go",
  "lacasera fit",
  "lacasera sef",
  "lacasera sha",
  "lacasera abi",
  "lacasera o",
  "lacasera joor",
  "lacasera jare",
  "fanta am",
  "fanta dey",
  "fanta don",
  "fanta go",
  "fanta fit",
  "fanta sef",
  "fanta sha",
  "fanta abi",
  "fanta o",
  "fanta joor",
  "fanta jare",
  "coke am",
  "coke dey",
  "coke don",
  "coke go",
  "coke fit",
  "coke sef",
  "coke sha",
  "coke abi",
  "coke o",
  "coke joor",
  "coke jare",
  "malt am",
  "malt dey",
  "malt don",
  "malt go",
  "malt fit",
  "malt sef",
  "malt sha",
  "malt abi",
  "malt o",
  "malt joor",
  "malt jare",
  "zobo am",
  "zobo dey",
  "zobo don",
  "zobo go",
  "zobo fit",
  "zobo sef",
  "zobo sha",
  "zobo abi",
  "zobo o",
  "zobo joor",
  "zobo jare",
  "kunu am",
  "kunu dey",
  "kunu don",
  "kunu go",
  "kunu fit",
  "kunu sef",
  "kunu sha",
  "kunu abi",
  "kunu o",
  "kunu joor",
  "kunu jare",
  "palmwine am",
  "palmwine dey",
  "palmwine don",
  "palmwine go",
  "palmwine fit",
  "palmwine sef",
  "palmwine sha",
  "palmwine abi",
  "palmwine o",
  "palmwine joor",
  "palmwine jare",
  "ngwo am",
  "ngwo dey",
  "ngwo don",
  "ngwo go",
  "ngwo fit",
  "ngwo sef",
  "ngwo sha",
  "ngwo abi",
  "ngwo o",
  "ngwo joor",
  "ngwo jare",
  "amala am",
  "amala dey",
  "amala don",
  "amala go",
  "amala fit",
  "amala sef",
  "amala sha",
  "amala abi",
  "amala o",
  "amala joor",
  "amala jare",
  "ewedu am",
  "ewedu dey",
  "ewedu don",
  "ewedu go",
  "ewedu fit",
  "ewedu sef",
  "ewedu sha",
  "ewedu abi",
  "ewedu o",
  "ewedu joor",
  "ewedu jare",
  "gbegiri am",
  "gbegiri dey",
  "gbegiri don",
  "gbegiri go",
  "gbegiri fit",
  "gbegiri sef",
  "gbegiri sha",
  "gbegiri abi",
  "gbegiri o",
  "gbegiri joor",
  "gbegiri jare",
  "abula am",
  "abula dey",
  "abula don",
  "abula go",
  "abula fit",
  "abula sef",
  "abula sha",
  "abula abi",
  "abula o",
  "abula joor",
  "abula jare",
  "fufu am",
  "fufu dey",
  "fufu don",
  "fufu go",
  "fufu fit",
  "fufu sef",
  "fufu sha",
  "fufu abi",
  "fufu o",
  "fufu joor",
  "fufu jare",
  "semovita am",
  "semovita dey",
  "semovita don",
  "semovita go",
  "semovita fit",
  "semovita sef",
  "semovita sha",
  "semovita abi",
  "semovita o",
  "semovita joor",
  "semovita jare",
  "semolina am",
  "semolina dey",
  "semolina don",
  "semolina go",
  "semolina fit",
  "semolina sef",
  "semolina sha",
  "semolina abi",
  "semolina o",
  "semolina joor",
  "semolina jare",
  "wheat am",
  "wheat dey",
  "wheat don",
  "wheat go",
  "wheat fit",
  "wheat sef",
  "wheat sha",
  "wheat abi",
  "wheat o",
  "wheat joor",
  "wheat jare",
  "eba am",
  "eba dey",
  "eba don",
  "eba go",
  "eba fit",
  "eba sef",
  "eba sha",
  "eba abi",
  "eba o",
  "eba joor",
  "eba jare",
  "epah am",
  "epah dey",
  "epah don",
  "epah go",
  "epah fit",
  "epah sef",
  "epah sha",
  "epah abi",
  "epah o",
  "epah joor",
  "epah jare",
  "groundnut am",
  "groundnut dey",
  "groundnut don",
  "groundnut go",
  "groundnut fit",
  "groundnut sef",
  "groundnut sha",
  "groundnut abi",
  "groundnut o",
  "groundnut joor",
  "groundnut jare",
  "elewe am",
  "elewe dey",
  "elewe don",
  "elewe go",
  "elewe fit",
  "elewe sef",
  "elewe sha",
  "elewe abi",
  "elewe o",
  "elewe joor",
  "elewe jare",
  "assorted am",
  "assorted dey",
  "assorted don",
  "assorted go",
  "assorted fit",
  "assorted sef",
  "assorted sha",
  "assorted abi",
  "assorted o",
  "assorted joor",
  "assorted jare",
  "shaki am",
  "shaki dey",
  "shaki don",
  "shaki go",
  "shaki fit",
  "shaki sef",
  "shaki sha",
  "shaki abi",
  "shaki o",
  "shaki joor",
  "shaki jare",
  "roundabout am",
  "roundabout dey",
  "roundabout don",
  "roundabout go",
  "roundabout fit",
  "roundabout sef",
  "roundabout sha",
  "roundabout abi",
  "roundabout o",
  "roundabout joor",
  "roundabout jare",
  "abodi am",
  "abodi dey",
  "abodi don",
  "abodi go",
  "abodi fit",
  "abodi sef",
  "abodi sha",
  "abodi abi",
  "abodi o",
  "abodi joor",
  "abodi jare",
  "liver am",
  "liver dey",
  "liver don",
  "liver go",
  "liver fit",
  "liver sef",
  "liver sha",
  "liver abi",
  "liver o",
  "liver joor",
  "liver jare",
  "kidney am",
  "kidney dey",
  "kidney don",
  "kidney go",
  "kidney fit",
  "kidney sef",
  "kidney sha",
  "kidney abi",
  "kidney o",
  "kidney joor",
  "kidney jare",
  "heart am",
  "heart dey",
  "heart don",
  "heart go",
  "heart fit",
  "heart sef",
  "heart sha",
  "heart abi",
  "heart o",
  "heart joor",
  "heart jare",
  "towel am",
  "towel dey",
  "towel don",
  "towel go",
  "towel fit",
  "towel sef",
  "towel sha",
  "towel abi",
  "towel o",
  "towel joor",
  "towel jare",
  "fuku am",
  "fuku dey",
  "fuku don",
  "fuku go",
  "fuku fit",
  "fuku sef",
  "fuku sha",
  "fuku abi",
  "fuku o",
  "fuku joor",
  "fuku jare",
  "nkwobi am",
  "nkwobi dey",
  "nkwobi don",
  "nkwobi go",
  "nkwobi fit",
  "nkwobi sef",
  "nkwobi sha",
  "nkwobi abi",
  "nkwobi o",
  "nkwobi joor",
  "nkwobi jare",
  "abacha am",
  "abacha dey",
  "abacha don",
  "abacha go",
  "abacha fit",
  "abacha sef",
  "abacha sha",
  "abacha abi",
  "abacha o",
  "abacha joor",
  "abacha jare",
  "ugba am",
  "ugba dey",
  "ugba don",
  "ugba go",
  "ugba fit",
  "ugba sef",
  "ugba sha",
  "ugba abi",
  "ugba o",
  "ugba joor",
  "ugba jare",
  "ukwa am",
  "ukwa dey",
  "ukwa don",
  "ukwa go",
  "ukwa fit",
  "ukwa sef",
  "ukwa sha",
  "ukwa abi",
  "ukwa o",
  "ukwa joor",
  "ukwa jare",
  "asaro am",
  "asaro dey",
  "asaro don",
  "asaro go",
  "asaro fit",
  "asaro sef",
  "asaro sha",
  "asaro abi",
  "asaro o",
  "asaro joor",
  "asaro jare",
  "ube am",
  "ube dey",
  "ube don",
  "ube go",
  "ube fit",
  "ube sef",
  "ube sha",
  "ube abi",
  "ube o",
  "ube joor",
  "ube jare",
  "pear am",
  "pear dey",
  "pear don",
  "pear go",
  "pear fit",
  "pear sef",
  "pear sha",
  "pear abi",
  "pear o",
  "pear joor",
  "pear jare",
  "agbalumo am",
  "agbalumo dey",
  "agbalumo don",
  "agbalumo go",
  "agbalumo fit",
  "agbalumo sef",
  "agbalumo sha",
  "agbalumo abi",
  "agbalumo o",
  "agbalumo joor",
  "agbalumo jare",
  "udara am",
  "udara dey",
  "udara don",
  "udara go",
  "udara fit",
  "udara sef",
  "udara sha",
  "udara abi",
  "udara o",
  "udara joor",
  "udara jare"
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
  "abeggg": "abeg",
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
  "steze": "steeze",
  "ogogor": "ogogoro",
  "shaki": "shaki",
  "nkwob": "nkwobi"
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
  "odogwu",
  "dodo",
  "ogogoro",
  "suya",
  "kpomo",
  "boli",
  "abula",
  "amala",
  "nkwobi"
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
    "abasi",
    "abula",
    "abodi"
  ],
  "abe": [
    "abeg",
    "abeg am",
    "abeg dey",
    "abeg don",
    "abeg go"
  ],
  "abeg": [
    "abeg",
    "abeg am",
    "abeg dey",
    "abeg don",
    "abeg go"
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
    "composure",
    "commot am"
  ],
  "comm": [
    "commot",
    "commot am",
    "commot dey",
    "commot don",
    "commot go"
  ],
  "como": [
    "comot",
    "comot body",
    "comot am",
    "comot dey",
    "comot don"
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
    "shey you get",
    "shepe",
    "shey am",
    "shey dey"
  ],
  "shey": [
    "shey",
    "shey you get",
    "shey am",
    "shey dey",
    "shey don"
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
    "wahala dey",
    "wahala am",
    "wahala don",
    "wahala go"
  ],
  "waha": [
    "wahala",
    "wahala dey",
    "wahala am",
    "wahala don",
    "wahala go"
  ],
  "kw": [
    "kwanu",
    "kwanu am",
    "kwanu dey",
    "kwanu don",
    "kwanu go"
  ],
  "kwa": [
    "kwanu",
    "kwanu am",
    "kwanu dey",
    "kwanu don",
    "kwanu go"
  ],
  "kwan": [
    "kwanu",
    "kwanu am",
    "kwanu dey",
    "kwanu don",
    "kwanu go"
  ],
  "pi": [
    "pikin",
    "pikin am",
    "pikin dey",
    "pikin don",
    "pikin go"
  ],
  "pik": [
    "pikin",
    "pikin am",
    "pikin dey",
    "pikin don",
    "pikin go"
  ],
  "piki": [
    "pikin",
    "pikin am",
    "pikin dey",
    "pikin don",
    "pikin go"
  ],
  "sa": [
    "sabi",
    "sannu",
    "sapa",
    "sapa dey",
    "safe trip"
  ],
  "sab": [
    "sabi",
    "sabi am",
    "sabi dey",
    "sabi don",
    "sabi go"
  ],
  "sabi": [
    "sabi",
    "sabi am",
    "sabi dey",
    "sabi don",
    "sabi go"
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
    "choplife",
    "chop am"
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
    "sef",
    "sef am",
    "sef dey",
    "sef don",
    "sef go"
  ],
  "oy": [
    "oya",
    "oya am",
    "oya dey",
    "oya don",
    "oya go"
  ],
  "oya": [
    "oya",
    "oya am",
    "oya dey",
    "oya don",
    "oya go"
  ],
  "fi": [
    "fit",
    "fine boy",
    "fine girl",
    "fine girl no pimples",
    "fine geh"
  ],
  "fit": [
    "fit",
    "fit am",
    "fit dey",
    "fit don",
    "fit go"
  ],
  "dem": [
    "dem",
    "dem am",
    "dem dey",
    "dem don",
    "dem go"
  ],
  "un": [
    "una",
    "unstoppable",
    "una am",
    "una dey",
    "una don"
  ],
  "una": [
    "una",
    "una am",
    "una dey",
    "una don",
    "una go"
  ],
  "ho": [
    "how far",
    "hold up",
    "howfar",
    "how body",
    "howfar am"
  ],
  "how": [
    "how far",
    "howfar",
    "how body",
    "howfar am",
    "howfar dey"
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
    "baff up sharp",
    "baff am",
    "baff dey"
  ],
  "baff": [
    "baff",
    "baff up",
    "baff up sharp",
    "baff am",
    "baff dey"
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
    "breakfast",
    "bread and beans",
    "breeze am",
    "breeze dey"
  ],
  "bree": [
    "breeze",
    "breeze am",
    "breeze dey",
    "breeze don",
    "breeze go"
  ],
  "da": [
    "dash",
    "danfo",
    "dasc",
    "dash am",
    "dash dey"
  ],
  "das": [
    "dash",
    "dasc",
    "dash am",
    "dash dey",
    "dash don"
  ],
  "dash": [
    "dash",
    "dash am",
    "dash dey",
    "dash don",
    "dash go"
  ],
  "ja": [
    "jara",
    "japa",
    "japaa",
    "jaye",
    "jaye lo"
  ],
  "jar": [
    "jara",
    "jara am",
    "jara dey",
    "jara don",
    "jara go"
  ],
  "jara": [
    "jara",
    "jara am",
    "jara dey",
    "jara don",
    "jara go"
  ],
  "mu": [
    "mumu",
    "mumu am",
    "mumu dey",
    "mumu don",
    "mumu go"
  ],
  "mum": [
    "mumu",
    "mumu am",
    "mumu dey",
    "mumu don",
    "mumu go"
  ],
  "mumu": [
    "mumu",
    "mumu am",
    "mumu dey",
    "mumu don",
    "mumu go"
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
    "palavr",
    "palmwine",
    "palava am",
    "palava dey"
  ],
  "pala": [
    "palava",
    "palavr",
    "palava am",
    "palava dey",
    "palava don"
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
    "till later",
    "tink am",
    "tink dey",
    "tink don"
  ],
  "tin": [
    "tink",
    "tink am",
    "tink dey",
    "tink don",
    "tink go"
  ],
  "tink": [
    "tink",
    "tink am",
    "tink dey",
    "tink don",
    "tink go"
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
    "yarn me",
    "yarn am",
    "yarn dey",
    "yarn don"
  ],
  "yarn": [
    "yarn",
    "yarn me",
    "yarn am",
    "yarn dey",
    "yarn don"
  ],
  "wak": [
    "waka",
    "waka pass",
    "waka am",
    "waka dey",
    "waka don"
  ],
  "waka": [
    "waka",
    "waka pass",
    "waka am",
    "waka dey",
    "waka don"
  ],
  "par": [
    "parole",
    "para",
    "party",
    "paraga",
    "party jollof"
  ],
  "paro": [
    "parole",
    "parole am",
    "parole dey",
    "parole don",
    "parole go"
  ],
  "gi": [
    "gist",
    "give me gist",
    "gist me",
    "give honors",
    "gin"
  ],
  "gis": [
    "gist",
    "gist me",
    "gist am",
    "gist dey",
    "gist don"
  ],
  "gist": [
    "gist",
    "gist me",
    "gist am",
    "gist dey",
    "gist don"
  ],
  "choo": [
    "chook",
    "chook eye",
    "chook am",
    "chook dey",
    "chook don"
  ],
  "ko": [
    "kolo",
    "koko",
    "koloo",
    "kolo mental",
    "kolo am"
  ],
  "kol": [
    "kolo",
    "koloo",
    "kolo mental",
    "kolo am",
    "kolo dey"
  ],
  "kolo": [
    "kolo",
    "koloo",
    "kolo mental",
    "kolo am",
    "kolo dey"
  ],
  "va": [
    "vawulence",
    "vawulens",
    "vawulence am",
    "vawulence dey",
    "vawulence don"
  ],
  "vaw": [
    "vawulence",
    "vawulens",
    "vawulence am",
    "vawulence dey",
    "vawulence don"
  ],
  "vawu": [
    "vawulence",
    "vawulens",
    "vawulence am",
    "vawulence dey",
    "vawulence don"
  ],
  "ov": [
    "overabi",
    "oversabi",
    "overabi am",
    "overabi dey",
    "overabi don"
  ],
  "ove": [
    "overabi",
    "oversabi",
    "overabi am",
    "overabi dey",
    "overabi don"
  ],
  "over": [
    "overabi",
    "oversabi",
    "overabi am",
    "overabi dey",
    "overabi don"
  ],
  "bo": [
    "bobo",
    "boli",
    "body dey inside clothes",
    "boiled yam",
    "bobo am"
  ],
  "bob": [
    "bobo",
    "bobo am",
    "bobo dey",
    "bobo don",
    "bobo go"
  ],
  "bobo": [
    "bobo",
    "bobo am",
    "bobo dey",
    "bobo don",
    "bobo go"
  ],
  "si": [
    "sisi",
    "sista",
    "since when",
    "sisi am",
    "sisi dey"
  ],
  "sis": [
    "sisi",
    "sista",
    "sisi am",
    "sisi dey",
    "sisi don"
  ],
  "sisi": [
    "sisi",
    "sisi am",
    "sisi dey",
    "sisi don",
    "sisi go"
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
    "carrygo",
    "carrygo am",
    "carrygo dey",
    "carrygo don"
  ],
  "carr": [
    "carry go",
    "carrygo",
    "carrygo am",
    "carrygo dey",
    "carrygo don"
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
    "kpai finish",
    "kpai am",
    "kpai dey"
  ],
  "kpai": [
    "kpai",
    "kpai finish",
    "kpai am",
    "kpai dey",
    "kpai don"
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
    "gbege",
    "gbegiri",
    "gbege am",
    "gbege dey",
    "gbege don"
  ],
  "k-": [
    "k-leg",
    "k-leg am",
    "k-leg dey",
    "k-leg don",
    "k-leg go"
  ],
  "k-l": [
    "k-leg",
    "k-leg am",
    "k-leg dey",
    "k-leg don",
    "k-leg go"
  ],
  "k-le": [
    "k-leg",
    "k-leg am",
    "k-leg dey",
    "k-leg don",
    "k-leg go"
  ],
  "ma": [
    "magun",
    "mama",
    "make we yarn",
    "maximum steeze",
    "matter don cast"
  ],
  "mag": [
    "magun",
    "magun am",
    "magun dey",
    "magun don",
    "magun go"
  ],
  "magu": [
    "magun",
    "magun am",
    "magun dey",
    "magun don",
    "magun go"
  ],
  "jap": [
    "japa",
    "japaa",
    "japa am",
    "japa dey",
    "japa don"
  ],
  "japa": [
    "japa",
    "japaa",
    "japa am",
    "japa dey",
    "japa don"
  ],
  "nac": [
    "nack",
    "nack am",
    "nack dey",
    "nack don",
    "nack go"
  ],
  "nack": [
    "nack",
    "nack am",
    "nack dey",
    "nack don",
    "nack go"
  ],
  "ru": [
    "run am",
    "runam",
    "runam am",
    "runam dey",
    "runam don"
  ],
  "run": [
    "run am",
    "runam",
    "runam am",
    "runam dey",
    "runam don"
  ],
  "run ": [
    "run am"
  ],
  "set": [
    "settle",
    "settle am",
    "settle dey",
    "settle don",
    "settle go"
  ],
  "sett": [
    "settle",
    "settle am",
    "settle dey",
    "settle don",
    "settle go"
  ],
  "ha": [
    "hammer",
    "hakuna matata",
    "hammer am",
    "hammer dey",
    "hammer don"
  ],
  "ham": [
    "hammer",
    "hammer am",
    "hammer dey",
    "hammer don",
    "hammer go"
  ],
  "hamm": [
    "hammer",
    "hammer am",
    "hammer dey",
    "hammer don",
    "hammer go"
  ],
  "al": [
    "alaye",
    "all correct",
    "alight",
    "alhamdulillah",
    "all good"
  ],
  "ala": [
    "alaye",
    "alaye am",
    "alaye dey",
    "alaye don",
    "alaye go"
  ],
  "alay": [
    "alaye",
    "alaye am",
    "alaye dey",
    "alaye don",
    "alaye go"
  ],
  "cha": [
    "chache",
    "chairman",
    "chai",
    "chache am",
    "chache dey"
  ],
  "chac": [
    "chache",
    "chache am",
    "chache dey",
    "chache don",
    "chache go"
  ],
  "way": [
    "wayo",
    "wayo am",
    "wayo dey",
    "wayo don",
    "wayo go"
  ],
  "wayo": [
    "wayo",
    "wayo am",
    "wayo dey",
    "wayo don",
    "wayo go"
  ],
  "yan": [
    "yanga",
    "yanga am",
    "yanga dey",
    "yanga don",
    "yanga go"
  ],
  "yang": [
    "yanga",
    "yanga am",
    "yanga dey",
    "yanga don",
    "yanga go"
  ],
  "za": [
    "zazu",
    "zanku",
    "zazu am",
    "zazu dey",
    "zazu don"
  ],
  "zaz": [
    "zazu",
    "zazu am",
    "zazu dey",
    "zazu don",
    "zazu go"
  ],
  "zazu": [
    "zazu",
    "zazu am",
    "zazu dey",
    "zazu don",
    "zazu go"
  ],
  "gba": [
    "gbagbe",
    "gbam",
    "gbagbe am",
    "gbagbe dey",
    "gbagbe don"
  ],
  "gbag": [
    "gbagbe",
    "gbagbe am",
    "gbagbe dey",
    "gbagbe don",
    "gbagbe go"
  ],
  "gbed": [
    "gbedu",
    "gbeduu",
    "gbedu am",
    "gbedu dey",
    "gbedu don"
  ],
  "aj": [
    "ajebutter",
    "ajepako",
    "ajebutter am",
    "ajebutter dey",
    "ajebutter don"
  ],
  "aje": [
    "ajebutter",
    "ajepako",
    "ajebutter am",
    "ajebutter dey",
    "ajebutter don"
  ],
  "ajeb": [
    "ajebutter",
    "ajebutter am",
    "ajebutter dey",
    "ajebutter don",
    "ajebutter go"
  ],
  "ajep": [
    "ajepako",
    "ajepako am",
    "ajepako dey",
    "ajepako don",
    "ajepako go"
  ],
  "ak": [
    "akara",
    "akara am",
    "akara dey",
    "akara don",
    "akara go"
  ],
  "aka": [
    "akara",
    "akara am",
    "akara dey",
    "akara don",
    "akara go"
  ],
  "akar": [
    "akara",
    "akara am",
    "akara dey",
    "akara don",
    "akara go"
  ],
  "su": [
    "suya",
    "suya am",
    "suya dey",
    "suya don",
    "suya go"
  ],
  "suy": [
    "suya",
    "suya am",
    "suya dey",
    "suya don",
    "suya go"
  ],
  "suya": [
    "suya",
    "suya am",
    "suya dey",
    "suya don",
    "suya go"
  ],
  "ga": [
    "garri",
    "gather dey",
    "gala",
    "garri ijebu",
    "garri am"
  ],
  "gar": [
    "garri",
    "garri ijebu",
    "garri am",
    "garri dey",
    "garri don"
  ],
  "garr": [
    "garri",
    "garri ijebu",
    "garri am",
    "garri dey",
    "garri don"
  ],
  "kpo": [
    "kpomo",
    "kpo",
    "kpomo am",
    "kpomo dey",
    "kpomo don"
  ],
  "kpom": [
    "kpomo",
    "kpomo am",
    "kpomo dey",
    "kpomo don",
    "kpomo go"
  ],
  "bol": [
    "boli",
    "boli am",
    "boli dey",
    "boli don",
    "boli go"
  ],
  "boli": [
    "boli",
    "boli am",
    "boli dey",
    "boli don",
    "boli go"
  ],
  "is": [
    "isi ewu",
    "isi ewu special"
  ],
  "isi": [
    "isi ewu",
    "isi ewu special"
  ],
  "isi ": [
    "isi ewu",
    "isi ewu special"
  ],
  "eg": [
    "egusi",
    "egbon",
    "ego",
    "egg roll",
    "egusi am"
  ],
  "egu": [
    "egusi",
    "egusi am",
    "egusi dey",
    "egusi don",
    "egusi go"
  ],
  "egus": [
    "egusi",
    "egusi am",
    "egusi dey",
    "egusi don",
    "egusi go"
  ],
  "og": [
    "ogbono",
    "ogogoro",
    "ogbono soup",
    "ogbono am",
    "ogbono dey"
  ],
  "ogb": [
    "ogbono",
    "ogbono soup",
    "ogbono am",
    "ogbono dey",
    "ogbono don"
  ],
  "ogbo": [
    "ogbono",
    "ogbono soup",
    "ogbono am",
    "ogbono dey",
    "ogbono don"
  ],
  "abi": [
    "abi",
    "abi am",
    "abi dey",
    "abi don",
    "abi go"
  ],
  "wo": [
    "wotowoto",
    "wotowoto am",
    "wotowoto dey",
    "wotowoto don",
    "wotowoto go"
  ],
  "wot": [
    "wotowoto",
    "wotowoto am",
    "wotowoto dey",
    "wotowoto don",
    "wotowoto go"
  ],
  "woto": [
    "wotowoto",
    "wotowoto am",
    "wotowoto dey",
    "wotowoto don",
    "wotowoto go"
  ],
  "do": [
    "dorime",
    "don par",
    "don gas",
    "don fall my hand",
    "dough"
  ],
  "dor": [
    "dorime",
    "dorime am",
    "dorime dey",
    "dorime don",
    "dorime go"
  ],
  "dori": [
    "dorime",
    "dorime am",
    "dorime dey",
    "dorime don",
    "dorime go"
  ],
  "bam": [
    "bambam",
    "bambam am",
    "bambam dey",
    "bambam don",
    "bambam go"
  ],
  "bamb": [
    "bambam",
    "bambam am",
    "bambam dey",
    "bambam don",
    "bambam go"
  ],
  "je": [
    "jekalo",
    "jeje",
    "jesu",
    "jekalo am",
    "jekalo dey"
  ],
  "jek": [
    "jekalo",
    "jekalo am",
    "jekalo dey",
    "jekalo don",
    "jekalo go"
  ],
  "jeka": [
    "jekalo",
    "jekalo am",
    "jekalo dey",
    "jekalo don",
    "jekalo go"
  ],
  "gbes": [
    "gbese",
    "gbese am",
    "gbese dey",
    "gbese don",
    "gbese go"
  ],
  "tu": [
    "tule",
    "turn up",
    "tuale",
    "tuwo shinkafa",
    "tule am"
  ],
  "tul": [
    "tule",
    "tule am",
    "tule dey",
    "tule don",
    "tule go"
  ],
  "tule": [
    "tule",
    "tule am",
    "tule dey",
    "tule don",
    "tule go"
  ],
  "kpr": [
    "kprokpro",
    "kprokpro am",
    "kprokpro dey",
    "kprokpro don",
    "kprokpro go"
  ],
  "kpro": [
    "kprokpro",
    "kprokpro am",
    "kprokpro dey",
    "kprokpro don",
    "kprokpro go"
  ],
  "ot": [
    "otilo",
    "otondo",
    "ot",
    "otilo am",
    "otilo dey"
  ],
  "oti": [
    "otilo",
    "otilo am",
    "otilo dey",
    "otilo don",
    "otilo go"
  ],
  "otil": [
    "otilo",
    "otilo am",
    "otilo dey",
    "otilo don",
    "otilo go"
  ],
  "ef": [
    "effico",
    "effico am",
    "effico dey",
    "effico don",
    "effico go"
  ],
  "eff": [
    "effico",
    "effico am",
    "effico dey",
    "effico don",
    "effico go"
  ],
  "effi": [
    "effico",
    "effico am",
    "effico dey",
    "effico don",
    "effico go"
  ],
  "ag": [
    "agbero",
    "agege bread",
    "agbalumo",
    "agbero am",
    "agbero dey"
  ],
  "agb": [
    "agbero",
    "agbalumo",
    "agbero am",
    "agbero dey",
    "agbero don"
  ],
  "agbe": [
    "agbero",
    "agbero am",
    "agbero dey",
    "agbero don",
    "agbero go"
  ],
  "bro": [
    "bros",
    "broke",
    "brother from another mother",
    "bros am",
    "bros dey"
  ],
  "bros": [
    "bros",
    "bros am",
    "bros dey",
    "bros don",
    "bros go"
  ],
  "sist": [
    "sista",
    "sista am",
    "sista dey",
    "sista don",
    "sista go"
  ],
  "pad": [
    "paddy",
    "paddy am",
    "paddy dey",
    "paddy don",
    "paddy go"
  ],
  "padd": [
    "paddy",
    "paddy am",
    "paddy dey",
    "paddy don",
    "paddy go"
  ],
  "gu": [
    "guy",
    "guy man",
    "guy am",
    "guy dey",
    "guy don"
  ],
  "guy": [
    "guy",
    "guy man",
    "guy am",
    "guy dey",
    "guy don"
  ],
  "bad": [
    "baddo",
    "bad belle",
    "badbelle",
    "bad belle people",
    "bad boy"
  ],
  "badd": [
    "baddo",
    "baddo am",
    "baddo dey",
    "baddo don",
    "baddo go"
  ],
  "sen": [
    "senior man",
    "send aza",
    "sendaza",
    "sendaza am",
    "sendaza dey"
  ],
  "seni": [
    "senior man"
  ],
  "chai": [
    "chairman",
    "chai",
    "chairman am",
    "chairman dey",
    "chairman don"
  ],
  "id": [
    "idamu",
    "idamu am",
    "idamu dey",
    "idamu don",
    "idamu go"
  ],
  "ida": [
    "idamu",
    "idamu am",
    "idamu dey",
    "idamu don",
    "idamu go"
  ],
  "idam": [
    "idamu",
    "idamu am",
    "idamu dey",
    "idamu don",
    "idamu go"
  ],
  "no c": [
    "no cap",
    "no cast am"
  ],
  "shay": [
    "shayo",
    "shayo am",
    "shayo dey",
    "shayo don",
    "shayo go"
  ],
  "cal": [
    "calm down"
  ],
  "calm": [
    "calm down"
  ],
  "jej": [
    "jeje",
    "jeje am",
    "jeje dey",
    "jeje don",
    "jeje go"
  ],
  "jeje": [
    "jeje",
    "jeje am",
    "jeje dey",
    "jeje don",
    "jeje go"
  ],
  "sl": [
    "slowly",
    "sleep dey catch me",
    "slay queen",
    "slay mama",
    "slowly am"
  ],
  "slo": [
    "slowly",
    "slowly am",
    "slowly dey",
    "slowly don",
    "slowly go"
  ],
  "slow": [
    "slowly",
    "slowly am",
    "slowly dey",
    "slowly don",
    "slowly go"
  ],
  "sm": [
    "smallie",
    "small time",
    "smokey jollof",
    "smallie am",
    "smallie dey"
  ],
  "sma": [
    "smallie",
    "small time",
    "smallie am",
    "smallie dey",
    "smallie don"
  ],
  "smal": [
    "smallie",
    "small time",
    "smallie am",
    "smallie dey",
    "smallie don"
  ],
  "le": [
    "lepa",
    "legwork",
    "leave am",
    "levels don change",
    "levels"
  ],
  "lep": [
    "lepa",
    "lepa am",
    "lepa dey",
    "lepa don",
    "lepa go"
  ],
  "lepa": [
    "lepa",
    "lepa am",
    "lepa dey",
    "lepa don",
    "lepa go"
  ],
  "or": [
    "orobo",
    "origin",
    "orobo am",
    "orobo dey",
    "orobo don"
  ],
  "oro": [
    "orobo",
    "orobo am",
    "orobo dey",
    "orobo don",
    "orobo go"
  ],
  "orob": [
    "orobo",
    "orobo am",
    "orobo dey",
    "orobo don",
    "orobo go"
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
    "omo",
    "omo am",
    "omo dey",
    "omo don",
    "omo go"
  ],
  "omo": [
    "omo",
    "omo am",
    "omo dey",
    "omo don",
    "omo go"
  ],
  "bab": [
    "baba",
    "baby girl",
    "baby boy",
    "baba am",
    "baba dey"
  ],
  "baba": [
    "baba",
    "baba am",
    "baba dey",
    "baba don",
    "baba go"
  ],
  "mam": [
    "mama",
    "mama am",
    "mama dey",
    "mama don",
    "mama go"
  ],
  "mama": [
    "mama",
    "mama am",
    "mama dey",
    "mama don",
    "mama go"
  ],
  "pap": [
    "papa",
    "papa am",
    "papa dey",
    "papa don",
    "papa go"
  ],
  "papa": [
    "papa",
    "papa am",
    "papa dey",
    "papa don",
    "papa go"
  ],
  "shak": [
    "shaku",
    "shaki",
    "shaku am",
    "shaku dey",
    "shaku don"
  ],
  "leg": [
    "legwork",
    "legwork am",
    "legwork dey",
    "legwork don",
    "legwork go"
  ],
  "legw": [
    "legwork",
    "legwork am",
    "legwork dey",
    "legwork don",
    "legwork go"
  ],
  "zan": [
    "zanku",
    "zanku am",
    "zanku dey",
    "zanku don",
    "zanku go"
  ],
  "zank": [
    "zanku",
    "zanku am",
    "zanku dey",
    "zanku don",
    "zanku go"
  ],
  "af": [
    "afrobeats",
    "afang soup",
    "african salad",
    "afrobeats am",
    "afrobeats dey"
  ],
  "afr": [
    "afrobeats",
    "african salad",
    "afrobeats am",
    "afrobeats dey",
    "afrobeats don"
  ],
  "afro": [
    "afrobeats",
    "afrobeats am",
    "afrobeats dey",
    "afrobeats don",
    "afrobeats go"
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
    "head balance",
    "heart",
    "hearword am"
  ],
  "hea": [
    "hear word",
    "hearword",
    "head balance",
    "heart",
    "hearword am"
  ],
  "hear": [
    "hear word",
    "hearword",
    "heart",
    "hearword am",
    "hearword dey"
  ],
  "lea": [
    "leave am",
    "leaveam",
    "leaveam am",
    "leaveam dey",
    "leaveam don"
  ],
  "leav": [
    "leave am",
    "leaveam",
    "leaveam am",
    "leaveam dey",
    "leaveam don"
  ],
  "ta": [
    "talk am",
    "talkam",
    "talkam am",
    "talkam dey",
    "talkam don"
  ],
  "tal": [
    "talk am",
    "talkam",
    "talkam am",
    "talkam dey",
    "talkam don"
  ],
  "talk": [
    "talk am",
    "talkam",
    "talkam am",
    "talkam dey",
    "talkam don"
  ],
  "po": [
    "pour me water",
    "police",
    "pos",
    "point and kill",
    "police am"
  ],
  "pou": [
    "pour me water"
  ],
  "pour": [
    "pour me water"
  ],
  "kok": [
    "koko",
    "koko am",
    "koko dey",
    "koko don",
    "koko go"
  ],
  "koko": [
    "koko",
    "koko am",
    "koko dey",
    "koko don",
    "koko go"
  ],
  "to": [
    "tori",
    "toll gate",
    "tor",
    "tori dey",
    "towel"
  ],
  "tor": [
    "tori",
    "tor",
    "tori dey",
    "tori am",
    "tori don"
  ],
  "tori": [
    "tori",
    "tori dey",
    "tori am",
    "tori don",
    "tori go"
  ],
  "yab": [
    "yab",
    "yabbis",
    "yab am",
    "yab dey",
    "yab don"
  ],
  "yabb": [
    "yabbis",
    "yabbis am",
    "yabbis dey",
    "yabbis don",
    "yabbis go"
  ],
  "gr": [
    "gra-gra",
    "gragra",
    "greet them",
    "groundnut",
    "gra-gra am"
  ],
  "gra": [
    "gra-gra",
    "gragra",
    "gra-gra am",
    "gra-gra dey",
    "gra-gra don"
  ],
  "gra-": [
    "gra-gra",
    "gra-gra am",
    "gra-gra dey",
    "gra-gra don",
    "gra-gra go"
  ],
  "grag": [
    "gragra",
    "gragra am",
    "gragra dey",
    "gragra don",
    "gragra go"
  ],
  "gbeb": [
    "gbeborun",
    "gbeborun people",
    "gbeborun am",
    "gbeborun dey",
    "gbeborun don"
  ],
  "ap": [
    "aproko",
    "aproko am",
    "aproko dey",
    "aproko don",
    "aproko go"
  ],
  "apr": [
    "aproko",
    "aproko am",
    "aproko dey",
    "aproko don",
    "aproko go"
  ],
  "apro": [
    "aproko",
    "aproko am",
    "aproko dey",
    "aproko don",
    "aproko go"
  ],
  "shi": [
    "shine eye",
    "shishi",
    "shine your eyes",
    "shishi am",
    "shishi dey"
  ],
  "shin": [
    "shine eye",
    "shine your eyes"
  ],
  "para": [
    "para",
    "paraga",
    "para am",
    "para dey",
    "para don"
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
    "dey hungry me",
    "dey am",
    "dey dey"
  ],
  "ve": [
    "vex",
    "vex am",
    "vex dey",
    "vex don",
    "vex go"
  ],
  "vex": [
    "vex",
    "vex am",
    "vex dey",
    "vex don",
    "vex go"
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
    "belle full",
    "belliful am"
  ],
  "bel": [
    "belliful",
    "belle",
    "belle full",
    "belliful am",
    "belliful dey"
  ],
  "bell": [
    "belliful",
    "belle",
    "belle full",
    "belliful am",
    "belliful dey"
  ],
  "en": [
    "enjoyment",
    "enter",
    "enemies don fall",
    "energy clean",
    "enjoyment am"
  ],
  "enj": [
    "enjoyment",
    "enjoyment am",
    "enjoyment dey",
    "enjoyment don",
    "enjoyment go"
  ],
  "enjo": [
    "enjoyment",
    "enjoyment am",
    "enjoyment dey",
    "enjoyment don",
    "enjoyment go"
  ],
  "so": [
    "soft work",
    "soft life",
    "soji",
    "solid",
    "soji am"
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
    "big man",
    "bitters",
    "bitterleaf soup"
  ],
  "bik": [
    "biko",
    "biko am",
    "biko dey",
    "biko don",
    "biko go"
  ],
  "biko": [
    "biko",
    "biko am",
    "biko dey",
    "biko don",
    "biko go"
  ],
  "nd": [
    "ndewo",
    "ndewo am",
    "ndewo dey",
    "ndewo don",
    "ndewo go"
  ],
  "nde": [
    "ndewo",
    "ndewo am",
    "ndewo dey",
    "ndewo don",
    "ndewo go"
  ],
  "ndew": [
    "ndewo",
    "ndewo am",
    "ndewo dey",
    "ndewo don",
    "ndewo go"
  ],
  "baw": [
    "bawo",
    "bawo am",
    "bawo dey",
    "bawo don",
    "bawo go"
  ],
  "bawo": [
    "bawo",
    "bawo am",
    "bawo dey",
    "bawo don",
    "bawo go"
  ],
  "ek": [
    "ekaro",
    "eku",
    "ekaro am",
    "ekaro dey",
    "ekaro don"
  ],
  "eka": [
    "ekaro",
    "ekaro am",
    "ekaro dey",
    "ekaro don",
    "ekaro go"
  ],
  "ekar": [
    "ekaro",
    "ekaro am",
    "ekaro dey",
    "ekaro don",
    "ekaro go"
  ],
  "eku": [
    "eku",
    "eku am",
    "eku dey",
    "eku don",
    "eku go"
  ],
  "san": [
    "sannu",
    "sannu am",
    "sannu dey",
    "sannu don",
    "sannu go"
  ],
  "sann": [
    "sannu",
    "sannu am",
    "sannu dey",
    "sannu don",
    "sannu go"
  ],
  "nag": [
    "nagode",
    "nagode am",
    "nagode dey",
    "nagode don",
    "nagode go"
  ],
  "nago": [
    "nagode",
    "nagode am",
    "nagode dey",
    "nagode don",
    "nagode go"
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
    "yawa don gas",
    "yawa am",
    "yawa dey",
    "yawa don"
  ],
  "yawa": [
    "yawa",
    "yawa don gas",
    "yawa am",
    "yawa dey",
    "yawa don"
  ],
  "no d": [
    "no dulling",
    "no dey whine me"
  ],
  "du": [
    "dull",
    "dull am",
    "dull dey",
    "dull don",
    "dull go"
  ],
  "dul": [
    "dull",
    "dull am",
    "dull dey",
    "dull don",
    "dull go"
  ],
  "dull": [
    "dull",
    "dull am",
    "dull dey",
    "dull don",
    "dull go"
  ],
  "fa": [
    "fall hand",
    "faaji",
    "facts",
    "fanta",
    "faaji am"
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
    "levels",
    "levels am",
    "levels dey",
    "levels don"
  ],
  "leve": [
    "levels don change",
    "levels",
    "levels am",
    "levels dey",
    "levels don"
  ],
  "od": [
    "odogwu",
    "odogwu am",
    "odogwu dey",
    "odogwu don",
    "odogwu go"
  ],
  "odo": [
    "odogwu",
    "odogwu am",
    "odogwu dey",
    "odogwu don",
    "odogwu go"
  ],
  "odog": [
    "odogwu",
    "odogwu am",
    "odogwu dey",
    "odogwu don",
    "odogwu go"
  ],
  "egb": [
    "egbon",
    "egbon am",
    "egbon dey",
    "egbon don",
    "egbon go"
  ],
  "egbo": [
    "egbon",
    "egbon am",
    "egbon dey",
    "egbon don",
    "egbon go"
  ],
  "nw": [
    "nwanne",
    "nwa",
    "nwanne am",
    "nwanne dey",
    "nwanne don"
  ],
  "nwa": [
    "nwanne",
    "nwa",
    "nwanne am",
    "nwanne dey",
    "nwanne don"
  ],
  "nwan": [
    "nwanne",
    "nwanne am",
    "nwanne dey",
    "nwanne don",
    "nwanne go"
  ],
  "ob": [
    "obia",
    "obia am",
    "obia dey",
    "obia don",
    "obia go"
  ],
  "obi": [
    "obia",
    "obia am",
    "obia dey",
    "obia don",
    "obia go"
  ],
  "obia": [
    "obia",
    "obia am",
    "obia dey",
    "obia don",
    "obia go"
  ],
  "guy ": [
    "guy man",
    "guy am",
    "guy dey",
    "guy don",
    "guy go"
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
    "straight up",
    "street am"
  ],
  "stre": [
    "street",
    "street orientation",
    "street ot",
    "street am",
    "street dey"
  ],
  "oto": [
    "otondo",
    "otondo am",
    "otondo dey",
    "otondo don",
    "otondo go"
  ],
  "oton": [
    "otondo",
    "otondo am",
    "otondo dey",
    "otondo don",
    "otondo go"
  ],
  "cor": [
    "corper",
    "correct guy",
    "correct babe",
    "corper am",
    "corper dey"
  ],
  "corp": [
    "corper",
    "corper am",
    "corper dey",
    "corper don",
    "corper go"
  ],
  "ra": [
    "raba",
    "raba am",
    "raba dey",
    "raba don",
    "raba go"
  ],
  "rab": [
    "raba",
    "raba am",
    "raba dey",
    "raba don",
    "raba go"
  ],
  "raba": [
    "raba",
    "raba am",
    "raba dey",
    "raba don",
    "raba go"
  ],
  "ego": [
    "ego",
    "ego am",
    "ego dey",
    "ego don",
    "ego go"
  ],
  "ow": [
    "owo",
    "owambe",
    "owo soup",
    "owo am",
    "owo dey"
  ],
  "owo": [
    "owo",
    "owo soup",
    "owo am",
    "owo dey",
    "owo don"
  ],
  "dou": [
    "dough",
    "dough am",
    "dough dey",
    "dough don",
    "dough go"
  ],
  "doug": [
    "dough",
    "dough am",
    "dough dey",
    "dough don",
    "dough go"
  ],
  "shis": [
    "shishi",
    "shishi am",
    "shishi dey",
    "shishi don",
    "shishi go"
  ],
  "brok": [
    "broke",
    "broke am",
    "broke dey",
    "broke don",
    "broke go"
  ],
  "sap": [
    "sapa",
    "sapa dey",
    "sapa am",
    "sapa don",
    "sapa go"
  ],
  "sapa": [
    "sapa",
    "sapa dey",
    "sapa am",
    "sapa don",
    "sapa go"
  ],
  "cu": [
    "cut soap",
    "cutsoap",
    "cutsoap am",
    "cutsoap dey",
    "cutsoap don"
  ],
  "cut": [
    "cut soap",
    "cutsoap",
    "cutsoap am",
    "cutsoap dey",
    "cutsoap don"
  ],
  "cut ": [
    "cut soap"
  ],
  "up": [
    "update",
    "update am",
    "update dey",
    "update don",
    "update go"
  ],
  "upd": [
    "update",
    "update am",
    "update dey",
    "update don",
    "update go"
  ],
  "upda": [
    "update",
    "update am",
    "update dey",
    "update don",
    "update go"
  ],
  "wh": [
    "who dey",
    "who dey breathe",
    "whodey",
    "whine",
    "wheat"
  ],
  "who": [
    "who dey",
    "who dey breathe",
    "whodey",
    "whodey am",
    "whodey dey"
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
    "outside",
    "outside am",
    "outside dey",
    "outside don",
    "outside go"
  ],
  "out": [
    "outside",
    "outside am",
    "outside dey",
    "outside don",
    "outside go"
  ],
  "outs": [
    "outside",
    "outside am",
    "outside dey",
    "outside don",
    "outside go"
  ],
  "cr": [
    "cruise",
    "cruise catch",
    "craze dey head",
    "cruise am",
    "cruise dey"
  ],
  "cru": [
    "cruise",
    "cruise catch",
    "cruise am",
    "cruise dey",
    "cruise don"
  ],
  "crui": [
    "cruise",
    "cruise catch",
    "cruise am",
    "cruise dey",
    "cruise don"
  ],
  "cat": [
    "catching cruise",
    "catch cruise",
    "catch you",
    "catfish pepper soup"
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
    "cast die",
    "cast am",
    "cast dey",
    "cast don"
  ],
  "cast": [
    "cast",
    "cast die",
    "cast am",
    "cast dey",
    "cast don"
  ],
  "brea": [
    "breakfast",
    "bread and beans",
    "breakfast am",
    "breakfast dey",
    "breakfast don"
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
    "truetalk",
    "trenches am"
  ],
  "tre": [
    "trenches",
    "trenches am",
    "trenches dey",
    "trenches don",
    "trenches go"
  ],
  "tren": [
    "trenches",
    "trenches am",
    "trenches dey",
    "trenches don",
    "trenches go"
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
    "baller",
    "baller am",
    "baller dey",
    "baller don",
    "baller go"
  ],
  "ball": [
    "baller",
    "baller am",
    "baller dey",
    "baller don",
    "baller go"
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
    "olohun",
    "olopa am",
    "olopa dey",
    "olopa don"
  ],
  "olo": [
    "olopa",
    "olohun",
    "olopa am",
    "olopa dey",
    "olopa don"
  ],
  "olop": [
    "olopa",
    "olopa am",
    "olopa dey",
    "olopa don",
    "olopa go"
  ],
  "pol": [
    "police",
    "police am",
    "police dey",
    "police don",
    "police go"
  ],
  "poli": [
    "police",
    "police am",
    "police dey",
    "police don",
    "police go"
  ],
  "che": [
    "checkpoint",
    "chei",
    "checkpoint am",
    "checkpoint dey",
    "checkpoint don"
  ],
  "chec": [
    "checkpoint",
    "checkpoint am",
    "checkpoint dey",
    "checkpoint don",
    "checkpoint go"
  ],
  "soj": [
    "soji",
    "soji am",
    "soji dey",
    "soji don",
    "soji go"
  ],
  "soji": [
    "soji",
    "soji am",
    "soji dey",
    "soji don",
    "soji go"
  ],
  "cod": [
    "coded",
    "coded am",
    "coded dey",
    "coded don",
    "coded go"
  ],
  "code": [
    "coded",
    "coded am",
    "coded dey",
    "coded don",
    "coded go"
  ],
  "sta": [
    "stay coded",
    "star apple"
  ],
  "stay": [
    "stay coded"
  ],
  "ke": [
    "keep am coded",
    "keke",
    "keke am",
    "keke dey",
    "keke don"
  ],
  "kee": [
    "keep am coded"
  ],
  "keep": [
    "keep am coded"
  ],
  "lo": [
    "lowkey",
    "lowkey am",
    "lowkey dey",
    "lowkey don",
    "lowkey go"
  ],
  "low": [
    "lowkey",
    "lowkey am",
    "lowkey dey",
    "lowkey don",
    "lowkey go"
  ],
  "lowk": [
    "lowkey",
    "lowkey am",
    "lowkey dey",
    "lowkey don",
    "lowkey go"
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
    "pure water",
    "puff puff"
  ],
  "pur": [
    "pure water"
  ],
  "pure": [
    "pure water"
  ],
  "ok": [
    "okada",
    "okada am",
    "okada dey",
    "okada don",
    "okada go"
  ],
  "oka": [
    "okada",
    "okada am",
    "okada dey",
    "okada don",
    "okada go"
  ],
  "okad": [
    "okada",
    "okada am",
    "okada dey",
    "okada don",
    "okada go"
  ],
  "kek": [
    "keke",
    "keke am",
    "keke dey",
    "keke don",
    "keke go"
  ],
  "keke": [
    "keke",
    "keke am",
    "keke dey",
    "keke don",
    "keke go"
  ],
  "dan": [
    "danfo",
    "danfo am",
    "danfo dey",
    "danfo don",
    "danfo go"
  ],
  "danf": [
    "danfo",
    "danfo am",
    "danfo dey",
    "danfo don",
    "danfo go"
  ],
  "con": [
    "conductor",
    "confam",
    "confirm",
    "conductor am",
    "conductor dey"
  ],
  "cond": [
    "conductor",
    "conductor am",
    "conductor dey",
    "conductor don",
    "conductor go"
  ],
  "ali": [
    "alight",
    "alight am",
    "alight dey",
    "alight don",
    "alight go"
  ],
  "alig": [
    "alight",
    "alight am",
    "alight dey",
    "alight don",
    "alight go"
  ],
  "ent": [
    "enter",
    "enter am",
    "enter dey",
    "enter don",
    "enter go"
  ],
  "ente": [
    "enter",
    "enter am",
    "enter dey",
    "enter don",
    "enter go"
  ],
  "dr": [
    "drop",
    "dripping",
    "drip",
    "drop am",
    "drop dey"
  ],
  "dro": [
    "drop",
    "drop am",
    "drop dey",
    "drop don",
    "drop go"
  ],
  "drop": [
    "drop",
    "drop am",
    "drop dey",
    "drop don",
    "drop go"
  ],
  "bu": [
    "bustop",
    "buns",
    "bustop am",
    "bustop dey",
    "bustop don"
  ],
  "bus": [
    "bustop",
    "bustop am",
    "bustop dey",
    "bustop don",
    "bustop go"
  ],
  "bust": [
    "bustop",
    "bustop am",
    "bustop dey",
    "bustop don",
    "bustop go"
  ],
  "tol": [
    "toll gate"
  ],
  "toll": [
    "toll gate"
  ],
  "go": [
    "go slow",
    "good vibes only",
    "goat meat pepper soup"
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
    "light don go",
    "liver",
    "liver am",
    "liver dey"
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
    "nepa",
    "nepa am",
    "nepa dey",
    "nepa don",
    "nepa go"
  ],
  "nep": [
    "nepa",
    "nepa am",
    "nepa dey",
    "nepa don",
    "nepa go"
  ],
  "nepa": [
    "nepa",
    "nepa am",
    "nepa dey",
    "nepa don",
    "nepa go"
  ],
  "ge": [
    "gen",
    "geh",
    "gee",
    "gen am",
    "gen dey"
  ],
  "gen": [
    "gen",
    "gen am",
    "gen dey",
    "gen don",
    "gen go"
  ],
  "fu": [
    "fuel",
    "fufu",
    "fuku",
    "fuel am",
    "fuel dey"
  ],
  "fue": [
    "fuel",
    "fuel am",
    "fuel dey",
    "fuel don",
    "fuel go"
  ],
  "fuel": [
    "fuel",
    "fuel am",
    "fuel dey",
    "fuel don",
    "fuel go"
  ],
  "pos": [
    "pos",
    "pos am",
    "pos dey",
    "pos don",
    "pos go"
  ],
  "tra": [
    "transfer",
    "transfer am",
    "transfer dey",
    "transfer don",
    "transfer go"
  ],
  "tran": [
    "transfer",
    "transfer am",
    "transfer dey",
    "transfer don",
    "transfer go"
  ],
  "ur": [
    "urgent 2k",
    "urgent2k",
    "urgent2k am",
    "urgent2k dey",
    "urgent2k don"
  ],
  "urg": [
    "urgent 2k",
    "urgent2k",
    "urgent2k am",
    "urgent2k dey",
    "urgent2k don"
  ],
  "urge": [
    "urgent 2k",
    "urgent2k",
    "urgent2k am",
    "urgent2k dey",
    "urgent2k don"
  ],
  "send": [
    "send aza",
    "sendaza",
    "sendaza am",
    "sendaza dey",
    "sendaza don"
  ],
  "az": [
    "aza",
    "aza am",
    "aza dey",
    "aza don",
    "aza go"
  ],
  "aza": [
    "aza",
    "aza am",
    "aza dey",
    "aza don",
    "aza go"
  ],
  "gbam": [
    "gbam",
    "gbam am",
    "gbam dey",
    "gbam don",
    "gbam go"
  ],
  "tru": [
    "true talk",
    "truetalk",
    "truetalk am",
    "truetalk dey",
    "truetalk don"
  ],
  "true": [
    "true talk",
    "truetalk",
    "truetalk am",
    "truetalk dey",
    "truetalk don"
  ],
  "as i": [
    "as in"
  ],
  "no l": [
    "no lie"
  ],
  "wal": [
    "walahi",
    "walahi talahi",
    "walahi am",
    "walahi dey",
    "walahi don"
  ],
  "wala": [
    "walahi",
    "walahi talahi",
    "walahi am",
    "walahi dey",
    "walahi don"
  ],
  "ka": [
    "kai",
    "kampe",
    "kai am",
    "kai dey",
    "kai don"
  ],
  "kai": [
    "kai",
    "kai am",
    "kai dey",
    "kai don",
    "kai go"
  ],
  "ew": [
    "ewooo",
    "ewedu",
    "ewa aganyin",
    "ewooo am",
    "ewooo dey"
  ],
  "ewo": [
    "ewooo",
    "ewooo am",
    "ewooo dey",
    "ewooo don",
    "ewooo go"
  ],
  "ewoo": [
    "ewooo",
    "ewooo am",
    "ewooo dey",
    "ewooo don",
    "ewooo go"
  ],
  "chei": [
    "chei",
    "chei am",
    "chei dey",
    "chei don",
    "chei go"
  ],
  "aba": [
    "abasi",
    "abacha",
    "abasi am",
    "abasi dey",
    "abasi don"
  ],
  "abas": [
    "abasi",
    "abasi am",
    "abasi dey",
    "abasi don",
    "abasi go"
  ],
  "chi": [
    "chineke",
    "chisos",
    "chick",
    "chin chin",
    "chineke am"
  ],
  "chin": [
    "chineke",
    "chin chin",
    "chineke am",
    "chineke dey",
    "chineke don"
  ],
  "oloh": [
    "olohun",
    "olohun am",
    "olohun dey",
    "olohun don",
    "olohun go"
  ],
  "chis": [
    "chisos",
    "chisos am",
    "chisos dey",
    "chisos don",
    "chisos go"
  ],
  "jes": [
    "jesu",
    "jesu am",
    "jesu dey",
    "jesu don",
    "jesu go"
  ],
  "jesu": [
    "jesu",
    "jesu am",
    "jesu dey",
    "jesu don",
    "jesu go"
  ],
  "mo": [
    "modupe",
    "moving train",
    "monkey tail",
    "moi moi",
    "modupe am"
  ],
  "mod": [
    "modupe",
    "modupe am",
    "modupe dey",
    "modupe don",
    "modupe go"
  ],
  "modu": [
    "modupe",
    "modupe am",
    "modupe dey",
    "modupe don",
    "modupe go"
  ],
  "os": [
    "oshe",
    "oshe am",
    "oshe dey",
    "oshe don",
    "oshe go"
  ],
  "osh": [
    "oshe",
    "oshe am",
    "oshe dey",
    "oshe don",
    "oshe go"
  ],
  "oshe": [
    "oshe",
    "oshe am",
    "oshe dey",
    "oshe don",
    "oshe go"
  ],
  "alh": [
    "alhamdulillah",
    "alhamdulillah am",
    "alhamdulillah dey",
    "alhamdulillah don",
    "alhamdulillah go"
  ],
  "alha": [
    "alhamdulillah",
    "alhamdulillah am",
    "alhamdulillah dey",
    "alhamdulillah don",
    "alhamdulillah go"
  ],
  "ins": [
    "insha allah"
  ],
  "insh": [
    "insha allah"
  ],
  "nas": [
    "naso",
    "naso am",
    "naso dey",
    "naso don",
    "naso go"
  ],
  "naso": [
    "naso",
    "naso am",
    "naso dey",
    "naso don",
    "naso go"
  ],
  "howf": [
    "howfar",
    "howfar am",
    "howfar dey",
    "howfar don",
    "howfar go"
  ],
  "nod": [
    "nodey",
    "nodey am",
    "nodey dey",
    "nodey don",
    "nodey go"
  ],
  "node": [
    "nodey",
    "nodey am",
    "nodey dey",
    "nodey don",
    "nodey go"
  ],
  "nob": [
    "nobi",
    "nobi am",
    "nobi dey",
    "nobi don",
    "nobi go"
  ],
  "nobi": [
    "nobi",
    "nobi am",
    "nobi dey",
    "nobi don",
    "nobi go"
  ],
  "dasc": [
    "dasc",
    "dasc am",
    "dasc dey",
    "dasc don",
    "dasc go"
  ],
  "badb": [
    "badbelle",
    "badbelle am",
    "badbelle dey",
    "badbelle don",
    "badbelle go"
  ],
  "now": [
    "nowahala",
    "nowahala am",
    "nowahala dey",
    "nowahala don",
    "nowahala go"
  ],
  "nowa": [
    "nowahala",
    "nowahala am",
    "nowahala dey",
    "nowahala don",
    "nowahala go"
  ],
  "nos": [
    "noshaking",
    "noshaking am",
    "noshaking dey",
    "noshaking don",
    "noshaking go"
  ],
  "nosh": [
    "noshaking",
    "noshaking am",
    "noshaking dey",
    "noshaking don",
    "noshaking go"
  ],
  "runa": [
    "runam",
    "runam am",
    "runam dey",
    "runam don",
    "runam go"
  ],
  "whod": [
    "whodey",
    "whodey am",
    "whodey dey",
    "whodey don",
    "whodey go"
  ],
  "ec": [
    "echoke",
    "echoke am",
    "echoke dey",
    "echoke don",
    "echoke go"
  ],
  "ech": [
    "echoke",
    "echoke am",
    "echoke dey",
    "echoke don",
    "echoke go"
  ],
  "echo": [
    "echoke",
    "echoke am",
    "echoke dey",
    "echoke don",
    "echoke go"
  ],
  "es": [
    "eshock",
    "eshock am",
    "eshock dey",
    "eshock don",
    "eshock go"
  ],
  "esh": [
    "eshock",
    "eshock am",
    "eshock dey",
    "eshock don",
    "eshock go"
  ],
  "esho": [
    "eshock",
    "eshock am",
    "eshock dey",
    "eshock don",
    "eshock go"
  ],
  "deyp": [
    "deyplay",
    "deyplay am",
    "deyplay dey",
    "deyplay don",
    "deyplay go"
  ],
  "noc": [
    "nocast",
    "nocast am",
    "nocast dey",
    "nocast don",
    "nocast go"
  ],
  "noca": [
    "nocast",
    "nocast am",
    "nocast dey",
    "nocast don",
    "nocast go"
  ],
  "cuts": [
    "cutsoap",
    "cutsoap am",
    "cutsoap dey",
    "cutsoap don",
    "cutsoap go"
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
    "kampe",
    "kampe am",
    "kampe dey",
    "kampe don",
    "kampe go"
  ],
  "kamp": [
    "kampe",
    "kampe am",
    "kampe dey",
    "kampe don",
    "kampe go"
  ],
  "ste": [
    "steady",
    "steeze",
    "steady moving",
    "steady am",
    "steady dey"
  ],
  "stea": [
    "steady",
    "steady moving",
    "steady am",
    "steady dey",
    "steady don"
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
    "sweep clean",
    "swear am"
  ],
  "swe": [
    "sweet gist",
    "swear",
    "sweep clean",
    "swear am",
    "swear dey"
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
    "asa",
    "asaro",
    "asa am",
    "asa dey",
    "asa don"
  ],
  "geh": [
    "geh",
    "geh am",
    "geh dey",
    "geh don",
    "geh go"
  ],
  "chic": [
    "chick",
    "chick am",
    "chick dey",
    "chick don",
    "chick go"
  ],
  "jay": [
    "jaye",
    "jaye lo",
    "jaye am",
    "jaye dey",
    "jaye don"
  ],
  "jaye": [
    "jaye",
    "jaye lo",
    "jaye am",
    "jaye dey",
    "jaye don"
  ],
  "faa": [
    "faaji",
    "faaji am",
    "faaji dey",
    "faaji don",
    "faaji go"
  ],
  "faaj": [
    "faaji",
    "faaji am",
    "faaji dey",
    "faaji don",
    "faaji go"
  ],
  "owa": [
    "owambe",
    "owambe am",
    "owambe dey",
    "owambe don",
    "owambe go"
  ],
  "owam": [
    "owambe",
    "owambe am",
    "owambe dey",
    "owambe don",
    "owambe go"
  ],
  "part": [
    "party",
    "party jollof",
    "party am",
    "party dey",
    "party don"
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
    "respect",
    "respect am",
    "respect dey"
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
    "later things",
    "lacasera",
    "lacasera am",
    "lacasera dey",
    "lacasera don"
  ],
  "lat": [
    "later things"
  ],
  "late": [
    "later things"
  ],
  "me": [
    "ment",
    "meat pie",
    "ment am",
    "ment dey",
    "ment don"
  ],
  "men": [
    "ment",
    "ment am",
    "ment dey",
    "ment don",
    "ment go"
  ],
  "ment": [
    "ment",
    "ment am",
    "ment dey",
    "ment don",
    "ment go"
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
    "whine",
    "whine am",
    "whine dey",
    "whine don",
    "whine go"
  ],
  "whin": [
    "whine",
    "whine am",
    "whine dey",
    "whine don",
    "whine go"
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
    "gee",
    "gee am",
    "gee dey",
    "gee don",
    "gee go"
  ],
  "bl": [
    "blood",
    "blood am",
    "blood dey",
    "blood don",
    "blood go"
  ],
  "blo": [
    "blood",
    "blood am",
    "blood dey",
    "blood don",
    "blood go"
  ],
  "bloo": [
    "blood",
    "blood am",
    "blood dey",
    "blood don",
    "blood go"
  ],
  "brot": [
    "brother from another mother"
  ],
  "my p": [
    "my person"
  ],
  "conf": [
    "confam",
    "confirm",
    "confam am",
    "confam dey",
    "confam don"
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
    "solid",
    "solid am",
    "solid dey",
    "solid don",
    "solid go"
  ],
  "soli": [
    "solid",
    "solid am",
    "solid dey",
    "solid don",
    "solid go"
  ],
  "100 ": [
    "100 percent"
  ],
  "stra": [
    "straight up"
  ],
  "fac": [
    "facts",
    "facts am",
    "facts dey",
    "facts don",
    "facts go"
  ],
  "fact": [
    "facts",
    "facts am",
    "facts dey",
    "facts don",
    "facts go"
  ],
  "on g": [
    "on god"
  ],
  "asw": [
    "aswear",
    "aswear am",
    "aswear dey",
    "aswear don",
    "aswear go"
  ],
  "aswe": [
    "aswear",
    "aswear am",
    "aswear dey",
    "aswear don",
    "aswear go"
  ],
  "swea": [
    "swear",
    "swear am",
    "swear dey",
    "swear don",
    "swear go"
  ],
  "tua": [
    "tuale",
    "tuale am",
    "tuale dey",
    "tuale don",
    "tuale go"
  ],
  "tual": [
    "tuale",
    "tuale am",
    "tuale dey",
    "tuale don",
    "tuale go"
  ],
  "sal": [
    "salute",
    "salute am",
    "salute dey",
    "salute don",
    "salute go"
  ],
  "salu": [
    "salute",
    "salute am",
    "salute dey",
    "salute don",
    "salute go"
  ],
  "res": [
    "respect",
    "respect am",
    "respect dey",
    "respect don",
    "respect go"
  ],
  "resp": [
    "respect",
    "respect am",
    "respect dey",
    "respect don",
    "respect go"
  ],
  "fr": [
    "fresher",
    "fresher than fresh",
    "fried plantain",
    "fried rice",
    "fresher am"
  ],
  "fre": [
    "fresher",
    "fresher than fresh",
    "fresher am",
    "fresher dey",
    "fresher don"
  ],
  "fres": [
    "fresher",
    "fresher than fresh",
    "fresher am",
    "fresher dey",
    "fresher don"
  ],
  "dri": [
    "dripping",
    "drip",
    "dripping am",
    "dripping dey",
    "dripping don"
  ],
  "drip": [
    "dripping",
    "drip",
    "dripping am",
    "dripping dey",
    "dripping don"
  ],
  "sau": [
    "sauce",
    "sauce am",
    "sauce dey",
    "sauce don",
    "sauce go"
  ],
  "sauc": [
    "sauce",
    "sauce am",
    "sauce dey",
    "sauce don",
    "sauce go"
  ],
  "swa": [
    "swag",
    "swag am",
    "swag dey",
    "swag don",
    "swag go"
  ],
  "swag": [
    "swag",
    "swag am",
    "swag dey",
    "swag don",
    "swag go"
  ],
  "stee": [
    "steeze",
    "steeze am",
    "steeze dey",
    "steeze don",
    "steeze go"
  ],
  "comp": [
    "composure",
    "composure am",
    "composure dey",
    "composure don",
    "composure go"
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
    "unstoppable",
    "unstoppable am",
    "unstoppable dey",
    "unstoppable don",
    "unstoppable go"
  ],
  "unst": [
    "unstoppable",
    "unstoppable am",
    "unstoppable dey",
    "unstoppable don",
    "unstoppable go"
  ],
  "shep": [
    "shepe",
    "shepe am",
    "shepe dey",
    "shepe don",
    "shepe go"
  ],
  "ogo": [
    "ogogoro",
    "ogogoro am",
    "ogogoro dey",
    "ogogoro don",
    "ogogoro go"
  ],
  "ogog": [
    "ogogoro",
    "ogogoro am",
    "ogogoro dey",
    "ogogoro don",
    "ogogoro go"
  ],
  "mon": [
    "monkey tail"
  ],
  "monk": [
    "monkey tail"
  ],
  "alo": [
    "alomo",
    "alomo am",
    "alomo dey",
    "alomo don",
    "alomo go"
  ],
  "alom": [
    "alomo",
    "alomo am",
    "alomo dey",
    "alomo don",
    "alomo go"
  ],
  "gin": [
    "gin",
    "gin am",
    "gin dey",
    "gin don",
    "gin go"
  ],
  "ori": [
    "origin",
    "origin am",
    "origin dey",
    "origin don",
    "origin go"
  ],
  "orig": [
    "origin",
    "origin am",
    "origin dey",
    "origin don",
    "origin go"
  ],
  "bit": [
    "bitters",
    "bitterleaf soup",
    "bitters am",
    "bitters dey",
    "bitters don"
  ],
  "bitt": [
    "bitters",
    "bitterleaf soup",
    "bitters am",
    "bitters dey",
    "bitters don"
  ],
  "shaw": [
    "shawarma",
    "shawarma am",
    "shawarma dey",
    "shawarma don",
    "shawarma go"
  ],
  "ki": [
    "kilishi",
    "kidney",
    "kilishi am",
    "kilishi dey",
    "kilishi don"
  ],
  "kil": [
    "kilishi",
    "kilishi am",
    "kilishi dey",
    "kilishi don",
    "kilishi go"
  ],
  "kili": [
    "kilishi",
    "kilishi am",
    "kilishi dey",
    "kilishi don",
    "kilishi go"
  ],
  "dod": [
    "dodo",
    "dodo am",
    "dodo dey",
    "dodo don",
    "dodo go"
  ],
  "dodo": [
    "dodo",
    "dodo am",
    "dodo dey",
    "dodo don",
    "dodo go"
  ],
  "fri": [
    "fried plantain",
    "fried rice"
  ],
  "frie": [
    "fried plantain",
    "fried rice"
  ],
  "jo": [
    "jollof",
    "jollof am",
    "jollof dey",
    "jollof don",
    "jollof go"
  ],
  "jol": [
    "jollof",
    "jollof am",
    "jollof dey",
    "jollof don",
    "jollof go"
  ],
  "joll": [
    "jollof",
    "jollof am",
    "jollof dey",
    "jollof don",
    "jollof go"
  ],
  "smo": [
    "smokey jollof"
  ],
  "smok": [
    "smokey jollof"
  ],
  "puf": [
    "puff puff"
  ],
  "puff": [
    "puff puff"
  ],
  "bun": [
    "buns",
    "buns am",
    "buns dey",
    "buns don",
    "buns go"
  ],
  "buns": [
    "buns",
    "buns am",
    "buns dey",
    "buns don",
    "buns go"
  ],
  "mea": [
    "meat pie"
  ],
  "meat": [
    "meat pie"
  ],
  "fis": [
    "fish pie",
    "fish barbecue"
  ],
  "fish": [
    "fish pie",
    "fish barbecue"
  ],
  "egg": [
    "egg roll"
  ],
  "egg ": [
    "egg roll"
  ],
  "gal": [
    "gala",
    "gala am",
    "gala dey",
    "gala don",
    "gala go"
  ],
  "gala": [
    "gala",
    "gala am",
    "gala dey",
    "gala don",
    "gala go"
  ],
  "lac": [
    "lacasera",
    "lacasera am",
    "lacasera dey",
    "lacasera don",
    "lacasera go"
  ],
  "laca": [
    "lacasera",
    "lacasera am",
    "lacasera dey",
    "lacasera don",
    "lacasera go"
  ],
  "fan": [
    "fanta",
    "fanta am",
    "fanta dey",
    "fanta don",
    "fanta go"
  ],
  "fant": [
    "fanta",
    "fanta am",
    "fanta dey",
    "fanta don",
    "fanta go"
  ],
  "cok": [
    "coke",
    "coke am",
    "coke dey",
    "coke don",
    "coke go"
  ],
  "coke": [
    "coke",
    "coke am",
    "coke dey",
    "coke don",
    "coke go"
  ],
  "mal": [
    "malt",
    "malt am",
    "malt dey",
    "malt don",
    "malt go"
  ],
  "malt": [
    "malt",
    "malt am",
    "malt dey",
    "malt don",
    "malt go"
  ],
  "zo": [
    "zobo",
    "zobo am",
    "zobo dey",
    "zobo don",
    "zobo go"
  ],
  "zob": [
    "zobo",
    "zobo am",
    "zobo dey",
    "zobo don",
    "zobo go"
  ],
  "zobo": [
    "zobo",
    "zobo am",
    "zobo dey",
    "zobo don",
    "zobo go"
  ],
  "ku": [
    "kunu",
    "kunu am",
    "kunu dey",
    "kunu don",
    "kunu go"
  ],
  "kun": [
    "kunu",
    "kunu am",
    "kunu dey",
    "kunu don",
    "kunu go"
  ],
  "kunu": [
    "kunu",
    "kunu am",
    "kunu dey",
    "kunu don",
    "kunu go"
  ],
  "palm": [
    "palmwine",
    "palmwine am",
    "palmwine dey",
    "palmwine don",
    "palmwine go"
  ],
  "ng": [
    "ngwo",
    "ngwo am",
    "ngwo dey",
    "ngwo don",
    "ngwo go"
  ],
  "ngw": [
    "ngwo",
    "ngwo am",
    "ngwo dey",
    "ngwo don",
    "ngwo go"
  ],
  "ngwo": [
    "ngwo",
    "ngwo am",
    "ngwo dey",
    "ngwo don",
    "ngwo go"
  ],
  "afa": [
    "afang soup"
  ],
  "afan": [
    "afang soup"
  ],
  "ed": [
    "edikang ikong"
  ],
  "edi": [
    "edikang ikong"
  ],
  "edik": [
    "edikang ikong"
  ],
  "oh": [
    "oha soup"
  ],
  "oha": [
    "oha soup"
  ],
  "oha ": [
    "oha soup"
  ],
  "ban": [
    "banga soup"
  ],
  "bang": [
    "banga soup"
  ],
  "owo ": [
    "owo soup",
    "owo am",
    "owo dey",
    "owo don",
    "owo go"
  ],
  "tuw": [
    "tuwo shinkafa"
  ],
  "tuwo": [
    "tuwo shinkafa"
  ],
  "mi": [
    "miyan kuka"
  ],
  "miy": [
    "miyan kuka"
  ],
  "miya": [
    "miyan kuka"
  ],
  "am": [
    "amala",
    "amala am",
    "amala dey",
    "amala don",
    "amala go"
  ],
  "ama": [
    "amala",
    "amala am",
    "amala dey",
    "amala don",
    "amala go"
  ],
  "amal": [
    "amala",
    "amala am",
    "amala dey",
    "amala don",
    "amala go"
  ],
  "ewe": [
    "ewedu",
    "ewedu am",
    "ewedu dey",
    "ewedu don",
    "ewedu go"
  ],
  "ewed": [
    "ewedu",
    "ewedu am",
    "ewedu dey",
    "ewedu don",
    "ewedu go"
  ],
  "abu": [
    "abula",
    "abula am",
    "abula dey",
    "abula don",
    "abula go"
  ],
  "abul": [
    "abula",
    "abula am",
    "abula dey",
    "abula don",
    "abula go"
  ],
  "fuf": [
    "fufu",
    "fufu am",
    "fufu dey",
    "fufu don",
    "fufu go"
  ],
  "fufu": [
    "fufu",
    "fufu am",
    "fufu dey",
    "fufu don",
    "fufu go"
  ],
  "sem": [
    "semovita",
    "semolina",
    "semovita am",
    "semovita dey",
    "semovita don"
  ],
  "semo": [
    "semovita",
    "semolina",
    "semovita am",
    "semovita dey",
    "semovita don"
  ],
  "whe": [
    "wheat",
    "wheat am",
    "wheat dey",
    "wheat don",
    "wheat go"
  ],
  "whea": [
    "wheat",
    "wheat am",
    "wheat dey",
    "wheat don",
    "wheat go"
  ],
  "eb": [
    "eba",
    "eba am",
    "eba dey",
    "eba don",
    "eba go"
  ],
  "eba": [
    "eba",
    "eba am",
    "eba dey",
    "eba don",
    "eba go"
  ],
  "ep": [
    "epah",
    "epah am",
    "epah dey",
    "epah don",
    "epah go"
  ],
  "epa": [
    "epah",
    "epah am",
    "epah dey",
    "epah don",
    "epah go"
  ],
  "epah": [
    "epah",
    "epah am",
    "epah dey",
    "epah don",
    "epah go"
  ],
  "gro": [
    "groundnut",
    "groundnut am",
    "groundnut dey",
    "groundnut don",
    "groundnut go"
  ],
  "grou": [
    "groundnut",
    "groundnut am",
    "groundnut dey",
    "groundnut don",
    "groundnut go"
  ],
  "ewa": [
    "ewa aganyin"
  ],
  "ewa ": [
    "ewa aganyin"
  ],
  "age": [
    "agege bread"
  ],
  "ageg": [
    "agege bread"
  ],
  "moi": [
    "moi moi"
  ],
  "moi ": [
    "moi moi"
  ],
  "el": [
    "elewe",
    "elewe am",
    "elewe dey",
    "elewe don",
    "elewe go"
  ],
  "ele": [
    "elewe",
    "elewe am",
    "elewe dey",
    "elewe don",
    "elewe go"
  ],
  "elew": [
    "elewe",
    "elewe am",
    "elewe dey",
    "elewe don",
    "elewe go"
  ],
  "catf": [
    "catfish pepper soup"
  ],
  "poi": [
    "point and kill"
  ],
  "poin": [
    "point and kill"
  ],
  "goa": [
    "goat meat pepper soup"
  ],
  "goat": [
    "goat meat pepper soup"
  ],
  "ass": [
    "assorted",
    "assorted am",
    "assorted dey",
    "assorted don",
    "assorted go"
  ],
  "asso": [
    "assorted",
    "assorted am",
    "assorted dey",
    "assorted don",
    "assorted go"
  ],
  "ro": [
    "roundabout",
    "roasted corn",
    "roundabout am",
    "roundabout dey",
    "roundabout don"
  ],
  "rou": [
    "roundabout",
    "roundabout am",
    "roundabout dey",
    "roundabout don",
    "roundabout go"
  ],
  "roun": [
    "roundabout",
    "roundabout am",
    "roundabout dey",
    "roundabout don",
    "roundabout go"
  ],
  "abo": [
    "abodi",
    "abodi am",
    "abodi dey",
    "abodi don",
    "abodi go"
  ],
  "abod": [
    "abodi",
    "abodi am",
    "abodi dey",
    "abodi don",
    "abodi go"
  ],
  "liv": [
    "liver",
    "liver am",
    "liver dey",
    "liver don",
    "liver go"
  ],
  "live": [
    "liver",
    "liver am",
    "liver dey",
    "liver don",
    "liver go"
  ],
  "kid": [
    "kidney",
    "kidney am",
    "kidney dey",
    "kidney don",
    "kidney go"
  ],
  "kidn": [
    "kidney",
    "kidney am",
    "kidney dey",
    "kidney don",
    "kidney go"
  ],
  "tow": [
    "towel",
    "towel am",
    "towel dey",
    "towel don",
    "towel go"
  ],
  "towe": [
    "towel",
    "towel am",
    "towel dey",
    "towel don",
    "towel go"
  ],
  "fuk": [
    "fuku",
    "fuku am",
    "fuku dey",
    "fuku don",
    "fuku go"
  ],
  "fuku": [
    "fuku",
    "fuku am",
    "fuku dey",
    "fuku don",
    "fuku go"
  ],
  "cow": [
    "cow leg"
  ],
  "cow ": [
    "cow leg"
  ],
  "nk": [
    "nkwobi",
    "nkwobi am",
    "nkwobi dey",
    "nkwobi don",
    "nkwobi go"
  ],
  "nkw": [
    "nkwobi",
    "nkwobi am",
    "nkwobi dey",
    "nkwobi don",
    "nkwobi go"
  ],
  "nkwo": [
    "nkwobi",
    "nkwobi am",
    "nkwobi dey",
    "nkwobi don",
    "nkwobi go"
  ],
  "abac": [
    "abacha",
    "abacha am",
    "abacha dey",
    "abacha don",
    "abacha go"
  ],
  "afri": [
    "african salad"
  ],
  "ug": [
    "ugba",
    "ugba am",
    "ugba dey",
    "ugba don",
    "ugba go"
  ],
  "ugb": [
    "ugba",
    "ugba am",
    "ugba dey",
    "ugba don",
    "ugba go"
  ],
  "ugba": [
    "ugba",
    "ugba am",
    "ugba dey",
    "ugba don",
    "ugba go"
  ],
  "uk": [
    "ukwa",
    "ukwa am",
    "ukwa dey",
    "ukwa don",
    "ukwa go"
  ],
  "ukw": [
    "ukwa",
    "ukwa am",
    "ukwa dey",
    "ukwa don",
    "ukwa go"
  ],
  "ukwa": [
    "ukwa",
    "ukwa am",
    "ukwa dey",
    "ukwa don",
    "ukwa go"
  ],
  "yam": [
    "yam porridge"
  ],
  "yam ": [
    "yam porridge"
  ],
  "asar": [
    "asaro",
    "asaro am",
    "asaro dey",
    "asaro don",
    "asaro go"
  ],
  "boi": [
    "boiled yam"
  ],
  "boil": [
    "boiled yam"
  ],
  "roa": [
    "roasted corn"
  ],
  "roas": [
    "roasted corn"
  ],
  "ub": [
    "ube",
    "ube am",
    "ube dey",
    "ube don",
    "ube go"
  ],
  "ube": [
    "ube",
    "ube am",
    "ube dey",
    "ube don",
    "ube go"
  ],
  "pe": [
    "pear",
    "pear am",
    "pear dey",
    "pear don",
    "pear go"
  ],
  "pea": [
    "pear",
    "pear am",
    "pear dey",
    "pear don",
    "pear go"
  ],
  "pear": [
    "pear",
    "pear am",
    "pear dey",
    "pear don",
    "pear go"
  ],
  "agba": [
    "agbalumo",
    "agbalumo am",
    "agbalumo dey",
    "agbalumo don",
    "agbalumo go"
  ],
  "ud": [
    "udara",
    "udara am",
    "udara dey",
    "udara don",
    "udara go"
  ],
  "uda": [
    "udara",
    "udara am",
    "udara dey",
    "udara don",
    "udara go"
  ],
  "udar": [
    "udara",
    "udara am",
    "udara dey",
    "udara don",
    "udara go"
  ],
  "star": [
    "star apple"
  ],
  "sef ": [
    "sef am",
    "sef dey",
    "sef don",
    "sef go",
    "sef fit"
  ],
  "oya ": [
    "oya am",
    "oya dey",
    "oya don",
    "oya go",
    "oya fit"
  ],
  "fit ": [
    "fit am",
    "fit dey",
    "fit don",
    "fit go",
    "fit fit"
  ],
  "dem ": [
    "dem am",
    "dem dey",
    "dem don",
    "dem go",
    "dem fit"
  ],
  "una ": [
    "una am",
    "una dey",
    "una don",
    "una go",
    "una fit"
  ],
  "abi ": [
    "abi am",
    "abi dey",
    "abi don",
    "abi go",
    "abi fit"
  ],
  "kpo ": [
    "kpo am",
    "kpo dey",
    "kpo don",
    "kpo go",
    "kpo fit"
  ],
  "omo ": [
    "omo am",
    "omo dey",
    "omo don",
    "omo go",
    "omo fit"
  ],
  "yab ": [
    "yab am",
    "yab dey",
    "yab don",
    "yab go",
    "yab fit"
  ],
  "vex ": [
    "vex am",
    "vex dey",
    "vex don",
    "vex go",
    "vex fit"
  ],
  "eku ": [
    "eku am",
    "eku dey",
    "eku don",
    "eku go",
    "eku fit"
  ],
  "kpa ": [
    "kpa am",
    "kpa dey",
    "kpa don",
    "kpa go",
    "kpa fit"
  ],
  "ego ": [
    "ego am",
    "ego dey",
    "ego don",
    "ego go",
    "ego fit"
  ],
  "gen ": [
    "gen am",
    "gen dey",
    "gen don",
    "gen go",
    "gen fit"
  ],
  "pos ": [
    "pos am",
    "pos dey",
    "pos don",
    "pos go",
    "pos fit"
  ],
  "aza ": [
    "aza am",
    "aza dey",
    "aza don",
    "aza go",
    "aza fit"
  ],
  "tor ": [
    "tor am",
    "tor dey",
    "tor don",
    "tor go",
    "tor fit"
  ],
  "kai ": [
    "kai am",
    "kai dey",
    "kai don",
    "kai go",
    "kai fit"
  ],
  "nwa ": [
    "nwa am",
    "nwa dey",
    "nwa don",
    "nwa go",
    "nwa fit"
  ],
  "asa ": [
    "asa am",
    "asa dey",
    "asa don",
    "asa go",
    "asa fit"
  ],
  "geh ": [
    "geh am",
    "geh dey",
    "geh don",
    "geh go",
    "geh fit"
  ],
  "gee ": [
    "gee am",
    "gee dey",
    "gee don",
    "gee go",
    "gee fit"
  ],
  "gin ": [
    "gin am",
    "gin dey",
    "gin don",
    "gin go",
    "gin fit"
  ],
  "eba ": [
    "eba am",
    "eba dey",
    "eba don",
    "eba go",
    "eba fit"
  ],
  "ube ": [
    "ube am",
    "ube dey",
    "ube don",
    "ube go",
    "ube fit"
  ]
};

  const PIDGIN_WORD_SET = new Set(PIDGIN_WORDS.map(w => w.toLowerCase()));
  const PIDGIN_TRIGGER_SET = new Set(PIDGIN_TRIGGERS.map(w => w.toLowerCase()));

  class PidginSubDirectory {
    constructor() {
      this.name = 'Nigerian Pidgin';
      this.code = 'pidgin';
      this.badge = 'Naija Pidgin';
      this.icon = 'fa-flag';
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
        const t = tokens[i].trim();
        if (this.triggers.has(t) || this.typoMap[t]) return true;
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
