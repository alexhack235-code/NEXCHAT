import { getNextKey, markKeyDead, markKeyHealthy, callGroqAI, callGeminiAI } from '../lib/translator.js';
import { enforceRateLimit, applySecurityHeaders, handleCors } from './_security.js';

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

  if (!enforceRateLimit(req, res, 40)) {
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
    const active = getNextKey();

    try {
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
      markKeyDead(active.key, err.status || 500, err.message);
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
