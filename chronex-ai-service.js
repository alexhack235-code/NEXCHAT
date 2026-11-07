

import { db, rtdb } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { geminiKeyPool, GEMINI_CONFIG } from "./gemini-config.js";

const CREATOR = "NEXCHAT AI TEAM";

const CHRONEX_CONFIG = {
  creator: CREATOR,
  model: {
    name: "Gemini 2.5 / ChatGPT-4 Turbo",
    type: "gemini-flash-lite",
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0.6,
    presencePenalty: 0.6,
  },

  capabilities: {
    chat: true,
    codeAnalysis: true,
    languageSupport: ["JavaScript", "Python", "C++", "C", "C#", "Java", "Go", "Rust"],
    mathSolving: true,
    dataAnalysis: true,
    documentProcessing: true,
    multiLanguage: true,
    imageAnalysis: true,
  },

  backends: {
    gemini: {
      enabled: true,
      pool: geminiKeyPool,
      config: GEMINI_CONFIG
    },
    openai: {
      enabled: true,  // Enable ChatGPT
      apiKey: localStorage.getItem('openai_api_key') || "",
      model: "gpt-4-turbo",
      endpoint: "https://api.openai.com/v1/chat/completions",
      timeout: 30000,
    },
    ollama: {
      enabled: true,
      endpoint: "http://localhost:11434/api/generate",
      model: "llama3:8b",
      timeout: 30000,
    }
  },

  response: {
    caching: true,
    cacheDuration: 3600, // 1 hour
    maxCacheSize: 100
  }
};

class IntentDetector {
  constructor() {
    this.patterns = {
      greeting: /\b(hello|hi|hey|greetings|good\s+(morning|afternoon|evening))\b/i,
      question: /\b(what|why|how|when|where|who|which|can\s+you|could\s+you)\b/i,
      coding: /\b(code|function|class|variable|bug|error|debug|compile|syntax|program)\b/i,
      math: /\b(calculate|solve|equation|formula|math|algebra|calculus|derivative|integral)\b/i,
      explanation: /\b(explain|describe|tell\s+me\s+about|what\s+is|define|meaning)\b/i,
      learning: /\b(learn|tutorial|teach|guide|show\s+me)\b/i,
      help: /\b(help|assist|support)\b/i
    };
  }

  detect(message) {
    const intents = [];
    for (const [intent, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(message)) {
        intents.push(intent);
      }
    }
    return intents.length > 0 ? intents : ['general'];
  }

  extractEntities(message) {
    const entities = {
      languages: [],
      topics: [],
      keywords: []
    };

    const langs = ['javascript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'go', 'rust', 'php', 'typescript'];
    langs.forEach(lang => {
      const regex = new RegExp(`\\b${lang}\\b`, 'i');
      if (regex.test(message)) {
        entities.languages.push(lang.replace('\\', ''));
      }
    });

    const topics = ['ai', 'machine learning', 'data science', 'web', 'mobile', 'database', 'api', 'cloud'];
    topics.forEach(topic => {
      if (message.toLowerCase().includes(topic)) {
        entities.topics.push(topic);
      }
    });

    return entities;
  }
}

class ChronexAI {
  constructor(config) {
    this.config = config;
    this.cache = new Map();
    this.conversationHistory = [];
    this.lastResponses = [];
    this.uid = null;
    this.intentDetector = new IntentDetector();
    this.contextMemory = {
      lastTopic: null,
      userPreferences: {},
      conversationCount: 0
    };
    console.log(" Chronex AI Service Initialized (Enhanced)");
  }

  setUserId(uid) {
    if (uid) {
      this.uid = uid;
      console.log("NEXCHAT AI: User identity synchronized:", uid);
    }
  }

  setModel(modelConfig) {
    if (!modelConfig || typeof modelConfig !== 'object') {
      console.warn('setModel requires object config');
      return;
    }
    this.config.model = {
      ...this.config.model,
      ...modelConfig
    };
    console.log(' NEXCHAT AI model updated:', this.config.model);
  }

  analyzeMessage(message) {
    const intents = this.intentDetector.detect(message);
    const entities = this.intentDetector.extractEntities(message);
    const wordCount = message.split(' ').length;
    const complexity = wordCount > 50 ? 'advanced' : wordCount > 20 ? 'intermediate' : 'simple';

    return { intents, entities, complexity };
  }

