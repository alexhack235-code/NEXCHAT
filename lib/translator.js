/**
 * ============================================================================
 * NEXCHAT - ROTATING 10-KEY TRANSLATION & AI ENGINE
 * ============================================================================
 * 
 * Features:
 * - Reads GROQ_KEYS from process.env (comma-separated list of 10 keys)
 * - Automatic Round-Robin rotation with 60s cooldown on 429 / 401 / Timeout (>10s)
 * - Multi-language: English, Pidgin, French, Yoruba, Igbo, Hausa, Spanish, Arabic, etc.
 * - Slang, cyber terminology, emojis, and dialect preservation
 * - Gemini Backup Fallback (GEMINI_BACKUP_KEY)
 * - Strict zero-key leakage: all telemetry uses masked keys (gsk_***...****)
 * ============================================================================
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_GEMINI_KEYS } from '../gemini-config.js';

// Lightweight Language Normalizer for serverless backend
export function normalizeLangCode(lang) {
  if (!lang || typeof lang !== 'string') return 'en';
  const l = lang.trim().toLowerCase();
  const map = {
    'spanish': 'es', 'es': 'es', 'español': 'es',
    'french': 'fr', 'fr': 'fr', 'français': 'fr',
    'german': 'de', 'de': 'de', 'deutsch': 'de',
    'italian': 'it', 'it': 'it', 'italiano': 'it',
    'portuguese': 'pt', 'pt': 'pt', 'português': 'pt',
    'english': 'en', 'en': 'en',
    'russian': 'ru', 'ru': 'ru',
    'arabic': 'ar', 'ar': 'ar',
    'hindi': 'hi', 'hi': 'hi',
    'chinese': 'zh', 'zh': 'zh', 'chinese (mandarin)': 'zh',
    'japanese': 'ja', 'ja': 'ja',
    'nigerian pidgin': 'pcm', 'pidgin': 'pcm', 'pcm': 'pcm',
    'yoruba': 'yo', 'yo': 'yo',
    'hausa': 'ha', 'ha': 'ha',
    'igbo': 'ig', 'ig': 'ig',
    'swahili': 'sw', 'sw': 'sw',
    'tagalog': 'tl', 'tl': 'tl',
    'pakistan': 'ur', 'urdu': 'ur', 'pk': 'ur', 'ur': 'ur',
    'indonesia': 'id', 'indonesian': 'id', 'bahasa': 'id', 'id': 'id',
    'malaysia': 'ms', 'malay': 'ms', 'ms': 'ms', 'my': 'ms',
    'germany': 'de',
    'romania': 'ro', 'romanian': 'ro', 'ro': 'ro',
    'turkey': 'tr', 'turkish': 'tr', 'tr': 'tr',
    'korea': 'ko', 'korean': 'ko', 'ko': 'ko'
  };
  return map[l] || l;
}

// Common conversational phrases for 0ms server-side quick resolution
const SERVER_QUICK_PHRASES = {
  es: { 'hello': 'hola', 'hi': 'hola', 'how are you': '¿cómo estás?', 'good morning': 'buenos días', 'good night': 'buenas noches', 'thank you': 'gracias', 'yes': 'sí', 'no': 'no' },
  fr: { 'hello': 'bonjour', 'hi': 'salut', 'how are you': 'comment allez-vous ?', 'good morning': 'bonjour', 'good night': 'bonne nuit', 'thank you': 'merci', 'yes': 'oui', 'no': 'non' },
  de: { 'hello': 'hallo', 'hi': 'hallo', 'how are you': 'wie geht es dir?', 'good morning': 'guten morgen', 'good night': 'gute nacht', 'thank you': 'danke', 'yes': 'ja', 'no': 'nein' },
  pcm: { 'hello': 'how far', 'hi': 'kedu', 'how are you': 'how you dey?', 'thank you': 'thank you plenty', 'no problem': 'no wahala' },
  yo: { 'hello': 'bawo', 'good morning': 'e kaaro', 'thank you': 'o se' },
  ig: { 'hello': 'kedu', 'good morning': 'ututu oma', 'thank you': 'daalu' },
  ha: { 'hello': 'sannu', 'good morning': 'ina kwana', 'thank you': 'na gode' },
  ar: { 'hello': 'مرحبا', 'welcome': 'أهلا وسهلا', 'thank you': 'شكرا' }
};

export function fastTranslateSync(rawText, targetLang = 'en') {
  if (!rawText || typeof rawText !== 'string') return null;
  const clean = rawText.trim().toLowerCase();
  const norm = normalizeLangCode(targetLang);
  const dict = SERVER_QUICK_PHRASES[norm];
  if (dict && dict[clean]) return dict[clean];
  return null;
}

// Persistent High-Performance HTTP Agent with Keep-Alive for sub-millisecond TLS socket reuse
const httpsKeepAliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 25,
  timeout: 15000,
  keepAliveMsecs: 60000
});

// Server-Side High-Speed In-Memory LRU Cache (< 0.01ms)
export const serverTranslationLRU = new Map();
const MAX_SERVER_CACHE = 10000;

const startTime = Date.now();
let keyRotationIndex = 0;
let totalTranslations = 0;
let lastTranslationTime = null;

// Map: key -> { index, masked, status: 'healthy'|'dead', cooldownUntil, successes, failures }
const keysStatusMap = new Map();

/**
 * Loads .env variables if not already in process.env
 */
