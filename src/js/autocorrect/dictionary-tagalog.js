/**
 * NEXCHAT Multilingual Sub-Directory: Tagalog & Taglish Slang (Deepened)
 * High-Speed O(1) Prefix-Indexed Radix Engine
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const TL_WORDS = [
  "kamusta",
  "kumusta",
  "musta",
  "salamat",
  "maraming",
  "walang",
  "anuman",
  "opo",
  "hindi",
  "hindi po",
  "pakiusap",
  "pasensya",
  "patawad",
  "ingat",
  "tara",
  "magandang",
  "umaga",
  "hapon",
  "gabi",
  "tanghali",
  "araw",
  "paalam",
  "tuloy",
  "kayo",
  "mabuhay",
  "sige",
  "ayos",
  "ano",
  "sino",
  "saan",
  "kailan",
  "bakit",
  "paano",
  "magkano",
  "ilan",
  "nasaan",
  "talaga",
  "ako",
  "ikaw",
  "siya",
  "kami",
  "tayo",
  "sila",
  "kain",
  "inom",
  "tulog",
  "gising",
  "alis",
  "dating",
  "pasok",
  "labas",
  "gawa",
  "laro",
  "aral",
  "basa",
  "sulat",
  "bili",
  "benta",
  "bayad",
  "bigay",
  "kuha",
  "tulong",
  "usap",
  "gusto",
  "mahal",
  "alam",
  "lods",
  "lodi",
  "petmalu",
  "werpa",
  "charot",
  "char",
  "pramis",
  "amaccana",
  "eme",
  "chibog",
  "chika",
  "epal",
  "jowa",
  "anyare",
  "legit",
  "shookt",
  "mumsh",
  "besh",
  "pre",
  "bro",
  "idol",
  "sana all",
  "walwal",
  "hanep",
  "swabe",
  "laban",
  "awit",
  "nanay",
  "tatay",
  "kapatid",
  "kuya",
  "ate",
  "bunso",
  "kaibigan",
  "bahay",
  "kwarto",
  "kotse",
  "jeep",
  "pera",
  "sahod",
  "trabaho",
  "paaralan",
  "pagkain",
  "tubig",
  "kape",
  "kanin",
  "adobo",
  "sinigang",
  "lechon",
  "masarap",
  "gutom",
  "busog",
  "maganda",
  "pogi",
  "mabilis",
  "mabagal",
  "masaya",
  "malungkot",
  "bago",
  "luma",
  "malaki",
  "maliit",
  "mura",
  "madali",
  "mahirap",
  "mabait",
  "malinis",
  "mainit",
  "nagkain",
  "magkain",
  "nagkainka",
  "umkain",
  "kainin",
  "ikain",
  "makain",
  "naginom",
  "maginom",
  "naginomin",
  "uminom",
  "inomin",
  "iinom",
  "mainom",
  "nagtulog",
  "magtulog",
  "nagtulogtu",
  "umtulog",
  "tulogin",
  "itulog",
  "matulog",
  "naggising",
  "maggising",
  "naggisinggi",
  "umgising",
  "gisingin",
  "igising",
  "magising",
  "nagalis",
  "magalis",
  "nagalisal",
  "umalis",
  "alisin",
  "ialis",
  "maalis",
  "nagdating",
  "magdating",
  "nagdatingda",
  "umdating",
  "datingin",
  "idating",
  "madating",
  "nagpasok",
  "magpasok",
  "nagpasokpa",
  "umpasok",
  "pasokin",
  "ipasok",
  "mapasok",
  "naglabas",
  "maglabas",
  "naglabasla",
  "umlabas",
  "labasin",
  "ilabas",
  "malabas",
  "naggawa",
  "maggawa",
  "naggawaga",
  "umgawa",
  "gawain",
  "igawa",
  "magawa",
  "naglaro",
  "maglaro",
  "naglarola",
  "umlaro",
  "laroin",
  "ilaro",
  "malaro",
  "nagaral",
  "magaral",
  "nagaralar",
  "umaral",
  "aralin",
  "iaral",
  "maaral",
  "nagbasa",
  "magbasa",
  "nagbasaba",
  "umbasa",
  "basain",
  "ibasa",
  "mabasa",
  "nagsulat",
  "magsulat",
  "nagsulatsu",
  "umsulat",
  "sulatin",
  "isulat",
  "masulat",
  "nagbili",
  "magbili",
  "nagbilibi",
  "umbili",
  "biliin",
  "ibili",
  "mabili",
  "nagbayad",
  "magbayad",
  "nagbayadba",
  "umbayad",
  "bayadin",
  "ibayad",
  "mabayad",
  "nagtulong",
  "magtulong",
  "nagtulongtu",
  "umtulong",
  "tulongin",
  "itulong",
  "matulong",
  "nagusap",
  "magusap",
  "nagusapus",
  "umusap",
  "usapin",
  "iusap",
  "mausap",
  "nagisip",
  "magisip",
  "nagisipis",
  "umisip",
  "isipin",
  "iisip",
  "maisip",
  "nagtawa",
  "magtawa",
  "nagtawata",
  "umtawa",
  "tawain",
  "itawa",
  "matawa",
  "nagiyak",
  "magiyak",
  "nagiyakiy",
  "umiyak",
  "iyakin",
  "iiyak",
  "maiyak"
];
  const TL_TYPO_MAP = {
  "kmsta": "kamusta",
  "kamuzta": "kamusta",
  "kmuzta": "kamusta",
  "slmt": "salamat",
  "matsala": "salamat",
  "mamats": "salamat",
  "ty": "salamat",
  "thx": "salamat",
  "tnx": "salamat",
  "dba": "diba",
  "bkit": "bakit",
  "bket": "bakit",
  "bkt": "bakit",
  "cno": "sino",
  "sn": "saan",
  "san": "saan",
  "kln": "kailan",
  "pno": "paano",
  "mgkano": "magkano",
  "tlga": "talaga",
  "tlg": "talaga",
  "dpat": "dapat",
  "cge": "sige",
  "geh": "sige",
  "ge": "sige",
  "wla": "wala",
  "meron": "mayroon",
  "mrn": "meron",
  "pra": "para",
  "bka": "baka",
  "kse": "kasi",
  "kze": "kasi",
  "dmi": "dami",
  "d2": "dito",
  "d1": "doon",
  "dn": "din",
  "rn": "rin",
  "magndang": "magandang",
  "salmt": "salamat",
  "hind": "hindi",
  "plengke": "palengke",
  "trabho": "trabaho",
  "kaibgn": "kaibigan",
  "kptd": "kapatid",
  "pgkain": "pagkain"
};
  const TL_PREFIX_TABLE = {
  "ka": [
    "kamusta",
    "kayo",
    "kailan",
    "kami",
    "kain",
    "kapatid",
    "kaibigan",
    "kape",
    "kanin",
    "kainin"
  ],
  "kam": [
    "kamusta",
    "kami"
  ],
  "kamu": [
    "kamusta"
  ],
  "ku": [
    "kumusta",
    "kuha",
    "kuya"
  ],
  "kum": [
    "kumusta"
  ],
  "kumu": [
    "kumusta"
  ],
  "mu": [
    "musta",
    "mumsh",
    "mura"
  ],
  "mus": [
    "musta"
  ],
  "must": [
    "musta"
  ],
  "sa": [
    "salamat",
    "saan",
    "sahod"
  ],
  "sal": [
    "salamat"
  ],
  "sala": [
    "salamat"
  ],
  "ma": [
    "maraming",
    "magandang",
    "mabuhay",
    "magkano",
    "mahal",
    "masarap",
    "maganda",
    "mabilis",
    "mabagal",
    "masaya",
    "malungkot",
    "malaki",
    "maliit",
    "madali",
    "mahirap"
  ],
  "mar": [
    "maraming"
  ],
  "mara": [
    "maraming"
  ],
  "wa": [
    "walang",
    "walwal"
  ],
  "wal": [
    "walang",
    "walwal"
  ],
  "wala": [
    "walang"
  ],
  "an": [
    "anuman",
    "ano",
    "anyare"
  ],
  "anu": [
    "anuman"
  ],
  "anum": [
    "anuman"
  ],
  "op": [
    "opo"
  ],
  "opo": [
    "opo"
  ],
  "hi": [
    "hindi"
  ],
  "hin": [
    "hindi"
  ],
  "hind": [
    "hindi"
  ],
  "pa": [
    "pakiusap",
    "pasensya",
    "patawad",
    "paalam",
    "paano",
    "pasok",
    "paaralan",
    "pagkain",
    "pasokin"
  ],
  "pak": [
    "pakiusap"
  ],
  "paki": [
    "pakiusap"
  ],
  "pas": [
    "pasensya",
    "pasok",
    "pasokin"
  ],
  "pase": [
    "pasensya"
  ],
  "pat": [
    "patawad"
  ],
  "pata": [
    "patawad"
  ],
  "in": [
    "ingat",
    "inom",
    "inomin"
  ],
  "ing": [
    "ingat"
  ],
  "inga": [
    "ingat"
  ],
  "ta": [
    "tara",
    "tanghali",
    "talaga",
    "tayo",
    "tatay",
    "tawain"
  ],
  "tar": [
    "tara"
  ],
  "tara": [
    "tara"
  ],
  "mag": [
    "magandang",
    "magkano",
    "maganda",
    "magkain",
    "maginom",
    "magtulog",
    "maggising",
    "magising",
    "magalis",
    "magdating",
    "magpasok",
    "maglabas",
    "maggawa",
    "magawa",
    "maglaro"
  ],
  "maga": [
    "magandang",
    "maganda",
    "magalis",
    "magawa",
    "magaral"
  ],
  "um": [
    "umaga",
    "umkain",
    "uminom",
    "umtulog",
    "umgising",
    "umalis",
    "umdating",
    "umpasok",
    "umlabas",
    "umgawa",
    "umlaro",
    "umaral",
    "umbasa",
    "umsulat",
    "umbili"
  ],
  "uma": [
    "umaga",
    "umalis",
    "umaral"
  ],
  "umag": [
    "umaga"
  ],
  "ha": [
    "hapon",
    "hanep"
  ],
  "hap": [
    "hapon"
  ],
  "hapo": [
    "hapon"
  ],
  "ga": [
    "gabi",
    "gawa",
    "gawain"
  ],
  "gab": [
    "gabi"
  ],
  "gabi": [
    "gabi"
  ],
  "tan": [
    "tanghali"
  ],
  "tang": [
    "tanghali"
  ],
  "ar": [
    "araw",
    "aral",
    "aralin"
  ],
  "ara": [
    "araw",
    "aral",
    "aralin"
  ],
  "araw": [
    "araw"
  ],
  "paa": [
    "paalam",
    "paano",
    "paaralan"
  ],
  "paal": [
    "paalam"
  ],
  "tu": [
    "tuloy",
    "tulog",
    "tulong",
    "tubig",
    "tulogin",
    "tulongin"
  ],
  "tul": [
    "tuloy",
    "tulog",
    "tulong",
    "tulogin",
    "tulongin"
  ],
  "tulo": [
    "tuloy",
    "tulog",
    "tulong",
    "tulogin",
    "tulongin"
  ],
  "kay": [
    "kayo"
  ],
  "kayo": [
    "kayo"
  ],
  "mab": [
    "mabuhay",
    "mabilis",
    "mabagal",
    "mabait",
    "mabasa",
    "mabili",
    "mabayad"
  ],
  "mabu": [
    "mabuhay"
  ],
  "si": [
    "sige",
    "sino",
    "siya",
    "sila",
    "sinigang"
  ],
  "sig": [
    "sige"
  ],
  "sige": [
    "sige"
  ],
  "ay": [
    "ayos"
  ],
  "ayo": [
    "ayos"
  ],
  "ayos": [
    "ayos"
  ],
  "ano": [
    "ano"
  ],
  "sin": [
    "sino",
    "sinigang"
  ],
  "sino": [
    "sino"
  ],
  "saa": [
    "saan"
  ],
  "saan": [
    "saan"
  ],
  "kai": [
    "kailan",
    "kain",
    "kaibigan",
    "kainin"
  ],
  "kail": [
    "kailan"
  ],
  "ba": [
    "bakit",
    "basa",
    "bayad",
    "bahay",
    "bago",
    "basain",
    "bayadin"
  ],
  "bak": [
    "bakit"
  ],
  "baki": [
    "bakit"
  ],
  "paan": [
    "paano"
  ],
  "magk": [
    "magkano",
    "magkain"
  ],
  "il": [
    "ilan",
    "ilabas",
    "ilaro"
  ],
  "ila": [
    "ilan",
    "ilabas",
    "ilaro"
  ],
  "ilan": [
    "ilan"
  ],
  "na": [
    "nasaan",
    "nanay",
    "nagkain",
    "nagkainka",
    "naginom",
    "naginomin",
    "nagtulog",
    "nagtulogtu",
    "naggising",
    "naggisinggi",
    "nagalis",
    "nagalisal",
    "nagdating",
    "nagdatingda",
    "nagpasok"
  ],
  "nas": [
    "nasaan"
  ],
  "nasa": [
    "nasaan"
  ],
  "tal": [
    "talaga"
  ],
  "tala": [
    "talaga"
  ],
  "ak": [
    "ako"
  ],
  "ako": [
    "ako"
  ],
  "ik": [
    "ikaw",
    "ikain"
  ],
  "ika": [
    "ikaw",
    "ikain"
  ],
  "ikaw": [
    "ikaw"
  ],
  "siy": [
    "siya"
  ],
  "siya": [
    "siya"
  ],
  "kami": [
    "kami"
  ],
  "tay": [
    "tayo"
  ],
  "tayo": [
    "tayo"
  ],
  "sil": [
    "sila"
  ],
  "sila": [
    "sila"
  ],
  "kain": [
    "kain",
    "kainin"
  ],
  "ino": [
    "inom",
    "inomin"
  ],
  "inom": [
    "inom",
    "inomin"
  ],
  "gi": [
    "gising",
    "gisingin"
  ],
  "gis": [
    "gising",
    "gisingin"
  ],
  "gisi": [
    "gising",
    "gisingin"
  ],
  "al": [
    "alis",
    "alam",
    "alisin"
  ],
  "ali": [
    "alis",
    "alisin"
  ],
  "alis": [
    "alis",
    "alisin"
  ],
  "da": [
    "dating",
    "datingin"
  ],
  "dat": [
    "dating",
    "datingin"
  ],
  "dati": [
    "dating",
    "datingin"
  ],
  "paso": [
    "pasok",
    "pasokin"
  ],
  "la": [
    "labas",
    "laro",
    "laban",
    "labasin",
    "laroin"
  ],
  "lab": [
    "labas",
    "laban",
    "labasin"
  ],
  "laba": [
    "labas",
    "laban",
    "labasin"
  ],
  "gaw": [
    "gawa",
    "gawain"
  ],
  "gawa": [
    "gawa",
    "gawain"
  ],
  "lar": [
    "laro",
    "laroin"
  ],
  "laro": [
    "laro",
    "laroin"
  ],
  "aral": [
    "aral",
    "aralin"
  ],
  "bas": [
    "basa",
    "basain"
  ],
  "basa": [
    "basa",
    "basain"
  ],
  "su": [
    "sulat",
    "sulatin"
  ],
  "sul": [
    "sulat",
    "sulatin"
  ],
  "sula": [
    "sulat",
    "sulatin"
  ],
  "bi": [
    "bili",
    "bigay",
    "biliin"
  ],
  "bil": [
    "bili",
    "biliin"
  ],
  "bili": [
    "bili",
    "biliin"
  ],
  "be": [
    "benta",
    "besh"
  ],
  "ben": [
    "benta"
  ],
  "bent": [
    "benta"
  ],
  "bay": [
    "bayad",
    "bayadin"
  ],
  "baya": [
    "bayad",
    "bayadin"
  ],
  "big": [
    "bigay"
  ],
  "biga": [
    "bigay"
  ],
  "kuh": [
    "kuha"
  ],
  "kuha": [
    "kuha"
  ],
  "us": [
    "usap",
    "usapin"
  ],
  "usa": [
    "usap",
    "usapin"
  ],
  "usap": [
    "usap",
    "usapin"
  ],
  "gu": [
    "gusto",
    "gutom"
  ],
  "gus": [
    "gusto"
  ],
  "gust": [
    "gusto"
  ],
  "mah": [
    "mahal",
    "mahirap"
  ],
  "maha": [
    "mahal"
  ],
  "ala": [
    "alam"
  ],
  "alam": [
    "alam"
  ],
  "lo": [
    "lods",
    "lodi"
  ],
  "lod": [
    "lods",
    "lodi"
  ],
  "lods": [
    "lods"
  ],
  "lodi": [
    "lodi"
  ],
  "pe": [
    "petmalu",
    "pera"
  ],
  "pet": [
    "petmalu"
  ],
  "petm": [
    "petmalu"
  ],
  "we": [
    "werpa"
  ],
  "wer": [
    "werpa"
  ],
  "werp": [
    "werpa"
  ],
  "ch": [
    "charot",
    "char",
    "chibog",
    "chika"
  ],
  "cha": [
    "charot",
    "char"
  ],
  "char": [
    "charot",
    "char"
  ],
  "pr": [
    "pramis",
    "pre"
  ],
  "pra": [
    "pramis"
  ],
  "pram": [
    "pramis"
  ],
  "am": [
    "amaccana"
  ],
  "ama": [
    "amaccana"
  ],
  "amac": [
    "amaccana"
  ],
  "em": [
    "eme"
  ],
  "eme": [
    "eme"
  ],
  "chi": [
    "chibog",
    "chika"
  ],
  "chib": [
    "chibog"
  ],
  "chik": [
    "chika"
  ],
  "ep": [
    "epal"
  ],
  "epa": [
    "epal"
  ],
  "epal": [
    "epal"
  ],
  "jo": [
    "jowa"
  ],
  "jow": [
    "jowa"
  ],
  "jowa": [
    "jowa"
  ],
  "any": [
    "anyare"
  ],
  "anya": [
    "anyare"
  ],
  "le": [
    "legit",
    "lechon"
  ],
  "leg": [
    "legit"
  ],
  "legi": [
    "legit"
  ],
  "sh": [
    "shookt"
  ],
  "sho": [
    "shookt"
  ],
  "shoo": [
    "shookt"
  ],
  "mum": [
    "mumsh"
  ],
  "mums": [
    "mumsh"
  ],
  "bes": [
    "besh"
  ],
  "besh": [
    "besh"
  ],
  "pre": [
    "pre"
  ],
  "br": [
    "bro"
  ],
  "bro": [
    "bro"
  ],
  "id": [
    "idol",
    "idating"
  ],
  "ido": [
    "idol"
  ],
  "idol": [
    "idol"
  ],
  "walw": [
    "walwal"
  ],
  "han": [
    "hanep"
  ],
  "hane": [
    "hanep"
  ],
  "sw": [
    "swabe"
  ],
  "swa": [
    "swabe"
  ],
  "swab": [
    "swabe"
  ],
  "aw": [
    "awit"
  ],
  "awi": [
    "awit"
  ],
  "awit": [
    "awit"
  ],
  "nan": [
    "nanay"
  ],
  "nana": [
    "nanay"
  ],
  "tat": [
    "tatay"
  ],
  "tata": [
    "tatay"
  ],
  "kap": [
    "kapatid",
    "kape"
  ],
  "kapa": [
    "kapatid"
  ],
  "kuy": [
    "kuya"
  ],
  "kuya": [
    "kuya"
  ],
  "at": [
    "ate"
  ],
  "ate": [
    "ate"
  ],
  "bu": [
    "bunso",
    "busog"
  ],
  "bun": [
    "bunso"
  ],
  "buns": [
    "bunso"
  ],
  "kaib": [
    "kaibigan"
  ],
  "bah": [
    "bahay"
  ],
  "baha": [
    "bahay"
  ],
  "kw": [
    "kwarto"
  ],
  "kwa": [
    "kwarto"
  ],
  "kwar": [
    "kwarto"
  ],
  "ko": [
    "kotse"
  ],
  "kot": [
    "kotse"
  ],
  "kots": [
    "kotse"
  ],
  "je": [
    "jeep"
  ],
  "jee": [
    "jeep"
  ],
  "jeep": [
    "jeep"
  ],
  "per": [
    "pera"
  ],
  "pera": [
    "pera"
  ],
  "sah": [
    "sahod"
  ],
  "saho": [
    "sahod"
  ],
  "tr": [
    "trabaho"
  ],
  "tra": [
    "trabaho"
  ],
  "trab": [
    "trabaho"
  ],
  "paar": [
    "paaralan"
  ],
  "pag": [
    "pagkain"
  ],
  "pagk": [
    "pagkain"
  ],
  "tub": [
    "tubig"
  ],
  "tubi": [
    "tubig"
  ],
  "kape": [
    "kape"
  ],
  "kan": [
    "kanin"
  ],
  "kani": [
    "kanin"
  ],
  "ad": [
    "adobo"
  ],
  "ado": [
    "adobo"
  ],
  "adob": [
    "adobo"
  ],
  "sini": [
    "sinigang"
  ],
  "lec": [
    "lechon"
  ],
  "lech": [
    "lechon"
  ],
  "mas": [
    "masarap",
    "masaya",
    "masulat"
  ],
  "masa": [
    "masarap",
    "masaya"
  ],
  "gut": [
    "gutom"
  ],
  "guto": [
    "gutom"
  ],
  "bus": [
    "busog"
  ],
  "buso": [
    "busog"
  ],
  "po": [
    "pogi"
  ],
  "pog": [
    "pogi"
  ],
  "pogi": [
    "pogi"
  ],
  "mabi": [
    "mabilis",
    "mabili"
  ],
  "maba": [
    "mabagal",
    "mabait",
    "mabasa",
    "mabayad"
  ],
  "mal": [
    "malungkot",
    "malaki",
    "maliit",
    "malinis",
    "malabas",
    "malaro"
  ],
  "malu": [
    "malungkot"
  ],
  "bag": [
    "bago"
  ],
  "bago": [
    "bago"
  ],
  "lu": [
    "luma"
  ],
  "lum": [
    "luma"
  ],
  "luma": [
    "luma"
  ],
  "mala": [
    "malaki",
    "malabas",
    "malaro"
  ],
  "mali": [
    "maliit",
    "malinis"
  ],
  "mur": [
    "mura"
  ],
  "mura": [
    "mura"
  ],
  "mad": [
    "madali",
    "madating"
  ],
  "mada": [
    "madali",
    "madating"
  ],
  "mahi": [
    "mahirap"
  ],
  "mai": [
    "mainit",
    "mainom",
    "maisip",
    "maiyak"
  ],
  "main": [
    "mainit",
    "mainom"
  ],
  "nag": [
    "nagkain",
    "nagkainka",
    "naginom",
    "naginomin",
    "nagtulog",
    "nagtulogtu",
    "naggising",
    "naggisinggi",
    "nagalis",
    "nagalisal",
    "nagdating",
    "nagdatingda",
    "nagpasok",
    "nagpasokpa",
    "naglabas"
  ],
  "nagk": [
    "nagkain",
    "nagkainka"
  ],
  "umk": [
    "umkain"
  ],
  "umka": [
    "umkain"
  ],
  "ikai": [
    "ikain"
  ],
  "mak": [
    "makain"
  ],
  "maka": [
    "makain"
  ],
  "nagi": [
    "naginom",
    "naginomin",
    "nagisip",
    "nagisipis",
    "nagiyak",
    "nagiyakiy"
  ],
  "magi": [
    "maginom",
    "magising",
    "magisip",
    "magiyak"
  ],
  "umi": [
    "uminom",
    "umisip",
    "umiyak"
  ],
  "umin": [
    "uminom"
  ],
  "ii": [
    "iinom",
    "iisip",
    "iiyak"
  ],
  "iin": [
    "iinom"
  ],
  "iino": [
    "iinom"
  ],
  "nagt": [
    "nagtulog",
    "nagtulogtu",
    "nagtulong",
    "nagtulongtu",
    "nagtawa",
    "nagtawata"
  ],
  "magt": [
    "magtulog",
    "magtulong",
    "magtawa"
  ],
  "umt": [
    "umtulog",
    "umtulong",
    "umtawa"
  ],
  "umtu": [
    "umtulog",
    "umtulong"
  ],
  "it": [
    "itulog",
    "itulong",
    "itawa"
  ],
  "itu": [
    "itulog",
    "itulong"
  ],
  "itul": [
    "itulog",
    "itulong"
  ],
  "mat": [
    "matulog",
    "matulong",
    "matawa"
  ],
  "matu": [
    "matulog",
    "matulong"
  ],
  "nagg": [
    "naggising",
    "naggisinggi",
    "naggawa",
    "naggawaga"
  ],
  "magg": [
    "maggising",
    "maggawa"
  ],
  "umg": [
    "umgising",
    "umgawa"
  ],
  "umgi": [
    "umgising"
  ],
  "ig": [
    "igising",
    "igawa"
  ],
  "igi": [
    "igising"
  ],
  "igis": [
    "igising"
  ],
  "naga": [
    "nagalis",
    "nagalisal",
    "nagaral",
    "nagaralar"
  ],
  "umal": [
    "umalis"
  ],
  "ia": [
    "ialis",
    "iaral"
  ],
  "ial": [
    "ialis"
  ],
  "iali": [
    "ialis"
  ],
  "maa": [
    "maalis",
    "maaral"
  ],
  "maal": [
    "maalis"
  ],
  "nagd": [
    "nagdating",
    "nagdatingda"
  ],
  "magd": [
    "magdating"
  ],
  "umd": [
    "umdating"
  ],
  "umda": [
    "umdating"
  ],
  "ida": [
    "idating"
  ],
  "idat": [
    "idating"
  ],
  "nagp": [
    "nagpasok",
    "nagpasokpa"
  ],
  "magp": [
    "magpasok"
  ],
  "ump": [
    "umpasok"
  ],
  "umpa": [
    "umpasok"
  ],
  "ip": [
    "ipasok"
  ],
  "ipa": [
    "ipasok"
  ],
  "ipas": [
    "ipasok"
  ],
  "map": [
    "mapasok"
  ],
  "mapa": [
    "mapasok"
  ],
  "nagl": [
    "naglabas",
    "naglabasla",
    "naglaro",
    "naglarola"
  ],
  "magl": [
    "maglabas",
    "maglaro"
  ],
  "uml": [
    "umlabas",
    "umlaro"
  ],
  "umla": [
    "umlabas",
    "umlaro"
  ],
  "ilab": [
    "ilabas"
  ],
  "umga": [
    "umgawa"
  ],
  "iga": [
    "igawa"
  ],
  "igaw": [
    "igawa"
  ],
  "ilar": [
    "ilaro"
  ],
  "umar": [
    "umaral"
  ],
  "iar": [
    "iaral"
  ],
  "iara": [
    "iaral"
  ],
  "maar": [
    "maaral"
  ],
  "nagb": [
    "nagbasa",
    "nagbasaba",
    "nagbili",
    "nagbilibi",
    "nagbayad",
    "nagbayadba"
  ],
  "magb": [
    "magbasa",
    "magbili",
    "magbayad"
  ],
  "umb": [
    "umbasa",
    "umbili",
    "umbayad"
  ],
  "umba": [
    "umbasa",
    "umbayad"
  ],
  "ib": [
    "ibasa",
    "ibili",
    "ibayad"
  ],
  "iba": [
    "ibasa",
    "ibayad"
  ],
  "ibas": [
    "ibasa"
  ],
  "nags": [
    "nagsulat",
    "nagsulatsu"
  ],
  "mags": [
    "magsulat"
  ],
  "ums": [
    "umsulat"
  ],
  "umsu": [
    "umsulat"
  ],
  "is": [
    "isulat",
    "isipin"
  ],
  "isu": [
    "isulat"
  ],
  "isul": [
    "isulat"
  ],
  "masu": [
    "masulat"
  ],
  "umbi": [
    "umbili"
  ],
  "ibi": [
    "ibili"
  ],
  "ibil": [
    "ibili"
  ],
  "ibay": [
    "ibayad"
  ],
  "nagu": [
    "nagusap",
    "nagusapus"
  ],
  "magu": [
    "magusap"
  ],
  "umu": [
    "umusap"
  ],
  "umus": [
    "umusap"
  ],
  "iu": [
    "iusap"
  ],
  "ius": [
    "iusap"
  ],
  "iusa": [
    "iusap"
  ],
  "mau": [
    "mausap"
  ],
  "maus": [
    "mausap"
  ],
  "umis": [
    "umisip"
  ],
  "isi": [
    "isipin"
  ],
  "isip": [
    "isipin"
  ],
  "iis": [
    "iisip"
  ],
  "iisi": [
    "iisip"
  ],
  "mais": [
    "maisip"
  ],
  "umta": [
    "umtawa"
  ],
  "taw": [
    "tawain"
  ],
  "tawa": [
    "tawain"
  ],
  "ita": [
    "itawa"
  ],
  "itaw": [
    "itawa"
  ],
  "mata": [
    "matawa"
  ],
  "umiy": [
    "umiyak"
  ],
  "iy": [
    "iyakin"
  ],
  "iya": [
    "iyakin"
  ],
  "iyak": [
    "iyakin"
  ],
  "iiy": [
    "iiyak"
  ],
  "iiya": [
    "iiyak"
  ],
  "maiy": [
    "maiyak"
  ]
};
  const TL_WORD_SET = new Set(TL_WORDS);

  class TagalogSubDirectory {
    constructor() {
      this.name = 'Tagalog / Taglish';
      this.code = 'tl';
      this.badge = 'Tagalog / Taglish';
      this.icon = 'fa-sun';
      this.wordSet = TL_WORD_SET;
      this.typoMap = TL_TYPO_MAP;
      this.prefixTable = TL_PREFIX_TABLE;
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
      return /\b(kamusta|kumusta|salamat|opo|hindi|pakiusap|ingat|lods|petmalu|werpa|charot|pramis|amaccana|eme|chibog|anyare)\b/i.test(lower);
    }

    activate() {
      this.isActive = true;
      if (typeof window !== 'undefined') window.TL_SUBDIRECTORY_ACTIVE = true;
    }

    deactivate() {
      this.isActive = false;
      if (typeof window !== 'undefined') window.TL_SUBDIRECTORY_ACTIVE = false;
    }
  }

  const tlSubDir = new TagalogSubDirectory();

  window.TL_WORDS = TL_WORDS;
  window.TL_TYPO_MAP = TL_TYPO_MAP;
  window.TL_WORD_SET = TL_WORD_SET;
  window.TL_PREFIX_TABLE = TL_PREFIX_TABLE;
  window.TL_SUBDIRECTORY = tlSubDir;
})();
