/**
 * NEXCHAT Multilingual Sub-Directory: Turkish (Türkçe) & Slang (Deepened)
 * High-Speed O(1) Prefix-Indexed Radix Engine
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const TR_WORDS = [
  "merhaba",
  "selam",
  "günaydın",
  "iyi akşamlar",
  "iyi geceler",
  "nasılsın",
  "iyiyim",
  "teşekkürler",
  "sağol",
  "lütfen",
  "hoşça kal",
  "görüşürüz",
  "tamam",
  "oldu",
  "peki",
  "evet",
  "hayır",
  "yok",
  "var",
  "belki",
  "kesinlikle",
  "tabii",
  "bilmiyorum",
  "anladım",
  "harika",
  "güzel",
  "kolay gelsin",
  "afiyet olsun",
  "inşallah",
  "eyvallah",
  "kardeşim",
  "dostum",
  "kanka",
  "arkadaş",
  "canım",
  "anne",
  "baba",
  "çocuk",
  "aile",
  "zaman",
  "şimdi",
  "hemen",
  "sonra",
  "bugün",
  "yarın",
  "dün",
  "sabah",
  "akşam",
  "gece",
  "ofis",
  "okul",
  "hastane",
  "şehir",
  "para",
  "fiyat",
  "mesaj",
  "telefon",
  "araba",
  "yol",
  "yemek",
  "çay",
  "kahve",
  "ekmek",
  "nasıl",
  "neden",
  "nerede",
  "kim",
  "kaç",
  "çok",
  "büyük",
  "küçük",
  "yeni",
  "eski",
  "iyi",
  "mrb",
  "slm",
  "tsk",
  "kib",
  "aeo",
  "tmm",
  "nbr",
  "nslsn",
  "cnm",
  "krdsm",
  "knk",
  "eyw",
  "geldi",
  "geldim",
  "geldin",
  "geldik",
  "geldiler",
  "geliyor",
  "geliyorum",
  "geliyorsun",
  "geliyoruz",
  "gelecek",
  "geleceğim",
  "geleceksin",
  "gelmek",
  "gelme",
  "gitdi",
  "gitdim",
  "gitdin",
  "gitdik",
  "gitdiler",
  "gitiyor",
  "gitiyorum",
  "gitiyorsun",
  "gitiyoruz",
  "gitecek",
  "giteceğim",
  "giteceksin",
  "gitmek",
  "gitme",
  "yapdi",
  "yapdim",
  "yapdin",
  "yapdik",
  "yapdiler",
  "yapiyor",
  "yapiyorum",
  "yapiyorsun",
  "yapiyoruz",
  "yapecek",
  "yapeceğim",
  "yapeceksin",
  "yapmek",
  "yapme",
  "gördi",
  "gördim",
  "gördin",
  "gördik",
  "gördiler",
  "göriyor",
  "göriyorum",
  "göriyorsun",
  "göriyoruz",
  "görecek",
  "göreceğim",
  "göreceksin",
  "görmek",
  "görme",
  "bakdi",
  "bakdim",
  "bakdin",
  "bakdik",
  "bakdiler",
  "bakiyor",
  "bakiyorum",
  "bakiyorsun",
  "bakiyoruz",
  "bakecek",
  "bakeceğim",
  "bakeceksin",
  "bakmek",
  "bakme",
  "aldi",
  "aldim",
  "aldin",
  "aldik",
  "aldiler",
  "aliyor",
  "aliyorum",
  "aliyorsun",
  "aliyoruz",
  "alecek",
  "aleceğim",
  "aleceksin",
  "almek",
  "alme",
  "verdi",
  "verdim",
  "verdin",
  "verdik",
  "verdiler",
  "veriyor",
  "veriyorum",
  "veriyorsun",
  "veriyoruz",
  "verecek",
  "vereceğim",
  "vereceksin",
  "vermek",
  "verme",
  "bildi",
  "bildim",
  "bildin",
  "bildik",
  "bildiler",
  "biliyor",
  "biliyorum",
  "biliyorsun",
  "biliyoruz",
  "bilecek",
  "bileceğim",
  "bileceksin",
  "bilmek",
  "bilme",
  "istedi",
  "istedim",
  "istedin",
  "istedik",
  "istediler",
  "isteiyor",
  "isteiyorum",
  "isteiyorsun",
  "isteiyoruz",
  "isteecek",
  "isteeceğim",
  "isteeceksin",
  "istemek",
  "isteme",
  "sevdi",
  "sevdim",
  "sevdin",
  "sevdik",
  "sevdiler",
  "seviyor",
  "seviyorum",
  "seviyorsun",
  "seviyoruz",
  "sevecek",
  "seveceğim",
  "seveceksin",
  "sevmek",
  "sevme",
  "duydi",
  "duydim",
  "duydin",
  "duydik",
  "duydiler",
  "duyiyor",
  "duyiyorum",
  "duyiyorsun",
  "duyiyoruz",
  "duyecek",
  "duyeceğim",
  "duyeceksin",
  "duymek",
  "duyme",
  "konuşdi",
  "konuşdim",
  "konuşdin",
  "konuşdik",
  "konuşdiler",
  "konuşiyor",
  "konuşiyorum",
  "konuşiyorsun",
  "konuşiyoruz",
  "konuşecek",
  "konuşeceğim",
  "konuşeceksin",
  "konuşmek",
  "konuşme",
  "yazdi",
  "yazdim",
  "yazdin",
  "yazdik",
  "yazdiler",
  "yaziyor",
  "yaziyorum",
  "yaziyorsun",
  "yaziyoruz",
  "yazecek",
  "yazeceğim",
  "yazeceksin",
  "yazmek",
  "yazme",
  "okudi",
  "okudim",
  "okudin",
  "okudik",
  "okudiler",
  "okuiyor",
  "okuiyorum",
  "okuiyorsun",
  "okuiyoruz",
  "okuecek",
  "okueceğim",
  "okueceksin",
  "okumek",
  "okume",
  "çalışdi",
  "çalışdim",
  "çalışdin",
  "çalışdik",
  "çalışdiler",
  "çalışiyor",
  "çalışiyorum",
  "çalışiyorsun",
  "çalışiyoruz",
  "çalışecek",
  "çalışeceğim",
  "çalışeceksin",
  "çalışmek",
  "çalışme",
  "yedi",
  "yedim",
  "yedin",
  "yedik",
  "yediler",
  "yeiyor",
  "yeiyorum",
  "yeiyorsun",
  "yeiyoruz",
  "yeecek",
  "yeeceğim",
  "yeeceksin",
  "yeme",
  "içdi",
  "içdim",
  "içdin",
  "içdik",
  "içdiler",
  "içiyor",
  "içiyorum",
  "içiyorsun",
  "içiyoruz",
  "içecek",
  "içeceğim",
  "içeceksin",
  "içmek",
  "içme",
  "durdi",
  "durdim",
  "durdin",
  "durdik",
  "durdiler",
  "duriyor",
  "duriyorum",
  "duriyorsun",
  "duriyoruz",
  "durecek",
  "dureceğim",
  "dureceksin",
  "durmek",
  "durme",
  "oturdi",
  "oturdim",
  "oturdin",
  "oturdik",
  "oturdiler",
  "oturiyor",
  "oturiyorum",
  "oturiyorsun",
  "oturiyoruz",
  "oturecek",
  "otureceğim",
  "otureceksin",
  "oturmek",
  "oturme",
  "kaldi",
  "kaldim",
  "kaldin",
  "kaldik",
  "kaldiler",
  "kaliyor",
  "kaliyorum",
  "kaliyorsun",
  "kaliyoruz",
  "kalecek",
  "kaleceğim",
  "kaleceksin",
  "kalmek",
  "kalme"
];
  const TR_TYPO_MAP = {
  "mrb": "merhaba",
  "slm": "selam",
  "tsk": "teşekkürler",
  "tşk": "teşekkürler",
  "tskler": "teşekkürler",
  "kib": "kendine iyi bak",
  "aeo": "allaha emanet ol",
  "tmm": "tamam",
  "tm": "tamam",
  "nbr": "ne haber",
  "nslsn": "nasılsın",
  "cnm": "canım",
  "krdsm": "kardeşim",
  "knk": "kanka",
  "eyw": "eyvallah",
  "grsz": "görüşürüz",
  "grsrk": "görüşmek üzere",
  "naptn": "ne yaptın",
  "napıyon": "ne yapıyorsun",
  "hll": "helal",
  "thx": "teşekkürler",
  "ty": "teşekkürler",
  "merhba": "merhaba",
  "tesekkurler": "teşekkürler",
  "nasilsin": "nasılsın",
  "iyym": "iyiyim",
  "gunaydin": "günaydın",
  "sagol": "sağol",
  "lutfen": "lütfen",
  "hoscakal": "hoşça kal",
  "gorusuruz": "görüşürüz",
  "kardesim": "kardeşim"
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
    "selam",
    "sevdi",
    "sevdim",
    "sevdin",
    "sevdik",
    "sevdiler",
    "seviyor",
    "seviyorum",
    "seviyorsun",
    "seviyoruz",
    "sevecek",
    "seveceğim",
    "seveceksin",
    "sevmek",
    "sevme"
  ],
  "sel": [
    "selam"
  ],
  "sela": [
    "selam"
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
    "iyi"
  ],
  "iyi": [
    "iyiyim",
    "iyi"
  ],
  "iyiy": [
    "iyiyim"
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
    "sağol",
    "sabah"
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
  "gö": [
    "görüşürüz",
    "gördi",
    "gördim",
    "gördin",
    "gördik",
    "gördiler",
    "göriyor",
    "göriyorum",
    "göriyorsun",
    "göriyoruz",
    "görecek",
    "göreceğim",
    "göreceksin",
    "görmek",
    "görme"
  ],
  "gör": [
    "görüşürüz",
    "gördi",
    "gördim",
    "gördin",
    "gördik",
    "gördiler",
    "göriyor",
    "göriyorum",
    "göriyorsun",
    "göriyoruz",
    "görecek",
    "göreceğim",
    "göreceksin",
    "görmek",
    "görme"
  ],
  "görü": [
    "görüşürüz"
  ],
  "ta": [
    "tamam",
    "tabii"
  ],
  "tam": [
    "tamam"
  ],
  "tama": [
    "tamam"
  ],
  "ol": [
    "oldu"
  ],
  "old": [
    "oldu"
  ],
  "oldu": [
    "oldu"
  ],
  "pe": [
    "peki"
  ],
  "pek": [
    "peki"
  ],
  "peki": [
    "peki"
  ],
  "ev": [
    "evet"
  ],
  "eve": [
    "evet"
  ],
  "evet": [
    "evet"
  ],
  "ha": [
    "hayır",
    "harika",
    "hastane"
  ],
  "hay": [
    "hayır"
  ],
  "hayı": [
    "hayır"
  ],
  "yo": [
    "yok",
    "yol"
  ],
  "yok": [
    "yok"
  ],
  "va": [
    "var"
  ],
  "var": [
    "var"
  ],
  "be": [
    "belki"
  ],
  "bel": [
    "belki"
  ],
  "belk": [
    "belki"
  ],
  "ke": [
    "kesinlikle"
  ],
  "kes": [
    "kesinlikle"
  ],
  "kesi": [
    "kesinlikle"
  ],
  "tab": [
    "tabii"
  ],
  "tabi": [
    "tabii"
  ],
  "bi": [
    "bilmiyorum",
    "bildi",
    "bildim",
    "bildin",
    "bildik",
    "bildiler",
    "biliyor",
    "biliyorum",
    "biliyorsun",
    "biliyoruz",
    "bilecek",
    "bileceğim",
    "bileceksin",
    "bilmek",
    "bilme"
  ],
  "bil": [
    "bilmiyorum",
    "bildi",
    "bildim",
    "bildin",
    "bildik",
    "bildiler",
    "biliyor",
    "biliyorum",
    "biliyorsun",
    "biliyoruz",
    "bilecek",
    "bileceğim",
    "bileceksin",
    "bilmek",
    "bilme"
  ],
  "bilm": [
    "bilmiyorum",
    "bilmek",
    "bilme"
  ],
  "an": [
    "anladım",
    "anne"
  ],
  "anl": [
    "anladım"
  ],
  "anla": [
    "anladım"
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
    "eyvallah",
    "eyw"
  ],
  "eyv": [
    "eyvallah"
  ],
  "eyva": [
    "eyvallah"
  ],
  "ka": [
    "kardeşim",
    "kanka",
    "kahve",
    "kaç",
    "kaldi",
    "kaldim",
    "kaldin",
    "kaldik",
    "kaldiler",
    "kaliyor",
    "kaliyorum",
    "kaliyorsun",
    "kaliyoruz",
    "kalecek",
    "kaleceğim"
  ],
  "kar": [
    "kardeşim"
  ],
  "kard": [
    "kardeşim"
  ],
  "do": [
    "dostum"
  ],
  "dos": [
    "dostum"
  ],
  "dost": [
    "dostum"
  ],
  "kan": [
    "kanka"
  ],
  "kank": [
    "kanka"
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
  "ca": [
    "canım"
  ],
  "can": [
    "canım"
  ],
  "canı": [
    "canım"
  ],
  "ann": [
    "anne"
  ],
  "anne": [
    "anne"
  ],
  "ba": [
    "baba",
    "bakdi",
    "bakdim",
    "bakdin",
    "bakdik",
    "bakdiler",
    "bakiyor",
    "bakiyorum",
    "bakiyorsun",
    "bakiyoruz",
    "bakecek",
    "bakeceğim",
    "bakeceksin",
    "bakmek",
    "bakme"
  ],
  "bab": [
    "baba"
  ],
  "baba": [
    "baba"
  ],
  "ço": [
    "çocuk",
    "çok"
  ],
  "çoc": [
    "çocuk"
  ],
  "çocu": [
    "çocuk"
  ],
  "ai": [
    "aile"
  ],
  "ail": [
    "aile"
  ],
  "aile": [
    "aile"
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
  "he": [
    "hemen"
  ],
  "hem": [
    "hemen"
  ],
  "heme": [
    "hemen"
  ],
  "so": [
    "sonra"
  ],
  "son": [
    "sonra"
  ],
  "sonr": [
    "sonra"
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
  "ya": [
    "yarın",
    "yapdi",
    "yapdim",
    "yapdin",
    "yapdik",
    "yapdiler",
    "yapiyor",
    "yapiyorum",
    "yapiyorsun",
    "yapiyoruz",
    "yapecek",
    "yapeceğim",
    "yapeceksin",
    "yapmek",
    "yapme"
  ],
  "yar": [
    "yarın"
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
  "sab": [
    "sabah"
  ],
  "saba": [
    "sabah"
  ],
  "ak": [
    "akşam"
  ],
  "akş": [
    "akşam"
  ],
  "akşa": [
    "akşam"
  ],
  "ge": [
    "gece",
    "geldi",
    "geldim",
    "geldin",
    "geldik",
    "geldiler",
    "geliyor",
    "geliyorum",
    "geliyorsun",
    "geliyoruz",
    "gelecek",
    "geleceğim",
    "geleceksin",
    "gelmek",
    "gelme"
  ],
  "gec": [
    "gece"
  ],
  "gece": [
    "gece"
  ],
  "of": [
    "ofis"
  ],
  "ofi": [
    "ofis"
  ],
  "ofis": [
    "ofis"
  ],
  "ok": [
    "okul",
    "okudi",
    "okudim",
    "okudin",
    "okudik",
    "okudiler",
    "okuiyor",
    "okuiyorum",
    "okuiyorsun",
    "okuiyoruz",
    "okuecek",
    "okueceğim",
    "okueceksin",
    "okumek",
    "okume"
  ],
  "oku": [
    "okul",
    "okudi",
    "okudim",
    "okudin",
    "okudik",
    "okudiler",
    "okuiyor",
    "okuiyorum",
    "okuiyorsun",
    "okuiyoruz",
    "okuecek",
    "okueceğim",
    "okueceksin",
    "okumek",
    "okume"
  ],
  "okul": [
    "okul"
  ],
  "has": [
    "hastane"
  ],
  "hast": [
    "hastane"
  ],
  "şe": [
    "şehir"
  ],
  "şeh": [
    "şehir"
  ],
  "şehi": [
    "şehir"
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
  "fi": [
    "fiyat"
  ],
  "fiy": [
    "fiyat"
  ],
  "fiya": [
    "fiyat"
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
  "yol": [
    "yol"
  ],
  "ye": [
    "yemek",
    "yeni",
    "yedi",
    "yedim",
    "yedin",
    "yedik",
    "yediler",
    "yeiyor",
    "yeiyorum",
    "yeiyorsun",
    "yeiyoruz",
    "yeecek",
    "yeeceğim",
    "yeeceksin",
    "yeme"
  ],
  "yem": [
    "yemek",
    "yeme"
  ],
  "yeme": [
    "yemek",
    "yeme"
  ],
  "ça": [
    "çay",
    "çalışdi",
    "çalışdim",
    "çalışdin",
    "çalışdik",
    "çalışdiler",
    "çalışiyor",
    "çalışiyorum",
    "çalışiyorsun",
    "çalışiyoruz",
    "çalışecek",
    "çalışeceğim",
    "çalışeceksin",
    "çalışmek",
    "çalışme"
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
  "ek": [
    "ekmek"
  ],
  "ekm": [
    "ekmek"
  ],
  "ekme": [
    "ekmek"
  ],
  "ne": [
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
    "kim",
    "kib"
  ],
  "kim": [
    "kim"
  ],
  "kaç": [
    "kaç"
  ],
  "çok": [
    "çok"
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
  "mr": [
    "mrb"
  ],
  "mrb": [
    "mrb"
  ],
  "sl": [
    "slm"
  ],
  "slm": [
    "slm"
  ],
  "ts": [
    "tsk"
  ],
  "tsk": [
    "tsk"
  ],
  "kib": [
    "kib"
  ],
  "ae": [
    "aeo"
  ],
  "aeo": [
    "aeo"
  ],
  "tm": [
    "tmm"
  ],
  "tmm": [
    "tmm"
  ],
  "nb": [
    "nbr"
  ],
  "nbr": [
    "nbr"
  ],
  "ns": [
    "nslsn"
  ],
  "nsl": [
    "nslsn"
  ],
  "nsls": [
    "nslsn"
  ],
  "cn": [
    "cnm"
  ],
  "cnm": [
    "cnm"
  ],
  "kr": [
    "krdsm"
  ],
  "krd": [
    "krdsm"
  ],
  "krds": [
    "krdsm"
  ],
  "kn": [
    "knk"
  ],
  "knk": [
    "knk"
  ],
  "eyw": [
    "eyw"
  ],
  "gel": [
    "geldi",
    "geldim",
    "geldin",
    "geldik",
    "geldiler",
    "geliyor",
    "geliyorum",
    "geliyorsun",
    "geliyoruz",
    "gelecek",
    "geleceğim",
    "geleceksin",
    "gelmek",
    "gelme"
  ],
  "geld": [
    "geldi",
    "geldim",
    "geldin",
    "geldik",
    "geldiler"
  ],
  "geli": [
    "geliyor",
    "geliyorum",
    "geliyorsun",
    "geliyoruz"
  ],
  "gele": [
    "gelecek",
    "geleceğim",
    "geleceksin"
  ],
  "gelm": [
    "gelmek",
    "gelme"
  ],
  "gi": [
    "gitdi",
    "gitdim",
    "gitdin",
    "gitdik",
    "gitdiler",
    "gitiyor",
    "gitiyorum",
    "gitiyorsun",
    "gitiyoruz",
    "gitecek",
    "giteceğim",
    "giteceksin",
    "gitmek",
    "gitme"
  ],
  "git": [
    "gitdi",
    "gitdim",
    "gitdin",
    "gitdik",
    "gitdiler",
    "gitiyor",
    "gitiyorum",
    "gitiyorsun",
    "gitiyoruz",
    "gitecek",
    "giteceğim",
    "giteceksin",
    "gitmek",
    "gitme"
  ],
  "gitd": [
    "gitdi",
    "gitdim",
    "gitdin",
    "gitdik",
    "gitdiler"
  ],
  "giti": [
    "gitiyor",
    "gitiyorum",
    "gitiyorsun",
    "gitiyoruz"
  ],
  "gite": [
    "gitecek",
    "giteceğim",
    "giteceksin"
  ],
  "gitm": [
    "gitmek",
    "gitme"
  ],
  "yap": [
    "yapdi",
    "yapdim",
    "yapdin",
    "yapdik",
    "yapdiler",
    "yapiyor",
    "yapiyorum",
    "yapiyorsun",
    "yapiyoruz",
    "yapecek",
    "yapeceğim",
    "yapeceksin",
    "yapmek",
    "yapme"
  ],
  "yapd": [
    "yapdi",
    "yapdim",
    "yapdin",
    "yapdik",
    "yapdiler"
  ],
  "yapi": [
    "yapiyor",
    "yapiyorum",
    "yapiyorsun",
    "yapiyoruz"
  ],
  "yape": [
    "yapecek",
    "yapeceğim",
    "yapeceksin"
  ],
  "yapm": [
    "yapmek",
    "yapme"
  ],
  "görd": [
    "gördi",
    "gördim",
    "gördin",
    "gördik",
    "gördiler"
  ],
  "göri": [
    "göriyor",
    "göriyorum",
    "göriyorsun",
    "göriyoruz"
  ],
  "göre": [
    "görecek",
    "göreceğim",
    "göreceksin"
  ],
  "görm": [
    "görmek",
    "görme"
  ],
  "bak": [
    "bakdi",
    "bakdim",
    "bakdin",
    "bakdik",
    "bakdiler",
    "bakiyor",
    "bakiyorum",
    "bakiyorsun",
    "bakiyoruz",
    "bakecek",
    "bakeceğim",
    "bakeceksin",
    "bakmek",
    "bakme"
  ],
  "bakd": [
    "bakdi",
    "bakdim",
    "bakdin",
    "bakdik",
    "bakdiler"
  ],
  "baki": [
    "bakiyor",
    "bakiyorum",
    "bakiyorsun",
    "bakiyoruz"
  ],
  "bake": [
    "bakecek",
    "bakeceğim",
    "bakeceksin"
  ],
  "bakm": [
    "bakmek",
    "bakme"
  ],
  "al": [
    "aldi",
    "aldim",
    "aldin",
    "aldik",
    "aldiler",
    "aliyor",
    "aliyorum",
    "aliyorsun",
    "aliyoruz",
    "alecek",
    "aleceğim",
    "aleceksin",
    "almek",
    "alme"
  ],
  "ald": [
    "aldi",
    "aldim",
    "aldin",
    "aldik",
    "aldiler"
  ],
  "aldi": [
    "aldi",
    "aldim",
    "aldin",
    "aldik",
    "aldiler"
  ],
  "ali": [
    "aliyor",
    "aliyorum",
    "aliyorsun",
    "aliyoruz"
  ],
  "aliy": [
    "aliyor",
    "aliyorum",
    "aliyorsun",
    "aliyoruz"
  ],
  "ale": [
    "alecek",
    "aleceğim",
    "aleceksin"
  ],
  "alec": [
    "alecek",
    "aleceğim",
    "aleceksin"
  ],
  "alm": [
    "almek",
    "alme"
  ],
  "alme": [
    "almek",
    "alme"
  ],
  "ve": [
    "verdi",
    "verdim",
    "verdin",
    "verdik",
    "verdiler",
    "veriyor",
    "veriyorum",
    "veriyorsun",
    "veriyoruz",
    "verecek",
    "vereceğim",
    "vereceksin",
    "vermek",
    "verme"
  ],
  "ver": [
    "verdi",
    "verdim",
    "verdin",
    "verdik",
    "verdiler",
    "veriyor",
    "veriyorum",
    "veriyorsun",
    "veriyoruz",
    "verecek",
    "vereceğim",
    "vereceksin",
    "vermek",
    "verme"
  ],
  "verd": [
    "verdi",
    "verdim",
    "verdin",
    "verdik",
    "verdiler"
  ],
  "veri": [
    "veriyor",
    "veriyorum",
    "veriyorsun",
    "veriyoruz"
  ],
  "vere": [
    "verecek",
    "vereceğim",
    "vereceksin"
  ],
  "verm": [
    "vermek",
    "verme"
  ],
  "bild": [
    "bildi",
    "bildim",
    "bildin",
    "bildik",
    "bildiler"
  ],
  "bili": [
    "biliyor",
    "biliyorum",
    "biliyorsun",
    "biliyoruz"
  ],
  "bile": [
    "bilecek",
    "bileceğim",
    "bileceksin"
  ],
  "is": [
    "istedi",
    "istedim",
    "istedin",
    "istedik",
    "istediler",
    "isteiyor",
    "isteiyorum",
    "isteiyorsun",
    "isteiyoruz",
    "isteecek",
    "isteeceğim",
    "isteeceksin",
    "istemek",
    "isteme"
  ],
  "ist": [
    "istedi",
    "istedim",
    "istedin",
    "istedik",
    "istediler",
    "isteiyor",
    "isteiyorum",
    "isteiyorsun",
    "isteiyoruz",
    "isteecek",
    "isteeceğim",
    "isteeceksin",
    "istemek",
    "isteme"
  ],
  "iste": [
    "istedi",
    "istedim",
    "istedin",
    "istedik",
    "istediler",
    "isteiyor",
    "isteiyorum",
    "isteiyorsun",
    "isteiyoruz",
    "isteecek",
    "isteeceğim",
    "isteeceksin",
    "istemek",
    "isteme"
  ],
  "sev": [
    "sevdi",
    "sevdim",
    "sevdin",
    "sevdik",
    "sevdiler",
    "seviyor",
    "seviyorum",
    "seviyorsun",
    "seviyoruz",
    "sevecek",
    "seveceğim",
    "seveceksin",
    "sevmek",
    "sevme"
  ],
  "sevd": [
    "sevdi",
    "sevdim",
    "sevdin",
    "sevdik",
    "sevdiler"
  ],
  "sevi": [
    "seviyor",
    "seviyorum",
    "seviyorsun",
    "seviyoruz"
  ],
  "seve": [
    "sevecek",
    "seveceğim",
    "seveceksin"
  ],
  "sevm": [
    "sevmek",
    "sevme"
  ],
  "du": [
    "duydi",
    "duydim",
    "duydin",
    "duydik",
    "duydiler",
    "duyiyor",
    "duyiyorum",
    "duyiyorsun",
    "duyiyoruz",
    "duyecek",
    "duyeceğim",
    "duyeceksin",
    "duymek",
    "duyme",
    "durdi"
  ],
  "duy": [
    "duydi",
    "duydim",
    "duydin",
    "duydik",
    "duydiler",
    "duyiyor",
    "duyiyorum",
    "duyiyorsun",
    "duyiyoruz",
    "duyecek",
    "duyeceğim",
    "duyeceksin",
    "duymek",
    "duyme"
  ],
  "duyd": [
    "duydi",
    "duydim",
    "duydin",
    "duydik",
    "duydiler"
  ],
  "duyi": [
    "duyiyor",
    "duyiyorum",
    "duyiyorsun",
    "duyiyoruz"
  ],
  "duye": [
    "duyecek",
    "duyeceğim",
    "duyeceksin"
  ],
  "duym": [
    "duymek",
    "duyme"
  ],
  "ko": [
    "konuşdi",
    "konuşdim",
    "konuşdin",
    "konuşdik",
    "konuşdiler",
    "konuşiyor",
    "konuşiyorum",
    "konuşiyorsun",
    "konuşiyoruz",
    "konuşecek",
    "konuşeceğim",
    "konuşeceksin",
    "konuşmek",
    "konuşme"
  ],
  "kon": [
    "konuşdi",
    "konuşdim",
    "konuşdin",
    "konuşdik",
    "konuşdiler",
    "konuşiyor",
    "konuşiyorum",
    "konuşiyorsun",
    "konuşiyoruz",
    "konuşecek",
    "konuşeceğim",
    "konuşeceksin",
    "konuşmek",
    "konuşme"
  ],
  "konu": [
    "konuşdi",
    "konuşdim",
    "konuşdin",
    "konuşdik",
    "konuşdiler",
    "konuşiyor",
    "konuşiyorum",
    "konuşiyorsun",
    "konuşiyoruz",
    "konuşecek",
    "konuşeceğim",
    "konuşeceksin",
    "konuşmek",
    "konuşme"
  ],
  "yaz": [
    "yazdi",
    "yazdim",
    "yazdin",
    "yazdik",
    "yazdiler",
    "yaziyor",
    "yaziyorum",
    "yaziyorsun",
    "yaziyoruz",
    "yazecek",
    "yazeceğim",
    "yazeceksin",
    "yazmek",
    "yazme"
  ],
  "yazd": [
    "yazdi",
    "yazdim",
    "yazdin",
    "yazdik",
    "yazdiler"
  ],
  "yazi": [
    "yaziyor",
    "yaziyorum",
    "yaziyorsun",
    "yaziyoruz"
  ],
  "yaze": [
    "yazecek",
    "yazeceğim",
    "yazeceksin"
  ],
  "yazm": [
    "yazmek",
    "yazme"
  ],
  "okud": [
    "okudi",
    "okudim",
    "okudin",
    "okudik",
    "okudiler"
  ],
  "okui": [
    "okuiyor",
    "okuiyorum",
    "okuiyorsun",
    "okuiyoruz"
  ],
  "okue": [
    "okuecek",
    "okueceğim",
    "okueceksin"
  ],
  "okum": [
    "okumek",
    "okume"
  ],
  "çal": [
    "çalışdi",
    "çalışdim",
    "çalışdin",
    "çalışdik",
    "çalışdiler",
    "çalışiyor",
    "çalışiyorum",
    "çalışiyorsun",
    "çalışiyoruz",
    "çalışecek",
    "çalışeceğim",
    "çalışeceksin",
    "çalışmek",
    "çalışme"
  ],
  "çalı": [
    "çalışdi",
    "çalışdim",
    "çalışdin",
    "çalışdik",
    "çalışdiler",
    "çalışiyor",
    "çalışiyorum",
    "çalışiyorsun",
    "çalışiyoruz",
    "çalışecek",
    "çalışeceğim",
    "çalışeceksin",
    "çalışmek",
    "çalışme"
  ],
  "yed": [
    "yedi",
    "yedim",
    "yedin",
    "yedik",
    "yediler"
  ],
  "yedi": [
    "yedi",
    "yedim",
    "yedin",
    "yedik",
    "yediler"
  ],
  "yei": [
    "yeiyor",
    "yeiyorum",
    "yeiyorsun",
    "yeiyoruz"
  ],
  "yeiy": [
    "yeiyor",
    "yeiyorum",
    "yeiyorsun",
    "yeiyoruz"
  ],
  "yee": [
    "yeecek",
    "yeeceğim",
    "yeeceksin"
  ],
  "yeec": [
    "yeecek",
    "yeeceğim",
    "yeeceksin"
  ],
  "iç": [
    "içdi",
    "içdim",
    "içdin",
    "içdik",
    "içdiler",
    "içiyor",
    "içiyorum",
    "içiyorsun",
    "içiyoruz",
    "içecek",
    "içeceğim",
    "içeceksin",
    "içmek",
    "içme"
  ],
  "içd": [
    "içdi",
    "içdim",
    "içdin",
    "içdik",
    "içdiler"
  ],
  "içdi": [
    "içdi",
    "içdim",
    "içdin",
    "içdik",
    "içdiler"
  ],
  "içi": [
    "içiyor",
    "içiyorum",
    "içiyorsun",
    "içiyoruz"
  ],
  "içiy": [
    "içiyor",
    "içiyorum",
    "içiyorsun",
    "içiyoruz"
  ],
  "içe": [
    "içecek",
    "içeceğim",
    "içeceksin"
  ],
  "içec": [
    "içecek",
    "içeceğim",
    "içeceksin"
  ],
  "içm": [
    "içmek",
    "içme"
  ],
  "içme": [
    "içmek",
    "içme"
  ],
  "dur": [
    "durdi",
    "durdim",
    "durdin",
    "durdik",
    "durdiler",
    "duriyor",
    "duriyorum",
    "duriyorsun",
    "duriyoruz",
    "durecek",
    "dureceğim",
    "dureceksin",
    "durmek",
    "durme"
  ],
  "durd": [
    "durdi",
    "durdim",
    "durdin",
    "durdik",
    "durdiler"
  ],
  "duri": [
    "duriyor",
    "duriyorum",
    "duriyorsun",
    "duriyoruz"
  ],
  "dure": [
    "durecek",
    "dureceğim",
    "dureceksin"
  ],
  "durm": [
    "durmek",
    "durme"
  ],
  "ot": [
    "oturdi",
    "oturdim",
    "oturdin",
    "oturdik",
    "oturdiler",
    "oturiyor",
    "oturiyorum",
    "oturiyorsun",
    "oturiyoruz",
    "oturecek",
    "otureceğim",
    "otureceksin",
    "oturmek",
    "oturme"
  ],
  "otu": [
    "oturdi",
    "oturdim",
    "oturdin",
    "oturdik",
    "oturdiler",
    "oturiyor",
    "oturiyorum",
    "oturiyorsun",
    "oturiyoruz",
    "oturecek",
    "otureceğim",
    "otureceksin",
    "oturmek",
    "oturme"
  ],
  "otur": [
    "oturdi",
    "oturdim",
    "oturdin",
    "oturdik",
    "oturdiler",
    "oturiyor",
    "oturiyorum",
    "oturiyorsun",
    "oturiyoruz",
    "oturecek",
    "otureceğim",
    "otureceksin",
    "oturmek",
    "oturme"
  ],
  "kal": [
    "kaldi",
    "kaldim",
    "kaldin",
    "kaldik",
    "kaldiler",
    "kaliyor",
    "kaliyorum",
    "kaliyorsun",
    "kaliyoruz",
    "kalecek",
    "kaleceğim",
    "kaleceksin",
    "kalmek",
    "kalme"
  ],
  "kald": [
    "kaldi",
    "kaldim",
    "kaldin",
    "kaldik",
    "kaldiler"
  ],
  "kali": [
    "kaliyor",
    "kaliyorum",
    "kaliyorsun",
    "kaliyoruz"
  ],
  "kale": [
    "kalecek",
    "kaleceğim",
    "kaleceksin"
  ],
  "kalm": [
    "kalmek",
    "kalme"
  ]
};
  const TR_WORD_SET = new Set(TR_WORDS);

  class TurkishSubDirectory {
    constructor() {
      this.name = 'Turkish (Türkçe)';
      this.code = 'tr';
      this.badge = 'Türkçe';
      this.icon = 'fa-star-and-crescent';
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
      const tokens = lower.split(/\s+|[.,!?;:()]+/);
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i].trim();
        if (this.typoMap[t]) return true;
      }
      return /\b(merhaba|selam|teşekkürler|nasılsın|günaydın|görüşürüz|kolay gelsin|kardeşim|eyvallah|inşallah|sağol|tamam|güzel)\b/i.test(lower);
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