function loadLocalEnv() {
  try {
    const candidates = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env')
    ];
    for (const envPath of candidates) {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    }
  } catch (_) {}
}

loadLocalEnv();

/**
 * Masks key for safe telemetry logging
 */
export function maskKey(key) {
  if (!key || typeof key !== 'string') return 'none';
  if (key.length <= 12) return '***';
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

/**
 * Extracts the 10 Groq Keys from process.env.GROQ_KEYS (split by ",")
 */
export function getGroqKeyPool() {
  const pool = [];
  const rawGroqKeys = process.env.GROQ_KEYS;

  if (rawGroqKeys) {
    const splits = rawGroqKeys.split(',');
    for (const k of splits) {
      const trimmed = k.trim();
      if (trimmed && !pool.includes(trimmed)) {
        pool.push(trimmed);
      }
    }
  }

  // Also support individual GROQ_KEY_1..10 or Api1..10
  if (pool.length < 10) {
    for (let i = 1; i <= 10; i++) {
      const single = process.env[`GROQ_KEY_${i}`] || process.env[`Api${i}`];
      if (single && single.trim() && !pool.includes(single.trim())) {
        pool.push(single.trim());
      }
    }
  }

  return pool;
}

/**
 * Retrieves full Gemini Key Pool (from environment and fallback configuration)
 */
export function getGeminiKeyPool() {
  const pool = [];
  const add = (k) => {
    if (!k || typeof k !== 'string') return;
    const clean = k.trim();
    if (clean && clean.length > 8 && !pool.includes(clean)) {
      pool.push(clean);
    }
  };
  const rawList = process.env.GEMINI_API_KEYS;
  if (rawList) {
    rawList.split(',').forEach(add);
  }
  add(process.env.GEMINI_API_KEY);
  add(process.env.GEMINI_BACKUP_KEY);
  add(process.env.GOOGLE_API_KEY);
  if (Array.isArray(DEFAULT_GEMINI_KEYS)) {
    DEFAULT_GEMINI_KEYS.forEach(add);
  }
  return pool;
}

/**
 * Retrieves the Backup Gemini Key
 */
export function getGeminiBackupKey() {
  const pool = getGeminiKeyPool();
  return pool[0] || process.env.GEMINI_BACKUP_KEY || process.env.GEMINI_API_KEY || '';
}

let geminiRotationIndex = 0;

/**
 * Dynamic Multi-Provider Round-Robin Key Selector with Cooldown Failover
 * Rotates across healthy Groq keys and healthy Gemini keys seamlessly.
 */
export function getNextKey() {
  const groqPool = getGroqKeyPool();
  const geminiPool = getGeminiKeyPool();
  const now = Date.now();

  [...groqPool, ...geminiPool].forEach((k, idx) => {
    if (!keysStatusMap.has(k)) {
      keysStatusMap.set(k, {
        index: idx + 1,
        masked: maskKey(k),
        status: 'healthy',
        cooldownUntil: 0,
        failures: 0,
        successes: 0,
        lastUsed: 0
      });
    }
  });

  // Revive expired quarantined keys
  for (const [, meta] of keysStatusMap.entries()) {
    if (meta.status === 'dead' && now >= meta.cooldownUntil) {
      meta.status = 'healthy';
      meta.cooldownUntil = 0;
    }
  }

  // 1. Try healthy Groq keys
  const healthyGroqKeys = groqPool.filter(k => {
    const meta = keysStatusMap.get(k);
    return !meta || meta.status === 'healthy';
  });

  if (healthyGroqKeys.length > 0) {
    const selectedKey = healthyGroqKeys[keyRotationIndex % healthyGroqKeys.length];
    keyRotationIndex = (keyRotationIndex + 1) % healthyGroqKeys.length;
    const meta = keysStatusMap.get(selectedKey);
    if (meta) meta.lastUsed = now;
    return { key: selectedKey, maskedKey: maskKey(selectedKey), provider: 'groq' };
  }

  // 2. Try healthy Gemini keys
  const healthyGeminiKeys = geminiPool.filter(k => {
    const meta = keysStatusMap.get(k);
    return !meta || meta.status === 'healthy';
  });

  if (healthyGeminiKeys.length > 0) {
    const selectedKey = healthyGeminiKeys[geminiRotationIndex % healthyGeminiKeys.length];
    geminiRotationIndex = (geminiRotationIndex + 1) % healthyGeminiKeys.length;
    const meta = keysStatusMap.get(selectedKey);
    if (meta) meta.lastUsed = now;
    return { key: selectedKey, maskedKey: maskKey(selectedKey), provider: 'gemini' };
  }

  // 3. If all keys are currently in cooldown, recover the key with the earliest cooldown expiry
  const allKeys = [...geminiPool, ...groqPool];
  if (allKeys.length === 0) {
    throw new Error('No Groq or Gemini API keys configured.');
  }

  let soonestKey = allKeys[0];
  let minCooldown = Infinity;
  for (const k of allKeys) {
    const meta = keysStatusMap.get(k);
    const cd = meta ? meta.cooldownUntil : 0;
    if (cd < minCooldown) {
      minCooldown = cd;
      soonestKey = k;
    }
  }

  const meta = keysStatusMap.get(soonestKey);
  if (meta) {
    meta.status = 'healthy';
    meta.cooldownUntil = 0;
    meta.lastUsed = now;
  }
  const isGroq = groqPool.includes(soonestKey);
  return { key: soonestKey, maskedKey: maskKey(soonestKey), provider: isGroq ? 'groq' : 'gemini' };
}

export function markKeyDead(key, status = 429, reason = 'Rate limit') {
  const meta = keysStatusMap.get(key);
  if (meta) {
    meta.status = 'dead';
    meta.failures++;
    meta.cooldownUntil = Date.now() + 60000; // 60 seconds quarantine
    meta.lastFailureReason = `${status}: ${reason}`;
  }
}

export function markKeyHealthy(key) {
  const meta = keysStatusMap.get(key);
  if (meta) {
    meta.status = 'healthy';
    meta.successes++;
    meta.cooldownUntil = 0;
  }
}

export function getHealthyKeysRatio() {
  const pool = getGroqKeyPool();
  if (pool.length === 0) return '0/10';
  const now = Date.now();
  let healthy = 0;
  for (const k of pool) {
    const meta = keysStatusMap.get(k);
    if (!meta || meta.status === 'healthy' || now >= meta.cooldownUntil) {
      healthy++;
    }
  }
  return `${healthy}/${pool.length}`;
}

/**
 * Universal Groq / Gemini Completion Caller (Sub-second non-reasoning models)
 */
export function callGroqAI(apiKey, messages, options = {}) {
  return new Promise((resolve, reject) => {
    const model = options.model || 'llama-3.1-8b-instant';
    const payload = JSON.stringify({
      model,
      messages,
      temperature: options.temperature !== undefined ? options.temperature : 0.1,
      max_tokens: options.max_tokens || 512
    });

    let timer = null;
    const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      agent: options.agent || httpsKeepAliveAgent,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'NEXCHAT-Engine/2.0',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 8000
    }, (res) => {
      clearTimeout(timer);
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            const content = parsed?.choices?.[0]?.message?.content || '';
            resolve({ success: true, text: content });
          } catch (err) {
            reject({ status: 500, message: 'Invalid JSON response from Groq' });
          }
        } else {
          reject({ status: res.statusCode, message: data });
        }
      });
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      reject({ status: 503, message: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({ status: 408, message: 'Groq request timed out (>8s)' });
    });

    timer = setTimeout(() => {
      req.destroy();
      reject({ status: 408, message: 'Groq request timed out (>8s)' });
    }, 8500);

    req.write(payload);
    req.end();
  });
}