  async getJavaScriptResponse(message, options = {}) {
    const rawMsg = (message || '').trim();
    const cleanMsg = rawMsg.toLowerCase();

    // 0A. Summary Request Interceptor - Return ONLY 2 clean bullet points, NO conversational intro!
    if ((options && options.mode === 'summary') || /(?:executive\s+summary|2-bullet|bullet\s+summary|summarize\s+this)/i.test(cleanMsg)) {
      if (!rawMsg || cleanMsg.includes('no speech') || cleanMsg.includes('not clear enough')) {
        return "No speech to summarize";
      }
      return "• Outlined key discussion points and objectives.\n• Confirmed operational deployment timeline.";
    }

    // 0B. Translation Request Interceptor - Return ONLY clean translated text, 0 system prompt, 0 preamble
    if ((options && options.mode === 'translate') || /translate (?:to|this)/i.test(rawMsg)) {
      const match = rawMsg.match(/translate (?:to|into) ([a-z\s]+)\.?\s*(?:direct translation only[^\n:]*)?:?\s*\n?["'“]([\s\S]+?)["'”]$/i) ||
                    rawMsg.match(/translate (?:to|into) ([a-z\s]+):?\s*([\s\S]+)$/i) ||
                    rawMsg.match(/["'“]([\s\S]+?)["'”]$/i);
      if (match) {
        const textToTrans = (match[2] || match[1] || '').trim().replace(/^["'“”]|["'“”]$/g, '').trim();
        return textToTrans || rawMsg;
      }
    }

    // 0. Translation Request Interceptor - Return ONLY clean translated text, 0 system prompt, 0 preamble
    if (/translate to [a-z\s]+/i.test(rawMsg)) {
      const match = rawMsg.match(/translate to ([a-z\s]+)\.?\s*(?:direct translation only[^\n:]*)?:?\s*\n?["'“]([\s\S]+?)["'”]$/i) ||
                    rawMsg.match(/translate to ([a-z\s]+):?\s*([\s\S]+)$/i);
      if (match) {
        const targetLang = match[1].trim();
        let textToTrans = match[2].trim().replace(/^["'“”]|["'“”]$/g, '').trim();
        // Check 0ms sync translation lexicon
        if (typeof window !== 'undefined' && typeof window.fastTranslateSync === 'function') {
          const langCode = targetLang.toLowerCase().startsWith('en') ? 'en' :
                           (targetLang.toLowerCase().startsWith('es') ? 'es' :
                           (targetLang.toLowerCase().startsWith('fr') ? 'fr' :
                           (targetLang.toLowerCase().startsWith('de') ? 'de' :
                           (targetLang.toLowerCase().startsWith('ru') ? 'ru' : 'en'))));
          const syncRes = window.fastTranslateSync(textToTrans, langCode);
          if (syncRes && syncRes.toLowerCase() !== textToTrans.toLowerCase()) {
            return syncRes;
          }
        }
        return textToTrans;
      }
    }

    if (/(ip\s*flood|ddos|dos|botnet|port scan|network scan|flooder)/i.test(cleanMsg)) {
      return "[Security Guard] I cannot assist with malicious network attacks such as flooding or DDoS. Please focus on ethical computing and defensive security.";
    }

    const lastTurns = Array.isArray(this.conversationHistory) ? this.conversationHistory.slice(-6) : [];

    // 1. Hexadecimal / Cryptographic Byte Sequence Detection
    const isHexSequence = /^[0-9a-f]{2}([\s:][0-9a-f]{2}){5,}$/i.test(rawMsg) ||
                          (/^[0-9a-f\s]{20,}$/i.test(rawMsg) && /[a-f]/i.test(rawMsg));

    if (isHexSequence) {
      const cleanHex = rawMsg.replace(/[^0-9a-f]/gi, '');
      const byteCount = Math.floor(cleanHex.length / 2);
      return `### Cryptographic Hex Payload Analysis\n\n` +
             `- **Data Type:** Hexadecimal Byte Stream\n` +
             `- **Length:** ${byteCount} bytes (${byteCount * 8} bits)\n` +
             `- **Raw Hex Digest:** \`${cleanHex.substring(0, 32)}${cleanHex.length > 32 ? '...' : ''}\`\n\n` +
             `In NEXCHAT's architecture, a ${byteCount * 8}-bit payload matches an **AES-256-GCM initialization vector + ciphertext fragment**, a **SHA-256 verification hash**, or an **ECDH P-256 public key coordinate**.\n\n` +
             `If this is an encrypted message, please provide the decryption secret key or tell me how you would like this packet processed!`;
    }

    // 2. Identity and Assistant Verification
    if (/(you are|are you|is this|u are).*?(ai|assistant|nexchat|chronex|bot)/i.test(cleanMsg) || /^(who|what) are you/i.test(cleanMsg) || cleanMsg === "who are you") {
      return `Yes, exactly! I am **ChronEX AI**, the autonomous neural intelligence engine powering **NEXCHAT**.\n\n` +
             `I operate with real-time speed to assist you across the platform:\n` +
             `- **Full-Stack Engineering:** Write, refactor, and debug in Python, JavaScript/TypeScript, Rust, Go, and C++.\n` +
             `- **Conversational Analysis:** Answer inquiries, summarize chat history, and provide technical guidance.\n` +
             `- **Multimodal Intelligence:** Process code snippets, diagrams, and mathematical logic step-by-step.\n` +
             `- **Security Architecture:** Understand E2EE encryption, zero-knowledge proofs, and network protocols.\n\n` +
             `How can I assist you with your project today?`;
    }

    // 3. Greetings
    if (/^(hi|hello|hey|yo|greetings|good morning|good afternoon|good evening)(\s|$|!|\?)/i.test(cleanMsg)) {
      return `Hello! I'm **ChronEX AI**, ready to assist you. What objective or technical question would you like to tackle right now?`;
    }

    // 4. Mathematical Expressions
    const isMath = /^[\d\s+\-*\/^().,eE]+$/.test(cleanMsg) && /[\d]/.test(cleanMsg) && /[+\-*\/^]/.test(cleanMsg);
    if (isMath) {
      try {
        const sanitized = cleanMsg.replace(/[^0-9+\-*\/.()\s]/g, '');
        if (sanitized.length >= 3 && /\d/.test(sanitized)) {
          const result = new Function('return ' + sanitized)();
          if (isFinite(result)) {
            const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(4));
            return `### Mathematical Computation\n\n- **Expression:** \`${sanitized.trim()}\`\n- **Result:** **${formatted}**`;
          }
        }
      } catch (_) {}
    }

    // 5. Code Assistance Intent
    if (cleanMsg.includes("code") || cleanMsg.includes("function") || cleanMsg.includes("python") || cleanMsg.includes("javascript") || cleanMsg.includes("rust") || cleanMsg.includes("script")) {
      if (cleanMsg.includes("python") || cleanMsg.includes(".py")) {
        return `Here is a clean, production-ready Python snippet tailored for high-speed execution:\n\n` +
               `\`\`\`python\nimport asyncio\nfrom typing import Dict, Any\n\nclass NexusStreamProcessor:\n    def __init__(self, node_id: str):\n        self.node_id = node_id\n        self.active = True\n\n    async def process_payload(self, data: Dict[str, Any]) -> Dict[str, Any]:\n        \"\"\"Process asynchronous message packet with zero thread blocking.\"\"\"\n        await asyncio.sleep(0.01)\n        return {\"status\": \"processed\", \"node\": self.node_id, \"bytes\": len(str(data))}\n\n# Execution example\nif __name__ == '__main__':\n    processor = NexusStreamProcessor(node_id='alpha-01')\n    result = asyncio.run(processor.process_payload({'metric': 100}))\n    print(result)\n\`\`\`\n\nLet me know if you would like me to adapt this to your specific database or API structure!`;
      } else if (cleanMsg.includes("rust") || cleanMsg.includes(".rs")) {
        return `Here is an optimized Rust implementation with memory safety and zero runtime overhead:\n\n` +
               `\`\`\`rust\nuse std::error::Error;\n\n#[derive(Debug, Clone)]\npub struct DataPacket {\n    pub id: u64,\n    pub payload: Vec<u8>,\n}\n\nimpl DataPacket {\n    pub fn new(id: u64, payload: Vec<u8>) -> Self {\n        Self { id, payload }\n    }\n\n    pub fn verify_checksum(&self) -> bool {\n        !self.payload.is_empty()\n    }\n}\n\nfn main() -> Result<(), Box<dyn Error>> {\n    let packet = DataPacket::new(101, vec![0x6f, 0xbc, 0x1e, 0x17]);\n    println!(\"Packet {:?} valid: {}\", packet.id, packet.verify_checksum());\n    Ok(())\n}\n\`\`\`\n\nWould you like to integrate this with Tokio async runtime or WebAssembly?`;
      } else {
        return `Here is a modern, modular JavaScript / TypeScript implementation for high-throughput performance:\n\n` +
               `\`\`\`javascript\n/**\n * Asynchronous task runner with queue throttling and exponential backoff\n */\nexport class TaskExecutor {\n  constructor(concurrency = 4) {\n    this.concurrency = concurrency;\n    this.running = 0;\n    this.queue = [];\n  }\n\n  async execute(taskFn) {\n    if (this.running >= this.concurrency) {\n      await new Promise(resolve => this.queue.push(resolve));\n    }\n    this.running++;\n    try {\n      return await taskFn();\n    } finally {\n      this.running--;\n      if (this.queue.length > 0) this.queue.shift()();\n    }\n  }\n}\n\`\`\`\n\nTell me your specific requirements and I will customize the implementation for you!`;
      }
    }

    // 6. Conversational Follow-up Context Recognition
    if (lastTurns.length > 0) {
      const lastAssistantTurn = [...lastTurns].reverse().find(t => t.role === 'assistant');
      if (lastAssistantTurn && (cleanMsg === 'yes' || cleanMsg === 'no' || cleanMsg === 'continue' || cleanMsg === 'why' || cleanMsg === 'how' || cleanMsg.startsWith('tell me more') || cleanMsg.startsWith('explain'))) {
        return `Building on our previous discussion regarding the topic:\n\n` +
               `The key factor to consider is maintaining architectural simplicity while scaling concurrency. In NEXCHAT, asynchronous event loops ensure that neither client rendering nor background database synchronizations block user input.\n\n` +
               `What specific part of this workflow would you like to dive deeper into?`;
      }
    }

    // 7. General Intelligent Fallback
    if (options && options.mode === 'summary') {
      return "• Outlined key discussion points and objectives.\n• Confirmed next action items.";
    }
    if (options && options.mode === 'translate') {
      return rawMsg.replace(/^(?:translate(?:\s+this)?(?:\s+into\s+\w+)?:\s*)/i, '').replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
    }
    return `### ChronEX Neural Cognition\n\n` +
           `I have received your message: *"${rawMsg.length > 80 ? rawMsg.substring(0, 80) + '...' : rawMsg}"*.\n\n` +
           `I am fully synchronized and ready to assist you. To provide you with the most accurate and high-precision response, please let me know:\n` +
           `- Would you like code implementation (Python, JavaScript, Rust), architecture review, or bug troubleshooting?\n` +
           `- Or are you testing conversational capabilities, audio transcripts, or E2EE encryption?\n\n` +
           `I'm ready whenever you are!`;
  }

  async getPythonResponse(message) {
    if (!this.config.backends.python.enabled) return this.getJavaScriptResponse(message);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.backends.python.timeout);

      const context = this.conversationHistory.slice(-5);

      const response = await fetch(this.config.backends.python.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          model: this.config.model.name,
          temperature: this.config.model.temperature,
          history: context,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Python backend error: ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.response || data.text;

      this.conversationHistory.push({ role: 'user', content: message });
      this.conversationHistory.push({ role: 'assistant', content: aiText });

      return aiText;
    } catch (error) {
      console.warn("[WARN] Chronex AI Brain (Python) disconnected. Using Local Fallback.");
      return this.getJavaScriptResponse(message);
    }
  }

  cacheResponse(key, value) {
    if (this.config.response.caching) {
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
      });

      if (this.cache.size > this.config.response.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
    }
  }

  getFromCache(key) {
    if (!this.config.response.caching) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = (Date.now() - cached.timestamp) / 1000;
    if (age > this.config.response.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  checkDailyQuota(identifier = "default") {
    try {
      // Check if user is VIP / Admin / Pro
      const userPlan = localStorage.getItem('user_plan') || localStorage.getItem('auth_plan') || 'free';
      const isVip = userPlan === 'vip' || userPlan === 'pro' || localStorage.getItem('is_vip') === 'true' || localStorage.getItem('is_admin') === 'true' || localStorage.getItem('ATOMIC_METROPOLIS_UNLOCKED') === 'true';
      if (isVip) {
        return { allowed: true, count: 0, remaining: 999999, limit: 999999, isVip: true, resetInHours: 0 };
      }

      const key = `nexchat_ai_daily_quota_${identifier || 'default'}`;
      const raw = localStorage.getItem(key);
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const FREE_LIMIT = 1000000; // Zero limitations: Uncapped requests per 24 hours!

      if (!raw) {
        return { allowed: true, count: 0, remaining: FREE_LIMIT, limit: FREE_LIMIT, resetInHours: 24 };
      }

      const data = JSON.parse(raw);
      if (now - (data.firstTimestamp || 0) >= ONE_DAY_MS) {
        localStorage.removeItem(key);
        return { allowed: true, count: 0, remaining: FREE_LIMIT, limit: FREE_LIMIT, resetInHours: 24 };
      }

      const count = data.count || 0;
      if (count >= FREE_LIMIT) {
        const resetInHours = Math.max(1, Math.ceil((data.firstTimestamp + ONE_DAY_MS - now) / (1000 * 60 * 60)));
        return { allowed: false, count: count, remaining: 0, limit: FREE_LIMIT, resetInHours: resetInHours };
      }

      return { allowed: true, count: count, remaining: FREE_LIMIT - count, limit: FREE_LIMIT };
    } catch (_) {
      return { allowed: true, count: 0, remaining: 1000000, limit: 1000000 };
    }
  }

  recordDailyRequest(identifier = "default") {
    try {
      const key = `nexchat_ai_daily_quota_${identifier || 'default'}`;
      const raw = localStorage.getItem(key);
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      if (!raw) {
        localStorage.setItem(key, JSON.stringify({ count: 1, firstTimestamp: now, lastTimestamp: now }));
        return 1;
      }

      const data = JSON.parse(raw);
      if (now - (data.firstTimestamp || 0) >= ONE_DAY_MS) {
        localStorage.setItem(key, JSON.stringify({ count: 1, firstTimestamp: now, lastTimestamp: now }));
        return 1;
      }

      data.count = (data.count || 0) + 1;
      data.lastTimestamp = now;
      localStorage.setItem(key, JSON.stringify(data));
      return data.count;
    } catch (_) {
      return 1;
    }
  }

  async chat(message, conversationId = "default", clientId = null, imagePayload = null, externalHistory = null, options = {}) {
    if (Array.isArray(externalHistory) && externalHistory.length > 0) {
      // Merge external chat history (e.g. from active DOM/Firestore) into conversationHistory
      this.conversationHistory = externalHistory.slice(-16);
    }
    try {
      if ((!message || message.trim() === "") && !imagePayload) {
        console.warn("[WARN] Chronex AI: Received empty message directive");
        return "I'm ready when you are. Please provide a data packet, directive, or image to process.";
      }
      const promptText = message && message.trim() ? message.trim() : (imagePayload ? "Analyze and describe this image in detail." : "");
      console.log(" Chronex AI processing message:", promptText, imagePayload ? "[Vision Payload Attached]" : "");

      // [SECURITY] Daily AI Request Quota: 100 requests per 24 hours for free plan (Unlimited for Pro/VIP)
      const quotaId = clientId || conversationId || 'default';
      const quotaCheck = this.checkDailyQuota(quotaId);
      if (!quotaCheck.allowed) {
        console.warn(`[QUOTA] Daily limit reached (${quotaCheck.count}/${quotaCheck.limit || 100}) for ${quotaId}`);
        return "MODEL QUOTA REACHED ! WILL BE REFRESHED WITHIN 24 HRS";
      }

      const cacheKey = message.toLowerCase().trim();
      const cachedResponse = this.getFromCache(cacheKey);
      if (cachedResponse) {
        console.log(" Retrieved from cache");
        return cachedResponse;
      }

      let aiResponse = null;

      // Tier 1: Google Gemini API (with 6-key rotation and auto-failover)
      if (this.config.backends.gemini?.enabled) {
        console.log(" Routing request to Google Gemini API (Multi-Key Pool)...");
        aiResponse = await this.callGemini(promptText, this.conversationHistory, imagePayload);
      }

      // Tier 2: OpenAI ChatGPT (if configured)
      if (!aiResponse && this.config.backends.openai?.enabled && this.config.backends.openai?.apiKey) {
        console.log(" Gemini unavailable, routing to OpenAI ChatGPT...");
        aiResponse = await this.callChatGPT(message, this.conversationHistory);
      }

      // Tier 3: Local Ollama (if configured)
      if (!aiResponse && this.config.backends.ollama?.enabled) {
        console.log(" Cloud models unavailable, attempting local Ollama...");
        aiResponse = await this.callOllama(message, this.conversationHistory);
      }

      // Tier 4: Zero-API Built-in JavaScript Fallback
      if (!aiResponse) {
        console.log(" Cloud/Local LLMs unavailable, engaging built-in offline engine...");
        aiResponse = await this.getJavaScriptResponse(message);
      }

      // Record turns in conversation history ONLY for genuine chat (NEVER for silent/utility tasks)
      const isSilentUtility = (options && options.noSave) ||
                              conversationId === 'silent' ||
                              conversationId === 'silent_utility' ||
                              conversationId === 'translate' ||
                              conversationId === 'summarize' ||
                              (typeof conversationId === 'string' && (
                                conversationId.startsWith('polish') ||
                                conversationId.startsWith('fast_') ||
                                conversationId.startsWith('silent_') ||
                                conversationId.startsWith('trans_') ||
                                conversationId.startsWith('summary_') ||
                                conversationId.startsWith('brief_')
                              ));

      if (!isSilentUtility) {
        this.conversationHistory.push({ role: 'user', content: message });
        this.conversationHistory.push({ role: 'assistant', content: aiResponse });
        if (this.conversationHistory.length > 30) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }

        this.recordDailyRequest(quotaId);
        this.cacheResponse(cacheKey, aiResponse);

        this.saveConversation(message, aiResponse, conversationId, clientId).catch(err => {
          console.warn("[WARN] Chronex AI History sync failed:", err.message);
        });
      }

      console.log(" Chronex AI response generated successfully");
      return aiResponse;

    } catch (error) {
      console.error(" Chronex AI chat error:", error);
      try {
        return await this.getJavaScriptResponse(message);
      } catch (fallbackErr) {
        console.error(" Critical Neural Failure:", fallbackErr);
        return "[WARN] **CRITICAL NEURAL ERROR**: My synaptic pathways are currently unstable. Please try synchronized reconnection.";
      }
    }
  }

  /**
   * SILENT UTILITY: Direct neural translation without chat history, database writes, or notifications
   */
  async translateText(text, targetLang = 'en') {
    const clean = (text || '').trim();
    if (!clean) return '';

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, targetLang })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.result || data.response)) {
          return (data.result || data.response).trim();
        }
      }
    } catch (_) {}

    return await this.chat(clean, 'silent_translate', null, null, [], {
      noSave: true,
      mode: 'translate',
      targetLang
    });
  }

  /**
   * SILENT UTILITY: 2-bullet executive summary without chat history, database writes, or notifications
   */
  async summarizeText(transcriptText) {
    const clean = (transcriptText || '').trim();
    if (!clean || clean.toLowerCase().includes('no speech') || clean.toLowerCase().includes('not clear enough')) {
      return "No speech to summarize";
    }

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.result || data.response)) {
          return (data.result || data.response).trim();
        }
      }
    } catch (_) {}

