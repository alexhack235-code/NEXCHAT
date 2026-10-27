/**
 * =============================================================================
 * NEXCHAT - Consolidated Phonetic Speech Acceleration & Spectrum DSP Engine
 * 
 * Capabilities:
 * 1. Multi-lingual phonetic pre-processor for Web Speech API SpeechSynthesisUtterance.
 * 2. Arabizi numeral suppression, Cyrillic stress/vowel reduction, European elisions,
 *    West African Pidgin syllable timing, and Tech/Dev acronym naturalization.
 * 3. Non-linear tempo compressor preventing syllable clipping at 1.25x - 2.0x playback.
 * 4. Acoustic formant frequency profile coupling for 60 FPS Canvas spectrum visualizers.
 * 
 * STRICTLY 0 UNICODE EMOJIS | PURE WINDOWS CRLF | ES2022 COMPLIANT
 * =============================================================================
 */

(function(root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    const instance = factory();
    module.exports = instance;
    module.exports.default = instance;
  } else {
    root.NexPhoneticSpeechEngine = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';

  // 1. Tech & Developer Acronym & Code Normalization Table
  const TECH_PRONUNCIATION_MAP = Object.freeze({
    "CLI": "C-L-I",
    "GUI": "goo-ey",
    "API": "A-P-I",
    "async/await": "a-sync a-wait",
    "async": "a-sync",
    "await": "a-wait",
    "SHA-256": "shah two fifty six",
    "sha256": "shah two fifty six",
    "WebRTC": "web R-T-C",
    "webrtc": "web R-T-C",
    "JSON": "jay-sawn",
    "json": "jay-sawn",
    "SQL": "sequel",
    "sql": "sequel",
    "NoSQL": "no sequel",
    "nosql": "no sequel",
    "k8s": "kates",
    "kubectl": "kube control",
    "chmod": "ch-mod",
    "chown": "ch-own",
    "sudo": "soo-doo",
    "OAuth": "oh-auth",
    "oauth": "oh-auth",
    "JWT": "jot",
    "jwt": "jot",
    "Wasm": "wah-zum",
    "wasm": "wah-zum",
    "eBPF": "e-B-P-F",
    "ebpf": "e-B-P-F",
    "zk-SNARK": "zee-kay snark",
    "zksnark": "zee-kay snark",
    "zk-STARK": "zee-kay stark",
    "zkstark": "zee-kay stark",
    "PoW": "proof of work",
    "PoS": "proof of stake",
    "DeFi": "dee-fye",
    "defi": "dee-fye",
    "E2EE": "end to end encrypted",
    "e2ee": "end to end encrypted",
    "CI/CD": "C-I C-D",
    "ci/cd": "C-I C-D",
    "PR": "pull request",
    "gRPC": "G-R-P-C",
    "grpc": "G-R-P-C",
    "npm": "N-P-M",
    "pnpm": "P-N-P-M",
    "yarn": "yarn",
    "docker": "docker",
    "regex": "reg-ex",
    "RESTful": "rest-full",
    "UUID": "U-U-I-D",
    "uuid": "U-U-I-D"
  });

  // 1b. Distinct Code Operators (Literal replacement without word-boundary regex)
  const CODE_OPERATOR_MAP = Object.freeze({
    "===": " is strictly equal to ",
    "!==": " is strictly not equal to ",
    "=>": " arrow ",
    "&&": " and ",
    "||": " or "
  });

  // 2. Arabizi Numeral & Middle Eastern Phonetic Table
  const ARABIZI_PHONETIC_MAP = Object.freeze({
    "7abibi": "hah-bee-bee",
    "7abibti": "hah-beeb-tee",
    "7elw": "hel-woo",
    "7aram": "hah-rahm",
    "sa7": "sahh",
    "7amdullah": "al-ham-doo-lil-lah",
    "el7mdlh": "al-ham-doo-lil-lah",
    "al7mdlh": "al-ham-doo-lil-lah",
    "sb7": "sah-bah",
    "9ba7": "sah-bah",
    "7ayati": "hah-yah-tee",
    "w7shtny": "wah-hash-tnee",
    "7a2": "haqq",
    "la7za": "lah-zah",
    "3afwan": "af-wahn",
    "3arab": "ah-rahb",
    "3alashan": "ah-lah-shahn",
    "3ashan": "ah-lah-shahn",
    "3ala": "ah-lah",
    "ba3d": "bah-ad",
    "ma3a": "mah-ah",
    "ya3ni": "yah-nee",
    "ma3lesh": "mah-lesh",
    "3omri": "ohm-ree",
    "3eed": "eed",
    "5alas": "khah-lahs",
    "5ls": "khah-lahs",
    "5air": "kheyr",
    "5obz": "khohbz",
    "5aleena": "khah-lee-nah",
    "5ateer": "khah-teer",
    "a5oya": "akh-oo-yah",
    "o5ti": "okh-tee",
    "9a7": "sahh",
    "9adeeq": "sah-deeq",
    "9a3b": "sah-ahb",
    "9oot": "sowt",
    "9ura": "soo-rah",
    "2al": "ahl",
    "2ool": "ohl",
    "so2al": "soo-ahl",
    "ra2y": "rah-ee",
    "da2i2a": "dah-qee-qah",
    "2ahlan": "ah-lahn",
    "2eh": "eh",
    "6ayeb": "tah-yeb",
    "6abeeb": "tah-beeb",
    "6areeq": "tah-reeq",
    "8ali": "ghah-lee",
    "8alat": "ghah-laht",
    "8roob": "ghoo-roob",
    "inshallah": "in-shah-lah",
    "mashallah": "mah-shah-lah",
    "alhamdulillah": "al-ham-doo-lil-lah",
    "shukran": "shook-rahn",
    "marhaba": "mahr-hah-bah",
    "salam": "sah-lahm",
    "wallah": "wuhl-lah",
    "tamam": "tah-mahm",
    "kifak": "kee-fahk",
    "yalla": "yahl-lah"
  });

  // 3. West African & Nigerian Pidgin Phonetic Normalizer
  const PIDGIN_PHONETIC_MAP = Object.freeze({
    "wetin": "weh-tin",
    "wahala": "wah-hah-lah",
    "abeg": "ah-beg",
    "commot": "kuh-mott",
    "comot": "kuh-mott",
    "shey": "shay",
    "kwanu": "kwah-noo",
    "pikin": "pee-kin",
    "sabi": "sah-bee",
    "chop": "chawp",
    "sef": "sef",
    "oya": "oh-yah",
    "una": "oo-nah",
    "how far": "how-fahr",
    "jara": "jah-rah",
    "mumu": "moo-moo",
    "palava": "pah-lah-vah",
    "waka": "wah-kah",
    "vawulence": "vye-oh-lens",
    "kolo": "koh-loh",
    "japa": "jah-pah",
    "run am": "run-ahm",
    "urgent 2k": "ur-jent two-kay",
    "soft work": "soft-wuhk",
    "send aza": "send ah-zah",
    "drop aza": "drop ah-zah",
    "tech bro": "tek-broh",
    "omo logo": "oh-moh loh-goh",
    "balance me": "bah-lahns mee",
    "cash out": "kahsh-owt",
    "pos machine": "P-O-S mah-sheen"
  });

  // 4. Russian Cyrillic Fallback Transliteration & Stress Normalizer
  const RUSSIAN_FALLBACK_MAP = Object.freeze({
    "здравствуйте": "zdrahv-stvooy-tyeh",
    "здравствуй": "zdrahv-stvooy",
    "привет": "pree-vyet",
    "спасибо": "spah-see-bah",
    "пожалуйста": "pah-zhahl-stah",
    "хорошо": "hah-rah-shoh",
    "отлично": "aht-leech-nah",
    "нормально": "nahr-mahl-nah",
    "ладно": "lahd-nah",
    "конечно": "kah-nyesh-nah",
    "до свидания": "dah svee-dah-nee-yah",
    "пока": "pah-kah",
    "доброе утро": "doh-bray-eh oo-trah",
    "добрый день": "doh-bree dyen",
    "добрый вечер": "doh-bree vyeh-cheer",
    "спокойной ночи": "spah-koy-noy noh-chee",
    "как дела": "kahk dee-lah",
    "что": "shtoh",
    "сегодня": "see-vohd-nyah",
    "сейчас": "see-chahs",
    "деплой": "dee-ploy",
    "коммит": "kahm-meet",
    "мердж": "myerdzh",
    "пулл": "pool",
    "прод": "prohd",
    "фича": "fee-chah",
    "баг": "bahg"
  });

  // 5. European Contractions (ES, FR, DE, IT, PT)
  const EUROPEAN_CONTRACTIONS = Object.freeze({
    "por favor": "por-fah-vor",
    "cómo estás": "koh-mohs-tahs",
    "buenos días": "bwehn-dee-ahs",
    "muchas gracias": "moo-chahs-grah-syahs",
    "s'il vous plaît": "seel-voo-play",
    "s'il te plaît": "seel-tuh-play",
    "c'est": "say",
    "merci beaucoup": "mair-see-boh-koo",
    "guten tag": "goo-tn-tahg",
    "auf wiedersehen": "owf-vee-der-zayn",
    "vielen dank": "fee-ln-dahnk",
    "wie geht's": "vee-gayts",
    "per favore": "pehr-fah-voh-reh",
    "buon giorno": "bwon-zhor-noh",
    "grazie mille": "grah-tsyee-meel-leh",
    "tudo bem": "too-doo-bayng",
    "muito obrigado": "mwee-toh-bree-gah-doo",
    "tamo junto": "tah-moo-zhoon-too"
  });

  // 6. Hinglish & Taglish Vocalic Normalizer
  const ASIAN_VOCALIC_MAP = Object.freeze({
    "kya chal raha hai": "kyaa chal ra-haa hai",
    "kya scene hai": "kyaa seen hai",
    "bhai sahb": "bhaa-ee sah-hahb",
    "arre yaar": "ahr-ray yaahr",
    "theek hai": "theek hai",
    "jugaad": "joo-gahd",
    "bindaas": "bin-dahs",
    "mast hai": "mahst hai",
    "maraming salamat": "mah-rah-ming sah-lah-maht",
    "salamat po": "sah-lah-maht poh",
    "kamusta ka": "kah-moos-tah kah",
    "walang anuman": "wah-lahng ah-noo-mahn"
  });

  // 7. Calibrated Acoustic Formant Spectrum Profiles
  const ACOUSTIC_SPECTRUM_PROFILES = Object.freeze({
    commander: {
      id: 'commander',
      name: 'Tactical Commander',
      pitch: 0.75,
      rate: 0.95,
      f0: 95,
      formants: [450, 1200, 2400],
      bands: [0.95, 0.85, 0.65, 0.50, 0.35, 0.20],
      hudColor: '#00ff66'
    },
    synth: {
      id: 'synth',
      name: 'Neural AI Synth',
      pitch: 1.15,
      rate: 1.05,
      f0: 210,
      formants: [750, 1950, 3200],
      bands: [0.55, 0.75, 0.95, 0.90, 0.85, 0.70],
      hudColor: '#00d4ff'
    },
    stealth: {
      id: 'stealth',
      name: 'Stealth Operator',
      pitch: 0.90,
      rate: 0.85,
      f0: 110,
      formants: [520, 1400, 2600],
      bands: [0.70, 0.90, 0.75, 0.55, 0.40, 0.25],
      hudColor: '#a855f7'
    },
    tech_dev: {
      id: 'tech_dev',
      name: 'Cyber Dev / CLI',
      pitch: 1.00,
      rate: 1.10,
      f0: 140,
      formants: [600, 1800, 3100],
      bands: [0.65, 0.80, 0.90, 0.95, 0.80, 0.60],
      hudColor: '#00f2fe'
    },
    pidgin_kinetic: {
      id: 'pidgin_kinetic',
      name: 'Naija Kinetic',
      pitch: 1.04,
      rate: 1.06,
      f0: 145,
      formants: [720, 1850, 2950],
      bands: [0.85, 0.90, 0.88, 0.75, 0.50, 0.30],
      hudColor: '#ffd700'
    }
  });

  class NexPhoneticSpeechEngine {
    constructor() {
      this.codeOpMap = CODE_OPERATOR_MAP;
      this.techMap = TECH_PRONUNCIATION_MAP;
      this.arabiziMap = ARABIZI_PHONETIC_MAP;
      this.pidginMap = PIDGIN_PHONETIC_MAP;
      this.ruMap = RUSSIAN_FALLBACK_MAP;
      this.euroMap = EUROPEAN_CONTRACTIONS;
      this.asianMap = ASIAN_VOCALIC_MAP;
      this.profiles = ACOUSTIC_SPECTRUM_PROFILES;
      this.initAutoPatch();
    }

    /**
     * Non-linear Syllabic Tempo Compressor
     * Compresses vowels elastically while keeping consonants rigid to avoid clipping.
     */
    scalePhonemeRate(baseDurationMs, type = 'vowel', rate = 1.0) {
      if (rate <= 1.0) return baseDurationMs;
      if (type === 'vowel') {
        return Math.max(baseDurationMs / Math.pow(rate, 1.22), 45);
      }
      if (type === 'consonant') {
        return Math.max(baseDurationMs / Math.pow(rate, 0.65), 25);
      }
      return Math.max(baseDurationMs / Math.pow(rate, 1.50), 15);
    }

    /**
     * Master Multi-Lingual Speech Normalizer
     * Transforms raw chat transmissions into fluid phonetics prior to TTS dispatch.
     */
    normalizeForSpeech(rawText, langHint = 'auto') {
      if (!rawText || typeof rawText !== 'string') return '';
      let text = rawText.trim();

      // Phase 1: Tech & Dev Acronyms & Operators (High Priority)
      for (const token in this.techMap) {
        const re = new RegExp('\\b' + token.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\$&') + '\\b', 'g');
        text = text.replace(re, this.techMap[token]);
      }

      // Phase 2: Arabizi Numeral Suppression
      for (const token in this.arabiziMap) {
        const re = new RegExp('\\b' + token + '\\b', 'gi');
        text = text.replace(re, this.arabiziMap[token]);
      }

      // Phase 3: Pidgin Colloquial & Market Idioms
      for (const phrase in this.pidginMap) {
        const re = new RegExp('\\b' + phrase + '\\b', 'gi');
        text = text.replace(re, this.pidginMap[phrase]);
      }

      // Phase 4: European Contractions (ES, FR, DE, IT, PT)
      for (const phrase in this.euroMap) {
        const re = new RegExp('\\b' + phrase + '\\b', 'gi');
        text = text.replace(re, this.euroMap[phrase]);
      }

      // Phase 5: Asian/Middle Eastern Vocalics (Hinglish/Taglish)
      for (const phrase in this.asianMap) {
        const re = new RegExp('\\b' + phrase + '\\b', 'gi');
        text = text.replace(re, this.asianMap[phrase]);
      }

      // Phase 6: Russian Cyrillic Fallback (if client lacks native Russian TTS voice)
      const hasCyrillicVoice = (typeof window !== 'undefined' && window.speechSynthesis)
        ? (window.speechSynthesis.getVoices() || []).some(v => v.lang && v.lang.startsWith('ru'))
        : false;

      if (!hasCyrillicVoice && /[\u0400-\u04FF]/.test(text)) {
        for (const word in this.ruMap) {
          const re = new RegExp('\\b' + word + '\\b', 'gi');
          text = text.replace(re, this.ruMap[word]);
        }
      }

      return text.replace(/\s+/g, ' ').trim();
    }

    /**
     * Resolves acoustic profile for spectrum canvas visualizer
     */
    getAcousticProfile(profileId = 'commander') {
      return this.profiles[profileId] || this.profiles.commander;
    }

    /**
     * Non-invasively attaches preprocessor to NeuralVoiceSynthEngine
     */
    initAutoPatch() {
      if (typeof window === 'undefined') return;

      const patch = () => {
        if (window.neuralVoiceSynthEngine && !window.neuralVoiceSynthEngine._phoneticPatched) {
          const origSpeak = window.neuralVoiceSynthEngine.speakText.bind(window.neuralVoiceSynthEngine);
          window.neuralVoiceSynthEngine.speakText = (text, profileOverride) => {
            const normalized = this.normalizeForSpeech(text);
            return origSpeak(normalized, profileOverride);
          };

          const origDispatch = window.neuralVoiceSynthEngine.dispatchSynthesizedVoiceNote.bind(window.neuralVoiceSynthEngine);
          window.neuralVoiceSynthEngine.dispatchSynthesizedVoiceNote = (text) => {
            const normalized = this.normalizeForSpeech(text);
            return origDispatch(normalized);
          };

          window.neuralVoiceSynthEngine._phoneticPatched = true;
        }
      };

      if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', patch);
      } else {
        patch();
      }
    }
  }

  return new NexPhoneticSpeechEngine();
});