/**
 * Gemini Backup Caller with Candidate Flash Models
 */
export async function callGeminiAI(apiKey, systemInstruction, userPrompt, options = {}) {
  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];
  let lastErr = null;

  for (const model of candidateModels) {
    try {
      return await new Promise((resolve, reject) => {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const payload = JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: options.temperature !== undefined ? options.temperature : 0.65,
            maxOutputTokens: options.max_tokens || 2048
          }
        });

        let timer = null;
        const req = https.request(endpoint, {
          method: 'POST',
          agent: httpsKeepAliveAgent,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: 8000
        }, (res) => {
          clearTimeout(timer);
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const parsed = JSON.parse(data);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                resolve({ success: true, text });
              } catch (err) {
                reject({ status: 500, message: 'Invalid Gemini JSON' });
              }
            } else {
              reject({ status: res.statusCode, message: data });
            }
          });
        });

        req.on('error', (err) => {
          clearTimeout(timer);
          reject({ status: 503, message: err.message });
        });

        req.on('timeout', () => {
          req.destroy();
          reject({ status: 408, message: 'Gemini timed out (>8s)' });
        });

        timer = setTimeout(() => {
          req.destroy();
          reject({ status: 408, message: 'Gemini timed out (>8s)' });
        }, 8500);

        req.write(payload);
        req.end();
      });
    } catch (err) {
      lastErr = err;
      if (err.status === 404 || err.status === 400) {
        // Try next candidate model
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error('All Gemini candidate models failed');
}

/**
 * Autonomous Multi-Language Translation Function
 * Supports English, Pidgin, French, Yoruba, Igbo, Hausa, Spanish, Arabic, etc.
 */
export async function translate(text = '', targetLang = 'English', sourceLang = 'auto') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      translatedText: '',
      detectedLang: 'unknown',
      targetLang
    };
  }

  const startTimeMs = Date.now();
  const clean = text.trim();
  const normTarget = normalizeLangCode(targetLang);
  const cacheKey = `${normTarget}:${clean.toLowerCase()}`;

  // Tier 0: Server-side in-memory LRU cache (< 0.01ms instant hit)
  if (serverTranslationLRU.has(cacheKey)) {
    const hit = serverTranslationLRU.get(cacheKey);
    serverTranslationLRU.delete(cacheKey);
    serverTranslationLRU.set(cacheKey, hit);
    return {
      translatedText: hit.translatedText,
      detectedLang: hit.detectedLang || 'auto',
      targetLang: hit.targetLang || targetLang,
      timeTaken: '0.00s',
      keysHealthy: getHealthyKeysRatio(),
      cached: true
    };
  }

  // Tier 1: 0ms Synchronous Phrase Dictionary match (< 0.05ms)
  const syncMatch = fastTranslateSync(clean, normTarget);
  if (syncMatch) {
    const outcome = {
      translatedText: syncMatch,
      detectedLang: 'auto',
      targetLang: targetLang,
      timeTaken: '0.00s',
      keysHealthy: getHealthyKeysRatio(),
      dictionary: true
    };
    if (serverTranslationLRU.size >= MAX_SERVER_CACHE) {
      const oldestKey = serverTranslationLRU.keys().next().value;
      serverTranslationLRU.delete(oldestKey);
    }
    serverTranslationLRU.set(cacheKey, outcome);
    return outcome;
  }

  const systemPrompt = `You are the NEXCHAT Neural Real-Time Translation Engine.
Translate the input text cleanly and accurately into ${targetLang}.
RULES:
1. Preserve natural slang, internet culture, cyber keywords, emojis, and tone.
2. If translating to Nigerian Pidgin, use natural, authentic Pidgin phrasing (e.g., "Wetin dey happen", "You dey hear me", "No wahala").
3. If translating to Yoruba, Igbo, Hausa, French, Spanish, Arabic, use natural idiomatic fluency.
4. Auto-detect the source language.
5. Return ONLY a valid JSON object matching:
{"translatedText": "translated string", "detectedLang": "name of source language"}`;

  const userPrompt = `Text to translate:
"""${clean}"""`;

  let translatedResult = null;
  let detectedLang = 'auto';

  // Try rotating keys up to 10 attempts
  const maxRetries = 10;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const active = getNextKey();

    try {
      let rawText = '';
      if (active.provider === 'gemini') {
        const gem = await callGeminiAI(active.key, systemPrompt, userPrompt);
        rawText = gem.text;
      } else {
        const dynamicMaxTokens = Math.min(512, Math.max(128, Math.ceil(clean.length * 3)));
        const groq = await callGroqAI(active.key, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ], {
          model: 'llama-3.1-8b-instant',
          max_tokens: dynamicMaxTokens,
          temperature: 0.1
        });
        rawText = groq.text;
      }

      if (rawText) {
        let cleaned = rawText.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        }
        try {
          const parsed = JSON.parse(cleaned);
          if (parsed && parsed.translatedText) {
            translatedResult = parsed.translatedText;
            detectedLang = parsed.detectedLang || 'auto';
            markKeyHealthy(active.key);
            break;
          }
        } catch (_) {
          // Plain text fallback
          translatedResult = cleaned;
          markKeyHealthy(active.key);
          break;
        }
      }
    } catch (err) {
      const status = err.status || 500;
      markKeyDead(active.key, status, err.message || 'Error');
    }
  }

  // Fallback fast neural translator (Google GTX) when Groq/Gemini keys are rate-limited or restricted
  if (!translatedResult && normTarget && normTarget !== 'pcm' && normTarget !== 'pidgin') {
    try {
      const apiTarget = normTarget === 'zh' ? 'zh-CN' : normTarget;
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(apiTarget)}&dt=t&q=${encodeURIComponent(clean)}`;
      const gtxData = await new Promise((resolve, reject) => {
        let settled = false;
        const req = https.get(gtxUrl, { agent: httpsKeepAliveAgent, timeout: 3500 }, (res) => {
          let raw = '';
          res.on('data', c => raw += c);
          res.on('end', () => {
            if (settled) return;
            settled = true;
            if (res.statusCode === 200) {
              try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
            } else {
              reject(new Error(`GTX HTTP ${res.statusCode}`));
            }
          });
        });
        req.on('error', (err) => { if (!settled) { settled = true; reject(err); } });
        req.on('timeout', () => { req.destroy(); if (!settled) { settled = true; reject(new Error('GTX timeout')); } });
      });
      const joined = Array.isArray(gtxData?.[0]) ? gtxData[0].map(item => item?.[0] || '').filter(Boolean).join('').trim() : '';
      if (joined && joined.toLowerCase() !== clean.toLowerCase()) {
        translatedResult = joined;
        if (typeof gtxData?.[2] === 'string') detectedLang = gtxData[2];
      }
    } catch (_) {}
  }

  const success = Boolean(translatedResult);
  if (success && translatedResult) {
    totalTranslations++;
    lastTranslationTime = Date.now();
    if (serverTranslationLRU.size >= MAX_SERVER_CACHE) {
      const oldestKey = serverTranslationLRU.keys().next().value;
      serverTranslationLRU.delete(oldestKey);
    }
    serverTranslationLRU.set(cacheKey, {
      translatedText: translatedResult,
      detectedLang,
      targetLang
    });
  }

  const elapsed = `${((Date.now() - startTimeMs) / 1000).toFixed(2)}s`;

  return {
    translatedText: success ? translatedResult : clean,
    detectedLang,
    targetLang,
    timeTaken: elapsed,
    keysHealthy: getHealthyKeysRatio()
  };
}

/**
 * Health Telemetry Check
 */
export function checkHealth() {
  return {
    status: 'live',
    keysHealthy: getHealthyKeysRatio(),
    uptime: process.uptime ? Math.floor(process.uptime()) : Math.floor((Date.now() - startTime) / 1000),
    totalTranslations,
    lastTranslation: lastTranslationTime ? new Date(lastTranslationTime).toISOString() : 'Never'
  };
}
