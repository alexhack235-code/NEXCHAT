/**
 * NEXCHAT Multilingual Sub-Directory: Spanish, French, Portuguese & German
 * Languages:
 * - Spanish (Español): es
 * - French (Français): fr
 * - Portuguese (Português): pt
 * - German (Deutsch): de
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
  "ir",
  "ver",
  "dar",
  "saber",
  "querer",
  "llegar",
  "pasar",
  "deber",
  "poner",
  "parecer",
  "quedar",
  "creer",
  "hablar",
  "llevar",
  "dejar",
  "seguir",
  "encontrar",
  "llamar",
  "venir",
  "pensar",
  "salir",
  "volver",
  "tomar",
  "conocer",
  "vivir",
  "sentir",
  "tratar",
  "mirar",
  "contar",
  "empezar",
  "esperar",
  "buscar",
  "existir",
  "entrar",
  "escribir",
  "perder",
  "producir",
  "ocurrir",
  "entender",
  "pedir",
  "recibir",
  "recordar",
  "terminar",
  "permitir",
  "aparecer",
  "conseguir",
  "comenzar",
  "servir",
  "sacar",
  "necesitar",
  "mantener",
  "resultar",
  "leer",
  "caer",
  "cambiar",
  "presentar",
  "crear",
  "abrir",
  "considerar",
  "oír"
];
  const ES_TYPO_MAP = {
  "ola": "hola",
  "q": "que",
  "k": "que",
  "pq": "porque",
  "xq": "por qué",
  "tmb": "también",
  "tb": "también",
  "dsp": "después",
  "xfa": "por favor",
  "xfavor": "por favor",
  "muxo": "mucho",
  "bno": "bueno",
  "aki": "aquí",
  "sta": "está",
  "toy": "estoy",
  "bn": "bien",
  "ns": "no sé",
  "ntp": "no te preocupes",
  "d": "de",
  "cm": "cómo",
  "msj": "mensaje",
  "tkm": "te quiero mucho",
  "tqm": "te quiero mucho",
  "salu2": "saludos",
  "grax": "gracias",
  "grcs": "gracias",
  "porfa": "por favor"
};

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
  "tout",
  "rien",
  "bon",
  "mauvais",
  "grand",
  "petit",
  "être",
  "avoir",
  "pouvoir",
  "dire",
  "aller",
  "voir",
  "vouloir",
  "venir",
  "devoir",
  "prendre",
  "trouver",
  "donner",
  "falloir",
  "parler",
  "mettre",
  "savoir",
  "passer",
  "regarder",
  "aimer",
  "croire",
  "demander",
  "rester",
  "répondre",
  "entendre",
  "penser",
  "arriver",
  "connaître",
  "devenir",
  "sentir",
  "attendre",
  "vivre",
  "rendre",
  "écrire",
  "appeler",
  "permettre",
  "occuper",
  "devoir",
  "partir",
  "suivre",
  "comprendre",
  "sortir",
  "tenir",
  "porter"
];
  const FR_TYPO_MAP = {
  "bjr": "bonjour",
  "bsr": "bonsoir",
  "mrc": "merci",
  "stp": "s'il te plaît",
  "svp": "s'il vous plaît",
  "pk": "pourquoi",
  "bcp": "beaucoup",
  "tlm": "tout le monde",
  "jpp": "je n'en peux plus",
  "mdr": "mort de rire",
  "ptdr": "mort de rire",
  "slt": "salut",
  "cb": "combien",
  "tkt": "t'inquiète",
  "cv": "ça va",
  "jsp": "je ne sais pas",
  "dsl": "désolé",
  "a+": "à plus tard",
  "apres": "après",
  "meme": "même",
  "tres": "très",
  "deja": "déjà",
  "ouais": "oui"
};

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
  "grande",
  "pequeno",
  "estar",
  "haver",
  "ter",
  "poder",
  "dizer",
  "ir",
  "ver",
  "dar",
  "saber",
  "querer",
  "chegar",
  "passar",
  "dever",
  "pôr",
  "parecer",
  "ficar",
  "acreditar",
  "falar",
  "levar",
  "deixar",
  "seguir",
  "encontrar",
  "chamar",
  "vir",
  "pensar",
  "sair",
  "voltar",
  "tomar",
  "conhecer",
  "viver",
  "sentir",
  "olhar",
  "contar",
  "começar",
  "esperar",
  "procurar",
  "existir",
  "entrar",
  "escrever",
  "perder",
  "entender",
  "pedir",
  "receber",
  "lembrar",
  "terminar",
  "permitir",
  "aparecer"
];
  const PT_TYPO_MAP = {
  "ola": "olá",
  "vc": "você",
  "vcs": "vocês",
  "obg": "obrigado",
  "pfv": "por favor",
  "porfa": "por favor",
  "tbm": "também",
  "tb": "também",
  "blz": "beleza",
  "oq": "o que",
  "kd": "cadê",
  "ctz": "certeza",
  "dps": "depois",
  "nd": "nada",
  "pq": "porque",
  "hj": "hoje",
  "flw": "falou",
  "tmj": "estamos juntos",
  "bjo": "beijo",
  "vdd": "verdade",
  "agr": "agora",
  "td": "tudo",
  "mto": "muito",
  "q": "que",
  "n": "não"
};

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
  "viel",
  "wenig",
  "alles",
  "nichts",
  "groß",
  "klein",
  "sein",
  "haben",
  "werden",
  "können",
  "müssen",
  "sagen",
  "sehen",
  "lassen",
  "gehen",
  "wissen",
  "wollen",
  "bleiben",
  "kommen",
  "geben",
  "denken",
  "finden",
  "liegen",
  "stehen",
  "bringen",
  "glauben",
  "fragen",
  "kennen",
  "halten",
  "schreiben",
  "sprechen",
  "zeigen",
  "verstehen",
  "leben",
  "arbeiten",
  "brauchen",
  "fahren",
  "nehmen",
  "setzen",
  "hören",
  "führen"
];
  const DE_TYPO_MAP = {
  "hlo": "hallo",
  "vg": "viele grüße",
  "lg": "liebe grüße",
  "mfg": "mit freundlichen grüßen",
  "garnicht": "gar nicht",
  "warscheinlich": "wahrscheinlich",
  "thx": "danke",
  "pls": "bitte",
  "bd": "bis dann",
  "bb": "bis bald",
  "ka": "keine ahnung",
  "kp": "kein plan",
  "idk": "ich weiß nicht",
  "vllt": "vielleicht",
  "eigtl": "eigentlich",
  "wsl": "wahrscheinlich",
  "moin": "guten morgen"
};

  const ES_SET = new Set(ES_WORDS.map(w => w.toLowerCase()));
  const FR_SET = new Set(FR_WORDS.map(w => w.toLowerCase()));
  const PT_SET = new Set(PT_WORDS.map(w => w.toLowerCase()));
  const DE_SET = new Set(DE_WORDS.map(w => w.toLowerCase()));

  class MultilingualSuite {
    constructor() {
      this.es = { name: 'Spanish', words: ES_SET, typos: ES_TYPO_MAP };
      this.fr = { name: 'French', words: FR_SET, typos: FR_TYPO_MAP };
      this.pt = { name: 'Portuguese', words: PT_SET, typos: PT_TYPO_MAP };
      this.de = { name: 'German', words: DE_SET, typos: DE_TYPO_MAP };
      this.activeLangs = new Set();
    }

    detect(text) {
      if (!text || typeof text !== 'string') return null;
      const lower = text.toLowerCase();
      // Spanish specific characters or top words
      if (/[¿¡ñáéíóú]/.test(lower) || /\b(hola|gracias|estás|amigo|bueno|cómo)\b/.test(lower)) {
        return 'es';
      }
      // French specific characters or top words
      if (/[çœæàèêëîïôùû]/.test(lower) || /\b(bonjour|merci|s'il|vous|plaît|très|avec)\b/.test(lower)) {
        return 'fr';
      }
      // Portuguese specific characters or top words
      if (/[ãõçáéíóú]/.test(lower) || /\b(olá|obrigado|você|tudo|bom|beleza)\b/.test(lower)) {
        return 'pt';
      }
      // German specific characters or top words
      if (/[äöüß]/.test(lower) || /\b(hallo|danke|bitte|guten|morgen|nicht|haben)\b/.test(lower)) {
        return 'de';
      }
      return null;
    }

    correctWord(cleanWord, lang) {
      if (!cleanWord) return null;
      if (lang && this[lang]) {
        return this[lang].typos[cleanWord] || null;
      }
      // Check all active or candidate languages
      if (this.es.typos[cleanWord]) return this.es.typos[cleanWord];
      if (this.fr.typos[cleanWord]) return this.fr.typos[cleanWord];
      if (this.pt.typos[cleanWord]) return this.pt.typos[cleanWord];
      if (this.de.typos[cleanWord]) return this.de.typos[cleanWord];
      return null;
    }

    hasWord(cleanWord, lang) {
      if (!cleanWord) return false;
      if (lang && this[lang]) {
        return this[lang].words.has(cleanWord);
      }
      return this.es.words.has(cleanWord) ||
             this.fr.words.has(cleanWord) ||
             this.pt.words.has(cleanWord) ||
             this.de.words.has(cleanWord);
    }
  }

  const multiSuite = new MultilingualSuite();

  // Global exports
  window.ES_SUBDIRECTORY = multiSuite.es;
  window.FR_SUBDIRECTORY = multiSuite.fr;
  window.PT_SUBDIRECTORY = multiSuite.pt;
  window.DE_SUBDIRECTORY = multiSuite.de;
  window.MULTILINGUAL_SUITE = multiSuite;
})();