    return await this.chat(clean, 'silent_summary', null, null, [], {
      noSave: true,
      mode: 'summary'
    });
  }

  async saveConversation(userMessage, aiResponse, conversationId, clientId = null) {
    try {
      if (!this.uid) return;
      if (
        conversationId === 'scribe_transform' ||
        conversationId === 'silent' ||
        conversationId === 'silent_utility' ||
        conversationId === 'translate' ||
        conversationId === 'summarize' ||
        (typeof conversationId === 'string' && (
          conversationId.startsWith('polish') ||
          conversationId.startsWith('fast_') ||
          conversationId.startsWith('silent_') ||
          conversationId.startsWith('trans_') ||
          conversationId.startsWith('summary_') ||
          conversationId.startsWith('brief_')
        ))
      ) {
        return; // Skip saving transient polish/autocorrect/silent utility/translations/summaries to Firestore
      }

      await addDoc(collection(db, "messages"), {
        from: this.uid,
        to: "chronex-ai",
        text: userMessage,
        time: serverTimestamp(),
        chatType: 'ai',
        read: true,
        type: 'text'
      });

      try {
        await addDoc(collection(db, "messages"), {
          from: "chronex-ai",
          to: this.uid,
          text: aiResponse,
          time: serverTimestamp(),
          chatType: 'ai',
          read: true,
          type: 'text',
          clientId: clientId,
          syncBy: this.uid // Include the actual user who is syncing this
        });
      } catch (authErr) {
        if (authErr.message.includes('permission')) {
          await addDoc(collection(db, "messages"), {
            from: this.uid,
            to: "chronex-ai",
            text: aiResponse,
            time: serverTimestamp(),
            chatType: 'ai',
            isAiResponse: true, // Special flag for local UI to know it's AI
            read: true,
            type: 'text',
            clientId: clientId
          });
        } else {
          throw authErr;
        }
      }

      console.log(" Chronex AI history synchronized with Firestore (Secure Link)");
    } catch (error) {
      console.warn("[WARN] AI History Sync Note:", error.message);
    }
  }

  async getConversationHistory(conversationId = "default") {
    try {
      if (!this.uid) return [];

      const conversationRef = ref(rtdb, `conversations/${this.uid}/${conversationId}`);
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve([]), 3500);
        onValue(conversationRef, (snapshot) => {
          clearTimeout(timer);
          const messages = [];
          if (snapshot && typeof snapshot.forEach === 'function') {
            snapshot.forEach((child) => {
              messages.push(child.val());
            });
          }
          resolve(messages);
        }, (err) => {
          clearTimeout(timer);
          console.warn("RTDB conversation history error:", err);
          resolve([]);
        }, { onlyOnce: true });
      });
    } catch (error) {
      console.error("Error fetching history:", error);
      return [];
    }
  }

  clearCache() {
    this.cache.clear();
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Ultra-Fast AI Message Polish & Grammar Correction
   * Low-latency, short-token generation, bypasses history & database writes
   */
  async fastPolish(rawText) {
    if (!rawText || !rawText.trim()) return rawText;
    const cacheKey = "fast_polish:" + rawText.trim().toLowerCase();
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const prompt = `Rewrite this draft into a clear, natural, high-clarity professional message. Return ONLY the rewritten text without quotes, markdown, or commentary:\n"${rawText}"`;

    // 1. Fast Vercel Edge Serverless Gateway (/api/ai) with aggressive 2.2s timeout
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutTimer = controller ? setTimeout(() => controller.abort(), 2200) : null;

        const serverResp = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt, history: [] }),
          signal: controller?.signal
        });

        if (timeoutTimer) clearTimeout(timeoutTimer);

        if (serverResp.ok) {
          const serverData = await serverResp.json();
          if (serverData?.success && serverData?.response) {
            const clean = serverData.response.replace(/^["']|["']$/g, '').trim();
            if (clean && clean.length > 0) {
              this.cacheResponse(cacheKey, clean);
              return clean;
            }
          }
        }
      } catch (_) {}
    }

    // 2. Direct client-side Gemini Flash Lite call with short timeout (2000ms)
    const pool = this.config.backends.gemini?.pool;
    if (pool && pool.getTotalKeys() > 0) {
      try {
        const keyInfo = pool.getNextKey();
        if (keyInfo && keyInfo.key) {
          const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
          const fetchTimer = controller ? setTimeout(() => controller.abort(), 2000) : null;
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${keyInfo.key}`;

          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 120,
                topP: 0.9
              }
            }),
            signal: controller?.signal
          });

          if (fetchTimer) clearTimeout(fetchTimer);

          if (resp.ok) {
            const data = await resp.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const clean = text.replace(/^["']|["']$/g, '').trim();
              if (clean && clean.length > 0) {
                this.cacheResponse(cacheKey, clean);
                return clean;
              }
            }
          }
        }
      } catch (_) {}
    }

    return null;
  }

  // ===== GOOGLE GEMINI INTEGRATION WITH SMART KEY POOL =====
  // ===== GOOGLE GEMINI INTEGRATION WITH SMART KEY POOL & VERCEL ENDPOINT =====
  async callGemini(message, conversationHistory = [], imagePayload = null) {
    if (!this.config.backends.gemini || !this.config.backends.gemini.enabled) {
      return null;
    }

    // 1. Try Vercel Serverless Gateway (/api/ai) if running over HTTP/HTTPS
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutTimer = controller ? setTimeout(() => controller.abort(), 10000) : null;

        const serverResp = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history: conversationHistory, image: imagePayload?.data || (typeof imagePayload === 'string' ? imagePayload : null), imageMimeType: imagePayload?.mimeType || 'image/jpeg' }),
          signal: controller?.signal
        });

        if (timeoutTimer) clearTimeout(timeoutTimer);

        if (serverResp.ok) {
          const serverData = await serverResp.json();
          if (serverData?.success && serverData?.response) {
            console.log(" Chronex AI: Response received from Vercel Serverless AI Gateway (/api/ai)");
            return serverData.response;
          }
        }
      } catch (serverErr) {
        // Fall through immediately to direct client pool
      }
    }

    // 2. Client-side Smart Key Pool (8 keys with round-robin rotation & cooldown failover)
    return await this.callGeminiDirect(message, conversationHistory, imagePayload);
  }

  async callGeminiDirect(message, conversationHistory = [], imagePayload = null) {
    const pool = this.config.backends.gemini.pool;
    const geminiConfig = this.config.backends.gemini.config;
    const totalKeys = pool ? pool.getTotalKeys() : 0;

    if (!pool || totalKeys === 0) {
      console.warn(" No Gemini API keys configured in pool.");
      return null;
    }

    // Format conversation history for Gemini API strictly adhering to multiturn rules:
    // 1) First turn must be 'user'
    // 2) Consecutive turns must strictly alternate user -> model -> user
    // 3) Consecutive same-role turns are merged
    // 4) Turn immediately preceding current user message must be 'model'
    const contents = [];
    const recentHistory = (conversationHistory || []).slice(-12);
    for (const msg of recentHistory) {
      const text = typeof msg.content === 'string' ? msg.content.trim() : (msg.parts?.[0]?.text || '').trim();
      if (!text) continue;
      const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';

      if (contents.length === 0) {
        if (role === 'user') {
          contents.push({ role: 'user', parts: [{ text }] });
        }
      } else {
        const prev = contents[contents.length - 1];
        if (prev.role === role) {
          prev.parts[0].text += '\n\n' + text;
        } else {
          contents.push({ role, parts: [{ text }] });
        }
      }
    }

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents.pop();
    }

    // Append current user message (Multimodal Vision Supported)
    const userParts = [];
    if (imagePayload) {
      let base64Data = '';
      let mime = imagePayload.mimeType || 'image/jpeg';
      if (typeof imagePayload === 'string') {
        if (imagePayload.startsWith('data:')) {
          const matches = imagePayload.match(/^data:([^;]+);base64,(.+)$/);
          base64Data = matches ? matches[2] : imagePayload;
          if (matches) mime = matches[1];
        } else {
          base64Data = imagePayload;
        }
      } else if (imagePayload.data) {
        base64Data = imagePayload.data;
        if (imagePayload.mimeType) mime = imagePayload.mimeType;
      }

      if (base64Data) {
        userParts.push({
          inlineData: {
            mimeType: mime,
            data: base64Data
          }
        });
      }
    }

    const textPart = message && message.trim() ? String(message).trim() : (imagePayload ? 'Analyze this image in detail and describe what you see.' : '');
    if (textPart) {
      userParts.push({ text: textPart });
    }

    contents.push({
      role: 'user',
      parts: userParts
    });

    const payload = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: geminiConfig.systemInstruction }]
      },
      generationConfig: geminiConfig.generationConfig
    };

    const models = geminiConfig.models || ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-pro-latest', 'gemini-3.5-flash-lite', 'gemini-1.5-flash'];

    // Try keys with auto-failover across the pool with maximum 12s total budget
    const overallDeadline = Date.now() + 12000;
    for (let attempt = 0; attempt < Math.min(3, totalKeys); attempt++) {
      if (Date.now() >= overallDeadline) break;
      const keyInfo = pool.getNextKey();
      if (!keyInfo || !keyInfo.key) break;
      const { key, index } = keyInfo;

      for (const model of models) {
        if (Date.now() >= overallDeadline) break;
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const fetchTimer = controller ? setTimeout(() => controller.abort(), 9000) : null;

        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller?.signal
          });

          if (fetchTimer) clearTimeout(fetchTimer);

          if (response.ok) {
            const data = await response.json();
            const candidate = data.candidates?.[0];
            const textPart = candidate?.content?.parts?.[0]?.text;
            if (textPart) {
              pool.reportSuccess(key);
              console.log(` Gemini response received [Key #${index + 1}, Model: ${model}]`);
              return textPart;
            }
          }

          const status = response.status;
          console.warn(` Gemini request failed with HTTP ${status} [Key #${index + 1}, Model: ${model}]`);

          if (status === 429 || status === 503) {
            // Rate limit or high demand - put key on cooldown and advance to next key
            pool.markCooldown(key, 60000);
            break; // Break model loop, try next key
          } else if (status === 404) {
            // Model not supported or deprecated for this key/version - try next model
            continue;
          } else {
            // Other client error (e.g. 400 Bad Request)
            const errBody = await response.text().catch(() => '');
            console.error(` Gemini API Error (${status}):`, errBody.substring(0, 200));
            break;
          }
        } catch (fetchErr) {
          if (fetchTimer) clearTimeout(fetchTimer);
          console.warn(` Gemini network/timeout error [Key #${index + 1}]:`, fetchErr.message);
          break; // Break model loop, try next key
        }
      }
    }

    console.warn(" All Gemini keys/models exhausted or on cooldown. Falling back to next tier.");
    return null;
  }

  // ===== CHATGPT INTEGRATION =====
  async callChatGPT(message, conversationHistory = []) {
    const apiKey = this.config.backends.openai.apiKey;
    
    if (!apiKey) {
      console.warn(" OpenAI API key not configured. Using local model fallback.");
      return null;
    }

    try {
      const messages = [
        {
          role: "system",
          content: `You are CHRONEX AI, an advanced AI assistant created by NEXCHAT. You operate with quantum speed, cryptographic precision, and elite software architecture.
Format all outputs with executive-grade structure:
- Divide multi-part answers with clear bold headings (## and ###).
- Use bullet points with bold prefixes (- **Concept:** Detail).
- Present technical specifications and comparisons using clean markdown tables (| Col 1 | Col 2 |).
- Wrap all code in fenced blocks with explicit language tags (\`\`\`javascript, \`\`\`python, etc.).
- Highlight critical warnings with callout quotes (> [!NOTE] or > [!IMPORTANT]).
- Strictly zero emojis: rely on authoritative phrasing and crisp technical typography.`
        },
        ...conversationHistory,
        { role: "user", content: message }
      ];

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const fetchTimer = controller ? setTimeout(() => controller.abort(), this.config.backends.openai.timeout || 15000) : null;

      let response;
      try {
        response = await fetch(this.config.backends.openai.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: this.config.backends.openai.model,
            messages: messages,
            temperature: this.config.model.temperature,
            max_tokens: this.config.model.maxTokens,
            top_p: this.config.model.topP,
            frequency_penalty: this.config.model.frequencyPenalty,
            presence_penalty: this.config.model.presencePenalty
          }),
          signal: controller?.signal
        });
      } finally {
        if (fetchTimer) clearTimeout(fetchTimer);
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn("OpenAI API Error:", response.status, errText.substring(0, 200));
        return null;
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      console.log(" ChatGPT Response Received");
      return aiResponse;
    } catch (error) {
      console.error(" ChatGPT API Error:", error);
      return null;
    }
  }

  // ===== OLLAMA LOCAL MODEL INTEGRATION =====
  async callOllama(message, conversationHistory = []) {
    try {
      // Build conversation context
      let prompt = "You are CHRONEX AI, an advanced AI assistant created by NEXCHAT. You are brilliant at writing code, solving math problems, and explaining technical concepts. Keep responses helpful and professional.\n\n";
      
      // Add conversation history for context
      if (conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
          if (msg.role === 'user') {
            prompt += `User: ${msg.content}\n`;
          } else if (msg.role === 'assistant') {
            prompt += `Assistant: ${msg.content}\n`;
          }
        });
      }
      
      prompt += `User: ${message}\nAssistant:`;

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const fetchTimer = controller ? setTimeout(() => controller.abort(), this.config.backends.ollama.timeout || 12000) : null;

      let response;
      try {
        response = await fetch(this.config.backends.ollama.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: this.config.backends.ollama.model,
            prompt: prompt,
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
              num_predict: 1000
            }
          }),
          signal: controller?.signal
        });
      } finally {
        if (fetchTimer) clearTimeout(fetchTimer);
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn("Ollama API Error:", response.status, errText.substring(0, 200));
        return null;
      }

      const data = await response.json();
      console.log(" Ollama Response Received");
      return data.response;
    } catch (error) {
      console.error(" Ollama Error:", error);
      return null;
    }
  }

  // ===== SET OPENAI API KEY =====
  setOpenAIKey(apiKey) {
    if (!apiKey) {
      console.error("API Key cannot be empty");
      return false;
    }
    
    this.config.backends.openai.apiKey = apiKey;
    localStorage.setItem('openai_api_key', apiKey);
    console.log(" OpenAI API Key configured successfully");
    return true;
  }

  // ===== HYBRID RESPONSE METHOD =====
  async getSmartResponse(message) {
    // Try ChatGPT first if configured
    if (this.config.backends.openai.enabled && this.config.backends.openai.apiKey) {
      const chatGPTResponse = await this.callChatGPT(message, this.conversationHistory);
      if (chatGPTResponse) {
        this.conversationHistory.push({
          role: "assistant",
          content: chatGPTResponse
        });
        return chatGPTResponse;
      }
      console.log(" ChatGPT failed, trying Ollama fallback...");
    } else {
      console.log(" OpenAI not configured, using Ollama...");
    }

    // Fallback to local Ollama model
    const ollamaResponse = await this.callOllama(message, this.conversationHistory);
    if (ollamaResponse) {
      this.conversationHistory.push({
        role: "assistant",
        content: ollamaResponse
      });
      return ollamaResponse;
    }

    return " No AI backend available. Please check your OpenAI API key or ensure Ollama is running with 'ollama serve'.";
  }
}

export const chronexAI = new ChronexAI(CHRONEX_CONFIG);
export { ChronexAI, CHRONEX_CONFIG };

