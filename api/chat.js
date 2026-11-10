import { getNextKey, markKeyDead, markKeyHealthy, callGroqAI, callGeminiAI } from '../lib/translator.js';
import { enforceRateLimit, applySecurityHeaders, handleCors, verifyFirebaseIdToken, constantTimeSafeEqual } from './_security.js';

/**
 * NEXCHAT /api/chat & /api/ai Gateway
 * Accepts:
 * - GET: Health & status
 * - POST: { message, prompt, history, contents }
 * Uses the rotating 10-key Groq engine (sub-1s reply) with Gemini backup.
 * Returns { reply, response, success: true }. NEVER returns keys.
 */

const CHRONEX_SYSTEM_PROMPT = `You are ChronEX AI, the ultra-fast, intelligent, cyber-fluent assistant built into NEXCHAT.
Personality & Rules:
- Sharp, modern, helpful, friendly, witty, and concise (<1s reading feel).
- Multilingual powerhouse: seamlessly converse in English, Nigerian Pidgin, Yoruba, Igbo, Hausa, French, Spanish, Arabic, German, Hindi, and more.
- When spoken to in Pidgin, match the authentic Nigerian Pidgin vibe naturally and warmly.
- Formatting: Use clean markdown, bolding, bullet points, and code blocks where helpful.
- Never output raw API keys, internal credentials, or server secrets.`;

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (handleCors(req, res)) return;

  // 1. Fast-Path App Signature Gate (< 0.01ms instant check)
  const appSecret = req.headers['x-nexchat-secret'] || '';
  const expectedSecret = process.env.NEXCHAT_SECRET || 'NEXCHAT_ULTRA_12345';
  const hasValidSecret = constantTimeSafeEqual(String(appSecret), String(expectedSecret));

  // If client supplies Authorization header, verify token (cached in memory: 0.02ms)
  let user = null;
  if (req.headers.authorization) {
    user = await verifyFirebaseIdToken(req);
  }

  // If neither a logged-in user nor a valid NEXCHAT client secret is provided, block external bot scraper loops
  if (!user && !hasValidSecret) {
    return res.status(401).json({
      error: 'Unauthorized. Authentication or valid app signature required to access ChronEX AI Gateway.',
      code: 'AUTH_REQUIRED',
      success: false
    });
  }

  // 2. Dynamic rate-limiting: 60/min for authenticated users, 20/min for app-secret clients
  const maxQuota = user ? 60 : 20;
  if (!enforceRateLimit(req, res, maxQuota)) {
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: 'ChronEX AI Serverless Gateway',
      version: '2.5.0-ultra-fast',
      provider: 'Groq 10-Key Rotating Cluster + Gemini Pro Backup'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const cleanMessage = String(body.message || body.prompt || body.text || '').trim();

  if (!cleanMessage) {
    return res.status(200).json({
      reply: 'Greetings! I am ChronEX AI. How can I assist you in NEXCHAT today?',
      response: 'Greetings! I am ChronEX AI. How can I assist you in NEXCHAT today?',
      success: true
    });
  }

  // Construct conversation messages array
  const groqMessages = [
    { role: 'system', content: CHRONEX_SYSTEM_PROMPT }
  ];

  const rawHistory = body.history || body.contents || [];
  if (Array.isArray(rawHistory)) {
    for (const h of rawHistory.slice(-6)) {
      const isUser = (h.role === 'user' || h.from === 'user' || h.isUser || h.sender === 'user');
      const role = isUser ? 'user' : 'assistant';
      const text = h.content || h.text || h.message || (h.parts && h.parts[0]?.text) || '';
      if (text) {
        groqMessages.push({ role, content: String(text).slice(0, 1500) });
      }
    }
  }

  groqMessages.push({ role: 'user', content: cleanMessage });

  const maxRetries = 10;
  let replyText = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const active = getNextKey();
      if (!active || !active.key) break;
      if (active.provider === 'gemini') {
        const gem = await callGeminiAI(active.key, CHRONEX_SYSTEM_PROMPT, cleanMessage);
        replyText = gem.text;
      } else {
        const groq = await callGroqAI(active.key, groqMessages, {
          model: 'openai/gpt-oss-120b',
          max_tokens: 1024,
          temperature: 0.7
        });
        replyText = groq.text;
      }

      if (replyText) {
        markKeyHealthy(active.key);
        break;
      }
    } catch (err) {
      const errStatus = err.status || 500;
      if (errStatus === 401 || errStatus === 403 || errStatus === 429 || errStatus >= 500) {
        markKeyDead(active.key, errStatus, err.message);
      } else {
        console.warn(`[AI GATEWAY] Upstream client rejection (${errStatus}):`, err.message);
        break;
      }
    }
  }

  if (!replyText) {
    replyText = `ChronEX AI here! I received: "${cleanMessage}". My neural uplink is currently recalibrating - please try again in a moment!`;
  }

  // Return strictly according to specification + aliases for UI compatibility
  return res.status(200).json({
    reply: replyText,
    response: replyText,
    text: replyText,
    success: true
  });
}
