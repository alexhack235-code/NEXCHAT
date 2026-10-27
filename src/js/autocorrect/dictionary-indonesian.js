/**
 * NEXCHAT Multilingual Sub-Directory: Bahasa Indonesia & Jakarta Slang (Deepened)
 * High-Speed O(1) Prefix-Indexed Radix Engine
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const ID_WORDS = [
  "halo",
  "hai",
  "selamat",
  "pagi",
  "siang",
  "sore",
  "malam",
  "tidur",
  "jalan",
  "datang",
  "tinggal",
  "terima",
  "kasih",
  "terimakasih",
  "makasih",
  "sama-sama",
  "kembali",
  "maaf",
  "permisi",
  "tolong",
  "mohon",
  "silakan",
  "mari",
  "sampai",
  "jumpa",
  "nanti",
  "sehat",
  "kabar",
  "baik",
  "apa",
  "siapa",
  "mana",
  "dimana",
  "kemana",
  "darimana",
  "kapan",
  "kenapa",
  "mengapa",
  "bagaimana",
  "gimana",
  "berapa",
  "yang",
  "saya",
  "aku",
  "gue",
  "gua",
  "kamu",
  "kau",
  "dia",
  "beliau",
  "kita",
  "kami",
  "kalian",
  "mereka",
  "anda",
  "ada",
  "bisa",
  "dapat",
  "boleh",
  "harus",
  "wajib",
  "mesti",
  "pasti",
  "tentu",
  "mau",
  "ingin",
  "suka",
  "cinta",
  "sayang",
  "tahu",
  "mengerti",
  "paham",
  "kenal",
  "ingat",
  "lupa",
  "makan",
  "minum",
  "bangun",
  "mandi",
  "kerja",
  "belajar",
  "baca",
  "tulis",
  "lihat",
  "dengar",
  "bicara",
  "ngobrol",
  "kirim",
  "beli",
  "jual",
  "bayar",
  "ambil",
  "bawa",
  "taruh",
  "buka",
  "tutup",
  "masuk",
  "keluar",
  "pergi",
  "pulang",
  "lari",
  "duduk",
  "berdiri",
  "tunggu",
  "cari",
  "temu",
  "bantu",
  "pikir",
  "rasa",
  "harap",
  "baper",
  "kepo",
  "gabut",
  "mager",
  "nongkrong",
  "nongki",
  "mantap",
  "mantul",
  "gercep",
  "santuy",
  "santai",
  "bucin",
  "pansos",
  "wkwk",
  "wkwkwk",
  "anjir",
  "anjay",
  "gokil",
  "garing",
  "lebay",
  "alay",
  "rempong",
  "curhat",
  "peka",
  "kuy",
  "gas",
  "gaskeun",
  "otw",
  "sabi",
  "sip",
  "sekarang",
  "kemarin",
  "besok",
  "lusa",
  "hari",
  "minggu",
  "bulan",
  "tahun",
  "jam",
  "menit",
  "detik",
  "senin",
  "selasa",
  "rabu",
  "kamis",
  "jumat",
  "sabtu",
  "ahad",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "seratus",
  "seribu",
  "rumah",
  "kantor",
  "sekolah",
  "kampus",
  "toko",
  "pasar",
  "kamar",
  "dapur",
  "restoran",
  "kafe",
  "stasiun",
  "bandara",
  "mobil",
  "motor",
  "sepeda",
  "bus",
  "kereta",
  "pesawat",
  "uang",
  "nasi",
  "goreng",
  "ayam",
  "sapi",
  "ikan",
  "telur",
  "sambal",
  "bakso",
  "mie",
  "soto",
  "rendang",
  "sate",
  "sayur",
  "buah",
  "kopi",
  "teh",
  "susu",
  "air",
  "manis",
  "pedas",
  "enak",
  "bagus",
  "cantik",
  "ganteng",
  "jelek",
  "bersih",
  "kotor",
  "besar",
  "kecil",
  "tinggi",
  "pendek",
  "panjang",
  "jauh",
  "dekat",
  "cepat",
  "lambat",
  "mudah",
  "sulit",
  "senang",
  "bahagia",
  "sedih",
  "marah",
  "takut",
  "bosan",
  "capek",
  "lelah",
  "benar",
  "salah",
  "melihat",
  "berlihat",
  "dilihat",
  "terlihat",
  "pelihat",
  "lihatan",
  "lihatkan",
  "lihati",
  "medengar",
  "berdengar",
  "didengar",
  "terdengar",
  "pedengar",
  "dengaran",
  "dengarkan",
  "dengari",
  "mebaca",
  "berbaca",
  "dibaca",
  "terbaca",
  "pebaca",
  "bacaan",
  "bacakan",
  "bacai",
  "metulis",
  "bertulis",
  "ditulis",
  "tertulis",
  "petulis",
  "tulisan",
  "tuliskan",
  "tulisi",
  "memakan",
  "bermakan",
  "dimakan",
  "termakan",
  "pemakan",
  "makanan",
  "makankan",
  "makani",
  "meminum",
  "berminum",
  "diminum",
  "terminum",
  "peminum",
  "minuman",
  "minumkan",
  "minumi",
  "mebeli",
  "berbeli",
  "dibeli",
  "terbeli",
  "pebeli",
  "belian",
  "belikan",
  "belii",
  "mejual",
  "berjual",
  "dijual",
  "terjual",
  "pejual",
  "jualan",
  "jualkan",
  "juali",
  "mebayar",
  "berbayar",
  "dibayar",
  "terbayar",
  "pebayar",
  "bayaran",
  "bayarkan",
  "bayari",
  "mebantu",
  "berbantu",
  "dibantu",
  "terbantu",
  "pebantu",
  "bantuan",
  "bantukan",
  "bantui",
  "mebuka",
  "berbuka",
  "dibuka",
  "terbuka",
  "pebuka",
  "bukaan",
  "bukakan",
  "bukai",
  "metutup",
  "bertutup",
  "ditutup",
  "tertutup",
  "petutup",
  "tutupan",
  "tutupkan",
  "tutupi",
  "metunggu",
  "bertunggu",
  "ditunggu",
  "tertunggu",
  "petunggu",
  "tungguan",
  "tunggukan",
  "tunggui",
  "mecari",
  "bercari",
  "dicari",
  "tercari",
  "pecari",
  "carian",
  "carikan",
  "carii",
  "mepikir",
  "berpikir",
  "dipikir",
  "terpikir",
  "pepikir",
  "pikiran",
  "pikirkan",
  "pikiri",
  "merasa",
  "berrasa",
  "dirasa",
  "terrasa",
  "perasa",
  "rasaan",
  "rasakan",
  "rasai",
  "mebuat",
  "berbuat",
  "dibuat",
  "terbuat",
  "pebuat",
  "buatan",
  "buatkan",
  "buati",
  "mepakai",
  "berpakai",
  "dipakai",
  "terpakai",
  "pepakai",
  "pakaian",
  "pakaikan",
  "pakaii",
  "mekirim",
  "berkirim",
  "dikirim",
  "terkirim",
  "pekirim",
  "kiriman",
  "kirimkan",
  "kirimi",
  "meterima",
  "berterima",
  "diterima",
  "terterima",
  "peterima",
  "terimaan",
  "terimakan",
  "terimai"
];
  const ID_TYPO_MAP = {
  "yg": "yang",
  "dgn": "dengan",
  "utk": "untuk",
  "sy": "saya",
  "km": "kamu",
  "aq": "aku",
  "lo": "kamu",
  "lu": "kamu",
  "gw": "saya",
  "gue": "saya",
  "blm": "belum",
  "udh": "sudah",
  "sdh": "sudah",
  "bs": "bisa",
  "bisaa": "bisa",
  "gpp": "tidak apa-apa",
  "gapapa": "tidak apa-apa",
  "gk": "tidak",
  "gak": "tidak",
  "nggak": "tidak",
  "ngak": "tidak",
  "tdk": "tidak",
  "bgt": "banget",
  "bgtu": "begitu",
  "gitu": "begitu",
  "gmn": "gimana",
  "knp": "kenapa",
  "dmn": "dimana",
  "kmn": "kemana",
  "bsk": "besok",
  "kmrn": "kemarin",
  "skrg": "sekarang",
  "ntr": "nanti",
  "lg": "lagi",
  "emg": "memang",
  "emng": "memang",
  "ttp": "tetap",
  "sm": "sama",
  "tmn": "teman",
  "org": "orang",
  "jg": "juga",
  "tp": "tapi",
  "krn": "karena",
  "mks": "makasih",
  "thx": "terima kasih",
  "ty": "terima kasih",
  "pls": "tolong",
  "plz": "tolong",
  "otw": "dalam perjalanan",
  "kuy": "ayo",
  "yok": "ayo",
  "gas": "ayo jalan",
  "terimaksih": "terima kasih",
  "selmat": "selamat",
  "sampe": "sampai",
  "apkah": "apakah",
  "kenpa": "kenapa",
  "bgus": "bagus",
  "cntik": "cantik",
  "rumh": "rumah",
  "kntor": "kantor",
  "sekolh": "sekolah",
  "mkn": "makan",
  "minm": "minum",
  "tidr": "tidur",
  "krja": "kerja",
  "bljr": "belajar"
};
  const ID_PREFIX_TABLE = {
  "ha": [
    "halo",
    "hai",
    "harus",
    "harap",
    "hari"
  ],
  "hal": [
    "halo"
  ],
  "halo": [
    "halo"
  ],
  "hai": [
    "hai"
  ],
  "se": [
    "selamat",
    "sehat",
    "sekarang",
    "senin",
    "selasa",
    "sembilan",
    "sepuluh",
    "seratus",
    "seribu",
    "sekolah",
    "sepeda",
    "senang",
    "sedih"
  ],
  "sel": [
    "selamat",
    "selasa"
  ],
  "sela": [
    "selamat",
    "selasa"
  ],
  "pa": [
    "pagi",
    "pasti",
    "paham",
    "pansos",
    "pasar",
    "panjang",
    "pakaian",
    "pakaikan",
    "pakaii"
  ],
  "pag": [
    "pagi"
  ],
  "pagi": [
    "pagi"
  ],
  "si": [
    "siang",
    "silakan",
    "siapa",
    "sip"
  ],
  "sia": [
    "siang",
    "siapa"
  ],
  "sian": [
    "siang"
  ],
  "so": [
    "sore",
    "soto"
  ],
  "sor": [
    "sore"
  ],
  "sore": [
    "sore"
  ],
  "ma": [
    "malam",
    "makasih",
    "maaf",
    "mari",
    "mana",
    "mau",
    "makan",
    "mandi",
    "masuk",
    "mager",
    "mantap",
    "mantul",
    "manis",
    "marah",
    "makanan"
  ],
  "mal": [
    "malam"
  ],
  "mala": [
    "malam"
  ],
  "ti": [
    "tidur",
    "tinggal",
    "tiga",
    "tinggi"
  ],
  "tid": [
    "tidur"
  ],
  "tidu": [
    "tidur"
  ],
  "ja": [
    "jalan",
    "jam",
    "jauh"
  ],
  "jal": [
    "jalan"
  ],
  "jala": [
    "jalan"
  ],
  "da": [
    "datang",
    "darimana",
    "dapat",
    "dapur"
  ],
  "dat": [
    "datang"
  ],
  "data": [
    "datang"
  ],
  "tin": [
    "tinggal",
    "tinggi"
  ],
  "ting": [
    "tinggal",
    "tinggi"
  ],
  "te": [
    "terima",
    "terimakasih",
    "tentu",
    "temu",
    "telur",
    "teh",
    "terlihat",
    "terdengar",
    "terbaca",
    "tertulis",
    "termakan",
    "terminum",
    "terbeli",
    "terjual",
    "terbayar"
  ],
  "ter": [
    "terima",
    "terimakasih",
    "terlihat",
    "terdengar",
    "terbaca",
    "tertulis",
    "termakan",
    "terminum",
    "terbeli",
    "terjual",
    "terbayar",
    "terbantu",
    "terbuka",
    "tertutup",
    "tertunggu"
  ],
  "teri": [
    "terima",
    "terimakasih",
    "terimaan",
    "terimakan",
    "terimai"
  ],
  "ka": [
    "kasih",
    "kabar",
    "kapan",
    "kamu",
    "kau",
    "kami",
    "kalian",
    "kamis",
    "kantor",
    "kampus",
    "kamar",
    "kafe"
  ],
  "kas": [
    "kasih"
  ],
  "kasi": [
    "kasih"
  ],
  "mak": [
    "makasih",
    "makan",
    "makanan",
    "makankan",
    "makani"
  ],
  "maka": [
    "makasih",
    "makan",
    "makanan",
    "makankan",
    "makani"
  ],
  "sa": [
    "sama-sama",
    "sampai",
    "saya",
    "sayang",
    "santuy",
    "santai",
    "sabi",
    "sabtu",
    "satu",
    "sapi",
    "sambal",
    "sate",
    "sayur",
    "salah"
  ],
  "sam": [
    "sama-sama",
    "sampai",
    "sambal"
  ],
  "sama": [
    "sama-sama"
  ],
  "ke": [
    "kembali",
    "kemana",
    "kenapa",
    "kenal",
    "kerja",
    "keluar",
    "kepo",
    "kemarin",
    "kereta",
    "kecil"
  ],
  "kem": [
    "kembali",
    "kemana",
    "kemarin"
  ],
  "kemb": [
    "kembali"
  ],
  "maa": [
    "maaf"
  ],
  "maaf": [
    "maaf"
  ],
  "pe": [
    "permisi",
    "pergi",
    "peka",
    "pesawat",
    "pedas",
    "pendek",
    "pelihat",
    "pedengar",
    "pebaca",
    "petulis",
    "pemakan",
    "peminum",
    "pebeli",
    "pejual",
    "pebayar"
  ],
  "per": [
    "permisi",
    "pergi",
    "perasa"
  ],
  "perm": [
    "permisi"
  ],
  "to": [
    "tolong",
    "toko"
  ],
  "tol": [
    "tolong"
  ],
  "tolo": [
    "tolong"
  ],
  "mo": [
    "mohon",
    "mobil",
    "motor"
  ],
  "moh": [
    "mohon"
  ],
  "moho": [
    "mohon"
  ],
  "sil": [
    "silakan"
  ],
  "sila": [
    "silakan"
  ],
  "mar": [
    "mari",
    "marah"
  ],
  "mari": [
    "mari"
  ],
  "samp": [
    "sampai"
  ],
  "ju": [
    "jumpa",
    "jual",
    "jumat",
    "jualan",
    "jualkan",
    "juali"
  ],
  "jum": [
    "jumpa",
    "jumat"
  ],
  "jump": [
    "jumpa"
  ],
  "na": [
    "nanti",
    "nasi"
  ],
  "nan": [
    "nanti"
  ],
  "nant": [
    "nanti"
  ],
  "seh": [
    "sehat"
  ],
  "seha": [
    "sehat"
  ],
  "kab": [
    "kabar"
  ],
  "kaba": [
    "kabar"
  ],
  "ba": [
    "baik",
    "bagaimana",
    "bangun",
    "baca",
    "bayar",
    "bawa",
    "bantu",
    "baper",
    "bandara",
    "bakso",
    "bagus",
    "bahagia",
    "bacaan",
    "bacakan",
    "bacai"
  ],
  "bai": [
    "baik"
  ],
  "baik": [
    "baik"
  ],
  "ap": [
    "apa"
  ],
  "apa": [
    "apa"
  ],
  "siap": [
    "siapa"
  ],
  "man": [
    "mana",
    "mandi",
    "mantap",
    "mantul",
    "manis"
  ],
  "mana": [
    "mana"
  ],
  "di": [
    "dimana",
    "dia",
    "dilihat",
    "didengar",
    "dibaca",
    "ditulis",
    "dimakan",
    "diminum",
    "dibeli",
    "dijual",
    "dibayar",
    "dibantu",
    "dibuka",
    "ditutup",
    "ditunggu"
  ],
  "dim": [
    "dimana",
    "dimakan",
    "diminum"
  ],
  "dima": [
    "dimana",
    "dimakan"
  ],
  "kema": [
    "kemana",
    "kemarin"
  ],
  "dar": [
    "darimana"
  ],
  "dari": [
    "darimana"
  ],
  "kap": [
    "kapan"
  ],
  "kapa": [
    "kapan"
  ],
  "ken": [
    "kenapa",
    "kenal"
  ],
  "kena": [
    "kenapa",
    "kenal"
  ],
  "me": [
    "mengapa",
    "mereka",
    "mesti",
    "mengerti",
    "menit",
    "melihat",
    "medengar",
    "mebaca",
    "metulis",
    "memakan",
    "meminum",
    "mebeli",
    "mejual",
    "mebayar",
    "mebantu"
  ],
  "men": [
    "mengapa",
    "mengerti",
    "menit"
  ],
  "meng": [
    "mengapa",
    "mengerti"
  ],
  "bag": [
    "bagaimana",
    "bagus"
  ],
  "baga": [
    "bagaimana"
  ],
  "gi": [
    "gimana"
  ],
  "gim": [
    "gimana"
  ],
  "gima": [
    "gimana"
  ],
  "be": [
    "berapa",
    "beliau",
    "belajar",
    "beli",
    "berdiri",
    "besok",
    "bersih",
    "besar",
    "benar",
    "berlihat",
    "berdengar",
    "berbaca",
    "bertulis",
    "bermakan",
    "berminum"
  ],
  "ber": [
    "berapa",
    "berdiri",
    "bersih",
    "berlihat",
    "berdengar",
    "berbaca",
    "bertulis",
    "bermakan",
    "berminum",
    "berbeli",
    "berjual",
    "berbayar",
    "berbantu",
    "berbuka",
    "bertutup"
  ],
  "bera": [
    "berapa"
  ],
  "ya": [
    "yang"
  ],
  "yan": [
    "yang"
  ],
  "yang": [
    "yang"
  ],
  "say": [
    "saya",
    "sayang",
    "sayur"
  ],
  "saya": [
    "saya",
    "sayang"
  ],
  "ak": [
    "aku"
  ],
  "aku": [
    "aku"
  ],
  "gu": [
    "gue",
    "gua"
  ],
  "gue": [
    "gue"
  ],
  "gua": [
    "gua"
  ],
  "kam": [
    "kamu",
    "kami",
    "kamis",
    "kampus",
    "kamar"
  ],
  "kamu": [
    "kamu"
  ],
  "kau": [
    "kau"
  ],
  "dia": [
    "dia"
  ],
  "bel": [
    "beliau",
    "belajar",
    "beli",
    "belian",
    "belikan",
    "belii"
  ],
  "beli": [
    "beliau",
    "beli",
    "belian",
    "belikan",
    "belii"
  ],
  "ki": [
    "kita",
    "kirim",
    "kiriman",
    "kirimkan",
    "kirimi"
  ],
  "kit": [
    "kita"
  ],
  "kita": [
    "kita"
  ],
  "kami": [
    "kami",
    "kamis"
  ],
  "kal": [
    "kalian"
  ],
  "kali": [
    "kalian"
  ],
  "mer": [
    "mereka",
    "merasa"
  ],
  "mere": [
    "mereka"
  ],
  "an": [
    "anda",
    "anjir",
    "anjay"
  ],
  "and": [
    "anda"
  ],
  "anda": [
    "anda"
  ],
  "ad": [
    "ada"
  ],
  "ada": [
    "ada"
  ],
  "bi": [
    "bisa",
    "bicara"
  ],
  "bis": [
    "bisa"
  ],
  "bisa": [
    "bisa"
  ],
  "dap": [
    "dapat",
    "dapur"
  ],
  "dapa": [
    "dapat"
  ],
  "bo": [
    "boleh",
    "bosan"
  ],
  "bol": [
    "boleh"
  ],
  "bole": [
    "boleh"
  ],
  "har": [
    "harus",
    "harap",
    "hari"
  ],
  "haru": [
    "harus"
  ],
  "wa": [
    "wajib"
  ],
  "waj": [
    "wajib"
  ],
  "waji": [
    "wajib"
  ],
  "mes": [
    "mesti"
  ],
  "mest": [
    "mesti"
  ],
  "pas": [
    "pasti",
    "pasar"
  ],
  "past": [
    "pasti"
  ],
  "ten": [
    "tentu"
  ],
  "tent": [
    "tentu"
  ],
  "mau": [
    "mau"
  ],
  "in": [
    "ingin",
    "ingat"
  ],
  "ing": [
    "ingin",
    "ingat"
  ],
  "ingi": [
    "ingin"
  ],
  "su": [
    "suka",
    "susu",
    "sulit"
  ],
  "suk": [
    "suka"
  ],
  "suka": [
    "suka"
  ],
  "ci": [
    "cinta"
  ],
  "cin": [
    "cinta"
  ],
  "cint": [
    "cinta"
  ],
  "ta": [
    "tahu",
    "taruh",
    "tahun",
    "takut"
  ],
  "tah": [
    "tahu",
    "tahun"
  ],
  "tahu": [
    "tahu",
    "tahun"
  ],
  "pah": [
    "paham"
  ],
  "paha": [
    "paham"
  ],
  "inga": [
    "ingat"
  ],
  "lu": [
    "lupa",
    "lusa"
  ],
  "lup": [
    "lupa"
  ],
  "lupa": [
    "lupa"
  ],
  "mi": [
    "minum",
    "minggu",
    "mie",
    "minuman",
    "minumkan",
    "minumi"
  ],
  "min": [
    "minum",
    "minggu",
    "minuman",
    "minumkan",
    "minumi"
  ],
  "minu": [
    "minum",
    "minuman",
    "minumkan",
    "minumi"
  ],
  "ban": [
    "bangun",
    "bantu",
    "bandara",
    "bantuan",
    "bantukan",
    "bantui"
  ],
  "bang": [
    "bangun"
  ],
  "mand": [
    "mandi"
  ],
  "ker": [
    "kerja",
    "kereta"
  ],
  "kerj": [
    "kerja"
  ],
  "bela": [
    "belajar"
  ],
  "bac": [
    "baca",
    "bacaan",
    "bacakan",
    "bacai"
  ],
  "baca": [
    "baca",
    "bacaan",
    "bacakan",
    "bacai"
  ],
  "tu": [
    "tulis",
    "tutup",
    "tunggu",
    "tujuh",
    "tulisan",
    "tuliskan",
    "tulisi",
    "tutupan",
    "tutupkan",
    "tutupi",
    "tungguan",
    "tunggukan",
    "tunggui"
  ],
  "tul": [
    "tulis",
    "tulisan",
    "tuliskan",
    "tulisi"
  ],
  "tuli": [
    "tulis",
    "tulisan",
    "tuliskan",
    "tulisi"
  ],
  "li": [
    "lihat",
    "lima",
    "lihatan",
    "lihatkan",
    "lihati"
  ],
  "lih": [
    "lihat",
    "lihatan",
    "lihatkan",
    "lihati"
  ],
  "liha": [
    "lihat",
    "lihatan",
    "lihatkan",
    "lihati"
  ],
  "de": [
    "dengar",
    "detik",
    "delapan",
    "dekat",
    "dengaran",
    "dengarkan",
    "dengari"
  ],
  "den": [
    "dengar",
    "dengaran",
    "dengarkan",
    "dengari"
  ],
  "deng": [
    "dengar",
    "dengaran",
    "dengarkan",
    "dengari"
  ],
  "bic": [
    "bicara"
  ],
  "bica": [
    "bicara"
  ],
  "ng": [
    "ngobrol"
  ],
  "ngo": [
    "ngobrol"
  ],
  "ngob": [
    "ngobrol"
  ],
  "kir": [
    "kirim",
    "kiriman",
    "kirimkan",
    "kirimi"
  ],
  "kiri": [
    "kirim",
    "kiriman",
    "kirimkan",
    "kirimi"
  ],
  "jua": [
    "jual",
    "jualan",
    "jualkan",
    "juali"
  ],
  "jual": [
    "jual",
    "jualan",
    "jualkan",
    "juali"
  ],
  "bay": [
    "bayar",
    "bayaran",
    "bayarkan",
    "bayari"
  ],
  "baya": [
    "bayar",
    "bayaran",
    "bayarkan",
    "bayari"
  ],
  "am": [
    "ambil"
  ],
  "amb": [
    "ambil"
  ],
  "ambi": [
    "ambil"
  ],
  "baw": [
    "bawa"
  ],
  "bawa": [
    "bawa"
  ],
  "tar": [
    "taruh"
  ],
  "taru": [
    "taruh"
  ],
  "bu": [
    "buka",
    "bucin",
    "bulan",
    "bus",
    "buah",
    "bukaan",
    "bukakan",
    "bukai",
    "buatan",
    "buatkan",
    "buati"
  ],
  "buk": [
    "buka",
    "bukaan",
    "bukakan",
    "bukai"
  ],
  "buka": [
    "buka",
    "bukaan",
    "bukakan",
    "bukai"
  ],
  "tut": [
    "tutup",
    "tutupan",
    "tutupkan",
    "tutupi"
  ],
  "tutu": [
    "tutup",
    "tutupan",
    "tutupkan",
    "tutupi"
  ],
  "mas": [
    "masuk"
  ],
  "masu": [
    "masuk"
  ],
  "kel": [
    "keluar"
  ],
  "kelu": [
    "keluar"
  ],
  "perg": [
    "pergi"
  ],
  "pu": [
    "pulang"
  ],
  "pul": [
    "pulang"
  ],
  "pula": [
    "pulang"
  ],
  "la": [
    "lari",
    "lambat"
  ],
  "lar": [
    "lari"
  ],
  "lari": [
    "lari"
  ],
  "du": [
    "duduk",
    "dua"
  ],
  "dud": [
    "duduk"
  ],
  "dudu": [
    "duduk"
  ],
  "berd": [
    "berdiri",
    "berdengar"
  ],
  "tun": [
    "tunggu",
    "tungguan",
    "tunggukan",
    "tunggui"
  ],
  "tung": [
    "tunggu",
    "tungguan",
    "tunggukan",
    "tunggui"
  ],
  "ca": [
    "cari",
    "cantik",
    "capek",
    "carian",
    "carikan",
    "carii"
  ],
  "car": [
    "cari",
    "carian",
    "carikan",
    "carii"
  ],
  "cari": [
    "cari",
    "carian",
    "carikan",
    "carii"
  ],
  "tem": [
    "temu"
  ],
  "temu": [
    "temu"
  ],
  "bant": [
    "bantu",
    "bantuan",
    "bantukan",
    "bantui"
  ],
  "pi": [
    "pikir",
    "pikiran",
    "pikirkan",
    "pikiri"
  ],
  "pik": [
    "pikir",
    "pikiran",
    "pikirkan",
    "pikiri"
  ],
  "piki": [
    "pikir",
    "pikiran",
    "pikirkan",
    "pikiri"
  ],
  "ra": [
    "rasa",
    "rabu",
    "rasaan",
    "rasakan",
    "rasai"
  ],
  "ras": [
    "rasa",
    "rasaan",
    "rasakan",
    "rasai"
  ],
  "rasa": [
    "rasa",
    "rasaan",
    "rasakan",
    "rasai"
  ],
  "hara": [
    "harap"
  ],
  "bap": [
    "baper"
  ],
  "bape": [
    "baper"
  ],
  "kep": [
    "kepo"
  ],
  "kepo": [
    "kepo"
  ],
  "ga": [
    "gabut",
    "garing",
    "gas",
    "gaskeun",
    "ganteng"
  ],
  "gab": [
    "gabut"
  ],
  "gabu": [
    "gabut"
  ],
  "mag": [
    "mager"
  ],
  "mage": [
    "mager"
  ],
  "no": [
    "nongkrong",
    "nongki"
  ],
  "non": [
    "nongkrong",
    "nongki"
  ],
  "nong": [
    "nongkrong",
    "nongki"
  ],
  "mant": [
    "mantap",
    "mantul"
  ],
  "ge": [
    "gercep"
  ],
  "ger": [
    "gercep"
  ],
  "gerc": [
    "gercep"
  ],
  "san": [
    "santuy",
    "santai"
  ],
  "sant": [
    "santuy",
    "santai"
  ],
  "buc": [
    "bucin"
  ],
  "buci": [
    "bucin"
  ],
  "pan": [
    "pansos",
    "panjang"
  ],
  "pans": [
    "pansos"
  ],
  "wk": [
    "wkwk",
    "wkwkwk"
  ],
  "wkw": [
    "wkwk",
    "wkwkwk"
  ],
  "wkwk": [
    "wkwk",
    "wkwkwk"
  ],
  "anj": [
    "anjir",
    "anjay"
  ],
  "anji": [
    "anjir"
  ],
  "anja": [
    "anjay"
  ],
  "go": [
    "gokil",
    "goreng"
  ],
  "gok": [
    "gokil"
  ],
  "goki": [
    "gokil"
  ],
  "gar": [
    "garing"
  ],
  "gari": [
    "garing"
  ],
  "le": [
    "lebay",
    "lelah"
  ],
  "leb": [
    "lebay"
  ],
  "leba": [
    "lebay"
  ],
  "al": [
    "alay"
  ],
  "ala": [
    "alay"
  ],
  "alay": [
    "alay"
  ],
  "re": [
    "rempong",
    "restoran",
    "rendang"
  ],
  "rem": [
    "rempong"
  ],
  "remp": [
    "rempong"
  ],
  "cu": [
    "curhat"
  ],
  "cur": [
    "curhat"
  ],
  "curh": [
    "curhat"
  ],
  "pek": [
    "peka",
    "pekirim"
  ],
  "peka": [
    "peka"
  ],
  "ku": [
    "kuy"
  ],
  "kuy": [
    "kuy"
  ],
  "gas": [
    "gas",
    "gaskeun"
  ],
  "gask": [
    "gaskeun"
  ],
  "ot": [
    "otw"
  ],
  "otw": [
    "otw"
  ],
  "sab": [
    "sabi",
    "sabtu"
  ],
  "sabi": [
    "sabi"
  ],
  "sip": [
    "sip"
  ],
  "sek": [
    "sekarang",
    "sekolah"
  ],
  "seka": [
    "sekarang"
  ],
  "bes": [
    "besok",
    "besar"
  ],
  "beso": [
    "besok"
  ],
  "lus": [
    "lusa"
  ],
  "lusa": [
    "lusa"
  ],
  "hari": [
    "hari"
  ],
  "ming": [
    "minggu"
  ],
  "bul": [
    "bulan"
  ],
  "bula": [
    "bulan"
  ],
  "jam": [
    "jam"
  ],
  "meni": [
    "menit"
  ],
  "det": [
    "detik"
  ],
  "deti": [
    "detik"
  ],
  "sen": [
    "senin",
    "senang"
  ],
  "seni": [
    "senin"
  ],
  "rab": [
    "rabu"
  ],
  "rabu": [
    "rabu"
  ],
  "juma": [
    "jumat"
  ],
  "sabt": [
    "sabtu"
  ],
  "ah": [
    "ahad"
  ],
  "aha": [
    "ahad"
  ],
  "ahad": [
    "ahad"
  ],
  "sat": [
    "satu",
    "sate"
  ],
  "satu": [
    "satu"
  ],
  "dua": [
    "dua"
  ],
  "tig": [
    "tiga"
  ],
  "tiga": [
    "tiga"
  ],
  "em": [
    "empat"
  ],
  "emp": [
    "empat"
  ],
  "empa": [
    "empat"
  ],
  "lim": [
    "lima"
  ],
  "lima": [
    "lima"
  ],
  "en": [
    "enam",
    "enak"
  ],
  "ena": [
    "enam",
    "enak"
  ],
  "enam": [
    "enam"
  ],
  "tuj": [
    "tujuh"
  ],
  "tuju": [
    "tujuh"
  ],
  "del": [
    "delapan"
  ],
  "dela": [
    "delapan"
  ],
  "sem": [
    "sembilan"
  ],
  "semb": [
    "sembilan"
  ],
  "sep": [
    "sepuluh",
    "sepeda"
  ],
  "sepu": [
    "sepuluh"
  ],
  "ser": [
    "seratus",
    "seribu"
  ],
  "sera": [
    "seratus"
  ],
  "seri": [
    "seribu"
  ],
  "ru": [
    "rumah"
  ],
  "rum": [
    "rumah"
  ],
  "ruma": [
    "rumah"
  ],
  "kan": [
    "kantor"
  ],
  "kant": [
    "kantor"
  ],
  "seko": [
    "sekolah"
  ],
  "kamp": [
    "kampus"
  ],
  "tok": [
    "toko"
  ],
  "toko": [
    "toko"
  ],
  "pasa": [
    "pasar"
  ],
  "kama": [
    "kamar"
  ],
  "dapu": [
    "dapur"
  ],
  "res": [
    "restoran"
  ],
  "rest": [
    "restoran"
  ],
  "kaf": [
    "kafe"
  ],
  "kafe": [
    "kafe"
  ],
  "st": [
    "stasiun"
  ],
  "sta": [
    "stasiun"
  ],
  "stas": [
    "stasiun"
  ],
  "band": [
    "bandara"
  ],
  "mob": [
    "mobil"
  ],
  "mobi": [
    "mobil"
  ],
  "mot": [
    "motor"
  ],
  "moto": [
    "motor"
  ],
  "sepe": [
    "sepeda"
  ],
  "bus": [
    "bus"
  ],
  "kere": [
    "kereta"
  ],
  "pes": [
    "pesawat"
  ],
  "pesa": [
    "pesawat"
  ],
  "ua": [
    "uang"
  ],
  "uan": [
    "uang"
  ],
  "uang": [
    "uang"
  ],
  "nas": [
    "nasi"
  ],
  "nasi": [
    "nasi"
  ],
  "gor": [
    "goreng"
  ],
  "gore": [
    "goreng"
  ],
  "ay": [
    "ayam"
  ],
  "aya": [
    "ayam"
  ],
  "ayam": [
    "ayam"
  ],
  "sap": [
    "sapi"
  ],
  "sapi": [
    "sapi"
  ],
  "ik": [
    "ikan"
  ],
  "ika": [
    "ikan"
  ],
  "ikan": [
    "ikan"
  ],
  "tel": [
    "telur"
  ],
  "telu": [
    "telur"
  ],
  "samb": [
    "sambal"
  ],
  "bak": [
    "bakso"
  ],
  "baks": [
    "bakso"
  ],
  "mie": [
    "mie"
  ],
  "sot": [
    "soto"
  ],
  "soto": [
    "soto"
  ],
  "ren": [
    "rendang"
  ],
  "rend": [
    "rendang"
  ],
  "sate": [
    "sate"
  ],
  "sayu": [
    "sayur"
  ],
  "bua": [
    "buah",
    "buatan",
    "buatkan",
    "buati"
  ],
  "buah": [
    "buah"
  ],
  "ko": [
    "kopi",
    "kotor"
  ],
  "kop": [
    "kopi"
  ],
  "kopi": [
    "kopi"
  ],
  "teh": [
    "teh"
  ],
  "sus": [
    "susu"
  ],
  "susu": [
    "susu"
  ],
  "ai": [
    "air"
  ],
  "air": [
    "air"
  ],
  "mani": [
    "manis"
  ],
  "ped": [
    "pedas",
    "pedengar"
  ],
  "peda": [
    "pedas"
  ],
  "enak": [
    "enak"
  ],
  "bagu": [
    "bagus"
  ],
  "can": [
    "cantik"
  ],
  "cant": [
    "cantik"
  ],
  "gan": [
    "ganteng"
  ],
  "gant": [
    "ganteng"
  ],
  "je": [
    "jelek"
  ],
  "jel": [
    "jelek"
  ],
  "jele": [
    "jelek"
  ],
  "bers": [
    "bersih"
  ],
  "kot": [
    "kotor"
  ],
  "koto": [
    "kotor"
  ],
  "besa": [
    "besar"
  ],
  "kec": [
    "kecil"
  ],
  "keci": [
    "kecil"
  ],
  "pen": [
    "pendek"
  ],
  "pend": [
    "pendek"
  ],
  "panj": [
    "panjang"
  ],
  "jau": [
    "jauh"
  ],
  "jauh": [
    "jauh"
  ],
  "dek": [
    "dekat"
  ],
  "deka": [
    "dekat"
  ],
  "ce": [
    "cepat"
  ],
  "cep": [
    "cepat"
  ],
  "cepa": [
    "cepat"
  ],
  "lam": [
    "lambat"
  ],
  "lamb": [
    "lambat"
  ],
  "mu": [
    "mudah"
  ],
  "mud": [
    "mudah"
  ],
  "muda": [
    "mudah"
  ],
  "sul": [
    "sulit"
  ],
  "suli": [
    "sulit"
  ],
  "sena": [
    "senang"
  ],
  "bah": [
    "bahagia"
  ],
  "baha": [
    "bahagia"
  ],
  "sed": [
    "sedih"
  ],
  "sedi": [
    "sedih"
  ],
  "mara": [
    "marah"
  ],
  "tak": [
    "takut"
  ],
  "taku": [
    "takut"
  ],
  "bos": [
    "bosan"
  ],
  "bosa": [
    "bosan"
  ],
  "cap": [
    "capek"
  ],
  "cape": [
    "capek"
  ],
  "lel": [
    "lelah"
  ],
  "lela": [
    "lelah"
  ],
  "ben": [
    "benar"
  ],
  "bena": [
    "benar"
  ],
  "sal": [
    "salah"
  ],
  "sala": [
    "salah"
  ],
  "mel": [
    "melihat"
  ],
  "meli": [
    "melihat"
  ],
  "berl": [
    "berlihat"
  ],
  "dil": [
    "dilihat"
  ],
  "dili": [
    "dilihat"
  ],
  "terl": [
    "terlihat"
  ],
  "pel": [
    "pelihat"
  ],
  "peli": [
    "pelihat"
  ],
  "med": [
    "medengar"
  ],
  "mede": [
    "medengar"
  ],
  "did": [
    "didengar"
  ],
  "dide": [
    "didengar"
  ],
  "terd": [
    "terdengar"
  ],
  "pede": [
    "pedengar"
  ],
  "meb": [
    "mebaca",
    "mebeli",
    "mebayar",
    "mebantu",
    "mebuka",
    "mebuat"
  ],
  "meba": [
    "mebaca",
    "mebayar",
    "mebantu"
  ],
  "berb": [
    "berbaca",
    "berbeli",
    "berbayar",
    "berbantu",
    "berbuka",
    "berbuat"
  ],
  "dib": [
    "dibaca",
    "dibeli",
    "dibayar",
    "dibantu",
    "dibuka",
    "dibuat"
  ],
  "diba": [
    "dibaca",
    "dibayar",
    "dibantu"
  ],
  "terb": [
    "terbaca",
    "terbeli",
    "terbayar",
    "terbantu",
    "terbuka",
    "terbuat"
  ],
  "peb": [
    "pebaca",
    "pebeli",
    "pebayar",
    "pebantu",
    "pebuka",
    "pebuat"
  ],
  "peba": [
    "pebaca",
    "pebayar",
    "pebantu"
  ],
  "met": [
    "metulis",
    "metutup",
    "metunggu",
    "meterima"
  ],
  "metu": [
    "metulis",
    "metutup",
    "metunggu"
  ],
  "bert": [
    "bertulis",
    "bertutup",
    "bertunggu",
    "berterima"
  ],
  "dit": [
    "ditulis",
    "ditutup",
    "ditunggu",
    "diterima"
  ],
  "ditu": [
    "ditulis",
    "ditutup",
    "ditunggu"
  ],
  "tert": [
    "tertulis",
    "tertutup",
    "tertunggu",
    "terterima"
  ],
  "pet": [
    "petulis",
    "petutup",
    "petunggu",
    "peterima"
  ],
  "petu": [
    "petulis",
    "petutup",
    "petunggu"
  ],
  "mem": [
    "memakan",
    "meminum"
  ],
  "mema": [
    "memakan"
  ],
  "berm": [
    "bermakan",
    "berminum"
  ],
  "term": [
    "termakan",
    "terminum"
  ],
  "pem": [
    "pemakan",
    "peminum"
  ],
  "pema": [
    "pemakan"
  ],
  "memi": [
    "meminum"
  ],
  "dimi": [
    "diminum"
  ],
  "pemi": [
    "peminum"
  ],
  "mebe": [
    "mebeli"
  ],
  "dibe": [
    "dibeli"
  ],
  "pebe": [
    "pebeli"
  ],
  "mej": [
    "mejual"
  ],
  "meju": [
    "mejual"
  ],
  "berj": [
    "berjual"
  ],
  "dij": [
    "dijual"
  ],
  "diju": [
    "dijual"
  ],
  "terj": [
    "terjual"
  ],
  "pej": [
    "pejual"
  ],
  "peju": [
    "pejual"
  ],
  "mebu": [
    "mebuka",
    "mebuat"
  ],
  "dibu": [
    "dibuka",
    "dibuat"
  ],
  "pebu": [
    "pebuka",
    "pebuat"
  ],
  "mec": [
    "mecari"
  ],
  "meca": [
    "mecari"
  ],
  "berc": [
    "bercari"
  ],
  "dic": [
    "dicari"
  ],
  "dica": [
    "dicari"
  ],
  "terc": [
    "tercari"
  ],
  "pec": [
    "pecari"
  ],
  "peca": [
    "pecari"
  ],
  "mep": [
    "mepikir",
    "mepakai"
  ],
  "mepi": [
    "mepikir"
  ],
  "berp": [
    "berpikir",
    "berpakai"
  ],
  "dip": [
    "dipikir",
    "dipakai"
  ],
  "dipi": [
    "dipikir"
  ],
  "terp": [
    "terpikir",
    "terpakai"
  ],
  "pep": [
    "pepikir",
    "pepakai"
  ],
  "pepi": [
    "pepikir"
  ],
  "mera": [
    "merasa"
  ],
  "berr": [
    "berrasa"
  ],
  "dir": [
    "dirasa"
  ],
  "dira": [
    "dirasa"
  ],
  "terr": [
    "terrasa"
  ],
  "pera": [
    "perasa"
  ],
  "buat": [
    "buatan",
    "buatkan",
    "buati"
  ],
  "mepa": [
    "mepakai"
  ],
  "dipa": [
    "dipakai"
  ],
  "pepa": [
    "pepakai"
  ],
  "pak": [
    "pakaian",
    "pakaikan",
    "pakaii"
  ],
  "paka": [
    "pakaian",
    "pakaikan",
    "pakaii"
  ],
  "mek": [
    "mekirim"
  ],
  "meki": [
    "mekirim"
  ],
  "berk": [
    "berkirim"
  ],
  "dik": [
    "dikirim"
  ],
  "diki": [
    "dikirim"
  ],
  "terk": [
    "terkirim"
  ],
  "peki": [
    "pekirim"
  ],
  "mete": [
    "meterima"
  ],
  "dite": [
    "diterima"
  ],
  "pete": [
    "peterima"
  ]
};
  const ID_WORD_SET = new Set(ID_WORDS);

  class IndonesianSubDirectory {
    constructor() {
      this.name = 'Bahasa Indonesia';
      this.code = 'id';
      this.badge = 'Bahasa Gaul';
      this.icon = 'fa-compass';
      this.wordSet = ID_WORD_SET;
      this.typoMap = ID_TYPO_MAP;
      this.prefixTable = ID_PREFIX_TABLE;
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
      return /\b(halo|selamat|terima|kasih|kamu|saya|gue|gua|gw|lu|baper|kepo|gabut|mager|wkwk|santuy|otw|mantap)\b/i.test(lower);
    }

    activate() {
      this.isActive = true;
      if (typeof window !== 'undefined') window.ID_SUBDIRECTORY_ACTIVE = true;
    }

    deactivate() {
      this.isActive = false;
      if (typeof window !== 'undefined') window.ID_SUBDIRECTORY_ACTIVE = false;
    }
  }

  const idSubDir = new IndonesianSubDirectory();

  window.ID_WORDS = ID_WORDS;
  window.ID_TYPO_MAP = ID_TYPO_MAP;
  window.ID_WORD_SET = ID_WORD_SET;
  window.ID_PREFIX_TABLE = ID_PREFIX_TABLE;
  window.ID_SUBDIRECTORY = idSubDir;
})();
