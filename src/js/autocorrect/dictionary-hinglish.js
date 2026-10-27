/**
 * NEXCHAT Multilingual Sub-Directory: Hindi & Hinglish (हिन्दी / Hinglish) (Deepened)
 * High-Speed O(1) Prefix-Indexed Radix Engine
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const HI_WORDS = [
  "नमस्ते",
  "नमस्कार",
  "धन्यवाद",
  "शुक्रिया",
  "हाँ",
  "नहीं",
  "क्या",
  "क्यों",
  "कहाँ",
  "कब",
  "कैसे",
  "कैसा",
  "कौन",
  "भाई",
  "दोस्त",
  "यार",
  "अच्छा",
  "बहुत",
  "ठीक",
  "सब",
  "कुछ",
  "कोई",
  "आज",
  "कल",
  "अभी",
  "यहाँ",
  "वहाँ",
  "समय",
  "काम",
  "घर",
  "खाना",
  "पानी",
  "प्यार",
  "खुशी",
  "बात",
  "बताओ",
  "सुनो",
  "चलो",
  "आओ",
  "जाओ",
  "करो",
  "रुको",
  "देखो",
  "बोलो",
  "समझो",
  "माता",
  "पिता",
  "बहन",
  "परिवार",
  "namaste",
  "shukriya",
  "dhanyawad",
  "haan",
  "nahi",
  "nhi",
  "kya",
  "kyu",
  "kyun",
  "kaha",
  "kidhar",
  "kab",
  "kaise",
  "kaisa",
  "bhai",
  "bhaiya",
  "bro",
  "dost",
  "yaar",
  "achha",
  "accha",
  "bahut",
  "bohot",
  "theek",
  "thik",
  "sab",
  "kuch",
  "aaj",
  "kal",
  "abhi",
  "yaha",
  "waha",
  "samay",
  "kaam",
  "ghar",
  "khana",
  "pani",
  "chai",
  "pyar",
  "baat",
  "batao",
  "suno",
  "chalo",
  "chal",
  "aao",
  "jao",
  "karo",
  "ruko",
  "dekho",
  "bolo",
  "samajh",
  "pata",
  "pakka",
  "sach",
  "sahi",
  "bilkul",
  "shayad",
  "zaroor",
  "mast",
  "bindas",
  "jugaad",
  "bakwaas",
  "shanti",
  "tension",
  "pagal",
  "sundar",
  "kharab",
  "jaldi",
  "dheere",
  "thoda",
  "zyada",
  "theek hai",
  "chalega",
  "arre",
  "oye",
  "karta",
  "karti",
  "karte",
  "karna",
  "karke",
  "karega",
  "karegi",
  "karenge",
  "karraha",
  "karrahi",
  "karrahe",
  "dekhta",
  "dekhti",
  "dekhte",
  "dekhna",
  "dekhke",
  "dekhega",
  "dekhegi",
  "dekhenge",
  "dekhraha",
  "dekhrahi",
  "dekhrahe",
  "bolta",
  "bolti",
  "bolte",
  "bolna",
  "bolke",
  "bolega",
  "bolegi",
  "bolenge",
  "bolraha",
  "bolrahi",
  "bolrahe",
  "sunta",
  "sunti",
  "sunte",
  "sunna",
  "sunke",
  "sunega",
  "sunegi",
  "sunenge",
  "sunraha",
  "sunrahi",
  "sunrahe",
  "jata",
  "jati",
  "jate",
  "jana",
  "jake",
  "jaega",
  "jaegi",
  "jaenge",
  "jaraha",
  "jarahi",
  "jarahe",
  "aata",
  "aati",
  "aate",
  "aana",
  "aake",
  "aaega",
  "aaegi",
  "aaenge",
  "aaraha",
  "aarahi",
  "aarahe",
  "rehta",
  "rehti",
  "rehte",
  "rehna",
  "rehke",
  "rehega",
  "rehegi",
  "rehenge",
  "rehraha",
  "rehrahi",
  "rehrahe",
  "lagta",
  "lagti",
  "lagte",
  "lagna",
  "lagke",
  "lagega",
  "lagegi",
  "lagenge",
  "lagraha",
  "lagrahi",
  "lagrahe",
  "milta",
  "milti",
  "milte",
  "milna",
  "milke",
  "milega",
  "milegi",
  "milenge",
  "milraha",
  "milrahi",
  "milrahe",
  "samajhta",
  "samajhti",
  "samajhte",
  "samajhna",
  "samajhke",
  "samajhega",
  "samajhegi",
  "samajhenge",
  "samajhraha",
  "samajhrahi",
  "samajhrahe",
  "batata",
  "batati",
  "batate",
  "batana",
  "batake",
  "bataega",
  "bataegi",
  "bataenge",
  "bataraha",
  "batarahi",
  "batarahe",
  "rakhta",
  "rakhti",
  "rakhte",
  "rakhna",
  "rakhke",
  "rakhega",
  "rakhegi",
  "rakhenge",
  "rakhraha",
  "rakhrahi",
  "rakhrahe",
  "leta",
  "leti",
  "lete",
  "lena",
  "leke",
  "leega",
  "leegi",
  "leenge",
  "leraha",
  "lerahi",
  "lerahe",
  "deta",
  "deti",
  "dete",
  "dena",
  "deke",
  "deega",
  "deegi",
  "deenge",
  "deraha",
  "derahi",
  "derahe"
];
  const HI_TYPO_MAP = {
  "bcz": "because",
  "plz": "please",
  "thx": "shukriya",
  "ty": "dhanyawad",
  "hru": "kaise ho",
  "wbu": "aur aap",
  "bta": "batao",
  "btao": "batao",
  "kya chalra": "kya chal raha hai",
  "kch": "kuch",
  "nhi": "nahi",
  "hn": "haan",
  "accha": "achha",
  "bhot": "bahut",
  "thk": "theek",
  "thnx": "dhanyawad",
  "bhaiya": "bhai",
  "yarr": "yaar",
  "kyu": "kyun",
  "kaha": "kahan",
  "namste": "namaste",
  "shukriyaa": "shukriya",
  "dhnyawad": "dhanyawad",
  "theekh": "theek",
  "bilkull": "bilkul",
  "zarur": "zaroor",
  "bindass": "bindaas"
};
  const HI_PREFIX_TABLE = {
  "नम": [
    "नमस्ते",
    "नमस्कार"
  ],
  "नमस": [
    "नमस्ते",
    "नमस्कार"
  ],
  "नमस्": [
    "नमस्ते",
    "नमस्कार"
  ],
  "धन": [
    "धन्यवाद"
  ],
  "धन्": [
    "धन्यवाद"
  ],
  "धन्य": [
    "धन्यवाद"
  ],
  "शु": [
    "शुक्रिया"
  ],
  "शुक": [
    "शुक्रिया"
  ],
  "शुक्": [
    "शुक्रिया"
  ],
  "हा": [
    "हाँ"
  ],
  "हाँ": [
    "हाँ"
  ],
  "नह": [
    "नहीं"
  ],
  "नही": [
    "नहीं"
  ],
  "नहीं": [
    "नहीं"
  ],
  "क्": [
    "क्या",
    "क्यों"
  ],
  "क्य": [
    "क्या",
    "क्यों"
  ],
  "क्या": [
    "क्या"
  ],
  "क्यो": [
    "क्यों"
  ],
  "कह": [
    "कहाँ"
  ],
  "कहा": [
    "कहाँ"
  ],
  "कहाँ": [
    "कहाँ"
  ],
  "कब": [
    "कब"
  ],
  "कै": [
    "कैसे",
    "कैसा"
  ],
  "कैस": [
    "कैसे",
    "कैसा"
  ],
  "कैसे": [
    "कैसे"
  ],
  "कैसा": [
    "कैसा"
  ],
  "कौ": [
    "कौन"
  ],
  "कौन": [
    "कौन"
  ],
  "भा": [
    "भाई"
  ],
  "भाई": [
    "भाई"
  ],
  "दो": [
    "दोस्त"
  ],
  "दोस": [
    "दोस्त"
  ],
  "दोस्": [
    "दोस्त"
  ],
  "या": [
    "यार"
  ],
  "यार": [
    "यार"
  ],
  "अच": [
    "अच्छा"
  ],
  "अच्": [
    "अच्छा"
  ],
  "अच्छ": [
    "अच्छा"
  ],
  "बह": [
    "बहुत",
    "बहन"
  ],
  "बहु": [
    "बहुत"
  ],
  "बहुत": [
    "बहुत"
  ],
  "ठी": [
    "ठीक"
  ],
  "ठीक": [
    "ठीक"
  ],
  "सब": [
    "सब"
  ],
  "कु": [
    "कुछ"
  ],
  "कुछ": [
    "कुछ"
  ],
  "को": [
    "कोई"
  ],
  "कोई": [
    "कोई"
  ],
  "आज": [
    "आज"
  ],
  "कल": [
    "कल"
  ],
  "अभ": [
    "अभी"
  ],
  "अभी": [
    "अभी"
  ],
  "यह": [
    "यहाँ"
  ],
  "यहा": [
    "यहाँ"
  ],
  "यहाँ": [
    "यहाँ"
  ],
  "वह": [
    "वहाँ"
  ],
  "वहा": [
    "वहाँ"
  ],
  "वहाँ": [
    "वहाँ"
  ],
  "सम": [
    "समय",
    "समझो"
  ],
  "समय": [
    "समय"
  ],
  "का": [
    "काम"
  ],
  "काम": [
    "काम"
  ],
  "घर": [
    "घर"
  ],
  "खा": [
    "खाना"
  ],
  "खान": [
    "खाना"
  ],
  "खाना": [
    "खाना"
  ],
  "पा": [
    "पानी"
  ],
  "पान": [
    "पानी"
  ],
  "पानी": [
    "पानी"
  ],
  "प्": [
    "प्यार"
  ],
  "प्य": [
    "प्यार"
  ],
  "प्या": [
    "प्यार"
  ],
  "खु": [
    "खुशी"
  ],
  "खुश": [
    "खुशी"
  ],
  "खुशी": [
    "खुशी"
  ],
  "बा": [
    "बात"
  ],
  "बात": [
    "बात"
  ],
  "बत": [
    "बताओ"
  ],
  "बता": [
    "बताओ"
  ],
  "बताओ": [
    "बताओ"
  ],
  "सु": [
    "सुनो"
  ],
  "सुन": [
    "सुनो"
  ],
  "सुनो": [
    "सुनो"
  ],
  "चल": [
    "चलो"
  ],
  "चलो": [
    "चलो"
  ],
  "आओ": [
    "आओ"
  ],
  "जा": [
    "जाओ"
  ],
  "जाओ": [
    "जाओ"
  ],
  "कर": [
    "करो"
  ],
  "करो": [
    "करो"
  ],
  "रु": [
    "रुको"
  ],
  "रुक": [
    "रुको"
  ],
  "रुको": [
    "रुको"
  ],
  "दे": [
    "देखो"
  ],
  "देख": [
    "देखो"
  ],
  "देखो": [
    "देखो"
  ],
  "बो": [
    "बोलो"
  ],
  "बोल": [
    "बोलो"
  ],
  "बोलो": [
    "बोलो"
  ],
  "समझ": [
    "समझो"
  ],
  "समझो": [
    "समझो"
  ],
  "मा": [
    "माता"
  ],
  "मात": [
    "माता"
  ],
  "माता": [
    "माता"
  ],
  "पि": [
    "पिता"
  ],
  "पित": [
    "पिता"
  ],
  "पिता": [
    "पिता"
  ],
  "बहन": [
    "बहन"
  ],
  "पर": [
    "परिवार"
  ],
  "परि": [
    "परिवार"
  ],
  "परिव": [
    "परिवार"
  ],
  "na": [
    "namaste",
    "nahi"
  ],
  "nam": [
    "namaste"
  ],
  "nama": [
    "namaste"
  ],
  "sh": [
    "shukriya",
    "shayad",
    "shanti"
  ],
  "shu": [
    "shukriya"
  ],
  "shuk": [
    "shukriya"
  ],
  "dh": [
    "dhanyawad",
    "dheere"
  ],
  "dha": [
    "dhanyawad"
  ],
  "dhan": [
    "dhanyawad"
  ],
  "ha": [
    "haan"
  ],
  "haa": [
    "haan"
  ],
  "haan": [
    "haan"
  ],
  "nah": [
    "nahi"
  ],
  "nahi": [
    "nahi"
  ],
  "nh": [
    "nhi"
  ],
  "nhi": [
    "nhi"
  ],
  "ky": [
    "kya",
    "kyu",
    "kyun"
  ],
  "kya": [
    "kya"
  ],
  "kyu": [
    "kyu",
    "kyun"
  ],
  "kyun": [
    "kyun"
  ],
  "ka": [
    "kaha",
    "kab",
    "kaise",
    "kaisa",
    "kal",
    "kaam",
    "karo",
    "karta",
    "karti",
    "karte",
    "karna",
    "karke",
    "karega",
    "karegi",
    "karenge"
  ],
  "kah": [
    "kaha"
  ],
  "kaha": [
    "kaha"
  ],
  "ki": [
    "kidhar"
  ],
  "kid": [
    "kidhar"
  ],
  "kidh": [
    "kidhar"
  ],
  "kab": [
    "kab"
  ],
  "kai": [
    "kaise",
    "kaisa"
  ],
  "kais": [
    "kaise",
    "kaisa"
  ],
  "bh": [
    "bhai",
    "bhaiya"
  ],
  "bha": [
    "bhai",
    "bhaiya"
  ],
  "bhai": [
    "bhai",
    "bhaiya"
  ],
  "br": [
    "bro"
  ],
  "bro": [
    "bro"
  ],
  "do": [
    "dost"
  ],
  "dos": [
    "dost"
  ],
  "dost": [
    "dost"
  ],
  "ya": [
    "yaar",
    "yaha"
  ],
  "yaa": [
    "yaar"
  ],
  "yaar": [
    "yaar"
  ],
  "ac": [
    "achha",
    "accha"
  ],
  "ach": [
    "achha"
  ],
  "achh": [
    "achha"
  ],
  "acc": [
    "accha"
  ],
  "acch": [
    "accha"
  ],
  "ba": [
    "bahut",
    "baat",
    "batao",
    "bakwaas",
    "batata",
    "batati",
    "batate",
    "batana",
    "batake",
    "bataega",
    "bataegi",
    "bataenge",
    "bataraha",
    "batarahi",
    "batarahe"
  ],
  "bah": [
    "bahut"
  ],
  "bahu": [
    "bahut"
  ],
  "bo": [
    "bohot",
    "bolo",
    "bolta",
    "bolti",
    "bolte",
    "bolna",
    "bolke",
    "bolega",
    "bolegi",
    "bolenge",
    "bolraha",
    "bolrahi",
    "bolrahe"
  ],
  "boh": [
    "bohot"
  ],
  "boho": [
    "bohot"
  ],
  "th": [
    "theek",
    "thik",
    "thoda"
  ],
  "the": [
    "theek"
  ],
  "thee": [
    "theek"
  ],
  "thi": [
    "thik"
  ],
  "thik": [
    "thik"
  ],
  "sa": [
    "sab",
    "samay",
    "samajh",
    "sach",
    "sahi",
    "samajhta",
    "samajhti",
    "samajhte",
    "samajhna",
    "samajhke",
    "samajhega",
    "samajhegi",
    "samajhenge",
    "samajhraha",
    "samajhrahi"
  ],
  "sab": [
    "sab"
  ],
  "ku": [
    "kuch"
  ],
  "kuc": [
    "kuch"
  ],
  "kuch": [
    "kuch"
  ],
  "aa": [
    "aaj",
    "aao",
    "aata",
    "aati",
    "aate",
    "aana",
    "aake",
    "aaega",
    "aaegi",
    "aaenge",
    "aaraha",
    "aarahi",
    "aarahe"
  ],
  "aaj": [
    "aaj"
  ],
  "kal": [
    "kal"
  ],
  "ab": [
    "abhi"
  ],
  "abh": [
    "abhi"
  ],
  "abhi": [
    "abhi"
  ],
  "yah": [
    "yaha"
  ],
  "yaha": [
    "yaha"
  ],
  "wa": [
    "waha"
  ],
  "wah": [
    "waha"
  ],
  "waha": [
    "waha"
  ],
  "sam": [
    "samay",
    "samajh",
    "samajhta",
    "samajhti",
    "samajhte",
    "samajhna",
    "samajhke",
    "samajhega",
    "samajhegi",
    "samajhenge",
    "samajhraha",
    "samajhrahi",
    "samajhrahe"
  ],
  "sama": [
    "samay",
    "samajh",
    "samajhta",
    "samajhti",
    "samajhte",
    "samajhna",
    "samajhke",
    "samajhega",
    "samajhegi",
    "samajhenge",
    "samajhraha",
    "samajhrahi",
    "samajhrahe"
  ],
  "kaa": [
    "kaam"
  ],
  "kaam": [
    "kaam"
  ],
  "gh": [
    "ghar"
  ],
  "gha": [
    "ghar"
  ],
  "ghar": [
    "ghar"
  ],
  "kh": [
    "khana",
    "kharab"
  ],
  "kha": [
    "khana",
    "kharab"
  ],
  "khan": [
    "khana"
  ],
  "pa": [
    "pani",
    "pata",
    "pakka",
    "pagal"
  ],
  "pan": [
    "pani"
  ],
  "pani": [
    "pani"
  ],
  "ch": [
    "chai",
    "chalo",
    "chal",
    "chalega"
  ],
  "cha": [
    "chai",
    "chalo",
    "chal",
    "chalega"
  ],
  "chai": [
    "chai"
  ],
  "py": [
    "pyar"
  ],
  "pya": [
    "pyar"
  ],
  "pyar": [
    "pyar"
  ],
  "baa": [
    "baat"
  ],
  "baat": [
    "baat"
  ],
  "bat": [
    "batao",
    "batata",
    "batati",
    "batate",
    "batana",
    "batake",
    "bataega",
    "bataegi",
    "bataenge",
    "bataraha",
    "batarahi",
    "batarahe"
  ],
  "bata": [
    "batao",
    "batata",
    "batati",
    "batate",
    "batana",
    "batake",
    "bataega",
    "bataegi",
    "bataenge",
    "bataraha",
    "batarahi",
    "batarahe"
  ],
  "su": [
    "suno",
    "sundar",
    "sunta",
    "sunti",
    "sunte",
    "sunna",
    "sunke",
    "sunega",
    "sunegi",
    "sunenge",
    "sunraha",
    "sunrahi",
    "sunrahe"
  ],
  "sun": [
    "suno",
    "sundar",
    "sunta",
    "sunti",
    "sunte",
    "sunna",
    "sunke",
    "sunega",
    "sunegi",
    "sunenge",
    "sunraha",
    "sunrahi",
    "sunrahe"
  ],
  "suno": [
    "suno"
  ],
  "chal": [
    "chalo",
    "chal",
    "chalega"
  ],
  "aao": [
    "aao"
  ],
  "ja": [
    "jao",
    "jaldi",
    "jata",
    "jati",
    "jate",
    "jana",
    "jake",
    "jaega",
    "jaegi",
    "jaenge",
    "jaraha",
    "jarahi",
    "jarahe"
  ],
  "jao": [
    "jao"
  ],
  "kar": [
    "karo",
    "karta",
    "karti",
    "karte",
    "karna",
    "karke",
    "karega",
    "karegi",
    "karenge",
    "karraha",
    "karrahi",
    "karrahe"
  ],
  "karo": [
    "karo"
  ],
  "ru": [
    "ruko"
  ],
  "ruk": [
    "ruko"
  ],
  "ruko": [
    "ruko"
  ],
  "de": [
    "dekho",
    "dekhta",
    "dekhti",
    "dekhte",
    "dekhna",
    "dekhke",
    "dekhega",
    "dekhegi",
    "dekhenge",
    "dekhraha",
    "dekhrahi",
    "dekhrahe",
    "deta",
    "deti",
    "dete"
  ],
  "dek": [
    "dekho",
    "dekhta",
    "dekhti",
    "dekhte",
    "dekhna",
    "dekhke",
    "dekhega",
    "dekhegi",
    "dekhenge",
    "dekhraha",
    "dekhrahi",
    "dekhrahe",
    "deke"
  ],
  "dekh": [
    "dekho",
    "dekhta",
    "dekhti",
    "dekhte",
    "dekhna",
    "dekhke",
    "dekhega",
    "dekhegi",
    "dekhenge",
    "dekhraha",
    "dekhrahi",
    "dekhrahe"
  ],
  "bol": [
    "bolo",
    "bolta",
    "bolti",
    "bolte",
    "bolna",
    "bolke",
    "bolega",
    "bolegi",
    "bolenge",
    "bolraha",
    "bolrahi",
    "bolrahe"
  ],
  "bolo": [
    "bolo"
  ],
  "pat": [
    "pata"
  ],
  "pata": [
    "pata"
  ],
  "pak": [
    "pakka"
  ],
  "pakk": [
    "pakka"
  ],
  "sac": [
    "sach"
  ],
  "sach": [
    "sach"
  ],
  "sah": [
    "sahi"
  ],
  "sahi": [
    "sahi"
  ],
  "bi": [
    "bilkul",
    "bindas"
  ],
  "bil": [
    "bilkul"
  ],
  "bilk": [
    "bilkul"
  ],
  "sha": [
    "shayad",
    "shanti"
  ],
  "shay": [
    "shayad"
  ],
  "za": [
    "zaroor"
  ],
  "zar": [
    "zaroor"
  ],
  "zaro": [
    "zaroor"
  ],
  "ma": [
    "mast"
  ],
  "mas": [
    "mast"
  ],
  "mast": [
    "mast"
  ],
  "bin": [
    "bindas"
  ],
  "bind": [
    "bindas"
  ],
  "ju": [
    "jugaad"
  ],
  "jug": [
    "jugaad"
  ],
  "juga": [
    "jugaad"
  ],
  "bak": [
    "bakwaas"
  ],
  "bakw": [
    "bakwaas"
  ],
  "shan": [
    "shanti"
  ],
  "te": [
    "tension"
  ],
  "ten": [
    "tension"
  ],
  "tens": [
    "tension"
  ],
  "pag": [
    "pagal"
  ],
  "paga": [
    "pagal"
  ],
  "sund": [
    "sundar"
  ],
  "khar": [
    "kharab"
  ],
  "jal": [
    "jaldi"
  ],
  "jald": [
    "jaldi"
  ],
  "dhe": [
    "dheere"
  ],
  "dhee": [
    "dheere"
  ],
  "tho": [
    "thoda"
  ],
  "thod": [
    "thoda"
  ],
  "zy": [
    "zyada"
  ],
  "zya": [
    "zyada"
  ],
  "zyad": [
    "zyada"
  ],
  "ar": [
    "arre"
  ],
  "arr": [
    "arre"
  ],
  "arre": [
    "arre"
  ],
  "oy": [
    "oye"
  ],
  "oye": [
    "oye"
  ],
  "kart": [
    "karta",
    "karti",
    "karte"
  ],
  "karn": [
    "karna"
  ],
  "kark": [
    "karke"
  ],
  "kare": [
    "karega",
    "karegi",
    "karenge"
  ],
  "karr": [
    "karraha",
    "karrahi",
    "karrahe"
  ],
  "bolt": [
    "bolta",
    "bolti",
    "bolte"
  ],
  "boln": [
    "bolna"
  ],
  "bolk": [
    "bolke"
  ],
  "bole": [
    "bolega",
    "bolegi",
    "bolenge"
  ],
  "bolr": [
    "bolraha",
    "bolrahi",
    "bolrahe"
  ],
  "sunt": [
    "sunta",
    "sunti",
    "sunte"
  ],
  "sunn": [
    "sunna"
  ],
  "sunk": [
    "sunke"
  ],
  "sune": [
    "sunega",
    "sunegi",
    "sunenge"
  ],
  "sunr": [
    "sunraha",
    "sunrahi",
    "sunrahe"
  ],
  "jat": [
    "jata",
    "jati",
    "jate"
  ],
  "jata": [
    "jata"
  ],
  "jati": [
    "jati"
  ],
  "jate": [
    "jate"
  ],
  "jan": [
    "jana"
  ],
  "jana": [
    "jana"
  ],
  "jak": [
    "jake"
  ],
  "jake": [
    "jake"
  ],
  "jae": [
    "jaega",
    "jaegi",
    "jaenge"
  ],
  "jaeg": [
    "jaega",
    "jaegi"
  ],
  "jaen": [
    "jaenge"
  ],
  "jar": [
    "jaraha",
    "jarahi",
    "jarahe"
  ],
  "jara": [
    "jaraha",
    "jarahi",
    "jarahe"
  ],
  "aat": [
    "aata",
    "aati",
    "aate"
  ],
  "aata": [
    "aata"
  ],
  "aati": [
    "aati"
  ],
  "aate": [
    "aate"
  ],
  "aan": [
    "aana"
  ],
  "aana": [
    "aana"
  ],
  "aak": [
    "aake"
  ],
  "aake": [
    "aake"
  ],
  "aae": [
    "aaega",
    "aaegi",
    "aaenge"
  ],
  "aaeg": [
    "aaega",
    "aaegi"
  ],
  "aaen": [
    "aaenge"
  ],
  "aar": [
    "aaraha",
    "aarahi",
    "aarahe"
  ],
  "aara": [
    "aaraha",
    "aarahi",
    "aarahe"
  ],
  "re": [
    "rehta",
    "rehti",
    "rehte",
    "rehna",
    "rehke",
    "rehega",
    "rehegi",
    "rehenge",
    "rehraha",
    "rehrahi",
    "rehrahe"
  ],
  "reh": [
    "rehta",
    "rehti",
    "rehte",
    "rehna",
    "rehke",
    "rehega",
    "rehegi",
    "rehenge",
    "rehraha",
    "rehrahi",
    "rehrahe"
  ],
  "reht": [
    "rehta",
    "rehti",
    "rehte"
  ],
  "rehn": [
    "rehna"
  ],
  "rehk": [
    "rehke"
  ],
  "rehe": [
    "rehega",
    "rehegi",
    "rehenge"
  ],
  "rehr": [
    "rehraha",
    "rehrahi",
    "rehrahe"
  ],
  "la": [
    "lagta",
    "lagti",
    "lagte",
    "lagna",
    "lagke",
    "lagega",
    "lagegi",
    "lagenge",
    "lagraha",
    "lagrahi",
    "lagrahe"
  ],
  "lag": [
    "lagta",
    "lagti",
    "lagte",
    "lagna",
    "lagke",
    "lagega",
    "lagegi",
    "lagenge",
    "lagraha",
    "lagrahi",
    "lagrahe"
  ],
  "lagt": [
    "lagta",
    "lagti",
    "lagte"
  ],
  "lagn": [
    "lagna"
  ],
  "lagk": [
    "lagke"
  ],
  "lage": [
    "lagega",
    "lagegi",
    "lagenge"
  ],
  "lagr": [
    "lagraha",
    "lagrahi",
    "lagrahe"
  ],
  "mi": [
    "milta",
    "milti",
    "milte",
    "milna",
    "milke",
    "milega",
    "milegi",
    "milenge",
    "milraha",
    "milrahi",
    "milrahe"
  ],
  "mil": [
    "milta",
    "milti",
    "milte",
    "milna",
    "milke",
    "milega",
    "milegi",
    "milenge",
    "milraha",
    "milrahi",
    "milrahe"
  ],
  "milt": [
    "milta",
    "milti",
    "milte"
  ],
  "miln": [
    "milna"
  ],
  "milk": [
    "milke"
  ],
  "mile": [
    "milega",
    "milegi",
    "milenge"
  ],
  "milr": [
    "milraha",
    "milrahi",
    "milrahe"
  ],
  "ra": [
    "rakhta",
    "rakhti",
    "rakhte",
    "rakhna",
    "rakhke",
    "rakhega",
    "rakhegi",
    "rakhenge",
    "rakhraha",
    "rakhrahi",
    "rakhrahe"
  ],
  "rak": [
    "rakhta",
    "rakhti",
    "rakhte",
    "rakhna",
    "rakhke",
    "rakhega",
    "rakhegi",
    "rakhenge",
    "rakhraha",
    "rakhrahi",
    "rakhrahe"
  ],
  "rakh": [
    "rakhta",
    "rakhti",
    "rakhte",
    "rakhna",
    "rakhke",
    "rakhega",
    "rakhegi",
    "rakhenge",
    "rakhraha",
    "rakhrahi",
    "rakhrahe"
  ],
  "le": [
    "leta",
    "leti",
    "lete",
    "lena",
    "leke",
    "leega",
    "leegi",
    "leenge",
    "leraha",
    "lerahi",
    "lerahe"
  ],
  "let": [
    "leta",
    "leti",
    "lete"
  ],
  "leta": [
    "leta"
  ],
  "leti": [
    "leti"
  ],
  "lete": [
    "lete"
  ],
  "len": [
    "lena"
  ],
  "lena": [
    "lena"
  ],
  "lek": [
    "leke"
  ],
  "leke": [
    "leke"
  ],
  "lee": [
    "leega",
    "leegi",
    "leenge"
  ],
  "leeg": [
    "leega",
    "leegi"
  ],
  "leen": [
    "leenge"
  ],
  "ler": [
    "leraha",
    "lerahi",
    "lerahe"
  ],
  "lera": [
    "leraha",
    "lerahi",
    "lerahe"
  ],
  "det": [
    "deta",
    "deti",
    "dete"
  ],
  "deta": [
    "deta"
  ],
  "deti": [
    "deti"
  ],
  "dete": [
    "dete"
  ],
  "den": [
    "dena"
  ],
  "dena": [
    "dena"
  ],
  "deke": [
    "deke"
  ],
  "dee": [
    "deega",
    "deegi",
    "deenge"
  ],
  "deeg": [
    "deega",
    "deegi"
  ],
  "deen": [
    "deenge"
  ],
  "der": [
    "deraha",
    "derahi",
    "derahe"
  ],
  "dera": [
    "deraha",
    "derahi",
    "derahe"
  ]
};
  const HI_WORD_SET = new Set(HI_WORDS);

  const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

  class HinglishSubDirectory {
    constructor() {
      this.name = 'Hindi & Hinglish (हिन्दी)';
      this.code = 'hi';
      this.badge = 'Hinglish';
      this.icon = 'fa-om';
      this.wordSet = HI_WORD_SET;
      this.typoMap = HI_TYPO_MAP;
      this.prefixTable = HI_PREFIX_TABLE;
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
      if (DEVANAGARI_REGEX.test(text)) return true;
      const lower = text.toLowerCase();
      const tokens = lower.split(/\s+|[.,!?;:()]+/);
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i].trim();
        if (this.typoMap[t]) return true;
      }
      return /\b(namaste|shukriya|dhanyawad|kaise|kaisa|kaisi|bhai|yaar|dost|theek|achha|accha|bohot|bahut|kya|kyun|kaha|mast|bindas)\b/i.test(lower);
    }

    activate() {
      this.isActive = true;
      if (typeof window !== 'undefined') window.HI_SUBDIRECTORY_ACTIVE = true;
    }

    deactivate() {
      this.isActive = false;
      if (typeof window !== 'undefined') window.HI_SUBDIRECTORY_ACTIVE = false;
    }
  }

  const hiSubDir = new HinglishSubDirectory();

  window.HI_WORDS = HI_WORDS;
  window.HI_TYPO_MAP = HI_TYPO_MAP;
  window.HI_WORD_SET = HI_WORD_SET;
  window.HI_PREFIX_TABLE = HI_PREFIX_TABLE;
  window.HI_SUBDIRECTORY = hiSubDir;
})();
