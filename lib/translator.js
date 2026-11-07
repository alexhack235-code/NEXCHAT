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
    const envPath = path.resolve(process.cwd(), '.env');
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
 * Retrieves the Backup Gemini Key
 */
export function getGeminiBackupKey() {
  return process.env.GEMINI_BACKUP_KEY || process.env.GEMINI_API_KEY || '';
}

/**
 * Round-robin key selection with 60s quarantine
 */
export function getNextKey() {
  const pool = getGroqKeyPool();
  if (pool.length === 0) {
    // If no Groq keys, fallback to Gemini
    const gemini = getGeminiBackupKey();
    if (gemini) {
      return { key: gemini, maskedKey: maskKey(gemini), provider: 'gemini' };
    }
    throw new Error('No Groq or Gemini API keys configured.');
  }

  const now = Date.now();

  pool.forEach((k, idx) => {
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

  // Revive expired keys
  for (const [, meta] of keysStatusMap.entries()) {
    if (meta.status === 'dead' && now >= meta.cooldownUntil) {
      meta.status = 'healthy';
      meta.cooldownUntil = 0;
    }
  }

  const healthyKeys = pool.filter(k => {
    const meta = keysStatusMap.get(k);
    return !meta || meta.status === 'healthy';
  });

  if (healthyKeys.length === 0) {
    // If all Groq keys are rate-limited, try Gemini backup
    const gemini = getGeminiBackupKey();
    if (gemini) {
      return { key: gemini, maskedKey: maskKey(gemini), provider: 'gemini' };
    }
    // Otherwise pick the earliest recovering Groq key
    const firstKey = pool[0];
    const meta = keysStatusMap.get(firstKey);
    if (meta) { meta.status = 'healthy'; meta.cooldownUntil = 0; }
    return { key: firstKey, maskedKey: maskKey(firstKey), provider: 'groq' };
  }

  const selectedKey = healthyKeys[keyRotationIndex % healthyKeys.length];
  keyRotationIndex = (keyRotationIndex + 1) % healthyKeys.length;

  const meta = keysStatusMap.get(selectedKey);
  if (meta) meta.lastUsed = now;

  return { key: selectedKey, maskedKey: maskKey(selectedKey), provider: 'groq' };
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
 * Universal Groq / Gemini Completion Caller
 */
export function callGroqAI(apiKey, messages, options = {}) {
  return new Promise((resolve, reject) => {
    // Cascade supported models: gpt-oss-120b, gpt-oss-20b, llama-3.3-70b-versatile, qwen
    const model = options.model || 'openai/gpt-oss-120b';
    const payload = JSON.stringify({
      model,
      messages,
      temperature: options.temperature !== undefined ? options.temperature : 0.2,
      max_tokens: options.max_tokens || 1024
    });

    let timer = null;
    const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'NEXCHAT-Engine/2.0',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
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
      reject({ status: 408, message: 'Groq request timed out (>10s)' });
    });

    timer = setTimeout(() => {
      req.destroy();
      reject({ status: 408, message: 'Groq request timed out (>10s)' });
    }, 10500);

    req.write(payload);
    req.end();
  });
}

/**
 * Gemini Backup Caller
 */
export function callGeminiAI(apiKey, systemInstruction, userPrompt) {
  return new Promise((resolve, reject) => {
    const model = 'gemini-2.0-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
    });

    let timer = null;
    const req = https.request(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
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
      reject({ status: 408, message: 'Gemini timed out (>10s)' });
    });

    timer = setTimeout(() => {
      req.destroy();
      reject({ status: 408, message: 'Gemini timed out (>10s)' });
    }, 10500);

    req.write(payload);
    req.end();
  });
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
        const groq = await callGroqAI(active.key, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]);
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

  const success = Boolean(translatedResult);
  if (success) {
    totalTranslations++;
    lastTranslationTime = Date.now();
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
