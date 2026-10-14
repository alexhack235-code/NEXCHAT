import { enforceRateLimit, applySecurityHeaders } from './_security.js';

/**
 * NEXCHAT /api/ai - Serverless AI Gateway for ChronEX AI
 * 
 * Supports:
 * - Environment variables on Vercel:
 *   - GEMINI_API_KEY_1
 *   - GEMINI_API_KEY_2
 *   - GEMINI_API_KEYS (comma separated)
 *   - GEMINI_API_KEY
 * - Embedded fallback Pro keys for zero-configuration uptime
 * - Smart multi-model rotation: gemini-3.5-flash -> gemini-3.6-flash -> gemini-3.1-flash-lite
 */

const FALLBACK_PRO_KEYS = [
  // User Pro Key 1
  Buffer.from('QVEuQWI4Uk42TFEzbEZpNmszcGUxNkxWcmhPVTVjLXMwQlhnNHczUG4tWUdPdHRxWngxSmc=', 'base64').toString('utf8'),
  // User Pro Key 2
  Buffer.from('QVEuQWI4Uk42SjBsZ0FiMkVCTUMwQ3JDU2d1YlNDQjByOWY2dVVsdUdMaHo5b2E2aE15UXc=', 'base64').toString('utf8'),
];

function getApiKeys() {
  const keys = [];

  if (process.env.GEMINI_API_KEY_1) keys.push(process.env.GEMINI_API_KEY_1.trim());
  if (process.env.GEMINI_API_KEY_2) keys.push(process.env.GEMINI_API_KEY_2.trim());

  if (process.env.GEMINI_API_KEYS) {
    process.env.GEMINI_API_KEYS.split(',').forEach(k => {
      const trimmed = k.trim();
      if (trimmed && !keys.includes(trimmed)) keys.push(trimmed);
    });
  }

  if (process.env.GEMINI_API_KEY && !keys.includes(process.env.GEMINI_API_KEY.trim())) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }

  // Append fallback pro keys if not present
  FALLBACK_PRO_KEYS.forEach(k => {
    if (!keys.includes(k)) keys.push(k);
  });

  return keys;
}

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest'
];

const SYSTEM_INSTRUCTION = `You are CHRONEX AI, the advanced neural AI assistant created by NEXCHAT.
You are an expert full-stack engineer, mathematician, systems architect, and cybersecurity analyst.
Core instructions:
- Provide clean, modern code with clear explanations.
- Keep responses friendly, sharp, concise, and structured in clean Markdown.
- Solve math, algorithmic, and logic queries step-by-step.
- Uphold safe, ethical computing standards.`;

export default async function handler(req, res) {
  applySecurityHeaders(res);

  if (!enforceRateLimit(req, res)) {
    return;
  }

  if (req.method === 'GET') {
    const keys = getApiKeys();
    return res.status(200).json({
      status: 'online',
      service: 'CHRONEX AI Serverless Gateway',
      version: '2.5.0-pro',
      availableKeysCount: keys.length,
      primaryModel: CANDIDATE_MODELS[0],
      supportedModels: CANDIDATE_MODELS
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [] } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const keys = getApiKeys();
  if (keys.length === 0) {
    return res.status(503).json({ error: 'No active AI API keys configured.' });
  }

  // Prepare Gemini payload
  const contents = [];
  const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
  for (const item of recentHistory) {
    const role = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';
    if (item.content) {
      contents.push({
        role,
        parts: [{ text: String(item.content) }]
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: String(message) }]
  });

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      topP: 0.95
    }
  };

  // Try keys and models in order
  for (let kIdx = 0; kIdx < keys.length; kIdx++) {
    const key = keys[kIdx];

    for (const model of CANDIDATE_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const geminiResp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (geminiResp.ok) {
          const data = await geminiResp.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            return res.status(200).json({
              success: true,
              response: candidateText,
              model: model,
              keyIndex: kIdx
            });
          }
        }

        const status = geminiResp.status;
        if (status === 429 || status === 503) {
          // Rate limit / capacity: try next key
          break;
        } else if (status === 404) {
          // Model variant unavailable for this key: try next model
          continue;
        } else {
          break;
        }
      } catch (networkErr) {
        // Move to next key on network error
        break;
      }
    }
  }

  return res.status(502).json({
    error: 'All AI models and keys temporarily at capacity. Please retry shortly.'
  });
}
